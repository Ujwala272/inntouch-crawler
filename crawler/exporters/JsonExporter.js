/**
 * JsonExporter - Exports crawled data to normalized JSON format
 */

import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { consoleLogger } from '../utils/logger.js';

export class JsonExporter {
  constructor(outputConfig) {
    this.config = outputConfig || {};
    this.jsonFile = this.config.jsonFile || './output/library_content.json';
  }

  /**
   * Export crawled data to JSON
   */
  async export(crawlResults) {
    try {
      // Ensure output directory exists
      const outputDir = path.dirname(this.jsonFile);
      await fs.ensureDir(outputDir);

      // Build normalized JSON structure
      const output = this.buildJsonStructure(crawlResults);

      // Write to file
      await fs.writeJson(this.jsonFile, output, { spaces: 2 });

      consoleLogger.success(`JSON exported to: ${this.jsonFile}`);

      return this.jsonFile;
    } catch (error) {
      consoleLogger.error(`JSON export failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Build normalized JSON structure
   */
  buildJsonStructure(crawlResults) {
    const {
      config,
      pages,
      errors,
      startUrl,
      startTime,
      endTime
    } = crawlResults;

    // Calculate statistics
    const statistics = {
      pagesVisited: pages.length,
      filesDownloaded: this.countDownloadedFiles(pages),
      errors: errors.length,
      duration: this.calculateDuration(startTime, endTime)
    };

    // Detect library info from first page
    const libraryInfo = pages.length > 0 ? {
      name: pages[0].title || 'Library',
      url: startUrl,
      description: pages[0].summary || '',
      scrapedAt: pages[0].metadata.scrapedAt
    } : null;

    // Group pages by category
    const categories = this.extractCategories(pages);

    return {
      metadata: {
        crawlId: uuidv4(),
        startUrl,
        crawledAt: new Date().toISOString(),
        config: {
          maxDepth: config.crawl?.maxDepth,
          maxPages: config.crawl?.maxPages
        },
        statistics
      },
      library: libraryInfo,
      categories,
      pages,
      errors
    };
  }

  /**
   * Extract unique categories from pages
   */
  extractCategories(pages) {
    const categoryMap = new Map();

    pages.forEach(page => {
      if (page.category && page.category.length > 0) {
        const categoryName = Array.isArray(page.category) ? page.category[0] : page.category;

        if (!categoryMap.has(categoryName)) {
          categoryMap.set(categoryName, {
            id: categoryName.toLowerCase().replace(/\s+/g, '-'),
            name: categoryName,
            pages: [],
            depth: 1
          });
        }

        categoryMap.get(categoryName).pages.push(page.id);
      }
    });

    return Array.from(categoryMap.values());
  }

  /**
   * Count downloaded files
   */
  countDownloadedFiles(pages) {
    let count = 0;
    pages.forEach(page => {
      count += page.documents.filter(d => d.localPath).length;
      count += page.images.filter(i => i.filename).length;
    });
    return count;
  }

  /**
   * Calculate duration
   */
  calculateDuration(startTime, endTime) {
    const duration = endTime - startTime;
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}
