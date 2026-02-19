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
export type Database = 'postgres' | 'mysql' | 'sqlite' | 'mongodb' | 'redis' | 'neo4j' | 'none';

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

/**
 * Generation mode
 *
 * 'procedural' - seed → stack → files via the procedural engine
 * 'template' - UPG manifest template with Nunjucks rendering
 */
export type GenerationMode = 'procedural' | 'template';

/** Enrichment depth preset */
export type EnrichmentDepth = 'minimal' | 'standard' | 'full';

/** Enrichment configuration for Pass 2 */
export interface EnrichmentConfig {
  /** Whether enrichment is enabled */
  enabled: boolean;
  /** Enrichment depth preset */
  depth: EnrichmentDepth;
  /** Individual flag overrides (undefined = use depth default) */
  cicd?: boolean;
  release?: boolean;
  fillLogic?: boolean;
  tests?: boolean;
  dockerProd?: boolean;
  linting?: boolean;
  envFiles?: boolean;
  docs?: boolean;
}

/** Generation request to Tauri backend */
export interface GenerationRequest {
  mode: GenerationMode;
  /** Required: seed number for procedural generation */
  seed?: number;
  /** Optional: stack constraints (archetype, language, framework) */
  stack?: Partial<TechStack>;
  /** Output directory */
  output_path: string;
  /** Enrichment configuration (Pass 2) */
  enrichment?: EnrichmentConfig;
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
