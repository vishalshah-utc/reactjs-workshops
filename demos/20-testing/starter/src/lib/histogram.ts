/**
 * A tiny charting "library" with NO React in it.
 *
 * It is handed a <canvas>, owns its pixels, and exposes four methods — the
 * exact shape of Chart.js, D3, Leaflet or any widget that wants a DOM node to
 * itself. The React side (components/PriceHistogram.tsx) is the same for all
 * of them: create in an effect, push data when it changes, destroy on cleanup.
 * We write the library ourselves so you can read every line; the integration
 * code is what you would write for the real thing.
 */
export interface HistogramBucket {
  index: number;
  from: number;
  to: number;
  count: number;
  /** Where the bar was drawn, in CSS pixels relative to the canvas — for tooltips. */
  x: number;
  width: number;
}

export interface Histogram {
  /** Recompute the buckets from new values and redraw. */
  update(values: number[]): void;
  /** A canvas cannot measure its container — the wrapper measures and tells it. */
  resize(width: number, height: number): void;
  /** Which bar is under this x (CSS pixels, relative to the canvas), if any. Highlights it. */
  hitTest(x: number): HistogramBucket | null;
  destroy(): void;
}

interface HistogramOptions {
  buckets?: number;
  color?: string;
  highlightColor?: string;
}

function getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is not available in this browser.');
  return ctx;
}

export function createHistogram(
  canvas: HTMLCanvasElement,
  { buckets = 8, color = '#0d6efd', highlightColor = '#6ea8fe' }: HistogramOptions = {},
): Histogram {
  const ctx = getContext(canvas);

  let values: number[] = [];
  let bars: HistogramBucket[] = [];
  let width = canvas.clientWidth || 300;
  let height = canvas.clientHeight || 150;
  let highlighted = -1;

  function compute() {
    if (values.length === 0) {
      bars = [];
      return;
    }
    const min = Math.min(...values);
    const max = Math.max(...values);
    const step = Math.max(max - min, 1) / buckets;
    const gap = 4;
    const barWidth = (width - gap * (buckets + 1)) / buckets;

    bars = Array.from({ length: buckets }, (_, index) => ({
      index,
      from: min + index * step,
      to: index === buckets - 1 ? max : min + (index + 1) * step,
      count: 0,
      x: gap + index * (barWidth + gap),
      width: barWidth,
    }));
    for (const value of values) {
      const index = Math.min(buckets - 1, Math.floor((value - min) / step));
      bars[index].count += 1;
    }
  }

  function draw() {
    // The bitmap is sized in DEVICE pixels (sharp on a retina screen); the CSS size is the wrapper's business.
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const maxCount = Math.max(1, ...bars.map((bar) => bar.count));
    const baseline = height - 2;
    for (const bar of bars) {
      const barHeight = (bar.count / maxCount) * (height - 8);
      ctx.fillStyle = bar.index === highlighted ? highlightColor : color;
      ctx.fillRect(bar.x, baseline - barHeight, bar.width, barHeight);
    }
  }

  return {
    update(next) {
      values = next;
      compute();
      draw();
    },
    resize(nextWidth, nextHeight) {
      width = nextWidth;
      height = nextHeight;
      compute();
      draw();
    },
    hitTest(x) {
      const index = bars.findIndex((bar) => x >= bar.x && x <= bar.x + bar.width);
      if (index !== highlighted) {
        highlighted = index;
        draw();
      }
      return index === -1 ? null : bars[index];
    },
    destroy() {
      ctx.clearRect(0, 0, width, height);
      values = [];
      bars = [];
    },
  };
}
