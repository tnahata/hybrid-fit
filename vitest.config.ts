import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
	plugins: [react()],
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./src/test-utils/setup.ts'],
		include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			include: ['src/**/*.{ts,tsx}'],
			exclude: [
				'node_modules/',
				'src/test-utils/',
				'**/*.d.ts',
				'**/*.config.*',
				'**/mockData',
				'**/__tests__/',
				'dist/',
				'.next/',
				'scrapers/',
			],
		},
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
});
