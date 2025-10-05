import { MuscleGroup } from "../exrxDirectoryScraper";
import { MuscleExercises } from "../exrxExercisesScraper";
import fs from "fs";
import path from "path";
import { RunningDrill } from "../runCoachDrillsScraper";
import { NewDrill } from "../transformSoccerDrills";

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

export async function saveSoccerDrills(drills: NewDrill[]) {
    try {

        const dir = path.resolve(__dirname, "../scraped-json");
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const outputFile = path.join(dir, "soccerDrills.json");
        fs.writeFileSync(outputFile, JSON.stringify(drills, null, 2), "utf-8");

        console.log(`✅ Directory saved to ${outputFile}`);
    } catch (err) {
        console.error("❌ Error scraping directory:", err);
    }
}

export async function saveRunningDrills(drills: RunningDrill[]) {
    try {

        const dir = path.resolve(__dirname, "../scraped-json");
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const outputFile = path.join(dir, "runningDrills.json");
        fs.writeFileSync(outputFile, JSON.stringify(drills, null, 2), "utf-8");

        console.log(`✅ Running drills saved to ${outputFile}`);
    } catch (err) {
        console.error("❌ Error saving running drills:", err);
    }
}

export async function saveHalHigdonPlans(plans: any[], templates: any[]) {
    try {
        const dir = path.resolve(__dirname, "../scraped-json");
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const plansFile = path.join(dir, "halHigdonTrainingPlans.json");
        const templatesFile = path.join(dir, "halHigdonWorkoutTemplates.json");

        fs.writeFileSync(plansFile, JSON.stringify(plans, null, 2), "utf-8");
        fs.writeFileSync(templatesFile, JSON.stringify(templates, null, 2), "utf-8");

        console.log(`✅ Hal Higdon training plans saved to ${plansFile}`);
        console.log(`✅ Hal Higdon workout templates saved to ${templatesFile}`);
    } catch (err) {
        console.error("❌ Error saving Hal Higdon data:", err);
    }
}