import type { User } from '../types';

// TODO(lab-6.2): the legacy withAuth HOC as a hook — useRouteLoaderData<typeof rootLoader>('root')?.user ?? null.
// The router has known the user since Demo 11; the HOC subscribed to storage by hand for a value that was already there.
/** Placeholder: always signed out. EditProductLink still uses src/legacy/withAuth.tsx. */
export function useAuthUser(): User | null {
  return null;
}
