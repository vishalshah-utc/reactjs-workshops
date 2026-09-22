# Demo 21 — React 19 Actions, Suspense & Server Components

**Demo guide** · ~130 minutes · three ways to submit a form now live in this codebase, and each of them is the wrong choice somewhere else

---

## Where you are starting from

The starter is **Demo 20, finished**: 95 tests in 9 files, Vitest configured on
top of the real `vite.config.ts`, MSW answering every DummyJSON endpoint the
app can reach, `createRoutesStub` over the loaders and actions, and one
Playwright journey. Under that sits everything the first nineteen demos built
— an axios instance with four interceptors and a JWT refresh queue, validated
env, React Router 8 in Data Mode, TanStack Query, two Zustand stores,
react-hook-form and zod, the React Compiler, a bundle budget.

Nothing in it is broken. Today is not a bug-fix demo — it is the one where
you learn what React 19 added, decide which parts this application should
adopt, and then go and look at the part it should not.

**New stubs:** `src/components/SubmitButton.tsx`,
`src/components/WishlistButton.tsx`, `src/components/PageMeta.tsx`,
`src/api/services/wishlist.ts`, and three test files —
`SignupForm.test.tsx`, `WishlistButton.test.tsx`, `PageMeta.test.tsx`.
`src/test/fixtures.ts` gains a `reviewsFor(id)` factory, given to you
finished: it is data, not a lesson.

**New dependencies in `starter`: none.** `useActionState`, `useFormStatus`,
`useOptimistic`, `use`, `<Suspense>` and document metadata hoisting are all in
the `react@19.3.0` and `react-dom@19.3.0` you have had installed since Demo 1.
That is worth a sentence of its own: **the whole of Blocks 1 to 3 is free.**

Block 5 is the exception. `next-mini/` is a **sibling** of `starter/` with its
own `package.json` pinning `next@16.3.5` alongside the same
`react@19.3.0`/`react-dom@19.3.0`, and its own `npm install`. It is outside
`starter/` on purpose: the Vite project's `tsconfig.app.json`, `vitest.config.ts`
and bundle-budget script all point at `starter/src`, and the track's shared
dependency set has no `next` in it.

## What you ship today

**The sign-up form, rebuilt on React Actions.** `<form action={fn}>` with
`useActionState`, a `useFormStatus` submit button that is told nothing and
knows everything, and a zod schema that did not change one character — because
it never cared who was calling it. **An optimistic wishlist toggle** whose
heart fills in before the server has agreed and empties again, on its own,
when the server refuses — with no rollback code written anywhere. **A product
page that streams**: the loader returns a promise it never awaited, the
reviews panel reads it with `use()` inside a `<Suspense>` boundary, and the
page renders a second and a half before the reviews do. **Per-route `<title>`
and `<meta>`**, hoisted into `<head>` by React itself, with an honest note
about what a crawler still sees. And **a Next.js mini-project** where the
product list is an `async` Server Component, the add-to-cart button is the
one `'use client'` island, and you can measure exactly what that island costs.

By the end you will be able to answer, without hesitating:

- What a React Action is, and the three things `useActionState` hands back
- Why `useFormStatus` lives in `react-dom` and why it must be called in a child of the `<form>`
- When React Actions beat a router action, when a router action beats them, and when react-hook-form beats both
- What `useOptimistic` actually does — and why "the rollback" is not code you write
- The difference between `await`ing a promise in a loader and returning it, in one sentence about waterfalls
- Where a `<Suspense>` boundary goes, and what goes wrong one level too high
- What `'use client'` marks — and why calling it "a file switch" is the misconception that costs teams a week
- Why a Server Function is a public endpoint, and the two things you must therefore do inside one
- When RSC is not the answer, with this application as the worked example

> **The one idea today.** React 19 did not replace the way you write forms,
> fetch data or render pages. It added a *layer underneath* all three — the
> Action — and then built pending state, optimistic state, form status,
> streaming and Server Functions on top of it. Learn the layer and the five
> features stop being five features.
> 📖 [study-notes 19](../../study-notes/19-server-components/) and
> [study-notes 10 §11–12](../../study-notes/10-forms/) are today's theory.

---

## Before the demo (5 minutes)

```
https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/21-react-19-actions-suspense-and-server-components/starter
```

> ⚠️ Click once, bookmark the `stackblitz.com/edit/…` URL. Fork it again
> tomorrow and you will be looking at an empty copy of your work.

Locally:

```bash
cd demos/21-react-19-actions-suspense-and-server-components/starter
npm install
npm run dev
```

And a second terminal, open all day:

```bash
npm run test:watch
```

It starts green — 95 passing, 11 `todo`. Those eleven are your scoreboard.

Block 5 needs its own install, and it is a separate one. Start it now, in a
third terminal, so it is finished by the time you get there:

```bash
cd demos/21-react-19-actions-suspense-and-server-components/next-mini
npm install
```

Twenty-eight packages, about fifteen seconds. If your network blocks it,
Block 5 still works as a code read — every file is in this guide.

---

## The cold open

Open two files side by side. No code changes yet — just read them.

**Left: `src/components/SignupForm.tsx`** (Demo 4). Twelve fields. At the top:

```tsx
const { control, handleSubmit, reset, setError, formState: { isSubmitting, isDirty } } = useForm<SignupValues>({
  resolver: zodResolver(signupSchema),
  mode: 'onTouched',
  defaultValues: SIGNUP_EMPTY,
});
```

Every field is wrapped in a `<Field name=… control={control}>` render prop.
A server-side failure is pushed onto a field with `setError('email', …)`. The
submit path is `onSubmit={handleSubmit(onValid)}`. It works, it is good code,
and it is 43 kB of library.

**Right: `src/routes/LoginPage.tsx`** (Demo 10). Two fields. No library at
all:

```tsx
<RouterForm method="post">
  <TextField controlId="username" name="username" label="Username" />
  <TextField controlId="password" name="password" label="Password" type="password" />
  <Button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
</RouterForm>
```

…and an `export async function loginAction({ request })` that reads
`await request.formData()`, returns `{ error }` on a bad password and a
`redirect()` on a good one. No state, no `onChange`, no `preventDefault`.

Two forms, two completely different shapes, and the reason has nothing to do
with how hard the forms are. The login form is a **route**, so it can be a
router action. The sign-up form is a **modal** that does not own a URL, so in
Demo 4 there was nothing in between "a library" and "a dozen `useState`s".

**React 19 shipped the thing in between.** Ask the room, before you show them:
*what would you have to add to the login form to make it work in a modal?* The
answers — a pending flag, a return value for errors, somewhere to put the
submit handler — are, exactly and in order, `useActionState`, an action's
return value and `<form action>`.

Now run the sign-up form once, so everyone has seen it working. Sign-up →
type `someone@taken.com` → **Create account** → the spinner, then the error
under the email field. Note the two things you are about to have to keep:

1. The error arrives **on the field it belongs to**, not in a banner.
2. Everything else you typed is **still there**.

Those are the acceptance criteria for Block 1. Whatever replaces this has to
do both, or it is not a rewrite, it is a regression.

> The third way is not automatically the best way. By the end of Block 1 you
> will have a table saying when each of the three wins, and this application
> will still be using all three — because they solve three different problems
> that happen to share a `<form>` tag.

---

## Block 1 — React Actions in the SPA (30 min)

### Problem

An action — in the React 19 sense — is **any function you hand to React that
may be asynchronous and whose pending state React will track for you.** That
is the whole definition. Everything in this block is that one idea wearing
different hats.

The sign-up form needs four things that Demo 4 got from a library: pending
state, field errors, "keep what the user typed", and a guard against
double-submits. React 19 gives you all four, and the code that is left is
shorter than the code that called the library.

### Concept

**A `<form>` whose `action` is a function stops being a form you control and
becomes a form you describe.** React attaches the submit handler, calls
`preventDefault()` for you, gathers the `FormData`, calls your function with
it, keeps a pending flag true until your promise settles, and queues a second
submit behind the first instead of firing both.

```tsx
const [state, formAction, isPending] = useActionState(action, initialState);
//     ↑ what the action last RETURNED
//            ↑ hand this to <form action>, not to onSubmit
//                         ↑ true from the click until the promise settles
```

The signature of the action is the part worth memorising:

```tsx
async function action(previousState, formData) { … return nextState; }
```

It is `(state, formData) → state`. **That is a reducer** — an asynchronous one
whose second argument is always a `FormData`. If Demo 12's `useReducer` made
sense, this is the same shape with the network allowed in the middle.

**And TypeScript says** you should type the state as a discriminated union,
not a bag of flags. `useActionState` gives you exactly one state slot, so use
it to make the illegal combinations unrepresentable:

