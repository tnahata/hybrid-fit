import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	ApiError,
	updatePlanOverrides,
	logWorkout,
	updateWorkout,
	getUserProfile,
} from '../api-client';
import { WorkoutLog, WorkoutOverride, DayOfWeek } from '@/models/User';
import { EnrichedUserDoc } from 'types/enrichedTypes';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('api-client', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('ApiError', () => {
		it('should create ApiError with status and message', () => {
			const error = new ApiError(404, 'Not found');

			expect(error).toBeInstanceOf(Error);
			expect(error).toBeInstanceOf(ApiError);
			expect(error.status).toBe(404);
			expect(error.message).toBe('Not found');
			expect(error.name).toBe('ApiError');
		});
	});

	describe('updatePlanOverrides', () => {
		it('should update plan overrides successfully', async () => {
			const mockOverrides: WorkoutOverride[] = [
				{
					weekNumber: 1,
					dayOfWeek: DayOfWeek.MON,
					customWorkoutId: 'workout-123',
				},
			];

			const mockResponse = {
				planId: 'plan-123',
				overrides: mockOverrides,
			};

			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({ data: mockResponse }),
			});

			const result = await updatePlanOverrides('plan-123', mockOverrides);

			expect(result).toEqual(mockResponse);
			expect(mockFetch).toHaveBeenCalledTimes(1);
			expect(mockFetch).toHaveBeenCalledWith('/api/users/me/plans/plan-123/overrides', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ overrides: mockOverrides }),
			});
		});

		it('should throw ApiError when response is not ok', async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				status: 400,
				json: async () => ({ error: 'Invalid request' }),
			});

			await expect(
				updatePlanOverrides('plan-123', [])
			).rejects.toThrow(ApiError);

			await expect(updatePlanOverrides('plan-123', [])).rejects.toMatchObject({
				status: 400,
				message: 'Invalid request',
			});
		});

		it('should throw ApiError with default message when error message is missing', async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				status: 500,
				json: async () => ({}),
			});

			await expect(updatePlanOverrides('plan-123', [])).rejects.toMatchObject({
				status: 500,
				message: 'Failed to update overrides',
			});
		});
	});

	describe('logWorkout', () => {
		it('should log workout successfully', async () => {
			const mockWorkoutData: WorkoutLog = {
				date: new Date(),
				workoutTemplateId: 'workout-123',
				status: 'completed',
				notes: 'Great workout',
			};

			const mockResponse = {
				planId: 'plan-123',
				workoutLog: mockWorkoutData,
				userStats: {
					totalWorkoutsCompleted: 10,
					currentStreak: 5,
					longestStreak: 10,
				},
			};

			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({ data: mockResponse }),
			});

			const result = await logWorkout('plan-123', mockWorkoutData);

			expect(result).toEqual(mockResponse);
			expect(mockFetch).toHaveBeenCalledTimes(1);
			expect(mockFetch).toHaveBeenCalledWith('/api/users/me/plans/plan-123/logs', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(mockWorkoutData),
			});
		});

		it('should throw ApiError when response is not ok', async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				status: 400,
				json: async () => ({ error: 'Invalid workout data' }),
			});

			const mockWorkoutData: WorkoutLog = {
				date: new Date(),
				workoutTemplateId: 'workout-123',
				status: 'completed',
			};

			await expect(logWorkout('plan-123', mockWorkoutData)).rejects.toMatchObject({
				status: 400,
				message: 'Invalid workout data',
			});
		});
	});

	describe('updateWorkout', () => {
		it('should update workout successfully', async () => {
			const mockWorkoutData: WorkoutLog = {
				date: new Date(),
				workoutTemplateId: 'workout-123',
				status: 'completed',
				notes: 'Updated notes',
			};

			const mockResponse = {
				planId: 'plan-123',
				workoutLog: mockWorkoutData,
			};

			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({ data: mockResponse }),
			});

			const result = await updateWorkout('log-123', 'plan-123', mockWorkoutData);

			expect(result).toEqual(mockResponse);
			expect(mockFetch).toHaveBeenCalledTimes(1);
			expect(mockFetch).toHaveBeenCalledWith(
				'/api/users/me/plans/plan-123/logs/log-123',
				{
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(mockWorkoutData),
				}
			);
		});

		it('should throw ApiError with details when response is not ok', async () => {
			const mockErrorDetails = { field: 'status', message: 'Invalid status' };

			mockFetch.mockResolvedValue({
				ok: false,
				status: 400,
				json: async () => ({ details: mockErrorDetails }),
			});

			const mockWorkoutData: WorkoutLog = {
				date: new Date(),
				workoutTemplateId: 'workout-123',
				status: 'completed',
			};

			await expect(updateWorkout('log-123', 'plan-123', mockWorkoutData)).rejects.toMatchObject(
				{
					status: 400,
					message: JSON.stringify(mockErrorDetails),
				}
			);
		});

		it('should throw ApiError with default message when details are missing', async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				status: 500,
				json: async () => ({}),
			});

			const mockWorkoutData: WorkoutLog = {
				date: new Date(),
				workoutTemplateId: 'workout-123',
				status: 'completed',
			};

			await expect(updateWorkout('log-123', 'plan-123', mockWorkoutData)).rejects.toMatchObject(
				{
					status: 500,
					message: 'Failed to log workout',
				}
			);
		});
	});

	describe('getUserProfile', () => {
		it('should fetch user profile successfully', async () => {
			const mockUserProfile: EnrichedUserDoc = {
				_id: 'user-123',
				email: 'test@example.com',
				name: 'Test User',
				totalWorkoutsCompleted: 10,
				currentStreak: 5,
				longestStreak: 10,
				trainingPlans: [],
			};

			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({ data: mockUserProfile }),
			});

			const result = await getUserProfile();

			expect(result).toEqual(mockUserProfile);
			expect(mockFetch).toHaveBeenCalledTimes(1);
			expect(mockFetch).toHaveBeenCalledWith('/api/users/me', {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			});
		});

		it('should throw ApiError when response is not ok', async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				status: 401,
				json: async () => ({ error: 'Unauthorized' }),
			});

			await expect(getUserProfile()).rejects.toMatchObject({
				status: 401,
				message: 'Unauthorized',
			});
		});

		it('should throw ApiError with default message when error message is missing', async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				status: 500,
				json: async () => ({}),
			});

			await expect(getUserProfile()).rejects.toMatchObject({
				status: 500,
				message: 'Failed to fetch user profile',
			});
		});
	});
});

