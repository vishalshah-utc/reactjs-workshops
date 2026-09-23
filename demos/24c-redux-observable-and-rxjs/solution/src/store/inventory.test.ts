/**
 * @vitest-environment jsdom
 *
 * The REDUCER tests, unchanged in spirit from Demo 24b — which is the point.
 * Replacing the entire effect layer did not invalidate a single assertion
 * about what the state means; only the actions that carry it changed name.
 *
 * Only the persistence tests need a DOM, and only for `localStorage`.
 */
import { describe, expect, it } from 'vitest';
import type { Product } from '../types';
import feedReducer, { feedPauseToggled, feedStatusChanged } from './feed';
import filtersReducer, { lowStockToggled, searchChanged } from './filters';
import inventoryReducer, {
  feedFlashCleared,
  feedTicked,
  inventoryFailed,
  inventoryLoaded,
  inventoryLoading,
  rowSelectionToggled,
  selectUnitsOnPage,
  selectVisibleIds,
  stockSaveFailed,
  stockSaveRequested,
  stockSaveSucceeded,
} from './inventory';
import recentReducer, { RECENT_KEY, inspected, loadRecent } from './recent';
import { rootReducer, type RootState } from './rootReducer';
import { signedOut } from './session';

const product = (id: number, stock: number): Product => ({
  id,
  title: `P${id}`,
  description: '',
  category: 'beauty',
  price: 10,
  discountPercentage: 0,
  rating: 4,
  stock,
  thumbnail: '',
});

const LOADED = inventoryLoaded({
  products: [product(1, 5), product(2, 50), product(3, 19)],
  total: 3,
  page: 0,
});

/** Fold actions through the real root reducer — no hand-written state shape. */
const stateAfter = (...actions: Parameters<typeof rootReducer>[1][]): RootState =>
  actions.reduce<RootState>((state, action) => rootReducer(state, action), rootReducer(undefined, { type: '@@INIT' }));

describe('filters reducer', () => {
  it('resets to page 1 whenever a filter changes', () => {
    const before = {
      q: '',
      category: '',
      lowStockOnly: false,
      sortBy: 'title' as const,
      order: 'asc' as const,
      page: 4,
      delayMs: 0,
    };
    expect(filtersReducer(before, searchChanged('lip')).page).toBe(0);
    expect(filtersReducer(before, searchChanged('lip')).q).toBe('lip');
  });
});

describe('the load, without a thunk', () => {
  it('walks idle → loading → ready and normalises the page', () => {
    let state = inventoryReducer(undefined, inventoryLoading());
    expect(state.status).toBe('loading');

    state = inventoryReducer(state, LOADED);
    expect(state.status).toBe('ready');
    expect(state.ids).toEqual([1, 2, 3]);
    expect(state.entities[2]?.stock).toBe(50);
    expect(state.total).toBe(3);
  });

  it('holds a SERIALISABLE error — the one rule an epic does not relax', () => {
    const error = { message: 'boom', status: 0, code: 'CLIENT', isRetryable: true };
    const state = inventoryReducer(undefined, inventoryFailed(error));

    expect(state.status).toBe('error');
    expect(JSON.parse(JSON.stringify(state.error))).toEqual(state.error);
  });

  it('has no request-id bookkeeping left to get wrong', () => {
    const state = inventoryReducer(undefined, LOADED) as unknown as Record<string, unknown>;
    // `switchMap` made these unnecessary. If they come back, so did the bug.
    expect(state).not.toHaveProperty('currentRequestId');
    expect(state).not.toHaveProperty('pendingKey');
  });
});

describe('the optimistic write', () => {
  it('writes the new value on REQUEST, not on success', () => {
    let state = inventoryReducer(undefined, LOADED);
    state = inventoryReducer(state, stockSaveRequested({ id: 1, stock: 42 }));

    expect(state.entities[1]?.stock).toBe(42);
    expect(state.rows[1]).toEqual({ status: 'saving', previousStock: 5 });

    state = inventoryReducer(state, stockSaveSucceeded({ id: 1, product: product(1, 42) }));
    expect(state.rows[1]).toBeUndefined();
  });

  it('puts the old value back, with the server’s own words', () => {
    let state = inventoryReducer(undefined, LOADED);
    state = inventoryReducer(state, stockSaveRequested({ id: 1, stock: 999 }));
    state = inventoryReducer(
      state,
      stockSaveFailed({
        id: 1,
        error: { message: "Product with id '9999' not found", status: 404, code: 'HTTP_404', isRetryable: false },
      }),
    );

    expect(state.entities[1]?.stock).toBe(5);
    expect(state.rows[1]?.error).toContain('not found');
  });
});

