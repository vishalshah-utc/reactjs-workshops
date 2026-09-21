import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * State AND the actions that change it, in one object. Components never call
 * `set` — they call `toggle`, and the store decides what that means.
 */
interface WishlistState {
  ids: number[];
  toggle: (id: number) => void;
  clear: () => void;
}

/**
 * A store is a HOOK. `useWishlistStore((s) => s.ids)` subscribes a component
 * to exactly that slice — it re-renders when `ids` changes and at no other time.
 *
 * `create<State>()(…)` — the empty call is the TypeScript idiom that lets the
 * middleware types flow through; without it, `persist` loses the state type.
 */
export const useWishlistStore = create<WishlistState>()(
  persist(
    (set) => ({
      ids: [],
      // `set` with a function reads the CURRENT state, like React's updater form.
      toggle: (id) =>
        set((state) => ({ ids: state.ids.includes(id) ? state.ids.filter((x) => x !== id) : [...state.ids, id] })),
      clear: () => set({ ids: [] }),
    }),
    { name: 'shopscope.wishlist' }, // the localStorage key
  ),
);

// --- Selectors: named, reusable, testable without React. -------------------

export const selectWishlistCount = (state: WishlistState) => state.ids.length;

/** A selector FACTORY: `useWishlistStore(selectIsSaved(42))` → boolean. */
export const selectIsSaved = (id: number) => (state: WishlistState) => state.ids.includes(id);
