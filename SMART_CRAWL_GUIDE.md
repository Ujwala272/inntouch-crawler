# Smart Crawl Mode - Intelligent Content Extraction

## What is Smart Crawl?

Smart Crawl is an **enhanced crawling mode** that eliminates crawler noise and duplicate content BEFORE downloading files.

### Key Features:

1. **📋 File Inventory Generation** - Lists all files before downloading
2. **🎯 Smart URL Filtering** - Skips noise URLs automatically
3. **🔄 Advanced Deduplication** - By URL, title, and hash
4. **📊 Summary Report** - Detailed statistics after crawl

---

## 🎯 Smart Filtering - What Gets Skipped:

Based on the URL analysis, Smart Crawl automatically filters out:

| Filter Type | Examples | Why Skip? |
|-------------|----------|-----------|
| **Version pages** | `/DOC-*/version/*` | Not real content - just history |
| **Diff pages** | `/DOC-*/diff` | Comparison pages - noise |
| **Edit pages** | `/DOC-*/edit` | System pages - not content |
| **Servlet URLs** | `/servlet/*` (except downloads) | System URLs - 726 filtered |
| **Anchor links** | `#section` fragments | Same page - 429 duplicates |
| **Search URLs** | `?filterID=`, `?search=` | Dynamic - not content |

**Result:** From 42,273 discovered URLs → ~600 real content pages

---

## 🔄 Deduplication Strategy:

### 1. URL Deduplication (Always On)
- Exact URL match
- Already downloaded = skip

### 2. Title Deduplication (Smart Mode)
- Normalizes titles (lowercase, remove punctuation)
- "Sales Guide 2024.pdf" = "sales guide 2024 pdf"
- Catches renamed duplicates

### 3. Hash Deduplication (Prepared)
- MD5 hash of file content
- Catches identical files with different names
- **Note:** Currently prepared, can be enabled

---

## 📋 File Inventory CSV

**Generated BEFORE downloading** - shows what will be downloaded:

```csv
URL,Title,Type,Downloaded,Reason,Duplicate Type,Timestamp
https://.../DOC-123,Sales Guide,PDF,Yes,,2026-06-24T...
https://.../DOC-456,Sales Guide,PDF,No,Duplicate of DOC-123,title,2026-06-24T...
https://.../DOC-789,Training,PDF,No,Downloads disabled,,2026-06-24T...
```

**Use Cases:**
- Preview what will download
- Audit for duplicates
- Estimate download time/size
- Share list without downloading

---

## 📊 Summary Report JSON

**Generated AFTER crawl** - comprehensive statistics:

```json
{
  "crawlCompleted": "2026-06-24T...",
  "statistics": {
    "totalPagesCrawled": 520,
    "uniqueContentPages": 450,
    "uniqueDocuments": 1200,
    "uniquePDFs": 980,
    "uniqueVideos": 39,
    "filesDownloaded": 1150,
    "filesSkipped": 50,
    "errors": 7
  },
  "contentBreakdown": {
    "documentPages": 419,
    "categoryPages": 14,
    "otherPages": 87
  },
  "downloaderStats": {
    "downloaded": 1150,
    "skipped": 50,
    "errors": 7,
    "inventorySize": 1200
  }
}
```

---

## 🚀 How to Run Smart Crawl:

### Step 1: Go to Actions

https://github.com/Ujwala272/inntouch-crawler/actions

### Step 2: Run Workflow

1. Click **"Crawler Dependency Install & Test"**
2. Click **"Run workflow"** dropdown
3. Select **"smart"** mode (default)
4. Click green **"Run workflow"** button

### Step 3: Wait ~15-20 Minutes

Smart crawl with 600 pages and downloads takes:
- Discovery: ~2 min
- Crawling: ~10 min
- Downloads: ~5-10 min (depending on file count)

### Step 4: Download Results

Scroll to bottom → **"Artifacts"** → Download ZIP containing:

```
inntouch-smart-crawl-XX/
├── inntouch_smart_crawl.json      # Full data
├── inntouch_smart_crawl.csv       # Salesforce import
├── file_inventory.csv             # File list with dedup info
├── crawl_summary.json             # Statistics report
└── downloads/                      # All downloaded files
    ├── *.pdf
    ├── *.xlsx
    └── *.jpg
```

---

## 📈 Expected Results (Based on Analysis):

```
Pages crawled:         ~520-600
Unique documents:      ~1,200
PDFs:                  ~980
Videos:                ~39
Images:                ~140
Files downloaded:      ~1,100-1,300

Noise filtered:
  - Version/diff pages: 197
  - Servlet URLs:       726
  - Anchor links:       429
  - Duplicates:         5,611

Total savings:         ~6,963 unnecessary downloads
```

---

## 🆚 Mode Comparison:

