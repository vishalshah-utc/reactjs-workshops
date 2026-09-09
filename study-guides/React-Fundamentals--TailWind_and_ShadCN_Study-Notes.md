# ReactJS Fundamentals — Study Notes & Guided Project

**What this is:** a self-contained set of study notes covering React's core concepts, each one immediately applied to a real app you build step by step.

**What you'll build:** **TaskBoard** — a task management board with adding, completing, deleting, filtering, searching, stats, persistence, and an edit dialog. Styled with **shadcn/ui** + Tailwind CSS.

**Language:** JavaScript (`.jsx`). TypeScript notes are included where relevant, but nothing here requires it.

---

## How to use these notes

Work top to bottom. The document alternates between two kinds of sections:

| Section type | What it is |
|---|---|
| **Concept** | The idea explained, with a small standalone example you can read (or paste into a scratch file). |
| **Build Step** | Code you paste into the TaskBoard project. Every build step leaves the app in a **working, runnable state**. |

Rules that will make this go well:

1. **Type the code at least once** rather than only pasting. Muscle memory matters more than you'd think.
2. **Run the app after every build step.** If it breaks, fix it before moving on — errors compound.
3. **Do the "Try it yourself" prompts.** They're where the learning actually sticks.
4. Keep the browser console open. React tells you what's wrong; most people just aren't looking.

---

## Table of contents

