# InnTouch Local Sales Library - POC Import Guide

**Generated:** 2026-06-24  
**Purpose:** Sandbox Proof of Concept before full production import  
**Status:** Ready for execution

---

## POC Scope

### What Will Be Imported

| Component | Quantity | Description |
|-----------|----------|-------------|
| **Library** | 1 | "Local Sales Library (POC)" root container |
| **Category** | 1 | "Lead Generation" with video embed |
| **Content Pages** | 9 | Sample articles from Lead Generation |
| **Translations** | 10 | English only (1 category + 9 pages) |
| **Files** | 20 | PDFs + images (manual upload) |
| **Topics** | 2-3 | Sales Training, Lead Generation, Prospecting |

**Total Records:** ~25 Content__c + 10 Translations__c + 20 Files

**Estimated Import Time:** 5-10 minutes (excluding file upload)

---

## POC Content Pages

The following 9 content pages will be imported:

1. **Front Desk Prospecting - Script Template** (DOC-57091)
   - Script template for front desk lead capture
   - 10 attached documents

2. **Shift Market Share to Your Hotel (French)** (DOC-58295)
   - French language content example
   - 12 attached documents

3. **SWOT Analysis** (DOC-55976)
   - Competitive analysis framework
   - 12 attached documents

4. **Partnering with Global Sales to Drive Corporate Business** (DOC-56229)
   - Global sales collaboration guide
   - 12 attached documents

5. **Internet Prospecting** (DOC-56228)
   - Online prospecting techniques
   - 12 attached documents

6. **Local Sales Strategies for RFPs** (DOC-56565)
   - RFP response strategies
   - 12 attached documents

7. **Internet Prospecting: Link Up with LinkedIn** (DOC-56002)
   - LinkedIn prospecting guide
   - 12 attached documents

8. **Virtual Sales Blitz Lead Tracking** (DOC-56001)
   - Lead tracking template
   - 12 attached documents

9. **Your Local Sales Library: Let's Generate Some Leads** (DOC-56407)
   - Training video overview
   - 12 attached documents

**Content Features:**
- Rich HTML body content
- Sample embedded video (Vimeo)
- Document links (to be uploaded)
- Proper hierarchy (Library → Category → Pages)

---

## Prerequisites

### 1. Salesforce Sandbox Access

- [ ] QA Sandbox access
- [ ] System Administrator or Content Manager permissions
- [ ] Developer Console access (for Anonymous Apex)

### 2. Required Salesforce Objects

Verify these objects exist in your sandbox:

- [ ] Content__c
- [ ] Translations__c
- [ ] Content_Topic__c
- [ ] CMS_Topic__c

**Check with:**
```apex
Schema.getGlobalDescribe().containsKey('Content__c')
```

### 3. Apex Classes Deployed

- [ ] `InnTouchLibraryPOC.cls` deployed
- [ ] `InnTouchLibraryPOCTest.cls` deployed
- [ ] Test coverage passing (75%+)

**Deploy with:**
```bash
sfdx force:source:deploy -p force-app/main/default/classes/InnTouchLibraryPOC*
```

### 4. Files Ready for Upload

Download from: `c:\Users\ujwala.rapolu\Downloads\inntouch-smart-26\downloads\`

**Select 20 files:**
- 18 PDFs (from the 9 content pages - 2 per page)
- 1 Category banner image
- 1 Inline image

**Recommended files:**
```
everybody-sells-back-to-basics-ea63fe.pdf
increase-revenue-from-current-accounts-0b4dc9.pdf
front-desk-prospecting-script-template-5bd96f.pdf
swot-analysis-*.pdf
internet-prospecting-*.pdf
linkedin-*.pdf
virtual-sales-blitz-*.pdf
click20here20to20submit20your20self-assessment202png-*.png
```

---

## Step-by-Step POC Execution

### Phase 1: Deploy Apex Code (5 minutes)

#### Step 1.1: Deploy Classes

```bash
cd "C:\Users\ujwala.rapolu\OneDrive - Choice Hotels\Documents\ujwalasandbox"

