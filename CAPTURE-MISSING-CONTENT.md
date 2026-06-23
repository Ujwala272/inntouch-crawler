# How to Capture Missing InnTouch Content

## Problem

The saved HTML files are missing:
- ✗ Detailed overview text (Derrick Britt descriptions)
- ✗ Video embeds
- ✗ KEY CONTENT section with sub-topic links
- ✗ Dynamically loaded content

**Cause**: Content loads via JavaScript after page load, so "Save Page As" doesn't capture it.

---

## Solution Options

### Option 1: Browser DevTools Copy (Recommended - 10 min)

This captures the FULL rendered page including JavaScript content.

#### Steps:

1. **Login to InnTouch**:
   - Go to: https://www.inn-touch.ca
   - Login with your credentials

2. **Open Category Page**:
   - Navigate to: https://www.inn-touch.ca/community/local-sales-library/closing-the-sale
   - Wait for page to fully load (scroll down to see KEY CONTENT section)

3. **Open DevTools**:
   - Press `F12` or Right-click → Inspect
   - Click "Elements" or "Inspector" tab

4. **Copy Full HTML**:
   - In Elements tab, find `<html>` tag (very top)
   - Right-click `<html>`
   - Select "Copy" → "Copy outerHTML"

5. **Save to File**:
   - Open Notepad or VS Code
   - Paste (Ctrl+V)
   - Save as: `scraper/html-full/Handling-Objections-full.html`

6. **Repeat for Each Category**:
   - Do this for all 10 categories that have KEY CONTENT or videos
   - Priority: Handling Objections, Building Rapport, Preparation

#### Example Categories with Missing Content:

| Category | Has Video | Has KEY CONTENT | Priority |
|----------|-----------|-----------------|----------|
| Handling Objections & Closing the Sale | Yes | Yes | High |
| Building Rapport & Strategic Qualifying | Yes | Yes | High |
| Preparation & Connecting | Yes | Yes | High |
| Presenting Your Hotel | Yes | Yes | High |
| Lead Generation | Yes | Yes | Medium |
| Market Segment Sales by Industry | Yes | Yes | Medium |
| Local Sales Training Shorts | Yes | No | Medium |
| Sales Tools & Resources | Yes | No | Medium |
| External Sales Content Hub | Maybe | Yes | Low |
| Sales Platforms | No | Yes (already captured) | Done ✓ |

---

### Option 2: Browser Extension (15 min setup)

Use a browser extension that captures JavaScript content.

#### Recommended Extensions:

**SingleFile (Chrome/Firefox)**:
- Install: https://chrome.google.com/webstore → Search "SingleFile"
- Usage: Click extension icon → Saves complete page
- Pro: One-click capture
- Con: May miss some dynamic content

**Save Page WE (Firefox)**:
- Better for JavaScript-heavy sites
- Captures everything after page load

#### Steps:
1. Install extension
2. Login to InnTouch
3. Navigate to category page
4. Click extension icon
5. Wait for save complete
6. File saved to Downloads folder

---

### Option 3: Manual Copy-Paste (5 min per page)

Simplest but most manual.

#### What to Copy:

1. **Overview Text**:
   - Select all paragraph text in main content area
   - Copy and paste into text file
   - Save as: `overview-handling-objections.txt`

2. **Video URLs**:
   - Right-click video player
   - Select "Copy video URL" or inspect embed code
   - Note down Vimeo/YouTube URL

3. **KEY CONTENT Links**:
   - Manually copy each link text and URL
   - Save to CSV:
   ```csv
   Category,Link Text,URL
   Handling Objections,"Closing the Sale: Close with Commitment",https://...
   Handling Objections,"Closing the Sale: The Natural Outcome",https://...
   ```

---

## What Content to Capture

### For Each Category Page:

✓ **Overview Section**:
```
Watch as [Name], [Title], gives a brief overview of this section...
[Full paragraph text including all details]
```

✓ **Video Embeds**:
```html
<iframe src="https://player.vimeo.com/video/123456..." ...></iframe>
```
OR
```
Video URL: https://vimeo.com/123456789
```

