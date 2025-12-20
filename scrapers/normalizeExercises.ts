import fs from "fs";
import path from "path";
import slugify from "slugify";
import crypto from "crypto";
import { saveNormalizedExercises } from "./scraper-save/saveDataAsJson";

const inputDir = path.resolve(__dirname, "./scraped-json/");

/**
 * Exercise type definitions based on data sources
 */
export enum ExerciseType {
    STRENGTH = "strength",
    STRETCH = "stretch",
    DRILL = "drill",
    WARMUP = "warmup",
    COOLDOWN = "cooldown",
    CONDITIONING = "conditioning",
}

export interface WorkoutExerciseStructure {
    exerciseId: string; // Reference to Exercise._id
    sets?: number;
    reps?: number;
    durationMins?: number;
    durationSecs?: number;
    restSeconds?: number;
    notes?: string;
}


export interface NormalizedExercise {
    _id: string;
    name: string;
    type: ExerciseType;
    category: string;
    sport: string;
    focus: string[];
    difficulty: string;
    equipment: string[];
    description: string;
    instructions?: string;
    sourceUrl: string;
    details: Record<string, any>;
    durationMinutes: number | null;
    tags: string[];
}

/**
 * Utility to safely convert value to an array
 */
const toArray = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val.map((v) => String(v).trim()).filter(Boolean);
    const str = String(val).trim();
    if (str.toLowerCase() === "none") return [];
    return str ? [str] : [];
};

/**
 * Parse duration from various formats
 */
function parseDuration(value: any): number | null {
    if (typeof value === "number") return value;
    if (!value) return null;

    const str = String(value);
    // Handle formats like "10 mins." or "5-10 minutes"
    const match = str.match(/(\d+)(?:-\d+)?\s*(?:min|mins|minutes?|hours?|hr|hrs)?/i);
    if (!match) return null;

    const num = parseInt(match[1], 10);
    const unit = str.toLowerCase();

    if (unit.includes("hour") || unit.includes("hr")) {
        return num * 60;
    }
    return num;
}

/**
 * Determine exercise type based on data structure and content
 */
function determineExerciseType(ex: any): ExerciseType {
    const categoryLower = ex.category?.toLowerCase() || "";
    const focusStr = toArray(ex.focus).join(" ").toLowerCase();
    const nameL = ex.name?.toLowerCase() || "";

    // Check for ExRx-style exercises
    if (ex.muscle || ex.details?.muscle) {
        if (ex.equipment?.some((e: string) => e?.toLowerCase().includes("stretch"))) {
            return ExerciseType.STRETCH;
        }
        return ExerciseType.STRENGTH;
    }

    // Check for warmup/cooldown
    if (focusStr.includes("warmup") || nameL.includes("warmup")) {
        return ExerciseType.WARMUP;
    }
    if (focusStr.includes("cooldown") || nameL.includes("cooldown")) {
        return ExerciseType.COOLDOWN;
    }

    // Check for conditioning
    if (categoryLower.includes("conditioning") || focusStr.includes("conditioning")) {
        return ExerciseType.CONDITIONING;
    }

    // Default to drill for sport-specific content
    if (ex.sport && ex.sport !== "general" && ex.sport !== "strength_training") {
        return ExerciseType.DRILL;
    }

    // Check category explicitly
    if (categoryLower === "drill") {
        return ExerciseType.DRILL;
    }
    if (categoryLower === "strength") {
        return ExerciseType.STRENGTH;
    }

    return ExerciseType.DRILL;
}

/**
 * Normalize sport field
 */
function normalizeSport(sport: any, ex: any): string {
    if (!sport || sport === "general") {
        // Try to infer from other fields
        if (ex.muscle || ex.details?.muscle || ex.category === "strength") {
            return "strength_training";
        }
        return "general";
    }
    return String(sport).toLowerCase().replace(/[_-]/g, " ");
}

/**
 * Normalize equipment data
 */
