/**
 * Navigator - Handles link discovery and crawl queue management
 */

import { Deduplicator } from './Deduplicator.js';
import { matchesPattern, getDomain, resolveUrl } from '../utils/helpers.js';
import { consoleLogger } from '../utils/logger.js';

export class Navigator {
  constructor(crawlConfig, deduplicator) {
    this.config = crawlConfig || {};
    this.deduplicator = deduplicator || new Deduplicator();

    this.maxDepth = this.config.maxDepth || 3;
    this.maxPages = this.config.maxPages || 100;
    this.allowedDomains = this.config.allowedDomains || [];
    this.includePatterns = this.config.includePatterns || [];
    this.excludePatterns = this.config.excludePatterns || [];

    this.queue = [];
    this.pagesVisited = 0;
  }

  /**
   * Discover links on a page
   */
  async discoverLinks(page, currentUrl, currentDepth) {
    try {
      // Extract all links from page
      const links = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a[href]'));
        return anchors.map(a => ({
          url: a.href,
          text: a.textContent.trim(),
          title: a.title || ''
        }));
      });

      consoleLogger.debug(`Found ${links.length} links on page`);

      // Filter and add to queue
      const newLinks = [];
      const filteredLinks = [];
      for (const link of links) {
        const shouldCrawl = this.shouldCrawl(link.url, currentUrl, currentDepth + 1);
        if (!shouldCrawl) {
          filteredLinks.push(link.url);
        }
        if (shouldCrawl) {
          // Mark as visited to avoid adding duplicate
          if (!this.deduplicator.hasVisited(link.url)) {
            this.deduplicator.markVisited(link.url);
            newLinks.push({
              url: link.url,
              depth: currentDepth + 1,
              parent: currentUrl,
              text: link.text
            });
          }
        }
      }

      // Debug: show sample of filtered URLs
      if (filteredLinks.length > 0) {
        consoleLogger.debug(`Filtered out ${filteredLinks.length} links (samples):`);
        filteredLinks.slice(0, 5).forEach(url => consoleLogger.debug(`  - ${url}`));
      }

      // Add to queue
      this.queue.push(...newLinks);

      consoleLogger.debug(`Added ${newLinks.length} new links to queue (total: ${this.queue.length})`);

      return newLinks;
    } catch (error) {
      consoleLogger.warn(`Error discovering links: ${error.message}`);
      return [];
    }
  }

  /**
   * Check if URL should be crawled
   */
  shouldCrawl(url, baseUrl, depth) {
    try {
      // Check if already visited
      if (this.deduplicator.hasVisited(url)) {
        return false;
      }

      // Check depth limit
      if (depth > this.maxDepth) {
        return false;
      }

      // Check pages limit
      if (this.pagesVisited >= this.maxPages) {
        return false;
      }

      // Resolve relative URLs
      const absoluteUrl = resolveUrl(url, baseUrl);
      if (!absoluteUrl) {
        return false;
      }

      // Check domain whitelist
      if (this.allowedDomains.length > 0) {
        const domain = getDomain(absoluteUrl);
        const isAllowed = this.allowedDomains.some(allowed =>
          domain === allowed || domain.endsWith(`.${allowed}`)
        );
        if (!isAllowed) {
          return false;
        }
      }

      // Check exclude patterns
      if (this.excludePatterns.length > 0) {
        if (matchesPattern(absoluteUrl, this.excludePatterns)) {
          return false;
        }
      }

      // Check include patterns
      if (this.includePatterns.length > 0) {
        if (!matchesPattern(absoluteUrl, this.includePatterns)) {
          return false;
        }
      }

      // Skip common non-content URLs
      const skipPatterns = [
        '#', 'javascript:', 'mailto:', 'tel:', 'ftp:', 'file:',
        '.css', '.js', '.ico', '.woff', '.ttf', '.eot'
      ];

      for (const pattern of skipPatterns) {
        if (absoluteUrl.startsWith(pattern) || absoluteUrl.includes(pattern)) {
          return false;
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get next URL from queue
   */
  getNext() {
    if (this.queue.length === 0) {
      return null;
    }

    // BFS: take from front of queue
    const next = this.queue.shift();
    this.pagesVisited++;

    return next;
  }

  /**
   * Check if queue is empty
   */
  isEmpty() {
    return this.queue.length === 0;
  }

  /**
   * Get queue size
   */
  getQueueSize() {
    return this.queue.length;
  }

  /**
   * Get pages visited count
   */
  getPagesVisited() {
    return this.pagesVisited;
  }

  /**
   * Check if max pages reached
   */
  isMaxPagesReached() {
    return this.pagesVisited >= this.maxPages;
  }

  /**
   * Add URL to queue manually
   */
  addToQueue(url, depth = 0, parent = null) {
    if (!this.deduplicator.hasVisited(url)) {
      this.deduplicator.markVisited(url);
      this.queue.push({ url, depth, parent });
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      queueSize: this.queue.length,
      pagesVisited: this.pagesVisited,
      maxPages: this.maxPages,
      maxDepth: this.maxDepth
    };
  }
}
