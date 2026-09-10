import type { CartAction, CartState } from '@/types';

export const initialCartState: CartState = { lines: [], promoCode: null };

/**
 * The cart reducer.
 *
 * Three rules make a reducer worth having, and all three are visible below:
 *
 *  1. **Pure.** Same state plus same action always produces the same result.
 *     No fetch, no Date.now(), no Math.random(), no localStorage. Anything
 *     unpredictable belongs in the caller, not in here.
 *  2. **Never mutates.** Every branch returns a NEW object. `state.lines.push()`
 *     would change the array React is still holding, so `Object.is(prev, next)`
 *     stays true and React skips the re-render. That is Lab 1's bug, and it
 *     comes back the moment anyone gets casual in here.
 *  3. **Exhaustive.** The `never` in the default branch means adding a new
 *     action type to `CartAction` without handling it is a COMPILE error, not
 *     a silently ignored click.
 */
export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'cart/add': {
      const quantity = action.quantity ?? 1;
      const existing = state.lines.find((line) => line.productId === action.product.id);

      // Adding something already in the cart bumps the quantity rather than
      // creating a second line — which is what every shopper expects.
      //
      // Note the snapshot is NOT refreshed on a repeat add. The price the
      // customer first saw is the price they keep.
      if (existing) {
        return {
          ...state,
          lines: state.lines.map((line) =>
            line.productId === action.product.id
              ? { ...line, quantity: line.quantity + quantity }
              : line,
          ),
        };
      }
      return {
        ...state,
        lines: [...state.lines, { productId: action.product.id, quantity, product: action.product }],
      };
    }

    case 'cart/remove':
      return { ...state, lines: state.lines.filter((line) => line.productId !== action.productId) };

    case 'cart/setQuantity': {
      // Setting a quantity to zero removes the line. Handling it here rather
      // than in the component means every caller gets the behaviour for free
      // and none of them has to remember.
      if (action.quantity <= 0) {
        return { ...state, lines: state.lines.filter((line) => line.productId !== action.productId) };
      }
      return {
        ...state,
        lines: state.lines.map((line) =>
          line.productId === action.productId ? { ...line, quantity: action.quantity } : line,
        ),
      };
    }

    case 'cart/applyPromo':
      return { ...state, promoCode: action.code.trim().toUpperCase() };

    case 'cart/clearPromo':
      return { ...state, promoCode: null };

    case 'cart/clear':
      return initialCartState;

    default: {
      // If you add a case to CartAction and forget it here, TypeScript refuses
      // to assign the action to `never` and the build fails. Free safety net.
      const unhandled: never = action;
      return unhandled;
    }
  }
}
