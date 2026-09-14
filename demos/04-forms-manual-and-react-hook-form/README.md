# Demo 4 — Forms: Reusable Fields, Manual Validation & react-hook-form

**Demo guide** · ~120 minutes · one field component built from scratch, a library of them, and two forms that share it

---

## Where you are starting from

The starter is **Demo 3, finished**: search, sort, a lifted wishlist, an
add-product dialog with hand-rolled validation over raw `Form.Control`s, and
delete with confirmation.

New in the box:

- `src/components/fields/TextField.tsx` — a stub. **You build this from
  scratch** in Lab 1.
- `src/components/fields/FieldShell.tsx` and `src/components/fields/index.tsx` —
  **finished**: a component for every other input type. Lab 3 walks through it.
- `src/components/fields/Field.tsx` — a stub; the react-hook-form bridge, Lab 3.
- `src/components/SignupForm.tsx` — a stub dialog, Lab 3.
- `src/lib/validation.ts` — option lists done; the validator and the schema are stubs. It also holds a hand-written `SignupValues` interface that Lab 4 deletes — the schema takes over defining it.
- `react-hook-form`, `zod` and `@hookform/resolvers` are already in `package.json`.

> **Continuity with the Demo Guide.** This demo is the applied version of the
> [React Demo Guide's §8 — Forms](../../study-guides/React-Demo-Guide.md): the
> same `TextField` contract (`value` in, `onChange(value)` out, `error`
> displayed not decided), the same manual-validation shape (`validate()` pure,
> derived errors, `touched` + `submitAttempted`), the same field library, and
> the same `Controller`-based `Field` wrapper for react-hook-form. If you've
> seen those labs, this is where they land in a real app.

## What you ship today

A `TextField` you understand line by line, a field library you can read in
ten minutes, the product form rebuilt on it with validation that shows errors
*when it should*, and a full sign-up dialog — eleven fields of six different
kinds — driven by react-hook-form and a zod schema, **using the same
components**.

By the end you will be able to answer, without hesitating:

- Why a field component must own **no state**, and what breaks if it does
- Why `onChange` reports a *value* and not an *event*
- The three questions of validation — rules, when to run, when to *show* — and why they're separate
- Why errors are derived, never stored, and what bug `setErrors` causes
- Why `register` can't drive our components and `Controller` can — and why that's the point
- What zod adds over `rules={…}`, in one concrete bug

---

## Before the demo (5 minutes)

```
https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/04-forms-manual-and-react-hook-form/starter
```

> ⚠️ Click once, bookmark the `stackblitz.com/edit/…` URL.

Locally: `cd demos/04-forms-manual-and-react-hook-form/starter && npm install && npm run dev`.

---

## The cold open

Open `src/components/ProductForm.tsx` from Demo 3. Five fields. Count the
lines that are *the same five times*: a `Form.Group`, a `Form.Label`, a
`Form.Control` with `value`, `onChange`, `isInvalid`, and a
`Form.Control.Feedback`. About twenty lines of markup per field, of which
three differ.

Now click **Add product** and press **Create** with everything empty. Four red
messages appear — correct. Close it, reopen, and start typing a title. Type
one letter. **Red, immediately**, on a field you've barely touched, because
`submitted` is still `true` from last time. Validation is *running* at the
right time; it's *showing* at the wrong one.

Two problems, one demo: the repetition, and the timing.

---

## Lab 1 — Build `TextField` from scratch (25 min)

### Problem

Every text field in the app repeats the same twenty lines. Any change — a
label style, where the error goes — is five edits. And it'll be fifty.

### Concept

**A field's markup differs in three ways; everything else is identical.**
Label, id, and type/placeholder. Write the shape once and make the three
differences props.

**Build it inert first.** Forms fail in two unrelated ways — *structure* (what
are the props, where does the id come from) and *behaviour* (who owns the
value). Mixing them is what makes forms feel hard. Get the structure right,
and the behaviour becomes one focused question.

**Then: who owns the value?** Two options, and only one works.

*Option 1 — the field owns it:* `const [value, setValue] = useState('')` inside
`TextField`. Each field works in isolation, and the form is useless — data
flows down, and the parent can't reach in. Four private boxes nobody can read.

*Option 2 — the parent owns it, the field reports changes.* One more prop:
`onChange`. **The field owns no state at all.** It renders what it's given and
reports what the user did. Every field in this demo follows that shape, which
is why Lab 3 can swap in a form library without editing a single field.

**`onChange` reports a value, not an event.**

```tsx
onChange: (value: string) => void      // ✅ the parent's vocabulary
onChange: (event: ChangeEvent) => void  // ❌ leaks the DOM upward
```

The first lets callers write `onChange={setTitle}` with no wrapper, and keeps
them ignorant that this happens to be an `<input>` — swap in a masked input
or a combobox later without touching a call site. The second couples every
caller to `e.target.value`.

**`error` is a prop, not internal state.** The field renders whatever message
it's handed and has no opinion about where it came from. That is exactly why
Labs 2, 3 and 4 change *who decides* without touching this file.

### Steps

All three steps are in **`src/components/fields/TextField.tsx`**.

**1. `TODO(lab-1.1)` — the structure.** Replace the component:

```tsx
interface TextFieldProps {
  controlId: string;      // required
  label: string;
  type?: string;          // optional (TypeScript's `?`)…
  placeholder?: string;
}

export function TextField({ controlId, label, type = 'text', placeholder }: TextFieldProps) {   // …with a default (JavaScript's `=`)
  return (
    <Form.Group className="mb-3" controlId={controlId}>
      <Form.Label className="small fw-semibold">{label}</Form.Label>
      <Form.Control type={type} placeholder={placeholder} value="" />
    </Form.Group>
  );
}
```

Three API decisions worth naming: **`controlId` is a prop, not a constant** —
Bootstrap uses it to wire the label to the input, so a hard-coded id would
give every instance the same `id` (invalid HTML; every label would focus the
first field). **`type` has a default** — text fields say nothing, password
fields say `type="password"`. **`placeholder` is optional** — a password
field doesn't want one.

Drop `<TextField controlId="try" label="Try me" />` into `App.tsx` under the
heading. Try to type. You can't — and the console says exactly why:
*"You provided a `value` prop to a form field without an `onChange` handler."*
That's the loop with the return half missing. Meet this warning on purpose
once; it's the most common React form error there is.

**2. `TODO(lab-1.2)` — controlled.**

```tsx
interface TextFieldProps {
  controlId: string;
  label: string;
  value: string;
  onChange: (value: string) => void;     // ← the missing half of the loop — and it takes a VALUE
  type?: string;
  placeholder?: string;
}

export function TextField({ controlId, label, value, onChange, type = 'text', placeholder }: TextFieldProps) {
  return (
    <Form.Group className="mb-3" controlId={controlId}>
      <Form.Label className="small fw-semibold">{label}</Form.Label>
      <Form.Control
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}   // ← a VALUE goes up, not the event
      />
    </Form.Group>
  );
}
```

In `App.tsx`, give your test field state: `const [t, setT] = useState('')` and
`<TextField controlId="try" label="Try me" value={t} onChange={setT} />`. You
can type. `onChange={setT}` — no wrapper — is the payoff of reporting a value.

**3. `TODO(lab-1.3)` — errors, hints, blur — and extract the shell.** Replace
the file:

```tsx
import { Form } from 'react-bootstrap';
import { FieldShell, type BaseFieldProps } from './FieldShell';

/** Attributes that pass straight through to the DOM control when the field is used UNCONTROLLED (name, defaultValue…). */
type ControlRest = Pick<React.InputHTMLAttributes<HTMLInputElement>, 'name' | 'defaultValue' | 'autoFocus' | 'required' | 'readOnly'>;

export interface TextFieldProps extends BaseFieldProps, ControlRest {
  value?: string;                              // optional: leave it (and onChange) off and the field is uncontrolled
  onChange?: (value: string) => void;
  onBlur?: () => void;
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'search';
  placeholder?: string;
  autoComplete?: string;
}

export function TextField({
  controlId, label, value, onChange, onBlur, error, hint,
  type = 'text', placeholder, autoComplete, disabled, ...rest
}: TextFieldProps) {
  return (
    <FieldShell controlId={controlId} label={label} error={error} hint={hint}>
      <Form.Control
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        isInvalid={Boolean(error)}
        {...(value !== undefined ? { value } : {})}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        onBlur={onBlur}
        {...rest}
      />
    </FieldShell>
  );
}
```

Now open **`FieldShell.tsx`** — it's already there, and it's what you'd have
extracted: `Form.Group` + `Form.Label` + `{children}` + hint + feedback. Every
other field in the library sits inside it too, so "where does the error go?"
is decided once.

Two details for later demos: **`value`/`onChange` are optional** — leave them
off and the field is *uncontrolled*, with `name` and `defaultValue` flowing
through `...rest` to the DOM (the router's `<Form>` in Demo 10 wants exactly
that). `ControlRest` is the typed whitelist of what may flow through — `Pick`
from React's own input attributes, so a typo in a prop name is caught.
**`onBlur`** tells the parent the field was *visited*, which Lab 2 needs.

`BaseFieldProps` (in `FieldShell.tsx`) is the five props every field shares —
`controlId`, `label`, `error`, `hint`, `disabled`. Each field `extends` it, so
the contract is written once.

Remove the test field from `App.tsx`.

### Verify

`TextField` renders a label and an input; passing `error="Nope"` turns it red
with the message beneath; passing `hint="Optional"` shows grey help text that
disappears while an error shows. `npm run lint` is clean.

### Watch out

**`useState` inside `TextField`.** Each field works alone and the form can't
read any of them. There is no patch for this; it's the wrong shape.

**`onChange={onChange}`** passing the event straight up. Now every caller
unwraps `e.target.value`, and none of them can be swapped for a non-input
control. Unwrap *inside* the field, once.

**Giving every instance the same `controlId`.** Click a label — focus lands on
the *first* field every time. Reusability isn't only about the visible text.

### Challenge (2 min)

Make the label optional with a `srOnlyLabel` prop that renders it
`visually-hidden`. Where does the change go — `TextField`, or `FieldShell`?
Why?

### In the real world

The decision to report a *value* rather than an *event* looks cosmetic and is
the whole reason Lab 3 works. Every form library in the ecosystem expects a
component that takes `value` and calls `onChange(value)` — because that's
what `<input>` does, minus the DOM. Design your fields to that contract and
they outlive the library you pair them with.

---

## Lab 2 — Manual validation, done properly (30 min)

### Problem

Demo 3's `ProductForm` validates, but it shows errors at the wrong time, and
its five raw `Form.Control`s are the repetition we just fixed.

### Concept

**Three questions, and they're independent.** Muddling them is what makes
hand-rolled validation feel harder than it is:

1. **What are the rules?** A pure function: values in, errors out. No React,
   no DOM. Testable without rendering anything, reusable on a server.
2. **When do you run them?** Every render. **Derive errors; never store them.**
   A stored `setErrors(validate(values))` inside the change handler validates
   the *previous* values — errors lag one keystroke behind. Deriving cannot
   have that bug.
3. **When do you *show* them?** That's the `touched` question:

| Strategy | Behaviour | Use when |
|---|---|---|
| On submit | errors appear only after a submit attempt | short forms — least annoying |
| On blur | each field validates when you leave it | medium forms with format rules |
| On change, after first touch | live feedback for visited fields | long forms, password rules |
| On change, always | red under "Password" before you've typed the second character | almost never — hostile |

The last row is why `touched` exists: live feedback *after* the user has
engaged with a field, not before.

**Three concerns, three places:** `errors` says what's wrong. `errorFor(field)`
says whether to mention it yet. `TextField` says how it looks.

**The guard clause.** `if (!isValid) return;` in the submit handler means
there is exactly one path out of the form that reaches whatever consumes it,
and it's only reachable with valid data.

### Steps

**A. `src/lib/validation.ts` — `TODO(lab-2.1)`**

```ts
/** At most one message per field, keys checked against the draft type — a typo is a compile error. */
export type ProductErrors = Partial<Record<keyof ProductDraft, string>>;

export function validateProduct(values: ProductDraft): ProductErrors {
  const errors: ProductErrors = {};
  if (values.title.trim().length < 2) errors.title = 'Give it a name of at least 2 characters.';
  if (!(values.price > 0)) errors.price = 'Price must be more than zero.';
  if (!values.category) errors.category = 'Pick a category.';
  if (!Number.isInteger(values.stock) || values.stock < 0) errors.stock = 'Stock must be a whole number, zero or more.';
  if (values.description.length > 300) errors.description = 'Keep it under 300 characters.';
  return errors;
}
```

`PRODUCT_EMPTY` has `price: NaN` — an *empty* number box, which `NumberField`
renders as blank. `!(NaN > 0)` is `true`, so the rule fires. Numbers are
numbers now, all the way through; there's no `Number(draft.price)` at submit.

**B. `src/components/ProductForm.tsx` — `TODO(lab-2.2)`** — replace the file:

```tsx
import { useState } from 'react';
import { Button, Col, Form, Modal, Row } from 'react-bootstrap';
import { NumberField, SelectField, TextAreaField, TextField } from './fields';
import { PRODUCT_EMPTY, validateProduct } from '../lib/validation';
import type { CategoryOption, ProductDraft } from '../types';

type Touched = Partial<Record<keyof ProductDraft, boolean>>;

interface ProductFormProps {
  show: boolean;
  categories: CategoryOption[];
  onCreate: (payload: ProductDraft) => void;
  onClose: () => void;
}

export function ProductForm({ show, categories, onCreate, onClose }: ProductFormProps) {
  const [draft, setDraft] = useState<ProductDraft>(PRODUCT_EMPTY);   // numbers are numbers now — no DraftStrings
  const [touched, setTouched] = useState<Touched>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const errors = validateProduct(draft);           // derived every render — never setErrors()
  const isValid = Object.keys(errors).length === 0;

  function set<K extends keyof ProductDraft>(field: K, value: ProductDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
  }
  function touch(field: keyof ProductDraft) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  /** `errors` says what is wrong; this says whether to mention it YET. */
  function errorFor(field: keyof ProductDraft): string | undefined {
    if (!errors[field]) return undefined;
    return touched[field] || submitAttempted ? errors[field] : undefined;
  }

  function reset() {
    setDraft(PRODUCT_EMPTY);
    setTouched({});
    setSubmitAttempted(false);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitAttempted(true);
    if (!isValid) return;                          // the ONE guard
    onCreate({ ...draft, title: draft.title.trim(), description: draft.description.trim() });
    reset();
  }

  function handleClose() {
    reset();
    onClose();
  }

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Form noValidate onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title className="h6">Add a product</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {/* `(v) => set('title', v)`: v is a string here, a number in the NumberFields below — each field's onChange is typed */}
          <TextField controlId="pf-title" label="Title" autoFocus
            value={draft.title} onChange={(v) => set('title', v)} onBlur={() => touch('title')} error={errorFor('title')} />

          <Row>
            <Col sm={6}>
              <NumberField controlId="pf-price" label="Price" prefix="$" min={0} step={0.01}
                value={draft.price} onChange={(v) => set('price', v)} onBlur={() => touch('price')} error={errorFor('price')} />
            </Col>
            <Col sm={6}>
              <NumberField controlId="pf-stock" label="Stock" min={0} step={1}
                value={draft.stock} onChange={(v) => set('stock', v)} onBlur={() => touch('stock')} error={errorFor('stock')} />
            </Col>
          </Row>

          <SelectField controlId="pf-category" label="Category" placeholder="Choose…" options={categoryOptions}
            value={draft.category} onChange={(v) => set('category', v)} onBlur={() => touch('category')} error={errorFor('category')} />

          <TextAreaField controlId="pf-description" label="Description" rows={2} maxLength={300} hint="Optional."
            value={draft.description} onChange={(v) => set('description', v)} onBlur={() => touch('description')} error={errorFor('description')} />
        </Modal.Body>

        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleClose}>Cancel</Button>
          <Button type="submit">Create product</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
```

Each field is now one declaration. `App.tsx` doesn't change — `ProductForm`'s
props are the same as Demo 3's.

### Verify

Open **Add product**. Nothing is red. Click into **Title**, type one letter,
click into **Price**: *now* Title goes red — you left it. Fix it; the red
clears as you type (derived). Press **Create** with Category empty: only the
untouched fields light up, all at once (`submitAttempted`). Type `1.5` into
Stock: *"whole number"*. Clear the Price box entirely: the message says
*"more than zero"*, not `NaN` — `NumberField` decided what empty means.

Now reproduce the derived-vs-stored bug on purpose: replace
`const errors = validateProduct(draft)` with a `useState` + `setErrors(validateProduct(next))`
inside `set()`. Type a valid title, then delete one character quickly. The
message is one keystroke behind. Put the derivation back.

### Watch out

**`setErrors(…)` in the change handler.** Validates the previous value. Derive.

**`isInvalid={!!errors.title}`** without the `errorFor` gate. Every field is
red before the user has typed. Gate on touched-or-submitted.

**`onBlur={touch('title')}`** — with parentheses. Called during render;
"Too many re-renders". `() => touch('title')`.

### Challenge (2 min)

Add a `dirty` flag (`draft !== PRODUCT_EMPTY` isn't enough — why?) and use it
to ask "Discard changes?" when the user closes the dialog with input in it.

### In the real world

The `touched`/`submitAttempted`/`errorFor` trio is about thirty lines and
you'll write it once per hand-rolled form. That number — thirty, times every
form — is the case Lab 3 makes for a library. But you should write it once,
here, so that when the library does it for you, you know what it's doing.

---

## Lab 3 — The field library, and react-hook-form (35 min)

### Problem

The product form has four field kinds. A sign-up form has more: dates, radio
groups, checkbox groups, ranges, files. Each input type reads its value from
the DOM *differently* — and each form would re-solve that. And the thirty
lines of state machinery from Lab 2 would be written again.

### Concept — the library

Open **`src/components/fields/index.tsx`**. Ten components, one contract:
*value in, `onChange(value)` out, `error` displayed not decided, no state.*
Each input type's awkward read is solved **once**:

| Component | The awkward read, solved inside |
|---|---|
| `NumberField` | `valueAsNumber` — never the string `"42"`; decides what an empty box means (`emptyValue`) |
| `TextAreaField` | a live `n/max` counter, red past the limit |
| `SelectField` | a `placeholder` option that maps to `''` |
| `MultiSelectField` | `selectedOptions`, not `value` |
| `CheckboxField` | `e.target.checked`, not `.value` — takes `checked`, not `value` |
| `RadioGroupField` | one shared `name` makes them mutually exclusive |
| `CheckboxGroupField` | the value is an **array**, updated immutably |
| `DateField` | ISO strings, deliberately — parse to `Date` at the edge |
| `RangeField` | `Number(e.target.value)`, and a formatted readout |
| `FileField` | `files[0]`; takes `file`, not `value` — a file input can never be controlled |

Two exceptions to `{...f}` spreading: `CheckboxField` (`checked`) and
`FileField` (`file`). Everything else takes exactly `value`/`onChange`/`onBlur`/`error`.

### Concept — react-hook-form

**The question is not "how do I use `register`?"** It's **"does my component
library survive?"** It does, and understanding why is the payoff for Lab 1.

`register('firstName')` returns `{ name, onChange, onBlur, ref }` where
`onChange` expects a **DOM event**. Spread it onto a raw `Form.Control` and it
works — react-bootstrap forwards the ref to the real `<input>`. Our
`TextField` takes `onChange(value)` and accepts no ref. **`register` can't
drive it — by design**, because Lab 1 chose the parent's vocabulary over the
DOM's.

**`<Controller>` is the bridge.** It subscribes one field to the form and
hands your component `{ value, onChange, onBlur }` plus the field's error.
Written out it's eight lines per field; the `Field` wrapper makes it three.

**And it's generic, which is the TypeScript payoff.** `Field<TValues, TName>`
knows the form's values type and *which* field it's rendering, so
`PathValue<TValues, TName>` is the type of *that* field: a `string` for
`firstName`, a `number` for `age`, a `File | null` for `avatar`. Spread `{...f}`
into the wrong component and the compiler says so — and inside a `rules`
`validate`, `v` is already the right type.

**What you get:** the submit lifecycle, `isSubmitting`, `reset`, `setError`
(for server-side failures), `touched`/`dirty` tracking, and validation
orchestration — all of Lab 2's thirty lines, gone. **What you give up,
honestly:** `register`'s no-re-render-on-typing optimisation, for the
controlled fields only. Each field re-renders alone, not the whole form,
which is the part that matters.

### Steps

**A. `src/components/fields/Field.tsx` — `TODO(lab-3.1)`**

```tsx
import type { ReactElement } from 'react';
import { Controller, type Control, type FieldPath, type FieldValues, type PathValue, type RegisterOptions } from 'react-hook-form';

/** Exactly the four props every field component accepts — so `{...f}` spreads straight in. */
export interface FieldRenderProps<TValue> {
  value: TValue;
  onChange: (value: TValue) => void;
  onBlur: () => void;
  error?: string;
}

interface FieldProps<TValues extends FieldValues, TName extends FieldPath<TValues>> {
  name: TName;                        // must be a key of the form's values
  control: Control<TValues>;
  rules?: Omit<RegisterOptions<TValues, TName>, 'valueAsNumber' | 'valueAsDate' | 'setValueAs' | 'disabled'>;
  children: (field: FieldRenderProps<PathValue<TValues, TName>>) => ReactElement;   // value typed PER FIELD
}

export function Field<TValues extends FieldValues, TName extends FieldPath<TValues>>({
  name,
  control,
  rules,
  children,
}: FieldProps<TValues, TName>) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) =>
        children({
          value: field.value,
          onChange: field.onChange,      // takes a bare value — our fields' contract, exactly
          onBlur: field.onBlur,
          error: fieldState.error?.message,
        })
      }
    />
  );
}
```

**B. `src/components/SignupForm.tsx` — `TODO(lab-3.2)`**

Replace the file. Rules live on each `Field` for now (Lab 4 moves them):

```tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Button, Col, Form, Modal, Row, Spinner } from 'react-bootstrap';
import {
  CheckboxField, CheckboxGroupField, DateField, Field, FileField,
  NumberField, RadioGroupField, RangeField, SelectField, TextField,
} from './fields';
import { COUNTRIES, GENDERS, INTERESTS, SIGNUP_EMPTY, type SignupValues } from '../lib/validation';

interface SignupFormProps {
  show: boolean;
  onClose: () => void;
}

export function SignupForm({ show, onClose }: SignupFormProps) {
  const [welcome, setWelcome] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { isSubmitting, isDirty },
  } = useForm<SignupValues>({          // ← the form's values type; every `name` below is checked against it
    mode: 'onTouched',                 // Lab 2's `touched` strategy, as one option
    defaultValues: SIGNUP_EMPTY,
  });

  /** Called ONLY with valid data — Lab 2's guard clause, built in. */
  async function onValid(values: SignupValues) {
    await new Promise((resolve) => setTimeout(resolve, 700));   // stand-in for POST /users/add — Demo 8's challenge

    if (values.email.endsWith('@taken.com')) {
      setError('email', { message: 'That email is already registered.' });   // a SERVER failure, on its field
      return;
    }

    setWelcome(`${values.firstName}, your account is ready. Following: ${values.interests.join(', ')}.`);
    reset();
  }

  function handleClose() {
    reset();
    setWelcome(null);
    onClose();
  }

  return (
    <Modal show={show} onHide={handleClose} centered size="lg" backdrop={isSubmitting ? 'static' : true}>
      <Form noValidate onSubmit={handleSubmit(onValid)}>
        <Modal.Header closeButton={!isSubmitting}>
          <Modal.Title className="h6">Create your ShopScope account</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {welcome && <Alert variant="success" dismissible onClose={() => setWelcome(null)}>{welcome}</Alert>}

          <Row>
            <Col sm={6}>
              <Field name="firstName" control={control} rules={{ required: 'First name is required.' }}>
                {(f) => <TextField controlId="su-firstName" label="First name" autoComplete="given-name" {...f} />}
              </Field>
            </Col>
            <Col sm={6}>
              <Field name="lastName" control={control} rules={{ required: 'Last name is required.' }}>
                {(f) => <TextField controlId="su-lastName" label="Last name" autoComplete="family-name" {...f} />}
              </Field>
            </Col>
          </Row>

          <Row>
            <Col sm={6}>
              <Field name="email" control={control}
                rules={{ required: 'Email is required.', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "That doesn't look like an email address." } }}>
                {(f) => <TextField controlId="su-email" label="Email" type="email" autoComplete="email" placeholder="try someone@taken.com" {...f} />}
              </Field>
            </Col>
            <Col sm={6}>
              <Field name="password" control={control}
                rules={{ required: 'Password is required.', minLength: { value: 8, message: 'Use at least 8 characters.' }, validate: (v) => /\d/.test(v) || 'Include at least one number.' }}>
                {(f) => <TextField controlId="su-password" label="Password" type="password" autoComplete="new-password" hint="At least 8 characters, including a number." {...f} />}
              </Field>
            </Col>
          </Row>

          <Row>
            <Col sm={4}>
              {/* `v` is a number here — Field is generic over the field name, so each rule sees its own type */}
              <Field name="age" control={control}
                rules={{ validate: (v) => (Number.isFinite(v) ? (v >= 18 || 'You must be 18 or over.') : 'Age is required.') }}>
                {(f) => <NumberField controlId="su-age" label="Age" min={0} max={120} {...f} />}
              </Field>
            </Col>
            <Col sm={4}>
              <Field name="birthDate" control={control} rules={{ required: 'Pick your date of birth.' }}>
                {(f) => <DateField controlId="su-birthDate" label="Date of birth" max="2010-01-01" {...f} />}
              </Field>
            </Col>
            <Col sm={4}>
              <Field name="country" control={control} rules={{ required: 'Pick a country.' }}>
                {(f) => <SelectField controlId="su-country" label="Country" placeholder="Choose…" options={COUNTRIES} {...f} />}
              </Field>
            </Col>
          </Row>

          <Field name="gender" control={control} rules={{ required: 'Pick one.' }}>
            {(f) => <RadioGroupField controlId="su-gender" label="Gender" options={GENDERS} {...f} />}
          </Field>

          <Field name="interests" control={control} rules={{ validate: (v) => v.length > 0 || 'Follow at least one category.' }}>
            {(f) => <CheckboxGroupField controlId="su-interests" label="Categories to follow" options={INTERESTS} hint="Pick any number." {...f} />}
          </Field>

          <Field name="budget" control={control}>
            {(f) => <RangeField controlId="su-budget" label="Monthly budget" min={0} max={5000} step={50} format={(n) => `$${n}`} {...f} />}
          </Field>

          <Field name="avatar" control={control}
            rules={{ validate: (f) => !f || f.type.startsWith('image/') || 'Images only, please.' }}>
            {/* FileField takes `file`, not `value` — the one component that can't use {...f} */}
            {({ value, onChange, error }) => (
              <FileField controlId="su-avatar" label="Profile picture (optional)" accept="image/*" file={value} onChange={onChange} error={error} />
            )}
          </Field>

          {/* CheckboxField takes `checked`, not `value` */}
          <Field name="newsletter" control={control}>
            {({ value, onChange }) => <CheckboxField controlId="su-newsletter" type="switch" label="Email me about deals" checked={value} onChange={onChange} />}
          </Field>

          <Field name="terms" control={control} rules={{ validate: (v) => v || 'You must accept the terms.' }}>
            {({ value, onChange, error }) => <CheckboxField controlId="su-terms" label="I accept the terms and conditions" checked={value} onChange={onChange} error={error} />}
          </Field>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => reset()} disabled={!isDirty || isSubmitting}>Reset</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Spinner as="span" size="sm" animation="border" className="me-2" />}
            {isSubmitting ? 'Creating…' : 'Create account'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
```

Count what Lab 2 needed that isn't here: `draft`, `set`, `touched`, `touch`,
`submitAttempted`, `errorFor`, `isValid`, the guard clause, `reset`'s body.
Eleven fields, none of that.

**C. `src/components/SiteHeader.tsx` — `TODO(lab-3.3)`** — a button that
opens it. The header owns this one piece of state; nothing else needs it:

```tsx
import { useState } from 'react';
import { Cart3, Heart, PersonPlus, Shop } from 'react-bootstrap-icons';
import { SignupForm } from './SignupForm';
// …
const [showSignup, setShowSignup] = useState(false);   // inferred boolean — no annotation needed
// …after the cart button, inside the right-hand group:
<Button variant="light" size="sm" onClick={() => setShowSignup(true)}>
  <PersonPlus className="me-1" />
  Sign up
</Button>
// …just before </Navbar>:
<SignupForm show={showSignup} onClose={() => setShowSignup(false)} />
```

### Verify

**Sign up.** Tab through the first three fields without typing: they go red as
you *leave* each one — `mode: 'onTouched'` is Lab 2's strategy as a config
line. Fill it in, submit: the button spins for 700 ms, a green welcome names
you and your categories, and the form resets. Submit with `someone@taken.com`:
the error appears **under the email field**, from `setError` — a server-side
failure, placed exactly where the user can act on it.

Now the experiment that proves Lab 1's point: replace one `Field` with
`<TextField controlId="x" label="Raw register" {...register('firstName')} />`.
It breaks — no `ref` to attach, and `register`'s `onChange` wants an event.
Put `{...register('firstName')}` on a raw `<Form.Control>` instead and it
works. **`register` for real DOM inputs; `Controller` for your own
components.** Mixing them in one form is normal.

### Watch out

**`{...f}` on `CheckboxField` or `FileField`.** They take `checked`/`file`, so
`value` is ignored and the control never shows the state. Destructure for
those two.

**`rules={{ required: … }}` on a checkbox.** `required` on a boolean accepts
`false` in some cases — it's subtle enough to get wrong. Lab 4 fixes it
properly with `z.literal(true)`.

**Forgetting `mode`.** The default is `onSubmit` — no red until you press the
button. Fine for short forms; for eleven fields, `onTouched`.

### Challenge (2 min)

`Field` has one job: adapt `Controller`'s output to our contract. Write the
`firstName` field *without* it — the eight-line `Controller` longhand. Then
decide: does the repetition belong in the component, or at the call site?

### In the real world

"Does my component library survive the form library?" is the question that
decides whether adopting react-hook-form costs a day or a month. Components
designed to Lab 1's contract survive it untouched. Components that own state,
or that leak events, get rewritten — and that's the month.

---

## Lab 4 — Swap the rules for a zod schema (20 min)

### Problem

The rules are scattered across eleven `Field`s, three of them as `validate`
escape hatches, and `required` on the terms checkbox is quietly wrong.

### Concept

**A schema is the rules as data.** One readable block; testable with no
renderer; the same file can run on a server. And it doesn't know whether your
form keeps state in `useState` or in react-hook-form — only the line that
*runs* it differs.

**In TypeScript it's also the type.** `z.input<typeof signupSchema>` is the
shape of the values *going in* — so the hand-written `SignupValues` interface
from Lab 3 gets deleted, and rules and type can never disagree again. Add a
field to the schema and every `<Field name=…>` that should use it lights up.

**What the resolver fixes, specifically:**

| Field | Was | Now |
|---|---|---|
| `age` | a `validate` function checking for `NaN` | `z.number({ error: 'Age is required.' }).min(18)` |
| `terms` | `required` — accepts `false` in edge cases | `z.boolean().refine((v) => v)` — doesn't |
| `avatar` | a `validate` function | `.refine()`, twice, readable |

The `terms` row is a real bug fix, not a tidy-up. `z.boolean()` alone would
accept `false`; the refine says exactly what you mean.

**Why `.refine` and not `z.literal(true)`?** In JavaScript, `z.literal(true)`
is the idiomatic spelling. In TypeScript we go one step further and **derive
the form's type from the schema** — `type SignupValues = z.input<typeof signupSchema>`
— and `z.literal(true)` would make that type say `terms: true`, so the default
value `false` wouldn't compile. `z.boolean().refine(…)` keeps the *type* `boolean`
and the *rule* "must be true". Same for `gender`: `.or(z.literal(''))` lets the
untouched radio group's `''` exist in the type, and the refine rejects it.

### Steps

**A. `src/lib/validation.ts` — `TODO(lab-4.1)`**

```ts
import { z } from 'zod';
// …delete the hand-written `interface SignupValues` — the schema is about to define it…

const GENDER_VALUES = ['female', 'male', 'other'] as const;
export type Gender = (typeof GENDER_VALUES)[number];        // 'female' | 'male' | 'other', derived

export const signupSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required.'),
  lastName: z.string().trim().min(1, 'Last name is required.'),
  email: z.email("That doesn't look like an email address."),
  password: z.string().min(8, 'Use at least 8 characters.').regex(/\d/, 'Include at least one number.'),
  age: z.number({ error: 'Age is required.' }).int('Whole years, please.').min(18, 'You must be 18 or over.').max(120, 'That seems unlikely.'),
  birthDate: z.string().min(1, 'Pick your date of birth.'),
  // '' is what an untouched radio group holds; the refine is what makes it an error.
  gender: z.enum(GENDER_VALUES).or(z.literal('')).refine((v) => v !== '', 'Pick one.'),
  country: z.string().min(1, 'Pick a country.'),
  interests: z.array(z.string()).min(1, 'Follow at least one category.'),
  budget: z.number().min(0).max(5000),
  newsletter: z.boolean(),
  // z.boolean() alone would accept `false`. The refine says exactly what we mean.
  terms: z.boolean().refine((v) => v, 'You must accept the terms.'),
  avatar: z.instanceof(File).nullable()
    .refine((f) => !f || f.type.startsWith('image/'), 'Images only, please.')
    .refine((f) => !f || f.size <= 2_000_000, 'Keep it under 2 MB.'),
});

/** The form's values, DERIVED from the schema — one source of truth for rules AND type. */
export type SignupValues = z.input<typeof signupSchema>;

export const SIGNUP_EMPTY: SignupValues = { /* …unchanged… */ };
```

(This is zod **4** syntax — `z.email()` at the top level, and `{ error }` for
custom messages. zod 3 tutorials write `z.string().email()` and
`{ errorMap }`.)

**B. `src/components/SignupForm.tsx`** — same marker:

```tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { COUNTRIES, GENDERS, INTERESTS, SIGNUP_EMPTY, signupSchema, type SignupValues } from '../lib/validation';
// …
useForm<SignupValues>({
  resolver: zodResolver(signupSchema),   // ← the one addition
  mode: 'onTouched',
  defaultValues: SIGNUP_EMPTY,
});
```

Then **delete every `rules={…}` prop** from the `Field`s. Eleven fields, zero
rules in the JSX. And delete the hand-written `interface SignupValues` from
`validation.ts` — the `export type SignupValues = z.input<…>` line replaces it.
Nothing else changes: `useForm<SignupValues>` and every `Field` still
compile, because the derived type has the same shape.

### Verify

Identical behaviour — plus: clear the Age box and leave it: *"Age is
required."* Type `17`: *"You must be 18 or over."* Type `17.5`: *"Whole years,
please."* Untick Terms and submit: `z.literal(true)` fires. Pick a 3 MB image:
*"Keep it under 2 MB."*

Now run the schema with no React at all, in the console:

```ts
const { signupSchema } = await import('/src/lib/validation.ts');   // Vite serves .ts to the browser in dev
signupSchema.safeParse({ firstName: '', email: 'nope' }).error.issues.map((i) => [i.path[0], i.message]);
```

Every rule, testable in a terminal. That's the argument.

### Watch out

**Leaving `rules` on a `Field` with a resolver.** They're ignored — the
resolver owns validation. Delete them so nobody's misled.

**`z.string().email()`.** Deprecated in zod 4; use `z.email()`.

**Validating the *product* form with zod too?** You could, and in a real
codebase you'd pick one approach. We keep `validateProduct` hand-rolled on
purpose — so both shapes stay visible in one app.

### Challenge (2 min)

Wrap the manual `ProductForm`'s rules in a zod schema too, and call
`schema.safeParse(draft)` where `validateProduct(draft)` was. How many lines
change in the component? (Answer: the one that computes `errors`.)

### In the real world

Schema-first validation is where most teams land: zod (or valibot, or yup)
for the rules, react-hook-form for the lifecycle, your own components for the
UI. The three never learn about each other, which is why each can be replaced
alone.

---

## Wrap-up — what you can now do

- [x] Build a field component that owns no state and reports values, not events
- [x] Separate the three validation questions and answer each in its own place
- [x] Derive errors instead of storing them, and gate their *display* on touched/submitted
- [x] Read the field library and say what each component solves once
- [x] Explain why `register` can't drive your components and `Controller` can
- [x] Drive eleven fields with react-hook-form and none of Lab 2's machinery
- [x] Move the rules into a zod schema and name the bug it fixes

**Two forms, one library.** `ProductForm` is hand-rolled; `SignupForm` uses
react-hook-form + zod. Both render the same `TextField`. That is the
property that matters, and it came from a decision in Lab 1.

## Next demo

**Demo 5 — Effects & the Network.** The 24 bundled products are replaced by a
live API. `ProductForm`'s `onCreate` is about to become an `await`.

---

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| Can't type in a field | `value` with no `onChange` — the loop is half-built. Lab 1.2. |
| Every field red on open | Missing the `errorFor` gate — check `touched \|\| submitAttempted`. |
| Error is one keystroke behind | You stored errors. Derive them. |
| Checkbox never shows its state | `{...f}` spread — `CheckboxField` takes `checked`. Destructure. |
| `register(...)` on `TextField` throws / does nothing | No `ref`, wrong `onChange` shape. Use `Field`. |
| `rules` seem ignored | There's a `resolver` — it owns validation. Delete the rules. |
| `z.string().email is not a function` / deprecation | zod 4: `z.email()`. |
| `Type 'false' is not assignable to type 'true'` on `SIGNUP_EMPTY` | You used `z.literal(true)` for `terms`. With `z.input` as the form's type, use `z.boolean().refine(…)` — see Lab 4. |
| Labels focus the wrong input | Duplicate `controlId`s. |