**Setup**
- [Part 0 — Environment & shadcn/ui setup](#part-0--environment--shadcnui-setup)

**Core React**
- [1. The React mental model](#1-the-react-mental-model)
- [2. JSX](#2-jsx)
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
- [Glossary](#glossary)
- [Where to go next](#where-to-go-next)

---

# Part 0 — Environment & shadcn/ui setup

## 0.1 Prerequisites

| Tool | Version | Check with |
|---|---|---|
| Node.js | 20 LTS or newer | `node -v` |
| npm | comes with Node | `npm -v` |
| Editor | VS Code + ESLint, Prettier, Tailwind CSS IntelliSense | — |
| Browser | Chrome/Edge + [React Developer Tools](https://react.dev/learn/react-developer-tools) | — |

You should be comfortable with modern JavaScript before starting: arrow functions, destructuring, spread/rest, template literals, `map`/`filter`/`reduce`, modules, and promises/`async-await`. If any of those are hazy, spend an hour on them first — React itself is small, but it assumes fluent JS.

## 0.2 Create the project

```bash
npm create vite@latest taskboard -- --template react
cd taskboard
npm install
```

> **TypeScript instead?** Use `--template react-ts` and rename files `.tsx`. The rest of this guide works unchanged apart from adding type annotations.

## 0.3 Install Tailwind CSS

shadcn/ui is built on Tailwind, so Tailwind comes first.

```bash
npm install tailwindcss @tailwindcss/vite
```

Replace **everything** in `src/index.css` with a single line:

```css
@import "tailwindcss";
```

Delete `src/App.css` — you won't need it.

## 0.4 Configure the `@` import alias

shadcn/ui generates components that import from `@/components/ui/...`, so the alias must exist before you run its CLI.

Create **`jsconfig.json`** in the project root:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Install Node types so Vite can use `path`:

```bash
npm install -D @types/node
```

Replace **`vite.config.js`** with:

```js
import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

## 0.5 Initialise shadcn/ui

```bash
npx shadcn@latest init
```

Answer the prompts (base colour `slate` or `zinc` is a safe default). This creates `components.json`, adds CSS theme variables to `src/index.css`, and creates `src/lib/utils.js`.

**Important for JavaScript projects:** open `components.json` and confirm it contains `"tsx": false`. If it says `true`, change it — otherwise the CLI will generate `.tsx` files:

```json
{
  "style": "new-york",
  "rsc": false,
  "tsx": false,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

> **Faster alternative:** `npx shadcn@latest init -t vite` scaffolds a brand-new Vite project with Tailwind and shadcn already wired up (TypeScript). Use it if you'd rather skip 0.2–0.5. The manual route above is worth doing once so you understand what the tooling actually does.

## 0.6 Add the components you'll need

```bash
npx shadcn@latest add button card input label badge checkbox select tabs dialog separator
```

These land in `src/components/ui/` **as source files you own**. That's the whole idea behind shadcn/ui: it isn't an npm dependency you import from, it's a generator that copies readable component code into your repo so you can edit it. Open `src/components/ui/button.jsx` and read it — it's a small, ordinary React component, and understanding it is genuinely useful practice.

Also install the icon library:

```bash
npm install lucide-react
```

## 0.7 Verify

Replace `src/App.jsx` with:

```jsx
import { Button } from "@/components/ui/button"

export default function App() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">TaskBoard</h1>
      <Button>Setup works</Button>
    </div>
  )
}
```

Make sure `src/main.jsx` imports the stylesheet:

```jsx
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App.jsx"
import "./index.css"

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

Run it:

```bash
npm run dev
```

Open `http://localhost:5173`. A styled button, centred on the page, means everything is wired correctly.

**Troubleshooting**

| Symptom | Fix |
|---|---|
| `Cannot resolve @/components/...` | Alias missing from **both** `jsconfig.json` and `vite.config.js`. Restart the dev server after editing. |
| Components render unstyled | `src/index.css` not imported in `main.jsx`, or the `@import "tailwindcss";` line was removed by the CLI. |
| CLI generated `.tsx` files in a JS project | Set `"tsx": false` in `components.json`, delete `src/components/ui/`, re-run the `add` command. |
| Nothing renders, blank page | Check the browser console. Almost always a typo in an import path. |

---

# 1. The React mental model

Before syntax, the idea. React rests on three things:

**1. UI is a function of state.** You don't write instructions to change the screen. You describe what the screen should look like *for a given set of data*, and React works out the DOM operations.

```js
// Not React — imperative. You manage the DOM yourself.
document.getElementById("count").textContent = count + 1

// React — declarative. You describe the output for the current state.
<span>{count}</span>
```

**2. Components are the unit of everything.** A component is a function that takes data and returns a description of UI. Components nest to form a tree, and the tree is your application.

**3. State changes trigger re-renders.** When state changes, React calls your component function again, produces a new description of the UI, compares it with the previous one, and updates only what actually differs. "Re-render" means *React called your function again* — it does **not** mean the browser repainted everything.

The practical consequence, and the thing that trips up experienced developers coming from other paradigms: **you never reach for the DOM to change what's on screen. You change state, and let the screen follow.** Almost every React bug in your first month traces back to fighting this.

---

# 2. JSX

JSX is syntax sugar that looks like HTML and compiles to JavaScript function calls.

```jsx
const element = <h1 className="title">Hello</h1>
// compiles to roughly:
// jsx("h1", { className: "title", children: "Hello" })
```

Because it's JavaScript, it follows JavaScript's rules — this is the source of every JSX quirk.

### The rules

**Embed expressions with `{}`:**

```jsx
const user = { name: "Ada", tasks: 3 }

<p>{user.name} has {user.tasks} tasks</p>
<p>{user.tasks > 0 ? "Busy" : "Free"}</p>
<p>{user.name.toUpperCase()}</p>
```

Expressions only — `{}` takes something that produces a value. `if`, `for`, and `switch` are statements and won't work inside JSX.

**`className`, not `class`** — `class` is a reserved word in JavaScript. Similarly `htmlFor` instead of `for`, and camelCase for everything else (`onClick`, `tabIndex`, `strokeWidth`).

**Every tag must close:** `<img />`, `<br />`, `<input />`.

**Return one root element.** Wrap siblings in a fragment when you don't want an extra DOM node:

```jsx
<>
  <h1>Title</h1>
  <p>Body</p>
</>
```

**Style takes an object with camelCase keys:**

```jsx
<div style={{ marginTop: 8, backgroundColor: "red" }} />
```

You'll rarely use this — Tailwind classes cover almost everything.

### What renders and what doesn't

```jsx
{null}          // renders nothing
{undefined}     // renders nothing
{false}         // renders nothing
{0}             // renders "0"  ← the classic gotcha
{[1, 2, 3]}     // renders "123"
{{ a: 1 }}      // ERROR: objects are not valid as a React child
```

That `0` behaviour causes a specific, very common bug:

```jsx
{tasks.length && <TaskList />}   // when length is 0, renders "0" on screen
{tasks.length > 0 && <TaskList />}  // correct
```

**Try it yourself:** in `App.jsx`, render `{0 && <p>hi</p>}` and then `{"" && <p>hi</p>}`. Note what appears. Understanding *why* saves you a confused half-hour later.

---

# 3. Components & props

A component is a function that returns JSX. Two rules: **the name must be capitalised** (lowercase names are treated as HTML tags), and it must be **pure** — same inputs, same output, no mutating anything outside itself during render.

**Props** are the arguments. They flow **down** only, and they are **read-only**.

```jsx
function Greeting({ name, role = "member" }) {
  return <p>{name} — {role}</p>
}

<Greeting name="Ada" role="admin" />
<Greeting name="Grace" />              // role falls back to "member"
```

Destructuring in the parameter list (as above) is the idiomatic style. The alternative is `function Greeting(props) { props.name }`.

### The `children` prop

Anything between the opening and closing tags arrives as `children`. This is how you build layout components:

```jsx
function Panel({ title, children }) {
  return (
    <section className="rounded-lg border p-4">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  )
}

<Panel title="Notes">
  <p>Anything at all goes here.</p>
  <Button>Even components</Button>
</Panel>
```

**Composition over configuration.** When a component starts growing boolean props (`showHeader`, `showFooter`, `isCompact`), that's usually a signal you want `children` and smaller pieces instead. shadcn/ui is built entirely on this principle — `Card`, `CardHeader`, `CardTitle`, `CardContent` are separate composable pieces rather than one `<Card>` with fifteen props.

### Props are read-only

```jsx
function Bad({ user }) {
  user.name = "changed"   // never do this — mutating a prop
  return <p>{user.name}</p>
}
```

If a component needs to change data, it either holds it in state or calls a function passed down from the parent. Which brings us to the pattern you'll use constantly:

```jsx
// Parent owns the data and the updater; child just reports events upward.
function Parent() {
  const [count, setCount] = useState(0)
  return <Child count={count} onIncrement={() => setCount(count + 1)} />
}

function Child({ count, onIncrement }) {
  return <button onClick={onIncrement}>{count}</button>
}
```

Data flows down as props. Events flow up as callbacks. That's the whole architecture.

---

## 🔨 Build Step 1 — App shell

Create `src/components/Header.jsx`:

```jsx
import { CheckCircle2 } from "lucide-react"

export default function Header({ title, subtitle }) {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-6 py-5">
        <CheckCircle2 className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-xl font-semibold leading-none">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </header>
  )
}
```

Replace `src/App.jsx`:

```jsx
import Header from "@/components/Header"

export default function App() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <Header title="TaskBoard" subtitle="Everything you're working on, in one place." />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <p className="text-muted-foreground">Tasks will appear here.</p>
      </main>
    </div>
  )
}
```

**What you just used:** a component, props, destructuring, default styling from shadcn's theme tokens (`bg-card`, `text-muted-foreground` — these come from the CSS variables the shadcn CLI added to `index.css`, and they're what make dark mode work later without touching your components).

---

## 🔨 Build Step 2 — A TaskCard with props

Create `src/data/seed.js`:

```js
export const seedTasks = [
  { id: "1", title: "Set up the project", priority: "high",   done: true,  createdAt: 1 },
  { id: "2", title: "Learn props and state", priority: "medium", done: false, createdAt: 2 },
  { id: "3", title: "Build the task form", priority: "low",   done: false, createdAt: 3 },
]
```

Create `src/components/TaskCard.jsx`:

```jsx
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const priorityVariant = {
  high: "destructive",
  medium: "default",
  low: "secondary",
}

export default function TaskCard({ task }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <span className="font-medium">{task.title}</span>
        <Badge variant={priorityVariant[task.priority]}>{task.priority}</Badge>
      </CardContent>
    </Card>
  )
}
```

Update `App.jsx`'s `<main>`:

```jsx
import Header from "@/components/Header"
import TaskCard from "@/components/TaskCard"
import { seedTasks } from "@/data/seed"

export default function App() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <Header title="TaskBoard" subtitle="Everything you're working on, in one place." />
      <main className="mx-auto max-w-3xl space-y-3 px-6 py-8">
        <TaskCard task={seedTasks[0]} />
        <TaskCard task={seedTasks[1]} />
      </main>
    </div>
  )
}
```

Notice `priorityVariant` — a lookup object mapping data to presentation. It's declared **outside** the component because it never changes; re-creating it on every render would be pointless work.

**Try it yourself:** add a `dueDate` field to a seed task and render it in `TaskCard`. Then handle the case where it's missing.

---

# 4. Rendering lists & keys

You render a list by mapping an array to an array of elements.

```jsx
function TaskList({ tasks }) {
  return (
    <ul>
      {tasks.map((task) => (
        <li key={task.id}>{task.title}</li>
      ))}
    </ul>
  )
}
```

### Why keys matter

React uses `key` to match elements between renders and decide what to reuse, move, or destroy. Without a stable key, React falls back on position — and position lies whenever the list is reordered, filtered, or has items inserted at the front.

**Use a stable ID from the data:**

```jsx
{tasks.map((t) => <TaskCard key={t.id} task={t} />)}   // ✅
```

**Avoid the array index** unless the list is static and will never reorder, filter, or grow from the top:

```jsx
{tasks.map((t, i) => <TaskCard key={i} task={t} />)}   // ⚠️ bug source
```

The failure is specific and worth internalising: with index keys, delete the first item in a list of inputs and the *text* stays put while the *data* shifts, because React reused the DOM node it thought was in the same position. It manifests as "my checkbox state jumped to the wrong row."

Keys go on the **outermost element inside `map`**, and they only need to be unique among siblings — not globally.

---

# 5. Conditional rendering

Four idioms, each with a natural use.

```jsx
// 1. Ternary — either/or
{isLoading ? <Spinner /> : <TaskList tasks={tasks} />}

// 2. && — render or nothing
{error && <p className="text-destructive">{error}</p>}

// 3. Early return — cleanest for guard clauses
function TaskList({ tasks }) {
  if (tasks.length === 0) return <EmptyState />
  return <ul>{tasks.map(...)}</ul>
}

// 4. Lookup object — instead of a switch
const views = { list: <ListView />, board: <BoardView /> }
return views[mode]
```

Watch the `&&` operator with numbers, as covered in §2: `{count && <X />}` renders `0` when count is zero. Force a boolean — `{count > 0 && <X />}` — or use a ternary.

**Empty states are part of the UI, not an afterthought.** A list that renders nothing when empty looks broken. Design the zero case deliberately.

---

## 🔨 Build Step 3 — Task list with keys and an empty state

Create `src/components/TaskList.jsx`:

```jsx
import TaskCard from "@/components/TaskCard"

export default function TaskList({ tasks }) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="font-medium">No tasks yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add your first task to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  )
}
```

Update `App.jsx`:

```jsx
import Header from "@/components/Header"
import TaskList from "@/components/TaskList"
import { seedTasks } from "@/data/seed"

export default function App() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <Header title="TaskBoard" subtitle="Everything you're working on, in one place." />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <TaskList tasks={seedTasks} />
      </main>
    </div>
  )
}
```

**Try it yourself:** temporarily pass `tasks={[]}` and confirm the empty state renders.

---

# 6. State with `useState`

Props come from the parent. **State is data a component owns and can change.** Changing it re-renders the component.

```jsx
import { useState } from "react"

function Counter() {
  const [count, setCount] = useState(0)
  //     ↑ value  ↑ setter      ↑ initial value

  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

### The four rules of state

**1. State updates are asynchronous — the variable doesn't change immediately.**

```jsx
function handleClick() {
  setCount(count + 1)
  console.log(count)   // still the OLD value — this render's value
}
```

`count` is a constant within this render. The new value appears on the *next* render. This is a feature, not a wart: it guarantees everything in one render is consistent.

**2. Use the updater function when the new value depends on the old one.**

```jsx
setCount(count + 1)
setCount(count + 1)        // ❌ both read the same stale value → +1 total

setCount((c) => c + 1)
setCount((c) => c + 1)     // ✅ each receives the latest → +2 total
```

Default to the updater form. It's correct in strictly more situations.

**3. Never mutate state — always replace it.**

React compares by reference. Mutating an object or array leaves the reference identical, so React sees no change and skips the re-render.

```jsx
// ❌ mutation — React won't notice
tasks.push(newTask)
setTasks(tasks)
task.done = true

// ✅ create new values
setTasks([...tasks, newTask])                                   // add
setTasks(tasks.filter((t) => t.id !== id))                      // remove
setTasks(tasks.map((t) => (t.id === id ? { ...t, done: true } : t)))  // update one
```

That last line is the single most useful pattern in React. Read it carefully: map over everything, replace the one that matches with a **new object** built from the old one, leave the rest untouched.

For nested updates, spread at each level you change:

```jsx
setUser({ ...user, address: { ...user.address, city: "Berlin" } })
```

If you find yourself spreading three levels deep regularly, that's a signal to flatten your state shape or reach for Immer.

**4. Group related state; separate unrelated state.**

```jsx
const [firstName, setFirstName] = useState("")   // fine — independent values
const [lastName, setLastName] = useState("")

const [form, setForm] = useState({ title: "", priority: "medium" })  // fine — always change together
```

### Initial value is only used once

```jsx
const [tasks, setTasks] = useState(seedTasks)  // read on first render only
```

If computing the initial value is expensive, pass a **function** so it runs once instead of every render:

```jsx
const [tasks, setTasks] = useState(() => JSON.parse(localStorage.getItem("tasks")) ?? [])
```

Without the arrow function, `JSON.parse` would run on *every* render and its result thrown away.

### State is per-component-instance

```jsx
<Counter />   // has its own count
<Counter />   // completely independent count
```

Two instances of the same component share code, never state.

---

# 7. Events & handlers

React events look like DOM events with camelCase names, and they receive a synthetic event object with the standard API.

```jsx
<button onClick={handleClick}>Click</button>
<input onChange={handleChange} />
<form onSubmit={handleSubmit}>
```

**Pass the function, don't call it:**

```jsx
<button onClick={handleClick}>     // ✅ reference
<button onClick={handleClick()}>   // ❌ calls it during render
```

**To pass arguments, wrap in an arrow function:**

```jsx
<button onClick={() => onDelete(task.id)}>Delete</button>
```

**Prevent default for form submits:**

```jsx
function handleSubmit(e) {
  e.preventDefault()   // stop the browser's full-page reload
  // ...
}
```

**Naming convention:** the prop is `onSomething`, the handler function is `handleSomething`. Consistency here makes components readable at a glance.

---

## 🔨 Build Step 4 — Make tasks completable

State lives in `App` because more than one child will eventually need it.

Update `src/components/TaskCard.jsx`:

```jsx
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

const priorityVariant = {
  high: "destructive",
  medium: "default",
  low: "secondary",
}

export default function TaskCard({ task, onToggle, onDelete }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <Checkbox
          checked={task.done}
          onCheckedChange={() => onToggle(task.id)}
          aria-label={`Mark ${task.title} as ${task.done ? "not done" : "done"}`}
        />

        <span
          className={
            task.done
              ? "flex-1 text-muted-foreground line-through"
              : "flex-1 font-medium"
          }
        >
          {task.title}
        </span>

        <Badge variant={priorityVariant[task.priority]}>{task.priority}</Badge>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(task.id)}
          aria-label={`Delete ${task.title}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
```

Update `src/components/TaskList.jsx` to forward the callbacks:

```jsx
import TaskCard from "@/components/TaskCard"

export default function TaskList({ tasks, onToggle, onDelete }) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="font-medium">No tasks yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add your first task to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
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

Update `src/App.jsx`:

```jsx
import { useState } from "react"
import Header from "@/components/Header"
import TaskList from "@/components/TaskList"
import { seedTasks } from "@/data/seed"

export default function App() {
  const [tasks, setTasks] = useState(seedTasks)

  function handleToggle(id) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    )
  }

  function handleDelete(id) {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div className="min-h-svh bg-background text-foreground">
      <Header title="TaskBoard" subtitle="Everything you're working on, in one place." />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <TaskList
          tasks={tasks}
          onToggle={handleToggle}
          onDelete={handleDelete}
        />
      </main>
    </div>
  )
}
```

The app is now interactive. Both handlers use the updater form and produce new arrays — never mutating.

**Try it yourself:** delete every task and watch the empty state appear automatically. Nobody wrote code to show it; it falls out of state changing.

---

# 8. Forms & controlled components

In a **controlled component**, React state is the single source of truth for the input's value.

```jsx
const [title, setTitle] = useState("")

<input value={title} onChange={(e) => setTitle(e.target.value)} />
```

The loop: user types → `onChange` fires → state updates → re-render → input shows the new value. It feels circular, but it means the value in state is *always* what's on screen, which makes validation, formatting, and resetting trivial.

**Common error:** `value` without `onChange` gives a read-only input and a console warning. Either add the handler or use `defaultValue` for an uncontrolled input.

### Multiple fields in one state object

```jsx
const [form, setForm] = useState({ title: "", priority: "medium" })

function update(field, value) {
  setForm((prev) => ({ ...prev, [field]: value }))
}

<input value={form.title} onChange={(e) => update("title", e.target.value)} />
```

Note the computed key `[field]` and the parentheses around the returned object literal — without them JavaScript reads `{` as a function body.

### Validation

Keep it simple at this stage: validate on submit, store an error string in state, render it conditionally.

```jsx
function handleSubmit(e) {
  e.preventDefault()
  if (!title.trim()) {
    setError("Title is required")
    return
  }
  setError("")
  onAdd(title)
  setTitle("")   // reset after success
}
```

For real applications with many fields, move to **react-hook-form + zod** — it handles validation, errors, and performance far better than hand-rolled state. But learn it manually first so you understand what the library is doing for you.

---

## 🔨 Build Step 5 — Add-task form

Create `src/components/AddTaskForm.jsx`:

```jsx
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus } from "lucide-react"

export default function AddTaskForm({ onAdd }) {
  const [title, setTitle] = useState("")
  const [priority, setPriority] = useState("medium")
  const [error, setError] = useState("")

  function handleSubmit(e) {
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
    <Card className="mb-6">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="title">Task</Label>
            <Input
              id="title"
              placeholder="What needs doing?"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (error) setError("")
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger id="priority" className="w-full sm:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit">
            <Plus className="mr-1 h-4 w-4" />
            Add task
          </Button>
        </form>

        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  )
}
```

Wire it into `App.jsx` — add the handler and render the form above the list:

```jsx
function handleAdd({ title, priority }) {
  const newTask = {
    id: crypto.randomUUID(),
    title,
    priority,
    done: false,
    createdAt: Date.now(),
  }
  setTasks((prev) => [newTask, ...prev])
}
```

```jsx
<main className="mx-auto max-w-3xl px-6 py-8">
  <AddTaskForm onAdd={handleAdd} />
  <TaskList tasks={tasks} onToggle={handleToggle} onDelete={handleDelete} />
</main>
```

(Remember to `import AddTaskForm from "@/components/AddTaskForm"`.)

Two things worth noticing. First, shadcn's `Select` isn't a native `<select>` — it's a composed component driven by `value` / `onValueChange`, and because `setPriority` already has the right signature you can pass it directly. Second, the form state lives *inside* `AddTaskForm` while the task list lives in `App`. Form state is local; only the finished result travels upward. Keep state as low as it can go.

**Try it yourself:** submit with an empty title and confirm the error shows, then disappears as you type.

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

```jsx
// ❌ redundant state — now you have two things to keep in sync
const [tasks, setTasks] = useState([])
const [completedCount, setCompletedCount] = useState(0)

// ✅ derive it during render
const [tasks, setTasks] = useState([])
const completedCount = tasks.filter((t) => t.done).length
```

Every piece of duplicated state is a bug waiting to happen — some code path will update one and forget the other. Derived values are always correct because they're recomputed from the source on every render.

Things that should almost always be derived rather than stored: filtered lists, sorted lists, totals and counts, "is the form valid", "are all items selected", search results.

Things that genuinely belong in state: the raw data, and the user's *inputs* to the derivation (the search text, the active filter, the sort column).

```jsx
const [tasks, setTasks] = useState([])       // source of truth
const [filter, setFilter] = useState("all")  // user input
const [query, setQuery] = useState("")       // user input

// everything below is derived
const visible = tasks
  .filter((t) => (filter === "all" ? true : filter === "done" ? t.done : !t.done))
  .filter((t) => t.title.toLowerCase().includes(query.toLowerCase()))
```

Only optimise this with `useMemo` when profiling shows it's slow (§16). Filtering a few hundred items on every render is not slow.

---

## 🔨 Build Step 6 — Filters, search, and stats

Create `src/components/TaskStats.jsx`:

```jsx
export default function TaskStats({ total, completed }) {
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100)

  return (
    <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
      <span>{total} total</span>
      <span>·</span>
      <span>{completed} completed</span>
      <span>·</span>
      <span>{percent}% done</span>
    </div>
  )
}
```

Create `src/components/TaskToolbar.jsx`:

```jsx
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search } from "lucide-react"

export default function TaskToolbar({ filter, onFilterChange, query, onQueryChange }) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Tabs value={filter} onValueChange={onFilterChange}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="done">Done</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="relative sm:w-64">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search tasks"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </div>
    </div>
  )
}
```

Update `src/App.jsx` completely:

```jsx
import { useState } from "react"
import Header from "@/components/Header"
import TaskList from "@/components/TaskList"
import AddTaskForm from "@/components/AddTaskForm"
import TaskToolbar from "@/components/TaskToolbar"
import TaskStats from "@/components/TaskStats"
import { seedTasks } from "@/data/seed"

export default function App() {
  const [tasks, setTasks] = useState(seedTasks)
  const [filter, setFilter] = useState("all")
  const [query, setQuery] = useState("")

  function handleAdd({ title, priority }) {
    const newTask = {
      id: crypto.randomUUID(),
      title,
      priority,
      done: false,
      createdAt: Date.now(),
    }
    setTasks((prev) => [newTask, ...prev])
  }

  function handleToggle(id) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    )
  }

  function handleDelete(id) {
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
    <div className="min-h-svh bg-background text-foreground">
      <Header title="TaskBoard" subtitle="Everything you're working on, in one place." />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <AddTaskForm onAdd={handleAdd} />
        <TaskStats total={tasks.length} completed={completed} />
        <TaskToolbar
          filter={filter}
          onFilterChange={setFilter}
          query={query}
          onQueryChange={setQuery}
        />
        <TaskList
          tasks={visibleTasks}
          onToggle={handleToggle}
          onDelete={handleDelete}
        />
      </main>
    </div>
  )
}
```

`completed` and `visibleTasks` are recomputed on every render and are therefore never stale. There is exactly one source of truth: `tasks`.

**Try it yourself:** filter to "Done" and tick a task off. It vanishes from view immediately — no code coordinates that, it's just the derivation re-running.

---

# 11. `useEffect` & side effects

Rendering should be pure. Anything that reaches outside React — network calls, timers, subscriptions, `localStorage`, direct DOM work — is a **side effect** and belongs in `useEffect`.

```jsx
useEffect(() => {
  // effect body: runs after render
  return () => {
    // optional cleanup: runs before the next effect and on unmount
  }
}, [dependencies])
```

### The dependency array controls when it runs

```jsx
useEffect(() => { ... })            // after EVERY render — almost always wrong
useEffect(() => { ... }, [])        // once, after the first render
useEffect(() => { ... }, [userId])  // whenever userId changes
```

The rule React enforces via lint: **every value from component scope used inside the effect must be in the array.** Omitting dependencies to "make it run less" produces stale closures — the effect keeps seeing values from an old render.

### Cleanup

Anything you start, you must be able to stop:

```jsx
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

