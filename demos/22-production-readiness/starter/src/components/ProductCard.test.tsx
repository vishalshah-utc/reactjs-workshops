import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test/utils';
import { makeProduct } from '../test/fixtures';
import { ProductCard } from './ProductCard';

/**
 * The component test the cold open asked for: would anything have caught a
 * renamed prop? Every assertion below is written the way a user experiences
 * the card — a name, a price, a button with a label — so none of them knows
 * or cares what the props are called.
 */
describe('ProductCard', () => {
  it('renders the title, the sale price and the list price it replaced', () => {
    renderWithProviders(<ProductCard product={makeProduct({ title: 'Essence Mascara', price: 100, discountPercentage: 15 })} />);

    // getByRole FIRST. A heading and a link are what a screen reader announces,
    // so asserting on them checks the accessibility tree and the output at once.
    expect(screen.getByRole('link', { name: 'Essence Mascara' })).toHaveAttribute('href', '/products/1');
    expect(screen.getByText('$85.00')).toBeInTheDocument(); // 100 − 15%
    expect(screen.getByText('$100.00')).toBeInTheDocument(); // struck through
    expect(screen.getByText('15% off')).toBeInTheDocument();
  });

  it('shows no strike-through price when there is no discount', () => {
    renderWithProviders(<ProductCard product={makeProduct({ price: 40, discountPercentage: 0 })} />);

    expect(screen.getByText('$40.00')).toBeInTheDocument();
    // queryBy is the ONLY family that may return null. getBy throws when it finds
    // nothing, so `expect(getByText(...)).toBeNull()` can never pass — it throws first.
    expect(screen.queryByText(/% off/)).toBeNull();
  });

  it('reports a wishlist toggle with the product id, and says out loud whether it is saved', async () => {
    const onToggleSave = vi.fn();
    const { user } = renderWithProviders(<ProductCard product={makeProduct({ id: 7, title: 'Powder Canister' })} onToggleSave={onToggleSave} />);

    // The accessible name IS the assertion: "Save …" vs "Remove …" is what a
    // screen-reader user hears, and aria-pressed is the state they are told.
    const save = screen.getByRole('button', { name: 'Save Powder Canister to wishlist' });
    expect(save).toHaveAttribute('aria-pressed', 'false');

    await user.click(save);

    expect(onToggleSave).toHaveBeenCalledExactlyOnceWith(7);
  });

  it('renders the saved state the parent gives it', () => {
    renderWithProviders(<ProductCard product={makeProduct({ title: 'Powder Canister' })} saved />);

    expect(screen.getByRole('button', { name: 'Remove Powder Canister from wishlist' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls the add-to-cart handler exactly once, with the whole product', async () => {
    const onAddToCart = vi.fn();
    const product = makeProduct({ id: 3, stock: 5 });
    const { user } = renderWithProviders(<ProductCard product={product} onAddToCart={onAddToCart} />);

    await user.click(screen.getByRole('button', { name: 'Add to cart' }));

    // "Exactly once" is the assertion that catches a double-fire — a handler
    // attached twice, or a form that also submits. `toHaveBeenCalled()` would not.
    expect(onAddToCart).toHaveBeenCalledExactlyOnceWith(product);
  });

  it('disables the button and renames it when the product is out of stock', async () => {
    const onAddToCart = vi.fn();
    const { user } = renderWithProviders(<ProductCard product={makeProduct({ stock: 0 })} onAddToCart={onAddToCart} />);

    const button = screen.getByRole('button', { name: 'Sold out' });
    expect(button).toBeDisabled();
    expect(screen.getByText('Out of stock')).toBeInTheDocument();

    // userEvent refuses to click a disabled element, exactly as a real pointer
    // does. fireEvent.click() would dispatch the event anyway and the test would
    // pass against a button that is broken in the browser.
    await user.click(button);
    expect(onAddToCart).not.toHaveBeenCalled();
  });

  it('offers the admin actions only when the page passes handlers for them', () => {
    const { rerender } = renderWithProviders(<ProductCard product={makeProduct({ title: 'Red Lipstick' })} />);
    expect(screen.queryByRole('button', { name: 'Delete Red Lipstick' })).toBeNull();

    rerender(<ProductCard product={makeProduct({ title: 'Red Lipstick' })} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Edit Red Lipstick' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete Red Lipstick' })).toBeInTheDocument();
  });

  it('dims itself and disables its actions while a mutation is in flight', () => {
    renderWithProviders(<ProductCard product={makeProduct({ title: 'Red Lipstick' })} onDelete={vi.fn()} onAddToCart={vi.fn()} busy />);

    expect(screen.getByRole('button', { name: 'Add to cart' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Delete Red Lipstick' })).toBeDisabled();
  });
});
