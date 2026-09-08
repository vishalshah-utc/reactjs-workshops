# Module 14 — Routing & Application Architecture

**Study notes** · ~2.5 hours · *status: outline — full notes to be written*

## Learning objectives

- Turn a single-screen app into a multi-page one with shareable URLs
- Treat the URL as state, and know what belongs in it
- Structure a codebase that a new team member can navigate

## Topics

1. **Why routing is not in React** — and the two families: a router library
   (React Router) vs framework file-based routing (Next.js, React Router v7)
2. **Core concepts** — routes, nested routes and layouts, `<Outlet>`, `<Link>`
   vs `<a>`, `<NavLink>` and active styling, index routes, 404 routes
3. **Dynamic segments** — `/products/:id`, `useParams`, and typing them
4. **The URL as state** — search params for filters, sort and pagination;
   `useSearchParams`; why this beats `useState` (shareable, bookmarkable,
   survives refresh, back button works)
5. **Programmatic navigation** — `useNavigate`, redirects after mutations,
   `replace` vs `push`, preserving "return to" locations
6. **Protected routes** — auth guards, role-based access, redirect-with-intent,
   and doing it without flashing protected content
7. **Data loading per route** — loaders, deferred data, pending UI; how this
   compares to fetching in a component
8. **Code splitting by route** — `lazy(() => import(...))` + `<Suspense>`; what
   it does to your bundle
9. **Deployment requirement** — the SPA fallback rewrite (all paths →
   `index.html`), and the 404-on-refresh bug when it is missing
10. **Application architecture** — feature folders vs type folders, shared
    `components/ui`, the API layer, path aliases, barrel-file trade-offs, where
    types live, and drawing dependency direction deliberately

## Exercises

- Add routes for home, product list, product detail, cart and a 404
- Move every filter, sort and page value from `useState` into search params;
  verify that the URL round-trips and the back button behaves
- Lazy-load the admin area and prove the bundle shrank
- Add a role-protected `/admin` route with a redirect that returns the user to
  where they were going

## References

- [Understanding Your UI as a Tree](https://react.dev/learn/understanding-your-ui-as-a-tree)
- [Creating a React App](https://react.dev/learn/creating-a-react-app) — routing in frameworks
- [Build a React App from Scratch](https://react.dev/learn/build-a-react-app-from-scratch) — routing when you own the stack
- [`lazy`](https://react.dev/reference/react/lazy)
- [`Suspense`](https://react.dev/reference/react/Suspense)
- [Preserving and Resetting State](https://react.dev/learn/preserving-and-resetting-state) — route changes and component identity
