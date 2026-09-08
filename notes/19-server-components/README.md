# Module 19 — Server Components & Modern React 19

**Study notes** · ~2.5 hours · *status: outline — full notes to be written*
**Prerequisite: [Module 3](../03-rendering-architectures/).**

## Learning objectives

- Explain the server/client boundary and place it deliberately
- Fetch data in a Server Component and mutate through a Server Function
- Use React 19's Actions and optimistic UI

## Topics

1. **Recap from Module 3** — CSR/SSR/SSG, hydration, streaming, islands
2. **Server Components** — run on the server or at build time, ship zero
   JavaScript, can be `async`, can read the database directly, cannot use state
   or effects or browser APIs
3. **Client Components** — `'use client'` as a *boundary*, not a file switch;
   everything imported below it becomes client code; put it as deep as possible
4. **Composition across the boundary** — passing server-rendered JSX as
   `children` into a client component; serialisable props only; the errors you
   get when you break the rule
5. **Server Functions and `'use server'`** — mutations without an API route,
   progressive enhancement, revalidation after a write, security (they are
   public endpoints: validate and authorise inside them)
6. **Actions** — `<form action={fn}>`, `useActionState` for pending/error state,
   `useFormStatus` in a nested submit button, `useOptimistic` for instant
   feedback with automatic rollback
7. **Suspense and streaming in practice** — boundary placement, loading
   skeletons per section, avoiding the request waterfall
8. **The `use` hook** — reading a promise or context during render
9. **Caching and revalidation** — the concepts (request memoisation, data cache,
   route cache, on-demand invalidation) and why they are framework-specific
10. **When RSC is not the answer** — heavily interactive, auth-only apps where a
    client SPA remains the simpler and correct choice
11. **Other React 19 changes worth knowing** — `ref` as a prop, document
    metadata hoisting, stylesheet and script handling, improved error messages,
    `useDeferredValue` initial value

## Exercises

- Convert a client-fetched product page into a Server Component; measure the
  bundle before and after
- Push a `'use client'` boundary from a page down to a single button and observe
  what leaves the bundle
- Implement add-to-cart as a Server Function with `useOptimistic`, then make the
  server fail and watch the rollback

## References

- [Server Components](https://react.dev/reference/rsc/server-components)
- [Server Functions](https://react.dev/reference/rsc/server-functions)
- [`'use client'`](https://react.dev/reference/rsc/use-client)
- [`'use server'`](https://react.dev/reference/rsc/use-server)
- [`useActionState`](https://react.dev/reference/react/useActionState)
- [`useFormStatus`](https://react.dev/reference/react-dom/hooks/useFormStatus)
- [`useOptimistic`](https://react.dev/reference/react/useOptimistic)
- [`use`](https://react.dev/reference/react/use)
- [`Suspense`](https://react.dev/reference/react/Suspense)
- [React 19 release notes](https://react.dev/blog/2024/12/05/react-19)
- [Creating a React App](https://react.dev/learn/creating-a-react-app)
