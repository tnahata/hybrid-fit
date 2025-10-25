import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import { User, UserDoc, UserPlanProgress } from "@/models/User";
import { TrainingPlan, TrainingPlanDoc, TrainingPlanWeek, TrainingPlanDay } from "@/models/TrainingPlans";
import { WorkoutTemplate, WorkoutTemplateDoc } from "@/models/Workouts";

// Enriched day with workout details
interface EnrichedTrainingPlanDay extends TrainingPlanDay {
    workoutDetails: WorkoutTemplateDoc | null;
}

// Enriched week with enriched days
interface EnrichedTrainingPlanWeek extends Omit<TrainingPlanWeek, 'days'> {
    days: EnrichedTrainingPlanDay[];
}

// Enriched plan with enriched weeks
interface EnrichedTrainingPlanDoc extends Omit<TrainingPlanDoc, 'weeks'> {
    weeks: EnrichedTrainingPlanWeek[];
}

// User plan progress with enriched plan details
interface EnrichedUserPlanProgress {
    planId: string;
    planName: string;
    totalWeeks: number;
    startedAt: Date;
    completedAt?: Date;
    currentWeek: number;
    currentDayIndex: number;
    isActive: boolean;
    overrides: Array<{
        weekNumber: number;
        dayOfWeek: string;
        customWorkoutId: string;
    }>;
    progressLog: Array<{
        date: Date;
        workoutTemplateId: string;
        status: "completed" | "skipped" | "missed";
        notes?: string;
    }>;
    planDetails: EnrichedTrainingPlanDoc;
}

// Response structure
interface ApiResponse {
    data: Omit<UserDoc, 'trainingPlans'> & {
        trainingPlans: EnrichedUserPlanProgress[];
    };
    success: boolean;
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
            const response: ApiResponse = {
                data: {
                    ...user.toObject(),
                    trainingPlans: []
                },
                success: true
            };

            return NextResponse.json(response);
        }

        // Process each training plan
        const enrichedPlans: (EnrichedUserPlanProgress | null)[] = await Promise.all(
            user.trainingPlans.map(async (userPlan: UserPlanProgress) => {
                // Fetch base training plan
                const basePlan: TrainingPlanDoc | null = await TrainingPlan.findById(userPlan.planId);

                if (!basePlan) {
                    console.error(`Training plan ${userPlan.planId} not found`);
                    return null;
                }

                // Merge with user overrides
                const mergedPlan: TrainingPlanDoc = mergePlanWithUserOverrides(basePlan, userPlan);

                // Collect all unique workout template IDs
                const workoutIds: string[] = [];
                mergedPlan.weeks.forEach((week: TrainingPlanWeek) => {
                    week.days.forEach((day: TrainingPlanDay) => {
                        if (day.workoutTemplateId && !workoutIds.includes(day.workoutTemplateId)) {
                            workoutIds.push(day.workoutTemplateId);
                        }
                    });
                });

                // Fetch all workout templates
                const workoutTemplates: WorkoutTemplateDoc[] = await WorkoutTemplate.find({
                    _id: { $in: workoutIds }
                });

                const workoutMap: Record<string, WorkoutTemplateDoc> = {};
                workoutTemplates.forEach((workout: WorkoutTemplateDoc) => {
                    workoutMap[workout._id] = workout;
                });

                // Enrich plan with workout details
                const enrichedWeeks: EnrichedTrainingPlanWeek[] = mergedPlan.weeks.map(
                    (week: TrainingPlanWeek): EnrichedTrainingPlanWeek => ({
                        weekNumber: week.weekNumber,
                        days: week.days.map((day: TrainingPlanDay): EnrichedTrainingPlanDay => ({
                            dayOfWeek: day.dayOfWeek,
                            workoutTemplateId: day.workoutTemplateId,
                            workoutDetails: workoutMap[day.workoutTemplateId] || null
                        }))
                    })
                );

                const enrichedPlan: EnrichedTrainingPlanDoc = {
                    _id: mergedPlan._id,
                    name: mergedPlan.name,
                    sport: mergedPlan.sport,
                    category: mergedPlan.category,
                    durationWeeks: mergedPlan.durationWeeks,
                    level: mergedPlan.level,
                    sourceUrl: mergedPlan.sourceUrl,
                    details: mergedPlan.details,
                    weeks: enrichedWeeks
                } as EnrichedTrainingPlanDoc;

                return {
                    planId: userPlan.planId,
                    planName: userPlan.planName,
                    totalWeeks: userPlan.totalWeeks,
                    startedAt: userPlan.startedAt,
                    completedAt: userPlan.completedAt,
                    currentWeek: userPlan.currentWeek,
                    currentDayIndex: userPlan.currentDayIndex,
                    isActive: userPlan.isActive,
                    overrides: userPlan.overrides,
                    progressLog: userPlan.progressLog,
                    planDetails: enrichedPlan
                } as EnrichedUserPlanProgress;
            })
        );

        // Filter out null plans
        const validEnrichedPlans: EnrichedUserPlanProgress[] = enrichedPlans.filter(
            (plan): plan is EnrichedUserPlanProgress => plan !== null
        );

        const response: ApiResponse = {
            data: {
                ...user.toObject(),
                trainingPlans: validEnrichedPlans
            },
            success: true
        };

        return NextResponse.json(response);

    } catch (error: unknown) {
        console.error("Error in /api/users/me:", error);
        const errorMessage: string = error instanceof Error ? error.message : "Internal server error";

        return NextResponse.json(
            { error: errorMessage, success: false },
            { status: 500 }
        );
    }
}

function mergePlanWithUserOverrides(trainingPlan: TrainingPlanDoc, planProgress: UserPlanProgress): TrainingPlanDoc {
    
    if (!trainingPlan) {
        throw new Error("Training plan is required");
    }

    // Clone the plan to avoid mutating the original
    const mergedPlan: TrainingPlanDoc = JSON.parse(JSON.stringify(trainingPlan)) as TrainingPlanDoc;

    // If no overrides, return as-is
    if (!planProgress?.overrides || planProgress.overrides.length === 0) {
        return mergedPlan;
    }

    // Apply each override
    for (const override of planProgress.overrides) {
        const day: string = override.dayOfWeek.toString();
        const weekNum: number = override.weekNumber;
        const customWorkoutId: string = override.customWorkoutId;

        // Find the week and day indices
        const weekIndex: number = mergedPlan.weeks.findIndex(
            (week: TrainingPlanWeek) => week.weekNumber === weekNum
        );

        if (weekIndex === -1) {
            console.warn(`Override: Week ${weekNum} not found in plan`);
            continue;
        }

        const dayIndex: number = mergedPlan.weeks[weekIndex].days.findIndex(
            (wday: TrainingPlanDay) => wday.dayOfWeek === day
        );

        if (dayIndex === -1) {
            console.warn(`Override: Day ${day} not found in week ${weekNum}`);
            continue;
        }

        // Apply the override
        mergedPlan.weeks[weekIndex].days[dayIndex].workoutTemplateId = customWorkoutId;
    }

    return mergedPlan;
}