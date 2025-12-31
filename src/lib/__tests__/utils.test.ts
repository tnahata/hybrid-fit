import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('utils', () => {
	describe('cn', () => {
		it('should merge class names correctly', () => {
			const result = cn('foo', 'bar');
			expect(result).toBe('foo bar');
		});

		it('should handle conditional classes', () => {
			const result = cn('foo', false && 'bar', 'baz');
			expect(result).toBe('foo baz');
		});

		it('should handle undefined and null values', () => {
			const result = cn('foo', undefined, null, 'bar');
			expect(result).toBe('foo bar');
		});

		it('should merge Tailwind classes and resolve conflicts', () => {
			const result = cn('px-2 py-1', 'px-4');
			// twMerge should resolve the conflict, keeping px-4
			expect(result).toContain('px-4');
			expect(result).toContain('py-1');
			expect(result).not.toContain('px-2');
		});

		it('should handle empty strings', () => {
			const result = cn('foo', '', 'bar');
			expect(result).toBe('foo bar');
		});

		it('should handle arrays of classes', () => {
			const result = cn(['foo', 'bar'], 'baz');
			expect(result).toBe('foo bar baz');
		});

		it('should handle objects with boolean values', () => {
			const result = cn({
				foo: true,
				bar: false,
				baz: true,
			});
			expect(result).toBe('foo baz');
		});

		it('should handle mixed inputs', () => {
			const result = cn(
				'foo',
				['bar', 'baz'],
				{
					qux: true,
					quux: false,
				},
				'corge'
			);
			expect(result).toContain('foo');
			expect(result).toContain('bar');
			expect(result).toContain('baz');
			expect(result).toContain('qux');
			expect(result).toContain('corge');
			expect(result).not.toContain('quux');
		});

		it('should handle no arguments', () => {
			const result = cn();
			expect(result).toBe('');
		});

		it('should merge conflicting Tailwind utilities correctly', () => {
			const result = cn('bg-red-500', 'bg-blue-500');
			// twMerge should keep the last conflicting class
			expect(result).toBe('bg-blue-500');
		});

		it('should handle responsive and variant classes', () => {
			const result = cn('text-sm', 'md:text-base', 'lg:text-lg');
			expect(result).toContain('text-sm');
			expect(result).toContain('md:text-base');
			expect(result).toContain('lg:text-lg');
		});
	});
});

