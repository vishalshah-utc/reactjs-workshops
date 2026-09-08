# Module 12 — Effects & Synchronisation

**Study notes** · ~3 hours · *status: outline — full notes to be written*
**The module where most React bugs are born. Read it twice.**

## Learning objectives

- Say what an effect is *for* — synchronising with an external system
- Write correct dependency arrays without fighting the linter
- Always clean up, and understand why Strict Mode runs your effect twice
- Recognise the many cases where you should delete the effect entirely

## Topics

1. **What an effect is** — code that runs *after* render to synchronise React
   with something outside React: the DOM, a subscription, a network connection,
   a timer, a third-party widget, the browser API surface
2. **`useEffect` anatomy** — setup function, cleanup function, dependency array
3. **The three dependency forms** — `[]` (after mount), `[a, b]` (when they
   change), omitted (after every render, almost always a bug)
4. **Cleanup** — subscriptions, timers, sockets, aborted fetches; cleanup runs
   before the next setup and on unmount
5. **Strict Mode's double-invoke** — setup → cleanup → setup; why an effect that
   breaks under it is already broken
6. **Reactive values** — props, state and anything derived from them are
   reactive and belong in the deps; the linter is right
7. **Removing dependencies honestly** — move the value inside the effect, move
   the function inside, use an updater function, split one effect into two,
   extract a non-reactive value; **not** by editing the array
8. **The lifecycle of a reactive effect** — think "start/stop synchronising",
   not "on mount/on update"
9. **Separating events from effects** — `useEffectEvent` for the "read the
   latest value but do not re-run" case
10. **You might not need an effect** — the biggest section
    - transforming data for rendering → compute during render
    - resetting state when a prop changes → a `key`
    - adjusting state when props change → derive, or compute during render
    - responding to a user event → do it in the handler
    - chains of effects that each set state → one handler
    - initialising the app once → module scope or a guard
    - sending analytics on view → an effect *is* right here
11. **Data fetching in effects** — race conditions, the `ignore` flag,
    `AbortController`, no cleanup = stale overwrites; and why a library is
    better (Module 13)
12. **`useEffect` vs `useLayoutEffect` vs event handlers** — a decision table

## Exercises

- Given eight components with effects, delete the five that should not exist
- Fix a search-as-you-type effect with a real race condition, twice: with
  `ignore` and with `AbortController`
- Write a `useEventListener` effect that adds and removes a `window` listener
  correctly under Strict Mode
- Turn a chain of three effects (each setting state the next reads) into one
  event handler

## References

- [Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects)
- [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
- [Lifecycle of Reactive Effects](https://react.dev/learn/lifecycle-of-reactive-effects)
- [Separating Events from Effects](https://react.dev/learn/separating-events-from-effects)
- [Removing Effect Dependencies](https://react.dev/learn/removing-effect-dependencies)
- [`useEffect`](https://react.dev/reference/react/useEffect)
- [`useLayoutEffect`](https://react.dev/reference/react/useLayoutEffect)
- [`useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore)
- [Escape Hatches](https://react.dev/learn/escape-hatches)
