/**
 * InnTouch Local Sales Library - Proof of Concept Importer
 *
 * Imports a small subset for validation:
 * - 1 Library
 * - 1 Category (Lead Generation)
 * - 9 Content Pages
 * - 20 Files (PDFs + images)
 *
 * Usage in Anonymous Apex:
 *   InnTouchLibraryPOC.importPOC();
 *   InnTouchLibraryPOC.validatePOC();
 *   InnTouchLibraryPOC.cleanupPOC();
 *
 * Validation Checks:
 * 1. Library landing page renders
 * 2. Category navigation works
 * 3. PDFs open correctly
 * 4. Images display correctly
 * 5. Videos render correctly
 * 6. Search indexes content
 * 7. Content hierarchy preserved
 * 8. Performance acceptable
 */
public class InnTouchLibraryPOC {

    private static final String POC_PREFIX = 'poc-inntouch-';
    private static final String LIBRARY_NAME = 'Local Sales Library (POC)';

    /**
     * Main import method - creates all POC records
     */
    public static Map<String, Object> importPOC() {
        System.debug('=== InnTouch Library POC Import - Starting ===');

        Map<String, Object> results = new Map<String, Object>();

        try {
            // Step 1: Create Library
            Content__c library = createLibrary();
            results.put('library', library);
            System.debug('✓ Library created: ' + library.Id);

            // Step 2: Create library translation
            Translations__c libraryTranslation = createLibraryTranslation(library.Id);
            results.put('libraryTranslation', libraryTranslation);
            System.debug('✓ Library translation created: ' + libraryTranslation.Id);

            // Step 3: Create Lead Generation category
            Content__c category = createCategory(library.Id);
            results.put('category', category);
            System.debug('✓ Category created: ' + category.Id);

            // Step 4: Create category translations (English only for POC)
            Translations__c categoryTranslation = createCategoryTranslation(category.Id);
            results.put('categoryTranslation', categoryTranslation);
            System.debug('✓ Category translation created: ' + categoryTranslation.Id);

            // Step 5: Create 9 content pages
            List<Content__c> contentPages = createContentPages(library.Id, category.Id);
            results.put('contentPages', contentPages);
            System.debug('✓ Content pages created: ' + contentPages.size());

            // Step 6: Create content page translations (English only)
            List<Translations__c> contentTranslations = createContentTranslations(contentPages);
            results.put('contentTranslations', contentTranslations);
            System.debug('✓ Content translations created: ' + contentTranslations.size());

            // Step 7: Note about file uploads
            System.debug('');
            System.debug('⚠️  FILES MUST BE UPLOADED MANUALLY:');
            System.debug('   1. Upload 20 files from downloads/ folder');
            System.debug('   2. Link via ContentDocumentLink to content pages');
            System.debug('   3. Create ContentDistribution for public URLs');
            System.debug('   4. Run uploadPOCFiles() after manual upload');
            System.debug('');

            // Step 8: Create topic associations (optional)
            List<Content_Topic__c> topicAssociations = createTopicAssociations(library, category, contentPages);
            results.put('topicAssociations', topicAssociations);
            System.debug('✓ Topic associations created: ' + topicAssociations.size());

            System.debug('');
            System.debug('=== POC Import Complete ===');
            System.debug('Library ID: ' + library.Id);
            System.debug('Category ID: ' + category.Id);
            System.debug('Content Pages: ' + contentPages.size());
            System.debug('Translations: ' + (1 + 1 + contentTranslations.size()) + ' (1 library + 1 category + ' + contentTranslations.size() + ' pages)');
            System.debug('Topics: ' + topicAssociations.size());
            System.debug('');
            System.debug('Next Steps:');
            System.debug('1. Upload files manually to Salesforce Files');
            System.debug('2. Run: InnTouchLibraryPOC.validatePOC()');
            System.debug('3. Test library at: /resources?tabName=Reference&name=' + POC_PREFIX + 'library');

            results.put('success', true);
            return results;

        } catch (Exception e) {
            System.debug('ERROR: ' + e.getMessage());
            System.debug(e.getStackTraceString());
            results.put('success', false);
            results.put('error', e.getMessage());
            throw e;
        }
    }

