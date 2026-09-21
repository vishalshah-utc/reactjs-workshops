// TODO(lab-3.4): test the Zustand cart store OUTSIDE React — getState()/setState(), with
// useCartStore.setState({ lines: [], isOpen: false }) in beforeEach so the module singleton
// starts each test known. Cover add (and the drawer opening), the merge on a repeat add,
// zero-quantity removal, the selectors, subscribe/unsubscribe, and what persist writes.
describe('useCartStore', () => {
  it.todo('adds a product and opens the drawer in one update');
  it.todo('merges a repeat add into the existing line');
  it.todo('removes a line when its quantity reaches zero');
  it.todo('exposes count and subtotal as SELECTORS, not as state');
  it.todo('notifies subscribers exactly once per action');
  it.todo('persists the lines but NOT the drawer');
});
