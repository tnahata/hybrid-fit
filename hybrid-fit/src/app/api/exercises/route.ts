import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { NormalizedExercise } from "@/models/NormalizedExercise";

export async function GET(req: Request) {
    try {
        await connectToDatabase();

        const [total, exercises] = await Promise.all([
            NormalizedExercise.countDocuments({}),
            NormalizedExercise.find({})
        ]);

        return NextResponse.json({
            data: exercises,
            meta: {
                total
            },
        });
    } catch (err: any) {
        console.error("❌ Error fetching exercises:", err);
        return NextResponse.json(
            { error: "Failed to load exercises" },
            { status: 500 }
        );
    }
}