describe('the live feed', () => {
  it('applies a tick to the entity adapter and flags the direction', () => {
    let state = inventoryReducer(undefined, LOADED);
    state = inventoryReducer(state, feedTicked({ at: 1, changes: [{ id: 1, stock: 99 }, { id: 3, stock: 2 }] }));

    expect(state.entities[1]?.stock).toBe(99);
    expect(state.flashes).toEqual({ 1: 'up', 3: 'down' });
    // Untouched rows keep the SAME object, which is what stops them re-rendering.
    expect(state.entities[2]).toBe(inventoryReducer(undefined, LOADED).entities[2]);

    state = inventoryReducer(state, feedFlashCleared([1, 3]));
    expect(state.flashes).toEqual({});
  });

  it('refuses to overwrite a row the user is saving', () => {
    let state = inventoryReducer(undefined, LOADED);
    state = inventoryReducer(state, stockSaveRequested({ id: 1, stock: 42 }));
    state = inventoryReducer(state, feedTicked({ at: 2, changes: [{ id: 1, stock: 7 }] }));

    // The user's intention outranks the server's opinion about a number they
    // are in the middle of changing.
    expect(state.entities[1]?.stock).toBe(42);
    expect(state.flashes[1]).toBeUndefined();
  });

  it('carries the server’s timestamp so the reducer never reads a clock', () => {
    const state = feedReducer(undefined, feedTicked({ at: 1_700_000_000_000, changes: [{ id: 1, stock: 3 }] }));
    expect(state.lastMessageAt).toBe(1_700_000_000_000);
    expect(state.messages).toBe(1);
  });

  it('counts a reconnect exactly once per drop, and pauses with a boolean', () => {
    let state = feedReducer(undefined, feedStatusChanged('live'));
    state = feedReducer(state, feedStatusChanged('reconnecting'));
    state = feedReducer(state, feedStatusChanged('reconnecting'));
    expect(state.reconnects).toBe(1);

    state = feedReducer(state, feedStatusChanged('live'));
    state = feedReducer(state, feedStatusChanged('reconnecting'));
    expect(state.reconnects).toBe(2);

    expect(feedReducer(state, feedPauseToggled()).paused).toBe(true);
  });
});

describe('selectors', () => {
  it('narrows to low stock, and memoises', () => {
    const ready = stateAfter(LOADED);
    expect(selectVisibleIds(ready)).toEqual([1, 2, 3]);
    expect(selectUnitsOnPage(ready)).toBe(74);
    expect(selectVisibleIds(ready)).toBe(selectVisibleIds(ready));

    const low = stateAfter(LOADED, lowStockToggled());
    expect(selectVisibleIds(low)).toEqual([1, 3]);

    // An action that changes neither input must not rebuild the array.
    const before = selectVisibleIds(low);
    expect(selectVisibleIds(stateAfter(LOADED, lowStockToggled(), rowSelectionToggled(2)))).toEqual(before);
  });
});

describe('recent', () => {
  it('is most-recent-first, de-duplicated and capped at eight', () => {
    let state = recentReducer(undefined, inspected(1));
    for (const id of [2, 3, 4, 5, 6, 7, 8, 9]) state = recentReducer(state, inspected(id));
    state = recentReducer(state, inspected(5));

    expect(state.ids[0]).toBe(5);
    expect(state.ids).toHaveLength(8);
  });

  it('migrates the v1 shape, keeping the ids and dropping the cached titles', () => {
    localStorage.setItem(
      RECENT_KEY,
      JSON.stringify({ recentlyViewed: [{ id: 5, title: 'A name from 2023' }, { id: 6 }] }),
    );
    expect(loadRecent()).toEqual({ ids: [5, 6] });

    localStorage.setItem(RECENT_KEY, 'not json at all');
    expect(loadRecent()).toEqual({ ids: [] });
    localStorage.removeItem(RECENT_KEY);
  });
});

describe('one action, several slices', () => {
  it('sign-out resets filters, inventory, recent AND the feed', () => {
    const dirty = stateAfter(searchChanged('lip'), LOADED, inspected(3), feedStatusChanged('live'));
    const clean = rootReducer(dirty, signedOut());

    expect(clean.filters.q).toBe('');
    expect(clean.inventory.ids).toEqual([]);
    expect(clean.recent.ids).toEqual([]);
    expect(clean.feed.status).toBe('idle');
  });
});
