// testExrxScraper.ts
import { scrapeExrxDirectory, MuscleGroup } from "../exrxDirectoryScraper";

/** pretty-printer */
function printGroups(groups: MuscleGroup[]) {
	const indent = (n: number) => " ".repeat(n * 2);

	for (const g of groups) {
		console.log(`- ${g.name} (${g.url || "no link"})`);
		for (const m of g.muscles) {
			printMuscle(m, 1);
		}
	}

	function printMuscle(m: any, level: number) {
		console.log(`${indent(level)}- ${m.name} (${m.url || "no link"})`);
		if (m.submuscles) {
			for (const s of m.submuscles) printMuscle(s, level + 1);
		}
	}
}

(async () => {
	let groups: MuscleGroup[];
	groups = await scrapeExrxDirectory("https://exrx.net/Lists/Directory");

	printGroups(groups);
})();
