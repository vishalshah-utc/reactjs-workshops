/**
 * @vitest-environment jsdom
 *
 * TODO(lab-7.2): the reducer tests — and the point they make.
 *
 * Replacing the entire effect layer must not invalidate a single assertion
 * about what the state MEANS. Only the actions that carry it changed name, so
 * most of these are Demo 24b's tests with `loadInventory.fulfilled` rewritten
 * as `inventoryLoaded`. A reducer is `(state, action) => state`; call it.
 *
 * Fold actions through `rootReducer` for the cross-slice ones, and use the
 * slice reducer directly for the rest. Only the persistence tests need jsdom,
 * and only for `localStorage`.
 *
 * The two that are new today are worth writing carefully:
 *  - a `feed/ticked` must NOT overwrite a row that is mid-save, because the
 *    user's intention outranks the server's opinion about a number they are
 *    already changing;
 *  - `feed` must record `action.payload.at`, the SERVER's clock, never
 *    `Date.now()` — a reducer that reads a clock cannot be replayed.
 */
import { describe, it } from 'vitest';

describe('filters reducer', () => {
  it.todo('resets to page 1 whenever a filter changes');
});

describe('the load, without a thunk', () => {
  it.todo('walks idle → loading → ready and normalises the page');
  it.todo('holds a SERIALISABLE error');
  it.todo('has no requestId or pendingKey left to get wrong');
});

describe('the optimistic write', () => {
  it.todo('writes the new value on REQUEST, not on success');
  it.todo('puts the old value back, with the server’s own words');
});

describe('the live feed', () => {
  it.todo('applies a tick to the entity adapter and flags the direction');
  it.todo('refuses to overwrite a row the user is saving');
  it.todo('carries the server’s timestamp so the reducer never reads a clock');
  it.todo('counts a reconnect exactly once per drop, and pauses with a boolean');
});

describe('selectors', () => {
  it.todo('narrows to low stock, and returns the SAME array for the same state');
});

describe('recent', () => {
  it.todo('is most-recent-first, de-duplicated and capped at eight');
  it.todo('migrates the v1 shape, keeping the ids and dropping the cached titles');
});

describe('one action, several slices', () => {
  it.todo('sign-out resets filters, inventory, recent AND the feed');
});
