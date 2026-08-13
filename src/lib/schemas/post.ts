import { z } from 'zod';
import { LocaleSchema } from './locale';

export const PostTranslationSchema = z.object({
	title: z.string(),
	excerpt: z.string(),
	body: z.string()
});
export type PostTranslation = z.infer<typeof PostTranslationSchema>;

export const PostAuthorSchema = z.object({
	id: z.string(),
	name: z.string(),
	avatarColor: z.string()
});
export type PostAuthor = z.infer<typeof PostAuthorSchema>;

export const PostSchema = z.object({
	id: z.string(),
	slug: z.string(),
	translations: z.record(LocaleSchema, PostTranslationSchema),
	tags: z.array(z.string()),
	author: PostAuthorSchema,
	publishedAt: z.iso.datetime(),
	readingTimeMinutes: z.number().int().positive(),
	coverColor: z.string()
});
export type Post = z.infer<typeof PostSchema>;
