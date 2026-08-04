#!/usr/bin/env node
/**
 * One-off: patch Content__c.Banner_Image__c on the Local Marketing Support
 * Suite library for a banner image already uploaded (via upload_banner.js)
 * in a prior run, using its known ContentDocument Id.
 *
 * IMPORTANT: the URL host must be the Experience Cloud community domain
 * (e.g. choicehotelsfranchise--urapolu2.sandbox.my.site.com), NOT the API
 * domain from `sf org display` (...my.salesforce.com) - the library detail
 * page renders inside the community, and the API domain's image either
 * 404s or is blocked there, rendering as a blank box. ccUtilityClass
 * derives this same community host from SiteDetail.SecureUrl for the "Zx"
 * site (Id 0DMPB00000004DK4AY in both orgs seen so far); this script does
 * the same lookup instead of hardcoding the domain.
 *
 * Usage: node patch_banner_field.js --org qa --doc-id 069Ei00000DaIBpIAN
 */
const { execSync } = require('child_process');
const API = 'v60.0';
const LIBRARY_UID = '00018-local-marketing-support-suite';
const ZX_SITE_DURABLE_ID = '0DMPB00000004DK4AY';

function orgAuth(alias) {
  const out = execSync(`sf org display --target-org ${alias} --json`, { encoding: 'utf8', maxBuffer: 8e6, shell: 'cmd.exe' });
  const r = JSON.parse(out).result;
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

async function getCommunityBaseUrl(A) {
  const q = await rest(A, `/services/data/${API}/query?q=${encodeURIComponent(`SELECT SecureUrl FROM SiteDetail WHERE DurableId = '${ZX_SITE_DURABLE_ID}'`)}`);
  const secureUrl = new URL(q.records[0].SecureUrl);
  return `${secureUrl.protocol}//${secureUrl.host}`;
}

async function main() {
  const args = process.argv.slice(2);
  const orgAlias = args[args.indexOf('--org') + 1];
  const docId = args[args.indexOf('--doc-id') + 1];
  if (!orgAlias || !docId) throw new Error('Usage: --org <alias> --doc-id <ContentDocumentId>');

  const A = orgAuth(orgAlias);
  const q = await rest(A, `/services/data/${API}/query?q=${encodeURIComponent(`SELECT Id FROM Content__c WHERE Content_Unique_Id__c = '${LIBRARY_UID}'`)}`);
  const libId = q.records[0].Id;

  const communityBaseUrl = await getCommunityBaseUrl(A);
  const downloadUrl = `${communityBaseUrl}/sfc/servlet.shepherd/document/download/${docId}`;
  await rest(A, `/services/data/${API}/sobjects/Content__c/${libId}`, 'PATCH', { Banner_Image__c: downloadUrl });
  console.log(`Set Banner_Image__c on ${libId} (${orgAlias}): ${downloadUrl}`);
}

main().catch(e => { console.error('Fatal error:', e.message); process.exit(1); });
