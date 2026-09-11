# TaskBoard — Guided Build Guide

**What this is:** a 17-step guided exercise. You build one real application — **TaskBoard**, a task
manager — from an empty Vite template to a typed, routed, persisted, tested app with a Redux store.
Every step leaves the app in a **working, runnable state**, and every step explains *why* before it
shows *what*.

**What you end up with:**

> A task board with adding, completing, deleting and editing tasks; priority levels; filtering,
> search and live stats; `localStorage` persistence; validation with zod at every boundary; an axios
> API layer with interceptors; client-side routing with URL-encoded filter state; error boundaries;
> a test suite; and — optionally — a Redux Toolkit store. Typed end to end, no `any`.

**How to use it.** Work top to bottom, in order. Each step follows the same shape:

| Part | What it's for |
|---|---|
| **The idea** | Two to four sentences on the problem this step solves, before any code. Read it. |
| **The code** | Files to create or replace, in full. Type them rather than pasting, at least the first time. |
| **Verify** | What to click, and what you should see. If it doesn't do that, stop and fix it before continuing. |
| **Why it's built this way** | The decisions behind the code — including the alternatives that look reasonable and aren't. This is where the learning is. |
| **Try it yourself** | Deliberate breakages. Predict the outcome, make the change, see if you were right. Being wrong here is the point. |

Rules that will make this go well:

1. **Run the app after every step.** Errors compound; a broken step 6 makes step 7 impossible to debug.
2. **Run `npm run build` occasionally**, not just `npm run dev`. `dev` does not type-check — Vite strips types without checking them. `build` runs `tsc`.
3. **Read the TypeScript errors.** Start at the *last* line of the message, which usually names the actual mismatch.
4. **Do the "Try it yourself" experiments.** Breaking code on purpose and predicting the result is the fastest way to build an accurate mental model of why the working version works.
5. Keep the browser console *and* your editor's Problems panel open.

**Is this self-contained?** Yes. Every concept a step uses is explained where it's used, and every
file is given in full. You do not need another document to complete it.

**The companion document.** [`React-Demo-Guide.md`](./React-Demo-Guide.md) is the teaching half:
23 concept sections and 88 small isolated lab demos, each with one moving part, where the concepts
used here are explained from first principles and deliberately broken. If a step's *why* leaves you
wanting more depth, that's where the depth lives. The recommended rhythm in a workshop is *concept
and lab there, then the matching step here.*

---

## Where the steps go

