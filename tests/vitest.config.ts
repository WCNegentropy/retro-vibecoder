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
      '@wcnegentropy/shared': resolve(__dirname, '../packages/shared/src'),
      '@wcnegentropy/core': resolve(__dirname, '../packages/core/src'),
      '@wcnegentropy/cli': resolve(__dirname, '../packages/cli/src'),
      '@wcnegentropy/procedural': resolve(__dirname, '../packages/procedural/src'),
    },
  },
});
