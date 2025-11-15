import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string || "mongodb://127.0.0.1:27017/hybrid-fit";

interface MongooseCache {
	conn: typeof mongoose | null;
	promise: Promise<typeof mongoose> | null;
}

declare global {
	var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
	global.mongoose = cached;
}

export async function connectToDatabase() {
	if (cached.conn) return cached.conn;

	if (!cached.promise) {
		cached.promise = mongoose
			.connect(MONGODB_URI, {
				dbName: "hybrid-fit",
				bufferCommands: false,
				// Connection pool configuration for better scaling
				maxPoolSize: 50, // Maximum number of connections in the pool
				minPoolSize: 10, // Minimum number of connections to maintain
				maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
				serverSelectionTimeoutMS: 5000, // Timeout for server selection (5 seconds)
				socketTimeoutMS: 45000, // Socket timeout (45 seconds)
			})
			.then((mongoose) => mongoose);
	}

	cached.conn = await cached.promise;
	return cached.conn;
}