```ts
type SignupState =
  | { status: 'idle' }
  | { status: 'error'; errors: SignupErrors; values: SignupValues }
  | { status: 'success'; message: string };
```

Compare with what Demo 4 juggled: `isSubmitting`, `isDirty`, `errors`,
`isSubmitSuccessful`. Four booleans is sixteen combinations, of which about
four are real.

Three more rules, and then the table.

**The inputs are uncontrolled, and that is the feature.** `name` is how a
value reaches the `FormData`; `defaultValue` is only the starting text. The
DOM holds the state. When the action returns errors and the component
re-renders, React does not touch the inputs, so everything the user typed is
still on screen without you storing a character of it.

**`useFormStatus` reads the nearest `<form>` above it.** It is in `react-dom`,
not `react`, because it is about a DOM form submission. Call it in the same
component that renders the `<form>` and it returns `pending: false` for ever —
there is no form above it yet. This is the mistake everyone makes once.

**Errors are returned, not thrown.** Same rule as Demo 10's router action: a
bad email address is an expected outcome and belongs in a return value; a
`TypeError` is not and belongs in a boundary.

Now: when does each of the three win?

| | **React Actions** | **Router action** (Demo 10) | **react-hook-form** (Demo 4) |
|---|---|---|---|
| Where the state lives | The DOM. React tracks pending and the return value. | The DOM. The router tracks navigation state. | Refs inside the library. |
| Pending state from | `isPending` / `useFormStatus` | `useNavigation().state` / `fetcher.state` | `formState.isSubmitting` |
| Errors come back as | the action's return value | `useActionData()` | `formState.errors` |
| Needs a route | no | **yes** | no |
| Revalidates loaders after a write | no — you invalidate by hand | **yes, automatically** | no |
| Can redirect | not by itself | **yes** — `redirect()` from the action | no |
| Validates per keystroke | no — on submit | no — on submit | **yes**, `mode: 'onTouched'` |
| Field arrays, cross-field rules, wizards | painful | painful | **built for it** |
| Cost in the bundle | **0 kB** | 0 kB (the router is already there) | ~43 kB |
| Works before JS loads | in an RSC framework, **yes** | no (Data Mode is client-side) | no |

Read the table as three sentences. **A form that owns a URL should be a
router action** — you get revalidation and redirects free, and Demo 10 already
proved it. **A form that does not own a URL, and validates on submit, should
be a React Action** — the sign-up modal, a comment box, a settings panel.
**A form with twenty fields, live validation and dependent rules should be
react-hook-form** — it is 43 kB that buys you a genuinely hard problem.

This app keeps all three, and after today the sign-up form moves from the
third column to the first: it is a modal, it validates on submit, and 43 kB is
a lot for that. `ProductForm` (hand-rolled, Demo 3) and `LoginPage` (router
action, Demo 10) do not move.

📖 [study-notes 10 §11–12](../../study-notes/10-forms/) ·
[study-notes 19 §6](../../study-notes/19-server-components/)

### Steps

**A. `src/lib/validation.ts` — `TODO(lab-1.1)`**

The schema stays. What has to be written is the coercion react-hook-form used
to do, because a `FormData` holds strings and `File`s and nothing else.

```ts
/** One message per field — the shape the form renders. */
export type SignupErrors = Partial<Record<keyof SignupValues | 'form', string>>;

export function parseSignupFormData(formData: FormData): SignupValues {
  const text = (key: string) => String(formData.get(key) ?? '');
  const avatar = formData.get('avatar');

  return {
    firstName: text('firstName'),
    lastName: text('lastName'),
    email: text('email'),
    password: text('password'),
    // '' → NaN, which the schema rejects with "Age is required." — not 0, which it would accept.
    age: text('age') === '' ? NaN : Number(text('age')),
    birthDate: text('birthDate'),
    gender: text('gender') as SignupValues['gender'],
    country: text('country'),
    interests: formData.getAll('interests').map(String),  // a checkbox GROUP is many entries, one name
    budget: Number(text('budget') || 0),
    newsletter: formData.get('newsletter') === 'on',      // unchecked sends NOTHING; null === 'on' is false
    terms: formData.get('terms') === 'on',
    // An empty file input still sends a File — with size 0 and an empty name.
    avatar: avatar instanceof File && avatar.size > 0 ? avatar : null,
  };
}

export function validateSignup(values: SignupValues): SignupErrors | null {
  const result = signupSchema.safeParse(values);
  if (result.success) return null;

  // zod 4's flattener gives `{ email: ['…', '…'] }`. The form shows one line per
  // field, so take the first — the rest usually say the same thing twice.
  const fieldErrors = z.flattenError(result.error).fieldErrors as Record<string, string[] | undefined>;
  return Object.fromEntries(Object.entries(fieldErrors).map(([key, messages]) => [key, messages?.[0]])) as SignupErrors;
}
```

The line that teaches the most is `formData.getAll('interests')`. Demo 4 needed
a `CheckboxGroupField` holding an array, a `toggle()` that rebuilt it
immutably, and a controlled `value`. The browser has been doing this since
1995: many inputs, one `name`, one `getAll`.

These are two pure functions. They can be tested without rendering anything —
and they would run unchanged on a server, which is the point Block 4 makes.

**B. `src/components/SubmitButton.tsx` — `TODO(lab-1.2)`**

```tsx
import { useFormStatus } from 'react-dom';   // react-DOM. Not react.

export function SubmitButton({ children, pendingLabel, variant = 'primary', className }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant={variant} className={className} disabled={pending}>
      {pending && <Spinner as="span" size="sm" animation="border" className="me-2" aria-hidden="true" />}
      {pending ? (pendingLabel ?? children) : children}
    </Button>
  );
}
```

Eight lines, and no props about the submission. Drop it into any form in the
application and it is correct in all of them. That is the argument for the
hook existing at all: without it, every form has to pass `isPending` down to
every button that might want it, and a shared component library cannot.

**C. `src/components/SignupForm.tsx` — `TODO(lab-1.3)`**

Declare the action **outside** the component. It takes no props, calls no
hooks and closes over nothing:

```tsx
const IDLE: SignupState = { status: 'idle' };

async function signupAction(_previous: SignupState, formData: FormData): Promise<SignupState> {
  const values = parseSignupFormData(formData);

  const errors = validateSignup(values);
  if (errors) return { status: 'error', errors, values };     // RETURN, never throw

  await new Promise((resolve) => setTimeout(resolve, 700));   // stand-in for POST /users/add

  if (values.email.endsWith('@taken.com')) {
    // A server-side failure lands on the field it belongs to, exactly as a
    // client-side one does. From the form's point of view they are the same.
    return { status: 'error', errors: { email: 'That email is already registered.' }, values };
  }

  return { status: 'success', message: `${values.firstName}, your account is ready. Following: ${values.interests.join(', ')}.` };
}
```

Then the component, which is now mostly markup:

```tsx
export function SignupForm({ show, onClose }: SignupFormProps) {
  const [state, formAction, isPending] = useActionState(signupAction, IDLE);

  const errors = state.status === 'error' ? state.errors : ({} as SignupErrors);
  // After a failed submit the DOM still holds what the user typed. Feeding
  // `defaultValue` from the returned values keeps that true even if React
  // resets the form, and is what a server-rendered form would need.
  const values = state.status === 'error' ? state.values : SIGNUP_EMPTY;

  return (
    <Modal show={show} onHide={onClose} centered size="lg" backdrop={isPending ? 'static' : true}>
      …
      <Form noValidate action={formAction}>
        …
        <TextField controlId="su-email" name="email" label="Email" type="email"
                   defaultValue={values.email} error={errors.email} />
        …
        <SubmitButton pendingLabel="Creating…">Create account</SubmitButton>
      </Form>
    </Modal>
  );
}
```

Four details in that block are each worth a sentence.

**`name` and `defaultValue`, no `value`, no `onChange`.** `TextField`,
`NumberField` and `SelectField` already support this — Demo 10 needed it for
the router's `<Form>`, and the props have been sitting there ever since. The
field components do not know or care which mechanism is driving them, which
is the payoff for "a component that owns no state" from Demo 4.

**The controlled-only fields have to go.** `CheckboxGroupField`,
`RadioGroupField`, `RangeField` and `FileField` all *require* a `value`, so
they cannot be used uncontrolled. Replace them with plain
`<Form.Check>` / `<Form.Range>` / `<Form.Control type="file">` and one shared
`name` per group:

