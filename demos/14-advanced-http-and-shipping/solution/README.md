# ShopScope — the finished app

```bash
npm install
npm run dev              # development mode
npm run dev:staging
npm run build && npm run preview
```

This is where the fourteen demos arrive: a routed, authenticated product
explorer with a layered API module, loaders and actions, protected routes and
roles, a dark theme and a toast system in React Context, a wishlist and a persisted cart in Zustand stores, optimistic deletes, uploads behind a feature flag, retries where they're
safe, lazy routes, and a build that deploys to a static host.

| Try | Where |
|---|---|
| Server-side search, filters, paging — all in the URL | `/products?q=phone&sort=price-desc&page=2` |
| A detail page with a scoped 404 | `/products/42`, then `/products/999999` |
| Sign up (react-hook-form + zod over the field library) | **Sign up** in the header |
| Log in, watch the refresh queue | `emilys` / `emilyspass`, then **Profile → Who am I?** after a minute |
| Dark theme, and toasts from every action | the moon icon in the header; create, edit or delete a product as `emilys` |
| Protected routes and roles | signed out → `/account` · `averyp` / `averyppass` → `/account/team` |
| Admin-only catalogue editing | as `emilys`: Add product, pencils, trash |
| A cart that survives a reload, and a checkout action that reads the store | **Add to cart** on any card, the cart icon, then **Checkout** (signed in) |
| Optimistic delete | delete a card on Slow 3G |
| Upload with progress (dev/staging only) | **Profile**, below the card |

Reads are real; DummyJSON simulates writes, so created products won't persist.

Read it in the order it was built — `demos/01` through `demos/14` — or start
from the [study guide](../../../study-guides/React-Axios-HTTP-and-Routing-Study-Guide.md).

Node 22.22+.
