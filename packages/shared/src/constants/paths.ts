/**
 * Path-related constants and utilities
 */

import { join } from 'path';
import { homedir } from 'os';
import { CONFIG_DIR_NAME, CACHE_DIR_NAME, CONFIG_FILENAME } from './defaults.js';

/**
 * Get the UPG home directory (~/.upg)
 */
export function getUpgHome(): string {
  return process.env.UPG_HOME || join(homedir(), CONFIG_DIR_NAME);
}

/**
 * Get the UPG cache directory (~/.upg/cache)
 */
export function getCacheDir(): string {
  return process.env.UPG_CACHE_DIR || join(getUpgHome(), CACHE_DIR_NAME);
}

/**
 * Get the UPG config file path (~/.upg/config.yaml)
 */
export function getConfigPath(): string {
  return process.env.UPG_CONFIG || join(getUpgHome(), CONFIG_FILENAME);
}

/**
 * Get the registry cache directory
 */
export function getRegistryCacheDir(): string {
  return join(getCacheDir(), 'registries');
}

/**
 * Get the templates cache directory
 */
export function getTemplatesCacheDir(): string {
  return join(getCacheDir(), 'templates');
}

/**
 * Reserved directory names that cannot be used as project names
 */
export const RESERVED_NAMES = [
  'node_modules',
  '.git',
  '.upg',
  'dist',
  'build',
  'coverage',
  'tmp',
  'temp',
] as const;

/**
 * Check if a name is reserved
 */
export function isReservedName(name: string): boolean {
  return RESERVED_NAMES.includes(name as (typeof RESERVED_NAMES)[number]);
}