| Step | What you add | Concepts it exercises |
|---|---|---|
| [1](#-build-step-1--types-and-app-shell) | Types and app shell | Props, typed data, component boundaries |
| [2](#-build-step-2--a-taskcard-with-typed-props) | `TaskCard` with typed props | Props interfaces, unions, lookup maps |
| [3](#-build-step-3--task-list-with-keys-and-an-empty-state) | Task list, keys, empty state | Lists, `key`, conditional rendering |
| [4](#-build-step-4--make-tasks-completable) | Toggle and delete | `useState`, immutable updates, events up |
| [5](#-build-step-5--add-task-form-with-react-hook-form--zod) | Add-task form | react-hook-form, zod, `zodResolver` |
| [6](#-build-step-6--filters-search-and-stats) | Filters, search, stats | Derived state, the derivation pipeline |
| [7](#-build-step-7--persist-to-localstorage) | `localStorage` persistence | `useEffect`, lazy initialisers, untrusted input |
| [8](#-build-step-8--extract-custom-hooks) | Custom hooks | Extracting stateful logic, generics |
| [9](#-build-step-9--context--reducer-refactor) | Context + reducer | `useReducer`, discriminated unions, split contexts |
| [10](#-build-step-10--edit-modal-reusing-the-schema) | Edit modal | Schema reuse, `key`-as-reset, modals |
| [11](#-build-step-11--profile-taskboard-no-code-changes) | Profiling (no code) | React DevTools Profiler, when *not* to memoise |
| [12](#-build-step-12--load-seed-tasks-from-an-api) | Load tasks from an API | `fetch`, union state, race conditions, `AbortController` |
| [13](#-build-step-13--an-axios-api-layer) | An axios API layer | Instances, interceptors, error normalisation |
| [14](#-build-step-14--routing-and-url-state-in-taskboard) | Routing and URL state | react-router, `useParams`, `useSearchParams` |
| [15](#-build-step-15--boundaries-in-taskboard) | Error boundaries | Class components, `getDerivedStateFromError` |
| [16](#-build-step-16--tests-for-taskboard) | A test suite | Vitest, Testing Library, query priority |
| [17](#-build-step-17--migrate-the-store-to-redux-toolkit) | Redux Toolkit store | `createSlice`, typed hooks, selectors, thunks |

**TaskBoard is complete and correct at step 16.** Step 17 replaces the working Context transport from
step 9 with a Redux store, keeping the same reducer logic. It's worth doing to see what a real
migration involves and to learn where Redux earns its keep — but it adds no features, so skip it if
you're short on time.

---

# Part 0 — Setting up the project

## 0.1 Prerequisites

| Tool | Version | Check with |
|---|---|---|
| Node.js | 20 LTS or newer | `node -v` |
| npm | comes with Node | `npm -v` |
| Editor | VS Code + ESLint, Prettier | — |
| Browser | Chrome/Edge + [React Developer Tools](https://react.dev/learn/react-developer-tools) | — |

Install React DevTools before you start — step 11 is entirely about reading the Profiler, and there's no substitute.

You should be comfortable with modern JavaScript: arrow functions, destructuring, spread/rest, template literals, `map`/`filter`/`reduce`, modules, optional chaining, and promises/`async`-`await`. React is a small library; it just assumes fluent JavaScript. If `[...arr, x]` and `{ ...obj, k: v }` aren't second nature, spend an hour on those first — they appear on nearly every page of this document.

## 0.2 Create the project

```bash
npm create vite@latest taskboard -- --template react-ts
cd taskboard
```

The `react-ts` template gives you TypeScript configured correctly out of the box — `tsconfig.json`, `tsconfig.app.json`, `.tsx` files, and type checking wired into the build.

## 0.3 Install dependencies

```bash
npm install
npm install react-bootstrap bootstrap react-bootstrap-icons
npm install -D @types/node
```

Three runtime packages, because they do different jobs:

- **`bootstrap`** is the CSS. It provides the classes (`d-flex`, `mb-3`, `text-muted`) and the visual design.
- **`react-bootstrap`** is a set of real React components (`<Button>`, `<Modal>`, `<Form.Control>`) that render Bootstrap markup. It replaces Bootstrap's own JavaScript entirely — **no jQuery, and you should not import `bootstrap.bundle.js`.** Mixing the two causes duplicate event handling on modals and dropdowns.
- **`react-bootstrap-icons`** is Bootstrap Icons as React components, so `<Trash size={16} />` instead of an `<i>` tag with a class.

React-Bootstrap ships its own TypeScript definitions, so there is no `@types/react-bootstrap` to install. (If you see instructions telling you to install it, they're out of date.)

**Later steps add one dependency each**, installed at the step that needs it — so you never install something before you know what it's for:

| Step | Install |
|---|---|
| 5 | `npm install react-hook-form zod @hookform/resolvers` |
| 13 | `npm install axios` |
| 14 | `npm install react-router-dom` |
| 16 | `npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom` |
| 17 | `npm install @reduxjs/toolkit react-redux` |

> **Version note.** The stable line is `react-bootstrap@2.x`, which targets Bootstrap 5. A `3.0.0-beta` line exists that targets React 19 specifically. Vite's current template scaffolds React 19, and stable v2 (2.10.7+) works with it — but if you hit type conflicts around refs or `Navbar`, either pin React 18 or try the beta with `npm install react-bootstrap@next`. Check [react-bootstrap.github.io](https://react-bootstrap.github.io/) for the current recommendation.

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

Import order matters because CSS rules of equal specificity are applied in source order — the last one wins. Put your stylesheet after Bootstrap's and your overrides work; put it before and Bootstrap silently overrides you.

Note the `!` after `getElementById("root")`. That's TypeScript's **non-null assertion** — `getElementById` returns `HTMLElement | null`, and you're telling the compiler you know the element exists because it's in `index.html`. Vite's template includes this already.

**Leave `<StrictMode>` on.** It double-invokes components and effects in development specifically to surface impure code and missing cleanup — which is exactly the class of bug steps 7, 9 and 12 are careful about. If something logs twice in development, that's Strict Mode, and it's telling you something true.

Now empty out `src/index.css` (delete everything Vite put there — it fights Bootstrap) and delete `src/App.css`.

Add this one utility to `src/index.css`; Bootstrap doesn't ship it and a couple of components below use it:

```css
/* Bootstrap has no dashed-border utility */
.border-dashed {
  border-style: dashed !important;
}
```

## 0.5 Configure the `@` import alias

**Not optional here** — every import in this guide is written `@/components/TaskCard` rather than `../../components/TaskCard`, because the relative version stops being correct the moment you move a file.

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

Then update **`vite.config.ts`**:

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

## 0.6 Verify before you start

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

Then:

```bash
npm run dev      # → http://localhost:5173
```

A blue Bootstrap button on a centred, padded container means everything is wired. Now confirm the type-checker runs too:

```bash
npm run build
```

`npm run dev` does **not** type-check. `npm run build` runs `tsc` first. Get into the habit of running the build before you claim something works.

## 0.7 Troubleshooting

| Symptom | Fix |
|---|---|
| Components render but look unstyled | The `bootstrap.min.css` import is missing from `main.tsx`, or it comes *after* `index.css`. |
| `Cannot find module '@/components/...'` | Alias missing from `tsconfig.app.json` **or** `vite.config.ts`. Restart the dev server and the TS server (VS Code: ⇧⌘P → "Restart TS Server"). |
| Modals/dropdowns fire twice | You imported Bootstrap's JS bundle. Remove it — React-Bootstrap replaces it. |
| Type errors on `ref` or `Navbar` | React 19 vs react-bootstrap v2 mismatch. See the version note in 0.3. |
| `npm run build` fails but `dev` works | `dev` doesn't type-check; `build` runs `tsc`. Fix the reported type errors. |
| Port 5173 already in use | Another Vite server is running. `npm run dev -- --port 5175`, or stop the other one. |
| Editor shows errors the terminal doesn't | The editor's TypeScript version differs from the project's. VS Code: ⇧⌘P → "TypeScript: Select TypeScript Version" → "Use Workspace Version". |
| `crypto.randomUUID is not a function` | You're on an insecure origin or old Node. It works on `localhost` and over HTTPS; on Node it needs 19+. |
| An effect or a log fires twice | Strict Mode, intentionally. Don't "fix" it by removing Strict Mode — fix the code it's pointing at. |

---

# The build

Seventeen steps. Run the app after each one.

---

## 🔨 Build Step 1 — Types and app shell

**The idea.** A typed domain model is the contract every later step is written against. Unions
(`"low" | "medium" | "high"`) instead of `string` turn typos into compile errors, and deriving one type
from another means a field is only ever added in one place. Getting this right first is what makes
everything downstream cheap.

Start with the domain types, because they're the contract the whole app is written against. Create `src/types.ts`:

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

Four decisions worth naming:

- **`Priority` and `Filter` are unions, not `string`.** Every typo becomes a compile error and every `switch` over them can be checked for exhaustiveness.
- **`createdAt` is `readonly`.** It's set once at creation and must never change; the type now enforces that.
- **`createdAt` is a `number`** (epoch milliseconds) rather than a `Date`, because it has to survive `JSON.stringify` into `localStorage` in Build Step 7. `Date` would come back as a string and quietly break comparisons.
- **`NewTask` is derived with `Pick`** rather than being a second hand-written interface. Add a field to `Task` and there's exactly one place to think about.

> **This file changes in Build Step 5.** Once the app has a reason for a zod schema, these types get *derived* from it (`z.infer`) instead of hand-written, so the rules and the types can't drift apart. Writing them by hand now is the right starting point — you can't derive a type from a schema you don't yet have a use for.

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

**Run and verify:**

```bash
npm run dev -- --port 5174
```

You should see a white header bar with a blue tick icon, a title and a subtitle, on a light grey page. Then:

```bash
npm run build
```

It must pass. Getting into the habit now, while there's nothing to fix, means you'll notice the day it starts failing.

**What you just used:** a component, typed props, destructuring, and Bootstrap utility classes (`bg-body-tertiary`, `text-muted`, `d-flex`, `gap-3`). Those utilities are theme-aware in Bootstrap 5.3, so a dark-mode toggle later will need no component changes at all.

---

## 🔨 Build Step 2 — A TaskCard with typed props

**The idea.** A component is a function of its props. `TaskCard` receives one task and renders it —
no state, no data fetching, no knowledge of where the task came from. That's what makes it reusable,
and what lets you test it by passing an object.

Create `src/data/seed.ts`:

```ts
import type { Task } from "@/types"

export const seedTasks: Task[] = [
  { id: "1", title: "Set up the project",    priority: "high",   done: true,  createdAt: 1 },
  { id: "2", title: "Learn props and state", priority: "medium", done: false, createdAt: 2 },
  { id: "3", title: "Build the task form",   priority: "low",    done: false, createdAt: 3 },
]
```

Annotating as `Task[]` means a typo in any seed row is caught immediately, right where you wrote it, rather than as a rendering oddity later. Try `priority: "med"` and see.

Create `src/components/TaskCard.tsx`:

```tsx
import { Card, Badge } from "react-bootstrap"
import type { Priority, Task } from "@/types"

const priorityVariant = {
  high: "danger",
  medium: "primary",
  low: "secondary",
} satisfies Record<Priority, string>

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

**Verify:** two cards, each with a title on the left and a coloured priority badge on the right.

`satisfies Record<Priority, string>` is doing real work here: if you later add `"critical"` to the `Priority` union, TypeScript immediately errors on this object for missing a key. The type system reminds you about every place that needs updating — this is the payoff for using unions instead of `string` — a union of literals, so the compiler knows the complete set of valid values.

The lookup object is declared **outside** the component because it never changes; re-creating it on every render would be pointless work and a new object identity each time (which matters once you start memoising).

**Try it yourself:** add `"critical"` to `Priority` in `types.ts` and note where the errors appear — `TaskCard` and nowhere else, so far. Then remove it.

**Checkpoint.** You now have: a typed domain model, two presentational components, and props flowing down. Nothing is interactive yet, and that's deliberate — everything so far is `UI = f(data)` with the data hard-coded. The next step supplies the state that makes the `f` worth having.

---

## 🔨 Build Step 3 — Task list with keys and an empty state

**The idea.** Rendering a list means mapping data to elements, and each element needs a stable
`key` so React can match them up between renders. An index is not a stable key once the list can be
reordered or filtered. An empty list is also a UI state — one that renders nothing looks broken, so
design the zero case deliberately.

Back to **taskboard**.

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

The guard clause comes first, so the happy path reads without indentation. This component will grow two more conditions by Build Step 6, and the structure absorbs them without reshaping.

You added `.border-dashed` to `src/index.css` back in Part 0.4. If you skipped it, add it now — Bootstrap has no dashed-border utility:

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

**Verify:** three cards, and no key warnings in the console.

**Try it yourself:** temporarily pass `tasks={[]}` and confirm the empty state renders. Then pass `tasks={[...seedTasks, ...seedTasks]}` and watch React warn about duplicate keys — a useful error to have seen once, since it's what happens the first time you merge two lists.

---

## 🔨 Build Step 4 — Make tasks completable

**The idea.** State that more than one component needs lives in their closest common ancestor,
and flows down as props while events flow up as callbacks. Two rules make the updates correct: use the
updater form when the new value depends on the old one, and **never mutate** — React compares state by
reference, so a mutated array looks unchanged and nothing re-renders.

State lives in `App` because more than one child will eventually need it. (The rule: state that two components need lives in their closest common ancestor.)

Update `src/components/TaskCard.tsx`:

```tsx
import { Card, Badge, Button, Form } from "react-bootstrap"
import { Trash } from "react-bootstrap-icons"
import type { Priority, Task } from "@/types"

const priorityVariant = {
  high: "danger",
  medium: "primary",
  low: "secondary",
} satisfies Record<Priority, string>

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
        <TaskCard key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} />
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
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
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

**Verify:** tick a checkbox and the title gets struck through. Delete tasks until the list is empty and the empty state appears — nobody wrote code to *show* it, it falls out of state changing. That's `UI = f(state)` paying its first dividend.

The app is now interactive, and every one of the state rules is present in eight lines:

- Both handlers use the **updater form**, so they're correct even if two clicks land in one tick.
- `map` + spread **replaces** the matching task with a new object and leaves the others' identities intact.
- `filter` **returns a new array** rather than splicing.
- `useState<Task[]>(seedTasks)` reads its initial value once; later renders don't re-seed.

Note `Form.Check` uses `onChange`, not a custom `onCheckedChange`. React-Bootstrap components are thin wrappers over real HTML elements, so standard DOM event names apply throughout — which means standard DOM event knowledge transfers directly.

**Try it yourself:** change `handleToggle` to mutate (`prev.find(t => t.id === id)!.done = !...; return prev`). The checkbox stops responding, because the array reference never changed and React sees no reason to re-render.

---

## 🔨 Build Step 5 — Add-task form, with react-hook-form + zod

TaskBoard's form is two fields. Conventional advice says don't reach for a schema and a form library on a two-field form — so why here?

Because **the schema isn't only for this form.** By the end of the build, "what is a valid task?" has to be answered in four places:

| Place | Build Step |
|---|---|
| The add form | 5 |
| The edit modal — same two fields, same rules | 10 |
| Data read back from `localStorage` | 7 |
| Data arriving from an API | 12 |

Write the rules by hand and you write them four times, or — far more likely — once, and then trust the other three. One schema, imported four times, is the honest answer. **The form library is almost incidental**; the schema is the reason.

### 1. One definition of a valid task

Create `src/schemas/task.ts`:

```ts
import { z } from "zod"

export const PRIORITIES = ["low", "medium", "high"] as const

/** What a form collects: the fields a human types. */
export const NewTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Give the task a title.")
    .max(120, "Keep the title under 120 characters."),
  priority: z.enum(PRIORITIES),
})

/** A complete, stored task: the form's fields plus the ones the app assigns. */
export const TaskSchema = NewTaskSchema.extend({
  id: z.string().min(1),
  done: z.boolean(),
  createdAt: z.number().int().nonnegative(),
})

export const TaskListSchema = z.array(TaskSchema)

// Types derived from the schemas — never written twice
export type NewTask = z.infer<typeof NewTaskSchema>
export type Task = z.infer<typeof TaskSchema>
export type Priority = z.infer<typeof NewTaskSchema>["priority"]
```

Three things to notice:

- **`.trim()` before `.min(1)`.** Zod applies `trim` as a transform, so `parsed.data.title` is already trimmed and `"   "` fails the length check. That's the `title.trim()` you'd otherwise write by hand, moved into the definition.
- **`TaskSchema` extends `NewTaskSchema`** rather than repeating it. Add a field to the form and the stored shape follows automatically.
- **The types are inferred.** Delete the hand-written `Task`, `NewTask` and `Priority` from `src/types.ts` and re-export from here instead, so there is one source of truth:

```ts
// src/types.ts
export type { Task, NewTask, Priority } from "@/schemas/task"
export type Filter = "all" | "active" | "done"   // a UI concern, not a data one
```

`Filter` stays hand-written because it isn't data — it never crosses a boundary, so it gains nothing from a schema.

### 2. The form

```bash
npm install react-hook-form @hookform/resolvers zod
```

Create `src/components/AddTaskForm.tsx`:

```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, Form, Button, Row, Col } from "react-bootstrap"
import { Plus } from "react-bootstrap-icons"
import { NewTaskSchema, PRIORITIES, type NewTask } from "@/schemas/task"

interface AddTaskFormProps {
  onAdd: (task: NewTask) => void
}

const emptyTask: NewTask = { title: "", priority: "medium" }

export default function AddTaskForm({ onAdd }: AddTaskFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewTask>({
    resolver: zodResolver(NewTaskSchema),
    mode: "onSubmit",          // a two-field form: don't nag before they try
    defaultValues: emptyTask,
  })

  // Only ever called with a valid, trimmed NewTask
  function onValid(task: NewTask) {
    onAdd(task)
    reset(emptyTask)           // clears values AND errors AND touched
  }

  return (
    <Card className="mb-4">
      <Card.Body>
        <Form onSubmit={handleSubmit(onValid)} noValidate>
          <Row className="g-3 align-items-start">
            <Col xs={12} sm>
              <Form.Group controlId="task-title">
                <Form.Label>Task</Form.Label>
                <Form.Control
                  placeholder="What needs doing?"
                  isInvalid={Boolean(errors.title)}
                  {...register("title")}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.title?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col xs={7} sm="auto">
              <Form.Group controlId="task-priority">
                <Form.Label>Priority</Form.Label>
                <Form.Select isInvalid={Boolean(errors.priority)} {...register("priority")}>
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p[0].toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col xs={5} sm="auto">
              <Button type="submit" className="w-100 mt-sm-4" disabled={isSubmitting}>
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

`App.tsx` is unchanged — it still receives a `NewTask` and builds the `Task`:

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

**Verify:** add a task and it appears at the top with the priority you chose. Submit an empty title and the red feedback appears. Type a title made only of spaces and submit — it's still rejected, because `.trim()` runs before `.min(1)`.

### What this build step demonstrates

- **`register`, not `Controller`.** react-hook-form has two ways to connect a field. `register` spreads a `ref` and a DOM-shaped `onChange` onto the input — which works here because react-bootstrap's `Form.Control` and `Form.Select` forward refs to the real element. (The other way, `<Controller>`, is for your own components that take `value`/`onChange` instead of a ref.) **`register` is the simpler path; use it whenever the field renders a real input.**
- **`mode: "onSubmit"`** rather than `"onTouched"`. `mode` decides *when* validation runs: `"onSubmit"` only on submit, `"onTouched"` on first blur then every change, `"onChange"` every keystroke. On a two-field form, errors before the first attempt are just nagging. The edit modal in Build Step 10 makes the opposite choice, for a reason.
- **`reset(emptyTask)`** replaces three `setState` calls and the manual error clearing.
- **`PRIORITIES` drives the `<option>` list**, so the schema's enum and the dropdown can't disagree.
- **`.trim()` lives in the schema**, so `onAdd` receives clean data and no component has to remember to trim.

**Try it yourself:** change `mode` to `"onChange"` and type one character into an empty title. The error appears and vanishes as you type — annoying on a form this small, which is exactly why `"onSubmit"` is the right default here. Then add a third field and reconsider.

---

## 🔨 Build Step 6 — Filters, search, and stats

**The idea.** If you can calculate it from state you already have, don't store it. Filtered lists,
counts and percentages are derived during render, so they cannot go stale — whereas a stored count has
to be updated by every code path that changes the list, and one of them will eventually forget.

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
        <span>
          {completed} of {total} complete
        </span>
        <span>{percent}%</span>
      </div>
      <ProgressBar now={percent} style={{ height: 6 }} variant="success" />
    </div>
  )
}
```

`TaskStats` takes two numbers rather than the task array. That's deliberate: the component has no idea what a `Task` is, so it's reusable and trivially testable. **Pass the narrowest data a component can do its job with.**

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

`Nav`'s `onSelect` gives you `string | null`, hence the `key &&` guard and the cast — a good example of TypeScript making you handle a case you'd otherwise forget. If you'd prefer the safe version, a type predicate (`const isFilter = (v: string): v is Filter => …`) works here too.

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

**Verify:** the pills filter, the search box narrows, and the progress bar tracks completion. Then check the crucial interaction: **filter to "Done" and tick a task off.** It vanishes from view immediately — no code coordinates that, it's just the derivation re-running against new state.

`completed` and `visibleTasks` are recomputed on every render and are therefore never stale. There is exactly one source of truth: `tasks`. Compare that with a stored counter, which would have needed updating in all three handlers.

Note that `onFilterChange={setFilter}` type-checks only because `setFilter` is `(f: Filter) => void` and the prop expects exactly that. If you'd typed the state as `string`, this would silently accept invalid filters — the union carries its guarantee all the way to the prop boundary.

**Improve the empty state.** `TaskList` now shows "No tasks yet / Add your first task" even when the real problem is that a filter excluded everything. Those are two different situations needing two different messages — "nothing exists yet" is onboarding, "nothing matches" is recovery — and TaskBoard is currently conflating them. Fix it by telling the component which situation it's in:

```tsx
interface TaskListProps {
  tasks: Task[]
  /** True when tasks exist but none match the current filter/search. */
  isFiltered: boolean
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

// inside the guard clause:
if (tasks.length === 0) {
  return (
    <div className="border border-2 border-dashed rounded-3 text-center py-5 text-muted">
      {isFiltered ? (
        <>
          <p className="fw-semibold mb-1 text-body">Nothing matches</p>
          <p className="small mb-0">Try a different filter or search term.</p>
        </>
      ) : (
        <>
          <p className="fw-semibold mb-1 text-body">No tasks yet</p>
          <p className="small mb-0">Add your first task to get started.</p>
        </>
      )}
    </div>
  )
}
```

And in `App.tsx`:

```tsx
<TaskList
  tasks={visibleTasks}
  isFiltered={tasks.length > 0}
  onToggle={handleToggle}
  onDelete={handleDelete}
/>
```

`isFiltered` is derived, not stored — it's just `tasks.length > 0` evaluated at the point where both facts are known.

**Try it yourself:** add a "Clear completed" button to the toolbar. You'll need a new callback prop, a handler in `App` using `filter`, and a decision about whether to hide the button when nothing is completed (derive that too).

---

## 🔨 Build Step 7 — Persist to localStorage

**The idea.** Anything that reaches outside React — storage, network, timers, the document title —
is a side effect and belongs in `useEffect`. Persistence is the textbook case: read once at startup,
write whenever the data changes. Two details matter: the initial read must happen once rather than on
every render, and **storage is untrusted input**, so validate what comes back instead of trusting it.

Update the state declaration in `App.tsx`:

```tsx
import { useState, useEffect } from "react"
import { TaskListSchema } from "@/schemas/task"

const STORAGE_KEY = "taskboard.tasks"

// ...inside App:
const [tasks, setTasks] = useState<Task[]>(() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return seedTasks
    // Build Step 5's schema, reused. Storage is untrusted input.
    const parsed = TaskListSchema.safeParse(JSON.parse(saved))
    return parsed.success ? parsed.data : seedTasks
  } catch {
    return seedTasks
  }
})

useEffect(() => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}, [tasks])
```

**Verify:** add a task, reload the browser. It survives. Open DevTools → Application → Local Storage and watch the value change as you type.

Five deliberate choices here, and each one is worth understanding:

1. **Lazy initialiser** (`useState(() => ...)`) reads storage once on mount instead of on every render. Without the arrow, `JSON.parse` runs on every keystroke and throws the result away.
2. **`try`/`catch`** because stored JSON can be corrupt, and `localStorage` throws outright in some privacy modes rather than returning `null`.
3. **`[tasks]` dependency** so the save runs whenever tasks change — and only then. An empty array would save once, with the seed data, and never again.
4. **This is a legitimate effect.** It's not deriving anything and it's not responding to a single user action — it's synchronising React state with an external system whenever that state changes. That's precisely what effects are for — as opposed to deriving data or responding to a click, neither of which needs one.
5. **`TaskListSchema.safeParse`, not `as Task[]`.** `JSON.parse` returns `any`, and a cast would be a *promise* to the compiler rather than a check. Storage is outside your program: a `taskboard.tasks` entry containing `[{"title": 42}]` — left by an older version of your app, or by a user with the console open — would flow straight into typed state and crash somewhere far away.

That's the **second** of the four places Build Step 5's schema is used, and the first where it catches something a cast couldn't. Note the fallback: a failed parse returns the seed tasks rather than throwing, so corrupt storage degrades to a working app instead of a white screen.

**Try it yourself — two kinds of corruption.** With the app open, run each of these in the browser
console and reload:

```js
localStorage.setItem("taskboard.tasks", "{ broken")        // not JSON at all
localStorage.setItem("taskboard.tasks", '[{"title":42}]')  // valid JSON, wrong shape
```

The first is caught by `try`/`catch`; the second parses cleanly and is caught only by `safeParse`.
Either way you get the seed tasks and a working app. Now swap `safeParse` for `as Task[]` and repeat
the second one: the cast lets `{title: 42}` into typed state, and `TaskCard` either renders `42` as a
title or crashes on `task.title.trim()` — a failure that surfaces nowhere near the line that caused it.

---

## 🔨 Build Step 8 — Extract custom hooks

**The idea.** A custom hook extracts *stateful logic*, not markup. Any function whose name starts
with `use` and which calls other hooks is one. Moving persistence and the task operations out of `App`
leaves a component that reads as a description of the UI, with the *how* behind two hooks you could
test or reuse independently.

Create `src/hooks/useLocalStorage.ts` — `useState`, but persisted:

```ts
import { useState, useEffect } from "react"

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key)
      return saved !== null ? (JSON.parse(saved) as T) : initialValue
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

  function clearCompleted() {
    setTasks((prev) => prev.filter((t) => !t.done))
  }

  return { tasks, addTask, toggleTask, deleteTask, updateTask, clearCompleted }
}
```

`Partial<Task>` on `updateTask` is exactly right: any subset of a task's fields, each still correctly typed. `updateTask(id, { done: "yes" })` is a compile error; `updateTask(id, { title: "New" })` is fine; `updateTask(id, {})` is a valid no-op.

The hook returns an **object**, not a tuple, so no `as const` is needed — object properties keep their types automatically, and there are six of them, which is well past the point where positional returns stop being readable — past two or three values, positional returns stop being readable.

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
        <TaskList
          tasks={visibleTasks}
          isFiltered={tasks.length > 0}
          onToggle={toggleTask}
          onDelete={deleteTask}
        />
      </Container>
    </div>
  )
}
```

**Verify:** identical behaviour, and everything still persists. A refactor that changes no behaviour is exactly what you want here — if something broke, the extraction wasn't faithful.

The component now reads as a **description of the UI**: what state exists, what's derived from it, what's rendered. The *how* — id generation, immutable updates, persistence, error handling — moved into hooks. This is the refactor that separates tidy React codebases from sprawling ones, and it's worth noticing how much of `App.tsx`'s length was mechanical.

Note that `filter` and `query` stayed in `App`. They're view state, not task state; putting them in `useTasks` would couple the data layer to the UI's current filtering feature. **Hooks should have one job**, same as components.

**Try it yourself:** wire `clearCompleted` to a button in the toolbar. You'll need a new prop, and you'll want to hide or disable the button when `completed === 0` — derived, of course.

---

## 🔨 Build Step 9 — Context + reducer refactor

This replaces the `useTasks` hook from Build Step 8 with a context-backed reducer, so `TaskCard` can talk to the store directly instead of receiving callbacks through two layers. It's the first refactor in TaskBoard that changes the *architecture* rather than just tidying.

Create `src/context/TaskContext.tsx`:

```tsx
import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
  type ReactNode,
  type Dispatch,
} from "react"
import { TaskListSchema } from "@/schemas/task"
import type { Priority, Task } from "@/types"

const STORAGE_KEY = "taskboard.tasks"

export type TaskAction =
  | { type: "added"; id: string; createdAt: number; title: string; priority: Priority }
  | { type: "toggled"; id: string }
  | { type: "updated"; id: string; changes: Partial<Task> }
  | { type: "deleted"; id: string }
  | { type: "clearedCompleted" }

function tasksReducer(state: Task[], action: TaskAction): Task[] {
  switch (action.type) {
    case "added":
      return [
        {
          id: action.id,
          title: action.title,
          priority: action.priority,
          done: false,
          createdAt: action.createdAt,
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
    if (saved === null) return fallback
    // Build Step 5's schema again — same guard as Build Step 7's useState initialiser
    const parsed = TaskListSchema.safeParse(JSON.parse(saved))
    return parsed.success ? parsed.data : fallback
  } catch {
    return fallback
  }
}

// ---- two contexts, so dispatch-only consumers never re-render ----

const TasksContext = createContext<Task[] | null>(null)
const TasksDispatchContext = createContext<Dispatch<TaskAction> | null>(null)

interface TaskProviderProps {
  children: ReactNode
  initialTasks?: Task[]
}

export function TaskProvider({ children, initialTasks = [] }: TaskProviderProps) {
  const [tasks, dispatch] = useReducer(tasksReducer, initialTasks, init)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
    } catch {
      // storage unavailable — fail quietly
    }
  }, [tasks])

  return (
    <TasksDispatchContext.Provider value={dispatch}>
      <TasksContext.Provider value={tasks}>{children}</TasksContext.Provider>
    </TasksDispatchContext.Provider>
  )
}

export function useTasks(): Task[] {
  const ctx = useContext(TasksContext)
  if (!ctx) throw new Error("useTasks must be used inside <TaskProvider>")
  return ctx
}

export function useTasksDispatch(): Dispatch<TaskAction> {
  const ctx = useContext(TasksDispatchContext)
  if (!ctx) throw new Error("useTasksDispatch must be used inside <TaskProvider>")
  return ctx
}

/** Convenience wrappers, so components don't build action objects by hand. */
export function useTaskActions() {
  const dispatch = useTasksDispatch()
  return useMemo(
    () => ({
      add: (title: string, priority: Priority) =>
        dispatch({
          type: "added",
          id: crypto.randomUUID(),      // impurity stays OUTSIDE the reducer
          createdAt: Date.now(),
          title,
          priority,
        }),
      toggle: (id: string) => dispatch({ type: "toggled", id }),
      update: (id: string, changes: Partial<Task>) =>
        dispatch({ type: "updated", id, changes }),
      remove: (id: string) => dispatch({ type: "deleted", id }),
      clearCompleted: () => dispatch({ type: "clearedCompleted" }),
    }),
    [dispatch]
  )
}
```

Five things to notice, each tracing back to a lab:

1. **`useReducer(reducer, initialArg, init)`** — the third argument is a lazy initialiser, same idea as `useState(() => ...)`. TypeScript infers the state type from the reducer signature, so no explicit generic is needed.
2. **`id` and `createdAt` are in the action**, generated by `useTaskActions`. The reducer stays pure and testable, and Strict Mode's double-invocation can't produce two different ids.
3. **Two contexts, not one.** `dispatch` is stable forever, so `AddTaskForm` — which only dispatches — never re-renders when the task list changes.
4. **`useTaskActions` is memoised on `[dispatch]`**, which never changes, so the returned object is stable for the lifetime of the component. Callers can pass these functions to memoised children safely.
5. **Three hooks exported, no contexts.** Consumers don't know or care that there are two providers — consumers don't need to know how many contexts there are.
6. **`init` validates rather than casts.** Same `TaskListSchema` as Build Step 7 — the persistence read moved into the provider, and the guard moved with it. A cast here would have quietly undone Build Step 7's work.

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
import { useTaskActions } from "@/context/TaskContext"
import type { Priority, Task } from "@/types"

const priorityVariant = {
  high: "danger",
  medium: "primary",
  low: "secondary",
} satisfies Record<Priority, string>

interface TaskCardProps {
  task: Task
  onEdit: (task: Task) => void
}

export default function TaskCard({ task, onEdit }: TaskCardProps) {
  const { toggle, remove } = useTaskActions()

  return (
    <Card className="mb-2">
      <Card.Body className="d-flex align-items-center gap-3 py-3">
        <Form.Check
          type="checkbox"
          checked={task.done}
          onChange={() => toggle(task.id)}
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
          onClick={() => remove(task.id)}
          aria-label={`Delete ${task.title}`}
        >
          <Trash size={16} />
        </Button>
      </Card.Body>
    </Card>
  )
}
```

Note that `onEdit` **stayed a prop**. That's deliberate, and worth pausing on: "which task is being edited" is *view state* belonging to `App`, not task data belonging to the store. Putting it in the context would mean the store knows about modals. **Context isn't a dumping ground for everything that's inconvenient to pass** — it's for what genuinely belongs to the whole tree.

Simplify `TaskList.tsx` — it only forwards `onEdit` now:

```tsx
import TaskCard from "@/components/TaskCard"
import type { Task } from "@/types"

interface TaskListProps {
  tasks: Task[]
  isFiltered: boolean
  onEdit: (task: Task) => void
}

export default function TaskList({ tasks, isFiltered, onEdit }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="border border-2 border-dashed rounded-3 text-center py-5 text-muted">
        {isFiltered ? (
          <>
            <p className="fw-semibold mb-1 text-body">Nothing matches</p>
            <p className="small mb-0">Try a different filter or search term.</p>
          </>
        ) : (
          <>
            <p className="fw-semibold mb-1 text-body">No tasks yet</p>
            <p className="small mb-0">Add your first task to get started.</p>
          </>
        )}
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

Update `AddTaskForm` to use the actions hook instead of an `onAdd` prop:

```tsx
// replace the props interface and the submit handler:
import { useTaskActions } from "@/context/TaskContext"

export default function AddTaskForm() {
  const { add } = useTaskActions()
  const [title, setTitle] = useState("")
  const [priority, setPriority] = useState<Priority>("medium")
  const [error, setError] = useState("")

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!title.trim()) {
      setError("Give the task a title.")
      return
    }
    add(title.trim(), priority)
    setTitle("")
    setPriority("medium")
    setError("")
  }
  // ...the JSX is unchanged
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
import { useTasks } from "@/context/TaskContext"
import type { Filter, Task } from "@/types"

export default function App() {
  const tasks = useTasks()
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
        <AddTaskForm />
        <TaskStats total={tasks.length} completed={completed} />
        <TaskToolbar
          filter={filter}
          onFilterChange={setFilter}
          query={query}
          onQueryChange={setQuery}
        />
        <TaskList
          tasks={visibleTasks}
          isFiltered={tasks.length > 0}
          onEdit={setEditing}
        />
      </Container>
    </div>
  )
}
```

**Verify:** identical behaviour again. Persistence still works. Compare this `App.tsx` with Build Step 6's — same features, far less plumbing, and `AddTaskForm` now takes no props at all.

**Try it yourself:**

1. Add a "Clear completed" button that calls `clearCompleted()` from `useTaskActions`. The reducer case already exists — you only need the button, and it needs no props from `App` because it can reach the store itself.
2. Dispatch a misspelled action type from anywhere and read the compile error.
3. Note the `editing` state is a `Task | null` — a copy of an object that also lives in `tasks`. Change it to `editingId: string | null` and derive the task with `tasks.find(...)`. Then rename a task while its modal is open and confirm the fix.

---

## 🔨 Build Step 10 — Edit modal, reusing the schema

The edit modal collects **the same two fields as the add form, with the same rules.** That makes it the step where Build Step 5's schema stops being a nice idea and starts paying rent — and it removes a props-to-state `useEffect`, which is one of the most common unnecessary effects there is.

### The problem with the obvious version

Written by hand, an edit form needs to copy the selected task's values into local state, and re-copy them whenever a *different* task is opened:

```tsx
const [title, setTitle] = useState("")
const [priority, setPriority] = useState<Priority>("medium")

useEffect(() => {                          // ❌ props → state: an unnecessary effect
  if (task) {
    setTitle(task.title)
    setPriority(task.priority)
  }
}, [task])
```

That works, and it has three costs: an extra render per open, two sources of truth for the same values, and a whole class of bug where the effect doesn't fire (same task object, changed contents) or fires when you didn't want it to (mid-edit re-render). The better answer is to reset with a **`key`** instead: change a component's `key` and React unmounts it and mounts a fresh one, so its initial values are simply read again. That is exactly what makes the react-hook-form version clean.

### The version to build

Create `src/components/EditTaskModal.tsx`:

```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Modal, Button, Form, Row, Col } from "react-bootstrap"
import { useTaskActions } from "@/context/TaskContext"
import { NewTaskSchema, PRIORITIES, type NewTask, type Task } from "@/schemas/task"

interface EditTaskModalProps {
  task: Task | null
  show: boolean
  onHide: () => void
}

/**
 * The form itself. Mounted fresh for each task (see the `key` below), so
 * `defaultValues` is always right and there is no props-to-state effect.
 */
function EditTaskFields({ task, onHide }: { task: Task; onHide: () => void }) {
  const { update } = useTaskActions()

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<NewTask>({
    resolver: zodResolver(NewTaskSchema),
    mode: "onTouched",        // editing: tell them as they go, they already had valid data
    defaultValues: { title: task.title, priority: task.priority },
  })

  function onValid(values: NewTask) {
    update(task.id, values)   // already trimmed and validated by the schema
    onHide()
  }

  return (
    <Form onSubmit={handleSubmit(onValid)} noValidate>
      <Modal.Body>
        <Row className="g-3">
          <Col xs={12}>
            <Form.Group controlId="edit-title">
              <Form.Label>Task</Form.Label>
              <Form.Control
                isInvalid={Boolean(errors.title)}
                {...register("title")}
              />
              <Form.Control.Feedback type="invalid">
                {errors.title?.message}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>

          <Col xs={12} sm={6}>
            <Form.Group controlId="edit-priority">
              <Form.Label>Priority</Form.Label>
              <Form.Select {...register("priority")}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p[0].toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" type="button" onClick={onHide}>
          Cancel
        </Button>
        {/* Nothing changed? Nothing to save. */}
        <Button type="submit" disabled={!isDirty || isSubmitting}>
          Save changes
        </Button>
      </Modal.Footer>

      {/* Expose focus to the parent's onEntered via a hidden hook call */}
      <FocusOnEnter setFocus={setFocus} />
    </Form>
  )
}

/** Focuses the title once the modal's enter transition finishes. */
function FocusOnEnter({ setFocus }: { setFocus: (name: "title") => void }) {
  // The modal is visible by the time this mounts, so focusing here is safe.
  useEffect(() => {
    const id = window.setTimeout(() => setFocus("title"), 0)
    return () => window.clearTimeout(id)
  }, [setFocus])
  return null
}

export default function EditTaskModal({ task, show, onHide }: EditTaskModalProps) {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Edit task</Modal.Title>
      </Modal.Header>

      {/* key={task.id} remounts the form for a different task.
          That's what makes defaultValues correct with no effect. */}
      {task && <EditTaskFields key={task.id} task={task} onHide={onHide} />}
    </Modal>
  )
}
```

Add `useEffect` to the imports (`import { useEffect } from "react"`).

Render it in `App.tsx`, just inside the `Container`, exactly as before:

```tsx
<EditTaskModal task={editing} show={editing !== null} onHide={() => setEditing(null)} />
```

**Verify:** click a pencil icon; the modal opens with that task's values and the title focused. Change the title and press Enter — the card updates. Open a *different* task and its own values appear. Clear the title and the error shows as you leave the field.

### What changed, and why each change matters

- **The props→state `useEffect` is gone.** `key={task.id}` remounts the form, so `defaultValues` is simply right. One render instead of two, and one source of truth.
- **`NewTaskSchema` is imported, not rewritten.** The add form and the edit modal now enforce *identical* rules by construction. Add a `maxLength` and both forms get it.
- **`mode: "onTouched"` here, `"onSubmit"` in the add form.** Deliberately different: an edit form starts from valid data, so live feedback is helpful rather than nagging. **`mode` is a per-form decision, not a project-wide one.**
- **`disabled={!isDirty}`** gives you "nothing changed, nothing to save" for free. The hand-rolled version would have needed a comparison against the original task.
- **`update(task.id, values)`** passes schema-validated, already-trimmed data. No `title.trim()` in sight.

### On the focus helper

The previous version used `<Modal onEntered={() => inputRef.current?.focus()}>` and a `useRef`, which is the cleaner API — but `register` owns the input's ref, so there's no ref of ours to call. RHF's `setFocus("title")` is the equivalent, and it needs to run once the modal is actually visible.

`FocusOnEnter` is a small, honest hack: a null-rendering component whose only job is an effect, mounted inside the form so it can see `setFocus`. If you'd rather keep `onEntered`, lift the form's `setFocus` out with a ref callback — or use react-bootstrap's `autoFocus` on the control and accept that it fires slightly earlier.

**Try it yourself:** delete `key={task.id}` and open two different tasks in turn. The second shows the *first* task's values, because the component was reused and `defaultValues` is only read on mount. That single attribute is doing all the work the old `useEffect` used to.

---

## 🔨 Build Step 11 — Profile TaskBoard (no code changes)

This build step deliberately changes nothing. The exercise is to establish that TaskBoard **does not need optimising**, so you know what "doesn't need it" looks like.

1. Run `npm run dev` in `taskboard` and add about twenty tasks (or paste this into the console and reload):

```js
localStorage.setItem("taskboard.tasks", JSON.stringify(
  Array.from({ length: 20 }, (_, i) => ({
    id: `perf-${i}`,
    title: `Generated task ${i}`,
    priority: ["low", "medium", "high"][i % 3],
    done: i % 4 === 0,
    createdAt: Date.now() - i * 1000,
  }))
))
```

2. Open DevTools → Profiler → gear → tick **"Highlight updates when components render"**.
3. Type a character in the search box. Watch the outlines: `App`, `TaskToolbar`, `TaskStats`, `TaskList` and every visible `TaskCard` flash.
4. Record a profile while typing a few characters and read the commit durations.

**What you should find:** commits in the region of 1–5ms. Every one of those re-renders is "unnecessary" in the sense that most cards produced identical output — and every one is also **completely harmless**, because the total work is a rounding error.

**What to conclude:** if you had wrapped `TaskCard` in `memo` and every handler in `useCallback`, you would have added a dozen lines and a maintenance burden to save nothing measurable. That's why the order is always: fix the structure, measure, and only then memoise.

**When it would change:** if `TaskList` rendered 2,000 cards, or if `TaskCard` did something genuinely expensive (rendering a chart, formatting dates with a heavy library), the same profile would show 40ms+ commits and `memo` would earn its place. **The technique doesn't change; the threshold does.**

**Try it yourself:** tick a checkbox with the highlighter on. Note that `AddTaskForm` does *not* flash, even though it's a sibling — because it only consumes `TasksDispatchContext`, whose value never changes. That's Build Step 9's split-context decision showing up as a measurable property, and it cost nothing to get.

---

## 🔨 Build Step 12 — Load seed tasks from an API

TaskBoard has been seeding from a hard-coded array. Replace that with a fetch, so the app has a real loading state.

Create `src/api/tasks.ts`:

```ts
// No schema declared here — Build Step 5's is imported. One definition, four boundaries.
import { TaskListSchema } from "@/schemas/task"
import type { Task } from "@/types"

const remote: Task[] = [
  { id: "s1", title: "Read the API contract", priority: "high", done: false, createdAt: 3 },
  { id: "s2", title: "Set up the project", priority: "medium", done: true, createdAt: 2 },
  { id: "s3", title: "Write the first test", priority: "low", done: false, createdAt: 1 },
]

/**
 * Stands in for a real endpoint. Swap the body for a `fetch` and everything
 * around it — including the validation — stays exactly the same.
 */
export function fetchSeedTasks(signal?: AbortSignal): Promise<Task[]> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      const parsed = TaskListSchema.safeParse(remote)
      if (!parsed.success) {
        reject(new Error("The server sent unexpected data"))
        return
      }
      resolve(parsed.data)
    }, 900)

    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer)
        reject(new DOMException("Aborted", "AbortError"))
      },
      { once: true }
    )
  })
}
```

```bash
npm install zod
```

Now add the loading path to `TaskProvider`. Add to `src/context/TaskContext.tsx`:

```tsx
export type LoadStatus =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready" }

const LoadStatusContext = createContext<LoadStatus | null>(null)

export function useLoadStatus(): LoadStatus {
  const ctx = useContext(LoadStatusContext)
  if (!ctx) throw new Error("useLoadStatus must be used inside <TaskProvider>")
  return ctx
}
```

and update the provider to fetch when storage is empty:

```tsx
export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, dispatch] = useReducer(tasksReducer, [], () => init([]))
  const [load, setLoad] = useState<LoadStatus>(() =>
    // If localStorage already had tasks, there's nothing to fetch.
    init([]).length > 0 ? { status: "ready" } : { status: "loading" }
  )

  useEffect(() => {
    if (load.status !== "loading") return
    const controller = new AbortController()

    fetchSeedTasks(controller.signal)
      .then((seed) => {
        dispatch({ type: "replaced", tasks: seed })
        setLoad({ status: "ready" })
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return
        setLoad({
          status: "error",
          message: err instanceof Error ? err.message : String(err),
        })
      })

    return () => controller.abort()
  }, [load.status])

  useEffect(() => {
    if (load.status !== "ready") return      // don't persist an empty pre-load state
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
    } catch { /* ignore */ }
  }, [tasks, load.status])

  return (
    <LoadStatusContext.Provider value={load}>
      <TasksDispatchContext.Provider value={dispatch}>
        <TasksContext.Provider value={tasks}>{children}</TasksContext.Provider>
      </TasksDispatchContext.Provider>
    </LoadStatusContext.Provider>
  )
}
```

Add the `replaced` action to the union and the reducer:

```ts
| { type: "replaced"; tasks: Task[] }

