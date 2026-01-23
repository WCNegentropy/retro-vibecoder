/**
 * YAML parsing utilities
 */

import { parse, stringify, type DocumentOptions, type SchemaOptions } from 'yaml';

/**
 * Options for YAML parsing
 */
export interface YamlParseOptions {
  /** Whether to merge anchors */
  merge?: boolean;
  /** Whether to allow duplicate keys */
  uniqueKeys?: boolean;
  /** Maximum depth for nested structures */
  maxDepth?: number;
}

/**
 * Default parse options
 */
const DEFAULT_PARSE_OPTIONS: YamlParseOptions = {
  merge: true,
  uniqueKeys: true,
  maxDepth: 100,
};

/**
 * Parse a YAML string into an object
 *
 * @param content - YAML string content
 * @param options - Parse options
 * @returns Parsed object
 * @throws Error if YAML is invalid
 */
export function parseYaml<T = unknown>(content: string, options: YamlParseOptions = {}): T {
  const opts = { ...DEFAULT_PARSE_OPTIONS, ...options };

  try {
    const result = parse(content, {
      merge: opts.merge,
      uniqueKeys: opts.uniqueKeys,
      maxAliasCount: opts.maxDepth,
    } as DocumentOptions & SchemaOptions);

    return result as T;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`YAML parse error: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Stringify an object to YAML
 *
 * @param data - Object to stringify
 * @param options - Stringify options
 * @returns YAML string
 */
export function stringifyYaml(
  data: unknown,
  options: { indent?: number; lineWidth?: number } = {}
): string {
  return stringify(data, {
    indent: options.indent ?? 2,
    lineWidth: options.lineWidth ?? 120,
  });
}

/**
 * Check if a string is valid YAML
 *
 * @param content - String to check
 * @returns True if valid YAML
 */
export function isValidYaml(content: string): boolean {
  try {
    parse(content);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get line number for a path in YAML
 *
 * This is a simplified implementation that approximates line numbers.
 * For accurate line numbers, consider using a proper YAML CST parser.
 *
 * @param content - YAML content
 * @param path - Path to find (e.g., "metadata.name")
 * @returns Line number (1-indexed) or undefined
 */
export function getLineForPath(content: string, path: string): number | undefined {
  const parts = path.split('.');
  const lines = content.split('\n');

  let currentIndent = 0;
  let depth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    // Calculate indent level
    const indent = line.length - line.trimStart().length;

    // If we're at a lower indent, we've gone up in the hierarchy
    if (indent < currentIndent) {
      depth = Math.max(0, depth - 1);
    }

    // Check if this line matches the current path part
    const expectedKey = parts[depth];
    if (trimmed.startsWith(`${expectedKey}:`)) {
      if (depth === parts.length - 1) {
        return i + 1; // 1-indexed
      }
      depth++;
      currentIndent = indent;
    }
  }

  return undefined;
}
