/**
 * Project Enricher (Pass 2 Engine)
 *
 * Takes a completed Pass 1 GeneratedProject and applies enrichment strategies
 * to add CI/CD, testing, logic fill, and other enhancements.
 *
 * Key invariants:
 * - Pass 1 files are NEVER mutated; enrichment operates on a shallow copy
 * - The RNG is forked from Pass 1's final state for deterministic Pass 2
 * - Same seed + same flags = identical enriched output
 */

import type {
  GeneratedProject,
  EnrichedProject,
  EnrichmentFlags,
  EnrichmentStrategy,
  EnrichmentContext,
  EnrichmentMetadata,
  ProjectFiles,
} from '../../types.js';
import type { SeededRNG } from '../../engine/rng.js';
import { ProjectIntrospector } from './introspector.js';

export interface EnricherOptions {
  flags: EnrichmentFlags;
}

export class ProjectEnricher {
  private strategies: EnrichmentStrategy[] = [];
  private readonly rng: SeededRNG;
  private readonly flags: EnrichmentFlags;
  private readonly sourceProject: GeneratedProject;

  constructor(sourceProject: GeneratedProject, rng: SeededRNG, options: EnricherOptions) {
    this.sourceProject = sourceProject;
    // Fork the RNG — Pass 2 gets a deterministic but independent sequence
    this.rng = rng.fork();
    this.flags = options.flags;
  }

  /** Register a single enrichment strategy. */
  registerStrategy(strategy: EnrichmentStrategy): this {
    this.strategies.push(strategy);
    this.strategies.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
    return this;
  }

  /** Register multiple enrichment strategies at once. */
  registerStrategies(strategies: EnrichmentStrategy[]): this {
    for (const strategy of strategies) {
      this.strategies.push(strategy);
    }
    this.strategies.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
    return this;
  }

  /** Run all matching enrichment strategies and return the enriched project. */
  async enrich(): Promise<EnrichedProject> {
    const startTime = Date.now();

    // Shallow copy Pass 1 files — Pass 2 never mutates the original
    const files: ProjectFiles = { ...this.sourceProject.files };
    const originalPaths = new Set(Object.keys(files));

    // Create introspector against the Pass 1 files (read-only view)
    const introspect = new ProjectIntrospector(
      this.sourceProject.files,
      this.sourceProject.stack
    );

    // Build enrichment context
    const context: EnrichmentContext = {
      sourceProject: this.sourceProject,
      files,
      stack: this.sourceProject.stack,
      projectName: this.sourceProject.name,
      flags: this.flags,
      introspect,
      rng: {
        pick: <T>(items: readonly T[]) => this.rng.pick(items),
        pickWeighted: <T>(items: readonly { value: T; weight: number }[]) =>
          this.rng.pickWeighted(items),
        float: () => this.rng.float(),
        int: (min: number, max: number) => this.rng.int(min, max),
        bool: (probability?: number) => this.rng.bool(probability),
      },
    };

    // Apply matching enrichment strategies in priority order
    const appliedStrategies: string[] = [];
    for (const strategy of this.strategies) {
      if (strategy.matches(this.sourceProject.stack, this.flags)) {
        await strategy.apply(context);
        appliedStrategies.push(strategy.id);
      }
    }

    // Calculate diff metadata
    const currentPaths = new Set(Object.keys(files));
    const filesAdded = [...currentPaths].filter(p => !originalPaths.has(p));
    const filesModified = [...originalPaths].filter(
      p => currentPaths.has(p) && files[p] !== this.sourceProject.files[p]
    );

    const enrichmentMeta: EnrichmentMetadata = {
      enriched: true,
      strategiesApplied: appliedStrategies,
      flags: this.flags,
      enrichmentDurationMs: Date.now() - startTime,
      filesAdded,
      filesModified,
    };

    return {
      ...this.sourceProject,
      files,
      metadata: {
        ...this.sourceProject.metadata,
        durationMs: this.sourceProject.metadata.durationMs + enrichmentMeta.enrichmentDurationMs,
        constraintsApplied: [
          ...this.sourceProject.metadata.constraintsApplied,
          ...appliedStrategies.map(s => `enrich:${s}`),
        ],
      },
      enrichment: enrichmentMeta,
    };
  }
}