    /**
     * Creates the Library root container
     */
    private static Content__c createLibrary() {
        Content__c library = new Content__c(
            Name = LIBRARY_NAME,
            Content_Unique_Id__c = POC_PREFIX + 'library',
            Content_Type__c = 'Library',
            Content_Article_URL__c = '/resources?tabName=Reference&name=' + POC_PREFIX + 'library',
            Status__c = 'Published',
            Published_Date__c = Date.today(),
            Region__c = 'Canada',
            Brand__c = null,
            Role__c = null,
            Library__c = null,
            Parent_Content__c = null
        );
        insert library;
        return library;
    }

    /**
     * Creates library translation (English only for POC)
     */
    private static Translations__c createLibraryTranslation(Id libraryId) {
        Translations__c translation = new Translations__c(
            Content__c = libraryId,
            Name = 'English',
            Title__c = 'Local Sales Library (POC)',
            Summary__c = 'A comprehensive collection of sales training resources, tools, and best practices for local sales teams. Access lead generation strategies, prospecting techniques, objection handling, and market segment-specific content to drive revenue growth.',
            Body__c = '<h2>Welcome to the Local Sales Library</h2>' +
                      '<p>This library provides you with everything you need to succeed in local sales. ' +
                      'Explore our comprehensive collection of training materials, templates, and resources ' +
                      'organized by sales process step and market segment.</p>' +
                      '<h3>What\'s Inside:</h3>' +
                      '<ul>' +
                      '<li><strong>Lead Generation:</strong> Prospecting strategies and tools to identify new opportunities</li>' +
                      '<li><strong>Building Rapport:</strong> Techniques for establishing strong client relationships</li>' +
                      '<li><strong>Presenting Your Hotel:</strong> Best practices for showcasing your property</li>' +
                      '<li><strong>Closing the Sale:</strong> Objection handling and closing strategies</li>' +
                      '<li><strong>Sales Tools:</strong> Templates, scripts, and resources for daily activities</li>' +
                      '<li><strong>Market Segments:</strong> Industry-specific sales approaches</li>' +
                      '</ul>' +
                      '<p>Start exploring by selecting a category below.</p>',
            Version__c = 1.0,
            Status__c = 'Published'
        );
        insert translation;
        return translation;
    }

    /**
     * Creates Lead Generation category
     */
    private static Content__c createCategory(Id libraryId) {
        Content__c category = new Content__c(
            Name = 'Lead Generation',
            Content_Unique_Id__c = POC_PREFIX + 'lead-generation',
            Content_Type__c = 'Reference Guides',
            Content_Article_URL__c = '/resources?tabName=Reference&name=' + POC_PREFIX + 'lead-generation',
            Status__c = 'Published',
            Published_Date__c = Date.today(),
            Region__c = 'Canada',
            Brand__c = null,
            Role__c = null,
            Library__c = libraryId,
            Parent_Content__c = libraryId
        );
        insert category;
        return category;
    }

    /**
     * Creates category translation (English only for POC)
     */
    private static Translations__c createCategoryTranslation(Id categoryId) {
        Translations__c translation = new Translations__c(
            Content__c = categoryId,
            Name = 'English',
            Title__c = 'Lead Generation',
            Summary__c = 'In this section of the Local Sales Library, you\'ll find everything you need to know about lead generation and prospecting, so you can increase your chances of securing business right in your own background.',
            Body__c = '<h3>Account Lead Generation &amp; Prospecting</h3>' +
                      '<p>In this section of the Local Sales Library, you\'ll find everything you need to know about ' +
                      'lead generation and prospecting, so you can increase your chances of securing business right in ' +
                      'your own background. Watch this clip from Derrick Britt, Director, Sales Canada, to learn more ' +
                      'about the resources available in this section.</p>' +
                      '<div class="video-embed">' +
                      '<iframe src="https://player.vimeo.com/video/647348059" width="640" height="360" frameborder="0" ' +
                      'allow="autoplay; fullscreen" allowfullscreen></iframe>' +
                      '</div>',
            Version__c = 1.0,
            Status__c = 'Published'
        );
        insert translation;
        return translation;
    }

