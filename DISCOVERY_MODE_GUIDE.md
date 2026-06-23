# Discovery Mode Guide

## What is Discovery Mode?

Discovery mode crawls the library to **enumerate all content URLs** without downloading files. This helps you:

1. **Find total content volume** - How many pages exist?
2. **Identify missed content** - Did the 100-page limit skip anything?
3. **Plan full crawls** - Know what you're getting before downloading
4. **Fast exploration** - No downloads = faster execution (~2-3 minutes instead of 10)

## How to Run Discovery Mode

### Step 1: Go to GitHub Actions

https://github.com/Ujwala272/inntouch-crawler/actions

### Step 2: Run Workflow with Discovery Mode

1. Click **"Crawler Dependency Install & Test"**
2. Click **"Run workflow"** button (right side)
3. **SELECT:** `discovery` from the "Crawl mode" dropdown
4. Click green **"Run workflow"** button

### Step 3: Wait ~2-3 Minutes

Discovery is FAST because:
- No file downloads
- Lighter processing
- Just URL enumeration

### Step 4: Review Results

After completion, check the **Summary** section:

```
Mode: Discovery (no downloads)
Pages Discovered: XXX
Categories Found: X
Potential Files: XXX
```

And in the logs, you'll see:

```
Content Type Breakdown:
  - Documents: XX
  - Pages: XX
  - Other: XX

Total unique URLs discovered: XXX
Potential files (not downloaded): XXX
```

## Discovery Mode vs Full Mode

| Feature | Discovery | Full |
|---------|-----------|------|
| **Max Pages** | 500 | 100 |
| **Max Depth** | 5 | 3 |
| **Downloads** | ❌ No | ✅ Yes |
| **Speed** | ~2-3 min | ~10 min |
| **Output Size** | ~200KB | ~50MB+ |
| **Purpose** | Enumerate URLs | Extract all content |

## Configuration Differences

### Discovery (`inntouch-discovery.config.json`)
```json
{
  "crawl": {
    "maxDepth": 5,
    "maxPages": 500,
    "delay": 1000
  },
  "download": {
    "enabled": false
  },
  "output": {
    "jsonFile": "./output/inntouch_discovery.json",
    "csvFile": "./output/inntouch_discovery.csv"
  }
}
```

### Full (`inntouch.config.json`)
```json
{
  "crawl": {
    "maxDepth": 3,
    "maxPages": 100,
    "delay": 1500
  },
  "download": {
    "enabled": true,
    "allowedTypes": ["pdf", "docx", "xlsx", ...]
  },
  "output": {
    "jsonFile": "./output/inntouch_library_content.json",
    "csvFile": "./output/inntouch_library_content.csv"
  }
}
```

## What You Get

### JSON Output (`inntouch_discovery.json`)
```json
{
  "metadata": {
    "crawlId": "...",
    "startUrl": "...",
    "statistics": {
      "pagesVisited": 345,
      "filesDownloaded": 0
    }
  },
  "pages": [
    {
      "id": "lead-generation",
      "url": "https://www.inn-touch.ca/community/local-sales-library/lead-generation",
      "title": "Lead Generation",
      "documents": [
        {
          "url": "https://www.inn-touch.ca/servlet/.../sales-guide.pdf",
          "filename": null,
          "localPath": null
        }
      ],
      "images": [...]
    }
  ]
}
```

**Note:** `documents` and `images` arrays contain URLs but NO local files (not downloaded).

### CSV Output (`inntouch_discovery.csv`)

Same format as full mode, but:
- No downloaded file paths
- Only URLs and metadata
- Lighter weight

## Use Cases

### 1. Initial Survey

**Before first crawl:**
```
Run: Discovery mode
Result: "Found 345 pages with 1,200 potential files"
Decision: Increase full crawl to 400 pages
```

### 2. Identify Missed Content

**After 100-page full crawl:**
```
Run: Discovery mode
Compare: 100 pages extracted vs 345 discovered
Result: "245 pages were skipped!"
Decision: Run full crawl with maxPages: 400
```

### 3. Category Exploration

**To explore specific category:**
```
Update discovery config:
  "includePatterns": ["/community/local-sales-library/lead-generation"]
Run: Discovery mode
Result: "Lead Generation has 23 pages"
```

