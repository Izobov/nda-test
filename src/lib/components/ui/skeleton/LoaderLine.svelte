<script lang="ts">
	interface Props {
		width?: string;
		height?: string;
		full?: boolean;
		class?: string;
	}

	let { width, height = '1rem', full = false, class: className = '' }: Props = $props();

	const inlineWidth = $derived(full ? '100%' : (width ?? '100%'));
</script>

<span
	class="inline-block animate-pulse rounded-md bg-neutral {className}"
	style="width: {inlineWidth}; height: {height};"
	aria-hidden="true"
></span>
