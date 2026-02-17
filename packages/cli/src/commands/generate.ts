/**
 * Generate command action
 *
 * Generates a project from a UPG manifest template.
 * Uses Nunjucks (Jinja2-compatible) for template rendering.
 * This is a REAL implementation that writes actual files.
 */

import { resolve, dirname, join, relative, extname } from 'path';
import { spawn } from 'child_process';
import pc from 'picocolors';
import ora from 'ora';
import nunjucks from 'nunjucks';
import { validateCommand, transpileManifestToSchema } from '@wcnegentropy/core';
import { parseYaml, BINARY_EXTENSIONS } from '@wcnegentropy/shared';
import type { UpgManifest } from '@wcnegentropy/shared';
import { readFile, writeFile, readdir, mkdir, copyFile, access } from 'fs/promises';

interface GenerateOptions {
  dest?: string;
  data?: string;
  useDefaults?: boolean;
  dryRun?: boolean;
  force?: boolean;
  json?: boolean;
}

interface UPGManifest {
  apiVersion: string;
  metadata: {
    name: string;
    version?: string;
    title?: string;
    description?: string;
    tags?: string[];
    author?: string;
    license?: string;
  };
  template?: {
    markers?: string[];
    smart_update?: {
      enabled?: boolean;
      preserve_files?: string[];
    };
  };
  prompts: Array<{
    id: string;
    type: string;
    title?: string;
    message?: string;
    default?: unknown;
    required?: boolean;
    when?: string;
    choices?: Array<{ label: string; value: string }>;
    hidden?: boolean;
  }>;
  actions?: Array<{
    type: string;
    src?: string;
    dest?: string;
    path?: string;
    command?: string;
    when?: string;
    variables?: Record<string, string>;
    on_error?: string;
    description?: string;
  }>;
}

/**
 * Configure Nunjucks environment with custom filters
 */
function configureNunjucks(templateDir: string): nunjucks.Environment {
  const env = new nunjucks.Environment(new nunjucks.FileSystemLoader(templateDir), {
    autoescape: false,
    trimBlocks: true,
    lstripBlocks: true,
  });

  // Add custom filters matching Jinja2
  env.addFilter('replace', (str: string, old: string, newVal: string) => {
    if (typeof str !== 'string') return str;
    return str.replaceAll(old, newVal);
  });

  env.addFilter('slug', (str: string) => {
    if (typeof str !== 'string') return str;
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  });

  env.addFilter('snake', (str: string) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  });

  env.addFilter('camel', (str: string) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
      .replace(/^./, c => c.toLowerCase());
  });

  env.addFilter('pascal', (str: string) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
      .replace(/^./, c => c.toUpperCase());
  });

  return env;
}

/**
 * Evaluate a "when" condition
 */
function evaluateCondition(
  condition: string | undefined,
  context: Record<string, unknown>
): boolean {
  if (!condition) return true;

  // Handle simple cases
  if (condition === 'true') return true;
  if (condition === 'false') return false;

  // Handle "not <variable>"
  if (condition.startsWith('not ')) {
    const varName = condition.slice(4).trim();
    return !context[varName];
  }

  // Handle simple variable reference
  if (context[condition] !== undefined) {
    return Boolean(context[condition]);
  }

  // Try to evaluate as simple expression
  try {
    // Create a simple evaluator for basic conditions
    const keys = Object.keys(context);
    const values = Object.values(context);
    const fn = new Function(...keys, `return ${condition}`);
    return Boolean(fn(...values));
  } catch {
    // If evaluation fails, default to true
    return true;
  }
}

/**
 * Recursively walk a directory and yield file paths
 */
async function* walkDirectory(dir: string): AsyncGenerator<string> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkDirectory(fullPath);
    } else {
      yield fullPath;
    }
  }
}

/**
 * Check if a path matches any of the skip patterns
 */
