import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Resend before importing email module
const mockSend = vi.fn();

vi.mock('resend', () => {
	return {
		Resend: vi.fn().mockImplementation(() => ({
			emails: {
				get send() {
					return mockSend;
				},
			},
		})),
	};
});

// Import after mocking
import {
	sendPasswordResetEmail,
	sendWelcomeEmail,
	sendWorkoutReminderEmail,
} from '../email';

describe('email service', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockSend.mockResolvedValue({
			data: { id: 'test-email-id' },
			error: null,
		});
	});

	describe('sendPasswordResetEmail', () => {
		it('should send password reset email successfully', async () => {
			const result = await sendPasswordResetEmail(
				'test@example.com',
				'https://example.com/reset?token=abc123',
				'Test User'
			);

			expect(result).toEqual({ id: 'test-email-id' });
			expect(mockSend).toHaveBeenCalledTimes(1);
			expect(mockSend).toHaveBeenCalledWith(
				expect.objectContaining({
					from: expect.stringContaining('HybridFit'),
					to: 'test@example.com',
					subject: 'Password Reset Request - HybridFit',
					html: expect.stringContaining('Test User'),
				})
			);
		});

		it('should throw error when Resend API returns error', async () => {
			mockSend.mockResolvedValue({
				data: null,
				error: new Error('API Error'),
			});

			await expect(
				sendPasswordResetEmail(
					'test@example.com',
					'https://example.com/reset?token=abc123',
					'Test User'
				)
			).rejects.toThrow('Failed to send password reset email');

			expect(mockSend).toHaveBeenCalledTimes(1);
		});

		it('should throw error when Resend API call fails', async () => {
			mockSend.mockRejectedValue(new Error('Network error'));

			await expect(
				sendPasswordResetEmail(
					'test@example.com',
					'https://example.com/reset?token=abc123',
					'Test User'
				)
			).rejects.toThrow('Failed to send password reset email');

			expect(mockSend).toHaveBeenCalledTimes(1);
		});

		it('should include reset URL in email HTML', async () => {
			const resetUrl = 'https://example.com/reset?token=abc123';
			await sendPasswordResetEmail('test@example.com', resetUrl, 'Test User');

			const callArgs = mockSend.mock.calls[0][0];
			expect(callArgs.html).toContain(resetUrl);
		});
	});

	describe('sendWelcomeEmail', () => {
		it('should send welcome email successfully', async () => {
			const result = await sendWelcomeEmail('test@example.com', 'Test User');

			expect(result).toEqual({ id: 'test-email-id' });
			expect(mockSend).toHaveBeenCalledTimes(1);
			expect(mockSend).toHaveBeenCalledWith(
				expect.objectContaining({
					from: expect.stringContaining('HybridFit'),
					to: 'test@example.com',
					subject: 'Welcome to HybridFit!',
					html: expect.stringContaining('Test User'),
				})
			);
		});

		it('should throw error when Resend API returns error', async () => {
			mockSend.mockResolvedValue({
				data: null,
				error: new Error('API Error'),
			});

			await expect(sendWelcomeEmail('test@example.com', 'Test User')).rejects.toThrow(
				'Failed to send welcome email'
			);

			expect(mockSend).toHaveBeenCalledTimes(1);
		});

		it('should throw error when Resend API call fails', async () => {
			mockSend.mockRejectedValue(new Error('Network error'));

			await expect(sendWelcomeEmail('test@example.com', 'Test User')).rejects.toThrow(
				'Failed to send welcome email'
			);

			expect(mockSend).toHaveBeenCalledTimes(1);
		});

		it('should include dashboard link in email HTML', async () => {
			await sendWelcomeEmail('test@example.com', 'Test User');

			const callArgs = mockSend.mock.calls[0][0];
			expect(callArgs.html).toContain('/dashboard');
		});
	});

	describe('sendWorkoutReminderEmail', () => {
		it('should send workout reminder email successfully', async () => {
			const workoutDetails = 'Upper Body Strength Training';
			const result = await sendWorkoutReminderEmail(
				'test@example.com',
				'Test User',
				workoutDetails
			);

			expect(result).toEqual({ id: 'test-email-id' });
			expect(mockSend).toHaveBeenCalledTimes(1);
			expect(mockSend).toHaveBeenCalledWith(
				expect.objectContaining({
					from: expect.stringContaining('HybridFit'),
					to: 'test@example.com',
					subject: 'Workout Reminder - HybridFit',
					html: expect.stringContaining('Test User'),
				})
			);
		});

		it('should include workout details in email HTML', async () => {
			const workoutDetails = 'Upper Body Strength Training';
			await sendWorkoutReminderEmail('test@example.com', 'Test User', workoutDetails);

			const callArgs = mockSend.mock.calls[0][0];
			expect(callArgs.html).toContain(workoutDetails);
		});

		it('should throw error when Resend API returns error', async () => {
			mockSend.mockResolvedValue({
				data: null,
				error: new Error('API Error'),
			});

			await expect(
				sendWorkoutReminderEmail('test@example.com', 'Test User', 'Workout')
			).rejects.toThrow('Failed to send workout reminder email');

			expect(mockSend).toHaveBeenCalledTimes(1);
		});

		it('should throw error when Resend API call fails', async () => {
			mockSend.mockRejectedValue(new Error('Network error'));

			await expect(
				sendWorkoutReminderEmail('test@example.com', 'Test User', 'Workout')
			).rejects.toThrow('Failed to send workout reminder email');

			expect(mockSend).toHaveBeenCalledTimes(1);
		});
	});
});
