/**
 * `loading.tsx` is a <Suspense> boundary the framework writes for you: Next
 * wraps `page.tsx` in one and uses this as the fallback. The Vite app spells
 * the same thing out by hand in `ProductDetailPage.tsx` — this is the version
 * where the framework knows where the boundary goes.
 */
export default function Loading() {
  return <p className="muted">Loading products…</p>;
}