```tsx
<fieldset className="mb-3">
  <legend className="small fw-semibold">Categories to follow</legend>
  {INTERESTS.map((option) => (
    <Form.Check key={option.value} type="checkbox" id={`su-interests.${option.value}`}
                name="interests" value={option.value}
                defaultChecked={values.interests.includes(option.value)}
                label={<span className="small">{option.label}</span>} />
  ))}
  {errors.interests && <div className="text-danger small mt-1">{errors.interests}</div>}
</fieldset>
```

This is the honest cost of the rewrite, and it is worth saying out loud: **a
field library built on controlled inputs is the one thing that resists
Actions.** If your design system is controlled-only, React Actions buy you
much less than this table suggests.

**Reset is free.** `<Button type="reset">` is the browser's own: it puts every
input back to its `defaultValue`. Demo 4 needed `reset()` from the library.

**Success is a return value, not a side effect.** The old form dispatched a
toast from inside `onValid` and closed the modal. The new one returns
`{ status: 'success', message }` and the component renders it — no dispatch,
no `useState`, no effect watching a flag. Render the success panel instead of
the form when `state.status === 'success'`.

### Verify

1. Sign-up → **Create account** with everything blank. Errors appear under
   every required field, the modal stays open, nothing was thrown.
2. Fill it in properly, with `someone@taken.com`. Click once. The button reads
   **Creating…**, is disabled, and shows a spinner — and you passed it nothing.
3. Click **Create account** five times fast on a valid form. One submission.
   React queues them; the guard is built in.
4. Fail validation, then look at the fields: everything you typed is still
   there. Nobody stored it.
5. Submit a valid form. The body is replaced by the success message, and the
   message contains the categories you ticked — which came out of
   `getAll('interests')`.

### Steps — the optimistic half

**D. `src/api/services/wishlist.ts` — `TODO(lab-1.4)`**

DummyJSON has no wishlist endpoint, so this stands in for `POST /me/wishlist`:
a real round trip, minus the network. It needs to do two things a real one
does — take time, and be able to say no.

```ts
export const WISHLIST_LIMIT = 5;   // a SERVER rule. The client can display it; it cannot enforce it.

export async function syncWishlist(productId: number, saved: boolean, currentCount: number): Promise<{ productId: number; saved: boolean }> {
  await new Promise((resolve) => setTimeout(resolve, 900));

  if (saved && currentCount >= WISHLIST_LIMIT) {
    logger.warn('[wishlist] rejected: limit reached', { productId, currentCount });
    throw new Error(`Your wishlist holds ${WISHLIST_LIMIT} items on the free plan. Remove one first.`);
  }

  return { productId, saved };
}
```

The rule matters more than the code. **An optimistic update against a server
that can never refuse teaches you nothing** — the interesting half of
`useOptimistic` is the half you cannot demonstrate without a failure. "Five
items on the free plan" is a rule the button has no way to know it is about
to break, which is exactly the situation the hook is for.

**E. `src/components/WishlistButton.tsx` — `TODO(lab-1.5)`**

```tsx
export function WishlistButton({ productId, title }: WishlistButtonProps) {
  const saved = useWishlistStore(selectIsSaved(productId));
  const count = useWishlistStore((s) => s.ids.length);
  const toggle = useWishlistStore((s) => s.toggle);
  const [error, setError] = useState<string | null>(null);

  const [optimisticSaved, setOptimisticSaved] = useOptimistic(saved);

  /** The action. No FormData is needed — the product id is a prop, not a field. */
  async function toggleSaved() {
    setError(null);
    setOptimisticSaved(!saved);                 // on screen immediately

    try {
      await syncWishlist(productId, !saved, count);
      toggle(productId);                        // only NOW does the real state change
    } catch (rejected) {
      // No `setSaved(previous)` anywhere. React drops the optimistic value when
      // the action settles, and the store was never touched, so the heart is
      // already correct by the time this line runs.
      setError(rejected instanceof Error ? rejected.message : 'Could not update your wishlist.');
    }
  }

  return (
    <div>
      <form action={toggleSaved} className="d-inline-block">
        <WishlistSubmit saved={optimisticSaved} title={title} />
      </form>
      {error && <div className="text-danger small mt-1" role="status">{error}</div>}
    </div>
  );
}
```

…and the nested button, in the same file, so `useFormStatus` can see the form:

```tsx
function WishlistSubmit({ saved, title }: { saved: boolean; title: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant={saved ? 'danger' : 'outline-danger'}
            // aria-pressed follows the OPTIMISTIC value: a screen reader hears
            // "pressed" the instant you click, not a second later.
            aria-pressed={saved}
            aria-label={saved ? `Remove ${title} from wishlist` : `Save ${title} to wishlist`}>
      {pending ? <Spinner as="span" size="sm" animation="border" className="me-1" aria-hidden="true" />
               : saved ? <HeartFill className="me-1" aria-hidden="true" /> : <Heart className="me-1" aria-hidden="true" />}
      {saved ? 'Saved' : 'Save'}
    </Button>
  );
}
```

**`useOptimistic(saved)` returns a value that *is* `saved`, almost all the
time.** Inside an action you may push a different value into it, and React
shows that one until the action finishes — then it snaps back to whatever
`saved` has become by then. That is the entire mechanism. On success, `saved`
has become `true`, so "snapping back" is invisible. On failure it has not, so
the heart empties. **There is no rollback; there is a temporary override that
expires.**

Two constraints follow from that, and both are worth stating:

- `setOptimistic…` may **only** be called inside an action or a transition.
  Call it from a plain `onClick` and React warns and ignores it. That is why
  this is a `<form action>` and not a button with a click handler.
- The optimistic value is derived from `saved`, so the store must be the
  source of truth. Keeping a second `useState` "for the UI" reintroduces
  exactly the bug the hook exists to remove.

**Where not to use it.** Where the failure is expensive to unwind in the
user's head: a payment, a delete, anything that sends an email. Use it for
likes, saves, toggles and adds-to-cart — actions that nearly always succeed
and whose wait is noticeable. 📖 study-notes 10 §12

**F. `src/routes/ProductDetailPage.tsx` — `TODO(lab-1.6)`**

```tsx
<WishlistButton productId={product.id} title={product.title} />
```

…and delete the `saved` / `toggleSave` lines and the old `<Button>`. The
optimistic state belongs to the button, not to the page — which also means
`ProductCard` and its eight tests are untouched. A grid of 24 cards each
holding its own optimistic state is a different design decision, and not one
to make today.

**G. `src/components/SignupForm.test.tsx` — `TODO(lab-1.7)` and
`src/components/WishlistButton.test.tsx` — `TODO(lab-1.8)`**

The `it.todo`s are already written. The sign-up tests go through
`renderWithProviders` and a `fillValidForm(user)` helper; the interesting one
is the pending assertion:

```tsx
await user.click(screen.getByRole('button', { name: 'Create account' }));

// Nobody passed the button a prop. `useFormStatus` read the form above it.
expect(screen.getByRole('button', { name: 'Creating…' })).toBeDisabled();

expect(await screen.findByText(/your account is ready/, undefined, { timeout: 3000 })).toBeInTheDocument();
```

For the wishlist, the assertion that *is* the lesson is the gap between the
screen and the store:

```tsx
await user.click(screen.getByRole('button', { name: 'Save Powder Canister to wishlist' }));

// The request is still in flight — the store has NOT been told yet.
expect(screen.getByRole('button', { name: 'Remove Powder Canister from wishlist' })).toHaveAttribute('aria-pressed', 'true');
expect(useWishlistStore.getState().ids).toEqual([]);
```

Reset the store in `beforeEach` — `useWishlistStore.setState({ ids: [] })` —
or test 2 inherits test 1's wishlist. Same rule as the cart store in Demo 20.

### Verify

1. A product page. Click **Save**: the heart fills *immediately*, the spinner
   appears, and about a second later nothing visible happens — because the
   real state has caught up with what was already on screen.
2. Save five products. On the sixth, watch the heart fill, then empty on its
   own, with a red line explaining why. You wrote no code for that.
3. Tab to the button and press Space. Same behaviour; `aria-pressed` flips
   immediately. A screen reader hears the optimistic state, which is correct —
   the sighted user is being told the same optimistic lie.
4. `npx vitest run` — 106 passing, 0 todo in these three files.

### Watch out

- **`useFormStatus()` always returns `pending: false`.** You called it in the
  component that renders the `<form>`. It reads the nearest form *above* it;
  move it into a child.
- **`Can't perform a React state update…` / the optimistic value never
  shows.** `setOptimistic…` was called outside an action. It must be inside
  the function passed to `<form action>`, or inside `startTransition`.
- **The heart flickers off and on after a successful save.** The store is
  being updated before the request resolves, so the optimistic value and the
  real one disagree for a frame. Update the store *after* the `await`.