---

## 🔨 Build Step 7 — Persist to localStorage

Two effects: one to load nothing (we use lazy initialisation instead), one to save.

Update the state declaration in `App.jsx`:

```jsx
import { useState, useEffect } from "react"

const STORAGE_KEY = "taskboard.tasks"

// ...inside App:
const [tasks, setTasks] = useState(() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : seedTasks
  } catch {
    return seedTasks
  }
})

useEffect(() => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}, [tasks])
```

Three deliberate choices here:

1. **Lazy initialiser** (`useState(() => ...)`) reads storage once on mount instead of on every render.
2. **`try/catch`** because stored JSON can be corrupt, and `localStorage` throws in some privacy modes.
3. **`[tasks]` dependency** so the save runs whenever tasks change — and only then.

Reload the browser. Your tasks survive.

**Try it yourself:** open DevTools → Application → Local Storage and watch the value update as you add tasks.

---

# 12. Custom hooks

A custom hook is a function whose name starts with `use` and which calls other hooks. That's the entire definition. They exist to extract and reuse **stateful logic** — not markup.

```jsx
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key)
      return saved ? JSON.parse(saved) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue]
}

// used exactly like useState
const [tasks, setTasks] = useLocalStorage("tasks", [])
```

**Rules of hooks** (these apply to built-in and custom hooks alike):

