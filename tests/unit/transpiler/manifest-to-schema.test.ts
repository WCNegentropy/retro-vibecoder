/**
 * Manifest to JSON Schema transpiler tests
 */

import { describe, it, expect } from 'vitest';
import { transpileManifestToSchema } from '@wcnegentropy/core';
import type { UpgManifest } from '@wcnegentropy/shared';

describe('Manifest to Schema Transpiler', () => {
  const baseManifest: UpgManifest = {
    apiVersion: 'upg/v1',
    metadata: {
      name: 'test',
      version: '1.0.0',
      description: 'Test template',
    },
    prompts: [],
    actions: [{ type: 'generate', src: 'template/', dest: './' }],
  };

  describe('basic prompts', () => {
    it('transpiles string prompt correctly', () => {
      const manifest: UpgManifest = {
        ...baseManifest,
        prompts: [
          {
            id: 'project_name',
            type: 'string',
            title: 'Project Name',
            message: 'What is your project name?',
            default: 'my-app',
          },
        ],
      };

      const result = transpileManifestToSchema(manifest);

      expect(result.schema.properties.project_name).toBeDefined();
      expect(result.schema.properties.project_name.type).toBe('string');
      expect(result.schema.properties.project_name.title).toBe('Project Name');
      expect(result.schema.properties.project_name.default).toBe('my-app');
    });

    it('transpiles boolean prompt correctly', () => {
      const manifest: UpgManifest = {
        ...baseManifest,
        prompts: [
          {
            id: 'use_typescript',
            type: 'boolean',
            title: 'TypeScript',
            message: 'Use TypeScript?',
            default: true,
          },
        ],
      };

      const result = transpileManifestToSchema(manifest);

      expect(result.schema.properties.use_typescript.type).toBe('boolean');
      expect(result.schema.properties.use_typescript.default).toBe(true);
    });

    it('transpiles int prompt correctly', () => {
      const manifest: UpgManifest = {
        ...baseManifest,
        prompts: [
          {
            id: 'port',
            type: 'int',
            message: 'Port number?',
            default: 8080,
          },
        ],
      };

      const result = transpileManifestToSchema(manifest);

      expect(result.schema.properties.port.type).toBe('integer');
    });

    it('transpiles float prompt correctly', () => {
      const manifest: UpgManifest = {
        ...baseManifest,
        prompts: [
          {
            id: 'timeout',
            type: 'float',
            message: 'Timeout?',
            default: 30.5,
          },
        ],
      };

      const result = transpileManifestToSchema(manifest);

      expect(result.schema.properties.timeout.type).toBe('number');
    });
  });

  describe('select prompts', () => {
    it('transpiles select with string choices', () => {
      const manifest: UpgManifest = {
        ...baseManifest,
        prompts: [
          {
            id: 'database',
            type: 'select',
            message: 'Database?',
            choices: ['postgres', 'mysql', 'sqlite'],
            default: 'postgres',
          },
        ],
      };

      const result = transpileManifestToSchema(manifest);

      expect(result.schema.properties.database.type).toBe('string');
      expect(result.schema.properties.database.enum).toEqual(['postgres', 'mysql', 'sqlite']);
    });

    it('transpiles select with object choices', () => {
      const manifest: UpgManifest = {
        ...baseManifest,
        prompts: [
          {
            id: 'framework',
            type: 'select',
            message: 'Framework?',
            choices: [
              { label: 'FastAPI (Modern)', value: 'fastapi' },
              { label: 'Flask (Classic)', value: 'flask' },
            ],
            default: 'fastapi',
          },
        ],
      };

      const result = transpileManifestToSchema(manifest);

      expect(result.schema.properties.framework.enum).toEqual(['fastapi', 'flask']);
      expect(result.schema.properties.framework.enumNames).toEqual([
        'FastAPI (Modern)',
        'Flask (Classic)',
      ]);
    });
  });

  describe('multiselect prompts', () => {
    it('transpiles multiselect correctly', () => {
      const manifest: UpgManifest = {
        ...baseManifest,
        prompts: [
          {
            id: 'features',
            type: 'multiselect',
            message: 'Features?',
            choices: ['auth', 'logging', 'metrics'],
            default: ['auth'],
          },
        ],
      };

      const result = transpileManifestToSchema(manifest);

      expect(result.schema.properties.features.type).toBe('array');
      expect(result.schema.properties.features.items?.enum).toEqual(['auth', 'logging', 'metrics']);
      expect(result.schema.properties.features.uniqueItems).toBe(true);
    });
  });

  describe('required fields', () => {
    it('adds required prompts to required array', () => {
      const manifest: UpgManifest = {
        ...baseManifest,
        prompts: [
          {
            id: 'name',
            type: 'string',
            message: 'Name?',
            required: true,
          },
          {
            id: 'optional',
            type: 'string',
            message: 'Optional?',
            required: false,
          },
        ],
      };

      const result = transpileManifestToSchema(manifest);

      expect(result.schema.required).toContain('name');
      expect(result.schema.required).not.toContain('optional');
    });
  });

  describe('hidden prompts', () => {
    it('excludes hidden prompts from schema but includes in formData', () => {
      const manifest: UpgManifest = {
        ...baseManifest,
        prompts: [
          {
            id: 'visible',
            type: 'string',
            message: 'Visible?',
          },
          {
            id: 'hidden',
            type: 'string',
            message: 'Hidden?',
            hidden: true,
            default: 'computed-value',
          },
        ],
      };

      const result = transpileManifestToSchema(manifest);

      expect(result.schema.properties.visible).toBeDefined();
      expect(result.schema.properties.hidden).toBeUndefined();
      expect(result.formData?.hidden).toBe('computed-value');
    });
  });

  describe('validators', () => {
    it('adds validator as pattern', () => {
      const manifest: UpgManifest = {
        ...baseManifest,
        prompts: [
          {
            id: 'slug',
            type: 'string',
            message: 'Slug?',
            validator: '^[a-z0-9-]+$',
          },
        ],
      };

      const result = transpileManifestToSchema(manifest);

      expect(result.schema.properties.slug.pattern).toBe('^[a-z0-9-]+$');
    });
  });

  describe('UI schema', () => {
    it('generates UI schema when requested', () => {
      const manifest: UpgManifest = {
        ...baseManifest,
        prompts: [
          {
            id: 'password',
            type: 'secret',
            message: 'Password?',
            help: 'Enter your password',
          },
        ],
      };

      const result = transpileManifestToSchema(manifest, { includeUiSchema: true });

      expect(result.uiSchema).toBeDefined();
      expect(result.uiSchema?.password?.['ui:widget']).toBe('password');
      expect(result.uiSchema?.password?.['ui:help']).toBe('Enter your password');
    });
  });
});
