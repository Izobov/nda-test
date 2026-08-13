import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Badge from './Badge.svelte';

function label(text: string) {
	return createRawSnippet(() => ({
		render: () => `<span>${text}</span>`
	}));
}

describe('Badge', () => {
	// getByText('...') resolves to the raw snippet's own <span>text</span>;
	// its parentElement is Badge's styled root <span> one level up. Do not
	// use .closest('span') here — the snippet's span matches itself first.
	it('defaults to the neutral variant', () => {
		render(Badge, { props: { children: label('Draft') } });
		expect(screen.getByText('Draft').parentElement?.className).toContain('bg-neutral');
	});

	it.each([
		['primary', 'bg-primary'],
		['success', 'bg-success'],
		['warning', 'bg-warning'],
		['danger', 'bg-danger']
	] as const)('applies the %s variant classes', (variant, expectedClass) => {
		render(Badge, { props: { children: label(variant), variant } });
		expect(screen.getByText(variant).parentElement?.className).toContain(expectedClass);
	});

	it('merges a custom class', () => {
		render(Badge, { props: { children: label('Custom'), class: 'ml-2' } });
		expect(screen.getByText('Custom').parentElement?.className).toContain('ml-2');
	});
});
