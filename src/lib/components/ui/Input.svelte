<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLInputAttributes, 'value' | 'required'> {
		value?: string;
		label: string;
		errorText?: string;
		required?: boolean;
		class?: string;
	}

	let {
		value = $bindable(''),
		label,
		errorText,
		required = false,
		id,
		class: className = '',
		...rest
	}: Props = $props();

	const uid = $props.id();
	const inputId = id ?? `input-${uid}`;
	const errorId = `${inputId}-error`;
</script>

<div class="flex flex-col gap-1.5">
	<label for={inputId} class="text-sm font-medium text-fg">
		{label}
		{#if required}
			<span aria-hidden="true" class="text-danger-text">*</span>
		{/if}
	</label>
	<input
		id={inputId}
		bind:value
		{required}
		class="h-10 rounded-md border border-border bg-bg px-3 text-sm text-fg placeholder:text-muted-fg focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:opacity-50 {className}"
		aria-invalid={errorText ? 'true' : undefined}
		aria-describedby={errorText ? errorId : undefined}
		{...rest}
	/>
	{#if errorText}
		<p id={errorId} role="alert" class="text-sm text-danger-text">{errorText}</p>
	{/if}
</div>