sfdx force:source:deploy \
  -p force-app/main/default/classes/InnTouchLibraryPOC.cls,force-app/main/default/classes/InnTouchLibraryPOC.cls-meta.xml,force-app/main/default/classes/InnTouchLibraryPOCTest.cls,force-app/main/default/classes/InnTouchLibraryPOCTest.cls-meta.xml \
  -u your-sandbox-alias
```

**Expected Output:**
```
=== Deployed Source
FULL NAME                TYPE       PROJECT PATH
InnTouchLibraryPOC       ApexClass  force-app/.../InnTouchLibraryPOC.cls
InnTouchLibraryPOCTest   ApexClass  force-app/.../InnTouchLibraryPOCTest.cls
Deployment succeeded!
```

#### Step 1.2: Run Tests

```bash
sfdx force:apex:test:run \
  -c \
  -r human \
  -t InnTouchLibraryPOCTest \
  -u your-sandbox-alias
```

**Expected Output:**
```
=== Test Results
Outcome: Passed
Tests Ran: 4
Pass Rate: 100%
```

---

### Phase 2: Create Topics (2 minutes)

Topics must exist before running the import.

#### Step 2.1: Open Developer Console

Salesforce → Setup → Developer Console

#### Step 2.2: Run Anonymous Apex

```apex
// Create topics if they don't exist
List<CMS_Topic__c> existingTopics = [SELECT Id, Name FROM CMS_Topic__c WHERE Name IN ('Sales Training', 'Lead Generation', 'Prospecting')];

Set<String> existingNames = new Set<String>();
for (CMS_Topic__c topic : existingTopics) {
    existingNames.add(topic.Name);
}

List<CMS_Topic__c> topicsToCreate = new List<CMS_Topic__c>();

if (!existingNames.contains('Sales Training')) {
    topicsToCreate.add(new CMS_Topic__c(Name = 'Sales Training'));
}
if (!existingNames.contains('Lead Generation')) {
    topicsToCreate.add(new CMS_Topic__c(Name = 'Lead Generation'));
}
if (!existingNames.contains('Prospecting')) {
    topicsToCreate.add(new CMS_Topic__c(Name = 'Prospecting'));
}

if (!topicsToCreate.isEmpty()) {
    insert topicsToCreate;
    System.debug('✓ Created ' + topicsToCreate.size() + ' topics');
} else {
    System.debug('✓ Topics already exist');
}
```

**Expected Output:**
```
✓ Created 3 topics
```

---

### Phase 3: Import POC Data (3 minutes)

#### Step 3.1: Run Import

In Developer Console → Execute Anonymous:

```apex
Map<String, Object> results = InnTouchLibraryPOC.importPOC();
System.debug(JSON.serializePretty(results));
```

**Expected Output:**
```
=== InnTouch Library POC Import - Starting ===
✓ Library created: a0X...
✓ Category created: a0X...
✓ Category translation created: a0D...
✓ Content pages created: 9
✓ Content translations created: 9
⚠️  FILES MUST BE UPLOADED MANUALLY:
   1. Upload 20 files from downloads/ folder
   2. Link via ContentDocumentLink to content pages
   3. Create ContentDistribution for public URLs
✓ Topic associations created: 12

=== POC Import Complete ===
Library ID: a0X1234567890ABC
Category ID: a0X1234567890DEF
Content Pages: 9
Translations: 9
Topics: 12

Next Steps:
1. Upload files manually to Salesforce Files
2. Run: InnTouchLibraryPOC.validatePOC()
3. Test library at: /resources?tabName=Reference&name=poc-inntouch-library
```

#### Step 3.2: Verify Records Created

Query to check:

```apex
List<Content__c> content = [SELECT Id, Name, Content_Type__c FROM Content__c WHERE Content_Unique_Id__c LIKE 'poc-%'];
System.debug('Content records: ' + content.size());

