# Generic Library Website Crawler

A powerful, configuration-driven web crawler built with Node.js and Playwright for extracting content from library websites and preparing it for Salesforce import.

## Features

✅ **Generic & Configurable** - Works with ANY library website via JSON configuration  
✅ **Multiple Authentication** - Form login, saved sessions, or public sites  
✅ **Smart Content Extraction** - CSS selectors + heuristic fallback  
✅ **File Downloads** - PDFs, DOCX, XLSX, PPTX, images with deduplication  
✅ **Salesforce-Ready Output** - Normalized JSON + CSV for Content__c import  
✅ **Preset Configurations** - Pre-configured for Jive, WordPress, generic sites  
✅ **Rate Limiting** - Configurable delays to avoid anti-bot measures  
✅ **Progress Tracking** - Real-time console output with statistics  

---

## Installation

```bash
cd crawler
npm install
```

### Install Playwright browsers:

```bash
npx playwright install chromium
```

---

## Quick Start

### 1. Configure Environment

Copy `.env.example` to `.env` and add your credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
INNTOUCH_USERNAME=your_username
INNTOUCH_PASSWORD=your_password
BASE_URL=https://www.inn-touch.ca
```

### 2. Run with Preset

```bash
# InnTouch Local Sales Library (using Jive preset)
node bin/crawl.js \
  --preset jive \
  --start-url https://www.inn-touch.ca/community/local-sales-library \
  --username "$INNTOUCH_USERNAME" \
  --password "$INNTOUCH_PASSWORD" \
  --max-pages 100

# Public WordPress site (no auth)
node bin/crawl.js \
  --preset generic \
  --start-url https://example.com/knowledge-base \
  --max-depth 2 \
  --output ./output/example
```

### 3. Run with Config File

```bash
node bin/crawl.js --config config/inntouch.config.json
```

---

## CLI Options

```
Options:
  -c, --config <file>       Path to JSON config file
  -p, --preset <name>       Use preset: jive, generic
  -u, --start-url <url>     Starting URL to crawl
  --username <username>     Authentication username
  --password <password>     Authentication password
  --max-depth <n>           Maximum crawl depth (default: 3)
  --max-pages <n>           Maximum pages to crawl (default: 100)
  -o, --output <dir>        Output directory (default: ./output)
  --format <formats>        Output formats: json,csv (default: json,csv)
  --no-download             Skip file downloads
  --headless                Run browser in headless mode
  --verbose                 Enable verbose logging
  --dry-run                 Preview configuration without crawling
