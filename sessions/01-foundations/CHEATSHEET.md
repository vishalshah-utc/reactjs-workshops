# Session 1 Cheat Sheet — one page, print it

## A component is a function that returns markup

```tsx
function Greeting({ name }: { name: string }) {
  return <p>Hello {name}</p>;
}

<Greeting name="Priya" />
```

**Capital letter is mandatory.** `<greeting />` = an HTML tag called
"greeting". `<Greeting />` = your component. Lowercase renders nothing and
warns nothing useful.

## JSX is not HTML

| Write | Not | Because |
|---|---|---|
| `className` | `class` | reserved word in JS |
| `htmlFor` | `for` | reserved word in JS |
| `<img />` | `<img>` | every tag closes |
| `{value}` | `${value}` | curly braces, not template strings |

**`{}` takes an EXPRESSION** — something producing a value.
✅ `product.name` · `2 + 2` · `list.map(...)` · `a ? b : c`
❌ `if` · `for` · `const` — statements are not allowed

**Return one node.** Need two siblings without a wrapper div? Fragment:
```tsx
return <>
  <dt>Price</dt>
  <dd>₹1,299</dd>
</>;
```

## Props

```tsx
interface Props {
  title: string;        // required
  count?: number;       // optional (TypeScript)
  actions?: ReactNode;  // a SLOT — any renderable thing
}

function Header({ title, count = 0, actions }: Props) { … }
//                            ^ default (JavaScript)
```

Props flow **one way**: parent → child. A child can never change them.

**Composition beats configuration.** A `ReactNode` slot never needs a new prop:
```tsx
❌ <PageHeader title="X" actionLabel="Export" onAction={fn} showCount count={3} />
✅ <PageHeader title="X" actions={<Button onClick={fn}>Export</Button>} />
```

**`children`** is the same thing with syntax — anything between the tags.

**Derive, don't pass.** If you can compute it from props you already have,
compute it. Two sources of truth always drift.

## Lists

```tsx
{products.map((product) => (
  <li key={product.id}>{product.name}</li>
))}
```

**`key` must be stable and unique to the DATA.**

| | |
|---|---|
| ✅ `key={product.id}` | identifies the item |
| ❌ `key={index}` | identifies the *position* — state sticks to the slot when the list reorders |
| ❌ `key={Math.random()}` | new key every render: destroys all state and all performance |

`key` goes on the **outermost element the `.map()` callback returns**.

> Index keys are fine only when the list never reorders, never filters, and
> holds no state. That is rarer than it sounds.

**⚠️ Arrow-function gotcha**
```tsx
{list.map((x) => <li>{x}</li>)}     ✅ round bracket = the value
{list.map((x) => { <li>{x}</li> })} ❌ curly = function body, no return, renders nothing
```

## Conditional rendering — four idioms

```tsx
{isNew && <Badge>New</Badge>}                    // render or nothing
{out ? 'Sold out' : 'Add to cart'}               // genuine either/or
if (items.length === 0) return <Empty />;        // a whole different view
<StockBadge stock={n} />                         // 3+ branches → a component
```

**⚠️ THE ZERO TRAP — the most common React bug**
```tsx
{count && <Badge/>}      ❌ count = 0 → renders a literal "0" on the page
{count > 0 && <Badge/>}  ✅
```
`&&` returns the left value when falsy. React ignores `false`/`null`/
`undefined` — but happily renders `0` and `''`.

## useState

```tsx
const [value, setValue] = useState(0);
const [density, setDensity] = useState<GridDensity>('comfortable');
//                                    ^ needed, or it infers `string`
```

1. **Setting state schedules a re-render.** It does not mutate the variable —
   it is a `const`.
2. **The value is a snapshot.** Within one render it never changes.
   ```tsx
   setCount(count + 1); setCount(count + 1);   // +1  ❌
   setCount(c => c + 1); setCount(c => c + 1); // +2  ✅
   ```
   Use the functional form whenever the new value depends on the old one.
3. **Each instance gets its own.** One `useState` in a component rendered 24
   times = 24 independent values, kept apart by tree position.

**Where does state go?** As low as possible, but high enough that everyone who
needs it can reach it. Two siblings need it → their nearest common parent.

**Hooks rules:** top level only. Never in an `if`, a loop, or after an early
return. React tracks them by call order.

**⚠️** `onClick={setX('a')}` calls it during render → infinite loop.
Always `onClick={() => setX('a')}`.

## Tailwind you will use today

| Class | Effect |
|---|---|
| `flex` `grid` `gap-4` | layout |
| `hidden md:flex` | hidden by default, flex from 768px up (mobile-first) |
| `sm: md: lg: xl:` | 640 / 768 / 1024 / 1280px |
| `relative` + `absolute` | position an icon over an input |
| `bg-primary` `text-muted-foreground` | tokens from `index.css`, not raw colours |
| `tabular-nums` | fixed-width digits so numbers stop jittering |
| `line-clamp-2` | truncate to 2 lines with an ellipsis |
| `sr-only` | visible to screen readers, not to eyes |
| `aspect-square` | keep a 1:1 box |

**`cn()`** merges conditionals and resolves conflicts:
```tsx
cn('p-2', isActive && 'bg-primary', 'p-4')   // → "bg-primary p-4"  (p-4 wins)
```

**⚠️** Tailwind scans for **complete literal class strings**.
`` className={`text-${color}`} `` produces nothing. Write whole class names.

## Project map

| Path | What |
|---|---|
| `src/main.tsx` | entry point — attaches React to `#root` |
| `src/App.tsx` | the page |
| `src/index.css` | Tailwind + design tokens (no `tailwind.config.js` in v4) |
| `src/types.ts` | the `Product` type |
| `src/data/products.ts` | 24 bundled products (the API takes over in S3) |
| `src/lib/utils.ts` | `cn`, `formatPrice`, `discountPercent` |
| `src/components/ui/` | shadcn primitives — source you own, not a dependency |
| `@/…` | alias for `src/…` |

## Commands

```bash
npm run dev         # http://localhost:5173
npm run typecheck   # tsc, no emit — Vite does NOT typecheck during dev
npm run lint
npm run build
```

## When it breaks

| Symptom | Cause |
|---|---|
| blank page | a component threw — check the console |
| `Objects are not valid as a React child` | you rendered `{product}`, meant `{product.name}` |
| stray `0` on screen | the zero trap — use `count > 0 &&` |
| list renders nothing | `.map()` with `{}` body and no `return` |
| "Each child needs a unique key" | missing `key` on the outermost mapped element |
| "Too many re-renders" | you called a setter during render — missing `() =>` |
| a Tailwind class does nothing | dynamic class name, or a typo |
| logs appear twice | `StrictMode`, development only. Intended. |
