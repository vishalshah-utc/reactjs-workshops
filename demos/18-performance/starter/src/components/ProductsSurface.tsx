import type { ReactNode } from 'react';
import { PageHeader } from './PageHeader';
import type { Product } from '../types';

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
 * chart is open. Content that arrives through `actions`, `toolbar` and
 * `children` cannot be re-rendered by state that lives in here.
 */
// TODO(lab-2.2): move `showChart`, `chartPanelRef` and `toggleChart` out of ProductsPage and into this
// component (the flushSync + scrollIntoView pair comes with them), and render the "Prices" disclosure
// button inside the PageHeader's `actions`, after the page's own. Nothing else changes shape.
// TODO(lab-5.3): the histogram is the only thing that pulls in the canvas code and most people never open it —
// load it with `lazy(() => import('./PriceHistogram').then((m) => ({ default: m.PriceHistogram })))` and render
// it inside a `<Suspense>` with a Placeholder fallback.
export function ProductsSurface({ title, description, actions, toolbar, products: _products, children }: ProductsSurfaceProps) {
  return (
    <>
      <PageHeader title={title} description={description} actions={actions} />
      {toolbar}
      {children}
    </>
  );
}
