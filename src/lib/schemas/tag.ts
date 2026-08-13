import { z } from 'zod';
import { LocaleSchema } from './locale';

export const TagSchema = z.object({
	slug: z.string(),
	label: z.record(LocaleSchema, z.string())
});
export type Tag = z.infer<typeof TagSchema>;
