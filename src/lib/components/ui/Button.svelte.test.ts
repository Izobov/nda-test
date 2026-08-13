import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import Button from './Button.svelte';

function label(text: string) {
	return createRawSnippet(() => ({
		render: () => `<span>${text}</span>`
	}));
}

describe('Button', () => {
	it('defaults to type=button, variant=primary, size=md and renders its children', () => {
		render(Button, { props: { children: label('Save') } });
		const button = screen.getByRole('button', { name: 'Save' });

		expect(button).toHaveAttribute('type', 'button');
		expect(button.className).toContain('bg-primary');
		expect(button.className).toContain('h-10');
	});

	it('applies the outline variant and requested size', () => {
		render(Button, { props: { children: label('Cancel'), variant: 'outline', size: 'xs' } });
		const button = screen.getByRole('button', { name: 'Cancel' });

		expect(button.className).toContain('border-border');
		expect(button.className).toContain('h-7');
	});

	it('applies full width when full is true', () => {
		render(Button, { props: { children: label('Submit'), full: true } });
		expect(screen.getByRole('button', { name: 'Submit' }).className).toContain('w-full');
	});

	it('is disabled and unclickable when disabled is true', async () => {
		const user = userEvent.setup();
		const onclick = vi.fn();
		render(Button, { props: { children: label('Delete'), disabled: true, onclick } });
		const button = screen.getByRole('button', { name: 'Delete' });

		expect(button).toBeDisabled();
		await user.click(button);
		expect(onclick).not.toHaveBeenCalled();
	});

	it('forwards native button attributes and fires onclick', async () => {
		const user = userEvent.setup();
		const onclick = vi.fn();
		render(Button, {
			props: { children: label('Go'), onclick, 'aria-label': 'Go to next step' }
		});
		const button = screen.getByRole('button', { name: 'Go to next step' });

		await user.click(button);
		expect(onclick).toHaveBeenCalledOnce();
	});

	it('lets a caller override type, e.g. for a submit button', () => {
		render(Button, { props: { children: label('Submit'), type: 'submit' } });
		expect(screen.getByRole('button', { name: 'Submit' })).toHaveAttribute('type', 'submit');
	});
});
