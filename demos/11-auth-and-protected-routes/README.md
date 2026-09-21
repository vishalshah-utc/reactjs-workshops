# Demo 11 — Authentication & Protected Routes

**Demo guide** · ~120 minutes · a real login, a token that refreshes itself, and pages only some people may see

---

## Where you are starting from

The starter is **Demo 10, finished**: loaders, actions, fetchers, pending UI
and error boundaries. Anyone can add, edit and delete. There is no user.

New stubs: `src/lib/tokenStore.ts`, `src/api/services/auth.ts`,
`src/api/interceptors/auth.ts`, `src/api/interceptors/refresh.ts`,
`src/routes/LoginPage.tsx`, `src/routes/middleware.ts`,
`src/routes/account/AccountLayout.tsx`. Finished and waiting to be routed:
`src/routes/account/{ProfilePage,CartsPage,TeamPage}.tsx` and
`src/api/services/users.ts`.

## What you ship today

JWT login as a route action that sends you back where you were going; the
token attached to every request by an interceptor; a **refresh queue** that
survives six concurrent 401s with one refresh call; `/account` protected by
**middleware** so no child route can forget; a `/account/team` page that
needs the `admin` role; and catalogue editing that only admins see — and
only admins can *do*.

By the end you will be able to answer, without hesitating:

- What access and refresh tokens each do, and why the short-lived one travels
- The honest trade-offs of `localStorage` vs an `httpOnly` cookie
- Why the token is attached by an interceptor and not a default header
- The three bugs in the naive 401 handler, and the three lines that fix them
- Why the refresh interceptor must run **before** the error normaliser
- The three ways to protect a route, and why **middleware** is the v8 answer
- What an open redirect is and the one function that prevents it
- Why hiding a button is UX and middleware is a lock — and why neither is the server

> **Two real accounts.** `emilys` / `emilyspass` is an **admin**;
> `averyp` / `averyppass` is a regular **user**. Every difference in this demo
> is visible by signing in as one, then the other.

---

## Before the demo (5 minutes)

```
https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/11-auth-and-protected-routes/starter
```

> ⚠️ Click once, bookmark the `stackblitz.com/edit/…` URL.

Locally: `cd demos/11-auth-and-protected-routes/starter && npm install && npm run dev`.

Try the auth API raw, in a terminal, so the shape is familiar before you code
against it:

```bash
curl -s -X POST https://dummyjson.com/auth/login -H 'Content-Type: application/json' \
  -d '{"username":"emilys","password":"emilyspass","expiresInMins":1}'
```

`accessToken`, `refreshToken`, and a **subset** of the user — no `role`. Keep
that in mind for Lab 1.

---

## The cold open

Open `/account/team` in the starter. A team directory, twelve people with
their roles and emails. Anyone can see it. Click **Add product** and delete a
product. Anyone can do that too.

Now try to sign in. There's a **Sign in** button — click it — a card that says
"No form yet". The whole notion of *who is using this* doesn't exist. Today
we add it, and then we use it to decide what people may see and do.

---

## Lab 1 — Tokens and the auth service (20 min)

### Problem

Logging in produces two tokens. Where do they live, how does every request
get one, and what happens when it expires? Before any of that: they need a
home.

### Concept

**Two tokens, two jobs.**

| | Access token | Refresh token |
|---|---|---|
| Lifetime | minutes | days or weeks |
| Sent with | **every** API request | only the refresh call |
| If stolen | limited blast radius | full takeover until revoked |

That asymmetry is the design: the credential that travels constantly is the
one that expires fastest.

**Where to keep them.**

| Location | Survives refresh | XSS-readable | Notes |
|---|---|---|---|
| Memory | no | no | safest; re-auth on reload |
| `sessionStorage` | per-tab | **yes** | |
| `localStorage` | yes | **yes** | most common; most criticised |
| `httpOnly` cookie | yes | **no** | best — but your server must set it, and you need CSRF defence |

The honest summary: **an `httpOnly` cookie set by your backend is the right
answer for a real product.** `localStorage` is what most tutorials and many
production apps use, and it means any XSS in your app — or in any of your
thousand transitive dependencies — can read the token. We use it here because
DummyJSON is token-based and this is a workshop. The trade-off is stated, not
hidden.

**An event for non-React code.** An interceptor that signs the user out has
no way to call `setState`. A DOM event (`window.dispatchEvent`) lets the API
layer say "auth changed" without importing React or reaching into the router.

**The login response is a subset.** It has no `role`. Fetch `/auth/me` once
after login and store the full profile — so the header and every role check
have it.

### Steps

**A. `src/lib/tokenStore.ts` — `TODO(lab-1.1)`**

