import type { ReactNode } from 'react';

/**
 * The wishlist, owned by a provider instead of RootLayout. Any component in
 * the tree — the header, the grid, the detail page — reads it with useWishlist().
 */
// TODO(lab-4.1): WishlistProvider (useState<number[]>, toggle, isSaved, a useMemo'd value) and useWishlist() that throws outside the provider
export function WishlistProvider({ children }: { children: ReactNode }) {
  return children;
}
