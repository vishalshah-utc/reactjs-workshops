# Demo 10 — Loaders, Actions & Error Boundaries

**Demo guide** · ~120 minutes · data before render, mutations as routes, failures with a home

---

## Where you are starting from

The starter is **Demo 9, finished**: a routed app with a layout, a detail
page, and every filter in the URL. Every page still fetches *after* it
renders — empty shell, skeleton, content — and a missing product shows an
inline alert instead of a 404.

New stubs: `src/hooks/useDebouncedCallback.ts`, `src/routes/RootErrorBoundary.tsx`,
`src/routes/ProductErrorBoundary.tsx`. Finished: `src/routes/AppBootSplash.tsx`.

## What you ship today

Route **loaders** that fetch before the page renders and run in parallel;
a progress bar and dimmed page while the next one loads; the add/edit form as
a router `<Form>` posting to a route **action** with server-side-style
validation and automatic refetch; delete through a **fetcher** that doesn't
navigate; and **error boundaries** at two levels — one that keeps the navbar
when a product is missing, one that catches everything else.

By the end you will be able to answer, without hesitating:

- What a loader is, what it receives, and why `request.signal` matters
- Why nested loaders don't waterfall, and what that means for `useEffect` fetching
- What `useNavigation` reports and where the progress bar lives
- How `<Form>` + `action` replaces `useState` + `onChange` + `saving` + `try/catch`
- Return vs throw in an action, and why validation errors are *returned*
- When to use a fetcher instead of a `<Form>`
- What `useRouteError` gives you, the three shapes it can be, and where boundaries belong

> **DummyJSON simulates writes.** After a create, the router re-runs the
> loader — correctly — and the list it fetches doesn't include the new
> product, because the server never stored it. The flash message says so. The
> request, the response, the redirect and the revalidation are all real; only
> persistence is fake. Against your own API the re-fetched list would simply
> contain the new row.

---

## Before the demo (5 minutes)

```
https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/10-loaders-actions-and-error-boundaries/starter
```

> ⚠️ Click once, bookmark the `stackblitz.com/edit/…` URL.

Locally: `cd demos/10-loaders-actions-and-error-boundaries/starter && npm install && npm run dev`.

---

## The cold open

Throttle the Network tab to **Slow 3G**. Click a product.

Watch the sequence: the list vanishes → an empty page with a back link → a
grey skeleton → the product. Three renders to show one thing, and the request
didn't even *start* until the second one. Now click **back**: the same
sequence in reverse, re-fetching a page you were just looking at.

Every fetch in this app follows the same order: **render, then effect, then
fetch, then render again.** The router can invert it.

---

## Lab 1 — Loaders: data before render (35 min)

### Problem

`ProductDetailPage` renders, *then* `useApi` fires, *then* the page re-renders
with data. On a slow connection the user watches all of it. And the list page
does the same for products *and* categories.

### Concept

**A loader fetches first; the component renders when the data is ready.**

```tsx
{
  path: 'products/:productId',
  Component: ProductDetailPage,
  loader: async ({ params, request }: LoaderFunctionArgs) => getProduct(params.productId ?? '', { signal: request.signal }),
}

function ProductDetailPage() {
  const product = useLoaderData<typeof loader>();   // already there on the FIRST render — and typed as Product
}
```

No `loading`, no `error`, no `useEffect`, no `useApi`.

**What a loader receives:**

```ts
async function loader({ request, params, context }: LoaderFunctionArgs) {
  request   // a real Request: request.url has the query string; request.signal aborts on navigation
  params    // Record<string, string | undefined> — the same strings useParams gives you
  context   // set by middleware (Demo 11)
}
```

**`request.signal` is the detail that matters most.** The router aborts it
when the user navigates away mid-load. Forward it to the service and stale
requests cancel themselves — the `AbortController` plumbing from Demo 5,
handled by the framework.

**What loaders give you that effects can't:**

| | `useEffect` + `useApi` | Loader |
|---|---|---|
| Fetch starts | after render | on link click, before render |
| Renders to show data | 2+ | 1 |
| Nested routes | **waterfall** — parent renders, then child fetches | all matched loaders run **in parallel** |
| Cancellation | you wire it | `request.signal` |
| Errors | state in every component | throw → route `ErrorBoundary` (Lab 5) |
| After a mutation | manual `reload()` | automatic revalidation (Lab 3) |
| Back button | refetch + spinner | instant, data reused |

**The rules:** loaders run outside React — no hooks. Return data or throw.
Read the URL from `request.url`, not `useSearchParams`.

**And the type flows from the return.** `useLoaderData<typeof loader>()` takes
the *loader function's type*, not a data type — the hook derives the data type
from what the loader returns. There is exactly one place the shape is written:
the `return` statement. Change the loader and every consumer updates; there is
no interface to keep in sync. (The same trick works for `useActionData<typeof action>()`
and `useFetcher<typeof action>()`.)

**Debounce the write, now.** In Demo 9 the search box wrote the URL per
keystroke and we debounced the *fetch*. With a loader, a URL change *is* a
fetch — so the URL write itself must be debounced. That means the input needs
local draft state again, and one new question: what if the URL's `q` changes
from *outside* — back button, shared link? The input must adopt it. The
React-docs answer is **"adjust state when a prop changes"**, done during
render with a comparison — not in an effect:

