import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { getUserProfile, logWorkout, updateWorkout, updatePlanOverrides, ApiError } from '@/lib/api-client';
import { EnrichedUserDoc, EnrichedUserPlanProgress } from '../../types/enrichedTypes';
import { WorkoutLog, WorkoutOverride } from '@/models/User';
import { toast } from 'sonner';

/**
 * User Store State Interface
 *
 * Manages the authenticated user's profile, training plans, and related operations
 */
interface UserState {
	// ========================================
	// STATE (Data Storage)
	// ========================================

	/** Full user profile with enriched training plan data */
	currentUser: EnrichedUserDoc | null;

	/** ID of the currently selected training plan */
	selectedPlanId: string;

	/** Loading state for async operations */
	loading: boolean;

	/** Error message from failed operations */
	error: string | null;

	/** Timestamp of last successful fetch (for caching) */
	lastFetched: number | null;

	// ========================================
	// ACTIONS (State Modifiers)
	// ========================================

	/**
	 * Fetch user profile from API
	 * Implements 5-minute cache to reduce unnecessary API calls
	 */
	fetchUser: () => Promise<void>;

	/**
	 * Set the currently selected training plan
	 * @param planId - The ID of the plan to select
	 */
	setSelectedPlan: (planId: string) => void;

	/**
	 * Log a new workout for the selected plan
	 * @param planId - The training plan ID
	 * @param data - Workout log data
	 */
	logWorkout: (planId: string, data: WorkoutLog) => Promise<void>;

	/**
	 * Update an existing workout log
	 * @param logId - The workout log ID
	 * @param planId - The training plan ID
	 * @param data - Updated workout log data
	 */
	updateWorkout: (logId: string, planId: string, data: WorkoutLog) => Promise<void>;

	/**
	 * Update workout overrides (schedule modifications)
	 * @param planId - The training plan ID
	 * @param overrides - Array of workout overrides
	 */
	updateOverrides: (planId: string, overrides: WorkoutOverride[]) => Promise<void>;

	/**
	 * Clear all user data (e.g., on logout)
	 */
	clearUser: () => void;

	/**
	 * Force refresh user data (bypass cache)
	 */
	refreshUser: () => Promise<void>;

	// ========================================
	// COMPUTED SELECTORS
	// ========================================

	/**
	 * Get the currently selected training plan
	 * @returns The selected plan or undefined
	 */
	getCurrentPlan: () => EnrichedUserPlanProgress | undefined;
}

/**
 * Cache duration: 5 minutes
 * User data is relatively static and doesn't need constant refetching
 */
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * User Store
 *
 * Global state management for authenticated user data
 *
 * Features:
 * - Automatic caching (5-minute TTL)
 * - localStorage persistence
 * - Redux DevTools integration
 * - Optimistic updates for better UX
 *
 * Usage:
 * ```tsx
 * const { currentUser, loading, fetchUser } = useUserStore();
 *
 * // Selective subscription (better performance)
 * const currentUser = useUserStore((state) => state.currentUser);
 * ```
 */
