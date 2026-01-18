/**
 * Schema validation exports
 */

export { validateManifest, createValidator } from './validator.js';
export { manifestSchema } from './upg-manifest-schema.js';
export { catalogSchema } from './template-catalog-schema.js';

export type { ValidatorOptions, ValidatorResult } from './validator.js';
