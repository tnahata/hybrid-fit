import axios from "axios";
import * as cheerio from "cheerio";
import * as fs from "fs";
import path from "path";
import { saveHalHigdonPlans } from "./scraper-save/saveDataAsJson";

const BASE = "https://www.halhigdon.com";
const jsonPathPlans = path.resolve(__dirname, "./scraped-json/halHigdonTrainingPlans.json");
const jsonPathTemplates = path.resolve(__dirname, "./scraped-json/halHigdonWorkoutTemplates.json");

// Interfaces matching the schema
export interface WorkoutTemplate {
    _id: string;
    name: string;
    sport: string;
    category: string;
    description: string;
    metrics: {
        distanceMiles?: number;
        durationMins?: number;
    };
    tags: string[];
}

export interface TrainingPlan {
    _id: string;
    name: string;
    sport: string;
    category: string;
    durationWeeks: number;
    level: string;
    sourceUrl: string;
    details: {
        goal: string;
        planType: string;
        weeklyStructure: string[];
        sessionGlossary: Record<string, string>;
    };
    weeks: Array<{
        weekNumber: number;
        days: Array<{
            dayOfWeek: string;
            workoutTemplateId: string;
        }>;
    }>;
}

interface PlanLink {
    name: string;
    url: string;
    level: string;
    raceType: string;
}

// Parse workout text and create a unique workout template ID
function parseWorkoutToTemplateId(workoutText: string): string {
    const normalized = workoutText.toLowerCase().trim();

    // If input is already an ID (contains underscores and ends with 'mi'), return as-is
    // This prevents re-parsing IDs like "easy_run_1_75mi" which would incorrectly become "easy_run_75mi"
    if (normalized.match(/^(easy_run|pace_run|run)_.*mi$/)) {
        return normalized;
    }

    // Rest days
    if (normalized === "rest" || normalized === "rest or easy run") {
        return "rest_day";
    }

    // Cross training
    if (normalized.includes("cross")) {
        const match = normalized.match(/(\d+)\s*min/);
        const mins = match ? match[1] : "30";
        return `cross_train_${mins}min`;
    }

    // Races
    if (normalized.includes("race")) {
        const match = normalized.match(/(5-?k|10-?k|half|marathon)/i);
        if (match) {
            const raceType = match[1].replace("-", "").toLowerCase();
            return `race_${raceType}`;
        }
        return "race";
    }

    // Running workouts (check for mile-based workouts)
    const distMatch = normalized.match(/(\d+(?:\.\d+)?)\s*mi\b/);
    if (distMatch) {
        // Keep original number, but use underscore version for ID
        const distForId = distMatch[1].replace(".", "_");


        if (normalized.includes("pace")) {
            return `pace_run_${distForId}mi`;
        } else {
            return `easy_run_${distForId}mi`;
        }
    }

    // Time-based tempo workouts
    if (normalized.includes("tempo")) {
        // Try to match with explicit "min" or "minutes"
        const timeMatchExplicit = normalized.match(/(\d+)\s*(min|minutes)/);
        if (timeMatchExplicit) {
            return `tempo_${timeMatchExplicit[1]}min`;
        }

        // Try to match number before "tempo" (e.g., "30 tempo" or "40 tempo")
        const timeMatchImplicit = normalized.match(/(\d+)\s*tempo/);
        if (timeMatchImplicit) {
            return `tempo_${timeMatchImplicit[1]}min`;
        }

        return "tempo_run";
    }

    // Time-based runs (hour:minute format like "1:45 run" or "2:00 run")
    const timeRunMatch = normalized.match(/(\d+):(\d+)\s*run/);
    if (timeRunMatch) {
        const hours = timeRunMatch[1];
        const mins = timeRunMatch[2];
        return `run_${hours}h${mins}min`;
    }

    // Minute-based runs with pace notation (like "90 min run" or "90 min run (3/1)")
    const minRunMatch = normalized.match(/(\d+)\s*min\s*run/);
    if (minRunMatch) {
        const mins = minRunMatch[1];
        const hasPaceNotation = normalized.includes("(3/1)");
        return hasPaceNotation ? `run_${mins}min_3_1` : `run_${mins}min`;
    }

    // Interval workouts (like "4 x 800", "5 x hill")
    const intervalMatch = normalized.match(/(\d+)\s*x\s*(\w+)/);
    if (intervalMatch) {
        const reps = intervalMatch[1];
        const type = intervalMatch[2];
        return `intervals_${reps}x${type}`;
    }

    // Complex pace runs (like "pace 4 total / 2 pace")
    const complexPaceMatch = normalized.match(/pace\s+(\d+)\s+total.*?(\d+)\s+pace/);
    if (complexPaceMatch) {
        const total = complexPaceMatch[1];
        const paceDistance = complexPaceMatch[2];
        return `pace_run_${paceDistance}of${total}mi`;
    }

    // Fallback
    return normalized.replace(/[^a-z0-9]/g, "_");
}

