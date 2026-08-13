import { describe, it, expect } from 'vitest';
import { LoginSchema } from './login';

describe('LoginSchema', () => {
	it('parses valid credentials', () => {
		expect(() =>
			LoginSchema.parse({ email: 'admin@demo.test', password: 'demo1234' })
		).not.toThrow();
	});

	it('rejects an invalid email', () => {
		expect(() => LoginSchema.parse({ email: 'not-an-email', password: 'demo1234' })).toThrow();
	});

	it('rejects an empty password', () => {
		expect(() => LoginSchema.parse({ email: 'admin@demo.test', password: '' })).toThrow();
	});
});
