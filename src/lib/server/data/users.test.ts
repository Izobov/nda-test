import { describe, it, expect } from 'vitest';
import { findUserByEmail, toPublicUser } from './users';

describe('findUserByEmail', () => {
	it('finds the admin user by exact email', () => {
		const user = findUserByEmail('admin@demo.test');
		expect(user?.role).toBe('admin');
	});

	it('is case-insensitive', () => {
		const user = findUserByEmail('ADMIN@DEMO.TEST');
		expect(user?.id).toBe('demo_admin');
	});

	it('returns undefined for an unknown email', () => {
		expect(findUserByEmail('nobody@demo.test')).toBeUndefined();
	});
});

describe('toPublicUser', () => {
	it('strips the password field from a real user record', () => {
		const user = findUserByEmail('admin@demo.test');
		if (!user) throw new Error('expected admin@demo.test to exist in the mock data');

		const publicUser = toPublicUser(user);
		expect(publicUser).not.toHaveProperty('password');
		expect(publicUser.email).toBe('admin@demo.test');
	});
});
