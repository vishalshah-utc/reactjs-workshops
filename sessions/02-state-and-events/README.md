# Session 2 — State, Events & Controlled UI

**Participant guide** · 2 hours · the storefront becomes a real application

---

## What you ship today

Search, sort and filters that actually work. A cart you can add to, change
quantities in, apply a promo code to, and clear — with correct totals. And a
back-office screen where you can create, edit and delete products.

By the end you will be able to answer, without hesitating:

- Why `array.push()` renders nothing, and what React actually compares
- When to use `setX(value)` and when you must use `setX(prev => …)`
- Where a piece of state belongs, and how to tell
- Why storing a filtered list is a bug rather than an optimisation
- What "controlled" means, and the two halves you cannot skip
- When `useState` stops being the right tool and `useReducer` starts

---

## Before the session (20 minutes)

1. **Open the starter and let it install.**

   ```
   https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/sessions/02-state-and-events/starter
   ```

   > ⚠️ **Click once, then bookmark the tab.** Every click of a `/fork/` link
   > gives you a fresh copy — not the work you did earlier. Once it loads the
   > address becomes `stackblitz.com/edit/…`; that is your project.
   >
   > It creates nothing on GitHub.

2. **Read [CHEATSHEET.md](./CHEATSHEET.md).** One page.

3. **Have your Session 1 answer ready.** You were asked: *the wishlist forgets
   everything on reload, and every card holds its own private `saved` flag —
   where should that state live?* We open with it.

