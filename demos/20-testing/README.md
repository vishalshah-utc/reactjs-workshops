# Demo 20 — Testing React Applications

**Demo guide** · ~130 minutes · TypeScript checks the shape; only a test checks the behaviour

---

## Where you are starting from

The starter is **Demo 19, finished**: one `QueryClient` at module scope, every
cache key in `src/api/queries.ts`, loaders that `ensureQueryData` and pages
that read the same options back with `useQuery`, an optimistic delete built
from `onMutate` / `onError` / `onSettled`, an infinite grid, polled stock, a
pushed price feed and `useOnlineStatus`.

Underneath that sits everything the first nineteen demos built: an axios
instance with four interceptors, a JWT refresh queue, `ApiError`, validated
env, React Router 8 in Data Mode with loaders, actions, middleware and error
boundaries, two Zustand stores, three pure reducers, react-hook-form and zod.

Around nine thousand lines. **Not one test.**

`npm run typecheck` is happy. `npm run lint` is happy. `npm run build` is
happy. And nothing in this repository says that the wishlist button toggles,
that six simultaneous 401s produce one refresh rather than six, or that the
optimistic delete puts the product back when the server says no.

New stubs: `src/test/setup.ts`, `src/test/utils.tsx`, `src/test/msw/handlers.ts`,
`src/test/msw/server.ts`, and seven `*.test.ts(x)` files sitting next to the
code they are about. `src/test/fixtures.ts` is given to you finished — it is
data, not a lesson. You create `vitest.config.ts`, `playwright.config.ts` and
`e2e/checkout.spec.ts` from nothing.

New dependencies: **none today.** `vitest@5.0.1`, `jsdom@30.1.0`,
`@testing-library/react@16.3.3`, `@testing-library/user-event@14.6.7`,
`@testing-library/jest-dom@7.0.1`, `msw@2.15.0` and `@playwright/test@1.63.0`
all arrived with the Part 6 dependency set in Demo 15. They are installed.
Today is the first time anything imports them.

## What you ship today

**A working test command**: `vitest.config.ts` built on top of the app's real
`vite.config.ts`, a setup file that registers the matchers and fills in the
browser APIs jsdom lacks, and one `renderWithProviders` every test goes
through. **Component tests** for `ProductCard`, written entirely through roles
and accessible names, that would have caught this morning's cold open in 40
milliseconds. **Pure tests** — validation, retry and backoff, all three
reducers, the Zustand cart store, the cache-key functions — with not one
`render` between them. **MSW handlers** answering every DummyJSON endpoint the
app can reach, driving the products page through loading → results → empty →
error and putting six concurrent 401s through the real interceptor chain.
**Router tests** with `createRoutesStub` over a loader, an action and the
`/account` middleware redirect. **One Playwright journey** against a real
build in a real browser. And the four-command gate Demo 22 puts in CI.

By the end you will be able to answer, without hesitating:

- What the testing trophy is, and which layer a React component test sits in
- Why `getByRole` comes first in the query priority, and why that ordering *is* an accessibility check
- The difference between `getBy`, `queryBy` and `findBy` — and which one can return `null`
- Why `userEvent` and not `fireEvent`, in one sentence about disabled buttons
- What you mock when you mock the network, and what you must never mock instead
- What the four data states are, and which one teams forget to design
- Where a `QueryClient` comes from in a test, and why a loader's is different from a component's
- What `createRoutesStub` gives you that `render(<App />)` does not
- Which handful of journeys deserve Playwright, and what makes a Playwright test flaky

> **Test behaviour, not implementation.** The single rule today. A test that
> knows a prop's name, a hook's return value or a component's internal state
> is a test you will delete during the next refactor — which means it was
> never protecting you. 📖 [study-notes 18](../../study-notes/18-testing/) is
> today's theory.

---

## Before the demo (5 minutes)

```
https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/20-testing/starter
```

> ⚠️ Click once, bookmark the `stackblitz.com/edit/…` URL. Fork it again
> tomorrow and you will be looking at an empty copy of your work.

Locally:

```bash
cd demos/20-testing/starter
npm install
npm run dev
```

Then open a **second terminal** and leave it open all day:

```bash
npm run test:watch
```

It will fail immediately. That is Lab 1.

Two things this repository will not do out of the box, and you should know
now rather than at minute 110. **`npm run test:coverage`** needs
`@vitest/coverage-v8`, which is not in the shared dependency set — Vitest
offers to install it on the first run. **`npm run test:e2e`** needs a browser
binary: `npx playwright install chromium`, once. The Lab 6 spec is written
and reviewed here; whether you run it is your download budget's call.

---

## The cold open

Nothing is broken yet. Let us break it the way it actually happens — during a
rename, at half past four, with the compiler watching.

**1. Rename the prop.** Open `src/components/ProductCard.tsx`. The card takes
`onAddToCart` and calls it from the add button. Rename it to `onAdd` —
interface, parameter, call site. Your editor's *Rename Symbol* does all three.

**2. Fix the one error the compiler finds.** `src/components/ProductGrid.tsx`
now has a red squiggle: it is passing a prop `ProductCard` no longer has. The
props sit in a block of six consecutive lines. Retype the block at speed and
transpose two of them:

```tsx
<ProductCard
  product={product}
  density={density}
  saved={wishlist.includes(product.id)}
  onToggleSave={onToggleSave}
  onAdd={onEdit}          {/* ← the slip */}
  onEdit={onAddToCart}    {/* ← and its twin */}
  onDelete={onDelete}
  busy={String(product.id) === busyId}
  slow={slow}
/>
```

**3. Ask every tool you own whether that is all right.**

```bash
npm run typecheck   # ✓ no errors
npm run lint        # ✓ 0 errors
npm run build       # ✓ built in 1.14s
```

All three are green, and they are *right* to be green. `onAdd` and `onEdit`
have exactly the same type — `((product: Product) => void) | undefined`. There
is no shape to disagree about. TypeScript has done its whole job.

**4. Now look at the page.** Signed out, on `/products`, **"Add to cart" does
nothing** — `onEdit` is `undefined` for a non-admin, so `onAdd?.(product)` is
a no-op, with no error, no console warning and no red anywhere. And a
**pencil button** has appeared on every card, which a signed-out visitor
should never see: it is the add-to-cart handler wearing the edit button's
clothes.

Types caught the shape. Nothing caught the behaviour. A three-line test —
click the button, expect the handler to have been called once — fails in 40
milliseconds, and you will write it in Lab 2. **Undo the two transposed lines
and the rename before you carry on.**

> The lesson is not "TypeScript is not enough", which everybody says and
> nobody acts on. It is narrower: **types constrain the shape of the wiring;
> only a test can assert what the wiring does.** Today is about working out
> which of those assertions are worth writing down.

---

## Lab 1 — The toolchain (15 min)

### Problem

`npm test` is in `package.json` and has been since Demo 15. Run it:

```
ReferenceError: describe is not defined
 ❯ src/components/ProductCard.test.tsx:13:1
```

Nine files, nine identical failures — and that is only the first of four
problems. There is no test configuration at all, so `globals` is off and
`describe` does not exist; the environment is Node, so there is no
`document` to render into; there is no setup file, so
`expect(...).toBeInTheDocument()` will not exist either; and Vitest does not
read `.env.development`, so the moment a test imports anything that reaches
`src/config/env.ts` you get

```
Error: [config] Missing required env var VITE_API_BASE_URL. Add it to .env.test.
```

before a single assertion runs.

### Concept

**The testing trophy, and where the money is.** Kent C. Dodds' picture
replaced the old pyramid, and the change is the point: the widest band is not
unit tests, it is **integration** — several real units wired together with
only the network faked.

