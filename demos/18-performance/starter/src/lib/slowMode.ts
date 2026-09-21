/**
 * A DEV INSTRUMENT, not a feature.
 *
 * Every performance lesson needs something slow to point at, and a product
 * card that renders in 0.05 ms teaches nothing. `spin()` burns a measurable
 * amount of main-thread time inside a render so the Profiler, the frame rate
 * and your own fingers can all feel it.
 */

// TODO(lab-1.1): the dev instrument. Export `SLOW_SPINS` (start at 8_000_000 — measure it),
// and `spin(iterations = SLOW_SPINS)`, a busy loop whose total is written to a MODULE-LEVEL
// sink so neither V8 nor the React Compiler is allowed to delete it. Export `lastSpin()` to
// read the sink back, or the variable is unused. Nothing here imports React.

export const SLOW_SPINS = 8_000_000;

export function spin(_iterations: number = SLOW_SPINS): void {
  // replaced in Lab 1
}

export function lastSpin(): number {
  return 0;
}
