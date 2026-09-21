/**
 * Lab 4.1: a tiny charting "library" with NO React in it — handed a <canvas>,
 * owns its pixels, exposes four methods (the shape of Chart.js, D3, Leaflet…).
 * This stub draws nothing.
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
  update(values: number[]): void;
  resize(width: number, height: number): void;
  hitTest(x: number): HistogramBucket | null;
  destroy(): void;
}

// TODO(lab-4.1): bucket the values, draw bars with Canvas 2D (devicePixelRatio-aware bitmap), highlight the bar under hitTest(x), clear on destroy
export function createHistogram(_canvas: HTMLCanvasElement): Histogram {
  return { update() {}, resize() {}, hitTest: () => null, destroy() {} };
}
