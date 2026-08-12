<script lang="ts">
	import './layout.css';

	let { children } = $props();
</script>

<!-- Theme toggle mount point — wired in Epic 1 (design tokens/primitives). -->
<!-- ModalHost mount point — wired in Epic 1b (composite Dialog/Combobox): render once here so modal state stays global and SSR-safe. -->
<!-- Error boundary mount point — wired in Epic 3 (observability). -->

{@render children()}
