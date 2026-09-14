# Axios, HTTP & Routing in React — Study Guide & Guided Project

**What this is:** a self-contained, incremental study guide for the two things every real React app needs — **talking to a backend with axios** and **routing with React Router**. Every concept is explained, then immediately applied to one app that you grow step by step.

**What you'll build:** **ShopScope** — a product catalogue with search, filters, pagination, a detail page, full CRUD, JWT login, silent token refresh, protected and role-gated routes, route loaders and actions, optimistic updates, upload progress, and retries. Structured the way a production codebase is structured: environment profiles, a layered API module, and centralised error handling.

**Stack:**

| Concern | Choice | Why |
|---|---|---|
| HTTP | **axios** | Interceptors, instances, real error semantics |
| UI | **React Bootstrap 2 + Bootstrap 5** | Zero custom CSS — the HTTP layer stays the subject |
| Routing | **React Router v8 (Data Mode)** | Loaders, actions, middleware, route error boundaries |
| Backend | **[DummyJSON](https://dummyjson.com)** | Free, no signup, CORS-enabled, real JWT + refresh flow |
| Build | **Vite** | Env profiles via `--mode` |

**Language:** JavaScript (`.jsx`). A full TypeScript section is included near the end.

---

## How to use this guide

Work top to bottom. The document alternates between two kinds of sections:

| Section type | What it is |
|---|---|
| **Concept** | The idea explained, with a small standalone example you can read or paste into a scratch file. |
| **🔨 Build Step** | Code you paste into the ShopScope project. Every build step leaves the app **running and working**. |

Rules that make this go well:

1. **Keep the browser Network tab open.** Ninety percent of debugging HTTP is looking at the request that actually went out — URL, method, headers, body — and the response that actually came back. Guessing is slower.
2. **Run the app after every build step.** Errors compound.
3. **Type the code at least once.** Pasting teaches you nothing about where the commas go.
4. **Do the "Try it yourself" prompts.** That's where it sticks.

> **About DummyJSON:** reads are real, **writes are simulated**. `POST /products/add` returns a fully-formed product with a new `id`, but nothing persists — refresh and it's gone. Perfect for learning request/response mechanics, and we design the UI around it (merging server responses into local state) exactly as you would against a real API.

---

## Table of contents

**Part 0 — Setup**
- [0. Environment & project setup](#part-0--environment--project-setup)

**Part 1 — Configuration**
- [1. Environment profiles & config](#part-1--configuration--environment-profiles)

**Part 2 — axios fundamentals**
- [2. Why axios (and when `fetch` is fine)](#2-why-axios-and-when-fetch-is-fine)
- [3. Your first request & the response object](#3-your-first-request--the-response-object)
- [4. The request config object](#4-the-request-config-object)
- [5. The three states of every request](#5-the-three-states-of-every-request)
- [6. Errors: the anatomy of an axios failure](#6-errors-the-anatomy-of-an-axios-failure)
- [7. Cancellation, StrictMode & race conditions](#7-cancellation-strictmode--race-conditions)

**Part 3 — A production API layer**
- [8. Instances & defaults](#8-instances--defaults)
- [9. Endpoints & service modules](#9-endpoints--service-modules)
- [10. A single error model: `ApiError`](#10-a-single-error-model-apierror)
- [11. Request interceptors](#11-request-interceptors)
- [12. Response interceptors](#12-response-interceptors)
- [13. Query parameters](#13-query-parameters)
- [14. Parallel requests](#14-parallel-requests)
- [15. Path params & fetching one record](#15-path-params--fetching-one-record)
- [16. POST, PUT, PATCH, DELETE](#16-post-put-patch-delete)
- [17. Custom hooks: `useApi`](#17-custom-hooks-useapi)

**Part 4 — Authentication**
- [18. Tokens & the auth service](#18-tokens--the-auth-service)
- [19. Attaching the token](#19-attaching-the-token)
- [20. Silent refresh: the 401 queue](#20-silent-refresh-the-401-queue)

**Part 5 — Routing with React Router v8**
- [21. What v8 changed, and installing it](#21-what-v8-changed-and-installing-it)
- [22. Your first router](#22-your-first-router)
- [23. Layouts, `Outlet`, index routes & links](#23-layouts-outlet-index-routes--links)
- [24. Dynamic segments & URL params](#24-dynamic-segments--url-params)
- [25. The URL is state: `useSearchParams`](#25-the-url-is-state-usesearchparams)
- [26. Loaders: data before render](#26-loaders-data-before-render)
- [27. Pending UI: `useNavigation`](#27-pending-ui-usenavigation)
- [28. Actions & `<Form>`](#28-actions--form)
- [29. Fetchers: mutations without navigation](#29-fetchers-mutations-without-navigation)
- [30. Route error boundaries](#30-route-error-boundaries)
- [31. Protected routes — three ways](#31-protected-routes--three-ways)
- [32. Login, `redirectTo` & revalidation](#32-login-redirectto--revalidation)
- [33. Roles & permission-gated routes](#33-roles--permission-gated-routes)
- [34. Lazy routes & code splitting](#34-lazy-routes--code-splitting)
- [35. The rest of the router toolkit](#35-the-rest-of-the-router-toolkit)

**Part 6 — Advanced HTTP**
- [36. Optimistic updates](#36-optimistic-updates)
- [37. Upload & download progress](#37-upload--download-progress)
- [38. Timeouts & retries](#38-timeouts--retries)
- [39. Concurrency](#39-concurrency)

**Part 7 — Production**
- [40. axios + TanStack Query](#40-axios--tanstack-query)
- [41. TypeScript](#41-typescript)
- [42. Testing & mocking HTTP](#42-testing--mocking-http)
- [43. Security](#43-security)
- [44. Final project structure](#44-final-project-structure)

**Reference**
- [axios cheat sheet](#axios-cheat-sheet)
- [React Router v8 cheat sheet](#react-router-v8-cheat-sheet)
- [Common mistakes](#common-mistakes-and-how-to-avoid-them)
- [Glossary](#glossary)
- [Exercises](#exercises)

---

# Part 0 — Environment & project setup

## 0.1 Prerequisites

React Router v8 raised its floor, so check these before you start — a mismatch here produces confusing errors later:

| Tool | Version | Check with |
|---|---|---|
| **Node.js** | **22.22.0 or newer** (v8 requirement) | `node -v` |
| **React** | **19.2.7 or newer** (v8 peer dependency) | `npm ls react` |
| npm | comes with Node | `npm -v` |
| Browser | Chrome/Edge + [React Developer Tools](https://react.dev/learn/react-developer-tools) | — |

You should already be comfortable with: components, `useState`, `useEffect`, lists and keys, controlled inputs, and `async`/`await`. If `async`/`await` is hazy, spend twenty minutes on it first — the entire guide is built on it.

## 0.2 Create the project

```bash
npm create vite@latest shopscope -- --template react
cd shopscope
npm install
```

Check the React version Vite gave you:

```bash
npm ls react
```

If it's below **19.2.7**, upgrade — React Router v8 will refuse to install cleanly otherwise:

```bash
npm install react@latest react-dom@latest
```

## 0.3 Install the dependencies

```bash
npm install axios react-router react-bootstrap bootstrap react-bootstrap-icons
```

Four things to note about that line:

- **`react-router`, not `react-router-dom`.** The `react-router-dom` package **was removed in v8**. Everything lives in `react-router`, except `RouterProvider`, which comes from `react-router/dom`. If you've written v6 or v7 before, this is the change that will trip you up most often.
- **`react-bootstrap` + `bootstrap`** are two packages: the components and the stylesheet. You need both.
- **No custom CSS anywhere in this guide.** React Bootstrap gives us cards, spinners, alerts, forms, progress bars and an off-canvas drawer; Bootstrap's utility classes handle layout. Your attention stays on HTTP and routing.
- **Version note:** the stable React Bootstrap line is `2.x` (targets Bootstrap 5). A `3.0.0-beta` targets React 19 specifically. Stable v2 (2.10.7+) works with React 19; if you hit ref or `Navbar` type conflicts, try `npm install react-bootstrap@next`.

Confirm what you got:

```bash
npm ls react-router react-bootstrap axios
```

## 0.4 The API we'll use

Everything below is a real, live endpoint. Open a couple in your browser now — seeing raw JSON before writing code against it is a habit worth forming.

| Purpose | Request |
|---|---|
| List products (paginated) | `GET https://dummyjson.com/products?limit=12&skip=0` |
| Pick fields | `GET https://dummyjson.com/products?select=id,title,price` |
| Search | `GET https://dummyjson.com/products/search?q=phone` |
| One product | `GET https://dummyjson.com/products/101` |
| Category list | `GET https://dummyjson.com/products/categories` |
| Products in a category | `GET https://dummyjson.com/products/category/smartphones` |
| Sort | `GET https://dummyjson.com/products?sortBy=price&order=desc` |
| Create (simulated) | `POST https://dummyjson.com/products/add` |
| Update (simulated) | `PATCH https://dummyjson.com/products/101` |
| Delete (simulated) | `DELETE https://dummyjson.com/products/101` |
| Log in | `POST https://dummyjson.com/auth/login` |
| Current user | `GET https://dummyjson.com/auth/me` (needs `Authorization: Bearer …`) |
| Refresh tokens | `POST https://dummyjson.com/auth/refresh` |
| **Add artificial latency** | append `&delay=2000` to any request |

**Test credentials:** username `emilys`, password `emilyspass`.

The list shape is consistent and worth memorising:

```json
{ "products": [ … ], "total": 194, "skip": 0, "limit": 12 }
```

And every error, whatever the status, comes back as:

```json
{ "message": "Product with id '9999' not found" }
```

> **`delay` is the most useful thing on that list.** Loading states, cancellation, and pending navigation are invisible on a fast connection. `?delay=2000` makes them visible. Use it constantly while building.

## 0.5 Wire up Bootstrap

React Bootstrap ships the **components**; the `bootstrap` package ships the **stylesheet**. The stylesheet must be imported once, at the app root, before your own styles.

Replace **`src/main.jsx`**:

```jsx
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "bootstrap/dist/css/bootstrap.min.css"   // ← must come before ./index.css
import "./index.css"
import App from "./App.jsx"

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

Now **empty `src/index.css`** (Vite's default styles fight with Bootstrap) and **delete `src/App.css`**.

> **Keep `<StrictMode>`.** It's what surfaces the double-fetch behaviour we handle properly in [§7](#7-cancellation-strictmode--race-conditions).

### The React Bootstrap vocabulary

You don't need to know Bootstrap to follow along. This is the whole list, each introduced in context:

| Component | Used for |
|---|---|
| `Container`, `Row`, `Col`, `Stack` | Layout |
| `Card` | Product tiles, form panels |
| `Button`, `Form.Control`, `Form.Select`, `InputGroup` | Controls |
| `Alert` | Errors, empty states, success messages |
| `Spinner`, `Placeholder`, `ProgressBar` | Progress and loading |
| `Offcanvas`, `Modal` | Overlays |
| `Navbar`, `Nav`, `Badge`, `Pagination`, `Dropdown` | Chrome |

Plus utility classes: `mb-3` (margin-bottom), `text-muted`, `d-flex`, `gap-2`, `small`, `fw-semibold`. The [Bootstrap utilities docs](https://getbootstrap.com/docs/5.3/utilities/spacing/) are a two-minute read if one is unfamiliar.

## 0.6 Where we're heading

This is the structure we'll arrive at. You don't need to create it now — each build step adds its own files — but it's worth seeing the shape up front, because **the folder layout is the architecture**:

```
src/
├── config/            # environment profiles, validated once
├── api/
│   ├── client.js      # axios instances
│   ├── endpoints.js   # every URL in the app, in one place
│   ├── interceptors/  # auth, logging, error normalisation — one file each
│   └── services/      # products.js, auth.js — domain functions
├── lib/               # ApiError, error mapping, token store
├── hooks/
├── components/
├── routes/            # one file per route: Component + loader + action
└── router.jsx         # the route tree
```

The dependency arrows all point one way:

```
routes → components → hooks → api/services → api/client → axios
```

**Nothing above `api/` imports axios.** Swap axios for `fetch`, or DummyJSON for your real backend, and only the bottom two layers change.

## 0.7 Verify

```bash
npm run dev
```

Open the URL Vite prints. The page will look different from the Vite default — Bootstrap's stylesheet has taken over. That's your confirmation the CSS import landed.

---

# Part 1 — Configuration & environment profiles

Before a single request, decide where the API URL comes from. Getting this right at the start costs ten minutes; retrofitting it across forty files costs an afternoon.

## 1.1 Never hard-code the base URL

```js
// ✗ Works on your laptop, nowhere else
axios.get("https://dummyjson.com/products")
```

The same build has to run against local, dev, staging, and production backends. Hard-coded URLs mean either a code change per environment or a nest of `if (window.location.host === …)`. Both are worse than the five-line alternative.

## 1.2 Vite env files and modes

Vite has a **mode** — a string, defaulting to `development` for `npm run dev` and `production` for `npm run build`. The mode selects which `.env` files load.

| File | Loaded when | Commit it? |
|---|---|---|
| `.env` | Always | ✅ Yes — shared defaults |
| `.env.local` | Always, except in tests | ❌ **No** — personal overrides |
| `.env.[mode]` | Only in that mode | ✅ Yes |
| `.env.[mode].local` | Only in that mode | ❌ No |

Later files win, and `.local` beats non-local. So `.env.production` overrides `.env`, and `.env.production.local` overrides both.

**Only variables prefixed `VITE_` are exposed to browser code.** Everything else is stripped at build time — a deliberate guard rail so a stray `DATABASE_PASSWORD` in your shell doesn't end up in a bundle.

## 🔨 Build Step 1 — Environment profiles

Create four files in the project root.

**`.env`** — shared defaults, committed:

```bash
VITE_APP_NAME=ShopScope
VITE_API_BASE_URL=https://dummyjson.com
VITE_API_TIMEOUT_MS=10000
VITE_LOG_LEVEL=warn
VITE_FEATURE_UPLOADS=false
```

**`.env.development`** — committed:

```bash
VITE_LOG_LEVEL=debug
VITE_FEATURE_UPLOADS=true
VITE_API_TIMEOUT_MS=30000
```

A longer timeout in development is deliberate: you'll be adding `?delay=` to requests, and a 10-second timeout would kill your own experiments.

**`.env.staging`** — committed:

```bash
VITE_API_BASE_URL=https://dummyjson.com
VITE_LOG_LEVEL=info
VITE_FEATURE_UPLOADS=true
```

**`.env.production`** — committed:

```bash
VITE_LOG_LEVEL=error
VITE_FEATURE_UPLOADS=false
```

**`.env.local`** — **not** committed. Create it and add `.env.local` to `.gitignore` (Vite's template already ignores `*.local`):

```bash
# Your personal overrides. Point at a local backend, for example:
# VITE_API_BASE_URL=http://localhost:4000
```

Add the scripts to **`package.json`**:

```json
{
  "scripts": {
    "dev": "vite",
    "dev:staging": "vite --mode staging",
    "build": "vite build",
    "build:staging": "vite build --mode staging",
    "preview": "vite preview"
  }
}
```

`--mode staging` is the whole mechanism: one flag, a different set of `.env` files, the same source code.

## 1.3 A validated config module

Reading `import.meta.env.VITE_…` all over the codebase re-introduces the problem you just solved — now the *names* are scattered instead of the *values*. Read them **once**, validate, coerce types, and export a frozen object.

Create **`src/config/env.js`**:

```js
/**
 * The single source of truth for environment configuration.
 *
 * Read `import.meta.env` nowhere else in the app. This module validates
 * on import, so a misconfigured deploy fails at startup with a clear
 * message instead of at 2am with `baseURL: undefined`.
 */

function required(name) {
  const value = import.meta.env[name]
  if (value === undefined || value === "") {
    throw new Error(
      `[config] Missing required env var ${name}. ` +
        `Add it to .env or .env.${import.meta.env.MODE}.`
    )
  }
  return value
}

function optional(name, fallback) {
  const value = import.meta.env[name]
  return value === undefined || value === "" ? fallback : value
}

function asNumber(name, fallback) {
  const raw = optional(name, undefined)
  if (raw === undefined) return fallback
  const parsed = Number(raw)
  if (Number.isNaN(parsed)) {
    throw new Error(`[config] ${name} must be a number, got "${raw}".`)
  }
  return parsed
}

/** Env vars are ALWAYS strings. "false" is truthy. This is the classic bug. */
function asBoolean(name, fallback) {
  const raw = optional(name, undefined)
  if (raw === undefined) return fallback
  return raw === "true" || raw === "1"
}

export const env = Object.freeze({
  appName: optional("VITE_APP_NAME", "ShopScope"),
  mode: import.meta.env.MODE,              // 'development' | 'staging' | 'production'
  isDev: import.meta.env.DEV,              // true for `vite dev`, any mode
  isProd: import.meta.env.PROD,            // true for any `vite build`

  api: Object.freeze({
    baseUrl: required("VITE_API_BASE_URL").replace(/\/$/, ""),   // no trailing slash
    timeoutMs: asNumber("VITE_API_TIMEOUT_MS", 10_000),
  }),

  logLevel: optional("VITE_LOG_LEVEL", "warn"),   // debug | info | warn | error

  features: Object.freeze({
    uploads: asBoolean("VITE_FEATURE_UPLOADS", false),
  }),
})

if (env.isDev) {
  console.info(`[config] ${env.appName} · mode=${env.mode} · api=${env.api.baseUrl}`)
}
```

Five things this buys you that scattered `import.meta.env` reads do not:

1. **Fail fast, loudly.** A missing `VITE_API_BASE_URL` throws on import with a message naming the file to fix — not `undefined` silently concatenated into a URL.
2. **Type coercion in one place.** `import.meta.env.VITE_FEATURE_UPLOADS` is the *string* `"false"`, which is **truthy**. `asBoolean` is the fix, and writing it once means you can't forget it.
3. **`Object.freeze`.** Config is read-only. Nobody "temporarily" mutates it.
4. **Normalisation.** Stripping the trailing slash prevents `https://api.co//products`.
5. **One import to mock in tests.**

## 1.4 A log level that respects the environment

`console.log` left in production is noise at best and a data leak at worst. Gate it.

Create **`src/config/logger.js`**:

```js
import { env } from "./env"

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 }
const threshold = LEVELS[env.logLevel] ?? LEVELS.warn

function log(level, ...args) {
  if (LEVELS[level] < threshold) return
  const method = level === "debug" ? "log" : level
  console[method](`[${level}]`, ...args)
}

export const logger = {
  debug: (...a) => log("debug", ...a),
  info: (...a) => log("info", ...a),
  warn: (...a) => log("warn", ...a),
  error: (...a) => log("error", ...a),
}
```

Now `logger.debug(…)` is free in production — the level check short-circuits before the arguments are formatted. Our interceptors will use this instead of raw `console`.

## 1.5 What must never go in `.env`

**Everything in a `VITE_` variable is compiled into the JavaScript bundle and is readable by anyone with DevTools.** `.env` files are for *configuration*, not *secrets*.

| Safe | Never |
|---|---|
| API base URLs | Private API keys |
| Feature flags | Database credentials |
| Public analytics IDs | Payment provider secret keys |
| Log levels | JWT signing secrets |

A third-party key that must stay private belongs on a server you control, which proxies the request. There is no client-side workaround, and no amount of obfuscation changes it.

> **Other toolchains, same idea:** Create React App uses `REACT_APP_` and `process.env`. Next.js uses `NEXT_PUBLIC_`. The prefix differs; the rule that the bundle is public does not.

## 🔨 Build Step 1b — Prove it works

Temporarily replace **`src/App.jsx`**:

```jsx
import { Alert, Container, Table } from "react-bootstrap"
import { env } from "./config/env"

export default function App() {
  return (
    <Container className="py-4">
      <h1 className="h3">{env.appName}</h1>
      <Alert variant={env.isDev ? "info" : "warning"}>
        Running in <strong>{env.mode}</strong> mode.
      </Alert>
      <Table striped bordered size="sm">
        <tbody>
          <tr><td>API base URL</td><td><code>{env.api.baseUrl}</code></td></tr>
          <tr><td>Timeout</td><td>{env.api.timeoutMs} ms</td></tr>
          <tr><td>Log level</td><td>{env.logLevel}</td></tr>
          <tr><td>Uploads enabled</td><td>{String(env.features.uploads)}</td></tr>
        </tbody>
      </Table>
    </Container>
  )
}
```

Run `npm run dev` → mode `development`, timeout 30000, log level `debug`, uploads `true`.

Stop it and run `npm run dev:staging` → mode `staging`, timeout 10000 (inherited from `.env`), log level `info`.

> **Try it yourself:** comment out `VITE_API_BASE_URL` in `.env` and reload. You get a precise startup error naming the variable and the file — not a mystery 404 twenty minutes later. That's the whole point of `required()`.

---

# Part 2 — axios fundamentals

# 2. Why axios (and when `fetch` is fine)

`fetch` is built into every browser. axios is a ~13 kB dependency. So why add it?

| Concern | `fetch` | axios |
|---|---|---|
| JSON response | `await res.json()` every time | `res.data`, already parsed |
| JSON request body | `JSON.stringify` + set `Content-Type` | Pass the object; both handled |
| HTTP errors (404/500) | **Resolves normally** — you must check `res.ok` | **Rejects** — `try/catch` catches them |
| Base URL | Concatenate strings | `baseURL` on an instance |
| Query params | Build a `URLSearchParams` | `params: { … }` object |
| Timeouts | Manual `AbortSignal.timeout()` | `timeout: 10000` |
| Interceptors | None — wrap it yourself | First-class request/response hooks |
| Upload progress | Not supported | `onUploadProgress` |

Two of those matter far more than the rest.

**1. axios rejects on HTTP error statuses.** With `fetch`, this code is broken and looks fine:

```js
// BROKEN: a 500 sails straight through
const res = await fetch("/api/products")
const data = await res.json()   // may be an error body, or may throw
```

With axios, a 404 or 500 lands in `catch`, which is where your brain already expects failure to go.

**2. Interceptors.** One place to attach the auth token to every request, one place to normalise every error, one place to handle a 401 by refreshing the token. Without them, that logic is copy-pasted into every call site and drifts.

**When `fetch` is genuinely fine:** a tiny app with two or three calls, a serverless function, or a library that must ship zero dependencies. Nothing here is impossible with `fetch` — you'd just be rewriting the parts of axios you need.

---

# 3. Your first request & the response object

```js
import axios from "axios"

const response = await axios.get("https://dummyjson.com/products/1")
console.log(response.data.title)
```

**`response` is not your data.** It's an envelope. Learn its five fields now and stop guessing later:

| Field | What it holds |
|---|---|
| `data` | The parsed response body — **what you want 95% of the time** |
| `status` | Number: `200`, `201`, `404` |
| `statusText` | `"OK"`, `"Not Found"` |
| `headers` | Response headers, lowercase keys: `headers["content-type"]` |
| `config` | The config axios used — mostly useful inside interceptors |

Which is why nearly every axios call destructures immediately:

```js
const { data } = await axios.get("https://dummyjson.com/products/1")
```

**When you need the rest:** `status` to distinguish `200` from `201` or `204`. `headers` for pagination (`x-total-count`), rate limits, or a filename from `content-disposition`. `config` almost exclusively in interceptors.

### The shorthand methods

```js
axios.get(url, config)
axios.delete(url, config)
axios.head(url, config)

axios.post(url, data, config)     // note: data is the SECOND argument
axios.put(url, data, config)
axios.patch(url, data, config)
```

**The most common beginner bug in all of axios** is passing config where data goes, or vice versa:

```js
// ✗ WRONG — the headers object is sent as the request body
axios.post("/products/add", { headers: { "X-Trace": "1" } })

// ✓ RIGHT
axios.post("/products/add", { title: "Widget" }, { headers: { "X-Trace": "1" } })

// ✗ WRONG — GET has no body argument; this object is treated as CONFIG
axios.get("/products", { limit: 5 })      // silently ignored

// ✓ RIGHT
axios.get("/products", { params: { limit: 5 } })
```

Remember: **`get`/`delete` take (url, config). `post`/`put`/`patch` take (url, data, config).**

### The universal form

Every shorthand is sugar over one call:

```js
const { data } = await axios({
  method: "post",
  url: "https://dummyjson.com/products/add",
  data: { title: "Widget", price: 12.5 },
  timeout: 5000,
})
```

Handy when the method is dynamic (`method: isNew ? "post" : "put"`), and it's exactly the object interceptors receive.

## 🔨 Build Step 2 — Talk to the API

Replace **`src/App.jsx`**:

```jsx
import { useEffect, useState } from "react"
import axios from "axios"
import { Container } from "react-bootstrap"
import { env } from "./config/env"

export default function App() {
  const [product, setProduct] = useState(null)

  useEffect(() => {
    axios.get(`${env.api.baseUrl}/products/1`).then((response) => {
      console.log("Full response envelope:", response)
      setProduct(response.data)
    })
  }, [])

  return (
    <Container className="py-4">
      <h1 className="h3">ShopScope</h1>
      <p className="text-muted">Step 2 — one request, no error handling yet.</p>
      <pre className="bg-dark text-light p-3 rounded small">
        {JSON.stringify(product, null, 2)}
      </pre>
    </Container>
  )
}
```

Run it. In the console, expand the logged response and look at `status`, `headers`, and `config` — the envelope, live. In the **Network** tab, check the request headers: axios set `Accept: application/json, text/plain, */*` for you.

> **Try it yourself:** change the URL to `/products/9999`. The page shows `null` forever and a red error appears in the console. That gap is what the next four sections close.

---

# 4. The request config object

Every axios call is ultimately configured by one object. The options you'll actually use:

```js
{
  url: "/products",
  method: "get",                    // default: get
  baseURL: "https://dummyjson.com", // prefixed to url unless url is absolute
  params: { limit: 12, skip: 0 },   // → ?limit=12&skip=0
  data: { title: "Widget" },        // request body (post/put/patch)
  headers: { Authorization: "Bearer …" },
  timeout: 10000,                   // ms; 0 = no timeout (the DEFAULT)
  signal: controller.signal,        // AbortController
  responseType: "json",             // 'json' | 'text' | 'blob' | 'arraybuffer' | 'stream'
  withCredentials: false,           // send cookies cross-origin
  validateStatus: (s) => s >= 200 && s < 300,
  onUploadProgress: (e) => {},
  onDownloadProgress: (e) => {},
  paramsSerializer: { … },
}
```

Four notes worth internalising:

**`timeout` defaults to `0` — meaning never.** A dead backend leaves your spinner turning until the user gives up. Always set one on your instance.

**`baseURL` + `url` join with normal URL rules.** `baseURL: "https://api.co/v1"` + `url: "/products"` → `https://api.co/v1/products`. Always lead with `/` and be consistent.

**`validateStatus` decides what "success" means.** Sometimes a 404 is a legitimate answer, not an error:

```js
const res = await api.get(`/drafts/${id}`, {
  validateStatus: (s) => s === 200 || s === 404,
})
const draft = res.status === 404 ? null : res.data
```

**`responseType: "blob"`** is how you download a file — see [§37](#37-upload--download-progress).

---

# 5. The three states of every request

Any component that fetches must render exactly three things:

1. **Loading** — in flight
2. **Error** — it failed
3. **Success** — here's the data

Skip one and your UI is broken in production regardless of how nice it looks locally. The canonical shape:

```jsx
function Thing() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const { data } = await axios.get("/api/thing")
        setData(data)
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)   // runs on BOTH paths — this is why finally exists
      }
    }
    load()
  }, [])

  if (loading) return <Skeleton />
  if (error) return <ErrorNotice error={error} />
  return <Content data={data} />
}
```

Three details people get wrong:

- **`setError(null)` at the start.** Otherwise a stale error survives a successful retry.
- **`finally`.** Clear `loading` there, never at the end of `try` — an error would skip it and spin forever.
- **The async function goes *inside* the effect.** `useEffect(async () => …)` returns a promise where React expects a cleanup function. React warns about it.

**Initialise `loading` to `true`, not `false`.** Between first render and the effect firing, no request has started but one certainly will. Starting at `false` produces a one-frame flash of the empty state — the flicker that makes an app feel cheap.

## 🔨 Build Step 3 — The product list

Create **`src/components/Skeletons.jsx`**. React Bootstrap's `Placeholder` is purpose-built for this; `animation="glow"` gives the shimmer and `xs={n}` sets twelve-column widths:

```jsx
import { Card, Col, Placeholder, Row } from "react-bootstrap"

export function CardSkeletons({ count = 8 }) {
  return (
    <Row xs={1} sm={2} md={3} lg={4} className="g-3">
      {Array.from({ length: count }, (_, i) => (
        <Col key={i}>
          <Card className="h-100">
            <div className="bg-body-secondary" style={{ height: 140 }} />
            <Card.Body>
              <Placeholder as={Card.Title} animation="glow">
                <Placeholder xs={8} />
              </Placeholder>
              <Placeholder as="div" animation="glow">
                <Placeholder xs={5} /> <Placeholder xs={3} />
              </Placeholder>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  )
}
```

Create **`src/components/ProductCard.jsx`**:

```jsx
import { Card } from "react-bootstrap"

export function ProductCard({ product }) {
  return (
    <Card className="h-100">
      <Card.Img
        variant="top"
        src={product.thumbnail}
        alt=""
        loading="lazy"
        className="object-fit-contain bg-body-secondary p-2"
        style={{ height: 140 }}
      />
      <Card.Body className="d-flex flex-column">
        <Card.Title className="fs-6">{product.title}</Card.Title>
        <div className="d-flex justify-content-between align-items-center mt-auto">
          <span className="text-muted small text-capitalize">{product.category}</span>
          <strong>${product.price}</strong>
        </div>
      </Card.Body>
    </Card>
  )
}
```

`h-100` on every card plus `mt-auto` on the footer row keeps prices aligned across a row of cards with different title lengths. (`object-fit-contain` needs Bootstrap 5.3+; on older versions use `style={{ objectFit: "contain" }}`.)

Replace **`src/App.jsx`**:

```jsx
import { useEffect, useState } from "react"
import axios from "axios"
import { Alert, Col, Container, Row } from "react-bootstrap"
import { env } from "./config/env"
import { ProductCard } from "./components/ProductCard"
import { CardSkeletons } from "./components/Skeletons"

export default function App() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const { data } = await axios.get(`${env.api.baseUrl}/products`, {
          params: { limit: 12, skip: 0 },
        })
        setProducts(data.products)
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <Container className="py-4">
      <h1 className="h3">ShopScope</h1>
      <p className="text-muted">Step 3 — loading, error, and success states.</p>

      {loading && <CardSkeletons count={12} />}
      {error && <Alert variant="danger">{error.message}</Alert>}
      {!loading && !error && (
        <Row xs={1} sm={2} md={3} lg={4} className="g-3">
          {products.map((p) => (
            <Col key={p.id}>
              <ProductCard product={p} />
            </Col>
          ))}
        </Row>
      )}
    </Container>
  )
}
```

**Note where the `key` goes:** on the `<Col>` — the outermost element `map` produces — not on the `<ProductCard>` inside it. On the inner component it's a silent no-op.

> **Try it yourself:** to actually see the skeletons, add `delay: 3000` to `params` temporarily. Then point the URL at `/nope`: you get `Request failed with status code 404` — technically correct, useless to a user. Section 6 fixes that.

---

# 6. Errors: the anatomy of an axios failure

When an axios request fails, the thrown error has a specific shape, and **exactly one of three situations** applies. Telling them apart is the whole skill.

```js
try {
  await axios.get(url)
} catch (err) {
  if (err.response) {
    // 1. The server answered, with a status outside 2xx.
    err.response.status    // 404, 401, 500 …
    err.response.data      // the error BODY — { message: "…" } on DummyJSON
    err.response.headers
  } else if (err.request) {
    // 2. The request was sent, but no response came back.
    //    Offline, DNS failure, CORS block, timeout, server down.
  } else {
    // 3. The request was never sent — a bug in your config code.
  }
  err.message   // human-ish string
  err.code      // 'ERR_NETWORK' | 'ECONNABORTED' | 'ERR_CANCELED' | 'ERR_BAD_REQUEST'
  err.config    // the config used
}
```

### The single most important line

```js
const message = err.response?.data?.message ?? err.message
```

`err.message` is written for *developers* (`"Request failed with status code 400"`). `err.response.data.message` is written by your *backend* for *users* (`"Invalid credentials"`). Always prefer the backend's, fall back to axios's.

### Not every error in a `catch` is an axios error

Your own code inside `try` can throw too:

```js
import axios from "axios"

catch (err) {
  if (axios.isAxiosError(err)) {
    // safe to read err.response
  } else {
    throw err     // a TypeError in your own mapping code — don't swallow it
  }
}
```

### Mapping statuses to messages

Users don't know what a 422 is. Translate once, centrally — we'll formalise this into an `ApiError` class in [§10](#10-a-single-error-model-apierror), but the mapping logic is the same:

```js
export function toMessage(err) {
  if (axios.isCancel(err)) return null              // not an error; show nothing
  const status = err.response?.status
  const fromServer = err.response?.data?.message

  if (err.code === "ECONNABORTED") return "The server took too long. Try again."
  if (!err.response) return "Can't reach the server. Check your connection."

  switch (status) {
    case 400:
    case 422: return fromServer ?? "Some of the details weren't valid."
    case 401: return "Your session expired. Please sign in again."
    case 403: return "You don't have access to this."
    case 404: return fromServer ?? "We couldn't find that."
    case 429: return "Too many requests. Give it a moment."
    default:
      if (status >= 500) return "Something broke on our end. We're on it."
      return fromServer ?? "Something went wrong."
  }
}
```

Rules that hold up in real products:

- **4xx = the user or client can fix it.** Say what to do.
- **5xx = they can't.** Apologise, offer retry, log it somewhere you'll see.
- **Never render a raw stack trace.** It leaks internals and helps nobody.
- **Always give a way forward** — a Retry button, a link back.

## 🔨 Build Step 4 — Honest error UI

Create **`src/lib/errors.js`** with the `toMessage` function above (including `import axios from "axios"`).

Create **`src/components/ErrorNotice.jsx`**:

```jsx
import { Alert, Button } from "react-bootstrap"
import { ExclamationTriangleFill } from "react-bootstrap-icons"
import { env } from "../config/env"
import { toMessage } from "../lib/errors"

export function ErrorNotice({ error, onRetry, variant = "danger" }) {
  const message = error?.friendlyMessage ?? toMessage(error)
  if (!message) return null      // cancelled requests produce null — render nothing

  return (
    <Alert variant={variant} className="d-flex align-items-start gap-2">
      <ExclamationTriangleFill className="mt-1 flex-shrink-0" />
      <div className="flex-grow-1">
        <div>{message}</div>
        {env.isDev && error?.config?.url && (
          <div className="small text-muted mt-1 font-monospace">
            {error.config.method?.toUpperCase()} {error.config.url}
            {error.response ? ` → ${error.response.status}` : " → no response"}
          </div>
        )}
      </div>
      {onRetry && (
        <Button size="sm" variant={`outline-${variant}`} onClick={onRetry}>
          Retry
        </Button>
      )}
    </Alert>
  )
}
```

That `env.isDev` block is a small gift to yourself: developers see the failing request, users never do.

Update **`src/App.jsx`** — add a `reloadKey` so Retry actually re-runs the effect:

```jsx
import { useEffect, useState } from "react"
import axios from "axios"
import { Col, Container, Row } from "react-bootstrap"
import { env } from "./config/env"
import { ProductCard } from "./components/ProductCard"
import { CardSkeletons } from "./components/Skeletons"
import { ErrorNotice } from "./components/ErrorNotice"

export default function App() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const { data } = await axios.get(`${env.api.baseUrl}/products`, {
          params: { limit: 12, skip: 0 },
        })
        setProducts(data.products)
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [reloadKey])

  return (
    <Container className="py-4">
      <h1 className="h3">ShopScope</h1>
      <p className="text-muted">Step 4 — errors a human can act on.</p>

      <ErrorNotice error={error} onRetry={() => setReloadKey((k) => k + 1)} />

      {loading && <CardSkeletons count={12} />}
      {!loading && !error && (
        <Row xs={1} sm={2} md={3} lg={4} className="g-3">
          {products.map((p) => (
            <Col key={p.id}>
              <ProductCard product={p} />
            </Col>
          ))}
        </Row>
      )}
    </Container>
  )
}
```

`ErrorNotice` returns `null` when there's no error, so it can be rendered unconditionally — one less `&&` in the JSX.

> **Try it yourself, three ways:**
> 1. Change the path to `/productz` → a 404 with a server message.
> 2. Set `VITE_API_BASE_URL=https://localhost:9999` in `.env.local` → a network error, no `response`.
> 3. Add `timeout: 500` and `params: { delay: 3000 }` → `err.code === "ECONNABORTED"`.
>
> Each should produce a *different*, sensible sentence.

---

# 7. Cancellation, StrictMode & race conditions

## The problem you can't see locally

Type "phone" into a search box. Five requests go out — `p`, `ph`, `pho`, `phon`, `phone` — and come back in whatever order the network feels like. If `pho` returns *after* `phone`, your UI shows results for `pho` while the box says "phone".

This is a **race condition**, it's extremely common, and it's invisible on localhost.

## `AbortController`

The web-standard way to cancel. axios speaks it natively via `signal`:

```js
const controller = new AbortController()
axios.get("/products", { signal: controller.signal })
controller.abort()   // the promise rejects with a CanceledError
```

Inside an effect, cleanup runs when dependencies change or the component unmounts — exactly when a stale request should die:

```js
useEffect(() => {
  const controller = new AbortController()

  axios
    .get("/products/search", { params: { q }, signal: controller.signal })
    .then(({ data }) => setResults(data.products))
    .catch((err) => {
      if (axios.isCancel(err)) return    // intentional — not a failure
      setError(err)
    })

  return () => controller.abort()
}, [q])
```

**`axios.isCancel(err)` is mandatory.** Without it, every keystroke that cancels a request flashes an error at the user. (`err.code === "ERR_CANCELED"` is the same check.)

> **Legacy note:** `axios.CancelToken.source()` does the same and is **deprecated**. Use `AbortController`.

## React StrictMode runs effects twice

In development, `<StrictMode>` mounts a component, unmounts it, and mounts it again. Your effect runs twice, so you see **two requests** in the Network tab.

This is intentional — it surfaces effects that don't clean up after themselves — and it does **not** happen in production builds. Two reasonable responses: do nothing (a duplicated GET is harmless), or abort in cleanup (the first request is cancelled the moment the second starts, which is what you want anyway).

What you should **not** do is delete `<StrictMode>` to make it go away. That's turning off the smoke detector.

> **Careful with non-idempotent requests.** A `POST` fired inside a mount effect fires twice in StrictMode — and in production, twice on a double-click. Mutations belong in event handlers or route actions, and should disable their button while in flight.

## Timeouts are cancellation too

```js
axios.get("/slow", { timeout: 5000 })   // rejects with err.code === "ECONNABORTED"
```

`timeout` measures the whole round trip. `ECONNABORTED` is a *failure* worth showing; `ERR_CANCELED` is *intentional* and silent.

## 🔨 Build Step 5 — Cancel on unmount

Update the effect in **`src/App.jsx`**:

```jsx
  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      try {
        setLoading(true)
        setError(null)
        const { data } = await axios.get(`${env.api.baseUrl}/products`, {
          params: { limit: 12, skip: 0 },
          signal: controller.signal,
        })
        setProducts(data.products)
      } catch (err) {
        if (axios.isCancel(err)) return    // stale request — leave state alone
        setError(err)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    load()
    return () => controller.abort()
  }, [reloadKey])
```

Two subtleties in six lines:

- **`return` before `setError`** on a cancel. A cancelled request is not a failure.
- **`if (!controller.signal.aborted)` around `setLoading(false)`.** When a request is cancelled because a *newer* one just started, the newer one owns the loading flag. Clearing it here would flash the empty state mid-flight.

> **Try it yourself:** add `delay: 3000` to the params, open the Network tab, and hard-refresh. In StrictMode you'll see two requests and one marked **canceled**. That's your cleanup working.

---

# Part 3 — A production API layer

Everything so far has been a component calling axios directly. That's fine for one request and unmanageable for forty. This part builds the layer that real codebases have, one file at a time:

```
src/api/
├── client.js            # the axios instances
├── endpoints.js         # every URL in the app
├── interceptors/
│   ├── index.js         # installs them, in order
│   ├── logging.js
│   ├── errorNormalizer.js
│   ├── auth.js          # §19
│   └── refresh.js       # §20
└── services/
    ├── products.js      # domain functions
    └── auth.js          # §18
```

The rule that makes it work: **each file has one reason to change.** A new endpoint touches `endpoints.js` and one service. A new header touches one interceptor. A backend URL change touches `.env`.

# 8. Instances & defaults

## `axios.create()`

An **instance** is a pre-configured axios with its own defaults and its own interceptors:

```js
export const api = axios.create({
  baseURL: "https://dummyjson.com",
  timeout: 10000,
})

api.get("/products")           // → https://dummyjson.com/products
```

### Always create an instance. Never configure the global.

```js
// ✗ Don't do this
axios.defaults.baseURL = "https://dummyjson.com"
axios.defaults.headers.common.Authorization = `Bearer ${token}`
```

The global `axios` is shared with every library in `node_modules` that imports axios. A global auth header means **your token is sent to third-party domains** the moment some SDK makes a request. Instances are isolated.

A second instance is also how you handle exceptions — an upload endpoint with no timeout, or a "bare" client with no interceptors, which we need for token refresh in [§20](#20-silent-refresh-the-401-queue).

### Merge order

When a request runs, axios merges config from three places — later wins:

1. Library defaults (`axios.defaults`)
2. Instance config (`axios.create({ … })`)
3. Per-request config (`api.get(url, { … })`)

Headers merge key-by-key, so a per-request header overrides just that one.

```js
api.get("/products", { timeout: 30000 })   // this call only
```

## 🔨 Build Step 6 — The HTTP client

Create **`src/api/client.js`**:

```js
import axios from "axios"
import { env } from "../config/env"

/** Shared settings, so the two instances can't drift apart. */
const baseConfig = {
  baseURL: env.api.baseUrl,
  timeout: env.api.timeoutMs,
  headers: { "Content-Type": "application/json" },
}

/**
 * The app's HTTP client. Import this — never bare `axios`.
 * Interceptors are attached in api/interceptors/index.js.
 */
export const api = axios.create(baseConfig)

/**
 * No interceptors, ever.
 *
 * Used by the token-refresh flow so a failing refresh can't re-enter the
 * 401 handler that triggered it (§20), and by anything else that must
 * bypass auth — health checks, public endpoints during logout.
 */
export const bareApi = axios.create(baseConfig)

/** For long uploads: no timeout, and the browser sets Content-Type. */
export const uploadApi = axios.create({
  baseURL: env.api.baseUrl,
  timeout: 0,
  headers: { "Content-Type": undefined },
})
```

Update **`src/App.jsx`** to use it — swap the import and shorten the URL:

```jsx
import { api } from "./api/client"
// …
const { data } = await api.get("/products", {
  params: { limit: 12, skip: 0 },
  signal: controller.signal,
})
```

Keep `import axios from "axios"` for now — `axios.isCancel` still needs it.

---

# 9. Endpoints & service modules

## Two layers, two jobs

**`endpoints.js` owns the URLs.** Nothing else in the app contains a path string.

**`services/*.js` own the domain.** They call the client, unwrap the response, and return domain data.

Why separate them? Because "the backend renamed `/products` to `/catalog/products`" should be a one-line change in one file, not a grep across the codebase. And because a single file listing every URL your app can hit is genuinely useful documentation.

## The service-layer rule

**A service function returns domain data, not an axios response.** No `.data` in your components, ever.

```jsx
// Before: the component knows about URLs, params, and response envelopes
const { data } = await api.get("/products", { params: { limit, skip, select } })
setProducts(data.products)

// After: the component knows about products
const { products, total } = await listProducts({ page, limit })
```

What this buys you:

- **One place to change** when an endpoint moves or a field is renamed.
- **Testable** — mock four functions instead of every URL string.
- **Discoverable** — a new developer opens `services/products.js` and sees the whole surface area.
- **A translation boundary.** Backends return snake_case, ISO strings, nested envelopes. Normalise once, here.

## 🔨 Build Step 7 — Endpoints and the products service

Create **`src/api/endpoints.js`**:

```js
/**
 * Every URL the app can hit, in one place. Paths are relative to
 * env.api.baseUrl (set on the axios instance) — never absolute.
 *
 * Functions, not string constants, so path params can't be forgotten
 * and are always encoded.
 */
const enc = encodeURIComponent

export const endpoints = {
  products: {
    list: () => "/products",
    search: () => "/products/search",
    byCategory: (slug) => `/products/category/${enc(slug)}`,
    categories: () => "/products/categories",
    detail: (id) => `/products/${enc(id)}`,
    create: () => "/products/add",
    update: (id) => `/products/${enc(id)}`,
    remove: (id) => `/products/${enc(id)}`,
  },
  auth: {
    login: () => "/auth/login",
    refresh: () => "/auth/refresh",
    me: () => "/auth/me",
  },
}
```

**Why functions instead of `PRODUCT_DETAIL = "/products/:id"`:** the id can't be forgotten, `encodeURIComponent` is applied for free, and your editor autocompletes the arguments. Interpolating raw user input into a path is how you get a broken URL from a category called `home & garden` — or worse, a value that escapes the path segment entirely.

Create **`src/api/services/products.js`**:

```js
import { api } from "../client"
import { endpoints } from "../endpoints"

/** Only the fields the list UI renders — smaller payload, faster page. */
const LIST_FIELDS = "id,title,price,thumbnail,rating,stock,category,brand"

/**
 * One entry point for the three list-shaped endpoints. Search wins over
 * category when both are supplied, which matches what users expect.
 *
 * @returns {Promise<{products: object[], total: number, skip: number, limit: number}>}
 */
export async function listProducts({
  q = "",
  category = "",
  page = 0,
  limit = 12,
  sortBy = "",
  order = "asc",
  signal,
} = {}) {
  const params = {
    limit,
    skip: page * limit,
    select: LIST_FIELDS,
    sortBy: sortBy || undefined,        // undefined params are dropped (§13)
    order: sortBy ? order : undefined,
  }

  let url = endpoints.products.list()
  if (q) {
    url = endpoints.products.search()
    params.q = q
  } else if (category) {
    url = endpoints.products.byCategory(category)
  }

  const { data } = await api.get(url, { params, signal })
  return data
}

/** Full record — no `select`, the detail view wants every field. */
export async function getProduct(id, { signal } = {}) {
  const { data } = await api.get(endpoints.products.detail(id), { signal })
  return data
}

/** @returns {Promise<Array<{slug: string, name: string, url: string}>>} */
export async function listCategories({ signal } = {}) {
  const { data } = await api.get(endpoints.products.categories(), { signal })
  return data
}

// --- Writes. DummyJSON simulates these: the response is real, persistence isn't. ---

export async function createProduct(payload, { signal } = {}) {
  const { data } = await api.post(endpoints.products.create(), payload, { signal })
  return data
}

export async function updateProduct(id, patch, { signal } = {}) {
  const { data } = await api.patch(endpoints.products.update(id), patch, { signal })
  return data
}

export async function deleteProduct(id, { signal } = {}) {
  const { data } = await api.delete(endpoints.products.remove(id), { signal })
  return data   // { …product, isDeleted: true, deletedOn: "…" }
}
```

**Every function accepts a `signal`.** Cancellation must be plumbed all the way through, or the layer above can't cancel the layer below. This is the single most-forgotten detail in a service layer, and it's why so many apps have race conditions they can't explain.

Update **`src/App.jsx`**:

```jsx
import { listProducts } from "./api/services/products"
// …
const data = await listProducts({ page: 0, limit: 12, signal: controller.signal })
setProducts(data.products)
```

---

# 10. A single error model: `ApiError`

Right now every component that catches an error has to know axios's error shape — `err.response?.data?.message`, `err.code`, the three-way `response`/`request`/neither split. That's an implementation detail of the HTTP library leaking into your UI.

**Normalise once, at the boundary.** Everything above the API layer sees one error type with predictable fields.

## 🔨 Build Step 8 — The error class

Create **`src/lib/ApiError.js`**:

```js
import axios from "axios"

const MESSAGES = {
  400: "Some of the details weren't valid.",
  401: "Your session has expired. Please sign in again.",
  403: "You don't have permission to do that.",
  404: "We couldn't find what you were looking for.",
  409: "That conflicts with something that already exists.",
  422: "Some of the details weren't valid.",
  429: "Too many requests. Give it a moment and try again.",
}

/**
 * The one error type the app deals with above the API layer.
 *
 * Components, route error boundaries, and loggers all read these fields;
 * none of them import axios.
 */
export class ApiError extends Error {
  constructor({ message, status = 0, code = "UNKNOWN", data = null, requestId, cause }) {
    super(message)
    this.name = "ApiError"
    this.status = status          // 0 when the request never got a response
    this.code = code              // machine-readable: NETWORK, TIMEOUT, HTTP_404 …
    this.data = data              // the raw error body, for field-level validation
    this.requestId = requestId    // correlation id — see §11
    this.cause = cause            // the original error, for the stack trace
  }

  /** Worth showing a Retry button for? */
  get isRetryable() {
    return this.status === 0 || this.status === 408 || this.status === 429 || this.status >= 500
  }

  get isNetwork() { return this.code === "NETWORK" }
  get isTimeout() { return this.code === "TIMEOUT" }
  get isAuth() { return this.status === 401 }
  get isForbidden() { return this.status === 403 }
  get isNotFound() { return this.status === 404 }

  /** Field-level validation errors, if the backend sends them. */
  get fieldErrors() {
    return this.data?.errors ?? null
  }

  /** Translate any thrown value into an ApiError. */
  static from(error) {
    if (error instanceof ApiError) return error

    if (!axios.isAxiosError(error)) {
      // A bug in our own code — don't disguise it as an HTTP failure.
      return new ApiError({
        message: error?.message ?? "Something went wrong.",
        code: "CLIENT",
        cause: error,
      })
    }

    const requestId = error.config?.headers?.["X-Request-Id"]

    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return new ApiError({
        message: "The server took too long to respond. Please try again.",
        code: "TIMEOUT",
        requestId,
        cause: error,
      })
    }

    if (!error.response) {
      return new ApiError({
        message: "Can't reach the server. Check your connection and try again.",
        code: "NETWORK",
        requestId,
        cause: error,
      })
    }

    const { status, data } = error.response

    // The backend's message beats ours — it knows what actually went wrong.
    const message =
      (typeof data?.message === "string" && data.message) ||
      MESSAGES[status] ||
      (status >= 500 ? "Something broke on our end. We're looking into it." : "Something went wrong.")

    return new ApiError({ message, status, code: `HTTP_${status}`, data, requestId, cause: error })
  }
}
```

Design notes worth understanding:

- **`status: 0` means "no response".** Network failure and timeout are genuinely different from any HTTP status, and a real status code of `0` doesn't exist — so it's an unambiguous sentinel.
- **Getters, not booleans on the constructor.** `error.isAuth` reads better at the call site than `error.status === 401`, and if the definition of "auth failure" ever grows (some APIs use 419), one getter changes.
- **`cause`** preserves the original error, so a logger can still report the axios stack.
- **The backend's message wins.** Our table is the fallback for when the backend says nothing useful.

Now simplify **`src/components/ErrorNotice.jsx`** — it no longer imports axios or knows anything about response shapes:

```jsx
import { Alert, Button } from "react-bootstrap"
import { ArrowClockwise, ExclamationTriangleFill } from "react-bootstrap-icons"
import { env } from "../config/env"

export function ErrorNotice({ error, onRetry, title }) {
  if (!error) return null

  const canRetry = onRetry && (error.isRetryable ?? true)

  return (
    <Alert variant="danger" className="d-flex align-items-start gap-2">
      <ExclamationTriangleFill className="mt-1 flex-shrink-0" />
      <div className="flex-grow-1">
        {title && <Alert.Heading className="h6">{title}</Alert.Heading>}
        <div>{error.message}</div>
        {env.isDev && (
          <div className="small text-muted mt-1 font-monospace">
            {error.code}
            {error.status ? ` · ${error.status}` : ""}
            {error.requestId ? ` · ${error.requestId}` : ""}
          </div>
        )}
      </div>
      {canRetry && (
        <Button size="sm" variant="outline-danger" onClick={onRetry}>
          <ArrowClockwise className="me-1" />
          Retry
        </Button>
      )}
    </Alert>
  )
}
```

You can delete `src/lib/errors.js` — `ApiError.from` has absorbed it.

Nothing converts errors into `ApiError`s yet. That's the response interceptor, two sections from now.

---

# 11. Request interceptors

An interceptor is a function that runs on **every** request (or response) through an instance. It's the axios feature that justifies the dependency.

```js
api.interceptors.request.use(
  (config) => {
    // runs before the request is sent — mutate and return the config
    return config
  },
  (error) => Promise.reject(error)   // rare: a failure building the request
)
```

**You must return the config.** Forget it and every request in your app fails with a baffling error. It's the number one interceptor bug.

### What belongs here

| Concern | Why an interceptor |
|---|---|
| Auth token | Read fresh at request time — no stale header to forget updating |
| Correlation / request id | Every request traceable, no call site involved |
| Locale, tenant, app version headers | Cross-cutting by definition |
| Dev logging | One line, all requests |

### What does *not* belong here

Business logic. An interceptor that inspects `config.url` and behaves differently per endpoint is a service function wearing a disguise — and it runs on every request, including the ones it doesn't care about.

### Order

Request interceptors run **bottom-up** (last registered runs first); response interceptors run **top-down**. You rarely depend on this, but it's the first thing to check when two interact.

You can remove one:

```js
const id = api.interceptors.request.use(fn)
api.interceptors.request.eject(id)
```

## 🔨 Build Step 9 — Correlation ids and logging

Create **`src/api/interceptors/logging.js`**:

```js
import { logger } from "../../config/logger"

/**
 * Tags every request with a unique id and logs its lifecycle.
 *
 * The id goes out as X-Request-Id and comes back on ApiError.requestId, so
 * a user's screenshot of an error maps to exactly one line in your backend
 * logs. This is the cheapest observability win available to a frontend.
 */
export function installLoggingInterceptor(instance) {
  instance.interceptors.request.use((config) => {
    config.headers["X-Request-Id"] = crypto.randomUUID()
    config.metadata = { startedAt: performance.now() }

    logger.debug(`→ ${config.method?.toUpperCase()} ${config.url}`, {
      requestId: config.headers["X-Request-Id"],
      params: config.params,
    })

    return config     // ← never forget this line
  })

  instance.interceptors.response.use(
    (response) => {
      const ms = Math.round(performance.now() - (response.config.metadata?.startedAt ?? 0))
      logger.debug(`← ${response.status} ${response.config.url} (${ms}ms)`)
      return response
    },
    (error) => {
      const ms = Math.round(performance.now() - (error.config?.metadata?.startedAt ?? 0))
      logger.warn(
        `✗ ${error.config?.method?.toUpperCase()} ${error.config?.url} ` +
          `${error.response?.status ?? error.code} (${ms}ms)`
      )
      return Promise.reject(error)      // ← and never forget this one
    }
  )
}
```

Two details:

- **`config.metadata`** is a custom field. axios passes the config object through untouched, so it's a legitimate place to stash per-request state — here, a start time, so the response side can report duration.
- **`crypto.randomUUID()`** is built into every current browser over HTTPS (and on `localhost`). No dependency needed.

> **Careful:** if your backend doesn't allow `X-Request-Id` in `Access-Control-Allow-Headers`, adding a custom header will trigger a CORS preflight failure. DummyJSON is permissive; your API may not be. Check before shipping.

---

# 12. Response interceptors

The mirror image — two functions, one per outcome:

```js
api.interceptors.response.use(
  (response) => response,            // any 2xx
  (error) => Promise.reject(error)   // any non-2xx, plus network errors and timeouts
)
```

**Both branches must return.** Return nothing from the success handler and `response` is `undefined` at every call site. Fail to re-reject in the error handler and **failures silently resolve** — the worst possible bug, because everything looks fine.

### One thing to resist

Unwrapping `response.data` globally:

```js
// ✗ Tempting, and a trap
api.interceptors.response.use((response) => response.data)
```

It looks tidy and costs you `status`, `headers`, and every downstream interceptor's assumption that it holds a response. It also breaks `AxiosResponse<T>` typing and confuses anyone who has used axios before. **Unwrap in the service layer** — that's what it's for.

## 🔨 Build Step 10 — Normalise every failure

Create **`src/api/interceptors/errorNormalizer.js`**:

```js
import axios from "axios"
import { ApiError } from "../../lib/ApiError"
import { logger } from "../../config/logger"

/**
 * The boundary. Every rejection leaving the API layer is an ApiError —
 * except deliberate cancellations, which pass through untouched so callers
 * can detect them with axios.isCancel() and ignore them.
 *
 * Register this LAST, so it runs after any interceptor that needs the raw
 * axios error (like the 401 refresh handler in §20).
 */
export function installErrorNormalizer(instance) {
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (axios.isCancel(error)) {
        return Promise.reject(error)      // expected; not an error
      }

      const apiError = ApiError.from(error)

      // One place for error reporting. Swap the logger for Sentry here.
      if (apiError.status >= 500 || apiError.isNetwork) {
        logger.error(`[api] ${apiError.code}: ${apiError.message}`, {
          requestId: apiError.requestId,
          url: error.config?.url,
        })
      }

      return Promise.reject(apiError)
    }
  )
}
```

Create **`src/api/interceptors/index.js`** — the install order is the interesting part:

```js
import { api } from "../client"
import { installLoggingInterceptor } from "./logging"
import { installErrorNormalizer } from "./errorNormalizer"

/**
 * Called once, from main.jsx, before the app renders.
 *
 * ORDER MATTERS. Response interceptors run in registration order, so:
 *   1. logging          — sees the raw axios error, records status + timing
 *   2. auth refresh     — added in §20; needs error.config to retry
 *   3. errorNormalizer  — LAST; converts to ApiError, after which the
 *                         earlier handlers' expectations no longer hold
 */
export function installInterceptors() {
  installLoggingInterceptor(api)
  // installAuthInterceptor(api)      ← §19
  // installRefreshInterceptor(api)   ← §20
  installErrorNormalizer(api)
}
```

Call it from **`src/main.jsx`**, before `createRoot`:

```jsx
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "bootstrap/dist/css/bootstrap.min.css"
import "./index.css"
import { installInterceptors } from "./api/interceptors"
import App from "./App.jsx"

installInterceptors()

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

**Why an explicit `installInterceptors()` rather than side effects in `client.js`:** import side effects run in whatever order the bundler decides, which makes ordering bugs non-reproducible. An explicit call is ordered, greppable, and skippable in tests.

> **Try it yourself:** break the URL in `endpoints.js` (`/productz`) and reload. The Alert now shows *"We couldn't find what you were looking for"*, the dev line underneath reads `HTTP_404 · 404 · <uuid>`, and the console has the `✗` log with timing. Three layers doing their jobs, and `App.jsx` didn't change.

---

# 13. Query parameters

Never build query strings by hand.

```js
// ✗ Fragile: breaks the moment a value contains a space, &, or #
api.get(`/products/search?q=${query}&limit=${limit}`)

// ✓ axios encodes each value correctly
api.get("/products/search", { params: { q: query, limit } })
```

With `params`, `q = "t-shirt & jeans"` becomes `q=t-shirt%20%26%20jeans`. With a template string it becomes a broken URL with a phantom second parameter.

### `undefined` params are dropped; `null` and `""` are not

```js
api.get("/products", { params: { limit: 12, category: undefined } })
// → /products?limit=12

api.get("/products", { params: { limit: 12, category: null } })
// → /products?limit=12&category=
```

A genuinely useful default: build the object unconditionally and let `undefined` prune the empty filters — exactly what `sortBy: sortBy || undefined` does in our products service.

### Arrays

By default axios serialises `{ tags: ["a", "b"] }` as `tags[]=a&tags[]=b`. Some backends want `tags=a&tags=b`, others `tags=a,b`. Fix it once on the instance:

```js
export const api = axios.create({
  baseURL,
  paramsSerializer: { indexes: null },     // → tags=a&tags=b
})
```

Or take full control:

```js
paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "comma" })
```

**Check what your backend expects before guessing.** A mismatch produces a silent empty result set, which is a miserable thing to debug.

### Debouncing

A request per keystroke is wasteful and racy. Wait until typing pauses:

```jsx
import { useEffect, useState } from "react"

export function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)     // each keystroke cancels the pending timer
  }, [value, delay])

  return debounced
}
```

Then depend on the *debounced* value in your fetch effect. **Debouncing and cancellation are complements, not alternatives** — debouncing cuts the number of requests, cancellation protects you from the ones that still overlap.

## 🔨 Build Step 11 — Search, sort & pagination

Create **`src/hooks/useDebouncedValue.js`** with the hook above.

Replace **`src/App.jsx`**:

```jsx
import { useEffect, useState } from "react"
import axios from "axios"
import {
  Badge, Button, Col, Container, Form, InputGroup, Pagination, Row, Stack,
} from "react-bootstrap"
import { Search } from "react-bootstrap-icons"
import { listProducts } from "./api/services/products"
import { useDebouncedValue } from "./hooks/useDebouncedValue"
import { ProductCard } from "./components/ProductCard"
import { CardSkeletons } from "./components/Skeletons"
import { ErrorNotice } from "./components/ErrorNotice"

const PAGE_SIZE = 12

export default function App() {
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState("")          // "" | "price-asc" | "price-desc" | "rating-desc"
  const [page, setPage] = useState(0)

  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  const debouncedQuery = useDebouncedValue(query, 400)

  // A new search must reset to page 0, or you land on page 5 of 1 result.
  useEffect(() => {
    setPage(0)
  }, [debouncedQuery, sort])

  useEffect(() => {
    const controller = new AbortController()
    const [sortBy, order] = sort ? sort.split("-") : ["", "asc"]

    async function load() {
      try {
        setLoading(true)
        setError(null)
        const data = await listProducts({
          q: debouncedQuery,
          page,
          limit: PAGE_SIZE,
          sortBy,
          order,
          signal: controller.signal,
        })
        setResult(data)
      } catch (err) {
        if (axios.isCancel(err)) return
        setError(err)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    load()
    return () => controller.abort()
  }, [debouncedQuery, sort, page, reloadKey])

  const products = result?.products ?? []
  const total = result?.total ?? 0
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1)

  return (
    <Container className="py-4">
      <h1 className="h3">ShopScope</h1>
      <p className="text-muted">Step 11 — debounced search, sorting, pagination, cancelled stale requests.</p>

      <Stack direction="horizontal" gap={2} className="my-3 flex-wrap">
        <InputGroup style={{ maxWidth: 380 }}>
          <InputGroup.Text><Search /></InputGroup.Text>
          <Form.Control
            placeholder="Search products…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <Button variant="outline-secondary" onClick={() => setQuery("")}>Clear</Button>
          )}
        </InputGroup>

        <Form.Select
          style={{ maxWidth: 200 }}
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="">Default order</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="rating-desc">Best rated</option>
        </Form.Select>

        <Badge bg="secondary" className="ms-auto">{total} results</Badge>
      </Stack>

      <ErrorNotice error={error} onRetry={() => setReloadKey((k) => k + 1)} />

      {loading ? (
        <CardSkeletons count={PAGE_SIZE} />
      ) : products.length === 0 ? (
        <p className="text-center text-muted py-5">
          No products match “{debouncedQuery}”.
        </p>
      ) : (
        <Row xs={1} sm={2} md={3} lg={4} className="g-3">
          {products.map((p) => (
            <Col key={p.id}>
              <ProductCard product={p} />
            </Col>
          ))}
        </Row>
      )}

      {lastPage > 0 && (
        <Pagination className="justify-content-center mt-4">
          <Pagination.Prev disabled={page === 0 || loading} onClick={() => setPage((p) => p - 1)} />
          <Pagination.Item disabled>
            Page {page + 1} of {lastPage + 1}
          </Pagination.Item>
          <Pagination.Next
            disabled={page >= lastPage || loading}
            onClick={() => setPage((p) => p + 1)}
          />
        </Pagination>
      )}
    </Container>
  )
}
```

> **Try it yourself:** open the Network tab and type "laptop" quickly. You should see **one** request, not six — that's the debounce. Now throttle to Slow 3G and type slowly: requests get marked **canceled** as newer ones supersede them. Delete `return () => controller.abort()` and watch results flicker between stale and fresh. That's the race condition, reproduced on demand.

---

# 14. Parallel requests

Sequential `await`s that don't depend on each other waste time:

```js
// ✗ 300ms + 300ms = 600ms
const products = await listProducts()
const categories = await listCategories()

// ✓ 300ms total
const [products, categories] = await Promise.all([listProducts(), listCategories()])
```

**`Promise.all` fails fast:** one rejection rejects the whole thing and you lose the successful results. When a widget failing shouldn't blank the page, use `Promise.allSettled`:

```js
const results = await Promise.allSettled([listProducts(), listCategories()])
const products = results[0].status === "fulfilled" ? results[0].value.products : []
const categories = results[1].status === "fulfilled" ? results[1].value : []
```

> `axios.all()` and `axios.spread()` still exist. They're pre-ES2015 wrappers around `Promise.all` and are deprecated. Use the native combinators.

**When requests genuinely depend on each other, sequential is correct** — you can't fetch a user's orders before you know the user id. Just make sure the dependency is real and not an accident of how you typed it.

## 🔨 Build Step 12 — Category filter

Add to **`src/App.jsx`**:

```jsx
import { listProducts, listCategories } from "./api/services/products"
// …
const [categories, setCategories] = useState([])
const [category, setCategory] = useState("")
```

Add a **second effect** that loads categories exactly once. Keeping it separate from the product effect is deliberate: categories don't change when the search box does, so re-fetching them per keystroke would be pure waste.

```jsx
  useEffect(() => {
    const controller = new AbortController()

    listCategories({ signal: controller.signal })
      .then(setCategories)
      .catch((err) => {
        if (axios.isCancel(err)) return
        // Deliberately not surfaced: the app is fully usable without filters.
        console.warn("Category list unavailable:", err.message)
      })

    return () => controller.abort()
  }, [])
```

Feed `category` into the product effect and the reset effect:

```jsx
        const data = await listProducts({
          q: debouncedQuery, category, page, limit: PAGE_SIZE, sortBy, order,
          signal: controller.signal,
        })
// …
  }, [debouncedQuery, category, sort, page, reloadKey])

// and:
  useEffect(() => { setPage(0) }, [debouncedQuery, category, sort])
```

Add the control to the toolbar, after the sort select:

```jsx
        <Form.Select
          style={{ maxWidth: 200 }}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          disabled={!!query}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </Form.Select>
```

`disabled={!!query}` mirrors the "search wins" rule in `listProducts`. A control that has no effect should look like it has no effect.

**Note the deliberate asymmetry in error handling.** A failed product list is a broken page — show it loudly. A failed category list costs the user a filter — log it and move on. Not every request deserves the same treatment, and deciding which is which is a design decision, not a technical one.

---

# 15. Path params & fetching one record

Two ways to build a URL with an id:

```js
api.get(`/products/${id}`)                              // fine for a number
api.get(`/products/category/${encodeURIComponent(slug)}`)  // required for anything else
```

Our `endpoints.js` already encodes every param, which is exactly why it exists.

### Fetch-on-select

The same effect you know, keyed on the selected id, plus one guard:

```jsx
useEffect(() => {
  if (!id) return            // nothing selected — don't fetch
  const controller = new AbortController()
  // …
  return () => controller.abort()
}, [id])
```

That early `return` is how you express "conditionally fetch" without conditionally *calling a hook*, which the rules of hooks forbid.

## 🔨 Build Step 13 — Detail drawer

React Bootstrap's `Offcanvas` is a slide-in panel with a backdrop, focus trapping, and Escape-to-close already handled.

Create **`src/components/ProductDetail.jsx`**:

```jsx
import { useEffect, useState } from "react"
import axios from "axios"
import { Badge, Offcanvas, Placeholder, Ratio, Stack } from "react-bootstrap"
import { getProduct } from "../api/services/products"
import { ErrorNotice } from "./ErrorNotice"

export function ProductDetail({ id, onClose }) {
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) return

    const controller = new AbortController()

    async function load() {
      try {
        setLoading(true)
        setError(null)
        setProduct(null)     // clear the previous product so we never show stale data
        setProduct(await getProduct(id, { signal: controller.signal }))
      } catch (err) {
        if (axios.isCancel(err)) return
        setError(err)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    load()
    return () => controller.abort()
  }, [id])

  return (
    <Offcanvas show={!!id} onHide={onClose} placement="end">
      <Offcanvas.Header closeButton>
        <Offcanvas.Title className="h6">
          {product?.title ?? `Product #${id}`}
        </Offcanvas.Title>
      </Offcanvas.Header>

      <Offcanvas.Body>
        {loading && (
          <Placeholder as="div" animation="glow">
            <Placeholder xs={12} style={{ height: 180 }} className="mb-3" />
            <Placeholder xs={8} /> <Placeholder xs={5} />
            <Placeholder xs={12} /> <Placeholder xs={10} />
          </Placeholder>
        )}

        <ErrorNotice error={error} />

        {product && !loading && (
          <Stack gap={3}>
            <Ratio aspectRatio="4x3">
              <img
                src={product.thumbnail}
                alt=""
                className="object-fit-contain bg-body-secondary rounded"
              />
            </Ratio>

            <div className="d-flex justify-content-between align-items-center">
              <span className="fs-4 fw-semibold">${product.price}</span>
              <Badge bg={product.stock > 20 ? "success" : "warning"}>
                {product.availabilityStatus ?? `${product.stock} in stock`}
              </Badge>
            </div>

            <p className="mb-0">{product.description}</p>

            <dl className="row mb-0 small">
              <dt className="col-5 text-muted fw-normal">Brand</dt>
              <dd className="col-7">{product.brand ?? "—"}</dd>
              <dt className="col-5 text-muted fw-normal">Category</dt>
              <dd className="col-7 text-capitalize">{product.category}</dd>
              <dt className="col-5 text-muted fw-normal">Rating</dt>
              <dd className="col-7">★ {product.rating}</dd>
              <dt className="col-5 text-muted fw-normal">SKU</dt>
              <dd className="col-7 font-monospace">{product.sku}</dd>
              <dt className="col-5 text-muted fw-normal">Warranty</dt>
              <dd className="col-7">{product.warrantyInformation}</dd>
              <dt className="col-5 text-muted fw-normal">Shipping</dt>
              <dd className="col-7">{product.shippingInformation}</dd>
            </dl>
          </Stack>
        )}
      </Offcanvas.Body>
    </Offcanvas>
  )
}
```

Make the cards clickable — in **`src/components/ProductCard.jsx`**, wrap the image and title in a button-ish handler:

```jsx
import { Card } from "react-bootstrap"

export function ProductCard({ product, onSelect }) {
  return (
    <Card className="h-100">
      <Card.Img
        variant="top"
        src={product.thumbnail}
        alt=""
        loading="lazy"
        className="object-fit-contain bg-body-secondary p-2"
        style={{ height: 140, cursor: onSelect ? "pointer" : undefined }}
        onClick={() => onSelect?.(product.id)}
      />
      <Card.Body className="d-flex flex-column">
        <Card.Title className="fs-6">
          {onSelect ? (
            <button
              type="button"
              className="btn btn-link p-0 text-start text-decoration-none fs-6"
              onClick={() => onSelect(product.id)}
            >
              {product.title}
            </button>
          ) : (
            product.title
          )}
        </Card.Title>
        <div className="d-flex justify-content-between align-items-center mt-auto">
          <span className="text-muted small text-capitalize">{product.category}</span>
          <strong>${product.price}</strong>
        </div>
      </Card.Body>
    </Card>
  )
}
```

A real `<button>` rather than an `onClick` on a `<div>` — keyboard users can reach it and screen readers announce it. Bootstrap's `btn-link` makes it look like text.

Wire it up in **`src/App.jsx`**:

```jsx
import { ProductDetail } from "./components/ProductDetail"
// …
const [selectedId, setSelectedId] = useState(null)
// …
<ProductCard product={p} onSelect={setSelectedId} />
// …just before </Container>:
<ProductDetail id={selectedId} onClose={() => setSelectedId(null)} />
```

Because `Offcanvas` handles its own visibility via `show`, we render it unconditionally and let `id` drive everything. That also gives us the slide-out animation, which unmounting would skip.

> **Try it yourself:** throttle to Slow 3G, click one product, then immediately click another. Without `setProduct(null)` you'd briefly see product A's details under product B's title. With it — plus the abort — you get a skeleton and then the right product. Remove each line in turn to see which artefact each prevents.

---

# 16. POST, PUT, PATCH, DELETE

## Which verb

| Verb | Meaning | Body | Idempotent? |
|---|---|---|---|
| `POST` | Create, or "run this action" | Yes | No — twice creates two |
| `PUT` | Replace the whole resource | Yes, complete | Yes |
| `PATCH` | Update some fields | Yes, partial | Usually |
| `DELETE` | Remove it | Rarely | Yes |

The practical rule: **`PATCH` for edit forms.** Sending the full object round-trips fields you never touched and will happily overwrite a colleague's concurrent edit. `PUT` when you genuinely mean "this is the whole new state".

## Bodies

Pass a plain object; axios stringifies it and sets `Content-Type: application/json`:

```js
const { data } = await api.post("/products/add", { title: "Widget", price: 12.5 })
```

Other content types:

```js
// FormData — file uploads. Let the browser set Content-Type (it must include
// the multipart boundary), so DON'T set the header yourself.
const form = new FormData()
form.append("file", file)
await uploadApi.post("/upload", form)

// URL-encoded — older form endpoints
await api.post("/login", new URLSearchParams({ user, pass }))
```

axios detects `FormData` and `URLSearchParams` and sets the right header. Overriding it manually is a classic self-inflicted 400.

## Mutations in React

Mutations are **event-handler** work, not effect work:

```jsx
const [saving, setSaving] = useState(false)
const [saveError, setSaveError] = useState(null)

async function handleSubmit(e) {
  e.preventDefault()
  if (saving) return                    // guard the double-click
  try {
    setSaving(true)
    setSaveError(null)
    const created = await createProduct(form)
    onCreated(created)                  // hand the server's version upward
    resetForm()
  } catch (err) {
    setSaveError(err)                   // stay on the form; keep their input
  } finally {
    setSaving(false)
  }
}
```

Five rules that separate a real form from a demo:

1. **Disable submit while in flight.** The cheapest bug prevention in the business.
2. **Never clear the form on error.** Losing typed input is unforgivable.
3. **Use what the server returns.** It has the real id, server defaults, computed fields. Don't echo your own payload back into state.
4. **Don't cancel mutations on unmount.** Abandoning a GET is free; abandoning a POST may lose the confirmation of something the server already committed. A deliberate Cancel button is different from an incidental abort.
5. **Say something on success.** Silence reads as failure.

## 🔨 Build Step 14 — Create, edit, delete

Create **`src/components/ProductForm.jsx`**:

```jsx
import { useEffect, useState } from "react"
import { Button, Card, Col, Form, Row, Spinner } from "react-bootstrap"
import { createProduct, updateProduct } from "../api/services/products"
import { ErrorNotice } from "./ErrorNotice"

const EMPTY = { title: "", price: "", category: "beauty", description: "" }

export function ProductForm({ editing, categories, onSaved, onCancel }) {
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [validated, setValidated] = useState(false)

  // Load the record being edited; reset when switching back to create mode.
  useEffect(() => {
    setForm(
      editing
        ? {
            title: editing.title ?? "",
            price: editing.price ?? "",
            category: editing.category ?? "beauty",
            description: editing.description ?? "",
          }
        : EMPTY
    )
    setError(null)
    setValidated(false)
  }, [editing])

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (saving) return

    if (!e.currentTarget.checkValidity()) {
      setValidated(true)              // Bootstrap shows the invalid feedback
      return
    }

    const payload = {
      title: form.title.trim(),
      price: Number(form.price),      // inputs give strings; the API wants a number
      category: form.category,
      description: form.description.trim(),
    }

    try {
      setSaving(true)
      setError(null)
      const saved = editing
        ? await updateProduct(editing.id, payload)
        : await createProduct(payload)
      onSaved(saved, editing ? "updated" : "created")
      if (!editing) {
        setForm(EMPTY)
        setValidated(false)
      }
    } catch (err) {
      setError(err)                    // form contents survive on purpose
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="mb-4">
      <Card.Header className="fw-semibold">
        {editing ? `Edit “${editing.title}”` : "Add a product"}
      </Card.Header>
      <Card.Body>
        <Form noValidate validated={validated} onSubmit={handleSubmit}>
          <Row className="g-2">
            <Col md={6}>
              <Form.Group controlId="pf-title">
                <Form.Label className="small fw-semibold">Title</Form.Label>
                <Form.Control
                  required
                  minLength={2}
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                />
                <Form.Control.Feedback type="invalid">
                  Give it a name of at least 2 characters.
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group controlId="pf-price">
                <Form.Label className="small fw-semibold">Price</Form.Label>
                <Form.Control
                  required
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                />
                <Form.Control.Feedback type="invalid">
                  Must be more than zero.
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group controlId="pf-category">
                <Form.Label className="small fw-semibold">Category</Form.Label>
                <Form.Select value={form.category} onChange={(e) => set("category", e.target.value)}>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col xs={12}>
              <Form.Group controlId="pf-description">
                <Form.Label className="small fw-semibold">Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="mt-3">
            <ErrorNotice error={error} title="Couldn't save" />
          </div>

          <div className="d-flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving && <Spinner as="span" size="sm" animation="border" className="me-2" />}
              {saving ? "Saving…" : editing ? "Save changes" : "Create product"}
            </Button>
            {editing && (
              <Button variant="outline-secondary" onClick={onCancel} disabled={saving}>
                Cancel
              </Button>
            )}
          </div>
        </Form>
      </Card.Body>
    </Card>
  )
}
```

Two React Bootstrap specifics worth knowing:

- **`noValidate` + `validated`** hands validation to the browser's constraint API but suppresses its native popups, letting Bootstrap render `Form.Control.Feedback` instead. `checkValidity()` in the submit handler is what gates the request.
- **`controlId` on `Form.Group`** wires the `<label>` to the input automatically. Free accessibility; don't skip it.

Add actions to **`src/components/ProductCard.jsx`** — a footer with Edit and Delete:

```jsx
import { Button, Card, Spinner } from "react-bootstrap"
import { PencilSquare, Trash } from "react-bootstrap-icons"

export function ProductCard({ product, onSelect, onEdit, onDelete, busy }) {
  return (
    <Card className={`h-100 ${busy ? "opacity-50" : ""}`}>
      <Card.Img
        variant="top"
        src={product.thumbnail}
        alt=""
        loading="lazy"
        className="object-fit-contain bg-body-secondary p-2"
        style={{ height: 140, cursor: onSelect ? "pointer" : undefined }}
        onClick={() => onSelect?.(product.id)}
      />
      <Card.Body className="d-flex flex-column">
        <Card.Title className="fs-6">
          <button
            type="button"
            className="btn btn-link p-0 text-start text-decoration-none fs-6"
            onClick={() => onSelect?.(product.id)}
          >
            {product.title}
          </button>
        </Card.Title>
        <div className="d-flex justify-content-between align-items-center mt-auto">
          <span className="text-muted small text-capitalize">{product.category}</span>
          <strong>${product.price}</strong>
        </div>
      </Card.Body>

      {(onEdit || onDelete) && (
        <Card.Footer className="d-flex gap-2 bg-transparent">
          {onEdit && (
            <Button size="sm" variant="outline-secondary" onClick={() => onEdit(product)} disabled={busy}>
              <PencilSquare className="me-1" /> Edit
            </Button>
          )}
          {onDelete && (
            <Button size="sm" variant="outline-danger" onClick={() => onDelete(product)} disabled={busy}>
              {busy ? <Spinner as="span" size="sm" animation="border" /> : <><Trash className="me-1" /> Delete</>}
            </Button>
          )}
        </Card.Footer>
      )}
    </Card>
  )
}
```

Create **`src/components/ConfirmDialog.jsx`** — `window.confirm` blocks the main thread and can't be styled:

```jsx
import { Button, Modal } from "react-bootstrap"

export function ConfirmDialog({ show, title, body, confirmLabel = "Confirm", variant = "danger", busy, onConfirm, onCancel }) {
  return (
    <Modal show={show} onHide={onCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title className="h6">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{body}</Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onCancel} disabled={busy}>Cancel</Button>
        <Button variant={variant} onClick={onConfirm} disabled={busy}>{confirmLabel}</Button>
      </Modal.Footer>
    </Modal>
  )
}
```

Now wire the mutations into **`src/App.jsx`**. Add imports and state:

```jsx
import { Alert } from "react-bootstrap"
import { ProductForm } from "./components/ProductForm"
import { ConfirmDialog } from "./components/ConfirmDialog"
import { deleteProduct } from "./api/services/products"
// …
const [editing, setEditing] = useState(null)
const [pendingDelete, setPendingDelete] = useState(null)
const [deleting, setDeleting] = useState(false)
const [flash, setFlash] = useState(null)
```

Add the handlers:

```jsx
  function handleSaved(saved, action) {
    setFlash(`“${saved.title}” ${action}. DummyJSON simulates writes — refresh to reset.`)
    setEditing(null)
    // Merge the server's version into the list rather than re-fetching.
    setResult((current) => {
      if (!current) return current
      const exists = current.products.some((p) => p.id === saved.id)
      return {
        ...current,
        products: exists
          ? current.products.map((p) => (p.id === saved.id ? { ...p, ...saved } : p))
          : [saved, ...current.products],
      }
    })
  }

  async function confirmDelete() {
    const product = pendingDelete
    try {
      setDeleting(true)
      await deleteProduct(product.id)
      setResult((current) =>
        current
          ? {
              ...current,
              products: current.products.filter((p) => p.id !== product.id),
              total: Math.max(0, current.total - 1),
            }
          : current
      )
      setFlash(`“${product.title}” deleted.`)
      setPendingDelete(null)
    } catch (err) {
      setError(err)
      setPendingDelete(null)
    } finally {
      setDeleting(false)
    }
  }
```

And render them:

```jsx
      {flash && (
        <Alert variant="success" dismissible onClose={() => setFlash(null)}>
          {flash}
        </Alert>
      )}

      <ProductForm
        editing={editing}
        categories={categories}
        onSaved={handleSaved}
        onCancel={() => setEditing(null)}
      />
// …on each card:
        <ProductCard
          product={p}
          onSelect={setSelectedId}
          onEdit={setEditing}
          onDelete={setPendingDelete}
          busy={deleting && pendingDelete?.id === p.id}
        />
// …before </Container>:
      <ConfirmDialog
        show={!!pendingDelete}
        title="Delete product"
        body={`Delete “${pendingDelete?.title}”? This can't be undone.`}
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
```

> **Try it yourself:** open the Network tab and create a product. **Payload** shows your JSON, **Headers** shows `Content-Type: application/json` and your `X-Request-Id`, and the response carries a brand-new `id` (195+, because DummyJSON has 194 products). Now change the payload to send `price: form.price` (a string) and watch the response echo a string back. Type coercion at the boundary is your job.

---

# 17. Custom hooks: `useApi`

Count the fetch effects now: `App` has two, `ProductDetail` has one. Each is ~20 lines of identical ceremony. That's the signal to extract a hook.

A custom hook is just a function starting with `use` that calls other hooks. Nothing more.

Create **`src/hooks/useApi.js`**:

```jsx
import { useCallback, useEffect, useState } from "react"
import axios from "axios"

/**
 * Runs `fetcher(signal)` whenever `deps` change.
 *
 * @param fetcher  (signal) => Promise<T>  — must forward the signal to axios
 * @param deps     dependency array, same rules as useEffect
 * @param options  { skip, initialData }
 */
export function useApi(fetcher, deps = [], { skip = false, initialData = null } = {}) {
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(!skip)
  const [error, setError] = useState(null)
  const [nonce, setNonce] = useState(0)

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    if (skip) {
      setLoading(false)
      return
    }

    const controller = new AbortController()

    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        setData(await fetcher(controller.signal))
      } catch (err) {
        if (axios.isCancel(err)) return
        setError(err)                 // already an ApiError — the interceptor saw to that
        setData(null)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    })()

    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce, skip])

  return { data, loading, error, reload, setData }
}
```

Three design decisions worth understanding:

**Why `deps` is a parameter rather than `[fetcher]`.** A new arrow function is created every render, so depending on `fetcher` directly would refetch forever. Explicit deps hand that judgement to the caller, exactly like `useEffect`.

**Why the eslint disable.** The exhaustive-deps rule can't analyse a spread array. This is the standard trade-off in every `useApi`-style hook, and it's the one place you must be disciplined: **if the fetcher closes over a value, that value goes in `deps`.** Forget it and you serve stale data with no warning.

**Why `setData` is returned.** Mutations need to update the list without a round trip.

> **Where this ends.** This hook handles one component's request. It does not cache, dedupe across components, revalidate on focus, or share state. Once you need any of that, stop growing it — [route loaders](#26-loaders-data-before-render) cover a lot of it, and [TanStack Query](#40-axios--tanstack-query) covers the rest.

## 🔨 Build Step 15 — Refactor onto `useApi`

In **`src/App.jsx`**, replace both fetch effects:

```jsx
import { useCallback } from "react"
import { useApi } from "./hooks/useApi"
// …
  const [sortBy, order] = sort ? sort.split("-") : ["", "asc"]

  const fetchProducts = useCallback(
    (signal) =>
      listProducts({ q: debouncedQuery, category, page, limit: PAGE_SIZE, sortBy, order, signal }),
    [debouncedQuery, category, page, sortBy, order]
  )

  const {
    data: result,
    loading,
    error,
    reload,
    setData: setResult,
  } = useApi(fetchProducts, [debouncedQuery, category, page, sortBy, order])

  const { data: categories } = useApi((signal) => listCategories({ signal }), [], {
    initialData: [],
  })
```

Delete the two `useEffect` blocks, the `products`/`loading`/`error`/`reloadKey` state, and wire `onRetry={reload}` on the `ErrorNotice`.

`useCallback` around the fetcher is not decoration: without it the hook's identity churns every render. With explicit `deps` alongside, the hook stays honest.

Simplify **`src/components/ProductDetail.jsx`** the same way — the whole effect collapses to three lines:

```jsx
import { useCallback } from "react"
import { getProduct } from "../api/services/products"
import { useApi } from "../hooks/useApi"
// …
export function ProductDetail({ id, onClose }) {
  const fetcher = useCallback((signal) => getProduct(id, { signal }), [id])
  const { data: product, loading, error, reload } = useApi(fetcher, [id], { skip: !id })
  // …same JSX, plus onRetry={reload} on the ErrorNotice
}
```

That `skip: !id` is what the early `return` in the raw effect was doing — now it's a named option instead of a control-flow trick.

---

# Part 4 — Authentication

Everything in Part 5 — protected routes, role gates, redirect-after-login — needs a working auth layer underneath it. We build that here: token storage, an auth service, the interceptor that attaches the token, and the one that silently refreshes it.

# 18. Tokens & the auth service

## How the flow works

```
POST /auth/login  { username, password }
      ↓
  { accessToken, refreshToken, id, username, email, firstName, … }
      ↓
store both tokens
      ↓
every request:  Authorization: Bearer <accessToken>
      ↓
accessToken expires → 401
      ↓
POST /auth/refresh { refreshToken }  →  new accessToken (+ new refreshToken)
      ↓
retry the original request
```

Two tokens, two different jobs:

| | Access token | Refresh token |
|---|---|---|
| Lifetime | Minutes | Days or weeks |
| Sent with | Every API request | Only the refresh call |
| If stolen | Limited blast radius | Full account takeover until revoked |

That asymmetry is the entire design: the credential that travels constantly is the one that expires fastest.

## Where to keep them

| Location | Survives refresh | XSS-readable | Notes |
|---|---|---|---|
| Memory (module variable) | No | No | Safest; user re-authenticates on reload |
| `sessionStorage` | Per-tab | **Yes** | Common compromise |
| `localStorage` | Yes | **Yes** | Most common; most criticised |
| `httpOnly` cookie | Yes | **No** | Best, but the server must set it, and you need CSRF defence |

The honest summary: **an `httpOnly` cookie set by your backend is the right answer** for a real product. `localStorage` is what most tutorials and many production apps use, and it means any XSS in your app — or in any of your thousand transitive dependencies — can read the token and send it elsewhere.

We use `localStorage` here because DummyJSON is token-based and this is a workshop. Stating the trade-off out loud rather than pretending it doesn't exist is what a professional does. See [§43](#43-security).

## 🔨 Build Step 16 — Token store & auth service

Create **`src/lib/tokenStore.js`**:

```js
const KEYS = {
  access: "shopscope.accessToken",
  refresh: "shopscope.refreshToken",
  user: "shopscope.user",
}

/** Fired whenever auth state changes, so the UI can react from anywhere. */
export const AUTH_CHANGED = "shopscope:auth-changed"

function emit() {
  window.dispatchEvent(new Event(AUTH_CHANGED))
}

/**
 * localStorage is XSS-readable. In production, prefer an httpOnly cookie
 * issued by your own backend. See §43.
 */
export const tokenStore = {
  getAccess: () => localStorage.getItem(KEYS.access),
  getRefresh: () => localStorage.getItem(KEYS.refresh),

  getUser() {
    try {
      return JSON.parse(localStorage.getItem(KEYS.user) ?? "null")
    } catch {
      return null      // corrupted entry — treat as logged out rather than crash
    }
  },

  isAuthenticated() {
    return Boolean(localStorage.getItem(KEYS.access))
  },

  set({ accessToken, refreshToken, user }) {
    if (accessToken) localStorage.setItem(KEYS.access, accessToken)
    if (refreshToken) localStorage.setItem(KEYS.refresh, refreshToken)
    if (user) localStorage.setItem(KEYS.user, JSON.stringify(user))
    emit()
  },

  clear() {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k))
    emit()
  },
}
```

The `AUTH_CHANGED` event is how non-React code (an interceptor) tells React something happened, without the API layer importing React or reaching into the router.

Create **`src/api/services/auth.js`**:

```js
import { api, bareApi } from "../client"
import { endpoints } from "../endpoints"
import { tokenStore } from "../../lib/tokenStore"

/**
 * expiresInMins is deliberately short so the refresh flow in §20 is easy
 * to observe. A real app would use the backend's default.
 */
const TOKEN_LIFETIME_MINS = 1

export async function login({ username, password }) {
  const { data } = await api.post(endpoints.auth.login(), {
    username,
    password,
    expiresInMins: TOKEN_LIFETIME_MINS,
  })

  const { accessToken, refreshToken, ...user } = data
  tokenStore.set({ accessToken, refreshToken, user })
  return user
}

/** Requires a valid access token — the request interceptor supplies it. */
export async function getMe({ signal } = {}) {
  const { data } = await api.get(endpoints.auth.me(), { signal })
  return data
}

/**
 * Uses bareApi so a failed refresh can't re-enter the 401 interceptor
 * that called it. See §20.
 */
export async function refreshTokens() {
  const refreshToken = tokenStore.getRefresh()
  if (!refreshToken) throw new Error("No refresh token available")

  const { data } = await bareApi.post(endpoints.auth.refresh(), {
    refreshToken,
    expiresInMins: TOKEN_LIFETIME_MINS,
  })

  // DummyJSON rotates both tokens on refresh — store both.
  tokenStore.set({ accessToken: data.accessToken, refreshToken: data.refreshToken })
  return data.accessToken
}

export function logout() {
  tokenStore.clear()
}
```

---

# 19. Attaching the token

```js
api.interceptors.request.use((config) => {
  const token = tokenStore.getAccess()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
```

**Why this beats `api.defaults.headers.common.Authorization = …`:** the interceptor reads the token *at request time*. With a default you must remember to update it on login, on logout, and after every refresh — and any request already configured keeps the old value. The interceptor has no stale state to get wrong.

## 🔨 Build Step 17 — The auth interceptor

Create **`src/api/interceptors/auth.js`**:

```js
import { tokenStore } from "../../lib/tokenStore"

/** Endpoints that must never carry an Authorization header. */
const PUBLIC_PATHS = ["/auth/login", "/auth/refresh"]

export function installAuthInterceptor(instance) {
  instance.interceptors.request.use((config) => {
    const isPublic = PUBLIC_PATHS.some((path) => config.url?.startsWith(path))
    const token = tokenStore.getAccess()

    if (token && !isPublic) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  })
}
```

The `PUBLIC_PATHS` check is a small thing that prevents a real problem: sending a stale, expired access token to `/auth/refresh` makes some backends reject the refresh outright.

Register it in **`src/api/interceptors/index.js`**:

```js
import { installAuthInterceptor } from "./auth"
// …
export function installInterceptors() {
  installAuthInterceptor(api)        // request-side: runs before every call
  installLoggingInterceptor(api)
  // installRefreshInterceptor(api)  ← §20
  installErrorNormalizer(api)
}
```

Create **`src/components/LoginForm.jsx`**:

```jsx
import { useState } from "react"
import { Button, Form, Spinner, Stack } from "react-bootstrap"
import { BoxArrowInRight } from "react-bootstrap-icons"
import { login } from "../api/services/auth"
import { ErrorNotice } from "./ErrorNotice"

export function LoginForm({ onLoggedIn, inline = false }) {
  const [username, setUsername] = useState("emilys")
  const [password, setPassword] = useState("emilyspass")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (busy) return
    try {
      setBusy(true)
      setError(null)
      onLoggedIn(await login({ username, password }))
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Form onSubmit={handleSubmit}>
      <Stack direction={inline ? "horizontal" : "vertical"} gap={2}>
        <Form.Control
          size={inline ? "sm" : undefined}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          autoComplete="username"
          required
        />
        <Form.Control
          size={inline ? "sm" : undefined}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          required
        />
        <Button type="submit" size={inline ? "sm" : undefined} disabled={busy}>
          {busy ? (
            <Spinner as="span" size="sm" animation="border" />
          ) : (
            <><BoxArrowInRight className="me-1" /> Sign in</>
          )}
        </Button>
      </Stack>
      {error && <div className="mt-2"><ErrorNotice error={error} /></div>}
    </Form>
  )
}
```

Add an auth bar to **`src/App.jsx`** — a `Navbar` above the heading:

```jsx
import { Container, Image, Nav, Navbar } from "react-bootstrap"
import { LoginForm } from "./components/LoginForm"
import { logout } from "./api/services/auth"
import { tokenStore } from "./lib/tokenStore"
// …
const [user, setUser] = useState(() => tokenStore.getUser())   // lazy init: read storage once
// …at the top of the returned JSX, outside <Container>:
    <Navbar bg="dark" data-bs-theme="dark" className="mb-4">
      <Container>
        <Navbar.Brand>ShopScope</Navbar.Brand>
        <Nav className="ms-auto align-items-center gap-2">
          {user ? (
            <>
              <Image src={user.image} roundedCircle width={28} height={28} alt="" />
              <span className="text-light small">{user.firstName}</span>
              <Button size="sm" variant="outline-light" onClick={() => { logout(); setUser(null) }}>
                Sign out
              </Button>
            </>
          ) : (
            <LoginForm onLoggedIn={setUser} inline />
          )}
        </Nav>
      </Container>
    </Navbar>
```

Wrap the whole return in a fragment (`<>…</>`) so the Navbar sits outside the page `Container`.

> **Try it yourself:** sign in, then watch the Network tab. Every subsequent request — including the product list, which doesn't need it — now carries `Authorization: Bearer …`. That's the interceptor, and no call site knows about it. Now sign in with a wrong password: DummyJSON returns **400** with `{"message": "Invalid credentials"}`, and because `ApiError.from` prefers the backend's message, the alert says exactly that.

---

# 20. Silent refresh: the 401 queue

Access tokens are deliberately short-lived. When one expires the API returns **401**, and the user should not be dumped at a login screen — the app should quietly get a new token and retry.

## The naive version, and why it breaks

```js
api.interceptors.response.use(null, async (error) => {
  if (error.response?.status === 401) {
    const token = await refreshTokens()
    error.config.headers.Authorization = `Bearer ${token}`
    return api(error.config)        // retry
  }
  return Promise.reject(error)
})
```

Three bugs, all of which bite in production:

1. **Infinite loop.** If the retry also 401s, the interceptor fires again. Forever.
2. **Refresh stampede.** Six requests in flight when the token expires → six parallel refresh calls. Most backends invalidate the old refresh token on use, so five fail and the user is logged out.
3. **The refresh call itself can 401**, re-entering the interceptor that called it.

## The version that works

```js
let refreshPromise = null      // module-scoped: the shared in-flight refresh

async function onResponseError(error) {
  const original = error.config
  const status = error.response?.status

  const shouldTryRefresh =
    status === 401 &&
    original &&
    !original._retry &&                       // (1) only once per request
    !original.url?.startsWith("/auth/")        // (3) never for auth endpoints

  if (!shouldTryRefresh) return Promise.reject(error)

  original._retry = true

  try {
    // (2) All concurrent 401s await the SAME refresh promise.
    refreshPromise ??= refreshTokens().finally(() => { refreshPromise = null })
    const accessToken = await refreshPromise

    original.headers.Authorization = `Bearer ${accessToken}`
    return api(original)                       // replay the original request
  } catch (refreshError) {
    tokenStore.clear()
    return Promise.reject(refreshError)
  }
}
```

Read the three fixes back:

1. **`original._retry`** — a custom flag on the config object. Second time round `shouldTryRefresh` is false and the error propagates normally. One retry, never two.
2. **`refreshPromise ??=`** — the first 401 creates the promise; every other 401 in that window awaits the same one. One network call, everyone gets the token. `.finally()` clears it so the *next* expiry starts fresh.
3. **`bareApi` inside `refreshTokens`** plus the `/auth/` guard — the refresh request cannot recurse into this handler.

And when refresh genuinely fails — revoked token, deleted user — clear everything. `tokenStore.clear()` fires `AUTH_CHANGED`, and the UI reacts.

## 🔨 Build Step 18 — Silent refresh

Create **`src/api/interceptors/refresh.js`**:

```js
import { api } from "../client"
import { refreshTokens } from "../services/auth"
import { tokenStore } from "../../lib/tokenStore"
import { logger } from "../../config/logger"

/** Shared across all concurrent 401s — see the "refresh stampede" note. */
let refreshPromise = null

export function installRefreshInterceptor(instance) {
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const original = error.config

      const shouldTryRefresh =
        error.response?.status === 401 &&
        original &&
        !original._retry &&
        !original.url?.startsWith("/auth/")

      if (!shouldTryRefresh) return Promise.reject(error)

      original._retry = true

      try {
        refreshPromise ??= refreshTokens().finally(() => {
          refreshPromise = null
        })

        const accessToken = await refreshPromise
        logger.info("[auth] token refreshed; replaying request")

        original.headers.Authorization = `Bearer ${accessToken}`
        return api(original)
      } catch (refreshError) {
        logger.warn("[auth] refresh failed; signing out")
        tokenStore.clear()          // fires AUTH_CHANGED
        return Promise.reject(error)   // reject with the ORIGINAL 401, not the refresh error
      }
    }
  )
}
```

**Why reject with the original error, not the refresh error:** the caller asked for `/products`. Telling it "the refresh endpoint failed" describes plumbing it never knew about. The original 401 is the honest answer to the question it asked.

Register it in **`src/api/interceptors/index.js`**, between logging and the normaliser:

```js
export function installInterceptors() {
  installAuthInterceptor(api)
  installLoggingInterceptor(api)
  installRefreshInterceptor(api)   // must run BEFORE the normaliser…
  installErrorNormalizer(api)      // …because it needs the raw axios error
}
```

That ordering is load-bearing. Response interceptors run in registration order, and the refresh handler needs `error.config` and `error.response.status` from the **raw axios error**. If the normaliser ran first, the refresh handler would receive an `ApiError` with no `config` to replay.

> **Circular imports:** `refresh.js` imports `api` from `client.js` and `refreshTokens` from `services/auth.js`, which itself imports from `client.js`. ES modules handle this fine because the imports are only *called* at runtime, long after both modules finish evaluating. This is exactly why interceptors live in their own files and are installed explicitly rather than registered as import side effects in `client.js`.

Now let the UI react to a forced logout. In **`src/App.jsx`**:

```jsx
import { AUTH_CHANGED, tokenStore } from "./lib/tokenStore"
// …
  useEffect(() => {
    function sync() {
      const current = tokenStore.getUser()
      setUser(current)
      if (!current) setFlash("Your session expired. Please sign in again.")
    }
    window.addEventListener(AUTH_CHANGED, sync)
    return () => window.removeEventListener(AUTH_CHANGED, sync)
  }, [])
```

Add a button that exercises the whole flow, next to Sign out:

```jsx
<Button size="sm" variant="outline-light" onClick={() => getMe().then((me) => setFlash(`/auth/me → ${me.email}`))}>
  Who am I?
</Button>
```

(Import `getMe` from `./api/services/auth`.)

> **Try it yourself — the payoff of this whole part.** `TOKEN_LIFETIME_MINS` is 1, so:
> 1. Sign in. Click **Who am I?** → your email appears. **One** request in the Network tab.
> 2. Wait ~70 seconds.
> 3. Click **Who am I?** again. The UI behaves identically — but the Network tab shows **three** requests: `/auth/me` → **401**, `/auth/refresh` → **200**, `/auth/me` → **200**.
>
> The user saw a working button. That is the entire point of interceptors.
>
> Now click it three times rapidly right after expiry: still only **one** `/auth/refresh`. That's `refreshPromise ??=` earning its keep. Comment that line out (call `refreshTokens()` directly) and you'll see three refresh calls, two of which fail — the stampede, reproduced.

---

# Part 5 — Routing with React Router v8

ShopScope is one page doing five jobs. Nothing is linkable, the back button does nothing, and a refresh loses your search. This part fixes all of that, and along the way moves data fetching from `useEffect` into **route loaders** — which turns out to solve several problems we hand-rolled in Part 3.

# 21. What v8 changed, and installing it

If you've used React Router before, read this table before writing a line of code. If you haven't, skim it — it explains why other tutorials look different.

| | v6 | v7 | **v8** |
|---|---|---|---|
| Package | `react-router-dom` | `react-router` (dom is a shim) | **`react-router` only — `react-router-dom` is removed** |
| `RouterProvider` from | `react-router-dom` | `react-router/dom` | **`react-router/dom`** |
| Everything else from | `react-router-dom` | `react-router` | **`react-router`** |
| Middleware | — | behind `future.v8_middleware` | **always on** |
| `context` in loaders | — | plain object or provider | **always a `RouterContextProvider`** |
| Minimum React | 16.8 | 18 | **19.2.7** |
| Minimum Node | 14 | 20 | **22.22.0** |
| Module format | CJS + ESM | CJS + ESM | **ESM only** |

**The import rule, memorised:**

```jsx
import { createBrowserRouter, Link, useLoaderData /* …everything else */ } from "react-router"
import { RouterProvider } from "react-router/dom"
```

If you copy a v6 snippet from Stack Overflow and it imports from `react-router-dom`, that's your first fix.

## The three modes

React Router v8 can be used three ways. Picking the wrong one wastes hours.

| Mode | What it is | Use when |
|---|---|---|
| **Declarative** | `<BrowserRouter>` + `<Routes>`/`<Route>`. Components only, no loaders or actions. | Migrating a v5 app; you want routing and nothing else |
| **Data** | `createBrowserRouter([…])` + `<RouterProvider>`. Loaders, actions, middleware, route error boundaries. | **A Vite SPA with a separate backend — us** |
| **Framework** | The React Router Vite plugin, file-based routes, SSR, typegen. | You want a full-stack framework (the Remix lineage) |

**We use Data Mode.** Our backend is DummyJSON; we don't want SSR; and we do want loaders, actions, and route error boundaries. Everything in this part assumes Data Mode — where Framework Mode differs, I'll say so.

It's already installed from [§0.3](#03-install-the-dependencies):

```bash
npm ls react-router      # should print react-router@8.x
```

---

# 22. Your first router

Two pieces: a route array, and a provider.

```jsx
import { createBrowserRouter } from "react-router"
import { RouterProvider } from "react-router/dom"

const router = createBrowserRouter([
  { path: "/", Component: HomePage },
  { path: "/about", Component: AboutPage },
])

createRoot(document.getElementById("root")).render(<RouterProvider router={router} />)
```

A **route object** has these properties — you'll meet each one in this part:

| Property | Purpose |
|---|---|
| `path` | URL pattern: `"products"`, `"products/:id"`, `"*"` |
| `index` | `true` = the default child of a layout route |
| `Component` | The component to render |
| `loader` | Async function; runs **before** the component renders |
| `action` | Async function; handles form submissions |
| `middleware` | Runs before loaders/actions, parent → child |
| `ErrorBoundary` | Catches errors from this route's loader, action, or render |
| `HydrateFallback` | Shown on initial load while the root loaders run |
| `children` | Nested routes, rendered into this route's `<Outlet />` |
| `lazy` | Load the component and loader on demand |
| `handle` | Arbitrary metadata, readable via `useMatches` |
| `shouldRevalidate` | Opt out of automatic refetching |

> **Create the router outside the React tree.** Never build it inside a component or hold it in state — it owns navigation history, and recreating it on render resets that. One module-level `createBrowserRouter` call, always.

## 🔨 Build Step 19 — The route tree

Create **`src/routes/RootLayout.jsx`** — the shell every page renders inside:

```jsx
import { Container, Nav, Navbar } from "react-bootstrap"
import { Link, NavLink, Outlet, ScrollRestoration } from "react-router"

export function RootLayout() {
  return (
    <>
      <Navbar bg="dark" data-bs-theme="dark" expand="md" className="mb-4">
        <Container>
          <Navbar.Brand as={Link} to="/">ShopScope</Navbar.Brand>
          <Navbar.Toggle aria-controls="main-nav" />
          <Navbar.Collapse id="main-nav">
            <Nav className="me-auto">
              <Nav.Link as={NavLink} to="/products" end>Products</Nav.Link>
              <Nav.Link as={NavLink} to="/account">Account</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container className="pb-5">
        <Outlet />        {/* the matched child route renders here */}
      </Container>

      <ScrollRestoration />
    </>
  )
}
```

Two React Bootstrap + Router integration points, and they're the ones people get wrong:

- **`as={Link}` / `as={NavLink}`** makes a Bootstrap `Nav.Link` render a router link. Without it you get a plain `<a href>` that triggers a **full page reload** — losing all app state and making your SPA feel like 2005. Any time you see a Bootstrap component that renders an anchor, it needs `as={Link} to=…` instead of `href=…`.
- **`end`** on `NavLink` means "only mark active on an exact match". Without it, `/products` stays highlighted while you're on `/products/42`.

Create **`src/routes/NotFoundPage.jsx`**:

```jsx
import { Alert, Button } from "react-bootstrap"
import { Link, useLocation } from "react-router"

export function NotFoundPage() {
  const location = useLocation()
  return (
    <Alert variant="warning">
      <Alert.Heading className="h5">Page not found</Alert.Heading>
      <p className="mb-3">
        Nothing lives at <code>{location.pathname}</code>.
      </p>
      <Button as={Link} to="/products" variant="outline-secondary">Back to products</Button>
    </Alert>
  )
}
```

Create **`src/router.jsx`**:

```jsx
import { createBrowserRouter, redirect } from "react-router"
import { RootLayout } from "./routes/RootLayout"
import { ProductsPage } from "./routes/ProductsPage"
import { NotFoundPage } from "./routes/NotFoundPage"

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      // "/" itself has no content — send visitors somewhere useful.
      { index: true, loader: () => redirect("/products") },

      { path: "products", Component: ProductsPage },

      // "*" matches anything unmatched above. Always last.
      { path: "*", Component: NotFoundPage },
    ],
  },
])
```

Now move the current page into a route. Create **`src/routes/ProductsPage.jsx`** and paste the entire body of your current `App.jsx` into it, renaming the component to `ProductsPage` and removing the `<Navbar>` (the layout owns that now) and the outer `<Container>` (ditto).

Update **`src/main.jsx`**:

```jsx
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider } from "react-router/dom"
import "bootstrap/dist/css/bootstrap.min.css"
import "./index.css"
import { installInterceptors } from "./api/interceptors"
import { router } from "./router"

installInterceptors()

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
```

`App.jsx` is now unused — delete it.

> **Try it yourself:** visit `/`, and you're redirected to `/products`. Visit `/nonsense` and you get the 404 page **inside the layout** — navbar intact — because the splat route is a child of the root route. Move it outside `children` and the 404 loses the navbar. That's nesting doing its job.

---

# 23. Layouts, `Outlet`, index routes & links

## Nesting is the core idea

A route's `children` render into its `<Outlet />`. Nest routes and you nest UI:

```jsx
{
  path: "account",
  Component: AccountLayout,        // renders sidebar + <Outlet />
  children: [
    { index: true, Component: ProfilePage },      // /account
    { path: "orders", Component: OrdersPage },    // /account/orders
    { path: "settings", Component: SettingsPage },// /account/settings
  ],
}
```

Visiting `/account/orders` renders `RootLayout` → `AccountLayout` → `OrdersPage`, each inside the previous one's `Outlet`. The navbar and sidebar don't unmount when you move between children — they don't even re-render unnecessarily.

## Index routes

`{ index: true }` is the child that renders when the parent's path matches **exactly**. It's how `/account` shows something rather than an empty outlet. An index route has no `path` of its own — setting both is an error.

## Pathless layout routes

A route with `Component` and `children` but **no `path`** groups routes under shared UI without adding a URL segment:

```jsx
{
  // no path — purely for grouping
  Component: CheckoutLayout,
  children: [
    { path: "cart", Component: CartPage },        // /cart
    { path: "payment", Component: PaymentPage },  // /payment
  ],
}
```

This is also the idiomatic way to apply middleware or an `ErrorBoundary` to a set of routes that don't share a URL prefix.

## Links

```jsx
import { Link, NavLink, useNavigate } from "react-router"

<Link to="/products">All products</Link>
<Link to="/products/42">Product 42</Link>
<Link to="42">Relative — appends to the current route's path</Link>
<Link to=".." relative="path">Up one URL segment</Link>
<Link to="/products?q=phone">With a query string</Link>
<Link to="/products" state={{ from: "banner" }}>With hidden state</Link>
<Link to="/products" replace>Replace instead of push (no back-button entry)</Link>
<Link to="/products" preventScrollReset>Don't jump to the top</Link>
```

**`NavLink`** knows whether it's active, and its `className`, `style`, and `children` all accept a function:

```jsx
<NavLink
  to="/products"
  end
  className={({ isActive, isPending }) =>
    `nav-link ${isActive ? "active" : ""} ${isPending ? "opacity-50" : ""}`
  }
>
  Products
</NavLink>
```

`isPending` is true while the destination's loaders are still running — a free "this link is loading" affordance that most apps never build.

**`useNavigate`** for programmatic navigation, from an event handler or after an async call:

```jsx
const navigate = useNavigate()

navigate("/products")                  // push
navigate("/products", { replace: true })  // replace
navigate(-1)                           // back
navigate(`/products/${id}`, { state: { justCreated: true } })
```

> **Prefer `<Link>` to `useNavigate`.** A link is a real anchor: middle-click opens a tab, hover shows the URL, screen readers announce it, and crawlers follow it. `useNavigate` is for *after something happens* — a successful save, a timeout, a redirect.

## 🔨 Build Step 20 — Account layout

Create **`src/routes/AccountLayout.jsx`**:

```jsx
import { Card, Col, Nav, Row } from "react-bootstrap"
import { NavLink, Outlet } from "react-router"

export function AccountLayout() {
  return (
    <Row className="g-4">
      <Col md={3}>
        <Card>
          <Card.Header className="fw-semibold">Account</Card.Header>
          <Nav className="flex-column p-2">
            <Nav.Link as={NavLink} to="/account" end>Profile</Nav.Link>
            <Nav.Link as={NavLink} to="/account/products">Manage products</Nav.Link>
          </Nav>
        </Card>
      </Col>
      <Col md={9}>
        <Outlet />
      </Col>
    </Row>
  )
}
```

Add it to **`src/router.jsx`** (we'll fill in the pages as we go):

```jsx
      {
        path: "account",
        Component: AccountLayout,
        children: [
          { index: true, Component: ProfilePage },
          { path: "products", Component: ManageProductsPage },
        ],
      },
```

---

# 24. Dynamic segments & URL params

```jsx
{ path: "products/:productId", Component: ProductDetailPage }
```

Anything after `:` is a **param**, captured by name:

```jsx
import { useParams } from "react-router"

function ProductDetailPage() {
  const { productId } = useParams()    // always a STRING — "42", never 42
  // …
}
```

**Params are always strings.** `Number(productId)` before arithmetic or a strict comparison. This is a genuinely common bug: `product.id === productId` is `false` for `1 === "1"`.

### The full pattern syntax

| Pattern | Matches | Notes |
|---|---|---|
| `products` | `/products` | Static |
| `products/:id` | `/products/42` | One segment, captured |
| `products/:id/reviews/:reviewId` | `/products/42/reviews/7` | Multiple params |
| `files/*` | `/files/a/b/c.txt` | Splat — `params["*"]` is `"a/b/c.txt"` |
| `:lang?/about` | `/about`, `/en/about` | Optional segment |
| `products.:format` | `/products.json` | Params can be part of a segment |

**Route ranking is by specificity, not declaration order.** `/products/new` wins over `/products/:id` even if `:id` is declared first, because a static segment outranks a dynamic one. You don't have to order routes carefully — a welcome difference from most routers.

## 🔨 Build Step 21 — A real product page

Our detail view is an `Offcanvas` driven by state, which means it isn't linkable. Make it a route.

Create **`src/routes/ProductDetailPage.jsx`**:

```jsx
import { useCallback } from "react"
import { Badge, Button, Card, Col, Placeholder, Ratio, Row, Stack } from "react-bootstrap"
import { ArrowLeft } from "react-bootstrap-icons"
import { Link, useParams } from "react-router"
import { getProduct } from "../api/services/products"
import { useApi } from "../hooks/useApi"
import { ErrorNotice } from "../components/ErrorNotice"

export function ProductDetailPage() {
  const { productId } = useParams()
  const fetcher = useCallback((signal) => getProduct(productId, { signal }), [productId])
  const { data: product, loading, error, reload } = useApi(fetcher, [productId])

  return (
    <>
      <Button as={Link} to="/products" variant="link" className="ps-0 mb-3">
        <ArrowLeft className="me-1" /> Back to products
      </Button>

      <ErrorNotice error={error} onRetry={reload} />

      {loading && (
        <Placeholder as="div" animation="glow">
          <Placeholder xs={12} style={{ height: 260 }} />
        </Placeholder>
      )}

      {product && !loading && (
        <Card>
          <Card.Body>
            <Row className="g-4">
              <Col md={5}>
                <Ratio aspectRatio="1x1">
                  <img src={product.thumbnail} alt="" className="object-fit-contain bg-body-secondary rounded" />
                </Ratio>
              </Col>
              <Col md={7}>
                <Stack gap={3}>
                  <div>
                    <h1 className="h4 mb-1">{product.title}</h1>
                    <span className="text-muted text-capitalize">
                      {product.brand ? `${product.brand} · ` : ""}{product.category}
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <span className="fs-3 fw-semibold">${product.price}</span>
                    <Badge bg={product.stock > 20 ? "success" : "warning"}>
                      {product.availabilityStatus ?? `${product.stock} in stock`}
                    </Badge>
                    <span className="text-muted">★ {product.rating}</span>
                  </div>
                  <p className="mb-0">{product.description}</p>
                </Stack>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}
    </>
  )
}
```

Register it in **`src/router.jsx`**, as a **sibling** of `products` rather than a child:

```jsx
      { path: "products", Component: ProductsPage },
      { path: "products/:productId", Component: ProductDetailPage },
```

> **Why siblings and not nested?** Nesting `products/:productId` *inside* `products` would render the detail page inside the list page's `Outlet` — a master-detail layout. That's a legitimate design (and how you'd build a mail client), but here we want the detail page to replace the list. Nest for shared UI; keep siblings for separate screens.

In **`src/routes/ProductsPage.jsx`**, replace the `Offcanvas` with links. Delete the `selectedId` state and the `<ProductDetail />` render, and change `ProductCard` to take a link target instead of `onSelect`:

```jsx
// components/ProductCard.jsx — swap the two click handlers for links
import { Link } from "react-router"
// …
      <Link to={`/products/${product.id}`}>
        <Card.Img
          variant="top"
          src={product.thumbnail}
          alt=""
          loading="lazy"
          className="object-fit-contain bg-body-secondary p-2"
          style={{ height: 140 }}
        />
      </Link>
// …
      <Card.Title className="fs-6">
        <Link to={`/products/${product.id}`} className="text-decoration-none stretched-link">
          {product.title}
        </Link>
      </Card.Title>
```

Bootstrap's `stretched-link` makes the whole card clickable while keeping one real anchor for accessibility — better than the click-handler-on-a-div we had.

> **Try it yourself:** click a product, then hit the browser **back** button. It works, and it always did — you just couldn't use it before. Copy the URL of a product page into a new tab and it loads directly. That's what "linkable" buys you, and it's why detail views should almost always be routes rather than modal state.

---

# 25. The URL is state: `useSearchParams`

Our search box, category filter, sort order, and page number all live in `useState`. Which means:

- Refreshing the page loses them.
- You can't share a link to "cheap laptops, page 2".
- The back button doesn't undo a filter change.

**Filters belong in the query string.** `useSearchParams` is the API, and it works exactly like `useState` — except the value lives in the URL:

```jsx
import { useSearchParams } from "react-router"

const [searchParams, setSearchParams] = useSearchParams()

const q = searchParams.get("q") ?? ""              // read
setSearchParams({ q: "phone", page: "2" })          // write (replaces ALL params)
```

`searchParams` is a standard [`URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) — `get`, `getAll`, `has`, `set`, `delete`, `entries`.

### The two traps

**1. Setting replaces everything.** `setSearchParams({ page: "2" })` wipes out `q` and `category`. Use the updater form and mutate a copy:

```jsx
setSearchParams((previous) => {
  const next = new URLSearchParams(previous)
  next.set("page", "2")
  return next
})
```

**2. Every keystroke becomes a history entry.** Type "phone" and the back button needs five presses to escape. Use `replace: true` for high-frequency updates:

```jsx
setSearchParams(next, { replace: true })
```

The rule of thumb: **filters replace, navigation pushes.** Typing in a search box shouldn't fill someone's history; clicking to page 2 arguably should.

## 🔨 Build Step 22 — Filters in the URL

Create **`src/hooks/useProductFilters.js`** — one place that owns the URL contract:

```jsx
import { useCallback, useMemo } from "react"
import { useSearchParams } from "react-router"

export const PAGE_SIZE = 12

/**
 * Reads and writes the product list's filters as query params.
 *
 * The URL is the single source of truth — there is no useState mirror to
 * fall out of sync with it, and every filter combination is a shareable link.
 */
export function useProductFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo(() => {
    const page = Number(searchParams.get("page") ?? "1")
    return {
      q: searchParams.get("q") ?? "",
      category: searchParams.get("category") ?? "",
      sort: searchParams.get("sort") ?? "",
      // Pages are 1-based in the URL (humans) and 0-based in the API (skip).
      page: Number.isFinite(page) && page > 0 ? page - 1 : 0,
    }
  }, [searchParams])

  /**
   * Merge a patch into the current params. Keys set to "" or null are
   * removed, so the URL never carries `?q=&category=`.
   */
  const setFilters = useCallback(
    (patch, { replace = true } = {}) => {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous)

          for (const [key, value] of Object.entries(patch)) {
            if (value === "" || value === null || value === undefined) next.delete(key)
            else next.set(key, String(value))
          }

          // Any filter change invalidates the current page.
          if (!("page" in patch)) next.delete("page")

          return next
        },
        { replace }
      )
    },
    [setSearchParams]
  )

  return { filters, setFilters }
}
```

That `if (!("page" in patch)) next.delete("page")` line is the "reset to page 1 when filters change" rule — previously a whole `useEffect`, now one line in the place that owns paging.

Rewrite **`src/routes/ProductsPage.jsx`** to use it:

```jsx
import { useCallback, useEffect, useState } from "react"
import { Badge, Button, Col, Form, InputGroup, Pagination, Row, Stack } from "react-bootstrap"
import { Search } from "react-bootstrap-icons"
import { listProducts, listCategories } from "../api/services/products"
import { useApi } from "../hooks/useApi"
import { useDebouncedValue } from "../hooks/useDebouncedValue"
import { PAGE_SIZE, useProductFilters } from "../hooks/useProductFilters"
import { ProductCard } from "../components/ProductCard"
import { CardSkeletons } from "../components/Skeletons"
import { ErrorNotice } from "../components/ErrorNotice"

export function ProductsPage() {
  const { filters, setFilters } = useProductFilters()

  // The input is local state so typing stays instant; the URL updates on a debounce.
  const [queryDraft, setQueryDraft] = useState(filters.q)
  const debouncedDraft = useDebouncedValue(queryDraft, 400)

  useEffect(() => {
    if (debouncedDraft !== filters.q) setFilters({ q: debouncedDraft })
  }, [debouncedDraft])   // eslint-disable-line react-hooks/exhaustive-deps

  const [sortBy, order] = filters.sort ? filters.sort.split("-") : ["", "asc"]

  const fetchProducts = useCallback(
    (signal) =>
      listProducts({
        q: filters.q,
        category: filters.category,
        page: filters.page,
        limit: PAGE_SIZE,
        sortBy,
        order,
        signal,
      }),
    [filters.q, filters.category, filters.page, sortBy, order]
  )

  const { data: result, loading, error, reload } = useApi(fetchProducts, [
    filters.q, filters.category, filters.page, sortBy, order,
  ])

  const { data: categories } = useApi((signal) => listCategories({ signal }), [], { initialData: [] })

  const products = result?.products ?? []
  const total = result?.total ?? 0
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1)

  return (
    <>
      <h1 className="h3 mb-3">Products</h1>

      <Stack direction="horizontal" gap={2} className="mb-3 flex-wrap">
        <InputGroup style={{ maxWidth: 340 }}>
          <InputGroup.Text><Search /></InputGroup.Text>
          <Form.Control
            placeholder="Search products…"
            value={queryDraft}
            onChange={(e) => setQueryDraft(e.target.value)}
          />
          {queryDraft && (
            <Button variant="outline-secondary" onClick={() => setQueryDraft("")}>Clear</Button>
          )}
        </InputGroup>

        <Form.Select
          style={{ maxWidth: 190 }}
          value={filters.category}
          onChange={(e) => setFilters({ category: e.target.value })}
          disabled={!!filters.q}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </Form.Select>

        <Form.Select
          style={{ maxWidth: 190 }}
          value={filters.sort}
          onChange={(e) => setFilters({ sort: e.target.value })}
        >
          <option value="">Default order</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="rating-desc">Best rated</option>
        </Form.Select>

        <Badge bg="secondary" className="ms-auto">{total} results</Badge>
      </Stack>

      <ErrorNotice error={error} onRetry={reload} />

      {loading ? (
        <CardSkeletons count={PAGE_SIZE} />
      ) : products.length === 0 ? (
        <p className="text-center text-muted py-5">Nothing matches those filters.</p>
      ) : (
        <Row xs={1} sm={2} md={3} lg={4} className="g-3">
          {products.map((p) => (
            <Col key={p.id}><ProductCard product={p} /></Col>
          ))}
        </Row>
      )}

      {lastPage > 0 && (
        <Pagination className="justify-content-center mt-4">
          <Pagination.Prev
            disabled={filters.page === 0}
            onClick={() => setFilters({ page: filters.page }, { replace: false })}
          />
          <Pagination.Item disabled>Page {filters.page + 1} of {lastPage + 1}</Pagination.Item>
          <Pagination.Next
            disabled={filters.page >= lastPage}
            onClick={() => setFilters({ page: filters.page + 2 }, { replace: false })}
          />
        </Pagination>
      )}
    </>
  )
}
```

The page arithmetic is worth a second look: `filters.page` is 0-based, the URL is 1-based. So "next page" from 0-based page 1 is URL page `1 + 2 = 3`. Off-by-one bugs live here — this is exactly the arithmetic worth a unit test.

Note also `{ replace: false }` on the pagination buttons: paging *is* navigation, so it should create history entries. Filter changes replace.

> **Try it yourself:** search for "phone", pick a category, go to page 2 — now look at the URL: `/products?q=phone&page=2`. Copy it into a new tab; the exact view loads. Press back; you return to page 1. None of that needed a line of state-persistence code, because the URL *is* the state.

---

# 26. Loaders: data before render

Every fetch so far follows the same sequence: **render → effect → fetch → re-render**. The user sees an empty shell first, then a spinner, then content. Two renders minimum, and a request that can't start until React has already painted.

A **loader** inverts that: the router fetches **first**, and renders the component only when the data is ready.

```jsx
{
  path: "products/:productId",
  Component: ProductDetailPage,
  loader: async ({ params, request }) => {
    return getProduct(params.productId, { signal: request.signal })
  },
}
```

```jsx
function ProductDetailPage() {
  const product = useLoaderData()     // already there on the first render
  // no loading state, no error state, no useEffect
}
```

## What a loader receives

```js
async function loader({ request, params, context }) {
  request        // a real Request: request.url, request.signal, request.headers
  params         // { productId: "42" } — the same strings useParams gives you
  context        // RouterContextProvider — values set by middleware (§31)
}
```

**`request.signal` is the detail that matters most.** The router aborts it when the user navigates away mid-load. Forward it to axios and stale requests cancel themselves — the `AbortController` plumbing from §7, now handled by the framework.

## What loaders give you for free

| | `useEffect` fetching | Loader |
|---|---|---|
| Fetch starts | After render | Before render, on link click |
| Renders to show data | 2+ | 1 |
| Waterfalls in nested routes | Yes — parent renders, then child fetches | No — all matched loaders run **in parallel** |
| Cancellation | You wire `AbortController` | `request.signal`, automatic |
| Error handling | `try/catch` + state in every component | Throw; the route `ErrorBoundary` catches |
| Refetch after mutation | Manual `reload()` | Automatic revalidation after actions |
| Back/forward | Refetches, shows a spinner | Instant — the router reuses the data |

That "nested loaders run in parallel" row is the one you can't replicate with effects. With `useEffect`, a layout that loads a user and a child that loads their orders must render the layout before the child even mounts — a waterfall. The router matches all routes first, then runs every loader at once.

## The rules

1. **Loaders run outside React.** No hooks, no component state. They're plain async functions.
2. **Return data, or throw.** A returned value goes to `useLoaderData`; a thrown value goes to the nearest `ErrorBoundary`.
3. **Throw `redirect()` to navigate.** `throw redirect("/login")` from a loader is the canonical auth guard.
4. **Loaders re-run automatically** — on navigation, on param change, on search-param change, and after any action.

## 🔨 Build Step 23 — Move fetching into loaders

Create **`src/routes/ProductDetailPage.jsx`**'s loader alongside the component (co-locating them keeps the route self-contained):

```jsx
import { data, useLoaderData } from "react-router"
import { getProduct } from "../api/services/products"
import { ApiError } from "../lib/ApiError"

/**
 * Loaders run before the component. Forward request.signal so the router
 * can cancel this fetch if the user navigates away mid-load.
 */
export async function productDetailLoader({ params, request }) {
  try {
    return await getProduct(params.productId, { signal: request.signal })
  } catch (error) {
    // Convert a 404 into a thrown Response so the ErrorBoundary can render a
    // proper "not found" page rather than a generic failure. See §30.
    if (error instanceof ApiError && error.isNotFound) {
      throw data(
        { message: `No product with id ${params.productId}.` },
        { status: 404, statusText: "Not Found" }
      )
    }
    throw error
  }
}

export function ProductDetailPage() {
  const product = useLoaderData()
  // …exactly the same JSX as before, minus loading, error, and useApi
}
```

The component loses its `useApi` call, its `loading` branch, its `ErrorNotice`, and its `useParams` — roughly half its lines, all of it ceremony.

Do the same for the list. In **`src/routes/ProductsPage.jsx`**:

```jsx
import { useLoaderData } from "react-router"
import { listProducts, listCategories } from "../api/services/products"
import { PAGE_SIZE } from "../hooks/useProductFilters"

export async function productsLoader({ request }) {
  const url = new URL(request.url)
  const q = url.searchParams.get("q") ?? ""
  const category = url.searchParams.get("category") ?? ""
  const sort = url.searchParams.get("sort") ?? ""
  const page = Math.max(0, Number(url.searchParams.get("page") ?? "1") - 1)
  const [sortBy, order] = sort ? sort.split("-") : ["", "asc"]

  // Both requests start at the same instant — no waterfall.
  const [result, categories] = await Promise.all([
    listProducts({ q, category, page, limit: PAGE_SIZE, sortBy, order, signal: request.signal }),
    listCategories({ signal: request.signal }),
  ])

  return { result, categories }
}

export function ProductsPage() {
  const { result, categories } = useLoaderData()
  const { filters, setFilters } = useProductFilters()
  // …same JSX; delete both useApi calls, `loading`, `error`, and ErrorNotice
}
```

**The loader reads the query string from `request.url`, not from `useSearchParams`** — it runs outside React and has no hooks. And because the router re-runs loaders whenever search params change, editing a filter automatically refetches. The `useProductFilters` hook stays for *writing* params; the loader owns *reading* them.

Wire both into **`src/router.jsx`**:

```jsx
import { ProductsPage, productsLoader } from "./routes/ProductsPage"
import { ProductDetailPage, productDetailLoader } from "./routes/ProductDetailPage"
// …
      { path: "products", Component: ProductsPage, loader: productsLoader },
      { path: "products/:productId", Component: ProductDetailPage, loader: productDetailLoader },
```

> **Try it yourself:** click into a product with the Network tab open. Notice the request fires **on click**, before the new page renders — not after. Then throttle to Slow 3G and click: the old page stays on screen while the new one loads, instead of flashing an empty skeleton. That's the router's default, and it's usually what you want. The next section makes it visible.

---

# 27. Pending UI: `useNavigation`

Loaders introduce a new problem: between clicking a link and the new page appearing, **nothing happens**. On a fast connection that's fine; on a slow one it looks broken.

`useNavigation` tells you what the router is doing:

```jsx
import { useNavigation } from "react-router"

const navigation = useNavigation()

navigation.state        // "idle" | "loading" | "submitting"
navigation.location     // where we're going (undefined when idle)
navigation.formData     // the submitted data, while submitting
```

Put it in the **layout**, once, and every page gets pending feedback:

```jsx
{navigation.state === "loading" && <TopProgressBar />}
```

| State | Means |
|---|---|
| `"idle"` | Nothing in flight |
| `"loading"` | A navigation's loaders are running |
| `"submitting"` | An action is running (form POST) |

## 🔨 Build Step 24 — A global progress bar

Update **`src/routes/RootLayout.jsx`**:

```jsx
import { Container, Nav, Navbar, ProgressBar } from "react-bootstrap"
import { Link, NavLink, Outlet, ScrollRestoration, useNavigation } from "react-router"

export function RootLayout() {
  const navigation = useNavigation()
  const busy = navigation.state !== "idle"

  return (
    <>
      <Navbar bg="dark" data-bs-theme="dark" expand="md">
        {/* …unchanged… */}
      </Navbar>

      {/* Fixed under the navbar; only mounted while busy so it can't be missed. */}
      <div style={{ height: 3 }}>
        {busy && (
          <ProgressBar
            now={100}
            animated
            striped
            style={{ height: 3, borderRadius: 0 }}
            aria-label="Loading"
          />
        )}
      </div>

      <Container className="py-4">
        {/* Dim stale content while the next page loads — honest, and not jarring. */}
        <div className={busy ? "opacity-50" : ""} style={{ transition: "opacity .15s" }}>
          <Outlet />
        </div>
      </Container>

      <ScrollRestoration />
    </>
  )
}
```

Add per-link feedback too — `NavLink`'s `isPending` marks the link you clicked:

```jsx
<Nav.Link
  as={NavLink}
  to="/products"
  end
  className={({ isPending }) => (isPending ? "opacity-50" : "")}
>
  Products
</Nav.Link>
```

### The initial-load gap

On the very first page load there's no previous UI to keep on screen — the router runs the root loaders against a blank page. Give it something to show with `HydrateFallback` on the root route:

```jsx
// src/router.jsx
{
  path: "/",
  Component: RootLayout,
  HydrateFallback: AppBootSplash,     // only for the FIRST load, not later navigations
  children: [ … ],
}
```

```jsx
// src/routes/AppBootSplash.jsx
import { Container, Spinner } from "react-bootstrap"

export function AppBootSplash() {
  return (
    <Container className="py-5 text-center">
      <Spinner animation="border" />
      <p className="text-muted mt-3">Loading ShopScope…</p>
    </Container>
  )
}
```

> **Try it yourself:** add `?delay=2000` handling by temporarily passing `delay: 2000` in `listProducts`. Click between Products and a detail page: the progress bar appears, the old content dims, and the new page swaps in complete. Compare that with the `useEffect` version's empty-skeleton flash. Same latency, very different feel.

---

# 28. Actions & `<Form>`

Loaders read; **actions write**. An action is the mutation half of a route:

```jsx
{
  path: "products/new",
  Component: NewProductPage,
  action: async ({ request }) => {
    const formData = await request.formData()
    const created = await createProduct({
      title: formData.get("title"),
      price: Number(formData.get("price")),
    })
    return redirect(`/products/${created.id}`)
  },
}
```

And the component submits to it with the router's `<Form>`:

```jsx
import { Form } from "react-router"

<Form method="post">
  <input name="title" />
  <input name="price" type="number" />
  <button type="submit">Create</button>
</Form>
```

No `onSubmit`, no `preventDefault`, no `useState` per field, no `saving` flag. The router serialises the form, calls the action, and — this is the important part — **automatically re-runs every loader on the page afterwards**, so the list updates itself.

> **Name collision warning.** `Form` from `react-router` and `Form` from `react-bootstrap` are different components with the same name. Import one under an alias. This guide uses `Form as RouterForm` for the router's, keeping `Form` for Bootstrap's controls.

## Reading the result

```jsx
import { useActionData, useNavigation } from "react-router"

const actionData = useActionData()          // whatever the action returned
const navigation = useNavigation()
const submitting = navigation.state === "submitting"
```

Return validation errors from the action instead of throwing — thrown values go to the error boundary and blow away the form:

```js
export async function action({ request }) {
  const formData = await request.formData()
  const title = String(formData.get("title") ?? "").trim()

  const errors = {}
  if (title.length < 2) errors.title = "Give it a name of at least 2 characters."
  if (Object.keys(errors).length) return { errors, values: { title } }   // ← return

  // …
}
```

**Return for expected failures, throw for unexpected ones.** Validation is expected. A 500 is not.

## Programmatic submission

`useSubmit` submits without a form element — for an auto-submitting filter bar, or a confirm dialog:

```jsx
const submit = useSubmit()
submit({ id: product.id }, { method: "post", action: "/account/products" })
submit(formElement, { method: "post" })
```

## 🔨 Build Step 25 — Create products with an action

Create **`src/routes/ManageProductsPage.jsx`**:

```jsx
import { Alert, Button, Card, Col, Form, Row, Spinner, Table } from "react-bootstrap"
import {
  Form as RouterForm,
  Link,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "react-router"
import { createProduct, listProducts, listCategories } from "../api/services/products"
import { ApiError } from "../lib/ApiError"

export async function manageProductsLoader({ request }) {
  const [result, categories] = await Promise.all([
    listProducts({ limit: 10, page: 0, signal: request.signal }),
    listCategories({ signal: request.signal }),
  ])
  return { products: result.products, categories }
}

export async function manageProductsAction({ request }) {
  const formData = await request.formData()

  const values = {
    title: String(formData.get("title") ?? "").trim(),
    price: String(formData.get("price") ?? ""),
    category: String(formData.get("category") ?? "beauty"),
  }

  // --- Validation: RETURN errors, don't throw. Throwing loses the form. ---
  const errors = {}
  if (values.title.length < 2) errors.title = "At least 2 characters."
  if (!(Number(values.price) > 0)) errors.price = "Must be more than zero."
  if (Object.keys(errors).length > 0) return { errors, values }

  try {
    const created = await createProduct({
      title: values.title,
      price: Number(values.price),
      category: values.category,
    })
    // A redirect from an action is the classic POST/Redirect/GET pattern:
    // it stops a browser refresh from re-submitting the form.
    //
    // Why not redirect to /products/${created.id}? Because DummyJSON only
    // SIMULATES the write — GET /products/195 would 404. Against a real API
    // that is exactly where you would send them.
    return redirect(`/account/products?created=${encodeURIComponent(created.title)}`)
  } catch (error) {
    // A server-side failure is still expected enough to keep the user on the
    // form — return it rather than throwing to the error boundary.
    const message = error instanceof ApiError ? error.message : "Couldn't save that."
    return { errors: { form: message }, values }
  }
}

export function ManageProductsPage() {
  const { products, categories } = useLoaderData()
  const actionData = useActionData()
  const navigation = useNavigation()
  const [searchParams] = useSearchParams()
  const created = searchParams.get("created")

  const submitting = navigation.state === "submitting"
  const errors = actionData?.errors ?? {}
  const values = actionData?.values ?? {}

  return (
    <>
      <h1 className="h4 mb-3">Manage products</h1>

      {created && (
        <Alert variant="success">
          “{created}” created. DummyJSON simulates writes, so it won't appear in the list below — the request,
          the response and the redirect were all real.
        </Alert>
      )}

      <Card className="mb-4">
        <Card.Header className="fw-semibold">Add a product</Card.Header>
        <Card.Body>
          <RouterForm method="post" replace>
            <Row className="g-2">
              <Col md={5}>
                <Form.Label htmlFor="title" className="small fw-semibold">Title</Form.Label>
                <Form.Control
                  id="title"
                  name="title"
                  defaultValue={values.title ?? ""}
                  isInvalid={!!errors.title}
                />
                <Form.Control.Feedback type="invalid">{errors.title}</Form.Control.Feedback>
              </Col>
              <Col md={3}>
                <Form.Label htmlFor="price" className="small fw-semibold">Price</Form.Label>
                <Form.Control
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  defaultValue={values.price ?? ""}
                  isInvalid={!!errors.price}
                />
                <Form.Control.Feedback type="invalid">{errors.price}</Form.Control.Feedback>
              </Col>
              <Col md={4}>
                <Form.Label htmlFor="category" className="small fw-semibold">Category</Form.Label>
                <Form.Select id="category" name="category" defaultValue={values.category ?? "beauty"}>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </Form.Select>
              </Col>
            </Row>

            {errors.form && <Alert variant="danger" className="mt-3 mb-0">{errors.form}</Alert>}

            <Button type="submit" className="mt-3" disabled={submitting}>
              {submitting && <Spinner as="span" size="sm" animation="border" className="me-2" />}
              {submitting ? "Saving…" : "Create product"}
            </Button>
          </RouterForm>
        </Card.Body>
      </Card>

      <Table hover responsive size="sm">
        <thead>
          <tr><th>#</th><th>Title</th><th className="text-end">Price</th></tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td className="text-muted">{p.id}</td>
              <td><Link to={`/products/${p.id}`}>{p.title}</Link></td>
              <td className="text-end">${p.price}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  )
}
```

Note **`defaultValue`, not `value`** — these are uncontrolled inputs. That's the point of `<Form>`: the DOM holds the state, the router reads it on submit, and you write no `onChange` handlers. On a validation failure the action returns `values` so the fields repopulate.

Register it in **`src/router.jsx`**:

```jsx
        children: [
          { index: true, Component: ProfilePage },
          {
            path: "products",
            Component: ManageProductsPage,
            loader: manageProductsLoader,
            action: manageProductsAction,
          },
        ],
```

> **Try it yourself:** submit with an empty title. The action returns errors, Bootstrap shows them under the fields, and your other input survives. Then submit something valid — you're redirected back to the manage page with `?created=…` in the URL and a success alert (a real API would let you redirect to the new product's own page; DummyJSON's simulated write means that page would 404, so we don't). Press back: the form is empty, not re-submitted, because `redirect` broke the POST out of the history entry. That's POST/Redirect/GET, and it's why the router pushes you toward it.

---

# 29. Fetchers: mutations without navigation

`<Form>` navigates. But plenty of mutations shouldn't: deleting a row, toggling a favourite, marking a todo done. You want the request, the pending state, and the automatic revalidation — but you want to stay on the page.

That's `useFetcher`:

```jsx
import { useFetcher } from "react-router"

function DeleteButton({ id }) {
  const fetcher = useFetcher()
  const deleting = fetcher.state !== "idle"

  return (
    <fetcher.Form method="post" action="/account/products">
      <input type="hidden" name="intent" value="delete" />
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="outline-danger" size="sm" disabled={deleting}>
        {deleting ? "Deleting…" : "Delete"}
      </Button>
    </fetcher.Form>
  )
}
```

| API | Does |
|---|---|
| `fetcher.Form` | A form that submits without navigating |
| `fetcher.submit(data, opts)` | Submit programmatically |
| `fetcher.load(href)` | Call a loader without navigating |
| `fetcher.state` | `"idle"` / `"submitting"` / `"loading"` |
| `fetcher.data` | Whatever the action returned |
| `fetcher.formData` | The in-flight submission — the key to optimistic UI |

**Each fetcher is independent.** Ten rows, ten `useFetcher()` calls, ten separate pending states — so deleting row 3 doesn't grey out rows 1 and 2. That's why the button above is its own component: one hook per row.

### The `intent` pattern

One route, one action, several operations. Discriminate on a hidden field:

```js
export async function action({ request }) {
  const formData = await request.formData()
  const intent = formData.get("intent")

  switch (intent) {
    case "create": return handleCreate(formData)
    case "delete": return handleDelete(formData)
    case "update": return handleUpdate(formData)
    default:
      throw data(`Unknown intent: ${intent}`, { status: 400 })
  }
}
```

This is the standard way to keep a route's mutations in one place instead of inventing `/products/delete` URLs that aren't really resources.

## 🔨 Build Step 26 — Delete rows with fetchers

Restructure the action in **`src/routes/ManageProductsPage.jsx`** around intents:

```jsx
import { createProduct, deleteProduct, listProducts, listCategories } from "../api/services/products"
import { data } from "react-router"

export async function manageProductsAction({ request }) {
  const formData = await request.formData()
  const intent = formData.get("intent")

  if (intent === "delete") {
    const id = formData.get("id")
    try {
      const removed = await deleteProduct(id)
      return { deleted: removed.title }
    } catch (error) {
      return { errors: { form: error.message } }
    }
  }

  if (intent === "create") {
    // …the validation + createProduct block from Build Step 25, unchanged…
  }

  throw data(`Unknown intent: ${intent}`, { status: 400 })
}
```

Add `<input type="hidden" name="intent" value="create" />` inside the create form.

Add the delete button as its own component in the same file:

```jsx
import { useFetcher } from "react-router"
import { Trash } from "react-bootstrap-icons"

function DeleteProductButton({ product }) {
  const fetcher = useFetcher()
  const deleting = fetcher.state !== "idle"

  return (
    <fetcher.Form method="post">
      <input type="hidden" name="intent" value="delete" />
      <input type="hidden" name="id" value={product.id} />
      <Button type="submit" size="sm" variant="outline-danger" disabled={deleting}>
        {deleting ? <Spinner as="span" size="sm" animation="border" /> : <Trash />}
      </Button>
    </fetcher.Form>
  )
}
```

A `fetcher.Form` with no `action` prop posts to the **closest route's** action — which is this route. Add the column:

```jsx
            <tr key={p.id}>
              <td className="text-muted">{p.id}</td>
              <td><Link to={`/products/${p.id}`}>{p.title}</Link></td>
              <td className="text-end">${p.price}</td>
              <td className="text-end"><DeleteProductButton product={p} /></td>
            </tr>
```

> **Try it yourself:** delete a row. The button spins, the request goes out, and **the table refreshes by itself** — because the router re-runs the route's loader after any action. You wrote no refetch logic. (The row comes back, of course: DummyJSON simulates deletes. Against a real API it would stay gone.)

---

# 30. Route error boundaries

Every `try/catch` we wrote in Part 3 existed because a component had nowhere else to put a failure. Routes do: throw, and the nearest `ErrorBoundary` renders **in place of that route**, with everything above it still on screen.

```jsx
{
  path: "products/:productId",
  Component: ProductDetailPage,
  loader: productDetailLoader,
  ErrorBoundary: ProductErrorBoundary,   // catches loader, action, AND render errors
}
```

```jsx
import { isRouteErrorResponse, useRouteError } from "react-router"

function ProductErrorBoundary() {
  const error = useRouteError()
  // …decide what to render
}
```

## The three kinds of thrown thing

`useRouteError()` returns whatever was thrown, and there are three cases you must handle:

```jsx
function RootErrorBoundary() {
  const error = useRouteError()

  // 1. A Response thrown with data()/redirect() — has status + statusText
  if (isRouteErrorResponse(error)) {
    return <p>{error.status} {error.statusText}: {error.data?.message}</p>
  }

  // 2. A real Error — our ApiError lands here
  if (error instanceof Error) {
    return <p>{error.message}</p>
  }

  // 3. Somebody threw a string, or undefined, or who knows
  return <p>Something went wrong.</p>
}
```

`isRouteErrorResponse` is the type guard. It's true only for things thrown via `data()` or a raw `Response` — which is exactly why our product loader converts a 404 `ApiError` into `throw data(…, { status: 404 })`: it makes the status a first-class part of the error, so the boundary can render a *specific* page instead of a generic one.

## Where to put them

**At least one on the root route** — otherwise any uncaught error blanks the entire app.

Then **one per route that can fail in an interesting way.** Nesting matters: an error boundary on the product route keeps the navbar and layout alive and swaps out only the page. Put it only on the root, and a missing product wipes the whole screen.

```
RootLayout            ErrorBoundary: RootErrorBoundary      ← the safety net
 └─ products/:id      ErrorBoundary: ProductErrorBoundary   ← specific, keeps chrome
```

> **Error boundaries catch *render* errors too**, not just loader failures. They're React error boundaries with routing awareness — which means they finally give you a home for the `<ErrorBoundary>` component you'd otherwise hand-write with a class component.

## 🔨 Build Step 27 — Boundaries at both levels

Create **`src/routes/RootErrorBoundary.jsx`**:

```jsx
import { Alert, Button, Container } from "react-bootstrap"
import { Link, isRouteErrorResponse, useRouteError } from "react-router"
import { env } from "../config/env"

export function RootErrorBoundary() {
  const error = useRouteError()

  let title = "Something went wrong"
  let message = "An unexpected error occurred. Please try again."
  let status

  if (isRouteErrorResponse(error)) {
    status = error.status
    title = error.status === 404 ? "Page not found" : `${error.status} ${error.statusText}`
    message = error.data?.message ?? message
  } else if (error instanceof Error) {
    message = error.message
    // Our ApiError carries these; a plain Error won't.
    status = error.status
  }

  return (
    <Container className="py-5">
      <Alert variant="danger">
        <Alert.Heading>{title}</Alert.Heading>
        <p>{message}</p>

        {env.isDev && error?.stack && (
          <pre className="small bg-body-secondary p-2 rounded mt-3 mb-0" style={{ maxHeight: 240 }}>
            {error.stack}
          </pre>
        )}

        <hr />
        <div className="d-flex gap-2">
          <Button as={Link} to="/products" variant="outline-danger">Back to products</Button>
          {(status === undefined || status >= 500) && (
            <Button variant="danger" onClick={() => window.location.reload()}>Reload</Button>
          )}
        </div>
      </Alert>
    </Container>
  )
}
```

Note it renders its own `Container` — an error in the root route's own loader means `RootLayout` never rendered, so there's no layout to sit inside.

Create **`src/routes/ProductErrorBoundary.jsx`** — scoped, so the navbar survives:

```jsx
import { Alert, Button } from "react-bootstrap"
import { Link, isRouteErrorResponse, useRouteError } from "react-router"

export function ProductErrorBoundary() {
  const error = useRouteError()

  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <Alert variant="warning">
        <Alert.Heading className="h5">Product not found</Alert.Heading>
        <p>{error.data?.message ?? "That product doesn't exist, or it was removed."}</p>
        <Button as={Link} to="/products" variant="outline-secondary">Browse all products</Button>
      </Alert>
    )
  }

  // Anything else — including our ApiError from a network failure.
  return (
    <Alert variant="danger">
      <Alert.Heading className="h5">Couldn't load this product</Alert.Heading>
      <p>{error?.message ?? "Please try again."}</p>
      <Button variant="outline-danger" onClick={() => window.location.reload()}>Retry</Button>
    </Alert>
  )
}
```

Wire both into **`src/router.jsx`**:

```jsx
export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    ErrorBoundary: RootErrorBoundary,
    HydrateFallback: AppBootSplash,
    children: [
      { index: true, loader: () => redirect("/products") },
      { path: "products", Component: ProductsPage, loader: productsLoader },
      {
        path: "products/:productId",
        Component: ProductDetailPage,
        loader: productDetailLoader,
        ErrorBoundary: ProductErrorBoundary,
      },
      { path: "*", Component: NotFoundPage },
    ],
  },
])
```

> **Try it yourself:** visit `/products/999999`. You get the scoped "Product not found" alert **with the navbar still there** — because the boundary sits on the product route. Now delete `ErrorBoundary: ProductErrorBoundary` and reload: the root boundary takes over and the whole app is replaced. That difference is the entire argument for putting boundaries close to the routes that can fail.
>
> For the other branch, set `VITE_API_BASE_URL=https://localhost:9999` in `.env.local` and reload — a network `ApiError`, no `status`, and the generic branch renders.

---

# 31. Protected routes — three ways

A protected route answers one question: **can this person see this page?** There are three places to answer it, and they are not equivalent.

## Option A — A guard component

The v6-era approach. A wrapper that checks and redirects during render:

```jsx
import { Navigate, Outlet, useLocation } from "react-router"

function RequireAuth() {
  const location = useLocation()
  if (!tokenStore.isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return <Outlet />
}

// in the route tree:
{ Component: RequireAuth, children: [ /* protected routes */ ] }
```

**Works, but it's the weakest option.** The protected route's loaders have *already run* by the time this renders — you've fired authenticated requests you knew would 401. It also flashes: React must render before it can redirect.

Use it when you're migrating from v6 and don't want to restructure yet.

## Option B — A loader guard

Check before the data loads, in the loader itself:

```js
export async function accountLoader({ request }) {
  if (!tokenStore.isAuthenticated()) {
    const url = new URL(request.url)
    throw redirect(`/login?redirectTo=${encodeURIComponent(url.pathname + url.search)}`)
  }
  return getMe({ signal: request.signal })
}
```

**Better:** it runs before render, so no flash and no wasted requests for *that* route. The catch is repetition — every protected route needs the check, and the one you forget is the security hole.

## Option C — Middleware ← the v8 way

Middleware runs before **all** loaders and actions in a route subtree, parent to child. Put it on a layout route and everything beneath it is protected, including routes you add next year.

```jsx
import { createContext, redirect } from "react-router"

export const userContext = createContext(null)

async function authMiddleware({ request, context }) {
  if (!tokenStore.isAuthenticated()) {
    const url = new URL(request.url)
    throw redirect(`/login?redirectTo=${encodeURIComponent(url.pathname + url.search)}`)
  }
  context.set(userContext, await getMe())
}

// one line protects the whole subtree:
{ path: "account", middleware: [authMiddleware], Component: AccountLayout, children: [ … ] }
```

Then any loader below reads the user without re-fetching it:

```js
export async function someLoader({ context }) {
  const user = context.get(userContext)
  // …
}
```

**This is the right answer in v8.** It's declarative, it can't be forgotten on a new child route, it runs before any data loads, and it gives every loader below a typed handle on the current user.

> **`createContext` here is React Router's, not React's.** Same name, different import, completely different mechanism — it's a typed key for the middleware `context`, not a React provider. Import it from `react-router`.

### Middleware anatomy

```js
async function middleware({ request, params, context }, next) {
  // before loaders/actions
  await next()      // optional — runs the rest of the chain
  // after
}
```

Omit `next` entirely and the chain continues automatically after your function resolves — which is what a guard wants. Call `next()` when you need to wrap the whole navigation, like timing it:

```js
async function timingMiddleware({ request }, next) {
  const start = performance.now()
  await next()
  logger.debug(`navigation took ${Math.round(performance.now() - start)}ms`)
}
```

On the client there's no `Response` to return, so ignore what `next()` resolves to.

## 🔨 Build Step 28 — Protect `/account`

Create **`src/routes/middleware.js`**:

```js
import { createContext, data, redirect } from "react-router"
import { tokenStore } from "../lib/tokenStore"
import { getMe } from "../api/services/auth"
import { logger } from "../config/logger"

/**
 * Typed handle for the current user. Set by authMiddleware, read by any
 * loader or action below it via context.get(userContext).
 *
 * NOTE: this is React Router's createContext, not React's.
 */
export const userContext = createContext(null)

/**
 * Guards a whole route subtree. Runs before every loader and action beneath
 * it, so no child route can accidentally skip the check.
 */
export async function authMiddleware({ request, context }) {
  if (!tokenStore.isAuthenticated()) {
    const url = new URL(request.url)
    const redirectTo = url.pathname + url.search
    throw redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`)
  }

  // The login response is a subset of the user record — it has no `role`.
  // Fetch the full profile once per navigation and share it downward.
  let user = context.get(userContext)
  if (!user) {
    try {
      user = await getMe({ signal: request.signal })
    } catch (error) {
      // A 401 here means the token is dead and refresh already failed (§20).
      tokenStore.clear()
      throw redirect("/login?expired=1")
    }
  }

  context.set(userContext, user)
}

/** Factory: build a middleware that requires one of the given roles. */
export function requireRole(...allowed) {
  return async function roleMiddleware({ context }) {
    const user = context.get(userContext)
    if (!user || !allowed.includes(user.role)) {
      logger.warn(`[auth] role denied: ${user?.role ?? "anonymous"} needs ${allowed.join("|")}`)
      throw data(
        { message: `This area needs the ${allowed.join(" or ")} role. You're signed in as ${user?.role ?? "a guest"}.` },
        { status: 403, statusText: "Forbidden" }
      )
    }
  }
}

/** Logs every navigation and how long it took. Attach to the root route. */
export async function timingMiddleware({ request }, next) {
  const start = performance.now()
  await next()
  logger.debug(`[nav] ${new URL(request.url).pathname} in ${Math.round(performance.now() - start)}ms`)
}
```

Create **`src/routes/ProfilePage.jsx`**, which reads the user straight from context — no fetch of its own:

```jsx
import { Card, Col, Image, Row } from "react-bootstrap"
import { useLoaderData } from "react-router"
import { userContext } from "./middleware"

export async function profileLoader({ context }) {
  // authMiddleware already fetched and validated this. No second request.
  return { user: context.get(userContext) }
}

export function ProfilePage() {
  const { user } = useLoaderData()

  return (
    <Card>
      <Card.Body>
        <Row className="align-items-center g-3">
          <Col xs="auto">
            <Image src={user.image} roundedCircle width={72} height={72} alt="" className="bg-body-secondary" />
          </Col>
          <Col>
            <h2 className="h5 mb-1">{user.firstName} {user.lastName}</h2>
            <div className="text-muted">{user.email}</div>
            <span className="badge text-bg-secondary text-capitalize mt-2">{user.role}</span>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  )
}
```

Wire the middleware into **`src/router.jsx`**:

```jsx
import { authMiddleware, requireRole, timingMiddleware } from "./routes/middleware"

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    ErrorBoundary: RootErrorBoundary,
    HydrateFallback: AppBootSplash,
    middleware: [timingMiddleware],          // runs for every navigation
    children: [
      { index: true, loader: () => redirect("/products") },
      { path: "products", Component: ProductsPage, loader: productsLoader },
      {
        path: "products/:productId",
        Component: ProductDetailPage,
        loader: productDetailLoader,
        ErrorBoundary: ProductErrorBoundary,
      },
      { path: "login", Component: LoginPage, action: loginAction, loader: loginLoader },
      {
        path: "account",
        Component: AccountLayout,
        middleware: [authMiddleware],        // ← protects everything below
        ErrorBoundary: RootErrorBoundary,
        children: [
          { index: true, Component: ProfilePage, loader: profileLoader },
          {
            path: "products",
            Component: ManageProductsPage,
            middleware: [requireRole("admin")],   // ← and this one needs admin
            loader: manageProductsLoader,
            action: manageProductsAction,
          },
        ],
      },
      { path: "*", Component: NotFoundPage },
    ],
  },
])
```

Read the middleware chain for `/account/products`: `timingMiddleware` → `authMiddleware` → `requireRole("admin")` → then the loaders. Each one can stop the navigation by throwing. That's the whole protected-routes story in three lines of route config.

> **The `login` route above is a forward reference.** `LoginPage`, `loginLoader`, and `loginAction` don't exist until the next build step, so the app won't compile with that line in place. Either comment it out for now, or jump ahead and create `src/routes/LoginPage.jsx` first — it's self-contained. I've included it here so the route tree is shown once, complete, rather than in two halves.

---

# 32. Login, `redirectTo` & revalidation

A login page has one job beyond authenticating: **send the user back where they were going.** Bouncing them to the home page after login is a small cruelty that's easy to avoid.

The pieces:

1. The guard captures the attempted URL: `redirect("/login?redirectTo=" + encodeURIComponent(here))`.
2. The login action reads it back and redirects there on success.
3. Already-authenticated visitors to `/login` get bounced away.

**One security note that matters:** never redirect to a URL from a query param without checking it. `?redirectTo=https://evil.example` turns your login page into an open redirect — a real phishing vector. Allow same-origin paths only.

## 🔨 Build Step 29 — The login route

Create **`src/routes/LoginPage.jsx`**:

```jsx
import { Alert, Button, Card, Col, Form, Row, Spinner } from "react-bootstrap"
import {
  Form as RouterForm,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "react-router"
import { login } from "../api/services/auth"
import { tokenStore } from "../lib/tokenStore"
import { ApiError } from "../lib/ApiError"

/** Only same-origin paths. Anything else is an open-redirect attempt. */
function safeRedirect(target, fallback = "/account") {
  if (!target || typeof target !== "string") return fallback
  if (!target.startsWith("/") || target.startsWith("//")) return fallback
  return target
}

export async function loginLoader({ request }) {
  const url = new URL(request.url)

  // Already signed in? Don't show the form.
  if (tokenStore.isAuthenticated()) {
    throw redirect(safeRedirect(url.searchParams.get("redirectTo")))
  }

  return { expired: url.searchParams.get("expired") === "1" }
}

export async function loginAction({ request }) {
  const formData = await request.formData()
  const username = String(formData.get("username") ?? "").trim()
  const password = String(formData.get("password") ?? "")
  const redirectTo = safeRedirect(formData.get("redirectTo"))

  if (!username || !password) {
    return { error: "Enter both a username and a password.", username }
  }

  try {
    await login({ username, password })
  } catch (error) {
    // Wrong credentials are expected — return, don't throw.
    const message = error instanceof ApiError ? error.message : "Sign-in failed."
    return { error: message, username }
  }

  return redirect(redirectTo)
}

export function LoginPage() {
  const { expired } = useLoaderData()
  const actionData = useActionData()
  const navigation = useNavigation()
  const [searchParams] = useSearchParams()

  const submitting = navigation.state === "submitting"
  const redirectTo = searchParams.get("redirectTo") ?? ""

  return (
    <Row className="justify-content-center">
      <Col md={6} lg={5}>
        <Card>
          <Card.Body>
            <h1 className="h4 mb-3">Sign in</h1>

            {expired && (
              <Alert variant="warning" className="py-2">
                Your session expired. Please sign in again.
              </Alert>
            )}
            {redirectTo && !expired && (
              <Alert variant="info" className="py-2">
                Sign in to continue to <code>{redirectTo}</code>.
              </Alert>
            )}

            <RouterForm method="post" replace>
              {/* Carry the destination through the POST */}
              <input type="hidden" name="redirectTo" value={redirectTo} />

              <Form.Group className="mb-3" controlId="username">
                <Form.Label className="small fw-semibold">Username</Form.Label>
                <Form.Control
                  name="username"
                  autoComplete="username"
                  defaultValue={actionData?.username ?? "emilys"}
                  isInvalid={!!actionData?.error}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="password">
                <Form.Label className="small fw-semibold">Password</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  defaultValue="emilyspass"
                  isInvalid={!!actionData?.error}
                  required
                />
                <Form.Control.Feedback type="invalid">{actionData?.error}</Form.Control.Feedback>
              </Form.Group>

              <Button type="submit" className="w-100" disabled={submitting}>
                {submitting && <Spinner as="span" size="sm" animation="border" className="me-2" />}
                {submitting ? "Signing in…" : "Sign in"}
              </Button>
            </RouterForm>

            <hr />
            <p className="small text-muted mb-0">
              Try <code>emilys</code> / <code>emilyspass</code> (admin) or{" "}
              <code>averyp</code> / <code>averyppass</code> (regular user).
            </p>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  )
}
```

## Keeping the navbar in sync

The navbar needs to know who's signed in. It could read `tokenStore` directly, but then it wouldn't re-render when that changes. Two clean options:

**A root loader** — the router re-runs it after every action, so login and logout update it automatically:

```js
// src/routes/RootLayout.jsx
export function rootLoader() {
  return { user: tokenStore.getUser() }
}
```

**`useRevalidator`** for changes the router can't see — like the interceptor clearing tokens after a failed refresh:

```jsx
import { useRevalidator } from "react-router"

const revalidator = useRevalidator()
// revalidator.revalidate()  → re-runs every loader on the page
// revalidator.state         → "idle" | "loading"
```

Add both to **`src/routes/RootLayout.jsx`**:

```jsx
import { useEffect } from "react"
import { Button, Container, Image, Nav, Navbar, ProgressBar } from "react-bootstrap"
import {
  Link, NavLink, Outlet, ScrollRestoration,
  useLoaderData, useNavigate, useNavigation, useRevalidator,
} from "react-router"
import { logout } from "../api/services/auth"
import { AUTH_CHANGED, tokenStore } from "../lib/tokenStore"

export function rootLoader() {
  return { user: tokenStore.getUser() }
}

export function RootLayout() {
  const { user } = useLoaderData()
  const navigation = useNavigation()
  const revalidator = useRevalidator()
  const navigate = useNavigate()
  const busy = navigation.state !== "idle"

  // The API layer clears tokens on a failed refresh (§20). The router can't
  // see that, so we listen for the event and re-run the loaders.
  useEffect(() => {
    function onAuthChanged() {
      revalidator.revalidate()
    }
    window.addEventListener(AUTH_CHANGED, onAuthChanged)
    return () => window.removeEventListener(AUTH_CHANGED, onAuthChanged)
  }, [revalidator])

  function handleSignOut() {
    logout()                       // clears storage, fires AUTH_CHANGED
    navigate("/products")
  }

  return (
    <>
      <Navbar bg="dark" data-bs-theme="dark" expand="md">
        <Container>
          <Navbar.Brand as={Link} to="/">ShopScope</Navbar.Brand>
          <Navbar.Toggle aria-controls="main-nav" />
          <Navbar.Collapse id="main-nav">
            <Nav className="me-auto">
              <Nav.Link as={NavLink} to="/products" end>Products</Nav.Link>
              {user && <Nav.Link as={NavLink} to="/account">Account</Nav.Link>}
            </Nav>
            <Nav className="align-items-center gap-2">
              {user ? (
                <>
                  <Image src={user.image} roundedCircle width={28} height={28} alt="" />
                  <span className="text-light small">{user.firstName}</span>
                  <Button size="sm" variant="outline-light" onClick={handleSignOut}>Sign out</Button>
                </>
              ) : (
                <Button as={Link} to="/login" size="sm" variant="outline-light">Sign in</Button>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <div style={{ height: 3 }}>
        {busy && <ProgressBar now={100} animated striped style={{ height: 3, borderRadius: 0 }} aria-label="Loading" />}
      </div>

      <Container className="py-4">
        <div className={busy ? "opacity-50" : ""} style={{ transition: "opacity .15s" }}>
          <Outlet />
        </div>
      </Container>

      <ScrollRestoration />
    </>
  )
}
```

Add `loader: rootLoader` to the root route in **`src/router.jsx`**.

> **Try it yourself — the full loop:**
> 1. Signed out, click **Account**. You land on `/login?redirectTo=%2Faccount`, with a message explaining why.
> 2. Sign in as `emilys` / `emilyspass`. You go straight to `/account`, not the home page.
> 3. The navbar updates without a reload — that's the root loader re-running after the action.
> 4. Sign out, then paste `/account/products` into the address bar. Bounced to login, with `redirectTo` preserved.
> 5. Now try `?redirectTo=https://example.com`. After login you land on `/account` — `safeRedirect` refused it. Delete that guard and you've built an open redirect.

---

# 33. Roles & permission-gated routes

Authentication is *who you are*. Authorisation is *what you may do*. Conflating them is how a regular user ends up on an admin page.

`requireRole("admin")` from Build Step 28 throws a 403 `data()` response, which the nearest `ErrorBoundary` renders. That's the route-level half. The UI half is: **don't show links to places the user can't go.**

```jsx
{user?.role === "admin" && (
  <Nav.Link as={NavLink} to="/account/products">Manage products</Nav.Link>
)}
```

**Both halves are required, and they are not redundant.** Hiding the link is UX — it stops honest users hitting a wall. The middleware is security — it stops anyone who types the URL. A hidden link is not access control; anything enforced only in the browser is a suggestion.

> **And the real enforcement is on the server.** Everything in this section is UX for a decision your backend must also make. A determined user can edit your JavaScript. They cannot edit your API's authorisation check.

## 🔨 Build Step 30 — Role-aware UI

Update **`src/routes/AccountLayout.jsx`** to load the user and gate the link:

```jsx
import { Card, Col, Nav, Row } from "react-bootstrap"
import { NavLink, Outlet, useLoaderData } from "react-router"
import { userContext } from "./middleware"

export async function accountLoader({ context }) {
  return { user: context.get(userContext) }
}

export function AccountLayout() {
  const { user } = useLoaderData()
  const isAdmin = user?.role === "admin"

  return (
    <Row className="g-4">
      <Col md={3}>
        <Card>
          <Card.Header className="fw-semibold text-capitalize">
            {user.firstName} · {user.role}
          </Card.Header>
          <Nav className="flex-column p-2">
            <Nav.Link as={NavLink} to="/account" end>Profile</Nav.Link>
            {isAdmin && (
              <Nav.Link as={NavLink} to="/account/products">Manage products</Nav.Link>
            )}
          </Nav>
        </Card>
      </Col>
      <Col md={9}>
        <Outlet />
      </Col>
    </Row>
  )
}
```

Add `loader: accountLoader` to the `account` route.

Give the 403 a decent page — add a branch to **`src/routes/RootErrorBoundary.jsx`**, before the generic one:

```jsx
  if (isRouteErrorResponse(error) && error.status === 403) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          <Alert.Heading>Not allowed</Alert.Heading>
          <p>{error.data?.message}</p>
          <Button as={Link} to="/account" variant="outline-secondary">Back to your account</Button>
        </Alert>
      </Container>
    )
  }
```

> **Try it yourself:** sign in as `averyp` / `averyppass` — a regular `user`. The "Manage products" link is gone from the sidebar. Now type `/account/products` into the address bar: `requireRole("admin")` throws, and you get the 403 page. Sign in as `emilys` (admin) and both work. Two layers, one bypassable and one not — which is exactly the point.

---

# 34. Lazy routes & code splitting

Every route in `router.jsx` is imported at the top, so every page's code is in the initial bundle — including the admin pages that 99% of visitors never open.

`lazy` fixes it:

```jsx
{
  path: "account",
  lazy: async () => {
    const { AccountLayout, accountLoader } = await import("./routes/AccountLayout")
    return { Component: AccountLayout, loader: accountLoader }
  },
  children: [ … ],
}
```

The route's `path` stays eager — the router needs it to match — while `Component`, `loader`, `action`, and `ErrorBoundary` load on demand. Crucially, **the router loads the module and runs the loader in parallel**, so lazy routes don't add a waterfall the way `React.lazy` + `Suspense` does.

What can and can't be lazy:

| Eager (needed to match) | Lazy (needed to render) |
|---|---|
| `path`, `index`, `id`, `children`, `caseSensitive` | `Component`, `loader`, `action`, `ErrorBoundary`, `HydrateFallback`, `shouldRevalidate`, `handle` |

> **`middleware` should stay eager.** A guard that has to be downloaded before it can run is a guard with a gap. Import it directly.

## 🔨 Build Step 31 — Split the account section

Update **`src/router.jsx`**:

```jsx
      {
        path: "account",
        middleware: [authMiddleware],      // eager: security shouldn't wait on a download
        ErrorBoundary: RootErrorBoundary,
        lazy: async () => {
          const { AccountLayout, accountLoader } = await import("./routes/AccountLayout")
          return { Component: AccountLayout, loader: accountLoader }
        },
        children: [
          {
            index: true,
            lazy: async () => {
              const { ProfilePage, profileLoader } = await import("./routes/ProfilePage")
              return { Component: ProfilePage, loader: profileLoader }
            },
          },
          {
            path: "products",
            middleware: [requireRole("admin")],
            lazy: async () => {
              const m = await import("./routes/ManageProductsPage")
              return {
                Component: m.ManageProductsPage,
                loader: m.manageProductsLoader,
                action: m.manageProductsAction,
              }
            },
          },
        ],
      },
```

> **Try it yourself:** `npm run build` and compare the chunk list before and after. Then run `npm run preview`, open the Network tab filtered to JS, and click **Account** — a new chunk downloads at that moment. Split at route boundaries first; it's the highest-value code splitting available, and it's nearly free.

---

# 35. The rest of the router toolkit

Short sections on the remaining APIs you'll reach for. Each is a few lines, and each solves a problem people otherwise hand-roll badly.

## `ScrollRestoration`

```jsx
<ScrollRestoration />
```

One element in the root layout. Restores scroll position on back/forward, resets to top on new navigations — the behaviour browsers give you for free with real page loads and that SPAs break by default. Already in our `RootLayout`.

Opt out per link with `<Link preventScrollReset>`, useful for tab strips and pagination inside a long page.

## `useBlocker` — stop them losing work

```jsx
import { useBlocker } from "react-router"

const blocker = useBlocker(
  ({ currentLocation, nextLocation }) =>
    isDirty && currentLocation.pathname !== nextLocation.pathname
)

<Modal show={blocker.state === "blocked"} onHide={() => blocker.reset()}>
  <Modal.Header closeButton><Modal.Title className="h6">Discard changes?</Modal.Title></Modal.Header>
  <Modal.Body>You have unsaved edits. Leaving now will lose them.</Modal.Body>
  <Modal.Footer>
    <Button variant="outline-secondary" onClick={() => blocker.reset()}>Keep editing</Button>
    <Button variant="danger" onClick={() => blocker.proceed()}>Discard</Button>
  </Modal.Footer>
</Modal>
```

`blocker.state` is `"unblocked"` / `"blocked"` / `"proceeding"`. This only catches **in-app** navigation; closing the tab needs a `beforeunload` listener as well.

## `useMatches` + `handle` — breadcrumbs

Attach arbitrary metadata to a route and read the whole matched chain:

```jsx
{ path: "products", Component: ProductsPage, handle: { crumb: () => "Products" } }
{ path: "products/:productId", handle: { crumb: (data) => data?.title ?? "Product" } }
```

```jsx
import { Breadcrumb } from "react-bootstrap"
import { Link, useMatches } from "react-router"

function Breadcrumbs() {
  const matches = useMatches().filter((m) => m.handle?.crumb)

  return (
    <Breadcrumb>
      {matches.map((match, i) => {
        const label = match.handle.crumb(match.data)
        const last = i === matches.length - 1
        return last ? (
          <Breadcrumb.Item key={match.id} active>{label}</Breadcrumb.Item>
        ) : (
          <Breadcrumb.Item key={match.id} linkAs={Link} linkProps={{ to: match.pathname }}>
            {label}
          </Breadcrumb.Item>
        )
      })}
    </Breadcrumb>
  )
}
```

Note `linkAs`/`linkProps` — React Bootstrap's `Breadcrumb.Item` renders its own anchor, so that's how you hand it a router `Link`.

`match.data` is that route's loader data, so a breadcrumb can say "iPhone 5s" instead of "42" without fetching anything.

## `shouldRevalidate` — stop unnecessary refetching

Loaders re-run on every search-param change. For a route whose data doesn't depend on them, that's waste:

```jsx
{
  path: "products",
  loader: productsLoader,
  shouldRevalidate: ({ currentUrl, nextUrl }) =>
    currentUrl.search !== nextUrl.search,     // only when filters actually change
}
```

Define it and you take over completely — the default behaviour no longer applies, so be sure you've covered the cases that should refetch.

## Other routers

```js
createBrowserRouter(routes)   // clean URLs — needs server rewrite config
createHashRouter(routes)      // /#/products — static hosts with no rewrite support
createMemoryRouter(routes, { initialEntries: ["/products"] })   // tests, RN, Storybook
```

`createMemoryRouter` is what you'll use in tests (see [§42](#42-testing--mocking-http)).

> **Deploying a `BrowserRouter` SPA:** the server must return `index.html` for any unmatched path, or a refresh on `/products/42` is a real 404. Netlify: a `_redirects` file with `/* /index.html 200`. Vercel: a rewrite in `vercel.json`. Nginx: `try_files $uri /index.html`. This catches everyone once.

## Navigation odds and ends

```jsx
useLocation()            // { pathname, search, hash, state, key }
useHref("/products")     // resolve a route path to an href
useNavigationType()      // "POP" | "PUSH" | "REPLACE"
generatePath("/products/:id", { id: 42 })     // "/products/42", encoded
matchPath("/products/:id", "/products/42")    // { params: { id: "42" } } or null
redirectDocument("/legacy")                   // full document load, not client-side
replace("/products")                          // like redirect(), but replaces history
```

`generatePath` is the safe way to build a URL from a pattern — it encodes params, so you never hand-concatenate a path again.

---

# Part 6 — Advanced HTTP

# 36. Optimistic updates

Deleting a row today means: click → spinner → 400 ms → gone. **Optimistic** means: click → gone → (quietly confirm) → put it back if the server disagrees.

## By hand

```jsx
async function deleteOptimistic(product) {
  const snapshot = products                                    // 1. remember
  setProducts((cur) => cur.filter((p) => p.id !== product.id)) // 2. apply now

  try {
    await deleteProduct(product.id)                            // 3. confirm
  } catch (err) {
    setProducts(snapshot)                                      // 4. roll back
    setFlash(`Couldn't delete ${product.title}. Restored.`)
  }
}
```

Four steps: **snapshot, apply, confirm, roll back.** Skip the snapshot and you cannot undo.

## With a fetcher — no snapshot needed

This is where fetchers earn their place. `fetcher.formData` holds the in-flight submission, so you can derive the optimistic UI from it and let the router handle reverting:

```jsx
function ProductRow({ product }) {
  const fetcher = useFetcher()

  // While this row's delete is in flight, render it as gone.
  const deleting = fetcher.formData?.get("intent") === "delete"
  if (deleting) return null

  return <tr>{/* … */}</tr>
}
```

**No snapshot, no rollback code.** If the action fails, the fetcher goes idle, `fetcher.formData` becomes `undefined`, and the row reappears on its own — because the UI was a *function* of the fetcher state, not a copy of it mutated ahead of time. This is the single strongest argument for fetchers over hand-rolled mutation state.

## When to be optimistic

**Right:** high-probability, low-stakes, reversible. Toggling a like. Marking done. Reordering. Deleting from a list.

**Wrong:** payments; anything where the server computes what you're about to display (a new id, a total, a tax figure); anything where a silent rollback confuses more than a spinner. If you can't render the outcome without the server's answer, wait for the server's answer.

**Rollback must be visible.** An item that silently reappears looks like a bug. Say what happened.

## 🔨 Build Step 32 — Optimistic delete

In **`src/routes/ManageProductsPage.jsx`**, pull each row into its own component so each gets its own fetcher:

```jsx
function ProductRow({ product }) {
  const fetcher = useFetcher()
  const deleting = fetcher.formData?.get("intent") === "delete"

  // Optimistic: the row disappears the instant you click, and comes back
  // by itself if the action fails. No snapshot, no rollback branch.
  if (deleting) return null

  return (
    <tr>
      <td className="text-muted">{product.id}</td>
      <td><Link to={`/products/${product.id}`}>{product.title}</Link></td>
      <td className="text-end">${product.price}</td>
      <td className="text-end">
        <fetcher.Form method="post">
          <input type="hidden" name="intent" value="delete" />
          <input type="hidden" name="id" value={product.id} />
          <Button type="submit" size="sm" variant="outline-danger" aria-label={`Delete ${product.title}`}>
            <Trash />
          </Button>
        </fetcher.Form>
      </td>
    </tr>
  )
}
```

Then the table body is just `{products.map((p) => <ProductRow key={p.id} product={p} />)}`.

> **Try it yourself:** throttle to Slow 3G and delete a row — it vanishes instantly. Now break it: change the action's `deleteProduct(id)` to `deleteProduct(999999)`. The row vanishes, the action fails, and the row **comes back on its own**. You wrote no rollback code. Compare that with the four-step manual version and the difference in what you can get wrong is obvious.

---

# 37. Upload & download progress

## Uploads

Files go up as `multipart/form-data`, which means `FormData`:

```js
const form = new FormData()
form.append("file", file)              // from <input type="file">
form.append("productId", "101")        // other fields ride along

await uploadApi.post("/upload", form, {
  onUploadProgress: (event) => {
    if (!event.total) return           // unknown for chunked bodies
    setProgress(Math.round((event.loaded / event.total) * 100))
  },
})
```

**Do not set `Content-Type` yourself.** The header must include a generated boundary (`multipart/form-data; boundary=----WebKitFormBoundary…`). The browser knows it; you don't. Setting it manually is the most common upload bug there is — which is exactly why `uploadApi` in our `client.js` sets `"Content-Type": undefined`, clearing the JSON default so the browser can fill it in.

Other upload settings that matter:

```js
{
  timeout: 0,                          // a 10s timeout kills a large upload
  signal: controller.signal,           // give the user a Cancel button
}
```

`event.loaded === event.total` means **the bytes left the browser**, not that the server is done. There's usually a pause at 100% while it processes — label that "Processing…" rather than leaving a full bar looking stuck.

## Downloads

```js
const response = await api.get(`/reports/${id}`, {
  responseType: "blob",
  onDownloadProgress: (e) => { … },
})

const url = URL.createObjectURL(response.data)
const link = document.createElement("a")
link.href = url
link.download = "report.pdf"
link.click()
URL.revokeObjectURL(url)               // free the memory — easy to forget
```

`onDownloadProgress` can only report a percentage if the server sends `Content-Length`. With `Transfer-Encoding: chunked`, `event.total` is `0` and you can only show bytes received.

## 🔨 Build Step 33 — Upload with progress

DummyJSON has no upload endpoint, so we post to `https://httpbin.org/post`, which echoes back what it receives — ideal for seeing exactly what your request looked like.

Create **`src/components/Uploader.jsx`**:

```jsx
import { useRef, useState } from "react"
import axios from "axios"
import { Button, Card, Form, ProgressBar, Stack } from "react-bootstrap"
import { CloudArrowUp } from "react-bootstrap-icons"
import { env } from "../config/env"
import { ApiError } from "../lib/ApiError"
import { ErrorNotice } from "./ErrorNotice"

export function Uploader() {
  const [file, setFile] = useState(null)
  const [progress, setProgress] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const controllerRef = useRef(null)

  if (!env.features.uploads) return null      // feature flag from Part 1

  async function handleUpload() {
    if (!file) return

    const form = new FormData()
    form.append("file", file, file.name)
    form.append("uploadedBy", "shopscope")

    const controller = new AbortController()
    controllerRef.current = controller

    try {
      setError(null)
      setResult(null)
      setProgress(0)

      // A one-off call, not our `api` instance: different host, no timeout,
      // and we must NOT send the instance's JSON Content-Type.
      const { data } = await axios.post("https://httpbin.org/post", form, {
        signal: controller.signal,
        timeout: 0,
        onUploadProgress: (event) => {
          if (!event.total) return
          setProgress(Math.round((event.loaded / event.total) * 100))
        },
      })

      setResult({ size: file.size, fields: Object.keys(data.form ?? {}) })
    } catch (err) {
      if (!axios.isCancel(err)) setError(ApiError.from(err))
    } finally {
      setProgress(null)
      controllerRef.current = null
    }
  }

  const uploading = progress !== null

  return (
    <Card className="mb-4">
      <Card.Header className="fw-semibold">Upload a product image</Card.Header>
      <Card.Body>
        <Stack gap={3}>
          <Stack direction="horizontal" gap={2}>
            <Form.Control
              type="file"
              disabled={uploading}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <Button onClick={handleUpload} disabled={!file || uploading}>
              <CloudArrowUp className="me-1" /> Upload
            </Button>
            {uploading && (
              <Button variant="outline-secondary" onClick={() => controllerRef.current?.abort()}>
                Cancel
              </Button>
            )}
          </Stack>

          {uploading && (
            <ProgressBar
              now={progress}
              label={progress < 100 ? `${progress}%` : "Processing…"}
              animated={progress === 100}
              striped
            />
          )}

          <ErrorNotice error={error} />

          {result && (
            <div className="alert alert-success mb-0">
              Uploaded {(result.size / 1024).toFixed(1)} kB. httpbin echoed:{" "}
              {result.fields.join(", ") || "(binary part only)"}
            </div>
          )}
        </Stack>
      </Card.Body>
    </Card>
  )
}
```

Render `<Uploader />` at the top of `ManageProductsPage`. It renders nothing unless `VITE_FEATURE_UPLOADS=true` — which is on in development, off in production. That's the feature flag from Part 1 doing real work.

> **Try it yourself:** a small file finishes before you can read the bar. Use a 5–20 MB file with Slow 3G throttling — now the progress bar and Cancel button both mean something. Inspect the request: `Content-Type: multipart/form-data; boundary=…`, set by the browser, exactly as promised.

---

# 38. Timeouts & retries

## Timeouts

Rough guidance: **5–10 s** for normal API calls, **30–60 s** for reports and exports, **`0`** for uploads and downloads. Too short turns slow-network users into error-screen users; too long makes a dead backend look like a frozen app. Ours comes from `VITE_API_TIMEOUT_MS`, so each environment can differ.

## Retries

**Only retry what is safe to repeat.**

| Situation | Retry? |
|---|---|
| Network error (no response) | Yes |
| 408 Request Timeout, 429 Too Many Requests | Yes (respect `Retry-After` on 429) |
| 500, 502, 503, 504 | Yes for `GET`/`PUT`/`DELETE` — idempotent |
| Any other 4xx | **No** — repeating won't change the answer |
| A failed `POST` | **No**, unless the endpoint takes an idempotency key |

That last row matters: a `POST` that timed out may well have succeeded, with only the response lost. Retrying creates a duplicate order.

Our `ApiError.isRetryable` getter already encodes this for the UI's Retry button.

### The library

```bash
npm install axios-retry
```

```js
import axiosRetry from "axios-retry"

axiosRetry(api, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,          // ~1s, 2s, 4s + jitter
  retryCondition: (error) =>
    axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status === 429,
})
```

The default `retryCondition` already excludes `POST` and non-idempotent failures — a good reason to use the library rather than your own loop. **Install it before the error normaliser**, since it needs the raw axios error.

### By hand

```js
export async function withRetry(fn, { attempts = 3, baseDelay = 500 } = {}) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      const status = err.response?.status ?? err.status
      const retryable = !status || status === 429 || status >= 500
      const lastAttempt = attempt === attempts - 1

      if (axios.isCancel(err) || !retryable || lastAttempt) throw err

      // Exponential backoff + jitter. The jitter matters: without it, every
      // client that failed together retries together and re-floors the server.
      const delay = baseDelay * 2 ** attempt + Math.random() * 200
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
}
```

**Backoff with jitter is not a detail.** Fixed-interval retries from thousands of clients is a self-inflicted DDoS on a server that was already struggling.

Cap it at 2–3 attempts in a UI. Beyond that the user watches a spinner while you politely hammer a dead service — show the error and a Retry button, and let them decide.

---

# 39. Concurrency

## Sequential when dependent, parallel when not

```js
const user = await getMe()                    // dependent
const carts = await getCartsForUser(user.id)

const [products, categories] = await Promise.all([listProducts(), listCategories()])   // not
```

Route loaders make the parallel case automatic across nested routes — that's [§26](#26-loaders-data-before-render)'s "no waterfalls" row.

## Limiting parallelism

Firing 200 requests at once hits browser connection limits (6 per host on HTTP/1.1) and may trip server rate limits:

```js
export async function inBatches(items, size, worker) {
  const results = []
  for (let i = 0; i < items.length; i += size) {
    results.push(...(await Promise.all(items.slice(i, i + size).map(worker))))
  }
  return results
}

const products = await inBatches(ids, 5, (id) => getProduct(id))
```

## Deduplicating in-flight requests

Three components mount and all ask for the category list. One network call is enough:

```js
const inFlight = new Map()

export function dedupe(key, requestFn) {
  if (inFlight.has(key)) return inFlight.get(key)
  const promise = requestFn().finally(() => inFlight.delete(key))
  inFlight.set(key, promise)
  return promise
}
```

Same trick as the refresh queue in §20: **one shared promise, many awaiters.**

## Keeping only the latest response

Cancellation is the right tool. When you can't cancel, a sequence number works:

```js
const latest = useRef(0)

async function search(q) {
  const id = ++latest.current
  const data = await listProducts({ q })
  if (id !== latest.current) return    // a newer search started; drop this
  setResults(data.products)
}
```

If this section feels like rebuilding a library — it is. Which brings us to:

---

# Part 7 — Production

# 40. axios + TanStack Query

Route loaders solved a lot: no loading state, no waterfalls, automatic revalidation, automatic cancellation. What they don't do is **cache**. Navigate away and back, and the loader runs again.

For most apps that's fine. When it isn't, **TanStack Query** is the answer, and axios stays underneath as the transport. They're complements, not alternatives.

```bash
npm install @tanstack/react-query
```

```jsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 2 } },
})

createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>
)
```

Your service layer doesn't change at all — the payoff for having built one:

```jsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { listProducts, deleteProduct } from "./api/services/products"

function ProductList({ q, page }) {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["products", { q, page }],                           // cache key AND refetch trigger
    queryFn: ({ signal }) => listProducts({ q, page, signal }),    // signal provided for you
    placeholderData: (previous) => previous,                       // keep the old page while loading
  })

  const queryClient = useQueryClient()

  const remove = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  })
}
```

What you get that we hand-rolled: caching, deduplication, automatic `signal`, retry with backoff, refetch on focus and reconnect, `isFetching` vs `isPending` (background refresh without a jarring spinner), and optimistic updates with rollback via `onMutate`/`onError`.

**Using it with the router:** the mature pattern is to prime the cache in the loader and read it in the component — you get the router's "fetch before render" *and* the cache:

```js
export async function productsLoader({ request }) {
  const url = new URL(request.url)
  const q = url.searchParams.get("q") ?? ""
  const options = { queryKey: ["products", { q }], queryFn: () => listProducts({ q }) }
  return queryClient.getQueryData(options.queryKey) ?? (await queryClient.fetchQuery(options))
}
```

The mental model shift: **server state is not client state.** It's a cached copy of something that lives elsewhere, can go stale, and needs revalidating. `useState` + `useEffect` models it as if you owned it. You don't.

**Was building it by hand a waste?** No — you now know what the library does and why, which is the difference between using it and cargo-culting it. But past a small app, reach for the library.

---

# 41. TypeScript

## Typing responses

The generic on `axios.get<T>` types **`response.data`**:

```ts
interface Product {
  id: number
  title: string
  price: number
  thumbnail: string
  category: string
  rating: number
  stock: number
}

interface ProductListResponse {
  products: Product[]
  total: number
  skip: number
  limit: number
}

const { data } = await api.get<ProductListResponse>("/products")
data.products[0].title    // ✓ typed
```

**A warning you must internalise:** this generic is a *claim*, not a *check*. axios does not validate at runtime. If the backend renames `title` to `name`, TypeScript stays happy and your app crashes in production. For anything you don't control, parse at the boundary:

```ts
import { z } from "zod"

const ProductSchema = z.object({
  id: z.number(),
  title: z.string(),
  price: z.number(),
})

export async function getProduct(id: number): Promise<Product> {
  const { data } = await api.get(endpoints.products.detail(id))
  return ProductSchema.parse(data)     // throws with a precise message if the shape drifted
}
```

## Typing errors

`catch` gives you `unknown`. Narrow it:

```ts
import axios from "axios"

interface ApiErrorBody { message: string }

try {
  await getProduct(1)
} catch (err) {
  if (err instanceof ApiError) {
    err.status; err.isRetryable          // ✓ our own type — no axios knowledge needed
  } else if (axios.isAxiosError<ApiErrorBody>(err)) {
    err.response?.data.message           // ✓ typed
  } else {
    throw err
  }
}
```

`isAxiosError` is a **type guard** — it narrows inside the branch, and its generic types `err.response.data`. Above the API layer you should only ever need the first branch.

## Typing custom config fields

`_retry` and `metadata` don't exist in axios's types. Declare them:

```ts
// src/types/axios.d.ts
import "axios"

declare module "axios" {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean
    metadata?: { startedAt: number }
  }
}
```

## Typing router pieces

```ts
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router"

export async function productDetailLoader({ params, request }: LoaderFunctionArgs) {
  return getProduct(params.productId!, { signal: request.signal })
}

// useLoaderData is generic over the loader's return type:
const product = useLoaderData() as Awaited<ReturnType<typeof productDetailLoader>>
```

Middleware context is typed by `createContext`:

```ts
import { createContext } from "react-router"
import type { User } from "../types"

export const userContext = createContext<User | null>(null)

// context.get(userContext) is User | null — inferred, no cast
```

> **Framework Mode gets more.** The React Router Vite plugin generates per-route types (`Route.LoaderArgs`, `Route.ComponentProps`) so `loaderData` is typed end to end with no casts. That's the strongest argument for Framework Mode if you're starting fresh and can accept its build setup.

## Typing the hook

```ts
export function useApi<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: unknown[] = [],
  options: { skip?: boolean; initialData?: T | null } = {}
): {
  data: T | null
  loading: boolean
  error: ApiError | null
  reload: () => void
  setData: React.Dispatch<React.SetStateAction<T | null>>
}
```

Call it and `data` is inferred from the fetcher. No annotation at the call site.

---

# 42. Testing & mocking HTTP

Never let tests hit the real network: slow, flaky, rate-limited.

## MSW — the recommended approach

[Mock Service Worker](https://mswjs.io) intercepts at the network layer, so your code runs unmodified — same axios instance, same interceptors, same everything.

```bash
npm install -D msw vitest @testing-library/react @testing-library/user-event jsdom
```

```js
// src/test/server.js
import { setupServer } from "msw/node"
import { http, HttpResponse } from "msw"

export const server = setupServer(
  http.get("https://dummyjson.com/products", () =>
    HttpResponse.json({
      products: [{ id: 1, title: "Test Widget", price: 9.99, thumbnail: "", category: "test" }],
      total: 1, skip: 0, limit: 12,
    })
  ),
  http.get("https://dummyjson.com/products/categories", () =>
    HttpResponse.json([{ slug: "test", name: "Test", url: "" }])
  )
)
```

```js
// src/test/setup.js
import { afterAll, afterEach, beforeAll } from "vitest"
import { server } from "./server"

beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

`onUnhandledRequest: "error"` earns its keep: a request you forgot to mock fails loudly instead of silently escaping to the internet.

## Testing a route

`createMemoryRouter` renders a route tree without a browser:

```jsx
import { render, screen } from "@testing-library/react"
import { RouterProvider } from "react-router/dom"
import { createMemoryRouter } from "react-router"
import { http, HttpResponse } from "msw"
import { expect, test } from "vitest"
import { server } from "./test/server"
import { ProductsPage, productsLoader } from "./routes/ProductsPage"
import { ProductErrorBoundary } from "./routes/ProductErrorBoundary"

function renderRoute(routes, initialEntry) {
  const router = createMemoryRouter(routes, { initialEntries: [initialEntry] })
  return render(<RouterProvider router={router} />)
}

test("renders products from the loader", async () => {
  renderRoute(
    [{ path: "/products", Component: ProductsPage, loader: productsLoader }],
    "/products"
  )

  expect(await screen.findByText("Test Widget")).toBeInTheDocument()
})

test("shows the not-found boundary for a missing product", async () => {
  server.use(
    http.get("https://dummyjson.com/products/999", () =>
      HttpResponse.json({ message: "not found" }, { status: 404 })
    )
  )

  renderRoute(
    [{
      path: "/products/:productId",
      Component: ProductDetailPage,
      loader: productDetailLoader,
      ErrorBoundary: ProductErrorBoundary,
    }],
    "/products/999"
  )

  expect(await screen.findByText(/product not found/i)).toBeInTheDocument()
})
```

That second test is the payoff of route error boundaries: the whole 404 path — axios → `ApiError` → `throw data(…, 404)` → `isRouteErrorResponse` → the right UI — verified in nine lines.

`server.use()` overrides a handler **for one test only** — the cleanest way to test error paths.

## Unit-testing a service

```js
import { vi, expect, test } from "vitest"
import { api } from "./client"
import { listProducts } from "./services/products"

test("search hits the search endpoint and computes skip", async () => {
  const spy = vi.spyOn(api, "get").mockResolvedValue({
    data: { products: [], total: 0, skip: 0, limit: 12 },
  })

  await listProducts({ q: "phone", page: 2, limit: 10 })

  expect(spy).toHaveBeenCalledWith(
    "/products/search",
    expect.objectContaining({ params: expect.objectContaining({ q: "phone", skip: 20 }) })
  )
})
```

Asserting `skip: 20` pins down exactly the `page * limit` arithmetic that off-by-one bugs live in.

## What's worth testing

- Services build the right URL, params, and body
- `ApiError.from` maps each status to the right message and flags
- Interceptors attach the token; the 401 path refreshes **exactly once** under concurrency
- Loaders throw the right thing; error boundaries render the right UI
- Protected routes redirect when signed out and render when signed in
- Optimistic updates roll back on failure

**Don't** test that axios can make an HTTP request. That's axios's job.

---

# 43. Security

## Token storage, honestly

| Approach | XSS risk | CSRF risk | Verdict |
|---|---|---|---|
| `localStorage` | **High** — any script can read it | None | Common, and the weakest option |
| Memory only | Low | None | Good; user re-authenticates on refresh |
| `httpOnly` cookie | **None** — JS can't read it | Yes — needs mitigation | Best, with `SameSite=Lax` + CSRF token |

**Any XSS in your app — or in any of your transitive dependencies — can read `localStorage` and exfiltrate the token.** For a workshop that's acceptable. For a banking app it isn't.

## Cookies and `withCredentials`

Cookies are **not** sent cross-origin unless you ask:

```js
axios.create({ baseURL: "https://api.example.com", withCredentials: true })
```

And the server must cooperate:

```
Access-Control-Allow-Origin: https://app.example.com   ← a specific origin, not *
Access-Control-Allow-Credentials: true
```

`Access-Control-Allow-Origin: *` **cannot** be combined with credentials — the browser rejects the pair. This mismatch causes an enormous share of "it works in Postman but not in the browser" tickets.

## XSRF token support

axios has built-in support for the double-submit-cookie pattern (Django, Laravel, Rails):

```js
axios.create({
  xsrfCookieName: "XSRF-TOKEN",     // read this cookie…
  xsrfHeaderName: "X-XSRF-TOKEN",   // …and send it as this header
  withCredentials: true,
})
```

## CORS, in one paragraph

CORS is enforced by the **browser** and configured by the **server**. There is nothing you can add to an axios config to fix a CORS error — not a header, not a flag. In order of preference: (1) the API adds your origin to `Access-Control-Allow-Origin`; (2) you proxy through your own backend; (3) in development, use Vite's proxy:

```js
// vite.config.js
export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "https://dummyjson.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
})
```

Then set `VITE_API_BASE_URL=/api` in `.env.local` and the browser sees a same-origin request. **Dev only** — production needs a real server-side proxy or proper CORS headers. Note how cleanly this drops in *because* the base URL is a config value and not a hard-coded string.

A **preflight** (`OPTIONS`) before your real request is normal — custom headers (like our `X-Request-Id`), `PATCH`/`DELETE`, and JSON content types all trigger it.

## Routing-specific risks

- **Open redirects.** Never redirect to a URL from a query param without validating it — see `safeRedirect` in Build Step 29.
- **Client-side guards are UX, not security.** Middleware and hidden nav links stop honest users. The server must enforce the same rules; a user can edit your JavaScript.
- **Don't put secrets in route state.** `<Link state={…}>` and `location.state` live in browser history, readable from the console.

## The rest of the checklist

- **Never put secrets in frontend code.** Anything in the bundle or in a `VITE_` variable is public.
- **HTTPS everywhere.** A token over plain HTTP is a token you've given away.
- **Never log tokens**, including to error-reporting tools. Redact `Authorization` before it leaves the browser.
- **Encode every interpolated path segment** — our `endpoints.js` does this centrally.
- **Treat responses as untrusted.** Never `dangerouslySetInnerHTML` with unsanitised server HTML.

---

# 44. Final project structure

```
shopscope/
├── .env                         # committed: shared defaults
├── .env.development             # committed: debug logging, long timeouts
├── .env.staging                 # committed
├── .env.production              # committed
├── .env.local                   # NOT committed: personal overrides
└── src/
    ├── config/
    │   ├── env.js               # validated, frozen config — the only reader of import.meta.env
    │   └── logger.js            # level-gated logging
    ├── api/
    │   ├── client.js            # api, bareApi, uploadApi
    │   ├── endpoints.js         # every URL in the app
    │   ├── interceptors/
    │   │   ├── index.js         # installs them, in order
    │   │   ├── auth.js          # attaches the bearer token
    │   │   ├── logging.js       # correlation ids + timing
    │   │   ├── refresh.js       # the 401 queue
    │   │   └── errorNormalizer.js   # → ApiError; registered LAST
    │   └── services/
    │       ├── products.js
    │       └── auth.js
    ├── lib/
    │   ├── ApiError.js          # the one error type above the API layer
    │   └── tokenStore.js
    ├── hooks/
    │   ├── useApi.js
    │   ├── useDebouncedValue.js
    │   └── useProductFilters.js
    ├── components/
    │   ├── ProductCard.jsx
    │   ├── ProductForm.jsx
    │   ├── ConfirmDialog.jsx
    │   ├── Uploader.jsx
    │   ├── ErrorNotice.jsx
    │   └── Skeletons.jsx
    ├── routes/
    │   ├── RootLayout.jsx       # Component + rootLoader
    │   ├── RootErrorBoundary.jsx
    │   ├── AppBootSplash.jsx
    │   ├── middleware.js        # authMiddleware, requireRole, userContext
    │   ├── ProductsPage.jsx     # Component + loader
    │   ├── ProductDetailPage.jsx
    │   ├── ProductErrorBoundary.jsx
    │   ├── LoginPage.jsx        # Component + loader + action
    │   ├── AccountLayout.jsx
    │   ├── ProfilePage.jsx
    │   ├── ManageProductsPage.jsx
    │   └── NotFoundPage.jsx
    ├── router.jsx               # the route tree
    ├── main.jsx                 # installInterceptors() + RouterProvider
    └── index.css                # empty. Bootstrap does the work.
```

> **Leftovers from the journey.** `ProductForm.jsx` and `ConfirmDialog.jsx` (Build Step 14) and the `ProductDetail.jsx` off-canvas (Build Step 13) are no longer wired up once routes take over — `<Form>` + actions replaced the first two, and the detail route replaced the third. Keep them as a reference for the controlled-component approach, or delete them. Knowing *why* they became unnecessary is more useful than either choice.

Three conventions worth carrying to your own projects:

1. **A route file exports its `Component`, `loader`, and `action` together.** Everything the router needs for that URL is in one file, and `router.jsx` stays a readable map of the app.
2. **The dependency graph points one way:** `routes → components → hooks → services → client → axios`. Nothing above `api/` imports axios (except `axios.isCancel` in `useApi`, which route loaders make unnecessary anyway).
3. **Config and errors are single points.** One module reads env vars; one class represents failure. Both are the kind of thing that starts scattered and gets painful at exactly the moment you're too busy to fix it.

---

# axios cheat sheet

## Instance

```js
const api = axios.create({
  baseURL: env.api.baseUrl,
  timeout: env.api.timeoutMs,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
  paramsSerializer: { indexes: null },
})
```

## Methods

```js
api.get(url, config)      api.post(url, data, config)
api.delete(url, config)   api.put(url, data, config)
api.head(url, config)     api.patch(url, data, config)
api(configObject)
```

## Per-request config

| Option | Use |
|---|---|
| `params` | Query string (`undefined` values are dropped) |
| `data` | Request body |
| `headers` | Extra/override headers |
| `signal` | `AbortController` cancellation |
| `timeout` | Override the instance timeout |
| `responseType` | `'json'` \| `'text'` \| `'blob'` \| `'arraybuffer'` \| `'stream'` |
| `validateStatus` | Which statuses resolve instead of reject |
| `onUploadProgress` / `onDownloadProgress` | Progress events |
| `withCredentials` | Send cookies cross-origin |

## Response & error

```js
{ data, status, statusText, headers, config }            // response

err.response?.status      // server answered non-2xx
err.response?.data        // the error body
err.request               // sent, but no response (network/CORS/timeout)
err.code                  // ERR_NETWORK | ECONNABORTED | ERR_CANCELED | ERR_BAD_REQUEST
axios.isAxiosError(err)   // type guard
axios.isCancel(err)       // deliberate abort?
```

## Interceptors

```js
const id = api.interceptors.request.use(
  (config) => config,                  // MUST return config
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,              // MUST return response
  (error) => Promise.reject(error)     // MUST re-reject
)

api.interceptors.request.eject(id)
```

Request interceptors run **bottom-up**; response interceptors run **top-down**.

## The React fetch effect, in full

```jsx
useEffect(() => {
  const controller = new AbortController()

  async function load() {
    try {
      setLoading(true)
      setError(null)
      setData(await service({ signal: controller.signal }))
    } catch (err) {
      if (axios.isCancel(err)) return
      setError(err)
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }

  load()
  return () => controller.abort()
}, [deps])
```

---

# React Router v8 cheat sheet

## Imports

```jsx
import { createBrowserRouter, Link, useLoaderData /* … */ } from "react-router"
import { RouterProvider } from "react-router/dom"
// react-router-dom does not exist in v8
```

## Route object

```jsx
{
  path: "products/:id",
  index: false,
  Component, ErrorBoundary, HydrateFallback,
  loader, action, middleware: [],
  shouldRevalidate, handle: {}, lazy, children: [],
}
```

## Path patterns

| Pattern | Matches |
|---|---|
| `products` | `/products` |
| `products/:id` | `/products/42` → `params.id === "42"` |
| `files/*` | `/files/a/b.txt` → `params["*"]` |
| `:lang?/about` | `/about` and `/en/about` |
| `*` | Anything (404 catch-all) |

## Hooks

| Hook | Returns |
|---|---|
| `useLoaderData()` | This route's loader data |
| `useRouteLoaderData(id)` | Another route's loader data |
| `useActionData()` | This route's action return value |
| `useParams()` | `{ id: "42" }` — always strings |
| `useSearchParams()` | `[URLSearchParams, setter]` |
| `useNavigate()` | `navigate(to, opts)` / `navigate(-1)` |
| `useNavigation()` | `.state`, `.location`, `.formData` |
| `useFetcher()` | `.Form`, `.submit`, `.load`, `.state`, `.data`, `.formData` |
| `useSubmit()` | Programmatic form submission |
| `useRevalidator()` | `.revalidate()`, `.state` |
| `useRouteError()` | The thrown value in an `ErrorBoundary` |
| `useLocation()` | `{ pathname, search, hash, state, key }` |
| `useMatches()` | All matched routes + their `handle` and `data` |
| `useBlocker(fn)` | `.state`, `.proceed()`, `.reset()` |

## Components

```jsx
<RouterProvider router={router} />     // from react-router/dom
<Outlet />                             // where children render
<Link to state replace preventScrollReset relative />
<NavLink className={({ isActive, isPending }) => …} end />
<Form method="post" action replace navigate={false} />
<Navigate to replace />
<ScrollRestoration />
<Await resolve={promise} />
```

## Loader / action utilities

```js
redirect("/login")                              // throw or return from a loader/action
replace("/products")                            // redirect without a history entry
data({ message }, { status: 404 })              // throw → isRouteErrorResponse === true
isRouteErrorResponse(error)                     // type guard in an ErrorBoundary
generatePath("/products/:id", { id: 42 })
createContext(defaultValue)                     // middleware context key (NOT React's)
```

## Middleware

```js
async function guard({ request, params, context }, next) {
  // before loaders — throw redirect() or data() to stop the navigation
  await next()   // optional; omit entirely for a simple guard
  // after
}

{ path: "account", middleware: [authMiddleware, requireRole("admin")], … }
```

---

# Common mistakes and how to avoid them

## axios

| Mistake | Why it breaks | Fix |
|---|---|---|
| Using `response` where you meant `response.data` | `response` is the envelope | `const { data } = await api.get(…)` |
| `axios.get(url, { limit: 5 })` | GET has no body arg; this is config | `{ params: { limit: 5 } }` |
| `axios.post(url, { headers })` | The headers object becomes the body | `axios.post(url, data, { headers })` |
| Interceptor that doesn't `return config` | Every request fails cryptically | Always return it |
| Error handler that doesn't re-reject | Failures silently "succeed" | `return Promise.reject(error)` |
| `useEffect(async () => …)` | Returns a promise, not a cleanup fn | Declare the async fn inside |
| No `AbortController` | Race conditions, state set after unmount | Abort in cleanup |
| Not checking `axios.isCancel` | Every cancelled request flashes an error | Return early on cancel |
| `setLoading(false)` at the end of `try` | Errors skip it; spinner forever | Use `finally` |
| `loading` initialised to `false` | Flash of empty state on mount | Start `true` |
| Query strings via template literals | Breaks on spaces, `&`, `#` | Use `params` |
| Setting `Content-Type` for `FormData` | Missing multipart boundary → 400 | Let the browser set it |
| `axios.defaults.headers.common.Authorization` | Leaks your token to third-party hosts | Instance + request interceptor |
| Hard-coded base URL | No staging/prod story | `baseURL` from validated config |
| No `timeout` | Default is 0 = infinite | Set it on the instance |
| Retrying a failed `POST` | Duplicate orders/charges | Idempotent methods only |
| 401 handler with no `_retry` flag | Infinite refresh loop | Mark the config, retry once |
| Parallel refresh calls | Backend invalidates the token; user logged out | One shared promise |
| Showing `err.message` to users | "Request failed with status code 422" | Backend message first |
| Global `response => response.data` | Loses status/headers, breaks types | Unwrap in the service layer |
| Normaliser registered before the refresh handler | Refresh handler gets no `config` to replay | Normaliser last |
| Secrets in `.env` | Compiled into the public bundle | Proxy through your own server |
| Trusting a TS generic to validate | It's a claim, not a check | Parse with zod at the boundary |
| Optimistic update with no snapshot | Can't roll back | Snapshot → apply → confirm → revert, or use a fetcher |
| `"false"` from an env var | Non-empty strings are truthy | Coerce in the config module |

## React Router v8

| Mistake | Why it breaks | Fix |
|---|---|---|
| Importing from `react-router-dom` | The package doesn't exist in v8 | `react-router`, and `react-router/dom` for `RouterProvider` |
| `<a href>` inside an SPA | Full page reload, state lost | `<Link to>` — with Bootstrap, `as={Link}` |
| `NavLink` without `end` | Parent stays active on child routes | Add `end` for exact matching |
| Creating the router inside a component | History resets on every render | Module scope, once |
| Treating `useParams()` values as numbers | They're always strings | `Number(params.id)` |
| `setSearchParams({ page })` | Wipes every other param | Updater form + `new URLSearchParams(prev)` |
| No `replace` on search-as-you-type | One history entry per keystroke | `{ replace: true }` |
| Guard component instead of middleware | Loaders already ran; the UI flashes | `middleware: [authMiddleware]` |
| No root `ErrorBoundary` | One error blanks the whole app | Always have one |
| Only a root `ErrorBoundary` | A missing product wipes the navbar | Scope boundaries to routes |
| Throwing validation errors from an action | Error boundary replaces the form | **Return** them; throw only the unexpected |
| Redirecting to an unvalidated `redirectTo` | Open redirect / phishing vector | Same-origin paths only |
| Hiding a nav link and calling it security | The URL still works | Hide **and** enforce in middleware **and** on the server |
| Forgetting `request.signal` in a loader | No cancellation on fast navigation | Forward it to axios |
| Hooks inside a loader | Loaders run outside React | Read from `request.url` and `params` |
| Lazy-loading `middleware` | A guard that downloads first has a gap | Keep middleware eager |
| No SPA fallback on the host | Refreshing `/products/42` 404s | Rewrite all paths to `index.html` |

---

# Glossary

| Term | Meaning |
|---|---|
| **Instance** | An axios copy with its own defaults and interceptors (`axios.create()`) |
| **Interceptor** | A function run on every request or response through an instance |
| **Response envelope** | `{ data, status, statusText, headers, config }` |
| **`AbortController`** | Web standard for cancelling an in-flight request |
| **Race condition** | A slower earlier response overwriting a faster later one |
| **Debounce** | Delay an action until input stops changing |
| **Idempotent** | Repeating the request has the same effect as doing it once |
| **Optimistic update** | Update the UI before the server confirms; roll back on failure |
| **Correlation id** | A per-request id echoed in logs, tying a UI error to a server log line |
| **Preflight** | The browser's `OPTIONS` request checking CORS permission |
| **CORS** | Browser rules for cross-origin requests, configured by the server |
| **XSRF/CSRF** | Attack using the victim's cookies; mitigated with a double-submit token |
| **Access token** | Short-lived credential sent as `Authorization: Bearer …` |
| **Refresh token** | Long-lived credential used only to mint new access tokens |
| **Server state** | Data owned by the backend and cached in the client — not client state |
| **Backoff** | Increasing the wait between retries, ideally with jitter |
| **Service layer** | Modules that wrap HTTP calls and return domain data |
| **Mode** (Vite) | The string (`development`/`staging`/`production`) selecting `.env` files |
| **Data Mode** (Router) | `createBrowserRouter` + loaders/actions, no SSR framework |
| **Loader** | Async function run before a route renders, providing its data |
| **Action** | Async function handling a route's form submissions |
| **Middleware** | Function running before loaders/actions in a route subtree |
| **Fetcher** | A submission or load that doesn't navigate |
| **Revalidation** | Re-running loaders to refresh data after a mutation |
| **Splat route** | `path: "*"` — matches anything unmatched |
| **Index route** | The default child rendered when a layout's path matches exactly |
| **Pathless layout route** | A route with a `Component` and `children` but no `path` |

---

# Exercises

Roughly in order of difficulty. All use endpoints DummyJSON already provides.

**HTTP**

1. **Recently viewed.** Keep the last five product ids in `localStorage`; fetch them with `Promise.all` in the products loader and render a strip above the grid.
2. **Global request counter.** Use request/response interceptors to track in-flight requests, and show a spinner in the navbar whenever the count is above zero. Compare it with `useNavigation` — which requests does each one see, and why?
3. **A `useMutation` hook.** Extract `{ mutate, saving, error, reset }` so create, update, and delete share one hook. Then delete it again after §29 convinced you fetchers do the job.
4. **Retry with backoff.** Wire `axios-retry` into the client, break it with a bad `VITE_API_BASE_URL`, and watch the backoff in the Network tab. Confirm `POST`s are not retried.
5. **Offline banner.** Listen for `window` `online`/`offline`, block requests while offline, and revalidate when the connection returns.
6. **Add zod.** Validate the product list response at the boundary. Break the schema on purpose and compare the error with `undefined is not an object`.

**Routing**

7. **Load more.** Replace pagination with an append-on-click button using a fetcher and `fetcher.load()`. The tricky part: a new search must reset, not append.
8. **Breadcrumbs.** Implement the `handle`/`useMatches` pattern from §35 so the product page shows `Products › iPhone 5s` using the loader's data.
9. **Unsaved-changes guard.** Add `useBlocker` to the product form so navigating away with unsaved edits opens a Bootstrap `Modal`.
10. **Master-detail.** Nest `products/:productId` *inside* `products` so the detail renders beside the list instead of replacing it. Note what changes in the route config and what doesn't.
11. **A `moderator` tier.** Give moderators read-only access to `/account/products` — visible, but with the form and delete buttons disabled. Enforce it in middleware *and* in the UI, and articulate why both.
12. **Optimistic edit.** Extend the fetcher pattern from §36 to inline price editing, so a row shows the new price immediately and reverts on failure.
13. **Prefetch on hover.** Fetch a product's detail after the pointer rests on a card for 200 ms. Compare the perceived speed against the loader alone.
14. **Port to TanStack Query.** Keep `api/services/products.js` untouched; prime the cache in loaders and read it with `useQuery`. Count the lines you deleted.

**Testing**

15. **Cover the 401 path.** With MSW, return 401 once, then 200, and assert exactly one `/auth/refresh` call happens even with three concurrent requests.
16. **Cover the guards.** Assert `/account` redirects to `/login?redirectTo=%2Faccount` when signed out, and that a `user`-role account gets the 403 page at `/account/products`.

---

# Where to go next

- [axios documentation](https://axios-http.com/docs/intro) — short, and worth reading start to finish
- [React Router docs](https://reactrouter.com) — check the version selector says v8
- [TanStack Query](https://tanstack.com/query/latest) — the next step for anything non-trivial
- [React Bootstrap](https://react-bootstrap.github.io/) — component API reference
- [MDN: HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP) — status codes, methods, headers, CORS from the source
- [MSW](https://mswjs.io) — mocking that doesn't distort what you're testing
- [DummyJSON docs](https://dummyjson.com/docs) — more endpoints (carts, users, posts, todos, recipes) to practise against
- [zod](https://zod.dev) — runtime validation at the API boundary



