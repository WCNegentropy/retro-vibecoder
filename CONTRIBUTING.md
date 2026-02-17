# Contributing to Retro Vibecoder UPG

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Code of Conduct

Be respectful, inclusive, and constructive in all interactions.

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Development Setup

```bash
# Clone the repository
git clone https://github.com/retro-vibecoder/retro-vibecoder-upg.git
cd retro-vibecoder-upg

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

## Code Standards

### TypeScript

- Target: ES2022
- Strict mode enabled
- Use discriminated unions for variant types
- Prefer immutability (`readonly` arrays, objects)
- Use type imports: `import type { Foo } from './foo'`

### File Naming

- TypeScript: `camelCase.ts` (files), `PascalCase` (components)
- Tests: `*.test.ts`
- Fixtures: Descriptive names in `__fixtures__/`

### Code Style

- Use Prettier for formatting
- Use ESLint for linting
- Maximum line length: 100 characters

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `test`: Adding/modifying tests
- `docs`: Documentation changes
- `chore`: Build, CI, dependencies

### Examples

```
feat(transpiler): add support for multiselect prompts

Multiselect prompts now correctly transpile to JSON Schema
with proper handling of dependencies and default values.

Closes #42
```

```
fix(validator): handle circular dependencies

Added detection for circular when clause references
to prevent infinite loops during validation.
```

## Pull Request Process

1. **Create a feature branch**

   ```bash
   git checkout -b feat/my-feature
   ```

2. **Make your changes**
   - Write tests for new functionality
   - Update documentation if needed
   - Ensure all tests pass

3. **Commit your changes**
   - Use conventional commit format
   - Keep commits focused and atomic

4. **Push and create PR**

   ```bash
   git push origin feat/my-feature
   ```

5. **PR Requirements**
   - Descriptive title and description
   - Link related issues
   - All CI checks must pass
   - At least one approval from maintainers

## Testing

### Running Tests

```bash
# All tests
pnpm test

# Unit tests only
pnpm test:unit

# With coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

### Writing Tests

- Place tests in `tests/` or alongside source in `*.test.ts`
- Use descriptive test names
- Test edge cases and error conditions
- Aim for 80%+ coverage on new code

## Documentation

- Update `docs/` for API/behavior changes
- Add JSDoc comments to exported functions
- Include usage examples where helpful

## Project Structure

```
packages/
├── shared/      # Shared types and utilities
├── core/        # Schema validation and transpiler
├── procedural/  # Universal Procedural Generation engine
├── cli/         # Command-line interface
└── desktop/     # Tauri desktop app

registry/        # Validated project registry
templates/       # Example templates
tests/           # Test suites and fixtures
docs/            # Documentation
scripts/         # Build and utility scripts
```

## Questions?

- Open an issue for bugs or feature requests
- Join discussions for general questions
- Check existing issues before creating new ones

Thank you for contributing!
