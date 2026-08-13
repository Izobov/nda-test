<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	import type { Size } from './types';

	type Variant = 'primary' | 'outline';

	interface Props extends HTMLButtonAttributes {
		variant?: Variant;
		size?: Size;
		full?: boolean;
		disabled?: boolean;
		class?: string;
		children: Snippet;
	}

	let {
		variant = 'primary',
		size = 'md',
		full = false,
		disabled = false,
		class: className = '',
		children,
		...rest
	}: Props = $props();

	const variantClasses: Record<Variant, string> = {
		primary: 'bg-primary text-primary-fg hover:opacity-90',
		outline: 'border border-border bg-transparent text-fg hover:bg-surface'
	};

	const sizeClasses: Record<Size, string> = {
		xs: 'h-7 px-2.5 text-xs gap-1',
		sm: 'h-8 px-3 text-sm gap-1.5',
		md: 'h-10 px-4 text-sm gap-2',
		lg: 'h-12 px-6 text-base gap-2'
	};
</script>

<button
	type="button"
	{disabled}
	class="inline-flex cursor-pointer items-center justify-center rounded-md font-medium transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 {variantClasses[
		variant
	]} {sizeClasses[size]} {full ? 'w-full' : ''} {className}"
	{...rest}
>
	{@render children()}
</button>
