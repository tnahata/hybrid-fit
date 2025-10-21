"use client";

import React, { useState } from 'react';
import { Calendar, CheckCircle2, XCircle, Circle, Clock, CircleSlash } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EnrichedUserPlanProgress, EnrichedTrainingPlanWeek } from '../app/dashboard';

interface CalendarDialogProps {
    userPlan: EnrichedUserPlanProgress;
    className?: string;
}

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarDialog({ userPlan, className }: CalendarDialogProps) {
    const [open, setOpen] = useState(false);
    const isCompleted = !!userPlan.completedAt;

    // Helper to calculate the expected date for a workout
    const getExpectedWorkoutDate = (weekNumber: number, dayIndex: number): Date => {
        const startDate = new Date(userPlan.startedAt);
        // Week 1, Day 0 starts at startedAt
        // Each subsequent day is +1 from start
        const daysFromStart = (weekNumber - 1) * 7 + dayIndex;
        const expectedDate = new Date(startDate);
        expectedDate.setDate(startDate.getDate() + daysFromStart);
        return expectedDate;
    };

    // Helper to check if two dates are the same day (ignoring time and timezone)
    const isSameDay = (date1: Date, date2: Date): boolean => {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        return d1.getUTCFullYear() === d2.getUTCFullYear() &&
            d1.getUTCMonth() === d2.getUTCMonth() &&
            d1.getUTCDate() === d2.getUTCDate();
    };

    // Helper to get workout status for a specific day
    const getWorkoutStatus = (weekNumber: number, dayIndex: number): 'completed' | 'missed' | 'skipped' | 'upcoming' | 'current' => {
        const week = userPlan.planDetails.weeks.find(w => w.weekNumber === weekNumber);
        if (!week) return 'upcoming';

        const day = week.days[dayIndex];
        if (!day) return 'upcoming';

        const expectedDate = getExpectedWorkoutDate(weekNumber, dayIndex);

        // For completed plans, match by both date AND templateId for accuracy
        if (userPlan.completedAt) {
            const log = userPlan.progressLog.find(l => {
                const logDate = new Date(l.date);
                return isSameDay(logDate, expectedDate) && l.workoutTemplateId === day.workoutTemplateId;
            });

            if (log) {
                if (log.status === 'completed') return 'completed';
                if (log.status === 'skipped') return 'skipped';
                if (log.status === 'missed') return 'missed';
            }
            // If no log found, it was missed
            return 'missed';
        }

        // For active plans, check based on current position
        if (weekNumber < userPlan.currentWeek) {
            const log = userPlan.progressLog.find(l => {
                const logDate = new Date(l.date);
                return isSameDay(logDate, expectedDate) && l.workoutTemplateId === day.workoutTemplateId;
            });

            if (log) {
                if (log.status === 'completed') return 'completed';
                if (log.status === 'skipped') return 'skipped';
                if (log.status === 'missed') return 'missed';
            }
            return 'missed';
        }

        // Current week
        if (weekNumber === userPlan.currentWeek) {
            if (dayIndex < userPlan.currentDayIndex) {
                const log = userPlan.progressLog.find(l => {
                    const logDate = new Date(l.date);
                    return isSameDay(logDate, expectedDate) && l.workoutTemplateId === day.workoutTemplateId;
                });

                if (log) {
                    if (log.status === 'completed') return 'completed';
                    if (log.status === 'skipped') return 'skipped';
                    if (log.status === 'missed') return 'missed';
                }
                return 'missed';
            }
            if (dayIndex === userPlan.currentDayIndex) return 'current';
            return 'upcoming';
        }

        // Future week
        return 'upcoming';
    };

    // Get status icon
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle2 className="h-4 w-4 text-green-600" />;
            case 'missed':
                return <XCircle className="h-4 w-4 text-red-600" />;
            case 'skipped':
                return <CircleSlash className="h-4 w-4 text-yellow-600 fill-yellow-600" />;
            case 'current':
                return <Clock className="h-4 w-4 text-blue-600" />;
            default:
                return <Circle className="h-4 w-4 text-muted-foreground" />;
        }
    };

    // Render a single week
    const renderWeek = (week: EnrichedTrainingPlanWeek) => {
        return (
            <Card key={week.weekNumber} className="mb-4">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg">Week {week.weekNumber}</h3>
                        <span className="text-sm text-muted-foreground">
                            {week.days.length} workouts
                        </span>
                    </div>
                    <div className="space-y-2">
                        {week.days.map((day, dayIndex) => {
                            const status = getWorkoutStatus(week.weekNumber, dayIndex);
                            const workoutName = day.workoutDetails?.name || 'Rest Day';

                            return (
                                <div
                                    key={dayIndex}
                                    className={`flex items-center justify-between p-3 rounded-lg border ${status === 'current'
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border bg-muted/30'
                                        }`}
                                >
                                    <div className="flex items-center gap-3 flex-1">
                                        {getStatusIcon(status)}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium">
                                                    {daysOfWeek[dayIndex]}
                                                </span>
                                                {status === 'current' && (
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                                                        Today
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {workoutName}
                                            </p>
                                        </div>
                                    </div>
                                    {day.workoutDetails && (
                                        <div className="text-right">
                                            {day.workoutDetails.metrics.distanceMiles && (
                                                <p className="text-xs text-muted-foreground">
                                                    {day.workoutDetails.metrics.distanceMiles} mi
                                                </p>
                                            )}
                                            {day.workoutDetails.metrics.durationMins && (
                                                <p className="text-xs text-muted-foreground">
                                                    {day.workoutDetails.metrics.durationMins} min
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        );
    };

    // Split weeks into previous, current, and future
    const previousWeeks = userPlan.planDetails.weeks.filter(
        w => w.weekNumber < userPlan.currentWeek
    );
    const currentWeek = userPlan.planDetails.weeks.find(
        w => w.weekNumber === userPlan.currentWeek
    );
    const futureWeeks = userPlan.planDetails.weeks.filter(
        w => w.weekNumber > userPlan.currentWeek
    );

    // For completed plans, show all weeks
    const allWeeks = userPlan.planDetails.weeks;

    const buttonText = isCompleted ? 'View Full History' : 'View Program Calendar';

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="secondary" size="lg" className={className ? `gap-2 ${className}` : 'gap-2 w-full'}>
                    <Calendar className="h-4 w-4" />
                    {buttonText}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {userPlan.planName}
                    </DialogTitle>
                    <DialogDescription>
                        {isCompleted
                            ? `Completed on ${new Date(userPlan.completedAt!).toLocaleDateString()}`
                            : `Week ${userPlan.currentWeek} of ${userPlan.totalWeeks} • ${userPlan.planDetails.sport}`
                        }
                    </DialogDescription>
                </DialogHeader>

                {isCompleted ? (
                    // Single view for completed plans
                    <ScrollArea className="h-[600px] pr-4">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 border border-green-200">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                                    <div>
                                        <p className="font-semibold text-green-900">Plan Completed!</p>
                                        <p className="text-sm text-green-700">
                                            {userPlan.progressLog.filter(l => l.status === 'completed').length} workouts completed
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {allWeeks.map(week => renderWeek(week))}
                        </div>
                    </ScrollArea>
                ) : (
                    // Three-tab view for active plans
                    <Tabs defaultValue="current" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="previous">
                                Previous ({previousWeeks.length})
                            </TabsTrigger>
                            <TabsTrigger value="current">
                                Current
                            </TabsTrigger>
                            <TabsTrigger value="future">
                                Future ({futureWeeks.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="previous">
                            <ScrollArea className="h-[500px] pr-4">
                                {previousWeeks.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <p>No previous weeks yet</p>
                                        <p className="text-sm mt-2">Keep going! 💪</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {previousWeeks.map(week => renderWeek(week))}
                                    </div>
                                )}
                            </ScrollArea>
                        </TabsContent>

                        <TabsContent value="current">
                            <ScrollArea className="h-[500px] pr-4">
                                {currentWeek ? (
                                    <div className="space-y-4">
                                        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                                            <p className="text-sm font-medium">
                                                You're on Week {userPlan.currentWeek}, Day {userPlan.currentDayIndex + 1}
                                            </p>
                                        </div>
                                        {renderWeek(currentWeek)}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <p>No current week found</p>
                                    </div>
                                )}
                            </ScrollArea>
                        </TabsContent>

                        <TabsContent value="future">
                            <ScrollArea className="h-[500px] pr-4">
                                {futureWeeks.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <p>No upcoming weeks</p>
                                        <p className="text-sm mt-2">You're almost done! 🎉</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {futureWeeks.map(week => renderWeek(week))}
                                    </div>
                                )}
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                )}

                {/* Legend - Always visible for both active and completed plans */}
                <div className="border-t pt-4 mt-4">
                    <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="text-muted-foreground">Completed</span>
                        </div>
                        {!isCompleted && (
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-blue-600" />
                                <span className="text-muted-foreground">Current</span>
                            </div>
                        )}
                        {!isCompleted && (
                            <div className="flex items-center gap-2">
                                <Circle className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Upcoming</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <CircleSlash className="h-4 w-4 text-yellow-600 fill-yellow-600" />
                            <span className="text-muted-foreground">Skipped</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span className="text-muted-foreground">Missed</span>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog >
    );
}