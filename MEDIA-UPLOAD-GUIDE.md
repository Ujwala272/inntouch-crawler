# InnTouch Media Upload Guide

Complete guide to extract and upload all media (PDFs + Images) to Salesforce.

---

## Overview

The InnTouch library contains:
- **4 PDF documents** (require authentication to download)
- **~33 category banner images** (extracted from HTML files)
- **Rich text content** (already imported)

This guide shows how to get these media files into Salesforce.

---

## Part 1: Extract Images from HTML Files (5 minutes)

### Step 1: Locate Extracted HTML Files

Images are in the `_files` subdirectories:

```
scraper/html/
├── Building Rapport & Strategic Qualifying.html
├── Building Rapport & Strategic Qualifying_files/
│   ├── 2.png                    ← Category banner image
│   ├── 24.png
│   └── ...
├── External Sales Content Hub.html
├── External Sales Content Hub_files/
│   └── [images here]
└── ... (10 more categories)
```

### Step 2: Copy Category Banner Images

Run this in PowerShell or manually:

```powershell
cd "C:\Users\ujwala.rapolu\OneDrive - Choice Hotels\Documents\ujwalasandbox\scraper"

# Create images output directory
New-Item -ItemType Directory -Force -Path "output\images"

# Copy first image from each _files folder
Get-ChildItem -Path "html\*_files" -Directory | ForEach-Object {
    $firstImage = Get-ChildItem -Path $_.FullName -Filter "*.png" | Select-Object -First 1
    if ($firstImage) {
        $categoryName = $_.Name -replace '_files$', ''
        $outputName = $categoryName -replace ' ', '-' -replace '&', '' -replace '--', '-'
        Copy-Item $firstImage.FullName "output\images\$outputName.png"
        Write-Host "Copied: $outputName.png"
    }
}
```

**Or manually**:
1. Open each `*_files` folder
2. Copy the main banner image (usually `2.png` or similar)
3. Rename to match category (e.g., `building-rapport.png`)
4. Save to `scraper/output/images/`

---

## Part 2: Download PDFs Manually (5 minutes)

### Required: InnTouch Login Access

You need credentials for https://www.inn-touch.ca

### Step-by-Step:

1. **Login to InnTouch**:
   - Go to: https://www.inn-touch.ca/login.jspa
   - Enter your credentials

2. **Download Each PDF**:

   **PDF 1: Cvent Business Transient RFP**
   - URL: https://www.inn-touch.ca/docs/DOC-55954
   - Click download link or right-click PDF link → Save As
   - Save to: `scraper/output/pdfs/cvent-business-transient-rfp.pdf`

   **PDF 2: Cvent Group Supplier Network**
   - URL: https://www.inn-touch.ca/docs/DOC-55963
   - Save to: `scraper/output/pdfs/cvent-group-supplier-network.pdf`

   **PDF 3: Global Sales iNN-touch Resources**
   - URL: https://www.inn-touch.ca/docs/DOC-56219
   - Save to: `scraper/output/pdfs/global-sales-resources.pdf`

   **PDF 4: Global Sales Resources (French)**
   - URL: https://www.inn-touch.ca/docs/DOC-58319
   - Save to: `scraper/output/pdfs/global-sales-resources-french.pdf`

3. **Verify Downloads**:
   ```bash
   ls -lh scraper/output/pdfs/*.pdf
   ```

   Should show 4 PDF files.

---

## Part 3: Upload to Salesforce (20 minutes)

### Option A: Salesforce Files UI (Recommended - No Code)

#### Upload PDFs to Articles

1. **Open Salesforce**:
   - Login to QA org
   - Navigate to: Setup → Object Manager → Content__c → Records

2. **Find Article Records**:
   - Search for: "Cvent Business Transient RFP"
   - Click to open record

3. **Upload PDF**:
   - Scroll to **Files** related list
   - Click **Upload Files**
   - Select: `cvent-business-transient-rfp.pdf`
   - Click **Done**

4. **Get Download URL**:
   - Click the uploaded file
   - Click **Share** → **Get Link**
   - Copy the link (looks like: `/sfc/servlet.shepherd/document/download/[ID]`)

5. **Update Translation Body**:
   - Navigate to **Translations__c** related to this article
   - Edit **Body__c** field
   - Replace the inn-touch.ca URL with Salesforce URL:

   ```html
   <div class="article-content">
   <p>Guide to using Cvent for Business Transient RFPs</p>
   <div class="pdf-download" style="margin: 20px 0; padding: 20px; background: #f5f5f5; border-left: 4px solid #0070d2; border-radius: 4px;">
   <h3 style="margin-top: 0; color: #0070d2;">📄 Download PDF</h3>
   <p><strong>cvent-business-transient-rfp.pdf</strong></p>
   <p style="margin: 15px 0;">
   <a href="/sfc/servlet.shepherd/document/download/[YOUR_DOCUMENT_ID]" class="btn-download" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #0070d2, #0176d3); color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">⬇️ Download PDF</a>
   </p>
   </div>
   </div>
   ```

