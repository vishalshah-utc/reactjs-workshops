# ShopScope — Demo 11 starter

```bash
npm install
npm run dev
```

**Your instructions are in [the demo guide](../README.md).**

## Where you are starting from

**Demo 10, finished** — loaders, actions, fetchers, pending UI, error
boundaries. Anyone can do anything; there is no user.

New stubs: `src/lib/tokenStore.ts`, `src/api/services/auth.ts`,
`src/api/interceptors/{auth,refresh}.js`, `src/routes/LoginPage.tsx`,
`src/routes/middleware.ts`, `src/routes/account/AccountLayout.tsx`.
Finished: `src/routes/account/{ProfilePage,CartsPage,TeamPage}.tsx`,
`src/api/services/users.ts`, new `auth`/`users` entries in `endpoints.ts`.

## Accounts

| Username | Password | Role |
|---|---|---|
| `emilys` | `emilyspass` | admin |
| `averyp` | `averyppass` | user |

Access tokens are set to expire after **1 minute** so you can watch the
refresh flow happen.

## What you build

Search for `TODO(lab-` — fourteen markers.

| Marker | File |
|---|---|
| `lab-1.1` | `src/lib/tokenStore.ts` |
| `lab-1.2` | `src/api/services/auth.ts` |
| `lab-2.1`, `2.2`, `2.3` | `src/api/interceptors/{auth,refresh,index}.js` |
| `lab-3.1`, `4.3` | `src/routes/LoginPage.tsx`, `src/router.tsx` |
| `lab-3.2` | `src/routes/RootLayout.tsx` |
| `lab-3.3` | `src/components/SiteHeader.tsx` |
| `lab-4.1` | `src/routes/middleware.ts` |
| `lab-4.2`, `5.1` | `src/routes/account/AccountLayout.tsx` |
| `lab-5.2` | `src/routes/ProductsPage.tsx` |
| `lab-5.3` | `src/routes/RootErrorBoundary.tsx` |

## ⚠️ Don't re-click the starter link

Bookmark the `stackblitz.com/edit/…` URL once it loads.

## Finished version

[`../../12-context-and-reducers/starter`](../../12-context-and-reducers/starter).

## Commands

```bash
npm run dev · npm run typecheck · npm run lint · npm run build
```

Node 22.22+.
