/**
 * The wishlist store. Today it lives in WishlistProvider (src/context/WishlistContext.tsx,
 * Demo 12) and reaches components through useWishlist(). By the end of Lab 1 it
 * lives HERE — no provider, and any component can read exactly the slice it needs.
 */
// TODO(lab-1.1): create<WishlistState>()((set) => ({ ids: [], toggle, clear })) — plus the named selectors selectWishlistCount and selectIsSaved(id)
// TODO(lab-3.2): wrap the store in persist(…, { name: 'shopscope.wishlist' }) so it survives a reload
export {};
