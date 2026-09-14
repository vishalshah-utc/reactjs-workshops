import { useState } from 'react';
import { Container, ProgressBar } from 'react-bootstrap';
import { Outlet, ScrollRestoration, useNavigation } from 'react-router';
import { SiteHeader } from '../components/SiteHeader';

/** What the layout shares with its pages. Pages read it with useOutletContext<RootOutletContext>(). */
export interface RootOutletContext {
  wishlist: number[];
  toggleWishlist: (id: number) => void;
}

// TODO(lab-3.2): export rootLoader() → { user: tokenStore.getUser() }; useLoaderData for the header; useRevalidator on AUTH_CHANGED; sign-out
export function RootLayout() {
  const [wishlist, setWishlist] = useState<number[]>([]);

  // "idle" | "loading" (a navigation's loaders are running) | "submitting" (an action is running)
  const navigation = useNavigation();
  const busy = navigation.state !== 'idle';

  function toggleWishlist(id: number) {
    setWishlist((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
  }

  const outletContext: RootOutletContext = { wishlist, toggleWishlist };

  return (
    <>
      <SiteHeader cartCount={3} wishlistCount={wishlist.length} />

      {/* A fixed-height slot so the layout doesn't jump when the bar appears. */}
      <div style={{ height: 3 }} aria-hidden={!busy}>
        {busy && <ProgressBar now={100} animated striped style={{ height: 3, borderRadius: 0 }} aria-label="Loading" />}
      </div>

      <Container className="py-4">
        {/* The OLD page stays on screen, dimmed, while the next page's loaders run. */}
        <div className={busy ? 'opacity-50' : ''} style={{ transition: 'opacity .15s' }}>
          <Outlet context={outletContext} />
        </div>
      </Container>

      <ScrollRestoration />
    </>
  );
}
