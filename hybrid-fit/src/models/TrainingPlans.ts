import mongoose, { Document, Schema } from "mongoose";

export interface TrainingPlanDay {
    dayOfWeek: string;
    workoutTemplateId: string;
}

export interface TrainingPlanWeek {
    weekNumber: number;
    days: TrainingPlanDay[];
}

export interface TrainingPlanDetails {
    goal: string;
    planType: string;
    weeklyStructure?: string[];
    sessionGlossary?: Record<string, string>;
}

export interface TrainingPlanDoc extends Document {
    _id: string;
    name: string;
    sport: string;
    category: string;
    durationWeeks: number;
    level: string;
    sourceUrl?: string;
    details: TrainingPlanDetails;
    weeks: TrainingPlanWeek[];
}

const trainingPlanSchema = new Schema<TrainingPlanDoc>(
    {
        _id: { type: String, required: true },
        name: { type: String, required: true },
        sport: { type: String, required: true },
        category: { type: String, required: true },
        durationWeeks: { type: Number, required: true },
        level: { type: String, required: true },
        sourceUrl: { type: String },
        details: {
            type: Schema.Types.Mixed as unknown as TrainingPlanDetails,
            required: true,
        },
        weeks: {
            type: [Schema.Types.Mixed as unknown as TrainingPlanWeek],
            required: true
        }
    },
    { timestamps: true }
);

export const TrainingPlan = mongoose.models.TrainingPlan || mongoose.model<TrainingPlanDoc>("User", trainingPlanSchema);