/**
 * Stack Inferrer — Heuristic stack detection from project files
 *
 * Takes a raw `ProjectFiles` map and produces a best-effort `TechStack`
 * by analyzing manifest files, dependency declarations, and file patterns.
 *
 * This is NOT deterministic from RNG — it's heuristic inference,
 * used only in the template pathway (Phase 4) where no seed-based
 * stack resolution exists.
 */

import type {
  TechStack,
  Archetype,
  Language,
  Runtime,
  Framework,
  Database,
  ORM,
  Transport,
  Packaging,
  CICD,
  BuildTool,
  Styling,
  TestingFramework,
  ProjectFiles,
} from '../../types.js';

/** Result of stack inference with confidence metadata */
export interface InferredStack {
  /** The inferred tech stack */
  stack: TechStack;
  /** Confidence score (0–1) for each detected dimension */
  confidence: Partial<Record<keyof TechStack, number>>;
}

/**
 * Infer a TechStack from raw project files.
 *
 * Examines manifest files (package.json, Cargo.toml, go.mod, pyproject.toml),
 * dependency names, and file path patterns to produce a best-effort stack.
 */
export function inferStack(files: ProjectFiles): InferredStack {
  const paths = Object.keys(files);
  const confidence: Partial<Record<keyof TechStack, number>> = {};

  // --- Language detection ---
  const language = detectLanguage(files, paths);
  confidence.language = language ? 0.9 : 0.1;

  // --- Runtime detection ---
  const runtime = detectRuntime(language, files);
  confidence.runtime = runtime !== 'native' ? 0.8 : 0.3;

  // --- Framework detection ---
  const framework = detectFramework(language, files, paths);
  confidence.framework = framework !== 'none' ? 0.8 : 0.2;

  // --- Archetype detection ---
  const archetype = detectArchetype(framework, paths);
  confidence.archetype = 0.7;

  // --- Database detection ---
  const database = detectDatabase(files);
  confidence.database = database !== 'none' ? 0.7 : 0.3;

  // --- ORM detection ---
  const orm = detectORM(language, files);
  confidence.orm = orm !== 'none' ? 0.8 : 0.2;

  // --- Transport detection ---
  const transport = detectTransport(files);
  confidence.transport = 0.5;

  // --- Packaging detection ---
  const packaging = detectPackaging(paths);
  confidence.packaging = packaging !== 'none' ? 0.9 : 0.3;

  // --- CI/CD detection ---
  const cicd = detectCICD(paths);
  confidence.cicd = cicd !== 'none' ? 0.9 : 0.3;

  // --- Build tool detection ---
  const buildTool = detectBuildTool(language, files);
  confidence.buildTool = buildTool ? 0.8 : 0.3;

  // --- Styling detection ---
  const styling = detectStyling(files, paths);
  confidence.styling = styling !== 'none' ? 0.7 : 0.2;

  // --- Testing framework detection ---
  const testing = detectTesting(language, files);
  confidence.testing = testing ? 0.8 : 0.3;

  const stack: TechStack = {
    archetype: archetype ?? 'backend',
    language: language ?? 'typescript',
    runtime: runtime ?? 'node',
    framework: framework ?? 'none',
    database: database ?? 'none',
    orm: orm ?? 'none',
    transport: transport ?? 'rest',
    packaging: packaging ?? 'none',
    cicd: cicd ?? 'none',
    buildTool: buildTool ?? 'tsup',
    styling: styling ?? 'none',
    testing: testing ?? 'vitest',
  };

  return { stack, confidence };
}

// ============================================================================
// Detection Helpers
// ============================================================================

