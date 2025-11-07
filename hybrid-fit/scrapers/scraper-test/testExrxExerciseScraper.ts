import { scrapeExrxDirectory } from "../exrxDirectoryScraper";
import { scrapeExrxExercises } from "../exrxExercisesScraper";

(async () => {
	const groups = await scrapeExrxDirectory();
	const exercises = await scrapeExrxExercises(groups);
	console.log(JSON.stringify(exercises, null, 2));
})();