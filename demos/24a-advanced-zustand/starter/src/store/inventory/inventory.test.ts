import { describe, it } from 'vitest';

/**
 * A Zustand store is a plain object with `getState`, `setState` and
 * `subscribe`. `useInventoryStore(…)` is only the React BINDING to it — so none
 * of these tests renders anything, and none of them needs Testing Library.
 *
 * TODO(lab-3.4): mock `../../api/services/products` with `vi.mock`, then drive
 * the store directly. `beforeEach` must put it back to a known state — it is a
 * module singleton shared by every test in the file. The race test needs a
 * DEFERRED promise (one you resolve by hand), because "two requests overlap" is
 * not something you can arrange with `await`.
 *
 * TODO(lab-4.3): the rollback. Assert the optimistic value is visible BEFORE
 * the request settles, and that after a rejection the old value is back and the
 * message is on that row — `toBe`, not `toEqual`, for the memoised selector.
 */
describe('the inventory store', () => {
  it.todo('walks idle → loading → ready and normalises the page');
  it.todo('lands on error with an ApiError, and retry clears it');
  it.todo('DISCARDS a slow earlier response when a newer request has started');
  it.todo('memoises the visible list — same inputs, same array reference');
  it.todo('rolls an optimistic stock edit back when the server rejects it');
  it.todo('keeps the winners and rolls back the losers of a bulk restock, then undoes both');
  it.todo('caps recently inspected at eight, most recent first, no duplicates');
  it.todo('reset MERGES, so the actions survive');
});
