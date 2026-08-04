#!/usr/bin/env node
/**
 * Upload the Local Marketing Support Suite banner image and link it two
 * ways, since two different pages resolve the banner two different ways:
 *  - The Overview/grid card (ccReferenceGuidesCtrl) resolves it via
 *    ContentDocumentLink -> ContentVersion.FirstPublishLocationId against
 *    the Content__c Id (getImageFromRelatedFiles) - covered by uploading
 *    with FirstPublishLocationId = library Id.
 *  - The library detail hero banner (libraryContentDetailCtrl /
 *    libraryContentDetail LWC) reads Content__c.Banner_Image__c directly
 *    and does NOT look at ContentDocumentLink at all - without this field
 *    set, the hero renders as a blank box (its CSS background-image URL
 *    resolves to nothing). Patched here right after upload, since the
 *    ContentDocument Id needed for the URL is only known post-upload.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const API = 'v60.0';
const LIBRARY_UID = '00018-local-marketing-support-suite';
const IMAGE_PATH = path.join(__dirname, 'choicecentral-local-marketing', 'downloads', 'LocalMarketing.png');

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

async function main() {
  const orgAlias = process.argv.includes('--org') ? process.argv[process.argv.indexOf('--org') + 1] : 'sandbox';
  console.log(`=== Upload Local Marketing banner image (${orgAlias}) ===\n`);

  const A = orgAuth(orgAlias);

  const lib = (await queryAll(A, `SELECT Id FROM Content__c WHERE Content_Unique_Id__c = '${LIBRARY_UID}'`))[0];
  if (!lib) throw new Error(`Library ${LIBRARY_UID} not found`);
  console.log(`Library Content__c Id: ${lib.Id}`);

  const fileData = fs.readFileSync(IMAGE_PATH);
  const cv = await rest(A, `/services/data/${API}/sobjects/ContentVersion`, 'POST', {
    Title: 'Local Marketing Support Suite - Banner',
    PathOnClient: 'LocalMarketing.png',
    VersionData: fileData.toString('base64'),
    FirstPublishLocationId: lib.Id
  });
  console.log(`Uploaded ContentVersion: ${cv.id} (${Math.round(fileData.length / 1024)}KB)`);

  const docId = (await queryAll(A, `SELECT ContentDocumentId FROM ContentVersion WHERE Id = '${cv.id}'`))[0].ContentDocumentId;
  console.log(`ContentDocument Id: ${docId}`);

  const downloadUrl = `${A.url}/sfc/servlet.shepherd/document/download/${docId}`;
  await rest(A, `/services/data/${API}/sobjects/Content__c/${lib.Id}`, 'PATCH', {
    Banner_Image__c: downloadUrl
  });
  console.log(`Set Content__c.Banner_Image__c: ${downloadUrl}`);
  console.log('\nDone.');
}

main().catch(e => { console.error('Fatal error:', e.message); process.exit(1); });
