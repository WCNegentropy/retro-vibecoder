/**
 * Template Renderer
 *
 * Provides Nunjucks-based template rendering for procedural generation.
 * Templates are loaded from the templates/procedural/ directory and rendered
 * with the project context (stack, projectName, etc.)
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Template context provided to Nunjucks templates
 */
export interface TemplateContext {
  projectName: string;
  isTypeScript: boolean;
  database: string;
  orm: string;
  framework: string;
  archetype: string;
  language: string;
  runtime: string;
  transport: string;
  packaging: string;
  cicd: string;
  [key: string]: unknown;
}

/**
 * Resolve the templates/procedural directory from the package location.
 * Walks up from the procedural package to find the monorepo root.
 */
function resolveTemplatesDir(): string {
  // Try to resolve from known locations
  const candidates: string[] = [];

  // From CJS __dirname equivalent
  try {
    const currentFile = fileURLToPath(import.meta.url);
    const currentDir = dirname(currentFile);
    // From packages/procedural/src/renderer -> ../../../../templates/procedural
    candidates.push(resolve(currentDir, '..', '..', '..', '..', 'templates', 'procedural'));
    // From packages/procedural/dist/renderer -> ../../../../templates/procedural
    candidates.push(resolve(currentDir, '..', '..', '..', '..', 'templates', 'procedural'));
  } catch {
    // ESM resolution failed, try CWD-based paths
  }

  // From CWD (monorepo root)
  candidates.push(resolve(process.cwd(), 'templates', 'procedural'));

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    'Could not find templates/procedural directory. Checked: ' +
      candidates.join(', ') +
      '. ' +
      'Ensure you are running from the monorepo root or the templates are installed.'
  );
}

/**
 * Simple Nunjucks-like template renderer.
 *
 * Supports:
 * - {{ variable }} - variable substitution
 * - {{ variable | filter }} - filter application (replace)
 * - {% if condition %} ... {% elif %} ... {% else %} ... {% endif %} - conditionals
 *
 * This is a lightweight renderer that avoids a runtime dependency on nunjucks
 * in the procedural package. For full Nunjucks support, the CLI's generate
 * command uses the nunjucks package directly.
 */
function renderTemplate(template: string, context: TemplateContext): string {
  let result = template;

  // Process {% if %} / {% elif %} / {% else %} / {% endif %} blocks
  result = processConditionals(result, context);

  // Process {{ variable }} substitutions
  result = result.replace(/\{\{\s*(.+?)\s*\}\}/g, (_match, expr: string) => {
    return evaluateExpression(expr.trim(), context);
  });

  return result;
}

/**
 * Process conditional blocks in a template
 */
function processConditionals(template: string, context: TemplateContext): string {
  // Match outermost {% if %} ... {% endif %} blocks
  // Handles whitespace control: {%- trims leading whitespace, -%} trims trailing whitespace
  const ifPattern =
    /[ \t]*\{%-?\s*if\s+(.+?)\s*-?%\}[ \t]*\n?([\s\S]*?)[ \t]*\{%-?\s*endif\s*-?%\}[ \t]*\n?/g;

  let result = template;
  let lastResult = '';

  // Iterate until no more changes (handles nested ifs)
  while (result !== lastResult) {
    lastResult = result;
    result = result.replace(ifPattern, (_match, condition: string, body: string) => {
      // Split on elif/else
      const parts = splitConditionalBody(body);
      const conditionValue = evaluateCondition(condition.trim(), context);

      if (conditionValue) {
        return processConditionals(parts.ifBody, context);
      }

      // Check elif conditions
      for (const elifPart of parts.elifParts) {
        if (evaluateCondition(elifPart.condition, context)) {
          return processConditionals(elifPart.body, context);
        }
      }

      // Fall through to else
      if (parts.elseBody !== undefined) {
        return processConditionals(parts.elseBody, context);
      }

      return '';
    });
  }

  return result;
}

/**
 * Split conditional body into if/elif/else parts
 */
function splitConditionalBody(body: string): {
  ifBody: string;
  elifParts: Array<{ condition: string; body: string }>;
  elseBody?: string;
} {
  const elifParts: Array<{ condition: string; body: string }> = [];
  let elseBody: string | undefined;

  // Find elif and else markers
  const elifPattern = /[ \t]*\{%-?\s*elif\s+(.+?)\s*-?%\}[ \t]*\n?/g;
  const elsePattern = /[ \t]*\{%-?\s*else\s*-?%\}[ \t]*\n?/g;

  const markers: Array<{ type: 'elif' | 'else'; index: number; end: number; condition?: string }> =
    [];

  let match;
  while ((match = elifPattern.exec(body)) !== null) {
    markers.push({
      type: 'elif',
      index: match.index,
      end: match.index + match[0].length,
      condition: match[1].trim(),
    });
  }
  while ((match = elsePattern.exec(body)) !== null) {
    markers.push({ type: 'else', index: match.index, end: match.index + match[0].length });
  }

  // Sort by position
  markers.sort((a, b) => a.index - b.index);

  if (markers.length === 0) {
    return { ifBody: body, elifParts };
  }

  const ifBody = body.slice(0, markers[0].index);

  for (let i = 0; i < markers.length; i++) {
    const marker = markers[i];
    const nextIndex = i + 1 < markers.length ? markers[i + 1].index : body.length;
    const partBody = body.slice(marker.end, nextIndex);

    if (marker.type === 'elif' && marker.condition) {
      elifParts.push({ condition: marker.condition, body: partBody });
    } else if (marker.type === 'else') {
      elseBody = partBody;
    }
  }

  return { ifBody, elifParts, elseBody };
}

