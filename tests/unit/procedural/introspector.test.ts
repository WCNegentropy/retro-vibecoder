/**
 * ProjectIntrospector tests
 *
 * Tests for the file introspection system:
 * - Manifest parsing (npm, cargo, python, go)
 * - File existence checks
 * - Glob-like pattern matching
 * - JSON parsing
 * - Entry point detection
 * - Port extraction from Dockerfiles
 * - Build/test command detection
 */

import { describe, it, expect } from 'vitest';
import { ProjectIntrospector } from '../../../packages/procedural/src/enrichment/engine/introspector.js';
import type { TechStack, ProjectFiles } from '../../../packages/procedural/src/types.js';

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

describe('ProjectIntrospector', () => {
  describe('hasFile', () => {
    it('returns true for existing files', () => {
      const files: ProjectFiles = { 'package.json': '{}', 'src/index.ts': '' };
      const introspector = new ProjectIntrospector(files, createStack());

      expect(introspector.hasFile('package.json')).toBe(true);
      expect(introspector.hasFile('src/index.ts')).toBe(true);
    });

    it('returns false for non-existing files', () => {
      const files: ProjectFiles = { 'package.json': '{}' };
      const introspector = new ProjectIntrospector(files, createStack());

      expect(introspector.hasFile('nonexistent.txt')).toBe(false);
    });
  });

  describe('getContent', () => {
    it('returns file content for existing files', () => {
      const files: ProjectFiles = { 'README.md': '# Hello' };
      const introspector = new ProjectIntrospector(files, createStack());

      expect(introspector.getContent('README.md')).toBe('# Hello');
    });

    it('returns undefined for non-existing files', () => {
      const files: ProjectFiles = {};
      const introspector = new ProjectIntrospector(files, createStack());

      expect(introspector.getContent('missing.txt')).toBeUndefined();
    });
  });

  describe('parseJson', () => {
    it('parses valid JSON files', () => {
      const files: ProjectFiles = { 'data.json': '{"key": "value"}' };
      const introspector = new ProjectIntrospector(files, createStack());

      const result = introspector.parseJson<{ key: string }>('data.json');
      expect(result).toEqual({ key: 'value' });
    });

    it('returns undefined for invalid JSON', () => {
      const files: ProjectFiles = { 'bad.json': 'not json' };
      const introspector = new ProjectIntrospector(files, createStack());

      expect(introspector.parseJson('bad.json')).toBeUndefined();
    });

    it('returns undefined for missing files', () => {
      const files: ProjectFiles = {};
      const introspector = new ProjectIntrospector(files, createStack());

      expect(introspector.parseJson('missing.json')).toBeUndefined();
    });
  });

  describe('findFiles', () => {
    it('finds files matching a wildcard pattern', () => {
      const files: ProjectFiles = {
        'src/index.ts': '',
        'src/app.ts': '',
        'src/utils/helper.ts': '',
        'README.md': '',
      };
      const introspector = new ProjectIntrospector(files, createStack());

      const result = introspector.findFiles('src/*.ts');
      expect(result).toContain('src/index.ts');
      expect(result).toContain('src/app.ts');
      expect(result).not.toContain('src/utils/helper.ts');
    });

    it('finds files matching a double wildcard pattern', () => {
      const files: ProjectFiles = {
        'src/index.test.ts': '',
        'src/utils/helper.test.ts': '',
        'tests/e2e.test.ts': '',
      };
      const introspector = new ProjectIntrospector(files, createStack());

      const result = introspector.findFiles('**/*.test.ts');
      expect(result).toContain('src/index.test.ts');
      expect(result).toContain('src/utils/helper.test.ts');
      expect(result).toContain('tests/e2e.test.ts');
    });
  });

  describe('getAllPaths', () => {
    it('returns all file paths', () => {
      const files: ProjectFiles = {
        'package.json': '{}',
        'src/index.ts': '',
        'README.md': '',
      };
      const introspector = new ProjectIntrospector(files, createStack());

      const paths = introspector.getAllPaths();
      expect(paths).toHaveLength(3);
      expect(paths).toContain('package.json');
      expect(paths).toContain('src/index.ts');
      expect(paths).toContain('README.md');
    });
  });

  describe('getManifest - npm', () => {
    it('parses a package.json manifest', () => {
      const files: ProjectFiles = {
        'package.json': JSON.stringify({
          name: 'my-project',
          dependencies: { express: '^4.18.0' },
          devDependencies: { vitest: '^1.0.0' },
          scripts: { test: 'vitest', build: 'tsup' },
        }),
      };
      const introspector = new ProjectIntrospector(files, createStack());

      const manifest = introspector.getManifest();
      expect(manifest.type).toBe('npm');
      expect(manifest.name).toBe('my-project');
      expect(manifest.dependencies).toContain('express');
      expect(manifest.devDependencies).toContain('vitest');
      expect(manifest.scripts['test']).toBe('vitest');
      expect(manifest.scripts['build']).toBe('tsup');
    });
  });

  describe('getManifest - cargo', () => {
    it('parses a Cargo.toml manifest', () => {
      const files: ProjectFiles = {
        'Cargo.toml': `[package]
name = "my-rust-app"
version = "0.1.0"

[dependencies]
axum = "0.6"
tokio = { version = "1", features = ["full"] }

[dev-dependencies]
tower = "0.4"
`,
      };
      const introspector = new ProjectIntrospector(files, createStack({ language: 'rust' }));

      const manifest = introspector.getManifest();
      expect(manifest.type).toBe('cargo');
      expect(manifest.name).toBe('my-rust-app');
      expect(manifest.dependencies).toContain('axum');
      expect(manifest.dependencies).toContain('tokio');
      expect(manifest.devDependencies).toContain('tower');
    });
  });

  describe('getManifest - unknown', () => {
    it('returns unknown type when no manifest is found', () => {
      const files: ProjectFiles = { 'README.md': '# Hello' };
      const introspector = new ProjectIntrospector(files, createStack());

      const manifest = introspector.getManifest();
      expect(manifest.type).toBe('unknown');
    });
  });

  describe('getEntryPoint', () => {
    it('detects TypeScript entry point', () => {
      const files: ProjectFiles = {
        'src/index.ts': 'export default {};',
        'package.json': '{}',
      };
      const introspector = new ProjectIntrospector(files, createStack({ language: 'typescript' }));

      expect(introspector.getEntryPoint()).toBe('src/index.ts');
    });

    it('detects Python entry point', () => {
      const files: ProjectFiles = {
        'main.py': 'print("hello")',
      };
      const introspector = new ProjectIntrospector(files, createStack({ language: 'python' }));

      expect(introspector.getEntryPoint()).toBe('main.py');
    });

    it('detects Rust entry point', () => {
      const files: ProjectFiles = {
        'src/main.rs': 'fn main() {}',
        'Cargo.toml': '',
      };
      const introspector = new ProjectIntrospector(files, createStack({ language: 'rust' }));

      expect(introspector.getEntryPoint()).toBe('src/main.rs');
    });

    it('returns undefined when no entry point found', () => {
      const files: ProjectFiles = { 'README.md': '' };
      const introspector = new ProjectIntrospector(files, createStack());

      expect(introspector.getEntryPoint()).toBeUndefined();
    });
  });

  describe('getTestCommand', () => {
    it('returns test command from npm manifest', () => {
      const files: ProjectFiles = {
        'package.json': JSON.stringify({ scripts: { test: 'vitest run' } }),
      };
      const introspector = new ProjectIntrospector(files, createStack());

      expect(introspector.getTestCommand()).toBe('vitest run');
    });

    it('returns undefined when no test command exists', () => {
      const files: ProjectFiles = {
        'package.json': JSON.stringify({ scripts: {} }),
      };
      const introspector = new ProjectIntrospector(files, createStack());

      expect(introspector.getTestCommand()).toBeUndefined();
    });
  });

  describe('getBuildCommand', () => {
    it('returns build command from npm manifest', () => {
      const files: ProjectFiles = {
        'package.json': JSON.stringify({ scripts: { build: 'tsup' } }),
      };
      const introspector = new ProjectIntrospector(files, createStack());

      expect(introspector.getBuildCommand()).toBe('tsup');
    });
  });

  describe('getExposedPorts', () => {
    it('extracts ports from Dockerfile EXPOSE directives', () => {
      const files: ProjectFiles = {
        Dockerfile: `FROM node:20-alpine
WORKDIR /app
COPY . .
EXPOSE 3000
EXPOSE 8080
CMD ["node", "dist/index.js"]`,
      };
      const introspector = new ProjectIntrospector(files, createStack());

      const ports = introspector.getExposedPorts();
      expect(ports).toContain(3000);
      expect(ports).toContain(8080);
      expect(ports).toHaveLength(2);
    });

    it('returns empty array when no Dockerfile exists', () => {
      const files: ProjectFiles = {};
      const introspector = new ProjectIntrospector(files, createStack());

      expect(introspector.getExposedPorts()).toEqual([]);
    });

    it('returns empty array when no EXPOSE directives exist', () => {
      const files: ProjectFiles = {
        Dockerfile: 'FROM node:20-alpine\nCMD ["node", "index.js"]',
      };
      const introspector = new ProjectIntrospector(files, createStack());

      expect(introspector.getExposedPorts()).toEqual([]);
    });
  });

  describe('manifest caching', () => {
    it('caches manifest results', () => {
      const files: ProjectFiles = {
        'package.json': JSON.stringify({ name: 'cached-test' }),
      };
      const introspector = new ProjectIntrospector(files, createStack());

      const first = introspector.getManifest();
      const second = introspector.getManifest();
      expect(first).toBe(second); // Same reference (cached)
    });
  });
});
