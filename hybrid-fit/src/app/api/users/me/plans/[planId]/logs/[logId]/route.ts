import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import { User, UserDoc } from "@/models/User";
import { recalculateStreak } from "@/lib/helpers";
import { WorkoutLogSchema, WorkoutLogInput } from "../schemas";

export async function PATCH(
	req: NextRequest,
	{ params }: { params: Promise<{ planId: string, logId: string }> }
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

		const { planId, logId } = await params;
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
				{ error: `User is not enrolled in the training plan ${planId}`, success: false },
				{ status: 404 }
			);
		}

		const logIndex = user.trainingPlans[planIndex].progressLog.findIndex(
			(log) => log._id?.toString() === logId
		);

		if (logIndex === -1) {
			return NextResponse.json(
				{ error: "Workout log not found", success: false },
				{ status: 404 }
			);
		}

		const existingLog = user.trainingPlans[planIndex].progressLog[logIndex];
		const wasCompleted = existingLog.status === "completed";
		const willBeCompleted = status === "completed";

		existingLog.date = new Date(date);
		existingLog.workoutTemplateId = workoutTemplateId;
		existingLog.status = status;
		existingLog.notes = notes;

		if (willBeCompleted) {

			if (body.durationMinutes !== undefined) {
				existingLog.durationMinutes = body.durationMinutes;
			}
			if (body.perceivedEffort !== undefined) {
				existingLog.perceivedEffort = body.perceivedEffort;
			}
			if (body.activityType !== undefined) {
				existingLog.activityType = body.activityType;
			}
			if (body.sport !== undefined) {
				existingLog.sport = body.sport;
			}

			// Distance-based metrics
			if (body.distance !== undefined) {
				existingLog.distance = body.distance;
			}
			if (body.pace !== undefined) {
				existingLog.pace = body.pace;
			}

			// Strength training metrics
			if (body.strengthSession !== undefined) {
				existingLog.strengthSession = body.strengthSession;
			}

			// Drill session metrics
			if (body.drillSession !== undefined) {
				existingLog.drillSession = body.drillSession;
			}

			// Heart rate
			if (body.heartRate !== undefined) {
				existingLog.heartRate = body.heartRate;
			}
		} else {
			// If changing to skipped, remove completion-specific data
			delete existingLog.durationMinutes;
			delete existingLog.perceivedEffort;
			delete existingLog.activityType;
			delete existingLog.sport;
			delete existingLog.distance;
			delete existingLog.pace;
			delete existingLog.strengthSession;
			delete existingLog.drillSession;
			delete existingLog.heartRate;
		}

		if (wasCompleted && !willBeCompleted) {
			user.totalWorkoutsCompleted = Math.max(0, user.totalWorkoutsCompleted - 1);
			recalculateStreak(user, planIndex);
		} else if (!wasCompleted && willBeCompleted) {
			user.totalWorkoutsCompleted += 1;
			recalculateStreak(user, planIndex);
		}

		await user.save();

		return NextResponse.json({
			data: {
				planId,
				workoutLog: existingLog,
				userStats: {
					totalWorkoutsCompleted: user.totalWorkoutsCompleted,
					currentStreak: user.currentStreak,
					longestStreak: user.longestStreak,
				},
			},
			success: true,
		});

	} catch (error: unknown) {
		const errorMessage: string = error instanceof Error ? error.message : "Unknown error occurred";
		console.error("Error updating workout log:", errorMessage);
		return NextResponse.json(
			{ error: "Failed to update workout log", success: false },
			{ status: 500 }
		);
	}

}