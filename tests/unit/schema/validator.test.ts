/**
 * Schema validator unit tests
 */

import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { validateManifest } from '@wcnegentropy/core';

const FIXTURES_DIR = join(__dirname, '../../__fixtures__/manifests');

describe('Schema Validator', () => {
  describe('valid manifests', () => {
    it('validates a simple manifest', async () => {
      const content = await readFile(join(FIXTURES_DIR, 'valid/simple.upg.yaml'), 'utf-8');
      const result = validateManifest(content);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.manifest).toBeDefined();
      expect(result.manifest?.metadata.name).toBe('simple-test');
    });

    it('validates a manifest with conditional logic', async () => {
      const content = await readFile(join(FIXTURES_DIR, 'valid/conditional.upg.yaml'), 'utf-8');
      const result = validateManifest(content);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.manifest?.prompts).toHaveLength(5);
    });

    it('validates a complex manifest with all features', async () => {
      const content = await readFile(join(FIXTURES_DIR, 'valid/complex.upg.yaml'), 'utf-8');
      const result = validateManifest(content);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.manifest?.metadata.version).toBe('2.0.0');
    });
  });

  describe('invalid manifests', () => {
    it('rejects manifest missing required fields', async () => {
      const content = await readFile(
        join(FIXTURES_DIR, 'invalid/missing-required-fields.yaml'),
        'utf-8'
      );
      const result = validateManifest(content);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('rejects manifest with invalid prompt type', async () => {
      const content = await readFile(join(FIXTURES_DIR, 'invalid/invalid-type.yaml'), 'utf-8');
      const result = validateManifest(content);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.path.includes('type'))).toBe(true);
    });

    it('rejects select prompt without choices', async () => {
      const content = await readFile(join(FIXTURES_DIR, 'invalid/missing-choices.yaml'), 'utf-8');
      const result = validateManifest(content);

      expect(result.valid).toBe(false);
    });
  });

  describe('warnings', () => {
    it('warns about missing tags', async () => {
      const manifest = {
        apiVersion: 'upg/v1',
        metadata: {
          name: 'no-tags',
          version: '1.0.0',
          description: 'A template without tags',
        },
        prompts: [{ id: 'name', type: 'string', message: 'Name?' }],
        actions: [{ type: 'generate', src: 'template/', dest: './' }],
      };

      const result = validateManifest(manifest, { includeWarnings: true });

      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.code === 'MISSING_TAGS')).toBe(true);
    });

    it('warns about deprecated lifecycle', async () => {
      const manifest = {
        apiVersion: 'upg/v1',
        metadata: {
          name: 'deprecated-template',
          version: '1.0.0',
          description: 'A deprecated template',
          lifecycle: 'deprecated',
        },
        prompts: [{ id: 'name', type: 'string', message: 'Name?' }],
        actions: [{ type: 'generate', src: 'template/', dest: './' }],
      };

      const result = validateManifest(manifest, { includeWarnings: true });

      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.code === 'DEPRECATED_TEMPLATE')).toBe(true);
    });
  });

  describe('Bug 14: duplicate prompt IDs', () => {
    it('should reject manifest with duplicate prompt IDs', () => {
      const manifest = {
        apiVersion: 'upg/v1',
        metadata: {
          name: 'dupe-ids-test',
          version: '1.0.0',
          description: 'A template with duplicate prompt IDs',
          tags: ['test'],
        },
        prompts: [
          { id: 'name', type: 'string', message: 'Name?' },
          { id: 'name', type: 'string', message: 'Name again?' },
        ],
        actions: [{ type: 'generate', src: 'template/', dest: './' }],
      };

      const result = validateManifest(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'DUPLICATE_PROMPT_ID')).toBe(true);
    });
  });

  describe('Bug 15: invalid regex validator', () => {
    it('should reject manifest with invalid regex in prompt validator', () => {
      const manifest = {
        apiVersion: 'upg/v1',
        metadata: {
          name: 'bad-regex-test',
          version: '1.0.0',
          description: 'A template with invalid regex validator',
          tags: ['test'],
        },
        prompts: [{ id: 'name', type: 'string', message: 'Name?', validator: '[invalid(' }],
        actions: [{ type: 'generate', src: 'template/', dest: './' }],
      };

      const result = validateManifest(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_VALIDATOR_REGEX')).toBe(true);
    });
  });

  describe('enrichment schema validation', () => {
    it('accepts valid enrichment block', () => {
      const manifest = {
        apiVersion: 'upg/v1',
        metadata: {
          name: 'enrich-test',
          version: '1.0.0',
          description: 'A template with enrichment config',
          tags: ['test'],
        },
        prompts: [{ id: 'name', type: 'string', message: 'Name?' }],
        actions: [{ type: 'generate', src: 'template/', dest: './' }],
        enrichment: {
          enabled: true,
          depth: 'standard',
          cicd: true,
          tests: true,
        },
      };

      const result = validateManifest(manifest);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects enrichment with invalid depth', () => {
      const manifest = {
        apiVersion: 'upg/v1',
        metadata: {
          name: 'bad-enrich',
          version: '1.0.0',
          description: 'A template with invalid enrichment depth',
          tags: ['test'],
        },
        prompts: [{ id: 'name', type: 'string', message: 'Name?' }],
        actions: [{ type: 'generate', src: 'template/', dest: './' }],
        enrichment: {
          enabled: true,
          depth: 'ultra',
        },
      };

      const result = validateManifest(manifest);

      expect(result.valid).toBe(false);
    });

    it('warns when enrichment enabled without depth', () => {
      const manifest = {
        apiVersion: 'upg/v1',
        metadata: {
          name: 'enrich-no-depth',
          version: '1.0.0',
          description: 'A template with enrichment but no depth',
          tags: ['test'],
        },
        prompts: [{ id: 'name', type: 'string', message: 'Name?' }],
        actions: [{ type: 'generate', src: 'template/', dest: './' }],
        enrichment: {
          enabled: true,
        },
      };

      const result = validateManifest(manifest, { includeWarnings: true });

      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.code === 'ENRICHMENT_NO_DEPTH')).toBe(true);
    });

    it('rejects enrichment with unknown properties', () => {
      const manifest = {
        apiVersion: 'upg/v1',
        metadata: {
          name: 'bad-enrich-props',
          version: '1.0.0',
          description: 'A template with unknown enrichment properties',
          tags: ['test'],
        },
        prompts: [{ id: 'name', type: 'string', message: 'Name?' }],
        actions: [{ type: 'generate', src: 'template/', dest: './' }],
        enrichment: {
          enabled: true,
          depth: 'standard',
          unknownProp: true,
        },
      };

      const result = validateManifest(manifest);

      expect(result.valid).toBe(false);
    });
  });
});
