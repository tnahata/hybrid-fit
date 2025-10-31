import { WorkoutTemplate, WorkoutTemplateDoc, WorkoutExerciseStructure } from "@/models/Workouts";
import { Exercise, ExerciseDoc } from "@/models/Exercise";
import { TrainingPlan, TrainingPlanDoc, TrainingPlanWeek, TrainingPlanDay } from "@/models/TrainingPlans";
import { UserPlanProgress } from "@/models/User";

export interface WorkoutStructureItem {
	exerciseId: string;
	sets?: number;
	reps?: number;
	duration?: number;
	restSeconds?: number;
	notes?: string;
	exercise: ExerciseDoc | null;
}

export interface EnrichedWorkoutTemplate extends Omit<WorkoutTemplateDoc, 'structure'> {
	structure?: WorkoutStructureItem[];
}

export interface EnrichedTrainingPlanDay extends TrainingPlanDay {
	workoutDetails: EnrichedWorkoutTemplate | null;
}

export interface EnrichedTrainingPlanWeek extends Omit<TrainingPlanWeek, 'days'> {
	days: EnrichedTrainingPlanDay[];
}

export interface EnrichedTrainingPlanDoc extends Omit<TrainingPlanDoc, 'weeks' | 'sourceUrl'> {
	weeks: EnrichedTrainingPlanWeek[];
}

export interface EnrichedUserPlanProgress extends Omit<UserPlanProgress, 'weeks' | 'sourceUrl'> {
	weeks: EnrichedTrainingPlanWeek[];
}

export async function enrichTrainingPlans(
	planIds: string[]
): Promise<EnrichedTrainingPlanDoc[]> {

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

	const enriched: EnrichedTrainingPlanDoc[] = trainingPlans.map((plan) => {
		const { sourceUrl, ...planWithoutSource } = plan;

		return {
			...planWithoutSource,
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