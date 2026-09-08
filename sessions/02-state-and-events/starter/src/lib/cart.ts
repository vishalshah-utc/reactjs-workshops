import type { CartAction, CartState } from '@/types';

export const initialCartState: CartState = { lines: [], promoCode: null };

/**
 * TODO(lab-4.1): Write the cart reducer.
 *
 * A reducer is `(state, action) => newState`. Three rules, all of which the
 * finished version obeys:
 *
 *   1. PURE — same state + same action always gives the same result. No fetch,
 *      no Date.now(), no Math.random().
 *   2. NEVER MUTATES — every branch returns a NEW object. `state.lines.push()`
 *      changes the array React is still holding, so `Object.is(prev, next)`
 *      stays true and React skips the render. That is Lab 1's bug all over again.
 *   3. EXHAUSTIVE — handle every case in `CartAction` (see src/types.ts).
 *
 * Cases to handle:
 *   cart/add          add a line, or bump quantity if the product is already in
 *   cart/remove       drop the line for that productId
 *   cart/setQuantity  set it — and REMOVE the line when quantity <= 0
 *   cart/applyPromo   store the code, trimmed and uppercased
 *   cart/clearPromo   set promoCode back to null
 *   cart/clear        back to initialCartState
 *
 * Guide, Lab 4 step A.
 */
export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'cart/add': {
      const quantity = action.quantity ?? 1;
      return { ...state, lines: [...state.lines, { productId: action.productId, quantity }] };
    }

    // TODO(lab-4.1): the other five cases. Until they exist, every other
    // action falls through to `default` and silently does nothing — which is
    // exactly what "remove" appears to do right now. Try it.
    default:
      return state;
  }
}
