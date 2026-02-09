/**
 * TypeScript Library Strategy
 *
 * Generates TypeScript/JavaScript library packages for npm.
 */

import type { GenerationStrategy } from '../../types.js';

/**
 * TypeScript/JavaScript library strategy
 */
export const TypeScriptLibraryStrategy: GenerationStrategy = {
  id: 'library-typescript',
  name: 'TypeScript Library',
  priority: 10,

  matches: stack =>
    stack.archetype === 'library' &&
    (stack.language === 'typescript' || stack.language === 'javascript'),

  apply: async ({ files, projectName, stack }) => {
    const isTypeScript = stack.language === 'typescript';
    const ext = isTypeScript ? 'ts' : 'js';

    // package.json
    const devDeps: Record<string, string> = {
      vitest: '^1.2.0',
      prettier: '^3.2.0',
    };
    if (isTypeScript) {
      devDeps['typescript'] = '^5.3.0';
      devDeps['tsup'] = '^8.0.0';
      devDeps['@types/node'] = '^20.11.0';
    }

    files['package.json'] = JSON.stringify(
      {
        name: projectName,
        version: '0.1.0',
        description: `${projectName} library`,
        type: 'module',
        main: isTypeScript ? './dist/index.js' : './src/index.js',
        module: isTypeScript ? './dist/index.js' : './src/index.js',
        types: isTypeScript ? './dist/index.d.ts' : undefined,
        exports: {
          '.': {
            types: isTypeScript ? './dist/index.d.ts' : undefined,
            import: isTypeScript ? './dist/index.js' : './src/index.js',
          },
        },
        files: isTypeScript ? ['dist'] : ['src'],
        scripts: {
          ...(isTypeScript ? { build: 'tsup' } : {}),
          test: 'vitest run',
          'test:watch': 'vitest',
          lint: `eslint src/`,
          format: `prettier --write "src/**/*.${ext}"`,
          ...(isTypeScript ? { prepublishOnly: 'npm run build' } : {}),
        },
        devDependencies: devDeps,
        keywords: [],
        license: 'MIT',
      },
      null,
      2
    );

    if (isTypeScript) {
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
});
`;
    }

    // Source files
    files[`src/index.${ext}`] = isTypeScript
      ? `export { greet, add } from './lib.js';
export type { GreetOptions } from './lib.js';
`
      : `export { greet, add } from './lib.js';
`;

    files[`src/lib.${ext}`] = isTypeScript
      ? `/**
 * Options for the greet function.
 */
export interface GreetOptions {
  name: string;
  greeting?: string;
}

/**
 * Generate a greeting message.
 */
export function greet(options: GreetOptions): string {
  const { name, greeting = 'Hello' } = options;
  return \`\${greeting}, \${name}!\`;
}

/**
 * Add two numbers.
 */
export function add(a: number, b: number): number {
  return a + b;
}
`
      : `/**
 * Generate a greeting message.
 * @param {object} options
 * @param {string} options.name
 * @param {string} [options.greeting='Hello']
 * @returns {string}
 */
export function greet({ name, greeting = 'Hello' }) {
  return \`\${greeting}, \${name}!\`;
}

/**
 * Add two numbers.
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
export function add(a, b) {
  return a + b;
}
`;

    // Tests
    files[`tests/lib.test.${ext}`] = `import { describe, it, expect } from 'vitest';
import { greet, add } from '../src/lib.js';

describe('greet', () => {
  it('should greet with default greeting', () => {
    expect(greet({ name: 'World' })).toBe('Hello, World!');
  });

  it('should greet with custom greeting', () => {
    expect(greet({ name: 'World', greeting: 'Hi' })).toBe('Hi, World!');
  });
});

describe('add', () => {
  it('should add two numbers', () => {
    expect(add(1, 2)).toBe(3);
  });
});
`;

    // .gitignore
    files['.gitignore'] = `node_modules/
dist/
*.tsbuildinfo
.env
`;

    // Makefile
    files['Makefile'] = `NPM := npm

.PHONY: build test lint format clean

${isTypeScript ? 'build:\n\t$(NPM) run build\n\n' : ''}test:
\t$(NPM) test

lint:
\t$(NPM) run lint

format:
\t$(NPM) run format

clean:
\trm -rf dist node_modules
`;
  },
};
