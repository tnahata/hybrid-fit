import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Exercise } from "@/models/Exercise";

// Cache this route's response for 1 hour (3600 seconds)
// Exercises are static data that rarely change
export const revalidate = 3600;

export async function GET() {
    try {
        await connectToDatabase();

        const [total, exercises] = await Promise.all([
            Exercise.countDocuments({}),
            Exercise.find({})
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
