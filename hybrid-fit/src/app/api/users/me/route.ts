import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import { User, UserDoc, WorkoutLog } from "@/models/User";
import { TrainingPlan, TrainingPlanDoc, TrainingPlanWeek } from "@/models/TrainingPlans";
import { getStartOfDay, getDaysSince, isSameDay, addDays } from "@/lib/dateUtils";
import { enrichTrainingPlans } from "@/lib/enrichTrainingPlans";
import {
	EnrichedUserPlanProgress,
	UserApiResponse
} from "../../../../../types/enrichedTypes";

const calculateTotalActiveMinutes = (progressLogs: WorkoutLog[]): number => {
	return progressLogs.reduce((total, log) => {
		if (log.status === 'completed' && log.durationMinutes) {
			return total + log.durationMinutes;
		}
		return total;
	}, 0);
};

const calculateAverageWorkoutDuration = (progressLogs: WorkoutLog[]): number => {
	const completedWorkouts = progressLogs.filter(log => log.status === 'completed' && log.durationMinutes);
	if (completedWorkouts.length === 0) return 0;

	const totalMinutes = completedWorkouts.reduce((sum, log) => sum + (log.durationMinutes || 0), 0);
	return Math.round(totalMinutes / completedWorkouts.length);
};

const calculateTotalDistanceMiles = (progressLogs: WorkoutLog[]): number => {
	return progressLogs.reduce((total, log) => {
		if (log.status === 'completed' && log.distance) {
			const miles = log.distance.unit === 'kilometers'
				? log.distance.value * 0.621371
				: log.distance.value;
			return total + miles;
		}
		return total;
	}, 0);
};

const calculateTotalWeightLifted = (progressLogs: WorkoutLog[]): number => {
	return progressLogs.reduce((total, log) => {
		if (log.status === 'completed' && log.strengthSession) {
			return total + (log.strengthSession.totalVolume || 0);
		}
		return total;
	}, 0);
};

async function updateUserProgressIfNeeded(user: UserDoc): Promise<boolean> {
	const today = getStartOfDay();

	const lastUpdate = user.lastProgressUpdateDate
		? getStartOfDay(user.lastProgressUpdateDate)
		: null;

	if (lastUpdate && lastUpdate.getTime() >= today.getTime()) {
		return false;
	}

	for (const trainingPlan of user.trainingPlans) {
		if (!trainingPlan.isActive) continue;

		const daysSinceStart = getDaysSince(trainingPlan.startedAt);

		if (daysSinceStart >= 0) {
			const newWeekIndex = Math.floor(daysSinceStart / 7) + 1;
			const newDayIndex = daysSinceStart % 7;

			if (
				trainingPlan.currentWeek !== newWeekIndex ||
				trainingPlan.currentDayIndex !== newDayIndex
			) {
				trainingPlan.currentWeek = newWeekIndex;
				trainingPlan.currentDayIndex = newDayIndex;
			}
		}
	}

	user.lastProgressUpdateDate = new Date();
	await user.save();
	return true;
}

async function fillMissingWorkoutLogs(user: UserDoc): Promise<void> {
	const today = getStartOfDay();
	let hasChanges = false;

	for (const trainingPlan of user.trainingPlans) {
		if (!trainingPlan.isActive || trainingPlan.completedAt) {
			continue;
		}

		const planDoc: TrainingPlanDoc | null = await TrainingPlan.findById(trainingPlan.planId);
		if (!planDoc) {
			continue;
		}

		// Calculate how many days to check (up to current week/day)
		const currentWeek = trainingPlan.currentWeek;
		const currentDayIndex = trainingPlan.currentDayIndex;

		// Iterate through each week up to current week
		for (let weekNum = 1; weekNum <= currentWeek; weekNum++) {
			const week = planDoc.weeks?.find((w: TrainingPlanWeek) => w.weekNumber === weekNum);
			if (!week) {
				continue;
			}

			const daysToCheck = weekNum === currentWeek
				? currentDayIndex  // Only check up to current day (not including current day)
				: week.days.length; // Check all days for past weeks

			for (let dayIdx = 0; dayIdx < daysToCheck; dayIdx++) {
				const day = week.days[dayIdx];
				if (!day) {
					continue;
				}

				// Calculate the expected date for this workout
				const daysFromStart = (weekNum - 1) * 7 + dayIdx;
				const expectedDate = addDays(trainingPlan.startedAt, daysFromStart);

				// Don't process today or future dates
				if (expectedDate >= today) continue;

				// Check for overrides
				const daysOfWeekMap = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
				const dayOfWeek = daysOfWeekMap[dayIdx];
				const override = trainingPlan.overrides.find(
					o => o.weekNumber === weekNum && o.dayOfWeek === dayOfWeek
				);

				// Get the workout template ID (use override if exists)
				const workoutTemplateId = override?.customWorkoutId || day.workoutTemplateId;

				const logExists = trainingPlan.progressLog.some(log =>
					isSameDay(getStartOfDay(new Date(log.date)), getStartOfDay(expectedDate)) &&
					log.workoutTemplateId === workoutTemplateId
				);

				if (!logExists) {
					const isRestDay = workoutTemplateId.toLowerCase().includes('rest');

					const newLog: WorkoutLog = {
						date: expectedDate,
						workoutTemplateId: workoutTemplateId,
						status: isRestDay ? 'completed' : 'missed',
						notes: isRestDay ? 'Rest day' : 'Workout marked as missed'
					};

					trainingPlan.progressLog.push(newLog);
					hasChanges = true;
				}
			}
		}
	}

	if (hasChanges) {
		await user.save();
		console.log(`Filled missing workout logs for user: ${user.email}`);
	}
}

