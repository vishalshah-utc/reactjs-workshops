# Module 13 — Data Fetching & Custom Hooks

**Study notes** · ~3 hours

> **Goal.** Custom hooks are how you share stateful logic without sharing
> state. Data fetching is the case where hand-rolling stops being viable — so
> this module builds `useFetch` properly, then takes an honest look at
> everything it still gets wrong, which is exactly the feature list of the
> library you should be using.

**Prerequisites:** [Module 12](../12-effects/) in full.
[Module 7 §3](../07-state-and-events/#3-the-rules-of-hooks-and-why-they-exist)
(Rules of Hooks).

---

## Contents

1. [What a custom hook is](#1-what-a-custom-hook-is)
2. [Hooks share logic, not state](#2-hooks-share-logic-not-state)
3. [Naming and design](#3-naming-and-design)
4. [The hooks you will write in your first month](#4-the-hooks-you-will-write-in-your-first-month)
5. [Building `useFetch` properly](#5-building-usefetch-properly)
6. [Everything `useFetch` still gets wrong](#6-everything-usefetch-still-gets-wrong)
7. [Server state is not client state](#7-server-state-is-not-client-state)
8. [TanStack Query](#8-tanstack-query)
9. [Mutations and invalidation](#9-mutations-and-invalidation)
10. [Optimistic updates](#10-optimistic-updates)
11. [Suspense-based fetching and `use`](#11-suspense-based-fetching-and-use)
12. [Framework data loading](#12-framework-data-loading)
13. [The API layer](#13-the-api-layer)
14. [Choosing an approach](#14-choosing-an-approach)
15. [Self-check](#15-self-check)
16. [References](#16-references)

---

## 1. What a custom hook is

A function whose name starts with `use` and that calls other hooks. There is no
registration, no special syntax, no API — the naming convention is the whole
mechanism.

```jsx
function useToggle(initial = false) {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue((v) => !v), []);
  return [value, toggle, setValue];
}
```

```jsx
const [isOpen, toggleOpen] = useToggle();
```

The `use` prefix matters for two real reasons: the linter uses it to apply the
Rules of Hooks, and React uses it to know a function may call hooks. A function
called `getToggle` that calls `useState` will not be checked, and will break in
confusing ways.

Extract a custom hook when a component's body contains logic that is (a)
repeated elsewhere, (b) conceptually separate from rendering, or (c) long
enough to obscure what the component renders.

📖 [react.dev — Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)

---

## 2. Hooks share logic, not state

The most important property, and the one people get wrong:

```jsx
function SearchA() {
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 300);      // its own state
}

function SearchB() {
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 300);      // a DIFFERENT state
}
```

Each call to a custom hook gets its own independent state, exactly as if you
had written the `useState` inline. A hook is a **recipe**, not a store.

```jsx
// ✗ this does NOT share a cart between components
function useCart() {
  const [items, setItems] = useState([]);
  return { items, setItems };
}
```

Two components calling that get two carts. Sharing requires lifting state up
([Module 8 §11](../08-state-structure/#11-lifting-state-up)), Context
([Module 9](../09-reducers-and-context/)), or an external store — the hook is
then how you *read* the shared thing, not what makes it shared.

---

## 3. Naming and design

**Name it after what it does, not how.**

```jsx
useOnlineStatus()      // ✓ says what you get
useEventListener()     // ✓
useMediaQuery()        // ✓

useEffectWrapper()     // ✗ names the mechanism
useStateAndEffect()    // ✗
useData()              // ✗ says nothing
```

**Return shape:** an array when the names are the caller's to choose (mirroring
`useState`), an object when there are more than two or three values and
position would be unmemorable.

```jsx
const [value, setValue] = useLocalStorage('key', 0);       // array — 2 items
const { data, status, error, refetch } = useProducts(q);   // object — 4 items
```

**Keep them focused.** A hook that fetches, debounces, persists and subscribes
is four hooks. The composition is the point:

```jsx
function useProductSearch(query) {
  const debounced = useDebounce(query, 300);      // one job
  return useProducts({ q: debounced });           // another
}
```

**A custom hook may return JSX**, but if it mostly returns JSX it wanted to be
a component.

---

## 4. The hooks you will write in your first month

```jsx
// ── useToggle ──────────────────────────────────────────────────────────
function useToggle(initial = false) {
  const [value, setValue] = useState(initial);
  return [value, useCallback(() => setValue((v) => !v), []), setValue];
}

// ── useDebounce ────────────────────────────────────────────────────────
function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);       // ← the whole hook is this line
  }, [value, delay]);

  return debounced;
}

// ── useLocalStorage ────────────────────────────────────────────────────
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {         // lazy — reads once
    try {
      const stored = localStorage.getItem(key);
      return stored === null ? initialValue : JSON.parse(stored);
    } catch { return initialValue; }                 // private mode, bad JSON
  });

  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
  }, [key, value]);

  useEffect(() => {                                  // other tabs
    function onStorage(e) {
      if (e.key === key && e.newValue !== null) setValue(JSON.parse(e.newValue));
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key]);

  return [value, setValue];
}

// ── usePrevious ────────────────────────────────────────────────────────
function usePrevious(value) {
  const ref = useRef(undefined);
  useEffect(() => { ref.current = value; }, [value]);
  return ref.current;
}

// ── useMediaQuery ──────────────────────────────────────────────────────
function useMediaQuery(query) {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', cb);
      return () => mql.removeEventListener('change', cb);
    },
    () => window.matchMedia(query).matches,
    () => false,                                     // SSR snapshot
  );
}

// ── useEventListener ───────────────────────────────────────────────────
function useEventListener(target, type, handler) {
  const savedHandler = useRef(handler);
  useEffect(() => { savedHandler.current = handler; }, [handler]);

  useEffect(() => {
    const node = target?.current ?? target;
    if (!node?.addEventListener) return;
    const listener = (e) => savedHandler.current(e);
    node.addEventListener(type, listener);
    return () => node.removeEventListener(type, listener);
  }, [target, type]);          // ← handler is NOT a dep, thanks to the ref
}

// ── useOnClickOutside ──────────────────────────────────────────────────
function useOnClickOutside(ref, handler) {
  useEventListener(document, 'pointerdown', (event) => {
    if (ref.current && !ref.current.contains(event.target)) handler(event);
  });
}
```

Two details worth noticing, because they are the same idea twice.
`useLocalStorage` uses a **lazy initialiser** so it reads storage once rather
than on every render
([Module 7 §14](../07-state-and-events/#14-lazy-initial-state)).
`useEventListener` stores the handler in a **ref** so a fresh inline arrow does
not tear down and rebuild the listener every render — which is what
`useEffectEvent` exists to replace
([Module 12 §10](../12-effects/#10-separating-events-from-effects)).

---

## 5. Building `useFetch` properly

Everything from [Module 12 §11](../12-effects/#11-data-fetching-in-an-effect),
assembled:

```jsx
function useFetch(url, options) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => setReloadToken((n) => n + 1), []);

  // Serialise, or an options object literal re-fetches on every render.
  const optionsKey = JSON.stringify(options ?? {});

  useEffect(() => {
    if (!url) return;

    const controller = new AbortController();
    setState((s) => ({ ...s, status: 'loading' }));

    fetch(url, { ...JSON.parse(optionsKey), signal: controller.signal })
      .then(async (response) => {
        // fetch does NOT reject on 404/500 — you must check.
        if (!response.ok) throw new ApiError(response.status, await safeMessage(response));
        return response.json();
      })
      .then((data) => setState({ status: 'success', data, error: null }))
      .catch((error) => {
        if (error.name === 'AbortError') return;    // expected, not a failure
        setState({ status: 'error', data: null, error });
      });

    return () => controller.abort();
  }, [url, optionsKey, reloadToken]);

  return { ...state, refetch };
}
```

Everything here is deliberate:

| Detail | Why |
|---|---|
| A `status` union, not booleans | Four mutually exclusive states ([Module 8 §7.2](../08-state-structure/#7-choosing-the-state-structure-five-principles)) |
| `JSON.stringify(options)` | Object identity would re-fetch forever |
| `AbortController` + cleanup | Kills the race condition |
| Swallowing `AbortError` | Otherwise a red banner on every keystroke |
| Checking `response.ok` | `fetch` resolves on 404 and 500 |
| `reloadToken` for `refetch` | A stable way to re-run the effect |

This is a correct hook. Write it once so you understand what you are buying
later.

---

## 6. Everything `useFetch` still gets wrong

Now the honest list. None of these is a bug in the code above — they are things
it structurally cannot do:

| Missing | What the user experiences |
|---|---|
| **No cache** | Navigate away and back → full spinner again, for data you had two seconds ago |
| **No deduplication** | Three components asking for the same user → three identical requests |
| **No shared state** | Those three components each hold their own copy, which can disagree |
| **Refetch shows a spinner** | Any revalidation blanks the screen instead of showing stale data |
| **No retry** | One flaky response and the user sees an error with only a manual retry |
| **No revalidation** | Data is silently stale after the tab has been open for an hour |
| **No refetch on focus/reconnect** | Come back to the tab and see yesterday's numbers |
| **No pagination or infinite scroll support** | You write and re-write it per screen |
| **No prefetching** | Every navigation starts from zero |
| **No mutation story** | After a POST you must manually work out what to refetch |
| **Two renders per fetch** | `setState` in an effect costs an extra pass |
| **Fetches after the bundle loads** | HTML → JS → API waterfall ([Module 3 §1](../03-rendering-architectures/#1-client-side-rendering-csr)) |

Every one of those is a feature of TanStack Query. That is the argument, and it
is worth seeing as a list rather than a claim.

---

## 7. Server state is not client state

The conceptual reason a separate tool exists.

| | Client state | Server state |
|---|---|---|
| Owned by | your app | someone else's database |
| Who can change it | only you | anyone, at any time |
| Goes stale | never | constantly |
| Needs caching | no | yes |
| Can fail to load | no | yes |
| Shared between components | via lifting/context | should be shared by identity |
| Correct model | a value | **a cache of a remote value** |

`useState` is a perfectly good tool for a value you own. It is the wrong tool
for a *cache*, and every hand-rolled fetching hook is an attempt to build a
cache out of a value.

Once you accept that server data is a cache, the questions change: how stale is
acceptable, when do we revalidate, who else is showing this, what happens when
it fails. Those are exactly the questions a query library answers with
configuration instead of code.

---

## 8. TanStack Query

```jsx
import { useQuery } from '@tanstack/react-query';

function ProductList({ category }) {
  const { data, isPending, isError, error, isFetching } = useQuery({
    queryKey: ['products', { category }],
    queryFn: ({ signal }) => getProducts({ category }, signal),
    staleTime: 60_000,
  });

  if (isPending) return <GridSkeleton />;
  if (isError) return <ErrorState error={error} />;

  return (
    <>
      {isFetching && <RefreshingIndicator />}   {/* stale data still on screen */}
      <ProductGrid products={data} />
    </>
  );
}
```

### The query key is the whole idea

`queryKey` identifies the data. Two components with the same key share one
cache entry and one request. Change the key and it is a different query.

```jsx
['products']                          // all products
['products', { category: 'audio' }]   // a filtered list
['product', slug]                     // one product
```

This is the same `JSON.stringify(query)` idea from §5, promoted to a first-class
concept — which is why writing the manual version first makes the library
obvious rather than magical.

### `staleTime` vs `gcTime`

The two settings people confuse:

- **`staleTime`** — how long data is considered *fresh*. While fresh, no
  refetch happens at all. Default `0`: every mount revalidates.
- **`gcTime`** — how long *unused* data stays in memory before being discarded.
  Default 5 minutes.

```jsx
staleTime: 0            // always revalidate on mount (live inventory)
staleTime: 60_000       // fine for a minute (a product list)
staleTime: Infinity     // never refetches (a country list)
```

Setting a sensible `staleTime` is the single highest-impact configuration
change most teams make.

### What you get for free

Cache, deduplication, background revalidation, refetch on window focus and
network reconnect, retry with exponential backoff, `isFetching` separate from
`isPending` (so you can keep stale data on screen), request cancellation via
the passed `signal`, and devtools that show every query's state.

---

## 9. Mutations and invalidation

```jsx
import { useMutation, useQueryClient } from '@tanstack/react-query';

function AddToCartButton({ product }) {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (productId) => postCartItem(productId),
    onSuccess: () => {
      // "this data is now wrong" — refetch what is on screen, drop the rest
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  return (
    <button onClick={() => mutate(product.id)} disabled={isPending}>
      {isPending ? 'Adding…' : 'Add to cart'}
    </button>
  );
}
```

**Invalidation is the mental model.** You do not manually refetch; you mark
data stale and let the library decide what is actually being displayed and
therefore worth re-requesting. That is the thing hand-rolled fetching cannot do
at all, because it has no idea what else is mounted.

---

## 10. Optimistic updates

```jsx
const { mutate } = useMutation({
  mutationFn: updateQuantity,

  onMutate: async (next) => {
    await queryClient.cancelQueries({ queryKey: ['cart'] });   // stop a race
    const previous = queryClient.getQueryData(['cart']);       // snapshot
    queryClient.setQueryData(['cart'], (old) => applyChange(old, next));
    return { previous };                                        // → context
  },

  onError: (err, next, context) => {
    queryClient.setQueryData(['cart'], context.previous);       // roll back
  },

  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['cart'] });      // reconcile
  },
});
```

The four callbacks map exactly to the four things optimistic updates must do:
cancel in-flight reads, snapshot for rollback, apply the guess, and reconcile
with the truth. Hand-rolled versions usually implement the third and forget the
other three.

React 19's `useOptimistic` ([Module 10 §12](../10-forms/#12-useoptimistic))
covers the simpler cases within a form Action.

---

## 11. Suspense-based fetching and `use`

React 19's `use` reads a promise during render, and suspends until it resolves:

```jsx
function ProductDetail({ productPromise }) {
  const product = use(productPromise);      // suspends here
  return <h1>{product.name}</h1>;
}

<Suspense fallback={<Skeleton />}>
  <ProductDetail productPromise={fetchProduct(slug)} />
</Suspense>
```

The loading state moves out of the component and into a `<Suspense>` boundary,
so there is no `isPending` branch at all.

**Two things to be careful about.** `use` may be called conditionally (unlike
other hooks), which is deliberate. And the promise must **not** be created
during render of the component that consumes it — that creates a new promise
every render and loops forever. It must come from a cache, a framework loader,
or a parent Server Component.

In practice you meet `use` through a framework or through TanStack Query's
`useSuspenseQuery`, not by wiring promises by hand.

📖 [react.dev — `use`](https://react.dev/reference/react/use) ·
[`Suspense`](https://react.dev/reference/react/Suspense)

---

## 12. Framework data loading

The best answer is often to not fetch on the client at all.

**Server Components** fetch on the server during render, ship no JavaScript,
and have no loading state to manage:

```jsx
export default async function ProductPage({ params }) {
  const product = await db.product.findUnique({ where: { slug: params.slug } });
  return <ProductDetail product={product} />;
}
```

**Route loaders** (React Router, Remix) fetch before the route renders, which
removes the render-then-fetch waterfall:

```jsx
{ path: 'products/:slug', element: <ProductPage />, loader: ({ params }) => getProduct(params.slug) }
```

Both eliminate the entire category of problem this module has been solving.
That is the real reason react.dev recommends starting with a framework
([Module 2 §12](../02-react-introduction/#12-option-3--full-stack-frameworks-nextjs-remix-react-router-v7)),
and it is developed in [Module 19](../19-server-components/).

---

## 13. The API layer

Whatever fetches, one module should own *how* you talk to the server:

```ts
const BASE = '/api';

export class ApiError extends Error {
  constructor(status, code, message, fieldErrors) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

async function request(path, init) {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(response.status, body?.error?.code ?? 'UNKNOWN',
                       body?.error?.message ?? `Request failed with ${response.status}`,
                       body?.error?.fieldErrors);
  }
  if (response.status === 204) return undefined;
  return response.json();
}

export const getProducts = (query, signal) => request(`/products${toParams(query)}`, { signal });
export const getProduct  = (slug, signal)  => request(`/products/${slug}`, { signal });
export const postCartItem = (id) => request('/cart/items', { method: 'POST', body: JSON.stringify({ id }) });
```

Four things this buys you, and each pays off in a later module: one place to
add the auth header, one place to normalise errors, one place to change when
the URL shape changes, and components that can be tested without a network.

**A component that calls `fetch` directly is a component you cannot test
without a network and cannot reuse anywhere else.**

---

## 14. Choosing an approach

```
Are you in a framework with Server Components or loaders?
├─ YES → use them. No client fetching, no loading state, no waterfall.
└─ NO
   │
   Is this server data that is cached, shared or revalidated?
   ├─ YES → TanStack Query (or SWR)
   └─ NO — a one-off, in one component, never revalidated
      └─ an effect is fine. Write it correctly (Module 12 §11).
```

| Approach | Use when |
|---|---|
| Server Component / loader | You have a framework. The default. |
| TanStack Query | A client SPA with real server state |
| SWR | Same, lighter, fewer features |
| `useEffect` + `fetch` | One-off, or you are learning what the above do |
| `use` + Suspense | Through a framework or library, not by hand |

**Do not hand-roll a cache.** The moment you find yourself adding a `Map` of
promises to a `useFetch`, you are three weeks from a worse TanStack Query.

---

## 15. Self-check

1. What makes a function a custom hook? What does the `use` prefix actually
   affect?
2. Two components call `useCounter()`. Do they share a count? Explain in terms
   of what a hook is.
3. How would you make them share it? Give three options.
4. Give three badly-named hooks and rename them.
5. When should a hook return an array, and when an object?
6. In `useLocalStorage`, why is the initialiser a function? What breaks
   otherwise?
7. In `useEventListener`, why is `handler` stored in a ref instead of listed as
   a dependency? Which React feature replaces that trick?
8. In `useFetch`, why `JSON.stringify(options)` rather than `options`?
9. Why must `AbortError` be swallowed?
10. Why does `useFetch` check `response.ok`?
11. List eight things `useFetch` cannot do that a query library does.
12. Give four ways server state differs from client state.
13. Why is "a cache of a remote value" a more useful model than "a value"?
14. What does `queryKey` do, and what is its manual equivalent from §5?
15. `staleTime` vs `gcTime` — define both and give a value for each of: live
    inventory, a product list, a country list.
16. Why does keeping `isFetching` separate from `isPending` matter to a user?
17. What is invalidation, and why can a hand-rolled hook not do it?
18. Name the four things an optimistic update must do, and the callback for
    each.
19. What must you never do with a promise passed to `use`?
20. Name two things a Server Component or route loader removes entirely.
21. Give four reasons for a single API module.
22. Walk the decision tree for: an internal SPA dashboard · a Next.js product
    page · a one-off config fetch on mount.

### Practical

1. Extract three near-identical fetching components into one `useFetch`. Then
   write down five things it does worse than a library.
2. Write `useDebounce` and build search-as-you-type with no wasted requests.
3. Rebuild the same screen with TanStack Query. Compare: navigating away and
   back, two components needing the same data, refocusing the tab, and a failed
   request.
4. Add a mutation with invalidation, then make it optimistic with rollback and
   force the server to fail.
5. Write `useMediaQuery` with `useSyncExternalStore` and explain what it
   prevents that an effect would not.

---

## 16. References

Official React documentation only.

**Custom hooks**
- [Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)
- [Escape Hatches](https://react.dev/learn/escape-hatches)

**Fetching**
- [Synchronizing with Effects: Fetching data](https://react.dev/learn/synchronizing-with-effects#fetching-data)
- [What are good alternatives to data fetching in Effects?](https://react.dev/learn/synchronizing-with-effects#what-are-good-alternatives-to-data-fetching-in-effects)
- [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
- [Removing Effect Dependencies](https://react.dev/learn/removing-effect-dependencies)

**Reference**
- [`use`](https://react.dev/reference/react/use)
- [`Suspense`](https://react.dev/reference/react/Suspense)
- [`useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore)
- [`useOptimistic`](https://react.dev/reference/react/useOptimistic)
- [`useCallback`](https://react.dev/reference/react/useCallback)

**Where fetching moves next**
- [Server Components](https://react.dev/reference/rsc/server-components)
- [Creating a React App](https://react.dev/learn/creating-a-react-app)

---

**Previous:** [Module 12 — Effects & Synchronisation](../12-effects/)
**Next:** [Module 14 — Routing & Application Architecture](../14-routing/)
