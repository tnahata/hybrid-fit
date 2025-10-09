import mongoose, { Schema, model } from "mongoose";
import fs from "fs";
import path from "path";
import { WorkoutDifficulty, NormalizedWorkoutTemplate } from "../normalizeWorkoutTemplates";

const jsonPath = path.resolve(__dirname, "../normalized-data/normalizedTemplates.json");

const workoutTemplateSchema = new Schema<NormalizedWorkoutTemplate>(
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

const WorkoutTemplateModel = model<NormalizedWorkoutTemplate>("WorkoutTemplate", workoutTemplateSchema);

async function seedworkoutTemplates() {
    const mongoUri =
        process.env.MONGODB_URI ||
        "mongodb://127.0.0.1:27017/hybrid-fit"; // adjust DB name as needed

    let workoutTemplates: NormalizedWorkoutTemplate[] = [];
    if (fs.existsSync(jsonPath)) {
        console.log("✅ Reading directory data from JSON...");
        const rawData = fs.readFileSync(jsonPath, "utf-8");
        workoutTemplates = JSON.parse(rawData);
    }

    await mongoose.connect(mongoUri);

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
    console.log(
        `🚀 Seeded ${result.upsertedCount + result.modifiedCount} workoutTemplates total`
    );

    await mongoose.disconnect();
}

seedworkoutTemplates().catch((err) => {
    console.error("❌ Error during seeding:", err);
    mongoose.disconnect();
});