```ts
import type { User } from '../types';

const KEYS = {
  access: 'shopscope.accessToken',
  refresh: 'shopscope.refreshToken',
  user: 'shopscope.user',
} as const;

export const AUTH_CHANGED = 'shopscope:auth-changed';

function emit() {
  window.dispatchEvent(new Event(AUTH_CHANGED));
}

/** The interface first: it's what the rest of the app depends on. Swap localStorage for cookies and nothing else changes. */
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
      return JSON.parse(localStorage.getItem(KEYS.user) ?? 'null') as User | null;   // JSON.parse returns any — say what it is
    } catch {
      return null;                       // a corrupted entry means "signed out", not "crash"
    }
  },

  isAuthenticated() {
    return Boolean(localStorage.getItem(KEYS.access));
  },

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

**B. `src/api/services/auth.ts` — `TODO(lab-1.2)`**

```ts
import { api, bareApi } from '../client';
import { endpoints } from '../endpoints';
import { tokenStore } from '../../lib/tokenStore';
import type { AuthTokens, LoginResponse, User } from '../../types';

/** Deliberately SHORT, so the refresh flow in Lab 2 is easy to watch. */
const TOKEN_LIFETIME_MINS = 1;

interface RequestOptions {
  signal?: AbortSignal;
}

export async function getMe({ signal }: RequestOptions = {}): Promise<User> {
  const { data } = await api.get<User>(endpoints.auth.me(), { signal });
  return data;
}

export async function login({ username, password }: { username: string; password: string }): Promise<User> {
  const { data } = await api.post<LoginResponse>(endpoints.auth.login(), { username, password, expiresInMins: TOKEN_LIFETIME_MINS });
  tokenStore.set({ accessToken: data.accessToken, refreshToken: data.refreshToken });

  // LoginResponse has no `role` — the TYPE says so, which is why this can't just be stored as a User.
  // Fetch the full profile once and store it.
  const user = await getMe();
  tokenStore.set({ user });
  return user;
}

/** bareApi — NO interceptors — so a failing refresh can't re-enter the 401 handler that called it. */
export async function refreshTokens(): Promise<string> {
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) throw new Error('No refresh token available');

  const { data } = await bareApi.post<AuthTokens>(endpoints.auth.refresh(), { refreshToken, expiresInMins: TOKEN_LIFETIME_MINS });
  tokenStore.set({ accessToken: data.accessToken, refreshToken: data.refreshToken });   // DummyJSON rotates BOTH
  return data.accessToken;
}

export function logout() {
  tokenStore.clear();
}
```

`bareApi` is the second instance you created in Demo 6 and haven't used
until now. This is what it was for.

### Verify

Nothing on screen yet — exercise it in the console:

```ts
const { login } = await import('/src/api/services/auth.ts');
await login({ username: 'emilys', password: 'emilyspass' });
localStorage.getItem('shopscope.user');
```

Two requests in the Network tab — `POST /auth/login`, then `GET /auth/me` —
and the second one **failed with 401**. Of course it did: nothing attaches
the token yet. That's Lab 2. Run `localStorage.clear()` before moving on.

### Watch out

**`context.get(userContext)` is `User | null` — even under `authMiddleware`.**
The type system can't see that the middleware ran. `accountLoader` throws if
it's null (a wiring bug, not a user error), and *that throw* is what narrows
`user` to `User` for the component. Don't reach for `!`.

**`useRouteLoaderData<typeof rootLoader>('root')` can be `undefined`.** It's
the one loader hook that returns `T | undefined` — the route id might not be
in the tree. `rootData?.user?.role` handles both that and the signed-out case.

**`getMe()` before the tokens are stored.** Order matters inside `login`:
store first, then fetch the profile.

**Putting `getMe` through `bareApi`.** Then it never gets a token. `api` for
everything except the refresh call itself.

### In the real world

`TOKEN_LIFETIME_MINS = 1` is a teaching setting — real access tokens live
5–15 minutes. But the *reason* the setting exists is real: you cannot test a
refresh flow you can't trigger. Make expiry configurable, and test with it
short.

---

## Lab 2 — The auth interceptor and the refresh queue (30 min)

### Problem

Every request needs `Authorization: Bearer <token>`. And when the token
expires, the API returns 401 — and the user must **not** be dumped at a login
screen. The app should quietly get a new token and retry.

### Concept

**Attach the token in a request interceptor.** It reads `tokenStore` *at
request time*. Compare with `api.defaults.headers.common.Authorization = …`:
that must be updated on login, on logout, and after every refresh — and any
request already configured keeps the old value. The interceptor has no stale
state to get wrong.

**The naive 401 handler, and its three bugs:**

```ts
api.interceptors.response.use(null, async (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.status === 401 && error.config) {
    const token = await refreshTokens();
    error.config.headers.set('Authorization', `Bearer ${token}`);
    return api(error.config);
  }
  return Promise.reject(error);
});
```

1. **Infinite loop.** If the retry also 401s, the handler fires again. Forever.
2. **Refresh stampede.** Six requests in flight when the token expires → six
   refresh calls. Most backends invalidate the old refresh token on use, so
   five fail and the user is signed out.
3. **The refresh call itself can 401**, re-entering the handler that called it.

**Three lines fix them:** a `_retry` flag on the config (once per request);
a module-level `refreshPromise ??=` so every concurrent 401 awaits the *same*
refresh; and `bareApi` for the refresh call plus a `/auth/` URL guard.

**Order is load-bearing — again.** The refresh handler needs the **raw axios
error**: `error.config` to replay, `error.response.status` to decide. The
error normaliser from Demo 6 *replaces* the error with an `ApiError`. So the
refresh handler must be registered **before** the normaliser. Swap them and a
401 just signs the user out — the "not gentle" version of the ordering bug.

### Steps

**A. `src/api/interceptors/auth.ts` — `TODO(lab-2.1)`**

```ts
import type { AxiosInstance } from 'axios';
import { tokenStore } from '../../lib/tokenStore';

