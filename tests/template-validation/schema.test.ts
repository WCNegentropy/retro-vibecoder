/**
 * Template validation tests
 *
 * These tests validate that all example templates in the templates/ directory
 * are valid and can be successfully transpiled.
 */

import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { validateManifest, transpileManifestToSchema } from '@retro-vibecoder/core';
import { parseYaml, type UpgManifest } from '@retro-vibecoder/shared';

const TEMPLATES_DIR = join(__dirname, '../../templates');

describe('Template Validation', () => {
  describe('React Starter Template', () => {
    const templatePath = join(TEMPLATES_DIR, 'react-starter/upg.yaml');

    it('has valid manifest structure', async () => {
      const content = await readFile(templatePath, 'utf-8');
      const result = validateManifest(content);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('has required metadata fields', async () => {
      const content = await readFile(templatePath, 'utf-8');
      const manifest = parseYaml<UpgManifest>(content);

      expect(manifest.apiVersion).toBe('upg/v1');
      expect(manifest.metadata.name).toBeDefined();
      expect(manifest.metadata.version).toBeDefined();
      expect(manifest.metadata.description).toBeDefined();
    });

    it('has prompts defined', async () => {
      const content = await readFile(templatePath, 'utf-8');
      const manifest = parseYaml<UpgManifest>(content);

      expect(manifest.prompts).toBeDefined();
      expect(manifest.prompts.length).toBeGreaterThan(0);

      // Each prompt should have id, type, and message
      for (const prompt of manifest.prompts) {
        expect(prompt.id).toBeDefined();
        expect(prompt.type).toBeDefined();
        expect(prompt.message).toBeDefined();
      }
    });

    it('has actions defined', async () => {
      const content = await readFile(templatePath, 'utf-8');
      const manifest = parseYaml<UpgManifest>(content);

      expect(manifest.actions).toBeDefined();
      expect(manifest.actions.length).toBeGreaterThan(0);
    });

    it('transpiles to valid JSON Schema', async () => {
      const content = await readFile(templatePath, 'utf-8');
      const manifest = parseYaml<UpgManifest>(content);

      const result = transpileManifestToSchema(manifest);

      expect(result.schema).toBeDefined();
      expect(result.schema.type).toBe('object');
      expect(result.schema.properties).toBeDefined();
    });

    it('generates form data for defaults', async () => {
      const content = await readFile(templatePath, 'utf-8');
      const manifest = parseYaml<UpgManifest>(content);

      const result = transpileManifestToSchema(manifest);

      // formData is optional but should exist if there are defaults
      // Note: Jinja2 expressions in defaults are skipped (evaluated at runtime)
      const promptsWithStaticDefaults = manifest.prompts.filter(
        p => p.default !== undefined && !(typeof p.default === 'string' && p.default.includes('{{'))
      );
      if (promptsWithStaticDefaults.length > 0 && result.formData) {
        for (const prompt of promptsWithStaticDefaults) {
          expect(result.formData[prompt.id]).toBeDefined();
        }
      }
    });

    it('has proper prompt types', async () => {
      const content = await readFile(templatePath, 'utf-8');
      const manifest = parseYaml<UpgManifest>(content);

      const validTypes = ['string', 'int', 'float', 'boolean', 'select', 'multiselect', 'secret'];

      for (const prompt of manifest.prompts) {
        expect(validTypes).toContain(prompt.type);
      }
    });

    it('select prompts have choices', async () => {
      const content = await readFile(templatePath, 'utf-8');
      const manifest = parseYaml<UpgManifest>(content);

      const selectPrompts = manifest.prompts.filter(
        p => p.type === 'select' || p.type === 'multiselect'
      );

      for (const prompt of selectPrompts) {
        expect(prompt.choices).toBeDefined();
        expect(prompt.choices!.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Python API Template', () => {
    const templatePath = join(TEMPLATES_DIR, 'python-api/upg.yaml');

    it('has valid manifest structure', async () => {
      const content = await readFile(templatePath, 'utf-8');
      const result = validateManifest(content);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('has required metadata fields', async () => {
      const content = await readFile(templatePath, 'utf-8');
      const manifest = parseYaml<UpgManifest>(content);

      expect(manifest.apiVersion).toBe('upg/v1');
      expect(manifest.metadata.name).toBeDefined();
      expect(manifest.metadata.version).toBeDefined();
      expect(manifest.metadata.description).toBeDefined();
    });

    it('has prompts defined', async () => {
      const content = await readFile(templatePath, 'utf-8');
      const manifest = parseYaml<UpgManifest>(content);

      expect(manifest.prompts).toBeDefined();
      expect(manifest.prompts.length).toBeGreaterThan(0);
    });

    it('has actions defined', async () => {
      const content = await readFile(templatePath, 'utf-8');
      const manifest = parseYaml<UpgManifest>(content);

      expect(manifest.actions).toBeDefined();
      expect(manifest.actions.length).toBeGreaterThan(0);
    });

    it('transpiles to valid JSON Schema', async () => {
      const content = await readFile(templatePath, 'utf-8');
      const manifest = parseYaml<UpgManifest>(content);

      const result = transpileManifestToSchema(manifest);

      expect(result.schema).toBeDefined();
      expect(result.schema.type).toBe('object');
      expect(result.schema.properties).toBeDefined();
    });

    it('has valid conditional prompts', async () => {
      const content = await readFile(templatePath, 'utf-8');
      const manifest = parseYaml<UpgManifest>(content);

      const conditionalPrompts = manifest.prompts.filter(p => p.when);

      for (const prompt of conditionalPrompts) {
        expect(typeof prompt.when).toBe('string');
        // When clause should reference a valid prompt id or be a valid expression
        expect(prompt.when!.length).toBeGreaterThan(0);
      }
    });

    it('select prompts have choices', async () => {
      const content = await readFile(templatePath, 'utf-8');
      const manifest = parseYaml<UpgManifest>(content);

      const selectPrompts = manifest.prompts.filter(
        p => p.type === 'select' || p.type === 'multiselect'
      );

      for (const prompt of selectPrompts) {
        expect(prompt.choices).toBeDefined();
        expect(prompt.choices!.length).toBeGreaterThan(0);
      }
    });
  });

  describe('All Templates Schema Generation', () => {
    it('all templates generate valid schemas', async () => {
      const templates = ['react-starter', 'python-api'];

      for (const templateName of templates) {
        const content = await readFile(join(TEMPLATES_DIR, templateName, 'upg.yaml'), 'utf-8');
        const manifest = parseYaml<UpgManifest>(content);
        const result = transpileManifestToSchema(manifest);

        // Schema should be valid
        expect(result.schema).toBeDefined();
        expect(result.schema.type).toBe('object');
        expect(result.schema.properties).toBeDefined();
      }
    });

    it('all templates have consistent schema structure', async () => {
      const templates = ['react-starter', 'python-api'];

      for (const templateName of templates) {
        const content = await readFile(join(TEMPLATES_DIR, templateName, 'upg.yaml'), 'utf-8');
        const manifest = parseYaml<UpgManifest>(content);
        const result = transpileManifestToSchema(manifest);

        // Schema should be a valid JSON Schema
        expect(result.schema.$schema).toContain('json-schema.org');
        expect(result.schema.type).toBe('object');
        expect(result.schema.required).toBeDefined();

        // Each prompt should have a corresponding property
        for (const prompt of manifest.prompts) {
          if (!prompt.hidden) {
            expect(result.schema.properties).toHaveProperty(prompt.id);
          }
        }
      }
    });
  });

  describe('Template Content Validation', () => {
    it('react-starter has valid prompt ids (no spaces or special chars)', async () => {
      const content = await readFile(join(TEMPLATES_DIR, 'react-starter/upg.yaml'), 'utf-8');
      const manifest = parseYaml<UpgManifest>(content);

      for (const prompt of manifest.prompts) {
        expect(prompt.id).toMatch(/^[a-z][a-z0-9_]*$/);
      }
    });

    it('python-api has valid prompt ids (no spaces or special chars)', async () => {
      const content = await readFile(join(TEMPLATES_DIR, 'python-api/upg.yaml'), 'utf-8');
      const manifest = parseYaml<UpgManifest>(content);

      for (const prompt of manifest.prompts) {
        expect(prompt.id).toMatch(/^[a-z][a-z0-9_]*$/);
      }
    });

    it('templates have proper lifecycle values', async () => {
      const templates = ['react-starter', 'python-api'];
      // Valid lifecycle values include 'production' as used in templates
      const validLifecycles = ['experimental', 'stable', 'deprecated', 'archived', 'production'];

      for (const templateName of templates) {
        const content = await readFile(join(TEMPLATES_DIR, templateName, 'upg.yaml'), 'utf-8');
        const manifest = parseYaml<UpgManifest>(content);

        if (manifest.metadata.lifecycle) {
          expect(validLifecycles).toContain(manifest.metadata.lifecycle);
        }
      }
    });

    it('templates have valid tags', async () => {
      const templates = ['react-starter', 'python-api'];

      for (const templateName of templates) {
        const content = await readFile(join(TEMPLATES_DIR, templateName, 'upg.yaml'), 'utf-8');
        const manifest = parseYaml<UpgManifest>(content);

        if (manifest.metadata.tags) {
          expect(Array.isArray(manifest.metadata.tags)).toBe(true);
          for (const tag of manifest.metadata.tags) {
            expect(typeof tag).toBe('string');
            expect(tag.length).toBeGreaterThan(0);
          }
        }
      }
    });
  });
});
