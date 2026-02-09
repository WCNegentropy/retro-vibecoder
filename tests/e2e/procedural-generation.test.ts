/**
 * Procedural Generation E2E Tests
 *
 * Tests that generated projects are buildable and runnable.
 * Validates the complete pipeline:
 *   seed → stack resolution → pick template set → render with Nunjucks → write to disk → build
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdir, rm, readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { existsSync } from 'node:fs';

// Project root directory - resolve from tests/e2e/
const projectRoot = resolve(__dirname, '../..');
const cliDistPath = resolve(projectRoot, 'packages/cli/dist/bin/upg.js');

/**
 * Execute the upg CLI with arguments using the built distribution
 */
function runCli(args: string[]): { exitCode: number; stdout: string; stderr: string } {
  try {
    const result = spawnSync('node', [cliDistPath, ...args], {
      cwd: projectRoot,
      encoding: 'utf-8',
      env: { ...process.env, NO_COLOR: '1' },
      timeout: 60000,
    });

    return {
      exitCode: result.status ?? 0,
      stdout: result.stdout || '',
      stderr: result.stderr || '',
    };
  } catch (error) {
    return {
      exitCode: 1,
      stdout: '',
      stderr: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Run a command in a directory and return the result
 */
function runInDir(
  dir: string,
  cmd: string,
  args: string[],
  timeoutMs: number = 120000
): { exitCode: number; stdout: string; stderr: string } {
  const result = spawnSync(cmd, args, {
    cwd: dir,
    encoding: 'utf-8',
    timeout: timeoutMs,
    env: { ...process.env, NO_COLOR: '1' },
  });

  return {
    exitCode: result.status ?? 1,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

describe('Procedural Generation E2E', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = join(tmpdir(), `upg-e2e-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await mkdir(tmpDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await rm(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('TypeScript/Express backend', () => {
    it('should generate a buildable TypeScript/Express project', async () => {
      const outputDir = join(tmpDir, 'ts-express');

      // Generate project
      const genResult = runCli([
        'seed',
        '42',
        '--archetype',
        'backend',
        '--language',
        'typescript',
        '--framework',
        'express',
        '--output',
        outputDir,
      ]);

      expect(genResult.exitCode).toBe(0);
      expect(existsSync(outputDir)).toBe(true);

      // Verify project structure
      const files = await readdir(outputDir, { recursive: true });
      expect(files).toContain('package.json');
      expect(files).toContain('tsconfig.json');

      // Verify package.json is valid JSON with correct scripts
      const pkgJson = JSON.parse(await readFile(join(outputDir, 'package.json'), 'utf-8'));
      expect(pkgJson.scripts.build).toBeDefined();
      expect(pkgJson.scripts.start).toBeDefined();
      expect(pkgJson.dependencies.express).toBeDefined();

      // npm install
      const installResult = runInDir(outputDir, 'npm', ['install']);
      expect(installResult.exitCode).toBe(0);

      // Build (tsup)
      const buildResult = runInDir(outputDir, 'npx', ['tsup']);
      expect(buildResult.exitCode).toBe(0);
      expect(existsSync(join(outputDir, 'dist', 'index.js'))).toBe(true);

      // Start and verify it runs (with timeout)
      const startResult = spawnSync('node', ['dist/index.js'], {
        cwd: outputDir,
        encoding: 'utf-8',
        timeout: 5000,
      });
      // Exit code null means the server started but was killed by timeout
      // stdout/stderr should contain server started message
      const serverStarted =
        startResult.status === null ||
        (startResult.stdout || '').includes('running') ||
        (startResult.stderr || '').includes('listening');
      expect(serverStarted).toBe(true);
    }, 120000);
  });

  describe('TypeScript/Fastify backend', () => {
    it('should generate a buildable TypeScript/Fastify project', async () => {
      const outputDir = join(tmpDir, 'ts-fastify');

      // Generate project - seed 42 with typescript backend gives fastify by default
      const genResult = runCli([
        'seed',
        '42',
        '--archetype',
        'backend',
        '--language',
        'typescript',
        '--output',
        outputDir,
      ]);

      expect(genResult.exitCode).toBe(0);
      expect(existsSync(outputDir)).toBe(true);

      // Verify package.json
      const pkgJson = JSON.parse(await readFile(join(outputDir, 'package.json'), 'utf-8'));
      expect(pkgJson.scripts.build).toBeDefined();
      expect(pkgJson.scripts.start).toBeDefined();

      // npm install
      const installResult = runInDir(outputDir, 'npm', ['install']);
      expect(installResult.exitCode).toBe(0);

      // Build
      const buildResult = runInDir(outputDir, 'npx', ['tsup']);
      expect(buildResult.exitCode).toBe(0);
      expect(existsSync(join(outputDir, 'dist', 'index.js'))).toBe(true);
    }, 120000);
  });

  describe('Template-based rendering', () => {
    it('should use Nunjucks templates for Tier 1 stacks', async () => {
      const outputDir = join(tmpDir, 'template-check');

      const genResult = runCli([
        'seed',
        '42',
        '--archetype',
        'backend',
        '--language',
        'typescript',
        '--framework',
        'express',
        '--output',
        outputDir,
        '--verbose',
      ]);

      expect(genResult.exitCode).toBe(0);
      // Verbose output should indicate Nunjucks template source
      expect(genResult.stdout).toContain('Nunjucks');
    });

    it('should produce deterministic output for the same seed', async () => {
      const outputDir1 = join(tmpDir, 'deterministic-1');
      const outputDir2 = join(tmpDir, 'deterministic-2');

      const result1 = runCli([
        'seed',
        '42',
        '--archetype',
        'backend',
        '--language',
        'typescript',
        '--framework',
        'express',
        '--output',
        outputDir1,
      ]);

      const result2 = runCli([
        'seed',
        '42',
        '--archetype',
        'backend',
        '--language',
        'typescript',
        '--framework',
        'express',
        '--output',
        outputDir2,
      ]);

      expect(result1.exitCode).toBe(0);
      expect(result2.exitCode).toBe(0);

      // Compare file contents
      const files1 = (await readdir(outputDir1, { recursive: true })).sort();
      const files2 = (await readdir(outputDir2, { recursive: true })).sort();
      expect(files1).toEqual(files2);

      // Compare a key file's content
      const pkg1 = await readFile(join(outputDir1, 'package.json'), 'utf-8');
      const pkg2 = await readFile(join(outputDir2, 'package.json'), 'utf-8');
      expect(pkg1).toBe(pkg2);
    });
  });
});
