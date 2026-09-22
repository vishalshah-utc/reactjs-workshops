'use client';

import { useOptimistic, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { addToCart } from './actions';

/**
 * THE ONLY CLIENT COMPONENT IN THIS APP.
 *
 * `'use client'` is a BOUNDARY, not a file switch: this module and everything
 * it imports becomes part of the client bundle. That is why it imports almost
 * nothing — `./actions` is the exception, and it does not count, because a
 * Server Function import is replaced by a reference to an endpoint.
 *
 * Its props are `productId` and `inCart`: a number and a number. Props cross
 * the boundary by being SERIALISED, so a function, a class instance, a Date
 * with methods you rely on, or a Map will not survive. Pass data; keep the
 * behaviour on one side or the other. 📖 study-notes 19 §4
 */

function Pending({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Adding…' : label}
    </button>
  );
}

export function AddToCartButton({ productId, inCart }: { productId: number; inCart: number }) {
  // The same hook as the Vite app's wishlist button, against a real server round trip.
  const [optimisticCount, addOptimistic] = useOptimistic(inCart, (current: number, delta: number) => current + delta);
  const [error, setError] = useState<string | null>(null);

  async function action() {
    setError(null);
    addOptimistic(1);
    try {
      // Looks like a local call. It is a POST to a generated endpoint, and the
      // server's response carries the re-rendered RSC payload with it.
      await addToCart(productId);
    } catch {
      // The optimistic +1 is dropped automatically when the action settles.
      setError('Could not add that — try again.');
    }
  }

  return (
    <form action={action}>
      <Pending label={optimisticCount > 0 ? `In cart (${optimisticCount})` : 'Add to cart'} />
      {error && <p className="error">{error}</p>}
    </form>
  );
}
