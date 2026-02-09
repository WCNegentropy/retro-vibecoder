/**
 * Sweep Command
 *
 * Universal procedural generation sweep - generates and optionally validates
 * projects across the Universal Matrix.
 *
 * Enhanced with:
 * - Early constraint validation
 * - --start-seed option for seed range control
 * - --dry-run mode for preview without generation
 * - --only-valid filter to retry until N valid stacks found
 * - Progress indicator for large sweeps
 * - Improved error messages with stack context and suggestions
 */

import pc from 'picocolors';
import ora from 'ora';
import type { Archetype, Language, Framework } from '@retro-vibecoder/procedural';

interface SweepOptions {
  count: string;
  validate: boolean;
  output?: string;
  format: 'text' | 'json';
  verbose: boolean;
  archetype?: string;
  language?: string;
  framework?: string;
  saveRegistry?: string;
  startSeed?: string;
  dryRun?: boolean;
  onlyValid?: boolean;
}

/**
 * Registry entry for a validated project
 */
interface RegistryEntry {
  seed: number;
  id: string;
  /** Explicit license field - all registry entries are MIT licensed */
  license: 'MIT';
  stack: {
    archetype: string;
    language: string;
    framework: string;
    runtime: string;
    database: string;
    orm: string;
  };
  files: string[];
  validatedAt: string;
  upgVersion: string;
}

/**
 * Registry manifest structure
 */
interface RegistryManifest {
  version: string;
  generatedAt: string;
  totalEntries: number;
  entries: RegistryEntry[];
}

/**
 * Progress bar helper for large sweeps
 */
function createProgressBar(current: number, total: number, width: number = 30): string {
  const percentage = Math.round((current / total) * 100);
  const filled = Math.round((current / total) * width);
  const empty = width - filled;
  const bar = pc.green('█'.repeat(filled)) + pc.dim('░'.repeat(empty));
  return `[${bar}] ${percentage}% (${current}/${total})`;
}

/**
 * Sweep action - generate projects procedurally
 */
