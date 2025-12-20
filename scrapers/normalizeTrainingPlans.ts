import fs from "fs";
import path from "path";
import slugify from "slugify";
import { saveNormalizedTrainingPlans } from "./scraper-save/saveDataAsJson";

export interface TrainingPlanDay {
	dayOfWeek: string;
	workoutTemplateId: string;
}

export interface TrainingPlanWeek {
	weekNumber: number;
	days: TrainingPlanDay[];
}

export interface TrainingPlanDetails {
	goal: string;
	planType: string;
}

export interface NormalizedTrainingPlan {
	_id: string;
	name: string;
	sport: string;
	category: string;
	durationWeeks: number;
	level: string;
	sourceUrl?: string;
	details: TrainingPlanDetails;
	weeks: TrainingPlanWeek[];
}

const inputDir = path.resolve(__dirname, "./scraped-json");

/**
 * Generate _id if not provided
 */
function generateTrainingPlanId(plan: any): string {
	if (plan._id) return plan._id;
	return slugify(plan.name || "unnamed",
		{
			lower: true, strict: true, replacement: "_"
		}
	);
}

/**
 * Normalize each training plan
 */
function normalizeTrainingPlan(plan: any): NormalizedTrainingPlan {
	return {
		_id: generateTrainingPlanId(plan),
		name: plan.name?.trim() || "Unnamed Plan",
		sport: plan.sport?.toLowerCase() || "general",
		category: plan.category?.toLowerCase() || "general",
		durationWeeks: Number(plan.durationWeeks) || 0,
		level: plan.level?.toLowerCase() || "unspecified",
		sourceUrl: plan.sourceUrl?.trim() || undefined,
		details: {
			goal: plan.details?.goal?.trim() || "",
			planType: plan.details?.planType?.trim() || ""
		},
		weeks: Array.isArray(plan.weeks)
			? plan.weeks.map((week: any) => ({
				weekNumber: week.weekNumber,
				days: Array.isArray(week.days)
					? week.days.map((day: any) => ({
						dayOfWeek: day.dayOfWeek?.trim(),
						workoutTemplateId: day.workoutTemplateId?.trim(),
					}))
					: [],
			}))
			: [],
	};
}

/**
 * Main function
 */
export async function normalizeTrainingPlans(): Promise<NormalizedTrainingPlan[]> {

	console.log("Starting normalization of training plans...");

	const inputFile = path.join(inputDir, "halHigdonTrainingPlans.json");
	if (!fs.existsSync(inputFile)) {
		console.error(`❌ Input file not found: ${inputFile}`);
		return [];
	}

	const rawData = fs.readFileSync(inputFile,"utf-8");
	const plans = JSON.parse(rawData);

	const normalizedPlans: NormalizedTrainingPlan[] = plans.map(normalizeTrainingPlan);

	await saveNormalizedTrainingPlans(normalizedPlans);

	return normalizedPlans;
}

// Run if executed directly
if (require.main === module) {
	normalizeTrainingPlans();
}