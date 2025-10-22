// lib/api-client.ts
// Helper functions for making API calls with proper error handling

export class ApiError extends Error {
    constructor(public status: number, public message: string) {
        super(message);
        this.name = 'ApiError';
    }
}

/**
 * Update workout overrides for a training plan
 */
export async function updatePlanOverrides(
    planId: string,
    overrides: any[]
): Promise<{ planId: string; overrides: any[] }> {
    const response = await fetch(`/api/users/me/plans/${planId}/overrides`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ overrides }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new ApiError(
            response.status,
            error.error || 'Failed to update overrides'
        );
    }

    const result = await response.json();
    return result.data;
}

/**
 * Log a workout (completed or skipped)
 */
export async function logWorkout(
    planId: string,
    workoutData: any
): Promise<{
    planId: string;
    workoutLog: any;
    userStats: {
        totalWorkoutsCompleted: number;
        currentStreak: number;
        longestStreak: number;
    };
}> {
    const response = await fetch(`/api/users/me/plans/${planId}/logs`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(workoutData),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new ApiError(
            response.status,
            error.error || 'Failed to log workout'
        );
    }

    const result = await response.json();
    return result.data;
}

/**
 * Fetch user profile with training plans
 */
export async function getUserProfile(): Promise<any> {
    const response = await fetch('/api/users/me', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new ApiError(
            response.status,
            error.error || 'Failed to fetch user profile'
        );
    }

    const result = await response.json();
    return result.data;
}