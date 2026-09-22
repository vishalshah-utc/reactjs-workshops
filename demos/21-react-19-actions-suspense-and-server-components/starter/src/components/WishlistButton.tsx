interface WishlistButtonProps {
  productId: number;
  title: string;
}

/**
 * Save to wishlist, with the heart filling in BEFORE the server has agreed —
 * and emptying again on its own if the server says no.
 */
// TODO(lab-1.5): build this over `useOptimistic(saved)`. Read `saved` and the count from
// useWishlistStore, put the toggle in a `<form action={fn}>` (setOptimistic may only be
// called inside an action), call syncWishlist, and update the store only when it resolves.
// Write NO rollback: React drops the optimistic value when the action settles. Nest the
// button in its own component so `useFormStatus` can see the form, and drive `aria-pressed`
// from the OPTIMISTIC value, not the store's.
export function WishlistButton(_props: WishlistButtonProps) {
  return null;
}
