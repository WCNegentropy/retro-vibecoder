/**
 * Validate command action
 */

import { validateCommand } from '@wcnegentropy/core';
import pc from 'picocolors';

interface ValidateOptions {
  format: 'text' | 'json';
  warnings: boolean;
  verbose: boolean;
}

/**
 * Execute the validate command
 */
export async function validateAction(manifest: string, options: ValidateOptions): Promise<void> {
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
    const msg = (error as Error).message;
    console.error(pc.red(`Error: ${msg}`));
    if (msg.includes('ENOENT') || msg.includes('no such file')) {
      console.error(pc.dim('→ Check that the file path is correct and the file exists.'));
    } else if (msg.includes('YAML') || msg.includes('yaml') || msg.includes('parse')) {
      console.error(
        pc.dim('→ Check your manifest for YAML syntax errors (indentation, colons, quotes).')
      );
    } else {
      console.error(pc.dim('→ Run "upg validate <manifest> --verbose" for more details.'));
    }
    process.exit(1);
  }
}
