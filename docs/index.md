# Retro Vibecoder UPG Documentation

Welcome to the Universal Project Generator documentation.

## What is UPG?

The Universal Project Generator (UPG) is a dual-mode project generation platform that combines declarative YAML manifests with procedural generation capabilities. This enables:

- **Procedural Generation** (Phase 1.5) - Generate projects from seed numbers using a Universal Matrix of tech stacks
- **Automated Discovery** - Constraint-based generation discovers thousands of valid configurations
- **Dynamic UI Generation** - Forms are generated from manifest definitions (Phase 2)
- **Deterministic Reproducibility** - Same seed always produces the same project
- **Pass 2 Enrichment** - Enhance generated projects with CI/CD, testing, logic fill, and production-ready features
- **Template Marketplace** - Share and discover both hand-crafted templates and procedural configurations
- **Smart Updates** - Keep projects in sync with template updates via 3-way merge (Phase 3)

## Quick Start

### Procedural Generation (Phase 1.5 - Current)

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Generate a project from a seed
pnpm --filter @wcnegentropy/cli seed 82910 --output ./my-project

# Run a procedural sweep (discover multiple projects)
pnpm --filter @wcnegentropy/cli sweep --count 10 --verbose

# Sweep with validation and registry persistence
pnpm --filter @wcnegentropy/cli sweep --count 100 --validate --save-registry ./registry/manifests/generated.json

# Generate with Pass 2 enrichment
pnpm --filter @wcnegentropy/cli seed 82910 --enrich --output ./my-project

# Full enrichment depth
pnpm --filter @wcnegentropy/cli seed 82910 --enrich --enrich-depth full --output ./my-project
```

### Manifest-Based Generation

```bash
# Validate a manifest
upg validate ./upg.yaml

# Initialize a new template
upg init

# Generate from a manifest template
upg generate react-starter --dest ./output
```

## Documentation Sections

### User Guide

- [Getting Started](./getting-started.md)
- [CLI Commands](./user-guide/cli-commands.md)
- [Marketplace](./user-guide/marketplace.md)

### Template Authors

- [Manifest Specification](./template-author/manifest-spec.md)
- [Examples](./template-author/examples.md)
- [Publishing Guide](./template-author/publishing-guide.md)
- [Hooks API](./template-author/hooks-api.md)

### Architecture

- [Overview](./architecture/overview.md)
- [Phase 1: Universal Spec](./architecture/phase-1-spec.md)
- [Phase 2: Generic Engine](./architecture/phase-2-engine.md)
- [Phase 3: Registry](./architecture/phase-3-registry.md)

### Contributing

- [Development Setup](./contributing/dev-setup.md)
- [Running Tests](./contributing/running-tests.md)
- [Code Style](./contributing/code-style.md)

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   UPG Architecture                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌───────────┐    ┌───────────┐    ┌───────────┐  │
│  │  upg.yaml │───>│ Validator │───>│Transpiler │  │
│  │ (Manifest)│    │   (AJV)   │    │(JSON Sch.)│  │
│  └───────────┘    └───────────┘    └───────────┘  │
│                                          │         │
│                                          ▼         │
│  ┌───────────┐    ┌───────────┐    ┌───────────┐  │
│  │  Desktop  │<───│  Dynamic  │<───│   RJSF    │  │
│  │    UI     │    │   Form    │    │  Render   │  │
│  └───────────┘    └───────────┘    └───────────┘  │
│        │                                           │
│        ▼                                           │
│  ┌───────────┐    ┌───────────┐    ┌───────────┐  │
│  │  Sidecar  │───>│  Copier/  │───>│ Generated │  │
│  │ Executor  │    │  Yeoman   │    │  Project  │  │
│  └───────────┘    └───────────┘    └───────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Procedural Generation + Enrichment Pipeline

```
Seed → Pass 1 (Strategy Pipeline) → Pass 2 (Enrichment Engine) → Enhanced Project
         ↓                             ↓
    Base scaffold               CI/CD, Testing, Logic,
    (50+ strategies)            Docs, Docker, Linting
```

Pass 2 runs optional enrichment strategies on Pass 1 output:

| Category    | Strategies                                        |
| ----------- | ------------------------------------------------- |
| **CI/CD**   | GitHub Actions, GitLab CI, Release Automation     |
| **Quality** | Linting (ESLint/Ruff/clippy), Environment Files   |
| **Logic**   | API Routes, CLI Commands, Models, Middleware      |
| **Testing** | Unit Tests, Integration Tests, Test Configuration |
| **DevOps**  | Docker Production, Docker Compose Enrichment      |
| **Docs**    | README Enrichment with setup instructions         |

## Key Concepts

### Universal Manifest (upg.yaml)

The manifest defines everything about a template:

- **Metadata** - Name, version, description, tags
- **Prompts** - Interactive questions for users
- **Actions** - File generation, copying, commands
- **Hooks** - Pre/post generation scripts

### JSON Schema Transpilation

Manifests are transpiled to JSON Schema for:

- Runtime form validation
- Dynamic UI generation with RJSF
- Conditional logic handling

### Sidecar Pattern

External tools (Copier, Yeoman) are bundled as sidecars:

- Leverage existing templating ecosystems
- Isolate execution from the main process
- Enable future tool support without core changes

## Roadmap

- **Phase 1** (Completed): Universal Spec, Validation, CLI, Manifest Transpilation
- **Phase 1.5** (Completed - Current): Universal Procedural Generation Engine
  - Seed-based generation with Mulberry32 RNG
  - Universal Matrix (7 dimensions, 100+ technology options)
  - Constraint Solver for valid tech stack combinations
  - Strategy Pipeline with 31+ generation strategies (Tier 1-5)
  - **Pass 2 Enrichment Engine** with 16 strategies across 6 categories
  - Seed Sweeper validation pipeline
  - CLI commands: `upg seed`, `upg sweep`, `upg preview`
- **Phase 2** (Next - Q2 2026): Desktop App with Dual-Mode Generation
  - Manifest Mode: Dynamic Forms (RJSF) + Copier Sidecar
  - Procedural Mode: Seed Generator + Stack Composer UI
  - Integrated validation and preview
- **Phase 3** (Future - Q3 2026): Marketplace with Hybrid Content
  - Git-based Registry (manifest templates + procedural configs)
  - Smart Update mechanism (3-way merge)
  - Seed sharing and discovery

## Getting Help

- [GitHub Issues](https://github.com/retro-vibecoder/retro-vibecoder-upg/issues)
- [Discussions](https://github.com/retro-vibecoder/retro-vibecoder-upg/discussions)
