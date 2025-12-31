import { NextRequest } from 'next/server';
import { vi } from 'vitest';

interface MockUser {
	id: string;
	email: string;
	name?: string;
}

/**
 * Create a mock NextRequest for testing API routes
 */
export function createMockRequest(
	method: string = 'GET',
	body?: unknown,
	headers?: Record<string, string>
): NextRequest {
	const url = 'http://localhost:3000/api/test';

	return new NextRequest(url, {
		method,
		headers: {
			'Content-Type': 'application/json',
			...headers,
		},
		body: body ? JSON.stringify(body) : undefined,
	});
}

/**
 * Mock getServerSession for testing authenticated routes
 */
export function mockSession(user: MockUser): void {
	vi.mock('next-auth', () => ({
		getServerSession: vi.fn(() =>
			Promise.resolve({
				user: {
					id: user.id,
					email: user.email,
					name: user.name,
				},
				expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
			})
		),
	}));
}

/**
 * Mock unauthenticated session
 */
export function mockUnauthenticatedSession(): void {
	vi.mock('next-auth', () => ({
		getServerSession: vi.fn(() => Promise.resolve(null)),
	}));
}
