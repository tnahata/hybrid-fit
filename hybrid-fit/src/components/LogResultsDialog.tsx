import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkoutLog } from '@/models/User';
import { EnrichedWorkoutTemplate } from '../../types/enrichedTypes';
import { getStartOfDay } from '@/lib/dateUtils';
import { toast } from 'sonner';

interface ExerciseSet {
	setNumber: number;
	reps: number;
	weight: number;
	completed: boolean;
}

interface Exercise {
	exerciseId: string;
	exerciseName: string;
	sets: ExerciseSet[];
}

interface DrillActivity {
	exerciseId: string;
	name: string;
	durationMinutes: number;
	repetitions?: number;
	sets?: number;
	qualityRating: number;
	notes?: string;
	completed: boolean;
}

interface LogResultsDialogProps {
	workout: EnrichedWorkoutTemplate | null | undefined;
	existingLog?: WorkoutLog | null;
	onCreateLog: (data: WorkoutLog) => void;
	onUpdateLog: (data: WorkoutLog, logId: string) => void;
	trigger?: React.ReactNode;
}

export default function LogResultsDialog({ workout, existingLog, onCreateLog, onUpdateLog, trigger }: LogResultsDialogProps) {
	const [open, setOpen] = useState<boolean>(false);
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
	const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);

	const [workoutStatus, setWorkoutStatus] = useState<'completed' | 'skipped'>('completed');

	const [durationMinutes, setDurationMinutes] = useState<string>('');
	const [perceivedEffort, setPerceivedEffort] = useState<number[]>([5]);
	const [notes, setNotes] = useState<string>('');

	const [distance, setDistance] = useState<string>('');
	const [distanceUnit, setDistanceUnit] = useState<'miles' | 'kilometers'>('miles');
	const [averagePace, setAveragePace] = useState<string>('');
	const [averageHeartRate, setAverageHeartRate] = useState<string>('');

	const [exercises, setExercises] = useState<Exercise[]>([]);
	const [drills, setDrills] = useState<DrillActivity[]>([]);

	useEffect(() => {
		if (open && existingLog) {
			setWorkoutStatus(existingLog.status);
			setNotes(existingLog.notes || '');

			if (existingLog.status === 'completed') {
				setDurationMinutes(existingLog.durationMinutes?.toString() || '');
				setPerceivedEffort([existingLog.perceivedEffort || 5]);

				if (existingLog.distance) {
					setDistance(existingLog.distance.value.toString());
					setDistanceUnit(existingLog.distance.unit);
				}
				if (existingLog.pace) {
					setAveragePace(existingLog.pace.average.toString());
				}
				if (existingLog.heartRate) {
					setAverageHeartRate(existingLog.heartRate.average.toString());
				}
				if (existingLog.strengthSession) {
					setExercises(existingLog.strengthSession.exercises);
				}
				if (existingLog.drillSession) {
					const mappedDrills = existingLog.drillSession.activities.map((activity, index) => ({
						exerciseId: activity.exerciseId || index.toString(),
						name: activity.name,
						durationMinutes: activity.durationMinutes || 0,
						repetitions: activity.repetitions,
						sets: activity.sets,
						qualityRating: 3,
						notes: activity.notes,
						completed: true
					}));
					setDrills(mappedDrills);
				}
			}
			setHasUnsavedChanges(false);
		} else if (open && !existingLog && workout?.structure && workout.structure.length > 0) {
			const strengthExercises: Exercise[] = [];
			const drillActivities: DrillActivity[] = [];

			workout.structure.forEach((item) => {
				if (item.exercise?.type === 'drill') {
					drillActivities.push({
						exerciseId: item.exerciseId,
						name: item.exercise?.name || '',
						durationMinutes: item.duration || item.exercise?.durationMinutes || 0,
						repetitions: item.reps,
						sets: undefined,
						qualityRating: 3,
						notes: item.notes || '',
						completed: false
					});
				} else {
					strengthExercises.push({
						exerciseId: item.exerciseId,
						exerciseName: item.exercise?.name || '',
						sets: Array.from({ length: item.sets || 3 }, (_, index) => ({
							setNumber: index + 1,
							reps: item.reps || 8,
							weight: 0,
							completed: false
						}))
					});
				}
			});

			setExercises(strengthExercises);
			setDrills(drillActivities);
			setHasUnsavedChanges(false);
		}
	}, [open, existingLog, workout]);

	const markFormAsDirty = (): void => {
		setHasUnsavedChanges(true);
	};

	const isDistanceWorkout = (): boolean => {
		if (!workout) return false;
		const distanceSports = ['running', 'cycling', 'swimming'];
		return distanceSports.includes(workout.sport.toLowerCase());
	};

	const isStrengthWorkout = (): boolean => {
		if (!workout) return false;
		return workout.sport.toLowerCase() === 'strength' ||
			workout.category.toLowerCase().includes('strength') ||
			exercises.length > 0;
	};

	const drillWorkoutExists = (): boolean => {
		return drills.length > 0;
	};

	const hasMultipleActivityTypes = (): boolean => {
		return exercises.length > 0 && drills.length > 0;
	};

	const isFormValid = (): boolean => {
		if (workoutStatus === 'skipped') {
			return true;
		}

		if (isDistanceWorkout()) {
			return !!durationMinutes && !!distance;
		}

		if (isStrengthWorkout()) {
			return !!durationMinutes && exercises.some(ex => ex.exerciseName.trim() !== '');
		}

		if (drillWorkoutExists()) {
			return !!durationMinutes && drills.some(drill => drill.name.trim() !== '' && drill.durationMinutes > 0);
		}

		return !!durationMinutes;
	};

	const removeExercise = (index: number): void => {
		setExercises(exercises.filter((_, i) => i !== index));
		markFormAsDirty();
	};

	const addSet = (exerciseIndex: number): void => {
		const newExercises = [...exercises];
		const lastSet = newExercises[exerciseIndex].sets[newExercises[exerciseIndex].sets.length - 1];
		newExercises[exerciseIndex].sets.push({
			setNumber: newExercises[exerciseIndex].sets.length + 1,
			reps: lastSet.reps,
			weight: lastSet.weight,
			completed: false
		});
		setExercises(newExercises);
		markFormAsDirty();
	};

	const removeSet = (exerciseIndex: number, setIndex: number): void => {
		const newExercises = [...exercises];
		newExercises[exerciseIndex].sets = newExercises[exerciseIndex].sets.filter((_, i) => i !== setIndex);
		newExercises[exerciseIndex].sets.forEach((set, i) => {
			set.setNumber = i + 1;
		});
		setExercises(newExercises);
		markFormAsDirty();
	};

	const updateExerciseName = (index: number, name: string): void => {
		const newExercises = [...exercises];
		newExercises[index].exerciseName = name;
		setExercises(newExercises);
		markFormAsDirty();
	};

	const updateSet = (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight' | 'completed', value: number | boolean): void => {
		const newExercises = [...exercises];
		newExercises[exerciseIndex].sets[setIndex][field] = value as never;
		setExercises(newExercises);
		markFormAsDirty();
	};

	const removeDrill = (index: number): void => {
		setDrills(drills.filter((_, i) => i !== index));
		markFormAsDirty();
	};

	const updateDrill = (index: number, field: keyof DrillActivity, value: string | number | boolean | undefined): void => {
		const newDrills = [...drills];
		newDrills[index][field] = value as never;
		setDrills(newDrills);
		markFormAsDirty();
	};

	const calculateTotalVolume = (): number => {
		return exercises.reduce((total, exercise) => {
			return total + exercise.sets.reduce((exTotal, set) => {
				return exTotal + (set.completed ? (set.weight * set.reps) : 0);
			}, 0);
		}, 0);
	};

	const handleSubmit = (): void => {
		if (!isFormValid()) return;

		if (!workout?._id) {
			toast.error('Unable to save workout', {
				description: 'Workout information is missing. Please try refreshing the page.'
			});
			return;
		}

		const data: WorkoutLog = {
			date: getStartOfDay(),
			workoutTemplateId: workout._id,
			status: workoutStatus,
			notes: notes || undefined,
		};

		if (workoutStatus === 'completed') {
			data.durationMinutes = parseFloat(durationMinutes);
			data.perceivedEffort = perceivedEffort[0];
			data.sport = workout?.sport;

			if (isDistanceWorkout()) {
				data.activityType = 'distance';
				data.distance = {
					value: parseFloat(distance),
					unit: distanceUnit,
				};
				if (averagePace) {
					data.pace = {
						average: parseFloat(averagePace),
						unit: distanceUnit === 'miles' ? 'min/mile' : 'min/km',
					};
				}
			} else if (isStrengthWorkout() && !drillWorkoutExists()) {
				data.activityType = 'strength';
			} else if (drillWorkoutExists() && !isStrengthWorkout()) {
				data.activityType = 'drill';
			} else if (isStrengthWorkout() && drillWorkoutExists()) {
				data.activityType = 'mixed';
			} else {
				data.activityType = 'time';
			}

			if (isStrengthWorkout() && exercises.length > 0) {
				data.strengthSession = {
					exercises: exercises.map(ex => ({
						exerciseId: ex.exerciseId,
						exerciseName: ex.exerciseName,
						sets: ex.sets,
					})),
					totalVolume: calculateTotalVolume(),
					volumeUnit: 'lbs',
				};
			}

			if (drillWorkoutExists() && drills.length > 0) {
				data.drillSession = {
					activities: drills.map(drill => ({
						exerciseId: drill.exerciseId,
						name: drill.name,
						durationMinutes: drill.durationMinutes,
						repetitions: drill.repetitions,
						sets: drill.sets,
						qualityRating: drill.qualityRating,
						completed: drill.completed,
						notes: drill.notes,
					})),
					customMetrics: {}
				};
			}

			if (averageHeartRate) {
				data.heartRate = {
					average: parseFloat(averageHeartRate),
				};
			}
		}

		if (existingLog) {
			if (!existingLog._id) {
				toast.error('Unable to update workout', {
					description: 'Workout log ID is missing. Please try again.'
				});
				return;
			}
			onUpdateLog(data, existingLog._id.toString());
		} else {
			onCreateLog(data);
		}
		setHasUnsavedChanges(false);
		setOpen(false);
	};

	const resetForm = (): void => {
		setWorkoutStatus('completed');
		setDurationMinutes('');
		setPerceivedEffort([5]);
		setNotes('');
		setDistance('');
		setAveragePace('');
		setAverageHeartRate('');
		setExercises([]);
		setDrills([]);
		setHasUnsavedChanges(false);
	};

	const handleClose = (): void => {
		if (hasUnsavedChanges) {
			setShowConfirmDialog(true);
		} else {
			setOpen(false);
			if (!isEditing) resetForm();
		}
	};

	const confirmClose = (): void => {
		setShowConfirmDialog(false);
		setOpen(false);
		if (!isEditing) resetForm();
	};

	const cancelClose = (): void => {
		setShowConfirmDialog(false);
	};

	if (!workout) return null;

	const isEditing = !!existingLog;
	const buttonText = isEditing
		? (workoutStatus === 'completed' ? 'Update Workout' : 'Update Status')
		: (workoutStatus === 'completed' ? 'Save Workout' : 'Mark as Skipped');

	const renderStrengthExercises = () => (
		<div className="space-y-4">
			{exercises.length === 0 && (
				<p className="text-sm text-muted-foreground text-center py-4">
					No strength exercises to log for this workout
				</p>
			)}
			{exercises.map((exercise, exerciseIndex) => (
				<Card key={exercise.exerciseId}>
					<CardContent className="pt-6">
						<div className="space-y-4">
							<div className="flex items-center gap-2">
								<Input
									placeholder="Exercise name (e.g., Bench Press) *"
									value={exercise.exerciseName}
									onChange={(e) => updateExerciseName(exerciseIndex, e.target.value)}
									className="flex-1 disabled:opacity-100"
									required
									disabled={!!workout?.structure && workout.structure.length > 0}
								/>
								{exercises.length > 1 && (
									<Button
										onClick={() => removeExercise(exerciseIndex)}
										variant="ghost"
										size="icon"
									>
										<Trash2 className="h-4 w-4 text-destructive" />
									</Button>
								)}
							</div>

							<div className="space-y-2">
								<div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground">
									<div className="col-span-1">Set</div>
									<div className="col-span-4">Weight (lbs)</div>
									<div className="col-span-3">Reps</div>
									<div className="col-span-3">Done</div>
									<div className="col-span-1"></div>
								</div>

								{exercise.sets.map((set, setIndex) => (
									<div key={setIndex} className="grid grid-cols-12 gap-2 items-center">
										<div className="col-span-1 text-center font-semibold">
											{set.setNumber}
										</div>
										<div className="col-span-4">
											<Input
												type="number"
												value={set.weight}
												onChange={(e) => updateSet(exerciseIndex, setIndex, 'weight', parseFloat(e.target.value) || 0)}
												placeholder="135"
											/>
										</div>
										<div className="col-span-3">
											<Input
												type="number"
												value={set.reps}
												onChange={(e) => updateSet(exerciseIndex, setIndex, 'reps', parseInt(e.target.value) || 0)}
												placeholder="10"
											/>
										</div>
										<div className="col-span-3 flex justify-center">
											<Button
												onClick={() => updateSet(exerciseIndex, setIndex, 'completed', !set.completed)}
												variant={set.completed ? "default" : "outline"}
												size="sm"
												className="w-full"
											>
												{set.completed && <Check className="h-4 w-4" />}
											</Button>
										</div>
										<div className="col-span-1">
											{exercise.sets.length > 1 && (
												<Button
													onClick={() => removeSet(exerciseIndex, setIndex)}
													variant="ghost"
													size="icon"
													className="h-8 w-8"
												>
													<Trash2 className="h-3 w-3 text-muted-foreground" />
												</Button>
											)}
										</div>
									</div>
								))}

								<Button
									onClick={() => addSet(exerciseIndex)}
									variant="outline"
									size="sm"
									className="w-full mt-2"
								>
									<Plus className="h-3 w-3 mr-1" />
									Add Set
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			))}

			{exercises.length > 0 && (
				<div className="p-4 bg-muted rounded-lg">
					<div className="flex justify-between items-center">
						<span className="text-sm font-semibold">Total Volume:</span>
						<span className="text-2xl font-bold text-primary">
							{calculateTotalVolume().toLocaleString()} lbs
						</span>
					</div>
				</div>
			)}
		</div>
	);

	const renderDrills = () => (
		<div className="space-y-4">
			{drills.length === 0 && (
				<p className="text-sm text-muted-foreground text-center py-4">
					No drills to log for this workout
				</p>
			)}
			{drills.map((drill, drillIndex) => (
				<Card key={drill.exerciseId}>
					<CardContent className="pt-6">
						<div className="space-y-4">
							<div className="flex items-center gap-2">
								<div className="flex items-center gap-2 flex-1">
									<Button
										onClick={() => updateDrill(drillIndex, 'completed', !drill.completed)}
										variant={drill.completed ? "default" : "outline"}
										size="icon"
										className="shrink-0"
									>
										{drill.completed && <Check className="h-4 w-4" />}
									</Button>
									<Input
										placeholder="Drill name *"
										value={drill.name}
										onChange={(e) => updateDrill(drillIndex, 'name', e.target.value)}
										className="flex-1 disabled:opacity-100"
										required
										disabled={!!workout?.structure && workout.structure.length > 0}
									/>
								</div>
								{drills.length > 1 && (
									<Button
										onClick={() => removeDrill(drillIndex)}
										variant="ghost"
										size="icon"
									>
										<Trash2 className="h-4 w-4 text-destructive" />
									</Button>
								)}
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label>Duration (minutes) *</Label>
									<Input
										type="number"
										value={drill.durationMinutes}
										onChange={(e) => updateDrill(drillIndex, 'durationMinutes', parseFloat(e.target.value) || 0)}
										placeholder="20"
										required
									/>
								</div>

								<div className="space-y-2">
									<Label>Repetitions/Rounds</Label>
									<Input
										type="number"
										value={drill.repetitions || ''}
										onChange={(e) => updateDrill(drillIndex, 'repetitions', e.target.value ? parseInt(e.target.value) : undefined)}
										placeholder="5"
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label>Sets (optional)</Label>
									<Input
										type="number"
										value={drill.sets || ''}
										onChange={(e) => updateDrill(drillIndex, 'sets', e.target.value ? parseInt(e.target.value) : undefined)}
										placeholder="3"
									/>
								</div>

								<div className="space-y-2">
									<Label>Quality Rating (1-5)</Label>
									<div className="flex items-center gap-2">
										<Slider
											value={[drill.qualityRating]}
											onValueChange={(val) => updateDrill(drillIndex, 'qualityRating', val[0])}
											min={1}
											max={5}
											step={1}
											className="flex-1"
										/>
										<span className="text-xl font-bold text-primary w-8 text-center">
											{drill.qualityRating}
										</span>
									</div>
								</div>
							</div>

							<div className="space-y-2">
								<Label>Notes</Label>
								<Textarea
									value={drill.notes || ''}
									onChange={(e) => updateDrill(drillIndex, 'notes', e.target.value)}
									placeholder="Any observations, modifications, player count, etc."
									rows={2}
								/>
							</div>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);

	return (
		<Dialog open={open} onOpenChange={(isOpen) => {
			if (!isOpen) {
				handleClose();
			} else {
				setOpen(isOpen);
			}
		}}>
			<DialogTrigger asChild>
				{trigger || <Button>Log Results</Button>}
			</DialogTrigger>
			<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="text-2xl">
						{isEditing ? 'Edit Workout Results' : 'Log Workout Results'}
					</DialogTitle>
					<DialogDescription>
						{workout.name} - {workout.sport}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 py-4">
					<div className="space-y-3">
						<Label>Workout Status</Label>
						<RadioGroup
							value={workoutStatus}
							onValueChange={(val) => {
								setWorkoutStatus(val as 'completed' | 'skipped');
								markFormAsDirty();
							}}
						>
							<div className="flex items-center space-x-2">
								<RadioGroupItem value="completed" id="completed" />
								<Label htmlFor="completed" className="font-normal cursor-pointer">
									I completed this workout
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<RadioGroupItem value="skipped" id="skipped" />
								<Label htmlFor="skipped" className="font-normal cursor-pointer">
									I skipped this workout (intentionally)
								</Label>
							</div>
						</RadioGroup>
					</div>

					{workoutStatus === 'skipped' && (
						<div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
							<p className="text-sm text-yellow-800">
								You&apos;re marking this workout as skipped. Please add a note below explaining why (optional).
							</p>
						</div>
					)}

					<Separator />

					{workoutStatus === 'completed' && (
						<>
							<div className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="duration">Duration (minutes) *</Label>
										<Input
											id="duration"
											type="number"
											placeholder={workout.metrics.durationMins?.toString() || "45"}
											value={durationMinutes}
											onChange={(e) => {
												setDurationMinutes(e.target.value);
												markFormAsDirty();
											}}
											required
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="heartRate">Average Heart Rate (optional)</Label>
										<Input
											id="heartRate"
											type="number"
											placeholder="150"
											value={averageHeartRate}
											onChange={(e) => {
												setAverageHeartRate(e.target.value);
												markFormAsDirty();
											}}
										/>
									</div>
								</div>

								<div className="space-y-2">
									<Label>Perceived Effort (1-10)</Label>
									<div className="flex items-center gap-4">
										<Slider
											value={perceivedEffort}
											onValueChange={(val) => {
												setPerceivedEffort(val);
												markFormAsDirty();
											}}
											min={1}
											max={10}
											step={1}
											className="flex-1"
										/>
										<span className="text-2xl font-bold text-primary w-8 text-center">
											{perceivedEffort[0]}
										</span>
									</div>
									<p className="text-xs text-muted-foreground">
										1 = Very Easy, 5 = Moderate, 10 = Maximum Effort
									</p>
								</div>
							</div>

							<Separator />

							{isDistanceWorkout() && (
								<>
									<div className="space-y-4">
										<h3 className="text-lg font-semibold">Distance & Pace</h3>

										<div className="grid grid-cols-3 gap-4">
											<div className="space-y-2 col-span-2">
												<Label htmlFor="distance">Distance *</Label>
												<Input
													id="distance"
													type="number"
													step="0.1"
													placeholder={workout.metrics.distanceMiles?.toString() || "5.0"}
													value={distance}
													onChange={(e) => {
														setDistance(e.target.value);
														markFormAsDirty();
													}}
													required
												/>
											</div>

											<div className="space-y-2">
												<Label htmlFor="distanceUnit">Unit</Label>
												<Select
													value={distanceUnit}
													onValueChange={(val) => {
														setDistanceUnit(val as 'miles' | 'kilometers');
														markFormAsDirty();
													}}
												>
													<SelectTrigger id="distanceUnit">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="miles">Miles</SelectItem>
														<SelectItem value="kilometers">Kilometers</SelectItem>
													</SelectContent>
												</Select>
											</div>
										</div>

										<div className="space-y-2">
											<Label htmlFor="pace">Average Pace (min/{distanceUnit === 'miles' ? 'mile' : 'km'}) - Optional</Label>
											<Input
												id="pace"
												type="number"
												step="0.1"
												placeholder="8.5"
												value={averagePace}
												onChange={(e) => {
													setAveragePace(e.target.value);
													markFormAsDirty();
												}}
											/>
										</div>
									</div>
									<Separator />
								</>
							)}

							{(isStrengthWorkout() || drillWorkoutExists()) && (
								<div className="space-y-4">
									{hasMultipleActivityTypes() ? (
										<Tabs defaultValue="strength" className="w-full">
											<TabsList className="grid w-full grid-cols-2">
												<TabsTrigger value="strength">Strength Exercises</TabsTrigger>
												<TabsTrigger value="drills">Drills</TabsTrigger>
											</TabsList>
											<TabsContent value="strength" className="mt-4">
												<h3 className="text-lg font-semibold mb-4">Strength Exercises *</h3>
												{renderStrengthExercises()}
											</TabsContent>
											<TabsContent value="drills" className="mt-4">
												<h3 className="text-lg font-semibold mb-4">Drills *</h3>
												{renderDrills()}
											</TabsContent>
										</Tabs>
									) : (
										<>
											{isStrengthWorkout() && (
												<>
													<h3 className="text-lg font-semibold">Exercises *</h3>
													{renderStrengthExercises()}
												</>
											)}
											{drillWorkoutExists() && (
												<>
													<h3 className="text-lg font-semibold">Drills *</h3>
													{renderDrills()}
												</>
											)}
										</>
									)}
								</div>
							)}

							<Separator />
						</>
					)}

					<div className="space-y-2">
						<Label htmlFor="notes">
							Notes {workoutStatus === 'skipped' ? '(Why did you skip?)' : '(optional)'}
						</Label>
						<Textarea
							id="notes"
							placeholder={workoutStatus === 'skipped'
								? "e.g., Felt fatigued, had an injury, not enough time..."
								: "How did the workout feel? Any observations?"}
							value={notes}
							onChange={(e) => {
								setNotes(e.target.value);
								markFormAsDirty();
							}}
							rows={3}
						/>
					</div>

					<div className="flex gap-3 pt-4">
						<Button
							onClick={handleSubmit}
							className="flex-1"
							size="lg"
							disabled={!isFormValid()}
						>
							{buttonText}
						</Button>
						<Button onClick={handleClose} variant="outline" className="flex-1" size="lg">
							Cancel
						</Button>
					</div>

					{!isFormValid() && workoutStatus === 'completed' && (
						<p className="text-sm text-muted-foreground text-center">
							* Please fill in all required fields to continue
						</p>
					)}
				</div>
			</DialogContent>

			<Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Unsaved Changes</DialogTitle>
						<DialogDescription>
							You have unsaved changes. Are you sure you want to close without saving?
						</DialogDescription>
					</DialogHeader>
					<div className="flex gap-3 pt-4">
						<Button onClick={confirmClose} variant="destructive" className="flex-1">
							Discard Changes
						</Button>
						<Button onClick={cancelClose} variant="outline" className="flex-1">
							Keep Editing
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</Dialog>
	);
}