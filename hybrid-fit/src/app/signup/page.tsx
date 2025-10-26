'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { XIcon, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { StepCard } from '@/components/signup/StepCard';
import { signIn, useSession } from 'next-auth/react';
import { toast } from 'sonner';

export default function Signup() {
	const router = useRouter();
	const { data: session, status } = useSession();
	const [step, setStep] = useState(1);
	const [showPassword, setShowPassword] = useState(false);

	useEffect(() => {
		if (status === "authenticated") {
			const pendingPlanId = localStorage.getItem("pendingEnrollment");

			if (pendingPlanId) {
				enrollInPendingPlan(pendingPlanId);
			}
		}
	}, [status]);

	const enrollInPendingPlan = async (planId: string) => {
		try {
			const response = await fetch("/api/users/me/enroll", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ planId }),
			});

			const data = await response.json();

			localStorage.removeItem("pendingEnrollment");

			if (response.ok) {
				toast.success("Enrolled successfully!", {
					description: `You've been enrolled in ${data.plan.name}`,
				});
				router.push("/dashboard");
				router.refresh();
			} else {
				if (response.status === 409) {
					toast.info("Already enrolled", {
						description: "You were already enrolled in this plan",
					});
				} else {
					toast.error("Enrollment failed", {
						description: data.error,
					});
				}
				router.push("/training-plans");
			}
		} catch (error) {
			console.error("Pending enrollment error:", error);
			localStorage.removeItem("pendingEnrollment");
			toast.error("Enrollment failed", {
				description: "Please try enrolling again from training plans",
			});
			router.push("/training-plans");
		}
	};

	const stepData = [
		{
			title: 'Track Every Workout',
			content: 'Log your sessions effortlessly — strength, drills, or conditioning — and watch your progress update in real time.',
			image: '/second.png'
		},
		{
			title: 'Follow Smarter Training Plans',
			content: 'Choose from structured, sport-specific programs tailored to your goals. Customize workouts, swap exercises, and stay on track week by week.',
			image: '/third.png'
		},
		{
			title: 'AI Powered Recommendations',
			content: 'Our smart engine learns from your compeleted workouts and sport preferences to suggest what to do next - smarter training, personalized for you.', // TODO: Update with actual content
			image: '/fourth.png'
		}
	];
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		password: ''
	});

	const [errors, setErrors] = useState({
		name: false,
		email: false,
		password: false
	});

	const [passwordError, setPasswordError] = useState<string>('');

	const [touched, setTouched] = useState({
		name: false,
		email: false,
		password: false
	});

	const [isSubmitting, setIsSubmitting] = useState(false);

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

		if (name === 'password') {
			const error = validatePassword(value);
			setPasswordError(error);
			setErrors(prev => ({
				...prev,
				password: error !== ''
			}));
		}
	};

	const handleBlur = (field: 'name' | 'email' | 'password') => {
		setTouched(prev => ({
			...prev,
			[field]: true
		}));

		// Validate on blur
		if (field === 'password') {
			const error = validatePassword(formData.password);
			setPasswordError(error);
			setErrors(prev => ({
				...prev,
				password: error !== ''
			}));
		} else if (!formData[field].trim()) {
			setErrors(prev => ({
				...prev,
				[field]: true
			}));
		}
	};

	const validateForm = () => {
		const passwordValidationError = validatePassword(formData.password);
		const newErrors = {
			name: !formData.name.trim(),
			email: !formData.email.trim(),
			password: !formData.password.trim() || passwordValidationError !== ''
		};

		setErrors(newErrors);
		setPasswordError(passwordValidationError);
		setTouched({
			name: true,
			email: true,
			password: true
		});

		return !newErrors.name && !newErrors.email && !newErrors.password;
	};

	const handleContinue = () => {
		if (validateForm()) {
			setStep(2);
		}
	};

	const handleNext = () => {
		setStep(prev => prev + 1);
	};

	const handleBack = () => {
		setStep(prev => prev - 1);
	};

	const handleSubmit = async () => {
		setIsSubmitting(true);

		try {
			const signupResponse = await fetch('/api/auth/signup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: formData.name,
					email: formData.email,
					password: formData.password,
				}),
			});

			const signupData = await signupResponse.json();

			if (!signupResponse.ok) {
				if (signupData.details) {
					const errorMessages = Object.entries(signupData.details)
						.map(([field, errors]) => `${field}: ${(errors as string[]).join(', ')}`)
						.join('\n');

					toast.error('Validation Error', {
						description: errorMessages,
					});
				} else {
					toast.error(signupData.error || 'Signup failed');
				}
				setIsSubmitting(false);
				return;
			}

			toast.success('Account created! Logging you in...');

			const loginResult = await signIn('credentials', {
				email: formData.email,
				password: formData.password,
				redirect: false,
			});

			if (loginResult?.error) {
				toast.error('Account created but login failed', {
					description: 'Please login manually',
				});
				router.push('/signin');
			} else {
				toast.success('Welcome to HybridFit!');
				router.push('/dashboard');
				router.refresh();
			}
		} catch (error) {
			console.error('Signup error:', error);
			toast.error('Something went wrong', {
				description: 'Please try again',
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClose = () => {
		router.push('/');
	};

	return (
		<Dialog open={true}>
			<DialogContent
				className="max-w-4xl w-full p-0 overflow-hidden"
				showCloseButton={false}
			>

				<button
					onClick={handleClose}
					className="absolute top-4 right-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
				>
					<XIcon className="h-4 w-4" />
					<span className="sr-only">Close</span>
				</button>
				{step === 1 && (
					<div className="grid md:grid-cols-2 h-full">

						<div className="p-8 flex flex-col justify-center">
							<div className="mb-8">
								<h2 className="text-xl font-bold mb-1">HYBRID FIT</h2>
							</div>

							<div className="space-y-6">
								<h1 className="text-2xl font-bold">Create your free account</h1>

								<div className="space-y-4">
									<div>
										<label htmlFor="name" className="block text-xs font-medium mb-2 uppercase">
											Name
										</label>
										<Input
											id="name"
											name="name"
											type="text"
											placeholder="Enter your name"
											value={formData.name}
											onChange={handleInputChange}
											onBlur={() => handleBlur('name')}
											aria-invalid={touched.name && errors.name}
											className="w-full"
										/>
										{touched.name && errors.name && (
											<p className="text-red-500 text-xs mt-1">Name is required</p>
										)}
									</div>

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
											aria-invalid={touched.email && errors.email}
											className="w-full"
										/>
										{touched.email && errors.email && (
											<p className="text-red-500 text-xs mt-1">Email is required</p>
										)}
									</div>

									<div>
										<label htmlFor="password" className="block text-xs font-medium mb-2 uppercase">
											Password
										</label>
										<div className="relative">
											<Input
												id="password"
												name="password"
												type={showPassword ? "text" : "password"}
												placeholder="Enter your password"
												value={formData.password}
												onChange={handleInputChange}
												onBlur={() => handleBlur('password')}
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

									<Button
										onClick={handleContinue}
										className="w-full bg-orange-500 hover:bg-orange-600 text-white"
									>
										Lets get started
									</Button>
								</div>

								<div className="text-center">
									<a href="/signin" className="text-sm text-blue-600 hover:underline">
										Log in to an existing account
									</a>
								</div>

								<div className="text-xs text-gray-500">
									By clicking &quot;Continue with Email&quot; you agree to the{' '}
									<a href="#" className="underline">Terms of Service</a> and acknowledge the{' '}
									<a href="#" className="underline">Privacy Notice</a>.
								</div>
							</div>
						</div>

						<div className="hidden md:block relative bg-teal-400">
							<Image
								src="/first.png"
								alt="Fitness illustration"
								fill
								className="object-cover"
								priority
							/>
						</div>
					</div>
				)}

				{step === 2 && (
					<StepCard
						title={stepData[0].title}
						content={stepData[0].content}
						image={stepData[0].image}
						onNext={handleNext}
						onBack={handleBack}
					/>
				)}

				{step === 3 && (
					<StepCard
						title={stepData[1].title}
						content={stepData[1].content}
						image={stepData[1].image}
						onNext={handleNext}
						onBack={handleBack}
					/>
				)}

				{step === 4 && (
					<StepCard
						title={stepData[2].title}
						content={stepData[2].content}
						image={stepData[2].image}
						onNext={handleSubmit}
						onBack={handleBack}
						buttonLabel={isSubmitting ? "Creating account..." : "Get Started"}
						disabled={isSubmitting}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}
