/**
 * Every store that holds USER-scoped state registers its reset here, so signing
 * out is one call instead of a list somebody will forget to extend.
 *
 * TODO(lab-6.4): hold the registered resets in a `Set`, let a store add itself
 * with `registerReset`, and run them all from `resetUserScopedStores()`. Then
 * decide — and write down — which stores belong in it. The cart and the
 * wishlist are deliberately NOT user-scoped.
 */
type Reset = () => void;

export function registerReset(_reset: Reset): void {}

export function resetUserScopedStores(): void {}
