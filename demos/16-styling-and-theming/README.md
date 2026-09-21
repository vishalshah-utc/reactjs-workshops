# Demo 16 — Styling & Theming in React

**Demo guide** · ~110 minutes · five ways to put CSS on a component, one way to theme them all — and a written policy instead of a rule

---

## Where you are starting from

The starter is **Demo 15, finished**: the complete ShopScope SPA with the
keyboard pass — and one file that has been a comment since Demo 1,
`src/index.css`. The track's rule was *no custom CSS*, and it held for
fifteen demos because React Bootstrap covered everything we asked. Today it
becomes a **policy**, because your next job will have CSS and you need to
know which kind.

New stubs: `src/components/styling/` (five `PriceTag.*.tsx`, their stylesheets,
`StylingShowcase.tsx`, `DialogComparison.tsx`), `src/tailwind.css`,
`src/lib/variants.ts`, `ProductToolbar.module.css`,
`ConfirmDialog.headless.tsx` and `ConfirmDialog.module.css`.

New dependencies: **`clsx@2.1.1`**, **`class-variance-authority@0.7.1`**,
**`tailwindcss@4.3.3`**, **`@tailwindcss/vite@4.3.3`** — already in
`package.json` since Demo 15's Part 6 set, already installed. Today is the
first time any of them is imported.

## What you ship today

The same `PriceTag`, styled **five ways** — plain CSS, CSS Modules, inline
`style`, Tailwind v4 through the Vite plugin, Bootstrap utilities — side by
side on the About page, so you can read each class attribute and say what it
cost. A `StockBadge` whose classes come from **`clsx`**, then from a **`cva`
variant map** that also dresses every router `<Link>` wearing hand-typed
`btn btn-light btn-sm`. A **three-way theme** — light, dark, *system* — that
follows the OS through `useSyncExternalStore`, persists under
`shopscope.theme`, and does **not flash** white on reload because an inline
script in `index.html` sets `data-bs-theme` before first paint; a brand accent
as a custom property that flips with it. A grid tuned per breakpoint and
density, a toolbar that stacks on phones, **one container query**. And
`ConfirmDialog` rebuilt on the native `<dialog>` in forty lines — then put
back on React Bootstrap's `Modal`, on purpose, with the reason written down.

By the end you will be able to answer, without hesitating:

- The five ways to style a React component, what each one scopes, and the one question that picks between them
- Why `style` takes a camelCase object, what a bare number means in it, and the two things it can never express
- What a CSS Module import returns, why the class names are hashed, and where the hash is visible
- How Tailwind v4 coexists with Bootstrap, and when `cva` earns its place over `clsx`
- How Bootstrap 5.3 themes itself from `data-bs-theme` and `--bs-*` custom properties, and how your own tokens join in
- Why a persisted theme flashes on load and why the fix cannot live in React
- The difference between a styled component library and a headless one, and what "headless" buys you

