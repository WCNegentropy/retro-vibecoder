/**
 * Stack Inferrer tests
 *
 * Tests for the heuristic stack detection from project files:
 * - Language detection from manifest files
 * - Framework detection from dependencies
 * - Archetype inference from framework + file patterns
 * - Database, ORM, transport, packaging, CI/CD detection
 * - Edge cases (empty files, missing manifests)
 */

import { describe, it, expect } from 'vitest';
import { inferStack } from '../../../packages/procedural/src/enrichment/engine/stack-inferrer.js';
import type { ProjectFiles } from '../../../packages/procedural/src/types.js';

describe('inferStack', () => {
  describe('language detection', () => {
    it('detects TypeScript from package.json with typescript dependency', () => {
      const files: ProjectFiles = {
        'package.json': JSON.stringify({
          devDependencies: { typescript: '^5.0.0' },
        }),
        'src/index.ts': 'export default {};',
      };
      const { stack } = inferStack(files);
      expect(stack.language).toBe('typescript');
    });

    it('detects JavaScript from package.json without typescript', () => {
      const files: ProjectFiles = {
        'package.json': JSON.stringify({
          dependencies: { express: '^4.18.0' },
        }),
        'src/index.js': 'module.exports = {};',
      };
      const { stack } = inferStack(files);
      expect(stack.language).toBe('javascript');
    });

    it('detects Rust from Cargo.toml', () => {
      const files: ProjectFiles = {
        'Cargo.toml': '[package]\nname = "my-app"\nversion = "0.1.0"',
        'src/main.rs': 'fn main() {}',
      };
      const { stack } = inferStack(files);
      expect(stack.language).toBe('rust');
    });

    it('detects Go from go.mod', () => {
      const files: ProjectFiles = {
        'go.mod': 'module github.com/user/app\n\ngo 1.21',
        'main.go': 'package main',
      };
      const { stack } = inferStack(files);
      expect(stack.language).toBe('go');
    });

    it('detects Python from pyproject.toml', () => {
      const files: ProjectFiles = {
        'pyproject.toml': '[project]\nname = "my-app"',
        'main.py': 'print("hello")',
      };
      const { stack } = inferStack(files);
      expect(stack.language).toBe('python');
    });

    it('detects Python from requirements.txt', () => {
      const files: ProjectFiles = {
        'requirements.txt': 'fastapi>=0.100.0\nuvicorn',
      };
      const { stack } = inferStack(files);
      expect(stack.language).toBe('python');
    });

    it('detects Java from pom.xml', () => {
      const files: ProjectFiles = {
        'pom.xml': '<project></project>',
      };
      const { stack } = inferStack(files);
      expect(stack.language).toBe('java');
    });

    it('detects Ruby from Gemfile', () => {
      const files: ProjectFiles = {
        Gemfile: "gem 'rails'",
      };
      const { stack } = inferStack(files);
      expect(stack.language).toBe('ruby');
    });

    it('detects PHP from composer.json', () => {
      const files: ProjectFiles = {
        'composer.json': JSON.stringify({ require: { 'laravel/framework': '^10.0' } }),
      };
      const { stack } = inferStack(files);
      expect(stack.language).toBe('php');
    });
  });

  describe('framework detection', () => {
    it('detects Express from npm dependencies', () => {
      const files: ProjectFiles = {
        'package.json': JSON.stringify({
          dependencies: { express: '^4.18.0' },
          devDependencies: { typescript: '^5.0.0' },
        }),
      };
      const { stack } = inferStack(files);
      expect(stack.framework).toBe('express');
    });

    it('detects React from npm dependencies', () => {
      const files: ProjectFiles = {
        'package.json': JSON.stringify({
          dependencies: { react: '^18.0.0', 'react-dom': '^18.0.0' },
          devDependencies: { typescript: '^5.0.0' },
        }),
      };
      const { stack } = inferStack(files);
      expect(stack.framework).toBe('react');
    });

    it('detects Axum from Cargo.toml dependencies', () => {
      const files: ProjectFiles = {
        'Cargo.toml': `[package]
name = "my-app"

[dependencies]
axum = "0.6"
tokio = "1"
`,
      };
      const { stack } = inferStack(files);
      expect(stack.framework).toBe('axum');
    });

    it('detects FastAPI from Python dependencies', () => {
      const files: ProjectFiles = {
        'requirements.txt': 'fastapi>=0.100.0\nuvicorn',
      };
      const { stack } = inferStack(files);
      expect(stack.framework).toBe('fastapi');
    });

    it('detects Cobra from Go dependencies', () => {
      const files: ProjectFiles = {
        'go.mod': `module github.com/user/app

go 1.21

require (
\tgithub.com/spf13/cobra v1.7.0
)
`,
      };
      const { stack } = inferStack(files);
      expect(stack.framework).toBe('cobra');
    });

    it('returns none for projects without a detectable framework', () => {
      const files: ProjectFiles = {
        'package.json': JSON.stringify({
          devDependencies: { typescript: '^5.0.0' },
        }),
      };
      const { stack } = inferStack(files);
      expect(stack.framework).toBe('none');
    });
  });

  describe('archetype detection', () => {
    it('detects backend from backend framework', () => {
      const files: ProjectFiles = {
        'package.json': JSON.stringify({ dependencies: { express: '^4' } }),
      };
      const { stack } = inferStack(files);
      expect(stack.archetype).toBe('backend');
    });

    it('detects web from web framework', () => {
      const files: ProjectFiles = {
        'package.json': JSON.stringify({
          dependencies: { react: '^18', 'react-dom': '^18' },
          devDependencies: { typescript: '^5' },
        }),
      };
      const { stack } = inferStack(files);
      expect(stack.archetype).toBe('web');
    });

    it('detects cli from CLI framework', () => {
      const files: ProjectFiles = {
        'package.json': JSON.stringify({
          dependencies: { commander: '^10' },
          devDependencies: { typescript: '^5' },
        }),
      };
      const { stack } = inferStack(files);
      expect(stack.archetype).toBe('cli');
    });

    it('detects backend from file patterns when no framework', () => {
      const files: ProjectFiles = {
        'package.json': JSON.stringify({ devDependencies: { typescript: '^5' } }),
        'src/routes/index.ts': '',
        'src/routes/users.ts': '',
      };
      const { stack } = inferStack(files);
      expect(stack.archetype).toBe('backend');
    });
  });

  describe('database detection', () => {
    it('detects PostgreSQL from pg dependency', () => {
      const files: ProjectFiles = {
        'package.json': JSON.stringify({ dependencies: { pg: '^8.0' } }),
      };
      const { stack } = inferStack(files);
      expect(stack.database).toBe('postgres');
    });

    it('detects MongoDB from mongoose dependency', () => {
      const files: ProjectFiles = {
        'package.json': JSON.stringify({ dependencies: { mongoose: '^7' } }),
      };
      const { stack } = inferStack(files);
      expect(stack.database).toBe('mongodb');
    });

    it('returns none when no database detected', () => {
      const files: ProjectFiles = {
        'package.json': JSON.stringify({ dependencies: { express: '^4' } }),
      };
      const { stack } = inferStack(files);
      expect(stack.database).toBe('none');
    });
  });

  describe('packaging detection', () => {
    it('detects Docker from Dockerfile', () => {
      const files: ProjectFiles = {
        Dockerfile: 'FROM node:20',
        'package.json': '{}',
      };
      const { stack } = inferStack(files);
      expect(stack.packaging).toBe('docker');
    });

    it('returns none when no containerization', () => {
      const files: ProjectFiles = { 'package.json': '{}' };
      const { stack } = inferStack(files);
      expect(stack.packaging).toBe('none');
    });
  });

  describe('CI/CD detection', () => {
    it('detects GitHub Actions from workflow files', () => {
      const files: ProjectFiles = {
        '.github/workflows/ci.yml': 'on: push',
        'package.json': '{}',
      };
      const { stack } = inferStack(files);
      expect(stack.cicd).toBe('github-actions');
    });

    it('detects GitLab CI from .gitlab-ci.yml', () => {
      const files: ProjectFiles = {
        '.gitlab-ci.yml': 'stages: [build]',
        'package.json': '{}',
      };
      const { stack } = inferStack(files);
      expect(stack.cicd).toBe('gitlab-ci');
    });
  });

  describe('ORM detection', () => {
    it('detects Prisma from @prisma/client', () => {
      const files: ProjectFiles = {
        'package.json': JSON.stringify({
          dependencies: { '@prisma/client': '^5' },
          devDependencies: { typescript: '^5' },
        }),
      };
      const { stack } = inferStack(files);
      expect(stack.orm).toBe('prisma');
    });
  });

  describe('confidence scores', () => {
    it('provides confidence for each dimension', () => {
      const files: ProjectFiles = {
        'package.json': JSON.stringify({
          dependencies: { express: '^4', pg: '^8' },
          devDependencies: { typescript: '^5', vitest: '^1' },
        }),
        Dockerfile: 'FROM node:20',
        '.github/workflows/ci.yml': 'on: push',
      };
      const { confidence } = inferStack(files);

      expect(confidence.language).toBeGreaterThan(0);
      expect(confidence.framework).toBeGreaterThan(0);
      expect(confidence.archetype).toBeGreaterThan(0);
      expect(confidence.packaging).toBeGreaterThan(0);
      expect(confidence.cicd).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('handles empty project files', () => {
      const files: ProjectFiles = {};
      const { stack } = inferStack(files);

      // Should return sensible defaults
      expect(stack.language).toBeDefined();
      expect(stack.archetype).toBeDefined();
      expect(stack.framework).toBeDefined();
    });

    it('handles malformed package.json', () => {
      const files: ProjectFiles = {
        'package.json': 'not valid json',
      };
      // Should not throw, just use defaults
      const { stack } = inferStack(files);
      expect(stack.language).toBeDefined();
    });
  });
});