- **`formData.get('newsletter')` is `null` and you treated it as `false`
  everywhere except one place.** An unchecked box sends nothing at all. There
  is no `'off'`.
- **Everything the user typed vanishes on a validation error.** You gave the
  inputs `value` instead of `defaultValue`, which makes them controlled with
  no `onChange`, and React clears them.
- **A submit fires twice.** You left `onSubmit` on the form as well as
  `action`. Pick one; `action` is the one that gets pending state.

### In the real world

Teams adopt Actions form by form rather than all at once, and the order that
works is: new forms first, then modals, then anything still using a controlled
field library last — because that last group is the one where the migration
is a design-system change, not a form change. The failure mode is adopting
`useOptimistic` everywhere and discovering six months later that nobody ever
tested the rejection path, so the UI quietly lies whenever the server is
having a bad day. Write the failing test with the first optimistic update you
ship, not the second.

---

## Block 2 — Suspense for data and `use` (25 min)

### Problem

Open a product page and watch the network panel. One request, for the whole
product, and the page appears when it lands. Now imagine the reviews take a
second and a half — a different service, a slower query, a recommendation
engine. Today that second and a half is paid by the *title*, the price, the
Add to cart button and everything else, because the loader awaits one thing
and the page renders when that thing is done.

The fix is not "fetch the reviews in an effect". That is Demo 5, and it brings
back the loading flag, the error flag and the waterfall. The fix is to let
the loader return a promise it has not awaited.

### Concept

**A loader may return promises as well as values, and a promise it did not
await does not block the navigation.** That is the whole of streaming in a
client-side router. The page renders with everything that *is* resolved, and
the parts that are not sit inside `<Suspense>` boundaries showing fallbacks.

`use(promise)` is how a component reads one. It is not `await`:

| | `await` | `use(promise)` |
|---|---|---|
| Where it runs | in an async function | **during render**, in a component |
| While it is pending | the function is paused | the component **suspends**; the nearest `<Suspense>` fallback shows |
| When it rejects | `try/catch` | **throws during render** → the nearest error boundary |
| Call rules | anywhere | must be during render; may be conditional or in a loop (the only hook that may) |

Three things decide whether this is worth doing.

**Boundary placement is the design decision.** Put the `<Suspense>` around the
whole card and the entire page waits for the reviews — you have written a
slower version of what you had. Put it around the reviews panel and only the
reviews panel waits. The rule: **a boundary should surround the smallest piece
of UI that can be meaningfully missing.**

**Start every request before you await any of them.** This is the waterfall
trap, and it survives code review because the broken version looks right:

```ts
// WRONG — sequential. The reviews request has not been made yet when the
// product one starts, so the page pays product + reviews.
const product = await queryClient.ensureQueryData(productQuery(id));
const reviews = queryClient.fetchQuery(productReviewsQuery(id));

// RIGHT — the reviews request is in flight while the product is being awaited.
const reviews = queryClient.fetchQuery(productReviewsQuery(id));
const product = await queryClient.ensureQueryData(productQuery(id));
```

Two lines, swapped. The difference is a second and a half of nothing.

**Suspense is for pending; a boundary is for rejected.** They are different
problems and React keeps them apart on purpose. A rejected promise makes
`use()` throw *during render*, and only an error boundary catches that. This
app already has the right one: `<WidgetBoundary>` from Demo 17.

**React Router's `<Await>` does the same job with a component instead of a
hook**, and predates `use` by two years:

```tsx
<Suspense fallback={<ReviewsSkeleton />}>
  <Await resolve={reviews} errorElement={<p>Reviews are unavailable.</p>}>
    {(list: Review[]) => <ReviewList reviews={list} />}
  </Await>
</Suspense>
```

Same output. `<Await>` bundles the error handling in (`errorElement`) and
needs a render prop; `use` needs a separate boundary and reads like ordinary
code. Both are supported in React Router 8. **Prefer `use`** in new code: it
is React's API rather than the router's, and it works in a component that has
no idea a router exists. Know `<Await>` exists, because you will read it in
codebases written before React 19.

**And while we are here: `useDeferredValue` took an initial value in React
19.** `ProductsPage` already uses the two-argument-free form for the quick
filter (Demo 18 Lab 4):

```tsx
const deferredFilter = useDeferredValue(filter);
```

React 19 adds `useDeferredValue(value, initialValue)`. On the *first* render
it returns `initialValue` and immediately schedules a re-render with `value` —
which lets the first paint show an empty or placeholder state instead of doing
the expensive work synchronously. It matters for a deferred value that is
expensive on mount, which the quick filter is not; know the signature so you
recognise it. 📖 study-notes 19 §11

### Steps

**A. `src/api/services/products.ts` — `TODO(lab-2.1)`**

```ts
export async function getProductReviews(id: number | string, { signal, delayMs = 0 }: RequestOptions & { delayMs?: number } = {}): Promise<Review[]> {
  const { data } = await api.get<{ reviews?: Review[] }>(endpoints.products.detail(id), {
    params: { select: 'reviews', delay: delayMs || undefined },
    signal,
  });
  return data.reviews ?? [];
}
```

`select=reviews` asks DummyJSON for that one field, so this is a small
response — and, more to the point, a *separate* one. `delay` is DummyJSON's
own parameter; it holds the response open. It defaults to 0 because it is a
teaching switch, not production code, and the caller has to ask for it.

> DummyJSON already ships `reviews` inside the product payload, so this second
> request is, strictly, unnecessary for this API. It is exactly the situation
> you will meet for real the first time reviews live in a different service —
> and it is the only honest way to have a section that arrives later.

**B. `src/api/queries.ts` — `TODO(lab-2.2)`**

```ts
// in the key factory:
reviews: (id: number | string) => [...productKeys.detail(id), 'reviews'] as const,

export function productReviewsQuery(id: number | string, delayMs = 0) {
  return queryOptions({
    queryKey: productKeys.reviews(id),
    queryFn: ({ signal }) => getProductReviews(id, { signal, delayMs }),
    staleTime: 5 * 60_000,
  });
}
```

Nesting the key **under** `detail(id)` is not tidiness: it means invalidating
`productKeys.detail(5)` after an edit takes the reviews with it. Demo 19's
hierarchy, paying off.

**C. `src/routes/ProductDetailPage.tsx` — `TODO(lab-2.3)`**

```ts
const REVIEWS_DELAY_MS = 1500;   // set to 0 and the page behaves exactly as it did yesterday

export async function productDetailLoader({ params }: LoaderFunctionArgs) {
  const productId = params.productId ?? '';

  // NOT awaited. Started BEFORE the awaited call, or the two requests queue up.
  const reviews = queryClient.fetchQuery(productReviewsQuery(productId, REVIEWS_DELAY_MS));
  // A promise nobody is awaiting yet can reject with nobody listening, which Node
  // calls an unhandled rejection. This marks it handled WITHOUT consuming it:
  // `.catch()` returns a NEW promise and leaves the original's rejection intact,
  // so `use()` still sees it and still throws it to the boundary.
  reviews.catch(() => {});

  try {
    return { product: await queryClient.ensureQueryData(productQuery(productId)), reviews };
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) {
      throw data({ message: `No product with id ${productId}.` }, { status: 404, statusText: 'Not Found' });
    }
    throw error;
  }
}
```

That two-line `catch` is the single most surprising thing in this block, and
it is worth thirty seconds: **`p.catch(fn)` does not silence `p`.** It creates
a second promise that handles the rejection. The original still rejects, and
`use()` still throws it. What the call buys is that the rejection is
*observed*, so Node does not treat it as unhandled.

**D. `src/routes/ProductDetailPage.tsx` — `TODO(lab-2.4)`**

```tsx
function ReviewsPanel({ reviews }: { reviews: Promise<Review[]> }) {
  const list = use(reviews);

  return (
    <>
      <Text variant="muted" className="small mb-2">
        {list.length === 0 ? 'No reviews yet.' : `${list.length} reviews`}
      </Text>
      <ReviewList reviews={list} />
    </>
  );
}
```

…and in the tab panel:

```tsx
<Tabs.Panel value="reviews">
  <WidgetBoundary name="reviews">
    <Suspense fallback={<ReviewsSkeleton />}>
      <ReviewsPanel reviews={reviews} />
    </Suspense>
  </WidgetBoundary>
</Tabs.Panel>
```

Two consequences you have to accept, and should say out loud:

**The count leaves the tab.** `<Tabs.Tab value="reviews">Reviews <Badge>{n}</Badge></Tabs.Tab>`
cannot work any more — nobody knows `n` yet. That is the honest price of
streaming a section: you trade a number in the tab for a page that renders a
second and a half sooner. (You could wrap the badge in its own tiny
`<Suspense>`. Two boundaries for one number is usually not the trade.)

