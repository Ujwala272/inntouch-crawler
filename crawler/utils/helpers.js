/**
 * Helper utilities for crawler
 */

import crypto from 'crypto';
import path from 'path';
import { URL } from 'url';

/**
 * Clean and normalize text content
 */
export function cleanText(text) {
  if (!text) return '';

  return text
    .replace(/\s+/g, ' ')           // Normalize whitespace
    .replace(/&amp;/g, '&')         // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

/**
 * Generate slug from text
 */
export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')      // Remove non-word chars
    .replace(/\s+/g, '-')          // Replace spaces with hyphens
    .replace(/-+/g, '-')           // Replace multiple hyphens
    .replace(/^-+|-+$/g, '');      // Trim hyphens from ends
}

/**
 * Generate unique ID from URL
 */
export function generateIdFromUrl(url) {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname;

    // Extract last meaningful segment
    const segments = pathname.split('/').filter(s => s && s.length > 0);
    const lastSegment = segments[segments.length - 1] || 'page';

    // Generate slug
    let slug = slugify(lastSegment);

    // Add hash for uniqueness if needed
    if (slug.length < 5) {
      const hash = crypto.createHash('md5').update(url).digest('hex').substring(0, 6);
      slug = `${slug}-${hash}`;
    }

    return slug;
  } catch (error) {
    // Fallback: hash the URL
    return crypto.createHash('md5').update(url).digest('hex').substring(0, 12);
  }
}

/**
 * Extract file extension from URL or content type
 */
export function getFileExtension(url, contentType = null) {
  const knownExtensions = ['pdf', 'docx', 'xlsx', 'pptx', 'doc', 'xls', 'ppt', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'mp4', 'webm', 'zip'];

  // Scan the full URL (including query string) for a known extension, closest
  // to the end first - handles download links proxied through a query param,
  // e.g. index.asp?Action=GET&ID=path/to/file.pdf, where the real file
  // extension isn't on the URL path.
  const matches = [...url.matchAll(/\.([a-zA-Z0-9]{2,5})(?=[?&#]|$)/g)];
  for (let i = matches.length - 1; i >= 0; i--) {
    const ext = matches[i][1].toLowerCase();
    if (knownExtensions.includes(ext)) {
      return ext;
    }
  }

  // Try URL path extension (covers any extension, not just known ones)
  try {
    const parsed = new URL(url);
    const ext = path.extname(parsed.pathname).toLowerCase();
    if (ext && ext.length > 1) {
      return ext.substring(1); // Remove leading dot
    }
  } catch (error) {
    // Invalid URL, continue to content type
  }

  // Try content type
  if (contentType) {
    const mimeToExt = {
      'application/pdf': 'pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
      'application/msword': 'doc',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.ms-powerpoint': 'ppt',
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/svg+xml': 'svg',
      'video/mp4': 'mp4',
      'video/webm': 'webm'
    };

    return mimeToExt[contentType] || null;
  }

  return null;
}

/**
 * Check if URL is same domain as base
 */
export function isSameDomain(url, baseUrl) {
  try {
    const urlObj = new URL(url);
    const baseObj = new URL(baseUrl);
    return urlObj.hostname === baseObj.hostname;
  } catch (error) {
    return false;
  }
}

/**
 * Truncate text to max length
 */
export function truncate(text, maxLength, suffix = '...') {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Escape CSV field
 */
export function escapeCsvField(value) {
  if (value === null || value === undefined) return '';

  const str = String(value);

  // If contains comma, newline, or quote, wrap in quotes and escape internal quotes
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Parse URL patterns from config
 */
export function matchesPattern(url, patterns) {
  if (!patterns || patterns.length === 0) return true;

  return patterns.some(pattern => {
    try {
      const regex = new RegExp(pattern);
      return regex.test(url);
    } catch (error) {
      // If pattern is not valid regex, do literal string match
      return url.includes(pattern);
    }
  });
}

/**
 * Get domain from URL
 */
export function getDomain(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch (error) {
    return null;
  }
}

/**
 * Resolve relative URL to absolute
 */
export function resolveUrl(relativeUrl, baseUrl) {
  try {
    return new URL(relativeUrl, baseUrl).toString();
  } catch (error) {
    return null;
  }
}

/**
 * Substitute environment variables in string
 */
export function substituteEnvVars(str) {
  if (typeof str !== 'string') return str;

  return str.replace(/\$\{([^}]+)\}/g, (match, varName) => {
    return process.env[varName] || match;
  });
}

/**
 * Deep merge objects
 */
export function deepMerge(target, source) {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }

  return output;
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Wait for specified milliseconds
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate unique filename
 */
export function generateUniqueFilename(url, title, extension) {
  const slug = title ? slugify(title) : generateIdFromUrl(url);
  const timestamp = Date.now();
  const hash = crypto.createHash('md5').update(url).digest('hex').substring(0, 6);

  return `${slug}-${hash}.${extension}`;
}
