import { z } from 'zod';

export const DictionarySchema = z.record(z.string(), z.string());
export type Dictionary = z.infer<typeof DictionarySchema>;
