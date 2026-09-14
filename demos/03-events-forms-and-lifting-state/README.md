# Demo 3 — Events, Forms & Lifting State

**Demo guide** · ~100 minutes · you ship search, sort, a real wishlist, and an add/delete flow — all without a network

---

## Where you are starting from

The starter is **Demo 2, finished**: a 24-card grid from `.map()`, a
controlled `CategoryStrip`, density toggle, and a per-card wishlist heart.
Three new files are already in the box:

- `src/components/ProductToolbar.tsx` — a search box that does nothing yet
- `src/components/ProductForm.tsx` — an "Add product" dialog with no fields
- `src/components/ConfirmDialog.tsx` — finished; you'll use it in Lab 4
- `src/lib/catalog.ts` gained `filterProducts()` (done), `applySort()` (a stub), and a `SortKey` union — the four values the sort select can hold
- `src/types.ts` gained `ProductDraft`: the editable subset of a `Product`, which is what the form will produce

## What you ship today

A search box and sort dropdown that actually work, a wishlist that survives
filtering and shows its count in the header, an add-product form with
validation that keeps your input when it fails, and delete-with-confirmation
and a success message.

By the end you will be able to answer, without hesitating:

- What a **controlled input** is and why `value` + `onChange` always travel together
- Why `array.sort()` is a bug and `[...array].sort()` is not
- What "immutable update" means in practice: spread, `filter`, `map` — never `push`, `splice`, or `=`
- Where a wishlist's state must live for it to survive a filter
- How to hold a whole form in one state object and validate it as a derived value

---

## Before the demo (5 minutes)

```
https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/03-events-forms-and-lifting-state/starter
```

> ⚠️ Click once, bookmark the `stackblitz.com/edit/…` URL.

Locally: `cd demos/03-events-forms-and-lifting-state/starter && npm install && npm run dev`.

---

## The cold open

Two things, ninety seconds.

**First:** click three hearts. Click a category pill. Click **All**. The hearts
are gone. Demo 2 ended on this — filtering unmounted those cards, and
unmounting destroys state. The wishlist lives in the wrong place.

**Second:** open `src/lib/catalog.ts`, find `applySort`, and *temporarily*
replace its body with the obvious thing:

```ts
export function applySort(products: Product[], sort: SortKey): Product[] {
  if (!sort) return products;
  const [field, direction] = sort.split('-') as ['price' | 'rating', 'asc' | 'desc'];
  return products.sort((a, b) => (direction === 'desc' ? b[field] - a[field] : a[field] - b[field]));
}
```

Don't wire it up yet — just leave it there. In Lab 1 you'll see what it does
to the app, and it isn't good.

---

## Lab 1 — Controlled inputs and the mutation bug (25 min)

### Problem

The search box is decorative. Typing in it changes the pixels in the box and
nothing else — React has no idea it happened. And there's no way to sort.

### Concept

**An event handler is a function you hand to React.** `onClick={handleClick}`
means "when clicked, call this". Not `onClick={handleClick()}` — that *calls*
it during render. React's event props take functions.

**A controlled input has its value owned by React.**

```tsx
<Form.Control value={query} onChange={(e) => setQuery(e.target.value)} />
```

`value` says "display this"; `onChange` says "when the user types, tell me".
The input can't drift from state because the input *is* state, rendered. The
two props **always travel together** — `value` without `onChange` is a frozen
box; `onChange` without `value` is an uncontrolled input React can't reset.

**Derived data, again.** The filtered, sorted list is computed from
`products`, `query`, `activeCategory` and `sort` on every render. There's no
`useState` for it. Four inputs, one pure function, one output.

**`sort()` mutates. `filter()` and `map()` don't.** `Array.prototype.sort`
reorders the array *in place* and returns the same array. Call it on
`products` and you have permanently reordered the catalogue — "Default order"
is now unrecoverable, and every category count is computed over a list that's
quietly changed under it. `[...products].sort()` sorts a copy.

### Steps

**A. `src/components/ProductToolbar.tsx` — `TODO(lab-1.1)`**

Replace the component with a controlled one:

```tsx
import { Badge, Button, Form, InputGroup, Stack } from 'react-bootstrap';
import { Search } from 'react-bootstrap-icons';
import type { SortKey } from '../lib/catalog';

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [ /* …unchanged… */ ];

interface ProductToolbarProps {
  query: string;
  onQueryChange: (query: string) => void;
  sort: SortKey;
  onSortChange: (sort: SortKey) => void;
  resultCount: number;
}

export function ProductToolbar({ query, onQueryChange, sort, onSortChange, resultCount }: ProductToolbarProps) {
  return (
    <Stack direction="horizontal" gap={2} className="mb-3 flex-wrap">
      <InputGroup style={{ maxWidth: 360 }}>
        <InputGroup.Text>
          <Search />
        </InputGroup.Text>
        <Form.Control
          type="search"
          placeholder="Search products…"
          aria-label="Search products"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
        {query && (
          <Button variant="outline-secondary" onClick={() => onQueryChange('')}>
            Clear
          </Button>
        )}
      </InputGroup>

      <Form.Select
        aria-label="Sort products"
        style={{ maxWidth: 200 }}
        value={sort}
        // The DOM gives us a string; the cast lives HERE, once, not at every call site.
        onChange={(e) => onSortChange(e.target.value as SortKey)}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Form.Select>

      <Badge bg="secondary" className="ms-auto">
        {resultCount} results
      </Badge>
    </Stack>
  );
}
```

Not one `useState` in this file. The toolbar renders what it's given and
reports what the user did.

**One cast, and where it lives.** `e.target.value` is a `string`; `onSortChange`
wants a `SortKey`. The `as SortKey` sits inside the toolbar, next to the
`<option>`s that guarantee it's true — so no caller ever has to write it.

**B. `src/App.tsx` — `TODO(lab-1.3)`** — wire it up:

```tsx
import { applySort, buildCategories, filterProducts } from './lib/catalog';
import type { SortKey } from './lib/catalog';
// …
const [query, setQuery] = useState('');
const [sort, setSort] = useState<SortKey>('');      // '' | 'price-asc' | 'price-desc' | 'rating-desc'
// …
const visibleProducts = applySort(filterProducts(products, { query, category: activeCategory }), sort);
// …
<ProductToolbar
  query={query}
  onQueryChange={setQuery}
  sort={sort}
  onSortChange={setSort}
  resultCount={visibleProducts.length}
/>
```

`filterProducts` is already written — open it and read it. Two filters, one
`.filter()` call, a new array out.

**C. Now watch the cold-open bug happen.** Your `applySort` still has the
mutating version. Choose **Price: low to high**. Looks right. Now choose
**Default order**.

**It doesn't come back.** The list is still sorted by price. `products.sort()`
reordered the *imported array itself*, and there is no copy of the original
anywhere. Type in the search box — the results come out price-sorted too,
because they're filtered from an array that's now permanently sorted.

**D. `src/lib/catalog.ts` — `TODO(lab-1.2)`** — fix it:

```ts
export function applySort(products: Product[], sort: SortKey): Product[] {
  if (!sort) return products;
  // split() gives string[]; the assertion says which two strings — safe because SortKey is a closed union
  const [field, direction] = sort.split('-') as ['price' | 'rating', 'asc' | 'desc'];
  const sign = direction === 'desc' ? -1 : 1;
  return [...products].sort((a, b) => (a[field] - b[field]) * sign);
}
```

One spread. Reload, sort, un-sort. Default order returns.

### Verify

Type "mas" — the grid drops to products with "mas" in the title, the badge
updates, a **Clear** button appears. Pick **Best rated** — top card has the
highest rating. Pick **Default order** — original order returns. Filter to a
category *and* search *and* sort — all three compose, because they're all
derived from the same four inputs.

### Watch out

**`value={query}` with no `onChange`.** The box appears frozen — you type and
nothing happens. React is rendering `query` on every keystroke, and `query`
never changes. If you want a read-only box, say `readOnly`; otherwise both
props, always.

**`onChange={setQuery}`** instead of `onChange={(e) => setQuery(e.target.value)}`.
You've stored the *event object* in state. The next render tries to display
an object in an input and everything goes strange. `onChange` gives you an
event; you extract the value.

