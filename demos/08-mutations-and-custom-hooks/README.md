# Demo 8 — Mutations & Custom Hooks

**Demo guide** · ~110 minutes · add, edit and delete become real requests; four effects become one hook

---

## Where you are starting from

The starter is **Demo 7, finished**: server-side search, filters and
pagination, categories on their own request, a detail drawer. Add and delete
still happen only in the browser — "(locally)" says the flash message.

New stub: `src/hooks/useApi.ts`.

## What you ship today

`POST`, `PATCH` and `DELETE` through the service layer; an add/edit form that
survives a failed save with the user's input intact; delete that waits for the
server; and a `useApi` hook that replaces every hand-written fetch effect in
the app.

By the end you will be able to answer, without hesitating:

- Which HTTP verb for which job, and why `PATCH` beats `PUT` for an edit form
- The five rules that separate a real form from a demo
- Why you use the **server's** response rather than echoing your own payload
- Why you must **not** cancel a mutation on unmount, when you *must* cancel a read
- How to reset a form's state with a `key` instead of an effect
- How to extract a custom hook, and the one discipline it demands of you

> **DummyJSON simulates writes.** `POST /products/add` returns a fully-formed
> product with a new `id`, but nothing persists — reload and it's gone. The
> request, the response and the error paths are all real. That's what we're
> learning. The UI is designed to merge server responses into local state
> exactly as you would against a real API.

---

## Before the demo (5 minutes)

```
https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/08-mutations-and-custom-hooks/starter
```

> ⚠️ Click once, bookmark the `stackblitz.com/edit/…` URL.

Locally: `cd demos/08-mutations-and-custom-hooks/starter && npm install && npm run dev`.

---

## The cold open

Add a product. Reload. Gone. Delete a product. Reload. Back.

Now open the Network tab and add another. **No request.** The form calls a
handler that does `setResult(…)` and nothing else. For three demos the
mutations have been a stage prop. Today the server gets involved — and every
one of those handlers gains an `await`, a spinner, and a failure path.

---

## Lab 1 — Sending data (15 min)

### Problem

The service layer has `listProducts`, `getProduct`, `listCategories` — reads
only. There's no way to tell the server anything.

### Concept

**Which verb:**

| Verb | Meaning | Body | Idempotent? |
|---|---|---|---|
| `POST` | Create, or "run this action" | yes | **No** — twice creates two |
| `PUT` | Replace the whole resource | yes, complete | yes |
| `PATCH` | Update some fields | yes, partial | usually |
| `DELETE` | Remove it | rarely | yes |

**`PATCH` for edit forms.** `PUT` sends the whole object — including fields
the user never touched, which happily overwrites a colleague's concurrent edit
to a different field. `PATCH` sends what changed.

**Bodies:** pass a plain object; axios serialises it as JSON and sets
`Content-Type: application/json`. For file uploads you pass a `FormData` and
**don't** set the header (the browser must add the multipart boundary) —
Demo 14.

**The method signatures**, once more, because it's the most common axios
mistake: `get(url, config)` and `delete(url, config)` take two arguments;
`post(url, data, config)`, `put(url, data, config)` and `patch(url, data, config)`
take three. Put config where data goes and your headers get sent as the body.

### Steps

**`src/api/services/products.ts` — `TODO(lab-1.1)`** — append:

```ts
// --- Writes. DummyJSON SIMULATES these: the response is real, persistence is not. ---

/**
 * POST — create. Returns the server's version: it has the real id.
 * The `Product` return type documents the contract a real API keeps; DummyJSON
 * only echoes the fields you sent, which is why the caller merges CARD_DEFAULTS.
 */
export async function createProduct(payload: ProductDraft, { signal }: RequestOptions = {}): Promise<Product> {
  const { data } = await api.post<Product>(endpoints.products.create(), payload, { signal });
  return data;
}

/** PATCH — partial update. Only the fields you send change — Partial<ProductDraft> says so. */
export async function updateProduct(id: number | string, patch: Partial<ProductDraft>, { signal }: RequestOptions = {}): Promise<Product> {
  const { data } = await api.patch<Product>(endpoints.products.update(id), patch, { signal });
  return data;
}

/** DELETE. DummyJSON echoes the product with isDeleted: true and a deletedOn timestamp. */
export async function deleteProduct(id: number | string, { signal }: RequestOptions = {}): Promise<Product & { isDeleted: boolean; deletedOn: string }> {
  const { data } = await api.delete<Product & { isDeleted: boolean; deletedOn: string }>(endpoints.products.remove(id), { signal });
  return data;
}
```

