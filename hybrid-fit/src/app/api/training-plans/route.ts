import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { TrainingPlan } from "@/models/TrainingPlans";

// Cache this route's response for 1 hour (3600 seconds)
// Training plans are static data that rarely change
export const revalidate = 3600;

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