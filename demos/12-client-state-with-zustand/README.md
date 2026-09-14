# Demo 12 — Client State with Zustand

**Demo guide** · ~90 minutes · state that isn't the server's, isn't the URL's and isn't one component's — and where it should live

---

## Where you are starting from

The starter is **Demo 11, finished**: login, a refresh queue, protected
routes, roles. Everything works — except three things you may not have
noticed are broken.

New stubs: `src/store/wishlist.ts`, `src/store/cart.ts`,
`src/components/CartDrawer.tsx`, `src/api/services/carts.ts`,
`src/routes/account/checkout.ts`. New dependency: **`zustand@5.0.15`** —
already in `package.json`, already installed.

## What you ship today

A **wishlist store** that replaces the layout's `useState` + Outlet context —
so the detail page can finally save a product, and the header stops taking
counts as props. A **real cart**: lines, quantities, a drawer that opens from
the header, a live badge, subtotal — derived, never stored. Both **persisted**
across reloads, with the drawer's open state deliberately left out. And a
**checkout action** that reads the cart *from inside a router action*, with
no hook in sight — because a store is an object first and a hook second.

By the end you will be able to answer, without hesitating:

- The four kinds of state in this app, and where each one lives
- Why a Zustand store is a hook, and what a selector buys you over Context
- Why derived values are selectors, not state
- Why selecting an object needs `useShallow`, and what happens without it
- What `persist` saves, what `partialize` leaves out, and what `version` is for
- How code outside React reads and writes the store — and why that's the point

> **Not everything belongs in a store.** The product list stays in the loader.
> The filters stay in the URL. The sign-up form stays in react-hook-form. The
> grid density stays in `useState`. Today's store holds exactly the two things
> that are none of those: the wishlist and the cart.

---

## Before the demo (5 minutes)

```
https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/12-client-state-with-zustand/starter
```

> ⚠️ Click once, bookmark the `stackblitz.com/edit/…` URL.

Locally: `cd demos/12-client-state-with-zustand/starter && npm install && npm run dev`.

If you have React DevTools, open **Components → ⚙ → Highlight updates when
components render**. Lab 1's Verify uses it to *show* what a selector does.

---

## The cold open

Look at the header. The cart badge says **3**. It has said 3 since Demo 3 —
open `RootLayout.tsx` and there it is: `cartCount={3}`. Click **Add to cart**
on any product. Nothing. Open `/products/1`. There is no heart on this page;
the wishlist only exists on the list page. Save something there, reload: gone.

Now read how the wishlist gets to the grid: `useState` in `RootLayout` →
`<Outlet context={…}>` → `useOutletContext<RootOutletContext>()` in
`ProductsPage` → `wishlist` prop → `ProductGrid` → `saved` prop → `ProductCard`.
Five hops. Every new piece of shared state grows the context type and the
props. The header gets its count by yet another route — a prop from the layout.

Today the wishlist and the cart become **stores**: one file each, readable
from any component in one line, writable from outside React entirely.

---

## Lab 1 — The first store: the wishlist (20 min)

### Problem

The wishlist is owned by `RootLayout` for one reason: it's the nearest
common ancestor of the header and the grid. That's a fact about the component
tree, not about the wishlist. Move the header, and the state has to move too.

### Concept

**Where state lives.** Before reaching for a store, name the kind of state:

| Kind | Example in ShopScope | Lives in | Since |
|---|---|---|---|
| **Server** | products, categories, the user | loaders, revalidated by actions | Demo 10 |
| **URL** | `?q=`, `?page=`, `?edit=` | `useSearchParams` | Demo 9 |
| **Form** | the sign-up draft | react-hook-form | Demo 4 |
| **Local UI** | grid density, a pending delete | `useState` | Demo 2 |
| **Global client** | wishlist, cart | **a store** | today |

The last row is the *only* one a store is for: state that many distant
components read and write, that isn't the server's, and that has to outlive
any one page. Everything else already has a better home.

**A store is a hook.** `create()` returns `useWishlistStore`. Call it with a
**selector** — `useWishlistStore((s) => s.ids)` — and the component
subscribes to *that value*: it re-renders when `ids` changes and at no other
time. That is the difference from Context, where every consumer re-renders
whenever anything in the value changes.

**Actions live in the store.** Components never call `set`. They call
`toggle(id)`, and the store decides what toggling means. When the rule
changes ("a maximum of 20"), one file changes.

