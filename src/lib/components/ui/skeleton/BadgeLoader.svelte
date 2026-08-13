<script lang="ts">
	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();
</script>

<span
	class="inline-block h-5 w-14 shrink-0 animate-pulse rounded-full bg-neutral {className}"
	aria-hidden="true"
></span>
