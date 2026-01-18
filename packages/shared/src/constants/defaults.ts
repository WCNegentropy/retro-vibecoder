/**
 * Default values for the UPG system
 */

import type { ApiVersion, Lifecycle, SidecarType } from '../types/index.js';

/**
 * Current API version
 */
export const CURRENT_API_VERSION: ApiVersion = 'upg/v1';

/**
 * Supported API versions
 */
export const SUPPORTED_API_VERSIONS: readonly ApiVersion[] = ['upg/v1'];

/**
 * Default lifecycle for new templates
 */
export const DEFAULT_LIFECYCLE: Lifecycle = 'experimental';

/**
 * Default sidecar type
 */
export const DEFAULT_SIDECAR: SidecarType = 'copier';

/**
 * Default manifest filename
 */
export const DEFAULT_MANIFEST_FILENAME = 'upg.yaml';

/**
 * Alternative manifest filenames
 */
export const MANIFEST_FILENAMES = ['upg.yaml', 'upg.yml', '.upg.yaml', '.upg.yml'] as const;

/**
 * Answers file name (stored in generated projects)
 */
export const ANSWERS_FILENAME = '.upg-answers.yaml';

/**
 * Config directory name
 */
export const CONFIG_DIR_NAME = '.upg';

/**
 * Cache directory name
 */
export const CACHE_DIR_NAME = 'cache';

/**
 * Registry cache subdirectory
 */
export const REGISTRY_CACHE_DIR = 'registries';

/**
 * Templates cache subdirectory
 */
export const TEMPLATES_CACHE_DIR = 'templates';

/**
 * Default config filename
 */
export const CONFIG_FILENAME = 'config.yaml';

/**
 * Default registry URL
 */
export const DEFAULT_REGISTRY_URL = 'https://github.com/retro-vibecoder/upg-registry';

/**
 * Default registry branch
 */
export const DEFAULT_REGISTRY_BRANCH = 'main';

/**
 * Maximum manifest file size (in bytes)
 */
export const MAX_MANIFEST_SIZE = 1024 * 1024; // 1MB

/**
 * Maximum template size (in bytes)
 */
export const MAX_TEMPLATE_SIZE = 100 * 1024 * 1024; // 100MB

/**
 * Validation timeout (in ms)
 */
export const VALIDATION_TIMEOUT = 30000; // 30 seconds

/**
 * Generation timeout (in ms)
 */
export const GENERATION_TIMEOUT = 600000; // 10 minutes

/**
 * Jinja2 template file extensions
 */
export const JINJA2_EXTENSIONS = ['.jinja', '.jinja2', '.j2'] as const;

/**
 * Binary file extensions (skip Jinja2 processing)
 */
export const BINARY_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.ico',
  '.svg',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.otf',
  '.mp3',
  '.mp4',
  '.webm',
  '.pdf',
  '.zip',
  '.tar',
  '.gz',
  '.7z',
] as const;