```tsx
const [seenQuery, setSeenQuery] = useState(filters.query);
if (filters.query !== seenQuery) {       // the URL changed under us
  setSeenQuery(filters.query);
  setQueryDraft(filters.query);
}
```

React re-runs the component immediately with the new state, before painting.
It's the one sanctioned place to call a setter during render.

### Steps

**A. `src/hooks/useDebouncedCallback.ts` — `TODO(lab-1.4)`**

```ts
import { useCallback, useEffect, useRef } from 'react';

/** Generic over the callback's arguments, so the returned function has the same signature as the one you passed in. */
export function useDebouncedCallback<TArgs extends unknown[]>(
  callback: (...args: TArgs) => void,
  delay = 400,
): (...args: TArgs) => void {
  const callbackRef = useRef(callback);              // always the latest callback, never stale
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);   // works in the browser AND under Node types
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);   // don't fire after unmount
  }, []);

  return useCallback(
    (...args: TArgs) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => callbackRef.current(...args), delay);
    },
    [delay],
  );
}
```

Delete `src/hooks/useDebouncedValue.ts` — this replaces it.

**B. `src/routes/ProductDetailPage.tsx` — `TODO(lab-1.2)`**

Add the loader above the component and strip the component down:

```tsx
import { Link, useLoaderData, type LoaderFunctionArgs } from 'react-router';   // useParams, useCallback, useApi, ErrorNotice go
import { getProduct } from '../api/services/products';

export async function productDetailLoader({ params, request }: LoaderFunctionArgs) {
  const productId = params.productId ?? '';   // params are string | undefined — the route guarantees it, TS can't
  return getProduct(productId, { signal: request.signal });
}

export function ProductDetailPage() {
  const product = useLoaderData<typeof productDetailLoader>();   // Product — typed from the loader's return
  return (
    <>
      {/* back link, unchanged */}
      {/* the <Card> that was inside `product && !loading && (…)` — now unconditional */}
    </>
  );
}
```

Delete the `ErrorNotice`, the `loading` placeholder, the `useApi` call and
the `useParams` call. The component just lost half its lines, all ceremony.
(A 404 currently blows up — Lab 5 fixes that; leave it.)

**C. `src/routes/ProductsPage.tsx` — `TODO(lab-1.1)`**

Add the loader above the component:

```tsx
import { useLoaderData, type LoaderFunctionArgs } from 'react-router';
import { listCategories, listProducts } from '../api/services/products';
import { parseSort, type SortKey } from '../lib/catalog';
import type { CategoryOption } from '../types';

export async function productsLoader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get('q') ?? '';
  const category = url.searchParams.get('category') ?? '';
  const sort = (url.searchParams.get('sort') ?? '') as SortKey;
  const page = Math.max(0, Number(url.searchParams.get('page') ?? '1') - 1);
  const { sortBy, order } = parseSort(sort);

  // Both requests start at the same instant — no waterfall. Categories are
  // optional, so their failure must not sink the page: allSettled, not all.
  const [productsResult, categoriesResult] = await Promise.allSettled([
    listProducts({ q, category, sortBy, order, page, limit: PAGE_SIZE, signal: request.signal }),
    listCategories({ signal: request.signal }),
  ]);

  if (productsResult.status === 'rejected') throw productsResult.reason;

  // allSettled's tuple is typed: .status narrows to 'fulfilled', and .value is ApiCategory[]
  const categories: CategoryOption[] =
    categoriesResult.status === 'fulfilled' ? categoriesResult.value.map((c) => ({ id: c.slug, name: c.name })) : [];

  return { result: productsResult.value, categories };   // no annotation: the RETURN TYPE is what useLoaderData will see
}
```

The loader reads the query string from `request.url` — it runs outside React
and has no hooks. `useProductFilters` stays for *writing* params; the loader
owns *reading* them. Same contract, two sides.

In the component, replace both `useApi` calls with:

```tsx
// Typed from the loader itself: { result: ProductListResponse; categories: CategoryOption[] }
const { result, categories } = useLoaderData<typeof productsLoader>();
```

Delete: `useApi`/`useCallback`/`useDebouncedValue` imports, `fetchProducts`,
`loading`, `error`, `reload`, `setResult`, the `<ErrorNotice error={error}…/>`
and the `loading ? <CardSkeletons/> : …` ternary (render the grid
directly). Then the debounced search box:

```tsx
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';
// …
const [queryDraft, setQueryDraft] = useState(filters.query);
const commitQuery = useDebouncedCallback((query: string) => updateFilters({ query }), 400);   // commitQuery: (query: string) => void

const [seenQuery, setSeenQuery] = useState(filters.query);
if (filters.query !== seenQuery) {
  setSeenQuery(filters.query);
  setQueryDraft(filters.query);
}

function handleQueryChange(value: string) {
  setQueryDraft(value);
  commitQuery(value);
}
// …
<ProductToolbar query={queryDraft} onQueryChange={handleQueryChange} … />
// …the category pill also clears the draft:
onSelect={(category) => { setQueryDraft(''); updateFilters({ category, query: '' }); }}
```

`handleSave` and `handleDelete` still call `setResult`, which no longer
exists — **comment those two functions out for now**; Labs 3 and 4 replace
them with an action. (Or delete them and the Add/Edit/Delete wiring, and
re-add in Lab 3.)

