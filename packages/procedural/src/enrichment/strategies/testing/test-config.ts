/**
 * Test Configuration Enrichment Strategy
 *
 * Adds or enhances test framework configuration files.
 */

import type {
  EnrichmentStrategy,
  TechStack,
  EnrichmentFlags,
  EnrichmentContext,
} from '../../../types.js';

function generateVitestConfig(): string {
  return `import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.d.ts'],
    },
    testTimeout: 10000,
  },
});
`;
}

function generateJestConfig(): string {
  return `/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
};
`;
}

function generatePytestConfig(): string {
  return `# pytest configuration
[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
addopts = "-v --tb=short -q"
markers = [
    "slow: marks tests as slow (deselect with '-m "not slow"')",
    "integration: marks integration tests",
]
`;
}

export const TestConfigEnrichStrategy: EnrichmentStrategy = {
  id: 'enrich-test-config',
  name: 'Test Configuration',
  priority: 28, // Before test generation

  matches: (_stack: TechStack, flags: EnrichmentFlags) => flags.tests,

  apply: async (context: EnrichmentContext) => {
    const { files, stack, introspect } = context;

    switch (stack.testing) {
      case 'vitest':
        if (!introspect.hasFile('vitest.config.ts') && !introspect.hasFile('vitest.config.js')) {
          files['vitest.config.ts'] = generateVitestConfig();
        }
        break;
      case 'jest':
        if (!introspect.hasFile('jest.config.ts') && !introspect.hasFile('jest.config.js')) {
          files['jest.config.ts'] = generateJestConfig();
        }
        break;
      case 'pytest':
        if (!introspect.hasFile('pytest.ini') && !introspect.hasFile('pyproject.toml')) {
          files['pyproject.toml'] = generatePytestConfig();
        }
        break;
    }
  },
};
