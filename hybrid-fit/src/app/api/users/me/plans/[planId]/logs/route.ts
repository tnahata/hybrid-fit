// app/api/users/me/plans/[planId]/logs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User, UserDoc, WorkoutLog } from "@/models/User";

interface PostWorkoutLogRequest {
    date: string | Date;
    workoutTemplateId: string;
    status: "completed" | "skipped";
    notes?: string;

    durationMinutes?: number;
    perceivedEffort?: number;
    activityType?: string;
    sport?: string;

    // Distance-based fields
    distance?: {
        value: number;
        unit: "miles" | "kilometers";
    };
    pace?: {
        average: number;
        unit: "min/mile" | "min/km";
    };

    // Strength fields
    strengthSession?: {
        exercises: Array<{
            exerciseId: string;
            exerciseName: string;
            sets: Array<{
                setNumber: number;
                reps: number;
                weight: number;
                completed: boolean;
            }>;
        }>;
        totalVolume: number;
        volumeUnit: "kgs" | "lbs";
    };

    drillSession?: {
        activities: Array<{
            name: string;
            durationMinutes?: number;
            repetitions?: number;
            sets?: number;
            notes?: string;
        }>;
        customMetrics?: Record<string, number | string>;
    };

    // Heart rate
    heartRate?: {
        average: number;
    };
}

export async function POST(
    req: NextRequest,
    { params }: { params: { planId: string } }
): Promise<NextResponse> {
    try {
        await connectToDatabase();

        const { planId } = await params;

        // TODO: Get actual user ID from session/JWT
        const userId: string = "670fdfb52b0012a5f4b7a111";

        // Parse request body
        const body: PostWorkoutLogRequest = await req.json();
        const { date, workoutTemplateId, status, notes } = body;

        // Validate required fields
        if (!date || !workoutTemplateId || !status) {
            return NextResponse.json(
                { error: "Missing required fields: date, workoutTemplateId, status", success: false },
                { status: 400 }
            );
        }

        // Validate status
        if (!["completed", "skipped"].includes(status)) {
            return NextResponse.json(
                { error: "Status must be 'completed' or 'skipped'", success: false },
                { status: 400 }
            );
        }

        // Find user
        const user: UserDoc | null = await User.findById(userId);
        if (!user) {
            return NextResponse.json(
                { error: "User not found", success: false },
                { status: 404 }
            );
        }

        // Find the specific training plan
        const planIndex = user.trainingPlans.findIndex(
            (plan) => plan.planId === planId
        );

        if (planIndex === -1) {
            return NextResponse.json(
                { error: "Training plan not found", success: false },
                { status: 404 }
            );
        }

        // Create workout log entry
        const workoutLog: WorkoutLog = {
            date: new Date(date),
            workoutTemplateId,
            status,
            notes,
        };

        if (status === "completed") {
            // Universal metrics
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

            // Distance-based metrics
            if (body.distance) {
                workoutLog.distance = body.distance;
            }
            if (body.pace) {
                workoutLog.pace = body.pace;
            }

            // Strength training metrics
            if (body.strengthSession) {
                workoutLog.strengthSession = body.strengthSession;
            }

            // Drill session metrics (sport-specific)
            if (body.drillSession) {
                workoutLog.drillSession = body.drillSession;
            }

            // Heart rate
            if (body.heartRate) {
                workoutLog.heartRate = body.heartRate;
            }

            // Update cumulative metrics for the user
            user.totalWorkoutsCompleted += 1;
            user.lastWorkoutDate = new Date(date);

            // Update streak
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const logDate = new Date(date);
            logDate.setHours(0, 0, 0, 0);
            const lastWorkout = user.lastWorkoutDate ? new Date(user.lastWorkoutDate) : null;

            if (lastWorkout) {
                lastWorkout.setHours(0, 0, 0, 0);
                const daysDiff = Math.floor((logDate.getTime() - lastWorkout.getTime()) / (1000 * 60 * 60 * 24));

                if (daysDiff === 1) {
                    // Consecutive day
                    user.currentStreak += 1;
                } else if (daysDiff === 0) {
                    // Same day, no change to streak
                } else {
                    // Streak broken
                    user.currentStreak = 1;
                }
            } else {
                // First workout
                user.currentStreak = 1;
            }

            // Update longest streak
            if (user.currentStreak > user.longestStreak) {
                user.longestStreak = user.currentStreak;
            }
        }
        // If the workout was skipped, we dont have to update any metrics and let the user preserver their streak since it was an intentional skip

        user.trainingPlans[planIndex].progressLog.push(workoutLog);

        // Save user document
        await user.save();

        return NextResponse.json({
            data: {
                planId,
                workoutLog,
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
        console.error("Error logging workout:", errorMessage);
        return NextResponse.json(
            { error: "Failed to log workout", success: false },
            { status: 500 }
        );
    }
}