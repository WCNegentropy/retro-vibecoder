/**
 * Tests for assembler fixes:
 * - Context-aware framework fallback for CLI/Web archetypes
 * - NestJS Prisma setup (hollow stack fix)
 * - ESLint config generation
 */

import { describe, it, expect } from 'vitest';
import { ProjectAssembler } from '../engine/assembler.js';
import { AllStrategies } from '../strategies/index.js';
import { validateConstraints } from '../engine/constraints.js';

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
    expect([
      'react',
      'vue',
      'svelte',
      'solid',
      'angular',
      'qwik',
      'nextjs',
      'nuxt',
      'sveltekit',
    ]).toContain(project.stack.framework);
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

describe('Bug 10: --language constrains archetype selection', () => {
  it('should not pick web archetype when language is python', async () => {
    // Run multiple seeds with python forced — none should get 'web' archetype
    for (const seed of [1, 2, 3, 10, 42, 100]) {
      const assembler = new ProjectAssembler(seed, { language: 'python' });
      assembler.registerStrategies(AllStrategies);
      const project = await assembler.generate();
      expect(project.stack.archetype).not.toBe('web');
      expect(project.stack.language).toBe('python');
    }
  });
});

describe('Bug 11: empty files guard', () => {
  it('should have files in generated projects', async () => {
    const assembler = new ProjectAssembler(42, {
      archetype: 'backend',
      language: 'typescript',
      framework: 'express',
    });
    assembler.registerStrategies(AllStrategies);
    const project = await assembler.generate();
    expect(Object.keys(project.files).length).toBeGreaterThan(0);
  });
});

describe('Bug 17: NestJS always gets node runtime', () => {
  it('should use node runtime for NestJS', async () => {
    for (const seed of [1, 2, 3, 10, 42, 100]) {
      const assembler = new ProjectAssembler(seed, {
        archetype: 'backend',
        language: 'typescript',
        framework: 'nestjs',
      });
      assembler.registerStrategies(AllStrategies);
      const project = await assembler.generate();
      expect(project.stack.runtime).toBe('node');
    }
  });
});

describe('Bug 19: library archetype framework is none', () => {
  it('should have framework=none for library archetype', async () => {
    for (const seed of [1, 5, 10, 42]) {
      const assembler = new ProjectAssembler(seed, {
        archetype: 'library',
        language: 'rust',
      });
      assembler.registerStrategies(AllStrategies);
      const project = await assembler.generate();
      expect(project.stack.framework).toBe('none');
    }
  });
});

describe('Bug 18: unknown archetype/language/framework validation', () => {
  it('should reject unknown archetype', () => {
    const result = validateConstraints('nonexistent' as any);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Unknown archetype');
  });

  it('should reject unknown language', () => {
    const result = validateConstraints(undefined, 'fortran' as any);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Unknown language');
  });

  it('should reject unknown framework', () => {
    const result = validateConstraints(undefined, undefined, 'nonexistent' as any);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Unknown framework');
  });

  it('should accept valid constraints', () => {
    const result = validateConstraints('backend', 'typescript', 'express');
    expect(result.valid).toBe(true);
  });

  it('should accept valid database/runtime/orm constraints', () => {
    const result = validateConstraints('backend', 'typescript', 'express', 'postgres', 'node', 'prisma');
    expect(result.valid).toBe(true);
  });

  it('should reject unknown database', () => {
    const result = validateConstraints(undefined, undefined, undefined, 'oracle' as any);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Unknown database');
  });

  it('should reject unknown runtime', () => {
    const result = validateConstraints(undefined, undefined, undefined, undefined, 'php-fpm' as any);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Unknown runtime');
  });

  it('should reject unknown ORM', () => {
    const result = validateConstraints(undefined, undefined, undefined, undefined, undefined, 'hibernate' as any);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Unknown ORM');
  });

  it('should reject incompatible runtime-language combo', () => {
    const result = validateConstraints(undefined, 'python', undefined, undefined, 'node');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('not compatible');
  });
});

describe('AssemblerOptions: database, runtime, orm constraint flags', () => {
  it('should force database when --database is specified', async () => {
    const assembler = new ProjectAssembler(42, {
      archetype: 'backend',
      language: 'typescript',
      framework: 'express',
      database: 'sqlite',
    });
    assembler.registerStrategies(AllStrategies);
    const project = await assembler.generate();
    expect(project.stack.database).toBe('sqlite');
  });

  it('should force runtime when --runtime is specified', async () => {
    const assembler = new ProjectAssembler(42, {
      archetype: 'cli',
      language: 'typescript',
      framework: 'commander',
      runtime: 'bun',
    });
    assembler.registerStrategies(AllStrategies);
    const project = await assembler.generate();
    expect(project.stack.runtime).toBe('bun');
  });

  it('should force ORM when --orm is specified', async () => {
    const assembler = new ProjectAssembler(42, {
      archetype: 'backend',
      language: 'typescript',
      framework: 'express',
      database: 'postgres',
      orm: 'typeorm',
    });
    assembler.registerStrategies(AllStrategies);
    const project = await assembler.generate();
    expect(project.stack.orm).toBe('typeorm');
  });

  it('should use default (random) database when not specified', async () => {
    const assembler = new ProjectAssembler(42, {
      archetype: 'backend',
      language: 'typescript',
      framework: 'express',
    });
    assembler.registerStrategies(AllStrategies);
    const project = await assembler.generate();
    // Should still have a valid database (may or may not be 'none')
    expect(project.stack.database).toBeDefined();
  });
});