**Missed Session 1?** This starter contains its finished code. You are not
behind. Skim [Session 1's guide](../01-foundations/) for context and join in.

---

## Where we left off

Session 1's app renders 24 products beautifully and does almost nothing. The
search box does not search. Sort does not exist. "Add to cart" is a button that
lies. And each card holds a private `saved` flag that nothing else can read.

Today all of that becomes real, and every piece of it is the same question:
**where does this state live, and who is allowed to change it?**

---

## Lab 1 — What actually causes a re-render (22 min)

### Problem

Click "Add to cart" on three products. The cart badge stays at zero.

No error. No warning. Nothing in the console. The click handler runs — put a
`console.log` in it and you will see it fire. The array genuinely does get
longer. And the screen does not change.

This is the most disorienting bug in React, because everything you can see is
working.

### Concept

**React re-renders when state changes. The question is what "changes" means.**

When you call a setter, React compares the new value to the old one with
`Object.is` — essentially `===`. If they are the same, it stops. No re-render,
no work, nothing.

Now look at what `push` does:

```js
const lines = [];
const same = lines;
same.push({ productId: 'a' });

lines === same;   // true — ONE array, two names
```

`push` changes the *contents*. It does not produce a new array. So React
compares the array to itself, finds no change, and correctly concludes there is
nothing to do. **React is not broken; it was told nothing happened.**

The fix is to build a new value:

```js
setLines([...lines, newLine]);          // new array  ✅
setProducts(products.map(...));         // new array  ✅
setFilters({ ...filters, search: 'x' }); // new object ✅
```

**Which methods mutate, and which return something new:**

| Mutates — avoid on state | Returns new — safe |
|---|---|
| `push` `pop` `shift` `unshift` | `[...arr, x]` `arr.concat(x)` |
| `splice` | `arr.filter(...)` `arr.slice(...)` |
| `sort` `reverse` | `[...arr].sort(...)` `arr.toSorted()` |
| `obj.key = value` | `{ ...obj, key: value }` |

> This is *not* about immutability being morally superior. It is that React's
> change detection is a reference comparison, and a reference comparison cannot
> see inside an object.

**The second half: `state` is a snapshot.**

Within a single render, a state variable never changes. So this does not do
what it looks like:

```tsx
setCount(count + 1);
setCount(count + 1);   // count is the SAME old value here. Net effect: +1
```

Both lines read the same `count`. The fix is the **functional updater**, which
React hands the latest value:

```tsx
setCount((current) => current + 1);
setCount((current) => current + 1);   // +2
```

**Rule of thumb: if the new value depends on the old one, use the function
form.** It is never wrong, and from Session 3 it stops being optional.

### Steps

**A. `src/App.tsx` — `TODO(lab-1.2)`.** Find `handleAddToCart`. It currently
does this:

```tsx
setCartLines([...cartLines, { productId: product.id, quantity: 1 }]);
```

**First, break it deliberately.** Change it to:

```tsx
cartLines.push({ productId: product.id, quantity: 1 });
setCartLines(cartLines);
```

Click "Add to cart". **Nothing happens.** Open the cart — empty. That is the
bug from the cold open, and now you own it.

Put it back, then fix the real problem: adding the same product twice creates a
second line instead of bumping the first.

```tsx
function handleAddToCart(product: Product) {
  setCartLines((current) => {
    const existing = current.find((line) => line.productId === product.id);
    if (existing) {
      return current.map((line) =>
        line.productId === product.id
          ? { ...line, quantity: line.quantity + 1 }
          : line,
      );
    }
    return [...current, { productId: product.id, quantity: 1 }];
  });
  setCartOpen(true);
}
```

> This handler is temporary. Lab 4 replaces the whole thing with a single
> `dispatch({ type: 'cart/add', … })` once the reducer exists. Write it the
> obvious way first — you want to have felt why the reducer is worth the
> ceremony before you pay for it.

Three things in there worth naming:

- **The functional updater.** The new lines depend on the current ones.
- **`.map()` returning a new array** — and note the other 23 objects inside it
  are *reused by reference*. Only the one that changed is new. That is what
  lets React skip re-rendering the rest, and Session 9 is about exactly this.
- **`{ ...line, quantity: … }`** — a new object for the line that changed, not
  `line.quantity += 1`.

### Verify

Add a product: the badge shows 1 and the cart sheet slides open. Add the same
one again: the badge shows 2 and there is still **one** line, quantity 2. Add
a different product: two lines.

### Watch out

**`setCartLines(cartLines)`** — passing the same array back is a no-op, whatever
you did to it first.

**Mutating inside `.map()`.** `current.map(line => { line.quantity += 1; return line; })`
creates a new *array* but the same *objects*. Anything comparing the line
objects still sees no change. New array **and** new object for what changed.

**`sort()` and `reverse()` mutate.** `products.sort()` reorders the array in
place and returns the same reference. You need `[...products].sort()`. Lab 2
depends on this.

### Challenge (2 min)

Add a "remove one" that decrements quantity and drops the line at zero. Do it
with a single `setCartLines` call and no `if` statement outside the updater.
(Hint: `.map()` then `.filter()`.)

### In the real world

"I updated the state but the component didn't re-render" is one of the most
common React questions ever asked, and the answer is nearly always a mutation.
It gets worse in a team: someone writes `array.push` in a helper three files
away and the symptom shows up somewhere unrelated. This is why teams reach for
Immer, or lint rules, or a state library that freezes its state. **All of them
exist because of the bug you just wrote.**

---

## Lab 2 — Lifting state, and derived state (22 min)

### Problem

The search box lives in the toolbar. The results live in the grid. They are
siblings — neither can see the other's state.

Your instinct might be to put the search text in `ProductToolbar` and pass it
down. But down to *where*? The grid is not inside the toolbar. There is no path
from one to the other except through their parent.

### Concept

**Lifting state up.** When two components need the same value, it moves to
their nearest common ancestor. The parent owns it; the children receive it and
report changes back up.

```
        App                    ← state lives here
       /   \
ProductToolbar  ProductGrid    ← both need it, neither can own it
```

The toolbar gets `filters` and `onChange`. It holds nothing. That makes it a
**controlled component**, and it is the default shape for anything reusable:
what it shows comes in through props, what the user does goes out through a
callback.

**Put state as low as you can, but high enough that everyone who needs it can
reach it.** Too low and you cannot share it. Too high and everything re-renders
and components carry props they do not care about.

**The bigger idea: derived state is not state.**

Here is the wrong version, and it looks completely reasonable:

```tsx
const [filters, setFilters] = useState(defaultFilters);
const [visible, setVisible] = useState(products);        // ❌

function handleFilterChange(patch) {
  const next = { ...filters, ...patch };
  setFilters(next);
  setVisible(selectVisibleProducts(products, next));     // ❌ keep them in step
}
```

Two sources of truth for one fact. Now every path that changes `filters` must
remember to update `visible` too — and **you have already forgotten one**:
delete a product in the back-office and `visible` still contains it, because
that path never touched the filters.

The right version has no second copy at all:

```tsx
const [filters, setFilters] = useState(defaultFilters);
const visible = selectVisibleProducts(products, filters);   // ✅ just compute it
```

Recomputed on every render, so it cannot disagree with anything. No syncing, no
stale copy, no bug.

> **"Isn't recomputing on every render slow?"** Filtering 24 items takes
> microseconds. It is slow when it is slow — and Session 9 teaches you to
> *measure* before spending anything on it. Correct first. Guessing at
> performance is how people make apps slower.

**Ask this before every `useState`:** *can I compute this from something I
already have?* If yes, compute it.

| Not state | Because |
|---|---|
| the filtered list | derived from products + filters |
| the cart total | derived from lines + products |
| `isFiltered` | derived from filters |
| the number of results | it's `list.length` |

### Steps

**A. `src/lib/filters.ts` — `TODO(lab-2.1)`.** Complete `selectVisibleProducts`:

```tsx
export function selectVisibleProducts(products: Product[], filters: ProductFilters): Product[] {
  const query = filters.search.trim().toLowerCase();

  const filtered = products.filter((product) => {
    if (query) {
      const haystack = `${product.name} ${product.brandName} ${product.categoryName}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (filters.categoryId !== 'all' && product.categoryId !== filters.categoryId) return false;
    if (filters.inStockOnly && product.stockQuantity === 0) return false;
    if (filters.onSaleOnly && !product.compareAtPrice) return false;
    return true;
  });

  const sorters: Record<SortKey, (a: Product, b: Product) => number> = {
    featured: () => 0,
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
    rating: (a, b) => b.rating - a.rating,
    name: (a, b) => a.name.localeCompare(b.name),
  };

  return [...filtered].sort(sorters[filters.sort]);
}
```

**The spread in `[...filtered].sort()` is not optional.** `sort` sorts in place.
Without the copy you would be reordering the array you were handed — and since
`filtered` came from `products`, "Featured" order would be gone permanently.

The `Record<SortKey, …>` lookup is worth noticing too: because `SortKey` is a
union, TypeScript requires an entry for every member. Add a sixth sort option
and the compiler tells you this object is incomplete.

**B. `src/components/ProductToolbar.tsx` — `TODO(lab-2.2)`.** The search input
is done as the worked example. Do the same for the rest.

Sort — Radix Select uses different prop names for the same idea:

```tsx
<Select value={filters.sort} onValueChange={(value) => onChange({ sort: value as SortKey })}>
```

Add `import { SORT_OPTIONS, type SortKey } from '@/types';`

Checkboxes:

```tsx
<Checkbox
  id="in-stock"
  checked={filters.inStockOnly}
  onCheckedChange={(checked) => onChange({ inStockOnly: checked === true })}
