#!/usr/bin/env node

/**
 * CLI entry point for generic library crawler
 */

import { Command } from 'commander';
import fs from 'fs-extra';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GenericCrawler } from '../core/Crawler.js';
import { deepMerge, substituteEnvVars } from '../utils/helpers.js';
import { consoleLogger } from '../utils/logger.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

program
  .name('crawl')
  .description('Generic library website crawler with Salesforce export')
  .version('1.0.0');

function collectUrl(value, previous) {
  return previous.concat([value]);
}

program
  .option('-c, --config <file>', 'Path to JSON config file')
  .option('-p, --preset <name>', 'Use preset: jive, generic')
  .option('-u, --start-url <url>', 'Starting URL to crawl')
  .option('--seed-url <url>', 'A single page to crawl (repeatable); combine with --max-depth 0 to fetch only these exact pages, not the whole site', collectUrl, [])
  .option('--username <username>', 'Authentication username')
  .option('--password <password>', 'Authentication password')
  .option('--max-depth <n>', 'Maximum crawl depth', parseInt)
  .option('--max-pages <n>', 'Maximum pages to crawl', parseInt)
  .option('-o, --output <dir>', 'Output directory')
  .option('--format <formats>', 'Output formats: json,csv')
  .option('--no-download', 'Skip file downloads')
  .option('--headless', 'Run browser in headless mode')
  .option('--verbose', 'Enable verbose logging')
  .option('--dry-run', 'Preview what would be crawled without crawling')
  .parse(process.argv);

const options = program.opts();

/**
 * Main execution
 */
async function main() {
  try {
    // Load configuration
    const config = await loadConfig(options);

    // Validate required fields
    const seedUrls = options.seedUrl.length > 0 ? options.seedUrl : config.startUrl;
    if (!seedUrls || (Array.isArray(seedUrls) && seedUrls.length === 0)) {
      consoleLogger.error('Error: Start URL is required (use --start-url, --seed-url, or config file)');
      process.exit(1);
    }

    // Print configuration
    if (options.verbose) {
      console.log('Configuration:', JSON.stringify(config, null, 2));
    }

    // Dry run: just print config and exit
    if (options.dryRun) {
      console.log('\n🔍 DRY RUN MODE\n');
      console.log('Start URL(s):', seedUrls);
      console.log('Max Depth:', config.crawl.maxDepth);
      console.log('Max Pages:', config.crawl.maxPages);
      console.log('Auth Strategy:', config.auth?.strategy || 'none');
      console.log('Download Files:', config.download?.enabled !== false);
      console.log('\n✓ Configuration validated. Use without --dry-run to start crawling.\n');
      return;
    }

    // Create and run crawler
    consoleLogger.info('Initializing crawler...');
    const crawler = new GenericCrawler(config);

    await crawler.crawl(seedUrls);

    consoleLogger.success('🎉 Done!');
    process.exit(0);
  } catch (error) {
    consoleLogger.error(`Fatal error: ${error.message}`);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * Load and merge configuration from multiple sources
 */
async function loadConfig(options) {
  let config = {
    startUrl: '',
    headless: true,
    auth: { strategy: 'none' },
    crawl: {
      maxDepth: 3,
      maxPages: 100,
      allowedDomains: [],
      includePatterns: [],
      excludePatterns: [],
      delay: 1000
    },
    extraction: {
      useHeuristics: true,
      selectors: {}
    },
    download: {
      enabled: true,
      downloadDir: './downloads',
      allowedTypes: ['pdf', 'docx', 'xlsx', 'pptx', 'jpg', 'png']
    },
    output: {
      formats: ['json', 'csv'],
      jsonFile: './output/library_content.json',
      csvFile: './output/library_content.csv'
    }
  };

  // Load preset if specified
  if (options.preset) {
    const preset = await loadPreset(options.preset);
    config = deepMerge(config, preset);
  }

  // Load config file if specified
  if (options.config) {
    const fileConfig = await loadConfigFile(options.config);
    config = deepMerge(config, fileConfig);
  }

  // Apply CLI overrides
  if (options.startUrl) config.startUrl = options.startUrl;
  if (options.maxDepth) config.crawl.maxDepth = options.maxDepth;
  if (options.maxPages) config.crawl.maxPages = options.maxPages;
  if (options.output) {
    config.output.jsonFile = path.join(options.output, 'library_content.json');
    config.output.csvFile = path.join(options.output, 'library_content.csv');
    config.download.downloadDir = path.join(options.output, 'downloads');
  }
  if (options.format) config.output.formats = options.format.split(',');
  if (options.download === false) config.download.enabled = false;
  if (options.headless !== undefined) config.headless = options.headless;

  // Authentication overrides
  if (options.username) {
    config.auth = config.auth || {};
    config.auth.credentials = config.auth.credentials || {};
    config.auth.credentials.username = options.username;
  }
  if (options.password) {
    config.auth = config.auth || {};
    config.auth.credentials = config.auth.credentials || {};
    config.auth.credentials.password = options.password;
  }

  // Substitute environment variables
  config = JSON.parse(JSON.stringify(config), (key, value) => {
    return typeof value === 'string' ? substituteEnvVars(value) : value;
  });

  return config;
}

/**
 * Load preset configuration
 */
async function loadPreset(presetName) {
  const presetPath = path.join(__dirname, '..', 'config', 'presets', `${presetName}.json`);

  if (!await fs.pathExists(presetPath)) {
    throw new Error(`Preset not found: ${presetName}`);
  }

  return await fs.readJson(presetPath);
}

/**
 * Load configuration file
 */
async function loadConfigFile(configPath) {
  if (!await fs.pathExists(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  return await fs.readJson(configPath);
}

// Run
main();
