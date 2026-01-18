/**
 * Validate command unit tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { mkdir, writeFile, rm } from 'fs/promises';
import { validateCommand } from '@retro-vibecoder/core';

const FIXTURES_DIR = join(__dirname, '../../__fixtures__/manifests');
const TEMP_DIR = join(__dirname, '../../__temp__');

describe('Validate Command', () => {
  describe('validateCommand with file path', () => {
    it('validates a valid manifest file', async () => {
      const result = await validateCommand({
        path: join(FIXTURES_DIR, 'valid/simple.upg.yaml'),
      });

      expect(result.success).toBe(true);
      expect(result.result.valid).toBe(true);
      expect(result.result.errors).toHaveLength(0);
      expect(result.output).toContain('Manifest is valid');
    });

    it('validates a complex manifest file', async () => {
      const result = await validateCommand({
        path: join(FIXTURES_DIR, 'valid/complex.upg.yaml'),
      });

      expect(result.success).toBe(true);
      expect(result.result.valid).toBe(true);
    });

    it('validates manifest with conditional logic', async () => {
      const result = await validateCommand({
        path: join(FIXTURES_DIR, 'valid/conditional.upg.yaml'),
      });

      expect(result.success).toBe(true);
      expect(result.result.valid).toBe(true);
    });

    it('rejects manifest missing required fields', async () => {
      const result = await validateCommand({
        path: join(FIXTURES_DIR, 'invalid/missing-required-fields.yaml'),
      });

      expect(result.success).toBe(false);
      expect(result.result.valid).toBe(false);
      expect(result.result.errors.length).toBeGreaterThan(0);
      expect(result.output).toContain('validation failed');
    });

    it('rejects manifest with invalid type', async () => {
      const result = await validateCommand({
        path: join(FIXTURES_DIR, 'invalid/invalid-type.yaml'),
      });

      expect(result.success).toBe(false);
      expect(result.result.valid).toBe(false);
    });

    it('rejects select without choices', async () => {
      const result = await validateCommand({
        path: join(FIXTURES_DIR, 'invalid/missing-choices.yaml'),
      });

      expect(result.success).toBe(false);
      expect(result.result.valid).toBe(false);
    });
  });

  describe('validateCommand with non-existent file', () => {
    it('returns error for missing file', async () => {
      const result = await validateCommand({
        path: '/nonexistent/path/to/manifest.yaml',
      });

      expect(result.success).toBe(false);
      expect(result.result.errors).toHaveLength(1);
      expect(result.result.errors[0].code).toBe('UPG-100-001');
      expect(result.output).toContain('not found');
    });
  });

  describe('validateCommand with directory', () => {
    beforeEach(async () => {
      await mkdir(TEMP_DIR, { recursive: true });
    });

    afterEach(async () => {
      await rm(TEMP_DIR, { recursive: true, force: true });
    });

    it('finds upg.yaml in directory', async () => {
      const manifestContent = `
apiVersion: upg/v1
metadata:
  name: test-template
  version: "1.0.0"
  description: Test template
prompts:
  - id: name
    type: string
    message: Name?
actions:
  - type: generate
    src: template/
    dest: ./
`;
      await writeFile(join(TEMP_DIR, 'upg.yaml'), manifestContent);

      const result = await validateCommand({
        path: TEMP_DIR,
      });

      expect(result.success).toBe(true);
      expect(result.filePath).toContain('upg.yaml');
    });

    it('finds upg.yml in directory', async () => {
      const manifestContent = `
apiVersion: upg/v1
metadata:
  name: test-template
  version: "1.0.0"
  description: Test template
prompts:
  - id: name
    type: string
    message: Name?
actions:
  - type: generate
    src: template/
    dest: ./
`;
      await writeFile(join(TEMP_DIR, 'upg.yml'), manifestContent);

      const result = await validateCommand({
        path: TEMP_DIR,
      });

      expect(result.success).toBe(true);
      expect(result.filePath).toContain('upg.yml');
    });

    it('returns error if no manifest in directory', async () => {
      await expect(
        validateCommand({
          path: TEMP_DIR,
        })
      ).rejects.toThrow('No manifest file found');
    });
  });

  describe('validateCommand output formats', () => {
    it('returns text format by default', async () => {
      const result = await validateCommand({
        path: join(FIXTURES_DIR, 'valid/simple.upg.yaml'),
      });

      expect(result.output).toContain('✓');
      expect(result.output).not.toMatch(/^\{/);
    });

    it('returns JSON format when specified', async () => {
      const result = await validateCommand({
        path: join(FIXTURES_DIR, 'valid/simple.upg.yaml'),
        format: 'json',
      });

      const json = JSON.parse(result.output);
      expect(json.success).toBe(true);
      expect(json.errors).toBeDefined();
      expect(json.warnings).toBeDefined();
    });

    it('includes file path in JSON output', async () => {
      const result = await validateCommand({
        path: join(FIXTURES_DIR, 'valid/simple.upg.yaml'),
        format: 'json',
      });

      const json = JSON.parse(result.output);
      expect(json.file).toContain('simple.upg.yaml');
    });
  });

  describe('validateCommand warnings', () => {
    it('includes warnings by default', async () => {
      // Create a manifest that triggers warnings (missing tags)
      const result = await validateCommand({
        path: join(FIXTURES_DIR, 'valid/simple.upg.yaml'),
        warnings: true,
      });

      // The simple fixture may or may not have warnings depending on its content
      expect(result.result.warnings).toBeDefined();
    });

    it('excludes warnings when disabled', async () => {
      const result = await validateCommand({
        path: join(FIXTURES_DIR, 'valid/simple.upg.yaml'),
        warnings: false,
      });

      expect(result.result.warnings).toHaveLength(0);
    });
  });

  describe('validateCommand verbose mode', () => {
    it('includes path information in verbose mode for errors', async () => {
      const result = await validateCommand({
        path: join(FIXTURES_DIR, 'invalid/missing-required-fields.yaml'),
        verbose: true,
      });

      expect(result.output).toContain('Path:');
    });

    it('does not include path info in non-verbose mode', async () => {
      const result = await validateCommand({
        path: join(FIXTURES_DIR, 'invalid/missing-required-fields.yaml'),
        verbose: false,
      });

      // Should not have "Path:" prefixed lines
      const lines = result.output.split('\n');
      const pathLines = lines.filter(line => line.trim().startsWith('Path:'));
      expect(pathLines).toHaveLength(0);
    });
  });

  describe('validateCommand result structure', () => {
    it('returns complete result structure', async () => {
      const result = await validateCommand({
        path: join(FIXTURES_DIR, 'valid/simple.upg.yaml'),
      });

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('filePath');
      expect(result).toHaveProperty('result');
      expect(result).toHaveProperty('output');
      expect(result.result).toHaveProperty('valid');
      expect(result.result).toHaveProperty('errors');
      expect(result.result).toHaveProperty('warnings');
    });

    it('includes manifest in result for valid files', async () => {
      const result = await validateCommand({
        path: join(FIXTURES_DIR, 'valid/simple.upg.yaml'),
      });

      expect(result.result.manifest).toBeDefined();
      expect(result.result.manifest?.metadata?.name).toBeDefined();
    });
  });
});