/>
```

**`checked === true` matters.** Radix checkboxes are tri-state — they can hand
you the string `"indeterminate"`, which is truthy. `Boolean(checked)` would set
your filter to `true` for a state that means "partially selected".

And derive `isFiltered`:

```tsx
const isFiltered =
  filters.search !== '' ||
  filters.categoryId !== 'all' ||
  filters.sort !== 'featured' ||
  filters.inStockOnly ||
  filters.onSaleOnly;
```

then wrap the Clear button: `{isFiltered && ( … )}`

**C. `src/App.tsx` — `TODO(lab-2.3)`.** Lift the filters:

```tsx
const [filters, setFilters] = useState<ProductFilters>(defaultFilters);

function handleFilterChange(patch: Partial<ProductFilters>) {
  setFilters((previous) => ({ ...previous, ...patch }));
}
```

Delete the `const filters: ProductFilters = defaultFilters;` line, and fix the
reset to `onReset={() => setFilters(defaultFilters)}`.

`visibleProducts` is already computed for you — look at it and notice it is a
plain `const`, not state.

**D. Now do the wrong thing, on purpose.** Add this next to it:

```tsx
const [visible, setVisible] = useState(products);   // ❌
```

and render `<ProductGrid products={visible} … />`. Type in the search box —
nothing filters, because nothing updates `visible`. Now add
`setVisible(selectVisibleProducts(products, next))` inside `handleFilterChange`
and it works… until you switch to the back-office and delete a product. **It is
still in the grid.**

Delete both lines. That is the lab.

### Verify

Type "laptop" — the grid narrows and the count updates. Sort by price, low to
high — cheapest first. Switch to Featured — **the original order comes back**
(if it does not, you mutated the array). Tick "In stock only" — the out-of-stock
card disappears. Combine all four. Hit Clear — everything resets and the Clear
button itself disappears.

### Watch out

**A missing `value` makes an input uncontrolled.** React warns:
*"A component is changing an uncontrolled input to be controlled."* It means
`value` was `undefined` on the first render and defined later.

**A `value` with no `onChange` gives you a read-only field.** You type and
nothing appears. React warns about this too — read your console.

**`filters.sort` typed as `string`.** `useState(defaultFilters)` infers the type
from `defaultFilters`, so this is handled — but if you build filters inline,
annotate them.

### Challenge (2 min)

Add a `minRating` filter, 0–5. Notice how many files you touch: the interface,
the default, the filter function, the toolbar. That count is the honest cost of
a new filter, and Session 4 makes it worse by adding the URL. Worth knowing now.

### In the real world

Derived-state bugs are the ones that survive code review, because the code that
creates them looks like careful bookkeeping. The tell is always the same: two
`useState`s where one can be computed from the other. When you review a PR and
see `setFilteredItems` next to `setItems`, that is the conversation to have.

---

## Lab 3 — Controlled inputs and forms (22 min)

### Problem

The back-office needs to add and edit products. Switch to it — the table is
there, the buttons are there, the dialog opens. Type into it and submit, and
nothing happens.

A form is where "who owns this value" stops being abstract. The DOM already
holds the text you typed. React wants to hold it too. Only one of them can be
right.

### Concept

**Uncontrolled:** the DOM owns the value. You read it when you need it.

```tsx
<input defaultValue="hello" ref={inputRef} />
inputRef.current.value   // ask the DOM
```

**Controlled:** React owns the value. The DOM only displays it.

```tsx
<input value={name} onChange={(e) => setName(e.target.value)} />
```

Both halves are mandatory and they fail differently:

| You wrote | What happens |
|---|---|
| `value` only | field is read-only; typing does nothing; React warns |
| `onChange` only | works, but React never knows the value |
| both | ✅ |

**Why controlled is the default:** you can read the whole form at any moment,
you can *change* it from code (which is exactly what "edit an existing product"
means), and validation is just a function of state.

**The cost is a re-render per keystroke.** At six fields that is invisible.
Session 7 measures where it stops being invisible and replaces this with React
Hook Form — which is uncontrolled, deliberately.

**Two things that catch everyone:**

**1. `event.preventDefault()`.** A `<form>` submit is a browser navigation. Skip
it and the page reloads and your whole app restarts.

**2. Inputs deal in strings.** `<input value={42}>` gives you `"42"` back.
`ProductDraft.price` is a `string` for that reason, converted only on submit.
Storing it as a number means fighting the input every keystroke — try typing
"1.5" into a field that runs `Number()` on every change.

### Steps

**A. `src/components/ProductFormDialog.tsx` — `TODO(lab-3.1)`.** The `name`
field is done. Do the other four the same way:

```tsx
<Input
  id="brandName"
  value={draft.brandName}
  onChange={(e) => setField('brandName', e.target.value)}
  placeholder="Aurelia"
  aria-invalid={Boolean(errors.brandName)}
  aria-describedby={errors.brandName ? 'brandName-error' : undefined}
