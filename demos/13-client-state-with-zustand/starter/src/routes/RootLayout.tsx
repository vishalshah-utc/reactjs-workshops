import { useEffect } from 'react';
import { Container, ProgressBar } from 'react-bootstrap';
import { Outlet, ScrollRestoration, useLoaderData, useNavigate, useNavigation, useRevalidator } from 'react-router';
import { logout } from '../api/services/auth';
import { AUTH_CHANGED, tokenStore } from '../lib/tokenStore';
import { SiteHeader } from '../components/SiteHeader';

/** Re-runs after every action — so login and logout update the header automatically. */
export function rootLoader() {
  return { user: tokenStore.getUser() };
}

// TODO(lab-2.4): render <CartDrawer /> once, next to <ScrollRestoration />
export function RootLayout() {
  const { user } = useLoaderData<typeof rootLoader>();

  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const navigate = useNavigate();
  const busy = navigation.state !== 'idle';

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

  // The wishlist used to live HERE and travel down through Outlet context. It is
  // in WishlistProvider (main.tsx) now: the header and the pages read it themselves.
  return (
    <>
      <SiteHeader cartCount={3} user={user} onSignOut={handleSignOut} />

      <div style={{ height: 3 }} aria-hidden={!busy}>
        {busy && <ProgressBar now={100} animated striped style={{ height: 3, borderRadius: 0 }} aria-label="Loading" />}
      </div>

      <Container className="py-4">
        <div className={busy ? 'opacity-50' : ''} style={{ transition: 'opacity .15s' }}>
          <Outlet />
        </div>
      </Container>

      <ScrollRestoration />
    </>
  );
}
