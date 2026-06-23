# GitHub Actions Setup for Crawler

## What Was Created

A new GitHub Actions workflow has been created at:
`.github/workflows/crawler-test.yml`

This workflow will:
1. Install all crawler npm dependencies
2. Install Playwright Chromium browser
3. Verify the installation
4. Run a quick InnTouch crawl test (5 pages)
5. Upload output files as artifacts

## Prerequisites

### 1. Initialize Git Repository (if not already done)

```bash
cd "C:\Users\ujwala.rapolu\OneDrive - Choice Hotels\Documents\ujwalasandbox"
git init
git add .
git commit -m "Initial commit with crawler"
```

### 2. Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository (e.g., `ujwalasandbox` or `inntouch-crawler`)
3. **Important:** Make it **PRIVATE** (contains credentials references)
4. Do NOT initialize with README (we already have files)

### 3. Connect Local to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### 4. Add Repository Secrets

Go to your GitHub repository:
`Settings` → `Secrets and variables` → `Actions` → `New repository secret`

Add these secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `INNTOUCH_USERNAME` | Your InnTouch username | Authentication for InnTouch |
| `INNTOUCH_PASSWORD` | Your InnTouch password | Authentication for InnTouch |

**How to add a secret:**
1. Click "New repository secret"
2. Name: `INNTOUCH_USERNAME`
3. Value: Your actual InnTouch username
4. Click "Add secret"
5. Repeat for `INNTOUCH_PASSWORD`

## Running the Workflow

### Manual Trigger

1. Go to your GitHub repository
2. Click the `Actions` tab
3. Select `Crawler Dependency Install & Test` workflow
4. Click `Run workflow` button (right side)
5. Click green `Run workflow` button

The workflow will start and you can watch the progress in real-time.

### Automatic Triggers

The workflow also runs automatically when:
- You push changes to the `crawler/` directory
- You create a pull request that modifies `crawler/`

## Viewing Results

### While Running

1. Go to `Actions` tab
2. Click on the running workflow
3. Click on the `install-and-test` job
4. Expand each step to see live logs

### After Completion

1. Scroll to bottom of workflow run
2. Under **Artifacts** section, download:
   - `crawler-output-XXXXX.zip` - Contains JSON and CSV output files

### Success Indicators

Look for these in the workflow logs:

```
✅ Crawler module loaded successfully
✅ Crawled 5 pages

📊 CRAWL SUMMARY
Pages crawled:      5
Files downloaded:   0
Errors:             0
```

## Downloading Output Files

1. Go to completed workflow run
2. Scroll to **Artifacts** section at bottom
3. Click `crawler-output-XXXXX` to download ZIP
4. Extract ZIP to get:
   - `test_library_content.json`
   - `test_library_content.csv`

## Troubleshooting

### Workflow Doesn't Appear

- Make sure you pushed the `.github/workflows/crawler-test.yml` file
- Check you're looking in the `Actions` tab (not Issues/Pull Requests)

### Authentication Fails

- Verify secrets are set correctly (no extra spaces)
- Secret names must match exactly: `INNTOUCH_USERNAME` and `INNTOUCH_PASSWORD`
- Check InnTouch login page hasn't changed

### No Output Files

- Check the "Run quick InnTouch crawl test" step logs
- Look for error messages about authentication or selectors
- The site structure may have changed - selectors might need updating

## Next Steps After Successful Test

Once the quick test (5 pages) works in GitHub Actions:

1. **Run Full Crawl Locally** - After you get `node_modules/` from CI
2. **Download node_modules from CI:**
   - Add a step to the workflow to upload `node_modules/` as artifact
   - Download and extract to your local `crawler/` directory
   - OR copy from another machine where npm install worked

3. **Alternative: Run Full Crawl in CI:**
   - Modify workflow to use full config instead of quick test
   - Change to: `--config config/inntouch.config.json`
   - This will crawl 100 pages and download files

## Workflow File Location

The workflow is committed at:
```
.github/workflows/crawler-test.yml
```

You can edit this file to:
- Change number of pages (modify `maxPages` in config)
- Enable file downloads (remove `--no-download` flag)
- Add Salesforce upload step (like the old scraper workflow)
- Add Slack notifications
- Schedule automatic runs (add `schedule` trigger)

## Getting node_modules for Local Use

If you want to copy the installed dependencies back to your local machine:

1. Add this step to the workflow (before the test step):

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

2. Run the workflow
3. Download `crawler-node-modules-XXXXX.zip`
4. Extract and copy to your local `crawler/` directory
5. You can now run crawler locally without npm install!

## Security Notes

- Repository should be **PRIVATE** (contains credential references)
- Never commit `.env` file with actual credentials
- Secrets are encrypted and not visible in logs
- Output artifacts are only accessible to repo collaborators

## Support

If you encounter issues:
1. Check workflow logs for specific error messages
2. Verify secrets are set correctly
3. Test InnTouch login manually in browser
4. Check if InnTouch site structure has changed
