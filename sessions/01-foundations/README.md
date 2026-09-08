# Session 1 — Foundations & the Component Model

**Participant guide** · 2 hours · you will ship a working storefront

---

## What you ship today

A ShopCrew storefront that looks like a real shop: a sticky header with
working mobile navigation, a category strip, and a responsive grid of 24
product cards showing prices, discounts, ratings, stock warnings and a
wishlist button that remembers what you clicked.

By the end you will be able to answer, without hesitating:

- What a component is, and why props are one-way
- Why `key` exists and what breaks without it
- The four ways to render something conditionally, and when each one is right
- What `useState` actually does when the same component renders 24 times

---

## Before the session (20 minutes, please do this at home)

1. **Open the starter and let it install.** Click this, then leave the tab open:

   ```
   https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/sessions/01-foundations/starter
   ```

   The first `npm install` takes 2–4 minutes. Doing that in the room, thirty
   times at once, costs us a lab.

2. **Read [CHEATSHEET.md](./CHEATSHEET.md).** One page. Skim it; don't memorise it.

3. **Install React DevTools** in your browser
   ([Chrome](https://chromewebstore.google.com/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi) ·
   [Firefox](https://addons.mozilla.org/firefox/addon/react-devtools/)).
   We use it in Lab 4 and every session after.

### Prefer to work locally?

```bash
git clone https://github.com/vishalshah-utc/reactjs-workshops.git
cd reactjs-workshops/sessions/01-foundations/starter
npm install
npm run dev          # http://localhost:5173
```

Node 20.19+ or 22.12+ required. Check with `node -v`.

**There is no backend today.** Sessions 1 and 2 are about the component model
and local state; a network layer would only be noise. The products come from
`src/data/products.ts` — which is shaped exactly like what the API returns in
Session 3, so that swap will be a one-line change.

---

## How this guide works

Every lab has the same shape:

| | |
|---|---|
| **Problem** | What actually hurts, concretely |
| **Concept** | The idea that fixes it, explained plainly |
| **Steps** | What to type, in order, with the file named |
| **Verify** | The specific thing you should see |
| **Watch out** | The error you are most likely to hit, and why |
| **Challenge** | Two minutes, optional, harder |
| **In the real world** | Where this shows up on a real team |

Starter files carry numbered markers — `// TODO(lab-1.2)` — so you always know
where you are. Search for them (`Ctrl/Cmd+Shift+F`) if you get lost.

**If you fall behind, say so.** Your trainer has the finished version of every
file and will paste you the one you're stuck on. Falling behind on Lab 2 and
missing Lab 3 is much worse than asking. Do not sit quietly and lose the
session.

The full solution is published to this repo **straight after the session** —
you'll have it for the homework and for diffing against your own work. It is
held back until then on purpose: the labs are built around discovering a
couple of things for yourself, and reading ahead spends that for nothing.

---

## Orientation — what is in the box (5 min)

```
starter/
├── index.html              ← one empty <div id="root">. That is all the server sends.
├── vite.config.ts          ← React plugin, Tailwind plugin, the @/ alias
├── tsconfig.app.json       ← strict: true, from day one
└── src/
    ├── main.tsx            ← the entry point: attaches React to that div
    ├── index.css           ← Tailwind v4 + the design tokens
    ├── types.ts            ← the Product type
    ├── data/products.ts    ← 24 products, bundled
    ├── lib/utils.ts        ← cn(), formatPrice(), discountPercent()
    └── components/
        ├── ui/             ← shadcn/ui primitives. Pre-built. Yours to read.
        └── *.tsx           ← what YOU build today
```

Three things to notice before we start:

**`index.html` is nearly empty.** One `<div id="root">`. Everything else on
the page is created by JavaScript at runtime. That is what "single-page app"
means, and in Session 10 you will see the cost of it.

**There is no `tailwind.config.js`.** Tailwind v4 puts the theme in CSS. Open
`src/index.css` and look at the `@theme` block — every token there becomes a
utility class. `--color-primary` gives you `bg-primary`, `text-primary`,
`border-primary`. Change the value once, the whole app moves.

**`components/ui/` is not a dependency.** shadcn/ui is source code you own.
Open `ui/button.tsx` — it is 40 lines and you can read all of it. That is the
whole point of the approach, and in Session 9 you will build one of your own.

---

## Lab 1 — Your first component (22 min)

### Problem

Open the app. It is a white page with the word "ShopCrew" in the top left and
nothing else. There is no navigation, no search, no cart. Before we can put
products on a page we need a page to put them on.

More to the point: you are about to write your first React component and you
need to know what one actually *is*, because every other thing in this course
is built out of them.

### Concept

**A component is a function that returns markup.** That is the whole idea.

```tsx
function Greeting() {
  return <p>Hello</p>;
}
```

Call it like an HTML tag — `<Greeting />` — and React runs the function and
puts what it returns on the page. The capital letter is not a style choice:
lowercase `<greeting />` means "an HTML element called greeting", uppercase
`<Greeting />` means "a component in scope called Greeting". Get it wrong and
React silently renders nothing.

**JSX is not HTML.** It looks like HTML and compiles to JavaScript function
calls. Four differences bite everyone on day one:

| JSX | HTML | Why |
|---|---|---|
| `className` | `class` | `class` is a reserved word in JavaScript |
| `htmlFor` | `for` | same reason |
| `<img />` | `<img>` | every tag must close |
| `{expression}` | — | curly braces drop back into JavaScript |

That last one is the important one. **Curly braces take an expression, not a
statement.** An expression is anything that produces a value: `product.name`,
`2 + 2`, `items.map(...)`, `a ? b : c`. A statement — `if`, `for`, `const` —
is not allowed inside JSX, and that constraint is why React code looks the way
it does.

**Props are how a component receives data.** They arrive as one object,
conventionally destructured in the parameter list:

```tsx
function Greeting({ name }: { name: string }) {
  return <p>Hello {name}</p>;
}

<Greeting name="Priya" />
```

Props flow **one way**: parent to child, always. A child cannot reach up and
change its parent's data. That restriction is what makes a React app
traceable — when something on screen is wrong, the value came from somewhere
above it, and you can walk up the tree until you find it.

### Steps

All four steps are in **`src/components/SiteHeader.tsx`**. Open it now and
keep it open.

Two of the steps need a new import at the top of the file. They are called out
where they happen — if you forget one you get `Input is not defined`, which
looks like a React error and is really a missing import.

1. **`TODO(lab-1.1)` — give the component props.** It currently takes none.
   **Replace the line `export function SiteHeader() {`** with:

   ```tsx
   interface SiteHeaderProps {
     cartCount?: number;
   }

   export function SiteHeader({ cartCount = 0 }: SiteHeaderProps) {
   ```

   The `?` makes it optional; `= 0` is the default when the caller omits it.
   Two different mechanisms — TypeScript's and JavaScript's — that you almost
   always use together.

   Then in **`src/App.tsx`**, pass a value: `<SiteHeader cartCount={3} />`.
   Nothing visible changes yet — that's expected.

2. **`TODO(lab-1.2)` — render the nav links.** Inside the existing `<nav>`
   there is **one hand-written `<a>` for `NAV_LINKS[0]`. Delete it and the
   comment above it**, and put the `.map()` in its place. Leave the `<nav>`
   itself alone — its `gap-1` is what spaces the links:

   ```tsx
   <nav className="ml-4 hidden items-center gap-1 md:flex">
     {NAV_LINKS.map((link) => (
       <a
         key={link.label}
         href={link.href}
         className="text-muted-foreground hover:text-foreground rounded-md px-3 py-2 text-sm font-medium transition-colors"
       >
         {link.label}
       </a>
     ))}
   </nav>
   ```

   `hidden md:flex` is Tailwind's mobile-first responsive syntax: hidden by
   default, `display: flex` from the `md` breakpoint up. We fix the mobile
   case in Lab 4.

3. **`TODO(lab-1.3)` — add the search box.** **Replace the bare
   `<SearchIcon … />` placeholder.** Add the import first:

   ```tsx
   import { Input } from '@/components/ui/input';
   ```

   The wrapper is `relative` and the icon is `absolute` — that is how you
   overlay an icon on an input:

   ```tsx
   <div className="relative hidden sm:block">
     <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
     <Input
       type="search"
       placeholder="Search products"
       aria-label="Search products"
       className="w-44 pl-8 lg:w-64"
     />
   </div>
   ```

   `pointer-events-none` on the icon matters: without it, clicking the
   magnifying glass hits the icon instead of focusing the input underneath.

4. **`TODO(lab-1.4)` — show the cart count.** The badge goes **inside the
   existing cart `<Button>`, right after `<ShoppingCartIcon />`.** Add the
   import first:

   ```tsx
   import { Badge } from '@/components/ui/badge';
   ```

   Then replace the whole cart button with:

   ```tsx
   <Button variant="ghost" size="icon" aria-label={`Cart, ${cartCount} items`} className="relative">
     <ShoppingCartIcon />
     {cartCount > 0 && (
       <Badge className="absolute -top-0.5 -right-0.5 size-4 justify-center p-0 text-[10px] tabular-nums">
         {cartCount}
       </Badge>
     )}
   </Button>
   ```

   `relative` on the button and `absolute` on the badge are a pair: the badge
   positions itself against the nearest positioned ancestor. Put the badge
   outside the button and it flies to the corner of the page. That `relative`
   was already in the starter, waiting for you.

   Note the `aria-label` changed too — a screen reader user now hears
   "Cart, 3 items" rather than just "Cart". The badge is visual only; the
   label carries the actual information.

### Verify

A sticky header with five nav links, a search box, and a cart icon carrying a
badge reading **3**. Scroll — the header stays pinned with a blur behind it.
Narrow the window below 768px and the nav links disappear (that is correct;
Lab 4 fixes it).

Now change `cartCount={3}` to `cartCount={0}`. The badge vanishes. Change it
back.

### Watch out

**`cartCount &&` instead of `cartCount > 0 &&`.** When `cartCount` is `0`,
`0 && <Badge/>` evaluates to `0` — and React renders the number zero. You get
a literal "0" floating next to your cart icon. `&&` returns the *left* value
when it is falsy, and React renders `0` but ignores `false`, `null` and
`undefined`. **Always compare explicitly.** This is the single most common
React rendering bug and you will hit it again.

**`class=` instead of `className=`.** React warns in the console. Read your
console warnings — React's are unusually good.

### Challenge (2 min)

Add a "Sale" nav link that renders in red. Do it *without* touching the JSX in
step 2 — only the `NAV_LINKS` array. If you can't, your component isn't
data-driven enough. (Hint: add a field to the objects and use it in `className`
with the `cn()` helper.)

### In the real world

That `cartCount?: number` prop is a design decision you will make hundreds of
times: does the header *fetch* the cart count, or is it *given* one? Given, in
almost every case. A component that fetches its own data cannot be reused,
cannot be tested without a network mock, and cannot be rendered twice on one
page. This is the "dumb component" or "presentational component" rule, and
Session 5 is where it earns its keep.

---

## Lab 2 — Props and composition (22 min)

### Problem

Every product card needs to show a price. Sometimes there is a discount, so it
needs a struck-through original and a "23% off" flash. Sometimes it is bigger,
on the product detail page. Sometimes smaller, in the cart.

The tempting move is one component with a prop for each case:
`<Price value big showDiscount showCurrency bold />`. Six months later it has
fourteen boolean props, four of which contradict each other, and nobody
remembers whether `big` overrides `size`.

### Concept

**Composition over configuration.**

When a component needs to be flexible, there are two ways to give it
flexibility, and they age very differently:

**Configuration** — a prop per possibility:

```tsx
<PageHeader title="Products" actionLabel="Export" onAction={...} showCount count={24} />
```

Every new requirement is a new prop. The component grows forever, and it has
to *anticipate* everything a caller might want.

**Composition** — a slot the caller fills:

```tsx
<PageHeader
  title="Products"
  actions={<Button onClick={exportCsv}>Export</Button>}
/>
```

`actions` is typed `ReactNode` — "any renderable thing". A button. Three
buttons. A dropdown. A live count. The component never changes again, because
it never needed to know.

**`children` is the same idea with special syntax.** Anything between a
component's tags arrives as the `children` prop:

```tsx
<Card>
  <p>Anything at all</p>     {/* this is `children` */}
</Card>
```

**Derived values are not props.** If you can compute it from what you already
have, compute it. The discount percentage is `(compareAtPrice - price) /
compareAtPrice` — passing it as a separate `discountPercent` prop means two
sources of truth that can drift apart. Session 2 makes this a hard rule.

### Steps

**A. `src/components/PageHeader.tsx` — `TODO(lab-2.1)`**

Give it a slot:

```tsx
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;      // ← the slot
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
```

**B. `src/components/PriceTag.tsx` — `TODO(lab-2.2)`**

```tsx
export function PriceTag({ price, compareAtPrice, currency = 'INR', size = 'md', className }: PriceTagProps) {
  const saving = discountPercent(price, compareAtPrice ?? null);   // derived, not a prop

  const sizes = { sm: 'text-sm', md: 'text-base', lg: 'text-2xl' } as const;

  return (
    <div className={cn('flex flex-wrap items-baseline gap-x-2 gap-y-0.5', className)}>
      <span className={cn('font-semibold tabular-nums', sizes[size])}>
        {formatPrice(price, currency)}
      </span>

      {saving !== null && (
        <>
          <s className="text-muted-foreground text-xs tabular-nums">
            {formatPrice(compareAtPrice!, currency)}
          </s>
          <span className="text-success text-xs font-medium">{saving}% off</span>
        </>
      )}
    </div>
  );
}
```

Three things in there worth naming:

- **`<>...</>` is a Fragment.** A component must return *one* node. When you
  need two siblings and don't want a pointless `<div>`, wrap them in a
  Fragment — it renders nothing itself.
- **`<s>`, not `line-through`.** A CSS class looks identical and means nothing.
  `<s>` tells a screen reader the old price no longer applies. Semantics are
  not decoration.
- **`tabular-nums`.** Forces fixed-width digits so prices in a grid line up
  instead of jittering. A one-class fix for something that looks broken.

**C. `src/components/Rating.tsx` — `TODO(lab-2.3)`**

```tsx
export function Rating({ value, reviewCount, className }: RatingProps) {
  if (value === 0) {
    return <span className={cn('text-muted-foreground text-xs', className)}>No reviews yet</span>;
  }

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="flex items-center gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, index) => (
          <StarIcon
            key={index}
            className={cn('size-3.5', index < Math.round(value) ? 'fill-warning text-warning' : 'text-muted-foreground/40')}
          />
        ))}
      </div>
      <span className="text-muted-foreground text-xs tabular-nums">
        {value.toFixed(1)}{reviewCount !== undefined && ` (${reviewCount})`}
      </span>
      <span className="sr-only">
        Rated {value.toFixed(1)} out of 5{reviewCount !== undefined && ` from ${reviewCount} reviews`}
      </span>
    </div>
  );
}
```

`Array.from({ length: 5 })` is the idiom for "render a fixed number of things".
There is no `for` loop in JSX — a loop is a statement, and JSX takes
expressions. `.map()` returns an array, and React renders arrays.

Note: `key={index}` **is** correct here. This list never reorders, never
filters, and has no state. Lab 3 is about when that stops being true.

**D. `src/components/StockBadge.tsx` — `TODO(lab-2.4)`**

```tsx
export function StockBadge({ stockQuantity, lowStockThreshold = 5 }: StockBadgeProps) {
  if (stockQuantity === 0) return <Badge variant="destructive">Out of stock</Badge>;
  if (stockQuantity <= lowStockThreshold) return <Badge variant="warning">Only {stockQuantity} left</Badge>;
  return <Badge variant="secondary">In stock</Badge>;
}
```

Three branches as three early returns. Nested ternaries would fit on one line
and be much worse to read.

### Verify

Nothing changes on screen yet — these components are not used until Lab 3.
Instead, check they compile: the terminal should show no TypeScript errors,
and your editor should show none either. Temporarily drop
`<PriceTag price={129900} compareAtPrice={169900} />` into `App.tsx` to see
**₹1,299** with a struck-through **₹1,699** and **24% off**. Then remove it.

### Watch out

**`compareAtPrice!`** — that `!` is TypeScript's non-null assertion, telling
the compiler "trust me, this isn't null". It is safe *here* only because
`saving !== null` already proves it. Used carelessly it is how you turn a
compile-time error into a runtime crash. Prefer narrowing over asserting.

**`as const` on the `sizes` object.** Without it TypeScript widens the values
to `string` and `sizes[size]` loses its type. With it, they stay literal.

### Challenge (2 min)

`PriceTag` currently shows the saving as a percentage. Make it show the rupee
amount instead when the saving is over ₹5,000 — "Save ₹8,700" reads better
than "12% off" on expensive items. Keep it derived; add no props.

### In the real world

The `actions?: ReactNode` slot is how every serious component library works —
MUI's `action`, Ant's `extra`, shadcn's `children`. When you review a PR that
adds a fifth boolean prop to a shared component, this is the conversation to
have: *should this be a slot?* Usually, yes.

---

## Lab 3 — Lists, keys, and conditional rendering (22 min)

### Problem

We have 24 products in an array and components that can render one. Now we
need all of them on screen — and we need to handle the awkward cases: one
product is out of stock, one has no reviews, one is nearly sold out, several
are on sale, and the grid can be empty when a filter matches nothing.

And there is a bug waiting for you. We are going to write it deliberately,
watch it break, and then understand it — because it is the single most common
React bug and you will meet it in real code within a month.

### Concept

**Rendering a list is `.map()`.** An array of data becomes an array of
elements, and React renders arrays:

```tsx
{products.map((product) => <ProductCard key={product.id} product={product} />)}
```

**`key` is not optional, and it is not for you.** It is how React answers a
question it must answer on every single render: *which of these items is which?*

React does not re-create the whole page when something changes. It compares
the new tree to the old one and patches the differences. For a list, "the
differences" is ambiguous without help — if a list goes from 3 items to 3
different items, did all three change, or did one get inserted at the top?

`key` removes the ambiguity. Give React `key={product.id}` and it knows that
the card for `prd_004339` is the same card it rendered last time, wherever it
has moved to. It moves the DOM node and keeps the component's state attached.

**`key={index}` is the trap.** An index describes a *position*, not an item.
When the list reorders, React sees "item at position 0" and concludes it is
still the same item, only with different contents. So it keeps the old
component state at that position — and any state living inside those items
attaches to the wrong data.

With no state in the row, you get away with it. Add a checkbox, an input, an
animation, or a wishlist heart, and it breaks in a way that looks like
witchcraft.

**Four ways to render conditionally**, and each has a right time:

| Idiom | Use when | Example |
|---|---|---|
| `cond && <X/>` | render or nothing | `{isNew && <Badge>New</Badge>}` |
| `cond ? <X/> : <Y/>` | genuine either/or | `{out ? 'Sold out' : 'Add to cart'}` |
| early `return` | a whole different view | the empty state |
| extract a component | 3+ branches | `<StockBadge />` |

### Steps

**A. `src/components/ProductCard.tsx` — `TODO(lab-3.1)`**

Build the card. The image block first:

```tsx
const isOutOfStock = product.stockQuantity === 0;
const isCompact = density === 'compact';

return (
  <Card className={cn('group relative overflow-hidden transition-shadow hover:shadow-md', isOutOfStock && 'opacity-75')}>
    <div className="bg-muted relative aspect-square overflow-hidden">
      <ProductImage
        seed={product.slug}
        name={product.name}
        className="transition-transform duration-300 group-hover:scale-105"
      />

      {product.tags.includes('bestseller') && <Badge className="absolute top-2 left-2">Bestseller</Badge>}
      {product.tags.includes('new') && <Badge variant="success" className="absolute top-2 left-2">New</Badge>}
    </div>
    {/* ...content next... */}
  </Card>
);
```

**B. `TODO(lab-3.2)` — add the wishlist heart, with state.**

Inside `ProductCard`, at the top of the function:

```tsx
const [saved, setSaved] = useState(false);
```

and in the image block, after the badges:

```tsx
<Button
  type="button"
  variant="secondary"
  size="icon"
  aria-pressed={saved}
  aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
  onClick={() => setSaved((wasSaved) => !wasSaved)}
  className="absolute top-2 right-2 rounded-full shadow-sm"
>
  <HeartIcon className={cn('size-4', saved && 'fill-destructive text-destructive')} />
</Button>
```

**Stop and think about this for a moment.** `useState` is called once in the
source, but this component renders 24 times. Does every card share one `saved`
value?

No. **Each rendered instance gets its own.** React keeps them apart by the
component's position in the tree — which is exactly why `key` matters, and
what we are about to break.

**C. `TODO(lab-3.3)` — the card content.**

```tsx
<CardContent className={cn('flex flex-col gap-2', isCompact ? 'p-3' : 'p-4')}>
  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{product.brandName}</p>

  <h3 className={cn('font-medium leading-snug', isCompact ? 'line-clamp-1 text-sm' : 'line-clamp-2')}>
    {product.name}
  </h3>

  {!isCompact && <Rating value={product.rating} reviewCount={product.reviewCount} />}

  <PriceTag
    price={product.price}
    compareAtPrice={product.compareAtPrice}
    currency={product.currency}
    size={isCompact ? 'sm' : 'md'}
  />

  {!isCompact && <StockBadge stockQuantity={product.stockQuantity} />}
</CardContent>

<CardFooter className={cn('mt-auto', isCompact ? 'p-3 pt-0' : 'p-4 pt-0')}>
  <Button className="w-full" size={isCompact ? 'sm' : 'default'} disabled={isOutOfStock}
          variant={isOutOfStock ? 'secondary' : 'default'}>
    {isOutOfStock ? 'Out of stock' : (<><ShoppingCartIcon />Add to cart</>)}
  </Button>
</CardFooter>
```

**D. `src/components/ProductGrid.tsx` — `TODO(lab-3.4)`**

Empty state first, as an early return:

```tsx
if (products.length === 0) {
  return (
    <div className="border-border flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
      <PackageOpenIcon className="text-muted-foreground size-8" />
      <div>
        <p className="font-medium">No products found</p>
        <p className="text-muted-foreground text-sm">Try a different category.</p>
      </div>
    </div>
  );
}
```

Then the grid:

```tsx
return (
  <ul className={cn('grid list-none grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3',
                    density === 'compact' ? 'xl:grid-cols-5' : 'xl:grid-cols-4')}>
    {products.map((product) => (
      <li key={product.id} className="flex">
        <ProductCard product={product} density={density} />
      </li>
    ))}
  </ul>
);
```

**E. Wire it up** in `App.tsx` — `TODO(lab-3.5)`:

```tsx
<ProductGrid products={products} />
```

**F. Now break it on purpose. This is the important part.**

1. Change the key to the index:
   ```tsx
   {products.map((product, index) => (
     <li key={index} className="flex">
   ```
2. Reload. Click the heart on the **first three** cards.
3. In `App.tsx`, temporarily reverse the list:
   ```tsx
   <ProductGrid products={[...products].reverse()} />
   ```
4. Look at the grid.

**The hearts did not move with their products.** They stayed on positions 1, 2
and 3 — which are now completely different products. You have just "saved"
three things you never clicked.

Now change the key back to `key={product.id}`, reload, click three hearts, and
reverse again. The hearts follow their products.

Undo the `.reverse()`.

### Verify

A responsive grid: one column on mobile, two on small screens, three on
large, four on extra-large. Within it you should be able to find:

- one card greyed out with a red **Out of stock** badge and a disabled button
- one with an amber **Only 3 left**
- one reading **No reviews yet** instead of stars
- several with a struck-through price and a green **% off**
- a few with **Bestseller** or **New** in the corner

Click a heart — it fills red and stays filled. Click another card's heart —
both stay filled independently.

### Watch out

**Missing `key` entirely.** React logs *"Warning: Each child in a list should
have a unique key prop"*. It still renders, which is why people ignore it. Do
not ignore it.

**`key` on the wrong element.** The key goes on the **outermost element
returned by the `.map()` callback** — here that is the `<li>`, not the
`<ProductCard>` inside it. Put it on the inner element and React still warns.

**Duplicate keys.** Two items with the same key is worse than none — React
will drop or merge them. If your data has no stable unique id, that is a data
problem to fix at the source, not with `Math.random()` (which generates a new
key every render and destroys all state and all performance).

**`<ul>` needs `list-none`.** Tailwind's reset does not remove list markers.

### Challenge (2 min)

Products with `compareAtPrice` are on sale. Sort the grid so all sale items
come first, without mutating the `products` array. (Hint: `[...products].sort()`
— and think about why the spread is not optional. Session 2's first lab is
entirely about this.)

### In the real world

The index-as-key bug almost never shows up in the simple case. It shows up
six months later when someone adds a "sort by price" dropdown to a list of
rows that contain form inputs, and users start reporting that their typing
jumps to a different row. Nobody connects that to a `key` written a year
earlier by someone else. **Now you will.**

---

## Lab 4 — State, and the tools to see it (22 min)

### Problem

Two things are still broken. On a phone, the navigation links are simply gone
— `hidden md:flex` hides them and nothing replaces them. And the grid is fixed
at one density, when a shopper scanning 200 products wants them packed tighter
than someone browsing 12.

Both need the app to *remember something* and re-render when it changes. That
is state.

### Concept

**`useState` gives a component memory that survives re-renders.**

```tsx
const [count, setCount] = useState(0);
//     ^value  ^setter          ^initial
```

Three things about it that matter more than the syntax:

**1. Setting state schedules a re-render.** It does not change the variable in
place. `count` is a `const` — it genuinely cannot be reassigned. Calling
`setCount(1)` tells React "run this component again, and next time hand it 1".

**2. The value is a snapshot.** Within one render, `count` never changes. This
surprises everyone once:

```tsx
setCount(count + 1);
setCount(count + 1);   // count is still the OLD value here — result is +1, not +2
```

The fix is the **functional updater**, which receives the latest value:

```tsx
setCount((c) => c + 1);
setCount((c) => c + 1);   // +2
```

Use the functional form whenever the new value depends on the old one. It is
never wrong, and it is required in Session 3 once effects are involved.

**3. Where state lives determines who can use it.** State in `ProductCard` is
private to that card. State in `App` can be handed to any child. Put it as low
as possible, but high enough that everyone who needs it can reach it. When two
siblings need the same value, it goes in their nearest common parent — that is
"lifting state up", and Session 2 is largely about it.

**Radix handles the hard part of the mobile menu.** The `Sheet` component
manages its own open/closed state, traps focus inside while open, closes on
Escape, returns focus to the trigger, marks the rest of the page
`aria-hidden`, and locks background scroll. Writing that correctly by hand is
a day's work.

### Steps

**A. `src/components/SiteHeader.tsx` — `TODO(lab-4.1)` — mobile navigation.**

Add above the logo, as the first child of the header's inner div:

```tsx
<Sheet>
  <SheetTrigger asChild>
    <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
      <MenuIcon />
    </Button>
  </SheetTrigger>
  <SheetContent side="left">
    <SheetHeader>
      <SheetTitle className="flex items-center gap-2">
        <StoreIcon className="text-primary size-5" />
        ShopCrew
      </SheetTitle>
    </SheetHeader>
    <nav className="flex flex-col gap-1">
      {NAV_LINKS.map((link) => (
        <SheetClose asChild key={link.label}>
          <a href={link.href} className="hover:bg-accent rounded-md px-3 py-2 text-sm font-medium">
            {link.label}
          </a>
        </SheetClose>
      ))}
    </nav>
  </SheetContent>
</Sheet>
```

`asChild` is worth understanding. Without it, `SheetTrigger` renders its own
`<button>` — and you would have a button inside a button, which is invalid
HTML and breaks keyboard navigation. `asChild` says "don't render an element,
merge your behaviour into my child instead". Same for `SheetClose asChild`
around each link: tapping a link both navigates and closes the sheet.

**B. `src/App.tsx` — `TODO(lab-4.2)` — density state.**

```tsx
const [density, setDensity] = useState<GridDensity>('comfortable');
```

The type parameter is needed here: `useState('comfortable')` would be inferred
as `string`, and `setDensity('compact')` would then be legal but so would
`setDensity('banana')`. `useState<GridDensity>` pins it to the union.

**C. `TODO(lab-4.3)` — the toggle, passed into `PageHeader`'s slot.**

```tsx
<PageHeader
  title="All products"
  description={`${visibleProducts.length} of ${products.length} products`}
  actions={
    <div className="flex items-center gap-1 rounded-md border p-1">
      <Button variant={density === 'comfortable' ? 'secondary' : 'ghost'} size="sm"
              onClick={() => setDensity('comfortable')} aria-pressed={density === 'comfortable'}>
        <LayoutGridIcon />
        <span className="hidden sm:inline">Comfortable</span>
      </Button>
      <Button variant={density === 'compact' ? 'secondary' : 'ghost'} size="sm"
              onClick={() => setDensity('compact')} aria-pressed={density === 'compact'}>
        <RowsIcon />
        <span className="hidden sm:inline">Compact</span>
      </Button>
    </div>
  }
/>
```

This is Lab 2's slot paying off — `PageHeader` needed no changes at all.

**D. `TODO(lab-4.4)` — category selection.**

```tsx
const [activeCategory, setActiveCategory] = useState('all');

const categories = buildCategories(products);

// DERIVED. There is no useState for this.
const visibleProducts =
  activeCategory === 'all' ? products : products.filter((p) => p.categoryId === activeCategory);
```

and render:

```tsx
<CategoryStrip categories={categories} activeId={activeCategory} onSelect={setActiveCategory} />
<ProductGrid products={visibleProducts} density={density} />
```

Look at what `CategoryStrip` receives: the current selection, and a function
to call when it changes. It holds no state of its own. That is a **controlled
component**, and it is the default shape for anything reusable.

And note what is *not* there: no `useState` for the filtered list. It is
computed from `activeCategory` on every render. Storing it would give you two
sources of truth that can disagree — which is the bug Session 2 opens with.

**E. `TODO(lab-4.5)` — the DevTools tour.** Open React DevTools (a
**Components** tab appears in your browser devtools).

1. **Find `App`.** Its `hooks` panel shows `State: "all"` and
   `State: "comfortable"`. Click a category chip and watch the first change.
2. **Edit state live.** Double-click the value and change it. The page
   updates. You did not touch the code.
3. **Expand a `ProductCard`.** See its own `State: false` for `saved`. Click
   its heart; watch it flip. Now expand a *different* card — still `false`.
   That is 24 independent pieces of state, exactly as promised in Lab 3.
4. **Turn on re-render highlighting.** In the DevTools settings (the gear),
   check **"Highlight updates when components render"**. Now click a heart.

   **Notice what flashes.** Just the one card? Or every card on the page?

   Sit with that. We are not fixing it today — that is Session 9, and fixing
   it before you can measure it is how people make apps slower while trying to
   make them faster. But you have just seen the thing that Session 9 is about.

### Verify

- Narrow the browser under 768px: a hamburger appears. Tap it — a panel slides
  in from the left. Press **Escape** — it closes and focus returns to the
  hamburger. Tab through it — focus stays trapped inside.
- Click **Compact** — cards tighten, ratings and stock badges disappear, five
  columns on a wide screen.
- Click a category chip — the grid filters and the description count updates.
- Click **All** — everything comes back.
- Hearts you clicked are still filled after filtering. (Are they? Check. Then
  check what happens if you filter to a category and back — and think about
  why. This is Session 2's homework.)

### Watch out

**`useState` inside a condition or a loop.** React tracks hooks by call order,
so they must run in the same order every render. `if (x) { useState() }` is
the one rule you cannot break. The ESLint plugin catches it — do not disable it.

**`onClick={setDensity('compact')}`** — missing arrow function. That *calls*
the setter during render, which sets state during render, which re-renders,
which calls it again: an infinite loop. React throws "Too many re-renders".
It must be `onClick={() => setDensity('compact')}`.

**Mutating state.** `activeCategory = 'laptops'` does nothing — it is a
`const`, and even if it weren't, React would never know. Always go through the
setter.

### Challenge (2 min)

Add a third density, `'cosy'`, between the two. Notice how much you have to
change: the `GridDensity` type, the toggle, the grid columns, the card
padding. If that felt like too many places, you have found the argument for
putting design tokens in one file — which is what `index.css` is for.

### In the real world

"Where should this state live?" is the question you will spend the most time
on for the next five years. Too low and you cannot share it. Too high and
everything re-renders and every component needs props it does not care about.
Sessions 2, 5 and 8 each answer it for a different kind of state — local, from
the server, and truly global — and the answer is different every time.

---

## Wrap-up — what you can now do

- [x] Write a component and know why the capital letter matters
- [x] Pass props, give them defaults, and type them
- [x] Choose composition (`children`, slots) over a pile of boolean props
- [x] Render a list, and pick a key that will not betray you in six months
- [x] Pick the right conditional idiom out of four
- [x] Hold state with `useState` and know it is per-instance
- [x] Read component state in DevTools and see what re-renders

**One question to bring to Session 2:** the wishlist forgets everything on
reload, and every card holds its own `saved` flag with no way to ask "what is
on the wishlist?". Where should that state actually live?

## Homework

[HOMEWORK.md](./HOMEWORK.md) — three tasks, about 45 minutes.

The session solution is published to this repo right after we finish, so you
can check your work against it. Try first.

## Next session

**Session 2 — State, Events & Controlled UI.** Search, filter and sort that
actually work, a create/edit dialog, and the cart reducer. We open by making
the app render nothing at all with a single innocent line of code.

---

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| Blank white page | Check the browser console. A component that throws renders nothing. |
| `Objects are not valid as a React child` | You put an object in `{}`. You probably meant `{product.name}`, not `{product}`. |
| A stray `0` on the page | `{count && <X/>}` with `count === 0`. Use `{count > 0 && <X/>}`. |
| Styles missing entirely | Is `import '@/index.css'` still in `main.tsx`? |
| A Tailwind class does nothing | Class names must be complete literal strings. `` className={`text-${color}`} `` cannot be found by the scanner. Use `cn()` with whole class names. |
| `Cannot find module '@/...'` | The alias is in both `vite.config.ts` and `tsconfig.app.json`. Restart the dev server after editing either. |
| Console logs appearing twice | `<StrictMode>` double-invoking, in development only. Working as intended — Session 3 explains what it catches. |
| StackBlitz feels stuck | Hard-refresh the tab. Failing that, re-open the fork link. |