**D. `src/router.tsx` — `TODO(lab-1.3)`**

```tsx
import { ProductsPage, productsLoader } from './routes/ProductsPage';
import { ProductDetailPage, productDetailLoader } from './routes/ProductDetailPage';
// …
{ path: 'products', Component: ProductsPage, loader: productsLoader },
{ path: 'products/:productId', Component: ProductDetailPage, loader: productDetailLoader },
```

### Verify

Network tab open. Click a product: the request fires **on the click**, before
the URL even changes — and the page appears complete, no skeleton. Throttle to
Slow 3G and click again: **the list stays on screen** while the detail loads
(Lab 2 makes that visible). Press back: **instant** — no request.

Type in the search box: instant to type, one `search?q=…` request 400 ms after
you stop. Press the browser back button after a few searches: the URL's `q`
changes *and the box updates to match*. Delete the three `seenQuery` lines and
press back again — the URL changes, the box doesn't. Put them back.

### Watch out

**`params.productId` is `string | undefined`.** The route pattern guarantees it
exists, but the type system can't read route patterns. `params.productId ?? ''`
settles it; a `!` would too, but `?? ''` fails soft if the route is ever renamed.

**`fetcher.data.deleted` without narrowing.** The action returns three shapes
(`ProductFormActionData | DeleteActionData | Response`); the compiler won't let
you read `.deleted` until you've proved which one you have — `'ok' in fetcher.data`.
That check is not ceremony: without it, an edit-form failure would also try to
render as a delete result.

**Hooks in a loader.** *"Invalid hook call."* Loaders are plain functions;
read `request.url` and `params`.

**Forgetting `request.signal`.** Navigate away mid-load and the request runs
to completion for nothing. On a slow connection, three quick clicks = three
full downloads.

**`Promise.all` for optional data.** A categories outage would blank the
whole products page. `allSettled`, and decide per result.

**`setQueryDraft(filters.query)` in a `useEffect`.** Works a render late and
the lint rule rejects it. Compare-and-set during render.

### Challenge (2 min)

`PAGE_SIZE` is read from `env` at module scope. Could the loader read
`limit` from the URL instead (`?limit=24`)? What would you have to validate,
and what should happen with `?limit=99999`?

### In the real world

"All matched loaders run in parallel" is the sentence that sells loaders to
teams. A layout that loads the user and a child that loads their orders is a
*waterfall* with effects — the layout must render before the child mounts.
With loaders, the router matches both routes first and fires both requests
at once. On a deep tree that's the difference between 400 ms and 1.6 s.

---

## Lab 2 — Pending UI (15 min)

### Problem

Between clicking a link and the new page appearing, **nothing happens**. On
a fast connection that's fine. On Slow 3G the app looks frozen.

### Concept

**`useNavigation()` tells you what the router is doing:**

```ts
const navigation = useNavigation();
navigation.state      // "idle" | "loading" | "submitting" — a union, so a typo in a comparison is a compile error
navigation.location   // where we're going (while not idle)
navigation.formData   // what was submitted (while submitting)
```

Put it in the **layout**, once, and every page gets pending feedback.

**The initial load is different.** There's no previous page to keep on
screen; the router runs the root loaders against a blank window. `HydrateFallback`
on the root route is what to show *then* — and only then.

### Steps

**A. `src/routes/RootLayout.tsx` — `TODO(lab-2.1)`**

```tsx
import { Container, ProgressBar } from 'react-bootstrap';
import { Outlet, ScrollRestoration, useNavigation } from 'react-router';
// …
const navigation = useNavigation();
const busy = navigation.state !== 'idle';
// …
<SiteHeader … />

{/* A fixed-height slot so the layout doesn't jump when the bar appears. */}
<div style={{ height: 3 }} aria-hidden={!busy}>
  {busy && <ProgressBar now={100} animated striped style={{ height: 3, borderRadius: 0 }} aria-label="Loading" />}
</div>

<Container className="py-4">
  {/* The OLD page stays on screen, dimmed, while the next page's loaders run. */}
  <div className={busy ? 'opacity-50' : ''} style={{ transition: 'opacity .15s' }}>
    <Outlet context={outletContext} />
  </div>
</Container>
```

**B. `src/router.tsx` — `TODO(lab-2.2)`**

```tsx
import { AppBootSplash } from './routes/AppBootSplash';
// …
{
  path: '/',
  Component: RootLayout,
  HydrateFallback: AppBootSplash,   // first load only, while root loaders run against a blank page
  children: [ … ],
}
```

### Verify

Slow 3G. Click between Products and a detail page: a thin striped bar
appears under the navbar, the current page dims, the new page swaps in whole.
No skeleton flash, no empty state. Hard-refresh: the boot splash, then the
app.

### Watch out

**Pending UI in each page** instead of the layout. Twelve copies, and the
one page you forget has none.

**Confusing `HydrateFallback` with a loading state.** It renders once, on
initial load. Subsequent navigations keep the old page on screen — that's
the default and it's usually what you want.

### Challenge (2 min)

`NavLink`'s `className` function receives `{ isActive, isPending }`. Use
`isPending` to dim the link you *clicked* while its loaders run. Which
feedback do users notice first — the bar or the link?

