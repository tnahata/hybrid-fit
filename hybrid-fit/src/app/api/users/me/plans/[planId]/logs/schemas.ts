import { z } from 'zod';

const WorkoutMetricsSchema = z.object({

	durationMinutes: z.number().min(0).max(1440).optional(),
	perceivedEffort: z.number().min(1).max(10).optional(),
	activityType: z.string().optional(),
	sport: z.string().optional(),

	distance: z.object({
		value: z.number().positive(),
		unit: z.enum(["miles", "kilometers"]),
	}).optional(),
	pace: z.object({
		average: z.number().positive(),
		unit: z.enum(["min/mile", "min/km"]),
	}).optional(),

	strengthSession: z.object({
		exercises: z.array(
			z.object({
				exerciseId: z.string(),
				exerciseName: z.string(),
				sets: z.array(
					z.object({
						setNumber: z.number().int().positive(),
						reps: z.number().int().min(0),
						weight: z.number().min(0),
						completed: z.boolean(),
					})
				),
			})
		),
		totalVolume: z.number().min(0),
		volumeUnit: z.enum(["kgs", "lbs"]),
	}).optional(),

	drillSession: z.object({
		activities: z.array(
			z.object({
				exerciseId: z.string(),
				name: z.string(),
				durationMinutes: z.number().min(0).optional(),
				repetitions: z.number().int().min(0).optional(),
				sets: z.number().int().positive().optional(),
				notes: z.string().optional(),
				completed: z.boolean(),
				qualityRating: z.number().int().min(1).max(5)
			})
		),
		customMetrics: z.record(z.union([z.number(), z.string()])).optional(),
	}).optional(),

	heartRate: z.object({
		average: z.number().min(0).max(300),
	}).optional(),
});

export const WorkoutLogSchema = WorkoutMetricsSchema.extend({
	date: z.string().datetime().or(z.coerce.date()),
	workoutTemplateId: z.string().min(1, "workoutTemplateId is required"),
	status: z.enum(["completed", "skipped"], {
		errorMap: () => ({ message: "Status must be 'completed' or 'skipped'" }),
	}),
	notes: z.string().optional(),
});

export type WorkoutLogInput = z.infer<typeof WorkoutLogSchema>;