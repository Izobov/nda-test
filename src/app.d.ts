// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { UserRole } from '$lib/schemas';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user?: { id: string; role: UserRole };
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
