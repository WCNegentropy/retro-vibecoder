/**
 * Generate command action
 *
 * Note: Full generation requires the sidecar (Phase 2).
 * This is a placeholder that validates and transpiles the manifest.
 */

import { resolve } from 'path';
import pc from 'picocolors';
import ora from 'ora';
import { validateCommand, transpileManifestToSchema } from '@retro-vibecoder/core';
import { parseYaml } from '@retro-vibecoder/shared';
import { readFile } from 'fs/promises';

interface GenerateOptions {
  dest?: string;
  data?: string;
  useDefaults?: boolean;
  dryRun?: boolean;
  force?: boolean;
}

/**
 * Execute the generate command
 */
export async function generateAction(
  template: string | undefined,
  options: GenerateOptions
): Promise<void> {
  const spinner = ora();

  try {
    // If no template specified, look for upg.yaml in current directory
    const templatePath = template || '.';

    spinner.start('Validating manifest...');

    // Validate the manifest
    const validationResult = await validateCommand({
      path: templatePath,
      format: 'text',
      warnings: true,
      verbose: false,
    });

    if (!validationResult.success) {
      spinner.fail('Manifest validation failed');
      console.log(validationResult.output);
      process.exit(1);
    }

    spinner.succeed('Manifest validated');

    // Read and parse manifest for transpilation
    const manifestContent = await readFile(validationResult.filePath, 'utf-8');
    const manifest = parseYaml(manifestContent);

    spinner.start('Transpiling manifest to JSON Schema...');

    // Transpile to JSON Schema
    const transpiled = transpileManifestToSchema(manifest as any, {
      includeUiSchema: true,
      includeConditionals: true,
    });

    spinner.succeed('Manifest transpiled successfully');

    // Handle dry run
    if (options.dryRun) {
      console.log('');
      console.log(pc.cyan('Dry run mode - no files will be generated'));
      console.log('');
      console.log(pc.bold('Generated JSON Schema:'));
      console.log(JSON.stringify(transpiled.schema, null, 2));
      console.log('');
      console.log(pc.bold('Default values:'));
      console.log(JSON.stringify(transpiled.formData, null, 2));
      return;
    }

    // Parse user data if provided
    let userData: Record<string, unknown> = {};
    if (options.data) {
      try {
        userData = JSON.parse(options.data);
      } catch {
        console.error(pc.red('Error: Invalid JSON data'));
        process.exit(1);
      }
    }

    // Merge defaults with user data
    const formData = { ...transpiled.formData, ...userData };

    // Determine destination
    const dest = options.dest || (formData.project_name as string) || 'generated-project';
    const destPath = resolve(dest);

    console.log('');
    console.log(pc.yellow('Note: Full generation requires Phase 2 (Sidecar Engine)'));
    console.log('');
    console.log(pc.bold('Generation would use:'));
    console.log(`  Template: ${validationResult.filePath}`);
    console.log(`  Destination: ${destPath}`);
    console.log(`  Data: ${JSON.stringify(formData, null, 2)}`);
    console.log('');
    console.log(pc.cyan('To complete setup, the Copier sidecar will be invoked (Phase 2).'));

  } catch (error) {
    spinner.fail('Generation failed');
    console.error(pc.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}