1. Only call hooks at the **top level** of a component or another hook — never inside conditions, loops, or nested functions. React tracks hooks by call order, so the order must be identical on every render.
2. Only call them from **React functions** — components or other hooks. Not from plain utility functions or event handlers.

The ESLint plugin `eslint-plugin-react-hooks` catches violations of both. Keep it enabled.

**Each call gets its own state.** Two components using `useLocalStorage` don't share anything except the code — this is not a store.

---

## 🔨 Build Step 8 — Extract custom hooks

Create `src/hooks/useLocalStorage.js`:

```js
import { useState, useEffect } from "react"

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key)
      return saved ? JSON.parse(saved) : initialValue
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

  return [value, setValue]
}
```

Create `src/hooks/useTasks.js` — all task logic in one place:

```js
import { useLocalStorage } from "@/hooks/useLocalStorage"

export function useTasks(initialTasks = []) {
  const [tasks, setTasks] = useLocalStorage("taskboard.tasks", initialTasks)

  function addTask({ title, priority }) {
    const newTask = {
      id: crypto.randomUUID(),
      title,
      priority,
      done: false,
      createdAt: Date.now(),
    }
    setTasks((prev) => [newTask, ...prev])
  }

  function toggleTask(id) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    )
  }

  function deleteTask(id) {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  function updateTask(id, changes) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...changes } : t))
    )
  }

  return { tasks, addTask, toggleTask, deleteTask, updateTask }
}
```

