import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { connectToDatabase } from '../mongodb';

// Store original mongoose
const originalConnect = mongoose.connect;

describe('mongodb connection', () => {
	beforeEach(() => {
		// Reset global mongoose cache
		if (global.mongoose) {
			global.mongoose.conn = null;
			global.mongoose.promise = null;
		}
		vi.clearAllMocks();
	});

	afterEach(async () => {
		// Clean up any connections
		if (mongoose.connection.readyState !== 0) {
			await mongoose.disconnect();
		}
		// Reset global mongoose cache
		if (global.mongoose) {
			global.mongoose.conn = null;
			global.mongoose.promise = null;
		}
	});

	it('should connect to database successfully', async () => {
		const mockMongoose = {
			connection: {
				readyState: 1,
			},
		};

		const mockConnect = vi.fn().mockResolvedValue(mockMongoose);
		mongoose.connect = mockConnect;

		const result = await connectToDatabase();

		expect(mockConnect).toHaveBeenCalledTimes(1);
		expect(mockConnect).toHaveBeenCalledWith(
			expect.stringContaining('mongodb://'),
			expect.objectContaining({
				dbName: 'hybrid-fit',
				bufferCommands: false,
			})
		);
		expect(result).toBe(mockMongoose);
	});

	it('should return cached connection on subsequent calls', async () => {
		const mockMongoose = {
			connection: {
				readyState: 1,
			},
		};

		const mockConnect = vi.fn().mockResolvedValue(mockMongoose);
		mongoose.connect = mockConnect;

		// First call
		const result1 = await connectToDatabase();

		// Second call
		const result2 = await connectToDatabase();

		// Should only connect once
		expect(mockConnect).toHaveBeenCalledTimes(1);
		expect(result1).toBe(result2);
		expect(result1).toBe(mockMongoose);
	});

	it('should reuse existing connection if already connected', async () => {
		const mockMongoose = {
			connection: {
				readyState: 1,
			},
		};

		// Set up cached connection
		if (!global.mongoose) {
			global.mongoose = { conn: null, promise: null };
		}
		global.mongoose.conn = mockMongoose as typeof mongoose;

		const mockConnect = vi.fn();
		mongoose.connect = mockConnect;

		const result = await connectToDatabase();

		// Should not call connect if already connected
		expect(mockConnect).not.toHaveBeenCalled();
		expect(result).toBe(mockMongoose);
	});

	it('should handle connection errors', async () => {
		const mockError = new Error('Connection failed');
		const mockConnect = vi.fn().mockRejectedValue(mockError);
		mongoose.connect = mockConnect;

		await expect(connectToDatabase()).rejects.toThrow('Connection failed');
		expect(mockConnect).toHaveBeenCalledTimes(1);
	});

	it('should use MONGODB_URI from environment variable', async () => {
		// Store original env var and module
		const originalEnv = process.env.MONGODB_URI;
		const testUri = 'mongodb://test-uri:27017/test-db';

		// Set test environment variable
		process.env.MONGODB_URI = testUri;

		// Reset modules to reload mongodb.ts with new env var
		vi.resetModules();

		// Re-import after resetting modules
		const { connectToDatabase: connectToDatabaseWithEnv } = await import('../mongodb');

		const mockMongoose = {
			connection: {
				readyState: 1,
			},
		};

		const mockConnect = vi.fn().mockResolvedValue(mockMongoose);
		mongoose.connect = mockConnect;

		await connectToDatabaseWithEnv();

		// Verify connection was called with the exact URI from environment
		expect(mockConnect).toHaveBeenCalledWith(
			testUri,
			expect.any(Object)
		);

		// Restore original environment variable
		process.env.MONGODB_URI = originalEnv;
		vi.resetModules();
	});

	it('should use default URI when MONGODB_URI is not set', async () => {
		// Store original env var
		const originalEnv = process.env.MONGODB_URI;
		const defaultUri = 'mongodb://127.0.0.1:27017/hybrid-fit';

		// Delete environment variable
		delete process.env.MONGODB_URI;

		// Reset modules to reload mongodb.ts without env var
		vi.resetModules();

		// Re-import after resetting modules
		const { connectToDatabase: connectToDatabaseWithDefault } = await import('../mongodb');

		const mockMongoose = {
			connection: {
				readyState: 1,
			},
		};

		const mockConnect = vi.fn().mockResolvedValue(mockMongoose);
		mongoose.connect = mockConnect;

		await connectToDatabaseWithDefault();

		// Verify connection was called with the default URI
		expect(mockConnect).toHaveBeenCalledWith(
			defaultUri,
			expect.any(Object)
		);

		// Restore original environment variable
		process.env.MONGODB_URI = originalEnv;
		vi.resetModules();
	});

	it('should configure connection pool settings', async () => {
		const mockMongoose = {
			connection: {
				readyState: 1,
			},
		};

		const mockConnect = vi.fn().mockResolvedValue(mockMongoose);
		mongoose.connect = mockConnect;

		await connectToDatabase();

		const connectOptions = mockConnect.mock.calls[0][1];
		expect(connectOptions).toMatchObject({
			dbName: 'hybrid-fit',
			bufferCommands: false,
			maxPoolSize: 50,
			minPoolSize: 10,
			maxIdleTimeMS: 30000,
			serverSelectionTimeoutMS: 5000,
			socketTimeoutMS: 45000,
		});
	});
});

