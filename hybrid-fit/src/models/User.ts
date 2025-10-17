import mongoose, { Document, Schema } from "mongoose";

// For daily completion tracking
interface WorkoutLog {
    date: Date;
    workoutTemplateId: string; // could be from base plan or custom
    status: "completed" | "skipped" | "missed";
    notes?: string;
};

enum DayOfWeek {
    MON = "Mon",
    TUE = "Tue",
    WED = "Wed",
    THU = "Thu",
    FRI = "Fri",
    SAT = "Sat",
    SUN = "Sun",
};

// Custom workout override for a specific day
export interface WorkoutOverride {
    weekNumber: number;
    dayOfWeek: DayOfWeek;
    customWorkoutId: string; // reference to a modified or alternative workout
}

export interface UserPlanProgress {
    planId: string;
    planName: string;
    totalWeeks: number; // comes from the training plan

    startedAt: Date;
    completedAt?: Date; // optionally empty if not completed
    currentWeek: number;
    currentDayIndex: number;
    isActive: boolean;

    overrides: WorkoutOverride[]; // personalization

    progressLog: WorkoutLog[]; // progress tracking
};

export interface UserDoc extends Document {
    email: string;
    name?: string;
    passwordHash?: string;

    trainingPlans: UserPlanProgress[];

    totalWorkoutsCompleted: number;
    currentStreak: number;
    longestStreak: number;
    lastWorkoutDate?: Date;

    createdAt: Date;
    updatedAt: Date;
};

const workoutLogSchema = new Schema<WorkoutLog>({
    date: { type: Date, required: true },
    workoutTemplateId: { type: String, required: true },
    status: { type: String, enum: ["completed", "skipped", "missed"], required: true },
    notes: String,
});

// --- Workout Override Schema ---
const workoutOverrideSchema = new Schema<WorkoutOverride>({
    weekNumber: { type: Number, required: true },
    dayOfWeek: {
        type: String,
        enum: Object.values(DayOfWeek),
        default: DayOfWeek.MON,
    },
    customWorkoutId: { type: String, required: true },
});

const userPlanProgressSchema = new Schema<UserPlanProgress>({
    planId: { type: String, required: true },
    planName: { type: String, required: true },
    totalWeeks: { type: Number, required: true },

    startedAt: { type: Date, required: true },
    completedAt: Date,
    currentWeek: { type: Number, default: 1 },
    currentDayIndex: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },

    overrides: [workoutOverrideSchema],
    progressLog: [workoutLogSchema],
});

const userSchema = new Schema<UserDoc>(
    {
        email: { type: String, required: true, unique: true },
        name: String,
        passwordHash: String,

        trainingPlans: [userPlanProgressSchema],

        totalWorkoutsCompleted: { type: Number, default: 0 },
        currentStreak: { type: Number, default: 0 },
        longestStreak: { type: Number, default: 0 },
        lastWorkoutDate: Date,
    },
    { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model<UserDoc>("User", userSchema);