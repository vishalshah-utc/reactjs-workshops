# Module 3 — Rendering Architectures: CSR, SSR & SSG

**Study notes** · ~2–3 hours

> **Goal.** Understand *when* and *where* your React components are turned into
> HTML, why that single decision drives performance, SEO, hosting cost and
> team complexity — and be able to defend the right choice for a given product.

To understand the shift in modern web development, it helps to look at **where
the code actually runs**. The core difference between CSR, SSR and SSG comes
down to **when and where your React components are turned into actual HTML that
a browser can read**.

Here is how each architecture handles rendering and why it matters for your
app.

---

## Contents

1. [Client-Side Rendering (CSR)](#1-client-side-rendering-csr)
2. [Server-Side Rendering (SSR)](#2-server-side-rendering-ssr)
3. [Static Site Generation (SSG)](#3-static-site-generation-ssg)
4. [Direct architectural comparison](#4-direct-architectural-comparison)
5. [Hydration, explained properly](#5-hydration-explained-properly)
6. [How to choose](#6-how-to-choose)
7. [Real-world example: an e-commerce website](#7-real-world-example-an-e-commerce-website)
8. [Mixing within a single page: hydration & streaming](#8-mixing-within-a-single-page-hydration--streaming)
9. [How do you actually code this?](#9-how-do-you-actually-code-this)
10. [Beyond the three: ISR, PPR and islands](#10-beyond-the-three-isr-ppr-and-islands)
11. [The metrics that decide arguments](#11-the-metrics-that-decide-arguments)
12. [Costs and trade-offs nobody mentions in the tutorial](#12-costs-and-trade-offs-nobody-mentions-in-the-tutorial)
13. [Decision worksheet](#13-decision-worksheet)
14. [Self-check](#14-self-check)
15. [References](#15-references)

---

## 1. Client-Side Rendering (CSR)

**Used by:** Vite, Create React App

In a CSR app, the server does almost no work. When a user visits your site, the
server sends a **nearly empty HTML file** along with a massive bundle of
JavaScript.

### How it works

1. The browser downloads a blank page (`<div id="root"></div>`) and the
   JavaScript file.
2. The browser executes the JavaScript.
3. React runs **inside the browser**, builds the entire user interface, and
   injects it into that empty div.

```
Browser                                  Server / CDN
   │  GET /products                           │
   │ ─────────────────────────────────────────►│
   │ ◄───────────────────────────────────────  │  index.html  (empty <div id="root">)
   │  GET /assets/index-a1b2.js                │
   │ ─────────────────────────────────────────►│
   │ ◄───────────────────────────────────────  │  ~200–800 KB of JS
   │                                           │
   │  parse + execute JS                       │   ← blank screen so far
   │  React renders                            │   ← blank screen so far
   │  fetch('/api/products')  ─────────────────►│
   │ ◄─────────────────────────────────────────│  JSON
   │  re-render with data                      │
   │  ✅ user finally sees products             │
```

This is exactly the boot sequence you traced in
[Module 2 §16](../02-react-introduction/#16-from-indexhtml-to-pixels-the-boot-sequence).
The empty `<div id="root">` is not an implementation detail — it *is* the
architecture.

### The pros

Once the initial bundle loads, navigating between pages is **instant**. The app
feels like a desktop application because it doesn't need to refresh the page to
fetch new layouts. It is also the simplest model to reason about — there is one
runtime (the browser), one place your code executes, and no server/client
boundary to think about.

Hosting is trivial and cheap: the build output is static files, so a CDN or
free static host serves the whole app with no server to operate, patch or
scale.

### The cons

- **Slow initial load.** The user sees a blank white screen or a loading spinner
  while waiting for the entire JavaScript bundle to download and execute. On a
  fast laptop this is unnoticeable; on a mid-range phone on 4G it is seconds.
- **Poor SEO.** Search engine bots see a blank HTML file initially. While
  advanced bots (like Google) can wait for JavaScript to run, weaker bots or
  social media scrapers (like Twitter/X or Facebook link previews) will read a
  blank page — so your shared links get no title, no description and no image.
- **A request waterfall.** HTML → JS → API → render. Each step waits for the
  previous one, and the data fetch cannot even *start* until the JavaScript is
  running.
- **The user's device does the work.** Rendering cost scales down with the
  weakest phone in your audience, not up with your server budget.

---

## 2. Server-Side Rendering (SSR)

**Used by:** Next.js, Remix, React Router v7

With SSR, **every time a user requests a page**, the server handles the heavy
lifting in real time before sending anything to the browser.

### How it works

1. The user requests a webpage.
2. A server runs your React code immediately, fetches necessary data from your
   database, and compiles it into a **fully formed HTML file**.
3. The server sends this complete HTML file to the browser, so the user sees
   **text and images instantly**.
4. The browser then downloads a small JavaScript bundle to make the static HTML
   interactive (a process called **hydration**).

```
Browser                          Server (Node / edge)         Database
   │  GET /products/42                  │                          │
   │ ──────────────────────────────────►│                          │
   │                                     │  run React components    │
   │                                     │  query ─────────────────►│
   │                                     │ ◄──────────────────────── │
   │                                     │  renderToPipeableStream  │
   │ ◄────────────────────────────────── │  FULL HTML with content   │
   │  ✅ user sees the product NOW        │                          │
   │  GET bundle.js  ──────────────────►│                          │
   │ ◄────────────────────────────────── │                          │
   │  hydrate → page becomes interactive │                          │
```

### The pros

**Excellent for SEO**, because search engines instantly get fully populated
HTML. It also provides a faster **First Contentful Paint** (the time it takes
for the user to see actual content). Data fetching happens on the server, next
to your database, so there is no client-side waterfall — and secrets stay on
the server where they belong.

### The cons

It requires a **live, continuous server** (like Node.js or edge functions) to
run. If your server is slow or experiencing high traffic, the initial page
response time (**Time to First Byte**) can lag. You now own a server: scaling,
monitoring, cold starts, and a per-request compute bill that grows with traffic.

There is also a real complexity cost — your code runs in two environments, so
`window` and `localStorage` do not exist during the server render, and any
mismatch between what the server rendered and what the client renders produces a
**hydration error**.

---

## 3. Static Site Generation (SSG)

**Used by:** Next.js, Astro, Gatsby

SSG is the ultimate choice for speed. Instead of rendering pages on the client's
browser or on a live server during a request, pages are rendered **exactly
once — when you deploy your code**.

### How it works

1. You run a build command locally or on your CI/CD pipeline (e.g. GitHub
   Actions, Vercel).
2. The build tool runs your React components, fetches data, and generates a hard
   file for **every single page** (e.g. `index.html`, `about.html`).
3. These static files are uploaded directly to a **Content Delivery Network
   (CDN)**.
4. When a user requests a page, the CDN serves the **pre-built HTML file
   instantly**.

```
BUILD TIME (once, in CI)                    REQUEST TIME (every visitor)

  run React ──► fetch data ──► emit HTML       Browser ──► CDN edge (nearby)
       │                          │                            │
       │                          ▼                            ▼
       └──────────────────► index.html                  ✅ HTML in ~20ms
                            about.html                     no server, no DB
                            blog/post-1.html
                                 │
                                 └──► upload to CDN
```

### The pros

**Blazing fast loading speeds**, because serving static files from a CDN takes
milliseconds. It is incredibly **secure** (there is no server or database in the
request path to attack) and can handle **massive traffic spikes** without
crashing a database server.

It is also the cheapest thing to host on the internet — often literally free.

### The cons

It is **terrible for highly dynamic data**. If you have a blog with 1,000
articles and you fix a typo in one, or if you change a price on an e-commerce
item, you usually have to **rebuild and redeploy the entire website** for the
change to show up. Build times grow with page count, and content that is
personalised per user cannot be pre-rendered at all.

(ISR, in [§10](#10-beyond-the-three-isr-ppr-and-islands), exists precisely to
soften this.)

---

## 4. Direct architectural comparison

| Metric | Client-Side (CSR) | Server-Side (SSR) | Static Generation (SSG) |
|---|---|---|---|
| **Where HTML is made** | The browser | The live server | The build machine (before deploy) |
| **When HTML is made** | On-the-fly in browser | On every single user request | Once during the build phase |
| **Initial load speed** | Slow | Fast | Instant |
| **SEO friendliness** | Poor to moderate | Excellent | Excellent |
| **Best used for** | Dashboards, SaaS apps, internal tools | E-commerce, social media feeds | Blogs, marketing sites, documentation |
| **Hosting needed** | Static host / CDN | Node or edge runtime | Static host / CDN |
| **Data freshness** | Live (fetched in browser) | Live (per request) | As of the last build |
| **Server cost** | None | Scales with traffic | Effectively none |
| **Personalisation** | Easy | Easy | Not possible without a client fetch |
| **Survives a traffic spike** | Yes (CDN) | Only if you scale | Yes, effortlessly |
| **Complexity** | Lowest | Highest | Low |

Modern frameworks like Next.js actually allow you to **mix and match**. You can
make your homepage SSG for instant speed, your product pages SSR for live
inventory tracking, and your user settings dashboard purely CSR behind a login
screen. That is the subject of [§7](#7-real-world-example-an-e-commerce-website)
and [§8](#8-mixing-within-a-single-page-hydration--streaming).

---

## 5. Hydration, explained properly

Both SSR and SSG send HTML that *looks* finished but is not yet *alive*. The
markup is there; the event listeners and state are not. **Hydration** is the
process where React runs in the browser over that existing HTML, attaches
event handlers and rebuilds its internal component tree — adopting the DOM
instead of recreating it.

```
1. Server/build   → HTML:  <button class="btn">Add to cart</button>
                            visible immediately, but clicking does nothing

2. Browser        → downloads the React bundle

3. Hydration      → React walks the existing DOM, matches it to the component
                     tree, attaches onClick, initialises state

4. Interactive    → clicking now works
```

Between steps 1 and 4 there is a window where the page is **visible but not
interactive**. Users notice this: they tap a button and nothing happens. The
gap is why bundle size still matters in SSR apps, and why streaming and Server
Components exist.

Two practical consequences:

**Hydration mismatches are errors.** If the server rendered `Good morning` and
the client renders `Good evening` (because it read the local clock), React logs
a hydration error and may discard the server HTML. Anything non-deterministic —
`Date.now()`, `Math.random()`, `window.innerWidth`, `localStorage`, locale
formatting — must be moved into an effect so it only runs after hydration.

**Server-render code has no browser.** `window`, `document` and `localStorage`
are undefined during the server render. Guard them, or put the access in an
effect (effects never run on the server).

📖 [react.dev — `hydrateRoot`](https://react.dev/reference/react-dom/client/hydrateRoot)
📖 [react.dev — `renderToPipeableStream`](https://react.dev/reference/react-dom/server/renderToPipeableStream)

---

## 6. How to choose

### 💻 Choose Client-Side Rendering (CSR / Vite) if:

- **You are building an application that sits behind a login screen** or does
  not care about search engine rankings.
- **The data is highly interactive and personalised.** Think of a user
  dashboard, a settings page, or an internal company tool where every user sees
  totally different data.
- **SEO does not matter.** Search engines cannot log into your app anyway, so
  they don't need to read the HTML.
- **You want cheap, simple hosting.** Because a CSR app is just static
  JavaScript and HTML files, you can host it for free on platforms like GitHub
  Pages, Netlify, or Vercel without needing a live backend server.

**Examples:** Trello, Asana, Notion, Gmail, Spotify Web Player, or any private
SaaS dashboard.

### 🌐 Choose Server-Side Rendering (SSR / Next.js or Remix) if:

- **You are building a public-facing website where content changes
  constantly**, and users expect up-to-the-minute accuracy.
- **SEO and social media sharing are critical.** You need Google to index your
  pages perfectly, and you want beautiful preview cards when someone shares a
  link on WhatsApp, LinkedIn, or X.
- **The data changes by the minute.** If you are displaying live sports scores,
  changing stock prices, or rapidly fluctuating product inventories, the server
  must fetch fresh data on every click.
- **User device performance varies.** SSR does the heavy processing on powerful
  cloud servers, making the site load fast even on old mobile phones with slow
  internet connections.

**Examples:** Amazon, Twitter/X feeds, Hulu, real-world real estate listings, or
news websites.

### ⚡ Choose Static Site Generation (SSG / Next.js or Astro) if:

- **You are building a public website where the content is mostly identical for
  every visitor** and changes infrequently.
- **Speed is your top priority.** Since the pages are pre-built and sitting on
  global servers (CDNs), they load instantly — often in under a second.
- **The content changes rarely.** You only update the site content a few times a
  day, week, or month.
- **You expect massive traffic spikes.** Static files cannot crash a database.
  If your article goes viral and gets a million hits at once, a CDN handles it
  effortlessly.

**Examples:** Company portfolio websites, blogs, documentation sites (like the
React docs), or restaurant menus.

---

## 7. Real-world example: an e-commerce website

🛒 Imagine you are building an online store. Instead of forcing the entire
website to use just one rendering method, you **split it up by page or
component**:

```
                      [ USER VISITS SITE ]
                               │
       ┌───────────────────────┼───────────────────────┐
       ▼                       ▼                       ▼
 🏠 Homepage / Info     🛍️ Product Pages         👤 User Dashboard
   (Static - SSG)         (Dynamic - SSR)        (Client-Side - CSR)
 ─────────────────      ─────────────────       ───────────────────
 Pre-built & fast.      Fetched live from       Hidden behind login.
 Served from CDN.        DB on every click.       Instant UI snappiness.
```

- **The Homepage & "About Us" page (SSG).** These pages rarely change. They are
  pre-rendered into static HTML during deployment. When a user clicks your link,
  it loads instantly in milliseconds.
- **The Product pages (SSR).** Prices change, and items go out of stock
  dynamically. When a user clicks a specific shoe, the server runs a live
  database query, checks the inventory count, builds the HTML on the spot, and
  sends it out.
- **The Shopping Cart & Account Settings (CSR).** Once a user logs in to view
  their profile, update their credit card, or open their shopping cart, SEO no
  longer matters. This section functions entirely on the client side using
  browser JavaScript for snappy, app-like interactions.

This is the single most important idea in the module: **rendering strategy is a
per-route decision, not a per-project one.** "We're an SSR shop" is not an
architecture; it is a missed opportunity on three quarters of your pages.

---

## 8. Mixing within a single page: hydration & streaming

🧩 Modern frameworks allow you to mix and match **component by component on a
single screen**.

When a user loads a complex product page, the server **streams** the static
layout immediately so the user can see something right away. At the same time,
interactive parts are activated right on the user's browser:

- **Static shell (SSR/SSG).** The product title, description, and images are
  sent as instant, readable HTML.
- **Interactive islands (CSR).** Buttons like the "Add to Cart" button, the
  review star-rating selector, or a live chat widget are basic HTML at first.
  The browser downloads a small snippet of React JavaScript specifically for
  those components to make them clickable and interactive (a process known as
  **hydration**).

```
┌─ Product page ─────────────────────────────────────────────┐
│                                                             │
│  ┌───────────────────────┐   ╔═════════════════════════╗    │
│  │ Product image         │   ║ ★★★★☆  rating selector  ║ ◄──╫── island (client)
│  │  (server HTML)        │   ╚═════════════════════════╝    │
│  └───────────────────────┘   ╔═════════════════════════╗    │
│  Title, price, description    ║  [ Add to Cart ]        ║ ◄──╫── island (client)
│  (server HTML — instant)      ╚═════════════════════════╝    │
│                                                             │
│  ┌ Reviews ──────────────────────────────────────────┐      │
│  │  ⏳ streamed in later, inside <Suspense>          │ ◄─────╫── slow data
│  └───────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

**Streaming** is what makes this possible. Rather than waiting for the slowest
query on the page before sending anything, the server flushes the shell
immediately and sends each slow section as its data resolves. In React you mark
those boundaries with `<Suspense>`:

```jsx
export default function ProductPage({ id }) {
  return (
    <>
      <ProductDetails id={id} />         {/* fast query — in the first flush */}

      <Suspense fallback={<ReviewsSkeleton />}>
        <Reviews id={id} />              {/* slow query — streamed in later */}
      </Suspense>

      <Suspense fallback={<RecsSkeleton />}>
        <Recommendations id={id} />      {/* slow ML call — streamed in later */}
      </Suspense>
    </>
  );
}
```

The user sees the product in ~200ms instead of waiting 2s for the
recommendation engine. Same page, three different arrival times.

📖 [react.dev — `Suspense`](https://react.dev/reference/react/Suspense)
📖 [react.dev — `renderToPipeableStream`](https://react.dev/reference/react-dom/server/renderToPipeableStream)

---

## 9. How do you actually code this?

🛠️ If you are using a tool like **Vite (pure CSR)**, you **cannot mix and match
easily**, because Vite doesn't have a built-in server component architecture.
Everything you write ships to the browser and runs there.

To mix and match, you must use a modern **meta-framework**. For instance, in
Next.js, you control this simply by **where you place your files** or by adding
**a single line of code** at the top of a file:

- **Server Component (the default).** Fetches data securely from your database
  on the server (SSR or SSG). It never ships to the browser — zero bundle cost.
- **`"use client";` (Client Component).** Adding this directive at the top of a
  file tells React: *"Hey, this component needs browser features like `useState`
  or user click listeners. Run this on the client side (CSR)."*

```jsx
// app/products/[id]/page.jsx  — a Server Component (no directive needed)
import { db } from '@/lib/db';
import AddToCartButton from './AddToCartButton';

export default async function ProductPage({ params }) {
  const product = await db.product.findUnique({ where: { id: params.id } });
  //    ▲ runs on the server. Secrets are safe. No API route needed.
  //      This code is NOT in the browser bundle.

  return (
    <article>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <AddToCartButton productId={product.id} />   {/* the interactive island */}
    </article>
  );
}
```

```jsx
'use client';                       // ◄── this one line changes where the code runs

import { useState } from 'react';

export default function AddToCartButton({ productId }) {
  const [adding, setAdding] = useState(false);   // hooks require a Client Component

  return (
    <button disabled={adding} onClick={() => setAdding(true)}>
      {adding ? 'Adding…' : 'Add to cart'}
    </button>
  );
}
```

Four rules that make the boundary click:

1. **Server Components are the default** in a framework that supports RSC. You
   opt *into* the client, not out of it.
2. **`useState`, `useEffect`, event handlers and browser APIs require
   `'use client'`.** If you use them without it, you get an error telling you so.
3. **`'use client'` marks a boundary, not a single file.** Everything imported
   *into* a client component becomes client code too, so put the directive as
   deep in the tree as you can — on the button, not on the page.
4. **Props crossing the boundary must be serialisable.** You can pass strings,
   numbers, plain objects and arrays; you cannot pass a function, a class
   instance or a `Date`-bearing ORM object (a Server Function is the exception —
   see below).

Writes go the other way, through a **Server Function**:

```jsx
'use server';                                  // this module runs only on the server

export async function addToCart(productId) {
  const session = await getSession();
  await db.cartItem.create({ data: { productId, userId: session.userId } });
}
```

A client component can import and call that as if it were local; the framework
turns it into an RPC. This is what replaces "write an API route, then `fetch`
it from the browser" for most mutations.

📖 [react.dev — Server Components](https://react.dev/reference/rsc/server-components)
📖 [react.dev — `'use client'`](https://react.dev/reference/rsc/use-client)
📖 [react.dev — Server Functions](https://react.dev/reference/rsc/server-functions)
📖 [react.dev — `'use server'`](https://react.dev/reference/rsc/use-server)

---

## 10. Beyond the three: ISR, PPR and islands

The three-way split is the right mental model to start from, but production
frameworks offer hybrids that fix specific weaknesses.

| Strategy | What it is | The problem it fixes |
|---|---|---|
| **ISR** — Incremental Static Regeneration | SSG pages that revalidate on a timer or on demand: serve the cached HTML, rebuild that *one* page in the background when it goes stale | SSG's "rebuild the whole site to fix a typo". A 10,000-product catalogue can be static *and* current within 60 seconds |
| **On-demand revalidation** | Your CMS or admin panel calls a webhook that invalidates exactly the affected pages | Publishing without a full deploy |
| **PPR** — Partial Prerendering | One page, one response: a static shell served instantly from the CDN with dynamic holes streamed in | The false choice between "whole page static" and "whole page dynamic" |
| **Islands architecture** | Ship HTML by default and hydrate only the interactive components (Astro's default model) | Hydrating an entire page when only three buttons need JavaScript |
| **Streaming SSR** | Flush the shell first, stream slow sections as their data resolves | SSR's TTFB being hostage to the slowest query |

The direction of travel across all of these is the same: **send HTML as early as
possible, and send as little JavaScript as you can get away with.**

---

## 11. The metrics that decide arguments

When someone claims an architecture is "faster", ask which of these they mean.
They are not the same, and the three strategies trade them against each other.

| Metric | What it measures | Best served by |
|---|---|---|
| **TTFB** (Time to First Byte) | How long until the server responds at all | SSG (CDN edge) |
| **FCP** (First Contentful Paint) | Until the user sees *something* real | SSG, then SSR |
| **LCP** (Largest Contentful Paint) | Until the main content is painted — a Core Web Vital | SSG, then SSR |
| **TTI** (Time to Interactive) | Until clicks actually work | Depends on **bundle size**, not on the strategy |
| **INP** (Interaction to Next Paint) | Responsiveness after load — a Core Web Vital | CSR/SPA navigation, once loaded |
| **Data freshness** | How stale what you see can be | SSR (per request) |

Two conclusions people find counter-intuitive:

- **SSR does not make your app interactive faster.** It makes it *visible*
  faster. TTI is governed by how much JavaScript you ship, and SSR ships the
  same bundle. Server Components help here because they ship *no* JavaScript.
- **CSR wins on in-app navigation.** After the first load, a client-rendered SPA
  changes screens without a network round trip for HTML. That is why dashboards
  feel snappier than server-rendered sites once you are inside them.

---

## 12. Costs and trade-offs nobody mentions in the tutorial

**SSR is an operational commitment.** You now run a server: deploys, cold
starts, memory limits, log aggregation, and a compute bill proportional to
traffic. A static site has none of that. Do not adopt SSR because it is modern;
adopt it because you need HTML the crawler can read or data fresh at request
time.

**SSG build time is a real constraint.** 100 pages build in seconds. 100,000
pages do not. Past a few thousand pages you need ISR, on-demand generation, or
a hybrid — plan for it before your content team wins.

**The server/client boundary is the new source of bugs.** Hydration mismatches,
`window is not defined`, "this function cannot be passed to a Client
Component", accidentally pulling a 400 KB library into the client bundle by
importing it above a `'use client'` boundary. These are learnable, but they are
a genuine tax that a Vite SPA simply does not charge.

**Auth interacts with rendering.** A page that depends on who is logged in
cannot be statically generated in a useful form. The usual shape is a static or
server-rendered shell plus client-fetched personalisation, or per-request SSR
that reads the session cookie.

**Migration difficulty is asymmetric.** CSR → SSR is a meaningful refactor (data
fetching moves, effects become server calls, some libraries break under SSR).
SSR → CSR is easy. So when the requirement is genuinely unclear, starting with
Vite is the cheaper mistake — with one exception: **if you know SEO matters,
choose the framework on day one.** Retrofitting SEO onto a shipped CSR app is
the one migration that reliably becomes a rewrite.

---

## 13. Decision worksheet

Answer these five, in order. The first "yes" usually decides it.

1. **Must search engines and link-preview scrapers read this content?**
   → Yes: SSR or SSG. This is the question that removes CSR from the table.
2. **Is the content the same for everyone, and does it change rarely?**
   → Yes: **SSG** (+ ISR if "rarely" means hourly rather than monthly).
3. **Must the data be correct at the moment of the request** (inventory,
   pricing, live scores)?
   → Yes: **SSR**.
4. **Is everything behind a login, with per-user data and no SEO need?**
   → Yes: **CSR** is the right answer and the cheapest to build and host.
5. **Are different parts of the product answering differently?**
   → Yes — and this is the normal case. Use a framework and choose per route,
   as in [§7](#7-real-world-example-an-e-commerce-website).

### Worked verdicts

| Product | Verdict | Why |
|---|---|---|
| Internal admin dashboard behind SSO | **CSR (Vite)** | No SEO, per-user data, cheapest hosting, simplest model |
| Marketing site + blog | **SSG** | Identical for everyone, changes weekly, must rank, must survive a launch spike |
| E-commerce storefront | **Mixed** | SSG home/category, SSR product/search, CSR cart & account |
| News site | **SSR + ISR** | Fresh content, heavy SEO, huge unpredictable traffic |
| Real-time trading dashboard | **CSR** | Behind auth, WebSocket-driven, nothing to crawl |
| Documentation site | **SSG** | The React docs themselves are the canonical example |
| Social feed | **SSR** for the shell, **CSR** for the feed | Shareable profile URLs need HTML; the infinite feed is client work |
| Booking/inventory site | **SSR** | Availability is worthless if it is stale |

---

## 14. Self-check

1. In one sentence each: where and when is HTML produced under CSR, SSR and SSG?
2. Why does a CSR app hurt link previews on WhatsApp or LinkedIn even though
   Google can usually index it?
3. What exactly is hydration, and what is the user experiencing during it?
4. Give three values that cause hydration mismatches, and where they should
   live instead.
5. Why does SSR improve FCP but not TTI?
6. You fix a typo in one of 5,000 SSG blog posts. What has to happen, and which
   feature avoids a full rebuild?
7. Which strategy survives a 100× traffic spike with no action from you, and
   why?
8. Why can't Vite mix server-rendered and client-rendered components on one
   page?
9. What does `'use client'` actually do, and why should it sit as deep in the
   tree as possible?
10. Name two kinds of prop you cannot pass from a Server Component to a Client
    Component.
11. Which one of the three cannot personalise its HTML per user, and what is the
    standard workaround?
12. For an e-commerce site, justify a *different* choice for the homepage, a
    product page, and the account settings page.
13. You are told "we'll add SEO later, ship the Vite SPA now." What is your
    response?

---

## 15. References

Official React documentation only.

**Choosing an architecture**
- [Creating a React App](https://react.dev/learn/creating-a-react-app) — why the team recommends a framework, and which frameworks support which strategies
- [Build a React App from Scratch](https://react.dev/learn/build-a-react-app-from-scratch) — what you take on yourself, including SSR
- [Sunsetting Create React App](https://react.dev/blog/2025/02/14/sunsetting-create-react-app) — the deprecation and the rendering-architecture reasoning behind it

**Server rendering and hydration**
- [`hydrateRoot`](https://react.dev/reference/react-dom/client/hydrateRoot) — attaching React to server-rendered HTML
- [`renderToPipeableStream`](https://react.dev/reference/react-dom/server/renderToPipeableStream) — streaming SSR in Node
- [`renderToReadableStream`](https://react.dev/reference/react-dom/server/renderToReadableStream) — streaming SSR in edge runtimes
- [`prerender`](https://react.dev/reference/react-dom/static/prerender) — static prerendering (the SSG primitive)
- [`Suspense`](https://react.dev/reference/react/Suspense) — the streaming boundary

**Server Components and the client boundary**
- [Server Components](https://react.dev/reference/rsc/server-components)
- [Server Functions](https://react.dev/reference/rsc/server-functions)
- [`'use client'`](https://react.dev/reference/rsc/use-client)
- [`'use server'`](https://react.dev/reference/rsc/use-server)
- [React 19 release notes](https://react.dev/blog/2024/12/05/react-19) — Actions and the RSC APIs

---

**Previous:** [Module 2 — Introduction to React & Getting Started](../02-react-introduction/)
**Next:** [Module 4 — Describing the UI: Components & JSX](../04-components-and-jsx/)
