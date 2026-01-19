/**
 * Universal Matrices
 *
 * The "DNA" of the Universal Procedural Generator.
 * These matrices define the complete possibility space of software development.
 */

// Language Matrix
export {
  LANGUAGES,
  LANGUAGE_MAP,
  LANGUAGE_IDS,
  NATIVE_LANGUAGES,
  JVM_LANGUAGES,
  NODE_LANGUAGES,
  getRuntimesForLanguage,
  languageSupportsRuntime,
  getPrimaryExtension,
  getLanguageName,
} from './languages.js';

// Framework Matrix
export {
  FRAMEWORKS,
  FRAMEWORK_MAP,
  WEB_FRAMEWORKS,
  BACKEND_FRAMEWORKS,
  CLI_FRAMEWORKS,
  DESKTOP_FRAMEWORKS,
  MOBILE_FRAMEWORKS,
  getFrameworksByArchetype,
  getFrameworksByLanguage,
  getCompatibleFrameworks,
  getDefaultBuildTool,
  getDefaultTesting,
} from './frameworks.js';

// Database Matrix
export {
  DATABASES,
  DATABASE_MAP,
  DATABASE_IDS,
  SQL_DATABASES,
  NOSQL_DATABASES,
  ORM_LANGUAGE_MAP,
  getCompatibleOrms,
  getOrmsForStack,
  isOrmCompatible,
  getDefaultPort,
  getDatabaseName,
  getDatabaseType,
} from './databases.js';

// Archetype Matrix
export {
  ARCHETYPES,
  ARCHETYPE_MAP,
  ARCHETYPE_IDS,
  getLanguagesForArchetype,
  getFrameworksForArchetype,
  isLanguageCompatible,
  getArchetypeName,
} from './archetypes.js';

export type { ArchetypeEntry } from './archetypes.js';
