import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import Avatar from './Avatar.svelte';

describe('Avatar', () => {
	it('renders the image when a url is given', () => {
		render(Avatar, { props: { url: 'https://example.com/ada.png', name: 'Ada Lovelace' } });
		const img = screen.getByRole('img', { name: 'Ada Lovelace' });
		expect(img).toHaveAttribute('src', 'https://example.com/ada.png');
	});

	it('falls back to initials when no url is given', () => {
		render(Avatar, { props: { name: 'Ada Lovelace' } });
		expect(screen.getByText('AL')).toBeInTheDocument();
	});

	it('uses the first two characters of a single-word name', () => {
		render(Avatar, { props: { name: 'Ada' } });
		expect(screen.getByText('AD')).toBeInTheDocument();
	});

	it('falls back to the user icon when neither url nor name is given', () => {
		render(Avatar, {});
		expect(screen.getByRole('img', { name: 'User avatar' })).toBeInTheDocument();
	});

	it('falls back to initials if the image fails to load', async () => {
		render(Avatar, { props: { url: 'https://example.com/broken.png', name: 'Ada Lovelace' } });
		const img = screen.getByRole('img', { name: 'Ada Lovelace' });

		await fireEvent.error(img);

		expect(screen.getByText('AL')).toBeInTheDocument();
		expect(screen.queryByRole('img')).not.toBeInTheDocument();
	});

	it('recovers and shows a new image after a later url replaces one that failed', async () => {
		// Regression test: Svelte reuses component instances, so a plain
		// `imageFailed = true` boolean would permanently lock this instance
		// onto the initials fallback even after a valid new `url` prop
		// arrives (e.g. a dashboard row re-rendering for a different user).
		const { rerender } = render(Avatar, {
			props: { url: 'https://example.com/broken.png', name: 'Ada Lovelace' }
		});
		await fireEvent.error(screen.getByRole('img', { name: 'Ada Lovelace' }));
		expect(screen.getByText('AL')).toBeInTheDocument();

		await rerender({ url: 'https://example.com/grace.png', name: 'Grace Hopper' });

		const img = screen.getByRole('img', { name: 'Grace Hopper' });
		expect(img).toHaveAttribute('src', 'https://example.com/grace.png');
		expect(screen.queryByText('GH')).not.toBeInTheDocument();
	});
});
