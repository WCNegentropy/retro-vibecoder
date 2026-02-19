# @wcnegentropy/cli

[![npm version](https://img.shields.io/npm/v/@wcnegentropy/cli)](https://www.npmjs.com/package/@wcnegentropy/cli)
[![license](https://img.shields.io/npm/l/@wcnegentropy/cli)](https://github.com/WCNegentropy/retro-vibecoder/blob/main/LICENSE)

Command-line interface for the [Universal Project Generator](https://github.com/WCNegentropy/retro-vibecoder). Generate software projects from seeds, templates, or manifests.

## Installation

```bash
# Global install
npm install -g @wcnegentropy/cli

# Or run directly with npx
npx @wcnegentropy/cli seed 42
```

## Quick Start

```bash
# Generate a project from a seed
upg seed 42 --output ./my-project

# Constrained generation
upg seed 42 --archetype backend --language typescript

# Batch generate and validate
upg sweep --count 10 --validate

# Validate a manifest
upg validate ./upg.yaml

# Generate with Pass 2 enrichment
upg seed 42 --enrich --output ./my-project

# Full enrichment depth
upg seed 42 --enrich --enrich-depth full --output ./my-project
```

## Commands

| Command                    | Description                              |
| -------------------------- | ---------------------------------------- |
| `upg seed <number>`        | Generate a project from a seed number (supports `--enrich`) |
| `upg sweep`                | Batch generate and validate projects (supports `--enrich`)  |
| `upg generate [template]`  | Generate a project from a manifest template |
| `upg validate <manifest>`  | Validate a UPG manifest file             |
| `upg init`                 | Initialize a new UPG manifest            |
| `upg search <query>`       | Search the project registry              |
| `upg docs <manifest>`      | Generate documentation from a manifest   |
| `upg test <manifest>`      | Test a manifest configuration            |
| `upg preview <seed>`       | JSON preview of a seed (supports `--enrich`) |

### `upg seed <number>`

Generate a single project from a seed:

```bash
upg seed 12345 --output ./my-project --verbose
```

**Options:**

- `-o, --output <path>` — Output directory
- `-v, --verbose` — Show file previews
- `-n, --name <name>` — Custom project name
- `--archetype <type>` — Force archetype (web, backend, cli, mobile, desktop, game, library)
- `--language <lang>` — Force language (typescript, python, go, rust, java, kotlin, csharp, cpp, ruby, php, swift, dart)
- `--framework <fw>` — Force framework
- `--json` — Output machine-readable JSON
- `--force` — Overwrite existing output directory

**Enrichment Options:**

- `--enrich` — Enable Pass 2 enrichment
- `--enrich-depth <depth>` — Enrichment depth (minimal | standard | full, default: standard)
- `--no-enrich-cicd` — Skip CI/CD enrichment
- `--no-enrich-release` — Skip release automation
- `--no-enrich-logic` — Skip logic fill enrichment
- `--no-enrich-tests` — Skip test generation
- `--no-enrich-docker-prod` — Skip Docker production optimizations
- `--no-enrich-linting` — Skip linting config enrichment
- `--no-enrich-env` — Skip environment file generation
- `--no-enrich-docs` — Skip documentation enrichment

### `upg sweep`

Batch generate multiple projects:

```bash
upg sweep --count 100 --validate --save-registry ./registry/manifests/generated.json
```

**Options:**

- `-c, --count <n>` — Number of projects (default: 5)
- `--validate` — Validate generated projects
- `-o, --output <path>` — Output directory
- `--save-registry <path>` — Save valid projects to registry
- `-f, --format <fmt>` — Output format (text | json)
- `-v, --verbose` — Verbose output
- `--archetype <type>` — Force archetype (web|backend|cli|mobile|desktop|game|library)
- `--language <lang>` — Force language
- `--start-seed <number>` — Starting seed number
- `--dry-run` — Preview stacks without generating files
- `--only-valid` — Keep retrying until N valid projects are found

**Enrichment Options:**

- `--enrich` — Enable Pass 2 enrichment on generated projects
- `--enrich-depth <depth>` — Enrichment depth (minimal | standard | full)

### `upg validate <manifest>`

Validate a UPG manifest file:

```bash
upg validate ./templates/my-template/upg.yaml
```

### `upg generate [template]`

Generate a project from a template:

```bash
upg generate my-template --dest ./output
upg generate my-template --dest ./output --json
```

**Options:**

- `-d, --dest <path>` — Destination directory
- `--data <json>` — JSON data for prompts (non-interactive)
- `--use-defaults` — Use default values for all prompts
- `--dry-run` — Show what would be generated without creating files
- `-f, --force` — Overwrite existing files
- `--json` — Output machine-readable JSON

### `upg search <query>`

Search the project registry:

```bash
upg search "backend typescript"
upg search "rust" --format json
```

**Options:**

- `-t, --tags <tags>` — Filter by tags (comma-separated)
- `-l, --limit <number>` — Maximum results (default: 10)
- `-f, --format <format>` — Output format (text | json)
- `--local` — Use local registry only
- `--remote` — Use remote registry only

### `upg init`

Initialize a new UPG manifest:

```bash
upg init --name my-template --json
```

**Options:**

- `-n, --name <name>` — Template name
- `-f, --force` — Overwrite existing manifest
- `--json` — Output machine-readable JSON

### Enrichment Depth Presets

The `--enrich-depth` flag controls which enrichment strategies are applied:

| Preset      | CI/CD | Release | Logic Fill | Tests | Docker Prod | Linting | Env Files | Docs |
| ----------- | ----- | ------- | ---------- | ----- | ----------- | ------- | --------- | ---- |
| `minimal`   | ✓     |         |            |       |             | ✓       | ✓         | ✓    |
| `standard`  | ✓     | ✓       | ✓          | ✓     | ✓           | ✓       | ✓         | ✓    |
| `full`      | ✓     | ✓       | ✓          | ✓     | ✓           | ✓       | ✓         | ✓    |

Individual strategies can be toggled off using `--no-enrich-*` flags regardless of depth.

## Programmatic Usage

```typescript
import { createCli } from '@wcnegentropy/cli';

const cli = createCli();
cli.parse(process.argv);
```

## Part of the Retro Vibecoder UPG Monorepo

This package is part of the [Retro Vibecoder UPG](https://github.com/WCNegentropy/retro-vibecoder) monorepo — a Universal Procedural Generator that turns integers into software.

## License

MIT — Copyright (c) 2026 WCNEGENTROPY HOLDINGS LLC. See [LICENSE](https://github.com/WCNegentropy/retro-vibecoder/blob/main/LICENSE) for details.