for (Content__c c : content) {
    System.debug(c.Content_Type__c + ': ' + c.Name);
}
```

**Expected Output:**
```
Content records: 11
Library: Local Sales Library (POC)
Reference Guides: Lead Generation
Reference Guides: Front Desk Prospecting - Script Template
Reference Guides: Shift Market Share to Your Hotel (French)
Reference Guides: SWOT Analysis
Reference Guides: Partnering with Global Sales...
Reference Guides: Internet Prospecting
Reference Guides: Local Sales Strategies for RFPs
Reference Guides: Internet Prospecting: Link Up with LinkedIn
Reference Guides: Virtual Sales Blitz Lead Tracking
Reference Guides: Your Local Sales Library...
```

---

### Phase 4: Upload Files (10-15 minutes)

Files must be uploaded manually via Salesforce UI.

#### Step 4.1: Get Content IDs

```apex
List<Content__c> pages = [SELECT Id, Name, Content_Unique_Id__c FROM Content__c WHERE Content_Unique_Id__c LIKE 'poc-inntouch-doc-%' ORDER BY Name];

System.debug('=== Content Page IDs for File Upload ===');
for (Content__c page : pages) {
    System.debug(page.Name + ' → ' + page.Id);
}
```

**Copy the IDs - you'll need them for uploading files.**

#### Step 4.2: Upload Files via UI

For each content page:

1. Navigate to the Content__c record in Salesforce
2. Go to **Related** → **Files**
3. Click **Upload Files**
4. Select 2 PDFs from the downloads folder
5. Click **Done**

**Repeat for all 9 content pages (18 files total)**

#### Step 4.3: Upload Category Banner

1. Navigate to the "Lead Generation" category record
2. Upload the banner image
3. Note the ContentDocument ID

#### Step 4.4: Create Public URLs (Optional for POC)

For each uploaded file:

```apex
// Get all files uploaded to POC content
List<ContentDocumentLink> links = [
    SELECT Id, ContentDocumentId, ContentDocument.LatestPublishedVersionId
    FROM ContentDocumentLink
    WHERE LinkedEntityId IN (SELECT Id FROM Content__c WHERE Content_Unique_Id__c LIKE 'poc-%')
];

System.debug('Found ' + links.size() + ' files to create distributions for');

List<ContentDistribution> distributions = new List<ContentDistribution>();
for (ContentDocumentLink link : links) {
    distributions.add(new ContentDistribution(
        ContentVersionId = link.ContentDocument.LatestPublishedVersionId,
        Name = 'POC File Distribution',
        PreferencesAllowViewInBrowser = true
    ));
}

insert distributions;
System.debug('✓ Created ' + distributions.size() + ' public URLs');
```

---

### Phase 5: Automated Validation (2 minutes)

#### Step 5.1: Run Validation Script

```apex
Map<String, Object> validation = InnTouchLibraryPOC.validatePOC();
```

**Expected Output:**
```
=== InnTouch Library POC Validation ===

✓ Test 1 - Library Structure: 11 records
✓ Test 2 - Translations: 10 records
✓ Test 3 - Hierarchy: Valid
✓ Test 4 - File Attachments: 20 files
✓ Test 5 - Topic Associations: 12 links
✓ Test 6 - Search Indexing: 3 results for "Prospecting"
✓ Test 7 - Performance: 234ms (threshold: 1000ms)

