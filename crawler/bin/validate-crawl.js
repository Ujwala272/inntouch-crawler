#!/usr/bin/env node

/**
 * Validate a crawl output JSON before it's used for a Salesforce import.
 * Catches the classes of bug found while building the ChoiceCentral Local
 * Marketing importer: duplicate/leaked landmark content (nav/footer text
 * winning the "largest block" heuristic), empty fields, and document
 * links that never actually got downloaded.
 *
 * Usage:
 *   node bin/validate-crawl.js <path-to-crawl.json>
 *
 * Exits non-zero if any check fails, so it can gate a workflow step.
 */

import fs from 'fs';

const LANDMARK_PHRASES = [
  'navbar', 'dropdown-item', 'dropdown-menu',
  'copyright', 'all rights reserved',
  'have an additional marketing question',
  'follow us on', 'privacy policy', 'terms of use'
];

const file = process.argv[2];
if (!file) {
  console.error('Usage: node bin/validate-crawl.js <path-to-crawl.json>');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const pages = data.pages || [];
let failures = 0;

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  failures++;
}

// 1. Duplicate bodyHtml across distinct pages (the nav/footer-leak signature)
const seen = new Map();
for (const p of pages) {
  const key = `${p.bodyHtml.length}:${p.bodyHtml.substring(0, 100)}`;
  if (seen.has(key) && p.bodyHtml.length > 0) {
    fail(`Duplicate bodyHtml: ${p.url} matches ${seen.get(key)}`);
  }
  seen.set(key, p.url);
}

// 2. Landmark leakage - site-wide nav/footer text appearing as page content
for (const p of pages) {
  for (const phrase of LANDMARK_PHRASES) {
    if (p.body.toLowerCase().includes(phrase) || p.bodyHtml.toLowerCase().includes(phrase)) {
      fail(`Landmark leakage in ${p.url}: contains "${phrase}"`);
    }
  }
}

// 3. Empty required fields
for (const p of pages) {
  if (!p.body || p.body.trim().length === 0) fail(`Empty body: ${p.url}`);
  if (!p.bodyHtml || p.bodyHtml.trim().length === 0) fail(`Empty bodyHtml: ${p.url}`);
  if (!p.title || p.title === 'Untitled Page') fail(`Missing/default title: ${p.url}`);
}

// 4. Document links that were found but never downloaded
const allDocs = pages.flatMap(p => p.documents || []);
for (const doc of allDocs) {
  if (!doc.filename) fail(`Document not downloaded: ${doc.url}`);
}

// 5. Errors that don't correspond to an already-successful document download
// (a benign duplicate-crawl-attempt) - anything else is a real failure.
const docUrls = new Set(allDocs.map(d => d.url));
for (const err of data.errors || []) {
  if (!docUrls.has(err.url)) {
    fail(`Unexplained crawl error: ${err.url} -> ${err.error.split('\n')[0]}`);
  }
}

console.log(`\nChecked ${pages.length} pages, ${allDocs.length} document links, ${(data.errors || []).length} errors.`);

if (failures > 0) {
  console.error(`\n${failures} validation failure(s). Do not use this crawl output for import.`);
  process.exit(1);
} else {
  console.log('\nAll checks passed. Crawl output looks safe to use for import.');
}
