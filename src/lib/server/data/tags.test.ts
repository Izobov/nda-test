import { describe, it, expect } from 'vitest';
import { listTags } from './tags';

describe('listTags', () => {
	it('returns all 8 tags localized to en', () => {
		const result = listTags('en');
		expect(result).toHaveLength(8);
		expect(result.find((tag) => tag.slug === 'engineering')?.label).toBe('Engineering');
	});

	it('localizes labels to de', () => {
		const result = listTags('de');
		expect(result.find((tag) => tag.slug === 'engineering')?.label).toBe('Entwicklung');
	});
});
