/**
 * GenericCrawler - Main orchestrator for library website crawling
 */

import fs from 'fs-extra';
import { chromium } from 'playwright';
import { Authenticator } from './Authenticator.js';
import { Navigator } from './Navigator.js';
import { Extractor} from './Extractor.js';
import { Downloader } from './Downloader.js';
import { Deduplicator } from './Deduplicator.js';
import { JsonExporter } from '../exporters/JsonExporter.js';
import { CsvExporter } from '../exporters/CsvExporter.js';
import { consoleLogger } from '../utils/logger.js';
import { sleep } from '../utils/helpers.js';

export class GenericCrawler {
  constructor(config) {
    this.config = config;
    this.browser = null;
    this.context = null;
    this.page = null;

    // Initialize components
    this.deduplicator = new Deduplicator();
    this.authenticator = new Authenticator(config.auth);
    this.navigator = new Navigator(config.crawl, this.deduplicator);
    this.extractor = new Extractor(config.extraction);
    this.downloader = new Downloader(config.download, this.deduplicator);

    // Results
    this.results = {
      config: config,
      startUrl: '',
      pages: [],
      errors: [],
      startTime: null,
      endTime: null
    };
  }

  /**
   * Main crawl method. Accepts either a single start URL (crawls outward
   * following discovered links, up to maxDepth/maxPages) or an array of
   * seed URLs (page-scoped crawl: only those exact pages are fetched when
   * maxDepth is 0, since any links they discover land at depth 1 and get
   * rejected by Navigator.shouldCrawl).
   */
  async crawl(startUrlOrUrls) {
    const seedUrls = Array.isArray(startUrlOrUrls) ? startUrlOrUrls : [startUrlOrUrls];
    this.results.startUrl = seedUrls.length === 1 ? seedUrls[0] : seedUrls;
    this.results.startTime = Date.now();

    try {
      consoleLogger.info(`🚀 Starting crawl: ${seedUrls.length} seed URL(s)`);
      consoleLogger.info(`Max pages: ${this.navigator.maxPages}, Max depth: ${this.navigator.maxDepth}`);

      // Initialize
      await this.init();

      // Authenticate if required
      if (this.config.auth && this.config.auth.strategy !== 'none') {
        await this.authenticate();
      }

      // Seed the queue with all start URLs at depth 0
      for (const url of seedUrls) {
        this.navigator.addToQueue(url, 0);
      }

      // Crawl pages (BFS)
      await this.crawlPages();

      // Capture final navigator stats and queue status
      this.results.navigatorStats = this.navigator.getStats();
      this.results.queueStatus = {
        remainingInQueue: this.navigator.getQueueSize(),
        totalDiscovered: this.navigator.getTotalDiscovered(),
        urlsCrawled: this.navigator.getPagesVisited()
      };

      // Export results
      await this.exportResults();

      // Summary
      this.printSummary();

      consoleLogger.success('✅ Crawl completed successfully!');

      return this.results;
    } catch (error) {
      consoleLogger.error(`Fatal error: ${error.message}`);
      throw error;
    } finally {
      await this.cleanup();
      this.results.endTime = Date.now();
    }
  }

