# ReactJS Fundamentals with TypeScript & Bootstrap — Study Notes & Guided Project

**What this is:** a self-contained set of study notes covering React's core concepts, each one immediately applied to a real app you build step by step.

**What you'll build:** **TaskBoard** — a task management board with adding, completing, deleting, filtering, searching, stats, persistence, and an edit modal. Typed end-to-end with **TypeScript** and styled with **Bootstrap 5** via **React-Bootstrap**.

**Language:** TypeScript (`.tsx`). No prior TypeScript experience assumed — types are introduced gradually, starting from the simplest useful ones.

---

## How to use these notes

Work top to bottom. The document alternates between three kinds of sections:

| Section type | What it is |
|---|---|
| **Concept** | The React idea explained, with a small standalone example. |
| **TS Note** | How TypeScript changes or improves that concept. |
| **Build Step** | Code you paste into the TaskBoard project. Every build step leaves the app in a **working, runnable state**. |

Rules that will make this go well:

1. **Type the code at least once** rather than only pasting. Muscle memory matters more than you'd think.
2. **Run the app after every build step.** If it breaks, fix it before moving on — errors compound.
3. **Read the TypeScript errors.** They're verbose, but they're almost always telling you something true. Start at the last line of the message, which usually names the actual mismatch.
4. **Do the "Try it yourself" prompts.** They're where the learning actually sticks.
5. Keep the browser console *and* your editor's Problems panel open. TypeScript catches things before you ever run the app.

---

## Table of contents

