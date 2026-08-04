#!/usr/bin/env node
/**
 * Fix dead links in the Local Marketing Support Suite library.
 *
 * Root cause: Translations__c.Body__c is a Rich Text Area field, and
 * Salesforce's RTA sanitizer strips the href attribute from relative-URL
 * anchors (the site's original PDF links were `?Action=GET&ID=...pdf`,
 * and internal nav links were bare relative paths like `revup.asp`) on
 * save. Every such link came out as href="" - clicking it just reloads
 * the same page. Absolute https:// links on the same pages were
 * untouched, which is why some links worked and others didn't.
 *
 * Fix covers two link types, both matched by exact anchor text:
 *  - Document links: create a public ContentDistribution (absolute
 *    HTTPS, survives RTA sanitization) for each already-uploaded file,
 *    matched against the file's ContentVersion.Title (same title used
 *    at upload time - see upload-choicecentral-local-marketing-files.js).
 *  - Internal nav links (anchor text matches another page's title in
 *    this same library, e.g. "RevUp", "Tripadvisor"): point at that
 *    page's Content_Article_URL__c instead.
 * Same approach as LinkAllCategoryPDFs.cls for InnTouch, adapted for
 * real <a> tags instead of bare <strong> text, and extended to cover
 * intra-library navigation as well as document downloads.
 *
 * Usage: node link-local-marketing-files.js --org sandbox [--dry-run]
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const API = 'v60.0';
const LIBRARY_PREFIX = '00018-local-marketing-support-suite';
const MANIFEST_FILE = path.join(__dirname, 'generated-apex', 'choicecentral-local-marketing-file-manifest.json');

const args = process.argv.slice(2);
const orgAlias = args.includes('--org') ? args[args.indexOf('--org') + 1] : 'sandbox';
const dryRun = args.includes('--dry-run');

// Anchor text that doesn't match any page/file title verbatim (CTA phrasing,
// not a title) but is known to point at a specific page - keyed by the page
// it appears on (contentUniqueId) since the same phrase could mean different
// things on different pages.
const SPECIAL_CASE_LINKS = {
  '00018-local-marketing-support-suite-digital-marketing': {
    'get started today!': '00018-local-marketing-support-suite-digital-marketing-revup'
  }
};

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

function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function ensureDistributionUrl(A, versionId, title) {
  const existing = await queryAll(A, `SELECT DistributionPublicUrl FROM ContentDistribution WHERE ContentVersionId = '${versionId}' LIMIT 1`);
  if (existing.length && existing[0].DistributionPublicUrl) return existing[0].DistributionPublicUrl;

  const cd = await rest(A, `/services/data/${API}/sobjects/ContentDistribution`, 'POST', {
    Name: title.slice(0, 80) + ' - Public',
    ContentVersionId: versionId,
    PreferencesAllowViewInBrowser: true,
    PreferencesLinkLatestVersion: true,
    PreferencesNotifyOnVisit: false,
    PreferencesPasswordRequired: false,
    PreferencesAllowOriginalDownload: true
  });
  const rows = await queryAll(A, `SELECT DistributionPublicUrl FROM ContentDistribution WHERE Id = '${cd.id}'`);
  return rows[0].DistributionPublicUrl;
}

function linkEmptyHrefsInHtml(html, titleToUrl, specialCases) {
  const normalizedMap = new Map();
  for (const [title, url] of titleToUrl) normalizedMap.set(normalize(title), url);

  let result = html;
  let replaced = 0;
  // Matches <a href=""> or <a href="" target="_blank"> (any attrs after
  // the empty href) up to the closing </a> - the RTA sanitizer leaves the
  // rest of the tag's attributes intact, only blanking href itself.
  const anchorRegex = /<a href=""([^>]*)>(.*?)<\/a>/gs;
  result = result.replace(anchorRegex, (match, restAttrs, innerText) => {
    let url = specialCases && specialCases[innerText.trim()];
    if (!url) {
      const key = normalize(innerText);
      url = normalizedMap.get(key);
    }
    if (url) {
      replaced++;
      return `<a href="${url}"${restAttrs}>${innerText}</a>`;
    }
    return match;
  });
  return { html: result, replaced };
}

async function main() {
  console.log(`=== Fix Local Marketing dead links (${orgAlias}${dryRun ? ', DRY RUN' : ''}) ===\n`);

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'));
  const A = orgAuth(orgAlias);

  const contentRecords = await queryAll(A, `SELECT Id, Content_Unique_Id__c, Name, Content_Article_URL__c FROM Content__c WHERE Content_Unique_Id__c LIKE '${LIBRARY_PREFIX}%'`);
  const contentIdMap = new Map(contentRecords.map(r => [r.Content_Unique_Id__c, r.Id]));
  const urlByUid = new Map(contentRecords.map(r => [r.Content_Unique_Id__c, r.Content_Article_URL__c]));

  // Internal nav-link targets: every other page's title -> its own
  // Content_Article_URL__c, shared across all pages in this run. HTML-encode
  // the '&' to match the convention already used for internal links
  // elsewhere (see 00004-driving-revenue's Body__c: href="...&amp;name=...").
  const pageTitleToUrl = new Map();
  for (const rec of contentRecords) {
    if (rec.Content_Article_URL__c) pageTitleToUrl.set(rec.Name, rec.Content_Article_URL__c.replace(/&/g, '&amp;'));
  }

  let totalReplaced = 0;
  let totalPagesUpdated = 0;

  for (const page of manifest.pages) {
    const contentId = contentIdMap.get(page.contentUniqueId);
    if (!contentId) continue;

    const titleToUrl = new Map(pageTitleToUrl);

    if (page.documents.length) {
      const links = await queryAll(A, `SELECT ContentDocument.Title, ContentDocument.LatestPublishedVersionId FROM ContentDocumentLink WHERE LinkedEntityId = '${contentId}'`);
      for (const link of links) {
        const title = link.ContentDocument.Title;
        const versionId = link.ContentDocument.LatestPublishedVersionId;
        const url = dryRun ? '(would-create-distribution)' : await ensureDistributionUrl(A, versionId, title);
        titleToUrl.set(title, url);
      }
    }

    const trans = await queryAll(A, `SELECT Id, Body__c FROM Translations__c WHERE Content__c = '${contentId}' AND Name = 'English'`);
    if (!trans.length) continue;

    let specialCases = null;
    if (SPECIAL_CASE_LINKS[page.contentUniqueId]) {
      specialCases = {};
      for (const [text, targetUid] of Object.entries(SPECIAL_CASE_LINKS[page.contentUniqueId])) {
        const targetUrl = urlByUid.get(targetUid);
        if (targetUrl) specialCases[text] = targetUrl.replace(/&/g, '&amp;');
      }
    }

    const { html, replaced } = linkEmptyHrefsInHtml(trans[0].Body__c, titleToUrl, specialCases);
    if (replaced > 0) {
      console.log(`  ${page.title}: ${replaced} link(s) fixed`);
      totalReplaced += replaced;
      totalPagesUpdated++;
      if (!dryRun) {
        await rest(A, `/services/data/${API}/sobjects/Translations__c/${trans[0].Id}`, 'PATCH', { Body__c: html });
      }
    } else {
      console.log(`  ${page.title}: no matching empty-href anchors found`);
    }
  }

  console.log(`\nTotal: ${totalReplaced} links fixed across ${totalPagesUpdated} pages.`);
}

main().catch(e => { console.error('Fatal error:', e.message); process.exit(1); });