function normalizeEquipment(equipment: any): string[] {
    const equipmentList = toArray(equipment);

    return equipmentList.map(item => {
        const standardized = item
            .replace(/[^\x20-\x7E]/g, '') // Remove non-ASCII
            .replace(/\s+/g, ' ')
            .trim();

        // Standardize common equipment names
        const equipmentMap: Record<string, string> = {
            'none': '',
            'no equipment': '',
            'lever (plate loaded)': 'Lever (Plate Loaded)',
            'lever (selectorized)': 'Lever (Selectorized)',
            'body weight': 'Bodyweight',
            'bodyweight': 'Bodyweight',
            'dumbbells': 'Dumbbell',
            'barbells': 'Barbell',
            'cables': 'Cable',
        };

        const lower = standardized.toLowerCase();
        const mapped = equipmentMap[lower];
        if (mapped === '') return ''; // Filter out in the next step
        return mapped || standardized;
    }).filter(Boolean);
}

/**
 * Normalize difficulty levels
 */
function normalizeDifficulty(difficulty: any): string {
    if (!difficulty) return "intermediate";

    const level = String(difficulty).toLowerCase();

    // Map various difficulty names
    const difficultyMap: Record<string, string> = {
        'easy': 'beginner',
        'simple': 'beginner',
        'basic': 'beginner',
        'medium': 'intermediate',
        'moderate': 'intermediate',
        'hard': 'advanced',
        'difficult': 'advanced',
        'complex': 'advanced',
        'expert': 'advanced',
    };

    // Check for exact matches
    if (difficultyMap[level]) return difficultyMap[level];

    // Check for partial matches
    if (level.includes("begin")) return "beginner";
    if (level.includes("adv")) return "advanced";
    if (level.includes("int")) return "intermediate";

    return "intermediate";
}

function generateHybridId(ex: any, type: ExerciseType, existingIds: Set<string>): string {
    // Prefer pre-existing _id if provided and unique
    if (ex._id && !existingIds.has(ex._id)) {
        existingIds.add(ex._id);
        return ex._id;
    }

    const name = ex.name || "unnamed";
    const sport = ex.sport || "";
    const sourceUrl = ex.sourceUrl || "";

    let baseId: string;

    // 🔹 CASE 1: ExRx exercises — use URL hash for stability
    if (sourceUrl.includes("exrx.net")) {
        // Option 1 (short and deterministic): hash URL
        const hash = crypto.createHash("md5").update(sourceUrl).digest("hex").slice(0, 10);
        baseId = `exrx_${hash}_${type}`;
    }
    // 🔹 CASE 2: Others — use slug logic
    else {
        baseId = slugify(name, { lower: true, strict: true, replacement: "_" });
        if (sport && sport !== "general" && sport !== "strength_training") {
            baseId = `${sport}_${baseId}`;
        }
        if (!baseId.includes(type)) {
            baseId = `${baseId}_${type}`;
        }
    }

    // 🔹 Collision handling
    if (existingIds.has(baseId)) {
        // Append deterministic suffix using ONLY stable fields
        // For ExRx exercises: sourceUrl should always be unique, but use sport as fallback
        // For others: use sourceUrl if available, otherwise we need the original name from input data
        // We use ex.name (original from scraped data) not the 'name' variable (which might be modified)
        const originalName = ex.name || name;
        const suffix = crypto
            .createHash("md5")
            .update(`${originalName}_${sport}_${sourceUrl}`)  // Keep same order as old version for stability
            .digest("hex")
            .slice(0, 6);
        baseId = `${baseId}_${suffix}`;
    }

    existingIds.add(baseId);
    return baseId;
}

/**
 * Normalize focus areas
 */
function normalizeFocus(ex: any): string[] {
    const focusArray = toArray(ex.focus);

    // Add muscle if present
    if (ex.muscle) {
        focusArray.push(ex.muscle);
    }
    if (ex.details?.muscle) {
        focusArray.push(ex.details.muscle);
    }

    // Normalize each focus area
    return focusArray.map(f => f.toLowerCase().replace(/[_-]/g, " "));
}

/**
 * Shorten common muscle names for display in parentheses
 */
function shortenMuscleName(muscle: string): string {
    const muscleShortMap: Record<string, string> = {
        'Gluteus Maximus': 'Glutes',
        'Gluteus Medius': 'Glute Medius',
        'Latissimus Dorsi & Teres Major': 'Lats',
        'Latissimus Dorsi': 'Lats',
        'Deep External Rotators': 'Hip Rotators',
        'Rectus Abdominis': 'Abs',
        'Pectoralis Major': 'Pecs',
        'Tibialis Anterior': 'Tibialis',
    };

    return muscleShortMap[muscle] || muscle;
}

