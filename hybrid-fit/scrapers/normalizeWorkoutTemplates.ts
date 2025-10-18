import fs from "fs";
import path from "path";
import slugify from "slugify";
import { saveNormalizedWorkoutTemplates } from "./scraper-save/saveDataAsJson";

const inputDir = path.resolve(__dirname, "./scraped-json/");

export enum WorkoutDifficulty {
    BEGINNER = "beginner",
    INTERMEDIATE = "intermediate",
    ADVANCED = "advanced",
}

/**
 * Represents a single exercise structure inside a workout template
 */
export interface WorkoutExerciseStructure {
    exerciseId: string; // Reference to Exercise._id
    sets?: number;
    reps?: number;
    durationMins?: number;
    durationSecs?: number;
    restSeconds?: number;
    notes?: string;
}

/**
 * Interface for normalized workout template
 */
export interface NormalizedWorkoutTemplate {
    _id: string;
    name: string;
    sport: string;
    category: string;
    description: string;
    metrics: {
        distanceMiles?: number | null;
        durationMins?: number | null;
        [key: string]: any;
    };
    difficulty: string;
    structure?: WorkoutExerciseStructure[]; // Detailed structure of the workout
    tags: string[];
}

/**
 * Helper: generate a consistent ID
 */
function generateWorkoutId(template: any): string {
    if (template._id) return template._id;

    return slugify(template.name || "unnamed", {
        lower: true,
        strict: true,
        replacement: "_",
    });
}

/**
 * Helper: parse duration string into minutes
 */
function parseDuration(value: any): number | null {
    if (!value) return null;
    const str = String(value);
    const match = str.match(/(\d+)(?:-\d+)?\s*(?:min|mins|minutes?|hour|hr|hrs)?/i);
    if (!match) return null;
    const num = parseInt(match[1], 10);
    const unit = str.toLowerCase();
    return unit.includes("hour") || unit.includes("hr") ? num * 60 : num;
}

/**
 * Normalize difficulty from tags if not present
 */
function normalizeDifficultyFromTags(template: any): string {
    if (template.difficulty) return template.difficulty.toLowerCase();

    const tags = (template.tags || []).map((t: string) => t.toLowerCase());
    if (tags.includes("easy")) return "beginner";
    if (tags.includes("medium")) return "intermediate";
    if (tags.includes("hard") || tags.includes("long_run")) return "advanced";
    return "intermediate";
}

/**
 * Normalize metrics fields
 */
function normalizeMetrics(metrics: any): { distanceMiles?: number | null; durationMins?: number | null } {
    return {
        distanceMiles: metrics?.distanceMiles ?? null,
        durationMins: metrics?.durationMins ?? null,
    };
}

/**
 * Normalize a single workout template
 */
function normalizeWorkoutTemplate(template: any): NormalizedWorkoutTemplate {
    const normalized: NormalizedWorkoutTemplate = {
        _id: generateWorkoutId(template),
        name: template.name?.trim() || "Unnamed Workout",
        sport: template.sport?.toLowerCase() || "general",
        category: template.category?.toLowerCase() || "general",
        description: template.description?.trim() || "",
        metrics: normalizeMetrics(template.metrics),
        difficulty: normalizeDifficultyFromTags(template),
        tags: Array.isArray(template.tags) ? template.tags.map((t: string) => t.toLowerCase()) : [],
        structure: Array.isArray(template.structure) ? template.structure : [],
    };
    return normalized;
}

/**
 * Main function
 */
async function normalizeWorkoutTemplates(): Promise<NormalizedWorkoutTemplate[]> {
    console.log("Starting normalization of workout templates...");

    const inputFile = path.join(inputDir, "halHigdonWorkoutTemplates.json");
    if (!fs.existsSync(inputFile)) {
        console.error(`❌ Input file not found: ${inputFile}`);
        return [];
    }

    const rawData = fs.readFileSync(inputFile, "utf-8");
    const templates = JSON.parse(rawData);

    const normalizedTemplates: NormalizedWorkoutTemplate[] = templates.map(normalizeWorkoutTemplate);

    await saveNormalizedWorkoutTemplates(normalizedTemplates)

    return normalizedTemplates;
}

// Run the script
normalizeWorkoutTemplates();