function detectLanguage(files: ProjectFiles, paths: string[]): Language {
  if (files['package.json']) {
    const pkg = safeParseJson(files['package.json']);
    const allDeps = {
      ...((pkg?.dependencies as Record<string, string>) ?? {}),
      ...((pkg?.devDependencies as Record<string, string>) ?? {}),
    };
    if (allDeps['typescript'] || paths.some(p => p.endsWith('.ts') || p.endsWith('.tsx'))) {
      return 'typescript';
    }
    return 'javascript';
  }
  if (files['Cargo.toml']) return 'rust';
  if (files['go.mod']) return 'go';
  if (files['pyproject.toml'] || files['requirements.txt'] || files['setup.py']) return 'python';
  if (files['pom.xml'] || files['build.gradle'] || files['build.gradle.kts']) return 'java';
  if (paths.some(p => p.endsWith('.csproj') || p.endsWith('.sln'))) return 'csharp';
  if (files['Gemfile']) return 'ruby';
  if (files['composer.json']) return 'php';
  if (paths.some(p => p.endsWith('.swift'))) return 'swift';
  if (paths.some(p => p.endsWith('.kt') || p.endsWith('.kts'))) return 'kotlin';
  if (paths.some(p => p.endsWith('.cpp') || p.endsWith('.cc') || p.endsWith('.h'))) return 'cpp';

  // Default fallback
  return 'typescript';
}

function detectRuntime(language: Language, files: ProjectFiles): Runtime {
  switch (language) {
    case 'typescript':
    case 'javascript': {
      if (files['deno.json'] || files['deno.jsonc']) return 'deno';
      if (files['bun.lockb'] || files['bunfig.toml']) return 'bun';
      return 'node';
    }
    case 'java':
    case 'kotlin':
      return 'jvm';
    case 'csharp':
      return 'dotnet';
    case 'rust':
    case 'go':
    case 'cpp':
    case 'swift':
      return 'native';
    case 'python':
      return 'native';
    case 'ruby':
    case 'php':
      return 'native';
    default:
      return 'native';
  }
}

function detectFramework(
  language: Language,
  files: ProjectFiles,
  paths: string[]
): Framework {
  const deps = getDependencies(files);

  // TypeScript / JavaScript frameworks
  if (language === 'typescript' || language === 'javascript') {
    // Web frameworks
    if (deps.includes('react') || deps.includes('react-dom')) {
      if (deps.includes('react-native')) return 'react-native';
      return 'react';
    }
    if (deps.includes('vue')) return 'vue';
    if (deps.includes('svelte')) return 'svelte';
    if (deps.includes('solid-js')) return 'solid';
    // Backend frameworks
    if (deps.includes('express')) return 'express';
    if (deps.includes('fastify')) return 'fastify';
    if (deps.includes('@nestjs/core')) return 'nestjs';
    // CLI frameworks
    if (deps.includes('commander')) return 'commander';
    if (deps.includes('yargs')) return 'yargs';
    // Desktop frameworks
    if (deps.includes('@tauri-apps/api')) return 'tauri';
    if (deps.includes('electron')) return 'electron';
    // Game frameworks
    if (deps.includes('phaser')) return 'phaser';
    if (deps.includes('pixi.js')) return 'pixijs';
  }

  // Python frameworks
  if (language === 'python') {
    const allContent = Object.values(files).join('\n');
    if (deps.includes('fastapi') || allContent.includes('fastapi')) return 'fastapi';
    if (deps.includes('flask') || allContent.includes('flask')) return 'flask';
    if (deps.includes('django') || allContent.includes('django')) return 'django';
    if (deps.includes('click') || allContent.includes('click')) return 'click';
  }

  // Rust frameworks
  if (language === 'rust') {
    if (deps.includes('axum')) return 'axum';
    if (deps.includes('actix-web') || deps.includes('actix')) return 'actix';
    if (deps.includes('clap')) return 'clap';
    if (deps.includes('bevy')) return 'bevy';
  }

  // Go frameworks
  if (language === 'go') {
    if (deps.includes('gin') || deps.includes('github.com/gin-gonic/gin')) return 'gin';
    if (deps.includes('echo') || deps.includes('github.com/labstack/echo')) return 'echo';
    if (deps.includes('cobra') || deps.includes('github.com/spf13/cobra')) return 'cobra';
  }

  // Java frameworks
  if (language === 'java') {
    if (deps.includes('spring-boot') || paths.some(p => p.includes('SpringApplication')))
      return 'spring-boot';
  }

  // C# frameworks
  if (language === 'csharp') {
    const allContent = Object.values(files).join('\n');
    if (allContent.includes('Microsoft.AspNetCore') || allContent.includes('WebApplication'))
      return 'aspnet-core';
    if (allContent.includes('Unity')) return 'unity';
  }

  // Ruby frameworks
  if (language === 'ruby') {
    if (deps.includes('rails') || files['Gemfile']?.includes('rails')) return 'rails';
  }

  // PHP frameworks
  if (language === 'php') {
    if (deps.includes('laravel') || files['composer.json']?.includes('laravel')) return 'laravel';
  }

  return 'none';
}

