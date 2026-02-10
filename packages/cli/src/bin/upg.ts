#!/usr/bin/env node

/**
 * UPG CLI - Universal Project Generator
 *
 * Main entry point for the CLI.
 * Copyright (c) 2026 WCNEGENTROPY HOLDINGS LLC - MIT License
 */

import { Command } from 'commander';
import pc from 'picocolors';
import { writeFile } from 'fs/promises';
import { version } from '../../package.json';
import { validateAction } from '../commands/validate.js';
import { generateAction } from '../commands/generate.js';
import { testAction } from '../commands/test.js';
import { searchAction } from '../commands/search.js';
import { initAction } from '../commands/init.js';
import { sweepAction, seedAction } from '../commands/sweep.js';
import { previewAction } from '../commands/preview.js';

/**
 * Create the CLI program
 */
export function createCli(): Command {
  const program = new Command();

  program
    .name('upg')
    .description('Universal Project Generator - Data-driven project scaffolding')
    .version(version)
    .hook('preAction', (_thisCommand, actionCommand) => {
      // Skip disclaimer for preview command (needs clean JSON output)
      if (actionCommand.name() === 'preview' || actionCommand.opts().json) {
        return;
      }
      // Print disclaimer on stderr so it doesn't break piping stdout
      console.error(pc.dim('-------------------------------------------------------'));
      console.error(pc.dim('  Retro Vibecoder UPG - Open Source Procedural Engine'));
      console.error(pc.dim('  (c) WCNEGENTROPY HOLDINGS LLC | MIT License'));
      console.error(pc.dim('  Generated Code: User Responsibility'));
      console.error(pc.dim('-------------------------------------------------------'));
    });

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
    .description(
      'Search for projects in the registry by keyword, archetype, language, or framework'
    )
    .option('-t, --tags <tags>', 'Filter by tags (comma-separated)')
    .option('-l, --limit <number>', 'Maximum results', '10')
    .option('--local', 'Use local registry only (skip remote fetch)')
    .option('--remote', 'Use remote registry only (fail if unavailable)')
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

  // Sweep command - procedural generation
  program
    .command('sweep')
    .description('Generate multiple projects procedurally from the Universal Matrix')
    .option('-c, --count <number>', 'Number of projects to generate', '5')
    .option('--validate', 'Validate generated projects', false)
    .option('-o, --output <path>', 'Output directory for generated projects')
    .option('-f, --format <format>', 'Output format (text|json)', 'text')
    .option('-v, --verbose', 'Verbose output', false)
    .option('--archetype <type>', 'Force specific archetype (web|backend|cli|mobile|desktop)')
    .option('--language <lang>', 'Force specific language (typescript|python|go|rust|etc)')
    .option('--framework <fw>', 'Force specific framework')
    .option('--save-registry <path>', 'Save validated projects to registry manifest')
    .option('--start-seed <number>', 'Starting seed number (default: 1)')
    .option('--dry-run', 'Preview stacks without generating files', false)
    .option('--only-valid', 'Keep retrying until N valid projects are found', false)
    .action(sweepAction);

  // Seed command - generate single project from seed
  program
    .command('seed <seed>')
    .description('Generate a single project from a seed number')
    .option('-o, --output <path>', 'Output directory for generated project')
    .option('-v, --verbose', 'Show file content previews', false)
    .option('--json', 'Output machine-readable JSON (for desktop app integration)', false)
    .option('--archetype <type>', 'Force specific archetype')
    .option('--language <lang>', 'Force specific language')
    .option('--framework <fw>', 'Force specific framework')
    .option('-n, --name <name>', 'Project name')
    .action(seedAction);

  // Preview command - generate project and output JSON to stdout (for desktop app integration)
  program
    .command('preview <seed>')
    .description('Preview a project from a seed (JSON output, no file writes)')
    .option('--archetype <type>', 'Force specific archetype')
    .option('--language <lang>', 'Force specific language')
    .option('--framework <fw>', 'Force specific framework')
    .action(previewAction);

  return program;
}

// Run CLI if this is the main module
const program = createCli();

// Handle unknown option errors that might be negative numbers
program.configureOutput({
  outputError: (str, write) => {
    // Check if this is a "seed" command with a negative number
    if (str.includes('unknown option') && str.includes("'-")) {
      const match = str.match(/'-(\d+)'/);
      if (match && process.argv.includes('seed')) {
        write(pc.red(`Error: Seed must be a positive integer (got -${match[1]})\n`));
        write(pc.yellow(`Hint: Seeds are positive integers, e.g., 'upg seed 42'\n`));
        return;
      }
    }
    write(str);
  },
});

if (process.argv.length < 3) {
  program.outputHelp();
} else {
  program.parse();
}
