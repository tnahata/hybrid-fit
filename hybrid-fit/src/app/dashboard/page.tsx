"use client";

import React, { useEffect, useState } from 'react';
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
import { UserDoc, WorkoutOverride, UserPlanProgress } from "@/models/User";
import { TrainingPlanDoc, TrainingPlanDay, TrainingPlanWeek } from "@/models/TrainingPlans";
import { WorkoutTemplateDoc } from "@/models/Workouts";
import { updatePlanOverrides, logWorkout, getUserProfile, ApiError } from '@/lib/api-client';
import LogResultsDialog from '@/components/LogResultsDialog';
import CalendarDialog from '@/components/CalendarDialog';
import { toast } from 'sonner'; 

// Enriched types matching API response
export interface EnrichedTrainingPlanDay extends TrainingPlanDay {
    workoutDetails: WorkoutTemplateDoc | null;
}

export interface EnrichedTrainingPlanWeek extends Omit<TrainingPlanWeek, 'days'> {
    days: EnrichedTrainingPlanDay[];
}

interface EnrichedTrainingPlanDoc extends Omit<TrainingPlanDoc, 'weeks'> {
    weeks: EnrichedTrainingPlanWeek[];
}

export interface EnrichedUserPlanProgress {
    planId: string;
    planName: string;
    totalWeeks: number;
    startedAt: Date;
    completedAt?: Date;
    currentWeek: number;
    currentDayIndex: number;
    isActive: boolean;
    overrides: Array<{
        weekNumber: number;
        dayOfWeek: string;
        customWorkoutId: string;
    }>;
    progressLog: Array<{
        date: Date;
        workoutTemplateId: string;
        status: "completed" | "skipped" | "missed";
        notes?: string;
    }>;
    planDetails: EnrichedTrainingPlanDoc;
}

interface EnrichedUserDoc extends Omit<UserDoc, 'trainingPlans'> {
    trainingPlans: EnrichedUserPlanProgress[];
}

interface ApiResponse {
    data: EnrichedUserDoc;
    success: boolean;
}

