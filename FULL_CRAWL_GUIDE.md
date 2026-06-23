# Full Crawl Setup - Complete Guide

## ✅ What's Been Updated

The workflow has been upgraded from a quick test (5 pages) to a **full production crawl**:

### Changes Made

| Before (Quick Test) | After (Full Crawl) |
|---------------------|-------------------|
| 5 pages max | 100 pages max |
| No file downloads | All files downloaded (PDFs, images, docs) |
| Depth: 1 | Depth: 3 (follows links deeper) |
| Output: `test_library_content.*` | Output: `inntouch_library_content.*` |
| Duration: ~15 seconds | Duration: ~5-10 minutes |

## 🚀 Run the Full Crawl

### Step 1: Go to Actions

Open: **https://github.com/Ujwala272/inntouch-crawler/actions**

### Step 2: Run the Workflow

1. Click **"Crawler Dependency Install & Test"**
2. Click **"Run workflow"** button (right side)
3. Keep branch as **"main"**
4. Click green **"Run workflow"** button

### Step 3: Watch Progress (~5-10 minutes)

Click on the running workflow to watch live logs. You'll see:

```
✅ Authentication successful!
🕷️  Starting page crawl...
🕷️  [1/100] Depth 0: https://www.inn-touch.ca/community/local-sales-library
📄 Extracting content...
📥 Downloading file: sales-guide-2024.pdf
📥 Downloading file: lead-generation-image.jpg
🕷️  [2/100] Depth 1: https://www.inn-touch.ca/docs/DOC-12345
...
✅ Crawled XX pages

═══════════════════════════════════════
📊 CRAWL SUMMARY
═══════════════════════════════════════
Pages crawled:      XX
Files downloaded:   XX
Errors:             X
Duration:           ~5-10 minutes
═══════════════════════════════════════
```

## 📥 Download Your Complete Library

After the workflow completes:

### Step 1: Get the Artifacts

1. Scroll to **bottom** of workflow run page
2. Under **"Artifacts"**, click **"inntouch-full-crawl-XXXXX"**
3. Download the ZIP file (may be large - 50-200MB depending on content)

### Step 2: Extract the ZIP

You'll get:

```
crawler/
├── output/
│   ├── inntouch_library_content.json  # Full structured data
│   ├── inntouch_library_content.csv   # Salesforce import file
│   └── downloads/                      # All downloaded files
│       ├── sales-guide-2024-abc123.pdf
│       ├── lead-generation-def456.jpg
│       ├── cvent-training-ghi789.pdf
│       └── ... (all PDFs, images, docs)
```

## 📊 What You'll Get

### JSON File (`inntouch_library_content.json`)

Complete structured data:
- **Library metadata** (name, URL, crawl timestamp)
- **Categories** (11+ categories from InnTouch)
- **Pages** (all articles with full content)
- **Videos** (embedded YouTube/Vimeo URLs)
- **Documents** (PDF links and local file paths)
- **Images** (with local file paths)
- **Statistics** (pages crawled, files downloaded, errors)

### CSV File (`inntouch_library_content.csv`)

Salesforce-ready format for **Content__c** import:
- Content_Unique_Id__c
- Name
- Content_Type__c
- Status__c
- Title__c
- Summary__c
- Body__c (full HTML content)
- Source_URL__c
- Category__c
- Video_URLs__c
- Document_URLs__c

### Downloads Folder

All files extracted from InnTouch:
- **PDFs**: Sales guides, training materials, resources
- **Images**: Category banners, content images
- **Documents**: DOCX, XLSX, PPTX files

**Based on previous extraction (June 19):**
- 11 categories
- 4+ PDF documents
- 33+ images
- Plus any new content added since then

## 📋 Expected Results

### Categories (from June 19 baseline)

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

### Key Documents (from June 19 baseline)

- Sales Platforms - Cvent Business Transient RFP (DOC-55954)
- Cvent Group Supplier Network (DOC-55963)
- Global Sales iNN-touch Resources (DOC-56219)
- Global Sales Resources French (DOC-58319)

Plus any new content added to InnTouch since June 19.

## 🎯 Next Steps After Download

### Option A: Import to Salesforce

Use the CSV file for bulk import:

```bash
# Using SFDX CLI
sfdx force:data:bulk:upsert \
  -s Content__c \
  -f inntouch_library_content.csv \
  -i Content_Unique_Id__c \
  -u your-org-alias
```

Or use **Salesforce Data Loader**:
1. Open Data Loader
2. Select "Insert" or "Upsert"
3. Choose `Content__c` object
4. Map CSV columns
5. Run import

### Option B: Upload Files to Salesforce

Upload downloaded files to Salesforce Files or as ContentVersion records:

1. Use Salesforce Files upload API
2. Link to corresponding Content__c records
3. Or include file references in Body__c HTML

### Option C: Compare with Old Data

Use the comparison script to see what's new:

```bash
cd crawler
node scripts/compare-with-old-scraper.js \
  --old ../local-sales-library-extraction.md \
  --new output/inntouch_library_content.json
```

## 🔄 Running Again

To crawl again (to get updates):

1. Go to: https://github.com/Ujwala272/inntouch-crawler/actions
2. Click "Crawler Dependency Install & Test"
3. Click "Run workflow"

**When to run:**
- Weekly/monthly to capture new content
- After InnTouch updates
- Before major Salesforce releases

## ⚙️ Configuration Options

### Adjust Crawl Limits

Edit `crawler/config/inntouch.config.json`:

```json
"crawl": {
  "maxDepth": 3,     // How deep to follow links (1-5)
  "maxPages": 100,   // Max pages to crawl (increase for complete coverage)
  "delay": 1500      // Delay between requests in ms (increase if hitting rate limits)
}
```

### Adjust File Downloads

```json
"download": {
  "enabled": true,
  "allowedTypes": ["pdf", "docx", "xlsx", "pptx", "jpg", "png", "gif"],
  "maxFileSize": 52428800  // 50MB in bytes
}
```

## ❓ Troubleshooting

### Workflow Takes Longer Than Expected

**Normal:** 5-10 minutes for 100 pages
**If longer:**
- Check if InnTouch is slow
- Look for stuck pages in logs
- May need to increase timeout

### Some Files Not Downloaded

**Check:**
- File size over 50MB limit?
- File type not in allowedTypes?
- Authentication expired during crawl?

**Fix:**
- Increase `maxFileSize` in config
- Add file types to `allowedTypes`
- Re-run the workflow

### Hit Rate Limit / Blocked

**Symptoms:**
- Many errors in logs
- 429 or 503 HTTP errors
- Authentication fails mid-crawl

**Fix:**
- Increase `delay` in config (try 3000ms)
- Reduce `maxPages` temporarily
- Wait a few hours before re-running

### Missing Categories or Pages

**Check:**
- Did maxPages limit stop crawl early?
- Are some pages behind additional auth?
- URL patterns excluded by config?

**Fix:**
- Increase `maxPages` to 200+
- Check `includePatterns` and `excludePatterns`
- Review `allowedDomains`

## 📞 Support

If issues occur:
1. Check workflow logs for specific errors
2. Look at the step that failed
3. Review error messages
4. Check InnTouch site is accessible

---

## Summary

✅ **Workflow updated to full production crawl**  
✅ **100 pages max, depth 3, all files downloaded**  
✅ **Ready to run right now**  
✅ **Output includes JSON, CSV, and all downloaded files**

**Next Action:** Run the workflow at https://github.com/Ujwala272/inntouch-crawler/actions

🚀 **Good to go!**
