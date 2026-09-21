import { useEffect, useRef } from 'react';
import { Container, ProgressBar } from 'react-bootstrap';
import { Outlet, ScrollRestoration, useLoaderData, useNavigate, useNavigation, useRevalidator } from 'react-router';
import { logout } from '../api/services/auth';
import { AUTH_CHANGED, tokenStore } from '../lib/tokenStore';
import { SiteHeader } from '../components/SiteHeader';
import { CartDrawer } from '../components/CartDrawer';
import { RouteAnnouncer } from '../components/RouteAnnouncer';
import { useReducedMotion } from '../hooks/useReducedMotion';

/** Re-runs after every action — so login and logout update the header automatically. */
export function rootLoader() {
  return { user: tokenStore.getUser() };
}

export function RootLayout() {
  const { user } = useLoaderData<typeof rootLoader>();

  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const navigate = useNavigate();
  const busy = navigation.state !== 'idle';
  const reducedMotion = useReducedMotion();

  // The region every page renders into. The announcer focuses its <h1> (or the region) after each navigation.
  const mainRef = useRef<HTMLElement>(null);

  // The API layer clears tokens on a failed refresh. The router can't see
  // that, so we subscribe to the event and re-run the loaders.
  useEffect(() => {
    const onAuthChanged = () => revalidator.revalidate();
    window.addEventListener(AUTH_CHANGED, onAuthChanged);
    return () => window.removeEventListener(AUTH_CHANGED, onAuthChanged);
  }, [revalidator]);

  function handleSignOut() {
    logout(); // clears storage → AUTH_CHANGED → revalidate → header updates
    navigate('/products');
  }

  // The wishlist lived HERE (Outlet context, Demo 9), then in WishlistProvider (Demo 12).
  // It and the cart are stores now: any component reads them directly, no provider.
  return (
    <>
      {/* The FIRST Tab stop on every page. Invisible until focused; #main is the <main> below, focusable because of its tabIndex. */}
      <a href="#main" className="visually-hidden-focusable position-absolute top-0 start-0 m-2 btn btn-primary" style={{ zIndex: 1100 }}>
        Skip to content
      </a>

      <SiteHeader user={user} onSignOut={handleSignOut} />

      <div style={{ height: 3 }} aria-hidden={!busy}>
        {/* A moving stripe is motion. With "reduce motion" on, the bar still shows — it just holds still. */}
        {busy && <ProgressBar now={100} animated={!reducedMotion} striped style={{ height: 3, borderRadius: 0 }} aria-label="Loading" />}
      </div>

      <Container className="py-4">
        {/* tabIndex={-1}: focusable from code (the announcer, the skip link), never in the Tab order. outline: none — a ring
            around the whole page is noise; the heading inside keeps its own. */}
        <main
          ref={mainRef}
          id="main"
          tabIndex={-1}
          className={busy ? 'opacity-50' : ''}
          style={{ transition: reducedMotion ? 'none' : 'opacity .15s', outline: 'none' }}
        >
          <Outlet />
        </main>
      </Container>

      {/* Rendered once, here; opened from the header, filled from the product pages — all through the store. */}
      <CartDrawer />

      <RouteAnnouncer mainRef={mainRef} />
      <ScrollRestoration />
    </>
  );
}
