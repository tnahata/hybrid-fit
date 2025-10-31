'use client';

import React, { useState, useEffect } from 'react';
import usePendingEnrollment from '@/hooks/usePendingEnrollment';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { XIcon, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';

export default function SignIn() {
	const router = useRouter();
	const { isProcessingEnrollment } = usePendingEnrollment();

	const [showPassword, setShowPassword] = useState(false);
	const [formData, setFormData] = useState({
		email: '',
		password: ''
	});

	const [errors, setErrors] = useState({
		email: false,
		password: false
	});

	const [touched, setTouched] = useState({
		email: false,
		password: false
	});

	const [isLoading, setIsLoading] = useState(false);
	const [loginError, setLoginError] = useState<string>('');

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value
		}));

		if (value.trim()) {
			setErrors(prev => ({
				...prev,
				[name]: false
			}));
		}

		if (loginError) {
			setLoginError('');
		}
	};

	const handleBlur = (field: 'email' | 'password') => {
		setTouched(prev => ({
			...prev,
			[field]: true
		}));

		// Validate on blur
		if (!formData[field].trim()) {
			setErrors(prev => ({
				...prev,
				[field]: true
			}));
		}
	};

	const validateForm = () => {
		const newErrors = {
			email: !formData.email.trim(),
			password: !formData.password.trim()
		};

		setErrors(newErrors);
		setTouched({
			email: true,
			password: true
		});

		return !newErrors.email && !newErrors.password;
	};

	const handleSubmit = async (e?: React.FormEvent) => {
		e?.preventDefault();

		if (!validateForm()) {
			return;
		}

		setIsLoading(true);
		setLoginError('');

		try {
			const result = await signIn('credentials', {
				email: formData.email,
				password: formData.password,
				redirect: false
			});

			if (result?.error) {
				// Authentication failed
				const errorMessage = result.error === 'CredentialsSignin'
					? 'Invalid email or password. Please try again.'
					: result.error;

				setLoginError(errorMessage);
				toast.error('Login failed', {
					description: errorMessage,
				});
				setIsLoading(false);
			} else {
				toast.success('Login successful!');
				router.push('/dashboard');
			}
		} catch (error) {
			const errorMessage = 'Something went wrong. Please try again.';
			setLoginError(errorMessage);
			toast.error('Error', {
				description: errorMessage,
			});
			console.error('Sign in error:', error);
			setIsLoading(false);
		}
		//} finally {
		//	setIsLoading(false);
		//}
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			handleSubmit();
		}
	};

	const handleClose = () => {
		router.push('/');
	};

	return (
		<Dialog open={true}>
			<DialogContent
				className="max-w-md w-full p-0 overflow-hidden"
				showCloseButton={false}
			>

				<button
					onClick={handleClose}
					className="absolute top-4 right-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
				>
					<XIcon className="h-4 w-4" />
					<span className="sr-only">Close</span>
				</button>

				<div className="p-8">
					<div className="mb-8">
						<h2 className="text-xl font-bold mb-1">HYBRID FIT</h2>
					</div>

					<form onSubmit={handleSubmit} className="space-y-6">
						<h1 className="text-2xl font-bold">Sign in to your account</h1>

						{loginError && (
							<div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded text-sm">
								{loginError}
							</div>
						)}

						<div className="space-y-4">

							<div>
								<label htmlFor="email" className="block text-xs font-medium mb-2 uppercase">
									Email
								</label>
								<Input
									id="email"
									name="email"
									type="email"
									placeholder="Enter your email"
									value={formData.email}
									onChange={handleInputChange}
									onBlur={() => handleBlur('email')}
									onKeyPress={handleKeyPress}
									aria-invalid={touched.email && errors.email}
									className="w-full"
									disabled={isProcessingEnrollment}
								/>
								{touched.email && errors.email && (
									<p className="text-red-500 text-xs mt-1">Email is required</p>
								)}
							</div>

							<div>
								<div className="flex items-center justify-between mb-2">
									<label htmlFor="password" className="block text-xs font-medium uppercase">
										Password
									</label>
									<Link
										href="/forgot-password"
										className="text-xs text-blue-600 hover:underline"
									>
										Forgot password?
									</Link>
								</div>
								<div className="relative">
									<Input
										id="password"
										name="password"
										type={showPassword ? "text" : "password"}
										placeholder="Enter your password"
										value={formData.password}
										onChange={handleInputChange}
										onBlur={() => handleBlur('password')}
										onKeyPress={handleKeyPress}
										aria-invalid={touched.password && errors.password}
										className="w-full pr-10"
										disabled={isProcessingEnrollment}
									/>
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
										disabled={isProcessingEnrollment}
									>
										{showPassword ? (
											<EyeOff className="h-4 w-4" />
										) : (
											<Eye className="h-4 w-4" />
										)}
									</button>
								</div>
								{touched.password && errors.password && (
									<p className="text-red-500 text-xs mt-1">Password is required</p>
								)}
							</div>

							<div className="flex items-center">
								<input
									id="remember"
									name="remember"
									type="checkbox"
									className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
									disabled={isProcessingEnrollment}
								/>
								<label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
									Remember me
								</label>
							</div>

							<Button
								type="submit"
								onClick={handleSubmit}
								disabled={isLoading || isProcessingEnrollment}
								className="w-full bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isLoading || isProcessingEnrollment ? 'Signing you in...' : 'Sign In'}
							</Button>
						</div>

						<div className="text-center">
							<span className="text-sm text-gray-600">Don&apos;t have an account? </span>
							<Link href="/signup" className="text-sm text-blue-600 hover:underline">
								Sign up
							</Link>
						</div>

						<div className="text-xs text-gray-500 text-center">
							By signing in, you agree to our{' '}
							<a href="#" className="underline">Terms of Service</a> and{' '}
							<a href="#" className="underline">Privacy Policy</a>.
						</div>
					</form>
				</div>
			</DialogContent>
		</Dialog>
	);
}
