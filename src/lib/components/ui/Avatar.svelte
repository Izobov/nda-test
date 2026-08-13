<script lang="ts">
	import { mdiAccount } from '@mdi/js';
	import Icon from './Icon.svelte';

	type Size = 'xs' | 'sm' | 'md' | 'lg';

	interface Props {
		url?: string;
		name?: string;
		size?: Size;
		class?: string;
	}

	let { url, name, size = 'md', class: className = '' }: Props = $props();

	let imageFailed = $state(false);

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

	const showImage = $derived(Boolean(url) && !imageFailed);
	const computedInitials = $derived(name ? initials(name) : '');
</script>

<span
	class="inline-flex items-center justify-center overflow-hidden rounded-full bg-neutral font-medium text-neutral-fg {sizeClasses[
		size
	]} {className}"
>
	{#if showImage}
		<img
			src={url}
			alt={name ?? ''}
			class="size-full object-cover"
			onerror={() => (imageFailed = true)}
		/>
	{:else if computedInitials}
		{computedInitials}
	{:else}
		<Icon path={mdiAccount} size={iconSizeBySize[size]} title="User avatar" />
	{/if}
</span>
