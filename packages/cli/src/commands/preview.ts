/**
 * Preview Command
 *
 * Generates a project from a seed and outputs JSON to stdout without writing files.
 * This is designed for the desktop app to preview projects without disk I/O.
 *
 * Output format:
 * {
 *   "success": true,
 *   "data": {
 *     "seed": 42,
 *     "id": "project-id",
 *     "stack": { ... },
 *     "files": { "path/to/file.ts": "content", ... }
 *   }
 * }
 *
 * On error:
 * {
 *   "success": false,
 *   "error": "error message"
 * }
 */

import type { Archetype, Language, Framework } from '@retro-vibecoder/procedural';

interface PreviewOptions {
  archetype?: string;
  language?: string;
  framework?: string;
}

interface PreviewOutput {
  success: boolean;
  data?: {
    seed: number;
    id: string;
    stack: Record<string, string>;
    files: Record<string, string>;
  };
  error?: string;
}

/**
 * Preview action - generate a project and output JSON to stdout
 */
export async function previewAction(seedStr: string, options: PreviewOptions): Promise<void> {
  const seed = parseInt(seedStr, 10);

  if (isNaN(seed) || seed < 1) {
    const output: PreviewOutput = {
      success: false,
      error: 'Seed must be a positive integer',
    };
    console.log(JSON.stringify(output));
    process.exit(1);
  }

  try {
    const { ProjectAssembler, AllStrategies, validateConstraints } =
      await import('@retro-vibecoder/procedural');

    // Early validation of user constraints
    if (options.archetype || options.language || options.framework) {
      const validation = validateConstraints(
        options.archetype as Archetype | undefined,
        options.language as Language | undefined,
        options.framework as Framework | undefined
      );

      if (!validation.valid) {
        const output: PreviewOutput = {
          success: false,
          error: `Invalid constraints: ${validation.errors.join('; ')}`,
        };
        console.log(JSON.stringify(output));
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

    // Output JSON to stdout
    const output: PreviewOutput = {
      success: true,
      data: {
        seed,
        id: project.id,
        stack: {
          archetype: project.stack.archetype,
          language: project.stack.language,
          framework: project.stack.framework,
          runtime: project.stack.runtime,
          database: project.stack.database,
          orm: project.stack.orm,
          transport: project.stack.transport,
          packaging: project.stack.packaging,
          cicd: project.stack.cicd,
        },
        files: project.files,
      },
    };

    console.log(JSON.stringify(output));
  } catch (error) {
    const output: PreviewOutput = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
    console.log(JSON.stringify(output));
    process.exit(1);
  }
}
