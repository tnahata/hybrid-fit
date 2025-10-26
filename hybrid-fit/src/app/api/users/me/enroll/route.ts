import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import { User, UserDoc, UserPlanProgress } from "@/models/User";
import { TrainingPlan, TrainingPlanDoc } from "@/models/TrainingPlans";

export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);

		if (!session || !session.user) {
			return NextResponse.json(
				{ error: "Unauthorized - Please sign in to enroll in a plan" },
				{ status: 401 }
			);
		}

		const { planId } = await request.json();

		if (!planId) {
			return NextResponse.json(
				{ error: "Plan ID is required" },
				{ status: 400 }
			);
		}

		await connectToDatabase();

		const plan = await TrainingPlan.findById(planId) as TrainingPlanDoc | null;

		if (!plan) {
			return NextResponse.json(
				{ error: "Training plan not found" },
				{ status: 404 }
			);
		}

		const user = await User.findById(session.user.id) as UserDoc | null;

		if (!user) {
			return NextResponse.json(
				{ error: "User not found" },
				{ status: 404 }
			);
		}

		const alreadyEnrolled = user.trainingPlans.some((tp: UserPlanProgress) =>
			tp.planId.toString() === planId
		);

		if (alreadyEnrolled) {
			return NextResponse.json(
				{
					error: "You are already enrolled in this plan",
					success: false
				},
				{ status: 409 }
			);
		}

		const planProg: UserPlanProgress = {
			planId: plan._id,
			planName: plan.name,
			totalWeeks: plan.durationWeeks,
			startedAt: new Date(),
			currentWeek: 1,
			currentDayIndex: 0,
			isActive: true,
			progressLog: [],
			overrides: []
		};

		user.trainingPlans.push(planProg);

		await user.save();

		console.log(`User is ${user}`);

		return NextResponse.json(
			{
				message: "Successfully enrolled in training plan",
				plan: {
					id: planProg.planId,
					name: planProg.planName,
					startDate: planProg.startedAt,
				},
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error("Enrollment error:", error);
		return NextResponse.json(
			{ error: "Failed to enroll in training plan" },
			{ status: 500 }
		);
	}
}