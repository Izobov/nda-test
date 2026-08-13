import { describe, it, expect } from 'vitest';
import { DictionarySchema } from './dictionary';

describe('DictionarySchema', () => {
	it('parses a flat string-to-string record', () => {
		expect(() => DictionarySchema.parse({ 'nav.home': 'Home' })).not.toThrow();
	});

	it('rejects a non-string value', () => {
		expect(() => DictionarySchema.parse({ 'nav.home': 42 })).toThrow();
	});
});
