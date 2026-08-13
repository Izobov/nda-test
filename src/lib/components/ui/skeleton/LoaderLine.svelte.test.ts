import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import LoaderLine from './LoaderLine.svelte';

describe('LoaderLine', () => {
	it('is decorative and pulses by default at full width', () => {
		const { container } = render(LoaderLine, {});
		const el = container.firstElementChild;
		expect(el).toHaveAttribute('aria-hidden', 'true');
		expect(el?.className).toContain('animate-pulse');
		expect(el).toHaveStyle({ width: '100%' });
	});

	it('applies an explicit width and height', () => {
		const { container } = render(LoaderLine, { props: { width: '8rem', height: '0.75rem' } });
		const el = container.firstElementChild;
		expect(el).toHaveStyle({ width: '8rem', height: '0.75rem' });
	});

	it('full overrides width to 100%', () => {
		const { container } = render(LoaderLine, { props: { width: '8rem', full: true } });
		expect(container.firstElementChild).toHaveStyle({ width: '100%' });
	});
});
