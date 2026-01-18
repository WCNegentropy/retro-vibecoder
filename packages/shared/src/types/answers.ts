/**
 * TypeScript interfaces for UPG Answers (stored project state)
 */

/**
 * Answers file structure (.upg-answers.yaml)
 *
 * This file is generated in projects to track:
 * - Which template was used
 * - What version of the template
 * - User's answers to prompts
 * - Generation metadata
 */
export interface UpgAnswers {
  /** Schema version for answers file */
  _version: string;

  /** Template information */
  _template: TemplateInfo;

  /** Generation metadata */
  _generated: GenerationMetadata;

  /** User's answers to prompts (keyed by prompt id) */
  [key: string]: unknown;
}

/**
 * Template information stored in answers
 */
export interface TemplateInfo {
  /** Template name */
  name: string;
  /** Template version used */
  version: string;
  /** Source URL (registry or local path) */
  source: string;
  /** Commit hash (if from git) */
  commit?: string;
}

/**
 * Generation metadata
 */
export interface GenerationMetadata {
  /** Timestamp of generation */
  timestamp: string;
  /** UPG version used */
  upgVersion: string;
  /** Sidecar used for generation */
  sidecar?: string;
  /** Sidecar version */
  sidecarVersion?: string;
  /** Generation duration in ms */
  durationMs?: number;
}

/**
 * Update history entry
 */
export interface UpdateHistoryEntry {
  /** Timestamp of update */
  timestamp: string;
  /** Previous version */
  fromVersion: string;
  /** New version */
  toVersion: string;
  /** Whether conflicts occurred */
  hadConflicts: boolean;
  /** Number of files updated */
  filesUpdated: number;
  /** Number of files added */
  filesAdded: number;
  /** Number of files removed */
  filesRemoved: number;
}

/**
 * Extended answers file with update history
 */
export interface UpgAnswersWithHistory extends UpgAnswers {
  /** Update history */
  _updateHistory?: UpdateHistoryEntry[];
}

/**
 * Context passed to templates during generation
 */
export interface GenerationContext {
  /** All user answers */
  answers: Record<string, unknown>;
  /** Environment variables */
  env: Record<string, string>;
  /** Current working directory */
  cwd: string;
  /** Destination directory */
  destDir: string;
  /** Template directory */
  templateDir: string;
  /** UPG version */
  upgVersion: string;
}
