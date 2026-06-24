/**
 * Add Missing Library Translation
 *
 * Run this immediately after import to add the library translation
 * Library ID: a5mE2000003Ii47IAC
 */

// Get the library record
Content__c library = [
    SELECT Id, Name
    FROM Content__c
    WHERE Id = 'a5mE2000003Ii47IAC'
    LIMIT 1
];

System.debug('Library found: ' + library.Name);

// Check if translation already exists
List<Translations__c> existing = [
    SELECT Id, Name
    FROM Translations__c
    WHERE Content__c = :library.Id
];

if (existing.isEmpty()) {
    System.debug('Creating library translation...');

    // Create library translation (English)
    Translations__c libraryTranslation = new Translations__c(
        Content__c = library.Id,
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

    insert libraryTranslation;

    System.debug('✓ Library translation created: ' + libraryTranslation.Id);
    System.debug('✓ Language: ' + libraryTranslation.Name);
    System.debug('✓ Title: ' + libraryTranslation.Title__c);

} else {
    System.debug('⚠️  Library translation already exists: ' + existing[0].Id);
    System.debug('   Language: ' + existing[0].Name);
}

// Verify translation count
List<Translations__c> allTranslations = [
    SELECT Id, Content__r.Name, Name, Title__c
    FROM Translations__c
    WHERE Content__c IN (
        SELECT Id FROM Content__c WHERE Content_Unique_Id__c LIKE 'poc-inntouch-%'
    )
    ORDER BY Content__r.Name
];

System.debug('');
System.debug('=== ALL POC TRANSLATIONS ===');
System.debug('Total: ' + allTranslations.size());
for (Translations__c t : allTranslations) {
    System.debug('  - ' + t.Content__r.Name + ' (' + t.Name + ')');
}

System.debug('');
System.debug('✅ Expected: 11 translations (1 library + 1 category + 9 pages)');
System.debug('✅ Actual: ' + allTranslations.size());

if (allTranslations.size() == 11) {
    System.debug('✅ All translations created successfully!');
} else {
    System.debug('⚠️  Missing translations. Expected 11, found ' + allTranslations.size());
}
