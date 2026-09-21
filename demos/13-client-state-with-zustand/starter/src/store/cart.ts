/**
 * The cart store. There is no cart today — the header's badge is a hardcoded 3
 * and every "Add to cart" button is dead. The RULES already exist, though:
 * cartLinesReducer in src/lib/cartMath.ts (Demo 12). The store gives them a home.
 */
// TODO(lab-2.1): create<CartState>()(…) — lines, isOpen; add / setQty / remove / clear call cartLinesReducer from lib/cartMath; open / close; selectCount and selectSubtotal as SELECTORS over lineCount / subtotal
// TODO(lab-3.1): persist(…, { name: 'shopscope.cart', partialize: (s) => ({ lines: s.lines }), version: 1 })
// TODO(lab-4.5): in dev, useCartStore.subscribe(...) and log every change to the lines — the store outside React
export {};
