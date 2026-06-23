# InnTouch Local Sales Library - Testing Guide

Complete testing checklist for the deployed library in QA org.

---

## Quick Test (5 minutes)

### 1. Access the Library

**Direct URL**:
```
https://choicehotelsfranchise--qa.sandbox.my.site.com/Zx/resources?tabName=Reference&name=00002-local-sales-library-inntouch
```

**OR via Reference Guides Page**:
```
https://choicehotelsfranchise--qa.sandbox.my.site.com/Zx/resources?tabName=Reference
```
Look for "Local Sales Library" card and click it.

### 2. Quick Checks

- [ ] Library landing page loads
- [ ] Hero banner shows "Local Sales Library"
- [ ] Overview tab is selected by default
- [ ] You see 10 category tabs
- [ ] Topic area cards display (10 categories)
- [ ] Featured guides section appears (4 articles)

**Expected Result**: All items checked = ✅ Basic test passed

---

## Detailed Testing Checklist

### A. Library Landing Page

#### Hero Section
- [ ] Library icon displays (white square icon)
- [ ] Library name: "Local Sales Library"
- [ ] Summary text displays below name
- [ ] Search bar visible (if not on Overview tab)
- [ ] Background banner image loads

#### Breadcrumb
- [ ] "< Reference" link appears
- [ ] Click it → returns to Reference Guides page
- [ ] Navigate back → Overview tab is still active

#### Topic Tabs
- [ ] **Overview** tab (first, active by default)
- [ ] Building Rapport & Strategic Qualifying
- [ ] External Sales Content Hub
- [ ] Handling Objections & Closing the Sale
- [ ] Lead Generation
- [ ] Local Sales Training Shorts
- [ ] Market Segment Sales by Industry
- [ ] Preparation & Connecting
- [ ] Presenting Your Hotel
- [ ] Sales Platforms
- [ ] Sales Tools & Resources

**Total tabs**: 11 (Overview + 10 categories)

---

### B. Overview Tab Content

#### Welcome Section
- [ ] Heading: "Welcome to Local Sales Library"
- [ ] Body text paragraph displays
- [ ] Thumbnail/overview image (if available)
- [ ] Layout: Desktop = 2 columns (text left, image right)
- [ ] Layout: Mobile = stacked (title, image, body)

#### Topic Areas Cards
- [ ] Section heading: "Topic Areas"
- [ ] 10 category cards display in grid (2 columns desktop)
- [ ] Each card shows:
  - [ ] Category name as heading
  - [ ] Brief summary text
  - [ ] Topics/keywords (if applicable)
- [ ] Click a card → navigates to that category tab

#### Featured Reference Guides
- [ ] Section heading: "Featured Reference Guides"
- [ ] 4 article cards display
- [ ] Each card shows:
  - [ ] Article title
  - [ ] Summary text
  - [ ] "View Details" link/arrow
- [ ] Desktop: 3 cards per page with pagination dots
- [ ] Mobile: Horizontal scroll with dots
- [ ] Click card → opens article detail page

---

### C. Category Tabs (Test 2-3)

#### Sales Platforms Tab (Priority - has articles)
- [ ] Click "Sales Platforms" tab
- [ ] Category hero banner displays with name overlay
- [ ] Summary text appears
- [ ] 4 articles listed:
  - [ ] Cvent Business Transient RFP
  - [ ] Cvent Group Supplier Network
  - [ ] Global Sales iNN-touch Resources
  - [ ] Global Sales iNN-touch Resources (French)
- [ ] Click article title → opens article detail

#### Building Rapport & Strategic Qualifying Tab
- [ ] Click tab
- [ ] Hero banner displays
- [ ] Summary: "How do you turn a lead into a source of business..."
- [ ] Content displays (topics/articles if any)

#### External Sales Content Hub Tab
- [ ] Click tab
- [ ] Hero banner displays
- [ ] Summary: "A comprehensive collection of resources..."
- [ ] Content displays

---

### D. Article Detail Pages (Critical Test)

