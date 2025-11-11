import mongoose, { Document, Schema } from "mongoose";

export interface WorkoutLog {
	_id?: mongoose.Types.ObjectId
	date: Date;
	workoutTemplateId: string;
	status: "completed" | "skipped" | "missed";
	notes?: string;

	durationMinutes?: number;
	perceivedEffort?: number;
	activityType?: string;
	sport?: string;

	distance?: {
		value: number;
		unit: "miles" | "kilometers";
	};
	pace?: {
		average: number;
		unit: "min/mile" | "min/km";
	};

	strengthSession?: {
		exercises: Array<{
			exerciseId: string;
			exerciseName: string;
			sets: Array<{
				setNumber: number;
				reps: number;
				weight: number;
				completed: boolean;
			}>;
		}>;
		totalVolume: number;
		volumeUnit: "kgs" | "lbs";
	};

	drillSession?: {
		activities: Array<{
			exerciseId: string,
			name: string;
			durationMinutes?: number;
			repetitions?: number;
			sets?: number;
			notes?: string;
			qualityRating: number;
			completed: boolean;
		}>;
		customMetrics?: Record<string, number | string>;
	};

	heartRate?: {
		average: number;
	};
}

export enum DayOfWeek {
	MON = "Mon",
	TUE = "Tue",
	WED = "Wed",
	THU = "Thu",
	FRI = "Fri",
	SAT = "Sat",
	SUN = "Sun",
}

export interface WorkoutOverride {
	weekNumber: number;
	dayOfWeek: DayOfWeek;
	customWorkoutId: string;
}

export interface UserPlanProgress {
	planId: string;

	startedAt: Date;
	completedAt?: Date;
	currentWeek: number;
	currentDayIndex: number;
	isActive: boolean;

	overrides: WorkoutOverride[];
	progressLog: WorkoutLog[];
}

export interface UserDoc extends Document {
	email: string;
	name: string;
	passwordHash?: string;

	trainingPlans: UserPlanProgress[];

	totalWorkoutsCompleted: number;
	currentStreak: number;
	longestStreak: number;
	lastWorkoutDate?: Date;
	lastProgressUpdateDate?: Date;

	createdAt: Date;
	updatedAt: Date;

	resetPasswordToken?: string;
	resetPasswordExpiry?: Date;
}

const workoutLogSchema = new Schema<WorkoutLog>({
	date: { type: Date, required: true },
	workoutTemplateId: { type: String, required: true },
	status: {
		type: String,
		enum: ["completed", "skipped", "missed"],
		required: true
	},
	notes: { type: String },

	durationMinutes: { type: Number },
	perceivedEffort: {
		type: Number,
		min: 1,
		max: 10
	},
	activityType: { type: String },
	sport: { type: String },

	distance: {
		value: { type: Number },
		unit: {
			type: String,
			enum: ["miles", "kilometers"]
		}
	},
	pace: {
		average: { type: Number },
		unit: {
			type: String,
			enum: ["min/mile", "min/km"]
		}
	},

	strengthSession: {
		exercises: [{
			exerciseId: { type: String },
			exerciseName: { type: String },
			sets: [{
				setNumber: { type: Number },
				reps: { type: Number },
				weight: { type: Number },
				completed: { type: Boolean }
			}]
		}],
		totalVolume: { type: Number },
		volumeUnit: {
			type: String,
			enum: ["kgs", "lbs"]
		}
	},

	drillSession: {
		activities: [{
			exerciseId: { type: String },
			name: { type: String },
			durationMinutes: { type: Number },
			repetitions: { type: Number },
			sets: { type: Number },
			qualityRating: { type: Number, min: 1, max: 5 },
			completed: { type: Boolean },
			notes: { type: String }
		}],
		customMetrics: {
			type: Map,
			of: Schema.Types.Mixed
		}
	},

	heartRate: {
		average: { type: Number }
	}
});

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

	startedAt: { type: Date, required: true },
	completedAt: { type: Date },
	currentWeek: { type: Number, default: 1 },
	currentDayIndex: { type: Number, default: 0 },
	isActive: { type: Boolean, default: true },

	overrides: [workoutOverrideSchema],
	progressLog: [workoutLogSchema],
});

const userSchema = new Schema<UserDoc>({
	email: { type: String, required: true, unique: true },
	name: { type: String, required: true },
	passwordHash: { type: String, required: true, select: false },

	trainingPlans: [userPlanProgressSchema],

	totalWorkoutsCompleted: { type: Number, default: 0 },
	currentStreak: { type: Number, default: 0 },
	longestStreak: { type: Number, default: 0 },
	lastWorkoutDate: { type: Date },
	lastProgressUpdateDate: { type: Date },
	resetPasswordToken: { type: String },
	resetPasswordExpiry: { type: Date },
},
	{ timestamps: true }
);

export const User = mongoose.models?.User || mongoose.model<UserDoc>("User", userSchema);