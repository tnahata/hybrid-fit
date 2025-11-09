'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ResetPasswordPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [token, setToken] = useState<string | null>(null);
	const PASSWORD = 'password';
	const CONFIRM_PASSWORD = 'confirmPassword';
	const PASSWORDS_DONT_MATCH = 'Passwords do not match';
	const PLEASE_CONFIRM_PASSWORD = 'Please confirm your password';

	useEffect(() => {
		const tokenParam = searchParams.get('token');
		if (!tokenParam) {
			toast.error('Invalid reset link');
			router.push('/forgot-password');
		} else {
			setToken(tokenParam);
		}
	}, [searchParams, router]);

	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const [formData, setFormData] = useState({
		password: '',
		confirmPassword: ''
	});

	const [errors, setErrors] = useState({
		password: false,
		confirmPassword: false
	});

	const [passwordError, setPasswordError] = useState<string>('');
	const [confirmPasswordError, setConfirmPasswordError] = useState<string>('');

	const [touched, setTouched] = useState({
		password: false,
		confirmPassword: false
	});

	const validatePassword = (password: string): string => {
		if (password.length < 8) {
			return 'Password must be at least 8 characters long';
		}
		if (!/[A-Z]/.test(password)) {
			return 'Password must contain at least one uppercase letter';
		}
		if (!/[a-z]/.test(password)) {
			return 'Password must contain at least one lowercase letter';
		}
		if (!/[0-9]/.test(password)) {
			return 'Password must contain at least one number';
		}
		return '';
	};

	const validateConfirmPassword = (confirmPassword: string): string => {
		if (!confirmPassword) {
			return PLEASE_CONFIRM_PASSWORD;
		}
		if (confirmPassword !== formData.password) {
			return PASSWORDS_DONT_MATCH;
		}
		return '';
	};

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

		if (name === PASSWORD) {
			const error = validatePassword(value);
			setPasswordError(error);
			setErrors(prev => ({
				...prev,
				password: error !== ''
			}));

			if (formData.confirmPassword && touched.confirmPassword) {
				const confirmError = value !== formData.confirmPassword ? PASSWORDS_DONT_MATCH : '';
				setConfirmPasswordError(confirmError);
				setErrors(prev => ({
					...prev,
					confirmPassword: confirmError !== ''
				}));
			}
		}

		if (name === CONFIRM_PASSWORD) {
			const error = validateConfirmPassword(value);
			setConfirmPasswordError(error);
			setErrors(prev => ({
				...prev,
				confirmPassword: error !== ''
			}));
		}
	};

	const handleBlur = (field: 'password' | 'confirmPassword') => {
		setTouched(prev => ({
			...prev,
			[field]: true
		}));

		if (field === PASSWORD) {
			const error = validatePassword(formData.password);
			setPasswordError(error);
			setErrors(prev => ({
				...prev,
				password: error !== ''
			}));
		} else if (field === CONFIRM_PASSWORD) {
			const error = validateConfirmPassword(formData.confirmPassword);
			setConfirmPasswordError(error);
			setErrors(prev => ({
				...prev,
				confirmPassword: error !== ''
			}));
		}
	};

	const validateForm = () => {
		const passwordValidationError = validatePassword(formData.password);
		const confirmPasswordValidationError = validateConfirmPassword(formData.confirmPassword);

		const newErrors = {
			password: !formData.password.trim() || passwordValidationError !== '',
			confirmPassword: !formData.confirmPassword.trim() || confirmPasswordValidationError !== ''
		};

		setErrors(newErrors);
		setPasswordError(passwordValidationError);
		setConfirmPasswordError(confirmPasswordValidationError);
		setTouched({
			password: true,
			confirmPassword: true
		});

		return !newErrors.password && !newErrors.confirmPassword;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		if (!token) {
			toast.error('Invalid reset link', {
				description: 'Please request a new password reset link.',
			});
			return;
		}

		setIsLoading(true);

		try {
			const response = await fetch('/api/auth/reset-password', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					token,
					password: formData.password,
				}),
			});

			const data = await response.json();

			if (response.ok) {
				toast.success('Password reset successful!', {
					description: 'You can now sign in with your new password.',
				});
				router.push('/signin');
			} else {
				toast.error('Error', {
					description: data.error || 'Failed to reset password',
				});
			}
		} catch (error) {
			console.error('Reset password error:', error);
			toast.error('Error', {
				description: 'Something went wrong. Please try again.',
			});
		} finally {
			setIsLoading(false);
		}
	};

	if (!token) {
		<LoadingSpinner spinnerText="Loading..." />;
	}

	return (
		<div className="min-h-screen flex items-center justify-center px-4">
			<div className="max-w-md w-full space-y-8">
				<div className="text-center">
					<h2 className="text-3xl font-bold">Reset Your Password</h2>
					<p className="mt-2">
						Enter your new password below.
					</p>
				</div>

				<form onSubmit={handleSubmit} className="mt-8 space-y-6">
					<div>
						<Label htmlFor="password" className="block text-xs font-medium mb-2 uppercase">
							New Password
						</Label>
						<div className="relative">
							<Input
								id="password"
								name="password"
								type={showPassword ? "text" : "password"}
								placeholder="Enter your new password"
								value={formData.password}
								onChange={handleInputChange}
								onBlur={() => handleBlur(PASSWORD)}
								aria-invalid={touched.password && errors.password}
								className="w-full pr-10"
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
							>
								{showPassword ? (
									<EyeOff className="h-4 w-4" />
								) : (
									<Eye className="h-4 w-4" />
								)}
							</button>
						</div>
						{touched.password && errors.password && (
							<p className="text-red-500 text-xs mt-1">
								{passwordError || 'Password is required'}
							</p>
						)}
					</div>

					<div>
						<Label htmlFor="confirmPassword" className="block text-xs font-medium mb-2 uppercase">
							Confirm New Password
						</Label>
						<div className="relative">
							<Input
								id="confirmPassword"
								name="confirmPassword"
								type={showConfirmPassword ? "text" : "password"}
								placeholder="Confirm your new password"
								value={formData.confirmPassword}
								onChange={handleInputChange}
								onBlur={() => handleBlur(CONFIRM_PASSWORD)}
								aria-invalid={touched.confirmPassword && errors.confirmPassword}
								className="w-full pr-10"
							/>
							<button
								type="button"
								onClick={() => setShowConfirmPassword(!showConfirmPassword)}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
							>
								{showConfirmPassword ? (
									<EyeOff className="h-4 w-4" />
								) : (
									<Eye className="h-4 w-4" />
								)}
							</button>
						</div>
						{touched.confirmPassword && errors.confirmPassword && (
							<p className="text-red-500 text-xs mt-1">
								{confirmPasswordError}
							</p>
						)}
					</div>

					<Button
						type="submit"
						disabled={isLoading}
						className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isLoading ? 'Resetting...' : 'Reset Password'}
					</Button>

					<div className="text-center">
						<Link
							href="/signin"
							className="text-sm font-medium text-blue-600 hover:underline"
						>
							Back to Sign In
						</Link>
					</div>
				</form>
			</div>
		</div>
	);
}