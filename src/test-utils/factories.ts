import { Types } from 'mongoose';

interface MockUserOverrides {
	_id?: Types.ObjectId;
	email?: string;
	name?: string;
	password?: string;
	totalWorkoutsCompleted?: number;
	currentStreak?: number;
	longestStreak?: number;
	trainingPlans?: unknown[];
	createdAt?: Date;
	updatedAt?: Date;
}

interface MockExerciseOverrides {
	_id?: Types.ObjectId;
	name?: string;
	category?: string;
	muscleGroups?: string[];
	equipment?: string[];
	instructions?: string[];
}

interface MockTrainingPlanOverrides {
	_id?: Types.ObjectId;
	name?: string;
	description?: string;
	durationWeeks?: number;
	weeks?: Array<{
		weekNumber: number;
		days: Array<{
			dayOfWeek: string;
			workoutTemplateId: string;
		}>;
	}>;
}

interface MockWorkoutLogOverrides {
	_id?: Types.ObjectId;
	date?: Date;
	workoutTemplateId?: string;
	status?: 'completed' | 'skipped' | 'missed';
	notes?: string;
}

/**
 * Factory function to create mock user data for testing
 */
export function createMockUser(overrides?: MockUserOverrides) {
	return {
		_id: new Types.ObjectId(),
		email: 'test@example.com',
		name: 'Test User',
		password: 'hashedpassword',
		totalWorkoutsCompleted: 0,
		currentStreak: 0,
		longestStreak: 0,
		trainingPlans: [],
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	};
}

/**
 * Factory function to create mock exercise data for testing
 */
export function createMockExercise(overrides?: MockExerciseOverrides) {
	return {
		_id: new Types.ObjectId(),
		name: 'Test Exercise',
		category: 'strength',
		muscleGroups: ['chest'],
		equipment: ['barbell'],
		instructions: ['Do this exercise'],
		...overrides,
	};
}

/**
 * Factory function to create mock training plan data for testing
 */
export function createMockTrainingPlan(overrides?: MockTrainingPlanOverrides) {
	return {
		_id: new Types.ObjectId(),
		name: 'Test Training Plan',
		description: 'A test training plan',
		durationWeeks: 4,
		weeks: [
			{
				weekNumber: 1,
				days: [
					{
						dayOfWeek: 'Mon',
						workoutTemplateId: 'workout-1',
					},
				],
			},
		],
		...overrides,
	};
}

/**
 * Factory function to create mock workout log data for testing
 */
export function createMockWorkoutLog(overrides?: MockWorkoutLogOverrides) {
	return {
		_id: new Types.ObjectId(),
		date: new Date(),
		workoutTemplateId: 'workout-1',
		status: 'completed' as const,
		notes: 'Test workout',
		...overrides,
	};
}
