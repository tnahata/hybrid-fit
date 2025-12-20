import { UserDoc } from "@/models/User";
import { getStartOfDay, getDaysSince } from "./dateUtils";

export function recalculateStreak(user: UserDoc, planIndex: number): void {

	const completedWorkouts = user.trainingPlans[planIndex].progressLog
		.filter(log => log.status === "completed")
		.map(log => {
			return getStartOfDay(log.date);
		})
		.sort((a, b) => a.getTime() - b.getTime());

	if (completedWorkouts.length === 0) {
		user.currentStreak = 0;
		user.lastWorkoutDate = undefined;
		return;
	}

	user.lastWorkoutDate = completedWorkouts[completedWorkouts.length - 1];

	const today = getStartOfDay();

	let currentStreak = 0;
	let longestStreak = 0;
	let tempStreak = 1;

	// Calculate longest streak
	for (let i = 1; i < completedWorkouts.length; i++) {
		const daysDiff = getDaysSince(completedWorkouts[i - 1], completedWorkouts[i]);

		if (daysDiff === 1) {
			tempStreak++;
		} else {
			longestStreak = Math.max(longestStreak, tempStreak);
			tempStreak = 1;
		}
	}
	longestStreak = Math.max(longestStreak, tempStreak);

	// Calculate current streak (backwards from today)
	const lastWorkout = completedWorkouts[completedWorkouts.length - 1];
	const daysSinceLastWorkout = getDaysSince(lastWorkout, today);

	if (daysSinceLastWorkout <= 1) {
		currentStreak = 1;
		for (let i = completedWorkouts.length - 2; i >= 0; i--) {
			const daysDiff = getDaysSince(completedWorkouts[i], completedWorkouts[i + 1]);

			if (daysDiff === 1) {
				currentStreak++;
			} else {
				break;
			}
		}
	} else {
		currentStreak = 0;
	}

	user.currentStreak = currentStreak;
	user.longestStreak = longestStreak;
}