import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { enrichTrainingPlans } from '../enrichTrainingPlans';
import { connectTestDatabase, disconnectTestDatabase, clearDatabase } from '@/test-utils/db';
import { TrainingPlan } from '@/models/TrainingPlans';
import { WorkoutTemplate } from '@/models/Workouts';
import { Exercise } from '@/models/Exercise';
import { Types } from 'mongoose';

describe('enrichTrainingPlans', () => {
	beforeAll(async () => {
		await connectTestDatabase();
	});

	beforeEach(async () => {
		await clearDatabase();
	});

	afterAll(async () => {
		await disconnectTestDatabase();
	});

	it('should enrich training plans with valid plan IDs', async () => {
		// Create exercise
		const exerciseId = new Types.ObjectId().toString();
		await Exercise.create({
			_id: exerciseId,
			name: 'Push Up',
			type: 'strength',
			category: 'upper body',
			sport: 'general',
			focus: ['chest'],
			difficulty: 'beginner',
			equipment: [],
			description: 'A basic push up',
			instructions: 'Do push ups',
			durationMinutes: null,
			tags: [],
			sourceUrl: '',
			details: {},
		});

		// Create workout template
		const workoutTemplateId = new Types.ObjectId().toString();
		await WorkoutTemplate.create({
			_id: workoutTemplateId,
			name: 'Upper Body Workout',
			sport: 'general',
			category: 'strength',
			description: 'A great upper body workout',
			metrics: {},
			difficulty: 'beginner',
			tags: [],
			structure: [
				{
					exerciseId,
					sets: 3,
					reps: 10,
				},
			],
		});

		// Create training plan
		const planId = new Types.ObjectId().toString();
		await TrainingPlan.create({
			_id: planId,
			name: 'Test Plan',
			sport: 'general',
			category: 'strength',
			durationWeeks: 4,
			level: 'beginner',
			details: {
				goal: 'strength',
				planType: 'progressive',
			},
			weeks: [
				{
					weekNumber: 1,
					days: [
						{
							dayOfWeek: 'Mon',
							workoutTemplateId,
						},
					],
				},
			],
		});

		const result = await enrichTrainingPlans([planId]);

		expect(result).toHaveLength(1);
		expect(result[0]._id).toBe(planId);
		expect(result[0].name).toBe('Test Plan');
		expect(result[0].weeks).toHaveLength(1);
		expect(result[0].weeks[0].days).toHaveLength(1);
		expect(result[0].weeks[0].days[0].workoutDetails).not.toBeNull();
		expect(result[0].weeks[0].days[0].workoutDetails?.name).toBe('Upper Body Workout');
		expect(result[0].weeks[0].days[0].workoutDetails?.structure).toHaveLength(1);
		expect(result[0].weeks[0].days[0].workoutDetails?.structure?.[0].exercise).not.toBeNull();
		expect(result[0].weeks[0].days[0].workoutDetails?.structure?.[0].exercise?.name).toBe(
			'Push Up'
		);
	});

	it('should return empty array when given empty plan IDs array', async () => {
		const result = await enrichTrainingPlans([]);

		expect(result).toHaveLength(0);
		expect(result).toEqual([]);
	});

	it('should handle invalid plan IDs gracefully', async () => {
		const invalidPlanId = new Types.ObjectId().toString();

		const result = await enrichTrainingPlans([invalidPlanId]);

		expect(result).toHaveLength(0);
		expect(result).toEqual([]);
	});

	it('should handle training plans with missing workout templates', async () => {
		const planId = new Types.ObjectId().toString();
		const nonExistentWorkoutId = new Types.ObjectId().toString();

		await TrainingPlan.create({
			_id: planId,
			name: 'Test Plan',
			sport: 'general',
			category: 'strength',
			durationWeeks: 4,
			level: 'beginner',
			details: {
				goal: 'strength',
				planType: 'progressive',
			},
			weeks: [
				{
					weekNumber: 1,
					days: [
						{
							dayOfWeek: 'Mon',
							workoutTemplateId: nonExistentWorkoutId,
						},
					],
				},
			],
		});

		const result = await enrichTrainingPlans([planId]);

		expect(result).toHaveLength(1);
		expect(result[0].weeks[0].days[0].workoutDetails).toBeNull();
	});

	it('should handle training plans with multiple weeks and days', async () => {
		const exerciseId = new Types.ObjectId().toString();
		await Exercise.create({
			_id: exerciseId,
			name: 'Squat',
			type: 'strength',
			category: 'lower body',
			sport: 'general',
			focus: ['legs'],
			difficulty: 'beginner',
			equipment: [],
			description: 'A basic squat',
			instructions: 'Do squats',
			durationMinutes: null,
			tags: [],
			sourceUrl: '',
			details: {},
		});

		const workoutTemplateId1 = new Types.ObjectId().toString();
		const workoutTemplateId2 = new Types.ObjectId().toString();

		await WorkoutTemplate.create([
			{
				_id: workoutTemplateId1,
				name: 'Workout 1',
				sport: 'general',
				category: 'strength',
				description: 'First workout',
				metrics: {},
				difficulty: 'beginner',
				tags: [],
				structure: [{ exerciseId }],
			},
			{
				_id: workoutTemplateId2,
				name: 'Workout 2',
				sport: 'general',
				category: 'strength',
				description: 'Second workout',
				metrics: {},
				difficulty: 'beginner',
				tags: [],
				structure: [{ exerciseId }],
			},
		]);

		const planId = new Types.ObjectId().toString();
		await TrainingPlan.create({
			_id: planId,
			name: 'Multi Week Plan',
			sport: 'general',
			category: 'strength',
			durationWeeks: 2,
			level: 'beginner',
			details: {
				goal: 'strength',
				planType: 'progressive',
			},
			weeks: [
				{
					weekNumber: 1,
					days: [
						{
							dayOfWeek: 'Mon',
							workoutTemplateId: workoutTemplateId1,
						},
					],
				},
				{
					weekNumber: 2,
					days: [
						{
							dayOfWeek: 'Mon',
							workoutTemplateId: workoutTemplateId2,
						},
					],
				},
			],
		});

		const result = await enrichTrainingPlans([planId]);

		expect(result).toHaveLength(1);
		expect(result[0].weeks).toHaveLength(2);
		expect(result[0].weeks[0].days[0].workoutDetails?.name).toBe('Workout 1');
		expect(result[0].weeks[1].days[0].workoutDetails?.name).toBe('Workout 2');
	});

	it('should exclude sourceUrl from training plan', async () => {
		const planId = new Types.ObjectId().toString();
		await TrainingPlan.create({
			_id: planId,
			name: 'Test Plan',
			sport: 'general',
			category: 'strength',
			durationWeeks: 4,
			level: 'beginner',
			sourceUrl: 'https://example.com',
			details: {
				goal: 'strength',
				planType: 'progressive',
			},
			weeks: [],
		});

		const result = await enrichTrainingPlans([planId]);

		expect(result).toHaveLength(1);
		expect(result[0]).not.toHaveProperty('sourceUrl');
	});

	it('should handle training plans with no weeks', async () => {
		const planId = new Types.ObjectId().toString();
		await TrainingPlan.create({
			_id: planId,
			name: 'Empty Plan',
			sport: 'general',
			category: 'strength',
			durationWeeks: 4,
			level: 'beginner',
			details: {
				goal: 'strength',
				planType: 'progressive',
			},
			weeks: [],
		});

		const result = await enrichTrainingPlans([planId]);

		expect(result).toHaveLength(1);
		expect(result[0].weeks).toEqual([]);
	});
});

