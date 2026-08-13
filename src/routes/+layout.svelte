<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import './layout.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<a href="#main-content" class="sr-only focus:not-sr-only">Skip to content</a>

<header>
	<!-- Theme toggle mount point — wired in Epic 1 (design tokens/primitives). -->
</header>

<main id="main-content">
	{@render children()}
</main>

<!-- ModalHost mount point — wired in Epic 1b (composite Dialog/Combobox): render once here so modal state stays global and SSR-safe. -->

<!--
	Error boundary mount point — wired in Epic 3 (observability). svelte:boundary
	must wrap content, so Epic 3 replaces the <main> block above with
	<main id="main-content"><svelte:boundary>{@render children()}</svelte:boundary></main>
	rather than inserting at a comment — noted here so that's expected, not a
	conflict with "add-only."
-->
