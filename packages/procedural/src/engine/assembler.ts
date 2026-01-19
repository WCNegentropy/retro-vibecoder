/**
 * Project Assembler
 *
 * The "Big Bang" engine that creates a universe (project) from a seed.
 * Uses composition instead of inheritance - assembles projects from capabilities.
 */

import type {
  TechStack,
  GeneratedProject,
  ProjectFiles,
  GenerationContext,
  GenerationStrategy,
  GenerationMetadata,
  Archetype,
  Language,
  Framework,
  Database,
  ORM,
  Runtime,
  Transport,
  Packaging,
  CICD,
  BuildTool,
  Styling,
  TestingFramework,
} from '../types.js';
import { SeededRNG } from './rng.js';
import {
  validateStack,
  getValidLanguagesForArchetype,
  getValidFrameworks,
  getValidRuntimes,
  getValidOrms,
  applyDefaults,
} from './constraints.js';
import { getDefaultBuildTool, getDefaultTesting } from '../matrices/frameworks.js';

/**
 * Configuration options for the assembler
 */
export interface AssemblerOptions {
  /** Project name (defaults to generated name) */
  projectName?: string;

  /** Force specific archetype */
  archetype?: Archetype;

  /** Force specific language */
  language?: Language;

  /** Force specific framework */
  framework?: Framework;

  /** UPG version for metadata */
  upgVersion?: string;
}

/**
 * ProjectAssembler creates complete projects from seeds.
 *
 * Instead of inheritance (ReactGenerator extends BaseGenerator), we use composition.
 * The assembler picks dimensions from the Universal Matrix and applies strategies.
 *
 * @example
 * ```typescript
 * const assembler = new ProjectAssembler(42);
 * const project = await assembler.generate();
 * // Always produces the same project for seed 42
 * ```
 */
export class ProjectAssembler {
  private rng: SeededRNG;
  private strategies: GenerationStrategy[] = [];
  private readonly options: AssemblerOptions;

  /**
   * Create a new ProjectAssembler.
   *
   * @param seed - The seed for deterministic generation
   * @param options - Optional configuration
   */
  constructor(seed: number, options: AssemblerOptions = {}) {
    this.rng = new SeededRNG(seed);
    this.options = {
      upgVersion: '0.1.0',
      ...options,
    };
  }

  /**
   * Get the seed used for this assembler.
   */
  get seed(): number {
    return this.rng.seed;
  }

  /**
   * Register a generation strategy.
   */
  registerStrategy(strategy: GenerationStrategy): this {
    this.strategies.push(strategy);
    // Sort by priority (lower first)
    this.strategies.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
    return this;
  }

  /**
   * Register multiple strategies at once.
   */
  registerStrategies(strategies: GenerationStrategy[]): this {
    for (const strategy of strategies) {
      this.registerStrategy(strategy);
    }
    return this;
  }

  /**
   * The "Big Bang": Creates a universe (project) from the seed.
   */
  async generate(): Promise<GeneratedProject> {
    const startTime = Date.now();

    // 1. Resolve the tech stack through constraint solving
    const stack = this.resolveStack();

    // 2. Validate the stack
    const validation = validateStack(stack);
    if (!validation.valid) {
      throw new Error(`Invalid stack generated: ${validation.violations.join(', ')}`);
    }

    // 3. Generate project name
    const projectName = this.options.projectName ?? this.generateProjectName(stack);

    // 4. Create the generation context
    const files: ProjectFiles = {};
    const context: GenerationContext = {
      stack,
      files,
      projectName,
      rng: {
        pick: <T>(items: readonly T[]) => this.rng.pick(items),
        pickWeighted: <T>(items: readonly { value: T; weight: number }[]) => this.rng.pickWeighted(items),
        float: () => this.rng.float(),
        int: (min: number, max: number) => this.rng.int(min, max),
        bool: (probability?: number) => this.rng.bool(probability),
      },
    };

    // 5. Apply matching strategies in order
    const appliedStrategies: string[] = [];
    for (const strategy of this.strategies) {
      if (strategy.matches(stack)) {
        await strategy.apply(context);
        appliedStrategies.push(strategy.id);
      }
    }

    // 6. Build metadata
    const metadata: GenerationMetadata = {
      generatedAt: new Date().toISOString(),
      upgVersion: this.options.upgVersion!,
      durationMs: Date.now() - startTime,
      constraintsApplied: appliedStrategies,
    };

    // 7. Build project ID
    const id = this.generateProjectId(stack);

    return {
      id,
      seed: this.rng.seed,
      name: projectName,
      files,
      stack,
      metadata,
    };
  }

