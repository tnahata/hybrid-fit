"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkoutDifficulty = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const slugify_1 = __importDefault(require("slugify"));
const saveDataAsJson_1 = require("./scraper-save/saveDataAsJson");
const inputDir = path_1.default.resolve(__dirname, "./scraped-json/");
var WorkoutDifficulty;
(function (WorkoutDifficulty) {
    WorkoutDifficulty["BEGINNER"] = "beginner";
    WorkoutDifficulty["INTERMEDIATE"] = "intermediate";
    WorkoutDifficulty["ADVANCED"] = "advanced";
})(WorkoutDifficulty || (exports.WorkoutDifficulty = WorkoutDifficulty = {}));
/**
 * Helper: generate a consistent ID
 */
function generateWorkoutId(template) {
    if (template._id)
        return template._id;
    return (0, slugify_1.default)(template.name || "unnamed", {
        lower: true,
        strict: true,
        replacement: "_",
    });
}
/**
 * Helper: parse duration string into minutes
 */
function parseDuration(value) {
    if (!value)
        return null;
    const str = String(value);
    const match = str.match(/(\d+)(?:-\d+)?\s*(?:min|mins|minutes?|hour|hr|hrs)?/i);
    if (!match)
        return null;
    const num = parseInt(match[1], 10);
    const unit = str.toLowerCase();
    return unit.includes("hour") || unit.includes("hr") ? num * 60 : num;
}
/**
 * Normalize difficulty from tags if not present
 */
function normalizeDifficultyFromTags(template) {
    if (template.difficulty)
        return template.difficulty.toLowerCase();
    const tags = (template.tags || []).map((t) => t.toLowerCase());
    if (tags.includes("easy"))
        return "beginner";
    if (tags.includes("medium"))
        return "intermediate";
    if (tags.includes("hard") || tags.includes("long_run"))
        return "advanced";
    return "intermediate";
}
/**
 * Normalize metrics fields
 */
function normalizeMetrics(metrics) {
    return {
        distanceMiles: metrics?.distanceMiles ?? null,
        durationMins: metrics?.durationMins ?? null,
    };
}
/**
 * Normalize a single workout template
 */
function normalizeWorkoutTemplate(template) {
    const normalized = {
        _id: generateWorkoutId(template),
        name: template.name?.trim() || "Unnamed Workout",
        sport: template.sport?.toLowerCase() || "general",
        category: template.category?.toLowerCase() || "general",
        description: template.description?.trim() || "",
        metrics: normalizeMetrics(template.metrics),
        difficulty: normalizeDifficultyFromTags(template),
        tags: Array.isArray(template.tags) ? template.tags.map((t) => t.toLowerCase()) : [],
    };
    return normalized;
}
/**
 * Main function
 */
async function normalizeWorkoutTemplates() {
    console.log("Starting normalization of workout templates...");
    const inputFile = path_1.default.join(inputDir, "halHigdonWorkoutTemplates.json");
    if (!fs_1.default.existsSync(inputFile)) {
        console.error(`❌ Input file not found: ${inputFile}`);
        return [];
    }
    const rawData = fs_1.default.readFileSync(inputFile, "utf-8");
    const templates = JSON.parse(rawData);
    const normalizedTemplates = templates.map(normalizeWorkoutTemplate);
    await (0, saveDataAsJson_1.saveNormalizedWorkoutTemplates)(normalizedTemplates);
    return normalizedTemplates;
}
// Run the script
normalizeWorkoutTemplates();
