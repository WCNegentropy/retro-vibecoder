/**
 * Tests for assembler fixes:
 * - Context-aware framework fallback for CLI/Web archetypes
 * - NestJS Prisma setup (hollow stack fix)
 * - ESLint config generation
 */

import { describe, it, expect } from 'vitest';
import { ProjectAssembler } from '../engine/assembler.js';
import { AllStrategies } from '../strategies/index.js';

describe('pickFramework context-aware fallback', () => {
  it('should default to commander for cli+typescript when no valid frameworks found', async () => {
    // Use a seed and force cli+typescript to trigger the fallback path
    const assembler = new ProjectAssembler(42, {
      archetype: 'cli',
      language: 'typescript',
    });
    assembler.registerStrategies(AllStrategies);
    const project = await assembler.generate();

    // CLI + TypeScript should pick commander (or another CLI framework), not express
    expect(project.stack.framework).not.toBe('express');
    expect(['commander', 'yargs']).toContain(project.stack.framework);
  });

  it('should default to react for web+typescript when no valid frameworks found', async () => {
    // Use a seed and force web+typescript
    const assembler = new ProjectAssembler(42, {
      archetype: 'web',
      language: 'typescript',
    });
    assembler.registerStrategies(AllStrategies);
    const project = await assembler.generate();

    // Web + TypeScript should pick a web framework, not express
    expect(['react', 'vue', 'svelte', 'solid', 'angular', 'qwik', 'nextjs', 'nuxt', 'sveltekit']).toContain(
      project.stack.framework
    );
  });
});

describe('NestJS Prisma setup (hollow stack fix)', () => {
  it('should include prisma/schema.prisma when NestJS + Prisma', async () => {
    // Seed 4 with nestjs + typescript backend gives Prisma + postgres
    const assembler = new ProjectAssembler(4, {
      archetype: 'backend',
      language: 'typescript',
      framework: 'nestjs',
    });
    assembler.registerStrategies(AllStrategies);
    const project = await assembler.generate();

    if (project.stack.orm === 'prisma' && project.stack.database !== 'none') {
      expect(project.files['prisma/schema.prisma']).toBeDefined();
      expect(project.files['prisma/schema.prisma']).toContain('generator client');
      expect(project.files['.env.example']).toBeDefined();

      const pkg = JSON.parse(project.files['package.json']);
      expect(pkg.dependencies['@prisma/client']).toBeDefined();
      expect(pkg.devDependencies['prisma']).toBeDefined();
      expect(pkg.scripts['db:generate']).toBe('prisma generate');
    }
  });
});

describe('ESLint config generation', () => {
  it('should generate eslint.config.js for Express strategy', async () => {
    const assembler = new ProjectAssembler(42, {
      archetype: 'backend',
      language: 'typescript',
      framework: 'express',
    });
    assembler.registerStrategies(AllStrategies);
    const project = await assembler.generate();

    expect(project.files['eslint.config.js']).toBeDefined();
    expect(project.files['eslint.config.js']).toContain('@eslint/js');
    expect(project.files['eslint.config.js']).toContain('typescript-eslint');
    expect(project.files['eslint.config.js']).toContain("ignores: ['dist/**']");
  });

  it('should generate eslint.config.js for Fastify strategy', async () => {
    const assembler = new ProjectAssembler(42, {
      archetype: 'backend',
      language: 'typescript',
      framework: 'fastify',
    });
    assembler.registerStrategies(AllStrategies);
    const project = await assembler.generate();

    expect(project.files['eslint.config.js']).toBeDefined();
    expect(project.files['eslint.config.js']).toContain('typescript-eslint');
  });

  it('should generate eslint.config.js for NestJS strategy', async () => {
    const assembler = new ProjectAssembler(10, {
      archetype: 'backend',
      language: 'typescript',
      framework: 'nestjs',
    });
    assembler.registerStrategies(AllStrategies);
    const project = await assembler.generate();

    expect(project.files['eslint.config.js']).toBeDefined();
    expect(project.files['eslint.config.js']).toContain('typescript-eslint');
  });
});
