# Demo 14 — Advanced HTTP & Shipping

**Demo guide** · ~100 minutes · the last mile: optimistic UI, uploads, retries, code splitting, and a host that serves a routed app

---

## Where you are starting from

The starter is **Demo 13, finished**: login, a refresh queue, protected
routes, roles — and, since Demo 13, a wishlist and a cart in Zustand stores,
with a checkout action. Everything works. This demo is about the things that separate
"works" from "ships".

New stubs: `src/api/services/uploads.ts`, `src/components/Uploader.tsx`,
`src/lib/retry.ts`. New in config: `VITE_UPLOAD_BASE_URL` and `env.upload`,
plus an `uploadApi` instance in `client.ts`. New file: `public/_redirects`.

## What you ship today

Delete that removes the card *instantly* and puts it back by itself if the
server says no; an image upload with a real progress bar and a Cancel button,
behind a feature flag that's on in development and off in production;
retries with backoff for the requests that can safely be repeated — and not
the ones that can't; lazy-loaded routes so the account area's code doesn't
ship to visitors who never sign in; and the one file a static host needs to
serve `/products/42` on refresh.

By the end you will be able to answer, without hesitating:

- The four steps of a manual optimistic update, and why a fetcher needs none of them
- Why you must not set `Content-Type` on an upload, and what 100% actually means
- Which failures are safe to retry, and why a `POST` never is
- What can and can't be lazy in a route, and why middleware stays eager
- What a "SPA fallback" is and why dev never shows you the bug

---

## Before the demo (5 minutes)

```
https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/14-advanced-http-and-shipping/starter
```

> ⚠️ Click once, bookmark the `stackblitz.com/edit/…` URL.

Locally: `cd demos/14-advanced-http-and-shipping/starter && npm install && npm run dev`.

---

## The cold open

Sign in as `emilys`. Delete a product on Slow 3G. The card dims… and stays
dimmed… for two seconds… then vanishes. Correct, honest, slow.

Now open the Network tab and reload `/products` five times. Same bundle each
time, including the account pages and the team directory — code a signed-out
visitor will never run.

Then `npm run build && npm run preview`, open `/products/42`, and **refresh**.
A blank page. Not React's error boundary — the *server's* 404. It has never
heard of `/products/42`.

Three things that don't show up on localhost with a fast connection. Today
is about those.

---

## Lab 1 — Optimistic UI, the fetcher way (20 min)

### Problem

Delete waits for the server before the card leaves. On a slow connection the
UI feels stuck for a second or two on an action the user is 99% sure will
succeed.

### Concept

**Optimistic** means: apply the change now, confirm with the server quietly,
undo if it disagrees. By hand, that's four steps you must not skip:

```tsx
const snapshot = products;                                 // 1. remember
setProducts((cur) => cur.filter((p) => p.id !== id));      // 2. apply now
try { await deleteProduct(id); }                           // 3. confirm
catch { setProducts(snapshot); setFlash('Restored.'); }    // 4. roll back
```

Skip the snapshot and you can't undo.

**With a fetcher, there is nothing to snapshot.** `fetcher.formData` holds the
in-flight submission. Render the list *as a function of it* — hide the row
whose id is being deleted — and rollback is free: if the action fails, the
fetcher goes idle, `formData` clears, and the row is simply rendered again.
The UI was never a *copy* mutated ahead of time; it was a *derivation* of
router state.

**When to be optimistic:** high-probability, low-stakes, reversible. Toggling
a like, marking done, deleting from a list. **When not to:** payments;
anything where the server *computes* what you'd display (a new id, a total);
anything where a silent rollback confuses more than a spinner would.

### Steps

**`src/routes/ProductsPage.tsx` — `TODO(lab-1.1)`**

Where the component derives `products` from `result`:

```tsx
// OPTIMISTIC: while a delete is in flight, render the list WITHOUT that product.
// No snapshot, no rollback code — if the action fails, the fetcher goes idle,
// fetcher.formData clears, and the product is simply rendered again.
const products = deletingId ? result.products.filter((p) => String(p.id) !== deletingId) : result.products;   // deletingId: string | null
```