> **Styling is a scoping decision.** Every technique below answers one
> question — *who else can this rule touch?* — differently. Global CSS: anyone.
> CSS Modules: this file. Inline: this element. Tailwind and Bootstrap
> utilities: whoever types the class. Choose by how far you want a rule to
> reach, and the rest follows. 📖 [study-notes 04 §8](../../study-notes/04-components-and-jsx/#8-inline-styles)
> covers inline styles and conditional classes; today turns it into a system.

---

## Before the demo (5 minutes)

```
https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/16-styling-and-theming/starter
```

> ⚠️ Click once, bookmark the `stackblitz.com/edit/…` URL.

Locally: `cd demos/16-styling-and-theming/starter && npm install && npm run dev`.

DevTools panes for today: **Elements → Styles** (which rule won, from which
file), **Computed**, **Rendering → Emulate `prefers-color-scheme`**, and
**Network → CSS** for Lab 1's last step.

---

## The cold open

Open `src/index.css`: seven lines, all comments. `grep -rn "\.css" src
--include=*.tsx | grep import`: one hit, `main.tsx` importing Bootstrap.
**This app has zero lines of custom CSS** — fifteen demos of UI, every visual
decision a React Bootstrap prop or a utility class. It worked, for an app that
looks like Bootstrap.

Your next job will not look like Bootstrap. It will have a design system,
or a designer, or a 2019 stylesheet with `!important` in it. You will open a
component and find `className="flex items-center gap-2"`, or `import styles
from './Card.module.css'`, or `styled.div`, and someone will ask which one
the new feature should use. Here are the five ways teams do it. You will ship
each once, on the same component, then decide — in writing — which this app
keeps.

One more thing. Click the moon: dark. Reload: **light**. The theme has never
survived a reload — Demo 12 left a comment saying persistence was Demo 16's
job. And when you persist it, a second bug appears that lasts one frame. Lab 3
makes you see it.

---

## Lab 1 — The five ways to style (30 min)

### Problem

`PriceTag` renders a price, an optional struck-through list price and a
discount. It is styled with six Bootstrap utility classes. Take those away and
you have to *put the CSS somewhere* — and there are five somewheres, each with
a different answer to who else the rule can touch.

### Concept

**A class name is a string; the browser matches it against every stylesheet
on the page.** That sentence is the whole problem of CSS at scale, and every
technique below is a way of narrowing "every".

| Way | Where the CSS lives | Scope — who can this rule touch? | Pseudo-classes, media queries | Cost |
|---|---|---|---|---|
| **1. Plain CSS** | a `.css` file, imported for its side effect | **global** — every element on the page, for ever | yes | naming discipline (BEM), collisions, dead rules nobody dares delete |
| **2. CSS Modules** | a `.module.css` file, imported as an object | **this file** — class names are hashed per module | yes | one more file per component; class names are opaque in DevTools |
| **3. Inline `style`** | the JSX, as a `CSSProperties` object | **this element** | **no** — no `:hover`, no `@media`, no `::before` | a new object per render; highest specificity, so hardest to override |
| **4. Tailwind** | generated from class names found in your source | whoever types the class | yes, as variants (`hover:`, `md:`, `dark:`) | a build step; a second vocabulary next to Bootstrap's; long class attributes |
| **5. Bootstrap utilities** | `bootstrap.min.css`, already loaded | whoever types the class | responsive variants (`flex-md-row`), no pseudo-classes | you get what Bootstrap has — 230 KB of it |

Two are *frameworks* (4, 5), three are *techniques* (1, 2, 3); a team runs one
of each. ShopCrew runs Tailwind + shadcn/ui; this track runs Bootstrap and,
from today, CSS Modules.

**Vite's part.** A `.css` import is a side effect — the file is injected
(dev) or bundled (build). A `.module.css` import *returns an object* of hashed
class names; no plugin, the suffix is the switch. Either way the stylesheet
travels with the **chunk** that imports it: CSS imported from a lazy route
ships with that route.

**What is missing from the table.** CSS-in-JS runtimes — styled-components,
Emotion — generate the stylesheet *at render time*: CSS computed, hashed and
inserted per component per render, and no React Server Components. The
ecosystem moved to zero-runtime (Tailwind, CSS Modules, StyleX); you will
read styled-components in old codebases and not start one with it.

**And TypeScript says:** `style` is `CSSProperties` — camelCase keys with
typed values, so `fontWieght` is a compile error. A CSS Module import is
`{ readonly [key: string]: string }`: any key is legal, so `styles.pirce`
compiles and renders `class="undefined"`. The type protects the shape, not
the names; DevTools catches the rest.

### Steps

**A. `src/components/styling/PriceTag.plain.tsx` and `pricetag.css` — `TODO(lab-1.1)`**

```tsx
import { discountedPrice, formatPrice } from '../../lib/format';
import type { PriceTagProps } from '../PriceTag';
// A SIDE-EFFECT import: nothing is imported INTO this module. Vite appends the file to the page's
// stylesheet — globally, for the life of the page, whether or not this component is ever rendered.
import './pricetag.css';

/** Way 1 — plain CSS. Class names are strings the stylesheet happens to define; nothing connects the two but discipline. */
export function PriceTagPlain({ price, discountPercentage = 0, size = 'md' }: PriceTagProps) {
  // …hasDiscount and finalPrice, exactly as in PriceTag.tsx…
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

```css
/* Way 1 — a GLOBAL stylesheet. From the moment PriceTag.plain.tsx is imported, `.price` means THIS everywhere. */
.price { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.5rem; }
.price__final { font-weight: 600; font-size: 1.25rem; }
.price--sm .price__final { font-size: 1rem; }                 /* modifiers: one class on the block, read by a descendant selector */
.price--lg .price__final { font-size: calc(1.3rem + 0.6vw); }
.price__was { color: var(--bs-secondary-color); font-size: 0.875em; }   /* Bootstrap's variables ARE the theme — use them */
.price__off { color: var(--bs-success); font-size: 0.875em; font-weight: 500; }
.price:hover .price__final { color: var(--bs-primary); }      /* a pseudo-class — the one thing an inline style cannot express */
```

`PriceTagProps` is exported from `PriceTag.tsx`: the five variants take
*exactly* the same props, or the comparison means nothing.

**B. `src/components/styling/PriceTag.module.tsx` and `PriceTag.module.css` — `TODO(lab-1.2)`**

Copy `pricetag.css` into `PriceTag.module.css` and shorten the names —
`.price`, `.final`, `.was`, `.off`, `.sm`, `.lg` (so `.sm .final { … }`).
Then:

```tsx
// NOT a side effect: a `.module.css` import returns an OBJECT — { price: '_price_7gmat_2', final: '_final_7gmat_13', … }.
// Vite hashes every class name per file, so this `.price` cannot collide with pricetag.css's `.price`.
import styles from './PriceTag.module.css';

export function PriceTagModule({ price, discountPercentage = 0, size = 'md' }: PriceTagProps) {
  // …same derivation…
  // Conditional classes by hand (study-notes 04 §8). `false` in a template string prints "false" — hence filter(Boolean).
  const rootClass = [styles.price, size === 'sm' && styles.sm, size === 'lg' && styles.lg].filter(Boolean).join(' ');

  return (
    <div className={rootClass}>
      <span className={styles.final}>{formatPrice(finalPrice)}</span>
      {/* …styles.was, styles.off — the same markup as way 1 with object keys for class names… */}
    </div>
  );
}
```

That `filter(Boolean).join(' ')` line is the last time you will write it —
Lab 2 replaces it.

**C. `src/components/styling/PriceTag.inline.tsx` — `TODO(lab-1.3)`**

```tsx
import { useState, type CSSProperties } from 'react';
import type { PriceSize, PriceTagProps } from '../PriceTag';

// `CSSProperties` is React's type for a style object: camelCase keys, string | number values.
const ROW: CSSProperties = { display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 8 }; // a bare number is PIXELS: gap: 8 → "8px"
const FONT_SIZE: Record<PriceSize, CSSProperties['fontSize']> = { sm: '1rem', md: '1.25rem', lg: '1.75rem' }; // strings for any other unit

export function PriceTagInline({ price, discountPercentage = 0, size = 'md' }: PriceTagProps) {
  // …same derivation…
  // `:hover` does not exist in a style object. The nearest thing is state + two handlers — which re-renders the component
  // on every mouse move in and out, and does nothing for keyboard focus. The other four ways get it in one line.
  const [hover, setHover] = useState(false);

  return (
    <div style={ROW} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <span style={{ fontWeight: 600, fontSize: FONT_SIZE[size], color: hover ? 'var(--bs-primary)' : undefined }}>{formatPrice(finalPrice)}</span>
      {/* …<s style={{ color: 'var(--bs-secondary-color)', fontSize: '0.875em' }}> and the "% off" span the same way… */}
    </div>
  );
}
```

`ROW` is hoisted to module scope so it is one object, not one per render;
the inner style objects are not, and cannot be — they depend on props and
state. That is the "new object every render" cost in the table.

**D. `src/tailwind.css`, `vite.config.ts` and `src/components/styling/PriceTag.tailwind.tsx` — `TODO(lab-1.4)`**

First the naive version, to see what it breaks: `@import 'tailwindcss';` in
`src/tailwind.css`, `tailwindcss()` after `react()` in `vite.config.ts`
(`import tailwindcss from '@tailwindcss/vite'`), and import the file from
`main.tsx` for a moment. Reload: headings lose their margins, buttons their
borders, the body its font. That is **preflight** — Tailwind's reset — landing
on Bootstrap's reboot. And both frameworks define `.container`, `.border`,
`.rounded`, `.collapse`, `.gap-3` (Tailwind `0.75rem`, Bootstrap `1rem`).
Remove the `main.tsx` import and write the honest configuration:

```css
/* Tailwind v4 next to Bootstrap: 1. NO preflight (import theme + utilities by hand, the reset stays out);
   2. a PREFIX (every class is tw:something — the two vocabularies never share a name);
   3. a NARROW SOURCE (source(none) stops project-wide scanning; @source names the one file that uses it). */
@layer theme, base, components, utilities;
@import 'tailwindcss/theme.css' layer(theme) prefix(tw);
@import 'tailwindcss/utilities.css' layer(utilities) prefix(tw) source(none);
@source './components/styling/PriceTag.tailwind.tsx';

/* Tailwind's `dark:` variant defaults to the OS media query. Ours follows Bootstrap's attribute, so one control themes both. */
@custom-variant dark (&:where([data-bs-theme='dark'], [data-bs-theme='dark'] *));
```

```tsx
import { discountedPrice, formatPrice } from '../../lib/format';
import type { PriceSize, PriceTagProps } from '../PriceTag';
// Imported HERE, not in main.tsx, so it ships only with the chunk that uses it (the lazy About page).
import '../../tailwind.css';

// Tailwind scans source files for COMPLETE class names. `tw:text-${x}` generates nothing; a lookup table of full names works.
const TEXT_SIZE: Record<PriceSize, string> = { sm: 'tw:text-base', md: 'tw:text-xl', lg: 'tw:text-3xl' };

export function PriceTagTailwind({ price, discountPercentage = 0, size = 'md' }: PriceTagProps) {
  // …same derivation…
  return (
    <div className="tw:flex tw:flex-wrap tw:items-baseline tw:gap-2">
      {/* tw:hover: — a pseudo-class as a variant. tw:dark: follows data-bs-theme (see tailwind.css). */}
      <span className={`tw:font-semibold tw:hover:text-blue-600 tw:dark:hover:text-blue-400 ${TEXT_SIZE[size]}`}>{formatPrice(finalPrice)}</span>
      {/* …<s className="tw:text-sm tw:text-slate-500 tw:dark:text-slate-400">, and tw:text-emerald-600 tw:dark:text-emerald-400 for "% off"… */}
    </div>
  );
}
```

One fact underneath all three decisions: Tailwind v4 emits its utilities
inside `@layer utilities`, and **Bootstrap is unlayered. Unlayered CSS beats
layered CSS regardless of specificity.** So when the two *do* share a name,
Bootstrap wins silently, every time. The prefix is not tidiness; it is the
only way to know which framework a class came from.

**E. `src/components/styling/PriceTag.bootstrap.tsx`, `StylingShowcase.tsx` and `src/routes/AboutPage.tsx` — `TODO(lab-1.5)`**

`PriceTag.bootstrap.tsx` is a copy of today's `PriceTag.tsx`, renamed
`PriceTagBootstrap` — frozen for the comparison while the live one changes in
Labs 2 and 3. Then the showcase:

```tsx
import { PriceTagPlain } from './PriceTag.plain';
// …the other four, and DialogComparison (a stub until Lab 5)…

/** One product, so the five renderings are comparable to the pixel. */
const SAMPLE: PriceTagProps = { price: 64, discountPercentage: 25, size: 'md' };

interface Way {
  name: string;
  file: string;
  inspect: string; // what to look at in DevTools → Elements for this one
  render: (props: PriceTagProps) => ReactNode;
}

const WAYS: Way[] = [
  { name: '1 · Plain CSS', file: 'PriceTag.plain.tsx + pricetag.css', inspect: 'class="price price--md" — names you typed, matched by a global stylesheet.', render: (p) => <PriceTagPlain {...p} /> },
  { name: '2 · CSS Modules', file: 'PriceTag.module.tsx + PriceTag.module.css', inspect: 'class="_price_…" — the same names, hashed per file.', render: (p) => <PriceTagModule {...p} /> },
  // …3 inline, 4 Tailwind, 5 Bootstrap — same shape…
];

export function StylingShowcase() {
  // A <section aria-labelledby> with an h2, then a Row xs={1} md={2} xl={3} of Cards — one per way:
  // the name, way.render(SAMPLE), <code>{way.file}</code>, and way.inspect as the caption. Then <DialogComparison />.
}
```

The full `WAYS` list is in the finished tree
(`demos/17-component-patterns-and-portals/starter/src/components/styling/StylingShowcase.tsx`);
the shape is what matters — a component per way, the same props to each.

In `AboutPage`, wrap the card in a fragment and render `<StylingShowcase />`
under it. The page is lazy, so the showcase's three stylesheets arrive in
*its* chunk's CSS, not the app's.

### Verify

1. **Same pixels, five class attributes.** `/about`: five identical `$48.00
   ~~$64.00~~ 25% off`. Inspect each: `price price--md` · `_price_7gmat_2`
   (your hash differs) · a `style` attribute and no class · `tw:flex tw:flex-wrap
   …` · `d-flex flex-wrap …`. Hover each final price: all turn blue — and React
   DevTools shows only `PriceTagInline` re-rendering to do it.
2. **The collision.** Add `.price { color: red; }` to the bottom of
   `pricetag.css`: way 1 goes red. Add the same to `PriceTag.module.css`: way 2
   goes red and *nothing else* — that `.price` compiled to a different name.
   Then write `styles.pirce` in the module component: it compiles, the layout
   breaks, Elements shows `class="undefined"`. Undo all three.
3. **Preflight is out; size.** The About `<h1>` keeps Bootstrap's
   `margin-bottom: .5rem`, `<body>` its font. `npm run build`: `index-*.css`
   ≈ 230 KB (Bootstrap), `AboutPage-*.css` ≈ 3.6 KB — plain, module and
   **sixteen** prefixed Tailwind utilities in `@layer utilities`; search it
   for `html,:host`: absent.

### Watch out

**A CSS import in the wrong place.** `tailwind.css` from `main.tsx` ships to
every visitor; from the one component that needs it, to that chunk only.

**`tw:text-${size}`.** Tailwind reads source as *text*: it sees `tw:text-`
and generates nothing. Full class names in a lookup table, always.

**Bootstrap wins ties silently.** `tw:gap-3` next to `gap-3` is Bootstrap's
`1rem`, no warning. The prefix exists so you can see which one you wrote.

### Challenge (2 min)

`style={{ '--price-accent': 'tomato' } as CSSProperties}` — why the cast?
(`CSSProperties` knows every standard property and no custom one.) Read it
from `pricetag.css` with `var(--price-accent)`: an inline value driving a
stylesheet rule — the one collaboration between ways 1 and 3 that scales.

### In the real world

Most teams run one framework and one escape hatch — Tailwind + CSS Modules,
Bootstrap + CSS Modules, MUI + `sx`. The interview question is not "which is
best" but "what does each one scope"; the codebase smell is a component using
three of the five at once.

---

## Lab 2 — Conditional classes and variants (20 min)

### Problem

Search for `className={\``: three hits in `ProductCard`, one in `PriceTag` —
`` `h-100 ${isOutOfStock || busy ? 'opacity-50' : ''}` `` works, leaves a
trailing space, and is unreadable at the third condition. `StockBadge` avoids
it with three `return`s. And three files hand-type `btn btn-… btn-sm` on a
router `<Link>`, because `<Button as={Link}>` does not type-check.

### Concept

**Classes are a list, not a string.** `clsx('h-100', busy && 'opacity-50',
className)` takes strings, booleans, `undefined` and objects, drops every
falsy entry and joins the rest with one space. That is the whole library —
230 bytes — and it replaces every `filter(Boolean).join(' ')` and every
`${cond ? 'x' : ''}` you will ever write. Bootstrap's own components use it
internally; so does every design system.

**A variant map is the list, as data.** When the *same* axes recur — tone,
size, shape — `clsx` calls repeat. `cva` takes a base class and a map of
`variant → value → classes` and returns a function: `badge({ tone: 'low',
size: 'lg' })` → `'badge text-bg-warning fs-6 px-3 py-2'`. Unknown values do
not compile; defaults are declared once. shadcn/ui's `Button` is built on it,
and it works over *any* classes — Tailwind's, Bootstrap's, yours.

**And TypeScript says:** `VariantProps<typeof badge>` derives the props type
*from the map*: `{ tone?: 'ok' | 'low' | 'out' | 'neutral' | null; size?: …;
pill?: boolean | null }`. Add a tone to the map and every consumer's type
grows with it; misspell one at a call site and the compiler says so. The map
is the single source of truth for both the CSS and the API.

### Steps

**A. `src/components/StockBadge.tsx`, `ProductCard.tsx`, `PriceTag.tsx` — `TODO(lab-2.1)`**

```tsx
// StockBadge — three returns become one:
import clsx from 'clsx';

type StockTone = 'ok' | 'low' | 'out';
const TONE_CLASS: Record<StockTone, string> = { ok: 'bg-success-subtle text-success-emphasis', low: 'text-bg-warning', out: 'text-bg-danger' };
const LABELS: Record<StockTone, (stock: number) => string> = { out: () => 'Out of stock', low: (n) => `Only ${n} left`, ok: () => 'In stock' };
interface StockBadgeProps { stock: number; lowStockThreshold?: number; pill?: boolean; className?: string; }

function toneFor(stock: number, threshold: number): StockTone { /* 0 → 'out'; ≤ threshold → 'low'; else 'ok' */ }

/** data → a NAME for the state → classes → element. The steps never mix. */
export function StockBadge({ stock, lowStockThreshold = 5, pill = false, className }: StockBadgeProps) {
  const tone = toneFor(stock, lowStockThreshold);
  return <span className={clsx('badge', TONE_CLASS[tone], pill && 'rounded-pill', className)}>{LABELS[tone](stock)}</span>;
}
```

```tsx
// ProductCard — the three template strings:
    <Card className={clsx('h-100', (isOutOfStock || busy) && 'opacity-50')} aria-busy={busy}>
// …
      <Card.Body className={clsx('d-flex flex-column gap-2', isCompact && 'p-2')}>
        <Card.Title className={clsx('mb-0', isCompact ? 'small text-truncate' : 'fs-6')}>
// PriceTag:
      <span className={clsx('fw-semibold', SIZES[size])}>{formatPrice(finalPrice)}</span>
```

**B. `src/lib/variants.ts` — `TODO(lab-2.2)`**

```ts
import { cva, type VariantProps } from 'class-variance-authority';

/** The classes a badge MAY wear, as data. `badge({ tone: 'low' })` → 'badge text-bg-warning'. The classes are Bootstrap's; cva owns the API. */
export const badge = cva('badge', {
  variants: {
    tone: { ok: 'bg-success-subtle text-success-emphasis', low: 'text-bg-warning', out: 'text-bg-danger', neutral: 'text-bg-secondary' },
    size: { sm: 'px-1 py-0', md: '', lg: 'fs-6 px-3 py-2' },
    pill: { true: 'rounded-pill' },                    // a boolean variant: `pill` / `pill={false}`, no value to remember
  },
  defaultVariants: { tone: 'neutral', size: 'md' },
});

/** Bootstrap's button classes for what CANNOT be a <Button> — a router <Link> that should look like one. */
export const button = cva('btn', {
  variants: {
    tone: { primary: 'btn-primary', light: 'btn-light', outlineLight: 'btn-outline-light', ghost: 'btn-outline-secondary', link: 'btn-link' },
    size: { sm: 'btn-sm', md: '', lg: 'btn-lg' },
    block: { true: 'w-100' },
  },
  defaultVariants: { tone: 'primary', size: 'md' },
});

/** Derived from the maps, so the two cannot drift. */
export type BadgeVariants = VariantProps<typeof badge>;
export type ButtonVariants = VariantProps<typeof button>;
```

**C. `StockBadge.tsx`, `SiteHeader.tsx`, `CartDrawer.tsx`, `src/routes/ProductDetailPage.tsx` — `TODO(lab-2.3)`**

```tsx
// StockBadge — TONE_CLASS and clsx go; the map takes over. Pick the AXES this component exposes; tone stays derived.
import { badge, type BadgeVariants } from '../lib/variants';

interface StockBadgeProps extends Pick<BadgeVariants, 'size' | 'pill'> { stock: number; lowStockThreshold?: number; className?: string; }

export function StockBadge({ stock, lowStockThreshold = 5, size, pill, className }: StockBadgeProps) {
  const tone = toneFor(stock, lowStockThreshold);
  return <span className={badge({ tone, size, pill, className })}>{LABELS[tone](stock)}</span>;
}
```

```tsx
// SiteHeader (import { button } from '../lib/variants'):
                <Link to="/login" className={button({ tone: 'light', size: 'sm' })}>
// CartDrawer:
            <Link to="/login?redirectTo=/products" className={button({ block: true })} onClick={followLink}>
// ProductDetailPage — variant props the badge did not have until now:
                  <StockBadge stock={product.stock} size="lg" pill />
```

### Verify

1. `/products`: every badge is one `<span class="badge …">`, same colours as
   before; `/products/1` has a large pill. A dimmed card reads `class="card
   h-100 opacity-50"` — no trailing space, no `false`. **Sign in** reads `btn
   btn-light btn-sm`, generated instead of typed.
2. Type `badge({ tone: 'lwo' })`: *Type '"lwo"' is not assignable…*. Type
   `<StockBadge tone="out" />`: *Property 'tone' does not exist* — the
   component chose not to expose that axis. Both are the API working.

### Watch out

**`clsx` does not resolve conflicts.** `clsx('gap-3', 'tw:gap-3')` gives both,
and Lab 1 told you which wins. (Tailwind projects add `tailwind-merge`.)

**A variant Bootstrap does not have.** `size: { xs: 'btn-xs' }` compiles and
renders a class with no CSS. The map is typed; the stylesheet is not.

**`tone` on `StockBadge`'s props "for flexibility".** Then *Out of stock* can be
green. Expose presentation axes (`size`, `pill`), not meaning.

### In the real world

Open shadcn/ui's `button.tsx`: `cva` with `variant` and `size`, a
`VariantProps` type, `cn()` (`clsx` + `tailwind-merge`). You have just written
it over Bootstrap; every design-system component you meet is this shape.

---

## Lab 3 — Theming with CSS variables (30 min)

### Problem

Demo 12's `ThemeProvider` holds `'light' | 'dark'` in state and writes it to
`<html data-bs-theme>` in an effect. It forgets on reload, it ignores the OS
setting, and — once you fix the first — it paints the *wrong* theme for one
frame before React runs. Three defects, three layers: React state, the
browser's storage, and the HTML document itself.

### Concept

**Bootstrap 5.3 is themed by custom properties, switched by one attribute.**
Inspect `<html>`: `[data-bs-theme=dark] { --bs-body-bg: #212529; … }` — about
seventy variables, and every component reads them (`.card` reads
`--bs-card-bg`, which is `var(--bs-body-bg)`). Flip the attribute and the tree
recolours with **no class changes and no re-render** — that is what makes
custom properties *the* theming mechanism. Your tokens join by the same rule:
define `--shopscope-accent` on `:root` and again under `[data-bs-theme='dark']`.

**Three sources, one attribute.** The user's choice (state), the OS
(`matchMedia('(prefers-color-scheme: dark)')`), and — before any JavaScript —
the document. State holds a *preference* (`'light' | 'dark' | 'system'`); the
*theme* on the attribute is derived from it. Two values, never two states.

**The OS is an external store.** `matchMedia` gives a `matches` boolean and a
`change` event — a snapshot and a subscription, exactly the shape
`useSyncExternalStore(subscribe, getSnapshot)` exists for. Demo 15's
`useReducedMotion` did the same job with `useState` + `useEffect`; both work.
The hook says what it is in one line, has no effect body to get wrong, and
never renders a stale snapshot — pick it when the source is outside React.

**The flash cannot be fixed in React.** Persist the theme and reload as a
dark user: the HTML arrives with no attribute, Bootstrap paints light, React
loads, the effect sets `dark`, the page repaints. One white frame, every
load. React runs *after* first paint by definition; the only code that runs
before it is a `<script>` in `<head>`. Four lines, no imports, not
type-checked — and every framework that themes does exactly this
(`next-themes` injects the same script).

**And TypeScript says:** `localStorage.getItem` returns `string | null`, and
a string is not a `ThemePreference`. A **type guard** — `(v: unknown): v is
ThemePreference` — narrows it in one place; anything else becomes `'system'`.
Storage is a boundary like the network: `unknown` in, a narrowed type out.

### Steps

**A. `src/context/ThemeContext.tsx` — `TODO(lab-3.1)`**

```tsx
import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system'; // what the user CHOSE — 'system' keeps following the OS
export type Theme = 'light' | 'dark';                          // what is on <html data-bs-theme>: the preference RESOLVED

const DARK_QUERY = '(prefers-color-scheme: dark)';

interface ThemeContextValue {
  preference: ThemePreference; // what the header shows as pressed
  theme: Theme;                // what the page is showing
  setPreference: (next: ThemePreference) => void;
}

// The OS colour scheme is an EXTERNAL store: how to subscribe, and how to read — that is all useSyncExternalStore wants.
function subscribeToSystemTheme(onChange: () => void) {
  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}
function getSystemPrefersDark(): boolean {
  return window.matchMedia(DARK_QUERY).matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const systemPrefersDark = useSyncExternalStore(subscribeToSystemTheme, getSystemPrefersDark);

  // DERIVED during render — not a second piece of state that could disagree with the first.
  const theme: Theme = preference === 'system' ? (systemPrefersDark ? 'dark' : 'light') : preference;

  useEffect(() => {
    document.documentElement.dataset.bsTheme = theme;
  }, [theme]);

  const setPreference = useCallback((next: ThemePreference) => setPreferenceState(next), []);
  const value = useMemo(() => ({ preference, theme, setPreference }), [preference, theme, setPreference]);
  // …the provider element and useTheme are unchanged…
```

`toggleTheme` is gone; the header stops compiling until Step C. Good — the
compiler is listing the consumers for you.

**B. `src/context/ThemeContext.tsx` — `TODO(lab-3.2)`**

```tsx
export const THEME_STORAGE_KEY = 'shopscope.theme'; // index.html reads the SAME key before React loads — that stops the flash

/** `unknown` in, a narrowed union out — the only way a string from localStorage becomes a ThemePreference. */
function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

function readStoredPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : 'system';
  } catch {
    return 'system'; // storage disabled (Safari private mode throws): a preference is a nicety, not a requirement
  }
}
// …in the provider — a LAZY initialiser reads storage once, on mount:
  const [preference, setPreferenceState] = useState<ThemePreference>(readStoredPreference);
  // Persist in the EVENT, not an effect: storage is a consequence of the user's action, not of a render.
  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    try { localStorage.setItem(THEME_STORAGE_KEY, next); } catch { /* unavailable — the choice lasts for this tab */ }
  }, []);
```

**C. `src/components/SiteHeader.tsx` — `TODO(lab-3.3)`**

```tsx
// + ButtonGroup from react-bootstrap; + CircleHalf and `type Icon` from react-bootstrap-icons; + type ThemePreference
/** The three-way control as DATA: the group is rendered from this list, so adding a preference is a row. */
const THEME_OPTIONS: { value: ThemePreference; label: string; Icon: Icon }[] = [
  { value: 'light', label: 'Light theme', Icon: Sun },
  { value: 'dark', label: 'Dark theme', Icon: MoonStars },
  { value: 'system', label: 'Follow the system theme', Icon: CircleHalf },
];
// …
  const { preference, setPreference } = useTheme();
// …the toggle button becomes:
            {/* A SEGMENTED control: aria-pressed on each button — a toggle that reads as "Dark theme, pressed". */}
            <ButtonGroup size="sm" aria-label="Theme">
              {THEME_OPTIONS.map(({ value, label, Icon }) => (
                <Button key={value} variant={preference === value ? 'light' : 'outline-light'} aria-pressed={preference === value}
                  aria-label={label} title={label} onClick={() => setPreference(value)}>
                  <Icon />
                </Button>
              ))}
            </ButtonGroup>
```

**Now look at the flash.** Choose **Dark**, reload: white, then dark (Performance
→ record a reload if it is too fast). Every load, and no React code can move it.

**D. `index.html` — `TODO(lab-3.4)`**

```html
    <!-- Runs BEFORE the stylesheet applies and before React exists: same key as ThemeProvider, 'system' resolved
         against the OS, data-bs-theme set — so the first paint is right. Plain ES5: not bundled, not type-checked. -->
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

The key is a literal in two places — `index.html` cannot import
`THEME_STORAGE_KEY`. That is the price of running before the bundle.

**E. `src/index.css` and `src/components/PriceTag.tsx` — `TODO(lab-3.5)`**

```css
/* Theme tokens. Bootstrap themes itself from --bs-* custom properties set on [data-bs-theme]; ours sit beside them. */
:root,
[data-bs-theme='light'] {
  --shopscope-accent: #b02a5b;
}

[data-bs-theme='dark'] {
  --shopscope-accent: #f28ab5;
  /* One BOOTSTRAP variable overridden: everything that reads --bs-body-bg (page, cards, modals, offcanvas) goes deeper. */
  --bs-body-bg: #12161c;
  --bs-body-bg-rgb: 18, 22, 28;
}

/* One utility of our own, named the way Bootstrap names its own. */
.text-accent {
  color: var(--shopscope-accent);
}
```

```tsx
// PriceTag — text-success → text-accent on the "% off" span:
          <span className="text-accent small fw-medium">{Math.round(discountPercentage)}% off</span>
```

`index.css` is imported *after* `bootstrap.min.css` in `main.tsx`: same
selector, same specificity, later wins — the only reason the override takes.

### Verify

1. **System.** Click the half-circle, then Rendering → *Emulate
   prefers-color-scheme: dark*: dark **without a reload** — the subscription.
   Choose **Dark** explicitly and emulate light: stays dark — a choice beats
   the OS.
2. **Persisted, no flash.** Application → Local Storage: `shopscope.theme =
   "dark"`. Reload: dark from the first frame, and `<html>` already has the
   attribute if you pause on `main.tsx`'s first line. Comment the script out,
   reload: the white frame is back. Uncomment.
3. **Tokens.** Inspect a "% off": `var(--shopscope-accent)` → `rgb(176, 42,
   91)`; in dark, `rgb(242, 138, 181)`. Inspect `<body>` in dark:
   `rgb(18, 22, 28)` from `index.css`, Bootstrap's `#212529` struck through
   beneath. The Tailwind card on `/about` flipped its `tw:dark:` colours from
   the same attribute.

### Watch out

**Two states for one fact.** `[theme, setTheme]` *and* `[preference,
setPreference]` disagree the first time the OS changes. Store the preference;
derive the theme.

**`setState` in `useEffect` to read `matchMedia`.** The linter refuses it and
it renders once with the wrong value. `useSyncExternalStore`.

**The script after the stylesheet, or `defer`/`type="module"`.** It runs after
first paint and the flash returns. Synchronous, in `<head>`.

### Challenge (2 min)

Rewrite `src/hooks/useReducedMotion.ts` on `useSyncExternalStore` — it gets
shorter. What does the `prefersReducedMotion()` helper for event handlers tell
you about why the hook exists at all?

### In the real world

Every themed product ships this trio: a preference with `'system'`, a storage
key, a blocking script — `next-themes` is 300 lines of it. Bootstrap, Tailwind
(`@custom-variant dark`), Radix Colors and shadcn/ui all theme through custom
properties on an attribute; the next design system's `[data-theme]` is the
same idea.

---

## Lab 4 — Responsive layout (15 min)

### Problem

Resize to 540 px: one card per row, each a tall tower with a 160 px image and
a paragraph of white space beside nothing. Resize to 1500 px: four cards with
room for a fifth. On a phone the toolbar wraps its three controls into an
awkward stair. Bootstrap has the answers; the grid has been using four of its
six breakpoints since Demo 2, and `Stack` cannot say "vertical until md".

### Concept

**Mobile-first means the unprefixed value is the phone.** `xs={1} lg={3}`
reads: one column from zero, three from 992 px *up*; `sm`, `md` inherit the
value below them. Every Bootstrap responsive utility works the same way —
`flex-md-row` is "row from md up", and what you write *without* a prefix is
the small-screen default, not an override.

**Where the library stops.** `Row`/`Col` take a value per breakpoint;
`Stack`'s `gap` does, its `direction` does not (`StackProps`: `direction?:
'horizontal' | 'vertical'`, no object). Then you use the utility the component
is made of — a vertical `Stack` *is* `d-flex flex-column`, so `flex-md-row`
turns it at md. And there is no `w-md-50`: a max-width that applies only from
md is a **media query**, and a media query lives in a stylesheet — the first
honest CSS Module in the app proper.

**Container queries are media queries for components.** `@media` asks how
wide the *viewport* is; a card does not know whether it is one of five or
alone in a sidebar. `container-type: inline-size` on a wrapper makes it a
container, and `@container (min-width: 440px)` asks how wide *that* is — the
same component, correct everywhere. One rule: a container cannot query itself,
so the grid cell is the container and the card is what changes.

### Steps

**A. `src/components/ProductGrid.tsx` and `Skeletons.tsx` — `TODO(lab-4.1)`**

```tsx
import { Col, Row, type RowProps } from 'react-bootstrap';

/** The six breakpoints, typed from Row's own props — `xxl: 5` is fine, `xxxl` is a compile error. */
type GridColumns = Pick<RowProps, 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'>;

// MOBILE-FIRST: `xs` is the default, each larger key overrides from that width UP; a key you leave out inherits the one below.
// Bootstrap ships row-cols-*-1 to -6 and nothing above: `xxl: 8` type-checks and renders NOTHING. Six is the ceiling.
const COLUMNS: Record<Density, GridColumns> = {
  comfortable: { xs: 1, sm: 2, lg: 3, xl: 4, xxl: 5 },
  compact: { xs: 2, sm: 3, md: 4, lg: 5, xl: 6 },
};
// Skeletons: <Row xs={1} sm={2} lg={3} xl={4} xxl={5} …> — the same breakpoints as comfortable
```

**B. `src/components/ProductToolbar.tsx` and `ProductToolbar.module.css` — `TODO(lab-4.2)`**

```css
/* Two widths that apply only from md up. No utility says that; an inline style cannot carry a media query.
   768px is Bootstrap's md breakpoint — custom properties are not allowed inside @media, so the number is repeated. */
@media (min-width: 768px) {
  .search { max-width: 360px; }
  .sort { max-width: 200px; }
}
```

```tsx
import styles from './ProductToolbar.module.css';
// …
    // Stack's `gap` is responsive; its `direction` is not. So: a vertical Stack — the mobile default —
    // turned into a row from md up by the utility that Stack itself is made of.
    <Stack gap={2} className="mb-3 flex-md-row align-items-md-center">
      <InputGroup className={styles.search}>            {/* was style={{ maxWidth: 360 }} */}
// …
      <Form.Select aria-label="Sort products" className={styles.sort} /* …unchanged… */>
// …
      <Badge bg="secondary" className="align-self-start align-self-md-center ms-md-auto" role="status">
```

**C. `src/index.css`, `ProductGrid.tsx`, `ProductCard.tsx` — `TODO(lab-4.3)`**

```css
/* The product card lays itself out by ITS width, not the viewport's. The grid cell is the container. */
.product-cell { container-type: inline-size; }

@container (min-width: 440px) {
  .product-card { flex-direction: row; }
  .product-card__media { flex: 0 0 40%; }
  .product-card__media .card-img-top { border-radius: var(--bs-card-inner-border-radius) 0 0 var(--bs-card-inner-border-radius); }
}
```

```tsx
// ProductGrid — the cell is the container:
        <Col key={product.id} className="product-cell">
// ProductCard — our names, next to Bootstrap's:
    <Card className={clsx('product-card h-100', (isOutOfStock || busy) && 'opacity-50')} aria-busy={busy}>
      <Link to={`/products/${product.id}`} aria-hidden="true" tabIndex={-1} className="product-card__media">
```

`.product-card { flex-direction: row }` beats Bootstrap's `.card {
flex-direction: column }` for one reason only: same specificity, later file.

### Verify

1. Drag `/products` from 400 to 1500 px: 1 → 2 → 3 → 4 → 5 columns;
   **Compact**: 2 → 3 → 4 → 5 → 6. Set `xxl: 8`: still 6 — `row-cols-xxl-8`
   is in the DOM with no rule behind it. Put it back.
2. At 540 px the single card is **image left, text right** — the cell is 516 px
   wide. At 768 px, two cells of ~350 px: image on top. The viewport got
   *wider* and the card *narrower*; only a container query can say that.
3. At 375 px the toolbar is a column, search full width; from 768 px one row,
   search capped at 360 px, the count on the right.

### Watch out

**Inline `maxWidth` and a media query fighting.** Inline wins. The two
`style={{ maxWidth }}` had to *go*, not be joined by a class.

**`container-type` on the card.** `@container` never matches the container
itself — the cell is the container, the card is what changes.

### In the real world

Container queries have shipped everywhere since 2023 and are replacing the
`isMobile` prop half the React components in the wild still take.
`Pick<RowProps, …>` — typing config from the library's own props — keeps a
wrapper honest when the library updates.

---

## Lab 5 — Styled vs headless libraries (15 min)

### Problem

`ConfirmDialog` is React Bootstrap's `Modal` with two buttons. Escape, the
focus trap, focus return, the backdrop, the fade, the radius — all the
library's. That is the deal with a *styled* library: behaviour and look
together, and you can leave neither. What would keeping only the behaviour cost?

### Concept

**A styled library ships behaviour and appearance in one package; a headless
one ships behaviour and leaves appearance to you.**

| | React Bootstrap, MUI, Chakra | Radix Primitives, Base UI, React Aria, Headless UI | shadcn/ui |
|---|---|---|---|
| Behaviour (focus, keyboard, ARIA) | included | included — that is *all* that is included | Radix's |
| Appearance | included; override with props, `sx`, CSS variables | none — bring Tailwind, CSS Modules, anything | Tailwind, **copied into your repo** |
| Install | a dependency | a dependency | a CLI that writes `components/ui/button.tsx` |
| Fit to a design system | fight the defaults | exact | exact, and you own the code |
| Time to first screen | fastest | slowest | fast |

**Headless means the hard part is done and the visible part is yours.** A
dialog's hard part is the top layer, the focus trap, Escape, focus
restoration, `::backdrop` — not the border radius. In 2026 the browser ships
that as `<dialog>.showModal()`, so a headless dialog is forty lines of React
glue around a native element plus a stylesheet — what Radix's `Dialog` was
before `<dialog>` was good enough, and what Base UI's is now.

**How the ShopCrew sessions chose.** Tailwind + shadcn/ui: a design that is not
Bootstrap's, component source in the repo, Radix behaviour underneath. This
track chose React Bootstrap because fifteen demos were about React, not CSS.
Both are right; the question is whether the design is yours or the framework's.

### Steps

**A. `src/components/ConfirmDialog.headless.tsx` and `ConfirmDialog.module.css` — `TODO(lab-5.1)`**

```tsx
import { useEffect, useId, useRef, type MouseEvent } from 'react';
import { Button } from 'react-bootstrap';
import type { ConfirmDialogProps } from './ConfirmDialog';   // the SAME props: the contract is the props, the library is a detail
import styles from './ConfirmDialog.module.css';

export function ConfirmDialogHeadless({ show, title, body, confirmLabel = 'Confirm', variant = 'danger', busy = false, onConfirm, onCancel }: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  // Declarative in, imperative out: `show` is a prop; the DOM's open state is a method call. This effect is the bridge.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (show && !dialog.open) dialog.showModal(); // NOT show(): only showModal() gives the top layer, the focus trap and Escape
    else if (!show && dialog.open) dialog.close();
  }, [show]);

  // Padding is 0, so a click whose target is the <dialog> itself landed on the ::backdrop.
  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget && !busy) onCancel();
  }

  return (
    // onCancel = Escape (preventDefault keeps it open while busy). onClose fires after ANY close, ours included — hence the `show` guard.
    <dialog ref={dialogRef} className={styles.dialog} aria-labelledby={titleId}
      onCancel={(event) => { if (busy) event.preventDefault(); }}
      onClose={() => { if (show) onCancel(); }}
      onClick={handleBackdropClick}>
      <div className="d-flex align-items-center justify-content-between gap-3 border-bottom px-3 py-2">
        <h2 id={titleId} className="h6 mb-0">{title}</h2>
        <Button variant="link" size="sm" className="text-body text-decoration-none" aria-label="Close" onClick={onCancel} disabled={busy}>✕</Button>
      </div>
      <div className="p-3">{body}</div>
      {/* …a footer div with the Cancel and {confirmLabel} Buttons, both disabled={busy}… */}
    </dialog>
  );
}
```

```css
/* The headless dialog's LOOK — the part the browser leaves to us. A Module: `::backdrop` and `[open]` have no utility class. */
.dialog {
  width: min(500px, calc(100% - 1rem));
  padding: 0;
  border: 1px solid var(--bs-border-color-translucent);
  border-radius: var(--bs-border-radius-lg);
  background: var(--bs-body-bg);       /* Bootstrap's variables: the box follows data-bs-theme like everything else */
  color: var(--bs-body-color);
  box-shadow: var(--bs-box-shadow);
}
.dialog::backdrop { background: rgba(0, 0, 0, 0.5); }   /* the dimmed page — only reachable from CSS */
.dialog[open] { animation: dialog-in 0.15s ease-out; }   /* + the @keyframes, switched off under prefers-reduced-motion */
```

**B. `src/routes/ProductsPage.tsx` — `TODO(lab-5.2)`**

Change the import and the tag — every prop identical — and run Verify 1.
Then **change it back** and delete the marker: the app keeps the styled one
because it matches the other five modals, and the headless one earns its keep
on the About page as the comparison.

**C. `src/components/styling/DialogComparison.tsx` — `TODO(lab-5.3)`**

```tsx
type Open = 'styled' | 'headless' | null;