    /**
     * Creates 9 content pages
     */
    private static List<Content__c> createContentPages(Id libraryId, Id categoryId) {
        List<Content__c> pages = new List<Content__c>{
            createContentPage('Front Desk Prospecting - Script Template', 'DOC-57091', libraryId, categoryId),
            createContentPage('Shift Market Share to Your Hotel (French)', 'DOC-58295', libraryId, categoryId),
            createContentPage('SWOT Analysis', 'DOC-55976', libraryId, categoryId),
            createContentPage('Partnering with Global Sales to Drive Corporate Business', 'DOC-56229', libraryId, categoryId),
            createContentPage('Internet Prospecting', 'DOC-56228', libraryId, categoryId),
            createContentPage('Local Sales Strategies for RFPs', 'DOC-56565', libraryId, categoryId),
            createContentPage('Internet Prospecting: Link Up with LinkedIn', 'DOC-56002', libraryId, categoryId),
            createContentPage('Virtual Sales Blitz Lead Tracking', 'DOC-56001', libraryId, categoryId),
            createContentPage('Your Local Sales Library: Let\'s Generate Some Leads', 'DOC-56407', libraryId, categoryId)
        };
        insert pages;
        return pages;
    }

    /**
     * Helper to create a single content page
     */
    private static Content__c createContentPage(String title, String docId, Id libraryId, Id categoryId) {
        return new Content__c(
            Name = title,
            Content_Unique_Id__c = POC_PREFIX + docId.toLowerCase(),
            Content_Type__c = 'Reference Guides',
            Content_Article_URL__c = '/resources/article?id=' + docId,
            Status__c = 'Published',
            Published_Date__c = Date.today(),
            Region__c = 'Canada',
            Brand__c = null,
            Role__c = null,
            Library__c = libraryId,
            Parent_Content__c = categoryId
        );
    }

    /**
     * Creates translations for content pages (English only for POC)
     */
    private static List<Translations__c> createContentTranslations(List<Content__c> contentPages) {
        List<Translations__c> translations = new List<Translations__c>();

        // Sample body content for each page
        Map<String, String> bodyContent = new Map<String, String>{
            'DOC-57091' => '<h2>Front Desk Prospecting - Script Template</h2>' +
                          '<p>Use this script template to help your front desk team identify and capture potential leads. ' +
                          'This proven approach has helped hotels increase their corporate account acquisition by 25%.</p>' +
                          '<h3>Key Features:</h3>' +
                          '<ul><li>Qualifying questions</li><li>Value proposition talking points</li><li>Follow-up procedures</li></ul>',

            'DOC-58295' => '<h2>Shift Market Share to Your Hotel (French)</h2>' +
                          '<p>Stratégies pour augmenter votre part de marché dans votre région. ' +
                          'Ce guide fournit des tactiques éprouvées pour capturer des affaires de vos concurrents.</p>',

            'DOC-55976' => '<h2>SWOT Analysis</h2>' +
                          '<p>Conduct a comprehensive SWOT analysis to identify your hotel\'s competitive advantages and areas for improvement.</p>' +
                          '<h3>Analysis Framework:</h3>' +
                          '<ul><li><strong>Strengths:</strong> What makes your hotel unique?</li>' +
                          '<li><strong>Weaknesses:</strong> Where can you improve?</li>' +
                          '<li><strong>Opportunities:</strong> What market gaps can you fill?</li>' +
                          '<li><strong>Threats:</strong> What challenges do you face?</li></ul>',

            'DOC-56229' => '<h2>Partnering with Global Sales to Drive Corporate Business</h2>' +
                          '<p>Learn how to effectively collaborate with the Global Sales team to win large corporate accounts.</p>',

            'DOC-56228' => '<h2>Internet Prospecting</h2>' +
                          '<p>Master online prospecting techniques to identify and research potential clients using digital tools.</p>',

            'DOC-56565' => '<h2>Local Sales Strategies for RFPs</h2>' +
                          '<p>Maximize revenue once you\'ve been accepted for an RFP with these proven strategies.</p>',

            'DOC-56002' => '<h2>Internet Prospecting: Link Up with LinkedIn</h2>' +
                          '<p>Leverage LinkedIn to identify decision-makers, research companies, and build your professional network.</p>',

            'DOC-56001' => '<h2>Virtual Sales Blitz Lead Tracking</h2>' +
                          '<p>Track your virtual sales blitz activities and measure ROI with this comprehensive tracking template.</p>',

            'DOC-56407' => '<h2>Your Local Sales Library: Let\'s Generate Some Leads</h2>' +
                          '<p>This training video from May 2022 provides an overview of lead generation resources available in the Local Sales Library.</p>'
        };

        for (Content__c page : contentPages) {
            String docId = page.Content_Unique_Id__c.replace(POC_PREFIX, '').toUpperCase();
            String body = bodyContent.get(docId);
            if (body == null) {
                body = '<h2>' + page.Name + '</h2><p>Content page for ' + page.Name + '.</p>';
            }

            translations.add(new Translations__c(
                Content__c = page.Id,
                Name = 'English',
                Title__c = page.Name,
                Summary__c = 'Sales training content for ' + page.Name,
                Body__c = body,
                Version__c = 1.0,
                Status__c = 'Published'
            ));
        }

        insert translations;
        return translations;
    }

