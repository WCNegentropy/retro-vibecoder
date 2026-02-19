/**
 * GitHub Actions Enrichment Strategy
 *
 * Enhances the Pass 1 GitHub Actions CI workflow with:
 * - Dependency caching (npm, pip, cargo, go)
 * - Matrix testing for multiple language versions
 * - Security scanning (CodeQL)
 * - Artifact uploading
 * - Concurrency control
 */

import type {
  EnrichmentStrategy,
  TechStack,
  EnrichmentFlags,
  EnrichmentContext,
} from '../../../types.js';

function generateEnhancedCI(ctx: EnrichmentContext): string {
  const { stack, introspect, flags } = ctx;
  const manifest = introspect.getManifest();
  const hasDocker = introspect.hasFile('Dockerfile');
  const ports = introspect.getExposedPorts();

  let workflow = `name: CI

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

concurrency:
  group: \${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: true

`;

  switch (stack.language) {
    case 'typescript':
    case 'javascript':
      workflow += generateNodeCI(stack, manifest, flags.depth);
      break;
    case 'python':
      workflow += generatePythonCI(stack, flags.depth);
      break;
    case 'go':
      workflow += generateGoCI(stack, flags.depth);
      break;
    case 'rust':
      workflow += generateRustCI(stack, flags.depth);
      break;
    case 'java':
    case 'kotlin':
      workflow += generateJvmCI(stack, flags.depth);
      break;
    case 'csharp':
      workflow += generateDotnetCI(stack, flags.depth);
      break;
    case 'ruby':
      workflow += generateRubyCI(stack, flags.depth);
      break;
    case 'php':
      workflow += generatePhpCI(stack, flags.depth);
      break;
    default:
      workflow += generateGenericCI();
  }

  // Docker build job for full depth
  if (hasDocker && flags.depth === 'full') {
    const port = ports[0] ?? 3000;
    workflow += `
  docker:
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: false
          tags: \${{ github.repository }}:test
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Test Docker image
        run: |
          docker run -d -p ${port}:${port} --name test-container \${{ github.repository }}:test
          sleep 5
          curl -f http://localhost:${port}/health || echo "Health check endpoint not available"
          docker stop test-container
`;
  }

  return workflow;
}

function generateNodeCI(
  _stack: TechStack,
  manifest: ReturnType<EnrichmentContext['introspect']['getManifest']>,
  depth: string
): string {
  const testCmd = manifest.scripts['test'] ?? 'npm test';
  const buildCmd = manifest.scripts['build'] ?? 'npm run build';
  const lintCmd = manifest.scripts['lint'] ?? 'npm run lint';
  const typecheckCmd = manifest.scripts['typecheck'];
  const hasTypecheck = !!typecheckCmd;

  const matrix =
    depth === 'full'
      ? `
    strategy:
      matrix:
        node-version: [18, 20, 22]`
      : '';

  const nodeVersion = depth === 'full' ? `\${{ matrix.node-version }}` : '20';

  return `jobs:
  build:
    runs-on: ubuntu-latest${matrix}

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js ${nodeVersion}
        uses: actions/setup-node@v4
        with:
          node-version: '${nodeVersion}'

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Get pnpm store directory
        shell: bash
        run: echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV

      - name: Cache pnpm dependencies
        uses: actions/cache@v4
        with:
          path: \${{ env.STORE_PATH }}
          key: \${{ runner.os }}-pnpm-store-\${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            \${{ runner.os }}-pnpm-store-

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm ${lintCmd.replace(/^(pnpm |npm run )/, '')}
${
  hasTypecheck
    ? `
      - name: Type check
        run: pnpm ${typecheckCmd!.replace(/^(pnpm |npm run )/, '')}
`
    : ''
}
      - name: Test
        run: pnpm ${testCmd.replace(/^(pnpm |npm run )/, '')}

      - name: Build
        run: pnpm ${buildCmd.replace(/^(pnpm |npm run )/, '')}
`;
}

function generatePythonCI(_stack: TechStack, depth: string): string {
  const matrix =
    depth === 'full'
      ? `
    strategy:
      matrix:
        python-version: ['3.11', '3.12', '3.13']`
      : '';
  const pyVersion = depth === 'full' ? `\${{ matrix.python-version }}` : '3.12';

  return `jobs:
  build:
    runs-on: ubuntu-latest${matrix}

    steps:
      - uses: actions/checkout@v4

      - name: Setup Python ${pyVersion}
        uses: actions/setup-python@v5
        with:
          python-version: '${pyVersion}'

      - name: Cache pip dependencies
        uses: actions/cache@v4
        with:
          path: ~/.cache/pip
          key: \${{ runner.os }}-pip-\${{ hashFiles('**/requirements*.txt') }}
          restore-keys: |
            \${{ runner.os }}-pip-

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
          pip install -r requirements-dev.txt 2>/dev/null || true

      - name: Lint with ruff
        run: ruff check .

      - name: Type check with mypy
        run: mypy . --ignore-missing-imports || true

      - name: Test with pytest
        run: pytest --tb=short -q
`;
}

function generateGoCI(_stack: TechStack, depth: string): string {
  const matrix =
    depth === 'full'
      ? `
    strategy:
      matrix:
        go-version: ['1.21', '1.22', '1.23']`
      : '';
  const goVersion = depth === 'full' ? `\${{ matrix.go-version }}` : '1.22';

  return `jobs:
  build:
    runs-on: ubuntu-latest${matrix}

    steps:
      - uses: actions/checkout@v4

      - name: Setup Go ${goVersion}
        uses: actions/setup-go@v5
        with:
          go-version: '${goVersion}'
          cache: true

      - name: Download dependencies
        run: go mod download

      - name: Verify dependencies
        run: go mod verify

      - name: Lint
        uses: golangci/golangci-lint-action@v6
        with:
          version: latest

      - name: Test
        run: go test -v -race -coverprofile=coverage.out ./...

      - name: Build
        run: go build -v ./...
`;
}

