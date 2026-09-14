# Demo 6 — Configuration & the API Layer

**Demo guide** · ~110 minutes · nothing on screen changes, and the codebase becomes one you'd ship

---

## Where you are starting from

The starter is **Demo 5, finished**: 194 products from DummyJSON, loading
skeletons, human error messages, Retry, and cancellation. It works. It is
also a component that knows a URL, a query-string format, a response envelope
and the shape of an axios error — and every future component would have to
know all of that too.

New in the box, all stubs: `src/config/env.ts`, `src/config/logger.ts`,
`src/api/client.ts`, `src/api/endpoints.ts`, `src/api/services/products.ts`,
`src/lib/ApiError.ts`, and `src/api/interceptors/*`. Plus three `.env.*`
files.

## What you ship today

The same app, with a layered API module:

```
config/env.ts          validated once; the only file that reads import.meta.env
   ↓
api/client.ts          the axios instances
api/endpoints.ts       every URL in the app
api/interceptors/      logging + error normalisation, installed in order
api/services/          products.ts — returns domain data, never a response
   ↓
lib/ApiError.ts        the ONE error type anything above api/ ever sees
   ↓
components             know about products and ApiErrors. Nothing else.
```

By the end you will be able to answer, without hesitating:

- Which `.env` file Vite loads when, and what the `VITE_` prefix protects you from
- Why a `"false"` in an env var is `true`, and where to fix that once
- What an axios *instance* is and why you never configure the global
- Why endpoints are functions, not string constants
- What "the service layer returns domain data" rules out
- What an interceptor is, the one line each must never forget, and why their **order is load-bearing**

---

## Before the demo (5 minutes)

```
https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/06-config-and-the-api-layer/starter
```

> ⚠️ Click once, bookmark the `stackblitz.com/edit/…` URL.

Locally: `cd demos/06-config-and-the-api-layer/starter && npm install && npm run dev`.

---

## The cold open

Open `src/App.tsx` and count what it knows that has nothing to do with
*rendering products*:

1. A hostname, hard-coded: `https://dummyjson.com`
2. A path: `/products`
3. A query-string format: `limit`, `select`, and the exact list of fields
4. That the response is an envelope with `.products` inside
5. That errors have `.response`, `.request`, `.code`, `.config`

Now imagine a second component that fetches one product. And a third that
fetches categories. Each copies all five. Then the backend moves to
`/v2/products` — or staging needs a different host — and you grep.

Today we take all five out of the component and put each in exactly one place.

---

## Lab 1 — Environment profiles (25 min)

### Problem

`https://dummyjson.com` is in the source. The same build has to run against a
local backend on your laptop, a staging API, and production. Hard-coding means
a code change per environment, or a nest of `if (location.host === …)`. Both
are worse than the five-line alternative.

### Concept

**Vite has a *mode*.** `npm run dev` is mode `development`; `npm run build` is
mode `production`; `vite --mode staging` is mode `staging`. The mode picks
which `.env` files load:

| File | Loaded when | Commit it? |
|---|---|---|
| `.env` | always | ✅ shared defaults |
| `.env.local` | always, except tests | ❌ personal overrides |
| `.env.[mode]` | only in that mode | ✅ |
| `.env.[mode].local` | only in that mode | ❌ |

Later files win; `.local` beats non-local.

> **This repo's root `.gitignore` ignores `.env`** — a common team convention,
> because people put secrets in it. So our shared values live in each
> `.env.[mode]` file instead, and there's a `.env.example` to copy into
> `.env.local`. Open the three `.env.*` files now and compare them: same keys,
> different values.

**Only variables prefixed `VITE_` reach the browser.** Everything else is
stripped at build time — a guard rail so a stray `DATABASE_URL` in your shell
doesn't end up in a public bundle.

**And everything that *does* reach the browser is public.** `VITE_` variables
are compiled into the JavaScript and readable by anyone with DevTools. They
are for *configuration*, not *secrets*. A private API key belongs on a server
you control, which proxies the request. There is no client-side workaround.

**Read them once, validate, freeze.** `import.meta.env.VITE_…` scattered
across forty files just moves the problem from *values* to *names*. One module
reads them all, checks they exist, coerces types — and throws at startup if
something's missing, which is the cheapest possible time to find out.