function detectArchetype(
  framework: Framework,
  paths: string[]
): Archetype {
  // Framework-based archetype inference
  const backendFrameworks = [
    'express', 'fastify', 'nestjs', 'fastapi', 'flask', 'django',
    'gin', 'echo', 'axum', 'actix', 'spring-boot', 'aspnet-core',
    'rails', 'laravel',
  ];
  const webFrameworks = ['react', 'vue', 'svelte', 'solid'];
  const cliFrameworks = ['commander', 'yargs', 'clap', 'cobra', 'click', 'argparse'];
  const desktopFrameworks = ['tauri', 'electron', 'flutter', 'qt'];
  const mobileFrameworks = ['react-native', 'swiftui', 'jetpack-compose'];
  const gameFrameworks = ['phaser', 'pixijs', 'unity', 'godot-mono', 'sdl2', 'sfml', 'bevy', 'macroquad'];

  if (backendFrameworks.includes(framework)) return 'backend';
  if (webFrameworks.includes(framework)) return 'web';
  if (cliFrameworks.includes(framework)) return 'cli';
  if (desktopFrameworks.includes(framework)) return 'desktop';
  if (mobileFrameworks.includes(framework)) return 'mobile';
  if (gameFrameworks.includes(framework)) return 'game';

  // Path-pattern fallback
  if (paths.some(p => p.startsWith('src/routes/') || p.startsWith('src/api/'))) return 'backend';
  if (paths.some(p => p.startsWith('src/components/') || p.startsWith('src/pages/'))) return 'web';
  if (paths.some(p => p.startsWith('src/commands/') || p.includes('cli'))) return 'cli';

  return 'backend';
}

function detectDatabase(files: ProjectFiles): Database {
  const deps = getDependencies(files);
  const allContent = Object.values(files).join('\n').toLowerCase();

  if (deps.includes('pg') || deps.includes('postgres') || allContent.includes('postgresql')) return 'postgres';
  if (deps.includes('mysql2') || deps.includes('mysql') || allContent.includes('mysql')) return 'mysql';
  if (deps.includes('better-sqlite3') || deps.includes('sqlite') || allContent.includes('sqlite')) return 'sqlite';
  if (deps.includes('mongodb') || deps.includes('mongoose') || allContent.includes('mongodb')) return 'mongodb';
  if (deps.includes('redis') || deps.includes('ioredis') || allContent.includes('redis')) return 'redis';

  return 'none';
}

