import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User, UserDoc } from "@/models/User";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { ResetPasswordSchema } from "@/lib/zod-schemas";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const validationResult = ResetPasswordSchema.safeParse(body);

		if (!validationResult.success) {
			return NextResponse.json(
				{
					error: "Validation failed",
					details: validationResult.error.errors,
				},
				{ status: 400 }
			);
		}

		const { token, password } = validationResult.data;

		await connectToDatabase();

		const hashedToken = crypto
			.createHash("sha256")
			.update(token)
			.digest("hex");

		const nowUtc = new Date(Date.now());

		const user: UserDoc | null = await User.findOne({
			resetPasswordToken: hashedToken,
			resetPasswordExpiry: { $gt: nowUtc },
		});

		if (!user) {
			return NextResponse.json(
				{ error: "Invalid or expired reset token" },
				{ status: 400 }
			);
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		user.passwordHash = hashedPassword;
		user.resetPasswordToken = undefined;
		user.resetPasswordExpiry = undefined;

		await user.save();

		return NextResponse.json({
			message: "Password reset successfully",
		});
	} catch (error) {
		console.error("Reset password error:", error);
		return NextResponse.json(
			{ error: "Failed to reset password" },
			{ status: 500 }
		);
	}
}