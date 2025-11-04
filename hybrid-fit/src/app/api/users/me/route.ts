import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import { User, UserDoc, WorkoutLog } from "@/models/User";
import { getStartOfDay, getDaysSince } from "@/lib/dateUtils";
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