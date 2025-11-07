import mongoose, { Schema, model } from "mongoose";
import fs from "fs";
import path from "path";
import { ExerciseType, NormalizedExercise } from "../normalizeExercises";

const jsonPath = path.resolve(__dirname, "../normalized-data/normalizedExercises.json");

const exerciseSchema = new Schema<NormalizedExercise>(
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

async function seedExercises() {
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/hybrid-fit";

    const ExerciseModel = model<NormalizedExercise>("Exercise", exerciseSchema);

    let exercises: NormalizedExercise[] = [];
    if (fs.existsSync(jsonPath)) {
        console.log("✅ Reading directory data from JSON...");
        const rawData = fs.readFileSync(jsonPath, "utf-8");
        exercises = JSON.parse(rawData);
    }

    await mongoose.connect(mongoUri);

    // Assign a type if missing (default to 'drill' for safety)
    const exercisesWithType = exercises.map((ex) => ({
        ...ex,
        type:
            ex.type ||
            (ex.category?.toLowerCase().includes("strength")
                ? ExerciseType.STRENGTH
                : ex.category?.toLowerCase().includes("stretch")
                    ? ExerciseType.STRETCH
                    : ExerciseType.DRILL),
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
    console.log(
        `🚀 Seeded ${result.upsertedCount + result.modifiedCount} exercises total`
    );

    await mongoose.disconnect();
}

seedExercises().catch((err) => {
    console.error("❌ Error during seeding:", err);
    mongoose.disconnect();
});
