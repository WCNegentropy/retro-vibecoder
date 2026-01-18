/**
 * Validate CLI command implementation
 *
 * Usage: upg validate <manifest>
 */

import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { validateManifest, type ValidatorResult } from '../schema/validator.js';
import { MANIFEST_FILENAMES, VALIDATION_ERRORS, getLineForPath } from '@retro-vibecoder/shared';

/**
 * Validate command options
 */
export interface ValidateCommandOptions {
  /** Path to manifest file or directory */
  path: string;
  /** Output format */
  format?: 'text' | 'json';
  /** Include warnings in output */
  warnings?: boolean;
  /** Verbose output */
  verbose?: boolean;
}

/**
 * Validate command result
 */
export interface ValidateCommandResult {
  /** Whether validation passed */
  success: boolean;
  /** Path to validated file */
  filePath: string;
  /** Validation result */
  result: ValidatorResult;
  /** Formatted output (for display) */
  output: string;
}

/**
 * Find manifest file in directory
 */
async function findManifestFile(dirPath: string): Promise<string | null> {
  for (const filename of MANIFEST_FILENAMES) {
    const filePath = resolve(dirPath, filename);
    try {
      await readFile(filePath);
      return filePath;
    } catch {
      // File doesn't exist, try next
    }
  }
  return null;
}

/**
 * Format validation result as text
 */
function formatTextOutput(result: ValidatorResult, content: string, verbose: boolean): string {
  const lines: string[] = [];

  if (result.valid) {
    lines.push('✓ Manifest is valid');
  } else {
    lines.push('✗ Manifest validation failed');
    lines.push('');
  }

  // Format errors
  if (result.errors.length > 0) {
    lines.push(`Errors (${result.errors.length}):`);
    for (const error of result.errors) {
      const lineNum = getLineForPath(content, error.path);
      const location = lineNum ? `:${lineNum}` : '';
      lines.push(`  • [${error.code}]${location} ${error.message}`);
      if (verbose) {
        lines.push(`    Path: ${error.path}`);
      }
    }
    lines.push('');
  }

  // Format warnings
  if (result.warnings.length > 0) {
    lines.push(`Warnings (${result.warnings.length}):`);
    for (const warning of result.warnings) {
      lines.push(`  ⚠ [${warning.code}] ${warning.message}`);
      if (warning.suggestion) {
        lines.push(`    Suggestion: ${warning.suggestion}`);
      }
    }
  }

  return lines.join('\n');
}

/**
 * Format validation result as JSON
 */
function formatJsonOutput(result: ValidatorResult, filePath: string): string {
  return JSON.stringify(
    {
      success: result.valid,
      file: filePath,
      errors: result.errors,
      warnings: result.warnings,
    },
    null,
    2
  );
}

/**
 * Execute the validate command
 */
export async function validateCommand(
  options: ValidateCommandOptions
): Promise<ValidateCommandResult> {
  const { path: inputPath, format = 'text', warnings = true, verbose = false } = options;

  // Resolve path
  let filePath = resolve(inputPath);

  // Check if it's a directory
  try {
    const stat = await import('fs/promises').then(fs => fs.stat(filePath));
    if (stat.isDirectory()) {
      const found = await findManifestFile(filePath);
      if (!found) {
        throw new Error(
          `No manifest file found in directory. Expected one of: ${MANIFEST_FILENAMES.join(', ')}`
        );
      }
      filePath = found;
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {
        success: false,
        filePath: inputPath,
        result: {
          valid: false,
          errors: [
            {
              code: VALIDATION_ERRORS.MANIFEST_NOT_FOUND,
              message: `File not found: ${inputPath}`,
              path: 'root',
            },
          ],
          warnings: [],
        },
        output: `Error: File not found: ${inputPath}`,
      };
    }
    throw error;
  }

  // Read file content
  let content: string;
  try {
    content = await readFile(filePath, 'utf-8');
  } catch (error) {
    return {
      success: false,
      filePath,
      result: {
        valid: false,
        errors: [
          {
            code: VALIDATION_ERRORS.MANIFEST_NOT_FOUND,
            message: `Failed to read file: ${(error as Error).message}`,
            path: 'root',
          },
        ],
        warnings: [],
      },
      output: `Error: Failed to read file: ${(error as Error).message}`,
    };
  }

  // Validate manifest
  const result = validateManifest(content, {
    allErrors: true,
    includeWarnings: warnings,
  });

  // Format output
  const output =
    format === 'json'
      ? formatJsonOutput(result, filePath)
      : formatTextOutput(result, content, verbose);

  return {
    success: result.valid,
    filePath,
    result,
    output,
  };
}
