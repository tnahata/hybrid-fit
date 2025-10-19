"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const normalizeWorkoutTemplates_1 = require("../normalizeWorkoutTemplates");
const jsonPath = path_1.default.resolve(__dirname, "../normalized-data/normalizedTemplates.json");
const workoutExerciseStructureSchema = new mongoose_1.Schema({
    exerciseId: { type: String, ref: "Exercise", required: true },
    sets: { type: Number },
    reps: { type: Number },
    durationMins: { type: Number },
    durationSecs: { type: Number },
    restSeconds: { type: Number },
    notes: { type: String },
}, { _id: false });
const workoutTemplateSchema = new mongoose_1.Schema({
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
        enum: Object.values(normalizeWorkoutTemplates_1.WorkoutDifficulty),
        default: normalizeWorkoutTemplates_1.WorkoutDifficulty.BEGINNER,
    },
    tags: [{ type: String }],
    structure: [workoutExerciseStructureSchema],
}, { timestamps: true });
const WorkoutTemplateModel = (0, mongoose_1.model)("WorkoutTemplate", workoutTemplateSchema);
async function seedworkoutTemplates() {
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/hybrid-fit"; // adjust DB name as needed
    let workoutTemplates = [];
    if (fs_1.default.existsSync(jsonPath)) {
        console.log("✅ Reading directory data from JSON...");
        const rawData = fs_1.default.readFileSync(jsonPath, "utf-8");
        workoutTemplates = JSON.parse(rawData);
    }
    await mongoose_1.default.connect(mongoUri);
    // Optional: clear existing collection first
    // await WorkoutTemplateModel.deleteMany({});
    // console.log("🧹 Cleared existing Exercise collection");
    // Use bulkWrite for efficiency and deduplication safety
    const bulkOps = workoutTemplates.map((tpl) => ({
        updateOne: {
            filter: { _id: tpl._id },
            update: { $set: tpl },
            upsert: true,
        },
    }));
    const result = await WorkoutTemplateModel.bulkWrite(bulkOps);
    console.log(`🚀 Seeded ${result.upsertedCount + result.modifiedCount} workoutTemplates total`);
    await mongoose_1.default.disconnect();
}
seedworkoutTemplates().catch((err) => {
    console.error("❌ Error during seeding:", err);
    mongoose_1.default.disconnect();
});
