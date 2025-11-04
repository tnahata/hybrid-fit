/**
 * Returns a new Date object set to the start of the day (00:00:00.000) based on UTC
 */
export function getStartOfDay(date: Date = new Date()): Date {

	const d = new Date(date);
	const utcDate = Date.UTC(
		d.getUTCFullYear(),
		d.getUTCMonth(),
		d.getUTCDate(),
		0, 0, 0, 0
	);
	return new Date(utcDate);
}

/**
 * Calculates the number of days between two dates
 * @param startDate - The start date
 * @param endDate - The end date (defaults to today)
 * @returns Number of days (can be negative if endDate is before startDate)
 */
export function getDaysSince(startDate: Date, endDate: Date = new Date()): number {
	const start = getStartOfDay(startDate);
	const end = getStartOfDay(endDate);
	return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Checks if two dates are on the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
	const d1 = getStartOfDay(date1);
	const d2 = getStartOfDay(date2);
	return d1.getTime() === d2.getTime();
}

export function returnUTCDateInUSLocaleFormat(date: Date = new Date()): string {
	const d = new Date(date);
	return d.toLocaleDateString('en-US', {
		timeZone: 'UTC',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
};

/**
 * Adds a specified number of days to a date
 * @param date - The starting date
 * @param days - Number of days to add (can be negative)
 * @returns New Date object with days added
 */
export function addDays(date: Date, days: number): Date {
	const result = new Date(date);
	result.setUTCDate(result.getUTCDate() + days);
	return getStartOfDay(result);
}