interface ProductRowListProps {
  /** DEV ONLY: burn time in every row that renders, so "only the visible ones render" is measurable. */
  slow?: boolean;
}

/**
 * Every product DummyJSON has, in one scrolling list — and never more than a
 * dozen of them in the DOM.
 */
// TODO(lab-5.1): fetch all 194 with `useFetch((signal) => listProducts({ limit: 0, signal }), 'all-products')`
// — this request has its own lifetime, so it does not belong in the route loader — then render a fixed-height
// scroll container with `useVirtualizer` from @tanstack/react-virtual: `count`, `getScrollElement`,
// `estimateSize`, `overscan`, `measureElement` for variable-height rows, `getItemKey`. A spacer <ul> as tall as
// `getTotalSize()`, and one absolutely positioned <li data-index ref={virtualizer.measureElement}> per visible row.
export function ProductRowList(_props: ProductRowListProps) {
  return null;
}
