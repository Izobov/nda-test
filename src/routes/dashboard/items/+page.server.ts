import type { PageServerLoad } from './$types';
import { listItems } from '$lib/server/data';

// Node runtime (this file has no `export const config` overriding it away
// from the adapter's default) — the deliberately "backend-shaped" route per
// CLAUDE.md's architecture decision, in contrast to src/hooks.server.ts's
// edge-configured guard.
export const load: PageServerLoad = async ({ url }) => {
	const requestedPage = Number(url.searchParams.get('page') ?? '1');
	const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
	const result = listItems({ page, pageSize: 20 });
	return { result };
};