**Inputs give you strings.** `e.target.value` is `"12"`, not `12`, even on
`type="number"`. TypeScript agrees — it's typed `string` — which is why Lab 3's
form keeps a `DraftStrings` shape internally and only produces a
`ProductDraft` (numbers) on submit.

### Challenge (2 min)

Add a **Clear all** button to the toolbar that resets query, sort *and*
category. Where does it need to live to reach all three? (It's not the toolbar.)

### In the real world

`applySort` mutating its input is the bug that gets past code review because
it *works* — on the first sort. It breaks on the second interaction, in a
different component, three files away. Every array method that ends in "in
place" — `sort`, `reverse`, `splice`, `push`, `pop`, `shift` — is a mutation.
Copy first. Always.

---

## Lab 2 — Lifting the wishlist (20 min)

### Problem

Each card owns its own `saved` boolean. So: filtering loses hearts, the header
can't show a count, and there's no way to ask the question "what's on the
wishlist?" — the answer is scattered across 24 components.

### Concept

**State lives with whoever needs to read it.** Two things need the wishlist —
the header (count) and every card (filled or not). Their nearest common parent
is `App`. That's where it goes.

**Model the data, not the UI.** The wishlist is "a set of product ids", not
"24 booleans". One array in `App` — `[1, 5, 12]` — is the whole truth. A card
asks `wishlist.includes(product.id)`. The header asks `wishlist.length`.
Filtering can't lose anything, because nothing lives in the cards.

**Update immutably.** `setWishlist((current) => [...current, id])`, never
`current.push(id)`. React compares the old and new array by *reference* — a
mutated array is the same reference, so React thinks nothing changed and skips
the render.

### Steps

**A. `src/App.tsx` — `TODO(lab-2.1)`**

```tsx
const [wishlist, setWishlist] = useState<number[]>([]); // product ids — `useState([])` alone would be never[]

function toggleWishlist(id: number) {
  setWishlist((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
}
```

and pass it down:

```tsx
<SiteHeader cartCount={3} wishlistCount={wishlist.length} />
// …
<ProductGrid products={visibleProducts} density={density} wishlist={wishlist} onToggleSave={toggleWishlist} />
```

**B. `src/components/ProductGrid.tsx` — `TODO(lab-2.2)`** — pass through:

```tsx
interface ProductGridProps {
  products: Product[];
  density?: Density;
  wishlist?: number[];                    // product ids
  onToggleSave?: (id: number) => void;
}

export function ProductGrid({ products, density = 'comfortable', wishlist = [], onToggleSave }: ProductGridProps) {
  // …
  <ProductCard
    product={product}
    density={density}
    saved={wishlist.includes(product.id)}
    onToggleSave={onToggleSave}
  />
```

**C. `src/components/ProductCard.tsx` — `TODO(lab-2.2)`** — make the heart
controlled. **Delete the `useState` line and the `import { useState }`**, then:

```tsx
interface ProductCardProps {
  product: Product;
  density?: Density;
  saved?: boolean;                        // ← the heart's state, owned by the parent
  onToggleSave?: (id: number) => void;    // ← reports the id, not an event
}

export function ProductCard({ product, density = 'comfortable', saved = false, onToggleSave }: ProductCardProps) {
  // …
  <Button
    // …same props…
    aria-pressed={saved}
    onClick={() => onToggleSave?.(product.id)}
  >
```

`onToggleSave?.(…)` — optional call. If nobody passed the prop, clicking does
nothing instead of throwing. Cheap robustness for a reusable component.

**D. `src/components/SiteHeader.tsx` — `TODO(lab-2.3)`** — the count. Add
`Heart` to the icon import, extract the badge (the header needs it twice now),
and add a wishlist button:

```tsx
import { Cart3, Heart, Shop } from 'react-bootstrap-icons';

/** A count badge over an icon. Extracted because the header now needs it twice. */
function CountBadge({ count, label }: { count: number; label: string }) {
  if (count <= 0) return null;
  return (
    <Badge pill bg="primary" className="position-absolute top-0 start-100 translate-middle">
      {count}
      <span className="visually-hidden"> {label}</span>
    </Badge>
  );
}

interface SiteHeaderProps {
  cartCount?: number;
  wishlistCount?: number;
}

export function SiteHeader({ cartCount = 0, wishlistCount = 0 }: SiteHeaderProps) {
  // …
  <div className="d-flex gap-3">
    <Button variant="outline-light" size="sm" className="position-relative" aria-label={`Wishlist, ${wishlistCount} items`}>
      <Heart />
      <CountBadge count={wishlistCount} label="saved" />
    </Button>
    <Button variant="outline-light" size="sm" className="position-relative" aria-label={`Cart, ${cartCount} items`}>
      <Cart3 />
      <CountBadge count={cartCount} label="in cart" />
    </Button>
  </div>
```

Notice `CountBadge` returns `null` for zero. A component that renders nothing
is a perfectly good way to express "conditionally render this" — and it moves
the `> 0` check to one place instead of two.

### Verify

Click three hearts — the header badge reads **3**. Filter to a category and
back to **All**. **The hearts are still there.** The state never lived in the
cards, so unmounting them cost nothing. Open React DevTools → `App` → hooks:
`State: [1, 5, 12]` (or whichever you clicked).

### Watch out

**`current.push(id); return current;`** — mutation. The array is the same
reference, React bails out, the heart doesn't fill. Return a *new* array.

**Forgetting to delete `useState` from `ProductCard`.** You'll have `saved`
declared twice — once as a prop, once as state — and the compiler will tell
you. Read the message; it names the line.

### Challenge (2 min)

Add a "Saved only" toggle to the toolbar that filters the grid to wishlisted
products. Everything you need is already in `App`. How many lines is it?

### In the real world

"Lift it to the common parent" scales to about three levels. Beyond that
you're passing `wishlist` through components that don't care about it — that's
*prop drilling*, and it's the problem Context (and stores like Zustand) exist
to solve. Notice you don't have that problem yet. Don't reach for Context until
you do.

---

## Lab 3 — Forms (30 min)

### Problem

The "Add product" button opens a dialog with no fields. A real form has five,
each with validation, and it must (a) not submit garbage, (b) not lose what
the user typed when they get something wrong, and (c) turn strings into
numbers before anyone downstream trusts them.

### Concept

**One state object for the whole form.** Five `useState` calls work, but a
single `draft` object with a `set(field, value)` helper scales to fifty fields
without changing shape — and a generic `set` keeps each field's type honest:

```tsx
const [draft, setDraft] = useState<DraftStrings>(EMPTY);

function set<K extends keyof DraftStrings>(field: K, value: DraftStrings[K]) {
  setDraft((current) => ({ ...current, [field]: value }));
}
```

`K extends keyof DraftStrings` means the first argument must be a real field
name, and `DraftStrings[K]` means the second must be *that field's* type.
`set('titel', …)` and `set('price', 3)` are both compile errors.

`{ ...current, [field]: value }` copies every field and overrides one. That's
the immutable update for objects — the spread is doing the same job as
`[...array]` did in Lab 1.

**Validation is derived.** `const errors = validate(draft)` runs every render.
No `setErrors`, no "validate on blur" state machine. It's a pure function of
the draft, so it can't be stale.

**Show errors only after the first submit.** Red boxes before the user has
typed anything are hostile. A `submitted` flag gates the display; the
validation itself runs regardless.

**`event.preventDefault()`.** A `<form>` submit reloads the page — that's
1995 behaviour and it will destroy your state. First line of every submit
handler.

**Coerce at the boundary.** Inputs produce strings. Convert to numbers in the
submit handler, once, where the data leaves the form — not in `onChange`
(which breaks typing `"1."`), and not downstream (where everyone has to
remember).

### Steps

**A. `src/components/ProductForm.tsx` — `TODO(lab-3.1)`**

Replace the file:

```tsx
import { useState } from 'react';
import { Button, Col, Form, Modal, Row } from 'react-bootstrap';
import type { CategoryOption, ProductDraft } from '../types';

/** Inputs hold STRINGS. This is the form's own shape; ProductDraft is what leaves it. */
interface DraftStrings {
  title: string;
  price: string;
  category: string;
  stock: string;
  description: string;
}

/** At most one message per field, and the keys are checked against DraftStrings — a typo is a compile error. */
type DraftErrors = Partial<Record<keyof DraftStrings, string>>;

const EMPTY: DraftStrings = { title: '', price: '', category: '', stock: '10', description: '' };

/** Pure: takes the draft, returns { field: message }. Empty object = valid. */
function validate(draft: DraftStrings): DraftErrors {
  const errors: DraftErrors = {};
  if (draft.title.trim().length < 2) errors.title = 'Give it a name of at least 2 characters.';
  if (!(Number(draft.price) > 0)) errors.price = 'Price must be more than zero.';
  if (!draft.category) errors.category = 'Pick a category.';
  if (!(Number(draft.stock) >= 0)) errors.stock = 'Stock cannot be negative.';
  return errors;
}

interface ProductFormProps {
  show: boolean;
  categories: CategoryOption[];
  /** The form's OUTPUT is a ProductDraft — numbers, not strings. The conversion happens once, on submit. */
  onCreate: (payload: ProductDraft) => void;
  onClose: () => void;
}

export function ProductForm({ show, categories, onCreate, onClose }: ProductFormProps) {
  const [draft, setDraft] = useState<DraftStrings>(EMPTY);
  const [submitted, setSubmitted] = useState(false);

  const errors = validate(draft);           // DERIVED
  const showErrors = submitted;

  // Generic: `set('price', 3)` is a compile error — price is a string in the draft.
  function set<K extends keyof DraftStrings>(field: K, value: DraftStrings[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;   // keep the input — never clear on error

    onCreate({
      title: draft.title.trim(),
      price: Number(draft.price),               // coerce HERE, at the boundary
      category: draft.category,
      stock: Number(draft.stock),
      description: draft.description.trim(),
    });
    setDraft(EMPTY);
    setSubmitted(false);
  }

  function handleClose() {
    setDraft(EMPTY);
    setSubmitted(false);
    onClose();
  }

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Form noValidate onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title className="h6">Add a product</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Row className="g-3">
            <Col xs={12}>
              <Form.Group controlId="pf-title">
                <Form.Label className="small fw-semibold">Title</Form.Label>
                <Form.Control
                  autoFocus
                  value={draft.title}
                  onChange={(e) => set('title', e.target.value)}
                  isInvalid={showErrors && !!errors.title}
                />
                <Form.Control.Feedback type="invalid">{errors.title}</Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col sm={6}>
              <Form.Group controlId="pf-price">
                <Form.Label className="small fw-semibold">Price ($)</Form.Label>
                <Form.Control
                  type="number" step="0.01" min="0"
                  value={draft.price}
                  onChange={(e) => set('price', e.target.value)}
                  isInvalid={showErrors && !!errors.price}
                />
                <Form.Control.Feedback type="invalid">{errors.price}</Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col sm={6}>
              <Form.Group controlId="pf-stock">
                <Form.Label className="small fw-semibold">Stock</Form.Label>
                <Form.Control
                  type="number" min="0"
                  value={draft.stock}
                  onChange={(e) => set('stock', e.target.value)}
                  isInvalid={showErrors && !!errors.stock}
                />
                <Form.Control.Feedback type="invalid">{errors.stock}</Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col xs={12}>
              <Form.Group controlId="pf-category">
                <Form.Label className="small fw-semibold">Category</Form.Label>
                <Form.Select
                  value={draft.category}
                  onChange={(e) => set('category', e.target.value)}
                  isInvalid={showErrors && !!errors.category}
                >
                  <option value="">Choose…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.category}</Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col xs={12}>
              <Form.Group controlId="pf-description">
                <Form.Label className="small fw-semibold">Description</Form.Label>
                <Form.Control
                  as="textarea" rows={2}
                  value={draft.description}
                  onChange={(e) => set('description', e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleClose}>Cancel</Button>
          <Button type="submit">Create product</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
```

Two React Bootstrap details:

- **`noValidate`** on the `<Form>` turns off the browser's native validation
  bubbles so Bootstrap's `Form.Control.Feedback` can show instead. Without
  it you get both.
- **`controlId`** on `Form.Group` wires the `<label>` to the input. Free
  accessibility — clicking the label focuses the field.

**B. `src/App.tsx` — `TODO(lab-3.2)`** — products become state:

```tsx
import { products as initialProducts } from './data/products';
import { applySort, buildCategories, filterProducts, PLACEHOLDER_THUMBNAIL } from './lib/catalog';
import type { Density, Product, ProductDraft } from './types';
// …
const [products, setProducts] = useState<Product[]>(initialProducts);
// …
function handleCreate(payload: ProductDraft) {
  const created: Product = {                 // the annotation makes TS check we built a WHOLE product
    ...payload,
    id: Date.now(),          // fine until the server hands out ids in Demo 8
    rating: 0,
    discountPercentage: 0,
    thumbnail: PLACEHOLDER_THUMBNAIL,
    tags: [],
  };
  setProducts((current) => [created, ...current]);   // prepend — a NEW array
  setShowForm(false);
  setFlash(`“${created.title}” added.`);
}
// …
<ProductForm show={showForm} categories={categories} onCreate={handleCreate} onClose={() => setShowForm(false)} />
```

You'll add `flash` state in Lab 4 — for now, comment that `setFlash` line out
or add `const [flash, setFlash] = useState(null);` early.

### Verify

Click **Add product**. Click **Create** with everything empty — four red
messages, nothing created, the dialog stays open. Type a title of one letter —
still red. Fix each field; the red goes away *as you type* (derived
validation). Create it — the dialog closes and your product is first in the
grid with a grey placeholder image. Search for it. It's there.

### Watch out

**Forgetting `event.preventDefault()`.** The page reloads and everything
resets. If your form "does nothing", this is why.

**`onChange={(e) => set('price', Number(e.target.value))}`** — coercing in
`onChange`. Now the user can't type `"1."` because `Number("1.")` is `1` and
the dot vanishes. Store the string; coerce on submit.

**`isInvalid={!!errors.title}`** without the `showErrors` gate. Every field is
red before the user has typed a character. Gate it on `submitted`.

### Challenge (2 min)

Make the dialog remember the last-used category so adding five products in a
row doesn't mean choosing "Beauty" five times. (Hint: what should `EMPTY`
become, and where does that knowledge live?)

