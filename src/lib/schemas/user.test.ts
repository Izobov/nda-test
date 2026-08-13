import { describe, it, expect } from 'vitest';
import { UserSchema, PublicUserSchema } from './user';

const validUser = {
	id: 'demo_admin',
	email: 'admin@demo.test',
	password: 'demo1234',
	name: 'Demo Admin',
	role: 'admin'
};

describe('UserSchema', () => {
	it('parses a valid user', () => {
		expect(() => UserSchema.parse(validUser)).not.toThrow();
	});

	it('rejects an invalid email', () => {
		expect(() => UserSchema.parse({ ...validUser, email: 'not-an-email' })).toThrow();
	});

	it('rejects an unknown role', () => {
		expect(() => UserSchema.parse({ ...validUser, role: 'superadmin' })).toThrow();
	});
});

describe('PublicUserSchema', () => {
	it('strips the password field from a full user object', () => {
		const parsed = PublicUserSchema.parse(validUser);
		expect(parsed).not.toHaveProperty('password');
		expect(parsed.email).toBe('admin@demo.test');
	});
});
