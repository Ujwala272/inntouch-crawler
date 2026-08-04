/**
 * Upload ChoiceCentral Local Marketing Support Suite files to Salesforce.
 * Reads generated-apex/choicecentral-local-marketing-file-manifest.json
 * (produced by generate-choicecentral-local-marketing-apex-import.js) and
 * uploads each downloaded file from choicecentral-local-marketing/downloads/
 * as a ContentVersion, linked via FirstPublishLocationId to the Content__c
 * record for the page it was found on - same pattern as
 * scraper/upload-media-to-salesforce.js.
 *
 * Prerequisite: ChoiceCentralLocalMarketingImporter.importAll() must have
 * already run in the target org, so the Content__c records exist to link to.
 *
 * Usage:
 *   SF_CLIENT_ID=... SF_CLIENT_SECRET=... SF_USERNAME=... SF_PASSWORD=... \
 *   SF_INSTANCE_URL=... node upload-choicecentral-local-marketing-files.js
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
  clientId: process.env.SF_CLIENT_ID,
  clientSecret: process.env.SF_CLIENT_SECRET,
  username: process.env.SF_USERNAME,
  password: process.env.SF_PASSWORD,
  instanceUrl: process.env.SF_INSTANCE_URL || 'https://test.salesforce.com',
  libraryPrefix: '00018-local-marketing-support-suite'
};

const DOWNLOADS_DIR = path.join(__dirname, 'choicecentral-local-marketing', 'downloads');
const MANIFEST_FILE = path.join(__dirname, 'generated-apex', 'choicecentral-local-marketing-file-manifest.json');

let accessToken = null;
let instanceUrl = null;

async function authenticate() {
  console.log('Authenticating with Salesforce...');

  const params = new URLSearchParams({
    grant_type: 'password',
    client_id: CONFIG.clientId,
    client_secret: CONFIG.clientSecret,
    username: CONFIG.username,
    password: CONFIG.password
  });

  const response = await fetch(`${CONFIG.instanceUrl}/services/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  if (!response.ok) {
    throw new Error(`Authentication failed: ${await response.text()}`);
  }

  const data = await response.json();
  accessToken = data.access_token;
  instanceUrl = data.instance_url;
  console.log('Authenticated successfully');
}

async function apiRequest(endpoint, method = 'GET', body = null) {
  if (!accessToken) await authenticate();

  const options = {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${instanceUrl}${endpoint}`, options);
  if (!response.ok) {
    throw new Error(`API request failed (${response.status}): ${await response.text()}`);
  }
  return response.json();
}

async function query(soql) {
  return apiRequest(`/services/data/v67.0/query?q=${encodeURIComponent(soql)}`);
}

async function uploadFile(title, filePath, firstPublishLocationId, description = '') {
  const fileData = fs.readFileSync(filePath);
  const base64Data = fileData.toString('base64');

  const result = await apiRequest('/services/data/v67.0/sobjects/ContentVersion', 'POST', {
    Title: title,
    PathOnClient: path.basename(filePath),
    VersionData: base64Data,
    FirstPublishLocationId: firstPublishLocationId,
    Description: description
  });

  if (!result.success) {
    throw new Error(`Failed to upload ${title}: ${JSON.stringify(result.errors)}`);
  }

  const cvQuery = await query(`SELECT ContentDocumentId FROM ContentVersion WHERE Id = '${result.id}'`);
  return {
    contentVersionId: result.id,
    contentDocumentId: cvQuery.records[0].ContentDocumentId,
    title,
    size: fileData.length
  };
}

async function getContentIdMap() {
  console.log('Querying Content__c records for this library...');
  const result = await query(
    `SELECT Id, Content_Unique_Id__c FROM Content__c WHERE Content_Unique_Id__c LIKE '${CONFIG.libraryPrefix}%'`
  );
  if (result.totalSize === 0) {
    throw new Error('No Content__c records found. Run ChoiceCentralLocalMarketingImporter.importAll() first.');
  }
  console.log(`  Found ${result.totalSize} Content__c records`);

  const map = new Map();
  for (const rec of result.records) {
    map.set(rec.Content_Unique_Id__c, rec.Id);
  }
  return map;
}

async function main() {
  console.log('=== ChoiceCentral Local Marketing File Uploader ===\n');

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'));
  const contentIdMap = await getContentIdMap();

  const results = { uploaded: 0, failed: 0, skippedNoRecord: 0, files: [] };

  for (const page of manifest.pages) {
    const contentId = contentIdMap.get(page.contentUniqueId);
    if (!contentId) {
      console.log(`  Skipping ${page.contentUniqueId} - no matching Content__c record found`);
      results.skippedNoRecord += page.documents.length;
      continue;
    }

    for (const doc of page.documents) {
      const filePath = path.join(DOWNLOADS_DIR, doc.filename);
      if (!fs.existsSync(filePath)) {
        console.log(`  Missing local file: ${doc.filename}`);
        results.failed++;
        continue;
      }

      try {
        const result = await uploadFile(doc.title || doc.filename, filePath, contentId, `Attachment for ${page.title}`);
        console.log(`  Uploaded: ${doc.title} -> ${page.title} (${Math.round(result.size / 1024)}KB)`);
        results.uploaded++;
        results.files.push({ ...result, pageTitle: page.title, contentUniqueId: page.contentUniqueId });
      } catch (error) {
        console.error(`  Failed to upload ${doc.filename}: ${error.message}`);
        results.failed++;
      }
    }
  }

  console.log('\n=== Upload Summary ===');
  console.log(`Uploaded: ${results.uploaded}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Skipped (no matching record): ${results.skippedNoRecord}`);

  const summaryPath = path.join(__dirname, 'choicecentral-local-marketing-upload-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2));
  console.log(`\nSummary saved to: ${summaryPath}`);
}

main().catch(error => {
  console.error('\nFatal error:', error.message);
  process.exit(1);
});