`App.jsx` becomes dramatically thinner:

```jsx
import { useState } from "react"
import Header from "@/components/Header"
import TaskList from "@/components/TaskList"
import AddTaskForm from "@/components/AddTaskForm"
import TaskToolbar from "@/components/TaskToolbar"
import TaskStats from "@/components/TaskStats"
import { useTasks } from "@/hooks/useTasks"
import { seedTasks } from "@/data/seed"

export default function App() {
  const { tasks, addTask, toggleTask, deleteTask } = useTasks(seedTasks)
  const [filter, setFilter] = useState("all")
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
    <div className="min-h-svh bg-background text-foreground">
      <Header title="TaskBoard" subtitle="Everything you're working on, in one place." />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <AddTaskForm onAdd={addTask} />
        <TaskStats total={tasks.length} completed={completed} />
        <TaskToolbar
          filter={filter}
          onFilterChange={setFilter}
          query={query}
          onQueryChange={setQuery}
        />
        <TaskList tasks={visibleTasks} onToggle={toggleTask} onDelete={deleteTask} />
      </main>
    </div>
  )
}
```

The component now reads as a description of the UI. The *how* moved into hooks. This is the refactor that separates tidy React codebases from sprawling ones.

---

# 13. `useReducer`

When state updates get complex — many related fields, or transitions that depend on the current state — a reducer centralises the logic.