// Create workout template from parsed workout text
function createWorkoutTemplate(workoutText: string): WorkoutTemplate {
    const normalized = workoutText.toLowerCase().trim();
    const templateId = parseWorkoutToTemplateId(workoutText);


    // Rest day
    if (normalized === "rest" || normalized === "rest or easy run") {
        return {
            _id: "rest_day",
            name: "Rest Day",
            sport: "running",
            category: "recovery",
            description: "No running. Use the day for rest, mobility, or stretching.",
            metrics: {
                distanceMiles: 0,
                durationMins: 0
            },
            tags: ["rest", "recovery", "mobility"]
        };
    }

    // Cross training
    if (normalized.includes("cross")) {
        const match = normalized.match(/(\d+)\s*min/);
        const mins = match ? parseInt(match[1]) : 30;
        return {
            _id: templateId,
            name: `Cross Training ${mins}min`,
            sport: "running",
            category: "cross_training",
            description: `${mins} minutes of cross-training (swimming, cycling, or other low-impact activity).`,
            metrics: {
                durationMins: mins
            },
            tags: ["cross_training", "aerobic", "recovery"]
        };
    }

    // Races
    if (normalized.includes("race")) {
        const match = normalized.match(/(5-?k|8-?k|10-?k|15-?k|half|marathon)/i);
        const raceType = match ? match[1].replace("-", "").toUpperCase() : "RACE";

        // Calculate race distance in miles
        const raceDistances: Record<string, number> = {
            "5K": 3.1,
            "8K": 5.0,
            "10K": 6.2,
            "15K": 9.3,
            "HALF": 13.1,
            "MARATHON": 26.2
        };

        const distanceMiles = raceDistances[raceType] || undefined;

        return {
            _id: templateId,
            name: `${raceType} Race`,
            sport: "running",
            category: "race",
            description: `Race day - ${raceType}`,
            metrics: distanceMiles ? { distanceMiles } : {},
            tags: ["race", "competition"]
        };
    }

    // Tempo workouts (time-based)
    if (normalized.includes("tempo")) {
        // Try to match from workout text like "30 min tempo" or from ID like "tempo_30min"
        const timeMatch = normalized.match(/(\d+)\s*min/) || templateId.match(/tempo_(\d+)min/);
        if (timeMatch) {
            const mins = parseInt(timeMatch[1]);
            return {
                _id: templateId,
                name: `Tempo Run ${mins}min`,
                sport: "running",
                category: "tempo",
                description: `${mins}-minute tempo run at comfortably hard pace (approx. 80-85% effort).`,
                metrics: {
                    durationMins: mins
                },
                tags: ["tempo", "threshold", "speed"]
            };
        }
    }

    // Time-based runs (hour:minute format)
    const timeRunMatch = normalized.match(/(\d+):(\d+)\s*run/);
    if (timeRunMatch) {
        const hours = parseInt(timeRunMatch[1]);
        const mins = parseInt(timeRunMatch[2]);
        const totalMins = hours * 60 + mins;
        return {
            _id: templateId,
            name: `${hours}:${timeRunMatch[2]} Run`,
            sport: "running",
            category: "long_run",
            description: `${hours} hour ${mins} minute long run at steady pace.`,
            metrics: {
                durationMins: totalMins
            },
            tags: ["long_run", "endurance", "time_based"]
        };
    }

    // Minute-based runs
    const minRunMatch = normalized.match(/(\d+)\s*min\s*run/);
    if (minRunMatch) {
        const mins = parseInt(minRunMatch[1]);
        const hasPaceNotation = normalized.includes("(3/1)");

        if (hasPaceNotation) {
            return {
                _id: templateId,
                name: `${mins}min Run (3/1)`,
                sport: "running",
                category: "long_run",
                description: `${mins}-minute run: first 3/4 at comfortable pace, last 1/4 near race pace.`,
                metrics: {
                    durationMins: mins
                },
                tags: ["long_run", "progression", "pace_work"]
            };
        } else {
            return {
                _id: templateId,
                name: `${mins}min Run`,
                sport: "running",
                category: "endurance",
                description: `${mins}-minute run at steady pace.`,
                metrics: {
                    durationMins: mins
                },
                tags: ["endurance", "time_based"]
            };
        }
    }

    // Interval workouts
    const intervalMatch = normalized.match(/(\d+)\s*x\s*(\w+)/);
    if (intervalMatch) {
        const reps = intervalMatch[1];
        const type = intervalMatch[2];

        const distanceMap: Record<string, string> = {
            "200": "200m",
            "400": "400m",
            "800": "800m",
            "1600": "1600m",
            "mile": "mile",
            "hill": "hill"
        };

        const displayType = distanceMap[type] || type;

        if (type === "hill") {
            const numReps = parseInt(reps);
            const distancePerRepMiles = 0.125; // ~200m minimum per hill repeat
            const totalDistanceMiles = numReps * distancePerRepMiles;

            return {
                _id: templateId,
                name: `${reps} x ${displayType}`,
                sport: "running",
                category: "strength",
                description: `${reps} hill repeats. Run up a 200-400m (quarter-mile) hill hard, similar to 400m track intensity. Jog or walk back down for recovery between repeats. Hill training strengthens quadriceps and builds speed.`,
                metrics: {
                    distanceMiles: totalDistanceMiles
                },
                tags: ["intervals", "hill", "strength", "quad_strength"]
            };
        } else {
            const numReps = parseInt(reps);
            // Convert meters to miles for track intervals
            const metersToMiles: Record<string, number> = {
                "200": 0.124,  // 200m = ~0.124 miles
                "400": 0.25,   // 400m = ~0.25 miles
                "800": 0.5,    // 800m = ~0.5 miles
                "1600": 1.0,   // 1600m = ~1 mile
                "mile": 1.0    // 1 mile
            };

            const distancePerRepMiles = metersToMiles[type] || 0;
            const totalDistanceMiles = numReps * distancePerRepMiles;

            return {
                _id: templateId,
                name: `${reps} x ${displayType}`,
                sport: "running",
                category: "speed",
                description: `${reps} repetitions of ${displayType} intervals.`,
                metrics: totalDistanceMiles > 0 ? {
                    distanceMiles: totalDistanceMiles
                } : {},
                tags: ["intervals", "speed", "track"]
            };
        }
    }

    // Complex pace runs
    const complexPaceMatch = normalized.match(/pace\s+(\d+)\s+total.*?(\d+)\s+pace/);
    if (complexPaceMatch) {
        const total = parseInt(complexPaceMatch[1]);
        const paceDistance = parseInt(complexPaceMatch[2]);
        return {
            _id: templateId,
            name: `Pace Run ${paceDistance} of ${total}mi`,
            sport: "running",
            category: "tempo",
            description: `${total}-mile run with ${paceDistance} miles at race pace.`,
            metrics: {
                distanceMiles: total
            },
            tags: ["pace", "tempo", "race_pace"]
        };
    }

    // Parse distance from templateId if it's in the format easy_run_X_Ymi (decimal with underscore)
    const idDecimalMatch = templateId.match(/(easy_run|pace_run)_(\d+)_(\d+)mi/);
    if (idDecimalMatch) {
        const runType = idDecimalMatch[1];
        const wholePart = idDecimalMatch[2];
        const decimalPart = idDecimalMatch[3];
        const dist = parseFloat(`${wholePart}.${decimalPart}`);

        // Skip invalid distances
        if (dist <= 0 || dist > 30) {
            console.warn(`Invalid distance detected: ${dist} miles. Skipping workout: ${workoutText}`);
            return {
                _id: "rest_day",
                name: "Rest Day",
                sport: "running",
                category: "recovery",
                description: "Invalid workout data - converted to rest day.",
                metrics: { distanceMiles: 0, durationMins: 0 },
                tags: ["rest", "recovery"]
            };
        }

        if (runType === "pace_run") {
            return {
                _id: templateId,
                name: `Pace Run ${dist}mi`,
                sport: "running",
                category: "tempo",
                description: `${dist}-mile run at target race pace.`,
                metrics: { distanceMiles: dist },
                tags: ["pace", "tempo", "race_pace"]
            };
        } else if (dist >= 8) {
            return {
                _id: templateId,
                name: `Long Run ${dist}mi`,
                sport: "running",
                category: "long_run",
                description: `${dist}-mile long run at a steady pace. Focus on endurance and fueling.`,
                metrics: { distanceMiles: dist },
                tags: ["long_run", "endurance", "fueling"]
            };
        } else {
            return {
                _id: templateId,
                name: `Easy Run ${dist}mi`,
                sport: "running",
                category: "endurance",
                description: `Run ${dist} miles at a conversational pace to build aerobic capacity.`,
                metrics: { distanceMiles: dist },
                tags: ["aerobic", "base", "easy"]
            };
        }
    }

    // Running workouts (mile-based)
    const distMatch = normalized.match(/(\d+(?:\.\d+)?)\s*mi\b/);
    if (distMatch) {
        const dist = parseFloat(distMatch[1]);

        // Skip invalid distances (0 miles or unrealistic distances > 30 miles)
        if (dist <= 0 || dist > 30) {
            console.warn(`Invalid distance detected: ${dist} miles. Skipping workout: ${workoutText}`);
            return {
                _id: "rest_day",
                name: "Rest Day",
                sport: "running",
                category: "recovery",
                description: "Invalid workout data - converted to rest day.",
                metrics: { distanceMiles: 0, durationMins: 0 },
                tags: ["rest", "recovery"]
            };
        }

        if (normalized.includes("pace")) {
            return {
                _id: templateId,
                name: `Pace Run ${dist}mi`,
                sport: "running",
                category: "tempo",
                description: `${dist}-mile run at target race pace.`,
                metrics: {
                    distanceMiles: dist
                },
                tags: ["pace", "tempo", "race_pace"]
            };
        } else if (dist >= 8) {
            return {
                _id: templateId,
                name: `Long Run ${dist}mi`,
                sport: "running",
                category: "long_run",
                description: `${dist}-mile long run at a steady pace. Focus on endurance and fueling.`,
                metrics: {
                    distanceMiles: dist
                },
                tags: ["long_run", "endurance", "fueling"]
            };
        } else {
            return {
                _id: templateId,
                name: `Easy Run ${dist}mi`,
                sport: "running",
                category: "endurance",
                description: `Run ${dist} miles at a conversational pace to build aerobic capacity.`,
                metrics: {
                    distanceMiles: dist
                },
                tags: ["aerobic", "base", "easy"]
            };
        }
    }

    // Parse templateId-based workouts (for workouts created from IDs in existing data)
    // Time-based runs from ID (like "run_90min", "run_1h45min")
    const runTimeMatch = templateId.match(/run_(\d+)h(\d+)min/);
    if (runTimeMatch) {
        const hours = parseInt(runTimeMatch[1]);
        const mins = parseInt(runTimeMatch[2]);
        const totalMins = hours * 60 + mins;
        return {
            _id: templateId,
            name: `${hours}:${runTimeMatch[2].padStart(2, '0')} Run`,
            sport: "running",
            category: "long_run",
            description: `${hours} hour ${mins} minute long run at steady pace.`,
            metrics: { durationMins: totalMins },
            tags: ["long_run", "endurance", "time_based"]
        };
    }

    const runMinMatch = templateId.match(/run_(\d+)min/);
    if (runMinMatch) {
        const mins = parseInt(runMinMatch[1]);
        return {
            _id: templateId,
            name: `${mins}min Run`,
            sport: "running",
            category: "endurance",
            description: `${mins}-minute run at steady pace.`,
            metrics: { durationMins: mins },
            tags: ["endurance", "time_based"]
        };
    }

    // Walking workouts from ID (like "30_min_walk", "40_60_min_walk")
    const walkRangeMatch = templateId.match(/(\d+)_(\d+)_min_walk/);
    if (walkRangeMatch) {
        const minDuration = parseInt(walkRangeMatch[1]);
        const maxDuration = parseInt(walkRangeMatch[2]);
        return {
            _id: templateId,
            name: `${minDuration}-${maxDuration}min Walk`,
            sport: "running",
            category: "recovery",
            description: `Walk for ${minDuration}-${maxDuration} minutes at a comfortable pace.`,
            metrics: { durationMins: minDuration }, // Use minimum duration
            tags: ["walking", "recovery", "low_impact"]
        };
    }

    const walkMatch = templateId.match(/(\d+)_min_walk/);
    if (walkMatch) {
        const mins = parseInt(walkMatch[1]);
        return {
            _id: templateId,
            name: `${mins}min Walk`,
            sport: "running",
            category: "recovery",
            description: `Walk for ${mins} minutes at a comfortable pace.`,
            metrics: { durationMins: mins },
            tags: ["walking", "recovery", "low_impact"]
        };
    }

    // Test/assessment workouts (like "5k_test", "10k_run")
    if (templateId === "5k_test") {
        return {
            _id: templateId,
            name: "5K Test",
            sport: "running",
            category: "assessment",
            description: "5K time trial to assess current fitness level and pace.",
            metrics: { distanceMiles: 3.1 },
            tags: ["test", "assessment", "5k"]
        };
    }

    if (templateId === "10k_run") {
        return {
            _id: templateId,
            name: "10K Run",
            sport: "running",
            category: "endurance",
            description: "10K run at steady pace.",
            metrics: { distanceMiles: 6.2 },
            tags: ["10k", "endurance"]
        };
    }

    // Generic event placeholders (like "half_marathon", "marathon")
    if (templateId === "half_marathon") {
        return {
            _id: templateId,
            name: "Half Marathon",
            sport: "running",
            category: "race",
            description: "Half marathon distance run or race.",
            metrics: { distanceMiles: 13.1 },
            tags: ["half_marathon", "race", "endurance"]
        };
    }

    if (templateId === "marathon") {
        return {
            _id: templateId,
            name: "Marathon",
            sport: "running",
            category: "race",
            description: "Full marathon distance run or race.",
            metrics: { distanceMiles: 26.2 },
            tags: ["marathon", "race", "endurance"]
        };
    }

    // Fallback
    return {
        _id: templateId,
        name: workoutText,
        sport: "running",
        category: "general",
        description: workoutText,
        metrics: {},
        tags: ["general"]
    };
}

