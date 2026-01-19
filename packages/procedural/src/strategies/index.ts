/**
 * Generation Strategies
 *
 * Pluggable strategies for generating different parts of projects.
 */

// Common strategies
export { CommonStrategies, GitStrategy, DockerStrategy, CIStrategy, ReadmeStrategy } from './common/index.js';

// API/Backend strategies
export {
  ApiStrategies,
  ExpressStrategy,
  FastifyStrategy,
  NestJSStrategy,
  FastAPIStrategy,
  FlaskStrategy,
  DjangoStrategy,
  AxumStrategy,
  ActixStrategy,
  ClapStrategy,
  GinStrategy,
  EchoStrategy,
  CobraStrategy,
} from './api/index.js';

import { CommonStrategies } from './common/index.js';
import { ApiStrategies } from './api/index.js';
import type { GenerationStrategy } from '../types.js';

/**
 * All built-in strategies combined
 */
export const AllStrategies: GenerationStrategy[] = [
  ...CommonStrategies,
  ...ApiStrategies,
];

/**
 * Get strategies by tier
 */
export function getTier1Strategies(): GenerationStrategy[] {
  // Tier 1: Node/TS, Python, Rust
  const tier1Ids = [
    'git', 'docker', 'ci', 'readme', // Common
    'express', 'fastify', 'nestjs', // Node/TS
    'fastapi', 'flask', 'django', // Python
    'axum', 'actix', 'clap', // Rust
  ];

  return AllStrategies.filter((s) => tier1Ids.includes(s.id));
}

/**
 * Get strategies by tier 2
 */
export function getTier2Strategies(): GenerationStrategy[] {
  // Tier 2: Go, C++
  const tier2Ids = ['gin', 'echo', 'cobra'];

  return [...getTier1Strategies(), ...AllStrategies.filter((s) => tier2Ids.includes(s.id))];
}
