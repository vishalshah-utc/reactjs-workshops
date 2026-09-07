# ShopCrew API

The backend every session's starter runs against. Plain ESM JavaScript on
Express 5, all data in memory, boots in ~350 ms.

```bash
npm install
npm run dev        # http://localhost:4000
```

In a session starter you never run this directly — `npm run dev` at the app
root boots the API and Vite together, and Vite proxies `/api` and `/ws`.

---

## Why it is built this way

| Decision | Reason |
|---|---|
| **Plain JS, not TypeScript** | No `tsx`, no build step, no type packages. Boots instantly and keeps the StackBlitz install small. The API is infrastructure, not workshop content. |
| **In memory, not SQLite** | `better-sqlite3` is a native module and will not load in a WebContainer. A plain object graph costs ~65 MB and resets instantly. |
| **Deterministic seed** | One fixed RNG seed, so every participant sees byte-identical data. "Look at product 4021" means the same thing to everyone in the room. |
| **Hand-rolled JWT & scrypt** | Two fewer dependencies. Documented as *not* what you'd do in production. |
| **Money in minor units** | Every amount is an integer in paise. Never a float. |

---

## Demo logins

Every seeded account uses the password **`password`**. `GET /api/dev/accounts`
returns this list at runtime.

| Email | Roles | Sees |
|---|---|---|
| `customer@shopcrew.dev` | CUSTOMER | storefront + my account |
| `csr@shopcrew.dev` | CSR | + customers, returns, impersonation |
| `catalog@shopcrew.dev` | CATALOG_MANAGER | + products, inventory, promotions |
| `fulfilment@shopcrew.dev` | FULFILMENT | + order fulfilment |
| `admin@shopcrew.dev` | ADMIN | everything |

---

## Teaching hooks

The reason this exists instead of a mock server. Append to any `/api` request:

| Hook | Effect | Used by |
|---|---|---|
| `?_delay=1500` | respond after 1.5 s (max 10 s) | S3 loading states, S9 perceived perf |
| `?_fail=500` | force a server error | S3 error states |
| `?_fail=401` | force an auth failure | S6 refresh-token flow |
| `?_fail=422` | force a field error | S7 server-error mapping |
| `?_fail=429` | force a rate limit, sets `Retry-After` | S5 retry/backoff |
| `GET /api/flaky?rate=0.4` | fails ~40% of the time | S5 retry/backoff |
| `GET /api/images/x.svg?delay=400` | slow image | S9 lazy loading |

```bash
curl "localhost:4000/api/products?limit=2&_delay=2000"
curl "localhost:4000/api/products?_fail=422" | jq .error
```

---

## Response shapes

Lists are `{ data, meta }`; single resources are `{ data }`; errors are always:

```json
{ "error": { "code": "VALIDATION_FAILED",
             "message": "Some fields need your attention",
             "fieldErrors": { "email": "That email is already registered" } } }
```

`fieldErrors` is the important part — it is what lets Session 7 map a server
rejection straight onto a React Hook Form field with `setError()`.

**Offset pagination** (admin tables): `?page=2&limit=25` →
`meta: { page, limit, total, totalPages, hasNextPage, hasPreviousPage }`

**Cursor pagination** (storefront infinite scroll): `?cursor=<opaque>&limit=24` →
`meta: { limit, nextCursor, hasMore }`

Both exist deliberately. Session 5 builds each and discusses the trade-off.

---

## Endpoints

### Auth — `/api/auth`
| | |
|---|---|
| `POST /register` | `{email, password, firstName, lastName?}` → user + tokens |
| `POST /login` | `{email, password}` → user + tokens |
| `POST /refresh` | `{refreshToken}` → new pair (old one is invalidated) |
| `POST /logout` · `POST /logout-all` | revoke one / all sessions |
| `GET /me` · `PATCH /me` | current user; update profile |
| `POST /change-password` | revokes all sessions |
| `POST /impersonate/:userId` | CSR "view as customer" |
| `GET /permissions` | roles + resolved permission list |

### Catalog — `/api`
| | |
|---|---|
| `GET /products` | `q, category, brand, tag, minPrice, maxPrice, rating, inStock, onSale, sort, page, limit` |
| `GET /products/cursor` | same filters, cursor paginated |
| `GET /products/facets` | facet counts — each facet counted against the *other* filters, not its own |
| `GET /products/:idOrSlug` | full detail with variants |
| `GET /products/:idOrSlug/related` · `/reviews` | |
| `POST /products/:idOrSlug/reviews` | auth; one review per user per product |
| `GET /categories` · `GET /brands` | with counts |