**The panel is rendered even when hidden.** `Tabs.Panel` keeps every panel in
the DOM with `hidden`, which Demo 17 chose so a half-written form survives a
tab switch. It means the reviews start loading immediately, while the user
reads the Details tab — so by the time they click Reviews, it is usually
already there. A lazy panel that rendered `null` would start the fetch on the
click instead, and the whole delay would be visible. Same code, opposite
experience, decided by a component two demos ago.

**E. `src/test/msw/handlers.ts` — `TODO(lab-2.5)`**

The reviews request goes through the same path, so the handler has to honour
`select` there too:

```ts
http.get(`${API}/products/:id`, ({ params, request }) => {
  const product = CATALOGUE.find((item) => String(item.id) === params.id);
  if (!product) return HttpResponse.json({ message: `Product with id '${params.id}' not found` }, { status: 404 });

  const full = { ...product, reviews: reviewsFor(product.id) };
  const select = new URL(request.url).searchParams.get('select');
  if (!select) return HttpResponse.json(full);
  return HttpResponse.json(Object.fromEntries(select.split(',').map((field) => [field, full[field as keyof typeof full]])));
}),
```

`reviewsFor(id)` is already in `src/test/fixtures.ts`. It derives the reviews
from the id so no two products share them — a fixture that is identical for
every product cannot catch a mixed-up key.

**F. `src/routes/routes.test.tsx` — `TODO(lab-2.6)`**

Two tests, and between them they are the contract the whole block buys:

```tsx
function slowReviews(ms: number, fail = false) {
  return http.get(`${API}/products/:id`, async ({ params, request }) => {
    const product = CATALOGUE.find((item) => String(item.id) === params.id);
    if (!product) return HttpResponse.json({ message: 'not found' }, { status: 404 });
    if (new URL(request.url).searchParams.get('select') !== 'reviews') return HttpResponse.json(product);

    await delay(ms);                                    // `delay` comes from 'msw'
    if (fail) return HttpResponse.json({ message: 'Reviews service unavailable' }, { status: 503 });
    return HttpResponse.json({ reviews: reviewsFor(product.id) });
  });
}

it('renders the product while the reviews are still loading, then streams them in', async () => {
  server.use(slowReviews(120));
  render('/products/3');

  // The heading is here BEFORE the reviews are. That is the whole point of
  // not awaiting the promise in the loader.
  expect(await screen.findByRole('heading', { name: 'Essence Mascara 3' })).toBeInTheDocument();
  expect(screen.getByLabelText('Loading reviews')).toBeInTheDocument();

  expect(await screen.findByText('2 reviews')).toBeInTheDocument();
  expect(screen.queryByLabelText('Loading reviews')).toBeNull();
});

it('sends a rejected reviews promise to the widget boundary, not the page', async () => {
  server.use(slowReviews(10, true));
  render('/products/3');

  expect(await screen.findByText('The reviews hit a problem')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Essence Mascara 3' })).toBeInTheDocument();
});
```

The second one is the test most teams skip and then regret: it asserts that a
failing sub-request degrades *one panel*, not the page.

### Verify

1. Open a product. The title, price and Add to cart appear at once; the
   Reviews tab shows three shimmering rows. About a second and a half later
   they are replaced in place — and nothing above them re-mounted.
2. Network panel: two requests to `/products/3`, one with
   `?select=reviews&delay=1500`, started at the same moment. Not one after
   the other.
3. Go back and forward. Second visit is instant both halves — `staleTime:
   5 * 60_000` on the reviews query.
4. Set `REVIEWS_DELAY_MS = 0` and reload. Identical page, no skeleton. The
   boundary costs nothing when the promise is already resolved.
5. Swap the two lines in the loader so the `fetchQuery` comes after the
   `await`. Now the page takes product + 1.5 s. That is the waterfall, and it
   is a two-line mistake.

### Watch out

- **`A component suspended while responding to synchronous input`** — you
  called `use()` on a promise created during render, so every render makes a
  new one and it never settles. The promise must come from outside: a loader,
  a cache, a ref. This is the single most common `use()` bug.
- **The whole page shows the skeleton.** The `<Suspense>` is too high. Move it
  down until it wraps only what can be missing.
- **`Unhandled Rejection` in the Vitest output, on a green suite.** The bare
  `reviews.catch(() => {})` is missing from the loader.
- **`use` is not a function.** It is imported from `react`, not from
  `react-dom` and not from the router.
- **`Cannot update a component while rendering a different component`** after
  adding `use()`. Something in the suspending subtree is calling `setState`
  during render — usually a store subscription that writes on read.
- **The reviews never load in a test.** MSW matched the default
  `/products/:id` handler, which ignores `select` unless you did step E.

### Challenge (2 min)

Put a second, tiny `<Suspense>` around just the tab's count badge, so the
number streams in independently of the list. Then decide whether you would
ship it. (Two boundaries, two fallbacks and two layout shifts for one integer
is usually a no — but having built it, you can say why rather than guess.)

### In the real world

The pattern generalises past reviews: a product page's *price* and *stock*
block, everything else streams; a dashboard's headline number blocks and the
six charts stream; a search page's results block and the facet counts stream.
The judgement call is always the same one — what is the smallest thing that
can be meaningfully missing? Teams that get it wrong usually get it wrong in
the safe direction, wrapping a whole route in one boundary, and then wonder
why streaming "did not help".

---

## Block 3 — Other React 19 changes (15 min)

### Problem

Every tab in this application says **ShopScope**. Bookmark four product pages
and you get four identical bookmarks. The usual fix is `react-helmet`, which
is a library, a provider and a portal for something the browser has had since
1993.

### Concept

**React 19 hoists `<title>`, `<meta>` and `<link rel="…">` out of wherever
you render them and into `<head>`** — and removes them again when the
component unmounts. That is the whole feature. No provider, no portal, no
library.

Two rules it is easy to break. **Render one `<title>` at a time**: the browser
uses the first one in the document, which is whichever React inserted first,
not whichever is more specific. And **give each `<meta>` a `key`**, or two
routes that each render a description can leave both behind across a
navigation.

And the limit, which is the reason this block exists at all: **this runs in
the browser.** The HTML the server sends still contains whatever `index.html`
says and an empty `<div id="root">`. Crawlers that execute JavaScript will see
these tags; anything that reads the raw response — a link-preview bot, a
scraper, most social cards — will not. Per-route metadata in a CSR app is for
humans reading tabs, bookmarks and history. **Demo 22 `curl`s this page and
makes you look at what comes back.**

Three more React 19 changes worth five minutes between them.

**`ref` is an ordinary prop on a function component.** You met this in Demo 15
— `TextField` takes `ref?: Ref<TextFieldHandle>` in its props interface and
never mentions `forwardRef`. What is new today is the consequence for old
code: **`forwardRef` is deprecated.** Every `forwardRef((props, ref) => …)`
in a React 19 codebase can become a plain component with `ref` in its props,
and the wrapper deleted. Nothing else changes; `useImperativeHandle` still
works exactly as it did.

**Stylesheet precedence.** A `<link rel="stylesheet" precedence="default">`
rendered from a component is hoisted like metadata, de-duplicated across
components that ask for the same `href`, and **ordered by precedence rather
than by which component rendered first**. That last part is the point: the
classic "my styles load in a different order in production" bug comes from
bundler ordering, and `precedence` takes the decision away from the bundler.
ShopScope imports its CSS through Vite, so it does not need this — but if you
ever ship a component library whose components bring their own stylesheets,
this is the mechanism.

**What to delete from older code**, now that you are on 19:

| Delete | Replace with | Why |
|---|---|---|
| `forwardRef(…)` | `ref` in the props interface | Deprecated; the wrapper does nothing now |
| `Component.defaultProps` | default values in destructuring | **Removed** for function components — silently `undefined` |
| `propTypes` | TypeScript | Removed; ignored at runtime |
| `react-helmet` / `react-helmet-async` | `<title>` / `<meta>` in the component | Hoisting is built in |
| `useContext(Ctx)` | `use(Ctx)` | Optional, but `use` may be called conditionally |
| A manual `preload` `<link>` in `index.html` | `preload()` / `preinit()` from `react-dom` | Can be called from the component that needs it |
| `ReactDOM.render` | `createRoot` | Removed in 18; still in old tutorials |

`defaultProps` is the one that bites: it does not warn, it does not throw, it
just stops working, and the prop arrives as `undefined` in a component that
has always been able to assume otherwise.

### Steps

