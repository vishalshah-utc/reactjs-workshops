import { Suspense, lazy, useRef, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { Button, Placeholder } from 'react-bootstrap';
import { BarChart } from 'react-bootstrap-icons';
import { prefersReducedMotion } from '../hooks/useReducedMotion';
import { PageHeader } from './PageHeader';
import type { Product } from '../types';

/**
 * The histogram is the only thing in this app that pulls in the canvas drawing
 * code (`src/lib/histogram.ts`), and it is behind a disclosure most people
 * never open. `lazy()` moves it into its own chunk, fetched on the first click.
 * Route-level `lazy` (Demo 14, `src/router.tsx`) is the same tool one level up.
 *
 * `.then(m => ({ default: m.PriceHistogram }))` — `lazy` wants a module whose
 * DEFAULT export is the component, and this codebase uses named exports.
 */
const PriceHistogram = lazy(() => import('./PriceHistogram').then((m) => ({ default: m.PriceHistogram })));

interface ProductsSurfaceProps {
  title: string;
  description: string;
  /** Header actions the PAGE owns — density, "Show all", "Add product". Rendered left of the chart disclosure. */
  actions?: ReactNode;
  /** The search toolbar and the category strip. */
  toolbar: ReactNode;
  /** What the histogram draws. */
  products: Product[];
  /** The grid, the pager, the long list. */
  children: ReactNode;
}

/**
 * The page's chrome — and the owner of one piece of state: whether the price
 * chart is open.
 *
 * That state used to live in `ProductsPage`, where opening the chart re-rendered
 * the whole page including sixty product cards. Here it re-renders exactly this
 * component. `actions`, `toolbar` and `children` are ELEMENTS the page created
 * in a render that did not happen again, so React compares each one to itself,
 * finds the same object, and skips the entire subtree.
 *
 * That is the structural fix: content passed IN cannot be re-rendered by state
 * that lives here. No `memo`, no dependency array (📖 study-notes 15 §7).
 */
export function ProductsSurface({ title, description, actions, toolbar, products, children }: ProductsSurfaceProps) {
  const [showChart, setShowChart] = useState(false);
  const chartPanelRef = useRef<HTMLDivElement>(null);

  function toggleChart() {
    if (showChart) {
      setShowChart(false);
      return;
    }
    // flushSync: render NOW, synchronously, so the panel exists on the next line. Without it, setState is batched,
    // the panel doesn't exist yet, and chartPanelRef.current is null. Rare and deliberate — hence the comment.
    flushSync(() => setShowChart(true));
    chartPanelRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'nearest' });
  }

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        actions={
          <>
            {actions}
            {/* A disclosure, not a toggle button: aria-expanded + aria-controls tell assistive tech WHAT it opens. */}
            <Button size="sm" variant="outline-secondary" aria-expanded={showChart} aria-controls="price-histogram" onClick={toggleChart}>
              <BarChart className="me-1" />
              Prices
            </Button>
          </>
        }
      />

      {toolbar}

      {showChart && (
        <div ref={chartPanelRef} className="mb-3">
          {/* Suspense is not optional with lazy(): it is what renders while the chunk is in flight. */}
          <Suspense
            fallback={
              <Placeholder as="div" animation="glow">
                <Placeholder xs={12} style={{ height: 150 }} className="rounded" />
              </Placeholder>
            }
          >
            <PriceHistogram products={products} />
          </Suspense>
        </div>
      )}

      {children}
    </>
  );
}
