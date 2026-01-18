/**
 * Init command unit tests
 *
 * Tests the manifest generation functionality without relying on process.chdir()
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { mkdir, rm, readFile, writeFile } from 'fs/promises';
import { parseYaml, DEFAULT_MANIFEST_FILENAME } from '@retro-vibecoder/shared';
import { validateManifest } from '@retro-vibecoder/core';

const TEMP_DIR = join(__dirname, '../../__temp__/init-test');

describe('Init Command', () => {
  beforeEach(async () => {
    await mkdir(TEMP_DIR, { recursive: true });
  });

  afterEach(async () => {
    await rm(TEMP_DIR, { recursive: true, force: true });
  });

  describe('generateStarterManifest structure', () => {
    // Test the manifest generation without using the full CLI action
    function generateTestManifest(name: string): object {
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

    it('generates manifest with correct apiVersion', () => {
      const manifest = generateTestManifest('test-template');
      expect(manifest).toHaveProperty('apiVersion', 'upg/v1');
    });

    it('generates manifest with required metadata fields', () => {
      const manifest = generateTestManifest('test-template') as {
        metadata: {
          name: string;
          version: string;
          title: string;
          description: string;
          tags: string[];
          license: string;
          lifecycle: string;
        };
      };

      expect(manifest.metadata.name).toBe('test-template');
      expect(manifest.metadata.version).toBe('0.1.0');
      expect(manifest.metadata.title).toContain('test-template');
      expect(manifest.metadata.description).toBeDefined();
      expect(manifest.metadata.tags).toBeInstanceOf(Array);
      expect(manifest.metadata.license).toBe('MIT');
      expect(manifest.metadata.lifecycle).toBe('experimental');
    });

    it('generates manifest with starter prompts', () => {
      const manifest = generateTestManifest('test-template') as {
        prompts: Array<{ id: string; type: string }>;
      };

      expect(manifest.prompts).toBeDefined();
      expect(manifest.prompts.length).toBeGreaterThan(0);

      const promptIds = manifest.prompts.map(p => p.id);
      expect(promptIds).toContain('project_name');
      expect(promptIds).toContain('description');
      expect(promptIds).toContain('use_typescript');
    });

    it('generates manifest with generate action', () => {
      const manifest = generateTestManifest('test-template') as {
        actions: Array<{ type: string; src: string; dest: string }>;
      };

      expect(manifest.actions).toBeDefined();
      expect(manifest.actions.length).toBeGreaterThan(0);

      const generateAction = manifest.actions.find(a => a.type === 'generate');
      expect(generateAction).toBeDefined();
      expect(generateAction?.src).toBe('template/');
      expect(generateAction?.dest).toBe('./');
    });

    it('generates manifest with documentation section', () => {
      const manifest = generateTestManifest('test-template') as {
        documentation: { quickstart: string };
      };

      expect(manifest.documentation).toBeDefined();
      expect(manifest.documentation.quickstart).toBeDefined();
      expect(manifest.documentation.quickstart).toContain('upg generate');
    });

    it('prompts have required fields', () => {
      const manifest = generateTestManifest('test-template') as {
        prompts: Array<{
          id: string;
          type: string;
          message: string;
        }>;
      };

      for (const prompt of manifest.prompts) {
        expect(prompt.id).toBeDefined();
        expect(prompt.type).toBeDefined();
        expect(prompt.message).toBeDefined();
      }
    });

    it('generated manifest passes validation', async () => {
      const manifest = generateTestManifest('test-template');
      const { stringifyYaml } = await import('@retro-vibecoder/shared');
      const yaml = stringifyYaml(manifest);

      const result = validateManifest(yaml);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('initAction file operations', () => {
    it('can write manifest to temp directory', async () => {
      const { stringifyYaml } = await import('@retro-vibecoder/shared');

      const manifest = {
        apiVersion: 'upg/v1',
        metadata: {
          name: 'test-template',
          version: '0.1.0',
          description: 'A test template',
        },
        prompts: [
          {
            id: 'name',
            type: 'string',
            message: 'Name?',
          },
        ],
        actions: [
          {
            type: 'generate',
            src: 'template/',
            dest: './',
          },
        ],
      };

      const content = stringifyYaml(manifest);
      const manifestPath = join(TEMP_DIR, DEFAULT_MANIFEST_FILENAME);

      await writeFile(manifestPath, content);

      const written = await readFile(manifestPath, 'utf-8');
      expect(written).toContain('apiVersion: upg/v1');
      expect(written).toContain('name: test-template');
    });

    it('written manifest can be parsed back', async () => {
      const { stringifyYaml } = await import('@retro-vibecoder/shared');

      const original = {
        apiVersion: 'upg/v1',
        metadata: {
          name: 'roundtrip-test',
          version: '0.1.0',
          description: 'Testing roundtrip',
        },
        prompts: [
          {
            id: 'project_name',
            type: 'string',
            message: 'Project name?',
            default: 'my-project',
          },
        ],
        actions: [
          {
            type: 'generate',
            src: 'template/',
            dest: './',
          },
        ],
      };

      const yaml = stringifyYaml(original);
      const manifestPath = join(TEMP_DIR, DEFAULT_MANIFEST_FILENAME);
      await writeFile(manifestPath, yaml);

      const content = await readFile(manifestPath, 'utf-8');
      const parsed = parseYaml<typeof original>(content);

      expect(parsed.apiVersion).toBe(original.apiVersion);
      expect(parsed.metadata.name).toBe(original.metadata.name);
      expect(parsed.prompts[0].id).toBe(original.prompts[0].id);
    });

    it('validates written manifest', async () => {
      const { stringifyYaml } = await import('@retro-vibecoder/shared');

      const manifest = {
        apiVersion: 'upg/v1',
        metadata: {
          name: 'validation-test',
          version: '1.0.0',
          description: 'Testing validation',
        },
        prompts: [
          {
            id: 'name',
            type: 'string',
            message: 'Name?',
          },
        ],
        actions: [
          {
            type: 'generate',
            src: 'template/',
            dest: './',
          },
        ],
      };

      const yaml = stringifyYaml(manifest);
      const manifestPath = join(TEMP_DIR, DEFAULT_MANIFEST_FILENAME);
      await writeFile(manifestPath, yaml);

      const content = await readFile(manifestPath, 'utf-8');
      const result = validateManifest(content);

      expect(result.valid).toBe(true);
    });
  });
});
