# Module 17 — TypeScript with React

**Study notes** · ~2.5 hours · *status: outline — full notes to be written*

## Learning objectives

- Type props, state, events, refs and hooks without fighting the compiler
- Use unions to make invalid UI states unrepresentable
- Know when a type is earning its keep and when it is ceremony

## Topics

1. **The 20% of TypeScript that covers 95% of React** — `type` vs `interface`,
   unions, literal types, optional and readonly properties, generics, utility
   types (`Pick`, `Omit`, `Partial`, `Record`, `ReturnType`)
2. **Typing props** — inline vs named type; optional props with defaults;
   `children: React.ReactNode`; discriminated unions for mutually exclusive
   prop sets
3. **`ReactNode` vs `ReactElement` vs `JSX.Element`** — which one you actually
   want
4. **Typing hooks** — `useState<T>()` and when inference is enough;
   `useState<Product | null>(null)`; `useRef<HTMLInputElement>(null)`;
   `useReducer` with an action union; typed `useContext` with a non-null
   assertion in a custom hook
5. **Events** — `React.ChangeEvent<HTMLInputElement>`,
   `React.FormEvent<HTMLFormElement>`, `React.MouseEvent`, and letting
   inference do it for inline handlers
6. **Component props from the DOM** —
   `React.ComponentProps<'button'>` for wrapper components; `ComponentProps<typeof X>`
7. **Generic components** — a typed `<DataTable<T>>`; generic custom hooks
8. **Making bad states impossible** —
   `{ status: 'loading' } | { status: 'error'; error: Error } | { status: 'ready'; data: T }`
   and exhaustive `switch` checking
9. **Typing API responses** — where types come from (hand-written, generated
   from OpenAPI, inferred from a Zod schema); parsing at the boundary rather
   than casting
10. **Escape hatches and their cost** — `any` vs `unknown`, `as`, non-null `!`,
    `satisfies`; when a cast is a bug waiting to happen
11. **`tsconfig` settings that matter** — `strict`, `noUncheckedIndexedAccess`,
    path aliases

## Exercises

- Type an existing untyped feature end to end; count the bugs the compiler finds
- Write a `<Select<T>>` that infers its option type and rejects a mismatched
  `onChange`
- Replace three booleans with a discriminated union and make the `switch`
  exhaustive

## References

- [Using TypeScript](https://react.dev/learn/typescript)
- [Using TypeScript: Typing hooks](https://react.dev/learn/typescript#example-hooks)
- [Passing Props to a Component](https://react.dev/learn/passing-props-to-a-component)
- [`useState`](https://react.dev/reference/react/useState) · [`useReducer`](https://react.dev/reference/react/useReducer) · [`useRef`](https://react.dev/reference/react/useRef) · [`useContext`](https://react.dev/reference/react/useContext)
- [Choosing the State Structure](https://react.dev/learn/choosing-the-state-structure)
