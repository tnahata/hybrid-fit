import { WorkoutTemplate, WorkoutExerciseStructure } from "@/models/Workouts";
import { Exercise } from "@/models/Exercise";
import { TrainingPlan, TrainingPlanWeek, TrainingPlanDay } from "@/models/TrainingPlans";
import { EnrichedTrainingPlan } from "types/enrichedTypes";

export async function enrichTrainingPlans(
	planIds: string[]
): Promise<EnrichedTrainingPlan[]> {

	const trainingPlans = await TrainingPlan.find({
		_id: { $in: planIds }
	}).lean();

	const workoutTemplateIds = new Set<string>();
	trainingPlans.forEach((plan) => {
		plan.weeks?.forEach((week: TrainingPlanWeek) =>
			week.days.forEach((day: TrainingPlanDay) => {
				if (day.workoutTemplateId) {
					workoutTemplateIds.add(String(day.workoutTemplateId));
				}
			})
		);
	});

	const workoutTemplates = await WorkoutTemplate.find({
		_id: { $in: Array.from(workoutTemplateIds) },
	}).lean();

	const exerciseIds = new Set<string>();
	workoutTemplates.forEach((wt) =>
		wt.structure?.forEach((s: WorkoutExerciseStructure) => {
			if (s.exerciseId) {
				exerciseIds.add(String(s.exerciseId));
			}
		})
	);

	const exercises = await Exercise.find({
		_id: { $in: Array.from(exerciseIds) }
	}).lean();

	const exerciseMap = new Map(exercises.map((ex) => [String(ex._id), ex]));
	const workoutTemplateMap = new Map(workoutTemplates.map((wt) => [String(wt._id), wt]));

	const enriched: EnrichedTrainingPlan[] = trainingPlans.map((plan) => {
		const { sourceUrl, ...planWithoutSource } = plan;

		return {
			_id: String(plan._id),
			name: plan.name,
			sport: plan.sport,
			goal: plan.goal,
			level: plan.level,
			details: plan.details,
			planType: plan.planType,
			description: plan.description,
			durationWeeks: plan.durationWeeks,
			tags: plan.tags,
			createdAt: plan.createdAt,
			updatedAt: plan.updatedAt,
			weeks: plan.weeks?.map((week: TrainingPlanWeek) => ({
				...week,
				days: week.days.map((day: TrainingPlanDay) => {
					const wt = workoutTemplateMap.get(String(day.workoutTemplateId));
					return {
						...day,
						workoutDetails: wt
							? {
								...wt,
								structure: wt.structure?.map((st: WorkoutExerciseStructure) => ({
									...st,
									exercise: exerciseMap.get(String(st.exerciseId)) || null,
								})),
							}
							: null,
					};
				}),
			})) || [],
		};
	});

	return enriched;
}