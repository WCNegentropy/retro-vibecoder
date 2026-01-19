/**
 * Archetype Matrix
 *
 * Defines project archetypes and their compatible languages/frameworks.
 */

import type { Archetype, Language, Framework } from '../types.js';
import { WEB_FRAMEWORKS, BACKEND_FRAMEWORKS, CLI_FRAMEWORKS, DESKTOP_FRAMEWORKS, MOBILE_FRAMEWORKS } from './frameworks.js';

/**
 * Archetype definition with metadata
 */
export interface ArchetypeEntry {
  id: Archetype;
  name: string;
  description: string;
  compatibleLanguages: Language[];
  frameworks: readonly Framework[];
}

/**
 * All supported archetypes
 */
export const ARCHETYPES: readonly ArchetypeEntry[] = [
  {
    id: 'web',
    name: 'Web Application',
    description: 'Client-side web application (SPA, SSR, or static)',
    compatibleLanguages: ['typescript', 'javascript'],
    frameworks: WEB_FRAMEWORKS,
  },
  {
    id: 'backend',
    name: 'Backend API',
    description: 'Server-side API or service',
    compatibleLanguages: ['typescript', 'javascript', 'python', 'go', 'rust', 'java', 'kotlin', 'csharp', 'ruby', 'php'],
    frameworks: BACKEND_FRAMEWORKS,
  },
  {
    id: 'cli',
    name: 'CLI Tool',
    description: 'Command-line interface application',
    compatibleLanguages: ['typescript', 'javascript', 'python', 'go', 'rust'],
    frameworks: CLI_FRAMEWORKS,
  },
  {
    id: 'mobile',
    name: 'Mobile App',
    description: 'iOS, Android, or cross-platform mobile application',
    compatibleLanguages: ['typescript', 'kotlin', 'swift'],
    frameworks: MOBILE_FRAMEWORKS,
  },
  {
    id: 'desktop',
    name: 'Desktop App',
    description: 'Cross-platform desktop application',
    compatibleLanguages: ['typescript', 'rust', 'cpp'],
    frameworks: DESKTOP_FRAMEWORKS,
  },
  {
    id: 'library',
    name: 'Library/Package',
    description: 'Reusable library or package',
    compatibleLanguages: ['typescript', 'javascript', 'python', 'go', 'rust', 'java', 'kotlin', 'csharp', 'cpp', 'ruby', 'php'],
    frameworks: [],
  },
  {
    id: 'game',
    name: 'Game',
    description: 'Video game or interactive experience',
    compatibleLanguages: ['typescript', 'csharp', 'cpp', 'rust'],
    frameworks: [],
  },
] as const;

/**
 * Map of archetype IDs to their entries
 */
export const ARCHETYPE_MAP: ReadonlyMap<Archetype, ArchetypeEntry> = new Map(
  ARCHETYPES.map((arch) => [arch.id, arch])
);

/**
 * List of all archetype IDs
 */
export const ARCHETYPE_IDS: readonly Archetype[] = ARCHETYPES.map((a) => a.id);

/**
 * Get compatible languages for an archetype
 */
export function getLanguagesForArchetype(archetype: Archetype): Language[] {
  return ARCHETYPE_MAP.get(archetype)?.compatibleLanguages ?? [];
}

/**
 * Get frameworks for an archetype
 */
export function getFrameworksForArchetype(archetype: Archetype): readonly Framework[] {
  return ARCHETYPE_MAP.get(archetype)?.frameworks ?? [];
}

/**
 * Check if a language is compatible with an archetype
 */
export function isLanguageCompatible(archetype: Archetype, language: Language): boolean {
  const entry = ARCHETYPE_MAP.get(archetype);
  return entry ? entry.compatibleLanguages.includes(language) : false;
}

/**
 * Get the display name for an archetype
 */
export function getArchetypeName(archetype: Archetype): string {
  return ARCHETYPE_MAP.get(archetype)?.name ?? archetype;
}
