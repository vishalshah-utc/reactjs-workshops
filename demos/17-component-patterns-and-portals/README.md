# Demo 17 — Component Patterns, Portals & TypeScript Consolidation

**Demo guide** · ~130 minutes · the shapes a component API can take, when each is worth it — and the TypeScript that keeps every shape honest

---

## Where you are starting from

The starter is **Demo 16, finished**: ShopScope with a written styling policy
— React Bootstrap first, `clsx`, `cva` maps in `src/lib/variants.ts`, CSS
Modules where utilities cannot express a rule, `index.css` for tokens and the
card's container query, a three-way theme, and a styled-vs-headless dialog
comparison on `/about`. Every component in it takes props and renders. Today
is about the components that need *more*: a shared selection, two owners for
one value, an element chosen by the caller, a type chosen by the data, a DOM
position outside the tree, a failure that must stay local.

New stubs: `src/components/tabs/Tabs.tsx`, `src/hooks/useControllableState.ts`,
`src/components/Text.tsx`, `LinkOrButton.tsx`, `DataTable.tsx`,
`fields/SelectField.tsx`, `dialog/Dialog.tsx`, `src/hooks/useFocusTrap.ts`,
`WidgetBoundary.tsx`, `src/hooks/useFetch.ts`, `useAuthUser.ts`. And a folder
that is *not* a stub — `src/legacy/` holds a working class-based `withAuth`
HOC and a `<Fetch>` render prop, already wired into the detail page through
`EditProductLink.tsx` and `RelatedProducts.tsx`, written the way you will find
them in a codebase from 2018. Lab 6 reads them, then replaces them.

New dependency: **`react-error-boundary@6.1.5`** — in `package.json` since
Demo 15's Part 6 set, already installed, imported for the first time in Lab 5.

## What you ship today

A **compound `<Tabs>`** on the detail page (Details / Reviews / Shipping) with
the WAI-ARIA keyboard pattern and `useId` wiring. A `Pager` and a
`CategoryStrip` that work **controlled or uncontrolled** through one
`useControllableState`. A polymorphic **`<Text as="h1">`**, a generic
**`<DataTable<T>>`** on the team page, a **`<SelectField<T>>`** that refuses a
mismatched `onChange` at compile time, a **`LinkOrButton`** whose `variant`
decides which other props exist. Your own **`createPortal` dialog** — focus
trap, Escape, `aria-modal`, focus restore — built, proved, compared with Demo
16's native `<dialog>`, then React Bootstrap's `Modal` put back for the shipped
`ConfirmDialog` on purpose. **`react-error-boundary`** around the cart body and
the uploader with a "Try again" that recovers and a dev-only button that breaks
them. And a render prop and an HOC from `src/legacy/` converted to hooks — the
files kept, `@deprecated`, because Demo 23 reads code of that age too.

By the end you will be able to answer, without hesitating:

- When a compound component beats an `items` array, and what context it hides
- What the `onChange` contract is, how a component supports `value` *and* `defaultValue`, and why it must never switch mode
- How to type an `as` prop so `href` on an `<h2>` is a compile error — and why `Omit` over a union needs help
- `ReactNode` vs `ReactElement` vs `JSX.Element`; `ComponentProps` vs `ComponentPropsWithoutRef`; where `PropsWithChildren` fits
- How a generic component infers `T` from its data, why `NoInfer` exists, and what `satisfies` keeps that an annotation loses
- Why an event fired inside a portal reaches a React parent that is not its DOM ancestor
- What an error boundary catches, what it does not, why it is still a class, and where to put one
- How to read an HOC and a render prop in an inherited codebase and rewrite each as a hook

> **A component API is a contract about who owns what.** Who owns the
> selection (compound: the root). The value (controllable: whoever passes
> `value`). The element (polymorphic: the caller). The type (generic: the
> data). The DOM position (portal: nobody you can see). The failure (boundary:
> the nearest one). 📖 [study-notes 16](../../study-notes/16-advanced-patterns/)
> is the theory for Labs 1, 2, 4, 5 and 6; [study-notes 17](../../study-notes/17-typescript-with-react/)
> for Lab 3.

---

## Before the demo (5 minutes)

```
https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/17-component-patterns-and-portals/starter
```

> ⚠️ Click once, bookmark the `stackblitz.com/edit/…` URL.

Locally: `cd demos/17-component-patterns-and-portals/starter && npm install && npm run dev`.

