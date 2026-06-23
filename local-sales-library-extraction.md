# Local Sales Library - Content Extraction

**Source:** https://www.inn-touch.ca/community/local-sales-library  
**Extraction Date:** June 18, 2026  
**Purpose:** Import into Salesforce `ccViewLibraryContent` component

---

## Library Overview

**Title:** Local Sales Library  
**Description:** Welcome to the Local Sales Library, full of the knowledge, tools and resources you need to tackle local sales.  
**Welcome Message:** "Watch as Derrick Britt, our Director, Sales Canada, welcomes you to our Local Sales Library, full of the knowledge, tools and resources you need to tackle local sales. We know the idea of taking on local sales can be scary. But we're here to take the fear out of the process."

**Welcome Video:** Vimeo video ID: 647352932 (https://player.vimeo.com/video/647352932)

**Self-Assessment Link:** https://www.surveymonkey.com/r/J9L53XV

---

## Content Categories (Main Topics)

The library is organized into **10 main categories**, each represented as a clickable card/tile:

### 1. Lead Generation
- **Image URL:** https://www.inn-touch.ca/servlet/JiveServlet/downloadImage/102-56140-3-317790/477-341/MainPage_LeadGeneration.jpg
- **Target URL:** https://www.inn-touch.ca/community/local-sales-library/lead-generation
- **Document ID:** DOC-56140
- **Content ID:** 56140

### 2. Building Rapport & Strategic Qualifying
- **Image URL:** https://www.inn-touch.ca/servlet/JiveServlet/downloadImage/102-56146-1-317796/MainPage_BuildingRapport$StrategicQualifying.jpg
- **Target URL:** https://www.inn-touch.ca/community/local-sales-library/building-rapport
- **Document ID:** DOC-56146
- **Content ID:** 56146

### 3. Handling Objections & Closing the Sale
- **Image URL:** https://www.inn-touch.ca/servlet/JiveServlet/downloadImage/102-56142-1-317792/MainPage_HandlingObjections&ClosingTheSale.jpg
- **Target URL:** https://www.inn-touch.ca/community/local-sales-library/closing-the-sale
- **Document ID:** DOC-56142
- **Content ID:** 56142

### 4. Sales Tools & Resources
- **Image URL:** https://www.inn-touch.ca/servlet/JiveServlet/downloadImage/102-56144-2-317794/MainPage_SalesTools.jpg
- **Target URL:** https://www.inn-touch.ca/community/local-sales-library/sales-tools
- **Document ID:** DOC-56144
- **Content ID:** 56144

### 5. Local Sales Training Shorts
- **Image URL:** https://www.inn-touch.ca/servlet/JiveServlet/downloadImage/102-57937-3-363613/631-451/MainPage_SalesTrainingShorts.jpg
- **Target URL:** https://www.inn-touch.ca/community/local-sales-library/local-sales-training-shorts/pages/home
- **Document ID:** DOC-57937
- **Content ID:** 57937
- **Note:** This links to a subspace/child library

### 6. Preparation & Connecting
- **Image URL:** https://www.inn-touch.ca/servlet/JiveServlet/downloadImage/102-56141-2-317791/MainPage_Preperation.jpg
- **Target URL:** https://www.inn-touch.ca/community/local-sales-library/preparation
- **Document ID:** DOC-56141
- **Content ID:** 56141

### 7. Presenting Your Hotel
- **Image URL:** https://www.inn-touch.ca/servlet/JiveServlet/downloadImage/102-56143-1-317793/MainPage_PresentingYourHotel.jpg
- **Target URL:** https://www.inn-touch.ca/community/local-sales-library/presenting-your-hotel
- **Document ID:** DOC-56143
- **Content ID:** 56143

### 8. Market Segment Sales by Industry
- **Image URL:** https://www.inn-touch.ca/servlet/JiveServlet/downloadImage/102-56147-1-317797/MainPage_MarketSegment&SalesByIndustry.jpg
- **Target URL:** https://www.inn-touch.ca/community/local-sales-library/market-segment-sales-by-industry
- **Document ID:** DOC-56147
- **Content ID:** 56147

### 9. Sales Platforms
- **Image URL:** https://www.inn-touch.ca/servlet/JiveServlet/downloadImage/102-56145-1-317795/MainPage_SalesPlatforms.jpg
- **Target URL:** https://www.inn-touch.ca/community/local-sales-library/sales-platforms
- **Document ID:** DOC-56145
- **Content ID:** 56145

### 10. External Sales Content Hub
- **Image URL:** https://www.inn-touch.ca/servlet/JiveServlet/downloadImage/102-57938-2-363611/428-306/MainPage_ExternalSalesContentHub.jpg
- **Target URL:** https://www.inn-touch.ca/community/local-sales-library/external-sales-content-hub/pages/home
- **Document ID:** DOC-57938
- **Content ID:** 57938
- **Note:** This links to a subspace/child library

---

## Recommended Information Architecture for Salesforce

### Parent Library Record
```
Content__c (Library)
├── Name: "Local Sales Library"
├── Content_Unique_Id__c: "local-sales-library"
├── Content_Type__c: "Library"
├── Status__c: "Published"
```

### Parent Translation
```
Translations__c
├── Title__c: "Local Sales Library"
├── Summary__c: "Your one-stop resource for local sales tools, knowledge, and training"
├── Body__c: "<p>Watch as Derrick Britt, our Director, Sales Canada, welcomes you to our Local Sales Library...</p>"
```

### Recommended Category Structure

Since the inn-touch.ca library appears to be **flat** (all categories at the same level), I recommend organizing into **3 parent categories** for better navigation in Salesforce:

#### Category 1: Sales Process
**Sub-topics:**
- Lead Generation
- Preparation & Connecting
- Building Rapport & Strategic Qualifying
- Presenting Your Hotel
- Handling Objections & Closing the Sale

#### Category 2: Sales Enablement
**Sub-topics:**
- Sales Tools & Resources
- Sales Platforms
- Market Segment Sales by Industry

#### Category 3: Training & Resources
**Sub-topics:**
- Local Sales Training Shorts
- External Sales Content Hub

---

## Next Steps Required

### Step 1: Download Category Sub-Pages
Each of the 10 category URLs listed above needs to be visited and saved as HTML to extract:
- Category description/overview
- List of articles/documents under each category
- Article titles, summaries, and content
- Any embedded videos, PDFs, or downloadable resources

**Action Required:** 
Navigate to each URL (while logged in) and save the complete HTML for:
1. `/community/local-sales-library/lead-generation`
2. `/community/local-sales-library/building-rapport`
3. `/community/local-sales-library/closing-the-sale`
4. `/community/local-sales-library/sales-tools`
5. `/community/local-sales-library/local-sales-training-shorts/pages/home`
6. `/community/local-sales-library/preparation`
7. `/community/local-sales-library/presenting-your-hotel`
8. `/community/local-sales-library/market-segment-sales-by-industry`
9. `/community/local-sales-library/sales-platforms`
10. `/community/local-sales-library/external-sales-content-hub/pages/home`

### Step 2: Download Images
Save all category banner images locally:
- `MainPage_LeadGeneration.jpg`
- `MainPage_BuildingRapport$StrategicQualifying.jpg`
- `MainPage_HandlingObjections&ClosingTheSale.jpg`
- `MainPage_SalesTools.jpg`
- `MainPage_SalesTrainingShorts.jpg`
- `MainPage_Preperation.jpg`
- `MainPage_PresentingYourHotel.jpg`
- `MainPage_MarketSegment&SalesByIndustry.jpg`
- `MainPage_SalesPlatforms.jpg`
- `MainPage_ExternalSalesContentHub.jpg`

### Step 3: Create Data Import Files
Once all sub-pages are extracted, create:
1. **Library record CSV** (1 row - parent library)
2. **Topics CSV** (13 rows - 3 parent categories + 10 sub-topics)
3. **Content records CSV** (one row per article found in categories)
4. **Translations CSV** (matching translations for all content)
5. **Content_Topic junctions CSV** (linking articles to topics)

---

## Metadata Notes

- **Space ID:** 52106 (objectID: 52106, browseID: 6191)
- **Space Name:** "Local Sales Library"
- **Space Type:** Community/Space (typeID: 5)
- **Blog URL:** /community/local-sales-library/blog
- **Feed URL:** /community/feeds?community=52106
- **Created by:** CHC Communications (userID: 52041, username: chc_communications@choicehotels.ca)

---

## Additional Features to Consider

### Self-Assessment Integration
The library includes a self-assessment survey. Consider:
- Creating a Salesforce form to replace the SurveyMonkey link
- Storing assessment results in Salesforce custom objects
- Triggering follow-up tasks for Regional Directors

### Video Content
The welcome video should be:
- Embedded in the Overview section body using `<lightning-formatted-rich-text>`
- Or uploaded to Salesforce Files and referenced via ContentVersion

---

## Questions for User

Before proceeding with the full extraction, please confirm:

1. **Do you want me to create a Node.js/Puppeteer script** to automatically crawl all 10 category pages and extract their content?
2. **Or would you prefer to manually download** each category page as HTML and provide them to me?
3. **Should I preserve the flat structure** (all 10 categories at the same level) or **organize hierarchically** (3 parent categories with sub-topics)?
4. **Do you want to include the self-assessment** integration in Salesforce, or keep it as an external SurveyMonkey link?
5. **Should the Welcome Video** be embedded directly in the Overview section, or just linked?
