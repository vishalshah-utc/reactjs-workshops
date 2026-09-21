#!/usr/bin/env node
/**
 * A BUDGET, not a report.
 *
 * `npm run build:analyze` draws you a treemap; a human has to look at it, and
 * humans stop looking. This script fails, which means CI fails, which means
 * the 80 kB date library somebody added on a Friday is a red build and not a
 * slow phone six months later.
 *
 *   node scripts/check-bundle-size.mjs              # the committed budget
 *   node scripts/check-bundle-size.mjs --max-kb=500 # try a tighter one
 *
 * The number below is not from the internet. It is what ShopScope measures
 * today plus a little headroom — the only way to pick a budget. Re-measure
 * when you deliberately add something, and move it on purpose.
 */
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = new URL('../dist/assets/', import.meta.url).pathname;

/** Raw (unzipped) kilobytes, per JavaScript asset. Raw, because that is what the browser has to PARSE. */
const DEFAULT_MAX_KB = 680;

const flag = process.argv.find((a) => a.startsWith('--max-kb='));
const maxKb = flag ? Number(flag.split('=')[1]) : DEFAULT_MAX_KB;
if (!Number.isFinite(maxKb) || maxKb <= 0) {
  console.error(`Not a budget: ${flag}`);
  process.exit(2);
}

let assets;
try {
  assets = readdirSync(DIST).filter((f) => f.endsWith('.js'));
} catch {
  console.error('No dist/assets — run `npm run build` first.');
  process.exit(2);
}

const rows = assets
  .map((file) => ({ file, kb: statSync(join(DIST, file)).size / 1024 }))
  .sort((a, b) => b.kb - a.kb);

const over = rows.filter((row) => row.kb > maxKb);

console.log(`Bundle budget: ${maxKb} kB raw per JavaScript asset\n`);
for (const { file, kb } of rows) {
  const bar = kb > maxKb ? '✗' : '✓';
  console.log(`  ${bar} ${kb.toFixed(1).padStart(8)} kB  ${file}`);
}

const total = rows.reduce((sum, row) => sum + row.kb, 0);
console.log(`\n  ${rows.length} JavaScript assets, ${total.toFixed(1)} kB in total.`);

if (over.length) {
  console.error(`\n${over.length} asset(s) over budget. Run \`npm run build:analyze\` and open dist/stats.html to see what is in them.`);
  process.exit(1);
}
console.log('Within budget.');
