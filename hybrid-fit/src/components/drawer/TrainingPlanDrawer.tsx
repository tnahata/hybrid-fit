"use client";

import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { TrainingPlanWithWorkouts, TrainingPlanWeekWithWorkouts, TrainingPlanDayWithWorkout, WorkoutTemplateWithExercises, WorkoutExerciseWithDetails } from "@/types/training-plan";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { TrainingPlanWeek } from "@/models/TrainingPlans";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface TrainingPlanDrawerProps {
	plan: TrainingPlanWithWorkouts;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function TrainingPlanDrawer({ plan, open, onOpenChange }: TrainingPlanDrawerProps) {

	const [selectedWeek, setSelectedWeek] = useState(1);
	const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());

	const { data: session, status } = useSession();
	const router = useRouter();
	const [isEnrolling, setIsEnrolling] = useState(false);

	if (!plan) return null;

	const currentWeek: TrainingPlanWeekWithWorkouts = plan.weeks.find((w: TrainingPlanWeek) => w.weekNumber === selectedWeek);

	const toggleDay = (dayNumber: number) => {
		const newExpanded = new Set(expandedDays);
		if (newExpanded.has(dayNumber)) {
			newExpanded.delete(dayNumber);
		} else {
			newExpanded.add(dayNumber);
		}
		setExpandedDays(newExpanded);
	};

	const toggleWeek = (week: number) => {
		setSelectedWeek(week);
		setExpandedDays(new Set());
	}

	const closeDrawer = () => {
		setSelectedWeek(1);
		onOpenChange(false);
		setExpandedDays(new Set());
	}

	const handleEnroll = async () => {

		if (status === "unauthenticated") {
			localStorage.setItem("pendingEnrollment", plan._id);

			toast.info("Please sign in to enroll", {
				description: "We'll enroll you in this plan after you sign in",
			});

			router.push("/signin");
			return;
		}

		if (status === "authenticated") {
			setIsEnrolling(true);

			try {
				const response = await fetch("/api/users/me/enroll", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ planId: plan._id }),
				});

				const data = await response.json();

				if (!response.ok) {
					if (response.status === 409) {
						toast.warning("Already enrolled", {
							description: "You are already enrolled in this plan",
						});
					} else {
						toast.error("Enrollment failed", {
							description: data.error || "Something went wrong",
						});
					}
					return;
				}

				toast.success("Enrolled successfully!", {
					description: `You're now enrolled in ${plan.name}`,
				});

				closeDrawer();
				router.push("/dashboard");
				router.refresh();

			} catch (error) {
				console.error("Enrollment error:", error);
				toast.error("Something went wrong", {
					description: "Please try again",
				});
			} finally {
				setIsEnrolling(false);
			}
		}
	};

	const daysOfWeek = [1, 2, 3, 4, 5, 6, 7];

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right" className="w-full sm:max-w-md overflow-hidden p-0">
				<ScrollArea className="h-full">
					<div className="p-6 space-y-6">

						<div className="flex items-center gap-3">
							<Button
								variant="ghost"
								size="icon"
								onClick={() => closeDrawer()}
								className="h-8 w-8"
							>
								<ArrowLeft className="h-4 w-4" />
							</Button>
							<SheetHeader className="flex-1">
								<SheetTitle className="text-xl font-bold text-left">
									{plan.name}
								</SheetTitle>
							</SheetHeader>
						</div>

						<p className="text-sm text-muted-foreground leading-relaxed">
							{plan.details.goal}
						</p>

						{/* Video Placeholder */}
						<div className="w-full h-40 bg-black rounded-lg flex items-center justify-center">
							<span className="text-white text-sm font-medium">Video</span>
						</div>

						<Separator />

						<div className="space-y-4">

							<Select
								value={selectedWeek.toString()}
								onValueChange={(value) => toggleWeek(parseInt(value))}
							>
								<SelectTrigger className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{plan.weeks.map((week: TrainingPlanWeek) => (
										<SelectItem key={week.weekNumber} value={week.weekNumber.toString()}>
											Week {week.weekNumber}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							<h3 className="font-semibold">Workouts at a glance</h3>

							{currentWeek && (
								<div className="space-y-3">
									{daysOfWeek.map((dayNumber) => {
										const isExpanded = expandedDays.has(dayNumber);

										// Find the workout for this day (days array might not have all 7 days)
										const dayData: TrainingPlanDayWithWorkout = currentWeek.days[dayNumber - 1];
										const workout: WorkoutTemplateWithExercises = dayData?.workoutTemplate;

										return newFunction(dayNumber, isExpanded, toggleDay, workout);
									})}
								</div>
							)}

						</div>

						<Button
							className="w-full text-white font-bold"
							onClick={handleEnroll}
							disabled={isEnrolling || status === 'loading'}
						>
							{status === "loading" && "Loading..."}
							{status === "authenticated" && isEnrolling ? "Enrolling..." : "Enroll"}
						</Button>
					</div>
				</ScrollArea>
			</SheetContent>
		</Sheet>
	);
}

function newFunction(dayNumber: number, isExpanded: boolean, toggleDay: (dayNumber: number) => void, workout: WorkoutTemplateWithExercises) {
	return <Collapsible
		key={dayNumber}
		open={isExpanded}
		onOpenChange={() => toggleDay(dayNumber)}
	>
		<div className="border rounded-lg">

			<CollapsibleTrigger asChild>
				<Button
					variant="ghost"
					className="w-full justify-between p-4 h-auto hover:bg-muted/50"
				>
					<span className="font-semibold">Day {dayNumber}</span>
					{isExpanded ? (
						<ChevronUp className="h-4 w-4" />
					) : (
						<ChevronDown className="h-4 w-4" />
					)}
				</Button>
			</CollapsibleTrigger>

			{dayContent(workout)}
		</div>
	</Collapsible>;
}

function dayContent(workout: WorkoutTemplateWithExercises) {
	return <CollapsibleContent>
		<div className="px-4 pb-4 space-y-4">
			{workout ? (
				<>
					<div className="space-y-2">
						<h4 className="text-sm font-semibold">{workout.name}</h4>
						<p className="text-sm text-muted-foreground">
							{workout.description}
						</p>
					</div>

					{workout.structure && workout.structure.length > 0 && (
						<div className="space-y-2">
							<h4 className="text-sm font-semibold">Exercises</h4>
							<div className="space-y-2">
								{workout.structure.map((exerciseStructure: WorkoutExerciseWithDetails, idx: number) => {
									return exerciseStructureContent(exerciseStructure, idx);
								})}
							</div>
						</div>
					)}
				</>
			) : (
				<p className="text-sm text-muted-foreground italic">
					Rest day - No workout scheduled
				</p>
			)}
		</div>
	</CollapsibleContent>;
}

function exerciseStructureContent(exerciseStructure: WorkoutExerciseWithDetails, idx: number) {
	return (
		<div
			key={idx}
			className="p-3 bg-muted/30 rounded-lg space-y-2"
		>
			<div>
				<p className="text-sm font-medium">
					{exerciseStructure?.exercise?.name || `Exercise ${idx + 1}`}
				</p>
			</div>

			<div className="text-xs text-muted-foreground space-y-0.5">
				{exerciseStructure.sets && (
					<p>Sets: {exerciseStructure.sets}</p>
				)}
				{exerciseStructure.reps && (
					<p>Reps: {exerciseStructure.reps}</p>
				)}
				{exerciseStructure.durationMins && (
					<p>Duration: {exerciseStructure.durationMins} mins</p>
				)}
				{exerciseStructure.durationSecs && (
					<p>Duration: {exerciseStructure.durationSecs} secs</p>
				)}
				{exerciseStructure.restSeconds && (
					<p>Rest: {exerciseStructure.restSeconds}s</p>
				)}
			</div>
		</div>
	);
}
