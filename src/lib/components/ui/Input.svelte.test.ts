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
		// A plain closure variable, not $state: this assertion is a one-time
		// snapshot read after `await user.type(...)` has already settled, not
		// a reactive consumer (template/$derived/$effect) — so there's
		// nothing for $state's reactivity to buy here, and Svelte's compiler
		// correctly flags a bare $state read in that position as suspicious
		// ("state_referenced_locally"). $bindable() only needs a real
		// get/set accessor pair on the props object; it doesn't care whether
		// the backing cell is reactive.
		let currentValue = '';
		render(Input, {
			props: {
				label: 'Name',
				get value() {
					return currentValue;
				},
				set value(v) {
					currentValue = v;
				}
			}
		});
		await user.type(screen.getByLabelText('Name'), 'Ada');
		expect(currentValue).toBe('Ada');
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