**The TypeScript idiom.** `create<State>()(…)` — note the empty call. It's
how the middleware types (Lab 3's `persist`) flow through; without the
currying, `persist` would lose your state type. Write it this way from the
start so nothing changes later.

### Steps

**A. `src/store/wishlist.ts` — `TODO(lab-1.1)`**

Replace the file:

```ts
import { create } from 'zustand';

/**
 * State AND the actions that change it, in one object. Components never call
 * `set` — they call `toggle`, and the store decides what that means.
 */
interface WishlistState {
  ids: number[];
  toggle: (id: number) => void;
  clear: () => void;
}

/**
 * A store is a HOOK. `useWishlistStore((s) => s.ids)` subscribes a component
 * to exactly that slice — it re-renders when `ids` changes and at no other time.
 *
 * `create<State>()(…)` — the empty call is the TypeScript idiom that lets the
 * middleware types flow through; without it, Lab 3's `persist` loses the state type.
 */
export const useWishlistStore = create<WishlistState>()((set) => ({
  ids: [],
  // `set` with a function reads the CURRENT state, like React's updater form.
  toggle: (id) =>
    set((state) => ({ ids: state.ids.includes(id) ? state.ids.filter((x) => x !== id) : [...state.ids, id] })),
  clear: () => set({ ids: [] }),
}));

// --- Selectors: named, reusable, testable without React. -------------------

export const selectWishlistCount = (state: WishlistState) => state.ids.length;

/** A selector FACTORY: `useWishlistStore(selectIsSaved(42))` → boolean. */
export const selectIsSaved = (id: number) => (state: WishlistState) => state.ids.includes(id);
```

`set({ ids: [] })` **merges**: it replaces `ids` and leaves `toggle` and
`clear` alone. You never spread the whole state.

**B. `src/routes/RootLayout.tsx` — `TODO(lab-1.2)`**

Delete the wishlist. All of it: the `useState`, `toggleWishlist`, the
`RootOutletContext` interface, `outletContext`, and the `context` prop on
`<Outlet>`. The header loses its two count props:

```tsx
import { useEffect } from 'react';                       // useState goes
// …
export function RootLayout() {
  const { user } = useLoaderData<typeof rootLoader>();
  // …navigation, revalidator, sign-out — unchanged…

  // The wishlist and the cart used to live HERE and travel down through Outlet
  // context. They are stores now: any component reads them directly.
  return (
    <>
      <SiteHeader user={user} onSignOut={handleSignOut} />
      // …
          <Outlet />
```

**C. `src/components/SiteHeader.tsx` — `TODO(lab-1.3)`**

Drop `cartCount` and `wishlistCount` from the props, and read the store:

```tsx
import { selectWishlistCount, useWishlistStore } from '../store/wishlist';
// …
interface SiteHeaderProps {
  /** null = signed out. */
  user?: User | null;
  onSignOut?: () => void;
}

export function SiteHeader({ user = null, onSignOut }: SiteHeaderProps) {
  const [showSignup, setShowSignup] = useState(false);

  // No props for this any more: the header subscribes to the store itself.
  // The selector returns a NUMBER, so the header re-renders only when the count actually changes.
  const wishlistCount = useWishlistStore(selectWishlistCount);
  const cartCount = 0;   // Lab 2 replaces this
```

**D. `src/routes/ProductsPage.tsx` — `TODO(lab-1.4)`**

Remove `useOutletContext` from the router import and `RootOutletContext` from
the type import (keep `rootLoader`), then:

```tsx
import { useWishlistStore } from '../store/wishlist';
// …
  // Client state from the store — no Outlet context, no props from the layout.
  const wishlist = useWishlistStore((s) => s.ids);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
```

Two calls, two subscriptions. `toggle` never changes, so that one never
causes a render; `ids` does, and this page needs it to.

### Verify

1. Save three products. The header badge says **3** — and it isn't
   hardcoded any more (`cartCount` still is; that's Lab 2).
2. **Highlight updates** on: click a heart. The header badge flashes, the
   grid flashes. `RootLayout`, `CategoryStrip`, `Pager` do **not** — nothing
   they render depends on `ids`. That's the selector.
3. In the console:
   ```ts
   const { useWishlistStore } = await import('/src/store/wishlist.ts');
   useWishlistStore.getState().ids;          // [1, 5, 9] — no component, no hook
   useWishlistStore.getState().toggle(2);    // the heart on product 2 fills in
   ```
   Lab 4 is built on that second line.
4. `npm run typecheck`: clean. Notice nothing referenced `RootOutletContext`
   except the two files you edited — the type was plumbing, and it's gone.

### Watch out

**`const state = useWishlistStore()` — no selector.** It works, and it
subscribes the component to *everything*. Add a cart action later and this
component re-renders for it. Always select; select the smallest thing.

**Defining the store inside a component.** `create()` builds a new store on
every render — state that resets itself. Stores are module-level, like the
router.

**Mutating in `set`.** `set((s) => { s.ids.push(id); return s; })` returns
the *same* object; subscribers compare by reference and see no change. Return
a new array, as `toggle` does. (The `immer` middleware exists for deep
shapes; the cart in Lab 2 doesn't need it.)

### In the real world

The table under Concept is the interview answer. Most "state management"
pain comes from putting *server* state in a client store — a cache without
invalidation, staleness bugs, a hand-written `loading` flag per entity. The
loader owns server state here; if you're not using a router with loaders, a
server-state library (TanStack Query) does the same job. The store is for the
thin layer that's genuinely the client's.

---

## Lab 2 — The cart: actions, derived values, and a drawer (25 min)

### Problem

There is no cart. The badge is a literal, the buttons are decoration, and a
cart is the textbook case for a store: added on the list page, added on the
detail page, counted in the header, edited in a drawer that belongs to no page.

### Concept

**A line is a snapshot, not a reference.** Store `{ productId, title, price,
thumbnail, qty }`, not `Product`. If the catalogue changes — a price, a
deleted product — the cart still renders. (A real checkout re-prices on the
server anyway; Lab 4.)

**Derived values are selectors.** `count` and `subtotal` are *functions of
lines*. Store them too and you have two sources of truth that will disagree
the first time an action forgets to update one. `selectCount(state)` is a
plain function: testable without React, reusable in the header and the
drawer, and — because it returns a number — a cheap subscription.

**One `set`, one render.** `add` both appends a line and opens the drawer.
Two `set` calls would be two notifications; return one object.

**UI state can live in a store — when it's cross-cutting.** The drawer's
`isOpen` is set by the header (open), the drawer (close) and `add` (open).
Three components, no common parent that isn't the layout. That's the test.
The grid density, by contrast, is one page's business and stays in
`useState`.

**Selecting an object needs `useShallow`.** `useCartStore((s) => ({ setQty:
s.setQty, remove: s.remove }))` builds a *new object* on every call. Zustand
compares by reference, sees a change every time, and React 19 warns *"The
result of getSnapshot should be cached"* — then re-renders in a loop.
`useShallow` compares the object's *keys* instead. Or select each value
separately, which is what the rest of this lab does.

### Steps

**A. `src/store/cart.ts` — `TODO(lab-2.1)`**

Replace the file:

```ts
import { create } from 'zustand';
import type { CartLine, Product } from '../types';

interface CartState {
  lines: CartLine[];
  /** UI state that BELONGS to the cart — the drawer — set from three different components. */
  isOpen: boolean;

  add: (product: Pick<Product, 'id' | 'title' | 'price' | 'thumbnail'>, qty?: number) => void;
  setQty: (productId: number, qty: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
}

export const useCartStore = create<CartState>()((set) => ({
  lines: [],
  isOpen: false,

  add: (product, qty = 1) =>
    set((state) => {
      const existing = state.lines.find((line) => line.productId === product.id);
      const lines = existing
        ? state.lines.map((line) => (line.productId === product.id ? { ...line, qty: line.qty + qty } : line))
        : [
            ...state.lines,
            // A SNAPSHOT of the product, not a reference: the cart must not break if the catalogue changes.
            { productId: product.id, title: product.title, price: product.price, thumbnail: product.thumbnail, qty },
          ];
      return { lines, isOpen: true }; // adding opens the drawer — ONE set, one render
    }),

  setQty: (productId, qty) =>
    set((state) => ({
      lines:
        qty <= 0
          ? state.lines.filter((line) => line.productId !== productId)
          : state.lines.map((line) => (line.productId === productId ? { ...line, qty } : line)),
    })),

  remove: (productId) => set((state) => ({ lines: state.lines.filter((line) => line.productId !== productId) })),
  clear: () => set({ lines: [] }),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));

// --- Derived values live in SELECTORS, not in state. Storing `count` too would be two sources of truth. ---

export const selectCount = (state: CartState) => state.lines.reduce((n, line) => n + line.qty, 0);
export const selectSubtotal = (state: CartState) => state.lines.reduce((n, line) => n + line.qty * line.price, 0);
```

`Pick<Product, 'id' | 'title' | 'price' | 'thumbnail'>` is the contract: `add`
takes anything that has those four fields — a `Product` qualifies — and
promises to read nothing else.

And in **`src/types.ts`**, above `Cart`:

```ts
// ------------------------------------------------------------------ client state

/** One line in the shopping cart — a SNAPSHOT of the product, so the cart survives catalogue changes. */
export interface CartLine {
  productId: number;
  title: string;
  price: number;
  thumbnail: string;
  qty: number;
}
```

**B. `src/components/ProductCard.tsx` and `ProductGrid.tsx` — `TODO(lab-2.2)`**

The card stays dumb. It reports the product; the page decides what "add"
means:

```tsx
interface ProductCardProps {
  // …
  /** The card stays dumb: it reports the product, the page decides what "add" means. */
  onAddToCart?: (product: Product) => void;
  // …
}

export function ProductCard({ product, density = 'comfortable', saved = false, onToggleSave, onAddToCart, onEdit, onDelete, busy = false }: ProductCardProps) {
  // …
  <Button size="sm" disabled={isOutOfStock || busy} variant={isOutOfStock ? 'secondary' : 'primary'} onClick={() => onAddToCart?.(product)}>
    {isOutOfStock ? 'Sold out' : 'Add to cart'}
  </Button>
```

`ProductGrid` gains the same optional prop and passes it to every card.
Then, in `ProductsPage`, one selector and one prop:

```tsx
import { useCartStore } from '../store/cart';
// …
  const addToCart = useCartStore((s) => s.add);
// …
      <ProductGrid … onToggleSave={toggleWishlist} onAddToCart={addToCart} … />
```

**C. `src/components/CartDrawer.tsx` — `TODO(lab-2.3)`**

Replace the file. Nobody passes it props; it *is* a view of the store:

```tsx
import { Badge, Button, ButtonGroup, Image, ListGroup, Offcanvas } from 'react-bootstrap';
import { Dash, Plus, Trash } from 'react-bootstrap-icons';
import { Link } from 'react-router';
import { useShallow } from 'zustand/shallow';
import { selectCount, selectSubtotal, useCartStore } from '../store/cart';
import { formatPrice } from '../lib/format';

/**
 * Rendered ONCE, in the layout. Nobody passes it props: it reads the cart
 * store directly, and the header's button opens it through the same store.
 */
export function CartDrawer() {
  // One selector per value: each subscription re-renders only when ITS slice changes.
  const lines = useCartStore((s) => s.lines);
  const isOpen = useCartStore((s) => s.isOpen);
  const count = useCartStore(selectCount);
  const subtotal = useCartStore(selectSubtotal);
  // Selecting an OBJECT needs useShallow — otherwise `{…}` is a new reference every time and the component re-renders on every store change.
  const { setQty, remove, close } = useCartStore(useShallow((s) => ({ setQty: s.setQty, remove: s.remove, close: s.close })));

  return (
    <Offcanvas show={isOpen} onHide={close} placement="end">
      <Offcanvas.Header closeButton>
        <Offcanvas.Title className="h6">
          Your cart{' '}
          {count > 0 && (
            <Badge bg="primary" pill>
              {count}
            </Badge>
          )}
        </Offcanvas.Title>
      </Offcanvas.Header>

      <Offcanvas.Body className="d-flex flex-column">
        {lines.length === 0 ? (
          <p className="text-muted">Your cart is empty. Add something from the catalogue.</p>
        ) : (
          <ListGroup variant="flush" className="mb-3">
            {lines.map((line) => (
              <ListGroup.Item key={line.productId} className="d-flex align-items-center gap-3 px-0">
                <Image src={line.thumbnail} width={48} height={48} className="object-fit-contain bg-body-secondary rounded" alt="" />
                <div className="flex-grow-1 min-w-0">
                  <Link to={`/products/${line.productId}`} onClick={close} className="text-decoration-none text-reset fw-semibold small d-block text-truncate">
                    {line.title}
                  </Link>
                  <div className="small text-muted">
                    {formatPrice(line.price)} × {line.qty}
                  </div>
                </div>
                <ButtonGroup size="sm" aria-label={`Quantity of ${line.title}`}>
                  <Button variant="outline-secondary" aria-label="Decrease quantity" onClick={() => setQty(line.productId, line.qty - 1)}>
                    <Dash />
                  </Button>
                  <Button variant="outline-secondary" disabled className="px-3">
                    {line.qty}
                  </Button>
                  <Button variant="outline-secondary" aria-label="Increase quantity" onClick={() => setQty(line.productId, line.qty + 1)}>
                    <Plus />
                  </Button>
                </ButtonGroup>
                <Button size="sm" variant="outline-danger" aria-label={`Remove ${line.title}`} onClick={() => remove(line.productId)}>
                  <Trash />
                </Button>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}

        <div className="mt-auto border-top pt-3">
          <div className="d-flex justify-content-between fw-semibold mb-3">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          {/* Lab 4 puts the Checkout button here */}
        </div>
      </Offcanvas.Body>
    </Offcanvas>
  );
}
```

`setQty(id, qty - 1)` at quantity 1 removes the line — the *store* decided
that (`qty <= 0` → filter), not the drawer. The drawer has no rules in it.

**D. Open it — `TODO(lab-2.4)` in `SiteHeader.tsx` and `RootLayout.tsx`**

The header's cart button opens the drawer, and its badge goes live:

```tsx
import { selectCount, useCartStore } from '../store/cart';
// …
  const cartCount = useCartStore(selectCount);        // replaces the `0` from Lab 1
  const openCart = useCartStore((s) => s.open);
// …
  <Button variant="outline-light" size="sm" className="position-relative" aria-label={`Cart, ${cartCount} items`} onClick={openCart}>
```

And the layout renders the drawer once, next to `<ScrollRestoration />`:

```tsx
import { CartDrawer } from '../components/CartDrawer';
// …
      {/* Rendered once, here; opened from the header, filled from the product pages — all through the store. */}
      <CartDrawer />

      <ScrollRestoration />
```

**E. `src/routes/ProductDetailPage.tsx` — `TODO(lab-2.5)`**

The page that never had access to the wishlist. Under the description:

```tsx
import { Badge, Button, Card, Col, Ratio, Row, Stack } from 'react-bootstrap';
import { ArrowLeft, Cart3, Heart, HeartFill } from 'react-bootstrap-icons';
// …
import { useCartStore } from '../store/cart';
import { selectIsSaved, useWishlistStore } from '../store/wishlist';
// …
  const product = useLoaderData<typeof productDetailLoader>();

  // This page never had access to the wishlist (it lived in the layout's Outlet context, and only
  // ProductsPage read it). With a store, any page can: no plumbing.
  const saved = useWishlistStore(selectIsSaved(product.id));
  const toggleSave = useWishlistStore((s) => s.toggle);
  const addToCart = useCartStore((s) => s.add);
// …
                <p className="mb-0">{product.description}</p>

                <div className="d-flex gap-2">
                  <Button disabled={product.stock === 0} onClick={() => addToCart(product)}>
                    <Cart3 className="me-1" />
                    {product.stock === 0 ? 'Sold out' : 'Add to cart'}
                  </Button>
                  <Button variant={saved ? 'danger' : 'outline-danger'} aria-pressed={saved} onClick={() => toggleSave(product.id)}>
                    {saved ? <HeartFill className="me-1" /> : <Heart className="me-1" />}
                    {saved ? 'Saved' : 'Save'}
                  </Button>
                </div>
```

`selectIsSaved(product.id)` makes a new selector function each render.
That's fine: it returns a **boolean**, and Zustand compares results, not
selectors. It's *objects* that need `useShallow`.

### Verify

1. **Add to cart** on a card: the drawer slides in with the line, the badge
   says **1**. Add the same product again: quantity 2, still one line.
2. `−` to zero: the line disappears. Subtotal tracks. Close, reopen from the
   header icon.
3. Open `/products/1`: **Save** fills the heart; go back to the list — the
   card's heart is filled. Same store, two pages, no props.
4. **Highlight updates** on, click `+` in the drawer: the drawer and the
   header badge flash. `ProductsPage` behind it does not — it selected
   `s.add`, which didn't change.
5. Break it on purpose: in `CartDrawer`, delete `useShallow(` and its closing
   `)`. Console: *"The result of getSnapshot should be cached to avoid an
   infinite loop"*, and the tab freezes. Put it back. That's the Watch out.

### Watch out

**Storing `count` in state.** It's tempting because the header wants it.
Every action then has to maintain it, and the first one that doesn't is a bug
the user sees in the badge. Derive it.

**Object selectors without `useShallow`.** You just saw it. Two fixes: wrap
in `useShallow`, or split into separate selectors. Prefer splitting for two
or three values; `useShallow` when it's genuinely many.

**Business rules in the drawer.** `if (qty === 0) remove(…)` in the click
handler is a rule the detail page would have to repeat. Rules go in actions.

### Challenge (2 min)

Add a `maxQty` of 10 to `setQty`, and make `add` respect it too. How many
components changed? (Zero is the right answer.)

### In the real world

Zustand recommends **one store per domain** for small apps, and **slices** for
large ones — `createCartSlice`, `createWishlistSlice` combined into one store.
The selectors don't change either way. Also real: the **`devtools`
middleware** (`devtools(persist(…))`) shows every action in the Redux
DevTools extension with a name — worth wiring once the store has more than a
handful of actions.

---

## Lab 3 — Persist: what survives a reload (15 min)

### Problem

Reload. Empty cart, empty wishlist. A shopper who comes back tomorrow starts
over.

### Concept

**`persist` is a middleware.** It wraps the store, writes state to storage
after every `set`, and reads it back on load. `localStorage` by default;
`createJSONStorage(() => sessionStorage)` or anything with
`getItem`/`setItem` otherwise.

**`partialize` chooses what to save.** `isOpen` is UI. A reload that reopens
the drawer would be a bug. Save the *data*; let the UI start fresh.

**`version` is insurance.** Next month `CartLine` gains a field. Users who
still have last month's JSON in `localStorage` load it into this month's
code. `version` + `migrate` is how you rename or backfill instead of
crashing — or, at minimum, how the old data is *dropped* rather than
half-loaded.

**Hydration is synchronous for `localStorage`,** so the first render already
has the data. For async storage (IndexedDB, React Native) it isn't, and you'd
use `onRehydrateStorage` / `useStore.persist.hasHydrated()` to hold a
skeleton. Worth knowing; not needed here.

### Steps

**A. `src/store/cart.ts` — `TODO(lab-3.1)`**

Wrap the state function in `persist`, and give it a key:

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
// …
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      // …everything from Lab 2, unchanged…
    }),
    {
      name: 'shopscope.cart',
      /** Persist the DATA, not the UI: a reload should not reopen the drawer. */
      partialize: (state) => ({ lines: state.lines }),
      /** Bump this when CartLine changes shape, and add a `migrate` — never let an old shape crash a new build. */
      version: 1,
    },
  ),
);
```

Only the wrapper is new. This is why Lab 1 insisted on `create<CartState>()(…)`
— the state type flows into `persist` and out again, and `partialize`'s
parameter is typed as `CartState` without you saying so.

**B. `src/store/wishlist.ts` — `TODO(lab-3.2)`**

Same shape, nothing to leave out:

```ts
import { persist } from 'zustand/middleware';
// …
export const useWishlistStore = create<WishlistState>()(
  persist(
    (set) => ({
      // …unchanged…
    }),
    { name: 'shopscope.wishlist' }, // the localStorage key
  ),
);
```

### Verify

1. Add two products, save one, **reload.** Both back. Badges correct.
   The drawer is **closed** — `isOpen` was never saved.
2. DevTools → **Application → Local Storage**. Three ShopScope entries now:
   `shopscope.accessToken` and friends from Demo 11, plus
   `shopscope.cart` → `{"state":{"lines":[…]},"version":1}` and
   `shopscope.wishlist`. Note `version` in the JSON. Note no `isOpen`.
3. Edit the JSON by hand — change a `qty` — and reload. The store believes
   storage. Which is the point of the next Watch out.

### Watch out

**Persisting the UI.** Drop `partialize` and reload with the drawer open:
it's open again. Small here; a persisted "modal open" flag is a support
ticket.

**Trusting persisted data as if it were yours.** It's a string in the user's
browser. They can edit it; an older build wrote it. Never persist anything
the server should decide (a price is fine to *display* from the cart;
checkout re-prices). And never persist the *server's* data as a cache —
that's what loaders are for.

**Changing the shape without bumping `version`.** Old JSON, new code,
`undefined` where a field should be. Bump the version; write `migrate`.

### In the real world

A migration looks like this — `persistedState` is `unknown` because it's
whatever an old build wrote:

```ts
version: 2,
migrate: (persistedState, version) => {
  const old = persistedState as { lines?: Array<Omit<CartLine, 'thumbnail'>> };
  if (version < 2) {
    // v1 lines had no thumbnail: backfill, don't discard the user's cart.
    return { lines: (old.lines ?? []).map((line) => ({ ...line, thumbnail: '' })) };
  }
  return persistedState as { lines: CartLine[] };
},
```

Cross-tab sync is *not* built in: two tabs each hold their own copy and the
last write wins. Zustand's docs show a `storage` event listener for that;
most apps don't need it.

---

## Lab 4 — The store outside React: checkout (25 min)

### Problem

Checkout has to send the cart to the server. That belongs in a **router
action** (Demo 10: mutations go through actions). But an action is a plain
function — no hooks. How does it read the cart?

### Concept

**A store is an object first, a hook second.** `useCartStore` is a function
you call in components, and it is *also* an object with `getState()`,
`setState()` and `subscribe()`. Nothing about it needs React. Loaders,
actions, interceptors, tests — all can read and write it.

```ts
useCartStore.getState().lines;        // read, right now
useCartStore.getState().clear();      // run an action
useCartStore.setState({ isOpen: true });          // write directly (rare — prefer actions)
const unsubscribe = useCartStore.subscribe((state, previous) => { /* every change */ });
```

**An action with no component.** A route can have an `action` and nothing
else. The drawer's `fetcher.Form` posts to it; the action runs; loaders
revalidate; no navigation. Put it under `/account` and the **middleware from
Demo 11 guards it** — a signed-out submission is redirected to `/login`
before the action's first line.

**The form sends nothing.** The cart is in the store; the action reads it
there. Compare with Demo 10's product form, where the *values* were the
form's. Here the values are the client's state, and the POST just says "now".

**DummyJSON simulates `POST /carts/add`.** It computes totals and returns a
cart with a new id; nothing persists. The success message says so, and the
*Carts* page won't show it.

### Steps

**A. `src/api/endpoints.ts` and `src/api/services/carts.ts` — `TODO(lab-4.1)`**

```ts
  carts: {
    create: () => '/carts/add',
  },
