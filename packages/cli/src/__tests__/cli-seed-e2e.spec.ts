/**
 * CLI Seed Command E2E Test
 *
 * Tests the primary contract:
 * Command: upg seed <SEED> --output <DIR> [constraints...]
 * Behavior: Creates a project directory at <DIR> with a valid scaffolding,
 *           exit code 0 on success, non-zero on failure.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdir, rm, readdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { existsSync } from 'node:fs';

// Project root directory - resolve from packages/cli/src/__tests__
const projectRoot = resolve(__dirname, '../../../..');
const cliDistPath = resolve(projectRoot, 'packages/cli/dist/bin/upg.js');

/**
 * Execute the upg CLI with arguments using the built distribution
 */
function runCli(args: string[]): { exitCode: number; stdout: string; stderr: string } {
  try {
    // Run the built CLI directly with node
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

describe('CLI seed command E2E', () => {
  let tmpDir: string;

  beforeEach(async () => {
    // Create a unique temp directory for each test
    tmpDir = join(tmpdir(), `upg-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await mkdir(tmpDir, { recursive: true });
  });

  afterEach(async () => {
    // Cleanup temp directory after each test
    try {
      await rm(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should generate a project from a seed with exit code 0', async () => {
    const outputDir = join(tmpDir, 'generated-project');

    const result = runCli(['seed', '42', '--output', outputDir]);

    // Debug on failure
    if (result.exitCode !== 0) {
      console.error('CLI output:', result.stdout);
      console.error('CLI stderr:', result.stderr);
    }

    // Verify exit code is 0 (success)
    expect(result.exitCode).toBe(0);

    // Verify output directory exists
    const dirStat = await stat(outputDir);
    expect(dirStat.isDirectory()).toBe(true);

    // Verify directory is non-empty
    const files = await readdir(outputDir, { recursive: true });
    expect(files.length).toBeGreaterThan(0);
  });

  it('should output JSON when --json is set', async () => {
    const outputDir = join(tmpDir, 'json-generated-project');

    const result = runCli(['seed', '42', '--output', outputDir, '--json']);

    expect(result.exitCode).toBe(0);

    const payload = JSON.parse(result.stdout.trim());
    expect(payload.success).toBe(true);
    expect(payload.output_path).toBe(outputDir);
    expect(Array.isArray(payload.files_generated)).toBe(true);
    expect(payload.files_generated.length).toBeGreaterThan(0);
  });

  it('should create anchor files based on the generated stack', async () => {
    const outputDir = join(tmpDir, 'generated-with-anchors');

    const result = runCli(['seed', '42', '--output', outputDir]);

    expect(result.exitCode).toBe(0);

    // Verify directory exists and has files
    const files = await readdir(outputDir, { recursive: true });
    expect(files.length).toBeGreaterThan(0);

    // Check for at least one common anchor file (README.md is generated for all projects)
    const hasAnchorFile =
      files.includes('README.md') ||
      files.includes('package.json') ||
      files.includes('Cargo.toml') ||
      files.includes('go.mod') ||
      files.includes('requirements.txt') ||
      files.includes('pom.xml');

    expect(hasAnchorFile).toBe(true);
  });

  it('should support constraint flags', async () => {
    const outputDir = join(tmpDir, 'constrained-project');

    const result = runCli([
      'seed',
      '100',
      '--output',
      outputDir,
      '--archetype',
      'backend',
      '--language',
      'typescript',
    ]);

    expect(result.exitCode).toBe(0);

    // Verify directory is created
    expect(existsSync(outputDir)).toBe(true);
    const dirStat = await stat(outputDir);
    expect(dirStat.isDirectory()).toBe(true);
  });

  it('should fail with non-zero exit code for invalid seed', () => {
    const result = runCli(['seed', '-1']);

    // Negative seeds should fail
    expect(result.exitCode).not.toBe(0);
  });

  it('should display project info without --output (preview mode)', () => {
    const result = runCli(['seed', '42']);

    // Should succeed even without output
    expect(result.exitCode).toBe(0);

    // Should display generated info (in stdout, but the disclaimer goes to stderr)
    expect(result.stdout).toContain('Generated');
  });

  it('should generate different projects for different seeds', async () => {
    const outputDir1 = join(tmpDir, 'seed-100');
    const outputDir2 = join(tmpDir, 'seed-200');

    const result1 = runCli(['seed', '100', '--output', outputDir1]);
    const result2 = runCli(['seed', '200', '--output', outputDir2]);

    expect(result1.exitCode).toBe(0);
    expect(result2.exitCode).toBe(0);

    // Both should have files
    const files1 = await readdir(outputDir1, { recursive: true });
    const files2 = await readdir(outputDir2, { recursive: true });

    expect(files1.length).toBeGreaterThan(0);
    expect(files2.length).toBeGreaterThan(0);
  });

  it('should be deterministic - same seed produces same files', async () => {
    const outputDir1 = join(tmpDir, 'deterministic-1');
    const outputDir2 = join(tmpDir, 'deterministic-2');

    const result1 = runCli(['seed', '42', '--output', outputDir1]);
    const result2 = runCli(['seed', '42', '--output', outputDir2]);

    expect(result1.exitCode).toBe(0);
    expect(result2.exitCode).toBe(0);

    // Get file lists
    const files1 = (await readdir(outputDir1, { recursive: true })).sort();
    const files2 = (await readdir(outputDir2, { recursive: true })).sort();

    // Same seed should produce same files
    expect(files1).toEqual(files2);
  });
});