That's the whole lab. `deletingId` already existed (Demo 10 dimmed the card
with it). The `busyId` dimming is now redundant — the card is gone — but
harmless; leave it or remove it.

### Verify

Slow 3G, delete a row: **it vanishes on click.** The Network tab shows the
`DELETE` still in flight, then the revalidating `GET`. Then break it —
temporarily change the action's `deleteProduct(id)` to `deleteProduct(999999)`.
Delete a row: it vanishes, the action fails, and **the row comes back by
itself**, with the red alert. You wrote no rollback code.

### Watch out

**Optimistic *create*.** You don't have the id the server will assign, so the
card's `key` and links would be wrong until revalidation. Create is the case
for a spinner.

**Silent rollback.** A row that reappears with no explanation looks like a
bug. The `fetcher.data.ok === false` alert from Demo 10 is what makes it
honest.

### Challenge (2 min)

Make the wishlist heart optimistic against a fake 20% failure rate
(`Math.random() < 0.2 && throw`). It's local state, not a fetcher — so which
version do you have to write, and what does that tell you?

---

## Lab 2 — Upload with progress (25 min)

### Problem

A profile picture is a file, not JSON. Files are big, uploads take time, users
want to see progress and be able to cancel — none of which `api.post(url, {…})`
gives you.

### Concept

**Multipart uploads are `FormData`.** And the single most common upload bug:

```ts
// ✗ DON'T. The header must include a generated boundary you don't know.
headers: { 'Content-Type': 'multipart/form-data' }
```

The browser sets `Content-Type: multipart/form-data; boundary=----WebKit…`
itself — *if you don't*. Our `api` instance has a JSON default, so uploads go
through a separate `uploadApi` with no default `Content-Type` and **no
timeout** (a 10 s timeout kills a large file).

**`onUploadProgress`** gives `{ loaded, total }`. `total` is unknown for
chunked bodies — guard it. And **100% means the bytes left the browser**, not
that the server is done. There's usually a pause at 100% while it processes.
Label it "Processing…" rather than leaving a full bar looking stuck.

**A cancel button is the one thing users need on an upload.** The
`AbortController` goes in a *ref*: it's not render state, and re-rendering on
every progress tick must not recreate it.

**Behind a flag.** `env.features.uploads` is `true` in development and
staging, `false` in production — from Demo 6's config. A feature flag isn't a
hack; it's how you ship code before you ship the feature.

### Steps

**A. `src/api/services/uploads.ts` — `TODO(lab-2.2)`**

```ts
import { uploadApi } from '../client';

export interface UploadResult {
  size: number;
  echoedFields: string[];
  echoedFiles: string[];
}

interface UploadOptions {
  /** 0–100. */
  onProgress?: (percent: number) => void;
  /** An upload is the one request users need a Cancel button for. */
  signal?: AbortSignal;
  fields?: Record<string, string>;
}

/** What httpbin.org/post echoes back: the multipart parts, keyed by field name. */
interface HttpbinEcho {
  form?: Record<string, string>;
  files?: Record<string, string>;
}

export async function uploadFile(file: File, { onProgress, signal, fields = {} }: UploadOptions = {}): Promise<UploadResult> {
  const form = new FormData();
  form.append('file', file, file.name);
  for (const [key, value] of Object.entries(fields)) form.append(key, value);

  // Do NOT set Content-Type: the browser adds `multipart/form-data; boundary=…` itself.
  const { data } = await uploadApi.post<HttpbinEcho>('/post', form, {
    signal,
    onUploadProgress: (event) => {                    // event: AxiosProgressEvent — loaded is a number, total is number | undefined
      if (!event.total) return;                       // unknown for chunked bodies
      onProgress?.(Math.round((event.loaded / event.total) * 100));
    },
  });

  return { size: file.size, echoedFields: Object.keys(data.form ?? {}), echoedFiles: Object.keys(data.files ?? {}) };
}
```