#### Test Article: "Cvent Business Transient RFP"

1. **Navigation**:
   - [ ] From Sales Platforms tab, click article title
   - [ ] Article detail page loads

2. **Header**:
   - [ ] Article title displays: "Cvent Business Transient RFP"
   - [ ] Banner image (if available)
   - [ ] Breadcrumb shows path back

3. **Body Content**:
   - [ ] Summary text displays
   - [ ] PDF Download section appears with:
     - [ ] Heading: "Download PDF"
     - [ ] PDF filename: "Sales Platforms - Cvent Business Transient RFP-Lanyon.pdf"
     - [ ] Blue "Download PDF" button
     - [ ] Note about external hosting
   - [ ] Styling: Gray box with blue left border

4. **PDF Download**:
   - [ ] Click "Download PDF" button
   - [ ] Opens in new tab
   - [ ] PDF downloads from inn-touch.ca
   - [ ] File opens successfully

5. **Related Content**:
   - [ ] "Related Library" or "Related Guides" section appears
   - [ ] Shows parent library or sibling articles

#### Test 2-3 More Articles
- [ ] Cvent Group Supplier Network → PDF downloads
- [ ] Global Sales iNN-touch Resources → PDF downloads
- [ ] French version → PDF downloads

---

### E. Search Functionality

#### On Library Landing Page (Non-Overview Tab)
1. [ ] Navigate to any category tab (search bar appears)
2. [ ] Type: "Cvent"
3. [ ] Results filter in real-time
4. [ ] Articles with "Cvent" in title appear
5. [ ] Clear search → all content returns

#### Global Header Search
1. [ ] Click search icon in header
2. [ ] Type: "Local Sales"
3. [ ] Dropdown shows "Local Sales Library" in results
4. [ ] Click result → navigates to library

#### Full Search Results Page
1. [ ] Navigate to full search page
2. [ ] Search: "Global Sales"
3. [ ] "Libraries" or "Reference" tab shows results
4. [ ] Local Sales Library appears in results
5. [ ] Click → navigates to library

---

### F. Responsive Testing

#### Desktop (1920x1080)
- [ ] Hero banner full width
- [ ] Topic cards in 2-column grid
- [ ] Featured guides: 3 per page
- [ ] All images load correctly
- [ ] No horizontal scroll

#### Tablet (768x1024)
- [ ] Layout adapts to narrower width
- [ ] Topic cards stack to 1 column (or 2 narrow)
- [ ] Featured guides adjust
- [ ] Navigation remains accessible

#### Mobile (375x667)
- [ ] Hero: Title → Image → Body (vertical stack)
- [ ] Topic cards: 1 column
- [ ] Featured guides: Horizontal swipe carousel
- [ ] Tabs accessible (scroll if needed)
- [ ] Download buttons full width
- [ ] No text cutoff

**Test on**:
- [ ] Chrome (desktop)
- [ ] Chrome (mobile device mode - F12)
- [ ] Safari (iOS if available)
- [ ] Edge

---

### G. User Role & Visibility Testing

#### Canada User (Should See Library)
1. [ ] Login as user with Region = Canada
2. [ ] Navigate to Reference page
3. [ ] Local Sales Library card visible
4. [ ] Click through → library accessible
5. [ ] All content displays

#### US User (Should NOT See Library - Region Filter)
1. [ ] Login as user with Region = USA (or not Canada)
2. [ ] Navigate to Reference page
3. [ ] Local Sales Library card should NOT appear
4. [ ] Direct URL access → check if blocked or visible

**Expected**: Only Canada region users see the library

#### Different Brands (Should All See - Brand = null/All)
- [ ] Ascend user → Library visible
- [ ] Comfort user → Library visible
- [ ] Quality Inn user → Library visible

#### Different Roles (Should All See - Role = null/All)
- [ ] Sales Manager → Library visible
- [ ] GM → Library visible
- [ ] Regional Director → Library visible

---

### H. Performance Testing

