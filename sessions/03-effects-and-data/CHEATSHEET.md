# Session 3 Cheat Sheet — one page, print it

## The four states

```tsx
type AsyncStatus = 'loading' | 'error' | 'empty' | 'success';
```

| State | Show |
|---|---|
| `loading` | a skeleton shaped like the content — not a spinner |
| `error` | what failed + a **Try again** |
| `empty` | why it's empty + a way to widen the search |
| `success` | the data |

**`error` ≠ `empty`.** A failure is ours and needs a retry. No matches is a
successful answer and needs a broader query. One message for both leaves the
user unable to tell which.

**Never start at `'empty'`.** Start at `'loading'`, or you flash "no results".

## fetch does NOT throw on 404 / 500

```tsx
const res = await fetch('/api/x');
if (!res.ok) throw new ApiError(res.status, ...);   // ← you must do this
return res.json();
```

`fetch` rejects only when the request could not be made: offline, DNS, CORS.
A 500 is a successful round trip.

## useEffect

```tsx
useEffect(() => {
  // effect
  return () => { /* cleanup */ };
}, [deps]);
```

| Deps | Runs |
|---|---|
| *omitted* | after every render — almost never right |
| `[]` | on mount only |
| `[a, b]` | on mount, and when `a` or `b` change |

**Cleanup runs before the next effect AND on unmount.** Three things leak
without it: **timers**, **subscriptions**, **in-flight requests**.

## The infinite loop

```tsx
const query = { q: 'x' };          // new object every render
useEffect(() => {...}, [query]);   // ❌ never equal → fetch → render → forever
```

| Fix | When |
|---|---|
| `[query.q, query.category]` | few, stable fields |
| `const key = JSON.stringify(query)` → `[key]` | a whole query object |
| `useMemo(() => query, [...])` in the parent | must pass the object itself |

> `queryKey` — remember the name. Session 5's TanStack Query is built on it.

## Race conditions

```
type "lap"     → request A
type "laptop"  → request B
B returns      → shows laptop   ✅
A returns late → shows lap      ❌ stale wins
```

```tsx
useEffect(() => {
  const controller = new AbortController();
  getThing(q, controller.signal)
    .then(setData)
    .catch((e) => {
      if (e instanceof DOMException && e.name === 'AbortError') return;  // ← not a failure
      setError(e);
    });
  return () => controller.abort();
}, [q]);
```

**Debounce is an optimisation. Cancellation is correctness.** Debouncing makes
races rarer; only aborting makes them impossible.

## StrictMode double-invoke

Development only. React mounts → unmounts → remounts every component on
purpose, to make missing cleanups loud.

**If double-invoking breaks your effect, your effect has a bug.** Do not remove
StrictMode.

## Custom hooks

A function named `use*` that calls other hooks. That's it.

```tsx
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);      // ← without this, every timer fires
  }, [value, delay]);
  return debounced;
}
```

**Rules of hooks:** top level only — never in a condition, loop or nested
function; only from components or other hooks. React tracks hooks by **call
order**, so a conditional hook shifts every slot after it.

**Hooks share logic, never state.** Two components calling `useDebounce` get
two independent timers.

**Lazy init:** `useState(() => read())` runs once. `useState(read())` runs on
every render and throws away all but the first.

## API teaching hooks

| Add to any `/api` URL | Effect |
|---|---|
| `?_delay=2000` | respond after 2s |
| `?_fail=500` | force a server error |
| `?_fail=422` | force per-field validation errors |
| `/api/flaky?rate=0.4` | fails ~40% of the time |

## Commands

```bash
npm run dev         # boots BOTH: [api] :4000 and [web] :5173
npm run typecheck   # Vite does not typecheck during dev
npm run lint
```

Vite proxies `/api` → `:4000`, so `fetch('/api/products')` needs no host and
no CORS.

## When it breaks

| Symptom | Cause |
|---|---|
| endless requests | `[someObject]` in deps |
| everything twice | StrictMode — add the cleanup |
| wrong search results shown | no `AbortController` |
| error flashes per keystroke | treating `AbortError` as a failure |
| one request per letter | `useDebounce` missing its cleanup |
| "no results" then data | initial status should be `'loading'` |
| `Failed to fetch` | the `[api]` process died |
| 404 on `/api/*` | proxy not running — restart `npm run dev` |
