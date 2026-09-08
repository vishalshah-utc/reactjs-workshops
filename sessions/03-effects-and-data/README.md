# Session 3 — Effects, the Network & Custom Hooks

**Participant guide** · 2 hours · the app talks to a real server

---

## What you ship today

Products come from an actual API. Search hits the server, debounced. Loading
shows skeletons, failures show a retry, and "no results" says something
different from "it broke". Your cart survives a reload. And four reusable hooks
you will keep using for the rest of the series.

By the end you will be able to answer:

- Why `fetch` does **not** throw on a 404
- What an effect's cleanup function is for, and the three things that break without it
- Why `useEffect(..., [someObject])` is an infinite loop
- What a race condition looks like in a search box, and how `AbortController` ends it
- Why React runs your effect twice in development, and why that is a feature
- When a `useEffect` in a component should become a hook of its own

---

## Before the session (20 minutes)

1. **Open the starter and let it install.** It is bigger than last week — it
   now contains the whole backend.

   ```
   https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/sessions/03-effects-and-data/starter
   ```

   > ⚠️ **Click once, then bookmark the tab.** Every `/fork/` click gives you a
   > fresh copy, not your earlier work. Nothing is created on GitHub.

   You should see **two** processes start:

   ```
   [api]   ShopCrew API · http://localhost:4000
   [web]   VITE ready · http://localhost:5173
   ```

2. **Read [CHEATSHEET.md](./CHEATSHEET.md).**

3. **Bring your sketch.** Last week asked what the grid should show for
   **loading**, **error** and **empty** — and what the difference is between
   "no results for your search" and "the request failed". We open with it.

**Missed a session?** This starter contains everything from 1 and 2.

---

## The backend arrives

`server/` in your project is the **ShopCrew API** — 5,000 products, 12,000
orders, real search and filtering. It boots alongside Vite from one `npm run
dev`.

You never call `http://localhost:4000` directly. Vite **proxies** `/api` to it
(see `vite.config.ts`), so to the browser it is all one origin: no CORS, no
hostname in your code, and the same `fetch('/api/products')` works in
production behind nginx. Session 10 sets that part up.

### The teaching hooks — you will use these all session

The API can be told to misbehave on demand. This is the whole reason we run a
real server instead of a mock.

| Add to any `/api` URL | Effect |
|---|---|
| `?_delay=2000` | responds after 2 seconds |
| `?_fail=500` | forces a server error |
| `?_fail=422` | forces a validation error with per-field messages |
| `/api/flaky?rate=0.4` | fails about 40% of the time |

Try it now, before the session:

```
http://localhost:5173/api/products?limit=2&_delay=3000
http://localhost:5173/api/products?_fail=500
```

---

## Lab 1 — The four states of async (22 min)

### Problem

The grid works. Now make the network slow:

```
http://localhost:5173/?_delay=3000
```

Three seconds of **nothing**. No spinner, no skeleton, no hint that anything is
happening. Then products appear.

Now break it — `?_fail=500` — and search for something that does not exist.
Both give you the same blank area. A user cannot tell whether the site is
broken, still thinking, or genuinely has nothing for them.

### Concept

**Every async read has four possible states, not two.**

| State | Means | Should show |
|---|---|---|
| `loading` | the request is in flight | a skeleton shaped like the content |
| `error` | it failed | what went wrong, and a way to retry |
| `empty` | it succeeded, and there is nothing | why, and a way to widen the search |
| `success` | data | the data |

The usual mistake is a boolean:

```tsx
const [loading, setLoading] = useState(true);
const [data, setData] = useState([]);
const [error, setError] = useState(null);
```

Three booleans-ish values give **eight** combinations, of which four are
nonsense — `loading && error` should be impossible, but nothing stops it. And
every call site ends up writing:

```tsx
if (!loading && !error && data.length === 0) return <Empty />;   // fragile
```

One `status` makes them mutually exclusive by construction:

```tsx
type AsyncStatus = 'loading' | 'error' | 'empty' | 'success';
```

**Error and empty are not the same thing, and this matters more than it
sounds.** A failed request is *our* fault and needs a retry button. A search
with no matches is a completely successful answer and needs a way to broaden
the search. Show one message for both and the user cannot tell whether to try
again or try something else.

**And `fetch` does not throw on HTTP errors.**

```js
const response = await fetch('/api/products?_fail=500');
// no exception. response.ok === false, response.status === 500
```

