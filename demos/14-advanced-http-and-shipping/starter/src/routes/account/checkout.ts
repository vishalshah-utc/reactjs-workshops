import { data, type ActionFunctionArgs } from 'react-router';
import { createCart } from '../../api/services/carts';
import { ApiError } from '../../lib/ApiError';
import { useCartStore } from '../../store/cart';
import { userContext } from '../middleware';
import type { Cart } from '../../types';

/** A discriminated union: `ok` tells the drawer which fields exist. */
export type CheckoutResult = { ok: true; cart: Cart } | { ok: false; error: string };

/**
 * An action with NO component — the app's checkout "endpoint". It sits under
 * /account, so authMiddleware runs first: a signed-out fetcher submission is
 * redirected to /login before this line ever executes.
 */
export async function checkoutAction({ context }: ActionFunctionArgs): Promise<CheckoutResult> {
  const user = context.get(userContext);
  if (!user) throw data({ message: 'Sign in to check out.' }, { status: 401 }); // a wiring bug — the middleware should have redirected

  // The store OUTSIDE React: getState() is a plain function call — no hook, no component, no props.
  const { lines, clear } = useCartStore.getState();
  if (lines.length === 0) return { ok: false, error: 'Your cart is empty.' };

  try {
    const cart = await createCart(
      user.id,
      lines.map((line) => ({ id: line.productId, quantity: line.qty })),
    );
    clear(); // a store action, called from a router action — every subscribed component updates
    return { ok: true, cart };
  } catch (error) {
    return { ok: false, error: ApiError.from(error).message };
  }
}
