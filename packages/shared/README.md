# @wcnegentropy/shared

[![npm version](https://img.shields.io/npm/v/@wcnegentropy/shared)](https://www.npmjs.com/package/@wcnegentropy/shared)
[![license](https://img.shields.io/npm/l/@wcnegentropy/shared)](https://github.com/WCNegentropy/retro-vibecoder/blob/main/LICENSE)

Shared types, constants, and utilities for the [Retro Vibecoder UPG](https://github.com/WCNegentropy/retro-vibecoder) ecosystem.

## Installation

```bash
npm install @wcnegentropy/shared
```

## Usage

```typescript
// Import types
import type { UpgManifest, ValidationError } from '@wcnegentropy/shared';

// Import utilities
import { parseYaml, parseSeed } from '@wcnegentropy/shared';

// Import enrichment types
import type { ManifestEnrichment } from '@wcnegentropy/shared';

// Import constants
import { BINARY_EXTENSIONS, DEFAULT_OUTPUT_DIR } from '@wcnegentropy/shared';
```

## Subpath Exports

This package provides granular subpath exports:

| Export Path                    | Description                                    |
| ------------------------------ | ---------------------------------------------- |
| `@wcnegentropy/shared`         | All types, constants, and utilities re-exported |
| `@wcnegentropy/shared/types`   | TypeScript types (manifest, registry, answers, sidecar) |
| `@wcnegentropy/shared/constants` | Defaults, paths, and error codes               |
| `@wcnegentropy/shared/utils`   | YAML parser, schema validator, path helpers, seed parser |

### Types

```typescript
import type { UpgManifest, ManifestEnrichment, RegistryEntry, SidecarConfig } from '@wcnegentropy/shared/types';
```

### Constants

```typescript
import { DEFAULT_OUTPUT_DIR, BINARY_EXTENSIONS } from '@wcnegentropy/shared/constants';
```

### Utilities

```typescript
import { parseYaml, validateSchema, parseSeed, resolveTemplatePath } from '@wcnegentropy/shared/utils';
```

## Peer Usage

This package is primarily consumed as an internal dependency by other packages in the UPG ecosystem:

- [`@wcnegentropy/core`](https://www.npmjs.com/package/@wcnegentropy/core)
- [`@wcnegentropy/procedural`](https://www.npmjs.com/package/@wcnegentropy/procedural)
- [`@wcnegentropy/cli`](https://www.npmjs.com/package/@wcnegentropy/cli)

## Enrichment Types

The `ManifestEnrichment` type defines enrichment preferences for procedural generation manifests:

```typescript
interface ManifestEnrichment {
  enabled?: boolean;
  depth?: 'minimal' | 'standard' | 'full';
  cicd?: boolean;
  release?: boolean;
  fillLogic?: boolean;
  tests?: boolean;
  dockerProd?: boolean;
  linting?: boolean;
  envFiles?: boolean;
  docs?: boolean;
}
```

This type is used in the `UpgManifest.enrichment` field to declare enrichment preferences for template-based generation.

## Part of the Retro Vibecoder UPG Monorepo

This package is part of the [Retro Vibecoder UPG](https://github.com/WCNegentropy/retro-vibecoder) monorepo — a Universal Procedural Generator that turns integers into software.

## License

MIT — Copyright (c) 2026 WCNEGENTROPY HOLDINGS LLC. See [LICENSE](https://github.com/WCNegentropy/retro-vibecoder/blob/main/LICENSE) for details.