✓ **KEY CONTENT Section**:
```
KEY CONTENT
• Closing the Sale: Close with Commitment → [URL]
• Closing the Sale: The Natural Outcome → [URL]
• Overcoming Objections with Clients → [URL]
• Handling Objections with Clients: Video Notes → [URL]
```

✓ **All Sub-Topic Links**:
- Document links (DOC-##### format)
- PDF downloads
- Sub-pages

---

## After Capturing Content

### Option A: Update Apex Script

I'll create an updated importer that includes:
- Full overview text
- Video embed codes
- KEY CONTENT sub-topics as child records
- All links in Translation Body__c

### Option B: Manual Update in Salesforce

Update existing Translation records:

1. **Navigate to Translation**:
   - Setup → Object Manager → Translations__c
   - Find: "Handling Objections & Closing the Sale"

2. **Update Body__c Field**:
```html
<div class="overview">
<p><strong>Watch as Derrick Britt, Director, Sales Canada, gives a brief overview...</strong></p>
<p>[Full overview text]</p>
</div>

<div class="video-section">
<h3>📹 Overview Video</h3>
<iframe src="https://player.vimeo.com/video/XXXXX" width="640" height="360" frameborder="0" allowfullscreen></iframe>
</div>

<div class="key-content">
<h3>🔑 KEY CONTENT</h3>
<ul>
<li><a href="/resources/doc-12345">Closing the Sale: Close with Commitment</a></li>
<li><a href="/resources/doc-12346">Closing the Sale: The Natural Outcome</a></li>
<li><a href="/resources/doc-12347">Overcoming Objections with Clients</a></li>
</ul>
</div>
```

3. **Save and Test**

---

## Quick Test - See What's Missing

Run this for one category first:

1. **Open Live Page**:
   ```
   https://www.inn-touch.ca/community/local-sales-library/closing-the-sale
   ```

2. **Compare to Your Org**:
   ```
   https://choicehotelsfranchise--qa.sandbox.my.site.com/Zx/resources?tabName=Reference&name=00002-local-sales-library-inntouch
   ```
   Click "Handling Objections & Closing the Sale" tab

3. **Note Missing Items**:
   - [ ] Full overview text with Derrick Britt description
   - [ ] Video player embed
   - [ ] KEY CONTENT section with 4+ sub-links
   - [ ] "Take the Self-Assessment" button
   - [ ] Additional resource links

---

## Automated Solution (If You Want Full Automation)

I can create a Puppeteer script that:
1. Logs into InnTouch with your credentials
2. Navigates to each category
3. Waits for JavaScript to load
4. Captures full rendered HTML
5. Extracts videos, KEY CONTENT, all links
6. Generates updated Apex import script

**Time**: ~30 min to set up, ~5 min to run

**Requirements**:
- Node.js installed
- InnTouch credentials
- Run locally (not GitHub Actions due to authentication)

Would you like me to create this?

---

## Priority Action Plan

### Immediate (10 min):
1. Open one category in browser while logged in
2. Copy full HTML using DevTools method
3. Save to file
4. I'll extract the missing content
5. Generate update script for Salesforce

### Short-term (30 min):
- Capture all 10 categories with DevTools method
- Extract all videos, KEY CONTENT, sub-links
- Update all Translation records in QA org

### Long-term (Optional):
- Set up Puppeteer automation for future updates
- Include in GitHub Actions workflow

---

## Need Help?

**Can't see KEY CONTENT on live page?**
- Scroll down - it may be below the fold
- Wait 5-10 seconds for content to load
- Check if you're logged in

**DevTools copy not working?**
- Try different browser (Chrome, Firefox, Edge)
- Clear cache and reload page
- Use Option 3 (manual copy-paste) instead

**Want me to create the Puppeteer script?**
- Let me know and I'll build it
- Requires your InnTouch credentials (stored locally only)
- Fully automated capture of all content

---

## Summary

The current HTML files are incomplete because they don't include JavaScript-loaded content. Use **Option 1 (DevTools Copy)** to capture the full rendered page, then I'll help update the Salesforce records with all the missing content.

**Next**: Open https://www.inn-touch.ca/community/local-sales-library/closing-the-sale in browser, copy full HTML using DevTools, and share the file or key content snippets.
