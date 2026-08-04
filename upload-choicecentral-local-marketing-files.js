#!/usr/bin/env node
/**
 * Upload ChoiceCentral Local Marketing Support Suite files to Salesforce.
 * Reads generated-apex/choicecentral-local-marketing-file-manifest.json
 * (produced by generate-choicecentral-local-marketing-apex-import.js) and
 * uploads each downloaded file from choicecentral-local-marketing/downloads/
 * as a ContentVersion, linked via FirstPublishLocationId to the Content__c
 * record for the page it was found on.
 *
 * Auth: reuses the already-authenticated `sf` CLI session for the target
 * org alias (via `sf org display --target-org <alias> --json`) - same
 * pattern as link-choice-privileges-files.js and migrate-marketing-suite-to-qa.js.
 * No Connected App / stored username-password needed, just `sf org login`
 * (or an existing session) for that alias.
 *
 * Prerequisite: ChoiceCentralLocalMarketingImporter.importAll() must have
 * already run in the target org, so the Content__c records exist to link to.
 *
 * Usage:
 *   node upload-choicecentral-local-marketing-files.js [--org <alias>] [--dry-run]
 *   (defaults to --org sandbox)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const API = 'v60.0';
const LIBRARY_PREFIX = '00018-local-marketing-support-suite';
const DOWNLOADS_DIR = path.join(__dirname, 'choicecentral-local-marketing', 'downloads');
const MANIFEST_FILE = path.join(__dirname, 'generated-apex', 'choicecentral-local-marketing-file-manifest.json');

const args = process.argv.slice(2);
const orgIdx = args.indexOf('--org');
const orgAlias = orgIdx !== -1 ? args[orgIdx + 1] : 'sandbox';
const dryRun = args.includes('--dry-run');

function orgAuth(alias) {
  const out = execSync(`sf org display --target-org ${alias} --json`, { encoding: 'utf8', maxBuffer: 8e6, shell: 'cmd.exe' });
  const r = JSON.parse(out).result;
  if (!r.accessToken || !r.instanceUrl) throw new Error(`No token for org ${alias}`);
  return { token: r.accessToken, url: r.instanceUrl };
}

async function rest(A, endpoint, method = 'GET', body = null) {
  const options = { method, headers: { Authorization: `Bearer ${A.token}`, 'Content-Type': 'application/json' } };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${A.url}${endpoint}`, options);
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${endpoint} -> ${res.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : {};
}

async function queryAll(A, soql) {
  let records = [];
  let result = await rest(A, `/services/data/${API}/query?q=${encodeURIComponent(soql)}`);
  records = records.concat(result.records || []);
  while (result.nextRecordsUrl) {
    result = await rest(A, result.nextRecordsUrl);
    records = records.concat(result.records || []);
  }
  return records;
}

async function uploadFile(A, title, filePath, firstPublishLocationId) {
  const fileData = fs.readFileSync(filePath);
  const cv = await rest(A, `/services/data/${API}/sobjects/ContentVersion`, 'POST', {
    Title: title,
    PathOnClient: path.basename(filePath),
    VersionData: fileData.toString('base64'),
    FirstPublishLocationId: firstPublishLocationId
  });
  const docId = (await queryAll(A, `SELECT ContentDocumentId FROM ContentVersion WHERE Id = '${cv.id}'`))[0].ContentDocumentId;
  return { contentVersionId: cv.id, contentDocumentId: docId, title, size: fileData.length };
}

async function getContentIdMap(A) {
  console.log('Querying Content__c records for this library...');
  const records = await queryAll(A, `SELECT Id, Content_Unique_Id__c FROM Content__c WHERE Content_Unique_Id__c LIKE '${LIBRARY_PREFIX}%'`);
  if (records.length === 0) {
    throw new Error('No Content__c records found. Run ChoiceCentralLocalMarketingImporter.importAll() first.');
  }
  console.log(`  Found ${records.length} Content__c records`);
  return new Map(records.map(r => [r.Content_Unique_Id__c, r.Id]));
}

async function main() {
  console.log(`=== ChoiceCentral Local Marketing File Uploader (${orgAlias}${dryRun ? ', DRY RUN' : ''}) ===\n`);

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'));
  const A = orgAuth(orgAlias);
  const contentIdMap = await getContentIdMap(A);

  // Skip files already uploaded (idempotent re-runs), same check as
  // link-choice-privileges-files.js's ensureFileUrl dedup-by-title.
  const existingTitles = new Set(
    (await queryAll(A, `SELECT Title FROM ContentVersion WHERE IsLatest = true`)).map(r => r.Title)
  );

  const results = { uploaded: 0, skippedExisting: 0, failed: 0, skippedNoRecord: 0, files: [] };

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

      const title = doc.title || doc.filename;
      if (existingTitles.has(title)) {
        console.log(`  Already uploaded, skipping: ${title}`);
        results.skippedExisting++;
        continue;
      }

      if (dryRun) {
        console.log(`  would upload: ${title} -> ${page.title}`);
        continue;
      }

      try {
        const result = await uploadFile(A, title, filePath, contentId);
        console.log(`  Uploaded: ${title} -> ${page.title} (${Math.round(result.size / 1024)}KB)`);
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
  console.log(`Already existed (skipped): ${results.skippedExisting}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Skipped (no matching record): ${results.skippedNoRecord}`);

  if (!dryRun) {
    const summaryPath = path.join(__dirname, 'choicecentral-local-marketing-upload-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2));
    console.log(`\nSummary saved to: ${summaryPath}`);
  }
}

main().catch(error => {
  console.error('\nFatal error:', error.message);
  process.exit(1);
});
