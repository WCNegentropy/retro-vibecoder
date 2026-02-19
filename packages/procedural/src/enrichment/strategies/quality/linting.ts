/**
 * Linting & Formatting Enrichment Strategy
 *
 * Adds or enhances linting/formatting configurations:
 * - ESLint + Prettier for JS/TS
 * - Ruff for Python
 * - clippy.toml for Rust
 * - golangci-lint for Go
 * - EditorConfig for all projects
 */

import type {
  EnrichmentStrategy,
  TechStack,
  EnrichmentFlags,
  EnrichmentContext,
} from '../../../types.js';

function generateEditorConfig(): string {
  return `# EditorConfig — consistent coding styles across editors
# https://editorconfig.org

root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false

[*.{py,rs,go,java,kt}]
indent_size = 4

[Makefile]
indent_style = tab
`;
}

function generatePrettierConfig(): string {
  return `{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
`;
}

function generatePrettierIgnore(): string {
  return `dist/
build/
node_modules/
coverage/
*.min.js
*.min.css
pnpm-lock.yaml
package-lock.json
`;
}

function generateEslintConfig(stack: TechStack): string {
  if (stack.language === 'typescript') {
    return `import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    ignores: ['dist/', 'node_modules/', 'coverage/'],
  }
);
`;
  }

  return `import eslint from '@eslint/js';

export default [
  eslint.configs.recommended,
  {
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    ignores: ['dist/', 'node_modules/', 'coverage/'],
  },
];
`;
}

function generateRuffConfig(): string {
  return `# Ruff configuration
# https://docs.astral.sh/ruff/

[tool.ruff]
target-version = "py312"
line-length = 100

[tool.ruff.lint]
select = [
  "E",    # pycodestyle errors
  "W",    # pycodestyle warnings
  "F",    # pyflakes
  "I",    # isort
  "B",    # flake8-bugbear
  "C4",   # flake8-comprehensions
  "UP",   # pyupgrade
  "SIM",  # flake8-simplify
]
ignore = ["E501"]

[tool.ruff.lint.isort]
known-first-party = ["src"]

[tool.ruff.format]
quote-style = "double"
indent-style = "space"
`;
}

function generateGolangciLintConfig(): string {
  return `# golangci-lint configuration
# https://golangci-lint.run/usage/configuration/

run:
  timeout: 5m

linters:
  enable:
    - errcheck
    - gosimple
    - govet
    - ineffassign
    - staticcheck
    - unused
    - gofmt
    - goimports
    - misspell
    - unconvert
    - gocritic

linters-settings:
  gocritic:
    enabled-tags:
      - diagnostic
      - style
      - performance

issues:
  exclude-use-default: false
  max-issues-per-linter: 0
  max-same-issues: 0
`;
}

function generateClippyConfig(): string {
  return `# Clippy configuration
# Deny common mistakes, warn on style issues

[workspace.lints.clippy]
all = "warn"
pedantic = "warn"
nursery = "warn"
unwrap_used = "deny"
expect_used = "warn"
`;
}

export const LintingEnrichStrategy: EnrichmentStrategy = {
  id: 'enrich-linting',
  name: 'Linting & Formatting Configuration',
  priority: 5,

  matches: (_stack: TechStack, flags: EnrichmentFlags) => flags.linting,

  apply: async (context: EnrichmentContext) => {
    const { files, stack, introspect } = context;

    // EditorConfig for all projects
    if (!introspect.hasFile('.editorconfig')) {
      files['.editorconfig'] = generateEditorConfig();
    }

    switch (stack.language) {
      case 'typescript':
      case 'javascript':
        if (
          !introspect.hasFile('.prettierrc') &&
          !introspect.hasFile('.prettierrc.json') &&
          !introspect.hasFile('prettier.config.js')
        ) {
          files['.prettierrc'] = generatePrettierConfig();
          files['.prettierignore'] = generatePrettierIgnore();
        }
        if (
          !introspect.hasFile('eslint.config.js') &&
          !introspect.hasFile('eslint.config.mjs') &&
          !introspect.hasFile('.eslintrc.json')
        ) {
          files['eslint.config.mjs'] = generateEslintConfig(stack);
        }
        break;

      case 'python':
        if (!introspect.hasFile('ruff.toml') && !introspect.hasFile('pyproject.toml')) {
          files['ruff.toml'] = generateRuffConfig();
        }
        break;

      case 'go':
        if (!introspect.hasFile('.golangci.yml') && !introspect.hasFile('.golangci.yaml')) {
          files['.golangci.yml'] = generateGolangciLintConfig();
        }
        break;

      case 'rust':
        // Clippy configuration via Cargo.toml workspace lints
        // We add a clippy.toml for additional settings
        if (!introspect.hasFile('clippy.toml')) {
          files['clippy.toml'] = generateClippyConfig();
        }
        break;
    }
  },
};
