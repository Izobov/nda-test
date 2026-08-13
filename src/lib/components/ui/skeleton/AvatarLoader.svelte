<script lang="ts">
	import type { Size } from '../types';

	interface Props {
		size?: Size;
		class?: string;
	}

	let { size = 'md', class: className = '' }: Props = $props();

	const sizeClasses: Record<Size, string> = {
		xs: 'size-6',
		sm: 'size-8',
		md: 'size-10',
		lg: 'size-14'
	};
</script>

<span
	class="inline-block shrink-0 animate-pulse rounded-full bg-neutral {sizeClasses[
		size
	]} {className}"
	aria-hidden="true"
></span>
