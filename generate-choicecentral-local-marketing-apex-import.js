/**
 * Generate Apex Code to Import ChoiceCentral Local Marketing Support Suite
 *
 * Reads the crawler output (choicecentral_local_marketing_crawl.json) and
 * generates an Apex importer class following the same Content__c/
 * Translations__c pattern as MarketingSuiteImporter_Full.cls and
 * LocalSalesLibraryImporter_v3.cls:
 *   Library -> Category (Parent_Content__c = library) -> Article (Parent_Content__c = category)
 */

const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, 'choicecentral-local-marketing', 'choicecentral_local_marketing_crawl.json');
const OUTPUT_DIR = path.join(__dirname, 'generated-apex');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const LIBRARY_NAME = 'Local Marketing Support Suite';
const LIBRARY_ID_PREFIX = '00018-local-marketing-support-suite';

// Maps each crawled page URL to its slug (category-level pages) or its
// parent category slug + own slug (sub-pages, become articles under that category).
const PAGE_MAP = [
  { url: '/LocalMarketing/index.asp', kind: 'library', slug: null },
  { url: '/digital-marketing/index.asp', kind: 'category', slug: 'digital-marketing', title: 'Digital Marketing' },
  { url: '/digital-marketing/revup.asp', kind: 'article', slug: 'revup', parentSlug: 'digital-marketing', title: 'RevUp' },
  { url: '/digital-marketing/seo.asp', kind: 'article', slug: 'seo', parentSlug: 'digital-marketing', title: 'Search Engine Optimization (SEO)' },
  { url: '/digital-marketing/social-media.asp', kind: 'article', slug: 'social-media', parentSlug: 'digital-marketing', title: 'Social Media' },
  { url: '/digital-marketing/tripadvisor.asp', kind: 'article', slug: 'tripadvisor', parentSlug: 'digital-marketing', title: 'Tripadvisor' },
  { url: '/website/index.asp', kind: 'category', slug: 'website', title: 'Website' },
  { url: '/website/vanity.asp', kind: 'article', slug: 'vanity-sites', parentSlug: 'website', title: 'Vanity Sites' },
  { url: '/collateral-photography/index.asp', kind: 'category', slug: 'collateral-photography', title: 'Collateral & Photography' },
  { url: '/collateral-photography/collateral.asp', kind: 'article', slug: 'smartmarketing', parentSlug: 'collateral-photography', title: 'SmartMarketing' },
  { url: '/co-op-marketing/index.asp', kind: 'category', slug: 'co-op-marketing', title: 'Co-op Marketing Program' },
  { url: '/new-hotels/index.asp', kind: 'category', slug: 'new-hotels', title: 'New Hotels' },
  { url: '/B2B-Marketing-Opportunities.asp', kind: 'category', slug: 'b2b-marketing', title: 'B2B Marketing' },
  { url: '/choice-accelerate/index.asp', kind: 'category', slug: 'choice-accelerate', title: 'Choice Accelerate' },
];

console.log('=== Generating ChoiceCentral Local Marketing Apex Import ===\n');

const data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
console.log(`Loaded ${data.pages.length} crawled pages\n`);

// Exact topic associations as curated by hand in the sandbox org (exported via
// SOQL from Content_Topic__c) - replicated here instead of the original
// generic "attach everything to one Marketing topic" placeholder, so a
// replicate-to-another-org run reproduces the real curation, not the seed.
const TOPIC_MAP_FILE = path.join(OUTPUT_DIR, 'choicecentral-local-marketing-topic-map.json');
const topicMap = fs.existsSync(TOPIC_MAP_FILE) ? JSON.parse(fs.readFileSync(TOPIC_MAP_FILE, 'utf8')) : null;

const pagesByUrl = new Map(data.pages.map(p => [p.url, p]));

function findPage(urlSuffix) {
  for (const [url, page] of pagesByUrl) {
    if (url.endsWith(urlSuffix)) return page;
  }
  return null;
}