// Scrape all training plan links from the main training page
export async function scrapeHalHigdonPlanLinks(): Promise<PlanLink[]> {
    const listUrl = `${BASE}/training/`;
    const res = await axios.get(listUrl);
    const $ = cheerio.load(res.data);

    const plans: PlanLink[] = [];

    // Race types to look for (order matters - check longer strings first to avoid partial matches)
    const raceTypes = ["Half Marathon", "Marathon", "15K", "10K", "8K", "5K"];

    // Find all training program sections
    $("a").each((_, el) => {
        const href = $(el).attr("href");
        const text = $(el).text().trim();

        if (!href || !text) return;

        // Look for links that match training program patterns
        const isTrainingLink = href.includes("-marathon/") ||
                               href.includes("-5k/") ||
                               href.includes("-8k/") ||
                               href.includes("-10k/") ||
                               href.includes("-15k/");

        // Exclude walking plans
        const isWalkingPlan = text.toLowerCase().includes("walker") ||
                            href.toLowerCase().includes("walker");

        if (isTrainingLink && !isWalkingPlan && !href.includes("#") && !href.includes("javascript")) {
            let fullUrl = href;
            if (!href.startsWith("http")) {
                fullUrl = href.startsWith("/") ? BASE + href : `${BASE}/${href}`;
            }

            // Determine level
            let level = "novice";
            if (text.toLowerCase().includes("intermediate") || href.includes("intermediate")) {
                level = "intermediate";
            } else if (text.toLowerCase().includes("advanced") || href.includes("advanced")) {
                level = "advanced";
            }

            // Determine race type
            let raceType = "Marathon";

            // Special case: Post-marathon recovery plans
            if (href.includes("post-marathon-recovery")) {
                raceType = "Post Marathon Recovery";
            } else {
                // Check for race type in URL/text
                for (const rt of raceTypes) {
                    if (text.toLowerCase().includes(rt.toLowerCase()) || href.toLowerCase().includes(rt.toLowerCase().replace(" ", "-"))) {
                        raceType = rt;
                        break;
                    }
                }
            }

            // Avoid duplicates
            if (!plans.find(p => p.url === fullUrl)) {
                plans.push({
                    name: text,
                    url: fullUrl,
                    level,
                    raceType
                });
            }
        }
    });

    return plans;
}