The endpoints already exist — you wrote them in Demo 6. Same rule as every
service function: return `data`, forward `signal`.

### Verify

Nothing on screen yet. In the browser console, exercise the real thing:

```ts
const { createProduct } = await import('/src/api/services/products.ts');
await createProduct({ title: 'Widget', price: 9.5, category: 'beauty', stock: 4, description: '' });
```

`{ id: 195, title: 'Widget', price: 9.5, category: 'beauty', stock: 4 }` — a
new id (DummyJSON has 194 products), and **only the fields you sent**. No
`thumbnail`, no `rating`. Remember that for Lab 2.

### Watch out

**`api.post(url, { headers })`.** The headers object is sent as the body.
Three arguments: `post(url, data, config)`.

**`PUT` when you mean `PATCH`.** DummyJSON accepts both. Real backends often
treat `PUT` with a partial body as "set the missing fields to null".

### In the real world

Look at `createProduct`'s doc comment: *"Returns the server's version: it has
the real id."* That sentence is the whole reason mutations return data. The
client guessed `Date.now()` for an id in Demo 3; the server knows the truth.

---

## Lab 2 — Mutations in React (35 min)

### Problem

`handleCreate` is synchronous and cannot fail. A real save takes time, can
fail, and must not lose the user's input when it does. And there's no edit at
all — the pencil icon doesn't exist yet.

### Concept

**Mutations are event-handler work, not effect work.** A `POST` in a mount
effect fires twice under StrictMode — and twice on a double-click in
production. The shape:

```tsx
async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  if (saving) return;              // 1. guard the double-click
  try {
    setSaving(true);
    setError(null);
    const created = await createProduct(payload);   // created: Product
    onCreated(created);            // 3. hand the SERVER's version upward
  } catch (err) {
    setError(ApiError.from(err));  // 2. stay on the form, keep the input — and `unknown` becomes ApiError
  } finally {
    setSaving(false);
  }
}
```

**Five rules that separate a real form from a demo:**

1. **Disable submit while in flight.** `disabled={saving}` — the cheapest bug
   prevention in the business.
2. **Never clear the form on error.** Losing typed input is unforgivable.
3. **Use what the server returns.** It has the real id, server-side defaults,
   computed fields. Don't echo your own payload into state.
4. **Don't cancel mutations on unmount.** Abandoning a `GET` is free.
   Abandoning a `POST` may lose the confirmation of something the server
   already committed. (Lab 3.)
5. **Say something on success.** Silence reads as failure.

**Reset state with a `key`, not an effect.** An edit form needs to start with
the product's values. The tempting `useEffect(() => setDraft(toDraft(editing)), [editing])`
is another "you might not need an effect" (and the lint rule flags it). Instead
the *parent* renders `<ProductForm key={editing?.id ?? 'new'} …/>`: when the
key changes React **remounts** the form, and `useState(() => toDraft(editing))`
runs fresh. No sync, no effect, nothing to get stale.

**Merge the server's version.** DummyJSON's create response echoes only the
fields you sent. A card needs `thumbnail`, `rating`, `discountPercentage` to
render. The server is authoritative for what it *returns*; you supply UI
defaults for what it doesn't:

```ts
[{ ...CARD_DEFAULTS, ...saved }, ...current.products]   // saved: Product (the service's return type)
```

Spread order again: defaults first, server last, so the server wins wherever
it has an opinion.

### Steps

**A. `src/components/ProductForm.tsx` — `TODO(lab-2.1)`**

Replace the file. The fields are Demo 4's — unchanged. What's new is
`editing`, `saving`, `error`, and the `await`:

```tsx
import { useState } from 'react';
import { Button, Col, Form, Modal, Row, Spinner } from 'react-bootstrap';
import { NumberField, SelectField, TextAreaField, TextField } from './fields';
import { PRODUCT_EMPTY, validateProduct } from '../lib/validation';
import { ApiError } from '../lib/ApiError';
import type { CategoryOption, Product, ProductDraft } from '../types';
import { ErrorNotice } from './ErrorNotice';

type Touched = Partial<Record<keyof ProductDraft, boolean>>;

/** A product → a draft. NumberField keeps numbers as numbers, so no String() here. */
function toDraft(product: Product | null): ProductDraft {
  if (!product) return PRODUCT_EMPTY;
  return {
    title: product.title,
    price: product.price,
    category: product.category,
    stock: product.stock,
    description: product.description,
  };
}

interface ProductFormProps {
  show: boolean;
  /** null = create. A product = edit it. */
  editing?: Product | null;
  categories: CategoryOption[];
  /** Async on purpose: throw and the form shows the error and keeps the input. */
  onSubmit: (payload: ProductDraft) => Promise<void>;
  onClose: () => void;
}

export function ProductForm({ show, editing = null, categories, onSubmit, onClose }: ProductFormProps) {
  const [draft, setDraft] = useState<ProductDraft>(() => toDraft(editing));   // fresh on every remount (see `key` in App)
  const [touched, setTouched] = useState<Touched>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const errors = validateProduct(draft);
  const isValid = Object.keys(errors).length === 0;

  function set<K extends keyof ProductDraft>(field: K, value: ProductDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
  }
  function touch(field: keyof ProductDraft) { setTouched((current) => ({ ...current, [field]: true })); }
  function errorFor(field: keyof ProductDraft): string | undefined {
    if (!errors[field]) return undefined;
    return touched[field] || submitAttempted ? errors[field] : undefined;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;                                  // rule 1
    setSubmitAttempted(true);
    if (!isValid) return;

    const payload: ProductDraft = { ...draft, title: draft.title.trim(), description: draft.description.trim() };

    try {
      setSaving(true);
      setError(null);
      await onSubmit(payload);        // the parent talks to the server and closes us on success
      setDraft(PRODUCT_EMPTY);
      setTouched({});
      setSubmitAttempted(false);
    } catch (err) {
      setError(ApiError.from(err));   // rule 2: stay open, keep the input
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    if (saving) return;
    setError(null);
    setTouched({});
    setSubmitAttempted(false);
    onClose();
  }

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));

  return (
    <Modal show={show} onHide={handleClose} centered backdrop={saving ? 'static' : true}>
      <Form noValidate onSubmit={handleSubmit}>
        <Modal.Header closeButton={!saving}>
          <Modal.Title className="h6">{editing ? `Edit “${editing.title}”` : 'Add a product'}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {/* …the same TextField / NumberField ×2 / SelectField / TextAreaField as Demo 4,
              each with disabled={saving} added… */}

          <div className="mt-3">
            <ErrorNotice error={error} title="Couldn't save" />
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleClose} disabled={saving}>Cancel</Button>
          <Button type="submit" disabled={saving}>
            {saving && <Spinner as="span" size="sm" animation="border" className="me-2" />}
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create product'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
```

Add `disabled={saving}` to each of the five fields. `backdrop="static"` and
`closeButton={!saving}` stop the user dismissing a modal mid-save — the
request would continue anyway, and they'd never see the result.

Notice there is no `Number(draft.price)` at submit any more. `NumberField`
handed you a number in Demo 4; the boundary moved into the component.

**B. `src/components/ProductCard.tsx` — `TODO(lab-2.3)`** — a pencil next to
the trash:

```tsx
import { Heart, HeartFill, PencilSquare, Trash } from 'react-bootstrap-icons';
// …
interface ProductCardProps {
  // …
  onEdit?: (product: Product) => void;      // ← NEW
  onDelete?: (product: Product) => void;
  onSelect?: (id: number) => void;
}

export function ProductCard({ product, density = 'comfortable', saved = false, onToggleSave, onEdit, onDelete, onSelect }: ProductCardProps) {
  // …inside the footer's <div className="d-flex gap-1">, BEFORE the delete button:
  {onEdit && (
    <Button size="sm" variant="outline-secondary" aria-label={`Edit ${product.title}`} onClick={() => onEdit(product)}>
      <PencilSquare />
    </Button>
  )}
```

Pass `onEdit` through `ProductGrid` like the others.

**C. `src/App.tsx` — `TODO(lab-2.2)`**

