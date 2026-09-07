# ReactJS Professional Workshop Series — Course Plan

> **Status:** v2 draft, decisions D1–D3 locked, awaiting D5 (GitHub org).
> **Owner:** Vishal Shah · **Revised:** 2026-09-07

## Decisions locked

| # | Decision | Chosen |
|---|---|---|
| D1 | Language | **TypeScript from Session 1**, ramped gently |
| D2 | UI | **Tailwind CSS v4 + shadcn/ui**, components pre-vendored |
| D3 | Session length | **2 hours** × 10 = 20 h live |
| D4 | Product | **ShopCrew** — commerce storefront + back-office (§2) |
| D5 | Repo | **Public repo, not a template**: `vishalshah-utc/reactjs-workshops` (§6) |

---

## 1. Goal & success criteria

Ten live, hands-on sessions after which a participant can **join an
enterprise React codebase and be productive without hand-holding** — not
just "knows hooks", but: can read an unfamiliar feature folder, add a
route + form + server mutation, debug a re-render problem, write the
test, and defend the design in code review.

Concretely, each participant **builds one real product end to end** — a
commerce platform with **both a customer dashboard and an admin
back-office** — against a **real backend API** with auth, roles,
pagination, real-time events and file upload.

**Explicit non-goal:** this is not a CSS course. Tailwind is taught only
as much as it takes to read and adjust the pre-built components.

---

## 2. The product: **ShopCrew** — storefront + back-office

A commerce platform with three surfaces: a **storefront**, a **My Account**
area (the user dashboard), and a **back-office** (the admin dashboard).

**Chosen because it scores highest on the stated criterion** — an
instantly understood business flow, and the widest coverage of standard
enterprise UI requirements. Four of the hardest sessions get their
*canonical* example rather than an invented one (see §2.2).

### 2.1 Continuity with `ecommerce-microservices-workshop`

The API is a deliberate **superset of the existing Java domain model**, so
anyone who took that course starts at zero domain ramp — *"you built the
backend services; now build the frontend that consumes them."*

| Existing Java entity | ShopCrew API |
|---|---|
| `Product(sku, name, description, price, stockQuantity, category)` | same fields, **plus** `slug, brand, compareAtPrice, images[], rating, reviewCount, variants[], attributes` |
| `AppUser(username, email, passwordHash, roles[])` | same shape |
| `Role {USER, ADMIN}` | → `{CUSTOMER, CSR, CATALOG_MANAGER, FULFILMENT, ADMIN}` |
| `Order(customerUsername, status, totalAmount, items[])` | same shape |
| `OrderStatus {CREATED, CONFIRMED, REJECTED}` | → **+** `PAID, PACKED, SHIPPED, DELIVERED, CANCELLED, RETURNED, REFUNDED` |
| `OrderItem` | same, **plus** `variantId, unitPrice, discount` |
| — | **new:** `Cart, Address, Review, Promotion, Return, Category, Brand, InventoryLevel, AuditLog` |

### 2.2 Storefront + My Account (the user dashboard)

| Feature | React concept it forces |
|---|---|
| Faceted product listing — category, brand, price, rating, in-stock | **URL as state** (S4), infinite scroll (S5) |
| Product detail — variant matrix, gallery, stock, reviews | derived state, image performance (S9) |
| Cart — lines, quantity, promo code, tax/shipping totals | `useReducer` (S2), optimistic updates (S5), the client-vs-server-state debate (S8) |
| Checkout — address → shipping → payment → review | **the canonical multi-step wizard** (S7) |
| Order history, order detail, live tracking | routing (S4), real-time (S8) |
| Returns / RMA request with photos | file upload, approval flow (S7) |
| Addresses, payment methods, wishlist, my reviews | CRUD, forms, persistence |

### 2.3 Back-office (the admin dashboard)

| Feature | React concept it forces |
|---|---|
| **Live orders wall** — new orders arrive in real time | **WebSockets → Query cache** (S8) |
| Order detail — fulfil, ship, refund | status state machine, mutations |
| Catalog — products, **variant matrix**, bulk edit, CSV import | `useFieldArray` (S7), bulk actions |
| Inventory — stock levels, live low-stock alerts | real-time (S8) |
| Customers — list, detail, **CSR "view as customer"** | RBAC, impersonation (S6) |
| **Promotion rule builder** — conditions & actions | dynamic nested forms (S7) |
| Returns approval queue | approval chain |
| Reports — revenue, AOV, top products | charts, memoization |
| Users & roles, audit log (50k rows), feature flags | permission-gated UI, **virtualization** (S9) |

