#!/usr/bin/env node
/**
 * Structural checks for the demo track (demos/). The same failures the
 * session checks catch — a guide that names a TODO the starter doesn't have,
 * a floating version, a missing .stackblitzrc — but with the demo track's
 * lighter contract: README + starter per demo, and starter(N+1) doubling as
 * the finished state of demo N, with one final solution/ at the end.
 *
 * Two extensions for the 25-session program:
 *  - Part 0 folders (00a-…, 00b-…) are sessions, not chain demos: they get the
 *    structural checks but are exempt from the shared-dependency rule (00a is a
 *    vanilla-ts project; 00b's starter is 00a finished).
 *  - The dependency set may GROW once, at the Part 6 boundary (demo 15): every
 *    package already pinned must keep the same version, new packages may be
 *    added, and from then on the set must again be identical demo to demo.
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = new URL('..', import.meta.url).pathname;
const DEMOS = join(ROOT, 'demos');

let failures = 0;
const fail = (msg) => { console.error(`  ✗ ${msg}`); failures += 1; };
const ok = (msg) => console.log(`  ✓ ${msg}`);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist' || entry === '.git') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const markers = (text) => [...text.matchAll(/TODO\(([a-z0-9.\-]+)\)/g)].map((m) => m[1]);

const demos = existsSync(DEMOS)
  ? readdirSync(DEMOS).filter((d) => /^\d\d-/.test(d) && statSync(join(DEMOS, d)).isDirectory()).sort()
  : [];
const sessions = existsSync(DEMOS)
  ? readdirSync(DEMOS).filter((d) => /^\d\d[a-z]-/.test(d) && statSync(join(DEMOS, d)).isDirectory()).sort()
  : [];
const PART6_FIRST = '15-';   // the one place the shared dependency set may grow

if (demos.length === 0) { console.error('No demos found.'); process.exit(1); }

let referenceDeps = null;   // { [pkg]: version } of the previous demo

for (const demo of [...sessions, ...demos]) {
  const isSession = /^\d\d[a-z]-/.test(demo);
  console.log(`\n${demo}`);
  const dir = join(DEMOS, demo);
  const starter = join(dir, 'starter');
  const solution = join(dir, 'solution');

  const hasGuide = existsSync(join(dir, 'README.md'));
  hasGuide ? ok('README.md') : fail('missing README.md');
  existsSync(join(dir, 'TRAINER.md'))
    ? fail('TRAINER.md is in the PUBLIC repo — it belongs in reactjs-workshops-trainer')
    : ok('no trainer script leaked');

  if (!existsSync(starter)) { fail('missing starter/'); continue; }

  const apps = [starter, ...(existsSync(join(solution, 'package.json')) ? [solution] : [])];
  const nameOf = (app) => (app.endsWith('starter') ? 'starter' : 'solution');

  for (const app of apps) {
    for (const f of ['package.json', '.stackblitzrc', 'index.html', 'README.md']) {
      existsSync(join(app, f)) ? ok(`${nameOf(app)}/${f}`) : fail(`missing ${nameOf(app)}/${f}`);
    }
    // Once a demo reads configuration, every mode it can run in needs an env file (the root .gitignore drops `.env`).
    if (existsSync(join(app, 'src', 'config', 'env.ts')) || existsSync(join(app, 'src', 'config', 'env.js'))) {
      for (const f of ['.env.development', '.env.staging', '.env.production']) {
        existsSync(join(app, f)) ? ok(`${nameOf(app)}/${f}`) : fail(`missing ${nameOf(app)}/${f} (src/config/env.ts reads it)`);
      }
    }
  }

  // Every TODO the guide names must exist in the starter, and vice versa.
  const guide = hasGuide ? readFileSync(join(dir, 'README.md'), 'utf8') : '';
  const inGuide = new Set(markers(guide));
  const inStarter = new Set(walk(join(starter, 'src')).flatMap((f) => markers(readFileSync(f, 'utf8'))));
  for (const m of inGuide) if (!inStarter.has(m)) fail(`guide references TODO(${m}) but no starter file has it`);
  for (const m of inStarter) if (!inGuide.has(m)) fail(`starter has TODO(${m}) but the guide never explains it`);
  if ([...inGuide].every((m) => inStarter.has(m)) && [...inStarter].every((m) => inGuide.has(m))) {
    ok(`${inGuide.size} TODO markers match the guide`);
  }

  // A solution with TODOs left in it is not a solution.
  if (apps.length === 2) {
    const leftovers = walk(join(solution, 'src')).filter((f) => markers(readFileSync(f, 'utf8')).length);
    leftovers.length ? fail(`solution still contains TODO markers: ${leftovers.map((f) => f.replace(solution, '')).join(', ')}`) : ok('solution has no TODO markers');
  }

  // Exact pins, and the SAME pins in every demo — the whole track shares one dependency set,
  // so a participant who installed once never re-installs. The set may grow exactly once, at the
  // Part 6 boundary, and only by ADDING packages (existing pins unchanged). Part 0 sessions are exempt.
  for (const app of apps) {
    const pkg = JSON.parse(readFileSync(join(app, 'package.json'), 'utf8'));
    const all = { ...pkg.dependencies, ...pkg.devDependencies };
    const loose = Object.entries(all).filter(([, v]) => /^[\^~>=<*]/.test(v) || v === 'latest');
    loose.length ? fail(`${nameOf(app)}/package.json has unpinned versions: ${loose.map(([k, v]) => `${k}@${v}`).join(', ')}`) : ok(`${nameOf(app)} versions all exactly pinned`);
    if (isSession) { ok(`${nameOf(app)} is a Part 0 session — exempt from the shared dependency set`); continue; }
    if (referenceDeps === null) { referenceDeps = all; ok(`${nameOf(app)} is the reference dependency set`); continue; }
    const same = JSON.stringify(Object.entries(all).sort()) === JSON.stringify(Object.entries(referenceDeps).sort());
    if (same) { ok(`${nameOf(app)} dependencies identical to the previous demo`); continue; }
    const changed = Object.entries(referenceDeps).filter(([k, v]) => all[k] !== v).map(([k, v]) => `${k}: ${v} → ${all[k] ?? 'removed'}`);
    const added = Object.keys(all).filter((k) => !(k in referenceDeps));
    if (demo.startsWith(PART6_FIRST) && nameOf(app) === 'starter' && changed.length === 0 && added.length > 0) {
      ok(`${nameOf(app)} grows the shared set at the Part 6 boundary (+${added.length}: ${added.join(', ')})`);
      referenceDeps = all;
    } else {
      fail(`${nameOf(app)} dependencies differ from the previous demo — the track must share one set${changed.length ? ` (changed: ${changed.join(', ')})` : ''}${added.length ? ` (added: ${added.join(', ')})` : ''}`);
    }
  }

  for (const app of apps) {
    const rc = JSON.parse(readFileSync(join(app, '.stackblitzrc'), 'utf8'));
    rc.installDependencies === true && typeof rc.startCommand === 'string'
      ? ok(`${nameOf(app)}/.stackblitzrc valid`)
      : fail(`${nameOf(app)}/.stackblitzrc must set installDependencies:true and a startCommand`);
  }

  for (const app of apps) {
    const rel = app.replace(ROOT, '').replace(/^\//, '');
    let tracked = '';
    try { tracked = execFileSync('git', ['ls-files', `${rel}/node_modules`], { cwd: ROOT, encoding: 'utf8' }).trim(); } catch { /* not a git checkout */ }
    tracked ? fail(`${nameOf(app)}/node_modules is tracked by git — it must not be committed`) : ok(`${nameOf(app)}/node_modules not tracked`);
  }
}

// The last demo must ship the finished app.
const last = demos[demos.length - 1];
existsSync(join(DEMOS, last, 'solution', 'package.json')) ? ok(`\n${last}/solution present (the finished ShopScope)`) : fail(`\n${last}/solution missing — the final demo must ship the finished app`);

console.log('');
if (failures) { console.error(`${failures} check(s) failed.`); process.exit(1); }
console.log('All demo structure checks passed.');
