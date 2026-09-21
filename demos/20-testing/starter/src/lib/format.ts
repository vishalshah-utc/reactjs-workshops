/**
 * Small, pure helpers. No React in here — which is exactly why they are easy
 * to test and safe to reuse anywhere.
 */
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

/** 9.99 → "$9.99". Never format money with string concatenation. */
export function formatPrice(amount: number): string {
  return usd.format(amount);
}

/** DummyJSON gives a list price and a percentage; the sale price is DERIVED. */
export function discountedPrice(price: number, discountPercentage = 0): number {
  return Math.round(price * (1 - discountPercentage / 100) * 100) / 100;
}

/**
 * Dates, with no date library.
 *
 * `Intl.DateTimeFormat` is in the browser already: zero bytes shipped, every
 * locale, every calendar. The alternative most codebases reach for — moment,
 * or day.js with its locale and plugin files — is the single easiest way to
 * put 70 kB into a bundle for six lines of formatting. Run
 * `npm run build:analyze` and look for a date library in the treemap: there
 * isn't one, and that is a decision, not an accident (Demo 18 Lab 5).
 *
 * Constructed ONCE at module scope. `new Intl.DateTimeFormat(...)` per call is
 * the expensive part — the formatting itself is cheap.
 */
const mediumDate = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });

/** An ISO string from the API → "14 Apr 2025". Never store a Date; format at the edge. */
export function formatDate(iso: string): string {
  return mediumDate.format(new Date(iso));
}

/** The same idea for clock time — "14:32:07". Live data needs a timestamp, or nobody believes it is live. */
const clockTime = new Intl.DateTimeFormat('en-GB', { timeStyle: 'medium' });

/** A millisecond epoch (TanStack Query's `dataUpdatedAt`) → "14:32:07". 0 means "never fetched". */
export function formatTime(epochMs: number): string {
  return epochMs ? clockTime.format(new Date(epochMs)) : '—';
}
