/**
 * Tests for JavaScript CLI strategy support (B2/B4).
 * Ensures CommanderStrategy and YargsStrategy match and generate
 * correct output for both TypeScript and JavaScript stacks.
 */

import { describe, it, expect } from 'vitest';
import { CommanderStrategy, YargsStrategy } from '../strategies/cli/typescript.js';
import type { TechStack, GenerationContext } from '../types.js';

const JS_CLI_STACK: Partial<TechStack> = {
  language: 'javascript',
  archetype: 'cli',
  framework: 'commander',
};

const TS_CLI_STACK: Partial<TechStack> = {
  language: 'typescript',
  archetype: 'cli',
  framework: 'commander',
};

const mockRng: GenerationContext['rng'] = {
  pick: <T>(items: readonly T[]): T => items[0],
  pickWeighted: <T>(items: readonly { value: T; weight: number }[]): T => items[0].value,
  float: () => 0.5,
  int: () => 0,
  bool: () => false,
};

describe('CLI strategy JS/TS matching', () => {
  it('CommanderStrategy matches javascript', () => {
    expect(CommanderStrategy.matches(JS_CLI_STACK as TechStack)).toBe(true);
  });

  it('CommanderStrategy matches typescript', () => {
    expect(CommanderStrategy.matches(TS_CLI_STACK as TechStack)).toBe(true);
  });

  it('YargsStrategy matches javascript', () => {
    const stack = { ...JS_CLI_STACK, framework: 'yargs' } as TechStack;
    expect(YargsStrategy.matches(stack)).toBe(true);
  });

  it('YargsStrategy matches typescript', () => {
    const stack = { ...TS_CLI_STACK, framework: 'yargs' } as TechStack;
    expect(YargsStrategy.matches(stack)).toBe(true);
  });
});

describe('JS Commander generates .js files, no tsconfig', () => {
  it('should produce JS files and omit TS-only artifacts', async () => {
    const files: Record<string, string> = {};
    await CommanderStrategy.apply({
      stack: JS_CLI_STACK as TechStack,
      files,
      projectName: 'test-cli',
      rng: mockRng,
    });

    // JS source files exist
    expect(files['src/index.js']).toBeDefined();
    expect(files['src/commands/hello.js']).toBeDefined();
    expect(files['src/commands/version.js']).toBeDefined();
    expect(files['src/__tests__/hello.test.js']).toBeDefined();

    // TS-only files are omitted
    expect(files['tsconfig.json']).toBeUndefined();
    expect(files['tsup.config.ts']).toBeUndefined();
    expect(files['src/index.ts']).toBeUndefined();

    // package.json has no TS devDeps
    expect(files['package.json']).toBeDefined();
    const pkg = JSON.parse(files['package.json']);
    expect(pkg.devDependencies['@types/node']).toBeUndefined();
    expect(pkg.devDependencies['tsup']).toBeUndefined();
    expect(pkg.devDependencies['typescript']).toBeUndefined();

    // JS bin points to src directly
    expect(pkg.bin['test-cli']).toBe('./src/index.js');

    // JS entry has shebang
    expect(files['src/index.js']).toContain('#!/usr/bin/env node');
  });
});

describe('TS Commander still generates TS files (regression)', () => {
  it('should produce TS files with tsconfig and tsup', async () => {
    const files: Record<string, string> = {};
    await CommanderStrategy.apply({
      stack: TS_CLI_STACK as TechStack,
      files,
      projectName: 'test-cli',
      rng: mockRng,
    });

    // TS source files exist
    expect(files['src/index.ts']).toBeDefined();
    expect(files['src/commands/hello.ts']).toBeDefined();
    expect(files['tsconfig.json']).toBeDefined();
    expect(files['tsup.config.ts']).toBeDefined();

    // package.json has TS devDeps
    const pkg = JSON.parse(files['package.json']);
    expect(pkg.devDependencies['@types/node']).toBeDefined();
    expect(pkg.devDependencies['tsup']).toBeDefined();
    expect(pkg.devDependencies['typescript']).toBeDefined();

    // TS bin points to dist
    expect(pkg.bin['test-cli']).toBe('./dist/index.js');
  });
});

describe('JS Yargs generates .js files, no tsconfig', () => {
  it('should produce JS files and omit TS-only artifacts', async () => {
    const files: Record<string, string> = {};
    await YargsStrategy.apply({
      stack: { ...JS_CLI_STACK, framework: 'yargs' } as TechStack,
      files,
      projectName: 'test-yargs',
      rng: mockRng,
    });

    // JS source files exist
    expect(files['src/index.js']).toBeDefined();
    expect(files['src/commands/hello.js']).toBeDefined();

    // TS-only files are omitted
    expect(files['tsconfig.json']).toBeUndefined();
    expect(files['tsup.config.ts']).toBeUndefined();

    // package.json has no TS devDeps
    const pkg = JSON.parse(files['package.json']);
    expect(pkg.devDependencies['@types/node']).toBeUndefined();
    expect(pkg.devDependencies['@types/yargs']).toBeUndefined();
    expect(pkg.devDependencies['tsup']).toBeUndefined();
    expect(pkg.devDependencies['typescript']).toBeUndefined();

    // JS commands don't have type imports
    expect(files['src/commands/hello.js']).not.toContain('import type');
    expect(files['src/commands/hello.js']).not.toContain('CommandModule');
  });
});
