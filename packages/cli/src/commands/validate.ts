/**
 * Validate command action
 */

import { validateCommand } from '@retro-vibecoder/core';
import pc from 'picocolors';

interface ValidateOptions {
  format: 'text' | 'json';
  warnings: boolean;
  verbose: boolean;
}

/**
 * Execute the validate command
 */
export async function validateAction(
  manifest: string,
  options: ValidateOptions
): Promise<void> {
  try {
    const result = await validateCommand({
      path: manifest,
      format: options.format,
      warnings: options.warnings,
      verbose: options.verbose,
    });

    // Output the result
    console.log(result.output);

    // Set exit code based on success
    if (!result.success) {
      process.exit(1);
    }
  } catch (error) {
    console.error(pc.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}
