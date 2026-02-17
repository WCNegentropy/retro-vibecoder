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
```

## Commands

| Command                    | Description                              |
| -------------------------- | ---------------------------------------- |
| `upg seed <number>`        | Generate a project from a seed number    |
| `upg sweep`                | Batch generate and validate projects     |
| `upg generate [template]`  | Generate a project from a manifest template |
| `upg validate <manifest>`  | Validate a UPG manifest file             |
| `upg init`                 | Initialize a new UPG manifest            |
| `upg search <query>`       | Search the project registry              |
| `upg docs <manifest>`      | Generate documentation from a manifest   |
| `upg test <manifest>`      | Test a manifest configuration            |
| `upg preview <seed>`       | JSON preview of a seed (for integrations) |

### `upg seed <number>`

Generate a single project from a seed:

```bash
upg seed 12345 --output ./my-project --verbose
```

**Options:**

- `-o, --output <path>` — Output directory
- `-v, --verbose` — Show file previews
- `--archetype <type>` — Force archetype (web, backend, cli, mobile, desktop, game, library)
- `--language <lang>` — Force language (typescript, python, rust, go, java, etc.)
- `--framework <fw>` — Force framework

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
