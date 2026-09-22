/**
 * @vitest-environment jsdom
 *
 * Only the persistence tests need a DOM, and only for `localStorage`. Everything
 * else here — reducers, thunks, selectors — runs perfectly well in plain Node,
 * which is the point: a store is testable without React.
 */
import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { inventoryApi } from '../api/inventoryApi';
import type { Product, ProductListResponse } from '../types';
import filtersReducer, { lowStockToggled, searchChanged } from './filters';
import inventoryReducer, {
  loadInventory,
  saveStock,
  selectUnitsOnPage,
  selectVisibleIds,
  rowSelectionToggled,
} from './inventory';
import recentReducer, { RECENT_KEY, inspected, loadRecent } from './recent';
import { signedOut } from './session';
import type { ThunkExtra } from './extra';

const product = (id: number, stock: number, title = `P${id}`): Product => ({
  id,
  title,
  description: '',
  category: 'beauty',
  price: 10,
  discountPercentage: 0,
  rating: 4,
  stock,
  thumbnail: '',
});

const PAGE: ProductListResponse = {
  products: [product(1, 5), product(2, 50), product(3, 19)],
  total: 3,
  skip: 0,
  limit: 12,
};

/**
 * A REAL store with a FAKE API. No React, no jsdom, no mock of the module
 * graph — `extra` is a constructor argument, so the test simply passes a
 * different one. This is the whole reason Lab 2 wired the services in that way.
 */
function makeStore(extra: ThunkExtra) {
  return configureStore({
    // The SAME reducer map as src/store/index.ts. It has to be: the thunks are
    // typed against `RootState`, so a test store missing a slice would not
    // accept them — TypeScript catching a test that does not test the real app.
    reducer: {
      filters: filtersReducer,
      inventory: inventoryReducer,
      recent: recentReducer,
      [inventoryApi.reducerPath]: inventoryApi.reducer,
    },
    middleware: (getDefault) => getDefault({ thunk: { extraArgument: extra } }),
  });
}

const okApi = (): ThunkExtra => ({
  listProducts: vi.fn().mockResolvedValue(PAGE),
  updateProduct: vi.fn().mockImplementation((id: number, patch: { stock?: number }) =>
    Promise.resolve(product(Number(id), patch.stock ?? 0)),
  ),
});

describe('filters reducer', () => {
  it('resets to page 1 whenever a filter changes', () => {
    const before = {
      q: '', category: '', lowStockOnly: false,
      sortBy: 'title' as const, order: 'asc' as const, page: 4, delayMs: 0,
    };
    expect(filtersReducer(before, searchChanged('lip')).page).toBe(0);
    expect(filtersReducer(before, searchChanged('lip')).q).toBe('lip');
  });

  it('is emptied by an action it does not own', () => {
    const dirty = filtersReducer(undefined, searchChanged('lip'));
    expect(filtersReducer(dirty, signedOut()).q).toBe('');
  });
});

describe('loadInventory', () => {
  it('walks idle → loading → ready and normalises the page', async () => {
    const store = makeStore(okApi());
    expect(store.getState().inventory.status).toBe('idle');

    const promise = store.dispatch(loadInventory(store.getState().filters));
    expect(store.getState().inventory.status).toBe('loading');

    await promise;
    const state = store.getState().inventory;
    expect(state.status).toBe('ready');
    expect(state.ids).toEqual([1, 2, 3]);
    expect(state.entities[2]?.stock).toBe(50);
    expect(state.total).toBe(3);
  });

  it('refuses a second identical request while one is in flight (condition)', async () => {
    const extra = okApi();
    const store = makeStore(extra);
    const filters = store.getState().filters;

    const first = store.dispatch(loadInventory(filters));
    const second = store.dispatch(loadInventory(filters));
    await Promise.all([first, second]);

    expect(extra.listProducts).toHaveBeenCalledTimes(1);
  });

  it('keeps the ApiError out of the store and the message in it', async () => {
    const store = makeStore({
      ...okApi(),
      listProducts: vi.fn().mockRejectedValue(new Error('boom')),
    });

    await store.dispatch(loadInventory(store.getState().filters));
    const { status, error } = store.getState().inventory;

    expect(status).toBe('error');
    expect(error?.message).toBe('boom');
    // The proof that rejectWithValue(toErrorInfo(...)) did its job.
    expect(error).toEqual(expect.objectContaining({ code: 'CLIENT', status: 0 }));
    expect(JSON.parse(JSON.stringify(error))).toEqual(error);
  });
});

