import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User, UserDoc, WorkoutLog } from "@/models/User";
import { recalculateStreak } from "@/lib/helpers";
import { WorkoutLogInput, WorkoutLogSchema } from "./schemas";

export async function POST(
	req: NextRequest,
	{ params }: { params: { planId: string } }
): Promise<NextResponse> {
	try {

		const session = await getServerSession(authOptions);

		if (!session || !session.user) {
			return NextResponse.json(
				{ error: "Unauthorized", success: false },
				{ status: 401 }
			);
		}

		await connectToDatabase();

		const { planId } = await params;

		const userId = session.user.id;

		const rawBody = await req.json();
		const validationResult = WorkoutLogSchema.safeParse(rawBody);

		if (!validationResult.success) {
			return NextResponse.json(
				{
					error: "Validation failed",
					details: validationResult.error.errors.map(err => ({
						field: err.path.join('.'),
						message: err.message,
					})),
					success: false,
				},
				{ status: 400 }
			);
		}

		const body: WorkoutLogInput = validationResult.data;
		const { date, workoutTemplateId, status, notes } = body;

		const user: UserDoc | null = await User.findById(userId);
		if (!user) {
			return NextResponse.json(
				{ error: "User not found", success: false },
				{ status: 404 }
			);
		}

		const planIndex = user.trainingPlans.findIndex(
			(plan) => plan.planId === planId
		);

		if (planIndex === -1) {
			return NextResponse.json(
				{ error: `${user.name} is not enrolled in the training plan ${planId}`, success: false },
				{ status: 404 }
			);
		}

		const workoutLog: WorkoutLog = {
			date: new Date(date),
			workoutTemplateId,
			status,
			notes,
		};

		if (status === "completed") {

			if (body.durationMinutes !== undefined) {
				workoutLog.durationMinutes = body.durationMinutes;
			}
			if (body.perceivedEffort !== undefined) {
				workoutLog.perceivedEffort = body.perceivedEffort;
			}
			if (body.activityType) {
				workoutLog.activityType = body.activityType;
			}
			if (body.sport) {
				workoutLog.sport = body.sport;
			}


			if (body.distance) {
				workoutLog.distance = body.distance;
			}
			if (body.pace) {
				workoutLog.pace = body.pace;
			}

			if (body.strengthSession) {
				workoutLog.strengthSession = body.strengthSession;
			}

			if (body.drillSession) {
				workoutLog.drillSession = body.drillSession;
			}

			if (body.heartRate) {
				workoutLog.heartRate = body.heartRate;
			}

			user.totalWorkoutsCompleted += 1;
		}

		user.trainingPlans[planIndex].progressLog.push(workoutLog);
		recalculateStreak(user, planIndex);

		await user.save();

		return NextResponse.json({
			data: {
				planId,
				workoutLog,
				userStats: {
					totalWorkoutsCompleted: user.totalWorkoutsCompleted,
					currentStreak: user.currentStreak,
					longestStreak: user.longestStreak,
					lastWorkoutDate: user.lastWorkoutDate
				},
			},
			success: true,
		});

	} catch (error: unknown) {
		const errorMessage: string = error instanceof Error ? error.message : "Unknown error occurred";
		console.error("Error logging workout:", errorMessage);
		return NextResponse.json(
			{ error: "Failed to log workout", success: false },
			{ status: 500 }
		);
	}
}