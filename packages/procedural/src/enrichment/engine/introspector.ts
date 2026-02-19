/**
 * File Introspector
 *
 * Provides read-only introspection utilities for Pass 1 project files.
 * Enrichment strategies use this to understand the existing project
 * structure and make informed decisions about what to add/modify.
 */

import type { FileIntrospector, ParsedManifest, ProjectFiles, TechStack } from '../../types.js';

/**
 * ProjectIntrospector implements FileIntrospector against a virtual file system.
 * It parses manifests, detects entry points, and provides structural queries.
 */
export class ProjectIntrospector implements FileIntrospector {
  private manifestCache: ParsedManifest | null = null;

  constructor(
    private readonly files: Readonly<ProjectFiles>,
    private readonly stack: TechStack
  ) {}

  getManifest(): ParsedManifest {
    if (this.manifestCache) return this.manifestCache;

    if (this.hasFile('package.json')) {
      this.manifestCache = this.parseNpmManifest();
    } else if (this.hasFile('Cargo.toml')) {
      this.manifestCache = this.parseCargoManifest();
    } else if (
      this.hasFile('pyproject.toml') ||
      this.hasFile('setup.py') ||
      this.hasFile('requirements.txt')
    ) {
      this.manifestCache = this.parsePythonManifest();
    } else if (this.hasFile('go.mod')) {
      this.manifestCache = this.parseGoManifest();
    } else if (this.hasFile('pom.xml')) {
      this.manifestCache = this.parseMavenManifest();
    } else if (this.hasFile('build.gradle') || this.hasFile('build.gradle.kts')) {
      this.manifestCache = this.parseGradleManifest();
    } else if (this.hasFile('Gemfile')) {
      this.manifestCache = this.parseGemManifest();
    } else if (this.hasFile('composer.json')) {
      this.manifestCache = this.parseComposerManifest();
    } else {
      this.manifestCache = {
        type: 'unknown',
        name: '',
        dependencies: [],
        devDependencies: [],
        scripts: {},
        raw: null,
      };
    }

    return this.manifestCache;
  }

  hasFile(path: string): boolean {
    return path in this.files;
  }

  getContent(path: string): string | undefined {
    return this.files[path];
  }