```tsx
import { createProduct, deleteProduct, listCategories, listProducts, updateProduct } from './api/services/products';

/** DummyJSON's create response echoes only what you sent — fill what a card needs to render. */
const CARD_DEFAULTS: Pick<Product, 'rating' | 'discountPercentage' | 'thumbnail'> = {
  rating: 0,
  discountPercentage: 0,
  thumbnail: PLACEHOLDER_THUMBNAIL,
};
// …
const [editing, setEditing] = useState<Product | null>(null);   // null = creating

function openCreate() { setEditing(null); setShowForm(true); }
function openEdit(product: Product) { setEditing(product); setShowForm(true); }
function closeForm() { setShowForm(false); setEditing(null); }

/**
 * Runs INSIDE the form's try/catch: throw here and the form shows the error
 * and keeps the user's input. Only on success do we merge and close.
 */
async function handleSave(payload: ProductDraft) {
  const saved = editing ? await updateProduct(editing.id, payload) : await createProduct(payload);

  // Use what the SERVER returned — it has the real id and any computed fields.
  setResult((current) => {
    if (!current) return current;
    const exists = current.products.some((p) => p.id === saved.id);
    return {
      ...current,
      products: exists
        ? current.products.map((p) => (p.id === saved.id ? { ...p, ...saved } : p))
        : [{ ...CARD_DEFAULTS, ...saved }, ...current.products],
      total: exists ? current.total : current.total + 1,
    };
  });
  closeForm();
  setFlash(`“${saved.title}” ${editing ? 'updated' : 'created'}. DummyJSON simulates writes — a refresh restores the original data.`);
}
```

Delete the old `handleCreate`. Wire it up:

```tsx
<Button size="sm" onClick={openCreate}>…Add product</Button>
// …
<ProductGrid … onEdit={openEdit} />
// …
<ProductForm
  key={editing?.id ?? 'new'}          // ← remount on switch; fresh initial state
  show={showForm}
  editing={editing}
  categories={categories ?? []}       // useApi's data is T | null; the form wants an array
  onSubmit={handleSave}
  onClose={closeForm}
/>
```

Notice the division of labour: **the form owns the request lifecycle**
(`saving`, `error`, keep-the-input); **the parent owns what the request is
and what happens to the result**. `handleSave` doesn't `try/catch` — it
*throws into* the form's `catch`. That's the contract of `await onSubmit(…)`.

### Verify

**Create:** Add product → fill it in → **Create**. The button spins, the
Network tab shows `POST /products/add` with your JSON in **Payload** and
`Content-Type: application/json` in **Headers**. The response has `id: 195`.
The card appears first in the grid, with the grey placeholder — the server
sent no thumbnail, `CARD_DEFAULTS` did.

**Edit:** click a pencil. The form opens **pre-filled** with that product's
values and the title reads *Edit "…"*. Change the price, **Save changes**.
`PATCH /products/<id>` with *only* `{title, price, category, stock, description}`.
The card updates in place.

**Switch:** open Edit on product A, cancel, open Edit on product B — B's
values, not A's. That's the `key` remounting the form.

**Failure — the important one.** In `endpoints.ts`, temporarily change
`create: () => '/products/add'` to `'/products/addd'`. Fill in the form, Create.
A red *"Couldn't save"* inside the modal, **your input still there**, the
modal still open. Fix the path, click Create again — it works, nothing
retyped. Rule 2 in action.

### Watch out

**`setResult([created, …])` echoing your payload.** No `id` from the server →
duplicate keys → React warns and the wrong card gets edited later. `saved`,
not `payload`.

**`{ ...saved, ...CARD_DEFAULTS }`** — defaults last. Now the placeholder
thumbnail overwrites a real one on edit. Defaults first, server last.

**`useEffect(() => setDraft(toDraft(editing)), [editing])`** in the form. It
"works", lags a render, and the lint rule rejects it. Use the `key`.

**Catching inside `handleSave`.** Then `await onSubmit()` never throws, the
form thinks it succeeded, clears itself and closes — over a failed request.
Let it throw.

### Challenge (2 min)

Two options, pick one:

- Send only the fields that *changed* in the `PATCH` (diff `payload` against
  `editing`). Why is that better for a real backend than sending all five?
- `SignupForm` (Demo 4) still fakes its submit with a `setTimeout`. Add a
  `createUser(payload)` to a new `services/users.ts` posting to
  `/users/add`, call it from `onValid`, and route a server failure to
  `setError('root', …)`. react-hook-form's `isSubmitting` already handles the
  spinner — what else from `ProductForm` did you *not* have to write?