A promise from `fetch` rejects only when the request could not be made at all —
offline, DNS failure, CORS. A 500 is a perfectly successful HTTP round trip. If
you forget `if (!response.ok)`, you will happily hand an error body to your
rendering code as if it were data. That check lives in `src/lib/api.ts`; read it.

### Steps

**A. Read `src/lib/api.ts`.** Two minutes. It is the only place in the app that
knows the API exists. Note `request()` checking `response.ok`, and `ApiError`
carrying the status and any `fieldErrors` — Session 7 uses those.

**B. `src/hooks/useProducts.ts` — `TODO(lab-1.1)`.** Right now every successful
response is `'success'`, even an empty one. One line:

```tsx
setStatus(response.data.length === 0 ? 'empty' : 'success');
```

**C. `src/components/ProductBoard.tsx` — `TODO(lab-1.2)`.** The starter
collapses `error` and `empty` into one branch. Split them.

```tsx
{status === 'error' && <ErrorState error={error} onRetry={onRetry} isOnline={isOnline} />}

{status === 'empty' && (
  <EmptyState
    icon={<SearchXIcon className="text-muted-foreground size-8" />}
    title={isFiltered ? 'No products match those filters' : 'No products yet'}
    description={
      isFiltered
        ? 'Try a broader search, or clear the filters to see everything.'
        : 'The catalogue is empty.'
    }
    action={isFiltered ? <Button variant="outline" size="sm" onClick={onResetFilters}>Clear filters</Button> : undefined}
  />
)}
```

Add three props — `isFiltered: boolean`, `isOnline: boolean`,
`onResetFilters: () => void` — and pass them from `App.tsx`:

```tsx
isFiltered={isFiltered(filters)}
isOnline={isOnline}
onResetFilters={() => setFilters(defaultFilters)}
```

You will need `import { isFiltered } from '@/lib/filters';` and
`import { SearchXIcon } from 'lucide-react';`.

**D. Read `ErrorState` and `EmptyState`.** They are written for you, and what
they add over a bare `<p>` is the point:

- `role="alert"` on the error — the one place interrupting a screen reader is
  right, because the content they were waiting for is not coming
- the HTTP status shown, so a bug report has something in it
- an offline variant, because "check your connection" beats "HTTP 0"
- a skeleton shaped like the grid, so the page does not jump when data lands

### Verify

Prove all four, deliberately:

| URL | Should show |
|---|---|
| `/?_delay=3000` | skeleton cards for 3 seconds |
| `/?_fail=500` | error state, "HTTP 500", Try again |
| normal, search `zzzz` | empty state, "No products match", Clear filters |
| normal | 24 products |

Then turn wifi off and reload: the offline banner and the offline error.

### Watch out

**Skeleton, not spinner.** A skeleton the shape of the content stops the page
jumping when data lands. That jump has a name and a score — Cumulative Layout
Shift — and Session 10 measures it.

**Do not show "empty" while loading.** The status starts as `'loading'`, not
`'empty'`, for exactly this reason. Flashing "no results" for 400ms makes a
working app feel broken.

**`aria-live="polite"`** on the region, so a screen reader is told the grid
changed without being interrupted mid-sentence.

### Challenge (2 min)

`ErrorState` treats every failure the same. A 404 and a 503 deserve different
words — one is "that does not exist", the other is "try again shortly".
`error instanceof ApiError` gives you `error.status`.

---

## Lab 2 — Dependencies, cleanup, and StrictMode (22 min)

### Problem

Open the network tab and type "laptop" in the search box, slowly.

**Six requests.** One per keystroke. On a real product that is six times the
server load for one search, and the first five results are thrown away.

Worse is waiting for you in `useProducts`. Look at its dependency array:
`[query, reloadToken]`. Open the network tab and just *sit there*.

### Concept

**An effect re-runs when a dependency changes — compared with `Object.is`.**

That is the same reference comparison from Session 1, and it has the same
consequence:

```tsx
function Parent() {
  const query = { q: 'laptop' };   // NEW OBJECT every render
  useProducts(query);
}
```

`query` is rebuilt on every render, so it is never equal to last time's.
Effect runs → sets state → re-renders → new object → effect runs. **Forever.**

This is the single most common infinite-fetch bug in React. Three ways out:

| Fix | When |
|---|---|
| depend on primitives — `[query.q, query.category]` | few, stable fields |
| serialise — `const key = JSON.stringify(query)` | a whole query object |
| `useMemo` the object in the parent | when you must pass the object itself |

We use the second, and the name is deliberate:

```tsx
const queryKey = JSON.stringify(query);
useEffect(() => {
  const parsed = JSON.parse(queryKey) as ProductQuery;
  …
}, [queryKey, reloadToken]);
```

**Remember `queryKey`.** Session 5 replaces this entire hook with TanStack
Query, whose central idea is exactly a serialisable key identifying a request.

**Cleanup.** An effect may return a function. React runs it before the next
run of that effect, and once more on unmount.

```tsx
useEffect(() => {
  const timer = setTimeout(...);
  return () => clearTimeout(timer);   // ← before next run, and on unmount
}, [value]);
```

Three things leak without it: **timers**, **subscriptions** (event listeners,
WebSockets), and **in-flight requests**. All three are Lab 3 and Lab 4.

**Why your effect runs twice in development.**

`<StrictMode>` deliberately mounts, unmounts and remounts every component. It
is not a bug and it does not happen in production. It exists to make cleanup
bugs *loud*: an effect that subscribes without unsubscribing subscribes twice,
and you notice immediately instead of in six months.

**If double-invoking breaks your effect, your effect has a bug.** Do not remove
StrictMode — it just found something.

### Steps

**A. `src/hooks/useProducts.ts` — `TODO(lab-2.1)`.** Fix the infinite loop:

```tsx
const queryKey = JSON.stringify(query);

useEffect(() => {
  const parsed = JSON.parse(queryKey) as ProductQuery;
  // …use `parsed`, not `query`
}, [queryKey, reloadToken]);
```

Watch the network tab settle.

**B. `src/hooks/useDebounce.ts` — `TODO(lab-2.2)`.** The timer is set and never
cleared, so *every* keystroke's timer fires — six requests, just later.

**First, watch it fail.** Network tab, type "laptop", count the requests.

Then capture the timer and clear it:

```tsx
useEffect(() => {
  const timer = setTimeout(() => setDebounced(value), delay);
  return () => clearTimeout(timer);
}, [value, delay]);
```

Type again. **One request.**

The sequence is worth holding in your head:

```
type 'l'      → set timer A
type 'la'     → cleanup cancels A, set timer B
type 'lap'    → cleanup cancels B, set timer C
(300ms quiet) → C fires
```

**C. `src/App.tsx` — `TODO(lab-2.3)`.** The categories effect has no cleanup.
Look at the network tab on reload: **two** requests to `/api/categories`. That
is StrictMode showing you the missing cleanup.

```tsx
useEffect(() => {
  const controller = new AbortController();
  getCategories(controller.signal)
    .then(...)
    .catch((caught: unknown) => {
      if (caught instanceof DOMException && caught.name === 'AbortError') return;
      setCategories([]);
    });
  return () => controller.abort();
}, []);
```

Now the first request is cancelled rather than resolving into a component that
has already gone.

### Verify

Network tab: typing "laptop" makes **one** request. Sitting idle makes
**none**. Reloading makes **one** cancelled and one live call to `/categories`.

### Watch out

**`useEffect(fn)` with no array runs after every render.** Almost never what
you want. `[]` is mount-only. `[a, b]` is when `a` or `b` changes.

**Do not "fix" a dependency warning by deleting the array.** The lint rule is
telling you the effect reads something it does not track. Deleting the array
makes it run constantly instead.

**Debounce the query, not the input.** `filters.search` must update instantly —
a search box that lags your typing feels broken. Only the value that reaches
the API is debounced. That is why `App` holds two values.

### Challenge (2 min)

`useDebounce` returns the value late. Sometimes you want the opposite —
*throttle*: fire immediately, then at most once every N ms. Write `useThrottle`.
Session 8 needs it for a live event stream.

---

## Lab 3 — Race conditions and AbortController (22 min)

### Problem

Slow the API down so the network behaves like a real one:

```
http://localhost:5173/?_delay=1500
```

Now type `lap`, wait a beat, then finish typing `laptop`.

**The grid shows results for "lap".**

You typed "laptop". The box says "laptop". The results are for something you
finished typing two seconds ago. Nothing errored. Nothing warned.

### Concept

**Responses do not come back in the order you sent the requests.**

There is no rule that says they will. A request can hit a cold cache, get
retried by a proxy, or land on a slower server.

```
t=0ms     type "lap"     → request A sent
t=200ms   type "laptop"  → request B sent
t=400ms   B returns      → setProducts(laptop results)   ✅
t=1500ms  A returns      → setProducts(lap results)      ❌ overwrites!
```