  findFiles(pattern: string): string[] {
    const regexStr =
      '^' +
      pattern
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\*\*/g, '\u0000')
        .replace(/\*/g, '[^/]*')
        .split('\u0000').join('.*') +
      '$';
    const regex = new RegExp(regexStr);
    return Object.keys(this.files).filter(p => regex.test(p));
  }

  parseJson<T = unknown>(path: string): T | undefined {
    const content = this.getContent(path);
    if (!content) return undefined;
    try {
      return JSON.parse(content) as T;
    } catch {
      return undefined;
    }
  }

  getEntryPoint(): string | undefined {
    const candidates: Record<string, string[]> = {
      typescript: ['src/index.ts', 'src/main.ts', 'src/app.ts', 'src/server.ts', 'index.ts'],
      javascript: ['src/index.js', 'src/index.mjs', 'src/main.js', 'src/app.js', 'index.js'],
      python: ['src/main.py', 'main.py', 'app.py', 'src/app.py', 'src/__main__.py'],
      rust: ['src/main.rs', 'src/lib.rs'],
      go: ['main.go', 'cmd/main.go', 'cmd/server/main.go'],
      java: ['src/main/java/com/example/Application.java', 'src/main/java/Application.java'],
      kotlin: ['src/main/kotlin/com/example/Application.kt'],
      csharp: ['Program.cs', 'src/Program.cs'],
      cpp: ['src/main.cpp', 'main.cpp'],
      swift: ['Sources/main.swift', 'Sources/App.swift'],
      ruby: ['app.rb', 'config.ru', 'lib/main.rb'],
      php: ['public/index.php', 'index.php', 'src/index.php'],
    };

    for (const candidate of candidates[this.stack.language] ?? []) {
      if (this.hasFile(candidate)) return candidate;
    }
    return undefined;
  }

  getTestCommand(): string | undefined {
    const manifest = this.getManifest();
    return manifest.scripts['test'] ?? undefined;
  }

  getBuildCommand(): string | undefined {
    const manifest = this.getManifest();
    return manifest.scripts['build'] ?? undefined;
  }

  getExposedPorts(): number[] {
    const dockerfile = this.getContent('Dockerfile');
    if (!dockerfile) return [];
    const ports: number[] = [];
    const exposeRegex = /EXPOSE\s+(\d+)/g;
    let match;
    while ((match = exposeRegex.exec(dockerfile))) {
      ports.push(parseInt(match[1], 10));
    }
    return ports;
  }

  getAllPaths(): string[] {
    return Object.keys(this.files);
  }

  // ─── Private Manifest Parsers ─────────────────────────────────────

  private parseNpmManifest(): ParsedManifest {
    const pkg = this.parseJson<{
      name?: string;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      scripts?: Record<string, string>;
    }>('package.json');

    if (!pkg) {
      return {
        type: 'npm',
        name: '',
        dependencies: [],
        devDependencies: [],
        scripts: {},
        raw: null,
      };
    }

    return {
      type: 'npm',
      name: pkg.name ?? '',
      dependencies: Object.keys(pkg.dependencies ?? {}),
      devDependencies: Object.keys(pkg.devDependencies ?? {}),
      scripts: pkg.scripts ?? {},
      raw: pkg,
    };
  }

  private parseCargoManifest(): ParsedManifest {
    const content = this.getContent('Cargo.toml') ?? '';
    const nameMatch = content.match(/name\s*=\s*"([^"]+)"/);
    const deps: string[] = [];

    // Simple TOML dependency extraction
    const depSection = content.match(/\[dependencies\]([\s\S]*?)(?:\[|$)/);
    if (depSection) {
      const lines = depSection[1].split('\n');
      for (const line of lines) {
        const m = line.match(/^(\w[\w-]*)\s*=/);
        if (m) deps.push(m[1]);
      }
    }

    const devDeps: string[] = [];
    const devDepSection = content.match(/\[dev-dependencies\]([\s\S]*?)(?:\[|$)/);
    if (devDepSection) {
      const lines = devDepSection[1].split('\n');
      for (const line of lines) {
        const m = line.match(/^(\w[\w-]*)\s*=/);
        if (m) devDeps.push(m[1]);
      }
    }

    return {
      type: 'cargo',
      name: nameMatch?.[1] ?? '',
      dependencies: deps,
      devDependencies: devDeps,
      scripts: {
        build: 'cargo build',
        test: 'cargo test',
        lint: 'cargo clippy',
      },
      raw: content,
    };
  }

  private parsePythonManifest(): ParsedManifest {
    const deps: string[] = [];
    const req = this.getContent('requirements.txt');
    if (req) {
      for (const line of req.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const name = trimmed.split(/[>=<![]/)[0].trim();
          if (name) deps.push(name);
        }
      }
    }

    return {
      type: 'pyproject',
      name: '',
      dependencies: deps,
      devDependencies: [],
      scripts: {
        test: 'pytest',
        lint: 'ruff check .',
      },
      raw: null,
    };
  }

  private parseGoManifest(): ParsedManifest {
    const content = this.getContent('go.mod') ?? '';
    const nameMatch = content.match(/module\s+(\S+)/);
    const deps: string[] = [];

    const requireBlock = content.match(/require\s*\(([\s\S]*?)\)/);
    if (requireBlock) {
      for (const line of requireBlock[1].split('\n')) {
        const m = line.trim().match(/^(\S+)\s/);
        if (m) deps.push(m[1]);
      }
    }

    return {
      type: 'gomod',
      name: nameMatch?.[1] ?? '',
      dependencies: deps,
      devDependencies: [],
      scripts: {
        build: 'go build ./...',
        test: 'go test ./...',
        lint: 'golangci-lint run',
      },
      raw: content,
    };
  }

  private parseMavenManifest(): ParsedManifest {
    return {
      type: 'maven',
      name: '',
      dependencies: [],
      devDependencies: [],
      scripts: {
        build: 'mvn package',
        test: 'mvn test',
      },
      raw: null,
    };
  }

  private parseGradleManifest(): ParsedManifest {
    return {
      type: 'gradle',
      name: '',
      dependencies: [],
      devDependencies: [],
      scripts: {
        build: './gradlew build',
        test: './gradlew test',
      },
      raw: null,
    };
  }

  private parseGemManifest(): ParsedManifest {
    return {
      type: 'gemspec',
      name: '',
      dependencies: [],
      devDependencies: [],
      scripts: {
        test: 'bundle exec rspec',
        lint: 'bundle exec rubocop',
      },
      raw: null,
    };
  }

  private parseComposerManifest(): ParsedManifest {
    const pkg = this.parseJson<{
      name?: string;
      require?: Record<string, string>;
      'require-dev'?: Record<string, string>;
      scripts?: Record<string, string | string[]>;
    }>('composer.json');

    if (!pkg) {
      return {
        type: 'composer',
        name: '',
        dependencies: [],
        devDependencies: [],
        scripts: {},
        raw: null,
      };
    }

    const scripts: Record<string, string> = {};
    if (pkg.scripts) {
      for (const [key, val] of Object.entries(pkg.scripts)) {
        scripts[key] = Array.isArray(val) ? val.join(' && ') : val;
      }
    }

    return {
      type: 'composer',
      name: pkg.name ?? '',
      dependencies: Object.keys(pkg.require ?? {}),
      devDependencies: Object.keys(pkg['require-dev'] ?? {}),
      scripts,
      raw: pkg,
    };
  }
}