6. **Repeat for Other 3 PDFs**:
   - Cvent Group Supplier Network (DOC-55963)
   - Global Sales Resources (DOC-56219)
   - Global Sales Resources French (DOC-58319)

#### Upload Category Banner Images

1. **Find Category Records**:
   - Object Manager → Content__c → Records
   - Search for: "Building Rapport"

2. **Upload Image**:
   - Scroll to **Files** related list
   - Upload: `building-rapport.png`

3. **Set as Banner Image** (if field exists):
   - Edit record
   - **Banner_Image__c** field → Link to uploaded file
   - OR copy file URL to **Banner_Image_URL__c**

4. **Repeat for All 10 Categories**

---

### Option B: Automated Upload via Script (Advanced)

**Prerequisites**:
- Salesforce Connected App configured
- Environment variables set (see GITHUB-ACTIONS-SETUP.md Step 4)

#### Run Upload Script:

```bash
cd scraper

# Set environment variables (Windows PowerShell)
$env:SF_CLIENT_ID="your_consumer_key"
$env:SF_CLIENT_SECRET="your_consumer_secret"
$env:SF_USERNAME="ujwala.rapolu@choicehotels.com.qa"
$env:SF_PASSWORD="your_password_and_token"
$env:SF_INSTANCE_URL="https://test.salesforce.com"

# Run upload
node upload-media-to-salesforce.js
```

**Expected Output**:
```
=== InnTouch Media → Salesforce Uploader ===

🔐 Authenticating with Salesforce...
✓ Authenticated successfully

📚 Querying library content...
  ✓ Library: Local Sales Library (a5mEi000002wSu1IAE)
  ✓ Categories: 10
  ✓ Articles: 4
  ✓ Translations: 15

📄 Uploading PDFs...
  Found 4 PDF files
  Uploading: cvent-business-transient-rfp.pdf...
  ✓ Uploaded: Cvent Business Transient RFP - PDF (1250KB)
  [... 3 more PDFs ...]

📸 Uploading category images...
  Found 10 image files
  Uploading: building-rapport.png...
  ✓ Uploaded: Building Rapport & Strategic Qualifying - Banner (45KB)
  [... 9 more images ...]

📝 Updating translations with Salesforce URLs...
  ✓ Updated: Cvent Business Transient RFP
  ✓ Updated: Cvent Group Supplier Network
  ✓ Updated: Global Sales iNN-touch Resources
  ✓ Updated: Global Sales iNN-touch Resources (French)

  Total updated: 4/4

=== Upload Summary ===
PDFs: 4 uploaded (5120KB)
Images: 10 uploaded (450KB)
Translations: 4 updated

✅ Media upload complete!
```

---

## Part 4: Verify Uploads (5 minutes)

### Check PDFs

1. **Navigate to Library**:
   ```
   https://choicehotelsfranchise--qa.sandbox.my.site.com/Zx/resources?tabName=Reference&name=00002-local-sales-library-inntouch
   ```

2. **Click "Sales Platforms" Tab**

3. **Click "Cvent Business Transient RFP"**

4. **Verify**:
   - PDF download section appears
   - Blue "Download PDF" button visible
   - Click button → PDF downloads from Salesforce (not inn-touch.ca)
   - PDF opens successfully

5. **Repeat for other 3 articles**

### Check Images

1. **Category Tabs**:
   - Click each category tab
   - Verify banner image displays at top
   - Check all 10 categories

2. **Overview Tab**:
   - Topic area cards should show category images (if component supports it)

---

## Media Inventory

### PDFs (4 total)

| Article | Doc ID | Filename | Approx Size | URL |
|---------|--------|----------|-------------|-----|
| Cvent Business Transient RFP | DOC-55954 | cvent-business-transient-rfp.pdf | ~1.2MB | https://www.inn-touch.ca/docs/DOC-55954 |
| Cvent Group Supplier Network | DOC-55963 | cvent-group-supplier-network.pdf | ~850KB | https://www.inn-touch.ca/docs/DOC-55963 |
| Global Sales Resources | DOC-56219 | global-sales-resources.pdf | ~2.1MB | https://www.inn-touch.ca/docs/DOC-56219 |
| Global Sales Resources (French) | DOC-58319 | global-sales-resources-french.pdf | ~950KB | https://www.inn-touch.ca/docs/DOC-58319 |

### Category Images (10 total)

| Category | Image Filename | Location |
|----------|----------------|----------|
| Building Rapport & Strategic Qualifying | building-rapport.png | html/Building Rapport_files/2.png |
| External Sales Content Hub | external-sales-hub.png | html/External Sales_files/2.png |
| Handling Objections & Closing the Sale | handling-objections.png | html/Handling Objections_files/2.png |
| Lead Generation | lead-generation.png | html/Lead Generation_files/2.png |
| Local Sales Training Shorts | training-shorts.png | html/Local Sales Training_files/2.png |
| Market Segment Sales by Industry | market-segment-sales.png | html/Market Segment_files/2.png |
| Preparation & Connecting | preparation-connecting.png | html/Preparation_files/2.png |
| Presenting Your Hotel | presenting-hotel.png | html/Presenting_files/2.png |
| Sales Platforms | sales-platforms.png | html/Sales Platforms_files/2.png |
| Sales Tools & Resources | sales-tools.png | html/Sales Tools_files/2.png |

