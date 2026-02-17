/**
 * @wcnegentropy/cli
 *
 * Command-line interface for the Universal Project Generator.
 *
 * For programmatic usage, import `createCli()` to get a configured Commander.js program:
 * ```typescript
 * import { createCli } from '@wcnegentropy/cli';
 * const program = createCli();
 * program.parse(['node', 'upg', 'seed', '42', '--json']);
 * ```
 */

export { createCli } from './bin/upg.js';
export * from './commands/index.js';
export * from './utils/index.js';
