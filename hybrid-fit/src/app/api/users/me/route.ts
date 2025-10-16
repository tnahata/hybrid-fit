// app/api/users/me/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User, UserDoc, UserPlanProgress } from "@/models/User";
import { TrainingPlan, TrainingPlanDoc } from "@/models/TrainingPlans";

export async function GET(req: Request) {
    await connectToDatabase();

    // Example: if using NextAuth or a decoded JWT
    const userId = "670fdfb52b0012a5f4b7a111"; // TODO: change this temporary placeholder later
    const user: UserDoc | null = await User.findById(userId);
    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const trainingPlanIds = user.trainingPlans.map(p => p.planId);
    if (!trainingPlanIds || trainingPlanIds.length === 0) {
        return NextResponse.json({ error: "User does not have any training plan data" }, { status: 404 });
    }
    const planDocs: TrainingPlanDoc[] = await Promise.all(
        user.trainingPlans.map(async (tp) => {
            const basePlan = await TrainingPlan.findById(tp.planId);
            return mergePlanWithUserOverrides(basePlan, tp);
        })
    );

    return NextResponse.json({data: user, trainingPlans: planDocs});
}

function mergePlanWithUserOverrides(trainingPlan: TrainingPlanDoc, planProgress: UserPlanProgress): TrainingPlanDoc {
    if (!trainingPlan) return null as any;

    // Clone the plan so we don't mutate the original DB document
    const mergedPlan = JSON.parse(JSON.stringify(trainingPlan)) as TrainingPlanDoc;

    // If the user has no overrides, return the plan as is
    if (!planProgress?.overrides || planProgress.overrides.length === 0) {
        return mergedPlan;
    }

    // Apply overrides week by week
    for (const weekOverride of planProgress.overrides) {

        // name of day and week number for the curren override
        const day = weekOverride.dayOfWeek.toString();
        const weekNum = weekOverride.weekNumber;
        const customWorkoutId = weekOverride.customWorkoutId;

        // for the current override, find which week and day it is for in the base plans week's
        const { weekIndex, dayIndex } = (() => {
            const weekIndex = mergedPlan.weeks.findIndex(week =>
                week.weekNumber === weekNum &&
                week.days.some(wday => wday.dayOfWeek === day)
            );
            const dayIndex = weekIndex !== -1
                ? mergedPlan.weeks[weekIndex].days.findIndex(wday => wday.dayOfWeek === day)
                : -1;
            return { weekIndex, dayIndex };
        })();

        if (weekIndex === -1 || dayIndex === -1) {
            console.warn(`Could not apply override for week ${weekNum}, day ${day}`);
            continue;
        }

        if (weekIndex !== -1 && dayIndex !== -1) {
            mergedPlan.weeks[weekIndex].days[dayIndex].workoutTemplateId = customWorkoutId;
        }
    }

    return mergedPlan;
}
