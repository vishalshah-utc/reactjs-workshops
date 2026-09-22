import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { cartLinesReducer, lineCount, subtotal, type CartLineProduct } from '../lib/cartMath';
import { formatPrice } from '../lib/format';
import type { CartLine } from '../types';

interface CartState {
  lines: CartLine[];
  /** UI state that BELONGS to the cart — the drawer — but is not persisted (see partialize). */
  isOpen: boolean;

  add: (product: CartLineProduct, qty?: number) => void;
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

      // The RULES are cartLinesReducer (Demo 12, src/lib/cartMath.ts) — one pure, testable function.
      // The store's job is to hold the lines, hand them to the reducer and notify subscribers.
      // Same function, two homes: useReducer could run it; so can this.
      add: (product, qty = 1) =>
        set((state) => ({
          lines: cartLinesReducer(state.lines, { type: 'add', product, qty }),
          isOpen: true, // adding opens the drawer — ONE set, one render
        })),
      setQty: (productId, qty) => set((state) => ({ lines: cartLinesReducer(state.lines, { type: 'setQty', productId, qty }) })),
      remove: (productId) => set((state) => ({ lines: cartLinesReducer(state.lines, { type: 'remove', productId }) })),
      clear: () => set((state) => ({ lines: cartLinesReducer(state.lines, { type: 'clear' }) })),
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

export const selectCount = (state: CartState) => lineCount(state.lines);
export const selectSubtotal = (state: CartState) => subtotal(state.lines);

// --- The store outside React: subscribe() is a plain function — no component, no hook. ---
if (env.isDev) {
  useCartStore.subscribe((state, previous) => {
    if (state.lines !== previous.lines) {
      logger.debug(`[cart] ${selectCount(state)} items · ${formatPrice(selectSubtotal(state))}`);
    }
  });
}