```jsx
import { useReducer } from "react"

function tasksReducer(state, action) {
  switch (action.type) {
    case "added":
      return [action.task, ...state]
    case "toggled":
      return state.map((t) =>
        t.id === action.id ? { ...t, done: !t.done } : t
      )
    case "deleted":
      return state.filter((t) => t.id !== action.id)
    default:
      throw new Error(`Unknown action: ${action.type}`)
  }
}

const [tasks, dispatch] = useReducer(tasksReducer, [])

dispatch({ type: "toggled", id: "abc" })
```

**A reducer is a pure function `(state, action) => newState`.** No fetching, no timers, no mutation. That purity is what makes it trivially testable — you can unit test every transition without rendering anything.

### `useState` or `useReducer`?

| Use `useState` | Use `useReducer` |
|---|---|
| Independent values | Several values that change together |
| Simple set operations | Next state depends on current state in non-trivial ways |
| Few update paths | Many actions, or the same update fired from many places |
| — | You want update logic testable in isolation |

Both are equally valid. Reducers pay off as the number of distinct actions grows.

---

# 14. Context API

Context lets a value pass through the tree without threading props at every level. It solves **prop drilling**, and that's all it solves.

Three pieces: create, provide, consume.

```jsx
import { createContext, useContext, useState } from "react"

// 1. create
const ThemeContext = createContext(null)

// 2. provide
function App() {
  const [theme, setTheme] = useState("light")
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <Page />
    </ThemeContext.Provider>
  )
}

// 3. consume — at any depth
function ThemeToggle() {
  const { theme, setTheme } = useContext(ThemeContext)
  return <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>{theme}</button>
}
```

**Always export a custom hook rather than the raw context.** It gives you a clear error when someone forgets the provider:

```jsx
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>")
  return ctx
}
```

**Caveats worth knowing:**

- Every consumer re-renders when the context value changes. Split unrelated concerns into separate contexts rather than one giant app context.
- Passing an object literal as `value` creates a new reference on every render, re-rendering all consumers. Memoise it (§16) if the provider re-renders often.
- Context is **not** a state manager — it's a transport mechanism. For server data, use TanStack Query. For large client state with heavy update patterns, consider Zustand or Redux Toolkit.

---

## 🔨 Build Step 9 — Context + reducer refactor

This replaces the `useTasks` hook from Step 8 with a context-backed version, so `TaskCard` can talk to the store directly instead of receiving callbacks through two layers.

Create `src/context/TaskContext.jsx`:

```jsx
import { createContext, useContext, useReducer, useEffect } from "react"

const TaskContext = createContext(null)
const STORAGE_KEY = "taskboard.tasks"

function tasksReducer(state, action) {
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
      return state.map((t) =>
        t.id === action.id ? { ...t, done: !t.done } : t
      )

    case "updated":
      return state.map((t) =>
        t.id === action.id ? { ...t, ...action.changes } : t
      )

    case "deleted":
      return state.filter((t) => t.id !== action.id)

    case "clearedCompleted":
      return state.filter((t) => !t.done)

    default:
      throw new Error(`Unknown action: ${action.type}`)
  }
}

function init(fallback) {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : fallback
  } catch {
    return fallback
  }
}

export function TaskProvider({ children, initialTasks = [] }) {
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

export function useTaskContext() {
  const ctx = useContext(TaskContext)
  if (!ctx) throw new Error("useTaskContext must be used inside <TaskProvider>")
  return ctx
}
```

Note `useReducer(reducer, initialArg, init)` — the third argument is a lazy initialiser, same idea as `useState(() => ...)`.

Wrap the app in `src/main.jsx`:

```jsx
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App.jsx"
import { TaskProvider } from "@/context/TaskContext"
import { seedTasks } from "@/data/seed"
import "./index.css"

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <TaskProvider initialTasks={seedTasks}>
      <App />
    </TaskProvider>
  </StrictMode>
)
```

`TaskCard` now reaches the store itself — no `onToggle`/`onDelete` props:

```jsx
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { useTaskContext } from "@/context/TaskContext"

const priorityVariant = { high: "destructive", medium: "default", low: "secondary" }

export default function TaskCard({ task }) {
  const { dispatch } = useTaskContext()

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <Checkbox
          checked={task.done}
          onCheckedChange={() => dispatch({ type: "toggled", id: task.id })}
          aria-label={`Mark ${task.title} as ${task.done ? "not done" : "done"}`}
        />
        <span className={task.done ? "flex-1 text-muted-foreground line-through" : "flex-1 font-medium"}>
          {task.title}
        </span>
        <Badge variant={priorityVariant[task.priority]}>{task.priority}</Badge>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => dispatch({ type: "deleted", id: task.id })}
          aria-label={`Delete ${task.title}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
