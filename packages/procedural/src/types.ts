/**
 * Universal Procedural Generation Type System
 *
 * These types define the "Universal Matrix" - the possibility space
 * of modern software development.
 */

// ============================================================================
// Core Dimension Types (The Matrix)
// ============================================================================

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

/** Web frameworks */
export type WebFramework =
  | 'react'
  | 'vue'
  | 'svelte'
  | 'solid'
  | 'angular'
  | 'qwik'
  | 'nextjs'
  | 'nuxt'
  | 'sveltekit';

/** Backend frameworks */
export type BackendFramework =
  | 'express'
  | 'fastify'
  | 'nestjs'
  | 'fastapi'
  | 'flask'
  | 'django'
  | 'gin'
  | 'echo'
  | 'axum'
  | 'actix'
  | 'spring-boot'
  | 'aspnet-core'
  | 'rails'
  | 'laravel';

/** CLI frameworks */
export type CliFramework = 'commander' | 'yargs' | 'clap' | 'cobra' | 'click' | 'argparse';

/** Desktop frameworks */
export type DesktopFramework = 'tauri' | 'electron' | 'flutter' | 'qt';

/** Mobile frameworks */
export type MobileFramework = 'react-native' | 'flutter' | 'swiftui' | 'jetpack-compose';

/** All framework types union */
export type Framework =
  | WebFramework
  | BackendFramework
  | CliFramework
  | DesktopFramework
  | MobileFramework;

/** Database types */
export type Database =
  | 'postgres'
  | 'mysql'
  | 'sqlite'
  | 'mongodb'
  | 'redis'
  | 'cassandra'
  | 'neo4j'
  | 'none';

/** ORM/Database client types */
export type ORM =
  | 'prisma'
  | 'drizzle'
  | 'typeorm'
  | 'sequelize'
  | 'sqlalchemy'
  | 'gorm'
  | 'diesel'
  | 'entity-framework'
  | 'activerecord'
  | 'eloquent'
  | 'none';

/** API transport layer */
export type Transport = 'rest' | 'graphql' | 'grpc' | 'trpc' | 'websocket';

/** Container packaging */
export type Packaging = 'docker' | 'podman' | 'nix' | 'none';

/** CI/CD platform */
export type CICD = 'github-actions' | 'gitlab-ci' | 'circleci' | 'none';

/** Build tools */
export type BuildTool =
  | 'vite'
  | 'webpack'
  | 'esbuild'
  | 'tsup'
  | 'cargo'
  | 'maven'
  | 'gradle'
  | 'msbuild'
  | 'cmake'
  | 'make';

/** Styling solutions */
export type Styling = 'tailwind' | 'css-modules' | 'styled-components' | 'scss' | 'vanilla' | 'none';

/** Testing frameworks */
export type TestingFramework =
  | 'vitest'
  | 'jest'
  | 'mocha'
  | 'pytest'
  | 'go-test'
  | 'rust-test'
  | 'junit'
  | 'xunit'
  | 'rspec'
  | 'phpunit';

// ============================================================================
// Tech Stack Configuration
// ============================================================================

/** Complete technology stack configuration */
export interface TechStack {
  /** Project archetype (web, backend, cli, etc.) */
  archetype: Archetype;

  /** Primary programming language */
  language: Language;

  /** Runtime environment */
  runtime: Runtime;

  /** Framework (type depends on archetype) */
  framework: Framework;

  /** Database system (if applicable) */
  database: Database;

  /** ORM or database client (if applicable) */
  orm: ORM;

  /** API transport layer (for backend/web) */
  transport: Transport;

  /** Container packaging */
  packaging: Packaging;

  /** CI/CD platform */
  cicd: CICD;

  /** Build tool */
  buildTool: BuildTool;

  /** Styling solution (for web) */
  styling: Styling;

  /** Testing framework */
  testing: TestingFramework;
}

// ============================================================================
// Project Types
// ============================================================================

/** Virtual file system representation */
export type ProjectFiles = Record<string, string>;

/** Generated project output */
export interface GeneratedProject {
  /** Unique identifier based on stack configuration */
  id: string;

  /** The seed that generated this project */
  seed: number;

  /** Project name */
  name: string;

  /** Generated virtual file system */
  files: ProjectFiles;

