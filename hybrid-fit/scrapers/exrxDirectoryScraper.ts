// scrapers/exrxDirectoryScraper.ts
import puppeteer from "puppeteer-extra";
import * as cheerio from "cheerio";
import path from "path";
import fs from "fs";
import { saveDirectoryAsJSON } from "./scraper-save/saveExrxDirectory";

const jsonPath = path.resolve(__dirname, "./scraped-json/exrxDirectory.json");

export interface Muscle {
	name: string;
	url?: string;
	submuscles?: Muscle[];
}

export interface MuscleGroup {
	name: string;
	url?: string;
	muscles: Muscle[];
}

function normalizeExrxUrl(href: string | undefined) {
	if (!href) return undefined;

	// If the URL already starts with http(s), leave it
	if (href.startsWith("http")) return href;

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
function parseMuscleList($: cheerio.CheerioAPI, ul: any): Muscle[] {
	const muscles: Muscle[] = [];

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

				const muscle: Muscle = { name, url };

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
				const muscle: Muscle = { name: headerText, submuscles: [] };

				nestedUls.each((_, nestedUl) => {
					muscle.submuscles!.push(...parseMuscleList($, nestedUl));
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
export async function scrapeExrxDirectory(directoryUrl = "https://exrx.net/Lists/Directory") {
	let groups: MuscleGroup[];

	if (fs.existsSync(jsonPath)) {
		console.log("✅ Reading directory data from JSON...");
		const raw = fs.readFileSync(jsonPath, "utf-8");
		groups = JSON.parse(raw) as MuscleGroup[];
		return groups;
	}

	const browser = await puppeteer.launch({ headless: false }); // set true if you have CF solved
	const page = await browser.newPage();

	try {
		await page.goto(directoryUrl, { waitUntil: "networkidle2" });
		const html = await page.content();
		const $ = cheerio.load(html);

		// Remove scripts/styles so text extraction is cleaner
		$("script, style").remove();

		const groups: MuscleGroup[] = [];

		// Select only top-level group <li>s inside the two columns:
		// article .col-sm-6 > ul > li  <- this targets the two columns with the directory lists
		$("article .col-sm-6 > ul > li").each((_, groupLi) => {
			const $groupLi = $(groupLi);
			const groupAnchor = $groupLi.children("a").first();
			const groupName = groupAnchor.text().trim();
			const groupHref = groupAnchor.attr("href");

			if (!groupName) return; // skip stray items

			const group: MuscleGroup = {
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
					if (!exists) group.muscles.push(m);
				}
			});

			groups.push(group);
		});

		await saveDirectoryAsJSON(groups);

		return groups;
	} finally {
		await browser.close();
	}
}