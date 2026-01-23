/**
 * Framework Matrix
 *
 * Defines all supported frameworks organized by archetype.
 * Each framework is tied to specific language(s) and build tools.
 */

import type {
  Archetype,
  Language,
  Framework,
  WebFramework,
  BackendFramework,
  CliFramework,
  DesktopFramework,
  MobileFramework,
  BuildTool,
  TestingFramework,
  FrameworkEntry,
} from '../types.js';

/**
 * Complete framework definitions
 */
export const FRAMEWORKS: readonly FrameworkEntry[] = [
  // Web Frameworks
  {
    id: 'react',
    name: 'React',
    language: 'typescript',
    archetype: 'web',
    defaultBuildTool: 'vite',
    defaultTesting: 'vitest',
  },
  {
    id: 'vue',
    name: 'Vue',
    language: 'typescript',
    archetype: 'web',
    defaultBuildTool: 'vite',
    defaultTesting: 'vitest',
  },
  {
    id: 'svelte',
    name: 'Svelte',
    language: 'typescript',
    archetype: 'web',
    defaultBuildTool: 'vite',
    defaultTesting: 'vitest',
  },
  {
    id: 'solid',
    name: 'SolidJS',
    language: 'typescript',
    archetype: 'web',
    defaultBuildTool: 'vite',
    defaultTesting: 'vitest',
  },
  {
    id: 'angular',
    name: 'Angular',
    language: 'typescript',
    archetype: 'web',
    defaultBuildTool: 'webpack',
    defaultTesting: 'jest',
  },
  {
    id: 'qwik',
    name: 'Qwik',
    language: 'typescript',
    archetype: 'web',
    defaultBuildTool: 'vite',
    defaultTesting: 'vitest',
  },
  {
    id: 'nextjs',
    name: 'Next.js',
    language: 'typescript',
    archetype: 'web',
    defaultBuildTool: 'webpack',
    defaultTesting: 'jest',
  },
  {
    id: 'nuxt',
    name: 'Nuxt',
    language: 'typescript',
    archetype: 'web',
    defaultBuildTool: 'vite',
    defaultTesting: 'vitest',
  },
  {
    id: 'sveltekit',
    name: 'SvelteKit',
    language: 'typescript',
    archetype: 'web',
    defaultBuildTool: 'vite',
    defaultTesting: 'vitest',
  },

  // Backend Frameworks - Node.js
  {
    id: 'express',
    name: 'Express',
    language: 'typescript',
    archetype: 'backend',
    defaultBuildTool: 'tsup',
    defaultTesting: 'vitest',
  },
  {
    id: 'fastify',
    name: 'Fastify',
    language: 'typescript',
    archetype: 'backend',
    defaultBuildTool: 'tsup',
    defaultTesting: 'vitest',
  },
  {
    id: 'nestjs',
    name: 'NestJS',
    language: 'typescript',
    archetype: 'backend',
    defaultBuildTool: 'webpack',
    defaultTesting: 'jest',
  },

  // Backend Frameworks - Python
  {
    id: 'fastapi',
    name: 'FastAPI',
    language: 'python',
    archetype: 'backend',
    defaultBuildTool: 'make',
    defaultTesting: 'pytest',
  },
  {
    id: 'flask',
    name: 'Flask',
    language: 'python',
    archetype: 'backend',
    defaultBuildTool: 'make',
    defaultTesting: 'pytest',
  },
  {
    id: 'django',
    name: 'Django',
    language: 'python',
    archetype: 'backend',
    defaultBuildTool: 'make',
    defaultTesting: 'pytest',
  },

  // Backend Frameworks - Go
  {
    id: 'gin',
    name: 'Gin',
    language: 'go',
    archetype: 'backend',
    defaultBuildTool: 'make',
    defaultTesting: 'go-test',
  },
  {
    id: 'echo',
    name: 'Echo',
    language: 'go',
    archetype: 'backend',
    defaultBuildTool: 'make',
    defaultTesting: 'go-test',
  },

  // Backend Frameworks - Rust
  {
    id: 'axum',
    name: 'Axum',
    language: 'rust',
    archetype: 'backend',
    defaultBuildTool: 'cargo',
    defaultTesting: 'rust-test',
  },
  {
    id: 'actix',
    name: 'Actix Web',
    language: 'rust',
    archetype: 'backend',
    defaultBuildTool: 'cargo',
    defaultTesting: 'rust-test',
  },

  // Backend Frameworks - JVM
  {
    id: 'spring-boot',
    name: 'Spring Boot',
    language: 'java',
    archetype: 'backend',
    defaultBuildTool: 'gradle',
    defaultTesting: 'junit',
  },

  // Backend Frameworks - .NET
  {
    id: 'aspnet-core',
    name: 'ASP.NET Core',
    language: 'csharp',
    archetype: 'backend',
    defaultBuildTool: 'msbuild',
    defaultTesting: 'xunit',
  },

  // Backend Frameworks - Ruby/PHP
  {
    id: 'rails',
    name: 'Ruby on Rails',
    language: 'ruby',
    archetype: 'backend',
    defaultBuildTool: 'make',
    defaultTesting: 'rspec',
  },
  {
    id: 'laravel',
    name: 'Laravel',
    language: 'php',
    archetype: 'backend',
    defaultBuildTool: 'make',
    defaultTesting: 'phpunit',
  },

  // CLI Frameworks
  {
    id: 'commander',
    name: 'Commander.js',
    language: 'typescript',
    archetype: 'cli',
    defaultBuildTool: 'tsup',
    defaultTesting: 'vitest',
  },
  {
    id: 'yargs',
    name: 'Yargs',
    language: 'typescript',
    archetype: 'cli',
    defaultBuildTool: 'tsup',
    defaultTesting: 'vitest',
  },
  {
    id: 'clap',
    name: 'Clap',
    language: 'rust',
    archetype: 'cli',
    defaultBuildTool: 'cargo',
    defaultTesting: 'rust-test',
  },
  {
    id: 'cobra',
    name: 'Cobra',
    language: 'go',
    archetype: 'cli',
    defaultBuildTool: 'make',
    defaultTesting: 'go-test',
  },
  {
    id: 'click',
    name: 'Click',
    language: 'python',
    archetype: 'cli',
    defaultBuildTool: 'make',
    defaultTesting: 'pytest',
  },
  {
    id: 'argparse',
    name: 'argparse',
    language: 'python',
    archetype: 'cli',
    defaultBuildTool: 'make',
    defaultTesting: 'pytest',
  },

  // Desktop Frameworks
  {
    id: 'tauri',
    name: 'Tauri',
    language: 'rust',
    archetype: 'desktop',
    defaultBuildTool: 'cargo',
    defaultTesting: 'rust-test',
  },
  {
    id: 'electron',
    name: 'Electron',
    language: 'typescript',
    archetype: 'desktop',
    defaultBuildTool: 'vite',
    defaultTesting: 'vitest',
  },

  // Mobile Frameworks
  {
    id: 'react-native',
    name: 'React Native',
    language: 'typescript',
    archetype: 'mobile',
    defaultBuildTool: 'webpack',
    defaultTesting: 'jest',
  },
  {
    id: 'flutter',
    name: 'Flutter',
    language: 'kotlin', // Dart not yet in our language list, using Kotlin as proxy
    archetype: 'mobile',
    defaultBuildTool: 'gradle',
    defaultTesting: 'junit',
  },
  {
    id: 'swiftui',
    name: 'SwiftUI',
    language: 'swift',
    archetype: 'mobile',
    defaultBuildTool: 'xcodebuild',
    defaultTesting: 'xctest',
  },
  {
    id: 'jetpack-compose',
    name: 'Jetpack Compose',
    language: 'kotlin',
    archetype: 'mobile',
    defaultBuildTool: 'gradle',
    defaultTesting: 'junit',
  },
] as const;

