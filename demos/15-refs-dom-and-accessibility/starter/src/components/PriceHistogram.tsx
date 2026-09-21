import type { Product } from '../types';

/** Lab 4.2: a <canvas> owned by lib/histogram.ts, wrapped for React. Renders nothing yet. */
// TODO(lab-4.2): create the chart in useLayoutEffect (measure the container, resize, destroy on cleanup); update() when `products` change; a ResizeObserver in a ref callback with cleanup; a tooltip that measures itself in useLayoutEffect
export function PriceHistogram(_props: { products: Product[] }) {
  return null;
}
