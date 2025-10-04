import { scrapeAllRunningDrills } from "../runCoachDrillsScraper";

(async () => {
    console.log('Starting Runcoach drills scraper...');

    const allDrills = await scrapeAllRunningDrills();

    console.log(`\nSuccessfully retrieved ${allDrills.length} drills!`);

    // Print JSON with 2-space indent
    const jsonOutput = JSON.stringify(allDrills, null, 2);
    console.log('\n' + jsonOutput);
})();