`httpbin.org/post` echoes the request back, so the response tells you exactly
what the browser sent. (DummyJSON has no upload endpoint.)

**B. `src/components/Uploader.tsx` — `TODO(lab-2.1)`**

```tsx
import { useRef, useState } from 'react';
import axios from 'axios';
import { Alert, Button, Card, Form, ProgressBar, Stack } from 'react-bootstrap';
import { CloudArrowUp, XLg } from 'react-bootstrap-icons';
import { uploadFile, type UploadResult } from '../api/services/uploads';
import { ApiError } from '../lib/ApiError';
import { ErrorNotice } from './ErrorNotice';

export function Uploader() {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);      // null = not uploading
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const controllerRef = useRef<AbortController | null>(null);          // a cancel handle is not render state

  const uploading = progress !== null;

  async function handleUpload() {
    if (!file) return;
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      setError(null);
      setResult(null);
      setProgress(0);
      setResult(await uploadFile(file, { onProgress: setProgress, signal: controller.signal, fields: { purpose: 'avatar' } }));
    } catch (err) {
      // uploadApi has no interceptors, so this is a RAW axios error: normalise it here.
      if (!axios.isCancel(err)) setError(ApiError.from(err));
    } finally {
      setProgress(null);
      controllerRef.current = null;
    }
  }

  return (
    <Card className="mt-4">
      <Card.Header className="fw-semibold">Upload a profile picture</Card.Header>
      <Card.Body>
        <Stack gap={3}>
          <Stack direction="horizontal" gap={2}>
            {/* Form.Control's onChange is typed for a generic element; assert the one we rendered to reach .files */}
            <Form.Control type="file" accept="image/*" disabled={uploading}
              onChange={(e) => setFile((e.target as HTMLInputElement).files?.[0] ?? null)} />
            <Button onClick={handleUpload} disabled={!file || uploading}>
              <CloudArrowUp className="me-1" />
              Upload
            </Button>
            {uploading && (
              <Button variant="outline-secondary" onClick={() => controllerRef.current?.abort()} aria-label="Cancel upload">
                <XLg />
              </Button>
            )}
          </Stack>

          {/* `progress !== null`, not `uploading`: the comparison is what narrows number | null → number for the props below */}
          {progress !== null && (
            <ProgressBar
              now={progress}
              label={progress < 100 ? `${progress}%` : 'Processing…'}   // 100% = bytes LEFT the browser
              animated={progress === 100}
              striped
            />
          )}

          <ErrorNotice error={error} />

          {result && (
            <Alert variant="success" className="mb-0">
              Uploaded {(result.size / 1024).toFixed(1)} kB. The server echoed file part{' '}
              <code>{result.echoedFiles.join(', ') || '—'}</code> and fields <code>{result.echoedFields.join(', ') || '—'}</code>.
            </Alert>
          )}
        </Stack>
      </Card.Body>
    </Card>
  );
}
```

**C. `src/routes/account/ProfilePage.tsx` — `TODO(lab-2.3)`** — behind the flag:

```tsx
import { Uploader } from '../../components/Uploader';
import { env } from '../../config/env';
// …wrap the return in a fragment and add after the </Card>:
{env.features.uploads && <Uploader />}   // env.features.uploads is a boolean — asBoolean() made it one in Demo 6
```

### Verify

Sign in, **Profile**. A small image finishes before you can read the bar —
so pick a 5–20 MB file and throttle to Slow 3G. The bar climbs; at 100% it
reads *Processing…*; **Cancel** works. Inspect the request: `Content-Type:
multipart/form-data; boundary=----WebKitFormBoundary…` — set by the browser,
exactly as promised. Then `npm run build && npm run preview`, sign in, Profile:
**no uploader.** `.env.production` says `VITE_FEATURE_UPLOADS=false`.

### Watch out

**Setting `Content-Type` yourself.** A 400 from every backend, every time.

