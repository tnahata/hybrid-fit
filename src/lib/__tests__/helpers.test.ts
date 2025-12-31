import { describe, it, expect, beforeEach } from 'vitest';
import { recalculateStreak } from '../helpers';
import { UserDoc, WorkoutLog } from '@/models/User';
import { getStartOfDay, addDays } from '../dateUtils';

// Mock UserDoc for testing
function createMockUserDoc(progressLog: WorkoutLog[]): UserDoc {
	return {
		trainingPlans: [
			{
				planId: 'test-plan-id',
				startedAt: new Date(),
				currentWeek: 1,
				currentDayIndex: 0,
				isActive: true,
				overrides: [],
				progressLog,
			},
		],
		totalWorkoutsCompleted: 0,
		currentStreak: 0,
		longestStreak: 0,
		lastWorkoutDate: undefined,
	} as unknown as UserDoc;
}

describe('helpers', () => {
	describe('recalculateStreak', () => {
		it('should set streak to 0 when there are no completed workouts', () => {
			const user = createMockUserDoc([]);

			recalculateStreak(user, 0);

			expect(user.currentStreak).toBe(0);
			expect(user.longestStreak).toBe(0);
			expect(user.lastWorkoutDate).toBeUndefined();
		});

		it('should calculate streak for a single completed workout', () => {
			const today = getStartOfDay();
			const user = createMockUserDoc([
				{
					date: today,
					workoutTemplateId: 'workout-1',
					status: 'completed',
				},
			]);

			recalculateStreak(user, 0);

			expect(user.currentStreak).toBe(1);
			expect(user.longestStreak).toBe(1);
			expect(user.lastWorkoutDate).toEqual(today);
		});

		it('should calculate current streak for consecutive workouts', () => {
			const today = getStartOfDay();
			const yesterday = addDays(today, -1);
			const twoDaysAgo = addDays(today, -2);

			const user = createMockUserDoc([
				{
					date: twoDaysAgo,
					workoutTemplateId: 'workout-1',
					status: 'completed',
				},
				{
					date: yesterday,
					workoutTemplateId: 'workout-2',
					status: 'completed',
				},
				{
					date: today,
					workoutTemplateId: 'workout-3',
					status: 'completed',
				},
			]);

			recalculateStreak(user, 0);

			expect(user.currentStreak).toBe(3);
			expect(user.longestStreak).toBe(3);
			expect(user.lastWorkoutDate).toEqual(today);
		});

		it('should break current streak when last workout was more than 1 day ago', () => {
			const today = getStartOfDay();
			const threeDaysAgo = addDays(today, -3);
			const fourDaysAgo = addDays(today, -4);

			const user = createMockUserDoc([
				{
					date: fourDaysAgo,
					workoutTemplateId: 'workout-1',
					status: 'completed',
				},
				{
					date: threeDaysAgo,
					workoutTemplateId: 'workout-2',
					status: 'completed',
				},
			]);

			recalculateStreak(user, 0);

			expect(user.currentStreak).toBe(0);
			expect(user.longestStreak).toBe(2);
			expect(user.lastWorkoutDate).toEqual(threeDaysAgo);
		});

		it('should calculate longest streak correctly with breaks', () => {
			const today = getStartOfDay();
			const day1 = addDays(today, -10);
			const day2 = addDays(today, -9);
			const day3 = addDays(today, -8);
			const day5 = addDays(today, -6);
			const day6 = addDays(today, -5);
			const day7 = addDays(today, -4);

			const user = createMockUserDoc([
				{
					date: day1,
					workoutTemplateId: 'workout-1',
					status: 'completed',
				},
				{
					date: day2,
					workoutTemplateId: 'workout-2',
					status: 'completed',
				},
				{
					date: day3,
					workoutTemplateId: 'workout-3',
					status: 'completed',
				},
				// Gap of 1 day
				{
					date: day5,
					workoutTemplateId: 'workout-4',
					status: 'completed',
				},
				{
					date: day6,
					workoutTemplateId: 'workout-5',
					status: 'completed',
				},
				{
					date: day7,
					workoutTemplateId: 'workout-6',
					status: 'completed',
				},
			]);

			recalculateStreak(user, 0);

			// Longest streak should be 3 (day1-day3 or day5-day7)
			expect(user.longestStreak).toBe(3);
			// Current streak should be 0 (last workout was 4 days ago)
			expect(user.currentStreak).toBe(0);
		});

		it('should ignore non-completed workouts', () => {
			const today = getStartOfDay();
			const yesterday = addDays(today, -1);

			const user = createMockUserDoc([
				{
					date: yesterday,
					workoutTemplateId: 'workout-1',
					status: 'skipped',
				},
				{
					date: today,
					workoutTemplateId: 'workout-2',
					status: 'completed',
				},
			]);

			recalculateStreak(user, 0);

			expect(user.currentStreak).toBe(1);
			expect(user.longestStreak).toBe(1);
		});

		it('should handle workouts completed yesterday correctly', () => {
			const today = getStartOfDay();
			const yesterday = addDays(today, -1);

			const user = createMockUserDoc([
				{
					date: yesterday,
					workoutTemplateId: 'workout-1',
					status: 'completed',
				},
			]);

			recalculateStreak(user, 0);

			// Should still count as current streak (within 1 day)
			expect(user.currentStreak).toBe(1);
			expect(user.longestStreak).toBe(1);
		});
	});
});