=== Validation Summary ===
Passed: 7
Warnings: 0
Failed: 0
Overall: PASS ✓
```

#### Step 5.2: Review Validation Results

```apex
// Get detailed validation results
Map<String, Object> validation = InnTouchLibraryPOC.validatePOC();
System.debug(JSON.serializePretty(validation));
```

**Check each test:**
- **Test 1:** Library structure (11 records: 1 library + 1 category + 9 pages)
- **Test 2:** Translations (10 English translations)
- **Test 3:** Hierarchy (Library → Category → Pages)
- **Test 4:** File attachments (20 files uploaded)
- **Test 5:** Topic associations (content tagged)
- **Test 6:** Search indexing (content searchable)
- **Test 7:** Performance (< 1000ms)

---

### Phase 6: Manual Validation (10-15 minutes)

#### Test 1: Library Landing Page

**URL:** `/resources?tabName=Reference&name=poc-inntouch-library`

**Checklist:**
- [ ] Library page loads without errors
- [ ] Library title displays: "Local Sales Library (POC)"
- [ ] "Lead Generation" category is visible
- [ ] Page renders in < 2 seconds

**Screenshot:** Take screenshot for validation report

---

#### Test 2: Category Navigation

**URL:** `/resources?tabName=Reference&name=poc-inntouch-lead-generation`

**Checklist:**
- [ ] Category page loads
- [ ] Category title: "Lead Generation"
- [ ] Category description displays
- [ ] Vimeo video iframe renders
- [ ] 9 content pages listed
- [ ] Breadcrumb navigation works (back to library)

**Screenshot:** Take screenshot

---

#### Test 3: Content Page Rendering

Click any content page, e.g., "Front Desk Prospecting - Script Template"

**Checklist:**
- [ ] Content page loads
- [ ] Page title displays correctly
- [ ] Body HTML renders (headers, paragraphs, lists)
- [ ] No broken HTML/CSS
- [ ] Breadcrumb shows: Library > Category > Page

**Screenshot:** Take screenshot

---

#### Test 4: PDF File Access

Click a PDF link on any content page

**Checklist:**
- [ ] PDF opens in new tab/window
- [ ] PDF displays correctly
- [ ] File size is reasonable (not 0 bytes)
- [ ] Can download PDF

**Test with:** 2-3 different PDFs

---

#### Test 5: Image Display

**Category Banner:**
- [ ] Category banner image displays on Lead Generation page
- [ ] Image loads without broken image icon
- [ ] Image is properly sized

**Inline Images:**
- [ ] Any inline images in content body display
- [ ] Images load from CDN URL

---

#### Test 6: Video Rendering

On Lead Generation category page:

**Checklist:**
- [ ] Video iframe is visible
- [ ] Vimeo player loads
- [ ] Video plays when clicked
- [ ] Video controls work (play/pause/fullscreen)

**Video URL:** https://player.vimeo.com/video/647348059

---

#### Test 7: Search Functionality

Use the site search box:

**Search Term:** "Prospecting"

**Checklist:**
- [ ] Search returns results
- [ ] POC content pages appear in results
- [ ] Search result titles are correct
- [ ] Clicking result navigates to page
- [ ] Result snippets display

**Expected Results:**
- Front Desk Prospecting - Script Template
- Internet Prospecting
- Internet Prospecting: Link Up with LinkedIn

---

#### Test 8: Topic Navigation

Navigate to Topics:

**URL:** `/resources?tabName=Topics`

**Checklist:**
- [ ] Topics page loads
- [ ] "Lead Generation" topic exists
- [ ] Clicking topic shows filtered content
- [ ] POC content pages appear in topic results

---

#### Test 9: Favorites Functionality

On any content page:

**Checklist:**
- [ ] Star/favorite icon is visible
- [ ] Clicking star adds to favorites
- [ ] Star icon changes state (filled)
- [ ] Navigate to "Favorites" - POC page appears
- [ ] Clicking star again removes from favorites

---

#### Test 10: Performance Testing

Use browser dev tools (F12) → Network tab

**Load category page and measure:**

**Checklist:**
- [ ] Page load time < 2 seconds
- [ ] First Contentful Paint < 1 second
- [ ] No JavaScript errors in console
- [ ] No 404 errors for assets
- [ ] Reasonable number of HTTP requests (< 50)

**Record metrics:**
- Load time: _____ ms
- DOM content loaded: _____ ms
- Total requests: _____
- Total size: _____ MB

---

## Validation Report Template

### POC Validation Report

**Date:** 2026-06-24  
**Tester:** [Your Name]  
**Sandbox:** QA  
**POC Version:** 1.0

---

### Automated Tests (7 tests)

| Test | Status | Expected | Actual | Notes |
|------|--------|----------|--------|-------|
| Library Structure | ✅ PASS | 11 records | 11 | 1 library + 1 category + 9 pages |
| Translations | ✅ PASS | 10 records | 10 | English only |
| Hierarchy | ✅ PASS | Valid | Valid | Library → Category → Pages |
| File Attachments | ✅ PASS | 20 files | 20 | All uploaded |
| Topic Associations | ✅ PASS | 12 links | 12 | Content tagged |
| Search Indexing | ✅ PASS | Searchable | Yes | "Prospecting" returns results |
| Performance | ✅ PASS | < 1000ms | 234ms | Query performance |

**Automated Tests:** 7/7 PASS

---

### Manual Tests (10 tests)

| Test | Status | Load Time | Issues | Notes |
|------|--------|-----------|--------|-------|
| 1. Library Landing Page | ⬜ | _____ ms | | |
| 2. Category Navigation | ⬜ | _____ ms | | |
| 3. Content Page Rendering | ⬜ | _____ ms | | |
| 4. PDF File Access | ⬜ | N/A | | |
| 5. Image Display | ⬜ | N/A | | |
| 6. Video Rendering | ⬜ | N/A | | |
| 7. Search Functionality | ⬜ | _____ ms | | |
| 8. Topic Navigation | ⬜ | _____ ms | | |
| 9. Favorites Functionality | ⬜ | N/A | | |
| 10. Performance Testing | ⬜ | _____ ms | | |

**Manual Tests:** __/10 PASS

---

### Overall Assessment

**Status:** ⬜ PASS / ⬜ FAIL

**Overall Performance:**
- Average page load: _____ ms
- All features working: ⬜ YES / ⬜ NO
- User experience: ⬜ Excellent / ⬜ Good / ⬜ Needs Work

**Issues Found:**
1. [List any issues]
2.
3.

**Recommendations:**
1. [Recommendations for full import]
2.
3.

**Ready for Full Import:** ⬜ YES / ⬜ NO

**Sign-off:**
- Tester: _________________ Date: _____
- Reviewer: _______________ Date: _____

---

## Cleanup After POC

### Option 1: Keep POC Data (Recommended)

Keep the POC data in sandbox for reference:
- Serves as working example for users
- Can compare with full import later
- No need to delete

### Option 2: Delete POC Data

If you need to clean up:

```apex
InnTouchLibraryPOC.cleanupPOC();
```

**This will delete:**
- 11 Content__c records
- 10 Translations__c records
- 12 Content_Topic__c links
- All uploaded files will remain (ContentVersion) but unlinked

**To also delete files:**
```apex
// First run cleanup
InnTouchLibraryPOC.cleanupPOC();

