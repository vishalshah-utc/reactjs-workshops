import { useState } from 'react';
import { Container } from 'react-bootstrap';
import { Outlet, ScrollRestoration } from 'react-router';
import { SiteHeader } from '../components/SiteHeader';

/** What the layout shares with its pages. Pages read it with useOutletContext<RootOutletContext>(). */
export interface RootOutletContext {
  wishlist: number[];
  toggleWishlist: (id: number) => void;
}

/**
 * The shell every page renders inside. It owns state that outlives any one
 * page — the wishlist — and shares it downward through Outlet context, so the
 * header count and the product grid read the same array.
 */
// TODO(lab-2.1): useNavigation() — a thin progress bar while state !== 'idle', and dim the stale page
export function RootLayout() {
  const [wishlist, setWishlist] = useState<number[]>([]);

  function toggleWishlist(id: number) {
    setWishlist((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
  }

  const outletContext: RootOutletContext = { wishlist, toggleWishlist };

  return (
    <>
      <SiteHeader cartCount={3} wishlistCount={wishlist.length} />

      <Container className="py-4">
        <Outlet context={outletContext} />
      </Container>

      {/* Restores scroll on back/forward, resets to top on new navigations — what real page loads do for free. */}
      <ScrollRestoration />
    </>
  );
}
