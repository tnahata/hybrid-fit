"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { WorkoutLog, WorkoutOverride } from "@/models/User";
import { EnrichedTrainingPlanDay, EnrichedTrainingPlanWeek, WorkoutStructureItem, EnrichedUserPlanProgress, EnrichedUserDoc } from '../../../types/enrichedTypes';
import { WorkoutTemplateDoc } from "@/models/Workouts";
import { updatePlanOverrides, logWorkout, updateWorkout, getUserProfile, ApiError } from '@/lib/api-client';
import LogResultsDialog from '@/components/LogResultsDialog';
import CalendarDialog from '@/components/CalendarDialog';
import { toast } from 'sonner';
import Link from 'next/link';
import { getStartOfDay, returnUTCDateInUSLocaleFormat } from '@/lib/dateUtils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Dumbbell, ChevronDown } from 'lucide-react';
import { Goal, Logs, LoaderCircle } from 'lucide-react';
import { Clock, Flame, Tag } from '@/components/icons/icons';

interface FirstRowCardProps {
	paragraphText: string;
	h3Text: string | number;
	secondParagraphText: string;
	IconComponent: React.ComponentType<{ className?: string }>;
}

function FirstRowCard({ paragraphText, h3Text, secondParagraphText, IconComponent }: FirstRowCardProps) {
	return ( 
		<Card>
			<CardContent className="pt-6">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-sm text-muted-foreground">{paragraphText}</p>
						<h3 className="text-3xl font-bold text-primary mt-1">
							{h3Text}
						</h3>
						<p className="text-xs text-muted-foreground mt-1">{secondParagraphText}</p>
					</div>
					<div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
						<span className="text-2xl"><IconComponent /></span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

export default function Dashboard() {
	const [currentUser, setCurrentUser] = useState<EnrichedUserDoc | null>(null);
	const [selectedPlanId, setSelectedPlanId] = useState<string>("");
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const { data: session, status } = useSession();
	const router = useRouter();

	useEffect(() => {
		if (status === "unauthenticated") {
			router.push("/signin");
		}
	}, [status, router]);

	useEffect(() => {
		fetchUserData();
	}, []);

	const fetchUserData = async (): Promise<void> => {
		try {
			setLoading(true);
			setError(null);

			const userData = await getUserProfile();
			const activePlan: EnrichedUserPlanProgress | undefined = userData.trainingPlans?.find(
				(p: EnrichedUserPlanProgress) => p.isActive
			);
			const planIdToSelect = activePlan?._id || userData.trainingPlans?.[0]?._id || "";
			console.log(planIdToSelect);
			setSelectedPlanId(planIdToSelect);
			setCurrentUser(userData);

		} catch (err) {
			const errorMessage = err instanceof ApiError
				? err.message
				: 'Failed to fetch user data';
			console.error('Error fetching user data:', err);
			setError(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	const currentUserPlan: EnrichedUserPlanProgress | undefined = useMemo(() => {
		if (!currentUser?.trainingPlans?.length || !selectedPlanId) {
			return undefined;
		}

		return currentUser.trainingPlans.find(
			(p: EnrichedUserPlanProgress) => p._id === selectedPlanId
		);
	}, [currentUser, selectedPlanId]);

	const handleUpdateOverrides = async (overrides: WorkoutOverride[]): Promise<void> => {
		if (!currentUserPlan) {
			throw new Error('No active plan selected');
		}

		try {
			await updatePlanOverrides(currentUserPlan._id, overrides);

			await fetchUserData();

			toast.success('Schedule updated successfully!');

		} catch (error) {
			console.error('Error updating overrides:', error);

			const errorMessage = error instanceof ApiError
				? error.message
				: 'Failed to update schedule';

			toast.error('Update Failed', {
				description: errorMessage,
			});

			throw error;
		}
	};

	const handleUpdateWorkout = async (data: WorkoutLog, logId: string): Promise<void> => {
		if (!currentUserPlan) {
			throw new Error('No active plan selected');
		}

		try {
			const result = await updateWorkout(logId, currentUserPlan._id, data);

			await fetchUserData();

			toast.success('Workout log updated!', {
				description: `Great job! Current streak: ${result.userStats.currentStreak} days 🔥`
			});
		} catch (error) {

			const errorMessage = error instanceof ApiError
				? error.message
				: 'Failed to log workout';

			toast.error('Failed to update workout log!', {
				description: errorMessage,
			});

			throw error;
		}
	}

	const handleLogWorkout = async (data: WorkoutLog): Promise<void> => {
		if (!currentUserPlan) {
			throw new Error('No active plan selected');
		}

		try {
			const result = await logWorkout(currentUserPlan._id, data);

			await fetchUserData();

			toast.success('Workout Logged!', {
				description: `Great job! Current streak: ${result.userStats.currentStreak} days 🔥`
			});

		} catch (error) {
			console.error('Error logging workout:', error);

			const errorMessage = error instanceof ApiError
				? error.message
				: 'Failed to log workout';

			toast.error('Failed to log workout!', {
				description: errorMessage,
			});

			throw error;
		}
	};

	const getTodaysWorkout = (): EnrichedTrainingPlanDay | null => {
		if (!currentUserPlan) return null;

		const currentWeek: EnrichedTrainingPlanWeek | undefined = currentUserPlan.weeks.find(
			(w: EnrichedTrainingPlanWeek) => w.weekNumber === currentUserPlan.currentWeek
		);

		if (!currentWeek || !currentWeek.days[currentUserPlan.currentDayIndex]) {
			return null;
		}

		const baseDay = currentWeek.days[currentUserPlan.currentDayIndex];

		const daysOfWeekMap = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
		const todayDayOfWeek = daysOfWeekMap[currentUserPlan.currentDayIndex];

		const override = currentUserPlan.overrides.find(o =>
			o.weekNumber === currentUserPlan.currentWeek &&
			o.dayOfWeek === todayDayOfWeek
		);

		if (override) {
			for (const week of currentUserPlan.weeks) {
				for (const day of week.days) {
					if (day.workoutTemplateId === override.customWorkoutId) {
						return {
							...baseDay,
							workoutTemplateId: day.workoutTemplateId,
							workoutDetails: day.workoutDetails
						};
					}
				}
			}
		}

		return baseDay;
	};

	const getTodaysLog = (): WorkoutLog | null => {
		if (!currentUserPlan || !todaysWorkout) return null;

		const today = getStartOfDay();

		const log = currentUserPlan.progressLog.find(l => {
			const logDate = getStartOfDay(l.date);
			return logDate.getTime() === today.getTime() &&
				l.workoutTemplateId === todaysWorkout.workoutTemplateId;
		});

		return log || null;
	};

	const todaysWorkout: EnrichedTrainingPlanDay | null = getTodaysWorkout();
	const todaysLog = getTodaysLog();
	const hasLoggedToday = !!todaysLog;
	const daysOfWeek: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
	const currentDayName: string = currentUserPlan ? daysOfWeek[currentUserPlan.currentDayIndex] : '';

	const getCompletedWorkoutsThisWeek = (): number => {
		if (!currentUserPlan) return 0;

		const now = getStartOfDay();
		const dayOfWeek = now.getUTCDay();
		const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

		const weekStart = new Date(Date.UTC(
			now.getUTCFullYear(),
			now.getUTCMonth(),
			now.getUTCDate() - daysToMonday,
			0, 0, 0, 0
		));

		return currentUserPlan.progressLog.filter((log) => {
			const logDate = new Date(log.date);
			const logDateUTC = new Date(Date.UTC(
				logDate.getUTCFullYear(),
				logDate.getUTCMonth(),
				logDate.getUTCDate(),
				0, 0, 0, 0
			));
			return log.status === 'completed' && logDateUTC >= weekStart;
		}).length;
	};

	const calculatePlanProgress = (): number => {
		if (!currentUserPlan) return 0;
		return Math.round((currentUserPlan.currentWeek / currentUserPlan.durationWeeks) * 100);
	};

	const getTotalWeekWorkouts = (): number => {
		if (!currentUserPlan) return 7;

		const currentWeek: EnrichedTrainingPlanWeek | undefined = currentUserPlan.weeks.find(
			(w: EnrichedTrainingPlanWeek) => w.weekNumber === currentUserPlan.currentWeek
		);

		return currentWeek?.days?.length || 7;
	};

	const today: string = returnUTCDateInUSLocaleFormat();

	const isWorkoutOverridden = (): boolean => {
		if (!currentUserPlan) return false;

		const currentDayOfWeek: string = daysOfWeek[currentUserPlan.currentDayIndex];
		return currentUserPlan.overrides.some(o =>
			o.weekNumber === currentUserPlan.currentWeek &&
			o.dayOfWeek.toString() === currentDayOfWeek
		);
	};

	const getWorkoutMetrics = (): Array<{ label: string; value: string }> => {
		if (!todaysWorkout?.workoutDetails) {
			return [
				{ label: 'Week', value: currentUserPlan?.currentWeek.toString() || '-' },
				{ label: 'Day', value: (currentUserPlan?.currentDayIndex ? currentUserPlan?.currentDayIndex + 1 : 1)?.toString() || '-' },
				{ label: 'Status', value: 'Scheduled' }
			];
		}

		const workout: WorkoutTemplateDoc = todaysWorkout.workoutDetails;
		const metrics: Array<{ label: string; value: string }> = [];

		if (workout.metrics.distanceMiles) {
			metrics.push({
				label: 'Distance',
				value: `${workout.metrics.distanceMiles} mi`
			});
		}

		if (workout.metrics.durationMins) {
			metrics.push({
				label: 'Duration',
				value: `${workout.metrics.durationMins} min`
			});
		}

		metrics.push({
			label: 'Difficulty',
			value: workout.difficulty.charAt(0).toUpperCase() + workout.difficulty.slice(1)
		});

		while (metrics.length < 3) {
			metrics.push({
				label: 'Category',
				value: workout.category || '-'
			});
			break;
		}

		return metrics.slice(0, 3);
	};

	const ExpandableExercises = () => {
		const [expanded, setExpanded] = useState(false);

		if (!todaysWorkout?.workoutDetails?.structure || todaysWorkout.workoutDetails.structure.length === 0) {
			return (
				<div className="mb-4">
					<button
						disabled
						className="w-full px-4 py-3 bg-muted/50 border-2 border-muted rounded-lg font-semibold text-muted-foreground flex justify-between items-center cursor-not-allowed"
					>
						<div className="flex items-center gap-2">
							<Dumbbell className="w-5 h-5" />
							<span>No Individual Exercises</span>
						</div>
					</button>
					<p className="text-xs text-muted-foreground mt-2 text-center">
						This workout is completed as a single continuous activity
					</p>
				</div>
			);
		}

		const formatExerciseDetails = (item: WorkoutStructureItem): string => {
			const parts: string[] = [];

			if (item.sets && item.reps) {
				parts.push(`${item.sets} sets × ${item.reps} reps`);
			} else if (item.sets) {
				parts.push(`${item.sets} sets`);
			} else if (item.reps) {
				parts.push(`${item.reps} reps`);
			}

			if (item.duration) {
				parts.push(`${item.duration}s`);
			}

			if (item.restSeconds) {
				parts.push(`${item.restSeconds}s rest`);
			}

			return parts.join(' • ');
		};

		return (
			<div className="mb-4">
				<button
					onClick={() => setExpanded(!expanded)}
					className="w-full px-4 py-3 bg-gradient-to-r from-primary/5 to-primary/10 border-2 border-primary rounded-lg font-semibold text-primary flex justify-between items-center hover:from-primary/10 hover:to-primary/20 transition-all"
				>
					<div className="flex items-center gap-2">
						<Dumbbell className="w-5 h-5" />
						<span>Show Exercises ({todaysWorkout.workoutDetails.structure.length})</span>
					</div>
					<ChevronDown className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
				</button>

				{expanded && (
					<div className="mt-3 p-4 bg-background border-2 border-primary/20 rounded-lg">
						<div className="text-sm space-y-3">
							{todaysWorkout.workoutDetails.structure.map((item: WorkoutStructureItem, index: number) => (
								<div key={index} className="pb-3 border-b border-border last:border-b-0 last:pb-0">
									<div className="font-semibold text-foreground mb-1">
										{index + 1}. {item.exercise?.name || 'Exercise'}
									</div>
									<div className="text-xs text-muted-foreground">
										{formatExerciseDetails(item)}
									</div>
									{item.notes && (
										<div className="text-xs text-muted-foreground mt-1 italic">
											Notes: {item.notes}
										</div>
									)}
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		);
	};

	if (status === "loading" || loading) {
		return (
			<LoadingSpinner spinnerText='Loading your dashboard...' className='' />
		);
	}

	if (!session) {
		return;
	}

	if (error || !currentUser) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<Card className="max-w-md">
					<CardContent className="pt-6">
						<h2 className="text-xl font-semibold mb-2">Unable to Load Dashboard</h2>
						<p className="text-muted-foreground mb-4">
							{error || "Please try logging in again"}
						</p>
						<Button onClick={fetchUserData}>
							Retry
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!currentUser.trainingPlans || currentUser.trainingPlans.length === 0) {
		return (
			<div className="min-h-screen bg-background">
				<main className="container mx-auto px-4 py-8 max-w-7xl">
					<Card className="text-center py-12">
						<CardHeader>
							<CardTitle className="text-2xl">No Training Plans</CardTitle>
							<CardDescription className="mt-2">
								Get started by creating or joining a training plan
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Link href="/training-plans">
								<Button size="lg" className="mt-4">
									Browse Training Plans
								</Button>
							</Link>

						</CardContent>
					</Card>
				</main>
			</div>
		);
	}

	if (currentUser && currentUser.trainingPlans.length > 0 && !currentUserPlan) {
		return (
			<LoadingSpinner spinnerText='Loading your dashboard...' className='' />
		);
	}

	if (!currentUserPlan) {
		return null;
	}

	const completedThisWeek: number = getCompletedWorkoutsThisWeek();
	const totalWeekWorkouts: number = getTotalWeekWorkouts();
	const planProgress: number = calculatePlanProgress();
	const workoutIsCustom: boolean = isWorkoutOverridden();
	const workoutMetrics: Array<{ label: string; value: string }> = getWorkoutMetrics();

	const isPlanCompleted: boolean = !!currentUserPlan.completedAt;
	const isPlanActive: boolean = currentUserPlan.isActive && !isPlanCompleted;

	return (
		<div className="min-h-screen bg-background">
			<main className="container mx-auto px-4 py-8 max-w-7xl pb-24">
				<div className="space-y-6">

					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
						<div>
							<h2 className="text-3xl font-bold text-foreground mb-2">
								{isPlanActive ? "Today's Workout" : "Training Plan"}
							</h2>
							<p className="text-muted-foreground">{today}</p>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-sm text-muted-foreground hidden sm:inline">Training Plan:</span>
							<Select value={selectedPlanId} onValueChange={(value: string) => setSelectedPlanId(value)}>
								<SelectTrigger className="w-[280px]">
									<SelectValue placeholder="Select a training plan" />
								</SelectTrigger>
								<SelectContent>
									{currentUser.trainingPlans.map((plan: EnrichedUserPlanProgress) => (
										<SelectItem key={plan._id} value={plan._id}>
											<div className="flex items-center gap-2">
												<span>{plan.name}</span>
												{plan.isActive && (
													<span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary ml-1">
														Active
													</span>
												)}
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					{isPlanCompleted && (
						<Card className="border-green-200 bg-green-50/50">
							<CardHeader>
								<div className="flex items-center gap-3">
									<div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
										<span className="text-2xl">🎉</span>
									</div>
									<div>
										<CardTitle className="text-xl text-green-900">Plan Completed!</CardTitle>
										<CardDescription className="text-green-700">
											Completed on {returnUTCDateInUSLocaleFormat(currentUserPlan.completedAt)}
										</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									<p className="text-sm text-green-800">
										Congratulations on completing <strong>{currentUserPlan.name}</strong>!
										You can view your historical data and progress below.
									</p>
									<div className="flex gap-2">
										<div className="flex-1">
											<CalendarDialog userPlan={currentUserPlan} />
										</div>
										<Button className="flex-1">Start New Plan</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					)}

					{!isPlanActive && !isPlanCompleted && (
						<Card className="border-orange-200 bg-orange-50/50">
							<CardHeader>
								<div className="flex items-center gap-3">
									<div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
										<span className="text-2xl">⏸️</span>
									</div>
									<div>
										<CardTitle className="text-xl text-orange-900">Plan Not Active</CardTitle>
										<CardDescription className="text-orange-700">
											{currentUserPlan.name}
										</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									<p className="text-sm text-orange-800">
										This training plan is not currently active. You can view its details and historical data below,
										or activate it to start tracking workouts.
									</p>
									<div className="flex gap-2">
										<Button variant="outline" className="flex-1">View Plan Details</Button>
										<Button className="flex-1">Activate Plan</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					)}

					{isPlanActive && (
						<Card>
							<CardHeader>
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-2 flex-wrap">
											<span className="text-xs font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">
												{currentUserPlan.level}
											</span>
											<span className="text-xs font-semibold px-2 py-1 rounded-full bg-muted text-muted-foreground">
												{currentUserPlan.sport}
											</span>
											{workoutIsCustom && (
												<span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-700">
													Custom
												</span>
											)}
											{todaysWorkout?.workoutDetails && (
												<span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700">
													{todaysWorkout.workoutDetails.category}
												</span>
											)}
										</div>
										<CardDescription className="mb-1">
											{currentUserPlan.name} — Week {currentUserPlan.currentWeek} / Day {currentUserPlan.currentDayIndex + 1}
										</CardDescription>
										<CardTitle className="text-2xl">
											{todaysWorkout?.workoutDetails?.name || `${currentDayName}'s Workout`}
										</CardTitle>
										{todaysWorkout?.workoutDetails?.description && (
											<p className="text-sm text-muted-foreground mt-2">
												{todaysWorkout.workoutDetails.description}
											</p>
										)}
									</div>
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-3 gap-4 text-center">
									{workoutMetrics.map((metric: { label: string; value: string }, i: number) => (
										<div key={i} className="p-4 rounded-lg bg-muted">
											<div className="text-2xl font-bold text-primary">{metric.value}</div>
											<div className="text-xs text-muted-foreground mt-1">{metric.label}</div>
										</div>
									))}
								</div>

								{currentUserPlan.details && (
									<div className="p-4 rounded-lg bg-muted/50 border border-border">
										<h4 className="font-semibold text-sm mb-2">Plan Details</h4>
										<div className="space-y-1 text-sm">
											<p><span className="text-muted-foreground">Goal:</span> {currentUserPlan.details.goal}</p>
											<p><span className="text-muted-foreground">Type:</span> {currentUserPlan.details.planType}</p>
											{todaysWorkout?.workoutDetails?.tags && todaysWorkout.workoutDetails.tags.length > 0 && (
												<p>
													<span className="text-muted-foreground">Tags:</span>{' '}
													{todaysWorkout.workoutDetails.tags.join(', ')}
												</p>
											)}
										</div>
									</div>
								)}

								<ExpandableExercises />

								<CalendarDialog
									userPlan={currentUserPlan}
									onUpdateOverrides={handleUpdateOverrides}
									className="w-full"
								/>
							</CardContent>
						</Card>
					)}

					<div className="grid gap-4 md:grid-cols-3">
						<FirstRowCard
							paragraphText='Total Workouts'
							h3Text={currentUser.totalWorkoutsCompleted}
							secondParagraphText='all time'
							IconComponent={Tag}
						/>
						<FirstRowCard
							paragraphText='Current Streak'
							h3Text={`${currentUser.currentStreak} days`}
							secondParagraphText={`Best: ${currentUser.longestStreak} days`}
							IconComponent={Flame}
						/>
						<FirstRowCard
							paragraphText='Active Minutes'
							h3Text={currentUserPlan.totalActiveMinutes}
							secondParagraphText='in this plan'
							IconComponent={Clock}
						/>
					</div>

					<div className="grid gap-6 md:grid-cols-2">
						{isPlanActive &&
							<Card>
								<CardHeader>
									<CardTitle className="text-lg"><LoaderCircle className='inline' /> This Week&apos;s Progress</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-3">
										<div>
											<div className="flex justify-between text-sm mb-1">
												<span className="text-muted-foreground">Workouts Completed</span>
												<span className="font-semibold">
													{completedThisWeek} / {totalWeekWorkouts}
												</span>
											</div>
											<Progress
												value={(completedThisWeek / totalWeekWorkouts) * 100}
												className="h-2"
											/>
										</div>
									</div>
								</CardContent>
							</Card>
						}

						<Card className={isPlanActive ? '' : 'md:col-span-2'}>
							<CardHeader>
								<CardTitle className="text-lg"><Goal className='inline'></Goal> Goal Progress</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div>
										<div className="flex justify-between mb-2">
											<span className="text-sm text-muted-foreground">{currentUserPlan.name}</span>
											<span className="text-sm font-semibold">{planProgress}%</span>
										</div>
										<Progress value={planProgress} className="h-3" />
										<p className="text-xs text-muted-foreground mt-1">
											Week {currentUserPlan.currentWeek} of {currentUserPlan.durationWeeks}
										</p>
									</div>
									{currentUserPlan.startedAt && (
										<div className="pt-2 border-t border-border">
											<p className="text-xs text-muted-foreground">
												Started: {returnUTCDateInUSLocaleFormat(currentUserPlan.startedAt)}
											</p>
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					</div>

					{currentUserPlan.progressLog.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle className="text-lg"><Logs className='inline'/> Activity Log</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									{currentUserPlan.progressLog
										.slice(-5)
										.reverse()
										.map((log, i: number) => {
											const statusEmoji: string = log.status === 'completed' ? '✅' :
												log.status === 'skipped' ? '⏭️' : '❌';

											return (
												<div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
													<div className="flex items-center gap-3">
														<span className="text-lg">{statusEmoji}</span>
														<div>
															<span className="text-sm font-medium">
																{returnUTCDateInUSLocaleFormat(log.date)}
															</span>
															{log.notes && (
																<p className="text-xs text-muted-foreground">{log.notes}</p>
															)}
														</div>
													</div>
													<span className="text-xs text-muted-foreground capitalize">
														{log.status}
													</span>
												</div>
											);
										})}
								</div>
							</CardContent>
						</Card>
					)}
				</div>
			</main>

			{isPlanActive && (
				<LogResultsDialog
					workout={todaysWorkout?.workoutDetails}
					existingLog={todaysLog}
					onCreateLog={handleLogWorkout}
					onUpdateLog={handleUpdateWorkout}
					trigger={
						<div className="fixed bottom-8 right-8 z-50">
							<Button
								size="lg"
								className={`
									px-6 py-4 rounded-xl shadow-xl transition-all hover:scale-105
									${hasLoggedToday
										? 'bg-gradient-to-br from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 shadow-gray-500/40 hover:shadow-gray-500/60'
										: 'bg-gradient-to-br from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-primary/40 hover:shadow-primary/60'
									}
								`}
							>
								<span className="font-bold whitespace-nowrap">
									{hasLoggedToday ? 'Edit Results' : 'Log Results'}
								</span>
								{!hasLoggedToday && (
									<div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse shadow-lg">
										<span className="text-white text-xs font-bold">!</span>
									</div>
								)}
							</Button>
						</div>
					}
				/>
			)}
		</div>
	);
}