```

```ts
import { api } from '../client';
import { endpoints } from '../endpoints';
import type { Cart, CartItemInput } from '../../types';

/**
 * POST /carts/add — DummyJSON simulates it: it computes totals and returns a
 * cart with a new id, and persists nothing. No `signal`: a mutation is never
 * cancelled on unmount — the server may already have committed it.
 */
export async function createCart(userId: number, products: CartItemInput[]): Promise<Cart> {
  const { data } = await api.post<Cart>(endpoints.carts.create(), { userId, products });
  return data;
}
```

And in `types.ts`, next to `CartLine`:

```ts
/** One item in a POST /carts/add body. */
export interface CartItemInput {
  id: number;
  quantity: number;
}
```

**B. `src/routes/account/checkout.ts` — `TODO(lab-4.2)`**

```ts
import { data, type ActionFunctionArgs } from 'react-router';
import { createCart } from '../../api/services/carts';
import { ApiError } from '../../lib/ApiError';
import { useCartStore } from '../../store/cart';
import { userContext } from '../middleware';
import type { Cart } from '../../types';

/** A discriminated union: `ok` tells the drawer which fields exist. */
export type CheckoutResult = { ok: true; cart: Cart } | { ok: false; error: string };

/**
 * An action with NO component — the app's checkout "endpoint". It sits under
 * /account, so authMiddleware runs first: a signed-out fetcher submission is
 * redirected to /login before this line ever executes.
 */
