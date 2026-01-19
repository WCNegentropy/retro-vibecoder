#!/bin/bash
# Universal Project Validator Script
# Detects project type and runs appropriate validation commands

set -e

PROJECT_DIR="${1:-.}"
cd "$PROJECT_DIR"

echo "=== Universal Project Validator ==="
echo "Working directory: $(pwd)"

# Detect and validate Node.js projects
if [ -f "package.json" ]; then
    echo ">>> Detected Node.js project"

    if [ -f "pnpm-lock.yaml" ]; then
        pnpm install --frozen-lockfile
    elif [ -f "bun.lockb" ]; then
        bun install --frozen-lockfile
    elif [ -f "yarn.lock" ]; then
        yarn install --frozen-lockfile
    else
        npm ci || npm install
    fi

    # Run available scripts
    if grep -q '"typecheck"' package.json; then
        npm run typecheck
    fi

    if grep -q '"lint"' package.json; then
        npm run lint || true
    fi

    if grep -q '"build"' package.json; then
        npm run build
    fi

    if grep -q '"test"' package.json; then
        npm test || true
    fi
fi

# Detect and validate Python projects
if [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; then
    echo ">>> Detected Python project"

    python3 -m venv .venv
    source .venv/bin/activate

    if [ -f "requirements.txt" ]; then
        pip install -r requirements.txt
    fi

    if [ -f "pyproject.toml" ] && grep -q "poetry" pyproject.toml; then
        poetry install
    fi

    # Lint
    if command -v ruff &> /dev/null; then
        ruff check . || true
    fi

    # Type check
    if command -v mypy &> /dev/null; then
        mypy . || true
    fi

    # Test
    if command -v pytest &> /dev/null; then
        pytest || true
    fi

    deactivate
fi

# Detect and validate Rust projects
if [ -f "Cargo.toml" ]; then
    echo ">>> Detected Rust project"

    cargo fmt --check || true
    cargo clippy -- -D warnings || true
    cargo build --release
    cargo test || true
fi

# Detect and validate Go projects
if [ -f "go.mod" ]; then
    echo ">>> Detected Go project"

    go mod download
    go fmt ./...
    golangci-lint run || true
    go build ./...
    go test ./... || true
fi

# Detect and validate Java/Gradle projects
if [ -f "build.gradle" ] || [ -f "build.gradle.kts" ]; then
    echo ">>> Detected Gradle project"

    ./gradlew build || gradle build
    ./gradlew test || gradle test || true
fi

# Detect and validate Java/Maven projects
if [ -f "pom.xml" ]; then
    echo ">>> Detected Maven project"

    mvn -B package
    mvn test || true
fi

# Detect and validate .NET projects
if ls *.csproj 1> /dev/null 2>&1 || ls *.sln 1> /dev/null 2>&1; then
    echo ">>> Detected .NET project"

    dotnet restore
    dotnet build --no-restore
    dotnet test --no-build || true
fi

echo "=== Validation Complete ==="
