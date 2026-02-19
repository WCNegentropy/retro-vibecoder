/**
 * JSON Schema for the UPG Manifest (upg.yaml)
 *
 * This schema defines the structure and validation rules for Universal Manifests.
 */

/**
 * Manifest schema as a JavaScript object
 * This is exported for programmatic use and also saved as JSON
 */
export const manifestSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'https://retro-vibecoder.dev/schema/upg-manifest.json',
  title: 'Universal Project Generator Manifest Schema',
  type: 'object',
  required: ['apiVersion', 'metadata', 'prompts', 'actions'],

  properties: {
    apiVersion: {
      type: 'string',
      pattern: '^upg/v[0-9]+$',
      description: 'API version of the manifest schema',
      examples: ['upg/v1'],
    },

    metadata: {
      type: 'object',
      required: ['name', 'version', 'description'],
      properties: {
        name: {
          type: 'string',
          pattern: '^[a-z0-9][a-z0-9-]*$',
          minLength: 1,
          maxLength: 63,
          description: 'Unique identifier of the template',
        },
        version: {
          type: 'string',
          pattern:
            '^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-((?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\\+([0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?$',
          description: 'Semantic version of the template',
        },
        title: {
          type: 'string',
          description: 'Human-readable title',
        },
        description: {
          type: 'string',
          description: 'Description of the template',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Categorization tags',
        },
        icon: {
          type: 'string',
          format: 'uri',
          description: 'URL or path to an icon',
        },
        author: {
          type: 'string',
          description: 'Author name or organization',
        },
        license: {
          type: 'string',
          description: 'License identifier',
        },
        repository: {
          type: 'object',
          properties: {
            type: { enum: ['git', 'svn'] },
            url: { type: 'string', format: 'uri' },
          },
        },
        documentation: {
          type: 'object',
          properties: {
            url: { type: 'string', format: 'uri' },
          },
        },
        lifecycle: {
          enum: ['experimental', 'production', 'deprecated'],
          description: 'Lifecycle state of the template',
        },
        owner: {
          type: 'string',
          description: 'Owner team or individual',
        },
      },
      additionalProperties: true,
    },

    template: {
      type: 'object',
      properties: {
        markers: {
          type: 'array',
          items: { type: 'string' },
          description: 'Marker files to detect this template',
        },
        breaking_changes: {
          type: 'array',
          items: {
            type: 'object',
            required: ['version', 'changes'],
            properties: {
              version: { type: 'string' },
              changes: {
                type: 'array',
                items: { type: 'string' },
              },
              migration_notes: { type: 'string' },
              migration_url: { type: 'string', format: 'uri' },
            },
          },
        },
        smart_update: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            preserve_files: {
              type: 'array',
              items: { type: 'string' },
            },
            regenerate_files: {
              type: 'array',
              items: { type: 'string' },
            },
            conflict_resolution: {
              enum: ['manual', 'auto-accept-template', 'auto-accept-user'],
            },
          },
        },
      },
    },

    prompts: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['id', 'type', 'message'],
        properties: {
          id: {
            type: 'string',
            pattern: '^[a-z_][a-z0-9_]*$',
            description: 'Unique identifier (variable key)',
          },
          type: {
            enum: ['string', 'int', 'float', 'boolean', 'select', 'multiselect', 'secret'],
            description: 'Data type of the prompt',
          },
          title: {
            type: 'string',
            description: 'Short title for the field',
          },
          message: {
            type: 'string',
            description: 'Human-readable question',
          },
          help: {
            type: 'string',
            description: 'Extended help text',
          },
          default: {
            description: 'Default value (can be Jinja2 expression)',
          },
          required: {
            type: 'boolean',
            description: 'Whether the field is required',
          },
          hidden: {
            type: 'boolean',
            description: 'Hide from UI (computed field)',
          },
          validator: {
            type: 'string',
            description: 'Regex validator pattern',
          },
          error_message: {
            type: 'string',
            description: 'Custom error message',
          },
          when: {
            type: 'string',
            description: 'Conditional display (Jinja2 expression)',
          },
          choices: {
            oneOf: [
              {
                type: 'array',
                items: { type: 'string' },
              },
              {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['label', 'value'],
                  properties: {
                    label: { type: 'string' },
                    value: { type: 'string' },
                  },
                },
              },
            ],
            description: 'Choices for select/multiselect prompts',
          },
        },
        allOf: [
          {
            if: {
              properties: { type: { enum: ['select', 'multiselect'] } },
            },
            then: {
              required: ['choices'],
            },
          },
        ],
      },
    },

    actions: {
      type: 'array',
      minItems: 1,
      items: {
        oneOf: [
          {
            type: 'object',
            required: ['type', 'src', 'dest'],
            properties: {
              type: { const: 'generate' },
              src: { type: 'string' },
              dest: { type: 'string' },
              exclude: {
                type: 'array',
                items: { type: 'string' },
              },
              variables: {
                type: 'object',
                additionalProperties: { type: 'string' },
              },
            },
          },
          {
            type: 'object',
            required: ['type', 'src', 'dest'],
            properties: {
              type: { const: 'copy' },
              src: { type: 'string' },
              dest: { type: 'string' },
            },
          },
          {
            type: 'object',
            required: ['type', 'path'],
            properties: {
              type: { const: 'skip' },
              path: { type: 'string' },
              when: { type: 'string' },
            },
          },
          {
            type: 'object',
            required: ['type', 'command'],
            properties: {
              type: { const: 'command' },
              command: { type: 'string' },
              description: { type: 'string' },
              when: { type: 'string' },
              on_error: { enum: ['fail', 'warn', 'ignore'] },
            },
          },
          {
            type: 'object',
            required: ['type', 'path', 'content'],
            properties: {
              type: { const: 'create_file' },
              path: { type: 'string' },
              content: { type: 'string' },
            },
          },
        ],
      },
    },

    hooks: {
      type: 'object',
      properties: {
        post_generation: {
          type: 'object',
          properties: {
            script: { type: 'string' },
            description: { type: 'string' },
            on_error: { enum: ['fail', 'warn'] },
          },
        },
        pre_migration: {
          type: 'object',
          properties: {
            script: { type: 'string' },
            description: { type: 'string' },
            when: { type: 'string' },
            on_error: { enum: ['fail', 'warn'] },
          },
        },
      },
    },

    validation: {
      type: 'object',
      additionalProperties: true,
    },

    enrichment: {
      type: 'object',
      properties: {
        enabled: {
          type: 'boolean',
          description: 'Whether Pass 2 enrichment is enabled for this template',
        },
        depth: {
          enum: ['minimal', 'standard', 'full'],
          description: 'Enrichment depth preset',
        },
        cicd: {
          type: 'boolean',
          description: 'Enable CI/CD workflow enrichment',
        },
        release: {
          type: 'boolean',
          description: 'Enable release automation workflows',
        },
        fillLogic: {
          type: 'boolean',
          description: 'Enable logic fill (API routes, CLI commands, etc.)',
        },
        tests: {
          type: 'boolean',
          description: 'Enable test generation',
        },
        dockerProd: {
          type: 'boolean',
          description: 'Enable production Docker configuration',
        },
        linting: {
          type: 'boolean',
          description: 'Enable linting configuration',
        },
        envFiles: {
          type: 'boolean',
          description: 'Enable environment file generation',
        },
        docs: {
          type: 'boolean',
          description: 'Enable documentation enrichment',
        },
      },
      additionalProperties: false,
    },

    documentation: {
      type: 'object',
      properties: {
        quickstart: { type: 'string' },
        custom_setup: { type: 'string' },
        customization_guide: { type: 'string' },
        faq: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              answer: { type: 'string' },
            },
          },
        },
      },
    },
  },

  additionalProperties: false,
} as const;

/**
 * Type for the manifest schema
 */
export type ManifestSchemaType = typeof manifestSchema;
