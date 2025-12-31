import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer | null = null;

/**
 * Connect to an in-memory MongoDB instance for testing
 */
export async function connectTestDatabase(): Promise<void> {
	mongoServer = await MongoMemoryServer.create();
	const mongoUri = mongoServer.getUri();

	await mongoose.connect(mongoUri, {
		dbName: 'hybrid-fit-test',
	});
}

/**
 * Disconnect from the test database and stop the in-memory server
 */
export async function disconnectTestDatabase(): Promise<void> {
	if (mongoose.connection.readyState !== 0) {
		await mongoose.disconnect();
	}

	if (mongoServer) {
		await mongoServer.stop();
		mongoServer = null;
	}
}

/**
 * Clear all collections in the test database
 */
export async function clearDatabase(): Promise<void> {
	const collections = mongoose.connection.collections;

	for (const key in collections) {
		await collections[key].deleteMany({});
	}
}
