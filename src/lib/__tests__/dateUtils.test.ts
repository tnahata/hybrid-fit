import { describe, it, expect } from 'vitest';
import {
	getStartOfDay,
	getDaysSince,
	isSameDay,
	addDays,
	returnUTCDateInUSLocaleFormat,
} from '../dateUtils';

describe('dateUtils', () => {
	describe('getStartOfDay', () => {
		it('should return start of day for current date when no argument provided', () => {
			const result = getStartOfDay();
			const expected = new Date();
			expected.setUTCHours(0, 0, 0, 0);

			expect(result.getUTCHours()).toBe(0);
			expect(result.getUTCMinutes()).toBe(0);
			expect(result.getUTCSeconds()).toBe(0);
			expect(result.getUTCMilliseconds()).toBe(0);
		});

		it('should return start of day for a given date', () => {
			const input = new Date('2024-01-15T14:30:45.123Z');
			const result = getStartOfDay(input);

			expect(result.getUTCFullYear()).toBe(2024);
			expect(result.getUTCMonth()).toBe(0); // January is 0
			expect(result.getUTCDate()).toBe(15);
			expect(result.getUTCHours()).toBe(0);
			expect(result.getUTCMinutes()).toBe(0);
			expect(result.getUTCSeconds()).toBe(0);
			expect(result.getUTCMilliseconds()).toBe(0);
		});

		it('should handle dates at different times of day', () => {
			const morning = new Date('2024-01-15T08:30:00Z');
			const afternoon = new Date('2024-01-15T16:45:30Z');
			const midnight = new Date('2024-01-15T00:00:00Z');

			const morningStart = getStartOfDay(morning);
			const afternoonStart = getStartOfDay(afternoon);
			const midnightStart = getStartOfDay(midnight);

			expect(morningStart.getTime()).toBe(afternoonStart.getTime());
			expect(afternoonStart.getTime()).toBe(midnightStart.getTime());
		});
	});

	describe('getDaysSince', () => {
		it('should return 0 for the same day', () => {
			const date = new Date('2024-01-15T12:00:00Z');
			const result = getDaysSince(date, date);

			expect(result).toBe(0);
		});

		it('should return positive number for past dates', () => {
			const startDate = new Date('2024-01-10T00:00:00Z');
			const endDate = new Date('2024-01-15T00:00:00Z');
			const result = getDaysSince(startDate, endDate);

			expect(result).toBe(5);
		});

		it('should return negative number for future dates', () => {
			const startDate = new Date('2024-01-15T00:00:00Z');
			const endDate = new Date('2024-01-10T00:00:00Z');
			const result = getDaysSince(startDate, endDate);

			expect(result).toBe(-5);
		});

		it('should use current date as default end date', () => {
			const pastDate = new Date();
			pastDate.setUTCDate(pastDate.getUTCDate() - 3);
			const result = getDaysSince(pastDate);

			expect(result).toBe(3);
		});
	});

	describe('isSameDay', () => {
		it('should return true for dates on the same day', () => {
			const date1 = new Date('2024-01-15T08:00:00Z');
			const date2 = new Date('2024-01-15T20:00:00Z');

			expect(isSameDay(date1, date2)).toBe(true);
		});

		it('should return false for dates on different days', () => {
			const date1 = new Date('2024-01-15T23:59:59Z');
			const date2 = new Date('2024-01-16T00:00:00Z');

			expect(isSameDay(date1, date2)).toBe(false);
		});

		it('should return true for the same date object', () => {
			const date = new Date('2024-01-15T12:00:00Z');

			expect(isSameDay(date, date)).toBe(true);
		});
	});

	describe('addDays', () => {
		it('should add positive number of days', () => {
			const startDate = new Date('2024-01-15T12:00:00Z');
			const result = addDays(startDate, 5);

			expect(result.getUTCDate()).toBe(20);
			expect(result.getUTCMonth()).toBe(0);
		});

		it('should subtract days when negative number provided', () => {
			const startDate = new Date('2024-01-15T12:00:00Z');
			const result = addDays(startDate, -5);

			expect(result.getUTCDate()).toBe(10);
			expect(result.getUTCMonth()).toBe(0);
		});

		it('should handle month boundaries', () => {
			const startDate = new Date('2024-01-30T12:00:00Z');
			const result = addDays(startDate, 5);

			expect(result.getUTCDate()).toBe(4);
			expect(result.getUTCMonth()).toBe(1); // February
		});

		it('should return start of day regardless of input time', () => {
			const startDate = new Date('2024-01-15T14:30:45Z');
			const result = addDays(startDate, 1);

			expect(result.getUTCHours()).toBe(0);
			expect(result.getUTCMinutes()).toBe(0);
			expect(result.getUTCSeconds()).toBe(0);
		});
	});

	describe('returnUTCDateInUSLocaleFormat', () => {
		it('should format date in US locale format', () => {
			const date = new Date('2024-01-15T12:00:00Z');
			const result = returnUTCDateInUSLocaleFormat(date);

			expect(result).toContain('January');
			expect(result).toContain('15');
			expect(result).toContain('2024');
		});

		it('should use current date when no argument provided', () => {
			const result = returnUTCDateInUSLocaleFormat();
			const today = new Date();

			expect(result).toBeTruthy();
			expect(typeof result).toBe('string');
			expect(result.length).toBeGreaterThan(0);
		});
	});
});