export default function Dashboard() {
    const [currentUser, setCurrentUser] = useState<EnrichedUserDoc | null>(null);
    const [selectedPlanId, setSelectedPlanId] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            setLoading(true);
            setError(null);

            const userData = await getUserProfile();
            setCurrentUser(userData);

            // Set default to first active plan
            const activePlan = userData.trainingPlans?.find(
                (p: any) => p.isActive
            );
            if (activePlan) {
                setSelectedPlanId(activePlan.planId);
            }
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

    // Get current selected plan
    const currentUserPlan: EnrichedUserPlanProgress | undefined = currentUser?.trainingPlans?.find(
        (p: EnrichedUserPlanProgress) => p.planId === selectedPlanId
    );

    // Handler for updating overrides
    const handleUpdateOverrides = async (overrides: any[]) => {
        if (!currentUserPlan) {
            throw new Error('No active plan selected');
        }

        try {
            await updatePlanOverrides(currentUserPlan.planId, overrides);

            // Refresh user data to show updated overrides
            await fetchUserData();

            // Show success toast
            toast.success('Schedule updated successfully!');

            console.log('Overrides updated successfully');
        } catch (error) {
            console.error('Error updating overrides:', error);

            const errorMessage = error instanceof ApiError
                ? error.message
                : 'Failed to update schedule';

            // Show error toast
            toast.error('Update Failed', {
                description: errorMessage,
            });

            throw error; // Re-throw so CalendarDialog can show error state
        }
    };

    // Handler for logging workout
    const handleLogWorkout = async (data: any) => {
        if (!currentUserPlan) {
            throw new Error('No active plan selected');
        }

        try {
            const result = await logWorkout(currentUserPlan.planId, data);

            // Refresh user data to show updated stats and progress
            await fetchUserData();

            // Show success toast with updated stats
            toast.success('Workout Logged!', {
                description: `Great job! Current streak: ${result.userStats.currentStreak} days 🔥`,
            });

            console.log('Workout logged successfully:', result);
        } catch (error) {
            console.error('Error logging workout:', error);

            const errorMessage = error instanceof ApiError
                ? error.message
                : 'Failed to log workout';

            // Show error toast
            toast.error('Logging Failed', {
                description: errorMessage,
            });

            throw error;
        }
    };

    // Get today's workout with full details
    const getTodaysWorkout = (): EnrichedTrainingPlanDay | null => {
        if (!currentUserPlan) return null;

        const currentWeek: EnrichedTrainingPlanWeek | undefined = currentUserPlan.planDetails.weeks.find(
            (w: EnrichedTrainingPlanWeek) => w.weekNumber === currentUserPlan.currentWeek
        );

        if (!currentWeek || !currentWeek.days[currentUserPlan.currentDayIndex]) {
            return null;
        }

        return currentWeek.days[currentUserPlan.currentDayIndex];
    };

    // Helper to get today's log entry if it exists
    const getTodaysLog = () => {
        if (!currentUserPlan || !todaysWorkout) return null;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const log = currentUserPlan.progressLog.find(l => {
            const logDate = new Date(l.date);
            logDate.setHours(0, 0, 0, 0);
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

    // Helper functions
    const getCompletedWorkoutsThisWeek = (): number => {
        if (!currentUserPlan) return 0;

        const weekStart: Date = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());

        return currentUserPlan.progressLog.filter((log) =>
            log.status === 'completed' &&
            new Date(log.date) >= weekStart
        ).length;
    };

    const calculatePlanProgress = (): number => {
        if (!currentUserPlan) return 0;
        return Math.round((currentUserPlan.currentWeek / currentUserPlan.totalWeeks) * 100);
    };

    const getTotalWeekWorkouts = (): number => {
        if (!currentUserPlan) return 7;

        const currentWeek: EnrichedTrainingPlanWeek | undefined = currentUserPlan.planDetails.weeks.find(
            (w: EnrichedTrainingPlanWeek) => w.weekNumber === currentUserPlan.currentWeek
        );

        return currentWeek?.days?.length || 7;
    };

    const today: string = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Get sport emoji
    const getSportEmoji = (sport: string): string => {
        const emojiMap: Record<string, string> = {
            'running': '🏃',
            'strength': '💪',
            'cycling': '🚴',
            'swimming': '🏊',
            'triathlon': '🏊🚴🏃',
        };
        return emojiMap[sport.toLowerCase()] || '💪';
    };

    // Check if today's workout is overridden
    const isWorkoutOverridden = (): boolean => {
        if (!currentUserPlan) return false;

        const currentDayOfWeek: string = daysOfWeek[currentUserPlan.currentDayIndex];
        return currentUserPlan.overrides.some(o =>
            o.weekNumber === currentUserPlan.currentWeek &&
            o.dayOfWeek.toString() === currentDayOfWeek
        );
    };

    // Format workout metrics for display
    const getWorkoutMetrics = (): Array<{ label: string; value: string }> => {
        if (!todaysWorkout?.workoutDetails) {
            return [
                { label: 'Week', value: currentUserPlan?.currentWeek.toString() || '-' },
                { label: 'Day', value: (currentUserPlan?.currentDayIndex + 1)?.toString() || '-' },
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

        // Fill remaining slots if less than 3 metrics
        while (metrics.length < 3) {
            metrics.push({
                label: 'Category',
                value: workout.category || '-'
            });
            break;
        }

        return metrics.slice(0, 3); // Only show 3 metrics
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    // Error state
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

    // No training plans state
    if (!currentUser.trainingPlans || currentUser.trainingPlans.length === 0) {
        return (
            <div className="min-h-screen bg-background">
                <main className="container mx-auto px-4 py-8 max-w-7xl">
                    <Card className="text-center py-12">
                        <CardHeader>
                            <div className="text-6xl mb-4">🏃</div>
                            <CardTitle className="text-2xl">No Training Plans</CardTitle>
                            <CardDescription className="mt-2">
                                Get started by creating or joining a training plan
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button size="lg" className="mt-4">
                                Browse Training Plans
                            </Button>
                        </CardContent>
                    </Card>
                </main>
            </div>
        );
    }

    // No plan selected state
    if (!currentUserPlan) {
        return null;
    }

    const sportEmoji: string = getSportEmoji(currentUserPlan.planDetails.sport);
    const completedThisWeek: number = getCompletedWorkoutsThisWeek();
    const totalWeekWorkouts: number = getTotalWeekWorkouts();
    const planProgress: number = calculatePlanProgress();
    const workoutIsCustom: boolean = isWorkoutOverridden();
    const workoutMetrics: Array<{ label: string; value: string }> = getWorkoutMetrics();

    // Determine plan status for conditional rendering
    const isPlanCompleted: boolean = !!currentUserPlan.completedAt;
    const isPlanActive: boolean = currentUserPlan.isActive && !isPlanCompleted;

    return (
        <div className="min-h-screen bg-background">
            <main className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="space-y-6">
                    {/* Plan Picker Header - ALWAYS VISIBLE */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-3xl font-bold text-foreground mb-2">
                                {sportEmoji} {isPlanActive ? "Today's Workout" : "Training Plan"}
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
                                        <SelectItem key={plan.planId} value={plan.planId}>
                                            <div className="flex items-center gap-2">
                                                <span>{plan.planName}</span>
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

                    {/* COMPLETED PLAN VIEW */}
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
                                            Completed on {new Date(currentUserPlan.completedAt).toLocaleDateString('en-US', {
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <p className="text-sm text-green-800">
                                        Congratulations on completing <strong>{currentUserPlan.planName}</strong>!
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

                    {/* INACTIVE PLAN VIEW */}
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
                                            {currentUserPlan.planName}
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

                    {/* ACTIVE PLAN - TODAY'S WORKOUT CARD */}
                    {isPlanActive && (
                        <Card>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">
                                                {currentUserPlan.planDetails.level}
                                            </span>
                                            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-muted text-muted-foreground">
                                                {currentUserPlan.planDetails.sport}
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
                                            {currentUserPlan.planName} — Week {currentUserPlan.currentWeek} / Day {currentUserPlan.currentDayIndex + 1}
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

                                {/* Plan Details Section */}
                                {currentUserPlan.planDetails.details && (
                                    <div className="p-4 rounded-lg bg-muted/50 border border-border">
                                        <h4 className="font-semibold text-sm mb-2">Plan Details</h4>
                                        <div className="space-y-1 text-sm">
                                            <p><span className="text-muted-foreground">Goal:</span> {currentUserPlan.planDetails.details.goal}</p>
                                            <p><span className="text-muted-foreground">Type:</span> {currentUserPlan.planDetails.details.planType}</p>
                                            {todaysWorkout?.workoutDetails?.tags && todaysWorkout.workoutDetails.tags.length > 0 && (
                                                <p>
                                                    <span className="text-muted-foreground">Tags:</span>{' '}
                                                    {todaysWorkout.workoutDetails.tags.join(', ')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <LogResultsDialog
                                        workout={todaysWorkout?.workoutDetails}
                                        existingLog={todaysLog}
                                        onSubmit={handleLogWorkout}
                                        trigger={
                                            <Button className="flex-1" size="lg">
                                                {hasLoggedToday ? 'Edit Results' : 'Log Results'}
                                            </Button>
                                        }
                                    />
                                    <CalendarDialog
                                        userPlan={currentUserPlan}
                                        onUpdateOverrides={handleUpdateOverrides}
                                        className="flex-1"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    {/* Stats Cards */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Workouts</p>
                                        <h3 className="text-3xl font-bold text-primary mt-1">
                                            {currentUser.totalWorkoutsCompleted}
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-1">all time</p>
                                    </div>
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                        <span className="text-2xl">{sportEmoji}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Current Streak</p>
                                        <h3 className="text-3xl font-bold text-primary mt-1">
                                            {currentUser.currentStreak} days
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Best: {currentUser.longestStreak} days
                                        </p>
                                    </div>
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                        <span className="text-2xl">🔥</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Plan Progress</p>
                                        <h3 className="text-3xl font-bold text-primary mt-1">
                                            {planProgress}%
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Week {currentUserPlan.currentWeek} of {currentUserPlan.totalWeeks}
                                        </p>
                                    </div>
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                        <span className="text-2xl">📈</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Progress Cards */}
                    <div className="grid gap-6 md:grid-cols-2">
                        {isPlanActive &&
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">📅 This Week's Progress</CardTitle>
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
                                <CardTitle className="text-lg">🎯 Goal Progress</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-sm text-muted-foreground">{currentUserPlan.planName}</span>
                                            <span className="text-sm font-semibold">{planProgress}%</span>
                                        </div>
                                        <Progress value={planProgress} className="h-3" />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Week {currentUserPlan.currentWeek} of {currentUserPlan.totalWeeks}
                                        </p>
                                    </div>
                                    {currentUserPlan.startedAt && (
                                        <div className="pt-2 border-t border-border">
                                            <p className="text-xs text-muted-foreground">
                                                Started: {new Date(currentUserPlan.startedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Activity */}
                    {currentUserPlan.progressLog.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">📊 Recent Activity</CardTitle>
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
                                                                {new Date(log.date).toLocaleDateString('en-US', {
                                                                    weekday: 'short',
                                                                    month: 'short',
                                                                    day: 'numeric'
                                                                })}
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
        </div>
    );
}