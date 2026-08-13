import { z } from 'zod';

export const UserRoleSchema = z.enum(['admin', 'editor', 'viewer']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserSchema = z.object({
	id: z.string(),
	email: z.email(),
	password: z.string(),
	name: z.string(),
	role: UserRoleSchema
});
export type User = z.infer<typeof UserSchema>;

export const PublicUserSchema = UserSchema.omit({ password: true });
export type PublicUser = z.infer<typeof PublicUserSchema>;