  /** The resolved tech stack */
  stack: TechStack;

  /** Generation metadata */
  metadata: GenerationMetadata;
}

/** Metadata about the generation process */
export interface GenerationMetadata {
  /** Timestamp of generation */
  generatedAt: string;

  /** UPG version used */
  upgVersion: string;

  /** Time taken to generate (ms) */
  durationMs: number;

  /** Constraints that were applied */
  constraintsApplied: string[];
}

// ============================================================================
// Strategy Types
// ============================================================================

/** Context provided to generation strategies */
export interface GenerationContext {
  /** The resolved tech stack */
  stack: TechStack;

  /** Project files to add/modify */
  files: ProjectFiles;

  /** Project name */
  projectName: string;

  /** The RNG instance for deterministic choices */
  rng: {
    pick<T>(items: readonly T[]): T;
    pickWeighted<T>(items: readonly { value: T; weight: number }[]): T;
    float(): number;
    int(min: number, max: number): number;
    bool(probability?: number): boolean;
  };
}

/** Strategy interface for pluggable generation logic */
export interface GenerationStrategy {
  /** Unique identifier for this strategy */
  id: string;

  /** Human-readable name */
  name: string;

  /** Check if this strategy applies to the given stack */
  matches(stack: TechStack): boolean;

  /** Apply this strategy to generate files */
  apply(context: GenerationContext): Promise<void>;

  /** Priority (higher = applied later, can override earlier) */
  priority?: number;
}

// ============================================================================
// Constraint Types
// ============================================================================

/** Rule that defines incompatible combinations */
export interface IncompatibilityRule {
  /** Condition that triggers this rule */
  when: Partial<TechStack>;

  /** Values that are incompatible with the condition */
  incompatible: Partial<{
    [K in keyof TechStack]: TechStack[K][];
  }>;

  /** Reason for the incompatibility */
  reason: string;
}

/** Rule that defines required combinations */
export interface RequirementRule {
  /** Condition that triggers this rule */
  when: Partial<TechStack>;

  /** Values that are required when condition is met */
  requires: Partial<TechStack>;

  /** Reason for the requirement */
  reason: string;
}

/** Default pairing suggestion */
export interface DefaultPairing {
  /** Key to match against */
  key: keyof TechStack;

  /** Value to match */
  value: TechStack[keyof TechStack];

  /** Defaults to apply */
  defaults: Partial<TechStack>;

  /** Weight for RNG bias (higher = more likely) */
  weight: number;
}

// ============================================================================
// Validation Types (Sweeper)
// ============================================================================

/** Build step definition */
export interface BuildStep {
  /** Command to execute */
  command: string;

  /** Working directory (relative to project root) */
  cwd?: string;

  /** Expected exit code (default: 0) */
  expectedExitCode?: number;

  /** Timeout in milliseconds */
  timeout?: number;
}

/** Validation result for a single project */
export interface ValidationResult {
  /** Whether all build steps passed */
  success: boolean;

  /** The project that was validated */
  project: GeneratedProject;

  /** Results for each build step */
  steps: StepResult[];

  /** Total time for validation (ms) */
  durationMs: number;

  /** Error message if failed */
  error?: string;
}

/** Result of a single build step */
export interface StepResult {
  /** The step that was executed */
  step: BuildStep;

  /** Whether this step passed */
  success: boolean;

  /** Exit code */
  exitCode: number;

  /** stdout content */
  stdout: string;

  /** stderr content */
  stderr: string;

  /** Duration of this step (ms) */
  durationMs: number;
}

// ============================================================================
// Matrix Entry Types
// ============================================================================

/** Metadata about a language in the matrix */
export interface LanguageEntry {
  id: Language;
  name: string;
  runtimes: Runtime[];
  packageManagers: string[];
  fileExtensions: string[];
  configFiles: string[];
}

/** Metadata about a framework in the matrix */
export interface FrameworkEntry {
  id: Framework;
  name: string;
  language: Language;
  archetype: Archetype;
  defaultBuildTool: BuildTool;
  defaultTesting: TestingFramework;
}

/** Metadata about a database in the matrix */
export interface DatabaseEntry {
  id: Database;
  name: string;
  type: 'sql' | 'document' | 'key-value' | 'graph';
  defaultPort: number;
  compatibleOrms: ORM[];
}
