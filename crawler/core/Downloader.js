/**
 * Downloader - Handles file downloads with deduplication
 */

import fs from 'fs-extra';
import path from 'path';
import { getFileExtension, generateUniqueFilename } from '../utils/helpers.js';
import { consoleLogger } from '../utils/logger.js';

export class Downloader {
  constructor(downloadConfig, deduplicator) {
    this.config = downloadConfig || {};
    this.deduplicator = deduplicator;

    this.downloadDir = this.config.downloadDir || './downloads';
    this.allowedTypes = this.config.allowedTypes || ['pdf', 'docx', 'xlsx', 'pptx', 'jpg', 'png'];
    this.maxFileSize = this.config.maxFileSize || 50 * 1024 * 1024; // 50MB
    this.enabled = this.config.enabled !== false;

    this.downloadedCount = 0;
    this.skippedCount = 0;
    this.errors = [];

    // Enhanced deduplication
    this.generateInventory = this.config.generateInventory !== false;
    this.deduplicateByTitle = this.config.deduplicateByTitle !== false;
    this.deduplicateByHash = this.config.deduplicateByHash !== false;

    // Inventory tracking
    this.inventory = [];
    this.titleIndex = new Map(); // title -> url
    this.hashIndex = new Map();  // hash -> url
  }

  /**
   * Initialize download directory
   */
  async init() {
    if (this.enabled) {
      await fs.ensureDir(this.downloadDir);
      consoleLogger.info(`Download directory ready: ${this.downloadDir}`);
    }
  }

  /**
   * Download a file
   */
  async downloadFile(page, url, metadata = {}) {
    if (!this.enabled) {
      // Still add to inventory even if not downloading
      if (this.generateInventory) {
        this.addToInventory({
          url,
          title: metadata.title,
          type: metadata.type || 'unknown',
          downloaded: false,
          reason: 'Downloads disabled'
        });
      }
      return null;
    }

    // Store current page URL to restore later
    const currentUrl = page.url();

    try {
      // Check if already downloaded by URL
      if (this.deduplicator.hasFile(url)) {
        const existing = this.deduplicator.getFile(url);
        consoleLogger.debug(`File already downloaded (URL): ${existing.filename}`);
        this.skippedCount++;
        return existing;
      }

      // Check if duplicate by title
      if (this.deduplicateByTitle && metadata.title) {
        const normalizedTitle = this.normalizeTitle(metadata.title);
        if (this.titleIndex.has(normalizedTitle)) {
          const existingUrl = this.titleIndex.get(normalizedTitle);
          consoleLogger.debug(`File already downloaded (title): ${normalizedTitle}`);
          this.skippedCount++;
          if (this.generateInventory) {
            this.addToInventory({
              url,
              title: metadata.title,
              type: metadata.type,
              downloaded: false,
              reason: `Duplicate of ${existingUrl}`,
              duplicateType: 'title'
            });
          }
          return null;
        }
      }

      // Detect file type
      const fileInfo = await this.detectFileType(url, page);

      // Check if file type is allowed
      if (!this.allowedTypes.includes(fileInfo.extension)) {
        consoleLogger.debug(`Skipping file type: ${fileInfo.extension}`);
        this.skippedCount++;
        return null;
      }

      // Generate unique filename
      const filename = generateUniqueFilename(url, metadata.title, fileInfo.extension);
      const filepath = path.join(this.downloadDir, filename);

      consoleLogger.download(`Downloading: ${filename}`);

      // Download file
      await this.download(page, url, filepath);

      // Check file size
      const stats = await fs.stat(filepath);
      if (stats.size > this.maxFileSize) {
        await fs.unlink(filepath);
        consoleLogger.warn(`File too large (${stats.size} bytes), skipped: ${filename}`);
        this.skippedCount++;
        return null;
      }

      // Register download
      const fileMetadata = this.deduplicator.registerFile(url, filename, filepath);
      fileMetadata.size = stats.size;
      fileMetadata.extension = fileInfo.extension;

      this.downloadedCount++;

      return fileMetadata;
    } catch (error) {
      this.errors.push({
        url,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      consoleLogger.warn(`Failed to download ${url}: ${error.message}`);
      return null;
    }
  }

  /**
   * Download multiple files
   */
  async downloadFiles(page, files) {
    const results = [];

    for (const file of files) {
      const result = await this.downloadFile(page, file.url, { title: file.title });
      if (result) {
        results.push({
          ...file,
          filename: result.filename,
          localPath: result.localPath,
          size: result.size
        });
      }
    }

    return results;
  }

  /**
   * Detect file type from URL and Content-Type
   */
  async detectFileType(url, page) {
    // Step 1: Try URL extension
    const urlExtension = getFileExtension(url);
    if (urlExtension) {
      return { extension: urlExtension, source: 'url' };
    }

    // Step 2: Try HTTP Content-Type header using context.request (no navigation)
    try {
      const context = page.context();
      const response = await context.request.head(url, { timeout: 10000 });
      const contentType = response.headers()['content-type'];

      if (contentType) {
        const extension = getFileExtension(url, contentType);
        if (extension) {
          return { extension, source: 'content-type' };
        }
      }
    } catch (error) {
      // Continue to fallback
    }

    // Fallback: assume PDF if unknown
    return { extension: 'pdf', source: 'fallback' };
  }

  /**
   * Download file using Playwright context.request (no navigation)
   */
  async download(page, url, filepath) {
    try {
      // Use context.request to fetch file WITHOUT navigating the page
      const context = page.context();
      const response = await context.request.get(url, { timeout: 30000 });

      // Get file buffer
      const buffer = await response.body();

      // Write to file
      await fs.writeFile(filepath, buffer);

    } catch (error) {
      throw new Error(`Download failed: ${error.message}`);
    }
  }

  /**
   * Add file to inventory
   */
  addToInventory(entry) {
    this.inventory.push({
      ...entry,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Normalize title for deduplication
   */
  normalizeTitle(title) {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ');
  }

  /**
   * Calculate file hash (simple for now)
   */
  async calculateHash(filepath) {
    try {
      const crypto = await import('crypto');
      const buffer = await fs.readFile(filepath);
      return crypto.createHash('md5').update(buffer).digest('hex');
    } catch (error) {
      return null;
    }
  }

  /**
   * Get file inventory
   */
  getInventory() {
    return this.inventory;
  }

  /**
   * Export inventory to CSV
   */
  async exportInventory(outputPath) {
    if (!this.generateInventory || this.inventory.length === 0) {
      return null;
    }

    try {
      const csvLines = [];
      csvLines.push('URL,Title,Type,Downloaded,Reason,Duplicate Type,Timestamp');

      this.inventory.forEach(entry => {
        csvLines.push([
          entry.url || '',
          (entry.title || '').replace(/,/g, ';'),
          entry.type || '',
          entry.downloaded ? 'Yes' : 'No',
          (entry.reason || '').replace(/,/g, ';'),
          entry.duplicateType || '',
          entry.timestamp || ''
        ].join(','));
      });

      await fs.writeFile(outputPath, csvLines.join('\n'));
      consoleLogger.success(`Inventory exported to: ${outputPath}`);
      return outputPath;
    } catch (error) {
      consoleLogger.error(`Failed to export inventory: ${error.message}`);
      return null;
    }
  }

  /**
   * Get download statistics
   */
  getStats() {
    return {
      downloaded: this.downloadedCount,
      skipped: this.skippedCount,
      errors: this.errors.length,
      downloadDir: this.downloadDir,
      inventorySize: this.inventory.length
    };
  }
}
