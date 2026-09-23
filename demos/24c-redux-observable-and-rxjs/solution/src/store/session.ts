import { createAction } from '@reduxjs/toolkit';

/**
 * ONE action, several slices.
 *
 * Signing out has to clear the inventory console and the "recently inspected"
 * list, and must NOT touch the cart or the wishlist. In a store built out of
 * `createSlice`, the way to express that is not a `resetEverything()` function
 * that knows about every slice — it is a single action that each slice decides
 * for itself how to answer, in its `extraReducers`.
 *
 * `createAction` with no payload creator is the whole API: it returns a
 * function that produces `{ type: 'session/signedOut' }` and carries a `.type`
 * and a `.match()` type guard.
 */
export const signedOut = createAction('session/signedOut');
