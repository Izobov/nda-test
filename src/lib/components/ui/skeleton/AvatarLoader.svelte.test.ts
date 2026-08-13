import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import AvatarLoader from './AvatarLoader.svelte';

describe('AvatarLoader', () => {
	it('is decorative, circular, and matches the md Avatar size by default', () => {
		const { container } = render(AvatarLoader, {});
		const el = container.firstElementChild;
		expect(el).toHaveAttribute('aria-hidden', 'true');
		expect(el?.className).toContain('rounded-full');
		expect(el?.className).toContain('size-10');
	});

	it('matches the requested size', () => {
		const { container } = render(AvatarLoader, { props: { size: 'lg' } });
		expect(container.firstElementChild?.className).toContain('size-14');
	});

	it('merges a custom class', () => {
		const { container } = render(AvatarLoader, { props: { class: 'ml-2' } });
		expect(container.firstElementChild?.className).toContain('ml-2');
	});
});