---

## Lab 3 — Actions and `<Form>` (35 min)

### Problem

`ProductForm` is 120 lines: a `draft` object, a `set()` helper, `saving`,
`error`, `submitted`, a `try/catch`, and a parent `handleSave` that merges
into state we no longer own. And after a save, the page can't refetch —
`setResult` is gone.

### Concept

**Loaders read; actions write.**

```tsx
{ path: 'products', Component: ProductsPage, loader: productsLoader, action: productsAction }
```

```tsx
<Form method="post">
  <input name="title" />
  <button type="submit">Create</button>
</Form>
```

The router serialises the form, calls the action with a `Request`, and — the
important part — **automatically re-runs every loader on the page afterwards**.
The list refreshes itself. No `setResult`, no merge.

**Uncontrolled inputs.** `name` + `defaultValue`, no `value`/`onChange`. The
DOM holds the state until submit. That's not a regression from Demo 4 — it's
the right tool now that something else (the action) owns the lifecycle, and
Demo 4's fields were built to allow it.

**Return for expected failures, throw for unexpected ones.** Validation is
expected — `return { errors, values }` and the component reads it with
`useActionData()`; the form stays open and repopulates. A 500 is unexpected —
`throw`, and the error boundary takes over.

**The return type says it.** `Promise<ProductFormActionData | Response>` reads
as the whole design: a rejected submit comes back as *data*; a successful one
comes back as a *redirect*. `useActionData<typeof productsAction>()` sees only
the data half — the router consumes the `Response` before it ever reaches a
component.

**One action, several intents.** A hidden `<input name="intent" value="create">`
lets one route action handle create, update and delete with a `switch`.

**Redirect on success — POST/Redirect/GET.** `return redirect(url)` from the
action means a browser refresh doesn't re-submit, and the URL is honest.

**The modal is URL state too.** `?new=1` opens the create form; `?edit=42`
opens edit. The action's redirect strips those params — which *closes the
modal* — and adds `?flash=…`, which the page shows as an alert. No `showForm`
state, no "close on success" effect, and the open form survives a refresh.

**Name collision.** `Form` from `react-router` and `Form` from
`react-bootstrap` are different components with the same name. Alias the
router's: `import { Form as RouterForm } from 'react-router'`.

### Steps

**A. `src/components/ProductForm.tsx` — `TODO(lab-3.1)`**

Replace the file. Same field components — **used uncontrolled**. New props:
`action`, `actionData`, `submitting`:

```tsx
import { Button, Col, Modal, Row, Spinner } from 'react-bootstrap';
import { Form as RouterForm } from 'react-router';
import { NumberField, SelectField, TextAreaField, TextField } from './fields';
import type { CategoryOption, Product, ProductDraft } from '../types';

/** What the route action returns when a submit is rejected: which fields, and what the user had typed. */
export interface ProductFormActionData {
  errors?: Partial<Record<keyof ProductDraft | 'form', string>>;
  values?: Partial<Record<keyof ProductDraft, string>>;
}

interface ProductFormProps {
  show: boolean;
  editing?: Product | null;
  categories: CategoryOption[];
  /** Post to THIS url (path + search), so the action can redirect back to exactly this view. */
  action: string;
  actionData?: ProductFormActionData;
  submitting: boolean;
  onClose: () => void;
}

export function ProductForm({ show, editing = null, categories, action, actionData, submitting, onClose }: ProductFormProps) {
  const errors = actionData?.errors ?? {};
  const values = actionData?.values ?? {};
  /** A failed submit's value beats the product being edited beats the fallback. */
  const initial = (field: keyof ProductDraft, fallback: string | number = ''): string | number =>
    values[field] ?? editing?.[field] ?? fallback;
  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));

  return (
    <Modal show={show} onHide={onClose} centered backdrop={submitting ? 'static' : true}>
      <RouterForm method="post" action={action} replace>
        <input type="hidden" name="intent" value={editing ? 'update' : 'create'} />
        {editing && <input type="hidden" name="id" value={editing.id} />}

        <Modal.Header closeButton={!submitting}>
          <Modal.Title className="h6">{editing ? `Edit “${editing.title}”` : 'Add a product'}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {/* No value, no onChange: `name` + `defaultValue` flow through to the DOM (TextField's ControlRest, Demo 4) */}
          <TextField controlId="pf-title" label="Title" name="title" autoFocus
            defaultValue={initial('title')} error={errors.title} disabled={submitting} />

          <Row>
            <Col sm={6}>
              <NumberField controlId="pf-price" label="Price" prefix="$" name="price" min={0} step={0.01}
                defaultValue={initial('price')} error={errors.price} disabled={submitting} />
            </Col>
            <Col sm={6}>
              <NumberField controlId="pf-stock" label="Stock" name="stock" min={0} step={1}
                defaultValue={initial('stock', 10)} error={errors.stock} disabled={submitting} />
            </Col>
          </Row>

          <SelectField controlId="pf-category" label="Category" name="category" placeholder="Choose…" options={categoryOptions}
            defaultValue={initial('category')} error={errors.category} disabled={submitting} />

          <TextAreaField controlId="pf-description" label="Description" name="description" rows={2}
            defaultValue={initial('description')} disabled={submitting} />

          {errors.form && <div className="alert alert-danger mt-3 mb-0">{errors.form}</div>}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Spinner as="span" size="sm" animation="border" className="me-2" />}
            {submitting ? 'Saving…' : editing ? 'Save changes' : 'Create product'}
          </Button>
        </Modal.Footer>
      </RouterForm>
    </Modal>
  );
}
```

