/**
 * Jinja2 Filter Definitions
 *
 * This module defines the Jinja2 filters that can be used in UPG manifests.
 * These filters are used for dynamic default values and template expressions.
 */

/**
 * Jinja2 filter function type
 */
export type Jinja2Filter = (value: unknown, ...args: unknown[]) => unknown;

/**
 * Built-in Jinja2 filters
 */
export const JINJA2_FILTERS: Record<string, Jinja2Filter> = {
  /**
   * Convert to uppercase
   */
  upper: (value: unknown) => String(value).toUpperCase(),

  /**
   * Convert to lowercase
   */
  lower: (value: unknown) => String(value).toLowerCase(),

  /**
   * Capitalize first letter
   */
  capitalize: (value: unknown) => {
    const str = String(value);
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  /**
   * Title case
   */
  title: (value: unknown) =>
    String(value)
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' '),

  /**
   * Replace characters
   */
  replace: (value: unknown, old: unknown, newVal: unknown) =>
    String(value).replaceAll(String(old), String(newVal)),

  /**
   * Convert to slug (kebab-case)
   */
  slug: (value: unknown) =>
    String(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, ''),

  /**
   * Convert to snake_case
   */
  snake: (value: unknown) =>
    String(value)
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, ''),

  /**
   * Convert to camelCase
   */
  camel: (value: unknown) =>
    String(value)
      .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
      .replace(/^./, c => c.toLowerCase()),

  /**
   * Convert to PascalCase
   */
  pascal: (value: unknown) =>
    String(value)
      .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
      .replace(/^./, c => c.toUpperCase()),

  /**
   * Trim whitespace
   */
  trim: (value: unknown) => String(value).trim(),

  /**
   * Get length
   */
  length: (value: unknown) => {
    if (Array.isArray(value)) return value.length;
    return String(value).length;
  },

  /**
   * Default value if empty/null/undefined
   */
  default: (value: unknown, defaultValue: unknown) =>
    value === null || value === undefined || value === '' ? defaultValue : value,

  /**
   * First item of array or first char of string
   */
  first: (value: unknown) => {
    if (Array.isArray(value)) return value[0];
    return String(value).charAt(0);
  },

  /**
   * Last item of array or last char of string
   */
  last: (value: unknown) => {
    if (Array.isArray(value)) return value[value.length - 1];
    const str = String(value);
    return str.charAt(str.length - 1);
  },

  /**
   * Join array with separator
   */
  join: (value: unknown, separator: unknown = ', ') => {
    if (!Array.isArray(value)) return String(value);
    return value.join(String(separator));
  },

  /**
   * Split string into array
   */
  split: (value: unknown, separator: unknown = ',') => String(value).split(String(separator)),

  /**
   * Truncate string
   */
  truncate: (value: unknown, length: unknown = 50, end: unknown = '...') => {
    const str = String(value);
    const len = Number(length);
    if (str.length <= len) return str;
    return str.slice(0, len - String(end).length) + String(end);
  },

  /**
   * Word wrap
   */
  wordwrap: (value: unknown, width: unknown = 79) => {
    const str = String(value);
    const w = Number(width);
    const words = str.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + ' ' + word).trim().length > w) {
        if (currentLine) lines.push(currentLine.trim());
        currentLine = word;
      } else {
        currentLine = currentLine ? currentLine + ' ' + word : word;
      }
    }
    if (currentLine) lines.push(currentLine.trim());

    return lines.join('\n');
  },

  /**
   * Convert to int
   */
  int: (value: unknown, defaultVal: unknown = 0) => {
    const parsed = parseInt(String(value), 10);
    return isNaN(parsed) ? Number(defaultVal) : parsed;
  },

  /**
   * Convert to float
   */
  float: (value: unknown, defaultVal: unknown = 0.0) => {
    const parsed = parseFloat(String(value));
    return isNaN(parsed) ? Number(defaultVal) : parsed;
  },

  /**
   * Convert to string
   */
  string: (value: unknown) => String(value),

  /**
   * Convert to boolean
   */
  bool: (value: unknown) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return ['true', 'yes', '1', 'on'].includes(value.toLowerCase());
    }
    return Boolean(value);
  },

  /**
   * Absolute value
   */
  abs: (value: unknown) => Math.abs(Number(value)),

  /**
   * Round number
   */
  round: (value: unknown, precision: unknown = 0) => {
    const factor = Math.pow(10, Number(precision));
    return Math.round(Number(value) * factor) / factor;
  },
};

/**
 * Simple Jinja2 expression evaluator
 *
 * This is a simplified implementation that handles common cases.
 * For full Jinja2 support, consider using a proper Jinja2 library.
 *
 * @param expression - Jinja2 expression (e.g., "{{ name | lower }}")
 * @param context - Variable context
 * @returns Evaluated result
 */
export function evaluateJinja2Expression(
  expression: string,
  context: Record<string, unknown>
): unknown {
  // Extract expression from {{ }}
  const match = expression.match(/\{\{\s*(.+?)\s*\}\}/);
  if (!match) {
    return expression; // Not a Jinja2 expression
  }

  const expr = match[1];

  // Split by pipe to get filters
  const parts = expr.split('|').map(p => p.trim());
  const varPart = parts[0];
  const filters = parts.slice(1);

  // Get initial value from context
  let value: unknown;

  // Handle env.VARNAME
  if (varPart.startsWith('env.')) {
    const envVar = varPart.slice(4);
    value = process.env[envVar] ?? '';
  } else if (varPart.includes('.')) {
    // Handle nested access like "metadata.name"
    const pathParts = varPart.split('.');
    value = context;
    for (const part of pathParts) {
      if (value && typeof value === 'object') {
        value = (value as Record<string, unknown>)[part];
      } else {
        value = undefined;
        break;
      }
    }
  } else {
    value = context[varPart];
  }

  // Apply filters
  for (const filterExpr of filters) {
    // Parse filter name and arguments
    const filterMatch = filterExpr.match(/^(\w+)(?:\((.+)\))?$/);
    if (!filterMatch) continue;

    const [, filterName, argsStr] = filterMatch;
    const filter = JINJA2_FILTERS[filterName];

    if (!filter) {
      console.warn(`Unknown Jinja2 filter: ${filterName}`);
      continue;
    }

    // Parse arguments
    const args: unknown[] = [];
    if (argsStr) {
      // Simple argument parsing (doesn't handle nested quotes)
      const argParts = argsStr.split(',').map(a => a.trim());
      for (const arg of argParts) {
        if (arg.startsWith('"') || arg.startsWith("'")) {
          args.push(arg.slice(1, -1));
        } else if (arg === 'true') {
          args.push(true);
        } else if (arg === 'false') {
          args.push(false);
        } else if (!isNaN(Number(arg))) {
          args.push(Number(arg));
        } else {
          // Variable reference
          args.push(context[arg]);
        }
      }
    }

    value = filter(value, ...args);
  }

  return value;
}