```

---

## Configuration

### Config File Structure

Create a JSON config file (e.g., `my-library.config.json`):

```json
{
  "name": "My Library",
  "startUrl": "https://example.com/library",
  
  "auth": {
    "strategy": "form",              // "form" | "session" | "none"
    "loginUrl": "https://example.com/login",
    "credentials": {
      "username": "${USERNAME}",     // Reads from .env
      "password": "${PASSWORD}"
    },
    "selectors": {
      "username": "input[name='username']",
      "password": "input[name='password']",
      "submit": "button[type='submit']"
    },
    "successIndicator": {
      "urlContains": "/dashboard"
    }
  },
  
  "crawl": {
    "maxDepth": 3,
    "maxPages": 100,
    "allowedDomains": ["example.com"],
    "includePatterns": ["/library/.*"],
    "excludePatterns": ["/login", "/logout"],
    "waitForSelector": ".content",
    "delay": 1000
  },
  
  "extraction": {
    "useHeuristics": true,
    "selectors": {
      "title": "h1, .page-title",
      "body": "article, .content",
      "videos": "iframe[src*='youtube']",
      "documents": "a[href$='.pdf']"
    }
  },
  
  "download": {
    "enabled": true,
    "downloadDir": "./downloads",
    "allowedTypes": ["pdf", "docx", "xlsx", "pptx"]
  },
  
  "output": {
    "formats": ["json", "csv"],
    "jsonFile": "./output/library_content.json",
    "csvFile": "./output/library_content.csv"
  }
}
```

### Authentication Strategies

#### 1. Form-Based Login

```json
{
  "auth": {
    "strategy": "form",
    "loginUrl": "https://site.com/login",
    "credentials": {
      "username": "${USERNAME}",
      "password": "${PASSWORD}"
    }
  }
}
```

#### 2. Saved Session

```json
{
  "auth": {
    "strategy": "session",
    "sessionFile": "./auth-session.json"
  }
}
```

First, manually log in and save session:
```bash
# The crawler will prompt for credentials and save session
node bin/crawl.js --save-session auth-session.json
```

#### 3. No Authentication (Public Site)

```json
{
  "auth": {
    "strategy": "none"
  }
}
```

---

## Output Format

### JSON Output (`library_content.json`)

Normalized structure with metadata, library info, categories, and pages:

```json
{
  "metadata": {
    "crawlId": "uuid",
    "startUrl": "...",
    "crawledAt": "2026-06-23T...",
    "statistics": {
      "pagesVisited": 47,
      "filesDownloaded": 23,
      "errors": 2
    }
  },
  "library": {
    "name": "Local Sales Library",
    "url": "...",
    "description": "..."
  },
  "categories": [...],
  "pages": [
    {
      "id": "lead-generation",
      "url": "...",
      "title": "Lead Generation",
      "summary": "...",
      "body": "...",
      "bodyHtml": "<p>...</p>",
      "category": ["Sales"],
      "videos": [{url, provider}],
      "images": [{url, filename}],
      "documents": [{url, filename, type, localPath}],
      "metadata": {...}
    }
  ],
  "errors": [...]
}
```

### CSV Output (`library_content.csv`)

Salesforce-ready format for Content__c import:

```csv
Content_Unique_Id__c,Name,Content_Type__c,Status__c,Title__c,Summary__c,Body__c,Source_URL__c,Category__c,Video_URLs__c,Document_URLs__c
lead-generation,Lead Generation,Category,Published,Lead Generation,...,<body>,...,Sales,,doc1.pdf|doc2.pdf
```

### Downloaded Files

Files saved to `downloads/` directory with unique filenames:

```
downloads/
├── sales-guide-2024-abc123.pdf
├── lead-generation-image-def456.jpg
└── ...
```

---

## Presets

### Jive Preset

For Jive-based community platforms (InnTouch, etc.):

```bash
node bin/crawl.js --preset jive --start-url https://...
```

**Includes:**
- Form-based authentication
- Jive-specific selectors (`.jive-rendered-content`, `.j-placeTitle`)
- Document patterns for `/docs/DOC-` URLs
- Vimeo/YouTube video extraction

### Generic Preset

For arbitrary websites with heuristic extraction:

```bash
node bin/crawl.js --preset generic --start-url https://...
```

**Includes:**
- No authentication
- Heuristic content detection
- Standard semantic HTML5 tags
- Common document extensions

---

## Examples

### Example 1: InnTouch with Config File

```bash
node bin/crawl.js --config config/inntouch.config.json
```

### Example 2: Quick Crawl with CLI Args

```bash
node bin/crawl.js \
  --preset jive \
  --start-url https://www.inn-touch.ca/community/local-sales-library \
  --username "$INNTOUCH_USERNAME" \
  --password "$INNTOUCH_PASSWORD" \
  --max-pages 50 \
  --output ./output/inntouch
```

### Example 3: Dry Run (Test Config)

```bash
node bin/crawl.js \
  --config config/inntouch.config.json \
  --dry-run
```

### Example 4: Skip Downloads

```bash
node bin/crawl.js \
  --config config/inntouch.config.json \
  --no-download
```

### Example 5: Custom Depth/Pages

```bash
node bin/crawl.js \
  --preset generic \
  --start-url https://example.com/docs \
  --max-depth 2 \
  --max-pages 25
