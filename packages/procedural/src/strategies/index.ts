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

// Systems strategies (C++)
export { CppStrategy } from './systems/cpp.js';

// Enterprise backend strategies (Java, C#)
export { JavaSpringStrategy } from './backend/java.js';
export { CSharpApiStrategy } from './backend/csharp.js';

// Mobile strategies
export { ExpoStrategy } from './mobile/react-native.js';

import { CommonStrategies } from './common/index.js';
import { ApiStrategies } from './api/index.js';
import { CppStrategy } from './systems/cpp.js';
import { JavaSpringStrategy } from './backend/java.js';
import { CSharpApiStrategy } from './backend/csharp.js';
import { ExpoStrategy } from './mobile/react-native.js';
import type { GenerationStrategy } from '../types.js';

/**
 * All built-in strategies combined
 */
export const AllStrategies: GenerationStrategy[] = [
  ...CommonStrategies,
  ...ApiStrategies,
  // Tier 2: Systems (C++)
  CppStrategy,
  // Tier 3: Enterprise (Java, C#)
  JavaSpringStrategy,
  CSharpApiStrategy,
  // Tier 4: Mobile
  ExpoStrategy,
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
  const tier2Ids = ['gin', 'echo', 'cobra', 'cpp-cmake'];

  return [...getTier1Strategies(), ...AllStrategies.filter((s) => tier2Ids.includes(s.id))];
}

/**
 * Get strategies by tier 3
 */
export function getTier3Strategies(): GenerationStrategy[] {
  // Tier 3: Enterprise (Java Spring, C# .NET)
  const tier3Ids = ['java-spring', 'csharp-dotnet'];

  return [...getTier2Strategies(), ...AllStrategies.filter((s) => tier3Ids.includes(s.id))];
}

/**
 * Get strategies by tier 4
 */
export function getTier4Strategies(): GenerationStrategy[] {
  // Tier 4: Mobile (Expo/React Native)
  const tier4Ids = ['mobile-expo'];

  return [...getTier3Strategies(), ...AllStrategies.filter((s) => tier4Ids.includes(s.id))];
}