/**
 * Map of framework IDs to their entries
 */
export const FRAMEWORK_MAP: ReadonlyMap<Framework, FrameworkEntry> = new Map(
  FRAMEWORKS.map((fw) => [fw.id, fw])
);

/**
 * Get frameworks by archetype
 */
export function getFrameworksByArchetype(archetype: Archetype): FrameworkEntry[] {
  return FRAMEWORKS.filter((fw) => fw.archetype === archetype);
}

/**
 * Get frameworks by language
 */
export function getFrameworksByLanguage(language: Language): FrameworkEntry[] {
  return FRAMEWORKS.filter((fw) => fw.language === language);
}

/**
 * Get frameworks that match both archetype and language
 */
export function getCompatibleFrameworks(archetype: Archetype, language: Language): FrameworkEntry[] {
  return FRAMEWORKS.filter((fw) => fw.archetype === archetype && fw.language === language);
}

/**
 * Get the default build tool for a framework
 */
export function getDefaultBuildTool(framework: Framework): BuildTool {
  return FRAMEWORK_MAP.get(framework)?.defaultBuildTool ?? 'make';
}

/**
 * Get the default testing framework for a framework
 */
export function getDefaultTesting(framework: Framework): TestingFramework {
  return FRAMEWORK_MAP.get(framework)?.defaultTesting ?? 'vitest';
}

/**
 * Web framework IDs
 */
export const WEB_FRAMEWORKS: readonly WebFramework[] = [
  'react',
  'vue',
  'svelte',
  'solid',
  'angular',
  'qwik',
  'nextjs',
  'nuxt',
  'sveltekit',
];

/**
 * Backend framework IDs
 */
export const BACKEND_FRAMEWORKS: readonly BackendFramework[] = [
  'express',
  'fastify',
  'nestjs',
  'fastapi',
  'flask',
  'django',
  'gin',
  'echo',
  'axum',
  'actix',
  'spring-boot',
  'aspnet-core',
  'rails',
  'laravel',
];

/**
 * CLI framework IDs
 */
export const CLI_FRAMEWORKS: readonly CliFramework[] = [
  'commander',
  'yargs',
  'clap',
  'cobra',
  'click',
  'argparse',
];

/**
 * Desktop framework IDs
 */
export const DESKTOP_FRAMEWORKS: readonly DesktopFramework[] = [
  'tauri',
  'electron',
  'flutter',
  'qt',
];

/**
 * Mobile framework IDs
 */
export const MOBILE_FRAMEWORKS: readonly MobileFramework[] = [
  'react-native',
  'flutter',
  'swiftui',
  'jetpack-compose',
];
