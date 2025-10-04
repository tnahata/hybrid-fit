"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const runCoachDrillsScraper_1 = require("../runCoachDrillsScraper");
(async () => {
    console.log('Starting Runcoach drills scraper...');
    const allDrills = await (0, runCoachDrillsScraper_1.scrapeAllRunningDrills)();
    console.log(`\nSuccessfully retrieved ${allDrills.length} drills!`);
    // Print JSON with 2-space indent
    const jsonOutput = JSON.stringify(allDrills, null, 2);
    console.log('\n' + jsonOutput);
})();
