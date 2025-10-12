import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string || "mongodb://127.0.0.1:27017/hybrid-fit";
// if (!MONGODB_URI) {
//     throw new Error("❌ Missing MONGODB_URI in environment variables");
// }

/**
 * Maintains a global cached connection for hot reloads (Next.js dev mode)
 */
let cached = (global as any).mongoose;

if (!cached) {
    cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        cached.promise = mongoose
            .connect(MONGODB_URI, {
                dbName: "hybrid-fit",
                bufferCommands: false,
            })
            .then((mongoose) => mongoose);
    }

    cached.conn = await cached.promise;
    return cached.conn;
}
