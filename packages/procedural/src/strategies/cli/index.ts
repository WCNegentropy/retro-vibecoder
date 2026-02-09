/**
 * CLI Strategies
 *
 * Strategies for generating CLI tool projects.
 */

// TypeScript
export { CommanderStrategy, YargsStrategy } from './typescript.js';

// Python
export { ClickStrategy, ArgparseStrategy } from './python.js';

import { CommanderStrategy, YargsStrategy } from './typescript.js';
import { ClickStrategy, ArgparseStrategy } from './python.js';
import type { GenerationStrategy } from '../../types.js';

/**
 * All CLI strategies
 */
export const CliStrategies: GenerationStrategy[] = [
  // TypeScript
  CommanderStrategy,
  YargsStrategy,

  // Python
  ClickStrategy,
  ArgparseStrategy,
];
