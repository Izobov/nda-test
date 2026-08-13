import { z } from 'zod';

export const ItemStatusSchema = z.enum([
	'draft',
	'scheduled',
	'active',
	'paused',
	'completed',
	'archived'
]);
export type ItemStatus = z.infer<typeof ItemStatusSchema>;

export const ItemChannelSchema = z.enum(['email', 'sms', 'web', 'social', 'push']);
export type ItemChannel = z.infer<typeof ItemChannelSchema>;

export const ItemOwnerSchema = z.object({
	id: z.string(),
	name: z.string()
});
export type ItemOwner = z.infer<typeof ItemOwnerSchema>;

export const ItemSchema = z.object({
	id: z.string(),
	name: z.string(),
	status: ItemStatusSchema,
	channel: ItemChannelSchema,
	owner: ItemOwnerSchema,
	budget: z.number().nonnegative(),
	spent: z.number().nonnegative(),
	impressions: z.number().int().nonnegative(),
	clicks: z.number().int().nonnegative(),
	ctr: z.number().min(0).max(1),
	startDate: z.iso.date(),
	endDate: z.iso.date(),
	updatedAt: z.iso.datetime(),
	tags: z.array(z.string())
});
export type Item = z.infer<typeof ItemSchema>;
