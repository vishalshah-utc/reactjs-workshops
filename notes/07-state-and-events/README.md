# Module 7 — State & Events

**Study notes** · ~2.5 hours · *status: outline — full notes to be written*

## Learning objectives

- Use `useState` correctly, including the updater form and lazy initialisers
- Handle events, including propagation and default prevention
- Explain state-as-a-snapshot and batching, and predict what a handler will log
- Decide what belongs in state and what does not

## Topics

1. **`useState`** — the returned pair, naming conventions, one hook per
   independent value
2. **Rules of Hooks** — top level only, never in conditions/loops/nested
   functions, only in components and custom hooks; why (call order identity)
3. **State is per component instance**, not per component function
4. **Event handling**
   - `onClick={fn}` vs `onClick={fn()}` — the call-vs-reference bug
   - handlers that need arguments: `onClick={() => remove(id)}`
   - the event object; `preventDefault`, `stopPropagation`
   - propagation and capture phase (`onClickCapture`)
   - passing handlers as props, and naming (`onSomething` prop → `handleSomething`
     implementation)
5. **State as a snapshot** — each render has its own `const`; why
   `setCount(count + 1)` three times gives 1
6. **The updater function** — `setCount(c => c + 1)`, and when it is required
7. **Batching** — multiple `setState` calls in one event produce one re-render;
   React 18+ batches across async boundaries too
8. **Lazy initial state** — `useState(() => expensive())` vs
   `useState(expensive())`
9. **What should NOT be state**
   - values derivable from other state or props
   - values that do not affect the render output (→ `useRef`, Module 11)
   - props copied into state
10. **Render triggers** — state change, parent re-render, context change, key
    change

## Exercises

- Predict, then verify, the output of a handler with three `setCount(count + 1)`
  calls, then fix it with the updater form
- Build a counter, a toggle, a text input and a "select one of many" list with
  the minimum state each needs
- Given a component with six state variables, remove the two that are derived

## References

- [Adding Interactivity](https://react.dev/learn/adding-interactivity)
- [Responding to Events](https://react.dev/learn/responding-to-events)
- [State: A Component's Memory](https://react.dev/learn/state-a-components-memory)
- [Render and Commit](https://react.dev/learn/render-and-commit)
- [State as a Snapshot](https://react.dev/learn/state-as-a-snapshot)
- [Queueing a Series of State Updates](https://react.dev/learn/queueing-a-series-of-state-updates)
- [`useState`](https://react.dev/reference/react/useState)
- [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)