### Steps

**A. `src/vite-env.d.ts` — name the variables**

Vite types `import.meta.env.VITE_ANYTHING` as `any`, which means a typo in a
variable *name* is a silent `undefined`. Declaring ours makes it a compile
error instead. This file is **already written** in the starter — nothing else
in this lab compiles without it — so open it and read it before you touch
`env.ts`:

```ts
/// <reference types="vite/client" />

/**
 * Names and types for OUR env vars. Values are always strings (or missing);
 * config/env.ts coerces them.
 */
interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_TIMEOUT_MS?: string;
  readonly VITE_LOG_LEVEL?: string;
  readonly VITE_FEATURE_UPLOADS?: string;
  readonly VITE_PAGE_SIZE?: string;
  readonly VITE_UPLOAD_BASE_URL?: string;
}
```

(`interface ImportMetaEnv` *merges* with Vite's own declaration — that's how
`.d.ts` augmentation works. The last two keys are for Demos 7 and 13. Compare
with Demo 5's starter, where this file was the single `/// <reference>` line.)

**B. `src/config/env.ts` — `TODO(lab-1.1)`**

Replace the file:

```ts
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
const LOG_LEVELS: readonly LogLevel[] = ['debug', 'info', 'warn', 'error'];

/** Only the keys declared in vite-env.d.ts — a typo in a variable NAME is a compile error, not a silent undefined. */
type EnvKey = keyof ImportMetaEnv & `VITE_${string}`;

function required(name: EnvKey): string {
  const value = import.meta.env[name];
  if (value === undefined || value === '') {
    throw new Error(`[config] Missing required env var ${name}. Add it to .env.${import.meta.env.MODE}.`);
  }
  return value;
}

function optional(name: EnvKey, fallback: string): string {
  const value = import.meta.env[name];
  return value === undefined || value === '' ? fallback : value;
}

function asNumber(name: EnvKey, fallback: number): number {
  const raw = import.meta.env[name];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) throw new Error(`[config] ${name} must be a number, got "${raw}".`);
  return parsed;
}

/** Env vars are ALWAYS strings. The string "false" is truthy. This is the classic bug. */
function asBoolean(name: EnvKey, fallback: boolean): boolean {
  const raw = import.meta.env[name];
  if (raw === undefined || raw === '') return fallback;
  return raw === 'true' || raw === '1';
}

function asLogLevel(name: EnvKey, fallback: LogLevel): LogLevel {
  const raw = optional(name, fallback);
  if (!(LOG_LEVELS as readonly string[]).includes(raw)) {
    throw new Error(`[config] ${name} must be one of ${LOG_LEVELS.join(' | ')}, got "${raw}".`);
  }
  return raw as LogLevel;     // safe: the line above just proved it
}

export const env = Object.freeze({
  appName: optional('VITE_APP_NAME', 'ShopScope'),
  mode: import.meta.env.MODE,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,

  api: Object.freeze({
    baseUrl: required('VITE_API_BASE_URL').replace(/\/$/, ''),
    timeoutMs: asNumber('VITE_API_TIMEOUT_MS', 10_000),
  }),

  logLevel: asLogLevel('VITE_LOG_LEVEL', 'warn'),   // a LogLevel, not a string

  features: Object.freeze({
    uploads: asBoolean('VITE_FEATURE_UPLOADS', false),
  }),
});

/** The config's shape, for anything that wants to accept it as a parameter. */
export type Env = typeof env;

if (env.isDev) {
  console.info(`[config] ${env.appName} · mode=${env.mode} · api=${env.api.baseUrl}`);
}
```

Five things this buys you:

1. **Fail fast, loudly.** A missing `VITE_API_BASE_URL` throws on import with a
   message naming the file to fix — not `undefined` silently concatenated into
   a URL.
2. **Type coercion in one place.** `VITE_FEATURE_UPLOADS` is the *string*
   `"false"`, which is truthy. `asBoolean` is the fix, written once.
3. **`Object.freeze`.** Nobody "temporarily" mutates config.
4. **Normalisation.** The trailing-slash strip prevents `https://api.co//products`.
5. **One import to mock in tests.**
6. **Types that mean something.** `env.logLevel` is a `LogLevel`, not a
   `string`; `env.api.timeoutMs` is a `number`. Downstream code never
   re-checks. `Env = typeof env` gives you the whole shape for free.

**C. `src/config/logger.ts` — `TODO(lab-1.2)`**

```ts
import { env, type LogLevel } from './env';

const LEVELS: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const threshold = LEVELS[env.logLevel];   // env.logLevel is a LogLevel, so this index can't miss

function log(level: LogLevel, ...args: unknown[]) {
  if (LEVELS[level] < threshold) return;
  const method = level === 'debug' ? 'log' : level;
  console[method](`[${level}]`, ...args);
}

export const logger = {
  debug: (...a: unknown[]) => log('debug', ...a),
  info: (...a: unknown[]) => log('info', ...a),
  warn: (...a: unknown[]) => log('warn', ...a),
  error: (...a: unknown[]) => log('error', ...a),
};
```

`console.log` left in production is noise at best and a data leak at worst.
`logger.debug(…)` is free in production — the level check short-circuits
before the arguments are formatted.

### Verify

Reload. The console shows `[config] ShopScope (dev) · mode=development ·
api=https://dummyjson.com`. Stop the dev server and run `npm run dev:staging`
— `mode=staging`, and the app name changes.

Now **comment out `VITE_API_BASE_URL`** in `.env.development` and reload. A
red overlay: *"Missing required env var VITE_API_BASE_URL. Add it to
.env.development."* — at startup, naming the file. Uncomment it.

### Watch out

**Editing `.env.*` needs a dev-server restart.** Vite reads them at startup.
If a change "doesn't work", restart.

**`if (import.meta.env.VITE_FEATURE_UPLOADS)`** — always true, because
`"false"` is a non-empty string. Use `env.features.uploads`.

**Putting a secret in `VITE_ANYTHING`.** Open your built bundle, search for
it. It's there.

### Challenge (2 min)

Add `VITE_PAGE_SIZE` (default 12) through `asNumber`, and set it to `6` in
`.env.development` only. Which file did you touch to consume it? (You'll use
it in Demo 7.)

### In the real world

Create React App uses `REACT_APP_`; Next.js uses `NEXT_PUBLIC_`. The prefix
differs; the rule — *the bundle is public* — does not. And the validated
config module is the thing that turns "the staging deploy is broken and nobody
knows why" into a one-line error at boot.

---

## Lab 2 — The HTTP client and the endpoint registry (20 min)

### Problem

`axios.get('https://dummyjson.com/products')` — the host and the path are in a
component. Every call site repeats the host. Every call site can typo the path.
And the moment you need a header on every request, you're editing every call.

### Concept

**An axios *instance* is a pre-configured axios** with its own defaults and —
critically — its own interceptors:

```ts
export const api = axios.create({ baseURL: env.api.baseUrl, timeout: env.api.timeoutMs });
api.get('/products');   // → https://dummyjson.com/products
```

**Never configure the global `axios`.** `axios.defaults.headers.common.Authorization = …`
looks convenient. But the global `axios` is shared with every library in
`node_modules` that imports it — set a global auth header and **your token is
sent to third-party domains** the moment some SDK makes a request. Instances
are isolated.

**`timeout` defaults to `0` — meaning never.** A dead backend leaves your
skeleton shimmering until the user gives up. Always set one.

**Endpoints are functions, not string constants.** `PRODUCT_DETAIL = '/products/:id'`
forces every caller to do the substitution — and to remember to encode. A
function does both:

```ts
detail: (id: number | string) => `/products/${encodeURIComponent(id)}`   // forget the id and the compiler tells you
```

A slug like `home & garden` breaks a hand-built URL; a crafted one can escape
the path segment entirely. Encode every interpolated segment, centrally, once.

### Steps

**A. `src/api/client.ts` — `TODO(lab-2.1)`**

```ts
import axios, { type AxiosInstance, type CreateAxiosDefaults } from 'axios';
import { env } from '../config/env';

const baseConfig: CreateAxiosDefaults = {
  baseURL: env.api.baseUrl,
  timeout: env.api.timeoutMs,
  headers: { 'Content-Type': 'application/json' },
};

/** The app's HTTP client. Import THIS — never bare `axios`. */
export const api: AxiosInstance = axios.create(baseConfig);

/**
 * No interceptors, ever. Used by the token-refresh flow (Demo 11) so a
 * failing refresh can't re-enter the 401 handler that triggered it.
 */
export const bareApi: AxiosInstance = axios.create(baseConfig);
```

**B. `src/api/endpoints.ts` — `TODO(lab-2.2)`**

```ts
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
};
```

You'll use `search`, `byCategory`, `create`, `update` and `remove` in Demos 7
and 8. Listing them now costs nothing and means a new developer can open this
one file and see the app's entire surface area.

### Verify

Nothing on screen changes yet — `App.tsx` still calls axios directly. Confirm
the build is clean, then `console.log(api.defaults.baseURL)` somewhere
temporary. `https://dummyjson.com`. Set `VITE_API_BASE_URL=https://dummyjson.com/`
(trailing slash) in `.env.development`, restart — still no double slash,
because `env.ts` strips it.

### Watch out

**`url: 'products'` vs `url: '/products'`.** With `baseURL: 'https://api.co/v1'`,
the leading slash matters in some versions. Always lead with `/`; be consistent.

**`import axios from 'axios'` in a component.** From now on that's a code
smell. Components import services; services import `api`.

### In the real world

A second instance is how you handle exceptions: an upload endpoint with
`timeout: 0`, a third-party API with different auth, or — as you'll see in
Demo 11 — a bare client the auth flow can use without triggering itself.

---

## Lab 3 — The service layer (20 min)

### Problem

`App.tsx` knows the response is `{ products, total, skip, limit }` and reaches
into `.products`. It knows the `select` field list. If the backend renames a
field, `App.tsx` changes — and so does every other component that fetches
products.

### Concept

**Two layers, two jobs.** `endpoints.ts` owns the URLs. `services/*.js` own the
*domain*: they call the client, unwrap the envelope, translate shapes, and
return data a component can use directly.

**The rule: a service returns domain data, not an axios response.** No `.data`
above this layer, ever.

```ts
// Before — the component knows about URLs, params, and envelopes (and gets an AxiosResponse back)
const { data } = await api.get<ProductListResponse>('/products', { params: { limit, skip, select } });
setProducts(data.products);

// After — the component knows about products. The return type SAYS "domain data".
const { products, total }: ProductListResponse = await listProducts({ limit });
```

What it buys:

- **One place to change** when an endpoint moves or a field is renamed.
- **Testable** — mock four functions instead of every URL in the app.
- **Discoverable** — open `services/products.ts` and see everything the app
  can do with products.
- **A translation boundary.** Backends return snake_case, ISO strings, nested
  envelopes. Normalise here, once.

**Every function takes `signal`.** Cancellation has to be plumbed all the way
through, or the layer above can't cancel what the layer below is doing. This
is the single most-forgotten detail in a service layer, and it's why so many
apps have race conditions they can't explain.

### Steps

**A. `src/api/services/products.ts` — `TODO(lab-3.1)`**

```ts
import { api } from '../client';
import { endpoints } from '../endpoints';
import type { ApiCategory, Product, ProductListResponse } from '../../types';

const LIST_FIELDS = 'id,title,description,category,price,discountPercentage,rating,stock,brand,thumbnail';

/** Every read accepts a signal, so cancellation can be plumbed all the way through. */
interface RequestOptions {
  signal?: AbortSignal;
}

interface ListOptions extends RequestOptions {
  limit?: number;
  skip?: number;
}

/** @returns the envelope — a Promise<ProductListResponse>, never an AxiosResponse */
export async function listProducts({ limit = 0, skip = 0, signal }: ListOptions = {}): Promise<ProductListResponse> {
  const { data } = await api.get<ProductListResponse>(endpoints.products.list(), {
    params: { limit, skip, select: LIST_FIELDS },
    signal,
  });
  return data;
}

/** Full record — no `select`; a detail view wants every field. */
export async function getProduct(id: number | string, { signal }: RequestOptions = {}): Promise<Product> {
  const { data } = await api.get<Product>(endpoints.products.detail(id), { signal });
  return data;
}

export async function listCategories({ signal }: RequestOptions = {}): Promise<ApiCategory[]> {
  const { data } = await api.get<ApiCategory[]>(endpoints.products.categories(), { signal });
  return data;
}
```

`getProduct` and `listCategories` aren't used yet — Demo 7 uses both. The
JSDoc `@returns` is doing real work in a JavaScript project: it's what your
editor shows on hover.

**B. `src/App.tsx` — `TODO(lab-3.2)`**

```tsx
import { listProducts } from './api/services/products';
import { ApiError } from './lib/ApiError';
// …
const [error, setError] = useState<ApiError | null>(null);   // was `unknown` — the boundary gives us a real type
// …inside the effect:
const data = await listProducts({ signal: controller.signal });
setProducts(data.products);
// …and in the catch:
} catch (err) {
  if (axios.isCancel(err)) return;
  setError(ApiError.from(err));   // the interceptor made it an ApiError at RUNTIME; from() tells TypeScript so
}
```

Delete the `LIST_FIELDS` constant from `App.tsx` — it lives in the service
now. Keep `import axios from 'axios'` for one more lab; `axios.isCancel` still
needs it.

### Verify

Identical behaviour. In the Network tab the request is the same URL with the
same `select`. `App.tsx` no longer contains the string `dummyjson` or the word
`products` as a path. `grep -rn "dummyjson" src/` returns only `.env.*` and
nothing in `src/`.

### Watch out

**Returning `response` instead of `response.data`.** The stub did this. A
service that returns the envelope has just moved the `.data` problem, not
solved it.

**Forgetting `signal` in one function.** That one function can't be cancelled,
and its race condition is the one you'll spend a day on.

### Challenge (2 min)

Suppose DummyJSON renamed `thumbnail` to `imageUrl` tomorrow. List every file
you'd change. If the answer is more than one, the service layer isn't
translating enough.

### In the real world

Ask a senior engineer to review a React PR and the first thing they look at is
whether components import `axios`. The service layer is not a "nice to have";
it's the difference between a codebase where the backend can evolve and one
where every API change is a cross-cutting refactor.

---

## Lab 4 — One error, and the interceptors that make it (35 min)

### Problem

`toMessage()` in `lib/errors.ts` knows axios's error shape. `ErrorNotice`
imports it. Any other component that catches an error has to know
`err.response?.data?.message` too. axios's internals have leaked into the UI.

And there are cross-cutting things every request should do — carry a
correlation id, log its timing — that no call site should have to remember.

### Concept

**An interceptor runs on every request or response through an instance.**
It's the axios feature that justifies the dependency.

```ts
api.interceptors.request.use((config) => {
  // mutate and RETURN the config
  return config;
});

api.interceptors.response.use(
  (response) => response,               // any 2xx — MUST return it
  (error) => Promise.reject(error),      // any failure — MUST re-reject
);
```

**Three lines people forget, and what each forgetting does:**

| Forgot | Result |
|---|---|
| `return config` | Every request fails with a baffling error |
| `return response` | Every response is `undefined` at the call site |
| `return Promise.reject(error)` | **Failures silently resolve** — the worst bug, because everything looks fine |

**Normalise errors once, at the boundary.** A response interceptor that turns
every rejection into an `ApiError` means nothing above `api/` ever sees an
axios error. Components read `error.message`, `error.status`, `error.isRetryable`.
They don't import axios. They don't know what `err.response` is.

**Order is load-bearing.** Response interceptors run in registration order.
The logger wants the *raw* axios error (status, config, timing). The
normaliser *replaces* it with an `ApiError`. So: logger first, normaliser
**last**. Demo 11 adds a refresh handler between them that needs the raw
`error.config` to replay a request — if the normaliser ran first, it'd have
nothing to replay.

**Install explicitly, not by import side effect.** `installInterceptors()`
called once from `main.tsx` is ordered, greppable, and skippable in tests.
Registering interceptors at the bottom of `client.ts` runs in whatever order
the bundler evaluates modules — which makes ordering bugs non-reproducible.

### Steps

**A. `src/lib/ApiError.ts` — `TODO(lab-4.1)`**

Two TypeScript ideas carry this file. `readonly` fields on the class: an
`ApiError`, once made, is a fact — nobody edits its status. And
**`static from(error: unknown): ApiError`** — the signature *is* the design:
take the one type a `catch` gives you, return the one type the app wants.

```ts
import axios from 'axios';

const MESSAGES: Record<number, string> = {
  400: "Some of the details weren't valid.",
  401: 'Your session has expired. Please sign in again.',
  403: "You don't have permission to do that.",
  404: "We couldn't find what you were looking for.",
  409: 'That conflicts with something that already exists.',
  422: "Some of the details weren't valid.",
  429: 'Too many requests. Give it a moment and try again.',
};

/** What DummyJSON (and most APIs) put in an error body. Everything optional — never trust it blindly. */
interface ErrorBody {
  message?: unknown;
  errors?: Record<string, string>;
}

interface ApiErrorInit {
  message: string;
  status?: number;
  code?: string;
  data?: unknown;
  requestId?: string;
  cause?: unknown;
}

export class ApiError extends Error {
  readonly status: number;        // 0 = the request never got a response
  readonly code: string;          // NETWORK | TIMEOUT | CLIENT | HTTP_404 …
  readonly data: unknown;         // the raw error body, for field-level validation
  readonly requestId?: string;    // correlation id from the logging interceptor

  constructor({ message, status = 0, code = 'UNKNOWN', data = null, requestId, cause }: ApiErrorInit) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
    this.requestId = requestId;
    this.cause = cause;           // the original error, for the stack trace
  }

  get isRetryable(): boolean {
    return this.status === 0 || this.status === 408 || this.status === 429 || this.status >= 500;
  }
  get isNetwork(): boolean   { return this.code === 'NETWORK'; }
  get isTimeout(): boolean   { return this.code === 'TIMEOUT'; }
  get isAuth(): boolean      { return this.status === 401; }
  get isForbidden(): boolean { return this.status === 403; }
  get isNotFound(): boolean  { return this.status === 404; }

  /** Translate ANY thrown value into an ApiError: `unknown` in, ApiError out. */
  static from(error: unknown): ApiError {
    if (error instanceof ApiError) return error;

    if (!axios.isAxiosError<ErrorBody>(error)) {      // the generic types error.response.data
      // A bug in our own code — don't disguise it as an HTTP failure.
      const message = error instanceof Error ? error.message : 'Something went wrong.';
      return new ApiError({ message, code: 'CLIENT', cause: error });
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
      (typeof data?.message === 'string' && data.message) ||
      MESSAGES[status] ||
      (status >= 500 ? "Something broke on our end. We're looking into it." : 'Something went wrong.');

    return new ApiError({ message, status, code: `HTTP_${status}`, data, requestId, cause: error });
  }
}
```

This absorbs `lib/errors.ts` — **delete that file** once `ErrorNotice` stops
importing it (step E).

Design notes: `status: 0` is an unambiguous "no response" sentinel because no
real HTTP status is 0. The getters read better at the call site than
`error.status === 401`, and if the definition of "auth failure" ever grows,
one getter changes. `cause` keeps the original stack.

**B. `src/types/axios.d.ts` — teach axios about our fields**

The logging interceptor stashes a start time on the request config; Demo 11's
refresh interceptor stashes a `_retry` flag. axios's types don't know either.
A **module augmentation** adds them once — the alternative is a cast at every use:

```ts
import 'axios';

declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    /** Set by the logging interceptor, read on the way back to report timing. */
    metadata?: { startedAt: number };
    /** Set by the refresh interceptor (Demo 11) so a request is replayed at most once. */
    _retry?: boolean;
  }
}
```

**C. `src/api/interceptors/logging.ts` — `TODO(lab-4.2)`**

```ts
import axios, { type AxiosInstance } from 'axios';
import { logger } from '../../config/logger';

export function installLoggingInterceptor(instance: AxiosInstance) {
  instance.interceptors.request.use((config) => {
    config.headers.set('X-Request-Id', crypto.randomUUID());   // AxiosHeaders has .set/.get — typed, unlike bracket access
    config.metadata = { startedAt: performance.now() };        // our field — typed by the module augmentation below
    logger.debug(`→ ${config.method?.toUpperCase()} ${config.url}`, { params: config.params });
    return config;                                    // ← never forget
  });

  instance.interceptors.response.use(
    (response) => {
      const ms = Math.round(performance.now() - (response.config.metadata?.startedAt ?? 0));
      logger.debug(`← ${response.status} ${response.config.url} (${ms}ms)`);
      return response;                                // ← never forget
    },
    (error: unknown) => {
      if (axios.isAxiosError(error)) {
        const ms = Math.round(performance.now() - (error.config?.metadata?.startedAt ?? 0));
        logger.warn(`✗ ${error.config?.method?.toUpperCase()} ${error.config?.url} ${error.response?.status ?? error.code} (${ms}ms)`);
      }
      return Promise.reject(error);                   // ← never forget
    },
  );
}
```

`config.metadata` is a custom field — axios passes the config object through
untouched, so it's a legitimate place to stash per-request state. `crypto.randomUUID()`
is built into every current browser on HTTPS and `localhost`.

**D. `src/api/interceptors/errorNormalizer.ts` — `TODO(lab-4.3)`**

```ts
import axios, { type AxiosInstance } from 'axios';
import { ApiError } from '../../lib/ApiError';
import { logger } from '../../config/logger';

export function installErrorNormalizer(instance: AxiosInstance) {
  instance.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      if (axios.isCancel(error)) return Promise.reject(error);   // expected; pass through untouched

      const apiError = ApiError.from(error);

      if (apiError.status >= 500 || apiError.isNetwork) {
        logger.error(`[api] ${apiError.code}: ${apiError.message}`, { requestId: apiError.requestId });
      }

      return Promise.reject(apiError);
    },
  );
}
```

Cancellations pass through *as axios errors* so `axios.isCancel(err)` in the
effect still recognises them.

**E. `src/api/interceptors/index.ts` — `TODO(lab-4.4)`**

```ts
import { api } from '../client';
import { installLoggingInterceptor } from './logging';
import { installErrorNormalizer } from './errorNormalizer';

export function installInterceptors() {
  installLoggingInterceptor(api);   // 1. sees the raw error
  installErrorNormalizer(api);      // 2. LAST — converts to ApiError
}
```

And in **`src/main.tsx`** (same marker), before `createRoot`:

```tsx
import { installInterceptors } from './api/interceptors';

installInterceptors();
```

**F. `src/components/ErrorNotice.tsx` — `TODO(lab-4.5)`**

It no longer needs to know anything about axios — and its prop is no longer
`unknown`. The boundary hands it a real type:

```tsx
import { Alert, Button } from 'react-bootstrap';
import { ArrowClockwise, ExclamationTriangleFill } from 'react-bootstrap-icons';
import { env } from '../config/env';
import type { ApiError } from '../lib/ApiError';

interface ErrorNoticeProps {
  /** Already normalised: `ApiError.from(err)` in the catch turns `unknown` into this. */
  error: ApiError | null | undefined;
  onRetry?: () => void;
  title?: string;
}

export function ErrorNotice({ error, onRetry, title }: ErrorNoticeProps) {
  if (!error) return null;

  const canRetry = onRetry && error.isRetryable;

  return (
    <Alert variant="danger" className="d-flex align-items-start gap-2">
      <ExclamationTriangleFill className="mt-1 flex-shrink-0" />
      <div className="flex-grow-1">
        {title && <Alert.Heading className="h6">{title}</Alert.Heading>}
        <div>{error.message}</div>
        {env.isDev && (
          <div className="small text-muted font-monospace mt-1">
            {error.code}
            {error.status ? ` · ${error.status}` : ''}
            {error.requestId ? ` · ${error.requestId}` : ''}
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
  );
}
```

Now **delete `src/lib/errors.ts`**. Note `canRetry`: a 404 isn't retryable,
so the button disappears for it — `ApiError` told the component, and the
component didn't have to know why.

**And in `App.tsx`**, the state changes type to match: `useState<ApiError | null>(null)`,
with `setError(ApiError.from(err))` in the catch (step 3.2 above). The
interceptor already produces an `ApiError` at runtime; `from()` is
idempotent, and it's how the *compiler* learns what the interceptor did.

### Verify

Reload with the console open. `→ GET /products {params: …}` then
`← 200 /products (312ms)` — the logging interceptor, at `debug` level because
`.env.development` says so. Open the request in the Network tab: a
`X-Request-Id: 3f2a…` header went out.

Now break the endpoint: in `endpoints.ts`, change `list` to `'/productz'`.
The alert reads *"We couldn't find what you were looking for."* and the dev
line reads `HTTP_404 · 404 · 3f2a…` — that id matches the `✗ GET /productz 404`
line in the console. **No Retry button** — a 404 isn't retryable. Fix the path.

Then set `VITE_API_BASE_URL=https://localhost:9` and restart. *"Can't reach
the server…"*, `NETWORK`, and Retry is back. Fix it.

Finally: `npm run build && npm run preview`. Open the preview. **No `[debug]`
lines in the console** — `.env.production` set `VITE_LOG_LEVEL=error`. Same
code, quieter.

### Watch out

**Normaliser before logger.** Swap the two lines in `index.ts` and the logger
receives an `ApiError` — `error.config` is `undefined`, the timing line shows
`NaNms`. Order matters; this is the gentle version of the bug. Demo 11's is not
gentle.

**Forgetting `return Promise.reject(error)`.** Comment it out in the
normaliser and break the URL again. **No error appears.** `listProducts`
resolves with `undefined`, `data.products` throws a *different* error in the
effect. Silent-success is the worst interceptor bug precisely because it's
quiet.

**A global `response => response.data` unwrap.** Tempting. It loses `status`
and `headers`, breaks every later interceptor's assumptions, and confuses
anyone who's used axios before. Unwrap in the service layer, where you did.

### Challenge (2 min)

`X-Request-Id` is a custom header. On an API with strict CORS it triggers a
preflight and must be in `Access-Control-Allow-Headers`. DummyJSON allows it.
Where would you *disable* the header for a stricter backend — an env flag, a
per-instance option, or by not installing the interceptor? Pick one and say
why in a sentence.

### In the real world

That correlation id is the cheapest observability win a frontend can make. A
user screenshots an error that says `HTTP_500 · 500 · 3f2a9c…`; you paste the
id into your backend logs; you're looking at the exact request in ten seconds
instead of asking "roughly what time was that?"

---

## Wrap-up — what you can now do

- [x] Explain which `.env` file loads when, and why `VITE_` exists
- [x] Read configuration once, validate it, coerce it, freeze it
- [x] Gate logging on an env-driven level
- [x] Create axios instances instead of configuring the global
- [x] Keep every URL in one file, as encoding functions
- [x] Write a service layer that returns domain data and forwards `signal`
- [x] Normalise every failure into one `ApiError` at the boundary
- [x] Write request and response interceptors, and never forget their return lines
- [x] Install interceptors explicitly, in an order you can defend

**What's still true:** `App.tsx` still owns a 30-line effect, and every
component that fetches will copy it. Search is still client-side over all 194
products. Both are Demo 7's and 7's problems.

## Next demo

**Demo 7 — Search, Filters & Pagination against the API.** Query params done
properly, debouncing, server-side search and category filtering, two requests
in parallel, a detail drawer, and pagination. The 194-product download goes
away.

---

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| Red overlay: *Missing required env var* | Working as designed. Add it to the `.env.[mode]` file it names, restart. |
| Env change has no effect | Restart the dev server — `.env` files are read at startup. |
| Every request fails, weird message | An interceptor didn't `return config`. |
| `Cannot read properties of undefined (reading 'products')` | Response handler didn't `return response`, or the normaliser didn't re-reject. |
| Timing shows `NaNms` | Normaliser registered before logger. Swap them. |
| `[debug]` logs in the production build | Check `VITE_LOG_LEVEL` in `.env.production`. |
| `ErrorNotice` shows nothing on a real error | Is `installInterceptors()` called in `main.tsx`? Without the normaliser, `error.message` is axios's raw string, but `isRetryable` is undefined — check `canRetry`. |
