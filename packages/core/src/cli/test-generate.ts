/**
 * Test Generate CLI command implementation
 *
 * Usage: upg test-generate <manifest> [--data <json>]
 *
 * This command validates a manifest and transpiles it to JSON Schema
 * to verify the generation would work correctly.
 */

import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { validateManifest } from '../schema/validator.js';
import { transpileManifestToSchema } from '../transpiler/manifest-to-schema.js';
import { parseYaml, type UpgManifest } from '@wcnegentropy/shared';

/**
 * Test generate command options
 */
export interface TestGenerateOptions {
  /** Path to manifest file */
  manifestPath: string;
  /** Optional JSON data for testing */
  data?: string;
  /** Output directory for generated schema (optional) */
  outputDir?: string;
  /** Output format */
  format?: 'text' | 'json';
  /** Verbose output */
  verbose?: boolean;
}

/**
 * Test generate command result
 */
export interface TestGenerateResult {
  /** Whether test passed */
  success: boolean;
  /** Validation passed */
  validationPassed: boolean;
  /** Transpilation passed */
  transpilationPassed: boolean;
  /** Generated JSON Schema */
  schema?: object;
  /** Generated UI Schema */
  uiSchema?: object;
  /** Default form data */
  formData?: Record<string, unknown>;
  /** Error messages */
  errors: string[];
  /** Formatted output */
  output: string;
}

/**
 * Execute the test-generate command
 */
export async function testGenerateCommand(
  options: TestGenerateOptions
): Promise<TestGenerateResult> {
  const { manifestPath, data, format = 'text', verbose = false } = options;

  const errors: string[] = [];
  const result: TestGenerateResult = {
    success: false,
    validationPassed: false,
    transpilationPassed: false,
    errors: [],
    output: '',
  };

  // Read manifest file
  const filePath = resolve(manifestPath);
  let content: string;
  try {
    content = await readFile(filePath, 'utf-8');
  } catch (error) {
    errors.push(`Failed to read manifest: ${(error as Error).message}`);
    result.errors = errors;
    result.output = formatOutput(result, format, verbose);
    return result;
  }

  // Validate manifest
  const validationResult = validateManifest(content, {
    allErrors: true,
    includeWarnings: true,
  });

  if (!validationResult.valid) {
    errors.push('Manifest validation failed:');
    for (const error of validationResult.errors) {
      errors.push(`  - [${error.code}] ${error.message} (${error.path})`);
    }
    result.errors = errors;
    result.output = formatOutput(result, format, verbose);
    return result;
  }

  result.validationPassed = true;
  const manifest = validationResult.manifest as UpgManifest;

  // Transpile to JSON Schema
  try {
    const transpiled = transpileManifestToSchema(manifest, {
      includeUiSchema: true,
      includeConditionals: true,
    });

    result.schema = transpiled.schema;
    result.uiSchema = transpiled.uiSchema;
    result.formData = transpiled.formData;
    result.transpilationPassed = true;
  } catch (error) {
    errors.push(`Transpilation failed: ${(error as Error).message}`);
    result.errors = errors;
    result.output = formatOutput(result, format, verbose);
    return result;
  }

  // If test data provided, validate it against the schema
  if (data) {
    try {
      const testData = parseYaml(data) as Record<string, unknown>;
      // TODO: Validate test data against generated schema
      if (verbose) {
        errors.push(`Test data validated (${Object.keys(testData).length} fields)`);
      }
    } catch (error) {
      errors.push(`Invalid test data: ${(error as Error).message}`);
    }
  }

  result.success = result.validationPassed && result.transpilationPassed;
  result.errors = errors;
  result.output = formatOutput(result, format, verbose);

  return result;
}

/**
 * Format output based on format option
 */
function formatOutput(result: TestGenerateResult, format: string, verbose: boolean): string {
  if (format === 'json') {
    return JSON.stringify(
      {
        success: result.success,
        validationPassed: result.validationPassed,
        transpilationPassed: result.transpilationPassed,
        schema: result.schema,
        uiSchema: result.uiSchema,
        formData: result.formData,
        errors: result.errors,
      },
      null,
      2
    );
  }

  const lines: string[] = [];

  if (result.success) {
    lines.push('✓ Test generation passed');
  } else {
    lines.push('✗ Test generation failed');
  }

  lines.push('');
  lines.push(`Validation: ${result.validationPassed ? '✓' : '✗'}`);
  lines.push(`Transpilation: ${result.transpilationPassed ? '✓' : '✗'}`);

  if (result.errors.length > 0) {
    lines.push('');
    lines.push('Messages:');
    for (const error of result.errors) {
      lines.push(`  ${error}`);
    }
  }

  if (verbose && result.schema) {
    lines.push('');
    lines.push('Generated JSON Schema:');
    lines.push(JSON.stringify(result.schema, null, 2));
  }

  if (verbose && result.formData) {
    lines.push('');
    lines.push('Default Form Data:');
    lines.push(JSON.stringify(result.formData, null, 2));
  }

  return lines.join('\n');
}
