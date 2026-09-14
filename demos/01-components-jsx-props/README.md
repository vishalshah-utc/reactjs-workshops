# Demo 1 — Components, JSX & Props

**Demo guide** · ~90 minutes · you ship a product card built from four components

---

## What you ship today

A ShopScope page with a sticky dark header (brand, nav links, search box, a
cart icon carrying a count), a page title with an action slot, and three
product cards showing price, discount, rating, stock status and an
add-to-cart button that disables itself when there is nothing to add.

By the end you will be able to answer, without hesitating:

- What a component is, and why the capital letter is not a style choice
- What JSX actually is, and the four ways it is not HTML
- How props flow, why they flow one way, and how to give them defaults
- Why "composition over configuration" is the design rule for shared components
- Why a discount percentage is *derived*, not stored

---

## Before the demo (10 minutes)

1. **Open the starter and let it install.** Click this, then leave the tab open:

   ```
   https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/01-components-jsx-props/starter
   ```

   > ⚠️ **Click that link once, then bookmark the tab.** Every click of a
   > `/fork/` link gives you a brand-new copy of the starter — not the work you
   > did earlier. Once it loads, the address bar changes to a
   > `stackblitz.com/edit/…` URL. That is your project; bookmark it.

2. **Install React DevTools**
   ([Chrome](https://chromewebstore.google.com/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi) ·
   [Firefox](https://addons.mozilla.org/firefox/addon/react-devtools/)).
   Lab 4 is a tour of it.

### Prefer to work locally?

```bash
git clone https://github.com/vishalshah-utc/reactjs-workshops.git
cd reactjs-workshops/demos/01-components-jsx-props/starter
npm install
npm run dev          # http://localhost:5173
```

Node **22.22+** required (`node -v`). React Router v8, which arrives in Demo 9,
raised the floor — every starter in this track pins the same dependencies so
you never re-install.

**There is no backend yet.** Demos 1–3 are about the component model and local
state; a network layer would be noise. The products come from
`src/data/sampleProducts.ts`, which is shaped **exactly** like what
[DummyJSON](https://dummyjson.com/products/1) returns — so when the API arrives
in Demo 5, the swap is one line.

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

**The finished version of this demo is the next demo's starter.** If you fall
behind, open `../02-lists-keys-and-state/starter` and diff.

---

## Orientation — what is in the box (5 min)

```
starter/
├── index.html             ← one empty <div id="root">. That is all the browser gets.
├── vite.config.ts         ← one plugin. That is the whole build config.
├── tsconfig.app.json      ← strict: true, from day one
├── eslint.config.js       ← the rules that catch real React bugs
└── src/
    ├── main.tsx           ← attaches React to that div; imports Bootstrap's CSS
    ├── index.css          ← empty on purpose. Bootstrap does the styling.
    ├── types.ts           ← the Product type — the shape every card renders
    ├── lib/format.ts      ← formatPrice(), discountedPrice()
    ├── data/sampleProducts.ts
    └── components/        ← what YOU build today
```

Three things to notice before we start:

**`index.html` is nearly empty.** One `<div id="root">`. Everything else on the
page is created by JavaScript at runtime. That is what "single-page app"
means.

**`main.tsx` imports a CSS file from `node_modules`.** `bootstrap/dist/css/bootstrap.min.css`
is the entire Bootstrap stylesheet. React Bootstrap gives us *components*
(`<Button>`, `<Card>`); the `bootstrap` package gives us the *styles* those
components expect. You need both, and the CSS import must come first.

**`src/types.ts` is one interface.** Open it: `Product`, shaped exactly like
what DummyJSON returns. Every component you write today takes a `Product` or
a piece of one — and when the live API arrives in Demo 5, nothing about them
changes, because the type already matched.

**`tsconfig.app.json` says `strict: true`.** Turning strictness on later means
fixing hundreds of errors at once; leaving it on from the start means fixing
them one at a time, as you write them. `npm run typecheck` runs the compiler;
Vite alone does **not** type-check while serving.

**`<StrictMode>` wraps the app.** It double-invokes components in development to
catch side effects. If you `console.log` inside a component and see it twice,
that is why. Leave it on — Demo 5 shows what it catches.

---

## Lab 1 — Your first component (20 min)

### Problem

Open the app. A dark header with the word "ShopScope" and one nav link, then a
heading. There is no search, no cart, and the nav has one link when the data
file has three. Before we can put products on a page we need a page to put
them on — and you need to know what a component *is*, because everything else
in this track is built out of them.

### Concept

**A component is a function that returns markup.** That is the whole idea.

```tsx
function Greeting() {
  return <p>Hello</p>;
}
```

Call it like an HTML tag — `<Greeting />` — and React runs the function and
puts what it returns on the page. **The capital letter is mandatory.**
`<greeting />` means "an HTML element called greeting"; `<Greeting />` means
"the component in scope called Greeting". Get it wrong and React renders
nothing and says nothing useful.

**JSX is not HTML.** It looks like HTML and compiles to JavaScript function
calls. Four differences bite everyone on day one:

| JSX | HTML | Why |
|---|---|---|
| `className` | `class` | `class` is a reserved word in JavaScript |
| `htmlFor` | `for` | same reason |
| `<img />` | `<img>` | every tag must close |
| `{expression}` | — | curly braces drop back into JavaScript |

That last one matters most. **Curly braces take an expression, not a
statement.** `product.title`, `2 + 2`, `items.map(...)`, `a ? b : c` — yes.
`if`, `for`, `const` — no. That constraint is why React code looks the way it
does.

**Props are how a component receives data.** They arrive as one object,
conventionally destructured in the parameter list — and in TypeScript,
**typed** in the parameter list too:

```tsx
function Greeting({ name }: { name: string }) {
  return <p>Hello {name}</p>;
}

<Greeting name="Priya" />
```

`{ name: string }` is the props type: this component takes a `name`, and it's
a string. Pass a number, forget it, or misspell it and the editor tells you
before the browser does. For anything beyond one prop you'll name the type
with an `interface` — Lab 2.

Props flow **one way**: parent to child, always. A child cannot reach up and
change its parent's data. That restriction is what makes a React app
traceable — when something on screen is wrong, the value came from somewhere
above, and you can walk up the tree until you find it.

### Steps

All three steps are in **`src/components/SiteHeader.tsx`**. Open it and keep it
open.

1. **`TODO(lab-1.1)` — give the component a prop.** Replace
   `export function SiteHeader() {` with:

   ```tsx
   interface SiteHeaderProps {
     cartCount?: number;
   }

   export function SiteHeader({ cartCount = 0 }: SiteHeaderProps) {
   ```

   Two different mechanisms doing two different jobs: the `?` in the interface
   is **TypeScript's** — "this prop may be omitted"; `= 0` is **JavaScript's** —
   "and when it is, use this". You almost always use them together. Then in
   **`src/App.tsx`**, pass a value: `<SiteHeader cartCount={3} />`. Try
   `cartCount="3"` (a string) — the compiler refuses. Nothing visible changes
   yet; that's expected.

2. **`TODO(lab-1.2)` — render the nav links from data.** Delete the
   hand-written `<Nav.Link>` and the comment above it, and put the `.map()` in
   its place:

   ```tsx
   <Nav className="me-auto">
     {NAV_LINKS.map((link) => (
       <Nav.Link key={link.label} href={link.href}>
         {link.label}
       </Nav.Link>
     ))}
   </Nav>
   ```

   `.map()` returns an array of elements, and React renders arrays. The `key`
   is required on every item in a rendered array — Demo 2 spends a whole lab
   on why. For now: it's a stable, unique identifier for each item.

3. **`TODO(lab-1.3)` — the search box and cart badge.** Add two imports at
   the top:

   ```tsx
   import { Badge, Button, Container, Form, Nav, Navbar } from 'react-bootstrap';
   import { Cart3, Shop } from 'react-bootstrap-icons';
   ```

   Then replace the `TODO(lab-1.3)` comment with:

   ```tsx
   <Form className="d-none d-sm-flex me-2" role="search" onSubmit={(e) => e.preventDefault()}>
     <Form.Control type="search" size="sm" placeholder="Search products" aria-label="Search products" />
   </Form>

   <Button
     variant="outline-light"
     size="sm"
     className="position-relative"
     aria-label={`Cart, ${cartCount} items`}
   >
     <Cart3 />
     {cartCount > 0 && (
       <Badge pill bg="primary" className="position-absolute top-0 start-100 translate-middle">
         {cartCount}
       </Badge>
     )}
   </Button>
   ```

   Three things in there are load-bearing:

   - **`d-none d-sm-flex`** is Bootstrap's mobile-first responsive syntax:
     hidden by default, `display: flex` from the `sm` breakpoint up.
   - **`position-relative` on the button, `position-absolute` on the badge.**
     The badge positions itself against the nearest positioned ancestor. Take
     `position-relative` off the button and the badge flies to the corner of
     the page.
   - **`aria-label`** carries the real information. A screen reader user hears
     "Cart, 3 items" — the badge is visual only.

### Verify

`npm run typecheck` is clean. A sticky dark header with three nav links, a
search box, and a cart button carrying a pill badge reading **3**. Scroll — the header stays pinned. Narrow
the window under 576px: the search box disappears (correct — `d-none d-sm-flex`).
Under 768px the nav collapses into a hamburger — `Navbar.Toggle` and
`Navbar.Collapse` did that for free.

Now change `cartCount={3}` to `cartCount={0}` in `App.tsx`. The badge
vanishes. Change it back.

### Watch out

**`cartCount &&` instead of `cartCount > 0 &&`.** When `cartCount` is `0`,
`0 && <Badge/>` evaluates to `0` — and React renders the number zero. You get a
literal "0" next to your cart icon. `&&` returns the *left* value when it is
falsy, and React renders `0` but skips `false`, `null` and `undefined`.
**Always compare explicitly.** This is the single most common React rendering
bug and you will hit it again.

**`class=` instead of `className=`.** React warns in the console. Read your
console warnings — React's are unusually good.

**`Badge is not defined`.** Looks like a React error; is a missing import.
Every React Bootstrap component you use has to be in the import list.

### Challenge (2 min)

Add a "Sale" nav link that renders in a different colour. Do it *without*
touching the JSX in step 2 — only the `NAV_LINKS` array. If you can't, the
component isn't data-driven enough. (Hint: add a field to the objects and use
it in `className`.)

### In the real world

That `cartCount = 0` prop is a design decision you will make hundreds of
times: does the header *fetch* the cart count, or is it *given* one? Given, in
almost every case. A component that fetches its own data cannot be reused,
cannot be rendered twice on one page, and cannot be tested without a network
mock. This is the "presentational component" rule, and Demo 5 is where it
earns its keep.

---

## Lab 2 — Props and composition (25 min)

### Problem

Every product card needs to show a price. Sometimes there's a discount, so it
needs a struck-through original and a "10% off" flash. Sometimes it's bigger
(a detail page), sometimes smaller (a cart line).

The tempting move is one component with a prop for every case:
`<Price value big showDiscount showCurrency bold />`. Six months later it has
fourteen boolean props, four of which contradict each other.

### Concept

**Composition over configuration.**

When a component needs to be flexible, there are two ways to give it
flexibility, and they age very differently.

**Configuration** — a prop per possibility:

```tsx
<PageHeader title="Products" actionLabel="Export" onAction={…} showCount count={24} />
```

Every new requirement is a new prop. The component grows forever, and it has
to *anticipate* everything a caller might want.

**Composition** — a slot the caller fills:

```tsx
<PageHeader title="Products" actions={<Button onClick={exportCsv}>Export</Button>} />
```

`actions` accepts "any renderable thing". A button. Three buttons. A dropdown.
A live count. The component never changes again, because it never needed to
know.

**`children` is the same idea with special syntax.** Anything between a
component's tags arrives as the `children` prop:

```tsx
<Card>
  <p>Anything at all</p>     {/* this is `children` */}
</Card>
```

**Derived values are not props.** If you can compute it from what you already
have, compute it. The sale price is `price × (1 − discount/100)` — passing it
as a separate `salePrice` prop means two sources of truth that can drift apart.

### Steps

**A. `src/components/PageHeader.tsx` — `TODO(lab-2.1)`**

Replace the whole component:

```tsx
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  /** A SLOT: any renderable thing. ReactNode is the type for "anything JSX can render". */
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-4">
      <div>
        <h1 className="h3 mb-1">{title}</h1>
        {description && <p className="text-muted mb-0">{description}</p>}
      </div>
      {actions && <div className="d-flex align-items-center gap-2">{actions}</div>}
    </div>
  );
}
```

**B. `src/components/PriceTag.tsx` — `TODO(lab-2.2)`**

```tsx
import { discountedPrice, formatPrice } from '../lib/format';

type PriceSize = 'sm' | 'md' | 'lg';

// Record<K, V>: an object with EXACTLY these keys. Add a size to the union and the compiler asks for its class.
const SIZES: Record<PriceSize, string> = { sm: 'fs-6', md: 'fs-5', lg: 'fs-3' };

interface PriceTagProps {
  price: number;
  discountPercentage?: number;
  size?: PriceSize;
}

export function PriceTag({ price, discountPercentage = 0, size = 'md' }: PriceTagProps) {
  // DERIVED, not a prop. Two sources of truth would drift apart.
  const hasDiscount = discountPercentage >= 1;
  const finalPrice = hasDiscount ? discountedPrice(price, discountPercentage) : price;

  return (
    <div className="d-flex flex-wrap align-items-baseline gap-2">
      <span className={`fw-semibold ${SIZES[size]}`}>{formatPrice(finalPrice)}</span>

      {hasDiscount && (
        <>
          <s className="text-muted small">{formatPrice(price)}</s>
          <span className="text-success small fw-medium">{Math.round(discountPercentage)}% off</span>
        </>
      )}
    </div>
  );
}
```

Two things worth naming:

- **`<>…</>` is a Fragment.** A component must return *one* node. When you
  need two siblings without a pointless `<div>`, wrap them in a Fragment — it
  renders nothing itself.
- **`<s>`, not a `text-decoration-line-through` class.** They look identical.
  `<s>` tells a screen reader the old price no longer applies. Semantics are
  not decoration.

**C. `src/components/StockBadge.tsx` — `TODO(lab-2.3)`**

```tsx
import { Badge } from 'react-bootstrap';

interface StockBadgeProps {
  stock: number;
  lowStockThreshold?: number;
}

export function StockBadge({ stock, lowStockThreshold = 5 }: StockBadgeProps) {
  if (stock === 0) return <Badge bg="danger">Out of stock</Badge>;
  if (stock <= lowStockThreshold) {
    return (
      <Badge bg="warning" text="dark">
        Only {stock} left
      </Badge>
    );
  }
  return (
    <Badge bg="success-subtle" text="success-emphasis">
      In stock
    </Badge>
  );
}
```

Three branches as three early returns. Nested ternaries would fit on one line
and be much worse to read.

### Verify

Nothing changes on screen yet — these aren't used until Lab 3. Check they
compile: the terminal shows no errors. Then temporarily drop this into
`App.tsx` under the heading:

```tsx
<PriceTag price={9.99} discountPercentage={10.48} size="lg" />
<StockBadge stock={0} />
```

You should see **$8.94** with a struck-through **$9.99** and **10% off**, and a
red **Out of stock** badge. Remove both lines.

### Watch out

**`discountPercentage >= 1` not `> 0`.** DummyJSON has products with a 0.3%
discount. Showing "0% off" is worse than showing nothing.

**Forgetting the `import { Badge }`** in `StockBadge.tsx` — it's already there,
but check when you write your own.

### Challenge (2 min)

`PriceTag` shows the saving as a percentage. Make it show the dollar amount
instead when the saving is over $50 — "Save $60" reads better than "12% off"
on expensive items. Keep it derived; add no props.

### In the real world

The `actions` slot is how every serious component library works — MUI's
`action`, Ant's `extra`, Bootstrap's own `children`. When you review a PR that
adds a fifth boolean prop to a shared component, this is the conversation to
have: *should this be a slot?* Usually, yes.

---

## Lab 3 — Composing a card (20 min)

### Problem

You have four components that each do one thing. Now they need to become a
product card — and three of those cards need to appear on the page.

### Concept

**Components compose.** A `ProductCard` doesn't re-implement a price display;
it *uses* `PriceTag`. It doesn't know how stock badges work; it renders
`<StockBadge stock={…} />` and moves on. Each component is a boundary: the
card knows *that* a price is shown, not *how*.

**Props can be computed before the `return`.** A component is a function.
`const isOutOfStock = product.stock === 0;` above the JSX is normal JavaScript,
and it keeps the markup readable.

### Steps

**A. `src/components/ProductCard.tsx` — `TODO(lab-3.1)`**

Replace the file:

```tsx
import { Button, Card } from 'react-bootstrap';
import type { Product } from '../types';
import { PriceTag } from './PriceTag';
import { StockBadge } from './StockBadge';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const isOutOfStock = product.stock === 0;

  return (
    <Card className={`h-100 ${isOutOfStock ? 'opacity-75' : ''}`}>
      <Card.Img
        variant="top"
        src={product.thumbnail}
        alt=""
        loading="lazy"
        className="object-fit-contain bg-body-secondary p-2"
        style={{ height: 160 }}
      />
      <Card.Body className="d-flex flex-column gap-2">
        <div className="text-muted small text-uppercase">{product.brand ?? product.category}</div>
        <Card.Title className="fs-6 mb-0">{product.title}</Card.Title>
        <span className="small text-muted">★ {product.rating.toFixed(1)}</span>

        <PriceTag price={product.price} discountPercentage={product.discountPercentage} />

        <div className="mt-auto d-flex justify-content-between align-items-center pt-2">
          <StockBadge stock={product.stock} />
          <Button size="sm" disabled={isOutOfStock} variant={isOutOfStock ? 'secondary' : 'primary'}>
            {isOutOfStock ? 'Sold out' : 'Add to cart'}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}
```

`product.brand ?? product.category` — nine of our products have no `brand`.
`??` (nullish coalescing) falls back only for `null`/`undefined`, unlike `||`
which would also swallow an empty string or `0`.

**`h-100` + `d-flex flex-column` + `mt-auto`** is the trick that lines the
buttons up across a row of cards with different title lengths. Remember it.

**B. `src/App.tsx` — `TODO(lab-3.2)`**

Replace the file:

```tsx
import { Button, Col, Container, Row } from 'react-bootstrap';
import { SiteHeader } from './components/SiteHeader';
import { PageHeader } from './components/PageHeader';
import { ProductCard } from './components/ProductCard';
import { sampleProducts } from './data/sampleProducts';

export default function App() {
  return (
    <>
      <SiteHeader cartCount={3} />

      <Container className="py-4">
        <PageHeader
          title="Featured products"
          description="Three hand-picked items. The full catalogue arrives in Demo 2."
          actions={
            <Button variant="outline-secondary" size="sm">
              Export
            </Button>
          }
        />

        <Row xs={1} sm={2} md={3} className="g-3">
          <Col>
            <ProductCard product={sampleProducts[0]} />
          </Col>
          <Col>
            <ProductCard product={sampleProducts[1]} />
          </Col>
          <Col>
            <ProductCard product={sampleProducts[2]} />
          </Col>
        </Row>
      </Container>
    </>
  );
}
```

Yes, three near-identical `<Col>` blocks. **That repetition is deliberate** —
sit with how it feels, because Demo 2 opens by fixing it.

### Verify

Three cards in a row (one column on a phone). Card 2 is faded, says **Out of
stock**, and its button reads **Sold out** and is disabled. Card 3 says
**Only 3 left** in amber. Every card shows a struck-through price and a
green **% off**. The Export button sits on the right of the page title — that
is your `actions` slot, and `PageHeader` didn't change to accommodate it.

### Watch out

**`Objects are not valid as a React child`.** You wrote `{product}` where you
meant `{product.title}`. React can render strings, numbers and elements — not
plain objects. (TypeScript catches this one too: `Product` isn't a valid
`ReactNode`.)

**Nothing renders and no error.** Check the capital letter: `<productCard />`
is an HTML tag React has never heard of.

### Challenge (2 min)

Change `Row xs={1} sm={2} md={3}` to `xs={1} md={2} xl={3}` and resize the
window. Read the [Bootstrap grid docs](https://getbootstrap.com/docs/5.3/layout/grid/)
for two minutes — you'll use `Row`/`Col` in every demo from here.

### In the real world

Look at what `ProductCard` receives: one `product` object. Not `title`,
`price`, `thumbnail`, `stock` as six separate props. When a component
represents a domain *thing*, pass the thing. Callers stay short, and when the
backend adds a field, only the card changes.

---

## Lab 4 — Reading the tree in DevTools (10 min)

### Problem

You've written five components and you're trusting the screen to tell you
what's going on. That works today. It stops working the moment a value on
screen is wrong and you don't know which of nine components produced it.

### Concept

**React DevTools shows you the component tree, live.** Every component, its
props, and (from Demo 2) its state. It is the debugger for the layer above the
DOM, and most React bugs are visible there in under a minute.

### Steps

Open your browser's developer tools. A **⚛ Components** tab appeared.

1. **Find `App`.** Click it. The right panel shows `props: {}` — it takes none.
2. **Expand it.** `SiteHeader`, `PageHeader`, three `ProductCard`s. That is
   your tree, exactly as you wrote it.
3. **Click `SiteHeader`.** `props: cartCount: 3`. **Double-click the `3` and
   type `12`.** The badge on screen updates. You didn't touch the code.
4. **Click a `ProductCard`.** Expand `props → product`. Every field of the
   product is there. Change `stock` to `0` and watch the card fade and the
   button disable.
5. **Click the ⚙ settings icon → Components → tick "Highlight updates when
   components render."** Now edit a prop again and watch which components
   flash. Only the one you changed, and its children. Remember this setting —
   Demo 2 uses it to show you something surprising.

### Verify

You can change a prop in DevTools and see the page react. You can find any
component on screen by clicking the element-picker icon (top-left of the
Components tab) and then clicking the element on the page.

### In the real world

"Why is this showing the wrong price?" → open DevTools → click the card → read
its props. The value is wrong *before* it reaches the card (data problem) or
right *in* the card (rendering problem). That fork is the first question in
every React bug, and DevTools answers it in ten seconds.

---

## Wrap-up — what you can now do

- [x] Write a component and know why the capital letter matters
- [x] Explain the four ways JSX differs from HTML
- [x] Type props with an interface, make them optional with `?`, default them with `=`
- [x] Pass a whole domain object (`Product`) rather than six loose props
- [x] Choose composition (`children`, slots) over a pile of boolean props
- [x] Compute derived values in the component body instead of adding props
- [x] Compose small components into a bigger one
- [x] Read props and find components in React DevTools

**One question to bring to Demo 2:** `App.tsx` has three copy-pasted `<Col>`
blocks for three products. There are 194 products in the real catalogue. Now
what?

## Next demo

**Demo 2 — Lists, Keys & State.** A 24-product grid from `.map()`, a
wishlist heart on every card that remembers being clicked, and a bug you will
write deliberately so you recognise it for the rest of your career.

---

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| Blank white page | Check the browser console. A component that throws renders nothing. |
| `Objects are not valid as a React child` | You put an object in `{}`. You meant `{product.title}`, not `{product}`. |
| A stray `0` on the page | `{count && <X/>}` with `count === 0`. Use `{count > 0 && <X/>}`. |
| `Cannot find name 'X'` | A missing import — usually a React Bootstrap component or an icon. TypeScript says so before the browser does. |
| `Property 'foo' does not exist on type 'Product'` | A typo, or a field the API doesn't have. Check `src/types.ts`. |
| Everything is unstyled | Is `import 'bootstrap/dist/css/bootstrap.min.css'` still in `main.tsx`? |
| Console logs appear twice | `<StrictMode>` in development. Working as intended — Demo 5 explains. |
| StackBlitz feels stuck | Hard-refresh the tab. Failing that, re-open the fork link (and lose your work — so bookmark first). |