#### Page Load Times
- [ ] Library landing page: < 3 seconds
- [ ] Category tab switch: < 1 second
- [ ] Article detail: < 2 seconds
- [ ] PDF download initiation: < 2 seconds

#### Console Errors
1. [ ] Open browser DevTools (F12)
2. [ ] Navigate through library
3. [ ] Check Console tab for errors:
   - [ ] No JavaScript errors
   - [ ] No 404 missing resources
   - [ ] No broken image links

#### Network Requests
1. [ ] DevTools → Network tab
2. [ ] Load library page
3. [ ] Check:
   - [ ] All API calls successful (200 status)
   - [ ] Images load (not 404)
   - [ ] No excessive duplicate requests

---

### I. Data Verification (Backend)

#### Salesforce Records (Use Developer Console or Workbench)

**Query 1: Check Library Record**
```sql
SELECT Id, Name, Content_Unique_Id__c, Content_Type__c, 
       Status__c, Brand__c, Region__c, Role__c
FROM Content__c 
WHERE Content_Unique_Id__c = '00002-local-sales-library-inntouch'
```

**Expected**:
- 1 record
- Content_Type__c = 'Library'
- Status__c = 'Published'
- Region__c = 'Canada'
- Brand__c = null
- Role__c = null

---

**Query 2: Check Categories**
```sql
SELECT Id, Name, Content_Unique_Id__c, Content_Type__c, 
       Parent_Content__c, Library__c
FROM Content__c 
WHERE Content_Unique_Id__c LIKE '00002-local-sales-library%' 
  AND Content_Type__c = 'Reference Guides'
  AND Parent_Content__r.Content_Type__c = 'Library'
```

**Expected**:
- 10 records (categories)
- All have Parent_Content__c = Library ID
- All have Library__c = Library ID
- Content_Type__c = 'Reference Guides'

---

**Query 3: Check Articles**
```sql
SELECT Id, Name, Content_Unique_Id__c, Content_Article_URL__c
FROM Content__c 
WHERE Content_Unique_Id__c LIKE '%doc-%'
  AND Library__c IN (
    SELECT Id FROM Content__c 
    WHERE Content_Unique_Id__c = '00002-local-sales-library-inntouch'
  )
```

**Expected**:
- 4 records (articles)
- DOC-55954, DOC-55963, DOC-56219, DOC-58319
- All have Content_Article_URL__c populated

---

**Query 4: Check Translations**
```sql
SELECT Id, Content__c, Name, Title__c, Summary__c, 
       Status__c, Version__c
FROM Translations__c 
WHERE Content__r.Library__c IN (
    SELECT Id FROM Content__c 
    WHERE Content_Unique_Id__c = '00002-local-sales-library-inntouch'
  )
ORDER BY Content__r.Name
```

**Expected**:
- 15 records (1 library + 10 categories + 4 articles)
- Name = 'English' (not auto-ID)
- Version__c = 1
- Status__c = 'Published'
- Body__c contains HTML with <p> tags

---

**Query 5: Check PDF Links in Body**
```sql
SELECT Content__r.Name, Body__c
FROM Translations__c 
WHERE Content__r.Content_Unique_Id__c LIKE '%doc-%'
  AND Body__c LIKE '%Download PDF%'
```

**Expected**:
- 4 records
- Body__c contains:
  - "Download PDF" heading
  - PDF filename
  - `<a href="https://www.inn-touch.ca/servlet/JiveServlet/downloadBody/...">` link
  - Blue button styling

---

### J. Known Issues to Document

While testing, note any issues:

#### Issue Template
```
**Issue**: [Brief description]
**Severity**: High / Medium / Low
**Steps to Reproduce**:
1. 
2. 
3. 

**Expected**: [What should happen]
**Actual**: [What actually happens]
**Screenshot**: [If applicable]
```

#### Common Issues to Watch For
- [ ] Images not loading (broken links)
- [ ] PDF download fails (404 or authentication required)
- [ ] Layout breaks on mobile
- [ ] Search returns no results
- [ ] Category tabs don't switch
- [ ] Translation text missing or incorrect

---