Count what's gone: `useState` (×5), `validateProduct`, `toDraft`, `set`,
`touch`, `errorFor`, `handleSubmit`, `handleClose`, `try/catch`. The form is
markup. And **the field components didn't change** — Demo 4 made
`value`/`onChange` optional precisely so they could go uncontrolled here.

`initial(field)` prefers the action's returned `values` (a failed submit),
then the product being edited, then a fallback. That one line is "keep the
user's input on error" *and* "prefill on edit".

**B. `src/routes/ProductsPage.tsx` — `TODO(lab-3.2)`** — the action, above
the component:

```tsx
import { data, redirect, useActionData, useLocation, useNavigation, useSearchParams, type ActionFunctionArgs } from 'react-router';
import { createProduct, deleteProduct, listCategories, listProducts, updateProduct } from '../api/services/products';
import { ApiError } from '../lib/ApiError';
import { ProductForm, type ProductFormActionData } from '../components/ProductForm';
import type { ProductDraft } from '../types';

/** The return type is the contract with the form: errors + values on failure, a redirect Response on success. */
export async function productsAction({ request }: ActionFunctionArgs): Promise<ProductFormActionData | Response> {
  const formData = await request.formData();
  const intent = formData.get('intent');
  const url = new URL(request.url);
  const text = (key: string) => String(formData.get(key) ?? '');   // FormData gives string | File | null — settle it once

  /** Redirect back to the same list (filters intact), modal closed, with a flash. */
  const done = (flash: string) => {
    url.searchParams.delete('new');
    url.searchParams.delete('edit');
    url.searchParams.set('flash', flash);
    return redirect(url.pathname + url.search);
  };

  if (intent === 'create' || intent === 'update') {
    const values = {
      title: text('title').trim(),
      price: text('price'),
      category: text('category'),
      stock: text('stock'),
      description: text('description').trim(),
    };

    const errors: ProductFormActionData['errors'] = {};   // keys checked against ProductDraft | 'form'
    if (values.title.length < 2) errors.title = 'Give it a name of at least 2 characters.';
    if (!(Number(values.price) > 0)) errors.price = 'Price must be more than zero.';
    if (!values.category) errors.category = 'Pick a category.';
    if (!(Number(values.stock) >= 0)) errors.stock = 'Stock cannot be negative.';
    if (Object.keys(errors).length > 0) return { errors, values };        // RETURN — form stays open

    const payload: ProductDraft = { ...values, price: Number(values.price), stock: Number(values.stock) };

    try {
      const saved = intent === 'update' ? await updateProduct(text('id'), payload) : await createProduct(payload);
      return done(`“${saved.title}” ${intent === 'update' ? 'updated' : 'created'} (server id ${saved.id}).`);
    } catch (error) {
      return { errors: { form: ApiError.from(error).message }, values };   // server failure: still keep the form
    }
  }

  throw data({ message: `Unknown intent: ${String(intent)}` }, { status: 400 });  // THROW — a bug, not user input
}
```

Then in the component, the modal becomes URL-driven:

```tsx
const actionData = useActionData<typeof productsAction>();   // typed from the action — minus the Response branch
const navigation = useNavigation();
const location = useLocation();
const [searchParams, setSearchParams] = useSearchParams();

const editingId = searchParams.get('edit');
const editing = editingId ? (result.products.find((p) => String(p.id) === editingId) ?? null) : null;
const formOpen = searchParams.has('new') || !!editing;
const flash = searchParams.get('flash');

function setParam(key: string, value: string | number | null) {
  setSearchParams((previous) => {
    const next = new URLSearchParams(previous);
    if (value === null) next.delete(key); else next.set(key, String(value));
    return next;
  }, { replace: true });
}

// The action can return the form's shape; narrow to it before handing it to the form.
const formActionData = actionData && 'errors' in actionData ? actionData : undefined;

const submitting = navigation.state === 'submitting';
```

Delete `showForm`, `editing` state, `openCreate`/`openEdit`/`closeForm`,
`handleSave`, `flash` state and `CARD_DEFAULTS`. Wire it:

```tsx
<Button size="sm" onClick={() => setParam('new', 1)}>…Add product</Button>
// …
{flash && (
  <Alert variant="success" dismissible onClose={() => setParam('flash', null)}>
    {flash} DummyJSON simulates writes — the list you see was re-fetched and does not include it.
  </Alert>
)}
// …
<ProductGrid … onEdit={(product) => setParam('edit', product.id)} />
// …
<ProductForm
  key={editing?.id ?? 'new'}
  show={formOpen}
  editing={editing}
  categories={categories}
  action={location.pathname + location.search}    // post to THIS url, filters and all
  actionData={formActionData}
  submitting={submitting}
  onClose={() => { setParam('new', null); setParam('edit', null); }}
/>
```

`action={location.pathname + location.search}` matters: the action's
`request.url` then carries the current filters, so `done()` can redirect back
to *exactly* this view.

**C. `src/router.tsx`** — add `action: productsAction` to the products route.