### In the real world

"The form cleared and my data was gone" is the support ticket that makes users
distrust an app permanently. Rule 2 costs one line — `setError` instead of
`setDraft(EMPTY)` in the catch — and it's the line junior developers most
often get backwards.

---

## Lab 3 — Delete, for real (15 min)

### Problem

Delete removes the card instantly and tells the server nothing. Add the
request and two new questions appear: what does the dialog show while it's
in flight, and what happens if it fails?

### Concept

**Same shape, one more state.** `deleting` drives the dialog's spinner and
disables both buttons. Don't clear `pendingDelete` until the request settles
— if you clear it first, the dialog closes and a failure has nowhere to
appear.

**Don't cancel a mutation.** Every read in this app passes `signal` and aborts
on cleanup. `deleteProduct` accepts a `signal` too — and we deliberately don't
pass one. If the user navigates away mid-delete, the server may already have
deleted; aborting would only lose the confirmation. Cancel reads. Let writes
finish.

### Steps

**`src/App.tsx` — `TODO(lab-3.1)`**

```tsx
const [deleting, setDeleting] = useState(false);
const [deleteError, setDeleteError] = useState<ApiError | null>(null);

async function handleDelete() {
  if (!pendingDelete) return;          // narrows Product | null → Product for the lines below
  const product = pendingDelete;
  try {
    setDeleting(true);
    await deleteProduct(product.id);   // no signal, on purpose
    setResult((current) =>
      current
        ? { ...current, products: current.products.filter((p) => p.id !== product.id), total: current.total - 1 }
        : current,
    );
    setWishlist((current) => current.filter((id) => id !== product.id));
    setFlash(`“${product.title}” deleted.`);
  } catch (err) {
    setFlash(null);
    setDeleteError(ApiError.from(err));
  } finally {
    setDeleting(false);
    setPendingDelete(null);
  }
}
// …
<ErrorNotice error={deleteError} title="Couldn't delete" onRetry={() => setDeleteError(null)} />
// …
<ConfirmDialog
  show={!!pendingDelete}
  title="Delete product"
  body={`Delete “${pendingDelete?.title}”? This can't be undone.`}
  confirmLabel={deleting ? 'Deleting…' : 'Delete'}
  busy={deleting}
  onConfirm={handleDelete}
  onCancel={() => setPendingDelete(null)}
/>
```

`ConfirmDialog` already had a `busy` prop from Demo 3 — it disables both
buttons. Now it's used.

### Verify

Trash → Delete. The button reads **Deleting…**, both buttons disable, `DELETE
/products/<id>` fires, the response has `isDeleted: true` and a `deletedOn`
timestamp, the card disappears, the count drops.

Break it: `remove: (id) => \`/products/${enc(id)}x\``. Delete → a red
*"Couldn't delete"* above the toolbar, the card stays. Fix it.

### Watch out

**`setPendingDelete(null)` before the `await`.** The dialog closes instantly
and the spinner never shows; on failure the error has no context. Clear it in
`finally`.

**Passing `signal` to a mutation.** Tempting for consistency. Don't — see
Concept.

### Challenge (2 min)

A `DELETE` that times out may have succeeded on the server. What should the
UI do — remove the card, keep it, or re-fetch the page? There's no right
answer without knowing the backend; say which you'd pick and why.

---

## Lab 4 — Custom hooks (35 min)

### Problem

Count the fetch effects: two in `App`, one in `ProductDetail`. Each is ~20
lines of identical ceremony — `loading`, `error`, `AbortController`,
`isCancel`, the aborted-guard. The next component that fetches will copy it
again, and one copy will forget the guard.

### Concept

**A custom hook is a function that starts with `use` and calls other hooks.**
Nothing more. It's how you extract *stateful logic* the way a helper function
extracts *stateless* logic.

**In TypeScript the good ones are generic.** `useApi<T>` doesn't know or care
what a `Product` is. `T` is inferred from the fetcher you pass in, so `data`
comes back as `ProductListResponse | null` for the list and `Product | null`
for the detail — one hook, no casts at the call sites. When the fetcher maps
the response (the categories), you *say* the `T` — `useApi<CategoryOption[]>` —
and the compiler checks the mapping against it.

```tsx
const { data, loading, error, reload } = useApi(fetcher, deps);   // data: T | null, T inferred from fetcher
```

