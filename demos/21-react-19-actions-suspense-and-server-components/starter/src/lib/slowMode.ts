/**
 * A DEV INSTRUMENT, not a feature.
 *
 * Every performance lesson needs something slow to point at, and a product
 * card that renders in 0.05 ms teaches nothing. `spin()` burns a measurable
 * amount of main-thread time inside a render so the Profiler, the frame rate
 * and your own fingers can all feel it.
 *
 * It ships: `spin()` is only ever called when a component is passed
 * `slow={true}`, and the only thing that passes it is a switch the toolbar
 * renders behind `import.meta.env.DEV`. In production the switch is dead code
 * the bundler removes, so nothing can turn it on.
 */

/**
 * Measured, not guessed: ~4.5 ms per call on an M-series laptop, so a page of
 * twelve cards costs ~55 ms — and React's development build plus StrictMode's
 * double render take that past 100 ms, which is where a click stops feeling
 * instant. The cold open starts at 2e6 (~1.2 ms); this is 2e6 turned up until
 * the problem is unmistakable. Turn it up further if your machine laughs.
 */
export const SLOW_SPINS = 8_000_000;

/**
 * The result goes to a module-level sink on purpose. An empty
 * `for (let i = 0; i < 2e6; i++) {}` is provably pointless, and both V8 and
 * the React Compiler are allowed to delete it. A value that escapes the
 * function cannot be deleted — so the loop actually runs.
 */
let sink = 0;

/** Burn `iterations` of main-thread time. Synchronous, blocking, and that is the point. */
export function spin(iterations: number = SLOW_SPINS): void {
  let total = 0;
  for (let i = 0; i < iterations; i += 1) total += i % 7;
  sink = total;
}

/** Only so the sink is read somewhere — otherwise it is an unused variable. Never called in anger. */
export function lastSpin(): number {
  return sink;
}
