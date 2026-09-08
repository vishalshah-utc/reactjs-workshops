# Module 13 — Data Fetching & Custom Hooks

**Study notes** · ~2.5 hours · *status: outline — full notes to be written*

## Learning objectives

- Extract stateful logic into custom hooks that are genuinely reusable
- Handle loading, error, empty and stale states as a matter of course
- Explain why a server-state library exists and what it replaces

## Topics

1. **Custom hooks** — a function starting with `use` that calls other hooks;
   sharing *logic*, never *state*; each call site gets its own state
2. **Rules** — hooks call hooks; only from components or other hooks; name it
   after what it does, not how
3. **The hooks you will write in your first month** — `useToggle`,
   `useDebounce`, `useLocalStorage`, `usePrevious`, `useMediaQuery`,
   `useEventListener`, `useOnClickOutside`, `useIntersectionObserver`
4. **A `useFetch` hook, built properly** — the four states, cleanup, abort,
   dependency correctness; then a hard look at everything it still gets wrong
   (no caching, no dedupe, no retry, no revalidation, no shared state between
   components)
5. **Why server state is different from client state** — it is a cache of
   someone else's data: it goes stale, it is shared, it can fail, it needs
   revalidating
6. **TanStack Query** — `useQuery`, query keys, `staleTime` vs `gcTime`,
   `useMutation`, invalidation, optimistic updates, infinite queries; SWR as the
   lighter alternative
7. **Suspense-based fetching** — the `use` hook, `<Suspense>` boundaries, and
   the framework/library support it needs
8. **Framework data loading** — Server Components fetching directly, route
   loaders; why this removes most client fetching (Module 19)
9. **Error boundaries around data** — a preview of Module 16
10. **API layer hygiene** — one module owning `fetch`, base URL, auth headers,
    error normalisation; typed responses

## Exercises

- Extract three near-identical fetching components into one `useFetch`, then
  list five things it does worse than a library
- Write `useDebounce` and use it to build search-as-you-type with no wasted
  requests
- Rebuild the same screen with TanStack Query and compare code and behaviour
  (back/forward, refocus, two components needing the same data)

## References

- [Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [Synchronizing with Effects: Fetching data](https://react.dev/learn/synchronizing-with-effects#fetching-data)
- [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
- [Removing Effect Dependencies](https://react.dev/learn/removing-effect-dependencies)
- [`use`](https://react.dev/reference/react/use)
- [`Suspense`](https://react.dev/reference/react/Suspense)
- [`useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore)
- [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)
