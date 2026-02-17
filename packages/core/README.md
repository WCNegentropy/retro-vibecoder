# @wcnegentropy/core

[![npm version](https://img.shields.io/npm/v/@wcnegentropy/core)](https://www.npmjs.com/package/@wcnegentropy/core)
[![license](https://img.shields.io/npm/l/@wcnegentropy/core)](https://github.com/WCNegentropy/retro-vibecoder/blob/main/LICENSE)

Core manifest validation and transpilation engine for the [Retro Vibecoder UPG](https://github.com/WCNegentropy/retro-vibecoder).

Provides JSON Schema-based validation of UPG manifests (`upg.yaml`) and transpilation from YAML manifests to JSON Schema, plus CLI utility helpers.

## Installation

```bash
npm install @wcnegentropy/core
```

## Usage

### Validate a Manifest

```typescript
import { validateManifest, createValidator } from '@wcnegentropy/core';

// One-off validation
const result = await validateManifest('./upg.yaml');
console.log(result); // { valid: true } or { valid: false, errors: [...] }

// Reusable validator
const validator = createValidator();
const result2 = await validator.validate(manifestData);
```

### Transpile Manifest to JSON Schema

```typescript
import { transpileManifestToSchema } from '@wcnegentropy/core';

const schema = transpileManifestToSchema(manifest);
```

### CLI Utilities

```typescript
import { validateCommand, docsGenCommand } from '@wcnegentropy/core';

// Validate a manifest from the command line
await validateCommand({ manifest: './upg.yaml' });

// Generate documentation from a manifest
await docsGenCommand({ manifest: './upg.yaml', output: './docs' });
```

## Subpath Exports

| Export Path                   | Description                                       |
| ----------------------------- | ------------------------------------------------- |
| `@wcnegentropy/core`          | All schema, transpiler, and CLI exports re-exported |
| `@wcnegentropy/core/schema`   | `validateManifest`, `createValidator`, `manifestSchema`, `catalogSchema` |
| `@wcnegentropy/core/transpiler` | `transpileManifestToSchema`, `transpileConditionalLogic`, Jinja2 helpers |
| `@wcnegentropy/core/cli`      | `validateCommand`, `docsGenCommand`, `testGenerateCommand` |

## Dependencies

- [`@wcnegentropy/shared`](https://www.npmjs.com/package/@wcnegentropy/shared) — shared types and utilities
- [`ajv`](https://www.npmjs.com/package/ajv) — JSON Schema validation
- [`ajv-formats`](https://www.npmjs.com/package/ajv-formats) — format validation for Ajv

## Part of the Retro Vibecoder UPG Monorepo

This package is part of the [Retro Vibecoder UPG](https://github.com/WCNegentropy/retro-vibecoder) monorepo — a Universal Procedural Generator that turns integers into software.

## License

MIT — Copyright (c) 2026 WCNEGENTROPY HOLDINGS LLC. See [LICENSE](https://github.com/WCNegentropy/retro-vibecoder/blob/main/LICENSE) for details.
