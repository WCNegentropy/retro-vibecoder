/**
 * Release Automation Strategy
 *
 * Adds release workflows for:
 * - Semantic versioning via GitHub Releases
 * - Automated changelog generation
 * - npm/crate/PyPI publishing (language-aware)
 * - Docker image publishing
 */

import type { EnrichmentStrategy, TechStack, EnrichmentFlags, EnrichmentContext } from '../../../types.js';

function generateReleaseWorkflow(ctx: EnrichmentContext): string {
  const { stack, introspect } = ctx;
  const hasDocker = introspect.hasFile('Dockerfile');

  let publishSteps = '';

  switch (stack.language) {
    case 'typescript':
    case 'javascript':
      publishSteps = `
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build

      # Uncomment to enable npm publishing:
      # - name: Publish to npm
      #   run: pnpm publish --no-git-checks
      #   env:
      #     NODE_AUTH_TOKEN: \${{ secrets.NPM_TOKEN }}`;
      break;

    case 'rust':
      publishSteps = `
      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Cache cargo
        uses: Swatinem/rust-cache@v2

      - name: Build release
        run: cargo build --release

      # Uncomment to enable crate publishing:
      # - name: Publish to crates.io
      #   run: cargo publish
      #   env:
      #     CARGO_REGISTRY_TOKEN: \${{ secrets.CARGO_TOKEN }}`;
      break;

    case 'python':
      publishSteps = `
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install build tools
        run: pip install build twine

      - name: Build package
        run: python -m build

      # Uncomment to enable PyPI publishing:
      # - name: Publish to PyPI
      #   run: twine upload dist/*
      #   env:
      #     TWINE_USERNAME: __token__
      #     TWINE_PASSWORD: \${{ secrets.PYPI_TOKEN }}`;
      break;

    case 'go':
      publishSteps = `
      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: '1.22'

      - name: Build release binaries
        run: |
          GOOS=linux GOARCH=amd64 go build -o dist/app-linux-amd64 ./...
          GOOS=darwin GOARCH=amd64 go build -o dist/app-darwin-amd64 ./...
          GOOS=windows GOARCH=amd64 go build -o dist/app-windows-amd64.exe ./...`;
      break;

    default:
      publishSteps = `
      - name: Build
        run: make build`;
  }

  let dockerStep = '';
  if (hasDocker) {
    dockerStep = `

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      # Uncomment and configure for your registry:
      # - name: Login to Container Registry
      #   uses: docker/login-action@v3
      #   with:
      #     registry: ghcr.io
      #     username: \${{ github.actor }}
      #     password: \${{ secrets.GITHUB_TOKEN }}

      # - name: Build and push Docker image
      #   uses: docker/build-push-action@v5
      #   with:
      #     context: .
      #     push: true
      #     tags: |
      #       ghcr.io/\${{ github.repository }}:\${{ github.event.release.tag_name }}
      #       ghcr.io/\${{ github.repository }}:latest
      #     cache-from: type=gha
      #     cache-to: type=gha,mode=max`;
  }

  return `name: Release

on:
  release:
    types: [published]

permissions:
  contents: write
  packages: write

jobs:
  release:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
${publishSteps}${dockerStep}

      - name: Upload release artifacts
        uses: softprops/action-gh-release@v2
        with:
          files: |
            dist/*
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
`;
}

export const ReleaseWorkflowStrategy: EnrichmentStrategy = {
  id: 'enrich-release',
  name: 'Release Automation Workflow',
  priority: 15,

  matches: (stack: TechStack, flags: EnrichmentFlags) =>
    flags.release && stack.cicd === 'github-actions',

  apply: async (context: EnrichmentContext) => {
    context.files['.github/workflows/release.yml'] = generateReleaseWorkflow(context);
  },
};
