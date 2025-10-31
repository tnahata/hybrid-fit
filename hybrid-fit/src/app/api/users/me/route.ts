import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import { User, UserDoc, WorkoutOverride, WorkoutLog } from "@/models/User";
import { getStartOfDay, getDaysSince } from "@/lib/dateUtils";
import { enrichTrainingPlans, EnrichedTrainingPlanDoc } from "@/lib/enrichTrainingPlans";

export interface EnrichedUserPlanProgress extends EnrichedTrainingPlanDoc {
	startedAt: Date;
	completedAt?: Date;
	currentWeek: number;
	currentDayIndex: number;
	isActive: boolean;
	overrides: WorkoutOverride[];
	progressLog: WorkoutLog[];
}

export interface EnrichedUserDoc extends Omit<UserDoc, 'trainingPlans'> {
	trainingPlans: EnrichedUserPlanProgress[];
}

export interface UserApiResponse {
	data: EnrichedUserDoc
	success: boolean;
}

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

export async function GET(req: Request): Promise<NextResponse> {
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
					...user.toObject(),
					trainingPlans: []
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
				return [] as unknown as EnrichedUserPlanProgress;
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
			};
		}).filter((plan): plan is EnrichedUserPlanProgress => plan !== null);

		const response: UserApiResponse = {
			data: {
				...user.toObject(),
				trainingPlans: mergedPlans
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