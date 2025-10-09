import mongoose, { Schema, model } from "mongoose";
import fs from "fs";
import path from "path";
import { NormalizedTrainingPlan, TrainingPlanDetails, TrainingPlanDay, TrainingPlanWeek } from "../normalizeTrainingPlans";

const jsonPath = path.resolve(__dirname, "../normalized-data/normalizedTrainingPlans.json");

const trainingPlanSchema = new Schema<NormalizedTrainingPlan>(
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

async function seedworkoutTemplates() {
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/hybrid-fit";

    let trainingPlans: NormalizedTrainingPlan[] = [];
    if (fs.existsSync(jsonPath)) {
        console.log("✅ Reading training plans from JSON...");
        const rawData = fs.readFileSync(jsonPath, "utf-8");
        trainingPlans = JSON.parse(rawData);
    }

    const TrainingPlanModel = model<NormalizedTrainingPlan>("TrainingPlans", trainingPlanSchema);

    await mongoose.connect(mongoUri);

    // Optional: clear existing collection first
    // await TrainingPlanModel.deleteMany({});
    // console.log("🧹 Cleared existing training plans collection");

    // Use bulkWrite for efficiency and deduplication safety
    const bulkOps = trainingPlans.map((pl) => ({
        updateOne: {
            filter: { _id: pl._id },
            update: { $set: pl },
            upsert: true,
        },
    }));

    const result = await TrainingPlanModel.bulkWrite(bulkOps);
    console.log(
        `🚀 Seeded ${result.upsertedCount + result.modifiedCount} training plans total`
    );

    await mongoose.disconnect();
}

seedworkoutTemplates().catch((err) => {
    console.error("❌ Error during seeding:", err);
    mongoose.disconnect();
});