export async function sweepAction(options: SweepOptions): Promise<void> {
  const count = parseInt(options.count, 10);
  const startSeed = options.startSeed ? parseInt(options.startSeed, 10) : 1;

  if (isNaN(count) || count < 1) {
    console.error(pc.red('Error: Count must be a positive integer'));
    process.exit(1);
  }

  if (isNaN(startSeed) || startSeed < 1) {
    console.error(pc.red('Error: Start seed must be a positive integer'));
    process.exit(1);
  }

  const spinner = ora('Initializing procedural generation engine...').start();

  try {
    // Dynamic import to avoid loading procedural package if not used
    const {
      ProjectAssembler,
      AllStrategies,
      runUniversalSweep,
      validateConstraints,
      getValidLanguagesForArchetype,
    } = await import('@retro-vibecoder/procedural');

    // Early validation of user constraints
    if (options.archetype || options.language || options.framework) {
      const validation = validateConstraints(
        options.archetype as Archetype | undefined,
        options.language as Language | undefined,
        options.framework as Framework | undefined
      );

      if (!validation.valid) {
        spinner.fail('Invalid constraints specified');
        console.error();
        for (const error of validation.errors) {
          console.error(pc.red(`  ✗ ${error}`));
        }
        console.error();
        console.error(pc.yellow('Suggestions:'));
        for (const suggestion of validation.suggestions) {
          console.error(pc.yellow(`  → ${suggestion}`));
        }

        // Additional helpful info
        if (options.archetype && !options.language) {
          const languages = getValidLanguagesForArchetype(options.archetype as Archetype);
          console.error(
            pc.dim(`\nCompatible languages for '${options.archetype}': ${languages.join(', ')}`)
          );
        }

        process.exit(1);
      }
    }

    // Dry-run mode
    if (options.dryRun) {
      spinner.text = 'Dry-run: previewing stacks without generating files...';
    } else {
      spinner.text = `Generating ${count} project(s) from seed ${startSeed}...`;
    }

    const results: Array<{
      seed: number;
      id: string;
      stack: Record<string, string>;
      files: string[];
      validated?: boolean;
      validationError?: string;
      failed?: boolean;
      error?: string;
    }> = [];

    const startTime = Date.now();
    let successCount = 0;
    let failCount = 0;
    let currentSeed = startSeed;
    let attempts = 0;
    const maxAttempts = options.onlyValid ? count * 10 : count; // Allow more attempts for --only-valid

    // Use progress indicator for large sweeps (>= 50)
    const showProgress = count >= 50 && options.format === 'text';

    while (successCount < count && attempts < maxAttempts) {
      const seed = currentSeed++;
      attempts++;

      if (showProgress && attempts % 10 === 0) {
        spinner.text = `${createProgressBar(successCount, count)} ${options.onlyValid ? 'Finding valid stacks...' : 'Generating...'}`;
      } else if (!showProgress) {
        spinner.text = options.onlyValid
          ? `Finding valid stack ${successCount + 1}/${count} (attempt ${attempts})...`
          : `Generating project ${attempts}/${count}...`;
      }

      const assemblerOptions: Record<string, unknown> = {};

      if (options.archetype) {
        assemblerOptions.archetype = options.archetype;
      }
      if (options.language) {
        assemblerOptions.language = options.language;
      }
      if (options.framework) {
        assemblerOptions.framework = options.framework;
      }

      try {
        const assembler = new ProjectAssembler(seed, assemblerOptions);
        assembler.registerStrategies(AllStrategies);

        const project = await assembler.generate();

        const result = {
          seed,
          id: project.id,
          stack: {
            archetype: project.stack.archetype,
            language: project.stack.language,
            framework: project.stack.framework,
            runtime: project.stack.runtime,
            database: project.stack.database,
            orm: project.stack.orm,
          },
          files: Object.keys(project.files),
          validated: undefined as boolean | undefined,
          validationError: undefined as string | undefined,
          failed: false,
        };

        // If validation is requested, validate the project
        if (options.validate && !options.dryRun) {
          spinner.text = `Validating project ${successCount + 1}/${count}...`;
          const validationResults = await runUniversalSweep(1, {
            useDocker: false,
            verbose: false,
          });

          if (validationResults.length > 0) {
            result.validated = validationResults[0].success;
            result.validationError = validationResults[0].error;
          }
        }

        results.push(result);
        successCount++;

        // Write output to file if specified (skip in dry-run mode)
        if (options.output && !options.dryRun) {
          const { writeFile, mkdir } = await import('node:fs/promises');
          const { join, dirname } = await import('node:path');

          const outputDir = join(options.output, project.id);
          await mkdir(outputDir, { recursive: true });

          for (const [filePath, content] of Object.entries(project.files)) {
            const fullPath = join(outputDir, filePath);
            await mkdir(dirname(fullPath), { recursive: true });
            await writeFile(fullPath, content, 'utf-8');
          }
        }
      } catch (error) {
        // Generation failed for this seed
        if (!options.onlyValid) {
          // Only track failures if not in --only-valid mode
          failCount++;
          results.push({
            seed,
            id: `failed-seed-${seed}`,
            stack: {
              archetype: options.archetype ?? 'unknown',
              language: options.language ?? 'unknown',
              framework: options.framework ?? 'unknown',
              runtime: 'unknown',
              database: 'unknown',
              orm: 'unknown',
            },
            files: [],
            failed: true,
            error: error instanceof Error ? error.message : String(error),
          });
        }
        // In --only-valid mode, just continue to next seed
      }
    }

    const duration = Date.now() - startTime;
    spinner.stop();

    // Output results
    if (options.format === 'json') {
      console.log(
        JSON.stringify(
          {
            results,
            duration,
            successCount,
            failCount,
            startSeed,
            dryRun: options.dryRun ?? false,
            onlyValid: options.onlyValid ?? false,
          },
          null,
          2
        )
      );
    } else {
      console.log();

      // Header with mode indicator
      const modeIndicator = options.dryRun ? pc.cyan('[DRY-RUN] ') : '';
      const onlyValidIndicator = options.onlyValid ? pc.magenta('[ONLY-VALID] ') : '';

      if (failCount > 0 && !options.onlyValid) {
        console.log(
          pc.bold(
            pc.yellow(
              `${modeIndicator}${onlyValidIndicator}✓ Generated ${successCount}/${count} project(s) in ${duration}ms (${failCount} failed)`
            )
          )
        );
      } else {
        console.log(
          pc.bold(
            pc.green(
              `${modeIndicator}${onlyValidIndicator}✓ Generated ${successCount} project(s) in ${duration}ms`
            )
          )
        );
      }

      if (options.onlyValid && attempts > count) {
        console.log(pc.dim(`  (tried ${attempts} seeds to find ${count} valid stacks)`));
      }

      console.log();

      for (const result of results) {
        if (result.failed) {
          console.log(pc.bold(pc.red(`Seed ${result.seed}: FAILED`)));
          if (options.verbose && result.error) {
            // Enhanced error message with stack context
            const stackContext =
              result.stack.archetype !== 'unknown'
                ? ` [${result.stack.archetype}/${result.stack.language}/${result.stack.framework}]`
                : '';
            console.log(pc.red(`  Error${stackContext}: ${result.error}`));
          }
          console.log();
          continue;
        }

        const status =
          result.validated === undefined
            ? ''
            : result.validated
              ? pc.green(' [VALID]')
              : pc.red(' [INVALID]');

        const dryRunNote = options.dryRun ? pc.cyan(' (preview)') : '';

        console.log(pc.bold(`Seed ${result.seed}: ${result.id}${status}${dryRunNote}`));

        if (options.verbose) {
          console.log(pc.dim(`  Archetype: ${result.stack.archetype}`));
          console.log(pc.dim(`  Language: ${result.stack.language}`));
          console.log(pc.dim(`  Framework: ${result.stack.framework}`));
          console.log(pc.dim(`  Runtime: ${result.stack.runtime}`));
          console.log(pc.dim(`  Database: ${result.stack.database}`));
          console.log(pc.dim(`  Files: ${result.files.length}`));

          if (result.validationError) {
            console.log(pc.red(`  Error: ${result.validationError}`));
          }
        }

        console.log();
      }

      // Summary - only include successful results
      const successfulResults = results.filter(r => !r.failed);
      const archetypes = new Set(successfulResults.map(r => r.stack.archetype));
      const languages = new Set(successfulResults.map(r => r.stack.language));
      const frameworks = new Set(successfulResults.map(r => r.stack.framework));

      console.log(pc.dim('─'.repeat(50)));
      console.log(pc.bold('Summary:'));
      console.log(
        `  Success rate: ${successCount}/${options.onlyValid ? attempts : count} (${Math.round((successCount / (options.onlyValid ? attempts : count)) * 100)}%)`
      );
      console.log(`  Seed range: ${startSeed} - ${currentSeed - 1}`);
      console.log(`  Archetypes: ${[...archetypes].join(', ')}`);
      console.log(`  Languages: ${[...languages].join(', ')}`);
      console.log(`  Frameworks: ${[...frameworks].join(', ')}`);

      if (options.dryRun) {
        console.log();
        console.log(pc.cyan('Dry-run mode: No files were written to disk'));
      }

      if (options.output && !options.dryRun) {
        console.log();
        console.log(pc.cyan(`Projects written to: ${options.output}`));
      }

      // Save to registry if requested (skip in dry-run mode)
      if (options.saveRegistry && !options.dryRun) {
        // Filter out failed and include only validated (or all successful if not validating)
        const validResults = results.filter(
          r =>
            !r.failed && (r.validated === true || (r.validated === undefined && !options.validate))
        );

        if (validResults.length > 0) {
          const registryPath = await saveToRegistry(validResults, options.saveRegistry);
          console.log();
          console.log(
            pc.green(`Registry saved: ${validResults.length} valid project(s) to ${registryPath}`)
          );
        } else {
          console.log();
          console.log(pc.yellow('No valid projects to save to registry'));
        }
      }
    }
  } catch (error) {
    spinner.fail('Generation failed');
    console.error(pc.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

/**
 * Save validated results to registry manifest
 */
async function saveToRegistry(
  results: Array<{
    seed: number;
    id: string;
    stack: Record<string, string>;
    files: string[];
    validated?: boolean;
  }>,
  registryPath: string
): Promise<string> {
  const { writeFile, readFile, mkdir } = await import('node:fs/promises');
  const { dirname } = await import('node:path');

  // Ensure registry directory exists
  await mkdir(dirname(registryPath), { recursive: true });

  // Load existing registry if it exists
  let existingManifest: RegistryManifest = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    totalEntries: 0,
    entries: [],
  };

  try {
    const existing = await readFile(registryPath, 'utf-8');
    existingManifest = JSON.parse(existing);
  } catch {
    // File doesn't exist, use default
  }

  // Create new entries - all registry entries are MIT licensed
  const newEntries: RegistryEntry[] = results.map(r => ({
    seed: r.seed,
    id: r.id,
    license: 'MIT' as const,
    stack: {
      archetype: r.stack.archetype,
      language: r.stack.language,
      framework: r.stack.framework,
      runtime: r.stack.runtime,
      database: r.stack.database,
      orm: r.stack.orm,
    },
    files: r.files,
    validatedAt: new Date().toISOString(),
    upgVersion: '1.0.0',
  }));

  // Merge entries (deduplicate by seed)
  const existingSeeds = new Set(existingManifest.entries.map(e => e.seed));
  const uniqueNewEntries = newEntries.filter(e => !existingSeeds.has(e.seed));

  const allEntries = [...existingManifest.entries, ...uniqueNewEntries];

  // Sort by seed
  allEntries.sort((a, b) => a.seed - b.seed);

  // Create updated manifest
  const updatedManifest: RegistryManifest = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    totalEntries: allEntries.length,
    entries: allEntries,
  };

  // Write manifest
  await writeFile(registryPath, JSON.stringify(updatedManifest, null, 2), 'utf-8');

  return registryPath;
}

/**
 * Seed command - generate a single project from a seed
 *
 * Pipeline: seed → stack resolution → pick template set → render with Nunjucks → write to disk
 * This uses the same Nunjucks rendering pipeline as the 'generate' command.
 * Strategies load .jinja templates from templates/procedural/ and render them
 * with the resolved stack context.
 */
export async function seedAction(
  seedStr: string,
  options: {
    output?: string;
    verbose: boolean;
    archetype?: string;
    language?: string;
    framework?: string;
    json?: boolean;
  }
): Promise<void> {
  const seed = parseInt(seedStr, 10);
  const isJson = options.json ?? false;

  if (isNaN(seed) || seed < 1) {
    if (isJson) {
      console.log(JSON.stringify({ success: false, error: 'Seed must be a positive integer' }));
      process.exit(1);
      return;
    }
    console.error(pc.red('Error: Seed must be a positive integer'));
    process.exit(1);
  }

  const spinner = isJson ? null : ora('Generating project...').start();

  try {
    const {
      ProjectAssembler,
      AllStrategies,
      validateConstraints,
      getValidLanguagesForArchetype,
      getSuggestedFrameworks,
      hasTemplateSet,
    } = await import('@retro-vibecoder/procedural');

    // Early validation of user constraints
    if (options.archetype || options.language || options.framework) {
      const validation = validateConstraints(
        options.archetype as Archetype | undefined,
        options.language as Language | undefined,
        options.framework as Framework | undefined
      );

      if (!validation.valid) {
        if (isJson) {
          console.log(
            JSON.stringify({ success: false, error: validation.errors.join('; ') || 'Invalid constraints specified' })
          );
          process.exit(1);
          return;
        }
        if (spinner) {
          spinner.fail('Invalid constraints specified');
        }
        console.error();
        for (const error of validation.errors) {
          console.error(pc.red(`  ✗ ${error}`));
        }
        console.error();
        console.error(pc.yellow('Suggestions:'));
        for (const suggestion of validation.suggestions) {
          console.error(pc.yellow(`  → ${suggestion}`));
        }

        // Additional helpful info
        if (options.archetype && !options.language) {
          const languages = getValidLanguagesForArchetype(options.archetype as Archetype);
          console.error(
            pc.dim(`\nCompatible languages for '${options.archetype}': ${languages.join(', ')}`)
          );
        }

        if (options.archetype && options.language) {
          const frameworks = getSuggestedFrameworks(
            options.archetype as Archetype,
            options.language as Language
          );
          if (frameworks.length > 0) {
            console.error(pc.dim(`Compatible frameworks: ${frameworks.join(', ')}`));
          }
        }

        process.exit(1);
      }
    }

    const assemblerOptions: Record<string, unknown> = {};

    if (options.archetype) {
      assemblerOptions.archetype = options.archetype;
    }
    if (options.language) {
      assemblerOptions.language = options.language;
    }
    if (options.framework) {
      assemblerOptions.framework = options.framework;
    }

    const assembler = new ProjectAssembler(seed, assemblerOptions);
    assembler.registerStrategies(AllStrategies);

    const project = await assembler.generate();

    if (spinner) {
      spinner.stop();
    }

    const files = Object.keys(project.files).sort();

    if (isJson) {
      if (options.output) {
        const { writeFile, mkdir } = await import('node:fs/promises');
        const { join, dirname } = await import('node:path');

        const outputDir = options.output;
        await mkdir(outputDir, { recursive: true });

        for (const [filePath, content] of Object.entries(project.files)) {
          const fullPath = join(outputDir, filePath);
          await mkdir(dirname(fullPath), { recursive: true });
          await writeFile(fullPath, content, 'utf-8');
        }
      }

      console.log(
        JSON.stringify({
          success: true,
          seed,
          id: project.id,
          stack: project.stack,
          files_generated: files,
          output_path: options.output ?? '',
        })
      );
      return;
    }

    console.log();
    console.log(pc.bold(pc.green(`✓ Generated: ${project.id}`)));
    console.log();
    console.log(pc.bold('Tech Stack:'));
    console.log(`  Archetype: ${project.stack.archetype}`);
    console.log(`  Language: ${project.stack.language}`);
    console.log(`  Framework: ${project.stack.framework}`);
    console.log(`  Runtime: ${project.stack.runtime}`);
    console.log(`  Database: ${project.stack.database}`);
    console.log(`  ORM: ${project.stack.orm}`);
    console.log(`  Transport: ${project.stack.transport}`);
    console.log(`  Packaging: ${project.stack.packaging}`);
    console.log(`  CI/CD: ${project.stack.cicd}`);

    // Show template source info
    const usesTemplates = hasTemplateSet(
      project.stack.archetype,
      project.stack.language,
      project.stack.framework
    );
    if (options.verbose) {
      console.log(`  Template source: ${usesTemplates ? 'Nunjucks (.jinja)' : 'inline'}`);
    }

    console.log();
    console.log(pc.bold('Generated Files:'));

    for (const file of files) {
      console.log(pc.dim(`  ${file}`));
    }

    // Write output if specified
    if (options.output) {
      const { writeFile, mkdir } = await import('node:fs/promises');
      const { join, dirname } = await import('node:path');

      const outputDir = options.output;
      await mkdir(outputDir, { recursive: true });

      for (const [filePath, content] of Object.entries(project.files)) {
        const fullPath = join(outputDir, filePath);
        await mkdir(dirname(fullPath), { recursive: true });
        await writeFile(fullPath, content, 'utf-8');
      }

      console.log();
      console.log(pc.cyan(`Project written to: ${outputDir}`));
    }

    // Show file content preview in verbose mode
    if (options.verbose && !options.output) {
      console.log();
      console.log(pc.bold('File Previews:'));

      const previewFiles = [
        'package.json',
        'Cargo.toml',
        'go.mod',
        'requirements.txt',
        'main.py',
        'src/index.ts',
        'src/main.rs',
        'main.go',
      ];

      for (const file of previewFiles) {
        if (project.files[file]) {
          console.log();
          console.log(pc.bold(pc.cyan(`--- ${file} ---`)));
          const lines = project.files[file].split('\n').slice(0, 20);
          console.log(pc.dim(lines.join('\n')));
          if (project.files[file].split('\n').length > 20) {
            console.log(pc.dim('... (truncated)'));
          }
        }
      }
    }
  } catch (error) {
    // Enhanced error message
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (isJson) {
      console.log(JSON.stringify({ success: false, error: errorMsg }));
      process.exit(1);
      return;
    }
    if (spinner) {
      spinner.fail('Generation failed');
    }
    console.error(pc.red(`Error: ${errorMsg}`));

    // Provide suggestions based on the error
    if (errorMsg.includes('Invalid stack')) {
      console.error();
      console.error(pc.yellow('Suggestions:'));
      console.error(pc.yellow('  → Try a different seed number'));
      console.error(pc.yellow('  → Use --archetype and --language to constrain generation'));
      console.error(
        pc.yellow('  → Example: upg seed 42 --archetype backend --language typescript')
      );
    }

    process.exit(1);
  }
}
