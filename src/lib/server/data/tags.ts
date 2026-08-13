import { z } from 'zod';
import tagsData from '../../../../task/mocks/tags.json';
import { TagSchema, type Tag, type Locale } from '$lib/schemas';

const tags: Tag[] = z.array(TagSchema).parse(tagsData);

export interface LocalizedTag {
	slug: string;
	label: string;
}

export function listTags(locale: Locale): LocalizedTag[] {
	return tags.map((tag) => ({ slug: tag.slug, label: tag.label[locale] }));
}