const PUBLIC_PATHS = ['/auth/login', '/auth/refresh'];   // never carry a token

export function installAuthInterceptor(instance: AxiosInstance) {
  instance.interceptors.request.use((config) => {
    const isPublic = PUBLIC_PATHS.some((path) => config.url?.startsWith(path));
    const token = tokenStore.getAccess();
    if (token && !isPublic) config.headers.set('Authorization', `Bearer ${token}`);   // AxiosHeaders.set — typed, unlike bracket assignment
    return config;
  });
}
```

The `PUBLIC_PATHS` guard prevents a real bug: sending a stale, expired access
token to `/auth/refresh` makes some backends reject the refresh outright.

**B. `src/api/interceptors/refresh.ts` — `TODO(lab-2.2)`**

```ts
import axios, { type AxiosInstance } from 'axios';
import { api } from '../client';
import { refreshTokens } from '../services/auth';
import { tokenStore } from '../../lib/tokenStore';
import { logger } from '../../config/logger';

let refreshPromise: Promise<string> | null = null;   // module-scoped: the ONE in-flight refresh

export function installRefreshInterceptor(instance: AxiosInstance) {
  instance.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      if (!axios.isAxiosError(error)) return Promise.reject(error);   // narrow first — only an AxiosError has a config
      const original = error.config;

      const shouldTryRefresh =
        error.response?.status === 401 &&
        original !== undefined &&
        !original._retry &&                       // (1) once per request — `_retry` is ours, typed in types/axios.d.ts (Demo 6)
        !original.url?.startsWith('/auth/');      // (3) never for auth endpoints

      if (!shouldTryRefresh) return Promise.reject(error);

      original._retry = true;

      try {
        refreshPromise ??= refreshTokens().finally(() => {   // (2) everyone awaits the same promise
          refreshPromise = null;
        });

        const accessToken = await refreshPromise;
        logger.info('[auth] token refreshed; replaying request', original.url);

        original.headers.set('Authorization', `Bearer ${accessToken}`);
        return api(original);                     // replay the ORIGINAL request
      } catch {
        logger.warn('[auth] refresh failed; signing out');
        tokenStore.clear();                       // fires AUTH_CHANGED
        return Promise.reject(error);             // the ORIGINAL 401 — the honest answer
      }
    },
  );
}
```

Why reject with the *original* error: the caller asked for `/products`.
"The refresh endpoint failed" describes plumbing it never knew about.

**C. `src/api/interceptors/index.ts` — `TODO(lab-2.3)`**

```ts
import { installAuthInterceptor } from './auth';
import { installRefreshInterceptor } from './refresh';
// …
export function installInterceptors() {
  installAuthInterceptor(api);       // request side
  installLoggingInterceptor(api);
  installRefreshInterceptor(api);    // BEFORE the normaliser — needs the raw error
  installErrorNormalizer(api);       // LAST
}
```

> **Circular imports:** `refresh.ts` imports `api` and `refreshTokens`, which
> import `client.ts`, which… ES modules handle this fine because the imports
> are only *called* at runtime, after every module has evaluated. It's exactly
> why interceptors live in their own files and are installed explicitly.

### Verify

In the console again: `await login({ username: 'emilys', password: 'emilyspass' })`
— **both** requests succeed now, and `GET /auth/me` carries `Authorization:
Bearer …` in its request headers. Reload the page: every request — including
the product list, which doesn't need it — now carries the header. That's the
interceptor.

**The payoff, in three steps.** The token lives one minute.

1. In the console: `const { getMe } = await import('/src/api/services/auth.ts'); await getMe();`
   → your profile. One request.
2. Wait ~70 seconds.
3. `await getMe()` again. Same result — but the Network tab shows **three**
   requests: `/auth/me` → **401**, `/auth/refresh` → **200**, `/auth/me` → **200**.

The caller saw a working function. That is the entire point of interceptors.

Now the stampede test: right after the token expires, run
`await Promise.all([getMe(), getMe(), getMe()])`. Three `/auth/me` 401s, **one**
`/auth/refresh`, three replays. Comment out the `??=` line (call
`refreshTokens()` directly) and repeat: three refreshes, and with DummyJSON's
rotation two of them fail. Put it back.

### Watch out

**Normaliser before refresh.** The handler gets an `ApiError`, `original` is
`undefined`, `shouldTryRefresh` is false, and every 401 signs you out. Check
`index.ts` order first when refresh "doesn't work".

**Refresh through `api` instead of `bareApi`.** A failing refresh 401s,
enters this handler, tries to refresh, 401s… the `/auth/` guard catches it,
but `bareApi` is the belt to that brace.

**Forgetting `original._retry = true`.** A token that's revoked server-side
produces an infinite 401 → refresh → replay loop.

### Challenge (2 min)

`refreshPromise` is module-level state. What happens with two axios instances?
With two browser tabs? (Hint for tabs: the `storage` event.) You've found the
edge of what an interceptor can coordinate.

### In the real world

Every SPA with JWTs has this file. The ones that skipped the `??=` line have
a bug report titled "randomly logged out when I open several tabs", and it
takes a week to trace, because it only reproduces under concurrency.

---

## Lab 3 — The login route (25 min)

### Problem

There's no way to sign in from the UI, and no way for the UI to know who's
signed in.

### Concept

**Login is a route with a loader and an action.** The loader bounces
already-signed-in users away. The action calls `login()`, and on success
`redirect`s to where the user was going. Wrong credentials are *expected* —
the action returns them; the form stays.

**`redirectTo`.** A guard captures the attempted URL (`/login?redirectTo=%2Faccount%2Fteam`);
the form carries it through the POST as a hidden input; the action redirects
there. Bouncing users to the home page after login is a small cruelty that's
easy to avoid.

**Never redirect to an unvalidated URL.** `?redirectTo=https://evil.example`
turns your login page into an **open redirect** — a real phishing vector.
Same-origin paths only: starts with `/`, not `//`.