| Layer | What it is here | Cost | What it catches |
|---|---|---|---|
| **Static** | `tsc --noEmit`, `eslint` | free, already running | typos, shapes, unused code — *and nothing from the cold open* |
| **Unit** | `validateProduct`, `isRetryable`, the reducers, `listOptionsFrom` | microseconds | rules, edge cases, off-by-ones |
| **Integration** | `ProductCard` with a real click; the products page with MSW | milliseconds | wiring — the layer the cold open broke |
| **E2E** | one Playwright journey | ~30 s and a browser | the things only a real build can be wrong about |

The trophy is a budget, not a ranking: most of your confidence should come
from the middle, because that is where the bugs that reach users live.

**What is worth testing, as a rule.** Write a test when you can finish this
sentence without naming an implementation detail: *"a user (or a caller)
should be able to ___ and see ___"*. If the only way to express the assertion
is "the `useState` should be `true`" or "`onAddToCart` should be passed down",
you are testing the wiring diagram, and the next refactor deletes it.

**And TypeScript says** `test` is not part of Vite's own config type. The
`defineConfig` you import today comes from **`vitest/config`**, not from
`vite` — same function, wider type. `mergeConfig` then lets you start from the
app's real config so the tests run through the same plugins the build uses.

### Steps

**A. `vitest.config.ts` — a new file at the project root**

One config or two? Two files, one source of truth. A `test` block inside
`vite.config.ts` works, but it ships test settings into every `vite build`. A
separate file that *extends* the real one keeps them apart without letting
them drift — and Vitest prefers `vitest.config.ts` automatically.

```ts
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      // A DOM without a browser. render() needs `document`; Node has none.
      environment: 'jsdom',
      // describe/it/expect/vi without an import in every file.
      globals: true,
      // Runs once per test FILE, before anything else.
      setupFiles: ['./src/test/setup.ts'],
      // THE line that makes this project testable at all — see below.
      env: {
        VITE_API_BASE_URL: 'https://dummyjson.com',
        VITE_PAGE_SIZE: '12',
        VITE_LOG_LEVEL: 'error',
      },
      // Tests live next to the code. e2e/ belongs to Playwright.
      include: ['src/**/*.test.{ts,tsx}'],
      exclude: ['node_modules/**', 'dist/**', 'e2e/**'],
      css: false,
      restoreMocks: true,
      coverage: { provider: 'v8', reporter: ['text', 'html'], include: ['src/**/*.{ts,tsx}'], exclude: ['src/test/**', 'src/**/*.test.{ts,tsx}', 'src/main.tsx', 'src/vite-env.d.ts', 'src/types/**'] },
    },
  }),
);
```

`test.env` is the line to read twice. `.env.development` is loaded by **Vite's
dev server**, and Vitest is not the dev server. Without those three keys,
`src/config/env.ts` throws on import — and because `env` is imported by
`client.ts`, which is imported by every service, that means *every* test file
fails before its first `describe`.

`exclude: ['e2e/**']` matters as much. Playwright specs import
`@playwright/test`, whose `test()` and `expect()` are not Vitest's. Let Vitest
find one and you get a confusing crash in a file you were not thinking about.

**B. Teach the TypeScript projects about the new files.**
`tsconfig.app.json` — the browser project — gains
`"types": ["vite/client", "vitest/globals"]`. `tsconfig.node.json` —
everything that runs *in Node* — gains the files themselves:
`"include": ["vite.config.ts", "vitest.config.ts", "playwright.config.ts", "e2e", "types"]`.
`playwright.config.ts` and `e2e/` do not exist until Lab 6; an `include`
pattern that matches nothing is not an error.

**C. `src/test/setup.ts` — `TODO(lab-1.1)`**

```ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, vi } from 'vitest';

beforeAll(() => {
  // jsdom IS NOT A BROWSER: it implements the DOM and none of the observers.
  // ThemeContext subscribes to prefers-color-scheme via useSyncExternalStore.
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: false, media: query, onchange: null, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(() => false) })));

  // useIntersection (EndlessGrid's sentinel) and react-virtual's measurement.
  class NoopObserver { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } }
  vi.stubGlobal('IntersectionObserver', NoopObserver);
  vi.stubGlobal('ResizeObserver', NoopObserver);

  // Layout does not exist, so neither does scrolling. The Pager calls this.
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  // Unmount what the test rendered. Without it, test 1's effects — timers,
  // subscriptions, polling — are still running during test 2.
  cleanup();
  localStorage.clear();
});
```

The import is `@testing-library/jest-dom/vitest`, with the suffix. The bare
entry point patches Jest's `expect` and yours stays matcher-less, which
produces the memorably unhelpful `expect(...).toBeInTheDocument is not a
function`.

**D. `src/test/utils.tsx` — `TODO(lab-1.2)`**

```tsx
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0, gcTime: 0 }, mutations: { retry: false } },
  });
}

export function renderWithProviders(ui: ReactElement, { route = '/', client = createTestQueryClient(), withRouter = true, ...options }: ProvidersOptions = {}): ProvidersResult {
  function Providers({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <ThemeProvider>
          <ToastProvider>{withRouter ? <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter> : children}</ToastProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  return {
    // setup() BEFORE render, once per test: it owns pointer and keyboard state.
    user: userEvent.setup(),
    client,
    ...render(ui, { wrapper: Providers, ...options }),
  };
}
```

Three decisions are buried in there. **A fresh `QueryClient` per test, never
the app's** — `src/lib/queryClient.ts` creates one at module scope, which is
right for a browser tab and wrong for a test run, because a cache shared by
two hundred tests means test 41 can see what test 12 fetched and the *order*
decides whether the suite is green. **`retry: false`** — the app retries twice
with backoff, which turns "assert the error state" into a four-second wait.
And **`withRouter`** — Lab 5 renders a `createRoutesStub`, which *is* a
router, and nesting two is an error rather than a stricter test.

### Verify

```bash
npm test
```

```
 Test Files  9 skipped (9)
      Tests  63 todo (63)
```

Nine files found, every `it.todo` in them reported, zero failures and no env
error. The scaffolding holds. Now go and fill it in.

### Watch out

- **`Missing required env var VITE_API_BASE_URL`** — `test.env` is missing, or
  you put it at the top level of the config instead of inside `test`.
- **`expect(...).toBeInTheDocument is not a function`** — the setup file is
  not in `setupFiles`, or you imported `@testing-library/jest-dom` without
  `/vitest`.
- **`document is not defined`** — `environment: 'jsdom'` missing. Vitest's
  default environment is Node.
- **`matchMedia is not a function`** — every jsdom gap belongs in the setup
  file, stubbed once, not in whichever test happened to hit it first.
- **The React Compiler.** Because this config is `mergeConfig`'d from the real
  one, the compiler plugin runs over the code under test too — it is
  transformed exactly as the shipped bundle is. A hand-rolled test config
  would have quietly tested untransformed source.

### In the real world

These five minutes are why most codebases have no tests: the first one is
expensive and every one after it is free. Teams that defer it until "after the
deadline" never write it, because by then nobody can point at the one
component worth starting with.

---

## Lab 2 — Testing a component (25 min)

### Problem

Write the test that would have caught the cold open. It has to survive being
right about the *behaviour* while knowing nothing about the props, the
classes, the internal state or the library the button came from — because
every one of those will change, and the behaviour will not.

### Concept

**`render`, then `screen`.** `render(…)` mounts into a `document.body` that
RTL tears down after each test; you query through **`screen`**, which searches
the whole document rather than the container `render` returns. That matters
for portals — a Bootstrap modal, an offcanvas, a toast — which render
*outside* the container, where destructured queries cannot see them.

**Query priority, and why it is an accessibility check.** Testing Library
orders its queries deliberately, best first:

| Rank | Query | Finds things by | Use it when |
|---|---|---|---|
| 1 | `getByRole(role, { name })` | the accessibility tree | almost always |
| 2 | `getByLabelText` | a form label | form fields |
| 3 | `getByPlaceholderText` | a placeholder | there is genuinely no label |
| 4 | `getByText` | visible text | non-interactive content |
| 5 | `getByDisplayValue` / `getByAltText` / `getByTitle` | attributes | the rare rest |
| 6 | `getByTestId` | `data-testid` | nothing above worked — and say why |

The order ranks how close each query is to how a person finds the thing.
`getByRole('button', { name: 'Save Mascara to wishlist' })` passes only if
that button is reachable and announced correctly — so **a suite written in
roles is a partial accessibility audit that runs on every commit**. Reach for
`getByTestId` and you have opted out of it.

**`getBy` vs `queryBy` vs `findBy`** — three families, three questions:
`getBy…` returns the element and throws when there is none ("this is here
**now**"); `queryBy…` returns the element or **`null`** and never throws
("this is **not** here"); `findBy…` returns a `Promise` that rejects after a
second ("this **will** be here"). Only `queryBy` can return `null`, which
makes it the only one you can assert absence with —
`expect(screen.getByText('x')).toBeNull()` can never pass, because `getBy`
throws before `expect` is reached.

**`userEvent`, not `fireEvent`.** `fireEvent.click(el)` dispatches one event
at a node. `await user.click(el)` does what a pointer does: checks the element
is visible and enabled, then fires `pointerdown`, `mousedown`, `focus`,
`pointerup`, `mouseup`, `click` in order. **`fireEvent` will happily "click" a
disabled button**, so a test written with it passes against a button that does
nothing in a browser. Every `userEvent` call is `async`.

### Steps

**A. `src/components/ProductCard.test.tsx` — `TODO(lab-2.1)`**

Start with rendering and money, because the discount is derived and derived
values drift:

```tsx
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test/utils';
import { makeProduct } from '../test/fixtures';
import { ProductCard } from './ProductCard';

describe('ProductCard', () => {
  it('renders the title, the sale price and the list price it replaced', () => {
    renderWithProviders(<ProductCard product={makeProduct({ title: 'Essence Mascara', price: 100, discountPercentage: 15 })} />);

    // getByRole FIRST: a link is what a screen reader announces, so this
    // checks the accessibility tree and the output in one assertion.
    expect(screen.getByRole('link', { name: 'Essence Mascara' })).toHaveAttribute('href', '/products/1');
    expect(screen.getByText('$85.00')).toBeInTheDocument();  // 100 − 15%
    expect(screen.getByText('$100.00')).toBeInTheDocument(); // struck through
    expect(screen.getByText('15% off')).toBeInTheDocument();
  });
```

`makeProduct` is a **factory**, not a shared constant: a shared object is
shared mutable state, and `makeProduct({ stock: 0 })` states only the field
the test is about — it reads as "an out-of-stock product".

**B. Absence, with the only query that can express it** — one line:
`expect(screen.queryByText(/% off/)).toBeNull()` for a product with no
discount.

**C. The interaction, and the assertion the cold open needed**

For the wishlist button, the accessible **name** is the assertion — *"Save
Powder Canister to wishlist"* versus *"Remove … from wishlist"* is what a
screen-reader user hears, and `aria-pressed` is the state they are told:
`expect(save).toHaveAttribute('aria-pressed', 'false')`, then
`await user.click(save)`, then
`expect(onToggleSave).toHaveBeenCalledExactlyOnceWith(7)`.

```tsx
  it('calls the add-to-cart handler exactly once, with the whole product', async () => {
    const onAddToCart = vi.fn();
    const product = makeProduct({ id: 3, stock: 5 });
    const { user } = renderWithProviders(<ProductCard product={product} onAddToCart={onAddToCart} />);

    await user.click(screen.getByRole('button', { name: 'Add to cart' }));

    expect(onAddToCart).toHaveBeenCalledExactlyOnceWith(product);
  });
```

`toHaveBeenCalledExactlyOnceWith` is doing two jobs. "With the product" is the
cold open's bug. "Exactly once" is the *other* bug of this shape — a handler
attached twice, or a button inside a form that also submits — which
`toHaveBeenCalled()` would wave through.

**D. The disabled case, which is where `fireEvent` would have lied**

```tsx
  it('disables the button and renames it when the product is out of stock', async () => {
    const onAddToCart = vi.fn();
    const { user } = renderWithProviders(<ProductCard product={makeProduct({ stock: 0 })} onAddToCart={onAddToCart} />);

    const button = screen.getByRole('button', { name: 'Sold out' });
    expect(button).toBeDisabled();
    expect(screen.getByText('Out of stock')).toBeInTheDocument();

    // userEvent refuses to click a disabled element, exactly as a pointer does.
    await user.click(button);
    expect(onAddToCart).not.toHaveBeenCalled();
  });
```

**E. Conditional UI, through `rerender`** — `queryByRole('button', { name:
'Delete Red Lipstick' })` is `null` without handlers, and
`rerender(<ProductCard … onEdit={vi.fn()} onDelete={vi.fn()} />)` makes both
admin buttons appear. One test, two states, one mount.

Notice what is *not* in any of these tests: the word `props`, the word
`state`, the class `product-card`, the fact that the button comes from React
Bootstrap, or a single snapshot. Replace React Bootstrap with Tailwind
tomorrow and every one of these still passes — which is the definition of a
test that is protecting you.

### Verify

```bash
npm test -- ProductCard
```

```
 ✓ src/components/ProductCard.test.tsx (8 tests) 120ms
```

Now redo the cold open — rename the prop and transpose the two lines in
`ProductGrid.tsx`. The suite still passes, because `ProductGrid` has no test
of its own; but change `onAddToCart?.(product)` to `onEdit?.(product)` inside
`ProductCard` and:

```
 × calls the add-to-cart handler exactly once, with the whole product
   → expected "spy" to be called once, but it was never called
```

Forty milliseconds, and the failure message names the behaviour that broke.

### Watch out

- **`Unable to find an accessible element with the role "button" and name …`** —
  RTL prints the whole accessible tree under the error. Read it: nine times
  out of ten the name is right and the *role* is wrong, or an `aria-label`
  has overridden the visible text (it does — a label always wins over
  content).
- **An assertion that runs before React has re-rendered.** Missing `await` on
  a `user.*` call. There is an ESLint rule for this
  (`testing-library/await-async-events`) and it is worth adding on a real team.
- **`getByText` on text split across elements.** `"Only 3 left"` inside a
  badge is one text node; `"$85.00"` next to `"$100.00"` is two. Query the
  smallest node that owns the whole string, or pass a function matcher.
- **Reaching for `data-testid` to "make it simpler".** It is simpler, and it
  buys a test that passes when the button is unreachable by keyboard and
  unnamed to a screen reader. Add the accessible name to the component
  instead; you have just improved the product rather than the test.

### Challenge (2 min)

`density="compact"` hides the whole action row. Write the test — and notice
that the wishlist button *is* still there.

### In the real world

Component tests are the ones a team keeps, because they fail for reasons the
team recognises. The failure mode is the opposite of too few: two hundred
shallow tests asserting that a component "renders without crashing", which
cost a day to write, a day a month to maintain, and catch the class of bug
`tsc` already catches for free.

---

## Lab 3 — Testing pure logic (15 min)

### Problem

Five of the riskiest things in this codebase are plain functions: the
validation rules, the retry policy, three reducers, the cart store's maths and
the function that decides what a cache key *is*. Not one of them needs React,
a DOM, a provider or a network — and if you test them through a component you
will find out that something is wrong without finding out what.

### Concept

**No `render` in this lab. Not once.** A pure function is `(input) => output`
with no side effects, so a test is one line of setup, one call and one
comparison: microseconds, never flaky, and a failure message that points at a
rule rather than at a screen.

If a piece of logic is *hard* to test this way, that is the logic telling you
the rules are entangled with the rendering — which is exactly the move Demo 12
made when `cartLinesReducer` left the component, and Demo 13 repeated when the
store called it instead of reimplementing it. **Testability is a design
property, not a testing technique.** 📖 study-notes 18 §9.

**A Zustand store is not React.** `useCartStore` is a hook *binding*; the
store underneath it is an object with `getState()`, `setState()` and
`subscribe()`. Everything in it can be tested through those three — which is
also why `checkoutAction`, a router action with no hooks available, can call
`useCartStore.getState()`.

What a module-scope store costs you is isolation: one store per test *file*,
shared by every test in it. Hence the line that makes the file deterministic:

```ts
beforeEach(() => useCartStore.setState({ lines: [], isOpen: false }));
```

A partial `setState` **merges**. Replacing outright — `setState(…, true)` —
deletes `add`, `remove` and every other action along with the data.

### Steps

**A. `src/lib/validation.test.ts` — `TODO(lab-3.1)`**

```ts
it('rejects the empty form on every required field at once', () => {
  // Not "reports an error" — reports ALL of them. A validator that stops at
  // the first failure makes the user fix the form one field per submit.
  expect(validateProduct(PRODUCT_EMPTY)).toEqual({
    title: 'Give it a name of at least 2 characters.',
    price: 'Price must be more than zero.',
    category: 'Pick a category.',
  });
});

it.each([
  ['a title of only whitespace', { title: '   ' }, 'title'],
  ['a price of zero', { price: 0 }, 'price'],
  ['a fractional stock level', { stock: 1.5 }, 'stock'],
  ['a description over 300 characters', { description: 'x'.repeat(301) }, 'description'],
])('rejects %s', (_name, patch, field) => expect(validateProduct({ ...valid, ...patch })).toHaveProperty(field));

// And the boundaries that must PASS — title 'ab', stock 0, 300 characters.
```

`it.each` turns six near-identical tests into one table, and the failure
output still names the row — so a red run says *which rule* broke. The
boundary test is the one people leave out, and the one that catches `<`
written where `<=` was meant.

For zod, test the **field**, not the form: `signupSchema.shape.password` is a
schema of its own, so the test names the rule it is about.

```ts
expect(signupSchema.shape.password.safeParse('short').error?.issues.map((i) => i.message))
  .toEqual(['Use at least 8 characters.', 'Include at least one number.']);

// '' type-checks — the schema allows it — and must still fail. That is the
// bug the .refine exists for, so this is the test that protects it.
expect(signupSchema.shape.gender.safeParse('').success).toBe(false);
```

**B. `src/lib/retry.test.ts` — `TODO(lab-3.2)`**

`isRetryable` is a status table, so write it as one — `it.each` again. Then
the interesting half: `withRetry` **sleeps**, and real timers would mean a
test that takes 1.6 seconds to prove something that takes no time.

```ts
vi.useFakeTimers();
const fn = vi.fn().mockRejectedValueOnce(httpError(503)).mockRejectedValueOnce(httpError(503)).mockResolvedValue('ok');

const promise = withRetry(fn, { attempts: 3, baseDelayMs: 400 });
// advanceTimersByTimeAsync also lets the awaited promises in between settle.
// Plain advanceTimersByTime does not, and the test hangs for ever.
await vi.advanceTimersByTimeAsync(5_000);
await expect(promise).resolves.toBe('ok');
expect(fn).toHaveBeenCalledTimes(3);

// For the give-up case, subscribe to the rejection BEFORE advancing the clock.
// Advance first and the promise rejects with nobody listening, which Node
// reports as an unhandled rejection — a passing test inside a red run.
const settled = expect(withRetry(fn, { attempts: 2, baseDelayMs: 400 })).rejects.toBe(last);
await vi.advanceTimersByTimeAsync(5_000);
await settled;
```

And the backoff itself, read off a spy rather than guessed at:

```ts
const sleeps = vi.spyOn(globalThis, 'setTimeout');
// …two failures then a success, with the clock advanced…
const delays = sleeps.mock.calls.map((call) => Number(call[1]));
expect(delays[0]).toBeGreaterThanOrEqual(400);
expect(delays[0]).toBeLessThan(600);
expect(delays[1]).toBeGreaterThanOrEqual(800);
expect(delays[1]).toBeLessThan(1_000);
```

Ranges, not equalities, because the jitter is deliberate — it is what stops
every client that failed together from retrying together. `afterEach(() =>
vi.useRealTimers())` at the top of the `describe`, always.

**C. `src/reducers/reducers.test.ts` — `TODO(lab-3.3)`**

All three in one file, because the test is the same three times: call a
function with a state and an action, compare the result.

```ts
it('IGNORES a result that arrives when nothing is pending', () => {
  // The user pressed reset while the request was in flight. This is the rule
  // the state machine exists for, and the only one worth a comment.
  const idle: RequestStatus<string> = { status: 'idle' };
  expect(requestStatusReducer(idle, { type: 'succeed', data: 'late' })).toBe(idle);
});

it('never mutates the array it is given', () => {
  const lines = [line];
  cartLinesReducer(lines, { type: 'add', product: { ...product, id: 2 } });
  // If this fails React will not re-render: same array reference, no change.
  expect(lines).toHaveLength(1);
});

it('keeps at most four toasts on screen, dropping the OLDEST', () => {
  const five = [1, 2, 3, 4, 5].reduce<ToastItem[]>((list, id) => toastsReducer(list, { type: 'push', toast: toast(id) }), []);
  expect(five.map((item) => item.id)).toEqual([2, 3, 4, 5]); // not [1, 2, 3, 4]
});
```

Note `toBe(idle)`, not `toEqual`: the assertion is that the reducer returned
*the same object*, which is what tells React there is nothing to re-render.
Two more cover "zero means remove" and the derived `lineCount` / `subtotal`.

**D. `src/store/cart.test.ts` — `TODO(lab-3.4)`**

```ts
it('persists the lines but NOT the drawer', () => {
  useCartStore.getState().add(mascara);
  const stored = JSON.parse(localStorage.getItem('shopscope.cart') ?? '{}');
  expect(stored.state.lines).toHaveLength(1);
  expect(stored.state).not.toHaveProperty('isOpen'); // partialize
});
```

Five more cover add-and-open-the-drawer, the merge on a repeat add,
zero-quantity removal, the selectors, and `subscribe` firing exactly once per
action and never after `unsubscribe()`.

The last one tests a *configuration decision* — `partialize` — which is
exactly the kind of thing deleted by accident in a refactor and noticed by a
user whose cart drawer springs open on every page load.

**E. `src/api/queries.test.ts` — `TODO(lab-3.5)`**

A wrong cache key is the most expensive bug in a cached app and the hardest to
see: nothing throws, the screen just refetches when it should not, or shows
one product's data under another's name.

```ts
it('IGNORES the params that are about the UI, not about the data', () => {
  // ?edit opens a modal, ?flash shows a toast, ?view switches the grid. None
  // of them changes which twelve products the server would return, so none of
  // them may change the key — or opening a modal refetches the page.
  expect(listOptionsFrom(params('?page=2&edit=5&flash=Saved&view=endless'))).toEqual(listOptionsFrom(params('?page=2')));
  // toEqual, not toBe: the keys are different arrays and TanStack Query
  // hashes them structurally — which is exactly what this asserts.
  expect(productListQuery(params('?category=all&edit=9')).queryKey).toEqual(productListQuery(params('')).queryKey);
});

it('stops on the last page, whatever its size', () => {
  const { getNextPageParam } = productsInfiniteQuery(params(''));
  expect(getNextPageParam(page(0, 12, 24), [], 0, [])).toBe(12);
  expect(getNextPageParam(page(16, 8, 24), [], 16, [])).toBeUndefined();
  expect(getNextPageParam(page(12, 8, 30), [], 12, [])).toBe(20);
});
```

`getNextPageParam` takes four arguments — `(lastPage, allPages, lastPageParam,
allPageParams)` — and returning `undefined` is the only way an infinite query
learns that it has reached the end. That `undefined` is what `hasNextPage`
reads, and getting it wrong gives you either a "Load more" button that never
goes away or a list that stops four products early.

### Verify

```bash
npm test -- src/lib src/reducers src/store src/api/queries
```

```
 Test Files  5 passed (5)
      Tests  63 passed (63)
   Duration  760ms
```

Sixty-three assertions about the rules of the application, in under a second,
with no DOM involved.

### Watch out

- **`Vitest timed out in 5000ms`** after switching to fake timers — you used
  `advanceTimersByTime` instead of `advanceTimersByTimeAsync`. The sync
  version never yields to the microtask queue, so the `await` inside the code
  under test never resumes.
- **An "unhandled rejection" panel under a green suite.** You advanced the
  clock before attaching `.rejects`. Build the assertion first.
- **Tests that pass alone and fail together.** The Zustand `beforeEach` is
  missing, or `localStorage` is not cleared — which the setup file does.
- **Asserting a float with `toBe`.** `0.1 + 0.2` is not `0.3`; use
  `toBeCloseTo` for anything that has been through a percentage.

### In the real world

Teams skip this layer because it feels too easy to be worth it, and it is the
layer that pays for itself fastest. When a customer reports a wrong discount,
the first question is "is the maths wrong, or the rendering?" — and a passing
pure suite answers it in five seconds without opening a browser.

---

## Lab 4 — Mocking the network with MSW (30 min)

### Problem

Every interesting failure in this app is a network failure: the catalogue is
down, the search matches nothing, the token expired halfway through six
requests. None of them can be reproduced by clicking, and all of them are
one-line handler overrides away.

### Concept

**Mock the network, never your own code.** The tempting shortcut is
`vi.mock('../api/services/products')` — which deletes the axios instance, the
four interceptors, the `ApiError` normaliser, the retry policy and the query
cache from the test. That is everything that could plausibly be wrong, leaving
only the component, which was probably fine. **MSW** intercepts one level
lower: it patches Node's HTTP layer, catching whatever the code actually uses
— axios here, `fetch` in the router — and nothing in `src/` knows.

| You mock… | What still runs | What you are really testing |
|---|---|---|
| the service module | the component | that you called your own mock |
| `fetch`/`axios` by hand | interceptors, sometimes | a hand-written protocol emulator |
| **the network (MSW)** | **everything in `src/`** | **the app** |

**The four data states.** Every screen that fetches has four, and teams
routinely design two: **loading** (`AppBootSplash`, then the grid),
**loaded** (twelve cards, "24 products"), **empty** ("No products found") and
**error** (the route boundary, showing the server's own message). The last
two are the forgotten ones. A handler override makes each a two-line
arrangement, which is the argument for MSW in one sentence: **the states you
never test are the states you never design.** 📖 study-notes 18 §7.

**Where the `QueryClient` comes from, in a route test.** In Lab 2 every test
got a fresh one. Here it cannot: `productsLoader` *imports*
`src/lib/queryClient.ts` directly, because a loader has no hooks. So a loader
test uses the app's real module-scope client, and must clean up after itself:

```ts
beforeEach(() => queryClient.clear());
```

Leave that out and test 2's loader finds test 1's page already cached,
returns it synchronously, and never touches the handler test 2 just
installed. The symptom is a test that passes on its own and fails in the
suite — or, worse, the reverse.

### Steps

**A. `src/test/msw/handlers.ts` — `TODO(lab-4.1)`**

The default world: what the API says when nobody has said otherwise.

```ts
const API = 'https://dummyjson.com';

export const handlers = [
  // ORDER MATTERS. The specific paths must be registered before /products/:id,
  // or `/products/categories` matches it with id="categories".
  http.get(`${API}/products/search`, ({ request }) => page(matching(request), new URL(request.url))),
  http.get(`${API}/products/categories`, () => HttpResponse.json(CATEGORIES)),
  http.get(`${API}/products/category/:slug`, ({ params, request }) => { /* … */ }),
  http.get(`${API}/products/:id`, ({ params }) => { /* 404 when unknown */ }),
  http.get(`${API}/products`, ({ request }) => page(CATALOGUE, new URL(request.url))),
  // …the three writes, /auth/login, /auth/refresh, /auth/me, /users, /carts/add
];
```

Two helpers earn their place. `page()` applies `limit`, `skip`, `sortBy` and
`order` the way DummyJSON does — including `limit=0` meaning *all* — and
`project()` honours `select=` by returning only the named fields. The second
is not busywork: `listStock()` asks for `select=id,stock` and reads
`products[].stock`, so a handler that ignored `select` would return whole
products and the test would pass against code that is wrong in production.
**A mock more generous than the real API hides bugs rather than catching
them.**

**B. `src/test/msw/server.ts` — `TODO(lab-4.2)`, and the setup file again**

```ts
export const server = setupServer(...handlers);
```

Then in `src/test/setup.ts`, the lifecycle:

```ts
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());   // undo this test's server.use(…)
afterAll(() => server.close());
```

`onUnhandledRequest: 'error'` is not optional discipline. Without it, a
request nobody mocked goes to the real internet: the suite becomes slow,
flaky and dependent on DummyJSON being up, and one day it fails in CI for
reasons that have nothing to do with the commit.

**C. `src/routes/ProductsPage.test.tsx` — `TODO(lab-4.3)`**

The page needs a router around it, so build the smallest one that is still
honest — the route table from `src/router.tsx` with the parts this test is not
about left out:

```tsx
const Stub = createRoutesStub([
  {
    id: 'root',
    path: '/',
    // A stand-in for RootLayout: the page reads useRouteLoaderData('root'),
    // so the id and the shape matter. The header and the drawer do not, and
    // leaving them out keeps the failure output readable.
    Component: () => <Outlet />,
    loader: () => ({ user: null }),
    HydrateFallback: AppBootSplash,
    ErrorBoundary: RootErrorBoundary,
    children: [{ path: 'products', Component: ProductsPage, loader: productsLoader }],
  },
]);

function renderProducts(url = '/products') {
  return renderWithProviders(<Stub initialEntries={[url]} />, { withRouter: false, client: queryClient });
}
```

Then the four states, in order:

```tsx
it('shows the loading state, then the results', async () => {
  renderProducts();

  // getBy, not findBy: this must be on screen on the FIRST render, before
  // anything is awaited. findBy would pass even if it appeared a tick late.
  expect(screen.getByText('Loading ShopScope…')).toBeInTheDocument();

  // Asserts two things at once: it was there, and it went away.
  await waitForElementToBeRemoved(() => screen.queryByText('Loading ShopScope…'));

  expect(await screen.findByRole('heading', { name: 'All products' })).toBeInTheDocument();
  expect(screen.getByText('24 products')).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: /^(Add to cart|Sold out)$/ })).toHaveLength(12);
});

it('renders the EMPTY state when the search matches nothing', async () => {
  // A real, empty, SUCCESSFUL response — not an error, and not a spinner that
  // never resolves. This is the state most apps forget to design.
  renderProducts('/products?q=nothing-matches-this');
  expect(await screen.findByText('No products found')).toBeInTheDocument();
});

it('renders the ERROR state when the catalogue is down', async () => {
  server.use(http.get(`${API}/products`, () => HttpResponse.json({ message: 'Server is on fire' }, { status: 500 })));
  renderProducts();

  const alert = await screen.findByRole('alert');
  expect(within(alert).getByText('Server is on fire')).toBeInTheDocument();
});
```

That last assertion is worth a moment. The 500 travelled from MSW through
axios, through the logging interceptor, through the refresh interceptor
(which ignored it — not a 401), through the `ApiError` normaliser, out of
`ensureQueryData`, out of the loader as a thrown error, into React Router's
error path and into `RootErrorBoundary`, which chose to print the backend's
own message over its generic one. **Six units, one assertion, no mocks.** That
is what the middle of the trophy buys.

And one test for a decision rather than a feature:

```tsx
it('survives a categories outage — the page is the product list, not the strip', async () => {
  server.use(http.get(`${API}/products/categories`, () => HttpResponse.json({ message: 'nope' }, { status: 500 })));
  renderProducts();

  // Promise.allSettled, not Promise.all: an optional request must not be able
  // to sink a page. This test is the only thing keeping that `allSettled`.
  expect(await screen.findByRole('heading', { name: 'All products' })).toBeInTheDocument();
  expect(screen.queryByRole('alert')).toBeNull();
});
```

Two notes for this file. `installInterceptors()` in `beforeAll` — the same
call `main.tsx` makes; without it the page gets raw `AxiosError`s and
"Request failed with status code 500" is not what this app shows anyone. And
`queryClient.setDefaultOptions({ queries: { retry: false } })`, for the reason
Lab 1 gave.

**D. `src/api/interceptors/refresh.test.ts` — `TODO(lab-4.4)`**

The refresh queue is the piece of this codebase most likely to be subtly
wrong and least likely to be noticed: it only misbehaves when several
requests expire at the same moment, which is exactly when nobody is watching.

Arrange a world where the token has expired — a `GET /products/:id` that
401s until it is shown `Bearer access-2`, and a `POST /auth/refresh` that
counts its own calls and hands back the rotated pair — then ask the question
the implementation exists to answer:

```ts
it('refreshes ONCE for six concurrent 401s and replays all six', async () => {
  const results = await Promise.all([1, 2, 3, 4, 5, 6].map((id) => getProduct(id)));

  // Six refreshes would mean five requests using an already-rotated refresh
  // token — and a surprise logout for the user.
  expect(refreshCalls).toBe(1);
  // Six 401s plus six replays. Nothing dropped, nothing run three times.
  expect(productCalls).toBe(12);
  expect(results.map((product) => product.id)).toEqual([1, 2, 3, 4, 5, 6]);
});
```

Then the three failure modes the code guards against, one test each: a
**failed refresh** (sign out, and reject with the *original* 401 — the honest
answer to the question the caller asked), the **`_retry` ceiling** (a second
401 is final; without it this is an infinite loop rather than a failing
request) and the **`/auth/*` exemption** (a 401 from `/auth/me` with a fresh
token means the session is genuinely over; refreshing there is how you build
a loop between two interceptors).

Finally the normaliser, which is the boundary everything above depends on:

```ts
it('turns a 404 body into a typed, readable error', async () => {
  const error = await rejection(getProduct(9999));

  expect(error.status).toBe(404);
  expect(error.code).toBe('HTTP_404');
  expect(error.isNotFound).toBe(true);
  expect(error.isRetryable).toBe(false);
  // The id the logging interceptor attached comes back on the error — the
  // link between a user's screenshot and one line in the server log.
  expect(error.requestId).toMatch(/^[0-9a-f-]{36}$/);
});
```

**And TypeScript says** `promise.catch((e) => e)` has type `T | unknown`, so
every assertion after it needs a cast. A four-line `rejection(promise)` helper
awaits it inside `try`, returns the error once narrowed with `instanceof
ApiError`, and throws *"Expected the request to fail, but it resolved"*
otherwise — which is the failure mode a bare `.catch` hides.

### Verify

```bash
npm test
```

```
 Test Files  9 passed (9)
      Tests  95 passed (95)
   Duration  1.80s
```

Then prove the mock is doing the work: comment out `retry: false` and watch
the error test go from 40 ms to four seconds.

### Watch out

- **`Cannot find module 'msw/node'`** — you imported from `msw` instead.
  `msw` is the browser/service-worker entry; `msw/node` is `setupServer`.
- **`[MSW] Error: intercepted a request without a matching handler`** — good;
  that is `onUnhandledRequest: 'error'` working. Read the URL it prints.
- **`/products/categories` returning a 404** — you registered `/products/:id`
  first and it matched `"categories"` as an id. Registration order wins.
- **A test that passes alone and fails in the suite** — `server.resetHandlers()`
  missing from `afterEach`, or the module-scope `queryClient` not cleared.

### In the real world

The handler file becomes an asset far beyond tests: point a dev build at
`msw/browser` and the same handlers give the team a working app before the
backend exists, and a demo environment that cannot go down. What makes that
possible is the discipline this lab insisted on — handlers that behave like
the real API, including the inconvenient parts.

---

## Lab 5 — Testing routes (20 min)

### Problem

Three things in this app are not components and not services, and all three
can be wrong on their own: a **loader** that turns a 404 into a not-found
page, an **action** that returns errors but redirects on success, and a
**middleware** that sends a signed-out visitor to `/login` with a
`redirectTo`. There is no browser in a Vitest run and no `<App />` worth
mounting. There is `createRoutesStub`.

### Concept

**`createRoutesStub` is the route table, minus the app.** It takes the same
route objects `createBrowserRouter` takes — `path`, `Component`, `loader`,
`action`, `middleware`, `ErrorBoundary`, `HydrateFallback`, children — and
returns a component you render with `initialEntries`. Inside it,
`useLoaderData`, `useActionData`, `useNavigation`, `useSearchParams` and
`<Form>` all work, because it is a real router.

It is exported from **`react-router`** itself in v8 — no `react-router-dom`,
no `@remix-run/testing`:

```tsx
import { createRoutesStub } from 'react-router';
```

Use it rather than `createMemoryRouter` when you want a *slice*: a stub lets
you swap the root layout for `() => <Outlet />` and keep the one route you
care about intact, so a failure names your loader rather than the site header.

**What to put in the stub, and what to leave out.** Keep anything the code
under test reads — the root route's `id: 'root'` and the shape of its loader
data, because `ProductsPage` calls `useRouteLoaderData('root')`. Leave out
anything it only renders next to.

**The singleton again.** Loaders and actions import `queryClient` directly,
so this file — not the component tests — is the one that clears it.

### Steps

**A. `src/routes/routes.test.tsx` — `TODO(lab-5.1)`, the loader**

```tsx
const Stub = createRoutesStub([
  {
    id: 'root',
    path: '/',
    Component: () => <Outlet />,
    HydrateFallback: AppBootSplash,
    ErrorBoundary: RootErrorBoundary,
    children: [{ path: 'products/:productId', Component: ProductDetailPage, loader: productDetailLoader, ErrorBoundary: ProductErrorBoundary }],
  },
]);

// The loader read params.productId, filled the cache, and the component
// rendered from it with no loading state of its own.
render('/products/3');
expect(await screen.findByRole('heading', { name: 'Essence Mascara 3' })).toBeInTheDocument();

// …and for /products/9999 the loader caught the ApiError and threw a Response
// instead, which is what lets the boundary say "not found" rather than
// "something broke":
expect(within(await screen.findByRole('alert')).getByText('No product with id 9999.')).toBeInTheDocument();

// …while a 503 falls through to the generic branch, message and all.
```

**B. The action, through the smallest form that can express its contract**

```tsx
function MiniProductForm() {
  const actionData = useActionData<typeof productsAction>();
  const errors = actionData && 'errors' in actionData ? actionData.errors : undefined;
  return (
    <Form method="post">
      <input type="hidden" name="intent" value="create" />
      <label>Title <input name="title" defaultValue="" /></label>
      <label>Price <input name="price" defaultValue="" /></label>
      <label>Category <input name="category" defaultValue="" /></label>
      <label>Stock <input name="stock" defaultValue="1" /></label>
      <button type="submit">Save</button>
      {errors?.title && <p role="alert">{errors.title}</p>}
      {errors?.price && <p role="alert">{errors.price}</p>}
    </Form>
  );
}
```

The real `ProductForm` is a modal with validation of its own. Testing the
action through it would test both, and tell you nothing about which one
failed. **The action's contract is `FormData` in, either field errors or a
redirect out** — so write the smallest form that can state it.

```tsx
it('RETURNS field errors for an invalid draft — the form stays open', async () => {
  const { user } = render();
  await user.click(await screen.findByRole('button', { name: 'Save' }));

  const alerts = await screen.findAllByRole('alert');
  expect(alerts.map((node) => node.textContent)).toEqual(['Give it a name of at least 2 characters.', 'Price must be more than zero.']);
  // Returned, not thrown, and not redirected: the user is still on the form.
  expect(screen.getByTestId('location')).toHaveTextContent('/products?page=2');
});
```

The success case fills the three fields, submits, and asserts that the
location is now `/products?page=2&flash=…` — `page=2` survived, `flash` was
added. Parse the flash with `URLSearchParams` rather than matching the raw
string: a search param is percent-encoded and `+` is a space.

`LocationDisplay` is four lines — `useLocation()` rendered into an `<output>`
— and it is how you assert on a redirect without a browser:

```tsx
function LocationDisplay() {
  const { pathname, search } = useLocation();
  return <output data-testid="location">{pathname + search}</output>;
}
```

(That is a legitimate `data-testid`: it identifies a test instrument, not a
piece of product UI.)

The third action test is the one that matters most and takes two lines:
`tokenStore.set({ user: { …ADMIN_USER, role: 'user' } })`, submit, and expect
the boundary to say *"Only admins can change the catalogue."* Hidden buttons
are UX; this is the check that is actually a check.

**C. The middleware**

```tsx
const Stub = createRoutesStub([
  {
    path: '/',
    Component: () => (<><LocationDisplay /><Outlet /></>),
    children: [
      { path: 'login', Component: () => <h1>Sign in</h1> },
      { path: 'account', middleware: [authMiddleware], Component: () => <h1>Your account</h1>, loader: () => ({}) },
    ],
  },
]);

it('redirects a signed-out visitor to /login, remembering where they were going', async () => {
  render();
  expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  expect(screen.getByTestId('location')).toHaveTextContent('/login?redirectTo=%2Faccount');
});
```

Then the three other branches: a signed-in visitor passes; a visitor with a
token but no cached profile causes exactly one `GET /auth/me` whose answer is
stored; and a dead session — `/auth/me` 401s *and* the refresh fails — lands
on `/login?expired=1` with the token store cleared. That last one exercises
Lab 4's interceptor chain and this lab's middleware in a single render, which
is the point of testing at this level at all.

### Verify

```bash
npm test -- src/routes/routes
```

```
 ✓ src/routes/routes.test.tsx (10 tests) 680ms
```

### Watch out

- **`You cannot render a <Router> inside another <Router>`** — you passed the
  stub to `renderWithProviders` without `withRouter: false`.
- **`useRouteLoaderData('root')` returning `undefined`** — the stub's root
  route has no `id: 'root'`, or no loader. The page then reads
  `rootData?.user?.role` as `undefined`, silently loses its admin buttons, and
  your test fails somewhere that looks unrelated.
- **A loader test that passes the first time and fails the second** —
  `queryClient.clear()` is missing, and `ensureQueryData` served the previous
  test's cached value.
- **Middleware that never runs.** It only runs for routes that have a loader
  or an action beneath them; a `Component`-only child route will not trigger
  it. That is why the stub above gives `/account` a `loader: () => ({})`.

### In the real world

Route-level tests are where "did anyone break auth?" gets answered. They are
also the tests most worth writing *before* the refactor rather than after: a
routing change is exactly the kind of work where every individual file still
compiles and the application no longer functions.

---

## Lab 6 — One E2E journey (25 min)

### Problem

Ninety-five tests, and none of them has ever loaded `dist/`. None has run the
minified bundle, the production env file, the React Compiler's output, the
real DummyJSON API or a browser's own event loop. There is exactly one path
through this app where a failure is a lost sale. That path deserves the
expensive test.

### Concept

**What deserves E2E: the handful of journeys, not the features.** An E2E test
costs a browser download, a build, a server and thirty seconds, and it fails
for reasons that are not always your code. So the rule is severe — write one
per *critical journey*, never one per feature:

| Worth a Playwright test | Not worth one |
|---|---|
| sign in → add to cart → check out | the discount badge renders |
| the payment step | the wishlist toggles |
| sign-up, once | every validation message |

Everything in the right-hand column is cheaper, faster and more precise one
level down — and you wrote most of it this morning.

**Flakiness has one main cause, and it has a name.** `await expect(locator)`
**retries** until it passes or times out; `expect(await locator…)` samples
once. The same applies to locators themselves: Playwright's are lazy and
auto-wait, so `page.getByRole(...)` is resolved at the moment you act on it,
not when you wrote it. Almost every flaky suite is `waitForTimeout(1000)`
standing in for an assertion that should have retried.

**And the queries are the same ones.** `getByRole`, `getByLabel`,
`getByText` — Playwright deliberately borrowed Testing Library's priority
order, so the habits from Lab 2 transfer whole, and a CSS selector like
`.btn-primary` is as bad an idea here as it was there.

### Steps

**A. `playwright.config.ts` — a new file at the project root**

```ts
const PORT = 4173;

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry', // ~1 MB, and useless when green
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Playwright builds and serves the app itself, so `npm run test:e2e` is one
  // command on a laptop and the same one command in CI.
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

`npm run preview`, not `npm run dev`, and the difference is the whole point of
the layer: `preview` serves `dist/`, which is what you deploy. It is also
where the mock price feed *disappears* — `mockPriceFeed()` in `vite.config.ts`
is `apply: 'serve'`, so the ticker degrades to polling in this run, exactly as
it does in production. Point Playwright at the dev server and you are testing
something no user will ever load.

**B. `e2e/checkout.spec.ts` — a new file**

```ts
test('a signed-in shopper can add a product and place an order', async ({ page }) => {
  await page.goto('/login?redirectTo=/products');
  await page.getByLabel('Username').fill('emilys');
  await page.getByLabel('Password').fill('emilyspass');
  await page.getByRole('button', { name: 'Sign in' }).click();

  // `await expect(...)` RETRIES. `expect(await ...)` samples once and is the
  // single biggest source of flaky Playwright suites.
  await expect(page).toHaveURL(/\/products/);
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();

  await page.getByRole('button', { name: 'Add to cart' }).first().click();
  const drawer = page.getByRole('dialog', { name: /Your cart/i });
  await expect(drawer).toBeVisible();

  await drawer.getByRole('button', { name: 'Increase quantity' }).click();
  await drawer.getByRole('button', { name: 'Checkout' }).click();

  // The fetcher posted to /account/checkout, the action called the API, and
  // the drawer reported the cart the server created.
  await expect(drawer.getByText(/Order placed — cart #/)).toBeVisible();
  await expect(drawer.getByText(/2 items/)).toBeVisible();
});
```

A second test, four lines long, is the negative of the first: a signed-out
visitor gets *"Sign in to check out"* and no Checkout button at all.

DummyJSON **simulates** writes: `POST /carts/add` returns a real, correct cart
and persists nothing. The journey is still real — request, response,
rendering — and the assertion is written against what the API actually
returns, which is the only honest thing to assert on.

**C. The scripts**

```jsonc
"test:coverage": "vitest run --coverage",
"test:e2e": "playwright test"
```

And `vitest.config.ts` already has `exclude: ['e2e/**']`, which is what stops
Vitest from picking up `@playwright/test`'s `test()` and producing a failure
in a file you were not thinking about.

### Verify

> **This E2E test is written here but not run here.** Playwright's Chromium
> binary is not installed in this repository and this guide does not install
> it. One command does both:
>
> ```bash
> npx playwright install chromium && npm run test:e2e
> ```
>
> Expect roughly 30–40 seconds: a production build, a preview server, a
> browser launch and two journeys against the live DummyJSON API. If you skip
> it, read the spec and the config — the reasoning is the examinable part.

Everything else, you can and should run:

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

```
 Test Files  9 passed (9)
      Tests  95 passed (95)
✓ built in 1.07s
```

**That line is the gate.** Four commands, in that order, cheapest first, each
one failing fast:

| Step | Catches | Seconds |
|---|---|---|
| `typecheck` | shapes | ~2 |
| `lint` | hazards and dead code | ~3 |
| `test` | behaviour | ~2 |
| `build` | anything the bundler dislikes | ~2 |
| *(then)* `check:bundle` | a budget regression | <1 |
| *(then)* `test:e2e` | the journey | ~35 |

Demo 22 pastes exactly this into `.github/workflows/ci.yml` and runs it on
every pull request. Nothing about it changes there — which is the argument
for getting the order right now, on a laptop, where a mistake costs five
seconds rather than a queue.

One last thing before you trust `npm run test:coverage`: **coverage is a
signal, not a target.** 100% line coverage proves every line ran, not that
any of them was correct — a test with no assertions scores full marks. Read
it for the *shape* of the gaps: an untested `catch` block is worth a
conversation, an untested `formatTime` is not.

### Watch out

- **`browserType.launch: Executable doesn't exist`** — the browser binary is
  missing. `npx playwright install chromium`.
- **`Error: Timed out waiting 120000ms from config.webServer`** — the build
  failed, or port 4173 is already taken by something that is not this app.
  Run `npm run build && npm run preview` by hand and read the output.
- **Vitest trying to run the spec** — `exclude: ['e2e/**']` is missing, and
  the error (`expected test() to be called inside a suite`) will not mention
  Playwright at all.
- **`page.waitForTimeout(1000)` creeping in.** Every one is an assertion that
  should have retried. Delete it and use `await expect(…)`.
- **Testing DummyJSON.** If a test fails because a third-party API is slow it
  was not a good E2E test. Assert on *your* behaviour — the order was placed,
  the drawer said so — never on their data.

### In the real world

Teams converge on five to fifteen E2E tests for an application this size, run
on a schedule as well as on pull requests — they are the only thing that
notices when an API contract changes underneath you. The failure mode is
rebuilding the unit suite in Playwright: two hundred browser tests that take
forty minutes, fail twice a week for environmental reasons, and get switched
off within a quarter.

---

## Wrap-up — what you can now do

- [x] Configure Vitest on top of an existing Vite project — jsdom, globals, a
      setup file, `test.env` for a project that validates its configuration,
      and an `exclude` that keeps Playwright out
- [x] Explain the testing trophy, and say which layer a given bug belongs to
- [x] Query the DOM the way a user finds things — `getByRole` first — and say
      why that ordering is also an accessibility check; choose between
      `getBy`, `queryBy` and `findBy` without guessing
- [x] Drive a component with `userEvent` and explain, in one sentence about
      disabled buttons, why `fireEvent` is not good enough
- [x] Test pure functions, reducers and a Zustand store with no `render` at
      all, and control time with fake timers without deadlocking the run
- [x] Mock the **network** with MSW rather than your own modules, drive a
      screen through all four data states, and test an interceptor chain end
      to end — six concurrent 401s, one refresh
- [x] Test loaders, actions and middleware with `createRoutesStub`, and know
      which `QueryClient` each of them reaches
- [x] Write one Playwright journey against a real build, say what makes a
      browser test flaky, and run the gate — typecheck → lint → test → build

## Next demo

**Demo 21 — React 19 Actions, Suspense & Server Components.** Three ways to
submit a form now live in this codebase — react-hook-form (Demo 4), a router
action (Demo 10) and, from tomorrow, `<form action>` with `useActionState`.
You will build the third, add `useFormStatus` and `useOptimistic`, stream a
slow section of the product page with `<Suspense>` and `use(promise)`, and
then step outside Vite entirely to render ShopScope's product list as an
async Server Component in Next.js — with one `'use client'` island and a
bundle comparison side by side. The tests you wrote today are how you will
know the rewrite did not change the behaviour.

---

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `Error: [config] Missing required env var VITE_API_BASE_URL` | Vitest does not read `.env.development`. Add `env: { VITE_API_BASE_URL: 'https://dummyjson.com', VITE_PAGE_SIZE: '12' }` **inside** the `test` block of `vitest.config.ts`. |
| `expect(...).toBeInTheDocument is not a function` | The setup file is missing from `setupFiles`, or you imported `@testing-library/jest-dom` without the `/vitest` suffix. |
| `ReferenceError: document is not defined` | `environment: 'jsdom'` is missing. Vitest's default environment is Node. |
| `TypeError: window.matchMedia is not a function` | `ThemeProvider` subscribes to `prefers-color-scheme`. Stub it in `src/test/setup.ts` with `vi.stubGlobal`, not in the test that happened to hit it. |
| `Unable to find an accessible element with the role "button" and name "…"` | Read the accessible tree RTL prints below the error. Usually an `aria-label` is overriding the visible text — a label always wins over content — or the role is `link`, not `button`. |
| `expect(screen.getByText('x')).toBeNull()` never passes | `getBy` throws before `expect` runs. Absence is `queryBy…` and only `queryBy…`. |
| `Vitest timed out in 5000ms` right after adding fake timers | `advanceTimersByTime` does not yield to the microtask queue. Use `await vi.advanceTimersByTimeAsync(…)`. |
| A green suite with an “Unhandled Rejection” panel | You advanced the clock before attaching `.rejects`. Build the assertion first, then advance the timers, then await it. |
| `[MSW] Error: intercepted a request without a matching handler` | Working as configured (`onUnhandledRequest: 'error'`). Add the handler the printed URL is asking for — or fix the URL the app just built. |
| `GET /products/categories` returns 404 in tests | `http.get('/products/:id')` is registered before it and matched `"categories"` as an id. MSW resolves handlers in registration order. |
| A test passes alone and fails in the suite | One of three: `server.resetHandlers()` missing from `afterEach`, `queryClient.clear()` missing from a loader test's `beforeEach`, or a Zustand store not reset with `setState` in `beforeEach`. |
| The error-state test takes four seconds | The app's `QueryClient` retries twice with backoff. `queryClient.setDefaultOptions({ queries: { retry: false } })` in `beforeAll` for route tests; `createTestQueryClient()` already does it for component tests. |
| `You cannot render a <Router> inside another <Router>` | `createRoutesStub` *is* a router. Pass `withRouter: false` to `renderWithProviders`. |
| `browserType.launch: Executable doesn't exist` | The Playwright browser is not installed. `npx playwright install chromium`, once. |
| Vitest tries to run `e2e/checkout.spec.ts` | `exclude: ['e2e/**']` is missing from the `test` block. The error will not mention Playwright. |
| `npm run test:coverage` asks to install something | `@vitest/coverage-v8` is not in the shared dependency set. Say yes to the prompt, or skip coverage — it is a signal, not a gate. |