export function DialogComparison() {
  const [open, setOpen] = useState<Open>(null);
  const [outcome, setOutcome] = useState<string | null>(null);
  const close = () => setOpen(null);

  return (
    <section aria-labelledby="dialogs-heading" className="mt-4">
      <h2 id="dialogs-heading" className="h5">Styled vs headless</h2>
      {/* two Buttons: setOpen('styled') / setOpen('headless'); a role="status" span showing `outcome` */}
      <ConfirmDialog show={open === 'styled'} title="Styled: React Bootstrap Modal" variant="primary" body="…"
        onConfirm={() => { setOutcome('confirmed (styled)'); close(); }}
        onCancel={() => { setOutcome('cancelled (styled)'); close(); }} />
      <ConfirmDialogHeadless show={open === 'headless'} title="Headless: native <dialog>" variant="primary" body="…"
        onConfirm={() => { setOutcome('confirmed (headless)'); close(); }}
        onCancel={() => { setOutcome('cancelled (headless)'); close(); }} />
    </section>
  );
}
```

Same props, two implementations, one page — the comparison the Concept table
makes in prose, made in pixels.

### Verify

1. **Headless in place.** As `emilys`, click a bin: the native dialog opens,
   focus on **Cancel**; Escape closes it and focus returns to the bin; a click
   on the dark area closes it; Tab cycles inside. Confirm: the card dims and
   the toast fires, as before. Elements: `<dialog open class="_dialog_…">` —
   in the top layer, no portal needed.
2. **The look is yours.** Change `.dialog::backdrop` to `rgba(176, 42, 91,
   .4)`. To do that to the React Bootstrap one you would override
   `.modal-backdrop` globally. Put it back, swap `ProductsPage` back, then
   `/about`: both dialogs, and the status line says which one you used.

### Watch out

**`dialog.show()` instead of `showModal()`.** Opens inline: no top layer, no
backdrop, no focus trap, Escape does nothing. The one-word difference is the
whole feature.

**Reporting your own close.** Without the `if (show)` guard, `close()` in the
effect fires `onClose`, which calls `onCancel`, which the parent already did.
Harmless here (setting `null` twice), a double toast elsewhere.

### In the real world

Radix Dialog, Base UI Dialog and React Aria's `useDialog` are this file with
more edge cases (nesting, scroll locking, iOS). "We use shadcn" means Radix
behaviour, Tailwind appearance, source in the repo; "we use MUI" means both in
`node_modules`, overridden through `sx`. You can now read either codebase.

---

## Wrap-up — what you can now do

- [x] Style a component five ways and say, for each, who else its rules can touch — and read the class attribute in DevTools to tell which way a codebase chose
- [x] Write a `CSSProperties` object, know that a bare number is pixels, and name the two things inline style can never do
- [x] Import a CSS Module as an object, explain the hash, and catch the typo the type system cannot
- [x] Configure Tailwind v4 beside another framework — no preflight, a prefix, a narrow source, a custom `dark:` variant — and explain why unlayered CSS wins
- [x] Replace every template-string class with `clsx`, and every recurring tone/size axis with a `cva` map typed by `VariantProps`
- [x] Theme through custom properties on `data-bs-theme`, add your own tokens, follow the OS with `useSyncExternalStore`, persist, and kill the flash with an inline script
- [x] Lay out mobile-first with `Row`/`Col` breakpoints and responsive utilities, reach for a CSS Module when no utility exists, and write a container query
- [x] Build a headless dialog on `<dialog>`, compare styled vs headless libraries, and argue for the one your app keeps

**The styling policy** — what replaced "no custom CSS", and what the finished
app actually contains:

| Need | Use | In ShopScope today |
|---|---|---|
| A component, a layout, a spacing | React Bootstrap component or utility class | everywhere — still the default |
| A class that depends on a condition | `clsx` | `ProductCard`, `PriceTag` |
| Recurring tone / size / shape axes, or classes on a non-Bootstrap element | a `cva` map in `src/lib/variants.ts` | `StockBadge`, the three button-shaped `<Link>`s |
| A rule one component needs that no utility expresses (media query, `::backdrop`, `[open]`) | a CSS Module next to the component | `ProductToolbar.module.css`, `ConfirmDialog.module.css` |
| A colour, a token, a Bootstrap variable override, a rule that spans components | `src/index.css` | theme tokens, `.text-accent`, the card's container query |
| A value that comes from data | inline `style` | the card image's height, the histogram tooltip's position |
| Tailwind | **only** `PriceTag.tailwind.tsx`, via `src/tailwind.css` | kept configured for the showcase — 16 utilities, 1 KB, loads with `/about` only |
| Plain global CSS with hand-named classes | not for new code | `pricetag.css` stays as the showcase's way 1 |

Tailwind stays configured because it costs 1 KB on one page and the showcase
is where participants can compare the two frameworks on the same pixels;
Demo 18 adds two more plugins to `vite.config.ts` anyway. Bootstrap stays the
framework because the other twenty-two demos are built on it — and now the
policy says so in writing.

## Next demo

**Demo 17 — Component Patterns, Portals & TypeScript Consolidation.**
Compound components, render props and slots named properly, a headless
component of our own, `createPortal` for what must escape `overflow: hidden`,
`react-error-boundary` — and a TypeScript pass over everything the track has
typed: generics, discriminated unions, `satisfies`, and the prop types you have
been reading in `react-bootstrap`'s `.d.ts` files.

---

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `Cannot find module './PriceTag.module.css' or its corresponding type declarations` | `tsconfig.app.json` is missing `"types": ["vite/client"]`, or the file is not named `*.module.css`. The suffix is the switch. |
| Headings lose their margins / buttons lose borders after adding Tailwind | `@import 'tailwindcss'` pulled in preflight. Import `theme.css` and `utilities.css` by hand, as in Lab 1 D. |
| A `tw:` class has no effect | The class is built at runtime (`tw:text-${x}`), or the file is not in `@source`, or Bootstrap has a class of the same name winning from outside the layer. Full names, one `@source` per file that uses Tailwind. |
| `Type '"lwo"' is not assignable to type '"ok" \| "low" \| "out" \| …'` | A variant value that is not in the map. Fix the spelling — or add the row to `variants.ts`, once, if it is a new tone. |
| `Property 'toggleTheme' does not exist on type 'ThemeContextValue'` | The header still destructures Demo 12's API. `{ preference, setPreference }` and the `THEME_OPTIONS` group. |
| Theme flashes white on reload | The inline script is missing, is below the stylesheet, or has `type="module"`/`defer`. Synchronous, in `<head>`. |
| Theme resets on reload | `setPreference` does not write `localStorage`, or the key differs from `index.html`'s `shopscope.theme`. |
| System theme does not follow the OS until reload | `getSystemPrefersDark` is read in `useState` with no subscription. `useSyncExternalStore(subscribe, getSnapshot)`. |
| Dark `--bs-body-bg` override ignored | `index.css` is imported before `bootstrap.min.css` in `main.tsx`, or the selector is `:root` instead of `[data-bs-theme='dark']`. |
| Card never goes to the row layout | `container-type` is on the card instead of the cell — a container cannot query itself — or the cell is under 440 px. |
| Native dialog opens with no backdrop and Escape does nothing | `dialog.show()` — use `showModal()`. |
