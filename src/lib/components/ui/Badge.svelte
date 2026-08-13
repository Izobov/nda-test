<script lang="ts">
	import type { Snippet } from 'svelte';

	type Variant = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

	interface Props {
		variant?: Variant;
		class?: string;
		children: Snippet;
	}

	let { variant = 'neutral', class: className = '', children }: Props = $props();

	const variantClasses: Record<Variant, string> = {
		primary: 'bg-primary text-primary-fg',
		success: 'bg-success text-success-fg',
		warning: 'bg-warning text-warning-fg',
		danger: 'bg-danger text-danger-fg',
		neutral: 'bg-neutral text-neutral-fg'
	};
</script>

<span
	class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {variantClasses[
		variant
	]} {className}"
>
	{@render children()}
</span>