export const useUserStore = create<UserState>()(
	devtools(
		persist(
			(set, get) => ({
				// ================================
				// INITIAL STATE
				// ================================
				currentUser: null,
				selectedPlanId: "",
				loading: false,
				error: null,
				lastFetched: null,

				// ================================
				// ACTIONS
				// ================================

				fetchUser: async () => {
					const now = Date.now();
					const { lastFetched } = get();

					// Cache check: Don't refetch if data is fresh
					if (lastFetched && now - lastFetched < CACHE_DURATION) {
						console.log('[UserStore] Using cached data');
						return;
					}

					console.log('[UserStore] Fetching user data from API');
					set({ loading: true, error: null });

					try {
						const userData = await getUserProfile();

						// Auto-select active plan or first plan
						const activePlan: EnrichedUserPlanProgress | undefined = userData.trainingPlans?.find(
							(p: EnrichedUserPlanProgress) => p.isActive
						);
						const planIdToSelect = activePlan?._id || userData.trainingPlans?.[0]?._id || "";

						set({
							currentUser: userData,
							selectedPlanId: planIdToSelect,
							loading: false,
							lastFetched: now,
							error: null
						});
					} catch (err) {
						const errorMessage = err instanceof ApiError
							? err.message
							: 'Failed to fetch user data';

						console.error('[UserStore] Error fetching user data:', err);

						set({
							error: errorMessage,
							loading: false
						});
					}
				},

				setSelectedPlan: (planId: string) => {
					console.log('[UserStore] Setting selected plan:', planId);
					set({ selectedPlanId: planId });
				},

				logWorkout: async (planId: string, data: WorkoutLog) => {
					console.log('[UserStore] Logging workout for plan:', planId);

					try {
						const result = await logWorkout(planId, data);

						// Refresh user data to get updated stats and progress
						await get().refreshUser();

						toast.success('Workout Logged!', {
							description: `Great job! Current streak: ${result.userStats.currentStreak} days 🔥`
						});
					} catch (err) {
						const errorMessage = err instanceof ApiError
							? err.message
							: 'Failed to log workout';

						console.error('[UserStore] Error logging workout:', err);

						set({ error: errorMessage });

						toast.error('Failed to log workout!', {
							description: errorMessage,
						});

						throw err;
					}
				},

				updateWorkout: async (logId: string, planId: string, data: WorkoutLog) => {
					console.log('[UserStore] Updating workout:', logId);

					try {
						const result = await updateWorkout(logId, planId, data);

						// Refresh user data to get updated stats
						await get().refreshUser();

						toast.success('Workout log updated!', {
							description: `Great job! Current streak: ${result.userStats.currentStreak} days 🔥`
						});
					} catch (err) {
						const errorMessage = err instanceof ApiError
							? err.message
							: 'Failed to update workout';

						console.error('[UserStore] Error updating workout:', err);

						set({ error: errorMessage });

						toast.error('Failed to update workout log!', {
							description: errorMessage,
						});

						throw err;
					}
				},

				updateOverrides: async (planId: string, overrides: WorkoutOverride[]) => {
					console.log('[UserStore] Updating overrides for plan:', planId);

					try {
						await updatePlanOverrides(planId, overrides);

						// Refresh user data to get updated schedule
						await get().refreshUser();

						toast.success('Schedule updated successfully!');
					} catch (err) {
						const errorMessage = err instanceof ApiError
							? err.message
							: 'Failed to update schedule';

						console.error('[UserStore] Error updating overrides:', err);

						set({ error: errorMessage });

						toast.error('Update Failed', {
							description: errorMessage,
						});

						throw err;
					}
				},

				clearUser: () => {
					console.log('[UserStore] Clearing user data');
					set({
						currentUser: null,
						selectedPlanId: "",
						lastFetched: null,
						error: null,
						loading: false
					});
				},

				refreshUser: async () => {
					console.log('[UserStore] Force refreshing user data');

					// Clear cache and refetch
					set({ lastFetched: null });
					await get().fetchUser();
				},

				// ================================
				// COMPUTED SELECTORS
				// ================================

				getCurrentPlan: () => {
					const { currentUser, selectedPlanId } = get();

					if (!currentUser?.trainingPlans?.length || !selectedPlanId) {
						return undefined;
					}

					return currentUser.trainingPlans.find(
						(p: EnrichedUserPlanProgress) => p._id === selectedPlanId
					);
				}
			}),
			{
				name: 'user-store', // localStorage key
				// Only persist essential data (not loading/error states)
				partialize: (state) => ({
					currentUser: state.currentUser,
					selectedPlanId: state.selectedPlanId,
					lastFetched: state.lastFetched
				})
			}
		),
		{ name: 'UserStore' } // DevTools name
	)
);