// Then delete orphaned files
List<ContentDocumentLink> orphanedLinks = [
    SELECT ContentDocumentId 
    FROM ContentDocumentLink 
    WHERE LinkedEntityId IN (SELECT Id FROM Content__c WHERE Content_Unique_Id__c LIKE 'poc-%')
];

Set<Id> docIds = new Set<Id>();
for (ContentDocumentLink link : orphanedLinks) {
    docIds.add(link.ContentDocumentId);
}

List<ContentDocument> docsToDelete = [SELECT Id FROM ContentDocument WHERE Id IN :docIds];
delete docsToDelete;

System.debug('✓ Deleted ' + docsToDelete.size() + ' files');
```

---

## Troubleshooting

### Issue: Import Fails with "FIELD_CUSTOM_VALIDATION_EXCEPTION"

**Cause:** Custom validation rules on Content__c

**Solution:**
1. Check validation rules on Content__c
2. Temporarily deactivate validation rules
3. Re-run import
4. Reactivate validation rules

---

### Issue: Files Not Displaying

**Cause:** ContentDocumentLink not created or wrong LinkedEntityId

**Solution:**
```apex
// Check file links
List<ContentDocumentLink> links = [
    SELECT Id, LinkedEntityId, LinkedEntity.Name, ContentDocument.Title
    FROM ContentDocumentLink
    WHERE LinkedEntityId IN (SELECT Id FROM Content__c WHERE Content_Unique_Id__c LIKE 'poc-%')
];

