import { listProducts, updateProduct } from '../api/services/products';

/**
 * The thunk `extra` argument: the API layer, handed to every thunk.
 *
 * A thunk could `import { listProducts }` directly — and in a small app that is
 * fine. Passing it in instead buys two things: a test can hand the store a fake
 * without `vi.mock` touching the module graph (Lab 7), and the dependency is
 * declared in ONE place rather than implied by whatever each thunk imported.
 *
 * Note what is NOT here: axios, endpoints, ApiError. The store talks to
 * `api/services`, which is the boundary Demos 5–8 built.
 */
export const extra = { listProducts, updateProduct };

export type ThunkExtra = typeof extra;