**Using `api` for the upload.** JSON `Content-Type` default + 10 s timeout.
That's what `uploadApi` is for.

**Aborting an upload and calling it "failed".** It isn't. `axios.isCancel`,
then say nothing.

### Challenge (2 min)

Show a thumbnail preview before upload with `URL.createObjectURL(file)`. Where
do you `revokeObjectURL`, and what happens if you don't?

---

## Lab 3 — Retries, only where they're safe (15 min)

### Problem

A flaky connection fails one request in twenty. Most of those would succeed a
second later. But retrying the *wrong* request is worse than failing.

### Concept

**Only retry what is safe to repeat.**

| Situation | Retry? |
|---|---|
| Network error (no response) | yes |
| 408 timeout, 429 rate-limited | yes (respect `Retry-After`) |
| 500 / 502 / 503 / 504 | yes — for `GET`, `PUT`, `DELETE` |
| Any other 4xx | **no** — the request is wrong; repeating won't change the answer |
| A failed `POST` | **no** — it may have succeeded with only the response lost; retrying creates a duplicate |

**Exponential backoff with jitter.** `400ms, 800ms, 1600ms` plus a random
0–200 ms. The jitter matters: without it every client that failed together
retries together and floors the server again.

**Cap it.** Two or three attempts in a UI. Beyond that the user is staring at
a spinner while you politely hammer a dead service — show the error and a
Retry button, and let them decide.

### Steps

**A. `src/lib/retry.ts` — `TODO(lab-3.1)`**

```ts
import axios from 'axios';
import { ApiError } from './ApiError';

/** `unknown` in — this can see an ApiError (from api) or a raw AxiosError (from bareApi/uploadApi). Narrow for each. */
export function isRetryable(error: unknown): boolean {
  if (axios.isCancel(error)) return false;
  const status = error instanceof ApiError ? error.status : axios.isAxiosError(error) ? (error.response?.status ?? 0) : 0;
  return status === 0 || status === 408 || status === 429 || status >= 500;
}

interface RetryOptions {
  attempts?: number;
  baseDelayMs?: number;
  /** Stop retrying once the caller has gone away (a loader's request.signal). */
  signal?: AbortSignal;
}

/**
 * Retry an IDEMPOTENT operation with exponential backoff and jitter. Never wrap a POST in this.
 * Generic: whatever `fn` resolves to, so does withRetry — the caller's types don't change.
 */
export async function withRetry<T>(fn: () => Promise<T>, { attempts = 3, baseDelayMs = 400, signal }: RetryOptions = {}): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const lastAttempt = attempt >= attempts - 1;
      if (lastAttempt || !isRetryable(error) || signal?.aborted) throw error;
      const delay = baseDelayMs * 2 ** attempt + Math.random() * 200;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
```

**B. `src/routes/ProductsPage.tsx` — `TODO(lab-3.2)`** — the loader's GET,
and *only* the GET:

```ts
import { withRetry } from '../lib/retry';
// …in productsLoader:
withRetry(() => listProducts({ q, category, sortBy, order, page, limit: PAGE_SIZE, signal: request.signal }), {
  signal: request.signal,
}),   // still a Promise<ProductListResponse> — withRetry<T> is transparent to the type
```

The action's `POST`/`PATCH`/`DELETE` are not wrapped. Say why out loud.

### Verify

Set `VITE_API_BASE_URL=https://localhost:9` in `.env.development`, restart,
open `/products`. Watch the Network tab: **three** attempts, spaced ~0.4 s,
~0.8 s, ~1.6 s apart, then the error boundary. Fix the URL. Now break
`endpoints.products.list` to `/productz` (a 404): **one** attempt — not
retryable. Fix it.

### Watch out

**Wrapping the action.** A `POST` that timed out may have created the
product. Retry → two products.

**No jitter.** Fine for one user. At scale it's a synchronised stampede.

**Retrying after the user navigated away.** `signal?.aborted` short-circuits
the loop — that's why the loader passes `request.signal` in.

### Challenge (2 min)

