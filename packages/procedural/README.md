# @wcnegentropy/procedural

[![npm version](https://img.shields.io/npm/v/@wcnegentropy/procedural)](https://www.npmjs.com/package/@wcnegentropy/procedural)
[![license](https://img.shields.io/npm/l/@wcnegentropy/procedural)](https://github.com/WCNegentropy/retro-vibecoder/blob/main/LICENSE)

Universal Procedural Generation engine for composing software projects from capabilities.

The "Minecraft" approach to project generation — uses Mulberry32 seeded RNG to deterministically generate complete tech stacks from a single integer seed. Implements a Project Assembler that composes projects from 50+ generation strategies across the Universal Matrix.

## Installation

```bash
npm install @wcnegentropy/procedural
```

## Usage

### Generate a Project

```typescript
import { ProjectAssembler, generateProject, createAssembler } from '@wcnegentropy/procedural';

// Quick generation from a seed
const project = await generateProject(42);

// Or use the assembler directly
const assembler = createAssembler();
const result = await assembler.generate({
  seed: 42,
  archetype: 'backend',
  language: 'typescript',
});
```

### Validate a Stack

```typescript
import { validateStack, validateConstraints } from '@wcnegentropy/procedural';

const validation = validateStack({
  archetype: 'backend',
  language: 'typescript',
  framework: 'express',
});

const constraints = validateConstraints({
  archetype: 'web',
  language: 'rust',
  framework: 'react',
});
```

### Query the Universal Matrix

```typescript
import {
  getValidLanguagesForArchetype,
  getCompatibleFrameworks,
  getValidOptions,
} from '@wcnegentropy/procedural';

const languages = getValidLanguagesForArchetype('backend');
const frameworks = getCompatibleFrameworks('typescript', 'web');
const options = getValidOptions({ archetype: 'cli' });
```

### Batch Validation with Sweeper

```typescript
import { Sweeper, runUniversalSweep } from '@wcnegentropy/procedural';

// Run a sweep across the Universal Matrix
const results = await runUniversalSweep({ count: 100, validate: true });

// Or use the Sweeper class directly
const sweeper = new Sweeper({ validate: true });
const report = await sweeper.run(100);
```

## Subpath Exports

| Export Path                          | Description                                      |
| ------------------------------------ | ------------------------------------------------ |
| `@wcnegentropy/procedural`           | All engine, matrix, strategy, and sweeper exports |
| `@wcnegentropy/procedural/engine`    | `ProjectAssembler`, `SeededRNG`, constraint solver, validation helpers |
| `@wcnegentropy/procedural/matrices`  | Universal Matrix definitions (languages, frameworks, databases, archetypes) |
| `@wcnegentropy/procedural/strategies` | 50+ generation strategies (`AllStrategies`, tier getters) |
| `@wcnegentropy/procedural/sweeper`   | `Sweeper` class, `runUniversalSweep`, build step detection |

## Supported Stacks

| Archetype | Languages                                                      |
| --------- | -------------------------------------------------------------- |
| Web       | TypeScript (React, Vue, Svelte, Solid, Angular, Next.js, etc.) |
| Backend   | TypeScript, Python, Rust, Go, Java, Kotlin, C#, Ruby, PHP      |
| CLI       | TypeScript, Python, Rust, Go                                   |
| Mobile    | TypeScript (React Native), Swift, Kotlin, Dart (Flutter)       |
| Desktop   | TypeScript (Electron), Rust (Tauri), C++ (Qt), Dart (Flutter)  |
| Game      | TypeScript (Phaser, PixiJS), C# (Unity, Godot), C++ (SDL2, SFML), Rust (Bevy, Macroquad) |
| Library   | TypeScript, Python, Rust, Go, Java, Kotlin, C#, C++, Ruby, PHP |

## Architecture

```
Engine → Matrices → Strategies → Renderer → Sweeper
```

- **Engine**: `ProjectAssembler` + `SeededRNG` + constraint solver
- **Matrices**: Universal Matrix defining the possibility space of languages, frameworks, databases, and archetypes
- **Strategies**: 50+ generation strategies organized by tier (common, API, web, systems, mobile, desktop, game, library, CLI)
- **Renderer**: Transforms assembled projects into virtual file systems
- **Sweeper**: Batch generation and validation pipeline

## Part of the Retro Vibecoder UPG Monorepo

This package is part of the [Retro Vibecoder UPG](https://github.com/WCNegentropy/retro-vibecoder) monorepo — a Universal Procedural Generator that turns integers into software.

## License

MIT — Copyright (c) 2026 WCNEGENTROPY HOLDINGS LLC. See [LICENSE](https://github.com/WCNegentropy/retro-vibecoder/blob/main/LICENSE) for details.
