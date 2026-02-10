/**
 * Init command action
 *
 * Creates a new UPG manifest in the current directory.
 */

import { writeFile, access } from 'fs/promises';
import { resolve, basename } from 'path';
import pc from 'picocolors';
import ora from 'ora';
import { stringifyYaml, DEFAULT_MANIFEST_FILENAME } from '@wcnegentropy/shared';

interface InitOptions {
  name?: string;
  force?: boolean;
}

/**
 * Generate a starter manifest
 */
function generateStarterManifest(name: string): object {
  return {
    apiVersion: 'upg/v1',

    metadata: {
      name,
      version: '0.1.0',
      title: `${name} Template`,
      description: 'A new UPG template',
      tags: ['template'],
      author: process.env.USER || 'author',
      license: 'MIT',
      lifecycle: 'experimental',
    },

    prompts: [
      {
        id: 'project_name',
        type: 'string',
        title: 'Project Name',
        message: 'What is your project name?',
        help: 'Used in package.json and generated folder name',
        default: 'my-project',
        required: true,
        validator: '^[a-z0-9][a-z0-9-]*$',
        error_message: 'Project name must be lowercase, alphanumeric, and hyphens only',
      },
      {
        id: 'description',
        type: 'string',
        title: 'Description',
        message: 'Brief description of your project',
        default: '',
        required: false,
      },
      {
        id: 'use_typescript',
        type: 'boolean',
        title: 'TypeScript',
        message: 'Include TypeScript support?',
        default: true,
        help: 'TypeScript adds type safety to your project',
      },
    ],

    actions: [
      {
        type: 'generate',
        src: 'template/',
        dest: './',
        variables: {
          project_name: '{{ project_name }}',
          description: '{{ description }}',
          use_typescript: '{{ use_typescript }}',
        },
      },
    ],

    documentation: {
      quickstart: `
\`\`\`bash
upg generate ${name} --use-defaults
cd my-project
\`\`\`
      `.trim(),
    },
  };
}

/**
 * Execute the init command
 */
export async function initAction(options: InitOptions): Promise<void> {
  const spinner = ora();

  try {
    // Determine template name
    const cwd = process.cwd();
    const defaultName = basename(cwd)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-');
    const name = options.name || defaultName;

    // Check if manifest already exists
    const manifestPath = resolve(cwd, DEFAULT_MANIFEST_FILENAME);

    try {
      await access(manifestPath);
      if (!options.force) {
        console.error(
          pc.red(`Error: ${DEFAULT_MANIFEST_FILENAME} already exists. Use --force to overwrite.`)
        );
        process.exit(1);
      }
    } catch {
      // File doesn't exist, which is what we want
    }

    spinner.start(`Creating ${DEFAULT_MANIFEST_FILENAME}...`);

    // Generate manifest
    const manifest = generateStarterManifest(name);
    const content = stringifyYaml(manifest);

    // Write file
    await writeFile(manifestPath, content);

    spinner.succeed(`Created ${DEFAULT_MANIFEST_FILENAME}`);

    console.log('');
    console.log(pc.green('Template initialized successfully!'));
    console.log('');
    console.log('Next steps:');
    console.log(`  1. Edit ${pc.cyan(DEFAULT_MANIFEST_FILENAME)} to customize your template`);
    console.log(`  2. Create a ${pc.cyan('template/')} directory with your template files`);
    console.log(`  3. Run ${pc.cyan('upg validate .')} to validate your manifest`);
    console.log(`  4. Run ${pc.cyan('upg test .')} to test your template`);
    console.log('');
  } catch (error) {
    spinner.fail('Initialization failed');
    console.error(pc.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}
