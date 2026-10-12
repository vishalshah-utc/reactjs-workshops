# Module 18 — Testing React Applications

**Study notes** · ~2.5 hours

> **Goal.** TypeScript checks the shape; only a test checks the behaviour. This
> module teaches you to write the tests that survive a refactor — queries by
> role, interactions by `userEvent`, the network faked at the network layer —
> and, just as much, which tests *not* to write. Finish it able to say, for any
> bug, which layer of the trophy should have caught it.

**Prerequisites:** [Module 9 §4–7](../09-reducers-and-context/#4-reducers-must-be-pure)
(pure reducers), [Module 10 §8–10](../10-forms/#8-validation) (validation,
form accessibility), [Module 12 §5](../12-effects/#5-strict-modes-double-invoke)
and [§11](../12-effects/#11-data-fetching-in-an-effect),
[Module 13](../13-data-fetching-and-custom-hooks/) (custom hooks, TanStack
Query), [Module 14](../14-routing/) (loaders, actions).

---

## Contents

1. [What a test is](#1-what-a-test-is)
2. [The testing trophy, for a SPA](#2-the-testing-trophy-for-a-spa)
3. [What is worth testing](#3-what-is-worth-testing)
4. [The toolchain: Vitest on Vite](#4-the-toolchain-vitest-on-vite)
5. [Rendering and querying](#5-rendering-and-querying)
6. [`getBy` vs `queryBy` vs `findBy`](#6-getby-vs-queryby-vs-findby)
7. [User interaction](#7-user-interaction)
8. [Async assertions](#8-async-assertions)
9. [Pure logic first](#9-pure-logic-first)
10. [Components with props and state](#10-components-with-props-and-state)
11. [Mocking the network with MSW](#11-mocking-the-network-with-msw)
12. [The four data states](#12-the-four-data-states)
13. [Testing hooks](#13-testing-hooks)
14. [Testing routes with `createRoutesStub`](#14-testing-routes-with-createroutesstub)
15. [Testing forms and validation](#15-testing-forms-and-validation)
16. [What not to mock](#16-what-not-to-mock)
17. [Snapshots, and why the track avoids them](#17-snapshots-and-why-the-track-avoids-them)
18. [Accessibility in tests](#18-accessibility-in-tests)
19. [One end-to-end journey with Playwright](#19-one-end-to-end-journey-with-playwright)
20. [Coverage and the CI gate](#20-coverage-and-the-ci-gate)
21. [Flaky-test hygiene](#21-flaky-test-hygiene)
22. [Self-check](#22-self-check)
23. [References](#23-references)

**Hands-on.** This module is the theory behind
[Demo 20 — Testing React Applications](../../demos/20-testing/), which wires
Vitest, Testing Library, MSW and Playwright into ShopScope and writes
ninety-five tests against the code the earlier demos built. Sections a lab
implements end with a **→ In the demos** line.

---

## 1. What a test is

A test is **a small program that runs your program and complains when the
answer is wrong**. It imports something, calls it with an input you chose,
and compares the result with what you expected. A mismatch throws, the
process exits non-zero and prints the difference; a match says nothing.

```ts
import { describe, expect, it } from 'vitest';
import { subtotal } from './cartMath';

describe('subtotal', () => {
  it('multiplies quantity by price for every line', () => {
    const lines = [{ productId: 1, title: 'Mascara', price: 10, thumbnail: '', qty: 3 }];
    expect(subtotal(lines)).toBe(30);
  });
});
```

`describe` groups; `it` is one case whose body fails if it throws;
`expect(actual)` plus a **matcher** is the claim. Inside the body: **arrange**
the world, **act** once, **assert**.

Two habits. **One behaviour per `it`** — if the name needs an "and", it is
two tests. **Make every new test fail on purpose once** — break the code,
watch the red, put it back. A test that cannot fail is worse than no test: it
is green on a dashboard, buying confidence it has not earned.

What a suite buys you: the ability to change code without fear, a bug that
cannot come back, a feedback loop in milliseconds, and documentation that goes
red instead of stale. What it does not buy: proof of correctness, or an excuse
to skip review.

---

## 2. The testing trophy, for a SPA

The kinds of test are not a quality ranking. They are a statement about **how
much of the real system is running**, which decides what each can catch and
what it costs.

| Kind | How much is real | Catches | Misses | Cost |
|---|---|---|---|---|
| **Static** | nothing runs — `tsc`, `eslint` | shapes, typos, dead code | behaviour, entirely | free, already running |
| **Unit** | one function | rules, edge cases, off-by-ones | how the pieces are joined | microseconds; never flaky |
| **Integration** | several real units, a real DOM, only the network faked | **wiring** — where users' bugs live | contract drift with the real server | 10–300 ms; stable if you `await` |
| **End-to-end** | the built app, a real browser, the real API | routing, bundling, env, the journey | nothing — which is why it is slow | seconds to minutes; the flakiest thing you own |

Stacked by confidence-per-second you get the **trophy** rather than the old
pyramid: the widest band is integration. A React **component test** — one
component, a real DOM, real events — is a shape of integration test, and the
one you will write most.

```
          ┌───────────┐
          │    E2E    │   one journey per critical path
      ┌───┴───────────┴───┐
      │   INTEGRATION     │   the widest band: components + MSW
      └───┐           ┌───┘
          │   UNIT    │   reducers, validators, stores
      ┌───┴───────────┴───┐
      │      STATIC       │   tsc + eslint
      └───────────────────┘
```

Read it as a **budget**. You buy most of your confidence from the middle,
because that is where a renamed prop wired to the wrong handler lives — two
units each correct, joined wrongly, and `tsc` perfectly happy about it.

**→ In the demos:** Demo 20, cold open and Lab 1 (*The toolchain*).

---

## 3. What is worth testing

**Test behaviour and contracts, not implementation.** The module in one line.

You can write the test when you can finish this sentence without naming an
internal: *"a user (or a caller) should be able to ___ and see ___."* "A
signed-out visitor can click *Add to cart* and the count goes to 1" is a test.
"The `useState` should be `true`" is not.

| Assert on | Never assert on |
|---|---|
| what is rendered — its role and accessible name | internal state, a hook's return value |
| what happens after a click, keystroke or submit | that a prop was passed down |
| what a function returns, including edge cases | CSS classes, inline styles, DOM structure |
| what request went out, and what the UI did with each of the four answers | the number of renders |
| the bug you just fixed | a whole-component snapshot |

The test for the test: **would it survive a refactor that changed no
behaviour?** Replace React Bootstrap with Tailwind, rename every prop, move
state into a reducer — a good suite stays green. One that goes red was not
protecting you; it was taxing you.

Name the **system under test** before you write a line. It settles what you
may fake (anything outside the boundary) and what you must not (anything
inside it) — [§16](#16-what-not-to-mock).

📖 [react.dev — Keeping Components Pure](https://react.dev/learn/keeping-components-pure) — pure components are the easy ones to test

---

## 4. The toolchain: Vitest on Vite

Seven names, one job each. Only the runner competes with anything.

| Layer | Package | Job |
|---|---|---|
| Runner | `vitest` 5.0 | finds `*.test.ts(x)`, transforms it through Vite, runs, reports, watches |
| DOM | `jsdom` 30 | a `document` and `window` in Node — no layout, no paint |
| Rendering | `@testing-library/react` 16.3 | `render`, `screen`, `renderHook` |
| Interaction | `@testing-library/user-event` 14.6 | simulates a *person*, not an event |
| Matchers | `@testing-library/jest-dom` 7.0 | `toBeDisabled()`, `toBeInTheDocument()`, `toHaveAccessibleName()` |
| Network | `msw` 2.15 | intercepts at the network layer, answers with your fixtures |
| E2E | `@playwright/test` 1.63 | drives a real Chromium against the real build |

Vitest rather than Jest, in a Vite project, for one reason that matters: the
test config **extends the build config**, so the code under test goes through
the same plugins as the shipped bundle. Jest is still right for anything not
on Vite; the API is nearly identical (`vi.fn()` for `jest.fn()`), and Testing
Library, MSW and Playwright are runner-agnostic.

### `vitest.config.ts`

```ts
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',                     // render() needs document
      globals: true,                            // describe/it/expect without imports
      setupFiles: ['./src/test/setup.ts'],      // once per test file, first
      env: { VITE_API_BASE_URL: 'https://dummyjson.com', VITE_PAGE_SIZE: '12' },
      include: ['src/**/*.test.{ts,tsx}'],
      exclude: ['node_modules/**', 'dist/**', 'e2e/**'],
      restoreMocks: true,
    },
  }),
);
```

`defineConfig` comes from `vitest/config`, not `vite` — same function, wider
type. `test.env` exists because Vitest is not the dev server and does not read
`.env.development`; a project that validates its env on import fails in every
file otherwise. `exclude: ['e2e/**']` keeps Playwright's `test()` out of a
runner that does not understand it.

### The setup file

```ts
// src/test/setup.ts
import '@testing-library/jest-dom/vitest';          // the /vitest suffix is load-bearing
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { server } from './msw/server';

beforeAll(() => {
  // jsdom implements the DOM and none of the observers.
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: false, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  class NoopObserver { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } }
  vi.stubGlobal('IntersectionObserver', NoopObserver);
  vi.stubGlobal('ResizeObserver', NoopObserver);
  Element.prototype.scrollIntoView = vi.fn();
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  cleanup();                 // unmount — or test 1's effects run during test 2
  server.resetHandlers();    // undo this test's server.use(…)
  localStorage.clear();
});

afterAll(() => server.close());
```

Import `@testing-library/jest-dom/vitest`, **with the suffix**. The bare entry
registers its matchers on Jest's `expect`; yours stays matcher-less and you get
`toBeInTheDocument is not a function` with no hint why. Every jsdom gap
belongs here, stubbed once — not in whichever test happened to hit it first.

### One `render` for the whole project

```tsx
// src/test/utils.tsx
export function renderWithProviders(ui: ReactElement, { route = '/', client = createTestQueryClient(), withRouter = true }: ProvidersOptions = {}) {
  const Providers = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <ToastProvider>{withRouter ? <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter> : children}</ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
  return { user: userEvent.setup(), client, ...render(ui, { wrapper: Providers }) };
}
```

Three decisions live in there. A **fresh `QueryClient` per test** with
`retry: false` — the app's module-scope client is right for a browser tab and
wrong for two hundred tests sharing a cache. **`userEvent.setup()` before
render**, once per test. And **`withRouter`**, because a `createRoutesStub`
*is* a router and nesting two is an error.

📖 [Vitest — Configuring Vitest](https://vitest.dev/config/) ·
[Testing Library — Setup (custom render)](https://testing-library.com/docs/react-testing-library/setup/)

**→ In the demos:** Demo 20, Lab 1 (*The toolchain*).

---

## 5. Rendering and querying

`render(ui)` mounts into `document.body`; `screen` queries the whole document.
Use `screen` rather than the queries `render` returns: a modal, a drawer or a
toast rendered through a portal is *outside* the container and invisible to
container-scoped queries. `within(element)` scopes a query to one subtree —
"the Checkout button *inside the drawer*":

```tsx
renderWithProviders(<ProductCard product={makeProduct({ title: 'Essence Mascara' })} />);
screen.getByRole('link', { name: 'Essence Mascara' });

const alert = await screen.findByRole('alert');
expect(within(alert).getByText('Server is on fire')).toBeInTheDocument();
```

### The query priority — and why it is an accessibility check

| Rank | Query | Finds by | Use when |
|---|---|---|---|
| 1 | `getByRole(role, { name })` | the accessibility tree | almost always |
| 2 | `getByLabelText` | a form label | form fields |
| 3 | `getByPlaceholderText` | a placeholder | there is genuinely no label |
| 4 | `getByText` | visible text | non-interactive content |
| 5 | `getByDisplayValue`, `getByAltText`, `getByTitle` | attributes | the rare rest |
| 6 | `getByTestId` | `data-testid` | nothing above worked — and say why |

The order ranks how close each query is to how a *person* finds the thing.
`getByRole('button', { name: 'Save Essence Mascara to wishlist' })` passes
only if that button is reachable and announced with that name — so **a suite
written in roles is a partial accessibility audit that runs on every commit**.
Reach for `getByTestId` and you have opted out of it.

When a role query fails, RTL prints the accessible tree under the error. Read
it: usually the name is right and the role is wrong, or an `aria-label` has
overridden the visible text — a label always wins over content.
`screen.debug()` prints the DOM; `screen.logTestingPlaygroundURL()` suggests
the best query for any element.

📖 [Testing Library — About Queries (priority)](https://testing-library.com/docs/queries/about/#priority) ·
[`ByRole`](https://testing-library.com/docs/queries/byrole/)

**→ In the demos:** Demo 20, Lab 2 (*Testing a component*).

---

## 6. `getBy` vs `queryBy` vs `findBy`

| Family | Returns | On no match | The question |
|---|---|---|---|
| `getBy…` | the element | **throws** | "this is here *now*" |
| `queryBy…` | the element or **`null`** | returns `null` | "this is *not* here" |
| `findBy…` | a `Promise` of the element | rejects after 1 s | "this *will* be here" |

Each has an `AllBy` form returning an array. Only `queryBy` can return `null`,
which makes it the only way to assert absence:

```tsx
expect(screen.queryByText(/% off/)).toBeNull();     // ✓
expect(screen.getByText(/% off/)).toBeNull();       // ✗ getBy throws before expect runs
```

And `getBy` is the right choice for "on screen on the *first* render":

```tsx
renderProducts();
expect(screen.getByText('Loading ShopScope…')).toBeInTheDocument();                         // must be there already
expect(await screen.findByRole('heading', { name: 'All products' })).toBeInTheDocument();  // arrives later
```

A `findBy` for the loading state would pass even if it appeared a tick late —
which is not what a skeleton is for.

---

## 7. User interaction

`fireEvent.click(el)` dispatches one DOM event at a node. `await user.click(el)`
does what a pointer does: checks the element is visible and not disabled,
then fires `pointerdown`, `mousedown`, `focus`, `pointerup`, `mouseup`, `click`
in order. In one sentence: **`fireEvent` will happily "click" a disabled
button**, so a test written with it passes against a button that does nothing
in a browser.

```tsx
const { user } = renderWithProviders(<ProductCard product={makeProduct({ stock: 0 })} onAddToCart={onAddToCart} />);

const button = screen.getByRole('button', { name: 'Sold out' });
expect(button).toBeDisabled();
await user.click(button);                       // refused, as a pointer would be
expect(onAddToCart).not.toHaveBeenCalled();
```

The `user-event` 14 vocabulary — every call is `async`:

```tsx
await user.click(el);
await user.type(input, 'mascara');              // keystroke by keystroke, with focus
await user.clear(input);
await user.keyboard('{Enter}');                 // '{Escape}', '{ArrowDown}'
await user.tab();                               // then expect(el).toHaveFocus()
await user.selectOptions(select, 'beauty');
await user.upload(fileInput, new File(['x'], 'avatar.png', { type: 'image/png' }));
```

Call `userEvent.setup()` once per test, before `render`, and reuse the
session — it tracks held keys and pointer position. The commonest bug in a
component test is a missing `await` on a `user.*` call: the assertion runs
before React has re-rendered and the failure looks like a product bug. The
`testing-library/await-async-events` ESLint rule catches it.

📖 [Testing Library — user-event](https://testing-library.com/docs/user-event/intro/) ·
[`setup()`](https://testing-library.com/docs/user-event/setup/)

**→ In the demos:** Demo 20, Lab 2 (*Testing a component*), step D.

---

## 8. Async assertions

Anything that arrives after a promise — a fetch, a transition, a debounce —
needs an assertion that **waits**. Never a fixed sleep.

```tsx
// ✗ passes on your laptop, fails in CI, slow everywhere
await new Promise((r) => setTimeout(r, 500));
expect(screen.getByText('24 products')).toBeInTheDocument();

// ✓ polls until it passes, or fails after the timeout
expect(await screen.findByText('24 products')).toBeInTheDocument();
```

`findBy…` is `getBy…` wrapped in `waitFor`. Use `waitFor` directly when the
assertion is not a query, and keep **one assertion** inside it — the callback
is retried as a whole, so side effects inside it run on every retry:

```tsx
await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
await waitForElementToBeRemoved(() => screen.queryByText('Loading ShopScope…'));   // was there, AND went away
```

The default timeout is one second. If a test needs more, something in the
arrangement is slow — the app's retry policy, almost always — and the fix is
`retry: false` on the test `QueryClient`, not a longer wait.

📖 [Testing Library — Async Methods](https://testing-library.com/docs/dom-testing-library/api-async/)

---

## 9. Pure logic first

The cheapest tests in the codebase have no `render` at all. A pure function is
`(input) => output`; its test is one call and one comparison, runs in
microseconds, and names a *rule* when it fails rather than a screen.

If logic is **hard** to test this way, it is telling you the rules are
entangled with the rendering. Testability is a design property, not a testing
technique — which is why [Module 9 §7](../09-reducers-and-context/#7-reducers-are-trivially-testable)
moved the cart rules into a reducer long before this module.

### Validators and formatters

```ts
const valid = { title: 'Mascara', price: 9.99, category: 'beauty', stock: 10, description: '' };

it('rejects the empty form on EVERY required field at once', () => {
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
])('rejects %s', (_name, patch, field) => {
  expect(validateProduct({ ...valid, ...patch })).toHaveProperty(field);
});
```

`it.each` turns six near-identical tests into a table whose failure output
still names the row. Test the boundaries that must *pass* too — title `'ab'`,
stock `0` — because that is what catches `<` written for `<=`. For anything
that has been through a percentage, `toBeCloseTo`, never `toBe`.

### Reducers

```ts
it('IGNORES a result that arrives when nothing is pending', () => {
  const idle: RequestStatus<string> = { status: 'idle' };
  expect(requestStatusReducer(idle, { type: 'succeed', data: 'late' })).toBe(idle);
});

it('never mutates the array it is given', () => {
  const lines = [line];
  cartLinesReducer(lines, { type: 'add', product: { ...product, id: 2 } });
  expect(lines).toHaveLength(1);
});
```

`toBe(idle)`, not `toEqual`: the claim is that the reducer returned *the same
object*, which is what tells React there is nothing to re-render. The
no-mutation test is [Module 9 §4](../09-reducers-and-context/#4-reducers-must-be-pure)
written down.

### Zustand stores outside React

A store hook is a *binding*; underneath it is an object with `getState()`,
`setState()` and `subscribe()`, and everything can be tested through them.

```ts
beforeEach(() => useWishlistStore.setState({ ids: [] }));   // the module singleton, reset

it('toggles an id in and out, and persists under its own key', () => {
  useWishlistStore.getState().toggle(7);
  expect(selectIsSaved(7)(useWishlistStore.getState())).toBe(true);
  expect(JSON.parse(localStorage.getItem('shopscope.wishlist')!).state.ids).toEqual([7]);

  useWishlistStore.getState().toggle(7);
  expect(selectWishlistCount(useWishlistStore.getState())).toBe(0);
});
```

A module-scope store is shared by every test in the file, hence the
`beforeEach`. A partial `setState` **merges**; `setState(…, true)` replaces,
and deletes the actions along with the data.

### Time

Anything that sleeps — retry with backoff, a debounce, a toast timeout — runs
under fake timers, so a four-second policy proves itself in no time:

```ts
afterEach(() => vi.useRealTimers());

it('retries a 503 and returns the eventual success', async () => {
  vi.useFakeTimers();
  const fn = vi.fn().mockRejectedValueOnce(httpError(503)).mockResolvedValue('ok');

  const promise = withRetry(fn, { attempts: 3, baseDelayMs: 400 });
  await vi.advanceTimersByTimeAsync(5_000);     // the async form lets awaited promises settle
  await expect(promise).resolves.toBe('ok');
  expect(fn).toHaveBeenCalledTimes(2);
});
```

`advanceTimersByTimeAsync`, not `advanceTimersByTime`: the sync version never
yields to the microtask queue, the `await` inside the code under test never
resumes, and the test hangs. For the give-up case, attach `.rejects` *before*
advancing the clock, or the promise rejects with nobody listening and Node
reports an unhandled rejection under a green run.

📖 [Vitest — `vi` (timers, mocks)](https://vitest.dev/api/vi.html) ·
[`test.each`](https://vitest.dev/api/#test-each) ·
[react.dev — Extracting State Logic into a Reducer](https://react.dev/learn/extracting-state-logic-into-a-reducer)

**→ In the demos:** Demo 20, Lab 3 (*Testing pure logic*) — validation,
retry, three reducers, the cart store, the cache keys.

---

## 10. Components with props and state

A component test is a contract test: given these props, this is what a user
sees and can do. Factories keep the arrangement honest —
`makeProduct({ stock: 0 })` reads as "an out-of-stock product" and never
shares a mutable object between tests.

```tsx
describe('ProductCard', () => {
  it('renders the title, the sale price and the list price it replaced', () => {
    renderWithProviders(<ProductCard product={makeProduct({ title: 'Essence Mascara', price: 100, discountPercentage: 15 })} />);

    expect(screen.getByRole('link', { name: 'Essence Mascara' })).toHaveAttribute('href', '/products/1');
    expect(screen.getByText('$85.00')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
  });

  it('reports a wishlist toggle with the id, and says whether it is saved', async () => {
    const onToggleSave = vi.fn();
    const { user } = renderWithProviders(<ProductCard product={makeProduct({ id: 7, title: 'Powder' })} onToggleSave={onToggleSave} />);

    const save = screen.getByRole('button', { name: 'Save Powder to wishlist' });
    expect(save).toHaveAttribute('aria-pressed', 'false');
    await user.click(save);
    expect(onToggleSave).toHaveBeenCalledExactlyOnceWith(7);
  });

  it('calls the add-to-cart handler exactly once, with the whole product', async () => {
    const onAddToCart = vi.fn();
    const product = makeProduct({ id: 3, stock: 5 });
    const { user } = renderWithProviders(<ProductCard product={product} onAddToCart={onAddToCart} />);

    await user.click(screen.getByRole('button', { name: 'Add to cart' }));
    expect(onAddToCart).toHaveBeenCalledExactlyOnceWith(product);
  });
});
```

`toHaveBeenCalledExactlyOnceWith` does two jobs. "With the product" is the
renamed-prop bug. "Exactly once" is the other bug of this shape — a handler
attached twice, a button inside a form that also submits — which
`toHaveBeenCalled()` waves through.

### State across one mount: `rerender`

```tsx
const { rerender } = renderWithProviders(<ProductCard product={product} />);
expect(screen.queryByRole('button', { name: 'Delete Red Lipstick' })).toBeNull();

rerender(<ProductCard product={product} onEdit={vi.fn()} onDelete={vi.fn()} />);
expect(screen.getByRole('button', { name: 'Delete Red Lipstick' })).toBeInTheDocument();
```

`rerender` re-renders the same instance with new props — the tool for "what
changes when a prop changes". A component with internal state is tested the
same way as one without: through what the user does and then sees. A
component that reads context gets it from the wrapper; if a test needs a
specific value, render a provider in the test rather than mocking the hook.

Notice what is *not* in any of these tests: the word `props`, the word
`state`, a class name, the library the button came from, or a snapshot.
Replace React Bootstrap tomorrow and every one still passes.

📖 [Testing Library — React Testing Library API](https://testing-library.com/docs/react-testing-library/api/) ·
[jest-dom matchers](https://testing-library.com/docs/ecosystem-jest-dom/)

**→ In the demos:** Demo 20, Lab 2 (*Testing a component*).

---

## 11. Mocking the network with MSW

**Mock the network, never your own code.** The tempting shortcut —
`vi.mock('../api/services/products')` — deletes the axios instance, the
interceptors, the `ApiError` normaliser, the retry policy and the query cache
from the test. That is everything that could plausibly be wrong, leaving only
the component, which was probably fine.

MSW intercepts one level lower: in Node it patches the HTTP layer, so it
catches whatever the code actually uses — axios, `fetch`, both — and nothing
in `src/` knows it is there.

| You mock… | What still runs | What you are really testing |
|---|---|---|
| the service module | the component | that you called your own mock |
| `fetch` / `axios` by hand | interceptors, sometimes | a hand-written protocol emulator |
| **the network (MSW)** | **everything in `src/`** | **the app** |

### Handlers: the default world

```ts
// src/test/msw/handlers.ts
import { http, HttpResponse } from 'msw';
import { CATALOGUE, CATEGORIES } from '../fixtures';

const API = 'https://dummyjson.com';

export const handlers = [
  // Specific paths BEFORE /products/:id, or "categories" matches as an id.
  http.get(`${API}/products/search`, ({ request }) => page(matching(request), new URL(request.url))),
  http.get(`${API}/products/categories`, () => HttpResponse.json(CATEGORIES)),
  http.get(`${API}/products/:id`, ({ params }) => {
    const product = CATALOGUE.find((p) => String(p.id) === params.id);
    return product ? HttpResponse.json(product) : HttpResponse.json({ message: `Product with id '${params.id}' not found` }, { status: 404 });
  }),
  http.get(`${API}/products`, ({ request }) => page(CATALOGUE, new URL(request.url))),
];
```

A handler should behave like the real API, **including the inconvenient
parts** — `limit`, `skip`, `select=`, the 404 body. A mock more generous than
the server hides bugs rather than catching them.

```ts
// src/test/msw/server.ts
import { setupServer } from 'msw/node';          // msw/node, not msw
import { handlers } from './handlers';
export const server = setupServer(...handlers);
```

The lifecycle lives in the setup file ([§4](#4-the-toolchain-vitest-on-vite)):
`listen` once, `resetHandlers` after each test, `close` at the end.
`onUnhandledRequest: 'error'` is not optional: without it a request nobody
mocked goes to the real internet, and the suite becomes slow, flaky and
dependent on a third party being up.

### Overriding per test

```ts
import { delay, http, HttpResponse } from 'msw';

server.use(http.get(`${API}/products`, () => HttpResponse.json({ message: 'Server is on fire' }, { status: 500 })));
server.use(http.get(`${API}/products`, () => HttpResponse.error()));                 // a dead connection
server.use(http.get(`${API}/products`, async () => { await delay('infinite'); }));   // never answers
server.use(http.get(`${API}/products/:id`, () => HttpResponse.json({}, { status: 401 }), { once: true }));
```

Runtime handlers are prepended, so they win; `resetHandlers()` removes them.
`{ once: true }` answers one request and then falls through to the default —
exactly what "401 once, then succeed" needs.

### The refresh queue

The piece of ShopScope most likely to be subtly wrong and least likely to be
noticed: six requests in flight when the token expires must produce *one*
refresh. A handler that 401s until it is shown the new token, a
`/auth/refresh` that counts its own calls, then the question the code exists
to answer:

```ts
it('refreshes ONCE for six concurrent 401s and replays all six', async () => {
  tokenStore.set({ accessToken: 'access-1', refreshToken: 'refresh-1' });
  let refreshCalls = 0;
  let productCalls = 0;
  server.use(
    http.get(`${API}/products/:id`, ({ request, params }) => {
      productCalls++;
      if (request.headers.get('Authorization') !== 'Bearer access-2') return HttpResponse.json({ message: 'Token expired' }, { status: 401 });
      return HttpResponse.json(makeProduct({ id: Number(params.id) }));
    }),
    http.post(`${API}/auth/refresh`, () => {
      refreshCalls++;
      return HttpResponse.json({ accessToken: 'access-2', refreshToken: 'refresh-2' });
    }),
  );

  const results = await Promise.all([1, 2, 3, 4, 5, 6].map((id) => getProduct(id)));

  expect(refreshCalls).toBe(1);
  expect(productCalls).toBe(12);                   // six 401s, six replays
  expect(results.map((p) => p.id)).toEqual([1, 2, 3, 4, 5, 6]);
});
```

Nothing in `src/` is mocked. The real axios instance, the real interceptor
chain and the real token store ran; only the wire was faked.

📖 [MSW — Philosophy](https://mswjs.io/docs/philosophy) ·
[Node.js integration](https://mswjs.io/docs/integrations/node) ·
[`http`](https://mswjs.io/docs/api/http) · [`HttpResponse`](https://mswjs.io/docs/api/http-response) ·
[`server.use()`](https://mswjs.io/docs/api/setup-server/use)

**→ In the demos:** Demo 20, Lab 4 (*Mocking the network with MSW*) —
handlers, the server, and the refresh queue under six concurrent 401s.

---

## 12. The four data states

Every screen that fetches has four states, and teams routinely design two
([Module 6 §15](../06-conditional-rendering-and-lists/#15-the-four-states-of-any-data-driven-list)).
A handler override makes each a two-line arrangement — which is the argument
for MSW in one sentence: **the states you never test are the states you never
design.**

```tsx
it('shows the loading state, then the results', async () => {
  renderProducts();
  expect(screen.getByText('Loading ShopScope…')).toBeInTheDocument();                          // 1. loading
  await waitForElementToBeRemoved(() => screen.queryByText('Loading ShopScope…'));
  expect(await screen.findByRole('heading', { name: 'All products' })).toBeInTheDocument();   // 2. success
  expect(screen.getAllByRole('button', { name: /^(Add to cart|Sold out)$/ })).toHaveLength(12);
});

it('renders the EMPTY state when the search matches nothing', async () => {
  renderProducts('/products?q=nothing-matches-this');                                         // 3. empty
  expect(await screen.findByText('No products found')).toBeInTheDocument();
});

it('renders the ERROR state when the catalogue is down', async () => {
  server.use(http.get(`${API}/products`, () => HttpResponse.json({ message: 'Server is on fire' }, { status: 500 })));
  renderProducts();                                                                            // 4. error
  expect(within(await screen.findByRole('alert')).getByText('Server is on fire')).toBeInTheDocument();
});
```

The last assertion is worth a moment. The 500 travelled from MSW through
axios, the logging interceptor, the refresh interceptor (which ignored it),
the `ApiError` normaliser, out of the loader as a thrown error and into the
route's error boundary, which chose the backend's message over its generic
one. Six units, one assertion, no mocks. That is what the middle of the
trophy buys.

Empty is the state most apps forget. It is not an error and not a spinner
that never resolves — it is a *successful* response with nothing in it, and
it needs its own design and its own test.

**→ In the demos:** Demo 20, Lab 4 (*Mocking the network with MSW*), step C.

---

## 13. Testing hooks

**Prefer testing a hook through the component that uses it.** The hook's
return value is an implementation detail of that component; the user never
sees it. A test of `ProductsPage` already covers `useProductFilters`.

`renderHook` is for hooks that are genuinely standalone — a library-style
hook with several consumers, or one whose contract *is* its return value:

```tsx
import { act, renderHook } from '@testing-library/react';

it('tracks the browser going offline', () => {
  const { result } = renderHook(() => useOnlineStatus());
  expect(result.current).toBe(true);

  act(() => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    window.dispatchEvent(new Event('offline'));
  });
  expect(result.current).toBe(false);
});
```

`result.current` is always the latest return value. `act` wraps anything that
causes a state update *outside* an RTL helper — a dispatched event, a store
call — so React flushes before you assert. `render`, `user.*` and `waitFor`
already wrap themselves.

A data hook such as `useApi` needs the network and a `wrapper` option for
providers, and reads like a component test with the DOM removed:

```tsx
const { result } = renderHook(() => useApi((signal) => getProduct(1, { signal })), { wrapper: Providers });
expect(result.current.loading).toBe(true);
await waitFor(() => expect(result.current.loading).toBe(false));
expect(result.current.data?.title).toBe('Essence Mascara 1');
```

With `HttpResponse.error()` in a `server.use`, the same shape proves the error
branch and the `ApiError` the hook hands back.

**Do not mock the hook** to test the component, and do not mock the component
to test the hook. If a hook is hard to test through its component, its logic
wants to be a pure function ([§9](#9-pure-logic-first)).

📖 [react.dev — Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks) ·
[react.dev — `act`](https://react.dev/reference/react/act) ·
[Testing Library — `renderHook`](https://testing-library.com/docs/react-testing-library/api/#renderhook)

---

## 14. Testing routes with `createRoutesStub`

Loaders, actions and middleware are not components and not services, and all
three can be wrong on their own. There is no browser in a Vitest run and no
`<App />` worth mounting. There is `createRoutesStub`, exported from
`react-router` itself in v8.

It takes the same route objects `createBrowserRouter` takes — `path`,
`Component`, `loader`, `action`, `middleware`, `ErrorBoundary`,
`HydrateFallback`, `children` — and returns a component you render with
`initialEntries`. Inside it `useLoaderData`, `useActionData`, `useNavigation`
and `<Form>` all work, because it is a real router.

Keep what the code under test *reads*; leave out what it merely renders next
to. `ProductsPage` calls `useRouteLoaderData('root')`, so the root route needs
its `id` and a loader of the right shape — not the header, not the drawer.

### A loader

```tsx
import { createRoutesStub, Outlet } from 'react-router';

const Stub = createRoutesStub([
  {
    id: 'root',
    path: '/',
    Component: () => <Outlet />,
    loader: () => ({ user: null }),
    HydrateFallback: AppBootSplash,
    ErrorBoundary: RootErrorBoundary,
    children: [{ path: 'products/:productId', Component: ProductDetailPage, loader: productDetailLoader, ErrorBoundary: ProductErrorBoundary }],
  },
]);

const render = (url: string) => renderWithProviders(<Stub initialEntries={[url]} />, { withRouter: false, client: queryClient });
beforeEach(() => queryClient.clear());   // the loader imports the module-scope client

it('loads the product named by the URL param', async () => {
  render('/products/3');
  expect(await screen.findByRole('heading', { name: 'Essence Mascara 3' })).toBeInTheDocument();
});

it('turns a 404 into a not-found page, not a crash', async () => {
  render('/products/9999');
  expect(within(await screen.findByRole('alert')).getByText('No product with id 9999.')).toBeInTheDocument();
});
```

`withRouter: false`, because the stub is a router. `queryClient.clear()`,
because a loader has no hooks and imports the app's singleton — leave it out
and test 2 finds test 1's page cached and never touches the handler it just
installed.

### An action, through the smallest form that states its contract

The action's contract is `FormData` in, either field errors or a redirect out.
The real `ProductForm` is a modal with validation of its own; testing the
action through it tests both and tells you nothing about which failed. So:
a four-line `<Form method="post">` with the named inputs and
`{errors?.title && <p role="alert">{errors.title}</p>}`, plus one instrument:

```tsx
function LocationDisplay() {
  const { pathname, search } = useLocation();
  return <output data-testid="location">{pathname + search}</output>;
}
```

That is a legitimate `data-testid`: it identifies a test instrument, not
product UI, and it is how you assert on a redirect without a browser.

```tsx
it('RETURNS field errors for an invalid draft — the form stays open', async () => {
  const { user } = render('/products?page=2');
  await user.click(await screen.findByRole('button', { name: 'Save' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Give it a name of at least 2 characters.');
  expect(screen.getByTestId('location')).toHaveTextContent('/products?page=2');   // not redirected
});
```

The success case fills the fields, submits, and asserts the location is now
`/products?page=2&flash=…` — `page=2` survived, `flash` was added. The third
test sets a non-admin user in the token store and expects the boundary's
*"Only admins can change the catalogue."* Hidden buttons are UX; this is the
check that is actually a check.

### Middleware

```tsx
const Stub = createRoutesStub([
  {
    path: '/',
    Component: () => (<><LocationDisplay /><Outlet /></>),
    children: [
      { path: 'login', Component: () => <h1>Sign in</h1> },
      { path: 'account', middleware: [authMiddleware], loader: () => ({}), Component: () => <h1>Your account</h1> },
    ],
  },
]);

it('redirects a signed-out visitor to /login, remembering where they were going', async () => {
  renderWithProviders(<Stub initialEntries={['/account']} />, { withRouter: false });
  expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  expect(screen.getByTestId('location')).toHaveTextContent('/login?redirectTo=%2Faccount');
});
```

Middleware only runs for routes with a loader or action beneath them, which is
why the stub gives `/account` a `loader: () => ({})`. The dead-session branch —
`/auth/me` 401s *and* the refresh fails, landing on `/login?expired=1` —
exercises the interceptor chain and the middleware in a single render.

📖 [React Router — `createRoutesStub`](https://reactrouter.com/api/utils/createRoutesStub) ·
[Route Object](https://reactrouter.com/start/data/route-object) ·
[Middleware](https://reactrouter.com/how-to/middleware)

**→ In the demos:** Demo 20, Lab 5 (*Testing routes*).

---

## 15. Testing forms and validation

Two layers, two tests. The **rules** are pure and get the §9 treatment — per
field, as a table. The **form** is a component and is tested the way a user
fills it in: by label, by typing, by submitting, by reading the error.

```tsx
it('shows the password rule next to the field and keeps the submit disabled', async () => {
  const { user } = renderWithProviders(<SignupForm />);

  const password = screen.getByLabelText('Password');
  await user.type(password, 'short');
  await user.tab();                                         // blur triggers validation

  expect(password).toBeInvalid();
  expect(password).toHaveAccessibleDescription(/at least 8 characters/);
  expect(screen.getByRole('button', { name: 'Create account' })).toBeDisabled();
});
```

`getByLabelText` passes only if the `<label>` is actually associated with the
input — the single most common form accessibility bug
([Module 10 §10](../10-forms/#10-accessibility)). `toBeInvalid()` reads
`aria-invalid`; `toHaveAccessibleDescription` reads `aria-describedby`. A form
that passes these is a form a screen reader can use — the test and the
accessibility fix are the same work. For submission,
`toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ firstName: 'Emily' }))`
asserts what the user typed, not how the form stored it.

For a zod schema, test the **field**, not the whole form, so the test names
the rule it is about ([Module 10 §9](../10-forms/#9-schema-validation-with-zod)):

```ts
expect(signupSchema.shape.password.safeParse('short').error?.issues.map((i) => i.message))
  .toEqual(['Use at least 8 characters.', 'Include at least one number.']);

// '' type-checks — the schema allows it — and must still fail. This is what the .refine is for.
expect(signupSchema.shape.gender.safeParse('').success).toBe(false);
```

For a router `<Form>` posting to an action, the test is in
[§14](#14-testing-routes-with-createroutesstub): the stub, a submit, and the
returned errors or the redirected location.

**→ In the demos:** Demo 20, Lab 3 (*Testing pure logic*) step A for the
schema; Lab 5 step B for the action.

---

## 16. What not to mock

Fake only what is outside the boundary of the system under test. Concretely:

| Do not mock | Because | Instead |
|---|---|---|
| your own service modules | the interceptors, normaliser and retry stop running | MSW ([§11](#11-mocking-the-network-with-msw)) |
| your own components | you are testing a stub of your app | render the real child; it is cheap |
| your own hooks | the component's contract includes what the hook does | test through the component, or test the hook |
| `react-router` | the stub *is* the router | `createRoutesStub` ([§14](#14-testing-routes-with-createroutesstub)) |
| `@tanstack/react-query` | a fresh client is one line | `createTestQueryClient()` |
| Zustand | the store works outside React as-is | `setState` in `beforeEach` ([§9](#9-pure-logic-first)) |
| `localStorage` | jsdom has a real one | `localStorage.clear()` after each test |

What *is* legitimately faked: the wire (MSW), the clock (`vi.useFakeTimers`),
browser APIs jsdom lacks (`vi.stubGlobal`), and the callback props a component
reports through (`vi.fn()`). A `vi.fn()` passed as `onAddToCart` is not a mock
of your code — it is the caller, and the test is the caller.

`vi.mock('./module')` has a place: a third-party SDK that phones home, a
module that reads the file system, an analytics client. Each one is a
decision to stop testing that edge; make it out loud.

📖 [Vitest — Mocking](https://vitest.dev/guide/mocking.html)

---

## 17. Snapshots, and why the track avoids them

```tsx
expect(container).toMatchSnapshot();     // ✗ in this track
```

A snapshot serialises a rendered tree to a file and fails when the tree
changes. It is quick to write, it asserts everything, and that is the problem:
it asserts everything *equally*. A class rename, a reordered attribute and a
missing *Add to cart* button produce the same red, and after the third false
alarm the team learns to press `u` without reading the diff. At that point the
test is a ritual, not a check. Snapshots also fail the refactor test from
[§3](#3-what-is-worth-testing) by construction — they encode DOM structure,
which is exactly what a refactor changes.

Where they earn a place: a serialiser's output, an error message's exact
wording, a generated config — small, stable, reviewed as text:

```ts
expect(formatPrice(1234.5)).toMatchInlineSnapshot(`"$1,234.50"`);
```

For "does this still look right", the honest tool is a Playwright screenshot,
and the honest answer for most product UI is that it is not worth the noise.

📖 [Vitest — Snapshot](https://vitest.dev/guide/snapshot.html)

---

## 18. Accessibility in tests

Most of it you have already done. A suite written in `getByRole` and
`getByLabelText` fails when a button has no accessible name, a label is not
associated, a dialog is not a `dialog`, a live region is not `role="status"` —
on every commit, in milliseconds. Make the names assertions, not just queries:

```tsx
expect(save).toHaveAccessibleName('Save Powder to wishlist');
expect(screen.getByRole('status')).toHaveTextContent('24 products found');
await user.keyboard('{Escape}');
expect(screen.queryByRole('dialog')).toBeNull();
expect(trigger).toHaveFocus();                      // focus returned to the opener (Module 11)
```

Automated rule checking — `axe-core`, already in ShopScope's devDependencies —
catches roughly a third of real issues: contrast, missing alt text, duplicate
ids. Run it where there is a real layout, in Playwright via
`@axe-core/playwright`'s `AxeBuilder`, rather than in jsdom where colour and
geometry do not exist. The other two thirds is role-based querying, which you
get for free.

📖 [Playwright — Accessibility testing](https://playwright.dev/docs/accessibility-testing) ·
[Testing Library — Guiding Principles](https://testing-library.com/docs/guiding-principles/)

---

## 19. One end-to-end journey with Playwright

Ninety-five Vitest tests and none of them has loaded `dist/`. None ran the
minified bundle, the production env, the compiler's output, the real API or a
browser's event loop. There is exactly one path through a shop where a failure
is a lost sale. That path deserves the expensive test.

| Worth a Playwright test | Not worth one |
|---|---|
| sign in → add to cart → check out | the discount badge renders |
| the payment step | the wishlist toggles |
| sign-up, once | every validation message |

Everything on the right is cheaper, faster and more precise one level down.

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';
const PORT = 4173;

export default defineConfig({
  testDir: './e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  use: { baseURL: `http://localhost:${PORT}`, trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
});
```

`npm run preview`, not `npm run dev`: preview serves `dist/`, which is what
you deploy. Point Playwright at the dev server and you are testing something
no user will ever load.

```ts
// e2e/checkout.spec.ts
import { expect, test } from '@playwright/test';

test('a signed-in shopper can add a product and place an order', async ({ page }) => {
  await page.goto('/login?redirectTo=/products');
  await page.getByLabel('Username').fill('emilys');
  await page.getByLabel('Password').fill('emilyspass');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/products/);
  await page.getByRole('button', { name: 'Add to cart' }).first().click();

  const drawer = page.getByRole('dialog', { name: /Your cart/i });
  await expect(drawer).toBeVisible();
  await drawer.getByRole('button', { name: 'Checkout' }).click();
  await expect(drawer.getByText(/Order placed — cart #/)).toBeVisible();
});
```

The queries are the ones you already know — Playwright borrowed Testing
Library's priority order, so `getByRole`, `getByLabel` and `getByText`
transfer whole, and a CSS selector is as bad an idea here as it was there.

**`await expect(locator)` retries; `expect(await locator…)` samples once.**
That distinction is most of the difference between a stable suite and a flaky
one. Locators are lazy and auto-wait, so `page.getByRole(…)` resolves when you
act on it. Every `page.waitForTimeout(1000)` in a codebase is an assertion
that should have retried.

Assert on *your* behaviour — the order was placed, the drawer said so — never
on the third party's data. `trace: 'on-first-retry'` records DOM snapshots,
network and console for the failing attempt only; `npx playwright show-trace`
opens it.

📖 [Playwright — Best Practices](https://playwright.dev/docs/best-practices) ·
[Locators](https://playwright.dev/docs/locators) ·
[Assertions](https://playwright.dev/docs/test-assertions) ·
[Web server](https://playwright.dev/docs/test-webserver)

**→ In the demos:** Demo 20, Lab 6 (*One E2E journey*).

---

## 20. Coverage and the CI gate

Four commands, cheapest first, each failing fast:

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

| Step | Catches | Seconds |
|---|---|---|
| `typecheck` | shapes | ~2 |
| `lint` | hazards, dead code, a missing `await` on `user.click` | ~3 |
| `test` | behaviour | ~2 |
| `build` | anything the bundler dislikes | ~2 |
| *(then)* `test:e2e` | the journey | ~35 |

That line is what [Module 20](../20-production/) pastes into a workflow and
runs on every pull request. In CI, Vitest is `vitest run` (no watch), and
Playwright needs its browser: `npx playwright install --with-deps chromium`,
then `playwright test`. The config above already does the right things under
`CI=1`: no `.only` left behind, two retries, one worker, a trace on the first
retry so a failure comes with evidence.

### Coverage is a signal, not a target

```bash
npx vitest run --coverage      # provider: 'v8'; needs @vitest/coverage-v8
```

Coverage reports which lines *ran* while the tests ran. 100% proves every line
executed, not that any of them was correct — a test with no assertions scores
full marks. Read it for the **shape of the gaps**: an uncovered `catch` in the
refresh interceptor is worth a conversation; an uncovered `formatTime` is not.
Teams that make coverage a merge threshold get tests written to move the
number — the vacuous tests from [§1](#1-what-a-test-is). Put it in the
report; keep it out of the gate.

📖 [Vitest — Coverage](https://vitest.dev/guide/coverage.html) ·
[Playwright — Continuous Integration](https://playwright.dev/docs/ci)

**→ In the demos:** Demo 20, Lab 6 (*One E2E journey*), step C and Verify.

---

## 21. Flaky-test hygiene

A flaky test fails without a code change. Each cause has a name and a fix.

**A missing `await`** — on `user.*`, on `findBy`, on `waitFor`. The assertion
runs before React has committed. Lint for it.

**A fixed sleep.** `setTimeout` in a test, `waitForTimeout` in Playwright.
Replace with an assertion that retries ([§8](#8-async-assertions)).

**Shared state between tests.** A module-scope store, the app's
`QueryClient`, `localStorage`, a runtime MSW handler. The symptom is a test
that passes alone and fails in the suite, or the reverse. The fix is a reset,
in one place:

```ts
beforeEach(() => useCartStore.setState({ lines: [], isOpen: false }));
beforeEach(() => queryClient.clear());
afterEach(() => server.resetHandlers());
```

**Real timers in a test of a timeout.** Four seconds of backoff on a loaded CI
box pushes past the five-second default. Fake timers ([§9](#9-pure-logic-first))
— and when `userEvent` and fake timers meet, say so, or `user.type` hangs on
its internal delay:

```ts
const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
```

**The `act` warning.** *"An update to X inside a test was not wrapped in
act(...)"* means a state update happened after your last `await` — a fetch
resolving after the test ended, or a store update you triggered by hand. RTL
wraps `render`, `user.*` and `waitFor`; wrap the rest, or `await` the thing
that finishes it. Do not silence it: it is telling you the test asserted
before the component settled, which is a race.

**Strict Mode.** The app renders under `<StrictMode>`; a test does not unless
the wrapper adds it. An effect that leaks shows up in development as a
double-invoke ([Module 12 §5](../12-effects/#5-strict-modes-double-invoke))
and in tests as "test 1's interval is still running during test 2".
`cleanup()` after each test is the floor; writing the cleanup is the fix.

**A real request escaping.** `onUnhandledRequest: 'error'` turns "sometimes
slow" into "fails immediately with the URL". Keep it.

**Retries in CI.** Playwright's `retries: 2` is a safety net for a real
browser on a shared runner, not a licence. A test that needs the retry to
pass is flaky; find out why from the trace.

📖 [react.dev — `StrictMode`](https://react.dev/reference/react/StrictMode) ·
[Playwright — Retries](https://playwright.dev/docs/test-retries) ·
[Trace viewer](https://playwright.dev/docs/trace-viewer)

---

## 22. Self-check

1. Define a test in one sentence, and name the three parts of its body. Why
   is a test that cannot fail worse than no test?
2. Draw the trophy for a SPA. Which band is widest, and why? Where does a
   React component test sit?
3. Give the one-sentence heuristic for whether something is worth testing,
   and three things a test must never assert on.
4. Why does `vitest.config.ts` use `mergeConfig(viteConfig, …)`? What does
   `test.env` do, and what fails without it?
5. Why `@testing-library/jest-dom/vitest` and not `@testing-library/jest-dom`?
6. Why `screen` rather than the queries `render` returns?
7. List the query priority and explain why that order is an accessibility
   check.
8. For `getBy`, `queryBy`, `findBy`: what each returns, what it does on no
   match, and the question it asks. Which is the only way to assert absence?
9. In one sentence about disabled buttons, why `userEvent` over `fireEvent`?
   Why must `userEvent.setup()` be called before `render`?
10. Why is a fixed `setTimeout` in a test wrong even when it passes? What
    does `waitForElementToBeRemoved` assert that `findBy` does not?
11. What does a hard-to-unit-test piece of logic tell you about the design?
12. Why `toBe(idle)` rather than `toEqual(idle)` for a reducer that ignores
    an action?
13. How do you test a Zustand store without React? What is the difference
    between `setState(x)` and `setState(x, true)`?
14. Why `advanceTimersByTimeAsync` and not `advanceTimersByTime`? What
    happens if you advance the clock before attaching `.rejects`?
15. What does `toHaveBeenCalledExactlyOnceWith(product)` check that
    `toHaveBeenCalled()` does not — both halves?
16. What does `vi.mock('../api/services/products')` remove from a test? What
    does MSW leave running?
17. Name the four data states. Which do teams forget, and what does it look
    like on the wire?
18. Why `onUnhandledRequest: 'error'`? Why does handler registration order
    matter?
19. Describe the refresh-queue test: what is arranged, what is asserted, and
    what in `src/` is mocked.
20. When is `renderHook` the right tool? What does `act` do, and which RTL
    helpers already wrap it?
21. What does `createRoutesStub` give you that `render(<App />)` does not?
    Why `withRouter: false`? Why `queryClient.clear()`?
22. Why test an action through a four-line form rather than the real one?
    Why does middleware need a `loader` on the route to run?
23. Why `getByLabelText` for a form field, and what does it prove? What do
    `toBeInvalid` and `toHaveAccessibleDescription` read?
24. Why does the track avoid snapshot tests? Where is a snapshot legitimate?
25. Which journeys deserve Playwright? Why `preview` rather than `dev`?
26. `await expect(locator)` vs `expect(await locator…)` — which retries, and
    why is that the main source of flakiness?
27. Give the four-command gate in order, and say why that order. Why is
    coverage a signal and not a gate?
28. Name six causes of flaky tests and the fix for each. What does the `act`
    warning actually mean?

### Practical

1. Test a `<ProductCard>`: renders the data, toggles the wishlist with the
   right accessible name and `aria-pressed`, calls `onAddToCart` exactly once
   with the product, is disabled and renamed at stock 0, shows admin buttons
   only when handlers are passed — with no `data-testid`.
2. Write a reducer suite for `requestStatusReducer`, `cartLinesReducer` and
   `toastsReducer` with no `render` call at all, including a purity test and
   an `it.each` table.
3. Test the wishlist store outside React: toggle, the count selector, the
   persistence key, and that `subscribe` fires once per action and never
   after `unsubscribe()`.
4. Drive the products page through all four states against MSW: skeleton →
   results, `?q=` with no matches → empty, a 500 → the boundary showing the
   server's message, and a categories outage that must not sink the page.
5. Prove the refresh queue: six concurrent 401s, one `/auth/refresh`, twelve
   product hits; then the failed-refresh sign-out and the `_retry` ceiling.
6. With `createRoutesStub`: a loader's 404 → not-found page; an action's
   returned field errors vs its redirect with `?flash=`; `/account` →
   `/login?redirectTo=%2Faccount` for a signed-out visitor.
7. One Playwright test for sign in → add to cart → checkout against a real
   build, with no `waitForTimeout`; then make it fail on purpose and read
   the trace.
8. Run `typecheck → lint → test → build`, then break one behaviour `tsc`
   cannot see and confirm which step goes red.

---

## 23. References

**React**
- [Keeping Components Pure](https://react.dev/learn/keeping-components-pure) — why pure components are testable
- [Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [Extracting State Logic into a Reducer](https://react.dev/learn/extracting-state-logic-into-a-reducer) — testable state logic
- [`act`](https://react.dev/reference/react/act) — and why RTL usually handles it for you
- [`StrictMode`](https://react.dev/reference/react/StrictMode) — the bugs it surfaces before your tests do
- [Thinking in React](https://react.dev/learn/thinking-in-react) — the component boundaries you test

**Vitest**
- [Why Vitest](https://vitest.dev/guide/why.html) · [Configuring Vitest](https://vitest.dev/config/) · [Test Environment](https://vitest.dev/guide/environment)
- [`vi` — mocks, spies, timers, `stubGlobal`](https://vitest.dev/api/vi.html) · [`expect`](https://vitest.dev/api/expect.html) · [`test.each`](https://vitest.dev/api/#test-each)
- [Mocking](https://vitest.dev/guide/mocking.html) · [Snapshot](https://vitest.dev/guide/snapshot.html) · [Coverage](https://vitest.dev/guide/coverage.html)

**Testing Library**
- [Guiding Principles](https://testing-library.com/docs/guiding-principles/)
- [About Queries — priority](https://testing-library.com/docs/queries/about/#priority) · [`ByRole`](https://testing-library.com/docs/queries/byrole/)
- [React Testing Library — API (`render`, `renderHook`)](https://testing-library.com/docs/react-testing-library/api/) · [Setup — a custom `render`](https://testing-library.com/docs/react-testing-library/setup/)
- [Async Methods](https://testing-library.com/docs/dom-testing-library/api-async/) · [`within`](https://testing-library.com/docs/dom-testing-library/api-within/) · [Debugging](https://testing-library.com/docs/dom-testing-library/api-debugging/)
- [user-event — Introduction](https://testing-library.com/docs/user-event/intro/) · [`setup()`](https://testing-library.com/docs/user-event/setup/)
- [jest-dom matchers](https://testing-library.com/docs/ecosystem-jest-dom/)

**MSW**
- [Philosophy](https://mswjs.io/docs/philosophy) · [Getting started](https://mswjs.io/docs/getting-started) · [Node.js integration](https://mswjs.io/docs/integrations/node)
- [`http`](https://mswjs.io/docs/api/http) · [`HttpResponse`](https://mswjs.io/docs/api/http-response) · [`delay`](https://mswjs.io/docs/api/delay) · [`server.use()`](https://mswjs.io/docs/api/setup-server/use)

**Playwright**
- [Installation](https://playwright.dev/docs/intro) · [Best Practices](https://playwright.dev/docs/best-practices)
- [Locators](https://playwright.dev/docs/locators) · [Assertions](https://playwright.dev/docs/test-assertions) · [Test configuration](https://playwright.dev/docs/test-configuration) · [Web server](https://playwright.dev/docs/test-webserver)
- [Continuous Integration](https://playwright.dev/docs/ci) · [Retries](https://playwright.dev/docs/test-retries) · [Trace viewer](https://playwright.dev/docs/trace-viewer) · [Accessibility testing](https://playwright.dev/docs/accessibility-testing)

**React Router**
- [`createRoutesStub`](https://reactrouter.com/api/utils/createRoutesStub) · [Route Object](https://reactrouter.com/start/data/route-object) · [Middleware](https://reactrouter.com/how-to/middleware)

---

**Previous:** [Module 17 — TypeScript with React](../17-typescript-with-react/)
**Next:** [Module 19 — Server Components & Modern React 19](../19-server-components/)