### Cart — `/api/cart`
Guest carts are keyed by an `X-Cart-Id` header the browser generates; a
signed-in user's cart is keyed by user id and always wins.

| | |
|---|---|
| `GET /cart` · `DELETE /cart` | |
| `POST /cart/items` | `{variantId, quantity}` — 422 with a `quantity` field error if stock is short |
| `PATCH /cart/items/:id` · `DELETE /cart/items/:id` | quantity 0 removes the line |
| `POST /cart/promotion` · `DELETE /cart/promotion` | 422 on `code` when invalid |
| `PATCH /cart/shipping-method` · `GET /cart/shipping-methods` | |
| **`POST /cart/merge`** | merge guest cart into the user's after login |

### Orders — `/api`
| | |
|---|---|
| `POST /checkout` | re-prices from live data, re-checks stock, per-field 422s |
| `GET /orders` · `GET /orders/:id` | the caller's own orders |
| `POST /orders/:id/cancel` | only CREATED/CONFIRMED/PAID; restocks |
| `GET /orders/:id/tracking` | step timeline |

### My account — `/api/account`
`GET|POST|PATCH|DELETE /addresses` · `GET|POST /returns` · `GET /returns/:id` ·
`GET|POST|DELETE /wishlist` · `GET /reviews`

### Back-office — `/api/admin` (staff only, permission-checked per route)
| | |
|---|---|
| `GET|POST|PATCH|DELETE /products` · `POST /products/bulk` | delete archives instead when order history exists |
| `GET /inventory` · `POST /inventory/:variantId/adjust` | |
| `GET /orders` · `GET /orders/:id` · `POST /orders/:id/status` · `POST /orders/:id/refund` | status changes are validated against a state machine and the response carries `allowedTransitions` |
| `GET /customers` · `GET /customers/:id` | with lifetime value |
| `GET /users` · `GET /roles` · `PATCH /users/:id/roles` · `PATCH /users/:id/active` | |
| `GET|POST|PATCH|DELETE /promotions` | |
| `GET /returns` · `PATCH /returns/:id` | |
| `GET /audit` · `GET /audit/actions` | 50k rows, `maxLimit=1000` on purpose |
| `GET /reports/summary` · `/revenue-series` · `/top-products` · `/by-category` | |
| `GET|PATCH /settings` · `GET /flags` · `PATCH /flags/:key` | |

### Real-time
| | |
|---|---|
| `ws://localhost:4000/ws` | WebSocket broadcast |
| `GET /api/events` | Server-Sent Events — same events, no upgrade needed |

Events: `order.created`, `order.status_changed`, `stock.changed`, `stock.low`,
`product.updated`, `return.requested`, `review.created`.
Shape: `{ type, payload, at }`.

The SSE endpoint is a real fallback, not padding: a WebSocket upgrade through a
dev-server proxy inside a browser container is the one part of this stack that
can fail for environment rather than code reasons. Session 8's lab swaps
transport in one file.

### Workshop utilities — `/api/dev`
| | |
|---|---|
| `GET /health` | counts, memory, live connection count |
| `GET /accounts` | the demo logins above |
| `POST /reset` | reseed everything; optional `{products, orders, ...}` overrides |
| `POST /simulate` | `{events, intervalMs}` — fires synthetic live events so the S8 dashboard has traffic without ten people placing orders |
| `POST /emit` | `{type, payload}` — fire one event by hand |

---

## Seeded data

| | |
|---|---|
| 5,000 products | 36 subcategories, 24 brands, 15,800 variants |
| 12,000 orders | date-skewed toward recent; ~1,500 in flight |
| 2,005 users | 5 demo accounts + 2,000 customers |
| 20,000 reviews | clustered on ~300 popular products |
| 50,000 audit rows | the Session 9 virtualization target |
| 600 returns, 5 promotions | |

Shrink it with env vars when memory is tight:

```bash
SEED_PRODUCTS=500 SEED_ORDERS=1000 SEED_AUDIT=5000 npm run dev
```

Other env vars: `PORT` (4000), `ACCESS_TTL` (900 s — set to `60` to make token
refresh happen during a lab), `REFRESH_TTL`, `ACCESS_SECRET`, `REFRESH_SECRET`.