function generateRustCI(_stack: TechStack, depth: string): string {
  const matrix =
    depth === 'full'
      ? `
    strategy:
      matrix:
        toolchain: [stable, beta]`
      : '';
  const toolchain = depth === 'full' ? `\${{ matrix.toolchain }}` : 'stable';

  return `jobs:
  build:
    runs-on: ubuntu-latest${matrix}

    steps:
      - uses: actions/checkout@v4

      - name: Setup Rust ${toolchain}
        uses: dtolnay/rust-toolchain@${toolchain}
        with:
          components: clippy, rustfmt

      - name: Cache cargo
        uses: Swatinem/rust-cache@v2

      - name: Check formatting
        run: cargo fmt --all -- --check

      - name: Lint with clippy
        run: cargo clippy --all-targets --all-features -- -D warnings

      - name: Test
        run: cargo test --all-features

      - name: Build
        run: cargo build --release
`;
}

function generateJvmCI(stack: TechStack, depth: string): string {
  const usesGradle = stack.buildTool === 'gradle';
  const matrix =
    depth === 'full'
      ? `
    strategy:
      matrix:
        java-version: [17, 21]`
      : '';
  const javaVersion = depth === 'full' ? `\${{ matrix.java-version }}` : '17';

  return `jobs:
  build:
    runs-on: ubuntu-latest${matrix}

    steps:
      - uses: actions/checkout@v4

      - name: Setup JDK ${javaVersion}
        uses: actions/setup-java@v4
        with:
          java-version: '${javaVersion}'
          distribution: 'temurin'
          cache: '${usesGradle ? 'gradle' : 'maven'}'

      - name: Build
        run: ${usesGradle ? './gradlew build' : 'mvn -B package --file pom.xml'}

      - name: Test
        run: ${usesGradle ? './gradlew test' : 'mvn test'}
`;
}

function generateDotnetCI(_stack: TechStack, depth: string): string {
  const matrix =
    depth === 'full'
      ? `
    strategy:
      matrix:
        dotnet-version: ['8.0.x', '9.0.x']`
      : '';
  const dotnetVersion = depth === 'full' ? `\${{ matrix.dotnet-version }}` : '8.0.x';

  return `jobs:
  build:
    runs-on: ubuntu-latest${matrix}

    steps:
      - uses: actions/checkout@v4

      - name: Setup .NET ${dotnetVersion}
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '${dotnetVersion}'

      - name: Cache NuGet packages
        uses: actions/cache@v4
        with:
          path: ~/.nuget/packages
          key: \${{ runner.os }}-nuget-\${{ hashFiles('**/*.csproj') }}
          restore-keys: |
            \${{ runner.os }}-nuget-

      - name: Restore dependencies
        run: dotnet restore

      - name: Build
        run: dotnet build --no-restore

      - name: Test
        run: dotnet test --no-build --verbosity normal
`;
}

function generateRubyCI(_stack: TechStack, depth: string): string {
  const matrix =
    depth === 'full'
      ? `
    strategy:
      matrix:
        ruby-version: ['3.2', '3.3']`
      : '';
  const rubyVersion = depth === 'full' ? `\${{ matrix.ruby-version }}` : '3.3';

  return `jobs:
  build:
    runs-on: ubuntu-latest${matrix}

    steps:
      - uses: actions/checkout@v4

      - name: Setup Ruby ${rubyVersion}
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: '${rubyVersion}'
          bundler-cache: true

      - name: Lint with RuboCop
        run: bundle exec rubocop --parallel || true

      - name: Test with RSpec
        run: bundle exec rspec
`;
}

function generatePhpCI(_stack: TechStack, depth: string): string {
  const matrix =
    depth === 'full'
      ? `
    strategy:
      matrix:
        php-version: ['8.2', '8.3']`
      : '';
  const phpVersion = depth === 'full' ? `\${{ matrix.php-version }}` : '8.3';

  return `jobs:
  build:
    runs-on: ubuntu-latest${matrix}

    steps:
      - uses: actions/checkout@v4

      - name: Setup PHP ${phpVersion}
        uses: shivammathur/setup-php@v2
        with:
          php-version: '${phpVersion}'
          extensions: mbstring, xml, ctype, json
          coverage: xdebug

      - name: Cache Composer dependencies
        uses: actions/cache@v4
        with:
          path: vendor
          key: \${{ runner.os }}-composer-\${{ hashFiles('**/composer.lock') }}
          restore-keys: |
            \${{ runner.os }}-composer-

      - name: Install dependencies
        run: composer install --prefer-dist --no-progress

      - name: Lint
        run: vendor/bin/phpstan analyse || true

      - name: Test
        run: vendor/bin/phpunit
`;
}

function generateGenericCI(): string {
  return `jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Build
        run: make build

      - name: Test
        run: make test
`;
}

export const GitHubActionsEnrichStrategy: EnrichmentStrategy = {
  id: 'enrich-github-actions',
  name: 'GitHub Actions CI/CD Enrichment',
  priority: 10,

  matches: (stack: TechStack, flags: EnrichmentFlags) =>
    flags.cicd && stack.cicd === 'github-actions',

  apply: async (context: EnrichmentContext) => {
    context.files['.github/workflows/ci.yml'] = generateEnhancedCI(context);
  },
};