### 2.4 Why this domain beats the alternatives

- **S4** — a faceted PLP URL (`?category=laptops&brand=dell&price=500-1000&sort=price_asc&page=2`) is the definitive "send a colleague your filtered view" example.
- **S5** — add-to-cart and quantity change are the textbook optimistic updates.
- **S7** — checkout *is* the multi-step wizard; every participant has walked one.
- **S8** — *"is the cart client state or server state?"* The real answer — guest cart local, logged-in cart server, **merged on login** — is a genuine architecture lesson, not a toy.
- **S9** — an image-heavy product grid is the *real-world* performance problem. The virtualized admin table is still there too.

**Its one genuine weakness is real-time**, weaker than a service-desk
domain. Closed with features real stores actually have: the admin
live-orders wall, live stock decrement on the PDP, low-stock alerts, and
order tracking. Session 8's cold open: two browser windows, buy the last
item in one, watch the other still say "in stock".

## 3. Technology stack

Versions verified against npm on 2026-09-07. Exact pins locked after the
StackBlitz spikes (§8). **No `^` ranges anywhere** — 20 app folders must
resolve identically for every participant, forever.

### Frontend
| Concern | Choice | Why |
|---|---|---|
| Runtime | **React 19.2** | Actions, `useOptimistic`, `useActionState`, `use()`, ref-as-prop all taught |
| Build | **Vite 8** (fallback 7.3.6) | Pinned to whatever StackBlitz's Node supports |
| Language | **TypeScript 5.9/7** | Conservative pin decided at spike time |
| Styling | **Tailwind CSS 4.3 + `@tailwindcss/vite`** | CSS-first config — no `tailwind.config.js`, no PostCSS file, one Vite plugin line |
| Components | **shadcn/ui (Radix + CVA), pre-vendored** | See §3.1 |
| Icons | **lucide-react 1.42** | |
| Routing | **React Router 7.18** | |
| Server state | **TanStack Query v5** | |
| Client state | **Context + `useReducer`, then Zustand 5** | Taught as a *decision*, not a default |
| Forms | **React Hook Form 7 + Zod 4** | |
| HTTP | native `fetch` first, then a wrapper with interceptors | Primitive before abstraction |
| Charts | **Recharts 3** | |
| Virtualization | **@tanstack/react-virtual 3** | |
| Testing | **Vitest + RTL + user-event + MSW 2**; **Playwright** local-only | |
| Quality | ESLint flat config + `jsx-a11y` + Prettier + `tsc --noEmit` + Husky | |

### 3.1 How shadcn/ui is handled — the friction fix

shadcn/ui is **not a dependency**, it's a set of source files you own.
Running its CLI in 20 folders during a live session would be a disaster.
So:

- **Every component is pre-vendored** into `src/components/ui/` in each
  starter — already there, already styled, already imported. Participants
  never run `npx shadcn add` during a session.
- The `shadcn` CLI is documented in `docs/concepts/design-system.md` as
  the "how to add more later" path, and used *once* as a homework task in
  Session 9.
- **This is a genuine win for the course, not a compromise:** Radix
  primitives are accessible by default (focus traps, ARIA wiring, keyboard
  nav), which makes the a11y content in Sessions 7, 8 and 10 concrete
  instead of theoretical. And because they're plain source files, they're
  the perfect subject for Session 9's advanced-patterns lab — participants
  read and extend real compound components rather than toy ones.
- Tailwind v4 removes the setup tax that worried me: `@import "tailwindcss"`
  in one CSS file, `@theme` for design tokens, `tailwindcss()` in
  `vite.config.ts`. No config file to break.

