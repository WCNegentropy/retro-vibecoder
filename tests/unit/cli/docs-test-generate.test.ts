/**
 * Docs-gen and test-generate CLI command tests
 *
 * Tests for Bug 1: EISDIR fix - both commands should resolve directories
 * to manifest files the same way validate does.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { mkdir, writeFile, rm } from 'fs/promises';
import { docsGenCommand, testGenerateCommand } from '@wcnegentropy/core';

const FIXTURES_DIR = join(__dirname, '../../__fixtures__/manifests');
const TEMP_DIR = join(__dirname, '../../__temp__/docs-test-gen');

const VALID_MANIFEST = `
apiVersion: upg/v1
metadata:
  name: test-template
  version: "1.0.0"
  description: Test template for directory resolution
prompts:
  - id: name
    type: string
    message: Name?
actions:
  - type: generate
    src: template/
    dest: ./
`;

describe('docsGenCommand', () => {
  describe('with file path', () => {
    it('generates docs from a valid manifest file', async () => {
      const result = await docsGenCommand({
        manifestPath: join(FIXTURES_DIR, 'valid/simple.upg.yaml'),
      });

      expect(result.success).toBe(true);
      expect(result.content).toBeTruthy();
      expect(result.error).toBeUndefined();
    });

    it('returns error for non-existent file', async () => {
      const result = await docsGenCommand({
        manifestPath: '/nonexistent/path/to/manifest.yaml',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('with directory path (Bug 1 fix)', () => {
    beforeEach(async () => {
      await mkdir(TEMP_DIR, { recursive: true });
    });

    afterEach(async () => {
      await rm(TEMP_DIR, { recursive: true, force: true });
    });

    it('resolves upg.yaml in directory', async () => {
      await writeFile(join(TEMP_DIR, 'upg.yaml'), VALID_MANIFEST);

      const result = await docsGenCommand({
        manifestPath: TEMP_DIR,
      });

      expect(result.success).toBe(true);
      expect(result.content).toContain('test-template');
    });

    it('resolves upg.yml in directory', async () => {
      await writeFile(join(TEMP_DIR, 'upg.yml'), VALID_MANIFEST);

      const result = await docsGenCommand({
        manifestPath: TEMP_DIR,
      });

      expect(result.success).toBe(true);
      expect(result.content).toContain('test-template');
    });

    it('returns error if no manifest in directory', async () => {
      const result = await docsGenCommand({
        manifestPath: TEMP_DIR,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No manifest file found');
    });
  });
});

describe('testGenerateCommand', () => {
  describe('with file path', () => {
    it('test-generates from a valid manifest file', async () => {
      const result = await testGenerateCommand({
        manifestPath: join(FIXTURES_DIR, 'valid/simple.upg.yaml'),
      });

      expect(result.success).toBe(true);
      expect(result.validationPassed).toBe(true);
      expect(result.transpilationPassed).toBe(true);
    });

    it('returns error for non-existent file', async () => {
      const result = await testGenerateCommand({
        manifestPath: '/nonexistent/path/to/manifest.yaml',
      });

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('with directory path (Bug 1 fix)', () => {
    beforeEach(async () => {
      await mkdir(TEMP_DIR, { recursive: true });
    });

    afterEach(async () => {
      await rm(TEMP_DIR, { recursive: true, force: true });
    });

    it('resolves upg.yaml in directory', async () => {
      await writeFile(join(TEMP_DIR, 'upg.yaml'), VALID_MANIFEST);

      const result = await testGenerateCommand({
        manifestPath: TEMP_DIR,
      });

      expect(result.success).toBe(true);
      expect(result.validationPassed).toBe(true);
    });

    it('resolves upg.yml in directory', async () => {
      await writeFile(join(TEMP_DIR, 'upg.yml'), VALID_MANIFEST);

      const result = await testGenerateCommand({
        manifestPath: TEMP_DIR,
      });

      expect(result.success).toBe(true);
      expect(result.validationPassed).toBe(true);
    });

    it('returns error if no manifest in directory', async () => {
      const result = await testGenerateCommand({
        manifestPath: TEMP_DIR,
      });

      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.includes('No manifest file found'))).toBe(true);
    });
  });
});
