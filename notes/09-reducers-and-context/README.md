# Module 9 — Reducers & Context

**Study notes** · ~2.5 hours · *status: outline — full notes to be written*

## Learning objectives

- Recognise when `useState` has stopped scaling and move to `useReducer`
- Write a reducer as a pure function of `(state, action)`
- Use Context to pass values deeply without drilling — and know its costs
- Combine reducer + context into a maintainable app-level store

## Topics

1. **Why reducers** — many related state variables updated together by several
   handlers; a state machine hiding in your component
2. **`useReducer`** — signature, dispatch, action objects, `switch` on
   `action.type`
3. **Reducers must be pure** — no fetches, no mutation, no `Date.now()`; same
   inputs → same next state, which is what makes them testable in isolation
4. **`useState` vs `useReducer`** — the honest comparison: code size,
   readability, debuggability, testability
5. **Migrating** `useState` → `useReducer` step by step
6. **Context**
   - `createContext`, `<Provider value>`, `useContext`
   - default values and when they fire
   - Context is for "many components at different depths need this", not for all
     shared state
   - the re-render behaviour: every consumer re-renders when `value` changes
     identity — so memoise the value or split contexts
   - multiple providers, nesting, and reading the nearest one
   - React 19: `<Context>` usable directly as a provider
7. **Reducer + Context together** — the standard pattern for cart/auth/theme:
   one provider exposing `state` and `dispatch` (split into two contexts so
   dispatch consumers do not re-render)
8. **Custom hooks as the public API** — `useCart()` wrapping `useContext`, with
   a "must be used inside a provider" error
9. **When to reach for a library instead** — Zustand / Redux Toolkit / Jotai and
   the specific problems they solve that Context does not (selector-based
   subscriptions, devtools, middleware)

## Exercises

- Convert a 5-`useState` task list into a single reducer with 5 action types
- Write unit tests for the reducer with no React involved at all
- Build a `ThemeProvider` + `useTheme()`; then a `CartProvider` with split
  state/dispatch contexts and prove with DevTools that a dispatch-only consumer
  does not re-render

## References

- [Extracting State Logic into a Reducer](https://react.dev/learn/extracting-state-logic-into-a-reducer)
- [Passing Data Deeply with Context](https://react.dev/learn/passing-data-deeply-with-context)
- [Scaling Up with Reducer and Context](https://react.dev/learn/scaling-up-with-reducer-and-context)
- [`useReducer`](https://react.dev/reference/react/useReducer)
- [`useContext`](https://react.dev/reference/react/useContext)
- [`createContext`](https://react.dev/reference/react/createContext)
- [Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
