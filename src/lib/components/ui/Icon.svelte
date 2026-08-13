<script lang="ts">
	import type { Size } from './types';

	interface Props {
		path: string;
		size?: Size;
		title?: string;
		class?: string;
	}

	let { path, size = 'md', title, class: className = '' }: Props = $props();

	const sizeClasses: Record<Size, string> = {
		xs: 'size-3.5',
		sm: 'size-4',
		md: 'size-5',
		lg: 'size-6'
	};
</script>

<svg
	viewBox="0 0 24 24"
	class="shrink-0 fill-current {sizeClasses[size]} {className}"
	role={title ? 'img' : undefined}
	aria-label={title}
	aria-hidden={title ? undefined : 'true'}
>
	<path d={path} />
</svg>