### Backend — `shopcrew-api`
| Concern | Choice |
|---|---|
| Runtime | Node, **Express 5**, TypeScript via `tsx` |
| Storage | **In-memory, seeded from JSON** + `POST /api/dev/reset`. *No SQLite* — native bindings don't work in WebContainers |
| Auth | JWT access (15 min) + refresh (7 d) rotation, `bcryptjs` (pure JS) |
| Real-time | **WebSocket (`ws`)**, **SSE as validated fallback** (risk R2) |
| Docs | OpenAPI page served at `/docs` |
| Upload | `multer` to memory |

**Deliberate teaching hooks** — what makes labs feel real instead of happy-path:
- `?_delay=1500` — force a slow response, so skeletons matter.
- `?_fail=500|401|422` — force a specific failure on demand.
- `/api/flaky` — fails ~40% of the time, for retry/backoff labs.
- Both cursor **and** offset pagination (two endpoints, on purpose).
- Rate-limit headers and a 429 endpoint.
- 422 responses with **per-field** errors, so server-error→form-field
  mapping is a real lab.
- Seeded at genuine scale: ~5,000 products across ~40 categories/brands,
  ~12,000 orders, ~20,000 reviews, ~50,000 audit rows.

**Two ways to run, always:** bundled (`npm run dev` boots Vite + API in
one WebContainer via `concurrently`, Vite proxies `/api` and `/ws` →
`:4000`), or a hosted public instance set by one line in `.env`.

---

## 4. Fitting a professional curriculum into 2-hour sessions

20 hours of live time is tight for this scope. The plan handles it by
making three things load-bearing rather than optional:

**Per-session shape (120 min), 4 labs not 5:**

| Block | Min |
|---|---|
| Rewind quiz | 5 |
| Cold open — live demo of the pain today solves | 10 |
| Lab 1 · Lab 2 | 22 + 22 |
| Break | 7 |
| Lab 3 · Lab 4 | 22 + 22 |
| Wrap-up, TEACH segment, homework brief | 10 |

**Pre-work (~20 min, required):** read that session's one-page
`CHEATSHEET.md`, and **open the StackBlitz starter so `npm install`
finishes before the session begins.** Cold-boot install is otherwise 3–5
minutes of dead room time, ten times over.

**Homework (~45–60 min, with reference solution):** one feature that
extends the same app. Not optional — several concepts land here by
design, listed explicitly per session below.

**Self-study (`docs/concepts/`):** deep-dive notes for material that
doesn't need live guidance.

### What the 2-hour format costs — stated plainly

Against a 3-hour plan, these move out of live lab time:

| Topic | Where it goes now |
|---|---|
| i18n (`react-i18next`) | self-study + S10 homework |
| Playwright E2E | local-only walkthrough in S10, not a live lab (can't run in StackBlitz anyway) |
| React 19 Actions (`useActionState`/`useFormStatus`) | 10-min TEACH in S7 wrap-up + self-study |
| Recharts / data viz | S5 and S9 homework, pre-built chart components in the starter |
| Render props & HOCs | self-study (S9) — hooks replaced most of it |
| Bundle analysis | S9 homework with a scripted walkthrough |

If any of these must be live, say so and I'll swap it against a lab.

---

## 5. The ten sessions

Every session ends with a **working, demoable app**. Nothing is left
half-built between sessions.

---

### Session 1 — Foundations & the Component Model
**Ship:** storefront shell + a static product grid that already looks like a real store.

| Lab | Content |
|---|---|
| 1 | Project anatomy (Vite/TS/Tailwind v4/shadcn); JSX properly — expressions, fragments, `className`; the header/nav component |
| 2 | **Props & composition over configuration** — `ProductCard`, `PriceTag`, `Badge`, `Rating`, built with `children` |
| 3 | **Lists & keys** — the product grid. Break the key deliberately: wishlist state jumps to the wrong card. Conditional rendering — sale badge, out-of-stock, free-shipping |
| 4 | First `useState` (filter drawer / mobile nav) + React DevTools tour |

- **Cold open:** the same grid in vanilla DOM-mutation JS, then in React.
- **Homework:** `ProductCard` variants (grid/list/compact), `EmptyState`, skeleton card.
- **Self-study:** TypeScript for React — typing props, `type` vs `interface`.

---

### Session 2 — State, Events & Controlled UI
**Ship:** a working product listing with facets, sort and search; admin product CRUD in local state.

| Lab | Content |
|---|---|
| 1 | State vs props; what triggers a re-render; **immutability** — `cart.items.push()` renders nothing, live; the functional updater |
| 2 | **Lifting state up** + **derived state is not state** — the facet/sort/search toolbar *computes* the filtered list, never stores it |
| 3 | **Controlled inputs** — the admin Add/Edit Product dialog (shadcn `Dialog` + `Form`) |
| 4 | **`useReducer`** — the **cart reducer** (`ADD`, `REMOVE`, `SET_QTY`, `APPLY_PROMO`, `CLEAR`). The textbook case for reducer over `useState` |

- **Cold open:** add three items to the cart and watch the badge stay at zero.
- **Homework:** bulk-select + bulk price update in admin, with an indeterminate header checkbox.
- **Self-study:** synthetic events, delegation, `preventDefault`.

---

### Session 3 — Effects, the Network & Custom Hooks
**Ship:** products come from the real API. Loading / error / empty states everywhere.

| Lab | Content |
|---|---|
| 1 | First `fetch`; the **four-state async model** (loading/error/empty/data) + skeletons. `?_delay` and `?_fail` make all four reachable on demand |
| 2 | Dependency arrays, the stale-closure trap, cleanup; **StrictMode double-invoke** and why it's a feature |
| 3 | **Race conditions** — type fast in the search box, get results for a query you already deleted; fixed with `AbortController` |
| 4 | **Custom hooks** — extract `useDebounce`, `useLocalStorage` (the guest cart), `useProducts` |

- **Cold open:** search for "lap", then "laptop", and watch the wrong results win.
- **Homework:** persist the guest cart across reloads; `useOnlineStatus`.
- **Self-study:** `useEffect` anti-patterns — what it is *not* for.

---

### Session 4 — Routing & Application Architecture
**Ship:** a real multi-page storefront, plus the folder architecture the rest of the course lives in.

| Lab | Content |
|---|---|
| 1 | React Router 7 — `createBrowserRouter`, nested routes, layout routes, `<Outlet/>`, `NavLink` (home / category / PDP / cart) |
| 2 | Dynamic params (`/products/:slug`), index routes, splat 404, `errorElement` + **error boundaries** |
| 3 | **`useSearchParams` as state** — the faceted listing URL: `?category=laptops&brand=dell&price=500-1000&sort=price_asc&page=2`. Shareable, refreshable, back-button-correct. **The session's big idea** |
| 4 | **Feature-sliced refactor** (`components/` soup → `features/catalog/…`), `@/` aliases, an ESLint rule enforcing import boundaries, `React.lazy` + `<Suspense>` route splitting with the network tab open |

- **Cold open:** try to send a colleague "laptops under ₹50k, sorted by price" — and discover you can't.
- **Homework:** breadcrumbs from the category tree; prefetch-on-hover.
- **Self-study:** error boundary patterns, route-level vs app-level.

---

### Session 5 — Server State with TanStack Query
**Ship:** all hand-rolled fetching deleted. Infinite-scroll listing, optimistic cart.

| Lab | Content |
|---|---|
| 1 | **Server state ≠ client state**; `useQuery`, query keys as a dependency graph, `staleTime` vs `gcTime`, Devtools |
| 2 | `useMutation` + `invalidateQueries` (admin product CRUD); global error handling; retry & backoff against `/api/flaky` |
| 3 | **Optimistic add-to-cart and quantity change**, with proper `onError` rollback |
| 4 | Offset pagination with `placeholderData`, then **`useInfiniteQuery`** on the product listing |

- **Cold open:** delete Session 3's entire custom fetching layer on screen.
- **Homework:** prefetch the PDP on card hover; dependent queries (variant → stock); price-history chart (Recharts).
- **Self-study:** cache lifecycle in depth; React 19 `use()` + Suspense — where it fits, where Query still wins.

---

### Session 6 — Auth, RBAC & the Storefront/Back-office Split
**Ship:** login/register/guest checkout, and **the app forks into My Account and the back-office**.

| Lab | Content |
|---|---|
| 1 | Login + `AuthProvider` + `useAuth`; session bootstrap on reload and killing the "auth flash" |
| 2 | The fetch wrapper: transparent **401 → refresh**, including the **concurrent-401 stampede** and how to queue it |
| 3 | Protected routes (My Account, Checkout) and **redirect-back-to-intended-URL** — the classic "log in to check out" flow |
| 4 | **The fork** — roles `CUSTOMER / CSR / CATALOG_MANAGER / FULFILMENT / ADMIN`; `<Can permission="product:delete">` and why hiding a button is UX, not security; **guest-cart → user-cart merge on login** |

- **Cold open:** open `/admin/products` as a customer and read the 403.
- **Homework:** multi-tab logout sync via `storage` events; the admin customer list with CSR "view as customer".
- **Self-study:** token storage tradeoffs — memory vs `localStorage` vs httpOnly cookie.

---

### Session 7 — Production-Grade Forms
**Ship:** the checkout wizard, the promotion rule builder, the product variant matrix.

| Lab | Content |
|---|---|
| 1 | RHF's uncontrolled model and the re-render win (**measured live** against Session 2's controlled dialog); **Zod as single source of truth**, TS types inferred from schema; `Controller` for shadcn inputs; accessible errors via Radix |
| 2 | **`useFieldArray`** — the product variant matrix (size/colour/SKU/price/stock) and the promotion rule builder (conditions & actions) |
| 3 | **The checkout wizard** — address → shipping → payment → review. Per-step schemas, resumable draft, unsaved-changes route guard |
| 4 | **Mapping server 422 errors onto specific fields** — invalid promo code, declined card, failed address validation — plus async unique-SKU validation |