### 4. Change Detection

**Weekly monitoring:**
```
Week 1 Discovery: 345 pages
Week 2 Discovery: 352 pages
Result: "7 new pages added"
Decision: Run full crawl to get new content
```

## Interpreting Results

### Pages Discovered

**If pages discovered < maxPages (500):**
✅ You found everything! Full crawl at that limit will get all content.

**If pages discovered = maxPages (500):**
⚠️ Hit the limit! There may be more content. Increase maxPages to 1000.

### Content Type Breakdown

```
Documents: 234  ← Individual documents (DOC-xxxxx URLs)
Pages: 78       ← Category/topic pages
Other: 33       ← Homepage, navigation pages
```

**Documents** are the primary content (PDFs, guides, resources).  
**Pages** are categories and landing pages.

### Potential Files

```
Potential files (not downloaded): 1,245
```

This is the COUNT of file references found:
- PDFs in document pages
- Images in content
- Office docs attached

In full mode, these would be downloaded.

## Next Steps After Discovery

### Scenario A: All Content Found (Pages < 500)

**Example:** Discovered 234 pages

**Action:** Run full mode with `maxPages: 250` (buffer for safety)

```
1. Go to Actions
2. Select "full" mode
3. Or edit inntouch.config.json: "maxPages": 250
4. Run full crawl
```

### Scenario B: Hit the Limit (Pages = 500)

**Example:** Discovered 500 pages (hit max)

**Action:** Run discovery again with higher limit

```
1. Edit inntouch-discovery.config.json: "maxPages": 1000
2. Commit and push
3. Run discovery mode again
4. Find actual total
5. Then run full mode with that limit
```

### Scenario C: Selective Crawl

**Example:** Only want "Lead Generation" category

**Action:** Update includePatterns for targeted crawl

```json
{
  "includePatterns": [
    "/community/local-sales-library/lead-generation"
  ]
}
```

## Tips

### 1. Run Discovery First
Always run discovery before a big full crawl to know what you're getting.

### 2. Use for Planning
Discovery results help set realistic maxPages for full crawls.

### 3. Compare Over Time
Save discovery results to track content changes.

### 4. Debug Include Patterns
Discovery mode is fast - use it to test if your URL patterns are correct.

### 5. Resource Planning
`Potential files` count helps estimate:
- Download time (1-2 sec per file)
- Storage space (assume 1MB avg per PDF)
- Processing requirements

## Troubleshooting

### Still Hit 500 Limit

**Solution:** Increase maxPages to 1000 or 2000 in config

```json
"crawl": {
  "maxPages": 1000
}
```

### Found Fewer Pages Than Expected

**Check:**
- `includePatterns` - Are they too restrictive?
- `excludePatterns` - Blocking desired content?
- `allowedDomains` - Correct domains listed?

### Pages Count Doesn't Match

**Remember:**
- Discovery counts unique URLs
- Full mode may deduplicate similar pages
- Some pages might be unreachable/errors

## Example Workflow

### Step 1: Discovery
```
Mode: Discovery
Result: 345 pages, 1,200 files
Time: 2 minutes
```

### Step 2: Analysis
```
Review: Content types, categories
Decision: Get all 345 pages
```

### Step 3: Full Crawl
```
Update config: maxPages: 400 (buffer)
Mode: Full
Result: 345 pages, 1,180 files downloaded
Time: 15 minutes
```

### Step 4: Import
```
Upload CSV to Salesforce
Upload files to Salesforce Files
Link content records
```

---

## Quick Commands

**Run discovery mode:**
```
Actions → Run workflow → Select "discovery" → Run
```

**Run full mode:**
```
Actions → Run workflow → Select "full" → Run
```

**Switch modes in code:**
```bash
# Discovery
node bin/crawl.js --config config/inntouch-discovery.config.json

# Full
node bin/crawl.js --config config/inntouch.config.json
```

---

## Summary

✅ **Discovery mode** = Fast enumeration, no downloads  
✅ **Full mode** = Complete extraction with files  
✅ **Use discovery first** to know what you're getting  
✅ **Then run full** with appropriate limits  

**Ready to discover?** Run it now! 🔍
