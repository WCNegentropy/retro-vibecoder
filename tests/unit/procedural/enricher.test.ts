/**
 * ProjectEnricher tests
 *
 * Tests for the Pass 2 enrichment engine:
 * - Strategy registration and priority ordering
 * - Enrichment context construction
 * - File diff tracking (added/modified)
 * - RNG forking for deterministic Pass 2
 * - Metadata generation
 */

import { describe, it, expect } from 'vitest';
import { ProjectEnricher } from '../../../packages/procedural/src/enrichment/engine/enricher.js';
import { SeededRNG } from '../../../packages/procedural/src/engine/rng.js';
import { DEFAULT_ENRICHMENT_FLAGS } from '../../../packages/procedural/src/types.js';
import type {
  GeneratedProject,
  TechStack,
  EnrichmentStrategy,
  EnrichmentFlags,
  EnrichmentContext,
} from '../../../packages/procedural/src/types.js';

function createStack(overrides: Partial<TechStack> = {}): TechStack {
  return {
    archetype: 'backend',
    language: 'typescript',
    framework: 'express',
    runtime: 'node',
    database: 'postgres',
    orm: 'prisma',
    transport: 'rest',
    packaging: 'docker',
    cicd: 'github-actions',
    buildTool: 'tsup',
    styling: 'none',
    testing: 'vitest',
    ...overrides,
  } as TechStack;
}

function createProject(overrides: Partial<GeneratedProject> = {}): GeneratedProject {
  return {
    id: 'test-project-id',
    seed: 42,
    name: 'test-project',
    files: {
      'package.json': '{"name": "test-project", "scripts": {"test": "vitest", "build": "tsup"}}',
      'src/index.ts': 'console.log("hello");',
      'README.md': '# Test Project',
    },
    stack: createStack(),
    metadata: {
      generatedAt: new Date().toISOString(),
      upgVersion: '0.1.0',
      durationMs: 100,
      constraintsApplied: ['constraint1'],
    },
    ...overrides,
  };
}

function createMockStrategy(overrides: Partial<EnrichmentStrategy> = {}): EnrichmentStrategy {
  return {
    id: 'mock-strategy',
    name: 'Mock Strategy',
    matches: () => true,
    apply: async (ctx: EnrichmentContext) => {
      ctx.files['new-file.txt'] = 'added by enrichment';
    },
    priority: 10,
    ...overrides,
  };
}

