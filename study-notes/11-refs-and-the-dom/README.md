# Module 11 — Refs & the DOM

**Study notes** · ~2 hours

> **Goal.** Refs are React's escape hatch: a way to hold a value React does not
> re-render for, and a way to reach a real DOM node when the declarative model
> genuinely cannot express what you need. Both are legitimate. Both are
> over-used by people who have not yet internalised state.

**Prerequisites:** [Module 7](../07-state-and-events/) (state, render triggers),
[Module 1 §19](../01-javascript-foundations/#19-the-dom-and-events-what-react-replaces).

---

## Contents

1. [What a ref is](#1-what-a-ref-is)
2. [Refs vs state](#2-refs-vs-state)
3. [When a ref is the right tool](#3-when-a-ref-is-the-right-tool)
4. [DOM refs](#4-dom-refs)
5. [When `ref.current` is populated](#5-when-refcurrent-is-populated)
6. [What you may and may not do to a DOM node](#6-what-you-may-and-may-not-do-to-a-dom-node)
7. [Ref callbacks](#7-ref-callbacks)
8. [A list of refs](#8-a-list-of-refs)
9. [`ref` as a prop — and legacy `forwardRef`](#9-ref-as-a-prop--and-legacy-forwardref)
10. [`useImperativeHandle`](#10-useimperativehandle)
11. [`useLayoutEffect`](#11-uselayouteffect)
12. [`flushSync`](#12-flushsync)
13. [Common mistakes](#13-common-mistakes)
14. [Self-check](#14-self-check)
15. [References](#15-references)

---

## 1. What a ref is

`useRef` gives you a **mutable box** that React keeps between renders:

```jsx
const ref = useRef(initialValue);
// → { current: initialValue }
```

That is the whole API. One object, one property, and React promises to hand you
the *same object* on every render of that component instance.

```jsx
function Timer() {
  const intervalRef = useRef(null);

  function start() {
    intervalRef.current = setInterval(tick, 1000);   // write
  }

  function stop() {
    clearInterval(intervalRef.current);              // read
    intervalRef.current = null;
  }
}
```

Writing to `ref.current` does **not** trigger a re-render. That is the entire
difference from state, and everything else follows from it.

📖 [react.dev — Referencing Values with Refs](https://react.dev/learn/referencing-values-with-refs)

---

## 2. Refs vs state

| | `useState` | `useRef` |
|---|---|---|
| Changing it re-renders | **yes** | no |
| Read during render | yes — that is its job | **no** (see below) |
| Write during render | never | never |
| Value between renders | snapshot per render | one shared box |
| Immutable? | treat as read-only | mutate freely |
| Use for | anything the user sees | everything else |

The one-line test:

> **Does the screen need to change when this value changes?**
> Yes → state. No → ref.

```jsx
const [count, setCount] = useState(0);   // ✓ displayed
const renderCount = useRef(0);           // ✓ debugging only, never displayed
```

### Do not read or write a ref during render

```jsx
function Bad() {
  const ref = useRef(0);
  ref.current += 1;                      // ✗ impure — breaks Strict Mode,
  return <p>{ref.current}</p>;           //   and rendering a ref is a lie
}
```

Reading a ref during render makes your component impure
([Module 4 §15](../04-components-and-jsx/#15-components-must-be-pure)): the
output depends on something outside props and state, so two renders with
identical inputs can produce different output. React may then show you a value
it never committed.

Refs belong in **event handlers and effects**. The exception is lazily
initialising the ref's own contents once, and even that is usually better
solved by `useState`'s lazy initialiser.

---

## 3. When a ref is the right tool

Values that change but are never rendered:

```jsx
const timeoutRef = useRef(null);        // a timer handle to clear later
const observerRef = useRef(null);       // an IntersectionObserver instance
const previousQuery = useRef('');       // what the value was last time
const hasLoggedView = useRef(false);    // "have we already done this once?"
const dragStartX = useRef(0);           // scratch data during a drag
const chartRef = useRef(null);          // a third-party library instance
const abortRef = useRef(null);          // the current AbortController
```

Each of these would work in state and each would be worse: a re-render per
mouse-move during a drag, a re-render to record that you already sent an
analytics event.

### `usePrevious` — the canonical custom ref hook

```jsx
function usePrevious(value) {
  const ref = useRef(undefined);

  useEffect(() => {
    ref.current = value;         // written AFTER render, so during render
  }, [value]);                   // ref.current is still the previous value

  return ref.current;
}

const previousCount = usePrevious(count);
```

The timing is the trick: the effect runs after the commit, so during the next
render the ref still holds the value from the render before.

---

## 4. DOM refs

Pass a ref to a DOM element and React puts the node in `.current`:

```jsx
function SearchBox() {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();       // after mount, the node exists
  }, []);

  return <input ref={inputRef} type="search" />;
}
```

The legitimate uses, more or less exhaustively:

| Task | Why React cannot do it declaratively |
|---|---|
| Focus an input | Focus is browser state, not markup |
| Scroll an element into view | Same |
| Measure size or position | Requires a real laid-out node |
| Play/pause `<video>`, `<audio>` | Imperative media API |
| Draw on `<canvas>` | Imperative drawing API |
| Open `<dialog>` with `showModal()` | Imperative API with no declarative equivalent |
| Select text in a field | Imperative |
| Integrate a non-React library | It wants a DOM node to own |
| Observe with `IntersectionObserver` / `ResizeObserver` | The API takes a node |

Everything else — showing, hiding, styling, adding classes, changing text —
belongs in state and JSX.

📖 [react.dev — Manipulating the DOM with Refs](https://react.dev/learn/manipulating-the-dom-with-refs)

---

## 5. When `ref.current` is populated

The lifecycle, which explains every "why is my ref null?" question:

```
render          → ref.current is null (or the previous node)
React commits   → React sets ref.current to the DOM node
effects run     → ref.current is available ✓
unmount         → React sets ref.current back to null
```

Three consequences:

```jsx
function Component() {
  const ref = useRef(null);

  console.log(ref.current);          // null on the first render — always

  useEffect(() => {
    console.log(ref.current);        // the node ✓
  }, []);

  return <input ref={ref} />;
}
```

**Always use optional chaining.** `ref.current?.focus()` — the node can be
`null` if the element is conditionally rendered, or if you are in a callback
that fires after unmount.

```jsx
{isOpen && <input ref={inputRef} />}     // inputRef.current is null while closed
```

And a ref to a conditionally rendered element needs its focus call in an effect
that depends on the condition, not a mount-only effect:

```jsx
useEffect(() => {
  if (isOpen) inputRef.current?.focus();
}, [isOpen]);                            // ✓ re-runs when it appears
```

---

## 6. What you may and may not do to a DOM node

React owns the DOM it rendered. A ref lets you reach in; it does not transfer
ownership.

```jsx
// ✓ safe — reading, and non-destructive imperative APIs
node.focus();
node.blur();
node.scrollIntoView({ behavior: 'smooth' });
node.getBoundingClientRect();
node.select();
node.play();
node.showModal();

// ✗ unsafe — React does not know, and will overwrite or crash
node.textContent = 'Hello';
node.innerHTML = '<b>Hi</b>';
node.remove();
node.appendChild(other);
node.style.display = 'none';
node.classList.add('active');
```

The bottom group are things React manages. Setting `textContent` on a node
React also renders text into means React's next update overwrites you — or, if
you remove a node React expects to still be there, React crashes when it tries
to update it.

The rule: **manipulate nodes React does not render into.** A node you render
`<div ref={x} />` with no children is yours to fill with a charting library.

For the `display`/`classList` cases the answer is always state:

```jsx
<div className={isActive ? 'panel is-active' : 'panel'} hidden={!isVisible} />
```

---

## 7. Ref callbacks

Instead of a ref object, pass a **function**. React calls it with the node on
mount and (in React 19) calls the returned cleanup on unmount:

```jsx
<div
  ref={(node) => {
    if (!node) return;
    const observer = new ResizeObserver(handleResize);
    observer.observe(node);
    return () => observer.disconnect();      // React 19 cleanup
  }}
/>
```

Before React 19 the callback was called with `null` on unmount instead, which
you can still see in existing code:

```jsx
ref={(node) => {
  if (node) observer.observe(node);
  else observer.disconnect();                // the old idiom
}}
```

> **The inline-callback gotcha.** A ref callback defined inline is a new
> function every render, so React calls it with `null` and then the node again
> on *every* render. Usually harmless; occasionally the cause of a subscription
> being torn down and rebuilt sixty times a second. `useCallback` it if the
> body does real work.

---

## 8. A list of refs

You cannot call `useRef` in a loop
([Module 7 §3](../07-state-and-events/#3-the-rules-of-hooks-and-why-they-exist)).
One ref holding a `Map`, populated by ref callbacks, is the pattern:

```jsx
function ProductList({ products }) {
  const nodesRef = useRef(null);

  function getMap() {
    nodesRef.current ??= new Map();
    return nodesRef.current;
  }

  function scrollTo(id) {
    getMap().get(id)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  return (
    <ul>
      {products.map((product) => (
        <li
          key={product.id}
          ref={(node) => {
            const map = getMap();
            map.set(product.id, node);
            return () => map.delete(product.id);      // React 19 cleanup
          }}
        >
          {product.name}
        </li>
      ))}
    </ul>
  );
}
```

The cleanup is what keeps the Map from growing forever as items are filtered in
and out.

📖 [react.dev — How to manage a list of refs using a ref callback](https://react.dev/learn/manipulating-the-dom-with-refs#how-to-manage-a-list-of-refs-using-a-ref-callback)

---

## 9. `ref` as a prop — and legacy `forwardRef`

**React 19:** `ref` is an ordinary prop on function components.

```jsx
function TextInput({ ref, ...props }) {          // ✓ React 19
  return <input ref={ref} {...props} />;
}

<TextInput ref={inputRef} />
```

**Before React 19** it was not — `ref` was stripped by React and had to be
threaded through explicitly:

```jsx
const TextInput = forwardRef(function TextInput(props, ref) {   // legacy
  return <input ref={ref} {...props} />;
});
```

You will meet `forwardRef` constantly in existing codebases and in library
source. It still works and is deprecated for new code.

**Why a component needs to forward a ref at all:** without it, a parent cannot
focus your `<TextInput>`, because `ref` on a component with no forwarding does
nothing. Any input-like component in a design system needs this.

📖 [react.dev — `forwardRef`](https://react.dev/reference/react/forwardRef) ·
[React 19 — `ref` as a prop](https://react.dev/blog/2024/12/05/react-19)

---

## 10. `useImperativeHandle`

Expose a **narrow, deliberate** API instead of the raw DOM node:

```jsx
function SearchInput({ ref, ...props }) {
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    clear: () => { if (inputRef.current) inputRef.current.value = ''; },
  }), []);

  return <input ref={inputRef} {...props} />;
}
```

```jsx
searchRef.current.focus();      // ✓ the two things you meant to allow
searchRef.current.clear();      // ✓
searchRef.current.style = …;    // ✗ not exposed — cannot be reached
```

**Why bother.** Handing out the DOM node makes the node your public API: any
consumer can restyle it, remove it, or read internals, and you can never change
the markup without risking a break. A three-method handle is a contract you can
keep.

Use it sparingly. An imperative handle is a hole in the declarative model, and
most requirements that seem to need one — "open the dialog from outside" — are
better served by a prop (`open={isOpen}`).

📖 [react.dev — `useImperativeHandle`](https://react.dev/reference/react/useImperativeHandle)

---

## 11. `useLayoutEffect`

Identical to `useEffect`, except it runs **synchronously after the DOM
mutation but before the browser paints**.

```
useEffect:        render → commit → PAINT → effect
useLayoutEffect:  render → commit → effect → PAINT
```

That difference matters exactly once: when you must **measure the DOM and
change it again** before the user can see the intermediate state.

```jsx
function Tooltip({ targetRect, children }) {
  const ref = useRef(null);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    setHeight(ref.current.getBoundingClientRect().height);   // measure
  }, []);                                                    // then re-render above/below

  const top = targetRect.top - height < 0 ? targetRect.bottom : targetRect.top - height;
  return <div ref={ref} style={{ top }}>{children}</div>;
}
```

With `useEffect` the tooltip paints in the wrong place and jumps. With
`useLayoutEffect` the user never sees the first position.

**The costs, which is why it is a last resort:**

- It **blocks painting.** Slow work here freezes the frame.
- It does **not run on the server**, so SSR renders the unmeasured version and
  React warns about it ([Module 3 §5](../03-rendering-architectures/#5-hydration-explained-properly)).

Default to `useEffect`. Reach for `useLayoutEffect` only when you can see the
flicker.

📖 [react.dev — `useLayoutEffect`](https://react.dev/reference/react/useLayoutEffect)

---

## 12. `flushSync`

State updates are batched
([Module 7 §13](../07-state-and-events/#13-batching)), so the DOM is not updated
by the time the next line runs. When you need it to be:

```jsx
import { flushSync } from 'react-dom';

function addItem(item) {
  flushSync(() => {
    setItems([...items, item]);         // DOM is updated before flushSync returns
  });
  listRef.current.lastChild?.scrollIntoView();    // now the new item exists
}
```

Without `flushSync`, `lastChild` is the item from *before* the update.

It forces a synchronous re-render, which defeats batching and concurrent
rendering. Genuinely rare — scroll-to-new-item and measure-after-update are
about the whole list. Comment it when you use it.

📖 [react.dev — `flushSync`](https://react.dev/reference/react-dom/flushSync)

---

## 13. Common mistakes

| Symptom | Cause | Fix |
|---|---|---|
| `ref.current` is `null` | Read during render, or the element is not rendered | Read in an effect or handler; `?.` |
| Ref to a conditional element never populates | Mount-only effect ran while it was hidden | Depend on the condition |
| UI does not update when the ref changes | Refs do not re-render | It should be state |
| Ref works, then breaks after a re-render | Reading a ref during render | Move to an effect/handler |
| `ref` on a component does nothing | Component does not accept/forward it | Accept `ref` as a prop (React 19) |
| Subscription torn down every render | Inline ref callback doing real work | `useCallback` the callback |
| Scroll-to-new-item scrolls to the old one | Batching — DOM not updated yet | `flushSync`, or an effect on the data |
| Tooltip flashes in the wrong place | Measuring in `useEffect` | `useLayoutEffect` |
| React crashes after manual DOM edits | You removed/edited a node React owns | Only touch nodes React does not fill |
| Hydration warning around a measurement | `useLayoutEffect` does not run on the server | Guard, or render the unmeasured state first |

---

## 14. Self-check

1. What exactly does `useRef(0)` return, and what does React guarantee about
   it across renders?
2. Give the one-line test for choosing between state and a ref.
3. Why is reading `ref.current` during render a bug and not just bad style?
4. List five values that belong in a ref rather than state.
5. Explain how `usePrevious` works. Why does the ref still hold the old value
   during render?
6. Describe the ref lifecycle from render to unmount. Why is `ref.current`
   `null` on the first render?
7. Your ref is to `{isOpen && <input ref={inputRef} />}` and focus never
   happens. Why, and what is the fix?
8. Which of these are safe on a DOM node you got from a ref?
   `focus()` · `textContent = 'x'` · `getBoundingClientRect()` ·
   `classList.add()` · `scrollIntoView()` · `remove()`
9. What is the rule that separates the safe ones from the unsafe ones?
10. What does a React 19 ref callback return, and what did the pre-19 version
    do instead?
11. Why can you not call `useRef` in a `.map()`, and what is the pattern for a
    list of refs?
12. Why does the ref-callback cleanup matter in that pattern?
13. What changed about `ref` in React 19, and what will you still see in older
    code?
14. Why expose a `useImperativeHandle` rather than the DOM node? Give a concrete
    cost of handing out the node.
15. Draw the timing difference between `useEffect` and `useLayoutEffect`, and
    give the one situation that requires the second.
16. Name the two costs of `useLayoutEffect`.
17. What does `flushSync` do, why is it rarely correct, and give one case where
    it is.

### Practical

1. Autofocus a search input on mount, then re-focus it whenever the filters are
   cleared.
2. Build a modal that traps focus, closes on Escape, and returns focus to the
   button that opened it.
3. Build a message list that scrolls to the newest message when one arrives —
   first with an effect, then with `flushSync`, and explain which is right.
4. Build a "scroll to product" list using a `Map` of refs from ref callbacks,
   and verify the Map shrinks when you filter the list.
5. Write `usePrevious` and use it to show "▲ up from 12" next to a live number.
6. Wrap a non-React library (a chart, a map) in a component that owns its node
   and cleans up on unmount.

---

## 15. References

Official React documentation only.

**Refs**
- [Referencing Values with Refs](https://react.dev/learn/referencing-values-with-refs)
- [Manipulating the DOM with Refs](https://react.dev/learn/manipulating-the-dom-with-refs)
- [How to manage a list of refs using a ref callback](https://react.dev/learn/manipulating-the-dom-with-refs#how-to-manage-a-list-of-refs-using-a-ref-callback)
- [`useRef`](https://react.dev/reference/react/useRef)
- [`useImperativeHandle`](https://react.dev/reference/react/useImperativeHandle)
- [`forwardRef`](https://react.dev/reference/react/forwardRef) — legacy, for reading older code

**Timing**
- [`useLayoutEffect`](https://react.dev/reference/react/useLayoutEffect)
- [`flushSync`](https://react.dev/reference/react-dom/flushSync)
- [Render and Commit](https://react.dev/learn/render-and-commit)

**Rules**
- [Escape Hatches](https://react.dev/learn/escape-hatches) — the section this module covers
- [Keeping Components Pure](https://react.dev/learn/keeping-components-pure)
- [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)
- [React 19 release notes](https://react.dev/blog/2024/12/05/react-19)

---

**Previous:** [Module 10 — Forms & Controlled Components](../10-forms/)
**Next:** [Module 12 — Effects & Synchronisation](../12-effects/)
