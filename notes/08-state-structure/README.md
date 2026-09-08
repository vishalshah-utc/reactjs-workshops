# Module 8 — Structuring State: Objects, Arrays, Lifting & Resetting

**Study notes** · ~2.5 hours · *status: outline — full notes to be written*

## Learning objectives

- Update nested objects and arrays in state without mutating
- Choose a state shape that makes bugs impossible rather than merely unlikely
- Lift state to the right owner, and know when to push it back down
- Control when React preserves state and when it resets it

## Topics

1. **Objects in state** — treat as read-only; spread to replace; nested updates
   need nested spreads (Module 1 §9 and §11 are the prerequisite)
2. **Arrays in state** — the mutating/non-mutating table; add, remove, replace,
   insert, sort, reverse; updating one object inside an array
3. **Immer** as an escape hatch for deeply nested state, and its cost
4. **Choosing the state structure** — the five principles
   - group related state
   - avoid contradictions (`isLoading` + `isError` → one `status` union)
   - avoid redundancy — derive instead of store
   - avoid duplication — store an id, not a copy of the object
   - avoid deep nesting — normalise (`byId` + `ids`) when it gets deep
5. **Lifting state up** — moving state to the closest common parent; the
   controlled/uncontrolled distinction
6. **Pushing state down** — the opposite refactor, to limit re-render scope
7. **Preserving and resetting state**
   - state lives at a *position in the tree*, not in a variable
   - same component, same position → state survives
   - the `key` trick to force a reset (e.g. a form per selected record)
   - why conditionally rendering two different components at one position resets
   - why defining a component inside another component destroys state
8. **Derived state** — computing during render, and when memoisation is
   warranted (forward reference to Module 15)

## Exercises

- Implement add / remove / toggle / edit / reorder on a list of objects, all
  immutably, with no library
- Refactor `isLoading`/`isError`/`isSuccess` booleans into one `status` union and
  delete the impossible states
- Two sibling components need the same value: lift it, then add a third that
  needs it and observe the pressure toward Context
- Use `key={selectedId}` to reset an edit form when the selection changes

## References

- [Managing State](https://react.dev/learn/managing-state)
- [Updating Objects in State](https://react.dev/learn/updating-objects-in-state)
- [Updating Arrays in State](https://react.dev/learn/updating-arrays-in-state)
- [Choosing the State Structure](https://react.dev/learn/choosing-the-state-structure)
- [Sharing State Between Components](https://react.dev/learn/sharing-state-between-components)
- [Preserving and Resetting State](https://react.dev/learn/preserving-and-resetting-state)
- [Reacting to Input with State](https://react.dev/learn/reacting-to-input-with-state)
