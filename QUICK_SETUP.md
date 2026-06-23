# Quick Setup Guide - 5 Minutes

## Step 1: Initialize Git (if not done)

```bash
cd "C:\Users\ujwala.rapolu\OneDrive - Choice Hotels\Documents\ujwalasandbox"
git init
git add .
git commit -m "Add crawler with GitHub Actions"
```

## Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `inntouch-crawler` (or your choice)
3. **Make it PRIVATE** ⚠️
4. Do NOT initialize with README
5. Click "Create repository"

## Step 3: Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/inntouch-crawler.git
git branch -M main
git push -u origin main
```

## Step 4: Add Secrets

Go to: `https://github.com/YOUR_USERNAME/inntouch-crawler/settings/secrets/actions`

Click "New repository secret" twice to add:

1. **Name:** `INNTOUCH_USERNAME`  
   **Value:** (your InnTouch username)

2. **Name:** `INNTOUCH_PASSWORD`  
   **Value:** (your InnTouch password)

## Step 5: Run the Workflow

1. Go to `Actions` tab in your GitHub repo
2. Click `Crawler Dependency Install & Test`
3. Click `Run workflow` (right side)
4. Click green `Run workflow` button
5. Wait ~3-5 minutes

## Step 6: Download Results

After workflow completes:
1. Scroll to bottom of workflow run
2. Click `crawler-output-XXXXX` under Artifacts
3. Extract ZIP to get:
   - `test_library_content.json`
   - `test_library_content.csv`

## Success Looks Like

In the workflow logs you should see:

```
✅ Crawler module loaded successfully
🚀 Starting crawl...
🔐 Authentication successful!
✅ Crawled 5 pages

📊 CRAWL SUMMARY
Pages crawled:      5
Categories:         X
Errors:             0
```

## What This Gives You

✅ All npm dependencies installed in GitHub Actions  
✅ Playwright Chromium browser installed  
✅ Quick test validates authentication works  
✅ Output JSON and CSV ready for Salesforce import  
✅ Bypasses corporate firewall completely

## Next Steps

**Option A: Get node_modules for Local Development**
- See `GITHUB_ACTIONS_SETUP.md` for how to download node_modules
- Copy to local `crawler/` directory
- Run crawler locally with full config

**Option B: Run Full Crawl in CI**
- Edit `.github/workflows/crawler-test.yml`
- Change from quick test config to full config
- Remove `--no-download` to get PDFs and images
- Run workflow again for full 100-page crawl

## Troubleshooting

**"No workflows found"**
→ Make sure you pushed the `.github/workflows/crawler-test.yml` file

**"Authentication failed"**
→ Double-check secrets are spelled exactly: `INNTOUCH_USERNAME` and `INNTOUCH_PASSWORD`

**"No pages extracted"**
→ Check the logs for specific errors - site structure may have changed

## Files Created

- `.github/workflows/crawler-test.yml` - GitHub Actions workflow
- `GITHUB_ACTIONS_SETUP.md` - Detailed documentation
- `QUICK_SETUP.md` - This quick reference (you are here)

---

**Ready?** Start with Step 1 above! 🚀
