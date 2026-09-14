# Demo 2 — Lists, Keys & State

**Demo guide** · ~90 minutes · you ship a filterable 24-product grid

---

## Where you are starting from

The starter is **Demo 1, finished**: header with props, `PageHeader` with an
`actions` slot, `PriceTag`, `StockBadge`, and a composed `ProductCard`. If you
didn't finish Demo 1 you have lost nothing — start here.

Two new files are already in the box: `src/data/products.ts` (24 products,
typed `Product[]`) and `src/lib/catalog.ts` (`buildCategories(products: Product[]): CategoryOption[]`
— a pure helper you'll call in Lab 3). And `src/types.ts` grew two entries:
`Density`, a union of the two grid densities, and `CategoryOption`.

## What you ship today

A grid of 24 product cards rendered from an array, a category strip that
filters them, a comfortable/compact density toggle, an empty state for when
nothing matches, and a wishlist heart on every card that remembers being
clicked.

By the end you will be able to answer, without hesitating:

- Why `key` exists, what React uses it for, and exactly what breaks without it
- What `useState` actually does when the same component renders 24 times
- The four ways to render conditionally and when each is right
- What "derived state" means and why you never `useState` something you can compute
- What a **controlled component** is and why it's the default shape for reusable UI

---

## Before the demo (5 minutes)

Open the starter and let it install:

```
https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/02-lists-keys-and-state/starter
```

> ⚠️ Click once, bookmark the `stackblitz.com/edit/…` URL it becomes.

Locally:

```bash
cd reactjs-workshops/demos/02-lists-keys-and-state/starter
npm install && npm run dev
```

---

## The cold open

Open the app. The heading says **24 products**. The grid shows **one**.

Open `src/components/ProductGrid.tsx`. It renders `products[0]`, hard-coded.
Demo 1 ended with three copy-pasted `<Col>` blocks; the honest next step for
24 would be 24 of them, and for the 194 in the real catalogue, 194. Nobody
does that — so what do they do instead?

---

## Lab 1 — Rendering lists (20 min)

### Problem

24 products in an array. One on screen. The array will grow to 194 in Demo 5
and to whatever the backend has after that. The component must not care how
many.

### Concept

**Rendering a list is `.map()`.** An array of data becomes an array of
elements, and React renders arrays:

```tsx
{products.map((product) => <ProductCard key={product.id} product={product} />)}
```

There is no `for` loop in JSX — a loop is a *statement*, and `{}` takes an
*expression*. `.map()` is an expression that produces an array, which is why
every React list looks like this.

**`key` is not optional, and it is not for you.** It is how React answers a
question it must answer on every render: *which of these items is which?*

React does not re-create the page when something changes. It compares the new
tree to the old one and patches the differences. For a list, "the differences"
is ambiguous without help — if a list goes from 3 items to 3 different items,
did all three change, or did one get inserted at the top? `key` removes the
ambiguity. With `key={product.id}` React knows that the card for product 5 is
the same card it rendered last time, wherever it has moved to.

**Four ways to render conditionally**, each with a right time:

| Idiom | Use when | Example |
|---|---|---|
| `cond && <X/>` | render or nothing | `{isNew && <Badge>New</Badge>}` |
| `cond ? <X/> : <Y/>` | genuine either/or | `{out ? 'Sold out' : 'Add to cart'}` |
| early `return` | a whole different view | the empty state |
| extract a component | 3+ branches | `<StockBadge />` (you wrote this in Demo 1) |

### Steps

Both steps are in **`src/components/ProductGrid.tsx`**.

1. **`TODO(lab-1.1)` — map over the products.** Replace the hard-coded `<Col>`
   and its comment:

   ```tsx
   <Row xs={1} sm={2} md={3} xl={4} className="g-3">
     {products.map((product) => (
       <Col key={product.id}>
         <ProductCard product={product} />
       </Col>
     ))}
   </Row>
   ```

   **Where the `key` goes matters:** on the **outermost element the callback
   returns** — the `<Col>`, not the `<ProductCard>` inside it. Put it on the
   inner element and React still warns.

2. **`TODO(lab-1.2)` — the empty state.** Above the `return`, add:

   ```tsx
   if (products.length === 0) {
     return (
       <div className="text-center text-muted rounded-3 border py-5" style={{ borderStyle: 'dashed' }}>
         <BoxSeam size={32} className="mb-2" />
         <p className="fw-medium mb-0">No products found</p>
         <p className="small mb-0">Try a different category.</p>
       </div>
     );
   }
   ```

   and add the import: `import { BoxSeam } from 'react-bootstrap-icons';`

   An empty list that renders nothing looks like a bug. Design the zero case
   on purpose — and as an early `return`, because it's a whole different view,
   not a variation on the grid.

### Verify

24 cards, four columns on a wide screen, one on a phone. Card 3 is faded with
**Out of stock**; card 5 says **Only 3 left**. No warnings in the console.

To see the empty state, temporarily change `products={products}` in `App.tsx`
to `products={[]}`. A dashed box with an icon. Change it back.

### Watch out

**Missing `key` entirely.** React logs *"Each child in a list should have a
unique key prop"*. It still renders, which is why people ignore it. Don't —
Lab 2 shows you why.

**Duplicate keys.** Two items with the same key is worse than none — React
drops or merges them. If your data has no stable unique id, that's a data
problem to fix at the source, not with `Math.random()` (which generates a new
key every render and destroys all state and all performance).

### Challenge (2 min)

Sort the grid so discounted items (`discountPercentage >= 10`) come first,
**without mutating the `products` array**. Hint: `[...products].sort(…)` —
and think about why the spread is not optional. Demo 3 opens with exactly
that.

---

## Lab 2 — State per instance, and the key bug (25 min)

### Problem

Shoppers want to save products for later. Every card needs a heart that
remembers being clicked — 24 cards, 24 independent hearts.

And there is a bug waiting for you. We're going to write it deliberately,
watch it break, and then understand it — because it is the single most common
React bug and you will meet it in real code within a month.

### Concept

**`useState` gives a component memory that survives re-renders.**

```tsx
const [saved, setSaved] = useState(false);
//     ^value  ^setter          ^initial
```

Three things about it that matter more than the syntax:

**1. Setting state schedules a re-render.** It does not change the variable in
place. `saved` is a `const` — it genuinely cannot be reassigned. `setSaved(true)`
tells React "run this component again, and next time hand it `true`".

**2. The value is a snapshot.** Within one render, `saved` never changes. When
the new value depends on the old one, use the **functional updater**:

```tsx
setSaved((wasSaved) => !wasSaved);   // always correct
setSaved(!saved);                     // usually fine, occasionally stale
```

Use the functional form whenever the new value depends on the old. It's never
wrong, and it's required in Demo 5 once effects are involved.

**3. State is per component *instance*.** `useState` is written once in the
source, but `ProductCard` renders 24 times. Each rendered card gets its own
`saved`. React keeps them apart by the component's **position in the tree** —
which is exactly why `key` matters, and exactly what we're about to break.

### Steps

**A. `src/components/ProductCard.tsx` — `TODO(lab-2.1)`**

Add the imports:

```tsx
import { useState } from 'react';
import { Heart, HeartFill } from 'react-bootstrap-icons';
```

Replace the `TODO(lab-2.1)` comment with the state:

```tsx
const [saved, setSaved] = useState(false);
```

And add the button **directly after `<Card.Img … />`**, before `<Card.Body>`:

```tsx
<Button
  variant="light"
  size="sm"
  className="position-absolute top-0 end-0 m-2 rounded-circle shadow-sm"
  aria-pressed={saved}
  aria-label={saved ? `Remove ${product.title} from wishlist` : `Save ${product.title} to wishlist`}
  onClick={() => setSaved((wasSaved) => !wasSaved)}
>
  {saved ? <HeartFill className="text-danger" /> : <Heart />}
</Button>
```

Bootstrap's `.card` is already `position: relative`, so `position-absolute`
on the button positions against the card. No wrapper needed.

**B. Now break it on purpose. This is the important part.**

1. In `ProductGrid.tsx`, change the key to the index:
   ```tsx
   {products.map((product, index) => (
     <Col key={index}>
   ```
2. Reload. Click the heart on the **first three** cards.
3. In `App.tsx`, temporarily reverse the list:
   ```tsx
   <ProductGrid products={[...products].reverse()} />
   ```
4. Look at the grid.

**The hearts did not move with their products.** They stayed on positions 1,
2 and 3 — which are now completely different products. You have "saved" three
things you never clicked.

Now change the key back to `key={product.id}`, reload, click three hearts, and
reverse again. **The hearts follow their products.**

Undo the `.reverse()`.

### Verify

Click a heart — it fills red and stays filled. Click another card's heart —
both stay filled, independently. Reload — they reset (state lives in memory;
Demo 3's homework is where it survives a reload).

### Watch out

**`key={index}` is the trap.** An index describes a *position*, not an *item*.
When the list reorders, React sees "item at position 0" and concludes it's the
same item with different contents — so the state at that position stays put
while the data moves underneath it. With no state in the row you get away with
it. Add a checkbox, an input, or a heart and it breaks in a way that looks like
witchcraft.

**`onClick={setSaved(true)}`** — missing arrow function. That *calls* the
setter during render, which sets state during render, which re-renders, which
calls it again. React throws *"Too many re-renders"*. It must be
`onClick={() => setSaved(true)}`.

**`saved = !saved`.** Does nothing. It's a `const`, and even if it weren't,
React would never know. Always go through the setter.

### In the real world

The index-as-key bug almost never shows up in the simple case. It shows up six
months later when someone adds "sort by price" to a table of rows containing
inputs, and users report their typing jumping to a different row. Nobody
connects it to a `key` written a year earlier by someone else. **Now you will.**

---

## Lab 3 — Lifting state up (30 min)

### Problem

A category strip needs to filter the grid. The strip and the grid are
*siblings* — neither can see the other. Where does "the selected category"
live?

And the grid needs a density toggle that lives in the page header, another
sibling. Same question.

### Concept

**Where state lives determines who can use it.** State in `ProductCard` is
private to that card. State in `App` can be handed to any child. Put it as low
as possible, but high enough that everyone who needs it can reach it. When two
siblings need the same value, it goes in their **nearest common parent**. That
is *lifting state up*, and it is the answer to "where does this state live?"
about 80% of the time.

**A controlled component holds no state of its own.** It is told the current
value and given a callback for changes — and its props type says exactly that:
`activeId: string` in, `onSelect: (id: string) => void` out.

```tsx
<CategoryStrip categories={…} activeId={activeCategory} onSelect={setActiveCategory} />
```

`CategoryStrip` never decides what's selected. It renders what it's told and
reports clicks. The same strip can drive a grid today, a URL in Demo 9, and a
server query in Demo 7 — because it never knew which.

**Derived state is not state.** The filtered list is computed from
`activeCategory` and `products` on every render:

```tsx
const visibleProducts = activeCategory === 'all' ? products : products.filter(…);
```

There is **no `useState` for `visibleProducts`.** Storing it would give you two
sources of truth — the category and the list — that can disagree. Every
"the filter shows the wrong items" bug is one of these.

### Steps

**A. `src/components/CategoryStrip.tsx` — `TODO(lab-3.1)`**

Replace the file:

```tsx
import { Badge, Nav } from 'react-bootstrap';
import type { CategoryOption } from '../types';

interface CategoryStripProps {
  categories: CategoryOption[];
  activeId: string;
  /** Reports the id in the PARENT's vocabulary — a string, not an event. */
  onSelect: (id: string) => void;
}

export function CategoryStrip({ categories, activeId, onSelect }: CategoryStripProps) {
  return (
    <Nav
      variant="pills"
      className="flex-nowrap overflow-auto pb-2 mb-3"
      activeKey={activeId}
      // react-bootstrap's onSelect hands us `string | null`; "all" is our null.
      onSelect={(key) => onSelect(key ?? 'all')}
    >
      <Nav.Item>
        <Nav.Link eventKey="all" className="text-nowrap">
          All
        </Nav.Link>
      </Nav.Item>
      {categories.map((category) => (
        <Nav.Item key={category.id}>
          <Nav.Link eventKey={category.id} className="text-capitalize text-nowrap">
            {category.name}
            <Badge bg="secondary" pill className="ms-1">
              {category.count}
            </Badge>
          </Nav.Link>
        </Nav.Item>
      ))}
    </Nav>
  );
}
```

React Bootstrap's `Nav` is itself a controlled component: `activeKey` says
which pill is active, `onSelect(eventKey)` fires when one is clicked. We pass
both straight through. Notice there is not a single `useState` in this file.

**B. `src/App.tsx` — `TODO(lab-3.2)`**

Add the import and the state:

```tsx
import { useState } from 'react';
import { buildCategories } from './lib/catalog';
// …
const [activeCategory, setActiveCategory] = useState('all');

// DERIVED. No useState for either.
const categories = buildCategories(products);
const visibleProducts =
  activeCategory === 'all' ? products : products.filter((p) => p.category === activeCategory);
```

Wire the strip and the grid:

```tsx
<CategoryStrip categories={categories} activeId={activeCategory} onSelect={setActiveCategory} />
<ProductGrid products={visibleProducts} />
```

and update the description: `` description={`${visibleProducts.length} of ${products.length} products`} ``.

**C. `TODO(lab-3.3)` — the density toggle.** Three files, one idea.

In **`App.tsx`**, add state and a toggle in the `actions` slot:

```tsx
import { Button, ButtonGroup, Container } from 'react-bootstrap';
import { Grid, Grid3x3Gap } from 'react-bootstrap-icons';
import type { Density } from './types';
// …
const [density, setDensity] = useState<Density>('comfortable');
// …
<PageHeader
  title="All products"
  description={`${visibleProducts.length} of ${products.length} products`}
  actions={
    <ButtonGroup size="sm" aria-label="Grid density">
      <Button
        variant={density === 'comfortable' ? 'secondary' : 'outline-secondary'}
        aria-pressed={density === 'comfortable'}
        onClick={() => setDensity('comfortable')}
      >
        <Grid className="me-1" />
        Comfortable
      </Button>
      <Button
        variant={density === 'compact' ? 'secondary' : 'outline-secondary'}
        aria-pressed={density === 'compact'}
        onClick={() => setDensity('compact')}
      >
        <Grid3x3Gap className="me-1" />
        Compact
      </Button>
    </ButtonGroup>
  }
/>
// …
<ProductGrid products={visibleProducts} density={density} />
```

This is Demo 1's `actions` slot paying off — `PageHeader` needed no changes.

**Why `useState<Density>` and not `useState('comfortable')`?** Inferred alone,
the state would be `string`, and `setDensity('banana')` would compile. The
type parameter pins it to the union, so the two buttons are the *only* values
it can ever hold — and `COLUMNS[density]` below is safe to index without a
check.

In **`ProductGrid.tsx`**, accept the prop and vary the columns:

```tsx
import type { Density, Product } from '../types';

// Record<Density, …>: one entry per density, and the compiler insists on it.
const COLUMNS: Record<Density, { xs: number; sm: number; md: number; xl: number }> = {
  comfortable: { xs: 1, sm: 2, md: 3, xl: 4 },
  compact: { xs: 2, sm: 3, md: 4, xl: 6 },
};

interface ProductGridProps {
  products: Product[];
  density?: Density;
}

export function ProductGrid({ products, density = 'comfortable' }: ProductGridProps) {
  // …empty state unchanged…
  return (
    <Row {...COLUMNS[density]} className="g-3">
      {products.map((product) => (
        <Col key={product.id}>
          <ProductCard product={product} density={density} />
        </Col>
      ))}
    </Row>
  );
}
```

`{...COLUMNS[density]}` spreads `{ xs: 1, sm: 2, … }` as props. A lookup
object beats an `if` chain when the branches are just different data — and
`Record<Density, …>` means adding a third density is a compile error until you
add its columns.

In **`ProductCard.tsx`**, accept the prop and tighten the card:

```tsx
interface ProductCardProps {
  product: Product;
  density?: Density;          // the union from types.ts — 'banana' is a compile error
}

export function ProductCard({ product, density = 'comfortable' }: ProductCardProps) {
  const [saved, setSaved] = useState(false);
  const isOutOfStock = product.stock === 0;
  const isCompact = density === 'compact';
  // …
  <Card.Img … style={{ height: isCompact ? 110 : 160 }} />
  // …
  <Card.Body className={`d-flex flex-column gap-2 ${isCompact ? 'p-2' : ''}`}>
    {!isCompact && <div className="text-muted small text-uppercase">{product.brand ?? product.category}</div>}
    <Card.Title className={`mb-0 ${isCompact ? 'small text-truncate' : 'fs-6'}`}>{product.title}</Card.Title>
    {!isCompact && <span className="small text-muted">★ {product.rating.toFixed(1)}</span>}

    <PriceTag price={product.price} discountPercentage={product.discountPercentage} size={isCompact ? 'sm' : 'md'} />

    {!isCompact && (
      <div className="mt-auto d-flex justify-content-between align-items-center pt-2">
        {/* …StockBadge and button, unchanged… */}
      </div>
    )}
  </Card.Body>
```

### Verify

- Click **Fragrances** — the grid filters, the pill highlights, the description
  reads **5 of 24 products**. Click **All** — everything returns.
- Click **Compact** — six columns, smaller cards, no ratings or stock badges.
- Filter to a category, then click **Compact**. Both survive — they're
  independent state.
- **Now the interesting one:** click three hearts, filter to a category, then
  back to **All**. Are the hearts still filled?

  They're not. Filtering *unmounted* those cards (they left the tree), and
  unmounting destroys state. The heart state lives in the wrong place for a
  wishlist — it should live *above* the list, keyed by product id. That is
  Demo 3's opening problem.

### Watch out

**`useState` inside a condition or a loop.** React tracks hooks by call
order, so they must run in the same order every render. `if (x) { useState() }`
is the one rule you cannot break. The ESLint plugin catches it — do not
disable it.

**Storing `visibleProducts` in state.** It compiles, it works today, and in a
week it shows stale results because someone updated `products` without
updating the copy. Derive it.

**Passing `onSelect={setActiveCategory()}`** — with parentheses. Same bug as
Lab 2: you *called* it. Pass the function, don't call it.

### Challenge (2 min)

Add a third density, `'cosy'`, between the two. Count how many places you had
to change. If that felt like too many, you've found the argument for a single
lookup table (`COLUMNS`) over scattered conditionals — extend the idea to the
card.

### In the real world

"Where should this state live?" is the question you will spend the most time
on for the next five years. Too low and you can't share it. Too high and
everything re-renders and every component gets props it doesn't care about.
Demos 3, 7 and 9 each answer it for a different kind of state — local, from the
server, and in the URL — and the answer is different every time.

---

## Lab 4 — Seeing state in DevTools (10 min)

Open React DevTools → **⚛ Components**.

1. **Find `App`.** Its `hooks` panel shows `State: "all"` and
   `State: "comfortable"`. Click a category pill; watch the first one change.
2. **Edit state live.** Double-click `"all"`, type `"beauty"`, press Enter.
   The grid filters. You did not touch the code.
3. **Expand a `ProductCard`.** Its own `State: false` for `saved`. Click its
   heart; watch it flip. Expand a *different* card — still `false`. That's 24
   independent pieces of state, exactly as promised.
4. **Turn on "Highlight updates when components render"** (⚙ → Components).
   Click a heart.

   **Notice what flashes.** Just that one card? Or every card on the page?

   Sit with that. We are not fixing it in this track — fixing it before you
   can measure it is how people make apps slower while trying to make them
   faster. But you've just seen the thing `React.memo` exists for.

---

## Wrap-up — what you can now do

- [x] Render a list with `.map()` and pick a key that won't betray you
- [x] Explain what React uses `key` for, and reproduce the index-key bug on demand
- [x] Design an empty state as an early return
- [x] Hold state with `useState` and know it's per instance
- [x] Pin state to a union with `useState<Density>`, and index a `Record` by it safely
- [x] Use the functional updater when the new value depends on the old
- [x] Lift state to the nearest common parent and pass it down
- [x] Build a controlled component that holds no state of its own
- [x] Derive values during render instead of storing them

**One question to bring to Demo 3:** the wishlist forgets everything when you
filter, and there's no way to ask "what's on the wishlist?" because 24 cards
each hold their own flag. Where should that state *actually* live?

## Next demo

**Demo 3 — Events, Forms & Lifting State.** A search box that actually
filters, a sort dropdown, a wishlist that survives filtering, and an
add-product form with validation — all still local, all still without a
network. We open by making the app render nothing at all with one innocent
line of code.

---

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| *"Each child in a list should have a unique key"* | Add `key={product.id}` to the **outermost** element in the `.map()` callback. |
| *"Too many re-renders"* | `onClick={fn()}` instead of `onClick={() => fn()}` — you called the handler during render. |
| Hearts stay on the wrong products after sorting | `key={index}`. Use `key={product.id}`. |
| Filter shows stale results | You stored the filtered list in state. Derive it from `activeCategory` instead. |
| `Cannot find name 'Grid'` | Missing icon import from `react-bootstrap-icons`. |
| `Argument of type '"cosy"' is not assignable to parameter of type 'Density'` | The union in `types.ts` doesn't have it yet. Add it there first — then the compiler shows you every other place to update. |
| Pills don't highlight | `activeKey` on the `Nav` must match the `eventKey` on the `Nav.Link` exactly (both strings). |
