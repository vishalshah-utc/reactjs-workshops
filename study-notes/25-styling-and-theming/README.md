# Module 25 — Styling & Theming in React

**Study notes** · ~3 hours

> **Goal.** React has no opinion about CSS, which is why every team has five.
> By the end you should be able to look at any `className` or `style` in a
> codebase and say which technique produced it, what it can reach and what it
> cost — and write a one-page styling policy for a team instead of re-arguing
> it in every pull request.

**Prerequisites:** [Module 4 §8](../04-components-and-jsx/#8-inline-styles)
(inline styles, conditional class names), [Module 6 §17](../06-conditional-rendering-and-lists/#17-conditional-attributes-and-classes),
[Module 9 §15](../09-reducers-and-context/#15-a-custom-hook-as-the-public-api)
(a context behind a custom hook), [Module 12 §14](../12-effects/#14-usesyncexternalstore).

---

## Contents

1. [How styles reach the browser in a Vite app](#1-how-styles-reach-the-browser-in-a-vite-app)
2. [Styling is a scoping decision](#2-styling-is-a-scoping-decision)
3. [Five ways to style one component](#3-five-ways-to-style-one-component)
4. [Who wins: specificity, order and layers](#4-who-wins-specificity-order-and-layers)
5. [Conditional classes with `clsx`](#5-conditional-classes-with-clsx)
6. [Variants with `class-variance-authority`](#6-variants-with-class-variance-authority)
7. [Component libraries: styled vs headless](#7-component-libraries-styled-vs-headless)
8. [Design tokens as CSS custom properties](#8-design-tokens-as-css-custom-properties)
9. [Bootstrap 5.3 colour modes](#9-bootstrap-53-colour-modes)
10. [A persisted theme with no flash](#10-a-persisted-theme-with-no-flash)
11. [Responsive layout](#11-responsive-layout)
12. [Styling and accessibility](#12-styling-and-accessibility)
13. [Styling in tests](#13-styling-in-tests)
14. [A decision table for a team](#14-a-decision-table-for-a-team)
15. [Common errors and what they mean](#15-common-errors-and-what-they-mean)
16. [Self-check](#16-self-check)
17. [References](#17-references)

**Hands-on.** [Demo 16 — Styling & Theming in React](../../demos/16-styling-and-theming/)
builds all of this on ShopScope: the same `PriceTag` styled five ways on the
About page, `StockBadge` on `clsx` then a `cva` map, a three-way theme
persisted under `shopscope.theme` with no flash on reload, a grid tuned per
breakpoint with one container query, and `ConfirmDialog` rebuilt on the
native `<dialog>` beside React Bootstrap's `Modal`. Versions are the demo
starter's: React 19.3, Vite 8.3, Bootstrap 5.3.8, React Bootstrap 2.10.10,
`clsx` 2.1, `class-variance-authority` 0.7, Tailwind 4.3 + `@tailwindcss/vite` 4.3.

---

## 1. How styles reach the browser in a Vite app

React knows nothing about CSS. It sets `className` and `style` on DOM nodes
and stops. How a `.css` file becomes a rule the browser applies is the
bundler's job — Vite, in this track
([Module 2 §11](../02-react-introduction/#11-option-2--vite-the-modern-standard-for-client-side-apps)).

### A CSS import is a side effect

```tsx
// src/main.tsx
import 'bootstrap/dist/css/bootstrap.min.css';   // nothing is imported INTO this module
import './index.css';                             // order matters: later file, later in the cascade
```

Nothing is bound to a name. Vite sees the import, puts the file on the page,
and the component tree never references it again. That is what "global"
means: the stylesheet is on the page for the life of the page, whether or not
any component that uses it ever renders.

### Dev vs build

| | `vite` (dev) | `vite build` |
|---|---|---|
| How CSS arrives | injected as a `<style>` tag by the importing JS module | extracted to `assets/index-[hash].css`, linked from `<head>` |
| Order | import order in the module graph | the same order, concatenated |
| Edit a `.css` file | the one `<style>` tag is swapped — no reload, no React state lost | — |
| CSS imported by a lazy route | injected when the chunk loads | its own `AboutPage-[hash].css`, linked when the chunk loads |

Two consequences. **CSS hot-module replacement is cheaper than JS HMR** —
Vite swaps the stylesheet in place, so a half-filled form survives a style
edit. And **CSS follows the chunk**: a stylesheet imported from a lazily
loaded route ships with that route, not with the app. Where you put the
`import` line decides who downloads the CSS.

### What the suffix means

```tsx
import './pricetag.css';                        // side effect: global stylesheet
import styles from './PriceTag.module.css';     // CSS Module: an object of hashed class names
import css from './print.css?inline';           // the file's text as a string, nothing injected
```

The `.module.css` suffix is the only configuration CSS Modules need. Sass and
PostCSS plug in by installing them; Tailwind 4 plugs in as a Vite plugin
([§3.4](#34-way-4--utility-classes)). A Bootstrap-only app has no CSS entry in
`vite.config.ts` at all.

### TypeScript and CSS imports

`import './x.css'` is an error in a strict project until something declares
that module shape. `"types": ["vite/client"]` in `tsconfig.app.json` does it,
and types a `.module.css` import as `{ readonly [key: string]: string }`.
Note what that does **not** promise: any key is legal, so `styles.pirce`
compiles and renders `class="undefined"`. The type protects the shape, not
the names.

### React 19 and stylesheets

React 19 gave `<link rel="stylesheet" precedence="…">` first-class
treatment: hoisted into `<head>`, deduplicated, and awaited before a Suspense
boundary reveals the content that needs it. In a Vite SPA you rarely write it
— the bundler handles the stylesheet — but it is how Server Components
([Module 19](../19-server-components/)) ship component-level CSS without a
client runtime.

📖 [Vite — CSS](https://vite.dev/guide/features#css)
📖 [react.dev — `<link>` and stylesheet precedence](https://react.dev/reference/react-dom/components/link)

---

## 2. Styling is a scoping decision

A class name is a string, and the browser matches it against **every
stylesheet on the page**. That sentence is the whole problem of CSS at scale,
and every technique in this module is a different answer to one question:
*who else can this rule touch?*

| Technique | Who the rule can touch |
|---|---|
| Global CSS | every element on the page, for ever |
| CSS Modules | elements in the one file that imports the module |
| Inline `style` | this element |
| Utility classes (Bootstrap, Tailwind) | whoever types the class |
| Runtime CSS-in-JS | this component — computed at render time |

Choose by how far a rule should reach and most other decisions follow. A team
arguing "Tailwind vs CSS Modules" is usually arguing about something else —
a shared vocabulary of small classes, or a file per component. Both scope
correctly.

---

## 3. Five ways to style one component

The component is ShopScope's `PriceTag`: a final price, an optional
struck-through list price and a discount. The five versions take **exactly
the same props**, or the comparison means nothing. Each one derives
`hasDiscount` and `finalPrice` the same way; the bodies below omit that.

```tsx
// src/components/PriceTag.tsx
export type PriceSize = 'sm' | 'md' | 'lg';
export interface PriceTagProps { price: number; discountPercentage?: number; size?: PriceSize; }
```

### 3.1 Way 1 — plain, global CSS

```css
/* src/components/styling/pricetag.css — from the moment this is imported, `.price` means THIS everywhere */
.price { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.5rem; }
.price__final { font-weight: 600; font-size: 1.25rem; }
.price--sm .price__final { font-size: 1rem; }
.price--lg .price__final { font-size: calc(1.3rem + 0.6vw); }
.price__was { color: var(--bs-secondary-color); font-size: 0.875em; }
.price__off { color: var(--bs-success); font-size: 0.875em; font-weight: 500; }
.price:hover .price__final { color: var(--bs-primary); }
```

```tsx
import './pricetag.css';

export function PriceTagPlain({ price, discountPercentage = 0, size = 'md' }: PriceTagProps) {
  // …hasDiscount, finalPrice…
  return (
    <div className={`price price--${size}`}>
      <span className="price__final">{formatPrice(finalPrice)}</span>
      {hasDiscount && (
        <>
          <s className="price__was">{formatPrice(price)}</s>
          <span className="price__off">{Math.round(discountPercentage)}% off</span>
        </>
      )}
    </div>
  );
}
```

Nothing connects `className="price"` to `.price` but discipline. BEM naming
(`block__element--modifier`) is that discipline made visible: it keeps names
unique by convention because nothing enforces it. The costs arrive later — a
second `.price` in another file, and rules nobody dares delete because nobody
knows who still matches them.

Note the colours: `var(--bs-secondary-color)`, not `#6c757d`. Bootstrap's
custom properties *are* the theme ([§9](#9-bootstrap-53-colour-modes)); a
stylesheet that reads them follows the theme for free.

### 3.2 Way 2 — CSS Modules

Same CSS, shorter names, a different suffix:

```css
/* src/components/styling/PriceTag.module.css */
.price { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.5rem; }
.final { font-weight: 600; font-size: 1.25rem; }
.sm .final { font-size: 1rem; }
.lg .final { font-size: calc(1.3rem + 0.6vw); }
.was { color: var(--bs-secondary-color); font-size: 0.875em; }
.off { color: var(--bs-success); font-size: 0.875em; font-weight: 500; }
.price:hover .final { color: var(--bs-primary); }
```

```tsx
import styles from './PriceTag.module.css';
// styles === { price: '_price_7gmat_2', final: '_final_7gmat_13', sm: '…', … }

export function PriceTagModule({ price, discountPercentage = 0, size = 'md' }: PriceTagProps) {
  const rootClass = [styles.price, size === 'sm' && styles.sm, size === 'lg' && styles.lg]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={rootClass}>
      <span className={styles.final}>{formatPrice(finalPrice)}</span>
      {hasDiscount && (
        <>
          <s className={styles.was}>{formatPrice(price)}</s>
          <span className={styles.off}>{Math.round(discountPercentage)}% off</span>
        </>
      )}
    </div>
  );
}
```

The stylesheet is still global — one more `<style>` tag — but the **names**
are not. Vite rewrites every class in the file to a hashed name and hands you
the mapping as an object. Two files can both declare `.price` and never
collide, and everything CSS can do (`:hover`, `@media`, `::backdrop`,
`@keyframes`) still works, because it is still CSS.

What you give up: readable names in DevTools, and the compiler's help with
typos. Delete a class from the CSS and the component keeps rendering, with
`class="undefined"` where it used to be.

### 3.3 Way 3 — inline `style` objects

[Module 4 §8](../04-components-and-jsx/#8-inline-styles) introduced the object
form. In TypeScript it has a type:

```tsx
import { useState, type CSSProperties } from 'react';

const ROW: CSSProperties = { display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 8 };   // 8 → "8px"
const FONT_SIZE: Record<PriceSize, CSSProperties['fontSize']> = { sm: '1rem', md: '1.25rem', lg: '1.75rem' };

export function PriceTagInline({ price, discountPercentage = 0, size = 'md' }: PriceTagProps) {
  const [hover, setHover] = useState(false);          // the price of :hover without CSS
  return (
    <div style={ROW} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <span style={{ fontWeight: 600, fontSize: FONT_SIZE[size], color: hover ? 'var(--bs-primary)' : undefined }}>
        {formatPrice(finalPrice)}
      </span>
      {hasDiscount && <s style={{ color: 'var(--bs-secondary-color)', fontSize: '0.875em' }}>{formatPrice(price)}</s>}
      {/* …the "% off" span the same way… */}
    </div>
  );
}
```

Three facts about `CSSProperties`:

- Keys are camelCase and **typed**: `fontWieght` is a compile error, unlike a
  misspelt class name.
- A bare number means **pixels** for length properties; any other unit is a
  string. Unitless properties (`lineHeight`, `flex`, `zIndex`, `opacity`)
  stay numbers.
- It knows every standard property and **no custom one**:
  `style={{ '--price-accent': 'tomato' } as CSSProperties}` needs the cast.

And the two things inline style can **never** express: pseudo-classes and
pseudo-elements (`:hover`, `:focus-visible`, `::backdrop`) and at-rules
(`@media`, `@container`, `@keyframes`). The `hover` state above is the
workaround — it re-renders on every mouse-in and mouse-out and does nothing
for keyboard focus. The other four ways get `:hover` in one line.

`ROW` is hoisted to module scope so it is one object for the life of the app.
The inner objects cannot be — they depend on props and state — and that is
the "new object every render" cost that matters for `memo`
([Module 15](../15-performance/)). **Inline style is for values that come
from data**: an image height by density, a progress bar's width, a tooltip's
position, a colour from a product. Not for layout.

### 3.4 Way 4 — utility classes

A utility class is one declaration with a name: `d-flex` is `display: flex`,
`tw:gap-2` is `gap: 0.5rem`. You compose a look by listing them and the
component never gets a stylesheet of its own.

**Bootstrap utilities**, already loaded — what `PriceTag` has been since Demo 1:

```tsx
const SIZES: Record<PriceSize, string> = { sm: 'fs-6', md: 'fs-5', lg: 'fs-3' };

<div className="d-flex flex-wrap align-items-baseline gap-2">
  <span className={`fw-semibold ${SIZES[size]}`}>{formatPrice(finalPrice)}</span>
  {hasDiscount && (
    <>
      <s className="text-muted small">{formatPrice(price)}</s>
      <span className="text-success small fw-medium">{Math.round(discountPercentage)}% off</span>
    </>
  )}
</div>
```

You get what Bootstrap has — responsive infixes (`flex-md-row`), no `hover:`,
a fixed vocabulary — for 230 KB of CSS that is on every page anyway.

**Tailwind 4** generates utilities from the class names it finds in your
source, so the stylesheet contains only what you used. Through
`@tailwindcss/vite` there is no PostCSS config and no `tailwind.config.js`;
configuration is CSS:

```ts
// vite.config.ts
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({ plugins: [react(), tailwindcss()] });
```

```css
/* src/tailwind.css — Tailwind 4 beside Bootstrap: three deliberate decisions */
@layer theme, base, components, utilities;
@import 'tailwindcss/theme.css' layer(theme) prefix(tw);                       /* 1. no preflight */
@import 'tailwindcss/utilities.css' layer(utilities) prefix(tw) source(none);  /* 2. a prefix; 3. no project-wide scan */
@source './components/styling/PriceTag.tailwind.tsx';                           /* the one file that uses it */

/* Tailwind's dark: follows the OS by default; ours follows Bootstrap's attribute, so one control themes both */
@custom-variant dark (&:where([data-bs-theme='dark'], [data-bs-theme='dark'] *));
```

```tsx
import '../../tailwind.css';   // imported HERE, not in main.tsx: it ships with this component's chunk

const TEXT_SIZE: Record<PriceSize, string> = { sm: 'tw:text-base', md: 'tw:text-xl', lg: 'tw:text-3xl' };

<div className="tw:flex tw:flex-wrap tw:items-baseline tw:gap-2">
  <span className={`tw:font-semibold tw:hover:text-blue-600 tw:dark:hover:text-blue-400 ${TEXT_SIZE[size]}`}>
    {formatPrice(finalPrice)}
  </span>
  {hasDiscount && <s className="tw:text-sm tw:text-slate-500 tw:dark:text-slate-400">{formatPrice(price)}</s>}
</div>
```

Why each decision:

- **No preflight.** `@import 'tailwindcss'` also imports Tailwind's reset,
  which zeroes heading margins and unstyles buttons — on top of Bootstrap's
  reboot. Importing `theme.css` and `utilities.css` by hand leaves it out.
- **A prefix.** Both frameworks own `.container`, `.border`, `.rounded`,
  `.collapse`, `.gap-3` (Tailwind `0.75rem`, Bootstrap `1rem`). With
  `prefix(tw)` every Tailwind class is `tw:…` and the vocabularies never
  share a name.
- **A narrow source.** Tailwind scans files as **text** for complete class
  names. `source(none)` switches off the project-wide scan; `@source` names
  the one file. And because it is a text scan, `` `tw:text-${size}` ``
  generates nothing — a lookup table of full names is the only form that works.

The sessions track of this repo runs Tailwind the ordinary way — `@import
"tailwindcss"` as the whole stylesheet, no prefix, shadcn/ui on top. That is
right when Tailwind is the *only* framework. The configuration above is what
coexistence costs.

### 3.5 Way 5 — CSS-in-JS, and why the track does not use the runtime kind

styled-components and Emotion let you write CSS in a template literal next to
the component, with props available inside it:

```tsx
// NOT used in this track — shown so you can read it in an older codebase
const Price = styled.span<{ $size: PriceSize }>`
  font-weight: 600;
  font-size: ${({ $size }) => FONT_SIZE[$size]};
  &:hover { color: var(--bs-primary); }
`;
```

The scoping is perfect and the ergonomics are good. The cost is **when** the
CSS is produced: at render time, in the browser. Every render of every styled
component computes a style string, hashes it and inserts a rule into a
`<style>` tag — a runtime you ship, a cost per component per render, and a
dependency on React's render phase being a place where inserting styles is
possible.

React 19's Server Components ([Module 19](../19-server-components/)) run on
the server and ship no JavaScript, so there is no render-time runtime to
insert a `<style>` tag with. styled-components and Emotion do not work inside
a Server Component, and styled-components has stopped active development.
The ecosystem answer is **zero-runtime** styling — CSS Modules, Tailwind,
vanilla-extract, StyleX, Panda, MUI's Pigment CSS — all of which produce a
static stylesheet at build time and leave only class names in the component.
Every one is way 1, 2 or 4 with better tooling.

So: you will read runtime CSS-in-JS in codebases from 2017–2022, and should
be able to; you will not start a React 19 project with it.

### 3.6 Side by side

| Way | CSS lives in | Scope | `:hover`, `@media` | Typo caught by | Cost |
|---|---|---|---|---|---|
| 1 · Plain CSS | a `.css` file, side-effect import | global | yes | nobody | naming discipline, collisions, dead rules |
| 2 · CSS Modules | a `.module.css` file, imported as an object | the importing file | yes | nobody (`class="undefined"`) | a file per component, opaque DevTools names |
| 3 · Inline `style` | the JSX, as `CSSProperties` | the element | **no** | the compiler | a new object per render; nothing beats its specificity |
| 4 · Utilities | the framework, or generated from source | whoever types the class | Bootstrap: responsive only; Tailwind: as variants | nobody | long `className`s; a second vocabulary if you run two |
| 5 · Runtime CSS-in-JS | the component, computed at render | the component | yes | the compiler, partly | a runtime; no Server Components |

Most teams run **one framework and one escape hatch**: Tailwind + CSS
Modules, Bootstrap + CSS Modules, MUI + `sx`. The smell is a component using
three of the five at once.

**→ In the demos:** Demo 16, Lab 1 — the five `PriceTag.*.tsx` files and the
`StylingShowcase` on the About page, including the `.price { color: red }`
collision test.

---

## 4. Who wins: specificity, order and layers

Every technique eventually produces a rule, and when two rules target one
element the cascade decides. Three rules cover almost every "my CSS is being
ignored" in a React app.

**1. Inline beats everything except `!important`.** A `style` attribute
outranks any selector. So `style={{ maxWidth: 360 }}` and an `@media` rule
setting `max-width` cannot coexist — the inline value wins at every width.
The inline style has to *go*, not be joined by a class.

**2. At equal specificity, later wins.** `index.css` is imported after
`bootstrap.min.css` in `main.tsx`, so its `[data-bs-theme='dark'] {
--bs-body-bg: … }` overrides Bootstrap's rule of the same selector. Reverse
the imports and the override silently stops. Likewise `.product-card {
flex-direction: row }` beats Bootstrap's `.card { flex-direction: column }` —
same specificity, later file.

**3. Unlayered CSS beats layered CSS, regardless of specificity.** Tailwind 4
emits its utilities inside `@layer utilities`; Bootstrap 5.3 is unlayered. So
when the two define the same class, Bootstrap wins — every time, no warning,
even if the Tailwind rule is more specific. That is the real reason for the
`tw:` prefix: not tidiness, but being able to see which framework a class
came from when it does not take effect.

```
inline style  >  unlayered rules (by specificity, then order)  >  @layer rules (by layer order)
```

DevTools → Elements → Styles shows all of this: the winning rule on top, the
losers struck through, each with its source file. Look there before you add
`!important`.

📖 [MDN — Cascade layers](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Cascade_layers)

---

## 5. Conditional classes with `clsx`

[Module 6 §17](../06-conditional-rendering-and-lists/#17-conditional-attributes-and-classes)
ended with "past three or four conditions, `clsx` earns its place". Here is
the whole library:

```ts
import clsx from 'clsx';

clsx('h-100', busy && 'opacity-50', className);        // strings, booleans, undefined → one string, falsy dropped
clsx('badge', { 'rounded-pill': pill, 'text-bg-danger': stock === 0 });   // object form
clsx(['btn', size === 'sm' && 'btn-sm']);              // arrays flatten
```

It is 240 bytes and replaces every `filter(Boolean).join(' ')` and every
`` `${cond ? 'x' : ''}` `` you would otherwise write — including the trailing
space and the literal `false` those produce. React Bootstrap uses it
internally; so does every design system you will meet.

```tsx
<Card className={`h-100 ${isOutOfStock || busy ? 'opacity-50' : ''}`}>      // "card h-100 " — trailing space
<Card className={clsx('h-100', (isOutOfStock || busy) && 'opacity-50')}>    // "card h-100"
```

The `StockBadge` from [Module 6 §2](../06-conditional-rendering-and-lists/#2-early-returns)
had three `return`s. With `clsx` and a lookup object it has one, and the steps
never mix — data → a **name** for the state → classes → element:

```tsx
type StockTone = 'ok' | 'low' | 'out';

const TONE_CLASS: Record<StockTone, string> = {
  ok: 'bg-success-subtle text-success-emphasis',
  low: 'text-bg-warning',
  out: 'text-bg-danger',
};
const LABELS: Record<StockTone, (stock: number) => string> = {
  out: () => 'Out of stock', low: (n) => `Only ${n} left`, ok: () => 'In stock',
};

function toneFor(stock: number, threshold: number): StockTone {
  if (stock === 0) return 'out';
  return stock <= threshold ? 'low' : 'ok';
}

interface StockBadgeProps { stock: number; lowStockThreshold?: number; pill?: boolean; className?: string; }

export function StockBadge({ stock, lowStockThreshold = 5, pill = false, className }: StockBadgeProps) {
  const tone = toneFor(stock, lowStockThreshold);
  return (
    <span className={clsx('badge', TONE_CLASS[tone], pill && 'rounded-pill', className)}>
      {LABELS[tone](stock)}
    </span>
  );
}
```

**What `clsx` does not do:** resolve conflicts. `clsx('gap-3', 'tw:gap-3')`
returns both, and [§4](#4-who-wins-specificity-order-and-layers) told you
which wins. Tailwind-only projects pair it with `tailwind-merge` (shadcn/ui's
`cn()` is exactly `clsx` + `twMerge`); with Bootstrap, keep one class per
property and the question does not arise.

📖 [clsx — README](https://github.com/lukeed/clsx#readme)

---

## 6. Variants with `class-variance-authority`

When the same axes recur — tone, size, shape — `clsx` calls start to repeat.
`cva` turns the list into **data**: a base class, a map of
`variant → value → classes`, and defaults. It returns a function.

```ts
// src/lib/variants.ts
import { cva, type VariantProps } from 'class-variance-authority';

export const badge = cva('badge', {
  variants: {
    tone: {
      ok: 'bg-success-subtle text-success-emphasis',
      low: 'text-bg-warning',
      out: 'text-bg-danger',
      neutral: 'text-bg-secondary',
    },
    size: { sm: 'px-1 py-0', md: '', lg: 'fs-6 px-3 py-2' },
    pill: { true: 'rounded-pill' },                 // a boolean variant
  },
  defaultVariants: { tone: 'neutral', size: 'md' },
});

export type BadgeVariants = VariantProps<typeof badge>;
// { tone?: 'ok' | 'low' | 'out' | 'neutral' | null; size?: 'sm' | 'md' | 'lg' | null; pill?: boolean | null }

badge({ tone: 'low', size: 'lg' });        // 'badge text-bg-warning fs-6 px-3 py-2'
badge({ tone: 'lwo' });                    // ✗ Type '"lwo"' is not assignable…
badge({ pill: true, className: 'ms-2' }); // extra classes merge in
```

The classes are Bootstrap's; `cva` owns the **API**. `VariantProps` derives a
props type from the map, so adding a tone grows every consumer's type and a
misspelt value at a call site is a compile error. One map is the single source
of truth for both the CSS and the contract.

### Choosing which axes a component exposes

```tsx
import { badge, type BadgeVariants } from '../lib/variants';

interface StockBadgeProps extends Pick<BadgeVariants, 'size' | 'pill'> {
  stock: number;
  lowStockThreshold?: number;
  className?: string;
}

export function StockBadge({ stock, lowStockThreshold = 5, size, pill, className }: StockBadgeProps) {
  const tone = toneFor(stock, lowStockThreshold);
  return <span className={badge({ tone, size, pill, className })}>{LABELS[tone](stock)}</span>;
}

<StockBadge stock={product.stock} size="lg" pill />   // ✓
<StockBadge stock={product.stock} tone="out" />       // ✗ Property 'tone' does not exist
```

`tone` is derived from `stock`, so the component does not expose it — a
`tone` prop "for flexibility" would let *Out of stock* render green. Expose
presentation axes (`size`, `pill`); keep meaning derived
([Module 5 §12](../05-props-and-composition/#12-designing-a-component-api)).

### Classes for an element that cannot be the library's component

```ts
export const button = cva('btn', {
  variants: {
    tone: { primary: 'btn-primary', light: 'btn-light', outlineLight: 'btn-outline-light', ghost: 'btn-outline-secondary' },
    size: { sm: 'btn-sm', md: '', lg: 'btn-lg' },
    block: { true: 'w-100' },
  },
  defaultVariants: { tone: 'primary', size: 'md' },
});
```

```tsx
// a router <Link> that should look like a button — React Bootstrap's `as={Link}` does not type-check
<Link to="/login" className={button({ tone: 'light', size: 'sm' })}>Sign in</Link>
```

Before the map, three files hand-typed `"btn btn-light btn-sm"`. The thing to
watch for is `size: { xs: 'btn-xs' }` — it compiles and renders a class with
no CSS behind it. The map is typed; the stylesheet is not.

Open shadcn/ui's `button.tsx` and you will find this exact shape: `cva` with
`variant` and `size`, a `VariantProps` type, `cn()`. Every design-system
component you meet is a variant map.

**→ In the demos:** Demo 16, Lab 2 — `clsx` across `ProductCard` and
`PriceTag`, then `src/lib/variants.ts` with `badge` and `button`.

📖 [cva — Variants](https://cva.style/docs/getting-started/variants)
📖 [cva — TypeScript (`VariantProps`)](https://cva.style/docs/getting-started/typescript)

---

## 7. Component libraries: styled vs headless

A **styled** library ships behaviour and appearance together. A **headless**
one ships behaviour and leaves appearance to you.

| | Styled — React Bootstrap, MUI, Chakra | Headless — Radix Primitives, Base UI, React Aria | shadcn/ui |
|---|---|---|---|
| Behaviour (focus, keyboard, ARIA) | included | included — that is *all* that is included | Radix's |
| Appearance | included; override via props, `sx`, CSS variables | none — bring Tailwind, CSS Modules, anything | Tailwind, **copied into your repo** |
| Install | a dependency | a dependency | a CLI that writes `components/ui/button.tsx` |
| Fit to a design system | fight the defaults | exact | exact, and you own the code |
| Time to first screen | fastest | slowest | fast |
| Upgrades | `npm update` | `npm update` | re-run the CLI, or diff by hand |

### What "headless" buys you

A dialog's hard part is the top layer, the focus trap, Escape, focus
restoration and the backdrop — not the border radius. Headless means the hard
part is done and the visible part is yours. The browser now ships most of a
dialog's hard part as `<dialog>.showModal()`, so a headless dialog is forty
lines of React glue around a native element plus a stylesheet:

```tsx
// src/components/ConfirmDialog.headless.tsx — the SAME props as the React Bootstrap version
import styles from './ConfirmDialog.module.css';

export function ConfirmDialogHeadless({ show, title, body, busy = false, onConfirm, onCancel }: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  // Declarative in, imperative out: `show` is a prop; the DOM's open state is a method call.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (show && !dialog.open) dialog.showModal();     // NOT show(): only showModal() gives the top layer and focus trap
    else if (!show && dialog.open) dialog.close();
  }, [show]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      onCancel={(event) => { if (busy) event.preventDefault(); }}   // Escape
      onClose={() => { if (show) onCancel(); }}                      // fires after ANY close, ours included — hence the guard
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onCancel(); }}   // padding 0: the element itself is the backdrop
    >
      <h2 id={titleId} className="h6">{title}</h2>
      <div>{body}</div>
      {/* …Cancel / confirm buttons, both disabled={busy}… */}
    </dialog>
  );
}
```

```css
/* src/components/ConfirmDialog.module.css — a Module because ::backdrop and [open] have no utility class */
.dialog {
  width: min(500px, calc(100% - 1rem));
  padding: 0;
  border: 1px solid var(--bs-border-color-translucent);
  border-radius: var(--bs-border-radius-lg);
  background: var(--bs-body-bg);         /* Bootstrap's variables: the box follows data-bs-theme like everything else */
  color: var(--bs-body-color);
}
.dialog::backdrop { background: rgba(0, 0, 0, 0.5); }
.dialog[open] { animation: dialog-in 0.15s ease-out; }
@keyframes dialog-in { from { opacity: 0; transform: translateY(-0.5rem); } }
```

Compare what each version lets you change. To tint the headless backdrop you
edit one line of a Module. To tint React Bootstrap's you override
`.modal-backdrop` globally — for every modal in the app, which is the point
of a styled library and also its limit.

### How to pick

```
Is the design yours, or the framework's?
├─ The framework's (an internal tool, a prototype, no designer)
│     → styled: React Bootstrap, MUI. Fastest, consistent, accessible out of the box.
└─ Yours (a design system, a brand, a Figma file)
      → headless + your CSS: Radix / Base UI / React Aria,
        or shadcn/ui if the CSS is Tailwind and you want the source in your repo.
```

This track chose React Bootstrap on day one because the demos were about
React, not CSS. The sessions track chose Tailwind + shadcn/ui because
ShopCrew's design is not Bootstrap's. Both are right; the question is whose
design it is. Note what React Bootstrap's own `ThemeProvider` is for:
class-name prefixes, breakpoints and `dir` — **not** colour modes. Colour
modes are Bootstrap's, through an attribute ([§9](#9-bootstrap-53-colour-modes)).

**→ In the demos:** Demo 16, Lab 5 — `ConfirmDialog.headless.tsx` swapped
into `ProductsPage`, then swapped back on purpose, and `DialogComparison` on
the About page.

📖 [MDN — `<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog)
📖 [React Bootstrap — Introduction](https://react-bootstrap.github.io/docs/getting-started/introduction)

---

## 8. Design tokens as CSS custom properties

A **design token** is a named decision — "the accent is `#b02a5b`" — stored
once and read everywhere. In the browser the storage mechanism is a CSS
custom property, and the reason it is *the* theming mechanism is one
sentence: **changing a custom property recolours every rule that reads it,
with no class changes and no React re-render.**

```css
/* src/index.css */
:root,
[data-bs-theme='light'] { --shopscope-accent: #b02a5b; }
[data-bs-theme='dark']  { --shopscope-accent: #f28ab5; }

.text-accent { color: var(--shopscope-accent); }
```

```tsx
<span className="text-accent small fw-medium">{Math.round(discountPercentage)}% off</span>
```

Flip the attribute on `<html>` and the span changes colour. React did
nothing; the cascade did. Compare the alternative — a `theme` prop threaded
through every component, or `useTheme()` in every leaf to pick a class — and
the appeal is obvious: the theme is read where the colour is *used*, not
where the component is *rendered*.

Three properties that make custom properties fit the job:

- **They inherit.** Set on `<html>`, available everywhere below. Set on one
  `<nav data-bs-theme="dark">`, scoped to that subtree — which is how
  ShopScope's `Navbar` stays dark in both modes.
- **They are live.** `var()` resolves at use time, so a value set from
  JavaScript (`style={{ '--card-accent': product.color }}`) takes effect
  immediately.
- **They work in every technique.** A Module, a plain stylesheet, an inline
  style and a Tailwind utility (`tw:text-(--shopscope-accent)`) can all read
  the same token.

One limit: `var()` is not allowed in a media query condition, which is why
the toolbar's Module in [§11](#11-responsive-layout) repeats `768px`.

📖 [MDN — Using CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)

---

## 9. Bootstrap 5.3 colour modes

Bootstrap 5.3 themes itself exactly this way. Inspect `<html>` in dark mode:

```css
/* from bootstrap.min.css — about seventy variables */
[data-bs-theme=dark] {
  color-scheme: dark;
  --bs-body-color: #dee2e6;
  --bs-body-bg: #212529;
  --bs-secondary-color: rgba(222, 226, 230, 0.75);
  --bs-border-color: #495057;
  /* … */
}
```

Every component reads them — `.card` reads `--bs-card-bg`, which defaults to
`var(--bs-body-bg)` — so one attribute recolours the whole tree. Three ways
to use that:

**Set the attribute.** `document.documentElement.dataset.bsTheme = 'dark'`,
on `<html>` for the page or on any element for a subtree.

**Override a Bootstrap variable** under the same selector, from your own
stylesheet imported after Bootstrap's:

```css
[data-bs-theme='dark'] {
  --shopscope-accent: #f28ab5;
  --bs-body-bg: #12161c;             /* page, cards, modals, offcanvas — everything that reads it goes deeper */
  --bs-body-bg-rgb: 18, 22, 28;      /* the triple Bootstrap uses for translucent variants */
}
```

**Use the theme-aware utilities** rather than fixed colours: `bg-body`,
`text-body-secondary`, `bg-success-subtle`, `text-success-emphasis`.
`text-muted` and `bg-light` are fixed and look wrong in dark mode.

`color-scheme: dark` is in that block for a reason: it makes the browser draw
its own UI — scrollbars, form controls, the date picker — dark too. Set it in
any theme you write yourself.

### Where React fits

React owns the **state**; the attribute is a side effect of it. A context
behind a custom hook ([Module 9 §15](../09-reducers-and-context/#15-a-custom-hook-as-the-public-api)),
with one effect that synchronises the DOM:

```tsx
export type ThemePreference = 'light' | 'dark' | 'system';   // what the user CHOSE
export type Theme = 'light' | 'dark';                          // what is on <html data-bs-theme>

const DARK_QUERY = '(prefers-color-scheme: dark)';

function subscribeToSystemTheme(onChange: () => void) {
  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}
const getSystemPrefersDark = () => window.matchMedia(DARK_QUERY).matches;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const systemPrefersDark = useSyncExternalStore(subscribeToSystemTheme, getSystemPrefersDark);

  // DERIVED during render — not a second piece of state that could disagree with the first
  const theme: Theme = preference === 'system' ? (systemPrefersDark ? 'dark' : 'light') : preference;

  useEffect(() => {
    document.documentElement.dataset.bsTheme = theme;
  }, [theme]);

  const setPreference = useCallback((next: ThemePreference) => setPreferenceState(next), []);
  const value = useMemo(() => ({ preference, theme, setPreference }), [preference, theme, setPreference]);
  return <ThemeContext value={value}>{children}</ThemeContext>;
}
```

Two decisions in there are the ones people get wrong.

**State holds a preference; the theme is derived.** `'system'` is a real
choice — "keep following the OS" — so it must be stored. Storing *both*
`preference` and `theme` is two states for one fact, and they disagree the
first time the OS changes ([Module 8 §9](../08-state-structure/#9-derived-state)).

**The OS setting is an external store.** `matchMedia` gives a `matches`
snapshot and a `change` event — exactly the subscribe-and-read shape
`useSyncExternalStore` exists for ([Module 12 §14](../12-effects/#14-usesyncexternalstore)).
An effect that reads `matchMedia` into state renders once with the wrong
value and trips the lint rule against `setState` in an effect body.

The header's control is a segmented group over the three preferences, with
`aria-pressed` on the chosen one:

```tsx
const THEME_OPTIONS: { value: ThemePreference; label: string; Icon: Icon }[] = [
  { value: 'light', label: 'Light theme', Icon: Sun },
  { value: 'dark', label: 'Dark theme', Icon: MoonStars },
  { value: 'system', label: 'Follow the system theme', Icon: CircleHalf },
];

<ButtonGroup size="sm" aria-label="Theme">
  {THEME_OPTIONS.map(({ value, label, Icon }) => (
    <Button key={value} variant={preference === value ? 'light' : 'outline-light'}
      aria-pressed={preference === value} aria-label={label} onClick={() => setPreference(value)}>
      <Icon />
    </Button>
  ))}
</ButtonGroup>
```

Tailwind's `dark:` variant and Radix Colors theme the same way — custom
properties switched by a class or attribute — which is why one
`@custom-variant dark` line in [§3.4](#34-way-4--utility-classes) made the
Tailwind card follow Bootstrap's attribute. The next design system's
`[data-theme]` is the same idea.

📖 [Bootstrap — Color modes](https://getbootstrap.com/docs/5.3/customize/color-modes/)
📖 [Bootstrap — CSS variables](https://getbootstrap.com/docs/5.3/customize/css-variables/)
📖 [react.dev — `useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore)

---

## 10. A persisted theme with no flash

Persisting the preference is two small changes — and then a bug appears that
lasts one frame.

### Persist

```tsx
export const THEME_STORAGE_KEY = 'shopscope.theme';

function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

function readStoredPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);      // string | null — not yet a ThemePreference
    return isThemePreference(stored) ? stored : 'system';
  } catch {
    return 'system';                                              // storage disabled: a preference is a nicety
  }
}

// in the provider:
const [preference, setPreferenceState] = useState<ThemePreference>(readStoredPreference);   // lazy initialiser: read once

const setPreference = useCallback((next: ThemePreference) => {
  setPreferenceState(next);
  try { localStorage.setItem(THEME_STORAGE_KEY, next); } catch { /* lasts for this tab */ }
}, []);
```

Three things to copy. The **lazy initialiser** reads storage once, on mount,
not on every render. The **type guard** narrows `string | null` to the union
in one place — storage is a boundary like the network, `unknown` in and a
type out ([Module 17](../17-typescript-with-react/)). And the write happens
**in the event, not an effect**: persisting is a consequence of the user's
action, not of a render ([Module 12 §9.5](../12-effects/#95-handling-a-user-event)).

### The flash

Choose dark, reload. The HTML arrives with no attribute, Bootstrap paints
light, the bundle loads, React mounts, the effect sets `data-bs-theme="dark"`,
the page repaints. One white frame, every load — and **no React code can fix
it**, because React runs after first paint by definition
([Module 2 §16](../02-react-introduction/#16-from-indexhtml-to-pixels-the-boot-sequence)).

The only code that runs before first paint is a synchronous `<script>` in
`<head>`:

```html
<!-- index.html — plain ES5: not bundled, not transpiled, not type-checked -->
<script>
  (function () {
    try {
      var stored = localStorage.getItem('shopscope.theme');
      var preference = stored === 'light' || stored === 'dark' ? stored : 'system';
      var dark = preference === 'dark' || (preference === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.setAttribute('data-bs-theme', dark ? 'dark' : 'light');
    } catch (e) {
      /* no storage, no matchMedia: Bootstrap's default (light) it is */
    }
  })();
</script>
```

It reads the **same key** and applies the **same resolution rule** as the
provider — including `prefers-color-scheme` for `'system'` — so the first
paint is already right, and React's effect later sets an attribute that is
already set. The key is a literal in two places because `index.html` cannot
import `THEME_STORAGE_KEY`; that duplication is the price of running before
the bundle exists.

Three ways to break it, all seen in the wild: adding `defer` or
`type="module"` (runs after parsing — the flash returns), moving it below the
stylesheet, or moving the logic into `main.tsx` ("it's the first thing that
runs" — first in the bundle, which is after paint).

Every themed product ships this trio: a preference with `'system'`, a storage
key, a blocking script. `next-themes` is a few hundred lines of exactly this.

**→ In the demos:** Demo 16, Lab 3 — `ThemeContext.tsx` rewritten around a
preference, `useSyncExternalStore`, `localStorage`, the `index.html` script,
and the tokens in `index.css`.

📖 [MDN — `prefers-color-scheme`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme)

---

## 11. Responsive layout

### Mobile-first with the grid

Bootstrap's grid is mobile-first: the **unprefixed value is the phone**, and
each breakpoint overrides from that width *up*. A key you leave out inherits
the one below it.

| Key | `xs` | `sm` | `md` | `lg` | `xl` | `xxl` |
|---|---|---|---|---|---|---|
| From | 0 | 576 px | 768 px | 992 px | 1200 px | 1400 px |

```tsx
import { Col, Row, type RowProps } from 'react-bootstrap';

/** Typed from Row's own props: `xxl: 5` is fine, `xxxl` is a compile error. */
type GridColumns = Pick<RowProps, 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'>;

const COLUMNS: Record<Density, GridColumns> = {
  comfortable: { xs: 1, sm: 2, lg: 3, xl: 4, xxl: 5 },   // md inherits sm's 2
  compact: { xs: 2, sm: 3, md: 4, lg: 5, xl: 6 },
};

<Row {...COLUMNS[density]} className="g-3">
  {products.map((product) => (
    <Col key={product.id} className="product-cell">
      <ProductCard product={product} density={density} />
    </Col>
  ))}
</Row>
```

`xs={1} lg={3}` renders `row-cols-1 row-cols-lg-3`. Bootstrap ships
`row-cols-*-1` to `-6` and nothing above, so `xxl: 8` type-checks and renders
a class with no rule behind it. The type knows the keys; the stylesheet knows
the values.

### Responsive utilities, and where the library stops

Every Bootstrap utility takes the same breakpoint infix: `flex-md-row`,
`d-none d-sm-flex`, `ms-md-auto`. The React Bootstrap components do not all
expose that — `Stack`'s `gap` is responsive, its `direction` is not. So you
use the utility the component is *made of*:

```tsx
{/* a vertical Stack IS d-flex flex-column — so flex-md-row turns it into a row from md up */}
<Stack gap={2} className="mb-3 flex-md-row align-items-md-center">
  <InputGroup className={styles.search}>…</InputGroup>
  <Form.Select className={styles.sort}>…</Form.Select>
  <Badge bg="secondary" className="align-self-start align-self-md-center ms-md-auto" role="status">
    {resultCount} results
  </Badge>
</Stack>
```

And there is no `w-md-50`. A max-width that applies only from md is a **media
query**, and a media query lives in a stylesheet — the first honest CSS
Module in the app proper:

```css
/* src/components/ProductToolbar.module.css — 768px is Bootstrap's md; var() is not allowed in a media query */
@media (min-width: 768px) {
  .search { max-width: 360px; }
  .sort { max-width: 200px; }
}
```

The two `style={{ maxWidth }}` these replace had to be removed, not joined:
an inline style beats a media query at every width.

### Container queries

`@media` asks how wide the **viewport** is. A product card does not know
whether it is one of five in a grid or alone in a sidebar — at 540 px the
single card is a tall tower with white space beside a small image, while at
768 px two narrower cards look fine. A **container query** asks how wide the
card's *container* is:

```css
/* src/index.css — the grid cell is the container; a container cannot query itself */
.product-cell { container-type: inline-size; }

@container (min-width: 440px) {
  .product-card { flex-direction: row; }
  .product-card__media { flex: 0 0 40%; }
}
```

```tsx
<Card className={clsx('product-card h-100', (isOutOfStock || busy) && 'opacity-50')}>
  <Link to={`/products/${product.id}`} className="product-card__media" aria-hidden="true" tabIndex={-1}>
    <Card.Img variant="top" src={product.thumbnail} alt="" />
  </Link>
  …
</Card>
```

Now one card in a 516 px cell lays out image-left; the same card in a 350 px
cell lays out image-top — even though the viewport got *wider* between the
two. Container queries have shipped in every browser since 2023 and replace
the `isMobile` prop that half the React components in the wild still take.
The names live in `index.css` because the rule spans two components; a
Module could not reach both.

**→ In the demos:** Demo 16, Lab 4 — `COLUMNS` typed from `RowProps`, the
toolbar's Module, and the card's container query.

📖 [Bootstrap — Grid](https://getbootstrap.com/docs/5.3/layout/grid/) · [Breakpoints](https://getbootstrap.com/docs/5.3/layout/breakpoints/)
📖 [MDN — CSS container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries)

---

## 12. Styling and accessibility

Styling is where accessibility most often breaks *quietly*, because nothing
errors. Five rules.

**Never remove a focus ring without replacing it.** `outline: none` on
`:focus` is the most common accessibility regression a stylesheet introduces.
Style `:focus-visible` instead — it fires for keyboard focus and not for
mouse clicks — and keep the ring visible against both themes:

```css
.dialog button:focus-visible { outline: 2px solid var(--bs-primary); outline-offset: 2px; }
```

Bootstrap's components already do this through `--bs-btn-focus-box-shadow`;
the risk is in your own CSS and in old resets.

**Contrast is a token decision, and it must hold in both modes.** WCAG AA asks
for 4.5:1 on body text and 3:1 on large text and UI boundaries. A token that
passes on white often fails on `#12161c`, which is why `--shopscope-accent`
has two values. Bootstrap's `text-bg-warning` pairs dark text with the yellow
for this reason; a hand-made `text-warning` on white is a 1.8:1 failure. Check
both modes with DevTools' colour picker or `axe` ([Module 20](../20-production/)).

**Do not convey state with colour alone.** `StockBadge` is green, yellow or
red *and* says "In stock", "Only 3 left", "Out of stock". The text is the
accessible part; the colour is reinforcement.

**Honour `prefers-reduced-motion`.** Any animation or transition you write
gets an opt-out, and motion driven from JavaScript reads the same query
through `useSyncExternalStore`, exactly like the theme in [§9](#9-bootstrap-53-colour-modes):

```css
@media (prefers-reduced-motion: reduce) { .dialog[open] { animation: none; } }
```

```ts
const QUERY = '(prefers-reduced-motion: reduce)';
export const useReducedMotion = () =>
  useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(QUERY);
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    },
    () => window.matchMedia(QUERY).matches,
  );
```

**Set `color-scheme` with the theme.** It makes native controls, scrollbars
and the `<dialog>` backdrop follow, and it is the one line a hand-rolled dark
theme most often forgets. Bootstrap sets it under `[data-bs-theme=dark]`;
your own `[data-theme]` must too.

📖 [MDN — `:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible)
📖 [MDN — `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)

---

## 13. Styling in tests

A component test runs in jsdom, which has **no layout engine**: nothing is
measured, media queries never match, and a stylesheet you imported may not be
processed at all (Vitest skips CSS by default; CSS Modules still return an
object of names). So what can you assert?

**Assert the contract, not the pixels.** The contract of `StockBadge` is that
an out-of-stock product reads "Out of stock" and carries the danger tone — a
text, and the class the variant map promised:

```tsx
test('out of stock reads as such and wears the danger tone', () => {
  render(<StockBadge stock={0} />);
  const badge = screen.getByText('Out of stock');
  expect(badge).toHaveClass('badge', 'text-bg-danger');
  expect(badge).not.toHaveClass('rounded-pill');
});
```

`toHaveClass` is the right assertion for utility and variant classes: the
class name *is* the public behaviour, and turning it into pixels is
Bootstrap's test suite's job, not yours.

**Do not assert on hashed Module names.** `toHaveClass('_dialog_x9k2')`
breaks on the next build. Use the imported object — `toHaveClass(styles.dialog)`
— or, better, what the user sees.

**`toHaveStyle` works for inline styles and little else.** jsdom applies
inline `style`, not cascaded layout:

```tsx
expect(screen.getByRole('img', { hidden: true })).toHaveStyle({ height: '110px' });   // inline: fine
```

**Test the theme through its effect on the document.** `matchMedia` does not
exist in jsdom, so stub it once in setup, then assert the attribute and the
storage write:

```tsx
beforeAll(() => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
});

test('choosing dark sets the attribute and persists', async () => {
  render(<ThemeProvider><SiteHeader /></ThemeProvider>);
  await userEvent.click(screen.getByRole('button', { name: 'Dark theme' }));
  expect(document.documentElement.dataset.bsTheme).toBe('dark');
  expect(localStorage.getItem('shopscope.theme')).toBe('dark');
});
```

**What belongs in a browser test.** The inline script in `index.html`, the
absence of a flash, container queries, `:hover` and `:focus-visible` rings —
anything about real layout — cannot be tested in jsdom. Playwright can: one
`toHaveScreenshot()` per theme on the About page catches a regression in any
of the five ways at once ([Module 18](../18-testing/)).

---

## 14. A decision table for a team

A styling policy is a table a reviewer can point at. ShopScope's, as the demo
wrote it:

| Need | Use | Where in ShopScope |
|---|---|---|
| A component, a layout, a spacing | React Bootstrap component or utility class | everywhere — still the default |
| A class that depends on a condition | `clsx` | `ProductCard`, `PriceTag` |
| Recurring tone / size / shape axes, or framework classes on a non-framework element | a `cva` map in `src/lib/variants.ts` | `StockBadge`, the button-shaped `<Link>`s |
| A rule one component needs that no utility can say (`@media`, `::backdrop`, `[open]`) | a CSS Module next to the component | `ProductToolbar.module.css`, `ConfirmDialog.module.css` |
| A token, a Bootstrap variable override, a rule that spans components | `src/index.css` | theme tokens, `.text-accent`, the card's container query |
| A value that comes from data | inline `style` | the card image height, the histogram tooltip position |
| A second utility framework | not for new code | Tailwind stays for the showcase only, 1 KB, loads with `/about` |
| Plain global CSS with hand-named classes | not for new code | `pricetag.css` stays as the showcase's way 1 |
| Runtime CSS-in-JS | no | — |

For a team starting fresh the first row changes and the rest holds:

| If the design is… | Framework | Escape hatch | Variants | Library |
|---|---|---|---|---|
| the framework's | Bootstrap utilities | CSS Modules | `clsx` + `cva` over Bootstrap classes | React Bootstrap |
| yours, with Tailwind | Tailwind 4 | CSS Modules, rarely | `clsx` + `tailwind-merge` + `cva` | shadcn/ui, or Radix / Base UI directly |
| yours, without Tailwind | CSS Modules + tokens | — | `clsx` + `cva` over your classes | Radix / Base UI / React Aria |
| a vendor's (MUI) | MUI theme | `sx` | the library's `variant` props | MUI |

Whatever the row, the review questions are the same: *who else can this rule
touch*, *does the token hold in both modes*, and *is this value from data or
from design*.

---

## 15. Common errors and what they mean

| Symptom | Cause | Fix |
|---|---|---|
| `Cannot find module './X.module.css' or its corresponding type declarations` | no `"types": ["vite/client"]`, or the file is not `*.module.css` | add the type; the suffix is the switch |
| `class="undefined"` in Elements | a misspelt key on a CSS Module object | check the name — the type cannot |
| A rule is ignored, no error | lower specificity, earlier in the cascade, or inside `@layer` beneath an unlayered rule | DevTools → Styles shows the winner; fix order or scope, not `!important` |
| A `tw:` class has no effect | built at runtime, file not in `@source`, or a same-named Bootstrap class winning from outside the layer | full names in a lookup; one `@source` per file; keep the prefix |
| Headings lose their margins after adding Tailwind | `@import 'tailwindcss'` pulled in preflight over Bootstrap's reboot | import `theme.css` and `utilities.css` by hand |
| `Type '"lwo"' is not assignable to type '"ok" \| "low" \| …'` | a variant value not in the `cva` map | fix the spelling, or add the row once |
| Theme flashes on reload | the `index.html` script is missing, `defer`red, `type="module"`, or in `main.tsx` | synchronous, in `<head>` |
| Follows the OS only after a reload | `matchMedia` read once into `useState`, no subscription | `useSyncExternalStore` |
| Dark override of `--bs-body-bg` ignored | `index.css` imported before Bootstrap, or set on `:root` instead of `[data-bs-theme='dark']` | later import, right selector |
| Card never switches to the row layout | `container-type` on the card itself | a container cannot query itself — put it on the cell |
| A `max-width` media query does nothing | an inline `style={{ maxWidth }}` on the same element wins | delete the inline style |
| `window.matchMedia is not a function` in a test | jsdom has no `matchMedia` | stub it in the test setup |
| Native `<dialog>` opens with no backdrop, Escape does nothing | `dialog.show()` | `dialog.showModal()` |

---

## 16. Self-check

1. What does `import './pricetag.css'` bind, and when does the browser
   receive that CSS in dev versus after `vite build`?
2. Why does a stylesheet imported from a lazily loaded route not slow down
   the home page?
3. State the one question every styling technique answers differently, and
   answer it for each of the five ways.
4. What does a `.module.css` import return, why are the names hashed, and
   what mistake does the TypeScript type *not* catch?
5. Name the two categories of CSS an inline `style` object can never express,
   and what the inline `PriceTag` has to do to fake `:hover`.
6. Why does `` `tw:text-${size}` `` generate nothing? What form works?
7. Three decisions make Tailwind 4 coexist with Bootstrap. Name them and the
   failure each prevents.
8. Why does Bootstrap win a tie with a Tailwind utility of the same name even
   when the Tailwind rule is more specific?
9. Why does the track not start a React 19 project with styled-components?
   Be precise about *when* the CSS is produced.
10. What does `clsx` do with `false`, `undefined` and an object argument? What
    does it *not* do with two conflicting classes?
11. What is `VariantProps<typeof badge>`, and why does `StockBadge` expose
    `size` and `pill` but not `tone`?
12. Define styled and headless libraries in one sentence each, and name the
    question that chooses between them.
13. Why are CSS custom properties *the* theming mechanism? Answer in terms of
    what React has to do when the theme changes.
14. ShopScope stores `preference` and derives `theme`. What goes wrong if both
    are state? Which hook reads the OS setting, and why not an effect?
15. Explain the flash of wrong theme step by step, and why the fix cannot be
    in a React component. Why is the storage key duplicated as a literal?
16. In `{ xs: 1, sm: 2, lg: 3 }`, how many columns at `md`? Why does
    `xxl: 8` type-check and render nothing?
17. What question does a container query answer that a media query cannot?
    Where does `container-type` go, and why not on the card?
18. Name three accessibility regressions a stylesheet can introduce with no
    error, and the fix for each.
19. What can a jsdom test assert about styling, and what must go to a browser
    test?

### Practical

1. Take one component from your own app and style it the five ways. Inspect
   each in Elements and write, for each, who else its rules can touch. Delete
   four and keep the one that fits your policy.
2. Add `.price { color: red; }` to a global stylesheet and to a Module in the
   same app. Explain what each one changed and why.
3. Replace every template-string `className` in a codebase with `clsx`, then
   move one recurring tone/size pair into a `cva` map. Prove the type catches
   a misspelt variant.
4. Build the theme trio from scratch: a `'light' | 'dark' | 'system'`
   preference behind a hook, `localStorage`, and the inline script. Record a
   reload with the script commented out to see the flash, then put it back.
5. Add one token of your own with a value per mode and check its contrast
   against the body background in both.
6. Give a card a container query and show, by resizing, a case where the
   viewport gets wider and the card gets narrower.
7. Write the jsdom test for your theme control, including the `matchMedia`
   stub, and one Playwright screenshot per theme.

---

## 17. References

**React**
- [`style` and `className` on built-in components](https://react.dev/reference/react-dom/components/common#common-props)
- [`<link>` — stylesheet precedence in React 19](https://react.dev/reference/react-dom/components/link)
- [`useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore)
- [`useId`](https://react.dev/reference/react/useId)
- [Server Components](https://react.dev/reference/rsc/server-components) — why zero-runtime styling matters
- [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect) — persisting in the event, deriving the theme

**Vite**
- [Features — CSS](https://vite.dev/guide/features#css) — imports, CSS Modules, `?inline`, pre-processors
- [Features — CSS code splitting](https://vite.dev/guide/features#css-code-splitting)

**Bootstrap and React Bootstrap**
- [Color modes](https://getbootstrap.com/docs/5.3/customize/color-modes/)
- [CSS variables](https://getbootstrap.com/docs/5.3/customize/css-variables/)
- [Utilities — Colors](https://getbootstrap.com/docs/5.3/utilities/colors/)
- [Layout — Grid](https://getbootstrap.com/docs/5.3/layout/grid/) · [Breakpoints](https://getbootstrap.com/docs/5.3/layout/breakpoints/)
- [React Bootstrap — Introduction](https://react-bootstrap.github.io/docs/getting-started/introduction) · [Theming (`ThemeProvider`)](https://react-bootstrap.github.io/docs/getting-started/theming)

**Tailwind 4**
- [Installing with Vite](https://tailwindcss.com/docs/installation/using-vite)
- [Detecting classes in source files](https://tailwindcss.com/docs/detecting-classes-in-source-files) — `@source`, `source(none)`, complete class names
- [Dark mode](https://tailwindcss.com/docs/dark-mode) — `@custom-variant dark`
- [Preflight](https://tailwindcss.com/docs/preflight) — importing without it

**`clsx` and `cva`**
- [clsx — README](https://github.com/lukeed/clsx#readme)
- [cva — Variants](https://cva.style/docs/getting-started/variants) · [TypeScript](https://cva.style/docs/getting-started/typescript)

**CSS platform (MDN)**
- [Using CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [Cascade layers](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Cascade_layers)
- [CSS container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries)
- [`prefers-color-scheme`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme) · [`prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [`color-scheme`](https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme) · [`:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible)
- [`<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog)

---

**Builds on:** [Module 4 §8 — Inline styles](../04-components-and-jsx/#8-inline-styles)
and [Module 6 §17 — Conditional attributes and classes](../06-conditional-rendering-and-lists/#17-conditional-attributes-and-classes)
**Continues in:** [Module 16 — Advanced Patterns, Error Boundaries & Portals](../16-advanced-patterns/) (compound components, portals, the headless dialog hand-rolled)
