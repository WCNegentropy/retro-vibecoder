# Retro Vibecoder UPG

![Version](https://img.shields.io/badge/version-0.2.0-blue)

**Universal Procedural Generator** - A machine that turns integers into software.

> Transform project scaffolding from imperative scripts to declarative manifests. Generate any tech stack from a single seed number.

## The Paradigm Shift

We have moved beyond simple "templating" (copy-pasting files) into **generative software engineering** (assembling logic based on constraints).

### The "Minecraft" Effect

Just as Minecraft uses Perlin noise to generate terrain, we use Mulberry32 noise to generate tech stacks. Each seed produces a deterministic output, and you can constrain generation to specific archetypes or languages:

```bash
# Generate from a seed (unconstrained - result depends on RNG)
upg seed 42

# Constrained generation (100% success rate)
upg seed 42 --archetype backend --language typescript  # Express/Fastify/NestJS
upg seed 42 --archetype backend --language python      # FastAPI/Flask/Django
upg seed 42 --archetype backend --language rust        # Axum/Actix
upg seed 42 --archetype backend --language go          # Gin/Echo
upg seed 42 --archetype cli --language rust            # Clap CLI
upg seed 42 --archetype web --language typescript      # React/Vue/Svelte/etc.
upg seed 42 --archetype mobile --language swift        # SwiftUI app
```

**Note:** Unconstrained generation explores the full possibility space, which may produce invalid combinations. Use `--archetype` and `--language` flags for reliable results.

## Quick Start

### Desktop App

Download the latest UPG Desktop from the [Releases page](https://github.com/WCNegentropy/retro-vibecoder/releases):

| Platform | Format |
|----------|--------|
| Windows | `.msi`, `.exe` |
| macOS (Apple Silicon) | `.dmg` |
| Linux | `.deb`, `.AppImage` |

### CLI

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Generate a project from a seed
pnpm --filter @retro-vibecoder/cli seed 82910 --output ./my-project

# Run a procedural sweep
pnpm --filter @retro-vibecoder/cli sweep --count 10 --verbose

# Sweep with validation and registry persistence
pnpm --filter @retro-vibecoder/cli sweep --count 100 --validate --save-registry ./registry/manifests/generated.json
```

## Architecture

### Universal Matrix

The Universal Matrix defines the possibility space of modern software:

| Dimension     | Options                                                       |
| ------------- | ------------------------------------------------------------- |
| **Archetype** | web, backend, cli, mobile, desktop, game, library             |
| **Language**  | TypeScript, Python, Go, Rust, Java, C#, C++, Swift, Kotlin    |
| **Framework** | React, Vue, Svelte, Express, FastAPI, Axum, Spring Boot, .NET |
| **Database**  | PostgreSQL, MySQL, SQLite, MongoDB, Redis, Neo4j              |
| **Runtime**   | Node, Deno, Bun, JVM, .NET, Native, Browser                   |

### Procedural Engine

```
┌─────────────────────────────────────────────────────────────────┐
│                    ProjectAssembler                             │
│  ┌─────────┐    ┌──────────────┐    ┌───────────────────────┐  │
│  │ Seed    │───▶│ SeededRNG    │───▶│ Constraint Solver     │  │
│  │ (int)   │    │ (Mulberry32) │    │ (Incompatibility +    │  │
│  └─────────┘    └──────────────┘    │  Requirement Rules)   │  │
│                                      └───────────┬───────────┘  │
│                                                  ▼              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Strategy Pipeline                           │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │   │
│  │  │ Common   │ │ API      │ │ Web      │ │ Systems    │  │   │
│  │  │ (Git,    │ │ (TS,     │ │ (React,  │ │ (C++,      │  │   │
│  │  │ Docker,  │ │ Python,  │ │ Vue,     │ │ Java,      │  │   │
│  │  │ CI)      │ │ Rust,Go) │ │ Svelte)  │ │ C#)        │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │   │
│  │  │ Desktop  │ │ Game     │ │ Mobile   │ │ Library    │  │   │
│  │  │ (Tauri,  │ │ (Phaser, │ │ (RN,     │ │ (npm,      │  │   │
│  │  │ Electron,│ │ Bevy,    │ │ SwiftUI, │ │ PyPI,      │  │   │
│  │  │ Qt)      │ │ SDL2)    │ │ Flutter) │ │ crates.io) │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                  ▼                              │
│                    ┌─────────────────────┐                      │
│                    │ Generated Project   │                      │
│                    │ (Virtual FS)        │                      │
│                    └─────────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

## Supported Stacks

### Tier 1: Web Technologies

- **TypeScript/JavaScript**: Express, Fastify, NestJS (both TS and JS supported)
- **Python**: FastAPI, Flask, Django
- **Rust**: Axum, Actix, Clap (CLI)

### Tier 2: Systems & Go

- **Go**: Gin, Echo, Cobra (CLI)
- **C++**: CMake projects

### Tier 3: Enterprise

- **Java/Kotlin**: Spring Boot (both Java and Kotlin supported)
- **C#**: .NET Core / ASP.NET
- **Ruby**: Ruby on Rails
- **PHP**: Laravel

### Tier 4: Mobile

- **React Native**: Expo (TypeScript)
- **SwiftUI**: Native iOS/macOS apps (Swift)
- **Jetpack Compose**: Native Android apps (Kotlin)
- **Flutter**: Cross-platform mobile apps (Dart)

### Tier 5: Web Frontend

- **React**: Vite + TypeScript
- **Vue**: Vite + Vue 3 + Pinia
- **Svelte**: Vite + SvelteKit
- **Solid**: Vite + Solid
- **Angular**: Angular 17 + TypeScript
- **Next.js**: React + SSR/SSG
- **Nuxt**: Vue 3 + SSR/SSG
- **SvelteKit**: Svelte + SSR/SSG
- **Qwik**: Resumable framework

### Tier 6: Desktop

- **Tauri**: Rust + Web (TypeScript)
- **Electron**: Node.js + Chromium (TypeScript/JavaScript)
- **Qt**: Cross-platform native (C++)
- **Flutter Desktop**: Cross-platform (Dart)

### Tier 7: Game

- **Phaser**: 2D browser games (TypeScript/JavaScript)
- **PixiJS**: 2D rendering engine (TypeScript/JavaScript)
- **Unity**: Cross-platform game engine (C#)
- **Godot Mono**: Open-source game engine (C#)
- **SDL2**: Low-level game development (C++)
- **SFML**: Simple multimedia library (C++)
- **Bevy**: Data-driven game engine (Rust)
- **Macroquad**: Simple game framework (Rust)

## CLI Commands

### `upg seed <number>`

Generate a single project from a seed:

```bash
upg seed 12345 --output ./my-project --verbose
```

Options:

- `-o, --output <path>` - Output directory
- `-v, --verbose` - Show file previews
- `--archetype <type>` - Force archetype
- `--language <lang>` - Force language
- `--framework <fw>` - Force framework

### `upg sweep`

Generate multiple projects procedurally:

```bash
upg sweep --count 100 --validate --save-registry ./registry/manifests/generated.json
```

Options:

- `-c, --count <n>` - Number of projects (default: 5)
- `--validate` - Validate generated projects
- `-o, --output <path>` - Output directory
- `--save-registry <path>` - Save valid projects to registry
- `-f, --format <fmt>` - Output format (text|json)
- `-v, --verbose` - Verbose output

### `upg validate <manifest>`

Validate a UPG manifest file:

```bash
upg validate ./templates/my-template/upg.yaml
```

### `upg generate [template]`

Generate a project from a template:

```bash
upg generate my-template --dest ./output
```

## Project Structure

```
retro-vibecoder-upg/
├── packages/
│   ├── cli/              # CLI interface
│   ├── core/             # Manifest validation & transpilation
│   ├── procedural/       # Universal Procedural Generation engine
│   │   ├── engine/       # Assembler, RNG, Constraint Solver
│   │   ├── strategies/   # Generation strategies by tier
│   │   │   ├── api/      # Backend API strategies
│   │   │   ├── web/      # Web frontend strategies
│   │   │   ├── systems/  # C++ strategies
│   │   │   ├── backend/  # Java, C# strategies
│   │   │   ├── mobile/   # React Native, SwiftUI, Flutter strategies
│   │   │   ├── desktop/  # Tauri, Electron, Qt strategies
│   │   │   ├── game/     # Phaser, Bevy, SDL2, Unity strategies
│   │   │   ├── library/  # Library/package strategies
│   │   │   ├── cli/      # CLI tool strategies
│   │   │   └── common/   # Git, Docker, CI strategies
│   │   ├── matrices/     # Universal Matrix definitions
│   │   └── sweeper/      # Validation pipeline
│   └── shared/           # Shared types and utilities
├── registry/             # Validated project registry
│   └── manifests/        # Registry JSON files
├── templates/            # Template examples
├── tests/                # Test framework
└── docs/                 # Documentation
```

## Development

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Commands

| Command          | Description             |
| ---------------- | ----------------------- |
| `pnpm build`     | Build all packages      |
| `pnpm dev`       | Start development mode  |
| `pnpm test`      | Run all tests           |
| `pnpm lint`      | Lint all packages       |
| `pnpm format`    | Format all files        |
| `pnpm typecheck` | Type check all packages |

### Adding a New Strategy

1. Create a strategy file in the appropriate directory:

   ```typescript
   // packages/procedural/src/strategies/web/my-framework.ts
   export const MyFrameworkStrategy: GenerationStrategy = {
     id: 'web-myframework',
     name: 'My Framework',
     priority: 10,
     matches: stack => stack.framework === 'myframework',
     apply: async ({ files, projectName }) => {
       files['package.json'] = '...';
       // Generate files
     },
   };
   ```

2. Export from the category index:

   ```typescript
   // packages/procedural/src/strategies/web/index.ts
   export { MyFrameworkStrategy } from './my-framework.js';
   ```

3. Add to `AllStrategies` in the main index.

## The Registry

The registry stores validated project configurations discovered through sweeps:

```bash
# Run a large sweep and populate the registry
upg sweep --count 1000 --validate --save-registry ./registry/manifests/generated.json
```

Registry entries include:

- Seed number for reproducibility
- Complete tech stack configuration
- List of generated files
- Validation timestamp

## Philosophy

> "We have built a machine that turns integers into software."

The Universal Procedural Generator represents a shift from:

- **Imperative scripting** → **Declarative generation**
- **Template copying** → **Constraint-based assembly**
- **Manual configuration** → **Seed-based discovery**

Every valid software project exists as a point in the Universal Matrix. This tool lets you explore that space systematically.

## Legal & Licensing

### The Tool (Retro Vibecoder UPG)

The Universal Project Generator source code is copyright **WCNEGENTROPY HOLDINGS LLC** and licensed under the **MIT License**. You are free to fork, modify, and distribute the tool itself.

### The Registry (Universal Matrix)

All seed configurations and templates hosted in the Official Registry are dedicated to the public domain or licensed under **MIT** to ensure the ecosystem remains free and open for everyone.

### Generated Code & Liability

1. **User Responsibility:** Code generated by UPG is a starting point. You (the user) accept full responsibility for the code generated by this tool, including its security, fitness for purpose, and compliance with third-party rights.
2. **No Warranty:** The UPG team provides no warranty regarding the generated code. The software is provided "AS IS", without warranty of any kind.
3. **Malicious Use:** UPG is intended for legitimate software development. We disclaim any association with projects generated for malicious purposes.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

Copyright (c) 2026 WCNEGENTROPY HOLDINGS LLC - Licensed under the MIT License. See [LICENSE](./LICENSE) for details.
