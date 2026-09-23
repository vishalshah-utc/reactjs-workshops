import { useEffect } from 'react';
import { Container, ProgressBar } from 'react-bootstrap';
import { Outlet, ScrollRestoration, useLoaderData, useNavigate, useNavigation, useRevalidator } from 'react-router';
import { logout } from '../api/services/auth';
import { useAppDispatch } from '../store/hooks';
import { signedOut } from '../store/session';
import { inventoryApi } from '../api/inventoryApi';
import { AUTH_CHANGED, tokenStore } from '../lib/tokenStore';
import { SiteHeader } from '../components/SiteHeader';
import { CartDrawer } from '../components/CartDrawer';

/** Re-runs after every action — so login and logout update the header automatically. */
export function rootLoader() {
  return { user: tokenStore.getUser() };
}

export function RootLayout() {
  const { user } = useLoaderData<typeof rootLoader>();

  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
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
    // F7. ONE action; the inventory and recent slices each decide what it means
    // for them, and the cart and wishlist — which are Zustand, and not
    // user-scoped — are untouched. The RTK Query cache is separate state with
    // its own reset, because it holds somebody else's data, not ours.
    dispatch(signedOut());
    dispatch(inventoryApi.util.resetApiState());
    navigate('/products');
  }

  // The wishlist lived HERE (Outlet context, Demo 9), then in WishlistProvider (Demo 12).
  // It and the cart are stores now: any component reads them directly, no provider.
  return (
    <>
      <SiteHeader user={user} onSignOut={handleSignOut} />

      <div style={{ height: 3 }} aria-hidden={!busy}>
        {busy && <ProgressBar now={100} animated striped style={{ height: 3, borderRadius: 0 }} aria-label="Loading" />}
      </div>

      <Container className="py-4">
        <div className={busy ? 'opacity-50' : ''} style={{ transition: 'opacity .15s' }}>
          <Outlet />
        </div>
      </Container>

      {/* Rendered once, here; opened from the header, filled from the product pages — all through the store. */}
      <CartDrawer />

      <ScrollRestoration />
    </>
  );
}