export async function checkoutAction({ context }: ActionFunctionArgs): Promise<CheckoutResult> {
  const user = context.get(userContext);
  if (!user) throw data({ message: 'Sign in to check out.' }, { status: 401 }); // a wiring bug — the middleware should have redirected

  // The store OUTSIDE React: getState() is a plain function call — no hook, no component, no props.
  const { lines, clear } = useCartStore.getState();
  if (lines.length === 0) return { ok: false, error: 'Your cart is empty.' };

  try {
    const cart = await createCart(
      user.id,
      lines.map((line) => ({ id: line.productId, quantity: line.qty })),
    );
    clear(); // a store action, called from a router action — every subscribed component updates
    return { ok: true, cart };
  } catch (error) {
    return { ok: false, error: ApiError.from(error).message };
  }
}
```

`useCartStore.getState()` — the lint rule for hooks doesn't complain, and it
shouldn't: `getState` is a method on an object. The `use` prefix is a
convention about *how it's called in components*, not a restriction on the
object.

**C. `src/router.tsx` — `TODO(lab-4.3)`**

Inside the `account` children, after `carts`:

```tsx
import { checkoutAction } from './routes/account/checkout';
// …
          // Action only, no Component: the cart drawer's fetcher posts here. The middleware above guards it too.
          { path: 'checkout', action: checkoutAction },
