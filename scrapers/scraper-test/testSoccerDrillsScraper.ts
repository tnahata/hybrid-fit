import { scrapeSoccerDrills } from "../soccerDrillsScraper";
import * as fs from 'fs';

(async () => {
    console.log('Starting SoccerXpert drills scraper...');

    const drills = await scrapeSoccerDrills();

    console.log(`\nSuccessfully scraped ${drills.length} drills!`);

    // Print JSON with 2-space indent
    const jsonOutput = JSON.stringify(drills, null, 2);
    console.log('\n' + jsonOutput);
})();