import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import ButtonLoader from './ButtonLoader.svelte';

describe('ButtonLoader', () => {
	it('is decorative and matches the md Button height by default', () => {
		const { container } = render(ButtonLoader, {});
		const el = container.firstElementChild;
		expect(el).toHaveAttribute('aria-hidden', 'true');
		expect(el?.className).toContain('h-10');
	});

	it('matches the requested size', () => {
		const { container } = render(ButtonLoader, { props: { size: 'lg' } });
		expect(container.firstElementChild?.className).toContain('h-12');
	});

	it('applies full width when full is true', () => {
		const { container } = render(ButtonLoader, { props: { full: true } });
		expect(container.firstElementChild?.className).toContain('w-full');
	});
});
