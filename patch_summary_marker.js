#!/usr/bin/env node
/**
 * One-off: strip the literal "<!-- truncated -->" text that leaked into
 * Translations__c.Summary__c (a plain-text field, so the HTML-comment
 * marker meant for Body__c showed up as visible text instead of being
 * hidden). Just removes the trailing marker from each affected record.
 * Usage: node patch_summary_marker.js --org qa
 */
const { execSync } = require('child_process');
const API = 'v60.0';
const LIBRARY_PREFIX = '00018-local-marketing-support-suite';
const MARKER = '<!-- truncated -->';

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

  const A = orgAuth(orgAlias);
  const records = await queryAll(A, `SELECT Id, Content__r.Content_Unique_Id__c, Summary__c FROM Translations__c WHERE Content__r.Content_Unique_Id__c LIKE '${LIBRARY_PREFIX}%'`);
  const affected = records.filter(r => r.Summary__c && r.Summary__c.includes(MARKER));

  console.log(`=== Patching Summary__c marker (${orgAlias}) ===`);
  console.log(`Found ${affected.length} affected record(s)`);

  for (const rec of affected) {
    const fixed = rec.Summary__c.split(MARKER).join('').trimEnd();
    await rest(A, `/services/data/${API}/sobjects/Translations__c/${rec.Id}`, 'PATCH', { Summary__c: fixed });
    console.log(`  Fixed: ${rec.Content__r.Content_Unique_Id__c}`);
  }

  console.log(`\nDone. ${affected.length} record(s) patched.`);
}

main().catch(e => { console.error('Fatal error:', e.message); process.exit(1); });
