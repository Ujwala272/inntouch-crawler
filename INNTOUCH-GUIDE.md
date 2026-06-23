# 🚀 INN-Touch Scraper - Quick Start Guide

Complete guide to extract Local Sales Library content from inn-touch.ca and import into Salesforce.

---

## ✅ Setup Complete!

Your scraper project is ready at: `scraper/`

All required files have been created:
- ✅ `package.json` - NPM dependencies
- ✅ `scraper.js` - Main Puppeteer scraper (400+ lines)
- ✅ `setup.js` - Interactive credential setup
- ✅ `create-env.js` - Generate .env from credentials.txt
- ✅ `manual-extract.js` - Extract from saved HTML
- ✅ `credentials.txt` - Credentials template
- ✅ `.env.example` - Configuration template
- ✅ `.gitignore` - Security (protects credentials)
- ✅ `README.md` - Full documentation

---

## 📋 Next Steps (Choose Your Path)

### Path A: Automated Scraping (Recommended if npm works)

1. **Install Dependencies**
   ```bash
   cd scraper
   npm install
   ```
   *If this fails due to network issues, see Path B*

2. **Configure Credentials**
   ```bash
   notepad credentials.txt
   ```
   Edit these lines:
   ```
   USERNAME=your_actual_email@choicehotels.ca
   PASSWORD=your_actual_password
   ```
   Save and close.

3. **Generate .env**
   ```bash
   node create-env.js
   del credentials.txt
   ```

4. **Test Authentication**
   ```bash
   npm run test
   ```

5. **Run Full Scrape**
   ```bash
   npm run scrape
   ```

---

### Path B: Manual HTML Extraction (If npm fails)

1. **Log in to inn-touch.ca**
   Navigate to: https://www.inn-touch.ca/community/local-sales-library

2. **Save Homepage**
   - Right-click → Save Page As → "Webpage, Complete"
   - Save to: `scraper/html/homepage.html`

3. **Save Each Category Page**
   Navigate to each of these 10 URLs and save as HTML:
   - `/community/local-sales-library/lead-generation`
   - `/community/local-sales-library/building-rapport`
   - `/community/local-sales-library/closing-the-sale`
   - `/community/local-sales-library/sales-tools`
   - `/community/local-sales-library/local-sales-training-shorts/pages/home`
   - `/community/local-sales-library/preparation`
   - `/community/local-sales-library/presenting-your-hotel`
   - `/community/local-sales-library/market-segment-sales-by-industry`
   - `/community/local-sales-library/sales-platforms`
   - `/community/local-sales-library/external-sales-content-hub/pages/home`

4. **Run Manual Extraction**
   ```bash
   cd scraper
   node manual-extract.js
   ```

5. **I'll parse the HTML files** and create the JSON data for import

---

## 📤 Output Structure

After scraping completes, you'll have:

```
scraper/output/
├── library-complete.json    # Everything in one file
├── library-overview.json    # Library overview only
├── categories.json          # All 10 categories
├── articles.json            # All articles/guides
├── html/                    # Saved HTML snapshots
│   ├── homepage.html
│   ├── lead-generation.html
│   └── ...
├── images/                  # Downloaded category banners
│   ├── lead-generation.jpg
│   └── ...
└── csv/                     # Ready for Data Loader
    ├── library.csv
    ├── categories.csv
    └── articles.csv
```

---

## 🔧 Troubleshooting

### npm install fails with ECONNRESET
**Problem:** Corporate proxy or network timeout

**Solution 1:** Retry with longer timeout
```bash
npm install --legacy-peer-deps --fetch-timeout=60000 --fetch-retries=5
```

**Solution 2:** Use Path B (Manual HTML Extraction)

### Login fails
**Problem:** Invalid credentials or account locked

**Solutions:**
- Verify credentials in `.env` file
- Try logging in manually at https://www.inn-touch.ca first
- Contact IT if account is locked

### Scraping times out
**Problem:** Slow network or site performance

**Solutions:**
- Edit `scraper.js`, change `timeout: 60000` to `timeout: 120000`
- Run with `HEADLESS=false` to watch what's happening
- Use Path B (Manual HTML Extraction)

---

## 🎯 After Scraping: Import to Salesforce

Once you have `output/library-complete.json`, I'll help you:

1. **Upload Images to Static Resources**
   - Create Static Resource: `LocalSalesLibraryAssets`
   - Upload all images from `output/images/`

2. **Generate Apex Import Script**
   - Run: `/inntouch import`
   - This creates: `LocalSalesLibraryImporter.cls`

3. **Deploy to Salesforce**
   ```bash
   sf project deploy start --source-dir force-app/main/default/classes/LocalSalesLibraryImporter.cls
   ```

4. **Run Import Script**
   - Open Developer Console
   - Execute Anonymous:
     ```apex
     LocalSalesLibraryImporter.importLibrary();
     ```

5. **Verify Data**
   - Query: `SELECT Id, Name FROM Content__c WHERE Content_Unique_Id__c = 'local-sales-library'`
   - Navigate to: `/resources?tabName=Reference&name=local-sales-library&type=Library`
   - Verify the library displays correctly

---

## 📊 Current Status

✅ **Scraper project created**  
✅ **All files in place**  
⏳ **npm install** - (in progress or needs retry)  
⏳ **Credentials** - Need to configure  
⏳ **Scraping** - Ready to run  
⏳ **Import to Salesforce** - After scraping completes

---

## 🆘 Need Help?

**Which step are you on?**
1. npm install failing → Try Path B
2. Credentials setup → Edit `credentials.txt`
3. Scraping errors → Check troubleshooting section
4. Import to Salesforce → Run `/inntouch import` after scraping

**Want me to:**
- Parse the HTML file you already provided?
- Create the Apex import script now?
- Help troubleshoot npm install?

Just let me know!

---

## 🔐 Security Reminders

- ✅ `.env` is gitignored (credentials safe)
- ✅ `credentials.txt` should be deleted after use
- ✅ Never commit credentials to version control
- ✅ All files in `scraper/` directory are local only

---

## 📚 Skill Commands Available

Use these commands anytime:

```bash
/inntouch setup       # ✅ Already done!
/inntouch install     # Install npm dependencies
/inntouch configure   # Setup credentials
/inntouch scrape      # Run full automated scrape
/inntouch extract     # Extract from HTML files
/inntouch import      # Generate Apex import script
```

---

**Ready to proceed?** 

Let me know which path you want to take:
- **A** - Continue with npm install
- **B** - Use manual HTML extraction
- **C** - Parse the HTML you already provided
