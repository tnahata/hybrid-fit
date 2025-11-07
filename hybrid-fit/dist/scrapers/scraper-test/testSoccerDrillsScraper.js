"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const soccerDrillsScraper_1 = require("../soccerDrillsScraper");
(async () => {
    console.log('Starting SoccerXpert drills scraper...');
    const drills = await (0, soccerDrillsScraper_1.scrapeSoccerDrills)();
    console.log(`\nSuccessfully scraped ${drills.length} drills!`);
    // Print JSON with 2-space indent
    const jsonOutput = JSON.stringify(drills, null, 2);
    console.log('\n' + jsonOutput);
})();
