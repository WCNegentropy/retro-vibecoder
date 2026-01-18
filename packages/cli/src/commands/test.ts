/**
 * Test command action
 */

import { testGenerateCommand } from '@retro-vibecoder/core';
import pc from 'picocolors';

interface TestOptions {
  data?: string;
  format: 'text' | 'json';
  verbose: boolean;
}

/**
 * Execute the test command
 */
export async function testAction(
  manifest: string,
  options: TestOptions
): Promise<void> {
  try {
    const result = await testGenerateCommand({
      manifestPath: manifest,
      data: options.data,
      format: options.format,
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
