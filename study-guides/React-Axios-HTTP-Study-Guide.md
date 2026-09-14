# Axios in React — HTTP Requests Study Guide & Guided Project

**What this is:** a self-contained, incremental study guide for talking to a backend from React using **axios**. Every concept is explained, then immediately applied to a real app you build one step at a time.

**What you'll build:** **ShopScope** — a product explorer with search, debouncing, category filters, pagination, a detail view, create/edit/delete, login with JWT, automatic token refresh, optimistic updates, upload progress, and retries.

**Backend:** [DummyJSON](https://dummyjson.com) — a free, no-signup, CORS-enabled REST API with products, users, carts, and a real JWT auth flow (access token + refresh token). No API key, no rate limit to worry about during a workshop.

**Language:** JavaScript (`.jsx`). A full TypeScript section is included near the end.

---

## How to use this guide

Work top to bottom. The document alternates between two kinds of sections:

| Section type | What it is |
|---|---|
| **Concept** | The idea explained, with a small standalone example you can read or paste into a scratch file. |
| **🔨 Build Step** | Code you paste into the ShopScope project. Every build step leaves the app **running and working**. |

Rules that make this go well:

1. **Keep the browser Network tab open.** Ninety percent of debugging HTTP is looking at the actual request that went out — URL, method, headers, body — and the actual response that came back. Guessing is slower.
2. **Run the app after every build step.** Errors compound.
3. **Type the code at least once.** Pasting teaches you nothing about where the commas go.
4. **Do the "Try it yourself" prompts.** That's where it sticks.

> **One thing to know about DummyJSON up front:** reads are real, **writes are simulated**. A `POST /products/add` returns a fully-formed product with a new `id`, but nothing is persisted — refresh and it's gone. That's perfect for learning the request/response mechanics, and we'll design the UI around it (merging server responses into local state) exactly the way you would against a real API.

---

## Table of contents

**Setup**
- [Part 0 — Environment & project setup](#part-0--environment--project-setup)

**Fundamentals**
- [1. Why axios (and when `fetch` is fine)](#1-why-axios-and-when-fetch-is-fine)
- [2. Your first request & the response object](#2-your-first-request--the-response-object)
- [3. The request config object](#3-the-request-config-object)
- [4. The three states of every request](#4-the-three-states-of-every-request)
- [5. Errors: the anatomy of an axios failure](#5-errors-the-anatomy-of-an-axios-failure)
- [6. Cancellation, StrictMode, and race conditions](#6-cancellation-strictmode-and-race-conditions)

**Structure**
- [7. Instances & defaults](#7-instances--defaults)
- [8. The service layer](#8-the-service-layer)
- [9. Query parameters](#9-query-parameters)
- [10. Parallel requests](#10-parallel-requests)
- [11. Path params & fetching one record](#11-path-params--fetching-one-record)

**Writing data**
- [12. POST, PUT, PATCH, DELETE](#12-post-put-patch-delete)

**Cross-cutting concerns**
- [13. Request interceptors & authentication](#13-request-interceptors--authentication)
- [14. Response interceptors & error normalisation](#14-response-interceptors--error-normalisation)
- [15. Handling 401 with a token-refresh queue](#15-handling-401-with-a-token-refresh-queue)
- [16. Custom hooks: `useApi`](#16-custom-hooks-useapi)
- [17. Optimistic updates](#17-optimistic-updates)
- [18. Upload & download progress](#18-upload--download-progress)
- [19. Timeouts & retries](#19-timeouts--retries)
- [20. Concurrency: sequencing, limiting, deduping](#20-concurrency-sequencing-limiting-deduping)

**Production**
- [21. axios + TanStack Query](#21-axios--tanstack-query)
- [22. axios with TypeScript](#22-axios-with-typescript)
- [23. Testing & mocking HTTP](#23-testing--mocking-http)
- [24. Security: tokens, CORS, XSRF](#24-security-tokens-cors-xsrf)
- [25. Final project structure](#25-final-project-structure)

**Reference**
- [Config cheat sheet](#config-cheat-sheet)
- [Common mistakes](#common-mistakes-and-how-to-avoid-them)
- [Glossary](#glossary)
- [Exercises](#exercises)

---

# Part 0 — Environment & project setup

## 0.1 Prerequisites

| Tool | Version | Check with |
|---|---|---|
| Node.js | 20 LTS or newer | `node -v` |
| npm | comes with Node | `npm -v` |
| Browser | Chrome/Edge + [React Developer Tools](https://react.dev/learn/react-developer-tools) | — |

You should already be comfortable with: React components, `useState`, `useEffect`, lists and keys, controlled inputs, promises and `async`/`await`. If `async`/`await` is hazy, spend twenty minutes on it first — this entire guide is built on it.

## 0.2 Create the project

```bash
npm create vite@latest shopscope -- --template react
cd shopscope
npm install
```

## 0.3 Install axios and React Bootstrap

```bash
npm install axios react-bootstrap bootstrap react-bootstrap-icons
```

That's the whole dependency list. **No custom CSS anywhere in this guide** — React Bootstrap gives us cards, spinners, alerts, forms, progress bars, and an off-canvas drawer, and Bootstrap's utility classes handle the rest of the layout. The point is to keep your attention on the HTTP layer, not on styling.

> **Version note.** The stable line is `react-bootstrap@2.x`, which targets Bootstrap 5. A `3.0.0-beta` targets React 19 specifically. Vite currently scaffolds React 19, and stable v2 (2.10.7+) works with it. If you hit ref or `Navbar` type conflicts, try `npm install react-bootstrap@next`. Check [react-bootstrap.github.io](https://react-bootstrap.github.io/) for the current recommendation.

## 0.4 The API we'll use

Everything below is a real, live endpoint. Try a couple in your browser right now — seeing the raw JSON before you write code against it is a habit worth forming.

| Purpose | Request |
|---|---|
| List products (paginated) | `GET https://dummyjson.com/products?limit=12&skip=0` |
| Pick fields | `GET https://dummyjson.com/products?select=id,title,price` |
| Search | `GET https://dummyjson.com/products/search?q=phone` |
| One product | `GET https://dummyjson.com/products/101` |
| Category list | `GET https://dummyjson.com/products/categories` |
| Products in a category | `GET https://dummyjson.com/products/category/smartphones` |
| Create (simulated) | `POST https://dummyjson.com/products/add` |
| Update (simulated) | `PUT https://dummyjson.com/products/101` |
| Delete (simulated) | `DELETE https://dummyjson.com/products/101` |
| Log in | `POST https://dummyjson.com/auth/login` |
| Current user | `GET https://dummyjson.com/auth/me` (needs `Authorization: Bearer …`) |
| Refresh tokens | `POST https://dummyjson.com/auth/refresh` |
| **Add artificial latency** | append `&delay=2000` to any request |

**Test credentials:** username `emilys`, password `emilyspass`.

The list shape is consistent and worth memorising, because we'll destructure it constantly:

```json
{ "products": [ … ], "total": 194, "skip": 0, "limit": 12 }
```

And every error, whatever the status code, comes back as:

```json
{ "message": "Product with id '9999' not found" }
```

> **`delay` is the single most useful thing on that list.** Loading states and cancellation logic are invisible on a fast connection. `?delay=2000` makes them visible. Use it constantly while building.

## 0.5 Wire up Bootstrap

React Bootstrap ships the **components**; the Bootstrap package ships the **stylesheet**. You need both, and the stylesheet must be imported once, at the app root, before your own styles.

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

Now **empty `src/index.css`** (delete its contents — Vite's default styles fight with Bootstrap) and **delete `src/App.css`**. We won't write a single line of CSS from here on.

> **Keep `<StrictMode>`.** It's what surfaces the double-fetch behaviour we deal with properly in [§6](#6-cancellation-strictmode-and-race-conditions).

### The React Bootstrap components we'll use

You don't need to know Bootstrap to follow along. This is the whole vocabulary, and each is introduced in context:

| Component | What it's for |
|---|---|
| `Container`, `Row`, `Col`, `Stack` | Layout |
| `Card` | Product tiles and form panels |
| `Button`, `Form.Control`, `Form.Select`, `InputGroup` | Controls |
| `Alert` | Errors, empty states, success messages |
| `Spinner`, `Placeholder` | Loading indicators |
| `Offcanvas` | The slide-in detail drawer |
| `ProgressBar` | Upload progress |
| `Badge`, `Navbar`, `Pagination`, `Modal` | Supporting bits |

Plus a handful of utility classes — `mb-3` (margin-bottom), `text-muted`, `d-flex`, `gap-2`, `small`, `fw-semibold`. If one is unfamiliar, the [Bootstrap utilities docs](https://getbootstrap.com/docs/5.3/utilities/spacing/) are a two-minute read.

## 0.6 Verify

```bash
npm run dev
```

Open the URL Vite prints. The default Vite page will look different now — Bootstrap's stylesheet has replaced the template's. That's your confirmation the CSS import landed. Now we start replacing the markup.

---

# 1. Why axios (and when `fetch` is fine)

`fetch` is built into every browser. axios is a ~13 kB dependency. So why add it?

| Concern | `fetch` | axios |
|---|---|---|
| JSON response | `await res.json()` every time | `res.data`, already parsed |
| JSON request body | `JSON.stringify` + set `Content-Type` manually | Pass the object; both handled |
| HTTP errors (404/500) | **Resolves normally** — you must check `res.ok` yourself | **Rejects** — `try/catch` catches them |
| Base URL | Concatenate strings | `baseURL` on an instance |
| Query params | Build a `URLSearchParams` | `params: { … }` object |
| Timeouts | Manual `AbortSignal.timeout()` | `timeout: 10000` |
| Interceptors | None — wrap it yourself | First-class request/response hooks |
| Upload progress | Not supported | `onUploadProgress` |
| Node + browser | Same API in modern Node | Same API, plus older Node |

Two of those matter far more than the rest:

**1. axios rejects on HTTP error statuses.** This is the big one. With `fetch`, this code is broken and looks fine:

```js
// BROKEN: a 500 sails straight through
const res = await fetch("/api/products")
const data = await res.json()   // may be an error body, or may throw
```

With axios, a 404 or 500 lands in `catch`, which is where your brain already expects failure to go.

**2. Interceptors.** One place to attach the auth token to every request, one place to normalise every error, one place to handle a 401 by refreshing the token. Without them, that logic gets copy-pasted into every call site and drifts.

**When `fetch` is genuinely fine:** a tiny app with two or three calls, a serverless function, or a library that must ship zero dependencies. Nothing in this guide is unachievable with `fetch` — you'd just be rewriting the parts of axios you need.

---

# 2. Your first request & the response object

```js
import axios from "axios"

const response = await axios.get("https://dummyjson.com/products/1")
console.log(response.data.title)
```

**`response` is not your data.** It's an envelope. Learn its five fields now and you'll stop guessing later:

| Field | What it holds |
|---|---|
| `data` | The parsed response body — **this is what you want 95% of the time** |
| `status` | Number, e.g. `200`, `201`, `404` |
| `statusText` | `"OK"`, `"Not Found"` |
| `headers` | Response headers, lowercase keys: `response.headers["content-type"]` |
| `config` | The full config axios used for this request — useful in interceptors |

Which is why virtually every axios call you'll write destructures immediately:

```js
const { data } = await axios.get("https://dummyjson.com/products/1")
```

**When do you need the rest?** `status` to distinguish `200` from `201`, or `204 No Content`. `headers` to read pagination info (`x-total-count`), rate limits (`x-ratelimit-remaining`), or a filename from `content-disposition`. `config` almost exclusively inside interceptors.

### The shorthand methods

```js
axios.get(url, config)
axios.delete(url, config)
axios.head(url, config)
axios.options(url, config)

axios.post(url, data, config)     // note: data is the SECOND argument
axios.put(url, data, config)
axios.patch(url, data, config)
```

**The most common beginner bug in all of axios:** passing config where data goes, or vice versa.

```js
// ✗ WRONG — the headers object gets sent as the request body
axios.post("/products/add", { headers: { "X-Trace": "1" } })

// ✓ RIGHT
axios.post("/products/add", { title: "Widget" }, { headers: { "X-Trace": "1" } })

// ✗ WRONG — GET has no body argument; this object is treated as CONFIG
axios.get("/products", { limit: 5 })      // silently ignored

// ✓ RIGHT
axios.get("/products", { params: { limit: 5 } })
```

Remember it as: **`get`/`delete` take (url, config). `post`/`put`/`patch` take (url, data, config).**

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

Handy when the method itself is dynamic (`method: isNew ? "post" : "put"`), and it's exactly the object interceptors receive.

## 🔨 Build Step 1 — Talk to the API

Replace **`src/App.jsx`** entirely:

```jsx
import { useEffect, useState } from "react"
import axios from "axios"
import { Container } from "react-bootstrap"

export default function App() {
  const [product, setProduct] = useState(null)

  useEffect(() => {
    axios.get("https://dummyjson.com/products/1").then((response) => {
      console.log("Full response envelope:", response)
      setProduct(response.data)
    })
  }, [])

  return (
    <Container className="py-4">
      <h1 className="h3">ShopScope</h1>
      <p className="text-muted">Step 1 — one request, no error handling yet.</p>
      <pre className="bg-dark text-light p-3 rounded small">
        {JSON.stringify(product, null, 2)}
      </pre>
    </Container>
  )
}
```

Run it. Then, in the browser console, expand the logged response and look at `status`, `headers`, and `config` — the envelope you just read about, live.

Open the **Network** tab, find the `1` request, and check the **Headers** panel. axios set `Accept: application/json, text/plain, */*` for you.

> **Try it yourself:** change the URL to `https://dummyjson.com/products/9999`. The page shows `null` forever and a red error appears in the console. That is *exactly* the gap the next four sections close.

---

# 3. The request config object

Every axios call is ultimately configured by one object. The options you'll actually use:

```js
{
  url: "/products",
  method: "get",                    // default: get
  baseURL: "https://dummyjson.com", // prefixed to url unless url is absolute
  params: { limit: 12, skip: 0 },   // → ?limit=12&skip=0
  data: { title: "Widget" },        // request body (post/put/patch only)
  headers: { Authorization: "Bearer …" },
  timeout: 10000,                   // ms; 0 = no timeout (the default!)
  signal: controller.signal,        // AbortController for cancellation
  responseType: "json",             // 'json' | 'text' | 'blob' | 'arraybuffer' | 'stream'
  withCredentials: false,           // send cookies cross-origin
  validateStatus: (s) => s >= 200 && s < 300,  // which statuses count as success
  onUploadProgress: (e) => {},
  onDownloadProgress: (e) => {},
  paramsSerializer: { … },          // how params become a query string
  maxRedirects: 5,                  // Node only
}
```

Four notes worth internalising:

**`timeout` defaults to `0` — meaning never.** A dead backend will leave your spinner turning until the user leaves. Always set one on your instance.

**`baseURL` + `url` join with normal URL rules.** `baseURL: "https://api.co/v1"` + `url: "/products"` → `https://api.co/v1/products`. But `url: "products"` (no leading slash) can bite you: some versions resolve it relative to the *directory*. Be consistent — always lead with `/`.

**`validateStatus` decides what "success" means.** Sometimes a 404 is a legitimate answer ("no draft saved yet") rather than an error:

```js
const res = await api.get(`/drafts/${id}`, {
  validateStatus: (s) => s === 200 || s === 404,
})
const draft = res.status === 404 ? null : res.data
```

**`responseType: "blob"`** is how you download a file (PDF, CSV, image) — see [§18](#18-upload--download-progress).

---

# 4. The three states of every request

Any component that fetches has exactly three things it must render:

1. **Loading** — the request is in flight
2. **Error** — it failed
3. **Success** — here's the data

Skip one and your UI is broken in production, no matter how nice it looks locally. The canonical shape:

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

- **`setError(null)` at the start.** Otherwise a stale error stays on screen after a successful retry.
- **`finally`.** Set `loading` to `false` in `finally`, never at the end of `try` — an error would skip it and spin forever.
- **The async function goes *inside* the effect.** `useEffect(async () => …)` is a bug: the effect would return a promise where React expects a cleanup function. React warns about this.

### Initialise `loading` to `true`, not `false`

Between the first render and the effect firing, no request has started but one certainly will. Starting at `false` produces a one-frame flash of the empty state — the little flicker that makes an app feel cheap.

## 🔨 Build Step 2 — The product list

Create **`src/components/Skeletons.jsx`**. React Bootstrap's `Placeholder` is purpose-built for this — `animation="glow"` gives you the shimmer, and the `xs={n}` props are twelve-column widths:

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

`h-100` on every card plus `mt-auto` on the footer row keeps the price aligned across a row of cards with different title lengths — the kind of thing you'd otherwise hand-write. (`object-fit-contain` needs Bootstrap 5.3+; on older versions use `style={{ objectFit: "contain" }}`.)

Replace **`src/App.jsx`**:

```jsx
import { useEffect, useState } from "react"
import axios from "axios"
import { Alert, Col, Container, Row } from "react-bootstrap"
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
        const { data } = await axios.get("https://dummyjson.com/products", {
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
      <p className="text-muted">Step 2 — loading, error, and success states.</p>

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

**Note where the `key` goes:** on the `<Col>`, the outermost element produced by `map`, not on the `<ProductCard>` inside it. Putting it on the inner component is a silent no-op.

You should see twelve products. To actually *see* the skeletons, add `delay: 3000` to `params` temporarily.

> **Try it yourself:** point the URL at `https://dummyjson.com/nope`. You get `Request failed with status code 404` — technically correct, useless to a user. Section 5 fixes that.

---

# 5. Errors: the anatomy of an axios failure

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
  err.code      // 'ERR_NETWORK' | 'ECONNABORTED' | 'ERR_CANCELED' | 'ERR_BAD_REQUEST' …
  err.config    // the config used
}
```

### The single most important line

```js
const message = err.response?.data?.message ?? err.message
```

`err.message` is written for *developers* (`"Request failed with status code 400"`). `err.response.data.message` is written by your *backend* for *users* (`"Invalid credentials"`). Always prefer the backend's message and fall back to axios's.

### Not every error in a `catch` is an axios error

Your own code inside `try` can throw too. Guard with the type predicate:

```js
import axios from "axios"

catch (err) {
  if (axios.isAxiosError(err)) {
    // safe to read err.response
  } else {
    // a TypeError in your own mapping code — don't swallow it
    throw err
  }
}
```

### Mapping statuses to messages

Users don't know what a 422 is. Translate once, centrally:

```js
export function toMessage(err) {
  if (axios.isCancel(err)) return null              // not an error; don't show anything
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

Rules of thumb that hold up in real products:

- **4xx = the user or the client can fix it.** Say what to do.
- **5xx = they can't.** Apologise, offer retry, and log it somewhere you'll see.
- **Never render a raw stack trace or `err.toString()`.** It leaks internals and helps nobody.
- **Always give a way forward** — a Retry button, a link back.

## 🔨 Build Step 3 — Honest error UI

Create **`src/lib/errors.js`** with the `toMessage` function above (copy it verbatim, including the `import axios from "axios"` line).

Create **`src/components/ErrorNotice.jsx`**:

```jsx
import { toMessage } from "../lib/errors"

export function ErrorNotice({ error, onRetry }) {
  const message = toMessage(error)
  if (!message) return null

  return (
    <div className="notice error">
      <div className="row">
        <span>{message}</span>
        {onRetry && <button onClick={onRetry}>Retry</button>}
      </div>
      {import.meta.env.DEV && error?.config?.url && (
        <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
          {error.config.method?.toUpperCase()} {error.config.url}
          {error.response ? ` → ${error.response.status}` : " → no response"}
        </div>
      )}
    </div>
  )
}
```

That `import.meta.env.DEV` block is a small gift to yourself: developers see the failing request, users never do.

Update **`src/App.jsx`** — add a `reloadKey` so Retry actually re-runs the effect:

```jsx
import { useEffect, useState } from "react"
import axios from "axios"
import { ProductCard } from "./components/ProductCard"
import { CardSkeletons } from "./components/Spinner"
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
        const { data } = await axios.get("https://dummyjson.com/products", {
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
    <div className="app">
      <h1>ShopScope</h1>
      <p className="muted">Step 3 — errors a human can act on.</p>

      {error && <ErrorNotice error={error} onRetry={() => setReloadKey((k) => k + 1)} />}
      {loading && <CardSkeletons />}
      {!loading && !error && (
        <div className="grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
```

> **Try it yourself, three ways:**
> 1. Change the URL to `/productz` → a 404 with a server message.
> 2. Change it to `https://localhost:9999/x` → a network error, no `response`.
> 3. Add `timeout: 500` and `params: { delay: 3000 }` → a timeout, `err.code === "ECONNABORTED"`.
>
> Each should produce a *different*, sensible sentence. That's the point.

---

# 6. Cancellation, StrictMode, and race conditions

## The problem you can't see locally

Type "phone" into a search box. Five requests go out — `p`, `ph`, `pho`, `phon`, `phone`. They come back in whatever order the network feels like. If `pho` returns *after* `phone`, your UI shows results for `pho` while the box says "phone".

This is a **race condition**, it is extremely common, and it is invisible on localhost. It's also the reason the classic React data-fetching effect has a cleanup function.

## `AbortController`

The web-standard way to cancel. axios speaks it natively via the `signal` config option:

```js
const controller = new AbortController()

axios.get("/products", { signal: controller.signal })

controller.abort()   // the promise rejects with a CanceledError
```

Inside an effect, cleanup runs when dependencies change or the component unmounts — exactly when a stale request should be killed:

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

> **Legacy note:** `axios.CancelToken.source()` does the same thing and is **deprecated**. If you see it in an old codebase, that's what it was. Use `AbortController`.

## React StrictMode runs effects twice

In development, `<StrictMode>` mounts every component, unmounts it, and mounts it again. Your effect runs twice, so you see **two requests in the Network tab.**

This is intentional. It surfaces effects that don't clean up after themselves. It does **not** happen in production builds. Two reasonable responses:

- **Do nothing** — a duplicated GET is harmless.
- **Abort in cleanup** — the first request gets cancelled the moment the second starts, which is what you want anyway.

What you should **not** do is delete `<StrictMode>` from `main.jsx` to make the double request go away. You'd be turning off the smoke detector.

> **Careful with non-idempotent requests.** A `POST` fired directly inside a mount effect will fire twice in StrictMode — and in production, twice on a double-click. Mutations belong in event handlers, and should disable their button while in flight.

## Timeouts are cancellation too

```js
axios.get("/slow", { timeout: 5000 })
// rejects with err.code === "ECONNABORTED"
```

`timeout` measures the whole round trip. Distinguish it from a manual cancel: `ECONNABORTED` is a *failure* worth showing; `ERR_CANCELED` is *intentional* and silent.

## 🔨 Build Step 4 — Cancel on unmount

Update the effect in **`src/App.jsx`**:

```jsx
  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      try {
        setLoading(true)
        setError(null)
        const { data } = await axios.get("https://dummyjson.com/products", {
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
- **`if (!controller.signal.aborted)` around `setLoading(false)`.** When a request is cancelled because a *newer* one just started, the newer one owns the loading flag now. Clearing it here would flash the empty state mid-flight.

> **Try it yourself:** add `params: { delay: 3000 }`, open the Network tab, and hard-refresh. In StrictMode you'll see two requests — and one marked **canceled**. That's your cleanup working.

---

# 7. Instances & defaults

Right now `https://dummyjson.com` is hard-coded in a component. That doesn't survive contact with a second component, let alone a staging environment.

## `axios.create()`

An **instance** is a pre-configured axios with its own defaults and its own interceptors:

```js
import axios from "axios"

export const api = axios.create({
  baseURL: "https://dummyjson.com",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
})

// now everywhere else:
api.get("/products")           // → https://dummyjson.com/products
```

### Always create an instance. Never configure the global.

```js
// ✗ Don't do this
axios.defaults.baseURL = "https://dummyjson.com"
axios.defaults.headers.common.Authorization = `Bearer ${token}`
```

Why it's a trap: the global `axios` is shared with every library in your `node_modules` that happens to import axios. Setting a global auth header means **your token gets sent to third-party domains** the moment some SDK makes a request. Instances are isolated. Use them.

A second instance is also how you handle the exceptions — an upload endpoint with a 5-minute timeout, or a "bare" client with no interceptors (which we'll need in [§15](#15-handling-401-with-a-token-refresh-queue)).

### Environment variables

Never hard-code the API URL. In Vite, variables must be prefixed `VITE_` to reach the browser.

Create **`.env`** in the project root:

```bash
VITE_API_BASE_URL=https://dummyjson.com
```

And read it with a fallback:

```js
baseURL: import.meta.env.VITE_API_BASE_URL ?? "https://dummyjson.com",
```

> **`.env` files are not secret.** Everything in them is compiled into the JavaScript bundle and readable by anyone with DevTools. They exist for *configuration*, not *secrets*. An API key that must stay private belongs on a server you control, which then proxies the request. (CRA users: same idea, prefix `REACT_APP_` and read `process.env`.)

### Merge order

When a request runs, axios merges config from three places — later wins:

1. Library defaults (`axios.defaults`)
2. Instance config (`axios.create({ … })`)
3. Per-request config (`api.get(url, { … })`)

Headers merge key-by-key, so a per-request header overrides just that one and leaves the rest.

```js
api.get("/products", { timeout: 30000 })   // this call only
```

You can also mutate an instance after creation, which is how login/logout sets the token in simpler apps:

```js
api.defaults.headers.common.Authorization = `Bearer ${token}`
delete api.defaults.headers.common.Authorization
```

We'll use an interceptor instead — it reads the token fresh on every request, so there's no stale-header failure mode.

## 🔨 Build Step 5 — The shared client

Create **`.env`** as shown above.

Create **`src/api/client.js`**:

```js
import axios from "axios"

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "https://dummyjson.com"

/** The app's single HTTP client. Import this, never bare `axios`. */
export const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
})

/**
 * No interceptors, ever. Used by the auth-refresh flow so that a failing
 * refresh can't trigger the 401 handler that called it. See §15.
 */
export const bareApi = axios.create({ baseURL, timeout: 10000 })
```

Update **`src/App.jsx`** — swap the import and shorten the URL:

```jsx
import { api } from "./api/client"
// …
const { data } = await api.get("/products", {
  params: { limit: 12, skip: 0 },
  signal: controller.signal,
})
```

Keep `import axios from "axios"` in `App.jsx` for now — `axios.isCancel` still needs it.

---

# 8. The service layer

Components should describe *what* they need, not *how* HTTP works. Compare:

```jsx
// Before: the component knows about URLs, params, and response envelopes
const { data } = await api.get("/products", { params: { limit, skip, select: "id,title" } })
setProducts(data.products)

// After: the component knows about products
const { products, total } = await listProducts({ page, limit })
```

Why bother:

- **One place to change** when the endpoint moves or the backend renames a field.
- **Testable** — mock four functions instead of every URL string in the app.
- **Discoverable** — a new dev opens `api/products.js` and sees the entire surface area.
- **A translation boundary.** Backends return snake_case, ISO strings, and nested envelopes. Normalise once, here, and your components stay clean.

The rule: **a service function returns domain data, not an axios response.** No `.data` in your components.

## 🔨 Build Step 6 — `api/products.js`

Create **`src/api/products.js`**:

```js
import { api } from "./client"

const LIST_FIELDS = "id,title,price,thumbnail,rating,stock,category,brand"

/**
 * One entry point for the three list-shaped endpoints. Search wins over
 * category if both are supplied, which matches what users expect.
 * Returns { products, total, skip, limit }.
 */
export async function listProducts({ q = "", category = "", page = 0, limit = 12, signal } = {}) {
  const params = { limit, skip: page * limit, select: LIST_FIELDS }

  let url = "/products"
  if (q) {
    url = "/products/search"
    params.q = q
  } else if (category) {
    url = `/products/category/${encodeURIComponent(category)}`
  }

  const { data } = await api.get(url, { params, signal })
  return data
}

/** Full record — no `select`, we want every field for the detail view. */
export async function getProduct(id, { signal } = {}) {
  const { data } = await api.get(`/products/${id}`, { signal })
  return data
}

/** [{ slug, name, url }, …] */
export async function listCategories({ signal } = {}) {
  const { data } = await api.get("/products/categories", { signal })
  return data
}

// --- Writes. DummyJSON simulates these: the response is real, persistence isn't. ---

export async function createProduct(payload, { signal } = {}) {
  const { data } = await api.post("/products/add", payload, { signal })
  return data
}

export async function updateProduct(id, patch, { signal } = {}) {
  const { data } = await api.patch(`/products/${id}`, patch, { signal })
  return data
}

export async function deleteProduct(id, { signal } = {}) {
  const { data } = await api.delete(`/products/${id}`, { signal })
  return data   // { …product, isDeleted: true, deletedOn: "…" }
}
```

Notice every function accepts a `signal`. Cancellation has to be plumbed all the way through, or the layer below can't be cancelled by the layer above.

Update **`src/App.jsx`** to use it:

```jsx
import { listProducts } from "./api/products"
// …
const data = await listProducts({ page: 0, limit: 12, signal: controller.signal })
setProducts(data.products)
```

---

# 9. Query parameters

Never build query strings by hand.

```js
// ✗ Fragile: breaks the moment a value contains a space, &, or #
api.get(`/products/search?q=${query}&limit=${limit}`)

// ✓ axios encodes each value correctly
api.get("/products/search", { params: { q: query, limit } })
```

With `params`, `q = "t-shirt & jeans"` becomes `q=t-shirt%20%26%20jeans`. With template strings, it becomes a broken URL with a phantom second parameter.

### `undefined` params are dropped, `null` and `""` are not

```js
api.get("/products", { params: { limit: 12, category: undefined } })
// → /products?limit=12

api.get("/products", { params: { limit: 12, category: null } })
// → /products?limit=12&category=
```

That's a genuinely useful default: build the object unconditionally and let `undefined` prune the empty filters.

```js
const params = {
  limit,
  skip: page * limit,
  q: query || undefined,               // "" → dropped
  category: category || undefined,
  sortBy: sort?.field,                 // undefined if no sort
}
```

### Arrays

By default axios serialises `{ tags: ["a", "b"] }` as `tags[]=a&tags[]=b`. Some backends want `tags=a&tags=b`, others want `tags=a,b`. Fix it once on the instance:

```js
export const api = axios.create({
  baseURL,
  paramsSerializer: {
    indexes: null,   // → tags=a&tags=b
  },
})
```

Or take full control:

```js
paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "comma" })
```

**Check what your backend expects before guessing.** This mismatch produces a silent empty result set, which is a miserable thing to debug.

### Debouncing

A request per keystroke is wasteful and racy. Wait until typing pauses:

```jsx
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

## 🔨 Build Step 7 — Search & pagination

Create **`src/hooks/useDebouncedValue.js`** with the hook above (remember `import { useEffect, useState } from "react"`).

Replace **`src/App.jsx`**:

```jsx
import { useEffect, useState } from "react"
import axios from "axios"
import { listProducts } from "./api/products"
import { useDebouncedValue } from "./hooks/useDebouncedValue"
import { ProductCard } from "./components/ProductCard"
import { CardSkeletons } from "./components/Spinner"
import { ErrorNotice } from "./components/ErrorNotice"

const PAGE_SIZE = 12

export default function App() {
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(0)

  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  const debouncedQuery = useDebouncedValue(query, 400)

  // A new search must reset to page 0, or you can land on page 5 of 1 result.
  useEffect(() => {
    setPage(0)
  }, [debouncedQuery])

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      try {
        setLoading(true)
        setError(null)
        const data = await listProducts({
          q: debouncedQuery,
          page,
          limit: PAGE_SIZE,
          signal: controller.signal,
        })
        setProducts(data.products)
        setTotal(data.total)
      } catch (err) {
        if (axios.isCancel(err)) return
        setError(err)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    load()
    return () => controller.abort()
  }, [debouncedQuery, page, reloadKey])

  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1)

  return (
    <div className="app">
      <h1>ShopScope</h1>
      <p className="muted">Step 7 — debounced search, pagination, cancelled stale requests.</p>

      <div className="toolbar">
        <input
          className="grow"
          placeholder="Search products…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="muted">{total} results</span>
      </div>

      {error && <ErrorNotice error={error} onRetry={() => setReloadKey((k) => k + 1)} />}

      {loading ? (
        <CardSkeletons count={PAGE_SIZE} />
      ) : products.length === 0 ? (
        <div className="notice info">No products match “{debouncedQuery}”.</div>
      ) : (
        <div className="grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      <div className="toolbar" style={{ justifyContent: "center" }}>
        <button disabled={page === 0 || loading} onClick={() => setPage((p) => p - 1)}>
          ← Previous
        </button>
        <span className="muted">
          Page {page + 1} of {lastPage + 1}
        </span>
        <button disabled={page >= lastPage || loading} onClick={() => setPage((p) => p + 1)}>
          Next →
        </button>
      </div>
    </div>
  )
}
```

> **Try it yourself:** open the Network tab and type "laptop" quickly. You should see **one** request, not six — that's the debounce. Now throttle to Slow 3G and type slowly: you'll see requests marked **canceled** as newer ones supersede them. That's your `AbortController`. Delete `return () => controller.abort()` and watch results flicker between stale and fresh — the race condition, reproduced on demand.

---

# 10. Parallel requests

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

> `axios.all()` and `axios.spread()` still exist. They're thin wrappers around `Promise.all` from the pre-ES2015 era and are deprecated. Use the native promise combinators.

**When requests *do* depend on each other, sequential is correct** — you cannot fetch a user's orders before you know the user id. Just make sure the dependency is real and not just how you happened to type it.

## 🔨 Build Step 8 — Category filter

Add to **`src/App.jsx`** — new state, a parallel first load, and a `<select>`.

Add the imports and state:

```jsx
import { listProducts, listCategories } from "./api/products"
// …
const [categories, setCategories] = useState([])
const [category, setCategory] = useState("")
```

Add a **second effect** that loads categories exactly once. It's separate from the product effect on purpose: categories don't change when the search box does, so re-fetching them on every keystroke would be pure waste.

```jsx
  useEffect(() => {
    const controller = new AbortController()

    listCategories({ signal: controller.signal })
      .then(setCategories)
      .catch((err) => {
        if (axios.isCancel(err)) return
        console.warn("Category list unavailable:", err.message)
        // Deliberately not surfaced: the app is fully usable without filters.
      })

    return () => controller.abort()
  }, [])
```

Feed `category` into the product effect — add it to `listProducts` and to the dependency array:

```jsx
        const data = await listProducts({
          q: debouncedQuery,
          category,
          page,
          limit: PAGE_SIZE,
          signal: controller.signal,
        })
// …
  }, [debouncedQuery, category, page, reloadKey])
```

Reset the page when the category changes too:

```jsx
  useEffect(() => {
    setPage(0)
  }, [debouncedQuery, category])
```

And add the control to the toolbar, before the results count:

```jsx
        <select value={category} onChange={(e) => setCategory(e.target.value)} disabled={!!query}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
```

The `disabled={!!query}` mirrors the "search wins" rule in `listProducts`. A control that has no effect should look like it has no effect.

**Note the deliberate asymmetry in error handling.** A failed product list is a broken page — show it loudly. A failed category list costs the user a filter — log it and move on. Not every request deserves the same treatment, and deciding which is which is a design decision, not a technical one.

---

# 11. Path params & fetching one record

Two ways to build a URL with an id in it:

```js
// Template literal — fine when the id is a number or a known-safe slug
api.get(`/products/${id}`)

// encodeURIComponent — required when it could contain /, ?, #, or spaces
api.get(`/products/category/${encodeURIComponent(slug)}`)
```

**Never interpolate raw user input into a path without encoding it.** A slug like `home & garden` breaks the URL; a crafted one can escape the path segment entirely.

### Fetch-on-select

The pattern is the same effect you already know, keyed on the selected id, plus one guard:

```jsx
useEffect(() => {
  if (!id) return            // nothing selected — don't fetch
  const controller = new AbortController()
  // …
  return () => controller.abort()
}, [id])
```

That early `return` (before creating the controller, or with an empty cleanup) is how you express "conditionally fetch" without conditionally *calling a hook* — which the rules of hooks forbid.

## 🔨 Build Step 9 — Detail drawer

Create **`src/components/ProductDetail.jsx`**:

```jsx
import { useEffect, useState } from "react"
import axios from "axios"
import { getProduct } from "../api/products"
import { ErrorNotice } from "./ErrorNotice"

export function ProductDetail({ id, onClose }) {
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) return

    const controller = new AbortController()

    async function load() {
      try {
        setLoading(true)
        setError(null)
        setProduct(null)     // clear the previous product so we never show stale data
        const data = await getProduct(id, { signal: controller.signal })
        setProduct(data)
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
    <aside className="drawer">
      <div className="row">
        <h2 style={{ margin: 0, fontSize: 18 }}>Product #{id}</h2>
        <button onClick={onClose}>Close</button>
      </div>

      {loading && (
        <div className="stack" style={{ marginTop: 16 }}>
          <div className="skeleton" style={{ height: 180 }} />
          <div className="skeleton" style={{ height: 16 }} />
          <div className="skeleton" style={{ height: 16, width: "60%" }} />
        </div>
      )}

      {error && <ErrorNotice error={error} />}

      {product && (
        <div className="stack" style={{ marginTop: 16 }}>
          <img src={product.thumbnail} alt="" style={{ width: "100%", objectFit: "contain" }} />
          <h3 style={{ margin: 0 }}>{product.title}</h3>
          <p className="muted" style={{ margin: 0 }}>{product.description}</p>
          <div className="row">
            <strong>${product.price}</strong>
            <span className="muted">★ {product.rating} · {product.stock} in stock</span>
          </div>
          <div className="muted">
            {product.brand ?? "No brand"} · {product.category} · SKU {product.sku}
          </div>
          <div className="muted">{product.warrantyInformation} · {product.shippingInformation}</div>
        </div>
      )}
    </aside>
  )
}
```

Make the cards clickable — in **`src/components/ProductCard.jsx`**:

```jsx
export function ProductCard({ product, onSelect }) {
  return (
    <div className="card" onClick={() => onSelect?.(product.id)} style={{ cursor: "pointer" }}>
      {/* …unchanged… */}
    </div>
  )
}
```

Wire it up in **`src/App.jsx`** — add state, pass the handler, render the drawer:

```jsx
import { ProductDetail } from "./components/ProductDetail"
// …
const [selectedId, setSelectedId] = useState(null)
// …
<ProductCard key={p.id} product={p} onSelect={setSelectedId} />
// …just before the closing </div> of .app:
{selectedId && <ProductDetail id={selectedId} onClose={() => setSelectedId(null)} />}
```

> **Try it yourself:** throttle to Slow 3G, click one product, then immediately click another. Without the `setProduct(null)` line you'd briefly see product A's details under product B's heading. With it — plus the abort — you see a skeleton and then the right product. Try removing each of the two lines to see which artefact each one prevents.

---

# 12. POST, PUT, PATCH, DELETE

## Which verb

| Verb | Meaning | Body | Idempotent? |
|---|---|---|---|
| `POST` | Create, or "run this action" | Yes | No — calling twice creates two |
| `PUT` | Replace the whole resource | Yes, complete | Yes |
| `PATCH` | Update some fields | Yes, partial | Usually |
| `DELETE` | Remove it | Rarely | Yes |

The practical rule: **`PATCH` for edit forms**, because sending the full object round-trips fields you never touched and will happily overwrite a colleague's concurrent edit. `PUT` when you genuinely mean "this is the whole new state".

## Bodies

Pass a plain object; axios stringifies it and sets `Content-Type: application/json`:

```js
const { data } = await api.post("/products/add", { title: "Widget", price: 12.5 })
```

**Other content types you'll meet:**

```js
// FormData — for file uploads. Let the browser set Content-Type (it must
// include the multipart boundary), so DON'T set the header yourself.
const form = new FormData()
form.append("file", file)
await api.post("/upload", form)

// URL-encoded — for older form endpoints
await api.post("/login", new URLSearchParams({ user, pass }))
```

axios detects `FormData` and `URLSearchParams` and sets the right header automatically. Overriding it manually is a classic self-inflicted 400.

## Mutations in React

Mutations are **event-handler** work, not effect work. The shape:

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

1. **Disable the submit button while in flight.** `disabled={saving}` — the cheapest bug prevention in the business.
2. **Never clear the form on error.** Losing typed input is unforgivable.
3. **Use what the server returns.** It has the real `id`, server-side defaults, computed fields. Don't guess by echoing your own payload back into state.
4. **Don't cancel mutations on unmount.** For a GET, abandoning the request is free. For a POST, the server may have already committed — you'd just lose the confirmation. Aborting deliberately (a Cancel button) is different from aborting incidentally.
5. **Say something on success.** Silence reads as failure.

## 🔨 Build Step 10 — Create, edit, delete

Create **`src/components/ProductForm.jsx`**:

```jsx
import { useEffect, useState } from "react"
import { createProduct, updateProduct } from "../api/products"
import { ErrorNotice } from "./ErrorNotice"

const EMPTY = { title: "", price: "", category: "beauty", description: "" }

export function ProductForm({ editing, categories, onSaved, onCancel }) {
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Load the record being edited into the form; reset when we switch to create mode.
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
  }, [editing])

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (saving) return

    const payload = {
      title: form.title.trim(),
      price: Number(form.price),          // inputs give strings; the API wants a number
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
      if (!editing) setForm(EMPTY)
    } catch (err) {
      setError(err)                        // form contents survive on purpose
    } finally {
      setSaving(false)
    }
  }

  const valid = form.title.trim().length > 1 && Number(form.price) > 0

  return (
    <form onSubmit={handleSubmit} className="card stack" style={{ marginBottom: 16 }}>
      <strong>{editing ? `Edit “${editing.title}”` : "Add a product"}</strong>

      <div className="toolbar" style={{ margin: 0 }}>
        <input
          className="grow"
          placeholder="Title"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
        />
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="Price"
          style={{ width: 110 }}
          value={form.price}
          onChange={(e) => set("price", e.target.value)}
        />
        <select value={form.category} onChange={(e) => set("category", e.target.value)}>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>

      <textarea
        rows={2}
        placeholder="Description"
        value={form.description}
        onChange={(e) => set("description", e.target.value)}
      />

      {error && <ErrorNotice error={error} />}

      <div className="toolbar" style={{ margin: 0 }}>
        <button type="submit" className="primary" disabled={!valid || saving}>
          {saving ? "Saving…" : editing ? "Save changes" : "Create product"}
        </button>
        {editing && (
          <button type="button" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
```

Add per-card actions in **`src/components/ProductCard.jsx`**:

```jsx
export function ProductCard({ product, onSelect, onEdit, onDelete, busy }) {
  return (
    <div className="card" style={{ opacity: busy ? 0.5 : 1 }}>
      <img
        src={product.thumbnail}
        alt=""
        loading="lazy"
        onClick={() => onSelect?.(product.id)}
        style={{ cursor: "pointer" }}
      />
      <h3>{product.title}</h3>
      <div className="row">
        <span className="muted">{product.category}</span>
        <strong>${product.price}</strong>
      </div>
      <div className="toolbar" style={{ margin: "10px 0 0" }}>
        <button onClick={() => onEdit?.(product)} disabled={busy}>Edit</button>
        <button className="danger" onClick={() => onDelete?.(product)} disabled={busy}>
          Delete
        </button>
      </div>
    </div>
  )
}
```

Now wire the mutations into **`src/App.jsx`**. Add state:

```jsx
import { ProductForm } from "./components/ProductForm"
import { deleteProduct } from "./api/products"
// …
const [editing, setEditing] = useState(null)
const [flash, setFlash] = useState(null)
const [deletingId, setDeletingId] = useState(null)
```

Add the handlers:

```jsx
  function handleSaved(saved, action) {
    setFlash(`${saved.title} ${action}. (DummyJSON simulates writes — a refresh restores the original data.)`)
    setEditing(null)
    // Merge the server's version into the list rather than re-fetching.
    setProducts((current) => {
      const exists = current.some((p) => p.id === saved.id)
      return exists
        ? current.map((p) => (p.id === saved.id ? { ...p, ...saved } : p))
        : [saved, ...current]
    })
  }

  async function handleDelete(product) {
    if (!window.confirm(`Delete “${product.title}”?`)) return
    try {
      setDeletingId(product.id)
      await deleteProduct(product.id)
      setProducts((current) => current.filter((p) => p.id !== product.id))
      setTotal((t) => Math.max(0, t - 1))
      setFlash(`${product.title} deleted.`)
    } catch (err) {
      setError(err)
    } finally {
      setDeletingId(null)
    }
  }
```

Render the form, the flash message, and the new card props:

```jsx
      {flash && <div className="notice ok">{flash}</div>}

      <ProductForm
        editing={editing}
        categories={categories}
        onSaved={handleSaved}
        onCancel={() => setEditing(null)}
      />
// …
        <ProductCard
          key={p.id}
          product={p}
          onSelect={setSelectedId}
          onEdit={setEditing}
          onDelete={handleDelete}
          busy={deletingId === p.id}
        />
```

> **Try it yourself:** open the Network tab and create a product. Inspect the request — **Payload** shows your JSON, **Headers** shows `Content-Type: application/json`, and the response carries a brand-new `id` (195 or higher, because DummyJSON has 194 products). Now switch the `createProduct` call to send `price: form.price` (a string) and watch the response echo a string back. Type coercion at the boundary is your job.

---

# 13. Request interceptors & authentication

An interceptor is a function that runs on **every** request (or response) passing through an instance. It's the axios feature that justifies the dependency.

```js
api.interceptors.request.use(
  (config) => {
    // runs before the request is sent — mutate and return the config
    return config
  },
  (error) => Promise.reject(error)   // rarely used: a failure building the request
)
```

**You must return the config.** Forget it and every request in your app silently fails with a baffling error. It's the number one interceptor bug.

### What belongs in a request interceptor

- Attaching an auth token
- A correlation/request id for tracing
- Locale or tenant headers
- Dev-only logging

### The auth-token interceptor

```js
api.interceptors.request.use((config) => {
  const token = tokenStore.getAccess()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

**Why this beats `api.defaults.headers.common.Authorization = …`:** the interceptor reads the token *at request time*. Set a default and you have to remember to update it on login, on logout, and after every refresh — and any request already configured keeps the old value. The interceptor has no stale state to get wrong.

### Where to keep the token

| Location | Survives refresh | XSS-readable | Notes |
|---|---|---|---|
| Memory (a module variable) | No | No | Safest; user re-authenticates on reload |
| `sessionStorage` | Per-tab | **Yes** | Common compromise |
| `localStorage` | Yes | **Yes** | Most common; most criticised |
| `httpOnly` cookie | Yes | **No** | Best, but the server must set it, and you need CSRF defence |

The honest summary: **an httpOnly cookie set by your backend is the right answer** for a real product. `localStorage` is what most tutorials and many production apps use, and it means any XSS in your app (or in any dependency) can exfiltrate the token. We'll use `localStorage` here because DummyJSON is token-based and this is a workshop — with the trade-off stated out loud, which is what a professional does. See [§24](#24-security-tokens-cors-xsrf).

## 🔨 Build Step 11 — Log in

Create **`src/api/tokenStore.js`**:

```js
const ACCESS = "shopscope.accessToken"
const REFRESH = "shopscope.refreshToken"
const USER = "shopscope.user"

/**
 * localStorage is XSS-readable. In production prefer an httpOnly cookie
 * issued by your own backend. See §24.
 */
export const tokenStore = {
  getAccess: () => localStorage.getItem(ACCESS),
  getRefresh: () => localStorage.getItem(REFRESH),

  getUser() {
    try {
      return JSON.parse(localStorage.getItem(USER) ?? "null")
    } catch {
      return null
    }
  },

  set({ accessToken, refreshToken, user }) {
    if (accessToken) localStorage.setItem(ACCESS, accessToken)
    if (refreshToken) localStorage.setItem(REFRESH, refreshToken)
    if (user) localStorage.setItem(USER, JSON.stringify(user))
  },

  clear() {
    localStorage.removeItem(ACCESS)
    localStorage.removeItem(REFRESH)
    localStorage.removeItem(USER)
  },
}
```

Create **`src/api/auth.js`**:

```js
import { api, bareApi } from "./client"
import { tokenStore } from "./tokenStore"

export async function login({ username, password }) {
  // Short expiry on purpose: it makes the refresh flow in §15 easy to observe.
  const { data } = await api.post("/auth/login", { username, password, expiresInMins: 1 })
  const { accessToken, refreshToken, ...user } = data
  tokenStore.set({ accessToken, refreshToken, user })
  return user
}

/** Requires a valid access token — the request interceptor supplies it. */
export async function getMe({ signal } = {}) {
  const { data } = await api.get("/auth/me", { signal })
  return data
}

/**
 * Uses bareApi so a failed refresh can't re-enter the 401 response
 * interceptor that triggered it. See §15.
 */
export async function refreshTokens() {
  const refreshToken = tokenStore.getRefresh()
  if (!refreshToken) throw new Error("No refresh token")

  const { data } = await bareApi.post("/auth/refresh", { refreshToken, expiresInMins: 1 })
  tokenStore.set({ accessToken: data.accessToken, refreshToken: data.refreshToken })
  return data.accessToken
}

export function logout() {
  tokenStore.clear()
}
```

Add the interceptor to **`src/api/client.js`** (append below the two instances):

```js
import { tokenStore } from "./tokenStore"

api.interceptors.request.use((config) => {
  const token = tokenStore.getAccess()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  if (import.meta.env.DEV) {
    console.debug(`→ ${config.method?.toUpperCase()} ${config.baseURL ?? ""}${config.url}`)
  }

  return config     // ← never forget this line
})
```

Create **`src/components/LoginForm.jsx`**:

```jsx
import { useState } from "react"
import { login } from "../api/auth"
import { ErrorNotice } from "./ErrorNotice"

export function LoginForm({ onLoggedIn }) {
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
    <form onSubmit={handleSubmit} className="toolbar" style={{ margin: 0 }}>
      <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button className="primary" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      {error && <ErrorNotice error={error} />}
    </form>
  )
}
```

Add an auth bar to **`src/App.jsx`**:

```jsx
import { LoginForm } from "./components/LoginForm"
import { logout } from "./api/auth"
import { tokenStore } from "./api/tokenStore"
// …
const [user, setUser] = useState(() => tokenStore.getUser())   // lazy init: read storage once
// …just under the <h1>:
      <div className="toolbar">
        {user ? (
          <>
            <img src={user.image} alt="" width={28} height={28} style={{ borderRadius: "50%" }} />
            <span>Signed in as <strong>{user.firstName}</strong></span>
            <button onClick={() => { logout(); setUser(null) }}>Sign out</button>
          </>
        ) : (
          <LoginForm onLoggedIn={setUser} />
        )}
      </div>
```

> **Try it yourself:** sign in, then check the Network tab. Every subsequent request — including the product list, which doesn't need it — now carries an `Authorization` header. That's the interceptor. Then sign in with a wrong password: DummyJSON returns **400** with `{"message": "Invalid credentials"}`, and your `toMessage` surfaces exactly that sentence instead of "Request failed with status code 400".

---

# 14. Response interceptors & error normalisation

The mirror image of a request interceptor — two functions, one per outcome:

```js
api.interceptors.response.use(
  (response) => {
    // any 2xx
    return response
  },
  (error) => {
    // any non-2xx, plus network errors and timeouts
    return Promise.reject(error)      // ← re-reject, or the error vanishes
  }
)
```

**Both branches must return.** Return nothing from the success handler and `response` becomes `undefined` at every call site. Fail to re-reject in the error handler and failures silently resolve — the worst possible bug, because everything *looks* fine.

### Good uses

**Central error logging:**

```js
api.interceptors.response.use(null, (error) => {
  if (!axios.isCancel(error)) {
    reportToSentry(error, {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
    })
  }
  return Promise.reject(error)
})
```

(Passing `null` as the first argument means "leave successful responses alone".)

**Attaching a friendly message once**, so components never have to know the error shape:

```js
api.interceptors.response.use(null, (error) => {
  error.friendlyMessage = toMessage(error)
  return Promise.reject(error)
})
```

**Global 401 → sign out:**

```js
api.interceptors.response.use(null, (error) => {
  if (error.response?.status === 401) {
    tokenStore.clear()
    window.dispatchEvent(new Event("auth:logout"))
  }
  return Promise.reject(error)
})
```

A DOM event rather than `window.location.href = "/login"` keeps the API layer from reaching into routing. React subscribes and reacts.

### One thing to resist

Unwrapping `response.data` globally:

```js
// ✗ Tempting, and a trap
api.interceptors.response.use((response) => response.data)
```

It looks tidy and it costs you `status`, `headers`, and every downstream interceptor's assumption that it's holding a response object. It also breaks TypeScript's `AxiosResponse<T>` typing and confuses anyone who has used axios before. Unwrap in the service layer instead — that's what the service layer is for.

### Order of execution

- **Request interceptors run bottom-up** (last registered runs first).
- **Response interceptors run top-down** (first registered runs first).

You'll rarely depend on this, but when two interceptors interact it's the first thing to check. You can also remove one:

```js
const id = api.interceptors.request.use(fn)
api.interceptors.request.eject(id)
```

## 🔨 Build Step 12 — Central error handling

Append to **`src/api/client.js`**:

```js
import { toMessage } from "../lib/errors"

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error)      // silent, expected, no logging
    }

    // Computed once, here, so no component has to know the error shape.
    error.friendlyMessage = toMessage(error)

    if (import.meta.env.DEV) {
      console.warn(
        `✗ ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
        error.response?.status ?? error.code,
        error.response?.data
      )
    }

    return Promise.reject(error)
  }
)
```

Simplify **`src/components/ErrorNotice.jsx`** to prefer the pre-computed message:

```jsx
const message = error?.friendlyMessage ?? toMessage(error)
```

Keeping the `toMessage` fallback matters: errors thrown by code outside axios (a `throw new Error("No refresh token")` in `auth.js`, for instance) never pass through the interceptor.

---

# 15. Handling 401 with a token-refresh queue

Access tokens are deliberately short-lived. When one expires the API returns **401**, and the user should not be thrown back to a login screen — the app should quietly get a new token and retry.

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

Three bugs, all of which will bite in production:

1. **Infinite loop.** If the retry also 401s, the interceptor fires again. Forever.
2. **Refresh stampede.** Six requests in flight when the token expires → six parallel refresh calls. Most backends invalidate the old refresh token on use, so five of them fail and log the user out.
3. **The refresh call itself can 401**, re-entering the interceptor that called it.

## The version that works

```js
let refreshPromise = null      // module-scoped: the shared in-flight refresh

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const status = error.response?.status

    const shouldTryRefresh =
      status === 401 &&
      original &&
      !original._retry &&                            // (1) only once per request
      !original.url?.includes("/auth/")               // (3) never for auth endpoints

    if (!shouldTryRefresh) return Promise.reject(error)

    original._retry = true

    try {
      // (2) All concurrent 401s await the SAME refresh promise.
      refreshPromise ??= refreshTokens().finally(() => {
        refreshPromise = null
      })
      const accessToken = await refreshPromise

      original.headers.Authorization = `Bearer ${accessToken}`
      return api(original)                            // replay the original request
    } catch (refreshError) {
      tokenStore.clear()
      window.dispatchEvent(new Event("auth:logout"))
      return Promise.reject(refreshError)
    }
  }
)
```

Read the three fixes back:

1. **`original._retry`** — a custom flag on the config object. Second time round, `shouldTryRefresh` is false and the error propagates normally. One retry, never two.
2. **`refreshPromise ??=`** — the first 401 creates the promise; every other 401 in that window awaits the same one. One network call, everyone gets the token. `.finally()` clears it so the *next* expiry starts fresh.
3. **`bareApi` inside `refreshTokens`** (from Build Step 11) plus the `/auth/` URL check — the refresh request cannot recurse into this handler.

And when refresh genuinely fails — revoked token, user deleted — clear everything and tell the app once.

> **Register this interceptor after the logging one from §14.** Response interceptors run in registration order, so the logger sees the 401 (useful) and the refresh handler decides what to do about it.

## 🔨 Build Step 13 — Silent refresh

Append to **`src/api/client.js`** (after the §14 interceptor):

```js
import { refreshTokens } from "./auth"

let refreshPromise = null

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const shouldTryRefresh =
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes("/auth/")

    if (!shouldTryRefresh) return Promise.reject(error)

    original._retry = true

    try {
      refreshPromise ??= refreshTokens().finally(() => {
        refreshPromise = null
      })
      const accessToken = await refreshPromise
      original.headers.Authorization = `Bearer ${accessToken}`
      return api(original)
    } catch (refreshError) {
      tokenStore.clear()
      window.dispatchEvent(new Event("auth:logout"))
      return Promise.reject(refreshError)
    }
  }
)
```

> **Circular imports:** `client.js` imports `refreshTokens` from `auth.js`, which imports `api`/`bareApi` from `client.js`. ES modules handle this because the import is only *called* at runtime, long after both modules have finished evaluating. If your bundler complains, move the interceptor registration into its own `src/api/interceptors.js` imported from `main.jsx` — a cleaner structure for a larger app anyway.

Now let the UI hear the logout event. In **`src/App.jsx`**:

```jsx
  useEffect(() => {
    function handleForcedLogout() {
      setUser(null)
      setFlash("Your session expired. Please sign in again.")
    }
    window.addEventListener("auth:logout", handleForcedLogout)
    return () => window.removeEventListener("auth:logout", handleForcedLogout)
  }, [])
```

Add a button that exercises the whole flow — put it in the auth bar, next to Sign out:

```jsx
<button onClick={() => getMe().then((me) => setFlash(`/auth/me says: ${me.email}`))}>
  Who am I?
</button>
```

(Import `getMe` from `./api/auth`.)

> **Try it yourself — the payoff of this whole section.** We set `expiresInMins: 1` in `login()`. So:
> 1. Sign in. Click **Who am I?** → your email appears. One request in the Network tab.
> 2. Wait ~70 seconds.
> 3. Click **Who am I?** again. The UI behaves identically — but the Network tab shows **three** requests: `/auth/me` → **401**, `/auth/refresh` → **200**, `/auth/me` → **200**.
>
> The user saw a working button. That's the entire point of interceptors. Now click it three times rapidly right after expiry and confirm there is still only **one** `/auth/refresh` — that's the `refreshPromise ??=` line earning its keep.

---

# 16. Custom hooks: `useApi`

Count the fetch effects in the app now: `App` has two, `ProductDetail` has one. Each is ~20 lines of identical ceremony — loading, error, abort, `isCancel`, aborted-check. That's the signal to extract a hook.

A custom hook is just a function starting with `use` that calls other hooks. Nothing more.

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
        setError(err)
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

**Why `deps` is a parameter rather than `[fetcher]`.** A new arrow function is created on every render, so depending on `fetcher` directly would refetch forever. Passing explicit deps hands that judgement to the caller, exactly like `useEffect`.

**Why the eslint disable.** The exhaustive-deps rule can't analyse a spread array. This is the standard trade-off in every `useApi`-style hook, and it's the one place you must be disciplined yourself: **if the fetcher closes over a value, that value goes in `deps`.** Forget it and you'll serve stale data with no warning.

**Why `setData` is returned.** Mutations need to update the list without a round trip (see [§17](#17-optimistic-updates)).

> **Where this ends.** A hook like this handles one component's request. It does not cache, dedupe across components, revalidate on focus, or share state between two components asking for the same thing. Once you need any of that, stop growing the hook and adopt TanStack Query — [§21](#21-axios--tanstack-query).

## 🔨 Build Step 14 — Refactor onto `useApi`

Create **`src/hooks/useApi.js`** with the hook above.

Rewrite **`src/App.jsx`** completely — this is the consolidated version of everything so far:

```jsx
import { useCallback, useEffect, useState } from "react"
import { listProducts, listCategories, deleteProduct } from "./api/products"
import { getMe, logout } from "./api/auth"
import { tokenStore } from "./api/tokenStore"
import { useApi } from "./hooks/useApi"
import { useDebouncedValue } from "./hooks/useDebouncedValue"
import { ProductCard } from "./components/ProductCard"
import { ProductDetail } from "./components/ProductDetail"
import { ProductForm } from "./components/ProductForm"
import { LoginForm } from "./components/LoginForm"
import { CardSkeletons } from "./components/Spinner"
import { ErrorNotice } from "./components/ErrorNotice"

const PAGE_SIZE = 12

export default function App() {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("")
  const [page, setPage] = useState(0)
  const [selectedId, setSelectedId] = useState(null)
  const [editing, setEditing] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [flash, setFlash] = useState(null)
  const [user, setUser] = useState(() => tokenStore.getUser())

  const debouncedQuery = useDebouncedValue(query, 400)

  const fetchProducts = useCallback(
    (signal) => listProducts({ q: debouncedQuery, category, page, limit: PAGE_SIZE, signal }),
    [debouncedQuery, category, page]
  )

  const {
    data: result,
    loading,
    error,
    reload,
    setData: setResult,
  } = useApi(fetchProducts, [debouncedQuery, category, page])

  const { data: categories } = useApi((signal) => listCategories({ signal }), [], {
    initialData: [],
  })

  useEffect(() => {
    setPage(0)
  }, [debouncedQuery, category])

  useEffect(() => {
    function handleForcedLogout() {
      setUser(null)
      setFlash("Your session expired. Please sign in again.")
    }
    window.addEventListener("auth:logout", handleForcedLogout)
    return () => window.removeEventListener("auth:logout", handleForcedLogout)
  }, [])

  const products = result?.products ?? []
  const total = result?.total ?? 0
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1)

  function handleSaved(saved, action) {
    setFlash(`${saved.title} ${action}. (DummyJSON simulates writes — refresh to reset.)`)
    setEditing(null)
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

  async function handleDelete(product) {
    if (!window.confirm(`Delete “${product.title}”?`)) return
    try {
      setDeletingId(product.id)
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
      setFlash(`${product.title} deleted.`)
    } catch (err) {
      setFlash(err.friendlyMessage ?? "Delete failed.")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="app">
      <h1>ShopScope</h1>
      <p className="muted">Step 14 — every request goes through one hook, one client, one service layer.</p>

      <div className="toolbar">
        {user ? (
          <>
            <img src={user.image} alt="" width={28} height={28} style={{ borderRadius: "50%" }} />
            <span>Signed in as <strong>{user.firstName}</strong></span>
            <button onClick={() => getMe().then((me) => setFlash(`/auth/me says: ${me.email}`))}>
              Who am I?
            </button>
            <button onClick={() => { logout(); setUser(null) }}>Sign out</button>
          </>
        ) : (
          <LoginForm onLoggedIn={setUser} />
        )}
      </div>

      {flash && (
        <div className="notice ok">
          <div className="row">
            <span>{flash}</span>
            <button onClick={() => setFlash(null)}>Dismiss</button>
          </div>
        </div>
      )}

      <ProductForm
        editing={editing}
        categories={categories ?? []}
        onSaved={handleSaved}
        onCancel={() => setEditing(null)}
      />

      <div className="toolbar">
        <input
          className="grow"
          placeholder="Search products…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} disabled={!!query}>
          <option value="">All categories</option>
          {(categories ?? []).map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
        <span className="muted">{total} results</span>
      </div>

      {error && <ErrorNotice error={error} onRetry={reload} />}

      {loading ? (
        <CardSkeletons count={PAGE_SIZE} />
      ) : products.length === 0 ? (
        <div className="notice info">Nothing matches those filters.</div>
      ) : (
        <div className="grid">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onSelect={setSelectedId}
              onEdit={setEditing}
              onDelete={handleDelete}
              busy={deletingId === p.id}
            />
          ))}
        </div>
      )}

      <div className="toolbar" style={{ justifyContent: "center" }}>
        <button disabled={page === 0 || loading} onClick={() => setPage((p) => p - 1)}>← Previous</button>
        <span className="muted">Page {page + 1} of {lastPage + 1}</span>
        <button disabled={page >= lastPage || loading} onClick={() => setPage((p) => p + 1)}>Next →</button>
      </div>

      {selectedId && <ProductDetail id={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  )
}
```

Simplify **`src/components/ProductDetail.jsx`** the same way — the whole effect collapses to three lines:

```jsx
import { useCallback } from "react"
import { getProduct } from "../api/products"
import { useApi } from "../hooks/useApi"
import { ErrorNotice } from "./ErrorNotice"

export function ProductDetail({ id, onClose }) {
  const fetcher = useCallback((signal) => getProduct(id, { signal }), [id])
  const { data: product, loading, error, reload } = useApi(fetcher, [id])

  return (
    <aside className="drawer">
      <div className="row">
        <h2 style={{ margin: 0, fontSize: 18 }}>Product #{id}</h2>
        <button onClick={onClose}>Close</button>
      </div>

      {loading && (
        <div className="stack" style={{ marginTop: 16 }}>
          <div className="skeleton" style={{ height: 180 }} />
          <div className="skeleton" style={{ height: 16 }} />
          <div className="skeleton" style={{ height: 16, width: "60%" }} />
        </div>
      )}

      {error && <ErrorNotice error={error} onRetry={reload} />}

      {product && !loading && (
        <div className="stack" style={{ marginTop: 16 }}>
          <img src={product.thumbnail} alt="" style={{ width: "100%", objectFit: "contain" }} />
          <h3 style={{ margin: 0 }}>{product.title}</h3>
          <p className="muted" style={{ margin: 0 }}>{product.description}</p>
          <div className="row">
            <strong>${product.price}</strong>
            <span className="muted">★ {product.rating} · {product.stock} in stock</span>
          </div>
          <div className="muted">{product.brand ?? "No brand"} · {product.category}</div>
        </div>
      )}
    </aside>
  )
}
```

`useCallback` around the fetcher is not decoration: without it, a new function each render would make the hook's identity churn. With explicit `deps` passed alongside, the hook stays honest.

---

# 17. Optimistic updates

Right now, deleting a product means: click → spinner → 400 ms → gone. **Optimistic** means: click → gone → (quietly confirm with the server) → put it back if the server disagrees.

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

**When it's right:** high-probability, low-stakes, reversible actions. Toggling a like. Marking done. Reordering. Deleting from a list.

**When it's wrong:** payments, anything where the server computes the result you're about to display (a new id, a total, a tax figure), and anything where a silent rollback would confuse more than a spinner. If you can't render the outcome without the server's answer, wait for the server's answer.

**Rollback must be visible.** An item that silently reappears looks like a bug. Say what happened.

## 🔨 Build Step 15 — Optimistic delete

Replace `handleDelete` in **`src/App.jsx`**:

```jsx
  async function handleDelete(product) {
    if (!window.confirm(`Delete “${product.title}”?`)) return

    const snapshot = result                                   // 1. snapshot

    setResult((current) =>                                    // 2. apply immediately
      current
        ? {
            ...current,
            products: current.products.filter((p) => p.id !== product.id),
            total: Math.max(0, current.total - 1),
          }
        : current
    )
    setFlash(`${product.title} deleted.`)

    try {
      await deleteProduct(product.id)                         // 3. confirm
    } catch (err) {
      setResult(snapshot)                                     // 4. roll back
      setFlash(`Couldn't delete ${product.title} — ${err.friendlyMessage ?? "try again"}. It's back in the list.`)
    }
  }
```

You can drop `deletingId` now: there is no in-flight state to show, because the UI already moved on.

> **Try it yourself:** force the failure path. Temporarily change `deleteProduct` to hit `/products/999999` (a 404), and confirm the card vanishes, then reappears with an explanation. That reappearance is the part people forget to build — and the part users notice.

---

# 18. Upload & download progress

## Uploads

Files go up as `multipart/form-data`, which means `FormData`:

```js
const form = new FormData()
form.append("file", file)              // file from <input type="file">
form.append("productId", "101")        // other fields ride along

await api.post("/upload", form, {
  onUploadProgress: (event) => {
    if (!event.total) return           // total is unknown for chunked bodies
    const percent = Math.round((event.loaded / event.total) * 100)
    setProgress(percent)
  },
})
```

**Do not set `Content-Type` yourself.** The header must include a generated boundary (`multipart/form-data; boundary=----WebKitFormBoundary…`). The browser knows it; you don't. Setting it manually is the most common upload bug there is.

Our `api` instance sets a default `Content-Type: application/json`, so for uploads override it to `undefined` and let the browser fill it in:

```js
await api.post("/upload", form, { headers: { "Content-Type": undefined } })
```

Other upload details worth having:

```js
{
  timeout: 0,                          // a 10s timeout will kill a large upload
  signal: controller.signal,           // give the user a Cancel button
  onUploadProgress: (e) => { … },
}
```

`event.loaded === event.total` means **the bytes have left the browser**, not that the server is done. There's usually a pause at 100% while the server processes. Label it "Processing…" rather than leaving a full bar looking stuck.

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

`onDownloadProgress` only reports a percentage if the server sends `Content-Length`. With `Transfer-Encoding: chunked`, `event.total` is `0` and you can only show bytes received.

## 🔨 Build Step 16 — Upload with a progress bar

DummyJSON has no upload endpoint, so we'll post to `https://httpbin.org/post`, which echoes back whatever it receives — ideal for seeing exactly what your request looked like.

Create **`src/components/Uploader.jsx`**:

```jsx
import { useRef, useState } from "react"
import axios from "axios"
import { ErrorNotice } from "./ErrorNotice"

export function Uploader() {
  const [file, setFile] = useState(null)
  const [progress, setProgress] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const controllerRef = useRef(null)

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

      // A dedicated call, not our `api` instance: different host, no timeout,
      // and we must NOT send the instance's JSON Content-Type.
      const { data } = await axios.post("https://httpbin.org/post", form, {
        signal: controller.signal,
        timeout: 0,
        onUploadProgress: (event) => {
          if (!event.total) return
          setProgress(Math.round((event.loaded / event.total) * 100))
        },
      })

      setResult({ size: file.size, echoedFields: Object.keys(data.form ?? {}) })
    } catch (err) {
      if (axios.isCancel(err)) {
        setError(null)
        setResult(null)
      } else {
        setError(err)
      }
    } finally {
      setProgress(null)
      controllerRef.current = null
    }
  }

  const uploading = progress !== null

  return (
    <div className="card stack" style={{ marginBottom: 16 }}>
      <strong>Upload a product image</strong>

      <div className="toolbar" style={{ margin: 0 }}>
        <input
          type="file"
          className="grow"
          disabled={uploading}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <button className="primary" onClick={handleUpload} disabled={!file || uploading}>
          Upload
        </button>
        {uploading && <button onClick={() => controllerRef.current?.abort()}>Cancel</button>}
      </div>

      {uploading && (
        <>
          <div className="bar"><div style={{ width: `${progress}%` }} /></div>
          <span className="muted">
            {progress < 100 ? `Uploading… ${progress}%` : "Processing on the server…"}
          </span>
        </>
      )}

      {error && <ErrorNotice error={error} />}
      {result && (
        <div className="notice ok">
          Uploaded {(result.size / 1024).toFixed(1)} kB. httpbin echoed fields:{" "}
          {result.echoedFields.join(", ") || "(binary part only)"}
        </div>
      )}
    </div>
  )
}
```

Render `<Uploader />` in **`src/App.jsx`**, just above `<ProductForm … />`.

> **Try it yourself:** a small file finishes before you can read the bar. Use a 5–20 MB file and throttle to Slow 3G — now the progress bar and the Cancel button both mean something. Inspect the request in the Network tab: `Content-Type: multipart/form-data; boundary=----WebKitFormBoundary…`, set by the browser, exactly as promised.

---

# 19. Timeouts & retries

## Timeouts

```js
export const api = axios.create({ timeout: 10000 })
```

Rough guidance: **5–10 s** for normal API calls, **30–60 s** for reports and exports, **`0`** (unlimited) for uploads and downloads. A timeout that's too short turns slow-network users into error-screen users; one that's too long makes a dead backend look like a frozen app.

## Retries

**Only retry what is safe to repeat.**

| Situation | Retry? |
|---|---|
| Network error (no response) | Yes |
| 408 Request Timeout, 429 Too Many Requests | Yes (respect `Retry-After` on 429) |
| 500, 502, 503, 504 | Yes for `GET`/`PUT`/`DELETE` — idempotent |
| Any 4xx other than 408/429 | **No** — repeating won't change the answer |
| A failed `POST` | **No**, unless the endpoint takes an idempotency key |

That last row matters: a `POST` that timed out may well have succeeded, with only the response lost. Retrying creates a duplicate order.

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
    axiosRetry.isNetworkOrIdempotentRequestError(error) ||
    error.response?.status === 429,
})
```

The default `retryCondition` already excludes `POST` and non-idempotent failures — the sensible default, and a good reason to use the library instead of your own loop.

### By hand, if you'd rather not add a dependency

```js
export async function withRetry(fn, { attempts = 3, baseDelay = 500 } = {}) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      const status = err.response?.status
      const retryable = !err.response || status === 429 || status >= 500
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

**Exponential backoff with jitter** is not a detail. Fixed-interval retries from thousands of clients is a self-inflicted DDoS on a server that was already struggling.

Cap it at 2–3 attempts in a UI. Beyond that the user is staring at a spinner while you politely hammer a dead service — show the error and a Retry button, and let them decide.

---

# 20. Concurrency: sequencing, limiting, deduping

## Sequential when dependent, parallel when not

```js
// Dependent — the second needs the first's result
const user = await getMe()
const carts = await getCartsForUser(user.id)

// Independent — don't make them queue
const [products, categories] = await Promise.all([listProducts(), listCategories()])
```

## Limiting parallelism

Firing 200 requests at once will hit browser connection limits (6 per host over HTTP/1.1) and may trip server rate limits. Batch instead:

```js
export async function inBatches(items, size, worker) {
  const results = []
  for (let i = 0; i < items.length; i += size) {
    const batch = items.slice(i, i + size)
    results.push(...(await Promise.all(batch.map(worker))))
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

// usage
dedupe("categories", () => listCategories())
```

Same trick as the refresh queue in §15: **one shared promise, many awaiters.**

## Keeping only the latest response

Cancellation is the right tool. If you can't cancel — say, the work isn't an HTTP request — a sequence number works:

```js
const latest = useRef(0)

async function search(q) {
  const id = ++latest.current
  const data = await listProducts({ q })
  if (id !== latest.current) return    // a newer search already started; drop this
  setResults(data.products)
}
```

Notice that §20 is where the hand-rolled approach starts to feel like rebuilding a library. It is. Which brings us to:

---

# 21. axios + TanStack Query

Everything from §16 onward — loading state, caching, dedupe, retry, invalidation — is a solved problem. **TanStack Query** solves it, and axios remains the transport underneath. They are complements, not alternatives.

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
    <App />
  </QueryClientProvider>
)
```

Your service layer doesn't change at all — that's the payoff for having built one:

```jsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { listProducts, deleteProduct } from "./api/products"

function ProductList({ q, page }) {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["products", { q, page }],           // changes → refetch, and it's the cache key
    queryFn: ({ signal }) => listProducts({ q, page, signal }),   // signal provided for you
    placeholderData: (previous) => previous,       // keep old page visible while loading the next
  })

  const queryClient = useQueryClient()

  const remove = useMutation({
    mutationFn: (id) => deleteProduct(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  })

  if (isPending) return <CardSkeletons />
  if (error) return <ErrorNotice error={error} onRetry={refetch} />
  // …
}
```

What you get for free, all of which we hand-rolled:

- **Caching** keyed by `queryKey` — revisit a page and it's instant
- **Deduplication** — ten components, one request
- **`signal` supplied automatically** — cancellation, correctly, everywhere
- **Retry with backoff**
- **Refetch on window focus / reconnect**
- **`isFetching` vs `isPending`** — background refresh without a jarring spinner
- **Optimistic updates with rollback** via `onMutate` / `onError`

The mental model shift: **server state is not client state.** It's a cached copy of something that lives elsewhere, can go stale, and needs revalidating. `useState` + `useEffect` models it as if you owned it. You don't.

**Was building it by hand a waste?** No. You now know what the library is doing and why, which is the difference between using it and cargo-culting it. But for anything beyond a small app, reach for the library.

---

# 22. axios with TypeScript

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
data.total                // ✓ number
```

**A warning you must internalise:** this generic is a *claim*, not a *check*. axios does not validate the response at runtime. If the backend renames `title` to `name`, TypeScript stays happy and your app crashes in production. For anything you don't control, parse at the boundary:

```ts
import { z } from "zod"

const ProductSchema = z.object({
  id: z.number(),
  title: z.string(),
  price: z.number(),
})

export async function getProduct(id: number): Promise<Product> {
  const { data } = await api.get(`/products/${id}`)
  return ProductSchema.parse(data)     // throws with a precise message if the shape drifted
}
```

## Typing a service function

```ts
import type { AxiosRequestConfig } from "axios"

interface ListParams {
  q?: string
  category?: string
  page?: number
  limit?: number
  signal?: AbortSignal
}

export async function listProducts({
  q = "",
  category = "",
  page = 0,
  limit = 12,
  signal,
}: ListParams = {}): Promise<ProductListResponse> {
  const params: Record<string, string | number> = { limit, skip: page * limit }
  if (q) params.q = q

  const { data } = await api.get<ProductListResponse>(q ? "/products/search" : "/products", {
    params,
    signal,
  })
  return data
}
```

## Typing errors

`catch` gives you `unknown`. Narrow it:

```ts
import axios from "axios"

interface ApiErrorBody {
  message: string
}

try {
  await getProduct(1)
} catch (err) {
  if (axios.isAxiosError<ApiErrorBody>(err)) {
    const message = err.response?.data.message ?? err.message   // ✓ typed
    const status = err.response?.status
  } else {
    throw err
  }
}
```

`isAxiosError` is a **type guard** — it narrows inside the branch. The generic parameter types `err.response.data`.

## Typing a custom config field

The `_retry` flag from §15 doesn't exist in axios's types. Declare it:

```ts
// src/types/axios.d.ts
import "axios"

declare module "axios" {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean
  }
}
```

## Typing the hook

```ts
interface UseApiResult<T> {
  data: T | null
  loading: boolean
  error: unknown
  reload: () => void
  setData: React.Dispatch<React.SetStateAction<T | null>>
}

export function useApi<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: unknown[] = [],
  options: { skip?: boolean; initialData?: T | null } = {}
): UseApiResult<T> {
  // …same body
}
```

Call it and `data` is `ProductListResponse | null`, inferred from the fetcher. No annotation needed at the call site.

---

# 23. Testing & mocking HTTP

Never let tests hit the real network: slow, flaky, and rate-limited.

## MSW — the recommended approach

[Mock Service Worker](https://mswjs.io) intercepts at the network layer, so your code runs completely unmodified — same axios instance, same interceptors, same everything.

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
      total: 1,
      skip: 0,
      limit: 12,
    })
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

`onUnhandledRequest: "error"` is the setting that earns its keep: any request you forgot to mock fails loudly instead of silently escaping to the internet.

```jsx
// src/App.test.jsx
import { render, screen } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { expect, test } from "vitest"
import { server } from "./test/server"
import App from "./App"

test("renders products from the API", async () => {
  render(<App />)
  expect(await screen.findByText("Test Widget")).toBeInTheDocument()
})

test("shows a friendly message when the server fails", async () => {
  server.use(
    http.get("https://dummyjson.com/products", () =>
      HttpResponse.json({ message: "boom" }, { status: 500 })
    )
  )

  render(<App />)
  expect(await screen.findByText(/something broke on our end/i)).toBeInTheDocument()
})
```

`server.use()` overrides a handler **for one test only** — the cleanest way to test error paths.

## Unit-testing a service function

```js
import { vi, expect, test } from "vitest"
import { api } from "./client"
import { listProducts } from "./products"

test("search hits the search endpoint with q", async () => {
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

Note this asserts `skip: 20` — the `page * limit` arithmetic is exactly the kind of off-by-one that a unit test should pin down.

## `axios-mock-adapter`

```js
import MockAdapter from "axios-mock-adapter"

const mock = new MockAdapter(api)
mock.onGet("/products").reply(200, { products: [], total: 0 })
mock.onPost("/products/add").networkError()
```

Convenient, and it hooks into the axios adapter rather than the network — which means it bypasses part of what you're trying to test. Prefer MSW for component tests; this is fine for quick service-level checks.

## What's worth testing

- Services build the right URL, params, and body
- Components render all three states (loading, error, success)
- The error mapper turns each status into the right sentence
- Interceptors attach the token, and the 401 path refreshes exactly once
- Optimistic updates roll back on failure

**Don't** test that axios can make an HTTP request. That's axios's job.

---

# 24. Security: tokens, CORS, XSRF

## Token storage, honestly

| Approach | XSS risk | CSRF risk | Verdict |
|---|---|---|---|
| `localStorage` | **High** — any script can read it | None | Common, and the weakest option |
| Memory only | Low | None | Good; user re-auths on refresh |
| `httpOnly` cookie | **None** — JS can't read it | Yes — needs mitigation | Best, with `SameSite=Lax` + CSRF token |

If you take one thing from this section: **any XSS in your app, or in any of your thousand transitive dependencies, can read `localStorage` and exfiltrate the token.** For a workshop that's fine. For a banking app it isn't.

## Cookies and `withCredentials`

Cookies are **not** sent on cross-origin requests unless you ask:

```js
export const api = axios.create({
  baseURL: "https://api.example.com",
  withCredentials: true,
})
```

And the server must cooperate:

```
Access-Control-Allow-Origin: https://app.example.com   ← a specific origin, not *
Access-Control-Allow-Credentials: true
```

`Access-Control-Allow-Origin: *` **cannot** be combined with credentials. The browser rejects the pair. This exact mismatch is the cause of an enormous share of "it works in Postman but not in the browser" tickets.

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

CORS is enforced by the **browser**, configured by the **server**. There is nothing you can add to an axios config to fix a CORS error — not a header, not a flag. Options, in order of preference: (1) the API adds your origin to `Access-Control-Allow-Origin`; (2) you proxy through your own backend; (3) in development, use Vite's proxy:

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

Then set `baseURL: "/api"` and the browser sees a same-origin request. **Dev only** — production needs a real server-side proxy or proper CORS headers.

For a **preflight** (`OPTIONS`) request you'll see an extra round trip before your real one. Custom headers, `PUT`/`PATCH`/`DELETE`, and JSON content types all trigger it. That's normal — it just means the browser is asking permission first.

## The rest of the checklist

- **Never put secrets in frontend code.** Anything in the bundle or in `.env` is public. Server-side proxy or nothing.
- **HTTPS everywhere.** A token over plain HTTP is a token you've given away.
- **Never log tokens**, including into error-reporting tools. Redact `Authorization` before it leaves the browser.
- **Don't build URLs from unsanitised user input** — `encodeURIComponent` on every interpolated segment.
- **Treat responses as untrusted.** Never `dangerouslySetInnerHTML` with server HTML you haven't sanitised.

---

# 25. Final project structure

```
src/
├── api/
│   ├── client.js          # axios instances + all interceptors
│   ├── tokenStore.js      # where the tokens live
│   ├── auth.js            # login, refresh, getMe, logout
│   └── products.js        # list, get, create, update, delete
├── hooks/
│   ├── useApi.js          # loading / error / abort / reload
│   └── useDebouncedValue.js
├── lib/
│   └── errors.js          # status → human sentence
├── components/
│   ├── ProductCard.jsx
│   ├── ProductDetail.jsx
│   ├── ProductForm.jsx
│   ├── LoginForm.jsx
│   ├── Uploader.jsx
│   ├── ErrorNotice.jsx
│   └── Spinner.jsx
├── App.jsx
├── main.jsx
└── index.css
```

The shape of the dependency graph is the lesson:

```
components  →  hooks  →  api/services  →  api/client  →  axios
```

Each arrow points one way. **Nothing above `api/` imports axios** except for `axios.isCancel`, and even that disappears once you adopt TanStack Query. Swap axios for `fetch`, or DummyJSON for your real backend, and only the bottom two layers change.

---

# Config cheat sheet

## Instance setup

```js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
  paramsSerializer: { indexes: null },
})
```

## Methods

```js
api.get(url, config)
api.delete(url, config)
api.head(url, config)
api.post(url, data, config)
api.put(url, data, config)
api.patch(url, data, config)
api(configObject)
api.request(configObject)
```

## Per-request config

| Option | Use |
|---|---|
| `params` | Query string |
| `data` | Request body |
| `headers` | Extra/override headers |
| `signal` | `AbortController` cancellation |
| `timeout` | Override the instance timeout |
| `responseType` | `'json'` \| `'text'` \| `'blob'` \| `'arraybuffer'` \| `'stream'` |
| `validateStatus` | Which statuses resolve instead of reject |
| `onUploadProgress` / `onDownloadProgress` | Progress events |
| `withCredentials` | Send cookies cross-origin |

## Response

```js
{ data, status, statusText, headers, config }
```

## Error

```js
err.response?.status      // server answered with a non-2xx
err.response?.data        // the error body
err.request               // sent, but no response (network/CORS/timeout)
err.code                  // ERR_NETWORK | ECONNABORTED | ERR_CANCELED | ERR_BAD_REQUEST
err.message               // developer-facing string
axios.isAxiosError(err)   // type guard
axios.isCancel(err)       // was it a deliberate abort?
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

# Common mistakes and how to avoid them

| Mistake | Why it breaks | Fix |
|---|---|---|
| Using `response` where you meant `response.data` | `response` is the envelope | `const { data } = await api.get(…)` |
| `axios.get(url, { limit: 5 })` | GET has no body arg; this is config | `{ params: { limit: 5 } }` |
| `axios.post(url, { headers })` | The headers object becomes the body | `axios.post(url, data, { headers })` |
| Interceptor that doesn't `return config` | Every request fails cryptically | Always return it |
| Response error handler that doesn't re-reject | Failures silently "succeed" | `return Promise.reject(error)` |
| `useEffect(async () => …)` | Returns a promise, not a cleanup fn | Declare the async fn inside |
| No `AbortController` | Race conditions, state set after unmount | Abort in cleanup |
| Not checking `axios.isCancel` | Every cancelled request flashes an error | Return early on cancel |
| `setLoading(false)` at the end of `try` | Errors skip it; spinner forever | Use `finally` |
| `loading` initialised to `false` | Flash of empty state on mount | Start `true` |
| Building query strings with template literals | Breaks on spaces, `&`, `#` | Use `params` |
| Setting `Content-Type` for `FormData` | Missing multipart boundary → 400 | Let the browser set it |
| `axios.defaults.headers.common.Authorization` | Leaks your token to third-party hosts | Instance + request interceptor |
| Hard-coded base URL | No staging/prod story | `baseURL` from `import.meta.env` |
| No `timeout` | Default is 0 = infinite | Set 10 s on the instance |
| Retrying a failed `POST` | Duplicate orders/charges | Retry idempotent methods only |
| 401 handler with no `_retry` flag | Infinite refresh loop | Mark the config, retry once |
| Parallel refresh calls | Backend invalidates the token; user logged out | One shared promise |
| Showing `err.message` to users | "Request failed with status code 422" | `err.response?.data?.message` first |
| Global `response => response.data` | Loses status/headers, breaks types | Unwrap in the service layer |
| Secrets in `.env` | Compiled into the public bundle | Proxy through your own server |
| Trusting a TS generic to validate | It's a claim, not a check | Parse with zod at the boundary |
| Optimistic update with no snapshot | Can't roll back | Snapshot → apply → confirm → revert |
| Mutating in a mount effect | StrictMode fires it twice | Mutations go in event handlers |

---

# Glossary

| Term | Meaning |
|---|---|
| **Instance** | An axios copy with its own defaults and interceptors (`axios.create()`) |
| **Interceptor** | A function run on every request or response through an instance |
| **`baseURL`** | Prefix prepended to relative request URLs |
| **Config** | The object describing a request: url, method, params, data, headers… |
| **Response envelope** | `{ data, status, statusText, headers, config }` |
| **`AbortController`** | Web standard for cancelling an in-flight request |
| **Race condition** | A slower earlier response overwriting a faster later one |
| **Debounce** | Delay an action until input stops changing |
| **Idempotent** | Repeating the request has the same effect as doing it once |
| **Optimistic update** | Update the UI before the server confirms; roll back on failure |
| **Preflight** | The browser's `OPTIONS` request checking CORS permission |
| **CORS** | Browser rules for cross-origin requests, configured by the server |
| **XSRF/CSRF** | Attack using the victim's cookies; mitigated with a double-submit token |
| **Access token** | Short-lived credential sent as `Authorization: Bearer …` |
| **Refresh token** | Long-lived credential used only to mint new access tokens |
| **Server state** | Data owned by the backend and cached in the client — not client state |
| **Backoff** | Increasing the wait between retries, ideally with jitter |
| **Service layer** | Modules that wrap HTTP calls and return domain data |

---

# Exercises

Roughly in order of difficulty. All use endpoints DummyJSON already provides.

1. **Sort control.** Add a dropdown for `sortBy=price&order=asc|desc`. Watch what happens when combined with search — decide what the right behaviour is, then implement it.
2. **Recently viewed.** Keep the last five product ids in state; fetch them all with `Promise.all` and render a strip above the grid.
3. **Load more.** Replace pagination with an append-on-click button. The tricky part: `setResult` must concatenate, and a new search must reset — not append.
4. **Prefetch on hover.** When the pointer rests on a card for 200 ms, fetch the detail early and store it in a `Map`. Compare the perceived speed.
5. **Global request counter.** Use request/response interceptors to track in-flight requests and render a thin loading bar at the top of the page whenever the count is above zero.
6. **A `useMutation` hook.** Extract `{ mutate, saving, error, reset }` from `ProductForm` so create, update, and delete all share one hook.
7. **Retry the list.** Wire `axios-retry` (or the `withRetry` helper) into the product list, then break it deliberately with a bad `baseURL` and watch the backoff in the Network tab.
8. **Offline banner.** Listen for `window` `online`/`offline` events, block requests while offline, and auto-reload when the connection returns.
9. **Correlation ids.** Attach `X-Request-Id: crypto.randomUUID()` in a request interceptor and echo it back in `ErrorNotice` — the trick that turns a user's screenshot into a searchable log entry.
10. **Port it to TanStack Query.** Keep `api/products.js` exactly as it is and replace `useApi` with `useQuery`/`useMutation`. Count the lines you deleted. That number is the argument for the library.
11. **Add zod.** Validate the product list response at the boundary, then break the schema on purpose and see how much better the error is than `undefined is not an object`.
12. **Write the tests.** MSW handlers for the list and detail endpoints; assert loading → success and loading → error for each.

---

# Where to go next

- [axios documentation](https://axios-http.com/docs/intro) — short, and worth reading start to finish
- [TanStack Query](https://tanstack.com/query/latest) — the next step for anything non-trivial
- [MDN: HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP) — status codes, methods, headers, CORS from the source
- [MSW](https://mswjs.io) — mocking that doesn't distort what you're testing
- [DummyJSON docs](https://dummyjson.com/docs) — more endpoints (carts, users, posts, todos, recipes) to practise against
- [zod](https://zod.dev) — runtime validation at the API boundary
