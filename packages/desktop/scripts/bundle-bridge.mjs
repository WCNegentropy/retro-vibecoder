#!/usr/bin/env node
/**
 * Bundle the procedural-bridge script with all its dependencies
 *
 * This creates a self-contained version of procedural-bridge.mjs
 * that can be distributed with the Tauri app without requiring
 * the workspace packages to be installed.
 */

import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const srcPath = join(__dirname, 'procedural-bridge.mjs');
const outDir = join(__dirname, '..', 'dist-scripts');
const outPath = join(outDir, 'procedural-bridge.mjs');

// Ensure output directory exists
if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
}

console.log('Bundling procedural-bridge.mjs...');
console.log(`  Source: ${srcPath}`);
console.log(`  Output: ${outPath}`);

try {
  await esbuild.build({
    entryPoints: [srcPath],
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'esm',
    outfile: outPath,
    // Don't bundle Node.js built-ins
    external: ['node:*'],
    // Minify for smaller bundle size
    minify: false,
    // Keep names for better debugging
    keepNames: true,
    // Generate source maps for debugging
    sourcemap: false,
    // Banner with shebang for CLI execution
    banner: {
      js: '#!/usr/bin/env node\n',
    },
  });

  console.log('Bundle created successfully!');
  console.log(`  Size: Check ${outPath}`);
} catch (error) {
  console.error('Bundle failed:', error);
  process.exit(1);
}
