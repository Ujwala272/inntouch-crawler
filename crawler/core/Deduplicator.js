/**
 * Deduplicator - Handles URL and file deduplication
 */

import crypto from 'crypto';
import { URL } from 'url';

export class Deduplicator {
  constructor() {
    this.visitedUrls = new Set();
    this.urlHashes = new Map(); // URL hash → metadata
    this.fileHashes = new Map(); // File hash → filename
  }

  /**
   * Check if URL has been visited
   */
  hasVisited(url) {
    const normalized = this.normalizeUrl(url);
    return this.visitedUrls.has(normalized);
  }

  /**
   * Mark URL as visited
   */
  markVisited(url) {
    const normalized = this.normalizeUrl(url);
    this.visitedUrls.add(normalized);
    return normalized;
  }

  /**
   * Check if file has been downloaded
   */
  hasFile(url) {
    const hash = this.hashUrl(url);
    return this.urlHashes.has(hash);
  }

  /**
   * Get previously downloaded file info
   */
  getFile(url) {
    const hash = this.hashUrl(url);
    return this.urlHashes.get(hash);
  }

  /**
   * Register downloaded file
   */
  registerFile(url, filename, localPath) {
    const hash = this.hashUrl(url);
    const metadata = { url, filename, localPath, downloadedAt: new Date().toISOString() };
    this.urlHashes.set(hash, metadata);
    this.fileHashes.set(hash, filename);
    return metadata;
  }

  /**
   * Normalize URL for consistent comparison
   * - Remove tracking params
   * - Sort query params
   * - Remove trailing slash
   * - Lowercase domain
   */
  normalizeUrl(urlString) {
    try {
      const url = new URL(urlString);

      // Lowercase the hostname
      url.hostname = url.hostname.toLowerCase();

      // Remove common tracking parameters
      const trackingParams = [
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
        'sessionid', 'session_id', 'sid', 'ref', 'referrer', 'source',
        'fbclid', 'gclid', 'msclkid', '_ga', '_gid'
      ];

      trackingParams.forEach(param => {
        url.searchParams.delete(param);
      });

      // Sort query params for consistency
      const sortedParams = new URLSearchParams([...url.searchParams.entries()].sort());
      url.search = sortedParams.toString();

      // Remove trailing slash from pathname
      if (url.pathname !== '/') {
        url.pathname = url.pathname.replace(/\/$/, '');
      }

      // Remove default ports
      if ((url.protocol === 'http:' && url.port === '80') ||
          (url.protocol === 'https:' && url.port === '443')) {
        url.port = '';
      }

      return url.toString();
    } catch (error) {
      // If URL parsing fails, return original string
      return urlString;
    }
  }

  /**
   * Generate hash for URL
   */
  hashUrl(url) {
    const normalized = this.normalizeUrl(url);
    return crypto.createHash('md5').update(normalized).digest('hex');
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      visitedUrls: this.visitedUrls.size,
      downloadedFiles: this.fileHashes.size
    };
  }

  /**
   * Reset all tracking
   */
  reset() {
    this.visitedUrls.clear();
    this.urlHashes.clear();
    this.fileHashes.clear();
  }
}
