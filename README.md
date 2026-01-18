# Retro Vibecoder UPG

**Universal Project Generator** - Transform project scaffolding from imperative scripts to declarative manifests.

> Template-based project generator with retro UI. Create C++/Python, Rust, Go, game engine projects from `.vibe` specs. Eject to vendor-independent code. Built for indie devs.

## Overview

The Retro Vibecoder UPG is a modern, data-driven project scaffolding platform that replaces traditional imperative generation scripts with declarative YAML manifests. This enables dynamic UI generation, template marketplace, and smart updates.

## Architecture

The project is structured in three phases:

### Phase 1: Universal Spec & Template Manifest
- YAML-based configuration (`upg.yaml`)
- JSON Schema validation
- Manifest-to-schema transpiler
- CLI validator tool

### Phase 2: Generic Engine & Dynamic Forms
- Tauri v2 desktop application
- React JSON Schema Form (RJSF) for dynamic UI
- Sidecar pattern for Copier/Yeoman integration
- Real-time generation logging

### Phase 3: Marketplace & Ecosystem
- Git-based registry architecture
- Smart Update with 3-way merge
- Template versioning and governance

## Quick Start

```bash
# Install dependencies
pnpm install

# Run development
pnpm dev

# Run tests
pnpm test

# Validate a template manifest
pnpm --filter @retro-vibecoder/cli validate ./templates/react-starter/upg.yaml
```

## Project Structure

```
retro-vibecoder-upg/
├── packages/
│   ├── core/       # Phase 1: Universal Spec implementation
│   ├── shared/     # Shared types and utilities
│   ├── cli/        # Command-line interface
│   ├── engine/     # Phase 2: Tauri desktop app (future)
│   └── registry/   # Phase 3: Marketplace registry (future)
├── templates/      # Example templates
├── tests/          # Testing framework
├── docs/           # Documentation
└── scripts/        # Build and validation scripts
```

## Development

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Commands

| Command | Description |
|---------|-------------|
| `pnpm build` | Build all packages |
| `pnpm dev` | Start development mode |
| `pnpm test` | Run all tests |
| `pnpm test:unit` | Run unit tests |
| `pnpm lint` | Lint all packages |
| `pnpm format` | Format all files |
| `pnpm typecheck` | Type check all packages |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](./LICENSE) for details.
