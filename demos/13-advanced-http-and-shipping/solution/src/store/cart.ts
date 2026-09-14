import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { formatPrice } from '../lib/format';
import type { CartLine, Product } from '../types';

interface CartState {
  lines: CartLine[];
  /** UI state that BELONGS to the cart — the drawer — but is not persisted (see partialize). */
  isOpen: boolean;

  add: (product: Pick<Product, 'id' | 'title' | 'price' | 'thumbnail'>, qty?: number) => void;
  setQty: (productId: number, qty: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      isOpen: false,

      add: (product, qty = 1) =>
        set((state) => {
          const existing = state.lines.find((line) => line.productId === product.id);
          const lines = existing
            ? state.lines.map((line) => (line.productId === product.id ? { ...line, qty: line.qty + qty } : line))
            : [
                ...state.lines,
                // A SNAPSHOT of the product, not a reference: the cart must not break if the catalogue changes.
                { productId: product.id, title: product.title, price: product.price, thumbnail: product.thumbnail, qty },
              ];
          return { lines, isOpen: true }; // adding opens the drawer — ONE set, one render
        }),

      setQty: (productId, qty) =>
        set((state) => ({
          lines:
            qty <= 0
              ? state.lines.filter((line) => line.productId !== productId)
              : state.lines.map((line) => (line.productId === productId ? { ...line, qty } : line)),
        })),

      remove: (productId) => set((state) => ({ lines: state.lines.filter((line) => line.productId !== productId) })),
      clear: () => set({ lines: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
    }),
    {
      name: 'shopscope.cart',
      /** Persist the DATA, not the UI: a reload should not reopen the drawer. */
      partialize: (state) => ({ lines: state.lines }),
      /** Bump this when CartLine changes shape, and add a `migrate` — never let an old shape crash a new build. */
      version: 1,
    },
  ),
);

// --- Derived values live in SELECTORS, not in state. Storing `count` too would be two sources of truth. ---

export const selectCount = (state: CartState) => state.lines.reduce((n, line) => n + line.qty, 0);
export const selectSubtotal = (state: CartState) => state.lines.reduce((n, line) => n + line.qty * line.price, 0);

// --- The store outside React: subscribe() is a plain function — no component, no hook. ---
if (env.isDev) {
  useCartStore.subscribe((state, previous) => {
    if (state.lines !== previous.lines) {
      logger.debug(`[cart] ${selectCount(state)} items · ${formatPrice(selectSubtotal(state))}`);
    }
  });
}
