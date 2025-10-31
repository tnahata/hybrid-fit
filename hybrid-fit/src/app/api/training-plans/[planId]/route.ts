import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { enrichTrainingPlans, EnrichedTrainingPlanDoc } from "@/lib/enrichTrainingPlans";

export async function GET(
	request: NextRequest,
	{ params }: { params: { planId: string } }
) {
	try {
		const { planId } = await params;

		if (!planId) {
			return NextResponse.json(
				{
					error: "Training plan ID is required",
					success: false
				},
				{ status: 400 }
			);
		}

		await connectToDatabase();

		const enrichedPlans = await enrichTrainingPlans([planId]);

		if (!enrichedPlans || enrichedPlans.length === 0) {
			return NextResponse.json(
				{
					error: "Training plan not found",
					success: false
				},
				{ status: 404 }
			);
		}

		const enrichedPlan: EnrichedTrainingPlanDoc = enrichedPlans[0];

		const totalWorkouts = enrichedPlan.weeks.reduce((count, week) => {
			return count + week.days.filter(day => day.workoutDetails !== null).length;
		}, 0);

		const totalExercises = new Set<string>();
		enrichedPlan.weeks.forEach(week => {
			week.days.forEach(day => {
				if (day.workoutDetails?.structure) {
					day.workoutDetails.structure.forEach(item => {
						if (item.exercise) {
							totalExercises.add(String(item.exercise._id));
						}
					});
				}
			});
		});

		return NextResponse.json(
			{
				data: enrichedPlan,
				meta: {
					totalWeeks: enrichedPlan.weeks.length,
					totalWorkouts,
					totalExercises: totalExercises.size,
				},
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error fetching training plan details:", error);
		return NextResponse.json(
			{ error: "Failed to fetch training plan details" },
			{ status: 500 }
		);
	}
}