"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const exrxDirectoryScraper_1 = require("../exrxDirectoryScraper");
const exrxExercisesScraper_1 = require("../exrxExercisesScraper");
(async () => {
    const groups = await (0, exrxDirectoryScraper_1.scrapeExrxDirectory)();
    const exercises = await (0, exrxExercisesScraper_1.scrapeExrxExercises)(groups);
    console.log(JSON.stringify(exercises, null, 2));
})();
