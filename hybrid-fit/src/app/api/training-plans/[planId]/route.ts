import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { TrainingPlan, TrainingPlanWeek } from "@/models/TrainingPlans";
import { WorkoutTemplate } from "@/models/Workouts";
import { Exercise } from "@/models/Exercise";
import { WorkoutExerciseWithDetails } from "../../../../../types/training-plan";

export async function GET(
	request: NextRequest,
	{ params }: { params: { planId: string } }
) {
	try {
		const { planId } = await params;

		if (!planId) {
			return NextResponse.json(
				{
					error: "Training plan ID is required",
					success: false
				},
				{ status: 400 }
			);
		}

		await connectToDatabase();

		const trainingPlan = await TrainingPlan.findById(planId).lean();

		if (!trainingPlan) {
			return NextResponse.json(
				{
					error: "Training plan not found",
					success: false
				},
				{ status: 404 }
			);
		}

		const workoutTemplateIds = new Set<string>();
		trainingPlan.weeks.forEach((week: TrainingPlanWeek) => {
			week.days.forEach((day) => {
				if (day.workoutTemplateId) {
					workoutTemplateIds.add(day.workoutTemplateId);
				}
			});
		});

		const workoutTemplates = await WorkoutTemplate.find({
			_id: { $in: Array.from(workoutTemplateIds) },
		}).lean();

		const exerciseIds = new Set<string>();
		workoutTemplates.forEach((template) => {
			template.structure?.forEach((exercise: WorkoutExerciseWithDetails) => {
				if (exercise.exerciseId) {
					exerciseIds.add(exercise.exerciseId);
				}
			});
		});

		const exercises = await Exercise.find({
			_id: { $in: Array.from(exerciseIds) },
		}).lean();

		const exerciseMap = new Map(exercises.map((ex) => [ex._id, ex]));
		const workoutTemplateMap = new Map(
			workoutTemplates.map((wt) => [wt._id, wt])
		);

		const completeTrainingPlan = {
			...trainingPlan,
			weeks: trainingPlan.weeks.map((week: TrainingPlanWeek) => ({
				...week,
				days: week.days.map((day) => {
					const workoutTemplate = workoutTemplateMap.get(day.workoutTemplateId);

					return {
						...day,
						workoutTemplate: workoutTemplate
							? {
								...workoutTemplate,
								structure: workoutTemplate.structure?.map((exerciseStructure: WorkoutExerciseWithDetails) => ({
									...exerciseStructure,
									exercise: exerciseMap.get(exerciseStructure.exerciseId) || null,
								})),
							}
							: null,
					};
				}),
			})),
		};

		return NextResponse.json(
			{
				data: completeTrainingPlan,
				meta: {
					totalWeeks: trainingPlan.weeks.length,
					totalWorkouts: workoutTemplates.length,
					totalExercises: exercises.length,
				},
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error fetching training plan details:", error);
		return NextResponse.json(
			{ error: "Failed to fetch training plan details" },
			{ status: 500 }
		);
	}
}