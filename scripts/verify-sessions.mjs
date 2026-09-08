#!/usr/bin/env node
/**
 * Structural checks across every session, run in CI.
 *
 * These catch the failures that are invisible until thirty people hit them at
 * once in a live room: a guide that references a TODO the starter does not
 * have, a solution that still ships TODOs, a starter whose dependency pins
 * drifted from its solution, or a floating `^` that lets two participants
 * resolve different versions of React.
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = new URL('..', import.meta.url).pathname;
const SESSIONS = join(ROOT, 'sessions');

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

const sessions = existsSync(SESSIONS)
  ? readdirSync(SESSIONS).filter((d) => statSync(join(SESSIONS, d)).isDirectory()).sort()
  : [];

if (sessions.length === 0) {
  console.error('No sessions found.');
  process.exit(1);
}

for (const session of sessions) {
  console.log(`\n${session}`);
  const dir = join(SESSIONS, session);
  const starter = join(dir, 'starter');
  const solution = join(dir, 'solution');

  // 1. Required documents
  for (const doc of ['README.md', 'TRAINER.md', 'CHEATSHEET.md', 'HOMEWORK.md']) {
    existsSync(join(dir, doc)) ? ok(doc) : fail(`missing ${doc}`);
  }
  for (const app of [starter, solution]) {
    const name = app.endsWith('starter') ? 'starter' : 'solution';
    if (!existsSync(app)) { fail(`missing ${name}/`); continue; }
    for (const f of ['package.json', '.stackblitzrc', 'index.html', 'README.md']) {
      existsSync(join(app, f)) ? ok(`${name}/${f}`) : fail(`missing ${name}/${f}`);
    }
  }
  if (!existsSync(starter) || !existsSync(solution)) continue;

  // 2. Every TODO the guide names must exist in the starter, and vice versa
  const guide = readFileSync(join(dir, 'README.md'), 'utf8');
  const inGuide = new Set(markers(guide));
  const inStarter = new Set(
    walk(join(starter, 'src')).flatMap((f) => markers(readFileSync(f, 'utf8'))),
  );
  for (const m of inGuide) if (!inStarter.has(m)) fail(`guide references TODO(${m}) but no starter file has it`);
  for (const m of inStarter) if (!inGuide.has(m)) fail(`starter has TODO(${m}) but the guide never explains it`);
  if ([...inGuide].every((m) => inStarter.has(m)) && [...inStarter].every((m) => inGuide.has(m))) {
    ok(`${inGuide.size} TODO markers match the guide`);
  }

  // 3. A solution with TODOs left in it is not a solution
  const leftovers = walk(join(solution, 'src')).filter((f) => markers(readFileSync(f, 'utf8')).length);
  leftovers.length
    ? fail(`solution still contains TODO markers: ${leftovers.map((f) => f.replace(solution, '')).join(', ')}`)
    : ok('solution has no TODO markers');

  // 4. Exact version pins. A `^` means two participants can resolve different
  //    versions of React, and only one of them hits the bug.
  for (const app of [starter, solution]) {
    const name = app.endsWith('starter') ? 'starter' : 'solution';
    const pkg = JSON.parse(readFileSync(join(app, 'package.json'), 'utf8'));
    const loose = Object.entries({ ...pkg.dependencies, ...pkg.devDependencies })
      .filter(([, v]) => /^[\^~>=<*]/.test(v) || v === 'latest');
    loose.length
      ? fail(`${name}/package.json has unpinned versions: ${loose.map(([k, v]) => `${k}@${v}`).join(', ')}`)
      : ok(`${name} versions all exactly pinned`);
  }

  // 5. Starter and solution must agree on dependencies, or the starter installs
  //    a tree the solution was never tested against.
  const sp = JSON.parse(readFileSync(join(starter, 'package.json'), 'utf8'));
  const lp = JSON.parse(readFileSync(join(solution, 'package.json'), 'utf8'));
  for (const field of ['dependencies', 'devDependencies']) {
    const a = JSON.stringify(sp[field] ?? {});
    const b = JSON.stringify(lp[field] ?? {});
    a === b ? ok(`${field} identical across starter/solution`)
            : fail(`${field} differ between starter and solution`);
  }

  // 6. StackBlitz needs both of these to boot straight into a running app
  for (const app of [starter, solution]) {
    const name = app.endsWith('starter') ? 'starter' : 'solution';
    const rc = JSON.parse(readFileSync(join(app, '.stackblitzrc'), 'utf8'));
    rc.installDependencies === true && typeof rc.startCommand === 'string'
      ? ok(`${name}/.stackblitzrc valid`)
      : fail(`${name}/.stackblitzrc must set installDependencies:true and a startCommand`);
  }

  // 7. node_modules must not be TRACKED. It will exist locally for anyone who
  //    has run npm install — that is fine. What must never happen is it being
  //    committed, which would make the repo unusable.
  for (const app of [starter, solution]) {
    const name = app.endsWith('starter') ? 'starter' : 'solution';
    const rel = app.replace(ROOT, '').replace(/^\//, '');
    const tracked = execFileSync('git', ['ls-files', `${rel}/node_modules`], { cwd: ROOT, encoding: 'utf8' }).trim();
    tracked
      ? fail(`${name}/node_modules is tracked by git — it must not be committed`)
      : ok(`${name}/node_modules not tracked`);
  }
}

console.log('');
if (failures) {
  console.error(`${failures} check(s) failed.`);
  process.exit(1);
}
console.log('All session structure checks passed.');