**The header needs the user.** A **root loader** returns `tokenStore.getUser()`;
the router re-runs it after every action, so login and logout update the
header for free. For changes the router *can't* see — the interceptor
clearing tokens after a failed refresh — `useRevalidator` re-runs the loaders
when `AUTH_CHANGED` fires.

### Steps

**A. `src/routes/LoginPage.tsx` — `TODO(lab-3.1)`**

```tsx
import { Alert, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import { BoxArrowInRight } from 'react-bootstrap-icons';
import {
  Form as RouterForm, redirect, useActionData, useLoaderData, useNavigation, useSearchParams,
  type ActionFunctionArgs, type LoaderFunctionArgs,
} from 'react-router';
import { login } from '../api/services/auth';
import { tokenStore } from '../lib/tokenStore';
import { ApiError } from '../lib/ApiError';

/** Only same-origin PATHS. Anything else is an open-redirect attempt. `unknown` in: it comes straight off FormData / the URL. */
function safeRedirect(target: unknown, fallback = '/account'): string {
  if (typeof target !== 'string' || !target) return fallback;
  if (!target.startsWith('/') || target.startsWith('//')) return fallback;
  return target;
}

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
    return { error: ApiError.from(error).message, username };   // expected → return
  }

  return redirect(redirectTo);
}

export function LoginPage() {
  const { expired } = useLoaderData<typeof loginLoader>();
  const actionData = useActionData<LoginActionData>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const submitting = navigation.state === 'submitting';
  const redirectTo = searchParams.get('redirectTo') ?? '';

  return (
    <Row className="justify-content-center">
      <Col md={6} lg={5}>
        <Card>
          <Card.Body>
            <h1 className="h4 mb-3">Sign in</h1>
            {expired && <Alert variant="warning" className="py-2">Your session expired. Please sign in again.</Alert>}
            {redirectTo && !expired && (
              <Alert variant="info" className="py-2">Sign in to continue to <code>{redirectTo}</code>.</Alert>
            )}

            <RouterForm method="post" replace>
              <input type="hidden" name="redirectTo" value={redirectTo} />

              <Form.Group className="mb-3" controlId="username">
                <Form.Label className="small fw-semibold">Username</Form.Label>
                <Form.Control name="username" autoComplete="username" defaultValue={actionData?.username ?? 'emilys'} isInvalid={!!actionData?.error} required />
              </Form.Group>

              <Form.Group className="mb-3" controlId="password">
                <Form.Label className="small fw-semibold">Password</Form.Label>
                <Form.Control type="password" name="password" autoComplete="current-password" defaultValue="emilyspass" isInvalid={!!actionData?.error} required />
                <Form.Control.Feedback type="invalid">{actionData?.error}</Form.Control.Feedback>
              </Form.Group>

              <Button type="submit" className="w-100" disabled={submitting}>
                {submitting ? <Spinner as="span" size="sm" animation="border" className="me-2" /> : <BoxArrowInRight className="me-2" />}
                {submitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </RouterForm>

            <hr />
            <p className="small text-muted mb-0">
              Try <code>emilys</code> / <code>emilyspass</code> (admin) or <code>averyp</code> / <code>averyppass</code> (a regular user).
            </p>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}
```

