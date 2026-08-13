import { describe, it, expect } from 'vitest';
import { createSessionToken, verifySessionToken } from './session';

const SECRET = 'test-secret-do-not-use-in-prod';
const future = Math.floor(Date.now() / 1000) + 3600;
const past = Math.floor(Date.now() / 1000) - 3600;

describe('createSessionToken / verifySessionToken', () => {
	it('round-trips a valid payload', async () => {
		const token = await createSessionToken(
			{ userId: 'demo_admin', role: 'admin', exp: future },
			SECRET
		);
		const payload = await verifySessionToken(token, SECRET);
		expect(payload).toEqual({ userId: 'demo_admin', role: 'admin', exp: future });
	});

	it('rejects a token signed with a different secret', async () => {
		const token = await createSessionToken(
			{ userId: 'demo_admin', role: 'admin', exp: future },
			SECRET
		);
		const payload = await verifySessionToken(token, 'a-completely-different-secret');
		expect(payload).toBeNull();
	});

	it('rejects a tampered payload even if the signature string still looks valid', async () => {
		const token = await createSessionToken(
			{ userId: 'demo_viewer', role: 'viewer', exp: future },
			SECRET
		);
		const [body, signature] = token.split('.');
		const tamperedBody = body.slice(0, -1) + (body.endsWith('A') ? 'B' : 'A');
		const payload = await verifySessionToken(`${tamperedBody}.${signature}`, SECRET);
		expect(payload).toBeNull();
	});

	it('rejects an expired token', async () => {
		const token = await createSessionToken(
			{ userId: 'demo_admin', role: 'admin', exp: past },
			SECRET
		);
		const payload = await verifySessionToken(token, SECRET);
		expect(payload).toBeNull();
	});

	it('rejects a malformed token', async () => {
		expect(await verifySessionToken('not-a-real-token', SECRET)).toBeNull();
		expect(await verifySessionToken('', SECRET)).toBeNull();
	});

	it('produces a token as two dot-separated base64url segments', async () => {
		const token = await createSessionToken(
			{ userId: 'demo_editor', role: 'editor', exp: future },
			SECRET
		);
		const parts = token.split('.');
		expect(parts).toHaveLength(2);
		for (const part of parts) {
			expect(part).toMatch(/^[A-Za-z0-9_-]+$/);
		}
	});
});
