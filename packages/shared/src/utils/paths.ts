/**
 * Path utilities
 */

import { basename, dirname, extname, join, normalize, relative, resolve } from 'path';

/**
 * Normalize a path and ensure it uses forward slashes
 */
export function normalizePath(path: string): string {
  return normalize(path).replace(/\\/g, '/');
}

/**
 * Resolve a path relative to a base directory
 */
export function resolvePath(base: string, ...paths: string[]): string {
  return normalizePath(resolve(base, ...paths));
}

/**
 * Get relative path from one directory to another
 */
export function relativePath(from: string, to: string): string {
  return normalizePath(relative(from, to));
}

/**
 * Join paths and normalize
 */
export function joinPaths(...paths: string[]): string {
  return normalizePath(join(...paths));
}

/**
 * Get the file extension (including dot)
 */
export function getExtension(path: string): string {
  return extname(path);
}

/**
 * Get the base name of a path
 */
export function getBasename(path: string, ext?: string): string {
  return basename(path, ext);
}

/**
 * Get the directory name of a path
 */
export function getDirname(path: string): string {
  return normalizePath(dirname(path));
}

/**
 * Check if a path is absolute
 */
export function isAbsolutePath(path: string): boolean {
  // Unix absolute path
  if (path.startsWith('/')) return true;
  // Windows absolute path (e.g., C:\)
  if (/^[a-zA-Z]:[\\/]/.test(path)) return true;
  return false;
}

/**
 * Ensure a path ends with a trailing slash
 */
export function ensureTrailingSlash(path: string): string {
  const normalized = normalizePath(path);
  return normalized.endsWith('/') ? normalized : `${normalized}/`;
}

/**
 * Remove trailing slash from a path
 */
export function removeTrailingSlash(path: string): string {
  const normalized = normalizePath(path);
  return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
}

/**
 * Check if a path matches a glob pattern (simple implementation)
 *
 * Supports:
 * - * matches any characters except /
 * - ** matches any characters including /
 * - ? matches any single character
 */
export function matchesGlob(path: string, pattern: string): boolean {
  // Escape special regex characters except *, **, and ?
  let regexPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '__DOUBLE_STAR__')
    .replace(/\*/g, '[^/]*')
    .replace(/__DOUBLE_STAR__/g, '.*')
    .replace(/\?/g, '.');

  regexPattern = `^${regexPattern}$`;

  try {
    const regex = new RegExp(regexPattern);
    return regex.test(normalizePath(path));
  } catch {
    return false;
  }
}

/**
 * Get all parent directories of a path
 */
export function getParentDirs(path: string): string[] {
  const normalized = normalizePath(path);
  const parts = normalized.split('/').filter(Boolean);
  const parents: string[] = [];

  for (let i = 1; i < parts.length; i++) {
    parents.push(parts.slice(0, i).join('/'));
  }

  return parents;
}
