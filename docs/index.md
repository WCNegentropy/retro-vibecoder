# Retro Vibecoder UPG Documentation

Welcome to the Universal Project Generator documentation.

## What is UPG?

The Universal Project Generator (UPG) transforms project scaffolding from imperative scripts to declarative YAML manifests. This enables:

- **Dynamic UI Generation** - Forms are generated from manifest definitions
- **Template Marketplace** - Share and discover templates via a Git-based registry
- **Smart Updates** - Keep projects in sync with template updates via 3-way merge

## Quick Start

```bash
# Install UPG
npm install -g @retro-vibecoder/cli

# Generate a project
upg generate react-starter

# Validate a manifest
upg validate ./upg.yaml

# Initialize a new template
upg init
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

- **Phase 1** (Current): Universal Spec, Validation, CLI
- **Phase 2** (Next): Desktop App, Dynamic Forms, Sidecar
- **Phase 3** (Future): Registry, Smart Update, Marketplace

## Getting Help

- [GitHub Issues](https://github.com/retro-vibecoder/retro-vibecoder-upg/issues)
- [Discussions](https://github.com/retro-vibecoder/retro-vibecoder-upg/discussions)
