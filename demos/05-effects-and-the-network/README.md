# Demo 5 — Effects & the Network

**Demo guide** · ~100 minutes · the backend arrives, and with it the three states every request has

---

## Where you are starting from

The starter is **Demo 4, finished**: search, sort, a lifted wishlist, a
product form and a sign-up form built on the reusable field library, delete
with confirmation. All of it over 24 bundled products.

Three new stubs are in the box — `src/lib/errors.ts`,
`src/components/ErrorNotice.tsx`, `src/components/Skeletons.tsx` — each a
working minimal version you'll improve.

## What you ship today

The same app, talking to a real API: **194 products from
[DummyJSON](https://dummyjson.com)**, a skeleton grid while they load, an
error message a human can act on with a Retry button, and requests that
cancel themselves when they're no longer wanted.

By the end you will be able to answer, without hesitating:

- What `useEffect` is for, and the one thing it must never be used for
- What the axios response envelope is, and why you destructure `data` immediately
- The **three states** of every request, and why skipping one is a production bug
- The three shapes an axios error can take, and how to tell them apart
- Why `<StrictMode>` fires your effect twice, and why you must not "fix" it
- What a race condition looks like on a slow connection, and how `AbortController` ends it

---

## Before the demo (10 minutes)

```
https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/05-effects-and-the-network/starter
```

> ⚠️ Click once, bookmark the `stackblitz.com/edit/…` URL.

Locally: `cd demos/05-effects-and-the-network/starter && npm install && npm run dev`.

**Open these in a browser tab** — seeing the raw JSON before you write code
against it is a habit worth forming:

- `https://dummyjson.com/products/1` — one product. Compare it with
  `src/data/products.ts`. Same shape, on purpose.
- `https://dummyjson.com/products?limit=3&select=id,title,price` — a list.
  Note the envelope: `{ products, total, skip, limit }`.
- `https://dummyjson.com/products/9999` — a 404. Note the body:
  `{ "message": "…" }`. Every DummyJSON error looks like this.

## The API, in one table

| Purpose | Request |
|---|---|
| Everything | `GET /products?limit=0` (`limit=0` = all 194) |
| Pick fields | `&select=id,title,price` |
| **Slow it down** | `&delay=2000` — **you will use this constantly** |
| One product | `GET /products/1` |
| Break it | `GET /productz` → 404 |

Base URL: `https://dummyjson.com`. No key, no signup, CORS open.

---

## The cold open

Open the app. 24 products, as always. Now open
`https://dummyjson.com/products?limit=0&select=id,title` in another tab.
**194.** The bundled file has been a stand-in since Demo 1 and today it goes.

But before writing a single fetch, look at what has to be true for the swap
to work: `App` currently does `useState(initialProducts)` — the data is there
*before the first render*. Network data arrives *after*. Every problem in
today's demo comes from that one-word difference.

---

## Lab 1 — Your first request (20 min)

### Problem

The product list has to come from somewhere that isn't a file in the bundle.
That means a request, and a request means the data isn't there yet when the
component first runs.

### Concept

**`useEffect` runs code *after* render.** A component's body is for
calculating what to show. Anything that reaches *outside* React — a network
request, a timer, a subscription — is a *side effect*, and effects go in
`useEffect`:

```tsx
useEffect(() => {
  // runs after the component appears on screen
}, []); // ← [] means "only after the first render"
```

The dependency array controls *when* it re-runs. `[]` = once. `[reloadKey]` =
whenever `reloadKey` changes. Omit it entirely and it runs after *every*
render, which combined with a `setState` inside is an infinite loop.

**axios is a small library that makes HTTP behave.** Compared with the
built-in `fetch`:

| Concern | `fetch` | axios |
|---|---|---|
| JSON response | `await res.json()` every time | `res.data`, already parsed |
| A 404 or 500 | **Resolves normally** — you must check `res.ok` | **Rejects** — it lands in `catch` |
| Query string | build a `URLSearchParams` | `params: { limit: 0 }` |
| Cancellation | `signal`, manual | `signal`, and `axios.isCancel()` to recognise it |

The second row is the one that matters. With `fetch`, this is broken and
looks fine:

```ts
const res = await fetch('/api/products');
const data = await res.json();   // a 500's error body, parsed happily — and typed `any`
```

With axios a bad status lands in `catch`, where your brain already expects
failure to go.

**The response is an envelope, not your data.** And `axios.get<T>()` is how
you tell TypeScript what's inside it — `T` becomes the type of `response.data`.
Hold onto one fact about that generic: **it is a claim, not a check.** axios
does not validate the body. If the server renames a field, the compiler stays
happy and your app crashes at runtime. For an API you don't own, the honest
version parses the response with a zod schema (Demo 4) — Demo 6 says more.

```ts
const response = await axios.get<Product>(url);   // <Product> types response.data
response.data      // ← what you want, 95% of the time — a Product
response.status    // 200
response.headers   // { 'content-type': … }
```

Which is why nearly every axios call destructures immediately:
`const { data } = await axios.get(url)`.

### Steps

**`src/App.tsx` — `TODO(lab-1.1)`**

1. Add the imports:

   ```tsx
   import { useEffect, useState } from 'react';
   import axios from 'axios';
   ```

2. Replace `useState(initialProducts)` with an empty array, and add the
   effect directly below:

   ```tsx
   import type { Product, ProductDraft, ProductListResponse } from './types';   // ProductListResponse is new — see step 3

   const LIST_FIELDS = 'id,title,description,category,price,discountPercentage,rating,stock,brand,thumbnail';
   // (put this ABOVE the component, next to the imports)

   const [products, setProducts] = useState<Product[]>([]);   // empty until the response lands — and typed, because [] alone is never[]

   useEffect(() => {
     async function load() {
       // The generic types `response.data`. It is a CLAIM about the server, not a runtime check.
       const { data } = await axios.get<ProductListResponse>('https://dummyjson.com/products', {
         params: { limit: 0, select: LIST_FIELDS },
       });
       console.log('envelope:', data);
       setProducts(data.products);      // data.products is Product[] — the compiler knows the envelope's shape
     }
     load();
   }, []);
   ```

3. **Add the envelope type** to `src/types.ts` — the shape every DummyJSON
   list endpoint returns:

   ```ts
   /** The envelope every DummyJSON list endpoint returns. Memorise it — you destructure it constantly. */
   export interface ProductListResponse {
     products: Product[];
     total: number;
     skip: number;
     limit: number;
   }
   ```

4. **Delete the import** of `products as initialProducts` and delete
   `src/data/products.ts` and `src/data/sampleProducts.ts`. They've done
   their job.

**Why the `async function` inside the effect?** `useEffect(async () => …)`
is a bug: an async function returns a Promise, and React expects the effect
to return a *cleanup function* (or nothing). React warns about it. Declare
the async function inside and call it.

### Verify

A brief blank grid, then **194 products**. The category strip has grown from
4 pills to many. In the console, expand `envelope:` — `products`, `total: 194`,
`skip`, `limit`. In the **Network** tab, find the `products?limit=0…` request
and read its **Headers**: axios set `Accept: application/json, text/plain, */*`
for you.

**Look again at the Network tab. There are two requests.** That's
`<StrictMode>` — Lab 4 explains why and what to do about it. Leave it.

### Watch out

**`setProducts(data)` instead of `setProducts(data.products)`.** In JavaScript
you'd find out at runtime: `products.filter is not a function`. Here the
compiler refuses — `ProductListResponse` is not `Product[]`. That's the generic
earning its keep.

**`useEffect(async () => …)`.** *"Warning: useEffect must not return anything
besides a function."* Declare the async function inside.

**No dependency array at all.** The effect runs after every render, calls
`setProducts`, which renders, which runs the effect… Your Network tab fills
with requests. Add `[]`.

### Challenge (2 min)

Change `limit: 0` to `limit: 12`. Now the app shows 12 products and the
`total` says 194. Where should "there are more" be shown? Don't build it —
just decide. Demo 7 builds pagination.

### In the real world

The `select` param is worth noticing. DummyJSON products have ~20 fields
including `reviews` arrays and `dimensions` objects; the card renders ten. Ask
for what you render. On a real API this is the difference between a 40 KB
response and a 400 KB one.

---

## Lab 2 — The three states (25 min)

### Problem

Between clicking the link and the products appearing, the page shows an empty
grid with "0 of 0 products". Add `delay: 3000` to the params and it's three
seconds of a page that looks broken. And if the request fails — turn off your
wifi and reload — the app just… stays empty. Forever. No message, no retry.

### Concept

**Every request has three states, and a component must render all three:**

1. **Loading** — the request is in flight
2. **Error** — it failed
3. **Success** — here's the data

Skip one and your app is broken in production no matter how good it looks on
your fast laptop. The canonical shape:

```tsx
const [data, setData] = useState<Thing | null>(null);   // null until it arrives — say so in the type
const [loading, setLoading] = useState(true);            // ← true, not false
const [error, setError] = useState<unknown>(null);       // catch gives you unknown; don't pretend otherwise

useEffect(() => {
  async function load() {
    try {
      setLoading(true);
      setError(null);                 // clear a stale error on retry
      const { data } = await axios.get<Thing>(url);
      setData(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);              // runs on BOTH paths — that's what finally is for
    }
  }
  load();
}, []);
```

Three details people get wrong:

- **`loading` starts `true`.** Between the first render and the effect firing,
  no request has started but one certainly will. Starting at `false` shows
  the empty state for one frame — the flicker that makes an app feel cheap.
- **`setError(null)` at the top.** Otherwise a stale error survives a
  successful retry.
- **`finally`.** Clear `loading` there, never at the end of `try` — an error
  would skip it and the spinner would turn forever.

**Skeletons beat spinners.** A spinner says "wait". A card-shaped skeleton in
the same grid says "here's what's coming, and where" — and the page doesn't
jump when the real cards replace it.

### Steps

**A. `src/components/Skeletons.tsx` — `TODO(lab-2.3)`**

```tsx
import { Card, Col, Placeholder, Row } from 'react-bootstrap';

export function CardSkeletons({ count = 8 }: { count?: number }) {
  return (
    <Row xs={1} sm={2} md={3} xl={4} className="g-3" aria-busy="true" aria-label="Loading products">
      {Array.from({ length: count }, (_, i) => (
        <Col key={i}>
          <Card className="h-100">
            <div className="bg-body-secondary" style={{ height: 160 }} />
            <Card.Body>
              <Placeholder as="div" animation="glow" className="small">
                <Placeholder xs={4} />
              </Placeholder>
              <Placeholder as={Card.Title} animation="glow" className="fs-6">
                <Placeholder xs={9} />
              </Placeholder>
              <Placeholder as="div" animation="glow">
                <Placeholder xs={3} /> <Placeholder xs={2} />
              </Placeholder>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
}
```

React Bootstrap's `Placeholder` is purpose-built for this. `xs={9}` is a
twelve-column width; `animation="glow"` is the shimmer. `key={i}` is correct
here — this list never reorders and holds no state.

**B. `src/components/ErrorNotice.tsx` — `TODO(lab-2.2)`**

```tsx
import axios from 'axios';
import { Alert, Button } from 'react-bootstrap';
import { ArrowClockwise, ExclamationTriangleFill } from 'react-bootstrap-icons';
import { toMessage } from '../lib/errors';

interface ErrorNoticeProps {
  /** `unknown` on purpose: a catch block gives you unknown, and this component narrows it. */
  error: unknown;
  onRetry?: () => void;
}

export function ErrorNotice({ error, onRetry }: ErrorNoticeProps) {
  if (!error) return null;
  const message = toMessage(error);
  if (!message) return null;

  // Narrowing: only an axios error has a config and a response to show.
  const request = axios.isAxiosError(error) && error.config?.url ? error : null;

  return (
    <Alert variant="danger" className="d-flex align-items-start gap-2">
      <ExclamationTriangleFill className="mt-1 flex-shrink-0" />
      <div className="flex-grow-1">
        <div>{message}</div>
        {import.meta.env.DEV && request && (
          <div className="small text-muted font-monospace mt-1">
            {request.config?.method?.toUpperCase()} {request.config?.url}
            {request.response ? ` → ${request.response.status}` : ' → no response'}
          </div>
        )}
      </div>
      {onRetry && (
        <Button size="sm" variant="outline-danger" onClick={onRetry}>
          <ArrowClockwise className="me-1" />
          Retry
        </Button>
      )}
    </Alert>
  );
}
```

`if (!error) return null` means the caller can render it unconditionally —
one fewer `&&` in `App`. The `import.meta.env.DEV` line is a gift to your
future self: developers see the failing request; users never do.

**C. `src/App.tsx` — `TODO(lab-2.1)`**

Add the state and rewrite the effect:

```tsx
import { ErrorNotice } from './components/ErrorNotice';
import { CardSkeletons } from './components/Skeletons';
// …
const [loading, setLoading] = useState(true);
const [error, setError] = useState<unknown>(null);   // a catch block hands you `unknown`; keep the state honest

useEffect(() => {
  async function load() {
    try {
      setLoading(true);
      setError(null);
      const { data } = await axios.get<ProductListResponse>('https://dummyjson.com/products', {
        params: { limit: 0, select: LIST_FIELDS },
      });
      setProducts(data.products);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }
  load();
}, []);
```

Render the states — `ErrorNotice` above the toolbar, and the grid becomes a
ternary:

```tsx
<ErrorNotice error={error} />
// …
{loading ? (
  <CardSkeletons count={12} />
) : (
  <ProductGrid … />
)}
```

Also make the description honest and disable the add button while loading:

```tsx
description={loading ? 'Loading the catalogue…' : `${visibleProducts.length} of ${products.length} products`}
// …
<Button size="sm" onClick={() => setShowForm(true)} disabled={loading}>
```

### Verify

Add `delay: 3000` to the params temporarily. Reload: twelve grey shimmering
cards for three seconds, then the real grid drops in without the page
jumping. Remove the delay.

Now change the URL to `https://dummyjson.com/productz`. A red alert:
*"Request failed with status code 404"* — plus, underneath in monospace,
`GET https://dummyjson.com/productz → 404`. Technically correct, useless to a
user. Lab 3 fixes the wording. Change the URL back.

### Watch out

**`setLoading(false)` at the end of `try`.** Works on success, spins forever
on error. `finally`.

**Rendering `{error && <ErrorNotice …/>}` *and* returning `null` inside.**
Harmless, but pick one. We chose the component handling its own absence.

### In the real world

"Only the happy path was tested" is the single most common cause of
production UI bugs. The three-state shape you just wrote is not boilerplate to
be tolerated — it's the *definition* of handling a request. Demo 10 moves it
into the router so you write it once instead of per component, but it never
goes away.

---

## Lab 3 — What an error actually is (20 min)

### Problem

"Request failed with status code 404." Your user doesn't know what a 404 is.
Neither does your user know what `ERR_NETWORK` means, or `ECONNABORTED`. They
know "it didn't work" and they want to know *what to do*.

### Concept

First: **a `catch` block gives you `unknown`.** Not `Error`, not `AxiosError` —
`unknown`, because JavaScript lets anything be thrown. You may not read
`.response` off it until you've *proved* what it is. `axios.isAxiosError` is a
**type guard**: a function that returns `true` and, in the same breath, narrows
the type inside the `if`.

When axios rejects, **exactly one of three things happened**, and the error
object tells you which:

```ts
catch (err) {                       // ← `err` is `unknown`. You know NOTHING about it yet.
  if (axios.isAxiosError(err)) {    // a TYPE GUARD: inside this branch, err is AxiosError
    if (err.response) {
      // 1. The server ANSWERED, with a non-2xx status.
      err.response.status   // 404, 401, 500…
      err.response.data     // the error BODY — { message: "…" } on DummyJSON (typed unknown-ish; check before you read)
    } else if (err.request) {
      // 2. The request was SENT but no response came back.
      //    Offline. DNS failure. CORS block. Timeout. Server down.
    }
    err.code      // 'ERR_NETWORK' | 'ECONNABORTED' (timeout) | 'ERR_CANCELED' | 'ERR_BAD_REQUEST'
    err.message   // developer-facing string
  } else {
    // 3. Not from axios at all — a bug in your own code threw. Don't disguise it as HTTP.
  }
}
```

**The single most important line in error handling:**

```ts
// Only AFTER narrowing with axios.isAxiosError(err) — on `unknown`, neither property exists.
const message = err.response?.data?.message ?? err.message;
```

Prefer the backend's message — it's written for users, and it knows what
actually went wrong. Fall back to axios's.

**Then translate status codes to sentences, once, centrally.** Rules that
hold up:

- **4xx** = the user or the client can fix it. Say what to do.
- **5xx** = they can't. Apologise, offer Retry, log it.
- **No response** = "Check your connection."
- **Never** render a raw stack trace or `err.toString()`.
- **Always** give a way forward — a Retry button, a link back.

### Steps

**A. `src/lib/errors.ts` — `TODO(lab-3.1)`**

```ts
import axios from 'axios';

export function toMessage(err: unknown): string | null {
  if (axios.isCancel(err)) return null; // not an error — show nothing

  if (!axios.isAxiosError(err)) {
    return err instanceof Error ? err.message : 'Something went wrong.'; // a bug in our own code
  }

  // From here on, `err` is an AxiosError — the type guard narrowed it.
  const status = err.response?.status;
  const body = err.response?.data as { message?: unknown } | undefined;   // the body is untyped — say so
  const fromServer = typeof body?.message === 'string' ? body.message : undefined;

  if (err.code === 'ECONNABORTED') return 'The server took too long to respond. Try again.';
  if (!err.response) return "Can't reach the server. Check your connection and try again.";

  switch (status) {
    case 400:
    case 422:
      return fromServer ?? "Some of the details weren't valid.";
    case 401:
      return 'Your session has expired. Please sign in again.';
    case 403:
      return "You don't have permission to do that.";
    case 404:
      return fromServer ?? "We couldn't find what you were looking for.";
    case 429:
      return 'Too many requests. Give it a moment and try again.';
    default:
      if (status !== undefined && status >= 500) return "Something broke on our end. We're looking into it.";
      return fromServer ?? 'Something went wrong.';
  }
}
```

**B. `src/App.tsx` — `TODO(lab-3.2)`** — make Retry actually retry. The
effect runs when its dependencies change, so give it one to change:

```tsx
const [reloadKey, setReloadKey] = useState(0);
// …
}, [reloadKey]);   // ← was []
// …
<ErrorNotice error={error} onRetry={() => setReloadKey((k) => k + 1)} />
```

A counter nobody reads, whose only job is to be different. It's a common
idiom; you'll see it named `nonce`, `tick`, or `version`.

### Verify — three ways, three different sentences

1. URL → `/productz`. *"Product not found"*? No — DummyJSON returns `{message:
   "…"}` only for some routes; here you get our 404 fallback: *"We couldn't
   find what you were looking for."* The dev line still says `→ 404`.
2. URL → `https://localhost:9`. *"Can't reach the server…"* and the dev line
   says `→ no response`. That's `err.request` with no `err.response`.
3. Add `timeout: 500` and `params: { …, delay: 3000 }`. *"The server took too
   long…"* — `err.code === 'ECONNABORTED'`.

For each, click **Retry**. The skeletons show, the request re-fires (watch the
Network tab), the error comes back. Fix the URL, click Retry — products.

### Watch out

**`err.response.data.message` without `?.`.** On a network error there's no
`response`, and you've thrown a *second* error from inside your error handler.
Optional-chain every step.

**Reading `err.response` before narrowing.** `Property 'response' does not
exist on type 'unknown'`. The compiler is telling you the truth: you don't
know it's an axios error yet. `axios.isAxiosError(err)` first.

**Trusting `err.response.data.message` to be a string.** The body is whatever
the server sent. `typeof body?.message === 'string'` before you show it.

**Showing `err.message` for a 400.** *"Request failed with status code 400"*
when the backend said *"Price must be positive"*. Read `response.data` first.

### Challenge (2 min)

A 404 on a *list* ("no products match") and a 404 on a *detail* ("this product
was deleted") deserve different sentences. Where would that distinction live —
in `toMessage`, or in the component? Argue both sides in one sentence each.

### In the real world

Every team eventually writes this file. The ones who write it in week one have
consistent error messages across the whole app. The ones who don't have
"Something went wrong" in one screen, a stack trace in another, and a silent
failure in a third — and a bug tracker full of "it just didn't work".

---

## Lab 4 — Cancellation, StrictMode, and the race you can't see (25 min)

### Problem

Open the Network tab and reload. **Two identical requests.** You wrote one
`useEffect`. Why two?

And a problem you *can't* see yet: click Retry three times fast on a slow
connection. Three requests are in flight; they come back in whatever order the
network feels like. If the *first* one arrives *last*, your UI shows its
result — which may be stale.

### Concept

**`<StrictMode>` mounts, unmounts, and remounts every component in
development.** Your effect runs, its cleanup runs, it runs again. That's why
you see two requests. It's deliberate: it surfaces effects that don't clean up
after themselves. It does **not** happen in production builds.

The wrong fix is deleting `<StrictMode>` from `main.tsx`. That's turning off
the smoke detector. The right fix is to write an effect whose cleanup
*actually cancels* what it started — at which point the double run is harmless,
because the first request is cancelled the instant the second starts.

**`AbortController` is the web-standard cancel button.** axios accepts its
`signal`:

```ts
const controller = new AbortController();
axios.get(url, { signal: controller.signal });
controller.abort();          // the promise rejects with a CanceledError
```

Inside an effect, the **cleanup function** is where you call `abort()` — it
runs when the dependencies change or the component unmounts, which is exactly
when a stale request should die.

**A cancelled request is not a failure.** `axios.isCancel(err)` tells you it
was deliberate. Without that check, every cancellation flashes an error at the
user.

**The race condition.** Two requests in flight; the older one resolves last
and overwrites the newer data. On localhost you'll never see it. On a phone in
a lift, your users will. Cancelling the older request when the newer one
starts is the fix — and it's the same cleanup function.

### Steps

**`src/App.tsx` — `TODO(lab-4.1)`**

Rewrite the effect one more time:

```tsx
useEffect(() => {
  const controller = new AbortController();

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const { data } = await axios.get<ProductListResponse>('https://dummyjson.com/products', {
        params: { limit: 0, select: LIST_FIELDS },
        signal: controller.signal,                     // ← 1
      });
      setProducts(data.products);
    } catch (err) {
      if (axios.isCancel(err)) return;                 // ← 2
      setError(err);
    } finally {
      if (!controller.signal.aborted) setLoading(false); // ← 3
    }
  }

  load();
  return () => controller.abort();                     // ← 4
}, [reloadKey]);
```

Four lines, each load-bearing:

1. **Pass the signal.** Now axios can be told to stop.
2. **Return early on cancel.** A cancelled request must not set an error.
3. **Guard `setLoading(false)`.** If a *newer* request cancelled this one, the
   newer one owns the loading flag. Clearing it here would flash the empty
   grid mid-flight.
4. **Abort in cleanup.** Runs on unmount and before every re-run.

### Verify

Reload with the Network tab open. **Still two requests** — but the first is
now marked **(canceled)**. That's StrictMode's first mount being cleaned up
correctly. No error flashed, because of line 2.

Now the race, on demand: add `delay: 3000` to the params, throttle the Network
tab to **Slow 3G**, and click **Retry** three times fast. Every request but
the last is **(canceled)**. Skeletons show once, products land once.

Then **delete line 4** (`return () => controller.abort()`), and repeat. Three
requests, none cancelled, and the skeleton flickers as each one lands and sets
`loading` to false in turn. That flicker is the race condition. Put line 4
back.

### Watch out

**Forgetting `axios.isCancel`.** Every cancellation — including StrictMode's —
sets `error`, and a red alert flashes on every reload.

**Aborting a *mutation* on unmount.** For a GET, abandoning the request is
free. For a POST, the server may have already saved — you've just lost the
confirmation. Cancel reads, not writes. (Demo 8.)

**`err.name === 'AbortError'`.** That's `fetch`'s check. axios uses
`axios.isCancel(err)` or `err.code === 'ERR_CANCELED'`.

### Challenge (2 min)

`CategoryStrip` is derived from `products`, so the category pills appear
*after* the list loads. A real shop would load categories separately from
`GET /products/categories` so the strip appears first. Sketch (don't write)
what a second effect would need: its own loading? its own error? its own
`AbortController`? Demo 7 does exactly this.

### In the real world

"Why do I see two requests?" is the first question every React developer
asks in their first week. The answer is always StrictMode, and the *right*
response — add a cleanup that cancels — is the same code that fixes race
conditions in production. StrictMode isn't being annoying. It's showing you
a bug you'd otherwise ship.

---

## Wrap-up — what you can now do

- [x] Fetch data in `useEffect` and know why the async function goes inside
- [x] Destructure the axios envelope and reach for `data`
- [x] Render loading, error and success — every time, with `finally`
- [x] Narrow `unknown` with the `axios.isAxiosError` type guard, then tell `response`, `request` and neither apart
- [x] Type a response with `axios.get<T>` — and say why that's a claim, not a check
- [x] Make Retry work with a dependency the effect can watch
- [x] Cancel stale requests with `AbortController` and recognise cancellations
- [x] Explain the StrictMode double-fetch and why deleting StrictMode is wrong

**What's still wrong (and which demo fixes it):**

| Problem | Fixed in |
|---|---|
| `https://dummyjson.com` is hard-coded in a component | Demo 6 — config & the API layer |
| `App.tsx` knows about URLs, params, and envelopes | Demo 6 — service layer |
| All 194 products download at once; search is client-side | Demo 7 — server-side search & pagination |
| Add and delete are local; a reload forgets them | Demo 8 — mutations |
| ~40 lines of effect ceremony that every fetching component will copy | Demo 8 — custom hooks |

## Next demo

**Demo 6 — Configuration & the API Layer.** `.env` profiles, a validated
config module, an axios instance, one file for every URL, a service layer that
returns domain data, one `ApiError` for the whole app, and the first two
interceptors. Nothing on screen changes — and the codebase becomes one you'd
actually ship.

---

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| Two requests on load | StrictMode. Expected. Add the cleanup (Lab 4) and the first one is cancelled. |
| Infinite requests | No dependency array. Add `[reloadKey]`. |
| `products.filter is not a function` | You stored the envelope. `setProducts(data.products)`. |
| *"useEffect must not return anything besides a function"* | `useEffect(async …)`. Declare the async function inside. |
| Red error flashes on every reload | Missing `if (axios.isCancel(err)) return;`. |
| Spinner never stops after an error | `setLoading(false)` is in `try`, not `finally`. |
| `Cannot read properties of undefined (reading 'data')` | `err.response.data` on a network error. Optional-chain: `err.response?.data?.message`. |
| `'err' is of type 'unknown'` | You read a property off the caught value before narrowing. `axios.isAxiosError(err)` or `err instanceof Error` first. |
| `Type 'never[]' …` on `setProducts` | `useState([])` inferred `never[]`. `useState<Product[]>([])`. |
| CORS error in console | Not from DummyJSON — check the URL. If you're pointing at your own API, the server must allow your origin; nothing in axios can fix CORS. |
