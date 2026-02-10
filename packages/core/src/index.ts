/**
 * @wcnegentropy/core
 *
 * Core package for UPG manifest validation and transpilation.
 * This is the Phase 1 implementation of the Universal Project Generator.
 */

// Schema validation
export * from './schema/index.js';

// Transpiler (YAML → JSON Schema)
export * from './transpiler/index.js';

// CLI utilities
export * from './cli/index.js';
