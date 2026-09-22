/**
 * Every store that holds USER-scoped state registers its reset here, so
 * signing out is one call instead of a list somebody will forget to extend.
 *
 * WHY A REGISTRY AND NOT A LIST OF IMPORTS: `RootLayout` should not have to
 * import five stores to sign a user out, and a store added next year should not
 * need a change in a layout component to be cleared. The store registers
 * itself, at import time, next to the state it is registering.
 */
type Reset = () => void;

const resets = new Set<Reset>();

export function registerReset(reset: Reset): void {
  resets.add(reset);
}

/**
 * Called on sign-out. The cart and the wishlist are deliberately NOT registered:
 * they are this browser's state, not this account's, and a shopper who signs out
 * expects to still have a basket. "User-scoped" is a decision, not a default.
 */
export function resetUserScopedStores(): void {
  for (const reset of resets) reset();
}
