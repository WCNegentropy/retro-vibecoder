/**
 * Test command action
 */

import { testGenerateCommand } from '@wcnegentropy/core';
import pc from 'picocolors';

interface TestOptions {
  data?: string;
  format: 'text' | 'json';
  verbose: boolean;
}

/**
 * Execute the test command
 */
export async function testAction(manifest: string, options: TestOptions): Promise<void> {
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
    const msg = (error as Error).message;
    console.error(pc.red(`Error: ${msg}`));
    if (msg.includes('ENOENT') || msg.includes('no such file')) {
      console.error(pc.dim('→ Check that the manifest file path is correct.'));
    } else if (msg.includes('YAML') || msg.includes('yaml') || msg.includes('parse')) {
      console.error(pc.dim('→ Check your manifest for YAML syntax errors.'));
    } else {
      console.error(pc.dim('→ Run "upg validate <manifest>" first to check for issues.'));
    }
    process.exit(1);
  }
}