const libraryEntry = PAGE_MAP.find(e => e.kind === 'library');
const categoryEntries = PAGE_MAP.filter(e => e.kind === 'category');
const articleEntries = PAGE_MAP.filter(e => e.kind === 'article');

const libraryPage = findPage(libraryEntry.url);
if (!libraryPage) throw new Error('Library homepage not found in crawl JSON');

// Attach documents to the entry that references each page, resolved at generation time.
function docsFor(entry) {
  const page = findPage(entry.url);
  return page ? page.documents || [] : [];
}

console.log('Categories:', categoryEntries.length);
console.log('Articles:', articleEntries.length);
const totalDocs = PAGE_MAP.reduce((sum, e) => sum + docsFor(e).length, 0);
console.log('Total document links:', totalDocs);
console.log('');

generateImporter();
console.log('\nDone. Generated: generated-apex/ChoiceCentralLocalMarketingImporter.cls');

function generateImporter() {
  let apex = `/**
 * ChoiceCentral Local Marketing Support Suite Importer
 * Generated automatically from choicecentral_local_marketing_crawl.json
 *
 * Usage:
 *   1. Deploy this class
 *   2. Run: ChoiceCentralLocalMarketingImporter.importAll();
 */
public class ChoiceCentralLocalMarketingImporter {

    private static final String LIBRARY_NAME = '${escapeApexString(LIBRARY_NAME)}';
    private static final String LIBRARY_ID_PREFIX = '${LIBRARY_ID_PREFIX}';

    public static void importAll() {
        System.debug('=== ChoiceCentral Local Marketing Support Suite Import ===');

        try {
            cleanup();

            Content__c library = createLibrary();
            Map<String, Content__c> categoryMap = createCategories(library.Id);
            Map<String, Content__c> articleMap = createArticles(library.Id, categoryMap);

            createTranslations(library, categoryMap, articleMap);
            createTopicAssociations(library, categoryMap, articleMap);

            System.debug('=== Import Complete ===');
            System.debug('Library ID: ' + library.Id);
            System.debug('Categories: ' + categoryMap.size());
            System.debug('Articles: ' + articleMap.size());
            System.debug('URL: /resources?tabName=Reference&name=' + library.Content_Unique_Id__c);
        } catch (Exception e) {
            System.debug('ERROR: ' + e.getMessage());
            System.debug(e.getStackTraceString());
            throw e;
        }
    }

    private static Content__c createLibrary() {
        Content__c library = new Content__c(
            Name = LIBRARY_NAME,
            Content_Unique_Id__c = LIBRARY_ID_PREFIX,
            Content_Article_URL__c = '/resources?tabName=Reference&name=' + LIBRARY_ID_PREFIX,
            Content_Type__c = 'Library',
            Status__c = 'Published',
            Published_Date__c = Date.today(),
            Brand__c = null,
            Region__c = 'Canada',
            Role__c = null
        );
        insert library;
        System.debug('Created Library: ' + library.Id);
        return library;
    }

    private static Map<String, Content__c> createCategories(Id libraryId) {
        List<Content__c> categories = new List<Content__c>();
`;

  categoryEntries.forEach(entry => {
    apex += `        categories.add(new Content__c(
            Name = '${escapeApexString(entry.title)}',
            Content_Unique_Id__c = LIBRARY_ID_PREFIX + '-${entry.slug}',
            Content_Article_URL__c = '/resources?tabName=Reference&name=' + LIBRARY_ID_PREFIX + '-${entry.slug}',
            Content_Type__c = 'Reference Guides',
            Status__c = 'Published',
            Published_Date__c = Date.today(),
            Library__c = libraryId,
            Parent_Content__c = libraryId,
            Brand__c = null,
            Region__c = 'Canada',
            Role__c = null
        ));
`;
  });

  apex += `
        insert categories;
        System.debug('Created ' + categories.size() + ' categories');

        Map<String, Content__c> categoryMap = new Map<String, Content__c>();
        for (Content__c cat : categories) {
            categoryMap.put(cat.Content_Unique_Id__c, cat);
        }
        return categoryMap;
    }

    private static Map<String, Content__c> createArticles(Id libraryId, Map<String, Content__c> categoryMap) {
        List<Content__c> articles = new List<Content__c>();
`;

  articleEntries.forEach(entry => {
    apex += `        articles.add(new Content__c(
            Name = '${escapeApexString(entry.title)}',
            Content_Unique_Id__c = LIBRARY_ID_PREFIX + '-${entry.parentSlug}-${entry.slug}',
            Content_Article_URL__c = '/resources?tabName=Reference&name=' + LIBRARY_ID_PREFIX + '-${entry.parentSlug}-${entry.slug}',
            Content_Type__c = 'Reference Guides',
            Status__c = 'Published',
            Published_Date__c = Date.today(),
            Library__c = libraryId,
            Parent_Content__c = categoryMap.get(LIBRARY_ID_PREFIX + '-${entry.parentSlug}').Id,
            Brand__c = null,
            Region__c = 'Canada',
            Role__c = null
        ));
`;
  });

  apex += `
        insert articles;
        System.debug('Created ' + articles.size() + ' articles');

        Map<String, Content__c> articleMap = new Map<String, Content__c>();
        for (Content__c art : articles) {
            articleMap.put(art.Content_Unique_Id__c, art);
        }
        return articleMap;
    }

    private static void createTranslations(Content__c library, Map<String, Content__c> categoryMap, Map<String, Content__c> articleMap) {
        List<Translations__c> translations = new List<Translations__c>();

        translations.add(new Translations__c(
            Content__c = library.Id,
            Name = 'English',
            Version__c = 1,
            Title__c = LIBRARY_NAME,
            Summary__c = '${escapeApexString(truncate(libraryPage.summary || libraryPage.body, 250))}',
            Body__c = '${escapeApexString(truncate(libraryPage.bodyHtml, 30000, '<!-- truncated -->'))}',
            Status__c = 'Published'
        ));
`;

  categoryEntries.forEach(entry => {
    const page = findPage(entry.url);
    apex += `
        translations.add(new Translations__c(
            Content__c = categoryMap.get(LIBRARY_ID_PREFIX + '-${entry.slug}').Id,
            Name = 'English',
            Version__c = 1,
            Title__c = '${escapeApexString(entry.title)}',
            Summary__c = '${escapeApexString(truncate(page.summary || page.body, 250))}',
            Body__c = '${escapeApexString(truncate(page.bodyHtml, 30000, '<!-- truncated -->'))}',
            Status__c = 'Published'
        ));
`;
  });

  articleEntries.forEach(entry => {
    const page = findPage(entry.url);
    apex += `
        translations.add(new Translations__c(
            Content__c = articleMap.get(LIBRARY_ID_PREFIX + '-${entry.parentSlug}-${entry.slug}').Id,
            Name = 'English',
            Version__c = 1,
            Title__c = '${escapeApexString(entry.title)}',
            Summary__c = '${escapeApexString(truncate(page.summary || page.body, 250))}',
            Body__c = '${escapeApexString(truncate(page.bodyHtml, 30000, '<!-- truncated -->'))}',
            Status__c = 'Published'
        ));
`;
  });

  apex += `
        insert translations;
        System.debug('Created ' + translations.size() + ' translations');
    }

    // Ensures a CMS_Topic__c with this Name/Parent_Topic__c exists, creating
    // it if this org doesn't have it yet (matches sandbox's curated topics).
    private static Id ensureTopic(Map<String, Id> topicCache, String name, String parentTopic) {
        String cacheKey = name + '|' + parentTopic;
        if (topicCache.containsKey(cacheKey)) return topicCache.get(cacheKey);

        List<CMS_Topic__c> existing = [
            SELECT Id FROM CMS_Topic__c WHERE Name = :name AND Parent_Topic__c = :parentTopic LIMIT 1
        ];
        Id topicId;
        if (!existing.isEmpty()) {
            topicId = existing[0].Id;
        } else {
            CMS_Topic__c t = new CMS_Topic__c(Name = name, Parent_Topic__c = parentTopic);
            insert t;
            topicId = t.Id;
            System.debug('Created missing topic: ' + name + ' (parent: ' + parentTopic + ')');
        }
        topicCache.put(cacheKey, topicId);
        return topicId;
    }

    private static void createTopicAssociations(Content__c library, Map<String, Content__c> categoryMap, Map<String, Content__c> articleMap) {
        Map<Id, Content__c> allByContentId = new Map<Id, Content__c>();
        allByContentId.put(library.Id, library);
        for (Content__c c : categoryMap.values()) allByContentId.put(c.Id, c);
        for (Content__c c : articleMap.values()) allByContentId.put(c.Id, c);

        Map<String, Content__c> byUid = new Map<String, Content__c>();
        for (Content__c c : allByContentId.values()) byUid.put(c.Content_Unique_Id__c, c);

        Map<String, Id> topicCache = new Map<String, Id>();
        List<Content_Topic__c> junctions = new List<Content_Topic__c>();
`;

  if (topicMap) {
    for (const [uid, topics] of Object.entries(topicMap)) {
      for (const t of topics) {
        apex += `        if (byUid.containsKey('${uid}')) {
            junctions.add(new Content_Topic__c(Content__c = byUid.get('${uid}').Id, Topic__c = ensureTopic(topicCache, '${escapeApexString(t.name)}', '${escapeApexString(t.parent.trim())}')));
        }
`;
      }
    }
  } else {
    apex += `        // No topic map found - falling back to a single generic "Marketing" topic
        Id fallbackTopicId = ensureTopic(topicCache, 'Marketing', 'Guest Experience');
        for (Content__c c : allByContentId.values()) {
            junctions.add(new Content_Topic__c(Content__c = c.Id, Topic__c = fallbackTopicId));
        }
`;
  }

  apex += `
        if (!junctions.isEmpty()) {
            insert junctions;
        }
        System.debug('Created ' + junctions.size() + ' topic associations');
    }

    public static void cleanup() {
        List<Content__c> toDelete = [
            SELECT Id FROM Content__c
            WHERE Content_Unique_Id__c LIKE '${LIBRARY_ID_PREFIX}%'
        ];
        if (!toDelete.isEmpty()) {
            delete toDelete;
            System.debug('Cleaned up ' + toDelete.size() + ' old records');
        }
    }
}
`;

  fs.writeFileSync(path.join(OUTPUT_DIR, 'ChoiceCentralLocalMarketingImporter.cls'), apex);

  // Also emit a manifest the Node.js uploader will use to map downloaded
  // files (by URL) to the Content_Unique_Id__c of their owning page.
  const manifest = {
    libraryIdPrefix: LIBRARY_ID_PREFIX,
    pages: PAGE_MAP.map(entry => {
      const page = findPage(entry.url);
      const contentUniqueId = entry.kind === 'library'
        ? LIBRARY_ID_PREFIX
        : entry.kind === 'category'
          ? `${LIBRARY_ID_PREFIX}-${entry.slug}`
          : `${LIBRARY_ID_PREFIX}-${entry.parentSlug}-${entry.slug}`;
      return {
        contentUniqueId,
        title: entry.title || LIBRARY_NAME,
        documents: (page.documents || []).map(d => ({
          url: d.url,
          title: d.title,
          filename: d.filename,
          localPath: d.localPath
        }))
      };
    })
  };
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'choicecentral-local-marketing-file-manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  console.log('Generated: generated-apex/choicecentral-local-marketing-file-manifest.json');
}

// marker defaults to none: Summary__c is plain text (no HTML rendering to
// hide an HTML comment inside), so an HTML-comment marker there shows up as
// literal visible text. Body__c passes '<!-- truncated -->' explicitly,
// since lightning-formatted-rich-text/rendered HTML there does hide it.
function truncate(str, maxLength, marker = '') {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + marker;
}

function escapeApexString(str) {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}