### In the real world

This form is ~120 lines and handles five fields. At fifteen fields with
cross-field rules ("end date after start date") you'll reach for React Hook
Form + Zod, and the shape stays exactly this: one object, derived errors,
coerce at the boundary. The library removes the boilerplate; the concepts are
what you wrote here.

---

## Lab 4 — Delete with confirmation and feedback (15 min)

### Problem

Deleting is destructive and irreversible. It needs a confirmation. And after
*any* mutation — add or delete — the user needs to be told it worked. Silence
reads as failure.

### Concept

**Which item is pending deletion is state.** `pendingDelete` holds the product
(or `null`). The dialog is `show={!!pendingDelete}`. Confirm runs the delete
and clears it; cancel just clears it. One piece of state drives the whole flow.

**Deleting is `filter`.** `current.filter((p) => p.id !== id)` returns a new
array without the item. Never `splice`.

**Feedback is state too.** A `flash` string, rendered as a dismissible `Alert`.

### Steps

**A. `src/components/ProductCard.tsx` — `TODO(lab-4.1)`** — a trash button
in the footer:

```tsx
import { Heart, HeartFill, Trash } from 'react-bootstrap-icons';
// …
interface ProductCardProps {
  product: Product;
  density?: Density;
  saved?: boolean;
  onToggleSave?: (id: number) => void;
  onDelete?: (product: Product) => void;      // ← NEW
}

export function ProductCard({ product, density = 'comfortable', saved = false, onToggleSave, onDelete }: ProductCardProps) {
  // …
  <div className="mt-auto d-flex justify-content-between align-items-center gap-2 pt-2">
    <StockBadge stock={product.stock} />
    <div className="d-flex gap-1">
      {onDelete && (
        <Button size="sm" variant="outline-danger" aria-label={`Delete ${product.title}`} onClick={() => onDelete(product)}>
          <Trash />
        </Button>
      )}
      <Button size="sm" disabled={isOutOfStock} variant={isOutOfStock ? 'secondary' : 'primary'}>
        {isOutOfStock ? 'Sold out' : 'Add to cart'}
      </Button>
    </div>
  </div>
```