  /**
   * Initialize browser and components
   */
  async init() {
    consoleLogger.info('Initializing browser...');

    // Launch browser
    this.browser = await chromium.launch({
      headless: this.config.headless !== false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // Create context
    const contextOptions = {
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };

    // Load session if using session auth
    if (this.config.auth?.strategy === 'session' && this.config.auth?.sessionFile) {
      contextOptions.storageState = this.config.auth.sessionFile;
    }

    this.context = await this.browser.newContext(contextOptions);
    this.page = await this.context.newPage();

    // Initialize downloader
    await this.downloader.init();

    consoleLogger.success('Browser initialized');
  }

  /**
   * Authenticate
   */
  async authenticate() {
    await this.authenticator.authenticate(this.context, this.page);
  }

  /**
   * Crawl pages using BFS
   */
  async crawlPages() {
    consoleLogger.crawl('Starting page crawl...');

    while (!this.navigator.isEmpty() && !this.navigator.isMaxPagesReached()) {
      const current = this.navigator.getNext();

      if (!current) break;

      await this.crawlPage(current);

      // Rate limiting
      const delay = this.config.crawl?.delay || 1000;
      const jitter = Math.random() * 500;
      await sleep(delay + jitter);
    }

    consoleLogger.success(`Crawled ${this.navigator.getPagesVisited()} pages`);
  }

  /**
   * Crawl a single page
   */
  async crawlPage(pageInfo) {
    const { url, depth } = pageInfo;

    try {
      consoleLogger.crawl(`[${this.navigator.getPagesVisited()}/${this.navigator.maxPages}] Depth ${depth}: ${url}`);

      // Navigate to page
      await this.page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });

      // Wait for content to load
      if (this.config.crawl?.waitForSelector) {
        try {
          await this.page.waitForSelector(this.config.crawl.waitForSelector, { timeout: 10000 });
        } catch (e) {
          // Continue even if selector not found
          consoleLogger.warn(`Selector not found: ${this.config.crawl.waitForSelector}`);
        }
      } else {
        // Give page a moment to render if no selector specified
        await sleep(2000);
      }

      // Additional wait for JavaScript/AJAX content
      consoleLogger.debug('Waiting for dynamic content to load...');
      await sleep(3000);

      // Extract content
      const content = await this.extractor.extractContent(this.page, url);
      content.depth = depth;
      content.parent = pageInfo.parent;

      // Download files
      if (this.downloader.enabled) {
        const downloadedDocs = await this.downloader.downloadFiles(this.page, content.documents);
        content.documents = downloadedDocs;

        const downloadedImages = await this.downloader.downloadFiles(this.page, content.images);
        content.images = downloadedImages;
      }

      // Add to results
      this.results.pages.push(content);

      // Wait a bit for dynamic content (AJAX/JavaScript) to fully load
      await sleep(1000);

      // Discover new links
      await this.navigator.discoverLinks(this.page, url, depth);

    } catch (error) {
      consoleLogger.error(`Error crawling ${url}: ${error.message}`);
      this.results.errors.push({
        url,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Export results
   */
  async exportResults() {
    consoleLogger.info('Exporting results...');

    const formats = this.config.output?.formats || ['json', 'csv'];

    if (formats.includes('json')) {
      const jsonExporter = new JsonExporter(this.config.output);
      await jsonExporter.export(this.results);
    }

    if (formats.includes('csv')) {
      const csvExporter = new CsvExporter(this.config.output);
      await csvExporter.export(this.results);
    }

    // Export file inventory
    if (this.config.output?.inventoryFile) {
      await this.downloader.exportInventory(this.config.output.inventoryFile);
    }

    // Export summary report
    if (this.config.output?.summaryFile) {
      await this.exportSummaryReport(this.config.output.summaryFile);
    }
  }

  /**
   * Export summary report
   */
  async exportSummaryReport(outputPath) {
    try {
      const pages = this.results.pages || [];

      // Categorize content
      const uniqueDocuments = new Set();
      const uniquePDFs = new Set();
      const uniqueVideos = new Set();
      const uniqueContentPages = new Set();

      pages.forEach(page => {
        // Content pages
        if (page.url.includes('/docs/DOC-')) {
          uniqueContentPages.add(page.url);
        }

        // Documents
        (page.documents || []).forEach(doc => {
          if (doc.url) {
            uniqueDocuments.add(doc.url);
            if (doc.url.toLowerCase().endsWith('.pdf')) {
              uniquePDFs.add(doc.url);
            }
          }
        });

        // Videos
        (page.videos || []).forEach(video => {
          if (video.url) {
            uniqueVideos.add(video.url);
          }
        });
      });

      const summary = {
        crawlCompleted: new Date().toISOString(),
        statistics: {
          totalPagesCrawled: pages.length,
          uniqueContentPages: uniqueContentPages.size,
          uniqueDocuments: uniqueDocuments.size,
          uniquePDFs: uniquePDFs.size,
          uniqueVideos: uniqueVideos.size,
          filesDownloaded: this.downloader.downloadedCount,
          filesSkipped: this.downloader.skippedCount,
          errors: this.results.errors.length
        },
        contentBreakdown: {
          documentPages: pages.filter(p => p.url.includes('/docs/DOC-')).length,
          categoryPages: pages.filter(p => p.url.includes('/local-sales-library/') && !p.url.includes('/docs/')).length,
          otherPages: pages.filter(p => !p.url.includes('/docs/DOC-') && !p.url.includes('/local-sales-library/')).length
        },
        downloaderStats: this.downloader.getStats()
      };

      await fs.writeJson(outputPath, summary, { spaces: 2 });
      consoleLogger.success(`Summary report exported to: ${outputPath}`);
    } catch (error) {
      consoleLogger.error(`Failed to export summary: ${error.message}`);
    }
  }

  /**
   * Print summary
   */
  printSummary() {
    const duration = (this.results.endTime - this.results.startTime) / 1000;

    console.log('\n═══════════════════════════════════════');
    console.log('📊 CRAWL SUMMARY');
    console.log('═══════════════════════════════════════');
    console.log(`Pages crawled:      ${this.results.pages.length}`);
    console.log(`Files downloaded:   ${this.downloader.downloadedCount}`);
    console.log(`Errors:             ${this.results.errors.length}`);
    console.log(`Duration:           ${duration.toFixed(2)}s`);
    console.log('═══════════════════════════════════════\n');

    if (this.results.errors.length > 0) {
      console.log('⚠️  Errors encountered:');
      this.results.errors.forEach(err => {
        console.log(`   - ${err.url}: ${err.error}`);
      });
      console.log('');
    }
  }

  /**
   * Cleanup
   */
  async cleanup() {
    if (this.page) {
      await this.page.close();
    }
    if (this.context) {
      await this.context.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
  }
}
