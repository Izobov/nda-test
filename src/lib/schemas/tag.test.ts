import { describe, it, expect } from 'vitest';
import { TagSchema } from './tag';

const validTag = { slug: 'engineering', label: { en: 'Engineering', de: 'Entwicklung' } };

describe('TagSchema', () => {
	it('parses a valid tag', () => {
		expect(() => TagSchema.parse(validTag)).not.toThrow();
	});

	it('rejects a tag missing the de label', () => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { de: _de, ...label } = validTag.label;
		expect(() => TagSchema.parse({ ...validTag, label })).toThrow();
	});
});
