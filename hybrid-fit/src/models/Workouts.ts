import mongoose, { Document, Schema } from "mongoose";

export enum WorkoutDifficulty {
    BEGINNER = "beginner",
    INTERMEDIATE = "intermediate",
    ADVANCED = "advanced",
}

/**
 * Represents a single exercise structure inside a workout template
 */
export interface WorkoutExerciseStructure {
    exerciseId: string;
    sets?: number;
    reps?: number;
    durationMins?: number;
    durationSecs?: number;
    restSeconds?: number;
    notes?: string;
}

/**
 * Interface for normalized workout template
 */
export interface WorkoutTemplateDoc extends Document {
    _id: string;
    name: string;
    sport: string;
    category: string;
    description: string;
    metrics: {
        distanceMiles?: number | null;
        durationMins?: number | null;
        [key: string]: any;
    };
    difficulty: WorkoutDifficulty;
    tags: string[];
    structure?: WorkoutExerciseStructure[]; // Detailed structure of the workout
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * Schema for workout exercise structure
 */
const workoutExerciseStructureSchema = new Schema<WorkoutExerciseStructure>(
    {
        exerciseId: { type: String, ref: "Exercise", required: true },
        sets: { type: Number },
        reps: { type: Number },
        durationMins: { type: Number },
        durationSecs: { type: Number },
        restSeconds: { type: Number },
        notes: { type: String },
    },
    { _id: false }
);

/**
 * Main Workout Template schema
 */
const workoutTemplateSchema = new Schema<WorkoutTemplateDoc>(
    {
        _id: { type: String, required: true },
        name: { type: String, required: true },
        sport: { type: String, required: true },
        category: { type: String, required: true },
        description: { type: String, required: true },
        metrics: {
            distanceMiles: { type: Number, default: null },
            durationMins: { type: Number, default: null },
        },
        difficulty: {
            type: String,
            enum: Object.values(WorkoutDifficulty),
            default: WorkoutDifficulty.BEGINNER,
        },
        tags: [{ type: String }],
        structure: [workoutExerciseStructureSchema],
    },
    { timestamps: true }
);

export const WorkoutTemplate = mongoose.models?.WorkoutTemplate || mongoose.model<WorkoutTemplateDoc>("WorkoutTemplate", workoutTemplateSchema);