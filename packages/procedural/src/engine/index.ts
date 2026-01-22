/**
 * Engine Module
 *
 * The core generation engine including RNG, assembler, and constraints.
 */

// RNG
export { SeededRNG, RNGFactory, type WeightedItem } from './rng.js';

// Assembler
export {
  ProjectAssembler,
  createAssembler,
  generateProject,
  type AssemblerOptions,
} from './assembler.js';

// Constraints
export {
  INCOMPATIBILITY_RULES,
  REQUIREMENT_RULES,
  DEFAULT_PAIRINGS,
  checkIncompatibilities,
  checkRequirements,
  validateStack,
  getValidOptions,
  getValidLanguagesForArchetype,
  getValidFrameworks,
  getValidRuntimes,
  getValidOrms,
  getValidDatabases,
  applyDefaults,
  validateConstraints,
  getSuggestedFrameworks,
  formatValidationError,
  type ConstraintValidation,
  type ConstraintValidationResult,
} from './constraints.js';
