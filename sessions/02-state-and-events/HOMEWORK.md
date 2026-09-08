# Session 2 Homework

**~45 minutes.** Task 1 is the one that matters — do it even if you skip the
rest. The solution is published to this repo right after the session; these
tasks go beyond it, so it will not simply contain the answers.

---

## Task 1 — Bulk select and bulk delete (20 min)

⭐ **The important one.**

The back-office table needs multi-select: a checkbox per row, a "select all"
checkbox in the header, and a bar that appears when anything is selected
showing "N selected" and a Delete button.

**Requirements**

1. **The header checkbox is tri-state.** Nothing selected → unchecked. All
   selected → checked. *Some* selected → `"indeterminate"`. The `Checkbox`
   component already supports it: `checked="indeterminate"`.

   A header box that shows *unchecked* when three of twenty-four rows are
   ticked is lying to the user. That is why the third state exists.

2. **Selection is derived where it can be.** You need `useState` for the set of
   selected ids — that is genuine state. You do **not** need state for
   `allSelected`, `someSelected`, or the count. Compute them.

3. **Selection must survive a delete.** Delete three of five selected rows and
   the other two stay selected. (Think about what your selection state holds —
   ids or indexes? One of those survives, one does not. Session 1's `key`
   lesson, again.)

4. **Deleted products leave the cart**, same as single delete.

**Think about**

- `Set<string>` or `string[]`? A Set gives you O(1) `has` and no duplicates —
  but it is mutable, so `selected.add(id)` is Lab 1's bug all over again. You
  need `new Set(previous).add(id)`, or `useState<string[]>`. Try both.
- Where does the selection state live? The table renders the boxes; the action
  bar renders the count. Lab 2's question.

**Check yourself:** select all, delete one row from another source, and confirm
the header checkbox is still correct.

---

## Task 2 — Persist the cart (12 min)

The cart empties on every reload. Fix it with `localStorage`.

**Requirements**

- Load the saved cart as the reducer's initial state. `useReducer` takes a
  third argument — an **init function** — for exactly this:
  ```tsx
  useReducer(cartReducer, initialCartState, loadCart)
  ```
- Save on every change.
- **Do not put `localStorage` inside the reducer.** A reducer must be pure. If
  you are unsure why that matters, remove `<StrictMode>` from `main.tsx` and
  put a `console.log` in the reducer — then put StrictMode back and look again.

**The interesting part:** where does the *save* go? You do not have `useEffect`
until Session 3. You can do it in a wrapper around `dispatch`. Try that, and
notice it feels slightly wrong — every caller must remember to use the wrapper.

Write down what you would rather have. Session 3 gives it to you, and Session 8
gives you the version that scales.

**Watch out:** a saved cart can contain a product that no longer exists.
`calculateCart` already tolerates that — check that it does.

---

## Task 3 — Sort the back-office table (13 min)

Make the table's Product, Price and Stock headers sortable — click to sort,
click again to reverse, with an arrow showing the direction.

**Requirements**

- One `useState` holding `{ column, direction }`. Not one per column.
- The sorted rows are **derived**. No `useState` for them.
- `aria-sort="ascending" | "descending" | "none"` on each `<th>`. Without it a
  screen reader user cannot tell the table is sorted at all — this is a
  one-attribute fix that Session 10's accessibility pass would otherwise catch.
- Do not mutate. Again.

**Stretch:** make it generic — `sortRows(rows, column, direction)` that works
for any array of objects. Look at the type you end up with. That is Session 9's
`<DataTable>` starting to appear.

---

## Bring to Session 3

Every product still comes from a bundled file that is always instantly
available. The moment it comes from a server, three states exist that you have
never had to render:

> **loading**, **error**, and **empty**.
>
> Sketch what the product grid should show for each. What is the difference
> between "empty" and "loading"? Between "no results for your search" and
> "the request failed"?

Bring your sketch. Getting these four states right is most of what separates an
app that feels solid from one that feels broken.