describe('saveStock — optimistic, with rollback', () => {
  let store: ReturnType<typeof makeStore>;

  beforeEach(async () => {
    store = makeStore(okApi());
    await store.dispatch(loadInventory(store.getState().filters));
  });

  it('writes the new value before the request resolves, and keeps it', async () => {
    const promise = store.dispatch(saveStock({ id: 1, stock: 42 }));

    expect(store.getState().inventory.entities[1]?.stock).toBe(42);
    expect(store.getState().inventory.rows[1]?.status).toBe('saving');

    await promise;
    expect(store.getState().inventory.entities[1]?.stock).toBe(42);
    expect(store.getState().inventory.rows[1]).toBeUndefined();
  });

  it('puts the old value back when the server refuses', async () => {
    const failing = makeStore({
      ...okApi(),
      updateProduct: vi.fn().mockRejectedValue(new Error("Product with id '1' not found")),
    });
    await failing.dispatch(loadInventory(failing.getState().filters));

    await failing.dispatch(saveStock({ id: 1, stock: 999 }));

    expect(failing.getState().inventory.entities[1]?.stock).toBe(5);
    expect(failing.getState().inventory.rows[1]?.status).toBe('error');
    expect(failing.getState().inventory.rows[1]?.error).toContain('not found');
  });
});

describe('selectors', () => {
  it('narrows to low stock, and memoises', async () => {
    const store = makeStore(okApi());
    await store.dispatch(loadInventory(store.getState().filters));

    expect(selectVisibleIds(store.getState())).toEqual([1, 2, 3]);
    expect(selectUnitsOnPage(store.getState())).toBe(74);

    // Same state in, SAME ARRAY out — which is what stops useSelector looping.
    expect(selectVisibleIds(store.getState())).toBe(selectVisibleIds(store.getState()));

    store.dispatch(lowStockToggled());
    expect(selectVisibleIds(store.getState())).toEqual([1, 3]);

    // An action that changes neither input must not rebuild the array.
    const before = selectVisibleIds(store.getState());
    store.dispatch(rowSelectionToggled(2));
    expect(selectVisibleIds(store.getState())).toBe(before);
  });
});

describe('recent', () => {
  it('is most-recent-first, de-duplicated and capped at eight', () => {
    let state = recentReducer(undefined, inspected(1));
    for (const id of [2, 3, 4, 5, 6, 7, 8, 9]) state = recentReducer(state, inspected(id));
    state = recentReducer(state, inspected(5));

    expect(state.ids[0]).toBe(5);
    expect(state.ids).toHaveLength(8);
    expect(new Set(state.ids).size).toBe(8);
  });

  it('is cleared by the same sign-out action the inventory slice handles', () => {
    const state = recentReducer(undefined, inspected(3));
    expect(recentReducer(state, signedOut()).ids).toEqual([]);
  });

  it('migrates the v1 shape, keeping the ids and dropping the cached titles', () => {
    localStorage.setItem(
      RECENT_KEY,
      JSON.stringify({ recentlyViewed: [{ id: 5, title: 'A name from 2023' }, { id: 6, title: 'Another' }] }),
    );
    expect(loadRecent()).toEqual({ ids: [5, 6] });
  });

  it('survives every shape it could possibly be handed', () => {
    localStorage.setItem(RECENT_KEY, 'not json at all');
    expect(loadRecent()).toEqual({ ids: [] });

    localStorage.setItem(RECENT_KEY, JSON.stringify({ version: 99, ids: [1] }));
    expect(loadRecent()).toEqual({ ids: [] });

    localStorage.setItem(RECENT_KEY, JSON.stringify({ version: 2, ids: [1, 'nope', 3] }));
    expect(loadRecent()).toEqual({ ids: [1, 3] });

    localStorage.removeItem(RECENT_KEY);
    expect(loadRecent()).toEqual({ ids: [] });
  });
});
