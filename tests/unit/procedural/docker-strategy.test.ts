/**
 * Docker strategy tests
 *
 * Tests for Bug 6: docker-compose.yml should not reference 'db' service
 * for databases that don't need a container (like sqlite).
 */

import { describe, it, expect } from 'vitest';
import { DockerStrategy } from '../../../packages/procedural/src/strategies/common/docker.js';
import type {
  TechStack,
  GenerationContext,
  ProjectFiles,
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

function createContext(stack: TechStack): GenerationContext {
  const files: ProjectFiles = {};
  return {
    stack,
    files,
    projectName: 'test-project',
    rng: {
      pick: <T>(items: readonly T[]) => items[0],
      pickWeighted: <T>(items: readonly { value: T; weight: number }[]) => items[0].value,
      float: () => 0.5,
      int: (min: number, _max: number) => min,
      bool: () => true,
    },
  };
}

describe('DockerStrategy', () => {
  it('matches stacks with docker packaging', () => {
    const stack = createStack({ packaging: 'docker' });
    expect(DockerStrategy.matches(stack)).toBe(true);
  });

  it('does not match stacks without docker packaging', () => {
    const stack = createStack({ packaging: 'none' });
    expect(DockerStrategy.matches(stack)).toBe(false);
  });

  describe('docker-compose.yml generation', () => {
    it('generates docker-compose with db service for postgres', async () => {
      const stack = createStack({ database: 'postgres', packaging: 'docker' });
      const context = createContext(stack);

      await DockerStrategy.apply(context);

      expect(context.files['docker-compose.yml']).toBeDefined();
      expect(context.files['docker-compose.yml']).toContain('depends_on:');
      expect(context.files['docker-compose.yml']).toContain('db:');
      expect(context.files['docker-compose.yml']).toContain('postgres:16-alpine');
    });

    it('generates docker-compose with db service for mysql', async () => {
      const stack = createStack({ database: 'mysql', packaging: 'docker' });
      const context = createContext(stack);

      await DockerStrategy.apply(context);

      expect(context.files['docker-compose.yml']).toBeDefined();
      expect(context.files['docker-compose.yml']).toContain('depends_on:');
      expect(context.files['docker-compose.yml']).toContain('db:');
      expect(context.files['docker-compose.yml']).toContain('mysql:8');
    });

    it('does NOT generate depends_on: db for sqlite (Bug 6)', async () => {
      const stack = createStack({ database: 'sqlite', packaging: 'docker' });
      const context = createContext(stack);

      await DockerStrategy.apply(context);

      expect(context.files['docker-compose.yml']).toBeDefined();
      expect(context.files['docker-compose.yml']).not.toContain('depends_on:');
      expect(context.files['docker-compose.yml']).not.toContain('  db:');
    });

    it('does NOT generate docker-compose.yml for no database', async () => {
      const stack = createStack({ database: 'none', packaging: 'docker' });
      const context = createContext(stack);

      await DockerStrategy.apply(context);

      expect(context.files['docker-compose.yml']).toBeUndefined();
      expect(context.files['Dockerfile']).toBeDefined();
    });
  });
});