**A. `src/components/PageMeta.tsx` — `TODO(lab-3.1)`**

```tsx
function formatTitle(title?: string) {
  return title ? `${title} · ${env.appName}` : `${env.appName} — the product explorer`;
}

export function PageMeta({ title, description, noIndex = false }: PageMetaProps) {
  return (
    <>
      <title>{formatTitle(title)}</title>
      {description && <meta key="description" name="description" content={description} />}
      <meta key="og:title" property="og:title" content={formatTitle(title)} />
      {noIndex && <meta key="robots" name="robots" content="noindex" />}
    </>
  );
}
```

One helper formats every title, so no route can invent its own format — the
same argument as `endpoints.ts` in Demo 6 and `productKeys` in Demo 19.

**B. The five routes, and `index.html` — `TODO(lab-3.2)`**

```tsx
// ProductsPage — the title reflects the FILTERS, not just the route
<PageMeta title={needle || loaded.products.length !== total ? `${total} products` : 'All products'}
          description={`Browse ${total} products across every category in ShopScope.`} />

// ProductDetailPage
<PageMeta title={product.title} description={product.description} />

// LoginPage — a sign-in screen has no business in a search result
<PageMeta title="Sign in" description="Sign in to ShopScope." noIndex />

// AboutPage
<PageMeta title="About" description="What ShopScope is, and what it is built from." />

// NotFoundPage
<PageMeta title="Page not found" noIndex />
```

Then **delete the `<title>` and `<meta name="description">` from
`index.html`**, and leave the comment saying why:

```html
<!-- NO <title> and NO <meta name="description"> here, on purpose.
     React 19 hoists the ones <PageMeta> renders into this <head> by APPENDING them,
     and `document.title` is the FIRST <title> in the document — so a static one here
     would win for ever and every route would be called "ShopScope". -->
```

This is the step everybody gets wrong, because the symptom is "hoisting does
not work" when in fact it worked perfectly and the browser ignored the result.
The cost of removing it is real and worth naming: for the few hundred
milliseconds before React mounts, the tab shows the URL.

**C. `src/components/PageMeta.test.tsx` — `TODO(lab-3.3)`**

```tsx
it('hoists the title and the description into <head>', async () => {
  renderWithProviders(<PageMeta title="Essence Mascara" description="A very good mascara." />);

  await waitFor(() => expect(document.title).toBe('Essence Mascara · ShopScope'));
  expect(document.head.querySelector('meta[name="description"]')).toHaveAttribute('content', 'A very good mascara.');
});
```

Three lines that answer a question you would otherwise take on trust — does
hoisting actually work in *this* React, in a client-rendered app, with no
framework underneath it? (It does. React 19.3, jsdom, no Next.js.) The third
test in the file asserts the tags are *removed* on unmount, which is what
stops every route you visited leaving a description behind.

### Verify

1. Navigate `/products` → a product → `/login` → a bad URL. The tab title
   changes each time, and so does the browser history menu.
2. DevTools → Elements → `<head>`. Exactly one `<title>`, one
   `meta[name="description"]`, one `og:title`. Navigate again and watch them
   be replaced, not accumulate.
3. `npm run build && npm run preview`, then in another terminal:
   `curl -s http://localhost:4173/products | head -20`. **No title, no
   description, an empty `<div id="root">`.** That is what a crawler that does
   not run JavaScript sees. Sit with it for a second — it is the argument for
   Block 4, and it is Demo 22 Lab 3's cold open.

### Watch out

- **Every tab still says "ShopScope".** `index.html` still has a `<title>`.
  `document.title` is the first title in the document.
- **Two descriptions in `<head>` after navigating.** A missing `key` on the
  `<meta>`.
- **The title flashes the URL on first load.** Correct, and unavoidable in a
  CSR app. If it matters commercially, the answer is not a library — it is
  Block 4.
- **`<title>{`${a} · ${b}`}</title>` renders `[object Object]`.** A `<title>`
  accepts a single string child; an array of children (which is what
  `{a} · {b}` produces) is not allowed. Compose the string first.

### In the real world

This is a fifteen-minute change that closes a ticket that has been open for a
year on most SPAs, and it is worth knowing that it closes *half* of it. Tabs,
bookmarks, history and browser-level accessibility: fixed. Google, which runs
JavaScript: mostly fixed. Slack unfurls, WhatsApp previews, LinkedIn cards,
`curl`, and every crawler with a budget: still broken, and no amount of
client-side metadata will fix them. That half needs the server, which is the
next block.

---

## Block 4 — Server Components, conceptually (25 min)

No code to type in this block. Close the editor; this one is a whiteboard and
then a decision. Everything here is 📖
[study-notes 19](../../study-notes/19-server-components/) §2–§10.

### Problem

The `curl` you just ran is the problem. ShopScope sends an empty `<div>` and
644 kB of JavaScript, and *then* asks DummyJSON for products. Three round
trips before a shopper sees a price: HTML, JavaScript, data. A Server
Component collapses that to one.

But "collapses that to one" is what a vendor says. The interesting question
is what you give up, and the answer is specific enough to decide with.

### Concept — the boundary

**A Server Component runs on the server (or at build time) and its code never
reaches the browser.** It can be `async`. It can `await` a database query. It
cannot use state, an effect, an event handler, context or any browser API,
because by the time the browser has the output, the component is gone. What
the browser receives is not HTML exactly — it is the **RSC payload**, a
description of the rendered tree that React uses to build the DOM and, later,
to patch it.

**A Client Component is what you have been writing for twenty demos.** State,
effects, handlers, the lot — and its code is in the bundle.

**`'use client'` is a boundary, not a file switch.** This is the sentence that
costs teams a week when they get it wrong. The directive at the top of a file
says: *from here down, everything is client code.* Every module that file
imports, and everything those import, joins the client bundle — whether or not
they carry the directive themselves. So one `'use client'` at the top of a
page turns the whole page into a Client Component and Server Components
underneath it stop existing.

The discipline that follows: **push the directive as deep as you can.** Not
`app/products/page.tsx` — `app/products/AddToCartButton.tsx`. Block 5 measures
exactly what that discipline is worth.

### Concept — crossing the boundary

**Props are serialised.** A server component may pass a client component a
string, a number, a boolean, `null`, a plain object, an array, a `Date`, a
`Map`, a `Promise` — and *not* a function, a class instance, a JSX element
type, or anything carrying methods you intend to call. Break the rule and you
get `Functions cannot be passed directly to Client Components`, which is a
good error message for a design problem: you were trying to send behaviour
across a process boundary.

**The exception, and the pattern worth memorising: `children`.** A client
component can *render* server-rendered JSX it was handed, because by then it
is already output, not code:

```tsx
// page.tsx — a Server Component
export default async function Page() {
  const product = await getProduct(1);

  return (
    <ClientTabs>                      {/* client: owns which tab is open */}
      <ProductDetails product={product} />   {/* server: never reaches the bundle */}
    </ClientTabs>
  );
}
```

`ClientTabs` has `'use client'`, holds the selected tab in state, and renders
`{children}` — and `ProductDetails`, with whatever it imports, stays on the
server. **An interactive shell around server content is the single most useful
RSC pattern**, and it is the reason "client components are leaves" is not
quite right: they are leaves *in the import graph*, not necessarily in the
render tree.

### Concept — Server Functions

`'use server'` is the mirror image, and its name is unhelpfully close to the
other one:

| | `'use client'` | `'use server'` |
|---|---|---|
| Marks | a module as the start of the client bundle | every export as a **Server Function** |
| Direction | server → client | client → server |
| Effect | this code ships | this code **never** ships; the import becomes an endpoint |

A Server Function is called like a local function and is an HTTP POST:


```ts
'use server';

export async function addToCart(productId: number) {
  if (!Number.isInteger(productId) || productId <= 0) throw new Error('bad id');   // 1. VALIDATE
  const session = await auth();
  if (!session) throw new Error('not signed in');                                  // 2. AUTHORISE
  await db.cart.add(session.userId, productId);
  revalidatePath('/products');                                                     // 3. SAY WHAT CHANGED
}
```

**Those three steps are not optional and the first two are the lesson.** A
Server Function is a *public HTTP endpoint with a generated URL*. Anyone can
call it, with any arguments, in any order, from curl, regardless of what the
UI allows. "It is only called from one button" is not a check. Write these
exactly as you would write an Express route, because that is what it is —
the convenience is that you did not have to name the route, not that the
route is private. 📖 study-notes 19 §5

Step 3 is the RSC version of a problem you already solved twice. The server
has new data; nothing re-renders until something says so. `revalidatePath` /
`revalidateTag` is `queryClient.invalidateQueries` (Demo 19) is the router's
automatic revalidation after an action (Demo 10). Same idea, three layers.

