#!/usr/bin/env node

/**
 * Compare new crawler output with old scraper output
 * Usage: node scripts/compare-with-old-scraper.js
 */

import fs from 'fs-extra';
import path from 'path';

const OLD_SCRAPER_OUTPUT = '../scraper/output/complete-inntouch-content.json';
const NEW_CRAWLER_OUTPUT = './output/inntouch_library_content.json';

async function compare() {
  console.log('📊 Comparing New Crawler vs Old Scraper\n');
  console.log('═══════════════════════════════════════════════════════\n');

  // Check if files exist
  if (!await fs.pathExists(OLD_SCRAPER_OUTPUT)) {
    console.log('⚠️  Old scraper output not found at:', OLD_SCRAPER_OUTPUT);
    console.log('    This is OK if you want to just review the new crawler output.\n');
  }

  if (!await fs.pathExists(NEW_CRAWLER_OUTPUT)) {
    console.log('❌ New crawler output not found at:', NEW_CRAWLER_OUTPUT);
    console.log('    Run the crawler first: node bin/crawl.js --config config/inntouch.config.json\n');
    process.exit(1);
  }

  // Load new crawler output
  const newData = await fs.readJson(NEW_CRAWLER_OUTPUT);

  console.log('✅ NEW CRAWLER OUTPUT\n');
  console.log(`Crawl ID:           ${newData.metadata.crawlId}`);
  console.log(`Start URL:          ${newData.metadata.startUrl}`);
  console.log(`Crawled At:         ${newData.metadata.crawledAt}`);
  console.log(`Pages Crawled:      ${newData.metadata.statistics.pagesVisited}`);
  console.log(`Files Downloaded:   ${newData.metadata.statistics.filesDownloaded}`);
  console.log(`Errors:             ${newData.metadata.statistics.errors}`);
  console.log(`Duration:           ${newData.metadata.statistics.duration}`);
  console.log('');

  // Analyze categories
  console.log('📂 CATEGORIES\n');
  if (newData.categories && newData.categories.length > 0) {
    console.log(`Total Categories: ${newData.categories.length}\n`);
    newData.categories.forEach((cat, idx) => {
      console.log(`${idx + 1}. ${cat.name}`);
      console.log(`   ID: ${cat.id}`);
      console.log(`   Pages: ${cat.pages ? cat.pages.length : 0}`);
      console.log('');
    });
  } else {
    console.log('No categories extracted\n');
  }

  // Analyze documents
  console.log('📄 DOCUMENTS\n');
  const allDocuments = [];
  newData.pages.forEach(page => {
    if (page.documents && page.documents.length > 0) {
      page.documents.forEach(doc => {
        allDocuments.push({
          page: page.title,
          title: doc.title,
          url: doc.url,
          type: doc.type,
          filename: doc.filename,
          hasLocalFile: !!doc.localPath
        });
      });
    }
  });

  console.log(`Total Documents Found: ${allDocuments.length}\n`);
  allDocuments.forEach((doc, idx) => {
    console.log(`${idx + 1}. ${doc.title || 'Untitled'}`);
    console.log(`   Type: ${doc.type}`);
    console.log(`   URL: ${doc.url}`);
    if (doc.filename) {
      console.log(`   Filename: ${doc.filename}`);
    }
    console.log(`   Downloaded: ${doc.hasLocalFile ? '✅' : '❌'}`);
    console.log('');
  });

  // Analyze images
  console.log('🖼️  IMAGES\n');
  const allImages = [];
  newData.pages.forEach(page => {
    if (page.images && page.images.length > 0) {
      page.images.forEach(img => {
        allImages.push({
          page: page.title,
          url: img.url,
          alt: img.alt,
          filename: img.filename,
          hasLocalFile: !!img.localPath
        });
      });
    }
  });

  console.log(`Total Images Found: ${allImages.length}\n`);
  const downloadedImages = allImages.filter(img => img.hasLocalFile).length;
  console.log(`Downloaded: ${downloadedImages} / ${allImages.length}\n`);

  // Analyze videos
  console.log('🎥 VIDEOS\n');
  const allVideos = [];
  newData.pages.forEach(page => {
    if (page.videos && page.videos.length > 0) {
      page.videos.forEach(video => {
        allVideos.push({
          page: page.title,
          url: video.url,
          provider: video.provider,
          videoId: video.videoId
        });
      });
    }
  });

  console.log(`Total Videos Found: ${allVideos.length}\n`);
  if (allVideos.length > 0) {
    allVideos.forEach((video, idx) => {
      console.log(`${idx + 1}. ${video.provider} - ${video.videoId}`);
      console.log(`   Page: ${video.page}`);
      console.log(`   URL: ${video.url}`);
      console.log('');
    });
  }

  // Compare with old scraper if available
  if (await fs.pathExists(OLD_SCRAPER_OUTPUT)) {
    console.log('\n═══════════════════════════════════════════════════════\n');
    console.log('📊 COMPARISON WITH OLD SCRAPER (June 19, 2026)\n');

    const oldData = await fs.readJson(OLD_SCRAPER_OUTPUT);

    // Expected from old scraper
    const expectedCategories = 11;
    const expectedDocuments = 4;
    const expectedImages = 33;

    console.log('Expected (Old Scraper):');
    console.log(`  Categories: ${expectedCategories}`);
    console.log(`  Documents:  ${expectedDocuments} PDFs`);
    console.log(`  Images:     ~${expectedImages}`);
    console.log('');

    console.log('Actual (New Crawler):');
    console.log(`  Categories: ${newData.categories ? newData.categories.length : 0}`);
    console.log(`  Documents:  ${allDocuments.length}`);
    console.log(`  Images:     ${allImages.length}`);
    console.log('');

    // Compare
    const categoryMatch = (newData.categories ? newData.categories.length : 0) >= expectedCategories;
    const documentMatch = allDocuments.length >= expectedDocuments;
    const imageMatch = allImages.length >= expectedImages * 0.8; // Allow 20% variance

    console.log('Comparison:');
    console.log(`  Categories: ${categoryMatch ? '✅ PASS' : '⚠️  WARN'}`);
    console.log(`  Documents:  ${documentMatch ? '✅ PASS' : '⚠️  WARN'}`);
    console.log(`  Images:     ${imageMatch ? '✅ PASS' : '⚠️  WARN'}`);
    console.log('');

    if (categoryMatch && documentMatch && imageMatch) {
      console.log('✅ All checks passed! New crawler extracted same or more content.\n');
    } else {
      console.log('⚠️  Some checks failed. Review the differences above.\n');
      console.log('Possible reasons:');
      console.log('- Content was removed/changed since June 19th');
      console.log('- Crawler stopped early (maxPages limit)');
      console.log('- Selectors need adjustment for updated HTML');
      console.log('');
    }
  }

  // Output file sizes
  console.log('═══════════════════════════════════════════════════════\n');
  console.log('📦 OUTPUT FILE SIZES\n');

  const jsonStats = await fs.stat(NEW_CRAWLER_OUTPUT);
  console.log(`JSON: ${(jsonStats.size / 1024).toFixed(2)} KB`);

  const csvFile = NEW_CRAWLER_OUTPUT.replace('.json', '.csv');
  if (await fs.pathExists(csvFile)) {
    const csvStats = await fs.stat(csvFile);
    console.log(`CSV:  ${(csvStats.size / 1024).toFixed(2)} KB`);
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════\n');
}

compare().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
