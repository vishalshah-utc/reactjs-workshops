/**
 * The two things worth asserting about an optimistic update, and they are not
 * the same thing: that the UI changes BEFORE the server answers, and that it
 * changes BACK when the server says no.
 */

// TODO(lab-1.8): reset the Zustand store in `beforeEach` (`useWishlistStore.setState({ ids: [] })`)
// or test 2 inherits test 1's wishlist. In test 1, assert aria-pressed is already "true" while
// `useWishlistStore.getState().ids` is still empty — that gap IS the optimistic update. In test 2,
// seed WISHLIST_LIMIT ids first, then assert the button goes back to "Save …" on its own.
describe('WishlistButton', () => {
  it.todo('shows the product as saved before the server has agreed, then keeps it');
  it.todo('rolls back on its own when the server refuses');
});
