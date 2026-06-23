# Quick Start Guide - InnTouch Local Sales Library

## Prerequisites

1. **Install Dependencies** (see INSTALL.md for corporate firewall workaround)
   ```bash
   npm install
   npx playwright install chromium
   ```

2. **Set Up Credentials**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your InnTouch credentials:
   ```env
   INNTOUCH_USERNAME=your_username_here
   INNTOUCH_PASSWORD=your_password_here
   ```

---

## Quick Test (5 pages, no downloads)

Test authentication and basic crawling without downloading files:

```bash
node bin/crawl.js \
  --config config/inntouch-quick-test.config.json \
  --no-download
```

**Expected Output:**
```
🚀 Starting crawl: https://www.inn-touch.ca/community/local-sales-library?forceNoRedirect=true
Max pages: 5, Max depth: 1
ℹ️  Initializing browser...
✅ Browser initialized
🔐 Authenticating using strategy: form
🔐 Navigating to login page: https://www.inn-touch.ca/login.jspa
🔐 Filling credentials...
✅ Authentication successful!
🕷️  Starting page crawl...
🕷️  [1/5] Depth 0: https://www.inn-touch.ca/community/local-sales-library?forceNoRedirect=true
📄 Extracting content...
✅ Crawled 5 pages

═══════════════════════════════════════
📊 CRAWL SUMMARY
═══════════════════════════════════════
Pages crawled:      5
Files downloaded:   0
Errors:             0
Duration:           15.32s
═══════════════════════════════════════
```

**Output Files:**
- `output/test_library_content.json` - Full JSON structure
- `output/test_library_content.csv` - Salesforce-ready CSV

---

## Full Crawl (100 pages, with downloads)

Once the quick test works, run the full crawl:

```bash
node bin/crawl.js --config config/inntouch.config.json
```

**This will:**
- Crawl up to 100 pages
- Download all PDFs, DOCX, images
- Save to `output/inntouch_library_content.json` and `.csv`
- Download files to `output/downloads/`

**Duration:** ~5-10 minutes depending on content

---

## Using CLI Arguments (No Config File)

```bash
node bin/crawl.js \
  --preset jive \
  --start-url "https://www.inn-touch.ca/community/local-sales-library?forceNoRedirect=true" \
  --username "$INNTOUCH_USERNAME" \
  --password "$INNTOUCH_PASSWORD" \
  --max-pages 50 \
  --output ./output/inntouch
```

---

## Dry Run (Test Configuration)

Validate your config without actually crawling:

```bash
node bin/crawl.js --config config/inntouch.config.json --dry-run
```

**Output:**
```
🔍 DRY RUN MODE

Start URL: https://www.inn-touch.ca/community/local-sales-library?forceNoRedirect=true
Max Depth: 3
Max Pages: 100
Auth Strategy: form
Download Files: true

✓ Configuration validated. Use without --dry-run to start crawling.
```

---

## Troubleshooting

### Authentication Fails

1. **Check credentials** in `.env`
2. **Test login manually** in browser first
3. **Run with visible browser** to see what's happening:
   ```bash
   node bin/crawl.js --config config/inntouch-quick-test.config.json
   ```
   (Note: `inntouch-quick-test.config.json` has `headless: false`)

4. **Check error logs** with verbose flag:
   ```bash
   node bin/crawl.js --config config/inntouch.config.json --verbose
   ```

### No Content Extracted

1. **Verify page loads** - try with `headless: false`
2. **Check selectors** - InnTouch may have updated HTML structure
3. **Increase wait time** - add longer delay in config:
   ```json
   "crawl": {
     "delay": 3000
   }
   ```

### Files Not Downloading

1. **Check allowed types** in config:
   ```json
   "allowedTypes": ["pdf", "docx", "xlsx", "pptx", "jpg", "png"]
   ```

2. **Check file size limit** (default 50MB):
   ```json
   "maxFileSize": 52428800
   ```

3. **Verify download directory** exists and has write permissions

---

## Verify Output

### JSON Output

```bash
# View first page
node -e "console.log(JSON.stringify(require('./output/test_library_content.json').pages[0], null, 2))"

# Count pages
node -e "console.log('Pages:', require('./output/test_library_content.json').pages.length)"

# List categories
node -e "console.log(require('./output/test_library_content.json').categories.map(c => c.name))"
```

### CSV Output

```bash
# View CSV (first 10 rows)
head -10 output/test_library_content.csv

# Count rows
wc -l output/test_library_content.csv

# Open in Excel/LibreOffice for full review
```

### Downloads

```bash
# List downloaded files
ls -lh output/downloads/

# Count files by type
ls output/downloads/*.pdf | wc -l
ls output/downloads/*.jpg | wc -l
```

---

## Next Steps

1. ✅ Run quick test to validate authentication and extraction
2. ✅ Review test output (`test_library_content.json` and `.csv`)
3. ✅ If test looks good, run full crawl
4. ✅ Compare output to old scraper results (should have 11 categories, 4 PDFs, ~33 images)
5. ✅ Import CSV to Salesforce using Data Loader or SFDX

---

## Important URLs

- **Library Homepage**: https://www.inn-touch.ca/community/local-sales-library?forceNoRedirect=true
- **Login Page**: https://www.inn-touch.ca/login.jspa
- **Sample Category**: https://www.inn-touch.ca/community/local-sales-library/lead-generation
- **Sample Document**: https://www.inn-touch.ca/docs/DOC-56219

The `?forceNoRedirect=true` parameter ensures the crawler doesn't get redirected to a mobile version or login page unexpectedly.

---

## Expected Results (Based on Previous Extraction)

From your June 19th extraction, the InnTouch library contains:

- **11 Categories**:
  1. Building Rapport & Strategic Qualifying
  2. External Sales Content Hub
  3. Handling Objections & Closing the Sale
  4. Lead Generation
  5. Local Sales Training Shorts
  6. Market Segment Sales by Industry
  7. Preparation & Connecting
  8. Presenting Your Hotel
  9. Sales Platforms
  10. Sales Tools & Resources
  11. Homepage

- **4 PDF Documents**:
  - DOC-55954: Sales Platforms - Cvent Business Transient RFP
  - DOC-55963: Cvent Group Supplier Network (V2)
  - DOC-56219: Global Sales iNN-touch Resources (V5)
  - DOC-58319: Global Sales Resources (French)

- **~33 Images**: Category banners and content images

Your crawler should extract all of these + any new content added since June 19th.

---

## Support

If you encounter issues:
1. Check this QUICK_START.md troubleshooting section
2. Review INSTALL.md for dependency installation
3. Check README.md for full documentation
4. Review configuration in `config/inntouch.config.json`
