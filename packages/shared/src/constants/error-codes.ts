/**
 * Error codes for the UPG system
 *
 * Error codes follow the format: UPG-XXX-YYY
 * - XXX: Category (100 = validation, 200 = generation, 300 = registry, etc.)
 * - YYY: Specific error
 */

/**
 * Validation error codes (UPG-1XX)
 */
export const VALIDATION_ERRORS = {
  /** Manifest file not found */
  MANIFEST_NOT_FOUND: 'UPG-100-001',
  /** Manifest file too large */
  MANIFEST_TOO_LARGE: 'UPG-100-002',
  /** Invalid YAML syntax */
  INVALID_YAML: 'UPG-100-003',
  /** Missing required field */
  MISSING_REQUIRED_FIELD: 'UPG-100-004',
  /** Invalid field type */
  INVALID_FIELD_TYPE: 'UPG-100-005',
  /** Invalid field value */
  INVALID_FIELD_VALUE: 'UPG-100-006',
  /** Unsupported API version */
  UNSUPPORTED_API_VERSION: 'UPG-100-007',
  /** Invalid prompt definition */
  INVALID_PROMPT: 'UPG-100-008',
  /** Invalid action definition */
  INVALID_ACTION: 'UPG-100-009',
  /** Circular dependency detected */
  CIRCULAR_DEPENDENCY: 'UPG-100-010',
  /** Invalid regex pattern */
  INVALID_REGEX: 'UPG-100-011',
  /** Invalid Jinja2 expression */
  INVALID_JINJA_EXPRESSION: 'UPG-100-012',
  /** Schema validation failed */
  SCHEMA_VALIDATION_FAILED: 'UPG-100-013',
} as const;

/**
 * Generation error codes (UPG-2XX)
 */
export const GENERATION_ERRORS = {
  /** Template directory not found */
  TEMPLATE_NOT_FOUND: 'UPG-200-001',
  /** Destination already exists */
  DEST_EXISTS: 'UPG-200-002',
  /** Permission denied */
  PERMISSION_DENIED: 'UPG-200-003',
  /** Disk space insufficient */
  DISK_FULL: 'UPG-200-004',
  /** Jinja2 template error */
  TEMPLATE_ERROR: 'UPG-200-005',
  /** Hook execution failed */
  HOOK_FAILED: 'UPG-200-006',
  /** Command execution failed */
  COMMAND_FAILED: 'UPG-200-007',
  /** Generation timeout */
  TIMEOUT: 'UPG-200-008',
  /** Sidecar not available */
  SIDECAR_NOT_AVAILABLE: 'UPG-200-009',
  /** Sidecar execution failed */
  SIDECAR_FAILED: 'UPG-200-010',
  /** File copy failed */
  COPY_FAILED: 'UPG-200-011',
  /** Generation aborted by user */
  ABORTED: 'UPG-200-012',
} as const;

/**
 * Registry error codes (UPG-3XX)
 */
export const REGISTRY_ERRORS = {
  /** Registry not found */
  REGISTRY_NOT_FOUND: 'UPG-300-001',
  /** Template not found in registry */
  TEMPLATE_NOT_IN_REGISTRY: 'UPG-300-002',
  /** Version not found */
  VERSION_NOT_FOUND: 'UPG-300-003',
  /** Registry sync failed */
  SYNC_FAILED: 'UPG-300-004',
  /** Network error */
  NETWORK_ERROR: 'UPG-300-005',
  /** Invalid registry format */
  INVALID_REGISTRY: 'UPG-300-006',
  /** Authentication required */
  AUTH_REQUIRED: 'UPG-300-007',
  /** Rate limit exceeded */
  RATE_LIMITED: 'UPG-300-008',
} as const;

/**
 * Update error codes (UPG-4XX)
 */
export const UPDATE_ERRORS = {
  /** Not a UPG project */
  NOT_UPG_PROJECT: 'UPG-400-001',
  /** Answers file corrupted */
  ANSWERS_CORRUPTED: 'UPG-400-002',
  /** No updates available */
  NO_UPDATES: 'UPG-400-003',
  /** Merge conflict */
  MERGE_CONFLICT: 'UPG-400-004',
  /** Update failed */
  UPDATE_FAILED: 'UPG-400-005',
  /** Incompatible version */
  INCOMPATIBLE_VERSION: 'UPG-400-006',
  /** Project has uncommitted changes */
  UNCOMMITTED_CHANGES: 'UPG-400-007',
} as const;

/**
 * Configuration error codes (UPG-5XX)
 */
export const CONFIG_ERRORS = {
  /** Config file not found */
  CONFIG_NOT_FOUND: 'UPG-500-001',
  /** Invalid config format */
  INVALID_CONFIG: 'UPG-500-002',
  /** Missing required config */
  MISSING_CONFIG: 'UPG-500-003',
} as const;

/**
 * All error codes
 */
export const ERROR_CODES = {
  ...VALIDATION_ERRORS,
  ...GENERATION_ERRORS,
  ...REGISTRY_ERRORS,
  ...UPDATE_ERRORS,
  ...CONFIG_ERRORS,
} as const;

/**
 * Error code type
 */
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * Get error category from code
 */
export function getErrorCategory(code: ErrorCode): string {
  const category = code.split('-')[1];
  switch (category) {
    case '100':
      return 'Validation';
    case '200':
      return 'Generation';
    case '300':
      return 'Registry';
    case '400':
      return 'Update';
    case '500':
      return 'Configuration';
    default:
      return 'Unknown';
  }
}
