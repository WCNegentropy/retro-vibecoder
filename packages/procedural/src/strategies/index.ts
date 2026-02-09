/**
 * Generation Strategies
 *
 * Pluggable strategies for generating different parts of projects.
 */

// Common strategies
export {
  CommonStrategies,
  GitStrategy,
  DockerStrategy,
  CIStrategy,
  ReadmeStrategy,
} from './common/index.js';

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

// Web frontend strategies
export {
  WebStrategies,
  ReactStrategy,
  VueStrategy,
  SvelteStrategy,
  SolidStrategy,
} from './web/index.js';

// Systems strategies (C++)
export { CppStrategy } from './systems/cpp.js';

// Enterprise backend strategies (Java, C#)
export { JavaSpringStrategy } from './backend/java.js';
export { CSharpApiStrategy } from './backend/csharp.js';

// Additional backend strategies (Ruby, PHP)
export { RailsStrategy } from './backend/ruby.js';
export { LaravelStrategy } from './backend/php.js';

// CLI strategies (TypeScript, Python)
export {
  CliStrategies,
  CommanderStrategy,
  YargsStrategy,
  ClickStrategy,
  ArgparseStrategy,
} from './cli/index.js';

// Mobile strategies
export { ExpoStrategy, SwiftUIStrategy } from './mobile/react-native.js';

import { CommonStrategies } from './common/index.js';
import { ApiStrategies } from './api/index.js';
import { WebStrategies } from './web/index.js';
import { CppStrategy } from './systems/cpp.js';
import { JavaSpringStrategy } from './backend/java.js';
import { CSharpApiStrategy } from './backend/csharp.js';
import { RailsStrategy } from './backend/ruby.js';
import { LaravelStrategy } from './backend/php.js';
import { CliStrategies } from './cli/index.js';
import { ExpoStrategy, SwiftUIStrategy } from './mobile/react-native.js';
import type { GenerationStrategy } from '../types.js';

/**
 * All built-in strategies combined
 */
export const AllStrategies: GenerationStrategy[] = [
  ...CommonStrategies,
  ...ApiStrategies,
  // Web frontend (React, Vue, Svelte, Solid)
  ...WebStrategies,
  // Tier 2: Systems (C++)
  CppStrategy,
  // Tier 3: Enterprise (Java, C#)
  JavaSpringStrategy,
  CSharpApiStrategy,
  // Backend: Ruby, PHP
  RailsStrategy,
  LaravelStrategy,
  // CLI: TypeScript (Commander, Yargs), Python (Click, Argparse)
  ...CliStrategies,
  // Tier 4: Mobile
  ExpoStrategy,
  SwiftUIStrategy,
];

/**
 * Get strategies by tier
 */
export function getTier1Strategies(): GenerationStrategy[] {
  // Tier 1: Node/TS, Python, Rust
  const tier1Ids = [
    'git',
    'docker',
    'ci',
    'readme', // Common
    'express',
    'fastify',
    'nestjs', // Node/TS
    'fastapi',
    'flask',
    'django', // Python
    'axum',
    'actix',
    'clap', // Rust
  ];

  return AllStrategies.filter(s => tier1Ids.includes(s.id));
}

/**
 * Get strategies by tier 2
 */
export function getTier2Strategies(): GenerationStrategy[] {
  // Tier 2: Go, C++
  const tier2Ids = ['gin', 'echo', 'cobra', 'cpp-cmake'];

  return [...getTier1Strategies(), ...AllStrategies.filter(s => tier2Ids.includes(s.id))];
}

/**
 * Get strategies by tier 3
 */
export function getTier3Strategies(): GenerationStrategy[] {
  // Tier 3: Enterprise (Java Spring, C# .NET)
  const tier3Ids = ['java-spring', 'csharp-dotnet'];

  return [...getTier2Strategies(), ...AllStrategies.filter(s => tier3Ids.includes(s.id))];
}

/**
 * Get strategies by tier 4
 */
export function getTier4Strategies(): GenerationStrategy[] {
  // Tier 4: Mobile (Expo/React Native)
  const tier4Ids = ['mobile-expo'];

  return [...getTier3Strategies(), ...AllStrategies.filter(s => tier4Ids.includes(s.id))];
}

/**
 * Get strategies by tier 5 (All strategies including Web)
 */
export function getTier5Strategies(): GenerationStrategy[] {
  // Tier 5: Web Frontend (React, Vue, Svelte, Solid)
  const tier5Ids = ['web-react', 'web-vue', 'web-svelte', 'web-solid'];

  return [...getTier4Strategies(), ...AllStrategies.filter(s => tier5Ids.includes(s.id))];
}

/**
 * Get web strategies only
 */
export function getWebStrategies(): GenerationStrategy[] {
  const webIds = ['web-react', 'web-vue', 'web-svelte', 'web-solid'];
  return AllStrategies.filter(s => webIds.includes(s.id));
}
