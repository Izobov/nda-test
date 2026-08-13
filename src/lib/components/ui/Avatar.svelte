<script lang="ts">
	import { mdiAccount } from '@mdi/js';
	import Icon from './Icon.svelte';
	import type { Size } from './types';

	interface Props {
		url?: string;
		name?: string;
		size?: Size;
		class?: string;
	}

	let { url, name, size = 'md', class: className = '' }: Props = $props();

	// Track *which* url failed, not a plain boolean: Svelte reuses component
	// instances, so a stale `imageFailed = true` would permanently lock this
	// instance onto the fallback even after a later, valid `url` prop arrives
	// (e.g. a dashboard row re-rendering with a different user). Comparing
	// against the current `url` self-heals the moment the prop changes.
	let failedUrl = $state<string | undefined>(undefined);

	const sizeClasses: Record<Size, string> = {
		xs: 'size-6 text-[10px]',
		sm: 'size-8 text-xs',
		md: 'size-10 text-sm',
		lg: 'size-14 text-base'
	};

	const iconSizeBySize: Record<Size, 'xs' | 'sm' | 'md'> = {
		xs: 'xs',
		sm: 'xs',
		md: 'sm',
		lg: 'md'
	};

	function initials(value: string): string {
		const parts = value.trim().split(/\s+/).filter(Boolean);
		if (parts.length === 0) return '';
		if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
		return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
	}

	const showImage = $derived(Boolean(url) && failedUrl !== url);
	const computedInitials = $derived(name ? initials(name) : '');
</script>

<span
	class="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral font-medium text-neutral-fg {sizeClasses[
		size
	]} {className}"
>
	{#if showImage}
		<img
			src={url}
			alt={name ?? ''}
			class="size-full object-cover"
			onerror={() => (failedUrl = url)}
		/>
	{:else if computedInitials}
		{computedInitials}
	{:else}
		<Icon path={mdiAccount} size={iconSizeBySize[size]} title="User avatar" />
	{/if}
</span>
