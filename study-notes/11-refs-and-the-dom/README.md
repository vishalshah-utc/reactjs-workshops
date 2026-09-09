# Module 11 — Refs & the DOM

**Study notes** · ~1.5 hours · *status: outline — full notes to be written*

## Learning objectives

- Store values that must survive renders without triggering them
- Reach a DOM node safely, and only when React's declarative model cannot help
- Expose an imperative handle deliberately, not by accident

## Topics

1. **`useRef`** — a mutable box (`{ current }`) React keeps between renders
2. **Refs vs state** — a ref does not trigger a re-render, is mutable, and can
   be read/written outside render; state is the opposite of all three
3. **When a ref is right** — timer ids, previous values, "has this already
   run", scroll positions, third-party library instances, anything the UI does
   not display
4. **DOM refs** — `<input ref={inputRef} />`; focus, scroll, measure, `play()`,
   canvas, `showModal()`
5. **When the ref is available** — `null` during render, set before effects run,
   `null` after unmount; always `ref.current?.`
6. **Ref callbacks** — `ref={node => …}` for lists of nodes and a `Map` of refs;
   React 19 cleanup functions returned from a ref callback
7. **React 19: `ref` as a prop** — `forwardRef` is no longer needed; how to read
   legacy `forwardRef` code
8. **`useImperativeHandle`** — exposing a narrow imperative API (`focus`,
   `reset`) from a component, and why to keep it tiny
9. **`useLayoutEffect`** — measuring the DOM before the browser paints, and why
   it is a last resort
10. **What not to do** — do not mutate DOM React owns; do not read/write refs
    during render; do not use refs to avoid learning state

## Exercises

- Autofocus a search input on mount, and re-focus it when a filter clears
- Build a "scroll to item" list using a `Map` of refs from ref callbacks
- Replace a `setInterval` stopwatch that leaks with one that stores its id in a
  ref and clears it on unmount
- Expose `{ focus, clear }` from a custom `<SearchInput>` via
  `useImperativeHandle`

## References

- [Referencing Values with Refs](https://react.dev/learn/referencing-values-with-refs)
- [Manipulating the DOM with Refs](https://react.dev/learn/manipulating-the-dom-with-refs)
- [`useRef`](https://react.dev/reference/react/useRef)
- [`useImperativeHandle`](https://react.dev/reference/react/useImperativeHandle)
- [`useLayoutEffect`](https://react.dev/reference/react/useLayoutEffect)
- [`forwardRef`](https://react.dev/reference/react/forwardRef) — legacy, for reading old code
- [Escape Hatches](https://react.dev/learn/escape-hatches)
