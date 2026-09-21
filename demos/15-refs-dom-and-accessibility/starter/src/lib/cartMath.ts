import type { CartLine, Product } from '../types';

/** `add` reads exactly these four fields of a product — a full Product qualifies, and so does a smaller object. */
export type CartLineProduct = Pick<Product, 'id' | 'title' | 'price' | 'thumbnail'>;

/** Everything that can happen to the cart's lines. The rules live in the reducer, not in the buttons. */
export type CartAction =
  | { type: 'add'; product: CartLineProduct; qty?: number }
  | { type: 'setQty'; productId: number; qty: number }
  | { type: 'remove'; productId: number }
  | { type: 'clear' };

/**
 * The cart's rules as a PURE function over CartLine[] — no React, no store. A reducer is just
 * (state, action) => newState; useReducer is one home for it, Demo 13's Zustand store is another.
 */
export function cartLinesReducer(lines: CartLine[], action: CartAction): CartLine[] {
  switch (action.type) {
    case 'add': {
      const { product, qty = 1 } = action;
      const existing = lines.find((line) => line.productId === product.id);
      if (existing) {
        return lines.map((line) => (line.productId === product.id ? { ...line, qty: line.qty + qty } : line));
      }
      // A SNAPSHOT of the product, not a reference: the cart must not break if the catalogue changes.
      return [...lines, { productId: product.id, title: product.title, price: product.price, thumbnail: product.thumbnail, qty }];
    }
    case 'setQty':
      // The RULE "zero means remove" lives here, once — not in every button that changes a quantity.
      return action.qty <= 0
        ? lines.filter((line) => line.productId !== action.productId)
        : lines.map((line) => (line.productId === action.productId ? { ...line, qty: action.qty } : line));
    case 'remove':
      return lines.filter((line) => line.productId !== action.productId);
    case 'clear':
      return [];
    default: {
      const unhandled: never = action; // exhaustive: a new action type without a case fails to compile here
      throw new Error(`Unhandled cart action: ${JSON.stringify(unhandled)}`);
    }
  }
}

// --- Derived values are FUNCTIONS of the lines. Store them too and you have two sources of truth. ---

export const lineCount = (lines: CartLine[]) => lines.reduce((n, line) => n + line.qty, 0);
export const subtotal = (lines: CartLine[]) => lines.reduce((n, line) => n + line.qty * line.price, 0);
