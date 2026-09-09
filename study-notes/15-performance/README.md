# Module 15 — Performance & Optimisation

**Study notes** · ~2.5 hours · *status: outline — full notes to be written*

## Learning objectives

- Measure before optimising, using the Profiler
- Know exactly what `memo`, `useMemo` and `useCallback` do and do not do
- Keep the UI responsive with transitions and deferred values
- Understand what the React Compiler changes about all of the above

## Topics

1. **Measure first** — React DevTools Profiler, "why did this render",
   flamegraphs, `<Profiler>`; browser Performance panel; Lighthouse
2. **What causes a re-render** — state change, parent re-render, context value
   change, key change. A re-render is *not* a DOM update
3. **Why re-renders are usually fine** — and the three cases where they are not:
   large lists, expensive computation, deep trees over frequent updates
4. **`memo`** — skip re-render when props are shallow-equal; why it fails
   immediately if you pass a new object/function/array every render (Module 1
   §22)
5. **`useMemo`** — cache a computed value; correct dependency arrays; the cost
   of memoising something cheap
6. **`useCallback`** — a stable function identity, for `memo` children and
   effect dependencies
7. **Structural fixes that beat memoisation** — lift content into `children`,
   push state down, split contexts, colocate state, render less
8. **Lists at scale** — virtualisation (TanStack Virtual, react-window), stable
   keys, avoiding per-row closures
9. **Concurrent features** — `useTransition` and `startTransition` for
   non-urgent updates; `useDeferredValue` for expensive derived UI; what
   "interruptible rendering" means for the single thread (Module 1 §17)
10. **Code splitting and bundle budget** — route-level `lazy`, analysing the
    bundle, tree-shaking, the cost of one careless dependency
11. **The React Compiler** — automatic memoisation, what it assumes (purity, the
    Rules of React), and what it does not remove the need for
12. **Rendering-level wins** — the Module 3 material: nothing you do in the
    client beats not shipping the JavaScript at all

## Exercises

- Profile a slow list, find the actual cause, and fix it *structurally* before
  reaching for `memo`
- Break a `memo` deliberately by passing an inline object, then fix it
- Add `useDeferredValue` to a heavy filtered list and feel the difference while
  typing
- Add a `useTransition` to a tab switch that renders an expensive panel

## References

- [`memo`](https://react.dev/reference/react/memo)
- [`useMemo`](https://react.dev/reference/react/useMemo)
- [`useCallback`](https://react.dev/reference/react/useCallback)
- [`useTransition`](https://react.dev/reference/react/useTransition)
- [`startTransition`](https://react.dev/reference/react/startTransition)
- [`useDeferredValue`](https://react.dev/reference/react/useDeferredValue)
- [`lazy`](https://react.dev/reference/react/lazy) · [`Suspense`](https://react.dev/reference/react/Suspense)
- [`<Profiler>`](https://react.dev/reference/react/Profiler)
- [React Compiler](https://react.dev/learn/react-compiler)
- [Render and Commit](https://react.dev/learn/render-and-commit)
- [Keeping Components Pure](https://react.dev/learn/keeping-components-pure)
