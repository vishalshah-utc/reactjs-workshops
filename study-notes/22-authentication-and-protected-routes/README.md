# Module 22 — Authentication & Protected Routes

**Study notes** · ~3.5 hours

> **Goal.** Give ShopScope a user. What a session *is* for a single-page app
> and where it can live; logging in; getting a token onto every request
> without touching a component; surviving token expiry invisibly with a
> **single-flight refresh queue**; keeping the session across a reload;
> locking a route subtree with **React Router 8 middleware**; and roles — in
> the route, in the action and in the UI, with a clear statement of which is a
> lock and which is a courtesy. The thread through all of it: **nothing the
> browser does is security.** The server decides; the client's job is to make
> the right experience out of that decision.

**Prerequisites:** [Module 9 §10](../09-reducers-and-context/#10-using-context)
(Context — and why `createContext` means two things in this module),
[Module 12 §4](../12-effects/#4-cleanup) and
[§14](../12-effects/#14-usesyncexternalstore) (subscribing to things outside
React), [Module 13 §13](../13-data-fetching-and-custom-hooks/#13-the-api-layer)
(one module owns HTTP). Module 14 — Routing and Module 21 — The API Layer cover
the router and the axios instance this module builds on.

---

## Contents

1. [Authentication vs authorisation](#1-authentication-vs-authorisation)
2. [Session models for a SPA](#2-session-models-for-a-spa)
3. [What a JWT is — and is not](#3-what-a-jwt-is--and-is-not)
4. [Where auth state lives](#4-where-auth-state-lives)
5. [The login flow](#5-the-login-flow)
6. [Attaching the token: the request interceptor](#6-attaching-the-token-the-request-interceptor)
7. [Handling 401: the naive handler and its three bugs](#7-handling-401-the-naive-handler-and-its-three-bugs)
8. [The single-flight refresh queue](#8-the-single-flight-refresh-queue)
9. [Interceptor order is load-bearing](#9-interceptor-order-is-load-bearing)
10. [Restoring a session on reload](#10-restoring-a-session-on-reload)
11. [Protected routes with middleware](#11-protected-routes-with-middleware)
12. [Returning to the intended URL](#12-returning-to-the-intended-url)
13. [Role-based access](#13-role-based-access)
14. [Auth in loaders and actions](#14-auth-in-loaders-and-actions)
15. [Logout everywhere](#15-logout-everywhere)
16. [Testing the queue and the guards](#16-testing-the-queue-and-the-guards)
17. [Common mistakes](#17-common-mistakes)
18. [Self-check](#18-self-check)
19. [References](#19-references)

**Hands-on:** this module explains the code you write in
[Demo 11 — Authentication & Protected Routes](../../demos/11-auth-and-protected-routes/)
— a JWT login against DummyJSON, the refresh queue, middleware guards and
roles. Its tests are written in Demo 20 — Testing, Labs 4 and 5. Versions in
the starter: React 19.3, react-router 8.3, axios 1.20.

---

## 1. Authentication vs authorisation

Two words that look alike and answer different questions:

| | Question | Typical answer | Status when it fails |
|---|---|---|---|
| **Authentication** (authn) | *Who are you?* | a session, a token, a signed-in user | `401 Unauthorized` |
| **Authorisation** (authz) | *What may you do?* | roles, permissions, ownership | `403 Forbidden` |

The status codes drive the client's behaviour. A **401** means "I do not know
who you are" — re-establish identity: refresh the token, or send the user to
sign in. A **403** means "I know exactly who you are, and no" — refreshing
will not help; show a clear *not allowed* page.

In ShopScope: signing in as `emilys` is authentication. `emilys` being an
`admin` who may edit the catalogue, while `averyp` (a `user`) may not, is
authorisation.

📖 [MDN — 401 Unauthorized](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/401) ·
[403 Forbidden](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/403)

---

## 2. Session models for a SPA

HTTP is stateless; a session is whatever lets request *n+1* be recognised as
coming from the same person as request *n*. Two families.

### 2.1 Cookie sessions

The server sets a cookie after login; the browser sends it back automatically
on every request to that origin.

```http
Set-Cookie: session=abc123; HttpOnly; Secure; SameSite=Lax; Path=/
```

`HttpOnly` — JavaScript cannot read it, so an XSS payload cannot steal it.
`Secure` — HTTPS only. `SameSite` — whether the browser attaches it to
cross-site requests, which is most of your CSRF defence.

The cost: because the browser attaches it *automatically*, a malicious page
can make your browser send an authenticated request without your code being
involved. That is **CSRF**, and cookie auth needs a defence: `SameSite`, plus
a CSRF token or custom-header check on anything that mutates. Cookie sessions
also need a backend you control — the one that sets the cookie.

### 2.2 JWT access + refresh tokens

The server returns tokens in the response body; *your code* stores them and
attaches one to each request:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJlbWlseXMifQ.…
```

| | Access token | Refresh token |
|---|---|---|
| Lifetime | minutes | days or weeks |
| Sent with | **every** API request | only the refresh call |
| If stolen | limited blast radius | full takeover until revoked |

The asymmetry is the design: the credential that travels constantly is the
one that dies fastest. When the access token expires the client trades the
refresh token for a new pair ([§8](#8-the-single-flight-refresh-queue)).

Because nothing is attached automatically, a bearer-token app has **no CSRF
problem** — a foreign page cannot make your axios instance add a header. It
has the opposite problem instead.

### 2.3 Where a token can live

| Location | Survives reload | Readable by XSS | Notes |
|---|---|---|---|
| Memory (a module variable) | no | no | safest; re-auth on every reload |
| `sessionStorage` | per tab | **yes** | |
| `localStorage` | yes | **yes** | the most common and the most criticised |
| `httpOnly` cookie | yes | **no** | best — but your server must set it, and you need CSRF defence |

**The honest summary.** An `httpOnly` cookie set by your backend is the right
answer for a real product. `localStorage` is what most tutorials and a great
many production apps use, and it means any XSS in your app — or in any of your
transitive dependencies — can read the token and send it elsewhere. ShopScope
uses `localStorage` because DummyJSON is token-based and there is no backend
to set a cookie. The trade-off is stated, not hidden, and the token store in
[§4](#4-where-auth-state-lives) is an interface so that moving to cookies
touches one file.

So the choice is really *which attack you defend against*: cookies → CSRF
(`SameSite`, CSRF token); bearer tokens in storage → XSS (CSP, sanitised
HTML, dependency hygiene). Module 20 — Production covers the XSS side.

📖 [MDN — Using HTTP cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies) ·
[`Set-Cookie`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie)
📖 [OWASP — CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html) ·
[XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)

---

## 3. What a JWT is — and is not

A JSON Web Token is three base64url strings joined by dots:
`header.payload.signature`.

```ts
// decoding the payload is trivial — and that is the point to notice
const [, payload] = token.split('.');
JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
// → { id: 1, username: 'emilys', iat: 1718000000, exp: 1718000060 }
```

Two facts follow. **A JWT is signed, not encrypted** — anyone holding it can
read the payload, so never put a secret in one. **Only the holder of the
signing key can verify it** — and the browser does not have the key, and must
not. The client can *read* `exp` or `role` but cannot know whether the token
is genuine, revoked or tampered with. On the client a decoded JWT is a
**hint**, never a source of truth: use it, at most, to skip a request you
know will fail; never to decide what the user may do.

Which is why ShopScope does not decode tokens at all. The profile — including
`role` — comes from `GET /auth/me`, an endpoint that *does* verify the
signature, and the token is treated as an opaque string.

> **DummyJSON specifics.** `POST /auth/login` takes `{ username, password,
> expiresInMins }` and returns `accessToken`, `refreshToken` and a *subset* of
> the user — no `role`. `GET /auth/me` returns the full profile.
> `POST /auth/refresh` takes `{ refreshToken, expiresInMins }` and returns a
> new pair; **both tokens rotate**, so the old refresh token is dead after use.
> That rotation is what makes [§8](#8-the-single-flight-refresh-queue)
> necessary.

📖 [RFC 7519 — JSON Web Token](https://datatracker.ietf.org/doc/html/rfc7519) ·
[RFC 6750 — Bearer Token Usage](https://datatracker.ietf.org/doc/html/rfc6750) ·
[DummyJSON — Auth](https://dummyjson.com/docs/auth)

---

## 4. Where auth state lives

Three candidates:

| Home | Reachable from | Survives reload | Cost |
|---|---|---|---|
| React Context (`<AuthProvider>`) | components only | no — needs restoring | an interceptor cannot call `setState` |
| A store (Zustand, a plain module) | anywhere — `getState()` works outside React | with persistence | another subscription mechanism |
| The router (root loader data) | any route via `useRouteLoaderData` | yes — loaders run on load | only re-reads when the router revalidates |

The decisive constraint: **the API layer needs the token, and the API layer is
not React.** An axios interceptor cannot read a Context. So the tokens go in a
plain module — the **token store** — and React reads *from* it rather than
owning it.

```ts
// src/lib/tokenStore.ts
const KEYS = {
  access: 'shopscope.accessToken',
  refresh: 'shopscope.refreshToken',
  user: 'shopscope.user',
} as const;

export const AUTH_CHANGED = 'shopscope:auth-changed';
const emit = () => window.dispatchEvent(new Event(AUTH_CHANGED));

/** The interface first: swap localStorage for cookies and nothing else changes. */
export interface TokenStore {
  getAccess(): string | null;
  getRefresh(): string | null;
  getUser(): User | null;
  isAuthenticated(): boolean;
  set(values: { accessToken?: string; refreshToken?: string; user?: User }): void;
  clear(): void;
}

export const tokenStore: TokenStore = {
  getAccess: () => localStorage.getItem(KEYS.access),
  getRefresh: () => localStorage.getItem(KEYS.refresh),
  getUser() {
    try {
      return JSON.parse(localStorage.getItem(KEYS.user) ?? 'null') as User | null;
    } catch {
      return null;                     // a corrupted entry means "signed out", not "crash"
    }
  },
  isAuthenticated: () => Boolean(localStorage.getItem(KEYS.access)),
  set({ accessToken, refreshToken, user }) {
    if (accessToken) localStorage.setItem(KEYS.access, accessToken);
    if (refreshToken) localStorage.setItem(KEYS.refresh, refreshToken);
    if (user) localStorage.setItem(KEYS.user, JSON.stringify(user));
    emit();
  },
  clear() {
    Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
    emit();
  },
};
```

**The interface is the contract.** `TokenStore` says nothing about
`localStorage`; a cookie-backed implementation changes no caller.
**`AUTH_CHANGED` is how non-React code talks to React.** When the refresh
interceptor signs the user out it cannot `navigate()` or set state; a DOM
event says "something changed" without importing the router — the layers
stay separate.

### React reads it through the router

The header needs the user. A **root loader** reads the store, and because the
router re-runs loaders after every action, login and logout update the header
with no extra wiring:

```tsx
// src/routes/RootLayout.tsx
export function rootLoader() {
  return { user: tokenStore.getUser() };     // { user: User | null }
}

export function RootLayout() {
  const { user } = useLoaderData<typeof rootLoader>();
  const revalidator = useRevalidator();

  // The interceptor clears tokens on a failed refresh. The router cannot see that — subscribe.
  useEffect(() => {
    const onAuthChanged = () => revalidator.revalidate();
    window.addEventListener(AUTH_CHANGED, onAuthChanged);
    return () => window.removeEventListener(AUTH_CHANGED, onAuthChanged);
  }, [revalidator]);
  …
}
```

With `id: 'root'` on the route, *any* page reads the same data with
`useRouteLoaderData<typeof rootLoader>('root')` — the UI half of
[§13](#13-role-based-access) depends on it. The effect passes
[Module 12 §12](../12-effects/#12-effects-that-are-genuinely-correct)'s test:
it subscribes to something outside React and unsubscribes in cleanup.

**→ In the demos:** Demo 11, Lab 1 (`tokenStore`) and Lab 3.2 (`rootLoader` +
`useRevalidator`).

📖 [React Router — `useRevalidator`](https://reactrouter.com/api/hooks/useRevalidator) ·
[`useRouteLoaderData`](https://reactrouter.com/api/hooks/useRouteLoaderData)

---

## 5. The login flow

Login is a **route with a loader and an action**, not a component with a
`useState` form and a `fetch` in a handler. The loader bounces users who are
already signed in; the action does the work; a wrong password is an *expected*
outcome the action returns rather than throws.

### The service

```ts
// src/api/services/auth.ts
const TOKEN_LIFETIME_MINS = 1;        // deliberately short, so the refresh flow is easy to watch

export async function getMe({ signal }: { signal?: AbortSignal } = {}): Promise<User> {
  const { data } = await api.get<User>(endpoints.auth.me(), { signal });
  return data;
}

export async function login({ username, password }: { username: string; password: string }): Promise<User> {
  const { data } = await api.post<LoginResponse>(endpoints.auth.login(), {
    username, password, expiresInMins: TOKEN_LIFETIME_MINS,
  });
  tokenStore.set({ accessToken: data.accessToken, refreshToken: data.refreshToken });

  const user = await getMe();          // LoginResponse has no `role` — fetch the full profile
  tokenStore.set({ user });
  return user;
}

export function logout() {
  tokenStore.clear();
}
```

Order inside `login` matters: **store the tokens, then call `getMe`** — the
second request needs the first's token, and the interceptor in
[§6](#6-attaching-the-token-the-request-interceptor) reads the store at
request time.

### The route

```tsx
// src/routes/LoginPage.tsx
export async function loginLoader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  if (tokenStore.isAuthenticated()) throw redirect(safeRedirect(url.searchParams.get('redirectTo')));
  return { expired: url.searchParams.get('expired') === '1' };
}

interface LoginActionData {
  error: string;
  username: string;
}

export async function loginAction({ request }: ActionFunctionArgs): Promise<LoginActionData | Response> {
  const formData = await request.formData();
  const username = String(formData.get('username') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const redirectTo = safeRedirect(formData.get('redirectTo'));

  if (!username || !password) return { error: 'Enter both a username and a password.', username };

  try {
    await login({ username, password });
  } catch (error) {
    return { error: ApiError.from(error).message, username };   // expected → RETURN
  }

  return redirect(redirectTo);                                  // success → leave
}
```

The component has no `useState` at all — `useNavigation` gives the pending
state, `useActionData` the result:

```tsx
const actionData = useActionData<LoginActionData>();
const submitting = useNavigation().state === 'submitting';
const redirectTo = useSearchParams()[0].get('redirectTo') ?? '';

<RouterForm method="post" replace>
  <input type="hidden" name="redirectTo" value={redirectTo} />
  <Form.Control name="username" autoComplete="username" defaultValue={actionData?.username ?? ''} isInvalid={!!actionData?.error} required />
  <Form.Control type="password" name="password" autoComplete="current-password" isInvalid={!!actionData?.error} required />
  <Form.Control.Feedback type="invalid">{actionData?.error}</Form.Control.Feedback>
  <Button type="submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</Button>
</RouterForm>
```

- **Return, don't throw, on bad credentials.** A thrown error goes to the
  error boundary and the form disappears. A returned value re-renders the form
  with the message under the field and `username` filled back in.
- **`replace`** so Back after a successful login does not land on the login
  page and bounce again.
- **`autoComplete="username"` / `"current-password"`** so password managers
  work — an accessibility and a security feature.

The `redirectTo` round trip — captured by the guard, carried through the POST
as a hidden input, validated by `safeRedirect` — is
[§12](#12-returning-to-the-intended-url).

**→ In the demos:** Demo 11, Lab 1.2 (`login`, `getMe`) and Lab 3.1 (the login
route).

📖 [React Router — `redirect`](https://reactrouter.com/api/utils/redirect) ·
[`<Form>`](https://reactrouter.com/api/components/Form) ·
[`useActionData`](https://reactrouter.com/api/hooks/useActionData)

---

## 6. Attaching the token: the request interceptor

Every request to a protected endpoint needs `Authorization: Bearer <token>`.
Two ways to do it; one is correct:

```ts
// ✗ a default header — must be updated on login, logout and every refresh,
//   and a request configured before the update keeps the old value
api.defaults.headers.common.Authorization = `Bearer ${token}`;

// ✓ a request interceptor — reads the store AT REQUEST TIME; no stale state to get wrong
const PUBLIC_PATHS = ['/auth/login', '/auth/refresh'];   // never carry a token

export function installAuthInterceptor(instance: AxiosInstance) {
  instance.interceptors.request.use((config) => {
    const isPublic = PUBLIC_PATHS.some((path) => config.url?.startsWith(path));
    const token = tokenStore.getAccess();
    if (token && !isPublic) config.headers.set('Authorization', `Bearer ${token}`);
    return config;                                 // forget this and every request fails
  });
}
```

The interceptor runs for each request, so whatever the store holds *now* is
what goes out. Login, logout and refresh all just write to the store.

**`PUBLIC_PATHS` is not tidiness.** Sending a stale, expired access token to
`/auth/refresh` makes some backends reject the refresh outright — you would be
unable to refresh precisely when you need to. `config.headers.set(...)` is
axios 1.x's typed `AxiosHeaders` API, which is why it replaces bracket
assignment.

**→ In the demos:** Demo 11, Lab 2.1.

📖 [axios — Interceptors](https://axios-http.com/docs/interceptors) ·
[MDN — `Authorization`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Authorization)

---

## 7. Handling 401: the naive handler and its three bugs

The access token lives for minutes. When it expires the API answers `401`,
and the user must **not** be dumped on a login screen mid-task. The app should
quietly get a new token and retry. First attempt:

```ts
// ✗ three bugs
api.interceptors.response.use(null, async (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.status === 401 && error.config) {
    const token = await refreshTokens();
    error.config.headers.set('Authorization', `Bearer ${token}`);
    return api(error.config);
  }
  return Promise.reject(error);
});
```

1. **Infinite loop.** If the replayed request *also* 401s — a revoked token,
   a server that rejects the user — the handler fires again, refreshes again,
   replays again. Forever.
2. **Refresh stampede.** Six requests in flight when the token expires means
   six 401s and six `refreshTokens()` calls. DummyJSON — like most backends —
   rotates the refresh token on use, so the first call wins and the other five
   fail with a dead refresh token. The user is signed out *because* the app
   was busy.
3. **The refresh call can itself 401** — and it goes through `api`, so it
   re-enters the very handler that called it.

| Bug | Fix |
|---|---|
| infinite loop | a `_retry` flag on the request config — replay **once** per request |
| stampede | one module-level `refreshPromise` that every concurrent 401 awaits |
| re-entrancy | the refresh call goes through `bareApi` (no interceptors), and `/auth/*` URLs are never refreshed |

---

## 8. The single-flight refresh queue

```ts
// src/api/interceptors/refresh.ts
let refreshPromise: Promise<string> | null = null;   // module-scoped: the ONE in-flight refresh

export function installRefreshInterceptor(instance: AxiosInstance) {
  instance.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      if (!axios.isAxiosError(error)) return Promise.reject(error);   // only an AxiosError has a config
      const original = error.config;

      const shouldTryRefresh =
        error.response?.status === 401 &&
        original !== undefined &&
        !original._retry &&                       // (1) once per request
        !original.url?.startsWith('/auth/');      // (3) never for the auth endpoints

      if (!shouldTryRefresh) return Promise.reject(error);

      original._retry = true;

      try {
        refreshPromise ??= refreshTokens().finally(() => {   // (2) everyone awaits the SAME promise
          refreshPromise = null;
        });

        const accessToken = await refreshPromise;
        original.headers.set('Authorization', `Bearer ${accessToken}`);
        return api(original);                     // replay the ORIGINAL request
      } catch {
        tokenStore.clear();                       // give up: sign out (fires AUTH_CHANGED)
        return Promise.reject(error);             // …and reject with the ORIGINAL 401
      }
    },
  );
}
```

### Why `??=` is the whole trick

`refreshPromise ??= refreshTokens()` assigns only when the slot is `null`. The
first 401 to arrive starts the refresh and stores the promise. The second,
third and sixth find it already set, skip the call, and `await` the *same*
promise. One network request; six waiters. When it settles, `finally` empties
the slot so the *next* expiry can start a fresh refresh.

```
t=0   GET /products   → 401 ─┐
      GET /auth/me    → 401 ─┼─ refreshPromise ??= refresh()   → ONE POST /auth/refresh
      GET /carts/…    → 401 ─┘
t=1   refresh resolves → all three set the new header and replay
```

This works because the slot is **module-level**: shared by every call through
this interceptor for the lifetime of the page. It is also the limit of the
technique — two axios instances, or two browser tabs, do not share it
([§15](#15-logout-everywhere)).

### The other decisions

**`_retry` is on the config.** axios's `InternalAxiosRequestConfig` has no such
field; a module augmentation in `src/types/axios.d.ts` declares `_retry?:
boolean` so there is no cast at the use site.

**`refreshTokens` uses `bareApi`** — a second instance with the same base
config and **no interceptors**, so a failing refresh cannot re-enter this
handler:

```ts
export async function refreshTokens(): Promise<string> {
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) throw new Error('No refresh token available');

  const { data } = await bareApi.post<AuthTokens>(endpoints.auth.refresh(), {
    refreshToken, expiresInMins: TOKEN_LIFETIME_MINS,
  });
  tokenStore.set({ accessToken: data.accessToken, refreshToken: data.refreshToken });   // both rotate
  return data.accessToken;
}
```

**Giving up rejects with the original error.** The caller asked for
`/products`. "The refresh endpoint returned 400" describes plumbing it never
knew about; the original 401 is the honest answer to the question it asked.
`tokenStore.clear()` fires `AUTH_CHANGED`, the root loader revalidates, and
the header flips to *Sign in* — no reload, and no router import in the API
layer.

**The caller sees nothing.** `await getMe()` on an expired token produces
three requests in the Network tab — `/auth/me` 401, `/auth/refresh` 200,
`/auth/me` 200 — and one resolved promise. That invisibility is the point of
an interceptor rather than a retry in every service function.

**→ In the demos:** Demo 11, Lab 2.2 — including the stampede experiment:
`Promise.all([getMe(), getMe(), getMe()])` after expiry, with and without the
`??=` line.

📖 [axios — Handling errors](https://axios-http.com/docs/handling_errors) ·
[Creating an instance](https://axios-http.com/docs/instance)

---

## 9. Interceptor order is load-bearing

Response interceptors run in registration order. The refresh handler needs the
**raw `AxiosError`** — `error.config` to replay, `error.response.status` to
decide. The error normaliser from Module 21 *replaces* the error with an
`ApiError`. So the refresh handler must be registered first:

```ts
// src/api/interceptors/index.ts — called once from main.tsx, before render
export function installInterceptors() {
  installAuthInterceptor(api);       // request side: attach the token
  installLoggingInterceptor(api);    // sees the raw error: status, timing
  installRefreshInterceptor(api);    // BEFORE the normaliser — needs error.config
  installErrorNormalizer(api);       // LAST: everything leaving the layer is an ApiError
}
```

Swap the last two and every 401 becomes an `ApiError` before the refresh
handler sees it: `axios.isAxiosError(error)` is false, `shouldTryRefresh` is
false, and every expiry signs the user out. When refresh "doesn't work", check
this file first. An explicit call, not import side effects: import order is
whatever the bundler decides, and a bug that depends on it does not reproduce.

**→ In the demos:** Demo 11, Lab 2.3.

---

## 10. Restoring a session on reload

A reload throws away every React state and every module variable. What
survives is `localStorage`. Restoring the session means reading it back —
*before* the first paint decides what to show.

### The flash of logged-out UI

The classic Context-based version:

```tsx
// ✗ renders "Sign in" for one frame, then flips to the avatar
const [user, setUser] = useState<User | null>(null);
useEffect(() => { setUser(tokenStore.getUser()); }, []);
```

The first render has `user === null`, the effect runs after paint, the second
render has the user. Everyone sees the header change. Three fixes, in order of
preference:

```tsx
// ✓ 1. read synchronously in a lazy initialiser — no effect, no flash
const [user, setUser] = useState<User | null>(() => tokenStore.getUser());

// ✓ 2. a data router: the root loader runs before the first render;
//      HydrateFallback is what shows while it does
{ path: '/', id: 'root', loader: rootLoader, HydrateFallback: AppBootSplash, … }

// ✓ 3. an explicit 'restoring' status when restoring is genuinely async
//      (a cookie session that must ask the server) — render a splash, not the logged-out header
```

ShopScope uses the second: `rootLoader` reads `tokenStore.getUser()`
synchronously, so the very first render already knows who is signed in.

### A cached user is a claim, not proof

The stored profile says who *was* signed in. The token may have expired since.
Two things make that safe: the first protected request refreshes or signs out
([§8](#8-the-single-flight-refresh-queue)) — stale optimism costs one 401;
and the middleware in [§11](#11-protected-routes-with-middleware) re-fetches
`/auth/me` when there is a token but no cached profile, and if that fails
*and* the refresh fails, clears the store and redirects to `/login?expired=1`.

**Never** restore a session by decoding `exp` from the token and trusting it
([§3](#3-what-a-jwt-is--and-is-not)). Clock skew, revocation and tampering are
all invisible to the client; the server's 401 is the only verdict.

### Do it once

"Initialise auth on startup" is the
[Module 12 §9.7](../12-effects/#97-initialising-the-app-once) case: not an
effect in a component (twice in Strict Mode, once per mount) but module scope
— `installInterceptors()` in `main.tsx` before `createRoot`, and the loader
for the read.

📖 [React Router — `HydrateFallback`](https://reactrouter.com/start/data/route-object#hydratefallback) ·
[MDN — `Window.localStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

---

## 11. Protected routes with middleware

`/account` and everything beneath it should require a signed-in user. Three
places to enforce that, and they are not equivalent:

| | Where the check runs | Loaders already ran? | Flashes? | Forgettable? |
|---|---|---|---|---|
| **A. Guard component** `<RequireAuth>` + `<Navigate>` | during render | **yes** — authenticated requests you knew would 401 | yes — React must render before it can redirect | per wrapper |
| **B. Loader guard** `throw redirect()` at the top of each loader | before render | no, for that route | no | **per loader** — the one you forget is the hole |
| **C. Middleware** on the layout route | before *all* loaders and actions below | no | no | **no** — a route is protected by where it lives |

Middleware is the React Router 8 answer (behind a flag in v7). It runs parent
→ child before any loader or action in the subtree; put it on a layout and
every child — including the one added next year — is covered.

### The signature

From react-router 8.3's types:

```ts
type MiddlewareFunction<Result = unknown> = (
  args: DataFunctionArgs<Readonly<RouterContextProvider>>,   // { request, params, context }
  next: MiddlewareNextFunction<Result>,                      // () => Promise<Result>
) => MaybePromise<Result | void>;
```

Same first argument as a loader or action; a `next` that runs everything
downstream. Throw a `redirect()` or `data()` to stop the navigation; omit
`next()` entirely for a simple guard, or `await next()` and do work after the
loaders (timing, logging).

### Sharing what the guard learned: `createContext`

A guard that fetches the user should hand it to the loaders beneath, so there
is one `/auth/me` per navigation rather than one per page. That is what the
middleware `context` is for, keyed by a typed handle:

```ts
import { createContext, data, redirect, type MiddlewareFunction } from 'react-router';

/** React Router's createContext — a typed KEY for the middleware context, not a provider. */
export const userContext = createContext<User | null>(null);
```

> **Two `createContext`s.** This one is from `react-router`; the one in
> [Module 9](../09-reducers-and-context/#10-using-context) is from `react`.
> Same name, different import, different mechanism. Import the wrong one and
> `context.set` throws.

`createContext<T>(defaultValue?: T)` returns a `RouterContext<T>`;
`context.set(key, value)` demands a `T` and `context.get(key)` returns a `T` —
typed on both ends, no casts.

### The guard

```ts
export const authMiddleware: MiddlewareFunction = async ({ request, context }) => {
  if (!tokenStore.isAuthenticated()) {
    const url = new URL(request.url);
    throw redirect(`/login?redirectTo=${encodeURIComponent(url.pathname + url.search)}`);
  }

  let user = tokenStore.getUser();
  if (!user) {
    try {
      user = await getMe({ signal: request.signal });   // token but no cached profile — ask once
      tokenStore.set({ user });
    } catch {
      tokenStore.clear();                               // the token is dead AND the refresh failed
      throw redirect('/login?expired=1');
    }
  }

  context.set(userContext, user);
};
```

If the token has expired, the interceptor in
[§8](#8-the-single-flight-refresh-queue) refreshes it invisibly inside
`getMe`. The `catch` only runs when *that* has already failed — the session is
genuinely over.

### Wiring it

```tsx
{
  path: 'account',
  Component: AccountLayout,
  loader: accountLoader,
  middleware: [authMiddleware],        // protects EVERYTHING below
  children: [
    { index: true, Component: ProfilePage, loader: profileLoader },
    { path: 'carts', Component: CartsPage, loader: cartsLoader },
    { path: 'team', Component: TeamPage, loader: teamLoader, middleware: [requireRole('admin')] },
  ],
}
```

For `/account/team` the chain is `authMiddleware` → `requireRole('admin')` →
`teamLoader`. Each can stop the navigation by throwing.

One subtlety: **middleware runs only when something beneath it has a loader or
an action.** A `Component`-only child route does not trigger it. Give
protected routes a loader — even `() => ({})` — or the guard never runs.

**→ In the demos:** Demo 11, Lab 4 (all three approaches compared, then
middleware built).

📖 [React Router — Middleware](https://reactrouter.com/how-to/middleware) ·
[`createContext`](https://reactrouter.com/api/utils/createContext) ·
[`RouterContextProvider`](https://reactrouter.com/api/utils/RouterContextProvider)

---

## 12. Returning to the intended URL

Bouncing a user to the home page after they sign in is a small cruelty that
is easy to avoid. The round trip:

```
1. guard      /account/carts  →  throw redirect('/login?redirectTo=%2Faccount%2Fcarts')
2. login page reads ?redirectTo, puts it in <input type="hidden" name="redirectTo">
3. action     formData.get('redirectTo')  →  redirect(safeRedirect(value))
```

The guard captures `pathname + search`, so filters and page numbers survive.

### The open redirect

Step 3 redirects to a string that came from the URL bar. Without validation,
`/login?redirectTo=https://evil.example` turns your login page into a
**phishing vector**: a convincing link to *your* domain, a real sign-in, then
a redirect to a fake "session expired, enter your password again" page.

```ts
/** Only same-origin PATHS. `unknown` in: it comes straight off FormData / the URL. */
function safeRedirect(target: unknown, fallback = '/account'): string {
  if (typeof target !== 'string' || !target) return fallback;
  if (!target.startsWith('/') || target.startsWith('//')) return fallback;
  return target;
}
```

Must start with `/`; must not start with `//` (a protocol-relative URL —
`//evil.example` is cross-origin). One function, applied at every
`redirect()` whose argument the user influenced: the action, *and* the loader
that bounces already-signed-in visitors.

**→ In the demos:** Demo 11, Labs 3 and 4 — including deleting `safeRedirect`
and watching the redirect leave the site.

📖 [OWASP — Unvalidated Redirects and Forwards](https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html)

---

## 13. Role-based access

Authentication is who you are; authorisation is what you may do. ShopScope's
roles are a union, so a typo is a compile error rather than a route nobody can
open:

```ts
export type Role = 'admin' | 'moderator' | 'user';
```

RBAC has to be built in **three places** in the client — and none of them is
the server.

### 13.1 In the route

A factory that returns a middleware, so the role list is data:

```ts
/** `...allowed: Role[]` — requireRole('admni') will not compile. */
export function requireRole(...allowed: Role[]): MiddlewareFunction {
  return async ({ context }) => {
    const user = context.get(userContext);
    if (!user || !allowed.includes(user.role)) {
      throw data(
        { message: `This area needs the ${allowed.join(' or ')} role. You're signed in as ${user?.role ?? 'a guest'}.` },
        { status: 403, statusText: 'Forbidden' },
      );
    }
  };
}
```

`data(body, { status: 403 })` throws a typed response that the nearest
`ErrorBoundary` receives; `isRouteErrorResponse(error) && error.status === 403`
picks it out and renders a *Not allowed* page. It runs *after*
`authMiddleware` — which is why it can read `userContext` without fetching —
and it is a 403, not a redirect: the user is signed in; they are simply not
allowed.

### 13.2 In the action

Hidden buttons are UX. Anyone can open the product form by typing `?new=1`
into the URL. The check that is actually a check sits at the top of the
action:

```ts
export async function productsAction({ request }: ActionFunctionArgs) {
  if (tokenStore.getUser()?.role !== 'admin') {
    throw data({ message: 'Only admins can change the catalogue.' }, { status: 403, statusText: 'Forbidden' });
  }
  …
}
```

### 13.3 In the UI: hide, disable, or 403

| | When | Why |
|---|---|---|
| **Hide** | the user does not know the feature exists, or should not — *Add product* for a shopper | no door to bump into |
| **Disable** (with a reason) | the user knows the feature and will get it under some condition — *Delete* greyed out with "ask an admin" | discoverability; explains the gap |
| **403 page** | the user got there anyway — a typed URL, a stale bookmark, a shared link | an honest answer instead of a blank page or a crash |

ShopScope hides the catalogue-editing buttons and the *Team* link, and shows
a 403 page for `/account/team` typed by a non-admin:

```tsx
// the page decides; the card knows only about handlers
const rootData = useRouteLoaderData<typeof rootLoader>('root');   // T | undefined — the route may not be in the tree
const isAdmin = rootData?.user?.role === 'admin';

{isAdmin && <Button onClick={() => setParam('new', 1)}>Add product</Button>}
<ProductGrid
  onEdit={isAdmin ? (product) => setParam('edit', product.id) : undefined}
  onDelete={isAdmin ? setPendingDelete : undefined}
/>
```

`ProductCard` renders its edit and delete buttons only when the handlers
exist. The card does not know about roles; it knows about *capabilities*.
That keeps the decision in one place — the page — and makes a `moderator`
tier that can edit but not delete a one-line change.

### 13.4 And none of it is security

Everything above runs in a browser the user controls. They can edit your
JavaScript, remove the `isAdmin` check, and submit the form. What the client
checks buy is a *correct experience*: the right people see the right things,
and the wrong people get a clear *not allowed* instead of a confusing failure.
**The real enforcement is your API rejecting the request.** Build both halves
in the client so the experience is right, and never let the server assume the
client checked.

**→ In the demos:** Demo 11, Lab 5 — including the bypass: `?new=1` as
`averyp`, which the hidden button did not stop and the action did.

📖 [React Router — `data`](https://reactrouter.com/api/utils/data) ·
[`isRouteErrorResponse`](https://reactrouter.com/api/utils/isRouteErrorResponse)

---

## 14. Auth in loaders and actions

Once the middleware has run, loaders beneath it read the user from context —
no second request, no `tokenStore` import:

```ts
export async function cartsLoader({ context, request }: LoaderFunctionArgs) {
  const user = context.get(userContext);        // User | null — the context's declared type
  if (!user) throw new Error('cartsLoader ran without authMiddleware');   // a wiring bug, not a user error
  return { carts: await listCartsForUser(user.id, { signal: request.signal }) };
}
```

The type system cannot see that the middleware ran, so `context.get` is
`User | null` even under `authMiddleware`. The throw is deliberate: it is a
*wiring* error if it ever fires, and it is also what narrows `user` to `User`
for the component — `useLoaderData<typeof cartsLoader>()` gets `User`, and
nobody reaches for `!`.

**Actions** are mutations, and mutations are where authorisation matters most.
Two checks, in order: authentication by the subtree middleware (which runs for
actions as well as loaders), then authorisation in the action itself
([§13.2](#132-in-the-action)) or by `requireRole` on the route.

**Expiry mid-form.** `authMiddleware` redirects to `/login?redirectTo=…`,
which is right for a GET. For a POST whose session expired while the user was
typing, a redirect loses the submission. The common case is already handled —
the action's request 401s, refreshes, replays, and the user never knows. For
the genuinely dead session, return a 401-shaped action result the form shows
inline ("Your session expired — sign in to submit") so the typed values stay
in the DOM.

**Parallel loaders share the queue.** Several loaders for one navigation run
at once; if the token expires at that moment they all 401 together — and all
share the one refresh. The queue is not an optimisation for a rare case; a
nested route with three loaders hits it on every expiry.

📖 [React Router — Data loading](https://reactrouter.com/start/data/data-loading) ·
[Actions](https://reactrouter.com/start/data/actions)

---

## 15. Logout everywhere

"Sign out" is a list, and most apps implement only the first item:

```ts
function handleSignOut() {
  logout();                          // 1. clear tokens + user → AUTH_CHANGED → root loader revalidates
  queryClient.clear();               // 2. drop every cached server response (TanStack Query, Demo 19)
  useCartStore.getState().reset();   // 3. reset user-scoped client stores (Zustand, Demo 13)
  navigate('/products');             // 4. leave the protected area
}
```

1. **The token store.** Without this the next request still carries a valid
   token.
2. **The cache.** A query cache or a loader's data still holds the previous
   user's carts and profile. The next person to sign in on this machine must
   not see them for even one frame.
3. **Client stores.** A persisted cart or wishlist belongs to the person who
   built it.
4. **Navigate away.** Staying on `/account` means the next revalidation
   redirects to login — which works, but is worse than leaving deliberately.

And one the client cannot do: **revoke the refresh token on the server.**
Clearing `localStorage` does not invalidate a token someone else has copied. A
real backend has a logout endpoint that kills the refresh token; DummyJSON
does not — a workshop limitation worth naming.

### The interceptor's logout

The other path into sign-out is the failed refresh in
[§8](#8-the-single-flight-refresh-queue). It cannot call `navigate()` — the
API layer must not import the router — so it clears the store and fires
`AUTH_CHANGED`. The root layout revalidates; the header flips; and if the user
is on a protected route, the middleware runs again and redirects to
`/login?expired=1`. Same end state, reached through the event.

### Other tabs

`localStorage` fires a `storage` event in *every other tab* when a key
changes. Subscribe to it alongside `AUTH_CHANGED` and a logout in one tab
signs out all of them:

```ts
useEffect(() => {
  const onStorage = (e: StorageEvent) => {
    if (e.key?.startsWith('shopscope.')) revalidator.revalidate();
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}, [revalidator]);
```

This is also the edge of what the refresh queue coordinates: two tabs expiring
at once each refresh, and with rotation one loses. The `storage` event lets
the loser pick up the winner's new tokens — the subject of Demo 11 Lab 2's
challenge.

**→ In the demos:** Demo 11, Lab 3.2 (`handleSignOut`) and the Lab 2
challenge.

📖 [MDN — `storage` event](https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event)

---

## 16. Testing the queue and the guards

The refresh queue is the piece of an auth layer most likely to be subtly
wrong and least likely to be noticed: it only misbehaves when several requests
expire at the same moment, which is exactly when nobody is watching. It is
also easy to test, because it has a crisp contract.

### The queue, through the real interceptor chain

Test it through the real `api` instance with MSW at the network boundary — not
by mocking axios. Arrange a world where the token has expired: a
`GET /products/:id` that 401s until it is shown the *new* token, and a
`POST /auth/refresh` that counts its own calls.

```ts
// src/api/interceptors/refresh.test.ts
beforeAll(() => installInterceptors());          // the same call main.tsx makes

let refreshCalls = 0;
let productCalls = 0;

beforeEach(() => {
  refreshCalls = 0;
  productCalls = 0;
  tokenStore.set({ accessToken: 'access-1', refreshToken: 'refresh-1' });

  server.use(
    http.get(`${API}/products/:id`, ({ request, params }) => {
      productCalls += 1;
      if (request.headers.get('Authorization') !== 'Bearer access-2') {
        return HttpResponse.json({ message: 'Token Expired!' }, { status: 401 });
      }
      return HttpResponse.json({ id: Number(params.id), title: `Product ${params.id}` });
    }),
    http.post(`${API}/auth/refresh`, () => {
      refreshCalls += 1;
      return HttpResponse.json({ accessToken: 'access-2', refreshToken: 'refresh-2' });
    }),
  );
});

it('refreshes ONCE for six concurrent 401s and replays all six', async () => {
  const results = await Promise.all([1, 2, 3, 4, 5, 6].map((id) => getProduct(id)));

  expect(refreshCalls).toBe(1);                   // six would mean five dead refresh tokens
  expect(productCalls).toBe(12);                  // six 401s + six replays; nothing dropped or tripled
  expect(results.map((product) => product.id)).toEqual([1, 2, 3, 4, 5, 6]);
  expect(tokenStore.getAccess()).toBe('access-2');
});
```

Then one test per guard in the implementation:

| Test | Arrange | Assert |
|---|---|---|
| stores the rotated pair | the test above | the *next* request needs no refresh — `refreshCalls` stays 1 |
| failed refresh signs out | `/auth/refresh` → 400 | `isAuthenticated()` is false; the rejection is the **original** 401 (an `ApiError` with `status === 401`, after the normaliser) |
| `_retry` ceiling | `/products/:id` → 401 *always* | exactly one refresh, exactly two product calls, then rejection — not a hang |
| `/auth/*` exemption | `/auth/me` → 401 | `refreshCalls` is 0 |

The third row catches the infinite loop; without `_retry` it would hang the
runner, so give it a timeout you can reason about.

### The guard, with `createRoutesStub`

Route-level tests answer "did anyone break auth?". `createRoutesStub` renders a
real route tree with only the parts the test is about:

```tsx
const Stub = createRoutesStub([
  {
    path: '/',
    Component: () => (<><LocationDisplay /><Outlet /></>),
    children: [
      { path: 'login', Component: () => <h1>Sign in</h1> },
      { path: 'account', middleware: [authMiddleware], Component: () => <h1>Your account</h1>, loader: () => ({}) },
    ],
  },
]);

it('redirects a signed-out visitor to /login, remembering where they were going', async () => {
  tokenStore.clear();
  render(<Stub initialEntries={['/account']} />);

  expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  expect(screen.getByTestId('location')).toHaveTextContent('/login?redirectTo=%2Faccount');
});
```

Plus: a signed-in visitor passes; a token with no cached profile causes
exactly one `GET /auth/me` whose answer is stored; and a dead session —
`/auth/me` 401s *and* the refresh fails — lands on `/login?expired=1` with the
store cleared. That last test exercises the interceptor chain and the
middleware in a single render, which is the point of testing at this level.
Note the `loader: () => ({})` on the stub's account route — without it the
middleware never runs ([§11](#11-protected-routes-with-middleware)).

**→ In the demos:** Demo 20, Lab 4.4 (`refresh.test.ts`) and Lab 5
(`routes.test.tsx`). Module 18 — Testing covers MSW and the query priority
these tests rely on.

📖 [React Router — `createRoutesStub`](https://reactrouter.com/api/utils/createRoutesStub)

---

## 17. Common mistakes

**Decoding the JWT in the client as a source of truth.** `jwtDecode(token).role === 'admin'`
is a claim read without verification. Get the user from `/auth/me`, and let
the server be the only thing that decides what a token means
([§3](#3-what-a-jwt-is--and-is-not)).

**Roles that exist only client-side.** If `isAdmin` lives in a store the user
can edit from DevTools and the API never checks, you have no authorisation —
you have a suggestion ([§13.4](#134-and-none-of-it-is-security)).

**Infinite refresh loops.** Missing `_retry` (a revoked token replays
forever); refreshing through `api` instead of `bareApi` (a failing refresh
re-enters the handler); refreshing on `/auth/*` 401s (two interceptors
feeding each other). One line each, and all three are tested
([§16](#16-testing-the-queue-and-the-guards)).

**Six refreshes for six 401s.** The `??=` line is missing, or `refreshPromise`
is declared inside the function instead of at module level. The bug report
reads "randomly logged out when I open several tabs" and takes a week to
trace because it only reproduces under concurrency
([§8](#8-the-single-flight-refresh-queue)).

**The normaliser registered before the refresh handler.** Every 401 signs you
out ([§9](#9-interceptor-order-is-load-bearing)).

**`navigate('/login')` from the interceptor.** The API layer now imports the
router. Fire an event; let the layout revalidate
([§4](#4-where-auth-state-lives)).

**A guard component instead of middleware.** The loaders already ran, the
requests already 401'd, and the page flashed
([§11](#11-protected-routes-with-middleware)).

**`throw`ing a wrong password.** The error boundary eats the form. Return the
error; wrong passwords are expected ([§5](#5-the-login-flow)).

**Redirecting to an unvalidated `redirectTo`.** An open redirect
([§12](#12-returning-to-the-intended-url)).

**Only hiding the buttons.** `?new=1` opens the form for anyone. The action
check is the lock ([§13.2](#132-in-the-action)).

**`import { createContext } from 'react'` in `middleware.ts`.** Wrong
`createContext`; `context.set` throws.

**Logout that clears only the tokens.** The previous user's cached data is
still on screen for the next ([§15](#15-logout-everywhere)).

---

## 18. Self-check

1. Define authentication and authorisation, and name the status for a failure
   of each. Why does the distinction change what the client does next?
2. Cookie session vs bearer token: which attack does each have to defend
   against, and what is the defence?
3. What do `HttpOnly`, `Secure` and `SameSite` each do on a cookie?
4. For memory, `sessionStorage`, `localStorage` and an `httpOnly` cookie:
   survives reload? readable by XSS?
5. What are the three parts of a JWT? Can the browser verify one? What follows
   from that?
6. Why does `login()` call `/auth/me` after `/auth/login`?
7. Why is `AUTH_CHANGED` a DOM event rather than a React state setter, and
   how does the header update after login with no explicit state update?
8. Why return, rather than throw, on a wrong password?
9. Default header vs request interceptor for the token — give two concrete
   failure modes of the default header. Why must `/auth/refresh` never carry
   the access token?
10. Name the three bugs in the naive 401 handler and the one-line fix for
    each.
11. Explain `refreshPromise ??= refreshTokens().finally(...)` line by line.
    What breaks without the `finally`?
12. Why does the refresh handler reject with the *original* error when the
    refresh fails?
13. Why must the refresh interceptor be registered before the error
    normaliser, and what happens if it is not?
14. What is the flash of logged-out UI, and what are three ways to avoid it?
15. Why is a cached user "a claim, not proof", and what makes relying on it
    safe anyway?
16. Compare a guard component, a loader guard and middleware on: when the
    check runs, whether loaders already ran, flashing, and forgettability.
17. Quote the `MiddlewareFunction` signature. When would you call `next()`?
    Under what condition does middleware *not* run for a route?
18. What is `createContext` from `react-router`, how does it differ from
    React's, and why is `context.get(userContext)` still `User | null` under
    `authMiddleware`?
19. Describe the `redirectTo` round trip. What does `safeRedirect` reject, and
    what attack does it prevent?
20. Why is a role failure a 403 `data()` and not a `redirect()`?
21. Hide, disable, 403 page — give a case for each. Why does `ProductCard`
    receive `onEdit` or `undefined` rather than a `role`?
22. List everything "sign out" must clear, the one thing the client cannot
    do, and how a logout in one tab reaches the others.
23. In the refresh-queue test, what do `refreshCalls === 1` and
    `productCalls === 12` each prove? Which test catches the infinite loop?

### Practical

1. Implement `TokenStore` a second time, in memory only. Confirm nothing else
   changes, then describe what the user experiences on reload.
2. Remove the `??=` line, sign in, wait for expiry, and run
   `Promise.all([getMe(), getMe(), getMe()])`. Count the refresh calls and
   explain the sign-out. Then swap the last two lines of
   `installInterceptors()` and reproduce *that* symptom.
3. Write `safeRedirect` from memory and test it against `https://evil.example`,
   `//evil.example`, `/account?page=2`, `''` and `null`.
4. Add a `moderator` tier that can edit but not delete products. It should
   touch two files; if it touches more, find the misplaced decision.
5. Add the `storage` listener from [§15](#15-logout-everywhere) and sign out
   in one tab with two open.
6. Write the four refresh-queue tests and the four middleware tests from
   [§16](#16-testing-the-queue-and-the-guards), all through MSW — no axios
   mocks.
7. Answer the Demo 11 Lab 4 challenge: what should `authMiddleware` do with a
   POST whose session expired mid-form? Implement your answer.

---

## 19. References

Official documentation and standards only.

**React**
- [`useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore) — subscribing React to a store it does not own
- [`createContext`](https://react.dev/reference/react/createContext) — the *other* `createContext`
- [Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects) — the `AUTH_CHANGED` and `storage` subscriptions
- [You Might Not Need an Effect — Initializing the application](https://react.dev/learn/you-might-not-need-an-effect#initializing-the-application)
- [`useState` — avoiding recreating the initial state](https://react.dev/reference/react/useState#avoiding-recreating-the-initial-state) — the lazy initialiser that avoids the flash

**React Router 8**
- [Middleware](https://reactrouter.com/how-to/middleware)
- [`createContext`](https://reactrouter.com/api/utils/createContext) · [`RouterContextProvider`](https://reactrouter.com/api/utils/RouterContextProvider)
- [`redirect`](https://reactrouter.com/api/utils/redirect) · [`data`](https://reactrouter.com/api/utils/data) · [`isRouteErrorResponse`](https://reactrouter.com/api/utils/isRouteErrorResponse)
- [`<Form>`](https://reactrouter.com/api/components/Form) · [`useActionData`](https://reactrouter.com/api/hooks/useActionData) · [`useNavigation`](https://reactrouter.com/api/hooks/useNavigation)
- [`useRevalidator`](https://reactrouter.com/api/hooks/useRevalidator) · [`useRouteLoaderData`](https://reactrouter.com/api/hooks/useRouteLoaderData)
- [Data loading](https://reactrouter.com/start/data/data-loading) · [Actions](https://reactrouter.com/start/data/actions) · [Route object — `HydrateFallback`](https://reactrouter.com/start/data/route-object#hydratefallback)
- [`createRoutesStub`](https://reactrouter.com/api/utils/createRoutesStub)

**axios 1.x**
- [Interceptors](https://axios-http.com/docs/interceptors) · [Creating an instance](https://axios-http.com/docs/instance) · [Handling errors](https://axios-http.com/docs/handling_errors)

**Cookies, storage, HTTP**
- [MDN — Using HTTP cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies) · [`Set-Cookie`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie)
- [MDN — `Authorization`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Authorization) · [401](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/401) · [403](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/403)
- [MDN — `Window.localStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) · [`storage` event](https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event)

**Security**
- [OWASP — Cross-Site Request Forgery Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [OWASP — Cross Site Scripting Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP — HTML5 Security Cheat Sheet: Local Storage](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html#local-storage)
- [OWASP — Unvalidated Redirects and Forwards Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html)

**Tokens**
- [RFC 7519 — JSON Web Token (JWT)](https://datatracker.ietf.org/doc/html/rfc7519) · [RFC 6750 — Bearer Token Usage](https://datatracker.ietf.org/doc/html/rfc6750)
- [jwt.io — Introduction to JSON Web Tokens](https://jwt.io/introduction)
- [DummyJSON — Auth endpoints](https://dummyjson.com/docs/auth)

---

**Previous:** Module 21 — The API Layer
