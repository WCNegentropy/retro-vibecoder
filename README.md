# Retro Vibecoder UPG

**Universal Procedural Generator** - A machine that turns integers into software.

> Transform project scaffolding from imperative scripts to declarative manifests. Generate any tech stack from a single seed number.

## The Paradigm Shift

We have moved beyond simple "templating" (copy-pasting files) into **generative software engineering** (assembling logic based on constraints).

### The "Minecraft" Effect

Just as Minecraft uses Perlin noise to generate terrain, we use Mulberry32 noise to generate tech stacks:

| Seed | Generated Project |
|------|-------------------|
| 82910 | Rust (Axum) + Postgres + Docker API |
| 10455 | Go (Cobra) CLI tool |
| 99123 | Python (FastAPI) + MongoDB service |
| 33411 | React Native (Expo) mobile app |
| 55782 | React + Vite + TypeScript web app |
| 44128 | Java Spring Boot + MySQL backend |

## Quick Start

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

| Dimension | Options |
|-----------|---------|
| **Archetype** | web, backend, cli, mobile, desktop, game, library |
| **Language** | TypeScript, Python, Go, Rust, Java, C#, C++, Swift, Kotlin |
| **Framework** | React, Vue, Svelte, Express, FastAPI, Axum, Spring Boot, .NET |
| **Database** | PostgreSQL, MySQL, SQLite, MongoDB, Redis, Neo4j |
| **Runtime** | Node, Deno, Bun, JVM, .NET, Native, Browser |

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
- **TypeScript/Node.js**: Express, Fastify, NestJS
- **Python**: FastAPI, Flask, Django
- **Rust**: Axum, Actix, Clap (CLI)

### Tier 2: Systems & Go
- **Go**: Gin, Echo, Cobra (CLI)
- **C++**: CMake projects

### Tier 3: Enterprise
- **Java**: Spring Boot
- **C#**: .NET Core / ASP.NET

### Tier 4: Mobile
- **React Native**: Expo

### Tier 5: Web Frontend
- **React**: Vite + TypeScript
- **Vue**: Vite + Vue 3 + Pinia
- **Svelte**: Vite + SvelteKit
- **Solid**: Vite + Solid

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
│   │   │   ├── mobile/   # React Native strategies
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

| Command | Description |
|---------|-------------|
| `pnpm build` | Build all packages |
| `pnpm dev` | Start development mode |
| `pnpm test` | Run all tests |
| `pnpm lint` | Lint all packages |
| `pnpm format` | Format all files |
| `pnpm typecheck` | Type check all packages |

### Adding a New Strategy

1. Create a strategy file in the appropriate directory:
   ```typescript
   // packages/procedural/src/strategies/web/my-framework.ts
   export const MyFrameworkStrategy: GenerationStrategy = {
     id: 'web-myframework',
     name: 'My Framework',
     priority: 10,
     matches: (stack) => stack.framework === 'myframework',
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
