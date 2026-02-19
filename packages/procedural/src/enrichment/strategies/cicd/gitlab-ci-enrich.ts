/**
 * GitLab CI Enrichment Strategy
 *
 * Enhances the Pass 1 GitLab CI config with:
 * - Proper stage definitions
 * - Dependency caching
 * - Artifact configuration
 * - Environment-specific deploy stages
 */

import type {
  EnrichmentStrategy,
  TechStack,
  EnrichmentFlags,
  EnrichmentContext,
} from '../../../types.js';

function generateEnhancedGitLabCI(ctx: EnrichmentContext): string {
  const { stack, introspect, flags } = ctx;
  const hasDocker = introspect.hasFile('Dockerfile');

  let config = '';

  switch (stack.language) {
    case 'typescript':
    case 'javascript':
      config = `image: node:20

stages:
  - install
  - lint
  - test
  - build

cache:
  key: \${CI_COMMIT_REF_SLUG}
  paths:
    - node_modules/
    - .pnpm-store/

variables:
  npm_config_cache: "$CI_PROJECT_DIR/.pnpm-store"

install:
  stage: install
  script:
    - corepack enable
    - pnpm install --frozen-lockfile

lint:
  stage: lint
  script:
    - pnpm lint
  allow_failure: false

test:
  stage: test
  script:
    - pnpm test
  coverage: '/All files[^|]*\\|[^|]*\\s+([\\d.]+)/'
  artifacts:
    reports:
      junit: junit.xml
    when: always

build:
  stage: build
  script:
    - pnpm build
  artifacts:
    paths:
      - dist/
    expire_in: 1 week
`;
      break;

    case 'python':
      config = `image: python:3.12

stages:
  - install
  - lint
  - test

cache:
  key: \${CI_COMMIT_REF_SLUG}
  paths:
    - .cache/pip/

variables:
  PIP_CACHE_DIR: "$CI_PROJECT_DIR/.cache/pip"

install:
  stage: install
  script:
    - python -m pip install --upgrade pip
    - pip install -r requirements.txt
    - pip install -r requirements-dev.txt 2>/dev/null || true

lint:
  stage: lint
  script:
    - ruff check .

test:
  stage: test
  script:
    - pytest --junitxml=report.xml
  artifacts:
    reports:
      junit: report.xml
    when: always
`;
      break;

    case 'go':
      config = `image: golang:1.22

stages:
  - lint
  - test
  - build

cache:
  key: \${CI_COMMIT_REF_SLUG}
  paths:
    - /go/pkg/mod/

lint:
  stage: lint
  script:
    - go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
    - golangci-lint run

test:
  stage: test
  script:
    - go test -v -race -coverprofile=coverage.out ./...
  artifacts:
    paths:
      - coverage.out

build:
  stage: build
  script:
    - go build -v ./...
`;
      break;

    case 'rust':
      config = `image: rust:1.75

stages:
  - lint
  - test
  - build

cache:
  key: \${CI_COMMIT_REF_SLUG}
  paths:
    - target/
    - /usr/local/cargo/registry/

lint:
  stage: lint
  script:
    - rustup component add clippy rustfmt
    - cargo fmt --all -- --check
    - cargo clippy --all-targets -- -D warnings

test:
  stage: test
  script:
    - cargo test --all-features

build:
  stage: build
  script:
    - cargo build --release
  artifacts:
    paths:
      - target/release/
    expire_in: 1 week
`;
      break;

    default:
      config = `stages:
  - build
  - test

build:
  stage: build
  script:
    - make build

test:
  stage: test
  script:
    - make test
`;
  }

  // Docker build stage for full depth
  if (hasDocker && flags.depth === 'full') {
    config += `
docker-build:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  variables:
    DOCKER_TLS_CERTDIR: "/certs"
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
  only:
    - main
    - master
`;
  }

  return config;
}

export const GitLabCIEnrichStrategy: EnrichmentStrategy = {
  id: 'enrich-gitlab-ci',
  name: 'GitLab CI Enrichment',
  priority: 10,

  matches: (stack: TechStack, flags: EnrichmentFlags) => flags.cicd && stack.cicd === 'gitlab-ci',

  apply: async (context: EnrichmentContext) => {
    context.files['.gitlab-ci.yml'] = generateEnhancedGitLabCI(context);
  },
};
