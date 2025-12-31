import { vi } from 'vitest';

interface MockResendResponse {
	data: { id: string } | null;
	error: Error | null;
}

/**
 * Mock Resend email service
 */
export const mockResend = {
	emails: {
		send: vi.fn<() => Promise<MockResendResponse>>().mockResolvedValue({
			data: { id: 'test-email-id' },
			error: null,
		}),
	},
};

/**
 * Mock MongoDB connection
 */
export const mockMongoConnection = {
	readyState: 1,
	db: {
		collection: vi.fn(),
	},
};