## Test Results Summary

### Quick Test Checklist

After completing all tests, fill in:

| Test Area | Status | Notes |
|-----------|--------|-------|
| Library Landing Page | ☐ Pass ☐ Fail | |
| Overview Tab | ☐ Pass ☐ Fail | |
| Category Tabs (10) | ☐ Pass ☐ Fail | |
| Article Detail (4) | ☐ Pass ☐ Fail | |
| PDF Downloads (4) | ☐ Pass ☐ Fail | |
| Search Functionality | ☐ Pass ☐ Fail | |
| Responsive Design | ☐ Pass ☐ Fail | |
| Visibility Filtering | ☐ Pass ☐ Fail | |
| Performance | ☐ Pass ☐ Fail | |
| Data Verification | ☐ Pass ☐ Fail | |

**Overall Status**: ☐ PASSED ☐ FAILED (with issues)

---

## Automated Testing (Optional)

If you want to automate testing:

### Salesforce CLI Queries
```bash
# Check library exists
sf data query --query "SELECT Id, Name FROM Content__c WHERE Content_Unique_Id__c = '00002-local-sales-library-inntouch'" --target-org qa

# Check all content records
sf data query --query "SELECT COUNT() FROM Content__c WHERE Content_Unique_Id__c LIKE '00002-local-sales-library%'" --target-org qa

# Check translations
sf data query --query "SELECT COUNT() FROM Translations__c WHERE Content__r.Library__c IN (SELECT Id FROM Content__c WHERE Content_Unique_Id__c = '00002-local-sales-library-inntouch')" --target-org qa
```

### Browser Automation (Puppeteer)
Create `test-library.js`:
```javascript
const puppeteer = require('puppeteer');

async function testLibrary() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Navigate to library
    await page.goto('https://choicehotelsfranchise--qa.sandbox.my.site.com/Zx/resources?tabName=Reference&name=00002-local-sales-library-inntouch');
    
    // Check title
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check tabs
    const tabs = await page.$$eval('.tab-selector', tabs => tabs.length);
    console.log('Number of tabs:', tabs);
    
    await browser.close();
}

testLibrary();
```

---

## Rollback Plan (If Issues Found)

If testing reveals critical issues:

### Quick Disable (No Data Loss)
```apex
// Set all content to Draft status
List<Content__c> allContent = [
    SELECT Id FROM Content__c 
    WHERE Content_Unique_Id__c LIKE '00002-local-sales-library%'
];
for (Content__c c : allContent) {
    c.Status__c = 'Draft';
}
update allContent;
```

### Full Rollback (Delete All)
```apex
// Delete all library content and translations
List<Content__c> allContent = [
    SELECT Id FROM Content__c 
    WHERE Content_Unique_Id__c LIKE '00002-local-sales-library%'
];
delete allContent;  // Cascade deletes translations via lookup
```

### Re-import After Fix
```apex
// After fixing issues, re-run import
LocalSalesLibraryImporter_v3.importAll();
```

---

## Next Steps After Testing

### If All Tests Pass ✅
1. Document test results
2. Share library URL with stakeholders
3. Set up GitHub Actions automation
4. Schedule content updates
5. Plan media upload phase

### If Issues Found ⚠️
1. Document all issues with screenshots
2. Prioritize by severity (High/Medium/Low)
3. Fix high-priority issues first
4. Re-test after fixes
5. Update this testing guide with new test cases

---

## Support Contacts

**Technical Issues**:
- Salesforce admin: [Your admin contact]
- Developer: [Your dev contact]

**Content Issues**:
- InnTouch access: [InnTouch admin]
- Sales operations: [Sales ops contact]

**Questions about Testing**:
- Reference this guide
- Check deployment analysis: `analysis/2026-06-19_inntouch-library-deployment-qa.md`

---

**Testing Time Estimate**:
- Quick test: 5 minutes
- Detailed test: 30-45 minutes
- Full test + documentation: 1-2 hours

**Recommended**: Start with Quick Test, then do Detailed Test if issues found.