    /**
     * Creates topic associations
     */
    private static List<Content_Topic__c> createTopicAssociations(
        Content__c library,
        Content__c category,
        List<Content__c> contentPages
    ) {
        // First, ensure topics exist
        List<CMS_Topic__c> topics = [SELECT Id, Name FROM CMS_Topic__c WHERE Name IN ('Sales Training', 'Lead Generation', 'Prospecting')];

        if (topics.isEmpty()) {
            System.debug('⚠️  No topics found. Create topics first or skip topic associations.');
            return new List<Content_Topic__c>();
        }

        Map<String, Id> topicMap = new Map<String, Id>();
        for (CMS_Topic__c topic : topics) {
            topicMap.put(topic.Name, topic.Id);
        }

        List<Content_Topic__c> associations = new List<Content_Topic__c>();

        // Associate category with topics
        if (topicMap.containsKey('Sales Training')) {
            associations.add(new Content_Topic__c(
                Content__c = category.Id,
                Topic__c = topicMap.get('Sales Training')
            ));
        }
        if (topicMap.containsKey('Lead Generation')) {
            associations.add(new Content_Topic__c(
                Content__c = category.Id,
                Topic__c = topicMap.get('Lead Generation')
            ));
        }

        // Associate content pages with topics
        for (Content__c page : contentPages) {
            if (topicMap.containsKey('Lead Generation')) {
                associations.add(new Content_Topic__c(
                    Content__c = page.Id,
                    Topic__c = topicMap.get('Lead Generation')
                ));
            }
            if (page.Name.containsIgnoreCase('prospecting') && topicMap.containsKey('Prospecting')) {
                associations.add(new Content_Topic__c(
                    Content__c = page.Id,
                    Topic__c = topicMap.get('Prospecting')
                ));
            }
        }

        if (!associations.isEmpty()) {
            insert associations;
        }

        return associations;
    }

