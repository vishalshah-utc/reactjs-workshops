# Session 1 Homework

**~45 minutes.** Reference solutions are in `solution/` — try first. Task 2 is
the one that teaches the most; do that one even if you skip the others.

Work in your own copy of the starter, on top of what you built in the session.

---

## Task 1 — `EmptyState`, extracted (10 min)

The empty state currently lives inline inside `ProductGrid`. That is fine for
one use, but Session 4 needs it on four different pages.

**Build** `src/components/EmptyState.tsx`:

```tsx
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}
```

Then use it in `ProductGrid`.

**Requirements**
- `icon` and `action` are **slots**, not string props. `actionLabel` +
  `onAction` is the design we argued against in Lab 2.
- Sensible default icon when none is passed.
- `ProductGrid` gets shorter, not longer.

**Check yourself:** could you render this with two buttons in the footer and a
custom illustration, without touching `EmptyState.tsx`? If not, it is still
configuration rather than composition.

---

## Task 2 — `ProductCard` variants, without a prop explosion (20 min)

⭐ **The important one.**

`ProductCard` currently renders one way. Three surfaces need it differently:

| Variant | Looks like |
|---|---|
| `grid` | today's card — image on top, full detail *(default)* |
| `list` | image left ~120px, details right, wider, one line of name |
| `mini` | 56px thumbnail, name, price. No rating, badges, or button. For the cart drawer. |

**Add a `variant?: 'grid' \| 'list' \| 'mini'` prop and support all three.**

Add a variant switcher to `App.tsx` so you can see them.

**Constraints — these are the point of the exercise**
1. **No copy-pasted card components.** One `ProductCard`.
2. **No boolean props.** Not `isList`, not `showRating`, not `compact`. One
   `variant` union. Booleans multiply: three booleans is eight states, five of
   which are nonsense and none of which TypeScript stops you writing.
3. `mini` must not render the wishlist button at all — not hide it with CSS.
   Ask yourself why that distinction matters. (Hint: what happens when a
   keyboard user tabs through a cart drawer full of `display:none` buttons?)

**Think about**
- Where does the branching go? Scattered ternaries in the JSX, or a lookup
  object near the top? Try both. One is much easier to add a fourth variant to.
- Look at `ui/button.tsx` — `cva` is exactly this pattern, done properly. You
  do not have to use it, but read it before you decide.

**Check yourself:** adding a fourth variant should touch one place, not nine.

---

## Task 3 — Sort, without mutating (15 min)

Add a sort control to `App.tsx` with four options:

- Featured *(the original order)*
- Price: low to high
- Price: high to low
- Rating

**Requirements**
- One `useState` for the sort key.
- The sorted list is **derived** on every render. No `useState` for it, no
  copy of the array in state.
- **Do not mutate `products`.** `Array.prototype.sort` sorts in place and
  returns the same array.

**The trap.** Write it the wrong way first, deliberately:

```tsx
const sorted = products.sort((a, b) => a.price - b.price);
```

Switch to "Price: low to high", then back to "Featured".

**Featured order is gone.** You destroyed the source data. It cannot come back
without a reload — the original order was never stored anywhere else.

Now fix it with `[...products].sort(...)` and confirm Featured works again.

**Write down, in a comment, why the spread is not optional.** Session 2 opens
with a bug that is exactly this, and you will get to be the person who spots
it in four seconds.

---

## Stretch (optional)

- **Persist the wishlist.** `localStorage` in `ProductCard`. It will feel
  wrong — 24 components each reading and writing the same key, and still no
  way to ask "what is saved?". *Sit with why it feels wrong.* Session 2 Lab 2
  and Session 8 Lab 1 are both about the answer.
- **Keyboard-only pass.** Unplug your mouse. Tab through the whole page. Can
  you reach every control? Can you tell where you are? Can you open and close
  the mobile menu? Fix what you find.
- **Make it dark.** Add `class="dark"` to `<html>` in `index.html`. Everything
  should already work — the tokens are in `index.css`. Anything that looks
  wrong is a place where a hard-coded colour slipped past a token. Find them.

---

## Bring to Session 2

One question, written down:

> The wishlist forgets everything on reload, and each card holds its own
> private `saved` flag with no way to ask "what is on the wishlist?".
> **Where should that state live, and why?**

There is more than one defensible answer. Come with yours.
