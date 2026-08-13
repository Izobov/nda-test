import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Input from './Input.svelte';

describe('Input', () => {
	it('associates the label with the input via a generated id', () => {
		render(Input, { props: { label: 'Email', value: '' } });
		const input = screen.getByLabelText('Email');
		expect(input).toBeInTheDocument();
	});

	it('propagates typed input back through the bindable value', async () => {
		const user = userEvent.setup();
		// This file is `Input.svelte.test.ts`: vite-plugin-svelte's default
		// module-infix filter (`.svelte.` + a trailing `.js`/`.ts`, with any
		// number of extra dot-segments — e.g. `.test.` — allowed in between)
		// matches it, so it IS compiled as a Svelte module and $state works
		// directly here, same as in a `.svelte.ts` file.
		let value = $state('');
		render(Input, {
			props: {
				label: 'Name',
				get value() {
					return value;
				},
				set value(v) {
					value = v;
				}
			}
		});
		await user.type(screen.getByLabelText('Name'), 'Ada');
		expect(value).toBe('Ada');
	});

	it('has no error state and no aria-invalid when errorText is absent', () => {
		render(Input, { props: { label: 'Email', value: '' } });
		expect(screen.getByLabelText('Email')).not.toHaveAttribute('aria-invalid');
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});

	it('renders errorText in red as an alert, linked via aria-describedby, and sets aria-invalid', () => {
		render(Input, { props: { label: 'Email', value: '', errorText: 'Email is required' } });
		const input = screen.getByLabelText('Email');
		const message = screen.getByRole('alert');

		expect(message).toHaveTextContent('Email is required');
		expect(input).toHaveAttribute('aria-invalid', 'true');
		expect(input.getAttribute('aria-describedby')).toBe(message.id);
		expect(message.className).toContain('text-danger-text');
	});

	it('forwards native input attributes such as placeholder and type', () => {
		render(Input, {
			props: { label: 'Email', value: '', placeholder: 'you@example.com', type: 'email' }
		});
		const input = screen.getByLabelText('Email');
		expect(input).toHaveAttribute('placeholder', 'you@example.com');
		expect(input).toHaveAttribute('type', 'email');
	});

	it('marks the input required and shows a visual asterisk on the label when required is true', () => {
		render(Input, { props: { label: 'Email', value: '', required: true } });
		// exact: false — the label's own text is now "Email *", so an exact
		// match against "Email" alone would no longer find it.
		const input = screen.getByLabelText('Email', { exact: false });

		expect(input).toBeRequired();
		expect(screen.getByText('*')).toBeInTheDocument();
	});

	it('has no asterisk and is not required by default', () => {
		render(Input, { props: { label: 'Email', value: '' } });
		expect(screen.getByLabelText('Email')).not.toBeRequired();
		expect(screen.queryByText('*')).not.toBeInTheDocument();
	});
});
