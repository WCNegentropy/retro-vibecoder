/**
 * Integration tests for manifest-to-schema flow
 *
 * These tests verify the complete pipeline from YAML manifest to JSON Schema,
 * including validation, transpilation, and conditional logic.
 */

import { describe, it, expect } from 'vitest';
import {
  validateManifest,
  transpileManifestToSchema,
  transpileConditionalLogic,
  evaluateWhenClause,
  createValidator,
} from '@wcnegentropy/core';
import { parseYaml, stringifyYaml, type UpgManifest } from '@wcnegentropy/shared';

describe('Manifest to Schema Flow', () => {
  describe('Complete Pipeline', () => {
    it('validates, parses, and transpiles a simple manifest', () => {
      const yaml = `
apiVersion: upg/v1
metadata:
  name: test-template
  version: "1.0.0"
  description: A test template
prompts:
  - id: project_name
    type: string
    message: Project name?
    default: my-project
actions:
  - type: generate
    src: template/
    dest: ./
`;

      // Step 1: Validate
      const validationResult = validateManifest(yaml);
      expect(validationResult.valid).toBe(true);

      // Step 2: Parse
      const manifest = parseYaml<UpgManifest>(yaml);
      expect(manifest.metadata.name).toBe('test-template');

      // Step 3: Transpile
      const schemaResult = transpileManifestToSchema(manifest);
      expect(schemaResult.schema.properties).toHaveProperty('project_name');
      expect(schemaResult.formData?.project_name).toBe('my-project');
    });

    it('handles all prompt types in a single manifest', () => {
      const yaml = `
apiVersion: upg/v1
metadata:
  name: all-types
  version: "1.0.0"
  description: Tests all prompt types
prompts:
  - id: string_field
    type: string
    message: String value?
    default: "hello"
  - id: int_field
    type: int
    message: Integer value?
    default: 42
  - id: float_field
    type: float
    message: Float value?
    default: 3.14
  - id: bool_field
    type: boolean
    message: Boolean value?
    default: true
  - id: select_field
    type: select
    message: Choose one?
    choices:
      - option1
      - option2
    default: option1
  - id: multi_field
    type: multiselect
    message: Choose many?
    choices:
      - a
      - b
      - c
    default:
      - a
      - b
actions:
  - type: generate
    src: template/
    dest: ./
`;

      const validationResult = validateManifest(yaml);
      expect(validationResult.valid).toBe(true);

      const manifest = parseYaml<UpgManifest>(yaml);
      const schemaResult = transpileManifestToSchema(manifest);

      // Verify schema types
      expect(schemaResult.schema.properties.string_field.type).toBe('string');
      expect(schemaResult.schema.properties.int_field.type).toBe('integer');
      expect(schemaResult.schema.properties.float_field.type).toBe('number');
      expect(schemaResult.schema.properties.bool_field.type).toBe('boolean');
      expect(schemaResult.schema.properties.select_field.enum).toEqual(['option1', 'option2']);
      expect(schemaResult.schema.properties.multi_field.type).toBe('array');

      // Verify defaults
      expect(schemaResult.formData?.string_field).toBe('hello');
      expect(schemaResult.formData?.int_field).toBe(42);
      expect(schemaResult.formData?.float_field).toBe(3.14);
      expect(schemaResult.formData?.bool_field).toBe(true);
      expect(schemaResult.formData?.select_field).toBe('option1');
      expect(schemaResult.formData?.multi_field).toEqual(['a', 'b']);
    });

    it('generated schema validates form data correctly', () => {
      const yaml = `
apiVersion: upg/v1
metadata:
  name: schema-validation
  version: "1.0.0"
  description: Test schema validation
prompts:
  - id: name
    type: string
    message: Name?
    required: true
    validator: "^[a-z]+$"
  - id: email
    type: string
    message: Email?
    required: true
    validator: "^[^@]+@[^@]+$"
actions:
  - type: generate
    src: template/
    dest: ./
`;

      const manifest = parseYaml<UpgManifest>(yaml);
      const schemaResult = transpileManifestToSchema(manifest);

      // Use AJV from core package through createValidator
      const ajv = createValidator();
      const validate = ajv.compile(schemaResult.schema);

      // Valid data
      expect(validate({ name: 'hello', email: 'test@example.com' })).toBe(true);

      // Invalid: name doesn't match pattern
      expect(validate({ name: 'Hello123', email: 'test@example.com' })).toBe(false);

      // Invalid: email doesn't match pattern
      expect(validate({ name: 'hello', email: 'invalid-email' })).toBe(false);

      // Invalid: missing required field
      expect(validate({ email: 'test@example.com' })).toBe(false);
    });
  });

  describe('Conditional Logic Integration', () => {
    it('transpiles when clauses to dependencies', () => {
      const yaml = `
apiVersion: upg/v1
metadata:
  name: conditional-test
  version: "1.0.0"
  description: Test conditional logic
prompts:
  - id: use_database
    type: boolean
    message: Use database?
    default: false
  - id: db_type
    type: select
    message: Database type?
    choices:
      - postgresql
      - mysql
      - sqlite
    when: use_database
  - id: db_host
    type: string
    message: Database host?
    default: localhost
    when: use_database
actions:
  - type: generate
    src: template/
    dest: ./
`;

      const manifest = parseYaml<UpgManifest>(yaml);
      const conditionalResult = transpileConditionalLogic(manifest.prompts);

      expect(conditionalResult.dependencies).toBeDefined();
      expect(conditionalResult.dependencies?.use_database).toContain('db_type');
      expect(conditionalResult.dependencies?.use_database).toContain('db_host');
    });

    it('evaluates when clauses at runtime', () => {
      const context = {
        use_database: true,
        db_type: 'postgresql',
      };

      // Simple truthy check
      expect(evaluateWhenClause('use_database', context)).toBe(true);
      expect(evaluateWhenClause('use_database', { use_database: false })).toBe(false);

      // Equality check
      expect(evaluateWhenClause("db_type == 'postgresql'", context)).toBe(true);
      expect(evaluateWhenClause("db_type == 'mysql'", context)).toBe(false);

      // Inequality check
      expect(evaluateWhenClause("db_type != 'mysql'", context)).toBe(true);

      // Negation
      expect(evaluateWhenClause('not use_database', context)).toBe(false);
    });

    it('handles complex conditional scenarios', () => {
      const yaml = `
apiVersion: upg/v1
metadata:
  name: complex-conditional
  version: "1.0.0"
  description: Complex conditional logic
prompts:
  - id: framework
    type: select
    message: Framework?
    choices:
      - react
      - vue
      - angular
  - id: react_version
    type: select
    message: React version?
    choices:
      - "17"
      - "18"
    when: "framework == 'react'"
  - id: vue_version
    type: select
    message: Vue version?
    choices:
      - "2"
      - "3"
    when: "framework == 'vue'"
  - id: use_typescript
    type: boolean
    message: Use TypeScript?
    default: true
  - id: tsconfig_strict
    type: boolean
    message: Strict TypeScript?
    when: use_typescript
actions:
  - type: generate
    src: template/
    dest: ./
`;

      const validationResult = validateManifest(yaml);
      expect(validationResult.valid).toBe(true);

      const manifest = parseYaml<UpgManifest>(yaml);
      const conditionalResult = transpileConditionalLogic(manifest.prompts);

      // Framework dependencies
      expect(conditionalResult.dependencies?.framework).toContain('react_version');
      expect(conditionalResult.dependencies?.framework).toContain('vue_version');

      // TypeScript dependency
      expect(conditionalResult.dependencies?.use_typescript).toContain('tsconfig_strict');

      // Evaluate scenarios
      expect(evaluateWhenClause("framework == 'react'", { framework: 'react' })).toBe(true);
      expect(evaluateWhenClause("framework == 'react'", { framework: 'vue' })).toBe(false);
      expect(evaluateWhenClause('use_typescript', { use_typescript: true })).toBe(true);
    });
  });

  describe('Validation and Transpilation Error Handling', () => {
    it('validation provides meaningful error messages', () => {
      const invalidYaml = `
apiVersion: upg/v1
metadata:
  name: invalid
prompts:
  - id: missing_type
    message: Missing type?
actions:
  - type: generate
    src: template/
    dest: ./
`;

      const result = validateManifest(invalidYaml);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);

      // Should have meaningful error about missing required fields
      const hasTypeError = result.errors.some(
        e => e.message.includes('type') || e.path.includes('type')
      );
      expect(hasTypeError).toBe(true);
    });

    it('handles missing choices for select type gracefully', () => {
      const yaml = `
apiVersion: upg/v1
metadata:
  name: missing-choices
  version: "1.0.0"
  description: Missing choices
prompts:
  - id: select_field
    type: select
    message: Choose?
actions:
  - type: generate
    src: template/
    dest: ./
`;

      const result = validateManifest(yaml);
      expect(result.valid).toBe(false);
    });

    it('validates prompt id format', () => {
      const yaml = `
apiVersion: upg/v1
metadata:
  name: invalid-id
  version: "1.0.0"
  description: Invalid prompt id
prompts:
  - id: "invalid id with spaces"
    type: string
    message: Test?
actions:
  - type: generate
    src: template/
    dest: ./
`;

      const result = validateManifest(yaml);
      expect(result.valid).toBe(false);
    });
  });

  describe('Round-trip Consistency', () => {
    it('manifest survives parse/stringify round-trip', () => {
      const original = {
        apiVersion: 'upg/v1',
        metadata: {
          name: 'roundtrip-test',
          version: '1.0.0',
          description: 'Test round-trip',
        },
        prompts: [
          {
            id: 'name',
            type: 'string',
            message: 'Name?',
            default: 'default-value',
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
      const parsed = parseYaml(yaml);

      expect(parsed).toEqual(original);
    });

    it('schema generation is deterministic', () => {
      const yaml = `
apiVersion: upg/v1
metadata:
  name: deterministic
  version: "1.0.0"
  description: Test determinism
prompts:
  - id: field1
    type: string
    message: Field 1?
  - id: field2
    type: int
    message: Field 2?
  - id: field3
    type: boolean
    message: Field 3?
actions:
  - type: generate
    src: template/
    dest: ./
`;

      const manifest = parseYaml<UpgManifest>(yaml);

      const result1 = transpileManifestToSchema(manifest);
      const result2 = transpileManifestToSchema(manifest);

      expect(JSON.stringify(result1.schema)).toBe(JSON.stringify(result2.schema));
      expect(JSON.stringify(result1.uiSchema)).toBe(JSON.stringify(result2.uiSchema));
      expect(JSON.stringify(result1.formData)).toBe(JSON.stringify(result2.formData));
    });
  });

  describe('UI Schema Generation', () => {
    it('generates appropriate UI schema for different types', () => {
      const yaml = `
apiVersion: upg/v1
metadata:
  name: ui-schema-test
  version: "1.0.0"
  description: UI schema test
prompts:
  - id: password
    type: secret
    message: Password?
  - id: description
    type: string
    message: Description?
    help: Enter a detailed description
  - id: hidden_field
    type: string
    message: Hidden?
    hidden: true
actions:
  - type: generate
    src: template/
    dest: ./
`;

      const manifest = parseYaml<UpgManifest>(yaml);
      const result = transpileManifestToSchema(manifest, { includeUiSchema: true });

      // Secret should have password widget
      expect(result.uiSchema?.password).toBeDefined();
      expect(result.uiSchema?.password['ui:widget']).toBe('password');

      // Help text should be in ui:help
      expect(result.uiSchema?.description).toBeDefined();
      expect(result.uiSchema?.description['ui:help']).toBe('Enter a detailed description');

      // Hidden field should have ui:hidden true (not ui:widget)
      expect(result.uiSchema?.hidden_field).toBeDefined();
      expect(result.uiSchema?.hidden_field['ui:hidden']).toBe(true);
    });
  });

  describe('Choice Handling', () => {
    it('handles string array choices', () => {
      const yaml = `
apiVersion: upg/v1
metadata:
  name: string-choices
  version: "1.0.0"
  description: String choices
prompts:
  - id: color
    type: select
    message: Color?
    choices:
      - red
      - green
      - blue
actions:
  - type: generate
    src: template/
    dest: ./
`;

      const manifest = parseYaml<UpgManifest>(yaml);
      const result = transpileManifestToSchema(manifest);

      expect(result.schema.properties.color.enum).toEqual(['red', 'green', 'blue']);
    });

    it('handles label/value object choices', () => {
      const yaml = `
apiVersion: upg/v1
metadata:
  name: object-choices
  version: "1.0.0"
  description: Object choices
prompts:
  - id: database
    type: select
    message: Database?
    choices:
      - label: PostgreSQL
        value: pg
      - label: MySQL
        value: mysql
      - label: SQLite
        value: sqlite
actions:
  - type: generate
    src: template/
    dest: ./
`;

      const manifest = parseYaml<UpgManifest>(yaml);
      const result = transpileManifestToSchema(manifest);

      // Should extract values for enum
      expect(result.schema.properties.database.enum).toEqual(['pg', 'mysql', 'sqlite']);

      // enumNames should be in schema properties (not uiSchema)
      expect(result.schema.properties.database.enumNames).toEqual([
        'PostgreSQL',
        'MySQL',
        'SQLite',
      ]);
    });
  });
});
