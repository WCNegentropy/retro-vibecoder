import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/engine/index.ts',
    'src/matrices/index.ts',
    'src/strategies/index.ts',
    'src/sweeper/index.ts',
    'src/renderer/index.ts',
  ],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  external: ['@retro-vibecoder/shared'],
});
