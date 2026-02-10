/**
 * Docs Generator CLI command implementation
 *
 * Usage: upg docs <manifest>
 *
 * Generates documentation for a template based on its manifest.
 */

import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { validateManifest } from '../schema/validator.js';
import type { UpgManifest, ManifestPrompt, PromptChoice } from '@wcnegentropy/shared';

/**
 * Docs generation options
 */
export interface DocsGenOptions {
  /** Path to manifest file */
  manifestPath: string;
  /** Output format */
  format?: 'markdown' | 'json';
  /** Include example values */
  includeExamples?: boolean;
}

/**
 * Docs generation result
 */
export interface DocsGenResult {
  /** Whether generation succeeded */
  success: boolean;
  /** Generated documentation */
  content: string;
  /** Error message if failed */
  error?: string;
}

/**
 * Format prompt type for display
 */
function formatPromptType(type: ManifestPrompt['type']): string {
  switch (type) {
    case 'string':
      return 'Text';
    case 'int':
      return 'Integer';
    case 'float':
      return 'Number';
    case 'boolean':
      return 'Yes/No';
    case 'select':
      return 'Single Choice';
    case 'multiselect':
      return 'Multiple Choice';
    case 'secret':
      return 'Password';
    default:
      return type;
  }
}

/**
 * Format choices for display
 */
function formatChoices(choices: string[] | PromptChoice[] | undefined): string {
  if (!choices || choices.length === 0) return '';

  if (typeof choices[0] === 'string') {
    return (choices as string[]).map(c => `\`${c}\``).join(', ');
  }

  return (choices as PromptChoice[]).map(c => `\`${c.value}\` (${c.label})`).join(', ');
}

/**
 * Generate markdown documentation
 */
function generateMarkdown(manifest: UpgManifest, includeExamples: boolean): string {
  const lines: string[] = [];

  // Header
  lines.push(`# ${manifest.metadata.title || manifest.metadata.name}`);
  lines.push('');
  lines.push(manifest.metadata.description);
  lines.push('');

  // Metadata
  lines.push('## Metadata');
  lines.push('');
  lines.push(`| Property | Value |`);
  lines.push(`|----------|-------|`);
  lines.push(`| Name | \`${manifest.metadata.name}\` |`);
  lines.push(`| Version | \`${manifest.metadata.version}\` |`);
  if (manifest.metadata.author) {
    lines.push(`| Author | ${manifest.metadata.author} |`);
  }
  if (manifest.metadata.license) {
    lines.push(`| License | ${manifest.metadata.license} |`);
  }
  if (manifest.metadata.lifecycle) {
    lines.push(`| Lifecycle | ${manifest.metadata.lifecycle} |`);
  }
  if (manifest.metadata.tags && manifest.metadata.tags.length > 0) {
    lines.push(`| Tags | ${manifest.metadata.tags.map(t => `\`${t}\``).join(', ')} |`);
  }
  lines.push('');

  // Configuration Options (Prompts)
  lines.push('## Configuration Options');
  lines.push('');

  // Filter out hidden prompts
  const visiblePrompts = manifest.prompts.filter(p => !p.hidden);

  for (const prompt of visiblePrompts) {
    lines.push(`### ${prompt.title || prompt.id}`);
    lines.push('');
    lines.push(`**Type:** ${formatPromptType(prompt.type)}`);
    if (prompt.required) {
      lines.push('  ');
      lines.push('**Required:** Yes');
    }
    lines.push('');
    lines.push(prompt.message);
    lines.push('');

    if (prompt.help) {
      lines.push(`> ${prompt.help}`);
      lines.push('');
    }

    if (prompt.default !== undefined) {
      lines.push(`**Default:** \`${JSON.stringify(prompt.default)}\``);
      lines.push('');
    }

    if ((prompt.type === 'select' || prompt.type === 'multiselect') && prompt.choices) {
      lines.push(`**Choices:** ${formatChoices(prompt.choices)}`);
      lines.push('');
    }

    if (prompt.validator) {
      lines.push(`**Validation:** Must match pattern \`${prompt.validator}\``);
      lines.push('');
    }

    if (prompt.when) {
      lines.push(`**Conditional:** Only shown when \`${prompt.when}\``);
      lines.push('');
    }
  }

  // Quick Start
  if (manifest.documentation?.quickstart) {
    lines.push('## Quick Start');
    lines.push('');
    lines.push(manifest.documentation.quickstart);
    lines.push('');
  }

  // Example usage
  if (includeExamples) {
    lines.push('## Example Usage');
    lines.push('');
    lines.push('```bash');
    lines.push(`upg generate ${manifest.metadata.name}`);
    lines.push('```');
    lines.push('');
  }

  // FAQ
  if (manifest.documentation?.faq && manifest.documentation.faq.length > 0) {
    lines.push('## FAQ');
    lines.push('');
    for (const faq of manifest.documentation.faq) {
      lines.push(`### ${faq.question}`);
      lines.push('');
      lines.push(faq.answer);
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Generate JSON documentation
 */
function generateJson(manifest: UpgManifest): string {
  const doc = {
    name: manifest.metadata.name,
    version: manifest.metadata.version,
    title: manifest.metadata.title,
    description: manifest.metadata.description,
    author: manifest.metadata.author,
    license: manifest.metadata.license,
    lifecycle: manifest.metadata.lifecycle,
    tags: manifest.metadata.tags,
    prompts: manifest.prompts
      .filter(p => !p.hidden)
      .map(p => ({
        id: p.id,
        title: p.title,
        type: p.type,
        message: p.message,
        help: p.help,
        required: p.required,
        default: p.default,
        choices: p.choices,
        conditional: p.when,
      })),
  };

  return JSON.stringify(doc, null, 2);
}

/**
 * Execute the docs-gen command
 */
export async function docsGenCommand(options: DocsGenOptions): Promise<DocsGenResult> {
  const { manifestPath, format = 'markdown', includeExamples = true } = options;

  // Read manifest file
  const filePath = resolve(manifestPath);
  let content: string;
  try {
    content = await readFile(filePath, 'utf-8');
  } catch (error) {
    return {
      success: false,
      content: '',
      error: `Failed to read manifest: ${(error as Error).message}`,
    };
  }

  // Validate manifest
  const validationResult = validateManifest(content, {
    allErrors: true,
    includeWarnings: false,
  });

  if (!validationResult.valid || !validationResult.manifest) {
    return {
      success: false,
      content: '',
      error: `Invalid manifest: ${validationResult.errors.map(e => e.message).join(', ')}`,
    };
  }

  // Generate documentation
  const docContent =
    format === 'json'
      ? generateJson(validationResult.manifest)
      : generateMarkdown(validationResult.manifest, includeExamples);

  return {
    success: true,
    content: docContent,
  };
}
