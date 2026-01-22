/**
 * UPG Desktop Type Definitions
 *
 * Types for the Tauri frontend, mirroring the procedural engine types.
 */

/** High-level project archetype */
export type Archetype = 'web' | 'backend' | 'cli' | 'mobile' | 'desktop' | 'game' | 'library';

/** Supported programming languages */
export type Language =
  | 'typescript'
  | 'javascript'
  | 'python'
  | 'go'
  | 'rust'
  | 'java'
  | 'csharp'
  | 'cpp'
  | 'swift'
  | 'kotlin'
  | 'php'
  | 'ruby';

/** Runtime environments */
export type Runtime = 'node' | 'deno' | 'bun' | 'jvm' | 'dotnet' | 'native' | 'browser';

/** Framework types */
export type Framework = string;

/** Database types */
export type Database =
  | 'postgres'
  | 'mysql'
  | 'sqlite'
  | 'mongodb'
  | 'redis'
  | 'neo4j'
  | 'none';

/** CI/CD platforms */
export type CICD = 'github-actions' | 'gitlab-ci' | 'circleci' | 'none';

/** Container packaging */
export type Packaging = 'docker' | 'podman' | 'nix' | 'none';

/** Complete tech stack configuration */
export interface TechStack {
  archetype: Archetype;
  language: Language;
  runtime: Runtime;
  framework: Framework;
  database: Database;
  orm: string;
  transport: string;
  packaging: Packaging;
  cicd: CICD;
  buildTool: string;
  styling: string;
  testing: string;
}

/** Generation mode */
export type GenerationMode = 'manifest' | 'procedural' | 'hybrid';

/** Generation request to Tauri backend */
export interface GenerationRequest {
  mode: GenerationMode;
  manifest_path?: string;
  seed?: number;
  stack?: Partial<TechStack>;
  output_path: string;
  answers?: Record<string, unknown>;
}

/** Generation result from Tauri backend */
export interface GenerationResult {
  success: boolean;
  message: string;
  files_generated: string[];
  output_path: string;
  duration_ms: number;
}

/** Preview result */
export interface PreviewResult {
  files: Record<string, string>;
  stack?: TechStack;
  seed?: number;
}

/** Generated project (from procedural engine) */
export interface GeneratedProject {
  id: string;
  seed: number;
  name: string;
  files: Record<string, string>;
  stack: TechStack;
  metadata: {
    generatedAt: string;
    upgVersion: string;
    durationMs: number;
  };
}

/** Template entry from registry */
export interface TemplateEntry {
  name: string;
  version: string;
  title: string;
  description: string;
  tags: string[];
  icon?: string;
  author?: string;
  lifecycle: 'experimental' | 'production' | 'deprecated';
  path: string;
}

/** Registry seed entry */
export interface SeedEntry {
  seed: number;
  stack: TechStack;
  files: string[];
  validatedAt: string;
  tags: string[];
}

/** Matrix dimension option */
export interface MatrixOption<T extends string> {
  id: T;
  name: string;
  description?: string;
  icon?: string;
  compatible?: string[];
  incompatible?: string[];
}

/** Matrix dimension for UI selection */
export interface MatrixDimension<T extends string> {
  id: string;
  name: string;
  description: string;
  options: MatrixOption<T>[];
  required: boolean;
}
