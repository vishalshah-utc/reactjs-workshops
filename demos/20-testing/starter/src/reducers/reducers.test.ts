// TODO(lab-3.3): test all three reducers in this one file — requestStatusReducer (the
// transitions, and the late result it must IGNORE), cartLinesReducer (add, merge, "zero
// means remove", no mutation, the derived count and subtotal) and toastsReducer (append,
// the four-toast ceiling dropping the oldest, dismiss by id).
describe('requestStatusReducer', () => {
  it.todo('moves idle → pending → success');
  it.todo('IGNORES a result that arrives when nothing is pending');
  it.todo('resets from any state');
});

describe('cartLinesReducer', () => {
  it.todo('adds a new line with a SNAPSHOT of the product');
  it.todo('increments the quantity when the product is already in the cart');
  it.todo('treats a quantity of zero or less as a removal');
  it.todo('never mutates the array it is given');
});

describe('toastsReducer', () => {
  it.todo('keeps at most four on screen, dropping the OLDEST');
  it.todo('dismisses by id and leaves the rest alone');
});