Register it in **`src/router.tsx`** (same marker):

```tsx
import { LoginPage, loginAction, loginLoader } from './routes/LoginPage';
// …
{ path: 'login', Component: LoginPage, loader: loginLoader, action: loginAction },
```

**B. `src/routes/RootLayout.tsx` — `TODO(lab-3.2)`**

```tsx
import { useEffect, useState } from 'react';
import { Outlet, ScrollRestoration, useLoaderData, useNavigate, useNavigation, useRevalidator } from 'react-router';
import { logout } from '../api/services/auth';
import { AUTH_CHANGED, tokenStore } from '../lib/tokenStore';

/** Re-runs after every action — so login and logout update the header automatically. */
export function rootLoader() {
  return { user: tokenStore.getUser() };   // { user: User | null } — and that's what every page will see via 'root'
}

export function RootLayout() {
  const { user } = useLoaderData<typeof rootLoader>();
  const revalidator = useRevalidator();
  const navigate = useNavigate();
  // …existing wishlist + navigation state…

  // The interceptor clears tokens on a failed refresh. The router can't see that — so subscribe.
  useEffect(() => {
    const onAuthChanged = () => revalidator.revalidate();
    window.addEventListener(AUTH_CHANGED, onAuthChanged);
    return () => window.removeEventListener(AUTH_CHANGED, onAuthChanged);
  }, [revalidator]);

  function handleSignOut() {
    logout();                 // clears storage → AUTH_CHANGED → revalidate → header updates
    navigate('/products');
  }
  // …
  <SiteHeader cartCount={3} wishlistCount={wishlist.length} user={user} onSignOut={handleSignOut} />
```

In **`src/router.tsx`**, give the root route `id: 'root'` and
`loader: rootLoader`. The `id` lets *any* page read this data with
`useRouteLoaderData('root')` — Lab 5 uses it.

**C. `src/components/SiteHeader.tsx` — `TODO(lab-3.3)`**

```tsx
import { Badge, Button, Container, Form, Image, Nav, Navbar } from 'react-bootstrap';
import { BoxArrowInRight, Cart3, Heart, PersonPlus, Shop } from 'react-bootstrap-icons';
import type { User } from '../types';
// …
interface SiteHeaderProps {
  cartCount?: number;
  wishlistCount?: number;
  /** null = signed out. */
  user?: User | null;
  onSignOut?: () => void;
}

export function SiteHeader({ cartCount = 0, wishlistCount = 0, user = null, onSignOut }: SiteHeaderProps) {
  // …after the NAV_LINKS map:
  {user && <Nav.Link as={NavLink} to="/account">Account</Nav.Link>}
  // …at the end of the right-hand group:
  {user ? (
    <>
      <Image src={user.image} roundedCircle width={28} height={28} alt="" className="bg-secondary" />
      <span className="text-light small d-none d-lg-inline">{user.firstName}</span>
      <Button size="sm" variant="outline-light" onClick={onSignOut}>Sign out</Button>
    </>
  ) : (
    <>
      {/* the Sign up button from Demo 4 stays — signed-out visitors need both doors */}
      <Button variant="outline-light" size="sm" onClick={() => setShowSignup(true)}>
        <PersonPlus className="me-1" />
        Sign up
      </Button>
      {/* a Link wearing button classes — `Button as={Link}` doesn't type-check (Demo 9) */}
      <Link to="/login" className="btn btn-light btn-sm">
        <BoxArrowInRight className="me-1" />
        Sign in
      </Link>
    </>
  )}
```

### Verify