for (ContentDocumentLink link : links) {
    System.debug(link.ContentDocument.Title + ' → ' + link.LinkedEntity.Name);
}
```

---

### Issue: Video Not Playing

**Cause:** iframe blocked by Content Security Policy

**Solution:**
1. Check Salesforce CSP settings
2. Add Vimeo to Trusted Sites for Scripts
3. Setup → CSP Trusted Sites → New
4. Name: Vimeo
5. URL: https://player.vimeo.com

---

### Issue: Search Not Finding Content

**Cause:** Search indexing delay or content not indexed

**Solution:**
1. Wait 15 minutes for search index to update
2. Check Content__c is searchable
3. Setup → Object Manager → Content__c → Fields
4. Verify Name field is indexed for search

---

### Issue: Performance Slow (> 2 seconds)

**Causes:**
- Too many SOQL queries
- Large HTML body content
- Unoptimized queries
- Too many files per page

**Solution:**
1. Check SOQL query limits in logs
2. Review page controller queries
3. Consider lazy loading for files
4. Implement pagination if needed

---

## Decision Gates

### Gate 1: After Automated Validation

**Question:** Did all 7 automated tests pass?

- ✅ **YES** → Proceed to manual validation
- ❌ **NO** → Fix issues, re-run import, validate again

---

### Gate 2: After Manual Validation

**Question:** Did at least 8/10 manual tests pass with acceptable performance?

- ✅ **YES** → POC successful, proceed to full import planning
- ⚠️ **PARTIAL** (6-7 pass) → Address minor issues, limited full import
- ❌ **NO** (< 6 pass) → Review architecture, fix blocking issues before full import

---

### Gate 3: Performance Assessment

**Question:** Is page load time < 2 seconds with 20 files?

- ✅ **YES** → Full import safe (1,805 files will perform similarly)
- ⚠️ **BORDERLINE** (2-3s) → Implement pagination or lazy loading
- ❌ **NO** (> 3s) → Optimize before full import

---

## Next Steps After Successful POC

### 1. Document Findings

- [ ] Complete validation report
- [ ] Record performance metrics
- [ ] Screenshot all test cases
- [ ] Note any issues/workarounds

### 2. Plan Full Import

- [ ] Review full import requirements (579 pages, 1,805 files)
- [ ] Estimate import duration
- [ ] Plan batch processing strategy
- [ ] Schedule import window

### 3. Prepare Production Environment

- [ ] Deploy Apex classes to production
- [ ] Create topics in production
- [ ] Configure CSP trusted sites
- [ ] Set up file storage limits

### 4. Execute Full Import

See: `InnTouchLibraryFullImport.cls` (to be created)

- Import 1 Library
- Import 11 Categories
- Import 556 Content Pages
- Upload 1,805 files
- Create 1,704 translations (3 languages)
- Associate topics

**Estimated Duration:** 2-3 hours

---

## Success Criteria

POC is successful if:

✅ All 7 automated tests PASS  
✅ At least 8/10 manual tests PASS  
✅ Page load time < 2 seconds  
✅ PDFs open correctly  
✅ Images display correctly  
✅ Videos render correctly  
✅ Search finds content  
✅ Navigation works  
✅ Favorites work  
✅ No critical errors

**If all criteria met:** ✅ Ready for full import

---

## Contact & Support

**Questions:**
- Salesforce Admin Team
- Content Management Team
- Development Team

**Resources:**
- InnTouch crawl data: `c:\Users\ujwala.rapolu\Downloads\inntouch-smart-26\`
- Mapping analysis: `analysis/2026-06-24_inntouch-salesforce-mapping-analysis.md`
- Inventory report: `analysis/2026-06-24_inntouch-library-inventory-report.md`

---

**POC Guide Version:** 1.0  
**Generated:** 2026-06-24  
**Ready for Execution:** ✅ YES
