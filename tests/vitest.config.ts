import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['packages/*/src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.d.ts'],
    },
  },
  resolve: {
    alias: {
      '@retro-vibecoder/shared': resolve(__dirname, '../packages/shared/src'),
      '@retro-vibecoder/core': resolve(__dirname, '../packages/core/src'),
      '@retro-vibecoder/cli': resolve(__dirname, '../packages/cli/src'),
    },
  },
});
