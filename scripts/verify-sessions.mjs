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
  for (const doc of ['README.md', 'CHEATSHEET.md', 'HOMEWORK.md']) {
    existsSync(join(dir, doc)) ? ok(doc) : fail(`missing ${doc}`);
  }

  // TRAINER.md must NEVER appear here. It lives in the private companion repo
  // because it is written assuming the reader has not seen it — a participant
  // who has read the script knows the punchline of every demo.
  existsSync(join(dir, 'TRAINER.md'))
    ? fail('TRAINER.md is in the PUBLIC repo — it belongs in reactjs-workshops-trainer')
    : ok('no trainer script leaked');

  if (!existsSync(starter)) { fail('missing starter/'); continue; }

  // solution/ is held back until the session has actually run, then published
  // from the companion repo with `node scripts/release-solution.mjs <session>`.
  const released = existsSync(join(solution, 'package.json'));
  released ? ok('solution released') : ok('solution not yet released (expected before the session runs)');

  const apps = released ? [starter, solution] : [starter];
  const nameOf = (app) => (app.endsWith('starter') ? 'starter' : 'solution');
  for (const app of apps) {
    for (const f of ['package.json', '.stackblitzrc', 'index.html', 'README.md']) {
      existsSync(join(app, f)) ? ok(`${nameOf(app)}/${f}`) : fail(`missing ${nameOf(app)}/${f}`);
    }
  }

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

  // 3. A released solution with TODOs left in it is not a solution
  if (released) {
    const leftovers = walk(join(solution, 'src')).filter((f) => markers(readFileSync(f, 'utf8')).length);
    leftovers.length
      ? fail(`solution still contains TODO markers: ${leftovers.map((f) => f.replace(solution, '')).join(', ')}`)
      : ok('solution has no TODO markers');
  }

  // 4. Exact version pins. A `^` means two participants can resolve different
  //    versions of React, and only one of them hits the bug.
  for (const app of apps) {
    const name = nameOf(app);
    const pkg = JSON.parse(readFileSync(join(app, 'package.json'), 'utf8'));
    const loose = Object.entries({ ...pkg.dependencies, ...pkg.devDependencies })
      .filter(([, v]) => /^[\^~>=<*]/.test(v) || v === 'latest');
    loose.length
      ? fail(`${name}/package.json has unpinned versions: ${loose.map(([k, v]) => `${k}@${v}`).join(', ')}`)
      : ok(`${name} versions all exactly pinned`);
  }

  // 5. Starter and solution must agree on dependencies, or the starter installs
  //    a tree the solution was never tested against.
  if (released) {
    const sp = JSON.parse(readFileSync(join(starter, 'package.json'), 'utf8'));
    const lp = JSON.parse(readFileSync(join(solution, 'package.json'), 'utf8'));
    for (const field of ['dependencies', 'devDependencies']) {
      JSON.stringify(sp[field] ?? {}) === JSON.stringify(lp[field] ?? {})
        ? ok(`${field} identical across starter/solution`)
        : fail(`${field} differ between starter and solution`);
    }
  }

  // 6. StackBlitz needs both of these to boot straight into a running app
  for (const app of apps) {
    const name = nameOf(app);
    const rc = JSON.parse(readFileSync(join(app, '.stackblitzrc'), 'utf8'));
    rc.installDependencies === true && typeof rc.startCommand === 'string'
      ? ok(`${name}/.stackblitzrc valid`)
      : fail(`${name}/.stackblitzrc must set installDependencies:true and a startCommand`);
  }

  // 7. node_modules must not be TRACKED. It will exist locally for anyone who
  //    has run npm install — that is fine. What must never happen is it being
  //    committed, which would make the repo unusable.
  for (const app of apps) {
    const name = nameOf(app);
    const rel = app.replace(ROOT, '').replace(/^\//, '');
    const tracked = execFileSync('git', ['ls-files', `${rel}/node_modules`], { cwd: ROOT, encoding: 'utf8' }).trim();
    tracked
      ? fail(`${name}/node_modules is tracked by git — it must not be committed`)
      : ok(`${name}/node_modules not tracked`);
  }
}

// ---------------------------------------------------------------------------
// Repo-wide history scan.
//
// Two rules, and they differ:
//
//   TRAINER.md  — must never appear in ANY commit, ever. It is trainer-only
//                 for the life of the repo.
//   solution/   — must not appear in any commit for a session whose solution
//                 is NOT yet released. Once released it is public and its
//                 presence in later commits is entirely normal.
//
// This exists because checking HEAD alone is not enough, and I got it wrong
// once: a `git filter-branch` with the pathspec `sessions/*/solution` silently
// matched nothing — git matches pathspecs against full FILE paths, and no
// index entry ends at `solution` — so the content survived inside commits that
// were still ancestors of main. HEAD looked clean. `git log` did not.
// ---------------------------------------------------------------------------
console.log('\nhistory');
try {
  const commits = execFileSync('git', ['rev-list', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim().split('\n').filter(Boolean);

  const unreleased = new Set(
    sessions.filter((s2) => !existsSync(join(SESSIONS, s2, 'solution', 'package.json'))),
  );

  const trainerHits = [];
  const solutionHits = [];
  for (const c of commits) {
    const files = execFileSync('git', ['ls-tree', '-r', '--name-only', c], { cwd: ROOT, encoding: 'utf8' }).split('\n');
    for (const f of files) {
      if (/(^|\/)TRAINER\.md$/.test(f)) trainerHits.push(`${c.slice(0, 8)}:${f}`);
      const m = f.match(/^sessions\/([^/]+)\/solution\//);
      if (m && unreleased.has(m[1])) solutionHits.push(`${c.slice(0, 8)}:${m[1]}`);
    }
  }

  trainerHits.length
    ? fail(`TRAINER.md exists in history (${trainerHits.length} paths, e.g. ${trainerHits[0]}) — purge it, participants can read it`)
    : ok(`no TRAINER.md in any of ${commits.length} commits`);

  const bySession = [...new Set(solutionHits.map((h) => h.split(':')[1]))];
  bySession.length
    ? fail(`unreleased solution(s) present in history for: ${bySession.join(', ')} — purge, or release properly`)
    : ok(unreleased.size
        ? `no unreleased solution content in history (${[...unreleased].join(', ')} still held back)`
        : 'all solutions released');
} catch (err) {
  ok(`not a git checkout — skipping history scan (${err.code ?? 'n/a'})`);
}

console.log('');
if (failures) {
  console.error(`${failures} check(s) failed.`);
  process.exit(1);
}
console.log('All session structure checks passed.');
