import { describe, it } from 'vitest';

/**
 * Persistence is the one part of a store you cannot test by calling actions:
 * the interesting behaviour happens at REHYDRATION, against whatever shape is
 * already in the browser.
 *
 * TODO(lab-6.5): `useInventoryStore.persist.rehydrate()` is the seam — it
 * re-reads storage and runs `migrate` and `merge`. Write a version 1 payload
 * into `localStorage` by hand and watch it come back as version 2. Then write
 * rubbish into the same key and prove the store neither throws nor wipes what
 * is already in memory.
 */
describe('inventory persistence', () => {
  it.todo('writes only the `recent` slice — never the catalogue');
  it.todo('migrates a version 1 payload instead of throwing it away');
  it.todo('survives a corrupted payload — it does not crash, and it does not wipe state');
});
