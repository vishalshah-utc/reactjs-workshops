import { useEffect, useReducer, useState } from 'react';
import { Outlet } from 'react-router';
import { WifiOffIcon } from 'lucide-react';
import type { CartProductSnapshot, CartState } from '@/types';
import { calculateCart } from '@/lib/pricing';
import { cartReducer, initialCartState } from '@/lib/cart';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { CartSheet } from '@/components/CartSheet';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';

/**
 * The shell every page renders inside: header, footer, offline banner, cart.
 *
 * ── Why the cart lives HERE and not in a page ──────────────────────────────
 *
 * The cart must survive navigation. If `CatalogPage` owned it, moving to a
 * product page would unmount the catalogue and take the cart with it.
 * A layout route does not unmount when its children change, so state that
 * belongs to the whole session belongs at this level.
 *
 * That is the routing version of "lift state up" — the closest common
 * ancestor of every page that touches the cart is the layout.
 *
 * ── How pages reach it ─────────────────────────────────────────────────────
 *
 * `<Outlet context={…} />` passes a value to whichever child route is
 * rendering, and the child reads it with `useOutletContext()`. It is prop
 * drilling with the drilling removed — the router is already between the two
 * components, so it carries the value for you.
 *
 * (Session 8 replaces this with a real global store once three more features
 * need the same data. Outlet context is the right size for one value shared by
 * a handful of pages, and stops being the right size after that.)
 */
export interface OutletContext {
  cartQuantities: Record<string, number>;
  addToCart: (product: CartProductSnapshot) => void;
  isOnline: boolean;
}

export function RootLayout() {
  const isOnline = useOnlineStatus();
  const [cartOpen, setCartOpen] = useState(false);
  const [promoDraft, setPromoDraft] = useState('');

  const [storedCart, setStoredCart] = useLocalStorage<CartState>('shopcrew.cart', initialCartState);
  const [cart, dispatch] = useReducer(cartReducer, storedCart);

  useEffect(() => {
    setStoredCart(cart);
  }, [cart, setStoredCart]);

  const cartTotals = calculateCart(cart.lines, cart.promoCode);
  const cartQuantities = Object.fromEntries(cart.lines.map((line) => [line.productId, line.quantity]));

  function addToCart(product: CartProductSnapshot) {
    dispatch({ type: 'cart/add', product });
    setCartOpen(true);
  }

  const outletContext: OutletContext = { cartQuantities, addToCart, isOnline };

  return (
    <div className="flex min-h-full flex-col">
      {!isOnline && (
        <div className="bg-destructive text-destructive-foreground flex items-center justify-center gap-2 px-4 py-1.5 text-sm" role="status">
          <WifiOffIcon className="size-4" />
          You are offline — showing the last thing we loaded
        </div>
      )}

      <SiteHeader cartCount={cartTotals.itemCount} onCartClick={() => setCartOpen(true)} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        {/*
          The matched child route renders here.

          `context` is React Router's way of handing a value to whichever child
          is rendering, read on the other side with `useOutletContext()`. It is
          prop drilling with the drilling removed — the router already sits
          between these two components, so it carries the value for you.

          If a nested route ever renders a blank page below the header, a
          missing <Outlet /> is the first thing to check. It produces no error
          and no warning: the router matches the child perfectly well, it just
          has nowhere to put it.
        */}
        <Outlet context={outletContext} />
      </main>

      <SiteFooter />

      <CartSheet
        open={cartOpen}
        onOpenChange={setCartOpen}
        cart={cartTotals}
        promoCode={cart.promoCode}
        dispatch={dispatch}
        promoDraft={promoDraft}
        onPromoDraftChange={setPromoDraft}
      />
    </div>
  );
}
