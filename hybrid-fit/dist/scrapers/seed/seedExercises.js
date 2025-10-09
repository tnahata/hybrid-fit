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
const normalizeExercises_1 = require("../normalizeExercises");
const jsonPath = path_1.default.resolve(__dirname, "../normalized-data/normalizedExercises.json");
const exerciseSchema = new mongoose_1.Schema({
    _id: { type: String, required: true },
    name: { type: String, required: true },
    type: {
        type: String,
        enum: Object.values(normalizeExercises_1.ExerciseType),
        default: normalizeExercises_1.ExerciseType.DRILL,
    },
    category: { type: String },
    sport: { type: String },
    focus: [{ type: String }],
    difficulty: { type: String },
    equipment: [{ type: String }],
    description: { type: String },
    instructions: { type: String },
    sourceUrl: { type: String },
    details: { type: mongoose_1.Schema.Types.Mixed },
    durationMinutes: { type: Number, default: null },
    tags: [{ type: String }],
}, { timestamps: true } // tells mongoose to automatically create 'createdAt' and 'updatedAt' fields in the document
);
async function seedExercises() {
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/hybrid-fit";
    const ExerciseModel = (0, mongoose_1.model)("Exercise", exerciseSchema);
    let exercises = [];
    if (fs_1.default.existsSync(jsonPath)) {
        console.log("✅ Reading directory data from JSON...");
        const rawData = fs_1.default.readFileSync(jsonPath, "utf-8");
        exercises = JSON.parse(rawData);
    }
    await mongoose_1.default.connect(mongoUri);
    // Optional: clear existing collection first
    // await ExerciseModel.deleteMany({});
    // console.log("🧹 Cleared existing Exercise collection");
    // Assign a type if missing (default to 'drill' for safety)
    const exercisesWithType = exercises.map((ex) => ({
        ...ex,
        type: ex.type ||
            (ex.category?.toLowerCase().includes("strength")
                ? normalizeExercises_1.ExerciseType.STRENGTH
                : ex.category?.toLowerCase().includes("stretch")
                    ? normalizeExercises_1.ExerciseType.STRETCH
                    : normalizeExercises_1.ExerciseType.DRILL),
    }));
    // Use bulkWrite for efficiency and deduplication safety
    const bulkOps = exercisesWithType.map((ex) => ({
        updateOne: {
            filter: { _id: ex._id },
            update: { $set: ex },
            upsert: true,
        },
    }));
    const result = await ExerciseModel.bulkWrite(bulkOps);
    console.log(`🚀 Seeded ${result.upsertedCount + result.modifiedCount} exercises total`);
    await mongoose_1.default.disconnect();
}
seedExercises().catch((err) => {
    console.error("❌ Error during seeding:", err);
    mongoose_1.default.disconnect();
});
