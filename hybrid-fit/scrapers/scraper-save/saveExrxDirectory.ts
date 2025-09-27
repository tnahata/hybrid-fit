import { MuscleGroup } from "../../scrapers/exrxDirectoryScraper";
import { MuscleExercises } from "../exrxExercisesScraper";
import fs from "fs";
import path from "path";

export async function saveDirectoryAsJSON(groups: MuscleGroup[]) {
    try {

        const dir = path.resolve(__dirname, "../scraped-json");
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const outputFile = path.join(dir, "exrxDirectory.json");
        fs.writeFileSync(outputFile, JSON.stringify(groups, null, 2), "utf-8");

        console.log(`✅ Directory saved to ${outputFile}`);
    } catch (err) {
        console.error("❌ Error scraping directory:", err);
    }
}

export async function saveExercisesAsJSON(exercises: MuscleExercises[]) {
    try {

        const dir = path.resolve(__dirname, "../scraped-json");
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const outputFile = path.join(dir, "exrxExercises.json");
        fs.writeFileSync(outputFile, JSON.stringify(exercises, null, 2), "utf-8");

        console.log(`✅ Directory saved to ${outputFile}`);
    } catch (err) {
        console.error("❌ Error scraping directory:", err);
    }
}