- **Cold open:** submit checkout, get a generic red banner, and fail to find which field was wrong.
- **Homework:** product image upload with preview + progress; the return/RMA request with photos.
- **TEACH (wrap-up, 10 min):** React 19 Actions — `useActionState`, `useFormStatus`, `useOptimistic`; where they replace this stack and where they don't.

---

### Session 8 — Global State, Real-Time & Notifications
**Ship:** the admin live-orders wall, live stock, toasts and a ⌘K palette.

| Lab | Content |
|---|---|
| 1 | **The global-state decision tree**: URL → server cache → local → context → store. The live case: **"is the cart client state or server state?"** — guest local, logged-in server, merged on login. Context done right: the **re-render trap** and its three fixes |
| 2 | **Zustand** — store design, selectors, slices, `persist`/`devtools`; theme, toasts, cart drawer, ⌘K palette; when to prefer it over Context |
| 3 | **WebSockets in React** — connection lifecycle, reconnect with backoff, heartbeat, cleanup on unmount |
| 4 | **The live orders wall** — a new order slides into the admin table, a low-stock alert fires, PDP stock decrements live. Events feed the Query cache via `setQueryData` instead of a parallel state tree; reconciling a server event that disagrees with an optimistic update |

- **Cold open:** two browser windows — buy the last item in one, the other still says "in stock".
- **Homework:** notification centre with `createPortal` + focus management.
- **Self-study:** SSE vs WebSocket vs polling — choosing.

---

### Session 9 — Performance & Advanced Component Patterns
**Ship:** a fast image-heavy listing, and the admin product/audit grid on a reusable generic `<DataTable>`.

| Lab | Content |
|---|---|
| 1 | **Measure first** — React Profiler, highlight-re-renders, finding the referential-identity bug in the listing page live |
| 2 | `React.memo` / `useMemo` / `useCallback` — **and the more common case where they're pure cost**; what React Compiler auto-memoizes in 2026 and what it still doesn't |
| 3 | `useTransition` + `useDeferredValue` on facet filtering; **virtualization** of the 50k-row admin grid; **image performance** — lazy loading, `srcset`, aspect-ratio, LCP. The real-world perf problem |
| 4 | **Build the generic `<DataTable>`** — compound components, generics in props (typed to its row), ref-as-prop, `useImperativeHandle` |

- **Cold open:** scroll the listing page and watch it jank behind a 4 MB hero image.
- **Homework:** bundle analysis + code splitting; polymorphic `as` prop; add one new shadcn component with the CLI.
- **Self-study:** render props & HOCs, and why hooks replaced most of them.

---

### Session 10 — Testing, Quality Gates & Shipping
**Ship:** a tested, linted, CI'd, deployable app — plus each participant's capstone slice.

