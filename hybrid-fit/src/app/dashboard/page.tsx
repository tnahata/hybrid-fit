"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Calendar } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
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

// Enriched types matching API response
interface EnrichedTrainingPlanDay extends TrainingPlanDay {
    workoutDetails: WorkoutTemplateDoc | null;
}

interface EnrichedTrainingPlanWeek extends Omit<TrainingPlanWeek, 'days'> {
    days: EnrichedTrainingPlanDay[];
}

interface EnrichedTrainingPlanDoc extends Omit<TrainingPlanDoc, 'weeks'> {
    weeks: EnrichedTrainingPlanWeek[];
}

interface EnrichedUserPlanProgress {
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

export default function Dashboard(): JSX.Element {
    const [currentUser, setCurrentUser] = useState<EnrichedUserDoc | null>(null);
    const [selectedPlanId, setSelectedPlanId] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserData = async (): Promise<void> => {
            try {
                const response: Response = await fetch("/api/users/me", {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch user data");
                }

                const json: ApiResponse = await response.json();
                setCurrentUser(json.data);

                // Set default to first active plan, or first plan if no active plans
                const activePlan: EnrichedUserPlanProgress | undefined = json.data.trainingPlans?.find(
                    (p: EnrichedUserPlanProgress) => p.isActive
                );

                if (activePlan) {
                    setSelectedPlanId(activePlan.planId);
                } else if (json.data.trainingPlans && json.data.trainingPlans.length > 0) {
                    setSelectedPlanId(json.data.trainingPlans[0].planId);
                }
            } catch (err: unknown) {
                const errorMessage: string = err instanceof Error ? err.message : "Unknown error occurred";
                console.error("Failed to fetch user data:", errorMessage);
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    // Get current selected plan
    const currentUserPlan: EnrichedUserPlanProgress | undefined = currentUser?.trainingPlans?.find(
        (p: EnrichedUserPlanProgress) => p.planId === selectedPlanId
    );

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

    const todaysWorkout: EnrichedTrainingPlanDay | null = getTodaysWorkout();
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
                    <CardHeader>
                        <CardTitle>Unable to Load Dashboard</CardTitle>
                        <CardDescription>
                            {error || "Please try logging in again"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => window.location.reload()}>
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

    return (
        <div className="min-h-screen bg-background">
            <main className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="space-y-6">
                    {/* Plan Picker Header - ALWAYS VISIBLE */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-3xl font-bold text-foreground mb-2">
                                {sportEmoji} Today's Workout
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

                    {/* Today's Workout Card */}
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
                                <Button className="flex-1" size="lg">Start Workout</Button>
                                <Button variant="secondary" className="flex-1" size="lg">Log Results</Button>
                            </div>
                            <Separator />
                            <div className="flex justify-center">
                                <Button variant="outline" className="gap-2 w-full">
                                    <Calendar className="h-4 w-4" />
                                    View Program Calendar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

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

                        <Card>
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