**Setup**
- [Part 0 — Environment, Bootstrap & TypeScript setup](#part-0--environment-bootstrap--typescript-setup)
- [Part 0.8 — TypeScript orientation](#part-08--typescript-orientation-15-minutes)

**Core React**
- [1. The React mental model](#1-the-react-mental-model)
- [2. JSX & TSX](#2-jsx--tsx)
- [3. Components & props](#3-components--props)
- [4. Rendering lists & keys](#4-rendering-lists--keys)
- [5. Conditional rendering](#5-conditional-rendering)
- [6. State with `useState`](#6-state-with-usestate)
- [7. Events & handlers](#7-events--handlers)
- [8. Forms & controlled components](#8-forms--controlled-components)
- [9. Lifting state up](#9-lifting-state-up)
- [10. Derived state](#10-derived-state)
- [11. `useEffect` & side effects](#11-useeffect--side-effects)
- [12. Custom hooks](#12-custom-hooks)
- [13. `useReducer`](#13-usereducer)
- [14. Context API](#14-context-api)
- [15. Refs with `useRef`](#15-refs-with-useref)
- [16. Performance: `memo`, `useMemo`, `useCallback`](#16-performance-memo-usememo-usecallback)
- [17. Data fetching](#17-data-fetching)
- [18. Routing (brief tour)](#18-routing-brief-tour)

**Reference**
- [Common mistakes](#common-mistakes-and-how-to-avoid-them)
- [Hooks cheat sheet](#hooks-cheat-sheet)
- [TypeScript-in-React cheat sheet](#typescript-in-react-cheat-sheet)
- [Bootstrap quick reference](#bootstrap-quick-reference)
- [Glossary](#glossary)
- [Where to go next](#where-to-go-next)

---

# Part 0 — Environment, Bootstrap & TypeScript setup

## 0.1 Prerequisites

| Tool | Version | Check with |
|---|---|---|
| Node.js | 20 LTS or newer | `node -v` |
| npm | comes with Node | `npm -v` |
| Editor | VS Code + ESLint, Prettier | — |
| Browser | Chrome/Edge + [React Developer Tools](https://react.dev/learn/react-developer-tools) | — |

You should be comfortable with modern JavaScript before starting: arrow functions, destructuring, spread/rest, template literals, `map`/`filter`/`reduce`, modules, and promises/`async-await`. React is small; it just assumes fluent JS.

## 0.2 Create the project

```bash
npm create vite@latest taskboard -- --template react-ts
cd taskboard
npm install
```

The `react-ts` template gives you TypeScript configured correctly out of the box — `tsconfig.json`, `tsconfig.app.json`, `.tsx` files, and type checking wired into the build.

## 0.3 Install Bootstrap and React-Bootstrap

```bash
npm install react-bootstrap bootstrap
```

Two packages, because they do different jobs:

- **`bootstrap`** is the CSS. It provides the classes (`d-flex`, `mb-3`, `text-muted`) and the visual design.
- **`react-bootstrap`** is a set of real React components (`<Button>`, `<Modal>`, `<Form.Control>`) that render Bootstrap markup. It replaces Bootstrap's own JavaScript entirely — **no jQuery, and you should not import `bootstrap.bundle.js`.** Mixing the two causes duplicate event handling on modals and dropdowns.

React-Bootstrap ships its own TypeScript definitions, so there is no `@types/react-bootstrap` to install. (If you see instructions telling you to install it, they're out of date.)

> **Version note.** The stable line is `react-bootstrap@2.x`, which targets Bootstrap 5. A `3.0.0-beta` line exists that targets React 19 specifically. Vite's current template scaffolds React 19, and stable v2 (2.10.7+) works with it — but if you hit type conflicts around refs or `Navbar`, either pin React 18 or try the beta with `npm install react-bootstrap@next`. Check [react-bootstrap.github.io](https://react-bootstrap.github.io/) for the current recommendation, since this will have moved on.

## 0.4 Import the Bootstrap stylesheet

Bootstrap's CSS must be imported **once**, at the app's entry point, before your own styles. Open `src/main.tsx`:

```tsx
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "bootstrap/dist/css/bootstrap.min.css"   // ← must come first
import "./index.css"                             // your overrides come after
import App from "./App.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

Note the `!` after `getElementById("root")`. That's TypeScript's **non-null assertion** — `getElementById` returns `HTMLElement | null`, and you're telling the compiler you know the element exists because it's in `index.html`. Vite's template includes this already.

Now empty out `src/index.css` (delete everything Vite put there — it fights Bootstrap) and delete `src/App.css`.

## 0.5 Configure the `@` import alias (recommended)

Optional but worth doing: it turns `../../components/TaskCard` into `@/components/TaskCard`, which stays correct when you move files.

Add to **`tsconfig.json`**:

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

Add the same block inside `compilerOptions` in **`tsconfig.app.json`** — the editor reads this one:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

Then install Node types and update **`vite.config.ts`**:

```bash
npm install -D @types/node
```

```ts
import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

Both halves are required: **TypeScript** needs `paths` to resolve types, and **Vite** needs `resolve.alias` to resolve the actual module at build time. Configure one without the other and you get either red squiggles or a runtime failure.

## 0.6 Verify

Replace `src/App.tsx` with:

```tsx
import { Button, Container } from "react-bootstrap"

export default function App() {
  return (
    <Container className="py-5 text-center">
      <h1 className="mb-3">TaskBoard</h1>
      <Button variant="primary">Setup works</Button>
    </Container>
  )
}
```

Run it:

```bash
npm run dev
```

Open `http://localhost:5173`. A blue Bootstrap button on a centred, padded container means everything is wired.

**Troubleshooting**

| Symptom | Fix |
|---|---|
| Components render but look unstyled | The `bootstrap.min.css` import is missing from `main.tsx`, or it comes *after* `index.css`. |
| `Cannot find module '@/components/...'` | Alias missing from `tsconfig.app.json` **or** `vite.config.ts`. Restart the dev server and the TS server (VS Code: ⇧⌘P → "Restart TS Server"). |
| Modals/dropdowns fire twice | You imported Bootstrap's JS bundle. Remove it — React-Bootstrap replaces it. |
| Type errors on `ref` or `Navbar` | React 19 vs react-bootstrap v2 mismatch. See the version note in 0.3. |
| `npm run build` fails but `dev` works | `dev` doesn't type-check; `build` runs `tsc`. Fix the reported type errors. |

---

# Part 0.8 — TypeScript orientation (15 minutes)

Enough TypeScript to start. Everything else is introduced where it's needed.

### Annotating values

```ts
let count: number = 0
let title: string = "Task"
let done: boolean = false
let tags: string[] = ["work", "urgent"]
```

In practice you rarely write these, because TypeScript **infers** types:

```ts
let count = 0          // inferred as number
count = "five"         // ❌ Type 'string' is not assignable to type 'number'
```

**Annotate function parameters and public boundaries; let inference handle the rest.** Over-annotating is noise.

### Object shapes: `interface` and `type`

```ts
interface Task {
  id: string
  title: string
  done: boolean
  dueDate?: string        // optional — string | undefined
  readonly createdAt: number
}

type Task2 = {
  id: string
  title: string
}
```

`interface` and `type` are near-interchangeable for object shapes. A common convention: **`interface` for object shapes, `type` for unions and everything else.** Pick one and be consistent.

### Union types — the feature you'll use most

```ts
type Priority = "low" | "medium" | "high"

let p: Priority = "high"
p = "urgent"   // ❌ not assignable to type 'Priority'
```

This is far better than `string`. It documents the valid values, autocompletes them, and makes typos compile errors. Almost every "status", "variant", "mode", or "role" field in your app should be a union of string literals rather than `string`.

### Functions

```ts
function add(a: number, b: number): number {
  return a + b
}

const toggle = (id: string): void => { /* ... */ }
```

Return types are usually inferred, so you can omit them — but writing them on exported functions catches mistakes at the definition rather than at the call site.

### `null` and `undefined`

With `strict` mode on (the Vite template enables it), nullable values must be handled:

```ts
const el = document.getElementById("root")   // HTMLElement | null
el.focus()      // ❌ 'el' is possibly 'null'
el?.focus()     // ✅ optional chaining
if (el) el.focus()   // ✅ narrowing
el!.focus()     // ⚠️ non-null assertion — "trust me". Use sparingly.
```

### Narrowing

TypeScript follows your control flow:

```ts
function format(value: string | number): string {
  if (typeof value === "number") {
    return value.toFixed(2)   // here, value is number
  }
  return value.trim()         // here, value is string
}
```

This is the mechanism behind typed reducers and typed context later on.

### Generics

A type that takes a type as a parameter:

```ts
function first<T>(items: T[]): T | undefined {
  return items[0]
}

first([1, 2, 3])       // number | undefined
first(["a", "b"])      // string | undefined
```

You'll meet these in `useState<T>()` and in the `useLocalStorage<T>` hook you write in Step 8.

### Useful utility types

```ts
Partial<Task>              // all properties optional — perfect for "changes" objects
Omit<Task, "id">           // Task without id — perfect for "new task before it has an id"
Pick<Task, "id" | "title">
Record<Priority, string>   // an object with a key per Priority
```

`Partial` and `Omit` in particular will save you from defining nearly-duplicate interfaces.

### Avoid `any`

`any` switches type checking off for that value and everything it touches. If you truly don't know a type, use `unknown` — it forces you to narrow before use:

```ts
function handle(data: unknown) {
  if (typeof data === "string") console.log(data.toUpperCase())
}
```

### The one-line summary

TypeScript is a **compile-time** tool. It erases entirely at build; nothing you write here exists at runtime. Its whole value is telling you about mistakes before your users find them.

---

# 1. The React mental model

Before syntax, the idea. React rests on three things:

**1. UI is a function of state.** You don't write instructions to change the screen. You describe what the screen should look like *for a given set of data*, and React works out the DOM operations.

```ts
// Not React — imperative. You manage the DOM yourself.
document.getElementById("count")!.textContent = String(count + 1)

// React — declarative. You describe the output for the current state.
<span>{count}</span>
```

**2. Components are the unit of everything.** A component is a function that takes data and returns a description of UI. Components nest to form a tree, and the tree is your application.

**3. State changes trigger re-renders.** When state changes, React calls your component function again, produces a new description of the UI, compares it with the previous one, and updates only what actually differs. "Re-render" means *React called your function again* — it does **not** mean the browser repainted everything.

The practical consequence, and the thing that trips up experienced developers coming from other paradigms: **you never reach for the DOM to change what's on screen. You change state, and let the screen follow.** Almost every React bug in your first month traces back to fighting this.

---

# 2. JSX & TSX

JSX is syntax sugar that looks like HTML and compiles to JavaScript function calls. In a `.tsx` file it's the same thing, type-checked.

```tsx
const element = <h1 className="display-6">Hello</h1>
// compiles to roughly:
// jsx("h1", { className: "display-6", children: "Hello" })
```

Because it's JavaScript, it follows JavaScript's rules — this is the source of every JSX quirk.

### The rules

**Embed expressions with `{}`:**

```tsx
const user = { name: "Ada", tasks: 3 }

<p>{user.name} has {user.tasks} tasks</p>
<p>{user.tasks > 0 ? "Busy" : "Free"}</p>
<p>{user.name.toUpperCase()}</p>
```

Expressions only. `if`, `for`, and `switch` are statements and won't work inside JSX.

**`className`, not `class`** — `class` is a reserved word. Similarly `htmlFor` instead of `for`, and camelCase for everything else (`onClick`, `tabIndex`, `colSpan`).

**Every tag must close:** `<img />`, `<br />`, `<hr />`.

**Return one root element.** Wrap siblings in a fragment when you don't want an extra DOM node:

```tsx
<>
  <h1>Title</h1>
  <p>Body</p>
</>
```

**Style takes an object with camelCase keys:**

```tsx
<div style={{ marginTop: 8, backgroundColor: "red" }} />
```

You'll rarely need it — Bootstrap's utility classes (`mt-2`, `bg-danger`) cover almost everything.

### What renders and what doesn't

```tsx
{null}          // renders nothing
{undefined}     // renders nothing
{false}         // renders nothing
{0}             // renders "0"  ← the classic gotcha
{[1, 2, 3]}     // renders "123"
{{ a: 1 }}      // ERROR: objects are not valid as a React child
```

That `0` behaviour causes a specific, very common bug:

```tsx
{tasks.length && <TaskList />}      // when length is 0, renders "0" on screen
{tasks.length > 0 && <TaskList />}  // correct
```

> **TS Note.** TypeScript catches the object case at compile time (`Type '{ a: number; }' is not assignable to type 'ReactNode'`) but **not** the `0` case, because `number` is a legitimate `ReactNode`. That one is still on you.

**Try it yourself:** in `App.tsx`, render `{0 && <p>hi</p>}` and then `{"" && <p>hi</p>}`. Note what appears, and why.

---

# 3. Components & props

A component is a function that returns JSX. Two rules: **the name must be capitalised** (lowercase names are treated as HTML tags), and it must be **pure** — same inputs, same output, no mutating anything outside itself during render.

**Props** are the arguments. They flow **down** only, and they are **read-only**.

### Typing props

This is the single most valuable thing TypeScript does in React. Define an interface, destructure in the parameter list:

```tsx
interface GreetingProps {
  name: string
  role?: string          // optional
  count: number
}

function Greeting({ name, role = "member", count }: GreetingProps) {
  return <p>{name} — {role} ({count})</p>
}

<Greeting name="Ada" role="admin" count={3} />
<Greeting name="Grace" count={0} />          // role defaults
<Greeting name="Alan" />                     // ❌ Property 'count' is missing
<Greeting name={42} count={1} />             // ❌ number not assignable to string
```

Every consumer of your component now gets autocomplete for its props and a compile error for mistakes. On a team, this replaces a good deal of documentation.

> **You may see `React.FC<Props>`** in older code. It's no longer recommended — plain function declarations with typed parameters are simpler and avoid `FC`'s historical quirks with `children`.

### The `children` prop

Anything between the opening and closing tags arrives as `children`, typed as `ReactNode` — the union of everything React can render:

```tsx
import type { ReactNode } from "react"
import { Card } from "react-bootstrap"

interface PanelProps {
  title: string
  children: ReactNode
}

function Panel({ title, children }: PanelProps) {
  return (
    <Card className="mb-3">
      <Card.Header className="fw-semibold">{title}</Card.Header>
      <Card.Body>{children}</Card.Body>
    </Card>
  )
}

<Panel title="Notes">
  <p>Anything at all goes here.</p>
  <Button>Even components</Button>
</Panel>
```

Note `import type` — it makes explicit that you're importing a type, which is erased at compile time. Not required, but good practice and required by some lint configs.

**Composition over configuration.** When a component starts growing boolean props (`showHeader`, `showFooter`, `isCompact`), that's usually a signal you want `children` and smaller pieces instead. React-Bootstrap is built this way: `Card`, `Card.Header`, `Card.Body`, `Card.Title` are separate composable pieces rather than one `<Card>` with fifteen props.

### Props are read-only

```tsx
function Bad({ task }: { task: Task }) {
  task.title = "changed"   // never do this — mutating a prop
  return <p>{task.title}</p>
}
```

Mark fields `readonly` in the interface and TypeScript will stop you.

If a component needs to change data, it either holds it in state or calls a function passed down from the parent. Which brings us to the pattern you'll use constantly:

```tsx
// Parent owns the data and the updater; child just reports events upward.
function Parent() {
  const [count, setCount] = useState(0)
  return <Child count={count} onIncrement={() => setCount(count + 1)} />
}

interface ChildProps {
  count: number
  onIncrement: () => void       // a function taking nothing, returning nothing
}

function Child({ count, onIncrement }: ChildProps) {
  return <Button onClick={onIncrement}>{count}</Button>
}
```

Data flows down as props. Events flow up as callbacks. That's the whole architecture.

---

## 🔨 Build Step 1 — Types and app shell

Start with the domain types. Create `src/types.ts`:

```ts
export type Priority = "low" | "medium" | "high"

export type Filter = "all" | "active" | "done"

export interface Task {
  id: string
  title: string
  priority: Priority
  done: boolean
  readonly createdAt: number
}

/** A task before it has been given an id and defaults. */
export type NewTask = Pick<Task, "title" | "priority">
```

This file is the contract for the whole app. Getting it right first makes everything downstream easier, and `NewTask` shows `Pick` doing real work — no near-duplicate interface needed.

Create `src/components/Header.tsx`:

```tsx
import { Navbar, Container } from "react-bootstrap"
import { CheckCircleFill } from "react-bootstrap-icons"

interface HeaderProps {
  title: string
  subtitle: string
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <Navbar className="bg-white border-bottom py-3">
      <Container className="d-flex align-items-center gap-3" style={{ maxWidth: 768 }}>
        <CheckCircleFill className="text-primary" size={24} />
        <div>
          <h1 className="h5 mb-0">{title}</h1>
          <p className="text-muted small mb-0">{subtitle}</p>
        </div>
      </Container>
    </Navbar>
  )
}
```

Install the icon set:

```bash
npm install react-bootstrap-icons
```

Replace `src/App.tsx`:

```tsx
import { Container } from "react-bootstrap"
import Header from "@/components/Header"

export default function App() {
  return (
    <div className="min-vh-100 bg-body-tertiary">
      <Header title="TaskBoard" subtitle="Everything you're working on, in one place." />
      <Container className="py-4" style={{ maxWidth: 768 }}>
        <p className="text-muted">Tasks will appear here.</p>
      </Container>
    </div>
  )
}
```

**What you just used:** a component, typed props, destructuring, and Bootstrap utility classes (`bg-body-tertiary`, `text-muted`, `d-flex`, `gap-3`). Those utilities are theme-aware in Bootstrap 5.3, so dark mode later needs no component changes.

---

## 🔨 Build Step 2 — A TaskCard with typed props

Create `src/data/seed.ts`:

```ts
import type { Task } from "@/types"

export const seedTasks: Task[] = [
  { id: "1", title: "Set up the project",     priority: "high",   done: true,  createdAt: 1 },
  { id: "2", title: "Learn props and state",  priority: "medium", done: false, createdAt: 2 },
  { id: "3", title: "Build the task form",    priority: "low",    done: false, createdAt: 3 },
]
```

Annotating as `Task[]` means a typo in any seed row is caught immediately, right where you wrote it.

Create `src/components/TaskCard.tsx`:

```tsx
import { Card, Badge } from "react-bootstrap"
import type { Priority, Task } from "@/types"

const priorityVariant: Record<Priority, string> = {
  high: "danger",
  medium: "primary",
  low: "secondary",
}

interface TaskCardProps {
  task: Task
}

export default function TaskCard({ task }: TaskCardProps) {
  return (
    <Card className="mb-2">
      <Card.Body className="d-flex align-items-center justify-content-between gap-3 py-3">
        <span className="fw-medium">{task.title}</span>
        <Badge bg={priorityVariant[task.priority]}>{task.priority}</Badge>
      </Card.Body>
    </Card>
  )
}
```

Update `App.tsx`'s container:

```tsx
import { Container } from "react-bootstrap"
import Header from "@/components/Header"
import TaskCard from "@/components/TaskCard"
import { seedTasks } from "@/data/seed"

export default function App() {
  return (
    <div className="min-vh-100 bg-body-tertiary">
      <Header title="TaskBoard" subtitle="Everything you're working on, in one place." />
      <Container className="py-4" style={{ maxWidth: 768 }}>
        <TaskCard task={seedTasks[0]} />
        <TaskCard task={seedTasks[1]} />
      </Container>
    </div>
  )
}
```

`Record<Priority, string>` is doing real work here: if you later add `"critical"` to the `Priority` union, TypeScript immediately errors on this object for missing a key. The type system reminds you about every place that needs updating — this is the payoff for using unions instead of `string`.

The lookup object is declared **outside** the component because it never changes; re-creating it every render would be pointless.

**Try it yourself:** add `"critical"` to `Priority` in `types.ts` and watch where the errors appear. Then remove it.

---

# 4. Rendering lists & keys

You render a list by mapping an array to an array of elements.

```tsx
interface TaskListProps {
  tasks: Task[]
}

function TaskList({ tasks }: TaskListProps) {
  return (
    <ul>
      {tasks.map((task) => (
        <li key={task.id}>{task.title}</li>
      ))}
    </ul>
  )
}
```

TypeScript infers `task` as `Task` inside `map` — no annotation needed, and you get autocomplete on `task.`.

### Why keys matter

React uses `key` to match elements between renders and decide what to reuse, move, or destroy. Without a stable key, React falls back on position — and position lies whenever the list is reordered, filtered, or has items inserted at the front.

**Use a stable ID from the data:**

```tsx
{tasks.map((t) => <TaskCard key={t.id} task={t} />)}   // ✅
```

**Avoid the array index** unless the list is static and will never reorder, filter, or grow from the top:

```tsx
{tasks.map((t, i) => <TaskCard key={i} task={t} />)}   // ⚠️ bug source
```

The failure is specific and worth internalising: with index keys, delete the first item in a list of inputs and the *text* stays put while the *data* shifts, because React reused the DOM node it thought was in the same position. It manifests as "my checkbox state jumped to the wrong row."

Keys go on the **outermost element inside `map`**, and they only need to be unique among siblings — not globally.

---

# 5. Conditional rendering

Four idioms, each with a natural use.

```tsx
// 1. Ternary — either/or
{isLoading ? <Spinner animation="border" /> : <TaskList tasks={tasks} />}

// 2. && — render or nothing
{error && <Alert variant="danger">{error}</Alert>}

// 3. Early return — cleanest for guard clauses
function TaskList({ tasks }: TaskListProps) {
  if (tasks.length === 0) return <EmptyState />
  return <div>{tasks.map(/* ... */)}</div>
}

// 4. Lookup object — instead of a switch
const views: Record<ViewMode, ReactNode> = { list: <ListView />, board: <BoardView /> }
return views[mode]
```

Watch the `&&` operator with numbers, as covered in §2: `{count && <X />}` renders `0` when count is zero. Force a boolean — `{count > 0 && <X />}` — or use a ternary.

**Empty states are part of the UI, not an afterthought.** A list that renders nothing when empty looks broken. Design the zero case deliberately.

---

## 🔨 Build Step 3 — Task list with keys and an empty state

Create `src/components/TaskList.tsx`:

```tsx
import TaskCard from "@/components/TaskCard"
import type { Task } from "@/types"

interface TaskListProps {
  tasks: Task[]
}

export default function TaskList({ tasks }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="border border-2 border-dashed rounded-3 text-center py-5 text-muted">
        <p className="fw-semibold mb-1 text-body">No tasks yet</p>
        <p className="small mb-0">Add your first task to get started.</p>
      </div>
    )
  }

  return (
    <div>
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  )
}
```

Bootstrap has no dashed-border utility, so add one to `src/index.css`:

```css
.border-dashed {
  border-style: dashed !important;
}
```

Update `App.tsx` to render the list:

```tsx
import { Container } from "react-bootstrap"
import Header from "@/components/Header"
import TaskList from "@/components/TaskList"
import { seedTasks } from "@/data/seed"

export default function App() {
  return (
    <div className="min-vh-100 bg-body-tertiary">
      <Header title="TaskBoard" subtitle="Everything you're working on, in one place." />
      <Container className="py-4" style={{ maxWidth: 768 }}>
        <TaskList tasks={seedTasks} />
      </Container>
    </div>
  )
}
```

**Try it yourself:** temporarily pass `tasks={[]}` and confirm the empty state renders.

---

# 6. State with `useState`

Props come from the parent. **State is data a component owns and can change.** Changing it re-renders the component.

```tsx
import { useState } from "react"

function Counter() {
  const [count, setCount] = useState(0)
  //     ↑ value  ↑ setter      ↑ initial value → inferred as number
  return <Button onClick={() => setCount(count + 1)}>{count}</Button>
}
```

### Typing state

Inference handles most cases. Be explicit when the initial value doesn't tell the whole story:

```tsx
const [count, setCount] = useState(0)                    // number — inferred
const [title, setTitle] = useState("")                   // string — inferred

const [tasks, setTasks] = useState<Task[]>([])           // ✅ needed: [] alone infers never[]
const [editing, setEditing] = useState<Task | null>(null) // ✅ needed: null alone infers null
const [filter, setFilter] = useState<Filter>("all")       // ✅ needed: else infers string
```

That last one matters more than it looks. Without the annotation, `filter` is `string`, and `setFilter("activ")` compiles happily. With `<Filter>`, the typo is a compile error.

**Rule of thumb:** annotate when the initial value is `[]`, `null`, `undefined`, or a string literal that should be a union.

### The four rules of state

**1. State updates are asynchronous — the variable doesn't change immediately.**

```tsx
function handleClick() {
  setCount(count + 1)
  console.log(count)   // still the OLD value — this render's value
}
```

`count` is a constant within this render. The new value appears on the *next* render. This is a feature: it guarantees everything in one render is consistent.

**2. Use the updater function when the new value depends on the old one.**

```tsx
setCount(count + 1)
setCount(count + 1)        // ❌ both read the same stale value → +1 total

setCount((c) => c + 1)
setCount((c) => c + 1)     // ✅ each receives the latest → +2 total
```

Default to the updater form. It's correct in strictly more situations.

**3. Never mutate state — always replace it.**

React compares by reference. Mutating an object or array leaves the reference identical, so React sees no change and skips the re-render.

```tsx
// ❌ mutation — React won't notice
tasks.push(newTask)
setTasks(tasks)
task.done = true

// ✅ create new values
setTasks([...tasks, newTask])                                        // add
setTasks(tasks.filter((t) => t.id !== id))                           // remove
setTasks(tasks.map((t) => (t.id === id ? { ...t, done: true } : t))) // update one
```

That last line is the single most useful pattern in React. Read it carefully: map over everything, replace the one that matches with a **new object** built from the old one, leave the rest untouched.

> **TS Note.** Typing your state as `readonly Task[]` makes `.push()` a compile error, turning this convention into an enforced rule. Worth considering on a team.

**4. Group related state; separate unrelated state.**

```tsx
const [firstName, setFirstName] = useState("")   // fine — independent values
const [lastName, setLastName] = useState("")

const [form, setForm] = useState<NewTask>({ title: "", priority: "medium" })  // fine — always change together
```

### Initial value is only used once

```tsx
const [tasks, setTasks] = useState<Task[]>(seedTasks)  // read on first render only
```

If computing it is expensive, pass a **function** so it runs once instead of every render:

```tsx
const [tasks, setTasks] = useState<Task[]>(() => JSON.parse(localStorage.getItem("tasks") ?? "[]"))
```

Without the arrow function, `JSON.parse` would run on *every* render and its result thrown away.

### State is per-component-instance

```tsx
<Counter />   // has its own count
<Counter />   // completely independent count
```

Two instances of the same component share code, never state.

---

# 7. Events & handlers

React events look like DOM events with camelCase names, and they receive a synthetic event object with the standard API.

```tsx
<Button onClick={handleClick}>Click</Button>
<Form.Control onChange={handleChange} />
<Form onSubmit={handleSubmit}>
```

**Pass the function, don't call it:**

```tsx
<Button onClick={handleClick}>     // ✅ reference
<Button onClick={handleClick()}>   // ❌ calls it during render
```

**To pass arguments, wrap in an arrow function:**

```tsx
<Button onClick={() => onDelete(task.id)}>Delete</Button>
```

**Prevent default for form submits:**

```tsx
function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault()   // stop the browser's full-page reload
}
```

### Typing event handlers

The types you'll actually use:

```tsx
React.ChangeEvent<HTMLInputElement>     // text inputs, checkboxes
React.ChangeEvent<HTMLSelectElement>    // <select> / Form.Select
React.ChangeEvent<HTMLTextAreaElement>
React.FormEvent<HTMLFormElement>        // form submit
React.MouseEvent<HTMLButtonElement>     // clicks
React.KeyboardEvent<HTMLInputElement>   // key presses
```

**The shortcut worth knowing:** when the handler is written *inline*, TypeScript infers the event type from context and you don't annotate anything:

```tsx
<Form.Control onChange={(e) => setTitle(e.target.value)} />   // e is inferred ✅
```

You only annotate when the handler is defined separately:

```tsx
function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
  setTitle(e.target.value)
}
```

**Naming convention:** the prop is `onSomething`, the handler is `handleSomething`. Consistency here makes components readable at a glance.

---

## 🔨 Build Step 4 — Make tasks completable

State lives in `App` because more than one child will eventually need it.

Update `src/components/TaskCard.tsx`:

```tsx
import { Card, Badge, Button, Form } from "react-bootstrap"
import { Trash } from "react-bootstrap-icons"
import type { Priority, Task } from "@/types"

const priorityVariant: Record<Priority, string> = {
  high: "danger",
  medium: "primary",
  low: "secondary",
}

interface TaskCardProps {
  task: Task
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

export default function TaskCard({ task, onToggle, onDelete }: TaskCardProps) {
  return (
    <Card className="mb-2">
      <Card.Body className="d-flex align-items-center gap-3 py-3">
        <Form.Check
          type="checkbox"
          checked={task.done}
          onChange={() => onToggle(task.id)}
          aria-label={`Mark ${task.title} as ${task.done ? "not done" : "done"}`}
        />

        <span
          className={
            task.done
              ? "flex-grow-1 text-muted text-decoration-line-through"
              : "flex-grow-1 fw-medium"
          }
        >
          {task.title}
        </span>

        <Badge bg={priorityVariant[task.priority]}>{task.priority}</Badge>

        <Button
          variant="link"
          size="sm"
          className="text-secondary p-1"
          onClick={() => onDelete(task.id)}
          aria-label={`Delete ${task.title}`}
        >
          <Trash size={16} />
        </Button>
      </Card.Body>
    </Card>
  )
}
```

Update `src/components/TaskList.tsx` to forward the callbacks:

```tsx
import TaskCard from "@/components/TaskCard"
import type { Task } from "@/types"

interface TaskListProps {
  tasks: Task[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

export default function TaskList({ tasks, onToggle, onDelete }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="border border-2 border-dashed rounded-3 text-center py-5 text-muted">
        <p className="fw-semibold mb-1 text-body">No tasks yet</p>
        <p className="small mb-0">Add your first task to get started.</p>
      </div>
    )
  }

  return (
    <div>
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
```

Update `src/App.tsx`:

```tsx
import { useState } from "react"
import { Container } from "react-bootstrap"
import Header from "@/components/Header"
import TaskList from "@/components/TaskList"
import { seedTasks } from "@/data/seed"
import type { Task } from "@/types"

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(seedTasks)

  function handleToggle(id: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    )
  }

  function handleDelete(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div className="min-vh-100 bg-body-tertiary">
      <Header title="TaskBoard" subtitle="Everything you're working on, in one place." />
      <Container className="py-4" style={{ maxWidth: 768 }}>
        <TaskList tasks={tasks} onToggle={handleToggle} onDelete={handleDelete} />
      </Container>
    </div>
  )
}
```

The app is now interactive. Both handlers use the updater form and produce new arrays — never mutating.

Note `Form.Check` uses `onChange`, not a custom `onCheckedChange`. React-Bootstrap components are thin wrappers over real HTML elements, so standard DOM event names apply throughout.

**Try it yourself:** delete every task and watch the empty state appear automatically. Nobody wrote code to show it; it falls out of state changing.

---

# 8. Forms & controlled components

In a **controlled component**, React state is the single source of truth for the input's value.

```tsx
const [title, setTitle] = useState("")

<Form.Control value={title} onChange={(e) => setTitle(e.target.value)} />
```

The loop: user types → `onChange` fires → state updates → re-render → input shows the new value. It feels circular, but it means the value in state is *always* what's on screen, which makes validation, formatting, and resetting trivial.

**Common error:** `value` without `onChange` gives a read-only input and a console warning. Either add the handler or use `defaultValue` for an uncontrolled input.

### Multiple fields in one state object

```tsx
const [form, setForm] = useState<NewTask>({ title: "", priority: "medium" })

function update<K extends keyof NewTask>(field: K, value: NewTask[K]) {
  setForm((prev) => ({ ...prev, [field]: value }))
}

update("title", "Write notes")     // ✅
update("priority", "high")         // ✅
update("priority", "urgent")       // ❌ not assignable to Priority
update("titel", "typo")            // ❌ not a key of NewTask
```

That generic signature is worth understanding, because the pattern recurs everywhere. `K extends keyof NewTask` means "K is one of this object's key names", and `NewTask[K]` means "the type of the value at that key". So the second argument's type *depends on* the first argument's value. A plain `(field: string, value: any)` would accept both mistakes above.

Note the parentheses around the returned object literal — without them JavaScript reads `{` as a function body.

### Typing the Select

`Form.Select` fires a `ChangeEvent<HTMLSelectElement>` whose `e.target.value` is `string`, not your union. You need a cast or a guard at that boundary:

```tsx
// Simple: assert, since the options are the only source of values
onChange={(e) => setPriority(e.target.value as Priority)}

// Safer: validate, so bad data can never enter state
const isPriority = (v: string): v is Priority =>
  ["low", "medium", "high"].includes(v)

onChange={(e) => { if (isPriority(e.target.value)) setPriority(e.target.value) }}
```

`v is Priority` is a **type predicate** — it tells TypeScript that a `true` return means the value really is a `Priority`, so it narrows the type inside the `if`. Use the assertion for hard-coded options you control; use the guard for anything coming from outside your app.

### Validation

Keep it simple: validate on submit, store an error string in state, render it conditionally.

```tsx
function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault()
  if (!title.trim()) {
    setError("Title is required")
    return
  }
  setError("")
  onAdd({ title: title.trim(), priority })
  setTitle("")
}
```

For real applications with many fields, move to **react-hook-form + zod** — zod is especially good in TypeScript because a schema *generates* the type, so validation and types can never drift apart. Learn it manually first so you understand what the library does for you.

---

## 🔨 Build Step 5 — Add-task form

Create `src/components/AddTaskForm.tsx`:

```tsx
import { useState } from "react"
import { Card, Form, Button, Row, Col } from "react-bootstrap"
import { Plus } from "react-bootstrap-icons"
import type { NewTask, Priority } from "@/types"

interface AddTaskFormProps {
  onAdd: (task: NewTask) => void
}

export default function AddTaskForm({ onAdd }: AddTaskFormProps) {
  const [title, setTitle] = useState("")
  const [priority, setPriority] = useState<Priority>("medium")
  const [error, setError] = useState("")

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!title.trim()) {
      setError("Give the task a title.")
      return
    }

    onAdd({ title: title.trim(), priority })
    setTitle("")
    setPriority("medium")
    setError("")
  }

  return (
    <Card className="mb-4">
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          <Row className="g-3 align-items-end">
            <Col xs={12} sm>
              <Form.Group controlId="task-title">
                <Form.Label>Task</Form.Label>
                <Form.Control
                  placeholder="What needs doing?"
                  value={title}
                  isInvalid={Boolean(error)}
                  onChange={(e) => {
                    setTitle(e.target.value)
                    if (error) setError("")
                  }}
                />
                <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col xs={7} sm="auto">
              <Form.Group controlId="task-priority">
                <Form.Label>Priority</Form.Label>
                <Form.Select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col xs={5} sm="auto">
              <Button type="submit" className="w-100">
                <Plus size={18} className="me-1" />
                Add
              </Button>
            </Col>
          </Row>
        </Form>
      </Card.Body>
    </Card>
  )
}
```

Wire it into `App.tsx` — add the handler:

```tsx
function handleAdd({ title, priority }: NewTask) {
  const newTask: Task = {
    id: crypto.randomUUID(),
    title,
    priority,
    done: false,
    createdAt: Date.now(),
  }
  setTasks((prev) => [newTask, ...prev])
}
```

and render the form above the list:

```tsx
<Container className="py-4" style={{ maxWidth: 768 }}>
  <AddTaskForm onAdd={handleAdd} />
  <TaskList tasks={tasks} onToggle={handleToggle} onDelete={handleDelete} />
</Container>
```

(Remember to import `AddTaskForm` and the `NewTask` type.)

Three things worth noticing. First, `isInvalid` + `Form.Control.Feedback` is Bootstrap's built-in validation display — no custom error markup needed. Second, `controlId` on `Form.Group` wires the label to the input automatically, so you never write `htmlFor` and `id` by hand. Third, the form state lives *inside* `AddTaskForm` while the task list lives in `App`. Form state is local; only the finished result travels upward. **Keep state as low as it can go.**

**Try it yourself:** submit with an empty title, confirm the red feedback shows, then watch it clear as you type.

---

# 9. Lifting state up

When two components need the same data, move that state to their **closest common ancestor** and pass it down.

```
        App  ← state lives here
       /   \
  Form      List
  (writes)  (reads)
```

You've already done this: `tasks` lives in `App` because `AddTaskForm` writes to it and `TaskList` reads it. Neither sibling can see the other's state, so the parent holds it.

The trade-off is **prop drilling** — passing props through components that don't use them, just to reach a descendant. Two or three levels is fine and often clearer than the alternative. Beyond that, reach for Context (§14).

**Rule of thumb:** start with state as local as possible. Lift it only when a second component genuinely needs it. Premature lifting makes components harder to reuse and re-renders larger than they need to be.

---

# 10. Derived state

**If you can calculate it from existing state, don't store it in state.**

```tsx
// ❌ redundant state — now you have two things to keep in sync
const [tasks, setTasks] = useState<Task[]>([])
const [completedCount, setCompletedCount] = useState(0)

// ✅ derive it during render
const [tasks, setTasks] = useState<Task[]>([])
const completedCount = tasks.filter((t) => t.done).length
```

Every piece of duplicated state is a bug waiting to happen — some code path will update one and forget the other. Derived values are always correct because they're recomputed from the source on every render.

Things that should almost always be derived: filtered lists, sorted lists, totals and counts, "is the form valid", "are all items selected", search results.

Things that genuinely belong in state: the raw data, and the user's *inputs* to the derivation (the search text, the active filter, the sort column).

```tsx
const [tasks, setTasks] = useState<Task[]>([])    // source of truth
const [filter, setFilter] = useState<Filter>("all")  // user input
const [query, setQuery] = useState("")               // user input

// everything below is derived
const visible = tasks
  .filter((t) => (filter === "all" ? true : filter === "done" ? t.done : !t.done))
  .filter((t) => t.title.toLowerCase().includes(query.toLowerCase()))
```

Only optimise this with `useMemo` when profiling shows it's slow (§16). Filtering a few hundred items on every render is not slow.

---

## 🔨 Build Step 6 — Filters, search, and stats

Create `src/components/TaskStats.tsx`:

```tsx
import { ProgressBar } from "react-bootstrap"

interface TaskStatsProps {
  total: number
  completed: number
}

export default function TaskStats({ total, completed }: TaskStatsProps) {
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100)

  return (
    <div className="mb-3">
      <div className="d-flex justify-content-between small text-muted mb-1">
        <span>{completed} of {total} complete</span>
        <span>{percent}%</span>
      </div>
      <ProgressBar now={percent} style={{ height: 6 }} variant="success" />
    </div>
  )
}
```

Create `src/components/TaskToolbar.tsx`:

```tsx
import { Nav, Form, InputGroup } from "react-bootstrap"
import { Search } from "react-bootstrap-icons"
import type { Filter } from "@/types"

interface TaskToolbarProps {
  filter: Filter
  onFilterChange: (filter: Filter) => void
  query: string
  onQueryChange: (query: string) => void
}

const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "done", label: "Done" },
]

export default function TaskToolbar({
  filter,
  onFilterChange,
  query,
  onQueryChange,
}: TaskToolbarProps) {
  return (
    <div className="d-flex flex-column flex-sm-row justify-content-between gap-3 mb-3">
      <Nav
        variant="pills"
        activeKey={filter}
        onSelect={(key) => key && onFilterChange(key as Filter)}
      >
        {filters.map(({ key, label }) => (
          <Nav.Item key={key}>
            <Nav.Link eventKey={key}>{label}</Nav.Link>
          </Nav.Item>
        ))}
      </Nav>

      <InputGroup style={{ maxWidth: 260 }}>
        <InputGroup.Text className="bg-white border-end-0">
          <Search size={14} className="text-muted" />
        </InputGroup.Text>
        <Form.Control
          className="border-start-0"
          placeholder="Search tasks"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </InputGroup>
    </div>
  )
}
```

`Nav`'s `onSelect` gives you `string | null`, hence the `key &&` guard and the cast — a good example of TypeScript making you handle a case you'd otherwise forget.

Update `src/App.tsx` completely:

```tsx
import { useState } from "react"
import { Container } from "react-bootstrap"
import Header from "@/components/Header"
import TaskList from "@/components/TaskList"
import AddTaskForm from "@/components/AddTaskForm"
import TaskToolbar from "@/components/TaskToolbar"
import TaskStats from "@/components/TaskStats"
import { seedTasks } from "@/data/seed"
import type { Filter, NewTask, Task } from "@/types"

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(seedTasks)
  const [filter, setFilter] = useState<Filter>("all")
  const [query, setQuery] = useState("")

  function handleAdd({ title, priority }: NewTask) {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      priority,
      done: false,
      createdAt: Date.now(),
    }
    setTasks((prev) => [newTask, ...prev])
  }

  function handleToggle(id: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  }

  function handleDelete(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  // ---- derived values (not state) ----
  const completed = tasks.filter((t) => t.done).length

  const visibleTasks = tasks
    .filter((t) => {
      if (filter === "active") return !t.done
      if (filter === "done") return t.done
      return true
    })
    .filter((t) => t.title.toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <div className="min-vh-100 bg-body-tertiary">
      <Header title="TaskBoard" subtitle="Everything you're working on, in one place." />
      <Container className="py-4" style={{ maxWidth: 768 }}>
        <AddTaskForm onAdd={handleAdd} />
        <TaskStats total={tasks.length} completed={completed} />
        <TaskToolbar
          filter={filter}
          onFilterChange={setFilter}
          query={query}
          onQueryChange={setQuery}
        />
        <TaskList tasks={visibleTasks} onToggle={handleToggle} onDelete={handleDelete} />
      </Container>
    </div>
  )
}
```

`completed` and `visibleTasks` are recomputed on every render and are therefore never stale. There is exactly one source of truth: `tasks`.

Note that `onFilterChange={setFilter}` type-checks only because `setFilter` is `(f: Filter) => void` and the prop expects exactly that. If you'd typed the state as `string`, this would silently accept invalid filters.

**Try it yourself:** filter to "Done" and tick a task off. It vanishes from view immediately — no code coordinates that, it's just the derivation re-running.

---

# 11. `useEffect` & side effects

Rendering should be pure. Anything that reaches outside React — network calls, timers, subscriptions, `localStorage`, direct DOM work — is a **side effect** and belongs in `useEffect`.

```tsx
useEffect(() => {
  // effect body: runs after render
  return () => {
    // optional cleanup: runs before the next effect and on unmount
  }
}, [dependencies])
```

### The dependency array controls when it runs

```tsx
useEffect(() => { /* ... */ })            // after EVERY render — almost always wrong
useEffect(() => { /* ... */ }, [])        // once, after the first render
useEffect(() => { /* ... */ }, [userId])  // whenever userId changes
```

The rule React enforces via lint: **every value from component scope used inside the effect must be in the array.** Omitting dependencies to "make it run less" produces stale closures — the effect keeps seeing values from an old render.

### Cleanup

Anything you start, you must be able to stop:

```tsx
useEffect(() => {
  const id = setInterval(() => setNow(Date.now()), 1000)
  return () => clearInterval(id)     // ← without this, intervals pile up
}, [])
```

Same for event listeners (`removeEventListener`), subscriptions (`unsubscribe`), and in-flight fetches (`AbortController`).

### `useEffect` is overused

Before writing one, check whether you need it at all:

| Situation | Use an effect? |
|---|---|
| Transform data for display | **No** — derive it during render (§10) |
| Respond to a user action | **No** — do it in the event handler |
| Reset state when a prop changes | **No** — use a `key` prop to remount instead |
| Sync with `localStorage` | Yes |
| Fetch data on mount | Yes (or better: a data library) |
| Subscribe to a browser API / websocket | Yes |
| Set up a timer | Yes |

The single most common beginner mistake is computing derived state in an effect and storing it back in state. It causes a double render, and it can go stale. Derive during render instead.

### Strict Mode runs effects twice

In development, React 18+ mounts, unmounts, and remounts every component to surface missing cleanup. Seeing your effect fire twice is **expected** and means Strict Mode is doing its job. Write correct cleanup rather than disabling it.

> **TS Note.** A common error: `useEffect(async () => { ... })` won't compile, because an effect must return `void` or a cleanup function, and an `async` function returns a `Promise`. Define the async function inside and call it:
> ```tsx
> useEffect(() => {
>   async function load() { /* ... */ }
>   void load()
> }, [])
> ```

---

## 🔨 Build Step 7 — Persist to localStorage

Update the state declaration in `App.tsx`:

```tsx
import { useState, useEffect } from "react"

const STORAGE_KEY = "taskboard.tasks"

// ...inside App:
const [tasks, setTasks] = useState<Task[]>(() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? (JSON.parse(saved) as Task[]) : seedTasks
  } catch {
    return seedTasks
  }
})

useEffect(() => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}, [tasks])
```

Four deliberate choices here:

1. **Lazy initialiser** (`useState(() => ...)`) reads storage once on mount instead of on every render.
2. **`try/catch`** because stored JSON can be corrupt, and `localStorage` throws in some privacy modes.
3. **`[tasks]` dependency** so the save runs whenever tasks change — and only then.
4. **`as Task[]`** because `JSON.parse` returns `any`. This is an honest limitation: TypeScript cannot verify data from outside your program. The cast documents an assumption you're choosing to make. In production, validate the parsed shape with zod instead of asserting it.

Reload the browser. Your tasks survive.

**Try it yourself:** open DevTools → Application → Local Storage and watch the value update as you add tasks. Then corrupt the stored JSON by hand and confirm the `catch` recovers.

---

# 12. Custom hooks

A custom hook is a function whose name starts with `use` and which calls other hooks. That's the entire definition. They exist to extract and reuse **stateful logic** — not markup.

```tsx
function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key)
      return saved ? (JSON.parse(saved) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue] as const
}

// used exactly like useState — and fully typed
const [tasks, setTasks] = useLocalStorage<Task[]>("tasks", [])
```

Two TypeScript details make this work properly:

- **`<T>` generic** — the hook works with any value type, and the caller's type flows through. `useLocalStorage<Task[]>(...)` gives you `Task[]`, not `any`.
- **`as const` on the return** — without it, TypeScript infers `(T | Dispatch<SetStateAction<T>>)[]`, an array of the union, and destructuring gives both variables that useless union type. `as const` makes it a **tuple** `[T, Dispatch<SetStateAction<T>>]`, so `tasks` and `setTasks` get their correct individual types. Any time a hook returns an array meant to be destructured positionally, you want `as const`.

**Rules of hooks** (these apply to built-in and custom hooks alike):

1. Only call hooks at the **top level** of a component or another hook — never inside conditions, loops, or nested functions. React tracks hooks by call order, so the order must be identical on every render.
2. Only call them from **React functions** — components or other hooks. Not from plain utility functions or event handlers.

The ESLint plugin `eslint-plugin-react-hooks` catches violations of both. Keep it enabled.

**Each call gets its own state.** Two components using `useLocalStorage` don't share anything except the code — this is not a store.

---

## 🔨 Build Step 8 — Extract custom hooks

Create `src/hooks/useLocalStorage.ts`:

```ts
import { useState, useEffect } from "react"

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key)
      return saved ? (JSON.parse(saved) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // storage full or unavailable — fail quietly
    }
  }, [key, value])

  return [value, setValue] as const
}
```

Create `src/hooks/useTasks.ts` — all task logic in one place:

```ts
import { useLocalStorage } from "@/hooks/useLocalStorage"
import type { NewTask, Task } from "@/types"

export function useTasks(initialTasks: Task[] = []) {
  const [tasks, setTasks] = useLocalStorage<Task[]>("taskboard.tasks", initialTasks)

  function addTask({ title, priority }: NewTask) {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      priority,
      done: false,
      createdAt: Date.now(),
    }
    setTasks((prev) => [newTask, ...prev])
  }

  function toggleTask(id: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  }

  function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  function updateTask(id: string, changes: Partial<Task>) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...changes } : t)))
  }

  return { tasks, addTask, toggleTask, deleteTask, updateTask }
}
```

`Partial<Task>` on `updateTask` is exactly right: any subset of a task's fields, each still correctly typed. `updateTask(id, { done: "yes" })` is a compile error; `updateTask(id, { title: "New" })` is fine.

The hook returns an **object**, not an array, so no `as const` is needed — object properties keep their types automatically. Use a tuple return only when the caller should be able to rename the values freely, as with `useState`.

`App.tsx` becomes dramatically thinner:

```tsx
import { useState } from "react"
import { Container } from "react-bootstrap"
import Header from "@/components/Header"
import TaskList from "@/components/TaskList"
import AddTaskForm from "@/components/AddTaskForm"
import TaskToolbar from "@/components/TaskToolbar"
import TaskStats from "@/components/TaskStats"
import { useTasks } from "@/hooks/useTasks"
import { seedTasks } from "@/data/seed"
import type { Filter } from "@/types"

export default function App() {
  const { tasks, addTask, toggleTask, deleteTask } = useTasks(seedTasks)
  const [filter, setFilter] = useState<Filter>("all")
  const [query, setQuery] = useState("")

  const completed = tasks.filter((t) => t.done).length

  const visibleTasks = tasks
    .filter((t) => {
      if (filter === "active") return !t.done
      if (filter === "done") return t.done
      return true
    })
    .filter((t) => t.title.toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <div className="min-vh-100 bg-body-tertiary">
      <Header title="TaskBoard" subtitle="Everything you're working on, in one place." />
      <Container className="py-4" style={{ maxWidth: 768 }}>
        <AddTaskForm onAdd={addTask} />
        <TaskStats total={tasks.length} completed={completed} />
        <TaskToolbar
          filter={filter}
          onFilterChange={setFilter}
          query={query}
          onQueryChange={setQuery}
        />
        <TaskList tasks={visibleTasks} onToggle={toggleTask} onDelete={deleteTask} />
      </Container>
    </div>
  )
}
```

The component now reads as a description of the UI. The *how* moved into hooks. This is the refactor that separates tidy React codebases from sprawling ones.

---

# 13. `useReducer`

When state updates get complex — many related fields, or transitions that depend on the current state — a reducer centralises the logic.

### Typing actions: the discriminated union

This is where TypeScript is at its most impressive, so it's worth slowing down.

```ts
type TaskAction =
  | { type: "added"; title: string; priority: Priority }
  | { type: "toggled"; id: string }
  | { type: "updated"; id: string; changes: Partial<Task> }
  | { type: "deleted"; id: string }
  | { type: "clearedCompleted" }
```

Each member shares a common literal field (`type`) — the **discriminant**. Inside a `switch` on that field, TypeScript narrows the action to exactly one member:

```ts
function tasksReducer(state: Task[], action: TaskAction): Task[] {
  switch (action.type) {
    case "added":
      // here action is { type: "added"; title: string; priority: Priority }
      // action.id would be a compile error — it doesn't exist on this member
      return [makeTask(action.title, action.priority), ...state]

    case "toggled":
      // here action.id exists and is string
      return state.map((t) => (t.id === action.id ? { ...t, done: !t.done } : t))

    default:
      return state
  }
}
```

What you get from this, for free:

- **Autocomplete on `dispatch`.** Type `dispatch({ type: "` and your editor lists every valid action.
- **Required payloads.** `dispatch({ type: "toggled" })` is an error — `id` is missing.
- **No invalid actions.** `dispatch({ type: "togled", id })` is caught at compile time.
- **Exhaustiveness checking**, if you want it:

```ts
default: {
  const _exhaustive: never = action
  throw new Error(`Unhandled action: ${JSON.stringify(_exhaustive)}`)
}
```

If every case is handled, `action` is `never` here and it compiles. Add a new action to the union and forget its case, and this line fails to compile — TypeScript points you straight at the gap. This single trick prevents a whole category of bugs as an app grows.

**A reducer is a pure function `(state, action) => newState`.** No fetching, no timers, no mutation. That purity is what makes it trivially testable — you can unit test every transition without rendering anything.

### `useState` or `useReducer`?

| Use `useState` | Use `useReducer` |
|---|---|
| Independent values | Several values that change together |
| Simple set operations | Next state depends on current state in non-trivial ways |
| Few update paths | Many actions, or the same update fired from many places |
| — | You want update logic testable in isolation |

Both are equally valid. Reducers pay off as the number of distinct actions grows — and in TypeScript, they pay off sooner, because the action union documents every way your state can change in one readable block.

---

# 14. Context API

Context lets a value pass through the tree without threading props at every level. It solves **prop drilling**, and that's all it solves.

Three pieces: create, provide, consume.

```tsx
import { createContext, useContext, useState, type ReactNode } from "react"

interface ThemeContextValue {
  theme: "light" | "dark"
  setTheme: (theme: "light" | "dark") => void
}

// 1. create — null default, so a missing provider is detectable
const ThemeContext = createContext<ThemeContextValue | null>(null)

// 2. provide
function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light")
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// 3. consume — via a custom hook that narrows away the null
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>")
  return ctx
}
```

That `useTheme` wrapper is doing double duty, and it's the standard pattern:

- **At runtime** it throws a clear error instead of a confusing `Cannot read property of null` deep in a child.
- **At compile time** the `if (!ctx) throw` narrows the type from `ThemeContextValue | null` to `ThemeContextValue`, so every consumer gets a non-nullable value and never writes `ctx?.theme`.

**Always export the hook, never the raw context.**

**Caveats worth knowing:**

- Every consumer re-renders when the context value changes. Split unrelated concerns into separate contexts rather than one giant app context.
- Passing an object literal as `value` creates a new reference on every render, re-rendering all consumers. Memoise it (§16) if the provider re-renders often.
- Context is **not** a state manager — it's a transport mechanism. For server data, use TanStack Query. For large client state with heavy update patterns, consider Zustand or Redux Toolkit (which is excellent in TypeScript).

---

## 🔨 Build Step 9 — Context + reducer refactor

This replaces the `useTasks` hook from Step 8 with a context-backed version, so `TaskCard` can talk to the store directly instead of receiving callbacks through two layers.

Create `src/context/TaskContext.tsx`:

```tsx
import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
  type Dispatch,
} from "react"
import type { Priority, Task } from "@/types"

const STORAGE_KEY = "taskboard.tasks"

export type TaskAction =
  | { type: "added"; title: string; priority: Priority }
  | { type: "toggled"; id: string }
  | { type: "updated"; id: string; changes: Partial<Task> }
  | { type: "deleted"; id: string }
  | { type: "clearedCompleted" }

interface TaskContextValue {
  tasks: Task[]
  dispatch: Dispatch<TaskAction>
}

const TaskContext = createContext<TaskContextValue | null>(null)

function tasksReducer(state: Task[], action: TaskAction): Task[] {
  switch (action.type) {
    case "added":
      return [
        {
          id: crypto.randomUUID(),
          title: action.title,
          priority: action.priority,
          done: false,
          createdAt: Date.now(),
        },
        ...state,
      ]

    case "toggled":
      return state.map((t) => (t.id === action.id ? { ...t, done: !t.done } : t))

    case "updated":
      return state.map((t) => (t.id === action.id ? { ...t, ...action.changes } : t))

    case "deleted":
      return state.filter((t) => t.id !== action.id)

    case "clearedCompleted":
      return state.filter((t) => !t.done)

    default: {
      const _exhaustive: never = action
      throw new Error(`Unhandled action: ${JSON.stringify(_exhaustive)}`)
    }
  }
}

function init(fallback: Task[]): Task[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? (JSON.parse(saved) as Task[]) : fallback
  } catch {
    return fallback
  }
}

interface TaskProviderProps {
  children: ReactNode
  initialTasks?: Task[]
}

export function TaskProvider({ children, initialTasks = [] }: TaskProviderProps) {
  const [tasks, dispatch] = useReducer(tasksReducer, initialTasks, init)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks])

  return (
    <TaskContext.Provider value={{ tasks, dispatch }}>
      {children}
    </TaskContext.Provider>
  )
}

export function useTaskContext(): TaskContextValue {
  const ctx = useContext(TaskContext)
  if (!ctx) throw new Error("useTaskContext must be used inside <TaskProvider>")
  return ctx
}
```

Note `useReducer(reducer, initialArg, init)` — the third argument is a lazy initialiser, same idea as `useState(() => ...)`. TypeScript infers the state type from the reducer signature, so no explicit generic is needed.

Wrap the app in `src/main.tsx`:

```tsx
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "bootstrap/dist/css/bootstrap.min.css"
import "./index.css"
import App from "./App.tsx"
import { TaskProvider } from "@/context/TaskContext"
import { seedTasks } from "@/data/seed"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TaskProvider initialTasks={seedTasks}>
      <App />
    </TaskProvider>
  </StrictMode>
)
```

`TaskCard` now reaches the store itself — no `onToggle`/`onDelete` props:

```tsx
import { Card, Badge, Button, Form } from "react-bootstrap"
import { Trash, Pencil } from "react-bootstrap-icons"
import { useTaskContext } from "@/context/TaskContext"
import type { Priority, Task } from "@/types"

const priorityVariant: Record<Priority, string> = {
  high: "danger",
  medium: "primary",
  low: "secondary",
}

interface TaskCardProps {
  task: Task
  onEdit: (task: Task) => void
}

export default function TaskCard({ task, onEdit }: TaskCardProps) {
  const { dispatch } = useTaskContext()

  return (
    <Card className="mb-2">
      <Card.Body className="d-flex align-items-center gap-3 py-3">
        <Form.Check
          type="checkbox"
          checked={task.done}
          onChange={() => dispatch({ type: "toggled", id: task.id })}
          aria-label={`Mark ${task.title} as ${task.done ? "not done" : "done"}`}
        />

        <span
          className={
            task.done
              ? "flex-grow-1 text-muted text-decoration-line-through"
              : "flex-grow-1 fw-medium"
          }
        >
          {task.title}
        </span>

        <Badge bg={priorityVariant[task.priority]}>{task.priority}</Badge>

        <Button
          variant="link"
          size="sm"
          className="text-secondary p-1"
          onClick={() => onEdit(task)}
          aria-label={`Edit ${task.title}`}
        >
          <Pencil size={16} />
        </Button>

        <Button
          variant="link"
          size="sm"
          className="text-secondary p-1"
          onClick={() => dispatch({ type: "deleted", id: task.id })}
          aria-label={`Delete ${task.title}`}
        >
          <Trash size={16} />
        </Button>
      </Card.Body>
    </Card>
  )
}
```

Simplify `TaskList.tsx` — it only forwards `onEdit` now:

```tsx
import TaskCard from "@/components/TaskCard"
import type { Task } from "@/types"

interface TaskListProps {
  tasks: Task[]
  onEdit: (task: Task) => void
}

export default function TaskList({ tasks, onEdit }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="border border-2 border-dashed rounded-3 text-center py-5 text-muted">
        <p className="fw-semibold mb-1 text-body">Nothing here</p>
        <p className="small mb-0">Try a different filter, or add a task.</p>
      </div>
    )
  }

  return (
    <div>
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} onEdit={onEdit} />
      ))}
    </div>
  )
}
```

And `App.tsx`:

```tsx
import { useState } from "react"
import { Container } from "react-bootstrap"
import Header from "@/components/Header"
import TaskList from "@/components/TaskList"
import AddTaskForm from "@/components/AddTaskForm"
import TaskToolbar from "@/components/TaskToolbar"
import TaskStats from "@/components/TaskStats"
import { useTaskContext } from "@/context/TaskContext"
import type { Filter, Task } from "@/types"

export default function App() {
  const { tasks, dispatch } = useTaskContext()
  const [filter, setFilter] = useState<Filter>("all")
  const [query, setQuery] = useState("")
  const [editing, setEditing] = useState<Task | null>(null)

  const completed = tasks.filter((t) => t.done).length

  const visibleTasks = tasks
    .filter((t) => {
      if (filter === "active") return !t.done
      if (filter === "done") return t.done
      return true
    })
    .filter((t) => t.title.toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <div className="min-vh-100 bg-body-tertiary">
      <Header title="TaskBoard" subtitle="Everything you're working on, in one place." />
      <Container className="py-4" style={{ maxWidth: 768 }}>
        <AddTaskForm
          onAdd={({ title, priority }) => dispatch({ type: "added", title, priority })}
        />
        <TaskStats total={tasks.length} completed={completed} />
        <TaskToolbar
          filter={filter}
          onFilterChange={setFilter}
          query={query}
          onQueryChange={setQuery}
        />
        <TaskList tasks={visibleTasks} onEdit={setEditing} />
      </Container>
    </div>
  )
}
```

Compare this `App.tsx` with Step 6's. Same behaviour, far less plumbing.

**Try it yourself:** add a "Clear completed" button that dispatches `{ type: "clearedCompleted" }`. The reducer case already exists — you only need the button. Then try dispatching a misspelled action type and see the compile error.

---

# 15. Refs with `useRef`

`useRef` gives you a mutable box that **survives re-renders and does not trigger them**.

Two distinct uses:

**1. Access a DOM node:**

```tsx
const inputRef = useRef<HTMLInputElement>(null)

useEffect(() => {
  inputRef.current?.focus()
}, [])

<Form.Control ref={inputRef} />
```

The generic names the element type, so `inputRef.current` is `HTMLInputElement | null` and you get full autocomplete on it. The `null` initial value plus optional chaining handles the fact that the ref is empty during the first render.

**2. Hold a mutable value that isn't UI state:**

```tsx
const timerRef = useRef<number | null>(null)

function start() {
  timerRef.current = window.setInterval(tick, 1000)
}
function stop() {
  if (timerRef.current !== null) clearInterval(timerRef.current)
}
```

Use `window.setInterval` in the browser — the global `setInterval` may resolve to Node's typings (which return a `Timeout` object rather than a number) once `@types/node` is installed.

**Ref vs state:** changing `ref.current` does **not** re-render. If the value should appear on screen, it belongs in state. If it's bookkeeping — a timer ID, a previous value, a DOM handle — use a ref.

Never read or write `ref.current` *during* render. Do it in effects and event handlers.

---

## 🔨 Build Step 10 — Edit modal with autofocus

Create `src/components/EditTaskModal.tsx`:

```tsx
import { useState, useEffect, useRef } from "react"
import { Modal, Button, Form } from "react-bootstrap"
import { useTaskContext } from "@/context/TaskContext"
import type { Task } from "@/types"

interface EditTaskModalProps {
  task: Task | null
  show: boolean
  onHide: () => void
}

export default function EditTaskModal({ task, show, onHide }: EditTaskModalProps) {
  const { dispatch } = useTaskContext()
  const [title, setTitle] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  // sync the local draft whenever a different task is opened
  useEffect(() => {
    if (task) setTitle(task.title)
  }, [task])

  function handleSave() {
    const trimmed = title.trim()
    if (!trimmed || !task) return
    dispatch({ type: "updated", id: task.id, changes: { title: trimmed } })
    onHide()
  }

  return (
    <Modal show={show} onHide={onHide} onEntered={() => inputRef.current?.focus()} centered>
      <Modal.Header closeButton>
        <Modal.Title>Edit task</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form.Group controlId="edit-title">
          <Form.Label>Task</Form.Label>
          <Form.Control
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave()
            }}
          />
        </Form.Group>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cancel</Button>
        <Button onClick={handleSave} disabled={!title.trim()}>Save changes</Button>
      </Modal.Footer>
    </Modal>
  )
}
```

Render it in `App.tsx`, just inside the `Container`:

```tsx
<EditTaskModal
  task={editing}
  show={editing !== null}
  onHide={() => setEditing(null)}
/>
```

Three things to notice:

- **`onEntered`** is React-Bootstrap's callback for "the enter transition has finished". Focusing there is more reliable than a `useEffect` with a `setTimeout`, because the modal is genuinely mounted and visible by then. Reach for the library's own lifecycle hooks before improvising.
- **`show={editing !== null}`** is **derived** from `editing` rather than being separate state. One value, no chance of the two disagreeing.
- **`!trimmed || !task`** — TypeScript forces the `task` null check before `task.id`, which is exactly the guard you'd want and would probably forget in plain JavaScript.

---

# 16. Performance: `memo`, `useMemo`, `useCallback`

Read this section last and apply it least. **Measure before optimising** — use the React DevTools Profiler. Most React apps are fast without any of this, and premature memoisation adds complexity and its own overhead.

### `React.memo` — skip re-rendering a component

```tsx
const TaskCard = memo(function TaskCard({ task, onEdit }: TaskCardProps) {
  return /* ... */
})
```

Skips the re-render if props are shallowly equal to last time. Useless if you pass a new object or inline arrow function as a prop each render — which is why the next two hooks exist.

### `useMemo` — cache an expensive calculation

```tsx
const sorted = useMemo(
  () => tasks.slice().sort((a, b) => b.createdAt - a.createdAt),
  [tasks]
)
```

Recomputes only when `tasks` changes. Worth it for genuinely expensive work over large datasets, or to keep an object/array reference stable for a memoised child. The return type is inferred, so no annotation is needed.

### `useCallback` — cache a function reference

```tsx
const handleToggle = useCallback((id: string) => {
  dispatch({ type: "toggled", id })
}, [dispatch])
```

`useCallback(fn, deps)` is just `useMemo(() => fn, deps)`. It matters only when the function is passed to a `memo`-ised child or used as an effect dependency. Annotate the parameters — they aren't inferred inside `useCallback`.

### When it's actually worth it

- Lists of hundreds or thousands of rows
- Genuinely heavy computation (parsing, large sorts, chart data prep)
- A context value object that would otherwise re-render every consumer

For TaskBoard's scale, none of this is needed — but here's the shape it would take:

```tsx
// in TaskContext.tsx
const value = useMemo(() => ({ tasks, dispatch }), [tasks])
return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>
```

`dispatch` is guaranteed stable by React, so only `tasks` needs to be a dependency.

### Free wins that beat memoisation

- **Keep state low.** State in a leaf re-renders one component; state at the root re-renders everything.
- **Pass elements as `children`.** Children created in a parent don't re-render when that parent's state changes.
- **Code-split routes** with `lazy` + `Suspense`:

```tsx
const Settings = lazy(() => import("./pages/Settings"))

<Suspense fallback={<Spinner animation="border" />}>
  <Settings />
</Suspense>
```

---

# 17. Data fetching

Two levels: how it works by hand, and what you'd actually use in production.

### By hand

```tsx
function TaskListPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      try {
        setLoading(true)
        const res = await fetch("/api/tasks", { signal: controller.signal })
        if (!res.ok) throw new Error(`Request failed: ${res.status}`)
        const data = (await res.json()) as Task[]
        setTasks(data)
        setError(null)
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message)
        }
      } finally {
        setLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [])

  if (loading) return <Spinner animation="border" />
  if (error) return <Alert variant="danger">{error}</Alert>
  return /* ... */
}
```

Five things to notice, because they're what people forget:

1. **`res.ok` check** — `fetch` does not reject on 404 or 500. Only network failures reject.
2. **`AbortController` cleanup** — prevents setting state after unmount and cancels stale requests.
3. **Ignoring `AbortError`** — an intentional cancellation isn't an error worth showing.
4. **Three states, always** — loading, error, success. A UI that only handles the happy path will look broken in the real world.
5. **`err` is `unknown`** in a modern TypeScript `catch` block, so you must narrow with `err instanceof Error` before touching `.message`. Annoying for about a week, then you realise how often you used to assume the thrown thing was an `Error`.

> **On `as Task[]`.** `res.json()` returns `Promise<any>`. The cast is a *claim*, not a check — if the API changes shape, TypeScript won't notice and you'll get a runtime error somewhere far away. For anything important, validate with **zod**:
> ```ts
> const TaskSchema = z.object({ id: z.string(), title: z.string(), /* ... */ })
> const tasks = z.array(TaskSchema).parse(await res.json())  // typed AND verified
> ```
> The schema produces the type *and* checks the data. This is the single best TypeScript habit for anything crossing a network boundary.

### In production, use a library

Hand-rolled fetching doesn't scale: no caching, no deduplication, no background refresh, no retry, and every component reimplements the same three states.

```tsx
import { useQuery } from "@tanstack/react-query"

function TaskListPage() {
  const { data, isLoading, error } = useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: () => fetch("/api/tasks").then((r) => r.json()),
  })

  if (isLoading) return <Spinner animation="border" />
  if (error) return <Alert variant="danger">{error.message}</Alert>
  return /* ... */
}
```

The conceptual point: **server state is not client state.** It's a cached copy of something that lives elsewhere, can go stale, and needs revalidating. Treating it like `useState` is the mistake TanStack Query exists to fix.

---

# 18. Routing (brief tour)

React has no built-in router. `react-router-dom` is the common choice.

```bash
npm install react-router-dom
```

```tsx
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useParams,
  Outlet,
} from "react-router-dom"
import { Navbar, Nav, Container } from "react-bootstrap"

function Layout() {
  return (
    <>
      <Navbar bg="light" expand="sm">
        <Container>
          <Nav>
            <Nav.Link as={Link} to="/">Board</Nav.Link>
            <Nav.Link as={Link} to="/settings">Settings</Nav.Link>
          </Nav>
        </Container>
      </Navbar>
      <Outlet />          {/* child route renders here */}
    </>
  )
}

function TaskDetail() {
  const { id } = useParams<{ id: string }>()   // typed params
  return <p>Task {id}</p>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Board />} />
          <Route path="/tasks/:id" element={<TaskDetail />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
```

Key ideas: `Outlet` renders nested routes inside a shared layout; `useParams` reads URL segments; `useNavigate` navigates programmatically; `path="*"` catches unmatched URLs.

Two integration details:

- **`as={Link}`** is React-Bootstrap's polymorphic prop — it renders `Nav.Link`'s Bootstrap styling using React Router's `Link` element, so you get correct styles *and* client-side navigation. Most React-Bootstrap components accept `as`, and it's fully typed: the props of the target element become available.
- **`useParams<{ id: string }>()`** gives named params. Be aware the values are `string | undefined` — a param can always be missing at runtime, so narrow before using it.

**The URL is state too.** Filters and search terms often belong in the query string (`useSearchParams`) rather than component state — it makes views shareable, bookmarkable, and survives refresh for free.

---

# Common mistakes and how to avoid them

| Mistake | Why it breaks | Fix |
|---|---|---|
| Mutating state directly | React compares by reference; no new reference means no re-render | Spread into a new object/array |
| `setCount(count + 1)` twice | Both read the same stale value | `setCount(c => c + 1)` |
| Reading state right after setting it | Updates apply on the next render | Use the value you just computed |
| `key={index}` on a dynamic list | React reuses the wrong DOM nodes on reorder/delete | Use a stable ID |
| `{count && <X/>}` | Renders `0` when count is zero | `{count > 0 && <X/>}` |
| Missing effect dependencies | Stale closures — effect sees old values | List every used value; keep the lint rule on |
| Effect with no cleanup | Timers/listeners/requests leak and stack up | Return a cleanup function |
| Storing derived data in state | Two sources of truth drift apart | Compute during render |
| `useEffect` to transform data | Extra render, can go stale | Derive during render |
| Calling a hook inside a condition | Breaks hook call order | Hooks at the top level, always |
| `<Button onClick={fn()}>` | Runs during render, not on click | `onClick={fn}` or `onClick={() => fn(arg)}` |
| Controlled input without `onChange` | Field appears frozen | Add the handler, or use `defaultValue` |
| One giant context for everything | Every consumer re-renders on any change | Split by concern |
| Memoising everything preemptively | Adds cost and complexity for no gain | Profile first |

### TypeScript-specific

| Mistake | Why it breaks | Fix |
|---|---|---|
| `useState([])` for a typed list | Infers `never[]`; nothing can be added | `useState<Task[]>([])` |
| `useState("all")` for a union | Infers `string`; typos compile | `useState<Filter>("all")` |
| Reaching for `any` | Disables checking for everything downstream | Use `unknown` and narrow, or type it properly |
| Returning an array from a hook without `as const` | Destructured values get a useless union type | `return [value, setValue] as const` |
| `catch (err) { err.message }` | `err` is `unknown` | `if (err instanceof Error)` |
| Casting `res.json()` and trusting it | A cast is a claim, not a check | Validate with zod at the boundary |
| Overusing `!` non-null assertion | Silences a real possibility of null | Narrow with `if`, or use `?.` |
| `React.FC<Props>` | Legacy; awkward `children` behaviour | Plain function with typed props |
| `useEffect(async () => ...)` | Effects can't return a Promise | Declare the async function inside |

### Bootstrap-specific

| Mistake | Why it breaks | Fix |
|---|---|---|
| Importing Bootstrap's JS bundle | Duplicates React-Bootstrap's behaviour | Import only the CSS |
| Importing the CSS after your own | Bootstrap overrides your overrides | Import `bootstrap.min.css` first |
| Installing `@types/react-bootstrap` | The package ships its own types | Don't; remove it if present |
| Using `class=` in JSX | Not valid JSX | `className=` |
| Fighting Bootstrap with inline styles | Unmaintainable | Use utility classes; customise via Sass variables |

---

# Hooks cheat sheet

| Hook | Purpose | Typed signature |
|---|---|---|
| `useState` | Local state | `const [v, setV] = useState<T>(init)` |
| `useEffect` | Side effects after render | `useEffect(fn, deps)` |
| `useContext` | Read a context value | `const v = useContext(Ctx)` |
| `useReducer` | State via reducer actions | `const [s, dispatch] = useReducer(fn, init)` |
| `useRef` | Mutable box / DOM handle | `const r = useRef<HTMLInputElement>(null)` |
| `useMemo` | Cache a computed value | `useMemo(fn, deps)` |
| `useCallback` | Cache a function reference | `useCallback(fn, deps)` |
| `useId` | Stable unique ID for a11y | `const id = useId()` |
| `useLayoutEffect` | Effect before paint (measuring) | `useLayoutEffect(fn, deps)` |

**Both rules, once more:** call hooks only at the top level, and only from components or other hooks.

---

# TypeScript-in-React cheat sheet

```tsx
// ---- props ----
interface Props {
  title: string
  count?: number                    // optional
  items: string[]
  status: "idle" | "loading"        // union, not string
  onSelect: (id: string) => void    // callback
  onSubmit: () => void              // no args, no return
  children: ReactNode               // anything renderable
  render: (item: Task) => ReactNode // render prop
}

// ---- state ----
useState(0)                         // inferred number
useState<Task[]>([])                // needed — [] infers never[]
useState<Task | null>(null)         // needed — null infers null
useState<Filter>("all")             // needed — else infers string

// ---- events ----
(e: React.ChangeEvent<HTMLInputElement>)   // text input, checkbox
(e: React.ChangeEvent<HTMLSelectElement>)  // select
(e: React.FormEvent<HTMLFormElement>)      // form submit
(e: React.MouseEvent<HTMLButtonElement>)   // click
(e: React.KeyboardEvent<HTMLInputElement>) // key press
// inline handlers infer all of these — annotate only standalone functions

// ---- refs ----
useRef<HTMLInputElement>(null)      // DOM node
useRef<number | null>(null)         // mutable value

// ---- reducer ----
type Action =
  | { type: "added"; title: string }
  | { type: "deleted"; id: string }
function reducer(state: Task[], action: Action): Task[] { /* switch */ }

// ---- context ----
const Ctx = createContext<Value | null>(null)
export function useCtx() {
  const v = useContext(Ctx)
  if (!v) throw new Error("Missing provider")
  return v                          // narrowed to Value
}

// ---- custom hooks ----
function useThing<T>(init: T) {
  return [value, setValue] as const // tuple, not array
}

// ---- utility types ----
Partial<Task>        // all optional — for "changes" objects
Omit<Task, "id">     // everything but id
Pick<Task, "title">  // just these keys
Record<Priority, string>  // one entry per union member
```

---

# Bootstrap quick reference

The utilities you'll reach for constantly:

| Purpose | Classes |
|---|---|
| **Spacing** | `m-*` `p-*` + side (`mt`, `mb`, `ms`, `me`, `mx`, `my`), scale 0–5, e.g. `mb-3`, `px-4` |
| **Flexbox** | `d-flex`, `flex-column`, `justify-content-between`, `align-items-center`, `gap-3`, `flex-grow-1` |
| **Text** | `text-muted`, `text-center`, `fw-bold`, `fw-semibold`, `small`, `text-decoration-line-through` |
| **Colour** | `text-primary`, `bg-light`, `bg-body-tertiary`, `border`, `border-bottom` |
| **Sizing** | `w-100`, `h-100`, `min-vh-100` |
| **Display** | `d-none`, `d-sm-block`, `d-flex` |
| **Rounding** | `rounded`, `rounded-3`, `rounded-circle` |

**Responsive breakpoints** slot into the class name: `d-none d-sm-block` (hidden on mobile), `flex-column flex-sm-row`. Breakpoints are `sm` 576px, `md` 768px, `lg` 992px, `xl` 1200px, `xxl` 1400px.

**Grid:** `<Container>` → `<Row>` → `<Col xs={12} md={6}>`. Use `<Row className="g-3">` for gutters. `<Col sm="auto">` sizes to content.

**Component props worth memorising:** `variant` on `Button`/`Alert` (`primary`, `secondary`, `success`, `danger`, `warning`, `info`, `light`, `dark`, `link`, plus `outline-*` for buttons); `bg` on `Badge`; `size` (`sm`/`lg`) on buttons, forms, and modals.

**Customising:** don't fight Bootstrap with inline styles. Override its Sass variables instead:

```bash
npm install -D sass
```

```scss
// src/styles/custom.scss
$primary: #4f46e5;
$border-radius: 0.5rem;
@import "bootstrap/scss/bootstrap";
```

Then import `custom.scss` in `main.tsx` in place of `bootstrap.min.css`.

---

# Glossary

| Term | Meaning |
|---|---|
| **Component** | A function returning JSX; the unit of UI |
| **Props** | Read-only inputs passed from parent to child |
| **State** | Data a component owns and can change; changing it re-renders |
| **Render** | React calling your component function to get a UI description |
| **Reconciliation** | Diffing the new UI description against the previous one |
| **Virtual DOM** | The in-memory tree React diffs before touching the real DOM |
| **Key** | Stable identity hint for list items |
| **Controlled component** | An input whose value is driven by React state |
| **Lifting state up** | Moving state to the closest common ancestor |
| **Derived state** | A value computed from state rather than stored |
| **Prop drilling** | Passing props through components that don't use them |
| **Side effect** | Work outside rendering: network, timers, storage, DOM |
| **Custom hook** | A `use`-prefixed function that composes other hooks |
| **Pure component** | Same props in, same JSX out, no external mutation |
| **Fragment** | `<>...</>` — groups elements without a DOM node |
| **Strict Mode** | Dev-only double-invocation to surface unsafe patterns |
| **Union type** | `"a" \| "b"` — a value restricted to listed options |
| **Discriminated union** | A union whose members share a literal tag field, enabling narrowing |
| **Narrowing** | TypeScript deducing a more specific type from control flow |
| **Type predicate** | `v is T` — a function that tells TS what a `true` return means |
| **Generic** | A type parameterised by another type, e.g. `Array<T>` |
| **Type assertion** | `x as T` — a claim you make; not checked at runtime |
| **Structural typing** | TS compares shapes, not names — same shape means compatible |

---

# Where to go next

You now have every fundamental needed to read and write production React with TypeScript. The next layer:

**Immediate**
- **react-hook-form + zod** — replace hand-rolled form state; zod schemas generate types, so validation and types never drift
- **TanStack Query** — server state done properly, with excellent TypeScript inference
- **react-router-dom** — multi-page apps, protected routes, URL as state

**Then**
- **Testing** — Vitest + React Testing Library; test behaviour, not implementation
- **Deeper TypeScript** — generics in components, `satisfies`, template literal types, and the `strict` compiler flags you aren't using yet
- **Error boundaries** and `<Suspense>` for resilient loading and failure states
- **Accessibility** — semantic HTML, focus management, keyboard navigation
- **Bootstrap theming** — Sass variable overrides, and Bootstrap 5.3's built-in dark mode via `data-bs-theme="dark"`
- **Deployment** — `npm run build` (which type-checks), then Vercel or Netlify

**Extend TaskBoard yourself.** The most valuable exercise now is adding features without a guide:

1. Due dates with `<Form.Control type="date">`, and an "overdue" badge
2. Sorting by priority or creation date (add a `SortKey` union type)
3. Multiple boards/projects with `react-router-dom`
4. Dark mode toggle using `data-bs-theme`
5. Drag-and-drop reordering (`dnd-kit`)
6. Replace `localStorage` with a real REST API, validated with zod
7. Tests for the reducer first — it's a pure function, so it's the easiest possible thing to test

**Reference**
- [react.dev](https://react.dev) — the official docs; genuinely excellent, especially the Learn section
- [react-bootstrap.github.io](https://react-bootstrap.github.io/) — component APIs and props
- [getbootstrap.com](https://getbootstrap.com/docs/5.3/) — the utility classes and grid
- [typescriptlang.org/docs/handbook](https://www.typescriptlang.org/docs/handbook/intro.html) — the TypeScript handbook
- [react-typescript-cheatsheet.netlify.app](https://react-typescript-cheatsheet.netlify.app/) — the community React+TS reference

One last thing: when a type error looks impenetrable, read it from the **bottom up**. TypeScript reports the outermost mismatch first and the actual incompatibility last. The final line is almost always the one that tells you what's really wrong.
