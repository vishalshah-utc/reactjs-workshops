import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface WishlistContextValue {
  ids: number[];
  toggle: (id: number) => void;
  isSaved: (id: number) => boolean;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

/**
 * The wishlist lived in RootLayout because that was the header's and the grid's nearest common
 * ancestor — a fact about the tree, not the wishlist. Here ANY component reads it with useWishlist().
 */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<number[]>([]);

  // Stable identity: the same function object on every render, so the memoised value below only
  // changes when `ids` does. Without useCallback, `toggle` would be new every render and useMemo pointless.
  const toggle = useCallback((id: number) => {
    setIds((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
  }, []);

  const isSaved = useCallback((id: number) => ids.includes(id), [ids]);

  const value = useMemo(() => ({ ids, toggle, isSaved }), [ids, toggle, isSaved]);

  return <WishlistContext value={value}>{children}</WishlistContext>;
}

export function useWishlist(): WishlistContextValue {
  const context = useContext(WishlistContext);
  if (context === undefined) throw new Error('useWishlist() must be called inside <WishlistProvider>.');
  return context;
}
