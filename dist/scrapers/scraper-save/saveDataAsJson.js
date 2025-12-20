"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveDirectoryAsJSON = saveDirectoryAsJSON;
exports.saveExercisesAsJSON = saveExercisesAsJSON;
exports.saveSoccerDrills = saveSoccerDrills;
exports.saveRunningDrills = saveRunningDrills;
exports.saveHalHigdonPlans = saveHalHigdonPlans;
exports.saveNormalizedExercises = saveNormalizedExercises;
exports.saveNormalizedWorkoutTemplates = saveNormalizedWorkoutTemplates;
exports.saveNormalizedTrainingPlans = saveNormalizedTrainingPlans;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function saveDirectoryAsJSON(groups) {
    try {
        const dir = path_1.default.resolve(__dirname, "../scraped-json");
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        const outputFile = path_1.default.join(dir, "exrxDirectory.json");
        fs_1.default.writeFileSync(outputFile, JSON.stringify(groups, null, 2), "utf-8");
        console.log(`✅ Directory saved to ${outputFile}`);
    }
    catch (err) {
        console.error("❌ Error scraping directory:", err);
    }
}
async function saveExercisesAsJSON(exercises) {
    try {
        const dir = path_1.default.resolve(__dirname, "../scraped-json");
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        const outputFile = path_1.default.join(dir, "exrxExercises.json");
        fs_1.default.writeFileSync(outputFile, JSON.stringify(exercises, null, 2), "utf-8");
        console.log(`✅ Directory saved to ${outputFile}`);
    }
    catch (err) {
        console.error("❌ Error scraping directory:", err);
    }
}
async function saveSoccerDrills(drills) {
    try {
        const dir = path_1.default.resolve(__dirname, "../scraped-json");
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        const outputFile = path_1.default.join(dir, "soccerDrills.json");
        fs_1.default.writeFileSync(outputFile, JSON.stringify(drills, null, 2), "utf-8");
        console.log(`✅ Directory saved to ${outputFile}`);
    }
    catch (err) {
        console.error("❌ Error scraping directory:", err);
    }
}
async function saveRunningDrills(drills) {
    try {
        const dir = path_1.default.resolve(__dirname, "../scraped-json");
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        const outputFile = path_1.default.join(dir, "runningDrills.json");
        fs_1.default.writeFileSync(outputFile, JSON.stringify(drills, null, 2), "utf-8");
        console.log(`✅ Running drills saved to ${outputFile}`);
    }
    catch (err) {
        console.error("❌ Error saving running drills:", err);
    }
}
async function saveHalHigdonPlans(plans, templates) {
    try {
        const dir = path_1.default.resolve(__dirname, "../scraped-json");
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        const plansFile = path_1.default.join(dir, "halHigdonTrainingPlans.json");
        const templatesFile = path_1.default.join(dir, "halHigdonWorkoutTemplates.json");
        fs_1.default.writeFileSync(plansFile, JSON.stringify(plans, null, 2), "utf-8");
        fs_1.default.writeFileSync(templatesFile, JSON.stringify(templates, null, 2), "utf-8");
        console.log(`✅ Hal Higdon training plans saved to ${plansFile}`);
        console.log(`✅ Hal Higdon workout templates saved to ${templatesFile}`);
    }
    catch (err) {
        console.error("❌ Error saving Hal Higdon data:", err);
    }
}
async function saveNormalizedExercises(exercises) {
    try {
        const dir = path_1.default.resolve(__dirname, "../normalized-data");
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        const exercisesFile = path_1.default.join(dir, "normalizedExercises.json");
        fs_1.default.writeFileSync(exercisesFile, JSON.stringify(exercises, null, 2));
        console.log(`✅ ${exercises.length} normalized exercises saved to ${exercisesFile}`);
    }
    catch (err) {
        console.error("❌ Error saving normalized exercise data:", err);
    }
}
async function saveNormalizedWorkoutTemplates(workoutTemplates) {
    try {
        const dir = path_1.default.resolve(__dirname, "../normalized-data");
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        const templateFile = path_1.default.join(dir, "normalizedTemplates.json");
        // Read existing templates if file exists
        let existingTemplates = [];
        if (fs_1.default.existsSync(templateFile)) {
            const existingData = fs_1.default.readFileSync(templateFile, "utf-8");
            existingTemplates = JSON.parse(existingData);
            console.log(`📖 Found ${existingTemplates.length} existing templates`);
        }
        // Create a map of new templates by ID for efficient lookup
        const newTemplatesMap = new Map(workoutTemplates.map(t => [t._id, t]));
        // Merge: Keep existing templates that aren't in the new scraped data
        const manualTemplates = existingTemplates.filter(t => !newTemplatesMap.has(t._id));
        // Combine: manual templates + new scraped templates
        const mergedTemplates = [...manualTemplates, ...workoutTemplates];
        fs_1.default.writeFileSync(templateFile, JSON.stringify(mergedTemplates, null, 2));
        console.log(`✅ ${mergedTemplates.length} total normalized workout templates saved to ${templateFile}`);
        console.log(`   - ${manualTemplates.length} manually added templates preserved`);
        console.log(`   - ${workoutTemplates.length} scraped templates added/updated`);
    }
    catch (err) {
        console.error("❌ Error saving normalized workout templates:", err);
    }
}
async function saveNormalizedTrainingPlans(trainingPlans) {
    try {
        const dir = path_1.default.resolve(__dirname, "../normalized-data");
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        const templateFile = path_1.default.join(dir, "normalizedTrainingPlans.json");
        // Read existing plans if file exists
        let existingPlans = [];
        if (fs_1.default.existsSync(templateFile)) {
            const existingData = fs_1.default.readFileSync(templateFile, "utf-8");
            existingPlans = JSON.parse(existingData);
            console.log(`📖 Found ${existingPlans.length} existing training plans`);
        }
        // Create a map of new plans by ID for efficient lookup
        const newPlansMap = new Map(trainingPlans.map(p => [p._id, p]));
        // Merge: Keep existing plans that aren't in the new scraped data
        const manualPlans = existingPlans.filter(p => !newPlansMap.has(p._id));
        // Combine: manual plans + new scraped plans
        const mergedPlans = [...manualPlans, ...trainingPlans];
        fs_1.default.writeFileSync(templateFile, JSON.stringify(mergedPlans, null, 2));
        console.log(`✅ ${mergedPlans.length} total normalized training plans saved to ${templateFile}`);
        console.log(`   - ${manualPlans.length} manually added plans preserved`);
        console.log(`   - ${trainingPlans.length} scraped plans added/updated`);
    }
    catch (err) {
        console.error("❌ Error saving normalized training plans:", err);
    }
}