| Feature | Discovery | Full | Smart ⭐ |
|---------|-----------|------|---------|
| **Max Pages** | 500 | 100 | 600 |
| **Max Depth** | 5 | 3 | 5 |
| **Downloads** | ❌ No | ✅ Yes | ✅ Yes |
| **Smart Filtering** | ❌ No | ❌ No | ✅ Yes |
| **Deduplication** | Basic | Basic | Advanced |
| **Inventory** | ❌ No | ❌ No | ✅ Yes |
| **Summary Report** | ❌ No | ❌ No | ✅ Yes |
| **Duration** | 2-3 min | 10 min | 15-20 min |
| **Output Size** | ~200KB | ~50MB | ~100-200MB |
| **Purpose** | Enumerate | Legacy | Production ⭐ |

**Recommendation:** Use **Smart** for all production crawls

---

## 💡 Configuration Details:

**File:** `crawler/config/inntouch-smart.config.json`

```json
{
  "crawl": {
    "maxDepth": 5,
    "maxPages": 600,
    "excludePatterns": [
      "/diff$",
      "/version/",
      "/edit$",
      "/servlet/JiveServlet/(?!download)",
      "#"
    ]
  },
  "download": {
    "enabled": true,
    "generateInventory": true,
    "deduplicateByTitle": true,
    "deduplicateByHash": true
  },
  "output": {
    "formats": ["json", "csv"],
    "inventoryFile": "./output/file_inventory.csv",
    "summaryFile": "./output/crawl_summary.json"
  }
}
```

---

## 📊 Analysis Results Summary:

**Discovery Crawl Found:**
- 42,273 "discovered URLs" (misleading!)
- 7,352 total URLs collected
- 5,611 duplicates (76% noise!)
- 1,741 unique URLs after normalization
- **~600 real content pages** (actual)

**Smart Crawl Targets:**
- 600 max pages (safe buffer)
- Filters 6,963 noise URLs
- Focuses on real content only
- Eliminates duplicates before download

---

## 🎯 Use Cases:

### Production Content Extraction
```
Mode: smart
Purpose: Get all unique content
Result: Clean dataset, no duplicates
```

### Quick Content Survey
```
Mode: discovery  
Purpose: Count total pages
Result: Statistics only, no downloads
```

### Legacy/Testing
```
Mode: full
Purpose: Original 100-page behavior
Result: Small sample with downloads
```

---

## 🔍 Troubleshooting:

### Inventory File Empty
- Check `generateInventory: true` in config
- Verify output directory exists
- Check workflow logs for export errors

### Too Many Skipped Files
- Review `file_inventory.csv` for reasons
- Check `deduplicateByTitle` setting
- May be legitimate duplicates

### Missing Content
- Compare with discovery results
- Check excluded patterns
- Verify maxPages not hit (check queue status)

---

## 📋 Post-Crawl Checklist:

1. **Review Summary Report**
   - Check unique counts vs total
   - Verify error count acceptable
   - Confirm files downloaded match expected

2. **Check Inventory**
   - Review duplicate entries
   - Verify skip reasons make sense
   - Identify any missed content

3. **Validate Downloads**
   - Spot-check PDF files open correctly
   - Verify file sizes reasonable
   - Check for any 0-byte files

4. **Import to Salesforce**
   - Use `inntouch_smart_crawl.csv`
   - Map to Content__c object
   - Upload files separately

---

## 🚀 Next Steps After Smart Crawl:

### 1. Review Results
```bash
# Extract archive
unzip inntouch-smart-crawl-XX.zip

# Check summary
cat crawl_summary.json | jq .

# Review inventory
head -50 file_inventory.csv
```

### 2. Compare with Previous Crawl
```
Previous (100 pages):  100 pages, 323 files
Smart (600 pages):     ~550 pages, ~1,200 files

Missing from first:    450 pages, 877 files (88% missed!)
```

### 3. Import to Salesforce
```bash
# Using SFDX
sfdx force:data:bulk:upsert \
  -s Content__c \
  -f inntouch_smart_crawl.csv \
  -i Content_Unique_Id__c
```

### 4. Upload Files
- Use Salesforce Files
- Link to Content__c records
- Organize by category

---

## 💾 Remember for Next Library:

**Smart Crawl configuration is reusable!**

For another Jive-based library:
1. Copy `inntouch-smart.config.json`
2. Update URLs and domains
3. Keep all the smart filtering
4. Run with same deduplication

For non-Jive libraries:
1. Adjust `excludePatterns` for their system
2. Keep deduplication settings
3. Modify selectors for their HTML
4. Same inventory & summary features

---

## Summary:

✅ **Smart Crawl** = Production mode  
✅ **Filters 6,963 noise URLs**  
✅ **Deduplicates before downloading**  
✅ **Generates inventory & summary**  
✅ **~600 real content pages**  
✅ **~1,200 unique files**  

**Ready to run!** 🚀

https://github.com/Ujwala272/inntouch-crawler/actions