```

Simplify `TaskList.jsx` — it no longer forwards callbacks:

```jsx
import TaskCard from "@/components/TaskCard"

export default function TaskList({ tasks }) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="font-medium">Nothing here</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try a different filter, or add a task.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  )
}
```

And `App.jsx`:

```jsx
import { useState } from "react"
import Header from "@/components/Header"
import TaskList from "@/components/TaskList"
import AddTaskForm from "@/components/AddTaskForm"
import TaskToolbar from "@/components/TaskToolbar"
import TaskStats from "@/components/TaskStats"
import { useTaskContext } from "@/context/TaskContext"

export default function App() {
  const { tasks, dispatch } = useTaskContext()
  const [filter, setFilter] = useState("all")
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
    <div className="min-h-svh bg-background text-foreground">
      <Header title="TaskBoard" subtitle="Everything you're working on, in one place." />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <AddTaskForm onAdd={({ title, priority }) => dispatch({ type: "added", title, priority })} />
        <TaskStats total={tasks.length} completed={completed} />
        <TaskToolbar
          filter={filter}
          onFilterChange={setFilter}
          query={query}
          onQueryChange={setQuery}
        />
        <TaskList tasks={visibleTasks} />
      </main>
    </div>
  )
}
```

Compare this `App.jsx` with Step 6's. Same behaviour, far less plumbing.

**Try it yourself:** add a "Clear completed" button that dispatches `{ type: "clearedCompleted" }`. The reducer case already exists — you only need the button.

---

# 15. Refs with `useRef`

`useRef` gives you a mutable box that **survives re-renders and does not trigger them**.

Two distinct uses:

**1. Access a DOM node:**

```jsx
const inputRef = useRef(null)

useEffect(() => {
  inputRef.current.focus()
}, [])

<input ref={inputRef} />
```

**2. Hold a mutable value that isn't UI state:**

```jsx
const timerRef = useRef(null)

function start() {
  timerRef.current = setInterval(tick, 1000)
}
function stop() {
  clearInterval(timerRef.current)
}
```

**Ref vs state:** changing `ref.current` does **not** re-render. If the value should appear on screen, it belongs in state. If it's bookkeeping — a timer ID, a previous value, a DOM handle — use a ref.

Never read or write `ref.current` *during* render. Do it in effects and event handlers.

---

## 🔨 Build Step 10 — Edit dialog with autofocus

Create `src/components/EditTaskDialog.jsx`:

```jsx
import { useState, useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTaskContext } from "@/context/TaskContext"

