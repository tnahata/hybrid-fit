import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import { User, UserDoc, WorkoutOverride } from "@/models/User";

interface PatchOverridesRequest {
	overrides: WorkoutOverride[];
}

export async function PATCH(
	req: NextRequest,
	{ params }: { params: Promise<{ planId: string }> }
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

		const { planId } = await params;

		const userId = session.user.id;

		// Parse request body
		const body: PatchOverridesRequest = await req.json();
		const { overrides } = body;

		// Validate overrides structure
		if (!Array.isArray(overrides)) {
			return NextResponse.json(
				{ error: "Overrides must be an array", success: false },
				{ status: 400 }
			);
		}

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
				{ error: "Training plan not found", success: false },
				{ status: 404 }
			);
		}
		const trainingPlan = user.trainingPlans[planIndex];

		const currentWeek = trainingPlan.currentWeek;
		
		// Filter out past overrides from the incoming request
		const validOverrides = overrides.filter(
			(override) => override.weekNumber >= currentWeek
		);

		// Reject requests that only contain past overrides
		if (overrides.length > 0 && validOverrides.length === 0) {
			return NextResponse.json(
				{
					error: "Cannot modify overrides for past weeks",
					success: false
				},
				{ status: 400 }
			);
		}

		// Get existing overrides
		const existingOverrides = trainingPlan.overrides || [];
		
		// Keep past overrides (they shouldn't be modified)
		const pastOverrides = existingOverrides.filter(
			(override) => override.weekNumber < currentWeek
		);

		// Merge: past overrides (unchanged) + new valid overrides (current and future)
		user.trainingPlans[planIndex].overrides = [...pastOverrides, ...validOverrides];

		await user.save();

		return NextResponse.json({
			data: {
				planId: planId,
				overrides: user.trainingPlans[planIndex].overrides,
			},
			success: true,
		});
	} catch (error: unknown) {
		const errorMessage: string = error instanceof Error ? error.message : "Unknown error occurred";
		console.error("Error updating overrides:", errorMessage);
		return NextResponse.json(
			{ error: "Failed to update overrides", success: false },
			{ status: 500 }
		);
	}
}