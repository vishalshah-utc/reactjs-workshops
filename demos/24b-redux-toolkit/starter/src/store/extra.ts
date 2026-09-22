import { listProducts, updateProduct } from '../api/services/products';

/**
 * TODO(lab-2.1): the thunk `extra` argument — the API layer, handed to every
 * thunk instead of imported by each one.
 *
 * It is already the right shape. What Lab 2 does is WIRE it, in
 * `configureStore`'s `thunk: { extraArgument: extra }`, and then reach it from
 * a thunk as `thunkApi.extra`.
 *
 * Note what is NOT here: axios, endpoints, ApiError. The store talks to
 * `api/services`, which is the boundary Demos 5–8 built.
 */
export const extra = { listProducts, updateProduct };

export type ThunkExtra = typeof extra;
