import type { UserRole } from '$lib/schemas';

export interface SessionPayload {
	userId: string;
	role: UserRole;
	exp: number;
}

function base64UrlEncode(bytes: Uint8Array): string {
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(value: string): Uint8Array {
	const padded = value
		.replace(/-/g, '+')
		.replace(/_/g, '/')
		.padEnd(value.length + ((4 - (value.length % 4)) % 4), '=');
	const binary = atob(padded);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
}

async function hmac(secret: string, data: string): Promise<string> {
	const key = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
	return base64UrlEncode(new Uint8Array(signature));
}

function timingSafeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let result = 0;
	for (let i = 0; i < a.length; i++) {
		result |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}
	return result === 0;
}

export async function createSessionToken(payload: SessionPayload, secret: string): Promise<string> {
	const body = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
	const signature = await hmac(secret, body);
	return `${body}.${signature}`;
}

export async function verifySessionToken(
	token: string,
	secret: string
): Promise<SessionPayload | null> {
	const parts = token.split('.');
	if (parts.length !== 2) return null;
	const [body, signature] = parts;
	if (!body || !signature) return null;

	const expectedSignature = await hmac(secret, body);
	if (!timingSafeEqual(expectedSignature, signature)) return null;

	let payload: SessionPayload;
	try {
		payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(body)));
	} catch {
		return null;
	}

	if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) {
		return null;
	}

	return payload;
}
