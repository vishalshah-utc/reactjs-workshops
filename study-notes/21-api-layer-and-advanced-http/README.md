# Module 21 — The API Layer: Configuration, axios & Advanced HTTP

**Study notes** · ~3.5 hours

> **Goal.** [Module 13](../13-data-fetching-and-custom-hooks/) built `useFetch`
> with plain `fetch` and ended with everything it cannot do. This module is the
> professional continuation: the part of a React codebase that is not React at
> all, and that decides whether the backend can change without a cross-cutting
> refactor. Configuration, an HTTP client, one error type, and the HTTP
> patterns — cancellation, paging, mutations, optimistic UI, uploads, retries —
> that a query library will later *consume*, not replace.

**Prerequisites:** [Module 12 §4](../12-effects/#4-cleanup) and
[§11](../12-effects/#11-data-fetching-in-an-effect),
[Module 13 §5–§6](../13-data-fetching-and-custom-hooks/#5-building-usefetch-properly),
[Module 1 §16](../01-javascript-foundations/#16-asynchronous-javascript-promises-asyncawait-fetch).

---

## Contents

1. [Why an API layer exists](#1-why-an-api-layer-exists)
2. [The backend: DummyJSON and its quirks](#2-the-backend-dummyjson-and-its-quirks)
3. [Configuration: Vite modes and `.env` files](#3-configuration-vite-modes-and-env-files)
4. [Validating `import.meta.env` at startup](#4-validating-importmetaenv-at-startup)
5. [axios 1.x vs `fetch`](#5-axios-1x-vs-fetch)
6. [Instances, defaults and typed responses](#6-instances-defaults-and-typed-responses)
7. [Endpoints and services](#7-endpoints-and-services)
8. [One `ApiError`, and the message a human sees](#8-one-apierror-and-the-message-a-human-sees)
9. [Interceptors](#9-interceptors)
10. [Cancellation and the search race](#10-cancellation-and-the-search-race)
11. [Debouncing vs throttling](#11-debouncing-vs-throttling)
12. [Parallel requests](#12-parallel-requests)
13. [Pagination](#13-pagination)
14. [Mutations](#14-mutations)
15. [Optimistic UI with rollback](#15-optimistic-ui-with-rollback)
16. [Upload progress](#16-upload-progress)
17. [Retries, only where they are safe](#17-retries-only-where-they-are-safe)
18. [`useApi` and its limits](#18-useapi-and-its-limits)
19. [Self-check](#19-self-check)
20. [References](#20-references)

**Hands-on.** This module is the theory behind five ShopScope demos, in the
order they are built:
[Demo 5 — Effects & the Network](../../demos/05-effects-and-the-network/)
(axios, three states, human errors, cancellation),
[Demo 6 — Configuration & the API Layer](../../demos/06-config-and-the-api-layer/)
(`.env` profiles, validated config, instances, endpoints, services, `ApiError`,
interceptors),
[Demo 7 — Search, Filters & Pagination](../../demos/07-search-filters-and-pagination/)
(server-side filters, debounce, parallel requests, paging),
[Demo 8 — Mutations & Custom Hooks](../../demos/08-mutations-and-custom-hooks/)
(`POST`/`PATCH`/`DELETE`, forms that keep their input, `useApi`) and the HTTP
half of [Demo 14 — Advanced HTTP & Shipping](../../demos/14-advanced-http-and-shipping/)
(optimistic UI, upload progress, retries). Every code shape below is quoted
from their `src/config`, `src/api` and `src/lib` folders. Pins: axios 1.20,
React 19.3, Vite 8.3, zod 4.6.

---

## 1. Why an API layer exists

Open a component that calls `axios.get('https://dummyjson.com/products')` and
count what it knows that has nothing to do with rendering products: a
hostname; a path; a query-string format and the exact `select` field list;
that the response is an envelope with `.products` inside; that errors have
`.response`, `.request`, `.code`. A second fetching component copies all five.
Then staging needs a different host, or every request needs an auth header —
and you grep.

An API layer puts each of those in exactly one place:

```
config/env.ts          validated once; the ONLY file that reads import.meta.env
   ↓
api/client.ts          the axios instances (baseURL, timeout, headers)
api/endpoints.ts       every URL the app can hit, as functions
api/interceptors/      logging, auth, retry-on-401, error normalisation — in order
api/services/          products.ts, auth.ts … return DOMAIN data, never a response
   ↓
lib/ApiError.ts        the ONE error type anything above api/ ever sees
   ↓
components / hooks     know about products and ApiErrors. Nothing else.
```

Four things it buys: **one place** for the base URL, the auth header, error
normalisation and logging; **one import to mock** in tests
([Module 18](../18-testing/)); **a translation boundary** where the backend's
shape becomes yours; and components that **cannot import axios** — the first
thing a senior reviewer checks in a PR.
[Module 13 §13](../13-data-fetching-and-custom-hooks/#13-the-api-layer)
sketched this with `fetch`; this module builds the version you would ship.

**→ In the demos:** Demo 6's cold open counts the five leaks in `App.tsx`;
Labs 1–4 remove them.

---

## 2. The backend: DummyJSON and its quirks

ShopScope talks to [DummyJSON](https://dummyjson.com) — a public REST API with
no key, no sign-up and open CORS. Know its shape before writing against it.

| Need | Endpoint |
|---|---|
| A page of products | `GET /products?limit=12&skip=24` (`limit=0` = all) |
| Only some fields · sorted | `&select=id,title,price` · `&sortBy=price&order=desc` |
| Search · one category | `GET /products/search?q=phone` · `GET /products/category/beauty` |
| The category list | `GET /products/categories` → `[{ slug, name, url }]` |
| One product | `GET /products/1` |
| **Slow it down** | `&delay=2000` — you will use this constantly |
| Create / update / delete | `POST /products/add` · `PATCH /products/1` · `DELETE /products/1` |
| Login | `POST /auth/login` `{ username, password, expiresInMins }` |

Every list endpoint returns the same envelope:

```ts
/** Memorise it — you destructure it constantly. */
export interface ProductListResponse { products: Product[]; total: number; skip: number; limit: number; }
```

The quirks, each of which shapes code in this module:

- **Writes are simulated.** `POST /products/add` returns a product with a new
  `id` (195 — there are 194) but nothing persists. The request, response and
  error paths are real, so the UI merges the *server's response* into local
  state exactly as it would against a real API ([§14](#14-mutations)).
- **The create response echoes only what you sent** — no `thumbnail`, no
  `rating`. The caller supplies UI defaults for what the server omitted.
- **`DELETE` echoes the product** with `isDeleted: true` and `deletedOn`.
- **Error bodies are `{ message }`** — on some routes. Never trust it blindly.
- **Login returns a subset of the user** (no `role`); `GET /auth/me` has the
  rest ([Module 22](../22-authentication-and-protected-routes/)).
- **No upload endpoint and no push channel.** Uploads go to `httpbin.org/post`
  ([§16](#16-upload-progress)); Module 24 mocks SSE in a Vite plugin.

📖 [DummyJSON — Products](https://dummyjson.com/docs/products) ·
[Auth](https://dummyjson.com/docs/auth)

---

## 3. Configuration: Vite modes and `.env` files

`https://dummyjson.com` in the source means a code change per environment, or
a nest of `if (location.host === …)`. Both are worse than five lines of config.

**Vite has a *mode*.** `vite` is `development`; `vite build` is `production`;
`vite --mode staging` is `staging`. The mode picks which files load:

| File | Loaded when | Commit it? |
|---|---|---|
| `.env` | always | ✅ shared defaults |
| `.env.local` | always, except tests | ❌ personal overrides |
| `.env.[mode]` | only in that mode | ✅ |
| `.env.[mode].local` | only in that mode | ❌ |

Later files win; `.local` beats non-local. ShopScope commits three profiles —
same keys, different values — and an `.env.example` to copy into `.env.local`:

```bash
# .env.development — `npm run dev`. Committed on purpose: nothing here is secret.
VITE_API_BASE_URL=https://dummyjson.com
VITE_API_TIMEOUT_MS=30000
VITE_LOG_LEVEL=debug
VITE_FEATURE_UPLOADS=true
VITE_PAGE_SIZE=12

# .env.production — `npm run build`
VITE_API_TIMEOUT_MS=10000
VITE_LOG_LEVEL=error
VITE_FEATURE_UPLOADS=false
```

```json
"dev:staging": "vite --mode staging",   "build:staging": "tsc -b && vite build --mode staging"
```

Three rules:

- **Only `VITE_`-prefixed variables reach the browser.** Everything else is
  stripped, so a stray `DATABASE_URL` in your shell cannot land in a bundle.
- **Everything that *does* reach the browser is public.** `VITE_` values are
  statically replaced into the JavaScript at build time; `grep dummyjson
  dist/assets/*.js` finds them. They are *configuration*, never *secrets*. A
  private key belongs on a server you control. There is no client-side
  workaround.
- **Changes need a dev-server restart.** Vite reads the files at startup.

Vite also exposes `import.meta.env.MODE`, `.DEV` (true under `vite dev`, any
mode) and `.PROD` (true under any `vite build`).

📖 [Vite — Env Variables and Modes](https://vite.dev/guide/env-and-mode)

**→ In the demos:** Demo 6 Lab 1 adds the three profiles; Demo 14 Lab 5 builds
the same code twice with `build` and `build:staging`.

---

## 4. Validating `import.meta.env` at startup

`import.meta.env.VITE_X` scattered across forty files just moves the problem
from *values* to *names*. Two files fix it.

**Name the variables.** Vite types any `VITE_` key as `any`, so a typo is a
silent `undefined`. Augmenting `ImportMetaEnv` makes it a compile error:

```ts
// src/vite-env.d.ts
/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_TIMEOUT_MS?: string;      // ALWAYS a string, or missing
  readonly VITE_LOG_LEVEL?: string;
  readonly VITE_FEATURE_UPLOADS?: string;
  readonly VITE_PAGE_SIZE?: string;
}
```

**Read once, coerce, validate, freeze.** One module reads them all, throws on
import if something is missing, and exports typed values:

```ts
// src/config/env.ts — read import.meta.env NOWHERE else
type EnvKey = keyof ImportMetaEnv & `VITE_${string}`;

function required(name: EnvKey): string {
  const value = import.meta.env[name];
  if (value === undefined || value === '') {
    throw new Error(`[config] Missing required env var ${name}. Add it to .env.${import.meta.env.MODE}.`);
  }
  return value;
}

/** Env vars are ALWAYS strings. The string "false" is truthy. This is the classic bug. */
function asBoolean(name: EnvKey, fallback: boolean): boolean {
  const raw = import.meta.env[name];
  if (raw === undefined || raw === '') return fallback;
  return raw === 'true' || raw === '1';
}
// asNumber() and asLogLevel() follow the same shape: parse, throw on nonsense, fall back when absent.

export const env = Object.freeze({
  mode: import.meta.env.MODE,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  api: Object.freeze({
    baseUrl: required('VITE_API_BASE_URL').replace(/\/$/, ''),   // never a trailing slash
    timeoutMs: asNumber('VITE_API_TIMEOUT_MS', 10_000),
  }),
  logLevel: asLogLevel('VITE_LOG_LEVEL', 'warn'),                 // a LogLevel, not a string
  pageSize: asNumber('VITE_PAGE_SIZE', 12),
  features: Object.freeze({ uploads: asBoolean('VITE_FEATURE_UPLOADS', false) }),
});

export type Env = typeof env;
```

| Detail | Why |
|---|---|
| `required()` throws on import | A misconfigured deploy fails at boot naming the file to fix, not at 2 am with `baseURL: undefined` |
| `asBoolean` | `if (import.meta.env.VITE_FEATURE_UPLOADS)` is **always true** — `"false"` is a non-empty string |
| `asNumber` | `timeout: "10000"` is a string; axios wants a number |
| `.replace(/\/$/, '')` | Prevents `https://api.co//products` |
| `Object.freeze` | Nobody "temporarily" mutates config |
| `Env = typeof env` | The whole shape for free, for anything that takes config as a parameter |

The same validation can be a zod 4.6 schema —
`z.object({ VITE_API_BASE_URL: z.url(), … }).parse(import.meta.env)` — which
is the right call past a dozen keys. ShopScope's hand-written helpers are
deliberate: the point is that *something* validates at startup, not which
library. A level-gated `logger` reads `env.logLevel`, so `logger.debug(…)` is
free in production and `console.log` never ships.

**→ In the demos:** Demo 6 Lab 1 — comment out `VITE_API_BASE_URL`, reload,
and read the red overlay naming the file.

---

## 5. axios 1.x vs `fetch`

`fetch` is built in, and [Module 13 §5](../13-data-fetching-and-custom-hooks/#5-building-usefetch-properly)
used it correctly. axios is a small library that makes HTTP behave the way
your `try`/`catch` already expects:

| Concern | `fetch` | axios 1.x |
|---|---|---|
| JSON response | `await res.json()` every time | `res.data`, already parsed |
| A 404 or 500 | **Resolves normally** — you must check `res.ok` | **Rejects** — lands in `catch` |
| Query string | build `URLSearchParams` yourself | `params: { limit: 0 }`, encoded for you |
| Base URL, timeout, default headers | wrap it yourself | `axios.create({ baseURL, timeout, headers })` |
| Cross-cutting behaviour | wrap it yourself | interceptors |
| Cancellation | `signal` | `signal`, plus `axios.isCancel()` to recognise it |
| Upload progress | not available | `onUploadProgress` |
| Typed response | cast after `json()` | `api.get<T>()` types `data` |

The second row is the one that matters. With `fetch`, this is broken and looks
fine:

```ts
const res = await fetch('/api/products');
const data = await res.json();      // a 500's error body, parsed happily — and typed any
```

**The response is an envelope, not your data**, which is why nearly every
axios call destructures immediately:

```ts
const { data } = await api.get<Product>('/products/1');   // data: Product. Also: status, headers, config
```

**The default `timeout` is `0` — wait forever.** A dead backend leaves your
skeleton shimmering until the user gives up. Always set one.

📖 [axios — Getting started](https://axios-http.com/docs/intro) ·
[Response schema](https://axios-http.com/docs/res_schema)

**→ In the demos:** Demo 5 Lab 1 — the first request, and the envelope in the
console.

---

## 6. Instances, defaults and typed responses

**An instance is a pre-configured axios** with its own defaults and — the part
that matters — its own interceptors:

```ts
// src/api/client.ts
import axios, { type AxiosInstance, type CreateAxiosDefaults } from 'axios';
import { env } from '../config/env';

/** Shared settings, so the instances can't drift apart. */
const baseConfig: CreateAxiosDefaults = {
  baseURL: env.api.baseUrl,
  timeout: env.api.timeoutMs,
  headers: { 'Content-Type': 'application/json' },
};

/** The app's HTTP client. Import THIS — never bare `axios`. */
export const api: AxiosInstance = axios.create(baseConfig);

/** No interceptors, ever. The token-refresh flow uses it so a failing refresh can't re-enter the 401 handler. */
export const bareApi: AxiosInstance = axios.create(baseConfig);

/** Uploads: a different host, NO timeout, NO default Content-Type. */
export const uploadApi: AxiosInstance = axios.create({ baseURL: env.upload.baseUrl, timeout: 0 });
```

**Never configure the global `axios`.** `axios.defaults.headers.common.Authorization = …`
looks convenient — but the global `axios` is shared with every library in
`node_modules` that imports it. Set a global auth header and **your token is
sent to third-party domains** the moment some SDK makes a request. Instances
are isolated. Three is the normal count: the app client, a bare one for flows
that must not recurse into their own interceptors, and one for a host with
different rules.

### Typed responses are a claim, not a check

`api.get<Product>(url)` makes `data` a `Product`. axios does **not** validate
the body; rename a field on the server and the compiler stays happy while the
app crashes at runtime.

```ts
const { data } = await api.get<ProductListResponse>('/products');
setProducts(data);            // ✗ compile error — the envelope is not Product[]. The generic earned its keep.
setProducts(data.products);   // ✓
```

For an API you own, the generic is enough. For one you do not, parse the body
with a zod 4.6 schema at the service boundary
([Module 10 §9](../10-forms/#9-schema-validation-with-zod)) — `schema.parse(data)`
turns "the server changed" into a thrown error at the one place you can catch
it.

📖 [axios — The axios instance](https://axios-http.com/docs/instance) ·
[Config defaults](https://axios-http.com/docs/config_defaults)

**→ In the demos:** Demo 6 Lab 2 (`api`, `bareApi`); Demo 14 Lab 2 adds
`uploadApi`.

---

## 7. Endpoints and services

Two layers, two jobs. `endpoints.ts` owns the URLs; `services/*.ts` own the
*domain*.

### Endpoints are functions, not string constants

```ts
// src/api/endpoints.ts — every URL the app can hit, relative to the instance baseURL
const enc = (value: string | number) => encodeURIComponent(String(value));

export const endpoints = {
  products: {
    list: () => '/products',
    search: () => '/products/search',
    byCategory: (slug: string) => `/products/category/${enc(slug)}`,
    categories: () => '/products/categories',
    detail: (id: number | string) => `/products/${enc(id)}`,
    create: () => '/products/add',
    update: (id: number | string) => `/products/${enc(id)}`,
    remove: (id: number | string) => `/products/${enc(id)}`,
  },
  auth: { login: () => '/auth/login', refresh: () => '/auth/refresh', me: () => '/auth/me' },
};
```

`'/products/:id'` forces every caller to substitute — and to remember to
encode. A function does both: forget the id and the compiler tells you; a
category called `home & garden` is encoded once, centrally, and a crafted slug
cannot escape the path segment. Open this file and you see the app's entire
surface area.

### A service returns domain data, never a response

```ts
// src/api/services/products.ts
const LIST_FIELDS = 'id,title,description,category,price,discountPercentage,rating,stock,brand,thumbnail';

interface RequestOptions { signal?: AbortSignal; }   // every READ accepts a signal

export interface ListProductsOptions extends RequestOptions {
  q?: string; category?: string;
  sortBy?: 'price' | 'rating' | ''; order?: 'asc' | 'desc';
  page?: number;   // 0-based
  limit?: number;
}

/** ONE entry point for the three list-shaped endpoints. Search wins over category. */
export async function listProducts({ q = '', category = '', sortBy = '', order = 'asc', page = 0, limit = 12, signal }: ListProductsOptions = {}): Promise<ProductListResponse> {
  // `undefined` params are DROPPED by axios (null and '' are not): build unconditionally, let undefined prune
  const params: Record<string, string | number | undefined> = {
    limit, skip: page * limit, select: LIST_FIELDS,
    sortBy: sortBy || undefined,
    order: sortBy ? order : undefined,
  };

  let url = endpoints.products.list();
  if (q) { url = endpoints.products.search(); params.q = q; }
  else if (category) { url = endpoints.products.byCategory(category); }

  const { data } = await api.get<ProductListResponse>(url, { params, signal });
  return data;                                   // the envelope — never an AxiosResponse
}

export async function getProduct(id: number | string, { signal }: RequestOptions = {}): Promise<Product> {
  const { data } = await api.get<Product>(endpoints.products.detail(id), { signal });   // no `select`: the detail wants every field
  return data;
}
```

The rules, each enforced by this file's shape:

- **No `.data` above this layer, ever.** A service that returns the response
  has moved the problem, not solved it.
- **Never build query strings by hand.** `` `/search?q=${q}` `` breaks on a
  space, `&` or `#`. `params` encodes each value.
- **Every read takes `signal`.** Forget it in one function and that function
  cannot be cancelled — its race condition is the one you spend a day on.
- **Translate here.** snake_case, ISO strings, nested envelopes: normalise
  once, so a renamed field is a one-file change.
- **Services are the only callers of axios.** `import axios from 'axios'` in a
  component is a code smell. Components import services; services import
  `api`.

**→ In the demos:** Demo 6 Labs 2–3; Demo 7 Lab 1 turns `listProducts` into
the one-function-three-endpoints version above.

---

## 8. One `ApiError`, and the message a human sees

A `catch` block gives you `unknown` — JavaScript lets anything be thrown. When
axios rejects, exactly one of three things happened:

```ts
catch (err) {                         // unknown. You know NOTHING yet.
  if (axios.isAxiosError(err)) {      // a type guard — inside, err is AxiosError
    if (err.response) { /* 1. the server ANSWERED with a non-2xx: .status, .data */ }
    else if (err.request) { /* 2. SENT, nothing came back: offline, DNS, CORS, timeout, server down */ }
    err.code   // 'ERR_NETWORK' | 'ECONNABORTED' (timeout) | 'ERR_CANCELED' | 'ERR_BAD_REQUEST' | 'ERR_BAD_RESPONSE'
  } else { /* 3. not from axios — a bug in your own code threw. Don't disguise it as HTTP. */ }
}
```

Teaching every component that decision tree is how axios's internals leak into
the UI. Instead, **normalise once** into one class:

```ts
// src/lib/ApiError.ts
const MESSAGES: Record<number, string> = {
  400: "Some of the details weren't valid.",
  401: 'Your session has expired. Please sign in again.',
  403: "You don't have permission to do that.",
  404: "We couldn't find what you were looking for.",
  429: 'Too many requests. Give it a moment and try again.',
};

/** What DummyJSON (and most APIs) put in an error body. Everything optional — never trust it blindly. */
interface ErrorBody { message?: unknown; errors?: Record<string, string>; }

export class ApiError extends Error {
  readonly status: number;        // 0 = the request never got a response — no real status is 0
  readonly code: string;          // NETWORK | TIMEOUT | CLIENT | HTTP_404 …
  readonly data: unknown;         // the raw error body, for field-level validation
  readonly requestId?: string;    // correlation id from the logging interceptor

  constructor({ message, status = 0, code = 'UNKNOWN', data = null, requestId, cause }: ApiErrorInit) {
    super(message);
    this.name = 'ApiError';
    this.status = status; this.code = code; this.data = data; this.requestId = requestId;
    this.cause = cause;           // the original error, for the stack trace
  }

  /** Worth showing a Retry button for? */
  get isRetryable(): boolean { return this.status === 0 || this.status === 408 || this.status === 429 || this.status >= 500; }
  get isNetwork(): boolean   { return this.code === 'NETWORK'; }
  get isAuth(): boolean      { return this.status === 401; }
  get fieldErrors(): Record<string, string> | null { return (this.data as ErrorBody | null)?.errors ?? null; }

  /** `unknown` in, ApiError out. Idempotent. */
  static from(error: unknown): ApiError {
    if (error instanceof ApiError) return error;

    if (!axios.isAxiosError<ErrorBody>(error)) {
      const message = error instanceof Error ? error.message : 'Something went wrong.';
      return new ApiError({ message, code: 'CLIENT', cause: error });        // our bug, not HTTP
    }
    const requestId = error.config?.headers?.get?.('X-Request-Id')?.toString();

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new ApiError({ message: 'The server took too long to respond. Please try again.', code: 'TIMEOUT', requestId, cause: error });
    }
    if (!error.response) {
      return new ApiError({ message: "Can't reach the server. Check your connection and try again.", code: 'NETWORK', requestId, cause: error });
    }

    const { status, data } = error.response;
    const message =
      (typeof data?.message === 'string' && data.message) ||     // the backend's message beats ours
      MESSAGES[status] ||
      (status >= 500 ? "Something broke on our end. We're looking into it." : 'Something went wrong.');
    return new ApiError({ message, status, code: `HTTP_${status}`, data, requestId, cause: error });
  }
}
```

The kinds of failure, and how each is told apart:

| Kind | Detected by | `status` · `code` | Human message |
|---|---|---|---|
| **Network** (no response) | `!error.response` | `0` · `NETWORK` | "Check your connection" |
| **Timeout** | `error.code === 'ECONNABORTED'` | `0` · `TIMEOUT` | "Took too long — try again" |
| **HTTP** (server answered) | `error.response.status` | 4xx/5xx · `HTTP_404` | backend's `message`, else the table |
| **Validation** (400/422 with a body) | `fieldErrors` | 422 · `HTTP_422` | per field, next to the input |
| **Cancelled** | `axios.isCancel(err)` | — | **nothing** — it is not an error |
| **Client** (our own bug) | `!axios.isAxiosError(err)` | `0` · `CLIENT` | don't disguise it as HTTP |

Rules for the sentences: **4xx** means the user or client can fix it — say
what to do. **5xx** means they cannot — apologise, offer Retry, log it. **No
response** means "check your connection". **Never** render `err.toString()`
or a stack trace. **Always** give a way forward.

### The UI side

A component that renders an `ApiError` knows nothing about axios:

```tsx
export function ErrorNotice({ error, onRetry, title }: { error: ApiError | null | undefined; onRetry?: () => void; title?: string }) {
  if (!error) return null;                        // callers render it unconditionally
  const canRetry = onRetry && error.isRetryable;  // a 404 gets no Retry button — the error said so
  return (
    <Alert variant="danger">
      {title && <Alert.Heading className="h6">{title}</Alert.Heading>}
      <div>{error.message}</div>
      {env.isDev && <code>{error.code} · {error.status || ''} · {error.requestId}</code>}   {/* developers see it; users never do */}
      {canRetry && <Button onClick={onRetry}>Retry</Button>}
    </Alert>
  );
}
```

The `requestId` goes out as a header and comes back on the error
([§9](#9-interceptors)) — a user's screenshot of `HTTP_500 · 500 · 3f2a9c…`
maps to exactly one line in the backend logs.

**→ In the demos:** Demo 5 Lab 3 writes the `toMessage()` switch; Demo 6 Lab 4
absorbs it into `ApiError` and deletes it.

---

## 9. Interceptors

An interceptor runs on every request or response through an instance. It is
the axios feature that justifies the dependency.

```ts
api.interceptors.request.use((config) => { /* mutate */ return config; });
api.interceptors.response.use(
  (response) => response,               // any 2xx — MUST return it
  (error) => Promise.reject(error),     // any failure — MUST re-reject
);
```

| Forgot | Result |
|---|---|
| `return config` | Every request fails with a baffling error |
| `return response` | Every response is `undefined` at the call site |
| `return Promise.reject(error)` | **Failures silently resolve** — the worst bug, because everything looks fine |

### The four ShopScope interceptors

**Logging and correlation** — a request-side id and a response-side timing
line:

```ts
export function installLoggingInterceptor(instance: AxiosInstance) {
  instance.interceptors.request.use((config) => {
    config.headers.set('X-Request-Id', crypto.randomUUID());   // AxiosHeaders has typed .set/.get
    config.metadata = { startedAt: performance.now() };        // our field — see the module augmentation
    logger.debug(`→ ${config.method?.toUpperCase()} ${config.url}`, { params: config.params });
    return config;
  });
  instance.interceptors.response.use(
    (response) => {
      logger.debug(`← ${response.status} ${response.config.url} (${Math.round(performance.now() - (response.config.metadata?.startedAt ?? 0))}ms)`);
      return response;
    },
    (error: unknown) => {
      if (axios.isAxiosError(error)) logger.warn(`✗ ${error.config?.url} ${error.response?.status ?? error.code}`);
      return Promise.reject(error);
    },
  );
}
```

```ts
// src/types/axios.d.ts — teach axios's types about our fields, once, instead of a cast at every use
declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    metadata?: { startedAt: number };
    _retry?: boolean;                 // set by the refresh interceptor: replay at most once
  }
}
```

**Auth header** — read the token *at request time*, never from a default:

```ts
const PUBLIC_PATHS = ['/auth/login', '/auth/refresh'];   // must NEVER carry Authorization

export function installAuthInterceptor(instance: AxiosInstance) {
  instance.interceptors.request.use((config) => {
    const token = tokenStore.getAccess();
    if (token && !PUBLIC_PATHS.some((p) => config.url?.startsWith(p))) config.headers.set('Authorization', `Bearer ${token}`);
    return config;
  });
}
```

`api.defaults.headers.common.Authorization` set once must be updated on login,
logout and every refresh, and a request already built keeps the stale value.
The interceptor has no stale state to get wrong.

**Retry on 401** — one shared refresh, then replay the original request. It
needs the *raw* axios error (`error.config` to replay, `error.response.status`
to decide), which is why it runs before the normaliser. The full flow is
[Module 22](../22-authentication-and-protected-routes/).

**Error normalisation** — the boundary, registered **last**:

```ts
export function installErrorNormalizer(instance: AxiosInstance) {
  instance.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      if (axios.isCancel(error)) return Promise.reject(error);   // pass through untouched — callers still need isCancel()
      const apiError = ApiError.from(error);
      if (apiError.status >= 500 || apiError.isNetwork) logger.error(`[api] ${apiError.code}: ${apiError.message}`, { requestId: apiError.requestId });   // swap for Sentry here
      return Promise.reject(apiError);
    },
  );
}
```

### Order is load-bearing

Response interceptors run in registration order. The logger wants the raw
error; the refresh handler needs `error.config`; the normaliser *replaces* the
error with an `ApiError` that has neither. So:

```ts
// src/api/interceptors/index.ts — called ONCE from main.tsx, before createRoot
export function installInterceptors() {
  installAuthInterceptor(api);        // request side
  installLoggingInterceptor(api);     // 1. sees the raw error: status, timing
  installRefreshInterceptor(api);     // 2. needs the RAW error to replay
  installErrorNormalizer(api);        // 3. LAST — after this, config and response are gone
}
```

Swap 2 and 3 and a 401 just signs the user out. **Install explicitly, not by
import side effect:** a function called from `main.tsx` is ordered, greppable
and skippable in tests; interceptors registered at the bottom of `client.ts`
run in whatever order the bundler evaluates modules. (Request interceptors run
in the *reverse* of registration order — rarely matters, worth knowing.)

Two things not to do in an interceptor: a global `response => response.data`
unwrap (loses `status` and `headers`, breaks every later interceptor — unwrap
in the service), and blanket retry-with-backoff (a `POST` must never be
retried blindly — [§17](#17-retries-only-where-they-are-safe)).

📖 [axios — Interceptors](https://axios-http.com/docs/interceptors)

**→ In the demos:** Demo 6 Lab 4 (logging + normaliser, and the "swap the
order" experiment); Demo 11 adds auth and refresh.

---

## 10. Cancellation and the search race

[Module 12 §11](../12-effects/#11-data-fetching-in-an-effect) described the
race: type "re", then "react"; two requests in flight; "re" resolves last and
wins. The `ignore` flag discards the stale result. `AbortController` actually
**cancels** the request — and the same cleanup makes Strict Mode's
double-invoke ([Module 12 §5](../12-effects/#5-strict-modes-double-invoke))
harmless, because the first request is cancelled the instant the second starts.

```tsx
useEffect(() => {
  const controller = new AbortController();

  async function load() {
    try {
      setLoading(true);
      setError(null);
      setResult(await listProducts({ q: debouncedQuery, page, signal: controller.signal }));   // ← 1
    } catch (err) {
      if (axios.isCancel(err)) return;                        // ← 2
      setError(ApiError.from(err));
    } finally {
      if (!controller.signal.aborted) setLoading(false);      // ← 3
    }
  }

  load();
  return () => controller.abort();                            // ← 4
}, [debouncedQuery, page]);
```

Four lines, each load-bearing:

1. **Pass the signal** through the service to axios. Now it can be told to stop.
2. **Return early on cancel.** A cancelled request is not a failure; without
   this, every cancellation — including Strict Mode's — flashes a red alert.
   axios's check is `axios.isCancel(err)` (or `err.code === 'ERR_CANCELED'`);
   `err.name === 'AbortError'` is `fetch`'s.
3. **Guard `setLoading(false)`.** If a *newer* request cancelled this one, the
   newer one owns the loading flag. Delete this line, throttle to Slow 3G and
   click Retry three times: the skeleton flickers as each stale request lands.
   That flicker *is* the race.
4. **Abort in cleanup** — on unmount and before every re-run.

**Cancel reads, never writes.** Abandoning a `GET` is free. Abandoning a
`POST` may lose the confirmation of something the server already committed
([§14](#14-mutations)).

**Fetch-on-select is the same effect keyed on an id**, with the guard *inside*
the effect — `if (id === null) return;` — never around the hook call. Clear
the previous result before fetching the next, or product A's description
flashes under product B's title.

📖 [MDN — `AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) ·
[axios — Cancellation](https://axios-http.com/docs/cancellation)

**→ In the demos:** Demo 5 Lab 4 (the four lines, and the "delete line 4"
experiment); Demo 7 Lab 4 (the detail drawer).

---

## 11. Debouncing vs throttling

A request per keystroke is wasteful and racy. Two tools, often confused:

| | Debounce | Throttle |
|---|---|---|
| Fires | once, after input has *stopped* for `delay` | at most once per `delay`, *while* input continues |
| Use for | search-as-you-type, autosave, resize-settled | scroll position, mouse tracking, progress ticks |
| "laptop" typed in 1 s, 400 ms delay | **1** request, 400 ms after the last key | ~3 requests, spread across the second |

Search wants debounce: nobody wants results for "lap". The hook is a
`useEffect` cleanup — the cleanup *is* the debounce:

```ts
/** Returns `value`, but only after it has stopped changing for `delay` ms. Generic: whatever goes in comes out. */
export function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);     // each new value cancels the pending timer
  }, [value, delay]);
  return debounced;
}
```

```tsx
const debouncedQuery = useDebouncedValue(filters.query, 400);   // the input stays instant; the NETWORK sees the settled value
useApi((signal) => listProducts({ q: debouncedQuery, signal }), [debouncedQuery]);
```

The classic mistake is depending on `query` instead of `debouncedQuery`:
everything works, the debounce silently does nothing. Check the Network tab,
not the screen. A callback form — `useDebouncedCallback(fn, 400)` — keeps the
latest `fn` in a ref so it never goes stale, and clears the timer on unmount.

**Debouncing and cancellation are complements, not alternatives.** Debouncing
cuts the *number* of requests. A user who types, pauses 400 ms, types again
still has two in flight, and only the `AbortController` stops the first from
landing last.

**→ In the demos:** Demo 7 Lab 1 — type "laptop" with the Network tab open:
one request, 400 ms after the last key.

---

## 12. Parallel requests

Requests that do not depend on each other should not wait for each other:

```ts
const [products, categories] = await Promise.all([listProducts({ signal }), listCategories({ signal })]);
```

Two things to know about `Promise.all`:

- **It fails fast.** One rejection rejects everything, and you lose the
  results that succeeded. When a side widget failing must not blank the page,
  `Promise.allSettled` resolves with one `{ status, value | reason }` per entry:

  ```ts
  const [products, categories] = await Promise.allSettled([listProducts({ signal }), listCategories({ signal })]);
  if (products.status === 'rejected') throw products.reason;                 // the page IS the list
  const strip = categories.status === 'fulfilled' ? categories.value : [];   // the strip is optional
  ```

- **Sharing a `Promise.all` means sharing a lifetime.** Put categories in the
  product effect and they refetch on every keystroke. Categories change
  roughly never; the product page changes constantly.

**Different change frequency → different effect**, each with its own
`AbortController`, its own error handling and its own *importance*. A failed
product list is a broken page — show it loudly. A failed category list costs
a filter strip — log it and move on. Which is which is product design, not
engineering. Avoid the opposite mistake too — a *waterfall* of sequential
`await`s for requests that need nothing from each other.

📖 [MDN — `Promise.all`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all) ·
[`Promise.allSettled`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled)

**→ In the demos:** Demo 7 Lab 2 — two requests start at the same instant;
break the categories endpoint and the app still works.

---

## 13. Pagination

Every list API paginates one of three ways. The state and derivation are the
same; only the request parameter differs.

| Pattern | Request | `total`? | Good for | Weakness |
|---|---|---|---|---|
| **Offset** | `limit=12&skip=24` | yes | numbered pages, "Page 3 of 17" | items shift if the list changes underneath; deep pages are slow |
| **Cursor** | `limit=12&after=eyJpZCI…` | usually not | feeds, anything that inserts at the top | no random access; "page 7" has no meaning |
| **Infinite / load more** | either, appended | optional | mobile, browsing | the back button; memory grows |

### Offset, done properly

```ts
skip: page * limit                            // page is 0-based INTERNALLY; shown as page + 1
const pageCount = Math.ceil(total / limit);   // derived — the only STATE is the page number
```

**Filters reset the page.** You are on page 5 of "all products" and type
"laptop". Six laptops — one page. If `page` stays at 5 you request `skip=60`
and get an empty list that users report as "search is broken".

The rule does **not** need an effect. `useEffect(() => setPage(0), [query])`
is a state change reacting to a state change, one render late
([Module 12 §9](../12-effects/#9-you-might-not-need-an-effect)). Every filter
change goes through one function, so the rule lives there:

```ts
/** A filter change invalidates the current page — unless the patch IS a page change (spread order). */
function updateFilters(patch: Partial<Filters>) {
  setFilters((current) => ({ ...current, page: 0, ...patch }));
}
```

One line, and it cannot be forgotten for a filter you add next year. The pager
is a controlled component: given `page` and `pageCount`, reports
`onChange(next)`, owns nothing.

**Cursor and infinite.** A cursor is an opaque token the server hands back
with each page; you send it to get the next. "Load more" keeps `page` but
*appends* instead of replacing — and now a filter change must reset the
accumulated list as well as the page. That bookkeeping is exactly what
`useInfiniteQuery` and `getNextPageParam` do in
[Module 24](../24-server-state-tanstack-query-and-realtime/).

**→ In the demos:** Demo 7 Lab 3 (offset paging, the reset rule, the pager);
Demo 19 Lab 5 (infinite).

---

## 14. Mutations

### Which verb

| Verb | Meaning | Body | Idempotent? |
|---|---|---|---|
| `POST` | Create, or "run this action" | yes | **No** — twice creates two |
| `PUT` | Replace the whole resource | yes, complete | yes |
| `PATCH` | Update some fields | yes, partial | usually |
| `DELETE` | Remove it | rarely | yes |

**`PATCH` for edit forms.** `PUT` sends the whole object — including fields the
user never touched, which overwrites a colleague's concurrent edit to a
different field. Real backends often treat a `PUT` with a partial body as
"set the missing fields to null".

```ts
// --- Writes. DummyJSON SIMULATES these: the response is real, persistence is not. ---

/** POST — create. Returns the SERVER's version: it has the real id. */
export async function createProduct(payload: ProductDraft, { signal }: RequestOptions = {}): Promise<Product> {
  const { data } = await api.post<Product>(endpoints.products.create(), payload, { signal });
  return data;
}

/** PATCH — partial update. Only the fields you send change — Partial<ProductDraft> says so. */
export async function updateProduct(id: number | string, patch: Partial<ProductDraft>): Promise<Product> {
  const { data } = await api.patch<Product>(endpoints.products.update(id), patch);
  return data;
}

export async function deleteProduct(id: number | string): Promise<Product & { isDeleted: boolean; deletedOn: string }> {
  const { data } = await api.delete<Product & { isDeleted: boolean; deletedOn: string }>(endpoints.products.remove(id));
  return data;
}
```

A plain object is serialised as JSON. And the most common axios mistake:
`get(url, config)` and `delete(url, config)` take two arguments;
`post(url, data, config)`, `put` and `patch` take three. Put config where
data goes and your headers get sent as the body.

### Mutations are handler work, not effect work

A `POST` in a mount effect fires twice under Strict Mode — and twice on a
double-click in production. The shape, in the form:

```tsx
async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();
  if (saving) return;                          // 1. guard the double-click
  try {
    setSaving(true);
    setError(null);
    await onSubmit(payload);                   // the parent talks to the server and closes us on success
    setDraft(PRODUCT_EMPTY);
  } catch (err) {
    setError(ApiError.from(err));              // 2. stay open, KEEP THE INPUT
  } finally {
    setSaving(false);
  }
}
```

Five rules that separate a real form from a demo:

1. **Disable submit while in flight** — and `backdrop="static"` on a modal.
2. **Never clear the form on error.** "The form cleared and my data was gone"
   is the ticket that makes users distrust an app permanently. The fix is one
   line: `setError` instead of `setDraft(EMPTY)` in the catch.
3. **Use what the server returns.** It has the real id, server-side defaults,
   computed fields. Never echo your own payload into state.
4. **Don't cancel mutations on unmount.** `deleteProduct` above takes no
   `signal` on purpose. Cancel reads; let writes finish.
5. **Say something on success.** Silence reads as failure.

### Merging the server's version, and refetching after

The parent owns *what the request is* and *what happens to the result*; the
form owns the lifecycle. `handleSave` does not `try`/`catch` — it throws
*into* the form's catch:

```tsx
/** DummyJSON's create response echoes only what you sent — fill what a card needs to render. */
const CARD_DEFAULTS: Pick<Product, 'rating' | 'discountPercentage' | 'thumbnail'> = { rating: 0, discountPercentage: 0, thumbnail: PLACEHOLDER_THUMBNAIL };

async function handleSave(payload: ProductDraft) {
  const saved = editing ? await updateProduct(editing.id, payload) : await createProduct(payload);
  setResult((current) => {                           // use the SERVER's version
    if (!current) return current;
    const exists = current.products.some((p) => p.id === saved.id);
    return {
      ...current,
      products: exists
        ? current.products.map((p) => (p.id === saved.id ? { ...p, ...saved } : p))
        : [{ ...CARD_DEFAULTS, ...saved }, ...current.products],   // defaults first, server last
      total: exists ? current.total : current.total + 1,
    };
  });
  closeForm();
}
```

Merging into local state is the cheap answer, fine for a list you hold. The
honest answer for anything *shared* — a count in the header, a list on another
screen — is **refetch after mutate**: `reload()` the affected query, or let a
route action trigger revalidation ([Module 14](../14-routing/)). Hand-rolled
code cannot know *what else is on screen*; that is the gap invalidation fills
in [Module 13 §9](../13-data-fetching-and-custom-hooks/#9-mutations-and-invalidation).

**Reset the form with a `key`, not an effect.** `useEffect(() => setDraft(toDraft(editing)), [editing])`
lags a render and the lint rule rejects it. The parent renders
`<ProductForm key={editing?.id ?? 'new'} …/>` and `useState(() => toDraft(editing))`
runs fresh on every remount ([Module 8 §16](../08-state-structure/#16-the-key-reset-in-practice)).

📖 [react.dev — Sending a POST request](https://react.dev/learn/you-might-not-need-an-effect#sending-a-post-request) ·
[Resetting state with a key](https://react.dev/learn/you-might-not-need-an-effect#resetting-all-state-when-a-prop-changes)

**→ In the demos:** Demo 8 Labs 1–3 — break the create endpoint, submit, and
watch the input survive.

---

## 15. Optimistic UI with rollback

Delete waits for the server before the card leaves. On a slow connection the
UI feels stuck for two seconds on an action the user is 99% sure will succeed.

**Optimistic** means: apply the change now, confirm quietly, undo if the
server disagrees. By hand, that is four steps you must not skip:

```tsx
async function handleDelete(id: number) {
  const snapshot = products;                                 // 1. remember
  setProducts((cur) => cur.filter((p) => p.id !== id));      // 2. apply now
  try {
    await deleteProduct(id);                                 // 3. confirm
  } catch (err) {
    setProducts(snapshot);                                   // 4. roll back
    setFlash(`Couldn't delete — restored. ${ApiError.from(err).message}`);
  }
}
```

Skip the snapshot and you cannot undo. Skip the message and a row that
reappears with no explanation looks like a bug — rollback must be *honest*.

**With a derivation, there is nothing to snapshot.** If the in-flight
submission is itself state — a router fetcher's `formData`, or a local
`deletingId` — render the list *as a function of it*:

```tsx
const products = deletingId ? result.products.filter((p) => String(p.id) !== deletingId) : result.products;
```

If the action fails, `deletingId` clears and the row is simply rendered again.
The UI was never a *copy* mutated ahead of time; it was a *derivation* of
request state. That is also the model behind React 19's `useOptimistic`
([Module 10 §12](../10-forms/#12-useoptimistic)) and TanStack Query's
`onMutate` / `onError` / `onSettled`
([Module 13 §10](../13-data-fetching-and-custom-hooks/#10-optimistic-updates)).

**When to be optimistic:** high-probability, low-stakes, reversible — a like,
marking done, deleting from a list. **When not to:** payments; anything where
the server *computes* what you would display (an optimistic *create* has no
id for its `key`); anything where a silent rollback confuses more than a
spinner would.

📖 [react.dev — `useOptimistic`](https://react.dev/reference/react/useOptimistic)

**→ In the demos:** Demo 14 Lab 1 — delete on Slow 3G vanishes on click; point
the action at id 999999 and the row comes back by itself.

---

## 16. Upload progress

A file is not JSON. Files are big, uploads take time, users want progress and
a Cancel button — none of which `api.post(url, {…})` gives you.

```ts
// src/api/services/uploads.ts
interface UploadOptions {
  onProgress?: (percent: number) => void;   // 0–100
  signal?: AbortSignal;                      // the one request users NEED a Cancel button for
}

export async function uploadFile(file: File, { onProgress, signal }: UploadOptions = {}): Promise<UploadResult> {
  const form = new FormData();
  form.append('file', file, file.name);

  // Do NOT set Content-Type: the browser adds `multipart/form-data; boundary=…` itself.
  const { data } = await uploadApi.post<HttpbinEcho>('/post', form, {
    signal,
    onUploadProgress: (event) => {            // AxiosProgressEvent: loaded is a number, total is number | undefined
      if (!event.total) return;               // unknown for chunked bodies
      onProgress?.(Math.round((event.loaded / event.total) * 100));
    },
  });
  return { size: file.size, echoedFiles: Object.keys(data.files ?? {}) };
}
```

Four facts, each the fix for a real bug:

- **Never set `Content-Type` on a multipart upload.** The header must include a
  generated boundary you do not know; set it yourself and every backend
  returns a 400. That is why uploads go through a separate `uploadApi` with no
  JSON default — and **no timeout**, because a 10 s limit kills a large file.
- **`total` can be undefined.** Guard it.
- **100% means the bytes left the browser**, not that the server is done.
  Label the full bar "Processing…" rather than leaving it looking stuck.
- **The `AbortController` lives in a ref.** It is not render state, and
  re-rendering on every progress tick must not recreate it
  ([Module 11 §3](../11-refs-and-the-dom/#3-when-a-ref-is-the-right-tool)).

```tsx
const controllerRef = useRef<AbortController | null>(null);

async function handleUpload() {
  const controller = new AbortController();
  controllerRef.current = controller;
  try {
    setProgress(0);
    setResult(await uploadFile(file, { onProgress: setProgress, signal: controller.signal }));
  } catch (err) {
    if (!axios.isCancel(err)) setError(ApiError.from(err));   // uploadApi has no interceptors: normalise HERE
  } finally {
    setProgress(null);
    controllerRef.current = null;
  }
}
// <Button onClick={() => controllerRef.current?.abort()}>Cancel</Button>
```

An instance without the normaliser rejects with a *raw* axios error, so the
caller normalises itself. The feature ships behind `env.features.uploads` —
on in development and staging, off in production. A feature flag is how you
ship code before you ship the feature.

📖 [axios — Request config: `onUploadProgress`](https://axios-http.com/docs/req_config)

**→ In the demos:** Demo 14 Lab 2 — a 5–20 MB file on Slow 3G; inspect the
request and find the boundary the browser set.

---

## 17. Retries, only where they are safe

A flaky connection fails one request in twenty. Most would succeed a second
later. But retrying the *wrong* request is worse than failing.

| Situation | Retry? |
|---|---|
| Network error (no response) | yes |
| 408 timeout, 429 rate-limited | yes (respect `Retry-After`) |
| 500 / 502 / 503 / 504 | yes — for `GET`, `PUT`, `DELETE` |
| Any other 4xx | **no** — the request is wrong; repeating will not change the answer |
| A failed `POST` | **no** — it may have succeeded with only the response lost; retrying creates a duplicate |

The idempotency column from [§14](#14-mutations) is the whole rule.

```ts
// src/lib/retry.ts
export function isRetryable(error: unknown): boolean {
  if (axios.isCancel(error)) return false;
  const status = error instanceof ApiError ? error.status : axios.isAxiosError(error) ? (error.response?.status ?? 0) : 0;
  return status === 0 || status === 408 || status === 429 || status >= 500;
}

/** Retry an IDEMPOTENT operation with exponential backoff and jitter. Never wrap a POST in this. */
export async function withRetry<T>(fn: () => Promise<T>, { attempts = 3, baseDelayMs = 400, signal }: RetryOptions = {}): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const lastAttempt = attempt >= attempts - 1;
      if (lastAttempt || !isRetryable(error) || signal?.aborted) throw error;   // signal: the caller has gone away
      const delay = baseDelayMs * 2 ** attempt + Math.random() * 200;          // 400, 800, 1600 ms + jitter
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
```

```ts
withRetry(() => listProducts({ q, page, signal }), { signal });   // the GET — and ONLY the GET
```

- **Jitter.** Without it every client that failed together retries together
  and floors the server again — a synchronised stampede.
- **Cap it.** Two or three attempts in a UI. Beyond that the user is staring
  at a spinner while you politely hammer a dead service. Show the error and a
  Retry button, and let them decide.
- **Respect the caller's signal.** The user navigated away; keep retrying and
  you are working for nobody.
- **A wrapper, not an interceptor.** An interceptor retries *every* request
  through the instance, including the `POST` that must not be. A wrapper makes
  the decision visible at the call site. The one retry that *does* belong in
  an interceptor is 401 → refresh → replay, because it retries exactly once,
  only on 401, never for the auth endpoints
  ([Module 22](../22-authentication-and-protected-routes/)).

**→ In the demos:** Demo 14 Lab 3 — point the base URL at `localhost:9` and
count three attempts ~0.4, ~0.8, ~1.6 s apart; break the path to a 404 and
count one.

---

## 18. `useApi` and its limits

Count the fetch effects after §10–§13: two in the page, one in the detail
drawer. Each is twenty lines of identical ceremony — `loading`, `error`,
`AbortController`, `isCancel`, the aborted-guard — and the next copy will
forget the guard. [Module 13 §5](../13-data-fetching-and-custom-hooks/#5-building-usefetch-properly)
extracted `useFetch` over `fetch`; this is the same hook over the service
layer:

```ts
// src/hooks/useApi.ts
export interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  reload: () => void;
  setData: React.Dispatch<React.SetStateAction<T | null>>;   // mutations update the list without a round trip
}

/** Runs `fetcher(signal)` whenever `deps` change. Generic: `data` is whatever the fetcher resolves to. */
export function useApi<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: unknown[] = [],
  { skip = false, initialData = null }: { skip?: boolean; initialData?: T | null } = {},   // skip = the early return, named
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<ApiError | null>(null);
  const [nonce, setNonce] = useState(0);
  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (skip) return;
    const controller = new AbortController();
    async function load() {
      try {
        setLoading(true);
        setError(null);
        setData(await fetcher(controller.signal));
      } catch (err) {
        if (axios.isCancel(err)) return;
        setError(ApiError.from(err));
        setData(null);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce, skip]);

  return { data, loading: loading && !skip, error, reload, setData };
}
```

```tsx
// T is INFERRED from the fetcher: result is ProductListResponse | null
const fetchProducts = useCallback(
  (signal: AbortSignal) => listProducts({ q: debouncedQuery, category, sortBy, order, page, limit: PAGE_SIZE, signal }),
  [debouncedQuery, category, sortBy, order, page],
);
const { data: result, loading, error, reload, setData: setResult } = useApi(fetchProducts, [debouncedQuery, category, sortBy, order, page]);

// the fetcher MAPS the response, so we SAY the T
const { data: categories } = useApi<CategoryOption[]>((signal) => listCategories({ signal }).then(toOptions), [], { initialData: [] });

// fetch-on-select: `skip` replaces the early return
const { data: product } = useApi(fetcher, [id], { skip: id === null });
```

Three design decisions, each with a reason:

- **`deps` is a parameter, not `[fetcher]`.** A new arrow is created every
  render; depending on it would refetch forever. Explicit deps hand that
  judgement to the caller, like `useEffect`.
- **The `eslint-disable`.** The exhaustive-deps rule cannot analyse a spread
  array. This is the standard trade-off in every `useApi`-style hook, and it
  is **the one discipline the hook demands**: if the fetcher closes over a
  value, that value goes in `deps`. Remove `page` from the deps and click
  Next — nothing happens, with no warning.
- **`setData` is returned**, so a mutation can merge the server's response
  without a round trip ([§14](#14-mutations)).

### Where this ends

`useApi` handles one component's request, correctly. It structurally cannot:

| Missing | What the user experiences |
|---|---|
| Cache | navigate away and back → full skeleton for data you had two seconds ago |
| Dedupe across components | two components, same key → two identical requests |
| Shared state | those two components hold copies that can disagree |
| Stale-while-revalidate | every refetch blanks the screen |
| Retry, refetch on focus / reconnect | hand-wired per call site, or not at all |
| Invalidation after a mutation | it has no idea what else is mounted |
| Pagination, infinite, prefetch | rewritten per screen |

That is the feature list of TanStack Query, and the reason
[Module 24](../24-server-state-tanstack-query-and-realtime/) exists. Note what
TanStack Query does **not** replace: everything in §3–§9.
`queryFn: ({ signal }) => listProducts({ q, signal })` calls the same service,
through the same instance, with the same interceptors and the same
`ApiError`. The API layer is the part that survives.

The good `useApi` is twenty lines and honest about what it does not do. The
bad one grows caching and retry and dedupe over two years until someone
replaces it with a library that does those things properly. **Do not
hand-roll a cache.**

📖 [react.dev — Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)

**→ In the demos:** Demo 8 Lab 4 — `App.tsx` ends with no `useEffect`, and
`grep AbortController src/` returns one line.

---

## 19. Self-check

1. Name the five things a fetching component "knows" that have nothing to do
   with rendering, and the file each one moves to.
2. Which `.env` files does `vite --mode staging` load, and in what order do
   they win?
3. Why can a `VITE_` variable never hold a secret? What does the prefix
   protect against, and what does it not?
4. `if (import.meta.env.VITE_FEATURE_UPLOADS)` is always true. Why, and where
   is the one place to fix it?
5. What does `required()` throwing *on import* buy you over a check at the
   call site?
6. Give three things axios does that `fetch` makes you write, and the one
   behavioural difference that matters most for a `try`/`catch`.
7. Why must you never set `axios.defaults.headers.common.Authorization`?
8. "`api.get<Product>()` is a claim, not a check." Explain, and say what you
   would add for an API you do not own.
9. Why are endpoints functions rather than string constants? Both reasons.
10. State the one rule about a service's return value and the one parameter
    every *read* must accept.
11. `{ params: { sortBy: '' } }` vs `{ params: { sortBy: undefined } }` — what
    URL does each produce?
12. List the kinds of failure `ApiError.from` distinguishes, how each is
    detected on the axios error, and the `status`/`code` it gets.
13. For a 404, a 500 and a network error: which gets a Retry button, and what
    decides?
14. Name the three return lines an interceptor must never forget and what
    forgetting each does.
15. Why must the error normaliser be registered last? What breaks if the
    refresh handler runs after it?
16. Why install interceptors from `main.tsx` rather than at the bottom of
    `client.ts`?
17. Explain each of the four load-bearing lines in the cancellation effect —
    and what you see on Slow 3G if you delete the `finally` guard.
18. Why cancel a `GET` on unmount but never a `POST`?
19. Debounce vs throttle: define both, say which search wants, and why
    debouncing is not a substitute for cancellation.
20. When should two requests share an effect? What is the test? When is
    `Promise.all`'s fail-fast wrong?
21. Offset vs cursor vs infinite: a strength and a weakness of each. Why does
    a filter change reset the page without an effect?
22. `PUT` vs `PATCH` for an edit form — which, and why?
23. State the five rules that separate a real form from a demo, and explain
    the spread order in `{ ...CARD_DEFAULTS, ...saved }`.
24. Name the four steps of a manual optimistic update, and why a *derived*
    optimistic UI needs none of them. Why is an optimistic *create* a bad idea?
25. Why must you not set `Content-Type` on a multipart upload, and what does
    100% on the progress bar actually mean?
26. Which failures are retryable, why is a failed `POST` never one, and why is
    `withRetry` a wrapper rather than an interceptor?
27. What is the one discipline `useApi` demands, and what happens silently if
    you break it?
28. List six things `useApi` cannot do — and name the parts of this module
    that TanStack Query does **not** replace.

### Practical

1. Start from a component that calls `axios.get('https://dummyjson.com/products')`
   directly. Extract `env.ts`, `client.ts`, `endpoints.ts` and
   `services/products.ts` until `grep -rn dummyjson src/` returns nothing and
   no component imports axios.
2. Comment out `VITE_API_BASE_URL`, reload, read the error. Set
   `VITE_FEATURE_UPLOADS=false` and prove the flag is actually off.
3. Write `ApiError.from`, then trigger every failure kind — a bad path, a bad
   host, `timeout: 500` with `delay=3000`, a thrown `TypeError` of your own —
   and check each sentence and `code`.
4. Install logging and normaliser interceptors. Swap their order and describe
   the timing line. Comment out `Promise.reject` in the normaliser and
   describe what a 404 now does.
5. Build search-as-you-type with `useDebouncedValue` and `AbortController`.
   On Slow 3G, watch requests get `(canceled)`; delete the `finally` guard and
   reproduce the flicker.
6. Add offset pagination with the reset rule in `updateFilters`. Go to page 5,
   search for something with one page of results, confirm `skip=0`.
7. Wire `POST`/`PATCH`/`DELETE` through the service. Break the create
   endpoint, submit, confirm the input survives. Switch between editing two
   products and confirm the `key` remounts the form.
8. Make delete optimistic by hand (four steps), force a failure, watch the
   rollback. Rewrite it as a derivation from `deletingId` and delete the
   rollback code.
9. Upload a 10 MB file to `httpbin.org/post` with a progress bar and Cancel.
   Set `Content-Type` yourself once, read the 400, remove it.
10. Wrap the list `GET` in `withRetry`, point the base URL at `localhost:9`,
    count attempts and gaps. Say out loud why the `POST` is not wrapped.
11. Collapse every fetch effect into `useApi`. Remove one dep on purpose,
    observe the silent staleness, put it back.

---

## 20. References

Official documentation only.

**React**
- [Synchronizing with Effects: Fetching data](https://react.dev/learn/synchronizing-with-effects#fetching-data)
- [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
- [Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [`useOptimistic`](https://react.dev/reference/react/useOptimistic)
- [`StrictMode`](https://react.dev/reference/react/StrictMode)

**axios 1.x**
- [Getting started](https://axios-http.com/docs/intro)
- [The axios instance](https://axios-http.com/docs/instance)
- [Request config](https://axios-http.com/docs/req_config)
- [Response schema](https://axios-http.com/docs/res_schema)
- [Config defaults](https://axios-http.com/docs/config_defaults)
- [Interceptors](https://axios-http.com/docs/interceptors)
- [Handling errors](https://axios-http.com/docs/handling_errors)
- [Cancellation](https://axios-http.com/docs/cancellation)

**Vite 8**
- [Env Variables and Modes](https://vite.dev/guide/env-and-mode)
- [IntelliSense for TypeScript (`ImportMetaEnv`)](https://vite.dev/guide/env-and-mode#intellisense-for-typescript)

**Web platform (MDN)**
- [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)
- [`Promise.all`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all)
- [`Promise.allSettled`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled)
- [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData)

**The backend**
- [DummyJSON — Products](https://dummyjson.com/docs/products)
- [DummyJSON — Auth](https://dummyjson.com/docs/auth)

---

**Previous:** [Module 20 — Shipping to Production](../20-production/)
**Next:** [Module 22 — Authentication & Protected Routes](../22-authentication-and-protected-routes/)
