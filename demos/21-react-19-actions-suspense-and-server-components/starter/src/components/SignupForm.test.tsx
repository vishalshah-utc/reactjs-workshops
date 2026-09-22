/**
 * The form Demo 4 built with react-hook-form, rebuilt on React 19 Actions —
 * and these tests must not know the difference. Every assertion is a label, a
 * role or a message, so they would have passed against the old component too.
 * That is a test suite doing its job during a rewrite.
 */

// TODO(lab-1.7): write these through `renderWithProviders(<SignupForm show onClose={vi.fn()} />)`.
// A `fillValidForm(user)` helper keeps three of them to two lines each. The pending test is the
// interesting one: click, then assert the button is named "Creating…" and disabled BEFORE the
// 700 ms action settles — that is `useFormStatus` working with no prop passed to it.
describe('SignupForm', () => {
  it.todo('returns one message per invalid field, and keeps what was typed');
  it.todo('disables its own submit button while the action is running');
  it.todo('puts a server-side rejection on the field it belongs to');
  it.todo('renders the success message the action returned, with the chosen interests in it');
});
