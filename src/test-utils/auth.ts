import { vi } from 'vitest';

interface MockSessionUser {
	id: string;
	email: string;
	name?: string;
}

interface MockSession {
	user: MockSessionUser;
	expires: string;
}

/**
 * Create a mock authenticated session for testing
 */
export function createMockSession(user?: Partial<MockSessionUser>): MockSession {
	return {
		user: {
			id: user?.id || 'test-user-id',
			email: user?.email || 'test@example.com',
			name: user?.name || 'Test User',
		},
		expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
	};
}

/**
 * Mock getServerSession to return an authenticated session
 */
export function mockAuthenticatedSession(user?: Partial<MockSessionUser>): void {
	const mockSession = createMockSession(user);

	vi.mock('next-auth', () => ({
		getServerSession: vi.fn(() => Promise.resolve(mockSession)),
	}));
}

/**
 * Mock getServerSession to return null (unauthenticated)
 */
export function mockUnauthenticatedSession(): void {
	vi.mock('next-auth', () => ({
		getServerSession: vi.fn(() => Promise.resolve(null)),
	}));
}

/**
 * Reset auth mocks
 */
export function resetAuthMocks(): void {
	vi.resetModules();
}

