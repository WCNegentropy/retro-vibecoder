#!/usr/bin/env node

/**
 * UPG CLI - Universal Project Generator
 *
 * Main entry point for the CLI.
 */

import { Command } from 'commander';
import { version } from '../../package.json';
import { validateAction } from '../commands/validate.js';
import { generateAction } from '../commands/generate.js';
import { testAction } from '../commands/test.js';
import { searchAction } from '../commands/search.js';
import { initAction } from '../commands/init.js';

/**
 * Create the CLI program
 */
export function createCli(): Command {
  const program = new Command();

  program
    .name('upg')
    .description('Universal Project Generator - Data-driven project scaffolding')
    .version(version);

  // Validate command
  program
    .command('validate <manifest>')
    .description('Validate a UPG manifest file')
    .option('-f, --format <format>', 'Output format (text|json)', 'text')
    .option('-w, --warnings', 'Include warnings in output', true)
    .option('-v, --verbose', 'Verbose output', false)
    .action(validateAction);

  // Generate command
  program
    .command('generate [template]')
    .description('Generate a project from a template')
    .option('-d, --dest <path>', 'Destination directory')
    .option('--data <json>', 'JSON data for prompts (non-interactive)')
    .option('--use-defaults', 'Use default values for all prompts')
    .option('--dry-run', 'Show what would be generated without creating files')
    .option('-f, --force', 'Overwrite existing files')
    .action(generateAction);

  // Test command
  program
    .command('test <manifest>')
    .description('Test a manifest by validating and transpiling')
    .option('--data <json>', 'Test data for validation')
    .option('-f, --format <format>', 'Output format (text|json)', 'text')
    .option('-v, --verbose', 'Verbose output', false)
    .action(testAction);

  // Search command
  program
    .command('search <query>')
    .description('Search for templates in the registry')
    .option('-t, --tags <tags>', 'Filter by tags (comma-separated)')
    .option('-l, --limit <number>', 'Maximum results', '10')
    .action(searchAction);

  // Init command
  program
    .command('init')
    .description('Initialize a new UPG manifest in the current directory')
    .option('-n, --name <name>', 'Template name')
    .option('-f, --force', 'Overwrite existing manifest')
    .action(initAction);

  // Docs command
  program
    .command('docs <manifest>')
    .description('Generate documentation for a template')
    .option('-f, --format <format>', 'Output format (markdown|json)', 'markdown')
    .option('-o, --output <path>', 'Output file path')
    .action(async (manifest, options) => {
      const { docsGenCommand } = await import('@retro-vibecoder/core');
      const result = await docsGenCommand({
        manifestPath: manifest,
        format: options.format,
        includeExamples: true,
      });

      if (result.success) {
        if (options.output) {
          const { writeFile } = await import('fs/promises');
          await writeFile(options.output, result.content);
          console.log(`Documentation written to ${options.output}`);
        } else {
          console.log(result.content);
        }
      } else {
        console.error(`Error: ${result.error}`);
        process.exit(1);
      }
    });

  return program;
}

// Run CLI if this is the main module
const program = createCli();
program.parse();
