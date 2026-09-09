# Module 18 — Testing React Applications

**Study notes** · ~2.5 hours · *status: outline — full notes to be written*

## Learning objectives

- Test components the way a user uses them
- Choose queries and assertions that do not break on every refactor
- Mock the network at the right level, and know what to test end to end

## Topics

1. **What is worth testing** — behaviour and contracts, not implementation;
   the testing trophy (static → unit → integration → e2e) and where React
   component tests sit
2. **The toolchain** — Vitest (or Jest), React Testing Library,
   `@testing-library/user-event`, `jest-dom` matchers, MSW, Playwright
3. **Rendering and querying** — `render`, `screen`, the query priority order
   (`getByRole` first, `getByLabelText`, `getByText`, `getByTestId` last), and
   why that order *is* an accessibility check
4. **`getBy` vs `queryBy` vs `findBy`** — present, absent, and eventually
   present
5. **User interaction** — `userEvent` over `fireEvent`; typing, clicking,
   selecting, tabbing, keyboard
6. **Async assertions** — `await screen.findBy…`, `waitFor`, and never asserting
   on a fixed timeout
7. **Testing the four data states** — loading, error, empty, loaded — by
   controlling the network with MSW handlers rather than mocking `fetch`
8. **Testing hooks** — through a component, or with `renderHook` when it is
   genuinely standalone
9. **Testing reducers and pure functions** — cheap, fast, no React
10. **What not to do** — asserting on state or props, snapshotting whole trees,
    `data-testid` everywhere, mocking your own components
11. **Accessibility in tests** — role-based queries, `axe`
12. **E2E with Playwright** — the handful of critical journeys worth the cost
13. **CI quality gates** — typecheck, lint, unit, e2e, build; coverage as a
    signal, not a target

## Exercises

- Test a `<ProductCard>`: renders data, toggles wishlist, calls `onAdd` once
- Test a search screen against MSW: loading skeleton → results, plus the error
  and empty paths
- Write a reducer test suite with no `render` call at all
- One Playwright test for the full add-to-cart-and-checkout journey

## References

- [Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [Keeping Components Pure](https://react.dev/learn/keeping-components-pure) — why pure components are testable
- [`StrictMode`](https://react.dev/reference/react/StrictMode) — the bugs it surfaces before your tests do
- [`act`](https://react.dev/reference/react/act) — and why RTL usually handles it for you
- [Extracting State Logic into a Reducer](https://react.dev/learn/extracting-state-logic-into-a-reducer) — testable state logic
