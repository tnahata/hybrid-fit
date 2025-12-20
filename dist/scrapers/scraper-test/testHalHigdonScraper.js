"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const halHigdonScraper_1 = require("../halHigdonScraper");
(async () => {
    console.log('Starting Hal Higdon training plans scraper...\n');
    const { plans, templates } = await (0, halHigdonScraper_1.scrapeAllHalHigdonPlans)();
    console.log(`\n✅ Successfully retrieved ${plans.length} training plans!`);
    console.log(`✅ Successfully generated ${templates.length} unique workout templates!\n`);
    // Print sample data
    if (plans.length > 0) {
        console.log('Sample Training Plan:');
        console.log(JSON.stringify(plans[0], null, 2));
    }
    if (templates.length > 0) {
        console.log('\nSample Workout Templates (first 5):');
        console.log(JSON.stringify(templates.slice(0, 5), null, 2));
    }
})();
