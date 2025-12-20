'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { EmailValidationSchema } from "@/lib/zod-schemas";

export default function ForgotPasswordPage() {
	const [email, setEmail] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [isEmailValid, setIsEmailValid] = useState(false);

	const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const inputEmail = e.target.value;
		setEmail(inputEmail);

		const validationResult = EmailValidationSchema.safeParse({ email: inputEmail });
		setIsEmailValid(validationResult.success);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		setIsLoading(true);

		try {
			const response = await fetch('/api/auth/forgot-password', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email }),
			});

			const data = await response.json();

			if (response.ok) {
				setIsSubmitted(true);
				toast.success('Check your email', {
					description: 'If an account exists, a reset link has been sent.',
				});
			} else {
				toast.error('Error', {
					description: data.error || 'Failed to send reset email',
				});
			}
		} catch (error) {
			console.error('Forgot password error:', error);
			toast.error('Error', {
				description: 'Something went wrong. Please try again.',
			});
		} finally {
			setIsLoading(false);
		}
	};

	if (isSubmitted) {
		return (
			<div className="min-h-screen flex items-center justify-center px-4">
				<div className="max-w-md w-full space-y-8">
					<div className="text-center">
						<h2 className="text-3xl font-bold">Check Your Email</h2>
						<p className="text-sm">
							If an account exists with that email address, we&apos;ve sent you a password reset link.
						</p>
						<p className="mt-4 font-small">
							Didn&apos;t receive an email? Check your spam folder or{' '}
							<Button
								variant='link'
								onClick={() => setIsSubmitted(false)}
								className="text-blue-600 hover:text-blue-700 font-medium"
							>
								try again
							</Button>
						</p>
					</div>
					<div className="text-center">
						<a
							href="/signin"
							className="text-blue-600 hover:text-blue-700 font-medium"
						>
							Back to Sign In
						</a>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex items-center justify-center px-4">
			<div className="max-w-md w-full space-y-8">
				<div className="text-center">
					<h2 className="text-3xl font-bold">Forgot Password</h2>
					<p className='text-sm'>
						Include the email address associated with your account and we’ll send you an email with instructions to reset your password.
					</p>
				</div>

				<form onSubmit={handleSubmit} className="mt-8 space-y-6">
					<div>
						<Label htmlFor="email" className="block text-sm">
							Email
						</Label>
						<Input
							id="email"
							name="email"
							type="email"
							autoComplete="email"
							required
							value={email}
							onChange={handleEmailChange}
							className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none"
							placeholder="you@example.com"
						/>
					</div>

					<Button
						type="submit"
						disabled={isLoading || !isEmailValid}
						className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isLoading ? 'Sending...' : 'Send Reset Link'}
					</Button>

					<div className="text-center">
						<Link
							href="/signin"
							className="text-sm font-medium text-blue-600 hover:text-blue-700"
						>
							Back to Sign In
						</Link>
					</div>
				</form>
			</div>
		</div>
	);
}