#!/usr/bin/env node

/**
 * Crawl exactly ONE InnTouch page plus every document (DOC-*) it links to —
 * not the rest of the site. Give it a single URL; it downloads every PDF,
 * DOCX, XLSX, PPTX, image, etc. referenced by that page and exports one JSON
 * file describing it. Much faster than the 600-page library crawl when you
 * only need one page's resources.
 *
 * Usage:
 *   node bin/crawl-page.js <url> [--out <dir>]
 *
 * Example:
 *   node bin/crawl-page.js "https://www.inn-touch.ca/community/local-sales-library/closing-the-sale/pages/main"
 */

import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GenericCrawler } from '../core/Crawler.js';
import { substituteEnvVars } from '../utils/helpers.js';
import { consoleLogger } from '../utils/logger.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const url = args.find(a => !a.startsWith('--'));
const outIdx = args.indexOf('--out');
const outDir = outIdx !== -1 ? args[outIdx + 1] : null;

if (!url) {
  console.error('Usage: node bin/crawl-page.js <url> [--out <dir>]');
  process.exit(1);
}

function slugFromUrl(u) {
  try {
    const parsed = new URL(u);
    const segments = parsed.pathname.split('/').filter(Boolean);
    return (segments[segments.length - 1] || 'page').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  } catch {
    return 'page';
  }
}

async function main() {
  const slug = slugFromUrl(url);
  const outputDir = outDir || path.join(__dirname, '..', 'output', 'single-page', slug);

  // Config: seed with the one page. maxDepth=1 lets it follow ONLY the
  // document links discovered on that page (each /docs/DOC-* link is a
  // depth-1 candidate); includePatterns restricts what depth-1 links are
  // allowed, so it never wanders into other category/place pages on the
  // site. Nothing past depth 1 is ever queued.
  const config = {
    startUrl: [url],
    headless: true,
    auth: {
      strategy: 'form',
      loginUrl: 'https://www.inn-touch.ca/login.jspa',
      credentials: {
        username: '${INNTOUCH_USERNAME}',
        password: '${INNTOUCH_PASSWORD}',
      },
      selectors: {
        username: "input[name='username'], input#username",
        password: "input[name='password'], input#password",
        submit: "button[type='submit'], input[type='submit']",
      },
      successIndicator: { urlNotContains: '/login' },
    },
    crawl: {
      maxDepth: 1,
      maxPages: 60,
      allowedDomains: ['www.inn-touch.ca', 'inn-touch.ca'],
      includePatterns: ['/docs/DOC-'],
      excludePatterns: ['/login', '/logout', '/profile', '/people', '/admin', '/diff$', '/version/', '/edit$'],
      waitForSelector: '.jive-rendered-content',
      delay: 1000,
    },
    extraction: {
      useHeuristics: true,
      selectors: {
        title: 'h1, .j-placeTitle, span.j-place-name',
        body: '.jive-rendered-content, .j-description',
        category: 'h2',
        videos: "iframe[src*='vimeo'], iframe[src*='youtube']",
        images: "img[src*='cachefly'], img[src*='/servlet/']",
        documents: "a[href*='/docs/DOC-'], a[href*='/servlet/JiveServlet/download'], a[href$='.pdf'], a[href$='.docx'], a[href$='.xlsx'], a[href$='.pptx']",
      },
    },
    download: {
      enabled: true,
      downloadDir: path.join(outputDir, 'downloads'),
      allowedTypes: ['pdf', 'docx', 'xlsx', 'pptx', 'doc', 'xls', 'ppt', 'jpg', 'png', 'gif'],
      maxFileSize: 52428800,
      generateInventory: true,
      deduplicateByTitle: true,
      deduplicateByHash: true,
    },
    output: {
      formats: ['json', 'csv'],
      jsonFile: path.join(outputDir, `${slug}_crawl.json`),
      csvFile: path.join(outputDir, `${slug}_crawl.csv`),
      inventoryFile: path.join(outputDir, 'file_inventory.csv'),
      summaryFile: path.join(outputDir, 'crawl_summary.json'),
    },
  };

  const substituted = JSON.parse(JSON.stringify(config), (key, value) =>
    typeof value === 'string' ? substituteEnvVars(value) : value
  );

  consoleLogger.info(`Single-page crawl: ${url}`);
  consoleLogger.info(`Output: ${outputDir}`);

  const crawler = new GenericCrawler(substituted);
  await crawler.crawl(substituted.startUrl);

  consoleLogger.success('🎉 Done! Check the output directory above for the crawl JSON and downloads/ folder.');
}

main().catch(err => {
  consoleLogger.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
