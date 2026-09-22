import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../api/services/products', () => ({ listProducts: vi.fn(), updateProduct: vi.fn() }));

import { INVENTORY_PERSIST_VERSION, INVENTORY_STORAGE_KEY, useInventoryStore } from './index';
import { resetUserScopedStores } from '../registry';

/**
 * Persistence is the one part of a store you cannot test by calling actions:
 * the interesting behaviour happens at REHYDRATION, against whatever shape is
 * already in the browser. `rehydrate()` is the seam — it re-reads storage and
 * runs `migrate` and `merge`, so a test can write an old payload by hand and
 * watch the upgrade happen.
 */
describe('inventory persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    resetUserScopedStores();
  });

  it('writes only the `recent` slice — never the catalogue', async () => {
    useInventoryStore.getState().inspect(7);
    useInventoryStore.getState().upsertProduct({
      id: 7,
      title: 'Kept out of storage',
      description: '',
      category: 'beauty',
      price: 1,
      discountPercentage: 0,
      rating: 5,
      stock: 3,
      thumbnail: 't.png',
    });

    const raw = JSON.parse(localStorage.getItem(INVENTORY_STORAGE_KEY) ?? '{}');
    expect(raw.version).toBe(INVENTORY_PERSIST_VERSION);
    expect(raw.state).toEqual({ recent: { ids: [7] } });
    // The products are the server's. Nothing about them is on disk.
    expect(JSON.stringify(raw)).not.toContain('Kept out of storage');
  });

  it('migrates a version 1 payload instead of throwing it away', async () => {
    localStorage.setItem(
      INVENTORY_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        state: { recentlyViewed: [{ id: 4, title: 'A title that went stale' }, { id: 9, title: 'Another' }] },
      }),
    );

    await useInventoryStore.persist.rehydrate();

    expect(useInventoryStore.getState().recent.ids).toEqual([4, 9]);
  });

  it('survives a corrupted payload — it does not crash, and it does not wipe state', async () => {
    useInventoryStore.getState().inspect(11);
    localStorage.setItem(INVENTORY_STORAGE_KEY, '{ not json');

    // `onRehydrateStorage`'s error branch runs; the store is left exactly as it
    // was. A failed read is not a reason to throw away what is already in memory.
    await expect(useInventoryStore.persist.rehydrate()).resolves.toBeUndefined();

    expect(useInventoryStore.getState().recent.ids).toEqual([11]);
    expect(typeof useInventoryStore.getState().inspect).toBe('function');
  });
});
