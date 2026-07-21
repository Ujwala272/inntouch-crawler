#!/usr/bin/env node

/**
 * Log into InnTouch and dump the full raw HTML of a page to a file. Used to
 * inspect tile-grid landing pages whose body-text extractor only grabs the
 * first content fragment, missing later tiles/links entirely.
 *
 * Usage:
 *   node bin/dump-page-html.js <url> [--out <file>]
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
const url = args.find(a => !a.startsWith('--'));
const outIdx = args.indexOf('--out');
const outFile = outIdx !== -1 ? args[outIdx + 1] : path.join(__dirname, '..', 'output', 'page-dump.html');

if (!url) {
  console.error('Usage: node bin/dump-page-html.js <url> [--out <file>]');
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
  await fs.ensureDir(path.dirname(outFile));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const authenticator = new Authenticator(authConfig);
  await authenticator.authenticate(context, page);

  // Match the working crawler's navigation (domcontentloaded + selector wait +
  // settle time) rather than networkidle - Jive's community pages can render
  // an "Error | iNN-touch" shell under networkidle for reasons not fully
  // understood, but resolve fine with this sequence (as proven by the
  // original page-scoped crawl of this same URL).
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  try {
    await page.waitForSelector('.jive-rendered-content', { timeout: 10000 });
  } catch (e) {
    consoleLogger.warn('Selector .jive-rendered-content not found, continuing anyway');
  }
  await page.waitForTimeout(5000);

  const html = await page.content();
  await fs.writeFile(outFile, html);

  consoleLogger.success(`Dumped ${html.length} chars to ${outFile}`);

  await browser.close();
}

main().catch(err => {
  consoleLogger.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
