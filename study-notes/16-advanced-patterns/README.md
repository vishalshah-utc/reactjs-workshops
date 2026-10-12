# Module 16 — Advanced Patterns, Error Boundaries & Portals

**Study notes** · ~2.5 hours

> **Goal.** Every pattern in this module answers one question: *who owns
> what?* The selection, the value, the element, the type, the DOM position,
> the failure. By the end you should be able to design a component API that
> stays usable as requirements grow, handle a runtime error without a white
> screen, and render outside the DOM hierarchy without breaking focus, events
> or screen readers — and know which of these to build and which to adopt.

**Prerequisites:** [Module 5](../05-props-and-composition/) (slots, render
props, designing a props API — this module builds on §9, §12 and §13 and does
not repeat them), [Module 9](../09-reducers-and-context/) (Context),
[Module 11 §9](../11-refs-and-the-dom/#9-ref-as-a-prop--and-legacy-forwardref)
(`ref` as a prop), [Module 13 §1–§3](../13-data-fetching-and-custom-hooks/)
(custom hooks). The TypeScript in the generic sections is explained in full
in [Module 17](../17-typescript-with-react/); read the two side by side.

---

## Contents

1. [A component API is a contract about ownership](#1-a-component-api-is-a-contract-about-ownership)
2. [Compound components](#2-compound-components)
3. [Controlled, uncontrolled, and both](#3-controlled-uncontrolled-and-both)
4. [Polymorphic components — the `as` prop](#4-polymorphic-components--the-as-prop)
5. [Generic components](#5-generic-components)
6. [Slots as a re-render tool](#6-slots-as-a-re-render-tool)
7. [Render props and function-as-children](#7-render-props-and-function-as-children)
8. [Higher-order components](#8-higher-order-components)
9. [Why hooks won — and converting the old shapes](#9-why-hooks-won--and-converting-the-old-shapes)
10. [Portals — `createPortal`](#10-portals--createportal)
11. [Dialogs: focus, Escape, restore, and `<dialog>`](#11-dialogs-focus-escape-restore-and-dialog)
12. [Error boundaries — why still a class](#12-error-boundaries--why-still-a-class)
13. [`react-error-boundary`](#13-react-error-boundary)
14. [Where boundaries go, and what they do not catch](#14-where-boundaries-go-and-what-they-do-not-catch)
15. [`useId` and `useDebugValue`](#15-useid-and-usedebugvalue)
16. [React 19 changes that touch these patterns](#16-react-19-changes-that-touch-these-patterns)
17. [Self-check](#17-self-check)
18. [References](#18-references)

**Hands-on.** The labs for this module are
[Demo 17 — Component Patterns, Portals & TypeScript Consolidation](../../demos/17-component-patterns-and-portals/)
(session S19: a compound `<Tabs>`, a controlled-or-uncontrolled `Pager`, a
polymorphic `<Text as>`, a generic `<DataTable<T>>`, a `createPortal` dialog,
`react-error-boundary` per widget, and an HOC and a render prop converted to
hooks) and the error-boundary lab of
[Demo 10 — Loaders, Actions & Error Boundaries](../../demos/10-loaders-actions-and-error-boundaries/)
(Lab 5: route `ErrorBoundary` and `useRouteError`). Code here is TypeScript,
in the ShopScope domain those demos use.

---

## 1. A component API is a contract about ownership

[Module 5 §12](../05-props-and-composition/#12-designing-a-component-api)
gave the smells: too many props, booleans that should be a union, a `config`
object, `renderX` for every region. This module is what you reach for when
the smell is real and a smaller props list will not fix it.

| The question | Who owns it | The pattern | § |
|---|---|---|---|
| Several parts share one selection; the caller owns the markup | the root, invisibly | compound component + private context | [§2](#2-compound-components) |
| One caller wants to own a value, another wants it to "just work" | whoever passes `value` | `value` \| `defaultValue` + `onChange` | [§3](#3-controlled-uncontrolled-and-both) |
| The caller should choose the element | the caller | polymorphic `as` prop | [§4](#4-polymorphic-components--the-as-prop) |
| The type should come from the data | the data | generic component | [§5](#5-generic-components) |
| Content varies *per item*; the component owns the loop | both — the caller supplies a function | render prop | [§7](#7-render-props-and-function-as-children) |
| Must escape an ancestor's `overflow`, `transform` or `z-index` | the DOM, not the tree | `createPortal` | [§10](#10-portals--createportal) |
| A failure must stay local | the nearest boundary | error boundary | [§12](#12-error-boundaries--why-still-a-class) |
| Stateful logic shared between components | nobody — each caller gets its own | a custom hook, never a new HOC | [§9](#9-why-hooks-won--and-converting-the-old-shapes) |

Every row costs something: a compound component is more files than an `items`
prop, a controllable component has two code paths, a polymorphic component
carries a cast, a portal breaks the "DOM mirrors the tree" assumption. The
question for each is whether the variation it absorbs is real. If a `<Tabs>`
will only ever show three plain labels, an array prop is the right design.

---

## 2. Compound components

### The problem an `items` prop cannot solve

```tsx
<Tabs items={[{ label: 'Details', content: <Details /> }, { label: 'Reviews', content: <Reviews /> }]} />
```

Add an icon to one tab, a badge to another, disable a third. Each is a new
field on the item type and a new branch inside `Tabs`. The *caller* knows what
each tab should look like; the component is being asked to guess, one prop at
a time. The compound alternative lets the caller write JSX and lets the parts
agree among themselves which one is selected — `<select>` and `<option>` are
the model; an option never receives "am I selected", it asks:

```tsx
<Tabs defaultValue="details">
  <Tabs.List aria-label="Product information">
    <Tabs.Tab value="details">Details</Tabs.Tab>
    <Tabs.Tab value="reviews" disabled={reviews.length === 0}>Reviews <Badge pill>{reviews.length}</Badge></Tabs.Tab>
    <Tabs.Tab value="shipping">Shipping &amp; returns</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="details"><ProductDetails product={product} /></Tabs.Panel>
  <Tabs.Panel value="reviews"><ReviewList reviews={reviews} /></Tabs.Panel>
  <Tabs.Panel value="shipping"><ShippingInfo product={product} /></Tabs.Panel>
</Tabs>
```

### The private context

```tsx
import { createContext, useContext, useId, useMemo, useState, type ReactNode } from 'react';

interface TabsContextValue { value: string; select: (value: string) => void; baseId: string }

const TabsContext = createContext<TabsContextValue | undefined>(undefined);   // NOT exported

function useTabsContext(part: string): TabsContextValue {
  const context = useContext(TabsContext);
  if (context === undefined) throw new Error(`<Tabs.${part}> must be rendered inside <Tabs>.`);
  return context;
}
```

The default is `undefined` and the hook throws when it sees it. That is a
compound component's one rule — the parts must be under the root — and the
error names the part ([Module 9 §15](../09-reducers-and-context/#15-a-custom-hook-as-the-public-api)).
Because the context is not exported, its shape is yours to change.

### The root and the parts

```tsx
interface TabsProps { defaultValue: string; onValueChange?: (value: string) => void; children: ReactNode }

export function Tabs({ defaultValue, onValueChange, children }: TabsProps) {
  const [selected, setSelected] = useState(defaultValue);
  const baseId = useId();
  const context = useMemo<TabsContextValue>(() => ({
    value: selected,
    select: (value) => { setSelected(value); onValueChange?.(value); },
    baseId,
  }), [selected, baseId, onValueChange]);
  return <TabsContext value={context}><div>{children}</div></TabsContext>;
}

const tabId   = (baseId: string, value: string) => `${baseId}-tab-${value}`;
const panelId = (baseId: string, value: string) => `${baseId}-panel-${value}`;

function TabsTab({ value, disabled = false, children }: { value: string; disabled?: boolean; children: ReactNode }) {
  const { value: selected, select, baseId } = useTabsContext('Tab');     // it ASKS
  const isSelected = selected === value;
  return (
    <button type="button" role="tab" id={tabId(baseId, value)} aria-selected={isSelected} aria-controls={panelId(baseId, value)}
      tabIndex={isSelected ? 0 : -1} disabled={disabled} onClick={() => select(value)}>
      {children}
    </button>
  );
}

function TabsPanel({ value, children }: { value: string; children: ReactNode }) {
  const { value: selected, baseId } = useTabsContext('Panel');
  return <div role="tabpanel" id={panelId(baseId, value)} aria-labelledby={tabId(baseId, value)} hidden={selected !== value} tabIndex={0}>{children}</div>;
}

Tabs.List  = TabsList;    // an "expando": typed properties on a function declaration
Tabs.Tab   = TabsTab;
Tabs.Panel = TabsPanel;
```

**`useTabsContext('Tab')` is the whole trick.** The tab never receives its
selected state as a prop, so the caller can put anything between `<Tabs>` and
`<Tabs.Tab>` — a grid row, a card, a conditional — without threading state
through it. **Inactive panels are `hidden`, not `null`**: `aria-controls`
must point at an id that exists, and a half-typed form inside a panel should
survive a switch. **`useId` wires the ARIA** ([§15](#15-useid-and-usedebugvalue))
— one id per instance, never a prop the caller has to invent.

### Keyboard: one Tab stop, arrows within

The WAI-ARIA tabs pattern is a *roving tabindex*: the selected tab is
`tabIndex={0}`, the others `-1`, and arrows move focus **and** select. Handle
it once, on the list — not on each tab, which breaks the moment a tab is
disabled or the list re-orders:

```tsx
function TabsList({ children, ...rest }: ComponentPropsWithoutRef<'div'>) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)'));
    const index = tabs.findIndex((tab) => tab === document.activeElement);
    if (index === -1) return;
    const next = { ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index - 1 + tabs.length) % tabs.length, Home: 0, End: tabs.length - 1 }[event.key];
    if (next === undefined) return;                 // not our key
    event.preventDefault();                         // or ArrowRight scrolls the page
    tabs[next].focus();
    tabs[next].click();                             // drive the tab the way a user would — the list never learns its value
  }
  return <div role="tablist" onKeyDown={handleKeyDown} {...rest}>{children}</div>;
}
```

### When it is worth it

When the parts vary independently *and* the caller owns the markup: tabs,
accordions, menus, a field with its label and error, a dialog with header and
footer. Not for a component whose three props always travel together — a
`<Button variant size>` is configuration and should stay that way.

📖 [react.dev — Passing Data Deeply with Context](https://react.dev/learn/passing-data-deeply-with-context)

**→ In the demos:** Demo 17, Lab 1 — `<Tabs>` on the product detail page with the roving-tabindex keyboard pattern.

---

## 3. Controlled, uncontrolled, and both

### Two owners for one value

[Module 10 §5](../10-forms/#5-controlled-or-uncontrolled-deciding) drew the
line for inputs. It applies to every component with a value:

| Mode | Who owns the value | The parent… | ShopScope |
|---|---|---|---|
| **Controlled** | the parent | passes `value`, must handle `onChange` | a `Pager` driven by the URL |
| **Uncontrolled** | the component | may pass `defaultValue`, may listen to `onChange` | `Tabs` on a detail page |

A `Tabs` that only supports `defaultValue` cannot be driven by the URL. A
`Pager` that only supports `page` + `onChange` cannot be dropped into a
self-contained widget without a parent to babysit it. The DOM's `<input>`
supports both — `value` *or* `defaultValue` — and so should any input-like
component you ship.

### The `onChange` contract

1. `onChange` fires in **both** modes with the **new value**, so a parent can
   ignore it, persist it, or take over by passing `value`.
2. It receives a **value**, never an event. `onChange(event)` tells the parent
   it is a `<button>`, and a change of markup becomes a breaking change.
3. **The mode is decided once.** `value !== undefined` means controlled. A
   component that flips mid-life has two sources of truth that were once equal
   and now are not; the bug shows up as "it stopped updating" three screens
   away.

### `useControllableState`

Write the logic once, not fifteen lines per component with one branch wrong:

```tsx
interface UseControllableStateOptions<T> {
  value: T | undefined;            // present → controlled
  defaultValue: T;                 // read once, like useState's argument
  onChange?: (next: T) => void;    // fires in BOTH modes
}

export function useControllableState<T>({ value, defaultValue, onChange }: UseControllableStateOptions<T>): [T, (next: T) => void] {
  const [internal, setInternal] = useState(defaultValue);
  const isControlled = value !== undefined;

  const initialMode = useRef(isControlled);           // the mode we STARTED in
  useEffect(() => {
    if (!import.meta.env.DEV || initialMode.current === isControlled) return;
    console.warn(`[useControllableState] switched from ${initialMode.current ? 'controlled' : 'uncontrolled'}. Decide once.`);
    initialMode.current = isControlled;
  }, [isControlled]);

  const set = useCallback((next: T) => {
    if (!isControlled) setInternal(next);             // uncontrolled: we own it
    onChange?.(next);                                 // both modes: the parent may listen
  }, [isControlled, onChange]);

  return [isControlled ? value : internal, set];
}
```

The tuple mirrors `useState`, so a component adopts it by changing one line:

```tsx
interface PagerProps { value?: number; defaultValue?: number; pageCount: number; onChange?: (page: number) => void }

export function Pager({ value, defaultValue = 0, pageCount, onChange }: PagerProps) {
  const [page, setPage] = useControllableState({ value, defaultValue, onChange });   // before any early return
  if (pageCount <= 1) return null;
  return <nav aria-label="Pagination">{/* Previous / "Page n of m" / Next, each calling setPage */}</nav>;
}

<Pager value={filters.page} pageCount={n} onChange={(page) => updateFilters({ page })} />   // the URL owns it
<Pager defaultValue={0} pageCount={n} />                                                   // the Pager owns it
```

The classic wrong implementation is `const page = value ?? internal` with
nothing that writes `internal`: controlled works, uncontrolled never updates,
and it ships because the only caller was controlled.

### The state-reducer idea

One step further: a `stateReducer?: (current: T, proposed: T) => T` prop lets
the parent **veto or alter** a transition without owning the value —
`stateReducer={(current, proposed) => (isDirty ? current : proposed)}` refuses
to leave a page with unsaved edits. You will meet it in autocomplete libraries
(Downshift), where a parent wants the menu to stay open after a selection.
Most components want only the two modes above.

📖 [react.dev — Sharing State Between Components](https://react.dev/learn/sharing-state-between-components)
📖 [react.dev — `<input>`: controlled and uncontrolled](https://react.dev/reference/react-dom/components/input#controlling-an-input-with-a-state-variable)

**→ In the demos:** Demo 17, Lab 2 — `useControllableState` under `Tabs`, `Pager` and `CategoryStrip`.

---

## 4. Polymorphic components — the `as` prop

### The problem

Three files hand-write `<h1 className="h3 mb-0">`; a text component that
always renders `<p>` cannot be a heading. The caller should choose the
element; the component should keep its variants.

```tsx
<Text as="h1" variant="title" tabIndex={-1}>{product.title}</Text>
<Text as="div" variant="eyebrow">{product.brand ?? product.category}</Text>
<Text variant="muted">{product.description}</Text>           // defaults to <p>
```

### Typing it

The type must say: *our props, plus every prop the chosen element accepts,
minus the ones we define* — so `href` on `as="h2"` is a compile error and
`tabIndex` on `as="h1"` is not.

```tsx
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

type TextVariant = 'title' | 'subtitle' | 'eyebrow' | 'body' | 'muted';
const VARIANT_CLASS: Record<TextVariant, string> = { title: 'h3 mb-0', subtitle: 'h6 text-muted mb-0', eyebrow: 'small text-uppercase text-muted', body: 'mb-0', muted: 'text-muted mb-0' };

/** Omit over a UNION keeps only the shared keys. A conditional type distributes it over each member instead. */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

interface TextOwnProps<T extends ElementType> { as?: T; variant?: TextVariant; className?: string; children?: ReactNode }

export type TextProps<T extends ElementType> = TextOwnProps<T> & DistributiveOmit<ComponentPropsWithoutRef<T>, keyof TextOwnProps<T>>;

export function Text<T extends ElementType = 'p'>({ as, variant = 'body', className, ...rest }: TextProps<T>) {
  const Component: ElementType = as ?? 'p';     // the ONE cast a polymorphic component carries
  return <Component className={clsx(VARIANT_CLASS[variant], className)} {...rest} />;
}
```

Four things to know, because you will write this once and read it in library
source for years:

- **`ElementType`** is anything JSX can render as a tag: a string like `'h2'`
  *or* a component like `Link`. `as={Link}` works, and then `to` is a known
  prop.
- **`ComponentPropsWithoutRef<T>`** is the element's props minus `ref`. Use
  it unless you forward a ref ([§16](#16-react-19-changes-that-touch-these-patterns)).
- **The distributive `Omit`.** `Omit<ComponentPropsWithoutRef<'a' | 'button'>, 'as'>`
  keeps only the keys both share and silently drops `href`. The conditional
  type applies `Omit` per member.
- **The one cast.** Spreading `{...rest}` onto an element typed `T` cannot be
  checked for *every possible* `T`, so the element variable is typed plain
  `ElementType`. It lives on the inside, once; callers never see it.

Radix-style libraries reach the same goal with `asChild` —
`<Button asChild><Link to="/x">Go</Link></Button>` clones the child and merges
the button's props onto it. No polymorphic typing, but a `cloneElement`
underneath. Use whichever your design system already uses.

📖 [react.dev — Using TypeScript](https://react.dev/learn/typescript)

**→ In the demos:** Demo 17, Lab 3 — `<Text as>` and the three deliberate compile errors.

---

## 5. Generic components

### The type comes from the data

A table that renders team members today renders orders tomorrow. If `Column`
is written against `DirectoryUser`, it is not a table — it is the team page
with a different name.

```tsx
import type { Key, ReactNode } from 'react';

export interface Column<T> {
  /** A property of T — with autocomplete — or any string for a computed column. `keyof T | string` would collapse to string. */
  key: Extract<keyof T, string> | (string & Record<never, never>);
  header: ReactNode;
  render?: (row: T) => ReactNode;              // absent → String(row[key])
  sortValue?: (row: T) => string | number;     // present → the header is a sort button
}

interface DataTableProps<T> {
  rows: readonly T[];
  columns: readonly Column<T>[];
  getRowKey: (row: T) => Key;                  // T is anything — the caller says what identifies a row
  caption: string;
}

export function DataTable<T>({ rows, columns, getRowKey, caption }: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const sorted = useMemo(() => sortRows(rows, columns, sort), [rows, columns, sort]);   // a COPY — never sort a prop in place
  return (
    <table>
      <caption className="visually-hidden">{caption}</caption>
      {/* a <th scope="col" aria-sort> per column; a <tr key={getRowKey(row)}> per sorted row; cells call column.render?.(row) ?? String(row[key]) */}
    </table>
  );
}
```

At the call site nobody writes `<DataTable<DirectoryUser>>` — `T` is inferred
from `rows`, and every `render` is checked against it:

```tsx
const COLUMNS = [
  { key: 'name',  header: 'Name',  render: (row) => `${row.firstName} ${row.lastName}`, sortValue: (row) => row.lastName },
  { key: 'email', header: 'Email', sortValue: (row) => row.email },
  { key: 'role',  header: 'Role',  render: (row) => <Badge bg={ROLE_VARIANT[row.role]}>{row.role}</Badge> },
] satisfies Column<DirectoryUser>[];

<DataTable rows={users} columns={COLUMNS} getRowKey={(user) => user.id} caption="Team members" />
```

`(row) =>` has no annotation, yet `row` is a `DirectoryUser`: `satisfies`
supplies the contextual type the way an annotation would, and leaves the
array's own type as the literal you wrote. `row.compnay` is an error *here*,
in the data, not in the table.

### Inference has a direction

```tsx
interface SelectFieldProps<T extends string> {
  options: readonly { value: T; label: string }[];
  value?: NoInfer<T>;                        // check against T, do not infer from it
  onChange?: (value: NoInfer<T>) => void;
}

export function SelectField<T extends string>({ options, value, onChange }: SelectFieldProps<T>) {
  return (
    <select value={value} onChange={onChange ? (e) => onChange(e.target.value as T) : undefined}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
```

Without `NoInfer`, TypeScript infers `T` from `options` *and* `value`. Given
`Option<SortKey>[]` and a `string` value it reports nothing — it widens `T` to
`string` so both fit, and the safety you wrote the generic for is gone.
`NoInfer` (TypeScript 5.4) marks the positions that must not contribute.

The `as T` on `e.target.value` is this module's second honest cast: the
`<option>`s were rendered *from* `options`, so the string the DOM hands back
is one of `T`. The cast lives next to its reason, once. (A generic *arrow* in
`.tsx` needs `<T,>(props) => …` — the comma stops the parser reading a JSX
tag. A function declaration never has the problem.)

📖 [react.dev — Using TypeScript](https://react.dev/learn/typescript)

**→ In the demos:** Demo 17, Lab 3 — `<DataTable<T>>` on the team page; `<SelectField<T>>` rejecting a mismatched `onChange`.

---

## 6. Slots as a re-render tool

[Module 5 §9](../05-props-and-composition/#9-multiple-slots) introduced slots
for composition. They are also the cheapest performance tool in React, and
the reason is worth knowing before [Module 15](../15-performance/) reaches
for `memo`.

```tsx
function ProductToolbar({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState('');              // changes on every keystroke
  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      {children}                                        {/* created by the PARENT — the same element object as last render */}
    </>
  );
}

<ProductToolbar>
  <ProductGrid products={products} />                   {/* does NOT re-render on a keystroke */}
</ProductToolbar>
```

`<ProductGrid>` was created in the parent's render. When `ProductToolbar`
re-renders for a keystroke, `children` is the identical element object and
React skips it — no `memo` required. Had the toolbar rendered the grid
itself, every keystroke would re-render sixty cards. The rule: **state lives
in the smallest component that needs it, and expensive siblings arrive as
props rather than being rendered by the stateful component** — "pass the
element, not the data" from
[Module 5 §14](../05-props-and-composition/#14-prop-drilling-when-it-is-fine-and-when-it-is-not),
seen from the re-render side.

📖 [react.dev — Preserving and Resetting State](https://react.dev/learn/preserving-and-resetting-state)

---

## 7. Render props and function-as-children

A **render prop** is a prop whose value is a function returning JSX. The
component owns some state or a loop; the caller owns what it looks like.

```tsx
interface FieldRenderProps { id: string; invalid: boolean; describedBy?: string }
interface FieldProps { label: string; error?: string; children: (control: FieldRenderProps) => ReactElement }   // function-as-children

function Field({ label, error, children }: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children({ id, invalid: Boolean(error), describedBy: error ? errorId : undefined })}
      {error && <p id={errorId} role="alert">{error}</p>}
    </div>
  );
}

<Field label="Price" error={errors.price}>
  {({ id, invalid, describedBy }) => <input id={id} type="number" aria-invalid={invalid} aria-describedby={describedBy} />}
</Field>
```

`children` is just a prop ([Module 5 §8](../05-props-and-composition/#8-children)),
so it can be a function. The return type is `ReactElement`, not `ReactNode`,
because `Field` needs *an element to put the wiring on*.

### The 2018 shape you will inherit

Before hooks this was how stateful logic was shared — a class that owns a
lifecycle and hands the state to a function:

```tsx
<Fetch load={(signal) => listProducts({ category, limit: 4, signal })} deps={[category]}
  render={(request) => (request.status === 'success' ? <ProductGrid products={request.data.products} /> : <GridSkeleton />)} />
```

Read it as a hook that can only return JSX through a callback. It works. It
also nests — two render props are a pyramid — and the callback is re-created
every render, which defeats `memo` on anything inside.

### When a render prop is still the right tool

When **the caller decides the markup per item** and the component owns the
loop or the wiring: `Field.children`, `renderRow` on a list, `renderItem` on
a virtualised list, `fallbackRender` on an error boundary
([§13](#13-react-error-boundary)). No hook can hand JSX back to a specific
place in a tree the component controls. A render prop that merely *shares
state* — `<Fetch>`, `<Toggle>`, `<Mouse>` — wanted to be a hook.

📖 [react.dev — Passing JSX as children](https://react.dev/learn/passing-props-to-a-component#passing-jsx-as-children)

---

## 8. Higher-order components

A **higher-order component** is a function that takes a component and
returns a new one with extra behaviour — the other pre-hooks way to share
stateful logic. `connect(mapState)(Page)`, `withRouter`, `withStyles`,
`withTranslation` are all this shape.

```tsx
export interface InjectedAuthProps { user: User }

export function withAuth<P extends InjectedAuthProps>(Wrapped: ComponentType<P>, { role }: { role?: Role } = {}) {
  type OuterProps = Omit<P, keyof InjectedAuthProps>;            // the public props: P minus what we inject

  return class WithAuth extends Component<OuterProps, { user: User | null }> {
    static displayName = `withAuth(${Wrapped.displayName ?? Wrapped.name ?? 'Component'})`;
    state = { user: tokenStore.getUser() };
    handleAuthChange = () => this.setState({ user: tokenStore.getUser() });
    componentDidMount()    { window.addEventListener(AUTH_CHANGED, this.handleAuthChange); }
    componentWillUnmount() { window.removeEventListener(AUTH_CHANGED, this.handleAuthChange); }
    render() {
      const { user } = this.state;
      if (!user || (role && user.role !== role)) return null;
      return <Wrapped {...(this.props as P)} user={user} />;      // the cast every typed HOC carries
    }
  };
}

export const EditProductLink = withAuth(EditLink, { role: 'admin' });
```

### How to read one in an inherited codebase

In this order, every time: **what it injects** (`InjectedAuthProps`); **what
it hides** from the outside (`Omit<P, keyof Injected>` — the tell of every
HOC is arithmetic on prop types); **what it subscribes to**
(`componentDidMount` / `componentWillUnmount`, read as one effect's setup and
cleanup); **where the cast is** (`this.props as P` — TypeScript cannot prove
`OuterProps + injected = P` for an arbitrary `P`); and **`displayName`**,
without which DevTools calls every wrapped component `WithAuth`.

### Why they lost

| Problem | What it looked like |
|---|---|
| **Wrapper hell** | `withRouter(connect(mapState)(withStyles(styles)(Page)))` — four DevTools layers for one component |
| **Prop collisions** | two HOCs both inject `data`; the inner one wins silently |
| **Static hoisting** | the wrapper has none of the wrapped component's statics; `hoist-non-react-statics` existed to fix this |
| **Refs** | a `ref` on the wrapper pointed at the wrapper; `forwardRef` had to be threaded through |
| **Indirection** | where does `user` come from? Not from any import in this file |
| **Typing** | the `Omit`, the cast, and a generic constraint that takes a paragraph |
| **Fast Refresh** | `export const X = withAuth(Y)` is a component created by a call; the dev server cannot tell |

One still earns its keep: a thin *behavioural* HOC that wraps a tree rather
than injecting props — `withErrorBoundary` from `react-error-boundary`
([§13](#13-react-error-boundary)) — and it is one line over a component you
could equally wrap in JSX.

📖 [react.dev — Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)

---

## 9. Why hooks won — and converting the old shapes

**A hook shares the logic without sharing a component.** No layer in the
tree, no prop arithmetic, no cast, no callback pyramid, and the dependency is
an `import` you can see.

| | HOC | Render prop | Hook |
|---|---|---|---|
| Where the logic lives | a wrapper class | a wrapper class | a function |
| Extra tree layer | yes | yes | **no** |
| Where the value appears | an injected prop | a callback argument | **a return value** |
| Composing three | nested calls | a pyramid | **three lines** |
| Typing | `Omit` + a cast | a generic class | **a generic function** |
| Can hand JSX to a specific spot | no | **yes** | no |

### Render prop → hook

The three lifecycle methods are one effect: `componentDidMount` is the body on
mount, `componentDidUpdate` with a deps comparison is the effect re-running,
`componentWillUnmount` is the cleanup.

```tsx
export function useFetch<T>(load: (signal: AbortSignal) => Promise<T>, key: string): RequestStatus<T> {
  const [request, dispatch] = useReducer(requestStatusReducer<T>, { status: 'idle' });
  const loadRef = useLatest(load);                       // callers pass an inline arrow; the effect reads the latest one
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

// the render-prop callback becomes the component body, one indentation level up
const request = useFetch((signal) => listProducts({ category, limit: 4, signal }), `related:${category}`);
if (request.status !== 'success') return <GridSkeleton />;
return <ProductGrid products={request.data.products} />;
```

A string `key` replaces the `deps` array deliberately: a non-literal array
passed through to `useEffect` cannot be checked by the linter, and a key
reads like what it is — a cache key
([Module 13 §5](../13-data-fetching-and-custom-hooks/#5-building-usefetch-properly)).

### HOC → hook

The injected prop becomes a return value; the subscription becomes an effect,
or disappears when the value already lives somewhere a hook can ask:

```tsx
export function useAuthUser(): User | null {
  return useRouteLoaderData<typeof rootLoader>('root')?.user ?? null;   // the router already had it
}

export function EditProductLink({ product }: { product: Product }) {
  const user = useAuthUser();
  if (user?.role !== 'admin') return null;
  return <Link to={`/products?edit=${product.id}`}>Edit in catalogue</Link>;
}
```

Gone: the inner component, the injected-props interface, the HOC call, the
cast, the `displayName`, and one DevTools layer.

### Keep the old files

Label them `@deprecated`, import nothing from them, and leave them. A codebase
that keeps its old patterns *visible and named* is easier to inherit than one
that deleted the evidence — and the next codebase you join will not have
deleted it.

📖 [react.dev — Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)

**→ In the demos:** Demo 17, Lab 6 — `src/legacy/Fetch.tsx` → `useFetch`, `withAuth` → `useAuthUser`.

---

## 10. Portals — `createPortal`

### What it does

```tsx
import { createPortal } from 'react-dom';

createPortal(children, domNode, key?)    // returns a ReactPortal — a ReactNode a component may return directly
```

`createPortal` renders `children` into a **different DOM node** while keeping
them in the **same React tree**. The component is still a child of whoever
rendered it — it receives context, re-renders with its parent, its events
bubble to its parent's handlers — but its DOM sits wherever you said.

```html
<div id="root"></div>
<div id="dialog-root"></div>   <!-- a SIBLING of #root -->
```

```tsx
function getDialogRoot(): HTMLElement {
  const root = document.getElementById('dialog-root');
  if (!root) throw new Error('Missing <div id="dialog-root"> in index.html.');   // once, clearly — not null passed on
  return root;
}

export function Dialog({ open, title, onClose, children, footer }: DialogProps) {
  const titleId = useId();
  if (!open) return null;
  return createPortal(
    <>
      <div className="modal-backdrop show" />                                   {/* a sibling — opacity on a parent would fade the panel */}
      <div className="modal d-block" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="modal-dialog">
          <h2 id={titleId}>{title}</h2>
          {children}
          {footer && <div className="modal-footer">{footer}</div>}           {/* a slot: the dialog never learns what "confirm" means */}
        </div>
      </div>
    </>,
    getDialogRoot(),
  );
}
```

### Why: escaping the ancestor

A dialog rendered inline inside a `<ProductCard>` is subject to every
ancestor between it and `<body>`: an `overflow: hidden` clips it, a
`transform` or `filter` creates a new containing block and stacking context,
a `z-index` on a sibling card wins. The only reliable escape is not to be
inside that DOM at all. "My dropdown is clipped by the table's
`overflow: auto`" means it is not a portal.

The same reasoning covers **toasts** and **tooltips**: a toast region is
`createPortal(<div aria-live="polite" className="position-fixed bottom-0 end-0">{toasts…}</div>, document.body)`,
with `aria-live` on the container that stays mounted rather than on each toast
— a region added at the same moment as its content is often not announced. A
tooltip is positioned against the viewport, not a scrolling container.

### Events bubble through the React tree

```tsx
<div onClick={() => setBubbled((n) => n + 1)}>      {/* a React ancestor, NOT a DOM ancestor */}
  <Dialog open={open} title="Hand-rolled" onClose={close}>Click anywhere in here.</Dialog>
</div>
```

Every click inside the dialog increments the counter, although in the DOM the
dialog is under `#dialog-root` and the `<div>` is under `#root`. React
listens at the root container and dispatches by its *own* tree
([Module 7 §9](../07-state-and-events/#9-propagation-capture-and-stopping-it)).

Convenient: a `<form>` around a portalled dropdown still receives `onSubmit`.
Surprising: a "click outside to close" handler on an ancestor fires for
clicks *inside* the portal — check `panelRef.current?.contains(event.target as Node)`
rather than trusting bubbling. **Context flows in, too:** a `<ThemeContext>`
above `<Dialog>` reaches the dialog's contents, so a portalled dialog can call
`useCart()` with no wiring.

**Server rendering.** `document` does not exist on the server, so a portal
that reads `document.getElementById` during render throws there. Keep it
behind an `open` flag that is `false` on first render, as above, or gate it on
a `mounted` state set in an effect.

📖 [react.dev — `createPortal`](https://react.dev/reference/react-dom/createPortal)

**→ In the demos:** Demo 17, Lab 4 — `Dialog.tsx` into `#dialog-root`, and the bubbling counter on the About page.

---

## 11. Dialogs: focus, Escape, restore, and `<dialog>`

A portal solves the DOM position and nothing else. A modal dialog that is
accessible needs, at minimum:

| Behaviour | Native `<dialog>.showModal()` | A `createPortal` dialog |
|---|---|---|
| Above everything, with a backdrop | the top layer, `::backdrop` | a root node and a `.modal-backdrop` sibling |
| Focus moved in, trapped, restored on close | yes | `useFocusTrap` — capture the opener, move focus, wrap Tab, `opener.focus()` in cleanup |
| Escape closes | the `cancel` event | a `keydown` listener on `document` |
| Announced as a dialog | implicit role | `role="dialog" aria-modal="true" aria-labelledby` |
| Page does not scroll behind it | no | `body.style.overflow = 'hidden'`, restored |
| The rest of the page inert; nested dialogs; iOS scroll | mostly | you have not written it |

### The focus trap, written once

```tsx
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(containerRef: RefObject<HTMLElement | null>, active: boolean): void {
  useEffect(() => {
    if (!active || !containerRef.current) return;
    const container = containerRef.current;

    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;   // capture FIRST
    const focusables = () => Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
    (focusables()[0] ?? container).focus();                                                           // move SECOND

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Tab') return;
      const items = focusables();
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }

    container.addEventListener('keydown', handleKeyDown);
    return () => { container.removeEventListener('keydown', handleKeyDown); opener?.focus(); };   // RESTORE — the most-forgotten step
  }, [containerRef, active]);
}
```

Capturing the opener *after* focusing the first button captures the button.
Order matters, and it is the bug every hand-rolled dialog has shipped once.
Escape and the scroll lock are a second effect keyed on `open` — they
synchronise the document, a system outside React, with the dialog's state
([Module 12 §1](../12-effects/#1-what-an-effect-is-for)).

### Why you adopt a headless library

Look at the table's last row. Nested dialogs, scroll locking on iOS,
`inert`/`aria-hidden` on everything else, restoring focus when the opener has
unmounted, screen readers you do not own — Radix, Base UI, React Aria and
Headless UI have each solved these, with tests. Hand-rolling once teaches you
what to look for in their source; hand-rolling in production means owning
those bugs.

The same goes for menus, comboboxes and tooltips: the keyboard contract, the
roles (`menu`/`menuitem`, `combobox`/`listbox`/`option`) and the focus
management are specified by WAI-ARIA and are not where your product
differentiates. **Styled library first, headless when the design is yours,
hand-rolled never — except as an exercise.**

📖 [react.dev — Common components (including `<dialog>`)](https://react.dev/reference/react-dom/components/common)
📖 [react.dev — Manipulating the DOM with Refs](https://react.dev/learn/manipulating-the-dom-with-refs)

**→ In the demos:** Demo 17, Lab 4 — `useFocusTrap`, parity with React Bootstrap's `Modal`, then the library put back on purpose.

---

## 12. Error boundaries — why still a class

### What one is

An **error boundary** catches an error thrown during rendering anywhere in
its subtree and renders a fallback instead of unmounting the whole root.
Without one, a `null` thumbnail on a single cart line takes the entire
application off the screen.

```tsx
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props { fallback: ReactNode; children: ReactNode }
interface State { error: unknown }

class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error };                              // render the fallback IN THE SAME PASS
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    logger.error(error, info.componentStack);       // side effects: report it
  }

  render() {
    return this.state.error ? this.props.fallback : this.props.children;
  }
}
```

### Why it is a class

Two lifecycle methods make a boundary, and **no hook exposes either**:

- `static getDerivedStateFromError` runs during the *render phase*, so React
  can swap in the fallback before committing anything from the failed
  subtree. A hook cannot run there.
- `componentDidCatch` runs after commit with the **component stack** — the
  chain of components that led to the throw, which is what you send to a
  reporting service.

React has said no hook equivalent is planned. The answer is not to write the
class yourself; it is to let a small library own it ([§13](#13-react-error-boundary))
— the one place in this curriculum you *use* a class component without
reading one. With no boundary at all, React unmounts the root and the user
sees a blank page.

### Recovery

A boundary that stops at a fallback is a nicer white screen. It recovers
when its state is cleared, and React then re-renders the children **from
scratch** — their state is gone too. Two ways to clear it:

```tsx
reset = () => this.setState({ error: null });    // 1. a method the fallback can call
<ErrorBoundary key={product.id}>…</ErrorBoundary>  // 2. a different key is a different instance
```

A retry only recovers if the *cause* is gone. If the broken cart line is still
in state, the boundary catches again immediately and the fallback flashes.

📖 [react.dev — `Component`: catching rendering errors with an error boundary](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
📖 [react.dev — `static getDerivedStateFromError`](https://react.dev/reference/react/Component#static-getderivedstatefromerror) · [`componentDidCatch`](https://react.dev/reference/react/Component#componentdidcatch)

---

## 13. `react-error-boundary`

The class from §12, maintained, typed, with recovery designed in. Version
6.x; it is the library the React docs point at.

### `<ErrorBoundary>`

```tsx
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';

function WidgetFallback({ error, resetErrorBoundary, name }: FallbackProps & { name: string }) {
  const message = error instanceof Error ? error.message : String(error);   // error is unknown — anything can be thrown
  return (
    <Alert variant="danger">
      <div>The {name} hit a problem — {message}</div>
      <Button size="sm" onClick={resetErrorBoundary}>Try again</Button>
    </Alert>
  );
}

interface WidgetBoundaryProps { name: string; children: ReactNode; resetKeys?: unknown[]; onReset?: () => void }

export function WidgetBoundary({ name, children, resetKeys = [], onReset }: WidgetBoundaryProps) {
  return (
    <ErrorBoundary
      fallbackRender={(props) => <WidgetFallback {...props} name={name} />}
      resetKeys={resetKeys}
      onReset={() => onReset?.()}
      onError={(error, info) => logger.error(`[boundary:${name}]`, error, info.componentStack ?? '')}
    >
      {children}
    </ErrorBoundary>
  );
}

<WidgetBoundary name="cart" resetKeys={[lines.length]}>…</WidgetBoundary>
<WidgetBoundary name="uploader"><Uploader /></WidgetBoundary>
```

Wrap the library once, so every widget gets the same fallback and the same
log line. `name` is the tag you search the logs by; `onError` is where a
reporting SDK goes.

Three ways to supply the fallback — one per boundary:

| Prop | Takes | Use when |
|---|---|---|
| `fallback` | a `ReactNode` | a static message, no retry |
| `fallbackRender` | `(props: FallbackProps) => ReactNode` | you need `error` and `resetErrorBoundary` — the usual choice |
| `FallbackComponent` | `ComponentType<FallbackProps>` | the fallback is a reusable component |

Never `FallbackComponent={(p) => <X {...p} />}`: that is a new component
*type* every render, so the fallback remounts each time. An inline function
belongs on `fallbackRender`.

### `resetKeys` and `onReset`

`resetKeys` is an array; when any element changes (`Object.is`), a boundary
showing its fallback resets and re-renders the children. It is the `key`
trick from §12 as data: a cart line added or removed resets a broken cart
body without anyone clicking.

`onReset` runs on every reset with `{ reason: 'imperative-api' }` (the
fallback called `resetErrorBoundary`) or `{ reason: 'keys', prev, next }`.
It is **where you fix the cause** — clear the state that threw, drop the bad
line, invalidate the query. A reset that leaves the cause in place re-throws
into the same fallback.

### `useErrorBoundary`

Boundaries do not catch handlers or async code ([§14](#14-where-boundaries-go-and-what-they-do-not-catch)).
The hook lets that code *throw into* the nearest boundary on purpose:

```tsx
import { useErrorBoundary } from 'react-error-boundary';

function Uploader() {
  const { showBoundary } = useErrorBoundary();
  async function handleUpload(file: File) {
    try { await uploadAvatar(file); }
    catch (error) { showBoundary(error); }     // the boundary above renders its fallback as if render had thrown
  }
  …
}
```

Use it when the failure is one the *widget* cannot continue from. A
validation error or a 409 is not that — those belong in state, rendered
inline. `withErrorBoundary(Uploader, { fallbackRender })` is the same thing
as an HOC — one line, injects nothing; JSX wrapping is usually clearer.

📖 [react-error-boundary — README](https://github.com/bvaughn/react-error-boundary#readme)

**→ In the demos:** Demo 17, Lab 5 — `WidgetBoundary` around the cart body and the uploader, with a dev-only "Break this widget" button.

---

## 14. Where boundaries go, and what they do not catch

### What is and is not caught

| Thrown from | Caught? | Instead |
|---|---|---|
| render, a child's render, `useMemo`, a lazy component's load | **yes** | — |
| an **event handler** (`onClick`, `onSubmit`) | **no** — React does not own that call; the render is long over | `try/catch`, state, or `showBoundary` |
| **async** code: `await`, `setTimeout`, `.then`, a socket message | **no** — same reason | a status in state (the four-state machine), or `showBoundary` |
| an **effect** body | only a synchronous throw; an awaited rejection is async — no | cleanup + an `AbortError` guard ([Module 12 §11](../12-effects/#11-data-fetching-in-an-effect)) |
| the **boundary's own fallback** | no — the *next* boundary up | keep fallbacks simple |
| **server rendering** | not the same way: there is no client-side recovery during SSR; inside a `<Suspense>` boundary React emits the fallback and retries on the client, outside one the request fails | framework-level handling; a root boundary for the client |

The unifying rule: a boundary catches errors thrown **while React is
rendering**. A handler runs because the browser dispatched an event; a promise
rejects on its own schedule. In both cases React is not on the stack.

```tsx
<button onClick={() => { throw new Error('nope'); }}>Delete</button>          // ✗ not caught — a handler
useEffect(() => { fetchCart().then(() => { throw new Error('nope'); }); }, []); // ✗ not caught — async
function Bomb(): never { throw new Error('Boom'); }                            // ✓ caught — thrown during render
```

### Three levels

| Level | Catches | Fallback | Where |
|---|---|---|---|
| **Root** | everything nobody else caught | a full-page "something went wrong", a way home | once, on the root route |
| **Route** | a loader, action or render in one route | replaces the route; layout and navbar stay | each route that can fail *interestingly* |
| **Widget** | one component that should fail alone | an inline alert with "Try again" | the cart drawer, an uploader, each dashboard panel |

React Router's route boundaries are error boundaries with routing awareness —
`ErrorBoundary` on the route object, `useRouteError()` to read what was thrown:

```tsx
{ path: 'products/:productId', Component: ProductDetailPage, loader: productDetailLoader, ErrorBoundary: ProductErrorBoundary }

export function ProductErrorBoundary() {
  const error = useRouteError();                  // unknown — the router cannot know what your loaders throw
  if (isRouteErrorResponse(error) && error.status === 404) {
    return <Alert variant="warning">Product not found. <Link to="/products">Browse all products</Link></Alert>;
  }
  return <Alert variant="danger">{error instanceof Error ? error.message : 'Please try again.'}</Alert>;
}
```

Three shapes to narrow, in order: a thrown `Response` (`isRouteErrorResponse`),
an `Error` (`instanceof`), anything else. Reading `error.status` before
narrowing is a compile error — which is the bug the JavaScript version
shipped.

### The blast radius is the decision

A failure is caught by the *nearest* boundary above it, and everything under
that boundary is replaced. One root boundary means a broken thumbnail in a
side drawer blanks the catalogue; a boundary on every component means two
hundred fallbacks and no idea which ones matter. The question for each:
**if this subtree fails, can the user still do the thing they came for?** The
cart failing should not stop browsing; the product page failing should not
remove the navbar; the root failing is what the full-page fallback is for.

**→ In the demos:** Demo 10, Lab 5 — `RootErrorBoundary` and `ProductErrorBoundary`; Demo 17, Lab 5 — per-widget boundaries.

---

## 15. `useId` and `useDebugValue`

### `useId`

```tsx
const id = useId();          // "«r1»" — unique per instance, identical on server and client
<label htmlFor={id}>Email</label>
<input id={id} aria-describedby={`${id}-hint`} />
<p id={`${id}-hint`}>We never share it.</p>
```

Why not a counter or `Math.random()`: a counter diverges between server and
client (a hydration mismatch); `Math.random()` is a new id every render.
`useId` is derived from the component's position in the tree, so it is the
same on both sides and stable across renders.

Two rules: **never for list keys** (keys come from the data,
[Module 6](../06-conditional-rendering-and-lists/)); and when you need several
ids in one component, call it once and suffix — the `-tab-` and `-panel-`
helpers in [§2](#2-compound-components). The generated string is not a valid
CSS selector by design: it is for `id`/`aria-*`, not `querySelector`.

📖 [react.dev — `useId`](https://react.dev/reference/react/useId)

### `useDebugValue`

Labels a custom hook in React DevTools. Useful in shared hooks; noise in
one-off ones.

```tsx
useDebugValue(isControlled ? 'controlled' : 'uncontrolled');   // inside useControllableState
useDebugValue(date, (d) => d.toISOString());                   // defer an expensive format — runs only when DevTools inspects
```

Naming matters more than this hook: DevTools shows `useControllableState`
under the component because the function is called that.

📖 [react.dev — `useDebugValue`](https://react.dev/reference/react/useDebugValue)

---

## 16. React 19 changes that touch these patterns

| Change | Before | React 19 |
|---|---|---|
| `ref` on a function component | stripped; needed `forwardRef` | **an ordinary prop** — `forwardRef` deprecated for new code |
| Ref callbacks | returned nothing | **may return a cleanup**, like an effect |
| Rendering a context provider | `<Ctx.Provider value>` | **`<Ctx value>`** — `.Provider` still works, deprecated |
| `defaultProps` on function components | supported | **removed** — use default parameters |
| `propTypes` | checked in development | **removed** — use TypeScript |
| String refs, legacy context | deprecated | removed |
| Caught errors | re-thrown; logged twice | **logged once** via `console.error`, with the component stack |
| Error reporting | per boundary | root options `onCaughtError`, `onUncaughtError`, `onRecoverableError` |
| `useId` format | `:r1:` | `«r1»` |

**Wrapper and polymorphic components no longer need `forwardRef`.** A
`<Button>` that must accept a ref takes it as a prop:

```tsx
// React 19
export function Button({ ref, variant = 'primary', ...rest }: ComponentProps<'button'> & { variant?: Variant }) {
  return <button ref={ref} className={buttonClass(variant)} {...rest} />;
}

// before 19 — you will read this constantly in library source
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ variant = 'primary', ...rest }, ref) {
  return <button ref={ref} className={buttonClass(variant)} {...rest} />;
});
```

`ComponentProps<'button'>` includes `ref`; `ComponentPropsWithoutRef`
excludes it. Use the former when the wrapper forwards one. "The ref points at
the wrapper" was one more reason HOCs lost ([§8](#8-higher-order-components)).

**One reporting hook for every boundary.** `onCaughtError` on `createRoot`
fires for any error a boundary caught, `onUncaughtError` for the ones nothing
caught. A reporting SDK belongs there, once; a boundary's `onError` is then
the *local* decision (what to log with the widget's name), not the pipeline.

```tsx
createRoot(document.getElementById('root')!, {
  onCaughtError:   (error, info) => reportError(error, { caught: true,  stack: info.componentStack }),
  onUncaughtError: (error, info) => reportError(error, { caught: false, stack: info.componentStack }),
}).render(<App />);
```

**`<TabsContext value>`** in [§2](#2-compound-components) is the React 19
form; every pre-19 library reads `<TabsContext.Provider value>` and means the
same thing.

📖 [react.dev — React 19](https://react.dev/blog/2024/12/05/react-19) · [React 19 Upgrade Guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)
📖 [react.dev — `forwardRef`](https://react.dev/reference/react/forwardRef) · [`createRoot` options](https://react.dev/reference/react-dom/client/createRoot#parameters)

---

## 17. Self-check

1. For each row of [§1](#1-a-component-api-is-a-contract-about-ownership),
   say who owns what and name the ShopScope component that uses the pattern.
2. Why does `<Tabs.Tab>` never receive `selected` as a prop, and why is the
   context not exported?
3. Why handle arrow keys on the list rather than on each tab? Why are
   inactive panels `hidden` rather than `null`?
4. State the three rules of the `onChange` contract. Which does
   `onChange(event)` break, and what breaks later because of it?
5. `const page = value ?? internal` — describe the bug precisely. What is a
   state reducer?
6. Write the type for a polymorphic `<Text as>`. Why is a plain `Omit` wrong
   when `as` can be a union, and where is the one cast?
7. In `<DataTable rows={users} columns={COLUMNS} />`, where does `T` come
   from? Why does `satisfies Column<DirectoryUser>[]` beat an annotation?
8. What does `NoInfer<T>` prevent in `SelectField`? Give the call that
   compiles without it and should not.
9. Why does `{children}` inside a stateful component not re-render when that
   component's state changes?
10. Give one render prop that should stay a render prop and one that should
    become a hook, with the reason for each.
11. List the five things to read, in order, when you meet an HOC. Where is
    the cast, and why must it exist? Give four reasons hooks replaced HOCs.
12. Convert `componentDidMount` / `componentDidUpdate(prevProps)` /
    `componentWillUnmount` into one `useEffect`. What replaces `deps`, and why?
13. A `<div onClick>` wraps a portalled dialog. Does a click inside fire it?
    Why? What does that do to a "click outside" handler? Why does the dialog
    still see `useTheme()`?
14. Name what `<dialog>.showModal()` gives you that a `createPortal` dialog
    must implement, and the two things a hand-rolled one usually never does.
15. In `useFocusTrap`, why must `document.activeElement` be captured before
    `focus()` is called?
16. Why is an error boundary a class? Name the two methods, what each does,
    and in which phase.
17. For each, is it caught: a throw in render · in `useMemo` · in `onClick` ·
    after `await` · in the boundary's own fallback · during SSR?
18. Explain `resetKeys`, `onReset` and `showBoundary`. What happens if
    `onReset` does not fix the cause? When is `showBoundary` the wrong tool?
19. Why is `FallbackComponent={(p) => <X {...p} />}` a bug while
    `fallbackRender={(p) => <X {...p} />}` is fine?
20. Root, route, widget: what does each catch, what does the user keep, and
    what question decides where a boundary goes?
21. Why `useId` and not a counter? Why never for keys?
22. Three React 19 changes that affect wrapper or compound components, and
    what you write instead in each case.

### Practical

1. Build `<Tabs>` as a compound component with a private context, `useId`
   wiring and the roving-tabindex keyboard pattern; prove one Tab stop enters
   and leaves the list.
2. Add `value` / `defaultValue` / `onChange` to a component that supported
   one mode, through `useControllableState`; make it warn when a caller
   switches mode.
3. Type `<Text as>` and `<Select<T>>`; produce the compile errors on purpose
   (`href` on an `<h2>`, a mismatched `onChange`), then remove `NoInfer` and
   watch the second one compile.
4. Build an accessible modal with `createPortal`: focus trap, Escape, focus
   restored to the trigger, `aria-modal`; prove bubbling with a counter on a
   React ancestor; compare with `<dialog>`; then replace it with a library
   and list what the library handles that you did not.
5. Wrap a route in a route `ErrorBoundary` and a widget in
   `react-error-boundary`; add a "Try again" that actually recovers, with
   `resetKeys` and an `onReset` that clears the cause.
6. Convert one HOC and one render-prop component into hooks; keep the
   originals labelled `@deprecated`.

---

## 18. References

Official React documentation, plus the `react-error-boundary` README.

**Patterns**
- [Passing Props to a Component](https://react.dev/learn/passing-props-to-a-component)
- [Passing JSX as children](https://react.dev/learn/passing-props-to-a-component#passing-jsx-as-children)
- [Passing Data Deeply with Context](https://react.dev/learn/passing-data-deeply-with-context)
- [Sharing State Between Components](https://react.dev/learn/sharing-state-between-components)
- [Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [Preserving and Resetting State](https://react.dev/learn/preserving-and-resetting-state)
- [Using TypeScript](https://react.dev/learn/typescript)
- [`<input>` — controlled and uncontrolled](https://react.dev/reference/react-dom/components/input)

**Portals and dialogs**
- [`createPortal`](https://react.dev/reference/react-dom/createPortal)
- [Manipulating the DOM with Refs](https://react.dev/learn/manipulating-the-dom-with-refs)
- [Common components (including `<dialog>`)](https://react.dev/reference/react-dom/components/common)
- [`useId`](https://react.dev/reference/react/useId)

**Error boundaries**
- [`Component` — catching rendering errors with an error boundary](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [`static getDerivedStateFromError`](https://react.dev/reference/react/Component#static-getderivedstatefromerror)
- [`componentDidCatch`](https://react.dev/reference/react/Component#componentdidcatch)
- [`createRoot` — `onCaughtError`, `onUncaughtError`, `onRecoverableError`](https://react.dev/reference/react-dom/client/createRoot#parameters)
- [`Suspense`](https://react.dev/reference/react/Suspense)
- [react-error-boundary — README](https://github.com/bvaughn/react-error-boundary#readme)

**React 19 and the rules**
- [React 19](https://react.dev/blog/2024/12/05/react-19)
- [React 19 Upgrade Guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)
- [`forwardRef`](https://react.dev/reference/react/forwardRef)
- [`useDebugValue`](https://react.dev/reference/react/useDebugValue)
- [Rules of React](https://react.dev/reference/rules)

---

**Previous:** [Module 15 — Performance & Optimisation](../15-performance/)
**Next:** [Module 17 — TypeScript with React](../17-typescript-with-react/)
