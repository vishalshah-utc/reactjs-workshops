/**
 * Deterministic pseudo-random helpers.
 *
 * The whole seed data set is generated from a fixed seed so that every
 * participant, on every machine, on every reload, sees byte-identical data.
 * A workshop where "product 4021" means something different to each person
 * is a workshop where nobody can help their neighbour.
 */

/** mulberry32 — small, fast, good enough, and fully deterministic. */
export function createRng(seed = 0x5c0dec0f) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeHelpers(rng) {
  /** Integer in [min, max] inclusive. */
  const int = (min, max) => Math.floor(rng() * (max - min + 1)) + min;
  /** Float in [min, max) rounded to `dp` decimals. */
  const float = (min, max, dp = 2) => Number((rng() * (max - min) + min).toFixed(dp));
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];
  const chance = (p) => rng() < p;
  const sample = (arr, n) => {
    const copy = arr.slice();
    const out = [];
    const count = Math.min(n, copy.length);
    for (let i = 0; i < count; i += 1) out.push(...copy.splice(Math.floor(rng() * copy.length), 1));
    return out;
  };
  const shuffle = (arr) => {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };
  /**
   * A weighted pick. `weighted([['a', 3], ['b', 1]])` returns 'a' 75% of
   * the time. Used to make order statuses and ratings look like real data
   * (mostly 5 stars, mostly DELIVERED) rather than a uniform smear.
   */
  const weighted = (pairs) => {
    const total = pairs.reduce((sum, [, w]) => sum + w, 0);
    let roll = rng() * total;
    for (const [value, w] of pairs) {
      roll -= w;
      if (roll <= 0) return value;
    }
    return pairs[pairs.length - 1][0];
  };
  /** A timestamp between `daysAgoMax` and `daysAgoMin` days before now. */
  const pastDate = (daysAgoMax, daysAgoMin = 0) => {
    const span = daysAgoMax - daysAgoMin;
    const ms = (daysAgoMin + rng() * span) * 24 * 60 * 60 * 1000;
    return new Date(Date.now() - ms).toISOString();
  };

  return { rng, int, float, pick, chance, sample, shuffle, weighted, pastDate };
}
