/**
 * CI/CD Strategy
 *
 * Generates CI/CD configuration based on stack.
 */

import type { GenerationStrategy, TechStack } from '../../types.js';

/**
 * Generate GitHub Actions workflow based on stack
 */
function generateGitHubActions(stack: TechStack): string {
  const steps: string[] = [];

  // Common header
  const header = `name: CI

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
`;

  // Language-specific setup and build steps
  switch (stack.language) {
    case 'typescript':
    case 'javascript':
      steps.push(`
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Type check
        run: pnpm typecheck

      - name: Test
        run: pnpm test

      - name: Build
        run: pnpm build`);
      break;

    case 'python':
      steps.push(`
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
          pip install -r requirements-dev.txt

      - name: Lint with ruff
        run: ruff check .

      - name: Type check with mypy
        run: mypy .

      - name: Test with pytest
        run: pytest`);
      break;

    case 'go':
      steps.push(`
      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: '1.22'

      - name: Download dependencies
        run: go mod download

      - name: Lint
        uses: golangci/golangci-lint-action@v4

      - name: Test
        run: go test -v ./...

      - name: Build
        run: go build -v ./...`);
      break;

    case 'rust':
      steps.push(`
      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable
        with:
          components: clippy, rustfmt

      - name: Cache cargo
        uses: Swatinem/rust-cache@v2

      - name: Check formatting
        run: cargo fmt --check

      - name: Lint with clippy
        run: cargo clippy -- -D warnings

      - name: Test
        run: cargo test

      - name: Build
        run: cargo build --release`);
      break;

    case 'java':
    case 'kotlin':
      if (stack.buildTool === 'gradle') {
        steps.push(`
      - name: Setup JDK
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Setup Gradle
        uses: gradle/gradle-build-action@v2

      - name: Build with Gradle
        run: ./gradlew build

      - name: Test with Gradle
        run: ./gradlew test`);
      } else {
        steps.push(`
      - name: Setup JDK
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Build with Maven
        run: mvn -B package --file pom.xml

      - name: Test with Maven
        run: mvn test`);
      }
      break;

    case 'csharp':
      steps.push(`
      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0.x'

      - name: Restore dependencies
        run: dotnet restore

      - name: Build
        run: dotnet build --no-restore

      - name: Test
        run: dotnet test --no-build --verbosity normal`);
      break;

    default:
      steps.push(`
      - name: Build
        run: make build

      - name: Test
        run: make test`);
  }

  return header + steps.join('');
}

/**
 * Generate GitLab CI configuration
 */
function generateGitLabCI(stack: TechStack): string {
  const image = getDockerImage(stack);

  let script = '';
  switch (stack.language) {
    case 'typescript':
    case 'javascript':
      script = `
  script:
    - npm ci
    - npm run lint
    - npm run test
    - npm run build`;
      break;

    case 'python':
      script = `
  script:
    - pip install -r requirements.txt
    - ruff check .
    - pytest`;
      break;

    case 'go':
      script = `
  script:
    - go mod download
    - go test -v ./...
    - go build -v ./...`;
      break;

    case 'rust':
      script = `
  script:
    - cargo fmt --check
    - cargo clippy -- -D warnings
    - cargo test
    - cargo build --release`;
      break;

    default:
      script = `
  script:
    - make build
    - make test`;
  }

  return `image: ${image}

stages:
  - build
  - test

build:
  stage: build${script}

test:
  stage: test${script}
`;
}

/**
 * Get appropriate Docker image for CI
 */
function getDockerImage(stack: TechStack): string {
  switch (stack.language) {
    case 'typescript':
    case 'javascript':
      return 'node:20';
    case 'python':
      return 'python:3.12';
    case 'go':
      return 'golang:1.22';
    case 'rust':
      return 'rust:1.75';
    case 'java':
    case 'kotlin':
      return 'openjdk:17';
    case 'csharp':
      return 'mcr.microsoft.com/dotnet/sdk:8.0';
    default:
      return 'ubuntu:22.04';
  }
}

/**
 * CI/CD strategy - generates CI configuration files
 */
export const CIStrategy: GenerationStrategy = {
  id: 'ci',
  name: 'CI/CD Configuration',
  priority: 95, // Run very late

  matches: (stack) => stack.cicd !== 'none',

  apply: async ({ stack, files }) => {
    switch (stack.cicd) {
      case 'github-actions':
        files['.github/workflows/ci.yml'] = generateGitHubActions(stack);
        break;

      case 'gitlab-ci':
        files['.gitlab-ci.yml'] = generateGitLabCI(stack);
        break;

      case 'circleci':
        files['.circleci/config.yml'] = `version: 2.1

jobs:
  build:
    docker:
      - image: ${getDockerImage(stack)}
    steps:
      - checkout
      - run: make build
      - run: make test

workflows:
  main:
    jobs:
      - build
`;
        break;
    }
  },
};
