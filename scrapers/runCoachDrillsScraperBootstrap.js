// Polyfill for Node.js < 20 to fix undici File issue
if (typeof globalThis.File === 'undefined') {
    globalThis.File = class File extends Blob {
        constructor(bits, name, options) {
            super(bits, options);
        }
    };
}

// Now require and run the actual scraper
const scraper = require('../dist/scrapers/runCoachDrillsScraper.js');

// Call the exported functions
(async () => {
    try {
        console.log("Scraping running drills from Runcoach...\n");

        // Step 1: Get all drill links
        const drillLinks = await scraper.scrapeRuncoachDrillLinks();
        console.log(`Found ${drillLinks.length} drills:\n`);

        // Step 2: Scrape each drill's details
        const allDrills = [];

        for (const link of drillLinks) {
            console.log(`Scraping: ${link.name}...`);
            const drill = await scraper.scrapeRuncoachDrill(link.url, link.summary);
            allDrills.push(drill);
        }

        // Step 3: Display results
        console.log("\n=== SCRAPED DRILLS ===\n");
        console.log(JSON.stringify(allDrills, null, 2));

        return allDrills;
    } catch (error) {
        console.error("Error:", error);
    }
})();
