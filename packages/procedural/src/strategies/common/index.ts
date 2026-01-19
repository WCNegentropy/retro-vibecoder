/**
 * Common Strategies
 *
 * Strategies that apply across multiple languages/frameworks.
 */

export { GitStrategy } from './git.js';
export { DockerStrategy } from './docker.js';
export { CIStrategy } from './ci.js';
export { ReadmeStrategy } from './readme.js';

import { GitStrategy } from './git.js';
import { DockerStrategy } from './docker.js';
import { CIStrategy } from './ci.js';
import { ReadmeStrategy } from './readme.js';
import type { GenerationStrategy } from '../../types.js';

/**
 * All common strategies
 */
export const CommonStrategies: GenerationStrategy[] = [
  GitStrategy,
  DockerStrategy,
  CIStrategy,
  ReadmeStrategy,
];
