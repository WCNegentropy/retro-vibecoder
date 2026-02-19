/**
 * Enrichment Strategies tests
 *
 * Tests for individual enrichment strategies:
 * - matches() behavior based on stack and flags
 * - File generation/modification
 * - Strategy priority ordering
 */

import { describe, it, expect } from 'vitest';
import {
  AllEnrichmentStrategies,
  GitHubActionsEnrichStrategy,
  GitLabCIEnrichStrategy,
  ReleaseWorkflowStrategy,
  LintingEnrichStrategy,
  EnvFilesEnrichStrategy,
  ReadmeEnrichStrategy,
  ApiRoutesEnrichStrategy,
  DockerProdEnrichStrategy,
  UnitTestEnrichStrategy,
} from '../../../packages/procedural/src/enrichment/index.js';
import { DEFAULT_ENRICHMENT_FLAGS } from '../../../packages/procedural/src/types.js';
import type {
  TechStack,
  EnrichmentFlags,
  EnrichmentContext,
  ProjectFiles,
  GeneratedProject,
} from '../../../packages/procedural/src/types.js';
import { ProjectIntrospector } from '../../../packages/procedural/src/enrichment/engine/introspector.js';

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

function createContext(
  stack: TechStack,
  files: ProjectFiles = {},
  flagOverrides: Partial<EnrichmentFlags> = {}
): EnrichmentContext {
  const flags: EnrichmentFlags = {
    ...DEFAULT_ENRICHMENT_FLAGS['standard'],
    ...flagOverrides,
  };

  const sourceProject: GeneratedProject = {
    id: 'test-id',
    seed: 42,
    name: 'test-project',
    files: { ...files },
    stack,
    metadata: {
      generatedAt: new Date().toISOString(),
      upgVersion: '0.1.0',
      durationMs: 100,
      constraintsApplied: [],
    },
  };

  const introspect = new ProjectIntrospector(sourceProject.files, stack);

  return {
    sourceProject,
    files: { ...files },
    stack,
    projectName: 'test-project',
    flags,
    introspect,
    rng: {
      pick: <T>(items: readonly T[]) => items[0],
      pickWeighted: <T>(items: readonly { value: T; weight: number }[]) => items[0].value,
      float: () => 0.5,
      int: (min: number, _max: number) => min,
      bool: () => true,
    },
  };
}

