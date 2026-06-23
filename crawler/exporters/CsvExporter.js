/**
 * CsvExporter - Exports crawled data to Salesforce-ready CSV format
 */

import fs from 'fs-extra';
import path from 'path';
import { escapeCsvField, truncate } from '../utils/helpers.js';
import { consoleLogger } from '../utils/logger.js';

export class CsvExporter {
  constructor(outputConfig) {
    this.config = outputConfig || {};
    this.csvFile = this.config.csvFile || './output/library_content.csv';
  }

  /**
   * Export crawled data to CSV
   */
  async export(crawlResults) {
    try {
      // Ensure output directory exists
      const outputDir = path.dirname(this.csvFile);
      await fs.ensureDir(outputDir);

      // Build CSV rows
      const csvContent = this.buildCsvContent(crawlResults);

      // Write to file
      await fs.writeFile(this.csvFile, csvContent);

      consoleLogger.success(`CSV exported to: ${this.csvFile}`);

      return this.csvFile;
    } catch (error) {
      consoleLogger.error(`CSV export failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Build CSV content
   */
  buildCsvContent(crawlResults) {
    const { pages } = crawlResults;

    // Define CSV headers (Salesforce Content__c fields)
    const headers = [
      'Content_Unique_Id__c',
      'Name',
      'Content_Type__c',
      'Status__c',
      'Parent_Content_Unique_Id__c',
      'Title__c',
      'Summary__c',
      'Body__c',
      'Source_URL__c',
      'Category__c',
      'Topics__c',
      'Video_URLs__c',
      'Image_URLs__c',
      'Document_URLs__c',
      'Word_Count__c',
      'Scraped_At__c'
    ];

    // Build rows
    const rows = [headers.join(',')];

    pages.forEach(page => {
      const row = this.buildCsvRow(page);
      rows.push(row);
    });

    return rows.join('\n');
  }

  /**
   * Build CSV row for a page
   */
  buildCsvRow(page) {
    // Determine content type
    const contentType = this.determineContentType(page);

    // Build row data
    const rowData = [
      page.id,
      truncate(page.title, 80),
      contentType,
      'Published',
      '', // Parent ID - will be populated based on hierarchy
      truncate(page.title, 255),
      truncate(page.summary, 500),
      truncate(page.body, 30000),
      page.url,
      this.formatArrayField(page.category),
      this.formatArrayField(page.topics),
      this.formatVideoUrls(page.videos),
      this.formatImageUrls(page.images),
      this.formatDocumentUrls(page.documents),
      page.metadata.wordCount || 0,
      page.metadata.scrapedAt || ''
    ];

    // Escape and join
    return rowData.map(field => escapeCsvField(field)).join(',');
  }

  /**
   * Determine content type from page metadata
   */
  determineContentType(page) {
    // Simple heuristic: pages with documents are articles, others are reference guides
    if (page.documents.length > 0) {
      return 'Article';
    }

    if (page.category && page.category.length > 0) {
      return 'Reference Guides';
    }

    return 'Reference Guides';
  }

  /**
   * Format array field as pipe-separated string
   */
  formatArrayField(array) {
    if (!array || array.length === 0) return '';

    return Array.isArray(array) ? array.join('|') : array;
  }

  /**
   * Format video URLs
   */
  formatVideoUrls(videos) {
    if (!videos || videos.length === 0) return '';

    return videos.map(v => v.url).join('|');
  }

  /**
   * Format image URLs
   */
  formatImageUrls(images) {
    if (!images || images.length === 0) return '';

    return images.map(i => i.filename || i.url).join('|');
  }

  /**
   * Format document URLs
   */
  formatDocumentUrls(documents) {
    if (!documents || documents.length === 0) return '';

    return documents.map(d => d.filename || d.url).join('|');
  }
}
