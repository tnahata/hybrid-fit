import { MuscleGroup } from "../exrxDirectoryScraper";
import { MuscleExercises } from "../exrxExercisesScraper";
import fs from "fs";
import path from "path";
import { SoccerDrill } from "../soccerDrillsScraper";
import { NormalizedExercise } from "../normalizeExercises";
import { NormalizedWorkoutTemplate } from "../normalizeWorkoutTemplates";
import { NormalizedTrainingPlan } from "../normalizeTrainingPlans";

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

export async function saveSoccerDrills(drills: SoccerDrill[]) {
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

export async function saveRunningDrills(drills: any[]) {
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

export async function saveNormalizedExercises(exercises: NormalizedExercise[]) {
    try {
        const dir = path.resolve(__dirname, "../normalized-data")
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const exercisesFile = path.join(dir, "normalizedExercises.json");

        fs.writeFileSync(exercisesFile, JSON.stringify(exercises, null, 2));

        console.log(`✅ ${exercises.length} normalized exercises saved to ${exercisesFile}`);
    } catch (err) {
        console.error("❌ Error saving normalized exercise data:", err);
    }
}

export async function saveNormalizedWorkoutTemplates(workoutTemplates: NormalizedWorkoutTemplate[]) {
    try {
        const dir = path.resolve(__dirname, "../normalized-data")
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const templateFile = path.join(dir, "normalizedTemplates.json");

        // Read existing templates if file exists
        let existingTemplates: NormalizedWorkoutTemplate[] = [];
        if (fs.existsSync(templateFile)) {
            const existingData = fs.readFileSync(templateFile, "utf-8");
            existingTemplates = JSON.parse(existingData);
            console.log(`📖 Found ${existingTemplates.length} existing templates`);
        }

        // Create a map of new templates by ID for efficient lookup
        const newTemplatesMap = new Map(workoutTemplates.map(t => [t._id, t]));

        // Merge: Keep existing templates that aren't in the new scraped data
        const manualTemplates = existingTemplates.filter(t => !newTemplatesMap.has(t._id));

        // Combine: manual templates + new scraped templates
        const mergedTemplates = [...manualTemplates, ...workoutTemplates];

        fs.writeFileSync(templateFile, JSON.stringify(mergedTemplates, null, 2));

        console.log(`✅ ${mergedTemplates.length} total normalized workout templates saved to ${templateFile}`);
        console.log(`   - ${manualTemplates.length} manually added templates preserved`);
        console.log(`   - ${workoutTemplates.length} scraped templates added/updated`);
    } catch (err) {
        console.error("❌ Error saving normalized workout templates:", err);
    }
}

export async function saveNormalizedTrainingPlans(trainingPlans: NormalizedTrainingPlan[]) {
    try {
        const dir = path.resolve(__dirname, "../normalized-data")
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const templateFile = path.join(dir, "normalizedTrainingPlans.json");

        // Read existing plans if file exists
        let existingPlans: NormalizedTrainingPlan[] = [];
        if (fs.existsSync(templateFile)) {
            const existingData = fs.readFileSync(templateFile, "utf-8");
            existingPlans = JSON.parse(existingData);
            console.log(`📖 Found ${existingPlans.length} existing training plans`);
        }

        // Create a map of new plans by ID for efficient lookup
        const newPlansMap = new Map(trainingPlans.map(p => [p._id, p]));

        // Merge: Keep existing plans that aren't in the new scraped data
        const manualPlans = existingPlans.filter(p => !newPlansMap.has(p._id));

        // Combine: manual plans + new scraped plans
        const mergedPlans = [...manualPlans, ...trainingPlans];

        fs.writeFileSync(templateFile, JSON.stringify(mergedPlans, null, 2));

        console.log(`✅ ${mergedPlans.length} total normalized training plans saved to ${templateFile}`);
        console.log(`   - ${manualPlans.length} manually added plans preserved`);
        console.log(`   - ${trainingPlans.length} scraped plans added/updated`);
    } catch (err) {
        console.error("❌ Error saving normalized training plans:", err);
    }
}