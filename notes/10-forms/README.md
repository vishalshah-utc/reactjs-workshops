# Module 10 — Forms & Controlled Components

**Study notes** · ~2.5 hours · *status: outline — full notes to be written*

## Learning objectives

- Build controlled inputs of every type correctly
- Choose between controlled and uncontrolled, with reasons
- Validate, show errors accessibly, and handle submission states
- Use React 19's form Actions where a framework provides them

## Topics

1. **Controlled inputs** — `value` + `onChange`; the one-way loop
   (state → input → event → state)
2. **Every input type** — text, textarea, number, checkbox (`checked`), radio
   groups, `<select>` (single and `multiple`), file inputs (always
   uncontrolled), date inputs
3. **One handler for many fields** — `name`-driven updates into an object;
   computed keys from Module 1 §10
4. **Uncontrolled inputs and `defaultValue`/`defaultChecked`** — when they are
   the better choice, and reading values with a ref or `FormData`
5. **The classic warnings** — "A component is changing an uncontrolled input to
   be controlled", `value` without `onChange`, `value={undefined}`
6. **Submission** — `onSubmit` on the `<form>`, `preventDefault`, submit
   buttons, disabling during submit, preventing double submits
7. **Validation** — client-side rules, when to validate (on blur vs on change vs
   on submit), server errors mapped back to fields, schema validation with Zod
8. **Accessibility** — `<label htmlFor>`, `aria-invalid`, `aria-describedby`
   for error text, focusing the first invalid field, announcing errors
9. **React 19 form features** — `<form action={fn}>`, `useActionState`,
   `useFormStatus`, `useOptimistic` for instant feedback
10. **When to adopt React Hook Form** — uncontrolled-by-default performance,
    resolver-based validation, and the cost of one more abstraction

## Exercises

- Build a checkout form: text, select, radio, checkbox, with a single state
  object and one change handler
- Add validation with inline, screen-reader-announced errors and focus
  management
- Rebuild the same form with `useActionState` + `useFormStatus` and compare

## References

- [Reacting to Input with State](https://react.dev/learn/reacting-to-input-with-state)
- [Sharing State Between Components](https://react.dev/learn/sharing-state-between-components)
- [`<input>`](https://react.dev/reference/react-dom/components/input) · [`<select>`](https://react.dev/reference/react-dom/components/select) · [`<textarea>`](https://react.dev/reference/react-dom/components/textarea)
- [`<form>`](https://react.dev/reference/react-dom/components/form)
- [`useActionState`](https://react.dev/reference/react/useActionState)
- [`useFormStatus`](https://react.dev/reference/react-dom/hooks/useFormStatus)
- [`useOptimistic`](https://react.dev/reference/react/useOptimistic)
- [`useId`](https://react.dev/reference/react/useId) — stable label/error ids