---

## Troubleshooting

### PDF Download Requires Login

**Issue**: PDF URLs redirect to inn-touch.ca login page

**Solution**:
1. Open private/incognito browser window
2. Login to inn-touch.ca first
3. Then download PDFs (session will be authenticated)
4. OR: Use Option A (manual UI upload) instead of scripts

### Image Not Found

**Issue**: `_files` directory doesn't exist for a category

**Cause**: HTML page wasn't saved with images

**Solution**:
1. Re-visit category page while logged into inn-touch.ca
2. Save page: File → Save Page As → "Webpage, Complete"
3. Ensure "Webpage, Complete" option is selected (not "HTML Only")
4. Re-run image extraction

### ContentVersion Upload Fails

**Issue**: `FIELD_INTEGRITY_EXCEPTION: Invalid file size`

**Cause**: File too large (>2GB limit)

**Solution**: All InnTouch PDFs are <5MB, so this shouldn't happen. If it does:
1. Check file isn't corrupted
2. Try re-downloading PDF
3. Verify file size: `ls -lh file.pdf`

### Translation Update Fails

**Issue**: `FIELD_FILTER_VALIDATION_EXCEPTION: Value does not exist: Body__c`

**Cause**: Body__c field doesn't exist or is not editable

**Solution**:
1. Check field permissions
2. Verify Translation object has Body__c field
3. Use Rich Text Area type (not Long Text Area)

---

## Quick Reference Commands

### Extract Images (PowerShell)
```powershell
cd scraper
Get-ChildItem html\*_files -Directory | ForEach-Object {
    $img = Get-ChildItem $_.FullName -Filter "*.png" | Select-Object -First 1
    if ($img) { Copy-Item $img "output\images\$($_.Name -replace '_files').png" }
}
```

### List Downloaded Media
```bash
# PDFs
ls -lh scraper/output/pdfs/*.pdf

# Images
ls -lh scraper/output/images/*.png

# Total size
du -sh scraper/output/pdfs
du -sh scraper/output/images
```

### Verify Salesforce Upload (SOQL)
```sql
-- Check PDF uploads
SELECT Id, Title, ContentSize, FileType, CreatedDate
FROM ContentVersion
WHERE Title LIKE '%cvent%' OR Title LIKE '%global sales%'
ORDER BY CreatedDate DESC

-- Check linked files
SELECT ContentDocument.Title, LinkedEntity.Name
FROM ContentDocumentLink
WHERE LinkedEntity.Name LIKE '%cvent%'
```

---

## Automation

Once media is uploaded manually once, the GitHub Actions workflow can handle updates:

1. **Workflow detects new/changed PDFs** on inn-touch.ca
2. **Downloads with authenticated session** (credentials in GitHub Secrets)
3. **Uploads to Salesforce** via REST API
4. **Updates Translation Body__c** with new URLs
5. **Notifies via Slack** when complete

See: `GITHUB-ACTIONS-SETUP.md` for configuration.

---

## Next Steps

### After Manual Upload (Option A)
1. ✅ Test PDF downloads in QA org
2. ✅ Verify images display on category tabs
3. ✅ Update documentation with Salesforce URLs
4. ⏳ Set up automation for future updates

### After Automated Upload (Option B)
1. ✅ Verify upload-media-to-salesforce.js completed successfully
2. ✅ Check salesforce-upload-summary.json for results
3. ✅ Test PDF downloads in QA org
4. ✅ Verify Translation Body__c updated with Salesforce URLs

---

## Estimated Time

| Task | Option A (Manual) | Option B (Script) |
|------|------------------|-------------------|
| Extract images | 5 min | 1 min |
| Download PDFs | 10 min | N/A (requires auth) |
| Upload to Salesforce | 30 min | 5 min |
| Update translations | 15 min | Automatic |
| Verify | 5 min | 5 min |
| **Total** | **65 min** | **11 min** (+ setup time) |

**Recommendation**: Use Option A (Manual) for one-time upload. Set up Option B (Script) for ongoing automation.

---

## Support

**Cannot access inn-touch.ca?**
- Contact: [InnTouch admin contact]
- Request access to Local Sales Library

**Salesforce upload issues?**
- Check: Object permissions for Content__c, ContentVersion
- Verify: File upload permissions enabled
- Contact: Salesforce admin

**Script errors?**
- Check: Environment variables set correctly
- Verify: Connected App configured (see GITHUB-ACTIONS-SETUP.md)
- Debug: Run with `NODE_DEBUG=https node upload-media-to-salesforce.js`