| Lab | Content |
|---|---|
| 1 | **Vitest + RTL + user-event**; query priority (`getByRole` first); test behaviour not implementation; test the cart reducer and the checkout form |
| 2 | **MSW 2** — mock at the network layer; test a Query hook, a protected route, the Zustand cart store; `act()` warnings, async utils, fake timers |
| 3 | **Quality gates** — ESLint flat config + `jsx-a11y`, Prettier, `tsc --noEmit` strict, Husky + lint-staged, GitHub Actions CI, coverage thresholds that mean something |
| 4 | **Ship** — env config per environment, build + preview, `Dockerfile` + nginx, error boundary → error reporting (Sentry-shaped), Web Vitals, bundle budget |

- **Cold open:** a green build that ships a checkout which silently drops the promo code.
- **Capstone (homework):** pick one unbuilt feature — reviews & Q&A, wishlist, returns queue, loyalty points — and ship it with tests; peer code review against `docs/CODE_REVIEW_CHECKLIST.md`.
- **TEACH (wrap-up, 10 min):** where React is going — RSC, Next.js/Remix, when a SPA is still right, and exactly which of your ten sessions transfers.
- **Local-only walkthrough:** Playwright browse → add to cart → checkout smoke test (cannot run in StackBlitz).
- **Self-study:** i18n with `react-i18next`, RTL layout, multi-currency.

---

### Coverage check

| Enterprise requirement | Live | Homework | Self-study |
|---|---|---|---|
| Component model & composition | 1, 9 | 1 | 9 |
| State management (all layers) | 2, 5, 8 | 2 | 8 |
| Side effects & async | 3, 5 | 3 | 3 |
| Routing & app architecture | 4 | 4 | 4 |
| Server state & caching | 5 | 5 | 5 |
| Auth & RBAC | 6 | 6 | 6 |
| Forms & validation | 7 | 7 | 7 |
| Real-time | 8 | 8 | 8 |
| Performance | 9 | 9 | — |
| Reusable component library | 9 | 9 | 9 |
| TypeScript with React | 1→10 | — | 1 |
| Testing | 10 | 10 | — |
| Accessibility | 7, 8, 10 | 8 | — |
| CI/CD & deployment | 10 | 10 | — |
| React 19 features | 5, 9 | — | 5, 7 |
| i18n | — | 10 | 10 |
| Code review & standards | 4, 10 | 10 | — |

---

## 6. Repository design

**Repo:** `reactjs-workshops`, public.

```
reactjs-workshops/
├── README.md                     # landing page: the 20 StackBlitz buttons
├── SETUP_GUIDE.md                # StackBlitz path, local path, troubleshooting
├── PARTICIPANT_HANDBOOK.md       # how the course works, conventions, glossary
├── TRAINER_HANDBOOK.md           # running the series, timing, recovery plans
├── PLAN.md                       # this file
│
├── api/                          # canonical backend — single source of truth
│   ├── src/{routes,domain,seed,ws,middleware}/
│   ├── openapi.yaml
│   └── README.md                 # every endpoint, with curl examples
│
├── sessions/
│   ├── 01-foundations/
│   │   ├── README.md             # participant guide for this session
│   │   ├── TRAINER.md            # minute-by-minute (SAY / DO / ASK / TEACH)
│   │   ├── CHEATSHEET.md         # one page, printable, also the pre-work
│   │   ├── HOMEWORK.md
│   │   ├── starter/              # ← self-contained, opens in StackBlitz
│   │   │   ├── package.json
│   │   │   ├── .stackblitzrc
│   │   │   ├── server/           # synced copy of ../../../api
│   │   │   └── src/              # with // TODO(lab-3.1): markers
│   │   └── solution/             # ← self-contained, opens in StackBlitz
│   ├── 02-state-and-events/
│   │   └── … through …
│   └── 10-testing-and-shipping/
│
├── docs/
│   ├── concepts/                 # the self-study deep dives
│   ├── design-system.md          # Tailwind tokens + how to add shadcn components
│   ├── CODE_REVIEW_CHECKLIST.md
│   └── SLIDE_PROMPTS.md
│
├── scripts/
│   ├── sync-api.mjs              # api/ → every sessions/*/{starter,solution}/server
│   ├── verify-continuity.mjs     # asserts solution(N) ≡ starter(N+1) baseline
│   └── verify-builds.mjs         # install + typecheck + build all 20 folders
│
└── .github/workflows/ci.yml
```

