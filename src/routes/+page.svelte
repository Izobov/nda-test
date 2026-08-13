<!-- SSG (see +page.ts): no per-request data, so it's prerendered at build time. -->
<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<div class="mx-auto flex max-w-2xl flex-col items-center gap-6 p-16 text-center">
	<h1 class="text-4xl font-bold text-fg">Build a faster web, without the fight.</h1>
	<p class="text-lg text-muted-fg">A performance-first stack for teams that ship.</p>
	<a
		href={resolve('/login')}
		class="inline-flex h-12 cursor-pointer items-center justify-center rounded-md bg-primary px-6 text-base font-medium text-primary-fg transition-colors hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
	>
		Sign in to the dashboard
	</a>
</div>