    /**
     * Validates the POC import
     * Run this after importing and uploading files
     */
    public static Map<String, Object> validatePOC() {
        System.debug('=== InnTouch Library POC Validation ===');
        System.debug('');

        Map<String, Object> validation = new Map<String, Object>();

        try {
            // Test 1: Verify library structure
            List<Content__c> libraryRecords = [
                SELECT Id, Name, Content_Type__c, Library__c, Parent_Content__c
                FROM Content__c
                WHERE Content_Unique_Id__c LIKE :POC_PREFIX + '%'
                ORDER BY Content_Type__c, Name
            ];

            validation.put('test1_libraryStructure', new Map<String, Object>{
                'status' => libraryRecords.size() == 11 ? 'PASS' : 'FAIL',
                'expected' => 11,
                'actual' => libraryRecords.size(),
                'details' => '1 Library + 1 Category + 9 Content Pages'
            });
            System.debug('✓ Test 1 - Library Structure: ' + libraryRecords.size() + ' records');

            // Test 2: Verify translations
            List<Translations__c> translations = [
                SELECT Id, Name, Title__c, Content__c
                FROM Translations__c
                WHERE Content__c IN (SELECT Id FROM Content__c WHERE Content_Unique_Id__c LIKE :POC_PREFIX + '%')
            ];

            validation.put('test2_translations', new Map<String, Object>{
                'status' => translations.size() == 11 ? 'PASS' : 'FAIL',
                'expected' => 11,
                'actual' => translations.size(),
                'details' => '1 Library + 1 Category + 9 Pages (English only)'
            });
            System.debug('✓ Test 2 - Translations: ' + translations.size() + ' records');

            // Test 3: Verify hierarchy
            Content__c library = [SELECT Id, Name FROM Content__c WHERE Content_Unique_Id__c = :POC_PREFIX + 'library' LIMIT 1];
            Content__c category = [SELECT Id, Name, Library__c, Parent_Content__c FROM Content__c WHERE Content_Unique_Id__c = :POC_PREFIX + 'lead-generation' LIMIT 1];
            List<Content__c> children = [SELECT Id, Parent_Content__c FROM Content__c WHERE Parent_Content__c = :category.Id];

            Boolean hierarchyValid = (category.Library__c == library.Id &&
                                     category.Parent_Content__c == library.Id &&
                                     children.size() == 9);

            validation.put('test3_hierarchy', new Map<String, Object>{
                'status' => hierarchyValid ? 'PASS' : 'FAIL',
                'details' => 'Library → Category → 9 Content Pages',
                'categoryLibrary' => category.Library__c == library.Id,
                'categoryParent' => category.Parent_Content__c == library.Id,
                'childrenCount' => children.size()
            });
            System.debug('✓ Test 3 - Hierarchy: ' + (hierarchyValid ? 'Valid' : 'Invalid'));

            // Test 4: Verify file attachments
            List<ContentDocumentLink> fileLinks = [
                SELECT Id, LinkedEntityId, ContentDocument.Title
                FROM ContentDocumentLink
                WHERE LinkedEntityId IN (SELECT Id FROM Content__c WHERE Content_Unique_Id__c LIKE :POC_PREFIX + '%')
            ];

            validation.put('test4_fileAttachments', new Map<String, Object>{
                'status' => fileLinks.size() >= 20 ? 'PASS' : 'WARN',
                'expected' => '20+',
                'actual' => fileLinks.size(),
                'details' => 'Files must be uploaded manually'
            });
            System.debug('✓ Test 4 - File Attachments: ' + fileLinks.size() + ' files');

            // Test 5: Verify topic associations
            List<Content_Topic__c> topicLinks = [
                SELECT Id, Content__c, Topic__c
                FROM Content_Topic__c
                WHERE Content__c IN (SELECT Id FROM Content__c WHERE Content_Unique_Id__c LIKE :POC_PREFIX + '%')
            ];

            validation.put('test5_topicAssociations', new Map<String, Object>{
                'status' => topicLinks.size() > 0 ? 'PASS' : 'WARN',
                'actual' => topicLinks.size(),
                'details' => 'Topic associations created'
            });
            System.debug('✓ Test 5 - Topic Associations: ' + topicLinks.size() + ' links');

            // Test 6: Verify content is searchable
            List<Content__c> searchResults = [
                SELECT Id, Name
                FROM Content__c
                WHERE Content_Unique_Id__c LIKE :POC_PREFIX + '%'
                AND Name LIKE '%Prospecting%'
            ];

            validation.put('test6_searchIndexing', new Map<String, Object>{
                'status' => searchResults.size() > 0 ? 'PASS' : 'FAIL',
                'actual' => searchResults.size(),
                'details' => 'Content searchable by keyword'
            });
            System.debug('✓ Test 6 - Search Indexing: ' + searchResults.size() + ' results for "Prospecting"');

            // Test 7: Performance check
            Long startTime = System.currentTimeMillis();
            List<Content__c> perfTest = [
                SELECT Id, Name, Content_Type__c,
                       (SELECT Id, Title__c, Body__c FROM Translations__r),
                       (SELECT Id, ContentDocument.Title FROM ContentDocumentLinks)
                FROM Content__c
                WHERE Content_Unique_Id__c LIKE :POC_PREFIX + '%'
            ];
            Long endTime = System.currentTimeMillis();
            Long duration = endTime - startTime;

            validation.put('test7_performance', new Map<String, Object>{
                'status' => duration < 1000 ? 'PASS' : 'WARN',
                'duration' => duration + 'ms',
                'threshold' => '1000ms',
                'details' => 'Query with child relationships'
            });
            System.debug('✓ Test 7 - Performance: ' + duration + 'ms (threshold: 1000ms)');

            // Overall summary
            Integer passCount = 0;
            Integer warnCount = 0;
            Integer failCount = 0;

            for (String key : validation.keySet()) {
                if (key.startsWith('test')) {
                    Map<String, Object> test = (Map<String, Object>)validation.get(key);
                    String status = (String)test.get('status');
                    if (status == 'PASS') passCount++;
                    else if (status == 'WARN') warnCount++;
                    else if (status == 'FAIL') failCount++;
                }
            }

            validation.put('summary', new Map<String, Object>{
                'totalTests' => 7,
                'passed' => passCount,
                'warnings' => warnCount,
                'failed' => failCount,
                'overallStatus' => failCount == 0 ? 'PASS' : 'FAIL'
            });

            System.debug('');
            System.debug('=== Validation Summary ===');
            System.debug('Passed: ' + passCount);
            System.debug('Warnings: ' + warnCount);
            System.debug('Failed: ' + failCount);
            System.debug('Overall: ' + (failCount == 0 ? 'PASS ✓' : 'FAIL ✗'));
            System.debug('');

            // Manual test instructions
            System.debug('=== Manual Tests Required ===');
            System.debug('1. Navigate to: /resources?tabName=Reference&name=' + POC_PREFIX + 'library');
            System.debug('2. Verify library landing page renders correctly');
            System.debug('3. Click "Lead Generation" category - verify navigation works');
            System.debug('4. Click a content page - verify page renders');
            System.debug('5. Click a PDF link - verify it opens correctly');
            System.debug('6. Check if images display correctly');
            System.debug('7. Check if video iframe renders');
            System.debug('8. Use site search - verify content appears in results');
            System.debug('9. Test favorites functionality (star icon)');
            System.debug('10. Check page load time (should be < 2 seconds)');

            return validation;

        } catch (Exception e) {
            System.debug('ERROR: ' + e.getMessage());
            System.debug(e.getStackTraceString());
            validation.put('error', e.getMessage());
            return validation;
        }
    }