```

---

## Salesforce Import

### Import CSV to Salesforce

1. **Review CSV Output**:
   ```bash
   cat output/library_content.csv
   ```

2. **Use Salesforce Data Loader**:
   - Open Data Loader
   - Select "Insert" operation
   - Choose `Content__c` object
   - Map CSV columns to Salesforce fields
   - Run import

3. **Or use SFDX**:
   ```bash
   sfdx force:data:bulk:upsert \
     -s Content__c \
     -f output/library_content.csv \
     -i Content_Unique_Id__c \
     -u myorg@example.com
   ```

### Field Mapping

| CSV Column | Salesforce Field | Description |
|------------|------------------|-------------|
| `Content_Unique_Id__c` | `Content_Unique_Id__c` | Unique ID (slug) |
| `Name` | `Name` | Display name |
| `Content_Type__c` | `Content_Type__c` | Library, Category, Article |
| `Title__c` | `Title__c` | Page title |
| `Summary__c` | `Summary__c` | Short summary |
| `Body__c` | `Body__c` | Full content (text) |
| `Source_URL__c` | `Source_URL__c` | Original URL |
| `Category__c` | `Category__c` | Category/topic |
| `Document_URLs__c` | `Document_URLs__c` | Pipe-separated file list |

---

## Troubleshooting

### Authentication Fails

- Check credentials in `.env`
- Verify login URL is correct
- Try updating selectors in config
- Use `--verbose` flag for detailed logs

### No Content Extracted

- Check `waitForSelector` matches actual page
- Try enabling heuristics: `"useHeuristics": true`
- Verify page loads correctly (test without `--headless`)

### Downloads Fail

- Check file type is in `allowedTypes`
- Verify download directory permissions
- Check max file size limit

### Too Many Errors

- Increase delay: `"delay": 2000`
- Reduce max pages to test: `--max-pages 10`
- Check include/exclude patterns

---

## Advanced Usage

### Custom Extractors

Add custom CSS selectors in config:

```json
{
  "extraction": {
    "selectors": {
      "title": "h1.custom-title, .page-header",
      "body": ".main-content, article.post",
      "category": ".breadcrumb a",
      "videos": "iframe[src*='vimeo']",
      "documents": "a.download-link"
    }
  }
}
```

### Category Extraction

Categories are extracted using multiple strategies:

1. **Breadcrumbs**: `.breadcrumb a` links
2. **URL Structure**: `/category/subcategory/page`
3. **Manual Mapping**: Define in config

### Rate Limiting

Adjust crawl delay to avoid rate limits:

```json
{
  "crawl": {
    "delay": 2000  // 2 seconds between requests
  }
}
```

---

## Development

### Project Structure

```
crawler/
├── bin/
│   └── crawl.js              # CLI entry point
├── config/
│   ├── presets/
│   │   ├── jive.json         # Jive platform preset
│   │   └── generic.json      # Generic website preset
│   └── inntouch.config.json  # InnTouch example
├── core/
│   ├── Crawler.js            # Main orchestrator
│   ├── Authenticator.js      # Auth strategies
│   ├── Navigator.js          # Link discovery
│   ├── Extractor.js          # Content extraction
│   ├── Downloader.js         # File downloads
│   └── Deduplicator.js       # Duplicate detection
├── exporters/
│   ├── JsonExporter.js       # JSON output
│   └── CsvExporter.js        # CSV output
├── utils/
│   ├── logger.js             # Logging
│   └── helpers.js            # Utility functions
└── package.json
```

### Adding a New Preset

1. Create JSON file in `config/presets/`:
   ```json
   {
     "name": "My Preset",
     "auth": {...},
     "extraction": {...}
   }
   ```

2. Use with:
   ```bash
   node bin/crawl.js --preset my-preset --start-url https://...
   ```

---

## License

ISC © Choice Hotels

---

## Support

For issues or questions:
- Check the troubleshooting section above
- Review existing GitHub issues
- Create a new issue with details and logs
