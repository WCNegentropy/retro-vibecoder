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

/** Game frameworks/engines */
export type GameFramework =
  | 'phaser'
  | 'pixijs'
  | 'unity'
  | 'godot-mono'
  | 'sdl2'
  | 'sfml'
  | 'bevy'
  | 'macroquad';

/** All framework types union */
export type Framework =
  | WebFramework
  | BackendFramework
  | CliFramework
  | DesktopFramework
  | MobileFramework
  | GameFramework
  | 'none'; // For library archetypes or languages without framework support

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
  | 'make'
  | 'xcodebuild';

/** Styling solutions */
export type Styling =
  | 'tailwind'
  | 'css-modules'
  | 'styled-components'
  | 'scss'
  | 'vanilla'
  | 'none';

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
  | 'phpunit'
  | 'xctest'
  | 'catch2'
  | 'gtest'
  | 'flutter-test'
  | 'nunit';

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

// ============================================================================
// Enrichment Types (Pass 2)
// ============================================================================

/** Enrichment depth controls how much content is added */
export type EnrichmentDepth = 'minimal' | 'standard' | 'full';

/** Enrichment flags — each controls a category of enrichment */
export interface EnrichmentFlags {
  /** Enable enrichment (master switch) */
  enabled: boolean;

  /** Enrichment depth preset */
  depth: EnrichmentDepth;

  /** CI/CD workflow enrichment */
  cicd: boolean;

  /** Release automation workflows */
  release: boolean;

  /** Fill application logic beyond boilerplate */
  fillLogic: boolean;

  /** Generate real test cases */
  tests: boolean;

  /** Docker production optimizations (multi-stage, health checks) */
  dockerProd: boolean;

  /** Linting and formatting configurations */
  linting: boolean;

  /** Environment file generation (.env.example, etc.) */
  envFiles: boolean;

  /** README enrichment with real setup instructions */
  docs: boolean;
}

/** Default enrichment flags by depth */
export const DEFAULT_ENRICHMENT_FLAGS: Record<EnrichmentDepth, EnrichmentFlags> = {
  minimal: {
    enabled: true, depth: 'minimal',
    cicd: true, release: false, fillLogic: false,
    tests: false, dockerProd: false, linting: true,
    envFiles: true, docs: true,
  },
  standard: {
    enabled: true, depth: 'standard',
    cicd: true, release: true, fillLogic: true,
    tests: true, dockerProd: true, linting: true,
    envFiles: true, docs: true,
  },
  full: {
    enabled: true, depth: 'full',
    cicd: true, release: true, fillLogic: true,
    tests: true, dockerProd: true, linting: true,
    envFiles: true, docs: true,
  },
};

/** Context provided to enrichment strategies */
export interface EnrichmentContext {
  /** The original Pass 1 project — immutable reference */
  readonly sourceProject: Readonly<GeneratedProject>;

  /** Mutable files being enriched (starts as deep copy of Pass 1 files) */
  files: ProjectFiles;

  /** The resolved tech stack from Pass 1 */
  readonly stack: Readonly<TechStack>;

  /** Project name */
  readonly projectName: string;

  /** Pass 2 enrichment flags */
  readonly flags: Readonly<EnrichmentFlags>;

  /** File introspection utilities */
  readonly introspect: FileIntrospector;

  /** Deterministic RNG (forked from Pass 1) */
  rng: {
    pick<T>(items: readonly T[]): T;
    pickWeighted<T>(items: readonly { value: T; weight: number }[]): T;
    float(): number;
    int(min: number, max: number): number;
    bool(probability?: number): boolean;
  };
}

/** Strategy interface for enrichment (Pass 2) */
export interface EnrichmentStrategy {
  /** Unique identifier */
  id: string;

  /** Human-readable name */
  name: string;

  /** Check if this enrichment applies given the stack AND flags */
  matches(stack: TechStack, flags: EnrichmentFlags): boolean;

  /** Apply enrichment to the files */
  apply(context: EnrichmentContext): Promise<void>;

  /** Priority (higher = applied later) */
  priority?: number;
}

/** Parsed project manifest (package.json, Cargo.toml, etc.) */
export interface ParsedManifest {
  type: 'npm' | 'cargo' | 'pyproject' | 'gomod' | 'maven' | 'gradle' | 'dotnet' | 'cmake' | 'gemspec' | 'composer' | 'unknown';
  name: string;
  dependencies: string[];
  devDependencies: string[];
  scripts: Record<string, string>;
  raw: unknown;
}

/** File introspection interface */
export interface FileIntrospector {
  /** Get parsed project manifest */
  getManifest(): ParsedManifest;

  /** Check if a file exists */
  hasFile(path: string): boolean;

  /** Get file content */
  getContent(path: string): string | undefined;

  /** Find files matching a glob-like pattern */
  findFiles(pattern: string): string[];

  /** Parse a JSON file */
  parseJson<T = unknown>(path: string): T | undefined;

  /** Get the entry point file path */
  getEntryPoint(): string | undefined;

  /** Get test command from manifest */
  getTestCommand(): string | undefined;

  /** Get build command from manifest */
  getBuildCommand(): string | undefined;

  /** Detect exposed ports from Dockerfile/source */
  getExposedPorts(): number[];

  /** Get all file paths */
  getAllPaths(): string[];
}

/** Enriched project output (extends GeneratedProject) */
export interface EnrichedProject extends GeneratedProject {
  /** Enrichment metadata */
  enrichment: EnrichmentMetadata;
}

/** Metadata about the enrichment process */
export interface EnrichmentMetadata {
  /** Whether enrichment was applied */
  enriched: boolean;

  /** Which enrichment strategies were applied */
  strategiesApplied: string[];

  /** The flags that were used */
  flags: EnrichmentFlags;

  /** Time taken for enrichment (ms) */
  enrichmentDurationMs: number;

  /** Files added in Pass 2 */
  filesAdded: string[];

  /** Files modified in Pass 2 */
  filesModified: string[];
}
