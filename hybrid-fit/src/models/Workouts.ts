import mongoose, { Document, Schema } from "mongoose";

export enum WorkoutDifficulty {
    BEGINNER = "beginner",
    INTERMEDIATE = "intermediate",
    ADVANCED = "advanced",
};

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
    difficulty: string;
    tags: string[];
};

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
    },
    { timestamps: true }
);

export const WorkoutTemplate = mongoose.models.WorkoutTemplate || mongoose.model<WorkoutTemplateDoc>("WorkoutTemplate", workoutTemplateSchema);