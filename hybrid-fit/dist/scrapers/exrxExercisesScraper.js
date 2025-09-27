"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeExrxExercises = scrapeExrxExercises;
const puppeteer_extra_1 = __importDefault(require("puppeteer-extra"));
const cheerio = __importStar(require("cheerio"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const saveExrxDirectory_1 = require("./scraper-save/saveExrxDirectory");
const jsonPath = path_1.default.resolve(__dirname, "./scraped-json/exrxExercises.json");
// async function scrapeMusclePage(url: string, muscleName: string): Promise<MuscleExercises> {
//     console.log(`➡️ Starting scrape for muscle: ${muscleName}`);
//     console.log(`   URL: ${url}`);
//     const browser = await puppeteer.launch({ headless: false });
//     const page = await browser.newPage();
//     try {
//         await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
//         const html = await page.content();
//         const $ = cheerio.load(html);
//         // Clean up
//         $("script, style").remove();
//         const exercises: Exercise[] = [];
//         // Extract the anchor/fragment from the URL (e.g., #Sternocleidomastoid)
//         const urlParts = url.split('#');
//         const muscleAnchor = urlParts.length > 1 ? urlParts[1] : muscleName;
//         console.log(`Looking for muscle section: ${muscleAnchor}`);
//         // Find the h2 element that contains the anchor with the muscle name
//         const h2WithAnchor = $('h2').filter((_, el) => {
//             return $(el).find(`a[name="${muscleAnchor}"]`).length > 0;
//         }).first();
//         if (h2WithAnchor.length > 0) {
//             console.log(`Found h2 section for ${muscleAnchor}`);
//             // Get the container div for this h2
//             let h2Container = h2WithAnchor.closest('.container');
//             // The exercises are in the next .container div after the h2
//             let exerciseContainer = h2Container.next('.container');
//             if (exerciseContainer.length > 0) {
//                 console.log(`Found exercise container for ${muscleAnchor}`);
//                 // Search for exercises only within this container
//                 exerciseContainer.find("a[href]").each((_, el) => {
//                     processExerciseLink($, el, exercises, url);
//                 });
//             } else {
//                 console.log(`No exercise container found immediately after h2 for ${muscleAnchor}`);
//                 // Fallback: search in all following containers until next h2
//                 h2Container.nextAll('.container').each((_, el) => {
//                     const $container = $(el);
//                     // Stop if this container has an h2 (next muscle section)
//                     if ($container.find('h2').length > 0) {
//                         return false;
//                     }
//                     $container.find("a[href]").each((_, linkEl) => {
//                         processExerciseLink($, linkEl, exercises, url);
//                     });
//                 });
//             }
//         } else {
//             console.log(`Warning: Could not find h2 section for ${muscleAnchor}, trying alternative approach`);
//             // Alternative approach: look for the anchor directly
//             const anchorElement = $(`a[name="${muscleAnchor}"]`);
//             if (anchorElement.length > 0) {
//                 console.log(`Found anchor element for ${muscleAnchor}`);
//                 // Find the parent container and the next container with exercises
//                 let anchorContainer = anchorElement.closest('.container');
//                 let exerciseContainer = anchorContainer.next('.container');
//                 if (exerciseContainer.length > 0) {
//                     exerciseContainer.find("a[href]").each((_, el) => {
//                         processExerciseLink($, el, exercises, url);
//                     });
//                 }
//             } else {
//                 console.log(`Could not find anchor for ${muscleAnchor}, falling back to full page search`);
//                 // Last resort: search entire page but this will cause duplicates
//                 $("a[href]").each((_, el) => {
//                     processExerciseLink($, el, exercises, url);
//                 });
//             }
//         }
//         console.log(`Found ${exercises.length} exercises for ${muscleName}`);
//         return { muscle: muscleName, url, exercises };
//     } finally {
//         await browser.close();
//     }
// }
// function processExerciseLink($: cheerio.CheerioAPI, el: any, exercises: Exercise[], baseUrl: string) {
//     const $a = $(el);
//     const href = $a.attr("href") || "";
//     // Check if the href contains exercise-related paths (both relative and absolute)
//     const isExerciseLink =
//         href.includes("/WeightExercises/") ||
//         href.includes("/Stretches/") ||
//         href.includes("/Aerobic/") ||
//         href.includes("/Calisthenics/") ||
//         // Also check for relative paths
//         href.startsWith("../../WeightExercises") ||
//         href.startsWith("../../Stretches") ||
//         href.startsWith("../../Aerobic") ||
//         href.startsWith("../../Calisthenics");
//     if (isExerciseLink) {
//         const name = $a.text().trim();
//         if (!name) return;
//         // Handle both relative and absolute URLs
//         let fullUrl: string;
//         if (href.startsWith("http")) {
//             // Already absolute URL
//             fullUrl = href;
//         } else if (href.startsWith("/")) {
//             // Absolute path, add domain
//             fullUrl = new URL(href, "https://exrx.net").href;
//         } else {
//             // Relative path, resolve relative to current page URL
//             fullUrl = new URL(href, baseUrl).href;
//         }
//         // Check if already in list (to avoid duplicates)
//         if (!exercises.some((e) => e.url === fullUrl)) {
//             exercises.push({ name, url: fullUrl });
//         }
//     }
// }
async function scrapeMusclePage(url, muscleName) {
    console.log(`➡️ Starting scrape for muscle: ${muscleName}`);
    console.log(`   URL: ${url}`);
    const browser = await puppeteer_extra_1.default.launch({ headless: false });
    const page = await browser.newPage();
    try {
        await page.goto(url, { waitUntil: "networkidle2", timeout: 90000 });
        const html = await page.content();
        const $ = cheerio.load(html);
        // Clean up
        $("script, style").remove();
        const exercises = [];
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
                const exerciseLinksInFirstContainer = [];
                exerciseContainer.find("a[href]").each((_, el) => {
                    if (isExerciseLink($(el).attr("href") || "")) {
                        exerciseLinksInFirstContainer.push(el);
                    }
                });
                if (exerciseLinksInFirstContainer.length > 0) {
                    console.log(`Found ${exerciseLinksInFirstContainer.length} exercise links in immediate next container for ${muscleAnchor}`);
                    exerciseLinksInFirstContainer.forEach(el => {
                        processExerciseLink($, el, exercises, url);
                    });
                    foundExercises = true;
                }
            }
            // If no exercises in immediate container, search further (new behavior for edge cases)
            if (!foundExercises) {
                console.log(`No exercises in immediate container, searching further for ${muscleAnchor}`);
                let containersToCheck = h2Container.nextAll('.container').slice(1, 5); // Skip the first one we already checked
                for (let i = 0; i < containersToCheck.length; i++) {
                    const container = $(containersToCheck[i]);
                    // Stop if we hit another muscle section (h2 with anchor)
                    if (container.find('h2 a[name]').length > 0) {
                        console.log(`Stopping at next muscle section in container ${i + 2}`);
                        break;
                    }
                    // Look for exercise links in this container
                    const exerciseLinksInContainer = [];
                    container.find("a[href]").each((_, el) => {
                        if (isExerciseLink($(el).attr("href") || "")) {
                            exerciseLinksInContainer.push(el);
                        }
                    });
                    if (exerciseLinksInContainer.length > 0) {
                        console.log(`Found ${exerciseLinksInContainer.length} exercise links in container ${i + 2} for ${muscleAnchor}`);
                        exerciseLinksInContainer.forEach(el => {
                            processExerciseLink($, el, exercises, url);
                        });
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
                // Look for "Also see" or similar patterns
                if (text.includes('also see') || text.includes('see ') || text.includes('listed under')) {
                    console.log(`Found "Also see" reference for ${muscleAnchor}: ${text.substring(0, 200)}...`);
                    // Extract muscle names mentioned in the reference
                    const referencedMuscles = extractMuscleReferences(nextContainer.text());
                    if (referencedMuscles.length > 0) {
                        console.log(`Found muscle references: ${referencedMuscles.join(', ')}`);
                        // Look for exercises under those referenced muscle sections
                        referencedMuscles.forEach(refMuscle => {
                            const refAnchor = $(`a[name*="${refMuscle}"]`).first();
                            if (refAnchor.length > 0) {
                                const refH2Container = refAnchor.closest('h2').closest('.container');
                                const refExerciseContainer = refH2Container.next('.container');
                                refExerciseContainer.find("a[href]").each((_, el) => {
                                    processExerciseLink($, el, exercises, url);
                                });
                                foundExercises = exercises.length > 0;
                            }
                        });
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
                    processExerciseLink($, el, exercises, url);
                    foundExercises = true;
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
                if (isExerciseLink(href) && (href.toLowerCase().includes(muscleName.toLowerCase()) ||
                    href.toLowerCase().includes(muscleAnchor.toLowerCase()) ||
                    linkText.includes(muscleName.toLowerCase()) ||
                    linkText.includes(muscleAnchor.toLowerCase()))) {
                    processExerciseLink($, el, exercises, url);
                    foundExercises = true;
                }
            });
        }
        console.log(`Final result: Found ${exercises.length} exercises for ${muscleName}`);
        console.log(`Found ${exercises.length} exercises for ${muscleName}`);
        return { muscle: muscleName, url, exercises };
    }
    finally {
        await browser.close();
    }
}
function processExerciseLink($, el, exercises, baseUrl) {
    const $a = $(el);
    const href = $a.attr("href") || "";
    if (isExerciseLink(href)) {
        const name = $a.text().trim();
        if (!name)
            return;
        // Handle both relative and absolute URLs
        let fullUrl;
        if (href.startsWith("http")) {
            // Already absolute URL
            fullUrl = href;
        }
        else if (href.startsWith("/")) {
            // Absolute path, add domain
            fullUrl = new URL(href, "https://exrx.net").href;
        }
        else {
            // Relative path, resolve relative to current page URL
            fullUrl = new URL(href, baseUrl).href;
        }
        // Check if already in list (to avoid duplicates)
        if (!exercises.some((e) => e.url === fullUrl)) {
            exercises.push({ name, url: fullUrl });
        }
    }
}
function isExerciseLink(href) {
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
function extractMuscleReferences(text) {
    const muscleNames = [
        'oblique', 'obliques', 'erector', 'spinae', 'trapezius', 'deltoid',
        'biceps', 'triceps', 'latissimus', 'rhomboids', 'infraspinatus',
        'teres', 'subscapularis', 'serratus', 'pectoralis', 'quadriceps',
        'hamstrings', 'gluteus', 'gastrocnemius', 'soleus', 'tibialis'
    ];
    const found = [];
    const lowerText = text.toLowerCase();
    muscleNames.forEach(muscle => {
        if (lowerText.includes(muscle)) {
            found.push(muscle);
        }
    });
    return found;
}
/**
 * Given the result of scrapeExrxDirectory, scrape all muscle exercise pages.
 */
async function scrapeExrxExercises(groups) {
    let results = [];
    if (fs_1.default.existsSync(jsonPath)) {
        console.log("✅ Reading directory data from JSON...");
        const raw = fs_1.default.readFileSync(jsonPath, "utf-8");
        results = JSON.parse(raw);
        return results;
    }
    for (const group of groups) {
        for (const muscle of group.muscles) {
            if (muscle.url) {
                const muscleExercises = await scrapeMusclePage(muscle.url, muscle.name);
                results.push(muscleExercises);
            }
            if (muscle.submuscles) {
                for (const sub of muscle.submuscles) {
                    if (sub.url) {
                        const subExercises = await scrapeMusclePage(sub.url, sub.name);
                        results.push(subExercises);
                    }
                }
            }
        }
    }
    await (0, saveExrxDirectory_1.saveExercisesAsJSON)(results);
    return results;
}
