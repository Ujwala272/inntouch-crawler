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
      return null;
    }

    try {
      // Check if already downloaded
      if (this.deduplicator.hasFile(url)) {
        const existing = this.deduplicator.getFile(url);
        consoleLogger.debug(`File already downloaded: ${existing.filename}`);
        this.skippedCount++;
        return existing;
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

    // Step 2: Try HTTP Content-Type header
    try {
      const response = await page.goto(url, { waitUntil: 'commit', timeout: 10000 });
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
   * Download file using Playwright
   */
  async download(page, url, filepath) {
    try {
      // Navigate to file URL and get response
      const response = await page.goto(url, {
        waitUntil: 'commit',
        timeout: 30000
      });

      // Get file buffer
      const buffer = await response.body();

      // Write to file
      await fs.writeFile(filepath, buffer);

    } catch (error) {
      throw new Error(`Download failed: ${error.message}`);
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
      downloadDir: this.downloadDir
    };
  }
}
