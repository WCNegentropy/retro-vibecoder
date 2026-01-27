/**
 * Generate command action
 *
 * Generates a project from a UPG manifest template using Copier.
 * Validates the manifest, resolves template paths, and executes Copier
 * to create the actual project files.
 */

import { resolve, dirname } from 'path';
import { spawn } from 'child_process';
import pc from 'picocolors';
import ora from 'ora';
import { validateCommand, transpileManifestToSchema } from '@retro-vibecoder/core';
import { parseYaml } from '@retro-vibecoder/shared';
import { readFile, writeFile, rm, access } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

interface GenerateOptions {
  dest?: string;
  data?: string;
  useDefaults?: boolean;
  dryRun?: boolean;
  force?: boolean;
}

/**
 * Check if a command exists in PATH
 */
async function commandExists(command: string): Promise<boolean> {
  return new Promise(resolve => {
    const proc = spawn(command, ['--version'], {
      shell: true,
      stdio: 'ignore',
    });
    proc.on('close', code => resolve(code === 0));
    proc.on('error', () => resolve(false));
  });
}

/**
 * Execute a command and return its output
 */
async function executeCommand(
  command: string,
  args: string[],
  options: {
    cwd?: string;
    inherit?: boolean;
  } = {}
): Promise<{ success: boolean; stdout: string; stderr: string; code: number }> {
  return new Promise(resolve => {
    const proc = spawn(command, args, {
      shell: true,
      cwd: options.cwd,
      stdio: options.inherit ? 'inherit' : 'pipe',
    });

    let stdout = '';
    let stderr = '';

    if (!options.inherit) {
      proc.stdout?.on('data', data => {
        stdout += data.toString();
      });
      proc.stderr?.on('data', data => {
        stderr += data.toString();
      });
    }

    proc.on('close', code => {
      resolve({
        success: code === 0,
        stdout,
        stderr,
        code: code ?? 1,
      });
    });

    proc.on('error', err => {
      resolve({
        success: false,
        stdout,
        stderr: err.message,
        code: 1,
      });
    });
  });
}

/**
 * Detect the available Copier invocation method
 */
async function detectCopierMethod(): Promise<{
  method: 'copier' | 'pipx' | 'uvx' | null;
  command: string[];
}> {
  // Check for direct copier installation
  if (await commandExists('copier')) {
    return { method: 'copier', command: ['copier'] };
  }

  // Check for pipx
  if (await commandExists('pipx')) {
    return { method: 'pipx', command: ['pipx', 'run', 'copier'] };
  }

  // Check for uvx (uv tool run)
  if (await commandExists('uvx')) {
    return { method: 'uvx', command: ['uvx', 'copier'] };
  }

  return { method: null, command: [] };
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

    // Get the template directory (parent of upg.yaml)
    const templateDir = dirname(resolve(validationResult.filePath));

    // Handle dry run - show what would be generated
    if (options.dryRun) {
      console.log('');
      console.log(pc.cyan('Dry run mode - no files will be generated'));
      console.log('');
      console.log(pc.bold('Generation configuration:'));
      console.log(`  Template: ${templateDir}`);
      console.log(`  Destination: ${destPath}`);
      console.log('');
      console.log(pc.bold('Template variables:'));
      console.log(JSON.stringify(formData, null, 2));
      console.log('');
      console.log(pc.bold('Generated JSON Schema:'));
      console.log(JSON.stringify(transpiled.schema, null, 2));
      return;
    }

    // Detect Copier installation method
    spinner.start('Detecting Copier installation...');
    const copierMethod = await detectCopierMethod();

    if (!copierMethod.method) {
      spinner.fail('Copier not found');
      console.log('');
      console.log(pc.red('Error: Copier is not installed or not in PATH.'));
      console.log('');
      console.log('Copier is required to generate projects from UPG manifests.');
      console.log('Please install Copier using one of these methods:');
      console.log('');
      console.log(pc.cyan('  # Using pipx (recommended)'));
      console.log(pc.dim('  pipx install copier'));
      console.log('');
      console.log(pc.cyan('  # Using pip'));
      console.log(pc.dim('  pip install --user copier'));
      console.log('');
      console.log(pc.cyan('  # Using uv'));
      console.log(pc.dim('  uv tool install copier'));
      console.log('');
      console.log('After installation, run this command again.');
      process.exit(1);
    }

    spinner.succeed(`Copier found (via ${copierMethod.method})`);

    // Check if destination already exists
    let destExists = false;
    try {
      await access(destPath);
      destExists = true;
    } catch {
      destExists = false;
    }

    if (destExists && !options.force) {
      console.log('');
      console.log(pc.red(`Error: Destination already exists: ${destPath}`));
      console.log(pc.dim('Use --force to overwrite existing files.'));
      process.exit(1);
    }

    // Create data file for Copier
    const dataFilePath = join(tmpdir(), `upg-data-${Date.now()}.yaml`);
    const yamlContent = Object.entries(formData)
      .map(([key, value]) => {
        if (typeof value === 'string') {
          return `${key}: "${value}"`;
        }
        return `${key}: ${JSON.stringify(value)}`;
      })
      .join('\n');

    await writeFile(dataFilePath, yamlContent, 'utf-8');

    // Build Copier command arguments
    const copierArgs = [
      ...copierMethod.command.slice(1), // Skip the first element (copier/pipx/uvx)
      'copy',
      templateDir,
      destPath,
      '--trust', // Allow running template hooks
      '--data-file',
      dataFilePath,
    ];

    if (options.useDefaults) {
      copierArgs.push('--defaults');
    }

    if (options.force) {
      copierArgs.push('--force');
    }

    // Execute Copier
    console.log('');
    console.log(pc.bold('Generating project...'));
    console.log(pc.dim(`  Template: ${templateDir}`));
    console.log(pc.dim(`  Destination: ${destPath}`));
    console.log('');

    spinner.start('Running Copier...');

    const result = await executeCommand(copierMethod.command[0], copierArgs, {
      cwd: process.cwd(),
      inherit: true, // Show Copier output directly
    });

    // Clean up temp file
    try {
      await rm(dataFilePath);
    } catch {
      // Ignore cleanup errors
    }

    if (!result.success) {
      spinner.fail('Generation failed');
      console.log('');
      console.log(pc.red('Copier encountered an error during generation.'));
      if (result.stderr) {
        console.log(pc.dim(result.stderr));
      }
      process.exit(1);
    }

    spinner.succeed('Project generated successfully');
    console.log('');
    console.log(pc.green(`✓ Project created at: ${destPath}`));
    console.log('');
    console.log('Next steps:');
    console.log(pc.cyan(`  cd ${dest}`));
    console.log(pc.cyan('  # Follow the project README for setup instructions'));
  } catch (error) {
    spinner.fail('Generation failed');
    console.error(pc.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}
