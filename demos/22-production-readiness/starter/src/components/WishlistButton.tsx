import { useOptimistic, useState } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { Heart, HeartFill } from 'react-bootstrap-icons';
import { useFormStatus } from 'react-dom';
import { syncWishlist } from '../api/services/wishlist';
import { selectIsSaved, useWishlistStore } from '../store/wishlist';

interface WishlistButtonProps {
  productId: number;
  title: string;
}

/**
 * Nested inside the form, so `useFormStatus` can see it. The visual state is a
 * prop (the optimistic one); the busy state it works out for itself.
 */
function WishlistSubmit({ saved, title }: { saved: boolean; title: string }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={saved ? 'danger' : 'outline-danger'}
      // aria-pressed follows the OPTIMISTIC value, which is the point: a screen
      // reader hears "pressed" the instant you click, not a second later.
      aria-pressed={saved}
      aria-label={saved ? `Remove ${title} from wishlist` : `Save ${title} to wishlist`}
    >
      {pending ? (
        <Spinner as="span" size="sm" animation="border" className="me-1" aria-hidden="true" />
      ) : saved ? (
        <HeartFill className="me-1" aria-hidden="true" />
      ) : (
        <Heart className="me-1" aria-hidden="true" />
      )}
      {saved ? 'Saved' : 'Save'}
    </Button>
  );
}

/**
 * Save to wishlist, with the heart filling in BEFORE the server has agreed —
 * and emptying again on its own if the server says no.
 *
 * `useOptimistic(saved)` returns a value that is `saved` almost all the time.
 * Inside an action you may push a different value into it, and React shows
 * that one until the action finishes. Then it snaps back to `saved` —
 * whatever `saved` has become by then. That is the whole mechanism, and it is
 * why the rollback needs no code: there is no rollback, only a temporary
 * override that expires.
 *
 * The rule: `setOptimistic…` may only be called inside an action or a
 * transition. `<form action={fn}>` makes `fn` an action, which is why this is
 * a form and not an onClick.
 */
export function WishlistButton({ productId, title }: WishlistButtonProps) {
  const saved = useWishlistStore(selectIsSaved(productId));
  const count = useWishlistStore((s) => s.ids.length);
  const toggle = useWishlistStore((s) => s.toggle);
  const [error, setError] = useState<string | null>(null);

  const [optimisticSaved, setOptimisticSaved] = useOptimistic(saved);

  /** The action. No FormData is needed — the product id is a prop, not a field. */
  async function toggleSaved() {
    setError(null);
    setOptimisticSaved(!saved); // on screen immediately

    try {
      await syncWishlist(productId, !saved, count);
      toggle(productId); // only NOW does the real state change
    } catch (rejected) {
      // No `setSaved(previous)` anywhere. React drops the optimistic value when
      // the action settles, and the store was never touched, so the heart is
      // already correct by the time this line runs. All that is left is to say why.
      setError(rejected instanceof Error ? rejected.message : 'Could not update your wishlist.');
    }
  }

  return (
    <div>
      <form action={toggleSaved} className="d-inline-block">
        <WishlistSubmit saved={optimisticSaved} title={title} />
      </form>
      {error && (
        // role="status", not "alert": the heart has already corrected itself, so
        // this is an explanation, not an interruption.
        <div className="text-danger small mt-1" role="status">
          {error}
        </div>
      )}
    </div>
  );
}
