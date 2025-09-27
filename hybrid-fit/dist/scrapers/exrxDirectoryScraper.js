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
exports.scrapeExrxDirectory = scrapeExrxDirectory;
// scrapers/exrxDirectoryScraper.ts
const puppeteer_extra_1 = __importDefault(require("puppeteer-extra"));
const cheerio = __importStar(require("cheerio"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const saveExrxDirectory_1 = require("./scraper-save/saveExrxDirectory");
const jsonPath = path_1.default.resolve(__dirname, "./scraped-json/exrxDirectory.json");
function normalizeExrxUrl(href) {
    if (!href)
        return undefined;
    // If the URL already starts with http(s), leave it
    if (href.startsWith("http"))
        return href;
    // Ensure it starts with /Lists/
    if (href.startsWith("/")) {
        return new URL(href, "https://exrx.net").href;
    }
    // Otherwise, relative path like ExList/Neck → prefix with /Lists/
    if (!href.startsWith("Lists")) {
        href = `Lists/${href}`;
    }
    return new URL("/" + href, "https://exrx.net").href;
}
/**
 * Parse a <ul> element (direct child UL) into an array of Muscle.
 * Only traverses one extra nested <ul> for submuscles.
 */
function parseMuscleList($, ul) {
    const muscles = [];
    // iterate only direct li children (prevents accidental deep capture)
    $(ul)
        .children("li")
        .each((_, li) => {
        const $li = $(li);
        // direct anchor child? (e.g. <li><a href="...">Name</a> ...</li>)
        const directAnchor = $li.children("a").first();
        if (directAnchor.length) {
            const name = directAnchor.text().trim();
            const href = directAnchor.attr("href") || undefined;
            const url = normalizeExrxUrl(href);
            const muscle = { name, url };
            // check for nested ULs directly inside this li (submuscles)
            const nestedUl = $li.children("ul").first();
            if (nestedUl.length) {
                muscle.submuscles = parseMuscleList($, nestedUl[0]);
            }
            muscles.push(muscle);
            return;
        }
        // no direct anchor: this li is likely a header text with child UL (e.g. "Deltoid" + nested UL)
        // remove nested UL(s) and read the remaining text as the muscle name
        const cloned = $li.clone();
        cloned.children("ul").remove();
        const headerText = cloned.text().trim();
        const nestedUls = $li.children("ul");
        if (headerText && nestedUls.length) {
            const muscle = { name: headerText, submuscles: [] };
            nestedUls.each((_, nestedUl) => {
                muscle.submuscles.push(...parseMuscleList($, nestedUl));
            });
            muscles.push(muscle);
            return;
        }
        // fallback: if li has anchor deeper (shouldn't happen on this page), try to find it
        const anyAnchor = $li.find("a").first();
        if (anyAnchor.length) {
            const name = anyAnchor.text().trim();
            const href = anyAnchor.attr("href") || undefined;
            const url = href ? new URL(href, "https://exrx.net").href : undefined;
            muscles.push({ name, url });
        }
    });
    return muscles;
}
/**
 * Scrape the /Lists/Directory page for groups -> muscles -> submuscles.
 */
async function scrapeExrxDirectory(directoryUrl = "https://exrx.net/Lists/Directory") {
    let groups;
    if (fs_1.default.existsSync(jsonPath)) {
        console.log("✅ Reading directory data from JSON...");
        const raw = fs_1.default.readFileSync(jsonPath, "utf-8");
        groups = JSON.parse(raw);
        return groups;
    }
    const browser = await puppeteer_extra_1.default.launch({ headless: false }); // set true if you have CF solved
    const page = await browser.newPage();
    try {
        await page.goto(directoryUrl, { waitUntil: "networkidle2" });
        const html = await page.content();
        const $ = cheerio.load(html);
        // Remove scripts/styles so text extraction is cleaner
        $("script, style").remove();
        const groups = [];
        // Select only top-level group <li>s inside the two columns:
        // article .col-sm-6 > ul > li  <- this targets the two columns with the directory lists
        $("article .col-sm-6 > ul > li").each((_, groupLi) => {
            const $groupLi = $(groupLi);
            const groupAnchor = $groupLi.children("a").first();
            const groupName = groupAnchor.text().trim();
            const groupHref = groupAnchor.attr("href");
            if (!groupName)
                return; // skip stray items
            const group = {
                name: groupName,
                url: groupHref ? new URL(groupHref, "https://exrx.net").href : undefined,
                muscles: [],
            };
            // There may be multiple child <ul> blocks (as in Shoulders case).
            // Parse each direct child <ul> and append its parsed muscles.
            $groupLi.children("ul").each((_, ul) => {
                const parsed = parseMuscleList($, ul);
                // append but avoid duplicates by name+url
                for (const m of parsed) {
                    // naive dedupe key
                    const key = `${m.name}||${m.url || ""}`;
                    const exists = group.muscles.some((mm) => `${mm.name}||${mm.url || ""}` === key);
                    if (!exists)
                        group.muscles.push(m);
                }
            });
            groups.push(group);
        });
        await (0, saveExrxDirectory_1.saveDirectoryAsJSON)(groups);
        return groups;
    }
    finally {
        await browser.close();
    }
}
