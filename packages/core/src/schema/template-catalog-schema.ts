/**
 * JSON Schema for Template Catalog (Backstage-compatible)
 *
 * This schema defines the structure for template catalog entries.
 */

export const catalogSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'https://retro-vibecoder.dev/schema/template-catalog.json',
  title: 'Template Catalog Schema',
  type: 'object',
  required: ['apiVersion', 'kind', 'metadata', 'spec'],

  properties: {
    apiVersion: {
      type: 'string',
      description: 'API version for the catalog entry',
      examples: ['backstage.io/v1alpha1', 'upg/v1'],
    },

    kind: {
      type: 'string',
      enum: ['Template', 'Component', 'API', 'Group', 'User', 'Resource', 'System', 'Domain'],
      description: 'Kind of catalog entry',
    },

    metadata: {
      type: 'object',
      required: ['name'],
      properties: {
        name: {
          type: 'string',
          pattern: '^[a-z0-9][a-z0-9-]*$',
          description: 'Unique name',
        },
        title: {
          type: 'string',
          description: 'Human-readable title',
        },
        description: {
          type: 'string',
          description: 'Description',
        },
        labels: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
        annotations: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
        },
        links: {
          type: 'array',
          items: {
            type: 'object',
            required: ['url'],
            properties: {
              url: { type: 'string', format: 'uri' },
              title: { type: 'string' },
              icon: { type: 'string' },
              type: { type: 'string' },
            },
          },
        },
      },
    },

    spec: {
      type: 'object',
      required: ['type', 'lifecycle', 'owner'],
      properties: {
        type: {
          type: 'string',
          description: 'Type of template (e.g., service, website, library)',
        },
        lifecycle: {
          enum: ['experimental', 'production', 'deprecated'],
          description: 'Lifecycle state',
        },
        owner: {
          type: 'string',
          description: 'Owner team or user',
        },
        system: {
          type: 'string',
          description: 'System this template belongs to',
        },
        subcomponentOf: {
          type: 'string',
          description: 'Parent component',
        },
        providesApis: {
          type: 'array',
          items: { type: 'string' },
        },
        consumesApis: {
          type: 'array',
          items: { type: 'string' },
        },
        dependsOn: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  },
} as const;

export type CatalogSchemaType = typeof catalogSchema;