function shouldSkipPath(
  relativePath: string,
  skipPatterns: Array<{ path: string; when: string }>,
  context: Record<string, unknown>
): boolean {
  for (const pattern of skipPatterns) {
    // Simple glob matching
    const patternPath = pattern.path.replace('**/', '').replace('/**', '');
    if (relativePath.startsWith(patternPath) || relativePath.includes(patternPath)) {
      if (evaluateCondition(pattern.when, context)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Execute the generate command
 */
export async function generateAction(
  template: string | undefined,
  options: GenerateOptions
): Promise<void> {
  const isJson = options.json ?? false;
  const spinner = isJson ? null : ora();

  try {
    // If no template specified, look for upg.yaml in current directory
    const templatePath = template || '.';

    if (spinner) spinner.start('Validating manifest...');

    // Validate the manifest
    const validationResult = await validateCommand({
      path: templatePath,
      format: 'text',
      warnings: true,
      verbose: false,
    });

    if (!validationResult.success) {
      if (spinner) spinner.fail('Manifest validation failed');
      if (isJson) {
        console.log(JSON.stringify({ success: false, error: 'Manifest validation failed' }));
      } else {
        console.log(validationResult.output);
      }
      process.exit(1);
    }

    if (spinner) spinner.succeed('Manifest validated');

    // Read and parse manifest
    const manifestContent = await readFile(validationResult.filePath, 'utf-8');
    const manifest = parseYaml(manifestContent) as UPGManifest;

    if (spinner) spinner.start('Processing template configuration...');

    // Transpile to JSON Schema to get default values
    const transpiled = transpileManifestToSchema(manifest as UpgManifest, {
      includeUiSchema: true,
      includeConditionals: true,
    });

    if (spinner) spinner.succeed('Template configuration processed');

    // Parse user data if provided
    let userData: Record<string, unknown> = {};
    if (options.data) {
      try {
        userData = JSON.parse(options.data);
      } catch (parseErr) {
        const detail = parseErr instanceof SyntaxError ? parseErr.message : 'malformed JSON';
        console.error(pc.red(`Error: Invalid JSON data — ${detail}`));
        console.error(pc.dim(`→ Expected format: --data '{"key":"value"}'`));
        process.exit(1);
      }
    }

    // Merge defaults with user data
    const context: Record<string, unknown> = { ...transpiled.formData, ...userData };

    // Add environment variables to context
    context.env = process.env;

    // Determine destination
    const dest = options.dest || (context.project_name as string) || 'generated-project';
    const destPath = resolve(dest);

    // Get the template directory
    const manifestDir = dirname(resolve(validationResult.filePath));
    const templateDir = join(manifestDir, 'template');

    // Check if template directory exists
    try {
      await access(templateDir);
    } catch {
      if (spinner) spinner.fail('Template directory not found');
      if (isJson) {
        console.log(
          JSON.stringify({
            success: false,
            error: `Template directory not found: ${templateDir}`,
          })
        );
      } else {
        console.error(pc.red(`Error: Template directory not found: ${templateDir}`));
        console.error(pc.dim('UPG templates require a "template/" subdirectory.'));
      }
      process.exit(1);
    }

    // Handle dry run
    if (options.dryRun) {
      console.log('');
      console.log(pc.cyan('Dry run mode - showing what would be generated'));
      console.log('');
      console.log(pc.bold('Template:'), manifestDir);
      console.log(pc.bold('Destination:'), destPath);
      console.log('');
      console.log(pc.bold('Variables:'));
      const logContext = { ...context };
      delete logContext.env;
      console.log(JSON.stringify(logContext, null, 2));
      console.log('');
      console.log(pc.bold('Files that would be generated:'));

      for await (const filePath of walkDirectory(templateDir)) {
        const relativePath = relative(templateDir, filePath);
        let outputName = relativePath;
        if (outputName.endsWith('.jinja')) {
          outputName = outputName.slice(0, -6);
        }
        console.log(pc.dim(`  ${outputName}`));
      }
      return;
    }

    // Check if destination exists
    let destExists = false;
    try {
      await access(destPath);
      destExists = true;
    } catch {
      destExists = false;
    }

    if (destExists && !options.force) {
      if (isJson) {
        console.log(
          JSON.stringify({
            success: false,
            error: `Destination already exists: ${destPath}. Use --force to overwrite.`,
          })
        );
      } else {
        console.log('');
        console.log(pc.red(`Error: Destination already exists: ${destPath}`));
        console.log(pc.dim('Use --force to overwrite existing files.'));
      }
      process.exit(1);
    }

    // Configure Nunjucks
    const nunjucksEnv = configureNunjucks(templateDir);

    // Build skip patterns from actions
    const skipPatterns: Array<{ path: string; when: string }> = [];
    if (manifest.actions) {
      for (const action of manifest.actions) {
        if (action.type === 'skip' && action.path && action.when) {
          skipPatterns.push({ path: action.path, when: action.when });
        }
      }
    }

    // Generate files
    if (spinner) spinner.start('Generating project files...');

    const filesGenerated: string[] = [];
    let fileCount = 0;

    for await (const filePath of walkDirectory(templateDir)) {
      const relativePath = relative(templateDir, filePath);

      // Check if file should be skipped
      if (shouldSkipPath(relativePath, skipPatterns, context)) {
        continue;
      }

      // Determine output path (remove .jinja extension)
      let outputRelPath = relativePath;
      const isTemplate = relativePath.endsWith('.jinja');
      if (isTemplate) {
        outputRelPath = relativePath.slice(0, -6);
      }

      const outputPath = join(destPath, outputRelPath);
      const outputDir = dirname(outputPath);

      // Create output directory
      await mkdir(outputDir, { recursive: true });

      if (isTemplate) {
        // Render template
        try {
          const templateContent = await readFile(filePath, 'utf-8');
          const rendered = nunjucksEnv.renderString(templateContent, context);
          await writeFile(outputPath, rendered, 'utf-8');
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          if (spinner) spinner.warn(`Warning: Failed to render ${relativePath}: ${errorMsg}`);
          continue;
        }
      } else if (
        (BINARY_EXTENSIONS as readonly string[]).includes(extname(relativePath).toLowerCase())
      ) {
        // Copy binary file as-is
        await copyFile(filePath, outputPath);
      } else {
        // Render non-.jinja text file through Nunjucks (variables may be present)
        try {
          const textContent = await readFile(filePath, 'utf-8');
          const rendered = nunjucksEnv.renderString(textContent, context);
          await writeFile(outputPath, rendered, 'utf-8');
        } catch {
          // If rendering fails, fall back to copying as-is
          await copyFile(filePath, outputPath);
        }
      }

      filesGenerated.push(outputRelPath);
      fileCount++;

      if (fileCount % 5 === 0 && spinner) {
        spinner.text = `Generating project files... (${fileCount} files)`;
      }
    }

    if (spinner) spinner.succeed(`Generated ${filesGenerated.length} files`);

    // Execute post-generation commands
    if (manifest.actions) {
      for (const action of manifest.actions) {
        if (action.type === 'command' && action.command) {
          if (!evaluateCondition(action.when, context)) {
            continue;
          }

          const desc = action.description || action.command;
          if (spinner) spinner.start(desc);

          try {
            await new Promise<void>((resolve, reject) => {
              const [cmd, ...args] = action.command!.split(' ');
              const proc = spawn(cmd, args, {
                cwd: destPath,
                shell: true,
                stdio: 'pipe',
              });

              proc.on('close', code => {
                if (code === 0) {
                  resolve();
                } else if (action.on_error === 'warn') {
                  if (spinner) spinner.warn(`${desc} (exit code ${code})`);
                  resolve();
                } else {
                  reject(new Error(`Command failed with exit code ${code}`));
                }
              });

              proc.on('error', reject);
            });

            if (spinner) spinner.succeed(desc);
          } catch (err) {
            if (action.on_error === 'warn') {
              if (spinner) spinner.warn(`${desc} (failed)`);
            } else {
              throw err;
            }
          }
        }
      }
    }

    // Success message
    if (isJson) {
      console.log(
        JSON.stringify({
          success: true,
          output_path: destPath,
          files_generated: filesGenerated,
        })
      );
      return;
    }

    console.log('');
    console.log(pc.green(`✓ Project generated successfully!`));
    console.log('');
    console.log(pc.bold('Output:'), destPath);
    console.log(pc.bold('Files:'), filesGenerated.length);
    console.log('');
    console.log('Next steps:');
    console.log(pc.cyan(`  cd ${dest}`));

    // Show template-specific instructions if available
    const lang = (manifest.metadata as Record<string, unknown>).language as string | undefined;
    const tags = manifest.metadata.tags || [];
    if (manifest.metadata.name === 'react-starter' || tags.includes('react')) {
      console.log(pc.cyan('  npm install'));
      console.log(pc.cyan('  npm run dev'));
    } else if (lang === 'python' || tags.includes('python')) {
      console.log(pc.cyan('  pip install -r requirements.txt'));
    } else if (lang === 'rust' || tags.includes('rust')) {
      console.log(pc.cyan('  cargo build'));
    } else if (lang === 'go' || tags.includes('go')) {
      console.log(pc.cyan('  go mod tidy'));
      console.log(pc.cyan('  go run .'));
    } else {
      console.log(pc.dim('  (install dependencies and start your project)'));
    }
  } catch (error) {
    if (spinner) spinner.fail('Generation failed');
    const msg = (error as Error).message;
    if (isJson) {
      console.log(JSON.stringify({ success: false, error: msg }));
      process.exit(1);
    }
    console.error(pc.red(`Error: ${msg}`));
    if (msg.includes('ENOENT') || msg.includes('no such file')) {
      console.error(pc.dim('→ Check that the manifest or template path is correct.'));
    } else if (msg.includes('Template') || msg.includes('template')) {
      console.error(pc.dim('→ Ensure a "template/" directory exists alongside your manifest.'));
    } else {
      console.error(pc.dim('→ Run "upg validate <manifest>" to check your manifest for issues.'));
    }
    process.exit(1);
  }
}
