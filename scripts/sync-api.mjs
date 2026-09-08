#!/usr/bin/env node
/**
 * Copy `api/` into every session app that bundles it.
 *
 * From Session 3 onward each starter and solution ships its own copy of the
 * ShopCrew API under `server/`, so a participant runs ONE `npm install` and
 * gets a working full stack in a browser tab. No monorepo, no workspaces, no
 * symlinks — WebContainers support none of them.
 *
 * The cost of that is 20 copies of the same code, so this script is the
 * single source of truth and CI fails if any copy has drifted.
 *
 *   node scripts/sync-api.mjs            copy api/ into every app that has a server/
 *   node scripts/sync-api.mjs --check    fail if any copy differs (used by CI)
 *   node scripts/sync-api.mjs --init <path>   create server/ in a new app
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const API = join(ROOT, 'api');
const SESSIONS = join(ROOT, 'sessions');

const args = process.argv.slice(2);
const check = args.includes('--check');
const initIndex = args.indexOf('--init');
const initTarget = initIndex !== -1 ? args[initIndex + 1] : null;

/** Only these come along. node_modules and lockfiles do not. */
const INCLUDE = ['src', 'package.json', 'README.md'];

function walk(dir, base = dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.git') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, base, out);
    else out.push(relative(base, full));
  }
  return out;
}

function copyApiTo(serverDir) {
  rmSync(serverDir, { recursive: true, force: true });
  mkdirSync(serverDir, { recursive: true });
  for (const entry of INCLUDE) {
    const from = join(API, entry);
    if (!existsSync(from)) continue;
    cpSync(from, join(serverDir, entry), { recursive: true });
  }
}

function diffApi(serverDir) {
  const differences = [];
  for (const entry of INCLUDE) {
    const from = join(API, entry);
    if (!existsSync(from)) continue;
    if (statSync(from).isDirectory()) {
      const theirs = join(serverDir, entry);
      if (!existsSync(theirs)) { differences.push(`${entry}/ missing`); continue; }
      const ours = walk(from);
      for (const file of ours) {
        const a = join(from, file);
        const b = join(theirs, file);
        if (!existsSync(b)) { differences.push(`${entry}/${file} missing`); continue; }
        if (readFileSync(a, 'utf8') !== readFileSync(b, 'utf8')) differences.push(`${entry}/${file} differs`);
      }
      for (const file of walk(theirs)) {
        if (!existsSync(join(from, file))) differences.push(`${entry}/${file} is extra`);
      }
    } else {
      const b = join(serverDir, entry);
      if (!existsSync(b)) differences.push(`${entry} missing`);
      else if (readFileSync(from, 'utf8') !== readFileSync(b, 'utf8')) differences.push(`${entry} differs`);
    }
  }
  return differences;
}

if (initTarget) {
  const target = resolve(initTarget);
  if (!existsSync(join(target, 'package.json'))) {
    console.error(`✗ ${target} does not look like an app (no package.json)`);
    process.exit(1);
  }
  copyApiTo(join(target, 'server'));
  console.log(`✓ created ${relative(ROOT, join(target, 'server'))}`);
  process.exit(0);
}

/**
 * Starters live here; solutions live in the private companion repo until they
 * are released. Both need the same API copy, so scan both roots when the
 * sibling repo is checked out next door.
 */
const ROOTS = [SESSIONS];
const TRAINER_SESSIONS = join(ROOT, '..', 'reactjs-workshops-trainer', 'sessions');
if (existsSync(TRAINER_SESSIONS)) ROOTS.push(TRAINER_SESSIONS);

const apps = [];
for (const sessionsDir of ROOTS) {
  for (const session of readdirSync(sessionsDir).sort()) {
    if (!statSync(join(sessionsDir, session)).isDirectory()) continue;
    for (const variant of ['starter', 'solution']) {
      const app = join(sessionsDir, session, variant);
      if (existsSync(join(app, 'server'))) apps.push(app);
    }
  }
}

if (apps.length === 0) {
  console.log('No apps bundle the API yet (nothing has a server/ directory).');
  process.exit(0);
}

let drifted = 0;
for (const app of apps) {
  const label = relative(ROOT, app).replace(/^\.\.\//, '');
  const serverDir = join(app, 'server');
  if (check) {
    const differences = diffApi(serverDir);
    if (differences.length) {
      drifted += 1;
      console.error(`  ✗ ${label}/server has drifted from api/:`);
      for (const d of differences.slice(0, 8)) console.error(`      ${d}`);
      if (differences.length > 8) console.error(`      …and ${differences.length - 8} more`);
    } else {
      console.log(`  ✓ ${label}/server matches api/`);
    }
  } else {
    copyApiTo(serverDir);
    console.log(`  → synced ${label}/server`);
  }
}

if (check && drifted) {
  console.error(`\n${drifted} copy(ies) out of date. Run: node scripts/sync-api.mjs`);
  process.exit(1);
}
console.log(check ? '\nAll API copies match.' : `\nSynced ${apps.length} copy(ies) from api/.`);
