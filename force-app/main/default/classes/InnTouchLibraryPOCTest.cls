/**
 * Test class for InnTouchLibraryPOC
 */
@isTest
private class InnTouchLibraryPOCTest {

    @isTest
    static void testImportPOC() {
        Test.startTest();
        Map<String, Object> results = InnTouchLibraryPOC.importPOC();
        Test.stopTest();

        // Verify import success
        System.assertEquals(true, results.get('success'), 'Import should succeed');

        // Verify library created
        List<Content__c> libraries = [SELECT Id, Name, Content_Type__c FROM Content__c WHERE Content_Type__c = 'Library' AND Name LIKE '%POC%'];
        System.assertEquals(1, libraries.size(), 'Should create 1 library');

        // Verify category created
        List<Content__c> categories = [SELECT Id, Name FROM Content__c WHERE Name = 'Lead Generation' AND Content_Unique_Id__c LIKE 'poc-%'];
        System.assertEquals(1, categories.size(), 'Should create 1 category');

        // Verify content pages created
        List<Content__c> pages = [SELECT Id FROM Content__c WHERE Content_Type__c = 'Reference Guides' AND Content_Unique_Id__c LIKE 'poc-doc-%'];
        System.assertEquals(9, pages.size(), 'Should create 9 content pages');

        // Verify translations created
        List<Translations__c> translations = [SELECT Id FROM Translations__c WHERE Content__c IN (SELECT Id FROM Content__c WHERE Content_Unique_Id__c LIKE 'poc-%')];
        System.assertEquals(11, translations.size(), 'Should create 11 translations (1 library + 1 category + 9 pages)');
    }

    @isTest
    static void testValidatePOC() {
        // First import POC data
        InnTouchLibraryPOC.importPOC();

        Test.startTest();
        Map<String, Object> validation = InnTouchLibraryPOC.validatePOC();
        Test.stopTest();

        // Verify validation ran
        System.assertNotEquals(null, validation, 'Validation should return results');

        // Verify summary exists
        Map<String, Object> summary = (Map<String, Object>)validation.get('summary');
        System.assertNotEquals(null, summary, 'Summary should exist');

        Integer totalTests = (Integer)summary.get('totalTests');
        System.assertEquals(7, totalTests, 'Should run 7 tests');
    }

    @isTest
    static void testCleanupPOC() {
        // First import POC data
        InnTouchLibraryPOC.importPOC();

        // Verify data exists
        List<Content__c> beforeCleanup = [SELECT Id FROM Content__c WHERE Content_Unique_Id__c LIKE 'poc-%'];
        System.assert(beforeCleanup.size() > 0, 'Should have POC records before cleanup');

        Test.startTest();
        InnTouchLibraryPOC.cleanupPOC();
        Test.stopTest();

        // Verify cleanup
        List<Content__c> afterCleanup = [SELECT Id FROM Content__c WHERE Content_Unique_Id__c LIKE 'poc-%'];
        System.assertEquals(0, afterCleanup.size(), 'Should delete all POC records');

        List<Translations__c> translationsAfter = [SELECT Id FROM Translations__c WHERE Content__c IN (SELECT Id FROM Content__c WHERE Content_Unique_Id__c LIKE 'poc-%')];
        System.assertEquals(0, translationsAfter.size(), 'Should delete all POC translations');
    }

    @isTest
    static void testHierarchyStructure() {
        // Import POC data
        InnTouchLibraryPOC.importPOC();

        Test.startTest();

        // Verify library has no parent
        Content__c library = [SELECT Id, Library__c, Parent_Content__c FROM Content__c WHERE Content_Unique_Id__c = 'poc-inntouch-library' LIMIT 1];
        System.assertEquals(null, library.Library__c, 'Library should have null Library__c');
        System.assertEquals(null, library.Parent_Content__c, 'Library should have null Parent_Content__c');

        // Verify category points to library
        Content__c category = [SELECT Id, Library__c, Parent_Content__c FROM Content__c WHERE Content_Unique_Id__c = 'poc-inntouch-lead-generation' LIMIT 1];
        System.assertEquals(library.Id, category.Library__c, 'Category Library__c should point to library');
        System.assertEquals(library.Id, category.Parent_Content__c, 'Category Parent_Content__c should point to library');

        // Verify content pages point to category
        List<Content__c> pages = [SELECT Id, Library__c, Parent_Content__c FROM Content__c WHERE Content_Unique_Id__c LIKE 'poc-inntouch-doc-%'];
        for (Content__c page : pages) {
            System.assertEquals(library.Id, page.Library__c, 'Page Library__c should point to library');
            System.assertEquals(category.Id, page.Parent_Content__c, 'Page Parent_Content__c should point to category');
        }

        Test.stopTest();
    }
}
