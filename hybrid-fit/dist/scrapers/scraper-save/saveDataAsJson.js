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