// in the switch:
case "replaced":
  return action.tasks
```

The `never` assertion will refuse to compile until you add that case, which is the exhaustiveness check doing its job in your own codebase.

Finally, render the three states in `App.tsx`:

```tsx
const tasks = useTasks()
const load = useLoadStatus()

// ...inside the Container, replacing <TaskList …>:
{load.status === "loading" ? (
  <div className="text-center py-5 text-muted">
    <Spinner animation="border" className="mb-2" />
    <div className="small">Loading your tasks…</div>
  </div>
) : load.status === "error" ? (
  <Alert variant="danger">
    <div className="fw-semibold mb-1">Couldn't load tasks</div>
    <div className="small">{load.message}</div>
  </Alert>
) : (
  <TaskList tasks={visibleTasks} isFiltered={tasks.length > 0} onEdit={setEditing} />
)}
```

**Verify:** clear `localStorage` (`localStorage.clear()` in the console) and reload. You should see the spinner for about a second, then the three fetched tasks. Reload again — instant, because storage now has them and the provider skips the fetch entirely.

**What this build step demonstrates:**

- **Validation at the boundary.** `fetchSeedTasks` returns `Promise<Task[]>` *honestly*, because `safeParse` verified it. No cast, no assumption.
- **A union for the load state**, not booleans — so a spinner can never appear over an error.
- **`AbortController` cleanup**, so Strict Mode's double-mount cancels the first request rather than racing it.
- **The persistence effect is gated on `status === "ready"`**, or the empty pre-load array would immediately overwrite whatever was in storage. That's a real bug this ordering avoids, and it's worth understanding: two effects touching the same external system need to agree about ordering.

**Try it yourself:** make `fetchSeedTasks` reject (`reject(new Error("503"))`) and confirm the error state renders with the message. Then add a Retry button that sets the status back to `{ status: "loading" }` — the effect's dependency on `load.status` makes that work with no extra machinery.

---

## 🔨 Build Step 13 — An axios API layer

Build Step 12's `fetchSeedTasks` was a `setTimeout` pretending to be a server. Replace it with a real axios client — the shape you'd ship — keeping the fake responses behind an adapter so the app still runs offline.

```bash
npm install axios
```

### 1. The client

Create `src/api/client.ts`:

```ts
import axios from "axios"

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message)
    this.name = "ApiError"
  }
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
  timeout: 8000,
  headers: { "Content-Type": "application/json" },
})

