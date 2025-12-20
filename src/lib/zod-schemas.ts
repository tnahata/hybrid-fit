import z from 'zod';

export const EmailValidationSchema = z.object({
	email: z.string().email("Invalid email address"),
});

export const ResetPasswordSchema = z.object({
	token: z.string().min(1, "Token is required"),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.regex(
			/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
			"Password must contain at least one uppercase letter, one lowercase letter, and one number"
		)
});