Last-write-wins, and the last write is the *stale* one. **The slower the
network, the more often this happens** — so it works perfectly on your machine
and fails for users on a train.

**`AbortController` is the fix.**

```tsx
useEffect(() => {
  const controller = new AbortController();
  getProducts(query, controller.signal)
    .then(setProducts)
    .catch((e) => {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      setError(e);
    });
  return () => controller.abort();
}, [queryKey]);
```

The cleanup runs **before** the next effect. So the moment the query changes,
the previous request is cancelled — it can never resolve, so it can never
overwrite anything.

**Handling the abort matters as much as causing it.** An aborted request
rejects with an `AbortError`. Treat that as a failure and you flash a red
banner on every keystroke. It is not a failure — it is us cancelling work we no
longer want.

> Debouncing (Lab 2) reduces how often this happens. It does not fix it. Two
> requests can still overlap whenever one is slower than your debounce window.
> **Debounce is an optimisation; cancellation is correctness.**

### Steps

**A. Reproduce it deliberately.** Load `/?_delay=1500`, type `lap`, pause, type
`top`. Watch the grid land on the wrong results. Do this before you fix it —
you want to recognise the shape of this bug when it appears in your own work.

**B. `src/hooks/useProducts.ts` — `TODO(lab-3.1)`.** Add the controller:

```tsx
useEffect(() => {
  const parsed = JSON.parse(queryKey) as ProductQuery;
  const controller = new AbortController();

  setStatus('loading');
  setError(null);

  getProducts(parsed, controller.signal)
    .then((response) => {
      setProducts(response.data);
      setTotal(response.meta.total);
      setStatus(response.data.length === 0 ? 'empty' : 'success');
    })
    .catch((caught: unknown) => {
      if (caught instanceof DOMException && caught.name === 'AbortError') return;
      setError(caught instanceof Error ? caught : new Error('Something went wrong'));
      setStatus('error');
    });

  return () => controller.abort();
}, [queryKey, reloadToken]);
```

**C. Prove it.** Same sequence. The network tab now shows the earlier request
**cancelled** (red, "canceled"). The grid shows "laptop".

### Verify

With `_delay=1500`: type a long word quickly, then delete back to three
letters. Every intermediate request is cancelled and the grid always matches
the box. Turn the delay off and it should still behave.

### Watch out

**An `AbortError` is not an error.** Miss the guard and every keystroke flashes
the error state.

**One controller per effect run.** Create it *inside* the effect. Hoist it
outside and you will abort the wrong request.

**`signal` has to reach `fetch`.** Creating a controller and never passing its
signal does nothing at all — and looks completely fine.

### Challenge (2 min)

There is a second way to solve this: an "is this still the latest?" flag —
`let cancelled = false` in the effect, `cancelled = true` in the cleanup, and a
check before every `setState`. Write it. Then argue which is better.

> `AbortController` genuinely cancels the network request; the flag just
> ignores the answer. On a slow connection that is real bandwidth. But the flag
> works for any promise, not just `fetch`.

### In the real world

This is one of the most common bugs in production React, and it is nearly
invisible during development because localhost is too fast. It shows up as
"sometimes the wrong data appears" — the kind of bug report nobody can
reproduce. If you take one thing from today, take this.

---

## Lab 4 — Custom hooks (22 min)

### Problem

Your cart still empties on every reload. And the offline banner never appears,
because `useOnlineStatus` reads `navigator.onLine` once and never again.

More broadly: `App.tsx` is filling up with effects that have nothing to do with
this particular screen.

### Concept

**A custom hook is a function whose name starts with `use` and which calls
other hooks.** That is the whole definition. No API, no registration.

What it buys you:

- **Naming.** `useDebounce(search, 300)` says what it does. Eleven lines of
  `setTimeout` inside a component do not.
- **Reuse of behaviour, not markup.** Components reuse JSX; hooks reuse logic.
- **Testability.** A hook can be tested without rendering the screen it serves.
- **A boundary.** Everything about localStorage lives in one file, so when the
  quota rules change you edit one place.

**State is not shared between components.** Two components calling
`useDebounce` get two independent timers. A hook shares *logic*, never *state* —
that is Session 8's problem.

**The rules of hooks, and the actual reason for them:**

1. Only call hooks at the top level — never in a condition, loop or nested function.
2. Only call them from components or other hooks.

React tracks hooks **by call order**, not by name. First `useState` is slot 0,
second is slot 1. Wrap one in an `if` and the slots shift between renders, and
React hands you another hook's state. The lint rule catches it; the reason is
worth knowing.

