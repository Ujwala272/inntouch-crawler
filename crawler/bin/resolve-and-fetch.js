#!/usr/bin/env node

/**
 * For each InnTouch DOC page URL in the manifest, log in, navigate to the
 * page, extract the real /servlet/JiveServlet/downloadBody/... URL embedded
 * in that page's HTML (the link Jive uses for its own "download" button),
 * then fetch that URL directly to get the real binary. This recovers files
 * whose only known reference was a DOC-page URL (not a downloadBody URL),
 * so there was no fake .pdf to scrape a corrected URL out of.
 *
 * Usage:
 *   node bin/resolve-and-fetch.js <manifest.json> [--out <dir>]
 *
 * manifest.json: [{ "docUrl": "https://www.inn-touch.ca/docs/DOC-...", "filename": "output-name.pdf" }, ...]
 */

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import dotenv from 'dotenv';
import { chromium } from 'playwright';
import { Authenticator } from '../core/Authenticator.js';
import { substituteEnvVars } from '../utils/helpers.js';
import { consoleLogger } from '../utils/logger.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const manifestPath = args.find(a => !a.startsWith('--'));
const outIdx = args.indexOf('--out');
const outDir = outIdx !== -1 ? args[outIdx + 1] : path.join(__dirname, '..', 'output', 'resolved-files');

if (!manifestPath) {
  console.error('Usage: node bin/resolve-and-fetch.js <manifest.json> [--out <dir>]');
  process.exit(1);
}

const authConfig = JSON.parse(JSON.stringify({
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
}), (key, value) => (typeof value === 'string' ? substituteEnvVars(value) : value));

async function main() {
  const manifest = await fs.readJson(manifestPath);
  await fs.ensureDir(outDir);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const authenticator = new Authenticator(authConfig);
  await authenticator.authenticate(context, page);

  const results = [];
  for (const item of manifest) {
    try {
      await page.goto(item.docUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      const html = await page.content();
      const match = html.match(/\/servlet\/JiveServlet\/downloadBody\/[^"'\\]+/);

      if (!match) {
        consoleLogger.warn(`No downloadBody link found on ${item.docUrl}`);
        results.push({ ...item, error: 'No downloadBody link found', ok: false });
        continue;
      }

      const downloadUrl = 'https://www.inn-touch.ca' + match[0];
      const response = await context.request.get(downloadUrl, { timeout: 30000 });
      const buffer = await response.body();
      const filepath = path.join(outDir, item.filename);
      await fs.writeFile(filepath, buffer);

      const isPdf = buffer.slice(0, 4).toString() === '%PDF';
      const isPng = buffer[0] === 0x89 && buffer[1] === 0x50;
      const isJpg = buffer[0] === 0xff && buffer[1] === 0xd8;
      const ok = isPdf || isPng || isJpg;
      consoleLogger[ok ? 'success' : 'warn'](`${ok ? 'OK' : 'STILL FAKE'}: ${item.filename} (${buffer.length} bytes) <- ${downloadUrl}`);
      results.push({ ...item, downloadUrl, size: buffer.length, ok });
    } catch (error) {
      consoleLogger.error(`Failed ${item.filename}: ${error.message}`);
      results.push({ ...item, error: error.message, ok: false });
    }
  }

  await fs.writeJson(path.join(outDir, 'resolve_results.json'), results, { spaces: 2 });

  await browser.close();

  const failed = results.filter(r => !r.ok);
  if (failed.length > 0) {
    consoleLogger.warn(`${failed.length}/${results.length} files still not resolved`);
  } else {
    consoleLogger.success(`All ${results.length} files resolved and fetched successfully`);
  }
}

main().catch(err => {
  consoleLogger.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
