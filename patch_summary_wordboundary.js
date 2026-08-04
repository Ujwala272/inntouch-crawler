#!/usr/bin/env node
/**
 * One-off: fix Translations__c.Summary__c values that were hard-cut at
 * exactly 250 chars (landing mid-word, e.g. "...select a" instead of
 * "...select a topic") for the 11 records where the earlier marker-removal
 * patch (patch_summary_marker.js) left a mid-word cut behind. Recomputes
 * each summary from the crawl JSON using the same word-boundary truncate()
 * now in generate-choicecentral-local-marketing-apex-import.js, and PATCHes
 * only records whose current value differs.
 * Usage: node patch_summary_wordboundary.js --org qa
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const API = 'v60.0';
const LIBRARY_PREFIX = '00018-local-marketing-support-suite';
const CRAWL_FILE = path.join(__dirname, 'choicecentral-local-marketing', 'choicecentral_local_marketing_crawl.json');

const PAGE_MAP = [
  { url: '/LocalMarketing/index.asp', contentUniqueId: LIBRARY_PREFIX },
  { url: '/digital-marketing/index.asp', contentUniqueId: `${LIBRARY_PREFIX}-digital-marketing` },
  { url: '/digital-marketing/revup.asp', contentUniqueId: `${LIBRARY_PREFIX}-digital-marketing-revup` },
  { url: '/digital-marketing/seo.asp', contentUniqueId: `${LIBRARY_PREFIX}-digital-marketing-seo` },
  { url: '/digital-marketing/social-media.asp', contentUniqueId: `${LIBRARY_PREFIX}-digital-marketing-social-media` },
  { url: '/digital-marketing/tripadvisor.asp', contentUniqueId: `${LIBRARY_PREFIX}-digital-marketing-tripadvisor` },
  { url: '/website/index.asp', contentUniqueId: `${LIBRARY_PREFIX}-website` },
  { url: '/website/vanity.asp', contentUniqueId: `${LIBRARY_PREFIX}-website-vanity-sites` },
  { url: '/collateral-photography/index.asp', contentUniqueId: `${LIBRARY_PREFIX}-collateral-photography` },
  { url: '/collateral-photography/collateral.asp', contentUniqueId: `${LIBRARY_PREFIX}-collateral-photography-smartmarketing` },
  { url: '/co-op-marketing/index.asp', contentUniqueId: `${LIBRARY_PREFIX}-co-op-marketing` },
  { url: '/new-hotels/index.asp', contentUniqueId: `${LIBRARY_PREFIX}-new-hotels` },
  { url: '/B2B-Marketing-Opportunities.asp', contentUniqueId: `${LIBRARY_PREFIX}-b2b-marketing` },
  { url: '/choice-accelerate/index.asp', contentUniqueId: `${LIBRARY_PREFIX}-choice-accelerate` },
];

function truncate(str, maxLength) {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  let cut = str.substring(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  if (lastSpace > 0) cut = cut.substring(0, lastSpace);
  return cut;
}

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
  const orgAlias = process.argv[process.argv.indexOf('--org') + 1];
  if (!orgAlias) throw new Error('Usage: --org <alias>');

  const crawl = JSON.parse(fs.readFileSync(CRAWL_FILE, 'utf8'));
  const pagesByUrl = new Map(crawl.pages.map(p => [p.url, p]));
  const findPage = (suffix) => {
    for (const [url, page] of pagesByUrl) if (url.endsWith(suffix)) return page;
    return null;
  };

  const A = orgAuth(orgAlias);
  const records = await queryAll(A, `SELECT Id, Content__r.Content_Unique_Id__c, Summary__c FROM Translations__c WHERE Content__r.Content_Unique_Id__c LIKE '${LIBRARY_PREFIX}%'`);
  const byUid = new Map(records.map(r => [r.Content__r.Content_Unique_Id__c, r]));

  console.log(`=== Fixing mid-word Summary__c truncation (${orgAlias}) ===`);
  let patched = 0;
  for (const entry of PAGE_MAP) {
    const rec = byUid.get(entry.contentUniqueId);
    if (!rec) continue;
    const page = findPage(entry.url);
    const correct = truncate(page.summary || page.body, 250);
    if (rec.Summary__c !== correct) {
      await rest(A, `/services/data/${API}/sobjects/Translations__c/${rec.Id}`, 'PATCH', { Summary__c: correct });
      console.log(`  Fixed: ${entry.contentUniqueId}`);
      patched++;
    }
  }
  console.log(`\nDone. ${patched} record(s) patched.`);
}

main().catch(e => { console.error('Fatal error:', e.message); process.exit(1); });
