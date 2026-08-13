import { describe, it, expect } from 'vitest';
import { getDictionary, translate } from './i18n';

describe('getDictionary', () => {
	it('returns the en dictionary with expected keys', () => {
		const dict = getDictionary('en');
		expect(dict['nav.home']).toBe('Home');
	});

	it('returns a de dictionary that differs from en', () => {
		const en = getDictionary('en');
		const de = getDictionary('de');
		expect(de['nav.home']).toBeDefined();
		expect(de['nav.home']).not.toBe(en['nav.home']);
	});
});

describe('translate', () => {
	it('returns the template unchanged when there are no params', () => {
		const dict = getDictionary('en');
		expect(translate(dict, 'blog.title')).toBe('Writing');
	});

	it('interpolates a single placeholder', () => {
		const dict = getDictionary('en');
		expect(translate(dict, 'blog.readingTime', { minutes: 3 })).toBe('3 min read');
	});

	it('interpolates multiple placeholders', () => {
		const dict = getDictionary('en');
		expect(translate(dict, 'search.results', { count: 5, query: 'svelte' })).toBe(
			'5 results for "svelte"'
		);
	});

	it('falls back to the key itself when the key is missing', () => {
		const dict = getDictionary('en');
		expect(translate(dict, 'does.not.exist')).toBe('does.not.exist');
	});

	it('leaves an unmatched placeholder literal when no param is supplied for it', () => {
		const dict = getDictionary('en');
		expect(translate(dict, 'blog.readingTime', {})).toBe('{minutes} min read');
	});
});
