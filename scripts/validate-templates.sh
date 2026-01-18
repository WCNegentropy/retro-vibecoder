#!/bin/bash
# Validate all example templates

set -e

echo "Validating templates..."

# Build first to ensure CLI is available
pnpm build

# Validate each template
for template in templates/*/upg.yaml; do
  echo "Validating $template..."
  pnpm --filter @retro-vibecoder/cli validate "$template"
done

echo "All templates validated!"
