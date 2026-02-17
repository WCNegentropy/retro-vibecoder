/**
 * Output formatting utilities
 */

import pc from 'picocolors';

/**
 * Format a general output message
 */
export function formatOutput(message: string): string {
  return message;
}

/**
 * Format an error message
 */
export function formatError(message: string): string {
  return pc.red(`Error: ${message}`);
}

/**
 * Format a success message
 */
export function formatSuccess(message: string): string {
  return pc.green(`✓ ${message}`);
}

/**
 * Format a warning message
 */
export function formatWarning(message: string): string {
  return pc.yellow(`⚠ ${message}`);
}

/**
 * Format an informational message
 */
export function formatInfo(message: string): string {
  return pc.blue(`ℹ ${message}`);
}

/**
 * Format a hint/suggestion message
 */
export function formatHint(message: string): string {
  return pc.dim(`→ ${message}`);
}

/**
 * Format a table
 */
export function formatTable(
  rows: string[][],
  options: { header?: boolean; padding?: number } = {}
): string {
  const { header = false, padding = 2 } = options;

  // Calculate column widths
  const colWidths: number[] = [];
  for (const row of rows) {
    for (let i = 0; i < row.length; i++) {
      colWidths[i] = Math.max(colWidths[i] || 0, row[i].length);
    }
  }

  // Format rows
  const lines: string[] = [];
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    const cells = row.map((cell, i) => cell.padEnd(colWidths[i] + padding));
    lines.push(cells.join(''));

    // Add separator after header
    if (header && rowIndex === 0) {
      const separator = colWidths.map(w => '-'.repeat(w + padding)).join('');
      lines.push(separator);
    }
  }

  return lines.join('\n');
}

/**
 * Format a list
 */
export function formatList(items: string[], bullet = '•'): string {
  return items.map(item => `  ${bullet} ${item}`).join('\n');
}

/**
 * Format a key-value pair
 */
export function formatKeyValue(key: string, value: string, keyWidth = 15): string {
  return `${pc.bold(key.padEnd(keyWidth))} ${value}`;
}

/**
 * Format JSON with syntax highlighting
 */
export function formatJson(data: unknown): string {
  const json = JSON.stringify(data, null, 2);

  // Simple syntax highlighting
  return json
    .replace(/"([^"]+)":/g, `${pc.cyan('"$1"')}:`)
    .replace(/: "([^"]+)"/g, `: ${pc.green('"$1"')}`)
    .replace(/: (true|false)/g, `: ${pc.yellow('$1')}`)
    .replace(/: (\d+)/g, `: ${pc.magenta('$1')}`);
}