  /**
   * Resolve the complete tech stack through constraint-based selection.
   * This is the "constraint solver loop" that ensures valid combinations.
   */
  private resolveStack(): TechStack {
    // 1. Pick archetype
    const archetype = this.options.archetype ?? this.pickArchetype();

    // 2. Pick language (constrained by archetype)
    const language = this.options.language ?? this.pickLanguage(archetype);

    // 3. Pick runtime (constrained by language)
    const runtime = this.pickRuntime(language);

    // 4. Pick framework (constrained by archetype and language)
    const framework = this.options.framework ?? this.pickFramework(archetype, language);

    // 5. Pick database (constrained by archetype)
    const database = this.pickDatabase(archetype);

    // 6. Pick ORM (constrained by database and language)
    const orm = this.pickOrm(database, language);

    // 7. Pick transport (constrained by archetype)
    const transport = this.pickTransport(archetype);

    // 8. Pick packaging
    const packaging = this.pickPackaging();

    // 9. Pick CI/CD
    const cicd = this.pickCICD();

    // 10. Pick build tool (influenced by framework)
    const buildTool = this.pickBuildTool(framework);

    // 11. Pick styling (for web)
    const styling = this.pickStyling(archetype);

    // 12. Pick testing framework (influenced by framework)
    const testing = this.pickTesting(framework);

    // Build the stack
    const stack: TechStack = {
      archetype,
      language,
      runtime,
      framework,
      database,
      orm,
      transport,
      packaging,
      cicd,
      buildTool,
      styling,
      testing,
    };

    // Apply default pairings to fill any sensible gaps
    return applyDefaults(stack) as TechStack;
  }

  /**
   * Pick a random archetype.
   */
  private pickArchetype(): Archetype {
    // Bias towards more common archetypes
    return this.rng.pickWeighted([
      { value: 'backend' as Archetype, weight: 30 },
      { value: 'web' as Archetype, weight: 25 },
      { value: 'cli' as Archetype, weight: 20 },
      { value: 'library' as Archetype, weight: 15 },
      { value: 'desktop' as Archetype, weight: 5 },
      { value: 'mobile' as Archetype, weight: 4 },
      { value: 'game' as Archetype, weight: 1 },
    ]);
  }

  /**
   * Pick a language compatible with the archetype.
   */
  private pickLanguage(archetype: Archetype): Language {
    const validLanguages = getValidLanguagesForArchetype(archetype);
    if (validLanguages.length === 0) {
      throw new Error(`No valid languages for archetype: ${archetype}`);
    }

    // Bias towards TypeScript for most archetypes
    if (validLanguages.includes('typescript')) {
      return this.rng.pickWeighted([
        { value: 'typescript' as Language, weight: 40 },
        ...validLanguages
          .filter((l) => l !== 'typescript')
          .map((l) => ({ value: l, weight: 60 / (validLanguages.length - 1) })),
      ]);
    }

    return this.rng.pick(validLanguages);
  }

  /**
   * Pick a runtime compatible with the language.
   */
  private pickRuntime(language: Language): Runtime {
    const validRuntimes = getValidRuntimes(language);
    if (validRuntimes.length === 0) {
      return 'native';
    }

    // Bias towards node for TS/JS
    if (language === 'typescript' || language === 'javascript') {
      return this.rng.pickWeighted([
        { value: 'node' as Runtime, weight: 70 },
        { value: 'bun' as Runtime, weight: 20 },
        { value: 'deno' as Runtime, weight: 10 },
      ]);
    }

    return this.rng.pick(validRuntimes);
  }

  /**
   * Pick a framework compatible with archetype and language.
   */
  private pickFramework(archetype: Archetype, language: Language): Framework {
    const validFrameworks = getValidFrameworks(archetype, language);

    // For library/game archetypes, framework might be empty
    if (validFrameworks.length === 0) {
      // Return a sensible default based on language
      const defaults: Partial<Record<Language, Framework>> = {
        typescript: 'express',
        python: 'fastapi',
        go: 'gin',
        rust: 'axum',
      };
      return defaults[language] ?? 'express';
    }

    return this.rng.pick(validFrameworks);
  }

  /**
   * Pick a database appropriate for the archetype.
   */
  private pickDatabase(archetype: Archetype): Database {
    // Web frontends don't need databases
    if (archetype === 'web') {
      return 'none';
    }

    // Most projects don't need a database, but backends often do
    if (archetype === 'backend') {
      return this.rng.pickWeighted([
        { value: 'postgres' as Database, weight: 40 },
        { value: 'sqlite' as Database, weight: 25 },
        { value: 'mysql' as Database, weight: 15 },
        { value: 'mongodb' as Database, weight: 10 },
        { value: 'none' as Database, weight: 10 },
      ]);
    }

    // CLI and other types usually don't need a database
    return this.rng.pickWeighted([
      { value: 'none' as Database, weight: 60 },
      { value: 'sqlite' as Database, weight: 30 },
      { value: 'postgres' as Database, weight: 10 },
    ]);
  }

