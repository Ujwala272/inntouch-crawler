/**
 * Extractor - Handles content extraction from pages
 */

import { cleanText, truncate, generateIdFromUrl } from '../utils/helpers.js';
import { consoleLogger } from '../utils/logger.js';

export class Extractor {
  constructor(extractionConfig) {
    this.config = extractionConfig || {};
    this.selectors = this.config.selectors || {};
    this.useHeuristics = this.config.useHeuristics !== false;
  }

  /**
   * Extract all content from a page
   */
  async extractContent(page, url) {
    try {
      const content = {
        id: generateIdFromUrl(url),
        url: url,
        title: await this.extractTitle(page),
        headings: await this.extractHeadings(page),
        body: await this.extractBody(page),
        bodyHtml: await this.extractBodyHtml(page),
        summary: '',
        category: await this.extractCategory(page, url),
        topics: await this.extractTopics(page),
        videos: await this.extractVideos(page),
        images: await this.extractImages(page, url),
        documents: await this.extractDocuments(page, url),
        metadata: {
          scrapedAt: new Date().toISOString(),
          wordCount: 0
        }
      };

      // Generate summary from body
      content.summary = this.generateSummary(content.body);

      // Calculate word count
      content.metadata.wordCount = content.body.split(/\s+/).length;
      content.metadata.hasVideo = content.videos.length > 0;
      content.metadata.hasDocuments = content.documents.length > 0;
      content.metadata.hasImages = content.images.length > 0;

      return content;
    } catch (error) {
      consoleLogger.error(`Error extracting content from ${url}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extract page title
   */
  async extractTitle(page) {
    try {
      // Try configured selectors first
      if (this.selectors.title) {
        const title = await page.locator(this.selectors.title).first().textContent();
        if (title) return cleanText(title);
      }

      // Fallback: Try common title selectors
      const titleSelectors = [
        'h1',
        '.page-title',
        '.article-title',
        '.post-title',
        'title'
      ];

      for (const selector of titleSelectors) {
        try {
          const title = await page.locator(selector).first().textContent();
          if (title) return cleanText(title);
        } catch (e) {
          continue;
        }
      }

      return 'Untitled Page';
    } catch (error) {
      return 'Untitled Page';
    }
  }

  /**
   * Extract headings
   */
  async extractHeadings(page) {
    try {
      return await page.evaluate(() => {
        const headings = [];
        const elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        elements.forEach(el => {
          const text = el.textContent.trim();
          if (text && text.length > 0) {
            headings.push({
              level: parseInt(el.tagName.substring(1)),
              text: text
            });
          }
        });
        return headings;
      });
    } catch (error) {
      return [];
    }
  }

  /**
   * Extract body text
   */
  async extractBody(page) {
    try {
      // Try configured selectors first
      if (this.selectors.body) {
        const body = await page.locator(this.selectors.body).first().textContent();
        if (body) return cleanText(body);
      }

      // Try heuristic extraction
      if (this.useHeuristics) {
        return await this.extractBodyHeuristic(page);
      }

      // Fallback: get all text from body
      const body = await page.locator('body').textContent();
      return cleanText(body);
    } catch (error) {
      return '';
    }
  }

  /**
   * Extract body HTML
   */
  async extractBodyHtml(page) {
    try {
      if (this.selectors.body) {
        return await page.locator(this.selectors.body).first().innerHTML();
      }

      // Try semantic HTML5 tags
      const semanticSelectors = ['article', 'main', '.content', '.post-content', '.article-content'];

      for (const selector of semanticSelectors) {
        try {
          const html = await page.locator(selector).first().innerHTML();
          if (html) return html;
        } catch (e) {
          continue;
        }
      }

      return '';
    } catch (error) {
      return '';
    }
  }

  /**
   * Heuristic-based body extraction
   * Finds the largest text block, removes navigation/footer
   */
  async extractBodyHeuristic(page) {
    try {
      return await page.evaluate(() => {
        // Try semantic HTML5 tags first
        const article = document.querySelector('article');
        if (article) return article.textContent.trim();

        const main = document.querySelector('main');
        if (main) return main.textContent.trim();

        // Find largest text block
        const candidates = document.querySelectorAll('div, section, article');
        let maxLength = 0;
        let bestCandidate = null;

        candidates.forEach(el => {
          // Skip nav, footer, sidebar
          if (el.tagName === 'NAV' || el.tagName === 'FOOTER' ||
              el.classList.contains('nav') || el.classList.contains('footer') ||
              el.classList.contains('sidebar') || el.classList.contains('menu')) {
            return;
          }

          const text = el.textContent.trim();
          if (text.length > maxLength) {
            maxLength = text.length;
            bestCandidate = el;
          }
        });

        return bestCandidate ? bestCandidate.textContent.trim() : '';
      });
    } catch (error) {
      return '';
    }
  }

  /**
   * Extract category from URL or breadcrumbs
   */
  async extractCategory(page, url) {
    try {
      // Try breadcrumbs first
      const breadcrumbs = await page.evaluate(() => {
        const crumbs = document.querySelectorAll('.breadcrumb a, .breadcrumbs a, nav[aria-label="breadcrumb"] a');
        return Array.from(crumbs).map(a => a.textContent.trim());
      });

      if (breadcrumbs.length > 0) {
        return breadcrumbs;
      }

      // Extract from URL
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname.split('/').filter(s => s && s.length > 0);

      if (pathSegments.length > 1) {
        return [pathSegments[pathSegments.length - 2]];
      }

      return [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Extract topics/tags
   */
  async extractTopics(page) {
    try {
      return await page.evaluate(() => {
        const topics = [];
        const tags = document.querySelectorAll('.tag, .topic, .category, [rel="tag"]');
        tags.forEach(tag => {
          const text = tag.textContent.trim();
          if (text && !topics.includes(text)) {
            topics.push(text);
          }
        });
        return topics;
      });
    } catch (error) {
      return [];
    }
  }

  /**
   * Extract video embeds
   */
  async extractVideos(page) {
    try {
      const videoSelector = this.selectors.videos || 'iframe[src*="vimeo"], iframe[src*="youtube"], iframe[src*="youtu.be"]';

      return await page.evaluate((selector) => {
        const iframes = document.querySelectorAll(selector);
        return Array.from(iframes).map(iframe => {
          const src = iframe.src;
          let provider = 'unknown';
          let videoId = '';

          if (src.includes('vimeo')) {
            provider = 'vimeo';
            const match = src.match(/vimeo\.com\/video\/(\d+)/);
            videoId = match ? match[1] : '';
          } else if (src.includes('youtube') || src.includes('youtu.be')) {
            provider = 'youtube';
            const match = src.match(/embed\/([^?]+)/);
            videoId = match ? match[1] : '';
          }

          return {
            url: src,
            provider: provider,
            videoId: videoId,
            embedHtml: iframe.outerHTML
          };
        });
      }, videoSelector);
    } catch (error) {
      return [];
    }
  }

  /**
   * Extract images
   */
  async extractImages(page, baseUrl) {
    try {
      const imageSelector = this.selectors.images || 'img[src]';

      return await page.evaluate((selector) => {
        const images = document.querySelectorAll(selector);
        return Array.from(images).map(img => ({
          url: img.src,
          alt: img.alt || '',
          title: img.title || ''
        })).filter(img => {
          // Filter out tracking pixels, icons, etc.
          return img.url && !img.url.includes('1x1') && !img.url.includes('pixel');
        });
      }, imageSelector);
    } catch (error) {
      return [];
    }
  }

  /**
   * Extract document links
   */
  async extractDocuments(page, baseUrl) {
    try {
      const docSelector = this.selectors.documents ||
        'a[href$=".pdf"], a[href$=".docx"], a[href$=".xlsx"], a[href$=".pptx"], a[href*="/docs/"], a[href*="/documents/"]';

      return await page.evaluate((selector) => {
        const links = document.querySelectorAll(selector);
        return Array.from(links).map(a => {
          const url = a.href;
          const text = a.textContent.trim();

          // Detect file type from URL
          let type = 'unknown';
          if (url.endsWith('.pdf')) type = 'pdf';
          else if (url.endsWith('.docx')) type = 'docx';
          else if (url.endsWith('.xlsx')) type = 'xlsx';
          else if (url.endsWith('.pptx')) type = 'pptx';
          else if (url.endsWith('.doc')) type = 'doc';
          else if (url.endsWith('.xls')) type = 'xls';
          else if (url.endsWith('.ppt')) type = 'ppt';

          return {
            url: url,
            title: text || a.title || '',
            type: type
          };
        }).filter(doc => doc.url);
      }, docSelector);
    } catch (error) {
      return [];
    }
  }

  /**
   * Generate summary from body text
   */
  generateSummary(bodyText, maxLength = 300) {
    if (!bodyText) return '';

    // Get first paragraph or first N characters
    const paragraphs = bodyText.split('\n').filter(p => p.trim().length > 50);

    if (paragraphs.length > 0) {
      return truncate(paragraphs[0], maxLength);
    }

    return truncate(bodyText, maxLength);
  }
}
