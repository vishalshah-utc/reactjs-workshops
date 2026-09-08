# Module 2 — Introduction to React & Getting Started

**Study notes** · ~3–4 hours of reading + setup

> **Goal.** By the end of this module you know what React actually is, what
> problem it solves, how it thinks, and you have a React app running on your
> own machine — started with the tool the React team recommends today, not the
> one every three-year-old tutorial still shows.

---

## Contents

1. [What is React?](#1-what-is-react)
2. [The problem React solves](#2-the-problem-react-solves)
3. [Declarative vs imperative](#3-declarative-vs-imperative)
4. [The four ideas React is built on](#4-the-four-ideas-react-is-built-on)
5. [How React updates the screen](#5-how-react-updates-the-screen)
6. [What React is *not*](#6-what-react-is-not)
7. [The React ecosystem in 2026](#7-the-react-ecosystem-in-2026)
8. [Choosing how to start a React app](#8-choosing-how-to-start-a-react-app)
9. [Summary comparison](#9-summary-comparison)
10. [Option 1 — Create React App (CRA): the deprecated legacy option](#10-option-1--create-react-app-cra-the-deprecated-legacy-option)
11. [Option 2 — Vite: the modern standard for client-side apps](#11-option-2--vite-the-modern-standard-for-client-side-apps)
12. [Option 3 — Full-stack frameworks (Next.js, Remix, React Router v7)](#12-option-3--full-stack-frameworks-nextjs-remix-react-router-v7)
13. [Option 4 — Custom bundlers (Webpack, Rspack, Parcel)](#13-option-4--custom-bundlers-webpack-rspack-parcel)
14. [Hands-on: your first app with Vite](#14-hands-on-your-first-app-with-vite)
15. [Anatomy of the generated project](#15-anatomy-of-the-generated-project)
16. [From `index.html` to pixels: the boot sequence](#16-from-indexhtml-to-pixels-the-boot-sequence)
17. [Your first component, line by line](#17-your-first-component-line-by-line)
18. [Strict Mode, and why your `console.log` prints twice](#18-strict-mode-and-why-your-consolelog-prints-twice)
19. [The developer toolchain](#19-the-developer-toolchain)
20. [Building for production](#20-building-for-production)
21. [Adding React to an existing project](#21-adding-react-to-an-existing-project)
22. [Common setup problems](#22-common-setup-problems)
23. [Self-check](#23-self-check)
24. [References](#24-references)

---

## 1. What is React?

React is **a JavaScript library for building user interfaces out of
components**. That is the whole elevator pitch, and every word in it is doing
work:

- **Library, not framework.** React itself does one job: given your data, it
  produces and maintains a UI. It has no opinion about routing, data fetching,
  styling, or how you talk to a server. You assemble those, or you adopt a
  framework that has assembled them for you.
- **User interfaces.** Not just web pages — the same component model drives
  React Native (native mobile), and React renderers exist for other targets.
  This course is web.
- **Components.** Independent, reusable pieces that each own a slice of the
  screen and the logic behind it.

It was created at Facebook, open-sourced in 2013, and is now maintained by
Meta together with a large community. The current major version is **React 19**.

📖 [react.dev — Quick Start](https://react.dev/learn)

---

## 2. The problem React solves

Before component libraries, a dynamic page was built by finding elements and
mutating them by hand:

```js
// jQuery-era code — a cart badge that updates when items change
let cartCount = 0;

function addToCart(product) {
  cartCount++;
  document.querySelector('#cart-count').textContent = cartCount;
  document.querySelector('#cart-badge').classList.toggle('hidden', cartCount === 0);
  document.querySelector('#checkout-btn').disabled = cartCount === 0;
  document.querySelector('#empty-message').style.display = cartCount ? 'none' : 'block';

  const row = document.createElement('li');
  row.textContent = product.name;
  document.querySelector('#cart-items').appendChild(row);
}
```

This works, and it does not scale. Three specific things go wrong:

1. **The truth is spread across the DOM.** "How many items are in the cart?"
   has no single answer — it is implied by a `textContent`, a CSS class, a
   `disabled` attribute and a `display` style, and any one of them can drift
   out of sync with the others.
2. **Every new feature multiplies the update sites.** Add a "free shipping over
   $50" banner and you must remember to touch it in `addToCart`,
   `removeFromCart`, `clearCart` and `applyCoupon`. Miss one and you have a
   bug that only appears down one path.
3. **Nothing is reusable.** The markup, the styling hooks and the update logic
   for a product card live in three different files, wired together by string
   selectors that no tool can check.

React's answer: **stop describing changes, describe the result.** You write a
function that says what the UI looks like *for a given state*, and React works
out the DOM operations needed to get there.

```jsx
function Cart({ items }) {
  return (
    <div>
      {items.length > 0 && <Badge count={items.length} />}
      <ul>
        {items.map((item) => <li key={item.id}>{item.name}</li>)}
      </ul>
      {items.length === 0 && <p>Your cart is empty</p>}
      <button disabled={items.length === 0}>Checkout</button>
    </div>
  );
}
```

One source of truth (`items`). One place that describes the whole cart. Add the
free-shipping banner and there is exactly one file to change, and it is
impossible for the banner to disagree with the badge.

---

## 3. Declarative vs imperative

| | Imperative | Declarative |
|---|---|---|
| You write | the *steps* to change the UI | the UI *for a given state* |
| Analogy | turn-by-turn driving directions | a destination address |
| Example | `el.classList.add('active')` | `className={isActive ? 'active' : ''}` |
| Bugs come from | forgetting a step on some path | getting the state wrong |
| Scaling | update sites × states | one description per component |

The payoff is not less code — it is that the number of *interactions between
pieces* stops growing. In imperative UI code, every new piece of state can
potentially affect every element, and you are responsible for all the
combinations. In declarative UI, you declare the mapping once and React handles
the combinations.

📖 [react.dev — Reacting to Input with State](https://react.dev/learn/reacting-to-input-with-state)

---

## 4. The four ideas React is built on

Everything in the rest of this course is a consequence of these four.

### 4.1 Components

A component is a JavaScript function that returns markup. That is it.

```jsx
function StockBadge({ stock }) {
  if (stock === 0) return <span className="badge badge--out">Out of stock</span>;
  if (stock < 5) return <span className="badge badge--low">Only {stock} left</span>;
  return <span className="badge">In stock</span>;
}
```

Components compose into a tree, exactly like HTML elements do — except your
components can carry behaviour, and they are yours to name:

```jsx
<App>
  <SiteHeader />
  <ProductGrid>
    <ProductCard>
      <ProductImage />
      <PriceTag />
      <StockBadge />
    </ProductCard>
  </ProductGrid>
</App>
```

Two hard rules: a component's name must start with a **capital letter** (that
is how JSX distinguishes `<StockBadge />` from `<span />`), and it must be
**pure** — same inputs, same output, no side effects during render.

📖 [react.dev — Your First Component](https://react.dev/learn/your-first-component)

### 4.2 JSX

JSX is an extension to JavaScript that lets you write markup inside your code.
It is not a template language and it is not HTML in strings — it compiles to
plain function calls:

```jsx
// what you write
const el = <h1 className="title">Hello</h1>;

// roughly what the compiler emits
const el = jsx('h1', { className: 'title', children: 'Hello' });
```

Because it is JavaScript, all of JavaScript is available inside it — which is
why [Module 1](../01-javascript-foundations/) came first. And because it is
JavaScript, it has JavaScript's constraints: `class` is a reserved word, so JSX
uses `className`; attributes are camelCase (`onClick`, `tabIndex`,
`htmlFor`); every tag must be closed (`<br />`); and one component returns one
root element (wrap siblings in a `<>…</>` fragment).

📖 [react.dev — Writing Markup with JSX](https://react.dev/learn/writing-markup-with-jsx)

### 4.3 One-way data flow

Data flows **down** through props. Events flow **up** through callbacks.

```jsx
function ProductList({ products, onAddToCart }) {          // data in, callback in
  return products.map((p) => (
    <ProductCard key={p.id} product={p} onAdd={onAddToCart} />
  ));
}
```

A child can never reach up and change its parent's data directly. It can only
call a function the parent gave it. That single constraint is why React apps
stay debuggable at scale: when a value is wrong, it came from exactly one
place, and you can walk up the tree to find it.

📖 [react.dev — Passing Props to a Component](https://react.dev/learn/passing-props-to-a-component)

### 4.4 State

Props come from the outside. **State** is memory a component owns:

```jsx
import { useState } from 'react';

function WishlistButton() {
  const [saved, setSaved] = useState(false);

  return (
    <button onClick={() => setSaved(!saved)} aria-pressed={saved}>
      {saved ? '♥ Saved' : '♡ Save'}
    </button>
  );
}
```

Calling `setSaved` does two things: it stores the new value, and it tells React
"this component's output may have changed — re-run it." React then re-renders,
your function returns different markup, and React updates the screen.

📖 [react.dev — State: A Component's Memory](https://react.dev/learn/state-a-components-memory)

---

## 5. How React updates the screen

Three phases, and knowing the names makes every future error message readable.

**1. Trigger.** Either the initial render (your app mounts) or a state update
somewhere in the tree.

**2. Render.** React calls your component functions. Rendering does *not* touch
the DOM — it produces a lightweight description of what the UI should be (a
tree of plain JavaScript objects). React then compares this to the previous
description to find the differences. This comparison is **reconciliation**; the
in-memory tree is what people loosely call the "virtual DOM".

**3. Commit.** React applies the minimum set of real DOM operations needed. If
only a text node changed, only that text node is touched — the surrounding
elements are not recreated, so focus, scroll position and text selection
survive.

```
state update  →  render (call components, diff)  →  commit (patch the DOM)  →  browser paints
```

Two practical consequences you will meet immediately:

- **Rendering must be cheap and pure**, because React may render more often
  than you expect, may render and throw the result away, and (in development
  Strict Mode) will deliberately render twice.
- **`key` matters.** When React diffs a list, `key` is how it decides which
  item is which. Wrong or missing keys make React destroy and recreate rows
  that should have moved, losing their state.

📖 [react.dev — Render and Commit](https://react.dev/learn/render-and-commit)
📖 [react.dev — Understanding Your UI as a Tree](https://react.dev/learn/understanding-your-ui-as-a-tree)

---

## 6. What React is *not*

Setting expectations correctly here saves a lot of confusion later.

| React does not include | You get it from |
|---|---|
| Routing | React Router, or your framework's router |
| Server-state management / caching | TanStack Query, SWR, or framework loaders |
| Global client state | Context, Zustand, Redux Toolkit, Jotai |
| Forms & validation | React Hook Form + Zod, or framework actions |
| Styling | CSS, CSS Modules, Tailwind, CSS-in-JS |
| HTTP client | `fetch`, axios |
| Build tooling | Vite, or your framework |
| Testing | Vitest/Jest + Testing Library, Playwright |

This is a deliberate design choice, and it cuts both ways: React survives
ecosystem churn because it is not coupled to any of it, but "learning React"
professionally means learning React *plus* a stack. This course teaches React
first, then adds one layer at a time.

---

## 7. The React ecosystem in 2026

What has changed, so that you can read older material critically:

- **Function components and hooks won.** Class components still work and still
  exist in codebases, but no new code should use them. Anything teaching
  `componentDidMount` as the default is out of date.
- **Create React App is deprecated.** It was sunset by the React team; see
  [§10](#10-option-1--create-react-app-cra-the-deprecated-legacy-option).
- **The docs recommend starting with a framework.** react.dev's "Creating a
  React App" page leads with full-stack frameworks, with a plain build tool as
  the documented alternative.
- **React 19 shipped Server Components, Server Functions, and Actions.** This
  moves part of your React code to the server by default in frameworks that
  support it. It does not change how components, props and state work — but it
  does change where your data fetching lives.
- **The React Compiler** can memoise your components automatically, reducing
  the need for hand-written `useMemo`/`useCallback`.
- **`forwardRef` is no longer needed** in React 19 — `ref` is a normal prop for
  function components.

📖 [react.dev — Creating a React App](https://react.dev/learn/creating-a-react-app)
📖 [react.dev blog — React 19](https://react.dev/blog/2024/12/05/react-19)

---

## 8. Choosing how to start a React app

To understand the shift here, remember that React only renders components — it
does not know how your files get to the browser. Something has to compile JSX,
resolve imports, serve a dev server, and produce an optimised production
bundle. That "something" is your **build tool** or **framework**, and picking it
is the first real decision you make.

There are four routes, and they are genuinely different products, not four
flavours of the same thing.

---

## 9. Summary comparison

| Feature | Create React App (CRA) | Vite | Full-Stack Frameworks (Next.js / Remix) | Custom Bundler (Webpack / Rspack) |
|---|---|---|---|---|
| **Primary use case** | Legacy projects (**deprecated**) | Modern Single Page Apps (SPAs) | Production-grade, SEO-heavy apps | Large enterprise apps with custom needs |
| **Under the hood** | Webpack + Babel | Esbuild + Rollup | Webpack, Turbopack, or Vite | Webpack, Rspack, or Parcel |
| **Dev server speed** | Slow (rebuilds the whole bundle) | Blazing fast (uses native ES modules) | Fast (utilises server-side optimisations) | Slow to moderate (depends on optimisation) |
| **Architecture** | Client-Side Rendering (CSR) | Client-Side Rendering (CSR) | SSR, SSG, and client-side | Custom / client-side |
| **Configurability** | Zero config (requires "ejecting" to change) | Easy config (`vite.config.js`) | Opinionated but highly flexible | Manual setup from scratch |

CSR, SSR and SSG are the subject of [Module 3](../03-rendering-architectures/)
— read that before committing to a choice for a real project.

---

## 10. Option 1 — Create React App (CRA): the deprecated legacy option

CRA was designed by the React team to provide a **zero-configuration** setup
using **Webpack and Babel**. For years, `npx create-react-app my-app` was *the*
answer to "how do I start a React project", which is why it still dominates
tutorials, course material and Stack Overflow answers.

**The problem:** it crawls and bundles your **entire codebase** before it can
serve the app locally. As your project grows, local startup times and Hot
Module Replacement (HMR) get incredibly slow — a large app can take a minute or
more to start, and several seconds to reflect a one-character edit. It also
locked you out of configuration: to change anything you had to `eject`, which
dumped the whole Webpack config into your repo and made you its permanent
maintainer.

**Status:** **it no longer receives updates.** The React team has officially
deprecated it and actively advises against using it for new projects. Beyond
the speed problem, it never gained support for the modern React features that
matter — Server Components, streaming, and the rendering strategies in
Module 3 — because it is architecturally a client-only bundler.

```bash
# ⚠️  Do not do this for a new project.
npx create-react-app my-app
```

**What to do if you inherit a CRA app:** you do not have to rewrite it. Migrate
the build tool while keeping the application code, most commonly to Vite (the
component code is unchanged; you move `public/index.html`, swap
`react-scripts` for `vite`, rename `.js` files containing JSX to `.jsx`, and
convert `process.env.REACT_APP_*` to `import.meta.env.VITE_*`). The React team's
sunset post documents migration paths to frameworks too.

📖 [react.dev blog — Sunsetting Create React App](https://react.dev/blog/2025/02/14/sunsetting-create-react-app)

---

## 11. Option 2 — Vite: the modern standard for client-side apps

Vite (French for "fast", pronounced *veet*) is currently the most popular way
to start a standard React app.

**How it works.** Instead of bundling everything upfront, Vite leverages
**native ES Modules (ESM)** in modern browsers. During development it serves
your source files over HTTP and lets the browser's own module loader request
them — so it only processes **the specific file you are looking at**, on demand.
It uses **esbuild** (written in Go) for ultra-fast dependency pre-bundling and
transformation, and **Rollup** for clean, highly-optimised production builds.

```
CRA (dev):   [ bundle EVERY file ] ──────────────► serve one big bundle
                 slow, and gets slower as the app grows

Vite (dev):  serve index.html ──► browser requests only what it needs
                 transform-on-demand; start time is ~constant
```

**Why choose it.** Local server start-up and code updates (HMR) are nearly
instantaneous, **regardless of project size** — a cold start is typically well
under a second, and an edit appears in the browser before you have moved your
hand off the keyboard. On top of that: first-class TypeScript support, a small
and readable `vite.config.js` you are *encouraged* to edit (no ejecting), and a
large plugin ecosystem.

**What it does not give you.** Vite builds a **client-rendered** app. There is
no server-side rendering, no routing, no data-fetching layer, and no Server
Component support out of the box. For an app behind a login that is exactly
right. For a public, SEO-sensitive site it is the wrong starting point — see
[Module 3](../03-rendering-architectures/).

```bash
npm create vite@latest my-app -- --template react-ts
```

**Use Vite when:** the app is behind authentication, SEO is irrelevant, you
want the simplest possible mental model and the fastest possible feedback loop,
and static hosting (a CDN, GitHub Pages, Netlify, Vercel, S3) is enough.

📖 [react.dev — Build a React App from Scratch](https://react.dev/learn/build-a-react-app-from-scratch)

---

## 12. Option 3 — Full-stack frameworks (Next.js, Remix, React Router v7)

The React team now **officially recommends starting new projects with a
framework**.

**How they work.** Unlike CRA or Vite — which build purely Client-Side Rendered
(CSR) applications — frameworks allow for **Server-Side Rendering (SSR)** and
**Static Site Generation (SSG)**. Your components can run on a server (or at
build time), produce real HTML, and then be made interactive in the browser.
They also unlock React 19's Server Components and Server Functions, which let a
component fetch from your database directly without you writing an API layer.

**Why choose them.** They come with built-in routing, data-fetching
optimisations, image optimisation, code-splitting, caching and SEO handling out
of the box — the twelve decisions you would otherwise make yourself, made
consistently. If you are building a consumer-facing application or a large
enterprise app, a framework is the ideal choice.

The main options:

| Framework | Shape | Notable for |
|---|---|---|
| **Next.js** | The most widely adopted React framework | App Router, Server Components, SSG + SSR + ISR in one app, image/font optimisation, deep Vercel integration (deploys anywhere Node runs) |
| **React Router v7** | The evolution of Remix, now merged into React Router | Incremental adoption — can run as a library, a Vite plugin, or a full SSR framework; strong nested-routing and data model |
| **Remix** | Web-standards-first full stack | `Request`/`Response`, forms and progressive enhancement; its work now continues in React Router v7 |
| **Expo** | React Native + web | The recommended route when you need real native mobile apps from a React codebase |

```bash
npx create-next-app@latest my-app
npx create-react-router@latest my-app
```

**The cost, stated plainly.** A framework means more concepts on day one
(routing conventions, the server/client boundary, caching semantics) and, for
SSR, a **running Node or edge server** to host — not just a static file host.
For a two-hour learning exercise that is overhead. For a product with real
users it is the overhead you were going to pay anyway, done better.

📖 [react.dev — Creating a React App](https://react.dev/learn/creating-a-react-app)
📖 [react.dev — Server Components](https://react.dev/reference/rsc/server-components)

---

## 13. Option 4 — Custom bundlers (Webpack, Rspack, Parcel)

For developers who want complete architectural control, you can skip
initialisation tools entirely and build your environment from scratch.

- **Webpack** — the traditional giant. Complex to set up manually, but highly
  customisable, and still the most battle-tested option for unusual
  requirements (module federation across independently deployed apps, exotic
  asset pipelines, strict corporate build constraints).
- **Rspack / Rsbuild** — a high-performance, **Rust-based** alternative that
  drops right into Webpack ecosystems, with a largely compatible config and
  order-of-magnitude faster builds. The standard modernisation path for a large
  existing Webpack setup.
- **Parcel** — a zero-configuration compiler that handles complex
  configurations automatically without needing a config file.

**What "from scratch" actually costs.** You are responsible for the JSX
transform, module resolution and aliases, CSS handling, static assets, source
maps, environment variables, code splitting, HMR, production minification and
tree-shaking, and keeping all of it working as versions move. That is a real
and ongoing job.

**Choose this only when** you have a requirement no off-the-shelf tool meets —
a micro-frontend architecture, a monorepo build shared with non-React apps, or
a locked-down enterprise pipeline. Otherwise the honest answer is Vite or a
framework.

📖 [react.dev — Build a React App from Scratch](https://react.dev/learn/build-a-react-app-from-scratch)

---

### Decision shortcut

```
Is the app public and does search ranking / link previews matter?
├─ YES ──► Full-stack framework (Next.js / React Router v7)
└─ NO
   │
   Is it behind a login, or an internal tool / dashboard?
   ├─ YES ──► Vite
   └─ Unsure ──► Vite is the cheaper mistake: migrating Vite → framework
                 later is normal work. Guessing wrong on SEO is not
                 recoverable without a rewrite.

Inheriting a Create React App project?  ──► migrate the build tool, keep the code.
Have a requirement neither covers?      ──► custom bundler, eyes open.
```

For this study track we use **Vite**, because it puts nothing between you and
React while you are learning React. Module 3 explains exactly what that
choice costs and when to make a different one.

---

## 14. Hands-on: your first app with Vite

### Prerequisites

```bash
node -v      # need 20.19+ or 22.12+
npm -v
```

If Node is missing or old, install the current LTS from nodejs.org, or use a
version manager (`nvm`, `fnm`, `volta`) — worth it the first time you have two
projects on different Node versions.

You also want:

- A code editor — **VS Code** is the default choice, with the *ESLint* and
  *Prettier* extensions.
- **React Developer Tools** in your browser
  ([Chrome](https://chromewebstore.google.com/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi) ·
  [Firefox](https://addons.mozilla.org/firefox/addon/react-devtools/)) — it adds
  **Components** and **Profiler** tabs to devtools and is not optional for
  serious work.

📖 [react.dev — React Developer Tools](https://react.dev/learn/react-developer-tools)

### Create and run

```bash
npm create vite@latest shopcrew -- --template react-ts
cd shopcrew
npm install
npm run dev
```

Open <http://localhost:5173>. Edit `src/App.tsx`, save, and watch the browser
update **without losing state** — that is Hot Module Replacement.

> Use `--template react` instead of `react-ts` for plain JavaScript. This course
> shows TypeScript in later modules because that is what professional React
> looks like, but every concept works identically in JS.

The four scripts you get:

```bash
npm run dev        # dev server with HMR
npm run build      # type-check + production build into dist/
npm run preview    # serve dist/ locally — verify the real build
npm run lint       # ESLint
```

---

## 15. Anatomy of the generated project

```
shopcrew/
├── index.html            ← the real entry point. Not in src/. This surprises everyone.
├── package.json          ← dependencies + scripts
├── package-lock.json     ← exact resolved versions. COMMIT THIS.
├── vite.config.ts        ← build config. Yours to edit, no ejecting.
├── tsconfig.json         ← TypeScript config
├── eslint.config.js      ← lint rules
├── public/               ← files copied as-is to the site root (favicon, robots.txt)
│   └── vite.svg          ←   referenced as "/vite.svg"
└── src/
    ├── main.tsx          ← boots React, mounts <App /> into #root
    ├── App.tsx           ← your root component
    ├── App.css
    ├── index.css         ← global styles
    ├── assets/           ← images IMPORTED by code (hashed + optimised at build)
    └── vite-env.d.ts
```

Two things to note now:

**`index.html` is the entry point, and it lives at the project root.** Vite
treats it as source, not as a template to be copied — so `<script type="module"
src="/src/main.tsx">` inside it is a real dependency edge that Vite follows.
Coming from CRA (where `index.html` lived in `public/`), this is the first
difference you notice.

**`public/` vs `src/assets/`.** Anything in `public/` is served verbatim at the
root URL and is *not* processed — right for `robots.txt` and a favicon. Anything
you `import` from `src/assets/` goes through the build: it gets a content hash
in its filename (so it can be cached forever and still update), and small files
may be inlined. Prefer `src/assets/`.

---

## 16. From `index.html` to pixels: the boot sequence

**`index.html`** — one empty div, one script:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ShopCrew</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

That `<div id="root"></div>` being empty is the defining fact of a client-side
rendered app. It is also the whole reason Module 3 exists.

**`src/main.tsx`** — the bridge from the DOM to React:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

Line by line:

- `createRoot(domNode)` hands React ownership of that DOM node. Everything
  inside it is React's to manage; do not touch it with `document.querySelector`.
- `.render(<App />)` tells React what to put there. React calls `App`, gets
  markup back, and commits real DOM into `#root`.
- `<StrictMode>` is a development-only wrapper — [§18](#18-strict-mode-and-why-your-consolelog-prints-twice).
- Importing `./index.css` from JavaScript looks strange and is normal: your
  bundler treats CSS as a module so it can be bundled, scoped and hot-reloaded.
- Note the **two packages**: `react` is the component model (platform-agnostic);
  `react-dom` is the renderer that knows about the browser. React Native swaps
  the second one.

📖 [react.dev — `createRoot`](https://react.dev/reference/react-dom/client/createRoot)

**Sequence:**

```
browser GETs index.html
  → sees <script type="module" src="/src/main.tsx">
  → downloads + executes the JS
  → createRoot(#root).render(<App/>)
  → React renders the component tree
  → React commits DOM into #root
  → the user finally sees content
```

Every step in that chain happens **in the user's browser, after JavaScript
loads**. Hold that thought for Module 3.

---

## 17. Your first component, line by line

Replace `src/App.tsx` with something real:

```tsx
import { useState } from 'react';
import './App.css';

const products = [
  { id: 1, name: 'Mechanical Keyboard', price: 4999, stock: 12 },
  { id: 2, name: 'Wireless Mouse',      price: 2999, stock: 0  },
  { id: 3, name: '27" Monitor',         price: 19999, stock: 3  },
];

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <span className="badge badge--out">Out of stock</span>;
  if (stock < 5)   return <span className="badge badge--low">Only {stock} left</span>;
  return <span className="badge">In stock</span>;
}

function ProductCard({ product }: { product: (typeof products)[number] }) {
  const [saved, setSaved] = useState(false);

  return (
    <article className="card">
      <h2>{product.name}</h2>
      <p className="price">{formatPrice(product.price)}</p>
      <StockBadge stock={product.stock} />
      <button onClick={() => setSaved(!saved)} aria-pressed={saved}>
        {saved ? '♥ Saved' : '♡ Save'}
      </button>
    </article>
  );
}

export default function App() {
  return (
    <main>
      <h1>ShopCrew</h1>
      <p>{products.length} products</p>
      <div className="grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </main>
  );
}
```

Nine things are happening here, and all nine are the whole of Module 4–7:

1. **A component is a function returning JSX** — `App`, `ProductCard`,
   `StockBadge`.
2. **Capitalised names** make them components rather than HTML tags.
3. **`{ }` embeds expressions** — `{product.name}`, `{formatPrice(...)}`,
   `{products.length}`.
4. **Props pass data down** — `<StockBadge stock={product.stock} />`.
5. **Destructuring in the parameter list** — `function StockBadge({ stock })`.
6. **`className`, not `class`** — `class` is a reserved JavaScript word.
7. **`.map()` renders a list**, and each item needs a stable **`key`**.
8. **Early `return`s do conditional rendering**, above the main JSX.
9. **`useState` gives each card its own memory** — three cards, three
   independent `saved` values, because state belongs to a component *instance*,
   not to the function.

Point 9 is worth pausing on. `saved` is not one variable shared by three cards.
React keeps a separate state slot per position in the tree, so clicking Save on
the Monitor does nothing to the Keyboard. Confirm it in React DevTools:
**Components** tab → select each `ProductCard` → see its own hooks.

📖 [react.dev — Describing the UI](https://react.dev/learn/describing-the-ui)
📖 [react.dev — Thinking in React](https://react.dev/learn/thinking-in-react)

---

## 18. Strict Mode, and why your `console.log` prints twice

Add `console.log('rendering')` to a component and you will see it twice. Nothing
is broken.

`<StrictMode>` is a development-only tool that deliberately:

- **calls your component functions twice** and throws one result away, to
  surface impure renders (mutating a prop, pushing to an array outside the
  component, generating a random id during render — anything that misbehaves
  when run twice);
- **runs each effect setup → cleanup → setup once extra**, to surface effects
  that forgot to clean up (a subscription that is never removed, a timer that
  is never cleared);
- **warns about deprecated APIs.**

It is stripped from production builds, so it costs your users nothing. **Leave
it on.** If double-rendering breaks your component, the double render did not
cause the bug — it found one. The React Compiler and React's own optimisations
assume the purity that Strict Mode is checking for.

📖 [react.dev — `StrictMode`](https://react.dev/reference/react/StrictMode)
📖 [react.dev — Keeping Components Pure](https://react.dev/learn/keeping-components-pure)

---

## 19. The developer toolchain

Set these up once, at the start, on any project you intend to keep.

| Tool | Job | Why it matters |
|---|---|---|
| **ESLint** | Static analysis | `eslint-plugin-react-hooks` catches broken hook usage and missing effect dependencies — real bugs, not style |
| **Prettier** | Formatting | Ends every formatting argument. Format on save |
| **TypeScript** | Types | Catches the whole "undefined is not a function" family in the editor |
| **React DevTools** | Component inspection + profiling | See props, state and hooks live; find what re-rendered and why |
| **Vitest** | Unit/component tests | Vite-native, Jest-compatible API |
| **Playwright** | End-to-end tests | Real browser, real user flows |

The single highest-value rule to respect is `react-hooks/exhaustive-deps`. When
it complains, it is nearly always right — the fix is to restructure the code,
not to silence the warning.

📖 [react.dev — Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)
📖 [react.dev — React Developer Tools](https://react.dev/learn/react-developer-tools)

---

## 20. Building for production

```bash
npm run build      # → dist/
npm run preview    # serve dist/ at http://localhost:4173
```

`dist/` contains an `index.html` plus hashed asset files
(`assets/index-a1b2c3d4.js`). The hash is the caching strategy: the filename
changes when the content changes, so you can cache these files forever and
still ship updates instantly.

The build also minifies, tree-shakes unused exports, strips development-only
code (including Strict Mode's double-invoke and React's dev warnings), and
splits out anything behind a dynamic `import()`.

**Always run `npm run preview` before you deploy.** The production build differs
from dev in ways that occasionally matter: no Strict Mode double-render,
different environment variables, real asset paths.

### Environment variables in Vite

```bash
# .env.local  — do NOT commit this file
VITE_API_URL=https://api.shopcrew.dev
```

```ts
const apiUrl = import.meta.env.VITE_API_URL;
```

Only variables prefixed `VITE_` are exposed to client code. That prefix is a
safety rail, and it is worth being blunt about why: **anything in a client
bundle is public.** It ships to every visitor's browser and can be read by
anyone. Never put an API secret, a database URL or a private key in a
`VITE_*` variable. Secrets require a server — which is one more reason a
framework matters once you have any.

### Deploying a Vite app

The output is static files, so any static host works: Netlify, Vercel, GitHub
Pages, Cloudflare Pages, S3 + CloudFront, or an nginx container. One
configuration item is mandatory once you add client-side routing — the host
must **rewrite all unknown paths to `/index.html`**, or a browser refresh on
`/products/42` returns a 404. Covered in [Module 14](../14-routing/).

---

## 21. Adding React to an existing project

You do not need a new app to use React. You can render React into any single
DOM node on a page otherwise built with Rails, Django, ASP.NET, WordPress or
plain HTML:

```html
<div id="react-search-widget"></div>
```

```jsx
import { createRoot } from 'react-dom/client';
import SearchWidget from './SearchWidget';

createRoot(document.getElementById('react-search-widget')).render(<SearchWidget />);
```

You can call `createRoot` several times for several independent widgets. This is
the realistic incremental-adoption path in a large existing product: convert one
complicated screen, prove it, expand.

📖 [react.dev — Add React to an Existing Project](https://react.dev/learn/add-react-to-an-existing-project)

---

## 22. Common setup problems

| Symptom | Cause and fix |
|---|---|
| `Unexpected token '<'` | JSX in a `.js` file where the tool expects plain JS. Rename to `.jsx` / `.tsx` |
| `Objects are not valid as a React child` | You rendered an object or array. Render a string/number, or `JSON.stringify(x)` while debugging |
| `Each child in a list should have a unique "key" prop` | Missing `key` on a `.map()`. Use a stable id, never the array index if the list can reorder |
| `Cannot read properties of undefined` | Data has not arrived yet. Use `?.` and render a loading state |
| Component renders nothing, no error | You wrote `{ }` instead of `( )` after `=>`, so the arrow returns `undefined` |
| Handler fires immediately on render | `onClick={handleClick()}` — you called it. Use `onClick={handleClick}` or `onClick={() => handleClick(id)}` |
| `console.log` prints twice | Strict Mode. Expected in development ([§18](#18-strict-mode-and-why-your-consolelog-prints-twice)) |
| State does not update | You mutated instead of replacing (`items.push(x)`), or read a stale value from the render closure. See Module 1 §11 and §13 |
| Blank page, "Failed to resolve module" | Wrong import path or case. `./Button` ≠ `./button` on Linux/CI even if macOS forgave you |
| `Invalid hook call` | A hook called conditionally, in a loop, in a plain function, or you have two copies of React installed |
| Works in dev, blank in production | Check `npm run preview`; usually a base-path or env-var problem |

---

## 23. Self-check

You are ready for Module 3 when you can answer these without looking:

1. Why is React described as a library rather than a framework, and what does
   that mean for a real project?
2. What does "declarative" buy you over `document.querySelector` + mutation?
3. Name the three phases React goes through when state changes.
4. Why must a component be pure, and what does Strict Mode do about it?
5. What is in `index.html` at the moment the browser first parses it, in a Vite
   app?
6. What do `react` and `react-dom` each do, and why are they separate packages?
7. Why was Create React App deprecated? Give two distinct reasons.
8. What does Vite do differently in development that makes it fast?
9. Name two things a full-stack framework gives you that Vite does not.
10. You are asked to build (a) an internal admin dashboard behind SSO and
    (b) a public product catalogue that must rank on Google. Which starting
    point for each, and why?
11. Why can you not put an API secret in a `VITE_*` environment variable?
12. Three `<ProductCard />` elements each have `useState(false)`. Why does
    clicking Save on one not affect the others?

Practical: get the app in [§17](#17-your-first-component-line-by-line) running,
then add a "Save all" button in `App` that marks every card saved. Notice that
you *cannot* do it with the code as written — `saved` lives inside each card,
where the parent cannot reach it. That constraint, and its fix ("lifting state
up"), is [Module 8](../08-state-structure/). Feeling the problem now is the
point.

---

## 24. References

Official React documentation only.

**Getting started**
- [Quick Start](https://react.dev/learn) — the fastest tour of the core ideas
- [Tutorial: Tic-Tac-Toe](https://react.dev/learn/tutorial-tic-tac-toe) — build something end to end
- [Thinking in React](https://react.dev/learn/thinking-in-react) — how to go from a mockup to components
- [Installation](https://react.dev/learn/installation)
- [Creating a React App](https://react.dev/learn/creating-a-react-app) — the team's current recommendation
- [Build a React App from Scratch](https://react.dev/learn/build-a-react-app-from-scratch) — build tools and what they do
- [Add React to an Existing Project](https://react.dev/learn/add-react-to-an-existing-project)
- [React Developer Tools](https://react.dev/learn/react-developer-tools)

**Core concepts introduced here**
- [Describing the UI](https://react.dev/learn/describing-the-ui)
- [Your First Component](https://react.dev/learn/your-first-component)
- [Writing Markup with JSX](https://react.dev/learn/writing-markup-with-jsx)
- [Passing Props to a Component](https://react.dev/learn/passing-props-to-a-component)
- [State: A Component's Memory](https://react.dev/learn/state-a-components-memory)
- [Render and Commit](https://react.dev/learn/render-and-commit)
- [Understanding Your UI as a Tree](https://react.dev/learn/understanding-your-ui-as-a-tree)
- [Keeping Components Pure](https://react.dev/learn/keeping-components-pure)
- [Reacting to Input with State](https://react.dev/learn/reacting-to-input-with-state)

**API reference**
- [`createRoot`](https://react.dev/reference/react-dom/client/createRoot)
- [`StrictMode`](https://react.dev/reference/react/StrictMode)
- [Rules of React](https://react.dev/reference/rules) · [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)

**Tooling history and direction**
- [Sunsetting Create React App](https://react.dev/blog/2025/02/14/sunsetting-create-react-app) — the deprecation, in the team's own words
- [React 19](https://react.dev/blog/2024/12/05/react-19) — Actions, Server Components, `ref` as a prop
- [Server Components](https://react.dev/reference/rsc/server-components)

---

**Previous:** [Module 1 — JavaScript Foundations](../01-javascript-foundations/)
**Next:** [Module 3 — Rendering Architectures: CSR, SSR & SSG](../03-rendering-architectures/)
