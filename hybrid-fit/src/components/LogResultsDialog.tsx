import React, { useState } from 'react';
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

interface WorkoutTemplateDoc {
    _id: string;
    name: string;
    sport: string;
    category: string;
    description: string;
    metrics: {
        distanceMiles?: number;
        durationMins?: number;
    };
}

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

interface LogResultsDialogProps {
    workout: WorkoutTemplateDoc | null;
    onSubmit: (data: any) => void;
    trigger?: React.ReactNode;
}

export default function LogResultsDialog({ workout, onSubmit, trigger }: LogResultsDialogProps) {
    const [open, setOpen] = useState<boolean>(false);

    // Common fields
    const [durationMinutes, setDurationMinutes] = useState<string>('');
    const [perceivedEffort, setPerceivedEffort] = useState<number[]>([5]);
    const [notes, setNotes] = useState<string>('');

    // Distance-based fields (running, cycling, swimming)
    const [distance, setDistance] = useState<string>('');
    const [distanceUnit, setDistanceUnit] = useState<'miles' | 'kilometers'>('miles');
    const [averagePace, setAveragePace] = useState<string>('');
    const [averageHeartRate, setAverageHeartRate] = useState<string>('');

    // Strength training fields
    const [exercises, setExercises] = useState<Exercise[]>([
        {
            exerciseId: '1',
            exerciseName: 'Squat',
            sets: [
                { setNumber: 1, reps: 10, weight: 135, completed: false },
                { setNumber: 2, reps: 10, weight: 135, completed: false },
                { setNumber: 3, reps: 10, weight: 135, completed: false },
            ]
        }
    ]);

    const isDistanceWorkout = (): boolean => {
        if (!workout) return false;
        const distanceSports = ['running', 'cycling', 'swimming'];
        return distanceSports.includes(workout.sport.toLowerCase());
    };

    const isStrengthWorkout = (): boolean => {
        if (!workout) return false;
        return workout.sport.toLowerCase() === 'strength' ||
            workout.category.toLowerCase().includes('strength');
    };

    const addExercise = (): void => {
        setExercises([...exercises, {
            exerciseId: Date.now().toString(),
            exerciseName: '',
            sets: [{ setNumber: 1, reps: 10, weight: 0, completed: false }]
        }]);
    };

    const removeExercise = (index: number): void => {
        setExercises(exercises.filter((_, i) => i !== index));
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
    };

    const removeSet = (exerciseIndex: number, setIndex: number): void => {
        const newExercises = [...exercises];
        newExercises[exerciseIndex].sets = newExercises[exerciseIndex].sets.filter((_, i) => i !== setIndex);
        // Renumber sets
        newExercises[exerciseIndex].sets.forEach((set, i) => {
            set.setNumber = i + 1;
        });
        setExercises(newExercises);
    };

    const updateExerciseName = (index: number, name: string): void => {
        const newExercises = [...exercises];
        newExercises[index].exerciseName = name;
        setExercises(newExercises);
    };

    const updateSet = (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight' | 'completed', value: number | boolean): void => {
        const newExercises = [...exercises];
        newExercises[exerciseIndex].sets[setIndex][field] = value as never;
        setExercises(newExercises);
    };

    const calculateTotalVolume = (): number => {
        return exercises.reduce((total, exercise) => {
            return total + exercise.sets.reduce((exTotal, set) => {
                return exTotal + (set.weight * set.reps);
            }, 0);
        }, 0);
    };

    const handleSubmit = (): void => {
        console.log("entered");
        const data: any = {
            date: new Date(),
            workoutTemplateId: workout?._id,
            status: 'completed',
            durationMinutes: parseFloat(durationMinutes) || undefined,
            perceivedEffort: perceivedEffort[0],
            notes: notes || undefined,
            activityType: isStrengthWorkout() ? 'strength' : isDistanceWorkout() ? 'distance' : 'time',
            sport: workout?.sport,
        };

        // Distance-based workout data
        if (isDistanceWorkout()) {
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
        }

        // Strength workout data
        if (isStrengthWorkout()) {
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

        // Heart rate (all workouts)
        if (averageHeartRate) {
            data.heartRate = {
                average: parseFloat(averageHeartRate),
            };
        }

        onSubmit(data);
        setOpen(false);
    };

    const resetForm = (): void => {
        setDurationMinutes('');
        setPerceivedEffort([5]);
        setNotes('');
        setDistance('');
        setAveragePace('');
        setAverageHeartRate('');
        setExercises([{
            exerciseId: '1',
            exerciseName: 'Squat',
            sets: [{ setNumber: 1, reps: 10, weight: 135, completed: false }]
        }]);
    };

    if (!workout) return null;

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) resetForm();
        }}>
            <DialogTrigger asChild>
                {trigger || <Button>Log Results</Button>}
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Log Workout Results</DialogTitle>
                    <DialogDescription>
                        {workout.name} - {workout.sport}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Common Fields - Always Shown */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="duration">Duration (minutes)</Label>
                                <Input
                                    id="duration"
                                    type="number"
                                    placeholder={workout.metrics.durationMins?.toString() || "45"}
                                    value={durationMinutes}
                                    onChange={(e) => setDurationMinutes(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="heartRate">Average Heart Rate (optional)</Label>
                                <Input
                                    id="heartRate"
                                    type="number"
                                    placeholder="150"
                                    value={averageHeartRate}
                                    onChange={(e) => setAverageHeartRate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Perceived Effort (1-10)</Label>
                            <div className="flex items-center gap-4">
                                <Slider
                                    value={perceivedEffort}
                                    onValueChange={setPerceivedEffort}
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

                    {/* Distance-Based Workouts (Running, Cycling, Swimming) */}
                    {isDistanceWorkout() && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Distance & Pace</h3>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="distance">Distance</Label>
                                    <Input
                                        id="distance"
                                        type="number"
                                        step="0.1"
                                        placeholder={workout.metrics.distanceMiles?.toString() || "5.0"}
                                        value={distance}
                                        onChange={(e) => setDistance(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="distanceUnit">Unit</Label>
                                    <Select value={distanceUnit} onValueChange={(val) => setDistanceUnit(val as 'miles' | 'kilometers')}>
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
                                    onChange={(e) => setAveragePace(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Strength Workouts */}
                    {isStrengthWorkout() && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">Exercises</h3>
                                <Button onClick={addExercise} variant="outline" size="sm">
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Exercise
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {exercises.map((exercise, exerciseIndex) => (
                                    <Card key={exercise.exerciseId}>
                                        <CardContent className="pt-6">
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        placeholder="Exercise name (e.g., Bench Press)"
                                                        value={exercise.exerciseName}
                                                        onChange={(e) => updateExerciseName(exerciseIndex, e.target.value)}
                                                        className="flex-1"
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
                            </div>

                            <div className="p-4 bg-muted rounded-lg">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-semibold">Total Volume:</span>
                                    <span className="text-2xl font-bold text-primary">
                                        {calculateTotalVolume().toLocaleString()} lbs
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <Separator />

                    {/* Notes - Always Shown */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes (optional)</Label>
                        <Textarea
                            id="notes"
                            placeholder="How did the workout feel? Any observations?"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-3 pt-4">
                        <Button onClick={handleSubmit} className="flex-1" size="lg">
                            Save Workout
                        </Button>
                        <Button onClick={() => setOpen(false)} variant="outline" className="flex-1" size="lg">
                            Cancel
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}