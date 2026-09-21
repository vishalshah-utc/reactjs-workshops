/**
 * The test the cold open asked for: something that would have caught a renamed
 * prop. Every assertion belongs at the level a USER experiences the card — a
 * name, a price, a button with a label — so none of them knows what the props
 * are called.
 */

// TODO(lab-2.1): test ProductCard through renderWithProviders — the title/sale price/
// list price, no "% off" without a discount, the wishlist button's accessible name and
// aria-pressed, onToggleSave called with the id, onAddToCart called exactly once with
// the product, "Sold out" disabled at stock 0, and the edit/delete buttons appearing
// only when the page passes handlers for them.
describe('ProductCard', () => {
  it.todo('renders the title, the sale price and the list price it replaced');
  it.todo('shows no strike-through price when there is no discount');
  it.todo('reports a wishlist toggle with the product id, and says out loud whether it is saved');
  it.todo('calls the add-to-cart handler exactly once, with the whole product');
  it.todo('disables the button and renames it when the product is out of stock');
  it.todo('offers the admin actions only when the page passes handlers for them');
});
