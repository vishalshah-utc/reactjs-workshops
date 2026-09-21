import { describe, expect, it } from 'vitest';
import { ApiError } from '../lib/ApiError';
import { cartLinesReducer, lineCount, subtotal } from '../lib/cartMath';
import { toastsReducer, type ToastItem } from '../context/ToastContext';
import { requestStatusReducer, type RequestStatus } from './requestStatus';
import type { CartLine } from '../types';

/**
 * Three reducers in one file, because the test is the same three times:
 * call a function with a state and an action, compare the result. No React,
 * no DOM, no async. If your state logic is hard to test, that is the logic
 * telling you it is not a reducer yet.
 */

describe('requestStatusReducer', () => {
  const pending: RequestStatus<string> = { status: 'pending' };

  it('moves idle → pending → success', () => {
    const started = requestStatusReducer({ status: 'idle' }, { type: 'start' });
    expect(started).toEqual({ status: 'pending' });
    expect(requestStatusReducer(started, { type: 'succeed', data: 'hello' })).toEqual({ status: 'success', data: 'hello' });
  });

  it('IGNORES a result that arrives when nothing is pending', () => {
    // The user pressed reset while the request was in flight. This is the rule
    // the state machine exists for, and the only one worth a comment in a test.
    const idle: RequestStatus<string> = { status: 'idle' };
    expect(requestStatusReducer(idle, { type: 'succeed', data: 'late' })).toBe(idle);
    expect(requestStatusReducer(idle, { type: 'fail', error: new ApiError({ message: 'late' }) })).toBe(idle);
  });

  it('records the error on a failure while pending', () => {
    const error = new ApiError({ message: 'Nope.', status: 500 });
    expect(requestStatusReducer(pending, { type: 'fail', error })).toEqual({ status: 'error', error });
  });

  it('resets from any state', () => {
    expect(requestStatusReducer(pending, { type: 'reset' })).toEqual({ status: 'idle' });
  });
});

describe('cartLinesReducer', () => {
  const product = { id: 1, title: 'Mascara', price: 10, thumbnail: 'm.png' };
  const line: CartLine = { productId: 1, title: 'Mascara', price: 10, thumbnail: 'm.png', qty: 2 };

  it('adds a new line with a SNAPSHOT of the product', () => {
    expect(cartLinesReducer([], { type: 'add', product })).toEqual([{ productId: 1, title: 'Mascara', price: 10, thumbnail: 'm.png', qty: 1 }]);
  });

  it('increments the quantity when the product is already in the cart', () => {
    expect(cartLinesReducer([line], { type: 'add', product, qty: 3 })).toEqual([{ ...line, qty: 5 }]);
  });

  it('treats a quantity of zero or less as a removal', () => {
    // The RULE, tested where it lives — once — instead of in every button.
    expect(cartLinesReducer([line], { type: 'setQty', productId: 1, qty: 0 })).toEqual([]);
    expect(cartLinesReducer([line], { type: 'setQty', productId: 1, qty: -4 })).toEqual([]);
  });

  it('never mutates the array it is given', () => {
    const lines = [line];
    cartLinesReducer(lines, { type: 'add', product: { ...product, id: 2 } });
    // If this fails, React will not re-render: same array reference, no change.
    expect(lines).toHaveLength(1);
  });

  it('derives the count and the subtotal from the lines', () => {
    const lines: CartLine[] = [line, { ...line, productId: 2, price: 5, qty: 1 }];
    expect(lineCount(lines)).toBe(3);
    expect(subtotal(lines)).toBe(25);
  });
});

describe('toastsReducer', () => {
  const toast = (id: number): ToastItem => ({ id, variant: 'success', message: `Toast ${id}` });

  it('appends a toast', () => {
    expect(toastsReducer([], { type: 'push', toast: toast(1) })).toEqual([toast(1)]);
  });

  it('keeps at most four on screen, dropping the OLDEST', () => {
    const five = [1, 2, 3, 4, 5].reduce<ToastItem[]>((list, id) => toastsReducer(list, { type: 'push', toast: toast(id) }), []);
    expect(five.map((item) => item.id)).toEqual([2, 3, 4, 5]);
  });

  it('dismisses by id and leaves the rest alone', () => {
    expect(toastsReducer([toast(1), toast(2)], { type: 'dismiss', id: 1 })).toEqual([toast(2)]);
  });

  it('ignores a dismissal for a toast that has already gone', () => {
    expect(toastsReducer([toast(2)], { type: 'dismiss', id: 1 })).toEqual([toast(2)]);
  });
});