`{onDelete && …}` — the button only exists if someone can handle it. A
storefront that renders this card without `onDelete` shows no trash icon.

Pass `onDelete` through `ProductGrid` the same way you did `onToggleSave`.

**B. `src/App.tsx` — `TODO(lab-4.2)`**

```tsx
import { Alert, Button, ButtonGroup, Container } from 'react-bootstrap';
import { ConfirmDialog } from './components/ConfirmDialog';
// …
const [pendingDelete, setPendingDelete] = useState<Product | null>(null);   // null = nothing pending
const [flash, setFlash] = useState<string | null>(null);

function handleDelete() {
  if (!pendingDelete) return;                                    // narrows Product | null → Product
  const product = pendingDelete;
  setProducts((current) => current.filter((p) => p.id !== product.id));
  setWishlist((current) => current.filter((id) => id !== product.id));   // keep the wishlist honest
  setPendingDelete(null);
  setFlash(`“${product.title}” deleted.`);
}
// …under <PageHeader …/>:
{flash && (
  <Alert variant="success" dismissible onClose={() => setFlash(null)}>
    {flash}
  </Alert>
)}
// …on the grid:
<ProductGrid … onDelete={setPendingDelete} />
// …after </Container>:
<ConfirmDialog
  show={!!pendingDelete}
  title="Delete product"
  body={`Delete “${pendingDelete?.title}”? This can't be undone.`}
  confirmLabel="Delete"
  onConfirm={handleDelete}
  onCancel={() => setPendingDelete(null)}
