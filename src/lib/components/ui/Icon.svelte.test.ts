import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import Icon from './Icon.svelte';

const SAMPLE_PATH = 'M12 2L2 7l10 5 10-5-10-5z';

describe('Icon', () => {
	it('renders the given path data and is decorative (aria-hidden) by default', () => {
		const { container } = render(Icon, { props: { path: SAMPLE_PATH } });
		const svg = container.querySelector('svg');
		const path = container.querySelector('path');

		expect(svg).toHaveAttribute('aria-hidden', 'true');
		expect(svg).not.toHaveAttribute('role');
		expect(path).toHaveAttribute('d', SAMPLE_PATH);
	});

	it('becomes a labeled image when a title is provided', () => {
		const { container } = render(Icon, { props: { path: SAMPLE_PATH, title: 'Close' } });
		const svg = container.querySelector('svg');

		expect(svg).toHaveAttribute('role', 'img');
		expect(svg).toHaveAttribute('aria-label', 'Close');
		expect(svg).not.toHaveAttribute('aria-hidden');
	});

	it('applies the size class and merges a custom class', () => {
		const { container } = render(Icon, {
			props: { path: SAMPLE_PATH, size: 'lg', class: 'text-primary' }
		});
		const svg = container.querySelector('svg');

		expect(svg?.getAttribute('class')).toContain('size-6');
		expect(svg?.getAttribute('class')).toContain('text-primary');
	});
});
