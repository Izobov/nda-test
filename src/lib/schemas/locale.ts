import { z } from 'zod';

export const LocaleSchema = z.enum(['en', 'de']);
export type Locale = z.infer<typeof LocaleSchema>;
