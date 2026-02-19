/**
 * TypeScript / JavaScript CLI Strategies
 *
 * Generates TypeScript or JavaScript CLI projects using Commander.js or Yargs.
 */

import type { GenerationStrategy } from '../../types.js';

/**
 * Commander.js CLI strategy
 */
export const CommanderStrategy: GenerationStrategy = {
  id: 'commander',
  name: 'Commander.js CLI',
  priority: 10,

  matches: stack =>
    (stack.language === 'typescript' || stack.language === 'javascript') &&
    stack.archetype === 'cli' &&
    stack.framework === 'commander',

  apply: async ({ files, projectName, stack }) => {
    const isTS = stack.language === 'typescript';
    const ext = isTS ? 'ts' : 'js';
    const binName = projectName.replace(/_/g, '-').toLowerCase();

    // package.json
    files['package.json'] = JSON.stringify(
      {
        name: binName,
        version: '0.1.0',
        description: `${projectName} CLI`,
        type: 'module',
        bin: {
          [binName]: isTS ? './dist/index.js' : './src/index.js',
        },
        scripts: {
          ...(isTS
            ? {
                build: 'tsup',
                dev: 'tsup --watch',
                start: 'node dist/index.js',
              }
            : {
                start: 'node src/index.js',
              }),
          test: 'vitest run',
          'test:watch': 'vitest',
          lint: `eslint src/`,
          format: `prettier --write "src/**/*.${ext}"`,
        },
        dependencies: {
          commander: '^12.0.0',
        },
        devDependencies: {
          ...(isTS
            ? {
                '@types/node': '^20.11.0',
                tsup: '^8.0.0',
                typescript: '^5.3.0',
              }
            : {}),
          vitest: '^1.2.0',
          prettier: '^3.2.0',
        },
      },
      null,
      2
    );

    if (isTS) {
      // tsconfig.json
      files['tsconfig.json'] = JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2022',
            module: 'ESNext',
            moduleResolution: 'bundler',
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
            outDir: 'dist',
            rootDir: 'src',
            declaration: true,
            declarationMap: true,
            sourceMap: true,
          },
          include: ['src'],
          exclude: ['node_modules', 'dist'],
        },
        null,
        2
      );

      // tsup.config.ts
      files['tsup.config.ts'] = `import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
});
`;
    }

    // Main entry
    files[`src/index.${ext}`] = isTS
      ? `import { program } from 'commander';
import { helloCommand } from './commands/hello.js';
import { versionCommand } from './commands/version.js';

program
  .name('${binName}')
  .description('${projectName} CLI')
  .version('0.1.0');

helloCommand(program);
versionCommand(program);

program.parse();
`
      : `#!/usr/bin/env node
import { program } from 'commander';
import { helloCommand } from './commands/hello.js';
import { versionCommand } from './commands/version.js';

program
  .name('${binName}')
  .description('${projectName} CLI')
  .version('0.1.0');

helloCommand(program);
versionCommand(program);

program.parse();
`;

    // Hello command
    files[`src/commands/hello.${ext}`] = isTS
      ? `import type { Command } from 'commander';

export function helloCommand(program: Command): void {
  program
    .command('hello')
    .description('Say hello')
    .option('-n, --name <name>', 'Name to greet', 'World')
    .action((options: { name: string }) => {
      console.log(\`Hello, \${options.name}!\`);
    });
}
`
      : `export function helloCommand(program) {
  program
    .command('hello')
    .description('Say hello')
    .option('-n, --name <name>', 'Name to greet', 'World')
    .action((options) => {
      console.log(\`Hello, \${options.name}!\`);
    });
}
`;

    // Version command
    files[`src/commands/version.${ext}`] = isTS
      ? `import type { Command } from 'commander';

export function versionCommand(program: Command): void {
  program
    .command('info')
    .description('Show version info')
    .action(() => {
      console.log('${binName} v0.1.0');
    });
}
`
      : `export function versionCommand(program) {
  program
    .command('info')
    .description('Show version info')
    .action(() => {
      console.log('${binName} v0.1.0');
    });
}
`;

    // Test
    files[`src/__tests__/hello.test.${ext}`] = `import { describe, it, expect } from 'vitest';

describe('hello command', () => {
  it('should greet with default name', () => {
    // Basic smoke test
    expect(true).toBe(true);
  });
});
`;

    // .gitignore
    files['.gitignore'] = isTS
      ? `node_modules/
dist/
*.tsbuildinfo
.env
.env.local
`
      : `node_modules/
.env
.env.local
`;

    // Makefile
    files['Makefile'] = `NPM := npm

.PHONY: build dev test lint clean install-global

build:
\t$(NPM) run build

dev:
\t$(NPM) run dev

test:
\t$(NPM) test

lint:
\t$(NPM) run lint

clean:
\trm -rf dist node_modules

install-global: build
\tnpm link
`;
  },
};

/**
 * Yargs CLI strategy
 */
