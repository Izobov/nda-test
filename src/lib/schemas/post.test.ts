import { describe, it, expect } from 'vitest';
import { PostSchema } from './post';

const validPost = {
	id: 'post_000',
	slug: 'sub-second-lcp-on-a-content-site',
	translations: {
		en: { title: 'Title', excerpt: 'Excerpt', body: 'Body' },
		de: { title: 'Titel', excerpt: 'Auszug', body: 'Text' }
	},
	tags: ['performance', 'engineering'],
	author: { id: 'u_omar', name: 'Omar Haddad', avatarColor: '#a855f7' },
	publishedAt: '2026-05-31T00:00:00Z',
	readingTimeMinutes: 3,
	coverColor: '#1e293b'
};

describe('PostSchema', () => {
	it('parses a valid post', () => {
		expect(() => PostSchema.parse(validPost)).not.toThrow();
	});

	it('rejects a post missing the de translation', () => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { de: _de, ...translations } = validPost.translations;
		expect(() => PostSchema.parse({ ...validPost, translations })).toThrow();
	});

	it('rejects a non-ISO publishedAt', () => {
		expect(() => PostSchema.parse({ ...validPost, publishedAt: '31/05/2026' })).toThrow();
	});

	it('rejects a non-positive readingTimeMinutes', () => {
		expect(() => PostSchema.parse({ ...validPost, readingTimeMinutes: 0 })).toThrow();
	});
});