export default function EditTaskDialog({ task, open, onOpenChange }) {
  const { dispatch } = useTaskContext()
  const [title, setTitle] = useState("")
  const inputRef = useRef(null)

  // sync local draft whenever a different task is opened
  useEffect(() => {
    if (task) setTitle(task.title)
  }, [task])

  // focus the field once the dialog is open
  useEffect(() => {
    if (open) {
      const id = setTimeout(() => inputRef.current?.focus(), 0)
      return () => clearTimeout(id)
    }
  }, [open])

  function handleSave() {
    const trimmed = title.trim()
    if (!trimmed) return
    dispatch({ type: "updated", id: task.id, changes: { title: trimmed } })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
          <DialogDescription>Rename this task and save your changes.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="edit-title">Task</Label>
          <Input
            id="edit-title"
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title.trim()}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

Add an edit button to `TaskCard.jsx`. Import `Pencil` from `lucide-react` and add, before the delete button:

```jsx
<Button
  variant="ghost"
  size="icon"
  onClick={() => onEdit(task)}
  aria-label={`Edit ${task.title}`}
>
  <Pencil className="h-4 w-4" />
</Button>
```

Accept `onEdit` in `TaskCard`'s props and thread it through `TaskList`. Then in `App.jsx`:

```jsx
const [editing, setEditing] = useState(null)

// ...
<TaskList tasks={visibleTasks} onEdit={setEditing} />
<EditTaskDialog
  task={editing}
  open={editing !== null}
  onOpenChange={(open) => !open && setEditing(null)}
/>
```

Notice the pattern: `editing` holds either a task or `null`, and `open` is **derived** from it rather than being separate state. One value, no chance of the two disagreeing.

---

# 16. Performance: `memo`, `useMemo`, `useCallback`

Read this section last and apply it least. **Measure before optimising** — use the React DevTools Profiler. Most React apps are fast without any of this, and premature memoisation adds complexity and its own overhead.

### `React.memo` — skip re-rendering a component

```jsx
const TaskCard = memo(function TaskCard({ task }) {
  return /* ... */
})
```

Skips the re-render if props are shallowly equal to last time. Useless if you pass a new object or inline arrow function as a prop each render — which is why the next two hooks exist.

### `useMemo` — cache an expensive calculation

```jsx
const sorted = useMemo(
  () => tasks.slice().sort((a, b) => b.createdAt - a.createdAt),
  [tasks]
)
```

Recomputes only when `tasks` changes. Worth it for genuinely expensive work over large datasets, or to keep an object/array reference stable for a memoised child.

### `useCallback` — cache a function reference

```jsx
const handleToggle = useCallback((id) => {
  dispatch({ type: "toggled", id })
}, [dispatch])
```

`useCallback(fn, deps)` is just `useMemo(() => fn, deps)`. It matters only when the function is passed to a `memo`-ised child or used as an effect dependency.

### When it's actually worth it

- Lists of hundreds or thousands of rows
- Genuinely heavy computation (parsing, large sorts, chart data prep)
- A context value object that would otherwise re-render every consumer

For TaskBoard's scale, none of this is needed — but here's the shape it would take:

```jsx
// in TaskContext.jsx
const value = useMemo(() => ({ tasks, dispatch }), [tasks])
return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>
```

`dispatch` is guaranteed stable by React, so only `tasks` needs to be a dependency.

### Free wins that beat memoisation

- **Keep state low.** State in a leaf re-renders one component; state at the root re-renders everything.
- **Pass elements as `children`.** Children created in a parent don't re-render when that parent's state changes.
- **Code-split routes** with `lazy` + `Suspense`:

```jsx
const Settings = lazy(() => import("./pages/Settings"))

<Suspense fallback={<Spinner />}>
  <Settings />
</Suspense>
```

---

# 17. Data fetching

Two levels: how it works by hand, and what you'd actually use in production.

### By hand

```jsx
function TaskList() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      try {
        setLoading(true)
        const res = await fetch("/api/tasks", { signal: controller.signal })
        if (!res.ok) throw new Error(`Request failed: ${res.status}`)
        setTasks(await res.json())
        setError(null)
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    load()
    return () => controller.abort()
  }, [])

  if (loading) return <Skeleton />
  if (error) return <p className="text-destructive">{error}</p>
  return /* ... */
}
```

Four things to notice, because they're what people forget:

1. **`res.ok` check** — `fetch` does not reject on 404 or 500. Only network failures reject.
2. **`AbortController` cleanup** — prevents setting state after unmount and cancels stale requests.
3. **Ignoring `AbortError`** — an intentional cancellation isn't an error worth showing.
4. **Three states, always** — loading, error, success. A UI that only handles the happy path will look broken in the real world.

### In production, use a library

Hand-rolled fetching doesn't scale: no caching, no deduplication, no background refresh, no retry, and every component reimplements the same three states.

```jsx
import { useQuery } from "@tanstack/react-query"

function TaskList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => fetch("/api/tasks").then((r) => r.json()),
  })

  if (isLoading) return <Skeleton />
  if (error) return <p>{error.message}</p>
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

```jsx
import { BrowserRouter, Routes, Route, Link, useParams, Outlet } from "react-router-dom"

function Layout() {
  return (
    <div>
      <nav className="flex gap-4">
        <Link to="/">Board</Link>
        <Link to="/settings">Settings</Link>
      </nav>
      <Outlet />          {/* child route renders here */}
    </div>
  )
}

function TaskDetail() {
  const { id } = useParams()      // reads /tasks/:id
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

**The URL is state too.** Filters and search terms often belong in the query string (`useSearchParams`) rather than component state — it makes views shareable, bookmarkable, and survives refresh for free.

---

# Common mistakes and how to avoid them

| Mistake | Why it breaks | Fix |
|---|---|---|
| Mutating state directly | React compares by reference; no new reference means no re-render | Spread into a new object/array |
| `setCount(count + 1)` twice | Both read the same stale value | `setCount(c => c + 1)` |
| Reading state right after setting it | Updates apply on the next render | Use the value you just computed, or an effect |
| `key={index}` on a dynamic list | React reuses the wrong DOM nodes on reorder/delete | Use a stable ID |
| `{count && <X/>}` | Renders `0` when count is zero | `{count > 0 && <X/>}` |
| Missing effect dependencies | Stale closures — effect sees old values | List every used value; keep the lint rule on |
| Effect with no cleanup | Timers/listeners/requests leak and stack up | Return a cleanup function |
| Storing derived data in state | Two sources of truth drift apart | Compute during render |
| `useEffect` to transform data | Extra render, can go stale | Derive during render |
| Calling a hook inside a condition | Breaks hook call order | Hooks at the top level, always |
| `<button onClick={fn()}>` | Runs during render, not on click | `onClick={fn}` or `onClick={() => fn(arg)}` |
| Controlled input without `onChange` | Field appears frozen | Add the handler, or use `defaultValue` |
| One giant context for everything | Every consumer re-renders on any change | Split by concern |
| Memoising everything preemptively | Adds cost and complexity for no gain | Profile first |

---

# Hooks cheat sheet

| Hook | Purpose | Signature |
|---|---|---|
| `useState` | Local state | `const [v, setV] = useState(init)` |
| `useEffect` | Side effects after render | `useEffect(fn, deps)` |
| `useContext` | Read a context value | `const v = useContext(Ctx)` |
| `useReducer` | State via reducer actions | `const [s, dispatch] = useReducer(fn, init)` |
| `useRef` | Mutable box / DOM handle | `const r = useRef(null)` |
| `useMemo` | Cache a computed value | `useMemo(fn, deps)` |
| `useCallback` | Cache a function reference | `useCallback(fn, deps)` |
| `useId` | Stable unique ID for a11y | `const id = useId()` |
| `useLayoutEffect` | Effect before paint (measuring) | `useLayoutEffect(fn, deps)` |

**Both rules, once more:** call hooks only at the top level, and only from components or other hooks.

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

---

# Where to go next

You now have every fundamental needed to read and write production React. The next layer:

**Immediate**
- **react-hook-form + zod** — replace hand-rolled form state and validation
- **TanStack Query** — server state done properly
- **react-router-dom** — multi-page apps, protected routes, URL as state

**Then**
- **TypeScript** — typing props, state, and hooks; the biggest single quality win on a team
- **Testing** — Vitest + React Testing Library; test behaviour, not implementation
- **Error boundaries** and `<Suspense>` for resilient loading and failure states
- **Accessibility** — semantic HTML, focus management, keyboard navigation (shadcn/ui gives you a strong head start here)
- **Deployment** — `npm run build`, then Vercel or Netlify

**Extend TaskBoard yourself.** The most valuable exercise now is adding features without a guide:

1. Due dates with a shadcn `Calendar` + `Popover` date picker
2. Sorting by priority or creation date
3. Multiple boards/projects with `react-router-dom`
4. Drag-and-drop reordering (`dnd-kit`)
5. Dark mode toggle (shadcn's theme provider)
6. Replace `localStorage` with a real REST API
7. Tests for the reducer, then for the add-task flow

**Reference**
- [react.dev](https://react.dev) — the official docs; genuinely excellent, especially the Learn section
- [ui.shadcn.com](https://ui.shadcn.com) — component APIs and examples
- [tanstack.com/query](https://tanstack.com/query) — server state
- [react-hook-form.com](https://react-hook-form.com) — forms

One last thing: when a shadcn component's API isn't obvious, open its source in `src/components/ui/`. You own that code. Reading it is the fastest way to understand both the library and idiomatic React.