### Verify

Click **Add product** — the URL gains `?new=1`. **Refresh.** The modal is
still open. That's URL state.

Submit empty: four red messages, the modal stays, the URL still says `?new=1`
— the action *returned*. Fill it in, **Create**: the button spins (that's
`navigation.state === 'submitting'`), the Network tab shows `POST /products/add`
**then** `GET /products?…` — the revalidation — the modal closes (`?new` is
gone), and a flash says *created (server id 195)*. Press **back**: you don't
re-submit — POST/Redirect/GET.

Edit a product: `?edit=<id>`, prefilled. Change the price, save. `PATCH`,
then `GET`, flash, done.

### Watch out

**`throw`ing validation errors.** The error boundary replaces the *whole
page*, form and input gone. `return` them.

**Passing `value=` to a field inside a `<Form>`.** Without `onChange` it
freezes; with it you've rebuilt controlled state the router doesn't read.
`defaultValue=`, and let the DOM hold it.

**No `action=` prop.** The form posts to the route path *without* the query
string; the redirect lands on `/products` and your filters are gone.

**Forgetting the hidden `intent`.** The action falls through to *"Unknown
intent: null"* — a 400 in the boundary. Good: that's the throw doing its job.

### Challenge (2 min)

The action validates. The old `ProductForm` also validated, on the client.
Both, or one? Where would you put a rule like "title must be unique", and
why can't the client own it?

### In the real world

This is the shape mutations take in Remix, in React Router Framework Mode,
and (with different spelling) in Next.js Server Actions: a form posts, a
function on the route handles it, the page's data revalidates. Learning it in
Data Mode means you'll recognise it everywhere.

---

## Lab 4 — Fetchers (15 min)

### Problem

Delete is a mutation too — but it shouldn't navigate. A `<Form>` would push
history and redirect; we just want the request, the pending state, and the
revalidation, while staying exactly where we are.

### Concept

**`useFetcher()` is a submission that doesn't navigate.**

| API | Does |
|---|---|
| `fetcher.submit(data, { method })` | submit to the route action, no navigation |
| `fetcher.Form` | a form that does the same |
| `fetcher.state` | `"idle"` / `"submitting"` / `"loading"` (revalidating) |
| `fetcher.data` | whatever the action returned |
| `fetcher.formData` | the in-flight submission — the key to "which row is busy" |

Each fetcher is independent. Here one fetcher on the page is enough — only
one delete happens at a time, and `fetcher.formData.get('id')` says which
card. Demo 13 gives every row its own for optimistic UI.

### Steps

**`src/routes/ProductsPage.tsx` — `TODO(lab-4.1)`**

Add the delete branch to the action, before the create/update branch:

```tsx
interface DeleteActionData {
  ok: boolean;
  deleted?: string;
  error?: string;
}

// …and the action's return type widens to cover it:
export async function productsAction({ request }: ActionFunctionArgs): Promise<ProductFormActionData | DeleteActionData | Response> {
  // …
  if (intent === 'delete') {
    try {
      const removed = await deleteProduct(text('id'));
      return { ok: true, deleted: removed.title };
    } catch (error) {
      return { ok: false, error: ApiError.from(error).message };
    }
  }
```

No redirect — a fetcher's result comes back as `fetcher.data`, not a
navigation. In the component:

```tsx
import { useFetcher } from 'react-router';
// …
const fetcher = useFetcher<typeof productsAction>();          // fetcher.data is typed from the action
const deletingId = fetcher.formData?.get('id')?.toString() ?? null;

// The action returns different shapes for different intents; narrow to the delete one.
const deleteData = fetcher.data && 'ok' in fetcher.data ? fetcher.data : undefined;

function confirmDelete() {
  if (!pendingDelete) return;
  fetcher.submit({ intent: 'delete', id: pendingDelete.id }, { method: 'post' });
  setPendingDelete(null);     // close the dialog now; the card shows busy until the action settles
}
// …
{deleteData?.deleted && fetcher.state === 'idle' && (
  <Alert variant="success">
    “{deleteData.deleted}” deleted — the server confirmed it, then the list re-fetched (and, DummyJSON being simulated, it came back).
  </Alert>
)}
{deleteData?.ok === false && fetcher.state === 'idle' && <Alert variant="danger">{deleteData.error}</Alert>}
// …
<ProductGrid … busyId={deletingId} />
// …
<ConfirmDialog … onConfirm={confirmDelete} />
```

Delete the old `handleDelete`, `deleting`, `deleteError`. Make `submitting`
ignore deletes so the *modal's* spinner doesn't react to a fetcher:

```tsx
const submitting = navigation.state === 'submitting' && navigation.formData?.get('intent') !== 'delete';
```

Then give the card a `busy` state. In **`ProductGrid.tsx`**, accept `busyId`
and pass `busy={String(product.id) === String(busyId)}`; in **`ProductCard.tsx`**,
accept `busy` and use it: `className={\`h-100 ${isOutOfStock || busy ? 'opacity-50' : ''}\`}`,
`aria-busy={busy}`, and `disabled={busy}` on the edit and delete buttons.

### Verify

Trash → Delete. The dialog closes at once; that card dims; `DELETE /products/<id>`
fires, then `GET /products?…` — the revalidation — and the card un-dims. The
alert explains what happened. **The URL didn't change and the page didn't
scroll.** That's the difference from a `<Form>`.

