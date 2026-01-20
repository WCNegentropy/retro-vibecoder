# Registry

This directory contains validated project manifests discovered through procedural generation sweeps.

## Structure

```
registry/
  manifests/
    generated.json     # Auto-populated registry of validated projects
```

## Usage

Run a sweep with registry persistence:

```bash
# Generate and validate 100 projects, saving valid ones to registry
upg sweep --count 100 --validate --save-registry ./registry/manifests/generated.json
```

## Manifest Format

The `generated.json` file contains:

```json
{
  "version": "1.0.0",
  "generatedAt": "ISO timestamp",
  "totalEntries": 42,
  "entries": [
    {
      "seed": 12345,
      "id": "project-name",
      "stack": {
        "archetype": "backend",
        "language": "typescript",
        "framework": "express",
        "runtime": "node",
        "database": "postgres",
        "orm": "prisma"
      },
      "files": ["package.json", "src/index.ts", "..."],
      "validatedAt": "ISO timestamp",
      "upgVersion": "1.0.0"
    }
  ]
}
```

## Discovering Projects

Each seed number deterministically generates a unique project configuration. The registry tracks which seeds produce valid, buildable projects across the Universal Matrix.