### Steps

**A. `src/hooks/useLocalStorage.ts` — `TODO(lab-4.1)`.**

```tsx
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored === null ? initialValue : (JSON.parse(stored) as T);
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch { /* quota, or private mode */ }
  }, [key, value]);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key !== key || event.newValue === null) return;
      try { setValue(JSON.parse(event.newValue) as T); } catch { /* corrupt */ }
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [key]);

  const clear = useCallback(() => {
    try { window.localStorage.removeItem(key); } catch { /* ignore */ }
    setValue(initialValue);
  }, [key, initialValue]);

  return [value, setValue, clear] as const;
}
```

Three things worth pausing on:

- **The lazy initialiser.** `useState(() => read())` runs once. Written
  `useState(read())` it reads and parses on **every** render and discards the
  result every time but the first.
- **try/catch everywhere.** localStorage throws in Safari private mode, on
  quota, and on corrupt JSON. A storage helper that crashes the app is worse
  than no storage.
- **The `storage` event** fires in *other* tabs, never the one that wrote. Open
  two tabs and add to the cart in one — the other follows. Session 6 uses
  exactly this to log you out everywhere.

**B. `src/hooks/useOnlineStatus.ts` — `TODO(lab-4.2)`.** The textbook
subscribe-and-clean-up:

```tsx
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return isOnline;
}
```

**The cleanup must remove both listeners.** Skip it and every mount leaks a
listener that calls `setState` on a component that no longer exists. StrictMode
doubles it immediately, which is the point of StrictMode.

**C. Check the cart persists.** `App` already wires `useLocalStorage` into the
reducer's initial state, with an effect writing every change back. Add
something, reload, and it is still there.

Notice the shape: the **reducer stays pure** and knows nothing about storage.
Persistence is composed around it. A reducer that wrote to localStorage would
be impure and untestable — and StrictMode would call it twice.

### Verify

Add to cart, reload — still there. Open a second tab, add in one, watch the
other follow. Turn wifi off — banner appears; on — it goes.

### Watch out

**`useState(read())` instead of `useState(() => read())`.** Works, but reads
storage on every render.

**Forgetting the cleanup on listeners.** The leak is invisible until the
component mounts and unmounts a few hundred times.

**Putting side effects in the reducer.** Reducers must be pure. StrictMode will
call yours twice to check.

**`navigator.onLine` is optimistic.** It tells you an interface is up, not that
the internet works. Treat `false` as certain and `true` as a guess.

### Challenge (2 min)

Write `useDocumentTitle(title)` so the tab shows the cart count. One `useEffect`
— and think about whether it needs a cleanup. (It does. What should it restore?)

---

## Wrap-up — what you can now do

- [x] Model async as four states, not a boolean
- [x] Explain why `fetch` does not throw on a 500
- [x] Say what a cleanup function is for and name three things that leak without it
- [x] Recognise `[someObject]` as an infinite loop, and fix it three ways
- [x] Reproduce a race condition, and fix it with `AbortController`
- [x] Explain why StrictMode double-invokes, and why removing it is the wrong move
- [x] Extract an effect into a hook, and say what that buys

**One question for Session 4.** You have a filtered, sorted view on screen. Send
a colleague a link to exactly what you are looking at.

You cannot. The URL is `localhost:5173/` no matter what you filtered. Refresh
and everything resets. There is no back button.

## Homework

[HOMEWORK.md](./HOMEWORK.md) — about 45 minutes. Task 1 matters most.

## Next session

**Session 4 — Routing & Application Architecture.** Real pages, real URLs, and
filters you can send to someone.

---

## Troubleshooting

| Symptom | Cause |
|---|---|
| requests fire forever | `[someObject]` in the deps — serialise it |
| everything loads twice | StrictMode. Expected. Add the cleanup |
| grid shows results for an older search | no `AbortController` — Lab 3 |
| red error flashes on every keystroke | you are treating `AbortError` as a failure |
| six requests while typing | `useDebounce` has no cleanup — Lab 2 |
| "no results" flashes before data | initial status is `'empty'`, should be `'loading'` |
| `Failed to fetch` | the API process died — check the `[api]` output |
| 404 on `/api/...` | the Vite proxy is not running; restart `npm run dev` |
| cart empties on reload | `useLocalStorage` not persisting — Lab 4 |
| `Cannot read properties of undefined` after a fetch | you did not check `response.ok` |
