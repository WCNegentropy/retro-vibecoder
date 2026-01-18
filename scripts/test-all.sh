#!/bin/bash
# Run all tests with coverage

set -e

echo "Running all tests..."

pnpm test:coverage

echo "Tests complete!"
