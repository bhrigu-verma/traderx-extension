# TraderX Pro Chrome Extension

Chrome extension codebase for TraderX Pro (Manifest V3).

## What is included

- Extension manifest and service worker
- Popup UI and settings pages
- Content scripts for X/Twitter integration
- Local extension assets and icons
- Packaging helper scripts

## Quick start (load unpacked)

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this folder: `trader-x-extension-only`

## Build/package

Use the packaging script if needed:

```bash
bash scripts/package-extension.sh
```

## GitHub Releases (for users)

This repo auto-generates a downloadable extension zip on version tags.

1. Bump `version` in `manifest.json`
2. Commit and push to `main`
3. Create and push a tag:

```bash
git tag v4.0.1
git push origin v4.0.1
```

GitHub Actions will build `releases/traderx-pro-v<version>.zip` and attach it to the GitHub Release for that tag.

## Notes

- This repository intentionally contains only extension-side code.
- Server and dashboard code are excluded.
