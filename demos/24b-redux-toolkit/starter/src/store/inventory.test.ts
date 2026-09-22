import { describe, it } from 'vitest';

/**
 * TODO(lab-7.2): tests for the reducers, the thunks and the selectors.
 *
 * The reason this file needs no jsdom, no Testing Library and no `vi.mock` is
 * the shape you built in Labs 1 and 2:
 *  - a reducer is `(state, action) => state`, so it is tested by calling it;
 *  - a thunk reaches the API through `extra`, so a REAL store with a FAKE
 *    `extraArgument` is the whole test harness;
 *  - a selector is a function of state.
 *
 * Turn each `it.todo` below into a real test. `npm test` is green now because
 * a todo is not a failure — it will stay green, with more in it, as you go.
 */
describe('filters reducer', () => {
  it.todo('resets to page 1 whenever a filter changes');
  it.todo('is emptied by an action it does not own (signedOut)');
});

describe('loadInventory', () => {
  it.todo('walks idle → loading → ready and normalises the page');
  it.todo('refuses a second identical request while one is in flight (condition)');
  it.todo('keeps the ApiError out of the store and the message in it');
});

describe('saveStock — optimistic, with rollback', () => {
  it.todo('writes the new value before the request resolves, and keeps it');
  it.todo('puts the old value back when the server refuses');
});

describe('selectors', () => {
  it.todo('narrows to low stock, and returns the SAME array for the same state');
});

describe('recent', () => {
  it.todo('is most-recent-first, de-duplicated and capped at eight');
  it.todo('migrates the v1 bare array to the v2 envelope');
});
