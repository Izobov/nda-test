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
});
