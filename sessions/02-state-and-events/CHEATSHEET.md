# Session 2 Cheat Sheet — one page, print it

## Why nothing re-rendered

React compares the **new value to the old one with `Object.is`** (≈ `===`).
Same reference → no render. `push` mutates in place, so the reference is
unchanged, so React correctly does nothing.

| ❌ Mutates — never on state | ✅ Returns new |
|---|---|
| `arr.push(x)` | `[...arr, x]` |
| `arr.pop()` `arr.shift()` | `arr.slice(0, -1)` `arr.slice(1)` |
| `arr.splice(i, 1)` | `arr.filter((_, n) => n !== i)` |
| `arr.sort()` `arr.reverse()` | `[...arr].sort()` `arr.toSorted()` |
| `obj.key = v` | `{ ...obj, key: v }` |
| `obj.nested.key = v` | `{ ...obj, nested: { ...obj.nested, key: v } }` |

**Update one item in a list** — new array *and* a new object for the one that changed:
```tsx
setItems(items.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i));
```
The other objects are reused by reference. That is deliberate — it lets React
skip re-rendering them.

## State is a snapshot

Within one render, a state variable never changes.

```tsx
setCount(count + 1);
setCount(count + 1);        // ❌ +1 — both read the same old value

setCount(c => c + 1);
setCount(c => c + 1);       // ✅ +2
```

**If the new value depends on the old one, use the function form.** Never wrong.

## Where does state go?

**As low as possible, but high enough that everyone who needs it can reach it.**
Two siblings need it → their nearest common parent.

```
        App              ← state lives here
       /   \
  Toolbar   Grid         ← both need it, neither can own it
```

## Derived state is not state

Before every `useState`, ask: **can I compute this from what I already have?**

```tsx
const [filters, setFilters] = useState(defaultFilters);
const [visible, setVisible] = useState([]);            // ❌ two sources of truth
const visible = selectVisibleProducts(products, filters);  // ✅ just compute it
```

Not state: the filtered list · the total · `isEmpty` · `hasErrors` · a count ·
anything ending in `Filtered`, `Sorted`, `Computed`.

> "Isn't that slow?" It's 24 items. Measure before you optimise — Session 9.

## Controlled inputs

```tsx
<input  value={x} onChange={e => setX(e.target.value)} />          // input
<Select value={x} onValueChange={setX}>                            // Radix Select
<Checkbox checked={x} onCheckedChange={c => setX(c === true)} />   // Radix Checkbox
```

| You wrote | Result |
|---|---|
| `value` only | read-only field, React warns |
| `onChange` only | works, but the parent never knows |
| both | ✅ |

**⚠️ `checked === true`** — Radix checkboxes are tri-state and can give you
`"indeterminate"`, which is truthy.

**⚠️ Inputs deal in strings.** Keep drafts as strings; convert on submit.
`Number('')` is `0`, not `NaN`.

**⚠️ `event.preventDefault()`** in every form `onSubmit`, or the browser
navigates and your app restarts.

## useState or useReducer?

| `useState` | `useReducer` |
|---|---|
| independent values | several that move together |
| 1–2 update paths | many, or interdependent |
| `setX(value)` | transitions with rules |

```tsx
const [state, dispatch] = useReducer(reducer, initialState);
dispatch({ type: 'cart/add', productId: 'x' });
```

**Reducer rules**
1. **Pure** — no fetch, no `Date.now()`, no `Math.random()`
2. **Never mutates** — every branch returns a new object
3. **Exhaustive** — handle every action

```tsx
type CartAction =
  | { type: 'cart/add'; productId: string }
  | { type: 'cart/clear' };

switch (action.type) {
  case 'cart/add': /* action.productId is known to exist here */ break;
  default: {
    const unhandled: never = action;   // missing case = COMPILE error
    return unhandled;
  }
}
```

`dispatch` is **stable** — same identity forever, so passing it down never
causes a re-render.

## Events

```tsx
onClick={() => doThing(id)}      ✅ a function
onClick={doThing(id)}            ❌ calls it during render → infinite loop
onClick={doThing}                ✅ when you want the event object
```

`e.preventDefault()` stop the default (form submit, link navigation)
`e.stopPropagation()` stop it bubbling to parent handlers
`e.target` what was clicked · `e.currentTarget` what the handler is on

## Money

Integers in **paise**, never floats. `0.1 + 0.2 === 0.30000000000000004`.

```tsx
const paise = Math.round(Number(rupeesString) * 100);
formatPrice(129900)   // "₹1,299"
```

## Commands

```bash
npm run dev
npm run typecheck   # Vite does NOT typecheck during dev
npm run lint
```

## When it breaks

| Symptom | Cause |
|---|---|
| click does nothing, no error | mutation instead of replacement |
| typing does nothing | `value` without `onChange` |
| "uncontrolled → controlled" warning | `value` was `undefined` first render |
| page reloads on submit | missing `preventDefault()` |
| original order never returns | sorted without copying |
| "Too many re-renders" | called a setter during render — missing `() =>` |
| reducer case never fires | `type` string mismatch |
| state updates one step behind | used `setX(x + 1)` instead of `setX(c => c + 1)` |