describe('AllEnrichmentStrategies', () => {
  it('contains all expected strategies', () => {
    expect(AllEnrichmentStrategies.length).toBeGreaterThanOrEqual(16);
  });

  it('is sorted by priority', () => {
    for (let i = 1; i < AllEnrichmentStrategies.length; i++) {
      const prev = AllEnrichmentStrategies[i - 1].priority ?? 0;
      const curr = AllEnrichmentStrategies[i].priority ?? 0;
      expect(curr).toBeGreaterThanOrEqual(prev);
    }
  });

  it('has unique strategy IDs', () => {
    const ids = AllEnrichmentStrategies.map(s => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

describe('GitHubActionsEnrichStrategy', () => {
  it('matches when cicd flag is true and stack uses github-actions', () => {
    const stack = createStack({ cicd: 'github-actions' });
    const flags = DEFAULT_ENRICHMENT_FLAGS['standard'];

    expect(GitHubActionsEnrichStrategy.matches(stack, flags)).toBe(true);
  });

  it('does not match when cicd flag is false', () => {
    const stack = createStack({ cicd: 'github-actions' });
    const flags = { ...DEFAULT_ENRICHMENT_FLAGS['standard'], cicd: false };

    expect(GitHubActionsEnrichStrategy.matches(stack, flags)).toBe(false);
  });

  it('does not match when stack uses gitlab-ci', () => {
    const stack = createStack({ cicd: 'gitlab-ci' });
    const flags = DEFAULT_ENRICHMENT_FLAGS['standard'];

    expect(GitHubActionsEnrichStrategy.matches(stack, flags)).toBe(false);
  });

  it('generates CI workflow when applied', async () => {
    const stack = createStack({ cicd: 'github-actions' });
    const ctx = createContext(stack, {
      'package.json': JSON.stringify({ scripts: { test: 'vitest', build: 'tsup' } }),
    });

    await GitHubActionsEnrichStrategy.apply(ctx);

    expect(ctx.files['.github/workflows/ci.yml']).toBeDefined();
    expect(ctx.files['.github/workflows/ci.yml']).toContain('name: CI');
  });
});

describe('GitLabCIEnrichStrategy', () => {
  it('matches when cicd flag is true and stack uses gitlab-ci', () => {
    const stack = createStack({ cicd: 'gitlab-ci' });
    const flags = DEFAULT_ENRICHMENT_FLAGS['standard'];

    expect(GitLabCIEnrichStrategy.matches(stack, flags)).toBe(true);
  });

  it('does not match when stack uses github-actions', () => {
    const stack = createStack({ cicd: 'github-actions' });
    const flags = DEFAULT_ENRICHMENT_FLAGS['standard'];

    expect(GitLabCIEnrichStrategy.matches(stack, flags)).toBe(false);
  });
});

describe('ReleaseWorkflowStrategy', () => {
  it('matches when release flag is true', () => {
    const stack = createStack();
    const flags = { ...DEFAULT_ENRICHMENT_FLAGS['standard'], release: true };

    expect(ReleaseWorkflowStrategy.matches(stack, flags)).toBe(true);
  });

  it('does not match when release flag is false', () => {
    const stack = createStack();
    const flags = { ...DEFAULT_ENRICHMENT_FLAGS['minimal'] };

    expect(ReleaseWorkflowStrategy.matches(stack, flags)).toBe(false);
  });
});

describe('LintingEnrichStrategy', () => {
  it('matches when linting flag is true', () => {
    const stack = createStack();
    const flags = { ...DEFAULT_ENRICHMENT_FLAGS['standard'], linting: true };

    expect(LintingEnrichStrategy.matches(stack, flags)).toBe(true);
  });

  it('does not match when linting flag is false', () => {
    const stack = createStack();
    const flags = { ...DEFAULT_ENRICHMENT_FLAGS['standard'], linting: false };

    expect(LintingEnrichStrategy.matches(stack, flags)).toBe(false);
  });

  it('generates EditorConfig when applied', async () => {
    const stack = createStack();
    const ctx = createContext(stack);

    await LintingEnrichStrategy.apply(ctx);

    expect(ctx.files['.editorconfig']).toBeDefined();
    expect(ctx.files['.editorconfig']).toContain('root = true');
  });
});

describe('EnvFilesEnrichStrategy', () => {
  it('matches when envFiles flag is true', () => {
    const stack = createStack();
    const flags = { ...DEFAULT_ENRICHMENT_FLAGS['standard'], envFiles: true };

    expect(EnvFilesEnrichStrategy.matches(stack, flags)).toBe(true);
  });

  it('generates .env.example when applied', async () => {
    const stack = createStack();
    const ctx = createContext(stack);

    await EnvFilesEnrichStrategy.apply(ctx);

    expect(ctx.files['.env.example']).toBeDefined();
  });
});

describe('ReadmeEnrichStrategy', () => {
  it('matches when docs flag is true', () => {
    const stack = createStack();
    const flags = { ...DEFAULT_ENRICHMENT_FLAGS['standard'], docs: true };

    expect(ReadmeEnrichStrategy.matches(stack, flags)).toBe(true);
  });

  it('generates an enhanced README', async () => {
    const stack = createStack();
    const ctx = createContext(stack, {
      'package.json': JSON.stringify({ name: 'test-project', scripts: { test: 'vitest' } }),
    });

    await ReadmeEnrichStrategy.apply(ctx);

    expect(ctx.files['README.md']).toBeDefined();
    expect(ctx.files['README.md']).toContain('test-project');
  });
});

describe('ApiRoutesEnrichStrategy', () => {
  it('matches backend archetype with fillLogic flag', () => {
    const stack = createStack({ archetype: 'backend' });
    const flags = { ...DEFAULT_ENRICHMENT_FLAGS['standard'], fillLogic: true };

    expect(ApiRoutesEnrichStrategy.matches(stack, flags)).toBe(true);
  });

  it('does not match non-backend archetypes', () => {
    const stack = createStack({ archetype: 'cli' });
    const flags = { ...DEFAULT_ENRICHMENT_FLAGS['standard'], fillLogic: true };

    expect(ApiRoutesEnrichStrategy.matches(stack, flags)).toBe(false);
  });

  it('does not match when fillLogic flag is false', () => {
    const stack = createStack({ archetype: 'backend' });
    const flags = { ...DEFAULT_ENRICHMENT_FLAGS['standard'], fillLogic: false };

    expect(ApiRoutesEnrichStrategy.matches(stack, flags)).toBe(false);
  });
});

describe('DockerProdEnrichStrategy', () => {
  it('matches when dockerProd flag is true and packaging is docker', () => {
    const stack = createStack({ packaging: 'docker' });
    const flags = { ...DEFAULT_ENRICHMENT_FLAGS['standard'], dockerProd: true };

    expect(DockerProdEnrichStrategy.matches(stack, flags)).toBe(true);
  });

  it('does not match when packaging is none', () => {
    const stack = createStack({ packaging: 'none' });
    const flags = { ...DEFAULT_ENRICHMENT_FLAGS['standard'], dockerProd: true };

    expect(DockerProdEnrichStrategy.matches(stack, flags)).toBe(false);
  });
});

describe('UnitTestEnrichStrategy', () => {
  it('matches when tests flag is true', () => {
    const stack = createStack();
    const flags = { ...DEFAULT_ENRICHMENT_FLAGS['standard'], tests: true };

    expect(UnitTestEnrichStrategy.matches(stack, flags)).toBe(true);
  });

  it('does not match when tests flag is false', () => {
    const stack = createStack();
    const flags = { ...DEFAULT_ENRICHMENT_FLAGS['standard'], tests: false };

    expect(UnitTestEnrichStrategy.matches(stack, flags)).toBe(false);
  });
});

describe('DEFAULT_ENRICHMENT_FLAGS', () => {
  it('minimal depth has cicd enabled but not fillLogic or tests', () => {
    const flags = DEFAULT_ENRICHMENT_FLAGS['minimal'];
    expect(flags.enabled).toBe(true);
    expect(flags.cicd).toBe(true);
    expect(flags.fillLogic).toBe(false);
    expect(flags.tests).toBe(false);
    expect(flags.release).toBe(false);
  });

  it('standard depth has all flags enabled', () => {
    const flags = DEFAULT_ENRICHMENT_FLAGS['standard'];
    expect(flags.enabled).toBe(true);
    expect(flags.cicd).toBe(true);
    expect(flags.fillLogic).toBe(true);
    expect(flags.tests).toBe(true);
    expect(flags.release).toBe(true);
  });

  it('full depth has all flags enabled', () => {
    const flags = DEFAULT_ENRICHMENT_FLAGS['full'];
    expect(flags.enabled).toBe(true);
    expect(flags.cicd).toBe(true);
    expect(flags.fillLogic).toBe(true);
    expect(flags.tests).toBe(true);
    expect(flags.release).toBe(true);
    expect(flags.dockerProd).toBe(true);
  });
});
