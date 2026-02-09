#!/usr/bin/env node
/**
 * Build UPG CLI Sidecar Binary
 *
 * Creates a standalone native executable from the UPG CLI for Tauri sidecar use.
 *
 * Steps:
 * 1. Uses esbuild (devDependency) to bundle the CLI + all workspace deps into a single CJS file
 * 2. Uses @yao-pkg/pkg to compile that bundle + Node.js runtime into a standalone binary
 * 3. Places the binary at src-tauri/binaries/upg-<target>[.exe] for Tauri's externalBin
 *
 * Usage:
 *   node scripts/build-sidecar.mjs <rust-target-triple>
 *
 * Examples:
 *   node scripts/build-sidecar.mjs x86_64-pc-windows-msvc
 *   node scripts/build-sidecar.mjs aarch64-apple-darwin
 *   node scripts/build-sidecar.mjs x86_64-unknown-linux-gnu
 */

import * as esbuild from 'esbuild';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync, mkdirSync, unlinkSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Desktop package root (parent of scripts/)
const desktopRoot = join(__dirname, '..');
// Monorepo root (parent of packages/desktop/)
const monoRoot = join(desktopRoot, '..', '..');

const rustTarget = process.argv[2];
if (!rustTarget) {
  console.error('Usage: node scripts/build-sidecar.mjs <rust-target-triple>');
  console.error('Example: node scripts/build-sidecar.mjs x86_64-unknown-linux-gnu');
  process.exit(1);
}

// Map Rust target triples to @yao-pkg/pkg target format
const TARGET_MAP = {
  'x86_64-pc-windows-msvc': 'node18-win-x64',
  'aarch64-pc-windows-msvc': 'node18-win-arm64',
  'x86_64-apple-darwin': 'node18-macos-x64',
  'aarch64-apple-darwin': 'node18-macos-arm64',
  'x86_64-unknown-linux-gnu': 'node18-linux-x64',
  'aarch64-unknown-linux-gnu': 'node18-linux-arm64',
};

const pkgTarget = TARGET_MAP[rustTarget];
if (!pkgTarget) {
  console.error(`Unsupported target: ${rustTarget}`);
  console.error(`Supported targets: ${Object.keys(TARGET_MAP).join(', ')}`);
  process.exit(1);
}

const binariesDir = join(desktopRoot, 'src-tauri', 'binaries');
const tmpBundle = join(binariesDir, '_upg-bundle.cjs');
const outputBinary = join(binariesDir, `upg-${rustTarget}`);
const cliEntry = join(monoRoot, 'packages', 'cli', 'dist', 'bin', 'upg.js');

console.log(`Building UPG CLI sidecar for ${rustTarget}`);
console.log(`  pkg target: ${pkgTarget}`);
console.log(`  CLI entry:  ${cliEntry}`);
console.log(`  Output:     ${outputBinary}`);

// Ensure binaries directory exists
if (!existsSync(binariesDir)) {
  mkdirSync(binariesDir, { recursive: true });
}

// Verify CLI was built
if (!existsSync(cliEntry)) {
  console.error(`CLI not built. Run 'pnpm build' first. Expected: ${cliEntry}`);
  process.exit(1);
}

// Step 1: Bundle the CLI into a single self-contained CJS file
// tsup leaves workspace packages (@retro-vibecoder/*) as external imports,
// so we re-bundle everything into one file that pkg can compile.
console.log('\nStep 1: Bundling CLI with esbuild...');
try {
  const result = esbuild.buildSync({
    entryPoints: [cliEntry],
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'cjs',
    outfile: tmpBundle,
    // Don't bundle Node.js built-in modules (bare specifiers only, not node: prefixed)
    external: [
      'fs',
      'fs/promises',
      'path',
      'os',
      'url',
      'util',
      'stream',
      'events',
      'child_process',
      'crypto',
      'http',
      'https',
      'net',
      'tls',
      'zlib',
      'buffer',
      'string_decoder',
      'querystring',
      'assert',
      'constants',
      'module',
      'worker_threads',
      'perf_hooks',
      'tty',
      'readline',
    ],
    // Map node: prefixed imports to bare specifiers so they become require() in CJS
    alias: {
      'node:fs': 'fs',
      'node:fs/promises': 'fs/promises',
      'node:path': 'path',
      'node:os': 'os',
      'node:url': 'url',
      'node:util': 'util',
      'node:stream': 'stream',
      'node:events': 'events',
      'node:child_process': 'child_process',
      'node:crypto': 'crypto',
      'node:http': 'http',
      'node:https': 'https',
      'node:net': 'net',
      'node:tls': 'tls',
      'node:zlib': 'zlib',
      'node:buffer': 'buffer',
      'node:string_decoder': 'string_decoder',
      'node:querystring': 'querystring',
      'node:assert': 'assert',
      'node:constants': 'constants',
      'node:module': 'module',
      'node:worker_threads': 'worker_threads',
      'node:perf_hooks': 'perf_hooks',
      'node:tty': 'tty',
      'node:readline': 'readline',
    },
    // Ensure all workspace packages are bundled (not left external)
    mainFields: ['module', 'main'],
    resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json'],
    logLevel: 'warning',
  });

  if (result.errors.length > 0) {
    console.error('esbuild errors:', result.errors);
    process.exit(1);
  }
  console.log(`  Bundle created: ${tmpBundle}`);
} catch (error) {
  console.error('esbuild bundling failed:', error.message);
  process.exit(1);
}

// Step 2: Compile into a standalone native executable using pkg
// This embeds the Node.js runtime + our bundle into a single binary (~50MB)
console.log('\nStep 2: Compiling standalone binary with pkg...');
try {
  const pkgCmd = `pnpm dlx @yao-pkg/pkg@5.15.0 ${tmpBundle} --target ${pkgTarget} --output ${outputBinary}`;
  console.log(`  Running: ${pkgCmd}`);
  execSync(pkgCmd, {
    stdio: 'inherit',
    cwd: monoRoot,
    timeout: 300000, // 5 minute timeout
  });
} catch (error) {
  console.error('pkg compilation failed:', error.message);
  // Clean up temp file
  if (existsSync(tmpBundle)) unlinkSync(tmpBundle);
  process.exit(1);
}

// Clean up intermediate bundle
if (existsSync(tmpBundle)) {
  unlinkSync(tmpBundle);
}

// Verify output
const isWindows = rustTarget.includes('windows');
const expectedBinary = isWindows ? `${outputBinary}.exe` : outputBinary;

if (existsSync(expectedBinary)) {
  const { statSync } = await import('node:fs');
  const stats = statSync(expectedBinary);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);
  console.log(`\nSidecar binary created successfully!`);
  console.log(`  Path: ${expectedBinary}`);
  console.log(`  Size: ${sizeMB} MB`);
} else {
  console.error(`\nERROR: Expected binary not found at: ${expectedBinary}`);
  console.error('Contents of binaries directory:');
  const { readdirSync } = await import('node:fs');
  try {
    readdirSync(binariesDir).forEach(f => console.error(`  ${f}`));
  } catch {
    console.error('  (directory does not exist)');
  }
  process.exit(1);
}
