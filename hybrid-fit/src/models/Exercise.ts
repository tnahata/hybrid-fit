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
    details: Record<string, string | number>;
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

// Database indexes for performance optimization
exerciseSchema.index({ sport: 1, type: 1 }); // Fast filtering by sport and type
exerciseSchema.index({ category: 1 }); // Fast category lookups
exerciseSchema.index({ tags: 1 }); // Fast tag-based searches
exerciseSchema.index({ difficulty: 1 }); // Fast difficulty filtering

export const Exercise = models.Exercise || mongoose.model<ExerciseDoc>("Exercise", exerciseSchema);