Click **Sign in**. Sign in as `emilys`. You land on `/account` (the fallback;
the guard isn't built yet so it renders nothing interesting — Lab 4). The
header shows Emily's avatar, name, an **Account** link and **Sign out** — no
reload, that's the root loader re-running after the action.

Sign out: header flips back, you're on `/products`. Sign in with a wrong
password: `400` in the Network tab, *"Invalid credentials"* under the field —
the backend's own message, via `ApiError`, *returned* by the action.

Visit `/login` while signed in — bounced to `/account` by the loader.
`/login?redirectTo=https://example.com`, sign in — you land on `/account`,
not example.com. Delete `safeRedirect` and you've built an open redirect.

### Watch out

**`throw`ing the login failure.** The error boundary eats the form. *Return*
it; wrong passwords are expected.

**Forgetting `id: 'root'`.** `useRouteLoaderData('root')` returns `undefined`
in Lab 5.

**`navigate('/login')` from the interceptor.** The API layer would import the
router. The event + `useRevalidator` keeps the layers apart.

### Challenge (2 min)

The password field has `defaultValue="emilyspass"` — a workshop convenience.
List the reasons it must never ship, then find one more that isn't security.

---

## Lab 4 — Protected routes: three ways (25 min)

### Problem

`/account` and everything under it should require a signed-in user. There
are three places to enforce that, and they are not equivalent.

### Concept

**A — a guard component** (the v6-era way): a wrapper that checks and
`<Navigate>`s during render. **Weakest**: the protected route's loaders have
*already run* — you fired authenticated requests you knew would 401 — and it
flashes, because React must render before it can redirect.

**B — a loader guard**: `if (!authed) throw redirect('/login')` at the top of
each loader. Better — before render, no wasted requests for *that* route. But
every protected loader needs the check, and the one you forget is the hole.

**C — middleware** ← the v8 answer. Runs before *all* loaders and actions in a
route subtree, parent → child. Put it on the layout and everything beneath
is protected — including routes added next year:

**Typed end to end.** A middleware is a `MiddlewareFunction`; annotate the
variable and `{ request, context }` is typed for you. `createContext<User | null>`
is the contract for the context key: `context.set` must be given a `User | null`,
and `context.get` hands one back — no casts on either side. And
`requireRole(...allowed: Role[])` means `requireRole('admni')` is a compile
error, not a route that nobody can open.

```ts
{ path: 'account', middleware: [authMiddleware], Component: AccountLayout, children: [ … ] }
```

And it shares what it learned: `context.set(userContext, user)` in the
middleware, `context.get(userContext)` in any loader below. One `/auth/me`
per navigation, not one per page.

**Middleware anatomy:**

```ts
const guard: MiddlewareFunction = async ({ request, params, context }, next) => {
  // before loaders — throw redirect() or data() to stop the navigation
  await next();   // optional; omit entirely for a simple guard
  // after
};
```

> **`createContext` here is React Router's, not React's.** Same name,
> different import, different mechanism — a typed *key* for the middleware
> `context`, not a provider. `import { createContext } from 'react-router'`.

### Steps

**A. `src/routes/middleware.ts` — `TODO(lab-4.1)`**

```ts
import { createContext, data, redirect, type MiddlewareFunction } from 'react-router';
import { getMe } from '../api/services/auth';
import { tokenStore } from '../lib/tokenStore';
import { logger } from '../config/logger';
import type { Role, User } from '../types';

/**
 * A typed KEY for middleware context. NOTE: React Router's createContext, not
 * React's — same name, different import, different mechanism.
 * The generic is the contract: context.set() must be given a User | null, and
 * context.get() hands one back.
 */
export const userContext = createContext<User | null>(null);

export const authMiddleware: MiddlewareFunction = async ({ request, context }) => {
  if (!tokenStore.isAuthenticated()) {
    const url = new URL(request.url);
    throw redirect(`/login?redirectTo=${encodeURIComponent(url.pathname + url.search)}`);
  }

  let user = tokenStore.getUser();
  if (!user) {
    try {
      user = await getMe({ signal: request.signal });
      tokenStore.set({ user });
    } catch {
      tokenStore.clear();                      // the token is dead AND refresh already failed
      throw redirect('/login?expired=1');
    }
  }

  context.set(userContext, user);
};

/** Factory: a middleware that requires one of the given roles. `...allowed: Role[]` — requireRole('admni') won't compile. */
export function requireRole(...allowed: Role[]): MiddlewareFunction {
  return async ({ context }) => {
    const user = context.get(userContext);
    if (!user || !allowed.includes(user.role)) {
      logger.warn(`[auth] role denied: ${user?.role ?? 'anonymous'} needs ${allowed.join('|')}`);
      throw data(
        { message: `This area needs the ${allowed.join(' or ')} role. You're signed in as ${user?.role ?? 'a guest'}.` },
        { status: 403, statusText: 'Forbidden' },
      );
    }
  };
}
```

**B. `src/routes/account/AccountLayout.tsx` — `TODO(lab-4.2)`**

```tsx
import { NavLink, Outlet, useLoaderData, type LoaderFunctionArgs } from 'react-router';
import { userContext } from '../middleware';

export async function accountLoader({ context }: LoaderFunctionArgs) {
  const user = context.get(userContext);   // User | null — the context's declared type
  if (!user) throw new Error('accountLoader ran without authMiddleware');   // a wiring bug, not a user error — and it narrows to User
  return { user };
}

