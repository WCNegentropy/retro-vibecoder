/**
 * Language Matrix
 *
 * Defines all supported programming languages and their characteristics.
 * This is the "DNA" for language-specific generation.
 */

import type { Language, Runtime, LanguageEntry } from '../types.js';

/**
 * Complete language definitions with metadata
 */
export const LANGUAGES: readonly LanguageEntry[] = [
  {
    id: 'typescript',
    name: 'TypeScript',
    runtimes: ['node', 'deno', 'bun', 'browser'],
    packageManagers: ['npm', 'pnpm', 'yarn', 'bun'],
    fileExtensions: ['.ts', '.tsx', '.mts', '.cts'],
    configFiles: ['tsconfig.json', 'package.json'],
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    runtimes: ['node', 'deno', 'bun', 'browser'],
    packageManagers: ['npm', 'pnpm', 'yarn', 'bun'],
    fileExtensions: ['.js', '.jsx', '.mjs', '.cjs'],
    configFiles: ['package.json'],
  },
  {
    id: 'python',
    name: 'Python',
    runtimes: ['native'],
    packageManagers: ['pip', 'poetry', 'uv', 'pipenv'],
    fileExtensions: ['.py', '.pyi'],
    configFiles: ['pyproject.toml', 'requirements.txt', 'setup.py'],
  },
  {
    id: 'go',
    name: 'Go',
    runtimes: ['native'],
    packageManagers: ['go mod'],
    fileExtensions: ['.go'],
    configFiles: ['go.mod', 'go.sum'],
  },
  {
    id: 'rust',
    name: 'Rust',
    runtimes: ['native'],
    packageManagers: ['cargo'],
    fileExtensions: ['.rs'],
    configFiles: ['Cargo.toml', 'Cargo.lock'],
  },
  {
    id: 'java',
    name: 'Java',
    runtimes: ['jvm'],
    packageManagers: ['maven', 'gradle'],
    fileExtensions: ['.java'],
    configFiles: ['pom.xml', 'build.gradle', 'build.gradle.kts'],
  },
  {
    id: 'kotlin',
    name: 'Kotlin',
    runtimes: ['jvm', 'native'],
    packageManagers: ['gradle', 'maven'],
    fileExtensions: ['.kt', '.kts'],
    configFiles: ['build.gradle.kts', 'build.gradle'],
  },
  {
    id: 'csharp',
    name: 'C#',
    runtimes: ['dotnet'],
    packageManagers: ['nuget', 'dotnet'],
    fileExtensions: ['.cs'],
    configFiles: ['.csproj', '.sln'],
  },
  {
    id: 'cpp',
    name: 'C++',
    runtimes: ['native'],
    packageManagers: ['conan', 'vcpkg', 'cmake'],
    fileExtensions: ['.cpp', '.hpp', '.cc', '.h'],
    configFiles: ['CMakeLists.txt', 'conanfile.txt'],
  },
  {
    id: 'swift',
    name: 'Swift',
    runtimes: ['native'],
    packageManagers: ['swift package manager'],
    fileExtensions: ['.swift'],
    configFiles: ['Package.swift'],
  },
  {
    id: 'php',
    name: 'PHP',
    runtimes: ['native'],
    packageManagers: ['composer'],
    fileExtensions: ['.php'],
    configFiles: ['composer.json'],
  },
  {
    id: 'ruby',
    name: 'Ruby',
    runtimes: ['native'],
    packageManagers: ['bundler', 'gem'],
    fileExtensions: ['.rb'],
    configFiles: ['Gemfile', '.ruby-version'],
  },
] as const;

/**
 * Map of language IDs to their entries for quick lookup
 */
export const LANGUAGE_MAP: ReadonlyMap<Language, LanguageEntry> = new Map(
  LANGUAGES.map(lang => [lang.id, lang])
);

/**
 * List of all supported language IDs
 */
export const LANGUAGE_IDS: readonly Language[] = LANGUAGES.map(l => l.id);

/**
 * Languages that compile to native code
 */
export const NATIVE_LANGUAGES: readonly Language[] = ['go', 'rust', 'cpp', 'swift'];

/**
 * Languages that run on the JVM
 */
export const JVM_LANGUAGES: readonly Language[] = ['java', 'kotlin'];

/**
 * Languages with Node.js runtime support
 */
export const NODE_LANGUAGES: readonly Language[] = ['typescript', 'javascript'];

/**
 * All supported runtime IDs
 */
export const RUNTIME_IDS: readonly Runtime[] = ['node', 'deno', 'bun', 'jvm', 'dotnet', 'native', 'browser'];

/**
 * Get valid runtimes for a language
 */
export function getRuntimesForLanguage(language: Language): Runtime[] {
  return LANGUAGE_MAP.get(language)?.runtimes ?? [];
}

/**
 * Check if a language supports a specific runtime
 */
export function languageSupportsRuntime(language: Language, runtime: Runtime): boolean {
  const entry = LANGUAGE_MAP.get(language);
  return entry ? entry.runtimes.includes(runtime) : false;
}

/**
 * Get the primary file extension for a language
 */
export function getPrimaryExtension(language: Language): string {
  const entry = LANGUAGE_MAP.get(language);
  return entry ? entry.fileExtensions[0] : '.txt';
}

/**
 * Get the display name for a language
 */
export function getLanguageName(language: Language): string {
  return LANGUAGE_MAP.get(language)?.name ?? language;
}