Break it (`remove: (id) => \`/products/${enc(id)}x\``): the card dims, then a
red alert with the `ApiError` message. Fix it.

### Watch out

**A `<Form method="post">` for delete.** Works, but pushes a history entry per
delete and re-runs *navigation*. Fetcher.

**`fetcher.data` persisting.** The success alert stays until the next
submission. Fine for a demo; a real app would key it off `fetcher.state` and
a timeout, or clear it on navigation.

### Challenge (2 min)

`fetcher.formData` holds the in-flight submission. Instead of dimming the
card, *remove* it from the rendered list while `deletingId` matches. That's
optimistic UI in one line — and Demo 13 shows why it's better than the
snapshot-and-rollback version.

---

## Lab 5 — Route error boundaries (20 min)

### Problem

Visit `/products/999999`. The loader throws, nothing catches it, and the
**whole app is replaced** by React Router's default error screen — navbar and
all. A missing product should not take the site down.

### Concept

**Throw from a loader or action, and the nearest `ErrorBoundary` renders in
place of that route** — everything above it stays on screen.

```tsx
{ path: 'products/:productId', Component: ProductDetailPage, loader, ErrorBoundary: ProductErrorBoundary }
```

**`useRouteError()` returns whatever was thrown**, and there are three shapes
to handle:

In TypeScript that is spelled `unknown`, and it's the honest type: the router
cannot know what your loaders throw. `isRouteErrorResponse` is a type guard;
`instanceof Error` and `instanceof ApiError` are the others. Read `.status`
before narrowing and the compiler stops you — which is exactly the bug the JS
version of this boundary would have shipped.

```tsx
const error = useRouteError();   // unknown — the router can't know what your loaders throw
if (isRouteErrorResponse(error)) { /* 1. data() / redirect(): has .status, .statusText, .data */ }
else if (error instanceof Error) { /* 2. a real Error — our ApiError */ }
else { /* 3. someone threw a string */ }
```

**Turn a 404 `ApiError` into a thrown Response.** `throw data({ message },
{ status: 404 })` makes the status a first-class part of the error, so the
boundary can render a *specific* page instead of a generic one.

**Where they belong.** At least one on the root — the safety net. Then one on
each route that can fail *interestingly*, so the failure is scoped.

Route error boundaries also catch **render** errors. They're React error
boundaries with routing awareness — a home for the class component you'd
otherwise hand-write.

### Steps

**A. `src/routes/ProductDetailPage.tsx`** — make the loader throw a proper 404:

```tsx
import { Link, data, useLoaderData, type LoaderFunctionArgs } from 'react-router';
import { ApiError } from '../lib/ApiError';

export async function productDetailLoader({ params, request }: LoaderFunctionArgs) {
  const productId = params.productId ?? '';
  try {
    return await getProduct(productId, { signal: request.signal });
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) {
      throw data({ message: `No product with id ${productId}.` }, { status: 404, statusText: 'Not Found' });
    }
    throw error;
  }
}
```

**B. `src/routes/RootErrorBoundary.tsx` — `TODO(lab-5.1)`**

```tsx
import { Alert, Button, Container } from 'react-bootstrap';
import { Link, isRouteErrorResponse, useRouteError } from 'react-router';
import { env } from '../config/env';
import { ApiError } from '../lib/ApiError';

/** useRouteError() returns `unknown` — three shapes to narrow, in order. */
export function RootErrorBoundary() {
  const error = useRouteError();

  let title = 'Something went wrong';
  let message = 'An unexpected error occurred. Please try again.';
  let status: number | undefined;
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    // 1. A Response thrown with data() / redirect(): has status + statusText
    status = error.status;
    title = status === 404 ? 'Page not found' : `${status} ${error.statusText}`;
    const body = error.data as { message?: unknown } | null;
    if (typeof body?.message === 'string') message = body.message;
  } else if (error instanceof Error) {
    // 2. A real Error — our ApiError lands here (and it carries a status)
    message = error.message;
    stack = error.stack;
    if (error instanceof ApiError) status = error.status;   // a plain Error has no .status — narrow again
  }
  // 3. anything else — someone threw a string — keeps the defaults

  return (
    <Container className="py-5">
      <Alert variant="danger">
        <Alert.Heading>{title}</Alert.Heading>
        <p>{message}</p>
        {env.isDev && stack && (
          <pre className="small bg-body-secondary p-2 rounded mt-3 mb-0" style={{ maxHeight: 240 }}>{stack}</pre>
        )}
        <hr />
        <div className="d-flex gap-2">
          <Link to="/products" className="btn btn-outline-danger">Back to products</Link>
          {(status === undefined || status >= 500) && (
            <Button variant="danger" onClick={() => window.location.reload()}>Reload</Button>
          )}
        </div>
      </Alert>
    </Container>
  );
}
```

It renders its own `Container`: if the root route itself failed, `RootLayout`
never rendered, so there's no layout to sit inside.

**C. `src/routes/ProductErrorBoundary.tsx` — `TODO(lab-5.2)`**

