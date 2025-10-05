import puppeteer from "puppeteer-extra";
import * as cheerio from "cheerio";
import { MuscleGroup, Muscle } from "./exrxDirectoryScraper";
import path from "path";
import fs from "fs";

const directoryPath = path.resolve(__dirname, "./scraped-json/exrxDirectory.json");
const transformedJsonPath = path.resolve(__dirname, "./scraped-json/exrxExercisesTransformed.json");

export interface Exercise {
    name: string;
    url: string;
    equipment?: string;
    category?: string;
    variations?: Exercise[];
}

export interface MuscleExercises {
    muscle: string;
    url: string;
    exercises: Exercise[];
}

interface ExerciseDocument {
    name: string;
    category: string;
    sport: string;
    focus: string;
    difficulty: string;
    equipment: string[];
    description: string;
    sourceUrl: string;
    details: {
        muscle: string;
        equipmentType: string | null;
        variationOf: string | null;
    };
    durationMinutes: null;
}

interface DirectoryEntry {
    name: string;
    url: string;
    muscles: Array<{
        name: string;
        url?: string;
        submuscles?: Array<{
            name: string;
            url: string;
        }>;
    }>;
}

// Data cleaning and validation functions
function cleanEquipmentName(equipment: string): string {
    if (!equipment) return '';

    // Remove Unicode artifacts and clean up
    let cleaned = equipment
        .replace(/â€‹/g, '') // Remove zero-width space artifacts
        .replace(/â€"/g, '-') // Fix em-dash artifacts
        .replace(/Â°/g, '°') // Fix degree symbol
        .trim();

    // Standardize equipment names
    const equipmentMap: { [key: string]: string } = {
        'lever (plate loaded)': 'Lever (plate loaded)',
        'lever (selectorized)': 'Lever (selectorized)',
        'smith': 'Smith',
        'body weight': 'Body Weight',
        'cable': 'Cable',
        'barbell': 'Barbell',
        'dumbbell': 'Dumbbell',
        'weighted': 'Weighted',
        'stretch': 'Stretch',
        'suspended': 'Suspended',
        'sled': 'Sled',
        'assisted': 'Assisted',
        'self-assisted': 'Self-assisted',
        'band-assisted': 'Band-assisted',
        'assisted (machine)': 'Assisted (machine)',
        'assisted (partner)': 'Assisted (partner)',
        'suspension': 'Suspended',
        'isometric': 'Isometric'
    };

    const lowerCleaned = cleaned.toLowerCase();
    return equipmentMap[lowerCleaned] || cleaned || 'Various';
}

function cleanExerciseName(name: string): string {
    if (!name) return '';

    return name
        .replace(/\s{2,}/g, ' ') // Replace multiple spaces with single space
        .replace(/â€‹/g, '') // Remove zero-width space artifacts
        .replace(/Â°/g, '°') // Fix degree symbol
        .trim();
}

function isDuplicateExercise(exercises: Exercise[], url: string): boolean {
    return exercises.some(e => e.url === url);
}

function validateExerciseData(exercises: Exercise[]): Exercise[] {
    return exercises.filter(exercise => {
        // Remove exercises with invalid data
        if (!exercise.name || !exercise.url) {
            return false;
        }

        // Remove exercises with malformed names
        if (exercise.name.length < 2 || exercise.name.includes('undefined')) {
            return false;
        }

        // Clean up equipment field
        if (exercise.equipment) {
            exercise.equipment = cleanEquipmentName(exercise.equipment);
            if (exercise.equipment === '' || exercise.equipment.length < 2) {
                exercise.equipment = 'Various';
            }
        }

        // Remove empty variations arrays
        if (exercise.variations && exercise.variations.length === 0) {
            delete exercise.variations;
        }

        return true;
    });
}

function isExerciseLink(href: string): boolean {
    return href.includes("/WeightExercises/") ||
        href.includes("/Stretches/") ||
        href.includes("/Aerobic/") ||
        href.includes("/Calisthenics/") ||
        // Also check for relative paths
        href.startsWith("../../WeightExercises") ||
        href.startsWith("../../Stretches") ||
        href.startsWith("../../Aerobic") ||
        href.startsWith("../../Calisthenics");
}

function resolveUrl(href: string, baseUrl: string): string {
    if (href.startsWith("http")) {
        return href;
    } else if (href.startsWith("/")) {
        return new URL(href, "https://exrx.net").href;
    } else {
        return new URL(href, baseUrl).href;
    }
}

function extractMuscleReferences(text: string): string[] {
    const muscleNames = [
        'oblique', 'obliques', 'erector', 'spinae', 'trapezius', 'deltoid',
        'biceps', 'triceps', 'latissimus', 'rhomboids', 'infraspinatus',
        'teres', 'subscapularis', 'serratus', 'pectoralis', 'quadriceps',
        'hamstrings', 'gluteus', 'gastrocnemius', 'soleus', 'tibialis'
    ];

    const found: string[] = [];
    const lowerText = text.toLowerCase();

    muscleNames.forEach(muscle => {
        if (lowerText.includes(muscle)) {
            found.push(muscle);
        }
    });

    return found;
}

// Utility function to add delay between requests
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function parseExerciseStructure($: cheerio.CheerioAPI, container: any): Exercise[] {
    const exercises: Exercise[] = [];

    // Find all top-level <ul> elements in the container
    container.find('ul').each((_: any, ul: any) => {
        const $ul = $(ul);

        // Skip nested ULs - we'll handle them recursively
        if ($ul.parents('ul').length > 0) return;

        // Process each top-level <li> which represents an equipment category
        $ul.children('li').each((_, li) => {
            const $li = $(li);

            // Get the equipment category name (first text node in the li)
            let equipmentText = '';
            const firstTextNode = $li.contents().filter(function () {
                return this.nodeType === 3; // Text node
            }).first();

            if (firstTextNode.length > 0) {
                equipmentText = firstTextNode.text().trim();
            }

            // If no direct text, look for first text before any nested elements
            if (!equipmentText) {
                const cloned = $li.clone();
                cloned.children().remove();
                equipmentText = cloned.text().trim();
            }

            // Clean and standardize equipment name
            equipmentText = cleanEquipmentName(equipmentText);

            // Process nested UL for exercises under this equipment
            const nestedUl = $li.children('ul').first();
            if (nestedUl.length > 0) {
                parseNestedExercises($, nestedUl, equipmentText, exercises);
            }

            // Also check for direct exercise links in this li (rare case)
            $li.children('a[href]').each((_, el) => {
                const href = $(el).attr('href') || '';
                if (isExerciseLink(href)) {
                    const exerciseName = cleanExerciseName($(el).text().trim());
                    const fullUrl = resolveUrl(href, 'https://exrx.net/Lists/ExList/ShouldWt');

                    if (exerciseName && !isDuplicateExercise(exercises, fullUrl)) {
                        exercises.push({
                            name: exerciseName,
                            url: fullUrl,
                            equipment: equipmentText || undefined
                        });
                    }
                }
            });
        });
    });

    return exercises;
}

function parseNestedExercises($: cheerio.CheerioAPI, ul: any, equipment: string, exercises: Exercise[], parentCategory?: string): void {
    ul.children('li').each((_: any, li: any) => {
        const $li = $(li);

        // Check if this li has a direct exercise link
        const directLink = $li.children('a[href]').first();
        if (directLink.length > 0) {
            const href = directLink.attr('href') || '';
            if (isExerciseLink(href)) {
                const exerciseName = cleanExerciseName(directLink.text().trim());
                const fullUrl = resolveUrl(href, 'https://exrx.net/Lists/ExList/ShouldWt');

                if (exerciseName && !isDuplicateExercise(exercises, fullUrl)) {
                    const exercise: Exercise = {
                        name: exerciseName,
                        url: fullUrl,
                        equipment: equipment || undefined
                    };

                    if (parentCategory) {
                        exercise.category = parentCategory;
                    }

                    // Check for sub-variations in nested UL
                    const subUl = $li.children('ul').first();
                    if (subUl.length > 0) {
                        exercise.variations = [];
                        parseNestedExercises($, subUl, equipment, exercise.variations, exerciseName);

                        // Remove empty variations array
                        if (exercise.variations.length === 0) {
                            delete exercise.variations;
                        }
                    }

                    exercises.push(exercise);
                }
            }
        } else {
            // This li might be a category/sub-category name
            const cloned = $li.clone();
            cloned.children('ul').remove(); // Remove nested ULs to get just the category text
            const categoryText = cloned.text().trim();

            // Process nested UL under this category
            const nestedUl = $li.children('ul').first();
            if (nestedUl.length > 0) {
                parseNestedExercises($, nestedUl, equipment, exercises, categoryText);
            }
        }
    });
}

/**
 * Scrape a single muscle page (e.g. Quadriceps list) for exercises + variations.
 */
async function scrapeMusclePage(url: string, muscleName: string, page: any): Promise<MuscleExercises> {

    console.log(`➡️ Starting scrape for muscle: ${muscleName}`);
    console.log(`   URL: ${url}`);

    try {
        await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
        const html = await page.content();
        const $ = cheerio.load(html);

        // Clean up
        $("script, style").remove();

        const exercises: Exercise[] = [];

        // Extract the anchor/fragment from the URL (e.g., #Supraspinatus)
        const urlParts = url.split('#');
        const muscleAnchor = urlParts.length > 1 ? urlParts[1] : muscleName;

        console.log(`Looking for muscle section: ${muscleAnchor}`);

        let foundExercises = false;

        // Strategy 1: Find h2 with anchor and look for exercises in following containers
        const h2WithAnchor = $('h2').filter((_, el) => {
            return $(el).find(`a[name="${muscleAnchor}"]`).length > 0;
        }).first();

        if (h2WithAnchor.length > 0) {
            console.log(`Found h2 section for ${muscleAnchor}`);

            let h2Container = h2WithAnchor.closest('.container');
            let exerciseContainer = h2Container.next('.container');

            // First try the immediate next container (original behavior)
            if (exerciseContainer.length > 0) {
                let exercisesFound = parseExerciseStructure($, exerciseContainer);
                exercisesFound = validateExerciseData(exercisesFound);

                if (exercisesFound.length > 0) {
                    console.log(`Found ${exercisesFound.length} exercises with equipment info in immediate next container for ${muscleAnchor}`);
                    exercises.push(...exercisesFound);
                    foundExercises = true;
                } else {
                    console.log(`Container found but no valid exercises extracted for ${muscleAnchor}`);
                }
            }

            // If no exercises in immediate container, search further with better boundary detection
            if (!foundExercises) {
                console.log(`No exercises in immediate container, searching further for ${muscleAnchor}`);
                let containersToCheck = h2Container.nextAll('.container').slice(1, 5);

                for (let i = 0; i < containersToCheck.length; i++) {
                    const container = $(containersToCheck[i]);

                    // Enhanced boundary detection - stop if we hit another muscle section
                    const hasOtherMuscleAnchor = container.find('h2 a[name]').length > 0;
                    const hasOtherMuscleHeading = container.find('h2').filter((_, el) => {
                        const text = $(el).text().toLowerCase();
                        // Check if this h2 contains common muscle/anatomy terms but isn't our muscle
                        const hasMuscleEnding = /^[a-z\s]+(ius|eus|us|or|is|um)$/.test(text);
                        return text !== h2WithAnchor.text().toLowerCase() &&
                            (text.includes('muscle') || text.includes('exercises') || hasMuscleEnding);
                    }).length > 0;

                    if (hasOtherMuscleAnchor || hasOtherMuscleHeading) {
                        console.log(`Stopping at next muscle section in container ${i + 2} for ${muscleAnchor}`);
                        break;
                    }

                    let exercisesInContainer = parseExerciseStructure($, container);
                    exercisesInContainer = validateExerciseData(exercisesInContainer);

                    if (exercisesInContainer.length > 0) {
                        console.log(`Found ${exercisesInContainer.length} exercises with equipment info in container ${i + 2} for ${muscleAnchor}`);
                        exercises.push(...exercisesInContainer);
                        foundExercises = true;
                        break; // Stop searching once we find exercises
                    }
                }
            }
        }

        // Strategy 2: Look for "Also see" references and follow them
        if (!foundExercises && h2WithAnchor.length > 0) {
            console.log(`No direct exercises found, looking for "Also see" references for ${muscleAnchor}`);

            let h2Container = h2WithAnchor.closest('.container');
            let nextContainer = h2Container.next('.container');

            if (nextContainer.length > 0) {
                const text = nextContainer.text().toLowerCase();
                console.log(`Checking text for references: ${text.substring(0, 300)}...`);

                // Look for "Also see" or similar patterns
                if (text.includes('also see') || text.includes('see ') || text.includes('listed under') ||
                    text.includes('oblique') || text.includes('erector spinae')) {
                    console.log(`Found reference text for ${muscleAnchor}: ${text.substring(0, 200)}...`);

                    // For Quadratus Lumborum, specifically look for Obliques section
                    if (muscleAnchor === 'Quadratus' || muscleName.toLowerCase().includes('quadratus')) {
                        console.log(`Searching for Obliques exercises for Quadratus Lumborum`);

                        // Find the Obliques section
                        const obliquesAnchor = $('a[name="Obliques"]').first();
                        if (obliquesAnchor.length > 0) {
                            console.log(`Found Obliques anchor, searching for exercises`);
                            const obliquesH2Container = obliquesAnchor.closest('h2').closest('.container');
                            const obliquesExerciseContainer = obliquesH2Container.next('.container');

                            if (obliquesExerciseContainer.length > 0) {
                                let obliquesExercises = parseExerciseStructure($, obliquesExerciseContainer);
                                obliquesExercises = validateExerciseData(obliquesExercises);
                                exercises.push(...obliquesExercises);
                                foundExercises = obliquesExercises.length > 0;
                                console.log(`Found ${obliquesExercises.length} obliques exercises for Quadratus Lumborum`);
                            }
                        }

                        // Also try searching the current page for links with 'obliques' in the URL
                        if (!foundExercises) {
                            console.log(`Searching for obliques exercises in current page`);
                            $("a[href]").each((_, el) => {
                                const href = $(el).attr("href") || "";
                                if (href.toLowerCase().includes('/obliques/') && isExerciseLink(href)) {
                                    const exerciseName = cleanExerciseName($(el).text().trim());
                                    const fullUrl = resolveUrl(href, url);
                                    if (exerciseName && !isDuplicateExercise(exercises, fullUrl)) {
                                        exercises.push({
                                            name: exerciseName,
                                            url: fullUrl,
                                            equipment: 'Various' // Default since we can't determine equipment from this method
                                        });
                                        foundExercises = true;
                                    }
                                }
                            });
                        }
                    } else {
                        // General reference handling for other muscles
                        const referencedMuscles = extractMuscleReferences(nextContainer.text());

                        if (referencedMuscles.length > 0) {
                            console.log(`Found muscle references: ${referencedMuscles.join(', ')}`);

                            referencedMuscles.forEach(refMuscle => {
                                const refAnchor = $(`a[name*="${refMuscle}"]`).first();
                                if (refAnchor.length > 0) {
                                    const refH2Container = refAnchor.closest('h2').closest('.container');
                                    const refExerciseContainer = refH2Container.next('.container');

                                    let refExercises = parseExerciseStructure($, refExerciseContainer);
                                    refExercises = validateExerciseData(refExercises);
                                    exercises.push(...refExercises);
                                    foundExercises = refExercises.length > 0;
                                }
                            });
                        }
                    }
                }
            }
        }

        // Strategy 3: Search for exercises with muscle name in URL path (targeted search)
        if (!foundExercises) {
            console.log(`Searching for exercises with ${muscleName}/${muscleAnchor} in URL path`);

            $("a[href]").each((_, el) => {
                const href = $(el).attr("href") || "";
                const muscleNameInPath = href.toLowerCase().includes(`/${muscleName.toLowerCase()}/`) ||
                    href.toLowerCase().includes(`/${muscleAnchor.toLowerCase()}/`);

                if (muscleNameInPath && isExerciseLink(href)) {
                    const exerciseName = cleanExerciseName($(el).text().trim());
                    const fullUrl = resolveUrl(href, url);
                    if (exerciseName && !isDuplicateExercise(exercises, fullUrl)) {
                        exercises.push({
                            name: exerciseName,
                            url: fullUrl,
                            equipment: 'Various' // Default since we can't determine equipment from this method
                        });
                        foundExercises = true;
                    }
                }
            });
        }

        // Strategy 4: If still no exercises and this is a known edge case, do broader contextual search
        if (!foundExercises && ['Quadratus', 'Supraspinatus', 'Popliteus'].includes(muscleAnchor)) {
            console.log(`Applying special handling for edge case muscle: ${muscleAnchor}`);

            // For these muscles, search the entire page but filter more carefully
            $("a[href]").each((_, el) => {
                const $a = $(el);
                const href = $a.attr("href") || "";
                const linkText = $a.text().toLowerCase();

                // More targeted filtering for edge case muscles
                if (isExerciseLink(href) && (
                    href.toLowerCase().includes(muscleName.toLowerCase()) ||
                    href.toLowerCase().includes(muscleAnchor.toLowerCase()) ||
                    linkText.includes(muscleName.toLowerCase()) ||
                    linkText.includes(muscleAnchor.toLowerCase())
                )) {
                    const exerciseName = cleanExerciseName($a.text().trim());
                    const fullUrl = resolveUrl(href, url);
                    if (exerciseName && !isDuplicateExercise(exercises, fullUrl)) {
                        exercises.push({
                            name: exerciseName,
                            url: fullUrl,
                            equipment: 'Various' // Default since we can't determine equipment from this method
                        });
                        foundExercises = true;
                    }
                }
            });
        }

        // Final validation and logging
        const finalExercises = validateExerciseData(exercises);
        console.log(`Final result: Found ${finalExercises.length} valid exercises for ${muscleName}`);

        if (finalExercises.length === 0) {
            console.log(`Warning: No exercises found for ${muscleName} at ${url}`);
        }

        return { muscle: muscleName, url, exercises: finalExercises };
    } catch (error) {
        console.error(`Error scraping ${muscleName}:`, error);
        return { muscle: muscleName, url, exercises: [] };
    }
}

function inferDifficulty(exerciseName: string, equipment: string | undefined): string {
    if (!equipment) return 'medium';

    const name = exerciseName.toLowerCase();
    const equip = equipment.toLowerCase();

    // Body weight exercises
    if (equip.includes('body weight') || equip.includes('bodyweight')) {
        if (name.includes('assisted') || name.includes('wall')) return 'beginner';
        if (name.includes('weighted') || name.includes('one arm') || name.includes('one leg')) return 'advanced';
        return 'medium';
    }

    // Machine exercises (generally easier to control)
    if (equip.includes('lever') || equip.includes('selectorized') || equip.includes('smith')) {
        return 'beginner';
    }

    // Cable exercises
    if (equip.includes('cable')) {
        if (name.includes('one arm') || name.includes('single')) return 'medium';
        return 'beginner';
    }

    // Free weights
    if (equip.includes('dumbbell')) {
        if (name.includes('one arm') || name.includes('single')) return 'medium';
        return 'beginner';
    }

    if (equip.includes('barbell')) {
        if (name.includes('one arm') || name.includes('snatch') || name.includes('clean')) return 'advanced';
        return 'medium';
    }

    // Kettlebell
    if (equip.includes('kettlebell')) {
        if (name.includes('snatch') || name.includes('clean') || name.includes('turkish')) return 'advanced';
        return 'medium';
    }

    // Bands and suspension
    if (equip.includes('band') || equip.includes('suspension')) {
        return 'beginner';
    }

    // Default
    return 'medium';
}

function buildMuscleToBodyPartMap(directory: DirectoryEntry[]): Map<string, string> {
    const map = new Map<string, string>();

    for (const bodyPart of directory) {
        for (const muscle of bodyPart.muscles) {
            // Handle muscles with submuscles (e.g., "Anterior", "Lateral", "Posterior" for Deltoid)
            if (muscle.submuscles && muscle.submuscles.length > 0) {
                for (const submuscle of muscle.submuscles) {
                    // Map both the full name and just the submuscle name
                    const fullMuscleName = `${muscle.name} ${submuscle.name}`;
                    map.set(fullMuscleName, bodyPart.name);
                    map.set(submuscle.name, bodyPart.name);
                }
            } else {
                // Regular muscle mapping
                map.set(muscle.name, bodyPart.name);
            }
        }
    }

    return map;
}

function transformExercises(rawData: MuscleExercises[]): ExerciseDocument[] {
    console.log("📖 Reading exrxDirectory.json for body part mapping...");

    if (!fs.existsSync(directoryPath)) {
        console.log("⚠️  Warning: exrxDirectory.json not found. Using muscle names as focus.");
        return transformWithoutDirectory(rawData);
    }

    const directoryRaw = fs.readFileSync(directoryPath, "utf-8");
    const directoryData = JSON.parse(directoryRaw) as DirectoryEntry[];

    console.log("🗺️  Building muscle to body part mapping...");
    const muscleToBodyPart = buildMuscleToBodyPartMap(directoryData);

    const transformedExercises: ExerciseDocument[] = [];

    console.log("🔄 Transforming exercises to exercise documents...");

    for (const muscleGroup of rawData) {
        const bodyPart = muscleToBodyPart.get(muscleGroup.muscle) || muscleGroup.muscle;

        for (const exercise of muscleGroup.exercises) {
            // Skip exercises without equipment (likely incomplete data)
            if (!exercise.equipment) {
                continue;
            }

            // Clean equipment name - remove invisible Unicode characters and trim
            const cleanedEquipment = exercise.equipment
                .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width spaces and similar
                .trim();

            // Skip invalid data (too short, doesn't start with capital letter)
            if (!cleanedEquipment || cleanedEquipment.length < 3 || !cleanedEquipment.match(/^[A-Z]/)) {
                continue;
            }

            // Check if this is a stretch exercise
            const isStretch = cleanedEquipment.toLowerCase().includes('stretch');

            // Add the main exercise
            const mainExercise: ExerciseDocument = {
                name: exercise.name,
                category: isStretch ? "stretch" : "strength",
                sport: "strength_training",
                focus: bodyPart,
                difficulty: isStretch ? "beginner" : inferDifficulty(exercise.name, cleanedEquipment),
                equipment: isStretch ? [] : [cleanedEquipment],
                description: "",
                sourceUrl: exercise.url,
                details: {
                    muscle: muscleGroup.muscle,
                    equipmentType: isStretch ? null : cleanedEquipment,
                    variationOf: null
                },
                durationMinutes: null
            };

            transformedExercises.push(mainExercise);

            // Add variations if they exist
            if (exercise.variations && exercise.variations.length > 0) {
                for (const variation of exercise.variations) {
                    const varEquipment = (variation.equipment || exercise.equipment)
                        .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width spaces
                        .trim();

                    // Skip invalid variations
                    if (!varEquipment || varEquipment.length < 3 || !varEquipment.match(/^[A-Z]/)) {
                        continue;
                    }

                    // Check if variation is a stretch exercise
                    const isVariationStretch = varEquipment.toLowerCase().includes('stretch');

                    const variationExercise: ExerciseDocument = {
                        name: variation.name,
                        category: isVariationStretch ? "stretch" : "strength",
                        sport: "strength_training",
                        focus: bodyPart,
                        difficulty: isVariationStretch ? "beginner" : inferDifficulty(variation.name, varEquipment),
                        equipment: isVariationStretch ? [] : [varEquipment],
                        description: "",
                        sourceUrl: variation.url,
                        details: {
                            muscle: muscleGroup.muscle,
                            equipmentType: isVariationStretch ? null : varEquipment,
                            variationOf: exercise.name
                        },
                        durationMinutes: null
                    };

                    transformedExercises.push(variationExercise);
                }
            }
        }
    }

    console.log(`✅ Transformed ${transformedExercises.length} exercises`);
    return transformedExercises;
}

function transformWithoutDirectory(rawData: MuscleExercises[]): ExerciseDocument[] {
    const transformedExercises: ExerciseDocument[] = [];

    for (const muscleGroup of rawData) {
        for (const exercise of muscleGroup.exercises) {
            if (!exercise.equipment) continue;

            // Clean equipment name - remove invisible Unicode characters and trim
            const cleanedEquipment = exercise.equipment
                .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width spaces and similar
                .trim();

            // Skip invalid data (too short, doesn't start with capital letter)
            if (!cleanedEquipment || cleanedEquipment.length < 3 || !cleanedEquipment.match(/^[A-Z]/)) {
                continue;
            }

            // Check if this is a stretch exercise
            const isStretch = cleanedEquipment.toLowerCase().includes('stretch');

            transformedExercises.push({
                name: exercise.name,
                category: isStretch ? "stretch" : "strength",
                sport: "strength_training",
                focus: muscleGroup.muscle,
                difficulty: isStretch ? "beginner" : inferDifficulty(exercise.name, cleanedEquipment),
                equipment: isStretch ? [] : [cleanedEquipment],
                description: "",
                sourceUrl: exercise.url,
                details: {
                    muscle: muscleGroup.muscle,
                    equipmentType: isStretch ? null : cleanedEquipment,
                    variationOf: null
                },
                durationMinutes: null
            });

            if (exercise.variations && exercise.variations.length > 0) {
                for (const variation of exercise.variations) {
                    const varEquipment = (variation.equipment || exercise.equipment)
                        .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width spaces
                        .trim();

                    // Skip invalid variations
                    if (!varEquipment || varEquipment.length < 3 || !varEquipment.match(/^[A-Z]/)) {
                        continue;
                    }

                    // Check if variation is a stretch exercise
                    const isVariationStretch = varEquipment.toLowerCase().includes('stretch');

                    transformedExercises.push({
                        name: variation.name,
                        category: isVariationStretch ? "stretch" : "strength",
                        sport: "strength_training",
                        focus: muscleGroup.muscle,
                        difficulty: isVariationStretch ? "beginner" : inferDifficulty(variation.name, varEquipment),
                        equipment: isVariationStretch ? [] : [varEquipment],
                        description: "",
                        sourceUrl: variation.url,
                        details: {
                            muscle: muscleGroup.muscle,
                            equipmentType: isVariationStretch ? null : varEquipment,
                            variationOf: exercise.name
                        },
                        durationMinutes: null
                    });
                }
            }
        }
    }

    return transformedExercises;
}

/**
 * Given the result of scrapeExrxDirectory, scrape all muscle exercise pages.
 */
export async function scrapeExrxExercises(groups: MuscleGroup[]): Promise<ExerciseDocument[]> {
    let results: MuscleExercises[] = [];

    if (fs.existsSync(transformedJsonPath)) {
        console.log("✅ Transformed exercise data already exists. Skipping scrape.");
        const raw = fs.readFileSync(transformedJsonPath, "utf-8");
        return JSON.parse(raw) as ExerciseDocument[];
    }

    // Launch a single browser instance for all scraping
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    try {
        for (const group of groups) {
            for (const muscle of group.muscles) {
                if (muscle.url) {
                    const muscleExercises = await scrapeMusclePage(muscle.url, muscle.name, page);
                    results.push(muscleExercises);
                    // Add 2 second delay between requests
                    await delay(2000);
                }

                if (muscle.submuscles) {
                    for (const sub of muscle.submuscles) {
                        if (sub.url) {
                            const subExercises = await scrapeMusclePage(sub.url, sub.name, page);
                            results.push(subExercises);
                            // Add 2 second delay between requests
                            await delay(2000);
                        }
                    }
                }
            }
        }

        // Transform the raw exercises to exercise documents
        const transformedExercises = transformExercises(results);

        // Save only the transformed exercises
        console.log("💾 Saving transformed exercises to exrxExercisesTransformed.json...");
        fs.writeFileSync(transformedJsonPath, JSON.stringify(transformedExercises, null, 2), "utf-8");
        console.log("✅ Transformed exercises saved!");

        return transformedExercises;
    } finally {
        await browser.close();
    }
}