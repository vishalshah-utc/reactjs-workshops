interface LiveStockBadgeProps {
  productId: number;
}

/**
 * Stock, polled — the one number on this page worth a timer.
 *
 * `select` turns 194 rows into ONE number before React sees it, and TanStack
 * compares the SELECTED value: the poll lands every fifteen seconds and this
 * component re-renders only when this product's own stock changed.
 */
// TODO(lab-6.2): `useQuery({ ...stockQuery(), select: (rows) => rows.find(...)?.stock })`,
// rendered as a Badge with `aria-live="polite"` and `formatTime(dataUpdatedAt)`
// — live data nobody can date is not believable.
export function LiveStockBadge(_props: LiveStockBadgeProps) {
  return null;
}
