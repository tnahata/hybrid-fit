import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';

// Mock Next.js router
vi.mock('next/navigation', () => ({
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
		prefetch: vi.fn(),
		back: vi.fn(),
	}),
	usePathname: () => '/',
	useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js image component
vi.mock('next/image', () => ({
	default: (props: Record<string, unknown>) => {
		// Return a simple img element mock
		const img = document.createElement('img');
		Object.keys(props).forEach((key) => {
			if (key !== 'src' && key !== 'alt') return;
			img.setAttribute(key, String(props[key]));
		});
		return img;
	},
}));

// Mock environment variables
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/hybrid-fit-test';
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.RESEND_API_KEY = 'test-resend-key';
process.env.SENDER_EMAIL = 'test@example.com';
