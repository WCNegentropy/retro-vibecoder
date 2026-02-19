/**
 * AJV-based schema validator for UPG manifests
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import {
  type UpgManifest,
  type ValidationResult,
  type ValidationError,
  type ValidationWarning,
  VALIDATION_ERRORS,
  parseYaml,
  hasUniqueValues,
  isValidRegex,
} from '@wcnegentropy/shared';
import { manifestSchema } from './upg-manifest-schema.js';

/**
 * Validator options
 */
export interface ValidatorOptions {
  /** Whether to collect all errors (vs. fail fast) */
  allErrors?: boolean;
  /** Whether to include warnings */
  includeWarnings?: boolean;
  /** Custom schema to use */
  schema?: object;
}

/**
 * Validator result with parsed manifest
 */
export interface ValidatorResult extends ValidationResult {
  /** Parsed manifest (if valid) */
  manifest?: UpgManifest;
}

/**
 * Create a new AJV validator instance
 */
export function createValidator(options: ValidatorOptions = {}): Ajv {
  const ajv = new Ajv({
    allErrors: options.allErrors ?? true,
    verbose: true,
    // Disable strict mode to allow JSON Schema features like if/then with required
    strict: false,
  });

  // Add format validators
  addFormats(ajv);

  // Add the manifest schema
  ajv.addSchema(options.schema ?? manifestSchema);

  return ajv;
}

/**
 * Convert AJV error to ValidationError
 */
function ajvErrorToValidationError(error: {
  instancePath: string;
  message?: string;
  keyword: string;
  params: Record<string, unknown>;
}): ValidationError {
  const path = error.instancePath.replace(/^\//, '').replace(/\//g, '.');

  return {
    code: VALIDATION_ERRORS.SCHEMA_VALIDATION_FAILED,
    message: error.message || `Validation failed at ${path}`,
    path: path || 'root',
  };
}

/**
 * Check for potential issues that aren't schema errors
 */
function checkWarnings(manifest: UpgManifest): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  // Check for deprecated lifecycle
  if (manifest.metadata.lifecycle === 'deprecated') {
    warnings.push({
      code: 'DEPRECATED_TEMPLATE',
      message: 'This template is marked as deprecated',
      path: 'metadata.lifecycle',
      suggestion: 'Consider using a newer version or alternative template',
    });
  }

  // Check for missing description
  if (!manifest.metadata.description || manifest.metadata.description.length < 10) {
    warnings.push({
      code: 'SHORT_DESCRIPTION',
      message: 'Template description is missing or very short',
      path: 'metadata.description',
      suggestion: 'Add a meaningful description to help users understand this template',
    });
  }

  // Check for missing tags
  if (!manifest.metadata.tags || manifest.metadata.tags.length === 0) {
    warnings.push({
      code: 'MISSING_TAGS',
      message: 'No tags specified for template',
      path: 'metadata.tags',
      suggestion: 'Add tags to help with template discovery in the marketplace',
    });
  }

  // Check for prompts without help text
  for (let i = 0; i < manifest.prompts.length; i++) {
    const prompt = manifest.prompts[i];
    if (!prompt.help && !prompt.hidden) {
      warnings.push({
        code: 'MISSING_HELP_TEXT',
        message: `Prompt "${prompt.id}" has no help text`,
        path: `prompts[${i}].help`,
        suggestion: 'Add help text to guide users filling out this field',
      });
    }
  }

  // Check for select prompts without clear labels
  for (let i = 0; i < manifest.prompts.length; i++) {
    const prompt = manifest.prompts[i];
    if ((prompt.type === 'select' || prompt.type === 'multiselect') && prompt.choices) {
      if (
        Array.isArray(prompt.choices) &&
        prompt.choices.length > 0 &&
        typeof prompt.choices[0] === 'string'
      ) {
        warnings.push({
          code: 'SIMPLE_CHOICES',
          message: `Prompt "${prompt.id}" uses simple string choices`,
          path: `prompts[${i}].choices`,
          suggestion: 'Consider using {label, value} objects for better UX',
        });
      }
    }
  }

  // Check for enrichment configuration issues
  const manifest_any = manifest as Record<string, unknown>;
  if (manifest_any.enrichment) {
    const enrichment = manifest_any.enrichment as Record<string, unknown>;
    if (enrichment.enabled === true && !enrichment.depth) {
      warnings.push({
        code: 'ENRICHMENT_NO_DEPTH',
        message: 'Enrichment is enabled but no depth preset is specified',
        path: 'enrichment.depth',
        suggestion: 'Add depth: "standard" to set a default enrichment depth',
      });
    }
  }

  return warnings;
}

/**
 * Validate a UPG manifest
 *
 * @param content - YAML content or parsed object
 * @param options - Validation options
 * @returns Validation result
 */
export function validateManifest(
  content: string | object,
  options: ValidatorOptions = {}
): ValidatorResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Parse YAML if string
  let data: unknown;
  if (typeof content === 'string') {
    try {
      data = parseYaml(content);
    } catch (error) {
      return {
        valid: false,
        errors: [
          {
            code: VALIDATION_ERRORS.INVALID_YAML,
            message: error instanceof Error ? error.message : 'Invalid YAML',
            path: 'root',
          },
        ],
        warnings: [],
      };
    }
  } else {
    data = content;
  }

  // Validate against schema
  const ajv = createValidator(options);
  const validate = ajv.getSchema(manifestSchema.$id);

  if (!validate) {
    throw new Error('Failed to compile schema');
  }

  const valid = validate(data);

  if (!valid && validate.errors) {
    for (const error of validate.errors) {
      errors.push(
        ajvErrorToValidationError({
          instancePath: error.instancePath,
          message: error.message,
          keyword: error.keyword,
          params: error.params as Record<string, unknown>,
        })
      );
    }
  }

  // If schema-valid, run post-schema checks (Bugs 14 & 15)
  if (valid) {
    const manifest = data as UpgManifest;

    // Bug 14: Check for duplicate prompt IDs
    if (manifest.prompts && manifest.prompts.length > 0) {
      const promptIds = manifest.prompts.map(p => p.id);
      if (!hasUniqueValues(promptIds)) {
        const dupes = promptIds.filter((id, i) => promptIds.indexOf(id) !== i);
        errors.push({
          code: 'DUPLICATE_PROMPT_ID',
          message: `Duplicate prompt ID: '${dupes[0]}'`,
          path: 'prompts',
        });
      }

      // Bug 15: Check for invalid regex validators
      for (let i = 0; i < manifest.prompts.length; i++) {
        const prompt = manifest.prompts[i];
        if (prompt.validator && !isValidRegex(prompt.validator)) {
          errors.push({
            code: 'INVALID_VALIDATOR_REGEX',
            message: `Invalid regex in prompt '${prompt.id}': ${prompt.validator}`,
            path: `prompts[${i}].validator`,
          });
        }
      }
    }
  }

  // If valid, check for warnings
  if (valid && errors.length === 0 && options.includeWarnings !== false) {
    warnings.push(...checkWarnings(data as UpgManifest));
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    manifest: errors.length === 0 ? (data as UpgManifest) : undefined,
  };
}
