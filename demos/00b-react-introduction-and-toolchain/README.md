# Session 2 — React Introduction, Rendering Architectures & the Toolchain

**Session guide** · ~120 minutes · why React exists, where your components become HTML, and a toolchain you can defend — ending with Demo 1's starter built from scratch

---

## Where you are starting from

The starter is **Session 1, finished**: the ShopScope catalogue in plain
TypeScript — `types.ts`, `format.ts`, `catalog.ts`, `fn.ts`, `api.ts`, and
an imperative grid in `render.ts` + `main.ts` with a wishlist you sync by
hand. There are **no `TODO(lab-` markers** in it: the cold open edits it
once, and the lab builds a *new* project beside it.

New dependency: none yet. The lab installs React, React Bootstrap and the
rest of the track's pinned set — that is part of what you learn today.

## What you ship today

Four teaching blocks and one lab. The blocks answer three questions a React
developer is asked in every interview and every architecture meeting: *why
React*, *how does it update the screen*, and *where should the HTML be made*.
The lab turns `npm create vite` into the **exact** `demos/01-components-jsx-props/starter`
— pinned dependencies, strict TypeScript, ESLint with the two React plugins,
Bootstrap, `<StrictMode>`, and your three Session 1 files ported in unchanged.
`diff -r` against the shipped starter is **empty**. From Demo 1 on, you
know every line of the project you are working in.

By the end you will be able to answer, without hesitating:

- What "declarative" buys you, in one sentence, using the wishlist heart
- The four ideas React is built on — and the six things it deliberately is not
- Trigger → render → commit, and why a component must be pure
- CSR vs SSR vs SSG: where the HTML is made, what each costs, and the five
  worksheet questions that decide it
- Why ShopScope is a Vite CSR app, what that costs, and when the answer flips
- What `react-hooks/rules-of-hooks` and `react-refresh/only-export-components` each catch
- Why `console.log` prints twice, and why you leave `<StrictMode>` on
- Why `VITE_` is a prefix and not a secret-keeping mechanism

> **Architecture before syntax.** You will write your first component today,
> and it renders three product titles. The point of the session is that when
> Demo 1 starts, you already know *why* the project is shaped the way it is.

## Pre-reading

[study-notes 02 — React Introduction](../../study-notes/02-react-introduction/README.md)
and [study-notes 03 — Rendering Architectures](../../study-notes/03-rendering-architectures/README.md),
both in full; both are complete on their own. Per block:

| Block | Read first |
|---|---|
| 1 · Why React | 02 §1–4 what React is, the problem it solves, declarative vs imperative, the four ideas · §6 what React is not |
| 2 · How React updates the screen | 02 §5 render and commit |
| 3 · Where components become HTML | 03 §1–13 — all of it |
| 4 · The ecosystem in 2026 | 02 §7–13 ecosystem, choosing how to start, the four options |
| 5 · Lab | 02 §14–22 hands-on with Vite, anatomy, boot sequence, Strict Mode, toolchain, building, common problems |

---

## Before the session (5 minutes)

```
https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/00b-react-introduction-and-toolchain/starter
```

> ⚠️ Click once, bookmark the `stackblitz.com/edit/…` URL. Every click of the
> `/fork/` link is a fresh copy.

Locally: `cd demos/00b-react-introduction-and-toolchain/starter && npm install && npm run dev`.