export async function GET(): Promise<NextResponse> {
	try {
		const session = await getServerSession(authOptions);

		if (!session || !session.user) {
			return NextResponse.json(
				{ error: "Unauthorized", success: false },
				{ status: 401 }
			);
		}

		await connectToDatabase();

		const user: UserDoc | null = await User.findById(session.user.id);
		if (!user) {
			return NextResponse.json(
				{ error: "User not found", success: false },
				{ status: 404 }
			);
		}

		if (!user.trainingPlans || user.trainingPlans.length === 0) {
			const response: UserApiResponse = {
				data: {
					_id: String(user._id),
					email: user.email,
					name: user.name,
					totalWorkoutsCompleted: user.totalWorkoutsCompleted,
					currentStreak: user.currentStreak,
					longestStreak: user.longestStreak,
					lastProgressUpdateDate: user.lastProgressUpdateDate,
					trainingPlans: [],
					createdAt: user.createdAt,
					updatedAt: user.updatedAt
				},
				success: true
			};

			return NextResponse.json(response);
		}

		await updateUserProgressIfNeeded(user);

		await fillMissingWorkoutLogs(user);

		const planIds = user.trainingPlans.map(tp => tp.planId);
		const enrichedPlans = await enrichTrainingPlans(planIds);

		const enrichedPlanMap = new Map(
			enrichedPlans.map(plan => [String(plan._id), plan])
		);

		const mergedPlans: EnrichedUserPlanProgress[] = user.trainingPlans.map(userPlan => {
			const enrichedPlan = enrichedPlanMap.get(userPlan.planId);

			if (!enrichedPlan) {
				console.error(`Enriched plan not found for planId: ${userPlan.planId}`);
				return null as unknown as EnrichedUserPlanProgress;
			}

			return {
				...enrichedPlan,
				startedAt: userPlan.startedAt,
				completedAt: userPlan.completedAt,
				currentWeek: userPlan.currentWeek,
				currentDayIndex: userPlan.currentDayIndex,
				isActive: userPlan.isActive,
				overrides: userPlan.overrides,
				progressLog: userPlan.progressLog,
				totalActiveMinutes: calculateTotalActiveMinutes(userPlan.progressLog),
				averageWorkoutDuration: calculateAverageWorkoutDuration(userPlan.progressLog),
				totalDistanceMiles: calculateTotalDistanceMiles(userPlan.progressLog),
				totalWeightLifted: calculateTotalWeightLifted(userPlan.progressLog)
			};
		}).filter((plan): plan is EnrichedUserPlanProgress => plan !== null);

		const response: UserApiResponse = {
			data: {
				_id: String(user._id),
				email: user.email,
				name: user.name,
				totalWorkoutsCompleted: user.totalWorkoutsCompleted,
				currentStreak: user.currentStreak,
				longestStreak: user.longestStreak,
				lastProgressUpdateDate: user.lastProgressUpdateDate,
				trainingPlans: mergedPlans,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt
			},
			success: true
		};

		return NextResponse.json(response);

	} catch (error: unknown) {
		const errorMessage: string = error instanceof Error ? error.message : "Internal server error";

		return NextResponse.json(
			{ error: errorMessage, success: false },
			{ status: 500 }
		);
	}
}