// Auth in one place: every request gets the header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("taskboard.token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// One error shape for the whole app
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error)) return Promise.reject(error)
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        localStorage.removeItem("taskboard.token")
      }
      const message =
        (error.response?.data as { message?: string } | undefined)?.message ?? error.message
      return Promise.reject(new ApiError(message, error.response?.status))
    }
    return Promise.reject(error)
  }
)
```

### 2. Keep it offline

Until there's a real server, give the instance a mock adapter — an in-memory stand-in that lets the whole data layer run offline. Create `src/api/mockAdapter.ts`:

```ts
import type { AxiosAdapter, AxiosRequestConfig } from "axios"
import type { Task } from "@/schemas/task"

const db: Task[] = [
  { id: "s1", title: "Read the API contract", priority: "high", done: false, createdAt: 3 },
  { id: "s2", title: "Set up the project", priority: "medium", done: true, createdAt: 2 },
  { id: "s3", title: "Write the first test", priority: "low", done: false, createdAt: 1 },
]

export function mockAdapter(delay = 700): AxiosAdapter {
  return (config: AxiosRequestConfig) =>
    new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => {
        resolve({
          data: db,
          status: 200,
          statusText: "OK",
          headers: {},
          config: config as never,
        } as never)
      }, delay)

      config.signal?.addEventListener(
        "abort",
        () => {
          window.clearTimeout(timer)
          reject(Object.assign(new Error("canceled"), { __CANCEL__: true }))
        },
        { once: true }
      )
    })
}
```

and wire it in `client.ts` while you have no backend:

```ts
import { mockAdapter } from "@/api/mockAdapter"

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
  timeout: 8000,
  headers: { "Content-Type": "application/json" },
  // Delete this one line the day a real server exists. Nothing else changes.
  adapter: mockAdapter(),
})
```

### 3. The resource module

Replace `src/api/tasks.ts`:

```ts
import { api } from "@/api/client"
import {
  TaskSchema,
  TaskListSchema,
  type NewTask,
  type Task,
} from "@/schemas/task"

