import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { TrainingPlan } from "@/models/TrainingPlans";

export const revalidate = 3600; // Revalidate every 1 hour
export const dynamic = 'force-static'; // Force static rendering for caching

export async function GET() {
	try {
		await connectToDatabase();

		const trainingPlans = await TrainingPlan.find({}).lean();

		return NextResponse.json(
			{
				data: trainingPlans,
				count: trainingPlans.length,
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error fetching training plans:", error);
		return NextResponse.json(
			{ error: "Failed to fetch training plans" },
			{ status: 500 }
		);
	}
}