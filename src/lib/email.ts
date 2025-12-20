import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const from = process.env.SENDER_EMAIL;

export async function sendPasswordResetEmail(
	email: string,
	resetUrl: string,
	name: string
) {
	try {
		const { data, error } = await resend.emails.send({
			from: `HybridFit <${from}>`,
			to: email,
			subject: 'Password Reset Request - HybridFit',
			html: `
				<!DOCTYPE html>
				<html>
					<head>
						<meta charset="utf-8">
						<meta name="viewport" content="width=device-width, initial-scale=1.0">
						<title>Password Reset</title>
					</head>
					<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: hsl(222.2, 84%, 4.9%); max-width: 600px; margin: 0 auto; padding: 20px; background-color: hsl(0, 0%, 100%);">
						<div style="background-color: hsl(210, 40%, 96.1%); padding: 24px; border-radius: 8px; border: 1px solid hsl(214.3, 31.8%, 91.4%);">
							<h2 style="color: hsl(24.6, 95%, 53.1%); margin-top: 0; margin-bottom: 16px; font-size: 24px; font-weight: 700;">Hi ${name},</h2>
							<p style="margin-bottom: 16px; color: hsl(222.2, 84%, 4.9%);">You requested a password reset for your HybridFit account.</p>
							<p style="margin-bottom: 24px; color: hsl(222.2, 84%, 4.9%);">Click the button below to reset your password:</p>
							<div style="text-align: center; margin: 32px 0;">
								<a href="${resetUrl}" 
								style="display: inline-block; padding: 12px 24px; background-color: hsl(24.6, 95%, 53.1%); color: hsl(0, 0%, 100%); text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; transition: background-color 0.2s;">
									Reset Password
								</a>
							</div>
							<p style="color: hsl(215.4, 16.3%, 46.9%); font-size: 14px; margin-bottom: 12px;">
								This link will expire in <strong style="color: hsl(222.2, 84%, 4.9%);">1 hour</strong>.
							</p>
							<p style="color: hsl(215.4, 16.3%, 46.9%); font-size: 14px; margin-bottom: 24px;">
								If you didn't request this, you can safely ignore this email.
							</p>
							<hr style="border: none; border-top: 1px solid hsl(214.3, 31.8%, 91.4%); margin: 24px 0;">
							<p style="color: hsl(215.4, 16.3%, 46.9%); font-size: 12px; margin-bottom: 0;">
								Thanks,<br>
								<strong style="color: hsl(222.2, 84%, 4.9%);">The HybridFit Team</strong>
							</p>
						</div>
					</body>
				</html>
			`
		});

		if (error) {
			console.error('Resend error:', error);
			throw new Error('Failed to send password reset email');
		}

		return data;
	} catch (error) {
		console.error('Failed to send email:', error);
		throw new Error('Failed to send password reset email');
	}
}

export async function sendWelcomeEmail(
	email: string,
	name: string
) {
	try {
		const { data, error } = await resend.emails.send({
			from: `HybridFit <${from}>`,
			to: email,
			subject: 'Welcome to HybridFit!',
			html: `
				<!DOCTYPE html>
				<html>
				<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
					<div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px;">
						<h2 style="color: #4F46E5;">Welcome to HybridFit, ${name}! 🎉</h2>
						<p>We're excited to have you on board.</p>
						<p>Get started by exploring your dashboard and creating your first training plan.</p>
						<div style="text-align: center; margin: 30px 0;">
							<a href="${process.env.NEXTAUTH_URL}/dashboard" 
							   style="display: inline-block; padding: 14px 28px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
								Go to Dashboard
							</a>
						</div>
						<p style="color: #666; font-size: 14px;">
							If you have any questions, feel free to reach out to our support team.
						</p>
						<hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
						<p style="color: #999; font-size: 12px;">
							Thanks,<br>
							The HybridFit Team
						</p>
					</div>
				</body>
				</html>
			`,
		});

		if (error) {
			console.error('Resend error:', error);
			throw new Error('Failed to send welcome email');
		}

		return data;
	} catch (error) {
		console.error('Failed to send email:', error);
		throw new Error('Failed to send welcome email');
	}
}

export async function sendWorkoutReminderEmail(
	email: string,
	name: string,
	workoutDetails: string
) {
	try {
		const { data, error } = await resend.emails.send({
			from: `HybridFit <${from}>`,
			to: email,
			subject: 'Workout Reminder - HybridFit',
			html: `
				<!DOCTYPE html>
				<html>
				<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
					<div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px;">
						<h2 style="color: #4F46E5;">Time to Train, ${name}! 💪</h2>
						<p>You have a workout scheduled for today:</p>
						<div style="background-color: white; padding: 15px; border-radius: 6px; margin: 20px 0;">
							<p style="margin: 0; font-weight: bold;">${workoutDetails}</p>
						</div>
						<div style="text-align: center; margin: 30px 0;">
							<a href="${process.env.NEXTAUTH_URL}/dashboard" 
							   style="display: inline-block; padding: 14px 28px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
								View Workout
							</a>
						</div>
						<p style="color: #666; font-size: 14px;">
							Let's keep that streak going!
						</p>
						<hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
						<p style="color: #999; font-size: 12px;">
							Thanks,<br>
							The HybridFit Team
						</p>
					</div>
				</body>
				</html>
			`,
		});

		if (error) {
			console.error('Resend error:', error);
			throw new Error('Failed to send workout reminder email');
		}

		return data;
	} catch (error) {
		console.error('Failed to send email:', error);
		throw new Error('Failed to send workout reminder email');
	}
}