/**
 * Generate a unique, descriptive name for an exercise
 * Priority order:
 * 1. If variationOf exists:
 *    - With equipment (not Bodyweight): "{equipment} {variationOf} ({name})"
 *    - Without equipment or Bodyweight: "{variationOf} ({name})"
 * 2. If equipment exists (not Bodyweight): "{equipment} {name}"
 * 3. If still duplicate after #1-2: "{equipment} {name} ({muscle})"
 * 4. Default: keep original name
 */
function generateUniqueName(ex: any, equipment: string[]): string {
    const baseName = ex.name?.trim() || "Unnamed Exercise";
    const variationOf = ex.details?.variationOf || ex.variationOf;
    const muscle = ex.muscle || ex.details?.muscle;
    const firstEquipment = equipment && equipment.length > 0 ? equipment[0] : null;

    // Case 1: If it's a variation of another exercise
    if (variationOf) {
        // Convert name to title case for parentheses
        const nameInParens = baseName.charAt(0).toUpperCase() + baseName.slice(1);

        // If variation has equipment (not Bodyweight), include it in the name
        if (firstEquipment && firstEquipment !== 'Bodyweight' && firstEquipment !== '') {
            return `${firstEquipment} ${variationOf} (${nameInParens})`;
        }

        // Otherwise, just parent and variation name
        return `${variationOf} (${nameInParens})`;
    }

    // Case 2: If it has equipment (and not bodyweight/empty)
    if (firstEquipment && firstEquipment !== 'Bodyweight' && firstEquipment !== '') {
        return `${firstEquipment} ${baseName}`;
    }

    // Case 3: Bodyweight exercises - just return base name
    // (muscle differentiation will be added in deduplication if needed)
    return baseName;
}

/**
 * Add muscle suffix to name when needed for uniqueness
 */
function addMuscleSuffix(name: string, muscle: string | null): string {
    if (!muscle) return name;

    const shortMuscle = shortenMuscleName(muscle);
    return `${name} (${shortMuscle})`;
}

/**
 * Normalize a single exercise into a unified format
 */
function normalizeExercise(ex: any, ids: Set<string>): NormalizedExercise {
    const type = determineExerciseType(ex);
    const sport = normalizeSport(ex.sport, ex);
    const equipment = normalizeEquipment(ex.equipment || ex.details?.equipmentType);

    // Generate unique name using our algorithm - ONLY for ExRx exercises (strength training from exrx.net)
    // Soccer and running drills keep their original names to maintain ID stability
    const isExrxExercise = (ex.sourceUrl || '').includes('exrx.net');
    const name = isExrxExercise ? generateUniqueName(ex, equipment) : (ex.name?.trim() || "Unnamed Exercise");

    const normalized: NormalizedExercise = {
        _id: generateHybridId(ex, type, ids),
        name,
        type,
        category: ex.category?.toLowerCase() || type,
        sport,
        focus: normalizeFocus(ex),
        difficulty: normalizeDifficulty(ex.difficulty),
        equipment,
        description: ex.description?.trim() || "",
        sourceUrl: ex.sourceUrl || ex.url || "",
        details: {},
        durationMinutes: parseDuration(
            ex.durationMinutes ||
            ex.details?.duration ||
            ex.duration
        ),
        tags: []
    };

    // Add instructions if present
    if (ex.instructions) {
        normalized.instructions = ex.instructions.trim();
    }

    // Handle sport-specific details
    switch (sport) {
        case "soccer":
            normalized.details = {
                age: ex.details?.age || null,
                fieldSize: ex.details?.fieldSize || null,
                players: ex.details?.players || null,
                goalkeeper: ex.details?.goalkeeper === "yes" || ex.details?.goalkeeper === true,
                drillType: ex.details?.type || null,
            };
            break;

        case "running":
            // Running drills might have specific focus areas
            if (ex.focus) {
                normalized.details.trainingFocus = toArray(ex.focus);
            }
            break;

        case "strength_training":
            normalized.details = {
                muscle: ex.muscle || ex.details?.muscle || null,
                musclesWorked: toArray(ex.musclesWorked || ex.muscle || ex.details?.muscle),
                equipmentType: ex.details?.equipmentType || normalized.equipment[0] || null,
                variationOf: ex.details?.variationOf || ex.variationOf || null,
            };

            // Handle variations array from ExRx data
            if (ex.variations && ex.variations.length > 0) {
                normalized.details.variations = ex.variations.map((v: any) => ({
                    name: v.name,
                    url: v.url,
                    equipment: v.equipment,
                }));
            }
            break;

        default:
            // Copy over any unhandled details
            Object.keys(ex.details || {}).forEach(key => {
                if (!normalized.details[key]) {
                    normalized.details[key] = ex.details[key];
                }
            });
    }

    // Build comprehensive tags
    const tagSet = new Set<string>();

    // Add all focus areas
    normalized.focus.forEach(f => tagSet.add(f));

    // Add equipment
    normalized.equipment.forEach(e => tagSet.add(e.toLowerCase()));

    // Add type, category, sport, difficulty
    tagSet.add(normalized.type);
    tagSet.add(normalized.category);
    if (normalized.sport !== "general") {
        tagSet.add(normalized.sport);
    }
    tagSet.add(normalized.difficulty);

    // Add muscle groups if present
    if (normalized.details.musclesWorked) {
        (normalized.details.musclesWorked as string[]).forEach(m =>
            tagSet.add(m.toLowerCase())
        );
    }

    // Add age group if present (soccer)
    if (normalized.details.age) {
        tagSet.add(`age_${normalized.details.age}`);
    }

    // Remove empty/null values and convert to array
    normalized.tags = Array.from(tagSet).filter(Boolean);

    return normalized;
}