Honour `Retry-After` on a 429: read it from `error.cause?.response?.headers`
and use it as the delay. Where does that value live on an `ApiError`, and is
it there for a network error?

---

## Lab 4 — Lazy routes (15 min)

### Problem

Every route's code is in the initial bundle. The account layout, the profile,
the carts table, the team directory — downloaded by every visitor, run by
almost none.

### Concept

**`lazy` loads a route's code when it's first matched.** The `path` stays
eager (the router needs it to match); `Component`, `loader`, `action` and
`ErrorBoundary` load on demand. And — unlike `React.lazy` + `Suspense` — **the
router loads the module and runs the loader in parallel**, so lazy routes
don't add a waterfall.

| Eager (needed to match) | Lazy (needed to render) |
|---|---|
| `path`, `index`, `id`, `children`, `caseSensitive` | `Component`, `loader`, `action`, `ErrorBoundary`, `HydrateFallback`, `shouldRevalidate`, `handle` |

**Middleware stays eager.** A guard that has to be downloaded before it can
run is a guard with a gap. Import it directly.

### Steps

**`src/router.tsx` — `TODO(lab-4.1)`**

```tsx
{
  path: 'about',
  lazy: async () => {
    const { AboutPage } = await import('./routes/AboutPage');
    return { Component: AboutPage };                 // the returned object is type-checked against the route's shape
  },
},
// …
{
  path: 'account',
  middleware: [authMiddleware],          // EAGER — imported at the top, as before
  lazy: async () => {
    const { AccountLayout, accountLoader } = await import('./routes/account/AccountLayout');
    return { Component: AccountLayout, loader: accountLoader };
  },
  children: [
    {
      index: true,
      lazy: async () => {
        const { ProfilePage, profileLoader } = await import('./routes/account/ProfilePage');
        return { Component: ProfilePage, loader: profileLoader };
      },
    },
    {
      path: 'carts',
      lazy: async () => {
        const { CartsPage, cartsLoader } = await import('./routes/account/CartsPage');
        return { Component: CartsPage, loader: cartsLoader };
      },
    },
    {
      path: 'team',
      middleware: [requireRole('admin')],
      lazy: async () => {
        const { TeamPage, teamLoader } = await import('./routes/account/TeamPage');
        return { Component: TeamPage, loader: teamLoader };
      },
    },
  ],
},
```

Delete the now-unused top-level imports of those five modules.

### Verify

`npm run build`. The output lists **separate chunks** for `AboutPage`,
`AccountLayout`, `ProfilePage`, `CartsPage`, `TeamPage`. `npm run preview`,
Network tab filtered to JS, load `/products`: none of them download. Click
**Account**: the layout and profile chunks arrive *at that moment*, and the
profile loader ran in parallel with the download.

### Watch out

**Lazy-loading `middleware`.** The guard downloads on demand — and until it
does, nothing guards. Keep it eager.

**`lazy: () => import('./routes/AboutPage')`** without picking the exports.
The module's default export would need to *be* the route object. Destructure
and return `{ Component, loader }` explicitly.

### Challenge (2 min)

Add a `<link rel="prefetch">` for the account chunk when the user hovers
**Account**. Is the win worth the complexity? Measure before deciding.

---

## Lab 5 — Shipping a routed app (15 min)

### Problem

`npm run build`, upload `dist/` to a static host, share `/products/42` with a
colleague. They get the host's 404. Dev never showed you this: Vite serves
`index.html` for *every* path.

### Concept

**A single-page app has one HTML file.** The router reads the URL *after* that
file loads. So the host must serve `index.html` for any path it doesn't
recognise — a **SPA fallback**. Every host spells it differently:

| Host | Where |
|---|---|
| Netlify | `public/_redirects`: `/*  /index.html  200` |
| Vercel | `vercel.json`: `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }` |
| nginx | `location / { try_files $uri /index.html; }` |
| GitHub Pages | no rewrites — use `createHashRouter` instead |