/**
 * Evaluate a condition expression against the context
 */
function evaluateCondition(condition: string, context: TemplateContext): boolean {
  // Handle "not" prefix
  if (condition.startsWith('not ')) {
    return !evaluateCondition(condition.slice(4).trim(), context);
  }

  // Handle equality: variable == 'value'
  const eqMatch = condition.match(/^(\w+)\s*==\s*['"](.+?)['"]$/);
  if (eqMatch) {
    return String(context[eqMatch[1]]) === eqMatch[2];
  }

  // Handle inequality: variable != 'value'
  const neqMatch = condition.match(/^(\w+)\s*!=\s*['"](.+?)['"]$/);
  if (neqMatch) {
    return String(context[neqMatch[1]]) !== neqMatch[2];
  }

  // Handle simple boolean variable
  const value = context[condition];
  return Boolean(value);
}

/**
 * Evaluate a variable expression like "projectName" or "projectName | replace('-', '_')"
 */
function evaluateExpression(expr: string, context: TemplateContext): string {
  // Handle filter pipe: variable | filter(args)
  const pipeIndex = expr.indexOf('|');
  if (pipeIndex >= 0) {
    const varPart = expr.slice(0, pipeIndex).trim();
    const filterPart = expr.slice(pipeIndex + 1).trim();
    const value = String(getContextValue(varPart, context) ?? '');
    return applyFilter(value, filterPart);
  }

  const value = getContextValue(expr, context);
  return value !== undefined && value !== null ? String(value) : '';
}

/**
 * Get a value from context, supporting dot notation
 */
function getContextValue(key: string, context: TemplateContext): unknown {
  const parts = key.split('.');
  let value: unknown = context;
  for (const part of parts) {
    if (value === null || value === undefined) return undefined;
    value = (value as Record<string, unknown>)[part];
  }
  return value;
}

/**
 * Apply a filter to a value
 */
function applyFilter(value: string, filterExpr: string): string {
  // Handle replace('old', 'new')
  const replaceMatch = filterExpr.match(/^replace\(\s*['"](.+?)['"]\s*,\s*['"](.+?)['"]\s*\)$/);
  if (replaceMatch) {
    return value.replaceAll(replaceMatch[1], replaceMatch[2]);
  }

  // Handle slug
  if (filterExpr === 'slug') {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // Handle snake
  if (filterExpr === 'snake') {
    return value
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  }

  return value;
}

/**
 * Recursively walk a directory and yield file paths
 */
function walkDirectory(dir: string): string[] {
  const files: string[] = [];

  if (!existsSync(dir)) return files;

  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...walkDirectory(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Load and render all templates from a procedural template set.
 *
 * @param templateSetId - The template set directory name (e.g. 'typescript-express')
 * @param context - The template context with project variables
 * @returns A map of output file paths to rendered contents
 */
export function renderTemplateSet(
  templateSetId: string,
  context: TemplateContext
): Record<string, string> {
  const templatesDir = resolveTemplatesDir();
  const templateSetDir = join(templatesDir, templateSetId);

  if (!existsSync(templateSetDir)) {
    // Template set not found - this is OK, the strategy will fall back to inline
    return {};
  }

  const files: Record<string, string> = {};
  const templateFiles = walkDirectory(templateSetDir);

  for (const filePath of templateFiles) {
    const relativePath = relative(templateSetDir, filePath);

    // Remove .jinja extension for output
    let outputPath = relativePath;
    const isTemplate = relativePath.endsWith('.jinja');
    if (isTemplate) {
      outputPath = relativePath.slice(0, -6);
    }

    if (isTemplate) {
      const templateContent = readFileSync(filePath, 'utf-8');
      files[outputPath] = renderTemplate(templateContent, context);
    } else {
      files[outputPath] = readFileSync(filePath, 'utf-8');
    }
  }

  return files;
}

/**
 * Get the template set ID for a given stack combination.
 * Maps (archetype, language, framework) to a template directory name.
 */
export function getTemplateSetId(
  _archetype: string,
  language: string,
  framework: string
): string | null {
  // Map specific combinations to template set directories
  const key = `${language}-${framework}`;

  const templateMap: Record<string, string> = {
    'typescript-express': 'typescript-express',
    'javascript-express': 'typescript-express', // JS uses same templates with isTypeScript=false
    'typescript-fastify': 'typescript-fastify',
    'javascript-fastify': 'typescript-fastify',
    'python-fastapi': 'python-fastapi',
    'rust-axum': 'rust-axum',
    'rust-actix': 'rust-axum', // Shares similar Rust backend project layout
    'rust-clap': 'rust-axum', // Shares similar Rust project layout
  };

  return templateMap[key] ?? null;
}

/**
 * Check if a template set exists for the given stack
 */
export function hasTemplateSet(archetype: string, language: string, framework: string): boolean {
  return getTemplateSetId(archetype, language, framework) !== null;
}