### Concept — caching vocabulary

Framework-specific, and the words matter more than the details because every
framework has these four and calls them different things:

| Layer | What it holds | Invalidated by |
|---|---|---|
| **Request memoisation** | identical `fetch`es within *one* render | ends with the request |
| **Data cache** | `fetch` results across requests and deploys | `revalidate: n`, `revalidateTag` |
| **Full route cache** | rendered HTML + RSC payload per route | `revalidatePath`, a new deploy |
| **Router cache** | RSC payloads the *browser* already has | time, `router.refresh()` |

The failure mode is always the same and always surprising: **you write, the
database is correct, and the page still shows the old value** — because one
of those four layers was never told. "Which cache am I looking at?" is the
first debugging question in any RSC app.

### Concept — when RSC is *not* the answer

The honest part, and the point of doing this as prose rather than a
migration.

**RSC pays when** the page is content-heavy and mostly read, the first paint
matters commercially, crawlers matter, the data lives behind credentials you
do not want in a bundle, or the client bundle is dominated by data-access
code.

**RSC does not pay when** the app is behind a login and never crawled; the UI
is dense and interactive so nearly everything ends up `'use client'` anyway;
the app must work offline or as a PWA; there is no server to run and no
budget for one (ShopScope deploys to a static host for free); or the team is
four people who would now own an SSR runtime, a cache with four layers, and a
class of bug that only happens in production.

**The verdict for ShopScope: no.** Look at what is actually on the page — a
cart drawer, an infinite grid, a price ticker, an optimistic wishlist, a
density toggle, portals, focus traps, a theme switch. Nearly every component
needs state or an event handler, so nearly every component is a Client
Component, and an RSC version of this app would be a Next.js app that renders
one server component and 60 client ones. You would pay the framework, the
runtime and the cache, and get back a slightly better first paint on
`/products`.

The version of this that *is* worth doing is narrower and worth saying: **if
ShopScope's catalogue pages needed to rank in Google, you would move
`/products` and `/products/:id` to a framework and leave the account area as
it is.** That is a real architecture — and it is the shape of the mini-demo
you are about to build. 📖 study-notes 19 §10 · [study-notes 03](../../study-notes/03-rendering-architectures/)

### Watch out

- **"`'use client'` makes this component a client component."** It makes this
  component *and its entire import graph* client code. Check what the file
  imports before you add the line.
- **"Server Functions are private."** They are endpoints. Validate and
  authorise inside them.
- **Passing a handler across the boundary.** `onClick={…}` from a Server
  Component to a Client Component is the error you will hit first. Pass data,
  and put the handler inside the client component.
- **`useState` in a Server Component.** The error is clear; the cause is
  usually a missing `'use client'` three files up.
- **Expecting zero JavaScript.** Block 5 measures 567 kB of it.

### In the real world

The realistic adoption path is not "migrate the SPA". It is: the marketing
site and the catalogue move to a framework with Server Components; the
signed-in application stays a client app; they share a design system and an
API. Teams that try to move the whole thing usually discover in month two
that their state management, their component library and their auth all
assume a browser — which is not an argument against RSC, it is an argument
for choosing the boundary at the level of *pages*, not components.

---

## Block 5 — Mini-demo in Next.js (35 min)

### Problem

Four blocks of prose about a boundary you have never seen. Thirty-five
minutes and about two hundred lines will fix that — and give you a number to
put next to the Vite build.

> **This was built and measured while writing this guide.** `npm install`
> (28 packages, ~15 s), `next build` and `tsc --noEmit` all pass on
> `next@16.3.5` with `react@19.3.0`, and the figures in the comparison table
> below were taken from a real `next start`. If you only read the code, you
> are not missing a step that was left untested.

### Steps

Everything lives in `demos/21-…/next-mini/`, a **sibling** of `starter/`. Do
not create it inside `starter/`: the Vite project's `tsconfig.app.json`,
`vitest.config.ts` and `scripts/check-bundle-size.mjs` all scan `starter/`,
and `next` is not in the track's shared dependency set. Keeping it outside
means the CI gate Demo 22 builds never sees it.

**A. `package.json`** — its own, pinned, and sharing React with the track:

```json
{
  "name": "shopscope-next-mini",
  "private": true,
  "scripts": { "dev": "next dev", "build": "next build", "start": "next start", "typecheck": "tsc --noEmit" },
  "dependencies": { "next": "16.3.5", "react": "19.3.0", "react-dom": "19.3.0" },
  "devDependencies": { "@types/node": "22.20.3", "@types/react": "19.3.0", "@types/react-dom": "19.3.0", "typescript": "5.9.3" }
}
```

Then `npm install`, and add `.next` and `node_modules` to `next-mini/.gitignore`.

**B. `lib/dummyjson.ts` — the fetch that runs on the server**

```ts
export async function listProducts(limit = 12): Promise<Product[]> {
  const response = await fetch(`https://dummyjson.com/products?limit=${limit}&select=${FIELDS}`, {
    next: { revalidate: 300 },        // Next's data cache: one real request per five minutes
  });
  if (!response.ok) throw new Error(`DummyJSON answered ${response.status}`);
  const body = (await response.json()) as { products: Product[] };
  return body.products;
}
```

Three consequences of "this runs on the server", and each is a thing the Vite
app cannot have. **No CORS** — the browser is not making this request. **No
key in the bundle** — a secret would live in `process.env` and never ship,
whereas anything in a `VITE_` variable is public by construction. **No loading
state** — the component awaits and the HTML arrives with the data in it.

**C. `app/products/page.tsx` — the async Server Component**

```tsx
export const dynamic = 'force-dynamic';   // because the cart lives in memory; delete the cart and this goes too

export default async function ProductsPage() {
  const products = await listProducts(12);
  const count = totalItems();

  return (
    <main>
      <h1>ShopScope — products</h1>
      <p className="muted">Rendered on the server from DummyJSON. {count} items in the cart.</p>

      <ul className="grid">
        {products.map((product) => (
          <li key={product.id} className="card">
            <img src={product.thumbnail} alt="" />
            <span className="title">{product.title}</span>
            <span className="muted">${product.price.toFixed(2)} · {product.category}</span>

            {/* The boundary, in one line. */}
            <AddToCartButton productId={product.id} inCart={quantityOf(product.id)} />
          </li>
        ))}
      </ul>
    </main>
  );
}
```

Read the signature twice. `async` — a component may await, which React has
never allowed on the client. `export default` — App Router routes are default
exports, unlike every other file in this repository.

Then read what is *not* there: no `useEffect`, no `useState`, no loading flag,
no error flag, no axios instance, no interceptor, no `ApiError`, no TanStack
Query, no cache key, no loader, no router — **and none of this function's code
in the browser**. Against `ProductsPage.tsx` in the Vite app, which is 380
lines, that is the whole pitch in one screen.

And what it costs: this component cannot use state, an effect, a handler, a
provider or a browser API. The moment one pixel of it needs one, that pixel
becomes a Client Component.

**D. `app/products/actions.ts` — the Server Function**

```ts
'use server';

export async function addToCart(productId: number): Promise<void> {
  if (!Number.isInteger(productId) || productId <= 0) throw new Error('addToCart: productId must be a positive integer.');
  // AUTHORISE here in a real app: read the session cookie and refuse if it is missing.
  await new Promise((resolve) => setTimeout(resolve, 600));
  addLine(productId);
  revalidatePath('/products');
}
```

`lib/cart.ts` is a module-scope `Map`, and the file says so in a comment: it
is shared by every visitor and dies with the process. A real cart is keyed by
a session cookie and stored in a database. **The shape of the code around it
does not change** — a Server Function writes, a Server Component reads,
`revalidatePath` sits between them — which is why the shortcut is honest
rather than misleading.

**E. `app/products/AddToCartButton.tsx` — the one island**

```tsx
'use client';

