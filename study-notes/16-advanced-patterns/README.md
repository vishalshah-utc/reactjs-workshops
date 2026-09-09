# Module 16 — Advanced Patterns, Error Boundaries & Portals

**Study notes** · ~2.5 hours · *status: outline — full notes to be written*

## Learning objectives

- Design component APIs that stay usable as requirements grow
- Handle runtime errors without a white screen
- Render outside the DOM hierarchy correctly and accessibly

## Topics

1. **Compound components** — `<Tabs>`, `<Tabs.List>`, `<Tabs.Panel>` sharing
   implicit state through context; when the API is worth it
2. **Render props and function-as-children** — still the right tool for some
   problems; how custom hooks replaced most of them
3. **Higher-order components** — how to read them in legacy code; why hooks won
4. **Controlled vs uncontrolled component APIs** — supporting both (`value` +
   `defaultValue`), the `onChange` contract, state reducers
5. **Polymorphic components** — an `as` prop, and typing it
6. **Slots and layout composition** — passing JSX as props to avoid drilling and
   to defeat unnecessary re-renders
7. **Error boundaries** — `componentDidCatch` / `getDerivedStateFromError`; why
   this is still a class; what they do and do not catch (not event handlers,
   not async, not SSR the same way); `react-error-boundary`; where to place
   boundaries (per route, per widget) and how to offer recovery
8. **Portals** — `createPortal` for modals, tooltips, toasts; escaping
   `overflow: hidden` and z-index stacking; event bubbling still follows the
   React tree; focus trapping, `aria-modal`, restoring focus, and `<dialog>`
9. **Accessible interactive patterns** — modal, menu, combobox, tooltip:
   keyboard, focus and roles; why you should adopt a headless library
   (Radix/Base UI/Headless UI) rather than hand-roll them
10. **`useId`** — stable ids for label/aria wiring that survive SSR
11. **`useDebugValue`** and naming custom hooks for DevTools

## Exercises

- Build `<Tabs>` as a compound component with context, keyboard support and no
  prop drilling
- Wrap a route in an error boundary with a "try again" that actually recovers
- Build an accessible modal with `createPortal`: focus trap, Escape to close,
  focus restored to the trigger
- Convert one HOC into a custom hook

## References

- [Passing Props to a Component](https://react.dev/learn/passing-props-to-a-component)
- [Passing Data Deeply with Context](https://react.dev/learn/passing-data-deeply-with-context)
- [Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [`createPortal`](https://react.dev/reference/react-dom/createPortal)
- [`Component` — `componentDidCatch`](https://react.dev/reference/react/Component#componentdidcatch)
- [`useId`](https://react.dev/reference/react/useId)
- [`useDebugValue`](https://react.dev/reference/react/useDebugValue)
- [`Suspense`](https://react.dev/reference/react/Suspense)
- [Rules of React](https://react.dev/reference/rules)