function detectORM(language: Language, files: ProjectFiles): ORM {
  const deps = getDependencies(files);

  if (language === 'typescript' || language === 'javascript') {
    if (deps.includes('prisma') || deps.includes('@prisma/client')) return 'prisma';
    if (deps.includes('drizzle-orm')) return 'drizzle';
    if (deps.includes('typeorm')) return 'typeorm';
    if (deps.includes('sequelize')) return 'sequelize';
  }
  if (language === 'python') {
    if (deps.includes('sqlalchemy') || deps.includes('SQLAlchemy')) return 'sqlalchemy';
  }
  if (language === 'go') {
    if (deps.includes('gorm') || deps.includes('gorm.io/gorm')) return 'gorm';
  }
  if (language === 'rust') {
    if (deps.includes('diesel')) return 'diesel';
  }
  if (language === 'ruby') {
    return 'activerecord'; // Rails implies ActiveRecord
  }
  if (language === 'php') {
    return 'eloquent'; // Laravel implies Eloquent
  }
  if (language === 'csharp') {
    const allContent = Object.values(files).join('\n');
    if (allContent.includes('EntityFramework') || allContent.includes('DbContext'))
      return 'entity-framework';
  }

  return 'none';
}

function detectTransport(files: ProjectFiles): Transport {
  const deps = getDependencies(files);
  const allContent = Object.values(files).join('\n').toLowerCase();

  if (deps.includes('graphql') || deps.includes('@apollo/server') || allContent.includes('graphql')) return 'graphql';
  if (deps.includes('@grpc/grpc-js') || allContent.includes('grpc')) return 'grpc';
  if (deps.includes('@trpc/server') || allContent.includes('trpc')) return 'trpc';
  if (deps.includes('ws') || deps.includes('socket.io') || allContent.includes('websocket')) return 'websocket';

  return 'rest';
}

function detectPackaging(paths: string[]): Packaging {
  if (paths.includes('Dockerfile') || paths.some(p => p.startsWith('docker/'))) return 'docker';
  if (paths.some(p => p.includes('Containerfile'))) return 'podman';
  if (paths.includes('flake.nix') || paths.includes('default.nix')) return 'nix';
  return 'none';
}

function detectCICD(paths: string[]): CICD {
  if (paths.some(p => p.startsWith('.github/workflows/'))) return 'github-actions';
  if (paths.includes('.gitlab-ci.yml')) return 'gitlab-ci';
  if (paths.includes('.circleci/config.yml')) return 'circleci';
  return 'none';
}

function detectBuildTool(language: Language, files: ProjectFiles): BuildTool {
  const deps = getDependencies(files);

  if (language === 'typescript' || language === 'javascript') {
    if (deps.includes('vite')) return 'vite';
    if (deps.includes('webpack')) return 'webpack';
    if (deps.includes('esbuild')) return 'esbuild';
    if (deps.includes('tsup')) return 'tsup';
    return 'tsup';
  }
  if (language === 'rust') return 'cargo';
  if (language === 'java') {
    if (files['build.gradle'] || files['build.gradle.kts']) return 'gradle';
    if (files['pom.xml']) return 'maven';
  }
  if (language === 'csharp') return 'msbuild';
  if (language === 'cpp') {
    if (files['CMakeLists.txt']) return 'cmake';
    if (files['Makefile']) return 'make';
  }
  if (language === 'swift') return 'xcodebuild';

  return 'tsup';
}

function detectStyling(files: ProjectFiles, paths: string[]): Styling {
  const deps = getDependencies(files);

  if (deps.includes('tailwindcss') || paths.includes('tailwind.config.js') || paths.includes('tailwind.config.ts')) return 'tailwind';
  if (deps.includes('styled-components')) return 'styled-components';
  if (deps.includes('sass') || paths.some(p => p.endsWith('.scss'))) return 'scss';
  if (paths.some(p => p.includes('.module.css'))) return 'css-modules';
  if (paths.some(p => p.endsWith('.css'))) return 'vanilla';

  return 'none';
}

function detectTesting(language: Language, files: ProjectFiles): TestingFramework {
  const deps = getDependencies(files);

  if (language === 'typescript' || language === 'javascript') {
    if (deps.includes('vitest')) return 'vitest';
    if (deps.includes('jest')) return 'jest';
    if (deps.includes('mocha')) return 'mocha';
    return 'vitest';
  }
  if (language === 'python') return 'pytest';
  if (language === 'go') return 'go-test';
  if (language === 'rust') return 'rust-test';
  if (language === 'java') return 'junit';
  if (language === 'csharp') return 'xunit';
  if (language === 'ruby') return 'rspec';
  if (language === 'php') return 'phpunit';
  if (language === 'swift') return 'xctest';
  if (language === 'cpp') return 'catch2';
  if (language === 'kotlin') return 'junit';

  return 'vitest';
}

