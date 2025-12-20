"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeTrainingPlans = normalizeTrainingPlans;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const slugify_1 = __importDefault(require("slugify"));
const saveDataAsJson_1 = require("./scraper-save/saveDataAsJson");
const inputDir = path_1.default.resolve(__dirname, "./scraped-json");
/**
 * Generate _id if not provided
 */
function generateTrainingPlanId(plan) {
    if (plan._id)
        return plan._id;
    return (0, slugify_1.default)(plan.name || "unnamed", {
        lower: true, strict: true, replacement: "_"
    });
}
/**
 * Normalize each training plan
 */
function normalizeTrainingPlan(plan) {
    return {
        _id: generateTrainingPlanId(plan),
        name: plan.name?.trim() || "Unnamed Plan",
        sport: plan.sport?.toLowerCase() || "general",
        category: plan.category?.toLowerCase() || "general",
        durationWeeks: Number(plan.durationWeeks) || 0,
        level: plan.level?.toLowerCase() || "unspecified",
        sourceUrl: plan.sourceUrl?.trim() || undefined,
        details: {
            goal: plan.details?.goal?.trim() || "",
            planType: plan.details?.planType?.trim() || ""
        },
        weeks: Array.isArray(plan.weeks)
            ? plan.weeks.map((week) => ({
                weekNumber: week.weekNumber,
                days: Array.isArray(week.days)
                    ? week.days.map((day) => ({
                        dayOfWeek: day.dayOfWeek?.trim(),
                        workoutTemplateId: day.workoutTemplateId?.trim(),
                    }))
                    : [],
            }))
            : [],
    };
}
/**
 * Main function
 */
async function normalizeTrainingPlans() {
    console.log("Starting normalization of training plans...");
    const inputFile = path_1.default.join(inputDir, "halHigdonTrainingPlans.json");
    if (!fs_1.default.existsSync(inputFile)) {
        console.error(`❌ Input file not found: ${inputFile}`);
        return [];
    }
    const rawData = fs_1.default.readFileSync(inputFile, "utf-8");
    const plans = JSON.parse(rawData);
    const normalizedPlans = plans.map(normalizeTrainingPlan);
    await (0, saveDataAsJson_1.saveNormalizedTrainingPlans)(normalizedPlans);
    return normalizedPlans;
}
// Run if executed directly
if (require.main === module) {
    normalizeTrainingPlans();
}
