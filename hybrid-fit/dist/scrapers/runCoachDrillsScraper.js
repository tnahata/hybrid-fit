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
exports.scrapeRuncoachDrillLinks = scrapeRuncoachDrillLinks;
exports.scrapeRuncoachDrill = scrapeRuncoachDrill;
exports.scrapeAllRunningDrills = scrapeAllRunningDrills;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const fs = __importStar(require("fs"));
const path_1 = __importDefault(require("path"));
const saveDataAsJson_1 = require("./scraper-save/saveDataAsJson");
const BASE = "https://runcoach.com";
const jsonPath = path_1.default.resolve(__dirname, "./scraped-json/runningDrills.json");
async function scrapeRuncoachDrillLinks() {
    const listUrl = `${BASE}/index.php?id=8%3Atraining-videos&option=com_k2&task=category&view=itemlist`;
    const res = await axios_1.default.get(listUrl);
    const $ = cheerio.load(res.data);
    const drills = [];
    // Find all links that contain "running-drills"
    $("a").each((_, el) => {
        const href = $(el).attr("href");
        const text = $(el).text().trim();
        if (!href || !text)
            return;
        if (text.toLowerCase() === "read more")
            return; // Skip "Read more" links
        if (href.includes("running-drills")) {
            // Fix URL construction - ensure proper separator
            let fullUrl;
            if (href.startsWith("http")) {
                fullUrl = href;
            }
            else if (href.startsWith("/")) {
                fullUrl = BASE + href;
            }
            else {
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
async function scrapeRuncoachDrill(drillUrl, fallbackName = "Unnamed Drill") {
    try {
        const { data } = await axios_1.default.get(drillUrl);
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
        const instructions = [];
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
    }
    catch (err) {
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
async function scrapeAllRunningDrills() {
    if (fs.existsSync(jsonPath)) {
        console.log("✅ Reading running drills from JSON...");
        const raw = fs.readFileSync(jsonPath, "utf-8");
        const drills = JSON.parse(raw);
        return drills;
    }
    console.log("Scraping running drills from Runcoach...\n");
    // Step 1: Get all drill links
    const drillLinks = await scrapeRuncoachDrillLinks();
    console.log(`Found ${drillLinks.length} drills:\n`);
    // Step 2: Scrape each drill's details
    const allDrills = [];
    for (const link of drillLinks) {
        console.log(`Scraping: ${link.name}...`);
        const drill = await scrapeRuncoachDrill(link.url, link.name);
        allDrills.push(drill);
    }
    await (0, saveDataAsJson_1.saveRunningDrills)(allDrills);
    return allDrills;
}
// Run if executed directly
if (require.main === module) {
    scrapeAllRunningDrills().catch(console.error);
}
