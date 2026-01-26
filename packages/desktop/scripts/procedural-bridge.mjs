#!/usr/bin/env node
/**
 * Procedural Bridge Script
 *
 * Bridge between Tauri Rust backend and the @retro-vibecoder/procedural package.
 * Called by the Rust backend to perform procedural generation operations.
 *
 * Usage:
 *   node procedural-bridge.mjs preview <seed> [options]
 *   node procedural-bridge.mjs generate <seed> <output_path> [options]
 *
 * Options (JSON encoded):
 *   --archetype <type>
 *   --language <lang>
 *   --framework <fw>
 *
 * Output:
 *   JSON to stdout with either PreviewResult or GenerationResult
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';

// Import procedural package with error handling
let ProjectAssembler, AllStrategies;
try {
  const procedural = await import('@retro-vibecoder/procedural');
  ProjectAssembler = procedural.ProjectAssembler;
  AllStrategies = procedural.AllStrategies;
} catch (importError) {
  // Output detailed error for debugging module resolution issues
  console.log(
    JSON.stringify({
      success: false,
      error:
        `Failed to import @retro-vibecoder/procedural: ${importError.message}. ` +
        `Working directory: ${process.cwd()}. ` +
        `Script location: ${import.meta.url}`,
    })
  );
  process.exit(1);
}

/**
 * Parse command line arguments
 */
function parseArgs(args) {
  const result = {
    action: args[0], // 'preview' or 'generate'
    seed: parseInt(args[1], 10),
    outputPath: null,
    options: {},
  };

  let i = 2;

  // For generate action, the third arg is output path
  if (result.action === 'generate') {
    result.outputPath = args[i];
    i++;
  }

  // Parse remaining options
  while (i < args.length) {
    const arg = args[i];
    if (arg === '--archetype' && args[i + 1]) {
      result.options.archetype = args[i + 1];
      i += 2;
    } else if (arg === '--language' && args[i + 1]) {
      result.options.language = args[i + 1];
      i += 2;
    } else if (arg === '--framework' && args[i + 1]) {
      result.options.framework = args[i + 1];
      i += 2;
    } else {
      i++;
    }
  }

  return result;
}

/**
 * Generate a project preview (in-memory, no file writes)
 */
async function previewProject(seed, options) {
  const startTime = Date.now();

  try {
    const assembler = new ProjectAssembler(seed, options);
    assembler.registerStrategies(AllStrategies);

    const project = await assembler.generate();

    return {
      success: true,
      data: {
        files: project.files,
        stack: {
          archetype: project.stack.archetype,
          language: project.stack.language,
          runtime: project.stack.runtime,
          framework: project.stack.framework,
          database: project.stack.database,
          orm: project.stack.orm,
          transport: project.stack.transport,
          packaging: project.stack.packaging,
          cicd: project.stack.cicd,
          buildTool: project.stack.buildTool,
          styling: project.stack.styling,
          testing: project.stack.testing,
        },
        seed: seed,
        projectId: project.id,
        projectName: project.name,
      },
      durationMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - startTime,
    };
  }
}

/**
 * Generate a project and write to disk
 */
async function generateProject(seed, outputPath, options) {
  const startTime = Date.now();

  try {
    const assembler = new ProjectAssembler(seed, options);
    assembler.registerStrategies(AllStrategies);

    const project = await assembler.generate();

    // Write files to output directory
    const filesGenerated = [];
    await mkdir(outputPath, { recursive: true });

    for (const [filePath, content] of Object.entries(project.files)) {
      const fullPath = join(outputPath, filePath);
      await mkdir(dirname(fullPath), { recursive: true });
      await writeFile(fullPath, content, 'utf-8');
      filesGenerated.push(filePath);
    }

    return {
      success: true,
      data: {
        success: true,
        message: `Generated ${filesGenerated.length} files for ${project.id}`,
        files_generated: filesGenerated,
        output_path: outputPath,
        stack: {
          archetype: project.stack.archetype,
          language: project.stack.language,
          runtime: project.stack.runtime,
          framework: project.stack.framework,
          database: project.stack.database,
          orm: project.stack.orm,
          transport: project.stack.transport,
          packaging: project.stack.packaging,
          cicd: project.stack.cicd,
          buildTool: project.stack.buildTool,
          styling: project.stack.styling,
          testing: project.stack.testing,
        },
        projectId: project.id,
        projectName: project.name,
      },
      durationMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - startTime,
    };
  }
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error(
      JSON.stringify({
        success: false,
        error: 'Usage: procedural-bridge.mjs <preview|generate> <seed> [output_path] [options]',
      })
    );
    process.exit(1);
  }

  const { action, seed, outputPath, options } = parseArgs(args);

  if (isNaN(seed) || seed < 1) {
    console.error(
      JSON.stringify({
        success: false,
        error: 'Seed must be a positive integer',
      })
    );
    process.exit(1);
  }

  let result;

  if (action === 'preview') {
    result = await previewProject(seed, options);
  } else if (action === 'generate') {
    if (!outputPath) {
      console.error(
        JSON.stringify({
          success: false,
          error: 'Output path is required for generate action',
        })
      );
      process.exit(1);
    }
    result = await generateProject(seed, outputPath, options);
  } else {
    console.error(
      JSON.stringify({
        success: false,
        error: `Unknown action: ${action}. Use 'preview' or 'generate'`,
      })
    );
    process.exit(1);
  }

  // Output result as JSON to stdout
  console.log(JSON.stringify(result));
  process.exit(result.success ? 0 : 1);
}

main().catch(error => {
  console.error(
    JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    })
  );
  process.exit(1);
});
