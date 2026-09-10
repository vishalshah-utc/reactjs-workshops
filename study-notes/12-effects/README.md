# Module 12 — Effects & Synchronisation

**Study notes** · ~3.5 hours
**The module where most React bugs are born. Read it twice.**

> **Goal.** `useEffect` is the most over-used hook in React. This module teaches
> what it is actually for — synchronising with a system outside React — and
> spends as much space on **deleting effects** as on writing them. If you
> finish it writing fewer effects than before, it worked.

**Prerequisites:** [Module 7](../07-state-and-events/) (state as a snapshot,
closures), [Module 8](../08-state-structure/) (derived state),
[Module 1 §13](../01-javascript-foundations/#13-closures--and-why-your-state-looks-stale),
[§16](../01-javascript-foundations/#16-asynchronous-javascript-promises-asyncawait-fetch).

---

## Contents

1. [What an effect is for](#1-what-an-effect-is-for)
2. [Anatomy](#2-anatomy)
3. [The dependency array](#3-the-dependency-array)
4. [Cleanup](#4-cleanup)
5. [Strict Mode's double-invoke](#5-strict-modes-double-invoke)
6. [Reactive values, and why the linter is right](#6-reactive-values-and-why-the-linter-is-right)
7. [Removing dependencies honestly](#7-removing-dependencies-honestly)
8. [Think "synchronise", not "lifecycle"](#8-think-synchronise-not-lifecycle)
9. [You might not need an effect](#9-you-might-not-need-an-effect)
10. [Separating events from effects](#10-separating-events-from-effects)
11. [Data fetching in an effect](#11-data-fetching-in-an-effect)
12. [Effects that are genuinely correct](#12-effects-that-are-genuinely-correct)
13. [`useEffect` vs `useLayoutEffect` vs handlers vs render](#13-useeffect-vs-uselayouteffect-vs-handlers-vs-render)
14. [`useSyncExternalStore`](#14-usesyncexternalstore)
15. [Debugging effects](#15-debugging-effects)
16. [Self-check](#16-self-check)
17. [References](#17-references)

---

## 1. What an effect is for

An effect **synchronises your component with a system outside React**.

Outside React means: the browser DOM beyond what JSX describes, a network
connection, a `setInterval`, a subscription, `localStorage`, a third-party
widget, the document title, an analytics service.

That is the whole job description. Everything else you might reach for
`useEffect` to do has a better home:

| You want to… | Where it goes |
|---|---|
| Compute a value from props/state | during render |
| Respond to a click, submit, keypress | an event handler |
| Reset state when a prop changes | a `key` |
| Fetch data | a framework loader or a query library |
| Keep two pieces of state in sync | delete one of them |
| **Connect to something outside React** | **an effect** |

The name is a trap. "Effect" sounds like "something that happens as a result",
which invites `useEffect` for anything downstream of anything. React's own docs
are blunter: if you are not synchronising with an external system, you probably
do not need an effect.

📖 [react.dev — Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects)

---

## 2. Anatomy

```jsx
useEffect(() => {
  // setup — runs after the render is committed to the DOM
  const connection = createConnection(serverUrl, roomId);
  connection.connect();

  return () => {
    // cleanup — runs before the next setup, and on unmount
    connection.disconnect();
  };
}, [serverUrl, roomId]);        // dependencies
```

Three parts, and the order they run in:

```
mount:         setup
deps change:   cleanup(old) → setup(new)
unmount:       cleanup
```

Effects run **after the browser has painted**. That is deliberate: it keeps
your effect off the critical path to first paint. If you need to run before
paint, that is `useLayoutEffect`
([Module 11 §11](../11-refs-and-the-dom/#11-uselayouteffect)).

---

## 3. The dependency array

```jsx
useEffect(() => { … });                 // after EVERY render — almost always a bug
useEffect(() => { … }, []);             // after mount only
useEffect(() => { … }, [a, b]);         // after mount, and when a or b changes
```

React compares dependencies with `Object.is` — the same reference comparison as
everywhere else ([Module 1 §10](../01-javascript-foundations/#10-objects-in-depth)).
Which means:

```jsx
const options = { roomId };             // NEW object every render
useEffect(() => { … }, [options]);      // → runs every render. Infinite loop if it sets state.
```

This is the single most common effect bug, and it is pure JavaScript reference
equality, not a React quirk. The fixes are in [§7](#7-removing-dependencies-honestly).

> **No array at all is different from an empty array.** `useEffect(fn)` runs
> after every render; `useEffect(fn, [])` runs once. Omitting the array is
> almost never what you meant.

---

## 4. Cleanup

Every effect that starts something must stop it. The cleanup runs **before the
next setup** and on unmount.

```jsx
// timers
useEffect(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
}, []);

// event listeners
useEffect(() => {
  const handler = () => setWidth(window.innerWidth);
  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
}, []);

// subscriptions
useEffect(() => {
  const sub = store.subscribe(handleChange);
  return () => sub.unsubscribe();
}, [store]);

// observers
useEffect(() => {
  const observer = new IntersectionObserver(onIntersect);
  observer.observe(node);
  return () => observer.disconnect();
}, [node]);

// network requests
useEffect(() => {
  const controller = new AbortController();
  fetch(url, { signal: controller.signal }).then(…).catch(ignoreAbort);
  return () => controller.abort();
}, [url]);
```

Forgetting cleanup gives you: memory leaks, listeners firing on dead
components, several intervals running at once, and — the one that hurts most —
**race conditions** ([§11](#11-data-fetching-in-an-effect)).

The mental model that gets this right every time:

> The cleanup must **completely undo** the setup, such that setup → cleanup →
> setup leaves the world exactly as setup alone would have.

---

## 5. Strict Mode's double-invoke

In development, React runs each effect **setup → cleanup → setup** on mount.

```
mount → setup → cleanup → setup     (development only)
mount → setup                        (production)
```

This is not a bug and not something to work around. It is a test: an effect
whose cleanup correctly undoes its setup is unaffected. An effect that leaks is
exposed immediately, in development, instead of in production after four hours
of use.

```jsx
// ✗ two intervals now run forever
useEffect(() => {
  setInterval(tick, 1000);
}, []);

// ✓ the double-invoke is invisible
useEffect(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
}, []);
```

**If Strict Mode breaks your effect, the double render did not cause the bug —
it found one.** Never "fix" it with a `hasRunRef` guard:

```jsx
const hasRun = useRef(false);
useEffect(() => {
  if (hasRun.current) return;      // ✗ silences the test, keeps the leak
  hasRun.current = true;
  …
}, []);
```

That code still leaks on unmount and remount in production. Write the cleanup.

📖 [react.dev — `StrictMode`](https://react.dev/reference/react/StrictMode)

---

## 6. Reactive values, and why the linter is right

A **reactive value** is anything that can change between renders: props, state,
context, and anything computed from them. Every reactive value an effect uses
must be in its dependencies.

```jsx
function ChatRoom({ roomId }) {                    // reactive — a prop
  const [serverUrl, setServerUrl] = useState('…'); // reactive — state

  useEffect(() => {
    const conn = createConnection(serverUrl, roomId);
    conn.connect();
    return () => conn.disconnect();
  }, [serverUrl, roomId]);                         // ✓ both listed
}
```

Values that are **not** reactive and do not belong in deps:

- module-scope constants (`const URL = 'https://…'` outside the component)
- `useRef` objects — the box identity never changes
- setters from `useState` and `dispatch` from `useReducer` — React guarantees
  stability
- anything imported

### `react-hooks/exhaustive-deps`

When this rule complains, it is right roughly nine times out of ten. The wrong
response is universal:

```jsx
// ✗ never
useEffect(() => {
  …
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

Suppressing it does not remove the dependency — it removes React's ability to
re-run when the dependency changes. The effect keeps using the value from
whichever render it last ran in, and you have built a stale closure by hand
([Module 7 §11](../07-state-and-events/#11-state-as-a-snapshot)).

**You do not "choose" dependencies.** They are determined by the code inside
the effect. If the list is wrong, change the code — [§7](#7-removing-dependencies-honestly).

📖 [react.dev — Removing Effect Dependencies](https://react.dev/learn/removing-effect-dependencies)

---

## 7. Removing dependencies honestly

Five techniques. None of them is "edit the array".

### 7.1 Move the value inside the effect

```jsx
// ✗ options is a new object every render
const options = { serverUrl, roomId };
useEffect(() => { connect(options); }, [options]);

// ✓ build it inside; depend on the primitives
useEffect(() => {
  const options = { serverUrl, roomId };
  connect(options);
}, [serverUrl, roomId]);
```

Primitives compare by value, so this actually stabilises.

### 7.2 Move a function inside, or out of the component

```jsx
// ✗ a new function identity every render
function createOptions() { return { serverUrl, roomId }; }
useEffect(() => { connect(createOptions()); }, [createOptions]);

// ✓ inside the effect
useEffect(() => {
  function createOptions() { return { serverUrl, roomId }; }
  connect(createOptions());
}, [serverUrl, roomId]);

// ✓ or outside the component entirely, if it uses nothing reactive
function createOptions(serverUrl, roomId) { … }
```

### 7.3 Use the updater form instead of reading state

```jsx
// ✗ depends on count, so the interval is torn down and rebuilt every second
useEffect(() => {
  const id = setInterval(() => setCount(count + 1), 1000);
  return () => clearInterval(id);
}, [count]);

// ✓ the updater does not read count, so the effect does not depend on it
useEffect(() => {
  const id = setInterval(() => setCount((c) => c + 1), 1000);
  return () => clearInterval(id);
}, []);
```

This is the single most useful trick in the module
([Module 7 §12](../07-state-and-events/#12-updater-functions)).

### 7.4 Split one effect into two

An effect that does two unrelated things has the union of both dependency
lists, so each re-runs when only the other's input changed:

```jsx
// ✗ changing city re-connects the chat
useEffect(() => {
  fetchCities(country).then(setCities);
  const conn = createConnection(roomId);
  conn.connect();
  return () => conn.disconnect();
}, [country, roomId]);

// ✓ one effect, one job
useEffect(() => { fetchCities(country).then(setCities); }, [country]);
useEffect(() => {
  const conn = createConnection(roomId);
  conn.connect();
  return () => conn.disconnect();
}, [roomId]);
```

**Each effect should synchronise one thing.** If you can describe it with
"and", split it.

### 7.5 Memoise — the last resort

```jsx
const options = useMemo(() => ({ serverUrl, roomId }), [serverUrl, roomId]);
useEffect(() => { connect(options); }, [options]);
```

Correct, and it treats the symptom. Prefer 7.1–7.4; reach for this when the
object genuinely comes from outside your control.

---

## 8. Think "synchronise", not "lifecycle"

Coming from class components, people think "on mount" and "on update". That
model produces wrong dependency arrays.

The right question is not *when does this run* but **what is this synchronised
with, and when does that need to start and stop?**

```jsx
useEffect(() => {
  const conn = createConnection(serverUrl, roomId);
  conn.connect();
  return () => conn.disconnect();
}, [serverUrl, roomId]);
```

Do not read this as "connect on mount, reconnect on update". Read it as:

> While this component is on screen with *these* values, a connection to
> *this* room should exist. When the values change, the old connection stops
> and a new one starts.

The effect describes a **state to be maintained**, not a sequence of events.
With that framing, the dependency list is obvious — it is exactly the set of
values that define *which* connection should exist.

📖 [react.dev — Lifecycle of Reactive Effects](https://react.dev/learn/lifecycle-of-reactive-effects)

---

## 9. You might not need an effect

**The most important section in this module.** Most effects in a real codebase
should not exist.

### 9.1 Transforming data for rendering

```jsx
// ✗ an extra render, and a window where the value is wrong
const [fullName, setFullName] = useState('');
useEffect(() => { setFullName(`${first} ${last}`); }, [first, last]);

// ✓
const fullName = `${first} ${last}`;
```

### 9.2 Filtering or sorting a list

```jsx
// ✗
const [visible, setVisible] = useState([]);
useEffect(() => { setVisible(items.filter((i) => i.active)); }, [items]);

// ✓
const visible = items.filter((i) => i.active);
```

If profiling proves it expensive, `useMemo` — not an effect.

### 9.3 Resetting state when a prop changes

```jsx
// ✗ renders once with stale state, then corrects itself
useEffect(() => { setDraft(product.name); }, [product]);

// ✓ a different key means a different instance
<ProductForm key={product.id} product={product} />
```

([Module 8 §16](../08-state-structure/#16-the-key-reset-in-practice).)

### 9.4 Adjusting some state when a prop changes

```jsx
// ✗
useEffect(() => { setSelection(null); }, [items]);

// ✓ derive it, and store only the id
const selection = items.find((i) => i.id === selectedId) ?? null;
```

### 9.5 Handling a user event

```jsx
// ✗ runs on any render where the flag is true, not on the click
useEffect(() => {
  if (submitted) { post('/api/order', order); }
}, [submitted]);

// ✓ the click caused it, so the handler does it
function handleSubmit() {
  post('/api/order', order);
}
```

The test: **did a specific user interaction cause this?** Then it belongs in
the handler for that interaction. Effects are for things that must happen
*because the component is on screen*, not because someone clicked.

### 9.6 A chain of effects that each set state

```jsx
// ✗ four renders, and impossible to follow
useEffect(() => { if (card) setGoldCount(c => c + 1); }, [card]);
useEffect(() => { if (goldCount > 3) setRound(r => r + 1); }, [goldCount]);
useEffect(() => { if (round > 5) setIsGameOver(true); }, [round]);

// ✓ one handler computes the whole consequence
function handlePlaceCard(nextCard) {
  const nextGold = goldCount + 1;
  const nextRound = nextGold > 3 ? round + 1 : round;
  setCard(nextCard);
  setGoldCount(nextGold);
  setRound(nextRound);
  setIsGameOver(nextRound > 5);
}
```

Cascading effects are the clearest sign that logic has escaped into the render
cycle. They are hard to debug because there is no single place where the rule
lives.

### 9.7 Initialising the app once

```jsx
// ✗ runs twice in Strict Mode
useEffect(() => { loadFromStorage(); checkAuthToken(); }, []);

// ✓ module scope — runs once when the module is imported
if (typeof window !== 'undefined') {
  loadFromStorage();
  checkAuthToken();
}
```

### 9.8 Notifying a parent about a change

```jsx
// ✗ parent updates one render late
useEffect(() => { onChange(isOn); }, [isOn, onChange]);

// ✓ tell the parent in the same event that caused the change
function handleClick() {
  const next = !isOn;
  setIsOn(next);
  onChange(next);
}
```

📖 [react.dev — You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)

---

## 10. Separating events from effects

Sometimes an effect needs to *read* a value without *reacting* to it.

```jsx
function ChatRoom({ roomId, theme }) {
  useEffect(() => {
    const conn = createConnection(roomId);
    conn.on('connected', () => {
      showNotification('Connected!', theme);       // reads theme
    });
    conn.connect();
    return () => conn.disconnect();
  }, [roomId, theme]);          // ✗ changing the theme RECONNECTS the chat
}
```

The linter demands `theme`, and the linter is right about the dependency — but
reconnecting because someone flipped to dark mode is clearly wrong.

`useEffectEvent` extracts the non-reactive part:

```jsx
import { useEffectEvent } from 'react';

function ChatRoom({ roomId, theme }) {
  const onConnected = useEffectEvent(() => {
    showNotification('Connected!', theme);         // always sees the LATEST theme
  });

  useEffect(() => {
    const conn = createConnection(roomId);
    conn.on('connected', () => onConnected());
    conn.connect();
    return () => conn.disconnect();
  }, [roomId]);                 // ✓ theme is not a dependency
}
```

An Effect Event always sees the latest props and state, and is **not** reactive
— so it never appears in a dependency array.

Rules: only call them from inside effects, never pass them to other components
or hooks, and declare them in the same component as the effect that uses them.

> **Availability.** `useEffectEvent` is the current name for what was proposed
> as `useEvent` and shipped experimentally as `experimental_useEffectEvent`.
> Check what your React version exports. Until it is available, the workaround
> is a ref updated in an effect — which is exactly what it replaces:
> ```jsx
> const themeRef = useRef(theme);
> useEffect(() => { themeRef.current = theme; }, [theme]);
> ```

📖 [react.dev — Separating Events from Effects](https://react.dev/learn/separating-events-from-effects)

---

## 11. Data fetching in an effect

You can. You mostly should not. Both halves matter.

### The race condition

```jsx
// ✗ a slow earlier response can overwrite a fast later one
useEffect(() => {
  fetchResults(query).then(setResults);
}, [query]);
```

Type "re", then "react". Two requests are in flight. If "re" resolves second,
the user sees results for "re" while the box says "react" — permanently, until
they type again.

### Fix 1 — the ignore flag

```jsx
useEffect(() => {
  let ignore = false;

  fetchResults(query).then((data) => {
    if (!ignore) setResults(data);       // discard if we have moved on
  });

  return () => { ignore = true; };
}, [query]);
```

The cleanup runs before the next effect, so the previous request's `ignore` is
already `true` by the time it resolves.

### Fix 2 — `AbortController`

```jsx
useEffect(() => {
  const controller = new AbortController();

  fetchResults(query, { signal: controller.signal })
    .then(setResults)
    .catch((error) => {
      if (error.name === 'AbortError') return;    // expected — not a failure
      setError(error);
    });

  return () => controller.abort();
}, [query]);
```

Better than the flag: it actually **cancels** the request rather than ignoring
its result. Note the abort must be swallowed — rendering an error for it flashes
a red banner on every keystroke.

### The four states, done properly

```jsx
function useProducts(query) {
  const [state, setState] = useState({ status: 'loading', data: [], error: null });

  const queryKey = JSON.stringify(query);      // ← serialise, or the object
                                               //   identity re-fetches forever
  useEffect(() => {
    const parsed = JSON.parse(queryKey);
    const controller = new AbortController();

    setState((s) => ({ ...s, status: 'loading' }));

    getProducts(parsed, controller.signal)
      .then((res) => setState({
        status: res.data.length ? 'success' : 'empty',   // empty ≠ error
        data: res.data,
        error: null,
      }))
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setState({ status: 'error', data: [], error });
      });

    return () => controller.abort();
  }, [queryKey]);

  return state;
}
```

The `JSON.stringify` line is load-bearing: `query` is an object literal built
during the parent's render, so depending on it directly re-fetches every render
forever ([§3](#3-the-dependency-array)).

### What this still gets wrong

Even done correctly, an effect-based fetch has no: cache, request dedup across
components, retry, revalidation on focus or reconnect, pagination support,
prefetching, or shared state between two components asking for the same data.
It also fetches on the client only, after the bundle loads — a waterfall.

That list is the feature list of TanStack Query, and it is why
[Module 13](../13-data-fetching-and-custom-hooks/) exists. **In a framework,
use its loader or a Server Component ([Module 19](../19-server-components/)).
Otherwise use a query library.** Hand-rolled fetching is worth writing once, to
understand what you are buying.

📖 [react.dev — Fetching data](https://react.dev/learn/synchronizing-with-effects#fetching-data)

---

## 12. Effects that are genuinely correct

To balance §9 — these are effects, and they should stay effects:

```jsx
// connecting to an external system
useEffect(() => {
  const conn = createConnection(roomId);
  conn.connect();
  return () => conn.disconnect();
}, [roomId]);

// browser APIs that are not part of your rendered output
useEffect(() => {
  document.title = `${unread} unread — ShopCrew`;
}, [unread]);

// subscribing to something outside React
useEffect(() => {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const handler = (e) => setReduced(e.matches);
  media.addEventListener('change', handler);
  return () => media.removeEventListener('change', handler);
}, []);

// analytics for a VIEW (not for a click — that is a handler)
useEffect(() => {
  logPageView(url);
}, [url]);

// persisting state
useEffect(() => {
  localStorage.setItem('cart', JSON.stringify(cart));
}, [cart]);

// controlling a third-party widget
useEffect(() => {
  const map = new MapWidget(nodeRef.current, { zoom });
  return () => map.destroy();
}, [zoom]);
```

Every one of them touches something React does not own. That is the test.

---

## 13. `useEffect` vs `useLayoutEffect` vs handlers vs render

| Where | When it runs | Use for |
|---|---|---|
| **Render body** | Every render, before paint | Deriving values. No side effects, ever |
| **Event handler** | On a user interaction | Anything a click/submit/keypress causes |
| **`useEffect`** | After paint | Synchronising with an external system |
| **`useLayoutEffect`** | After DOM mutation, before paint | Measuring then re-positioning ([Module 11](../11-refs-and-the-dom/#11-uselayouteffect)) |

The decision tree:

```
Can it be computed during render?               → do that
Did a specific user interaction cause it?       → event handler
Does it talk to something outside React?        → useEffect
…and would the user see a flicker otherwise?    → useLayoutEffect
```

---

## 14. `useSyncExternalStore`

The purpose-built hook for subscribing to an external store — safer than an
effect + state, because it avoids tearing during concurrent rendering.

```jsx
const isOnline = useSyncExternalStore(
  (callback) => {                       // subscribe
    window.addEventListener('online', callback);
    window.addEventListener('offline', callback);
    return () => {
      window.removeEventListener('online', callback);
      window.removeEventListener('offline', callback);
    };
  },
  () => navigator.onLine,               // client snapshot
  () => true,                           // server snapshot (for SSR)
);
```

Use it when you are reading a value from outside React that can change:
`navigator.onLine`, a media query, a Redux-like store, browser storage. It is
what state-management libraries use internally.

📖 [react.dev — `useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore)

---

## 15. Debugging effects

**An effect fires too often.** Log the dependencies and find the one changing
identity:

```jsx
useEffect(() => {
  console.log('effect ran', { a, b, c });
}, [a, b, c]);
```

An object, array or function in the list is nearly always the culprit
([§7](#7-removing-dependencies-honestly)).

**An infinite loop.** The effect sets state that is (directly or indirectly) in
its own dependencies. Classic shape:

```jsx
useEffect(() => { setData({ ...data, loaded: true }); }, [data]);   // ✗ forever
```

**A stale value.** The effect closes over an old render's value because a
dependency is missing or suppressed. Add it, or use an updater / Effect Event.

**Fires twice in development.** Strict Mode. Correct — check your cleanup
([§5](#5-strict-modes-double-invoke)).

**Never fires.** Check for `[]` when it should have deps, and check the
component actually mounts.

**Tools:** React DevTools Profiler shows what committed and why;
`eslint-plugin-react-hooks` catches most of this statically before you run
anything.

---

## 16. Self-check

1. Complete the sentence: an effect exists to ______.
2. Name six things people use `useEffect` for that have a better home, and give
   the home for each.
3. What are the three parts of an effect, and in what order do they run on:
   mount, a dependency change, unmount?
4. Why do effects run after paint, and what runs before it?
5. Distinguish `useEffect(fn)`, `useEffect(fn, [])` and `useEffect(fn, [a])`.
6. Why does `useEffect(() => {…}, [options])` with a locally-built `options`
   object run every render?
7. Give the mental model for what a cleanup must achieve.
8. Write correct cleanups for: an interval, a listener, a subscription, a
   fetch.
9. What exactly does Strict Mode do to effects, and what is it testing?
10. Why is a `hasRunRef` guard the wrong response to a double-invoke?
11. What is a reactive value? Name four things that are not reactive.
12. What actually happens when you suppress `exhaustive-deps` on an effect that
    reads `count`?
13. Give all five honest ways to remove a dependency, in the order you would
    try them.
14. Rewrite this without the `count` dependency:
    ```jsx
    useEffect(() => {
      const id = setInterval(() => setCount(count + 1), 1000);
      return () => clearInterval(id);
    }, [count]);
    ```
15. Why should one effect synchronise one thing? What is the test for splitting?
16. Restate `useEffect(…, [serverUrl, roomId])` as a "what should be true"
    sentence rather than a lifecycle sentence.
17. For each, say whether it needs an effect and what to do instead:
    computing a total · resetting a form when the record changes · sending an
    order on submit · logging a page view · syncing `fullName` from `first` and
    `last` · persisting the cart · notifying a parent of a toggle
18. What problem does `useEffectEvent` solve? Why does it never go in the deps?
19. Describe the search-box race condition precisely, and give the two fixes.
20. Why must an `AbortError` be swallowed rather than shown?
21. Why is `JSON.stringify(query)` used as a dependency?
22. Name six things a hand-rolled fetching effect does not do that a query
    library does.
23. Give four effects that are genuinely correct and say what external system
    each touches.
24. Give the four-way decision tree for render / handler / effect /
    layout effect.
25. What is `useSyncExternalStore` for, and what does it prevent?

### Practical

1. Given eight components with effects, delete the five that should not exist.
2. Build search-as-you-type with a real race condition, reproduce it with a
   throttled network, then fix it twice — with `ignore` and with
   `AbortController`.
3. Write `useEventListener` and prove it survives Strict Mode with no duplicate
   listeners.
4. Turn a three-effect cascade into one event handler.
5. Build a chat-room connection that reconnects on `roomId` but **not** on
   `theme`.
6. Write `useOnlineStatus` twice — with `useEffect` and with
   `useSyncExternalStore` — and describe the difference.

---

## 17. References

Official React documentation only.

**The four core pages — read in this order**
- [Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects)
- [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
- [Lifecycle of Reactive Effects](https://react.dev/learn/lifecycle-of-reactive-effects)
- [Removing Effect Dependencies](https://react.dev/learn/removing-effect-dependencies)

**Also**
- [Separating Events from Effects](https://react.dev/learn/separating-events-from-effects)
- [Fetching data in an Effect](https://react.dev/learn/synchronizing-with-effects#fetching-data)
- [Escape Hatches](https://react.dev/learn/escape-hatches)

**Reference**
- [`useEffect`](https://react.dev/reference/react/useEffect)
- [`useLayoutEffect`](https://react.dev/reference/react/useLayoutEffect)
- [`useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore)
- [`StrictMode`](https://react.dev/reference/react/StrictMode)
- [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)
- [Components and Hooks must be pure](https://react.dev/reference/rules/components-and-hooks-must-be-pure)

---

**Previous:** [Module 11 — Refs & the DOM](../11-refs-and-the-dom/)
**Next:** [Module 13 — Data Fetching & Custom Hooks](../13-data-fetching-and-custom-hooks/)