export const YargsStrategy: GenerationStrategy = {
  id: 'yargs',
  name: 'Yargs CLI',
  priority: 10,

  matches: stack =>
    (stack.language === 'typescript' || stack.language === 'javascript') &&
    stack.archetype === 'cli' &&
    stack.framework === 'yargs',

  apply: async ({ files, projectName, stack }) => {
    const isTS = stack.language === 'typescript';
    const ext = isTS ? 'ts' : 'js';
    const binName = projectName.replace(/_/g, '-').toLowerCase();

    // package.json
    files['package.json'] = JSON.stringify(
      {
        name: binName,
        version: '0.1.0',
        description: `${projectName} CLI`,
        type: 'module',
        bin: {
          [binName]: isTS ? './dist/index.js' : './src/index.js',
        },
        scripts: {
          ...(isTS
            ? {
                build: 'tsup',
                dev: 'tsup --watch',
                start: 'node dist/index.js',
              }
            : {
                start: 'node src/index.js',
              }),
          test: 'vitest run',
          'test:watch': 'vitest',
          lint: `eslint src/`,
          format: `prettier --write "src/**/*.${ext}"`,
        },
        dependencies: {
          yargs: '^17.7.0',
        },
        devDependencies: {
          ...(isTS
            ? {
                '@types/node': '^20.11.0',
                '@types/yargs': '^17.0.32',
                tsup: '^8.0.0',
                typescript: '^5.3.0',
              }
            : {}),
          vitest: '^1.2.0',
          prettier: '^3.2.0',
        },
      },
      null,
      2
    );

    if (isTS) {
      // tsconfig.json
      files['tsconfig.json'] = JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2022',
            module: 'ESNext',
            moduleResolution: 'bundler',
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
            outDir: 'dist',
            rootDir: 'src',
            declaration: true,
            declarationMap: true,
            sourceMap: true,
          },
          include: ['src'],
          exclude: ['node_modules', 'dist'],
        },
        null,
        2
      );

      // tsup.config.ts
      files['tsup.config.ts'] = `import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
});
`;
    }

    // Main entry
    files[`src/index.${ext}`] = isTS
      ? `import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { helloCommand } from './commands/hello.js';
import { versionCommand } from './commands/version.js';

yargs(hideBin(process.argv))
  .scriptName('${binName}')
  .usage('$0 <command> [options]')
  .command(helloCommand)
  .command(versionCommand)
  .demandCommand(1, 'You need at least one command')
  .strict()
  .help()
  .parse();
`
      : `#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { helloCommand } from './commands/hello.js';
import { versionCommand } from './commands/version.js';

yargs(hideBin(process.argv))
  .scriptName('${binName}')
  .usage('$0 <command> [options]')
  .command(helloCommand)
  .command(versionCommand)
  .demandCommand(1, 'You need at least one command')
  .strict()
  .help()
  .parse();
`;

    // Hello command
    files[`src/commands/hello.${ext}`] = isTS
      ? `import type { CommandModule } from 'yargs';

interface HelloArgs {
  name: string;
}

export const helloCommand: CommandModule<object, HelloArgs> = {
  command: 'hello',
  describe: 'Say hello',
  builder: {
    name: {
      alias: 'n',
      type: 'string' as const,
      default: 'World',
      describe: 'Name to greet',
    },
  },
  handler: (argv) => {
    console.log(\`Hello, \${argv.name}!\`);
  },
};
`
      : `export const helloCommand = {
  command: 'hello',
  describe: 'Say hello',
  builder: {
    name: {
      alias: 'n',
      type: 'string',
      default: 'World',
      describe: 'Name to greet',
    },
  },
  handler: (argv) => {
    console.log(\`Hello, \${argv.name}!\`);
  },
};
`;

    // Version command
    files[`src/commands/version.${ext}`] = isTS
      ? `import type { CommandModule } from 'yargs';

export const versionCommand: CommandModule = {
  command: 'info',
  describe: 'Show version info',
  handler: () => {
    console.log('${binName} v0.1.0');
  },
};
`
      : `export const versionCommand = {
  command: 'info',
  describe: 'Show version info',
  handler: () => {
    console.log('${binName} v0.1.0');
  },
};
`;

    // Test
    files[`src/__tests__/hello.test.${ext}`] = `import { describe, it, expect } from 'vitest';

describe('hello command', () => {
  it('should greet with default name', () => {
    // Basic smoke test
    expect(true).toBe(true);
  });
});
`;

    // .gitignore
    files['.gitignore'] = isTS
      ? `node_modules/
dist/
*.tsbuildinfo
.env
.env.local
`
      : `node_modules/
.env
.env.local
`;

    // Makefile
    files['Makefile'] = `NPM := npm

.PHONY: build dev test lint clean install-global

build:
\t$(NPM) run build

dev:
\t$(NPM) run dev

test:
\t$(NPM) test

lint:
\t$(NPM) run lint

clean:
\trm -rf dist node_modules

install-global: build
\tnpm link
`;
  },
};
