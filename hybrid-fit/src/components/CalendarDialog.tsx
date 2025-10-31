"use client";

import React, { useState } from 'react';
import { Calendar, CheckCircle2, XCircle, Circle, Clock, CircleSlash, RotateCcw, GripVertical } from 'lucide-react';
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
import { Badge } from "@/components/ui/badge";
import { EnrichedUserPlanProgress } from '@/app/api/users/me/route';
import { EnrichedTrainingPlanWeek } from '@/lib/enrichTrainingPlans';
import { DayOfWeek } from '@/models/User';
import { returnUTCDateInUSLocaleFormat } from '@/lib/dateUtils';

interface CalendarDialogProps {
	userPlan: EnrichedUserPlanProgress;
	className?: string;
	onUpdateOverrides?: (overrides: any[]) => Promise<void>;
}

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarDialog({ userPlan, className, onUpdateOverrides }: CalendarDialogProps) {
	const [open, setOpen] = useState(false);
	const [draggedItem, setDraggedItem] = useState<{
		weekNumber: number;
		dayIndex: number;
		workoutTemplateId: string;
	} | null>(null);
	const [localOverrides, setLocalOverrides] = useState(userPlan.overrides || []);
	const [isSaving, setIsSaving] = useState(false);

	const isCompleted = !!userPlan.completedAt;

	// Helper to calculate the expected date for a workout
	const getExpectedWorkoutDate = (weekNumber: number, dayIndex: number): Date => {
		const startDate = new Date(userPlan.startedAt);
		const daysFromStart = (weekNumber - 1) * 7 + dayIndex;
		const expectedDateMs = Date.UTC(
			startDate.getUTCFullYear(),
			startDate.getUTCMonth(),
			startDate.getUTCDate() + daysFromStart,
			0, 0, 0, 0
		);

		return new Date(expectedDateMs);
	};

	// Helper to check if two dates are the same day
	const isSameDay = (date1: Date, date2: Date): boolean => {
		const d1 = new Date(date1);
		const d2 = new Date(date2);
		return d1.getUTCFullYear() === d2.getUTCFullYear() &&
			d1.getUTCMonth() === d2.getUTCMonth() &&
			d1.getUTCDate() === d2.getUTCDate();
	};

	// Helper to get workout status for a specific day
	const getWorkoutStatus = (weekNumber: number, dayIndex: number): 'completed' | 'missed' | 'skipped' | 'upcoming' | 'current' => {
		const week = userPlan.weeks.find(w => w.weekNumber === weekNumber);
		if (!week) {
			return 'upcoming';
		}

		const day = week.days[dayIndex];
		if (!day) {
			return 'upcoming';
		}

		const expectedDate = getExpectedWorkoutDate(weekNumber, dayIndex);

		const logForExpectedDate = userPlan.progressLog.find(l => {
			const logDate = new Date(l.date);
			return isSameDay(logDate, expectedDate) && l.workoutTemplateId === day.workoutTemplateId;
		});

		// If plan is completed or workout was scheduled for a previous week in the plan
		if (userPlan.completedAt || weekNumber < userPlan.currentWeek) {
			if (logForExpectedDate) {
				return logForExpectedDate.status;
			} else {
				return 'missed';
			}
		}

		// Workouts for current week
		if (weekNumber === userPlan.currentWeek && dayIndex <= userPlan.currentDayIndex) {
			if (logForExpectedDate) {
				return logForExpectedDate.status;
			} else if (dayIndex === userPlan.currentDayIndex) { // could not find a log for current day, we just assume it is current
				return 'current';
			} else { // previous day in the current week and log not found
				return 'missed';
			}
		}

		return 'upcoming';
	};

	// Check if a workout is overridden
	const isOverridden = (weekNumber: number, dayIndex: number): boolean => {
		const dayOfWeek = daysOfWeek[dayIndex];
		return localOverrides.some(
			o => o.weekNumber === weekNumber && o.dayOfWeek === dayOfWeek
		);
	};

	// Get the actual workout to display (considering overrides)
	const getDisplayedWorkout = (weekNumber: number, dayIndex: number): string => {
		const dayOfWeek = daysOfWeek[dayIndex];
		const override = localOverrides.find(
			o => o.weekNumber === weekNumber && o.dayOfWeek === dayOfWeek
		);

		if (override) {
			return override.customWorkoutId;
		}

		const week = userPlan.weeks.find(w => w.weekNumber === weekNumber);
		return week?.days[dayIndex]?.workoutTemplateId || 'rest_day';
	};

	// Check if a day can be dragged
	const canDrag = (weekNumber: number, dayIndex: number): boolean => {
		if (isCompleted) return false; // Completed plans can't be modified

		const status = getWorkoutStatus(weekNumber, dayIndex);
		if (status === 'completed' || status === 'skipped' || status === 'missed') {
			return false; // Past workouts can't be moved
		}

		// Only current and future weeks
		return weekNumber >= userPlan.currentWeek;
	};

	// Handle drag start
	const handleDragStart = (weekNumber: number, dayIndex: number, workoutTemplateId: string) => {
		if (!canDrag(weekNumber, dayIndex)) return;

		setDraggedItem({
			weekNumber,
			dayIndex,
			workoutTemplateId
		});
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
	};

	const handleDrop = (targetWeekNumber: number, targetDayIndex: number) => {
		if (!draggedItem) return;

		// Can only swap within the same week
		if (draggedItem.weekNumber !== targetWeekNumber) {
			setDraggedItem(null);
			return;
		}

		// Can't drop on the same day
		if (draggedItem.dayIndex === targetDayIndex) {
			setDraggedItem(null);
			return;
		}

		// Can't drop on past days
		if (!canDrag(targetWeekNumber, targetDayIndex)) {
			setDraggedItem(null);
			return;
		}

		// Get the workouts
		const sourceWorkoutId = getDisplayedWorkout(draggedItem.weekNumber, draggedItem.dayIndex);
		const targetWorkoutId = getDisplayedWorkout(targetWeekNumber, targetDayIndex);

		// Create new overrides for the swap
		const newOverrides = [...localOverrides];

		// Remove existing overrides for these days
		const filteredOverrides = newOverrides.filter(o =>
			!(o.weekNumber === draggedItem.weekNumber && o.dayOfWeek === daysOfWeek[draggedItem.dayIndex]) &&
			!(o.weekNumber === targetWeekNumber && o.dayOfWeek === daysOfWeek[targetDayIndex])
		);

		const mapIndexToDayOfWeek = (i: number): DayOfWeek => {
			switch (i) {
				case 0: return DayOfWeek.MON;
				case 1: return DayOfWeek.TUE;
				case 2: return DayOfWeek.WED;
				case 3: return DayOfWeek.THU;
				case 4: return DayOfWeek.FRI;
				case 5: return DayOfWeek.SAT;
				case 6: return DayOfWeek.SUN;
				default: return daysOfWeek[i] as unknown as DayOfWeek;
			}
		};

		filteredOverrides.push({
			weekNumber: draggedItem.weekNumber,
			dayOfWeek: mapIndexToDayOfWeek(draggedItem.dayIndex),
			customWorkoutId: targetWorkoutId
		});

		filteredOverrides.push({
			weekNumber: targetWeekNumber,
			dayOfWeek: mapIndexToDayOfWeek(draggedItem.dayIndex),
			customWorkoutId: sourceWorkoutId
		});

		setLocalOverrides(filteredOverrides);
		setDraggedItem(null);
	};

	const handleSaveOverrides = async () => {
		if (!onUpdateOverrides) return;

		setIsSaving(true);
		try {
			await onUpdateOverrides(localOverrides);
		} catch (error) {
			console.error('Failed to save overrides:', error);
		} finally {
			setIsSaving(false);
		}
	};

	const handleResetPlan = () => {
		const pastOverrides = localOverrides.filter(
			o => o.weekNumber < userPlan.currentWeek
		);
		setLocalOverrides(pastOverrides);
		if (onUpdateOverrides) {
			onUpdateOverrides(pastOverrides);
		}
	};

	const hasCurrentOrFutureOverrides = localOverrides.some(
		o => o.weekNumber >= userPlan.currentWeek
	);

	const hasUnsavedChanges = JSON.stringify(localOverrides) !== JSON.stringify(userPlan.overrides || []);

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

	const renderWeek = (week: EnrichedTrainingPlanWeek) => {
		const weekCanBeEdited = !isCompleted && week.weekNumber >= userPlan.currentWeek;

		return (
			<Card key={week.weekNumber} className="mb-4">
				<CardContent className="pt-6">
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center gap-2">
							<h3 className="font-semibold text-lg">Week {week.weekNumber}</h3>
							{localOverrides.some(o => o.weekNumber === week.weekNumber) && (
								<Badge variant="outline" className="text-xs">
									Modified
								</Badge>
							)}
						</div>
						<span className="text-sm text-muted-foreground">
							{week.days.length} workouts
						</span>
					</div>
					<div className="space-y-2">
						{week.days.map((day, dayIndex) => {
							const status = getWorkoutStatus(week.weekNumber, dayIndex);
							const displayedWorkoutId = getDisplayedWorkout(week.weekNumber, dayIndex);
							const isDraggable = canDrag(week.weekNumber, dayIndex);
							const overridden = isOverridden(week.weekNumber, dayIndex);

							// Find the workout details for the displayed workout
							const workoutDetails = userPlan.weeks
								.flatMap(w => w.days)
								.find(d => d.workoutTemplateId === displayedWorkoutId)?.workoutDetails;

							const workoutName = workoutDetails?.name || (displayedWorkoutId === 'rest_day' ? 'Rest Day' : displayedWorkoutId);

							return (
								<div
									key={dayIndex}
									draggable={isDraggable}
									onDragStart={() => handleDragStart(week.weekNumber, dayIndex, displayedWorkoutId)}
									onDragOver={handleDragOver}
									onDrop={() => handleDrop(week.weekNumber, dayIndex)}
									className={`flex items-center justify-between p-3 rounded-lg border transition-all ${status === 'current'
										? 'border-primary bg-primary/5'
										: 'border-border bg-muted/30'
										} ${isDraggable ? 'cursor-move hover:bg-muted/50' : ''
										} ${draggedItem?.weekNumber === week.weekNumber && draggedItem?.dayIndex === dayIndex
											? 'opacity-50'
											: ''
										}`}
								>
									<div className="flex items-center gap-3 flex-1">
										{isDraggable && weekCanBeEdited && (
											<GripVertical className="h-4 w-4 text-muted-foreground" />
										)}
										{getStatusIcon(status)}
										<div className="flex-1">
											<div className="flex items-center gap-2 flex-wrap">
												<span className="text-sm font-medium">
													{daysOfWeek[dayIndex]}
												</span>
												{status === 'current' && (
													<Badge variant="default" className="text-xs">
														Today
													</Badge>
												)}
												{overridden && (
													<Badge variant="secondary" className="text-xs">
														Rescheduled
													</Badge>
												)}
											</div>
											<p className="text-sm text-muted-foreground">
												{workoutName}
											</p>
										</div>
									</div>
									{workoutDetails && (
										<div className="text-right">
											{workoutDetails.metrics.distanceMiles && (
												<p className="text-xs text-muted-foreground">
													{workoutDetails.metrics.distanceMiles} mi
												</p>
											)}
											{workoutDetails.metrics.durationMins && (
												<p className="text-xs text-muted-foreground">
													{workoutDetails.metrics.durationMins} min
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
	const previousWeeks = userPlan.weeks.filter(
		w => w.weekNumber < userPlan.currentWeek
	);
	const currentWeek = userPlan.weeks.find(
		w => w.weekNumber === userPlan.currentWeek
	);
	const futureWeeks = userPlan.weeks.filter(
		w => w.weekNumber > userPlan.currentWeek
	);

	// For completed plans, show all weeks
	const allWeeks = userPlan.weeks;

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
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Calendar className="h-5 w-5" />
							<DialogTitle>{userPlan.name}</DialogTitle>
						</div>
						{!isCompleted && hasCurrentOrFutureOverrides && (
							<Button
								variant="outline"
								size="sm"
								onClick={handleResetPlan}
								className="gap-2"
							>
								<RotateCcw className="h-4 w-4" />
								Reset Upcoming Workouts
							</Button>
						)}
					</div>
					<DialogDescription>
						{isCompleted
							? `Completed on ${returnUTCDateInUSLocaleFormat(new Date(userPlan.completedAt!))}`
							: `Week ${userPlan.currentWeek} of ${userPlan.durationWeeks} • ${userPlan.sport}`
						}
					</DialogDescription>
				</DialogHeader>

				{!isCompleted && hasUnsavedChanges && (
					<div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
						<p className="text-sm text-blue-800">You have unsaved changes</p>
						<Button onClick={handleSaveOverrides} disabled={isSaving} size="sm">
							{isSaving ? 'Saving...' : 'Save Changes'}
						</Button>
					</div>
				)}

				{!isCompleted && (
					<div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
						You can drag and drop workouts within the same week to reschedule them
					</div>
				)}

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
										<p className="text-sm mt-2">Keep going!</p>
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

				{/* Legend */}
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
		</Dialog>
	);
}