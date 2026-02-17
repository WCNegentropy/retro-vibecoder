/**
 * @wcnegentropy/core
 *
 * Core package for UPG manifest validation and transpilation.
 *
 * Main use cases:
 * - **Validation**: `validateCommand({ path })` — validate a UPG manifest file (YAML syntax, schema, prompts)
 * - **Transpilation**: `transpileManifestToSchema(manifest)` — convert a UPG manifest to JSON Schema + UI Schema
 * - **Docs generation**: `docsGenCommand({ manifestPath })` — generate markdown/JSON documentation from a manifest
 */

// Schema validation
export * from './schema/index.js';

// Transpiler (YAML → JSON Schema)
export * from './transpiler/index.js';

// CLI utilities
export * from './cli/index.js';
