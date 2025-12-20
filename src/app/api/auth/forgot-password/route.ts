import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User, UserDoc } from "@/models/User";
import crypto from "crypto";
import { EmailValidationSchema } from "@/lib/zod-schemas";
import { sendPasswordResetEmail } from "@/lib/email";

const RESPONSE_MESSAGE = "If an account with that email exists, a password reset link has been sent.";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const validationResult = EmailValidationSchema.safeParse(body);

		if (!validationResult.success) {
			return NextResponse.json(
				{
					error: "Invalid email address",
					details: validationResult.error.errors,
				},
				{ status: 400 }
			);
		}

		const { email } = validationResult.data;

		await connectToDatabase();

		const user: UserDoc | null = await User.findOne({ email: email.toLowerCase() });

		if (!user) {
			return NextResponse.json({
				message: RESPONSE_MESSAGE,
			});
		}

		const resetToken = crypto.randomBytes(32).toString("hex");
		const hashedToken = crypto
			.createHash("sha256")
			.update(resetToken)
			.digest("hex");

		user.resetPasswordToken = hashedToken;
		user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 Hour

		await user.save();

		const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;

		await sendPasswordResetEmail(user.email, resetUrl, user.name);

		return NextResponse.json({
			message: RESPONSE_MESSAGE,
		});
	} catch (error) {
		console.error("Forgot password route error:", error);
		return NextResponse.json(
			{ error: "Failed to process password reset request" },
			{ status: 500 }
		);
	}
}