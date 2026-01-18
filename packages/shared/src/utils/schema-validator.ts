/**
 * Basic schema validation utilities
 *
 * This module provides simple validation helpers.
 * Full AJV-based validation is in @retro-vibecoder/core.
 */

import type { ValidationError } from '../types/manifest.js';

/**
 * Validate that a value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Validate that a value is a valid semantic version
 */
export function isSemver(value: unknown): boolean {
  if (typeof value !== 'string') return false;

  const semverRegex =
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

  return semverRegex.test(value);
}

/**
 * Validate that a value is a valid URL
 */
export function isValidUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false;

  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate that a value is a valid regex pattern
 */
export function isValidRegex(value: unknown): boolean {
  if (typeof value !== 'string') return false;

  try {
    new RegExp(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate that a value matches a pattern
 */
export function matchesPattern(value: string, pattern: string): boolean {
  try {
    const regex = new RegExp(pattern);
    return regex.test(value);
  } catch {
    return false;
  }
}

/**
 * Validate that an array has unique values
 */
export function hasUniqueValues<T>(arr: T[]): boolean {
  return new Set(arr).size === arr.length;
}

/**
 * Create a validation error object
 */
export function createValidationError(
  code: string,
  message: string,
  path: string,
  line?: number,
  column?: number
): ValidationError {
  return {
    code,
    message,
    path,
    ...(line !== undefined && { line }),
    ...(column !== undefined && { column }),
  };
}

/**
 * Validate a kebab-case identifier
 */
export function isKebabCase(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value);
}

/**
 * Validate a snake_case identifier
 */
export function isSnakeCase(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return /^[a-z_][a-z0-9_]*$/.test(value);
}

/**
 * Validate an API version string
 */
export function isValidApiVersion(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return /^upg\/v[0-9]+$/.test(value);
}
