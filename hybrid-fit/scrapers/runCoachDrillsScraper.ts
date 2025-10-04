import axios from "axios";
import * as cheerio from "cheerio";
import * as fs from "fs";
import path from "path";
import { saveRunningDrills } from "./scraper-save/saveDataAsJson";

const BASE = "https://runcoach.com";
const jsonPath = path.resolve(__dirname, "./scraped-json/runningDrills.json");

export interface RunningDrill {
    name: string;
    sport: "running";
    instructions: string[];
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

export async function scrapeRuncoachDrill(drillUrl: string, fallbackName: string = "Unnamed Drill"): Promise<RunningDrill> {
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

// Main execution function
export async function scrapeAllRunningDrills(): Promise<RunningDrill[]> {
    if (fs.existsSync(jsonPath)) {
        console.log("✅ Reading running drills from JSON...");
        const raw = fs.readFileSync(jsonPath, "utf-8");
        const drills = JSON.parse(raw) as RunningDrill[];
        return drills;
    }

    console.log("Scraping running drills from Runcoach...\n");

    // Step 1: Get all drill links
    const drillLinks = await scrapeRuncoachDrillLinks();
    console.log(`Found ${drillLinks.length} drills:\n`);

    // Step 2: Scrape each drill's details
    const allDrills: RunningDrill[] = [];

    for (const link of drillLinks) {
        console.log(`Scraping: ${link.name}...`);
        const drill = await scrapeRuncoachDrill(link.url, link.name);
        allDrills.push(drill);
    }

    await saveRunningDrills(allDrills);

    return allDrills;
}

// Run if executed directly
if (require.main === module) {
    scrapeAllRunningDrills().catch(console.error);
}
