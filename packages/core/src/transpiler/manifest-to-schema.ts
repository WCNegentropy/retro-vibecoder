/**
 * Manifest to JSON Schema transpiler
 *
 * Converts UPG Manifest prompts to JSON Schema for use with RJSF.
 */

import type { UpgManifest, ManifestPrompt, PromptChoice } from '@retro-vibecoder/shared';
import { transpileConditionalLogic } from './conditional-logic.js';

/**
 * JSON Schema property type
 */
interface JsonSchemaProperty {
  type?: string | string[];
  title?: string;
  description?: string;
  default?: unknown;
  enum?: string[];
  enumNames?: string[];
  pattern?: string;
  format?: string;
  minimum?: number;
  maximum?: number;
  items?: JsonSchemaProperty;
  uniqueItems?: boolean;
}

/**
 * JSON Schema object
 */
interface JsonSchema {
  $schema: string;
  type: string;
  title?: string;
  description?: string;
  properties: Record<string, JsonSchemaProperty>;
  required: string[];
  dependencies?: Record<string, unknown>;
  allOf?: Array<{
    if: { properties: Record<string, unknown> };
    then: { properties: Record<string, unknown> };
  }>;
}

/**
 * UI Schema for RJSF
 */
interface UiSchema {
  [key: string]: {
    'ui:widget'?: string;
    'ui:help'?: string;
    'ui:placeholder'?: string;
    'ui:options'?: Record<string, unknown>;
    'ui:hidden'?: boolean;
  };
}

/**
 * Transpiler options
 */
export interface TranspilerOptions {
  /** Include UI schema in output */
  includeUiSchema?: boolean;
  /** Include conditional logic (dependencies) */
  includeConditionals?: boolean;
  /** Preserve Jinja2 expressions in defaults */
  preserveJinja2Defaults?: boolean;
}

/**
 * Transpiler result
 */
export interface TranspilerResult {
  /** JSON Schema for form validation */
  schema: JsonSchema;
  /** UI Schema for RJSF customization */
  uiSchema?: UiSchema;
  /** Form data defaults */
  formData?: Record<string, unknown>;
}

/**
 * Map prompt type to JSON Schema type
 */
function mapPromptTypeToSchema(type: ManifestPrompt['type']): string | string[] {
  switch (type) {
    case 'string':
    case 'secret':
      return 'string';
    case 'int':
      return 'integer';
    case 'float':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'select':
      return 'string';
    case 'multiselect':
      return 'array';
    default:
      return 'string';
  }
}

/**
 * Get UI widget for prompt type
 */
function getUiWidget(type: ManifestPrompt['type']): string | undefined {
  switch (type) {
    case 'secret':
      return 'password';
    case 'select':
      return 'select';
    case 'multiselect':
      return 'checkboxes';
    case 'boolean':
      return 'checkbox';
    default:
      return undefined;
  }
}

/**
 * Extract choices from prompt
 */
function extractChoices(choices: string[] | PromptChoice[]): {
  enum: string[];
  enumNames?: string[];
} {
  if (choices.length === 0) {
    return { enum: [] };
  }

  // Check if simple string array
  if (typeof choices[0] === 'string') {
    return { enum: choices as string[] };
  }

  // Object choices with label/value
  const choiceObjects = choices as PromptChoice[];
  return {
    enum: choiceObjects.map(c => c.value),
    enumNames: choiceObjects.map(c => c.label),
  };
}

/**
 * Transpile a single prompt to JSON Schema property
 */
function transpilePrompt(prompt: ManifestPrompt): JsonSchemaProperty {
  const property: JsonSchemaProperty = {
    type: mapPromptTypeToSchema(prompt.type),
    title: prompt.title || prompt.message,
  };

  // Add description from help text
  if (prompt.help) {
    property.description = prompt.help;
  }

  // Add default value
  if (prompt.default !== undefined) {
    property.default = prompt.default;
  }

  // Add validator as pattern
  if (prompt.validator) {
    property.pattern = prompt.validator;
  }

  // Handle select/multiselect choices
  if ((prompt.type === 'select' || prompt.type === 'multiselect') && prompt.choices) {
    const { enum: enumValues, enumNames } = extractChoices(prompt.choices);

    if (prompt.type === 'select') {
      property.enum = enumValues;
      if (enumNames) {
        property.enumNames = enumNames;
      }
    } else {
      // Multiselect - array of enum values
      property.items = {
        type: 'string',
        enum: enumValues,
      };
      if (enumNames) {
        (property.items as JsonSchemaProperty).enumNames = enumNames;
      }
      property.uniqueItems = true;
    }
  }

  return property;
}

/**
 * Transpile a UPG Manifest to JSON Schema
 *
 * @param manifest - The UPG manifest to transpile
 * @param options - Transpiler options
 * @returns JSON Schema and optional UI schema
 */
export function transpileManifestToSchema(
  manifest: UpgManifest,
  options: TranspilerOptions = {}
): TranspilerResult {
  const schema: JsonSchema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    title: manifest.metadata.title || manifest.metadata.name,
    description: manifest.metadata.description,
    properties: {},
    required: [],
  };

  const uiSchema: UiSchema = {};
  const formData: Record<string, unknown> = {};

  // Process each prompt
  for (const prompt of manifest.prompts) {
    // Skip hidden prompts from schema (but include in formData for defaults)
    if (prompt.hidden) {
      if (prompt.default !== undefined) {
        formData[prompt.id] = prompt.default;
      }
      if (options.includeUiSchema) {
        uiSchema[prompt.id] = { 'ui:hidden': true };
      }
      continue;
    }

    // Transpile prompt to schema property
    schema.properties[prompt.id] = transpilePrompt(prompt);

    // Add to required array if needed
    if (prompt.required) {
      schema.required.push(prompt.id);
    }

    // Set default in formData
    if (prompt.default !== undefined) {
      // Handle Jinja2 expressions in defaults
      if (
        typeof prompt.default === 'string' &&
        prompt.default.includes('{{') &&
        !options.preserveJinja2Defaults
      ) {
        // Skip Jinja2 expressions - they'll be evaluated at runtime
      } else {
        formData[prompt.id] = prompt.default;
      }
    }

    // Build UI schema
    if (options.includeUiSchema) {
      const ui: UiSchema[string] = {};

      const widget = getUiWidget(prompt.type);
      if (widget) {
        ui['ui:widget'] = widget;
      }

      if (prompt.help) {
        ui['ui:help'] = prompt.help;
      }

      if (Object.keys(ui).length > 0) {
        uiSchema[prompt.id] = ui;
      }
    }
  }

  // Handle conditional logic
  if (options.includeConditionals) {
    const conditionals = transpileConditionalLogic(manifest.prompts);
    if (conditionals.dependencies) {
      schema.dependencies = conditionals.dependencies;
    }
    if (conditionals.allOf && conditionals.allOf.length > 0) {
      schema.allOf = conditionals.allOf;
    }
  }

  const result: TranspilerResult = {
    schema,
    formData,
  };

  if (options.includeUiSchema) {
    result.uiSchema = uiSchema;
  }

  return result;
}
