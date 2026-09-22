import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../test/utils';
import { useWishlistStore } from '../store/wishlist';
import { WISHLIST_LIMIT } from '../api/services/wishlist';
import { WishlistButton } from './WishlistButton';

/**
 * The two things worth asserting about an optimistic update, and they are not
 * the same thing: that the UI changes BEFORE the server answers, and that it
 * changes BACK when the server says no.
 */
describe('WishlistButton', () => {
  // A Zustand store is module state: reset it, or test 2 inherits test 1's wishlist.
  beforeEach(() => useWishlistStore.setState({ ids: [] }));

  it('shows the product as saved before the server has agreed, then keeps it', async () => {
    const { user } = renderWithProviders(<WishlistButton productId={7} title="Powder Canister" />);
    const button = screen.getByRole('button', { name: 'Save Powder Canister to wishlist' });
    expect(button).toHaveAttribute('aria-pressed', 'false');

    await user.click(button);

    // The request is still in flight — the store has NOT been told yet.
    expect(screen.getByRole('button', { name: 'Remove Powder Canister from wishlist' })).toHaveAttribute('aria-pressed', 'true');
    expect(useWishlistStore.getState().ids).toEqual([]);

    // …and when it lands, the real state catches up with what was already on screen.
    await waitFor(() => expect(useWishlistStore.getState().ids).toEqual([7]), { timeout: 3000 });
    expect(screen.getByRole('button', { name: 'Remove Powder Canister from wishlist' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('rolls back on its own when the server refuses', async () => {
    // The server's rule, not the button's: the free plan holds five items.
    useWishlistStore.setState({ ids: Array.from({ length: WISHLIST_LIMIT }, (_, i) => i + 1) });
    const { user } = renderWithProviders(<WishlistButton productId={99} title="Red Lipstick" />);

    await user.click(screen.getByRole('button', { name: 'Save Red Lipstick to wishlist' }));
    expect(screen.getByRole('button', { name: 'Remove Red Lipstick from wishlist' })).toHaveAttribute('aria-pressed', 'true');

    // No rollback code was written. React drops the optimistic value when the
    // action settles, and the store was never changed.
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save Red Lipstick to wishlist' })).toHaveAttribute('aria-pressed', 'false'), { timeout: 3000 });
    expect(useWishlistStore.getState().ids).toHaveLength(WISHLIST_LIMIT);
    expect(screen.getByRole('status')).toHaveTextContent(/holds 5 items on the free plan/);
  });
});
