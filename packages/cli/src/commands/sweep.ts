/**
 * Sweep Command
 *
 * Universal procedural generation sweep - generates and optionally validates
 * projects across the Universal Matrix.
 */

import pc from 'picocolors';
import ora from 'ora';

interface SweepOptions {
  count: string;
  validate: boolean;
  output?: string;
  format: 'text' | 'json';
  verbose: boolean;
  archetype?: string;
  language?: string;
  framework?: string;
}

/**
 * Sweep action - generate projects procedurally
 */
export async function sweepAction(options: SweepOptions): Promise<void> {
  const count = parseInt(options.count, 10);

  if (isNaN(count) || count < 1) {
    console.error(pc.red('Error: Count must be a positive integer'));
    process.exit(1);
  }

  const spinner = ora('Initializing procedural generation engine...').start();

  try {
    // Dynamic import to avoid loading procedural package if not used
    const {
      ProjectAssembler,
      AllStrategies,
      runUniversalSweep,
    } = await import('@retro-vibecoder/procedural');

    spinner.text = `Generating ${count} project(s)...`;

    const results: Array<{
      seed: number;
      id: string;
      stack: Record<string, string>;
      files: string[];
      validated?: boolean;
      validationError?: string;
    }> = [];

    const startTime = Date.now();

    for (let seed = 1; seed <= count; seed++) {
      spinner.text = `Generating project ${seed}/${count}...`;

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
      };

      // If validation is requested, validate the project
      if (options.validate) {
        spinner.text = `Validating project ${seed}/${count}...`;
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

      // Write output to file if specified
      if (options.output) {
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
    }

    const duration = Date.now() - startTime;
    spinner.stop();

    // Output results
    if (options.format === 'json') {
      console.log(JSON.stringify({ results, duration }, null, 2));
    } else {
      console.log();
      console.log(pc.bold(pc.green(`✓ Generated ${count} project(s) in ${duration}ms`)));
      console.log();

      for (const result of results) {
        const status = result.validated === undefined
          ? ''
          : result.validated
            ? pc.green(' [VALID]')
            : pc.red(' [INVALID]');

        console.log(pc.bold(`Seed ${result.seed}: ${result.id}${status}`));

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

      // Summary
      const archetypes = new Set(results.map((r) => r.stack.archetype));
      const languages = new Set(results.map((r) => r.stack.language));
      const frameworks = new Set(results.map((r) => r.stack.framework));

      console.log(pc.dim('─'.repeat(50)));
      console.log(pc.bold('Summary:'));
      console.log(`  Archetypes: ${[...archetypes].join(', ')}`);
      console.log(`  Languages: ${[...languages].join(', ')}`);
      console.log(`  Frameworks: ${[...frameworks].join(', ')}`);

      if (options.output) {
        console.log();
        console.log(pc.cyan(`Projects written to: ${options.output}`));
      }
    }
  } catch (error) {
    spinner.fail('Generation failed');
    console.error(pc.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

/**
 * Seed command - generate a single project from a seed
 */
export async function seedAction(seedStr: string, options: {
  output?: string;
  verbose: boolean;
  archetype?: string;
  language?: string;
  framework?: string;
}): Promise<void> {
  const seed = parseInt(seedStr, 10);

  if (isNaN(seed) || seed < 1) {
    console.error(pc.red('Error: Seed must be a positive integer'));
    process.exit(1);
  }

  const spinner = ora('Generating project...').start();

  try {
    const { ProjectAssembler, AllStrategies } = await import('@retro-vibecoder/procedural');

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

    spinner.stop();

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
    console.log();
    console.log(pc.bold('Generated Files:'));

    const files = Object.keys(project.files).sort();
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

      const previewFiles = ['package.json', 'Cargo.toml', 'go.mod', 'requirements.txt', 'main.py', 'src/index.ts', 'src/main.rs', 'main.go'];

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
    spinner.fail('Generation failed');
    console.error(pc.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}
