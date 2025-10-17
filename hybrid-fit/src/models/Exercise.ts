import mongoose, { Schema, Document, models } from "mongoose";

export enum ExerciseType {
    STRENGTH = "strength",
    STRETCH = "stretch",
    DRILL = "drill",
    WARMUP = "warmup",
    COOLDOWN = "cooldown",
    CONDITIONING = "conditioning",
}

export interface ExerciseDoc extends Document {
    _id: string;
    name: string;
    type: ExerciseType;
    category: string;
    sport: string;
    focus: string[];
    difficulty: string;
    equipment: string[];
    description: string;
    instructions?: string;
    sourceUrl: string;
    details: Record<string, any>;
    durationMinutes: number | null;
    tags: string[];
}

const exerciseSchema = new Schema<ExerciseDoc>(
    {
        _id: { type: String, required: true },
        name: { type: String, required: true },
        type: {
            type: String,
            enum: Object.values(ExerciseType),
            default: ExerciseType.DRILL,
        },
        category: { type: String },
        sport: { type: String },
        focus: [{ type: String }],
        difficulty: { type: String },
        equipment: [{ type: String }],
        description: { type: String },
        instructions: { type: String },
        sourceUrl: { type: String },
        details: { type: Schema.Types.Mixed },
        durationMinutes: { type: Number, default: null },
        tags: [{ type: String }],
    },
    { timestamps: true } // tells mongoose to automatically create 'createdAt' and 'updatedAt' fields in the document
);

export const Exercise = models.Exercise || mongoose.model<ExerciseDoc>("Exercise", exerciseSchema);