# Module 10 — Forms & Controlled Components

**Study notes** · ~3 hours

> **Goal.** Forms are where React's model meets the browser's, and where most
> real applications spend their complexity budget. This module covers every
> input type, the controlled/uncontrolled decision, validation that is actually
> accessible, and React 19's Actions — plus an honest account of when to stop
> hand-rolling and adopt a library.

**Prerequisites:** [Module 7](../07-state-and-events/) (state and events),
[Module 8](../08-state-structure/) (state shape, lifting).

---

## Contents

1. [The controlled input loop](#1-the-controlled-input-loop)
2. [Every input type](#2-every-input-type)
3. [One handler for many fields](#3-one-handler-for-many-fields)
4. [Uncontrolled inputs and `FormData`](#4-uncontrolled-inputs-and-formdata)
5. [Controlled or uncontrolled: deciding](#5-controlled-or-uncontrolled-deciding)
6. [The warnings everyone hits](#6-the-warnings-everyone-hits)
7. [Submission](#7-submission)
8. [Validation](#8-validation)
9. [Schema validation with Zod](#9-schema-validation-with-zod)
10. [Accessibility](#10-accessibility)
11. [React 19 form Actions](#11-react-19-form-actions)
12. [`useOptimistic`](#12-useoptimistic)
13. [When to adopt React Hook Form](#13-when-to-adopt-react-hook-form)
14. [Patterns worth knowing](#14-patterns-worth-knowing)
15. [Self-check](#15-self-check)
16. [References](#16-references)

---

## 1. The controlled input loop

An `<input>` has its own internal state in the DOM. React can either let it
keep that state (**uncontrolled**) or take it over (**controlled**).

Controlled is the default choice, and it is a one-way loop:

```jsx
function SearchBox() {
  const [query, setQuery] = useState('');

  return (
    <input
      value={query}                                  // state → input
      onChange={(e) => setQuery(e.target.value)}     // input → state
    />
  );
}
```

```
   state ──value──► <input>
     ▲                 │
     └──setQuery───onChange
```

Every keystroke: the DOM fires `change`, your handler sets state, React
re-renders, the input's `value` becomes the new state. The DOM never holds a
value React does not know about — which is what makes it possible to validate
as you type, transform input, disable a submit button, or mirror the value
somewhere else on the page.

**If you set `value` you must set `onChange`.** Without the handler, state
never updates, so React keeps re-rendering the same value and the field appears
frozen. React warns about exactly this.

📖 [react.dev — Reacting to Input with State](https://react.dev/learn/reacting-to-input-with-state)

---

## 2. Every input type

The prop that carries the value differs by type. This is the reference table.

### Text-like inputs

```jsx
<input type="text"     value={name}  onChange={(e) => setName(e.target.value)} />
<input type="email"    value={email} onChange={(e) => setEmail(e.target.value)} />
<input type="password" value={pw}    onChange={(e) => setPw(e.target.value)} />
<input type="search"   value={q}     onChange={(e) => setQ(e.target.value)} />
<textarea              value={bio}   onChange={(e) => setBio(e.target.value)} />
```

Note `<textarea>` takes `value`, not children. In HTML the text goes between
the tags; in React it does not.

### Numbers

```jsx
<input
  type="number"
  value={quantity}
  onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
/>
```

`e.target.value` is **always a string**, even for `type="number"`. Two traps:

- `Number('')` is `0`, so a naive conversion makes an empty field read as zero
  and the user cannot clear it.
- `value={NaN}` triggers a React warning and renders nothing useful.

The pragmatic approach for forms: **keep numbers as strings in state** and
convert once, on submit. That is what `ProductDraft` does in the workshop
codebase, and the comment there says why — inputs deal in strings, so let them.

### Checkbox — `checked`, not `value`

```jsx
<input
  type="checkbox"
  checked={subscribed}
  onChange={(e) => setSubscribed(e.target.checked)}
/>
```

A group of checkboxes into an array:

```jsx
const [tags, setTags] = useState([]);

function toggleTag(tag) {
  setTags((prev) =>
    prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
  );
}

{ALL_TAGS.map((tag) => (
  <label key={tag}>
    <input type="checkbox" checked={tags.includes(tag)} onChange={() => toggleTag(tag)} />
    {tag}
  </label>
))}
```

### Radio — one state, many inputs

```jsx
const [shipping, setShipping] = useState('standard');

{['standard', 'express', 'pickup'].map((option) => (
  <label key={option}>
    <input
      type="radio"
      name="shipping"                       // same name = one group
      value={option}
      checked={shipping === option}
      onChange={(e) => setShipping(e.target.value)}
    />
    {option}
  </label>
))}
```

The shared `name` is what makes the browser treat them as one group — which
matters for keyboard navigation even though React is managing the value.

### Select

```jsx
<select value={sort} onChange={(e) => setSort(e.target.value)}>
  <option value="featured">Featured</option>
  <option value="price-asc">Price: low to high</option>
</select>
```

React puts the value on `<select>`, **not** `selected` on `<option>` — a
deliberate departure from HTML that keeps the pattern identical to every other
input.

Multiple:

```jsx
<select
  multiple
  value={categories}                        // an array
  onChange={(e) => setCategories([...e.target.selectedOptions].map((o) => o.value))}
>
```

### File — always uncontrolled

```jsx
const fileRef = useRef(null);

<input type="file" ref={fileRef} onChange={(e) => setFileName(e.target.files[0]?.name ?? '')} />
```

You cannot set a file input's `value` from JavaScript — a security rule, so a
page cannot silently attach a file from the user's disk. Read `e.target.files`,
and clear it with `fileRef.current.value = ''`.

### Date and time

```jsx
<input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
```

The value is an ISO date **string** (`'2026-03-14'`), not a `Date`. Convert at
the boundary, and be careful: `new Date('2026-03-14')` parses as UTC midnight,
which is the previous day in negative offsets. That is a genuine
off-by-one-day bug in a lot of production software.

📖 [react.dev — `<input>`](https://react.dev/reference/react-dom/components/input) ·
[`<select>`](https://react.dev/reference/react-dom/components/select) ·
[`<textarea>`](https://react.dev/reference/react-dom/components/textarea)

---

## 3. One handler for many fields

One state object plus computed keys
([Module 1 §10](../01-javascript-foundations/#10-objects-in-depth)) scales to
any number of fields:

```jsx
const [form, setForm] = useState({
  name: '', email: '', country: 'IN', subscribed: false,
});

function handleChange(event) {
  const { name, value, type, checked } = event.target;
  setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
}

<input name="name"       value={form.name}    onChange={handleChange} />
<input name="email"      value={form.email}   onChange={handleChange} />
<select name="country"   value={form.country} onChange={handleChange}>…</select>
<input name="subscribed" type="checkbox" checked={form.subscribed} onChange={handleChange} />
```

Two things to keep right:

- **The `name` attribute must match the state key exactly.** A typo produces a
  silent new key rather than an error — the field just stops working. This is
  the one real cost of the pattern, and TypeScript can catch it if you type the
  form object.
- **Use the updater form.** `setForm(prev => …)`, not `setForm({...form, …})`,
  so rapid successive changes cannot clobber each other
  ([Module 7 §12](../07-state-and-events/#12-updater-functions)).

---

## 4. Uncontrolled inputs and `FormData`

Let the DOM keep the value, and read it when you need it:

```jsx
function ProfileForm({ user }) {
  function handleSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    const values = Object.fromEntries(data);        // { name: '…', email: '…' }
    const tags = data.getAll('tags');               // multiple same-named fields
    save(values);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" defaultValue={user.name} />
      <input name="email" type="email" defaultValue={user.email} />
      <input name="subscribed" type="checkbox" defaultChecked={user.subscribed} />
      <button type="submit">Save</button>
    </form>
  );
}
```

No state, no re-render per keystroke, no `onChange` for anything. `FormData`
reads every named field from the DOM at submit time.

`defaultValue` and `defaultChecked` seed the input **once**, then step aside —
exactly parallel to `useState`'s initial value
([Module 7 §2](../07-state-and-events/#2-usestate)). Passing `value` instead
would make it controlled and freeze the field.

One `FormData` gotcha worth knowing: **an unchecked checkbox is absent from the
entries entirely**, rather than present as `false`. `Object.fromEntries` will
simply not have the key.

---

## 5. Controlled or uncontrolled: deciding

| | Controlled | Uncontrolled |
|---|---|---|
| Value lives in | React state | the DOM |
| Re-render per keystroke | yes | no |
| Validate as you type | easy | no |
| Disable submit until valid | easy | no |
| Transform input live (uppercase, mask) | easy | no |
| Reset programmatically | set state | `form.reset()` or a `key` |
| Mirror the value elsewhere | easy | no |
| Code per field | more | less |

**Choose controlled when** you need the value *during* typing: live validation,
a character counter, a dependent field, a disabled submit, a search-as-you-type,
an input mask.

**Choose uncontrolled when** you only need the values at submit: a large
settings form, a login form, anything where nothing reacts until the user is
done. React 19's Actions ([§11](#11-react-19-form-actions)) make this
substantially more attractive than it used to be.

**Mixed is fine and common.** A password field controlled so you can show a
strength meter, everything else uncontrolled.

---

## 6. The warnings everyone hits

### "A component is changing an uncontrolled input to be controlled"

```jsx
const [name, setName] = useState();          // ✗ undefined
<input value={name} onChange={…} />          // uncontrolled on render 1…
                                             // …controlled once name is a string
```

React decides which mode an input is in by whether `value` is `undefined`.
Initialise to `''`, never `undefined`. When the value comes from data that may
not have loaded:

```jsx
<input value={user?.name ?? ''} onChange={…} />       // ✓
```

### "You provided a `value` prop without an `onChange` handler"

Either add `onChange`, or use `defaultValue` if you meant it to be
uncontrolled, or add `readOnly` if the field genuinely is.

### The field will not accept typing

Almost always `value` with a handler that does not actually update the state
that `value` reads from. Check that the setter and the value are the same
piece of state.

---

## 7. Submission

```jsx
function handleSubmit(event) {
  event.preventDefault();          // ← without this the browser reloads the page
  …
}

<form onSubmit={handleSubmit}>
```

Put the handler on the **`<form>`**, not on the button. That way Enter in a
text field submits, which users expect and which is the accessible behaviour.

A `<button>` inside a form defaults to `type="submit"`. Any button that is not
meant to submit must say so:

```jsx
<button type="button" onClick={handleCancel}>Cancel</button>     // ✓
<button onClick={handleCancel}>Cancel</button>                   // ✗ submits the form
```

### Async submission and double submits

```jsx
const [status, setStatus] = useState('idle');   // one union, not three booleans

async function handleSubmit(event) {
  event.preventDefault();
  if (status === 'submitting') return;          // guard against a double click

  setStatus('submitting');
  try {
    await saveProfile(form);
    setStatus('success');
  } catch (error) {
    setError(error);
    setStatus('error');
  }
}

<button type="submit" disabled={status === 'submitting'}>
  {status === 'submitting' ? 'Saving…' : 'Save'}
</button>
```

`disabled` alone is not quite enough — a fast double click can land both events
before the re-render. The explicit guard costs one line.

---

## 8. Validation

Three decisions: **what** to check, **when** to show it, and **where** to put
the result.

### When to validate

| Timing | Feels like |
|---|---|
| On every keystroke | Hostile — errors appear before you finish typing |
| On blur | Right for most fields |
| On submit | Right for the whole form |
| On change, **after** the first blur | The best of both — the pattern users prefer |

That last one is worth implementing:

```jsx
const [touched, setTouched] = useState({});

const showError = (field) => touched[field] && errors[field];

<input
  name="email"
  value={form.email}
  onChange={handleChange}
  onBlur={() => setTouched((t) => ({ ...t, email: true }))}
  aria-invalid={Boolean(showError('email'))}
/>
{showError('email') && <p role="alert">{errors.email}</p>}
```

The field stays quiet while you type it the first time, then corrects you live
once you have moved on and come back.

### Where errors live

Derive them, do not store them
([Module 8 §9](../08-state-structure/#9-derived-state)):

```jsx
const errors = validate(form);                 // ✓ recomputed each render
const isValid = Object.keys(errors).length === 0;
```

Storing `errors` in state means remembering to update it on every change — and
one path that forgets leaves a stale error on screen.

### Server errors

Client validation is a convenience. The server is the authority, and it will
reject things the client could not know about (an email already taken). Map
its response back onto fields:

```jsx
catch (error) {
  if (error instanceof ApiError && error.fieldErrors) {
    setServerErrors(error.fieldErrors);        // { email: 'Already registered' }
  }
}

const errors = { ...validate(form), ...serverErrors };
```

Clear a field's server error when the user edits that field, or they will be
told their corrected email is still taken.

---

## 9. Schema validation with Zod

Hand-written validators drift from your types. A schema is both at once:

```ts
import { z } from 'zod';

const ProfileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  age: z.coerce.number().int().min(18, 'Must be 18 or over'),
  country: z.enum(['IN', 'GB', 'US']),
});

type Profile = z.infer<typeof ProfileSchema>;    // the TYPE comes from the schema
```

```ts
const result = ProfileSchema.safeParse(formValues);

if (!result.success) {
  const errors = z.flattenError(result.error).fieldErrors;
  // { email: ['Enter a valid email'] }
} else {
  save(result.data);          // fully typed and validated
}
```

Three reasons this is the professional default:

1. **One definition** produces the runtime check and the TypeScript type, so
   they cannot disagree.
2. **`z.coerce.number()`** handles the string-from-input problem in the schema
   rather than scattered through handlers.
3. **The same schema validates on the server**, so client and server agree by
   construction.

This is validating at the system boundary rather than casting across it — the
same principle as parsing URL params in
[Module 14](../14-routing/).

---

## 10. Accessibility

Forms are where accessibility most often breaks, and the fixes are small.

### Label every input

```jsx
<label htmlFor="email">Email</label>
<input id="email" name="email" />

// or wrap, and skip the ids
<label>
  Email
  <input name="email" />
</label>
```

A `placeholder` is **not** a label. It disappears on focus, fails contrast
requirements, and is not reliably announced.

### Associate errors and hints

```jsx
const id = useId();          // stable across server and client render

<label htmlFor={`${id}-email`}>Email</label>
<input
  id={`${id}-email`}
  aria-invalid={Boolean(error)}
  aria-describedby={error ? `${id}-email-error` : undefined}
/>
{error && <p id={`${id}-email-error`} role="alert">{error}</p>}
```

Note `undefined` rather than `''` for the absent case — React omits the
attribute entirely, whereas an empty `aria-describedby` is a dangling
reference ([Module 6 §17](../06-conditional-rendering-and-lists/#17-conditional-attributes-and-classes)).

`useId` exists because ids must be unique per instance and stable between the
server and client renders — `Math.random()` breaks hydration
([Module 3 §5](../03-rendering-architectures/#5-hydration-explained-properly)).

### Group related inputs

```jsx
<fieldset>
  <legend>Shipping method</legend>
  {/* the radio group */}
</fieldset>
```

### Move focus to the first error on submit

```jsx
const firstError = Object.keys(errors)[0];
if (firstError) {
  document.querySelector(`[name="${firstError}"]`)?.focus();
}
```

Without this a keyboard or screen-reader user submits, hears nothing, and has
no idea where the problem is.

### Announce the submission result

```jsx
<div aria-live="polite" className="sr-only">
  {status === 'success' && 'Profile saved'}
  {status === 'error' && 'Could not save profile'}
</div>
```

📖 [react.dev — `useId`](https://react.dev/reference/react/useId)

---

## 11. React 19 form Actions

React 19 lets a `<form>` take a **function** as its `action`. React calls it
with the `FormData`, and manages the pending state for you.

```jsx
import { useActionState } from 'react';

function ProfileForm({ user }) {
  const [state, formAction, isPending] = useActionState(
    async (previousState, formData) => {
      const values = Object.fromEntries(formData);
      const parsed = ProfileSchema.safeParse(values);

      if (!parsed.success) {
        return { errors: z.flattenError(parsed.error).fieldErrors, values };
      }

      try {
        await saveProfile(parsed.data);
        return { success: true };
      } catch (error) {
        return { errors: { form: error.message }, values };
      }
    },
    { errors: {} },                            // initial state
  );

  return (
    <form action={formAction}>
      <input name="name" defaultValue={state.values?.name ?? user.name} />
      {state.errors?.name && <p role="alert">{state.errors.name}</p>}

      <button type="submit" disabled={isPending}>
        {isPending ? 'Saving…' : 'Save'}
      </button>
    </form>
  );
}
```

What you no longer write: `preventDefault`, a `useState` per field, an
`isSubmitting` flag, the double-submit guard. React handles the pending state
and resets the form on success.

### `useFormStatus` — pending state in a nested component

```jsx
import { useFormStatus } from 'react-dom';

function SubmitButton({ children }) {
  const { pending } = useFormStatus();          // reads the PARENT <form>
  return <button type="submit" disabled={pending}>{pending ? 'Saving…' : children}</button>;
}
```

This is why it exists: a reusable submit button that knows about its form
without the form passing it a prop. It reads context from the nearest `<form>`
above it, so it **must** be rendered inside that form — calling it in the same
component as the `<form>` returns `pending: false` forever, which is the
mistake everyone makes once.

### Why this matters beyond convenience

A `<form action={fn}>` degrades gracefully. In a framework with Server
Functions ([Module 19](../19-server-components/)), the same form submits and
works **before the JavaScript has loaded** — real progressive enhancement,
which the controlled-input approach cannot offer at all.

📖 [react.dev — `useActionState`](https://react.dev/reference/react/useActionState) ·
[`useFormStatus`](https://react.dev/reference/react-dom/hooks/useFormStatus) ·
[`<form>`](https://react.dev/reference/react-dom/components/form)

---

## 12. `useOptimistic`

Show the result immediately, roll back automatically if the request fails:

```jsx
import { useOptimistic } from 'react';

function CommentList({ comments, addComment }) {
  const [optimisticComments, addOptimistic] = useOptimistic(
    comments,
    (current, newComment) => [...current, { ...newComment, pending: true }],
  );

  async function formAction(formData) {
    const text = formData.get('text');
    addOptimistic({ id: 'temp', text });      // on screen instantly
    await addComment(text);                    // if this throws, React reverts
  }

  return (
    <>
      {optimisticComments.map((c) => (
        <p key={c.id} style={{ opacity: c.pending ? 0.5 : 1 }}>{c.text}</p>
      ))}
      <form action={formAction}>
        <input name="text" />
        <SubmitButton>Post</SubmitButton>
      </form>
    </>
  );
}
```

The rollback is the valuable part. Hand-rolled optimistic updates usually get
the happy path right and the failure path wrong — leaving a comment on screen
that was never saved.

Use it where the action nearly always succeeds and the wait is noticeable:
likes, adding to a cart, toggling a flag. Do not use it where a failure would
be costly to reverse in the user's mind — a payment, a delete.

📖 [react.dev — `useOptimistic`](https://react.dev/reference/react/useOptimistic)

---

## 13. When to adopt React Hook Form

Hand-rolled forms are fine up to roughly a dozen fields with simple rules. Past
that, RHF earns its place:

```jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

function ProfileForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm({ resolver: zodResolver(ProfileSchema) });

  return (
    <form onSubmit={handleSubmit(save)}>
      <input {...register('name')} aria-invalid={Boolean(errors.name)} />
      {errors.name && <p role="alert">{errors.name.message}</p>}
      <button disabled={isSubmitting}>Save</button>
    </form>
  );
}
```

What you get: uncontrolled inputs by default (so no re-render per keystroke on
a 40-field form), validation wired to your Zod schema, touched/dirty tracking,
field arrays, and focus management on error.

What it costs: a dependency, an API to learn, and `register` spreading props in
a way that is less obvious than `value`/`onChange` when you are debugging.

**The honest guidance:** learn the manual version first — this module — because
RHF's abstractions only make sense once you know what they are replacing. Then
adopt it for anything with real validation. Do not adopt it for a search box.

---

## 14. Patterns worth knowing

### Resetting a form when the record changes

```jsx
<ProfileForm key={user.id} user={user} />
```

The `key` reset from [Module 8 §16](../08-state-structure/#16-the-key-reset-in-practice).
Better than an effect that copies props into state, on every count.

### Warning about unsaved changes

```jsx
useEffect(() => {
  if (!isDirty) return;
  const handler = (e) => { e.preventDefault(); };
  window.addEventListener('beforeunload', handler);
  return () => window.removeEventListener('beforeunload', handler);
}, [isDirty]);
```

### A multi-step wizard

Keep **one** state object for the whole wizard, plus a step index. Do not give
each step its own state — you lose everything when the user goes back.

```jsx
const [step, setStep] = useState(0);
const [data, setData] = useState(initialData);     // shared across all steps
```

Validate per step on "Next", and validate everything again on final submit.

### Debounced availability checks

```jsx
const debouncedUsername = useDebounce(username, 400);

useEffect(() => {
  if (!debouncedUsername) return;
  const controller = new AbortController();
  checkAvailability(debouncedUsername, controller.signal).then(setAvailable);
  return () => controller.abort();
}, [debouncedUsername]);
```

The cleanup matters — [Module 12](../12-effects/) is about why.

---

## 15. Self-check

1. Draw the controlled input loop. What happens if you set `value` but not
   `onChange`?
2. Which prop carries the value for: text, checkbox, radio, select, multi-select,
   file?
3. Why is `<textarea value={x} />` rather than `<textarea>{x}</textarea>`?
4. `e.target.value` on `<input type="number">` — what type is it, and what are
   the two traps?
5. Why does React put `value` on `<select>` instead of `selected` on `<option>`?
6. Why can you not set a file input's value?
7. Write one handler that serves eight fields of different types. What is the
   one fragile thing about it?
8. What do `defaultValue` and `defaultChecked` do, and what `useState` behaviour
   are they parallel to?
9. Read values from an uncontrolled form with `FormData`. What happens to an
   unchecked checkbox?
10. Give three situations that require controlled, and two where uncontrolled
    is better.
11. Explain "A component is changing an uncontrolled input to be controlled".
    Give the fix, including for data that loads late.
12. Why does the submit handler go on `<form>` and not the button? What must
    every non-submitting button in a form have?
13. Why is `disabled={isSubmitting}` not quite enough to prevent double submits?
14. Compare validating on change, on blur, and on submit. Describe the hybrid
    that users prefer and how to implement it.
15. Why derive `errors` rather than store them in state?
16. Give three reasons a Zod schema beats hand-written validators.
17. Why `aria-describedby={error ? id : undefined}` rather than `: ''`?
18. What problem does `useId` solve that a module counter does not?
19. What does `useActionState` remove from a hand-rolled form? Name four things.
20. Where must `useFormStatus` be called, and what happens if you get it wrong?
21. What is the genuinely hard part of optimistic updates that `useOptimistic`
    handles for you?
22. When is React Hook Form worth the dependency, and when is it not?

### Practical

1. Build a checkout form — text, email, select, radio group, checkbox, textarea
   — with one state object and one change handler.
2. Add validate-on-blur-then-on-change, with accessible errors and focus moved
   to the first invalid field on submit.
3. Rewrite it with `useActionState` + `useFormStatus` + a Zod schema. Compare
   the line counts and the re-render counts in the Profiler.
4. Build a three-step wizard that preserves data when you go back.
5. Add an optimistic "add to cart" with `useOptimistic`, then make the server
   fail and watch the rollback.

---

## 16. References

Official React documentation only.

**Forms and inputs**
- [Reacting to Input with State](https://react.dev/learn/reacting-to-input-with-state)
- [`<input>`](https://react.dev/reference/react-dom/components/input)
- [`<select>`](https://react.dev/reference/react-dom/components/select)
- [`<textarea>`](https://react.dev/reference/react-dom/components/textarea)
- [`<form>`](https://react.dev/reference/react-dom/components/form)
- [Sharing State Between Components](https://react.dev/learn/sharing-state-between-components)

**React 19 form features**
- [`useActionState`](https://react.dev/reference/react/useActionState)
- [`useFormStatus`](https://react.dev/reference/react-dom/hooks/useFormStatus)
- [`useOptimistic`](https://react.dev/reference/react/useOptimistic)
- [React 19 release notes — Actions](https://react.dev/blog/2024/12/05/react-19)

**Supporting**
- [`useId`](https://react.dev/reference/react/useId)
- [Choosing the State Structure](https://react.dev/learn/choosing-the-state-structure)
- [Preserving and Resetting State](https://react.dev/learn/preserving-and-resetting-state)
- [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
- [Using TypeScript](https://react.dev/learn/typescript)

---

**Previous:** [Module 9 — Reducers & Context](../09-reducers-and-context/)
**Next:** [Module 11 — Refs & the DOM](../11-refs-and-the-dom/)