```tsx
import { Alert, Button } from 'react-bootstrap';
import { Link, isRouteErrorResponse, useRouteError } from 'react-router';

export function ProductErrorBoundary() {
  const error = useRouteError();   // unknown

  if (isRouteErrorResponse(error) && error.status === 404) {
    const body = error.data as { message?: unknown } | null;   // `data` is whatever was thrown — say what you expect, then check
    return (
      <Alert variant="warning">
        <Alert.Heading className="h5">Product not found</Alert.Heading>
        <p>{typeof body?.message === 'string' ? body.message : "That product doesn't exist, or it was removed."}</p>
        <Link to="/products" className="btn btn-outline-secondary">Browse all products</Link>
      </Alert>
    );
  }

  return (
    <Alert variant="danger">
      <Alert.Heading className="h5">Couldn't load this product</Alert.Heading>
      <p>{error instanceof Error ? error.message : 'Please try again.'}</p>
      <Button variant="outline-danger" onClick={() => window.location.reload()}>Retry</Button>
    </Alert>
  );
}
```

**D. `src/router.tsx` — `TODO(lab-5.3)`**

```tsx
import { RootErrorBoundary } from './routes/RootErrorBoundary';
import { ProductErrorBoundary } from './routes/ProductErrorBoundary';
// …
{
  path: '/',
  Component: RootLayout,
  ErrorBoundary: RootErrorBoundary,
  HydrateFallback: AppBootSplash,
  children: [
    // …
    {
      path: 'products/:productId',
      Component: ProductDetailPage,
      loader: productDetailLoader,
      ErrorBoundary: ProductErrorBoundary,
    },
```

### Verify

`/products/999999`: *"Product not found"* **with the navbar still there**.
Remove `ErrorBoundary: ProductErrorBoundary` and reload: the root boundary
takes over and replaces the whole screen. Put it back — that difference is
the entire argument for scoping.

Set `VITE_API_BASE_URL=https://localhost:9` in `.env.development`, restart,
visit a product: the generic branch, with the `ApiError`'s network message.
Fix it.

Submit the form with a bogus intent (edit the hidden input in DevTools to
`intent="explode"`): the *root* boundary — *"400 Bad Request — Unknown
intent"* — because the products route has no boundary of its own. Should it?

### Watch out

**No root boundary.** One unhandled throw anywhere and the user sees React
Router's developer error page. Always have one.

**Only a root boundary.** Every failure wipes the navbar. Scope them.

**Checking `error.status` without `isRouteErrorResponse`.** An `ApiError`
has a `status` too — which is fine here, but a thrown string has neither.
Branch on shape first.

### Challenge (2 min)

Add an `ErrorBoundary` to the `products` list route. What should it show for a
network failure that the root one shouldn't? (Hint: the toolbar and pills are
still meaningful even when the grid can't load.)

### In the real world

Before route boundaries, teams wrapped pages in a hand-written class component
and hoped. Now the failure of a loader, an action, or a render has a *place* —
scoped to the part of the screen that broke, with the rest of the app still
usable. Users who can still click the navbar don't file "the site is down".

---

## Wrap-up — what you can now do

- [x] Fetch in a loader with `request.signal`, and read the URL from `request.url`
- [x] Run parallel requests in one loader and decide which failures are fatal
- [x] Debounce a URL write and sync an input from the URL without an effect
- [x] Show pending UI from the layout with `useNavigation`, and a boot splash with `HydrateFallback`
- [x] Post a router `<Form>` to a route action; return validation, throw bugs, redirect on success
- [x] Drive a modal and a flash message from the URL
- [x] Mutate without navigating with a fetcher, and mark the busy row from `fetcher.formData`
- [x] Throw `data()` for a 404 and render it in a scoped boundary

**What's still true:** anyone can add, edit and delete. There's no login,
no user, and no page that only some people may see. Demo 11.

## Next demo

**Demo 11 — Authentication & Protected Routes.** JWT login as a route
action, the token attached by an interceptor, a silent refresh queue that
survives six concurrent 401s, `redirectTo` after login, middleware-protected
routes, and a role gate — with a real `admin` and a real `user` account to
show the difference.

---

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| *"Invalid hook call"* in a loader | Loaders aren't components. Use `request.url` and `params`. |
| Search fires a request per keystroke | The URL write isn't debounced. `useDebouncedCallback`. |
| Back button changes the URL but not the search box | Missing the compare-and-set `seenQuery` lines. |
| Form submit replaces the page with an error | You threw validation errors. Return them. |
| Filters lost after saving | No `action=` on the form; the redirect lands on bare `/products`. |
| Modal won't close after save | The redirect didn't strip `new`/`edit` — check `done()`. |
| Delete navigates / scrolls to top | You used a `<Form>`. Use `fetcher.submit`. |
| Missing product blanks the whole app | No `ErrorBoundary` on the detail route. |
| Boot splash never goes away | The root loader threw before the app rendered — check the root boundary and the console. |
| `'productId' is possibly 'undefined'` in a loader | `params.productId ?? ''` — the route pattern guarantees it, the type can't. |
| `Property 'deleted' does not exist on type 'ProductFormActionData \| DeleteActionData'` | The action returns several shapes. Narrow first: `'ok' in fetcher.data`. |
| `'error' is of type 'unknown'` in an ErrorBoundary | `useRouteError()` is `unknown`. `isRouteErrorResponse(error)` / `error instanceof Error` before reading anything. |