function deduplicateExercises(allExercises: NormalizedExercise[]): NormalizedExercise[] {
    const exerciseMap = new Map<string, NormalizedExercise>();

    allExercises.forEach(ex => {
        // For ExRx exercises, use the URL as the unique identifier
        if (ex.sport === "strength training" && ex.sourceUrl !== "") {
            const urlKey = ex.sourceUrl.toLowerCase();
            if (exerciseMap.has(urlKey)) {
                // Merge muscle groups instead of replacing
                const existing = exerciseMap.get(urlKey)!;

                // Combine focus areas (muscles worked)
                const focusSet = new Set([...existing.focus, ...ex.focus]);
                existing.focus = Array.from(focusSet);

                // Combine muscle details
                if (existing.details.musclesWorked && ex.details.musclesWorked) {
                    const musclesSet = new Set([
                        ...existing.details.musclesWorked,
                        ...ex.details.musclesWorked
                    ]);
                    existing.details.musclesWorked = Array.from(musclesSet);
                }

                // Update tags
                const tagSet = new Set([...existing.tags, ...ex.tags]);
                existing.tags = Array.from(tagSet);

            } else {
                exerciseMap.set(urlKey, ex);
            }
        } else {
            // For non-ExRx exercises, use the _id as before
            if (!exerciseMap.has(ex._id)) {
                exerciseMap.set(ex._id, ex);
            }
        }
    });

    return Array.from(exerciseMap.values());
}

/**
 * Add muscle suffixes to names when duplicates still exist after initial naming
 */
function ensureUniqueNames(exercises: NormalizedExercise[]): NormalizedExercise[] {
    // Count occurrences of each name
    const nameCounts = new Map<string, NormalizedExercise[]>();

    exercises.forEach(ex => {
        const existing = nameCounts.get(ex.name) || [];
        existing.push(ex);
        nameCounts.set(ex.name, existing);
    });

    // For each duplicate name group, add muscle suffix
    nameCounts.forEach((group, name) => {
        if (group.length > 1) {
            console.log(`Found ${group.length} exercises with name "${name}", adding muscle suffixes`);

            group.forEach(ex => {
                const muscle = ex.details?.muscle || null;
                if (muscle) {
                    ex.name = addMuscleSuffix(name, muscle);
                }
            });
        }
    });

    return exercises;
}

/**
 * Main entry point
 */
