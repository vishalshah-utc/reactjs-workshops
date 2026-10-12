# Module 20 — Shipping to Production

**Study notes** · ~2.5 hours
**The module that turns "works on my machine" into "runs for users, observably".**

> **Goal.** Take ShopScope from "works on my machine" to "runs for users,
> observably": a build you understand, configuration that cannot leak a
> secret, a host that serves `/products/42` on refresh, accessibility,
> security and performance budgets in the pipeline, telemetry that tells you
> first — and a list of what to check before every release.

**Prerequisites:** [Module 2 §19–20](../02-react-introduction/#19-the-developer-toolchain)
(the toolchain, a first build), [Module 3](../03-rendering-architectures/)
(what the rendering choice decided), [Module 14](../14-routing/) (lazy
routes), [Module 16](../16-advanced-patterns/) (error boundaries),
[Module 18](../18-testing/) (the suite the gate runs).

---

## Contents

1. ["Deployed is not done"](#1-deployed-is-not-done)
2. [The production build](#2-the-production-build)
3. [Environment configuration per mode](#3-environment-configuration-per-mode)
4. [Deploying a single-page app](#4-deploying-a-single-page-app)
5. [Security for a client app](#5-security-for-a-client-app)
6. [Accessibility as a release gate](#6-accessibility-as-a-release-gate)
7. [SEO and metadata — the limits of CSR](#7-seo-and-metadata--the-limits-of-csr)
8. [Internationalisation with `Intl`](#8-internationalisation-with-intl)
9. [Observability](#9-observability)
10. [The CI quality gate](#10-the-ci-quality-gate)
11. [Maintenance](#11-maintenance)
12. [The release checklist](#12-the-release-checklist)
13. [Self-check](#13-self-check)
14. [References](#14-references)

**Hands-on:** [Demo 22 — Production Readiness](../../demos/22-production-readiness/)
is this module as six labs — accessibility audit, security, SEO and metadata,
internationalisation, observability, the quality gate — run against the
finished ShopScope. [Demo 14 — Advanced HTTP & Shipping](../../demos/14-advanced-http-and-shipping/)
first built it for production, split it into lazy routes and gave it a host
that serves a routed app. Read §2–§4 alongside Demo 14, the rest with Demo 22.

---

## 1. "Deployed is not done"

Run `npx @axe-core/cli` against the preview you deployed at the end of Demo 14.
Then `curl -I` it. Then `curl` the product page and look for the product.

```bash
npx @axe-core/cli https://shopscope-pr-42.netlify.app/products          # 7 violations
curl -I https://shopscope-pr-42.netlify.app/                              # no CSP, no Cache-Control on assets
curl -s https://shopscope-pr-42.netlify.app/products/42 | grep -c '<h1'  # 0
```

The app is up — and unusable with a screen reader, open to injected script,
invisible to link-preview bots, and nobody will know when it breaks.

One rule per stage. Build: **the production build is a different program —
test it**. Configure: **anything in the bundle is public**. Deploy: **the host
must serve `index.html` for every route**. Harden: **never trust the client,
including your own**. Gate: **a check a human must remember is not a check**.
Observe: **if you cannot see it fail, it is failing**.

---

## 2. The production build

[Module 2 §20](../02-react-introduction/#20-building-for-production) gave you
`npm run build` (`tsc -b && vite build` → `dist/`) and `npm run preview`
(serves `dist/` on :4173). This is what the build actually does differently.

### 2.1 What changes

| Development (`vite`) | Build (`vite build`) |
|---|---|
| Files served one by one, transformed on request | One bundle graph: tree-shaken, minified, split at every dynamic `import()` |
| `react-dom`'s development build — prop warnings, hook-order checks, `key` warnings | `react-dom`'s production build — that code is not in the file |
| `<StrictMode>` double-renders and double-invokes effects ([Module 12 §5](../12-effects/#5-strict-modes-double-invoke)) | `<StrictMode>` is a no-op |
| `import.meta.env.DEV === true` | replaced by the literal `false` |
| `main.tsx`, `ProductCard.tsx` | `assets/index-Bq3kZ9x2.js` — content-hashed |
| Source maps always | per `build.sourcemap` — default none |

Vite 8 sets `process.env.NODE_ENV=production` for any `vite build`, whatever
`--mode` you pass; that variable is what resolves React's package `exports` to
`react-dom.production.js`. **A bug Strict Mode found in development is still a
bug in production — it just stops being announced.** A warning you ignored for
weeks ships as the behaviour it warned about.

### 2.2 Two kinds of "dev only"

```ts
if (import.meta.env.DEV) import('@tanstack/react-query-devtools');   // ✓ a compile-time constant: branch AND chunk dropped
if (env.isDev) import('@tanstack/react-query-devtools');             // ✗ a runtime property read: the chunk ships
```

ShopScope's `main.tsx` and `WidgetBoundary` use the raw constant for exactly
this reason; `env.ts` remains the only place for *configuration*.

Tree-shaking likewise removes **unused exports**, not runtime-guarded code:
`import _ from 'lodash'` ships the library. `npm run build:analyze` writes
`dist/stats.html`, a treemap of each chunk — look at it once per release.

### 2.3 Hashing and splitting

```
dist/
  index.html                      ← small, un-hashed, points at everything below
  assets/
    index-Bq3kZ9x2.js             ← the entry chunk
    AccountLayout-C7hj2Kd1.js     ← one chunk per lazy route (Demo 14 Lab 4)
```

The hash is derived from the content. Change one byte of `ProfilePage.tsx` and
only its chunk is renamed; `index.html` is rewritten to point at it. That is
the whole caching strategy of [§4.4](#44-cache-headers): assets are immutable,
`index.html` is not. Splitting happens at every dynamic `import()`; route-level
`lazy` in React Router 8 ([Module 14](../14-routing/)) is the cheap,
high-value split, and the router loads the chunk and runs the loader in
parallel, so it adds no waterfall.

### 2.4 Source maps policy

```ts
// vite.config.ts
build: { sourcemap: 'hidden' },   // generate .map files; do NOT reference them from the .js
```

| `build.sourcemap` | Ships | Use |
|---|---|---|
| `false` (default) | nothing | your error reports are minified gibberish |
| `true` | `.js` + `.map` + a `//# sourceMappingURL=` comment | **never in production** — your source is one DevTools click away |
| `'hidden'` | `.js` + `.map`, no comment | **upload the maps to the error reporter, delete them from `dist/`, deploy** |
| `'inline'` | maps embedded in the `.js` | development only |

**Source maps are uploaded, not served.** [§9.3](#93-source-maps-uploaded-not-served)
has the CI step.

Always `npm run preview` before a deploy: it serves the real `dist/` with the
production env file and no Strict Mode. Check that the console has no
`[debug]` lines, flagged-off features are absent, and `/products/42` survives
a refresh.

📖 [Vite — Building for Production](https://vite.dev/guide/build) · [react.dev — `StrictMode`](https://react.dev/reference/react/StrictMode)

**→ In the demos:** Demo 14 Lab 4 (lazy routes) and Lab 5 (shipping a routed app).

---

## 3. Environment configuration per mode

### 3.1 Which file loads when

| File | Loaded | Committed? |
|---|---|---|
| `.env` | always | yes — shared defaults |
| `.env.local` | always, except under Vitest | **no** — personal overrides |
| `.env.[mode]` | that mode only | yes |
| `.env.[mode].local` | that mode only | **no** |

More specific wins, and a variable already in the shell beats every file.
`vite` runs in mode `development`, `vite build` in `production`, and either
takes `--mode staging` to load `.env.staging` (`npm run build:staging`). What `--mode staging` does *not* change: `import.meta.env.PROD` is still
`true` under any build, and `NODE_ENV` is still `production`. Mode selects
configuration; build-vs-dev selects the program.

### 3.2 The three ShopScope profiles

```bash
# .env.development            # .env.staging                  # .env.production
VITE_LOG_LEVEL=debug          VITE_LOG_LEVEL=info             VITE_LOG_LEVEL=error
VITE_FEATURE_UPLOADS=true     VITE_FEATURE_UPLOADS=true       VITE_FEATURE_UPLOADS=false
VITE_API_TIMEOUT_MS=30000     VITE_API_TIMEOUT_MS=10000       VITE_API_TIMEOUT_MS=10000
VITE_API_BASE_URL=https://dummyjson.com                        # the same in all three
```

Same keys, different values; the code never branches on the mode name. It
reads `env.logLevel` and `env.features.uploads`, and the profile decides.

### 3.3 Why `VITE_` variables are public

Only variables prefixed `VITE_` reach `import.meta.env`. The prefix is not a
namespace — it is a **consent form**. Every `VITE_` value is string-replaced
into the bundle at build time:

```bash
npm run build && grep -l 'https://dummyjson.com' dist/assets/*.js
# dist/assets/index-Bq3kZ9x2.js
```

That file is handed to every visitor. There is no runtime, no server, nothing
between the build and the browser. So: an API base URL, a feature flag, a log
level, an error-reporting DSN — fine, public by design. An API secret, a
database URL, a signing key — **never**. No prefix trick, no obfuscation, no
"it's only staging". A value that must be secret needs a server to hold it,
which is the point at which a server tier ([Module 19](../19-server-components/))
stops being optional.

The same rule applies to logic. A client-side role check is UX, not security:
ShopScope's `requireRole('admin')` middleware keeps the Team page out of the
menu; the *API* is what refuses the data.

### 3.4 Read once, validate, freeze

Demo 6's `src/config/env.ts` is the only file that touches `import.meta.env`:
it validates on import so a bad deploy fails at startup naming the file to fix,
coerces the string `"false"` to a boolean once, and freezes the result.
Production adds three keys, typed in `vite-env.d.ts` and read through
`optional()` into `env.reporting`: `VITE_REPORTING_DSN` (where errors go),
`VITE_VITALS_URL` (where Web Vitals go) and `VITE_RELEASE` (the git SHA, set
by CI). The release ties every error report and every uploaded source map to one
build ([§9.3](#93-source-maps-uploaded-not-served)).

📖 [Vite — Env Variables and Modes](https://vite.dev/guide/env-and-mode)

**→ In the demos:** Demo 6 Lab 1 (environment profiles); Demo 14 Lab 5 (modes at build time).

---

## 4. Deploying a single-page app

### 4.1 Static files, or a runtime

`dist/` is static files; nothing runs. Any host that serves files over HTTPS
works — Netlify, Vercel, Cloudflare Pages, GitHub Pages, S3 behind CloudFront,
an nginx container. That is the operational payoff of the CSR choice in
[Module 3](../03-rendering-architectures/): no server to patch, scale or wake.

SSR and Server Components need a Node or edge **runtime** per request — a
framework adapter, a container, a serverless target — and bring logs, cold
starts and a compute bill. Choose the architecture for the product
([Module 3 §13](../03-rendering-architectures/#13-decision-worksheet)); accept
the deployment shape that comes with it. A container for a static build is two
stages — Node builds, `nginx:alpine` serves `dist/` — and ships no Node.

### 4.2 The history-API fallback

A SPA has one HTML file. The router reads the URL *after* it loads. A refresh
on `/products/42` asks the host for a file called `/products/42`, which does
not exist. The dev server hides this — Vite serves `index.html` for every path
— so the bug appears on the host, after the demo.

The host must rewrite every unknown path to `/index.html` **with status 200**:

| Host | Configuration |
|---|---|
| Netlify, Cloudflare Pages | `public/_redirects`: `/*  /index.html  200` |
| Vercel | `vercel.json`: `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }` |
| nginx | `location / { try_files $uri /index.html; }` |
| S3 + CloudFront | a CloudFront Function rewriting extension-less paths to `/index.html` |
| GitHub Pages | no rewrites — `createHashRouter` (`/#/products/42`) |

Vite copies `public/` into `dist/` verbatim, so the rule ships with every
build: in the repo, not in a dashboard. A rewrite is not a redirect — a 301
would change the URL the router sees. Under a sub-path (`/shop/`), set `base`
in `vite.config.ts` and `basename` on the router.

### 4.3 Preview deployments

Every pull request gets its own URL, built by CI from the branch
([§10.4](#104-the-preview-deploy)). Reviewers click it; axe and the `curl` in
[§1](#1-deployed-is-not-done) run against it. It is the only place "it works
on the host" can be true before `main`.

### 4.4 Cache headers

The hashes in [§2.3](#23-hashing-and-splitting) only pay off if the headers
match them:

```
# public/_headers   (Netlify / Cloudflare Pages; nginx and CloudFront spell it differently)
/assets/*
  Cache-Control: public, max-age=31536000, immutable
/index.html
  Cache-Control: no-cache
```

The name of a hashed asset changes when its content does, so it can be cached
for a year. `index.html` is the only pointer to the current hashes, so it must
be revalidated every time (`ETag` makes that cheap).

Get `index.html` wrong and you get the classic post-deploy error: a user with
a cached copy clicks **Account**, the browser asks for `AccountLayout-C7hj…js`,
the host now has only `AccountLayout-Dx8m…js`, and the lazy route throws
`Failed to fetch dynamically imported module`. Vite emits `vite:preloadError`
for exactly this; the honest recovery is one reload:

```ts
window.addEventListener('vite:preloadError', () => window.location.reload());
```

📖 [Vite — Deploying a Static Site](https://vite.dev/guide/static-deploy) · [MDN — `Cache-Control`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control)

**→ In the demos:** Demo 14 Lab 5 — shipping a routed app (`_redirects`, `preview`, the mode build).

---

## 5. Security for a client app

The threat model is short: **the code runs on a machine you do not control,
next to data you do not want leaked, with the user's credentials attached.**

### 5.1 XSS, and why React is mostly safe

React escapes everything rendered as text:

```tsx
<p>{product.description}</p>   // '<img src=x onerror="alert(1)">' renders as that literal string
```

That closes the most common XSS path. What remains is every place you hand
React a string and ask it *not* to escape, or bypass React altogether:
`dangerouslySetInnerHTML`; an `href` built from data that turns out to be
`javascript:…`; `ref.current.innerHTML = …` ([Module 11 §6](../11-refs-and-the-dom/#6-what-you-may-and-may-not-do-to-a-dom-node));
third-party scripts (tag managers, chat widgets); `eval` and `new Function`.
If the string comes from anywhere but your own source — including your own
API, which stores what someone typed — it is untrusted.

### 5.2 `dangerouslySetInnerHTML` + DOMPurify

ShopScope's product descriptions arrive with markup. Sanitise with an
allow-list, at the point of rendering:

```tsx
// src/components/RichText.tsx
import DOMPurify from 'dompurify';   // 3.4 — ESM, types included

const CONFIG = { ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a'], ALLOWED_ATTR: ['href'] };

// Links in untrusted HTML open in a new tab and never get an opener.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

export function RichText({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html, CONFIG) }} />;
}
```

The allow-list is tiny and grows only when a real description needs a tag.
`href` is allowed, but DOMPurify strips `javascript:` and `data:` schemes by
default. And sanitising happens **in the component that owns the risk**, not
in the API layer where the next consumer might not know it was done.

### 5.3 Content Security Policy

CSP is the browser-enforced backstop for when sanitising fails: a header naming
which origins may supply scripts, styles, images and connections. An injected
`<script src="https://evil.example/x.js">` does not run, because the policy
never named that origin.

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'sha256-<hash of the inline theme script>';
  style-src 'self' 'unsafe-inline';
  img-src 'self' https://cdn.dummyjson.com data:;
  connect-src 'self' https://dummyjson.com https://httpbin.org https://ingest.reporter.example;
  object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
```

| Directive | Why, for ShopScope |
|---|---|
| `script-src` + a `sha256-` | `index.html`'s inline theme script must run before the stylesheet — **hash it**; `'unsafe-inline'` for scripts makes the policy worthless |
| `style-src 'unsafe-inline'` | react-bootstrap sets inline `style` attributes; a far smaller risk — accept it and say so in a comment |
| `connect-src` | every origin `fetch`/axios/`EventSource` may reach; exfiltration to an unlisted origin is blocked |
| `frame-ancestors 'none'` | clickjacking; replaces `X-Frame-Options` |

It lives in a **response header** on the host (`_headers`, nginx `add_header`,
a CDN rule), and on `vite preview` so it is tested before it gets there:

```ts
// vite.config.ts
preview: { headers: { 'Content-Security-Policy': CSP } },   // the same string the host serves
```

Roll out as `Content-Security-Policy-Report-Only` first: the browser reports
what *would* be blocked, you fix the list, then enforce. A
`<meta http-equiv>` tag works where you cannot set headers, minus
`frame-ancestors` and reporting. Three headers belong beside it on every
response: `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin`.

### 5.4 Where the token lives, and CSRF

ShopScope keeps its JWT in `localStorage` (`src/lib/tokenStore.ts`) and the
auth interceptor sends it as `Authorization: Bearer …`. The file states why —
DummyJSON is token-based — and states the trade-off:

| | Bearer token in `localStorage` | Session in an `httpOnly` cookie |
|---|---|---|
| Readable by JavaScript | **yes** — any XSS steals it | no |
| Sent automatically by the browser | no — your code adds the header | **yes**, on every request to that origin, from any site |
| Vulnerable to | XSS | **CSRF** |
| SPA and API on different origins | fine | `SameSite=None; Secure` plus CORS with credentials |
| Needs your own backend to issue it | no | yes |

A cookie the browser attaches automatically is attached to a form on
`evil.example` that POSTs to `shopscope.example/api/orders`, too. That is
CSRF — the price of the cookie's XSS resistance. The defences are server-side,
but the client has to wire them:

```ts
// 1. SameSite: Set-Cookie: session=…; HttpOnly; Secure; SameSite=Lax — not attached cross-site
// 2. A CSRF token: the server sets a second, READABLE cookie; the client echoes it in a header
//    that evil.example, unable to read the cookie, cannot forge.
api.interceptors.request.use((config) => {
  const token = document.cookie.match(/(?:^|; )csrf=([^;]+)/)?.[1];
  if (token) config.headers.set('X-CSRF-Token', token);
  return config;
});
// 3. Any custom header forces a CORS preflight, which a cross-site form cannot pass.
```

In production, if you own the backend: **`httpOnly` cookie + `SameSite=Lax` +
a CSRF token**, and Demo 11's auth interceptor becomes the five lines above.
If you consume a third-party token API, keep the token in memory if you can,
and treat XSS prevention ([§5.1–5.3](#51-xss-and-why-react-is-mostly-safe)) as
the thing standing between you and account takeover.

### 5.5 Never trust the client — including your own

Every rule above is a *client-side* defence; none replaces the server
validating input, checking authorisation and rate-limiting. `curl` is also a
client, and it skips your zod schema and your disabled button. Server Functions
([Module 19](../19-server-components/)) included: a `'use server'` function is
an HTTP endpoint, and validates its arguments as if they came from `curl`.

### 5.6 Dependencies: `npm audit`

Your bundle is your code plus everything in `node_modules` it imports.

`npm audit --audit-level=high` exits non-zero on high or critical findings —
the CI form; `npm audit fix` applies semver-compatible upgrades. It is noisy — a ReDoS in a dev-only tool is not a production problem
— but a *high* finding in a runtime dependency is. Run it in the gate, commit
the lockfile so CI audits what you ship, and let a bot (Dependabot, Renovate)
open upgrade PRs for the gate to review.

📖 [react.dev — `dangerouslySetInnerHTML`](https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html) · [DOMPurify](https://github.com/cure53/DOMPurify)
📖 [MDN — Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP) · [`Set-Cookie` and `SameSite`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie)

**→ In the demos:** Demo 22 Lab 2 — Security (sanitised description, CSP on `vite preview`, `npm audit`, the cookie trade-off revisited with CSRF).

---

## 6. Accessibility as a release gate

The practice — semantic HTML first, the keyboard pass, focus on route change,
contrast, `prefers-reduced-motion`, a screen-reader walkthrough — is Demo 15
and Module 26. This section is only the **gate**: how a regression fails a
pull request instead of reaching a user.

### 6.1 Floor, not ceiling

axe-core checks the rendered DOM — labels, roles, duplicate ids, contrast,
invalid `aria-*`, missing `alt`, heading order — deterministically, and finds
roughly half of what a manual audit finds. It cannot tell whether Escape
closes the drawer, where focus went, or whether alt text is *useful*. Zero
violations means "not obviously broken": the right bar for a gate, and only
that.

### 6.2 Three places to run it

**In development — `@axe-core/react` 4.13**, reporting to the console as the
app runs:

```tsx
// main.tsx — the raw constant, so the branch and its chunk vanish from the build
if (import.meta.env.DEV) {
  import('@axe-core/react').then(({ default: axe }) => axe(React, ReactDOM, 1000));   // re-check 1 s after each change
}
```

**In tests — `vitest-axe`**, the same rules as an assertion on what a
component test rendered:

```ts
// src/test/setup.ts
import * as axeMatchers from 'vitest-axe/matchers';
expect.extend(axeMatchers);

// ProductCard.test.tsx
import { axe } from 'vitest-axe';
it('has no axe violations', async () => {
  const { container } = renderWithProviders(<ProductCard product={makeProduct()} />);
  expect(await axe(container)).toHaveNoViolations();
});
```

jsdom has no layout engine, so `color-contrast` cannot run there — hence the
third place.

**Against the preview — `@axe-core/cli`**, a real browser on the real build:

```yaml
- run: npx @axe-core/cli "$PREVIEW_URL/products" --exit   # non-zero on any violation — §10.4
```

### 6.3 What the gate enforces, and what stays manual

| Automated — fails the PR | Manual — the release checklist ([§12](#12-the-release-checklist)) |
|---|---|
| zero axe violations in component tests and on the preview's main routes | keyboard-only pass of every new screen |
| role-based queries in tests ([Module 18](../18-testing/)) — a button a test cannot find by role is itself a finding | focus lands somewhere sensible on route change (`RouteAnnouncer`) |
| `eslint-plugin-jsx-a11y` in `npm run lint` | one screen-reader walkthrough of any new flow; `prefers-reduced-motion` on any new animation |

📖 [axe-core — rule descriptions](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md) · [`@axe-core/react`](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/react)

**→ In the demos:** Demo 22 Lab 1 — Accessibility audit (`@axe-core/react` in dev, `vitest-axe` in tests, fix every finding, one screen-reader pass).

---

## 7. SEO and metadata — the limits of CSR

### 7.1 Per-route metadata in React 19

React 19 hoists `<title>`, `<meta>` and `<link>` rendered anywhere in the tree
into `<head>`, and removes them on unmount. ShopScope's `PageMeta` (Demo 21) is
the whole implementation; production adds the canonical URL and the social
card:

```tsx
<title>{formatTitle(title)}</title>
{description && <meta key="description" name="description" content={description} />}
<link rel="canonical" href={`${env.siteUrl}${pathname}`} />
<meta key="og:title" property="og:title" content={formatTitle(title)} />
<meta key="og:image" property="og:image" content={image} />
{noIndex && <meta key="robots" name="robots" content="noindex" />}
```

Two rules: render **one** `<title>` at a time (the browser uses the first in
the document, not the most specific), and put a `key` on every `<meta>` so two
routes do not leave both descriptions in the head across a navigation.

### 7.2 What a crawler sees

```bash
curl -s https://shopscope.example/products/42
```

```html
<body><div id="root"></div><script type="module" src="/assets/index-Bq3kZ9x2.js"></script></body>
```

No title, no description, no product name. Everything `PageMeta` renders
happens in the browser, after the bundle loads and the loader returns.

| Reader | Executes JavaScript? | Sees `PageMeta`? |
|---|---|---|
| A person, in a tab | yes | yes |
| Googlebot | yes — a second, deferred pass; slower to index | eventually |
| Link-preview bots (Slack, WhatsApp, LinkedIn, X), most scrapers | **no** | **no** — the card shows whatever `index.html` says |

That was decided in [Module 3](../03-rendering-architectures/) when the app
became a Vite SPA. Per-route metadata in a CSR app is for humans reading tabs
and bookmarks, plus Googlebot on a delay.

### 7.3 What you can still do, and when to move

`public/robots.txt` (`Disallow: /account/`, a `Sitemap:` line) and a
`sitemap.xml` of the public routes, generated by a build script from the
catalogue, tell crawlers which URLs exist without discovering a
JavaScript-rendered link. Beyond that: pre-render a few marketing routes at
build time, or move the public catalogue to SSG/SSR ([Module 19](../19-server-components/)).
If the product page must rank or unfurl, that is a day-one decision —
retrofitting it is the migration that becomes a rewrite.

📖 [react.dev — `<title>`](https://react.dev/reference/react-dom/components/title) · [`<meta>`](https://react.dev/reference/react-dom/components/meta) · [`<link>`](https://react.dev/reference/react-dom/components/link)

**→ In the demos:** Demo 22 Lab 3 — SEO and metadata (per-route title, description, canonical, Open Graph; `curl` the page and see the empty `<div id="root">`).

---

## 8. Internationalisation with `Intl`

ShopScope hard-codes `en-US` prices and `en-GB` dates in `src/lib/format.ts`.
Internationalisation is making the locale a parameter — and the browser ships
every formatter you need, in every locale, at zero bytes.

### 8.1 The locale is state

```tsx
// src/context/LocaleContext.tsx
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState(() => localStorage.getItem('shopscope.locale') ?? navigator.language);

  useEffect(() => {                                    // a genuine effect: syncing <html> with React state
    localStorage.setItem('shopscope.locale', locale);
    document.documentElement.lang = locale;            // screen readers switch voice on this
    document.documentElement.dir = RTL.has(locale.split('-')[0]) ? 'rtl' : 'ltr';
  }, [locale]);

  return <LocaleContext value={{ locale, setLocale }}>{children}</LocaleContext>;
}
export const useLocale = () => use(LocaleContext);
```

### 8.2 Money: `Intl.NumberFormat`

```ts
const priceFormatters = new Map<string, Intl.NumberFormat>();

/** Construct once per locale+currency — the constructor is the expensive part; `format` is cheap. */
export function formatPrice(amount: number, locale: string, currency = 'USD'): string {
  const key = `${locale}|${currency}`;
  const fmt = priceFormatters.get(key) ?? new Intl.NumberFormat(locale, { style: 'currency', currency });
  priceFormatters.set(key, fmt);
  return fmt.format(amount);
}

formatPrice(1234.5, 'de-DE')          // "1.234,50 $"   — 'en-US' → "$1,234.50"
formatPrice(1234.5, 'ja-JP', 'JPY')   // "￥1,235"       — yen has no minor unit
```

Never build money by concatenation: symbol position, grouping, decimal mark
and the number of decimals all vary, and `toFixed(2)` is wrong for yen. The
**currency is data**, not a locale property — a German user buying in dollars
sees `1.234,50 $`.

### 8.3 Dates: `Intl.DateTimeFormat`

```ts
export const formatDate = (iso: string, locale: string) =>
  dateFormatter(locale).format(new Date(iso));   // dateFormatter caches new Intl.DateTimeFormat(locale, { dateStyle: 'medium' })

formatDate('2025-04-14T09:30:00Z', 'en-GB')   // "14 Apr 2025"     — 'en-US' → "Apr 14, 2025", 'ja-JP' → "2025/04/14"
```

The API sends UTC; `DateTimeFormat` renders in the viewer's time zone, which
is right for an order date — pass `timeZone` only when a date belongs to a
place. "3 minutes ago" is `Intl.RelativeTimeFormat`; "A, B and C" is
`Intl.ListFormat`. This is why `moment` is gone: 70 kB plus locale files for
what the platform does in six lines.

### 8.4 Plurals: `Intl.PluralRules`

"3 items" is not `count === 1 ? 'item' : 'items'`. English has two forms,
Arabic six, and Polish treats 2, 5 and 22 differently. `PluralRules` gives you
the *category*; your messages supply the form:

```ts
type Forms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };
const ITEMS: Record<string, Forms> = {
  en: { one: '{n} item', other: '{n} items' },
  pl: { one: '{n} przedmiot', few: '{n} przedmioty', many: '{n} przedmiotów', other: '{n} przedmiotu' },
};

export function itemCount(n: number, locale: string): string {
  const forms = ITEMS[locale.split('-')[0]] ?? ITEMS.en;
  const form = forms[new Intl.PluralRules(locale).select(n)] ?? forms.other;   // cache the rules per locale
  return form.replace('{n}', new Intl.NumberFormat(locale).format(n));
}

itemCount(0, 'en-GB')   // "0 items" — English puts zero in `other`, not `zero`
itemCount(5, 'pl-PL')   // "5 przedmiotów"
```

### 8.5 Messages, and what a `t()` grows into

```ts
const MESSAGES = {
  en: { 'cart.title': 'Your cart', 'cart.empty': 'Nothing here yet.' },
  de: { 'cart.title': 'Dein Warenkorb', 'cart.empty': 'Noch nichts drin.' },
} satisfies Record<string, Record<string, string>>;
type MessageKey = keyof (typeof MESSAGES)['en'];

export function t(key: MessageKey, locale: string): string {
  return MESSAGES[locale.split('-')[0] as keyof typeof MESSAGES]?.[key] ?? MESSAGES.en[key];
}
```

The idea to keep is **message extraction**: components render *keys*; the
English lives in a catalogue beside the German. At scale that catalogue is ICU
message syntax, extracted by tooling and translated outside the repo —
FormatJS or i18next are bigger versions of this `t()`. Two jobs stay yours:
**RTL** — `dir="rtl"` on `<html>` and logical CSS properties
(`margin-inline-start`, not `margin-left`); and **sorting** —
`['ä', 'z'].sort()` is wrong in German, `new Intl.Collator('de').compare` is
right.

📖 [MDN — `Intl`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) · [`NumberFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat) · [`DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat) · [`PluralRules`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/PluralRules)

**→ In the demos:** Demo 22 Lab 4 — Internationalisation (`formatPrice` by locale, `DateTimeFormat` for order dates, `PluralRules` for "3 items", a `t()` stub and a language switch).

---

## 9. Observability

Production is the only environment with real users, networks and data. If the
app fails there and nothing tells you, it is failing now. Three feeds —
**errors**, **logs**, **vitals** — all tied to a **release**.

### 9.1 Structured logging

Demo 6's `logger` is level-gated: `logger.debug` costs nothing in production
because `VITE_LOG_LEVEL=error` short-circuits before the arguments are
formatted. *What* it logs matters as much:

```ts
logger.error(`Checkout failed for order ${orderId} with ${status}`);   // ✗ a sentence — grep-able, not queryable
logger.error('checkout.failed', { orderId, status, requestId });      // ✓ an event name plus fields
```

The `requestId` the logging interceptor stamps on every request joins a
browser log line to the server's log for the same call.

### 9.2 Error reporting behind the logger

An error-reporting SDK (Sentry-style; the shape is the same whichever vendor)
captures exceptions with stacks, groups them, and says which release
introduced them. It goes **behind** the logger, so no component imports a
vendor:

```ts
// src/config/reporter.ts — the seam: a no-op until a vendor is installed
type Capture = (error: unknown, context?: Record<string, unknown>) => void;
let capture: Capture = () => {};
export const reporter = {
  install: (fn: Capture) => { capture = fn; },
  captureException: (error: unknown, context?: Record<string, unknown>) => capture(error, context),
};

// logger.ts — error now also reports
error: (...a: unknown[]) => {
  log('error', ...a);
  reporter.captureException(a.find((x): x is Error => x instanceof Error) ?? new Error(String(a[0])), { args: a });
},

// main.tsx — the vendor SDK is a lazy chunk, loaded only when there is somewhere to send to
if (env.isProd && env.reporting.dsn) {
  import('./config/reporter.vendor').then(({ init }) =>   // init returns the vendor's captureException
    reporter.install(init({ dsn: env.reporting.dsn, release: env.reporting.release, environment: env.mode })));
}
```

The DSN is a public, write-only ingest address — which is why it may be a
`VITE_` variable ([§3.3](#33-why-vite_-variables-are-public)).

**Who calls `captureException`.** Not components. The three places errors
surface:

```tsx
// 1. React — React 19's root options. Boundaries still render their fallback; this is the report.
createRoot(document.getElementById('root')!, {
  onUncaughtError: (error, info) => reporter.captureException(error, { kind: 'uncaught', componentStack: info.componentStack }),
  onCaughtError:   (error, info) => reporter.captureException(error, { kind: 'caught',   componentStack: info.componentStack }),
}).render(…);

// 2. Route boundaries — loader and action errors are caught by React Router, not by React
const error = useRouteError();
useEffect(() => {
  if (!isRouteErrorResponse(error) || error.status >= 500) reporter.captureException(error);   // a 404 is not a report
}, [error]);

// 3. Nothing caught it at all
window.addEventListener('unhandledrejection', (e) => reporter.captureException(e.reason, { kind: 'unhandledrejection' }));
```

**Meaningful failure states.** The report is for you; the fallback is for the
user. `RootErrorBoundary` separates "Page not found", "Not allowed" and
"Something went wrong" and offers **Reload** only for a 5xx; `WidgetBoundary`
keeps a broken widget from taking the page down ([Module 16](../16-advanced-patterns/)).
A failure state without a report means you never learn why.

### 9.3 Source maps: uploaded, not served

`at t (index-Bq3kZ9x2.js:1:48213)` is useless. The reporter maps it back to
`ProductCard.tsx:41` with the `.map` files — which it must have and the public
must not:

```yaml
# ci.yml — after `npm run build`, with build.sourcemap: 'hidden'
- run: npx <vendor-cli> sourcemaps upload --release ${{ github.sha }} dist/assets
  env: { REPORTER_AUTH_TOKEN: ${{ secrets.REPORTER_AUTH_TOKEN }} }   # a SECRET — a CI secret, never a VITE_ var
- run: find dist -name '*.map' -delete                                # nothing left to serve
```

The build set `VITE_RELEASE=${{ github.sha }}`, so every event carries the
release and the reporter holds the maps for it. Two sides of one key.

### 9.4 Web Vitals: real-user monitoring

| Vital | Measures | Good | Poor | Usually caused by |
|---|---|---|---|---|
| **LCP** | time until the main content is painted | ≤ 2.5 s | > 4 s | bundle size, render-blocking CSS, an unsized hero image, a slow API before first render |
| **INP** | worst-case lag between an interaction and the next frame | ≤ 200 ms | > 500 ms | long renders, un-virtualised lists, synchronous work in handlers ([Module 15](../15-performance/)) |
| **CLS** | how much the page moves while loading | ≤ 0.1 | > 0.25 | images without `width`/`height`, skeletons shorter than the content, fonts swapping |

Thresholds are judged at the 75th percentile of real users. `web-vitals` 6.2
measures them in the user's browser:

```ts
// src/lib/vitals.ts
import { onCLS, onINP, onLCP, type Metric } from 'web-vitals';

function send(metric: Metric) {
  const { name, value, rating, id, navigationType } = metric;   // rating: 'good' | 'needs-improvement' | 'poor'
  const body = JSON.stringify({ name, value, rating, id, navigationType, route: location.pathname, release: env.reporting.release });
  // sendBeacon survives the tab closing — INP and CLS report when the page is hidden
  if (!navigator.sendBeacon(env.reporting.vitalsUrl, body)) fetch(env.reporting.vitalsUrl, { method: 'POST', body, keepalive: true });
}

export function reportVitals() { onLCP(send); onINP(send); onCLS(send); }
```

Callbacks fire when a value is **final** — often as the page is hidden, hence
`sendBeacon`. In a SPA, LCP and CLS describe the *initial load*; INP covers
every interaction in the session. For "which element, which handler",
import from `web-vitals/attribution` instead.

### 9.5 RUM vs Lighthouse

| | Lighthouse (lab) | `web-vitals` in the browser (field / RUM) |
|---|---|---|
| Runs | your laptop or CI; one simulated device and network | every real user's browser |
| Measures | one synthetic load | the distribution across devices, networks, routes, releases |
| Good for | catching a regression before merge; a reproducible number | what users actually experience; the p75 |
| Blind to | a slow production API, the real device mix, the route everyone uses | noisy; cannot run on a PR |

Use both: the lab number or the budget ([§10.3](#103-the-bundle-budget)) in
the gate, RUM in production for what the gate could not predict. These are the
metrics of [Module 3 §11](../03-rendering-architectures/#11-the-metrics-that-decide-arguments), now collected.

📖 [web-vitals — README](https://github.com/GoogleChrome/web-vitals) · [react.dev — `createRoot` (`onCaughtError`, `onUncaughtError`)](https://react.dev/reference/react-dom/client/createRoot)

**→ In the demos:** Demo 22 Lab 5 — Observability (the reporter behind the Demo 6 logger, boundaries that report, source maps uploaded not served, `web-vitals` reporting LCP/INP/CLS).

---

## 10. The CI quality gate

Demo 20 ended with four commands — `typecheck → lint → test → build` — that
every developer was supposed to run before pushing. A gate is those commands
run by a machine on every pull request, with merging blocked until they pass.

### 10.1 The workflow

```yaml
# .github/workflows/ci.yml
name: CI
on: { pull_request: {}, push: { branches: [main] } }
concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }   # a new push cancels the stale run
permissions: { contents: read }

jobs:
  gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci                          # the lockfile, exactly — never `npm install` in CI
      - run: npm run typecheck
      - run: npm run lint
      - run: npx prettier --check .
      - run: npm test
      - run: npm audit --audit-level=high
      - run: npm run build
        env: { VITE_RELEASE: ${{ github.sha }} }
      - run: npm run check:bundle
      - uses: actions/upload-artifact@v4          # the preview deploys THIS build
        with: { name: dist, path: dist }

```

A second job, `needs: gate`, runs `npx playwright install --with-deps chromium`
and `npm run test:e2e`. The order is cost-ascending: the typecheck fails in
seconds, the browser job takes minutes; failing early saves the rest. `npm ci`
installs the lockfile exactly and refuses if `package.json` disagrees, so CI
tests the dependency set you committed. And because the preview deploys the
*artefact this job built*, nothing is deployed that was not tested, and
nothing is tested that was not the thing deployed.

### 10.2 Formatting on commit: Prettier, Husky, lint-staged

```bash
npm i -D prettier husky lint-staged
npx husky init                              # .husky/pre-commit, plus a "prepare": "husky" script
echo 'npx lint-staged' > .husky/pre-commit
```

```json
"lint-staged": { "*.{ts,tsx}": ["eslint --fix --max-warnings=0", "prettier --write"], "*.{css,json,md,yml}": "prettier --write" }
```

`lint-staged` runs the tools on **staged files only**, so the hook takes a
second. The hook is a convenience; the gate's `prettier --check` is the
guarantee — a `--no-verify` commit still fails CI.

### 10.3 The bundle budget

A treemap needs a human to look at it. A **budget** fails:

```bash
npm run build && npm run check:bundle   # "Bundle budget: 700 kB raw per JavaScript asset … ✓ 665.5 kB index-….js … Within budget."
```

`scripts/check-bundle-size.mjs` measures each JavaScript asset raw — the bytes
the browser must *parse* — and exits non-zero if any exceeds the number. The
number is not from the internet: it is what ShopScope measured plus ~5%
headroom, and the script's comment records the one time it moved (Demo 19
added TanStack Query, 45.9 kB, and bought a cache). **A budget you raise every
time it fails is not a budget**; raise it when you can say what you bought.

`size-limit` does the same as a package, measuring *compressed* size (what
crosses the network): `[{ "path": "dist/assets/index-*.js", "limit": "220 kB" }]`
in `.size-limit.json`. Raw tracks parse cost, compressed tracks transfer; gate
on one, say which, and look at the other when it moves.

### 10.4 The preview deploy

```yaml
  preview:
    needs: gate
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with: { name: dist, path: dist }
      - run: find dist -name '*.map' -delete        # uploaded in the gate job; never served
      - run: npx netlify deploy --dir=dist --alias=pr-${{ github.event.number }}
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}   # the one place a secret may exist
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
      - run: npx @axe-core/cli "$PREVIEW_URL/products" --exit
        env: { PREVIEW_URL: 'https://pr-${{ github.event.number }}--shopscope.netlify.app' }
```

Every host has an equivalent CLI. Secrets live in the repository's Actions
secrets — allowed here because the workflow runs where the public cannot read.

### 10.5 Coverage is a signal, not a target

`npm run test:coverage` says which lines ran while the tests ran. A threshold
in the gate rewards tests that *execute* lines, which is not the same as tests
that catch bugs. Publish the number, watch the trend, and treat a sudden drop
on a PR as a question for review — not a red build.

📖 [GitHub Actions — Workflow syntax](https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions) · [Using secrets](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions)

**→ In the demos:** Demo 22 Lab 6 — The quality gate (`ci.yml`: typecheck → lint → test → build → bundle budget → preview deploy per PR; Prettier + Husky + lint-staged; `size-limit`).

---

## 11. Maintenance

Shipping is the beginning of the expensive part.

| Habit | Why |
|---|---|
| Upgrade small and often — `npm outdated` per sprint, or a bot opening one PR per upgrade for the gate | a two-year jump of React Router is a project; ten small ones are an afternoon |
| Pin exact versions (`"react": "19.3.0"`, not `^19.3.0`) | Tuesday's build is Monday's build |
| Fail the test run on `console.error`; keep Strict Mode on | a deprecation warning today is next year's breaking change — React 19's removals (`forwardRef`, `defaultProps` on functions, `propTypes`) were warnings for years first |
| Keep a component inventory — Storybook, or a route rendering every shared component in every state (`StylingShowcase`) | designers see what exists, new hires learn the vocabulary, visual regressions become diffs |
| One ADR per decision — context, options, choice, consequences | the token is in `localStorage` because DummyJSON is token-based; the budget is 700 kB because that was measured. Without the why, the next developer reverses it. Demo 23 writes the first one |

---

## 12. The release checklist

Printable. Every line is explained above.

```
BUILD        [ ] npm run build with VITE_RELEASE set; npm run preview checked by a human
             [ ] no [debug] in the preview console; flagged-off features absent
             [ ] build.sourcemap 'hidden'; .map files uploaded, then deleted from dist/
             [ ] check:bundle within budget — or the budget moved and the commit says why
CONFIG       [ ] grep the bundle for every VITE_ value you would not put on a billboard
             [ ] .env.production has every key env.ts requires; no .env.local committed
             [ ] secrets exist only as CI secrets
DEPLOY       [ ] SPA fallback in the repo; /products/42 survives a refresh ON THE HOST
             [ ] Cache-Control immutable on assets/, no-cache on index.html; vite:preloadError handled
             [ ] base / basename correct under a sub-path
SECURITY     [ ] every dangerouslySetInnerHTML goes through DOMPurify with an allow-list
             [ ] CSP served as a header; Report-Only ran clean; the inline script is hashed
             [ ] HSTS, nosniff, Referrer-Policy, frame-ancestors present (curl -I)
             [ ] httpOnly cookie + SameSite + CSRF token — or the localStorage trade-off written down
             [ ] npm audit --audit-level=high clean; lockfile committed
A11Y         [ ] zero axe violations in tests and on the preview's main routes
             [ ] keyboard-only pass of every new screen; focus on route change; one screen-reader walkthrough
SEO          [ ] every route renders PageMeta; public routes have description, canonical, og:*
             [ ] account and login are noindex; robots.txt and sitemap.xml in public/
I18N         [ ] no money, date or count built by string concatenation; <html lang> and dir follow the locale
OBSERVE      [ ] React root options, route boundaries and unhandledrejection reach the reporter
             [ ] one deliberate error traced to a source line in the reporter, tagged with the release
             [ ] LCP / INP / CLS arriving; the dashboard shows p75 per route
GATE         [ ] CI green: typecheck → lint → format → test → audit → build → budget → e2e → preview
             [ ] branch protection requires the gate; nobody can merge red
ROLLBACK     [ ] the previous build is one click away on the host — and someone has clicked it once to prove it
```

The last line is the one teams forget: a release you cannot undo in a minute
is one you will hesitate to make.

---

## 13. Self-check

1. Name five ways the production build differs from the dev server. Which of
   them hide a bug rather than remove it?
2. Why does `if (import.meta.env.DEV)` drop a chunk while `if (env.isDev)`
   does not?
3. Give the four `build.sourcemap` values, the one production uses, and why
   "uploaded, not served" is the policy.
4. Explain in two sentences why a `VITE_` variable can never hold a secret,
   then prove it with one shell command.
5. A refresh on `/products/42` returns the host's 404. What is missing, why did
   the dev server not show it, and why must the rewrite be a 200, not a 301?
6. Give `Cache-Control` for `assets/*` and for `index.html`, and describe the
   bug when `index.html` is cached too long.
7. What does React escape for you, and name four places it cannot help.
8. Why is `RichText`'s allow-list tiny, and why does sanitising happen in the
   component rather than in the API layer?
9. Justify each directive of ShopScope's CSP. Why is `'unsafe-inline'`
   tolerable in `style-src` and never in `script-src`?
10. `localStorage` token vs `httpOnly` cookie: readable by JS, auto-sent,
    vulnerable to what? What is CSRF, and its three defences?
11. What can axe find, what can it not, and what does "floor, not ceiling"
    mean for the gate? Which rule cannot run in jsdom?
12. What does a link-preview bot see on a ShopScope product page? What would
    change that, and when should the decision be made?
13. Why is `count === 1 ? 'item' : 'items'` wrong, and what does
    `PluralRules.select(0)` return in English?
14. Why are `Intl` formatters cached per locale, and why is the currency an
    argument rather than derived from the locale?
15. Name the three places an error surfaces and what reports from each. Why
    does a loader error not reach React's `onUncaughtError`?
16. Define LCP, INP and CLS with their "good" thresholds. Which describe only a
    SPA's initial load? Lighthouse vs RUM — where does each belong?
17. What is the bundle budget's number based on, and the only acceptable
    reason to raise it? Why is a coverage threshold a bad gate?

### Practical

1. Add a GitHub Actions workflow running the full gate — typecheck, lint,
   format, test, audit, build, bundle budget — on every PR, with a preview
   deploy. Break each stage once and confirm the PR goes red.
2. Do a keyboard-only pass of the whole app and fix everything you find; then
   add a `vitest-axe` assertion to every component test and make the gate
   require zero violations on the preview.
3. Break the app deliberately in three ways — a loader 500, a render throw
   inside a widget, an unhandled rejection in a handler — and confirm each
   produces a usable error state *and* a report you can act on, traced to a
   source line through an uploaded map.
4. Set a bundle budget 5% above today's entry chunk, add a date library to
   `format.ts`, and watch CI fail. Replace it with `Intl`.
5. Serve the CSP from `vite preview` in Report-Only mode, browse every route,
   fix every report, then enforce. Count the origins you did not know the app
   talked to.

---

## 14. References

React documentation where React is the subject; each tool's own docs otherwise.

**React**
- [Creating a React App](https://react.dev/learn/creating-a-react-app) · [Build a React App from Scratch](https://react.dev/learn/build-a-react-app-from-scratch)
- [`StrictMode`](https://react.dev/reference/react/StrictMode) — development-only checks, a no-op in the build
- [`createRoot`](https://react.dev/reference/react-dom/client/createRoot) — `onCaughtError`, `onUncaughtError`, `onRecoverableError`
- [`Component` — `componentDidCatch`](https://react.dev/reference/react/Component#componentdidcatch) — what a boundary is underneath
- [`<Profiler>`](https://react.dev/reference/react/Profiler) · [`lazy`](https://react.dev/reference/react/lazy) · [`Suspense`](https://react.dev/reference/react/Suspense)
- [`dangerouslySetInnerHTML`](https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html)
- [`<title>`](https://react.dev/reference/react-dom/components/title) · [`<meta>`](https://react.dev/reference/react-dom/components/meta) · [`<link>`](https://react.dev/reference/react-dom/components/link) — document metadata in React 19
- [Server Functions](https://react.dev/reference/rsc/server-functions) — an endpoint, so validate like one
- [Rules of React](https://react.dev/reference/rules) · [React 19 release notes](https://react.dev/blog/2024/12/05/react-19)

**Vite**
- [Building for Production](https://vite.dev/guide/build) — chunking, `vite:preloadError`
- [Env Variables and Modes](https://vite.dev/guide/env-and-mode)
- [Deploying a Static Site](https://vite.dev/guide/static-deploy) — host-by-host rewrites
- [Build options](https://vite.dev/config/build-options) — `build.sourcemap` · [Preview options](https://vite.dev/config/preview-options) — `preview.headers`

**Security**
- [MDN — Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP) · [`Content-Security-Policy` header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy)
- [MDN — `Set-Cookie` (`HttpOnly`, `SameSite`)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie) · [MDN — `Cache-Control`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control)
- [DOMPurify](https://github.com/cure53/DOMPurify) — configuration and hooks

**Accessibility tooling**
- [axe-core](https://github.com/dequelabs/axe-core) · [rule descriptions](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [`@axe-core/react`](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/react) · [`@axe-core/cli`](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/cli)

**Internationalisation**
- [MDN — `Intl`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) · [`Intl.NumberFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat) · [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat) · [`Intl.PluralRules`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/PluralRules) · [`Intl.RelativeTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat) · [`Intl.Collator`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator)

**Observability**
- [web-vitals](https://github.com/GoogleChrome/web-vitals) — `onLCP`, `onINP`, `onCLS`, the attribution build · [MDN — `Navigator.sendBeacon`](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon)

**CI**
- [GitHub Actions — Workflow syntax](https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions) · [Using secrets](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions)
- [GitHub Actions — Storing and sharing data from a workflow](https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/storing-and-sharing-data-from-a-workflow)

---

**Previous:** [Module 19 — Server Components & Modern React 19](../19-server-components/)
**Next:** [Module 21 — The API Layer: Configuration, axios & Advanced HTTP](../21-api-layer-and-advanced-http/)
