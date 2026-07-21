#!/usr/bin/env node

/**
 * Log into InnTouch and download a fixed list of files by their direct
 * downloadBody URL. Used to recover real binaries when a page-scoped crawl
 * downloaded the login-wall HTML (mislabeled .pdf) instead of the file,
 * because it followed a doc-page link rather than the true download URL.
 *
 * Usage:
 *   node bin/fetch-files.js <manifest.json> [--out <dir>]
 *
 * manifest.json: [{ "url": "https://www.inn-touch.ca/servlet/JiveServlet/downloadBody/...", "filename": "output-name.pdf" }, ...]
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
const outDir = outIdx !== -1 ? args[outIdx + 1] : path.join(__dirname, '..', 'output', 'fetched-files');

if (!manifestPath) {
  console.error('Usage: node bin/fetch-files.js <manifest.json> [--out <dir>]');
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
      const response = await context.request.get(item.url, { timeout: 30000 });
      const buffer = await response.body();
      const filepath = path.join(outDir, item.filename);
      await fs.writeFile(filepath, buffer);
      const isPdf = buffer.slice(0, 4).toString() === '%PDF';
      const isPng = buffer[0] === 0x89 && buffer[1] === 0x50;
      const isJpg = buffer[0] === 0xff && buffer[1] === 0xd8;
      const ok = isPdf || isPng || isJpg;
      consoleLogger[ok ? 'success' : 'warn'](`${ok ? 'OK' : 'STILL FAKE'}: ${item.filename} (${buffer.length} bytes)`);
      results.push({ ...item, size: buffer.length, ok });
    } catch (error) {
      consoleLogger.error(`Failed ${item.filename}: ${error.message}`);
      results.push({ ...item, error: error.message, ok: false });
    }
  }

  await fs.writeJson(path.join(outDir, 'fetch_results.json'), results, { spaces: 2 });

  await browser.close();

  const failed = results.filter(r => !r.ok);
  if (failed.length > 0) {
    consoleLogger.warn(`${failed.length}/${results.length} files still not real binaries`);
  } else {
    consoleLogger.success(`All ${results.length} files fetched successfully`);
  }
}

main().catch(err => {
  consoleLogger.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
