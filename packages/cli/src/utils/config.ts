/**
 * CLI configuration utilities
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import { getConfigPath, parseYaml, stringifyYaml } from '@retro-vibecoder/shared';

/**
 * CLI configuration structure
 */
export interface CliConfig {
  /** Registry sources */
  registries?: RegistryConfig[];
  /** Default generation options */
  defaults?: {
    /** Default output directory */
    outputDir?: string;
    /** Whether to use defaults */
    useDefaults?: boolean;
  };
  /** Sidecar configuration */
  sidecars?: {
    /** Preferred sidecar */
    default?: 'nunjucks' | 'custom';
  };
}

/**
 * Registry configuration
 */
interface RegistryConfig {
  /** Registry name */
  name: string;
  /** Git URL */
  url: string;
  /** Branch */
  branch?: string;
  /** Priority (lower = higher priority) */
  priority?: number;
  /** Whether enabled */
  enabled?: boolean;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: CliConfig = {
  registries: [
    {
      name: 'official',
      url: 'https://github.com/retro-vibecoder/upg-registry',
      branch: 'main',
      priority: 0,
      enabled: true,
    },
  ],
  defaults: {
    useDefaults: false,
  },
  sidecars: {
    default: 'nunjucks',
  },
};

/**
 * Load CLI configuration
 */
export async function loadConfig(): Promise<CliConfig> {
  try {
    const configPath = getConfigPath();
    const content = await readFile(configPath, 'utf-8');
    const userConfig = parseYaml<CliConfig>(content);
    return { ...DEFAULT_CONFIG, ...userConfig };
  } catch (error) {
    // Return default config if file doesn't exist
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return DEFAULT_CONFIG;
    }
    throw error;
  }
}

/**
 * Save CLI configuration
 */
export async function saveConfig(config: CliConfig): Promise<void> {
  const configPath = getConfigPath();

  // Ensure directory exists
  const configDir = dirname(configPath);
  await mkdir(configDir, { recursive: true });

  // Write config
  const content = stringifyYaml(config);
  await writeFile(configPath, content);
}

/**
 * Get a specific config value
 */
export async function getConfigValue<K extends keyof CliConfig>(
  key: K
): Promise<CliConfig[K] | undefined> {
  const config = await loadConfig();
  return config[key];
}

/**
 * Set a specific config value
 */
export async function setConfigValue<K extends keyof CliConfig>(
  key: K,
  value: CliConfig[K]
): Promise<void> {
  const config = await loadConfig();
  config[key] = value;
  await saveConfig(config);
}
