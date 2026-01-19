/**
 * API/Backend Strategies
 *
 * Strategies for generating backend API projects.
 */

// TypeScript/Node.js
export { ExpressStrategy, FastifyStrategy, NestJSStrategy } from './typescript.js';

// Python
export { FastAPIStrategy, FlaskStrategy, DjangoStrategy } from './python.js';

// Rust
export { AxumStrategy, ActixStrategy, ClapStrategy } from './rust.js';

// Go
export { GinStrategy, EchoStrategy, CobraStrategy } from './go.js';

import { ExpressStrategy, FastifyStrategy, NestJSStrategy } from './typescript.js';
import { FastAPIStrategy, FlaskStrategy, DjangoStrategy } from './python.js';
import { AxumStrategy, ActixStrategy, ClapStrategy } from './rust.js';
import { GinStrategy, EchoStrategy, CobraStrategy } from './go.js';
import type { GenerationStrategy } from '../../types.js';

/**
 * All API/Backend strategies
 */
export const ApiStrategies: GenerationStrategy[] = [
  // TypeScript/Node.js
  ExpressStrategy,
  FastifyStrategy,
  NestJSStrategy,

  // Python
  FastAPIStrategy,
  FlaskStrategy,
  DjangoStrategy,

  // Rust
  AxumStrategy,
  ActixStrategy,
  ClapStrategy,

  // Go
  GinStrategy,
  EchoStrategy,
  CobraStrategy,
];
