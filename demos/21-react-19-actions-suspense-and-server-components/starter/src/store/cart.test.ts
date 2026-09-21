import { beforeEach, describe, expect, it } from 'vitest';
import { selectCount, selectSubtotal, useCartStore } from './cart';

const mascara = { id: 1, title: 'Mascara', price: 10, thumbnail: 'm.png' };
const shirt = { id: 2, title: 'Shirt', price: 25, thumbnail: 's.png' };

/**
 * A Zustand store is a plain object with a `getState`, a `setState` and a
 * `subscribe`. `useCartStore(...)` is the React BINDING to it — and none of
 * these tests need the binding, so none of them render anything.
 */
describe('useCartStore', () => {
  beforeEach(() => {
    // THE line that makes these tests independent. The store is a module
    // singleton: it is created once for the whole file and every test shares
    // it, so each one must start from a known state.
    //
    // A partial setState MERGES, which is what we want — replacing outright
    // (`setState(…, true)`) would delete `add`, `remove` and the rest.
    useCartStore.setState({ lines: [], isOpen: false });
  });

  it('adds a product and opens the drawer in one update', () => {
    useCartStore.getState().add(mascara);

    const state = useCartStore.getState();
    expect(state.lines).toEqual([{ productId: 1, title: 'Mascara', price: 10, thumbnail: 'm.png', qty: 1 }]);
    // Adding opens the drawer. One `set`, so subscribers render once, not twice.
    expect(state.isOpen).toBe(true);
  });

  it('merges a repeat add into the existing line', () => {
    const { add } = useCartStore.getState();
    add(mascara, 2);
    add(mascara, 3);

    expect(useCartStore.getState().lines).toHaveLength(1);
    expect(useCartStore.getState().lines[0].qty).toBe(5);
  });

  it('removes a line when its quantity reaches zero', () => {
    useCartStore.getState().add(mascara);
    useCartStore.getState().setQty(1, 0);

    expect(useCartStore.getState().lines).toEqual([]);
  });

  it('exposes count and subtotal as SELECTORS, not as state', () => {
    const { add } = useCartStore.getState();
    add(mascara, 2);
    add(shirt, 1);

    // Derived values cannot drift, because there is nothing to drift from.
    expect(selectCount(useCartStore.getState())).toBe(3);
    expect(selectSubtotal(useCartStore.getState())).toBe(45);
  });

  it('notifies subscribers exactly once per action', () => {
    const seen: number[] = [];
    const unsubscribe = useCartStore.subscribe((state) => seen.push(state.lines.length));

    useCartStore.getState().add(mascara);
    useCartStore.getState().add(shirt);
    unsubscribe();
    useCartStore.getState().add(mascara);

    expect(seen).toEqual([1, 2]); // and nothing after unsubscribe
  });

  it('persists the lines but NOT the drawer', () => {
    useCartStore.getState().add(mascara);

    const stored = JSON.parse(localStorage.getItem('shopscope.cart') ?? '{}');
    expect(stored.state.lines).toHaveLength(1);
    // `partialize` keeps `isOpen` out: a reload must not reopen the drawer.
    expect(stored.state).not.toHaveProperty('isOpen');
  });
});