async function mergeAndNormalizeExercises(): Promise<NormalizedExercise[]> {
    console.log("Starting exercise normalization...");

    // Define specific files to process
    const targetFiles = [
        "exrxExercisesTransformed.json",
        "soccerDrills.json",
        "runningDrills.json",
        // Add more specific files here as needed
    ];

    // Filter to only files that exist
    const filesToProcess = targetFiles.filter(file => {
        const filePath = path.join(inputDir, file);
        const exists = fs.existsSync(filePath);
        if (!exists) {
            console.warn(`File not found: ${file}`);
        }
        return exists;
    });

    if (filesToProcess.length === 0) {
        console.error("No target files found in the input directory!");
        console.log(`Looking for files in: ${inputDir}`);
        console.log(`Expected files: ${targetFiles.join(", ")}`);
        return [];
    }

    console.log(`Found ${filesToProcess.length} of ${targetFiles.length} target files to process`);

    const allExercises: NormalizedExercise[] = [];
    const stats: Record<string, number> = {};
    const sportStats: Record<string, number> = {};

    for (const file of filesToProcess) {
        const filePath = path.join(inputDir, file);
        console.log(`Processing: ${file}`);

        try {
            const rawData = fs.readFileSync(filePath, "utf-8");
            const json = JSON.parse(rawData);

            const exercises = Array.isArray(json) ? json : [json];
            let fileCount = 0;

            let ids: Set<string> = new Set();
            exercises.forEach((ex) => {
                const normalized = normalizeExercise(ex, ids);
                allExercises.push(normalized);
                fileCount++;

                // Update stats
                stats[normalized.type] = (stats[normalized.type] || 0) + 1;
                sportStats[normalized.sport] = (sportStats[normalized.sport] || 0) + 1;
            });

            console.log(`   ✓ Processed ${fileCount} exercises from ${file}`);
        } catch (error) {
            console.error(`   ✗ Error processing ${file}:`, error);
        }
    }

    const ids = allExercises.map(e => e._id);
    const urls = allExercises.filter(e => e.sourceUrl !== "" && e.sourceUrl !== null && e.sourceUrl.toLowerCase().includes('exrx')).map(e => e.sourceUrl);
    const uniqueIds = new Set(ids);
    const uniqueUrls = new Set(urls);
    console.log('Unique URLS:', uniqueUrls.size, 'Total:', urls.length);
    console.log('Unique IDs:', uniqueIds.size, 'Total:', ids.length);

    // Remove duplicates by _id
    let duplicateCount = 0;

    const deduped = deduplicateExercises(allExercises);

    console.log(`${deduped.length} exercises are unique out of ${allExercises.length}`);

    // Ensure unique names by adding muscle suffixes where needed
    console.log("\nChecking for duplicate names and adding muscle suffixes...");
    const uniqueNamed = ensureUniqueNames(deduped);

    // Verify uniqueness
    const finalNameCounts = new Map<string, number>();
    uniqueNamed.forEach(ex => {
        finalNameCounts.set(ex.name, (finalNameCounts.get(ex.name) || 0) + 1);
    });
    const remainingDuplicates = Array.from(finalNameCounts.entries()).filter(([_, count]) => count > 1);
    if (remainingDuplicates.length > 0) {
        console.log(`Warning: ${remainingDuplicates.length} exercise names still have duplicates:`);
        remainingDuplicates.slice(0, 10).forEach(([name, count]) => {
            console.log(`   - "${name}": ${count} duplicates`);
        });
    } else {
        console.log(`All exercise names are now unique!`);
    }

    // Sort by sport, then type, then name
    uniqueNamed.sort((a, b) => {
        if (a.sport !== b.sport) return a.sport.localeCompare(b.sport);
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        return a.name.localeCompare(b.name);
    });

    console.log("\n✅ Normalization complete!");
    console.log(`📊 Statistics:`);
    console.log(`   Files processed: ${filesToProcess.length}`);
    console.log(`   Total exercises: ${uniqueNamed.length}`);
    if (duplicateCount > 0) {
        console.log(`   Duplicates removed: ${duplicateCount}`);
    }
    console.log(`\n   By Type:`);
    Object.entries(stats).sort().forEach(([type, count]) => {
        console.log(`   - ${type}: ${count}`);
    });
    console.log(`\n   By Sport:`);
    Object.entries(sportStats).sort().forEach(([sport, count]) => {
        console.log(`   - ${sport}: ${count}`);
    });
    await saveNormalizedExercises(uniqueNamed);

    return uniqueNamed;
}

// Run the script
if (require.main === module) {
    mergeAndNormalizeExercises();
}