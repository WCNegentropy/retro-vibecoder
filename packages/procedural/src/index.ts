/**
 * @retro-vibecoder/procedural
 *
 * Universal Procedural Generation engine for composing software projects from capabilities.
 *
 * Instead of writing language-specific generators (ReactGenerator, RustGenerator),
 * this package implements a Project Assembler that composes projects from Capabilities
 * using the Universal Matrix - the comprehensive possibility space of modern software.
 *
 * @example
 * ```typescript
 * import { ProjectAssembler, AllStrategies } from '@retro-vibecoder/procedural';
 *
 * // Create assembler with a seed
 * const assembler = new ProjectAssembler(42);
 *
 * // Register strategies
 * assembler.registerStrategies(AllStrategies);
 *
 * // Generate a project
 * const project = await assembler.generate();
 *
 * // project.files contains all generated files
 * // project.stack describes the resolved tech stack
 * ```
 */

// Types
export * from './types.js';

// Engine
export {
  SeededRNG,
  RNGFactory,
  ProjectAssembler,
  createAssembler,
  generateProject,
  validateStack,
  checkIncompatibilities,
  checkRequirements,
  getValidOptions,
  getValidLanguagesForArchetype,
  getValidFrameworks,
  getValidRuntimes,
  getValidOrms,
  getValidDatabases,
  applyDefaults,
  validateConstraints,
  getSuggestedFrameworks,
  formatValidationError,
  INCOMPATIBILITY_RULES,
  REQUIREMENT_RULES,
  DEFAULT_PAIRINGS,
  type AssemblerOptions,
  type WeightedItem,
  type ConstraintValidation,
  type ConstraintValidationResult,
} from './engine/index.js';

// Matrices
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
  ARCHETYPES,
  ARCHETYPE_MAP,
  ARCHETYPE_IDS,
  getLanguagesForArchetype,
  getFrameworksForArchetype,
  isLanguageCompatible,
  getArchetypeName,
  type ArchetypeEntry,
} from './matrices/index.js';

// Strategies
export {
  AllStrategies,
  CommonStrategies,
  ApiStrategies,
  getTier1Strategies,
  getTier2Strategies,
  GitStrategy,
  DockerStrategy,
  CIStrategy,
  ReadmeStrategy,
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
  RailsStrategy,
  LaravelStrategy,
  CliStrategies,
  CommanderStrategy,
  YargsStrategy,
  ClickStrategy,
  ArgparseStrategy,
  JetpackComposeStrategy,
  DesktopStrategies,
  ElectronStrategy,
  TauriStrategy,
  QtStrategy,
  FlutterStrategy,
} from './strategies/index.js';

// Renderer
export {
  renderTemplateSet,
  getTemplateSetId,
  hasTemplateSet,
  type TemplateContext,
} from './renderer/index.js';

// Sweeper
export {
  Sweeper,
  detectBuildSteps,
  runUniversalSweep,
  type SweeperOptions,
} from './sweeper/index.js';