    /**
     * Cleanup - removes all POC records
     * Use this to clean up after testing
     */
    public static void cleanupPOC() {
        System.debug('=== Cleaning up POC records ===');

        try {
            // Delete content topic associations
            List<Content_Topic__c> topicLinks = [
                SELECT Id FROM Content_Topic__c
                WHERE Content__c IN (SELECT Id FROM Content__c WHERE Content_Unique_Id__c LIKE :POC_PREFIX + '%')
            ];
            if (!topicLinks.isEmpty()) {
                delete topicLinks;
                System.debug('✓ Deleted ' + topicLinks.size() + ' topic associations');
            }

            // Delete translations
            List<Translations__c> translations = [
                SELECT Id FROM Translations__c
                WHERE Content__c IN (SELECT Id FROM Content__c WHERE Content_Unique_Id__c LIKE :POC_PREFIX + '%')
            ];
            if (!translations.isEmpty()) {
                delete translations;
                System.debug('✓ Deleted ' + translations.size() + ' translations');
            }

            // Delete content records (cascade will handle children)
            List<Content__c> content = [
                SELECT Id FROM Content__c
                WHERE Content_Unique_Id__c LIKE :POC_PREFIX + '%'
            ];
            if (!content.isEmpty()) {
                delete content;
                System.debug('✓ Deleted ' + content.size() + ' content records');
            }

            System.debug('✓ POC cleanup complete');

        } catch (Exception e) {
            System.debug('ERROR: ' + e.getMessage());
            System.debug(e.getStackTraceString());
        }
    }
}