/>
```

The category Select:

```tsx
<Select value={draft.categoryId} onValueChange={(value) => setField('categoryId', value)}>
```

Read `setField` above — one generic updater for every field, so a sixth field
costs nothing. It also clears that field's error as soon as you touch it,
because leaving a red message under a field somebody is actively fixing is just
nagging.

**B. `TODO(lab-3.2)` — validation.** Complete `validate`:

```tsx
function validate(candidate: ProductDraft): ProductDraftErrors {
  const next: ProductDraftErrors = {};
  if (candidate.name.trim().length < 3) next.name = 'Name must be at least 3 characters';
  if (!candidate.brandName.trim()) next.brandName = 'Brand is required';
  if (!candidate.categoryId) next.categoryId = 'Choose a category';

  const price = Number(candidate.price);
  if (!candidate.price.trim()) next.price = 'Price is required';
  else if (!Number.isFinite(price) || price <= 0) next.price = 'Price must be a positive number';

  const stock = Number(candidate.stockQuantity);
  if (!candidate.stockQuantity.trim()) next.stockQuantity = 'Stock is required';
  else if (!Number.isInteger(stock) || stock < 0) next.stockQuantity = 'Stock must be a whole number, 0 or more';

  return next;
}
```

Collect **all** the failures, not just the first. A form that reveals its
problems one at a time is miserable to fill in.

**Now the experiment.** Comment out `event.preventDefault()` in `handleSubmit`,
fill the form, and press Enter.

**The whole page reloads.** Your cart is gone. Your filters are gone. Everything
is gone. Put it back.

**C. `src/App.tsx` — `TODO(lab-3.3)`.** Wire create and edit:

```tsx
function handleSubmitProduct(draft: ProductDraft) {
  const category = categories.find((c) => c.id === draft.categoryId);
  const priceInPaise = Math.round(Number(draft.price) * 100);

  if (editing) {
    setProducts((previous) =>
      previous.map((product) =>
        product.id === editing.id
          ? {
              ...product,
              name: draft.name.trim(),
              brandName: draft.brandName.trim(),
              categoryId: draft.categoryId,
              categoryName: category?.name ?? product.categoryName,
              price: priceInPaise,
              stockQuantity: Number(draft.stockQuantity),
            }
          : product,
      ),
    );
  } else {
    const created: Product = {
      id: `prd_local_${Date.now().toString(36)}`,
      slug: draft.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      name: draft.name.trim(),
      brandName: draft.brandName.trim(),
      categoryId: draft.categoryId,
      categoryName: category?.name ?? 'Uncategorised',
      price: priceInPaise,
      compareAtPrice: null,
      currency: 'INR',
      rating: 0,
      reviewCount: 0,
      stockQuantity: Number(draft.stockQuantity),
      tags: ['new'],
    };
    setProducts((previous) => [created, ...previous]);
  }
  setEditing(null);
}
```

**D. The delete bug.** Delete already works. Now: add something to the cart,
switch to the back-office, delete that product, and look at the badge.

The line is gone from the cart display — `calculateCart` skips products it
cannot find — but the *line* is still in `cartLines`. Fix it in
`handleDeleteProduct` once the reducer exists in Lab 4.

### Verify

Add a product with an empty name and a price of "abc" — five error messages,
one per field, no submit. Fix them one at a time and watch each message clear
as you type. Submit — the product appears at the top of the table, and on the
storefront. Edit it — the dialog opens **pre-filled**. Change the price, save,
see it update in both places.

### Watch out

**Notice there is no `useEffect` copying the product into the form.** That is
deliberate. The dialog is only mounted while open (see App), so every open is a
fresh mount and `useState(() => toDraft(product))` runs again with the right
data. The effect version is the single most common "you might not need an
effect" mistake — and the React Hooks ESLint rule will fail your build for it.
Same mechanism as Session 1's `key` lesson: React ties state to identity.

**`Number('')` is `0`, not `NaN`.** An empty price would pass a naive
`price > 0` check if you convert before checking for emptiness. Check the string
first.

**A `<Select>` needs a non-empty `value`.** Radix treats `""` as "nothing
selected", which is what the placeholder is for.

### Challenge (2 min)

Make the dialog refuse a duplicate product name, case-insensitively — but allow
a product to keep its own name when editing. That `editing?.id !== product.id`
condition is the one everyone forgets, and it is why "save" sometimes rejects a
form nobody changed.

---

## Lab 4 — useReducer (22 min)

### Problem

The cart now needs six operations: add, remove, set quantity, apply promo, clear
promo, clear cart. Written as `useState` that is six handlers in `App`, each
spreading and mapping, several needing to know about the others — set quantity
to zero has to remove, clearing the cart has to clear the promo.

They are scattered across the component, mixed in with rendering, and there is
no single place to read what the cart can do.

### Concept

**`useReducer` puts all the transitions in one function.**

```tsx
const [state, dispatch] = useReducer(reducer, initialState);
dispatch({ type: 'cart/add', productId: 'x' });
```

A reducer is `(state, action) => newState`. That is all.

**Three rules:**

1. **Pure.** No fetch, no `Date.now()`, no `Math.random()`. Same inputs, same
   output — which is why you can test it with no React at all.
2. **Never mutates.** Every branch returns a new object. Lab 1's bug, waiting.
3. **Exhaustive.** Handle every action.

**`useState` or `useReducer`?** Not a style question — a complexity one:

| Reach for `useState` | Reach for `useReducer` |
|---|---|
| independent values | several that change together |
| 1–2 ways to update | many, or interdependent |
| the update is `setX(value)` | transitions have rules |
| a boolean, a string | a shape with invariants |

Six operations on one shape, several depending on each other, is comfortably
over the line.

**The typing is where it gets good.** `CartAction` is a **discriminated
union** — three of its six members, abbreviated here; the real one is in
`src/types.ts`:

```tsx
type CartAction =
  | { type: 'cart/add'; productId: string; quantity?: number }
  | { type: 'cart/setQuantity'; productId: string; quantity: number }
  | { type: 'cart/clear' };