export async function listTasks(signal?: AbortSignal): Promise<Task[]> {
  const res = await api.get("/tasks", { signal })
  return TaskListSchema.parse(res.data)      // validate, don't cast
}

export async function createTask(input: NewTask): Promise<Task> {
  const res = await api.post("/tasks", input)
  return TaskSchema.parse(res.data)
}

export async function updateTask(id: string, changes: Partial<NewTask>): Promise<Task> {
  const res = await api.patch(`/tasks/${id}`, changes)
  return TaskSchema.parse(res.data)
}

export async function deleteTask(id: string): Promise<void> {
  await api.delete(`/tasks/${id}`)
}
```

### 4. Use it

In `TaskProvider`, swap the import and the call:

```tsx
import { listTasks } from "@/api/tasks"
import { ApiError } from "@/api/client"
import axios from "axios"

useEffect(() => {
  if (load.status !== "loading") return
  const controller = new AbortController()

  listTasks(controller.signal)
    .then((seed) => {
      dispatch({ type: "replaced", tasks: seed })
      setLoad({ status: "ready" })
    })
    .catch((err: unknown) => {
      if (axios.isCancel(err)) return                    // our own abort — not a failure
      setLoad({
        status: "error",
        message: err instanceof ApiError ? err.message : "Couldn't reach the server",
      })
    })

  return () => controller.abort()
}, [load.status])
```

**Verify:** clear `localStorage` and reload. Spinner for ~700ms, then three tasks. Open the Network tab — nothing there, because the adapter answers in-process. Delete the `adapter` line and you'll see a real (failing) request to `/api/tasks`, which is the point: **the only difference between the mock and production is one line.**

### What this build step demonstrates

- **`baseURL`, `timeout`, auth and error normalisation live on the instance.** Call sites are paths.
- **`TaskListSchema.parse`, not `axios.get<Task[]>`.** The generic would be a claim; this is a check — and it's the **fourth** place Build Step 5's schema is used.
- **Components import `listTasks`, not axios.** Swap axios for `fetch`, or for a GraphQL client, and nothing outside `src/api/` changes.
- **`axios.isCancel` replaces `err.name !== "AbortError"`.** The race-condition discipline is unchanged — abort the previous request in the effect's cleanup; axios doesn't solve it for you.
- **The `catch` narrows to `ApiError`**, which the interceptor guaranteed. No component parses `error.response?.data`.

**Try it yourself:** make the adapter return `status: 500` for one reload. The interceptor converts it to an `ApiError`, the provider's error branch renders, and the Retry button (if you built it in Build Step 12) works. Then add a retry-once-on-5xx rule to the response interceptor and watch two attempts in the log — retry belongs there, not in components.

---

## 🔨 Build Step 14 — Routing and URL state in TaskBoard

**The idea.** More than one page needs a router. The less obvious half is that **the URL is state
too**: filters, search terms and the selected tab usually belong in the query string rather than in
component state, because that makes a view shareable, bookmarkable and refresh-proof for free. A
layout route means the header and container are declared once for every page.

```bash
npm install react-router-dom
```

Two goals: a Settings page (to justify a router at all), and moving the filter and search into the URL (to justify it properly).

Create `src/pages/BoardPage.tsx` — the current board, moved out of `App`:

```tsx
import { useState } from "react"
import { Alert, Spinner } from "react-bootstrap"
import { useSearchParams } from "react-router-dom"
import TaskList from "@/components/TaskList"
import AddTaskForm from "@/components/AddTaskForm"
import TaskToolbar from "@/components/TaskToolbar"
import TaskStats from "@/components/TaskStats"
import EditTaskModal from "@/components/EditTaskModal"
import { useTasks, useLoadStatus } from "@/context/TaskContext"
import type { Filter, Task } from "@/types"

const isFilter = (v: string): v is Filter =>
  v === "all" || v === "active" || v === "done"

