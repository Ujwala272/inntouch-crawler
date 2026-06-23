# Installation Guide

## Corporate Network / Firewall Issues

If you encounter npm registry errors like:

```
npm error errno FETCH_ERROR
npm error invalid json response body at https://bpb.opendns.com/
```

This is due to corporate OpenDNS blocking npm registry access.

## Workaround Options

### Option 1: Install from GitHub Actions

Use the GitHub Actions environment (which has npm access) to install dependencies:

1. Add this step to `.github/workflows/crawler.yml`:

```yaml
- name: Install crawler dependencies
  run: |
    cd crawler
    npm install
```

2. Commit and push - GitHub Actions will install deps in CI environment

### Option 2: Use Personal Network

```bash
# On personal laptop or mobile hotspot (not corporate network)
cd crawler
npm install

# Then copy node_modules back to work machine
```

### Option 3: Manually Download Packages

If Options 1-2 are not available, manually download and extract each package from npmjs.com:

**Required Packages:**
- `playwright@1.44.0`
- `dotenv@16.4.5`
- `fs-extra@11.2.0`
- `commander@12.1.0`
- `winston@3.13.0`
- `json2csv@6.0.0-alpha.2`
- `uuid@9.0.1`

Extract all to `crawler/node_modules/` directory.

### Option 4: Install Playwright Only (Minimal)

Playwright is the critical dependency. Others can be worked around:

```bash
# Download Playwright from https://playwright.dev/
# Extract to node_modules/@playwright/...

# Create stub implementations for others in utils/stubs.js
```

---

## Standard Installation (Non-Corporate)

If you have direct npm access:

```bash
cd crawler
npm install
npx playwright install chromium
```

Done!

---

## Verify Installation

Test that core modules load:

```bash
node -e "import('./core/Crawler.js').then(() => console.log('OK'))"
```

---

## Next Steps

1. Copy `.env.example` to `.env`
2. Add your credentials
3. Run a test crawl:

```bash
node bin/crawl.js \
  --preset generic \
  --start-url https://example.com \
  --max-pages 5 \
  --dry-run
```
