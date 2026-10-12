# Module 26 — Accessibility in React

**Study notes** · ~3 hours

> **Goal.** An interface that cannot be operated from the keyboard, or that a
> screen reader describes as "button, button, button", is not unpolished — it
> is broken for the people who hit the gap. This module is the discipline
> behind Module 10's accessible validation and Module 11's focus management:
> semantic HTML, the accessibility tree, keyboard and focus, ARIA used rarely
> and correctly, the handful of components that need real care, and the tests
> that keep all of it from regressing.

**Prerequisites:** [Module 10 §10](../10-forms/#10-accessibility) (labels,
errors, `useId`), [Module 11](../11-refs-and-the-dom/) (DOM refs,
`useImperativeHandle`),
[Module 6 §18](../06-conditional-rendering-and-lists/#18-accessibility-of-conditional-ui).

---

## Contents

1. [Correctness, not polish](#1-correctness-not-polish)
2. [Semantic HTML first](#2-semantic-html-first)
3. [The accessibility tree](#3-the-accessibility-tree)
4. [Keyboard navigation](#4-keyboard-navigation)
5. [Focus management in a SPA](#5-focus-management-in-a-spa)
6. [ARIA: when, and the first rule](#6-aria-when-and-the-first-rule)
7. [Live regions](#7-live-regions)
8. [State and relationship attributes](#8-state-and-relationship-attributes)
9. [Accessible components](#9-accessible-components)
10. [Forms and validation](#10-forms-and-validation)
11. [Colour, contrast, motion and dark mode](#11-colour-contrast-motion-and-dark-mode)
12. [Images and icons](#12-images-and-icons)
13. [Loading and empty states](#13-loading-and-empty-states)
14. [Testing accessibility](#14-testing-accessibility)
15. [Common React-specific mistakes](#15-common-react-specific-mistakes)
16. [Self-check](#16-self-check)
17. [References](#17-references)

**Hands-on.** [Demo 15 — Refs, the DOM & Keyboard Accessibility](../../demos/15-refs-dom-and-accessibility/)
builds the focus and announcement layer this module describes — `/` focuses
search, a failed submit focuses the first invalid field, route changes are
announced, `TextField` exposes `focus()`, and a keyboard pass closes the
session. [Demo 22 — Production Readiness](../../demos/22-production-readiness/)
turns the checklist into an audit: `@axe-core/react` in development,
`vitest-axe` in tests, one screen-reader pass. The dialog and tabs in §9 are
Demo 17's. Versions throughout: React 19.3, react-bootstrap 2.10, axe-core
4.13, @testing-library/react 16.3.

---

## 1. Correctness, not polish

"Works with a mouse" is a partial pass. Unplug it and ShopScope — complete
and deployed at the end of Demo 14 — fails four times in three minutes: the
header search swallows Enter, a navigation leaves focus nowhere and says
nothing, a failed submit leaves the cursor on the button, and `/` does not
reach the search box. None is a style issue. Each is a feature that does not
work for a class of users:

| User | What breaks |
|---|---|
| Keyboard-only (motor impairment, RSI, power users) | anything only a pointer can reach or close |
| Screen reader | anything with no name, no role, or no announcement |
| Low vision, zoom, vestibular conditions | colour-only cues, clipping at 400%, motion that cannot be turned off |

The bar is **WCAG 2.2 level AA** — what contracts and most accessibility
laws point at — organised by four principles: **Perceivable**, **Operable**,
**Understandable**, **Robust**. Criteria are cited by number below.

**Why React in particular.** A SPA removes the focus reset and page
announcement a full load gives for free; libraries hide the focus trap inside
`<Modal>` until a replacement loses it; and `<div onClick>` is one line.

📖 [W3C — WCAG 2.2](https://www.w3.org/TR/WCAG22/) ·
[W3C WAI — WCAG 2 Overview](https://www.w3.org/WAI/standards-guidelines/wcag/)

---

## 2. Semantic HTML first

Most accessibility is choosing the right element. The browser then supplies
the role, the keyboard behaviour, the focusability and the name.

### Landmarks and headings

Screen-reader users jump by landmark the way sighted users scan a layout:

```tsx
// RootLayout.tsx
<a href="#main" className="visually-hidden-focusable">Skip to content</a>
<SiteHeader />                              {/* <header> → <nav>, and a <form role="search"> */}
<main id="main" ref={mainRef} tabIndex={-1}>
  <Outlet />
</main>
<CartDrawer />                              {/* role="dialog", when open */}
```

Two `<nav>`s need distinguishing names (`aria-label="Main"`, `"Account"`).
One `<h1>` per page, levels that do not skip — the heading hierarchy is the
outline a screen reader lists. Style is independent of level:
`<h1 className="h3">` is exactly right.

### Buttons, links and divs

| It… | Element | What you get free |
|---|---|---|
| Changes the URL | `<a href>` / `<Link to>` | role link, Enter, middle-click, hover URL, history |
| Does something on this page | `<button type="button">` | role button, Enter **and** Space, focus, `disabled` |
| Does neither | `<span>`, `<div>` | nothing, correctly |

A `<div onClick>` has no role, no name, no focus, no keyboard activation and
no `disabled`. `role="button" tabIndex={0} onKeyDown` gets three of the five
back in twelve lines; the `<button>` is one. Demo 17's `LinkOrButton` makes
TypeScript enforce the choice: `variant: 'link'` requires `to` and forbids
`disabled`, because a link cannot be disabled.

The rest of the vocabulary: `<ul>` for a set ("list, 12 items"), `<dl>` for
key–value facts, `<table>` with `<th scope>` for data, `<fieldset>` +
`<legend>` for input groups, `<details>` for a collapsible section, `<dialog>`
for a modal. React changes nothing but `htmlFor` and `className`
([Module 4 §7](../04-components-and-jsx/#7-attributes-the-differences-from-html)).

📖 [MDN — HTML elements reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements) ·
[W3C APG — Landmark Regions](https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/)

---

## 3. The accessibility tree

The browser builds a second tree from the DOM: one node per element that
matters to assistive technology, each with a **role**, a **name**, a
**state** (pressed, expanded) and **properties** (described-by, level).
Hidden content — `display: none`, `hidden`, `aria-hidden="true"` — is left
out. That tree is what a screen reader reads; DevTools → Elements →
**Accessibility** shows it.

**How a name is computed:** `aria-labelledby` → `aria-label` → native (an
associated `<label>`, `alt`, a button's text) → `title`. An icon-only
button's content is an `<svg>` with no text, so its name is empty — the most
common axe finding:

```tsx
<Button aria-label={`Remove ${line.title}`} onClick={…}><Trash /></Button>   // ✓ named
```

### Testing Library queries are tree queries

`getByRole` searches the accessibility tree, not the DOM — which is why it
heads the priority order. A test written with it also asserts the tree:

| Query | What it proves |
|---|---|
| `getByRole('button', { name: 'Add to cart' })` | the right role **and** an accessible name |
| `getByLabelText('Search products')` | the input is labelled |
| `getByText` | visible text exists; nothing about semantics |
| `getByTestId` | nothing — a last resort |

If the query is hard to write, the tree is wrong: "I cannot find the button"
usually means there is no button. `logRoles(container)` prints the tree.

📖 [MDN — Accessibility tree](https://developer.mozilla.org/en-US/docs/Glossary/Accessibility_tree) ·
[Testing Library — Priority](https://testing-library.com/docs/queries/about/#priority)

---

## 4. Keyboard navigation

**2.1.1 Keyboard:** everything a pointer can do, a keyboard can do.

### Tab order and visible focus

Tab follows **DOM order**. CSS that reorders visually (`order`,
`row-reverse`) does not reorder Tab (2.4.3 Focus Order).

| `tabIndex` | Meaning |
|---|---|
| none | native focusability — buttons yes, divs no |
| `0` | in the Tab order, at its DOM position |
| `-1` | **not** in the Tab order, but `node.focus()` works — the tool of focus management |
| `1`+ | jumps the queue; never |

**2.4.7 Focus Visible.** `* { outline: none }` is the most common regression
a design review introduces. `:focus-visible` shows the ring for keyboard
focus only, and Bootstrap 5.3 already uses it. ShopScope removes the outline
on exactly one element — `<main tabIndex={-1}>` — because a ring around the
whole page is noise. **2.4.11 Focus Not Obscured:** a sticky header must not
cover the focused element; `scrollMarginTop: '4.5rem'` on the target.

### Skip links

**2.4.1 Bypass Blocks.** The first Tab stop jumps past the header, invisible
until focused:

```tsx
<a href="#main" className="visually-hidden-focusable position-absolute top-0 start-0 m-2 btn btn-primary" style={{ zIndex: 1100 }}>
  Skip to content
</a>
```

It works because `<main id="main" tabIndex={-1}>` can take focus. A skip
link to an element that cannot scrolls and does nothing else.

### Keyboard shortcuts

`/` to search is a convention users bring from GitHub and Gmail. The hook
ignores modifier combinations and — crucially — the key while typing:

```ts
export function useKeyboardShortcut(key: string, handler: (event: KeyboardEvent) => void): void {
  const handlerRef = useLatest(handler);
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== key || event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;      // input, textarea, select, contentEditable
      event.preventDefault();                         // Firefox opens quick-find on "/"
      handlerRef.current(event);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [key, handlerRef]);
}
```

```tsx
const searchRef = useRef<HTMLInputElement>(null);
useKeyboardShortcut('/', () => { searchRef.current?.focus(); searchRef.current?.select(); });
<Form.Control ref={searchRef} type="search" placeholder="Search products — press /" />
```

The placeholder advertises it. **2.1.4 Character Key Shortcuts**: a single-character shortcut
must be switchable off or remappable, because a speech-input user saying
"slash" triggers it. Ignoring it while typing is the minimum; a setting is
the full answer.

### Roving tabindex

A tab list, toolbar or menu is **one** Tab stop; arrows move inside it. The
selected item has `tabIndex={0}`, the others `-1`, and one handler on the
container moves focus:

```tsx
<button role="tab" tabIndex={isSelected ? 0 : -1} aria-selected={isSelected} …>

function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
  const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)'));
  const index = tabs.findIndex((tab) => tab === document.activeElement);
  const next = nextTabIndex(event.key, index, tabs.length);   // ArrowLeft/Right wrap; Home/End
  if (index === -1 || next === undefined) return;
  event.preventDefault();          // otherwise End scrolls the page
  tabs[next].focus();
  tabs[next].click();              // automatic activation: focusing selects
}
```

The contract users expect: Tab moves *between* widgets, arrows/Home/End
*within* one, Enter activates links and buttons, Space buttons, Escape closes
and returns focus to the opener.

**→ In the demos:** Demo 15 Lab 2 (`/` focuses search) and Lab 5 (skip link,
the keyboard pass); Demo 17 Lab 1 (roving tabindex in `<Tabs>`).

📖 [W3C APG — Developing a Keyboard Interface](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/) ·
[MDN — `tabindex`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/tabindex) ·
[MDN — `:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible)

---

## 5. Focus management in a SPA

The rule: **focus follows the action.** Opened something — focus goes in.
Closed it — focus goes back. Submitted and failed — focus goes to the
failure. Navigated — focus goes to the new page. Each is a DOM ref and a
`.focus()` call, which is why this module builds on Module 11.

### Route changes

A SPA swaps the `<Outlet>` and leaves focus on a link that no longer exists,
so the next Tab starts from `<body>`:

```tsx
export function RouteAnnouncer({ mainRef }: { mainRef: RefObject<HTMLElement | null> }) {
  const { pathname } = useLocation();
  const lastAnnounced = useRef<string | null>(null);

  useEffect(() => {
    if (lastAnnounced.current === null) { lastAnnounced.current = pathname; return; }   // first render IS a page load
    if (lastAnnounced.current === pathname) return;
    lastAnnounced.current = pathname;

    const main = mainRef.current;
    if (!main) return;
    const heading = main.querySelector<HTMLElement>('h1');
    const target = heading?.hasAttribute('tabindex') ? heading : main;
    target.focus({ preventScroll: true });          // ScrollRestoration owns the scroll
    document.title = `${heading?.textContent?.trim() || 'ShopScope'} · ShopScope`;
    // …announce — §7
  }, [pathname, mainRef]);                          // pathname ONLY: ?q= changes are not a new page
}
```

The heading opts in with `tabIndex={-1}`; `<main>` is the fallback. The
dependency is `pathname`, not `location` — otherwise every keystroke in the
search box, which writes `?q=`, yanks focus to the heading.

### The first invalid field

**3.3.1 Error Identification.** After a failed submit a keyboard user is
still on the button. Collect field nodes in a `Map` through ref callbacks
([Module 11 §8](../11-refs-and-the-dom/#8-a-list-of-refs)) and focus the
first in **screen order**:

```tsx
const FIELD_ORDER: (keyof ProductDraft)[] = ['title', 'price', 'stock', 'category', 'description'];

useEffect(() => {
  const first = FIELD_ORDER.find((name) => actionData?.errors?.[name]);
  if (!first) return;
  getFieldNodes().get(first)?.querySelector<HTMLElement>('input, select, textarea')?.focus();
}, [actionData]);         // a NEW object per submission, the SAME one across re-renders
```

Depend on `actionData`, not a derived `errors` that is a new `{}` every
render — that refocuses the field on every keystroke.

### Returning focus after a dialog closes

Capture who had focus **before** moving it; restore in the cleanup
([Module 16 §11](../16-advanced-patterns/#11-dialogs-focus-escape-restore-and-dialog)).
React Bootstrap's `Modal` and `Offcanvas` do it for you — and the demo sets
`restoreFocus`, `autoFocus`, `enforceFocus` and `keyboard` explicitly anyway:
accessibility that lives in a default is accessibility a version bump can
remove.

There is a race. A drawer restores focus when its slide-out ends (300 ms);
the announcer moves focus when the loader finishes (50 ms to 2 s). On a slow
network the drawer fires last and steals focus back from the new page. The
fix is not a timeout; it is deciding, at the action, which one stands down:

```tsx
const [restoreFocus, setRestoreFocus] = useState(true);
function followLink() { setRestoreFocus(false); close(); }     // the new page takes focus

<Offcanvas restoreFocus={restoreFocus} onExited={() => setRestoreFocus(true)} …>
  <Link to={`/products/${line.productId}`} onClick={followLink}>{line.title}</Link>
```

### Exposing `focus()` from a component

A design-system input its parent cannot focus is half a component. In React
19 `ref` is a prop; `useImperativeHandle` hands out two verbs and nothing
else ([Module 11 §10](../11-refs-and-the-dom/#10-useimperativehandle)):

```tsx
export interface TextFieldHandle { focus: () => void; select: () => void; }

export function TextField({ ref, controlId, label, ...rest }: TextFieldProps) {   // ref?: Ref<TextFieldHandle>
  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    select: () => inputRef.current?.select(),
  }), []);
  return <FieldShell controlId={controlId} label={label}><Form.Control ref={inputRef} {...rest} /></FieldShell>;
}

// after the library's own focus management — not an effect racing it
<Modal onEntered={() => titleRef.current?.select()}><TextField ref={titleRef} … /></Modal>
```

**→ In the demos:** Demo 15 Lab 2 (route change, first invalid field), Lab 3
(`TextFieldHandle`), Lab 5 (the drawer's focus race).

📖 [react.dev — `useImperativeHandle`](https://react.dev/reference/react/useImperativeHandle) ·
[W3C — Understanding 3.3.1 Error Identification](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html)

---

## 6. ARIA: when, and the first rule

ARIA changes what the accessibility tree says. **That is all it does.**
`role="button"` on a `<div>` makes a screen reader say "button"; it does not
make the div focusable, make Enter or Space fire `onClick`, or give it
`disabled`. ARIA describes behaviour you have implemented — it never
supplies it.

1. **If a native element has the semantics and behaviour, use it** —
   `<button>` before `role="button"`, `<dialog>` before `role="dialog"`.
   This is the first rule of ARIA.
2. **Do not change native semantics.** `<h2 role="tab">` stops being a heading.
3. **Every interactive ARIA control works with the keyboard.**
4. **Never `aria-hidden="true"` on a focusable element** — a silent Tab stop.
5. **Every interactive element has an accessible name.**

*No ARIA is better than bad ARIA* — an audit finds more defects caused by
ARIA than fixed by it. When it is genuinely needed:

| Need | Attribute | Native alternative? |
|---|---|---|
| A button that is on/off | `aria-pressed` | none |
| A control that opens a region | `aria-expanded` + `aria-controls` | `<details>` for simple cases |
| "You are here" in navigation | `aria-current="page"` | none |
| A hint or error on a field | `aria-describedby` | none |
| A region announced when it changes | `aria-live` / `role="status"` | `<output>` in a form |
| A widget HTML lacks (tabs, combobox) | the APG pattern's roles | none |

**In JSX,** `aria-*` keeps its hyphens and booleans are stringified —
`aria-pressed={false}` renders `"false"`, a meaningful value. For an absent
attribute pass `undefined`, never `''`:

```tsx
<input aria-describedby={error ? errorId : undefined} />   // undefined OMITS the attribute
```

An empty `aria-describedby` is a dangling reference
([Module 6 §17](../06-conditional-rendering-and-lists/#17-conditional-attributes-and-classes)).

📖 [W3C — Using ARIA: the first rule](https://www.w3.org/TR/using-aria/#rule1) ·
[W3C APG — Read Me First](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/) ·
[react.dev — Common components](https://react.dev/reference/react-dom/components/common)

---

## 7. Live regions

A **live region** is an element whose text changes are announced without
focus moving — how a screen-reader user learns the results count changed or
the page navigated (**4.1.3 Status Messages**).

| Attribute | Behaviour | Use for |
|---|---|---|
| `aria-live="polite"` | announced when the user pauses | almost everything |
| `aria-live="assertive"` | interrupts | errors that block the task |
| `role="status"` | `polite` + atomic | counts, "saved" |
| `role="alert"` | `assertive` + atomic; announced even when inserted | blocking errors |

**The region must exist before the text changes.** Screen readers announce
*changes* to a region they already know:

```tsx
{message && <div aria-live="polite">{message}</div>}                                     // ✗ silent
<div aria-live="polite" aria-atomic="true" className="visually-hidden">{message}</div>   // ✓
```

**The same text twice is not a change.** Clear, then set:

```tsx
if (liveRef.current) {
  liveRef.current.textContent = '';
  liveRef.current.textContent = `Navigated to ${title}`;
}
```

The announcer writes the region imperatively — React renders it empty, so
its text is yours by Module 11's rule — because an announcement is a side
effect, not render state; `setAnnouncement` in an effect is what
`react-hooks/set-state-in-effect` refuses.

**Do not chatter.** A count fed by the typed value is read on every
keystroke; feed it the debounced one.

ShopScope's three regions:

```tsx
// RouteAnnouncer — hidden, in the root layout so no navigation remounts it
<div ref={liveRef} aria-live="polite" aria-atomic="true" className="visually-hidden" />
// ProductToolbar — the visible count IS the region
<Badge bg="secondary" role="status">{resultCount} results</Badge>
// CartDrawer — not a disabled <button>, which Tab skips and reads as "dimmed"
<span className="btn btn-outline-secondary pe-none" aria-live="polite" aria-atomic="true">{line.qty}</span>
```

React ways to silence one: conditional rendering, a changing `key`, or a
parent inside the `<Outlet>` that remounts it on navigation.

**→ In the demos:** Demo 15 Lab 2 (`RouteAnnouncer`), Lab 5 (results count,
cart quantity).

📖 [MDN — ARIA live regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions) ·
[W3C — Understanding 4.1.3 Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)

---

## 8. State and relationship attributes

Each is state React already holds; the work is rendering it onto the DOM.

**`aria-pressed` — a toggle button.** Announced "Dark theme, toggle button,
pressed". Keep the name constant and let the attribute carry the state:

```tsx
<Button aria-pressed={theme === 'dark'} aria-label="Dark theme" onClick={toggleTheme}>
  {theme === 'dark' ? <Sun /> : <MoonStars />}
</Button>
```

**`aria-expanded` + `aria-controls` — a disclosure.** Whether it is open,
and what, so a screen reader can offer to jump there:

```tsx
<Button aria-expanded={showChart} aria-controls="price-histogram" onClick={toggleChart}>
  <BarChart aria-hidden="true" className="me-1" /> Prices
</Button>
{showChart && <Card id="price-histogram">…</Card>}
```

`<NavLink>` renders `aria-current="page"` itself — check before adding it.

**`aria-describedby`, `aria-invalid`, `aria-labelledby`.** The error's `id`
on the input's `aria-describedby`; `aria-invalid` marks the field
([Module 10 §10](../10-forms/#10-accessibility)). `aria-errormessage` is
newer but unevenly supported; `aria-describedby` is the reliable choice. A
dialog without `aria-labelledby` is announced as "dialog" and nothing else:

```tsx
<Offcanvas aria-labelledby="cart-drawer-title">
  <Offcanvas.Title id="cart-drawer-title">Your cart</Offcanvas.Title>
```

`disabled` removes a control from the Tab order; `aria-disabled="true"`
keeps it reachable so it can explain itself. A `disabled` submit on an
invalid form is a trap — a keyboard user cannot reach it to learn *why*.
Leave it enabled; let the submit focus the first error.

📖 [MDN — `aria-pressed`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-pressed) ·
[`aria-expanded`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-expanded) ·
[W3C — Understanding 4.1.2 Name, Role, Value](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html)

---

## 9. Accessible components

Five widgets account for most hand-rolled accessibility bugs. Each has a
pattern in the ARIA Authoring Practices Guide; implement it, or adopt a
library that has.

### Dialog: native `<dialog>` vs portal + focus trap

A modal must move focus in, trap it, restore it, close on Escape, announce
itself as a named dialog, and make the page behind unreachable. **Native
`<dialog>`** gets nearly all of it from the browser:

```tsx
function ConfirmDialog({ open, title, onCancel, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (open && dialog && !dialog.open) dialog.showModal();   // top layer; the rest becomes inert
    if (!open && dialog?.open) dialog.close();
  }, [open]);
  return (
    <dialog ref={ref} aria-labelledby={titleId} onCancel={onCancel} onClose={onCancel}>
      <h2 id={titleId}>{title}</h2>
      {children}
    </dialog>
  );
}
```

`showModal()` puts the dialog in the **top layer** above every z-index, makes
the rest of the page inert, fires `cancel` on Escape, and returns focus to
the previously focused element on close.

**Portal + focus trap** is what React Bootstrap's `Modal` does internally and
what [Module 16 §10](../16-advanced-patterns/#10-portals--createportal)
builds by hand — the markup, and a hook that traps:

```tsx
<div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>…</div>
```

```ts
useEffect(() => {
  const container = containerRef.current;
  if (!active || !container) return;
  const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;  // capture FIRST
  (focusables(container)[0] ?? container).focus();
  function handleKeyDown(event: KeyboardEvent) { /* Tab on last → first; Shift+Tab on first → last */ }
  container.addEventListener('keydown', handleKeyDown);
  return () => { container.removeEventListener('keydown', handleKeyDown); opener?.focus(); };   // RESTORE
}, [containerRef, active]);
```

| Behaviour | `<dialog>.showModal()` | `createPortal` + hooks |
|---|---|---|
| Above everything | top layer, `::backdrop` | a sibling of `#root`, z-index |
| Focus moved in, trapped, restored | built in | `useFocusTrap` |
| Escape | `cancel` event | a `keydown` listener |
| Announced as a dialog | implicit role | `role="dialog" aria-modal aria-labelledby` |
| Page behind unreachable | inert | `aria-modal` for screen readers; `inert` on `#root` for keyboards |
| Scroll lock, nested dialogs, iOS | mostly | you have not written it |

The last row is why the guidance is **library first**: React Bootstrap
2.10's `Modal`/`Offcanvas`, or Radix, Base UI and React Aria headlessly.
React 19 renders `inert` as a boolean attribute, so a portal dialog can set
it on the app root while open.

### Tabs

`role="tablist"` containing `role="tab"` buttons, each `aria-selected` and
`aria-controls` its `role="tabpanel"`, which is `aria-labelledby` its tab.
Roving tabindex ([§4](#4-keyboard-navigation)) moves between tabs; the panel
is a Tab stop so the keyboard can reach it:

```tsx
<div role="tablist" aria-label="Product information" onKeyDown={handleKeyDown}>
  <button role="tab" id={tabId} aria-selected={isSelected} aria-controls={panelId} tabIndex={isSelected ? 0 : -1}>Details</button>
</div>
<div role="tabpanel" id={panelId} aria-labelledby={tabId} hidden={!isSelected} tabIndex={0}>…</div>
```

`useId` generates the pairs so two `<Tabs>` cannot collide.

### Menus, toasts, disclosure

**Menus.** `role="menu"` is an *application* menu — arrows move, Escape
closes, letters jump. Site navigation is not one; `role="menu"` on it turns
every link into a "menu item" Tab no longer reaches. A dropdown of links is a
disclosure. A real menu button (`aria-haspopup="menu"`, `aria-expanded`,
roving focus) is the hardest of the five — use `Dropdown` or a headless
library.

**Toasts.** A live region that must not steal focus. `role="status"` for
success, `role="alert"` only for blocking errors; long enough to read (2.2.1
Timing Adjustable) — ShopScope holds errors 8 s, success 5 s — and never the
only place an action lives: an "Undo" that vanishes in five seconds is
unreachable for someone who needs ten to find it.

**Disclosure.** A `<button>` with `aria-expanded` and `aria-controls` — the
Prices button in [§8](#8-state-and-relationship-attributes). With no custom
styling, `<details><summary>` needs no JavaScript.

**→ In the demos:** Demo 17 Lab 1 (`<Tabs>`) and Lab 4 (portal `Dialog`,
`useFocusTrap`); Demo 15 Lab 4 (the Prices disclosure) and Lab 5 (the drawer).

📖 [W3C APG — Dialog (Modal)](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) ·
[Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) ·
[Menu Button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/) ·
[Disclosure](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) ·
[MDN — `<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog) ·
[react.dev — `createPortal`](https://react.dev/reference/react-dom/createPortal)

---

## 10. Forms and validation

[Module 10 §10](../10-forms/#10-accessibility) covers the mechanics — a
label for every input, `aria-describedby` for errors, `<fieldset>`, focus to
the first error, a live region for the result. What this module adds is the
audit of a library's defaults, because they are not all there.

React Bootstrap's `Form.Group controlId` wires `<label htmlFor>` — good. But
`Form.Control.Feedback` is shown by a CSS sibling selector and is **not**
associated with the input, and `isInvalid` adds a class but **not**
`aria-invalid`. A screen reader hears the label and nothing about the error.
`TextField` renders the control, so it can add both:

```tsx
<Form.Control
  isInvalid={Boolean(error)}
  aria-invalid={error ? true : undefined}
  aria-describedby={error ? `${controlId}-error` : hint ? `${controlId}-hint` : undefined}
/>
<Form.Control.Feedback type="invalid" id={`${controlId}-error`}>{error}</Form.Control.Feedback>
```

| Criterion | What to do |
|---|---|
| 3.3.2 Labels or Instructions | required fields marked in text, not only colour or `*` |
| 1.3.5 Identify Input Purpose | `autoComplete="email"`, `"given-name"`, `"postal-code"` |
| 3.3.3 Error Suggestion | "Enter a price greater than 0", not "Invalid" |
| 4.1.3 Status Messages | "Product saved" in a live region, not only a green banner |

**→ In the demos:** Demo 15 Lab 2 (first invalid field); Demo 22 Lab 1 fixes
what axe finds in the forms.

📖 [react.dev — `useId`](https://react.dev/reference/react/useId) ·
[W3C — Understanding 3.3.2 Labels or Instructions](https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html)

---

## 11. Colour, contrast, motion and dark mode

| Criterion | Ratio | Applies to |
|---|---|---|
| 1.4.3 Contrast (Minimum) | **4.5:1** | body text |
| 1.4.3 | 3:1 | large text (≥ 24 px, or ≥ 18.7 px bold) |
| 1.4.11 Non-text Contrast | **3:1** | focus rings, input borders, meaningful icons |

Bootstrap's defaults pass; combinations do not always — check `text-muted`
on `bg-body-secondary` in both themes. **1.4.1 Use of Color:** `StockBadge`
is green or red *and* says "In stock"/"Sold out"; a monochrome screenshot
must still make sense.

### Reduced motion

**2.3.3 Animation from Interactions.** Two functions: a handler reads the
preference *now*; a component subscribes so it re-renders if it flips:

```ts
const QUERY = '(prefers-reduced-motion: reduce)';

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(QUERY).matches;
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(prefersReducedMotion);
  useEffect(() => {
    const media = window.matchMedia(QUERY);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);
  return reduced;
}
```

```tsx
<ProgressBar now={100} animated={!reducedMotion} striped />
scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
```

Reduce, do not remove: the bar still shows; it holds still.

### Dark mode, zoom, target size

A theme is a contrast re-check, not a palette swap: `data-bs-theme="dark"`
re-maps Bootstrap's tokens, but colours you added need checking again. The
toggle is `aria-pressed`; the default honours `prefers-color-scheme`;
`color-scheme: light dark` matches scrollbars and form controls.
[Module 25 §10](../25-styling-and-theming/#10-a-persisted-theme-with-no-flash)
has the persisted theme and
[§12](../25-styling-and-theming/#12-styling-and-accessibility) the styling
side. **1.4.10 Reflow:** usable at 320 px wide. **1.4.4 Resize Text:** 200%
zoom — `rem`, not `px`. **2.5.8 Target Size:** 24 × 24 px per control —
small icon buttons need padding.

**→ In the demos:** Demo 15 Lab 5 (reduced motion on the progress bar and
smooth scrolls).

📖 [W3C — Understanding 1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) ·
[Understanding 2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) ·
[MDN — `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)

---

## 12. Images and icons

**1.1.1 Non-text Content.** Every image has an `alt`; its content depends on
what the image is *for*:

| Image is… | `alt` |
|---|---|
| Informative (the photo on a detail page) | what it shows: `"Essence Mascara, black, 8 ml tube"` |
| Decorative, or redundant with adjacent text | `alt=""` — **never omitted**; a missing `alt` reads the filename |
| Functional (a link's or button's only content) | the action: `"Open cart"` |
| Complex (a chart) | a short `alt` plus the data nearby as text |

The card's thumbnail link duplicates the title link, so it leaves the tree —
`aria-hidden` and `tabIndex={-1}` together, per rule 4 of [§6](#6-aria-when-and-the-first-rule):

```tsx
<Link to={`/products/${product.id}`} aria-hidden="true" tabIndex={-1}>
  <Card.Img src={product.thumbnail} alt="" loading="lazy" />
</Link>
```

`react-bootstrap-icons` renders an `<svg>` with no text:

```tsx
<Button aria-label={`Delete ${product.title}`}><Trash /></Button>       // icon-only: the button gets a name
<Button><BarChart aria-hidden="true" className="me-1" /> Prices</Button>  // icon + text: hide the icon
<canvas role="img" aria-label={`Price distribution of ${products.length} products`} />
<span role="img" aria-label="Rated 4.5 out of 5">★ 4.5</span>
```

📖 [W3C — Understanding 1.1.1 Non-text Content](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html) ·
[W3C WAI — Images Tutorial](https://www.w3.org/WAI/tutorials/images/) ·
[MDN — `aria-hidden`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-hidden)

---

## 13. Loading and empty states

The four states of a list
([Module 6 §15](../06-conditional-rendering-and-lists/#15-the-four-states-of-any-data-driven-list))
each have an accessibility shape.

**Loading.** The region is `aria-busy`, and **one** hidden status says what
is happening — not one per placeholder:

```tsx
<Row aria-busy="true">
  <span role="status" className="visually-hidden">Loading products</span>
  {Array.from({ length: count }, (_, i) => <Col key={i}><Placeholder … /></Col>)}
</Row>
```

The same goes for a `<Suspense fallback>`. A card mid-mutation is
`aria-busy={busy}`; the progress bar's wrapper is `aria-hidden={!busy}`.

**Empty** is content: a heading, a sentence, an action where the results
would have been. **Error** that stops the task is `role="alert"`, a failed
widget `role="status"`; the retry is a `<button>` naming what failed.

📖 [MDN — `aria-busy`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-busy) ·
[react.dev — `<Suspense>`](https://react.dev/reference/react/Suspense)

---

## 14. Testing accessibility

| Layer | Tool | Finds | Misses |
|---|---|---|---|
| Component tests | role queries, jest-dom, `user-event` | missing names and roles, focus movement, keys | contrast; anything not asserted |
| Automated audit | axe-core 4.13 — `@axe-core/react`, `vitest-axe`, Playwright | labels, roles, ARIA misuse, contrast (real browser), landmarks | focus order, focus restoration, Escape, whether a name makes sense |
| A human | keyboard pass, VoiceOver / NVDA | whether it is *usable* | nothing — but it does not scale |

### Role queries and keyboard tests

Every `getByRole` with a `name` is already an accessibility test
([Module 18 §18](../18-testing/#18-accessibility-in-tests)). jest-dom's
matchers (`toHaveAccessibleName`, `toHaveAccessibleDescription`,
`toBeInvalid`) and `user-event`'s keys do the half axe cannot:

```tsx
it('opens the cart, traps focus, and returns it on Escape', async () => {
  const { user } = renderWithProviders(<RootLayout />);
  const openButton = screen.getByRole('button', { name: /cart/i });

  await user.click(openButton);
  const drawer = await screen.findByRole('dialog', { name: 'Your cart' });
  expect(drawer).toContainElement(document.activeElement as HTMLElement);   // focus moved IN
  await user.tab();
  expect(drawer).toContainElement(document.activeElement as HTMLElement);   // and stays in
  await user.keyboard('{Escape}');
  expect(openButton).toHaveFocus();                                          // and came BACK
});
```

### `@axe-core/react` in development

Runs axe after React commits and logs violations to the console. Dev only,
dynamically imported so production never sees it:

```tsx
// main.tsx — before createRoot
if (import.meta.env.DEV) {
  Promise.all([import('@axe-core/react'), import('react'), import('react-dom')]).then(
    ([{ default: axe }, React, ReactDOM]) => axe(React, ReactDOM, 1000),   // 1000 ms debounce
  );
}
```

### `vitest-axe` in tests

```ts
// src/test/setup.ts
import * as axeMatchers from 'vitest-axe/matchers';
expect.extend(axeMatchers);
```

```tsx
import { axe } from 'vitest-axe';

it('has no axe violations', async () => {
  const { container } = renderWithProviders(<ProductCard product={makeProduct()} />);
  expect(await axe(container)).toHaveNoViolations();
});
```

Two limits. jsdom has no layout, so `color-contrast` cannot run — that needs
a real browser, i.e. Playwright. And a component alone has no landmarks, so
switch the `region` rule off for component tests. The page-level axe run and
a Playwright test that presses Tab, Enter and Escape belong in the
pipeline: Module 20 — Shipping to Production covers the gate; this module is
what the gate checks.

### The manual pass

Fifteen minutes per feature. **Keyboard**, mouse out of reach: Tab from the
address bar (skip link?); every control reachable in reading order with a
visible ring; Enter and Space on every button; every dialog — focus in,
Escape, focus back; every form submitted invalid; every navigation — focus
on the new page, title updated.

**VoiceOver** (macOS; NVDA on Windows): ⌘F5 toggles it; VO is
Control+Option; VO+→/← reads the next/previous item; VO+U opens the rotor to
jump by landmark, heading, link or form control; VO+Space activates. Listen
for a control with no name, a state not spoken ("pressed",
"expanded"), a change not announced, a dialog not called a dialog.

**→ In the demos:** Demo 22 Lab 1 (`@axe-core/react`, `vitest-axe`, fix every
finding, one screen-reader pass); Demo 15 Lab 5 (the keyboard pass).

📖 [axe-core — rule descriptions](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md) ·
[`@axe-core/react`](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/react) ·
[Testing Library — `user-event` keyboard](https://testing-library.com/docs/user-event/keyboard) ·
[jest-dom matchers](https://github.com/testing-library/jest-dom#custom-matchers)

---

## 15. Common React-specific mistakes

| Symptom | Cause | Fix |
|---|---|---|
| Tab skips a "button" | `<div onClick>` | `<button type="button">` |
| A link scrolls to the top or reloads | `<a href="#" onClick>` | it is a button |
| No focus ring anywhere | `outline: none` globally | `:focus-visible`; remove the rule |
| "Button" with nothing after | icon-only button, no name | `aria-label` |
| Announcement never happens | live region mounted with its text, or remounted by `key` | render it always, empty |
| Focus jumps to the heading while typing | announcer depends on `location` | depend on `pathname` |
| Focus stays on the button after a failed submit | no focus-first-error, or an effect on a new `{}` | effect keyed on the submission result |
| Focus lands on `<body>` when a dialog closes | opener captured after focus moved | capture first, restore in cleanup |
| Portalled dialog read after the footer, or Tab escapes it | content outside `<main>`, nothing moved focus, no trap | move focus in; `aria-modal`; `inert` on `#root` |
| `aria-describedby=""` | conditional set to `''` | `undefined` |
| Nav links are "menu items" Tab skips | `role="menu"` on navigation | `<nav><ul><a>` |
| Results count read on every keystroke | region fed the typed value | the debounced value |
| Dark theme fails contrast | custom colours not re-checked | run axe in both themes |

---

## 16. Self-check

1. Give three things a full page load does for accessibility that a SPA
   navigation does not. Which ShopScope component restores each?
2. A clickable card: link, button or neither? What is the test?
3. List five things a `<button>` gives you that `<div role="button">` does not.
4. What is the accessibility tree, and why is `getByRole` first in Testing
   Library's priority order?
5. How is an accessible name computed? Give the priority order.
6. Why is `outline: none` on `*` a bug? Where does ShopScope legitimately
   remove an outline?
7. What is WCAG 2.1.4's concern with `/` as a shortcut, and the mitigations?
8. Describe roving tabindex. Why is a tab list one Tab stop?
9. Why does `RouteAnnouncer` depend on `pathname` rather than `location`?
10. "Focus the first invalid field" — first in what order, and what should
    the effect depend on?
11. Describe the focus race between a closing drawer and a route change, and
    its fix.
12. State the first rule of ARIA. Give two things `role="button"` does not do.
13. Why is `{msg && <div aria-live>{msg}</div>}` silent? Why clear before set?
14. One ShopScope example each of `aria-pressed`, `aria-expanded`,
    `aria-selected`, `aria-current`.
15. Name four things `<dialog>.showModal()` gives you that a portal must
    implement.
16. What does `Form.Control.Feedback` *not* do for a screen reader?
17. Give the three contrast ratios and what each applies to.
18. What can `vitest-axe` under jsdom not check? Which checks can axe never do?

### Practical

1. Add a `RouteAnnouncer` to a React Router app and verify with VoiceOver
   that typing in search does not trigger it.
2. Build a `ConfirmDialog` on native `<dialog>`, then on `createPortal` with
   `useFocusTrap`. List what the second still lacks.
3. Build `<Tabs>` with roving tabindex and test ArrowRight, Home and End with
   `user.keyboard`.
4. Wire `@axe-core/react` and `vitest-axe`, fix every finding on the products
   page, and add the test that keeps it fixed.

---

## 17. References

**React**
- [Common components (`aria-*`, `tabIndex`, `inert`)](https://react.dev/reference/react-dom/components/common)
- [`useId`](https://react.dev/reference/react/useId) · [`useImperativeHandle`](https://react.dev/reference/react/useImperativeHandle) · [`createPortal`](https://react.dev/reference/react-dom/createPortal) · [`<Suspense>`](https://react.dev/reference/react/Suspense)
- [Manipulating the DOM with Refs](https://react.dev/learn/manipulating-the-dom-with-refs)
- [React 19 release notes](https://react.dev/blog/2024/12/05/react-19)

**WCAG 2.2**
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) · [WCAG 2 Overview](https://www.w3.org/WAI/standards-guidelines/wcag/)
- Understanding: [2.1.1 Keyboard](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html) · [2.1.4 Character Key Shortcuts](https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html) · [2.4.1 Bypass Blocks](https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html) · [2.4.3 Focus Order](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html) · [2.4.7 Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html) · [2.4.11 Focus Not Obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html)
- Understanding: [1.4.3 Contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) · [1.4.11 Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) · [2.5.8 Target Size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) · [3.3.1 Error Identification](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html) · [4.1.2 Name, Role, Value](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html) · [4.1.3 Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)
- [Images Tutorial](https://www.w3.org/WAI/tutorials/images/)

**ARIA and the Authoring Practices Guide**
- [Using ARIA — the rules](https://www.w3.org/TR/using-aria/#rule1) · [APG — Read Me First](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/)
- [APG — Keyboard Interface](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/) · [Landmark Regions](https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/)
- APG patterns: [Dialog (Modal)](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) · [Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) · [Menu Button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/) · [Disclosure](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) · [Alert](https://www.w3.org/WAI/ARIA/apg/patterns/alert/)

**MDN**
- [Accessibility tree](https://developer.mozilla.org/en-US/docs/Glossary/Accessibility_tree) · [HTML elements](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements) · [`<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog)
- [`tabindex`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/tabindex) · [`inert`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert) · [`:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible) · [`prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [ARIA live regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions) · [ARIA attributes](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes)

**axe-core 4.13**
- [axe-core](https://github.com/dequelabs/axe-core) · [Rule descriptions](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md) · [`@axe-core/react`](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/react)

**Testing Library**
- [Query priority](https://testing-library.com/docs/queries/about/#priority) · [`ByRole`](https://testing-library.com/docs/queries/byrole) · [`user-event` keyboard](https://testing-library.com/docs/user-event/keyboard) · [jest-dom matchers](https://github.com/testing-library/jest-dom#custom-matchers)

---

**Builds on:** [Module 10 — Forms & Controlled Components](../10-forms/) ·
[Module 11 — Refs & the DOM](../11-refs-and-the-dom/) ·
[Module 16 — Advanced Patterns, Error Boundaries & Portals](../16-advanced-patterns/)
**Gated by:** Module 20 — Shipping to Production (axe in CI)
