<script lang="ts">
	type Size = 'xs' | 'sm' | 'md' | 'lg';

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
	class="inline-block animate-pulse rounded-full bg-neutral {sizeClasses[size]} {className}"
	aria-hidden="true"
></span>
