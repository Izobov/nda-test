import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { LoginSchema } from '$lib/schemas';
import { findUserByEmail } from '$lib/server/data';
import { createSessionToken } from '$lib/server/auth/session';
import { env } from '$env/dynamic/private';

const SESSION_COOKIE = 'session';
const SESSION_TTL_SECONDS = 60 * 60 * 2;

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		redirect(303, '/dashboard/items');
	}
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const parsed = LoginSchema.safeParse({
			email: formData.get('email'),
			password: formData.get('password')
		});

		if (!parsed.success) {
			return fail(400, { error: 'Invalid email or password.' });
		}

		if (!env.SESSION_SECRET) {
			return fail(500, { error: 'Server misconfigured: missing session secret.' });
		}

		const user = findUserByEmail(parsed.data.email);
		if (!user || user.password !== parsed.data.password) {
			return fail(401, { error: 'Invalid email or password.' });
		}

		const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
		const token = await createSessionToken(
			{ userId: user.id, role: user.role, exp },
			env.SESSION_SECRET
		);

		cookies.set(SESSION_COOKIE, token, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			maxAge: SESSION_TTL_SECONDS
		});

		redirect(303, '/dashboard/items');
	}
};
