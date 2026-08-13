import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import BadgeLoader from './BadgeLoader.svelte';

describe('BadgeLoader', () => {
	it('is decorative and pill-shaped', () => {
		const { container } = render(BadgeLoader, {});
		const el = container.firstElementChild;
		expect(el).toHaveAttribute('aria-hidden', 'true');
		expect(el?.className).toContain('rounded-full');
	});

	it('merges a custom class', () => {
		const { container } = render(BadgeLoader, { props: { class: 'ml-2' } });
		expect(container.firstElementChild?.className).toContain('ml-2');
	});
});
