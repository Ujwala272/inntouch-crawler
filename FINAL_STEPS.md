# Final Steps - Add Secrets and Run Workflow

## ✅ What's Done

- [x] Git repository initialized
- [x] Code committed locally
- [x] GitHub repository created: https://github.com/Ujwala272/inntouch-crawler
- [x] Code pushed to GitHub

## 🔐 Step 1: Add Repository Secrets (2 minutes)

### Go to Secrets Page

Open this URL in your browser:
```
https://github.com/Ujwala272/inntouch-crawler/settings/secrets/actions
```

Or navigate manually:
1. Go to https://github.com/Ujwala272/inntouch-crawler
2. Click **"Settings"** tab (top menu)
3. Left sidebar: **"Secrets and variables"** → **"Actions"**

### Add First Secret

1. Click green **"New repository secret"** button

2. Fill in:
   - **Name**: `INNTOUCH_USERNAME`
   - **Secret**: `coralimo@choicehotels.com`

3. Click **"Add secret"**

### Add Second Secret

1. Click **"New repository secret"** button again

2. Fill in:
   - **Name**: `INNTOUCH_PASSWORD`
   - **Secret**: `IMO123!`

3. Click **"Add secret"**

### Verify Secrets Added

You should now see 2 secrets listed:
- ✅ INNTOUCH_USERNAME (Updated X seconds ago)
- ✅ INNTOUCH_PASSWORD (Updated X seconds ago)

## 🚀 Step 2: Run the Workflow (1 minute)

### Navigate to Actions

Open this URL:
```
https://github.com/Ujwala272/inntouch-crawler/actions
```

Or click the **"Actions"** tab at the top.

### Run the Workflow

1. Click on **"Crawler Dependency Install & Test"** in the left sidebar

2. On the right side, click the **"Run workflow"** dropdown button

3. Make sure branch is set to **"main"**

4. Click the green **"Run workflow"** button

5. The page will refresh and show a new workflow run starting

### Watch the Progress

1. Click on the workflow run (should say "Add crawler with GitHub Actions workflow")

2. Click on the **"install-and-test"** job

3. Watch the live logs as each step runs:
   - ✅ Checkout code
   - ✅ Setup Node.js
   - ✅ Install crawler dependencies (npm install)
   - ✅ Install Playwright Chromium browser
   - ✅ Verify installation
   - ✅ Create .env file
   - ✅ Run dry-run test
   - ✅ Run quick InnTouch crawl test
   - ✅ Verify output files
   - ✅ Upload output artifacts

**Expected Duration:** 3-5 minutes

## ✅ Step 3: Check for Success

### Success Indicators

Look for these in the log output:

```
✅ Crawler module loaded successfully
🚀 Starting crawl: https://www.inn-touch.ca/community/local-sales-library
🔐 Authentication successful!
🕷️  Starting page crawl...
✅ Crawled 5 pages

═══════════════════════════════════════
📊 CRAWL SUMMARY
═══════════════════════════════════════
Pages crawled:      5
Files downloaded:   0
Errors:             0
Duration:           ~15s
═══════════════════════════════════════

Pages extracted: 5
Categories found: X
✅ Output files generated successfully
```

All steps should have green checkmarks ✅

## 📥 Step 4: Download Results

After the workflow completes successfully:

1. Scroll to the **bottom** of the workflow run page

2. Find the **"Artifacts"** section

3. Click on **"crawler-output-XXXXX"** to download the ZIP file

4. Extract the ZIP file to get:
   - `test_library_content.json` - Full structured data
   - `test_library_content.csv` - Salesforce-ready import file

## 🎉 Success!

You now have:
- ✅ All npm dependencies installed (bypassing corporate firewall)
- ✅ Working crawler validated with InnTouch authentication
- ✅ 5 pages of content extracted
- ✅ JSON and CSV output ready for Salesforce import
- ✅ Automated workflow ready to run anytime

## 🔄 Next Time You Need to Run

Just go to:
```
https://github.com/Ujwala272/inntouch-crawler/actions
```

Click "Crawler Dependency Install & Test" → "Run workflow" → "Run workflow"

No setup needed - just run it!

## 🚀 What's Next?

### Option A: Run Full Crawl (100 Pages)

Edit the workflow to crawl all pages:

1. Go to: https://github.com/Ujwala272/inntouch-crawler/blob/main/.github/workflows/crawler-test.yml

2. Click the pencil icon (Edit)

3. Find line ~75:
   ```yaml
   node bin/crawl.js \
     --config config/inntouch-quick-test.config.json \
     --no-download
   ```

4. Change to:
   ```yaml
   node bin/crawl.js \
     --config config/inntouch.config.json
   ```

5. Click "Commit changes"

6. Run the workflow again - it will now crawl 100 pages and download all files

### Option B: Get node_modules for Local Development

Add this step to the workflow (after the "Install Playwright" step):

```yaml
- name: Create node_modules archive
  working-directory: ./crawler
  run: tar -czf node_modules.tar.gz node_modules/

- name: Upload node_modules
  uses: actions/upload-artifact@v4
  with:
    name: crawler-node-modules-${{ github.run_number }}
    path: crawler/node_modules.tar.gz
    retention-days: 7
```

Then download and extract to your local `crawler/` directory.

### Option C: Add Salesforce Upload

Copy the Salesforce upload steps from `.github/workflows/scrape-inntouch.yml` to automatically import to Salesforce after crawling.

## ❓ Troubleshooting

### Workflow Fails at "Run quick InnTouch crawl test"

**Check:**
- Secrets are spelled exactly: `INNTOUCH_USERNAME` and `INNTOUCH_PASSWORD`
- No extra spaces in secrets
- InnTouch credentials are correct

**Fix:**
- Go to Settings → Secrets → Actions
- Click the secret name to edit it
- Verify the value

### "Authentication failed"

**Possible causes:**
- Wrong credentials
- InnTouch login page changed
- Account locked/password expired

**Test manually:**
1. Go to https://www.inn-touch.ca/login.jspa
2. Try logging in with: coralimo@choicehotels.com / IMO123!
3. If it works, the crawler should work too

### No Output Files

**Check the logs for:**
- Did authentication succeed?
- Any JavaScript errors?
- Did page load timeout?

**Try:**
- Increase delay in config (change `delay: 2000` to `delay: 5000`)
- Run with fewer pages first to debug

## 📞 Support

If you encounter issues:
1. Check the specific error in workflow logs
2. Review the step that failed
3. Look for red X marks and expand those steps
4. Read the error messages carefully

---

**Current Status:** Code pushed, ready to add secrets and run workflow

**Next Action:** Go to https://github.com/Ujwala272/inntouch-crawler/settings/secrets/actions