```

**D. `src/components/CartDrawer.tsx` — `TODO(lab-4.4)`**

The footer gets its button. Signed in: a fetcher form. Signed out: a link,
because the UX half of authorisation is "don't show doors people can't open"
(Demo 11) — the middleware is still the lock:

```tsx
import { Link, useFetcher, useRouteLoaderData } from 'react-router';
import type { checkoutAction } from '../routes/account/checkout';
import type { rootLoader } from '../routes/RootLayout';
// …
  const fetcher = useFetcher<typeof checkoutAction>();
  const user = useRouteLoaderData<typeof rootLoader>('root')?.user ?? null;
  const submitting = fetcher.state !== 'idle';
// …at the top of <Offcanvas.Body>:
        {fetcher.data?.ok === true && fetcher.state === 'idle' && (
          <Alert variant="success">
            Order placed — cart #{fetcher.data.cart.id}, {fetcher.data.cart.totalQuantity} items,{' '}
            {formatPrice(fetcher.data.cart.discountedTotal)}. DummyJSON simulates writes, so it won't appear under
            Account › Carts.
          </Alert>
        )}
        {fetcher.data?.ok === false && fetcher.state === 'idle' && <Alert variant="danger">{fetcher.data.error}</Alert>}
// …replacing the Lab 4 comment in the footer:
          {user ? (
            // No fields: the action reads the cart from the STORE. The /account middleware guards it.
            <fetcher.Form method="post" action="/account/checkout">
              <Button type="submit" className="w-100" disabled={lines.length === 0 || submitting}>
                {submitting ? 'Placing order…' : 'Checkout'}
              </Button>
            </fetcher.Form>
          ) : (
            <Link to="/login?redirectTo=/products" className="btn btn-primary w-100" onClick={close}>
              Sign in to check out
            </Link>
          )}