Sign in as `emilys` / `emilyspass` (admin) before Lab 3 — the team page and
the edit link need the role. DevTools panes for today: **Elements** (where a
portal's DOM lands), **Accessibility** (tab roles and `aria-*`), **Console**
(the boundary's log line), and React DevTools **Components** (to see
`withAuth(EditLink)` as an extra layer).

---

## The cold open

Open `src/routes/ProductDetailPage.tsx`. It wants tabs: Details, Reviews,
Shipping. Sketch the obvious API:

```tsx
<Tabs items={[{ label: 'Details', content: <Details /> }, { label: 'Reviews', content: <Reviews /> }]} />
```

Add an icon to one tab: `icon?: ReactNode` on the item. Disable another:
`disabled?: boolean`. Show a count on Reviews: `badge?: ReactNode`. Make
Shipping lazy: `content` becomes `ReactNode | (() => ReactNode)` and the
component grows a `typeof` check. Tabs on the right for one page: `align?`.
Five requirements, five props, a `switch` for each — and the next one is
coming.

That is the props explosion: the *caller* knows what a tab should look like
and the *component* is asked to guess. The alternative is to let the caller
write JSX — `<Tabs.Tab value="reviews"><Star /> Reviews <Badge>3</Badge></Tabs.Tab>`
— and have the parts agree among themselves which one is selected. That
agreement is Lab 1; Labs 2–6 apply the same move to five other questions.

---

## Lab 1 — Compound components (25 min)

### Problem

The detail page shows description, tags, SKU, warranty, shipping and returns
in one column, and DummyJSON's three reviews per product not at all. It wants
tabs. An `items` prop cannot hold an icon, a badge, a disabled state and the
page's own markup without becoming a second component API.

### Concept

**A compound component is several components sharing one piece of state
through a private context, so the caller composes them like HTML.** `<select>`
and `<option>` are the model: the option never receives "am I selected" as a
prop; it asks its parent. `<Tabs>` owns `value`; `Tabs.Tab` reads it and calls
`select()` when clicked; `Tabs.Panel` reads it to know whether to show. The
caller writes the parts in any order with any content and never wires them
(📖 study-notes 16 §1).

**The context is private.** Not exported, so its shape is yours to change. The
parts throw a clear error outside the root — `<Tabs.Tab> must be rendered
inside <Tabs>` — which is a compound component's one rule.

**`useId` wires the ARIA.** A tab needs `aria-controls` pointing at its panel's
`id`; the panel needs `aria-labelledby` pointing back. `useId()` gives one id
per instance, unique on the page and identical on server and client, and the
caller never passes an `id` prop (📖 study-notes 16 §10).

**Keyboard: one Tab stop, arrows within.** The WAI-ARIA tabs pattern: the
selected tab has `tabIndex={0}`, the others `-1`, and ArrowLeft / ArrowRight /
Home / End move *and select*. A "roving tabindex", handled once on the list.

**When it is worth it.** When the parts vary independently and the caller owns
the markup: tabs, accordions, menus, field + label + error. Not for a component
whose three props always appear together.

**And TypeScript says:** `Tabs.List = TabsList` after `function Tabs()` is an
*expando* — TypeScript lets you add typed properties to a function declaration
in the same scope. `<Tabs.Lsit>` is an error.

### Steps

**A. `src/components/tabs/Tabs.tsx` — `TODO(lab-1.1)`**

```tsx
import { createContext, useContext, useId, useMemo, useState, type ReactNode } from 'react';
import clsx from 'clsx';

/** Shared IMPLICITLY through context: the selection, how to change it, one id prefix. Private — not exported. */
interface TabsContextValue { value: string; select: (value: string) => void; baseId: string; }
const TabsContext = createContext<TabsContextValue | undefined>(undefined);

function useTabsContext(part: string): TabsContextValue {
  const context = useContext(TabsContext);
  if (context === undefined) throw new Error(`<Tabs.${part}> must be rendered inside <Tabs>.`);
  return context;
}
const tabId = (baseId: string, value: string) => `${baseId}-tab-${value}`;
const panelId = (baseId: string, value: string) => `${baseId}-panel-${value}`;

interface TabsProps { value?: string; defaultValue?: string; onValueChange?: (value: string) => void; className?: string; children: ReactNode; }

export function Tabs({ defaultValue = '', onValueChange, className, children }: TabsProps) {
  const [selected, setSelected] = useState(defaultValue);   // uncontrolled only, today — Lab 2 adds `value`
  const baseId = useId();                                   // unique per instance, stable across renders, same on server and client
  const select = (value: string) => { setSelected(value); onValueChange?.(value); };
  const context = useMemo(() => ({ value: selected, select, baseId }), [selected, baseId]); // eslint will grumble about `select` — Lab 2 fixes it
  return <TabsContext value={context}><div className={className}>{children}</div></TabsContext>;
}

// TabsList: <div role="tablist" aria-label className="nav nav-tabs mb-3"> — Bootstrap's CLASSES on our elements, not <Nav>, whose own key handling would fight ours.

function TabsTab({ value, disabled = false, children }: { value: string; disabled?: boolean; children: ReactNode }) {
  const { value: selected, select, baseId } = useTabsContext('Tab');   // it ASKS — never receives "selected" as a prop
  const isSelected = selected === value;
  return (
    <button type="button" role="tab" id={tabId(baseId, value)} aria-selected={isSelected} aria-controls={panelId(baseId, value)}
      tabIndex={isSelected ? 0 : -1} disabled={disabled} className={clsx('nav-link', isSelected && 'active')} onClick={() => select(value)}>
      {children}
    </button>
  );
}

// TabsPanel: useTabsContext('Panel'), then <div role="tabpanel" id={panelId(…)} aria-labelledby={tabId(…)} hidden={selected !== value} tabIndex={0}>
// — in the DOM but `hidden`: the id exists for aria-controls, and the panel's state survives a switch.

Tabs.List = TabsList;   // EXPANDO: typed properties on a function declaration. One import; the JSX reads <Tabs.List>.
Tabs.Tab = TabsTab;
Tabs.Panel = TabsPanel;
```

The line that matters is `useTabsContext('Tab')`: the tab never receives its
selected state. That is what lets the caller put anything between `<Tabs>` and
`<Tabs.Tab>` — a `<Row>`, a card, a conditional — without threading state
through it.

**B. `Tabs.tsx` — `TODO(lab-1.2)`**

```tsx
/** Where a key moves focus, given the focused tab's index. `undefined` → not our key. */
function nextTabIndex(key: string, index: number, count: number): number | undefined {
  switch (key) {
    case 'ArrowRight': return (index + 1) % count;
    case 'ArrowLeft':  return (index - 1 + count) % count;
    case 'Home':       return 0;
    case 'End':        return count - 1;
    default:           return undefined;
  }
}
// TabsList — ROVING TABINDEX, handled on the list, once:
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)'));
    const index = tabs.findIndex((tab) => tab === document.activeElement);
    if (index === -1) return;
    const next = nextTabIndex(event.key, index, tabs.length);
    if (next === undefined) return;
    event.preventDefault();  // otherwise ArrowRight scrolls a wide list and End scrolls the page
    tabs[next].focus();
    tabs[next].click();      // "automatic activation": focusing selects — the button's own onClick does the rest
  }
  // …and onKeyDown={handleKeyDown} on the tablist div
```

`tabs[next].click()` rather than `select()`: the list does not know the tab's
`value` and does not need to. It drives the tab the way a user would.

**C. `src/types.ts` and `src/routes/ProductDetailPage.tsx` — `TODO(lab-1.3)`**

```ts
// types.ts — the detail-only fields (https://dummyjson.com/products/1):
  weight?: number;
  dimensions?: { width: number; height: number; depth: number };
  minimumOrderQuantity?: number;
  reviews?: Review[];
}
export interface Review { rating: number; comment: string; date: string; reviewerName: string; reviewerEmail: string; } // date is ISO — format at the edge
```

```tsx
// ProductDetailPage — `const reviews = product.reviews ?? [];` and a small ReviewList; then, where the tags and <dl> were:
                <Tabs defaultValue="details">
                  <Tabs.List aria-label="Product information">
                    <Tabs.Tab value="details">Details</Tabs.Tab>
                    {/* A badge, a disabled state — JSX inside the tab, not a prop on an items array. */}
                    <Tabs.Tab value="reviews" disabled={reviews.length === 0}>Reviews <Badge bg="secondary" pill>{reviews.length}</Badge></Tabs.Tab>
                    <Tabs.Tab value="shipping">Shipping &amp; returns</Tabs.Tab>
                  </Tabs.List>
                  <Tabs.Panel value="details">{/* description, tags, a <dl> of SKU / category / weight / dimensions */}</Tabs.Panel>
                  <Tabs.Panel value="reviews"><ReviewList reviews={reviews} /></Tabs.Panel>
                  <Tabs.Panel value="shipping">{/* a <dl> of shipping, availability, warranty, returns, minimum order */}</Tabs.Panel>
                </Tabs>
```

### Verify

1. `/products/1`: three Bootstrap tabs, **Details** active, `Reviews 3`. Click
   **Reviews**: three reviews with stars and dates. Elements: `<button role="tab"
   id="«r1»-tab-reviews" aria-selected="true" aria-controls="«r1»-panel-reviews"
   tabindex="0">`, the panel with the matching `id` and `aria-labelledby`, the
   other two panels `hidden`.
2. Press **Tab** from "Save": focus lands on the active tab; **Tab** again
   leaves the list — one stop. **ArrowRight** twice: Reviews, then Shipping,
   each selected as focus arrives. **End**, **Home**; **ArrowLeft** wraps. Every
   DummyJSON product has three reviews, so to see a disabled tab put `disabled`
   on **Shipping** for a moment: it greys out, the arrows skip it, Tab never
   lands on it. Remove it.
3. Put `<Tabs.Tab value="x">x</Tabs.Tab>` outside any `<Tabs>`: the console
   says `<Tabs.Tab> must be rendered inside <Tabs>.` Remove it.

### Watch out

**Handling keys on each tab.** Works until the focused tab is disabled or the
list re-orders. The *list* owns navigation; the tab owns only its click.

**Rendering `null` for inactive panels.** Then `aria-controls` points at a
missing id and a half-typed form vanishes on a switch. `hidden` keeps the DOM
honest; a `lazy` panel is a two-line addition once you need one.

**Exporting the context "for flexibility".** The moment a page reads it, its
shape is public API.

### In the real world

Radix, Base UI, React Aria and MUI ship tabs, menus and dialogs as compound
components; React Bootstrap's `Modal.Header` is the same idea. Their source is
this file with more edge cases — RTL arrows, vertical orientation — and a
context that is, still, private.

---

## Lab 2 — Controlled *and* uncontrolled (15 min)

### Problem

`Tabs` keeps its own selection; `Pager` and `CategoryStrip` demand a parent
that owns theirs. Each is right for its current caller and wrong for the next:
a `Pager` inside a self-contained widget wants to just work, a `Tabs` driven by
the URL wants to be told. An `<input>` supports both — `value` or
`defaultValue` — and a component that supports both writes the same fifteen
lines every time, with one branch wrong.

### Concept

**Controlled means the parent owns the value and the component only reports;
uncontrolled means the component owns it and the parent may listen.** The
`onChange` contract makes both work: it fires in *both* modes with the new
*value* — never an event, never a nullable key — so a parent can ignore it,
persist it, or take over by passing `value` (📖 study-notes 16 §4).

**The mode is decided by `value !== undefined`, once.** The DOM's rule too. A
component that flips mode mid-life has two sources of truth that were once
equal and now are not; the bug shows up as "it stopped updating" three screens
away. So the hook remembers the mode it started in and warns in development
when it changes.

**Write the logic once.** `useControllableState({ value, defaultValue,
onChange })` returns `[current, set]` like `useState`; `set` updates internal
state only when uncontrolled and always calls `onChange`. Radix's and Chakra's
`useControllableState` and Base UI's `useControlled` are this hook.

**The state-reducer idea.** Downshift's `stateReducer` prop lets the parent
*veto or alter* internal changes without owning the value — you will meet it
in autocomplete libraries.

**And TypeScript says:** `useControllableState<T>` infers `T` from
`defaultValue`, and `[T, (next: T) => void]` is a *tuple* — position 0 is a
`T`, position 1 a function; destructuring keeps both.

### Steps

**A. `src/hooks/useControllableState.ts` — `TODO(lab-2.1)`**

```ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { logger } from '../config/logger';

interface UseControllableStateOptions<T> {
  value: T | undefined;          // present → CONTROLLED
  defaultValue: T;               // read once, like useState's initial argument
  onChange?: (next: T) => void;  // fires in BOTH modes — the contract
}

export function useControllableState<T>({ value, defaultValue, onChange }: UseControllableStateOptions<T>): [T, (next: T) => void] {
  const [internal, setInternal] = useState(defaultValue);
  const isControlled = value !== undefined;

  // The mode we STARTED in — a ref, read in an EFFECT: `react-hooks/refs` refuses `.current` during render.
  const initialMode = useRef(isControlled);
  useEffect(() => {
    if (!import.meta.env.DEV || initialMode.current === isControlled) return;
    logger.warn(`[useControllableState] switched from ${initialMode.current ? 'controlled' : 'uncontrolled'} to ${isControlled ? 'controlled' : 'uncontrolled'}. Decide once.`);
    initialMode.current = isControlled;   // warn once per switch
  }, [isControlled]);

  const set = useCallback((next: T) => {
    if (!isControlled) setInternal(next);   // uncontrolled: we own it
    onChange?.(next);                       // both modes: the parent may listen
  }, [isControlled, onChange]);

  return [isControlled ? value : internal, set];
}
```

**B. `src/components/tabs/Tabs.tsx` and `src/components/Pager.tsx` — `TODO(lab-2.2)`**

```tsx
// Tabs — the useState, the hand-written select and the eslint grumble go:
  const [selected, select] = useControllableState({ value, defaultValue, onChange: onValueChange });
  const context = useMemo(() => ({ value: selected, select, baseId }), [selected, select, baseId]);
```

```tsx
// Pager — `page` becomes `value` | `defaultValue`; `onChange` becomes optional:
interface PagerProps { value?: number; defaultValue?: number; pageCount: number; onChange?: (page: number) => void; scrollTargetRef?: RefObject<HTMLElement | null>; }

export function Pager({ value, defaultValue = 0, pageCount, onChange, scrollTargetRef }: PagerProps) {
  const [page, setPage] = useControllableState({ value, defaultValue, onChange });   // BEFORE the early return — hooks first, always
  if (pageCount <= 1) return null;
  function go(next: number) {
    setPage(next);   // was onChange(next)
    // …scrollIntoView unchanged…
  }
  // …render unchanged: it reads `page`…
}
```

**C. `src/components/CategoryStrip.tsx` and `src/routes/ProductsPage.tsx` — `TODO(lab-2.3)`**

```tsx
// CategoryStrip — activeId/onSelect become value/defaultValue/onChange:
export function CategoryStrip({ categories, value, defaultValue = 'all', onChange }: CategoryStripProps) {
  const [activeId, setActiveId] = useControllableState({ value, defaultValue, onChange });
  return <Nav variant="pills" /* …unchanged… */ activeKey={activeId} onSelect={(key) => setActiveId(key ?? 'all')}>
// ProductsPage — the URL still owns both; only the prop names change:
      <CategoryStrip categories={categories} value={filters.category} onChange={(category) => { /* …unchanged… */ }} />
      <Pager value={filters.page} pageCount={pageCount} scrollTargetRef={gridRef} onChange={(page) => updateFilters({ page }, { replace: false, preventScrollReset: true })} />
```

### Verify

1. `/products`: paging and the pills behave exactly as before — the URL
   changes, Back undoes it. The components gained a mode; nothing moved.
2. Change the Pager to `defaultValue={0}` with no `value` and no `onChange`.
   **Next**: the label says *Page 2*, the URL does **not** change — the Pager
   owns its page. Refresh: page 1 again. Put it back.
3. Change it to `value={showChart ? filters.page : undefined}` and toggle
   **Prices**: the console warns `[useControllableState] switched from
   controlled to uncontrolled…`. Put it back. `/products/1`'s tabs are the
   app's one genuinely uncontrolled usage.

### Watch out

**`value ?? defaultValue` as the whole implementation.** Controlled works;
uncontrolled never updates, because nothing stores the change.

**Deciding the mode per render.** `value` toggling between a string and
`undefined` silently swaps owners. The ref remembers; the warning tells you.

**`onChange(event)`.** Then the parent knows it is a `<button>`, and a change
of markup is a breaking change. Values out, never events.

### In the real world

Every input-like component in a design system is controllable, and the
reviewer's first question on a new one is "does it support `defaultValue`?".
The URL-driven page passes `value`; the Storybook story passes nothing; both
must work.

---

## Lab 3 — Polymorphic and generic components (30 min)

### Problem

Three files hand-write `<h1 className="h3 mb-0">`; three choose between a
`<button>` and a router `<Link>` and dress each by hand; `TeamPage` is a
`<Table>` with five hard-coded columns and no sorting; `SelectField` hands back
a `string` that every caller casts to `SortKey`. Each is a component whose
*type* should come from the caller — the element, the shape, the row type, the
option type — and each currently guesses.

### Concept

**This is the TypeScript-with-React consolidation: the seven ideas the track
has used since Demo 1, named** (📖 study-notes 17 §2, §3, §6, §7, §10).

| You want to say | You write | Notes |
|---|---|---|
| "anything React can render" | `ReactNode` | string, number, element, array, `null`, boolean. **Content props — `children`, `label`, `footer` — are `ReactNode`.** |
| "a JSX element, specifically" | `ReactElement` | what `<Foo />` evaluates to; what `Field`'s render-prop `children` must return. `JSX.Element` is the same under the global namespace — prefer `ReactElement`. |
| "props plus children" | `PropsWithChildren<P>` | `P & { children?: ReactNode }`. |
| "every prop a `<button>` takes" | `ComponentProps<'button'>` | includes `ref`. **`ComponentPropsWithoutRef`** excludes it — use that unless you forward one. Works on components: `ComponentProps<typeof Link>`. |
| "the props depend on a kind" | a **discriminated union** | `{ variant: 'link'; to: string } \| { variant: 'button'; onClick }` — narrows on `props.variant`. `to?: never` says "must be absent". |
| "the type comes from the data" | a **generic component** `function DataTable<T>(props: DataTableProps<T>)` | `T` inferred from `rows`; `<DataTable<User> …>` pins it. A generic *arrow* in `.tsx` needs `<T,>(props) => …` — the comma stops the parser reading a JSX tag. Declarations never have the problem. |
| "check the shape, keep the literals" | `satisfies` | `{ admin: 'danger' } satisfies Record<Role, string>`: a missing role is an error, and the value stays `'danger'`, not `string`. An annotation would widen it. |

**Polymorphism — the `as` prop.** `<Text as="h2">` must accept what an `<h2>`
accepts and nothing an `<a>` accepts: `TextOwnProps<T> &
Omit<ComponentPropsWithoutRef<T>, keyof TextOwnProps<T>>` with `T extends
ElementType`. Two pitfalls hide there. **One:** `Omit` over a *union* keeps only
shared keys, so `Omit<ComponentPropsWithoutRef<'a' | 'button'>, …>` drops
`href`; a *distributive* `Omit` — `T extends unknown ? Omit<T, K> : never` —
applies it per member (📖 study-notes 16 §5). **Two:** spreading `{...rest}` onto
an element typed `T` cannot be checked for *all possible* `T`, so the variable
holding the element is typed plain `ElementType`. The one cast a polymorphic
component carries, on the inside.

**Generic inference has a direction.** `SelectField<T>` would infer `T` from
`options` *and* `value`. Given `Option<SortKey>[]` and a `string` value,
TypeScript reports nothing — it *widens* `T` to `string` so both fit.
`NoInfer<T>` (TypeScript 5.4) marks the positions that must not contribute:
`value?: NoInfer<T>` means "check against T, do not infer it".

**`keyof T | string` is just `string`.** A column `key` should autocomplete
`'email' | 'role' | …` yet also allow `'name'` for a computed column; the union
collapses. `Extract<keyof T, string> | (string & Record<never, never>)` keeps
the literals visible while admitting any string — the reason design systems'
column types look odd.

### Steps

**A. `src/components/Text.tsx`, `PageHeader.tsx`, `src/routes/ProductDetailPage.tsx` — `TODO(lab-3.1)`**

```tsx
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import clsx from 'clsx';

export type TextVariant = 'title' | 'subtitle' | 'eyebrow' | 'body' | 'muted' | 'mono';
const VARIANT_CLASS: Record<TextVariant, string> = { title: 'h3 mb-0', subtitle: 'h6 text-muted mb-0', eyebrow: 'text-muted small text-uppercase', body: 'mb-0', muted: 'text-muted mb-0', mono: 'font-monospace' };

/** Omit over a UNION keeps only shared keys. A conditional type DISTRIBUTES it over each member. */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

interface TextOwnProps<T extends ElementType> { as?: T; variant?: TextVariant; className?: string; children?: ReactNode; }

/** Ours, plus every prop the chosen element accepts, minus the ones we define — so className is declared once. */
export type TextProps<T extends ElementType> = TextOwnProps<T> & DistributiveOmit<ComponentPropsWithoutRef<T>, keyof TextOwnProps<T>>;

export function Text<T extends ElementType = 'p'>({ as, variant = 'body', className, ...rest }: TextProps<T>) {
  const Component: ElementType = as ?? 'p';   // the ONE cast: JSX needs a concrete type to check the spread
  return <Component className={clsx(VARIANT_CLASS[variant], className)} {...rest} />;
}
```

```tsx
// PageHeader — tabIndex is an <h1> prop, so it type-checks; `href` would not:
        <Text as="h1" variant="title" className="mb-1" tabIndex={-1}>{title}</Text>
        {description && <Text variant="muted">{description}</Text>}
// ProductDetailPage:
                    <Text as="div" variant="eyebrow">{product.brand ?? product.category}</Text>
                    <Text as="h1" variant="title">{product.title}</Text>
```

**B. `src/components/LinkOrButton.tsx`, `SiteHeader.tsx`, `CartDrawer.tsx` — `TODO(lab-3.2)`**

```tsx
interface CommonProps extends ButtonVariants { className?: string; children: ReactNode; 'aria-label'?: string; }

/** `variant` decides which OTHER props exist. `to?: never`: optional, and the only value it accepts is nothing. */
export type LinkOrButtonProps = CommonProps &
  (
    | { variant: 'link'; to: string; onClick?: MouseEventHandler<HTMLAnchorElement>; disabled?: never }
    | { variant: 'button'; to?: never; onClick: MouseEventHandler<HTMLButtonElement>; disabled?: boolean; type?: 'button' | 'submit' }
  );

export function LinkOrButton(props: LinkOrButtonProps) {
  const { tone, size, block, className, children, 'aria-label': ariaLabel } = props;   // destructure the SHARED fields…
  const classes = button({ tone, size, block, className });
  if (props.variant === 'link') {   // …but NARROW on props itself: here props.to is a string
    return <Link to={props.to} className={classes} onClick={props.onClick} aria-label={ariaLabel}>{children}</Link>;
  }
  return <button type={props.type ?? 'button'} className={classes} onClick={props.onClick} disabled={props.disabled} aria-label={ariaLabel}>{children}</button>;
}
```

```tsx
// SiteHeader — Sign up / Sign in (the `button` import goes; `Button` stays for the rest):
                <LinkOrButton variant="button" tone="outlineLight" size="sm" onClick={() => setShowSignup(true)}><PersonPlus className="me-1" />Sign up</LinkOrButton>
                <LinkOrButton variant="link" to="/login" tone="light" size="sm"><BoxArrowInRight className="me-1" />Sign in</LinkOrButton>
// CartDrawer:
            <LinkOrButton variant="link" to="/login?redirectTo=/products" block onClick={followLink}>Sign in to check out</LinkOrButton>
```

**C. `src/components/DataTable.tsx` and `src/routes/account/TeamPage.tsx` — `TODO(lab-3.3)`**

```tsx
export interface Column<T> {
  /** A property of T — WITH autocomplete — or any string for a computed column. `keyof T | string` would collapse to string. */
  key: Extract<keyof T, string> | (string & Record<never, never>);
  header: ReactNode;
  render?: (row: T) => ReactNode;            // absent → String(row[key])
  sortValue?: (row: T) => string | number;   // present → the header is a sort button
  className?: string;
  width?: number;
}
interface DataTableProps<T> { rows: readonly T[]; columns: readonly Column<T>[]; getRowKey: (row: T) => Key; caption: string; emptyMessage?: string; }
// T is anything — the table cannot guess which property identifies a row. The caller says.

export function DataTable<T>({ rows, columns, getRowKey, caption, emptyMessage = 'Nothing to show.' }: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const sorted = useMemo(() => { /* find the column; if it has sortValue, return [...rows].sort(…) — a COPY, never sort a prop in place */ }, [rows, columns, sort]);
  // toggleSort: asc → desc → off. Then a <Table> with a visually-hidden <caption>, a <th scope="col" aria-sort=…> per column (a <button>
  // inside when sortValue exists), a <tr key={getRowKey(row)}> per sorted row whose cells call column.render?.(row) ?? defaultCell(row, key).
}
```

```tsx
// TeamPage — the table as DATA:
// satisfies: a missing role is still an error, and the values stay 'danger' | 'warning' | 'secondary' — not string.
const ROLE_VARIANT = { admin: 'danger', moderator: 'warning', user: 'secondary' } satisfies Record<Role, string>;

// Every render and sortValue is checked against DirectoryUser — `row.compnay` is an error HERE — and the key literals survive.
const COLUMNS = [
  { key: 'image', header: '', width: 48, render: (row) => <Image src={row.image} roundedCircle width={32} height={32} alt="" /> },
  { key: 'name', header: 'Name', render: (row) => `${row.firstName} ${row.lastName}`, sortValue: (row) => `${row.lastName} ${row.firstName}` },
  { key: 'email', header: 'Email', className: 'text-muted', sortValue: (row) => row.email },
  // …company, role (a <Badge bg={ROLE_VARIANT[row.role]}>)…
] satisfies Column<DirectoryUser>[];

      {/* T inferred from rows: DirectoryUser. Nobody wrote <DataTable<DirectoryUser>>. */}
      <DataTable rows={users} columns={COLUMNS} getRowKey={(user) => user.id} caption="Team members, sortable by name, email, company and role" />
```

Look at `(row) =>` in `COLUMNS`: no annotation, yet `row` is a `DirectoryUser`.
`satisfies` provides the *contextual type* the way an annotation would — and
leaves the array's own type as the literal you wrote.

**D. `src/components/fields/SelectField.tsx`, `fields/index.tsx`, `ProductForm.tsx` — `TODO(lab-3.4)`**

Move `Option` from `index.tsx` into `FieldShell.tsx`, delete the `select`
section from `index.tsx`, and write:

```tsx
/** T is inferred from `options` ONLY. Without NoInfer, TypeScript would infer it from `value` too and widen to string. */
export interface SelectFieldProps<T extends string> extends BaseFieldProps, ControlRest {
  options: readonly Option<T>[];
  value?: NoInfer<T>;
  onChange?: (value: NoInfer<T>) => void;
  onBlur?: () => void;
  placeholder?: string;
}

/** A generic component in a .tsx file: a function DECLARATION is unambiguous (`<T,>(props) => …` is the arrow spelling). */
export function SelectField<T extends string>({ controlId, label, value, onChange, onBlur, options, error, hint, placeholder, disabled, ...rest }: SelectFieldProps<T>) {
  // …the same FieldShell + Form.Select as before, with ONE change:
        onChange={onChange ? (e) => onChange(e.target.value as T) : undefined}   // the <option>s were rendered FROM options, so the string IS one of T — the cast lives here, once
}
```

Re-export `SelectField`, `SelectFieldProps` and `Option` from `index.tsx` so
every import site is untouched. `ProductForm` and `SignupForm` compile unchanged: their options are `{ value:
string; label: string }[]`, so `T` is `string`. Delete the marker comment in
`ProductForm`. The generic shows at the *next* call site — Verify 3.

### Verify

1. **Same pixels.** `/products`: the heading is `<h1 class="h3 mb-0 mb-1">`;
   **Sign in** is `<a class="btn btn-light btn-sm">`, **Sign up** a `<button
   class="btn btn-outline-light btn-sm">`. `/account/team` as `emilys`: the same
   table, now with sortable headers — click **Name** three times: ascending,
   descending, off; the `<th>` carries `aria-sort`.
2. **Three deliberate compile errors.** Type each, read TypeScript, delete it:
   - `<Text as="h2" href="/products">A</Text>` → *Property 'href' does not exist
     on type 'IntrinsicAttributes & TextOwnProps<"h2"> & Omit<…HTMLHeadingElement…>'*.
     Change `as` to `"a"`: compiles.
   - `<LinkOrButton variant="link" tone="light" onClick={() => {}}>C</LinkOrButton>`
     → *Property 'to' is missing in type '{ …variant: "link"… }' but required in
     type '{ variant: "link"; to: string; … }'*. Add `to="/x"` and change
     `variant` to `"button"` → *Types of property 'to' are incompatible. Type
     'string' is not assignable to type 'undefined'* — that is `to?: never`.
   - In `COLUMNS`, `render: (row) => row.compnay?.title` → *Property 'compnay'
     does not exist on type 'DirectoryUser'. Did you mean 'company'?*
3. **The generic select.** In `ProductForm`, temporarily import `SORT_OPTIONS`
   from `./ProductToolbar` and `type SortKey` from `../lib/catalog`:
   - `<SelectField controlId="x" label="x" options={SORT_OPTIONS} value={initial('category') as string} />`
     → *Type 'string' is not assignable to type 'SortKey | undefined'*. Remove
     both `NoInfer`s in `SelectField.tsx`: it **compiles** — `T` widened to
     `string`. Put them back.
   - `<SelectField controlId="y" label="y" options={categoryOptions} onChange={(sort: SortKey) => console.log(sort)} />`
     → *Type '(sort: SortKey) => void' is not assignable to type '(value: string)
     => void'. … Type 'string' is not assignable to type 'SortKey'*.
   Delete both and the imports. (Pinning `T` by hand — `<SelectField<SortKey>>`
   over `categoryOptions` — checks the data against it and fails the same way.)

### Watch out

**`keyof T | string`.** Compiles, looks right, hover it: `string`. The `&
Record<never, never>` intersection is the fix, and its comment is mandatory.

**`Omit` on the polymorphic props without distribution.** Works for `as="h2"`;
then someone passes `as={Link}` and `to` is "not a known prop".

**Destructuring the discriminant.** `const { variant, to } = props; if (variant
=== 'link')` — `to` is still `string | undefined`. Narrow on `props.variant`,
read `props.to`.

### In the real world

Open `react-bootstrap`'s `Button.d.ts`: `BsPrefixRefForwardingComponent<'button',
ButtonProps>` is the polymorphic pattern with a ref. TanStack Table's
`ColumnDef<TData>` has the `keyof T` trick; Radix's `asChild` is polymorphism
through a child instead of an `as` prop. You have written the small version of
each.

---

## Lab 4 — Portals and an accessible dialog (30 min)

### Problem

`ConfirmDialog` is React Bootstrap's `Modal`. It renders at the end of
`<body>`, traps focus, closes on Escape, restores focus, locks scroll and says
"dialog" to a screen reader — and you have never seen any of that code. Demo 16
rebuilt it on a native `<dialog>` that gets the same for free. What does it
cost to do it *without* the browser's help, and why would you ever want to?

### Concept

**`createPortal(children, container)` renders children into a different DOM
node while keeping them in the same React tree.** The component is a child of
whoever rendered it — it receives context, re-renders with its parent, its
events bubble to its parent's handlers — but its DOM sits under `#dialog-root`,
a sibling of `#root`. That is how a dialog escapes an ancestor's `overflow:
hidden`, `transform` or `z-index` stacking context: it is not inside that
ancestor's DOM at all (📖 study-notes 16 §8).

**Events bubble through the React tree, not the DOM tree.** A `<div onClick>`
wrapping `<Dialog>` fires when you click inside the dialog, though in the DOM
the dialog is nowhere under that div — React listens at the root and
dispatches by its own tree. Convenient (a form around a portalled dropdown
still gets `onSubmit`) and surprising (a "click outside" handler on a parent
closes the dialog you clicked inside).

**What the browser gives `<dialog>`, you now write:**

| Behaviour | Native `<dialog>.showModal()` | Your `createPortal` dialog |
|---|---|---|
| Above everything, with a backdrop | the top layer, `::backdrop` | `#dialog-root`, Bootstrap's `.modal` z-index, a sibling `.modal-backdrop` |
| Focus trapped, moved in, restored; Escape | yes; `cancel` event | `useFocusTrap` (wrap Tab / Shift+Tab, `opener.focus()` on cleanup); a `keydown` listener |
| Announced as a dialog; page does not scroll | implicit role; the page still scrolls | `role="dialog" aria-modal aria-labelledby`; `body.style.overflow = 'hidden'`, restored |
| Nested dialogs, iOS scroll, `inert` on the rest | mostly | you have not written it |

**Why you adopt a headless library rather than hand-roll.** The last row.
Radix, Base UI and React Aria have solved nested dialogs, iOS scroll locking,
`aria-hidden` on the rest of the page, and focus restoration when the opener
has unmounted — tested against screen readers you do not own. Hand-rolling
once teaches you what to look for in their source; hand-rolling in production
means owning those bugs (📖 study-notes 16 §9). Demo 16's rule stands: styled
library first, headless when the design is yours, hand-rolled never — except
as an exercise, which is today.

**And TypeScript says:** `createPortal` returns a `ReactPortal`, a `ReactNode`
— a component may return it directly. `getElementById` is `HTMLElement | null`;
`getDialogRoot()` throws once, clearly, rather than passing `null` on.

### Steps

**A. `index.html` and `src/components/dialog/Dialog.tsx` — `TODO(lab-4.1)`**

```html
    <div id="root"></div>
    <!-- A SIBLING of #root: no page element's overflow, transform or z-index can clip what renders here. -->
    <div id="dialog-root"></div>
```

```tsx
import { useEffect, useId, useRef, type MouseEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CloseButton } from 'react-bootstrap';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export interface DialogProps { open: boolean; title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; } // footer: a slot — the dialog never learns what "confirm" means

function getDialogRoot(): HTMLElement {
  const root = document.getElementById('dialog-root');
  if (!root) throw new Error('Missing <div id="dialog-root"> in index.html.');
  return root;
}

export function Dialog({ open, title, onClose, children, footer }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useFocusTrap(panelRef, open);   // a no-op until Step B

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) { if (event.key === 'Escape') onClose(); }   // Escape, wherever focus is
    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;   // scroll lock — remember, then restore
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handleKeyDown); document.body.style.overflow = previousOverflow; };
  }, [open, onClose]);

  if (!open) return null;

  // .modal-dialog has pointer-events: none and .modal-content turns them back on — a click whose target IS the .modal wrapper missed the panel.
  function handleBackdropClick(event: MouseEvent<HTMLDivElement>) { if (event.target === event.currentTarget) onClose(); }

  // React tree: child of whoever rendered <Dialog>. DOM tree: child of #dialog-root. Context flows in; events bubble out — by the REACT tree.
  return createPortal(
    <>
      <div className="modal-backdrop show" />   {/* a SIBLING: opacity .5 on a parent would fade the panel too */}
      <div className="modal d-block" tabIndex={-1} onClick={handleBackdropClick}>
        <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className="modal-dialog modal-dialog-centered">
          {/* .modal-content: a .modal-header with <h2 id={titleId}> and <CloseButton onClick={onClose}>, .modal-body {children}, .modal-footer {footer} */}
        </div>
      </div>
    </>,
    getDialogRoot(),
  );
}
```

The classes are Bootstrap's own — the CSS is already on the page. Only the
*behaviour* is yours, exactly the split the table draws.

**B. `src/hooks/useFocusTrap.ts` — `TODO(lab-4.2)`**

```ts
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(containerRef: RefObject<HTMLElement | null>, active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    // Who had focus? Captured NOW, before we move it, so the cleanup can hand it back.
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusables = () => Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
    (focusables()[0] ?? container).focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) { event.preventDefault(); return; }
      const first = items[0], last = items[items.length - 1];
      // WRAP: Shift+Tab on the first → the last; Tab on the last → the first. Every other Tab is the browser's.
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }

    container.addEventListener('keydown', handleKeyDown);
    return () => { container.removeEventListener('keydown', handleKeyDown); opener?.focus(); };   // RESTORE — the most-forgotten step
  }, [containerRef, active]);
}
```

**C. `src/components/ConfirmDialog.tsx` — `TODO(lab-4.3)`**

Rebuild it over `Dialog` — same props; the contract is the props:

```tsx
export function ConfirmDialog({ show, title, body, confirmLabel = 'Confirm', variant = 'danger', busy = false, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Dialog open={show} title={title} onClose={onCancel}
      footer={<><Button variant="outline-secondary" onClick={onCancel} disabled={busy}>Cancel</Button><Button variant={variant} onClick={onConfirm} disabled={busy}>{confirmLabel}</Button></>}>
      {body}
    </Dialog>
  );
}
```

Run Verify 1 and 2. Then **put the `Modal` version back** and delete the
marker: the shipped `ConfirmDialog` stays on React Bootstrap because it matches
the other five modals, and because the table's last row is not a lab, it is a
product. Your `Dialog` earns its keep on the About page.

**D. `src/components/styling/DialogComparison.tsx` — `TODO(lab-4.4)`**

```tsx
type Open = 'styled' | 'headless' | 'portal' | null;
  const [bubbled, setBubbled] = useState(0);
  // …a third Button: setOpen('portal'); under the buttons a line "Clicks inside the portal dialog that bubbled to its React parent: {bubbled}"…
  // …after the two existing dialogs — a click handler on the REACT parent of the portal, not a DOM ancestor of it:
      <div onClick={() => setBubbled((n) => n + 1)}>
        <Dialog open={open === 'portal'} title="Hand-rolled: createPortal" onClose={() => { setOutcome('cancelled (portal)'); close(); }}
          footer={<>{/* Cancel and Confirm Buttons setting the outcome and closing */}</>}>
          Portal, role="dialog", aria-modal, Escape, backdrop click, focus trap, focus restore and a scroll lock — each written out. Click anywhere in here.
        </Dialog>
      </div>
```

### Verify

1. **Behaviour parity.** With `ConfirmDialog` on `Dialog`, as `emilys` click a
   bin on `/products`: the dialog opens, focus on the **✕** close button (the
   first focusable); Tab cycles ✕ → Cancel → Delete → ✕; Shift+Tab goes
   backwards; Escape closes it and focus is **back on the bin**; the page did
   not scroll while it was open; a click on the dark area closes it. Confirm:
   the card dims and the toast fires as before. Elements: the dialog's DOM is
   under `<div id="dialog-root">`, *after* `#root`.
2. **The trap is the hook.** Comment out `useFocusTrap(panelRef, open)`: open,
   Tab three times — focus leaves into the header behind. Close: focus lands on
   `<body>` (`document.activeElement` in the console). Uncomment; swap
   `ConfirmDialog` back to `Modal`.
3. **Bubbling.** `/about` → **Open createPortal dialog**. Click the body text
   three times, then **Confirm**: the counter reads **4** — every click inside
   a DOM subtree under `#dialog-root` reached an `onClick` on a `<div>` inside
   `#root`. Open the other two: Escape and focus return work identically; only
   one of the three has its behaviour in your `src/`.

### Watch out

**The backdrop as a parent.** `.modal-backdrop.show` is `opacity: .5`; a panel
inside it is half transparent. Two siblings, as Bootstrap does it.

**Capturing the opener too late.** `document.activeElement` *after* you have
focused the first button is that button. Capture first, move second.

**A "click outside" handler on an ancestor.** It fires for clicks inside the
portal — React tree, not DOM tree. Check `panelRef.current.contains(event.target)`.

### In the real world

React Bootstrap's `Modal`, MUI's `Dialog` and Radix's `Dialog.Portal` all do
what `Dialog.tsx` does, with thousands of lines for the rows the table calls
"mostly". Toasts, tooltips and dropdowns are portals for the same reason — "my
dropdown is clipped by the table's `overflow: auto`" means it is not one.

---

## Lab 5 — Component-level error boundaries (15 min)

### Problem

Imagine one cart line's render throwing — a `null` thumbnail, a price that is
`undefined` after an API change. Today that exception unwinds to the nearest
boundary, which is the **route's** (Demo 10): the whole `/products` page is
replaced because a widget in a side drawer failed. The uploader on `/account`
has the same blast radius.

### Concept

**An error boundary catches render errors in its subtree and renders a
fallback instead — and how far up it sits is how much of the screen a failure
takes with it.** Demo 10 put one per route: a loader or page throws, the
*route* is replaced. Today puts one per *widget*: the cart body throws, the
drawer shows an alert, the page stays (📖 study-notes 16 §7).

| Thrown from | Caught? | Instead |
|---|---|---|
| render, a child's render, `useMemo` | **yes** | — |
| an **event handler**; **async** (`await`, `setTimeout`, `.then`) | **no** — React does not own that call; the render is long over | `try/catch`, `showBoundary(error)` from `useErrorBoundary`, or a state machine like `requestStatusReducer` |
| the boundary itself; server rendering | no — the parent catches it; the request fails | keep fallbacks simple; framework-level handling |

**Why it is still a class.** A boundary needs `static getDerivedStateFromError`
(render the fallback *in the same pass*) and `componentDidCatch` (log it). No
hook exposes either, and React has said none will. `react-error-boundary`
ships the class so you never write it: `<ErrorBoundary>` with
`fallbackRender`, `resetKeys`, `onReset`, `onError`, and a `useErrorBoundary`
hook that lets handlers and async code *throw into* the nearest boundary.

**Recovery is the point.** A fallback that stops is a nicer white screen.
`resetErrorBoundary()` clears the boundary and re-renders the children;
`resetKeys` does the same when a value changes. A retry recovers only if the
*cause* is gone — `onReset` is where you clear the state that caused it.

**And TypeScript says:** `FallbackProps.error` is `unknown`, because anything
can be thrown. Narrow with `instanceof Error` before `.message`, as
`RootErrorBoundary` did in Demo 10.

### Steps

**A. `src/components/WidgetBoundary.tsx` — `TODO(lab-5.1)`**

```tsx
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';

interface WidgetBoundaryProps { name: string; children: ReactNode; resetKeys?: unknown[]; onReset?: () => void; }

/** The fallback receives the error (unknown) and the function that clears the boundary and re-renders the children. */
function WidgetFallback({ error, resetErrorBoundary, name }: FallbackProps & { name: string }) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <Alert variant="danger" className="d-flex align-items-start gap-2 mb-0">
      <div className="flex-grow-1"><div className="fw-semibold">The {name} hit a problem</div><div className="small">{message}</div></div>
      <Button size="sm" variant="outline-danger" onClick={resetErrorBoundary}><ArrowClockwise className="me-1" />Try again</Button>
    </Alert>
  );
}

export function WidgetBoundary({ name, children, resetKeys = [], onReset }: WidgetBoundaryProps) {
  return (
    <ErrorBoundary
      // A render prop — `FallbackComponent={(p) => …}` would be a new component TYPE every render and remount the fallback.
      fallbackRender={(props) => <WidgetFallback {...props} name={name} />}
      resetKeys={resetKeys}
      onReset={() => onReset?.()}
      onError={(error, info) => logger.error(`[boundary:${name}]`, error, info.componentStack ?? '')}
    >
      {children}
    </ErrorBoundary>
  );
}
```

**B. `src/components/CartDrawer.tsx` and `src/routes/account/ProfilePage.tsx` — `TODO(lab-5.2)`**

```tsx
// CartDrawer — everything inside Offcanvas.Body, wrapped. A line added or removed resets a broken boundary too:
        <WidgetBoundary name="cart" resetKeys={[lines.length]}>
          {/* …the alerts, the list, the subtotal and the checkout form, unchanged… */}
        </WidgetBoundary>
// ProfilePage — the uploader's `mt-4` moves onto a wrapper (drop it from Uploader's <Card>):
      {env.features.uploads && <div className="mt-4"><WidgetBoundary name="uploader"><Uploader /></WidgetBoundary></div>}
```

**C. `src/components/WidgetBoundary.tsx` — `TODO(lab-5.3)`**

```tsx
/** A component that throws WHILE RENDERING. Nothing else — a throw in an effect or a handler is not caught by a boundary. */
function Bomb(): never { throw new Error('Boom — a render error, thrown on purpose.'); }

export function WidgetBoundary({ name, children, resetKeys = [], onReset }: WidgetBoundaryProps) {
  const [broken, setBroken] = useState(false);
  return (
    <>
      {/* import.meta.env.DEV, not env.isDev, ON PURPOSE: the Vite constant is replaced by `false` at build time and the branch is
          dead code the bundler removes. A property read on the env object cannot be eliminated — the bomb would ship. */}
      {import.meta.env.DEV && <Button size="sm" variant="outline-warning" className="mb-2" onClick={() => setBroken(true)} disabled={broken}><Bug className="me-1" />Break this widget</Button>}
      <ErrorBoundary /* …as before, plus: */ resetKeys={[broken, ...resetKeys]} onReset={() => { setBroken(false); onReset?.(); }}>
        {broken && <Bomb />}   {/* the bomb's state is a reset key: "Try again" clears the boundary AND defuses it */}
        {children}
      </ErrorBoundary>
    </>
  );
}
```

`env.ts` is still the only place that reads *configuration*.
`import.meta.env.DEV` is a build-time constant, and dead-code elimination is
the reason to read it raw.

### Verify

1. Open the cart with two items. **Break this widget**: the body becomes `The
   cart hit a problem — Boom — a render error, thrown on purpose.`; the header,
   the page and the drawer's frame are untouched; the console shows `[error]
   [boundary:cart] Error: Boom…` with a component stack. **Try again**: the
   items are back. Break it again, close the drawer, add a product from the
   grid: the boundary resets by itself — `lines.length` changed.
2. `/account` as `emilys`: break the uploader; the profile card is untouched.
   Try again: recovered, and the file input is empty — a reset *remounts* the
   children, so their state is fresh.
3. `npm run build && npm run preview`: no **Break this widget** button anywhere,
   and `grep -l "Break this widget" dist/assets/*.js` prints nothing — the
   branch was eliminated, not hidden. `npm run dev` again.

### Watch out

**A boundary around a handler.** `onClick={() => { throw … }}` is not caught.
Use `useErrorBoundary().showBoundary(err)` if you *want* a handler's failure to
show the fallback.

**`resetKeys` that reset into the same error.** The boundary catches again
immediately — the fallback flashes. Fix the cause in `onReset`.

**One boundary around everything.** That is the route boundary with a
friendlier face. Per widget where a failure should stay local; per route where
the page cannot continue.

### In the real world

Sentry's `@sentry/react` exports an `ErrorBoundary` with the same props plus
reporting; Next.js's `error.tsx` files are route boundaries; dashboards put one
around each panel. `onError` is where the SDK goes; `name` is the tag you
search by at 2am.

---

## Lab 6 — Reading the old patterns (15 min)

### Problem

`src/legacy/` has two files that already work: `withAuth.tsx`, a higher-order
component gating `EditProductLink` on the admin role, and `Fetch.tsx`, a
render-prop component loading "More in this category". Both are class
components, both are typed, both are how React shared stateful logic before
16.8 — and both are in every codebase older than 2019, including the one you
will inherit.

### Concept

**Before hooks, stateful logic could only live in a class, so sharing it meant
sharing a component: wrap yours in one (HOC) or hand yours to one as a
function (render prop).** Both work. Both add a layer to the tree, make
TypeScript do arithmetic on props, and compose badly — three HOCs are three
wrappers; three render props are a pyramid. Hooks won because a hook shares the
*logic* without sharing a *component* (📖 study-notes 16 §2, §3).

**Reading an HOC.** `withAuth(Wrapped, options)` returns a *new class* whose
`render` decides whether to render `Wrapped` and with which extra props. Read
in order: what it injects (`InjectedAuthProps`), what it hides from the outside
(`Omit<P, keyof InjectedAuthProps>`), what it subscribes to (`componentDidMount`
/ `componentWillUnmount`), and where the cast is (`{...(this.props as P)}`) —
every typed HOC has one, because TypeScript cannot prove `OuterProps + injected
= P` for an arbitrary `P`. `displayName` is what makes DevTools say
`withAuth(EditLink)`.

**Reading a render prop.** `<Fetch load deps render>` owns the request
lifecycle and calls `this.props.render(state)`. Read the three lifecycle
methods as one effect: `componentDidMount` is the body on mount,
`componentDidUpdate` with a deps comparison is the effect re-running,
`componentWillUnmount` is the cleanup. `Field`'s `children` function in
`src/components/fields` is the same idea, and still the right tool there — the
*caller* decides the markup per field.

**The HOC is also a Fast Refresh problem.** `export const EditProductLink =
withAuth(EditLink, …)` is a component *created by a call*; the Vite React
plugin cannot tell it is a component — hence the `react-refresh/only-export-components`
warning on that file since the starter.

**Keep the legacy folder.** The finished app leaves `src/legacy/` in place,
both files `@deprecated`, nothing importing them. Deliberate: Demo 23 reads
legacy code too and adds more, and a codebase that keeps its old patterns
*visible and labelled* is easier to inherit than one that deleted the evidence.

**And TypeScript says:** `class Fetch<T> extends Component<FetchProps<T>,
FetchState<T>>` is a generic class, `T` inferred at the call site from `load`;
`private` is a type-level modifier `erasableSyntaxOnly` allows.

### Steps

**A. `src/hooks/useFetch.ts` and `src/components/RelatedProducts.tsx` — `TODO(lab-6.1)`**

Read `src/legacy/Fetch.tsx` first — all sixty lines. Then:

```ts
/**
 * <Fetch> as a hook: the same four-state machine (Demo 12's reducer), one effect keyed on `key`, an AbortController
 * cancelled on cleanup. `key` NAMES the request (`related:beauty:1`) — like a query key — so the dependency list is literal
 * and the linter can check it; `load` is read through useLatest, so callers pass an inline arrow.
 */
export function useFetch<T>(load: (signal: AbortSignal) => Promise<T>, key: string): RequestStatus<T> {
  const [request, dispatch] = useReducer(requestStatusReducer<T>, { status: 'idle' });
  const loadRef = useLatest(load);

  useEffect(() => {
    const controller = new AbortController();
    dispatch({ type: 'start' });
    loadRef.current(controller.signal)
      .then((data) => { if (!controller.signal.aborted) dispatch({ type: 'succeed', data }); })
      .catch((error: unknown) => { if (!controller.signal.aborted) dispatch({ type: 'fail', error: ApiError.from(error) }); });
    return () => controller.abort();
  }, [key, loadRef]);

  return request;
}
```

```tsx
// RelatedProducts — the render-prop callback becomes the component body:
  const request = useFetch((signal) => listProducts({ category: product.category, limit: LIMIT, signal }), `related:${product.category}:${product.id}`);
  const related = request.status === 'success' ? request.data.products.filter((p) => p.id !== product.id).slice(0, 4) : [];
  if (request.status === 'success' && related.length === 0) return null;
  return (
    <section aria-labelledby="related-heading" className="mt-4">
      <Text as="h2" id="related-heading" variant="subtitle" className="mb-3">More in {product.category}</Text>
      {/* …the same error notice, cards and placeholders as before, one indentation level up… */}
    </section>
  );
```

Count what left: the `<Fetch` element, the `deps` array (the key replaces it),
the `render={(request) => {` wrapper and its `}}`. The JSX is identical; it
moved up one level and stopped being an argument.

**B. `src/hooks/useAuthUser.ts` and `src/components/EditProductLink.tsx` — `TODO(lab-6.2)`**

Read `src/legacy/withAuth.tsx` first. Notice what it subscribes to —
`tokenStore` and `AUTH_CHANGED` — and that the router has carried the user in
`rootLoader` since Demo 11, re-run after every action:

```ts
/** The HOC subscribed to storage by hand for a value the router already had. A hook can just ask. */
export function useAuthUser(): User | null {
  return useRouteLoaderData<typeof rootLoader>('root')?.user ?? null;
}
```

```tsx
// EditProductLink — the inner component, the injected-props interface, the HOC call and the `button()` import go:
export function EditProductLink({ product }: { product: Product }) {
  const user = useAuthUser();
  if (user?.role !== 'admin') return null;
  return (
    <LinkOrButton variant="link" to={`/products?category=${encodeURIComponent(product.category)}&edit=${product.id}`} tone="ghost" size="sm">
      <PencilSquare className="me-1" />Edit in catalogue
    </LinkOrButton>
  );
}
```

**C. `src/legacy/Fetch.tsx` and `src/legacy/withAuth.tsx` — `TODO(lab-6.3)`**

Nothing imports them now. Replace each marker with the banner:

```ts
/**
 * @deprecated Read, do not extend. The 2018 shape of "load data and render it": a RENDER PROP. …
 * `useFetch` (src/hooks/useFetch.ts) is the same lifecycle as a hook — Demo 17 guide, Lab 6.
 * Kept in src/legacy/ because you will inherit code like this, and Demo 23 adds more of it.
 */
```

Editors read `@deprecated`: a future import of `Fetch` or `withAuth` renders
struck through, with the replacement in the hover.

### Verify

1. `/products/1` as `emilys`: **Edit in catalogue** is there; sign out: gone;
   sign in as `averyp`: gone (wrong role). **More in beauty** shows four
   compact cards; in Network, navigate to `/products/2` — one request for
   `category/beauty`, the previous one cancelled if still in flight.
2. React DevTools → Components on the detail page: before, `withAuth(EditLink)
   → EditLink` and `Fetch → …`; now `EditProductLink` and `RelatedProducts` sit
   directly under the page. One layer each, gone.
3. `npm run lint`: the warning on `EditProductLink.tsx` is gone — sixteen
   warnings, all on route files that export loaders beside components, as in
   every demo since 10.

### Watch out

**Deleting `src/legacy/`.** The build passes and the next person inherits a
codebase with no example of the pattern they are about to meet elsewhere.
Keep it, label it, do not import it.

**Passing a deps array through a hook.** `useEffect(…, deps)` with a
non-literal array — the linter cannot check it and says so. A string key is
checkable and reads like a cache key, which it is.

**Converting a render prop that is still right.** `Field`'s `children`
function should stay one: the caller owns the markup per field, and no hook
can hand JSX back to a specific place in the tree.

### In the real world

`connect(mapState)(Component)`, `withRouter`, `withStyles`, `<Query render>`,
`<Formik>{(props) => …}</Formik>` — every one is this lab. Subscriptions and
lifecycle become an effect, injected props become a return value, the cast
disappears. One file at a time; `@deprecated` before delete.

---

## Wrap-up — what you can now do

- [x] Build a compound component whose parts share state through a private context, wire its ARIA with `useId`, and implement the roving-tabindex keyboard pattern on the list
- [x] Support `value` *and* `defaultValue` through one `useControllableState` hook, keep the `onChange` contract, and warn when a caller switches mode
- [x] Type a polymorphic `as` prop with `ElementType`, `ComponentPropsWithoutRef` and a distributive `Omit`, and explain the one cast it carries
- [x] Write a generic `<DataTable<T>>` and `<SelectField<T>>`, let `T` infer from the data, block widening with `NoInfer`, and keep literals with `satisfies`
- [x] Choose between `ReactNode`, `ReactElement`, `PropsWithChildren`, `ComponentProps` and `ComponentPropsWithoutRef`, and model mutually exclusive props as a discriminated union
- [x] Render through `createPortal`, prove events bubble by the React tree, trap and restore focus, and say why you adopt a headless library instead
- [x] Place `react-error-boundary` per widget with a fallback, `resetKeys` and a retry that recovers; list what a boundary does not catch and why it is still a class
- [x] Read an HOC and a render prop in an inherited codebase, convert each to a hook, and keep the originals labelled `@deprecated`

**The pattern policy** — what the finished app contains, and when to reach for each:

| Question | Pattern | In ShopScope today |
|---|---|---|
| Several parts share one selection; the caller owns the markup | compound component + private context | `Tabs` |
| A value one caller owns and another wants to just work | `value` \| `defaultValue` + `onChange` via `useControllableState` | `Tabs`, `Pager`, `CategoryStrip` |
| The caller chooses the element | polymorphic `as` prop | `Text` |
| The props depend on a kind | discriminated union | `LinkOrButton`, `RequestStatus`, `ToastAction` |
| The type comes from the data | generic component | `DataTable<T>`, `SelectField<T>`, `RadioGroupField<T>`, `Field` |
| Content decided by the caller, placed by the component | `ReactNode` slot; a render prop when it varies *per item* | `PageHeader.actions`, `Dialog.footer`; `Field.children` |
| Must escape an ancestor's DOM | `createPortal` | `Dialog` (About page); `Modal`, `Offcanvas`, `Toast` do it inside React Bootstrap |
| A failure that must stay local | `WidgetBoundary` per widget; route `ErrorBoundary` per page | cart body, uploader; every route since Demo 10 |
| Shared stateful logic | a custom hook — never a new HOC | `useControllableState`, `useFocusTrap`, `useFetch`, `useAuthUser` |
| Old shapes you will inherit | read, convert, `@deprecated` | `src/legacy/withAuth.tsx`, `Fetch.tsx` — kept for Demo 23 |

## Next demo

**Demo 18 — Performance — Measure, then Fix.** The Profiler and the React
Compiler, `memo` / `useMemo` / `useCallback` where a measurement says so and
nowhere else, `useTransition` and `useDeferredValue` for the search box,
virtualising the grid with `@tanstack/react-virtual`, bundle analysis, Web
Vitals. Today's components are its raw material: a `ProductCard` rendered
sixty times, a `DataTable` sorting on every render, a `ToastContext` already
split into state and dispatch so only one component re-renders per toast.

---

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `Error: <Tabs.Tab> must be rendered inside <Tabs>.` | A part rendered outside the root. One import, one root. |
| ArrowRight scrolls the page instead of moving between tabs | `onKeyDown` is on each tab instead of the list, or `event.preventDefault()` is missing. |
| `[useControllableState] switched from controlled to uncontrolled` | A caller passes `value={cond ? x : undefined}`. Decide the mode once. |
| `Cannot access refs during render  react-hooks/refs` | `initialMode.current` read in the hook body. The mode check lives in a `useEffect`. |
| `Property 'href' does not exist on type 'IntrinsicAttributes & TextOwnProps<"h2"> & Omit<…>'` | As designed — an `<h2>` has no `href`. Change `as`, or drop the prop. |
| `Property 'to' is missing in type … but required in type '{ variant: "link"; to: string; … }'` | `variant="link"` without `to`. The union is doing its job. |
| `Type '(sort: SortKey) => void' is not assignable to type '(value: string) => void'` | `T` inferred as `string` from `options`; the handler wants narrower. Type the options as `Option<SortKey>[]`. |
| `Expected 0 type arguments, but got 1.` on `<SelectField<SortKey>>` | The old string-only `SelectField` in `fields/index.tsx` is still exported. Delete it and re-export from `./SelectField`. |
| `Property 'compnay' does not exist on type 'DirectoryUser'. Did you mean 'company'?` | `satisfies Column<DirectoryUser>[]` typing every `render`. Fix the spelling. |
| `Parsing error: ')' expected` at a `{/* comment */}` | A JSX comment inside a ternary branch's parentheses. Use a `//` line comment. |
| `Error: Missing <div id="dialog-root"> in index.html.` | Lab 4 A's first step. Add the sibling of `#root`. |
| The portal dialog's panel is half transparent | The panel is inside `.modal-backdrop.show` (`opacity: .5`). Two siblings. |
| Escape closes the dialog but focus lands on `<body>` | `useFocusTrap` not called, or the opener captured after focus moved. |
| **Break this widget** does nothing after `npm run build` | By design — `import.meta.env.DEV` is `false` and the branch was removed. |
| `react-refresh/only-export-components` on `EditProductLink.tsx` | The HOC export — a component created by a call. Lab 6 B removes it. |
