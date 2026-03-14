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

## Notes

- This repository intentionally contains only extension-side code.
- Server and dashboard code are excluded.
