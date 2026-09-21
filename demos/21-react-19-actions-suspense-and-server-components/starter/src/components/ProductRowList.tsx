import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Card, Spinner } from 'react-bootstrap';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { everythingQuery } from '../api/queries';
import { ApiError } from '../lib/ApiError';
import { formatPrice } from '../lib/format';
import { spin } from '../lib/slowMode';
import type { Product } from '../types';
import { ErrorNotice } from './ErrorNotice';
import { StockBadge } from './StockBadge';

const VIEWPORT_HEIGHT = 420;

interface ProductRowListProps {
  /** DEV ONLY: burn time in every row that renders, so "only the visible ones render" is measurable. */
  slow?: boolean;
}

/**
 * Every product DummyJSON has, in one scrolling list — and never more than a
 * dozen of them in the DOM.
 *
 * A ROW list, not the card grid. Virtualising a grid means telling the
 * virtualiser how many cards fit per row, recomputing that on every resize,
 * and keeping it in step with the six Bootstrap breakpoints `ProductGrid`
 * uses. TanStack Virtual can do it (`lanes`), but the honest version of this
 * lab is: virtualise the one-dimensional thing first, and reach for a grid
 * only when a measurement says the grid is the problem.
 *
 * This request has its OWN lifetime — it belongs to a disclosure the user may
 * never open, so it does not belong in the route loader (Demo 7's rule). Until
 * Demo 19 that meant `useFetch`; it now means a query, which is the same hook
 * shape with one difference you can see: close the disclosure, open it again,
 * and the 194 products are already there.
 */
export function ProductRowList({ slow = false }: ProductRowListProps) {
  const { data, isPending, error } = useQuery(everythingQuery());
  const products: Product[] = data?.products ?? [];

  // The SCROLL container. The virtualiser needs a node with a fixed height and `overflow: auto`
  // — that is what defines "visible".
  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: products.length,
    getScrollElement: () => scrollRef.current,
    // A GUESS, used before a row has been measured. Wrong guesses only cost you a scrollbar that
    // settles as you scroll; wildly wrong ones make the bar jump.
    estimateSize: () => 96,
    // Render a few rows above and below the viewport so a fast scroll doesn't show white.
    overscan: 6,
    // Variable heights: hand each row's node to the virtualiser and it measures the real thing
    // with a ResizeObserver, replacing the estimate. Without this, every row is 96 px forever.
    measureElement: (node) => node.getBoundingClientRect().height,
    getItemKey: (index) => products[index]?.id ?? index,
  });

  if (error) return <ErrorNotice error={ApiError.from(error)} />;
  if (isPending) {
    return (
      <Card body className="text-center text-muted">
        <Spinner size="sm" className="me-2" />
        Loading every product…
      </Card>
    );
  }

  const items = virtualizer.getVirtualItems();

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <span className="fw-semibold">All {products.length} products</span>
        <span className="small text-muted">{items.length} rows in the DOM</span>
      </Card.Header>

      {/* 1. The viewport: fixed height, scrolls. */}
      <div ref={scrollRef} style={{ height: VIEWPORT_HEIGHT, overflowY: 'auto' }} role="region" aria-label="All products, scrollable">
        {/* 2. The spacer: as tall as all 194 rows together, so the scrollbar is honest. */}
        <ul className="list-unstyled mb-0 position-relative" style={{ height: virtualizer.getTotalSize() }}>
          {/* 3. Only the visible rows exist — absolutely positioned at the offset the virtualiser computed. */}
          {items.map((item) => {
            const product = products[item.index];
            return (
              <li
                key={item.key}
                // data-index + ref: how measureElement knows WHICH row it just measured.
                data-index={item.index}
                ref={virtualizer.measureElement}
                className="border-bottom px-3 py-2 d-flex gap-3 align-items-start position-absolute w-100"
                style={{ top: 0, left: 0, transform: `translateY(${item.start}px)` }}
              >
                <ProductRow product={product} slow={slow} />
              </li>
            );
          })}
        </ul>
      </div>
    </Card>
  );
}

function ProductRow({ product, slow }: { product: Product; slow: boolean }) {
  if (slow) spin();

  return (
    <>
      <img src={product.thumbnail} alt="" loading="lazy" width={56} height={56} className="object-fit-contain bg-body-secondary rounded flex-shrink-0" />
      <div className="flex-grow-1 min-w-0">
        <Link to={`/products/${product.id}`} className="text-decoration-none text-reset fw-semibold">
          {product.title}
        </Link>
        {/* Variable height on purpose: some descriptions wrap to two lines, some to three.
            That is what measureElement is for — an estimate alone would drift by hundreds of pixels. */}
        <p className="small text-muted mb-1">{product.description}</p>
        <StockBadge stock={product.stock} />
      </div>
      <div className="fw-semibold text-nowrap">{formatPrice(product.price)}</div>
    </>
  );
}
