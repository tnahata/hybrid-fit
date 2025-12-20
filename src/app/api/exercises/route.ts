import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Exercise } from "@/models/Exercise";

export const revalidate = 3600; // Revalidate every 1 hour
export const dynamic = 'force-static'; // Force static rendering for caching

export async function GET() {
	try {
		await connectToDatabase();

		const [total, exercises] = await Promise.all([
			Exercise.countDocuments({}),
			Exercise.find({}).lean() // Use .lean() for plain objects (better caching)
		]);

		return NextResponse.json({
			data: exercises,
			meta: {
				total
			},
		});
	} catch (err) {
		console.error("Error fetching exercises:", err);
		return NextResponse.json(
			{ error: "Failed to load exercises" },
			{ status: 500 }
		);
	}
}