describe('ProjectEnricher', () => {
  it('creates an enriched project with metadata', async () => {
    const project = createProject();
    const rng = new SeededRNG(42);
    const flags = DEFAULT_ENRICHMENT_FLAGS['standard'];

    const enricher = new ProjectEnricher(project, rng, { flags });
    enricher.registerStrategy(createMockStrategy());

    const result = await enricher.enrich();

    expect(result.enrichment).toBeDefined();
    expect(result.enrichment.enriched).toBe(true);
    expect(result.enrichment.strategiesApplied).toContain('mock-strategy');
    expect(result.enrichment.flags).toBe(flags);
    expect(result.enrichment.enrichmentDurationMs).toBeGreaterThanOrEqual(0);
  });

  it('tracks files added during enrichment', async () => {
    const project = createProject();
    const rng = new SeededRNG(42);
    const flags = DEFAULT_ENRICHMENT_FLAGS['standard'];

    const enricher = new ProjectEnricher(project, rng, { flags });
    enricher.registerStrategy(
      createMockStrategy({
        apply: async (ctx) => {
          ctx.files['new-file.txt'] = 'new content';
        },
      })
    );

    const result = await enricher.enrich();

    expect(result.enrichment.filesAdded).toContain('new-file.txt');
    expect(result.files['new-file.txt']).toBe('new content');
  });

  it('tracks files modified during enrichment', async () => {
    const project = createProject();
    const rng = new SeededRNG(42);
    const flags = DEFAULT_ENRICHMENT_FLAGS['standard'];

    const enricher = new ProjectEnricher(project, rng, { flags });
    enricher.registerStrategy(
      createMockStrategy({
        apply: async (ctx) => {
          ctx.files['README.md'] = '# Enriched Project\n\nUpdated by Pass 2';
        },
      })
    );

    const result = await enricher.enrich();

    expect(result.enrichment.filesModified).toContain('README.md');
    expect(result.files['README.md']).toContain('Enriched');
  });

  it('does not mutate the original project files', async () => {
    const project = createProject();
    const originalReadme = project.files['README.md'];
    const rng = new SeededRNG(42);
    const flags = DEFAULT_ENRICHMENT_FLAGS['standard'];

    const enricher = new ProjectEnricher(project, rng, { flags });
    enricher.registerStrategy(
      createMockStrategy({
        apply: async (ctx) => {
          ctx.files['README.md'] = '# Modified';
          ctx.files['new.txt'] = 'new';
        },
      })
    );

    await enricher.enrich();

    // Original files should be untouched
    expect(project.files['README.md']).toBe(originalReadme);
    expect(project.files['new.txt']).toBeUndefined();
  });

  it('only applies strategies that match the stack and flags', async () => {
    const project = createProject();
    const rng = new SeededRNG(42);
    const flags = DEFAULT_ENRICHMENT_FLAGS['standard'];

    const matchingStrategy = createMockStrategy({
      id: 'matching',
      matches: () => true,
      apply: async (ctx) => {
        ctx.files['matched.txt'] = 'yes';
      },
    });

    const nonMatchingStrategy = createMockStrategy({
      id: 'non-matching',
      matches: () => false,
      apply: async (ctx) => {
        ctx.files['not-matched.txt'] = 'no';
      },
    });

    const enricher = new ProjectEnricher(project, rng, { flags });
    enricher.registerStrategies([matchingStrategy, nonMatchingStrategy]);

    const result = await enricher.enrich();

    expect(result.enrichment.strategiesApplied).toContain('matching');
    expect(result.enrichment.strategiesApplied).not.toContain('non-matching');
    expect(result.files['matched.txt']).toBe('yes');
    expect(result.files['not-matched.txt']).toBeUndefined();
  });

  it('applies strategies in priority order', async () => {
    const project = createProject();
    const rng = new SeededRNG(42);
    const flags = DEFAULT_ENRICHMENT_FLAGS['standard'];
    const order: string[] = [];

    const lowPriority = createMockStrategy({
      id: 'low',
      priority: 5,
      apply: async () => {
        order.push('low');
      },
    });

    const highPriority = createMockStrategy({
      id: 'high',
      priority: 50,
      apply: async () => {
        order.push('high');
      },
    });

    const enricher = new ProjectEnricher(project, rng, { flags });
    // Register high first, but low should run first due to priority
    enricher.registerStrategies([highPriority, lowPriority]);

    await enricher.enrich();

    expect(order).toEqual(['low', 'high']);
  });

  it('produces deterministic output for the same seed', async () => {
    const project = createProject();
    const flags = DEFAULT_ENRICHMENT_FLAGS['standard'];

    const randomStrategy = createMockStrategy({
      apply: async (ctx) => {
        const val = ctx.rng.int(0, 10000);
        ctx.files['random.txt'] = `value: ${val}`;
      },
    });

    // Run twice with same seed
    const rng1 = new SeededRNG(42);
    const enricher1 = new ProjectEnricher(project, rng1, { flags });
    enricher1.registerStrategy(randomStrategy);
    const result1 = await enricher1.enrich();

    const rng2 = new SeededRNG(42);
    const enricher2 = new ProjectEnricher(project, rng2, { flags });
    enricher2.registerStrategy(randomStrategy);
    const result2 = await enricher2.enrich();

    expect(result1.files['random.txt']).toBe(result2.files['random.txt']);
  });

  it('appends enrichment strategies to metadata constraintsApplied', async () => {
    const project = createProject();
    const rng = new SeededRNG(42);
    const flags = DEFAULT_ENRICHMENT_FLAGS['standard'];

    const enricher = new ProjectEnricher(project, rng, { flags });
    enricher.registerStrategy(createMockStrategy({ id: 'test-enrich' }));

    const result = await enricher.enrich();

    expect(result.metadata.constraintsApplied).toContain('constraint1');
    expect(result.metadata.constraintsApplied).toContain('enrich:test-enrich');
  });

  it('handles no registered strategies gracefully', async () => {
    const project = createProject();
    const rng = new SeededRNG(42);
    const flags = DEFAULT_ENRICHMENT_FLAGS['standard'];

    const enricher = new ProjectEnricher(project, rng, { flags });
    const result = await enricher.enrich();

    expect(result.enrichment.enriched).toBe(true);
    expect(result.enrichment.strategiesApplied).toEqual([]);
    expect(result.enrichment.filesAdded).toEqual([]);
    expect(result.enrichment.filesModified).toEqual([]);
    // Files should be identical to original
    expect(Object.keys(result.files)).toEqual(Object.keys(project.files));
  });
});
