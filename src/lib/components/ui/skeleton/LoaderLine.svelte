<script lang="ts">
	interface Props {
		width?: string;
		height?: string;
		full?: boolean;
		class?: string;
	}

	let { width, height = '1rem', full = false, class: className = '' }: Props = $props();

	// full and "no width given" both mean 100% — express that with the same
	// static w-full utility Button uses for its own `full` prop, rather than
	// an inline style, so the two primitives agree on how "full width" is
	// spelled. A caller-supplied width still needs an inline style: Tailwind's
	// class scanner only picks up class names that appear literally in
	// source, so a runtime-interpolated value like `w-[{width}]` can never
	// generate CSS at build time.
	const useFullWidthClass = $derived(full || width === undefined);
	const customWidth = $derived(useFullWidthClass ? undefined : width);
</script>

<span
	class="inline-block animate-pulse rounded-md bg-neutral {useFullWidthClass
		? 'w-full'
		: ''} {className}"
	style="height: {height};{customWidth ? ` width: ${customWidth};` : ''}"
	aria-hidden="true"
></span>
