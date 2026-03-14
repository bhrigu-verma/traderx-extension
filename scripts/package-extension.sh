#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "Error: node is required to package the extension."
  exit 1
fi

if ! command -v rsync >/dev/null 2>&1; then
  echo "Error: rsync is required to package the extension."
  exit 1
fi

if ! command -v zip >/dev/null 2>&1; then
  echo "Error: zip is required to package the extension."
  exit 1
fi

VERSION="$(node -e 'const m=require("./manifest.json"); process.stdout.write(m.version || "0.0.0")')"
OUT_DIR="$ROOT_DIR/releases"
STAGING_DIR="$OUT_DIR/.staging"
ZIP_NAME="traderx-pro-v${VERSION}.zip"
ZIP_PATH="$OUT_DIR/$ZIP_NAME"

rm -rf "$STAGING_DIR"
mkdir -p "$STAGING_DIR" "$OUT_DIR"

# Copy extension source while excluding development and deployment-only artifacts.
rsync -a ./ "$STAGING_DIR/" \
  --exclude ".git/" \
  --exclude ".github/" \
  --exclude ".vscode/" \
  --exclude ".idea/" \
  --exclude "node_modules/" \
  --exclude "releases/" \
  --exclude "traderx-dashboard/" \
  --exclude "traderx-server/" \
  --exclude "scripts/" \
  --exclude "*.zip" \
  --exclude "*.pem" \
  --exclude ".DS_Store" \
  --exclude "*.log"

rm -f "$ZIP_PATH"
(
  cd "$STAGING_DIR"
  zip -r "$ZIP_PATH" .
)

rm -rf "$STAGING_DIR"

echo "Packaged extension: $ZIP_PATH"
echo
echo "Quick sanity check:"
echo "- Upload this zip in Chrome Web Store Developer Dashboard"
echo "- Local test: chrome://extensions -> Load unpacked (use project root, not zip)"
