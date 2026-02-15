#!/bin/bash
# Stamp version from release tag into all package manifests
VERSION="${1#v}"  # Strip leading 'v' if present

if [ -z "$VERSION" ]; then
  echo "Usage: stamp-version.sh <version>"
  echo "Example: stamp-version.sh v0.3.0"
  exit 1
fi

echo "Stamping version: $VERSION"

# Node packages (JSON)
for pkg in package.json packages/*/package.json; do
  if [ -f "$pkg" ]; then
    node -e "
      const fs = require('fs');
      const p = JSON.parse(fs.readFileSync('$pkg', 'utf8'));
      p.version = '$VERSION';
      fs.writeFileSync('$pkg', JSON.stringify(p, null, 2) + '\n');
    "
    echo "  ✓ $pkg → $VERSION"
  fi
done

# Tauri config (JSON)
TAURI_CONF="packages/desktop/src-tauri/tauri.conf.json"
if [ -f "$TAURI_CONF" ]; then
  node -e "
    const fs = require('fs');
    const c = JSON.parse(fs.readFileSync('$TAURI_CONF', 'utf8'));
    c.version = '$VERSION';
    fs.writeFileSync('$TAURI_CONF', JSON.stringify(c, null, 2) + '\n');
  "
  echo "  ✓ $TAURI_CONF → $VERSION"
fi

# Cargo.toml (TOML — sed-based, surgical)
CARGO_TOML="packages/desktop/src-tauri/Cargo.toml"
if [ -f "$CARGO_TOML" ]; then
  sed -i.bak "s/^version = \".*\"/version = \"$VERSION\"/" "$CARGO_TOML"
  rm -f "$CARGO_TOML.bak"
  echo "  ✓ $CARGO_TOML → $VERSION"
fi