```

Inside `case 'cart/add'`, TypeScript knows `action.productId` exists. Inside
`case 'cart/clear'` it knows it does not. And the `never` trick in `default`
means forgetting a case is a **compile error**:

```tsx
default: {
  const unhandled: never = action;   // fails to compile if any case is unhandled
  return unhandled;
}
```

**Why `dispatch` is nicer than passing six callbacks:** `dispatch` is stable —
React guarantees the same function identity for the life of the component. Pass
it down twenty levels and nothing re-renders because of it. Session 9 shows why
that matters.

### Steps

**A. `src/lib/cart.ts` — `TODO(lab-4.1)`.** Write the five missing cases. Full
version:

```tsx
export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'cart/add': {
      const quantity = action.quantity ?? 1;
      const existing = state.lines.find((line) => line.productId === action.productId);
      if (existing) {
        return {
          ...state,
          lines: state.lines.map((line) =>
            line.productId === action.productId
              ? { ...line, quantity: line.quantity + quantity }
              : line,
          ),
        };
      }
      return { ...state, lines: [...state.lines, { productId: action.productId, quantity }] };
    }

    case 'cart/remove':
      return { ...state, lines: state.lines.filter((line) => line.productId !== action.productId) };

    case 'cart/setQuantity': {
      if (action.quantity <= 0) {
        return { ...state, lines: state.lines.filter((line) => line.productId !== action.productId) };
      }
      return {
        ...state,
        lines: state.lines.map((line) =>
          line.productId === action.productId ? { ...line, quantity: action.quantity } : line,
        ),
      };
    }

    case 'cart/applyPromo':
      return { ...state, promoCode: action.code.trim().toUpperCase() };

    case 'cart/clearPromo':
      return { ...state, promoCode: null };

    case 'cart/clear':
      return initialCartState;

    default: {
      const unhandled: never = action;
      return unhandled;
    }
  }
}
```

Note `setQuantity` handling zero as a removal. Putting it here rather than in
the component means every caller gets it free — including the minus button,
which needs no special case.

**B. `src/App.tsx` — `TODO(lab-4.2)`.** Replace the `useState` cart:

```tsx
const [cart, dispatch] = useReducer(cartReducer, initialCartState);
```

Import `cartReducer` and `initialCartState`, delete `cartLines`/`setCartLines`
and the whole `handleAddToCart` body, and update the derived values:

```tsx
const cartTotals = calculateCart(cart.lines, products, cart.promoCode);
const cartQuantities = Object.fromEntries(cart.lines.map((line) => [line.productId, line.quantity]));
```

The grid's handler becomes one line:

```tsx
onAddToCart={(product) => {
  dispatch({ type: 'cart/add', productId: product.id });
  setCartOpen(true);
}}
```

Pass the real `dispatch` and `promoCode={cart.promoCode}` to `CartSheet`.

And finally fix Lab 3's delete bug:

```tsx
function handleDeleteProduct(productId: string) {
  setProducts((previous) => previous.filter((product) => product.id !== productId));
  dispatch({ type: 'cart/remove', productId });
}
```

**C. `src/components/CartSheet.tsx` — `TODO(lab-4.3)`.** Wire the buttons:

```tsx
onClick={() => dispatch({ type: 'cart/setQuantity', productId: product.id, quantity: quantity - 1 })}
onClick={() => dispatch({ type: 'cart/setQuantity', productId: product.id, quantity: quantity + 1 })}
onClick={() => dispatch({ type: 'cart/remove', productId: product.id })}
onClick={() => dispatch({ type: 'cart/clear' })}
onClick={() => dispatch({ type: 'cart/applyPromo', code: promoDraft })}
```

**D. Prove the exhaustiveness check is real.** Add
`| { type: 'cart/undo' }` to `CartAction` in `types.ts` and do *not* handle it.
`npm run typecheck` fails, pointing at the `never`. Remove it again.

### Verify

Add three different products. Change quantities with +/−. Drop one to zero — the
line disappears. Remove another with the bin. Apply `WELCOME10` — a discount
appears and **the tax recalculates on the discounted amount**. Apply `NOPE` —
"That code is not recognised". Apply `FLAT500` on a small cart — it tells you
the minimum spend. Clear the cart. Then: add something, delete it from the
back-office, and confirm the badge is right.

### Watch out

**A reducer that mutates.** `state.lines.push()` inside a reducer is Lab 1's bug
in a new house. Every branch returns a new object.

**Side effects in a reducer.** No fetch, no `localStorage`, no `Date.now()`.
React may call your reducer twice in development (StrictMode) to check it is
pure. Anything unpredictable belongs in the caller.

**Forgetting `dispatch` takes an object.** `dispatch('cart/clear')` is a
TypeScript error — the action is `{ type: 'cart/clear' }`.

### Challenge (2 min)

Add `cart/addMany` taking `{ productId, quantity }[]`, without duplicating the
add logic. (Hint: a reducer is a plain function — it can call itself with
`reduce`.)

### In the real world

Redux is this, with a store and middleware bolted on. Understanding
`useReducer` means you already understand Redux Toolkit, Zustand's set-function
patterns, and XState's transitions — they are all `(state, action) => newState`
with different packaging. Session 8 revisits this when the cart has to be
shared across the whole app.

---

## Wrap-up — what you can now do

- [x] Explain why `push` renders nothing, in terms of `Object.is`
- [x] Choose between `setX(v)` and `setX(prev => …)` and say why
- [x] Lift state to the right level, and justify it
- [x] Spot derived state pretending to be state
- [x] Write a controlled input, and name both halves
- [x] Recognise when `useState` has run out and reach for `useReducer`
- [x] Type actions so a missing case fails the build

**One question for Session 3:** every product still comes from a bundled file.
The moment it comes from a server, three things you have never had appear —
**loading**, **error**, and **empty**. What should the grid show while it waits?

## Homework

[HOMEWORK.md](./HOMEWORK.md) — about 45 minutes. Task 1 is the one to do.

## Next session

**Session 3 — Effects, the Network & Custom Hooks.** The app talks to a real
API. We open by typing fast in the search box and getting results for a query
we already deleted.

---

## Troubleshooting

| Symptom | Cause |
|---|---|
| clicking does nothing, no error | you mutated instead of replacing |
| typing does nothing | `value` with no `onChange` |
| *"changing an uncontrolled input to be controlled"* | `value` was `undefined` on the first render — default it to `''` |
| whole page reloads on submit | missing `event.preventDefault()` |
| Featured order never comes back | you sorted without copying first |
| deleted product still in the cart | two lists, no sync — Lab 4 step B |
| `Type 'string' is not assignable to 'SortKey'` | annotate, or cast at the boundary: `value as SortKey` |
| reducer case never runs | check the `type` string matches exactly |
