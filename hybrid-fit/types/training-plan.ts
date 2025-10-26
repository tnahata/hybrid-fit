import { TrainingPlanDoc } from "@/models/TrainingPlans";
import { WorkoutTemplateDoc } from "@/models/Workouts";
import { ExerciseDoc } from "@/models/Exercise";

// Exercise structure with full exercise details
export interface WorkoutExerciseWithDetails {
	exerciseId: string;
	sets?: number;
	reps?: number;
	durationMins?: number;
	durationSecs?: number;
	restSeconds?: number;
	notes?: string;
	exercise: ExerciseDoc | null;
}

export interface WorkoutTemplateWithExercises extends Omit<WorkoutTemplateDoc, 'structure'> {
	structure?: WorkoutExerciseWithDetails[];
}

export interface TrainingPlanDayWithWorkout {
	dayOfWeek: string;
	workoutTemplateId: string;
	workoutTemplate: WorkoutTemplateWithExercises | null;
}

export interface TrainingPlanWeekWithWorkouts {
	weekNumber: number;
	days: TrainingPlanDayWithWorkout[];
}

export interface TrainingPlanWithWorkouts extends Omit<TrainingPlanDoc, 'weeks'> {
	weeks: TrainingPlanWeekWithWorkouts[];
}

export interface TrainingPlanDetailResponse {
	data: TrainingPlanWithWorkouts;
	meta: {
		totalWeeks: number;
		totalWorkoutTemplates: number;
		totalExercises: number;
	};
}