import { ExerciseDoc } from "@/models/Exercise";
import { WorkoutTemplateDoc } from "@/models/Workouts";
import { TrainingPlanDay, TrainingPlanWeek } from "@/models/TrainingPlans";
import { WorkoutOverride, WorkoutLog } from "@/models/User";

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

export interface EnrichedTrainingPlan {
	_id: string;
	name: string;
	sport: string;
	details: {
		goal: string;
		planType: string;
	};
	goal: string;
	level: string;
	planType: string;
	description: string;
	durationWeeks: number;
	tags: string[];
	weeks: EnrichedTrainingPlanWeek[];
	createdAt?: Date;
	updatedAt?: Date;
}

export interface EnrichedUserPlanProgress extends EnrichedTrainingPlan {
	startedAt: Date;
	completedAt?: Date;
	currentWeek: number;
	currentDayIndex: number;
	isActive: boolean;
	overrides: WorkoutOverride[];
	progressLog: WorkoutLog[];
	totalActiveMinutes: number;
	averageWorkoutDuration: number;
	totalDistanceMiles: number;
	totalWeightLifted: number;
}

export interface EnrichedUserDoc {
	_id: string;
	email: string;
	name?: string;
	totalWorkoutsCompleted: number;
	currentStreak: number;
	longestStreak: number;
	lastProgressUpdateDate?: Date;
	trainingPlans: EnrichedUserPlanProgress[];
	createdAt?: Date;
	updatedAt?: Date;
}

export interface UserApiResponse {
	data: EnrichedUserDoc;
	success: boolean;
}