/>
```

`onDelete={setPendingDelete}` — the card calls `onDelete(product)`, and
`setPendingDelete(product)` is exactly the function that wants a product.
No wrapper arrow needed.

### Verify

Click a trash icon. A modal names the product. **Cancel** — nothing happens.
Trash again, **Delete** — the card is gone, the count drops, a green alert
says so, and if the product was wishlisted the header count drops too.
Dismiss the alert with its ×.

### Watch out

**`pendingDelete.title` in the body** — crashes when `pendingDelete` is
`null` (which it is most of the time). `pendingDelete?.title` — optional
chaining. The modal renders its body even while hidden.

### In the real world

Every one of today's mutations — add, delete, toggle — followed the same
shape: an event → an immutable update via the setter → a re-render. In Demo 8
the same handlers will `await` a network call in the middle, and in Demo 10
they become router *actions*. The shape doesn't change. Learn it here, where
there's nothing else to think about.

---

## Wrap-up — what you can now do

- [x] Write controlled inputs (`value` + `onChange`, always together)
- [x] Reproduce and fix the `sort()` mutation bug
- [x] Update arrays and objects immutably: spread, `filter`, `map`
- [x] Lift state to where it's needed and model data, not UI
- [x] Hold a form in one object, derive its validation, coerce at the boundary
- [x] Drive a confirmation dialog from one piece of state
- [x] Give feedback after every mutation

**Two things to notice before Demo 4:** open `ProductForm.tsx` and count how
many lines are identical across the five fields. Then reopen the dialog after
a failed submit and type one letter — why is it red already?

## Next demo

**Demo 4 — Forms: Reusable Fields, Manual Validation & react-hook-form.**
Today's `ProductForm` repeats twenty lines per field and shows its errors at
the wrong moment. Next: a `TextField` built from scratch, a library of field
components, the product form rebuilt on it, and a sign-up form driven by
react-hook-form and zod — using the same components.

---

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| Search box won't accept typing | `value` without `onChange`. Both, always. |
| Input shows `[object Object]` | `onChange={setQuery}` — you stored the event. Extract `e.target.value`. |
| "Default order" doesn't restore the order | `products.sort()` mutated. `[...products].sort()`. |
| Heart doesn't fill | `push` mutated the array; React saw the same reference. Return a new array. |
| Page reloads on Create | Missing `event.preventDefault()`. |
| Can't type a decimal point in Price | You coerced with `Number()` in `onChange`. Store the string; coerce on submit. |
| `Cannot read properties of null (reading 'title')` | `pendingDelete.title` while `pendingDelete` is null. Use `?.`. |
| `saved` is declared twice | You added the prop but didn't delete the old `useState` in `ProductCard`. |
