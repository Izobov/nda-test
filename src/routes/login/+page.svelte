<script lang="ts">
	import { Button, Input } from '$lib';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<div class="mx-auto flex max-w-sm flex-col gap-6 p-8">
	<h1 class="text-2xl font-bold text-fg">Sign in</h1>
	{#if form?.error}
		<p role="alert" class="text-sm text-danger-text">{form.error}</p>
	{/if}
	<form method="POST" class="flex flex-col gap-4">
		<Input label="Email" name="email" type="email" autocomplete="email" required />
		<Input
			label="Password"
			name="password"
			type="password"
			autocomplete="current-password"
			required
		/>
		<Button type="submit" variant="primary" full>Sign in</Button>
	</form>
</div>