export function AccountLayout() {
  const { user } = useLoaderData<typeof accountLoader>();   // user: User, not User | null — the throw above did that
  // …
  <Card.Header className="fw-semibold text-capitalize">{user.firstName} · {user.role}</Card.Header>
```

Open `ProfilePage.tsx` and `CartsPage.tsx` — already written. Both read
`context.get(userContext)` in their loaders. `CartsPage` then fetches that
user's carts. Neither calls `/auth/me`.

**C. `src/router.tsx` — `TODO(lab-4.3)`**

```tsx
import { AccountLayout, accountLoader } from './routes/account/AccountLayout';
import { ProfilePage, profileLoader } from './routes/account/ProfilePage';
import { CartsPage, cartsLoader } from './routes/account/CartsPage';
import { TeamPage, teamLoader } from './routes/account/TeamPage';
import { authMiddleware, requireRole } from './routes/middleware';
// …
{
  path: 'account',
  Component: AccountLayout,
  loader: accountLoader,
  middleware: [authMiddleware],          // ← protects EVERYTHING below
  children: [
    { index: true, Component: ProfilePage, loader: profileLoader },
    { path: 'carts', Component: CartsPage, loader: cartsLoader },
    { path: 'team', Component: TeamPage, loader: teamLoader, middleware: [requireRole('admin')] },
  ],
},
```

Read the chain for `/account/team`: `authMiddleware` → `requireRole('admin')`
→ `teamLoader`. Each can stop the navigation by throwing.

### Verify

Signed out, click **Account** (or type `/account/carts`). You land on
`/login?redirectTo=%2Faccount%2Fcarts` with a message saying why. Sign in as
`emilys` — **straight to `/account/carts`**, not the home page. Emily's carts.

Sign out. Paste `/account/team` into the address bar — bounced, `redirectTo`
preserved. Sign in — the team page.

Now the refresh flow with real UI: on **Profile**, click **Who am I?** —
one request. Wait ~70 s. Click again — **three** requests in the Network tab
(401 → refresh → 200) and the same answer on screen.

Then let it die: in DevTools → Application → Local Storage, delete
`shopscope.refreshToken`. Wait for expiry, click **Who am I?** — 401, refresh
fails (400), tokens cleared, and the header flips to **Sign in** without a
reload. That's `AUTH_CHANGED` → `useRevalidator`.

### Watch out

**`if (!user) return <Navigate to="/login" />`** in `AccountLayout`. Works, but
the loaders already ran and 401'd. Middleware runs *first*.

**`import { createContext } from 'react'`** in `middleware.ts`. Wrong
`createContext`; `context.set` throws. It's React Router's.

**Forgetting `loader: accountLoader`.** `useLoaderData()` is `undefined` and
the header crashes on `user.firstName`.

### Challenge (2 min)

`authMiddleware` redirects with `redirectTo=<path+search>`. What should it do
for a **POST** (an action) when the session has expired mid-form? A redirect
loses the submission. Is there a better answer?

### In the real world

Middleware is new in v8 (always-on — it was behind a flag in v7), and it
changes how teams think about auth: not "did every page remember the check"
but "which subtree is protected". A new route under `/account` is protected
by *where it lives*. That's the property you want from a security boundary.

---

## Lab 5 — Roles: what you may do (20 min)

### Problem

Authentication is *who you are*. Authorisation is *what you may do*. Right
now any signed-in user — and any signed-out one — can add, edit and delete
products, and `averyp` can see the team page link.

### Concept

**Two halves, both required, neither is the server.**

- **UX half:** don't show doors people can't open. Hide the admin link, hide
  the edit buttons. This stops honest users hitting a wall.
- **Enforcement half:** the route middleware, and the action. This stops
  anyone who types the URL or edits the DOM.

**And neither is security.** Everything in this lab runs in the browser,
where a user can edit your JavaScript. The real enforcement is your API
rejecting the request. What the client-side check buys is a *correct
experience* — the right people see the right things, and the wrong people get
a clear "not allowed" instead of a confusing failure.

### Steps

**A. `src/routes/account/AccountLayout.tsx` — `TODO(lab-5.1)`**

```tsx
const isAdmin = user.role === 'admin';   // user.role is a Role — 'admni' would be a compile error
// …
{isAdmin && <Nav.Link as={NavLink} to="/account/team">Team</Nav.Link>}
```

**B. `src/routes/ProductsPage.tsx` — `TODO(lab-5.2)`**

The UX half:

```tsx
import { useRouteLoaderData } from 'react-router';
import { tokenStore } from '../lib/tokenStore';
import type { rootLoader } from './RootLayout';   // `import type` — we want its TYPE, not to run it
// …in the component:
const rootData = useRouteLoaderData<typeof rootLoader>('root');   // the root loader's data, from any page
const isAdmin = rootData?.user?.role === 'admin';                 // `?.` twice: the route may not have loaded, the user may be null
// …
{isAdmin && <Button size="sm" onClick={() => setParam('new', 1)}>…Add product</Button>}
// …
<ProductGrid
  …
  onEdit={isAdmin ? (product) => setParam('edit', product.id) : undefined}
  onDelete={isAdmin ? setPendingDelete : undefined}
/>
```

`ProductCard` already renders its buttons only when the handlers exist —
that decision from Demo 3 pays off here.

The enforcement half, at the top of `productsAction`:

```ts
// Authorisation at the ACTION, too: hidden buttons are UX, not security.
if (tokenStore.getUser()?.role !== 'admin') {
  throw data({ message: 'Only admins can change the catalogue.' }, { status: 403, statusText: 'Forbidden' });
}
```

**C. `src/routes/RootErrorBoundary.tsx` — `TODO(lab-5.3)`** — a 403 deserves
its own page:

```tsx
if (isRouteErrorResponse(error) && error.status === 403) {
  const body = error.data as { message?: unknown } | null;
  return (
    <Container className="py-5">
      <Alert variant="warning">
        <Alert.Heading>Not allowed</Alert.Heading>
        <p>{typeof body?.message === 'string' ? body.message : "You don't have access to this area."}</p>
        <Link to="/account" className="btn btn-outline-secondary">Back to your account</Link>
      </Alert>
    </Container>
  );
}
```

### Verify

Sign in as **`averyp` / `averyppass`**. No **Add product**, no pencils, no
trash icons. On `/account`, no **Team** link. Type `/account/team` anyway:
`requireRole('admin')` throws and the **Not allowed** page names your role.

Now bypass the UX half: in DevTools, open the modal by adding `?new=1` to the
URL, fill the form, submit. `productsAction` throws 403 → *Only admins can
change the catalogue*. Hidden buttons didn't stop you; the action did.

Sign in as **`emilys`**: everything is back.

### Watch out

**Only hiding the buttons.** `?new=1` opens the form for anyone. The action
check is the lock.

**Reading the role from the login response.** It isn't there. That's why
`login()` fetches `/auth/me` and stores the full user.

**Checking `user.role === 'admin'` in the card.** The card shouldn't know
about roles — it knows about *handlers*. Decide at the page; pass or don't
pass `onEdit`.

### Challenge (2 min)

Add a `moderator` tier that can *edit* but not *delete*. Where does that
decision live — how many files? If it's more than two, the boundary is in the
wrong place.

### In the real world

The sentence to remember: **a hidden link is not access control.** Client-side
authorisation is a UX layer over a server-side decision. Build both halves in
the client so the experience is right — and never let the server assume the
client checked.

---

## Wrap-up — what you can now do

- [x] Store tokens with the trade-offs stated, and signal auth changes to the UI from anywhere
- [x] Attach the token in a request interceptor, skipping the auth endpoints
- [x] Write a 401 handler that retries once, refreshes once for N callers, and can't recurse
- [x] Defend the interceptor order: auth → logging → refresh → normaliser
- [x] Build a login route with `redirectTo`, `safeRedirect`, and returned (not thrown) failures
- [x] Keep the header in sync with a root loader and `useRevalidator`
- [x] Protect a subtree with middleware and share the user through context
- [x] Gate by role in the UI, at the action, and at the route — and say which is which

## Next demo

**Demo 12 — Context & Reducers.** Three "done!" messages built three
different ways, and a profile check tracked with three flags that can
contradict each other: you'll replace the flags with a `useReducer` state
machine, give the app a theme and a toast system through React Context — the
*other* `createContext`, not the router's `userContext` you just used — and
move the wishlist out of Outlet context into a `WishlistProvider` with the
Profiler open, so the cost of that design is measured before Demo 13 swaps it
for a store.

---

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `/auth/me` 401s right after login | The auth interceptor isn't installed, or `getMe` runs before `tokenStore.set`. |
| Every 401 signs you out immediately | Normaliser registered before the refresh handler. Fix the order in `index.ts`. |
| Several `/auth/refresh` calls at once | The `??=` line is missing or `refreshPromise` isn't module-level. |
| Login form disappears on a wrong password | The action threw. Return the error. |
| Land on `/account` instead of where you were going | `redirectTo` isn't in the hidden input, or `safeRedirect` rejected it. |
| `context.set is not a function` | You imported `createContext` from `react`. It's from `react-router`. |
| `useRouteLoaderData('root')` is `undefined` | The root route has no `id: 'root'` or no `loader`. |
| Header doesn't update after logout | `AUTH_CHANGED` isn't fired, or `RootLayout` doesn't subscribe with `useRevalidator`. |
| `averyp` can still open the form via `?new=1` | Expected until the action check exists. Add the 403 throw. |
| `'user' is possibly 'null'` in `AccountLayout` | `accountLoader` returned `context.get(userContext)` without the null check. Throw on null — that's what narrows it. |
| `Property '_retry' does not exist on type 'InternalAxiosRequestConfig'` | The module augmentation in `src/types/axios.d.ts` (Demo 6) is missing or not picked up by `tsconfig`. |
| `Type '{ to: string; … }' is not assignable …` on the Sign in button | `<Button as={Link}>` doesn't type-check. `<Link to="/login" className="btn btn-light btn-sm">`. |
