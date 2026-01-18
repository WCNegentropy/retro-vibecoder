/**
 * TypeScript interfaces for the UPG Manifest (upg.yaml)
 *
 * These types define the structure of the Universal Manifest specification.
 */

/**
 * Supported API versions for the UPG manifest
 */
export type ApiVersion = 'upg/v1';

/**
 * Lifecycle states for templates
 */
export type Lifecycle = 'experimental' | 'production' | 'deprecated';

/**
 * Prompt types supported by the UPG
 */
export type PromptType =
  | 'string'
  | 'int'
  | 'float'
  | 'boolean'
  | 'select'
  | 'multiselect'
  | 'secret';

/**
 * Action types for template generation
 */
export type ActionType = 'generate' | 'copy' | 'skip' | 'command' | 'create_file';

/**
 * Error handling strategies
 */
export type OnError = 'fail' | 'warn' | 'ignore';

/**
 * Conflict resolution strategies for Smart Update
 */
export type ConflictResolution = 'manual' | 'auto-accept-template' | 'auto-accept-user';

/**
 * Repository information
 */
export interface Repository {
  type: 'git' | 'svn';
  url: string;
}

/**
 * Documentation links
 */
export interface Documentation {
  url: string;
}

/**
 * Metadata section of the UPG manifest
 */
export interface ManifestMetadata {
  /** Unique identifier of the template */
  name: string;
  /** Semantic version of the template */
  version: string;
  /** Human-readable title */
  title?: string;
  /** Description of the template */
  description: string;
  /** Categorization tags */
  tags?: string[];
  /** URL or path to an icon */
  icon?: string;
  /** Author name or organization */
  author?: string;
  /** License identifier */
  license?: string;
  /** Repository information */
  repository?: Repository;
  /** Documentation URL */
  documentation?: Documentation;
  /** Catalog type (for Backstage integration) */
  'catalog-type'?: string;
  /** Lifecycle state */
  lifecycle?: Lifecycle;
  /** Owner team or individual */
  owner?: string;
}

/**
 * Choice option for select/multiselect prompts
 */
export interface PromptChoice {
  /** Display label */
  label: string;
  /** Actual value */
  value: string;
}

/**
 * Prompt definition in the UPG manifest
 */
export interface ManifestPrompt {
  /** Unique identifier (variable key) */
  id: string;
  /** Data type */
  type: PromptType;
  /** Short title for the field */
  title?: string;
  /** Human-readable question */
  message: string;
  /** Extended help text */
  help?: string;
  /** Default value (can be Jinja2 expression) */
  default?: unknown;
  /** Whether the field is required */
  required?: boolean;
  /** Hide from UI (computed field) */
  hidden?: boolean;
  /** Regex validator */
  validator?: string;
  /** Custom error message */
  error_message?: string;
  /** Conditional display (Jinja2 expression) */
  when?: string;
  /** Choices for select/multiselect */
  choices?: string[] | PromptChoice[];
}

/**
 * Breaking change documentation
 */
export interface BreakingChange {
  /** Version where breaking change was introduced */
  version: string;
  /** List of changes */
  changes: string[];
  /** Migration notes */
  migration_notes?: string;
  /** URL to migration guide */
  migration_url?: string;
}

/**
 * Smart Update configuration
 */
export interface SmartUpdateConfig {
  /** Whether smart update is enabled */
  enabled: boolean;
  /** Files to preserve during updates */
  preserve_files?: string[];
  /** Files to always regenerate */
  regenerate_files?: string[];
  /** Conflict resolution strategy */
  conflict_resolution?: ConflictResolution;
}

/**
 * Template configuration section
 */
export interface TemplateConfig {
  /** Marker files to detect this template */
  markers?: string[];
  /** Breaking changes documentation */
  breaking_changes?: BreakingChange[];
  /** Smart update configuration */
  smart_update?: SmartUpdateConfig;
}

/**
 * Generate action - process templates with Jinja2
 */
export interface GenerateAction {
  type: 'generate';
  /** Source directory/file */
  src: string;
  /** Destination directory/file */
  dest: string;
  /** Patterns to exclude */
  exclude?: string[];
  /** Variables to pass to templates */
  variables?: Record<string, string>;
}

/**
 * Copy action - binary copy without processing
 */
export interface CopyAction {
  type: 'copy';
  /** Source path */
  src: string;
  /** Destination path */
  dest: string;
}

/**
 * Skip action - exclude files based on conditions
 */
export interface SkipAction {
  type: 'skip';
  /** Path pattern to skip */
  path: string;
  /** Condition for skipping */
  when?: string;
}

/**
 * Command action - run shell commands
 */
export interface CommandAction {
  type: 'command';
  /** Command to execute */
  command: string;
  /** Description for logging */
  description?: string;
  /** Condition for execution */
  when?: string;
  /** Error handling strategy */
  on_error?: OnError;
}

/**
 * Create file action - create files with inline content
 */
export interface CreateFileAction {
  type: 'create_file';
  /** File path */
  path: string;
  /** File content (can contain Jinja2) */
  content: string;
}

/**
 * Union type for all action types
 */
export type ManifestAction =
  | GenerateAction
  | CopyAction
  | SkipAction
  | CommandAction
  | CreateFileAction;

/**
 * Hook configuration
 */
export interface HookConfig {
  /** Script path to execute */
  script: string;
  /** Description for logging */
  description?: string;
  /** Condition for execution */
  when?: string;
  /** Error handling strategy */
  on_error?: OnError;
}

/**
 * Hooks section
 */
export interface ManifestHooks {
  /** Post-generation hook */
  post_generation?: HookConfig;
  /** Pre-migration hook (for updates) */
  pre_migration?: HookConfig;
}

/**
 * Custom validation rule
 */
export interface ValidationRule {
  rule: string;
  params?: Record<string, unknown>;
  message?: string;
  condition?: string;
  requires?: string;
}

/**
 * FAQ entry
 */
export interface FaqEntry {
  question: string;
  answer: string;
}

/**
 * Documentation section
 */
export interface ManifestDocumentation {
  /** Quick start guide */
  quickstart?: string;
  /** Custom setup instructions */
  custom_setup?: string;
  /** Customization guide */
  customization_guide?: string;
  /** FAQ entries */
  faq?: FaqEntry[];
}

/**
 * Complete UPG Manifest structure
 */
export interface UpgManifest {
  /** Schema version */
  apiVersion: ApiVersion;
  /** Template metadata */
  metadata: ManifestMetadata;
  /** Template configuration */
  template?: TemplateConfig;
  /** Interactive prompts */
  prompts: ManifestPrompt[];
  /** Generation actions */
  actions: ManifestAction[];
  /** Lifecycle hooks */
  hooks?: ManifestHooks;
  /** Custom validation rules */
  validation?: Record<string, ValidationRule[]>;
  /** Documentation */
  documentation?: ManifestDocumentation;
}

/**
 * Result of manifest validation
 */
export interface ValidationResult {
  /** Whether the manifest is valid */
  valid: boolean;
  /** Validation errors */
  errors: ValidationError[];
  /** Validation warnings */
  warnings: ValidationWarning[];
}

/**
 * Validation error
 */
export interface ValidationError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Path to the invalid field */
  path: string;
  /** Line number in source (if available) */
  line?: number;
  /** Column number in source (if available) */
  column?: number;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  /** Warning code */
  code: string;
  /** Warning message */
  message: string;
  /** Path to the field */
  path: string;
  /** Suggested fix */
  suggestion?: string;
}
