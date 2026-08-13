import { redirect, type Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { verifySessionToken } from '$lib/server/auth/session';

// Edge: this guard runs on every request, has no heavy deps, and is
// latency-sensitive - a good fit for Vercel's edge runtime rather than a
// cold-starting Node function. /dashboard/items itself still runs on Node
// (see its own +page.server.ts) since that's where the "backend-shaped"
// data operations belong.
export const config = { runtime: 'edge' };

const SESSION_COOKIE = 'session';

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get(SESSION_COOKIE);

	if (token && env.SESSION_SECRET) {
		const payload = await verifySessionToken(token, env.SESSION_SECRET);
		if (payload) {
			event.locals.user = { id: payload.userId, role: payload.role };
		}
	}

	if (event.url.pathname.startsWith('/dashboard') && !event.locals.user) {
		redirect(303, '/login');
	}

	return resolve(event);
};