export default function BoardPage() {
  const tasks = useTasks()
  const load = useLoadStatus()
  const [params, setParams] = useSearchParams()
  const [editingId, setEditingId] = useState<string | null>(null)

  // Filter and search now live in the URL — shareable and refresh-proof
  const rawFilter = params.get("filter") ?? "all"
  const filter: Filter = isFilter(rawFilter) ? rawFilter : "all"
  const query = params.get("q") ?? ""

  function setFilter(next: Filter) {
    setParams((prev) => {
      const p = new URLSearchParams(prev)
      if (next === "all") p.delete("filter")
      else p.set("filter", next)
      return p
    })
  }

  function setQuery(next: string) {
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev)
        if (!next) p.delete("q")
        else p.set("q", next)
        return p
      },
      { replace: true }        // don't create a history entry per keystroke
    )
  }

  // Store the id, derive the task
  const editing: Task | null = tasks.find((t) => t.id === editingId) ?? null

  const completed = tasks.filter((t) => t.done).length

  const visibleTasks = tasks
    .filter((t) => {
      if (filter === "active") return !t.done
      if (filter === "done") return t.done
      return true
    })
    .filter((t) => t.title.toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <>
      <AddTaskForm />
      <TaskStats total={tasks.length} completed={completed} />
      <TaskToolbar
        filter={filter}
        onFilterChange={setFilter}
        query={query}
        onQueryChange={setQuery}
      />

      {load.status === "loading" ? (
        <div className="text-center py-5 text-muted">
          <Spinner animation="border" className="mb-2" />
          <div className="small">Loading your tasks…</div>
        </div>
      ) : load.status === "error" ? (
        <Alert variant="danger">
          <div className="fw-semibold mb-1">Couldn't load tasks</div>
          <div className="small">{load.message}</div>
        </Alert>
      ) : (
        <TaskList
          tasks={visibleTasks}
          isFiltered={tasks.length > 0}
          onEdit={(task) => setEditingId(task.id)}
        />
      )}

      <EditTaskModal
        task={editing}
        show={editing !== null}
        onHide={() => setEditingId(null)}
      />
    </>
  )
}
```

Create `src/pages/SettingsPage.tsx`:

```tsx
import { Button, Card, Form, ListGroup } from "react-bootstrap"
import { useTasks, useTaskActions } from "@/context/TaskContext"

export default function SettingsPage() {
  const tasks = useTasks()
  const { clearCompleted } = useTaskActions()

  const completed = tasks.filter((t) => t.done).length
  const byPriority = {
    high: tasks.filter((t) => t.priority === "high").length,
    medium: tasks.filter((t) => t.priority === "medium").length,
    low: tasks.filter((t) => t.priority === "low").length,
  }

  return (
    <Card>
      <Card.Header className="fw-semibold">Settings</Card.Header>
      <ListGroup variant="flush">
        <ListGroup.Item className="d-flex justify-content-between">
          <span>Total tasks</span>
          <strong>{tasks.length}</strong>
        </ListGroup.Item>
        <ListGroup.Item className="d-flex justify-content-between">
          <span>Completed</span>
          <strong>{completed}</strong>
        </ListGroup.Item>
        <ListGroup.Item className="d-flex justify-content-between">
          <span>High / medium / low</span>
          <strong>
            {byPriority.high} / {byPriority.medium} / {byPriority.low}
          </strong>
        </ListGroup.Item>
      </ListGroup>
      <Card.Body className="d-flex flex-column gap-2 align-items-start">
        <Button
          variant="outline-danger"
          size="sm"
          disabled={completed === 0}
          onClick={clearCompleted}
        >
          Clear {completed} completed task{completed === 1 ? "" : "s"}
        </Button>
        <Form.Text>
          Every number on this page is derived from one array. Nothing here is state.
        </Form.Text>
      </Card.Body>
    </Card>
  )
}
```

Update `src/components/Header.tsx` to carry the navigation:

```tsx
import { Navbar, Container, Nav } from "react-bootstrap"
import { NavLink } from "react-router-dom"
import { CheckCircleFill } from "react-bootstrap-icons"

interface HeaderProps {
  title: string
  subtitle: string
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <Navbar className="bg-white border-bottom py-3">
      <Container
        className="d-flex align-items-center gap-3"
        style={{ maxWidth: 768 }}
      >
        <CheckCircleFill className="text-primary" size={24} />
        <div className="flex-grow-1">
          <h1 className="h5 mb-0">{title}</h1>
          <p className="text-muted small mb-0">{subtitle}</p>
        </div>
        <Nav>
          <Nav.Link as={NavLink} to="/" end>
            Board
          </Nav.Link>
          <Nav.Link as={NavLink} to="/settings">
            Settings
          </Nav.Link>
        </Nav>
      </Container>
    </Navbar>
  )
}
```

And `src/App.tsx` becomes the route tree:

```tsx
import { BrowserRouter, Routes, Route, Outlet, Link } from "react-router-dom"
import { Alert, Container } from "react-bootstrap"
import Header from "@/components/Header"
import BoardPage from "@/pages/BoardPage"
import SettingsPage from "@/pages/SettingsPage"

function Layout() {
  return (
    <div className="min-vh-100 bg-body-tertiary">
      <Header title="TaskBoard" subtitle="Everything you're working on, in one place." />
      <Container className="py-4" style={{ maxWidth: 768 }}>
        <Outlet />
      </Container>
    </div>
  )
}

function NotFound() {
  return (
    <Alert variant="warning">
      <div className="fw-semibold mb-1">Page not found</div>
      <Link to="/">Back to the board</Link>
    </Alert>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<BoardPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
```

**Verify:**

1. Filter to "Done" and search for something. Check the address bar: `/?filter=done&q=…`.
2. Copy that URL into a new tab. The board loads with the same filter and search applied.
3. Press Back. The filter reverts.
4. Navigate to Settings and back. The board's filter is preserved in the URL, so it comes back exactly as it was.
5. Visit `/nonsense` — the 404 renders inside the layout.

**Three things this build step got you:**

- **Shareable views**, with no persistence code — the URL carries the state.
- **`editingId` instead of `editing`**, which fixes the stale-object bug in the real app. Rename a task while its modal is open and the modal follows.
- **A `Layout` route with `Outlet`**, so the header and container are declared once for every page — including the 404.

Note that `TaskProvider` stays in `main.tsx`, *outside* the router. That's deliberate: the tasks are app-wide state, and wrapping them inside a route would destroy and re-fetch them on every navigation.

**Try it yourself:** add a `/tasks/:id` route showing one task's detail, linked from each card. You'll need `useParams`, a `tasks.find`, and a `<Navigate to="/" replace />` for an id that doesn't exist — which matters because `useParams` values are always `string | undefined` — a param can be missing at runtime however confident your route config looks.

---

## 🔨 Build Step 15 — Boundaries in TaskBoard

**The idea.** By default an uncaught error during render unmounts your **entire application** and
leaves a blank page — not the broken component, the whole tree. An error boundary catches errors thrown
by its descendants and shows a fallback instead. Where you put them is a product decision: if this part
fails, what should the user still be able to do?

Error boundaries must be **class components** — they rely on `getDerivedStateFromError` and
`componentDidCatch`, which have no hook equivalents. This is the one place you'll still write a class.

Create `src/components/ErrorBoundary.tsx`:

```tsx
import { Component, type ErrorInfo, type ReactNode } from "react"

interface Props {
  children: ReactNode
  /** Rendered instead of the children when a descendant throws. */
  fallback: (error: Error, reset: () => void) => ReactNode
  onError?: (error: Error, info: ErrorInfo) => void
}

interface State {
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }              // render the fallback on the next render
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In production this is your Sentry/Rollbar call
    this.props.onError?.(error, info)
    console.error("Caught by boundary:", error, info.componentStack)
  }

  reset = () => this.setState({ error: null })

  render() {
    if (this.state.error) return this.props.fallback(this.state.error, this.reset)
    return this.props.children
  }
}
```

> Prefer not to maintain this? `npm install react-error-boundary` gives you the same thing with a
> nicer API (`fallbackRender`, `useErrorBoundary`). The class is here so you can see what it does.

**What a boundary does *not* catch:** anything thrown in an **event handler** or in **async code**
(promises, `setTimeout`). Those don't run during render, so they never reach a boundary — handle them
with an ordinary `try`/`catch` and an error state.

Now layer two boundaries into `App.tsx`:

```tsx
import { BrowserRouter, Routes, Route, Outlet, Link } from "react-router-dom"
import { Alert, Button, Container } from "react-bootstrap"
import ErrorBoundary from "@/components/ErrorBoundary"
import Header from "@/components/Header"
import BoardPage from "@/pages/BoardPage"
import SettingsPage from "@/pages/SettingsPage"

function PageError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <Alert variant="danger">
      <div className="fw-semibold mb-1">This page couldn't render</div>
      <div className="small font-monospace mb-3">{error.message}</div>
      <div className="d-flex gap-2">
        <Button size="sm" variant="outline-danger" onClick={reset}>
          Try again
        </Button>
        <Button size="sm" variant="outline-secondary" as={Link as never} to="/">
          Back to the board
        </Button>
      </div>
    </Alert>
  )
}

function Layout() {
  return (
    <div className="min-vh-100 bg-body-tertiary">
      <Header title="TaskBoard" subtitle="Everything you're working on, in one place." />
      <Container className="py-4" style={{ maxWidth: 768 }}>
        {/* Per-page boundary: a broken page keeps the header and nav usable */}
        <ErrorBoundary fallback={(error, reset) => <PageError error={error} reset={reset} />}>
          <Outlet />
        </ErrorBoundary>
      </Container>
    </div>
  )
}