  /**
   * Pick an ORM compatible with database and language.
   */
  private pickOrm(database: Database, language: Language): ORM {
    if (database === 'none') {
      return 'none';
    }

    const validOrms = getValidOrms(database, language);
    if (validOrms.length === 0 || (validOrms.length === 1 && validOrms[0] === 'none')) {
      return 'none';
    }

    // Filter out 'none' and pick from actual ORMs
    const actualOrms = validOrms.filter((o) => o !== 'none');
    if (actualOrms.length === 0) {
      return 'none';
    }

    return this.rng.pick(actualOrms);
  }

  /**
   * Pick a transport layer based on archetype.
   */
  private pickTransport(archetype: Archetype): Transport {
    if (archetype === 'web' || archetype === 'cli' || archetype === 'desktop' || archetype === 'mobile') {
      return 'rest'; // Default for non-backend
    }

    return this.rng.pickWeighted([
      { value: 'rest' as Transport, weight: 50 },
      { value: 'graphql' as Transport, weight: 20 },
      { value: 'grpc' as Transport, weight: 15 },
      { value: 'trpc' as Transport, weight: 10 },
      { value: 'websocket' as Transport, weight: 5 },
    ]);
  }

  /**
   * Pick a packaging solution.
   */
  private pickPackaging(): Packaging {
    return this.rng.pickWeighted([
      { value: 'docker' as Packaging, weight: 60 },
      { value: 'none' as Packaging, weight: 35 },
      { value: 'podman' as Packaging, weight: 4 },
      { value: 'nix' as Packaging, weight: 1 },
    ]);
  }

  /**
   * Pick a CI/CD platform.
   */
  private pickCICD(): CICD {
    return this.rng.pickWeighted([
      { value: 'github-actions' as CICD, weight: 70 },
      { value: 'none' as CICD, weight: 20 },
      { value: 'gitlab-ci' as CICD, weight: 8 },
      { value: 'circleci' as CICD, weight: 2 },
    ]);
  }

  /**
   * Pick a build tool (influenced by framework).
   */
  private pickBuildTool(framework: Framework): BuildTool {
    // Use framework's default if available
    return getDefaultBuildTool(framework);
  }

  /**
   * Pick a styling solution (primarily for web).
   */
  private pickStyling(archetype: Archetype): Styling {
    if (archetype !== 'web') {
      return 'none';
    }

    return this.rng.pickWeighted([
      { value: 'tailwind' as Styling, weight: 50 },
      { value: 'css-modules' as Styling, weight: 20 },
      { value: 'styled-components' as Styling, weight: 15 },
      { value: 'scss' as Styling, weight: 10 },
      { value: 'vanilla' as Styling, weight: 5 },
    ]);
  }

  /**
   * Pick a testing framework (influenced by main framework).
   */
  private pickTesting(framework: Framework): TestingFramework {
    return getDefaultTesting(framework);
  }

  /**
   * Generate a project name based on the stack.
   */
  private generateProjectName(_stack: TechStack): string {
    const adjectives = ['swift', 'quick', 'rapid', 'nimble', 'agile', 'bright', 'clever', 'sharp'];
    const nouns = ['api', 'app', 'service', 'hub', 'core', 'base', 'kit', 'lab'];

    const adjective = this.rng.pick(adjectives);
    const noun = this.rng.pick(nouns);
    const suffix = this.rng.string(4);

    return `${adjective}-${noun}-${suffix}`;
  }

  /**
   * Generate a unique project ID based on the stack.
   */
  private generateProjectId(stack: TechStack): string {
    return `${stack.language}-${stack.framework}-${this.rng.seed}`;
  }
}

/**
 * Create a new ProjectAssembler with the given seed.
 */
export function createAssembler(seed: number, options?: AssemblerOptions): ProjectAssembler {
  return new ProjectAssembler(seed, options);
}

/**
 * Quick generation function for one-off project creation.
 */
export async function generateProject(
  seed: number,
  strategies: GenerationStrategy[],
  options?: AssemblerOptions
): Promise<GeneratedProject> {
  const assembler = createAssembler(seed, options);
  assembler.registerStrategies(strategies);
  return assembler.generate();
}