The lab needs a terminal with Node 22.22+ (`node -v`) and network access —
`npm create vite` downloads the template. Install
[React Developer Tools](https://react.dev/learn/react-developer-tools) in your
browser now; Block 2 uses it.

---

## The cold open

Open the Session 1 grid. Add a **sort by price** select — the obvious way.

`index.html`, inside `<header class="toolbar">`, after the search label:

```html
      <label>
        Sort
        <select id="sort">
          <option value="">Default</option>
          <option value="asc">Price ↑</option>
          <option value="desc">Price ↓</option>
        </select>
      </label>
```

`src/main.ts` — a fifth piece of state, a handle, a handler:

```ts
import { categoriesOf, filterByCategory, parseSortOrder, searchProducts, sortProducts } from './lib/catalog';
// …
let sort = '';
const sortSelect = document.querySelector<HTMLSelectElement>('#sort')!;

function visibleProducts(): Product[] {
  const list = searchProducts(filterByCategory(allProducts, category), query);
  return sort === '' ? list : sortProducts(list, 'price', parseSortOrder(sort));
}

sortSelect.addEventListener('change', () => {
  sort = sortSelect.value;
  renderGrid(grid, visibleProducts());
});
```

Nine lines, all correct. Save three hearts. Sort by price. **Every heart is
empty. The badge still says 3.** The `Set` is right; the DOM is wrong. You
forgot `syncHearts(grid, wishlist)` — the line every other handler has, that
nothing made you write.

Add it. Fixed. Now count: the wishlist reaches the screen from five places
(load, category, search, sort, click), each with two calls that have to
travel together. Every bug in this file is the same bug: **the DOM and the
data disagree.** Filter, sort, search, a badge, a heart — five sources of
truth for one `Set`.

React's one job is to make that impossible: you write *what the screen looks
like for a given state*, once, and React makes the DOM match — after every
change, with nothing to forget. Put the sort select back the way it was
(revert both files); you will see it again in Demo 7, in four lines of JSX.

---

## Block 1 — Why React (20 min)

**Imperative code describes changes; declarative code describes results.**
Session 1's `main.ts` is a list of changes: *build these cards, then walk the
hearts and set `aria-pressed`, then update the badge*. The React version is
a description of the result:

```tsx
function Grid({ products, wishlist, onToggle }: GridProps) {
  return (
    <>
      <Badge count={wishlist.size} />
      {products.map((p) => (
        <ProductCard key={p.id} product={p} saved={wishlist.has(p.id)} onToggle={onToggle} />
      ))}
    </>
  );
}
```

`saved={wishlist.has(p.id)}` is not an update; it is a *fact about the
output*. Filter, sort, search, click — React re-runs `Grid` with the new
`products` and `wishlist`, and every heart is derived again. There is no
`syncHearts` because there is nothing to sync: the DOM is a function of the
data. That is the whole pitch, and the cold open is the whole argument.

**The four ideas React is built on:**

| Idea | What it means | Where you meet it |
|---|---|---|
| **Components** | A function from props to UI. Reusable, composable, testable in isolation | Demo 1 |
| **JSX** | Markup as an expression inside JavaScript — so `map`, ternaries and variables *are* the template language | Demo 1 (Session 1 Lab 1 is why `{}` takes expressions only) |
| **One-way data flow** | Data goes down through props; events go up through callbacks. A child never reaches into a parent | Demo 3 |
| **State** | The values that change over time, owned by one component; changing them triggers a re-render of that subtree | Demo 2 |

**What React is *not*.** React is a library for rendering UI from state. It
ships no router, no data fetching or caching, no forms, no global store, no
styling, no build tool, no test runner. Each is a choice — and this program
makes each one deliberately (Block 4). The upside: React has outlived three
generations of everything around it. The cost: "I know React" means "I know
React *and* a stack", and hiring managers ask about the stack.

> Read more: study-notes 02 [§2 The problem React solves](../../study-notes/02-react-introduction/README.md#2-the-problem-react-solves),
> [§3 Declarative vs imperative](../../study-notes/02-react-introduction/README.md#3-declarative-vs-imperative),
> [§4 The four ideas](../../study-notes/02-react-introduction/README.md#4-the-four-ideas-react-is-built-on),
> [§6 What React is not](../../study-notes/02-react-introduction/README.md#6-what-react-is-not).

---

## Block 2 — How React updates the screen (15 min)

**Three phases, and every future error message uses their names.**

```
TRIGGER                RENDER                                  COMMIT
initial mount    →     React calls your components        →    React applies the minimum
or a state update      and gets back a description              DOM operations, then the
                       (a tree of plain objects), then           browser paints
                       diffs it against the previous one
```

**Render does not touch the DOM.** It calls your functions and compares the
result with last time. That comparison is **reconciliation**; the in-memory
description is what people call the "virtual DOM" — not a copy of the DOM,
a *diffing strategy*: compute the whole description cheaply, then touch the
real DOM only where it changed. If one text node changed, one text node is
updated; focus, scroll and selection survive, because the surrounding nodes
were not recreated. That is `renderGrid` + `syncHearts` done properly — and
done for you.

**Two consequences you meet immediately:**

- **Components must be pure.** React may render more often than you expect,
  may render and throw the result away, and in development renders every
  component **twice** on purpose (Block 5 shows the double `console.log`).
  Same props and state → same output, nothing else touched. Session 1 Lab 5
  is why that is achievable: a pure function is a function you can call
  twice.
- **`key` is how React matches list items across renders.** Without a
  stable key, a sort makes React think every row *changed* and it rebuilds
  them — the imperative bug, back through the side door. `key={p.id}` above
  is not decoration. Demo 2 does the experiment.

**React DevTools.** Open the **Components** tab on any React site (react.dev
will do). Click a component: its props and state, live. Open ⚙ → *Highlight
updates when components render*: the render phase, visualised. From Demo 2
on, this is how you *see* what re-rendered instead of guessing.

> Read more: study-notes 02 [§5 How React updates the screen](../../study-notes/02-react-introduction/README.md#5-how-react-updates-the-screen).

---

## Block 3 — Where components become HTML (25 min)

**A React component is a function that returns a description of UI. Someone
has to run it and turn the result into HTML. Where and when that happens is
the architecture decision.**

| | **CSR** — client-side rendering | **SSR** — server-side rendering | **SSG** — static site generation |
|---|---|---|---|
| Where the HTML is made | The user's browser | Your server, per request | The build machine, once |
| What the server sends | An empty `<div id="root">` and a script | Finished HTML for *this* request | Finished HTML from the last build |
| First paint | Slow — after the JS downloads and runs | Fast | Fastest — from a CDN |
| SEO / link previews | Poor to moderate | Excellent | Excellent |
| Data freshness | Live, fetched in the browser | Live, per request | As of the last build |
| Hosting | Static files, any CDN | A Node/edge runtime you operate | Static files, any CDN |
| Best fit | Dashboards, tools, anything behind a login | Storefronts, feeds — public *and* fresh | Docs, marketing, blogs |

**Hydration** is the step SSR and SSG both need: the HTML arrives *visible
but dead* — no listeners, no state. The React bundle downloads, React walks
the existing DOM, matches it to the component tree and attaches handlers.
Between "visible" and "interactive" there is a gap users notice; bundle size
still matters in SSR apps, which is why **streaming** (flush the shell,
stream slow sections) and **Server Components** (ship no JavaScript for
components that need none) exist. Anything non-deterministic —
`Date.now()`, `window.innerWidth`, `localStorage` — must not run during the
server render or the client's HTML will not match the server's: a *hydration
mismatch*, the signature bug of the server/client boundary.

**Vocabulary you will hear in 2026:** ISR (static pages that revalidate on a
timer), on-demand revalidation (a webhook rebuilds *one* page), PPR (a static
shell with dynamic holes streamed in), islands (hydrate only the interactive
bits). Every one is the same direction of travel: *send HTML early, send as
little JavaScript as possible.*

**The e-commerce worked example.** One store, three answers: homepage and
"About" are SSG (identical for everyone, must rank, must survive a launch
spike); product pages are SSR (price and stock must be right *now*, and
Google must read them); cart, checkout and account are CSR (behind a login,
per-user, nothing to crawl). **Rendering strategy is a per-route decision,
not a per-project one.**

**The metrics that decide arguments.** TTFB and LCP favour SSG then SSR;
**TTI** depends on bundle size, *not* on the strategy — SSR makes a page
visible sooner, not interactive sooner; INP after load favours a SPA, which
navigates without fetching HTML. When someone says "faster", ask which.

**The decision worksheet — five questions, in order; the first yes decides:**

1. Must search engines or link previews read this content? → SSR or SSG.
2. Same content for everyone, changes rarely? → SSG (+ ISR).
3. Must the data be right at the moment of the request? → SSR.
4. Everything behind a login, per-user, no SEO? → **CSR.**
5. Different parts answer differently? → a framework, chosen per route.

**Verdict: ShopScope is a Vite CSR app.** It is a product *explorer* for
learning React: nothing to rank, a public API, no server of our own, the
cheapest possible hosting (a folder of static files — Demo 14 deploys it).
What that costs, and you should be able to say so in the interview: first
paint waits for the JavaScript; a crawler sees an empty `div`; every visitor
downloads the whole app before seeing a product. When does the answer flip?
When question 1 becomes a yes — a real storefront's product pages *must*
rank. Session 23 takes ShopScope's product page through a Next.js mini-app
with Server Components to show exactly what changes and what does not (the
components, mostly, do not).

**The asymmetry to remember.** CSR → SSR is a real refactor (data fetching
moves, `window` disappears, some libraries break); SSR → CSR is easy. If the
requirement is unclear, Vite is the cheaper mistake — *unless* you already
know SEO matters, in which case choose the framework on day one. Retrofitting
SEO onto a shipped CSR app is the migration that becomes a rewrite.

> Read more: study-notes 03 [§4 Direct comparison](../../study-notes/03-rendering-architectures/README.md#4-direct-architectural-comparison),
> [§5 Hydration](../../study-notes/03-rendering-architectures/README.md#5-hydration-explained-properly),
> [§7 The e-commerce example](../../study-notes/03-rendering-architectures/README.md#7-real-world-example-an-e-commerce-website),
> [§10 ISR, PPR and islands](../../study-notes/03-rendering-architectures/README.md#10-beyond-the-three-isr-ppr-and-islands),
> [§11 The metrics](../../study-notes/03-rendering-architectures/README.md#11-the-metrics-that-decide-arguments),
> [§13 Decision worksheet](../../study-notes/03-rendering-architectures/README.md#13-decision-worksheet).

---

## Block 4 — The ecosystem in 2026 (15 min)

**Create React App is deprecated.** If a tutorial starts with `npx
create-react-app`, close it. The React team's own recommendation is a
framework for most production apps, or Vite for a client-only app — which is
the choice Block 3 just made for you.

**The four ways to start:**

| Option | What it is | Choose it when |
|---|---|---|
| **Vite** | Dev server + bundler for a client-side app. Instant start, HMR, one config file | CSR is the verdict (this program) |
| **Next.js / React Router framework mode** | Full-stack frameworks: routing, SSR/SSG/ISR per route, Server Components, server actions | Question 1 or 3 of the worksheet is a yes |
| **Custom bundler** (Webpack, Rspack, Parcel) | You own the pipeline | You inherited it, or you have constraints the others cannot meet |
| **CRA** | Deprecated | Never for new work |

**React 19 and the Compiler, in one paragraph.** React 19 is the version in
your `package.json`: Actions and `useActionState` for forms, `use()` for
promises and context, `ref` as a plain prop, document metadata, Server
Components as a stable protocol. The **React Compiler** memoises for you
automatically — the `memo`/`useMemo`/`useCallback` you will learn in Demo 18
become what the compiler does when you cannot use it. Session 23 shows both.

**The libraries this program chose, and why** — every one is a "React is
not" from Block 1, filled in:

| Need | Choice | Why this one |
|---|---|---|
| HTTP | **axios** | Instances, interceptors, one place for auth and errors (Demo 6, 11). `fetch` is fine; a service layer is the point, and axios makes it short |
| Forms + validation | **react-hook-form + zod** | Uncontrolled inputs (fast), one schema that is both the validator and the TypeScript type via `z.infer` (Demo 4) |
| Routing | **React Router 8, Data Mode** | Loaders, actions, fetchers and middleware without adopting a whole framework; the mental model transfers to framework mode later (Demo 9–11) |
| Global client state | **Zustand** | A store is a hook; selectors; no boilerplate — after you have felt Context + reducer's limits (Demo 12 → 13) |
| UI | **React Bootstrap** | Accessible components, no custom CSS to maintain, so every minute goes on React — not on flexbox |
| Backend | **DummyJSON** | 194 real-shaped products, auth with refresh tokens, simulated writes, `?delay=` for slow-network demos, no signup |

You are allowed to disagree with every row — after the program, with the
alternative's trade-offs on the table. That is the interview answer.

> Read more: study-notes 02 [§7 The ecosystem in 2026](../../study-notes/02-react-introduction/README.md#7-the-react-ecosystem-in-2026),
> [§8–9 Choosing how to start](../../study-notes/02-react-introduction/README.md#8-choosing-how-to-start-a-react-app),
> [§10–13 The four options](../../study-notes/02-react-introduction/README.md#10-option-1--create-react-app-cra-the-deprecated-legacy-option).

---

## Block 5 — Lab: scaffold ShopScope (45 min)

### Problem

Demo 1's starter exists. You could download it. Then you would spend the next
twenty sessions inside a project whose `tsconfig` you have never read, whose
ESLint rules you cannot name, and whose `package.json` pins you cannot
defend. Build it instead — from Vite's template to the shipped tree, one
deliberate change at a time, until `diff -r` has nothing to say.

### Concept

**`npm create vite` gives you a starting point, not a project.** Vite's
`react-ts` template today ships floating version ranges (`^19.2.8`,
`~6.0.2`), oxlint instead of ESLint, no `vite-env.d.ts`, a `public/`
folder, a hero image and a counter. Every one of those is a decision someone
made for a demo, not for your team. The lab replaces each with the track's
decision and says why.

**Exact pins, one set for the whole track.** `"react": "19.3.0"`, not
`"^19.3.0"`. A caret means "whatever the newest compatible version is when
*you* run `npm install`" — two learners, two days apart, two different
`node_modules`. Every demo from 1 to 14 pins the *same* list, so one
`npm install` serves the whole track and "works on my machine" is not a
sentence anyone says.

**`strict: true` is a family of flags**, and the tsconfig turns on more:

| Flag | What it refuses |
|---|---|
| `strict` | Implicit `any`, `null`/`undefined` where they were not declared, unchecked `this`, loose function parameter types, `any` in `catch` |
| `noUnusedLocals` / `noUnusedParameters` | Dead variables and parameters (leading `_` is the escape hatch — stubs use it) |
| `verbatimModuleSyntax` | A type imported without `import type` — so the bundler can erase it safely |
| `erasableSyntaxOnly` | `enum`, namespaces, parameter properties — TypeScript syntax that *generates* JavaScript. Everything left can be stripped, which is exactly what Vite does |
| `noFallthroughCasesInSwitch` | A `case` without `break`/`return` |
| `noUncheckedSideEffectImports` | `import './missing.css'` that resolves to nothing |
| `jsx: react-jsx` | Nothing — it tells TypeScript that `<App />` compiles to a call it does not need `import React` for |

Two files, not one: `tsconfig.app.json` for `src/` (browser, `DOM` lib) and
`tsconfig.node.json` for `vite.config.ts` (Node). `tsconfig.json` just
references both; `tsc -b` builds both.

**ESLint with two React plugins.** `eslint-plugin-react-hooks` gives you
**`rules-of-hooks`** — the rule you never disable. It catches a hook called
inside an `if`, a loop or a callback, which corrupts React's internal
bookkeeping *silently*: the bug appears three clicks later in an unrelated
component. It also gives you **`exhaustive-deps`**, which reads an effect's
dependency array and tells you what you forgot (Demo 5). `eslint-plugin-react-refresh`
gives you **`only-export-components`**: a file that exports a component *and*
something else (a constant, a helper) cannot be hot-reloaded in place — Vite
has to reload the page and you lose your state. It is a warning, and it is
why `NAV_LINKS` in `SiteHeader.tsx` is a module-local `const`, not an export.

**The boot sequence** is four lines and one empty `div`. The browser fetches
`index.html`; the only script tag is `<script type="module" src="/src/main.tsx">`;
`main.tsx` calls `createRoot(document.getElementById('root')!)` and `.render(<App />)`;
React runs `App`, gets a description, and commits DOM into `#root`. Everything
the user sees is created by JavaScript, after the JavaScript loads. That is
CSR, in code — Block 3's `<div id="root"></div>` row.

**CSS import order matters.** `import 'bootstrap/dist/css/bootstrap.min.css'`
then `import './index.css'`: Vite emits them in import order, so anything in
`index.css` can override Bootstrap. Reverse them and your overrides lose.
`index.css` is intentionally empty in this track — React Bootstrap and
utility classes do all the work — but the *order* is the habit.

**`<StrictMode>`** is a development-only wrapper that renders every component
twice and runs every effect twice, to surface impure renders and effects that
forgot to clean up. It costs production nothing — it is stripped from the
build. Leave it on. A component the double render breaks is a component with
a bug the double render found.

### Steps

Work in `demos/` so the diff at the end is a one-liner. `01-components-jsx-props`
is the target you are reproducing; `00b-react-introduction-and-toolchain/starter`
is Session 1, finished — the source of the three ported files.

**A. Scaffold**

```bash
cd demos
npm create vite@latest shopscope -- --template react-ts
cd shopscope
```

If the CLI asks anything — experimental options, *install and start now?* —
answer **No**. You are about to replace `package.json`. Look at what you
got: `ls -la`, `cat package.json`. Floating ranges, `oxlint`, a `public/`
folder, `src/assets/`, `src/App.css`, a `README.md` about Vite. Look at
`src/App.tsx` once — a counter and some logos — then never again.

**B. Delete what the template decided for you**

```bash
rm -rf .oxlintrc.json public src/assets src/App.css README.md
```

`oxlint` goes because the track's rules live in an ESLint config with the
two React plugins (step F). `public/` goes because there are no static assets
yet. `src/assets/` and `App.css` are the demo's hero image and its styling —
Bootstrap replaces both.

**C. `package.json` — the pinned set, verbatim**

Replace the whole file. Every version exact; every dependency the track will
need through Demo 14, so this is the *only* `npm install` you run until
Demo 15:

```json
{
  "name": "shopscope-demo",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "engines": {
    "node": ">=22.22"
  },
  "scripts": {
    "dev": "vite",
    "dev:staging": "vite --mode staging",
    "build": "tsc -b && vite build",
    "build:staging": "tsc -b && vite build --mode staging",
    "preview": "vite preview",
    "lint": "eslint .",
    "typecheck": "tsc -b --noEmit"
  },
  "dependencies": {
    "@hookform/resolvers": "5.9.1",
    "axios": "1.20.0",
    "bootstrap": "5.3.8",
    "react": "19.3.0",
    "react-bootstrap": "2.10.10",
    "react-bootstrap-icons": "1.11.6",
    "react-dom": "19.3.0",
    "react-hook-form": "7.88.0",
    "react-router": "8.3.1",
    "zod": "4.6.5",
    "zustand": "5.0.15"
  },
  "devDependencies": {
    "@eslint/js": "10.0.1",
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    "@vitejs/plugin-react": "6.1.1",
    "eslint": "10.10.0",
    "eslint-plugin-react-hooks": "7.1.1",
    "eslint-plugin-react-refresh": "0.5.6",
    "globals": "17.12.0",
    "typescript": "5.9.3",
    "typescript-eslint": "8.70.0",
    "vite": "8.3.0"
  }
}
```

Then `npm install`. Read the list while it runs: `react` + `react-dom` (the
component model and the browser renderer — two packages on purpose),
`@types/react` (React ships no types of its own), `bootstrap` (the CSS) and
`react-bootstrap` (the components), the axios / RHF + zod / React Router /
Zustand rows from Block 4, and the ESLint stack. The `dev:staging` and
`build:staging` scripts are for Demo 6's `.env.staging`; they cost nothing now.

**D. The three tsconfig files**

`tsconfig.json` — replace:

```json
{
  "files": [],
  "references": [{ "path": "./tsconfig.app.json" }, { "path": "./tsconfig.node.json" }]
}
```

`tsconfig.app.json` — replace. Compare with the template's as you go: same
bundler-mode block, `ES2022` instead of `es2023`, `DOM.Iterable` added,
`strict` **added** (the template leaves it off), and comments that say why:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* vite/client declares `import "./x.css"` and import.meta.env.
       Without it the CSS import in main.tsx is an error. */
    "types": ["vite/client"],

    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Strict on from day one. Turning strictness ON later means fixing
       hundreds of errors at once; leaving it on from the start means fixing
       them one at a time, as you write them. */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src"]
}
```

`tsconfig.node.json` — replace. It types exactly one file:

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "types": ["vite/client"],
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["vite.config.ts"]
}
```

Note what is *not* here compared with Session 1's tsconfig:
`noUncheckedIndexedAccess`. You have felt it once; the demos leave it off so
the React code reads quieter. Turning it on is a fine team decision.

**E. `vite.config.ts` — replace**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Deliberately minimal. Bootstrap ships as plain CSS (imported in main.tsx),
// so there is no CSS plugin, no PostCSS, no tailwind.config — one plugin.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, host: true },
});
```

`react()` is what turns JSX into JavaScript and wires Fast Refresh. `host:
true` lets a phone on the same Wi-Fi open the dev server — useful in Demo 16.

**F. `eslint.config.js` — create**

```js
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // `rules-of-hooks` is the one rule you must never disable — it catches
      // conditional hook calls, which corrupt React's internal state silently.
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // A leading underscore means "intentionally unused" — stubs use it for arguments a later lab fills in.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
);
```

Flat config: an array of blocks, each saying which files it applies to.
`allowConstantExport: true` lets a file export a component *and* a
primitive constant without the refresh warning — a `const PAGE_SIZE = 12`
next to a component is fine; an exported function is not.

**G. `index.html` — replace**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ShopScope</title>
    <meta name="description" content="ShopScope — the product explorer you build across the React demo track." />
  </head>
  <body>
    <!-- React mounts here. This is the ONLY element the server sends;
         everything else on the page is created by React at runtime. -->
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

No favicon link (the template's pointed at `public/`, which is gone). The
comment on `#root` is Block 3 in one sentence.

**H. `src/vite-env.d.ts` — create**

```ts
/// <reference types="vite/client" />
```

The template stopped generating this file; the track keeps it because it
makes `import.meta.env` and `import './x.css'` typed *in the editor* even
before `tsconfig` is read. One line.

**I. `src/index.css` — replace**

```css
/*
 * Intentionally (almost) empty.
 *
 * Bootstrap's stylesheet is imported in main.jsx and does all the work.
 * Everything visual in this track is a React Bootstrap component or a
 * Bootstrap utility class — there is no custom CSS to learn or maintain.
 */
```

(Yes, the comment says `main.jsx`; the file is `main.tsx`. It is the shipped
file — copy it as it is, and remember that `diff` does not forgive.)

**J. `src/main.tsx` — replace**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css'; // ← must come before ./index.css
import './index.css';
import App from './App';

/**
 * The entry point. Three things happen here and nowhere else:
 *
 *  1. `createRoot` attaches React to the single <div id="root"> in index.html.
 *     The `!` tells TypeScript "this element exists" — getElementById returns
 *     `HTMLElement | null`, and we know index.html has it.
 *  2. `<StrictMode>` turns on development-only checks. It DOUBLE-INVOKES your
 *     component bodies and effects to surface accidental side effects. That is
 *     why a console.log may appear twice — it is a feature, and Demo 5 covers
 *     exactly what it catches. It does not happen in production builds.
 *  3. Stylesheets are imported as modules. Vite handles CSS as part of the
 *     graph; there is no <link> tag in the HTML.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

Three changes from the template: the Bootstrap import (before `index.css`),
`'./App'` without the `.tsx` extension (a track convention, not a
requirement), and the comment. The `!` is Session 1 Lab 7's `!` — you wrote
`index.html`, you know `#root` is there.

**K. Port Session 1's files**

```bash
mkdir -p src/lib src/data src/components
cp ../00b-react-introduction-and-toolchain/starter/src/types.ts src/types.ts
cp ../00b-react-introduction-and-toolchain/starter/src/lib/format.ts src/lib/format.ts
cp ../00b-react-introduction-and-toolchain/starter/src/data/sampleProducts.ts src/data/sampleProducts.ts
```

Nothing changes in any of them. `Product` is `Product`; `formatPrice` is
`formatPrice`; React does not care that they exist. This is the point of
Session 1: the language layer is portable, and the React layer sits on top.

**L. `src/App.tsx` — your first component**

Replace the file:

```tsx
import { sampleProducts } from './data/sampleProducts';
import { formatPrice } from './lib/format';

/**
 * A component is a function from props to UI. This one has no props and
 * returns a description — not DOM — of a heading and a list.
 */
export default function App() {
  return (
    <main>
      <h1>ShopScope</h1>
      <ul>
        {sampleProducts.map((p) => (
          <li key={p.id}>
            {p.title} — {formatPrice(p.price)}
          </li>
        ))}
      </ul>
    </main>
  );
}
```

Read it against Session 1: `sampleProducts.map((p) => …)` is Lab 1's
expression, and it is *inside the markup* because JSX's `{}` takes
expressions. `key={p.id}` is Block 2's promise to React. `export default`
because Vite's `main.tsx` imports a default — one of the two places the
track uses one.

`npm run dev`. Three titles with prices. That is React rendering your
Session 1 data.

**M. Land on Demo 1's starting line**

Demo 1 begins from a header component and four small component *stubs*, each
carrying Demo 1's own `TODO` markers — next session's work, not this
session's. Copy them from the shipped starter, together with its `README.md`
and the two dotfiles:

```bash
cp ../01-components-jsx-props/starter/src/App.tsx src/App.tsx
cp ../01-components-jsx-props/starter/src/components/*.tsx src/components/
cp ../01-components-jsx-props/starter/README.md README.md
cp ../01-components-jsx-props/starter/.gitignore .gitignore
cp ../01-components-jsx-props/starter/.stackblitzrc .stackblitzrc
```

Open the new `src/App.tsx`. Your `map` is gone, replaced by a `<SiteHeader />`
and a `<Container>` from React Bootstrap — read `SiteHeader.tsx` and find
`NAV_LINKS`, the module-local constant Block 5's Concept mentioned. Open
`.stackblitzrc`: two keys that tell StackBlitz to install and run `npm run
dev` when someone opens the fork link. Open `.gitignore`: five lines;
`*.local` is what keeps `.env.local` out of git (step P).

### Verify

1. **The diff.** From `demos/`:
   ```bash
   diff -r --exclude node_modules --exclude dist --exclude '*.tsbuildinfo' shopscope 01-components-jsx-props/starter
   ```
   **No output.** If a file is listed, open both versions side by side; the
   usual culprits are a trailing newline, `main.jsx` vs `main.tsx` in
   `index.css`, or a leftover `public/`.
2. **The three checks.** `npm run typecheck && npm run lint && npm run build`
   — all clean. `tsc -b` will also drop two `*.tsbuildinfo` files in the
   project root; that is why the diff excludes them.
3. **The double log.** In `src/App.tsx`, add `console.log('App rendered');`
   as the first line of the function. `npm run dev`, open the console: **two
   lines**. That is `<StrictMode>` rendering twice to check purity. Now
   `npm run build && npm run preview`, open `http://localhost:4173`: **one
   line**. Stripped in production. Remove the `console.log`.
4. **`rules-of-hooks`.** In `App.tsx`, add `import { useState } from 'react';`
   and, inside the function, `if (sampleProducts.length > 2) { useState(0); }`.
   `npm run lint`:
   ```
   error  React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render  react-hooks/rules-of-hooks
   ```
   Remove both lines.
5. **`only-export-components`.** In `App.tsx`, add `export function helper() { return 1; }`
   below the component. `npm run lint`:
   ```
   warning  Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components  react-refresh/only-export-components
   ```
   Remove it. (An exported `const PAGE_SIZE = 12` would *not* warn —
   `allowConstantExport`.)
6. **React DevTools.** With the dev server open, the Components tab shows
   `App › SiteHeader › Navbar …` — React Bootstrap's components are React
   components too, all the way down. Click `SiteHeader`: no props yet. Demo 1
   Lab 1 gives it one.
7. **`.env` in one minute.** Create `.env.local` with two lines:
   ```
   VITE_APP_NAME=ShopScope (local)
   API_SECRET=do-not-do-this
   ```
   In `App.tsx`, temporarily `console.log(import.meta.env)`. Reload: you see
   `VITE_APP_NAME` — and **not** `API_SECRET`. Only `VITE_`-prefixed variables
   are compiled into the bundle; the prefix is a *reminder that everything in
   it is public*, not a way to keep secrets. Anything a browser downloads,
   anyone can read. Demo 6 validates these with zod and adds three committed
   `.env.*` files. Delete `.env.local` and the log line — then re-run the diff
   from step 1. Still empty.
8. `git status` from the repo root shows `demos/shopscope/` as untracked.
   Keep it as your reference copy or delete it — Demo 1 works in
   `01-components-jsx-props/starter`.

### Watch out

**`npm install` after step A instead of after step C.** You installed the
template's floating versions and TypeScript 6. Delete `node_modules` and
`package-lock.json`, replace `package.json`, install again. The order matters
because the lockfile records what was *actually* installed.

**Bootstrap imported after `index.css`.** Everything still looks fine today
because `index.css` is empty — and the first override you write in Demo 16
silently loses. Fix the order now, while the diff catches it.

**`import App from './App.tsx'`.** Legal (`allowImportingTsExtensions`), and
not what the shipped file says. The diff will tell you.

**`Cannot find module 'bootstrap/dist/css/bootstrap.min.css'` or a red
squiggle on the CSS import.** Either `npm install` has not run yet, or
`vite-env.d.ts` / `"types": ["vite/client"]` is missing — that is what
declares `*.css` as importable.

**Node 20.** `react-router@8.3.1` refuses to install under Node 20 (an
`engines` check). `node -v` must say 22.22 or later.

### Challenge (2 min)

Turn `noUncheckedIndexedAccess` on in `tsconfig.app.json` and run
`npm run typecheck`. Find the one line in the Demo 1 stubs that stops
compiling and say why — then turn it off again (the diff, remember).

### In the real world

Nobody scaffolds by hand at work; they clone. But the person on the team who
can explain *why* `strict` is on, what `rules-of-hooks` prevents, why the
versions are pinned and why the CSS imports are in that order is the person
who gets asked to set up the next project. The `diff -r` habit is real too:
"reproduce the environment exactly" is how you debug a build that works on
one machine and not another.

---

## Wrap-up — what you can now do

- [x] Explain declarative rendering with the wishlist heart: the DOM is a function of the data, so there is nothing to sync
- [x] Name the four ideas React is built on and the six things it is not — and the library this program picked for each
- [x] Describe trigger → render → commit, reconciliation and why components must be pure
- [x] Compare CSR, SSR and SSG on where the HTML is made, first paint, SEO, freshness and hosting; define hydration
- [x] Run the five-question worksheet and defend "ShopScope is a Vite CSR app" — including what it costs and when it flips
- [x] Turn Vite's template into a pinned, strict, linted project and prove it with an empty `diff -r`
- [x] Say what `rules-of-hooks`, `exhaustive-deps` and `only-export-components` each catch
- [x] Explain the double `console.log`, the `VITE_` prefix and why neither is a bug

## Next demo

**Demo 1 — Components, JSX & Props.** Into the project you just built: a
header that takes a `cartCount` prop, nav links rendered from data, a
`PageHeader` with a children slot, a `PriceTag` that *derives* the sale
price with your `discountedPrice`, a `StockBadge` with three branches, and a
`ProductCard` composed from all of them — three of your sample products, on
screen, in React Bootstrap.

---

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `diff -r` lists `Only in shopscope: public` (or `src/assets`, `.oxlintrc.json`) | Step B was skipped or partial. `rm -rf` them. |
| `diff -r` lists `tsconfig.app.tsbuildinfo` | You ran `tsc -b` — add `--exclude '*.tsbuildinfo'` to the diff, as in Verify step 1. |
| `diff -r` shows `src/index.css` differs by one word | You "fixed" `main.jsx` to `main.tsx`. Copy the shipped comment as it is. |
| `npm error engine Unsupported engine` mentioning `react-router` | Node 20. Install Node 22.22+ (`nvm install 22`), then `npm install` again. |
| `Cannot find module 'react-bootstrap'` in the editor after step M | `npm install` has not run, or ran against the template's `package.json`. Reinstall after step C. |
| `'React' refers to a UMD global` / `Cannot use JSX unless the '--jsx' flag is provided` | `tsconfig.app.json` is missing `"jsx": "react-jsx"` — replace the file from step D. |
| Bootstrap styles missing — the header is plain text | The `bootstrap/dist/css/bootstrap.min.css` import is missing from `main.tsx`, or `bootstrap` is not installed. |
| `console.log` prints twice | `<StrictMode>`. Expected in development; run `npm run preview` to see it once. Do not remove StrictMode. |
| `React Hook "useState" is called conditionally` | `rules-of-hooks`. Hooks go at the top level of the component, unconditionally. |
| `Fast refresh only works when a file only exports components` | `only-export-components`. Move the helper to its own file, or make it a non-exported `const`. |
| `import.meta.env.API_SECRET` is `undefined` | Working as designed — only `VITE_`-prefixed variables reach the bundle. And a secret should never be in one. |
| Port 5173 already in use | Session 1's dev server is still running. Stop it, or let Vite pick 5174 and read the terminal for the URL. |
| `Property 'env' does not exist on type 'ImportMeta'` | `vite-env.d.ts` is missing or `"types": ["vite/client"]` is not in `tsconfig.app.json`. |