// Scrape a single training plan page
export async function scrapeHalHigdonPlan(planUrl: string, planName: string, level: string, raceType: string): Promise<TrainingPlan | null> {
    try {
        const { data } = await axios.get(planUrl);
        const $ = cheerio.load(data);

        // Extract plan name from h1 or title if not provided
        let name = planName;
        if (!name || name.length < 3) {
            name = $("h1").first().text().trim() || $("title").first().text().trim();
        }

        // Generate plan ID
        const planId = name.toLowerCase().replace(/[^a-z0-9]/g, "_");

        // Extract weekly schedule table
        const weeks: Array<{
            weekNumber: number;
            days: Array<{ dayOfWeek: string; workoutTemplateId: string }>;
        }> = [];

        const weeklyStructure: string[] = [];
        const sessionGlossary: Record<string, string> = {
            "Easy Run": "Run at an easy, conversational pace to build aerobic capacity.",
            "Pace Run": "Run at your target race pace.",
            "Long Run": "Long distance run at steady pace for endurance.",
            "Cross Training": "Low-impact aerobic exercise (swimming, cycling, walking).",
            "Rest": "Recovery day - no running.",
            "Race": "Race day effort."
        };

        // Find the training schedule table
        const table = $("table").first();
        const rows = table.find("tr");

        let weekNumber = 0;
        const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

        rows.each((idx, row) => {
            const cells = $(row).find("td");

            if (cells.length >= 8) { // Should have 8 cells: Week + 7 days
                weekNumber++;
                const weekDays: Array<{ dayOfWeek: string; workoutTemplateId: string }> = [];

                cells.each((cellIdx, cell) => {
                    // Skip first cell (Week column) - start from cellIdx 1
                    if (cellIdx > 0 && cellIdx <= 7) {
                        let workoutText = $(cell).text().trim();
                        const dayIdx = cellIdx - 1; // Adjust index for days array
                        const dayName = daysOfWeek[dayIdx];

                        // Normalize mile abbreviations: "m" → "mi" (but not "400m" which is meters)
                        // Only replace when followed by space and word like "run", "pace", etc., or end of string
                        workoutText = workoutText.replace(/\b(\d+(?:\.\d+)?)\s*m\s+(run|pace|jog|walk)/gi, "$1 mi $2");

                        // Enhance bare numbers with context
                        // If it's just a number, add context based on the day and distance
                        if (/^\d+(\.\d+)?$/.test(workoutText)) {
                            const distance = parseFloat(workoutText);

                            // Skip zero values (likely rest days or empty cells)
                            if (distance === 0) {
                                workoutText = "rest";
                            } else if (dayName === "Sat" || dayName === "Sun") {
                                // Saturday and Sunday bare numbers are typically long runs
                                workoutText = `${workoutText} mi run`;
                            } else {
                                // Weekday bare numbers default to easy runs
                                workoutText = `${workoutText} mi run`;
                            }
                        }

                        const templateId = parseWorkoutToTemplateId(workoutText);

                        weekDays.push({
                            dayOfWeek: dayName,
                            workoutTemplateId: templateId
                        });

                        // Build weekly structure from first week
                        if (weekNumber === 1) {
                            weeklyStructure.push(`${dayName}: ${workoutText}`);
                        }
                    }
                });

                if (weekDays.length > 0) {
                    weeks.push({ weekNumber, days: weekDays });
                }
            }
        });

        // If no weeks found, return null
        if (weeks.length === 0) {
            console.warn(`No schedule found for ${planUrl}`);
            return null;
        }

        return {
            _id: planId,
            name,
            sport: "running",
            category: "endurance",
            durationWeeks: weeks.length,
            level,
            sourceUrl: planUrl,
            details: {
                goal: raceType,
                planType: name,
                weeklyStructure,
                sessionGlossary
            },
            weeks
        };
    } catch (err: any) {
        console.warn("Failed to scrape plan:", planUrl, err.message);
        return null;
    }
}