Three design decisions, and each has a reason:

**`deps` is a parameter, not `[fetcher]`.** A new arrow function is created on
every render, so depending on `fetcher` directly would refetch forever. Explicit
deps hand that judgement to the caller — exactly like `useEffect`.

**The `eslint-disable`.** The exhaustive-deps rule can't analyse a spread
array. This is the standard trade-off in every `useApi`-style hook, and it's
**the one discipline it demands of you**: if the fetcher closes over a value,
that value goes in `deps`. Forget it and you serve stale data with no warning.

**`setData` is returned.** Mutations (Lab 2) need to update the list without
a round trip.

**Where this ends.** This hook handles one component's request. It does not
cache, dedupe across components, revalidate on focus, or share state. When
you need any of that, stop growing the hook: Demo 10's route loaders cover a
lot of it, and [TanStack Query](https://tanstack.com/query/latest) covers the
rest. Knowing what the hook does by hand is what makes those libraries make
sense.

### Steps

**A. `src/hooks/useApi.ts` — `TODO(lab-4.1)`**

```ts
import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { ApiError } from '../lib/ApiError';

export interface UseApiOptions<T> {
  /** Don't fetch (yet). The early `return` you'd otherwise write inside the effect. */
  skip?: boolean;
  initialData?: T | null;
}

export interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  reload: () => void;
  /** Mutations need to update the list without a round trip. */
  setData: React.Dispatch<React.SetStateAction<T | null>>;
}

/**
 * Generic over T — whatever the fetcher resolves to is what `data` is.
 * Call it with a fetcher that returns Promise<ProductListResponse> and you
 * get a ProductListResponse | null back; the hook never names a domain type.
 */
export function useApi<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: unknown[] = [],
  { skip = false, initialData = null }: UseApiOptions<T> = {},
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<ApiError | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (skip) return;

    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError(null);
        setData(await fetcher(controller.signal));
      } catch (err) {
        if (axios.isCancel(err)) return;
        setError(ApiError.from(err));   // unknown in, ApiError out
        setData(null);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce, skip]);

  return { data, loading: loading && !skip, error, reload, setData };
}
```

Every line is one you wrote in Demo 5. It's now written once.

**B. `src/App.tsx` — `TODO(lab-4.2)`**

Replace both effects and their state:

```tsx
import { useCallback, useState } from 'react';    // useEffect goes; axios import goes
import { useApi } from './hooks/useApi';
// …
const { sortBy, order } = parseSort(filters.sort);

const fetchProducts = useCallback(
  (signal: AbortSignal) =>
    listProducts({
      q: debouncedQuery,
      category: filters.category === 'all' ? '' : filters.category,
      sortBy,
      order,
      page: filters.page,
      limit: PAGE_SIZE,
      signal,
    }),
  [debouncedQuery, filters.category, filters.page, sortBy, order],
);

// T is INFERRED from the fetcher: result is ProductListResponse | null, no annotation needed
const { data: result, loading, error, reload, setData: setResult } =
  useApi(fetchProducts, [debouncedQuery, filters.category, filters.page, sortBy, order]);

// Here the fetcher maps the response, so we SAY what comes out
const { data: categories } = useApi<CategoryOption[]>(
  (signal) => listCategories({ signal }).then((list) => list.map((c) => ({ id: c.slug, name: c.name }))),
  [],
  { initialData: [] },
);
```

Delete: `result`/`loading`/`error`/`reloadKey`/`categories` state, both
`useEffect`s, and the `axios` and `logger` imports. Change
`onRetry={() => setReloadKey(…)}` to `onRetry={reload}`.

`useCallback` around the fetcher is not decoration: without it the function's
identity changes every render. With explicit deps *alongside*, the hook stays
honest. Note the deps list appears twice — once for `useCallback`, once for
`useApi` — and must match. That duplication is the price of the hook's
simplicity; the Challenge asks whether it's worth paying.

The categories request lost its `try/catch`-and-log. It now surfaces through
`error` like any other — which we ignore, because the strip is optional.
Same decision, less code.

**C. `src/components/ProductDetail.tsx` — `TODO(lab-4.3)`** — the whole effect
collapses:

```tsx
import { useCallback } from 'react';                 // useEffect, useState, axios all go
import { useApi } from '../hooks/useApi';
// …
export function ProductDetail({ id, onClose }: ProductDetailProps) {
  // `skip` keeps it from running while id is null — so `id ?? -1` is never actually requested.
  const fetcher = useCallback((signal: AbortSignal) => getProduct(id ?? -1, { signal }), [id]);
  const { data: product, loading, error, reload } = useApi(fetcher, [id], { skip: id === null });
  // …
  <Offcanvas.Title className="h6">{(!loading && product?.title) || `Product #${id}`}</Offcanvas.Title>
  // …
  <ErrorNotice error={error} onRetry={reload} />
```

`skip: !id` is what the early `return` in the raw effect was doing — now a
named option instead of a control-flow trick.

### Verify

Identical behaviour, everywhere: search, filter, page, drawer, retry. `App.tsx`
has no `useEffect` at all. `grep -rn "AbortController" src/` returns exactly
**one** line — in `useApi.ts`. Open React DevTools → `App` → hooks: `useApi`
appears as a named custom hook with its state nested inside.

Break it on purpose: remove `filters.page` from the `useApi` deps (leave it in
`useCallback`). Click Next — **nothing happens**. The fetcher changed, the
hook wasn't told. That silent staleness is the discipline the `eslint-disable`
asks of you. Put it back.

### Watch out

**Deps mismatch between `useCallback` and `useApi`.** The staleness above.
Keep the two lists identical, or derive one from the other.

**`useApi(() => listProducts(…))` with no deps and an inline arrow.** Fetches
once, never again — and never for a new page. Deps are the contract.

**Returning `loading` instead of `loading && !skip`.** A skipped hook that
was previously loading stays "loading" forever.

### Challenge (2 min)

The duplicated deps list is a smell. Redesign `useApi` to take a `key` (an
array of values, like TanStack Query's `queryKey`) instead of `deps`, and
compare `JSON.stringify(key)` to decide when to refetch. What did you gain?
What did you lose?

### In the real world

Every team has a `useApi`/`useFetch`/`useAsync`. Every one of them has this
exact shape and this exact trade-off. The good ones are twenty lines and
honest about what they don't do; the bad ones grow caching and retry and
dedupe over two years until someone replaces them with a library that does
those things properly. You now know which kind you're looking at.

---

## Wrap-up — what you can now do

- [x] Pick the verb: `POST` to create, `PATCH` to edit, `DELETE` to remove
- [x] Write a mutation handler with guard, spinner, error-keeps-input, server-response merge
- [x] Reset a form with a `key` instead of an effect
- [x] Let a child's `await onSubmit()` throw into the child's own `catch`
- [x] Wait for a delete, disable the dialog, and never cancel a write
- [x] Extract stateful logic into a custom hook and name its one discipline

**What's still wrong:** the app is one URL. Nothing is linkable, the back
button does nothing, a refresh loses every filter. Demo 9.

## Next demo

**Demo 9 — Routing with React Router v8.** Real pages, a layout with a real
nav, a product detail *page* that replaces the drawer, and every filter moved
into the URL so a search is a link you can send to someone.

---

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| Form closes on a failed save | `handleSave` caught the error. Let it throw into the form's `catch`. |
| Edit form shows the previous product's values | Missing `key={editing?.id ?? 'new'}` on `<ProductForm>`. |
| New card has no image / `rating.toFixed is not a function` | Server response lacks card fields. `{ ...CARD_DEFAULTS, ...saved }`. |
| Two cards with the same key after create | You inserted `payload`, not `saved`. |
| Dialog closes before the spinner shows | `setPendingDelete(null)` before the `await`. Move it to `finally`. |
| Next page does nothing after the refactor | `filters.page` missing from `useApi`'s deps. |
| *"React has detected a change in the order of Hooks"* | `useApi` called conditionally. Call it always; use `skip`. |
| `Type 'CategoryOption[] \| null' is not assignable to type 'CategoryOption[]'` | `useApi` returns `T \| null`. Pass `categories ?? []` to components that want an array. |
| `Argument of type 'number \| null' is not assignable to parameter of type 'string \| number'` | `getProduct(id, …)` with `id: number \| null`. Use `skip: id === null` plus `id ?? -1`, as in `ProductDetail`. |
| `'err' is of type 'unknown'` in a catch | Don't store or read it raw — `setError(ApiError.from(err))`. |
