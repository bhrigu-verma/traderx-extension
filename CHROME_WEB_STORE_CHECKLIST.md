# Chrome Web Store Checklist (TraderX)

## 1) Pre-package checks

- [ ] Manifest version is incremented in manifest.json
- [ ] All extension features work from a fresh Chrome profile
- [ ] No secrets are hardcoded in extension files
- [ ] Permissions are justified and minimal
- [ ] Privacy policy URL is ready and public

## 2) Build upload zip

Use the packaging script from repo root:

```bash
bash scripts/package-extension.sh
```

Expected output zip:

- releases/traderx-pro-v<version>.zip

Notes:

- Load unpacked uses project root folder, not the zip
- Chrome Web Store upload uses the generated zip

## 3) Listing assets to prepare

- [ ] Extension name and one-line summary
- [ ] Detailed description (features + user benefit)
- [ ] At least one screenshot
- [ ] 128x128 icon
- [ ] Category and language metadata

## 4) Compliance

- [ ] Single purpose is clearly stated
- [ ] Data use is documented in privacy policy
- [ ] Host permissions are explained (x.com/twitter.com and price APIs)
- [ ] No misleading claims in listing copy

## 5) Upload and submit

- [ ] Go to Chrome Web Store Developer Dashboard
- [ ] Create or open TraderX item
- [ ] Upload releases/traderx-pro-v<version>.zip
- [ ] Complete store listing fields
- [ ] Complete privacy and data handling form
- [ ] Submit for review

## 6) Post-submit verification

- [ ] Keep changelog of what changed in this submission
- [ ] Test listed version once approved
- [ ] Tag release in git for traceability
