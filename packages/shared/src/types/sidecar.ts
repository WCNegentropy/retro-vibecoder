/**
 * TypeScript interfaces for Sidecar orchestration
 */

/**
 * Supported sidecar types
 */
export type SidecarType = 'copier' | 'yeoman' | 'custom';

/**
 * Sidecar configuration
 */
export interface SidecarConfig {
  /** Sidecar type */
  type: SidecarType;
  /** Path to the sidecar binary */
  binaryPath: string;
  /** Sidecar version */
  version: string;
  /** Supported features */
  features: SidecarFeature[];
  /** Environment variables to set */
  env?: Record<string, string>;
}

/**
 * Features supported by a sidecar
 */
export type SidecarFeature =
  | 'jinja2'
  | 'handlebars'
  | 'ejs'
  | 'hooks'
  | 'smart-update'
  | 'validation';

/**
 * Sidecar execution request
 */
export interface SidecarRequest {
  /** Template path */
  templatePath: string;
  /** Destination path */
  destPath: string;
  /** User answers/context */
  context: Record<string, unknown>;
  /** Whether to run in dry-run mode */
  dryRun?: boolean;
  /** Whether to force overwrite */
  force?: boolean;
  /** Files to skip */
  skip?: string[];
  /** Additional arguments */
  extraArgs?: string[];
}

/**
 * Sidecar execution response
 */
export interface SidecarResponse {
  /** Whether execution was successful */
  success: boolean;
  /** Exit code */
  exitCode: number;
  /** Generated files */
  files: GeneratedFile[];
  /** Execution duration in ms */
  durationMs: number;
  /** Error message (if failed) */
  error?: string;
}

/**
 * Generated file information
 */
export interface GeneratedFile {
  /** Relative path */
  path: string;
  /** File operation */
  operation: 'created' | 'modified' | 'skipped' | 'deleted';
  /** File size in bytes */
  size?: number;
}

/**
 * Sidecar event types for streaming output
 */
export type SidecarEventType =
  | 'start'
  | 'progress'
  | 'file'
  | 'log'
  | 'warning'
  | 'error'
  | 'complete';

/**
 * Sidecar event (for streaming output)
 */
export interface SidecarEvent {
  /** Event type */
  type: SidecarEventType;
  /** Timestamp */
  timestamp: string;
  /** Event message */
  message: string;
  /** Additional data */
  data?: unknown;
}

/**
 * Sidecar stream for real-time output
 */
export interface SidecarStream {
  /** Subscribe to events */
  subscribe(callback: (event: SidecarEvent) => void): void;
  /** Unsubscribe from events */
  unsubscribe(): void;
  /** Wait for completion */
  wait(): Promise<SidecarResponse>;
  /** Abort execution */
  abort(): void;
}

/**
 * Sidecar registry (available sidecars)
 */
export interface SidecarRegistry {
  /** Available sidecars */
  sidecars: SidecarConfig[];
  /** Default sidecar type */
  defaultType: SidecarType;
}