```

`fetcher.data?.ok === true` narrows the union: inside that branch
`fetcher.data.cart` exists and the compiler knows it. `Alert` joins the
react-bootstrap import.

**E. `src/store/cart.ts` — `TODO(lab-4.5)`**

`subscribe`, the other half of "outside React" — a dev-only log of every
cart change, at the bottom of the file:

```ts
import { env } from '../config/env';
import { logger } from '../config/logger';
import { formatPrice } from '../lib/format';
// …
// --- The store outside React: subscribe() is a plain function — no component, no hook. ---
if (env.isDev) {
  useCartStore.subscribe((state, previous) => {
    if (state.lines !== previous.lines) {
      logger.debug(`[cart] ${selectCount(state)} items · ${formatPrice(selectSubtotal(state))}`);
    }
  });
}
```

`state.lines !== previous.lines` — the reference check again. Opening the
drawer changes `isOpen`, not `lines`, and logs nothing.

### Verify

1. Signed out, cart with two lines: the footer says **Sign in to check out**.
   Click it → login → back on `/products` with the cart intact (persisted).
2. **Checkout.** Network: `POST /carts/add` with `{ userId, products: [{ id,
   quantity }] }`; the response has a fresh `id` and `discountedTotal`. The
   drawer shows the success alert with those numbers; the lines are gone; the
   header badge is **0**; the console says `[cart] 0 items · $0.00`.
3. The lock, not the door. Sign out, then temporarily remove the `user ?`
   check in the drawer so the **Checkout** button shows for everyone. Click
   it. You land on `/login?redirectTo=…` — `authMiddleware` redirected the
   fetcher's submission before `checkoutAction` ran a single line. Put the
   check back. (A `fetch('/account/checkout')` from the console would *not*
   test this: that hits the dev server, not the router.)
4. Open **Account › Carts.** The new cart isn't there. Simulated, as the
   alert said.

### Watch out

**Calling the hook in the action.** `useCartStore((s) => s.lines)` inside
`checkoutAction` is a hook call outside a component — `rules-of-hooks` flags
it and React would throw. `getState()` is the non-React door.

**Passing `signal` to `createCart`.** Cancel a POST on navigation and the
server may still have created the cart — with the client believing it
didn't. Mutations are never cancelled (Demo 8).

**Reading the store in a *loader* for server-ish data.** A loader that
returns `useCartStore.getState().lines` has made the store a cache and the
loader a lie. Loaders load server state; components read client state
directly.

### Challenge (2 min)

A **recently viewed** store — `ids: number[]`, newest first, max eight — and
one line in `productDetailLoader`: `useRecentStore.getState().push(product.id)`.
Render the list in the drawer's empty state. No component wrote to the store,
and no component needed to.

### In the real world

The "store outside React" property is what makes Zustand fit an app like
this one. The API layer stays React-free; an interceptor could clear the cart
on a 401 the same way `tokenStore.clear()` fires `AUTH_CHANGED`. Tests call
`useCartStore.setState({ lines: [] })` in `beforeEach` and assert on
`getState()` with no renderer. And the moment someone asks for Redux — action
names in DevTools, time-travel, strict unidirectional flow — the honest
answer is `devtools` middleware first, and Redux Toolkit only if a team
actually wants its ceremony.

---

## Wrap-up — what you can now do

- [x] Name the five kinds of state in the app and say where each one lives — and why only one belongs in a store
- [x] Create a typed store with `create<State>()(…)`, keep actions inside it, and select the smallest slice
- [x] Explain what a selector buys over Context, and show it with render highlighting
- [x] Keep derived values as selectors, and use `useShallow` when an object selector is unavoidable
- [x] Persist the data and not the UI with `partialize`, and defend `version`
- [x] Read and write the store from a router action with `getState()`, and watch it with `subscribe()`
- [x] Put a mutation behind an action-only route that the middleware already guards

## Next demo

**Demo 13 — Advanced HTTP & Shipping.** Optimistic delete that rolls back
by itself, an upload with a progress bar behind a feature flag, retries with
backoff for the requests that deserve them, lazy-loaded routes, and what a
static host needs to serve a routed app.

---

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `The result of getSnapshot should be cached to avoid an infinite loop` | A selector returns a new object/array each call. Wrap it in `useShallow`, or select the values separately. |
| Header badge doesn't update | The header still takes `cartCount` as a prop, or selects the whole store instead of `selectCount`. |
| Wishlist resets on every render | `create()` is inside a component. Move it to module scope. |
| `Property 'persist' does not exist` / state type is `unknown` inside `persist` | You wrote `create<State>(…)` instead of `create<State>()(…)`. The empty call matters. |
| Drawer reopens after a reload | `partialize` is missing — `isOpen` was persisted. |
| Old cart shape crashes the new build | Bump `version` and write `migrate`; or at least bump `version` so the old JSON is dropped. |
| `React Hook "useCartStore" is called in function "checkoutAction"` | You called the hook in the action. Use `useCartStore.getState()`. |
| Checkout button does nothing when signed out | Expected — it's a link to `/login`. To test the middleware, see Lab 4 Verify step 3. |
| `POST /account/checkout` 404s in the Network tab | The `{ path: 'checkout', action }` route is missing under `account`, or the drawer's `action` path is wrong. |
| Cart doesn't appear under Account › Carts after checkout | DummyJSON simulates writes. The response is real; persistence isn't. |
| `Type 'Product' is not assignable to parameter of type 'Pick<…>'` | `add` wants `id`, `title`, `price`, `thumbnail`. A `Product` has them — check you're passing the product, not the id. |