Vite copies `public/` into `dist/` verbatim, so `public/_redirects` ships
with the build.

**Modes at build time.** `npm run build` reads `.env.production`;
`npm run build:staging` reads `.env.staging`. Same code, different
`VITE_API_BASE_URL`, log level, feature flags. Check the output: `grep -r
"dummyjson" dist/assets/*.js` finds the base URL compiled in — which is why
nothing secret may ever be in a `VITE_` variable.

**What the build tells you.** Chunk sizes, per route. If one is unexpectedly
large, `npx vite-bundle-visualizer` shows you why.

### Steps

Open **`public/_redirects`** — it's already there, one line:

```
/*    /index.html   200
```

Then:

```bash
npm run build            # → dist/, production mode
npm run preview          # serves dist/ WITH a SPA fallback, like a real host would
```

Open `/products/42` in the preview and refresh. It works — `vite preview`
falls back to `index.html`. Now imagine a host that doesn't: that one-line
file is what stands between you and the cold-open bug.

```bash
npm run build:staging    # same code, staging config
```

### Verify

`dist/_redirects` exists. `dist/assets/` has one chunk per lazy route. In the
preview, the console has **no `[debug]` lines** (`VITE_LOG_LEVEL=error`), the
uploader is **absent** (`VITE_FEATURE_UPLOADS=false`), and `/products/42`
survives a refresh.

### Watch out

**Testing deployment with `npm run dev`.** It cannot show you the fallback
bug. `preview`, or the real host.

**`createHashRouter` "to be safe".** Every URL becomes `/#/products/42`. It
works everywhere, and it's the tool for hosts you can't configure — not a
default.

### In the real world

"Works locally, blank page in production" is the first deployment bug every
SPA team hits, and the fix is one line in the right file for your host. Put
it in the repo, not in a wiki.

---

## Where this leaves you — and what's next

ShopScope now has: components built from a `TextField` up, one filters object
in the URL, a layered API module with one `ApiError`, loaders and actions,
JWT auth with a refresh queue, middleware-protected routes with roles,
optimistic deletes, uploads behind a flag, retries where they're safe, lazy
routes, and a build that deploys. **The finished app is in
[`./solution/`](./solution/).**

Three things this track deliberately stopped short of, and where to go:

| Next | Why, and where |
|---|---|
| **TanStack Query** | Loaders don't *cache*. When back/forward should be instant and two components need the same data, this is the answer — and your service layer plugs straight in. [Study guide §40](../../study-guides/React-Axios-HTTP-and-Routing-Study-Guide.md). |
| **TypeScript** | `useLoaderData()` returning `any` is the first thing you'll want typed. The parallel [ShopCrew sessions](../../sessions/) are the TypeScript track. |
| **Testing** | MSW at the network layer + `createMemoryRouter` for routes. [Study guide §42](../../study-guides/React-Axios-HTTP-and-Routing-Study-Guide.md). |

---

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| Deleted card doesn't come back on failure | You mutated state instead of deriving from `fetcher.formData`. |
| Upload 400s | You set `Content-Type`. Don't. |
| Upload times out at 10 s | You used `api`, not `uploadApi`. |
| Bar stuck at 100% | Expected — the server is processing. Label it. |
| Uploader missing in the build | `VITE_FEATURE_UPLOADS=false` in `.env.production`. Working as designed. |
| A `POST` fired twice | You wrapped the action in `withRetry`. Reads only. |
| No separate chunks after `lazy` | The module is still imported at the top of `router.tsx`. Delete the import. |
| `/products/42` 404s on the host | No SPA fallback. `_redirects` (or your host's equivalent). |
| `Property 'files' does not exist on type 'EventTarget & (HTMLInputElement \| HTMLTextAreaElement)'` | react-bootstrap types `Form.Control`'s target loosely. `(e.target as HTMLInputElement).files`. |
| `Type 'number \| null' is not assignable to type 'number'` on `<ProgressBar now=…>` | Guard with `progress !== null &&` — the comparison narrows; `uploading &&` does not. |
