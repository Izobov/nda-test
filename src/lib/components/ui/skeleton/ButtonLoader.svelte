<script lang="ts">
	import type { Size } from '../types';

	interface Props {
		size?: Size;
		full?: boolean;
		class?: string;
	}

	let { size = 'md', full = false, class: className = '' }: Props = $props();

	const sizeClasses: Record<Size, string> = {
		xs: 'h-7 w-16',
		sm: 'h-8 w-20',
		md: 'h-10 w-24',
		lg: 'h-12 w-28'
	};
</script>

<span
	class="inline-block animate-pulse rounded-md bg-neutral {sizeClasses[size]} {full
		? 'w-full'
		: ''} {className}"
	aria-hidden="true"
></span>