// Main execution function
export async function scrapeAllHalHigdonPlans(): Promise<{ plans: TrainingPlan[], templates: WorkoutTemplate[] }> {
    // Check if cached JSON exists
    if (fs.existsSync(jsonPathPlans) && fs.existsSync(jsonPathTemplates)) {
        console.log("✅ Reading Hal Higdon plans from JSON...");
        const plansRaw = fs.readFileSync(jsonPathPlans, "utf-8");
        const templatesRaw = fs.readFileSync(jsonPathTemplates, "utf-8");
        const plans = JSON.parse(plansRaw) as TrainingPlan[];
        const templates = JSON.parse(templatesRaw) as WorkoutTemplate[];
        return { plans, templates };
    }

    console.log("Scraping Hal Higdon training plans...\n");

    // Step 1: Get all plan links
    const planLinks = await scrapeHalHigdonPlanLinks();
    console.log(`Found ${planLinks.length} training plans\n`);

    // Step 2: Scrape each plan
    const allPlans: TrainingPlan[] = [];
    const templateMap = new Map<string, WorkoutTemplate>();

    for (const link of planLinks) {
        console.log(`Scraping: ${link.name}...`);
        const plan = await scrapeHalHigdonPlan(link.url, link.name, link.level, link.raceType);

        if (plan) {
            allPlans.push(plan);

            // Extract unique workout templates
            for (const week of plan.weeks) {
                for (const day of week.days) {
                    if (!templateMap.has(day.workoutTemplateId)) {
                        // Find the original workout text to create template
                        const weekData = plan.weeks.find(w => w.weekNumber === week.weekNumber);
                        if (weekData) {
                            const dayData = weekData.days.find(d => d.dayOfWeek === day.dayOfWeek);
                            if (dayData) {
                                // We need to reconstruct the workout text from the template ID
                                // For now, create a generic template
                                const template = createWorkoutTemplate(day.workoutTemplateId);
                                templateMap.set(day.workoutTemplateId, template);
                            }
                        }
                    }
                }
            }
        }
    }

    const allTemplates = Array.from(templateMap.values());

    // Save to JSON
    await saveHalHigdonPlans(allPlans, allTemplates);

    return { plans: allPlans, templates: allTemplates };
}

// Run if executed directly
if (require.main === module) {
    scrapeAllHalHigdonPlans().catch(console.error);
}
