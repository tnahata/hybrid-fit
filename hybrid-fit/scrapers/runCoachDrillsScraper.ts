import axios from "axios";
import * as cheerio from "cheerio";
import * as fs from "fs";
import path from "path";
import { saveRunningDrills } from "./scraper-save/saveDataAsJson";

const BASE = "https://runcoach.com";
const jsonPath = path.resolve(__dirname, "./scraped-json/runningDrills.json");

interface RunningDrillRaw {
    name: string;
    sport: "running";
    instructions: string[];
    sourceUrl: string;
}

export interface RunningDrillDocument {
    _id: string;
    name: string;
    sport: "running";
    category: "drill";
    description: string;
    focus: string[];
    difficulty: string;
    equipment: string;
    sourceUrl: string;
}

export async function scrapeRuncoachDrillLinks(): Promise<{ name: string; url: string }[]> {
    const listUrl = `${BASE}/index.php?id=8%3Atraining-videos&option=com_k2&task=category&view=itemlist`;
    const res = await axios.get(listUrl);
    const $ = cheerio.load(res.data);

    const drills: { name: string; url: string }[] = [];

    // Find all links that contain "running-drills"
    $("a").each((_, el) => {
        const href = $(el).attr("href");
        const text = $(el).text().trim();

        if (!href || !text) return;
        if (text.toLowerCase() === "read more") return; // Skip "Read more" links

        if (href.includes("running-drills")) {
            // Fix URL construction - ensure proper separator
            let fullUrl;
            if (href.startsWith("http")) {
                fullUrl = href;
            } else if (href.startsWith("/")) {
                fullUrl = BASE + href;
            } else {
                fullUrl = BASE + "/" + href;
            }

            // Extract drill name - remove "Running Drills: " prefix if present
            const name = text.replace(/^Running Drills:\s*/i, "").trim();

            // Avoid duplicates
            if (!drills.find(d => d.url === fullUrl)) {
                drills.push({ name, url: fullUrl });
            }
        }
    });

    return drills;
}

export async function scrapeRuncoachDrill(drillUrl: string, fallbackName: string = "Unnamed Drill"): Promise<RunningDrillRaw> {
    try {
        const { data } = await axios.get(drillUrl);
        const $ = cheerio.load(data);

        // Extract drill name from h1, title, or URL
        let name = $("h1").first().text().trim().replace(/^Running Drills:\s*/i, "");

        // If no h1 found, try to extract from URL
        if (!name || name === "Unnamed Drill") {
            const urlMatch = drillUrl.match(/running-drills[:-]([^&?]+)/i);
            if (urlMatch) {
                name = urlMatch[1]
                    .replace(/-/g, " ")
                    .replace(/\b\w/g, l => l.toUpperCase());
            }
        }

        // Final fallback
        if (!name) {
            name = fallbackName;
        }

        // Extract description paragraphs from the main content area
        const instructions: string[] = [];
        $(".itemFullText p, .itemBody p").each((_, el) => {
            const text = $(el).text().trim();
            // Filter out empty paragraphs and navigation text
            if (text && text.length > 10 && !text.toLowerCase().includes("read more")) {
                instructions.push(text);
            }
        });

        // If no instructions found, try broader selectors
        if (instructions.length === 0) {
            $("p").each((_, el) => {
                const text = $(el).text().trim();
                if (text && text.length > 10 && !text.toLowerCase().includes("read more")) {
                    instructions.push(text);
                }
            });
        }

        return {
            name,
            sport: "running",
            instructions,
            sourceUrl: drillUrl
        };
    } catch (err: any) {
        console.warn("Failed to fetch detail:", drillUrl, err.message);
        return {
            name: fallbackName,
            sport: "running",
            instructions: [],
            sourceUrl: drillUrl
        };
    }
}

// Utility function to generate ID from name
function generateId(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '_')
        .replace(/-+/g, '_');
}

// Infer focus areas based on drill name and description
function inferFocus(name: string, instructions: string[]): string[] {
    const focus: Set<string> = new Set();
    const combined = (name + ' ' + instructions.join(' ')).toLowerCase();

    // Common focus areas for running drills
    if (combined.includes('knee') || combined.includes('hip flexor')) focus.add('knee lift');
    if (combined.includes('coordination') || combined.includes('rhythm')) focus.add('coordination');
    if (combined.includes('form') || combined.includes('mechanics')) focus.add('form');
    if (combined.includes('technique')) focus.add('technique');
    if (combined.includes('stride') || combined.includes('striding')) focus.add('stride');
    if (combined.includes('power') || combined.includes('explosive')) focus.add('power');
    if (combined.includes('speed') || combined.includes('turnover')) focus.add('speed');
    if (combined.includes('calf') || combined.includes('calves')) focus.add('calf strength');
    if (combined.includes('quad')) focus.add('quad strength');
    if (combined.includes('hamstring')) focus.add('hamstring strength');
    if (combined.includes('glute')) focus.add('glute strength');
    if (combined.includes('shin') || combined.includes('tibialis')) focus.add('shin strength');
    if (combined.includes('foot') || combined.includes('ankle')) focus.add('foot control');
    if (combined.includes('flexibility') || combined.includes('mobility')) focus.add('flexibility');
    if (combined.includes('warm') || combined.includes('activation')) focus.add('warmup');

    // Default if nothing found
    if (focus.size === 0) {
        focus.add('technique');
        focus.add('form');
    }

    return Array.from(focus);
}

// Infer difficulty based on drill characteristics
function inferDifficulty(name: string, instructions: string[]): string {
    const combined = (name + ' ' + instructions.join(' ')).toLowerCase();

    // Advanced indicators
    if (combined.includes('bound') ||
        combined.includes('explosive') ||
        combined.includes('power') ||
        combined.includes('sprint') ||
        name.toLowerCase().includes('skip') && combined.includes('high')) {
        return 'medium';
    }

    // Most running drills are beginner-friendly
    return 'easy';
}

// Transform raw drill to exercise document
function transformDrill(raw: RunningDrillRaw): RunningDrillDocument {
    const description = raw.instructions.join(' ');

    return {
        _id: generateId(raw.name),
        name: raw.name,
        sport: "running",
        category: "drill",
        description: description,
        focus: inferFocus(raw.name, raw.instructions),
        difficulty: inferDifficulty(raw.name, raw.instructions),
        equipment: "None",
        sourceUrl: raw.sourceUrl
    };
}

// Main execution function
export async function scrapeAllRunningDrills(): Promise<RunningDrillDocument[]> {
    if (fs.existsSync(jsonPath)) {
        console.log("✅ Reading running drills from JSON...");
        const raw = fs.readFileSync(jsonPath, "utf-8");
        const drills = JSON.parse(raw) as RunningDrillDocument[];
        console.log(`Found ${drills.length} drills in cache`);
        return drills;
    }

    console.log("Scraping running drills from Runcoach...\n");

    // Step 1: Get all drill links
    const drillLinks = await scrapeRuncoachDrillLinks();
    console.log(`Found ${drillLinks.length} drills:\n`);

    // Step 2: Scrape each drill's details
    const rawDrills: RunningDrillRaw[] = [];

    for (const link of drillLinks) {
        console.log(`Scraping: ${link.name}...`);
        const drill = await scrapeRuncoachDrill(link.url, link.name);
        rawDrills.push(drill);
    }

    // Step 3: Transform to exercise documents
    console.log("\n🔄 Transforming drills to exercise documents...");
    const transformedDrills = rawDrills.map(transformDrill);

    // Step 4: Save transformed drills
    await saveRunningDrills(transformedDrills);

    return transformedDrills;
}