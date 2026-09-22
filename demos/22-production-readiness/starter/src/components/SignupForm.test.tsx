import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { renderWithProviders } from '../test/utils';
import { SignupForm } from './SignupForm';

/**
 * The form Demo 4 built with react-hook-form, rebuilt on React 19 Actions —
 * and the tests do not know the difference. Every assertion is a label, a
 * role or a message, so they would have passed against the old component too.
 * That is the test suite doing its job during a rewrite.
 */

/** Fill in enough to satisfy the schema. Returns nothing: the DOM is the state. */
async function fillValidForm(user: UserEvent, email = 'ada@example.test') {
  await user.type(screen.getByLabelText('First name'), 'Ada');
  await user.type(screen.getByLabelText('Last name'), 'Lovelace');
  await user.type(screen.getByLabelText('Email'), email);
  await user.type(screen.getByLabelText('Password'), 'analytical1');
  await user.type(screen.getByLabelText('Age'), '36');
  await user.type(screen.getByLabelText('Date of birth'), '1990-12-10');
  await user.selectOptions(screen.getByLabelText('Country'), 'GB');
  await user.click(screen.getByLabelText('Female'));
  await user.click(screen.getByLabelText('Beauty'));
  await user.click(screen.getByLabelText('I accept the terms and conditions'));
}

describe('SignupForm', () => {
  it('returns one message per invalid field, and keeps what was typed', async () => {
    const { user } = renderWithProviders(<SignupForm show onClose={vi.fn()} />);

    await user.type(screen.getByLabelText('First name'), 'Ada');
    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    // The schema ran inside the ACTION, and the action RETURNED its errors —
    // nothing was thrown, so the modal is still on screen with the input in it.
    expect(await screen.findByText("That doesn't look like an email address.")).toBeInTheDocument();
    expect(screen.getByText('Last name is required.')).toBeInTheDocument();
    expect(screen.getByText('You must accept the terms.')).toBeInTheDocument();
    expect(screen.getByLabelText('First name')).toHaveValue('Ada');
    expect(screen.getByLabelText('Email')).toHaveValue('not-an-email');
  });

  it('disables its own submit button while the action is running', async () => {
    const { user } = renderWithProviders(<SignupForm show onClose={vi.fn()} />);
    await fillValidForm(user);

    await user.click(screen.getByRole('button', { name: 'Create account' }));

    // Nobody passed the button a prop. `useFormStatus` read the form above it.
    const pending = screen.getByRole('button', { name: 'Creating…' });
    expect(pending).toBeDisabled();

    expect(await screen.findByText(/your account is ready/, undefined, { timeout: 3000 })).toBeInTheDocument();
  });

  it('puts a server-side rejection on the field it belongs to', async () => {
    const { user } = renderWithProviders(<SignupForm show onClose={vi.fn()} />);
    await fillValidForm(user, 'ada@taken.com');

    await user.click(screen.getByRole('button', { name: 'Create account' }));

    // A failure that only the server could know about arrives the same way a
    // schema failure does — as a returned value on the field that caused it.
    expect(await screen.findByText('That email is already registered.', undefined, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveValue('ada@taken.com');
  });

  it('renders the success message the action returned, with the chosen interests in it', async () => {
    const { user } = renderWithProviders(<SignupForm show onClose={vi.fn()} />);
    await fillValidForm(user);

    await user.click(screen.getByRole('button', { name: 'Create account' }));

    // `beauty` came out of formData.getAll('interests'), which is the whole
    // reason a checkbox group needs no state.
    expect(await screen.findByText('Ada, your account is ready. Following: beauty.', undefined, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Create account' })).toBeNull();
  });
});
