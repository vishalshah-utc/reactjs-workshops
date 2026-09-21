import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type RefObject } from 'react';
import { Card } from 'react-bootstrap';
import { createHistogram, type Histogram, type HistogramBucket } from '../lib/histogram';
import { formatPrice } from '../lib/format';
import type { Product } from '../types';

const HEIGHT = 120;

interface PriceHistogramProps {
  products: Product[];
}

/**
 * The React wrapper around a non-React library. React renders the <canvas>
 * EMPTY and never touches its pixels; the library owns them. The wrapper's
 * whole job is timing: create once, push data when it changes, destroy on unmount.
 */
export function PriceHistogram({ products }: PriceHistogramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Histogram | null>(null); // the library instance: not render state, never displayed
  const [active, setActive] = useState<HistogramBucket | null>(null);

  // 1. Create ONCE, destroy on unmount — and measure the container before the first paint, so the
  //    chart never shows at the canvas's default 300×150 for a frame. A layout effect: measure → draw → paint.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const chart = createHistogram(canvas);
    chartRef.current = chart;
    chart.resize(container.clientWidth, HEIGHT);

    return () => {
      chart.destroy();
      chartRef.current = null;
    };
  }, []);

  // 2. React data → library call. When the page of products changes, the library redraws. That's the whole bridge.
  useEffect(() => {
    chartRef.current?.update(products.map((product) => product.price));
  }, [products]);

  // 3. Re-measure when the container resizes. A ref CALLBACK: React calls it with the node on mount and, in
  //    React 19, calls the returned cleanup on unmount — so the observer's life is the node's life.
  //    useCallback keeps it the same function, or React would re-run it (detach, attach) on every render.
  const setContainer = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => chartRef.current?.resize(entry.contentRect.width, HEIGHT));
    observer.observe(node);
    return () => {
      observer.disconnect();
      containerRef.current = null;
    };
  }, []);

  function handleMove(event: MouseEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect(); // a READ, in a handler — always allowed
    setActive(chartRef.current?.hitTest(event.clientX - rect.left) ?? null);
  }

  function handleLeave() {
    chartRef.current?.hitTest(-1);
    setActive(null);
  }

  const prices = products.map((product) => product.price);
  const summary =
    prices.length === 0
      ? 'No products on this page.'
      : `Price distribution of ${prices.length} products, from ${formatPrice(Math.min(...prices))} to ${formatPrice(Math.max(...prices))}.`;

  return (
    <Card id="price-histogram">
      <Card.Body className="py-2">
        <div className="small text-muted mb-1">Price distribution — this page</div>
        <div ref={setContainer} className="position-relative">
          {/* Pixels are invisible to assistive tech: the canvas gets a role and a text alternative. */}
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={summary}
            style={{ width: '100%', height: HEIGHT, display: 'block' }}
            onMouseMove={handleMove}
            onMouseLeave={handleLeave}
          />
          {/* key: a new bucket is a NEW tooltip, mounted at its default position and measured from scratch. */}
          {active && <BarTooltip key={active.index} bucket={active} containerRef={containerRef} />}
        </div>
      </Card.Body>
    </Card>
  );
}

interface BarTooltipProps {
  bucket: HistogramBucket;
  containerRef: RefObject<HTMLDivElement | null>;
}

/** Centred over its bar — unless that would push it past the container's edge, in which case it shifts back in. */
function BarTooltip({ bucket, containerRef }: BarTooltipProps) {
  const tipRef = useRef<HTMLDivElement>(null);
  const [shift, setShift] = useState(0);

  // MEASURE, then re-render before the browser paints. This is the one job useLayoutEffect exists for.
  // Change it to useEffect and hover the last bar: the tooltip paints hanging off the edge, THEN jumps in.
  // (react-hooks/set-state-in-effect allows a synchronous setState here and refuses it in useEffect — for exactly this reason.)
  useLayoutEffect(() => {
    const tip = tipRef.current;
    const box = containerRef.current;
    if (!tip || !box) return;
    const tipRect = tip.getBoundingClientRect();
    const boxRect = box.getBoundingClientRect();
    if (tipRect.right > boxRect.right) setShift(boxRect.right - tipRect.right - 4);
    else if (tipRect.left < boxRect.left) setShift(boxRect.left - tipRect.left + 4);
  }, [containerRef]);

  return (
    <div
      ref={tipRef}
      role="tooltip"
      className="position-absolute top-0 badge text-bg-dark"
      style={{ left: bucket.x + bucket.width / 2, transform: `translateX(calc(-50% + ${shift}px))`, pointerEvents: 'none' }}
    >
      {bucket.count} at {formatPrice(bucket.from)}–{formatPrice(bucket.to)}
    </div>
  );
}
