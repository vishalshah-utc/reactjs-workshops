#!/usr/bin/env node
/**
 * A BUDGET, not a report. `npm run build:analyze` draws you a treemap; a human
 * has to look at it, and humans stop looking. This script fails, which means
 * CI fails, which means the 80 kB date library somebody added on a Friday is a
 * red build and not a slow phone six months later.
 */

// TODO(lab-5.4): read every .js file in ../dist/assets, print each one's raw size largest first, and exit 1
// when any of them is over budget. Accept `--max-kb=` so you can try a tighter number without editing the
// file. Pick the default from a MEASUREMENT of today's build plus headroom — not from a number on the internet.
console.error('Not written yet — Demo 18, Lab 5. See the guide.');
process.exit(2);
