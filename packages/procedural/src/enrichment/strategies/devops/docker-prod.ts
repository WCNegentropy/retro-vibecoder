/**
 * Docker Production Enrichment Strategy
 *
 * Enhances Dockerfiles with production optimizations:
 * - Multi-stage builds
 * - Non-root user
 * - Health checks
 * - Minimal final image
 * - .dockerignore
 */

import type { EnrichmentStrategy, TechStack, EnrichmentFlags, EnrichmentContext } from '../../../types.js';

function generateNodeDockerfile(port: number): string {
  return `# ─── Build Stage ──────────────────────────────────────────
FROM node:20-slim AS builder

RUN corepack enable

WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm build

# Prune dev dependencies
RUN pnpm prune --prod

# ─── Production Stage ────────────────────────────────────
FROM node:20-slim AS production

RUN corepack enable

# Create non-root user
RUN groupadd -r app && useradd -r -g app -s /bin/false app

WORKDIR /app

# Copy only what's needed
COPY --from=builder --chown=app:app /app/dist ./dist
COPY --from=builder --chown=app:app /app/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/package.json ./

USER app

EXPOSE ${port}

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD node -e "fetch('http://localhost:${port}/health').then(r => process.exit(r.ok ? 0 : 1))"

CMD ["node", "dist/index.js"]
`;
}

function generatePythonDockerfile(port: number): string {
  return `# ─── Build Stage ──────────────────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ─── Production Stage ────────────────────────────────────
FROM python:3.12-slim AS production

# Create non-root user
RUN groupadd -r app && useradd -r -g app -s /bin/false app

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application
COPY --chown=app:app . .

USER app

EXPOSE ${port}

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${port}/health')"

CMD ["python", "-m", "src.main"]
`;
}

function generateGoDockerfile(port: number): string {
  return `# ─── Build Stage ──────────────────────────────────────────
FROM golang:1.22-alpine AS builder

RUN apk add --no-cache git ca-certificates

WORKDIR /app

# Download dependencies first (layer caching)
COPY go.mod go.sum ./
RUN go mod download

# Build static binary
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/server ./...

# ─── Production Stage ────────────────────────────────────
FROM scratch

# Copy CA certificates for HTTPS
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Copy binary
COPY --from=builder /app/server /server

EXPOSE ${port}

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \\
  CMD ["/server", "--health-check"]

ENTRYPOINT ["/server"]
`;
}

function generateRustDockerfile(port: number): string {
  return `# ─── Build Stage ──────────────────────────────────────────
FROM rust:1.75-slim AS builder

WORKDIR /app

# Cache dependencies by building a dummy project
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src

# Build real application
COPY . .
RUN touch src/main.rs && cargo build --release

# ─── Production Stage ────────────────────────────────────
FROM debian:bookworm-slim AS production

RUN apt-get update && apt-get install -y --no-install-recommends \\
    ca-certificates \\
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r app && useradd -r -g app -s /bin/false app

COPY --from=builder --chown=app:app /app/target/release/app /usr/local/bin/app

USER app

EXPOSE ${port}

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \\
  CMD ["/usr/local/bin/app", "--health-check"]

CMD ["app"]
`;
}

function generateDockerignore(stack: TechStack): string {
  const common = `# Version control
.git
.gitignore

# IDE
.vscode
.idea
*.swp
*.swo

# CI/CD
.github
.gitlab-ci.yml

# Documentation
*.md
LICENSE
docs/

# Docker
Dockerfile*
docker-compose*
.dockerignore
`;

  switch (stack.language) {
    case 'typescript':
    case 'javascript':
      return common + `
# Node.js
node_modules
dist
coverage
.env*
*.log
`;
    case 'python':
      return common + `
# Python
__pycache__
*.pyc
*.pyo
.venv
venv
.pytest_cache
.mypy_cache
.ruff_cache
.env*
`;
    case 'go':
      return common + `
# Go
vendor/
*.test
coverage.out
`;
    case 'rust':
      return common + `
# Rust
target/
*.rs.bk
`;
    default:
      return common;
  }
}

export const DockerProdEnrichStrategy: EnrichmentStrategy = {
  id: 'enrich-docker-prod',
  name: 'Docker Production Optimization',
  priority: 40,

  matches: (stack: TechStack, flags: EnrichmentFlags) =>
    flags.dockerProd && stack.packaging === 'docker',

  apply: async (context: EnrichmentContext) => {
    const { files, stack, introspect } = context;
    const ports = introspect.getExposedPorts();
    const port = ports[0] ?? 3000;

    // Replace Dockerfile with production-optimized version
    switch (stack.language) {
      case 'typescript':
      case 'javascript':
        files['Dockerfile'] = generateNodeDockerfile(port);
        break;
      case 'python':
        files['Dockerfile'] = generatePythonDockerfile(port);
        break;
      case 'go':
        files['Dockerfile'] = generateGoDockerfile(port);
        break;
      case 'rust':
        files['Dockerfile'] = generateRustDockerfile(port);
        break;
    }

    // Add .dockerignore
    if (!introspect.hasFile('.dockerignore')) {
      files['.dockerignore'] = generateDockerignore(stack);
    }
  },
};