// ============================================================================
// Utility Helpers
// ============================================================================

function safeParseJson(content: string): Record<string, unknown> | null {
  try {
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Extract dependency names from the project's manifest files.
 * Supports package.json, Cargo.toml, go.mod, pyproject.toml, requirements.txt,
 * Gemfile, and composer.json.
 */
function getDependencies(files: ProjectFiles): string[] {
  const deps: string[] = [];

  // npm / package.json
  if (files['package.json']) {
    const pkg = safeParseJson(files['package.json']);
    if (pkg) {
      for (const key of Object.keys((pkg.dependencies as Record<string, string>) ?? {})) {
        deps.push(key);
      }
      for (const key of Object.keys((pkg.devDependencies as Record<string, string>) ?? {})) {
        deps.push(key);
      }
    }
  }

  // Cargo.toml — simple TOML parsing for [dependencies] section
  if (files['Cargo.toml']) {
    const content = files['Cargo.toml'];
    const depSection = content.match(/\[dependencies\]([\s\S]*?)(?:\[|$)/);
    if (depSection) {
      const lines = depSection[1].split('\n');
      for (const line of lines) {
        const match = line.match(/^(\S+)\s*=/);
        if (match) deps.push(match[1]);
      }
    }
    const devDepSection = content.match(/\[dev-dependencies\]([\s\S]*?)(?:\[|$)/);
    if (devDepSection) {
      const lines = devDepSection[1].split('\n');
      for (const line of lines) {
        const match = line.match(/^(\S+)\s*=/);
        if (match) deps.push(match[1]);
      }
    }
  }

  // go.mod — extract require lines
  if (files['go.mod']) {
    const content = files['go.mod'];
    const requireBlock = content.match(/require\s*\(([\s\S]*?)\)/);
    if (requireBlock) {
      const lines = requireBlock[1].split('\n');
      for (const line of lines) {
        const match = line.trim().match(/^(\S+)/);
        if (match && !match[1].startsWith('//')) deps.push(match[1]);
      }
    }
    // Single-line requires
    const singleRequires = content.matchAll(/require\s+(\S+)/g);
    for (const match of singleRequires) {
      deps.push(match[1]);
    }
  }

  // pyproject.toml — extract dependencies
  if (files['pyproject.toml']) {
    const content = files['pyproject.toml'];
    const depSection = content.match(/\[project\][\s\S]*?dependencies\s*=\s*\[([\s\S]*?)\]/);
    if (depSection) {
      const items = depSection[1].matchAll(/"([^"]+)"/g);
      for (const match of items) {
        deps.push(match[1].split(/[>=<~!]/)[0].trim());
      }
    }
  }

  // requirements.txt
  if (files['requirements.txt']) {
    const lines = files['requirements.txt'].split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        deps.push(trimmed.split(/[>=<~!]/)[0].trim());
      }
    }
  }

  // Gemfile
  if (files['Gemfile']) {
    const gems = files['Gemfile'].matchAll(/gem\s+['"]([^'"]+)['"]/g);
    for (const match of gems) {
      deps.push(match[1]);
    }
  }

  // composer.json
  if (files['composer.json']) {
    const composer = safeParseJson(files['composer.json']);
    if (composer) {
      for (const key of Object.keys((composer.require as Record<string, string>) ?? {})) {
        deps.push(key);
      }
      for (const key of Object.keys(
        (composer['require-dev'] as Record<string, string>) ?? {}
      )) {
        deps.push(key);
      }
    }
  }

  return deps;
}
