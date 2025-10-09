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
const jsonPath = path_1.default.resolve(__dirname, "../normalized-data/normalizedTrainingPlans.json");
const trainingPlanSchema = new mongoose_1.Schema({
    _id: { type: String, required: true },
    name: { type: String, required: true },
    sport: { type: String, required: true },
    category: { type: String, required: true },
    durationWeeks: { type: Number, required: true },
    level: { type: String, required: true },
    sourceUrl: { type: String },
    details: {
        type: mongoose_1.Schema.Types.Mixed,
        required: true,
    },
    weeks: {
        type: [mongoose_1.Schema.Types.Mixed],
        required: true
    }
}, { timestamps: true });
async function seedworkoutTemplates() {
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/hybrid-fit";
    let trainingPlans = [];
    if (fs_1.default.existsSync(jsonPath)) {
        console.log("✅ Reading training plans from JSON...");
        const rawData = fs_1.default.readFileSync(jsonPath, "utf-8");
        trainingPlans = JSON.parse(rawData);
    }
    const TrainingPlanModel = (0, mongoose_1.model)("TrainingPlans", trainingPlanSchema);
    await mongoose_1.default.connect(mongoUri);
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
    console.log(`🚀 Seeded ${result.upsertedCount + result.modifiedCount} training plans total`);
    await mongoose_1.default.disconnect();
}
seedworkoutTemplates().catch((err) => {
    console.error("❌ Error during seeding:", err);
    mongoose_1.default.disconnect();
});
