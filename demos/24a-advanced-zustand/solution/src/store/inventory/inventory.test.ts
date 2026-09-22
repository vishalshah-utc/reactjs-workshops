import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../lib/ApiError';
import type { Product, ProductListResponse } from '../../types';

// The store's ONLY dependency on the outside world is the products service.
// Mock that and the whole store is a pure, synchronous-ish object you can drive
// from a test — no React, no render, no jsdom beyond localStorage.
vi.mock('../../api/services/products', () => ({
  listProducts: vi.fn(),
  updateProduct: vi.fn(),
}));

import { listProducts, updateProduct } from '../../api/services/products';
import { useInventoryStore } from './index';
import { resetVisibleIdsCache, selectVisibleIds } from './selectors';
import { resetUserScopedStores } from '../registry';

const mockedList = vi.mocked(listProducts);
const mockedUpdate = vi.mocked(updateProduct);

const product = (id: number, stock: number, title = `P${id}`): Product => ({
  id,
  title,
  description: '',
  category: 'beauty',
  price: 10,
  discountPercentage: 0,
  rating: 4,
  stock,
  thumbnail: 't.png',
});

const page = (products: Product[], total = products.length): ProductListResponse => ({
  products,
  total,
  skip: 0,
  limit: 12,
});

/** A promise you resolve by hand — the only way to make two requests overlap on purpose. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('the inventory store', () => {
  beforeEach(() => {
    // A store is a module singleton: every test in this file shares one. Start
    // each from the same place — and use the app's own reset, so the test also
    // proves that `resetUserScopedStores()` really does clear everything.
    resetUserScopedStores();
    resetVisibleIdsCache();
  });

  it('walks idle → loading → ready and normalises the page', async () => {
    mockedList.mockResolvedValue(page([product(1, 5), product(2, 30)], 194));

    const pending = useInventoryStore.getState().fetchPage(0);
    expect(useInventoryStore.getState().status).toBe('loading');

    await pending;

    const state = useInventoryStore.getState();
    expect(state.status).toBe('ready');
    expect(state.ids).toEqual([1, 2]);
    expect(state.entities[2].stock).toBe(30);
    expect(state.total).toBe(194);
    expect(state.error).toBeNull();
  });

  it('lands on error with an ApiError, and retry clears it', async () => {
    mockedList.mockRejectedValueOnce(new ApiError({ message: 'Gateway timeout', status: 504, code: 'HTTP_504' }));
    await useInventoryStore.getState().fetchPage(0);

    expect(useInventoryStore.getState().status).toBe('error');
    expect(useInventoryStore.getState().error?.status).toBe(504);

    mockedList.mockResolvedValueOnce(page([product(1, 5)]));
    await useInventoryStore.getState().fetchPage();
    expect(useInventoryStore.getState().status).toBe('ready');
    expect(useInventoryStore.getState().error).toBeNull();
  });

  it('DISCARDS a slow earlier response when a newer request has started', async () => {
    const slow = deferred<ProductListResponse>();
    const fast = deferred<ProductListResponse>();
    mockedList.mockReturnValueOnce(slow.promise).mockReturnValueOnce(fast.promise);

    const first = useInventoryStore.getState().fetchPage(0); // request 1 — will answer LAST
    const second = useInventoryStore.getState().fetchPage(1); // request 2 — answers FIRST

    fast.resolve(page([product(9, 1)], 194));
    await second;
    expect(useInventoryStore.getState().ids).toEqual([9]);

    // The stale answer arrives now. It must change nothing.
    slow.resolve(page([product(1, 5), product(2, 6)], 194));
    await first;

    expect(useInventoryStore.getState().ids).toEqual([9]);
    expect(useInventoryStore.getState().status).toBe('ready');
  });

  it('memoises the visible list — same inputs, same array reference', async () => {
    mockedList.mockResolvedValue(page([product(1, 5), product(2, 30)]));
    await useInventoryStore.getState().fetchPage(0);

    const first = selectVisibleIds(useInventoryStore.getState());
    const second = selectVisibleIds(useInventoryStore.getState());
    // Not toEqual — toBe. A new array with the same contents is what makes
    // React 19 complain that getSnapshot is not cached.
    expect(second).toBe(first);

    useInventoryStore.getState().setFilter('lowStockOnly', true);
    const filtered = selectVisibleIds(useInventoryStore.getState());
    expect(filtered).toEqual([1]);
    expect(filtered).not.toBe(first);
  });

  it('rolls an optimistic stock edit back when the server rejects it', async () => {
    mockedList.mockResolvedValue(page([product(1, 5)]));
    await useInventoryStore.getState().fetchPage(0);

    mockedUpdate.mockRejectedValueOnce(
      new ApiError({ message: "Product with id '1' not found", status: 404, code: 'HTTP_404' }),
    );

    const pending = useInventoryStore.getState().commitStock(1, 99);
    // Optimistic: the new value is on screen BEFORE the request finishes.
    expect(useInventoryStore.getState().entities[1].stock).toBe(99);
    expect(useInventoryStore.getState().rows[1].pending).toBe(true);

    await pending;

    expect(useInventoryStore.getState().entities[1].stock).toBe(5);
    expect(useInventoryStore.getState().rows[1]).toEqual({ pending: false, error: "Product with id '1' not found" });
  });

  it('keeps the winners and rolls back the losers of a bulk restock, then undoes both', async () => {
    mockedList.mockResolvedValue(page([product(1, 5), product(2, 7), product(3, 9)]));
    await useInventoryStore.getState().fetchPage(0);

    mockedUpdate.mockImplementation(async (id) => {
      if (id === 2) throw new ApiError({ message: 'nope', status: 404, code: 'HTTP_404' });
      return product(Number(id), 0);
    });

    useInventoryStore.getState().selectMany([1, 2, 3]);
    await useInventoryStore.getState().bulkRestock(10);

    const afterBulk = useInventoryStore.getState();
    expect(afterBulk.entities[1].stock).toBe(15);
    expect(afterBulk.entities[2].stock).toBe(7); // rolled back
    expect(afterBulk.entities[3].stock).toBe(19);
    expect(afterBulk.bulkReport).toEqual({ attempted: 3, succeeded: [1, 3], failed: [{ id: 2, message: 'nope' }] });

    useInventoryStore.getState().undoBulk();
    const afterUndo = useInventoryStore.getState();
    expect([afterUndo.entities[1].stock, afterUndo.entities[2].stock, afterUndo.entities[3].stock]).toEqual([5, 7, 9]);
    expect(afterUndo.undoSnapshot).toBeNull();
  });

  it('caps recently inspected at eight, most recent first, no duplicates', () => {
    const { inspect } = useInventoryStore.getState();
    for (let id = 1; id <= 10; id += 1) inspect(id);
    inspect(3);

    expect(useInventoryStore.getState().recent.ids).toEqual([3, 10, 9, 8, 7, 6, 5, 4]);
  });

  it('reset MERGES, so the actions survive', () => {
    useInventoryStore.getState().inspect(42);
    resetUserScopedStores();

    const state = useInventoryStore.getState();
    expect(state.recent.ids).toEqual([]);
    // setState(next, true) would have deleted this. It is still a function.
    expect(typeof state.fetchPage).toBe('function');
  });
});
