import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import LoaderLine from './LoaderLine.svelte';

describe('LoaderLine', () => {
	it('is decorative and pulses by default at full width via the w-full class', () => {
		const { container } = render(LoaderLine, {});
		const el = container.firstElementChild;
		expect(el).toHaveAttribute('aria-hidden', 'true');
		expect(el?.className).toContain('animate-pulse');
		expect(el?.className).toContain('w-full');
		expect(el).not.toHaveStyle({ width: expect.anything() });
	});

	it('applies an explicit width via inline style and height', () => {
		const { container } = render(LoaderLine, { props: { width: '8rem', height: '0.75rem' } });
		const el = container.firstElementChild;
		expect(el?.className).not.toContain('w-full');
		expect(el).toHaveStyle({ width: '8rem', height: '0.75rem' });
	});

	it('full overrides an explicit width back to the w-full class', () => {
		const { container } = render(LoaderLine, { props: { width: '8rem', full: true } });
		const el = container.firstElementChild;
		expect(el?.className).toContain('w-full');
		expect(el).not.toHaveStyle({ width: expect.anything() });
	});
});