export default function App() {
  return (
    // App-wide boundary: the last resort, so a layout failure isn't a blank page
    <ErrorBoundary
      fallback={(error) => (
        <Container className="py-5" style={{ maxWidth: 640 }}>
          <Alert variant="danger">
            <div className="fw-semibold mb-1">TaskBoard hit an unexpected error</div>
            <div className="small font-monospace mb-3">{error.message}</div>
            <Button size="sm" onClick={() => window.location.reload()}>
              Reload the app
            </Button>
          </Alert>
        </Container>
      )}
    >
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<BoardPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
```

**Verify it works.** Add a deliberate crash to `SettingsPage`:

```tsx
// temporarily, at the top of SettingsPage
if (tasks.length > 0) throw new Error("Deliberate test crash")
```

Navigate to Settings. You should see the page-level fallback **with the header still there**, and the Board link still working. That's the containment you designed. Remove the throw afterwards.

**Why two layers:** the inner boundary keeps navigation alive when a page fails, which means the user can get themselves out. The outer one exists for failures in the layout or router itself, where there's nothing left to navigate with — so its only sensible action is a reload.

**Try it yourself:** lazy-load `SettingsPage` with `lazy` + `Suspense`, then run `npm run build` and confirm it's a separate chunk. Settings is exactly the kind of page most users never open.

---

## 🔨 Build Step 16 — Tests for TaskBoard

**The idea.** Test behaviour, not implementation — interact the way a user would and assert on
what's visible. Done that way, a test suite survives refactors that preserve behaviour, which is
exactly the kind you keep doing. The cheapest and highest-value tests are on **pure functions**: the
reducer and the schema need no renderer, no DOM and no mocks.

### Set up the test runner

```bash
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

Add the `test` block to **`vite.config.ts`**:

```ts
/// <reference types="vitest/config" />
import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
    css: false,            // Bootstrap's CSS isn't needed in tests
  },
})
```

Create `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

// Unmount between tests so they can't affect each other
afterEach(() => {
  cleanup()
})
```

and add the scripts to `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

`npm test` watches, which is how you'll use it while writing. `npm run test:run` runs once and exits —
that's what CI wants.

### Query priority, briefly

Testing Library prefers queries that only work if your markup is accessible, which makes it a
usability check as well as a test:

| Prefer | Then | Last resort |
|---|---|---|
| `getByRole("button", { name: "Add" })` | `getByLabelText("Task")` | `getByTestId(...)` |

And three variants of every query, whose difference matters: **`getBy`** throws if absent (something
that must be there now), **`queryBy`** returns `null` (for asserting absence), **`findBy`** waits and
returns a promise (for anything asynchronous — which now includes validation, since the forms use a
resolver).

### Now write the tests

Four files, in order of value.

**1. The reducer** — `src/context/tasksReducer.test.ts`. First extract the reducer from `TaskContext.tsx` into its own file (`src/context/tasksReducer.ts`) and import it in both places; a pure function in its own module is easier to test and easier to read.

```ts
import { describe, expect, it } from "vitest"
import { tasksReducer } from "./tasksReducer"
import type { Task } from "@/types"

const base: Task[] = [
  { id: "a", title: "First", priority: "high", done: false, createdAt: 1 },
  { id: "b", title: "Second", priority: "low", done: true, createdAt: 2 },
]

describe("tasksReducer", () => {
  it("adds a task at the front, not done", () => {
    const next = tasksReducer(base, {
      type: "added",
      id: "c",
      createdAt: 3,
      title: "Third",
      priority: "medium",
    })
    expect(next).toHaveLength(3)
    expect(next[0]).toEqual({
      id: "c",
      title: "Third",
      priority: "medium",
      done: false,
      createdAt: 3,
    })
  })

  it("toggles only the matching task", () => {
    const next = tasksReducer(base, { type: "toggled", id: "a" })
    expect(next[0].done).toBe(true)
    expect(next[1].done).toBe(true)
  })

  it("applies a partial update", () => {
    const next = tasksReducer(base, {
      type: "updated",
      id: "a",
      changes: { title: "Renamed" },
    })
    expect(next[0].title).toBe("Renamed")
    expect(next[0].priority).toBe("high")     // untouched
  })

  it("deletes by id", () => {
    expect(tasksReducer(base, { type: "deleted", id: "a" }).map((t) => t.id)).toEqual(["b"])
  })

  it("clears completed tasks", () => {
    expect(tasksReducer(base, { type: "clearedCompleted" }).map((t) => t.id)).toEqual(["a"])
  })

  it("replaces the whole list", () => {
    expect(tasksReducer(base, { type: "replaced", tasks: [] })).toEqual([])
  })

  it("never mutates its input", () => {
    const snapshot = JSON.stringify(base)
    tasksReducer(base, { type: "toggled", id: "a" })
    tasksReducer(base, { type: "deleted", id: "b" })
    tasksReducer(base, { type: "clearedCompleted" })
    expect(JSON.stringify(base)).toBe(snapshot)
  })

  it("preserves the identity of untouched tasks", () => {
    const next = tasksReducer(base, { type: "toggled", id: "a" })
    expect(next[1]).toBe(base[1])
  })
})
```

**2. The add form** — `src/components/AddTaskForm.test.tsx`. It needs the provider, so wrap it:

```tsx
import { describe, expect, it } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import AddTaskForm from "./AddTaskForm"
import TaskList from "./TaskList"
import { TaskProvider } from "@/context/TaskContext"

/** Renders the form and a list together, so we can assert on the outcome. */
function renderWithProvider() {
  return render(
    <TaskProvider>
      <AddTaskForm />
      <TaskList tasks={[]} isFiltered={false} onEdit={() => {}} />
    </TaskProvider>
  )
}

describe("AddTaskForm", () => {
  it("requires a title", async () => {
    const user = userEvent.setup()
    renderWithProvider()

    await user.click(screen.getByRole("button", { name: /add/i }))

    // The message comes from NewTaskSchema — findBy, because validation is async
    expect(await screen.findByText("Give the task a title.")).toBeInTheDocument()
  })

  it("rejects a whitespace-only title", async () => {
    const user = userEvent.setup()
    renderWithProvider()

    await user.type(screen.getByLabelText("Task"), "     ")
    await user.click(screen.getByRole("button", { name: /add/i }))

    // .trim() runs before .min(1) in the schema
    expect(await screen.findByText("Give the task a title.")).toBeInTheDocument()
  })

  it("resets the fields after a successful add", async () => {
    const user = userEvent.setup()
    renderWithProvider()

    const input = screen.getByLabelText("Task")
    await user.type(input, "Write the tests")
    await user.selectOptions(screen.getByLabelText("Priority"), "high")
    await user.click(screen.getByRole("button", { name: /add/i }))

    await waitFor(() => expect(input).toHaveValue(""))
    expect(screen.getByLabelText("Priority")).toHaveValue("medium")
  })

  it("trims the title before adding it", async () => {
    const user = userEvent.setup()
    renderWithProvider()

    await user.type(screen.getByLabelText("Task"), "  Padded  ")
    await user.click(screen.getByRole("button", { name: /add/i }))

    // The schema's .trim() means the stored task has no surrounding spaces
    expect(await screen.findByText("Padded")).toBeInTheDocument()
  })
})
```

**3. The empty states** — `src/components/TaskList.test.tsx`, because the two-message distinction from Build Step 6 is exactly the kind of detail a future refactor silently breaks:

```tsx
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import TaskList from "./TaskList"
import { TaskProvider } from "@/context/TaskContext"
import type { Task } from "@/types"

const tasks: Task[] = [
  { id: "a", title: "Visible task", priority: "low", done: false, createdAt: 1 },
]

function renderList(props: Partial<React.ComponentProps<typeof TaskList>> = {}) {
  return render(
    <TaskProvider>
      <TaskList tasks={tasks} isFiltered={false} onEdit={() => {}} {...props} />
    </TaskProvider>
  )
}

describe("TaskList", () => {
  it("renders the tasks it is given", () => {
    renderList()
    expect(screen.getByText("Visible task")).toBeInTheDocument()
  })

  it("shows the onboarding empty state when there are no tasks at all", () => {
    renderList({ tasks: [], isFiltered: false })
    expect(screen.getByText("No tasks yet")).toBeInTheDocument()
  })

  it("shows the no-matches empty state when a filter excluded everything", () => {
    renderList({ tasks: [], isFiltered: true })
    expect(screen.getByText("Nothing matches")).toBeInTheDocument()
  })
})
```

**4. The schema** — `src/schemas/task.test.ts`. It guards four boundaries now (Build Step 5), so it's the highest-value test in the project:

```ts
import { describe, expect, it } from "vitest"
import { NewTaskSchema, TaskListSchema } from "./task"

describe("NewTaskSchema", () => {
  it("trims the title", () => {
    const r = NewTaskSchema.safeParse({ title: "  Buy milk  ", priority: "low" })
    expect(r.success && r.data.title).toBe("Buy milk")
  })

  it("rejects a whitespace-only title", () => {
    expect(NewTaskSchema.safeParse({ title: "   ", priority: "low" }).success).toBe(false)
  })

  it("rejects an unknown priority", () => {
    expect(NewTaskSchema.safeParse({ title: "x", priority: "urgent" }).success).toBe(false)
  })
})

describe("TaskListSchema", () => {
  it("rejects storage data of the wrong shape", () => {
    // exactly the localStorage corruption from Build Step 7
    expect(TaskListSchema.safeParse([{ title: 42 }]).success).toBe(false)
  })
})
```

**Run them:**

```bash
npm test
```

**What you've got for about 130 lines:** every state transition in the reducer verified, the immutability convention locked in, the form's validation and reset behaviour pinned, both empty states protected, and the schema — which now guards the add form, the edit modal, `localStorage` and the API — tested directly.

**Two things changed because the forms use react-hook-form and zod.** Validation is now **asynchronous**, so an assertion straight after a click needs `findBy…` or `waitFor` rather than `getBy…` — that's the `getBy`/`findBy` distinction, met for real. And the error *strings* now live in `NewTaskSchema`, so a message change is one edit in one file — which is also why the schema deserves its own test rather than being tested only through the UI.

**What you deliberately haven't tested:** that Bootstrap renders cards, that the progress bar has the right width, that `useState` was called. None of those would catch a real bug, and all of them would break on the next refactor.

**Try it yourself:**

1. Add `"critical"` to the `Priority` union. Run the tests. The reducer tests still pass (they don't enumerate priorities), but `npm run build` fails on `priorityVariant`. **Types and tests catch different things**, and you want both.
2. Break the reducer on purpose — change `toggled` to mutate. Two tests fail, and their names tell you what's wrong without you reading the code.
3. Write a regression test for a bug you actually hit while building TaskBoard. That's the highest-value test you'll write today.

---

## 🔨 Build Step 17 — Migrate the store to Redux Toolkit

Build Step 9 put a reducer behind two contexts. That was the right call at the time, and and it has a ceiling: **no selective subscription.** Every consumer of `TasksContext` re-renders on every task change, and splitting dispatch off was a workaround, not a fix.

This step swaps the transport. **The reducer survives almost unchanged** — which is the point worth making to participants: you already wrote the hard part in Build Step 9.

```bash
npm install @reduxjs/toolkit react-redux
```

### 1. The slice — your reducer, with the boilerplate deleted

Create `src/store/tasksSlice.ts`:

```ts
import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit"
import axios from "axios"
import { listTasks } from "@/api/tasks"
import { ApiError } from "@/api/client"
import type { NewTask, Task } from "@/schemas/task"

interface TasksState {
  items: Task[]
  status: "loading" | "ready" | "error"
  error: string | null
}

const initialState: TasksState = { items: [], status: "loading", error: null }

/** Build Step 13's API module, as a thunk. Validation already happened inside listTasks. */
export const loadTasks = createAsyncThunk<Task[], void, { rejectValue: string }>(
  "tasks/load",
  async (_arg, { signal, rejectWithValue }) => {
    try {
      return await listTasks(signal)
    } catch (err) {
      if (axios.isCancel(err)) throw err
      return rejectWithValue(err instanceof ApiError ? err.message : "Couldn't reach the server")
    }
  }
)

const tasksSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    added: {
      reducer(state, action: PayloadAction<Task>) {
        state.items.unshift(action.payload)
      },
      // The impurity lives here, not in the reducer
      prepare({ title, priority }: NewTask) {
        return {
          payload: {
            id: crypto.randomUUID(),
            title,
            priority,
            done: false,
            createdAt: Date.now(),
          } as Task,
        }
      },
    },
    toggled(state, action: PayloadAction<string>) {
      const task = state.items.find((t) => t.id === action.payload)
      if (task) task.done = !task.done
    },
    updated(state, action: PayloadAction<{ id: string; changes: Partial<NewTask> }>) {
      const task = state.items.find((t) => t.id === action.payload.id)
      if (task) Object.assign(task, action.payload.changes)
    },
    deleted(state, action: PayloadAction<string>) {
      state.items = state.items.filter((t) => t.id !== action.payload)
    },
    clearedCompleted(state) {
      state.items = state.items.filter((t) => !t.done)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadTasks.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(loadTasks.fulfilled, (state, action) => {
        state.status = "ready"
        state.items = action.payload
      })
      .addCase(loadTasks.rejected, (state, action) => {
        if (action.meta.aborted) return            // our own abort isn't a failure
        state.status = "error"
        state.error = action.payload ?? "Couldn't reach the server"
      })
  },
})

export const { added, toggled, updated, deleted, clearedCompleted } = tasksSlice.actions

// ---- selectors: the state shape lives here, not in components ----
export const selectTasks = (s: { tasks: TasksState }) => s.tasks.items
export const selectStatus = (s: { tasks: TasksState }) => s.tasks.status
export const selectError = (s: { tasks: TasksState }) => s.tasks.error
export const selectTaskCount = (s: { tasks: TasksState }) => s.tasks.items.length
export const selectDoneCount = (s: { tasks: TasksState }) =>
  s.tasks.items.filter((t) => t.done).length

export default tasksSlice.reducer
```

Compare the five `reducers` entries with Build Step 9's `switch`. Same transitions, same immutability guarantees — and the action-type union, the action creators and the `never` exhaustiveness check are now generated.

### 2. The store, the types, the hooks

Create `src/store/index.ts`:

```ts
import { configureStore } from "@reduxjs/toolkit"
import tasksReducer from "@/store/tasksSlice"