export function AddToCartButton({ productId, inCart }: { productId: number; inCart: number }) {
  const [optimisticCount, addOptimistic] = useOptimistic(inCart, (current: number, delta: number) => current + delta);
  const [error, setError] = useState<string | null>(null);

  async function action() {
    setError(null);
    addOptimistic(1);
    try {
      await addToCart(productId);   // looks local; it is a POST to a generated endpoint
    } catch {
      setError('Could not add that — try again.');
    }
  }

  return (
    <form action={action}>
      <Pending label={optimisticCount > 0 ? `In cart (${optimisticCount})` : 'Add to cart'} />
      {error && <p className="error">{error}</p>}
    </form>
  );
}
```

`Pending` is the same `useFormStatus` button you wrote in Block 1, six lines
long. **Everything in this block is Block 1, unchanged, against a real
server.** That is the payoff for having done the Vite version first: nothing
here is new React, only new plumbing.

Note the props: `productId` and `inCart`, a number and a number. Serialisable,
by force. And note `loading.tsx` — a `<Suspense>` boundary the framework
writes for you, which is Block 2's `<Suspense>` with the placement decision
made by a filename.

### Verify

```bash
npm run build && npm start      # http://localhost:3000/products
curl -s http://localhost:3000/products | grep -o 'class="title">[^<]*' | head -3
```

```
class="title">Essence Mascara Lash Princess
class="title">Eyeshadow Palette with Mirror
class="title">Powder Canister
```

**The product names are in the raw HTML.** Run the same `curl` against the
Vite preview and you get `<div id="root"></div>`. That contrast, in two
commands, is Block 4's entire argument.

Then click **Add to cart**: the count goes up immediately (optimistic), the
button says *Adding…* (`useFormStatus`), and 600 ms later the page's server
count updates too (`revalidatePath`) — without a navigation.

### The bundle comparison

Sum the chunks the served HTML actually asks for:

| Build | Chunks | Raw | Gzip |
|---|---|---|---|
| **Vite / ShopScope** — Demo 20 finished | 17 | 799.0 kB | main chunk 207.7 kB |
| **Vite / ShopScope** — Demo 21 finished | 18 | **763.0 kB** | main chunk **194.4 kB** |
| **Next.js** — `/products` as shipped | 8 | 567.1 kB | 169.9 kB |
| **Next.js** — the same page with `<AddToCartButton>` deleted | 6 | 565.7 kB | 170.1 kB |

Three readings, and the third is the one to remember.

**ShopScope got 36 kB lighter today** and nobody optimised anything. Block 1
removed the last import of react-hook-form, so 43 kB of library left the
graph and the tree-shaker did the rest. That is what "0 kB for Actions" means
in practice: not that Actions are free, but that the library they replace was
not.

**The two apps are not comparable, and pretending otherwise is the mistake.**
Next's 567 kB is a framework and a router and an RSC runtime rendering twelve
list items. ShopScope's 763 kB is Bootstrap, axios, TanStack Query, Zustand,
React Router and about nine thousand lines of application. Anyone who quotes
"Next is smaller" from this table has read it wrong.

**The island costs 1.3 kB.** Delete `AddToCartButton` and the bundle barely
moves. That is the number that actually means something: **RSC does not
remove JavaScript, it removes *your* JavaScript.** The framework floor is
there either way; what changes is that adding a hundred more Server
Components adds nothing to it, while adding a hundred more Client Components
adds all of them. The Vite app has no such floor and no such ceiling — every
component you write ships.

### In the real world

The framework tax is real and it is mostly paid in operations, not bytes: a
server to run, a cache with four layers, a deploy that can now fail at
request time, and a category of bug ("stale after write") that does not exist
in a client app. Teams that adopt it for a content-heavy catalogue are
usually glad; teams that adopt it for a dashboard behind a login usually
spend a quarter learning that `'use client'` is at the top of nearly every
file they wrote.

---

## Wrap-up — what you can now do

- [x] Write a React Action: `<form action={fn}>` with `useActionState`,
      errors *returned* rather than thrown, state modelled as a discriminated
      union, and the action declared outside the component so it has the
      shape a Server Function has
- [x] Use `useFormStatus` in a nested submit button, and say in one sentence
      why it must be nested and why it lives in `react-dom`
- [x] Choose between React Actions, a router action and react-hook-form with
      a reason per column — a URL, a revalidation, a redirect, live
      validation, 43 kB — rather than a preference
- [x] Build an optimistic toggle with `useOptimistic` whose rollback is not
      code, make a server refuse it, and test both the flip and the snap-back
- [x] Return an unawaited promise from a loader, read it with `use()` inside
      a `<Suspense>` boundary placed around the smallest thing that can be
      missing, and spot the two-line swap that turns it back into a waterfall
- [x] Say what `<Await>` does differently, and why `use` is the default now
- [x] Ship per-route `<title>` and `<meta>` with no library — and say
      precisely which half of the SEO problem that solves
- [x] Delete `forwardRef`, `defaultProps` and `propTypes` from React 19 code
      and explain what replaces each
- [x] Explain `'use client'` as a boundary over an import graph, name what
      may cross it, pass server JSX through a client component as `children`,
      and treat a Server Function as the public endpoint it is
- [x] Read a bundle comparison honestly: 36 kB off the SPA for free, 1.3 kB
      for a client island, and a framework floor that is there either way
- [x] Argue, with this application as the evidence, when RSC is not the answer

## Next demo

**Demo 22 — Production Readiness.** You have just seen what a crawler gets
when it `curl`s this app, and Demo 22 starts by doing exactly that in front of
you — along with `npx @axe-core/cli` on the deployed preview and a look at the
response headers. "Deployed is not done." You will fix every `axe` violation,
sanitise the rendered description and add a CSP, extend today's `<PageMeta>`
with canonical and Open Graph tags, make prices and dates locale-aware with
`Intl`, put an error-reporting SDK behind Demo 6's logger, report Web Vitals,
and turn the four-command gate into a GitHub Actions workflow with a bundle
budget and a preview deploy per pull request. The 106 tests you now have are
the part of that gate you did not have to write twice.

---

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `useFormStatus()` always returns `pending: false` | You called it in the component that renders the `<form>`. It reads the nearest form **above** it — move it into a child component. |
| `An async function was passed to useActionState but…` / the form posts to a URL | `action={formAction}` must get the second value from `useActionState`, not the action itself, and not be combined with `method="post"` on a plain `<form>`. |
| Everything typed vanishes when validation fails | The inputs have `value` instead of `defaultValue`. With `value` and no `onChange` React clears them. |
| A checkbox group always arrives empty | `formData.get('interests')` returns the first entry only. A group needs `getAll`. |
| `newsletter` is `false` when the user ticked it | The switch has no `name`, so it never reaches the FormData. There is no `'off'` — an unchecked box sends nothing. |
| The optimistic value never appears | `setOptimistic…` was called outside an action or transition. It must be inside the `<form action>` function. |
| The heart flickers after a successful save | The store is updated before the request resolves. Move the store write after the `await`. |
| `A component suspended while responding to synchronous input` | `use()` got a promise created during render, so a new one arrives every render. The promise must come from a loader, a cache or a ref. |
| `Unhandled Rejection` in the Vitest output on a green suite | The bare `reviews.catch(() => {})` is missing from the loader. It marks the rejection observed without consuming it. |
| The whole page shows the reviews skeleton | The `<Suspense>` is too high in the tree. Move it down to the panel. |
| A failing reviews request blanks the product page | The `<Suspense>` has no error boundary beside it. Suspense handles pending, not rejected — wrap it in `<WidgetBoundary>`. |
| The page takes product + 1.5 s to appear | `fetchQuery` is called *after* the `await`. Start it first. |
| Every tab still says "ShopScope" | `index.html` still has a `<title>`. `document.title` is the **first** title in the document, and React appends. |
| Two `meta[name="description"]` tags after navigating | The `<meta>` has no `key`. |
| `<title>` renders `[object Object]` | A `<title>` takes a single string child. `{a} · {b}` is an array — build the string first. |
| The reviews never load in a test | MSW matched the default `/products/:id` handler, which ignores `select`. Teach it `select`, and remember specific paths must be registered **before** `/products/:id`. |
| A wishlist test passes alone and fails in the suite | The Zustand store was not reset. `useWishlistStore.setState({ ids: [] })` in `beforeEach`. |
| `next build` fails with `Module not found: '@/lib/…'` | The `paths` mapping is missing from `next-mini/tsconfig.json`, or you are running it from `starter/`. |
| `next build` rewrites your `tsconfig.json` | Expected. Next sets `jsx: "react-jsx"` and adds its generated types to `include`. Commit the rewritten file. |
| The Next page throws `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` | Node's TLS store does not trust your network's intercepting certificate — the browser and `curl` may be fine while `fetch` is not. Point `NODE_EXTRA_CA_CERTS` at your corporate root, or run the demo off a network that does not intercept. |
| `Functions cannot be passed directly to Client Components` | You passed a handler across the boundary. Pass data; keep the handler inside the client component. |
| The Next page shows a stale cart after `addToCart` | `revalidatePath('/products')` is missing, or the route is statically cached. Four caches — work out which one you are looking at. |
| `npm run check:bundle` fails after Block 1 | It should get *smaller*. If it grew, something still imports react-hook-form — check `src/components/fields/index.tsx` and what imports the barrel. |