### Three rules that keep 20 app folders from rotting

1. **Self-contained folders.** Every `starter/` and `solution/` has its
   own `package.json` and `server/`. StackBlitz opens a subdirectory and
   runs one `npm install` — no monorepo, no workspaces, no symlinks
   (WebContainers don't do symlinks).
2. **`solution(N)` is the ancestor of `starter(N+1)`**, enforced in CI.
   **Consequence: anyone who misses a session rejoins cleanly at the next
   one** — one link, no catch-up.
3. **The API lives in exactly one place** (`api/`), copied out by
   `sync-api.mjs`. CI fails if any copy has drifted.

### StackBlitz distribution — verified, and why the repo is NOT a template

Repo: **https://github.com/vishalshah-utc/reactjs-workshops** (public).

Verified against StackBlitz docs (2026-09-07):
- Subdirectory links work: `/github/OWNER/REPO/tree/BRANCH/PATH`.
- A plain `/github/` open is **read-only**; the first edit-and-save triggers
  a page reload and hands the participant their own copy. Prefixing
  **`/fork/`** skips that reload and gives an editable copy immediately.
- Committing back to GitHub is a **Codeflow** feature and needs a
  GitHub-connected StackBlitz account.
- Free Personal plan: unlimited **public** projects; private needs paid.

**Decision: keep it a plain public repo. Do not enable the template flag.**

1. **Templates break the hotfix path.** "Use this template" creates a repo
   with fresh, *unrelated* history. When a starter bug is fixed mid-course,
   participants cannot `git pull upstream main` — it fails with "refusing to
   merge unrelated histories". A **fork** shares history and gets GitHub's
   one-click **Sync fork** button. If a participant wants their own repo,
   fork strictly dominates template.
2. **Nobody needs their own repo for the course to work.** Rule 2
   (`solution(N)` is the ancestor of `starter(N+1)`) means every session
   begins from a fresh authoritative starter. Continuity lives in the course
   repo, not in participant code.
3. **In-session friction is what kills workshops.** Use-this-template → name
   → create → connect StackBlitz → authorize → open → install is 5–10 min
   with several failure modes (org SSO, app permissions). A `/fork/` link is
   one click, zero auth.

**Three-tier access, so nobody is ever blocked:**

| Tier | Who | Link / action |
|---|---|---|
| **Default — every session** | everyone | `https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/sessions/0N-xxx/starter` — one click, no auth, editable immediately |
| **Persistence** *(optional, S1 pre-work)* | anyone who wants work saved between sessions | Sign in to StackBlitz with GitHub (free, unlimited public projects). Edits then persist to their StackBlitz account |
| **Own GitHub repo** *(optional)* | anyone who wants to commit / do the S10 PR review | **Fork** the course repo → Sync-fork button for hotfixes → Codeflow to commit. Required only for the Session 10 peer-review capstone |

Each app folder gets `.stackblitzrc` (`installDependencies: true`,
`startCommand: "npm run dev"`) so the link boots into a running app with the
API already up. `npm run dev` = `concurrently` running the API on `:4000`
and Vite on `:5173` proxying `/api` and `/ws`.

Also supported: `git clone && npm install && npm run dev` locally, plus a
`.devcontainer/` for locked-down laptops.

### Per-session guide format

Carried over from your Docker workshops, which worked:
**Problem** (what actually hurts) → **Concept** (the idea, plainly) →
**Solution** (step by step) → **Verify** (a command, or a thing you see) →
**Watch out** (the specific error you'll hit) → **Tiny Challenge** →
**Real-life example**.

React-specific additions: every lab names the **file to open**, and
starters carry numbered `// TODO(lab-2.1):` markers so nobody gets lost
in the tree.

---

## 7. Deliverables

**Per session (×10):** starter app · solution app · participant README ·
trainer script · one-page cheat sheet · homework brief + reference
solution · slide prompts.

**Once:** the backend API + OpenAPI docs · README with all 20 StackBlitz
links · setup guide · participant handbook · trainer handbook ·
`docs/concepts/` self-study set · code review checklist · CI · a deployed
public API instance · a deployed demo of the finished app.

---

## 8. Risks & de-risking spikes — run *before* writing ten sessions

| # | Risk | Spike / mitigation |
|---|---|---|
| **R1** | Vite + Express + `tsx` together may be heavy in one WebContainer tab | **Spike 1:** build one full starter, open it from GitHub in StackBlitz, measure cold-boot and memory. Fallback: precompiled plain-JS API, no `tsx` |
| **R2** | WebSocket upgrade through the Vite proxy may not survive WebContainer | **Spike 2:** prove WS end-to-end in StackBlitz *before* Session 8 is written. Fallback: **SSE** — a fine teaching substitute |
| **R3** | StackBlitz's Node may be below Vite 8 / Vitest 5 requirements (Node ≥22.12) | Spike 1 prints `node -v`; pin Vite 7.3.6 / Vitest 4.1.11 if needed |
| **R8** | **Tailwind v4's `@tailwindcss/oxide` is a native Rust binary**; WebContainers can't run native code | Tailwind v4 ships a WASM build (`oxide-wasm32-wasi`) for exactly this, but **Spike 1 must confirm it resolves and builds in StackBlitz.** Fallback: Tailwind v3 (pure JS/PostCSS), same utility classes, shadcn components adjusted |
| **R4** | Playwright can't run browsers in StackBlitz | S10's E2E lab is explicitly **local-only**; Vitest/RTL still run in StackBlitz. Flagged up front in the guide |
| **R5** | 20 app folders drift out of sync | `sync-api.mjs` + `verify-continuity.mjs` + `verify-builds.mjs` in CI |
| **R6** | Mixed-ability room; some fall behind | Rule 2 means "reset to checkpoint" is always one link away |
| **R7** | **2 h × 10 is tight for this scope** | Pre-work + homework are load-bearing (§4), and §4 lists exactly what moved out of live time so you can veto any of it |

---

## 9. Implementation order

| Phase | Output |
|---|---|
| **0** | GitHub org confirmed, repo created, **Spikes 1 & 2 run and reported** |
| **1** | `api/` complete + seeded + OpenAPI + deployed |
| **2** | Repo skeleton, the three scripts, CI, README, handbooks, design system, session template |
| **3** | **Sessions 1–3 complete** (starter, solution, all four docs each) — *review checkpoint* |
| **4** | Sessions 4–6 |
| **5** | Sessions 7–8 |
| **6** | Sessions 9–10 + capstone + code-review checklist |
| **7** | Full dry run: every StackBlitz link, every lab, end to end |

I'd suggest reviewing after **Phase 0** (spike results may change pins)
and again after **Phase 3** — one complete session is far easier to
critique than a plan.

**Note on the directory:** `/Users/vishalshah/uptimecrew/reatjs-workshops`
exists as an empty **file** (0 bytes) and is misspelled. I created
`/Users/vishalshah/uptimecrew/reactjs-workshops/` and left the stray file
alone — say the word and I'll delete it.

---

## 10. Open items

| # | Item | Status |
|---|---|---|
| 1 | Product domain | **Settled — ShopCrew** (§2) |
| 2 | Repo | **Settled — `vishalshah-utc/reactjs-workshops`, public, not a template** (§6) |
| 3 | `gh auth login` | **Blocked on you** — needed before I can create branches / push / open PRs |
| 4 | Veto anything in §4's "what the 2-hour format costs" table | Open — say the word and I'll swap it against a lab |
| 5 | Product name "ShopCrew" | Cosmetic; trivially renamed later |

### Next step — Phase 0

1. `gh auth login` (you), then I initialise the repo.
2. **Spike 1** — build one real starter, open it from GitHub in StackBlitz,
   and settle three things at once: does Tailwind v4's WASM oxide build
   there (R8), what Node version is available (R3), and what is the cold
   boot time (R1).
3. **Spike 2** — prove a WebSocket survives the Vite proxy inside a
   WebContainer (R2), or fall back to SSE.

Those three answers determine the version pins for all 20 app folders, so
they are worth doing before anything else gets written.