export const store = configureStore({
  reducer: { tasks: tasksReducer },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```

Create `src/store/hooks.ts`:

```ts
import { useDispatch, useSelector } from "react-redux"
import type { RootState, AppDispatch } from "@/store"

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
```

### 3. Persistence, as middleware

Build Step 7's effect had nowhere to live once state left React. Put it in a listener instead — `src/store/persist.ts`:

```ts
import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit"
import { TaskListSchema } from "@/schemas/task"
import {
  added, toggled, updated, deleted, clearedCompleted, loadTasks,
} from "@/store/tasksSlice"
import type { RootState } from "@/store"

const STORAGE_KEY = "taskboard.tasks"

export const persistListener = createListenerMiddleware()

persistListener.startListening({
  matcher: isAnyOf(added, toggled, updated, deleted, clearedCompleted, loadTasks.fulfilled),
  effect: (_action, api) => {
    const { tasks } = api.getState() as RootState
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks.items))
    } catch {
      /* storage full or blocked */
    }
  },
})

/** Read once at startup. Storage is untrusted input, so validate it. */
export function loadPersisted(): Task[] | undefined {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return undefined
    const parsed = TaskListSchema.safeParse(JSON.parse(saved))
    return parsed.success ? parsed.data : undefined
  } catch {
    return undefined
  }
}
```

Wire both into the store:

```ts
import { persistListener, loadPersisted } from "@/store/persist"

const persisted = loadPersisted()

export const store = configureStore({
  reducer: { tasks: tasksReducer },
  preloadedState: persisted
    ? { tasks: { items: persisted, status: "ready" as const, error: null } }
    : undefined,
  middleware: (getDefault) => getDefault().prepend(persistListener.middleware),
})
```

`preloadedState` replaces the lazy `useState` initialiser; the listener replaces the effect. Both still validate.

### 4. Swap the provider

In `src/main.tsx`, `TaskProvider` goes and `Provider` arrives:

```tsx
import { Provider } from "react-redux"
import { store } from "@/store"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
)
```

### 5. Update the consumers

Each component now subscribes to exactly what it needs:

```tsx
// BoardPage.tsx
const tasks = useAppSelector(selectTasks)
const status = useAppSelector(selectStatus)
const error = useAppSelector(selectError)
const dispatch = useAppDispatch()

useEffect(() => {
  if (status === "loading") {
    const promise = dispatch(loadTasks())
    return () => promise.abort()      // cancel on unmount, via the thunk
  }
}, [status, dispatch])
```

```tsx
// TaskCard.tsx — dispatches only, so it subscribes to nothing
const dispatch = useAppDispatch()
<Form.Check checked={task.done} onChange={() => dispatch(toggled(task.id))} />
<Button onClick={() => dispatch(deleted(task.id))}>…</Button>
```

```tsx
// AddTaskForm.tsx — onValid dispatches instead of calling a context action
function onValid(task: NewTask) {
  dispatch(added(task))               // `prepare` fills in id, done and createdAt
  reset(emptyTask)
}
```

```tsx
// TaskStats.tsx — two primitives, so no memoisation needed
const total = useAppSelector(selectTaskCount)
const completed = useAppSelector(selectDoneCount)
```

**Delete `src/context/TaskContext.tsx`.** Everything it did now lives in the slice, the store and the hooks.

**Verify:** identical behaviour. Then open **Redux DevTools** and tick a checkbox — you'll see `tasks/toggled` with the state before and after, and you can time-travel. That's new, and it cost nothing.

### What this build step demonstrates

- **The reducer was the durable part.** Build Step 9's transitions moved across almost verbatim; what was thrown away was the plumbing around them.
- **Selective subscription, at last.** `TaskStats` selects two numbers, so editing a *title* no longer re-renders it. With the Context version every consumer re-rendered on every change — the Context ceiling, fixed in the app.
- **`prepare` is where `crypto.randomUUID()` belongs**, keeping the reducer pure and safe under Strict Mode's double-invocation.
- **The load thunk reuses Build Step 13's API module**, so validation still happens once, at the boundary.
- **Persistence became middleware.** State outside React needs its side effects outside React too — and `meta.aborted` still stops your own cancellation showing as an error.

**Try it yourself:**

1. Add `<RenderBadge>` to `TaskStats` and edit a task's title. It doesn't re-render. Then change `selectDoneCount` to `(s) => s.tasks.items` and read `.filter()` in the component — now it re-renders on every keystroke, because it subscribed to the array. That's the selector-identity trap in your own app: `useSelector` compares with `===`, so returning a fresh array every call means it never bails out.
2. Dispatch from the console: `window.__store = store` in `index.ts`, then `__store.dispatch({ type: "tasks/clearedCompleted" })`. State outside React, which Context couldn't do.
3. **The Zustand alternative.** Zustand does the same job with one file and no provider. Redo this migration with `create()` + `persist` + `devtools` and compare: roughly a third of the code, and you lose the enforced convention. The honest comparison: Redux buys you an enforced convention, which matters when several people edit the same state; Zustand buys you brevity. For TaskBoard, which one person maintains, Zustand is arguably the better call. The reason RTK is the *built* path here is that it's what you'll meet in a large codebase.

---

# Appendix — Where you ended up

## The finished file tree

After step 17. If you stopped at 16, everything under `src/store/` is absent and
`src/context/` is still the state transport.

```
taskboard/
├── index.html
├── package.json
├── tsconfig.json              ← @ alias (0.5)
├── tsconfig.app.json          ← @ alias (0.5)
├── vite.config.ts             ← @ alias (0.5) + vitest config (step 16)
└── src/
    ├── main.tsx               ← Bootstrap CSS, StrictMode, Provider (step 17)
    ├── index.css              ← emptied, plus .border-dashed
    ├── types.ts               ← step 1;  re-exports from schemas/ after step 5
    │
    ├── schemas/
    │   ├── task.ts            ← step 5  — the single source of truth for "valid task"
    │   └── task.test.ts       ← step 16
    │
    ├── data/
    │   └── seed.ts            ← step 1
    │
    ├── components/
    │   ├── Header.tsx         ← step 1
    │   ├── TaskCard.tsx       ← step 2,  actions added in step 4
    │   ├── TaskList.tsx       ← step 3,  empty states refined in step 6
    │   ├── TaskList.test.tsx  ← step 16
    │   ├── AddTaskForm.tsx    ← step 5  (react-hook-form + zodResolver)
    │   ├── AddTaskForm.test.tsx ← step 16
    │   ├── TaskToolbar.tsx    ← step 6,  URL-driven in step 14
    │   ├── TaskStats.tsx      ← step 6
    │   ├── EditTaskModal.tsx  ← step 10 (same schema, mode: "onTouched")
    │   └── ErrorBoundary.tsx  ← step 15
    │
    ├── hooks/
    │   ├── useLocalStorage.ts ← step 8  (generic, validated)
    │   └── useTasks.ts        ← step 8
    │
    ├── context/
    │   ├── tasksReducer.ts    ← step 9  — pure, survives into step 17 almost unchanged
    │   ├── tasksReducer.test.ts ← step 16
    │   └── TaskContext.tsx    ← step 9  (split state/dispatch); removed in step 17
    │
    ├── api/
    │   ├── mockAdapter.ts     ← step 13 — offline stand-in for a server
    │   ├── client.ts          ← step 13 — the axios instance + interceptors
    │   └── tasks.ts           ← step 13 — the typed, validated API module
    │
    ├── pages/
    │   ├── BoardPage.tsx      ← step 14
    │   └── SettingsPage.tsx   ← step 14
    │
    ├── store/                 ← step 17 only
    │   ├── index.ts           — configureStore, preloadedState
    │   ├── tasksSlice.ts      — createSlice + createAsyncThunk
    │   ├── hooks.ts           — typed useAppDispatch / useAppSelector
    │   └── persist.ts         — subscribe-based persistence
    │
    └── test/
        └── setup.ts           ← step 16
```

## The dependency list

What you installed, and what each one bought you:

| Package | Step | Why |
|---|---|---|
| `bootstrap` | 0.3 | The CSS. Classes and visual design. |
| `react-bootstrap` | 0.3 | Real React components rendering Bootstrap markup. Replaces Bootstrap's JS entirely. |
| `react-bootstrap-icons` | 0.3 | Icons as components, so they take props. |
| `react-hook-form` | 5 | Uncontrolled form state, so typing doesn't re-render the form. |
| `zod` | 5 | One runtime schema that is also the TypeScript type, via `z.infer`. |
| `@hookform/resolvers` | 5 | The bridge: hands zod's errors to react-hook-form's `formState`. |
| `axios` | 13 | Instances, interceptors, and errors that reject instead of resolving. |
| `react-router-dom` | 14 | Routes, and the URL as a place to keep state. |
| `vitest` + Testing Library | 16 | Tests that use the app the way a user does. |
| `@reduxjs/toolkit` + `react-redux` | 17 | A store outside the tree, with Immer and typed hooks. |

Deliberately **not** installed, and worth knowing why:

- **A state management library before step 17.** `useState` → lifted state → `useReducer` + Context carried the whole app to step 16. Reaching for a store before you've felt the pain it solves is how apps end up with three of them.
- **A data-fetching library** (TanStack Query, RTK Query). Steps 12 and 13 do it by hand so the race condition, the three-state model and the validation boundary are things you've implemented rather than things a library hid from you. In production, use the library — you'll now know what it's doing.
- **`jquery`.** React-Bootstrap makes it unnecessary, and including it breaks modals and dropdowns by double-handling events.
- **A CSS-in-JS library.** Bootstrap's utilities cover this app.

## What the schema ended up guarding

`src/schemas/task.ts` arrives in step 5 for one form and is then imported by five call sites, each a
boundary where untrusted data could enter typed state:

| Boundary | Step | What would happen without it |
|---|---|---|
| The add-task form | 5 | Empty or 500-character titles in state |
| `localStorage` on startup | 7 | Corrupt or outdated stored shapes flowing into `Task[]` |
| The edit modal | 10 | Two forms drifting apart on what "valid" means |
| The API response | 13 | `axios.get<Task[]>()` is a cast, not a check — a changed backend crashes far from the cause |
| The tests | 16 | The rules asserted in prose rather than in code |

**This is the single highest-leverage idea in the guide.** One definition of "what is a valid task",
enforced everywhere data crosses into your program.

## Honest gaps

TaskBoard is a complete app, not a production one. What a real deployment would add:

- **A real backend.** `mockAdapter` intercepts requests in the browser. Swapping it for a real base URL is a one-line change in `client.ts` — which was the point of building the layer.
- **Authentication.** The interceptor in step 13 attaches a token from `localStorage`; where that token comes from, how it refreshes, and what happens on a 401 are all unwritten.
- **Optimistic updates.** Every mutation here waits for the local reducer, which is instant. Against a network, you'd want the UI to move first and roll back on failure.
- **Accessibility beyond the basics.** Labels and roles are correct; focus management on route change and modal close, and `aria-live` for the stats, are not. Run `axe` DevTools and fix what it finds — it's a genuinely useful hour.
- **Meaningful test coverage.** Step 16 tests the reducer, the schema, and two components. A real suite would cover the toolbar, the modal, and the thunk.

## Extending it yourself

The most valuable exercise from here is adding a feature with no guide. Roughly in order of difficulty:

1. **Due dates**, with overdue tasks highlighted. Touches the schema, the form, the card, and sorting.
2. **Tags**, many per task. Your first array field — the schema, a multi-select, and filtering by tag.
3. **Drag-to-reorder.** Forces an explicit `order` field and an honest look at what `key` is doing.
4. **Undo.** Keep a stack of previous states in the reducer. Genuinely easier with a reducer than with `useState`, which is the lesson.
5. **Multiple boards**, with the board id in the route. Exercises routing, normalised state, and "store the id, not the object" at once.

Add each one the way the guide did: decide where the state belongs, extend the schema first, then the
UI, then a test. If you can do that unaided, you can build React applications.
