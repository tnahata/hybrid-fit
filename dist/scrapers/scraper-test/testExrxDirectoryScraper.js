"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// testExrxScraper.ts
const exrxDirectoryScraper_1 = require("../exrxDirectoryScraper");
/** pretty-printer */
function printGroups(groups) {
    const indent = (n) => " ".repeat(n * 2);
    for (const g of groups) {
        console.log(`- ${g.name} (${g.url || "no link"})`);
        for (const m of g.muscles) {
            printMuscle(m, 1);
        }
    }
    function printMuscle(m, level) {
        console.log(`${indent(level)}- ${m.name} (${m.url || "no link"})`);
        if (m.submuscles) {
            for (const s of m.submuscles)
                printMuscle(s, level + 1);
        }
    }
}
(async () => {
    let groups;
    groups = await (0, exrxDirectoryScraper_1.scrapeExrxDirectory)("https://exrx.net/Lists/Directory");
    printGroups(groups);
})();
