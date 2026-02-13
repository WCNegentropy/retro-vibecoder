/**
 * Seed parsing and validation utility
 *
 * Provides a shared seed parser for CLI commands that ensures seeds are
 * valid safe positive integers, rejecting overflows, floats, and
 * scientific notation that would otherwise silently produce wrong values.
 */

/**
 * Result of parsing a seed string
 */
export interface ParseSeedResult {
  /** Whether the seed is valid */
  valid: boolean;
  /** The parsed seed value (only set when valid) */
  seed?: number;
  /** Error message (only set when invalid) */
  error?: string;
}

/**
 * Parse and validate a seed string.
 *
 * Rejects:
 * - Non-numeric strings
 * - Negative numbers and zero
 * - Floating point numbers (e.g. "3.14")
 * - Numbers exceeding Number.MAX_SAFE_INTEGER
 * - Scientific notation (e.g. "1e10") — these silently collapse with parseInt
 * - Leading/trailing whitespace
 *
 * @param seedStr - The raw seed string from CLI input
 * @returns ParseSeedResult with either a valid seed or an error message
 */
export function parseSeed(seedStr: string): ParseSeedResult {
  // Reject empty or whitespace-only input
  const trimmed = seedStr.trim();
  if (trimmed === '' || trimmed !== seedStr) {
    return {
      valid: false,
      error: 'Seed must be a positive integer',
    };
  }

  // Reject strings containing decimal points (float detection)
  if (trimmed.includes('.')) {
    return {
      valid: false,
      error: `Seed must be an integer, got '${trimmed}'`,
    };
  }

  // Use Number() for full parsing (handles scientific notation correctly)
  const num = Number(trimmed);

  if (Number.isNaN(num)) {
    return {
      valid: false,
      error: 'Seed must be a positive integer',
    };
  }

  if (!Number.isInteger(num)) {
    return {
      valid: false,
      error: `Seed must be an integer, got '${trimmed}'`,
    };
  }

  if (num < 1) {
    return {
      valid: false,
      error: 'Seed must be a positive integer (>= 1)',
    };
  }

  if (!Number.isSafeInteger(num)) {
    return {
      valid: false,
      error: `Seed must be a safe integer (1 to ${Number.MAX_SAFE_INTEGER})`,
    };
  }

  return {
    valid: true,
    seed: num,
  };
}
