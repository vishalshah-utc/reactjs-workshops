import { useRouteLoaderData } from 'react-router';
import type { rootLoader } from '../routes/RootLayout';
import type { User } from '../types';

/**
 * The legacy `withAuth` HOC as a hook — and shorter than the HOC by every line it no longer needs. The HOC
 * subscribed to storage by hand; the router has known the user since Demo 11 (`rootLoader` re-runs after every
 * action, so login and logout already update it). A hook can just ask. `null` = signed out.
 */
export function useAuthUser(): User | null {
  return useRouteLoaderData<typeof rootLoader>('root')?.user ?? null;
}
