#!/usr/bin/env node
/**
 * Bundle the UPG CLI into a single self-contained JS file.
 *
 * Uses esbuild (already a devDependency) to resolve all workspace package
 * imports and produce one file that can be run with `node upg-cli-bundle.mjs`.
 *
 * The Tauri Rust backend calls this bundle via std::process::Command
 * in production mode: node <resource_dir>/upg-cli-bundle.mjs <args...>
 */

import * as esbuild from 'esbuild';
import { builtinModules } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const monoRoot = join(__dirname, '..', '..', '..');
const cliEntry = join(monoRoot, 'packages', 'cli', 'dist', 'bin', 'upg.js');
const outFile = join(__dirname, '..', 'src-tauri', 'upg-cli-bundle.mjs');

if (!existsSync(cliEntry)) {
  console.error(`CLI not built. Run 'pnpm build' first. Expected: ${cliEntry}`);
  process.exit(1);
}

console.log('Bundling UPG CLI...');

const result = esbuild.buildSync({
  entryPoints: [cliEntry],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outfile: outFile,
  // Provide require() for CJS deps (commander, etc.) that use require('events') etc.
  // ESM doesn't have require() natively, so we inject createRequire from node:module.
  banner: {
    js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);',
  },
  // Externalize all Node.js built-in modules (both bare 'events' and prefixed 'node:events')
  external: [...builtinModules, ...builtinModules.map((m) => `node:${m}`)],
  logLevel: 'warning',
});

if (result.errors.length > 0) {
  console.error('Bundle failed:', result.errors);
  process.exit(1);
}

console.log(`CLI bundle created: ${outFile}`);
