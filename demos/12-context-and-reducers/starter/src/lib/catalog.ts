/** "price-asc" | "price-desc" | "rating-desc" | "" — the sort select's values, also what the URL will carry. */
export type SortKey = '' | 'price-asc' | 'price-desc' | 'rating-desc';

/** Split a SortKey into what the API wants. '' → no sort. */
export function parseSort(sort: SortKey): { sortBy: 'price' | 'rating' | ''; order: 'asc' | 'desc' } {
  if (!sort) return { sortBy: '', order: 'asc' };
  const [sortBy, order] = sort.split('-') as ['price' | 'rating', 'asc' | 'desc'];
  return { sortBy, order };
}

/** A neutral thumbnail for products created locally, so the card never shows a broken image. */
export const PLACEHOLDER_THUMBNAIL =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="100%" height="100%" fill="#e9ecef"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#6c757d">New product</text></svg>',
  );
