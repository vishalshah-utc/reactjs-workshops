# React with TypeScript & Bootstrap — Demo & Concept Guide

**What this is:** the teaching half of a two-document workshop. Every React concept is explained from
first principles and then practised in a **small isolated lab demo** you can run, poke at, and
deliberately break. There are 23 concept sections and 88 labs, all living in one playground project.

**Who it's for.** Two audiences, same document:

| You are | How to use it |
|---|---|
| **Running the workshop** | This is your demo script. Each lab is a component you can build live or have pre-built, with "what to notice" and a set of deliberate breakages to run in front of the room. The prose is the explanation; the experiments are the lesson. |
| **Learning on your own** | Work top to bottom. Read the concept, build the lab, run the experiments, then answer the concept check from memory. |

**The companion document.** [`React-Build-Guide.md`](./React-Build-Guide.md) is the other half: a
17-step guided exercise where participants build a real app — **TaskBoard** — applying these concepts
for themselves. It is self-contained, so it can be worked through independently or in parallel with
this guide. The recommended rhythm is *concept here, lab here, then the matching build step there*.

**One project.** Everything in this guide lives in **`react-lab`**: a Vite + TypeScript + Bootstrap
playground with a sidebar of demos. Adding a lab is a two-file change — write the component, add one
line to a registry.

The reason the labs are isolated is simple. A concept demo should have *exactly one* moving part, so
that when something changes on screen you know precisely why. A real app has dozens of moving parts,
which is what makes it realistic — and what makes it a terrible place to learn what `useCallback`
does. So: learn in the lab, apply in the app.

**Language:** TypeScript (`.tsx`). No prior TypeScript experience assumed — types are introduced
gradually, starting from the simplest useful ones. Part 0.8 is a warm-up if you need one.

---

## How to use these notes

The document alternates between four kinds of section:

| Section | Marker | What it is |
|---|---|---|
| **Concept** | `#` heading | The React idea explained from first principles, with the mechanics spelled out. |
| **TS Note** | `> **TS Note.**` | How TypeScript changes, improves, or complicates that concept. |
| **Lab** | 🧪 | A small, self-contained demo component you add to `react-lab`. Includes the full code, where to put it, how to run it, what to watch, and experiments to run. |
| **Concept check** | ✅ | A handful of questions with answers in [Appendix B](#appendix-b--concept-check-answers). Do these from memory before looking. |

Rules that will make this go well:

1. **Run every lab.** Reading about a stale closure teaches you the words. Watching a counter refuse to reach 2 teaches you the thing.
2. **Type the code at least once** rather than only pasting. Muscle memory matters more than you'd think.
3. **Do the experiments.** Each lab ends with two or three deliberate breakages. Breaking code on purpose, predicting the result, and being wrong is the fastest way to build an accurate mental model.
4. **Read the TypeScript errors.** They're verbose, but they're almost always telling you something true. Start at the *last* line of the message, which usually names the actual mismatch.
5. Keep the browser console *and* your editor's Problems panel open. TypeScript catches things before you ever run the app.

### If you're short on time

Every lab is marked with a priority:

- **Core** — do it. The concept doesn't land without it.
- **Depth** — do it if you want to understand *why*, not just *how*. This is where senior-level understanding comes from.
- **Optional** — interesting, occasionally essential in real work, safe to skip on a first pass.

A one-day workshop does the Core labs. A week of self-study does everything.

### Notes for the trainer

- **Pre-build the harness.** Part 0.5 is scaffolding, not teaching. Have `react-lab` cloned and running before the room arrives; walking through `DemoCard` and the registry live costs 40 minutes and teaches nothing that §1 doesn't teach better.
- **Demo the breakage, not the fix.** The experiments at the end of each lab are the highest-value part of this document. Predict out loud, change the line, be wrong in front of the room. That is the whole pedagogy.
- **Every lab is independently runnable**, so you can jump. If the room is strong on one topic, skip to that section's labs; nothing later depends on an earlier lab's code except where a section explicitly builds on its own previous file.
- **§22 and §23 are alternatives to each other**, both readable straight after §14. Pick one for a short workshop.

---

## Suggested schedule

Pairs with the build guide's 17 steps. Times assume demoing the Core labs and leaving the build steps as practice.

| Block | Sections | Labs | Build steps to set as practice |
|---|---|---|---|
| **Setup** (45 min) | Part 0, Part 0.5 | Lab harness | — |
| **TypeScript warm-up** (45 min) | Part 0.8 | 0.1 | — |
| **Session 1** (2 h) — describing UI | §1–§5 | 1.1–5.2 | 1, 2, 3 |
| **Session 2** (2.5 h) — interactivity | §6–§8 | 6.1–8.12 | 4, 5 |
| **Session 3** (2 h) — structuring state | §9–§12 | 9.1–12.4 | 6, 7, 8 |
| **Session 4** (2.5 h) — scaling up | §13–§16 | 13.1–16.4 | 9, 10, 11 |
| **Session 5** (2 h) — the outside world | §17–§19 | 17.1–19.2 | 12, 13, 14, 15 |
| **Session 6** (1.5 h) — patterns & tests | §20–§21 | 20.1–21.2 | 16 |
| **Session 7** (1.5 h) — state at scale | §22 *or* §23 | 22.1–22.3 / 23.1–23.2 | 17 |

---

## Table of contents

**Setup**
- [Part 0 — Environment & the lab project](#part-0--environment--the-lab-project)
- [Part 0.5 — The lab harness](#part-05--the-lab-harness)
- [Part 0.8 — TypeScript orientation](#part-08--typescript-orientation)

**Describing UI**
- [1. The React mental model](#1-the-react-mental-model)
- [2. JSX & TSX](#2-jsx--tsx)
- [3. Components & props](#3-components--props)
- [4. Rendering lists & keys](#4-rendering-lists--keys)
- [5. Conditional rendering](#5-conditional-rendering)

**Interactivity**
- [6. State with `useState`](#6-state-with-usestate)
- [7. Events & handlers](#7-events--handlers)
- [8. Forms & controlled components](#8-forms--controlled-components)

**Structuring state**
- [9. Lifting state up](#9-lifting-state-up)
- [10. Derived state](#10-derived-state)
- [11. `useEffect` & side effects](#11-useeffect--side-effects)
- [12. Custom hooks](#12-custom-hooks)

**Scaling up**
- [13. `useReducer`](#13-usereducer)
- [14. Context API](#14-context-api)
- [15. Refs with `useRef`](#15-refs-with-useref)
- [16. Performance: `memo`, `useMemo`, `useCallback`](#16-performance-memo-usememo-usecallback)

**The outside world**
- [17. Data fetching](#17-data-fetching)
- [18. Routing](#18-routing)
- [19. Error boundaries & Suspense](#19-error-boundaries--suspense)

**Patterns & confidence**
- [20. Composition patterns](#20-composition-patterns)
- [21. Testing](#21-testing)

**State management at scale** — read after [§14 Context](#14-context-api)
- [22. Redux Toolkit](#22-redux-toolkit)
- [23. Zustand](#23-zustand)

**Reference**
- [Common mistakes](#common-mistakes-and-how-to-avoid-them)
- [Hooks cheat sheet](#hooks-cheat-sheet)
- [TypeScript-in-React cheat sheet](#typescript-in-react-cheat-sheet)
- [Bootstrap quick reference](#bootstrap-quick-reference)
- [Debugging playbook](#debugging-playbook)
- [Glossary](#glossary)
- [Appendix A — Complete lab index](#appendix-a--complete-lab-index)
- [Appendix B — Concept check answers](#appendix-b--concept-check-answers)
- [Where to go next](#where-to-go-next)

---

# Part 0 — Environment & the lab project

## 0.1 Prerequisites

| Tool | Version | Check with |
|---|---|---|
| Node.js | 20 LTS or newer | `node -v` |
| npm | comes with Node | `npm -v` |
| Editor | VS Code + ESLint, Prettier | — |
| Browser | Chrome/Edge + [React Developer Tools](https://react.dev/learn/react-developer-tools) | — |

Install React DevTools before you start — several labs ask you to look at the Components and Profiler tabs, and there's no substitute.

You should be comfortable with modern JavaScript before starting: arrow functions, destructuring, spread/rest, template literals, `map`/`filter`/`reduce`, modules, optional chaining, and promises/`async`-`await`. React is a small library; it just assumes fluent JavaScript. If `[...arr, x]` and `{ ...obj, k: v }` aren't second nature, spend an hour on those first — they appear on nearly every page of this document.

## 0.2 Create the project

```bash
mkdir react-workshop && cd react-workshop
npm create vite@latest react-lab -- --template react-ts
```

The `react-ts` template gives you TypeScript configured correctly out of the box — `tsconfig.json`, `tsconfig.app.json`, `.tsx` files, and type checking wired into the build.

> If you are also doing the [build guide](./React-Build-Guide.md), create its project as a sibling now — `npm create vite@latest taskboard -- --template react-ts` — and apply 0.3 through 0.5 to both. Two projects side by side, two dev servers, two browser tabs.

## 0.3 Install dependencies

```bash
cd react-lab
npm install
npm install react-bootstrap bootstrap react-bootstrap-icons
npm install -D @types/node
```

Three runtime packages, because they do different jobs:

- **`bootstrap`** is the CSS. It provides the classes (`d-flex`, `mb-3`, `text-muted`) and the visual design.
- **`react-bootstrap`** is a set of real React components (`<Button>`, `<Modal>`, `<Form.Control>`) that render Bootstrap markup. It replaces Bootstrap's own JavaScript entirely — **no jQuery, and you should not import `bootstrap.bundle.js`.** Mixing the two causes duplicate event handling on modals and dropdowns.
- **`react-bootstrap-icons`** is Bootstrap Icons as React components, so `<Trash size={16} />` instead of an `<i>` tag with a class.

React-Bootstrap ships its own TypeScript definitions, so there is no `@types/react-bootstrap` to install. (If you see instructions telling you to install it, they're out of date.)

Some later sections add one dependency each, installed when you reach them: `react-hook-form` and `zod` (§8), `@tanstack/react-query` and `axios` (§17), `react-router-dom` (§18), `vitest` and Testing Library (§21), `@reduxjs/toolkit` and `react-redux` (§22), `zustand` (§23).

> **Version note.** The stable line is `react-bootstrap@2.x`, which targets Bootstrap 5. A `3.0.0-beta` line exists that targets React 19 specifically. Vite's current template scaffolds React 19, and stable v2 (2.10.7+) works with it — but if you hit type conflicts around refs or `Navbar`, either pin React 18 or try the beta with `npm install react-bootstrap@next`. Check [react-bootstrap.github.io](https://react-bootstrap.github.io/) for the current recommendation, since this will have moved on.

If you want to see the exact versions this document was written against, run `npm ls react react-dom react-bootstrap bootstrap typescript` and keep the output somewhere. When something behaves differently from the text a year from now, that list is the first thing to check.

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

**Leave `<StrictMode>` on.** Several labs depend on it: it double-invokes components and effects in development specifically to surface impurity and missing cleanup. Labs 1.3, 11.1 and 11.2 are about exactly that.

Now empty out `src/index.css` (delete everything Vite put there — it fights Bootstrap) and delete `src/App.css`.

Add these two small utilities to `src/index.css`; Bootstrap doesn't ship them and several components below use them:

```css
/* Bootstrap has no dashed-border utility */
.border-dashed {
  border-style: dashed !important;
}

/* Keeps long JSON readouts in the labs from stretching the page */
.lab-pre {
  max-height: 16rem;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
}
```

## 0.5 Configure the `@` import alias

Optional but strongly recommended, and used by every code sample from here on: it turns `../../components/TaskCard` into `@/components/TaskCard`, which stays correct when you move files.

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

## 0.6 Run it

```bash
cd react-lab && npm run dev        # → http://localhost:5173
```

If you're running the build guide's project too, pin its port so the URL doesn't move around:

```bash
cd taskboard && npm run dev -- --port 5174   # → http://localhost:5174
```

Vite would pick 5174 automatically for the second server anyway, but pinning it matters when you have it bookmarked for two days. Keep both tabs open all week — you'll flip between them constantly.

## 0.7 Verify

`src/App.tsx` gets replaced properly in Part 0.5, so for a two-minute smoke test just put this in it:

```tsx
import { Button, Container } from "react-bootstrap"

export default function App() {
  return (
    <Container className="py-5 text-center">
      <h1 className="mb-3">react-lab</h1>
      <Button variant="primary">Setup works</Button>
    </Container>
  )
}
```

A blue Bootstrap button on a centred, padded container means everything is wired.

Also confirm the type-checker runs:

```bash
npm run build
```

`npm run dev` does **not** type-check — Vite strips types without checking them, which is why it's so fast. `npm run build` runs `tsc` first. Get into the habit of running the build before you claim something works.

## 0.8 Troubleshooting

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
| A demo renders twice / an effect logs twice | That's Strict Mode, and it's intentional. See Labs 1.3 and 11.1. |

---

# Part 0.5 — The lab harness

Before the first concept, you'll set up `react-lab` so that adding a demo is a **two-file change**: write the component, add one line to a registry. Everything else — navigation, layout, a card to frame each demo — is built once, here.

You are not expected to understand this code yet. It uses state, effects, lists, keys and context, all of which are covered later. Treat it as scaffolding: type it in, get it running, and by §14 you'll be able to read every line of it. That's a good milestone to check yourself against.

## 0.5.1 Folder layout

Create this structure inside `react-lab/src`:

```
src/
├─ main.tsx
├─ App.tsx                 ← the demo shell
├─ index.css
├─ lab/                    ← the harness and teaching instruments
│  ├─ DemoCard.tsx
│  ├─ RenderBadge.tsx
│  ├─ LogPanel.tsx
│  ├─ StateInspector.tsx
│  ├─ useEventLog.ts
│  └─ slow.ts
└─ demos/
   ├─ registry.tsx         ← the one file you edit for every new demo
   └─ 01-mental-model/     ← one folder per concept, created as you go
```

```bash
cd react-lab
mkdir -p src/lab src/demos
```

## 0.5.2 `DemoCard` — the frame around every demo

Every lab renders inside the same card, so the page has a consistent shape and each demo can state its own point.

Create `src/lab/DemoCard.tsx`:

```tsx
import type { ReactNode } from "react"
import { Card, Badge } from "react-bootstrap"

interface DemoCardProps {
  /** Short name of the demo. */
  title: string
  /** One sentence: what this demo proves. */
  claim?: string
  /** Core = essential, Depth = the "why", Optional = nice to have. */
  level?: "core" | "depth" | "optional"
  /** The interactive part. */
  children: ReactNode
  /** Bullet points the reader should watch for. */
  notice?: ReactNode
}

const levelVariant = {
  core: "primary",
  depth: "warning",
  optional: "secondary",
} as const

export default function DemoCard({
  title,
  claim,
  level = "core",
  children,
  notice,
}: DemoCardProps) {
  return (
    <Card className="mb-4 shadow-sm">
      <Card.Header className="d-flex align-items-center justify-content-between gap-2 bg-white">
        <span className="fw-semibold">{title}</span>
        <Badge bg={levelVariant[level]} className="text-uppercase">
          {level}
        </Badge>
      </Card.Header>

      <Card.Body>
        {claim && <p className="text-muted small mb-3">{claim}</p>}
        {children}
      </Card.Body>

      {notice && (
        <Card.Footer className="bg-body-tertiary small">
          <div className="fw-semibold mb-1">What to notice</div>
          {notice}
        </Card.Footer>
      )}
    </Card>
  )
}
```

Two TypeScript details worth pointing at now, because you'll use both repeatedly:

- **`level?: "core" | "depth" | "optional"`** is a union of string literals rather than `string`. Your editor autocompletes the three values and a typo is a compile error. Almost every "kind", "variant", "status" or "mode" prop you ever write should look like this.
- **`as const` on `levelVariant`** freezes the values to their literal types (`"primary"` rather than `string`), which is what lets `levelVariant[level]` be safely indexed by the union.

## 0.5.3 Teaching instruments

These four tiny modules are what turn "here is some code" into "here is proof". You'll import them in most labs.

### `RenderBadge` — see re-renders

Create `src/lab/RenderBadge.tsx`:

```tsx
import { useRef } from "react"
import { Badge } from "react-bootstrap"

/**
 * Counts how many times the calling component has rendered.
 *
 * Deliberately impure: it mutates a ref during render, which real
 * components must never do. It is a measuring instrument, not a pattern.
 */
export function useRenderCount(): number {
  const count = useRef(0)
  count.current += 1
  return count.current
}

interface RenderBadgeProps {
  label: string
  /** Pass a different colour to tell two badges apart at a glance. */
  bg?: string
}

export default function RenderBadge({ label, bg = "secondary" }: RenderBadgeProps) {
  const renders = useRenderCount()
  return (
    <Badge bg={bg} className="font-monospace">
      {label}: {renders} render{renders === 1 ? "" : "s"}
    </Badge>
  )
}
```

> **Strict Mode caveat, and it matters.** In development, React's Strict Mode calls your component function **twice** per render to help surface impure code. So this counter climbs in twos, and a freshly mounted component reads `2`, not `1`. That's expected. **Compare numbers between components rather than reading them absolutely** — "the parent went 2 → 4 while the child stayed at 2" is the observation that counts. If a specific lab gets confusing, temporarily remove `<StrictMode>` from `main.tsx`, and put it back afterwards.

### `useEventLog` + `LogPanel` — see *when* things happen

Timing is invisible in a UI. These make it visible, and they're the difference between "effects run after render, apparently" and actually knowing the order.

Create `src/lab/useEventLog.ts`:

```ts
import { useCallback, useState } from "react"

export interface LogEntry {
  id: string
  at: string
  message: string
}

/**
 * An append-only log you can write to from effects and event handlers.
 * Never call `log` during render — that would set state during render
 * and loop forever.
 */
export function useEventLog(limit = 40) {
  const [entries, setEntries] = useState<LogEntry[]>([])

  const log = useCallback(
    (message: string) => {
      setEntries((prev) =>
        [
          {
            id: crypto.randomUUID(),
            at: new Date().toLocaleTimeString([], { hour12: false }),
            message,
          },
          ...prev,
        ].slice(0, limit)
      )
    },
    [limit]
  )

  const clear = useCallback(() => setEntries([]), [])

  return { entries, log, clear }
}
```

`useCallback` here isn't premature optimisation — it keeps `log` referentially stable so you can safely list it in an effect's dependency array without the effect re-running on every render. That's the one case where `useCallback` is about correctness rather than speed, and §16 comes back to it.

Create `src/lab/LogPanel.tsx`:

```tsx
import { Button, ListGroup } from "react-bootstrap"
import type { LogEntry } from "@/lab/useEventLog"

interface LogPanelProps {
  entries: LogEntry[]
  onClear?: () => void
  title?: string
  height?: number
}

export default function LogPanel({
  entries,
  onClear,
  title = "Event log",
  height = 200,
}: LogPanelProps) {
  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-2">
        <span className="small fw-semibold text-muted">
          {title} <span className="fw-normal">(newest first)</span>
        </span>
        {onClear && (
          <Button variant="outline-secondary" size="sm" onClick={onClear}>
            Clear
          </Button>
        )}
      </div>

      <ListGroup
        variant="flush"
        className="border rounded-3 overflow-auto"
        style={{ height }}
      >
        {entries.length === 0 ? (
          <ListGroup.Item className="text-muted small">
            Nothing logged yet.
          </ListGroup.Item>
        ) : (
          entries.map((entry) => (
            <ListGroup.Item key={entry.id} className="py-1 small font-monospace">
              <span className="text-muted me-2">{entry.at}</span>
              {entry.message}
            </ListGroup.Item>
          ))
        )}
      </ListGroup>
    </div>
  )
}
```

### `StateInspector` — see state as data

Create `src/lab/StateInspector.tsx`:

```tsx
interface StateInspectorProps {
  label?: string
  value: unknown
}

export default function StateInspector({ label = "state", value }: StateInspectorProps) {
  return (
    <pre className="lab-pre bg-body-secondary rounded-3 p-3 small mb-0">
      <code>
        {label} = {JSON.stringify(value, null, 2)}
      </code>
    </pre>
  )
}
```

`value: unknown` rather than `any` is the honest type: this component accepts literally anything and doesn't touch it beyond stringifying. `unknown` accepts everything but permits nothing without narrowing, which is exactly the contract here.

### `slow.ts` — a computation expensive enough to feel

Create `src/lab/slow.ts`:

```ts
/**
 * Burns roughly `iterations` worth of CPU and returns a number.
 * Used in the performance labs so `useMemo` has something real to skip.
 */
export function slowSum(iterations: number): number {
  let total = 0
  for (let i = 0; i < iterations; i += 1) {
    total += Math.sqrt(i) * Math.sin(i)
  }
  return Math.round(total)
}

/** Measures how long `fn` takes, in milliseconds. */
export function measure<T>(fn: () => T): { result: T; ms: number } {
  const start = performance.now()
  const result = fn()
  return { result, ms: Math.round(performance.now() - start) }
}
```

`measure<T>` is a **generic** function: whatever `fn` returns, `result` has that type. `measure(() => slowSum(1e7))` gives `{ result: number; ms: number }` with no annotation needed. §0.8 explains generics properly.

## 0.5.4 The registry — the one file you edit per lab

Create `src/demos/registry.tsx`:

```tsx
import type { ReactNode } from "react"

export interface Demo {
  /** URL-safe, stable. Appears in the address bar after #. */
  id: string
  /** Groups demos in the sidebar. Use the concept number so sorting works. */
  chapter: string
  /** Shown in the sidebar. */
  title: string
  /** The demo itself, as a React element. */
  element: ReactNode
}

export const demos: Demo[] = [
  // Labs get added here, one line each, as you work through the notes.
]

export const chapters = (): string[] => [
  ...new Set(demos.map((demo) => demo.chapter)),
]
```

There's a genuinely interesting idea hiding in `element: ReactNode`. `<CounterBasics />` is not a rendered component — it's a plain JavaScript object *describing* what to render. That's why you can put it in an array, pass it around, and store it in a config file without anything happening yet. Nothing mounts until React actually renders it. §1 and §2 unpack this; you're using it on day one.

`chapters()` uses a `Set` to get unique chapter names in insertion order — so the sidebar groups match the order you registered things, which is the order of these notes.

## 0.5.5 The shell

Create `src/App.tsx` (replacing Vite's version):

```tsx
import { useEffect, useState } from "react"
import { Container, Row, Col, Nav, Navbar, Alert } from "react-bootstrap"
import { Beaker } from "react-bootstrap-icons"
import { demos, chapters } from "@/demos/registry"

export default function App() {
  // Read the initial demo from the URL hash so links are shareable.
  const [activeId, setActiveId] = useState<string>(
    () => window.location.hash.slice(1) || demos[0]?.id || ""
  )

  // Keep the hash in sync when the selection changes.
  useEffect(() => {
    if (activeId) window.location.hash = activeId
  }, [activeId])

  // Respond to the browser's back/forward buttons.
  useEffect(() => {
    function handleHashChange() {
      setActiveId(window.location.hash.slice(1))
    }
    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  const active = demos.find((demo) => demo.id === activeId)

  return (
    <div className="min-vh-100 bg-body-tertiary">
      <Navbar className="bg-white border-bottom py-3">
        <Container fluid className="px-4 d-flex align-items-center gap-2">
          <Beaker className="text-primary" size={22} />
          <span className="fw-semibold">React Lab</span>
          <span className="text-muted small ms-2">
            {demos.length} demo{demos.length === 1 ? "" : "s"}
          </span>
        </Container>
      </Navbar>

      <Container fluid className="px-4 py-4">
        <Row className="g-4">
          <Col xs={12} lg={3}>
            <Nav className="flex-column bg-white border rounded-3 p-2 sticky-lg-top" style={{ top: "1rem" }}>
              {chapters().map((chapter) => (
                <div key={chapter} className="mb-2">
                  <div className="text-uppercase text-muted small fw-semibold px-2 py-1">
                    {chapter}
                  </div>
                  {demos
                    .filter((demo) => demo.chapter === chapter)
                    .map((demo) => (
                      <Nav.Link
                        key={demo.id}
                        active={demo.id === activeId}
                        onClick={() => setActiveId(demo.id)}
                        className="rounded-2 py-1 px-2 small"
                        role="button"
                      >
                        {demo.title}
                      </Nav.Link>
                    ))}
                </div>
              ))}
            </Nav>
          </Col>

          <Col xs={12} lg={9}>
            {demos.length === 0 ? (
              <Alert variant="secondary">
                No demos registered yet. Add your first one to{" "}
                <code>src/demos/registry.tsx</code>.
              </Alert>
            ) : active ? (
              active.element
            ) : (
              <Alert variant="warning">
                No demo with id <code>{activeId}</code>. Pick one from the sidebar.
              </Alert>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  )
}
```

Run it:

```bash
npm run dev
```

You should see the shell with the "No demos registered yet" message. That's the harness working.

## 0.5.6 The lab loop

Every lab from here on follows the same three steps. They won't be spelled out each time, so learn them now.

**Step 1 — create the component.** Each lab names its file, e.g. `src/demos/06-state/CounterLab.tsx`. Create the folder if it doesn't exist.

**Step 2 — register it.** Add an import and one array entry to `src/demos/registry.tsx`:

```tsx
import CounterLab from "@/demos/06-state/CounterLab"

export const demos: Demo[] = [
  // ...
  { id: "counter", chapter: "6 — useState", title: "Stale values & updaters", element: <CounterLab /> },
]
```

**Step 3 — open it.** With `npm run dev` running, the page hot-reloads. Click the demo in the sidebar, or go straight to `http://localhost:5173/#counter`.

That's it. Because Vite's hot module replacement keeps component state where it can, you'll often see your change without even losing what you'd typed into a form. When state does get reset unexpectedly, a full refresh is the cure.

> **A note on why the shell is deliberately primitive.** It selects demos with `useState` and a URL hash rather than a router, because a router is §18 and importing one now would mean pasting code you can't read. In §18 you'll replace this shell with a real `react-router` version as an exercise — which is a much better way to learn routing than a hello-world app, because you'll be replacing something you already understand.

---

# Part 0.8 — TypeScript orientation

Enough TypeScript to start, plus the handful of features that do the heavy lifting in React specifically. Everything else is introduced where it's needed.

The one-line summary, first, because it prevents a lot of confusion: **TypeScript is a compile-time tool.** It erases entirely at build; nothing you write here exists at runtime. A type cannot validate an API response, guard against bad user input, or stop a crash. Its whole value is telling *you* about mistakes before your users find them.

## 0.8.1 Annotating values

```ts
let count: number = 0
let title: string = "Task"
let done: boolean = false
let tags: string[] = ["work", "urgent"]
let pair: [string, number] = ["a", 1]      // tuple: fixed length, fixed types
```

In practice you rarely write these, because TypeScript **infers** types:

```ts
let count = 0          // inferred as number
count = "five"         // ❌ Type 'string' is not assignable to type 'number'
```

**Annotate function parameters and public boundaries; let inference handle the rest.** Over-annotating is noise, and worse, it can be *less* precise than what inference would have given you.

There's one asymmetry worth internalising early:

```ts
let mode = "dark"              // inferred as string  — `let` can be reassigned
const mode2 = "dark"           // inferred as "dark"  — `const` can't, so the literal type survives
```

That difference is the root of a surprising number of React type errors, and `as const` (below) is how you get the narrow behaviour where you want it.

## 0.8.2 Object shapes: `interface` and `type`

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

`interface` and `type` are near-interchangeable for object shapes. The practical differences:

| | `interface` | `type` |
|---|---|---|
| Object shapes | ✅ | ✅ |
| Unions (`"a" \| "b"`) | ❌ | ✅ |
| Extending | `extends` | `&` intersection |
| Declaration merging | Yes (two declarations combine) | No (duplicate name is an error) |
| Error messages | Often shorter, names preserved | Sometimes expanded inline |

A common convention, and the one used throughout this document: **`interface` for object shapes, `type` for unions and everything else.** Pick one and be consistent; the team argument about this is not worth having.

**TypeScript is structurally typed.** Two types with the same shape are compatible regardless of their names:

```ts
interface Point { x: number; y: number }
interface Coord { x: number; y: number }

const p: Point = { x: 1, y: 2 }
const c: Coord = p                  // ✅ fine — same shape
```

This is the opposite of Java or C#, and it's why you can pass an object literal to a prop typed with an interface you never imported. It also explains "excess property checks": object *literals* assigned directly to a typed target are checked for extra properties, but a variable holding the same object isn't.

```ts
const t: Task2 = { id: "1", title: "x", extra: true }   // ❌ 'extra' does not exist
const obj = { id: "1", title: "x", extra: true }
const t2: Task2 = obj                                    // ✅ allowed — no literal, no excess check
```

## 0.8.3 Union types — the feature you'll use most

```ts
type Priority = "low" | "medium" | "high"

let p: Priority = "high"
p = "urgent"   // ❌ not assignable to type 'Priority'
```

This is far better than `string`. It documents the valid values, autocompletes them, and makes typos compile errors. **Almost every "status", "variant", "mode", "kind", or "role" field in your app should be a union of string literals rather than `string`.**

Deriving the runtime list from the type — or the type from the list — avoids keeping two copies in sync:

```ts
// Option A: type first, then a Record forces you to cover every member
const priorityLabel: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
}
// Add "critical" to Priority and this object becomes a compile error. Excellent.

// Option B: array first, derive the type from it
const priorities = ["low", "medium", "high"] as const
type Priority2 = (typeof priorities)[number]     // "low" | "medium" | "high"
// Now you can .map() over `priorities` to render options, and the type follows.
```

Option B is the one to reach for when you need to iterate the values in the UI — which, for a `<select>`, you always do. `as const` is what makes it work: without it, `priorities` is `string[]` and the derived type collapses to `string`.

## 0.8.4 Functions

```ts
function add(a: number, b: number): number {
  return a + b
}

const toggle = (id: string): void => { /* ... */ }

// A function type, which is what a callback prop is
type OnSelect = (id: string) => void
type Formatter = (value: number, currency?: string) => string
```

Return types are usually inferred, so you can omit them — but writing them on *exported* functions catches mistakes at the definition rather than at the call site, which is where you'd rather find them.

`void` as a return type is special: it means "the caller ignores what comes back", so a function returning something is still assignable to it. That's deliberate, and it's why `onClick={() => setCount(c => c + 1)}` type-checks even though the arrow returns a number.

## 0.8.5 `null`, `undefined`, and narrowing

With `strict` mode on (the Vite template enables it), nullable values must be handled:

```ts
const el = document.getElementById("root")   // HTMLElement | null
el.focus()      // ❌ 'el' is possibly 'null'
el?.focus()     // ✅ optional chaining
if (el) el.focus()   // ✅ narrowing
el!.focus()     // ⚠️ non-null assertion — "trust me". Use sparingly.
```

TypeScript follows your control flow and narrows types as it goes:

```ts
function format(value: string | number | null): string {
  if (value === null) return "—"
  if (typeof value === "number") {
    return value.toFixed(2)   // here, value is number
  }
  return value.trim()         // here, value is string
}
```

The narrowing tools, roughly in order of how often you'll use them:

| Tool | Narrows by | Example |
|---|---|---|
| Truthiness | falsy check | `if (!ctx) throw ...` |
| `typeof` | primitive type | `typeof v === "string"` |
| Equality | literal value | `if (action.type === "added")` |
| `in` | property presence | `if ("error" in result)` |
| `instanceof` | class | `if (err instanceof Error)` |
| Type predicate | your own function | `if (isPriority(v))` |
| Discriminant | a shared literal field | `switch (state.status)` |

That last one is the engine behind typed reducers (§13), typed fetch states (§17), and discriminated-union props (§20). It's the single highest-leverage TypeScript pattern in React.

**Custom type predicates** let you name a narrowing check and reuse it:

```ts
function isPriority(value: string): value is Priority {
  return value === "low" || value === "medium" || value === "high"
}

// Now:
const raw: string = getFromForm()
if (isPriority(raw)) {
  // raw is Priority in here
}
```

`value is Priority` is the important part: it tells TypeScript that a `true` return means the value really *is* a `Priority`. TypeScript takes your word for it — the compiler doesn't verify that your function's logic matches its claim, so a wrong predicate is a lie it will believe. Write them carefully and keep them tiny.

## 0.8.6 Generics

A type that takes a type as a parameter:

```ts
function first<T>(items: T[]): T | undefined {
  return items[0]
}

first([1, 2, 3])       // number | undefined
first(["a", "b"])      // string | undefined
```

The value of a generic is that the *relationship* between input and output is preserved. Compare:

```ts
function firstAny(items: any[]): any { return items[0] }
firstAny([1, 2, 3]).toUpperCase()   // compiles. Explodes at runtime.
```

Constraints limit what `T` can be, which is what lets you use `T`'s properties inside:

```ts
function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b
}

longest("abcd", "ab")          // ✅ string
longest([1, 2], [1, 2, 3])     // ✅ number[]
longest(1, 2)                  // ❌ number has no 'length'
```

Two generic idioms appear constantly in React code:

```ts
// keyof — the union of an object type's keys
type TaskKey = keyof Task        // "id" | "title" | "done" | "dueDate" | "createdAt"

// Indexed access — the type of a property
type TitleType = Task["title"]   // string

// Put together: a type-safe field updater
function update<K extends keyof Task>(field: K, value: Task[K]) { /* ... */ }
update("title", "New")     // ✅
update("done", true)       // ✅
update("done", "yes")      // ❌ boolean expected
update("titel", "x")       // ❌ not a key of Task
```

Read that signature slowly, because you'll write it in §8. `K extends keyof Task` means "K is one of this object's key names", and `Task[K]` means "the type of the value at that key". So the second argument's type **depends on** the first argument's *value*. A plain `(field: string, value: any)` accepts both mistakes above.

You'll also meet generics in `useState<T>()`, `useRef<T>()`, and the `useLocalStorage<T>` hook you write in §12.

## 0.8.7 Utility types

```ts
Partial<Task>              // all properties optional — perfect for "changes" objects
Required<Task>             // the inverse
Readonly<Task>             // all properties readonly
Omit<Task, "id">           // Task without id — "a new task before it has an id"
Pick<Task, "id" | "title">
Record<Priority, string>   // an object with a key per Priority
Exclude<Priority, "low">   // "medium" | "high"
NonNullable<string | null> // string
ReturnType<typeof useTasks>   // whatever that hook returns
Parameters<typeof add>        // [number, number]
Awaited<Promise<Task[]>>      // Task[]
```

`Partial`, `Omit` and `Record` in particular will save you from defining nearly-duplicate interfaces. Reach for them before you copy an interface and delete a line.

React ships a few of its own that matter:

```ts
import type { ReactNode, ComponentProps, PropsWithChildren, CSSProperties } from "react"

ReactNode                             // anything renderable: elements, strings, numbers, null, arrays
ComponentProps<"button">              // every prop a native <button> accepts
ComponentProps<typeof Button>         // every prop react-bootstrap's Button accepts
PropsWithChildren<{ title: string }>  // adds children?: ReactNode
CSSProperties                         // the type of a style object
```

`ComponentProps<"button">` is how you write a wrapper component that accepts everything the underlying element does without listing 40 props by hand. §20 uses it properly.

## 0.8.8 `as const`, `satisfies`, and assertions

Three tools that look similar and do different things. Getting them straight saves real confusion.

```ts
// 1. as const — freeze to literal types, make objects/arrays deeply readonly
const filters = ["all", "active", "done"] as const
// readonly ["all", "active", "done"] — and (typeof filters)[number] is the union

// 2. satisfies — check against a type WITHOUT widening to it
const variants = {
  low: "secondary",
  medium: "primary",
  high: "danger",
} satisfies Record<Priority, string>
// Checked: every Priority key present. But variants.high is still "danger",
// not string — so you keep the precise value AND the completeness check.

// 3. as — an assertion. A claim, not a check. Nothing is verified.
const p = "high" as Priority              // fine, you happen to be right
const q = JSON.parse(raw) as Task[]       // a promise you're making to the compiler
```

The distinction that matters: `satisfies` **verifies and preserves**; `as` **overrides and trusts**. Prefer `satisfies` for config objects. Use `as` only at boundaries where you genuinely know more than the compiler can — parsed JSON, a `<select>` whose options you control — and treat every one as a small documented risk.

## 0.8.9 Avoid `any`; reach for `unknown`

`any` switches type checking off for that value **and everything it touches**. It's contagious, and a single `any` in a data layer can silently disable checking across a whole feature.

If you truly don't know a type, use `unknown` — it accepts anything but permits nothing until you narrow:

```ts
function handle(data: unknown) {
  data.toUpperCase()                                    // ❌ good — forces a check
  if (typeof data === "string") data.toUpperCase()      // ✅
}
```

`catch` clauses are the place you'll meet this most:

```ts
try { /* ... */ } catch (err) {
  // err is `unknown` in modern TypeScript, because JS can throw anything
  if (err instanceof Error) console.error(err.message)
  else console.error(String(err))
}
```

Annoying for about a week, then you notice how often you used to assume the thrown thing was an `Error`.

## 0.8.10 Reading TypeScript errors

The skill nobody teaches, and it pays for itself in a day.

```
Type '{ name: string; count: string; }' is not assignable to type 'IntrinsicAttributes & GreetingProps'.
  Types of property 'count' are incompatible.
    Type 'string' is not assignable to type 'number'.
```

Three rules:

1. **Read the last line first.** TypeScript reports the outermost mismatch first and narrows down. The final, most-indented line is the actual incompatibility — here, "you passed a string where a number was wanted".
2. **`IntrinsicAttributes & X`** in a JSX error just means "the props of a component". Mentally delete it.
3. **When a type is printed inline and enormous**, hover the symbol in your editor instead; the tooltip is usually formatted better. `// @ts-expect-error` on the line above, temporarily, will also tell you whether that line is the real source (if the error moves elsewhere, it was).

---

## 🧪 Lab 0.1 — Unions, `Record`, and `satisfies` in a real component

**Level:** core

This is your first lab, so it doubles as a check that the harness works. It's also the single most useful TypeScript pattern in React, so it's worth the ten minutes.

Create `src/demos/00-typescript/UnionsLab.tsx`:

```tsx
import { useState } from "react"
import { Alert, Badge, ButtonGroup, Button, Stack } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import StateInspector from "@/lab/StateInspector"

// ---- 1. The union, and the runtime list derived from it ----
const priorities = ["low", "medium", "high", "critical"] as const
type Priority = (typeof priorities)[number]
//   ^? "low" | "medium" | "high" | "critical"

// ---- 2. A lookup checked for completeness, with literal values preserved ----
const priorityStyle = {
  low: { bg: "secondary", label: "Low", note: "Whenever." },
  medium: { bg: "primary", label: "Medium", note: "This week." },
  high: { bg: "warning", label: "High", note: "Today." },
  critical: { bg: "danger", label: "Critical", note: "Now. Stop reading." },
} satisfies Record<Priority, { bg: string; label: string; note: string }>

// ---- 3. A type predicate for values arriving from outside ----
function isPriority(value: string): value is Priority {
  return (priorities as readonly string[]).includes(value)
}

export default function UnionsLab() {
  const [priority, setPriority] = useState<Priority>("medium")
  const [rawInput, setRawInput] = useState("")
  const [rejected, setRejected] = useState<string | null>(null)

  function applyRawValue() {
    if (isPriority(rawInput)) {
      setPriority(rawInput)
      setRejected(null)
    } else {
      setRejected(rawInput)
    }
  }

  const style = priorityStyle[priority]

  return (
    <DemoCard
      title="Unions, Record and satisfies"
      claim="A union of string literals gives you autocomplete, typo protection, and a compiler that tells you every place to update when the union grows."
      level="core"
      notice={
        <ul className="mb-0">
          <li>
            Type <code>setPriority("</code> in your editor — the four valid values
            autocomplete. Type a fifth and it's a compile error, not a runtime surprise.
          </li>
          <li>
            <code>priorityStyle.critical.bg</code> is the literal <code>"danger"</code>,
            not <code>string</code> — that's <code>satisfies</code> preserving the value
            while still checking every key is present.
          </li>
          <li>
            The text box is the boundary case: a <code>string</code> from outside your
            program can only become a <code>Priority</code> by passing the predicate.
          </li>
        </ul>
      }
    >
      <Stack gap={3}>
        <div>
          <div className="small text-muted mb-2">
            Buttons rendered by mapping the derived array — one source of truth
          </div>
          <ButtonGroup>
            {priorities.map((value) => (
              <Button
                key={value}
                variant={priority === value ? priorityStyle[value].bg : "outline-secondary"}
                onClick={() => setPriority(value)}
              >
                {priorityStyle[value].label}
              </Button>
            ))}
          </ButtonGroup>
        </div>

        <Alert variant={style.bg} className="mb-0">
          <Badge bg={style.bg} className="me-2">
            {style.label}
          </Badge>
          {style.note}
        </Alert>

        <div>
          <div className="small text-muted mb-2">
            Untrusted input — must be narrowed before it can enter typed state
          </div>
          <div className="d-flex gap-2">
            <input
              className="form-control"
              placeholder='try "high", then try "urgent"'
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
            />
            <Button variant="dark" onClick={applyRawValue}>
              Apply
            </Button>
          </div>
          {rejected !== null && (
            <div className="text-danger small mt-2">
              "{rejected}" is not a Priority — rejected at the boundary.
            </div>
          )}
        </div>

        <StateInspector label="priority" value={priority} />
      </Stack>
    </DemoCard>
  )
}
```

Register it in `src/demos/registry.tsx`:

```tsx
import UnionsLab from "@/demos/00-typescript/UnionsLab"

export const demos: Demo[] = [
  { id: "unions", chapter: "0 — TypeScript", title: "Unions & Record", element: <UnionsLab /> },
]
```

**Run it:**

```bash
npm run dev      # in react-lab
```

Open `http://localhost:5173/#unions`.

**Experiments — do all three:**

1. **Delete `critical` from the `priorities` array.** Note that the `priorityStyle` object immediately errors: `Object literal may only specify known properties`. The compiler is telling you the lookup has an entry for a priority that no longer exists.
2. **Put `critical` back, then delete the `critical:` line from `priorityStyle`.** Now the error is on `satisfies`: `Property 'critical' is missing`. **This is the payoff.** Add a value to a union anywhere in a real codebase and TypeScript walks you to every place that needs updating.
3. **Change `satisfies Record<...>` to `: Record<Priority, {...}>`** (a plain annotation). Hover `priorityStyle.critical.bg` — it's now `string`, not `"danger"`. That's the widening `satisfies` exists to prevent. Change it back.
4. **Break the predicate on purpose:** make `isPriority` `return true`. Type "urgent" and apply. The app now renders `undefined` values because `priorityStyle["urgent"]` doesn't exist — proof that a type predicate is a promise TypeScript trusts without verifying. Fix it before moving on.

✅ **Concept check 0**

1. Why does `const x = "dark"` have type `"dark"` but `let x = "dark"` have type `string`?
2. What's the difference between `as Priority` and a function returning `value is Priority`?
3. When would you use `satisfies` instead of a type annotation?
4. Why is `unknown` safer than `any`?
5. What does `Task["title"]` mean, and what does `keyof Task` give you?

Answers in [Appendix B](#appendix-b--concept-check-answers).

---

# 1. The React mental model

Before syntax, the idea. Almost every React bug in your first month traces back to a gap in this section rather than to a missing semicolon, so it's worth more than the ten minutes it looks like it's worth.

## 1.1 UI is a function of state

You don't write instructions to change the screen. You describe what the screen should look like *for a given set of data*, and React works out the DOM operations.

```ts
// Not React — imperative. You manage the DOM yourself, step by step.
document.getElementById("count")!.textContent = String(count + 1)
if (count + 1 > 5) document.getElementById("count")!.classList.add("text-danger")

// React — declarative. You describe the output for the current state.
<span className={count > 5 ? "text-danger" : ""}>{count}</span>
```

The imperative version answers "what should I *do*?". The declarative version answers "what should it *look like*?". The second question has one answer for any given state; the first has as many answers as there are paths through your code, which is why imperative UI decays into inconsistent states as it grows.

Written as a formula: `UI = f(state)`. Your components are `f`.

## 1.2 Components are the unit of everything

A component is a function that takes data and returns a description of UI. Components nest to form a tree, and the tree is your application.

```
              App
        ┌──────┴───────┐
     Header          Board
                 ┌─────┴─────┐
             Toolbar      TaskList
                        ┌────┴────┐
                   TaskCard    TaskCard
```

Two things follow from "it's just a tree of function calls", and both are load-bearing:

- **Data flows down.** A parent can pass anything to a child. A child cannot reach up.
- **Rendering cascades down.** When a component re-renders, React re-renders its children too, by default. Not the whole tree — the subtree.

## 1.3 What "render" actually means

This is the vocabulary people use loosely and then confuse themselves with. Three distinct phases:

| Phase | What happens | Your code's involvement |
|---|---|---|
| **Trigger** | Initial mount, or a state update | You call `setState` |
| **Render** | React calls your component functions, top-down, collecting the returned descriptions | This *is* your component function body |
| **Commit** | React compares the new description to the previous one and applies the minimum set of DOM changes | None — React does this |

So: **"re-render" means React called your function again.** It does **not** mean the browser repainted, it does **not** mean the DOM was rebuilt, and it is **not** inherently expensive. A component that re-renders and returns an identical description results in zero DOM operations.

The comparison step in commit is **reconciliation**: React walks the old and new element trees together, and for each position decides *update this node*, *replace it*, *move it*, or *remove it*. Two rules drive its decisions, and both surface later as concrete bugs:

- **Same component type in the same position → the DOM node and its state are preserved**, and only changed attributes are patched.
- **Different type, or a different `key` → the old node is destroyed and a new one created**, losing its DOM state (scroll position, focus, uncontrolled input text) and its React state.

That second rule is the entire explanation for §4's key bugs and for the `key`-to-reset-state trick in §6. It's one mechanism with several famous symptoms.

## 1.4 Components must be pure

During render, a component must be a pure function: **same props and state in, same JSX out, and no side effects on the way through.**

```tsx
let renderCount = 0

function Impure() {
  renderCount += 1                 // ❌ mutating something outside
  document.title = "Hi"            // ❌ touching the outside world
  props.task.done = true           // ❌ mutating an input
  return <p>{renderCount}</p>
}
```

Purity isn't moral hygiene; it's what lets React call your function whenever it likes — twice, out of order, or speculatively for a feature that isn't shipped yet — without changing the result. React 18's Strict Mode enforces this in development by **calling every component function twice**. If your component is pure, double-invocation is invisible. If it isn't, you see it, which is the point.

Anything that isn't pure belongs in one of two places: an **event handler** (it happens because the user did something) or an **effect** (it happens because the component rendered). §11 is entirely about telling those apart.

## 1.5 The practical consequence

**You never reach for the DOM to change what's on screen. You change state, and let the screen follow.**

When you catch yourself writing `document.querySelector` to update the UI, or storing a value in a variable and wondering why the screen didn't move, you've reverted to the imperative model. The fix is always the same shape: *what state does this screen depend on, and how do I change that instead?*

---

## 🧪 Lab 1.1 — Imperative vs declarative

**Level:** core

Two counters that look identical and behave completely differently. The imperative one is the one you must be able to explain.

Create `src/demos/01-mental-model/ImperativeVsDeclarative.tsx`:

```tsx
import { useRef, useState } from "react"
import { Button, Col, Row, Card, Stack } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"

/** The DOM-manipulating approach. Works — until React re-renders. */
function ImperativeCounter() {
  const displayRef = useRef<HTMLSpanElement>(null)
  const countRef = useRef(0)
  const [, forceRender] = useState(0)

  function increment() {
    countRef.current += 1
    if (displayRef.current) {
      displayRef.current.textContent = String(countRef.current)
      displayRef.current.className =
        countRef.current > 3 ? "fs-1 fw-bold text-danger" : "fs-1 fw-bold"
    }
  }

  return (
    <Card className="h-100 border-danger-subtle">
      <Card.Header className="bg-danger-subtle fw-semibold">
        Imperative — we edit the DOM
      </Card.Header>
      <Card.Body className="text-center">
        <span ref={displayRef} className="fs-1 fw-bold d-block mb-3">
          0
        </span>
        <Stack gap={2}>
          <Button variant="outline-danger" onClick={increment}>
            Increment (edits the DOM directly)
          </Button>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => forceRender((n) => n + 1)}
          >
            Force an unrelated re-render
          </Button>
        </Stack>
        <p className="text-muted small mt-3 mb-0">
          Click increment a few times, then force a re-render.
        </p>
      </Card.Body>
    </Card>
  )
}

/** The React approach. State is the source of truth; the DOM follows. */
function DeclarativeCounter() {
  const [count, setCount] = useState(0)
  const [, forceRender] = useState(0)

  return (
    <Card className="h-100 border-success-subtle">
      <Card.Header className="bg-success-subtle fw-semibold">
        Declarative — we change state
      </Card.Header>
      <Card.Body className="text-center">
        <span
          className={
            count > 3 ? "fs-1 fw-bold text-danger d-block mb-3" : "fs-1 fw-bold d-block mb-3"
          }
        >
          {count}
        </span>
        <Stack gap={2}>
          <Button variant="outline-success" onClick={() => setCount((c) => c + 1)}>
            Increment (sets state)
          </Button>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => forceRender((n) => n + 1)}
          >
            Force an unrelated re-render
          </Button>
        </Stack>
        <p className="text-muted small mt-3 mb-0">
          Do the same here. Nothing is lost.
        </p>
      </Card.Body>
    </Card>
  )
}

export default function ImperativeVsDeclarative() {
  return (
    <DemoCard
      title="Imperative vs declarative"
      claim="Hand-written DOM edits are erased the moment React re-renders, because React re-applies its own description of the UI. State-driven output survives."
      level="core"
      notice={
        <ul className="mb-0">
          <li>
            Click <strong>Increment</strong> three or four times on the left. The number
            climbs and turns red — it looks fine.
          </li>
          <li>
            Now click <strong>Force an unrelated re-render</strong>. The left counter snaps
            back to <code>0</code> and loses its colour: React re-ran the component, which
            returns <code>0</code>, and the commit phase overwrote your edits.
          </li>
          <li>
            The right counter is unaffected, because <code>0</code> was never the truth —
            <code>count</code> was.
          </li>
          <li>
            The data wasn't lost on the left, only the display: <code>countRef</code> still
            holds the real number. That mismatch between "what I stored" and "what's on
            screen" is the imperative bug in miniature.
          </li>
        </ul>
      }
    >
      <Row className="g-3">
        <Col md={6}>
          <ImperativeCounter />
        </Col>
        <Col md={6}>
          <DeclarativeCounter />
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register it:

```tsx
import ImperativeVsDeclarative from "@/demos/01-mental-model/ImperativeVsDeclarative"

// in the demos array:
{ id: "imperative-vs-declarative", chapter: "1 — Mental model", title: "Imperative vs declarative", element: <ImperativeVsDeclarative /> },
```

Open `#imperative-vs-declarative` and follow the four steps in the footer.

**Experiments:**

1. On the left, click Increment five times, force a re-render, then click Increment once. It jumps to `7`, not `1` — because `countRef` was at 6 the whole time. The display was lying, not the data.
2. Add `console.log("render", countRef.current)` at the top of `ImperativeCounter`. Confirm that Increment does *not* log (no re-render — you edited the DOM behind React's back) while Force re-render does.
3. `forceRender` here is a deliberate hack to trigger a render with no meaningful state. Real code never needs it — but it's a useful lab tool, and worth recognising as a smell if you see it in production code.

---

## 🧪 Lab 1.2 — Watch the render cascade

**Level:** depth

You can talk about "re-rendering the subtree" or you can watch it happen. This lab is the reason the memoisation section in §16 will feel obvious rather than magical.

Create `src/demos/01-mental-model/RenderCascade.tsx`:

```tsx
import { useState, type ReactNode } from "react"
import { Button, Card, Stack } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import RenderBadge from "@/lab/RenderBadge"

interface NodeProps {
  name: string
  depth: number
  children?: ReactNode
}

/** A generic tree node that reports its own render count. */
function TreeNode({ name, depth, children }: NodeProps) {
  const [localBump, setLocalBump] = useState(0)

  return (
    <div
      className="border rounded-3 p-3 bg-white"
      style={{ marginLeft: depth * 12 }}
    >
      <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
        <code className="fw-semibold">{name}</code>
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted small">bump: {localBump}</span>
          <RenderBadge label={name} bg={depth === 0 ? "primary" : "secondary"} />
          <Button size="sm" variant="outline-dark" onClick={() => setLocalBump((n) => n + 1)}>
            Set state here
          </Button>
        </div>
      </div>
      {children && <Stack gap={2}>{children}</Stack>}
    </div>
  )
}

export default function RenderCascade() {
  return (
    <DemoCard
      title="The render cascade"
      claim="A state update re-renders that component and everything below it — never anything above it, and never a sibling."
      level="depth"
      notice={
        <ul className="mb-0">
          <li>
            Click <strong>Set state here</strong> on <code>Board</code>. Its counter and
            those of <code>TaskList</code>, <code>CardA</code> and <code>CardB</code> all
            climb. <code>App</code> and <code>Header</code> do not move.
          </li>
          <li>
            Click it on <code>CardA</code>. Only <code>CardA</code> moves. Updates never
            travel upward or sideways.
          </li>
          <li>
            Click it on <code>App</code>. Everything climbs — which is exactly why "keep
            state as low as it can go" is a performance rule and not just a tidiness rule.
          </li>
          <li>
            Counters climb in <em>twos</em> because Strict Mode double-invokes components in
            development. Compare which counters move, not the absolute numbers.
          </li>
        </ul>
      }
    >
      <TreeNode name="App" depth={0}>
        <TreeNode name="Header" depth={1} />
        <TreeNode name="Board" depth={1}>
          <TreeNode name="Toolbar" depth={2} />
          <TreeNode name="TaskList" depth={2}>
            <TreeNode name="CardA" depth={3} />
            <TreeNode name="CardB" depth={3} />
          </TreeNode>
        </TreeNode>
      </TreeNode>
    </DemoCard>
  )
}
```

Register it as `{ id: "render-cascade", chapter: "1 — Mental model", title: "Render cascade", element: <RenderCascade /> }`.

**Experiments:**

1. Open React DevTools → **Profiler** → gear icon → tick **"Highlight updates when components render"**. Now click around. The flashing outlines show the same information visually, and this is the tool you'll actually use on a real app.
2. `Header` and `Board` are siblings. Convince yourself no click on one ever affects the other, and articulate why: they don't share state, and neither is an ancestor of the other.
3. Bump `CardA` a few times, then bump `App`. `CardA`'s `localBump` survives — a re-render does **not** reset state. Only unmounting does. Keep that distinction; §4 and §6 both depend on it.

---

## 🧪 Lab 1.3 — Purity and Strict Mode

**Level:** depth

Skip this and Strict Mode's double-invocation will confuse you at least twice later. Ten minutes now, saved twice over.

Create `src/demos/01-mental-model/PurityLab.tsx`:

```tsx
import { useState } from "react"
import { Alert, Button, Col, Row, Card } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"

// A module-level variable. Shared by every render of every instance.
let sideEffectTally = 0

/** Impure: mutates something outside itself during render. */
function ImpureBadge({ trigger }: { trigger: number }) {
  sideEffectTally += 1          // ❌ never do this in real code
  return (
    <Card body className="border-danger-subtle">
      <div className="small text-muted">trigger prop</div>
      <div className="fs-4">{trigger}</div>
      <div className="small text-muted mt-2">module tally, mutated during render</div>
      <div className="fs-4 text-danger">{sideEffectTally}</div>
    </Card>
  )
}

/** Pure: derives everything it shows from its inputs. */
function PureBadge({ trigger }: { trigger: number }) {
  const doubled = trigger * 2   // ✅ derived, no outside mutation
  return (
    <Card body className="border-success-subtle">
      <div className="small text-muted">trigger prop</div>
      <div className="fs-4">{trigger}</div>
      <div className="small text-muted mt-2">derived during render</div>
      <div className="fs-4 text-success">{doubled}</div>
    </Card>
  )
}

export default function PurityLab() {
  const [trigger, setTrigger] = useState(0)

  return (
    <DemoCard
      title="Purity and Strict Mode"
      claim="Strict Mode calls every component twice in development. Pure components are unaffected; impure ones visibly double-count, which is how you find them."
      level="depth"
      notice={
        <ul className="mb-0">
          <li>
            Click <strong>Re-render</strong> once. The trigger goes up by 1; the red tally
            goes up by <strong>2</strong>. That gap is Strict Mode calling the function
            twice and the impure line running twice.
          </li>
          <li>
            The green number is always exactly <code>trigger × 2</code>, no matter how many
            times React calls the function. That is what purity buys: <em>idempotence</em>.
          </li>
          <li>
            Remove <code>&lt;StrictMode&gt;</code> from <code>main.tsx</code> and the red
            tally increments by 1 instead. The bug didn't go away — you just stopped being
            told about it. Put it back.
          </li>
        </ul>
      }
    >
      <Alert variant="warning" className="small">
        <code>ImpureBadge</code> is written the wrong way <em>on purpose</em>. Never mutate
        module state, props, or the DOM during render.
      </Alert>

      <Button className="mb-3" onClick={() => setTrigger((t) => t + 1)}>
        Re-render
      </Button>

      <Row className="g-3">
        <Col md={6}>
          <ImpureBadge trigger={trigger} />
        </Col>
        <Col md={6}>
          <PureBadge trigger={trigger} />
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register it as `{ id: "purity", chapter: "1 — Mental model", title: "Purity & Strict Mode", element: <PurityLab /> }`.

**Experiments:**

1. Navigate away to another demo and back. The red tally keeps its value and jumps again, because module-level variables outlive component instances. State would have reset. Two different lifetimes, one easy confusion.
2. Move `sideEffectTally += 1` into a `useEffect(() => { sideEffectTally += 1 })` inside `ImpureBadge`. Now it increments once per commit rather than twice per render — this is the correct home for that kind of work, and §11 explains why.
3. Change `PureBadge` to write `document.title = String(trigger)` during render. Nothing visibly breaks, which is the danger — impurity is often silent until it isn't. Move it to an effect.

✅ **Concept check 1**

1. What are the three phases of a React update, and which one is your component function?
2. Does a re-render mean the browser repainted? Does it reset the component's state?
3. Why does React re-render children when a parent's state changes?
4. Give two reasons React destroys a DOM node instead of updating it.
5. Why does Strict Mode call your component twice, and what does it *not* double?

---

# 2. JSX & TSX

JSX is syntax sugar that looks like HTML and compiles to JavaScript function calls. In a `.tsx` file it's the same thing, type-checked.

## 2.1 What it compiles to

```tsx
const element = <h1 className="display-6">Hello</h1>
```

becomes, roughly:

```js
const element = jsx("h1", { className: "display-6", children: "Hello" })
```

and `jsx()` returns a plain object:

```js
{ type: "h1", props: { className: "display-6", children: "Hello" }, key: null, /* ... */ }
```

Three consequences fall out of that, and they explain nearly every JSX quirk:

1. **JSX is an expression producing a value.** You can assign it to a variable, put it in an array, return it from a function, pass it as a prop, or store it in a config object — as `registry.tsx` already does.
2. **Nothing happens when you write it.** `<Modal />` doesn't open a modal; it creates a description of one. React decides when, or whether, to call the function.
3. **It follows JavaScript's rules**, not HTML's — which is why `class` and `for` had to be renamed, and why `if` doesn't work inside braces.

> **TS Note.** The type of that object is `ReactElement`. The type of *anything renderable* is `ReactNode`, which is the wider union: `ReactElement | string | number | boolean | null | undefined | ReactNode[]` (plus portals and iterables). **Type children and slot-like props as `ReactNode`, and return types as `ReactNode` too.** `JSX.Element` is narrower and older; you'll see it in existing code, and it rejects perfectly valid returns like `null`.

## 2.2 The rules

**Embed expressions with `{}`:**

```tsx
const user = { name: "Ada", tasks: 3 }

<p>{user.name} has {user.tasks} tasks</p>
<p>{user.tasks > 0 ? "Busy" : "Free"}</p>
<p>{user.name.toUpperCase()}</p>
<p>{[1, 2, 3].map((n) => n * 2).join(", ")}</p>
```

Expressions only. `if`, `for`, `switch`, and variable declarations are **statements** and won't work inside JSX. When you want one, either move it above the `return` or reach for the conditional idioms in §5.

**`className`, not `class`** — `class` is a reserved word in JavaScript. Similarly `htmlFor` instead of `for`, and camelCase for everything else (`onClick`, `tabIndex`, `colSpan`, `readOnly`, `autoFocus`). Two families keep their dashes because they're not DOM properties: `data-*` and `aria-*`.

```tsx
<div data-bs-theme="dark" aria-live="polite" tabIndex={-1} />
```

**Every tag must close:** `<img />`, `<br />`, `<hr />`, `<input />`.

**Return one root element.** Wrap siblings in a fragment when you don't want an extra DOM node:

```tsx
<>
  <h1>Title</h1>
  <p>Body</p>
</>
```

The shorthand `<>` can't take a `key`, so inside a `map` you need the long form:

```tsx
import { Fragment } from "react"

{groups.map((g) => (
  <Fragment key={g.id}>
    <dt>{g.name}</dt>
    <dd>{g.count}</dd>
  </Fragment>
))}
```

This matters for definition lists, table rows, and grid layouts, where an extra wrapper `<div>` would break the CSS.

**Curly braces for anything that isn't a string literal:**

```tsx
<Badge bg="primary" />          // string literal — quotes
<Badge bg={variant} />          // variable — braces
<ProgressBar now={40} />        // number — braces, or you get the string "40"
<Form.Check checked={true} />
<Form.Check checked />          // shorthand for {true}
```

**Style takes an object with camelCase keys**, and numbers get `px` added for length properties:

```tsx
<div style={{ marginTop: 8, backgroundColor: "red", zIndex: 10 }} />
```

You'll rarely need it — Bootstrap's utility classes (`mt-2`, `bg-danger`) cover almost everything, and inline styles can't use media queries or pseudo-classes. The legitimate uses are genuinely dynamic values: a computed width, a colour from data, a `maxWidth` constraint.

**Comments inside JSX** are an expression containing a JS comment:

```tsx
<div>
  {/* This is how you comment inside JSX */}
</div>
```

**Whitespace collapses like HTML** within a line, but line breaks between expressions disappear entirely. When you need a guaranteed space, `{" "}` is the idiom:

```tsx
<p>
  Read the <a href="/docs">docs</a>{" "}
  before asking.
</p>
```

## 2.3 What renders and what doesn't

```tsx
{null}          // renders nothing
{undefined}     // renders nothing
{false}         // renders nothing
{true}          // renders nothing
{""}            // renders nothing (empty string)
{0}             // renders "0"   ← the classic gotcha
{NaN}           // renders "NaN"
{[1, 2, 3]}     // renders "123"  (arrays are flattened, no separator)
{{ a: 1 }}      // ERROR: objects are not valid as a React child
{new Date()}    // ERROR: same reason — call .toLocaleDateString() first
```

That `0` behaviour causes a specific, very common bug:

```tsx
{tasks.length && <TaskList />}      // when length is 0, renders "0" on screen
{tasks.length > 0 && <TaskList />}  // correct
```

`&&` returns its *left* operand when that operand is falsy. `0` is falsy, so the expression evaluates to `0` — and `0` is a valid, renderable React node. The same trap catches `""` (harmless, renders nothing) and `NaN` (renders "NaN").

**The rule:** the left side of `&&` in JSX must be a genuine boolean. Write a comparison (`> 0`, `!== null`), or `Boolean(x)`, or use a ternary.

> **TS Note.** TypeScript catches the object case at compile time (`Type '{ a: number; }' is not assignable to type 'ReactNode'`) but **not** the `0` case, because `number` is a legitimate `ReactNode`. That one is still on you. An ESLint rule can help: `react/jsx-no-leaked-render`.

## 2.4 Conditional and spread attributes

Two patterns that come up constantly once components get real:

```tsx
// Spread an object of props
const inputProps = { placeholder: "Search", autoFocus: true }
<Form.Control {...inputProps} />

// Forward everything you were given, then override
function Field({ label, ...rest }: FieldProps) {
  return (
    <>
      <Form.Label>{label}</Form.Label>
      <Form.Control {...rest} />
    </>
  )
}

// Conditionally include a prop at all
<Button {...(isSubmitting ? { disabled: true } : {})}>Save</Button>

// Usually clearer:
<Button disabled={isSubmitting}>Save</Button>
```

Prefer the explicit form. `disabled={false}` and "no `disabled` prop" mean the same thing for booleans, so the conditional-spread trick is only needed for props where `undefined` and absent genuinely differ — which is rare, and mostly involves third-party components.

**Building class names conditionally** is the single most common JSX chore with Bootstrap. Three levels of solution:

```tsx
// 1. Ternary — fine for one condition
<span className={done ? "text-muted text-decoration-line-through" : "fw-medium"} />

// 2. Template literal with a filter — fine for two or three
<span className={["fw-medium", done && "text-muted", isNew && "fst-italic"].filter(Boolean).join(" ")} />

// 3. clsx — what you'd actually install once it gets busy
// npm install clsx
import clsx from "clsx"
<span className={clsx("fw-medium", { "text-muted": done, "fst-italic": isNew })} />
```

`clsx` is 200 bytes and worth installing the moment you write the second `.filter(Boolean).join(" ")`.

## 2.5 Raw HTML, and why you should hesitate

```tsx
<div dangerouslySetInnerHTML={{ __html: userContent }} />
```

The name is a deliberate warning. This bypasses React's escaping, so any `<script>` in `userContent` executes — a cross-site scripting hole. React escapes text by default, which is why `<p>{userInput}</p>` is always safe. If you must render HTML you didn't author, sanitise it first (`dompurify`), and be sure you actually need to.

---

## 🧪 Lab 2.1 — Expression playground

**Level:** core

Create `src/demos/02-jsx/ExpressionPlayground.tsx`:

```tsx
import { useState } from "react"
import { Form, Table, Stack } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"

export default function ExpressionPlayground() {
  const [name, setName] = useState("Ada")
  const [taskCount, setTaskCount] = useState(3)

  const user = { name, tasks: taskCount, joined: new Date(2024, 0, 15) }
  const tags = ["work", "urgent", "review"]

  return (
    <DemoCard
      title="Expression playground"
      claim="Anything inside {} is a JavaScript expression evaluated at render time — no template language, no directives, no new syntax to memorise."
      level="core"
      notice={
        <ul className="mb-0">
          <li>
            Every row is recomputed on every keystroke, because the whole component
            function re-runs. There is no diffing of templates — just JavaScript.
          </li>
          <li>
            <code>{"{user.joined}"}</code> would be a runtime error: a <code>Date</code> is
            an object, not a <code>ReactNode</code>. You must format it to a string yourself.
          </li>
          <li>
            The array row renders <code>workurgentreview</code> with no separators. Arrays
            are flattened, not joined — <code>.join(", ")</code> is on you.
          </li>
        </ul>
      }
    >
      <Stack gap={3}>
        <Form.Group>
          <Form.Label className="small fw-semibold">Name</Form.Label>
          <Form.Control value={name} onChange={(e) => setName(e.target.value)} />
        </Form.Group>

        <Form.Group>
          <Form.Label className="small fw-semibold">
            Task count: {taskCount}
          </Form.Label>
          <Form.Range
            min={0}
            max={10}
            value={taskCount}
            onChange={(e) => setTaskCount(Number(e.target.value))}
          />
        </Form.Group>

        <Table bordered size="sm" className="mb-0 align-middle">
          <thead className="table-light">
            <tr>
              <th style={{ width: "55%" }}>Expression</th>
              <th>Renders as</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>{"{user.name}"}</code></td>
              <td>{user.name}</td>
            </tr>
            <tr>
              <td><code>{"{user.name.toUpperCase()}"}</code></td>
              <td>{user.name.toUpperCase()}</td>
            </tr>
            <tr>
              <td><code>{"{`${user.name} has ${user.tasks}`}"}</code></td>
              <td>{`${user.name} has ${user.tasks}`}</td>
            </tr>
            <tr>
              <td><code>{"{user.tasks > 0 ? \"Busy\" : \"Free\"}"}</code></td>
              <td>{user.tasks > 0 ? "Busy" : "Free"}</td>
            </tr>
            <tr>
              <td><code>{"{user.tasks * 2 + 1}"}</code></td>
              <td>{user.tasks * 2 + 1}</td>
            </tr>
            <tr>
              <td><code>{"{tags}"}</code> (array, flattened)</td>
              <td>{tags}</td>
            </tr>
            <tr>
              <td><code>{"{tags.join(\", \")}"}</code></td>
              <td>{tags.join(", ")}</td>
            </tr>
            <tr>
              <td><code>{"{tags.map(t => <Badge/>)}"}</code></td>
              <td>
                {tags.map((tag) => (
                  <span key={tag} className="badge bg-secondary me-1">
                    {tag}
                  </span>
                ))}
              </td>
            </tr>
            <tr>
              <td><code>{"{user.joined.toLocaleDateString()}"}</code></td>
              <td>{user.joined.toLocaleDateString()}</td>
            </tr>
            <tr className="table-warning">
              <td><code>{"{user.joined}"}</code> — a raw Date object</td>
              <td className="text-muted fst-italic">
                would throw: objects are not valid as a React child
              </td>
            </tr>
          </tbody>
        </Table>
      </Stack>
    </DemoCard>
  )
}
```

Register as `{ id: "expressions", chapter: "2 — JSX", title: "Expression playground", element: <ExpressionPlayground /> }`.

**Experiments:**

1. Uncomment the danger by replacing that last cell's text with `{user.joined}`. Read the runtime error carefully: *"Objects are not valid as a React child"*. It even suggests the fix. Then undo.
2. Add a row rendering `{user}` — same error, and TypeScript flags it *before* you run, which the `Date` case does too. Hover it to see `ReactNode` in the message.
3. Remove the `key={tag}` from the badge map. A console warning appears. §4 is about why.

---

## 🧪 Lab 2.2 — What renders, and the falsy trap

**Level:** core

The `0` bug is the most common JSX mistake in existence. Seeing it once inoculates you.

Create `src/demos/02-jsx/FalsyTrap.tsx`:

```tsx
import { useState } from "react"
import { Alert, Button, ButtonGroup, Card, Col, Row, Table } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"

const values = [
  { label: "null", value: null },
  { label: "undefined", value: undefined },
  { label: "false", value: false },
  { label: "true", value: true },
  { label: '"" (empty string)', value: "" },
  { label: "0", value: 0 },
  { label: "NaN", value: NaN },
  { label: '"hello"', value: "hello" },
  { label: "42", value: 42 },
  { label: "[1, 2, 3]", value: [1, 2, 3] },
]

export default function FalsyTrap() {
  const [count, setCount] = useState(0)

  return (
    <DemoCard
      title="What renders — and the && trap"
      claim="Falsy values mostly render nothing, but 0 and NaN render as text. Combined with &&, that puts a stray 0 on your page."
      level="core"
      notice={
        <ul className="mb-0">
          <li>
            With count at <strong>0</strong>, the red card shows a bare <code>0</code> —
            <code>{"{count && <p/>}"}</code> evaluated to <code>0</code>, and <code>0</code>
            is renderable.
          </li>
          <li>
            The green card is empty at 0, because <code>{"count > 0"}</code> is a real
            boolean and <code>false</code> renders nothing.
          </li>
          <li>
            Set count to 1 and both cards look identical. <strong>That's what makes this
            bug survive code review</strong> — it only shows itself at exactly zero, which
            is also the state you're least likely to click through.
          </li>
          <li>
            TypeScript cannot help here: <code>number</code> is a legal
            <code>ReactNode</code>, so nothing is wrong as far as the compiler is concerned.
          </li>
        </ul>
      }
    >
      <Row className="g-3 mb-4">
        <Col xs={12}>
          <ButtonGroup>
            <Button variant="outline-dark" onClick={() => setCount(0)}>
              count = 0
            </Button>
            <Button variant="outline-dark" onClick={() => setCount(1)}>
              count = 1
            </Button>
            <Button variant="outline-dark" onClick={() => setCount(5)}>
              count = 5
            </Button>
          </ButtonGroup>
        </Col>

        <Col md={6}>
          <Card className="h-100 border-danger-subtle">
            <Card.Header className="bg-danger-subtle small fw-semibold font-monospace">
              {"{count && <p>…</p>}"}
            </Card.Header>
            <Card.Body style={{ minHeight: 90 }}>
              {count && <p className="mb-0">You have {count} tasks.</p>}
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="h-100 border-success-subtle">
            <Card.Header className="bg-success-subtle small fw-semibold font-monospace">
              {"{count > 0 && <p>…</p>}"}
            </Card.Header>
            <Card.Body style={{ minHeight: 90 }}>
              {count > 0 && <p className="mb-0">You have {count} tasks.</p>}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Alert variant="light" className="border small">
        <strong>The fix, in order of preference:</strong>{" "}
        <code>{"{count > 0 && …}"}</code>, or{" "}
        <code>{"{count ? … : null}"}</code>, or{" "}
        <code>{"{Boolean(count) && …}"}</code>.
      </Alert>

      <Table bordered size="sm" className="mb-0 align-middle">
        <thead className="table-light">
          <tr>
            <th style={{ width: "40%" }}>Value in {"{}"}</th>
            <th>Renders as (between the brackets)</th>
          </tr>
        </thead>
        <tbody>
          {values.map(({ label, value }) => (
            <tr key={label}>
              <td><code>{label}</code></td>
              <td className="font-monospace">[{value}]</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </DemoCard>
  )
}
```

Register as `{ id: "falsy-trap", chapter: "2 — JSX", title: "What renders / && trap", element: <FalsyTrap /> }`.

**Experiments:**

1. Add a row for `{{ a: 1 }}` to the `values` array. TypeScript refuses before you can run it — read the error and note that it names `ReactNode`.
2. Change the red card to `{"" && <p>...</p>}`. Nothing renders, because `""` is falsy *and* renders as nothing. Two bugs cancelling out is not the same as correct code.
3. Install and enable `eslint-plugin-react`'s `react/jsx-no-leaked-render` rule if your team is starting fresh. It flags exactly this.

---

## 🧪 Lab 2.3 — Fragments, spread, and dynamic classes

**Level:** depth

Create `src/demos/02-jsx/AttributesLab.tsx`:

```tsx
import { Fragment, useState } from "react"
import { Button, Form, Stack } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"

const specs = [
  { id: "cpu", term: "CPU", detail: "8 cores" },
  { id: "ram", term: "Memory", detail: "32 GB" },
  { id: "ssd", term: "Storage", detail: "1 TB" },
]

export default function AttributesLab() {
  const [done, setDone] = useState(false)
  const [isNew, setIsNew] = useState(true)
  const [disabled, setDisabled] = useState(false)
  const [wrapInDiv, setWrapInDiv] = useState(false)

  // The three ways to build a class list, all producing the same output
  const ternary = done ? "text-muted text-decoration-line-through" : "fw-semibold"
  const filtered = ["fs-5", done && "text-muted", isNew && "fst-italic"]
    .filter(Boolean)
    .join(" ")

  // A props object, spread into a component
  const sharedInputProps = {
    placeholder: "Spread from an object",
    size: "sm" as const,
    disabled,
  }

  const Wrapper = wrapInDiv ? "div" : Fragment

  return (
    <DemoCard
      title="Fragments, spread and dynamic classes"
      claim="Props are just an object, class names are just a string, and a fragment is a real element type you can swap in and out."
      level="depth"
      notice={
        <ul className="mb-0">
          <li>
            Toggle <strong>Wrap in div</strong> and inspect the <code>&lt;dl&gt;</code> in
            DevTools. With a fragment, the <code>dt</code>/<code>dd</code> pairs are direct
            children and the layout is valid. With a <code>div</code>, they're nested one
            level too deep and the definition-list styling breaks.
          </li>
          <li>
            Inside a <code>map</code> the shorthand <code>&lt;&gt;</code> won't do — it
            cannot take a <code>key</code>. That's the one place you need the explicit
            <code>&lt;Fragment key&gt;</code>.
          </li>
          <li>
            <code>{"{...sharedInputProps}"}</code> passes three props at once. Anything
            written <em>after</em> the spread wins, which is how you provide overridable
            defaults.
          </li>
        </ul>
      }
    >
      <Stack gap={3}>
        <div className="d-flex flex-wrap gap-3">
          <Form.Check type="switch" label="done" checked={done} onChange={(e) => setDone(e.target.checked)} />
          <Form.Check type="switch" label="isNew" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} />
          <Form.Check type="switch" label="disabled" checked={disabled} onChange={(e) => setDisabled(e.target.checked)} />
          <Form.Check type="switch" label="Wrap in div" checked={wrapInDiv} onChange={(e) => setWrapInDiv(e.target.checked)} />
        </div>

        <div className="border rounded-3 p-3">
          <div className="small text-muted mb-1">Ternary class</div>
          <div className={ternary}>Review the deployment checklist</div>

          <div className="small text-muted mt-3 mb-1">
            Filtered array → <code className="small">{filtered || "(none)"}</code>
          </div>
          <div className={filtered}>Review the deployment checklist</div>
        </div>

        <div className="d-flex gap-2 align-items-center">
          <Form.Control {...sharedInputProps} />
          <Form.Control {...sharedInputProps} placeholder="Overridden after the spread" />
          <Button size="sm" disabled={disabled}>
            Save
          </Button>
        </div>

        <div className="border rounded-3 p-3">
          <div className="small text-muted mb-2">
            Definition list built with <code>&lt;Fragment key&gt;</code>
          </div>
          <dl className="row mb-0">
            {specs.map((spec) => (
              <Wrapper key={spec.id}>
                <dt className="col-sm-3">{spec.term}</dt>
                <dd className="col-sm-9 mb-1">{spec.detail}</dd>
              </Wrapper>
            ))}
          </dl>
        </div>
      </Stack>
    </DemoCard>
  )
}
```

Register as `{ id: "attributes", chapter: "2 — JSX", title: "Fragments & spread", element: <AttributesLab /> }`.

**Experiments:**

1. Swap `<Wrapper key={spec.id}>` for `<>` and watch TypeScript reject the `key`. That constraint is the whole reason `Fragment` still has a longhand.
2. Move `{...sharedInputProps}` to *after* `placeholder="Overridden…"` on the second input. The override stops working — spread order is just object-literal order.
3. `size: "sm" as const` — remove the `as const` and TypeScript complains that `string` isn't assignable to `"sm" | "lg"`. This is §0.8.1's `let`/`const` widening rule showing up in real code, and it's a very common five-minute confusion.

✅ **Concept check 2**

1. What kind of value does `<Button />` evaluate to, and what has happened by the time that line finishes running?
2. Why can't you write an `if` statement inside `{}`?
3. Why does `{items.length && <List />}` put a `0` on the page, and what are two fixes?
4. When must you use `<Fragment>` rather than `<>`?
5. What's the difference between `ReactNode` and `ReactElement`, and which should you use for a `children` prop?

---

# 3. Components & props

A component is a function that returns JSX. Two rules: **the name must be capitalised** (lowercase names are treated as HTML tags — `<button>` is the element, `<Button>` is your component), and it must be **pure** (§1.4).

**Props** are the arguments. They flow **down** only, and they are **read-only**.

## 3.1 Props are one object

This is worth stating plainly, because a lot of confusion evaporates once it's clear. React calls your component with exactly one argument: an object of all the props.

```tsx
// These are identical
function Greeting(props: GreetingProps) {
  return <p>{props.name}</p>
}

function Greeting({ name }: GreetingProps) {   // destructured — the usual style
  return <p>{name}</p>
}
```

Destructuring in the parameter list is conventional because it documents at a glance what the component consumes. Defaults go in the destructuring, not in a separate `defaultProps` (which is deprecated for function components):

```tsx
function Greeting({ name, role = "member", count = 0 }: GreetingProps) { /* ... */ }
```

## 3.2 Typing props

This is the single most valuable thing TypeScript does in React. Define an interface, destructure in the parameter list:

```tsx
interface GreetingProps {
  name: string
  role?: string                    // optional — string | undefined
  count: number
  tone: "neutral" | "warning"      // union, not string
  onDismiss?: () => void           // optional callback
}

function Greeting({ name, role = "member", count, tone, onDismiss }: GreetingProps) {
  return <p>{name} — {role} ({count})</p>
}

<Greeting name="Ada" role="admin" count={3} tone="neutral" />
<Greeting name="Grace" count={0} tone="warning" />       // role defaults
<Greeting name="Alan" tone="neutral" />                  // ❌ 'count' is missing
<Greeting name={42} count={1} tone="neutral" />          // ❌ number not assignable to string
<Greeting name="Ada" count={1} tone="urgent" />          // ❌ not assignable to the union
```

Every consumer of your component now gets autocomplete for its props and a compile error for mistakes. On a team, this replaces a good deal of documentation — and unlike documentation, it can't drift out of date.

> **You may see `React.FC<Props>`** in older code. It's no longer recommended — plain function declarations with typed parameters are simpler, support generics naturally, and avoid `FC`'s historical quirks with `children`.

**Naming conventions that pay off:**

| Prop shape | Convention | Example |
|---|---|---|
| Event callback | `on` + past-tense or noun | `onSelect`, `onDismiss`, `onFilterChange` |
| The handler implementing it | `handle` + same noun | `handleSelect`, `handleDismiss` |
| Boolean | `is` / `has` / `can`, or bare adjective | `isLoading`, `hasError`, `disabled` |
| Render slot | noun, typed `ReactNode` | `icon`, `footer`, `actions` |
| Render function | `render` + noun | `renderItem` |

## 3.3 The `children` prop

Anything between the opening and closing tags arrives as `children`, typed as `ReactNode`:

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

Note `import type` — it makes explicit that you're importing a type, which is erased at compile time. Not required, but good practice and required by some lint configs (`verbatimModuleSyntax`).

`children` is just a prop with a special syntax. These are equivalent, and the second is occasionally useful when generating content programmatically:

```tsx
<Panel title="A">text</Panel>
<Panel title="A" children="text" />
```

You can also have **multiple slots** by typing extra props as `ReactNode`. This is how you avoid a component with fourteen booleans:

```tsx
interface PanelProps {
  title: ReactNode
  actions?: ReactNode      // buttons in the header
  children: ReactNode      // the body
  footer?: ReactNode
}
```

## 3.4 Composition over configuration

When a component starts growing boolean props (`showHeader`, `showFooter`, `isCompact`, `hasIcon`, `withBorder`), that's a signal you want `children` and smaller pieces instead. Each boolean doubles the number of states your component can be in, and most of those combinations are never used and never tested.

React-Bootstrap is built this way on purpose: `Card`, `Card.Header`, `Card.Body`, `Card.Title` are separate composable pieces rather than one `<Card>` with fifteen props. §20 covers how to build components like that yourself.

The rule of thumb: **props for data, children for UI.** If a prop's value would be JSX, it probably wants to be `children` or a named `ReactNode` slot.

## 3.5 Props are read-only

```tsx
function Bad({ task }: { task: Task }) {
  task.title = "changed"   // never do this — mutating a prop
  return <p>{task.title}</p>
}
```

Why it's forbidden: the object belongs to the parent, and React has no idea you changed it. Nothing re-renders, the parent's state and the screen now disagree, and the bug appears somewhere unrelated three components away.

Mark fields `readonly` in the interface and TypeScript will stop you:

```tsx
interface TaskCardProps {
  readonly task: Readonly<Task>
}
```

`Readonly<T>` is shallow — nested objects are still mutable — but it catches the overwhelming majority of accidents.

## 3.6 Data down, events up

If a component needs to change data it doesn't own, it calls a function passed down from the parent:

```tsx
// Parent owns the data and the updater; child just reports events upward.
function Parent() {
  const [count, setCount] = useState(0)
  return <Child count={count} onIncrement={() => setCount((c) => c + 1)} />
}

interface ChildProps {
  count: number
  onIncrement: () => void       // takes nothing, returns nothing
}

function Child({ count, onIncrement }: ChildProps) {
  return <Button onClick={onIncrement}>{count}</Button>
}
```

Data flows down as props. Events flow up as callbacks. **That's the whole architecture** — every state-management library you'll ever meet is a variation on making this easier at scale.

Design the callback around *what happened*, not *what to do about it*:

```tsx
onDelete: (id: string) => void          // ✅ "the user asked to delete this"
onSetTasksArray: (tasks: Task[]) => void // ❌ the child now knows how the parent stores things
```

The first keeps the child reusable and the parent in charge of policy. The second couples them permanently.

## 3.7 Extending native element props

Wrapper components need to accept everything the underlying element does — `aria-label`, `onFocus`, `id`, `className`, `type`, and forty others. Listing them is unworkable; `ComponentProps` derives them:

```tsx
import type { ComponentProps, ReactNode } from "react"
import { Button } from "react-bootstrap"

// Everything react-bootstrap's Button accepts, plus one of our own
interface IconButtonProps extends ComponentProps<typeof Button> {
  icon: ReactNode
}

function IconButton({ icon, children, className, ...rest }: IconButtonProps) {
  return (
    <Button className={`d-inline-flex align-items-center gap-2 ${className ?? ""}`} {...rest}>
      {icon}
      {children}
    </Button>
  )
}
```

Two details that make this work properly:

- **Pull out the props you intend to modify** (`className` here) and spread the rest. If you spread `className` untouched you lose the caller's classes; if you don't pull it out at all, your version gets overwritten by the spread.
- **`ComponentProps<"button">`** for a native element, **`ComponentProps<typeof Button>`** for a component. There's also `ComponentPropsWithoutRef<"button">`, which matters when you're writing your own `ref` forwarding — in React 19 `ref` is a normal prop, so plain `ComponentProps` is usually right.

## 3.8 Making impossible props impossible

A union of prop shapes stops callers from combining props that shouldn't coexist:

```tsx
type NoticeProps =
  | { kind: "info"; message: string }
  | { kind: "error"; message: string; onRetry: () => void }
  | { kind: "loading" }

function Notice(props: NoticeProps) {
  switch (props.kind) {
    case "loading":
      return <Spinner animation="border" size="sm" />
    case "error":
      // props.onRetry is guaranteed to exist here
      return <Alert variant="danger">{props.message} <Button onClick={props.onRetry}>Retry</Button></Alert>
    case "info":
      return <Alert variant="info">{props.message}</Alert>
  }
}

<Notice kind="error" message="Failed" />              // ❌ onRetry is required for errors
<Notice kind="loading" message="Hi" />                // ❌ loading takes no message
<Notice kind="error" message="Failed" onRetry={fn} /> // ✅
```

Compare with the naive version — `{ kind: string; message?: string; onRetry?: () => void }` — where every combination compiles and you check for `onRetry` at runtime and hope. The union version makes the invalid combinations *unrepresentable*, which is the strongest kind of guarantee a type system can give you. Note also that the `switch` needs no `default`: TypeScript knows the cases are exhaustive, so every path returns.

Don't reach for this on every component. It shines when a prop genuinely changes what *other* props mean — which is often exactly the moment a component starts to feel awkward.

---

## 🧪 Lab 3.1 — A typed props tour

**Level:** core

Create `src/demos/03-props/PropsTour.tsx`:

```tsx
import type { ReactNode } from "react"
import { Card, Col, Row, Badge } from "react-bootstrap"
import { ArrowDown, ArrowUp, Dash } from "react-bootstrap-icons"
import DemoCard from "@/lab/DemoCard"

// ---------- the component under study ----------

type Trend = "up" | "down" | "flat"

interface StatTileProps {
  /** Required string. */
  label: string
  /** Required number. */
  value: number
  /** Optional with a default. */
  unit?: string
  /** Union — three valid values, autocompleted, typos rejected. */
  trend?: Trend
  /** A ReactNode slot: pass an icon element, not a name. */
  icon?: ReactNode
  /** Optional callback. Its presence changes the rendering. */
  onSelect?: () => void
}

const trendMeta = {
  up: { icon: <ArrowUp size={12} />, text: "text-success", word: "rising" },
  down: { icon: <ArrowDown size={12} />, text: "text-danger", word: "falling" },
  flat: { icon: <Dash size={12} />, text: "text-secondary", word: "steady" },
} satisfies Record<Trend, { icon: ReactNode; text: string; word: string }>

function StatTile({
  label,
  value,
  unit = "",
  trend = "flat",
  icon,
  onSelect,
}: StatTileProps) {
  const meta = trendMeta[trend]

  return (
    <Card
      className={`h-100 ${onSelect ? "border-primary" : ""}`}
      role={onSelect ? "button" : undefined}
      onClick={onSelect}
    >
      <Card.Body>
        <div className="d-flex align-items-center gap-2 text-muted small mb-1">
          {icon}
          {label}
        </div>
        <div className="fs-3 fw-semibold lh-1">
          {value.toLocaleString()}
          {unit && <span className="fs-6 text-muted ms-1">{unit}</span>}
        </div>
        <div className={`small mt-2 d-flex align-items-center gap-1 ${meta.text}`}>
          {meta.icon} {meta.word}
        </div>
        {onSelect && (
          <Badge bg="primary-subtle" text="primary" className="mt-2">
            clickable — onSelect was passed
          </Badge>
        )}
      </Card.Body>
    </Card>
  )
}

// ---------- the lab ----------

export default function PropsTour() {
  return (
    <DemoCard
      title="A typed props tour"
      claim="Required, optional, defaulted, union, ReactNode-slot and callback props — the six shapes that cover almost every component you will write."
      level="core"
      notice={
        <ul className="mb-0">
          <li>
            The third tile passes no <code>trend</code> and no <code>unit</code>; both fall
            back to their destructuring defaults.
          </li>
          <li>
            The fourth tile passes <code>onSelect</code>, and the component renders
            differently because of it — <em>the presence of a prop is itself data</em>.
          </li>
          <li>
            <code>icon</code> is typed <code>ReactNode</code>, so callers pass{" "}
            <code>&lt;ArrowUp /&gt;</code>, not <code>"arrow-up"</code>. No lookup table,
            no restriction on which icons are allowed.
          </li>
          <li>
            Try adding <code>trend="sideways"</code> to any tile. It's a compile error
            before you can even reload the page.
          </li>
        </ul>
      }
    >
      <Row className="g-3">
        <Col sm={6} lg={3}>
          <StatTile label="Open tasks" value={12} trend="up" icon={<Dash size={12} />} />
        </Col>
        <Col sm={6} lg={3}>
          <StatTile label="Completion" value={68} unit="%" trend="down" />
        </Col>
        <Col sm={6} lg={3}>
          <StatTile label="Defaults only" value={1024} />
        </Col>
        <Col sm={6} lg={3}>
          <StatTile
            label="Overdue"
            value={3}
            trend="up"
            onSelect={() => alert("A callback prop makes a component interactive.")}
          />
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "props-tour", chapter: "3 — Props", title: "Typed props tour", element: <PropsTour /> }`.

**Experiments:**

1. Remove `value={12}` from the first tile. The error names the exact missing property. Now make `value` optional (`value?: number`) — a new error appears at `value.toLocaleString()`, because `undefined` has no methods. Optionality is contagious, which is a good reason not to make things optional out of politeness.
2. Change `unit = ""` to no default. `{unit && ...}` still works (undefined is falsy) but `unit` is now `string | undefined` everywhere. Defaults aren't just convenience; they *narrow the type* for the rest of the function.
3. Add a fifth tile passing `icon="up"`. TypeScript accepts it, because `string` is a valid `ReactNode` — and it renders the literal text "up". Types constrain shape, not intent.

---

## 🧪 Lab 3.2 — Children and composition

**Level:** core

The same UI built twice: once with configuration props, once with composition. Seeing them side by side is the fastest way to develop taste about this.

Create `src/demos/03-props/CompositionLab.tsx`:

```tsx
import type { ReactNode } from "react"
import { Button, Card, Col, Row, Badge, Alert } from "react-bootstrap"
import { Gear, Trash, ThreeDots } from "react-bootstrap-icons"
import DemoCard from "@/lab/DemoCard"

// ---------- Version A: configuration props ----------
// Every new requirement adds a prop. Note how many states this can be in.

interface ConfigPanelProps {
  title: string
  body: string
  showBadge?: boolean
  badgeText?: string
  showSettingsButton?: boolean
  showDeleteButton?: boolean
  showFooter?: boolean
  footerText?: string
  compact?: boolean
}

function ConfigPanel({
  title,
  body,
  showBadge,
  badgeText,
  showSettingsButton,
  showDeleteButton,
  showFooter,
  footerText,
  compact,
}: ConfigPanelProps) {
  return (
    <Card className={compact ? "py-0" : ""}>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <span className="fw-semibold">
          {title}
          {showBadge && <Badge bg="secondary" className="ms-2">{badgeText}</Badge>}
        </span>
        <span className="d-flex gap-1">
          {showSettingsButton && (
            <Button size="sm" variant="light"><Gear size={14} /></Button>
          )}
          {showDeleteButton && (
            <Button size="sm" variant="light"><Trash size={14} /></Button>
          )}
        </span>
      </Card.Header>
      <Card.Body className={compact ? "py-2" : ""}>{body}</Card.Body>
      {showFooter && <Card.Footer className="small text-muted">{footerText}</Card.Footer>}
    </Card>
  )
}

// ---------- Version B: composition ----------
// Three props. Anything the caller can imagine, it can pass.

interface PanelProps {
  title: ReactNode
  actions?: ReactNode
  footer?: ReactNode
  children: ReactNode
}

function Panel({ title, actions, footer, children }: PanelProps) {
  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <span className="fw-semibold">{title}</span>
        {actions && <span className="d-flex gap-1">{actions}</span>}
      </Card.Header>
      <Card.Body>{children}</Card.Body>
      {footer && <Card.Footer className="small text-muted">{footer}</Card.Footer>}
    </Card>
  )
}

export default function CompositionLab() {
  return (
    <DemoCard
      title="Configuration vs composition"
      claim="Nine boolean-ish props describe a fixed set of layouts. Three ReactNode slots describe all of them, including the ones you haven't thought of."
      level="core"
      notice={
        <ul className="mb-0">
          <li>
            <code>ConfigPanel</code> has 9 props and roughly 2⁵ visual states, most never
            used and none tested. Every new requirement ("a dropdown in the header") means
            editing the component.
          </li>
          <li>
            <code>Panel</code> has 4 props and handles the dropdown without being touched —
            look at the third example, which passes an element the component author never
            anticipated.
          </li>
          <li>
            The rule: <strong>props for data, children (or <code>ReactNode</code> slots)
            for UI.</strong> If the value you want to pass would be JSX, it wants to be a
            slot.
          </li>
          <li>
            React-Bootstrap itself is built this way. <code>Card.Header</code> exists
            instead of <code>&lt;Card headerText=…&gt;</code> for exactly this reason.
          </li>
        </ul>
      }
    >
      <Row className="g-3">
        <Col lg={6}>
          <div className="small fw-semibold text-danger mb-2">
            A — configuration: 9 props to say this much
          </div>
          <ConfigPanel
            title="Deployment"
            body="Pushed to production 4 minutes ago."
            showBadge
            badgeText="live"
            showSettingsButton
            showDeleteButton
            showFooter
            footerText="Last checked 12:04"
          />
        </Col>

        <Col lg={6}>
          <div className="small fw-semibold text-success mb-2">
            B — composition: the same output, 4 props
          </div>
          <Panel
            title={
              <>
                Deployment <Badge bg="secondary" className="ms-1">live</Badge>
              </>
            }
            actions={
              <>
                <Button size="sm" variant="light"><Gear size={14} /></Button>
                <Button size="sm" variant="light"><Trash size={14} /></Button>
              </>
            }
            footer="Last checked 12:04"
          >
            Pushed to production 4 minutes ago.
          </Panel>
        </Col>

        <Col lg={12}>
          <div className="small fw-semibold text-success mb-2">
            C — a requirement the component author never planned for, needing no change to
            <code className="ms-1">Panel</code>
          </div>
          <Panel
            title="Incident #4021"
            actions={
              <>
                <Button size="sm" variant="outline-danger">Escalate</Button>
                <Button size="sm" variant="light"><ThreeDots size={14} /></Button>
              </>
            }
            footer={
              <div className="d-flex justify-content-between">
                <span>Opened 09:12</span>
                <span>Owner: platform</span>
              </div>
            }
          >
            <Alert variant="warning" className="mb-0">
              An entire component in the body slot. No new prop was needed.
            </Alert>
          </Panel>
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "composition", chapter: "3 — Props", title: "Children & composition", element: <CompositionLab /> }`.

**Experiments:**

1. Add a requirement to both: *the header needs a dropdown menu*. Version B needs no change at all. Version A needs a new prop, a new conditional, and a decision about where the menu items come from. Time yourself.
2. Delete `badgeText` from the `ConfigPanel` call but leave `showBadge`. It renders an empty badge and TypeScript is perfectly happy — the two props are related in your head but not in the type. This is the class of bug the discriminated union in Lab 3.4 eliminates.
3. Pass `title={<Button>Not really a title</Button>}` to `Panel`. It works. Slots are powerful *and* unopinionated; that's the trade.

---

## 🧪 Lab 3.3 — Extending native props

**Level:** depth

Create `src/demos/03-props/NativePropsLab.tsx`:

```tsx
import type { ComponentProps, ReactNode } from "react"
import { Button, Stack } from "react-bootstrap"
import { Download, Trash, ArrowRepeat } from "react-bootstrap-icons"
import DemoCard from "@/lab/DemoCard"

/** Everything react-bootstrap's Button takes, plus an icon and a placement. */
interface IconButtonProps extends ComponentProps<typeof Button> {
  icon: ReactNode
  iconPosition?: "start" | "end"
}

function IconButton({
  icon,
  iconPosition = "start",
  children,
  className,
  ...rest
}: IconButtonProps) {
  return (
    <Button
      className={`d-inline-flex align-items-center gap-2 ${className ?? ""}`}
      {...rest}
    >
      {iconPosition === "start" && icon}
      {children}
      {iconPosition === "end" && icon}
    </Button>
  )
}

export default function NativePropsLab() {
  return (
    <DemoCard
      title="Extending a component's own props"
      claim="ComponentProps<typeof X> gives your wrapper every prop X accepts, for free and forever — including ones added in future versions of the library."
      level="depth"
      notice={
        <ul className="mb-0">
          <li>
            <code>variant</code>, <code>size</code>, <code>disabled</code>,
            <code>onClick</code>, <code>aria-label</code>, <code>href</code> — none are
            declared in <code>IconButtonProps</code>, and all work with full autocomplete.
          </li>
          <li>
            <code>className</code> is destructured out and merged rather than spread, so
            the caller's classes are added to the wrapper's instead of replacing them.
          </li>
          <li>
            The last button passes <code>as="a"</code> and <code>href</code>. It renders an
            anchor — that's react-bootstrap's polymorphic <code>as</code> prop, and it type-checks
            because we inherited it.
          </li>
        </ul>
      }
    >
      <Stack direction="horizontal" gap={2} className="flex-wrap">
        <IconButton icon={<Download size={15} />} variant="primary">
          Export
        </IconButton>

        <IconButton icon={<Trash size={15} />} variant="outline-danger" size="sm">
          Delete
        </IconButton>

        <IconButton
          icon={<ArrowRepeat size={15} />}
          iconPosition="end"
          variant="secondary"
          disabled
          aria-label="Retry the failed sync"
        >
          Retry
        </IconButton>

        <IconButton
          icon={<Download size={15} />}
          as="a"
          href="https://react.dev"
          target="_blank"
          rel="noreferrer"
          variant="link"
          className="fw-semibold"
        >
          Renders an anchor
        </IconButton>
      </Stack>
    </DemoCard>
  )
}
```

Register as `{ id: "native-props", chapter: "3 — Props", title: "Extending native props", element: <NativePropsLab /> }`.

**Experiments:**

1. Replace `...rest` with nothing (drop the spread). Every inherited prop stops working while still type-checking — a wrapper that accepts props and silently discards them. Always spread what you inherit.
2. Move `className={...}` to *after* `{...rest}`. Now the caller's `className` is ignored, because the later attribute wins. This ordering bug is easy to make and hard to spot.
3. Change the interface to `extends ComponentProps<"button">`. `variant` and `size` immediately error — those are react-bootstrap's props, not the DOM's. Being precise about *whose* props you're extending matters.

---

## 🧪 Lab 3.4 — Discriminated union props

**Level:** depth

Create `src/demos/03-props/UnionPropsLab.tsx`:

```tsx
import { useState } from "react"
import { Alert, Button, ButtonGroup, Spinner, Stack } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"

// Each variant carries exactly the props it needs — and no others.
type NoticeProps =
  | { kind: "idle" }
  | { kind: "loading"; label?: string }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string; onRetry: () => void }

function Notice(props: NoticeProps) {
  switch (props.kind) {
    case "idle":
      return <div className="text-muted small">Nothing to report.</div>

    case "loading":
      return (
        <div className="d-flex align-items-center gap-2 text-muted small">
          <Spinner animation="border" size="sm" />
          {props.label ?? "Working…"}
        </div>
      )

    case "success":
      // props.message exists; props.onRetry does not, and referencing it won't compile
      return <Alert variant="success" className="mb-0">{props.message}</Alert>

    case "error":
      // props.onRetry is guaranteed here — no optional chaining, no runtime check
      return (
        <Alert variant="danger" className="mb-0 d-flex justify-content-between align-items-center gap-3">
          <span>{props.message}</span>
          <Button size="sm" variant="outline-danger" onClick={props.onRetry}>
            Retry
          </Button>
        </Alert>
      )
  }
  // No default needed: TypeScript knows every case returns.
}

export default function UnionPropsLab() {
  const [state, setState] = useState<NoticeProps>({ kind: "idle" })
  const [retries, setRetries] = useState(0)

  return (
    <DemoCard
      title="Discriminated union props"
      claim="When one prop changes which other props are required, model it as a union of shapes. Invalid combinations then cannot be written at all."
      level="depth"
      notice={
        <ul className="mb-0">
          <li>
            Inside <code>case "error"</code>, <code>props.onRetry</code> is a required
            function — no <code>?.</code>, no runtime guard, no "it should always be there".
          </li>
          <li>
            Inside <code>case "success"</code>, typing <code>props.onRetry</code> is a
            compile error. The type only exposes what that variant actually has.
          </li>
          <li>
            The <code>switch</code> has no <code>default</code> and TypeScript still accepts
            it, because the union is exhausted. Add a fifth variant and it stops compiling
            — which is precisely the reminder you want.
          </li>
          <li>
            Compare with <code>{"{ kind: string; message?: string; onRetry?: () => void }"}</code>,
            where <code>{'<Notice kind="success" onRetry={fn} />'}</code> compiles and means
            nothing.
          </li>
        </ul>
      }
    >
      <Stack gap={3}>
        <ButtonGroup>
          <Button variant="outline-secondary" onClick={() => setState({ kind: "idle" })}>
            idle
          </Button>
          <Button
            variant="outline-secondary"
            onClick={() => setState({ kind: "loading", label: "Syncing tasks…" })}
          >
            loading
          </Button>
          <Button
            variant="outline-success"
            onClick={() => setState({ kind: "success", message: "12 tasks synced." })}
          >
            success
          </Button>
          <Button
            variant="outline-danger"
            onClick={() =>
              setState({
                kind: "error",
                message: "Sync failed — the server returned 503.",
                onRetry: () => setRetries((n) => n + 1),
              })
            }
          >
            error
          </Button>
        </ButtonGroup>

        <div className="border rounded-3 p-3 bg-white" style={{ minHeight: 72 }}>
          <Notice {...state} />
        </div>

        <div className="small text-muted">
          Retry pressed <strong>{retries}</strong> time{retries === 1 ? "" : "s"} — proof the
          callback the error variant demanded is a real one.
        </div>
      </Stack>
    </DemoCard>
  )
}
```

Register as `{ id: "union-props", chapter: "3 — Props", title: "Discriminated union props", element: <UnionPropsLab /> }`.

**Experiments:**

1. In `case "success"`, add `{props.onRetry}`. Read the error: the property doesn't exist on that member of the union. **This is narrowing doing your reasoning for you.**
2. Add `| { kind: "warning"; message: string }` to the union and don't add a case. The function now errors because it can return `undefined` where `ReactNode`… actually read the exact message, then add the case. This is exhaustiveness checking, and §13 formalises it with a `never` assertion.
3. Try `setState({ kind: "error", message: "x" })` — missing `onRetry`, rejected. The union protects the *producer* as well as the consumer.

---

## 🧪 Lab 3.5 — Data down, events up

**Level:** core

Create `src/demos/03-props/DataDownEventsUp.tsx`:

```tsx
import { useState } from "react"
import { Badge, Button, Card, Col, ListGroup, Row } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import StateInspector from "@/lab/StateInspector"

interface Member {
  id: string
  name: string
  votes: number
}

// ---------- child: knows nothing about how votes are stored ----------

interface MemberRowProps {
  member: Member
  isLeader: boolean
  onVote: (id: string) => void
  onRemove: (id: string) => void
}

function MemberRow({ member, isLeader, onVote, onRemove }: MemberRowProps) {
  return (
    <ListGroup.Item className="d-flex align-items-center gap-3">
      <span className="flex-grow-1">
        {member.name}
        {isLeader && (
          <Badge bg="warning" text="dark" className="ms-2">
            leading
          </Badge>
        )}
      </span>
      <Badge bg="secondary">{member.votes}</Badge>
      <Button size="sm" variant="outline-primary" onClick={() => onVote(member.id)}>
        Vote
      </Button>
      <Button size="sm" variant="outline-danger" onClick={() => onRemove(member.id)}>
        Remove
      </Button>
    </ListGroup.Item>
  )
}

// ---------- parent: owns the data and every decision about it ----------

export default function DataDownEventsUp() {
  const [members, setMembers] = useState<Member[]>([
    { id: "a", name: "Ada Lovelace", votes: 2 },
    { id: "b", name: "Grace Hopper", votes: 5 },
    { id: "c", name: "Alan Turing", votes: 3 },
  ])

  const topVotes = Math.max(0, ...members.map((m) => m.votes))

  function handleVote(id: string) {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, votes: m.votes + 1 } : m))
    )
  }

  function handleRemove(id: string) {
    setMembers((prev) => prev.filter((m) => m.id !== id))
  }

  return (
    <DemoCard
      title="Data down, events up"
      claim="The child receives values and reports intent. It never owns, mutates, or even knows the shape of the parent's state."
      level="core"
      notice={
        <ul className="mb-0">
          <li>
            <code>MemberRow</code> receives one <code>Member</code> and two callbacks. It
            has no idea the parent holds an array, uses <code>useState</code>, or computes a
            leader.
          </li>
          <li>
            The callbacks are named for <em>what happened</em> (<code>onVote</code>), not
            for <em>what to do</em> (<code>onSetMembersArray</code>). That's what keeps the
            child reusable.
          </li>
          <li>
            <code>isLeader</code> is computed in the parent and passed down as a plain
            boolean. Derived data flows down like any other prop — §10.
          </li>
          <li>
            Remove every member. The list empties and <code>topVotes</code> becomes
            <code>0</code> with no extra code, because everything on screen is a function
            of one array.
          </li>
        </ul>
      }
    >
      <Row className="g-3">
        <Col lg={7}>
          <Card>
            <Card.Header className="fw-semibold small">Children</Card.Header>
            <ListGroup variant="flush">
              {members.length === 0 ? (
                <ListGroup.Item className="text-muted small">
                  Everyone's gone. The empty state is just another render of the same data.
                </ListGroup.Item>
              ) : (
                members.map((member) => (
                  <MemberRow
                    key={member.id}
                    member={member}
                    isLeader={member.votes === topVotes && topVotes > 0}
                    onVote={handleVote}
                    onRemove={handleRemove}
                  />
                ))
              )}
            </ListGroup>
          </Card>
        </Col>

        <Col lg={5}>
          <div className="small fw-semibold text-muted mb-2">
            Parent state — the single source of truth
          </div>
          <StateInspector label="members" value={members} />
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "data-down", chapter: "3 — Props", title: "Data down, events up", element: <DataDownEventsUp /> }`.

**Experiments:**

1. In `MemberRow`, try `member.votes += 1` instead of calling `onVote`. Nothing happens on screen — you mutated the parent's object and React never learned about it. Now click Vote on a *different* row and the mutated value suddenly appears, because that render finally happened. **A mutation bug shows up at the wrong time and in the wrong place**, which is why the rule is absolute.
2. Add `readonly` to `member: Readonly<Member>` in the props interface. The mutation above becomes a compile error. Consider doing this by default on a team.
3. Change `onVote: (id: string) => void` to `onVote: (member: Member) => void` and update both sides. Both work — but the `id` version means the child needs less, which usually makes the better boundary.

✅ **Concept check 3**

1. How many arguments does React pass to your component function?
2. Why is mutating a prop worse than merely being bad style — what's the actual failure?
3. When should a value be a prop, and when should it be `children`?
4. What does `ComponentProps<typeof Button>` give you, and why destructure `className` out before spreading `...rest`?
5. Name a case where a discriminated union of props beats optional props.

---

# 4. Rendering lists & keys

You render a list by mapping an array to an array of elements. React renders arrays of elements by rendering each item in order.

```tsx
interface TaskListProps {
  tasks: Task[]
}

function TaskList({ tasks }: TaskListProps) {
  return (
    <ul className="list-unstyled">
      {tasks.map((task) => (
        <li key={task.id}>{task.title}</li>
      ))}
    </ul>
  )
}
```

TypeScript infers `task` as `Task` inside `map` — no annotation needed, and you get autocomplete on `task.`. This is inference at its most pleasant: annotate the array once and every downstream callback is typed.

`map` and not `forEach`: `map` returns the new array, `forEach` returns `undefined`. Forgetting the `return` in a block-bodied arrow is the same mistake in a different costume:

```tsx
{tasks.map((task) => { <li>{task.title}</li> })}      // ❌ returns undefined — renders nothing
{tasks.map((task) => { return <li>{task.title}</li> })} // ✅
{tasks.map((task) => <li>{task.title}</li>)}            // ✅ concise body, implicit return
```

Nothing appearing on the page with no error in the console is almost always this.

## 4.1 Why keys matter

React uses `key` to match elements between renders and decide what to reuse, move, or destroy. Recall the reconciliation rules from §1.3: **same type and same key in the same position → reuse the DOM node and its state. Different key → destroy and recreate.**

Without a key, React falls back on **position** — and position lies whenever the list is reordered, filtered, or has items inserted anywhere but the end.

**Use a stable ID from the data:**

```tsx
{tasks.map((t) => <TaskCard key={t.id} task={t} />)}   // ✅
```

**Avoid the array index** unless the list is genuinely static — never reordered, never filtered, never added to except at the end:

```tsx
{tasks.map((t, i) => <TaskCard key={i} task={t} />)}   // ⚠️ bug source
```

The failure is specific and worth internalising: with index keys, delete the *first* item from a list of inputs and the typed *text* stays put while the *data* shifts up, because React reused the DOM node it believed was in the same position. It manifests as "my checkbox ticked the wrong row" or "the text in row 2 is now next to row 3's label". Lab 4.1 makes this happen on demand.

**Never generate a key during render:**

```tsx
{tasks.map((t) => <TaskCard key={crypto.randomUUID()} task={t} />)}   // ❌ catastrophic
{tasks.map((t) => <TaskCard key={Math.random()} task={t} />)}          // ❌ same
```

A fresh key every render means *every item is destroyed and recreated on every render*. You lose focus, lose scroll, lose animations, and destroy performance — while looking like you did the responsible thing. If your data genuinely has no ID, assign one when the item is **created**, not when it's rendered.

## 4.2 Key rules, precisely

- Keys go on the **outermost element inside `map`** — the element `map` returns, not a child of it.
- Keys must be unique **among siblings**, not globally. Two different lists can both use `key="1"`.
- Keys must be **stable** across renders for the same logical item.
- Keys are **not passed to your component.** `props.key` is undefined inside `TaskCard`; if you need the id, pass it separately as `id={t.id}`.
- Composite keys are fine when no single field is unique: `key={`${row}-${col}`}`.
- The `key` belongs on the item, not on the map: `<>{items.map(...)}</>` needs no key on the fragment.

```tsx
// ❌ key on an inner element — React sees keyless children
{tasks.map((t) => (
  <div>
    <TaskCard key={t.id} task={t} />
  </div>
))}

// ✅ key on the returned element
{tasks.map((t) => (
  <div key={t.id}>
    <TaskCard task={t} />
  </div>
))}
```

## 4.3 `key` as a deliberate reset

Because a changed key destroys and recreates the component, you can use it *on purpose* to reset state:

```tsx
// Every time selectedUserId changes, ProfileForm remounts with fresh state
<ProfileForm key={selectedUserId} userId={selectedUserId} />
```

This is the idiomatic answer to "how do I reset this form when the selected item changes?", and it is much better than the `useEffect` that syncs props into state. §11's "you might not need an effect" table lists it for that reason. Lab 4.2 demonstrates both halves.

## 4.4 Rendering lists in practice

A few patterns you'll use constantly:

```tsx
// Index as data, not as key — perfectly fine
{tasks.map((task, i) => <Row key={task.id} rank={i + 1} task={task} />)}

// Sorting: copy before sorting, because sort mutates
const sorted = [...tasks].sort((a, b) => b.createdAt - a.createdAt)

// Grouping: a Record built with reduce, then two nested maps
const byPriority = tasks.reduce<Record<Priority, Task[]>>(
  (acc, task) => { acc[task.priority].push(task); return acc },
  { high: [], medium: [], low: [] }
)

// Separators without a wrapper element
{tasks.map((task, i) => (
  <Fragment key={task.id}>
    {i > 0 && <hr className="my-2" />}
    <TaskCard task={task} />
  </Fragment>
))}
```

`[...tasks].sort(...)` rather than `tasks.sort(...)` because `Array.prototype.sort` mutates in place — and if `tasks` is state or a prop, that's the mutation bug from §3.5 with extra steps. (Modern runtimes also offer `tasks.toSorted(...)`, which returns a copy; check your browser targets.)

---

## 🧪 Lab 4.1 — The index-key bug, on demand

**Level:** core — **do not skip this one**

This is the most valuable ten minutes in §4. The bug is famous, subtle, and completely obvious once you've watched it happen.

Create `src/demos/04-lists/KeyLab.tsx`:

```tsx
import { useState } from "react"
import { Alert, Button, Card, Col, Form, Row, Stack } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"

interface Row {
  id: string
  label: string
}

const initialRows: Row[] = [
  { id: "r1", label: "Row A" },
  { id: "r2", label: "Row B" },
  { id: "r3", label: "Row C" },
  { id: "r4", label: "Row D" },
]

/**
 * The input is UNCONTROLLED (defaultValue, no value prop), so whatever you
 * type lives in the DOM node itself — not in React state. That makes it a
 * perfect probe for "did React reuse this DOM node or create a new one?"
 */
function ProbeRow({ label }: { label: string }) {
  return (
    <div className="d-flex align-items-center gap-2 mb-2">
      <span className="badge bg-secondary" style={{ width: 64 }}>
        {label}
      </span>
      <Form.Control
        size="sm"
        defaultValue={`typed in ${label}`}
        aria-label={`Note for ${label}`}
      />
    </div>
  )
}

export default function KeyLab() {
  const [rows, setRows] = useState<Row[]>(initialRows)
  const [useIndexKeys, setUseIndexKeys] = useState(true)

  function removeFirst() {
    setRows((prev) => prev.slice(1))
  }

  function prependRow() {
    setRows((prev) => [
      { id: crypto.randomUUID(), label: `Row ${prev.length + 1}` },
      ...prev,
    ])
  }

  function reset() {
    setRows(initialRows)
  }

  return (
    <DemoCard
      title="The index-key bug"
      claim="With index keys, removing the first item makes React reuse DOM nodes for the wrong data. Text and other DOM state end up beside the wrong label."
      level="core"
      notice={
        <ul className="mb-0">
          <li>
            <strong>With index keys (default):</strong> click <em>Remove first row</em>.
            The labels shift up correctly, but the text boxes <em>don't move</em> — Row B is
            now sitting next to "typed in Row A". React matched by position, and position
            changed meaning.
          </li>
          <li>
            <strong>Switch to id keys</strong> and reset. Remove the first row again. Each
            box travels with its label, because the key identifies the <em>item</em>, not
            the slot.
          </li>
          <li>
            <em>Prepend a row</em> is the same bug from the other direction, and it's the
            one that hits real apps — "add to top of list" is a very common feature.
          </li>
          <li>
            Nothing about this is specific to inputs. Focus, scroll position, CSS
            transitions, media playback and any component state behave the same way.
          </li>
        </ul>
      }
    >
      <Stack gap={3}>
        <Alert variant={useIndexKeys ? "danger" : "success"} className="mb-0">
          <Form.Check
            type="switch"
            id="key-mode"
            checked={useIndexKeys}
            onChange={(e) => setUseIndexKeys(e.target.checked)}
            label={
              useIndexKeys ? (
                <span>
                  Using <code>key={"{index}"}</code> — the buggy version
                </span>
              ) : (
                <span>
                  Using <code>key={"{row.id}"}</code> — the correct version
                </span>
              )
            }
          />
        </Alert>

        <div className="d-flex flex-wrap gap-2">
          <Button variant="outline-danger" onClick={removeFirst} disabled={rows.length === 0}>
            Remove first row
          </Button>
          <Button variant="outline-primary" onClick={prependRow}>
            Prepend a row
          </Button>
          <Button variant="outline-secondary" onClick={reset}>
            Reset
          </Button>
        </div>

        <Row className="g-3">
          <Col md={7}>
            <Card>
              <Card.Header className="small fw-semibold">
                Rendered list — type into the boxes first
              </Card.Header>
              <Card.Body>
                {rows.length === 0 ? (
                  <p className="text-muted small mb-0">All rows removed. Hit Reset.</p>
                ) : (
                  rows.map((row, index) => (
                    <ProbeRow
                      key={useIndexKeys ? index : row.id}
                      label={row.label}
                    />
                  ))
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col md={5}>
            <Card className="h-100">
              <Card.Header className="small fw-semibold">Keys React is seeing</Card.Header>
              <Card.Body className="small font-monospace">
                {rows.map((row, index) => (
                  <div key={row.id}>
                    {row.label} → key <strong>{useIndexKeys ? index : row.id}</strong>
                  </div>
                ))}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Stack>
    </DemoCard>
  )
}
```

Register as `{ id: "keys", chapter: "4 — Lists & keys", title: "The index-key bug", element: <KeyLab /> }`.

**Do it in this exact order** or the effect is easy to miss:

1. Leave the switch on index keys. Edit the text in each box so you can tell them apart — append your initials to each.
2. Click **Remove first row**. Look carefully: the badges say B, C, D but the text still says "typed in Row A/B/C". The DOM nodes stayed; only the labels re-rendered.
3. Click **Reset**, flip to id keys, edit the boxes again, and remove the first row. Now everything travels together.
4. Reset, index keys, and click **Prepend a row**. The new row appears at the top with *the old first row's text*, because index 0 was reused.

**Experiments:**

1. Change `ProbeRow` to use a controlled input (`value` + `onChange`, state in the parent keyed by id). The bug disappears even with index keys — because now the value comes from React state keyed by id, not from the DOM. That's a real mitigation, and also why this bug is *intermittent* in real codebases: it only bites where DOM or component state exists.
2. Add `key={crypto.randomUUID()}` as a third mode. Every keystroke destroys and recreates every row — you can't even type, because the input loses focus immediately. This is why generating keys during render is worse than index keys.
3. Remove the `key` entirely. Note the console warning names the component and tells you exactly what to do. React's warnings on this are unusually good.

---

## 🧪 Lab 4.2 — `key` as a reset switch

**Level:** depth

Create `src/demos/04-lists/KeyResetLab.tsx`:

```tsx
import { useState } from "react"
import { Button, ButtonGroup, Card, Col, Form, Row } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import RenderBadge from "@/lab/RenderBadge"

const users = [
  { id: "u1", name: "Ada Lovelace", role: "Engineer" },
  { id: "u2", name: "Grace Hopper", role: "Admiral" },
  { id: "u3", name: "Alan Turing", role: "Researcher" },
]

interface ProfileFormProps {
  name: string
  role: string
}

/** Local draft state, seeded from props on mount. */
function ProfileForm({ name, role }: ProfileFormProps) {
  const [draftName, setDraftName] = useState(name)
  const [draftRole, setDraftRole] = useState(role)

  return (
    <Card body>
      <div className="d-flex justify-content-between mb-3">
        <span className="small fw-semibold text-muted">Editing profile</span>
        <RenderBadge label="form" />
      </div>
      <Form.Group className="mb-2">
        <Form.Label className="small">Name</Form.Label>
        <Form.Control value={draftName} onChange={(e) => setDraftName(e.target.value)} />
      </Form.Group>
      <Form.Group>
        <Form.Label className="small">Role</Form.Label>
        <Form.Control value={draftRole} onChange={(e) => setDraftRole(e.target.value)} />
      </Form.Group>
      <p className="small text-muted mt-3 mb-0">
        Props say <code>{name}</code> / <code>{role}</code>.
      </p>
    </Card>
  )
}

export default function KeyResetLab() {
  const [selectedId, setSelectedId] = useState("u1")
  const selected = users.find((u) => u.id === selectedId)!

  return (
    <DemoCard
      title="key as a reset switch"
      claim="Changing a component's key destroys and remounts it, resetting all its state. That's the idiomatic way to reset a form when the selected item changes."
      level="depth"
      notice={
        <ul className="mb-0">
          <li>
            Edit the name in the <strong>left</strong> form, then switch users. Your edit
            stays — the component was reused, so its state persisted, and now it shows one
            user's draft with another user's props. A real, common bug.
          </li>
          <li>
            Do the same on the <strong>right</strong>. Switching users wipes the draft,
            because <code>key={"{selectedId}"}</code> made React unmount the old component
            and mount a new one.
          </li>
          <li>
            Watch the render badges: the left one keeps climbing (same instance); the right
            one resets to its mount value each time (new instance).
          </li>
          <li>
            The alternative — a <code>useEffect</code> that copies props into state — needs
            more code, renders twice, and is easy to get wrong. Prefer the key.
          </li>
        </ul>
      }
    >
      <ButtonGroup className="mb-3">
        {users.map((user) => (
          <Button
            key={user.id}
            variant={user.id === selectedId ? "primary" : "outline-primary"}
            onClick={() => setSelectedId(user.id)}
          >
            {user.name}
          </Button>
        ))}
      </ButtonGroup>

      <Row className="g-3">
        <Col md={6}>
          <div className="small fw-semibold text-danger mb-2">
            No key — state survives the switch (wrong)
          </div>
          <ProfileForm name={selected.name} role={selected.role} />
        </Col>
        <Col md={6}>
          <div className="small fw-semibold text-success mb-2">
            <code>key={"{selectedId}"}</code> — state resets (right)
          </div>
          <ProfileForm key={selectedId} name={selected.name} role={selected.role} />
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "key-reset", chapter: "4 — Lists & keys", title: "key as a reset switch", element: <KeyResetLab /> }`.

**Experiments:**

1. Open React DevTools → Components, select the right-hand `ProfileForm`, and switch users. The selection is lost because the component instance genuinely no longer exists. On the left it stays selected. That's unmount versus re-render, visible in a tool.
2. Add `key={selected.role}` instead. Switching between two users with the same role no longer resets — the key must identify what you want to reset *on*.
3. Try the effect-based alternative in the left form: `useEffect(() => { setDraftName(name) }, [name])`. It works, but add a `console.log` in the render and count: two renders per switch instead of one, and you now have two sources of truth for the name. Then delete it.

---

## 🧪 Lab 4.3 — Grouping, sorting, and nested lists

**Level:** optional

Create `src/demos/04-lists/GroupedListLab.tsx`:

```tsx
import { Fragment, useState } from "react"
import { Badge, Button, ButtonGroup, Card, Table } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"

type Priority = "high" | "medium" | "low"

interface Task {
  id: string
  title: string
  priority: Priority
  createdAt: number
}

const tasks: Task[] = [
  { id: "t1", title: "Fix the login redirect", priority: "high", createdAt: 5 },
  { id: "t2", title: "Update the changelog", priority: "low", createdAt: 2 },
  { id: "t3", title: "Add rate limiting", priority: "high", createdAt: 8 },
  { id: "t4", title: "Refactor the toolbar", priority: "medium", createdAt: 1 },
  { id: "t5", title: "Write the migration guide", priority: "medium", createdAt: 9 },
  { id: "t6", title: "Tidy the seed data", priority: "low", createdAt: 4 },
]

const priorityOrder: Priority[] = ["high", "medium", "low"]
const priorityBg = { high: "danger", medium: "primary", low: "secondary" } as const

type SortKey = "createdAt" | "title"

export default function GroupedListLab() {
  const [sortKey, setSortKey] = useState<SortKey>("createdAt")

  // Copy before sorting — sort mutates in place.
  const sorted = [...tasks].sort((a, b) =>
    sortKey === "title" ? a.title.localeCompare(b.title) : b.createdAt - a.createdAt
  )

  // Group into a Record. The initial value names every key, so the Record is complete.
  const grouped = sorted.reduce<Record<Priority, Task[]>>(
    (acc, task) => {
      acc[task.priority].push(task)
      return acc
    },
    { high: [], medium: [], low: [] }
  )

  return (
    <DemoCard
      title="Grouping, sorting and nested lists"
      claim="Two nested maps, keys unique among siblings only, and a reduce into a fully-typed Record."
      level="optional"
      notice={
        <ul className="mb-0">
          <li>
            The outer map keys on priority, the inner on task id. Keys only need to be
            unique <em>among siblings</em>, so there's no need to combine them.
          </li>
          <li>
            <code>reduce&lt;Record&lt;Priority, Task[]&gt;&gt;</code> — the explicit generic
            is what makes <code>acc[task.priority].push()</code> safe. Without it,
            TypeScript infers the accumulator from the initial value and you lose the
            guarantee that every priority has an array.
          </li>
          <li>
            <code>[...tasks].sort()</code>, never <code>tasks.sort()</code>. Sorting a prop
            or state array in place is a mutation bug.
          </li>
          <li>
            The group header row uses <code>&lt;Fragment key&gt;</code> so no wrapper
            element breaks the table structure.
          </li>
        </ul>
      }
    >
      <ButtonGroup size="sm" className="mb-3">
        <Button
          variant={sortKey === "createdAt" ? "dark" : "outline-dark"}
          onClick={() => setSortKey("createdAt")}
        >
          Newest first
        </Button>
        <Button
          variant={sortKey === "title" ? "dark" : "outline-dark"}
          onClick={() => setSortKey("title")}
        >
          By title
        </Button>
      </ButtonGroup>

      <Card>
        <Table hover className="mb-0 align-middle">
          <thead className="table-light">
            <tr>
              <th>Task</th>
              <th style={{ width: 120 }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {priorityOrder.map((priority) => (
              <Fragment key={priority}>
                <tr className="table-light">
                  <td colSpan={2}>
                    <Badge bg={priorityBg[priority]}>{priority}</Badge>
                    <span className="text-muted small ms-2">
                      {grouped[priority].length} task
                      {grouped[priority].length === 1 ? "" : "s"}
                    </span>
                  </td>
                </tr>
                {grouped[priority].map((task) => (
                  <tr key={task.id}>
                    <td>{task.title}</td>
                    <td className="text-muted small">day {task.createdAt}</td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </Table>
      </Card>
    </DemoCard>
  )
}
```

Register as `{ id: "grouped-list", chapter: "4 — Lists & keys", title: "Grouping & sorting", element: <GroupedListLab /> }`.

**Experiments:**

1. Remove the `<Record<Priority, Task[]>>` generic from `reduce`. TypeScript now infers the accumulator type from the initial object — which happens to work here, but add a `"critical"` priority to the data without adding it to the initial value and `acc[task.priority]` is `undefined` at runtime with no compile error. Put the generic back and the same change becomes a compile error.
2. Change `[...tasks].sort(...)` to `tasks.sort(...)`. Switch sort modes a few times. `tasks` is a module constant here so it "works", but you've permanently reordered the source data — check by logging it. In a real app that array is state or props.
3. Replace `<Fragment key={priority}>` with `<tbody key={priority}>`. It's actually valid HTML (multiple tbodies are allowed) and arguably better. Note that the fragment exists to avoid a wrapper, not because wrappers are always wrong.

✅ **Concept check 4**

1. What does React do when it finds the same key in the same position across two renders? What about a different key?
2. Why is `key={index}` safe for a static list but dangerous for one you can prepend to?
3. Why is `key={crypto.randomUUID()}` worse than `key={index}`?
4. Can you read `props.key` inside a component?
5. Name the idiomatic way to reset a child's state when a selection changes.

---

# 5. Conditional rendering

Four idioms, each with a natural use. Knowing which to reach for is mostly a readability skill, but the last one prevents real bugs.

```tsx
// 1. Ternary — either/or, both branches render something
{isLoading ? <Spinner animation="border" /> : <TaskList tasks={tasks} />}

// 2. && — render or nothing
{error && <Alert variant="danger">{error}</Alert>}

// 3. Early return — cleanest for guard clauses
function TaskList({ tasks }: TaskListProps) {
  if (tasks.length === 0) return <EmptyState />
  return <div>{tasks.map(/* ... */)}</div>
}

// 4. Lookup object — instead of a switch, when a value maps to a view
const views: Record<ViewMode, ReactNode> = { list: <ListView />, board: <BoardView /> }
return views[mode]
```

## 5.1 Choosing between them

| Situation | Reach for |
|---|---|
| Two alternatives, both visible things | Ternary |
| One thing that's sometimes absent | `&&` |
| A precondition that makes the rest of the function meaningless | Early return |
| Three or more mutually exclusive views selected by a union | Lookup object, or a `switch` in a sub-component |
| Nested conditions | Extract a component. Always. |

That last row is the one that matters most in real code. Nested ternaries inside JSX are the single most common source of unreadable React:

```tsx
// ❌ nobody can read this in six months
{isLoading ? <Spinner /> : error ? <Alert>{error}</Alert> : tasks.length === 0 ? <Empty /> : <List tasks={tasks} />}

// ✅ same logic, as a component with guard clauses
function TaskListSection({ isLoading, error, tasks }: Props) {
  if (isLoading) return <Spinner animation="border" />
  if (error) return <Alert variant="danger">{error}</Alert>
  if (tasks.length === 0) return <EmptyState />
  return <List tasks={tasks} />
}
```

Guard clauses read top-to-bottom as a list of cases, they're trivially reorderable, and each one can grow without touching the others.

## 5.2 The `&&` trap, once more

Watch the `&&` operator with numbers, as covered in §2.3: `{count && <X />}` renders `0` when count is zero. Force a boolean — `{count > 0 && <X />}` — or use a ternary with `null`.

There's a second, subtler variant involving optional chaining:

```tsx
{user?.tasks.length && <Badge>{user.tasks.length}</Badge>}
```

When `user` is `undefined`, the expression is `undefined` — renders nothing, fine. When `tasks.length` is `0`, it renders `0`. Same bug, better hidden.

## 5.3 Model state so impossible states can't render

This is the idea that turns conditional rendering from a chore into design. Consider the standard four booleans:

```tsx
const [isLoading, setIsLoading] = useState(false)
const [isError, setIsError] = useState(false)
const [isEmpty, setIsEmpty] = useState(false)
const [tasks, setTasks] = useState<Task[]>([])
```

Four booleans give sixteen combinations. Exactly four are meaningful. The other twelve — loading *and* error, error *and* success, all four true — are reachable by any code path that forgets to reset one, and your JSX has to defend against every one of them. This is why loading spinners get stuck on top of error messages in real applications.

Replace them with a single discriminated union:

```tsx
type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; tasks: Task[] }

const [state, setState] = useState<LoadState>({ status: "idle" })
```

Now there are exactly four states, the data that belongs to each state lives *inside* that state, and TypeScript won't let you read `state.tasks` unless you've narrowed to `"success"`. The rendering becomes a total function of one value:

```tsx
switch (state.status) {
  case "idle":    return <Placeholder />
  case "loading": return <Spinner animation="border" />
  case "error":   return <Alert variant="danger">{state.message}</Alert>
  case "success": return <List tasks={state.tasks} />
}
```

No combination of flags to reason about, no stale `isLoading` left over from the last request, and adding a `"refreshing"` state means the compiler shows you every place to handle it. §13 and §17 both build on this; Lab 5.2 is where it clicks.

## 5.4 Empty states are part of the UI

**A list that renders nothing when empty looks broken.** Design the zero case deliberately, and distinguish the two kinds:

- **"Nothing exists yet"** → onboarding. Explain what this screen is for and offer the action that creates the first item.
- **"Nothing matches your filter"** → recovery. Say what was searched for and offer a way to clear the filter.

They're different messages and different buttons, and shipping only one of them is a common polish failure.

---

## 🧪 Lab 5.1 — The four idioms

**Level:** core

Create `src/demos/05-conditional/FourIdioms.tsx`:

```tsx
import { useState, type ReactNode } from "react"
import { Alert, Badge, Button, ButtonGroup, Card, Col, Form, Row, Spinner } from "react-bootstrap"
import { Grid3x3Gap, ListUl, Table as TableIcon } from "react-bootstrap-icons"
import DemoCard from "@/lab/DemoCard"

type ViewMode = "list" | "grid" | "table"

const viewIcons = {
  list: <ListUl size={14} />,
  grid: <Grid3x3Gap size={14} />,
  table: <TableIcon size={14} />,
} satisfies Record<ViewMode, ReactNode>

const viewBodies = {
  list: <div className="text-muted small">One item per row, full width.</div>,
  grid: <div className="text-muted small">Cards in a responsive grid.</div>,
  table: <div className="text-muted small">Dense rows with sortable columns.</div>,
} satisfies Record<ViewMode, ReactNode>

/** Idiom 3: guard clauses. Each precondition returns early. */
function GuardedSection({
  isLoading,
  error,
  itemCount,
}: {
  isLoading: boolean
  error: string
  itemCount: number
}) {
  if (isLoading) {
    return (
      <div className="d-flex align-items-center gap-2 text-muted small">
        <Spinner animation="border" size="sm" /> Loading tasks…
      </div>
    )
  }
  if (error) {
    return <Alert variant="danger" className="mb-0 py-2 small">{error}</Alert>
  }
  if (itemCount === 0) {
    return (
      <div className="text-center text-muted small py-3 border border-2 border-dashed rounded-3">
        <div className="fw-semibold text-body">No tasks yet</div>
        Add your first task to get started.
      </div>
    )
  }
  return <div className="small">Showing {itemCount} tasks.</div>
}

export default function FourIdioms() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [itemCount, setItemCount] = useState(3)
  const [view, setView] = useState<ViewMode>("list")

  return (
    <DemoCard
      title="The four conditional idioms"
      claim="Ternary for either/or, && for optional, early return for guards, lookup object for a union of views. Nested ternaries for nothing at all."
      level="core"
      notice={
        <ul className="mb-0">
          <li>
            Toggle the switches and watch which card changes. All four panels read the same
            three pieces of state and express the same logic differently.
          </li>
          <li>
            The <strong>guard clause</strong> version scales best: adding a fourth case is
            one more <code>if</code> at the top, with no re-indentation and no re-reading of
            the others.
          </li>
          <li>
            The <strong>lookup object</strong> version has no conditional logic at all — the
            union type <em>is</em> the condition, and <code>satisfies</code> guarantees every
            member has an entry.
          </li>
          <li>
            Set item count to <strong>0</strong> and look at the <code>&&</code> card: it
            prints a bare <code>0</code>. Same trap as §2, in its natural habitat.
          </li>
        </ul>
      }
    >
      <div className="d-flex flex-wrap gap-3 align-items-center mb-3 p-3 border rounded-3 bg-white">
        <Form.Check
          type="switch"
          label="isLoading"
          checked={isLoading}
          onChange={(e) => setIsLoading(e.target.checked)}
        />
        <Form.Check
          type="switch"
          label="has error"
          checked={Boolean(error)}
          onChange={(e) => setError(e.target.checked ? "Request failed: 503" : "")}
        />
        <div className="d-flex align-items-center gap-2">
          <span className="small">itemCount</span>
          <ButtonGroup size="sm">
            {[0, 1, 3].map((n) => (
              <Button
                key={n}
                variant={itemCount === n ? "dark" : "outline-dark"}
                onClick={() => setItemCount(n)}
              >
                {n}
              </Button>
            ))}
          </ButtonGroup>
        </div>
      </div>

      <Row className="g-3">
        <Col md={6}>
          <Card className="h-100">
            <Card.Header className="small fw-semibold font-monospace">
              1. Ternary
            </Card.Header>
            <Card.Body style={{ minHeight: 96 }}>
              {isLoading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <span className="small">{itemCount} tasks ready</span>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="h-100 border-warning-subtle">
            <Card.Header className="small fw-semibold font-monospace bg-warning-subtle">
              2. && — note the 0
            </Card.Header>
            <Card.Body style={{ minHeight: 96 }}>
              {error && <Alert variant="danger" className="py-1 px-2 small mb-2">{error}</Alert>}
              {itemCount && <Badge bg="secondary">{itemCount} items</Badge>}
              <div className="small text-muted mt-2">
                <code>{"{itemCount && <Badge/>}"}</code>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="h-100 border-success-subtle">
            <Card.Header className="small fw-semibold font-monospace bg-success-subtle">
              3. Early return (guard clauses)
            </Card.Header>
            <Card.Body style={{ minHeight: 96 }}>
              <GuardedSection isLoading={isLoading} error={error} itemCount={itemCount} />
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="h-100">
            <Card.Header className="small fw-semibold font-monospace">
              4. Lookup object
            </Card.Header>
            <Card.Body style={{ minHeight: 96 }}>
              <ButtonGroup size="sm" className="mb-2">
                {(Object.keys(viewIcons) as ViewMode[]).map((mode) => (
                  <Button
                    key={mode}
                    variant={view === mode ? "primary" : "outline-primary"}
                    onClick={() => setView(mode)}
                    className="d-inline-flex align-items-center gap-1"
                  >
                    {viewIcons[mode]} {mode}
                  </Button>
                ))}
              </ButtonGroup>
              {viewBodies[view]}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "four-idioms", chapter: "5 — Conditional", title: "The four idioms", element: <FourIdioms /> }`.

**Experiments:**

1. Set item count to 0 and confirm the stray `0` in the `&&` card. Fix it with `itemCount > 0 &&`.
2. `Object.keys` returns `string[]`, which is why that cast to `ViewMode[]` is there — a genuine gap in TypeScript's DOM of the world. Remove the cast and read the error. The tidier fix is to keep a `const viewModes = ["list","grid","table"] as const` array and map over that, as in Lab 0.1.
3. Set `isLoading` **and** `error` at the same time. The ternary card shows only the spinner and silently drops the error; the guard-clause card shows the spinner too, but the ordering of the guards is now a visible, deliberate decision in the code. Reorder the two `if`s and see the behaviour change — that's the readability win.

---

## 🧪 Lab 5.2 — Impossible states, made impossible

**Level:** depth — this is the section's payoff

Create `src/demos/05-conditional/StateMachineLab.tsx`:

```tsx
import { useState } from "react"
import { Alert, Badge, Button, ButtonGroup, Card, Col, Form, ListGroup, Row, Spinner } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import StateInspector from "@/lab/StateInspector"

interface Task {
  id: string
  title: string
}

const sampleTasks: Task[] = [
  { id: "t1", title: "Review the pull request" },
  { id: "t2", title: "Ship the hotfix" },
]

// ---------- A: four independent booleans ----------

function BooleanVersion({
  isLoading,
  isError,
  errorMessage,
  tasks,
}: {
  isLoading: boolean
  isError: boolean
  errorMessage: string
  tasks: Task[]
}) {
  return (
    <div>
      {isLoading && (
        <div className="d-flex align-items-center gap-2 small text-muted mb-2">
          <Spinner animation="border" size="sm" /> Loading…
        </div>
      )}
      {isError && (
        <Alert variant="danger" className="py-1 px-2 small mb-2">
          {errorMessage}
        </Alert>
      )}
      {!isLoading && !isError && tasks.length === 0 && (
        <div className="small text-muted">No tasks.</div>
      )}
      {tasks.length > 0 && (
        <ListGroup variant="flush">
          {tasks.map((t) => (
            <ListGroup.Item key={t.id} className="px-0 py-1 small">
              {t.title}
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </div>
  )
}

// ---------- B: one discriminated union ----------

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; tasks: Task[] }

function UnionVersion({ state }: { state: LoadState }) {
  switch (state.status) {
    case "idle":
      return <div className="small text-muted">Press load to begin.</div>
    case "loading":
      return (
        <div className="d-flex align-items-center gap-2 small text-muted">
          <Spinner animation="border" size="sm" /> Loading…
        </div>
      )
    case "error":
      // state.message is guaranteed. state.tasks doesn't exist here.
      return (
        <Alert variant="danger" className="py-1 px-2 small mb-0">
          {state.message}
        </Alert>
      )
    case "success":
      // state.tasks is guaranteed to be an array.
      return state.tasks.length === 0 ? (
        <div className="small text-muted">No tasks.</div>
      ) : (
        <ListGroup variant="flush">
          {state.tasks.map((t) => (
            <ListGroup.Item key={t.id} className="px-0 py-1 small">
              {t.title}
            </ListGroup.Item>
          ))}
        </ListGroup>
      )
  }
}

export default function StateMachineLab() {
  // Version A's four independent pieces of state
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("Request failed: 503")
  const [tasks, setTasks] = useState<Task[]>([])

  // Version B's single piece of state
  const [state, setState] = useState<LoadState>({ status: "idle" })

  return (
    <DemoCard
      title="Impossible states, made impossible"
      claim="Four booleans allow sixteen combinations, twelve of them nonsense. One union of four shapes allows exactly four, and puts each state's data inside it."
      level="depth"
      notice={
        <ul className="mb-0">
          <li>
            Press <strong>"Break it"</strong>. Version A shows a spinner, an error and a
            list simultaneously — a state no user should ever see, produced by flags that
            simply weren't reset. Version B cannot reach it.
          </li>
          <li>
            In <code>UnionVersion</code>, try adding <code>state.tasks</code> to the error
            case. Compile error: that property doesn't exist on that member. The narrowing
            does the reasoning you'd otherwise do in your head, badly, at 6pm.
          </li>
          <li>
            The union's data lives <em>inside</em> the state it belongs to. There is no
            stale <code>tasks</code> array hanging around during an error, because there is
            nowhere for it to hang around.
          </li>
          <li>
            The <code>switch</code> needs no <code>default</code>. Add a fifth status to the
            union and it stops compiling until you handle it.
          </li>
        </ul>
      }
    >
      <div className="d-flex flex-wrap gap-2 mb-3">
        <Button
          variant="outline-primary"
          onClick={() => {
            setIsLoading(true); setIsError(false); setTasks([])
            setState({ status: "loading" })
          }}
        >
          Load
        </Button>
        <Button
          variant="outline-success"
          onClick={() => {
            setIsLoading(false); setIsError(false); setTasks(sampleTasks)
            setState({ status: "success", tasks: sampleTasks })
          }}
        >
          Succeed
        </Button>
        <Button
          variant="outline-danger"
          onClick={() => {
            setIsLoading(false); setIsError(true); setTasks([])
            setState({ status: "error", message: errorMessage })
          }}
        >
          Fail
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            // A realistic bug: the developer forgot to reset two flags.
            setIsLoading(true); setIsError(true); setTasks(sampleTasks)
            setState({ status: "loading" })   // the union has no equivalent mistake available
          }}
        >
          Break it
        </Button>
        <Button
          variant="outline-secondary"
          onClick={() => {
            setIsLoading(false); setIsError(false); setTasks([])
            setState({ status: "idle" })
          }}
        >
          Reset
        </Button>
      </div>

      <Row className="g-3">
        <Col md={6}>
          <Card className="h-100 border-danger-subtle">
            <Card.Header className="bg-danger-subtle small fw-semibold">
              A — four booleans (16 combinations)
            </Card.Header>
            <Card.Body style={{ minHeight: 140 }}>
              <BooleanVersion
                isLoading={isLoading}
                isError={isError}
                errorMessage={errorMessage}
                tasks={tasks}
              />
            </Card.Body>
            <Card.Footer className="bg-white">
              <StateInspector
                label="flags"
                value={{ isLoading, isError, taskCount: tasks.length }}
              />
            </Card.Footer>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="h-100 border-success-subtle">
            <Card.Header className="bg-success-subtle small fw-semibold">
              B — one union (exactly 4 states)
            </Card.Header>
            <Card.Body style={{ minHeight: 140 }}>
              <UnionVersion state={state} />
            </Card.Body>
            <Card.Footer className="bg-white">
              <StateInspector label="state" value={state} />
            </Card.Footer>
          </Card>
        </Col>
      </Row>

      <Form.Group className="mt-3">
        <Form.Label className="small text-muted">
          Error message (used by both versions)
        </Form.Label>
        <Form.Control
          size="sm"
          value={errorMessage}
          onChange={(e) => setErrorMessage(e.target.value)}
        />
      </Form.Group>
    </DemoCard>
  )
}
```

Register as `{ id: "state-machine", chapter: "5 — Conditional", title: "Impossible states", element: <StateMachineLab /> }`.

**Experiments:**

1. Add `| { status: "refreshing"; tasks: Task[] }` to `LoadState`. `UnionVersion` stops compiling. Read the error, add the case, and note that you were *told* rather than having to remember. Now imagine doing the same with the boolean version: nothing tells you anything.
2. In the error case, write `{state.tasks.length}`. Compile error. Then do the equivalent in Version A — read `tasks.length` while `isError` is true. It compiles, and renders a stale count from the previous successful load.
3. Count the conditions in each component. Version A has five conditional expressions whose interactions you must hold in your head; Version B has one `switch`. That ratio gets worse, not better, as features are added.

✅ **Concept check 5**

1. Which idiom for "two alternatives", and which for "sometimes absent"?
2. Why are nested ternaries in JSX a problem, and what replaces them?
3. How many combinations do four booleans allow, and how many typically make sense?
4. In a discriminated union state, why is it better for `tasks` to live inside the `success` member than alongside the status?
5. Name the two different kinds of empty state and how their messages differ.

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

`useState` returns a two-element array, which is why destructuring with `[]` is the convention. React stores the actual value outside your function, in the component instance, and hands it back to you on each render. The variable `count` in your function body is a **local constant for this render** — not a live view of the store.

That last sentence is the whole of §6.2, and getting it early saves a lot of grief.

## 6.1 Typing state

Inference handles most cases. Be explicit when the initial value doesn't tell the whole story:

```tsx
const [count, setCount] = useState(0)                     // number — inferred ✅
const [title, setTitle] = useState("")                    // string — inferred ✅

const [tasks, setTasks] = useState<Task[]>([])            // needed: [] alone infers never[]
const [editing, setEditing] = useState<Task | null>(null) // needed: null alone infers null
const [filter, setFilter] = useState<Filter>("all")       // needed: else infers string
const [id, setId] = useState<string | undefined>()        // needed: undefined alone infers undefined
```

Each of those four is a real trap:

- **`useState([])`** infers `never[]`. Every `setTasks([task])` then fails with a baffling message about `Task` not being assignable to `never`.
- **`useState(null)`** infers `null`, so `setEditing(task)` fails.
- **`useState("all")`** infers `string`, so `setFilter("activ")` compiles and silently breaks your filter. This is the most dangerous of the four because there's no error to alert you.
- **`useState()`** with no argument infers `undefined`.

**Rule of thumb:** annotate when the initial value is `[]`, `null`, `undefined`, or a string literal that should be a union.

The setter's real type is `Dispatch<SetStateAction<T>>`, which expands to `(value: T | ((prev: T) => T)) => void`. You rarely write it, but you'll see it in error messages and when typing a callback prop that accepts a setter:

```tsx
import type { Dispatch, SetStateAction } from "react"

interface Props {
  setCount: Dispatch<SetStateAction<number>>   // accepts both setCount(5) and setCount(c => c+1)
  // vs.
  onCountChange: (count: number) => void       // accepts only a value — usually the better prop
}
```

Prefer the second for component props. Passing a raw setter down couples the child to the parent's storage choice; passing a callback keeps the boundary about *what happened*.

## 6.2 State is a snapshot

**A state variable does not change during a render.** It's a constant, fixed at the moment React called your function.

```tsx
function handleClick() {
  setCount(count + 1)
  console.log(count)   // still the OLD value — this render's value
}
```

This is not a quirk to work around; it's a guarantee. Everything in one render sees one consistent set of values, so your JSX can never show a half-updated mixture. The new value appears on the *next* render.

The consequence people trip over is timers and async code:

```tsx
function handleClick() {
  setCount(count + 1)
  setTimeout(() => alert(count), 2000)   // alerts the value from the click, not from 2s later
}
```

The closure captured `count` from the render in which the handler was created. Two seconds later the component has re-rendered several times, but *that particular function* still points at the old constant. Lab 6.2 makes this concrete.

## 6.3 The updater function

**Use the updater form when the new value depends on the old one.**

```tsx
setCount(count + 1)
setCount(count + 1)        // ❌ both read the same stale constant → +1 total

setCount((c) => c + 1)
setCount((c) => c + 1)     // ✅ each receives the latest queued value → +2 total
```

React queues updater functions and applies them in order during the next render. `setCount(5)` queues "replace with 5"; `setCount(c => c + 1)` queues "take whatever's there and add one".

**Default to the updater form.** It's correct in strictly more situations — inside timers, inside async functions, inside event handlers that fire twice, and inside effects where it can remove a dependency (§11).

## 6.4 Never mutate state — always replace it

React compares by reference (`Object.is`). Mutating an object or array leaves the reference identical, so React sees no change and skips the re-render.

```tsx
// ❌ mutation — React won't notice
tasks.push(newTask)
setTasks(tasks)
task.done = true
tasks.sort(...)
tasks[0].title = "x"

// ✅ create new values
setTasks([...tasks, newTask])                                        // add to end
setTasks([newTask, ...tasks])                                        // add to start
setTasks(tasks.filter((t) => t.id !== id))                           // remove
setTasks(tasks.map((t) => (t.id === id ? { ...t, done: true } : t))) // update one
setTasks([...tasks].sort((a, b) => a.createdAt - b.createdAt))       // sort a copy
setTasks(tasks.map((t) => ({ ...t, done: true })))                   // update all
```

That fourth line is the single most useful pattern in React, so read it carefully: **map over everything, replace the one that matches with a new object built by spreading the old one, leave the rest untouched.** The unchanged items keep their identity, which is exactly what lets `memo` skip them later.

**Nested updates need a new object at every level you change:**

```tsx
// state: { user: { profile: { name: string } } }

// ❌ only the outer object is new; React re-renders but memoised children see no change
setState({ ...state, user: { ...state.user } })
state.user.profile.name = "Ada"

// ✅ new object along the whole path to the change
setState({
  ...state,
  user: { ...state.user, profile: { ...state.user.profile, name: "Ada" } },
})
```

If you're writing that more than once or twice, either flatten your state or reach for Immer (`useImmer`), which lets you write mutating-looking code that produces immutable updates. Flattening is usually the better answer — deeply nested state is a design smell in React.

> **TS Note.** Typing your state as `readonly Task[]` makes `.push()` and `.sort()` compile errors, turning this convention into an enforced rule. `useState<readonly Task[]>([])` costs nothing and catches the whole family of mistakes. Worth considering as a team default.

## 6.5 Group related state; separate unrelated state

```tsx
const [firstName, setFirstName] = useState("")   // fine — independent values
const [lastName, setLastName] = useState("")

const [form, setForm] = useState<NewTask>({ title: "", priority: "medium" })  // fine — always change together

const [position, setPosition] = useState({ x: 0, y: 0 })   // fine — a mouse move sets both
```

The test is: **do these values always change at the same time?** If yes, one object. If no, separate variables — otherwise every update has to spread fields it doesn't care about, and you'll eventually forget one.

There's a stronger signal too: **if two state variables can contradict each other, they should be one.** That's §5.3's impossible-states argument, and it's the reason `{ status: "error", message }` beats `isError` plus `errorMessage`.

## 6.6 Initial value is only used once

```tsx
const [tasks, setTasks] = useState<Task[]>(seedTasks)  // read on the first render only
```

Passing a different value on a later render does nothing. That's why "reset the child when the selection changes" is done with `key` (§4.3), not by changing the initial value.

If *computing* the initial value is expensive, pass a **function** so it runs once instead of on every render:

```tsx
// ❌ JSON.parse runs on EVERY render; the result is thrown away every time but the first
const [tasks, setTasks] = useState<Task[]>(JSON.parse(localStorage.getItem("tasks") ?? "[]"))

// ✅ lazy initialiser — runs once
const [tasks, setTasks] = useState<Task[]>(() => JSON.parse(localStorage.getItem("tasks") ?? "[]"))
```

The difference is one arrow and it's invisible in the UI, which is precisely why it's worth knowing about.

## 6.7 State is per-component-instance

```tsx
<Counter />   // has its own count
<Counter />   // completely independent count
```

Two instances of the same component share code, never state. State is tied to *position in the tree*, which is the same mechanism as §4's keys: same position and type means same state; a change of key or type means a new instance with fresh state.

## 6.8 Batching

Multiple `setState` calls in the same event handler are **batched** into one re-render:

```tsx
function handleClick() {
  setCount((c) => c + 1)
  setName("Ada")
  setOpen(true)
  // → ONE re-render, not three
}
```

Since React 18 this applies everywhere — timeouts, promises, native event handlers — not just React event handlers. This is why the render count in Lab 6.5 goes up by one no matter how many setters you call, and why you should never try to "optimise" by combining unrelated state into one object.

---

## 🧪 Lab 6.1 — The stale-value trap and the updater form

**Level:** core

Create `src/demos/06-state/CounterLab.tsx`:

```tsx
import { useState } from "react"
import { Alert, Button, Card, Col, Row } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import RenderBadge from "@/lab/RenderBadge"

export default function CounterLab() {
  const [direct, setDirect] = useState(0)
  const [updater, setUpdater] = useState(0)
  const [log, setLog] = useState<string[]>([])

  function incrementDirectTwice() {
    setDirect(direct + 1)
    setDirect(direct + 1)          // both read the same constant
    setLog((prev) => [`clicked while direct was ${direct}`, ...prev].slice(0, 5))
  }

  function incrementUpdaterTwice() {
    setUpdater((n) => n + 1)
    setUpdater((n) => n + 1)       // each receives the queued value
    setLog((prev) => [`clicked while updater was ${updater}`, ...prev].slice(0, 5))
  }

  return (
    <DemoCard
      title="Stale values and the updater form"
      claim="Inside one render, a state variable is a constant. Two setCount(count + 1) calls therefore both compute the same number."
      level="core"
      notice={
        <ul className="mb-0">
          <li>
            Click <strong>+2 (direct)</strong> once. It goes up by <strong>1</strong>. Both
            calls computed <code>0 + 1</code>, because <code>direct</code> was <code>0</code>
            for the entire duration of that handler.
          </li>
          <li>
            Click <strong>+2 (updater)</strong> once. It goes up by <strong>2</strong>. React
            queued two functions and ran them in sequence against the latest value.
          </li>
          <li>
            The render badge climbs by the same amount for both — React <em>batched</em>
            the two updates into a single re-render regardless.
          </li>
          <li>
            The log shows the value the handler <em>saw</em>, which is always one render
            behind what's on screen. That's not a bug; it's the snapshot guarantee.
          </li>
        </ul>
      }
    >
      <Row className="g-3">
        <Col md={6}>
          <Card className="h-100 border-danger-subtle text-center">
            <Card.Header className="bg-danger-subtle small fw-semibold font-monospace">
              setDirect(direct + 1) ×2
            </Card.Header>
            <Card.Body>
              <div className="display-5 fw-semibold">{direct}</div>
              <Button variant="outline-danger" className="mt-2" onClick={incrementDirectTwice}>
                +2 (direct)
              </Button>
              <div className="small text-muted mt-2">actually adds 1</div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="h-100 border-success-subtle text-center">
            <Card.Header className="bg-success-subtle small fw-semibold font-monospace">
              setUpdater(n =&gt; n + 1) ×2
            </Card.Header>
            <Card.Body>
              <div className="display-5 fw-semibold">{updater}</div>
              <Button variant="outline-success" className="mt-2" onClick={incrementUpdaterTwice}>
                +2 (updater)
              </Button>
              <div className="small text-muted mt-2">adds 2</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Alert variant="light" className="border mt-3 mb-0">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="small fw-semibold">
            What the handler saw when it ran (newest first)
          </span>
          <RenderBadge label="CounterLab" bg="primary" />
        </div>
        {log.length === 0 ? (
          <div className="small text-muted">Click a button.</div>
        ) : (
          <ul className="small mb-0 font-monospace">
            {log.map((line, i) => (
              <li key={`${line}-${i}`}>{line}</li>
            ))}
          </ul>
        )}
      </Alert>
    </DemoCard>
  )
}
```

Register as `{ id: "counter", chapter: "6 — useState", title: "Stale values & updaters", element: <CounterLab /> }`.

**Experiments:**

1. Add a third `setDirect(direct + 1)` call. Still +1. The number of calls is irrelevant; the *value they read* is the problem.
2. Change the direct version to `setDirect(direct + 1); setDirect(direct + 2)`. It adds 2 — because the last write wins, and the last write said `0 + 2`. Convince yourself why that's consistent with the model.
3. Add `console.log("handler sees", direct, "render sees", direct)` inside the handler and at the top of the component. The handler always logs the previous render's value. That's the snapshot.

---

## 🧪 Lab 6.2 — State is a snapshot

**Level:** depth

Create `src/demos/06-state/SnapshotLab.tsx`:

```tsx
import { useRef, useState } from "react"
import { Alert, Button, Card, Col, Form, Row } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import LogPanel from "@/lab/LogPanel"
import { useEventLog } from "@/lab/useEventLog"

export default function SnapshotLab() {
  const [count, setCount] = useState(0)
  const [delay, setDelay] = useState(2000)
  const countRef = useRef(0)
  const { entries, log, clear } = useEventLog()

  function scheduleStaleRead() {
    const at = count
    log(`scheduled while count = ${at}`)
    setTimeout(() => {
      // `count` here is the constant from the render that created this closure
      log(`⏰ closure sees count = ${count}  |  ref sees ${countRef.current}`)
    }, delay)
  }

  function increment() {
    setCount((c) => c + 1)
    countRef.current += 1
  }

  return (
    <DemoCard
      title="State is a snapshot"
      claim="A closure created during a render captures that render's state forever. Later renders get new closures; the old one never updates."
      level="depth"
      notice={
        <ul className="mb-0">
          <li>
            Press <strong>Schedule a delayed read</strong>, then press{" "}
            <strong>Increment</strong> several times before the timer fires. The log shows
            the count as it was <em>when you scheduled</em>, not as it is now.
          </li>
          <li>
            The ref, printed beside it, shows the current value — because a ref is a
            mutable box shared by every render rather than a per-render constant. §15.
          </li>
          <li>
            This is the same mechanism behind every "my effect sees old data" bug. The fix
            is never "read it harder"; it's an updater function, a dependency array, or a
            ref, depending on what you actually need.
          </li>
        </ul>
      }
    >
      <Row className="g-3">
        <Col md={5}>
          <Card body className="h-100 text-center">
            <div className="small text-muted">count (state)</div>
            <div className="display-5 fw-semibold">{count}</div>
            <div className="d-grid gap-2 mt-3">
              <Button onClick={increment}>Increment</Button>
              <Button variant="outline-primary" onClick={scheduleStaleRead}>
                Schedule a delayed read
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => {
                  setCount(0)
                  countRef.current = 0
                  clear()
                }}
              >
                Reset
              </Button>
            </div>
            <Form.Group className="mt-3 text-start">
              <Form.Label className="small text-muted">Delay: {delay}ms</Form.Label>
              <Form.Range
                min={500}
                max={5000}
                step={500}
                value={delay}
                onChange={(e) => setDelay(Number(e.target.value))}
              />
            </Form.Group>
          </Card>
        </Col>

        <Col md={7}>
          <LogPanel entries={entries} onClear={clear} height={260} />
        </Col>
      </Row>

      <Alert variant="light" className="border mt-3 mb-0 small">
        <strong>The three fixes, and when each applies.</strong> Need the latest value to
        compute the next one? <code>setCount(c =&gt; c + 1)</code>. Need to <em>read</em> the
        latest value in a callback that outlives the render? A <code>ref</code>. Need the
        effect to re-run with fresh values? Put them in the dependency array.
      </Alert>
    </DemoCard>
  )
}
```

Register as `{ id: "snapshot", chapter: "6 — useState", title: "State is a snapshot", element: <SnapshotLab /> }`.

**Experiments:**

1. Set the delay to 5000ms, schedule a read, then increment ten times. The gap between the two numbers in the log is the size of the misunderstanding this lab exists to remove.
2. Replace the timeout body with `log(\`sees ${count}\`)` inside a `setCount(c => { log(\`updater sees ${c}\`); return c })`. The updater always sees current state. That's why it's the fix for computation.
3. Schedule two reads with different counts in between. Each timer reports its own render's value — they're independent closures, not a shared variable.

---

## 🧪 Lab 6.3 — Mutate vs replace

**Level:** core

Create `src/demos/06-state/ImmutabilityLab.tsx`:

```tsx
import { useState } from "react"
import { Alert, Badge, Button, Card, Col, ListGroup, Row } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import StateInspector from "@/lab/StateInspector"
import RenderBadge from "@/lab/RenderBadge"

interface Item {
  id: string
  label: string
  done: boolean
  meta: { tags: string[] }
}

const initial: Item[] = [
  { id: "i1", label: "Draft the proposal", done: false, meta: { tags: ["writing"] } },
  { id: "i2", label: "Book the venue", done: true, meta: { tags: ["ops", "urgent"] } },
]

export default function ImmutabilityLab() {
  const [items, setItems] = useState<Item[]>(initial)
  const [note, setNote] = useState("")

  // ---------- the wrong ways ----------

  function mutatePush() {
    items.push({ id: crypto.randomUUID(), label: "Pushed (mutation)", done: false, meta: { tags: [] } })
    setItems(items)                    // same reference — React bails out
    setNote("Mutated the array and passed the same reference. Nothing re-rendered.")
  }

  function mutateField() {
    if (items[0]) items[0].done = !items[0].done
    setItems(items)
    setNote("Mutated an item in place. Same reference again — no re-render.")
  }

  function mutateNested() {
    items[0]?.meta.tags.push("mutated")
    setItems([...items])               // new array, but the nested object is shared
    setNote(
      "New array, mutated nested object. It re-renders — but memoised children would see " +
        "an unchanged item and skip. Correct by accident, fragile by design."
    )
  }

  // ---------- the right ways ----------

  function addImmutable() {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: `Added #${prev.length + 1}`, done: false, meta: { tags: [] } },
    ])
    setNote("Spread into a new array. New reference, guaranteed re-render.")
  }

  function toggleImmutable(id: string) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, done: !it.done } : it)))
    setNote("map + spread: one new object, the rest keep their identity.")
  }

  function addTagImmutable(id: string) {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? { ...it, meta: { ...it.meta, tags: [...it.meta.tags, "new"] } }
          : it
      )
    )
    setNote("A new object at every level along the path to the change.")
  }

  function removeImmutable(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id))
    setNote("filter returns a new array. Nothing was mutated.")
  }

  return (
    <DemoCard
      title="Mutate vs replace"
      claim="React compares state by reference. A mutated array is the same reference, so React concludes nothing changed and skips the render entirely."
      level="core"
      notice={
        <ul className="mb-0">
          <li>
            The three red buttons all "work" in the sense that the data changes. Two of them
            produce <strong>no re-render at all</strong> — the screen and the state now
            disagree, silently.
          </li>
          <li>
            After a failed mutation, press any green button. The mutated data suddenly
            appears, because <em>that</em> update caused a render which drew the whole
            current state. <strong>The bug surfaces at an unrelated moment</strong>, which is
            what makes mutation bugs expensive.
          </li>
          <li>
            <code>mutateNested</code> is the dangerous one: it looks correct and re-renders
            correctly, but the nested object's identity never changed. §16's{" "}
            <code>memo</code> would skip that row.
          </li>
          <li>
            Watch the render badge to tell "React re-rendered" from "the data changed".
          </li>
        </ul>
      }
    >
      <div className="d-flex justify-content-between align-items-center mb-3">
        <span className="small fw-semibold text-muted">
          {items.length} item{items.length === 1 ? "" : "s"}
        </span>
        <RenderBadge label="ImmutabilityLab" bg="primary" />
      </div>

      <Row className="g-3">
        <Col lg={7}>
          <Card className="mb-3 border-danger-subtle">
            <Card.Header className="bg-danger-subtle small fw-semibold">
              ❌ Mutation
            </Card.Header>
            <Card.Body className="d-flex flex-wrap gap-2">
              <Button size="sm" variant="outline-danger" onClick={mutatePush}>
                push + setItems(items)
              </Button>
              <Button size="sm" variant="outline-danger" onClick={mutateField}>
                items[0].done = !done
              </Button>
              <Button size="sm" variant="outline-danger" onClick={mutateNested}>
                nested push + new array
              </Button>
            </Card.Body>
          </Card>

          <Card className="border-success-subtle">
            <Card.Header className="bg-success-subtle small fw-semibold">
              ✅ Replacement
            </Card.Header>
            <Card.Body className="d-flex flex-wrap gap-2">
              <Button size="sm" variant="outline-success" onClick={addImmutable}>
                [...prev, item]
              </Button>
              <Button
                size="sm"
                variant="outline-success"
                onClick={() => items[0] && toggleImmutable(items[0].id)}
              >
                map + spread (toggle first)
              </Button>
              <Button
                size="sm"
                variant="outline-success"
                onClick={() => items[0] && addTagImmutable(items[0].id)}
              >
                nested spread (tag first)
              </Button>
              <Button
                size="sm"
                variant="outline-success"
                onClick={() => items[0] && removeImmutable(items[0].id)}
              >
                filter (remove first)
              </Button>
              <Button size="sm" variant="outline-secondary" onClick={() => setItems(initial)}>
                Reset
              </Button>
            </Card.Body>
          </Card>

          {note && (
            <Alert variant="light" className="border mt-3 mb-0 small">
              {note}
            </Alert>
          )}
        </Col>

        <Col lg={5}>
          <div className="small fw-semibold text-muted mb-2">Rendered from state</div>
          <ListGroup className="mb-3">
            {items.map((item) => (
              <ListGroup.Item key={item.id} className="d-flex align-items-center gap-2 small">
                <span className={item.done ? "text-decoration-line-through text-muted" : ""}>
                  {item.label}
                </span>
                <span className="ms-auto d-flex gap-1">
                  {item.meta.tags.map((tag) => (
                    <Badge bg="secondary" key={tag}>
                      {tag}
                    </Badge>
                  ))}
                </span>
              </ListGroup.Item>
            ))}
          </ListGroup>
          <StateInspector label="items" value={items} />
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "immutability", chapter: "6 — useState", title: "Mutate vs replace", element: <ImmutabilityLab /> }`.

**Experiments — the important one is #2:**

1. Press `push + setItems(items)` three times. Nothing appears. Now press `map + spread`. All three pushed items appear at once. That delayed reveal is exactly how this bug presents in a real app: "the list updates one click late".
2. Change the state type to `useState<readonly Item[]>(initial)`. `items.push(...)` and `items[0].done = ...` become **compile errors**. Two of the three red buttons can no longer be written. Consider whether you want this by default — many teams do.
3. Press `nested push + new array` and watch it work. Then wrap the `ListGroup.Item` contents in a `memo`-ised child component (you'll be able to do this properly after §16) and try again — the row won't update, because its props are referentially identical.

---

## 🧪 Lab 6.4 — Lazy initialisers and per-instance state

**Level:** depth

Create `src/demos/06-state/InitAndInstancesLab.tsx`:

```tsx
import { useState } from "react"
import { Alert, Badge, Button, Card, Col, Row } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import { measure, slowSum } from "@/lab/slow"

// Module-level counters so we can see how often each path actually runs.
let eagerRuns = 0
let lazyRuns = 0

function expensiveEager() {
  eagerRuns += 1
  return measure(() => slowSum(2_000_000)).ms
}

function expensiveLazy() {
  lazyRuns += 1
  return measure(() => slowSum(2_000_000)).ms
}

function InitCounters() {
  // ❌ called on EVERY render; the result is discarded after the first
  const [eagerMs] = useState(expensiveEager())

  // ✅ called ONCE, on mount
  const [lazyMs] = useState(expensiveLazy)

  const [, bump] = useState(0)

  return (
    <Card body>
      <div className="d-flex justify-content-between small">
        <span>Eager <code>useState(fn())</code></span>
        <span>
          computed in {eagerMs}ms · ran <Badge bg="danger">{eagerRuns}</Badge> times
        </span>
      </div>
      <div className="d-flex justify-content-between small mt-2">
        <span>Lazy <code>useState(fn)</code></span>
        <span>
          computed in {lazyMs}ms · ran <Badge bg="success">{lazyRuns}</Badge> times
        </span>
      </div>
      <Button size="sm" className="mt-3" onClick={() => bump((n) => n + 1)}>
        Force a re-render
      </Button>
    </Card>
  )
}

/** Each instance has its own state, even though they share one function. */
function Tally({ name }: { name: string }) {
  const [n, setN] = useState(0)
  return (
    <Card body className="text-center">
      <div className="small text-muted">{name}</div>
      <div className="fs-3 fw-semibold">{n}</div>
      <Button size="sm" variant="outline-primary" onClick={() => setN((v) => v + 1)}>
        +1
      </Button>
    </Card>
  )
}

export default function InitAndInstancesLab() {
  const [showThird, setShowThird] = useState(true)

  return (
    <DemoCard
      title="Lazy initialisers & per-instance state"
      claim="useState(fn()) calls fn on every render and throws the result away. useState(fn) calls it once. And every instance of a component has entirely separate state."
      level="depth"
      notice={
        <ul className="mb-0">
          <li>
            Press <strong>Force a re-render</strong> a few times. The eager counter climbs
            every time (in twos, thanks to Strict Mode); the lazy one stays put. The eager
            version is doing two million floating-point operations per render for nothing.
          </li>
          <li>
            One arrow is the entire difference: <code>useState(expensiveEager())</code> vs{" "}
            <code>useState(expensiveLazy)</code>. No parentheses means "here's the function,
            call it if you need it".
          </li>
          <li>
            The three tallies share one component function and zero state. Increment them
            independently to prove it.
          </li>
          <li>
            Unmount and remount the third tally. Its count resets to 0 — state lives with
            the instance, and the instance is gone. Compare with §4.3's <code>key</code>{" "}
            trick, which is the same mechanism deliberately triggered.
          </li>
        </ul>
      }
    >
      <Alert variant="warning" className="small">
        This lab deliberately burns CPU. If the page feels sluggish, that's the point being
        made rather than a bug.
      </Alert>

      <div className="mb-4">
        <InitCounters />
      </div>

      <Row className="g-3">
        <Col md={4}>
          <Tally name="Tally A" />
        </Col>
        <Col md={4}>
          <Tally name="Tally B" />
        </Col>
        <Col md={4}>
          {showThird ? (
            <Tally name="Tally C" />
          ) : (
            <Card body className="text-center text-muted small">
              unmounted
            </Card>
          )}
        </Col>
      </Row>

      <Button
        variant="outline-secondary"
        size="sm"
        className="mt-3"
        onClick={() => setShowThird((s) => !s)}
      >
        {showThird ? "Unmount" : "Mount"} Tally C
      </Button>
    </DemoCard>
  )
}
```

Register as `{ id: "init-instances", chapter: "6 — useState", title: "Lazy init & instances", element: <InitAndInstancesLab /> }`.

**Experiments:**

1. Increment Tally C to 5, unmount it, mount it again. Back to 0. Now do the same but wrap it in a stable parent that stays mounted — same result, because it's C's own unmount that matters.
2. Change `useState(expensiveLazy)` to `useState(() => expensiveLazy())`. Identical behaviour — both pass a function. The first is just terser when you happen to have a zero-argument function to hand.
3. Change `slowSum(2_000_000)` to `slowSum(50_000_000)` and press Force a re-render. The eager version now visibly freezes the tab on every render. This is a real production bug pattern, usually in the form `useState(JSON.parse(localStorage.getItem(k)!))`.

---

## 🧪 Lab 6.5 — Batching

**Level:** optional

Create `src/demos/06-state/BatchingLab.tsx`:

```tsx
import { useState } from "react"
import { Button, Card, Col, Row, Table } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import { useRenderCount } from "@/lab/RenderBadge"

export default function BatchingLab() {
  const renders = useRenderCount()
  const [a, setA] = useState(0)
  const [b, setB] = useState(0)
  const [c, setC] = useState(0)

  function setAllInHandler() {
    setA((n) => n + 1)
    setB((n) => n + 1)
    setC((n) => n + 1)
  }

  function setAllInTimeout() {
    setTimeout(() => {
      setA((n) => n + 1)
      setB((n) => n + 1)
      setC((n) => n + 1)
    }, 0)
  }

  async function setAllInPromise() {
    await Promise.resolve()
    setA((n) => n + 1)
    setB((n) => n + 1)
    setC((n) => n + 1)
  }

  return (
    <DemoCard
      title="Batching"
      claim="Three state updates in one tick produce one re-render — in event handlers, timeouts and promises alike, since React 18."
      level="optional"
      notice={
        <ul className="mb-0">
          <li>
            Each button sets three pieces of state. The render count goes up by the same
            amount every time — React collected the updates and rendered once.
          </li>
          <li>
            Before React 18, only React event handlers were batched; timeouts and promises
            each caused a render per setter. If you read older advice about combining state
            "to avoid extra renders", that's where it came from, and it's obsolete.
          </li>
          <li>
            Because updates are batched, <strong>splitting state into more variables costs
            nothing in renders.</strong> Group state for correctness, not performance.
          </li>
        </ul>
      }
    >
      <Row className="g-3">
        <Col md={5}>
          <Card body>
            <Table borderless size="sm" className="mb-3">
              <tbody>
                <tr><td className="text-muted small">a</td><td className="fw-semibold">{a}</td></tr>
                <tr><td className="text-muted small">b</td><td className="fw-semibold">{b}</td></tr>
                <tr><td className="text-muted small">c</td><td className="fw-semibold">{c}</td></tr>
                <tr className="border-top">
                  <td className="text-muted small">renders</td>
                  <td className="fw-semibold text-primary">{renders}</td>
                </tr>
              </tbody>
            </Table>
            <div className="d-grid gap-2">
              <Button onClick={setAllInHandler}>3 setters in an event handler</Button>
              <Button variant="outline-primary" onClick={setAllInTimeout}>
                3 setters in setTimeout
              </Button>
              <Button variant="outline-primary" onClick={setAllInPromise}>
                3 setters after await
              </Button>
            </div>
          </Card>
        </Col>
        <Col md={7}>
          <Card body className="h-100 small">
            <p>
              Add <code>console.log("render")</code> to the top of this component and click
              each button. One log line per click, three state changes.
            </p>
            <p className="mb-0 text-muted">
              Strict Mode doubles the logged renders in development. The relevant fact is
              that the number is the <em>same</em> for all three buttons, not what it is.
            </p>
          </Card>
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "batching", chapter: "6 — useState", title: "Batching", element: <BatchingLab /> }`.

✅ **Concept check 6**

1. Why does `useState([])` cause errors when you later add an item, and what's the fix?
2. Why does calling `setCount(count + 1)` twice add only 1?
3. Why does mutating an array and calling `setItems(items)` not re-render?
4. What's the difference between `useState(compute())` and `useState(compute)`?
5. If you split one state object into three variables, how many extra re-renders do you cause?

---

# 7. Events & handlers

React events look like DOM events with camelCase names, and they receive a **synthetic event** object with the standard API.

```tsx
<Button onClick={handleClick}>Click</Button>
<Form.Control onChange={handleChange} />
<Form onSubmit={handleSubmit}>
<div onMouseEnter={handleEnter} onKeyDown={handleKey} onFocus={handleFocus} />
```

The synthetic event is React's own object wrapping the native one. It normalises cross-browser differences and exposes the same properties you already know: `target`, `currentTarget`, `preventDefault()`, `stopPropagation()`, `key`, `clientX`. If you ever need the real thing, it's on `e.nativeEvent`.

## 7.1 Pass the function, don't call it

```tsx
<Button onClick={handleClick}>     // ✅ a reference — React calls it later
<Button onClick={handleClick()}>   // ❌ calls it NOW, during render, and passes the result
```

The second form runs your handler on every render. If the handler sets state, you get an infinite render loop and React eventually throws "Too many re-renders". That error message, met once, is unforgettable — but it's worth knowing the cause in advance.

**To pass arguments, wrap in an arrow function:**

```tsx
<Button onClick={() => onDelete(task.id)}>Delete</Button>
```

Now you're passing a *new function* that, when called, calls yours with the argument. A common worry is that creating a function on every render is wasteful. It isn't — allocating a closure is nanoseconds, and the alternative (`useCallback` everywhere) usually costs more than it saves. §16 covers the narrow cases where it matters.

## 7.2 `preventDefault` and `stopPropagation`

Two different jobs, often confused:

```tsx
function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault()    // stop the BROWSER's default behaviour (full-page reload)
}

function handleRowButtonClick(e: React.MouseEvent<HTMLButtonElement>) {
  e.stopPropagation()   // stop the event travelling to ANCESTOR handlers
  onDelete(id)
}
```

- **`preventDefault`** cancels what the browser would have done: submitting a form, following a link, ticking a checkbox, scrolling on space.
- **`stopPropagation`** stops the event bubbling up to parent elements' handlers. React's own re-rendering is unaffected either way.

The classic need for `stopPropagation`: a clickable card with a delete button inside it. Without it, clicking delete also triggers the card's `onClick`, so you delete the item *and* open its detail view.

Returning `false` from a handler does nothing in React (unlike jQuery). Call the methods.

## 7.3 `e.target` vs `e.currentTarget`

This distinction is easy to ignore in JavaScript and impossible to ignore in TypeScript, which is a good thing.

| | Refers to | Type |
|---|---|---|
| `e.currentTarget` | The element whose handler is running — the one you attached to | Precisely typed from the generic |
| `e.target` | The element the event actually originated on, which may be a descendant | Typed loosely as `EventTarget` |

```tsx
<div onClick={(e) => {
  e.currentTarget   // always the <div>
  e.target          // the <span> or <button> you actually clicked
}}>
  <span>click me</span>
</div>
```

For form inputs, `e.target` is conventional and fine because the input has no children — nothing else *can* be the target:

```tsx
<Form.Control onChange={(e) => setTitle(e.target.value)} />   // ✅ standard
```

But for anything with children, **`currentTarget` is what you almost always mean**, and it's the one whose type TypeScript knows. This is why `React.ChangeEvent<HTMLInputElement>` gives `e.target` a precise type as a special case, while `React.MouseEvent<HTMLDivElement>` leaves `e.target` as `EventTarget` and requires a cast to use it.

## 7.4 Bubbling and capture

React events bubble up the component tree, following the DOM. You can also handle them on the way *down* by appending `Capture`:

```tsx
<div onClickCapture={onDown} onClick={onUp}>   // capture fires first, on the way down
```

Order for a click on a nested button inside a div inside a section:

```
sectionCapture → divCapture → buttonCapture → button → div → section
```

Understanding this is what lets you build "click outside to close" (listen on a parent during capture) and understand why a modal's backdrop click sometimes fires when you click inside it.

One React-specific note: **`onScroll` does not bubble** in React, and `onFocus`/`onBlur` *do* (unlike native `focus`/`blur`, which don't — React normalises them to `focusin`/`focusout` behaviour). The second is genuinely useful: it lets a form container detect focus anywhere inside it.

## 7.5 Typing event handlers

The types you'll actually use:

```tsx
React.ChangeEvent<HTMLInputElement>      // text inputs, checkboxes, radios, file, range
React.ChangeEvent<HTMLSelectElement>     // <select> / Form.Select
React.ChangeEvent<HTMLTextAreaElement>
React.FormEvent<HTMLFormElement>         // form submit
React.MouseEvent<HTMLButtonElement>      // clicks
React.KeyboardEvent<HTMLInputElement>    // key presses
React.FocusEvent<HTMLInputElement>       // focus / blur
React.DragEvent<HTMLDivElement>
React.ClipboardEvent<HTMLInputElement>
```

**The shortcut worth knowing:** when the handler is written *inline*, TypeScript infers the event type from context and you annotate nothing:

```tsx
<Form.Control onChange={(e) => setTitle(e.target.value)} />   // e is inferred ✅
```

You only annotate when the handler is defined separately, because a standalone function has no context to infer from:

```tsx
function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
  setTitle(e.target.value)
}
```

There's a third option that gets you inference *and* a named function — type the whole handler rather than its parameter:

```tsx
import type { ChangeEventHandler } from "react"

const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
  setTitle(e.target.value)      // e is inferred from the handler type
}
```

Handler-type aliases exist for each family: `MouseEventHandler`, `FormEventHandler`, `KeyboardEventHandler`, `ChangeEventHandler`, `FocusEventHandler`. Some teams prefer this style; both are correct.

**Naming convention:** the prop is `onSomething`, the handler is `handleSomething`. Consistency here makes components readable at a glance and makes "where is this defined?" a non-question.

---

## 🧪 Lab 7.1 — Pass, call, and arguments

**Level:** core

Create `src/demos/07-events/HandlerBasics.tsx`:

```tsx
import { useState } from "react"
import { Alert, Button, Card, Col, ListGroup, Row } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import LogPanel from "@/lab/LogPanel"
import { useEventLog } from "@/lab/useEventLog"

const fruits = [
  { id: "f1", name: "Apricot" },
  { id: "f2", name: "Blackcurrant" },
  { id: "f3", name: "Cherry" },
]

export default function HandlerBasics() {
  const { entries, log, clear } = useEventLog()
  const [selected, setSelected] = useState<string | null>(null)
  const [renderTimeCalls, setRenderTimeCalls] = useState(0)

  function handleSimpleClick() {
    log("handleSimpleClick ran")
  }

  function handleSelect(id: string, name: string) {
    setSelected(id)
    log(`handleSelect("${id}", "${name}")`)
  }

  // Deliberately impure demonstration of what onClick={fn()} does.
  function calledDuringRender() {
    return "I was called while the component rendered"
  }

  return (
    <DemoCard
      title="Pass the function, don't call it"
      claim="onClick expects a function value. onClick={fn()} evaluates fn during render and hands React whatever it returned."
      level="core"
      notice={
        <ul className="mb-0">
          <li>
            The first two buttons behave identically at a glance, but only one is correct.
            Watch the log: the <code>{"{fn()}"}</code> version logged its message
            <strong> before you clicked anything</strong>, during the render.
          </li>
          <li>
            To pass an argument you need a wrapper:{" "}
            <code>{"onClick={() => handleSelect(id, name)}"}</code>. That creates a new
            closure per render, which is cheap and normal.
          </li>
          <li>
            <code>{"onClick={handleSelect}"}</code> without a wrapper would call{" "}
            <code>handleSelect(clickEvent)</code> — the event object as the first argument.
            That's occasionally what you want and usually not.
          </li>
        </ul>
      }
    >
      <Row className="g-3">
        <Col lg={6}>
          <Card className="mb-3">
            <Card.Header className="small fw-semibold">Reference vs call</Card.Header>
            <Card.Body className="d-flex flex-column gap-2">
              <Button variant="outline-success" onClick={handleSimpleClick}>
                <code className="text-body">{"onClick={handleSimpleClick}"}</code> ✅
              </Button>

              <Button
                variant="outline-danger"
                onClick={
                  // Evaluated during render. React receives a string, not a function.
                  calledDuringRender() as unknown as undefined
                }
              >
                <code className="text-body">{"onClick={calledDuringRender()}"}</code> ❌
              </Button>

              <Alert variant="light" className="border small mb-0">
                The red button does nothing when clicked, because React was handed a{" "}
                <code>string</code>. Rendered{" "}
                <strong>{renderTimeCalls}</strong> times so far — press below to re-render
                and watch it climb without any clicking.
              </Alert>

              <Button
                size="sm"
                variant="secondary"
                onClick={() => setRenderTimeCalls((n) => n + 1)}
              >
                Force a re-render
              </Button>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header className="small fw-semibold">
              Passing arguments from a list
            </Card.Header>
            <ListGroup variant="flush">
              {fruits.map((fruit) => (
                <ListGroup.Item
                  key={fruit.id}
                  className="d-flex align-items-center justify-content-between"
                  active={selected === fruit.id}
                >
                  {fruit.name}
                  <Button
                    size="sm"
                    variant={selected === fruit.id ? "light" : "outline-primary"}
                    onClick={() => handleSelect(fruit.id, fruit.name)}
                  >
                    Select
                  </Button>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>
        </Col>

        <Col lg={6}>
          <LogPanel entries={entries} onClear={clear} height={330} />
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "handler-basics", chapter: "7 — Events", title: "Pass vs call", element: <HandlerBasics /> }`.

**Experiments:**

1. Change `calledDuringRender` to call `log(...)` and return nothing, then remove the `as unknown as undefined` cast. TypeScript now rejects it — `void` isn't a valid `onClick`. **The casts in that button exist only to let a compile error through so you can see the runtime behaviour.** In real code TypeScript catches this class of mistake outright, which is a genuine improvement over plain JavaScript.
2. Make `calledDuringRender` call `setRenderTimeCalls(n => n + 1)`. The page dies with "Too many re-renders" — render sets state, which renders, which sets state. Meet the error once, in a controlled setting.
3. Change one row's handler to `onClick={handleSelect}`. TypeScript complains that a `MouseEvent` isn't assignable to `string`. Without types this would have silently passed an event object as an id.

---

## 🧪 Lab 7.2 — Bubbling, capture, and stopPropagation

**Level:** depth

Create `src/demos/07-events/PropagationLab.tsx`:

```tsx
import { useState } from "react"
import { Button, Card, Col, Form, Row } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import LogPanel from "@/lab/LogPanel"
import { useEventLog } from "@/lab/useEventLog"

export default function PropagationLab() {
  const { entries, log, clear } = useEventLog()
  const [stopInner, setStopInner] = useState(false)
  const [showCapture, setShowCapture] = useState(true)
  const [cardOpens, setCardOpens] = useState(0)
  const [deletes, setDeletes] = useState(0)

  return (
    <DemoCard
      title="Bubbling, capture and stopPropagation"
      claim="Events travel down (capture) then back up (bubble). A nested button's click reaches every ancestor handler unless you stop it."
      level="depth"
      notice={
        <ul className="mb-0">
          <li>
            Click the <strong>inner button</strong> with stopPropagation off. The log shows
            capture phase outside-in, then bubble phase inside-out — six entries for one
            click.
          </li>
          <li>
            Turn stopPropagation <strong>on</strong> and click it again. The bubble stops at
            the button: the section and outer div never hear about it. Capture still fires,
            because that happened before the button was reached.
          </li>
          <li>
            The practical case is at the bottom: a clickable card with a delete button
            inside. Without <code>stopPropagation</code>, one click on Delete both deletes
            the item and opens it. Toggle the switch and watch both counters.
          </li>
          <li>
            <code>stopPropagation</code> affects <em>event travel</em>. It has nothing to do
            with re-rendering, and it does not prevent default browser behaviour.
          </li>
        </ul>
      }
    >
      <Row className="g-3">
        <Col lg={6}>
          <div className="d-flex flex-column gap-2 mb-3">
            <Form.Check
              type="switch"
              label="inner button calls e.stopPropagation()"
              checked={stopInner}
              onChange={(e) => setStopInner(e.target.checked)}
            />
            <Form.Check
              type="switch"
              label="attach capture-phase handlers"
              checked={showCapture}
              onChange={(e) => setShowCapture(e.target.checked)}
            />
          </div>

          <div
            className="border border-2 rounded-3 p-3 bg-white"
            onClick={() => log("bubble:   outer div")}
            onClickCapture={showCapture ? () => log("capture:  outer div") : undefined}
          >
            <div className="small text-muted mb-2">outer div</div>

            <section
              className="border rounded-3 p-3 bg-body-tertiary"
              onClick={() => log("bubble:   section")}
              onClickCapture={showCapture ? () => log("capture:  section") : undefined}
            >
              <div className="small text-muted mb-2">section</div>

              <Button
                variant="primary"
                onClickCapture={showCapture ? () => log("capture:  button") : undefined}
                onClick={(e) => {
                  if (stopInner) {
                    e.stopPropagation()
                    log("bubble:   button (STOPPED here)")
                  } else {
                    log("bubble:   button")
                  }
                }}
              >
                inner button
              </Button>
            </section>
          </div>

          <Card className="mt-3">
            <Card.Header className="small fw-semibold">
              The real-world case: a clickable card with a delete button
            </Card.Header>
            <Card.Body>
              <div
                role="button"
                className="border rounded-3 p-3 d-flex justify-content-between align-items-center"
                onClick={() => setCardOpens((n) => n + 1)}
              >
                <span className="small">Click anywhere to open · opened {cardOpens}×</span>
                <Button
                  size="sm"
                  variant="outline-danger"
                  onClick={(e) => {
                    if (stopInner) e.stopPropagation()
                    setDeletes((n) => n + 1)
                  }}
                >
                  Delete ({deletes})
                </Button>
              </div>
              <div className="small text-muted mt-2">
                With the switch off, one Delete click increments <em>both</em> counters.
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <LogPanel entries={entries} onClear={clear} height={420} title="Event phases" />
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "propagation", chapter: "7 — Events", title: "Bubbling & capture", element: <PropagationLab /> }`.

**Experiments:**

1. Click the section's padding rather than the button. Four log lines instead of six — the button isn't in the path, so its handlers never run. Event travel follows the DOM path, not the component list.
2. Add `onClick={(e) => { e.preventDefault(); log("prevented") }}` to a real `<a href="https://react.dev">`. The log fires, navigation doesn't. Remove `preventDefault` and the page leaves. That's the other method, doing the other job.
3. Add a native listener with `document.addEventListener("click", ...)` in an effect. It fires *after* React's bubble phase, because React 18 attaches its listeners at the root container. Worth knowing if you ever mix React with a non-React widget.

---

## 🧪 Lab 7.3 — `target` vs `currentTarget`, and typing

**Level:** depth

Create `src/demos/07-events/TargetLab.tsx`:

```tsx
import { useState } from "react"
import type { ChangeEventHandler, MouseEvent } from "react"
import { Button, Card, Col, Form, Row, Table } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"

interface ClickInfo {
  target: string
  currentTarget: string
}

export default function TargetLab() {
  const [info, setInfo] = useState<ClickInfo | null>(null)
  const [text, setText] = useState("")
  const [agreed, setAgreed] = useState(false)
  const [volume, setVolume] = useState(50)
  const [colour, setColour] = useState("#0d6efd")

  // Annotating the parameter — needed because the function is standalone.
  function handlePanelClick(e: MouseEvent<HTMLDivElement>) {
    setInfo({
      // currentTarget is precisely typed as HTMLDivElement
      currentTarget: `${e.currentTarget.tagName.toLowerCase()}.${e.currentTarget.className.split(" ")[0]}`,
      // target is EventTarget — we must narrow it before reading DOM properties
      target:
        e.target instanceof HTMLElement
          ? `${e.target.tagName.toLowerCase()}${e.target.textContent ? ` ("${e.target.textContent.trim().slice(0, 20)}")` : ""}`
          : "not an element",
    })
  }

  // Annotating the handler instead of the parameter — e is inferred.
  const handleTextChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setText(e.target.value)
  }

  return (
    <DemoCard
      title="target vs currentTarget, and how to type them"
      claim="currentTarget is the element you attached to and is precisely typed. target is wherever the event started and needs narrowing before use."
      level="depth"
      notice={
        <ul className="mb-0">
          <li>
            Click the panel's background, then the text, then the button.{" "}
            <code>currentTarget</code> never changes; <code>target</code> changes every time.
          </li>
          <li>
            <code>e.target</code> is typed <code>EventTarget</code> on a mouse event, which
            is why the code narrows with <code>instanceof HTMLElement</code>. TypeScript is
            being accurate, not awkward: <em>any</em> descendant could be the target.
          </li>
          <li>
            For form inputs <code>e.target.value</code> is precisely typed as a special
            case, because <code>ChangeEvent&lt;HTMLInputElement&gt;</code> declares it.
            That's why the idiomatic input handler needs no narrowing.
          </li>
          <li>
            Note the two annotation styles side by side:{" "}
            <code>(e: MouseEvent&lt;HTMLDivElement&gt;)</code> on the parameter, and{" "}
            <code>const h: ChangeEventHandler&lt;…&gt;</code> on the whole function.
          </li>
        </ul>
      }
    >
      <Row className="g-3">
        <Col lg={6}>
          <div
            className="panel-outer border border-2 rounded-3 p-4 bg-white"
            onClick={handlePanelClick}
          >
            <p className="small text-muted">
              This whole panel has the click handler. Click the background, this paragraph,
              or the button.
            </p>
            <Button variant="outline-primary" size="sm">
              A nested button
            </Button>
          </div>

          <Table bordered size="sm" className="mt-3 mb-0">
            <tbody>
              <tr>
                <td className="text-muted small" style={{ width: 140 }}>
                  currentTarget
                </td>
                <td className="font-monospace small">{info?.currentTarget ?? "—"}</td>
              </tr>
              <tr>
                <td className="text-muted small">target</td>
                <td className="font-monospace small">{info?.target ?? "—"}</td>
              </tr>
            </tbody>
          </Table>
        </Col>

        <Col lg={6}>
          <Card body>
            <div className="small fw-semibold text-muted mb-3">
              The typed properties you read for each input kind
            </div>

            <Form.Group className="mb-3">
              <Form.Label className="small">
                text → <code>e.target.value</code>
              </Form.Label>
              <Form.Control value={text} onChange={handleTextChange} placeholder="Type…" />
              <Form.Text>value: "{text}"</Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label={
                  <span className="small">
                    checkbox → <code>e.target.checked</code>
                  </span>
                }
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <Form.Text>checked: {String(agreed)}</Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small">
                range → <code>Number(e.target.value)</code>
              </Form.Label>
              <Form.Range
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
              />
              <Form.Text>
                volume: {volume} (a number, not the string "{volume}")
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-0">
              <Form.Label className="small">
                color → <code>e.target.value</code>
              </Form.Label>
              <Form.Control
                type="color"
                value={colour}
                onChange={(e) => setColour(e.target.value)}
                title="Pick a colour"
              />
              <Form.Text>colour: {colour}</Form.Text>
            </Form.Group>
          </Card>
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "target", chapter: "7 — Events", title: "target vs currentTarget", element: <TargetLab /> }`.

**Experiments:**

1. Remove the `instanceof HTMLElement` check and read `e.target.tagName` directly. TypeScript refuses: `Property 'tagName' does not exist on type 'EventTarget'`. This is a real possibility being flagged, not pedantry.
2. Delete `Number(...)` from the range handler and change `volume` state to accept a string. Now `volume + 10` produces `"5010"`. Input values are **always strings**, and this is the most common numeric bug in React forms.
3. Change `handlePanelClick`'s annotation to `MouseEvent<HTMLButtonElement>` and note that `currentTarget` typing changes while nothing else complains. The generic is a claim about which element you attached to — get it wrong and you get wrong autocomplete rather than an error.

---

## 🧪 Lab 7.4 — Keyboard, focus, and accessible interaction

**Level:** optional

Create `src/demos/07-events/KeyboardLab.tsx`:

```tsx
import { useState } from "react"
import { Badge, Button, Card, Col, Form, ListGroup, Row } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"

export default function KeyboardLab() {
  const [draft, setDraft] = useState("")
  const [items, setItems] = useState<string[]>(["Existing item"])
  const [lastKey, setLastKey] = useState("—")
  const [modifiers, setModifiers] = useState("")
  const [focusPath, setFocusPath] = useState<string[]>([])

  function commit() {
    const value = draft.trim()
    if (!value) return
    setItems((prev) => [value, ...prev])
    setDraft("")
  }

  return (
    <DemoCard
      title="Keyboard and focus events"
      claim="Enter to submit, Escape to cancel, and focus bubbling — the three interactions users expect and hand-rolled components usually miss."
      level="optional"
      notice={
        <ul className="mb-0">
          <li>
            Type something and press <kbd>Enter</kbd> — it commits. Press <kbd>Escape</kbd> —
            the draft clears. Neither needs a click, and both are what users try first.
          </li>
          <li>
            Hold <kbd>Shift</kbd>, <kbd>Ctrl</kbd> or <kbd>⌘</kbd> while typing and watch the
            modifier readout. That's how you build shortcuts like <kbd>⌘</kbd>+<kbd>Enter</kbd>.
          </li>
          <li>
            <code>onFocus</code> and <code>onBlur</code> <strong>bubble in React</strong>,
            unlike the native events. The card's handler sees focus land on any child, which
            is how you detect "the user is somewhere inside this form".
          </li>
          <li>
            Prefer a real <code>&lt;form onSubmit&gt;</code> over a keydown handler when the
            interaction <em>is</em> a submit — you get Enter handling, validation and
            assistive-technology support for free. This lab uses keydown to show the
            mechanics.
          </li>
        </ul>
      }
    >
      <Row className="g-3">
        <Col lg={7}>
          <Card
            onFocus={(e) => {
              const name =
                e.target instanceof HTMLElement
                  ? e.target.getAttribute("aria-label") ?? e.target.tagName.toLowerCase()
                  : "?"
              setFocusPath((prev) => [`focus → ${name}`, ...prev].slice(0, 6))
            }}
            onBlur={() => setFocusPath((prev) => ["blur", ...prev].slice(0, 6))}
          >
            <Card.Header className="small fw-semibold">
              Focus anywhere in this card
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label className="small">
                  Enter commits · Escape clears
                </Form.Label>
                <div className="d-flex gap-2">
                  <Form.Control
                    aria-label="new item"
                    value={draft}
                    placeholder="Type and press Enter"
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      setLastKey(e.key)
                      setModifiers(
                        [
                          e.shiftKey && "Shift",
                          e.ctrlKey && "Ctrl",
                          e.altKey && "Alt",
                          e.metaKey && "Meta",
                        ]
                          .filter(Boolean)
                          .join(" + ") || "none"
                      )

                      if (e.key === "Enter") {
                        e.preventDefault()
                        commit()
                      }
                      if (e.key === "Escape") {
                        setDraft("")
                      }
                    }}
                  />
                  <Button onClick={commit} aria-label="add item" disabled={!draft.trim()}>
                    Add
                  </Button>
                </div>
              </Form.Group>

              <div className="d-flex gap-3 small">
                <span>
                  last key: <Badge bg="dark">{lastKey}</Badge>
                </span>
                <span>
                  modifiers: <Badge bg="secondary">{modifiers || "none"}</Badge>
                </span>
              </div>
            </Card.Body>
          </Card>

          <ListGroup className="mt-3">
            {items.map((item, i) => (
              <ListGroup.Item key={`${item}-${i}`} className="small">
                {item}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Col>

        <Col lg={5}>
          <Card body className="h-100">
            <div className="small fw-semibold text-muted mb-2">
              Focus events seen by the card (they bubble)
            </div>
            {focusPath.length === 0 ? (
              <div className="small text-muted">Click into the input or the button.</div>
            ) : (
              <ul className="small font-monospace mb-0">
                {focusPath.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            )}
          </Card>
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "keyboard", chapter: "7 — Events", title: "Keyboard & focus", element: <KeyboardLab /> }`.

**Experiments:**

1. Remove `e.preventDefault()` from the Enter branch. Nothing changes here — but wrap the input in a `<form>` and it starts reloading the page, because Enter in a form is a submit. Prefer the form.
2. Check for `e.key === "Enter" && e.metaKey` to require ⌘+Enter. Note `e.key` is the *character* ("Enter", "a", "A"), while `e.code` is the *physical key* ("KeyA") — use `key` for text intent and `code` for game-style controls.
3. Add `tabIndex={0}` to the card and press Tab repeatedly. Focus order follows DOM order. Removing `tabIndex` makes non-interactive elements unfocusable — which is the correct default, and why using a `<div onClick>` for a button is an accessibility bug rather than a style choice.

✅ **Concept check 7**

1. What actually happens with `onClick={handleClick()}`, and what error does it often cause?
2. `preventDefault` vs `stopPropagation` — which stops the browser, and which stops ancestors?
3. Why is `e.target` typed loosely on a mouse event but precisely on a change event?
4. When do you need to annotate an event parameter's type, and when is it inferred?
5. What's the difference between `e.key` and `e.code`?

---

# 8. Forms & controlled components

Forms are where most of a real application's code lives. This section builds **one sign-up form, twelve times**, each step changing exactly one thing — so that when something gets easier you can see precisely what paid for it.

Every step has the same shape: **the idea**, then **the change** to make, then **run it**, then **what to notice**, then **experiments**. The prose section `§8.N` and `Lab 8.N` are the same step, side by side.

| Step | You change | And learn |
|---|---|---|
| **8.1** | one input, nothing else | the controlled loop |
| **8.2** | write `TextField` + `Signup` as markup | why finished markup can still do nothing |
| **8.3** | add `onChange` | where the value has to live |
| **8.4** | five `useState`s → one object | how to shape form state |
| **8.5** | add rules | validation, `touched`, and `handleSubmit`'s two exits |
| **8.6** | read every input type raw | `checked`, `valueAsNumber`, `files`, `selectedOptions` |
| **8.7** | wrap all eleven types | one contract, eleven components |
| **8.8** | grow the form to every input type | validating numbers, arrays, booleans and files |
| **8.9** | swap the rules for a schema | what zod replaces |
| **8.10** | look at uncontrolled inputs | the design the next step is built on |
| **8.11** | hand state to react-hook-form | `Controller` driving *your* components |
| **8.12** | add `zodResolver` | the two axes are independent |

Then two reference sections — [§8.13 choosing an approach](#813-choosing-an-approach) and [§8.14 accessibility](#814-accessibility-cheaply).

**Don't skip to 8.11.** react-hook-form is worth using and it's only legible once you've felt what it removes. When it does something surprising at 5pm, steps 8.3–8.5 are the mental model you'll debug it with.

## The files, and how they evolve

Two kinds of file, and telling them apart removes most of the confusion:

- **App files** — what you'd actually ship. These **evolve**: a later step edits a file an earlier step created.
- **Lab wrappers** (`*Lab.tsx`) — a thin `DemoCard` around the form, so the demo shell can render it. Nothing else imports them.

| App file | Created | Then edited by | What it is |
|---|---|---|---|
| `TextField.tsx` | 8.2 | 8.3 · 8.5 | The reusable text field. Absorbed into `fields.tsx` in 8.7. |
| `Signup.tsx` | 8.2 | 8.3 · 8.4 · 8.5 | **The small form.** Grows from inert markup to fully validated. |
| `signupValidation.ts` | 8.5 | — | The type, the empty value, and the pure `validateSignUp`. |
| `fields.tsx` | 8.7 | — | Eleven field components on one contract. |
| `signupFullValidation.ts` | 8.8 | — | The 14-field type, option lists, and `validateFull`. |
| `SignupFull.tsx` | 8.8 | — | **The full form**, every input type, manual state + rules. |
| `signupFullSchema.ts` | 8.9 | — | The zod schema, and the type inferred from it. |
| `SignupFullZod.tsx` | 8.9 | — | The full form with the schema instead of the validator. |
| `Field.tsx` | 8.11 | — | A typed `Controller` wrapper, so each field stays one block. |
| `SignupFullRHF.tsx` | 8.11 | — | react-hook-form driving the same components. |
| `SignupFullRHFZod.tsx` | 8.12 | — | …plus `zodResolver`. |

Steps 8.9, 8.11 and 8.12 create **new files rather than editing `SignupFull.tsx`**, deliberately: at the end you want all four versions side by side to compare, and §8.13 does exactly that.

---

## 8.1 One input: the controlled loop

Start with the smallest complete example. One piece of state, one input.

```tsx
function TitleField() {
  const [title, setTitle] = useState("")

  return (
    <Form.Control
      value={title}                                  // state → input
      onChange={(e) => setTitle(e.target.value)}     // input → state
    />
  )
}
```

Those two lines are a loop, and it's worth tracing once, slowly:

```
1. User presses "a"
2. The browser fires a change event
3. onChange runs → setTitle("a")
4. React re-renders TitleField
5. value={title} is now "a", so the input displays "a"
```

**The input never updates itself.** Step 5 is React putting the value back. The DOM node is a *display* of your state, not a container for it — §1.1's declarative model, applied to a text box.

That looks like a lot of machinery for typing a letter. What it buys is one guarantee: **the value in state is always exactly what's on screen.** Everything else in this section rests on it.

```tsx
const [title, setTitle] = useState("")

// Derived — always correct, no extra state, nothing to keep in sync
const charCount = title.length
const isTooLong = charCount > 60
const isEmpty = title.trim() === ""

// Transform on the way in
onChange={(e) => setTitle(e.target.value.slice(0, 60))}       // hard limit
onChange={(e) => setTitle(e.target.value.toUpperCase())}      // force case
onChange={(e) => setTitle(e.target.value.replace(/\D/g, ""))} // digits only

// Set it from anywhere
<Button onClick={() => setTitle("")}>Clear</Button>

// React to it
<Button disabled={isEmpty || isTooLong}>Save</Button>
```

None of those need a ref, a DOM read, or an effect — they're all just reading a string you already have. **Every one is awkward or impossible with an uncontrolled input**, which is the honest argument for the extra machinery (§8.7 makes the other side of the case).

**One rule to carry forward:** if you pass `value`, you must pass `onChange`. Without it the input is frozen and React warns.

> **TS Note.** Initialise text state to `""`, never `null` or `undefined`. `useState("")` infers `string`. `useState<string>()` infers `string | undefined`, and passing `undefined` to `value` silently makes the input **uncontrolled** — producing a confusing warning the moment you later set a real value.

## 🧪 Lab 8.1 — One controlled input

**Level:** core

The smallest complete form there is. Everything else in §8 grows out of this.

Create `src/demos/08-forms/SingleInputLab.tsx`:

```tsx
import { useState } from "react"
import { Alert, Badge, Button, Card, Col, Form, ProgressBar, Row } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import LogPanel from "@/lab/LogPanel"
import StateInspector from "@/lab/StateInspector"
import { useEventLog } from "@/lab/useEventLog"
import RenderBadge from "@/lab/RenderBadge"

const MAX = 40

export default function SingleInputLab() {
  // ---- the entire state of this form ----
  const [title, setTitle] = useState("")

  const { entries, log, clear } = useEventLog(12)
  const [transform, setTransform] = useState<"none" | "upper" | "digits">("none")

  // ---- everything below is DERIVED, not stored ----
  const charCount = title.length
  const remaining = MAX - charCount
  const trimmed = title.trim()
  const isEmpty = trimmed === ""
  const isTooLong = charCount > MAX
  const canSave = !isEmpty && !isTooLong

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value

    // Transform on the way in — only possible because we own the value
    const next =
      transform === "upper"
        ? raw.toUpperCase()
        : transform === "digits"
        ? raw.replace(/\D/g, "")
        : raw

    log(`onChange: "${raw}" → setTitle("${next}")`)
    setTitle(next)
  }

  return (
    <DemoCard
      title="One controlled input"
      claim="State flows into the input; the input's events flow back into state. That loop is the whole of controlled components, and everything else is derived from it."
      level="core"
      notice={
        <ul className="mb-0">
          <li>
            Type one character and read the log bottom-up: the event fires, the handler
            calls <code>setTitle</code>, the component re-renders, and{" "}
            <code>value={"{title}"}</code> puts the character on screen.{" "}
            <strong>The input never updated itself.</strong>
          </li>
          <li>
            The counter, the progress bar, the badge and the disabled button are all{" "}
            <strong>derived during render</strong> — four pieces of UI, one piece of state,
            nothing to keep in sync.
          </li>
          <li>
            Switch the transform to <strong>UPPERCASE</strong> or <strong>digits only</strong>{" "}
            and type. The value is rewritten on the way into state, so what you typed and
            what is stored can differ. This is impossible with an uncontrolled input.
          </li>
          <li>
            The render badge climbs by one per keystroke. That's the cost of control, and
            for one input it is irrelevant — Lab 8.7 shows where it stops being irrelevant.
          </li>
        </ul>
      }
    >
      <Row className="g-3">
        <Col lg={7}>
          <Card body>
            <Form.Group controlId="single-title" className="mb-3">
              <Form.Label className="d-flex justify-content-between align-items-center">
                <span>Task title</span>
                <RenderBadge label="renders" bg="primary" />
              </Form.Label>

              <Form.Control
                value={title}                      // ← state into the input
                onChange={handleChange}             // ← input back into state
                isInvalid={isTooLong}
                placeholder="Start typing…"
              />
              <Form.Control.Feedback type="invalid">
                That's {Math.abs(remaining)} character
                {Math.abs(remaining) === 1 ? "" : "s"} too long.
              </Form.Control.Feedback>
            </Form.Group>

            <div className="d-flex justify-content-between small text-muted mb-1">
              <span>
                {charCount} / {MAX}
              </span>
              <span>{remaining >= 0 ? `${remaining} left` : "over the limit"}</span>
            </div>
            <ProgressBar
              now={Math.min(100, (charCount / MAX) * 100)}
              variant={isTooLong ? "danger" : charCount > MAX * 0.8 ? "warning" : "success"}
              style={{ height: 5 }}
              className="mb-3"
            />

            <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
              <span className="small text-muted">transform on input:</span>
              {(["none", "upper", "digits"] as const).map((t) => (
                <Button
                  key={t}
                  size="sm"
                  variant={transform === t ? "dark" : "outline-dark"}
                  onClick={() => setTransform(t)}
                >
                  {t === "none" ? "none" : t === "upper" ? "UPPERCASE" : "digits only"}
                </Button>
              ))}
            </div>

            <div className="d-flex gap-2">
              <Button disabled={!canSave}>
                Save {canSave ? "" : "(disabled — derived)"}
              </Button>
              <Button
                variant="outline-secondary"
                onClick={() => {
                  setTitle("")
                  log('reset: setTitle("")')
                }}
              >
                Clear
              </Button>
              <Button
                variant="outline-secondary"
                onClick={() => {
                  setTitle("Set from code")
                  log('setTitle("Set from code")')
                }}
              >
                Set from code
              </Button>
            </div>
          </Card>

          <Alert variant="light" className="border small mt-3 mb-0">
            <div className="fw-semibold mb-1">Derived from one string</div>
            <div className="d-flex flex-wrap gap-3">
              <span>
                empty: <Badge bg={isEmpty ? "danger" : "success"}>{String(isEmpty)}</Badge>
              </span>
              <span>
                too long:{" "}
                <Badge bg={isTooLong ? "danger" : "success"}>{String(isTooLong)}</Badge>
              </span>
              <span>
                can save:{" "}
                <Badge bg={canSave ? "success" : "secondary"}>{String(canSave)}</Badge>
              </span>
              <span>
                trimmed length: <Badge bg="secondary">{trimmed.length}</Badge>
              </span>
            </div>
          </Alert>
        </Col>

        <Col lg={5}>
          <StateInspector label="title" value={title} />
          <div className="mt-3">
            <LogPanel entries={entries} onClear={clear} height={260} title="The loop" />
          </div>
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register it in `src/demos/registry.tsx`:

```tsx
import SingleInputLab from "@/demos/08-forms/SingleInputLab"

{ id: "single-input", chapter: "8 — Forms", title: "One controlled input", element: <SingleInputLab /> },
```

**Run it:** `npm run dev`, then open `#single-input`.

**Experiments — the first two are the point of the lab:**

1. **Delete `onChange` from the `Form.Control`.** The input freezes completely — you can't type. Check the console: React warns that you provided `value` without `onChange`. **Half a loop is not a loop.** Then add `readOnly` and the warning disappears, because now you've *said* that's what you meant.
2. **Delete `value={title}` instead, keeping `onChange`.** Now you *can* type, and the state inspector updates — but the input is uncontrolled, so the "Set from code" and "Clear" buttons stop working. State no longer drives the display. This is the precise difference between the two models, in one edit.
3. Change `useState("")` to `useState<string>()`. TypeScript is happy, but `value={undefined}` makes the input uncontrolled on the first render, and typing produces React's "changing an uncontrolled input to be controlled" warning. **Always initialise text state to `""`** — §8.1's TS Note, met for real.
4. Turn on **digits only** and type letters. Nothing appears, because the transform stripped them before they reached state. Now try the same with an uncontrolled input — you'd need to write to the DOM node yourself and fight the cursor position.
5. Add a live preview: `<h5>{title || "Untitled"}</h5>`. One line, no extra state, always correct. That's what having the value in state is *for*.

---

## 8.2 Structure first: `TextField` and `Signup`

A sign-up form's fields differ in only three ways — their label, their id, and their type or placeholder. Everything else is identical: a `Form.Group`, a `Form.Label`, a `Form.Control`, and the spacing between them.

So write that shape once and make the three differences props:

```tsx
import { Form } from "react-bootstrap"

interface TextFieldProps {
  controlId: string
  label: string
  value: string
  type?: string
  placeholder?: string
}

function TextField({ controlId, label, value, type = "text", placeholder }: TextFieldProps) {
  return (
    <Form.Group className="mb-3" controlId={controlId}>
      <Form.Label>{label}</Form.Label>
      <Form.Control value={value} type={type} placeholder={placeholder} />
    </Form.Group>
  )
}

export default TextField
```

Three small pieces of API design, worth naming:

- **`controlId` is a prop, not a constant.** Bootstrap uses it to wire the label to the input, so hard-coding it would give every instance the same `id` — invalid HTML, and clicking any label would focus the first field. Reusability isn't only about the visible text.
- **`type` has a default.** Text fields say nothing; password fields say `type="password"`. Defaults keep the common case quiet.
- **`placeholder` is optional**, because a password field doesn't want one.

Now the form is four declarations:

```tsx
<Form onSubmit={handleRegisterSubmit}>
  <TextField controlId="signUp.fname" label="First Name" value=""
             placeholder="Enter Your First Name" />
  <TextField controlId="signUp.lname" label="Last Name" value=""
             placeholder="Enter Your Last Name" />
  <TextField controlId="signUp.username" label="Username" value="" type="email"
             placeholder="Enter Your Email" />
  <TextField controlId="signUp.password" label="Password" value="" type="password" />

  <Button variant="primary" type="submit">Register</Button>
</Form>
```

**The markup is finished and the form does nothing.** Every field is pinned to `value=""` with no `onChange`, so you can't type, and React says so:

```
Warning: You provided a `value` prop to a form field without an `onChange` handler.
This will render a read-only field.
```

That's §8.1's loop with step 3 missing: state flows *into* the input and nothing flows back.

**Building it inert first is deliberate.** Forms fail in two unrelated ways, and mixing them is what makes them feel hard. Getting the *structure* right is a composition problem (§3): what are the props, where does the id come from, what's optional. Getting the *behaviour* right is a state problem (§6, §9): who owns the value, who may change it. Finish the first and the second becomes one focused question — which is §8.3.

---

## 🧪 Lab 8.2 — `TextField` and `Signup`: the structure

**Level:** core

### The change

Create `src/demos/08-forms/TextField.tsx` — exactly the five-prop version above.

Create `src/demos/08-forms/Signup.tsx`:

```tsx
import { Button, Form } from "react-bootstrap"
import TextField from "@/demos/08-forms/TextField"

function Signup() {
  function handleRegisterSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    console.log("Register submitted — but with what?")
  }

  return (
    <>
      <h1>Sign Up Form</h1>

      <Form onSubmit={handleRegisterSubmit}>
        <TextField
          controlId="signUp.fname"
          label="First Name"
          value=""
          placeholder="Enter Your First Name"
        />

        <TextField
          controlId="signUp.lname"
          label="Last Name"
          value=""
          placeholder="Enter Your Last Name"
        />

        <TextField
          controlId="signUp.username"
          label="Username"
          value=""
          type="email"
          placeholder="Enter Your Email"
        />

        <TextField
          controlId="signUp.password"
          label="Password"
          value=""
          type="password"
        />

        <Button variant="primary" type="submit">
          Register
        </Button>
      </Form>
    </>
  )
}

export default Signup
```

### Run it

Create `src/demos/08-forms/SignupLab.tsx` — the wrapper you'll reuse for steps 8.2 through 8.5:

```tsx
import { Alert, Card, Col, Row } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import Signup from "@/demos/08-forms/Signup"

export default function SignupLab() {
  return (
    <DemoCard
      title="Signup — the form as it stands"
      claim="Finished markup that does nothing: value with no onChange is half a loop."
      level="core"
      notice={
        <ul className="mb-0">
          <li>
            <strong>Try to type. You can't.</strong> Every field is pinned to{" "}
            <code>value=""</code> and nothing reports changes, so React re-applies the empty
            string after every keystroke.
          </li>
          <li>
            <strong>Open the console.</strong> React names the problem exactly: a{" "}
            <code>value</code> prop without an <code>onChange</code> handler renders a
            read-only field.
          </li>
          <li>
            Press <strong>Register</strong>. <code>handleRegisterSubmit</code> runs and has
            nothing to submit — the values were never in React.
          </li>
          <li>
            <strong>None of it is wasted.</strong> The layout, the labels, the unique{" "}
            <code>controlId</code>s and the four-line call sites are all correct and won't
            change again. Only the wiring is missing.
          </li>
        </ul>
      }
    >
      <Row className="g-3">
        <Col lg={7}>
          <Card body>
            <Signup />
          </Card>
        </Col>
        <Col lg={5}>
          <Alert variant="warning">
            <div className="fw-semibold mb-2">What's missing</div>
            <ul className="small mb-2">
              <li>
                <code>value</code> — state into the input ✅ (hard-coded to <code>""</code>)
              </li>
              <li>
                <code>onChange</code> — the input back into state ❌
              </li>
            </ul>
            <p className="small mb-0">
              <code>TextField</code> can't own that state itself — it would become four
              private boxes the form can't read. That's §8.3.
            </p>
          </Alert>
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register it:

```tsx
import SignupLab from "@/demos/08-forms/SignupLab"

{ id: "signup", chapter: "8 — Forms", title: "Signup (evolving: 8.2–8.5)", element: <SignupLab /> },
```

Open `#signup`. You'll come back to this same entry after each of the next three steps.

### Experiments

1. **Type in a field with the console open.** Nothing appears and React tells you why. Meeting this warning deliberately, once, is worth more than reading about it — it's the most common React form error there is.
2. **Give all four fields the same `controlId`** (`"signUp.fname"`). Now click each label: focus always lands on the *first* input, because duplicate `id`s are invalid HTML and the browser takes the first match. **This is why `controlId` is a prop** — reusability isn't only about labels.
3. **Add `readOnly` to the `Form.Control` inside `TextField`.** The warning disappears and the form is still useless. A silenced warning is not a fixed bug.
4. **Swap `value={value}` for `defaultValue={value}`.** Now you *can* type — but `Signup` still can't read anything, because the values live in the DOM. That's the uncontrolled path; §8.7 covers when it's the right choice.
5. **Change one thing in `TextField`** — wrap the label in `<strong>`. All four fields change at once. That's the return on extracting the component before adding behaviour.

---

## 8.3 Wiring it up: where the value lives

There are exactly two places the value could live, and only one of them works.

**Option 1 — `TextField` owns it.** The version most people write first:

```tsx
function TextField({ controlId, label, type, placeholder }: TextFieldProps) {
  const [value, setValue] = useState("")          // ❌ a dead end
  return (
    <Form.Group controlId={controlId}>
      <Form.Label>{label}</Form.Label>
      <Form.Control value={value} onChange={(e) => setValue(e.target.value)}
                    type={type} placeholder={placeholder} />
    </Form.Group>
  )
}
```

Each field now works in isolation — and the form is still useless, because **data flows down and the parent cannot reach in.** `Signup` has four private boxes it can't read, and a form is precisely "something that collects several values and does one thing with them". There's no patch for this; it's the wrong shape.

**Option 2 — the parent owns it, the field reports changes.** One more prop:

```tsx
interface TextFieldProps {
  controlId: string
  label: string
  value: string
  onChange: (value: string) => void      // ← the missing half of the loop
  type?: string
  placeholder?: string
}
```

and in the JSX:

```tsx
<Form.Control
  value={value}
  type={type}
  placeholder={placeholder}
  onChange={(e) => onChange(e.target.value)}
/>
```

### `onChange` reports a value, not an event

That signature is a deliberate boundary decision:

```tsx
onChange: (value: string) => void                     // ✅ the parent's vocabulary
onChange: (e: ChangeEvent<HTMLInputElement>) => void  // ❌ leaks the DOM upward
```

The first lets callers write `onChange={setFirstName}` with no wrapper, and keeps them ignorant of the fact that this happens to be an `<input>` — so you could later swap in a masked input, a combobox, or a third-party control without touching a single call site. The second forces every caller to unwrap `e.target.value` and couples them all to the implementation. **Callbacks should report what happened in the parent's terms** (§3.6).

### What just happened

**The state moved up.** It didn't disappear — `Signup` holds it now, which is what lets `handleRegisterSubmit` see all the values at once. That's **lifting state up** (§9); forms are simply the situation that forces it soonest.

**`TextField` became a controlled component.** It takes a `value` and reports changes through `onChange`, exactly like `<input>` itself. §9.3 formalises that contract — and §8.12 shows the payoff, when a form library turns out to expect precisely this shape.

> **The rule worth remembering:** a field component should own **no state at all.** It renders what it's given and reports what the user did. Every field from here on follows that shape, which is why steps 8.5 through 8.12 can change validation strategy twice and swap in a form library without editing `TextField` again.

---

## 🧪 Lab 8.3 — Wiring it up

**Level:** core

### The change

**1. Update `src/demos/08-forms/TextField.tsx`** — one new prop, one new line:

```tsx
import { Form } from "react-bootstrap"

interface TextFieldProps {
  controlId: string
  label: string
  value: string
  onChange: (value: string) => void      // ← NEW
  type?: string
  placeholder?: string
}

function TextField({
  controlId,
  label,
  value,
  onChange,                               // ← NEW
  type = "text",
  placeholder,
}: TextFieldProps) {
  return (
    <Form.Group className="mb-3" controlId={controlId}>
      <Form.Label>{label}</Form.Label>
      <Form.Control
        value={value}
        type={type}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}   // ← NEW
      />
    </Form.Group>
  )
}

export default TextField
```

**2. Update `src/demos/08-forms/Signup.tsx`** — the parent takes ownership:

```tsx
import { useState } from "react"
import { Button, Form } from "react-bootstrap"
import TextField from "@/demos/08-forms/TextField"

function Signup() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  function handleRegisterSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // Now there is something to submit
    console.log("Register submitted", { firstName, lastName, username, password })
  }

  return (
    <>
      <h1>Sign Up Form</h1>

      <Form onSubmit={handleRegisterSubmit}>
        <TextField
          controlId="signUp.fname"
          label="First Name"
          value={firstName}
          onChange={setFirstName}
          placeholder="Enter Your First Name"
        />

        <TextField
          controlId="signUp.lname"
          label="Last Name"
          value={lastName}
          onChange={setLastName}
          placeholder="Enter Your Last Name"
        />

        <TextField
          controlId="signUp.username"
          label="Username"
          type="email"
          value={username}
          onChange={setUsername}
          placeholder="Enter Your Email"
        />

        <TextField
          controlId="signUp.password"
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
        />

        <Button variant="primary" type="submit">
          Register
        </Button>
      </Form>
    </>
  )
}

export default Signup
```

### Run it

`SignupLab.tsx` is unchanged — it already renders `<Signup />`. Reopen `#signup`.

Update the wrapper's `claim` and `notice` if you like, or just read the form: it now works.

### What to notice

- **`onChange={setFirstName}` needs no wrapper.** That's the payoff for `TextField` reporting a *value* rather than an event. Had it passed the event up, every call site would read `onChange={(e) => setFirstName(e.target.value)}`.
- **`TextField` didn't gain any state.** The state count went from zero to four — all of it in `Signup`.
- **`handleRegisterSubmit` is the only place that sees all four values.** The fields don't know about each other, and don't need to.
- **The form is now four `useState` calls and four setters.** Fine at four fields; §8.4 asks what happens at fifteen.

### Experiments

1. **Log inside `TextField`'s `onChange`** as well as in the parent's setter. One keystroke, one call each — the loop from §8.1, now spanning two components.
2. **Change `onChange` to pass the event** (`onChange: (e: ChangeEvent<HTMLInputElement>) => void`, and `onChange={onChange}` on the control). Every call site now needs `onChange={(e) => setFirstName(e.target.value)}`. Undo it, and note what you'd lose if you later swapped the `<input>` for a masked control.
3. **Try Option 1 for real** — put `useState` inside `TextField` and delete the props. The fields still work individually; now try to make `handleRegisterSubmit` read them. You can't, without a ref-and-reach-in hack or a callback prop — and a callback prop *is* Option 2.
4. **Add a live preview** to `Signup`: `<p>Hello, {firstName || "stranger"}</p>`. One line, always correct. That's what having the values in state is *for*.

---

## 8.4 Where the values live: four `useState`s or one object?

`Signup` now declares four pieces of state and four setters. That's completely fine — and it's the moment to notice the pattern, because it's about to repeat.

**Option A — one `useState` per field.** Direct, obvious, no ceremony, and `onChange={setFirstName}` works with no wrapper.

The costs appear as the form grows:

```tsx
// reset — one call per field, and forgetting one is a silent bug
setFirstName(""); setLastName(""); setUsername(""); setPassword("")

// submit — the object is assembled by hand at every call site
onSubmit({ firstName, lastName, username, password })

// "has anything changed?" — four comparisons, and a fifth when you add a field
const isDirty = firstName !== "" || lastName !== "" || username !== "" || password !== ""
```

**Option B — one object plus a typed updater:**

```tsx
export interface SignUpValues {
  firstName: string
  lastName: string
  username: string
  password: string
}

export const emptySignUp: SignUpValues = {
  firstName: "", lastName: "", username: "", password: "",
}

const [values, setValues] = useState<SignUpValues>(emptySignUp)

function update<K extends keyof SignUpValues>(field: K, value: SignUpValues[K]) {
  setValues((prev) => ({ ...prev, [field]: value }))
}
```

consumed like this:

```tsx
<TextField
  controlId="signUp.fname"
  label="First Name"
  value={values.firstName}
  onChange={(v) => update("firstName", v)}
/>
```

That generic signature is §0.8.6 in production, and it's worth writing from memory. `K extends keyof SignUpValues` means "field is one of this object's key names"; `SignUpValues[K]` means "the type of the value at that key". So **the second argument's type depends on the first argument's value**:

```tsx
update("firstName", "Ada")     // ✅
update("password", 12345)      // ❌ number is not assignable to string
update("frstName", "typo")     // ❌ not a key of SignUpValues
```

A plain `(field: string, value: any)` accepts both mistakes and gives you neither autocomplete nor safety.

Note the parentheses around the returned object literal — without them JavaScript reads `{` as a function body and returns `undefined`, wiping your state.

What Option B buys:

```tsx
setValues(emptySignUp)                                // reset — one call
onSubmit(values)                                      // submit — already the right shape
const isDirty = JSON.stringify(values) !== JSON.stringify(emptySignUp)
localStorage.setItem("draft", JSON.stringify(values)) // persist — one line
```

**Option C — `useReducer`**, when the fields *interact*: choosing a country resets the region, picking "other" reveals a text box, one field's validity depends on two others. At that point the update rules deserve their own tested function, and §13 is the section for it.

**The rule of thumb:** independent values → separate state. Values that always travel together → one object. Values that change *each other* → a reducer.

Notice what does **not** change between A and B: `TextField`. It takes a `value` and an `onChange` and has no opinion about where the value is kept. That's the return on making it stateless in §8.3 — you can change the parent's entire storage strategy without touching a field.

### Should `update` itself be the prop?

A reasonable-looking idea, once you've written `onChange={(v) => update("firstName", v)}` four times: pass the updater down and let the field call it.

```tsx
// tempting
<TextField controlId="signUp.fname" name="firstName" label="First Name"
           value={values.firstName} onUpdate={update} />
// …and inside TextField: onChange={(e) => onUpdate(name, e.target.value)}
```

**Don't.** It costs more than it saves, for three reasons:

1. **It couples the field to the parent's state shape.** `update` is `<K extends keyof SignUpValues>(field: K, value: SignUpValues[K]) => void`. To type `onUpdate`, `TextField` would have to know about `SignUpValues` — or become generic over it. A component whose only job is to render a label and an input now has a type parameter tied to whichever form uses it.
2. **It breaks Option A.** That version has no `update` function at all; it passes `onChange={setFirstName}`. If `TextField` demanded `onUpdate(name, value)`, Option A couldn't use it — and the whole point is that *one field component serves both*.
3. **It breaks every form library.** `Controller` (§8.12) hands your component `{ value, onChange, onBlur }` where `onChange` takes a bare value. A field expecting `onUpdate(name, value)` can't be driven by it, so you'd be rewriting the component the moment you adopt react-hook-form.

`onChange: (value: string) => void` is the shape the whole ecosystem agrees on, and the arrow at the call site is a feature rather than a cost — it's the one place that says *which* field this is.

**If the repetition genuinely bothers you**, the fix belongs in the form, not the field. A helper next to the state removes it without teaching `TextField` anything:

```tsx
function fieldProps<K extends keyof SignUpValues>(name: K, label: string) {
  return {
    controlId: `signUp.${name}`,
    label,
    value: values[name],
    onChange: (v: SignUpValues[K]) => update(name, v),
  }
}

<TextField {...fieldProps("firstName", "First Name")} placeholder="Enter Your First Name" />
<TextField {...fieldProps("lastName",  "Last Name")}  placeholder="Enter Your Last Name" />
<TextField {...fieldProps("password",  "Password")}   type="password" />
```

Same output, one place to change the `controlId` convention, and `TextField`'s props untouched. The general rule: **when call sites get repetitive, add a helper at the call site — don't widen the component's contract.**

---

## 🧪 Lab 8.4 — Four `useState`s vs one object

**Level:** core

### The change

**1. Create `src/demos/08-forms/signupValidation.ts`** — for now just the type and the empty value. The rules arrive in 8.5.

```ts
export interface SignUpValues {
  firstName: string
  lastName: string
  username: string
  password: string
}

export const emptySignUp: SignUpValues = {
  firstName: "",
  lastName: "",
  username: "",
  password: "",
}
```

> **Why not in `Signup.tsx`?** Because §8.5's rules, §8.6's schema and §8.9's form all need this type, and a component is the wrong home for a shared type. Putting it in its own module now saves a move later.

**2. Update `src/demos/08-forms/Signup.tsx`** to Option B:

```tsx
import { useState } from "react"
import { Button, Form } from "react-bootstrap"
import TextField from "@/demos/08-forms/TextField"
import { emptySignUp, type SignUpValues } from "@/demos/08-forms/signupValidation"

function Signup() {
  const [values, setValues] = useState<SignUpValues>(emptySignUp)

  function update<K extends keyof SignUpValues>(field: K, value: SignUpValues[K]) {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  function handleRegisterSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    console.log("Register submitted", values)   // already the right shape
  }

  return (
    <>
      <h1>Sign Up Form</h1>

      <Form onSubmit={handleRegisterSubmit}>
        <TextField
          controlId="signUp.fname"
          label="First Name"
          value={values.firstName}
          onChange={(v) => update("firstName", v)}
          placeholder="Enter Your First Name"
        />

        <TextField
          controlId="signUp.lname"
          label="Last Name"
          value={values.lastName}
          onChange={(v) => update("lastName", v)}
          placeholder="Enter Your Last Name"
        />

        <TextField
          controlId="signUp.username"
          label="Username"
          type="email"
          value={values.username}
          onChange={(v) => update("username", v)}
          placeholder="Enter Your Email"
        />

        <TextField
          controlId="signUp.password"
          label="Password"
          type="password"
          value={values.password}
          onChange={(v) => update("password", v)}
        />

        <div className="d-flex gap-2">
          <Button variant="primary" type="submit">
            Register
          </Button>
          <Button
            type="button"
            variant="outline-secondary"
            onClick={() => setValues(emptySignUp)}   // reset — one call
          >
            Reset
          </Button>
        </div>
      </Form>
    </>
  )
}

export default Signup
```

### Run it

Reopen `#signup`. Behaviour is identical to 8.3 — plus a Reset button that took one line.

To see both options side by side, add a `StateInspector` to `SignupLab.tsx`… except `values` lives inside `Signup`. That's the honest limitation of a thin wrapper, and it's the reason `SignupLab` mostly just frames the form. If you want the inspector, lift `values` into the lab and pass it down — and notice that you've just made `Signup` a controlled component too, which is §9.3 all over again, one level up.

### What to notice

- **`update` is four lines and replaces four setters.** Reset went from four calls to one; submit went from assembling an object to passing one.
- **`TextField` is byte-for-byte unchanged.** The parent's storage strategy changed completely and the field didn't move.
- **`emptySignUp` is the single source of "blank".** Reset, dirty-checking and `useState`'s initial value all read it, so a new field can't be forgotten in one of them.
- **`update("password", 12345)` won't compile.** The generic ties the value's type to the field name.

### Experiments

1. **Add a fifth field (`email`).** With Option B: one line in the interface, one in `emptySignUp`, one `TextField`. Now do the same to the 8.3 version and count — interface, `useState`, `TextField`, reset, submit. Then deliberately forget the reset line and press Reset: the stale field survives, which is exactly the bug the comparison predicts.
2. **Change `update` to `(field: string, value: any)`.** Everything still compiles, including `update("password", 12345)`. Add that to a button and watch the password field render a number. Restore the generic and watch the same line become a compile error.
3. **Add the `fieldProps` helper** from §8.4 and convert all four call sites. Shorter, and `TextField` still knows nothing about it.
4. **Try a nested field** — `address: { city: string }`. `update("address", { city: "Berlin" })` works, but there's no way to update just the city without a second function. Notice how fast nested state gets tedious; that's the argument for keeping form state **flat**.

---

## 8.5 Manual validation

Three questions, and they're independent. Muddling them is what makes hand-rolled validation feel harder than it is:

1. **What are the rules?**
2. **When do you run them?**
3. **When do you *show* the result?**

### The rules: a pure function

Keep validation out of your components. A function from values to errors is testable without rendering anything (§21), reusable on a server, and impossible to get out of sync:

```ts
export type SignUpErrors = Partial<Record<keyof SignUpValues, string>>

export function validateSignUp(values: SignUpValues): SignUpErrors {
  const errors: SignUpErrors = {}

  if (!values.firstName.trim()) errors.firstName = "First name is required."
  if (!values.lastName.trim()) errors.lastName = "Last name is required."

  if (!values.username.trim()) errors.username = "Email is required."
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.username))
    errors.username = "That doesn't look like an email address."

  if (!values.password) errors.password = "Password is required."
  else if (values.password.length < 8) errors.password = "Use at least 8 characters."
  else if (!/\d/.test(values.password)) errors.password = "Include at least one number."

  return errors
}
```

`Partial<Record<keyof SignUpValues, string>>` is the right type: at most one message per field, with the field names checked against the values type so a typo is a compile error.

### When to run them: every render

**Derive errors; never store them.**

```tsx
const errors = validateSignUp(values)               // ✅ recomputed each render
const isValid = Object.keys(errors).length === 0    // ✅ derived from that
```

This is §10 applied to forms, and the payoff is concrete. A stored `setErrors(validateSignUp(values))` inside `update` validates the *previous* values, so errors lag one keystroke behind — type a valid email, delete a character quickly, and the message is wrong. Deriving cannot have that bug.

### What `handleSubmit` does with them

The submit handler is where validation actually *decides* something:

```tsx
function handleRegisterSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault()
  setSubmitAttempted(true)

  const result = validateSignUp(values)

  if (Object.keys(result).length > 0) {
    console.warn("❌ Submit blocked — validation failed")
    console.table(result)                  // one row per bad field
    return                                  // ← nothing invalid leaves the form
  }

  console.info("✅ Valid — submitting", values)
  // await createAccount(values)
}
```

`console.table(errors)` prints a readable grid of field → message, which beats squinting at a nested object. `console.warn` and `console.info` colour differently in DevTools, so a blocked submit is visually distinct from a successful one while you're building.

**The guard clause matters more than the logging.** That `return` means there is exactly one path out of `handleRegisterSubmit` that reaches your API, and it's only reachable with valid data.

### When to show them: the `touched` question

Running the rules constantly does **not** mean displaying the results constantly.

| Strategy | Behaviour | Use when |
|---|---|---|
| On submit | Errors appear only after a submit attempt | Short forms — least annoying |
| On blur | Each field validates when you leave it | Medium forms with format rules |
| On change, after first touch | Live feedback, but only for visited fields | Long forms, password rules |
| On change, always | An error under "Password" before you've typed the second character | Almost never — it's hostile |

The last row is why the `touched` flag exists: you want live feedback *after* the user has engaged with a field, not before.

```tsx
const [touched, setTouched] = useState<Partial<Record<keyof SignUpValues, boolean>>>({})

function errorFor(field: keyof SignUpValues): string | undefined {
  if (!errors[field]) return undefined
  return touched[field] || submitAttempted ? errors[field] : undefined
}
```

Note the separation once more: **`errors` says what is wrong, `errorFor` says whether to mention it yet, and `TextField` says how it looks.** Three concerns, three places.

Add `noValidate` to the `<form>` so the browser's own validation bubbles don't compete with yours in a different visual language.

---

## 🧪 Lab 8.5 — Manual validation

**Level:** core

This step completes the hand-rolled form. `Signup.tsx` doesn't change again after this.

### The change

**1. Add the rules to `src/demos/08-forms/signupValidation.ts`:**

```ts
export interface SignUpValues {
  firstName: string
  lastName: string
  username: string
  password: string
}

export const emptySignUp: SignUpValues = {
  firstName: "",
  lastName: "",
  username: "",
  password: "",
}

export type SignUpErrors = Partial<Record<keyof SignUpValues, string>>

/** Pure: values in, errors out. No React, no DOM, no side effects. */
export function validateSignUp(values: SignUpValues): SignUpErrors {
  const errors: SignUpErrors = {}

  if (!values.firstName.trim()) errors.firstName = "First name is required."
  if (!values.lastName.trim()) errors.lastName = "Last name is required."

  if (!values.username.trim()) errors.username = "Email is required."
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.username))
    errors.username = "That doesn't look like an email address."

  if (!values.password) errors.password = "Password is required."
  else if (values.password.length < 8) errors.password = "Use at least 8 characters."
  else if (!/\d/.test(values.password)) errors.password = "Include at least one number."

  return errors
}
```

**2. Update `src/demos/08-forms/TextField.tsx`** — three more props, and then it stops changing:

```tsx
interface TextFieldProps {
  controlId: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  onBlur?: () => void      // ← NEW: tells the parent this field was visited
  error?: string           // ← NEW: validation is DISPLAYED here, never decided here
  hint?: string            // ← NEW: help text, hidden while an error shows
}

function TextField({
  controlId, label, value, onChange,
  type = "text", placeholder, onBlur, error, hint,
}: TextFieldProps) {
  return (
    <Form.Group className="mb-3" controlId={controlId}>
      <Form.Label>{label}</Form.Label>
      <Form.Control
        value={value}
        type={type}
        placeholder={placeholder}
        isInvalid={Boolean(error)}                       // ← NEW
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}                                  // ← NEW
      />
      {hint && !error && <Form.Text>{hint}</Form.Text>}   {/* ← NEW */}
      <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
    </Form.Group>
  )
}

export default TextField
```

**`error` is a prop, not internal state.** The field renders whatever message it's handed and has no opinion about where it came from — which is exactly why steps 8.6, 8.8 and 8.9 change validation strategy without touching this file again.

**3. Update `src/demos/08-forms/Signup.tsx`** — the finished hand-rolled form:

```tsx
import { useState } from "react"
import { Button, Form } from "react-bootstrap"
import TextField from "@/demos/08-forms/TextField"
import {
  emptySignUp,
  validateSignUp,
  type SignUpValues,
} from "@/demos/08-forms/signupValidation"

type Touched = Partial<Record<keyof SignUpValues, boolean>>

function Signup() {
  const [values, setValues] = useState<SignUpValues>(emptySignUp)
  const [touched, setTouched] = useState<Touched>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)

  // Derived every render — never stored (§10)
  const errors = validateSignUp(values)
  const isValid = Object.keys(errors).length === 0

  function update<K extends keyof SignUpValues>(field: K, value: SignUpValues[K]) {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  function touch(field: keyof SignUpValues) {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  /** Should this field's error be visible yet? */
  function errorFor(field: keyof SignUpValues): string | undefined {
    if (!errors[field]) return undefined
    return touched[field] || submitAttempted ? errors[field] : undefined
  }

  function handleRegisterSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitAttempted(true)

    const result = validateSignUp(values)

    if (Object.keys(result).length > 0) {
      console.warn("❌ Submit blocked — validation failed")
      console.table(result)
      return // ← the guard: nothing invalid reaches the API
    }

    console.info("✅ Valid — submitting", values)
    // await createAccount(values)

    setValues(emptySignUp)
    setTouched({})
    setSubmitAttempted(false)
  }

  return (
    <>
      <h1>Sign Up Form</h1>

      <Form onSubmit={handleRegisterSubmit} noValidate>
        <TextField
          controlId="signUp.fname"
          label="First Name"
          value={values.firstName}
          onChange={(v) => update("firstName", v)}
          onBlur={() => touch("firstName")}
          error={errorFor("firstName")}
          placeholder="Enter Your First Name"
        />

        <TextField
          controlId="signUp.lname"
          label="Last Name"
          value={values.lastName}
          onChange={(v) => update("lastName", v)}
          onBlur={() => touch("lastName")}
          error={errorFor("lastName")}
          placeholder="Enter Your Last Name"
        />

        <TextField
          controlId="signUp.username"
          label="Username"
          type="email"
          value={values.username}
          onChange={(v) => update("username", v)}
          onBlur={() => touch("username")}
          error={errorFor("username")}
          placeholder="Enter Your Email"
        />

        <TextField
          controlId="signUp.password"
          label="Password"
          type="password"
          value={values.password}
          onChange={(v) => update("password", v)}
          onBlur={() => touch("password")}
          error={errorFor("password")}
          hint="At least 8 characters, including a number."
        />

        <div className="d-flex gap-2">
          <Button variant="primary" type="submit" disabled={submitAttempted && !isValid}>
            Register
          </Button>
          <Button
            type="button"
            variant="outline-secondary"
            onClick={() => {
              setValues(emptySignUp)
              setTouched({})
              setSubmitAttempted(false)
            }}
          >
            Reset
          </Button>
        </div>
      </Form>
    </>
  )
}

export default Signup
```

### Run it

Reopen `#signup`, **with the browser console visible.**

### What to notice

- **Submit the empty form.** You get `console.warn` plus a `console.table` with four rows — field against message. Fill one field, submit again: three rows.
- **`errors` is recomputed by a pure function on every render.** There's no `setErrors`, so an error can never contradict the value beside it.
- **Errors stay hidden until you leave a field** (or press Register). Tab through without typing and watch them appear one at a time — that's `touched` doing its job.
- **The `return` in the blocked branch is the important line**, not the logging. Exactly one path out of the handler reaches your API.
- **`TextField` is unchanged from 8.3 apart from three display props.** Validation is decided by the parent and displayed by the field.

### Experiments

1. **Store the errors instead of deriving them.** Add `const [stored, setStored] = useState<SignUpErrors>({})` and call `setStored(validateSignUp(values))` inside `update`. Type a valid email, then delete a character quickly — the message lags one keystroke behind, because you validated the *previous* values. Deriving cannot have this bug.
2. **Delete the `return` in the blocked branch.** The form now "submits" invalid data while also logging the failure. That one keyword is the entire guard.
3. **Make `errorFor` return the message unconditionally.** Reload and start typing your first name: an error appears under a field you haven't finished. That's why `touched` exists.
4. **Test the rules with no renderer.** Create `signupValidation.test.ts` and assert on `validateSignUp({...})` directly — no `render`, no DOM, no `act`. That's the payoff for extracting the rules, and it's §21's argument in miniature.
5. **Add a `confirmPassword` field.** One line in the interface, one in `emptySignUp`, one rule (`if (values.confirmPassword !== values.password) …`), one `TextField`. Note the cross-field rule is *free* here, because `validateSignUp` sees every value at once — remember that when you meet §8.8's version of the same rule.

---

## 8.6 Every input type, read raw

Every field so far has been text. Real forms aren't, and each input type exposes its value on a
different property. Getting this wrong is a five-minute confusion each time:

```tsx
<Form.Control            onChange={(e) => setText(e.target.value)} />              // string
<Form.Control type="number" onChange={(e) => setAge(e.target.valueAsNumber)} />    // number (NaN if empty)
<Form.Check type="checkbox"  onChange={(e) => setOk(e.target.checked)} />          // boolean
<Form.Check type="radio"     onChange={(e) => setChoice(e.target.value)} />        // string
<Form.Select             onChange={(e) => setRole(e.target.value)} />              // string
<Form.Control type="date"    onChange={(e) => setDue(e.target.value)} />           // "2026-03-01"
<Form.Control type="file"    onChange={(e) => setFile(e.target.files?.[0] ?? null)} /> // File | null
<Form.Control as="textarea"  onChange={(e) => setNotes(e.target.value)} />         // string
```

**Every `value` is a string.** `type="number"` does not give you a number from `e.target.value`; it
gives you `"42"`. Use `valueAsNumber` (which is `NaN` when empty, so guard it), or `Number(...)`, or —
best — coerce once at the schema boundary with `z.coerce.number()`. Skipping this is how
`total + price` becomes `"1099"`.

**Multi-select** needs a different read entirely:

```tsx
<Form.Select multiple onChange={(e) =>
  setTags(Array.from(e.target.selectedOptions, (o) => o.value))
} />
```

**A checkbox group isn't one value** — it's an array you add to and filter from:

```tsx
onChange={(e) => setTags((prev) =>
  e.target.checked ? [...prev, tag] : prev.filter((t) => t !== tag)
)}
```

**A file input is always uncontrolled.** You cannot set its value from code — browsers forbid it,
because a page that could pre-fill a file path could steal files.

**Typing a `<select>`.** `e.target.value` is `string`, not your union, so you need a cast or a guard
at that boundary:

```tsx
onChange={(e) => setRole(e.target.value as Role)}          // fine for hard-coded options

const isRole = (v: string): v is Role =>
  v === "viewer" || v === "editor" || v === "admin"
onChange={(e) => { if (isRole(e.target.value)) setRole(e.target.value) }}   // for untrusted values
```

Use the assertion for options you control in the same file; use the guard for anything from an API, a
URL parameter, or `localStorage`. Step 8.7 makes this automatic — a generic `SelectField<T>` puts the
cast inside the component, once.

## 🧪 Lab 8.6 — Every input kind, correctly typed

**Level:** core

A reference you'll come back to. Each field shows the property you read and the type you get — raw, with no wrapper. Step 8.7 turns every one of these into a reusable component.

Create `src/demos/08-forms/InputKindsLab.tsx`:

```tsx
import { useId, useState } from "react"
import { Card, Col, Form, Row, Table } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import StateInspector from "@/lab/StateInspector"

type Priority = "low" | "medium" | "high"
type Plan = "free" | "pro" | "team"

const priorities = ["low", "medium", "high"] as const
const isPriority = (v: string): v is Priority =>
  (priorities as readonly string[]).includes(v)

interface FormState {
  title: string
  quantity: number
  priority: Priority
  plan: Plan
  agreed: boolean
  tags: string[]
  due: string
  notes: string
  fileName: string | null
}

export default function InputKindsLab() {
  const uid = useId()
  const [state, setState] = useState<FormState>({
    title: "",
    quantity: 1,
    priority: "medium",
    plan: "pro",
    agreed: false,
    tags: ["ops"],
    due: "",
    notes: "",
    fileName: null,
  })

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <DemoCard
      title="Every input kind, correctly typed"
      claim="Different inputs expose their value on different properties, and every one of them is a string until you convert it."
      level="core"
      notice={
        <ul className="mb-0">
          <li>
            <strong>Number:</strong> <code>e.target.valueAsNumber</code> gives a number but{" "}
            <code>NaN</code> when the field is empty — hence the guard. Reading{" "}
            <code>e.target.value</code> would give you the string <code>"3"</code>.
          </li>
          <li>
            <strong>Select:</strong> the value is <code>string</code>, so a union-typed
            state needs the type guard. Compare the two selects: one validates, one asserts.
          </li>
          <li>
            <strong>Checkbox:</strong> <code>checked</code>, not <code>value</code>. The
            multi-checkbox group builds an array by adding or filtering.
          </li>
          <li>
            <code>useId()</code> generates the ids for the radio group, so this component
            can be rendered twice on a page without duplicate ids. Never use a counter.
          </li>
        </ul>
      }
    >
      <Row className="g-4">
        <Col lg={7}>
          <Card body>
            <Row className="g-3">
              <Col sm={6}>
                <Form.Group controlId={`${uid}-title`}>
                  <Form.Label className="small">
                    text → <code>value</code>
                  </Form.Label>
                  <Form.Control
                    value={state.title}
                    onChange={(e) => set("title", e.target.value)}
                    placeholder="A string"
                  />
                </Form.Group>
              </Col>

              <Col sm={6}>
                <Form.Group controlId={`${uid}-qty`}>
                  <Form.Label className="small">
                    number → <code>valueAsNumber</code>
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    value={state.quantity}
                    onChange={(e) => {
                      const n = e.target.valueAsNumber
                      set("quantity", Number.isNaN(n) ? 0 : n)
                    }}
                  />
                </Form.Group>
              </Col>

              <Col sm={6}>
                <Form.Group controlId={`${uid}-priority`}>
                  <Form.Label className="small">
                    select → guarded with a predicate ✅
                  </Form.Label>
                  <Form.Select
                    value={state.priority}
                    onChange={(e) => {
                      if (isPriority(e.target.value)) set("priority", e.target.value)
                    }}
                  >
                    {priorities.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col sm={6}>
                <Form.Group controlId={`${uid}-due`}>
                  <Form.Label className="small">
                    date → <code>value</code> as "YYYY-MM-DD"
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={state.due}
                    onChange={(e) => set("due", e.target.value)}
                  />
                </Form.Group>
              </Col>

              <Col sm={12}>
                <div className="small mb-1">
                  radio group → <code>value</code>, ids from <code>useId</code>
                </div>
                <div className="d-flex gap-3">
                  {(["free", "pro", "team"] as const).map((plan) => (
                    <Form.Check
                      key={plan}
                      type="radio"
                      id={`${uid}-plan-${plan}`}
                      name={`${uid}-plan`}
                      label={plan}
                      value={plan}
                      checked={state.plan === plan}
                      onChange={(e) => set("plan", e.target.value as Plan)}
                    />
                  ))}
                </div>
              </Col>

              <Col sm={12}>
                <div className="small mb-1">
                  checkbox group → build an array from <code>checked</code>
                </div>
                <div className="d-flex gap-3">
                  {["ops", "writing", "urgent"].map((tag) => (
                    <Form.Check
                      key={tag}
                      type="checkbox"
                      id={`${uid}-tag-${tag}`}
                      label={tag}
                      checked={state.tags.includes(tag)}
                      onChange={(e) =>
                        set(
                          "tags",
                          e.target.checked
                            ? [...state.tags, tag]
                            : state.tags.filter((t) => t !== tag)
                        )
                      }
                    />
                  ))}
                </div>
              </Col>

              <Col sm={12}>
                <Form.Group controlId={`${uid}-notes`}>
                  <Form.Label className="small">
                    textarea → <code>value</code>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={state.notes}
                    onChange={(e) => set("notes", e.target.value)}
                  />
                </Form.Group>
              </Col>

              <Col sm={8}>
                <Form.Group controlId={`${uid}-file`}>
                  <Form.Label className="small">
                    file → <code>files?.[0]</code>
                  </Form.Label>
                  <Form.Control
                    type="file"
                    onChange={(e) => {
                      // e.target is HTMLInputElement, so .files exists
                      const input = e.target as HTMLInputElement
                      set("fileName", input.files?.[0]?.name ?? null)
                    }}
                  />
                  <Form.Text>
                    A file input is always uncontrolled — you cannot set its value from
                    code, for security reasons.
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col sm={4} className="d-flex align-items-end">
                <Form.Check
                  type="switch"
                  id={`${uid}-agreed`}
                  label={
                    <span className="small">
                      switch → <code>checked</code>
                    </span>
                  }
                  checked={state.agreed}
                  onChange={(e) => set("agreed", e.target.checked)}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        <Col lg={5}>
          <StateInspector label="form" value={state} />

          <Table bordered size="sm" className="mt-3 mb-0 small">
            <thead className="table-light">
              <tr>
                <th>Input</th>
                <th>Read</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>text / textarea</td><td><code>value</code></td><td>string</td></tr>
              <tr><td>number</td><td><code>valueAsNumber</code></td><td>number | NaN</td></tr>
              <tr><td>checkbox / switch</td><td><code>checked</code></td><td>boolean</td></tr>
              <tr><td>radio</td><td><code>value</code></td><td>string</td></tr>
              <tr><td>select</td><td><code>value</code></td><td>string</td></tr>
              <tr><td>select multiple</td><td><code>selectedOptions</code></td><td>HTMLCollection</td></tr>
              <tr><td>date</td><td><code>value</code></td><td>"YYYY-MM-DD"</td></tr>
              <tr><td>file</td><td><code>files</code></td><td>FileList | null</td></tr>
            </tbody>
          </Table>
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "input-kinds", chapter: "8 — Forms", title: "Every input kind", element: <InputKindsLab /> }`.

**Experiments:**

1. Change the number handler to `set("quantity", e.target.value as unknown as number)`. Now type `5` and look at the inspector: `"quantity": "5"` — a string in a field typed `number`. The cast lied and TypeScript believed it. Then compute `state.quantity * 2` somewhere and watch it produce `NaN`… or `"55"`, depending on the operator. This is why casts are a last resort.
2. Clear the number field entirely. Without the `Number.isNaN` guard, state becomes `NaN`, `JSON.stringify` renders it as `null`, and any arithmetic downstream is poisoned. Empty numeric inputs are a genuinely awkward case; decide deliberately whether empty means `0`, `null`, or invalid.
3. Change the guarded select to `set("priority", e.target.value as Priority)` and add `<option value="urgent">urgent</option>`. It compiles, it renders, and state now holds a value outside its own type. The guard version silently ignores it instead — neither is *right*, but only one is a lie.

---

---

## 8.7 A component for every input type

You did this for text in §8.2–8.3: one component, `value` in, `onChange(value)` out, no internal
state. Every other input type deserves the same treatment, and for the same reason — each type's
awkward read gets solved **once**, inside the component, instead of at every call site.

The contract, unchanged: **`value` in, `onChange(value)` out, `error` displayed not decided, no
internal state.**

What that buys, type by type:

| Component | Solves, once |
|---|---|
| `NumberField` | `valueAsNumber` and what an empty box means — hands back a real `number` |
| `CheckboxField` | `checked` rather than `value` — hands back a `boolean` |
| `CheckboxGroupField` | add/filter into an array — hands back `string[]` |
| `RadioGroupField` | the shared `name` that makes options mutually exclusive |
| `SelectField<T>` | the `as T` cast, inside the component — the parent keeps its narrow union |
| `MultiSelectField<T>` | `selectedOptions` instead of `value` |
| `DateField` | the ISO-string convention |
| `RangeField` | `Number(e.target.value)` |
| `FileField` | `files?.[0]`, and the fact that it can never be controlled |

Two are worth calling out. **`SelectField<T>` is generic**, so `onChange` hands back your union rather
than `string` — the cast lives in one place instead of at every `<Form.Select>`. And **all of them
share a `FieldShell`**, so a change to the label/hint/feedback structure lands on all eleven at once.

## 🧪 Lab 8.7 — A field component for every input type

**Level:** core — the component library §8.8 onwards is built on

The sign-up form works, validates, and runs on react-hook-form — and every field in it is text. Real forms aren't: they have selects, radios, checkboxes, dates, files and ranges. Step 8.6 showed *which property to read* for each; this lab wraps every one in the same controlled contract you gave `TextField` in §8.3. Step 8.8 then builds the whole form from them.

**The contract, for all of them:** `value` in, `onChange(value)` out, `error` displayed not decided, no internal state.

> **What happens to `TextField.tsx`?** It moves in here. `fields.tsx` exports its own `TextField`
> with the identical contract, now sharing a `FieldShell` with ten siblings — so a change to the
> label/hint/feedback structure lands on every field type at once. Once you've created `fields.tsx`,
> **delete `TextField.tsx`** and repoint the two imports that used it, in `Signup.tsx`:
>
> ```diff
> - import TextField from "@/demos/08-forms/TextField"
> + import { TextField } from "@/demos/08-forms/fields"
> ```
>
> (Note the braces: `fields.tsx` uses named exports, because one file now holds eleven components.)
> If you'd rather keep the earlier labs frozen as they were, leave `TextField.tsx` alone — but then be
> clear with yourself about which of the two you're editing.

Create `src/demos/08-forms/fields.tsx` — one file, ten components:

```tsx
import { Form, InputGroup } from "react-bootstrap"
import type { ReactNode } from "react"

// ---------------------------------------------------------------- shared shell
interface FieldShellProps {
  controlId: string
  label: ReactNode
  error?: string
  hint?: string
  children: ReactNode
}

/** Label + control + hint/feedback. Every field below reuses it. */
function FieldShell({ controlId, label, error, hint, children }: FieldShellProps) {
  return (
    <Form.Group className="mb-3" controlId={controlId}>
      <Form.Label className="small fw-semibold">{label}</Form.Label>
      {children}
      {hint && !error && <Form.Text>{hint}</Form.Text>}
      <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
    </Form.Group>
  )
}

interface BaseProps {
  /** Unique id for the label/control pair — same prop as TextField's. */
  controlId: string
  label: string
  error?: string
  hint?: string
  disabled?: boolean
}

// ---------------------------------------------------------------- 1. text-like
export interface TextFieldProps extends BaseProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  type?: "text" | "email" | "password" | "tel" | "url" | "search"
  placeholder?: string
  autoComplete?: string
}

export function TextField({
  controlId, label, value, onChange, onBlur, error, hint,
  type = "text", placeholder, autoComplete, disabled,
}: TextFieldProps) {
  return (
    <FieldShell controlId={controlId} label={label} error={error} hint={hint}>
      <Form.Control
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        isInvalid={Boolean(error)}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />
    </FieldShell>
  )
}

// ---------------------------------------------------------------- 2. number
export interface NumberFieldProps extends BaseProps {
  value: number
  /** Always a number — never the string the DOM hands you. */
  onChange: (value: number) => void
  onBlur?: () => void
  min?: number
  max?: number
  step?: number
  /** What an empty box means. Default 0. */
  emptyValue?: number
  prefix?: string
  suffix?: string
}

export function NumberField({
  controlId, label, value, onChange, onBlur, error, hint,
  min, max, step, emptyValue = 0, prefix, suffix, disabled,
}: NumberFieldProps) {
  const control = (
    <Form.Control
      type="number"
      value={Number.isNaN(value) ? "" : value}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      isInvalid={Boolean(error)}
      onChange={(e) => {
        // valueAsNumber is NaN when the box is empty — decide once, here
        const n = e.target.valueAsNumber
        onChange(Number.isNaN(n) ? emptyValue : n)
      }}
      onBlur={onBlur}
    />
  )
  return (
    <FieldShell controlId={controlId} label={label} error={error} hint={hint}>
      {prefix || suffix ? (
        <InputGroup hasValidation>
          {prefix && <InputGroup.Text>{prefix}</InputGroup.Text>}
          {control}
          {suffix && <InputGroup.Text>{suffix}</InputGroup.Text>}
          <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
        </InputGroup>
      ) : (
        control
      )}
    </FieldShell>
  )
}

// ---------------------------------------------------------------- 3. textarea
export interface TextAreaFieldProps extends BaseProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  rows?: number
  maxLength?: number
  placeholder?: string
}

export function TextAreaField({
  controlId, label, value, onChange, onBlur, error, hint,
  rows = 3, maxLength, placeholder, disabled,
}: TextAreaFieldProps) {
  const counter = maxLength ? `${value.length}/${maxLength}` : undefined
  return (
    <FieldShell
      controlId={controlId}
      label={
        <span className="d-flex justify-content-between">
          <span>{label}</span>
          {counter && (
            <span className={value.length > maxLength! ? "text-danger" : "text-muted"}>
              {counter}
            </span>
          )}
        </span>
      }
      error={error}
      hint={hint}
    >
      <Form.Control
        as="textarea"
        rows={rows}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        isInvalid={Boolean(error)}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />
    </FieldShell>
  )
}

// ---------------------------------------------------------------- 4. select
export interface Option<T extends string> {
  value: T
  label: string
  disabled?: boolean
}

export interface SelectFieldProps<T extends string> extends BaseProps {
  value: T
  /** Generic, so the parent keeps its narrow union — no cast at the call site. */
  onChange: (value: T) => void
  onBlur?: () => void
  options: readonly Option<T>[]
  placeholder?: string
}

export function SelectField<T extends string>({
  controlId, label, value, onChange, onBlur, options, error, hint, placeholder, disabled,
}: SelectFieldProps<T>) {
  return (
    <FieldShell controlId={controlId} label={label} error={error} hint={hint}>
      <Form.Select
        value={value}
        disabled={disabled}
        isInvalid={Boolean(error)}
        // The cast lives HERE, once, instead of at every call site
        onChange={(e) => onChange(e.target.value as T)}
        onBlur={onBlur}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </Form.Select>
    </FieldShell>
  )
}

// ---------------------------------------------------------------- 5. multi-select
export interface MultiSelectFieldProps<T extends string> extends BaseProps {
  value: readonly T[]
  onChange: (value: T[]) => void
  options: readonly Option<T>[]
  size?: number
}

export function MultiSelectField<T extends string>({
  controlId, label, value, onChange, options, error, hint, size = 4, disabled,
}: MultiSelectFieldProps<T>) {
  return (
    <FieldShell controlId={controlId} label={label} error={error} hint={hint}>
      <Form.Select
        multiple
        htmlSize={size}
        value={value as string[]}
        disabled={disabled}
        isInvalid={Boolean(error)}
        onChange={(e) =>
          // selectedOptions, not value — the one genuinely different read
          onChange(Array.from(e.target.selectedOptions, (o) => o.value as T))
        }
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Form.Select>
    </FieldShell>
  )
}

// ---------------------------------------------------------------- 6. checkbox / switch
export interface CheckboxFieldProps extends Omit<BaseProps, "label"> {
  label: ReactNode
  checked: boolean
  /** `checked`, not `value` — the single most-forgotten property. */
  onChange: (checked: boolean) => void
  onBlur?: () => void
  type?: "checkbox" | "switch"
}

export function CheckboxField({
  controlId, label, checked, onChange, onBlur, error, hint, type = "checkbox", disabled,
}: CheckboxFieldProps) {
  return (
    <Form.Group className="mb-3">
      <Form.Check
        id={controlId}
        type={type}
        label={<span className="small">{label}</span>}
        checked={checked}
        disabled={disabled}
        isInvalid={Boolean(error)}
        feedback={error}
        feedbackType="invalid"
        onChange={(e) => onChange(e.target.checked)}
        onBlur={onBlur}
      />
      {hint && !error && <Form.Text>{hint}</Form.Text>}
    </Form.Group>
  )
}

// ---------------------------------------------------------------- 7. radio group
export interface RadioGroupFieldProps<T extends string> extends BaseProps {
  value: T
  onChange: (value: T) => void
  options: readonly Option<T>[]
  inline?: boolean
}

export function RadioGroupField<T extends string>({
  controlId, label, value, onChange, options, error, hint, inline = true, disabled,
}: RadioGroupFieldProps<T>) {
  return (
    <Form.Group className="mb-3">
      <Form.Label className="small fw-semibold d-block">{label}</Form.Label>
      <div className={inline ? "d-flex flex-wrap gap-3" : ""}>
        {options.map((o, i) => (
          <Form.Check
            key={o.value}
            type="radio"
            id={`${controlId}.${o.value}`}
            // One shared `name` is what makes them mutually exclusive
            name={controlId}
            label={<span className="small">{o.label}</span>}
            value={o.value}
            checked={value === o.value}
            disabled={disabled || o.disabled}
            isInvalid={Boolean(error) && i === options.length - 1}
            feedback={i === options.length - 1 ? error : undefined}
            feedbackType="invalid"
            onChange={(e) => onChange(e.target.value as T)}
          />
        ))}
      </div>
      {hint && !error && <Form.Text>{hint}</Form.Text>}
    </Form.Group>
  )
}

// ---------------------------------------------------------------- 8. checkbox group
export interface CheckboxGroupFieldProps<T extends string> extends BaseProps {
  /** An ARRAY — a checkbox group is not one value. */
  value: readonly T[]
  onChange: (value: T[]) => void
  options: readonly Option<T>[]
  inline?: boolean
}

export function CheckboxGroupField<T extends string>({
  controlId, label, value, onChange, options, error, hint, inline = true, disabled,
}: CheckboxGroupFieldProps<T>) {
  function toggle(option: T, checked: boolean) {
    onChange(checked ? [...value, option] : value.filter((v) => v !== option))
  }
  return (
    <Form.Group className="mb-3">
      <Form.Label className="small fw-semibold d-block">{label}</Form.Label>
      <div className={inline ? "d-flex flex-wrap gap-3" : ""}>
        {options.map((o) => (
          <Form.Check
            key={o.value}
            type="checkbox"
            id={`${controlId}.${o.value}`}
            label={<span className="small">{o.label}</span>}
            checked={value.includes(o.value)}
            disabled={disabled || o.disabled}
            onChange={(e) => toggle(o.value, e.target.checked)}
          />
        ))}
      </div>
      {error ? (
        <div className="text-danger small mt-1">{error}</div>
      ) : (
        hint && <Form.Text>{hint}</Form.Text>
      )}
    </Form.Group>
  )
}

// ---------------------------------------------------------------- 9. date / time
export interface DateFieldProps extends BaseProps {
  /** ISO "YYYY-MM-DD" (or "HH:mm" for time) — a string, deliberately. */
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  type?: "date" | "time" | "datetime-local" | "month"
  min?: string
  max?: string
}

export function DateField({
  controlId, label, value, onChange, onBlur, error, hint,
  type = "date", min, max, disabled,
}: DateFieldProps) {
  return (
    <FieldShell controlId={controlId} label={label} error={error} hint={hint}>
      <Form.Control
        type={type}
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        isInvalid={Boolean(error)}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />
    </FieldShell>
  )
}

// ---------------------------------------------------------------- 10. range
export interface RangeFieldProps extends BaseProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  format?: (value: number) => string
}

export function RangeField({
  controlId, label, value, onChange, error, hint,
  min = 0, max = 100, step = 1, format, disabled,
}: RangeFieldProps) {
  return (
    <Form.Group className="mb-3" controlId={controlId}>
      <Form.Label className="small fw-semibold d-flex justify-content-between">
        <span>{label}</span>
        <span className="text-muted">{format ? format(value) : value}</span>
      </Form.Label>
      <Form.Range
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {error ? (
        <div className="text-danger small">{error}</div>
      ) : (
        hint && <Form.Text>{hint}</Form.Text>
      )}
    </Form.Group>
  )
}

// ---------------------------------------------------------------- 11. file
export interface FileFieldProps extends BaseProps {
  /** Files can't be set from code, so we hold the File object, not a value. */
  file: File | null
  onChange: (file: File | null) => void
  accept?: string
}

export function FileField({
  controlId, label, file, onChange, error, hint, accept, disabled,
}: FileFieldProps) {
  return (
    <FieldShell
      controlId={controlId}
      label={label}
      error={error}
      hint={hint ?? (file ? `${file.name} · ${Math.round(file.size / 1024)} KB` : undefined)}
    >
      <Form.Control
        type="file"
        accept={accept}
        disabled={disabled}
        isInvalid={Boolean(error)}
        // Always uncontrolled: no `value` prop is possible, for security reasons
        onChange={(e) => {
          const input = e.target as HTMLInputElement
          onChange(input.files?.[0] ?? null)
        }}
      />
    </FieldShell>
  )
}
```

Now a demo that exercises all eleven. Create `src/demos/08-forms/AllFieldsLab.tsx`:

```tsx
import { useState } from "react"
import { Alert, Button, Card, Col, Form, Row } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import StateInspector from "@/lab/StateInspector"
import {
  TextField, NumberField, TextAreaField, SelectField, MultiSelectField,
  CheckboxField, RadioGroupField, CheckboxGroupField, DateField, RangeField, FileField,
} from "@/demos/08-forms/fields"

const ROLES = [
  { value: "viewer", label: "Viewer" },
  { value: "editor", label: "Editor" },
  { value: "admin", label: "Admin" },
] as const
type Role = (typeof ROLES)[number]["value"]

const PLANS = [
  { value: "free", label: "Free" },
  { value: "pro", label: "Pro" },
  { value: "team", label: "Team" },
] as const
type Plan = (typeof PLANS)[number]["value"]

const INTERESTS = [
  { value: "react", label: "React" },
  { value: "typescript", label: "TypeScript" },
  { value: "testing", label: "Testing" },
  { value: "design", label: "Design" },
] as const
type Interest = (typeof INTERESTS)[number]["value"]

interface Everything {
  fullName: string
  email: string
  password: string
  age: number
  salary: number
  bio: string
  role: Role
  languages: string[]
  plan: Plan
  interests: Interest[]
  startDate: string
  startTime: string
  experience: number
  newsletter: boolean
  terms: boolean
  avatarName: string | null
}

const empty: Everything = {
  fullName: "", email: "", password: "", age: 18, salary: 50000, bio: "",
  role: "viewer", languages: [], plan: "free", interests: [],
  startDate: "", startTime: "09:00", experience: 3,
  newsletter: true, terms: false, avatarName: null,
}

export default function AllFieldsLab() {
  const [v, setV] = useState<Everything>(empty)
  const [avatar, setAvatar] = useState<File | null>(null)

  function set<K extends keyof Everything>(key: K, value: Everything[K]) {
    setV((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <DemoCard
      title="A field component for every input type"
      claim="Eleven input types, one contract: value in, onChange(value) out, error displayed not decided, no internal state. Every form after this is a list of declarative lines."
      level="core"
      notice={
        <ul className="mb-0">
          <li>
            <strong>Every field reports a usable value, not an event.</strong>{" "}
            <code>NumberField</code> gives a <code>number</code> (never the string{" "}
            <code>"42"</code>), <code>CheckboxField</code> gives a{" "}
            <code>boolean</code>, <code>CheckboxGroupField</code> gives an{" "}
            <code>array</code>. Each type's awkward read is solved <em>once</em>, inside the
            component.
          </li>
          <li>
            <code>SelectField&lt;T&gt;</code> and the group fields are{" "}
            <strong>generic</strong>, so the parent keeps its narrow union.{" "}
            <code>set("role", ...)</code> only accepts a valid <code>Role</code> — the cast
            lives inside the component instead of at every call site (§8.7).
          </li>
          <li>
            <code>NumberField</code> decides what an empty box means (<code>emptyValue</code>)
            in one place. Clear the Age box and watch state stay a number rather than
            becoming <code>NaN</code>.
          </li>
          <li>
            <code>FileField</code> takes <code>file</code>, not <code>value</code> — a file
            input can never be controlled, because browsers forbid setting its value from
            code.
          </li>
          <li>
            The radio group passes <code>controlId</code> as the shared HTML{" "}
            <code>name</code>, which is what makes the options mutually exclusive. Remove it
            and you get three independent radios that can all be on at once.
          </li>
        </ul>
      }
    >
      <Row className="g-4">
        <Col lg={7}>
          <Card body>
            <Form noValidate>
              <Row className="g-0">
                <Col sm={6} className="pe-sm-2">
                  <TextField
                    controlId="allFields.fullName" label="Full name" value={v.fullName}
                    onChange={(x) => set("fullName", x)} placeholder="Ada Lovelace"
                  />
                </Col>
                <Col sm={6} className="ps-sm-2">
                  <TextField
                    controlId="allFields.email" label="Email" type="email" value={v.email}
                    onChange={(x) => set("email", x)} placeholder="ada@example.com"
                  />
                </Col>
              </Row>

              <TextField
                controlId="allFields.password" label="Password" type="password" value={v.password}
                onChange={(x) => set("password", x)} hint="At least 8 characters."
              />

              <Row className="g-0">
                <Col sm={6} className="pe-sm-2">
                  <NumberField
                    controlId="allFields.age" label="Age" value={v.age} min={0} max={120}
                    onChange={(x) => set("age", x)} hint="Clear the box — state stays a number."
                  />
                </Col>
                <Col sm={6} className="ps-sm-2">
                  <NumberField
                    controlId="allFields.salary" label="Salary" value={v.salary} step={1000}
                    prefix="£" suffix="/yr" onChange={(x) => set("salary", x)}
                  />
                </Col>
              </Row>

              <TextAreaField
                controlId="allFields.bio" label="Bio" value={v.bio} rows={3} maxLength={140}
                onChange={(x) => set("bio", x)} placeholder="A sentence about yourself"
              />

              <Row className="g-0">
                <Col sm={6} className="pe-sm-2">
                  <SelectField
                    controlId="allFields.role" label="Role" value={v.role} options={ROLES}
                    onChange={(x) => set("role", x)}
                  />
                </Col>
                <Col sm={6} className="ps-sm-2">
                  <MultiSelectField
                    controlId="allFields.languages" label="Languages (ctrl/cmd-click)"
                    value={v.languages} size={3}
                    options={[
                      { value: "en", label: "English" },
                      { value: "fr", label: "French" },
                      { value: "de", label: "German" },
                      { value: "hi", label: "Hindi" },
                    ]}
                    onChange={(x) => set("languages", x)}
                  />
                </Col>
              </Row>

              <RadioGroupField
                controlId="allFields.plan" label="Plan" value={v.plan} options={PLANS}
                onChange={(x) => set("plan", x)}
              />

              <CheckboxGroupField
                controlId="allFields.interests" label="Interests" value={v.interests} options={INTERESTS}
                onChange={(x) => set("interests", x)} hint="Pick any number."
              />

              <Row className="g-0">
                <Col sm={6} className="pe-sm-2">
                  <DateField
                    controlId="allFields.startDate" label="Start date" value={v.startDate}
                    onChange={(x) => set("startDate", x)} hint='Stored as "YYYY-MM-DD"'
                  />
                </Col>
                <Col sm={6} className="ps-sm-2">
                  <DateField
                    controlId="allFields.startTime" label="Start time" type="time" value={v.startTime}
                    onChange={(x) => set("startTime", x)}
                  />
                </Col>
              </Row>

              <RangeField
                controlId="allFields.experience" label="Years of experience" value={v.experience}
                min={0} max={20} onChange={(x) => set("experience", x)}
                format={(n) => `${n} yr${n === 1 ? "" : "s"}`}
              />

              <FileField
                controlId="allFields.avatar" label="Avatar" file={avatar} accept="image/*"
                onChange={(f) => {
                  setAvatar(f)
                  set("avatarName", f?.name ?? null)
                }}
              />

              <CheckboxField
                controlId="allFields.newsletter" type="switch" label="Send me the newsletter"
                checked={v.newsletter} onChange={(x) => set("newsletter", x)}
              />

              <CheckboxField
                controlId="allFields.terms" label="I accept the terms"
                checked={v.terms} onChange={(x) => set("terms", x)}
              />

              <Button variant="outline-secondary" size="sm" onClick={() => { setV(empty); setAvatar(null) }}>
                Reset all
              </Button>
            </Form>
          </Card>
        </Col>

        <Col lg={5}>
          <div className="small fw-semibold text-muted mb-2">
            One state object — note the types
          </div>
          <StateInspector label="values" value={v} />
          <Alert variant="light" className="border small mt-3 mb-0">
            <div className="fw-semibold mb-1">Read the types in the inspector</div>
            <code>age</code> and <code>experience</code> are numbers,{" "}
            <code>newsletter</code> is a boolean, <code>interests</code> and{" "}
            <code>languages</code> are arrays, dates are strings. Nothing needed converting
            at the call site, because each field component did it.
          </Alert>
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "all-fields", chapter: "8 — Forms", title: "A component for every type", element: <AllFieldsLab /> }`.

**Experiments:**

1. **Clear the Age box.** State stays `0`, not `NaN`, because `NumberField` handles `valueAsNumber`'s empty case once. Now set `emptyValue={NaN}` and clear it again — the inspector shows `null` (JSON can't represent `NaN`) and any arithmetic downstream is poisoned. **Deciding what "empty" means is a real design decision; make it once, in the component.**
2. **Try `set("role", "owner")`.** Compile error — `SelectField<Role>` inferred `T` from the options, so the parent's union is preserved end to end with no cast at the call site. Compare with the raw version in Lab 8.6, where every `<Form.Select>` needed `as Role`.
3. **Remove `name={controlId}` from `RadioGroupField`'s `Form.Check`.** All three plans can now be selected at once — the shared `name` attribute is what makes radios mutually exclusive, and React doesn't do that for you.
4. **Add a `required` prop to `FieldShell`** that renders a red asterisk. Every one of the eleven field types gets it at once, because they all share the shell. That's the return on extracting it.
5. **Pass `error="Something's wrong"` to any field.** It renders correctly without the component knowing anything about validation — which is what makes §8.8 onwards possible.

---

---

---

## 8.8 The full form: every input type

`Signup.tsx` proved the mechanics on four text fields. Now scale it: **one field of every type**, using the eleven components from §8.7 — and nothing else changes. Same `useState`, same `update`, same `touched`, same derived errors, same two-exit `handleSubmit`.

That's the claim worth testing. If the pattern from §8.3–8.5 was right, adding ten new *kinds* of input should cost only new rules, never new machinery.

### One new thing: validating values that aren't strings

The only genuinely new work is in `validate`, because the values have different shapes now:

```ts
if (!v.firstName.trim()) e.firstName = "…"                     // string   → trim
if (Number.isNaN(v.age) || v.age < 18) e.age = "…"             // number   → NaN guard first
if (v.interests.length === 0) e.interests = "…"                // array    → length
if (!v.terms) e.terms = "…"                                    // boolean  → truthiness
if (v.avatar && v.avatar.size > 2_000_000) e.avatar = "…"      // File     → optional, then check
if (!v.startDate) e.startDate = "…"                            // ISO date → empty string
```

Five different shapes, five different checks. **The `NaN` guard on numbers is the one people forget** — an empty number input yields `NaN`, and `NaN < 18` is `false`, so a naive check passes an empty field. §8.7's `NumberField` already normalises that with `emptyValue`, which is exactly why wrapping the inputs was worth doing.

### The typed-updater pattern still holds

```tsx
function update<K extends keyof FullValues>(field: K, value: FullValues[K]) {
  setValues((prev) => ({ ...prev, [field]: value }))
}

update("age", 30)                 // ✅ number
update("interests", ["react"])    // ✅ string[]
update("terms", true)             // ✅ boolean
update("age", "30")               // ❌ string is not assignable to number
update("terms", "yes")            // ❌
```

One generic function, fourteen fields, every value type checked. That's §8.4's signature earning its keep — and note that it needed no changes at all to handle numbers, arrays, booleans and `File`.

---

## 🧪 Lab 8.8 — The full sign-up form

**Level:** core

### The change

**1. Create `src/demos/08-forms/signupFullValidation.ts`:**

```ts
export const ROLES = [
  { value: "viewer", label: "Viewer" },
  { value: "editor", label: "Editor" },
  { value: "admin", label: "Admin" },
] as const
export type Role = (typeof ROLES)[number]["value"]

export const PLANS = [
  { value: "free", label: "Free" },
  { value: "pro", label: "Pro" },
  { value: "team", label: "Team" },
] as const
export type Plan = (typeof PLANS)[number]["value"]

export const INTERESTS = [
  { value: "react", label: "React" },
  { value: "typescript", label: "TypeScript" },
  { value: "testing", label: "Testing" },
  { value: "design", label: "Design" },
] as const
export type Interest = (typeof INTERESTS)[number]["value"]

export const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "hi", label: "Hindi" },
] as const
export type Language = (typeof LANGUAGES)[number]["value"]

export interface FullValues {
  firstName: string          // text
  email: string              // email
  password: string           // password
  age: number                // number
  bio: string                // textarea
  role: Role                 // select
  plan: Plan                 // radio group
  interests: Interest[]      // checkbox group
  languages: Language[]      // multi-select
  startDate: string          // date
  experience: number         // range
  newsletter: boolean        // switch
  terms: boolean             // checkbox
  avatar: File | null        // file
}

export const emptyFull: FullValues = {
  firstName: "",
  email: "",
  password: "",
  age: 18,
  bio: "",
  role: "viewer",
  plan: "free",
  interests: [],
  languages: [],
  startDate: "",
  experience: 3,
  newsletter: true,
  terms: false,
  avatar: null,
}

export type FullErrors = Partial<Record<keyof FullValues, string>>

/** Pure: values in, errors out. One check per value SHAPE. */
export function validateFull(v: FullValues): FullErrors {
  const e: FullErrors = {}

  // ---- strings ----
  if (!v.firstName.trim()) e.firstName = "First name is required."

  if (!v.email.trim()) e.email = "Email is required."
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email))
    e.email = "That doesn't look like an email address."

  if (!v.password) e.password = "Password is required."
  else if (v.password.length < 8) e.password = "Use at least 8 characters."
  else if (!/\d/.test(v.password)) e.password = "Include at least one number."

  if (v.bio.length > 140) e.bio = "Keep it under 140 characters."

  // ---- number: guard NaN FIRST, or an empty box passes ----
  if (Number.isNaN(v.age)) e.age = "Age is required."
  else if (!Number.isInteger(v.age)) e.age = "Whole years, please."
  else if (v.age < 18) e.age = "You must be 18 or over."
  else if (v.age > 120) e.age = "That seems unlikely."

  // ---- date: an empty <input type="date"> is an empty string ----
  if (!v.startDate) e.startDate = "Pick a start date."

  // ---- arrays: check length, not truthiness ([] is truthy) ----
  if (v.interests.length === 0) e.interests = "Pick at least one interest."
  if (v.languages.length === 0) e.languages = "Pick at least one language."

  // ---- boolean: a checkbox that must be ticked ----
  if (!v.terms) e.terms = "You must accept the terms."

  // ---- File: optional, so check only if present ----
  if (v.avatar) {
    if (!v.avatar.type.startsWith("image/")) e.avatar = "Images only, please."
    else if (v.avatar.size > 2_000_000) e.avatar = "Keep it under 2 MB."
  }

  return e
}
```

**2. Create `src/demos/08-forms/SignupFull.tsx`** — the same six pieces of machinery as `Signup.tsx`, fourteen fields:

```tsx
import { useState } from "react"
import { Button, Col, Form, Row } from "react-bootstrap"
import {
  TextField, NumberField, TextAreaField, SelectField, MultiSelectField,
  CheckboxField, RadioGroupField, CheckboxGroupField, DateField, RangeField, FileField,
} from "@/demos/08-forms/fields"
import {
  emptyFull, validateFull, ROLES, PLANS, INTERESTS, LANGUAGES,
  type FullValues,
} from "@/demos/08-forms/signupFullValidation"

type Touched = Partial<Record<keyof FullValues, boolean>>

function SignupFull() {
  const [values, setValues] = useState<FullValues>(emptyFull)
  const [touched, setTouched] = useState<Touched>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)

  // Identical to Signup.tsx — derived, never stored
  const errors = validateFull(values)
  const isValid = Object.keys(errors).length === 0

  function update<K extends keyof FullValues>(field: K, value: FullValues[K]) {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  function touch(field: keyof FullValues) {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  function errorFor(field: keyof FullValues): string | undefined {
    if (!errors[field]) return undefined
    return touched[field] || submitAttempted ? errors[field] : undefined
  }

  function handleRegisterSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitAttempted(true)

    const result = validateFull(values)

    if (Object.keys(result).length > 0) {
      console.warn("❌ Submit blocked — validation failed")
      console.table(result)
      return
    }

    console.info("✅ Valid — submitting", values)
    setValues(emptyFull)
    setTouched({})
    setSubmitAttempted(false)
  }

  return (
    <>
      <h1>Sign Up Form</h1>

      <Form onSubmit={handleRegisterSubmit} noValidate>
        <Row className="g-0">
          <Col sm={6} className="pe-sm-2">
            <TextField
              controlId="full.firstName"
              label="First Name"
              value={values.firstName}
              onChange={(v) => update("firstName", v)}
              onBlur={() => touch("firstName")}
              error={errorFor("firstName")}
              placeholder="Enter Your First Name"
              autoComplete="given-name"
            />
          </Col>
          <Col sm={6} className="ps-sm-2">
            <TextField
              controlId="full.email"
              label="Email"
              type="email"
              value={values.email}
              onChange={(v) => update("email", v)}
              onBlur={() => touch("email")}
              error={errorFor("email")}
              placeholder="Enter Your Email"
              autoComplete="email"
            />
          </Col>
          <Col sm={6} className="pe-sm-2">
            <TextField
              controlId="full.password"
              label="Password"
              type="password"
              value={values.password}
              onChange={(v) => update("password", v)}
              onBlur={() => touch("password")}
              error={errorFor("password")}
              hint="At least 8 characters, including a number."
              autoComplete="new-password"
            />
          </Col>
          <Col sm={6} className="ps-sm-2">
            <NumberField
              controlId="full.age"
              label="Age"
              value={values.age}
              min={0}
              max={120}
              onChange={(v) => update("age", v)}
              onBlur={() => touch("age")}
              error={errorFor("age")}
            />
          </Col>
        </Row>

        <TextAreaField
          controlId="full.bio"
          label="Bio"
          value={values.bio}
          rows={3}
          maxLength={140}
          onChange={(v) => update("bio", v)}
          onBlur={() => touch("bio")}
          error={errorFor("bio")}
          placeholder="A sentence about yourself"
        />

        <Row className="g-0">
          <Col sm={6} className="pe-sm-2">
            <SelectField
              controlId="full.role"
              label="Role"
              value={values.role}
              options={ROLES}
              onChange={(v) => update("role", v)}
              error={errorFor("role")}
            />
          </Col>
          <Col sm={6} className="ps-sm-2">
            <MultiSelectField
              controlId="full.languages"
              label="Languages (ctrl/cmd-click)"
              value={values.languages}
              options={LANGUAGES}
              size={4}
              onChange={(v) => update("languages", v)}
              error={errorFor("languages")}
            />
          </Col>
          <Col sm={6} className="pe-sm-2">
            <DateField
              controlId="full.startDate"
              label="Start date"
              value={values.startDate}
              onChange={(v) => update("startDate", v)}
              onBlur={() => touch("startDate")}
              error={errorFor("startDate")}
            />
          </Col>
          <Col sm={6} className="ps-sm-2">
            <FileField
              controlId="full.avatar"
              label="Avatar (optional)"
              file={values.avatar}
              accept="image/*"
              onChange={(f) => update("avatar", f)}
              error={errorFor("avatar")}
            />
          </Col>
        </Row>

        <RadioGroupField
          controlId="full.plan"
          label="Plan"
          value={values.plan}
          options={PLANS}
          onChange={(v) => update("plan", v)}
          error={errorFor("plan")}
        />

        <CheckboxGroupField
          controlId="full.interests"
          label="Interests"
          value={values.interests}
          options={INTERESTS}
          onChange={(v) => update("interests", v)}
          error={errorFor("interests")}
          hint="Pick any number."
        />

        <RangeField
          controlId="full.experience"
          label="Years of experience"
          value={values.experience}
          min={0}
          max={20}
          format={(n) => `${n} yr${n === 1 ? "" : "s"}`}
          onChange={(v) => update("experience", v)}
        />

        <CheckboxField
          controlId="full.newsletter"
          type="switch"
          label="Send me the newsletter"
          checked={values.newsletter}
          onChange={(v) => update("newsletter", v)}
        />

        <CheckboxField
          controlId="full.terms"
          label="I accept the terms"
          checked={values.terms}
          onChange={(v) => {
            update("terms", v)
            touch("terms")
          }}
          error={errorFor("terms")}
        />

        <div className="d-flex gap-2">
          <Button variant="primary" type="submit" disabled={submitAttempted && !isValid}>
            Register
          </Button>
          <Button
            type="button"
            variant="outline-secondary"
            onClick={() => {
              setValues(emptyFull)
              setTouched({})
              setSubmitAttempted(false)
            }}
          >
            Reset
          </Button>
        </div>
      </Form>
    </>
  )
}

export default SignupFull
```

### Run it

Create `src/demos/08-forms/SignupFullLab.tsx`:

```tsx
import { Card, Col, Row } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import StateInspector from "@/lab/StateInspector"
import SignupFull from "@/demos/08-forms/SignupFull"

export default function SignupFullLab() {
  return (
    <DemoCard
      title="The full sign-up form"
      claim="Fourteen fields of eleven different types — and not one new piece of machinery. Same useState, same update, same touched, same derived errors, same two-exit handleSubmit."
      level="core"
      notice={
        <ul className="mb-0">
          <li>
            <strong>Compare the component with `Signup.tsx`.</strong> The six moving parts
            are identical, character for character. Only the field list and the rules grew.
          </li>
          <li>
            <strong>Clear the Age box and submit.</strong> The error says "Age is
            required" — because <code>NumberField</code> normalises the empty box and{" "}
            <code>validateFull</code> guards <code>NaN</code> first. Remove that guard and
            an empty field silently passes.
          </li>
          <li>
            Each value <em>shape</em> is validated differently: strings by{" "}
            <code>trim()</code>, numbers by an <code>NaN</code> guard then range, arrays by{" "}
            <code>length</code>, the terms box by truthiness, the avatar only if present.
          </li>
          <li>
            <code>update</code> is unchanged from §8.4 and now type-checks numbers, arrays,
            booleans and <code>File</code>. Try <code>update("age", "30")</code> — compile
            error.
          </li>
          <li>
            Submit with nothing filled in and read <code>console.table</code>: one row per
            failing field, whatever its type.
          </li>
        </ul>
      }
    >
      <Row className="g-3">
        <Col lg={7}>
          <Card body>
            <SignupFull />
          </Card>
        </Col>
        <Col lg={5}>
          <div className="small fw-semibold text-muted mb-2">
            Read the types, not just the values
          </div>
          <StateInspector
            label="shape"
            value={{
              firstName: "string",
              age: "number",
              interests: "string[]",
              newsletter: "boolean",
              avatar: "File | null",
              startDate: '"YYYY-MM-DD"',
            }}
          />
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "signup-full", chapter: "8 — Forms", title: "The full form (manual)", element: <SignupFullLab /> }`.

### What to notice

- **Zero new machinery.** Diff `SignupFull.tsx`'s `update`/`touch`/`errorFor`/`handleRegisterSubmit` against `Signup.tsx`'s — they're the same. The pattern scaled.
- **The field components absorbed every awkward read.** No `e.target.checked`, no `valueAsNumber`, no `selectedOptions`, no `files?.[0]` anywhere in this file. That's §8.7's return on investment.
- **`SelectField<Role>` and the group fields kept their unions.** `update("role", v)` type-checks without a cast, because the component inferred `T` from `ROLES`.
- **`avatar` is a `File`, not a string.** It can't be reset by assigning `""`, which is why `emptyFull` uses `null` — and why `FileField` takes `file` rather than `value`.

### Experiments

1. **Delete the `Number.isNaN(v.age)` guard**, then clear the Age box and submit. It passes validation with `NaN`, and `JSON.stringify` renders it as `null`. Empty numeric inputs are the single most common validation hole.
2. **Change `if (v.interests.length === 0)` to `if (!v.interests)`.** It never fires — `[]` is truthy. Arrays need `length`, always.
3. **Add a fifteenth field** of any type. Count what you touch: the interface, `emptyFull`, one rule, one JSX block. No new machinery, exactly as promised.
4. **Upload a large image** (over 2 MB) and submit. The `File` branch fires. Note it only runs `if (v.avatar)` — an optional field must not fail when absent.
5. **Try `update("interests", "react")`** — compile error, because the field is `Interest[]`. The generic updater is doing real work now that the value types differ.

---

## 8.9 Swap the validator for a zod schema

`validateFull` works, and it duplicates something you already declared. `FullValues` says `age: number`; the validator says "an integer between 18 and 120". Two descriptions of one thing, free to drift apart.

A schema collapses them — and with fourteen fields of eleven types, it's the first point where the difference is big rather than tidy:

```bash
npm install zod
```

```ts
export const FullSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  email: z.string().min(1, "Email is required.").email("That doesn't look like an email."),
  password: z.string().min(8, "Use at least 8 characters.").regex(/\d/, "Include a number."),
  age: z.coerce.number().int("Whole years, please.").min(18, "You must be 18 or over."),
  bio: z.string().max(140, "Keep it under 140 characters."),
  role: z.enum(["viewer", "editor", "admin"]),
  plan: z.enum(["free", "pro", "team"]),
  interests: z.array(z.enum([...])).min(1, "Pick at least one interest."),
  languages: z.array(z.enum([...])).min(1, "Pick at least one language."),
  startDate: z.string().min(1, "Pick a start date."),
  experience: z.number().min(0).max(20),
  newsletter: z.boolean(),
  terms: z.literal(true, { errorMap: () => ({ message: "You must accept the terms." }) }),
  avatar: z.instanceof(File).nullable(),
})

export type FullValues = z.infer<typeof FullSchema>
```

**Look at what each value shape becomes.** Every hand-written check from §8.8 has a declarative counterpart:

| §8.8's check | zod |
|---|---|
| `!v.firstName.trim()` | `.min(1)` |
| the email regex | `.email()` |
| `Number.isNaN(v.age)` then range | `z.coerce.number().int().min(18)` |
| `v.bio.length > 140` | `.max(140)` |
| nothing — the union was the only guard | `z.enum([...])` — validated, not assumed |
| `v.interests.length === 0` | `z.array(...).min(1)` |
| `!v.terms` | `z.literal(true)` — note `z.boolean()` would accept `false` |
| `v.avatar && v.avatar.type…` | `z.instanceof(File).nullable()` + `.refine()` |

Two are worth dwelling on:

**`z.coerce.number()` replaces the `NaN` guard.** It accepts the string an input gives you *or* a real number, and fails with a message if it's neither — so the §8.8 experiment-1 hole closes by construction rather than by remembering.

**`z.literal(true)` is how you say "must be ticked".** `z.boolean()` is satisfied by `false`, which is the mistake that ships an unticked terms box.

**What does not change:** the `useState`, the `update` helper, the `touched` map, `errorFor`, and all fourteen JSX blocks. Exactly as in §8.6's four-field version — only now the saving is proportionally larger.

---

## 🧪 Lab 8.9 — The full form with zod

**Level:** core

A new file, so both versions survive for §8.13's comparison.

### The change

**1. Create `src/demos/08-forms/signupFullSchema.ts`:**

```ts
import { z } from "zod"
import {
  ROLES, PLANS, INTERESTS, LANGUAGES,
} from "@/demos/08-forms/signupFullValidation"

// Derive the literal tuples zod needs from the option lists, so the schema and
// the <SelectField> options can never disagree about what's valid.
const roleValues = ROLES.map((o) => o.value) as [string, ...string[]]
const planValues = PLANS.map((o) => o.value) as [string, ...string[]]
const interestValues = INTERESTS.map((o) => o.value) as [string, ...string[]]
const languageValues = LANGUAGES.map((o) => o.value) as [string, ...string[]]

export const FullSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  email: z
    .string()
    .min(1, "Email is required.")
    .email("That doesn't look like an email address."),
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .regex(/\d/, "Include at least one number."),
  // coerce closes §8.8's NaN hole by construction
  age: z.coerce
    .number({ invalid_type_error: "Age is required." })
    .int("Whole years, please.")
    .min(18, "You must be 18 or over.")
    .max(120, "That seems unlikely."),
  bio: z.string().max(140, "Keep it under 140 characters."),
  role: z.enum(roleValues),
  plan: z.enum(planValues),
  interests: z.array(z.enum(interestValues)).min(1, "Pick at least one interest."),
  languages: z.array(z.enum(languageValues)).min(1, "Pick at least one language."),
  startDate: z.string().min(1, "Pick a start date."),
  experience: z.number().min(0).max(20),
  newsletter: z.boolean(),
  // literal(true), not boolean() — boolean() accepts false
  terms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms." }),
  }),
  avatar: z
    .instanceof(File)
    .nullable()
    .refine((f) => !f || f.type.startsWith("image/"), "Images only, please.")
    .refine((f) => !f || f.size <= 2_000_000, "Keep it under 2 MB."),
})

/** Derived from the schema — replaces the hand-written FullValues. */
export type FullSchemaValues = z.infer<typeof FullSchema>
```

> **On the `as [string, ...string[]]` casts.** `z.enum` needs a non-empty literal tuple, and `.map()` returns `string[]`. Deriving the values from the option lists keeps one source of truth at the cost of one cast per list. If you'd rather have no casts, write the literals out twice — `z.enum(["viewer", "editor", "admin"])` — and accept that the schema and the options can drift.

**2. Create `src/demos/08-forms/SignupFullZod.tsx`** — copy `SignupFull.tsx` and change **four** things:

```tsx
// 1. import the schema instead of the validator
import { FullSchema } from "@/demos/08-forms/signupFullSchema"
import { emptyFull, /* … */ type FullValues } from "@/demos/08-forms/signupFullValidation"

type FieldErrors = Partial<Record<keyof FullValues, string[]>>   // 2. arrays now

// 3. safeParse replaces validateFull — still derived every render
const result = FullSchema.safeParse(values)
const errors: FieldErrors = result.success
  ? {}
  : (result.error.flatten().fieldErrors as FieldErrors)
const isValid = result.success

function errorFor(field: keyof FullValues): string | undefined {
  if (!(touched[field] || submitAttempted)) return undefined
  return errors[field]?.[0]                        // 4. [0], because it's an array
}

// and in handleRegisterSubmit:
const parsed = FullSchema.safeParse(values)
if (!parsed.success) {
  console.warn("❌ Submit blocked — schema rejected the values")
  console.table(parsed.error.flatten().fieldErrors)
  return
}
console.info("✅ Valid — submitting", parsed.data)   // coerced, not the raw values
```

**All fourteen JSX blocks are unchanged.** Copy them across untouched, and change the `controlId` prefix to `fullZod.` so both forms can be open at once.

### Run it

Create `src/demos/08-forms/SignupFullZodLab.tsx`:

```tsx
import { Card } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import SignupFullZod from "@/demos/08-forms/SignupFullZod"

export default function SignupFullZodLab() {
  return (
    <DemoCard
      title="The full form with zod"
      claim="Four lines changed from SignupFull.tsx. Fourteen fields and eleven components untouched — zod is a validation decision, not an architectural one."
      level="core"
      notice={
        <ul className="mb-0">
          <li>Behaviour is <strong>almost</strong> indistinguishable from <code>#signup-full</code> — except the number field and the terms box are now genuinely stricter.</li>
          <li>Clear the Age box: <code>z.coerce.number()</code> reports it with no <code>NaN</code> guard anywhere.</li>
          <li>Submit empty and read <code>console.table</code> — zod reports an <em>array</em> of messages per field.</li>
          <li><code>role</code> and <code>plan</code> are validated at runtime now, not just at compile time.</li>
        </ul>
      }
    >
      <Card body>
        <SignupFullZod />
      </Card>
    </DemoCard>
  )
}
```

Register it:

```tsx
{ id: "signup-full-zod", chapter: "8 — Forms", title: "The full form with zod", element: <SignupFullZodLab /> },
```

### What to notice

- **Four lines changed, fourteen fields unaffected.** The bigger the form, the more clearly this reads as "validation is a separate decision from state management".
- **`console.table` now prints arrays**, because zod reports every failing rule per field rather than the first.
- **`parsed.data.age` is a number even though the input gave a string.** `values.age` and `parsed.data.age` can now differ — which is why you submit `parsed.data`.
- **`role` and `plan` are actually validated now.** In §8.8 the union was a compile-time promise only; `z.enum` checks it at runtime, which matters the moment those values come from a URL or an API.

### Experiments

1. **Untick the terms box and submit.** Then change `z.literal(true)` to `z.boolean()` and try again — it passes. That one substitution is how unticked consent boxes reach production.
2. **Clear the Age box.** `z.coerce.number()` reports "Age is required" with no `NaN` guard anywhere. Now delete `z.coerce` and watch it fail with "Expected number, received string" instead — coercion is doing real work at the boundary.
3. **Empty the interests group and submit.** `z.array(...).min(1)` fires. Compare with §8.8's `length === 0` check — same outcome, one line, and the rule now lives with the type.
4. **Upload a PDF.** The first `.refine()` fires. Note both refines start with `!f ||` because the field is nullable — an optional field must not fail when absent.
5. **Add a field to the schema but not to `emptyFull`.** TypeScript complains at `useState<FullValues>(emptyFull)` if you switch the state type to `FullSchemaValues`. Try it: the schema becomes the single source of truth for the shape as well as the rules.

## 8.10 Controlled vs uncontrolled

Everything so far has been **controlled**: React state is the source of truth, and every keystroke re-renders. There is another way, and knowing it is what makes the next step make sense.

| | Controlled | Uncontrolled |
|---|---|---|
| Value lives in | React state | The DOM node |
| Written as | `value={x} onChange={…}` | `defaultValue="x"` |
| Read by | Reading state | A ref, or `FormData` on submit |
| Good for | Validation as you type, formatting, dependent fields, disabling submit | Simple forms, file inputs, integrating non-React code |
| Re-renders per keystroke | one | **none** |

**Common error:** `value` without `onChange` gives a read-only input plus a console warning — §8.2, met deliberately. Either add the handler, use `defaultValue`, or add `readOnly` if that's genuinely what you meant.

A second gotcha: `value={undefined}` makes an input uncontrolled, and switching between `undefined` and a string mid-life produces a warning about changing a controlled input to uncontrolled. That's §8.1's TS Note, in the wild.

The uncontrolled path is more attractive than it used to be, because `FormData` handles it neatly:

```tsx
function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault()
  const data = new FormData(e.currentTarget)
  const firstName = String(data.get("firstName") ?? "")
  const username = String(data.get("username") ?? "")
}
```

Note `e.currentTarget`, not `e.target` — `currentTarget` is typed `HTMLFormElement`, which is what `FormData` requires (§7.3). Note also that `FormData` reads the **`name`** attribute, which is otherwise unused in a React codebase and therefore easy to forget.

**How to decide:** does anything need to *react* to the value while the user is typing — a character count, a live preview, a disabled button, a dependent field? If yes, controlled. If the value is only needed at submit time, uncontrolled is less code and fewer renders.

**This is the design react-hook-form is built on.** It keeps values in the DOM and reads them on submit — which is why §8.11 has to reach for `Controller` to drive our own components, and why that trade-off is worth understanding before you meet it.

## 🧪 Lab 8.10 — Controlled vs uncontrolled

**Level:** core


Create `src/demos/08-forms/ControlledLab.tsx`:

```tsx
import { useRef, useState } from "react"
import { Alert, Button, Card, Col, Form, Row } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import RenderBadge from "@/lab/RenderBadge"
import StateInspector from "@/lab/StateInspector"

export default function ControlledLab() {
  // Controlled
  const [controlled, setControlled] = useState("")

  // Uncontrolled
  const uncontrolledRef = useRef<HTMLInputElement>(null)
  const [readValue, setReadValue] = useState<string | null>(null)

  // Uncontrolled via FormData
  const [submitted, setSubmitted] = useState<Record<string, string> | null>(null)

  function handleFormDataSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // currentTarget is typed HTMLFormElement — target would not be
    const data = new FormData(e.currentTarget)
    setSubmitted(Object.fromEntries(data.entries()) as Record<string, string>)
  }

  return (
    <DemoCard
      title="Controlled vs uncontrolled inputs"
      claim="A controlled input's value is React state, so you always know it. An uncontrolled input's value lives in the DOM, so you have to go and fetch it."
      level="core"
      notice={
        <ul className="mb-0">
          <li>
            Type in the controlled input. The readout updates on every keystroke and the
            render badge climbs — one render per character. That's the cost, and it's
            usually irrelevant.
          </li>
          <li>
            Type in the uncontrolled input. Nothing re-renders and nothing knows what you
            typed until you press <strong>Read</strong>. Cheaper, but you can't validate,
            format, or conditionally disable while typing.
          </li>
          <li>
            The controlled input can be transformed as you type — the third field
            upper-cases everything, which is impossible without control over the value.
          </li>
          <li>
            <code>FormData</code> makes uncontrolled forms genuinely pleasant for simple
            cases: no state, no refs, one <code>onSubmit</code>. Note it reads the{" "}
            <code>name</code> attributes, not ids.
          </li>
        </ul>
      }
    >
      <div className="d-flex justify-content-end mb-2">
        <RenderBadge label="ControlledLab" bg="primary" />
      </div>

      <Row className="g-3">
        <Col lg={6}>
          <Card className="h-100 border-primary-subtle">
            <Card.Header className="bg-primary-subtle small fw-semibold">
              Controlled — <code>value</code> + <code>onChange</code>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label className="small">Plain</Form.Label>
                <Form.Control
                  value={controlled}
                  onChange={(e) => setControlled(e.target.value)}
                  placeholder="React state owns this"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="small">
                  Transformed on the way in (upper-cased)
                </Form.Label>
                <Form.Control
                  value={controlled.toUpperCase()}
                  onChange={(e) => setControlled(e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="small">
                  Limited to 10 characters ({controlled.length}/10)
                </Form.Label>
                <Form.Control
                  value={controlled.slice(0, 10)}
                  onChange={(e) => setControlled(e.target.value.slice(0, 10))}
                  isInvalid={controlled.length >= 10}
                />
                <Form.Control.Feedback type="invalid">
                  That's the limit.
                </Form.Control.Feedback>
              </Form.Group>

              <StateInspector label="controlled" value={controlled} />
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="mb-3 border-secondary-subtle">
            <Card.Header className="bg-secondary-subtle small fw-semibold">
              Uncontrolled — <code>defaultValue</code> + a ref
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label className="small">The DOM owns this</Form.Label>
                <Form.Control
                  ref={uncontrolledRef}
                  defaultValue="initial text"
                  placeholder="Type, then press Read"
                />
              </Form.Group>
              <div className="d-flex gap-2">
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => setReadValue(uncontrolledRef.current?.value ?? "")}
                >
                  Read
                </Button>
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => {
                    if (uncontrolledRef.current) uncontrolledRef.current.value = ""
                    setReadValue(null)
                  }}
                >
                  Clear (imperatively)
                </Button>
              </div>
              {readValue !== null && (
                <Alert variant="light" className="border small mt-3 mb-0">
                  read: "{readValue}"
                </Alert>
              )}
            </Card.Body>
          </Card>

          <Card className="border-success-subtle">
            <Card.Header className="bg-success-subtle small fw-semibold">
              Uncontrolled via <code>FormData</code> — no state at all
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleFormDataSubmit}>
                <Form.Group className="mb-2">
                  <Form.Label className="small">Title</Form.Label>
                  <Form.Control name="title" defaultValue="Write the report" />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="small">Priority</Form.Label>
                  <Form.Select name="priority" defaultValue="medium">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </Form.Select>
                </Form.Group>
                <Button type="submit" size="sm" variant="success">
                  Submit
                </Button>
              </Form>
              {submitted && (
                <div className="mt-3">
                  <StateInspector label="FormData" value={submitted} />
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "controlled", chapter: "8 — Forms", title: "Controlled vs uncontrolled", element: <ControlledLab /> }`.

**Experiments:**

1. Remove `onChange` from the first controlled input. It becomes unresponsive and the console warns. Add `readOnly` and the warning goes away — because now you've *said* that's what you meant.
2. Change the controlled initial state to `useState<string | undefined>(undefined)`, type something, then set it back to `undefined`. React warns about switching a controlled input to uncontrolled. Always initialise text state to `""`.
3. Delete `name="title"` from the FormData form and submit. That field vanishes from the output — `FormData` keys off `name`, which is easy to forget in a React codebase where `name` is otherwise unused.

---

---

---

## 8.11 react-hook-form — driving the same components

Steps 8.4 and 8.5 wrote `values`, `update`, `touched`, `submitAttempted`, `errorFor` and a guard clause. Every form needs those six things, so a library owns them.

```bash
npm install react-hook-form
```

The important question for us is **not** "how do I use `register`?" — it's **"does my component library survive?"** It does, and understanding why is the payoff for every design decision in §8.3.

### `register` can't drive our components — and that's fine

`register("firstName")` returns `{ name, onChange, onBlur, ref }`, where `onChange` expects a DOM event. Spread that onto `Form.Control` and it works, because react-bootstrap forwards refs to the real `<input>` (§15.5).

Our `TextField` takes `onChange: (value: string) => void` and accepts no `ref`. So `register` can't drive it — by design, because §8.3 deliberately chose the parent's vocabulary over the DOM's.

**`<Controller>` is the bridge:**

```tsx
<Controller
  name="firstName"
  control={control}
  rules={{ required: "First name is required." }}
  render={({ field, fieldState }) => (
    <TextField
      controlId="rhf.firstName"
      label="First Name"
      value={field.value}
      onChange={field.onChange}          // takes a bare value — this just works
      onBlur={field.onBlur}
      error={fieldState.error?.message}
    />
  )}
/>
```

`field` carries `{ value, onChange, onBlur, name, ref }` and `fieldState` carries `{ error, isTouched, isDirty }`. **That's exactly the contract `TextField` was given in §8.3** — `value` in, `onChange(value)` out, `error` displayed not decided.

That isn't luck. It's the reason to design components that way: **a component built as a controlled component drops into any form library, because every form library speaks that shape.** Had `TextField` taken an event, or owned its own state, or demanded `onUpdate(name, value)` (§8.4), none of this would fit.

### Fourteen Controllers is too much typing

Written out, each field becomes eight lines of `Controller` wrapper around two lines of component. Extract the repetition — in the form, not the component (§8.4's rule):

```tsx
interface FieldProps<K extends keyof FullValues> {
  name: K
  control: Control<FullValues>
  rules?: RegisterOptions<FullValues, K>
  children: (args: {
    value: FullValues[K]
    onChange: (value: FullValues[K]) => void
    onBlur: () => void
    error?: string
  }) => ReactElement
}

function Field<K extends keyof FullValues>({ name, control, rules, children }: FieldProps<K>) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) =>
        children({
          value: field.value as FullValues[K],
          onChange: field.onChange,
          onBlur: field.onBlur,
          error: fieldState.error?.message,
        })
      }
    />
  )
}
```

which turns each field into one readable block:

```tsx
<Field name="firstName" control={control} rules={{ required: "First name is required." }}>
  {(f) => (
    <TextField controlId="rhf.firstName" label="First Name" placeholder="Enter Your First Name" {...f} />
  )}
</Field>
```

`{...f}` spreads `value`, `onChange`, `onBlur` and `error` in one go — because those are precisely the four props every one of our eleven components accepts. **The component library and the form library agree on a shape, so the glue is four characters.**

### The honest caveat about re-renders

`register`'s headline benefit is that typing doesn't re-render, because the DOM holds the value. `Controller` **re-subscribes that field to React**, so the field re-renders as you type — the same as §8.8's manual version.

What you still get is everything else: `touched` and `dirty` tracking, the submit lifecycle, `isSubmitting`, `reset`, `setError`, and validation orchestration. What you give up, relative to `register`, is the render optimisation **for the controlled fields only** — and each field re-renders alone, not the whole form, which is the part that actually matters on a large form.

**So the trade is:** `register` for anything that renders a real DOM input; `Controller` for your own components. Mixing them in one form is normal and correct.

---

## 🧪 Lab 8.11 — The full form with react-hook-form

**Level:** core

### The change

```bash
npm install react-hook-form
```

**1. Create `src/demos/08-forms/Field.tsx`** — the `Controller` wrapper:

```tsx
import { Controller, type Control, type RegisterOptions } from "react-hook-form"
import type { ReactElement } from "react"
import type { FullValues } from "@/demos/08-forms/signupFullValidation"

interface FieldProps<K extends keyof FullValues> {
  name: K
  control: Control<FullValues>
  rules?: RegisterOptions<FullValues, K>
  /** Receives exactly the four props every field component in fields.tsx accepts. */
  children: (args: {
    value: FullValues[K]
    onChange: (value: FullValues[K]) => void
    onBlur: () => void
    error?: string
  }) => ReactElement
}

export default function Field<K extends keyof FullValues>({
  name,
  control,
  rules,
  children,
}: FieldProps<K>) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) =>
        children({
          value: field.value as FullValues[K],
          onChange: field.onChange,
          onBlur: field.onBlur,
          error: fieldState.error?.message,
        })
      }
    />
  )
}
```

**2. Create `src/demos/08-forms/SignupFullRHF.tsx`:**

```tsx
import { useForm, type FieldErrors } from "react-hook-form"
import { Button, Col, Form, Row, Spinner } from "react-bootstrap"
import Field from "@/demos/08-forms/Field"
import {
  TextField, NumberField, TextAreaField, SelectField, MultiSelectField,
  CheckboxField, RadioGroupField, CheckboxGroupField, DateField, RangeField, FileField,
} from "@/demos/08-forms/fields"
import {
  emptyFull, ROLES, PLANS, INTERESTS, LANGUAGES,
  type FullValues,
} from "@/demos/08-forms/signupFullValidation"

function SignupFullRHF() {
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { isSubmitting, isDirty },
  } = useForm<FullValues>({
    mode: "onTouched",            // §8.5's strategy, as one option
    defaultValues: emptyFull,
  })

  // Called ONLY with valid data — §8.5's guard clause, built in
  async function onValid(values: FullValues) {
    await new Promise((r) => setTimeout(r, 700))

    if (values.email.endsWith("@taken.com")) {
      setError("email", { message: "That email is already registered." })
      return
    }

    console.info("✅ Valid — submitting", values)
    reset()
  }

  function onInvalid(errors: FieldErrors<FullValues>) {
    console.warn("❌ Submit blocked")
    console.table(
      Object.fromEntries(
        Object.entries(errors).map(([k, v]) => [k, (v as { message?: string })?.message])
      )
    )
  }

  return (
    <>
      <h1>Sign Up Form</h1>

      <Form onSubmit={handleSubmit(onValid, onInvalid)} noValidate>
        <Row className="g-0">
          <Col sm={6} className="pe-sm-2">
            <Field
              name="firstName"
              control={control}
              rules={{ required: "First name is required." }}
            >
              {(f) => (
                <TextField
                  controlId="rhf.firstName"
                  label="First Name"
                  placeholder="Enter Your First Name"
                  autoComplete="given-name"
                  {...f}
                />
              )}
            </Field>
          </Col>

          <Col sm={6} className="ps-sm-2">
            <Field
              name="email"
              control={control}
              rules={{
                required: "Email is required.",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "That doesn't look like an email address.",
                },
              }}
            >
              {(f) => (
                <TextField
                  controlId="rhf.email"
                  label="Email"
                  type="email"
                  placeholder="Enter Your Email — try someone@taken.com"
                  {...f}
                />
              )}
            </Field>
          </Col>

          <Col sm={6} className="pe-sm-2">
            <Field
              name="password"
              control={control}
              rules={{
                required: "Password is required.",
                minLength: { value: 8, message: "Use at least 8 characters." },
                validate: (v) => /\d/.test(v as string) || "Include at least one number.",
              }}
            >
              {(f) => (
                <TextField
                  controlId="rhf.password"
                  label="Password"
                  type="password"
                  hint="At least 8 characters, including a number."
                  {...f}
                />
              )}
            </Field>
          </Col>

          <Col sm={6} className="ps-sm-2">
            <Field
              name="age"
              control={control}
              rules={{
                required: "Age is required.",
                min: { value: 18, message: "You must be 18 or over." },
                max: { value: 120, message: "That seems unlikely." },
              }}
            >
              {(f) => (
                <NumberField controlId="rhf.age" label="Age" min={0} max={120} {...f} />
              )}
            </Field>
          </Col>
        </Row>

        <Field
          name="bio"
          control={control}
          rules={{ maxLength: { value: 140, message: "Keep it under 140 characters." } }}
        >
          {(f) => (
            <TextAreaField
              controlId="rhf.bio"
              label="Bio"
              rows={3}
              maxLength={140}
              placeholder="A sentence about yourself"
              {...f}
            />
          )}
        </Field>

        <Row className="g-0">
          <Col sm={6} className="pe-sm-2">
            <Field name="role" control={control}>
              {(f) => (
                <SelectField controlId="rhf.role" label="Role" options={ROLES} {...f} />
              )}
            </Field>
          </Col>

          <Col sm={6} className="ps-sm-2">
            <Field
              name="languages"
              control={control}
              rules={{ validate: (v) => (v as string[]).length > 0 || "Pick at least one language." }}
            >
              {(f) => (
                <MultiSelectField
                  controlId="rhf.languages"
                  label="Languages (ctrl/cmd-click)"
                  options={LANGUAGES}
                  size={4}
                  {...f}
                />
              )}
            </Field>
          </Col>

          <Col sm={6} className="pe-sm-2">
            <Field
              name="startDate"
              control={control}
              rules={{ required: "Pick a start date." }}
            >
              {(f) => <DateField controlId="rhf.startDate" label="Start date" {...f} />}
            </Field>
          </Col>

          <Col sm={6} className="ps-sm-2">
            <Field
              name="avatar"
              control={control}
              rules={{
                validate: (v) => {
                  const f = v as File | null
                  if (!f) return true
                  if (!f.type.startsWith("image/")) return "Images only, please."
                  if (f.size > 2_000_000) return "Keep it under 2 MB."
                  return true
                },
              }}
            >
              {/* FileField takes `file`, not `value` — the one component that can't use {...f} */}
              {({ value, onChange, error }) => (
                <FileField
                  controlId="rhf.avatar"
                  label="Avatar (optional)"
                  accept="image/*"
                  file={value}
                  onChange={onChange}
                  error={error}
                />
              )}
            </Field>
          </Col>
        </Row>

        <Field name="plan" control={control}>
          {(f) => <RadioGroupField controlId="rhf.plan" label="Plan" options={PLANS} {...f} />}
        </Field>

        <Field
          name="interests"
          control={control}
          rules={{ validate: (v) => (v as string[]).length > 0 || "Pick at least one interest." }}
        >
          {(f) => (
            <CheckboxGroupField
              controlId="rhf.interests"
              label="Interests"
              options={INTERESTS}
              hint="Pick any number."
              {...f}
            />
          )}
        </Field>

        <Field name="experience" control={control}>
          {(f) => (
            <RangeField
              controlId="rhf.experience"
              label="Years of experience"
              min={0}
              max={20}
              format={(n) => `${n} yr${n === 1 ? "" : "s"}`}
              {...f}
            />
          )}
        </Field>

        {/* CheckboxField takes `checked`, not `value` */}
        <Field name="newsletter" control={control}>
          {({ value, onChange }) => (
            <CheckboxField
              controlId="rhf.newsletter"
              type="switch"
              label="Send me the newsletter"
              checked={value}
              onChange={onChange}
            />
          )}
        </Field>

        <Field
          name="terms"
          control={control}
          rules={{ required: "You must accept the terms." }}
        >
          {({ value, onChange, error }) => (
            <CheckboxField
              controlId="rhf.terms"
              label="I accept the terms"
              checked={value}
              onChange={onChange}
              error={error}
            />
          )}
        </Field>

        <div className="d-flex gap-2">
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Registering…
              </>
            ) : (
              "Register"
            )}
          </Button>
          <Button
            type="button"
            variant="outline-secondary"
            onClick={() => reset()}
            disabled={!isDirty}
          >
            Reset
          </Button>
        </div>
      </Form>
    </>
  )
}

export default SignupFullRHF
```

### Run it

Create `src/demos/08-forms/SignupFullRHFLab.tsx`:

```tsx
import { Card } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import RenderBadge from "@/lab/RenderBadge"
import SignupFullRHF from "@/demos/08-forms/SignupFullRHF"

export default function SignupFullRHFLab() {
  return (
    <DemoCard
      title="The full form with react-hook-form"
      claim="All eleven field components reused unchanged, driven by Controller. The six pieces of state machinery are gone; the components never learned the library exists."
      level="core"
      notice={
        <ul className="mb-0">
          <li><code>{{...f}}</code> spreads <code>value</code>, <code>onChange</code>, <code>onBlur</code> and <code>error</code> — the four props every component in <code>fields.tsx</code> accepts.</li>
          <li><code>FileField</code> and <code>CheckboxField</code> are the exceptions: they take <code>file</code> and <code>checked</code>, so destructure instead of spreading.</li>
          <li>Type in one field and watch its neighbours: <code>Controller</code> scopes the re-render to that field alone.</li>
          <li>Count the <code>validate</code> escape hatches — four of fourteen fields need one. That's the argument for §8.12.</li>
        </ul>
      }
    >
      <div className="d-flex justify-content-end mb-2">
        <RenderBadge label="form renders" bg="success" />
      </div>
      <Card body>
        <SignupFullRHF />
      </Card>
    </DemoCard>
  )
}
```

Register it:

```tsx
{ id: "signup-full-rhf", chapter: "8 — Forms", title: "Full form with react-hook-form", element: <SignupFullRHFLab /> },
```

### What to notice

- **All eleven field components are reused unchanged.** Not one of them knows react-hook-form exists.
- **`{...f}` spreads `value`, `onChange`, `onBlur`, `error`** — the four props they all accept. That four-character glue is the return on §8.3's contract.
- **Three components need naming out**: `FileField` takes `file`, and `CheckboxField` takes `checked`. Destructure instead of spreading for those. **That's a real cost of naming a prop `checked` rather than `value`** — worth noticing, and arguably worth changing if you were designing the library again.
- **Gone from the component:** `values`, `update`, `touched`, `submitAttempted`, `errorFor`, the derived `errors`, and the guard clause. Diff it against `SignupFull.tsx`.
- **Rules are now scattered through the JSX**, one blob per `Field`. Readable here, and note how many already need `validate` because arrays and `File` have no built-in rules. That's §8.12.

### Experiments

1. **Diff `SignupFullRHF.tsx` against `SignupFull.tsx`.** Same fourteen fields, same components. What vanished is the six pieces of state machinery.
2. **Try `{...register("firstName")}` on `TextField`.** It fails — no `ref`, and the `onChange` shapes don't match. Then put it on a raw `<Form.Control>` and watch it work. That's the rule in one experiment.
3. **Count the `validate` escape hatches.** `password` (digit), `languages` (array length), `interests` (array length), `avatar` (type and size). Four of fourteen fields can't be expressed with built-in rules — which is most of the argument for §8.12.
4. **Remove the `Field` wrapper for one field** and write the `Controller` out longhand. Eight lines instead of three. Then remember §8.4's rule: repetition at the call site is fixed at the call site.
5. **Add `<RenderBadge>` inside one field's render function** and type in it. That field re-renders; its neighbours don't. `Controller` scopes the re-render to one field, which is the part that matters.

---

## 8.12 react-hook-form + zod

Step 8.9 replaced the rules with a schema. Step 8.11 replaced the state management. Those were **independent changes** — this step does both, and it costs one line plus fourteen deletions.

```bash
npm install @hookform/resolvers
```

```tsx
const { control, handleSubmit, /* … */ } = useForm<FullValues>({
  resolver: zodResolver(FullSchema),      // ← the one addition
  mode: "onTouched",
  defaultValues: emptyFull,
})

// …and every `rules={{ … }}` comes off the Field components
<Field name="firstName" control={control}>
  {(f) => <TextField controlId="rhfZod.firstName" label="First Name" {...f} />}
</Field>
```

**The schema file is unchanged from §8.9.** That's the headline: it doesn't know whether your state lives in `useState` or in react-hook-form. Only the line that *runs* it differs — `FullSchema.safeParse(values)` there, `zodResolver(FullSchema)` here.

### What the resolver fixes, specifically

§8.11 needed a `validate` escape hatch on four of fourteen fields, because `register`'s rule vocabulary has no way to say "this array needs at least one item" or "this File must be an image under 2 MB". Each becomes declarative:

| Field | §8.11 | §8.12 |
|---|---|---|
| `password` (digit) | `validate: (v) => /\d/.test(v) \|\| "…"` | `.regex(/\d/, "…")` |
| `interests` (array) | `validate: (v) => v.length > 0 \|\| "…"` | `.min(1, "…")` |
| `languages` (array) | `validate: (v) => v.length > 0 \|\| "…"` | `.min(1, "…")` |
| `avatar` (File) | a 6-line `validate` | two `.refine()` calls |
| `age` (number) | `min` / `max`, and the string/number mismatch | `z.coerce.number().min(18)` |
| `terms` (boolean) | `required` — which accepts `false`… | `z.literal(true)` — which doesn't |

That last row is a genuine bug fix, not just a tidy-up. In §8.11, `rules={{ required: … }}` on a checkbox whose value is `false` does fire — but `required` on a boolean is subtle enough that it's easy to get wrong, and `z.literal(true)` says exactly what you mean.

**And you get the things a schema always gives you:** the type via `z.infer`, rules testable with no renderer, rules reusable on a server, and one readable block instead of fourteen scattered blobs.

---

## 🧪 Lab 8.12 — The full form with react-hook-form + zod

**Level:** core

The last step. Every field type, your own components, the library's mechanics, one schema.

### The change

Create `src/demos/08-forms/SignupFullRHFZod.tsx` by copying `SignupFullRHF.tsx` and making **two** edits:

**1. Add the resolver:**

```tsx
import { zodResolver } from "@hookform/resolvers/zod"
import { FullSchema } from "@/demos/08-forms/signupFullSchema"

const {
  control,
  handleSubmit,
  reset,
  setError,
  formState: { isSubmitting, isDirty },
} = useForm<FullValues>({
  resolver: zodResolver(FullSchema),     // ← NEW
  mode: "onTouched",
  defaultValues: emptyFull,
})
```

**2. Delete every `rules` prop.** Each `Field` becomes:

```tsx
<Field name="firstName" control={control}>
  {(f) => (
    <TextField
      controlId="rhfZod.firstName"
      label="First Name"
      placeholder="Enter Your First Name"
      {...f}
    />
  )}
</Field>
```

Change the `controlId` prefix to `rhfZod.` so both forms can be open at once. Everything else — the `Field` wrapper, all eleven components, `onValid`, `onInvalid`, the buttons — is untouched.

### Run it

Create `src/demos/08-forms/SignupFullRHFZodLab.tsx`:

```tsx
import { Card } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import RenderBadge from "@/lab/RenderBadge"
import SignupFullRHFZod from "@/demos/08-forms/SignupFullRHFZod"

export default function SignupFullRHFZodLab() {
  return (
    <DemoCard
      title="The full form with react-hook-form + zod"
      claim="One resolver line added, fourteen rules props deleted. Same schema as §8.9, same components as §8.7 — four steps, three architectures, one component library."
      level="core"
      notice={
        <ul className="mb-0">
          <li>Not one <code>Field</code> has a <code>rules</code> prop. Every rule lives in <code>signupFullSchema.ts</code>.</li>
          <li>The four <code>validate</code> escape hatches from §8.11 are gone — replaced by <code>.min(1)</code>, <code>.regex()</code> and <code>.refine()</code>.</li>
          <li><code>FullSchema</code> is byte-for-byte the file from §8.9. It doesn't know where your state lives.</li>
          <li>Untick the terms box: <code>z.literal(true)</code> fires. <code>z.boolean()</code> would have accepted <code>false</code>.</li>
        </ul>
      }
    >
      <div className="d-flex justify-content-end mb-2">
        <RenderBadge label="form renders" bg="success" />
      </div>
      <Card body>
        <SignupFullRHFZod />
      </Card>
    </DemoCard>
  )
}
```

Register it:

```tsx
{ id: "signup-full-rhf-zod", chapter: "8 — Forms", title: "Full form with RHF + zod", element: <SignupFullRHFZodLab /> },
```

### What to notice

- **The JSX lost every rule.** Fourteen `Field` blocks, none with a `rules` prop. All the rules are in one readable block in `signupFullSchema.ts`.
- **The four `validate` escape hatches are gone**, replaced by `.min(1)`, `.regex()` and `.refine()`.
- **`z.coerce.number()` handles the age field** whatever the input hands over.
- **`FullSchema` is byte-for-byte the file from §8.9.** Two different state strategies, one schema, zero changes to it.
- **All eleven field components are still unchanged** — as they have been since §8.7. Four steps, three architectures, one component library.

### Experiments

1. **Delete the `resolver` line.** All validation vanishes and `onValid` fires with anything. The resolver is the *only* link between schema and form — swap it for Yup or Valibot without touching a field.
2. **Untick terms and submit.** `z.literal(true)` fires. Now go back to §8.11's `required` rule and convince yourself which you'd rather rely on.
3. **Compare the four files** — `SignupFull.tsx`, `SignupFullZod.tsx`, `SignupFullRHF.tsx`, `SignupFullRHFZod.tsx`. Same fourteen fields, same eleven components. What changed each time was *one* of: where the rules live, or where the state lives. That's §8.13.
4. **Add a fifteenth field.** Schema: one rule. Form: one `Field` block. Nothing else — no state, no validator, no `touched` entry. That's the end state you were working towards.
5. **Import `FullSchema` in a `.test.ts`** and assert on `safeParse`. No renderer, no DOM. Then try to test §8.11's `rules` the same way — you can't; they only exist inside a rendered form.

---

## 8.13 Choosing an approach

Two decisions, and they're **independent**:

- **Where does the state live?** Your own `useState`, or a form library.
- **Where do the rules live?** A function you write, or a zod schema.

Four combinations, and you've built all four on the same fourteen-field form:

|  | **Rules written by hand** | **Rules in a zod schema** |
|---|---|---|
| **State in `useState`** | `SignupFull.tsx` — §8.8 | `SignupFullZod.tsx` — §8.9 |
| **State in react-hook-form** | `SignupFullRHF.tsx` — §8.11 | `SignupFullRHFZod.tsx` — §8.12 |

**Reading across a row** shows what zod changed: the type stops being declared and starts being *derived*; `NaN` guards, array-length checks and `File` validation become declarative; and the rules become testable without a renderer and reusable on a server. Nothing about state management moves.

**Reading down a column** shows what react-hook-form changed: `values`, `update`, `touched`, `submitAttempted`, `errorFor` and the derived `errors` all disappear, and you gain `isSubmitting`, `isDirty`, `reset` and `setError`. Nothing about the rules moves.

**What survived all four**: the eleven field components from §8.7, unchanged since the moment they were written. That's the real lesson of the section — a component designed as a controlled component (`value` in, `onChange(value)` out, `error` displayed not decided) outlives every architectural decision above it.

| Situation | Reach for |
|---|---|
| One or two fields, no rules | A controlled input (§8.1) |
| A field used more than once | Extract a stateless field component (§8.2–8.3) |
| More than text inputs | A component per input type (§8.7) |
| Values only needed at submit | Uncontrolled + `FormData` (§8.10) |
| Up to ~5 independent fields | One `useState` each (§8.4, option A) |
| Fields belonging to one entity | One object + typed updater (§8.4, option B) |
| Fields that change each other | `useReducer` (§13) |
| Rules you'd want to unit test | A pure `validate` function (§8.5) |
| Arrays, numbers, files, or enums to validate | A zod schema (§8.9) |
| Many fields, or a real submit lifecycle | react-hook-form (§8.11) |
| Both of the last two | react-hook-form + zod (§8.12) |

**The cheapest useful upgrade is §8.9** — adding zod to a form you already control costs one dependency and changes four lines. No new mental model, no `Controller`, no uncontrolled inputs. If you're unsure where to start, start there.

**Don't reach for §8.12 on a search box.** A single controlled input is three lines; `useForm` + a schema + a resolver is two dependencies and a lot of ceremony. Match the tool to the form.

## 8.14 Accessibility, cheaply

Bootstrap and React give you most of this if you use them as intended — and because you built a `TextField`, you got it right **once**:

- **`controlId` on `Form.Group`** wires the label to the input, so you never write matching `htmlFor` and `id` by hand. Clicking the label then focuses the field. It's also what makes `getByLabelText` work in §21's tests — a test that fails without it is reporting a real defect.
- **`useId()`** generates a stable unique id when you need one manually (a hint, an error region) and are rendering many instances. Never a counter or `Math.random()`.
- **`isInvalid` + `Form.Control.Feedback`** sets `aria-invalid` and associates the message, so screen readers announce it.
- **A real `<form>` with `onSubmit`** gives Enter-to-submit and correct form semantics for free. A `<div>` of inputs with a click handler gives you neither.
- **Never rely on colour alone.** Bootstrap's invalid state is red *and* a message; keep both.
- **`autoComplete`** on name, username and password fields lets password managers work. `autoComplete="new-password"` on sign-up, `"current-password"` on sign-in.

---
✅ **Concept check 8**

1. Trace the five steps of the controlled loop for one keystroke. Which step puts the character on screen?
2. §8.2's form renders perfectly and does nothing. Why — and what exactly is missing?
3. Why is `controlId` a prop rather than a constant inside `TextField`?
4. A `TextField` that holds its own `useState` can't be part of a form. Why not?
5. Why does `onChange` report a `string` rather than the change event?
6. When would you choose four `useState` calls over one state object, and vice versa?
7. Write the generic signature for a typed field updater from memory.
8. Should `update` itself be passed to `TextField` as a prop? Give one reason why not.
9. Why derive `errors` every render instead of storing them with `setErrors`?
10. What are the two exits from `handleRegisterSubmit`, and which line guarantees invalid data never reaches your API?
11. What does `touched` buy you that running validation constantly does not?
12. Name three things a zod schema gives you that a hand-written `validate` function doesn't.
13. Which property do you read for a checkbox, a multi-select, and a file input?
14. Why doesn't a `register`-based react-hook-form re-render as you type, and what do you give up?
15. Why did `confirmPassword` need `deps` in §8.8 but nothing in §8.9?
16. When do you need `<Controller>` instead of `register` — and why did our own field components force that choice?

Answers in [Appendix B](#appendix-b--concept-check-answers).

# 9. Lifting state up

When two components need the same data, move that state to their **closest common ancestor** and pass it down.

```
        App  ← state lives here
       /   \
  Form      List
  (writes)  (reads)
```

You've already done this: `tasks` lives in `App` because `AddTaskForm` writes to it and `TaskList` reads it. Neither sibling can see the other's state — data only flows down — so the parent holds it.

## 9.1 Where should this state live?

Work down the list and stop at the first "yes":

1. **Can it be derived from something else?** Then it isn't state at all. §10.
2. **Does only one component use it?** Keep it in that component. Form drafts, "is this menu open", hover state.
3. **Do a parent and its child both use it?** Parent, passed down.
4. **Do two siblings use it?** Their closest common ancestor.
5. **Does most of the app use it, or is it more than three levels deep?** Context (§14) or a store.
6. **Does it belong in the URL?** Filters, search terms, the selected tab, pagination — these are often better in the query string, where they survive refresh and can be shared as a link. §18.

**Start as local as possible, and lift only when a second component genuinely needs it.** Premature lifting makes components harder to reuse, re-renders larger than necessary, and turns every small change into a prop-plumbing exercise.

The opposite mistake is just as common: state that's been left too low, so two components each keep their own copy and they drift apart. Lab 9.1 shows that failure directly.

## 9.2 The cost: prop drilling

**Prop drilling** is passing props through components that don't use them, just to reach a descendant:

```tsx
<App tasks={tasks}>            // owns it
  <Board tasks={tasks}>        // doesn't use it — just passing through
    <TaskList tasks={tasks}>   // doesn't use it either
      <TaskCard task={task} /> // finally
```

Two or three levels is fine and often *clearer* than the alternative, because the data flow is visible in the code. It becomes a problem when:

- Intermediate components accumulate props they never read, and their prop interfaces stop describing what they do.
- Adding one field means touching five files.
- You start passing whole objects down "just in case", which couples everything to your data shape.

That's the point to reach for Context (§14). Not before — Context has real costs of its own, and "I have three levels of props" is not one of the problems it solves well.

## 9.3 Making your own controlled components

Once you've lifted state, the child becomes a **controlled component** — and the convention for that is worth copying exactly, because it's what every UI library uses:

```tsx
interface RatingProps {
  value: number                       // the current value, from the parent
  onChange: (value: number) => void   // report a requested change
  max?: number
}

function Rating({ value, onChange, max = 5 }: RatingProps) { /* ... */ }
```

The child holds no state for the value. It renders what it's given and reports what the user did. The parent decides whether to honour it — which is what makes clamping, validation, and "read-only unless you're an admin" possible without touching the child.

A component can support **both** modes, which is how `<input>` itself works:

```tsx
interface RatingProps {
  value?: number            // controlled if provided
  defaultValue?: number     // uncontrolled starting point
  onChange?: (value: number) => void
  max?: number
}

function Rating({ value, defaultValue = 0, onChange, max = 5 }: RatingProps) {
  const [internal, setInternal] = useState(defaultValue)
  const isControlled = value !== undefined
  const current = isControlled ? value : internal

  function select(next: number) {
    if (!isControlled) setInternal(next)   // only manage state when we own it
    onChange?.(next)                        // always report
  }
  // ...
}
```

Three rules make this pattern reliable, and getting any of them wrong produces a component that *mostly* works:

- **`value !== undefined`** decides the mode, not `value !== null` and not truthiness — `0` and `""` are legitimate controlled values.
- **Never write to internal state when controlled**, or the two sources disagree the moment the parent rejects a change.
- **Always call `onChange`**, in both modes, so the parent can observe even when it isn't controlling.

Lab 9.2 builds this. It's the single most reusable component pattern in the document.

---

## 🧪 Lab 9.1 — Siblings that can't see each other

**Level:** core

Create `src/demos/09-lifting/LiftingLab.tsx`:

```tsx
import { useState } from "react"
import { Alert, Badge, Button, ButtonGroup, Card, Col, Form, Row } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"

type Currency = "GBP" | "EUR" | "USD"

const symbols = { GBP: "£", EUR: "€", USD: "$" } as const
const rates = { GBP: 1, EUR: 1.17, USD: 1.27 } as const

// ---------- BROKEN: each sibling owns its own copy ----------

function BrokenPicker() {
  const [currency, setCurrency] = useState<Currency>("GBP")
  return (
    <Card body className="h-100">
      <div className="small fw-semibold text-muted mb-2">Picker (its own state)</div>
      <ButtonGroup size="sm">
        {(Object.keys(symbols) as Currency[]).map((c) => (
          <Button
            key={c}
            variant={currency === c ? "danger" : "outline-danger"}
            onClick={() => setCurrency(c)}
          >
            {c}
          </Button>
        ))}
      </ButtonGroup>
      <div className="small text-muted mt-2">
        picker thinks: <Badge bg="danger">{currency}</Badge>
      </div>
    </Card>
  )
}

function BrokenTotal() {
  const [currency] = useState<Currency>("GBP")   // never told about changes
  return (
    <Card body className="h-100">
      <div className="small fw-semibold text-muted mb-2">Total (its own state)</div>
      <div className="fs-4 fw-semibold">
        {symbols[currency]}
        {(120 * rates[currency]).toFixed(2)}
      </div>
      <div className="small text-muted mt-2">
        total thinks: <Badge bg="danger">{currency}</Badge>
      </div>
    </Card>
  )
}

// ---------- FIXED: the parent owns it, both are told ----------

interface PickerProps {
  currency: Currency
  onCurrencyChange: (currency: Currency) => void
}

function Picker({ currency, onCurrencyChange }: PickerProps) {
  return (
    <Card body className="h-100">
      <div className="small fw-semibold text-muted mb-2">Picker (controlled)</div>
      <ButtonGroup size="sm">
        {(Object.keys(symbols) as Currency[]).map((c) => (
          <Button
            key={c}
            variant={currency === c ? "success" : "outline-success"}
            onClick={() => onCurrencyChange(c)}
          >
            {c}
          </Button>
        ))}
      </ButtonGroup>
      <div className="small text-muted mt-2">
        picker shows: <Badge bg="success">{currency}</Badge>
      </div>
    </Card>
  )
}

function Total({ currency, amount }: { currency: Currency; amount: number }) {
  return (
    <Card body className="h-100">
      <div className="small fw-semibold text-muted mb-2">Total (reads a prop)</div>
      <div className="fs-4 fw-semibold">
        {symbols[currency]}
        {(amount * rates[currency]).toFixed(2)}
      </div>
      <div className="small text-muted mt-2">
        total shows: <Badge bg="success">{currency}</Badge>
      </div>
    </Card>
  )
}

export default function LiftingLab() {
  // The lifted state — the closest common ancestor of Picker and Total
  const [currency, setCurrency] = useState<Currency>("GBP")
  const [amount, setAmount] = useState(120)

  return (
    <DemoCard
      title="Lifting state to the closest common ancestor"
      claim="Siblings cannot see each other's state. If two components need the same value, exactly one place can own it: their nearest shared parent."
      level="core"
      notice={
        <ul className="mb-0">
          <li>
            In the red pair, change the currency. The picker updates and the total doesn't —
            two copies of "the current currency" that immediately disagreed.
          </li>
          <li>
            In the green pair, the parent owns the value. The picker reports a change, the
            parent updates, and <strong>both children re-render from one source</strong>.
          </li>
          <li>
            The picker went from owning state to taking <code>currency</code> and{" "}
            <code>onCurrencyChange</code>. That's the controlled-component conversion, and
            it's the same shape as an <code>&lt;input&gt;</code>.
          </li>
          <li>
            <code>amount</code> is also lifted, so the total recalculates when either input
            changes. One render, both values consistent.
          </li>
        </ul>
      }
    >
      <Alert variant="danger" className="small">
        <strong>Broken:</strong> each sibling keeps its own copy.
      </Alert>
      <Row className="g-3 mb-4">
        <Col md={6}>
          <BrokenPicker />
        </Col>
        <Col md={6}>
          <BrokenTotal />
        </Col>
      </Row>

      <Alert variant="success" className="small">
        <strong>Fixed:</strong> the parent owns it; children receive value + callback.
      </Alert>
      <Row className="g-3">
        <Col md={6}>
          <Picker currency={currency} onCurrencyChange={setCurrency} />
        </Col>
        <Col md={6}>
          <Total currency={currency} amount={amount} />
        </Col>
        <Col xs={12}>
          <Card body>
            <Form.Group>
              <Form.Label className="small">
                Amount (also lifted): {amount}
              </Form.Label>
              <Form.Range
                min={0}
                max={500}
                step={10}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </Form.Group>
          </Card>
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "lifting", chapter: "9 — Lifting state", title: "Lifting to a common ancestor", element: <LiftingLab /> }`.

**Experiments:**

1. Try to fix the broken pair *without* lifting — pass a ref, use a module variable, anything. Every approach either recreates the parent-owns-it structure or breaks React's model. This is a constraint, not a preference.
2. `onCurrencyChange={setCurrency}` type-checks because `setCurrency` is `(c: Currency) => void`. Change the state to `useState<string>("GBP")` and it breaks — a good demonstration that the union type propagates all the way to the prop boundary.
3. Move `amount` into `Total` instead. The slider can no longer reach it. Move it into the slider's own card and `Total` can't read it. Only the parent works.

---

## 🧪 Lab 9.2 — A component that works both controlled and uncontrolled

**Level:** depth

Create `src/demos/09-lifting/ControlledComponentLab.tsx`:

```tsx
import { useState } from "react"
import { Alert, Badge, Button, Card, Col, Row } from "react-bootstrap"
import { Star, StarFill } from "react-bootstrap-icons"
import DemoCard from "@/lab/DemoCard"

interface RatingProps {
  /** Provide this to control the component from outside. */
  value?: number
  /** Starting value when uncontrolled. */
  defaultValue?: number
  onChange?: (value: number) => void
  max?: number
  disabled?: boolean
}

function Rating({
  value,
  defaultValue = 0,
  onChange,
  max = 5,
  disabled = false,
}: RatingProps) {
  const [internal, setInternal] = useState(defaultValue)

  // The mode is decided by whether `value` was passed — not by truthiness,
  // because 0 is a perfectly valid controlled value.
  const isControlled = value !== undefined
  const current = isControlled ? value : internal

  function select(next: number) {
    if (disabled) return
    if (!isControlled) setInternal(next)   // only own state when we're the owner
    onChange?.(next)                        // always report, in both modes
  }

  return (
    <div className="d-flex align-items-center gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <Button
          key={n}
          variant="link"
          className="p-0 text-warning"
          disabled={disabled}
          onClick={() => select(n)}
          aria-label={`Rate ${n} of ${max}`}
        >
          {n <= current ? <StarFill size={22} /> : <Star size={22} />}
        </Button>
      ))}
      <Badge bg="secondary" className="ms-2">
        {current}/{max}
      </Badge>
      <Badge bg={isControlled ? "primary" : "dark"} className="ms-1">
        {isControlled ? "controlled" : "uncontrolled"}
      </Badge>
    </div>
  )
}

export default function ControlledComponentLab() {
  const [rating, setRating] = useState(3)
  const [clampedRating, setClampedRating] = useState(2)
  const [lastUncontrolled, setLastUncontrolled] = useState<number | null>(null)

  return (
    <DemoCard
      title="Controlled and uncontrolled, in one component"
      claim="Deciding the mode from `value !== undefined` lets one component serve both callers — the pattern every input in every UI library uses."
      level="depth"
      notice={
        <ul className="mb-0">
          <li>
            <strong>Controlled:</strong> the parent holds the number, so the buttons below
            can change it too. The component itself stores nothing.
          </li>
          <li>
            <strong>Clamped:</strong> the parent refuses anything above 3. Click 5 — it
            snaps to 3. Only a controlled component can do this, because the parent gets to
            decide whether to honour the request.
          </li>
          <li>
            <strong>Uncontrolled:</strong> no <code>value</code> prop, so the component
            manages itself. <code>onChange</code> still fires, which is how the readout
            below it works — reporting and controlling are separate concerns.
          </li>
          <li>
            <code>value !== undefined</code> and not <code>value ?</code> — a controlled
            rating of <code>0</code> must still count as controlled.
          </li>
        </ul>
      }
    >
      <Row className="g-3">
        <Col lg={6}>
          <Card body className="h-100">
            <div className="small fw-semibold text-muted mb-2">
              Controlled — parent owns the value
            </div>
            <Rating value={rating} onChange={setRating} />
            <div className="d-flex gap-2 mt-3">
              <Button size="sm" variant="outline-primary" onClick={() => setRating(0)}>
                Set 0
              </Button>
              <Button size="sm" variant="outline-primary" onClick={() => setRating(5)}>
                Set 5
              </Button>
              <Button
                size="sm"
                variant="outline-primary"
                onClick={() => setRating((r) => Math.min(5, r + 1))}
              >
                +1
              </Button>
            </div>
            <div className="small text-muted mt-2">
              parent state: <code>{rating}</code>
            </div>
          </Card>
        </Col>

        <Col lg={6}>
          <Card body className="h-100">
            <div className="small fw-semibold text-muted mb-2">
              Controlled with a rule — max 3 allowed
            </div>
            <Rating
              value={clampedRating}
              onChange={(next) => setClampedRating(Math.min(3, next))}
            />
            <Alert variant="light" className="border small mt-3 mb-0">
              Click the 4th or 5th star. The component asked for 5; the parent granted 3.
              The UI shows the parent's answer, never the request.
            </Alert>
          </Card>
        </Col>

        <Col lg={6}>
          <Card body className="h-100">
            <div className="small fw-semibold text-muted mb-2">
              Uncontrolled — the component owns it
            </div>
            <Rating defaultValue={2} onChange={setLastUncontrolled} />
            <div className="small text-muted mt-2">
              last reported via onChange:{" "}
              <code>{lastUncontrolled === null ? "—" : lastUncontrolled}</code>
            </div>
          </Card>
        </Col>

        <Col lg={6}>
          <Card body className="h-100">
            <div className="small fw-semibold text-muted mb-2">
              Controlled and disabled — read-only display
            </div>
            <Rating value={4} disabled max={5} />
            <div className="small text-muted mt-2">
              No <code>onChange</code>, no interaction, same component.
            </div>
          </Card>
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "controlled-component", chapter: "9 — Lifting state", title: "Controlled + uncontrolled", element: <ControlledComponentLab /> }`.

**Experiments:**

1. Change `isControlled` to `Boolean(value)`. Now `<Rating value={0} onChange={...} />` silently becomes uncontrolled and manages its own state, so the parent's "Set 0" button appears to do nothing. This is a real bug in real libraries; `!== undefined` is the fix.
2. Remove the `if (!isControlled)` guard so it always calls `setInternal`. The clamped rating now flickers to 5 and back to 3 — two sources of truth, briefly disagreeing. Restore the guard.
3. Add a `useEffect` that syncs `value` into `internal`. It works, and it's worse: an extra render, an extra state, and a new way to be stale. The `isControlled` branch needs no effect at all.

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

Every piece of duplicated state is a bug waiting for a code path that updates one and forgets the other. And there is *always* such a path eventually — the bulk-delete you add in month three, the undo you add in month five.

Derived values are always correct because they're recomputed from the source on every render. They cannot be stale, because they don't persist.

## 10.1 What to derive and what to store

**Derive:** filtered lists, sorted lists, grouped lists, totals, counts, averages, "is the form valid", "are all items selected", "is anything overdue", search results, the currently selected *object* (when you have its id), formatted strings, progress percentages.

**Store:** the raw data, and the user's *inputs* to the derivation.

```tsx
const [tasks, setTasks] = useState<Task[]>([])       // source of truth
const [filter, setFilter] = useState<Filter>("all")  // user input
const [query, setQuery] = useState("")               // user input
const [sortBy, setSortBy] = useState<SortKey>("created")  // user input

// everything below is derived — no useState, no useEffect
const visible = tasks
  .filter((t) => (filter === "all" ? true : filter === "done" ? t.done : !t.done))
  .filter((t) => t.title.toLowerCase().includes(query.toLowerCase()))
  .sort((a, b) => (sortBy === "created" ? b.createdAt - a.createdAt : a.title.localeCompare(b.title)))

const completed = tasks.filter((t) => t.done).length
const allDone = tasks.length > 0 && completed === tasks.length
const percent = tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100)
```

Note that `visible` derives from *four* pieces of state and stays correct under any combination of changes to any of them. Try keeping that consistent with `setVisibleTasks` calls scattered across a dozen handlers.

Note also `.sort()` there is being called on the result of `.filter()`, which is already a fresh array — so no copy is needed. Sorting `tasks` directly would be the mutation bug from §6.4.

## 10.2 Store the id, not the object

A specific, high-value application of the same rule. When the user selects something:

```tsx
// ❌ stores a snapshot of the object
const [selectedTask, setSelectedTask] = useState<Task | null>(null)

// ✅ stores the identity, derives the object
const [selectedId, setSelectedId] = useState<string | null>(null)
const selectedTask = tasks.find((t) => t.id === selectedId) ?? null
```

With the first version, editing a task's title elsewhere leaves the selected copy showing the old title, and deleting the task leaves you holding a ghost that's no longer in the list. With the second, the selection follows edits automatically and evaluates to `null` when the task disappears.

This is the single most common instance of the derived-state mistake in real applications, precisely because storing the object *feels* more convenient. Lab 10.3 makes the failure visible.

## 10.3 Don't derive in an effect

The anti-pattern this section exists to prevent:

```tsx
// ❌ two renders, and stale between them
const [visible, setVisible] = useState<Task[]>([])
useEffect(() => {
  setVisible(tasks.filter((t) => !t.done))
}, [tasks])

// ✅ one render, never stale
const visible = tasks.filter((t) => !t.done)
```

The effect version renders with the *old* `visible`, then runs the effect, then renders again. For one frame your UI shows stale data, and any code reading `visible` in between sees the previous value. §11 has a whole table of these.

## 10.4 When to optimise

Only reach for `useMemo` when profiling shows a real problem (§16). **Filtering a few hundred items on every render is not slow** — it's microseconds, and React was designed on that assumption. Wrapping every derivation in `useMemo` adds code, adds dependency arrays to get wrong, and typically makes things marginally slower.

The genuine cases: thousands of items, a heavy transform (parsing, chart data preparation, date maths on large sets), or a derived object that must keep a stable identity to let a `memo`-ised child bail out.

---

## 🧪 Lab 10.1 — Derived vs duplicated

**Level:** core

Create `src/demos/10-derived/DerivedLab.tsx`:

```tsx
import { useState } from "react"
import { Alert, Badge, Button, Card, Col, ListGroup, ProgressBar, Row } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"

interface Item {
  id: string
  label: string
  done: boolean
}

const initial: Item[] = [
  { id: "a", label: "Write the spec", done: true },
  { id: "b", label: "Review the design", done: false },
  { id: "c", label: "Ship the feature", done: false },
]

export default function DerivedLab() {
  const [items, setItems] = useState<Item[]>(initial)

  // ❌ duplicated state, maintained by hand
  const [storedCompleted, setStoredCompleted] = useState(
    initial.filter((i) => i.done).length
  )

  // ✅ derived every render
  const derivedCompleted = items.filter((i) => i.done).length
  const percent = items.length === 0 ? 0 : Math.round((derivedCompleted / items.length) * 100)
  const allDone = items.length > 0 && derivedCompleted === items.length

  function toggle(id: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i)))
    // The author remembered to update the duplicate here…
    setStoredCompleted((prev) => {
      const item = items.find((i) => i.id === id)
      return item?.done ? prev - 1 : prev + 1
    })
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: `New item ${prev.length + 1}`, done: false },
    ])
    // …and here, correctly, since a new item is never done.
  }

  function markAllDone() {
    setItems((prev) => prev.map((i) => ({ ...i, done: true })))
    // ❌ …and forgot here. This is the bug, and it is entirely typical.
  }

  function removeFirst() {
    setItems((prev) => prev.slice(1))
    // ❌ …and here.
  }

  return (
    <DemoCard
      title="Derived vs duplicated"
      claim="A stored count must be updated by every code path that changes the list. A derived count is correct by construction."
      level="core"
      notice={
        <ul className="mb-0">
          <li>
            Toggle a few items. Both counters agree, because <code>toggle</code> remembers
            to update the stored one.
          </li>
          <li>
            Now press <strong>Mark all done</strong>. The derived count is right; the stored
            count is wrong. Press <strong>Remove first</strong> — worse.
          </li>
          <li>
            Nothing is unusual about this bug. Someone added two features and updated one
            counter in two of four places. <strong>Every duplicated value has this failure
            mode</strong>, and no amount of care removes it — only removing the duplicate does.
          </li>
          <li>
            The derived version has no update logic at all. There is nothing to forget.
          </li>
        </ul>
      }
    >
      <Row className="g-3">
        <Col md={6}>
          <Card className="h-100 border-danger-subtle text-center">
            <Card.Header className="bg-danger-subtle small fw-semibold">
              ❌ stored in state
            </Card.Header>
            <Card.Body>
              <div className="display-5 fw-semibold">{storedCompleted}</div>
              <div className="small text-muted">
                maintained by hand in every handler
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="h-100 border-success-subtle text-center">
            <Card.Header className="bg-success-subtle small fw-semibold">
              ✅ derived during render
            </Card.Header>
            <Card.Body>
              <div className="display-5 fw-semibold">{derivedCompleted}</div>
              <div className="small text-muted">
                <code>items.filter(i =&gt; i.done).length</code>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {storedCompleted !== derivedCompleted && (
        <Alert variant="danger" className="mt-3 mb-0 small">
          <strong>The two sources of truth now disagree.</strong> Stored says{" "}
          {storedCompleted}, reality is {derivedCompleted}. In a real app this is the bug
          report titled "the counter is wrong sometimes".
        </Alert>
      )}

      <div className="mt-3">
        <div className="d-flex justify-content-between small text-muted mb-1">
          <span>
            {derivedCompleted} of {items.length} complete
            {allDone && <Badge bg="success" className="ms-2">all done</Badge>}
          </span>
          <span>{percent}%</span>
        </div>
        <ProgressBar now={percent} variant="success" style={{ height: 6 }} />
      </div>

      <ListGroup className="mt-3">
        {items.map((item) => (
          <ListGroup.Item
            key={item.id}
            action
            onClick={() => toggle(item.id)}
            className="d-flex align-items-center gap-2"
          >
            <input type="checkbox" checked={item.done} readOnly className="form-check-input m-0" />
            <span className={item.done ? "text-muted text-decoration-line-through" : ""}>
              {item.label}
            </span>
          </ListGroup.Item>
        ))}
      </ListGroup>

      <div className="d-flex flex-wrap gap-2 mt-3">
        <Button size="sm" variant="outline-primary" onClick={addItem}>
          Add item
        </Button>
        <Button size="sm" variant="outline-danger" onClick={markAllDone}>
          Mark all done (forgets the duplicate)
        </Button>
        <Button size="sm" variant="outline-danger" onClick={removeFirst}>
          Remove first (forgets too)
        </Button>
        <Button
          size="sm"
          variant="outline-secondary"
          onClick={() => {
            setItems(initial)
            setStoredCompleted(initial.filter((i) => i.done).length)
          }}
        >
          Reset both
        </Button>
      </div>
    </DemoCard>
  )
}
```

Register as `{ id: "derived", chapter: "10 — Derived state", title: "Derived vs duplicated", element: <DerivedLab /> }`.

**Experiments:**

1. Fix the stored version properly — update `storedCompleted` in all four handlers. Then add a fifth feature (a "toggle all" that flips every item) and see whether you remember. The maintenance burden is the point.
2. Delete `storedCompleted` entirely. The component gets shorter, the `Reset` button gets simpler, and a whole class of bug becomes unreachable. **Deleting state is usually the best refactor available to you.**
3. Note that `toggle`'s duplicate-update reads `items` (the render's snapshot) rather than the updated array — so even the "correct" handler is subtly relying on §6.2's snapshot semantics. Duplicated state is harder to maintain than it first looks.

---

## 🧪 Lab 10.2 — The derivation pipeline

**Level:** core

Create `src/demos/10-derived/PipelineLab.tsx`:

```tsx
import { useState } from "react"
import { Badge, Card, Col, Form, InputGroup, ListGroup, Row, Table } from "react-bootstrap"
import { Search } from "react-bootstrap-icons"
import DemoCard from "@/lab/DemoCard"

type Priority = "low" | "medium" | "high"
type Filter = "all" | "active" | "done"
type SortKey = "created" | "title" | "priority"

interface Task {
  id: string
  title: string
  priority: Priority
  done: boolean
  createdAt: number
}

const allTasks: Task[] = [
  { id: "1", title: "Audit the bundle size", priority: "high", done: false, createdAt: 9 },
  { id: "2", title: "Write release notes", priority: "low", done: true, createdAt: 4 },
  { id: "3", title: "Fix the flaky test", priority: "high", done: true, createdAt: 7 },
  { id: "4", title: "Update dependencies", priority: "medium", done: false, createdAt: 2 },
  { id: "5", title: "Add a health check", priority: "medium", done: false, createdAt: 6 },
  { id: "6", title: "Bump the API version", priority: "low", done: false, createdAt: 1 },
]

const priorityRank: Record<Priority, number> = { high: 0, medium: 1, low: 2 }
const priorityBg: Record<Priority, string> = { high: "danger", medium: "primary", low: "secondary" }

export default function PipelineLab() {
  // ---- state: the raw data and the user's inputs. Nothing else. ----
  const [filter, setFilter] = useState<Filter>("all")
  const [query, setQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortKey>("created")
  const [hideDoneHighPriority, setHideDoneHighPriority] = useState(false)

  // ---- everything below is derived ----
  const afterFilter = allTasks.filter((t) => {
    if (filter === "active") return !t.done
    if (filter === "done") return t.done
    return true
  })

  const afterSearch = afterFilter.filter((t) =>
    t.title.toLowerCase().includes(query.trim().toLowerCase())
  )

  const afterRule = hideDoneHighPriority
    ? afterSearch.filter((t) => !(t.done && t.priority === "high"))
    : afterSearch

  // afterRule is already a fresh array, so sorting it in place is safe
  const visible = [...afterRule].sort((a, b) => {
    if (sortBy === "title") return a.title.localeCompare(b.title)
    if (sortBy === "priority") return priorityRank[a.priority] - priorityRank[b.priority]
    return b.createdAt - a.createdAt
  })

  const stats = {
    total: allTasks.length,
    completed: allTasks.filter((t) => t.done).length,
    visible: visible.length,
    highPriorityOpen: allTasks.filter((t) => !t.done && t.priority === "high").length,
  }

  return (
    <DemoCard
      title="The derivation pipeline"
      claim="Four pieces of state feed a chain of pure transforms. Any change to any input produces a correct result with no synchronisation code."
      level="core"
      notice={
        <ul className="mb-0">
          <li>
            The stage table shows the array shrinking through each transform. Change any
            control and every row updates in the same render.
          </li>
          <li>
            There are <strong>four</strong> pieces of state here and{" "}
            <strong>zero</strong> derived values in state. Adding a fifth control means
            adding one <code>useState</code> and one link in the chain — nothing else.
          </li>
          <li>
            Filter to <em>Done</em> and search for something absent. Two empty states are
            possible: "nothing done" and "nothing matches". A good UI distinguishes them —
            §5.4.
          </li>
          <li>
            <code>[...afterRule].sort()</code> — the copy is habit rather than necessity
            here, since <code>afterRule</code> is already fresh. Keep the habit; the day it
            isn't fresh, you won't notice.
          </li>
        </ul>
      }
    >
      <Row className="g-3 mb-3">
        <Col md={4}>
          <Form.Group>
            <Form.Label className="small">Filter</Form.Label>
            <Form.Select value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="done">Done</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label className="small">Search</Form.Label>
            <InputGroup>
              <InputGroup.Text>
                <Search size={13} />
              </InputGroup.Text>
              <Form.Control
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="title contains…"
              />
            </InputGroup>
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label className="small">Sort by</Form.Label>
            <Form.Select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)}>
              <option value="created">Newest first</option>
              <option value="title">Title A→Z</option>
              <option value="priority">Priority</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col xs={12}>
          <Form.Check
            type="switch"
            label="Hide completed high-priority tasks (an extra rule in the chain)"
            checked={hideDoneHighPriority}
            onChange={(e) => setHideDoneHighPriority(e.target.checked)}
          />
        </Col>
      </Row>

      <Row className="g-3">
        <Col lg={7}>
          <Card>
            <Card.Header className="small fw-semibold d-flex justify-content-between">
              <span>Result</span>
              <span className="text-muted">
                {stats.visible} of {stats.total}
              </span>
            </Card.Header>
            <ListGroup variant="flush">
              {visible.length === 0 ? (
                <ListGroup.Item className="text-muted small py-4 text-center">
                  {query.trim()
                    ? `Nothing matches "${query.trim()}".`
                    : "Nothing in this filter."}
                </ListGroup.Item>
              ) : (
                visible.map((task) => (
                  <ListGroup.Item
                    key={task.id}
                    className="d-flex align-items-center gap-2 small"
                  >
                    <span
                      className={
                        task.done ? "text-muted text-decoration-line-through flex-grow-1" : "flex-grow-1"
                      }
                    >
                      {task.title}
                    </span>
                    <Badge bg={priorityBg[task.priority]}>{task.priority}</Badge>
                    <span className="text-muted" style={{ width: 44 }}>
                      d{task.createdAt}
                    </span>
                  </ListGroup.Item>
                ))
              )}
            </ListGroup>
          </Card>
        </Col>

        <Col lg={5}>
          <Table bordered size="sm" className="small mb-3">
            <thead className="table-light">
              <tr>
                <th>Pipeline stage</th>
                <th style={{ width: 60 }}>Count</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>source</td><td>{allTasks.length}</td></tr>
              <tr><td>after filter ({filter})</td><td>{afterFilter.length}</td></tr>
              <tr><td>after search</td><td>{afterSearch.length}</td></tr>
              <tr><td>after extra rule</td><td>{afterRule.length}</td></tr>
              <tr className="table-success"><td>after sort (visible)</td><td>{visible.length}</td></tr>
            </tbody>
          </Table>

          <Table bordered size="sm" className="small mb-0">
            <thead className="table-light">
              <tr>
                <th>Derived stat</th>
                <th style={{ width: 60 }}>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>completed</td><td>{stats.completed}</td></tr>
              <tr><td>open, high priority</td><td>{stats.highPriorityOpen}</td></tr>
              <tr>
                <td>completion</td>
                <td>{Math.round((stats.completed / stats.total) * 100)}%</td>
              </tr>
            </tbody>
          </Table>
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "pipeline", chapter: "10 — Derived state", title: "The derivation pipeline", element: <PipelineLab /> }`.

**Experiments:**

1. Add a "show only my tasks" control. It's one `useState` and one link in the chain — count the lines. Then imagine adding it to a version where `visible` is stored in state and updated by seven handlers.
2. Reorder the pipeline: sort before filtering. Same output, because filtering preserves order. Now put the *search* after the sort — also the same. Pure transforms compose freely, which is why this style is easy to change.
3. Add `console.log("deriving")` above the pipeline. It runs on every keystroke. Convince yourself that's fine at this size by adding `performance.now()` timing around it — you'll see numbers well under a millisecond, which is §16's whole argument in one measurement.

---

## 🧪 Lab 10.3 — Store the id, not the object

**Level:** depth

Create `src/demos/10-derived/SelectionLab.tsx`:

```tsx
import { useState } from "react"
import { Alert, Button, Card, Col, Form, ListGroup, Row } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"

interface Contact {
  id: string
  name: string
  email: string
}

const initial: Contact[] = [
  { id: "c1", name: "Ada Lovelace", email: "ada@example.com" },
  { id: "c2", name: "Grace Hopper", email: "grace@example.com" },
  { id: "c3", name: "Alan Turing", email: "alan@example.com" },
]

export default function SelectionLab() {
  const [contacts, setContacts] = useState<Contact[]>(initial)

  // ❌ a snapshot taken at selection time
  const [selectedObject, setSelectedObject] = useState<Contact | null>(null)

  // ✅ an identity; the object is derived
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedDerived = contacts.find((c) => c.id === selectedId) ?? null

  function select(contact: Contact) {
    setSelectedObject(contact)
    setSelectedId(contact.id)
  }

  function renameFirst() {
    setContacts((prev) =>
      prev.map((c, i) => (i === 0 ? { ...c, name: `${c.name} (renamed)` } : c))
    )
  }

  function deleteSelected() {
    if (!selectedId) return
    setContacts((prev) => prev.filter((c) => c.id !== selectedId))
  }

  const isStale =
    selectedObject !== null &&
    JSON.stringify(selectedObject) !== JSON.stringify(selectedDerived)

  return (
    <DemoCard
      title="Store the id, not the object"
      claim="A stored object is a photograph. It doesn't update when the original is edited, and it doesn't disappear when the original is deleted."
      level="depth"
      notice={
        <ul className="mb-0">
          <li>
            Select the first contact, then press <strong>Rename first contact</strong>. The
            left panel still shows the old name — it's holding a copy made at click time.
            The right panel updates, because it looks the contact up every render.
          </li>
          <li>
            Now press <strong>Delete selected</strong>. The left panel still shows a contact
            that no longer exists — a ghost. The right panel correctly becomes empty.
          </li>
          <li>
            Editing the email field writes to <code>contacts</code>. Watch which panel
            follows along.
          </li>
          <li>
            This is the most common derived-state mistake in real applications, because
            storing the object feels more convenient at the moment you write it.
          </li>
        </ul>
      }
    >
      <Row className="g-3">
        <Col lg={4}>
          <Card>
            <Card.Header className="small fw-semibold">Contacts</Card.Header>
            <ListGroup variant="flush">
              {contacts.map((contact) => (
                <ListGroup.Item
                  key={contact.id}
                  action
                  active={contact.id === selectedId}
                  onClick={() => select(contact)}
                >
                  <div className="small fw-semibold">{contact.name}</div>
                  <div className="small text-muted">{contact.email}</div>
                </ListGroup.Item>
              ))}
              {contacts.length === 0 && (
                <ListGroup.Item className="text-muted small">
                  No contacts left.
                </ListGroup.Item>
              )}
            </ListGroup>
          </Card>

          <div className="d-flex flex-column gap-2 mt-3">
            <Button size="sm" variant="outline-primary" onClick={renameFirst}>
              Rename first contact
            </Button>
            <Button
              size="sm"
              variant="outline-danger"
              onClick={deleteSelected}
              disabled={!selectedId}
            >
              Delete selected
            </Button>
            <Button
              size="sm"
              variant="outline-secondary"
              onClick={() => {
                setContacts(initial)
                setSelectedId(null)
                setSelectedObject(null)
              }}
            >
              Reset
            </Button>
          </div>
        </Col>

        <Col lg={4}>
          <Card className="h-100 border-danger-subtle">
            <Card.Header className="bg-danger-subtle small fw-semibold">
              ❌ <code>useState&lt;Contact | null&gt;</code>
            </Card.Header>
            <Card.Body>
              {selectedObject ? (
                <>
                  <div className="fw-semibold">{selectedObject.name}</div>
                  <div className="small text-muted">{selectedObject.email}</div>
                  <div className="small text-muted mt-2">id: {selectedObject.id}</div>
                </>
              ) : (
                <div className="small text-muted">Nothing selected.</div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="h-100 border-success-subtle">
            <Card.Header className="bg-success-subtle small fw-semibold">
              ✅ id + <code>contacts.find(…)</code>
            </Card.Header>
            <Card.Body>
              {selectedDerived ? (
                <>
                  <div className="fw-semibold">{selectedDerived.name}</div>
                  <Form.Control
                    size="sm"
                    className="mt-2"
                    value={selectedDerived.email}
                    onChange={(e) =>
                      setContacts((prev) =>
                        prev.map((c) =>
                          c.id === selectedDerived.id ? { ...c, email: e.target.value } : c
                        )
                      )
                    }
                  />
                  <div className="small text-muted mt-2">id: {selectedDerived.id}</div>
                </>
              ) : (
                <div className="small text-muted">Nothing selected.</div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {isStale && (
        <Alert variant="danger" className="mt-3 mb-0 small">
          <strong>The stored copy is now stale.</strong> It shows data that no longer
          matches the source — or an item that no longer exists at all.
        </Alert>
      )}
    </DemoCard>
  )
}
```

Register as `{ id: "selection", chapter: "10 — Derived state", title: "Store the id", element: <SelectionLab /> }`.

**Experiments:**

1. Type in the email box. The left panel is frozen at whatever the email was when you clicked. Now imagine the left panel is a modal showing "are you sure you want to delete *Ada Lovelace*?" after Ada has been renamed.
2. Delete the selected contact and then click the list. `selectedDerived` handles it (`?? null`), but note that `selectedId` still holds a dead id. That's harmless because it's only ever used for lookup — a good property of storing identity rather than data.
3. Try the middle ground: store the id but keep a `useEffect` that copies the found object into state. Two renders, one extra state, same staleness risk during the gap. There's no version of storing the object that beats deriving it.

✅ **Concept check 9 & 10**

1. Where should state live if two siblings need it? What if only one child needs it?
2. What are the three rules for a component that supports both controlled and uncontrolled use?
3. Give three examples of values that should always be derived rather than stored.
4. Why does storing the selected *object* cause bugs that storing its *id* doesn't?
5. Why is deriving in a `useEffect` worse than deriving during render?

---

# 11. `useEffect` & side effects

Rendering must be pure (§1.4). Anything that reaches outside React — network calls, timers, subscriptions, `localStorage`, document title, direct DOM work, analytics — is a **side effect** and belongs in an event handler or in `useEffect`.

```tsx
useEffect(() => {
  // effect body: runs after React has committed to the DOM
  return () => {
    // optional cleanup: runs before the next effect, and on unmount
  }
}, [dependencies])
```

## 11.1 Handler or effect?

Ask **why** the code should run:

| Because… | Put it in |
|---|---|
| the user did something | the **event handler** |
| the component rendered (or a value changed) | an **effect** |

Sending an analytics event when a button is clicked is a handler. Sending one when a page becomes visible is an effect. Saving a form on submit is a handler. Syncing state to `localStorage` whenever it changes is an effect. Getting this backwards is the most common structural mistake with effects — code in an effect that should have been in the handler runs on mounts, remounts, and unrelated renders.

## 11.2 The dependency array

```tsx
useEffect(() => { /* ... */ })            // after EVERY render — almost always wrong
useEffect(() => { /* ... */ }, [])        // once, after the first render (twice in dev — §11.5)
useEffect(() => { /* ... */ }, [userId])  // on mount, and whenever userId changes
```

The rule React enforces via lint: **every value from component scope used inside the effect must be in the array.** That includes props, state, and any function defined in the component body.

Omitting dependencies to "make it run less" produces **stale closures** — the effect keeps seeing values from the render in which it was created, exactly as in Lab 6.2. The symptom is an effect that works the first time and then silently uses old data.

React compares dependencies with `Object.is`, which means **identity, not contents**:

```tsx
const options = { limit: 10 }              // a NEW object every render
useEffect(() => { load(options) }, [options])   // ❌ runs every render

// Fixes, in order of preference:
useEffect(() => { load({ limit: 10 }) }, [])           // move it inside
useEffect(() => { load({ limit }) }, [limit])          // depend on primitives
const options = useMemo(() => ({ limit }), [limit])    // memoise, if it must be shared
```

**Depend on primitives wherever you can.** Strings, numbers and booleans compare by value; objects, arrays and functions don't.

When the effect needs the *latest* value but shouldn't re-run when it changes, the escape hatches are an updater function (`setCount(c => c + 1)` needs no `count` dependency) or a ref (§15).

## 11.3 Cleanup

Anything you start, you must be able to stop:

```tsx
useEffect(() => {
  const id = setInterval(() => setNow(Date.now()), 1000)
  return () => clearInterval(id)     // ← without this, intervals pile up
}, [])
```

Cleanup runs **before every re-run of the effect**, not only on unmount. So an effect with `[userId]` cleans up user A's subscription before opening user B's — which is exactly what you want and easy to forget you're getting.

The checklist of things that need cleanup:

| Started with | Cleaned up with |
|---|---|
| `setInterval` / `setTimeout` | `clearInterval` / `clearTimeout` |
| `addEventListener` | `removeEventListener` (same function reference!) |
| A subscription / socket | `unsubscribe()` / `close()` |
| `fetch` | `controller.abort()` |
| An observer (`ResizeObserver`, `IntersectionObserver`) | `observer.disconnect()` |
| A class added to `document.body` | remove it |

The `addEventListener` case has a trap worth naming: `removeEventListener` only removes a listener if you pass **the same function reference**. An inline arrow in both calls creates two different functions and removes nothing.

```tsx
// ❌ removes nothing — two different arrows
useEffect(() => {
  window.addEventListener("resize", () => setW(window.innerWidth))
  return () => window.removeEventListener("resize", () => setW(window.innerWidth))
}, [])

// ✅ one reference, used twice
useEffect(() => {
  function handleResize() { setW(window.innerWidth) }
  window.addEventListener("resize", handleResize)
  return () => window.removeEventListener("resize", handleResize)
}, [])
```

## 11.4 `useEffect` is overused

Before writing one, check whether you need it at all:

| Situation | Use an effect? | Instead |
|---|---|---|
| Transform data for display | **No** | Derive it during render (§10) |
| Filter or sort a list | **No** | Derive it during render |
| Respond to a user action | **No** | Do it in the event handler |
| Reset state when a prop changes | **No** | A `key` prop to remount (§4.3) |
| Adjust some state when a prop changes | **Usually no** | Derive it, or set state during render as a last resort |
| Chain two state updates | **No** | Compute both in one handler |
| Initialise the app once | **No** | Module scope, or outside React |
| Notify a parent of a change | **No** | Call the callback in the handler that caused it |
| Sync with `localStorage` | **Yes** | — |
| Fetch data on mount | Yes (or better: a data library — §17) | — |
| Subscribe to a browser API / socket | **Yes** | — |
| Set up a timer | **Yes** | — |
| Set the document title | **Yes** | — |
| Measure the DOM | Yes — `useLayoutEffect` (§11.6) | — |

The single most common beginner mistake is computing derived state in an effect and storing it back in state. It causes a double render, it can go stale between them, and it adds a dependency array to get wrong. Derive during render instead. Lab 11.4 demonstrates three of these and their fixes side by side.

A useful heuristic: **if the effect's only job is to call `setState`, look for a way to delete it.**

## 11.5 Strict Mode runs effects twice

In development, React 18+ mounts, unmounts, and remounts every component to surface missing cleanup. Seeing your effect fire twice is **expected** and means Strict Mode is doing its job.

The sequence you'll see on mount in development:

```
effect runs  →  cleanup runs  →  effect runs
```

If your effect is correctly written — everything it starts, it stops — that sequence is harmless. If it isn't, you get two intervals, two subscriptions, or two POST requests, and you find out now rather than from a user. **Write correct cleanup rather than disabling Strict Mode.**

This does not happen in production builds.

## 11.6 `useEffect` vs `useLayoutEffect`

| | `useEffect` | `useLayoutEffect` |
|---|---|---|
| Runs | After the browser paints | After DOM mutation, **before** paint |
| Blocks paint | No | Yes |
| Use for | Almost everything | Measuring the DOM and immediately adjusting layout |

If you measure an element in `useEffect` and then set state to reposition it, the user sees one frame in the wrong place — a flicker. `useLayoutEffect` runs before the browser paints, so the correction is invisible. The cost is that it blocks painting, so slow work there freezes the page.

**Default to `useEffect`.** Reach for `useLayoutEffect` only when you can see a flicker. Lab 11.5 produces one deliberately.

> **TS Note.** A common error: `useEffect(async () => { ... })` won't compile, because an effect must return `void` or a cleanup function, and an `async` function returns a `Promise`. Define the async function inside and call it:
> ```tsx
> useEffect(() => {
>   async function load() { /* ... */ }
>   void load()
> }, [])
> ```
> The `void` operator says "I'm deliberately ignoring this promise" and satisfies lint rules about unhandled promises. `load()` alone works identically at runtime.

---

## 🧪 Lab 11.1 — Effect timing and cleanup order

**Level:** core

The most useful ten minutes in §11. You will refer back to this mental model constantly.

Create `src/demos/11-effects/EffectTimingLab.tsx`:

```tsx
import { useEffect, useState } from "react"
import { Badge, Button, Card, Col, Form, Row } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import LogPanel from "@/lab/LogPanel"
import { useEventLog } from "@/lab/useEventLog"

interface ProbeProps {
  label: string
  dep: number
  log: (message: string) => void
}

/** Three effects with three different dependency arrays. */
function EffectProbe({ label, dep, log }: ProbeProps) {
  // Runs after every render
  useEffect(() => {
    log(`${label}: effect [no array] ran`)
    return () => log(`${label}: cleanup [no array]`)
  })

  // Runs once (twice in dev, thanks to Strict Mode)
  useEffect(() => {
    log(`${label}: effect [] ran — MOUNT`)
    return () => log(`${label}: cleanup [] — UNMOUNT`)
  }, [log, label])

  // Runs when `dep` changes
  useEffect(() => {
    log(`${label}: effect [dep=${dep}] ran`)
    return () => log(`${label}: cleanup [dep=${dep}]`)
  }, [dep, log, label])

  log(`${label}: RENDER (dep=${dep})`)   // impure, for teaching only

  return (
    <Card body className="text-center">
      <div className="small text-muted">{label}</div>
      <div className="fs-4 fw-semibold">dep = {dep}</div>
    </Card>
  )
}

export default function EffectTimingLab() {
  const { entries, log, clear } = useEventLog(60)
  const [dep, setDep] = useState(0)
  const [unrelated, setUnrelated] = useState(0)
  const [mounted, setMounted] = useState(true)

  return (
    <DemoCard
      title="Effect timing and cleanup order"
      claim="Effects run after the commit, in declaration order. Cleanup runs before the next run of the same effect — not only on unmount."
      level="core"
      notice={
        <ul className="mb-0">
          <li>
            <strong>Read the log bottom-up on mount.</strong> You'll see RENDER, then
            effects, then (Strict Mode) all cleanups, then all effects again. Rendering
            always finishes before any effect starts.
          </li>
          <li>
            Press <strong>Change dep</strong>: the <code>[dep]</code> effect's cleanup runs
            with the <em>old</em> value, then the effect runs with the new one. That pairing
            is the mechanism behind "unsubscribe from A before subscribing to B".
          </li>
          <li>
            Press <strong>Unrelated re-render</strong>: only the no-array effect re-runs.
            The <code>[]</code> and <code>[dep]</code> effects are untouched.
          </li>
          <li>
            Press <strong>Unmount</strong>: every cleanup runs, in declaration order. Effects
            never leak if their cleanup is honest.
          </li>
          <li>
            <code>log</code> is in the dependency arrays because the lint rule requires it —
            and it's safe to depend on because <code>useEventLog</code> wraps it in{" "}
            <code>useCallback</code>. That's §0.5.3's aside paying off.
          </li>
        </ul>
      }
    >
      <Row className="g-3">
        <Col lg={5}>
          <div className="d-flex flex-column gap-2 mb-3">
            <Button onClick={() => setDep((d) => d + 1)}>
              Change dep → cleanup then effect
            </Button>
            <Button variant="outline-primary" onClick={() => setUnrelated((n) => n + 1)}>
              Unrelated re-render ({unrelated})
            </Button>
            <Form.Check
              type="switch"
              label="mounted"
              checked={mounted}
              onChange={(e) => setMounted(e.target.checked)}
            />
          </div>

          {mounted ? (
            <EffectProbe label="Probe" dep={dep} log={log} />
          ) : (
            <Card body className="text-center text-muted small">
              unmounted — check the cleanup entries
            </Card>
          )}

          <Card body className="mt-3 small">
            <div className="fw-semibold mb-2">The order, always</div>
            <ol className="mb-0 ps-3">
              <li>React calls your component (render)</li>
              <li>React commits changes to the DOM</li>
              <li>The browser paints</li>
              <li>Cleanups from the previous run fire</li>
              <li>Effects fire, in declaration order</li>
            </ol>
            <div className="text-muted mt-2">
              <Badge bg="secondary">useLayoutEffect</Badge> slots in between 2 and 3.
            </div>
          </Card>
        </Col>

        <Col lg={7}>
          <LogPanel entries={entries} onClear={clear} height={520} title="Lifecycle log" />
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "effect-timing", chapter: "11 — Effects", title: "Effect timing & cleanup", element: <EffectTimingLab /> }`.

**Experiments:**

1. Clear the log, then toggle `mounted` off and on. Compare the sequences. Unmount runs cleanups only; mount runs render → effects (twice in dev).
2. Remove `<StrictMode>` from `main.tsx` and remount. The doubled mount sequence disappears. Put it back — you want that signal.
3. Add a fourth effect *above* the others and watch where it appears in the log. Effects run in declaration order, and cleanups do too. Occasionally that ordering matters; knowing it's deterministic is what lets you rely on it.
4. Remove `log` from the `[]` dependency array. The lint rule complains. Now remove `useCallback` from `useEventLog` and put `log` back in the array — the effect now re-runs on every render, because `log` is a new function each time. **This is the dependency-identity problem in miniature.**

---

## 🧪 Lab 11.2 — Cleanup, or leak

**Level:** core

Create `src/demos/11-effects/IntervalLab.tsx`:

```tsx
import { useEffect, useRef, useState } from "react"
import { Alert, Badge, Button, Card, Col, Form, ProgressBar, Row } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"

/** An interval WITHOUT cleanup. Every re-run of the effect adds another timer. */
function LeakyTicker({ speed }: { speed: number }) {
  const [count, setCount] = useState(0)
  const startedRef = useRef(0)

  useEffect(() => {
    startedRef.current += 1
    setInterval(() => setCount((c) => c + 1), speed)
    // no return — nothing is ever cleared
  }, [speed])

  return (
    <Card className="h-100 border-danger-subtle">
      <Card.Header className="bg-danger-subtle small fw-semibold">
        ❌ no cleanup
      </Card.Header>
      <Card.Body className="text-center">
        <div className="display-6 fw-semibold">{count}</div>
        <div className="small text-muted">
          timers started: <Badge bg="danger">{startedRef.current}</Badge>
        </div>
      </Card.Body>
    </Card>
  )
}

/** The same thing, done correctly. */
function CleanTicker({ speed }: { speed: number }) {
  const [count, setCount] = useState(0)
  const startedRef = useRef(0)

  useEffect(() => {
    startedRef.current += 1
    const id = setInterval(() => setCount((c) => c + 1), speed)
    return () => clearInterval(id)
  }, [speed])

  return (
    <Card className="h-100 border-success-subtle">
      <Card.Header className="bg-success-subtle small fw-semibold">
        ✅ returns clearInterval
      </Card.Header>
      <Card.Body className="text-center">
        <div className="display-6 fw-semibold">{count}</div>
        <div className="small text-muted">
          timers started: <Badge bg="success">{startedRef.current}</Badge> (only one alive)
        </div>
      </Card.Body>
    </Card>
  )
}

export default function IntervalLab() {
  const [speed, speedSet] = useState(1000)
  const [mounted, setMounted] = useState(true)

  return (
    <DemoCard
      title="Cleanup, or leak"
      claim="An effect without cleanup leaves its timer running. Change a dependency three times and you have four timers, all still firing."
      level="core"
      notice={
        <ul className="mb-0">
          <li>
            Both counters start at the same rate. Now drag the <strong>speed</strong>{" "}
            slider a few times: the effect re-runs on each change, and the left counter{" "}
            <strong>accelerates</strong> because every old interval is still alive.
          </li>
          <li>
            The right counter's cleanup clears the previous timer before starting a new one,
            so exactly one is ever running.
          </li>
          <li>
            Unmount and remount. The left one keeps counting <em>while unmounted</em> — the
            timers survive the component and try to set state on something that's gone.
            React ignores those updates, but the work and the memory are real.
          </li>
          <li>
            In development, Strict Mode already exposes this: the left counter starts at 2
            timers on the very first mount. That's the signal, and it's why you shouldn't
            turn Strict Mode off.
          </li>
        </ul>
      }
    >
      <Alert variant="warning" className="small">
        The left component leaks on purpose. Navigate away when you're done with this lab —
        its timers persist until you reload the page.
      </Alert>

      <Form.Group className="mb-3">
        <Form.Label className="small">
          Interval speed: {speed}ms — every change re-runs the effect
        </Form.Label>
        <Form.Range
          min={200}
          max={2000}
          step={100}
          value={speed}
          onChange={(e) => speedSet(Number(e.target.value))}
        />
        <ProgressBar
          now={((2100 - speed) / 1900) * 100}
          variant="secondary"
          style={{ height: 4 }}
        />
      </Form.Group>

      <Form.Check
        type="switch"
        label="mounted"
        checked={mounted}
        className="mb-3"
        onChange={(e) => setMounted(e.target.checked)}
      />

      {mounted ? (
        <Row className="g-3">
          <Col md={6}>
            <LeakyTicker speed={speed} />
          </Col>
          <Col md={6}>
            <CleanTicker speed={speed} />
          </Col>
        </Row>
      ) : (
        <Card body className="text-center text-muted small">
          Both unmounted. Remount and compare — the leaky one carried on counting.
        </Card>
      )}

      <Card body className="mt-3 small">
        <div className="fw-semibold mb-2">The cleanup checklist</div>
        <ul className="mb-0">
          <li><code>setInterval</code> / <code>setTimeout</code> → <code>clearInterval</code> / <code>clearTimeout</code></li>
          <li><code>addEventListener</code> → <code>removeEventListener</code> with the <em>same</em> function reference</li>
          <li>A subscription or socket → <code>unsubscribe()</code> / <code>close()</code></li>
          <li><code>fetch</code> → <code>controller.abort()</code></li>
          <li><code>ResizeObserver</code> / <code>IntersectionObserver</code> → <code>disconnect()</code></li>
        </ul>
      </Card>
    </DemoCard>
  )
}
```

Register as `{ id: "interval", chapter: "11 — Effects", title: "Cleanup, or leak", element: <IntervalLab /> }`.

**Experiments:**

1. Note the leaky counter uses `setCount(c => c + 1)`, not `setCount(count + 1)`. With the latter, every timer would set the count to the same stale value and it would appear stuck at 1 — a *different* bug hiding the leak. Try it, then restore.
2. Add `return () => clearInterval(id)` to `LeakyTicker`. Both sides behave identically. One line.
3. Replace `speed` in the dependency array with `[]` in `CleanTicker`. Changing speed no longer takes effect, because the interval was created once with the original value — the correct-but-frozen version. The dependency array is a statement about *when the effect's assumptions change*.

---

## 🧪 Lab 11.3 — Subscribing to the outside world

**Level:** depth

Effects exist to connect React to things React doesn't own. Three of them here, each with a different cleanup shape.

Create `src/demos/11-effects/SubscriptionsLab.tsx`:

```tsx
import { useEffect, useState } from "react"
import { Badge, Card, Col, Form, Row } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"

/** 1. An event listener — the most common subscription. */
function useWindowSize() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight })

  useEffect(() => {
    // A named function, so removeEventListener gets the same reference
    function handleResize() {
      setSize({ w: window.innerWidth, h: window.innerHeight })
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return size
}

/** 2. Two listeners, one effect, one cleanup. */
function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener("online", goOnline)
    window.addEventListener("offline", goOffline)
    return () => {
      window.removeEventListener("online", goOnline)
      window.removeEventListener("offline", goOffline)
    }
  }, [])

  return online
}

/** 3. A media query — a different subscription API with the same shape. */
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const list = window.matchMedia(query)
    function handleChange(e: MediaQueryListEvent) {
      setMatches(e.matches)
    }
    setMatches(list.matches)         // resync in case it changed before we subscribed
    list.addEventListener("change", handleChange)
    return () => list.removeEventListener("change", handleChange)
  }, [query])                         // re-subscribes if the query string changes

  return matches
}

/** 4. An observer — cleanup is disconnect(), not removeEventListener. */
function useElementWidth(): [(node: HTMLDivElement | null) => void, number] {
  const [node, setNode] = useState<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    if (!node) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) setWidth(Math.round(entry.contentRect.width))
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [node])

  return [setNode, width]
}

export default function SubscriptionsLab() {
  const size = useWindowSize()
  const online = useOnlineStatus()
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)")
  const isWide = useMediaQuery("(min-width: 992px)")
  const [boxRef, boxWidth] = useElementWidth()
  const [boxPercent, setBoxPercent] = useState(60)

  return (
    <DemoCard
      title="Subscribing to the outside world"
      claim="Effects are the bridge between React and things it doesn't own: window events, media queries, observers. Every one needs a matching teardown."
      level="depth"
      notice={
        <ul className="mb-0">
          <li>
            Resize the browser window and watch all four readouts respond. Each one is
            subscribed to a different external source, and none of them polls.
          </li>
          <li>
            Turn your OS to dark mode — the media-query row flips without a reload. React
            didn't know about the change; the subscription did.
          </li>
          <li>
            Go offline in DevTools (Network → Offline). The badge updates via two listeners
            cleaned up by one function.
          </li>
          <li>
            Drag the slider: the <code>ResizeObserver</code> reports the box's real pixel
            width. Its cleanup is <code>disconnect()</code> — the API differs, the pattern
            doesn't.
          </li>
          <li>
            Each of these is already a custom hook. That's not a coincidence — §12 argues
            that subscription effects are the clearest possible case for extraction.
          </li>
        </ul>
      }
    >
      <Row className="g-3">
        <Col md={6}>
          <Card body className="h-100">
            <div className="small text-muted mb-1">window size (resize listener)</div>
            <div className="fs-5 fw-semibold">
              {size.w} × {size.h}
            </div>
          </Card>
        </Col>
        <Col md={6}>
          <Card body className="h-100">
            <div className="small text-muted mb-1">connectivity (2 listeners)</div>
            <Badge bg={online ? "success" : "danger"} className="fs-6">
              {online ? "online" : "offline"}
            </Badge>
          </Card>
        </Col>
        <Col md={6}>
          <Card body className="h-100">
            <div className="small text-muted mb-1">media queries</div>
            <div className="d-flex flex-column gap-1 small">
              <span>
                prefers-color-scheme: dark →{" "}
                <Badge bg={prefersDark ? "dark" : "light"} text={prefersDark ? "light" : "dark"}>
                  {String(prefersDark)}
                </Badge>
              </span>
              <span>
                min-width: 992px →{" "}
                <Badge bg={isWide ? "primary" : "secondary"}>{String(isWide)}</Badge>
              </span>
            </div>
          </Card>
        </Col>
        <Col md={6}>
          <Card body className="h-100">
            <div className="small text-muted mb-1">ResizeObserver</div>
            <Form.Range
              min={20}
              max={100}
              value={boxPercent}
              onChange={(e) => setBoxPercent(Number(e.target.value))}
            />
            <div
              ref={boxRef}
              className="bg-primary-subtle border border-primary rounded-2 p-2 small text-center"
              style={{ width: `${boxPercent}%` }}
            >
              {boxWidth}px
            </div>
          </Card>
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "subscriptions", chapter: "11 — Effects", title: "Subscribing to the world", element: <SubscriptionsLab /> }`.

**Experiments:**

1. Change `useWindowSize`'s cleanup to use an inline arrow: `return () => window.removeEventListener("resize", () => {...})`. Resize the window a lot, then check `getEventListeners(window)` in the Chrome console — the listeners accumulate. Same function reference, or no removal.
2. Delete `setMatches(list.matches)` from `useMediaQuery`. Mostly fine, but there's a real window between reading the initial value and subscribing where a change would be missed. This class of bug is what `useSyncExternalStore` was designed to eliminate — worth reading about once you're comfortable here.
3. `useElementWidth` returns a **callback ref** (`setNode`) rather than a `useRef`. That's deliberate: a state setter as a ref means the effect re-runs when the node actually attaches, whereas `useRef` doesn't trigger anything. §15 covers callback refs; note the technique now.

---

## 🧪 Lab 11.4 — You might not need an effect

**Level:** depth — the highest-value lab in this section

Create `src/demos/11-effects/NoEffectLab.tsx`:

```tsx
import { useEffect, useState } from "react"
import { Alert, Badge, Button, Card, Col, Form, ListGroup, Row } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import { useRenderCount } from "@/lab/RenderBadge"

const words = ["react", "typescript", "bootstrap", "vite", "hooks", "reducer"]

// ---------- Anti-pattern 1: deriving in an effect ----------

function DerivingWithEffect({ query }: { query: string }) {
  const renders = useRenderCount()
  const [results, setResults] = useState<string[]>(words)

  useEffect(() => {
    setResults(words.filter((w) => w.includes(query.toLowerCase())))
  }, [query])

  return (
    <Card className="h-100 border-danger-subtle">
      <Card.Header className="bg-danger-subtle small fw-semibold">
        ❌ effect + state
      </Card.Header>
      <Card.Body>
        <Badge bg="danger" className="mb-2">
          {renders} renders
        </Badge>
        <ListGroup variant="flush">
          {results.map((w) => (
            <ListGroup.Item key={w} className="px-0 py-1 small">
              {w}
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Card.Body>
    </Card>
  )
}

function DerivingDirectly({ query }: { query: string }) {
  const renders = useRenderCount()
  const results = words.filter((w) => w.includes(query.toLowerCase()))

  return (
    <Card className="h-100 border-success-subtle">
      <Card.Header className="bg-success-subtle small fw-semibold">
        ✅ derived during render
      </Card.Header>
      <Card.Body>
        <Badge bg="success" className="mb-2">
          {renders} renders
        </Badge>
        <ListGroup variant="flush">
          {results.map((w) => (
            <ListGroup.Item key={w} className="px-0 py-1 small">
              {w}
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Card.Body>
    </Card>
  )
}

// ---------- Anti-pattern 2: an effect to notify the parent ----------

function ToggleWithEffect({ onChange }: { onChange: (on: boolean) => void }) {
  const [on, setOn] = useState(false)

  // Fires on mount too, telling the parent about a change that never happened.
  useEffect(() => {
    onChange(on)
  }, [on, onChange])

  return (
    <Form.Check
      type="switch"
      label="notifies via effect (also fires on mount)"
      checked={on}
      onChange={(e) => setOn(e.target.checked)}
    />
  )
}

function ToggleWithHandler({ onChange }: { onChange: (on: boolean) => void }) {
  const [on, setOn] = useState(false)

  function handleChange(next: boolean) {
    setOn(next)
    onChange(next)      // the user did it, so the handler reports it
  }

  return (
    <Form.Check
      type="switch"
      label="notifies in the handler (fires only on real changes)"
      checked={on}
      onChange={(e) => handleChange(e.target.checked)}
    />
  )
}

// ---------- Anti-pattern 3: chaining state through effects ----------

function ChainedEffects() {
  const [items, setItems] = useState<number[]>([])
  const [total, setTotal] = useState(0)
  const [average, setAverage] = useState(0)
  const renders = useRenderCount()

  useEffect(() => {
    setTotal(items.reduce((a, b) => a + b, 0))
  }, [items])

  useEffect(() => {
    setAverage(items.length === 0 ? 0 : total / items.length)
  }, [total, items.length])

  return (
    <Card className="h-100 border-danger-subtle">
      <Card.Header className="bg-danger-subtle small fw-semibold">
        ❌ three states, two effects
      </Card.Header>
      <Card.Body className="small">
        <Badge bg="danger" className="mb-2">
          {renders} renders
        </Badge>
        <div>items: [{items.join(", ")}]</div>
        <div>total: {total}</div>
        <div>average: {average.toFixed(2)}</div>
        <Button
          size="sm"
          variant="outline-danger"
          className="mt-2"
          onClick={() => setItems((prev) => [...prev, Math.ceil(Math.random() * 10)])}
        >
          Add a number
        </Button>
      </Card.Body>
    </Card>
  )
}

function DirectDerivation() {
  const [items, setItems] = useState<number[]>([])
  const renders = useRenderCount()

  const total = items.reduce((a, b) => a + b, 0)
  const average = items.length === 0 ? 0 : total / items.length

  return (
    <Card className="h-100 border-success-subtle">
      <Card.Header className="bg-success-subtle small fw-semibold">
        ✅ one state, no effects
      </Card.Header>
      <Card.Body className="small">
        <Badge bg="success" className="mb-2">
          {renders} renders
        </Badge>
        <div>items: [{items.join(", ")}]</div>
        <div>total: {total}</div>
        <div>average: {average.toFixed(2)}</div>
        <Button
          size="sm"
          variant="outline-success"
          className="mt-2"
          onClick={() => setItems((prev) => [...prev, Math.ceil(Math.random() * 10)])}
        >
          Add a number
        </Button>
      </Card.Body>
    </Card>
  )
}

export default function NoEffectLab() {
  const [query, setQuery] = useState("")
  const [effectNotifications, setEffectNotifications] = useState(0)
  const [handlerNotifications, setHandlerNotifications] = useState(0)

  return (
    <DemoCard
      title="You might not need an effect"
      claim="Three effects that shouldn't exist, and their replacements. Each removal deletes a state variable, a render, and a way to be wrong."
      level="depth"
      notice={
        <ul className="mb-0">
          <li>
            <strong>1 — Deriving.</strong> Type in the search box. The red card renders
            twice per keystroke (once with stale results, once with fresh) while the green
            one renders once. For one frame the red card shows the previous query's results.
          </li>
          <li>
            <strong>2 — Notifying.</strong> The effect-based toggle already reported a
            "change" before you touched it, because effects run on mount. The
            handler-based one has fired exactly as many times as you've clicked.
          </li>
          <li>
            <strong>3 — Chaining.</strong> The red card needs three renders to settle after
            one click: items → total → average. Every intermediate render is a moment where
            the numbers on screen don't add up.
          </li>
          <li>
            The heuristic:{" "}
            <strong>if an effect's only job is to call setState, try to delete it.</strong>
          </li>
        </ul>
      }
    >
      <Alert variant="light" className="border small">
        Render counts double under Strict Mode. Compare red against green, not against 1.
      </Alert>

      <h6 className="small fw-semibold text-uppercase text-muted mt-4">
        1 — Deriving data for display
      </h6>
      <Form.Control
        className="mb-3"
        placeholder="Search the word list…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <Row className="g-3 mb-4">
        <Col md={6}>
          <DerivingWithEffect query={query} />
        </Col>
        <Col md={6}>
          <DerivingDirectly query={query} />
        </Col>
      </Row>

      <h6 className="small fw-semibold text-uppercase text-muted">
        2 — Notifying a parent
      </h6>
      <Row className="g-3 mb-4">
        <Col md={6}>
          <Card body className="h-100 border-danger-subtle">
            <ToggleWithEffect onChange={() => setEffectNotifications((n) => n + 1)} />
            <div className="small text-muted mt-2">
              parent notified <Badge bg="danger">{effectNotifications}</Badge> times
            </div>
          </Card>
        </Col>
        <Col md={6}>
          <Card body className="h-100 border-success-subtle">
            <ToggleWithHandler onChange={() => setHandlerNotifications((n) => n + 1)} />
            <div className="small text-muted mt-2">
              parent notified <Badge bg="success">{handlerNotifications}</Badge> times
            </div>
          </Card>
        </Col>
      </Row>

      <h6 className="small fw-semibold text-uppercase text-muted">
        3 — Chaining state updates
      </h6>
      <Row className="g-3">
        <Col md={6}>
          <ChainedEffects />
        </Col>
        <Col md={6}>
          <DirectDerivation />
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "no-effect", chapter: "11 — Effects", title: "You might not need an effect", element: <NoEffectLab /> }`.

**Experiments:**

1. In `DerivingWithEffect`, add `console.log("rendering with", results.length, "results")` and type one character. Two lines: the first shows the *old* count. That one-frame lag is a real, if brief, wrong render.
2. Load the page and look at the effect-toggle's notification count before clicking anything. It's already ≥1. Now imagine that callback was `onDirtyChange` driving an "unsaved changes" warning — the form is dirty before the user has touched it. A real bug, from a real codebase, every time.
3. In `ChainedEffects`, add a number and watch the render badge. Then remove the second effect and derive `average` from `total` directly — one fewer render. Then remove the first too. Each removal is strictly better.

---

## 🧪 Lab 11.5 — `useEffect` vs `useLayoutEffect`

**Level:** optional

Create `src/demos/11-effects/LayoutEffectLab.tsx`:

```tsx
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { Button, Card, Col, Form, Row } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"

interface TooltipProps {
  text: string
  useLayout: boolean
  slow: boolean
}

/**
 * Measures its own height, then positions itself above the trigger.
 * With useEffect, the browser paints the un-positioned version first.
 */
function MeasuredTooltip({ text, useLayout, slow }: TooltipProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState(0)

  const measure = () => {
    if (!ref.current) return
    if (slow) {
      // Burn a few milliseconds so the flicker is visible on a fast machine
      const until = performance.now() + 40
      while (performance.now() < until) { /* block */ }
    }
    setOffset(-ref.current.offsetHeight - 8)
  }

  // Only one of these is active, chosen by the switch.
  useEffect(() => {
    if (!useLayout) measure()
  })
  useLayoutEffect(() => {
    if (useLayout) measure()
  })

  return (
    <div className="position-relative d-inline-block">
      <Button variant="outline-primary" size="sm">
        Trigger
      </Button>
      <div
        ref={ref}
        className="position-absolute bg-dark text-white rounded-2 px-2 py-1 small"
        style={{ top: offset, left: 0, whiteSpace: "nowrap" }}
      >
        {text}
      </div>
    </div>
  )
}

export default function LayoutEffectLab() {
  const [useLayout, setUseLayout] = useState(false)
  const [slow, setSlow] = useState(true)
  const [remountKey, setRemountKey] = useState(0)

  return (
    <DemoCard
      title="useEffect vs useLayoutEffect"
      claim="useEffect runs after the browser paints, so a measure-then-reposition shows one wrong frame. useLayoutEffect runs before paint, so the correction is invisible."
      level="optional"
      notice={
        <ul className="mb-0">
          <li>
            With the switch on <strong>useEffect</strong>, press <strong>Remount</strong>{" "}
            and watch closely: the tooltip appears <em>over</em> the button, then jumps
            above it. That's the frame the browser painted before the effect ran.
          </li>
          <li>
            Switch to <strong>useLayoutEffect</strong> and remount. No jump — React ran the
            measurement and the state update before the browser was allowed to paint.
          </li>
          <li>
            The "slow measurement" switch blocks for 40ms to make the difference visible.
            It also demonstrates the cost: with <code>useLayoutEffect</code>, that 40ms is
            40ms of frozen page. Blocking paint is the price.
          </li>
          <li>
            <strong>Default to <code>useEffect</code>.</strong> Reach for the layout variant
            only when you can actually see a flicker.
          </li>
        </ul>
      }
    >
      <Row className="g-3 mb-4">
        <Col md={6}>
          <Form.Check
            type="switch"
            checked={useLayout}
            onChange={(e) => setUseLayout(e.target.checked)}
            label={
              <span>
                using <code>{useLayout ? "useLayoutEffect" : "useEffect"}</code>
              </span>
            }
          />
        </Col>
        <Col md={6}>
          <Form.Check
            type="switch"
            checked={slow}
            onChange={(e) => setSlow(e.target.checked)}
            label="slow measurement (40ms) — makes the flicker visible"
          />
        </Col>
      </Row>

      <Card body className="text-center" style={{ paddingTop: 64, paddingBottom: 32 }}>
        <MeasuredTooltip
          key={remountKey}
          text="Positioned after measuring my own height"
          useLayout={useLayout}
          slow={slow}
        />
      </Card>

      <Button className="mt-3" onClick={() => setRemountKey((n) => n + 1)}>
        Remount and watch
      </Button>
    </DemoCard>
  )
}
```

Register as `{ id: "layout-effect", chapter: "11 — Effects", title: "useLayoutEffect", element: <LayoutEffectLab /> }`.

✅ **Concept check 11**

1. Which goes in an event handler and which in an effect: sending analytics on a click, and syncing state to `localStorage`?
2. When does cleanup run, besides unmount?
3. Why does `useEffect(() => {...}, [{ limit: 10 }])` run on every render?
4. Why does `removeEventListener` sometimes remove nothing?
5. Name three situations from the table where an effect is the wrong tool, and what replaces each.

---

# 12. Custom hooks

A custom hook is **a function whose name starts with `use` and which calls other hooks.** That's the entire definition. They exist to extract and reuse **stateful logic** — not markup.

```tsx
function useToggle(initial = false) {
  const [on, setOn] = useState(initial)
  const toggle = useCallback(() => setOn((v) => !v), [])
  return [on, toggle] as const
}

const [isOpen, toggleOpen] = useToggle()
```

## 12.1 The rules of hooks

These apply to built-in and custom hooks alike, and they're not stylistic:

1. **Only call hooks at the top level** of a component or another hook — never inside conditions, loops, or nested functions.
2. **Only call them from React functions** — components or other hooks. Not plain utilities, not event handlers, not class methods.

The reason for the first is mechanical. React has no idea what your variables are called; it tracks hooks by **call order**. First `useState` in this component, second `useState`, first `useEffect`, and so on. If a condition changes how many hooks run, every subsequent hook shifts position and starts reading someone else's state.

```tsx
function Broken({ showName }: { showName: boolean }) {
  if (showName) {
    const [name, setName] = useState("")   // ❌ conditional hook
  }
  const [age, setAge] = useState(0)        // reads slot 1 or slot 0 depending on the prop
}
```

The correct shape is always: **hooks unconditionally at the top, conditionals in the JSX or in the effect body.**

```tsx
function Fixed({ showName }: { showName: boolean }) {
  const [name, setName] = useState("")     // ✅ always called
  const [age, setAge] = useState(0)
  return showName ? <NameField value={name} onChange={setName} /> : <AgeField … />
}
```

The ESLint plugin `eslint-plugin-react-hooks` catches violations of both rules. Keep it enabled; it has an unusually low false-positive rate.

## 12.2 Two TypeScript details that make hooks work properly

**Generics let the caller's type flow through:**

```tsx
function useLocalStorage<T>(key: string, initialValue: T) { /* ... */ }

const [tasks, setTasks] = useLocalStorage<Task[]>("tasks", [])   // Task[], not any
```

Without `<T>`, you'd need a separate hook per type, or `any`, which defeats the point.

**`as const` on a tuple return:**

```tsx
return [value, setValue]            // ❌ (T | Dispatch<SetStateAction<T>>)[]
return [value, setValue] as const   // ✅ readonly [T, Dispatch<SetStateAction<T>>]
```

Without `as const`, TypeScript infers an **array of the union** of both element types, so destructuring gives *both* variables that useless union — and `setValue(x)` fails because "value might not be a function". With `as const` it's a **tuple** with a distinct type per position.

**Rule: array returns need `as const`; object returns don't.**

```tsx
// Tuple — the caller can rename freely: const [tasks, setTasks] = ...
return [value, setValue] as const

// Object — self-documenting, extensible, no `as const` needed
return { tasks, addTask, toggleTask, deleteTask }
```

Use a **tuple** when there are one or two values and renaming matters (mirroring `useState`). Use an **object** when there are three or more, or when you expect to add more later — adding a field to an object is backwards-compatible, while adding a third tuple element is a positional change every caller must be aware of.

## 12.3 Each call gets its own state

```tsx
function A() { const [x] = useLocalStorage("k", 0) }
function B() { const [y] = useLocalStorage("k", 0) }
```

`A` and `B` share **code**, not state. Two components using `useLocalStorage` with the same key each keep their own React state; they only agree because they both write to the same storage entry, and they won't see each other's writes until something re-renders them. **A custom hook is not a store.** For genuinely shared state you need Context (§14) or a store library.

This trips people up constantly, so it's worth stating the inverse: if you want two components to agree, don't reach for a hook — lift the state (§9) or provide it (§14).

## 12.4 When *not* to extract a hook

Extraction has a cost: indirection. Don't extract when:

- **It's used once and isn't complex.** A single `useState` and a handler is clearer inline.
- **You'd be extracting markup.** That's a component, not a hook.
- **The "hook" calls no hooks.** Then it's a plain function — and plain functions are better, because they're testable without a renderer and callable from anywhere. Don't name it `use*` if it doesn't use hooks.
- **You're grouping unrelated logic** because it's all in one component. A `usePageLogic()` that returns nineteen things is a component with extra steps.

Good signals *to* extract: the same three lines of `useEffect` plumbing appear in two components; a subscription with cleanup; something you want to unit test in isolation; a name that makes the calling component read better.

---

## 🧪 Lab 12.1 — `useToggle`, and why `as const` matters

**Level:** core

Create `src/demos/12-hooks/useToggle.ts`:

```ts
import { useCallback, useState } from "react"

/** Tuple return — mirrors useState, so callers can name things freely. */
export function useToggle(initial = false) {
  const [on, setOn] = useState(initial)

  const toggle = useCallback(() => setOn((v) => !v), [])
  const setTrue = useCallback(() => setOn(true), [])
  const setFalse = useCallback(() => setOn(false), [])

  return [on, toggle, { setTrue, setFalse }] as const
}

/** The same thing without `as const` — kept only to show the type failure. */
export function useToggleBroken(initial = false) {
  const [on, setOn] = useState(initial)
  const toggle = () => setOn((v) => !v)
  return [on, toggle]
}
```

Create `src/demos/12-hooks/ToggleLab.tsx`:

```tsx
import { Alert, Badge, Button, Card, Col, Collapse, Modal, Row } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import { useToggle } from "@/demos/12-hooks/useToggle"

export default function ToggleLab() {
  // Three independent instances of the same hook
  const [showDetails, toggleDetails] = useToggle(false)
  const [modalOpen, toggleModal, modalControls] = useToggle(false)
  const [darkPanel, toggleDark] = useToggle(false)

  return (
    <DemoCard
      title="useToggle and the as const rule"
      claim="A three-line hook removes a state variable and a handler from every component that needs a boolean. `as const` is what makes the tuple return usable."
      level="core"
      notice={
        <ul className="mb-0">
          <li>
            Three calls, three completely independent booleans. The hook is shared code, not
            shared state — §12.3.
          </li>
          <li>
            Hover <code>showDetails</code> in your editor: it's <code>boolean</code>, and{" "}
            <code>toggleDetails</code> is <code>() =&gt; void</code>. Now open{" "}
            <code>useToggle.ts</code>, delete <code>as const</code>, and hover again — both
            become <code>boolean | (() =&gt; void)</code> and the component stops compiling.
          </li>
          <li>
            The third tuple slot is an <em>object</em> of extra controls. That's a practical
            compromise: two positional values for the common case, named ones for the rest.
          </li>
          <li>
            <code>toggle</code> is wrapped in <code>useCallback</code> with an empty
            dependency array, so its identity is stable forever — which matters if a caller
            passes it to a memoised child or an effect.
          </li>
        </ul>
      }
    >
      <Row className="g-3">
        <Col md={4}>
          <Card body className="h-100">
            <div className="small fw-semibold text-muted mb-2">Collapse</div>
            <Button size="sm" onClick={toggleDetails}>
              {showDetails ? "Hide" : "Show"} details
            </Button>
            <Collapse in={showDetails}>
              <div>
                <Alert variant="light" className="border small mt-2 mb-0">
                  Revealed content. React-Bootstrap's <code>Collapse</code> takes an{" "}
                  <code>in</code> prop — a controlled component, exactly as §9.3 described.
                </Alert>
              </div>
            </Collapse>
          </Card>
        </Col>

        <Col md={4}>
          <Card body className="h-100">
            <div className="small fw-semibold text-muted mb-2">Modal</div>
            <div className="d-flex gap-2">
              <Button size="sm" onClick={toggleModal}>
                Open
              </Button>
              <Button size="sm" variant="outline-secondary" onClick={modalControls.setFalse}>
                Force close
              </Button>
            </div>
            <Modal show={modalOpen} onHide={modalControls.setFalse} centered>
              <Modal.Header closeButton>
                <Modal.Title>From a three-line hook</Modal.Title>
              </Modal.Header>
              <Modal.Body className="small">
                <code>onHide</code> needs "set false", not "toggle" — which is why the hook
                returns both.
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={modalControls.setFalse}>
                  Close
                </Button>
              </Modal.Footer>
            </Modal>
          </Card>
        </Col>

        <Col md={4}>
          <Card
            body
            className="h-100"
            data-bs-theme={darkPanel ? "dark" : undefined}
          >
            <div className="small fw-semibold text-muted mb-2">
              Bootstrap dark mode
            </div>
            <Button size="sm" variant="primary" onClick={toggleDark}>
              Toggle
            </Button>
            <div className="small mt-2">
              <code>data-bs-theme</code> ={" "}
              <Badge bg="secondary">{darkPanel ? "dark" : "(unset)"}</Badge>
            </div>
            <div className="small text-muted mt-2">
              One attribute recolours everything inside, because Bootstrap 5.3's utilities
              are theme-aware.
            </div>
          </Card>
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "use-toggle", chapter: "12 — Custom hooks", title: "useToggle & as const", element: <ToggleLab /> }`.

**Experiments:**

1. Delete `as const` and read the error at the destructuring site. It's one of the more confusing messages TypeScript produces, and recognising it saves ten minutes each time.
2. Convert `useToggle` to return an object `{ on, toggle, setTrue, setFalse }` and update the call sites. No `as const` needed — but now every caller uses the name `on`, and three toggles in one component need renaming: `const { on: showDetails, toggle: toggleDetails } = useToggle()`. That renaming friction is exactly why `useState` returns a tuple.
3. Remove `useCallback` from `toggle`. Everything still works. Add `console.log` in an effect depending on `[toggle]` and it now fires on every render. Stable identities in hooks you publish are a courtesy to callers.

---

## 🧪 Lab 12.2 — A generic `useLocalStorage`

**Level:** core

Create `src/demos/12-hooks/useLocalStorage.ts`:

```ts
import { useCallback, useEffect, useState } from "react"

/**
 * useState, but persisted. The generic <T> carries the caller's type through.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    // Lazy initialiser: read storage once, on mount — §6.6
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
      // Storage full, or blocked in a privacy mode. Fail quietly.
    }
  }, [key, value])

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(key)
    } catch { /* ignore */ }
    setValue(initialValue)
  }, [key, initialValue])

  return [value, setValue, clear] as const
}
```

Create `src/demos/12-hooks/LocalStorageLab.tsx`:

```tsx
import { Alert, Badge, Button, Card, Col, Form, Row } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import StateInspector from "@/lab/StateInspector"
import { useLocalStorage } from "@/demos/12-hooks/useLocalStorage"

interface Prefs {
  name: string
  notifications: boolean
  itemsPerPage: number
}

/** Two components using the SAME key — to prove they don't share state. */
function CounterPanel({ label, colour }: { label: string; colour: string }) {
  const [count, setCount] = useLocalStorage<number>("lab.sharedCounter", 0)

  return (
    <Card body className="h-100">
      <div className="small fw-semibold text-muted mb-2">{label}</div>
      <div className="fs-4 fw-semibold">{count}</div>
      <Button size="sm" variant={colour} onClick={() => setCount((c) => c + 1)}>
        +1
      </Button>
      <div className="small text-muted mt-2">
        key: <code>lab.sharedCounter</code>
      </div>
    </Card>
  )
}

export default function LocalStorageLab() {
  const [prefs, setPrefs, clearPrefs] = useLocalStorage<Prefs>("lab.prefs", {
    name: "",
    notifications: true,
    itemsPerPage: 25,
  })

  const [tags, setTags, clearTags] = useLocalStorage<string[]>("lab.tags", ["react"])

  function update<K extends keyof Prefs>(field: K, value: Prefs[K]) {
    setPrefs((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <DemoCard
      title="A generic useLocalStorage"
      claim="One hook, any type, fully inferred — and a concrete demonstration that two calls to the same hook do not share state."
      level="core"
      notice={
        <ul className="mb-0">
          <li>
            Change the preferences, then <strong>reload the page</strong>. They come back.
            The whole persistence mechanism is nine lines, reusable for any serialisable
            type.
          </li>
          <li>
            <code>useLocalStorage&lt;Prefs&gt;</code> and{" "}
            <code>useLocalStorage&lt;string[]&gt;</code> in the same component, both fully
            typed. Hover the results and note there's no <code>any</code> anywhere.
          </li>
          <li>
            <strong>The two counters use the same storage key</strong> and still don't stay
            in sync — click one and watch the other stay put. Each hook call has its own
            React state; they only agree after a reload. <strong>A hook is not a store.</strong>
          </li>
          <li>
            Open DevTools → Application → Local Storage and watch the values change as you
            type. Then edit one there and reload.
          </li>
        </ul>
      }
    >
      <Row className="g-3">
        <Col lg={6}>
          <Card body>
            <div className="small fw-semibold text-muted mb-3">
              Persisted preferences — <code>useLocalStorage&lt;Prefs&gt;</code>
            </div>

            <Form.Group className="mb-3">
              <Form.Label className="small">Name</Form.Label>
              <Form.Control
                value={prefs.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Persists across reloads"
              />
            </Form.Group>

            <Form.Check
              type="switch"
              className="mb-3"
              label={<span className="small">Notifications</span>}
              checked={prefs.notifications}
              onChange={(e) => update("notifications", e.target.checked)}
            />

            <Form.Group className="mb-3">
              <Form.Label className="small">
                Items per page: {prefs.itemsPerPage}
              </Form.Label>
              <Form.Range
                min={5}
                max={100}
                step={5}
                value={prefs.itemsPerPage}
                onChange={(e) => update("itemsPerPage", Number(e.target.value))}
              />
            </Form.Group>

            <Button size="sm" variant="outline-danger" onClick={clearPrefs}>
              Clear stored prefs
            </Button>
          </Card>
        </Col>

        <Col lg={6}>
          <StateInspector label="prefs" value={prefs} />

          <Card body className="mt-3">
            <div className="small fw-semibold text-muted mb-2">
              A different type, same hook — <code>string[]</code>
            </div>
            <div className="d-flex flex-wrap gap-1 mb-2">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  bg="secondary"
                  role="button"
                  onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                >
                  {tag} ×
                </Badge>
              ))}
              {tags.length === 0 && <span className="small text-muted">no tags</span>}
            </div>
            <div className="d-flex gap-2">
              <Button
                size="sm"
                variant="outline-primary"
                onClick={() =>
                  setTags((prev) =>
                    prev.includes("typescript") ? prev : [...prev, "typescript"]
                  )
                }
              >
                Add "typescript"
              </Button>
              <Button size="sm" variant="outline-secondary" onClick={clearTags}>
                Reset
              </Button>
            </div>
          </Card>
        </Col>

        <Col xs={12}>
          <Alert variant="warning" className="small mb-0">
            Below: two components, one storage key, <strong>two separate states.</strong>
          </Alert>
        </Col>
        <Col md={6}>
          <CounterPanel label="Counter A" colour="primary" />
        </Col>
        <Col md={6}>
          <CounterPanel label="Counter B" colour="success" />
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "use-local-storage", chapter: "12 — Custom hooks", title: "useLocalStorage<T>", element: <LocalStorageLab /> }`.

**Experiments:**

1. Click Counter A five times, then reload. Both show 5 — they were never in sync, they just read the same storage on mount. Now click A again and B is stale once more.
2. Corrupt the data: `localStorage.setItem("lab.prefs", "{oops")` in the console, then reload. The `catch` returns the initial value. Now try `localStorage.setItem("lab.prefs", '{"name":42}')` — valid JSON, wrong shape, and it flows straight into typed state. `as T` is a promise, not a check. §17 fixes this properly with zod.
3. Remove the `try`/`catch` from the initialiser and repeat the first corruption. The whole app fails to mount with a white screen. Storage is external input; treat it as hostile.

---

## 🧪 Lab 12.3 — `useDebouncedValue` and composing hooks

**Level:** depth

Create `src/demos/12-hooks/useDebouncedValue.ts`:

```ts
import { useEffect, useState } from "react"

/**
 * Returns `value` only after it has stopped changing for `delay` ms.
 * The cleanup cancelling the previous timer is the whole trick.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)     // ← cancels the pending update on every keystroke
  }, [value, delay])

  return debounced
}
```

Create `src/demos/12-hooks/usePrevious.ts`:

```ts
import { useEffect, useRef } from "react"

/** The value from the previous render. undefined on the first. */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined)

  useEffect(() => {
    ref.current = value      // runs AFTER render, so during render ref holds the old value
  }, [value])

  return ref.current
}
```

Create `src/demos/12-hooks/DebounceLab.tsx`:

```tsx
import { useEffect, useState } from "react"
import { Badge, Card, Col, Form, ListGroup, Row, Spinner } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import LogPanel from "@/lab/LogPanel"
import { useEventLog } from "@/lab/useEventLog"
import { useDebouncedValue } from "@/demos/12-hooks/useDebouncedValue"
import { usePrevious } from "@/demos/12-hooks/usePrevious"

const catalogue = [
  "React", "React Router", "React Query", "Redux Toolkit",
  "TypeScript", "Type Guards", "Bootstrap", "Vite", "Vitest", "Zod",
]

export default function DebounceLab() {
  const [query, setQuery] = useState("")
  const [delay, setDelay] = useState(400)
  const debouncedQuery = useDebouncedValue(query, delay)
  const previousDebounced = usePrevious(debouncedQuery)
  const { entries, log, clear } = useEventLog()

  const isSettling = query !== debouncedQuery

  // A "search" that only runs when the debounced value changes
  const [results, setResults] = useState<string[]>(catalogue)
  useEffect(() => {
    log(`🔎 search fired for "${debouncedQuery}"`)
    setResults(
      catalogue.filter((item) =>
        item.toLowerCase().includes(debouncedQuery.trim().toLowerCase())
      )
    )
  }, [debouncedQuery, log])

  return (
    <DemoCard
      title="useDebouncedValue and usePrevious"
      claim="An effect whose cleanup cancels its own timer becomes a debounce. Two lines of state plus one ref give you the previous render's value."
      level="depth"
      notice={
        <ul className="mb-0">
          <li>
            Type quickly. The live value updates on every keystroke; the debounced one waits
            until you pause. The log shows the "search" firing <strong>once</strong>, not
            once per character.
          </li>
          <li>
            The mechanism is §11.3: each keystroke re-runs the effect, whose cleanup{" "}
            <code>clearTimeout</code>s the previous pending update. Only the last timer
            survives.
          </li>
          <li>
            <code>isSettling</code> is derived (<code>query !== debouncedQuery</code>) — the
            spinner needs no state of its own.
          </li>
          <li>
            <code>usePrevious</code> works because effects run <em>after</em> render, so
            during render the ref still holds the value written on the previous pass. Neat,
            and a good illustration of why refs and state are different tools (§15).
          </li>
        </ul>
      }
    >
      <Row className="g-3">
        <Col lg={6}>
          <Form.Group className="mb-3">
            <Form.Label className="small">
              Search — debounced by {delay}ms
            </Form.Label>
            <div className="position-relative">
              <Form.Control
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type quickly…"
              />
              {isSettling && (
                <Spinner
                  animation="border"
                  size="sm"
                  className="position-absolute top-50 end-0 translate-middle-y me-2 text-muted"
                />
              )}
            </div>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="small">Delay: {delay}ms</Form.Label>
            <Form.Range
              min={0}
              max={1500}
              step={100}
              value={delay}
              onChange={(e) => setDelay(Number(e.target.value))}
            />
          </Form.Group>

          <Card body className="mb-3 small">
            <div className="d-flex justify-content-between">
              <span className="text-muted">live value</span>
              <code>{query || "(empty)"}</code>
            </div>
            <div className="d-flex justify-content-between mt-1">
              <span className="text-muted">debounced value</span>
              <code>{debouncedQuery || "(empty)"}</code>
            </div>
            <div className="d-flex justify-content-between mt-1">
              <span className="text-muted">previous debounced</span>
              <code>{previousDebounced ?? "(undefined)"}</code>
            </div>
            <div className="d-flex justify-content-between mt-1">
              <span className="text-muted">settling?</span>
              <Badge bg={isSettling ? "warning" : "success"}>{String(isSettling)}</Badge>
            </div>
          </Card>

          <ListGroup>
            {results.length === 0 ? (
              <ListGroup.Item className="small text-muted">
                Nothing matches "{debouncedQuery}".
              </ListGroup.Item>
            ) : (
              results.map((item) => (
                <ListGroup.Item key={item} className="small py-1">
                  {item}
                </ListGroup.Item>
              ))
            )}
          </ListGroup>
        </Col>

        <Col lg={6}>
          <LogPanel entries={entries} onClear={clear} height={480} title="Search calls" />
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "debounce", chapter: "12 — Custom hooks", title: "useDebouncedValue", element: <DebounceLab /> }`.

**Experiments:**

1. Set the delay to 0 and type. The search fires on every keystroke — debouncing is entirely the timer's doing, not the hook's structure.
2. Remove `return () => clearTimeout(id)` from `useDebouncedValue`. Now every keystroke schedules an update that *all* fire, in order, and the search runs once per character with a delay. The cleanup isn't tidiness here; it's the feature.
3. Change `usePrevious` to set `ref.current = value` during render instead of in an effect. It now returns the *current* value, always — because the write happens before the return. The effect's timing is what makes the hook work.

---

## 🧪 Lab 12.4 — Rules of hooks, broken on purpose

**Level:** depth

Create `src/demos/12-hooks/RulesOfHooksLab.tsx`:

```tsx
import { useState } from "react"
import { Alert, Button, Card, Col, Form, Row } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"

/**
 * ❌ A conditional hook. React tracks hooks by call order, so when
 * `withEmail` flips, every subsequent hook reads the wrong slot.
 *
 * Uncomment the marked lines to see React throw.
 */
function BrokenForm({ withEmail }: { withEmail: boolean }) {
  const [name, setName] = useState("Ada")

  // if (withEmail) {
  //   const [email, setEmail] = useState("")   // ← uncomment to break it
  // }

  const [age, setAge] = useState(30)

  return (
    <Card body className="h-100 border-danger-subtle">
      <div className="small fw-semibold text-danger mb-2">
        ❌ would break: conditional hook
      </div>
      <Form.Control
        size="sm"
        className="mb-2"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Form.Control
        size="sm"
        type="number"
        value={age}
        onChange={(e) => setAge(Number(e.target.value))}
      />
      <div className="small text-muted mt-2">
        withEmail = {String(withEmail)} · the hook is commented out so the lab still runs
      </div>
    </Card>
  )
}

/** ✅ All hooks always run; the condition lives in the JSX. */
function FixedForm({ withEmail }: { withEmail: boolean }) {
  const [name, setName] = useState("Ada")
  const [email, setEmail] = useState("")     // always called
  const [age, setAge] = useState(30)

  return (
    <Card body className="h-100 border-success-subtle">
      <div className="small fw-semibold text-success mb-2">
        ✅ hooks at the top, condition in the JSX
      </div>
      <Form.Control
        size="sm"
        className="mb-2"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      {withEmail && (
        <Form.Control
          size="sm"
          className="mb-2"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      )}
      <Form.Control
        size="sm"
        type="number"
        value={age}
        onChange={(e) => setAge(Number(e.target.value))}
      />
      <div className="small text-muted mt-2">
        withEmail = {String(withEmail)} · state for email exists either way
      </div>
    </Card>
  )
}

export default function RulesOfHooksLab() {
  const [withEmail, setWithEmail] = useState(false)

  return (
    <DemoCard
      title="Rules of hooks, and why they exist"
      claim="React identifies hooks by call order, not by name. A hook inside a condition shifts every hook after it into someone else's slot."
      level="depth"
      notice={
        <ul className="mb-0">
          <li>
            React stores hook state as an ordered list per component instance: slot 0, slot
            1, slot 2. Your variable names are invisible to it.
          </li>
          <li>
            Uncomment the marked lines in <code>BrokenForm</code> and toggle the switch.
            React throws{" "}
            <em>"Rendered more hooks than during the previous render"</em> — and if it
            didn't, <code>age</code> would silently start reading the email's slot.
          </li>
          <li>
            The fix is never "make the condition cleverer". It's{" "}
            <strong>always call every hook, then decide what to render.</strong>
          </li>
          <li>
            The cost of always calling is one unused state variable. That's it. It's a very
            cheap rule to obey.
          </li>
        </ul>
      }
    >
      <Form.Check
        type="switch"
        className="mb-3"
        label="withEmail"
        checked={withEmail}
        onChange={(e) => setWithEmail(e.target.checked)}
      />

      <Row className="g-3">
        <Col md={6}>
          <BrokenForm withEmail={withEmail} />
        </Col>
        <Col md={6}>
          <FixedForm withEmail={withEmail} />
        </Col>
      </Row>

      <Alert variant="light" className="border small mt-3 mb-0">
        <div className="fw-semibold mb-1">The other four ways to break the rules</div>
        <ul className="mb-0">
          <li>A hook inside a loop — the count varies with the data</li>
          <li>A hook inside an event handler — not a React function</li>
          <li>A hook after an early <code>return</code> — the same problem as a condition</li>
          <li>A hook in a plain utility function — no component instance to attach to</li>
        </ul>
        <div className="text-muted mt-2">
          <code>eslint-plugin-react-hooks</code> catches all of them. Keep it on.
        </div>
      </Alert>
    </DemoCard>
  )
}
```

Register as `{ id: "rules-of-hooks", chapter: "12 — Custom hooks", title: "Rules of hooks", element: <RulesOfHooksLab /> }`.

✅ **Concept check 12**

1. What makes something a custom hook rather than a utility function?
2. Why must hooks be called unconditionally, in the same order, every render?
3. What goes wrong without `as const` on a tuple return, and when don't you need it?
4. Do two components calling `useLocalStorage("k", 0)` share state? Explain.
5. Give two signals that logic *should* be extracted into a hook, and two that it shouldn't.

---

# 13. `useReducer`

When state updates get complex — many related fields, or transitions that depend on the current state — a reducer centralises the logic in one pure function.

```tsx
const [state, dispatch] = useReducer(reducer, initialState)

dispatch({ type: "toggled", id: "3" })
```

The three parts:

- **State** — one value, usually an object or array.
- **Actions** — plain objects describing *what happened*, dispatched by your components.
- **Reducer** — a pure function `(state, action) => newState` that decides how each action changes the state.

The mental shift from `useState` is that components stop describing *how* to change state and start describing *what occurred*. `dispatch({ type: "taskCompleted", id })` says nothing about arrays or spreading; the reducer owns all of that.

## 13.1 Typing actions: the discriminated union

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
- **No wrong payloads.** `dispatch({ type: "toggled", id: 42 })` is caught too.
- **Exhaustiveness checking**, if you want it.

## 13.2 The `never` trick

```ts
default: {
  const _exhaustive: never = action
  throw new Error(`Unhandled action: ${JSON.stringify(_exhaustive)}`)
}
```

If every case is handled, `action` has been narrowed to `never` by the time control reaches `default`, and assigning `never` to `never` compiles. Add a new action to the union and forget its case, and `action` is that new type — which isn't assignable to `never`, so **this line fails to compile and points you straight at the gap.**

This single trick prevents a whole category of bug as an app grows, and it costs three lines. Use it in every reducer you write.

An alternative if you dislike the throw: omit `default` entirely and give the function an explicit return type. TypeScript then complains that not all code paths return a value. Both work; the `never` version gives a better error message.

## 13.3 A reducer must be pure

**`(state, action) => newState`.** No fetching, no timers, no `Math.random()`, no `Date.now()`, no mutation, no `localStorage`.

Two of those deserve emphasis, because they're the ones people get wrong:

```ts
// ❌ impure: a different result each time it's called with the same inputs
case "added":
  return [{ id: crypto.randomUUID(), createdAt: Date.now(), ...action.payload }, ...state]
```

Strict Mode double-invokes reducers in development for exactly this reason, and an impure reducer can produce different results on the two calls. It usually still *works*, which is why this is tolerated in a lot of real code. The rigorous fix is to generate the id in the **action creator or event handler** and pass it in the action:

```ts
// ✅ the impurity happens once, outside the reducer
dispatch({ type: "added", id: crypto.randomUUID(), createdAt: Date.now(), title, priority })
```

Purity is what makes a reducer **trivially testable**: you can unit test every transition without rendering anything, without mocking, and without a browser. Lab 13.4 does exactly that, and it's the easiest testing win in the whole document.

## 13.4 `useState` or `useReducer`?

| Use `useState` | Use `useReducer` |
|---|---|
| Independent values | Several values that change together |
| Simple set operations | Next state depends on current state in non-trivial ways |
| Few update paths | Many actions, or the same update fired from many places |
| Logic lives happily in the handler | You want update logic testable in isolation |
| — | You need to log or replay every change |
| — | You want the list of possible changes documented in one place |

Both are equally valid, and mixing them in one component is normal — a reducer for the complex list, `useState` for "is the menu open".

Reducers pay off as the number of distinct actions grows, and in TypeScript they pay off **sooner**, because the action union documents every way your state can change in one readable block. That block is often the best documentation a feature has.

## 13.5 Practical details

**Lazy initialisation** uses the third argument:

```tsx
const [tasks, dispatch] = useReducer(tasksReducer, initialTasks, init)
// init(initialTasks) is called once, on mount — same idea as useState(() => ...)
```

**`dispatch` is referentially stable forever.** React guarantees it, so you can list it in a dependency array or pass it to a memoised child with no `useCallback`. This is a genuine advantage over passing a set of `useState` handlers down, each of which needs memoising to be stable.

**Name actions in the past tense** — `added`, `deleted`, `filterChanged` — because they describe events that have happened, not commands. It reads better and it discourages putting UI decisions in action names (`showErrorAndScrollToTop` is a smell).

**Type inference:** TypeScript infers the state type from the reducer's signature, so `useReducer(tasksReducer, [])` gives you `Task[]` with no generic needed. If inference struggles, annotate the reducer's parameters and return type — that's where the information should live anyway.

---

## 🧪 Lab 13.1 — The same feature, twice

**Level:** core

Create `src/demos/13-reducer/CounterCompareLab.tsx`:

```tsx
import { useReducer, useState } from "react"
import { Button, ButtonGroup, Card, Col, Form, Row } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import StateInspector from "@/lab/StateInspector"

// ---------- version A: useState ----------

function WithUseState() {
  const [count, setCount] = useState(0)
  const [step, setStep] = useState(1)
  const [history, setHistory] = useState<number[]>([0])

  function change(delta: number) {
    setCount((c) => {
      const next = Math.max(0, Math.min(100, c + delta))
      setHistory((h) => [...h, next])     // a second setter, coupled to the first
      return next
    })
  }

  return (
    <Card className="h-100">
      <Card.Header className="small fw-semibold">useState — three variables</Card.Header>
      <Card.Body>
        <div className="display-6 fw-semibold text-center">{count}</div>
        <ButtonGroup className="w-100 my-2">
          <Button variant="outline-primary" onClick={() => change(-step)}>−{step}</Button>
          <Button variant="outline-primary" onClick={() => change(step)}>+{step}</Button>
          <Button
            variant="outline-secondary"
            onClick={() => {
              setCount(0)
              setStep(1)
              setHistory([0])
            }}
          >
            Reset
          </Button>
        </ButtonGroup>
        <Form.Group>
          <Form.Label className="small">step: {step}</Form.Label>
          <Form.Range min={1} max={10} value={step} onChange={(e) => setStep(Number(e.target.value))} />
        </Form.Group>
        <div className="small text-muted">
          history: {history.slice(-8).join(" → ")}
        </div>
      </Card.Body>
    </Card>
  )
}

// ---------- version B: useReducer ----------

interface CounterState {
  count: number
  step: number
  history: number[]
}

type CounterAction =
  | { type: "incremented" }
  | { type: "decremented" }
  | { type: "stepChanged"; step: number }
  | { type: "reset" }

const initialState: CounterState = { count: 0, step: 1, history: [0] }

function clamp(n: number) {
  return Math.max(0, Math.min(100, n))
}

function counterReducer(state: CounterState, action: CounterAction): CounterState {
  switch (action.type) {
    case "incremented": {
      const count = clamp(state.count + state.step)
      return { ...state, count, history: [...state.history, count] }
    }
    case "decremented": {
      const count = clamp(state.count - state.step)
      return { ...state, count, history: [...state.history, count] }
    }
    case "stepChanged":
      return { ...state, step: action.step }
    case "reset":
      return initialState
    default: {
      const _exhaustive: never = action
      throw new Error(`Unhandled action: ${JSON.stringify(_exhaustive)}`)
    }
  }
}

function WithUseReducer() {
  const [state, dispatch] = useReducer(counterReducer, initialState)

  return (
    <Card className="h-100 border-success-subtle">
      <Card.Header className="bg-success-subtle small fw-semibold">
        useReducer — one state, four actions
      </Card.Header>
      <Card.Body>
        <div className="display-6 fw-semibold text-center">{state.count}</div>
        <ButtonGroup className="w-100 my-2">
          <Button variant="outline-success" onClick={() => dispatch({ type: "decremented" })}>
            −{state.step}
          </Button>
          <Button variant="outline-success" onClick={() => dispatch({ type: "incremented" })}>
            +{state.step}
          </Button>
          <Button variant="outline-secondary" onClick={() => dispatch({ type: "reset" })}>
            Reset
          </Button>
        </ButtonGroup>
        <Form.Group>
          <Form.Label className="small">step: {state.step}</Form.Label>
          <Form.Range
            min={1}
            max={10}
            value={state.step}
            onChange={(e) => dispatch({ type: "stepChanged", step: Number(e.target.value) })}
          />
        </Form.Group>
        <div className="small text-muted">
          history: {state.history.slice(-8).join(" → ")}
        </div>
      </Card.Body>
    </Card>
  )
}

export default function CounterCompareLab() {
  const [, force] = useState(0)
  return (
    <DemoCard
      title="useState vs useReducer, same feature"
      claim="Once state values depend on each other, the reducer version keeps the logic in one testable place while the useState version scatters it across handlers."
      level="core"
      notice={
        <ul className="mb-0">
          <li>
            Both work identically. The difference is where the <em>rules</em> live: the
            <code>useState</code> version has clamping and history-appending inside a
            handler nested in a setter; the reducer has them in one function you could
            import and test.
          </li>
          <li>
            Note the <code>useState</code> version calls <code>setHistory</code> from inside
            a <code>setCount</code> updater. That works but is exactly the kind of coupling
            that suggests the two values are really one piece of state.
          </li>
          <li>
            Type <code>dispatch({"{ type: \""}</code> in your editor. All four actions
            autocomplete. Add a typo and it's a compile error — no such safety exists for
            calling the right combination of setters.
          </li>
          <li>
            The <code>never</code> case in <code>default</code> means adding a fifth action
            to the union breaks the build until you handle it.
          </li>
        </ul>
      }
    >
      <Row className="g-3">
        <Col md={6}>
          <WithUseState />
        </Col>
        <Col md={6}>
          <WithUseReducer />
        </Col>
      </Row>
      <div className="mt-3 d-flex align-items-center gap-3">
        <Button size="sm" variant="outline-secondary" onClick={() => force((n) => n + 1)}>
          Force a re-render
        </Button>
        <span className="small text-muted">
          Both survive it. <code>dispatch</code> is referentially stable across renders;
          the <code>useState</code> handlers are recreated each time.
        </span>
      </div>
      <div className="mt-3">
        <StateInspector
          label="the reducer's shape"
          value={{ state: "CounterState", actions: ["incremented", "decremented", "stepChanged", "reset"] }}
        />
      </div>
    </DemoCard>
  )
}
```

Register as `{ id: "reducer-compare", chapter: "13 — useReducer", title: "useState vs useReducer", element: <CounterCompareLab /> }`.

**Experiments:**

1. Add a "double it" feature to both. In the reducer: one action, one case. In the `useState` version: another handler that must remember to clamp *and* append history. Now add "halve it". The maintenance asymmetry is the whole argument.
2. Add `| { type: "cleared" }` to `CounterAction` and don't handle it. The `never` line errors. Note the message names the unhandled type.
3. Try `dispatch({ type: "stepChanged" })` — rejected, `step` is required. Then `dispatch({ type: "incremented", step: 5 })` — also rejected, because that member has no `step`. The union polices both directions.

---

## 🧪 Lab 13.2 — A reducer as a state machine

**Level:** core

Reducers and discriminated-union state (§5.3) combine into something more powerful than either alone: a machine where **only legal transitions can be expressed.**

Create `src/demos/13-reducer/WizardLab.tsx`:

```tsx
import { useReducer } from "react"
import { Alert, Badge, Button, Card, Col, Form, ProgressBar, Row } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import StateInspector from "@/lab/StateInspector"

// ---------- state: a union, so each step carries only its own data ----------

interface Details {
  name: string
  email: string
}

type WizardState =
  | { step: "details"; details: Details; error?: string }
  | { step: "plan"; details: Details; plan: "free" | "pro" }
  | { step: "confirm"; details: Details; plan: "free" | "pro"; agreed: boolean }
  | { step: "submitting"; details: Details; plan: "free" | "pro" }
  | { step: "done"; details: Details; plan: "free" | "pro" }
  | { step: "failed"; details: Details; plan: "free" | "pro"; reason: string }

type WizardAction =
  | { type: "detailsChanged"; changes: Partial<Details> }
  | { type: "detailsSubmitted" }
  | { type: "planChosen"; plan: "free" | "pro" }
  | { type: "agreedChanged"; agreed: boolean }
  | { type: "confirmed" }
  | { type: "succeeded" }
  | { type: "failed"; reason: string }
  | { type: "backed" }
  | { type: "restarted" }

const initial: WizardState = {
  step: "details",
  details: { name: "", email: "" },
}

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "detailsChanged":
      if (state.step !== "details") return state          // ignored in other steps
      return { ...state, details: { ...state.details, ...action.changes }, error: undefined }

    case "detailsSubmitted": {
      if (state.step !== "details") return state
      if (!state.details.name.trim() || !state.details.email.includes("@")) {
        return { ...state, error: "A name and a valid email are required." }
      }
      return { step: "plan", details: state.details, plan: "free" }
    }

    case "planChosen":
      if (state.step !== "plan") return state
      return { ...state, plan: action.plan }

    case "agreedChanged":
      if (state.step !== "confirm") return state
      return { ...state, agreed: action.agreed }

    case "confirmed":
      if (state.step === "plan") {
        return { step: "confirm", details: state.details, plan: state.plan, agreed: false }
      }
      if (state.step === "confirm" && state.agreed) {
        return { step: "submitting", details: state.details, plan: state.plan }
      }
      return state

    case "succeeded":
      if (state.step !== "submitting") return state
      return { step: "done", details: state.details, plan: state.plan }

    case "failed":
      if (state.step !== "submitting") return state
      return { step: "failed", details: state.details, plan: state.plan, reason: action.reason }

    case "backed":
      if (state.step === "plan") return { step: "details", details: state.details }
      if (state.step === "confirm")
        return { step: "plan", details: state.details, plan: state.plan }
      if (state.step === "failed")
        return { step: "confirm", details: state.details, plan: state.plan, agreed: true }
      return state

    case "restarted":
      return initial

    default: {
      const _exhaustive: never = action
      throw new Error(`Unhandled action: ${JSON.stringify(_exhaustive)}`)
    }
  }
}

const stepOrder = ["details", "plan", "confirm", "submitting", "done"] as const

export default function WizardLab() {
  const [state, dispatch] = useReducer(wizardReducer, initial)

  const stepIndex = stepOrder.indexOf(state.step as (typeof stepOrder)[number])
  const percent = stepIndex < 0 ? 100 : ((stepIndex + 1) / stepOrder.length) * 100

  async function submit() {
    dispatch({ type: "confirmed" })
    await new Promise((r) => setTimeout(r, 900))
    if (Math.random() > 0.4) dispatch({ type: "succeeded" })
    else dispatch({ type: "failed", reason: "The server returned 503." })
  }

  return (
    <DemoCard
      title="A reducer as a state machine"
      claim="When the state is a union of steps and every transition is an action, illegal states and illegal transitions both become unrepresentable."
      level="core"
      notice={
        <ul className="mb-0">
          <li>
            Each step's state carries <strong>only the data that step has</strong>.{" "}
            <code>agreed</code> exists on the confirm step and nowhere else, so there is no
            stale checkbox value floating through the flow.
          </li>
          <li>
            Every case begins by checking which step we're in and{" "}
            <strong>returns the state unchanged</strong> if the action doesn't apply. A
            "plan chosen" action arriving during submission is simply ignored — no
            half-transitioned state, no guard scattered through the UI.
          </li>
          <li>
            The submit path is async, but <strong>the reducer isn't.</strong> The{" "}
            <code>await</code> lives in the event handler, which dispatches{" "}
            <code>succeeded</code> or <code>failed</code>. Reducers stay pure; effects and
            handlers do the waiting.
          </li>
          <li>
            Try to write <code>state.agreed</code> in the <code>"plan"</code> branch. Compile
            error. The union is doing the reasoning.
          </li>
        </ul>
      }
    >
      <ProgressBar now={percent} className="mb-3" style={{ height: 6 }} />

      <Row className="g-3">
        <Col lg={7}>
          <Card body style={{ minHeight: 260 }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <Badge bg="dark">{state.step}</Badge>
              <span className="small text-muted">
                step {stepIndex + 1} of {stepOrder.length}
              </span>
            </div>

            {state.step === "details" && (
              <>
                <Form.Group className="mb-2">
                  <Form.Label className="small">Name</Form.Label>
                  <Form.Control
                    value={state.details.name}
                    isInvalid={Boolean(state.error)}
                    onChange={(e) =>
                      dispatch({ type: "detailsChanged", changes: { name: e.target.value } })
                    }
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="small">Email</Form.Label>
                  <Form.Control
                    value={state.details.email}
                    isInvalid={Boolean(state.error)}
                    onChange={(e) =>
                      dispatch({ type: "detailsChanged", changes: { email: e.target.value } })
                    }
                  />
                  <Form.Control.Feedback type="invalid">{state.error}</Form.Control.Feedback>
                </Form.Group>
                <Button onClick={() => dispatch({ type: "detailsSubmitted" })}>
                  Continue
                </Button>
              </>
            )}

            {state.step === "plan" && (
              <>
                <div className="small text-muted mb-2">Choose a plan</div>
                <div className="d-flex gap-2 mb-3">
                  {(["free", "pro"] as const).map((plan) => (
                    <Button
                      key={plan}
                      variant={state.plan === plan ? "primary" : "outline-primary"}
                      onClick={() => dispatch({ type: "planChosen", plan })}
                    >
                      {plan}
                    </Button>
                  ))}
                </div>
                <div className="d-flex gap-2">
                  <Button variant="outline-secondary" onClick={() => dispatch({ type: "backed" })}>
                    Back
                  </Button>
                  <Button onClick={() => dispatch({ type: "confirmed" })}>Continue</Button>
                </div>
              </>
            )}

            {state.step === "confirm" && (
              <>
                <div className="small mb-3">
                  Creating an account for <strong>{state.details.name}</strong> (
                  {state.details.email}) on the <strong>{state.plan}</strong> plan.
                </div>
                <Form.Check
                  className="mb-3"
                  type="checkbox"
                  label={<span className="small">I agree to the terms</span>}
                  checked={state.agreed}
                  onChange={(e) =>
                    dispatch({ type: "agreedChanged", agreed: e.target.checked })
                  }
                />
                <div className="d-flex gap-2">
                  <Button variant="outline-secondary" onClick={() => dispatch({ type: "backed" })}>
                    Back
                  </Button>
                  <Button disabled={!state.agreed} onClick={submit}>
                    Create account
                  </Button>
                </div>
              </>
            )}

            {state.step === "submitting" && (
              <div className="d-flex align-items-center gap-2 small text-muted">
                <span className="spinner-border spinner-border-sm" /> Creating your
                account…
              </div>
            )}

            {state.step === "done" && (
              <>
                <Alert variant="success" className="small">
                  Account created for {state.details.email} on the {state.plan} plan.
                </Alert>
                <Button variant="outline-secondary" onClick={() => dispatch({ type: "restarted" })}>
                  Start again
                </Button>
              </>
            )}

            {state.step === "failed" && (
              <>
                <Alert variant="danger" className="small">
                  {state.reason}
                </Alert>
                <div className="d-flex gap-2">
                  <Button variant="outline-secondary" onClick={() => dispatch({ type: "backed" })}>
                    Back
                  </Button>
                  <Button variant="outline-danger" onClick={() => dispatch({ type: "restarted" })}>
                    Start again
                  </Button>
                </div>
              </>
            )}
          </Card>
        </Col>

        <Col lg={5}>
          <StateInspector label="state" value={state} />
          <Alert variant="light" className="border small mt-3 mb-0">
            <div className="fw-semibold mb-1">Try to break it</div>
            The submit path fails about 40% of the time on purpose. During{" "}
            <code>submitting</code>, every other action is ignored by the reducer — so a
            stray click can't rewind a request in flight.
          </Alert>
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "wizard", chapter: "13 — useReducer", title: "Reducer as state machine", element: <WizardLab /> }`.

**Experiments:**

1. In the `"planChosen"` case, remove the `if (state.step !== "plan") return state` guard. TypeScript immediately errors on `{ ...state, plan: action.plan }` because not every step *has* a plan. The guard isn't defensive coding; it's how you earn the narrowing.
2. Add a `"cancelled"` action that returns to `details` from anywhere. One case, one line, and it's automatically impossible to cancel into an inconsistent state, because the returned object must satisfy the `details` member of the union.
3. Move the `await` into the reducer (make the reducer `async`). It won't work — `useReducer` expects a synchronous function, and the type system says so. Asynchrony belongs in handlers and effects; that separation is the reason reducers are testable.

---

## 🧪 Lab 13.3 — Undo/redo

**Level:** depth

The feature that's genuinely hard with `useState` and almost free with a reducer, because a reducer already centralises every change.

Create `src/demos/13-reducer/UndoRedoLab.tsx`:

```tsx
import { useReducer } from "react"
import { Badge, Button, ButtonGroup, Card, Col, Form, ListGroup, Row } from "react-bootstrap"
import { ArrowClockwise, ArrowCounterclockwise } from "react-bootstrap-icons"
import DemoCard from "@/lab/DemoCard"

// ---------- the domain: a simple list ----------

interface Item {
  id: string
  label: string
  done: boolean
}

type ListAction =
  | { type: "added"; id: string; label: string }
  | { type: "toggled"; id: string }
  | { type: "removed"; id: string }
  | { type: "clearedDone" }

function listReducer(state: Item[], action: ListAction): Item[] {
  switch (action.type) {
    case "added":
      return [...state, { id: action.id, label: action.label, done: false }]
    case "toggled":
      return state.map((i) => (i.id === action.id ? { ...i, done: !i.done } : i))
    case "removed":
      return state.filter((i) => i.id !== action.id)
    case "clearedDone":
      return state.filter((i) => !i.done)
    default: {
      const _exhaustive: never = action
      throw new Error(`Unhandled: ${JSON.stringify(_exhaustive)}`)
    }
  }
}

// ---------- the wrapper: history around any reducer ----------

interface History<T> {
  past: T[]
  present: T
  future: T[]
}

type HistoryAction<A> = A | { type: "undo" } | { type: "redo" }

/**
 * Takes a reducer and returns a reducer that also tracks history.
 * Generic over both state and action, so it works with ANY reducer.
 */
function withHistory<T, A extends { type: string }>(
  reducer: (state: T, action: A) => T
) {
  return function historyReducer(
    state: History<T>,
    action: HistoryAction<A>
  ): History<T> {
    if (action.type === "undo") {
      const previous = state.past[state.past.length - 1]
      if (previous === undefined) return state
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future],
      }
    }

    if (action.type === "redo") {
      const next = state.future[0]
      if (next === undefined) return state
      return {
        past: [...state.past, state.present],
        present: next,
        future: state.future.slice(1),
      }
    }

    const present = reducer(state.present, action as A)
    if (present === state.present) return state      // no change, no history entry
    return { past: [...state.past, state.present], present, future: [] }
  }
}

const initialItems: Item[] = [
  { id: "a", label: "Write the reducer", done: true },
  { id: "b", label: "Wrap it in history", done: false },
]

const historyReducer = withHistory(listReducer)

export default function UndoRedoLab() {
  const [history, dispatch] = useReducer(historyReducer, {
    past: [],
    present: initialItems,
    future: [],
  })

  const items = history.present
  const canUndo = history.past.length > 0
  const canRedo = history.future.length > 0

  function add(label: string) {
    if (!label.trim()) return
    // The id is generated OUTSIDE the reducer, keeping it pure — §13.3
    dispatch({ type: "added", id: crypto.randomUUID(), label: label.trim() })
  }

  return (
    <DemoCard
      title="Undo/redo, for free"
      claim="Because a reducer funnels every change through one function, wrapping it in a past/present/future record gives undo and redo without touching the domain logic."
      level="depth"
      notice={
        <ul className="mb-0">
          <li>
            <code>listReducer</code> knows nothing about history.{" "}
            <code>withHistory</code> knows nothing about items. That separation is only
            possible because the reducer is a plain function of state and action.
          </li>
          <li>
            Make several changes, then undo repeatedly. Then make a{" "}
            <em>new</em> change: the redo stack clears, because you've branched away from
            that future. That's standard undo semantics, and it's one line —{" "}
            <code>future: []</code>.
          </li>
          <li>
            The <code>present === state.present</code> check prevents no-op actions (like
            toggling a non-existent id) from creating an empty history entry — the kind of
            polish that's easy when changes are centralised.
          </li>
          <li>
            <code>withHistory&lt;T, A&gt;</code> is generic over both state and action, so
            the same twenty lines wrap <em>any</em> reducer in the codebase.
          </li>
        </ul>
      }
    >
      <Row className="g-3">
        <Col lg={7}>
          <div className="d-flex gap-2 mb-3">
            <ButtonGroup>
              <Button
                variant="outline-dark"
                disabled={!canUndo}
                onClick={() => dispatch({ type: "undo" })}
              >
                <ArrowCounterclockwise size={15} className="me-1" />
                Undo
              </Button>
              <Button
                variant="outline-dark"
                disabled={!canRedo}
                onClick={() => dispatch({ type: "redo" })}
              >
                <ArrowClockwise size={15} className="me-1" />
                Redo
              </Button>
            </ButtonGroup>
            <Button
              variant="outline-danger"
              onClick={() => dispatch({ type: "clearedDone" })}
            >
              Clear done
            </Button>
          </div>

          <Form
            className="d-flex gap-2 mb-3"
            onSubmit={(e) => {
              e.preventDefault()
              const input = e.currentTarget.elements.namedItem("label") as HTMLInputElement
              add(input.value)
              input.value = ""
            }}
          >
            <Form.Control name="label" placeholder="New item" />
            <Button type="submit">Add</Button>
          </Form>

          <ListGroup>
            {items.length === 0 ? (
              <ListGroup.Item className="small text-muted">
                Empty. Undo to bring things back.
              </ListGroup.Item>
            ) : (
              items.map((item) => (
                <ListGroup.Item key={item.id} className="d-flex align-items-center gap-2">
                  <Form.Check
                    checked={item.done}
                    onChange={() => dispatch({ type: "toggled", id: item.id })}
                    aria-label={`Toggle ${item.label}`}
                  />
                  <span
                    className={
                      item.done ? "flex-grow-1 text-muted text-decoration-line-through" : "flex-grow-1"
                    }
                  >
                    {item.label}
                  </span>
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    onClick={() => dispatch({ type: "removed", id: item.id })}
                  >
                    Remove
                  </Button>
                </ListGroup.Item>
              ))
            )}
          </ListGroup>
        </Col>

        <Col lg={5}>
          <Card body className="small">
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">past</span>
              <Badge bg="secondary">{history.past.length}</Badge>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">present</span>
              <Badge bg="primary">{items.length} items</Badge>
            </div>
            <div className="d-flex justify-content-between">
              <span className="text-muted">future</span>
              <Badge bg="secondary">{history.future.length}</Badge>
            </div>
          </Card>

          <Card body className="mt-3 small">
            <div className="fw-semibold mb-2">History stack (item counts)</div>
            <div className="font-monospace">
              [{history.past.map((s) => s.length).join(", ")}] ←{" "}
              <strong>{items.length}</strong> → [
              {history.future.map((s) => s.length).join(", ")}]
            </div>
            <div className="text-muted mt-2">
              Each entry is a complete snapshot. Fine for small state; for large state
              you'd store the actions instead and replay them.
            </div>
          </Card>
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "undo-redo", chapter: "13 — useReducer", title: "Undo/redo", element: <UndoRedoLab /> }`.

**Experiments:**

1. Undo three times, then add an item. The future array empties. Comment out `future: []` and try again — you can now "redo" into a state that never followed from your current one, which is incoherent. That one line is the whole branching rule.
2. Remove the `present === state.present` guard, then toggle an id that doesn't exist (add a button dispatching `{ type: "toggled", id: "nope" }`). The undo stack grows with an identical snapshot, so undo appears to do nothing once. Identity comparison saves you, because the reducer returns the same array when `map` changes nothing… actually `map` always returns a new array, so add `{ type: "clearedDone" }` twice in a row instead and watch it.
3. Try implementing undo with `useState` and no reducer. You'd need every handler to push a snapshot before changing anything, and to remember to do it. That's the argument for centralised changes.

---

## 🧪 Lab 13.4 — Testing a reducer

**Level:** depth

Reducers are pure functions, which makes them the easiest thing in a React codebase to test — no renderer, no DOM, no mocks. If you're going to write tests for one thing, write them for this.

**Install the test runner** in `react-lab`:

```bash
npm install -D vitest
```

Add to `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

Create `src/demos/13-reducer/listReducer.ts` — extracting the reducer from Lab 13.3 so it can be imported by both the component and the test:

```ts
export interface Item {
  id: string
  label: string
  done: boolean
}

export type ListAction =
  | { type: "added"; id: string; label: string }
  | { type: "toggled"; id: string }
  | { type: "removed"; id: string }
  | { type: "clearedDone" }

export function listReducer(state: Item[], action: ListAction): Item[] {
  switch (action.type) {
    case "added":
      return [...state, { id: action.id, label: action.label, done: false }]
    case "toggled":
      return state.map((i) => (i.id === action.id ? { ...i, done: !i.done } : i))
    case "removed":
      return state.filter((i) => i.id !== action.id)
    case "clearedDone":
      return state.filter((i) => !i.done)
    default: {
      const _exhaustive: never = action
      throw new Error(`Unhandled: ${JSON.stringify(_exhaustive)}`)
    }
  }
}
```

Create `src/demos/13-reducer/listReducer.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { listReducer, type Item } from "./listReducer"

const base: Item[] = [
  { id: "a", label: "First", done: false },
  { id: "b", label: "Second", done: true },
]

describe("listReducer", () => {
  it("adds an item as not-done", () => {
    const next = listReducer(base, { type: "added", id: "c", label: "Third" })
    expect(next).toHaveLength(3)
    expect(next[2]).toEqual({ id: "c", label: "Third", done: false })
  })

  it("toggles only the matching item", () => {
    const next = listReducer(base, { type: "toggled", id: "a" })
    expect(next[0].done).toBe(true)
    expect(next[1].done).toBe(true)      // unchanged
  })

  it("removes by id", () => {
    const next = listReducer(base, { type: "removed", id: "a" })
    expect(next.map((i) => i.id)).toEqual(["b"])
  })

  it("clears completed items", () => {
    const next = listReducer(base, { type: "clearedDone" })
    expect(next.map((i) => i.id)).toEqual(["a"])
  })

  it("never mutates the input", () => {
    const snapshot = JSON.stringify(base)
    listReducer(base, { type: "toggled", id: "a" })
    listReducer(base, { type: "removed", id: "b" })
    listReducer(base, { type: "clearedDone" })
    expect(JSON.stringify(base)).toBe(snapshot)
  })

  it("preserves the identity of untouched items", () => {
    const next = listReducer(base, { type: "toggled", id: "a" })
    expect(next[1]).toBe(base[1])        // same object — this is what lets memo bail out
    expect(next[0]).not.toBe(base[0])    // replaced, not mutated
  })

  it("ignores an unknown id without changing anything", () => {
    const next = listReducer(base, { type: "toggled", id: "nope" })
    expect(next).toEqual(base)
  })
})
```

**Run it:**

```bash
npm test
```

Seven tests, no rendering, no `@testing-library`, no DOM, milliseconds to run. **This is the highest return-on-effort testing available in a React codebase.**

Two of those tests deserve attention because they encode rules rather than behaviour:

- **`never mutates the input`** locks in §6.4. If someone "optimises" a case to `state.push(...)`, this fails.
- **`preserves the identity of untouched items`** locks in the property that makes §16's `memo` work. `toBe` is reference equality, `toEqual` is structural — and the distinction is exactly what React's re-render decisions are built on.

**Experiments:**

1. Change `case "toggled"` to mutate: `state[0].done = !state[0].done; return [...state]`. The mutation test fails and names the problem. That test would have caught Lab 6.3's bug before it reached the browser.
2. Add `| { type: "renamed"; id: string; label: string }` to the action union without adding a case. `npm test` fails at compile time via the `never` assertion, before any assertion runs.
3. Add a test for a *sequence*: `listReducer(listReducer(base, addAction), toggleAction)`. Reducers compose by function application, which is why replaying a list of actions reproduces any state exactly — the basis of time-travel debugging.

✅ **Concept check 13**

1. What are the three parts of the reducer pattern, and which one must be pure?
2. How does the `never` assertion in `default` catch a forgotten case?
3. Why should `crypto.randomUUID()` be called in the handler rather than the reducer?
4. Name two things `dispatch` gives you that a set of `useState` setters doesn't.
5. Why is a reducer easier to test than the equivalent `useState` logic?

---

# 14. Context API

Context lets a value pass through the tree without threading props at every level. It solves **prop drilling**, and that's all it solves. It's worth being clear about that up front, because Context is regularly mistaken for a state manager and then blamed for not being one.

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
export function ThemeProvider({ children }: { children: ReactNode }) {
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

## 14.1 Why the `null` default and the wrapper hook

That `useTheme` wrapper is doing double duty, and it's the standard pattern for a reason:

- **At runtime** it throws a clear, actionable error instead of a confusing `Cannot read properties of null` deep inside a child that has nothing to do with the mistake.
- **At compile time** the `if (!ctx) throw` **narrows** the type from `ThemeContextValue | null` to `ThemeContextValue`, so every consumer gets a non-nullable value and never has to write `ctx?.theme`.

The alternative — giving `createContext` a plausible-looking default object — is worse in a specific way: a component rendered outside the provider then works *silently*, using fake data, and you find out weeks later when a toggle does nothing. A `null` default plus a throw turns that into an immediate, obvious failure.

**Always export the hook, never the raw context.** It keeps the null-check in one place, it lets you add logic later (a `useThemeOptional` variant, dev-time warnings) without touching consumers, and it stops people calling `useContext(ThemeContext)` directly and losing the narrowing.

> **TS Note.** `createContext<ThemeContextValue | null>(null)` — the generic is on `createContext`, not on the variable. Getting it the other way round (`const C: Context<T> = createContext(null)`) fights the inference and produces worse errors.

## 14.2 The costs

**Every consumer re-renders when the context value changes.** Not just the ones that use the part that changed — Context has no selector mechanism. One giant `AppContext` holding user, theme, tasks and notifications means a theme toggle re-renders every component that reads any of it.

Two mitigations, in order of preference:

1. **Split by concern.** `ThemeContext`, `AuthContext`, `TasksContext`. A component only subscribes to what it needs.
2. **Split state from dispatch.** Actions don't change, so components that only *dispatch* need never re-render when state changes. Lab 14.3 measures the difference, and it's substantial.

**Passing an object literal as `value` creates a new reference on every render**, re-rendering all consumers even when nothing changed:

```tsx
// ❌ new object every render
<Ctx.Provider value={{ theme, setTheme }}>

// ✅ stable unless theme changes
const value = useMemo(() => ({ theme, setTheme }), [theme])
<Ctx.Provider value={value}>
```

`setTheme` is already stable (React guarantees it for `useState` setters and `dispatch`), so `theme` is the only real dependency. This only matters if the provider itself re-renders for reasons unrelated to the value — which happens as soon as the provider holds more than one piece of state.

**Context is not a state manager.** It's a *transport mechanism*: a way to get a value from an ancestor to a descendant without intermediate props. When you hit its ceiling — no selective subscription, no access outside React, no DevTools — that's what §22 (Redux Toolkit) and §23 (Zustand) are for. Lab 14.3 is the demonstration; those two sections are the answers. The state still has to live somewhere — `useState` or `useReducer` in the provider. For server data, use TanStack Query (§17). For large client state with heavy update patterns and a need for selective subscriptions, consider Zustand or Redux Toolkit, both of which are excellent in TypeScript.

## 14.3 When to reach for it

Good fits — values that are genuinely tree-wide and change rarely:

- Theme, locale, feature flags
- The authenticated user
- A toast/notification dispatcher
- A form's state, shared between deeply nested fields
- The store for one feature, provided at that feature's root

Poor fits:

- Anything you're only passing down two levels (just pass the prop)
- Frequently-changing values consumed by many components (mouse position, scroll offset)
- Server data (use a query library, which handles caching and revalidation too)

---

## 🧪 Lab 14.1 — Prop drilling vs Context

**Level:** core

Create `src/demos/14-context/PropDrillingLab.tsx`:

```tsx
import { createContext, useContext, useState, type ReactNode } from "react"
import { Alert, Badge, Button, Card, Col, Row } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"

interface User {
  name: string
  role: "viewer" | "admin"
}

// ================= A: prop drilling =================
// Every level must declare and forward the prop, whether it uses it or not.

function DrilledAvatar({ user }: { user: User }) {
  return (
    <Badge bg={user.role === "admin" ? "danger" : "secondary"}>
      {user.name} · {user.role}
    </Badge>
  )
}

function DrilledToolbar({ user }: { user: User }) {      // doesn't use it
  return (
    <div className="d-flex justify-content-between align-items-center">
      <span className="small text-muted">Toolbar</span>
      <DrilledAvatar user={user} />
    </div>
  )
}

function DrilledPanel({ user }: { user: User }) {        // doesn't use it
  return (
    <div className="border rounded-2 p-2">
      <div className="small text-muted mb-2">Panel</div>
      <DrilledToolbar user={user} />
    </div>
  )
}

function DrilledLayout({ user }: { user: User }) {       // doesn't use it
  return (
    <div className="border rounded-2 p-2">
      <div className="small text-muted mb-2">Layout</div>
      <DrilledPanel user={user} />
    </div>
  )
}

// ================= B: context =================

const UserContext = createContext<User | null>(null)

function useUser(): User {
  const user = useContext(UserContext)
  if (!user) throw new Error("useUser must be used inside <UserContext.Provider>")
  return user
}

function ContextAvatar() {
  const user = useUser()                                  // reaches up directly
  return (
    <Badge bg={user.role === "admin" ? "danger" : "secondary"}>
      {user.name} · {user.role}
    </Badge>
  )
}

function ContextToolbar() {
  return (
    <div className="d-flex justify-content-between align-items-center">
      <span className="small text-muted">Toolbar</span>
      <ContextAvatar />
    </div>
  )
}

function ContextPanel() {
  return (
    <div className="border rounded-2 p-2">
      <div className="small text-muted mb-2">Panel</div>
      <ContextToolbar />
    </div>
  )
}

function ContextLayout() {
  return (
    <div className="border rounded-2 p-2">
      <div className="small text-muted mb-2">Layout</div>
      <ContextPanel />
    </div>
  )
}

/** Rendered outside the provider on purpose, to show the error path. */
function Orphan() {
  try {
    const user = useUser()
    return <span>{user.name}</span>
  } catch (err) {
    return (
      <Alert variant="danger" className="small mb-0">
        {err instanceof Error ? err.message : String(err)}
      </Alert>
    )
  }
}

export default function PropDrillingLab() {
  const [user, setUser] = useState<User>({ name: "Ada Lovelace", role: "viewer" })
  const [showOrphan, setShowOrphan] = useState(false)

  return (
    <DemoCard
      title="Prop drilling vs Context"
      claim="Context removes the plumbing from components that were only forwarding a value — and a null default plus a wrapper hook turns a missing provider into a clear error."
      level="core"
      notice={
        <ul className="mb-0">
          <li>
            On the left, <code>Layout</code>, <code>Panel</code> and{" "}
            <code>Toolbar</code> all declare a <code>user</code> prop they never read. Their
            prop interfaces have stopped describing what they do.
          </li>
          <li>
            On the right, only <code>ContextAvatar</code> mentions the user. The three
            intermediate components take no props at all.
          </li>
          <li>
            Press <strong>Promote to admin</strong> — both update. Context isn't magic, just
            a shortcut past the middle.
          </li>
          <li>
            Press <strong>Render outside the provider</strong> to see the wrapper hook's
            error. Without the throw, this would be a confusing{" "}
            <code>Cannot read properties of null</code> somewhere unrelated.
          </li>
          <li>
            <strong>Three levels is a judgement call.</strong> Prop drilling is more
            explicit and easier to trace; Context is less code. Reach for Context when the
            forwarding stops being informative.
          </li>
        </ul>
      }
    >
      <div className="d-flex flex-wrap gap-2 mb-3">
        <Button
          size="sm"
          onClick={() =>
            setUser((u) => ({ ...u, role: u.role === "admin" ? "viewer" : "admin" }))
          }
        >
          {user.role === "admin" ? "Demote to viewer" : "Promote to admin"}
        </Button>
        <Button
          size="sm"
          variant="outline-primary"
          onClick={() => setUser((u) => ({ ...u, name: u.name === "Ada Lovelace" ? "Grace Hopper" : "Ada Lovelace" }))}
        >
          Switch person
        </Button>
        <Button
          size="sm"
          variant="outline-danger"
          onClick={() => setShowOrphan((s) => !s)}
        >
          Render outside the provider
        </Button>
      </div>

      <Row className="g-3">
        <Col lg={6}>
          <Card className="h-100 border-warning-subtle">
            <Card.Header className="bg-warning-subtle small fw-semibold">
              A — prop drilling (3 pass-through props)
            </Card.Header>
            <Card.Body>
              <DrilledLayout user={user} />
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="h-100 border-success-subtle">
            <Card.Header className="bg-success-subtle small fw-semibold">
              B — context (0 pass-through props)
            </Card.Header>
            <Card.Body>
              <UserContext.Provider value={user}>
                <ContextLayout />
              </UserContext.Provider>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {showOrphan && (
        <div className="mt-3">
          <Orphan />
        </div>
      )}
    </DemoCard>
  )
}
```

Register as `{ id: "prop-drilling", chapter: "14 — Context", title: "Prop drilling vs Context", element: <PropDrillingLab /> }`.

**Experiments:**

1. Add a second value — a `theme` string — to both versions. On the left it's three more props on three more interfaces. On the right, decide: extend `UserContext`, or add a separate `ThemeContext`? Separate is usually right (§14.2), and noticing *why* is the point.
2. Remove the `if (!user) throw` from `useUser` and render the orphan. The error is now a null-property access inside `ContextAvatar`, which had nothing to do with the mistake. The wrapper's throw is a debugging investment.
3. Give `createContext` a default of `{ name: "Guest", role: "viewer" }` and render the orphan. It renders happily, showing fake data, forever. Convince yourself that's worse than crashing.

---

## 🧪 Lab 14.2 — Theme context with `data-bs-theme`

**Level:** core

Bootstrap 5.3's dark mode is driven by one attribute, which makes it a very clean Context demo — and something you'll actually ship.

Create `src/demos/14-context/ThemeContext.tsx`:

```tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

export type Theme = "light" | "dark" | "auto"

interface ThemeContextValue {
  theme: Theme
  /** The theme actually applied, after resolving "auto". */
  resolved: "light" | "dark"
  setTheme: (theme: Theme) => void
  cycle: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const order: Theme[] = ["light", "dark", "auto"]

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light")
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches
  )

  // Subscribe to the OS preference, so "auto" stays correct — §11.3
  useEffect(() => {
    const list = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    list.addEventListener("change", onChange)
    return () => list.removeEventListener("change", onChange)
  }, [])

  const resolved: "light" | "dark" =
    theme === "auto" ? (systemDark ? "dark" : "light") : theme

  const cycle = useCallback(() => {
    setTheme((prev) => order[(order.indexOf(prev) + 1) % order.length])
  }, [])

  // Memoised so consumers don't re-render when the provider re-renders
  // for reasons unrelated to the theme — §14.2
  const value = useMemo(
    () => ({ theme, resolved, setTheme, cycle }),
    [theme, resolved, cycle]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>")
  return ctx
}
```

Create `src/demos/14-context/ThemeLab.tsx`:

```tsx
import {
  Alert,
  Badge,
  Button,
  ButtonGroup,
  Card,
  Col,
  Form,
  ListGroup,
  ProgressBar,
  Row,
  Table,
} from "react-bootstrap"
import { CircleHalf, MoonFill, SunFill } from "react-bootstrap-icons"
import DemoCard from "@/lab/DemoCard"
import { ThemeProvider, useTheme, type Theme } from "@/demos/14-context/ThemeContext"

const icons: Record<Theme, React.ReactNode> = {
  light: <SunFill size={14} />,
  dark: <MoonFill size={14} />,
  auto: <CircleHalf size={14} />,
}

/** A deeply nested consumer — no props involved. */
function ThemeSwitcher() {
  const { theme, resolved, setTheme, cycle } = useTheme()

  return (
    <div className="d-flex align-items-center gap-2 flex-wrap">
      <ButtonGroup size="sm">
        {(["light", "dark", "auto"] as Theme[]).map((t) => (
          <Button
            key={t}
            variant={theme === t ? "primary" : "outline-primary"}
            onClick={() => setTheme(t)}
            className="d-inline-flex align-items-center gap-1"
          >
            {icons[t]} {t}
          </Button>
        ))}
      </ButtonGroup>
      <Button size="sm" variant="outline-secondary" onClick={cycle}>
        Cycle
      </Button>
      <span className="small text-muted">
        resolved: <Badge bg={resolved === "dark" ? "dark" : "light"} text={resolved === "dark" ? "light" : "dark"}>{resolved}</Badge>
      </span>
    </div>
  )
}

/** The themed surface. Reads the context to set one attribute. */
function ThemedSurface() {
  const { resolved } = useTheme()

  return (
    <div data-bs-theme={resolved} className="rounded-3 border p-3 bg-body">
      <Row className="g-3">
        <Col md={6}>
          <Card>
            <Card.Header className="fw-semibold small">A themed card</Card.Header>
            <Card.Body>
              <p className="small text-muted mb-2">
                Every utility class here is theme-aware in Bootstrap 5.3 —{" "}
                <code>bg-body</code>, <code>text-muted</code>, <code>border</code>.
              </p>
              <Form.Control size="sm" placeholder="A themed input" className="mb-2" />
              <ProgressBar now={62} style={{ height: 6 }} />
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <ListGroup>
            <ListGroup.Item className="small">List item one</ListGroup.Item>
            <ListGroup.Item className="small" active>
              Active item
            </ListGroup.Item>
            <ListGroup.Item className="small">List item three</ListGroup.Item>
          </ListGroup>
          <Table size="sm" className="mt-2 mb-0 small">
            <thead>
              <tr>
                <th>Key</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>data-bs-theme</td>
                <td>
                  <code>{resolved}</code>
                </td>
              </tr>
            </tbody>
          </Table>
        </Col>
        <Col xs={12}>
          <Alert variant="info" className="mb-0 small">
            No component below the provider takes a theme prop. They all call{" "}
            <code>useTheme()</code>.
          </Alert>
        </Col>
      </Row>
    </div>
  )
}

export default function ThemeLab() {
  return (
    <DemoCard
      title="Theme context and data-bs-theme"
      claim="A tree-wide value that changes rarely is the textbook Context use case — and Bootstrap 5.3 turns it into a single attribute."
      level="core"
      notice={
        <ul className="mb-0">
          <li>
            Choose <strong>auto</strong>, then change your operating system's appearance.
            The surface follows, because the provider subscribes to the media query — a
            §11.3 effect feeding a §14 context.
          </li>
          <li>
            <code>resolved</code> is <strong>derived</strong> from <code>theme</code> and{" "}
            <code>systemDark</code>, not stored. Two inputs, one output, never out of sync —
            §10.
          </li>
          <li>
            The context value is wrapped in <code>useMemo</code>. Remove it and every
            consumer re-renders whenever the provider does, even for an unrelated reason.
          </li>
          <li>
            To theme a whole app, put <code>data-bs-theme</code> on{" "}
            <code>&lt;html&gt;</code> from an effect:{" "}
            <code>document.documentElement.dataset.bsTheme = resolved</code>. Scoping it to
            a div, as here, is what lets one page show both themes.
          </li>
        </ul>
      }
    >
      <ThemeProvider>
        <div className="mb-3">
          <ThemeSwitcher />
        </div>
        <ThemedSurface />
      </ThemeProvider>
    </DemoCard>
  )
}
```

Register as `{ id: "theme-context", chapter: "14 — Context", title: "Theme context", element: <ThemeLab /> }`.

**Experiments:**

1. Add persistence: swap `useState<Theme>("light")` for your `useLocalStorage<Theme>("lab.theme", "light")` from Lab 12.2. One line, and the preference now survives reloads. This is what composing small hooks buys you.
2. Remove the `useMemo` around `value` and add a `RenderBadge` to `ThemedSurface`. Then add an unrelated `useState` to the provider and a button that bumps it. Consumers re-render on every bump. Put the memo back.
3. Move `data-bs-theme` to `document.documentElement` in an effect. The whole page — including the lab shell — changes theme. Then remember to clean up on unmount, or navigating away leaves the app dark.

---

## 🧪 Lab 14.3 — Splitting state from dispatch

**Level:** depth

The single most valuable Context optimisation, and it needs no `memo` or `useMemo` at all — just two providers instead of one.

Create `src/demos/14-context/SplitContextLab.tsx`:

```tsx
import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react"
import { Alert, Button, Card, Col, ListGroup, Row } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import RenderBadge from "@/lab/RenderBadge"

interface Item {
  id: string
  label: string
}

type Action =
  | { type: "added"; id: string; label: string }
  | { type: "removed"; id: string }

function reducer(state: Item[], action: Action): Item[] {
  switch (action.type) {
    case "added":
      return [...state, { id: action.id, label: action.label }]
    case "removed":
      return state.filter((i) => i.id !== action.id)
    default: {
      const _exhaustive: never = action
      throw new Error(`Unhandled: ${JSON.stringify(_exhaustive)}`)
    }
  }
}

const initial: Item[] = [{ id: "seed", label: "Seed item" }]

// ================= A: one combined context =================

interface CombinedValue {
  items: Item[]
  dispatch: Dispatch<Action>
}

const CombinedContext = createContext<CombinedValue | null>(null)

function useCombined(): CombinedValue {
  const ctx = useContext(CombinedContext)
  if (!ctx) throw new Error("Missing CombinedContext provider")
  return ctx
}

function CombinedProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(reducer, initial)
  // A new object every render — every consumer re-renders regardless
  return (
    <CombinedContext.Provider value={{ items, dispatch }}>
      {children}
    </CombinedContext.Provider>
  )
}

/** Only ever dispatches. Doesn't care about the items at all. */
function CombinedAddButton() {
  const { dispatch } = useCombined()
  return (
    <div className="d-flex align-items-center gap-2">
      <Button
        size="sm"
        variant="outline-danger"
        onClick={() =>
          dispatch({ type: "added", id: crypto.randomUUID(), label: "New" })
        }
      >
        Add
      </Button>
      <RenderBadge label="AddButton" bg="danger" />
    </div>
  )
}

function CombinedList() {
  const { items, dispatch } = useCombined()
  return (
    <>
      <div className="mb-2">
        <RenderBadge label="List" bg="danger" />
      </div>
      <ListGroup>
        {items.map((item) => (
          <ListGroup.Item key={item.id} className="py-1 small d-flex justify-content-between">
            {item.label}
            <Button
              size="sm"
              variant="link"
              className="p-0 text-danger"
              onClick={() => dispatch({ type: "removed", id: item.id })}
            >
              remove
            </Button>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </>
  )
}

// ================= B: split contexts =================

const ItemsContext = createContext<Item[] | null>(null)
const DispatchContext = createContext<Dispatch<Action> | null>(null)

function useItems(): Item[] {
  const ctx = useContext(ItemsContext)
  if (!ctx) throw new Error("Missing ItemsContext provider")
  return ctx
}

function useItemsDispatch(): Dispatch<Action> {
  const ctx = useContext(DispatchContext)
  if (!ctx) throw new Error("Missing DispatchContext provider")
  return ctx
}

function SplitProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(reducer, initial)
  // `dispatch` is referentially stable forever, so DispatchContext's value
  // never changes — and its consumers never re-render from it.
  return (
    <DispatchContext.Provider value={dispatch}>
      <ItemsContext.Provider value={items}>{children}</ItemsContext.Provider>
    </DispatchContext.Provider>
  )
}

function SplitAddButton() {
  const dispatch = useItemsDispatch()      // subscribes to dispatch only
  return (
    <div className="d-flex align-items-center gap-2">
      <Button
        size="sm"
        variant="outline-success"
        onClick={() =>
          dispatch({ type: "added", id: crypto.randomUUID(), label: "New" })
        }
      >
        Add
      </Button>
      <RenderBadge label="AddButton" bg="success" />
    </div>
  )
}

function SplitList() {
  const items = useItems()
  const dispatch = useItemsDispatch()
  return (
    <>
      <div className="mb-2">
        <RenderBadge label="List" bg="success" />
      </div>
      <ListGroup>
        {items.map((item) => (
          <ListGroup.Item key={item.id} className="py-1 small d-flex justify-content-between">
            {item.label}
            <Button
              size="sm"
              variant="link"
              className="p-0 text-success"
              onClick={() => dispatch({ type: "removed", id: item.id })}
            >
              remove
            </Button>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </>
  )
}

export default function SplitContextLab() {
  return (
    <DemoCard
      title="Splitting state from dispatch"
      claim="Components that only dispatch don't need to know when state changes. Two contexts instead of one, and half your consumers stop re-rendering."
      level="depth"
      notice={
        <ul className="mb-0">
          <li>
            Click <strong>Add</strong> in both columns several times. On the left, the{" "}
            <em>AddButton</em>'s render count climbs with every change — even though it
            never reads the items. On the right it stays put.
          </li>
          <li>
            Why: <code>dispatch</code> is referentially stable forever, so{" "}
            <code>DispatchContext</code>'s value literally never changes. React has nothing
            to notify.
          </li>
          <li>
            No <code>memo</code>, no <code>useMemo</code>, no <code>useCallback</code>. Just
            a better shape. <strong>Structural fixes beat memoisation</strong> — §16 makes
            the same argument at length.
          </li>
          <li>
            Note there are now two wrapper hooks. That's the small cost, and it's why
            exporting hooks rather than contexts matters: consumers don't care how many
            contexts there are.
          </li>
        </ul>
      }
    >
      <Alert variant="light" className="border small">
        Render counts climb in twos under Strict Mode. Watch which ones{" "}
        <em>move</em>, not their absolute value.
      </Alert>

      <Row className="g-3">
        <Col lg={6}>
          <Card className="h-100 border-danger-subtle">
            <Card.Header className="bg-danger-subtle small fw-semibold">
              A — one context ({"{ items, dispatch }"})
            </Card.Header>
            <Card.Body>
              <CombinedProvider>
                <div className="mb-3">
                  <CombinedAddButton />
                </div>
                <CombinedList />
              </CombinedProvider>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="h-100 border-success-subtle">
            <Card.Header className="bg-success-subtle small fw-semibold">
              B — two contexts (items · dispatch)
            </Card.Header>
            <Card.Body>
              <SplitProvider>
                <div className="mb-3">
                  <SplitAddButton />
                </div>
                <SplitList />
              </SplitProvider>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "split-context", chapter: "14 — Context", title: "Split state/dispatch", element: <SplitContextLab /> }`.

**Experiments:**

1. Add `useMemo(() => ({ items, dispatch }), [items])` to `CombinedProvider`. The AddButton *still* re-renders on every add, because `items` genuinely changed and it subscribes to the whole object. Memoising doesn't help; **splitting does.** This is the key insight.
2. Wrap `CombinedAddButton` in `memo`. Still no help — `memo` compares props, and this component's data arrives through context, which bypasses props entirely. `memo` cannot save a context consumer.
3. Add a third context for a piece of state the button *does* need. Notice the pattern generalising: one context per independently-changing concern.

---

## 🧪 Lab 14.4 — A toast service via Context

**Level:** depth

The pattern behind every notification system you've used: a provider owns a queue, and a hook hands out a function to add to it.

Create `src/demos/14-context/ToastContext.tsx`:

```tsx
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { Toast, ToastContainer } from "react-bootstrap"

export type ToastVariant = "success" | "danger" | "warning" | "info"

interface ToastItem {
  id: string
  message: string
  variant: ToastVariant
}

interface ToastApi {
  show: (message: string, variant?: ToastVariant) => void
  dismiss: (id: string) => void
  clear: () => void
}

const ToastContext = createContext<ToastApi | null>(null)

export function ToastProvider({
  children,
  autoHideMs = 4000,
}: {
  children: ReactNode
  autoHideMs?: number
}) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const show = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = crypto.randomUUID()
      setToasts((prev) => [...prev, { id, message, variant }])
      // Auto-dismiss. A timeout in a callback, not an effect — the toast
      // appears because the user did something, so the handler owns it (§11.1).
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, autoHideMs)
    },
    [autoHideMs]
  )

  const clear = useCallback(() => setToasts([]), [])

  // Stable across renders: all three functions are useCallback'd, so consumers
  // that only call `show` never re-render when the queue changes.
  const api = useMemo(() => ({ show, dismiss, clear }), [show, dismiss, clear])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastContainer
        className="position-static mt-3"
        style={{ minHeight: toasts.length ? undefined : 0 }}
      >
        {toasts.map((t) => (
          <Toast
            key={t.id}
            bg={t.variant}
            onClose={() => dismiss(t.id)}
            className="mb-2"
          >
            <Toast.Header closeButton>
              <strong className="me-auto text-capitalize">{t.variant}</strong>
            </Toast.Header>
            <Toast.Body className={t.variant === "warning" ? "" : "text-white"}>
              {t.message}
            </Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>")
  return ctx
}
```

Create `src/demos/14-context/ToastLab.tsx`:

```tsx
import { Button, Card, Col, Row } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import RenderBadge from "@/lab/RenderBadge"
import { ToastProvider, useToast, type ToastVariant } from "@/demos/14-context/ToastContext"

/** A deeply nested component that needs to notify the user. */
function SaveButton() {
  const { show } = useToast()
  return (
    <div className="d-flex align-items-center gap-2">
      <Button size="sm" onClick={() => show("Saved successfully.", "success")}>
        Save
      </Button>
      <RenderBadge label="SaveButton" bg="primary" />
    </div>
  )
}

function DeleteButton() {
  const { show } = useToast()
  return (
    <Button
      size="sm"
      variant="outline-danger"
      onClick={() => show("Could not delete: item is in use.", "danger")}
    >
      Delete (fails)
    </Button>
  )
}

function VariantButtons() {
  const { show, clear } = useToast()
  const variants: ToastVariant[] = ["success", "danger", "warning", "info"]
  return (
    <div className="d-flex flex-wrap gap-2">
      {variants.map((v) => (
        <Button
          key={v}
          size="sm"
          variant={`outline-${v}`}
          onClick={() => show(`A ${v} notification.`, v)}
        >
          {v}
        </Button>
      ))}
      <Button size="sm" variant="outline-secondary" onClick={clear}>
        Clear all
      </Button>
    </div>
  )
}

export default function ToastLab() {
  return (
    <DemoCard
      title="A toast service via Context"
      claim="A provider owns the queue and the rendering; a hook hands out `show`. Any component at any depth can notify the user with one line and no props."
      level="depth"
      notice={
        <ul className="mb-0">
          <li>
            <code>useToast().show(…)</code> is all a consumer needs. No queue, no state, no
            props threaded down — this is Context solving exactly the problem it's for.
          </li>
          <li>
            The context value is the <strong>API</strong> (three stable functions), not the
            queue. So <code>SaveButton</code>'s render count doesn't move when toasts
            appear and disappear — the §14.3 split, applied by choosing what to expose.
          </li>
          <li>
            Auto-dismiss lives in a <code>setTimeout</code> inside <code>show</code>, not in
            an effect. The toast exists because the user acted, so the handler owns its
            lifecycle — §11.1.
          </li>
          <li>
            Each toast's id is generated in <code>show</code>, so React's keys are stable
            and animations aren't interrupted — §4.2.
          </li>
        </ul>
      }
    >
      <ToastProvider autoHideMs={3500}>
        <Row className="g-3">
          <Col md={6}>
            <Card body className="h-100">
              <div className="small fw-semibold text-muted mb-2">
                Nested consumers
              </div>
              <div className="d-flex flex-column gap-2 align-items-start">
                <SaveButton />
                <DeleteButton />
              </div>
            </Card>
          </Col>
          <Col md={6}>
            <Card body className="h-100">
              <div className="small fw-semibold text-muted mb-2">All variants</div>
              <VariantButtons />
            </Card>
          </Col>
        </Row>
      </ToastProvider>
    </DemoCard>
  )
}
```

Register as `{ id: "toast-context", chapter: "14 — Context", title: "Toast service", element: <ToastLab /> }`.

**Experiments:**

1. Add `toasts` to the context value alongside the API. `SaveButton`'s render count now climbs with every toast, because it subscribes to something it doesn't use. **What you put in the context value determines who re-renders** — choose it deliberately.
2. Remove `useCallback` from `show`. The `useMemo` around `api` now produces a new object every render, and every consumer re-renders. The two work together; neither alone is enough.
3. Replace the auto-dismiss `setTimeout` with an effect in the provider that sets a timer per toast. It works, but now you need cleanup for each, and Strict Mode's double-mount will fire the effect twice. The handler-based version has neither problem — which is §11.1's rule earning its place.

✅ **Concept check 14**

1. What problem does Context solve, and what problem is it often mistakenly used for?
2. Why give `createContext` a `null` default rather than a plausible object?
3. Why does the wrapper hook's `if (!ctx) throw` help at compile time as well as runtime?
4. Why does splitting state and dispatch into two contexts reduce re-renders when `useMemo` doesn't?
5. Can `React.memo` prevent a re-render caused by a context change? Why or why not?

---

# 15. Refs with `useRef`

`useRef` gives you a **mutable box that survives re-renders and does not trigger them.**

```tsx
const ref = useRef(initialValue)
ref.current            // read
ref.current = next     // write — no re-render
```

That's it. The box (`ref`) is stable forever; only `.current` changes. Everything else in this section follows from those two facts.

## 15.1 Two distinct uses

**1. Access a DOM node:**

```tsx
const inputRef = useRef<HTMLInputElement>(null)

useEffect(() => {
  inputRef.current?.focus()
}, [])

<Form.Control ref={inputRef} />
```

The generic names the element type, so `inputRef.current` is `HTMLInputElement | null` and you get full autocomplete on it. The `null` initial value plus optional chaining handles the fact that the ref is empty during the first render — React attaches the node *after* rendering, during commit, which is why you read it in an effect and not in the body.

**2. Hold a mutable value that isn't UI state:**

```tsx
const timerRef = useRef<number | null>(null)

function start() {
  timerRef.current = window.setInterval(tick, 1000)
}
function stop() {
  if (timerRef.current !== null) {
    clearInterval(timerRef.current)
    timerRef.current = null
  }
}
```

Use `window.setInterval` in the browser — the global `setInterval` may resolve to Node's typings (which return a `Timeout` object rather than a number) once `@types/node` is installed, which it is in these projects.

## 15.2 Ref or state?

| | `useState` | `useRef` |
|---|---|---|
| Changing it re-renders | Yes | **No** |
| Value available during render | Yes | Yes, but you must not read it |
| Survives re-renders | Yes | Yes |
| Survives unmount | No | No |
| Use for | Anything shown on screen | Bookkeeping the UI doesn't display |

**The test: does the screen need to change when this value changes?** If yes, state. If no — a timer id, a DOM handle, the previous value, whether a one-off has already run, the latest value for a callback — a ref.

Common legitimate refs:

```tsx
const timerRef = useRef<number | null>(null)          // timer/interval id
const inputRef = useRef<HTMLInputElement>(null)        // DOM node
const hasRunRef = useRef(false)                        // "only do this once"
const latestQueryRef = useRef(query)                   // latest value for a stale callback
const scrollRef = useRef(0)                            // remembered scroll position
const dragStartRef = useRef<{ x: number; y: number } | null>(null)  // gesture bookkeeping
```

## 15.3 Never read or write `ref.current` during render

```tsx
function Bad() {
  const ref = useRef(0)
  ref.current += 1              // ❌ impure — mutating during render
  return <p>{ref.current}</p>   // ❌ and reading it makes the output unpredictable
}
```

This breaks purity (§1.4), and Strict Mode's double-invocation makes it visibly wrong — as Lab 1.3 showed. React may also render speculatively or discard a render, in which case your mutation happened for nothing.

Read and write refs in **effects** and **event handlers**. (The `useRenderCount` instrument in `@/lab/RenderBadge` breaks this rule on purpose, which is why its docstring says so in capital letters. Measuring instruments are allowed to be impure; components aren't.)

## 15.4 Callback refs

Instead of a ref object, you can pass a **function** to `ref`. React calls it with the node when it attaches, and with `null` when it detaches:

```tsx
<div ref={(node) => { if (node) console.log(node.offsetWidth) }} />
```

This is what you want when you need to *do something the moment the node appears*, or when the node's existence is conditional. The pattern from Lab 11.3:

```tsx
const [node, setNode] = useState<HTMLDivElement | null>(null)
// setNode is a valid callback ref, AND setting state re-runs effects that depend on it
useEffect(() => {
  if (!node) return
  const observer = new ResizeObserver(/* ... */)
  observer.observe(node)
  return () => observer.disconnect()
}, [node])

<div ref={setNode} />
```

A `useRef` wouldn't work here: assigning `ref.current` doesn't re-render, so the effect would never learn the node had arrived. **When the effect must react to the node itself, use state as the ref.**

In React 19, a callback ref may **return a cleanup function**, which replaces the `null` call:

```tsx
<div ref={(node) => {
  const observer = new ResizeObserver(() => {})
  observer.observe(node)
  return () => observer.disconnect()
}} />
```

## 15.5 Forwarding refs

If a parent needs a ref to a DOM node inside your component, the ref has to be passed through.

**In React 19**, `ref` is a normal prop on function components:

```tsx
interface FieldProps {
  label: string
  ref?: React.Ref<HTMLInputElement>
}

function Field({ label, ref }: FieldProps) {
  return (
    <>
      <Form.Label>{label}</Form.Label>
      <Form.Control ref={ref} />
    </>
  )
}
```

**Before React 19** (and in any code you'll meet today) it needs `forwardRef`:

```tsx
const Field = forwardRef<HTMLInputElement, { label: string }>(function Field({ label }, ref) {
  return <Form.Control ref={ref} />
})
```

Note the generic order: `forwardRef<ElementType, PropsType>` — element first, props second, which is the opposite of what most people guess.

React-Bootstrap components already forward refs internally, so `<Form.Control ref={inputRef} />` gives you the underlying `<input>`, not the React component. That's exactly what you want, and it's why refs "just work" with the library.

**`useImperativeHandle`** lets you expose a custom API instead of the raw node:

```tsx
export interface ModalHandle {
  open: () => void
  close: () => void
}

const Dialog = forwardRef<ModalHandle, DialogProps>(function Dialog(props, ref) {
  const [show, setShow] = useState(false)
  useImperativeHandle(ref, () => ({
    open: () => setShow(true),
    close: () => setShow(false),
  }), [])
  return <Modal show={show} onHide={() => setShow(false)}>{props.children}</Modal>
})

// parent:
const dialogRef = useRef<ModalHandle>(null)
<Button onClick={() => dialogRef.current?.open()}>Open</Button>
```

Use this **sparingly**. It's an imperative escape hatch, and the declarative alternative (`<Modal show={isOpen} />` with state in the parent) is almost always clearer. The legitimate cases are genuinely imperative operations with no state to represent them: `focus()`, `scrollTo()`, `play()`, `select()`, `measure()`.

---

## 🧪 Lab 15.1 — Focus, selection, and measurement

**Level:** core

Create `src/demos/15-refs/DomRefLab.tsx`:

```tsx
import { useEffect, useRef, useState } from "react"
import { Button, Card, Col, Form, ListGroup, Row, Table } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"

export default function DomRefLab() {
  const inputRef = useRef<HTMLInputElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastItemRef = useRef<HTMLLIElement>(null)

  const [measurements, setMeasurements] = useState<{ w: number; h: number; top: number } | null>(null)
  const [items, setItems] = useState(["Item 1", "Item 2", "Item 3"])
  const [width, setWidth] = useState(60)

  // Focus on mount — the canonical DOM-ref effect
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function measure() {
    if (!boxRef.current) return
    const rect = boxRef.current.getBoundingClientRect()
    setMeasurements({
      w: Math.round(rect.width),
      h: Math.round(rect.height),
      top: Math.round(rect.top),
    })
  }

  function addAndScroll() {
    setItems((prev) => [...prev, `Item ${prev.length + 1}`])
    // The new item doesn't exist yet — the DOM updates after this render.
    // requestAnimationFrame waits for the browser to have painted it.
    requestAnimationFrame(() => {
      lastItemRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    })
  }

  return (
    <DemoCard
      title="DOM refs: focus, selection and measurement"
      claim="A ref is how you reach the real DOM node for the three things React has no declarative equivalent for: focusing, selecting, and measuring."
      level="core"
      notice={
        <ul className="mb-0">
          <li>
            The first input was focused on mount by an effect. Focus is imperative by
            nature — there is no <code>focused={"{true}"}</code> prop, and there shouldn't
            be, because focus is a single global thing.
          </li>
          <li>
            <strong>Measurement must happen after commit.</strong> Reading{" "}
            <code>boxRef.current</code> during render would give <code>null</code> on the
            first pass and a stale node afterwards.
          </li>
          <li>
            Drag the slider, then press Measure. The numbers come from the real layout, not
            from the state that produced it — which is the only way to know a rendered size.
          </li>
          <li>
            <strong>Add & scroll</strong> uses <code>requestAnimationFrame</code> because
            the new list item doesn't exist when the handler runs. State updates are
            asynchronous (§6.2), and so is the DOM catching up.
          </li>
        </ul>
      }
    >
      <Row className="g-3">
        <Col lg={6}>
          <Card body className="mb-3">
            <div className="small fw-semibold text-muted mb-2">Focus and selection</div>
            <Form.Control
              ref={inputRef}
              defaultValue="Select all of this text"
              className="mb-2"
            />
            <div className="d-flex flex-wrap gap-2">
              <Button size="sm" onClick={() => inputRef.current?.focus()}>
                focus()
              </Button>
              <Button size="sm" variant="outline-primary" onClick={() => inputRef.current?.select()}>
                select()
              </Button>
              <Button
                size="sm"
                variant="outline-primary"
                onClick={() => inputRef.current?.setSelectionRange(0, 6)}
              >
                setSelectionRange(0, 6)
              </Button>
              <Button size="sm" variant="outline-secondary" onClick={() => inputRef.current?.blur()}>
                blur()
              </Button>
            </div>
          </Card>

          <Card body>
            <div className="small fw-semibold text-muted mb-2">Measurement</div>
            <Form.Range
              min={20}
              max={100}
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              className="mb-2"
            />
            <div
              ref={boxRef}
              className="bg-primary-subtle border border-primary rounded-2 p-3 small text-center mb-2"
              style={{ width: `${width}%` }}
            >
              measure me
            </div>
            <Button size="sm" onClick={measure}>
              getBoundingClientRect()
            </Button>
            {measurements && (
              <Table size="sm" bordered className="mt-2 mb-0 small">
                <tbody>
                  <tr><td>width</td><td>{measurements.w}px</td></tr>
                  <tr><td>height</td><td>{measurements.h}px</td></tr>
                  <tr><td>top (viewport)</td><td>{measurements.top}px</td></tr>
                </tbody>
              </Table>
            )}
          </Card>
        </Col>

        <Col lg={6}>
          <Card body>
            <div className="small fw-semibold text-muted mb-2">Scrolling to a node</div>
            <div
              ref={scrollRef}
              className="border rounded-2 overflow-auto mb-2"
              style={{ height: 200 }}
            >
              <ListGroup variant="flush">
                {items.map((item, i) => (
                  <ListGroup.Item
                    key={item}
                    ref={i === items.length - 1 ? lastItemRef : undefined}
                    className="small"
                  >
                    {item}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>
            <div className="d-flex flex-wrap gap-2">
              <Button size="sm" onClick={addAndScroll}>
                Add & scroll to it
              </Button>
              <Button
                size="sm"
                variant="outline-primary"
                onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
              >
                Scroll to top
              </Button>
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={() => setItems(["Item 1", "Item 2", "Item 3"])}
              >
                Reset
              </Button>
            </div>
            <div className="small text-muted mt-2">
              The ref is attached conditionally — only to the last item. A ref is just a
              prop, so this is ordinary conditional logic.
            </div>
          </Card>
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "dom-refs", chapter: "15 — Refs", title: "Focus & measurement", element: <DomRefLab /> }`.

**Experiments:**

1. Move the `measure()` call to the component body, outside any handler. `boxRef.current` is `null` on the first render, and TypeScript's optional chaining is the only reason it doesn't crash. Refs are empty during the first render, always.
2. Remove `requestAnimationFrame` from `addAndScroll`. The scroll targets the *previous* last item, because the new one hasn't rendered. This is the same one-render-behind problem as §6.2, in a DOM costume. (A `useEffect` on `[items.length]` is the tidier fix.)
3. Change `useRef<HTMLInputElement>(null)` to `useRef<HTMLDivElement>(null)` and note that `.select()` disappears from autocomplete. The generic isn't decoration — it's what makes the ref useful.

---

## 🧪 Lab 15.2 — Ref vs state

**Level:** core

Create `src/demos/15-refs/RefVsStateLab.tsx`:

```tsx
import { useRef, useState } from "react"
import { Alert, Badge, Button, Card, Col, Row, Table } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import RenderBadge from "@/lab/RenderBadge"

export default function RefVsStateLab() {
  const [stateCount, setStateCount] = useState(0)
  const refCount = useRef(0)
  const [, forceRender] = useState(0)

  // A "latest value" ref — updated in handlers, read by delayed callbacks
  const latestStateRef = useRef(stateCount)
  const [delayedReads, setDelayedReads] = useState<string[]>([])

  function bumpState() {
    setStateCount((c) => {
      latestStateRef.current = c + 1
      return c + 1
    })
  }

  function bumpRef() {
    refCount.current += 1
    // No re-render. The number on screen is stale until something else renders.
  }

  function scheduleRead() {
    const captured = stateCount
    setTimeout(() => {
      setDelayedReads((prev) =>
        [
          `closure saw ${captured} · ref saw ${latestStateRef.current}`,
          ...prev,
        ].slice(0, 5)
      )
    }, 1500)
  }

  return (
    <DemoCard
      title="Ref vs state"
      claim="Both survive re-renders. Only state causes them. That single difference decides which one you want, every time."
      level="core"
      notice={
        <ul className="mb-0">
          <li>
            Press <strong>Bump ref</strong> five times. Nothing moves — the value really did
            change, but React had no reason to re-render, so the screen still shows the old
            number.
          </li>
          <li>
            Now press <strong>Bump state</strong>. The ref's true value appears immediately,
            because <em>that</em> render drew both. The classic symptom: "my value updates
            one click late."
          </li>
          <li>
            <strong>The latest-value ref</strong> is the legitimate pattern. Press{" "}
            <em>Schedule a delayed read</em>, then bump the state a few times. The closure
            reports the old value; the ref reports the current one. Refs are how a callback
            escapes its render's snapshot (§6.2).
          </li>
          <li>
            The test is always: <strong>does the screen need to change when this value
            changes?</strong>
          </li>
        </ul>
      }
    >
      <Row className="g-3">
        <Col md={6}>
          <Card className="h-100 border-primary-subtle text-center">
            <Card.Header className="bg-primary-subtle small fw-semibold">
              useState — re-renders
            </Card.Header>
            <Card.Body>
              <div className="display-5 fw-semibold">{stateCount}</div>
              <Button className="mt-2" onClick={bumpState}>
                Bump state
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="h-100 border-warning-subtle text-center">
            <Card.Header className="bg-warning-subtle small fw-semibold">
              useRef — does not re-render
            </Card.Header>
            <Card.Body>
              <div className="display-5 fw-semibold">{refCount.current}</div>
              <div className="small text-muted">
                displayed value may be stale
              </div>
              <Button variant="warning" className="mt-2" onClick={bumpRef}>
                Bump ref
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12}>
          <div className="d-flex flex-wrap align-items-center gap-2">
            <Button variant="outline-secondary" size="sm" onClick={() => forceRender((n) => n + 1)}>
              Force an unrelated re-render
            </Button>
            <Button variant="outline-primary" size="sm" onClick={scheduleRead}>
              Schedule a delayed read (1.5s)
            </Button>
            <RenderBadge label="RefVsStateLab" bg="dark" />
          </div>
        </Col>

        <Col lg={6}>
          <Table bordered size="sm" className="small mb-0">
            <thead className="table-light">
              <tr>
                <th />
                <th>useState</th>
                <th>useRef</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Re-renders on change</td><td>yes</td><td><strong>no</strong></td></tr>
              <tr><td>Survives re-renders</td><td>yes</td><td>yes</td></tr>
              <tr><td>Survives unmount</td><td>no</td><td>no</td></tr>
              <tr><td>Safe to read in render</td><td>yes</td><td><strong>no</strong></td></tr>
              <tr><td>Safe to write in render</td><td>no</td><td><strong>no</strong></td></tr>
            </tbody>
          </Table>
        </Col>

        <Col lg={6}>
          <Alert variant="light" className="border small mb-0">
            <div className="fw-semibold mb-2">Delayed reads</div>
            {delayedReads.length === 0 ? (
              <span className="text-muted">
                Schedule one, then bump the state before it fires.
              </span>
            ) : (
              <ul className="mb-0 font-monospace">
                {delayedReads.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            )}
            <div className="mt-2">
              current state: <Badge bg="primary">{stateCount}</Badge> · ref mirror:{" "}
              <Badge bg="secondary">{latestStateRef.current}</Badge>
            </div>
          </Alert>
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "ref-vs-state", chapter: "15 — Refs", title: "Ref vs state", element: <RefVsStateLab /> }`.

**Experiments:**

1. Change the ref card to show a value it *needs* to display, and try to make it work with only a ref. You can't, without a `forceRender` hack — which is a re-implementation of `useState` with extra steps. Displayed values are state.
2. Move `latestStateRef.current = c + 1` out of the setter and into a `useEffect(() => { latestStateRef.current = stateCount }, [stateCount])`. That's the more idiomatic version of the latest-value ref, and it's exactly what `usePrevious` (Lab 12.3) does in reverse.
3. Add `refCount.current += 1` at the top of the component body. Under Strict Mode it jumps by 2 per render, and the displayed number becomes meaningless. Never write refs during render.

---

## 🧪 Lab 15.3 — A stopwatch: timer ids in refs

**Level:** depth

Create `src/demos/15-refs/StopwatchLab.tsx`:

```tsx
import { useEffect, useRef, useState } from "react"
import { Badge, Button, ButtonGroup, Card, Col, ListGroup, Row } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"

function format(ms: number): string {
  const total = Math.floor(ms / 10)
  const centis = total % 100
  const seconds = Math.floor(total / 100) % 60
  const minutes = Math.floor(total / 6000)
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centis).padStart(2, "0")}`
}

export default function StopwatchLab() {
  const [elapsed, setElapsed] = useState(0)     // shown on screen → state
  const [running, setRunning] = useState(false) // shown on screen → state
  const [laps, setLaps] = useState<number[]>([])

  const intervalRef = useRef<number | null>(null)  // bookkeeping → ref
  const startedAtRef = useRef<number>(0)           // bookkeeping → ref

  function start() {
    if (intervalRef.current !== null) return       // already running — the ref tells us
    startedAtRef.current = performance.now() - elapsed
    intervalRef.current = window.setInterval(() => {
      setElapsed(performance.now() - startedAtRef.current)
    }, 10)
    setRunning(true)
  }

  function stop() {
    if (intervalRef.current === null) return
    clearInterval(intervalRef.current)
    intervalRef.current = null
    setRunning(false)
  }

  function reset() {
    stop()
    setElapsed(0)
    setLaps([])
  }

  // Cleanup on unmount — the timer must not outlive the component (§11.3)
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current)
    }
  }, [])

  return (
    <DemoCard
      title="A stopwatch: which values are refs?"
      claim="The elapsed time is on screen, so it's state. The interval id and the start timestamp are bookkeeping, so they're refs."
      level="depth"
      notice={
        <ul className="mb-0">
          <li>
            <code>intervalRef</code> holds the timer id. It must survive re-renders (so a
            local variable won't do) and must not cause them (so state would be wrong and
            wasteful).
          </li>
          <li>
            <code>startedAtRef</code> holds the reference timestamp. Deriving elapsed time
            from <code>performance.now() - startedAt</code> rather than incrementing a
            counter means the display <strong>can't drift</strong> — timers fire late, and
            accumulating their nominal interval accumulates error.
          </li>
          <li>
            <code>intervalRef.current !== null</code> doubles as "am I running?" for
            guarding, while <code>running</code> state exists purely to render the buttons.
            Two representations of one fact — acceptable here because they serve different
            purposes, but worth noticing.
          </li>
          <li>
            The unmount cleanup is not optional. Start it, navigate to another demo, and
            without that effect the interval would keep firing forever.
          </li>
        </ul>
      }
    >
      <Row className="g-3">
        <Col md={7}>
          <Card body className="text-center">
            <div className="display-3 fw-semibold font-monospace">{format(elapsed)}</div>
            <Badge bg={running ? "success" : "secondary"} className="mb-3">
              {running ? "running" : "stopped"}
            </Badge>
            <ButtonGroup className="w-100">
              {running ? (
                <Button variant="warning" onClick={stop}>
                  Stop
                </Button>
              ) : (
                <Button variant="success" onClick={start}>
                  Start
                </Button>
              )}
              <Button
                variant="outline-primary"
                disabled={!running}
                onClick={() => setLaps((prev) => [elapsed, ...prev])}
              >
                Lap
              </Button>
              <Button variant="outline-secondary" onClick={reset}>
                Reset
              </Button>
            </ButtonGroup>
          </Card>
        </Col>

        <Col md={5}>
          <Card className="h-100">
            <Card.Header className="small fw-semibold">
              Laps ({laps.length})
            </Card.Header>
            <ListGroup variant="flush" className="overflow-auto" style={{ maxHeight: 240 }}>
              {laps.length === 0 ? (
                <ListGroup.Item className="small text-muted">
                  Start the clock and press Lap.
                </ListGroup.Item>
              ) : (
                laps.map((lap, i) => (
                  <ListGroup.Item key={`${lap}-${i}`} className="small font-monospace d-flex justify-content-between">
                    <span className="text-muted">#{laps.length - i}</span>
                    {format(lap)}
                  </ListGroup.Item>
                ))
              )}
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "stopwatch", chapter: "15 — Refs", title: "Stopwatch (timer refs)", element: <StopwatchLab /> }`.

**Experiments:**

1. Change `intervalRef` to a plain `let intervalId: number | null = null` in the component body. Start the clock, then press Stop — nothing stops, because the variable was recreated on every render and `stop()` reads a fresh `null`. **This is precisely the problem refs solve.**
2. Replace the timestamp approach with `setElapsed(e => e + 10)`. Run both for a minute against a real clock. The incrementing version drifts seconds behind, because `setInterval` doesn't fire precisely. Derive from a timestamp whenever accuracy matters.
3. Make `intervalRef` state instead. It works, but every start/stop causes an extra render, and you can't read it synchronously inside `start` to guard against double-starts — the guard would see the previous render's value.

---

## 🧪 Lab 15.4 — Forwarding refs and imperative handles

**Level:** depth

Create `src/demos/15-refs/ForwardRefLab.tsx`:

```tsx
import { forwardRef, useImperativeHandle, useRef, useState } from "react"
import { Alert, Button, Card, Col, Form, Row } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"

// ---------- 1. Forwarding a ref to the underlying input ----------

interface LabelledInputProps {
  label: string
  hint?: string
}

const LabelledInput = forwardRef<HTMLInputElement, LabelledInputProps>(
  function LabelledInput({ label, hint }, ref) {
    return (
      <Form.Group className="mb-2">
        <Form.Label className="small">{label}</Form.Label>
        <Form.Control ref={ref} placeholder={hint} />
        <Form.Text>The parent holds a ref to this actual input element.</Form.Text>
      </Form.Group>
    )
  }
)

// ---------- 2. Exposing a custom API instead of the node ----------

export interface CounterHandle {
  increment: () => void
  reset: () => void
  /** Reads the current value without the parent storing it. */
  read: () => number
}

const ImperativeCounter = forwardRef<CounterHandle, { step?: number }>(
  function ImperativeCounter({ step = 1 }, ref) {
    const [value, setValue] = useState(0)
    const valueRef = useRef(0)

    useImperativeHandle(
      ref,
      () => ({
        increment: () => {
          valueRef.current += step
          setValue(valueRef.current)
        },
        reset: () => {
          valueRef.current = 0
          setValue(0)
        },
        read: () => valueRef.current,
      }),
      [step]
    )

    return (
      <Card body className="text-center">
        <div className="small text-muted">owned by the child</div>
        <div className="display-6 fw-semibold">{value}</div>
      </Card>
    )
  }
)

export default function ForwardRefLab() {
  const firstRef = useRef<HTMLInputElement>(null)
  const secondRef = useRef<HTMLInputElement>(null)
  const counterRef = useRef<CounterHandle>(null)
  const [readValue, setReadValue] = useState<number | null>(null)

  return (
    <DemoCard
      title="Forwarding refs and imperative handles"
      claim="forwardRef lets a parent reach a child's DOM node. useImperativeHandle lets the child expose a chosen API instead — an escape hatch to use sparingly."
      level="depth"
      notice={
        <ul className="mb-0">
          <li>
            The focus buttons reach <em>inside</em> <code>LabelledInput</code> to the real{" "}
            <code>&lt;input&gt;</code>. Without forwarding, the ref would be{" "}
            <code>null</code> — a function component has no node of its own.
          </li>
          <li>
            <code>forwardRef&lt;HTMLInputElement, Props&gt;</code> — element type{" "}
            <strong>first</strong>, props second. This ordering catches nearly everyone once.
          </li>
          <li>
            The counter exposes three methods and no node. The parent can command it without
            owning its state — which is occasionally exactly right, and usually a sign you
            should have lifted the state instead (§9).
          </li>
          <li>
            <strong>In React 19</strong> <code>ref</code> is an ordinary prop, so{" "}
            <code>forwardRef</code> is no longer needed for case 1 — declare{" "}
            <code>ref?: React.Ref&lt;HTMLInputElement&gt;</code> in the props. It still
            works, and you'll meet it in every existing codebase.
          </li>
        </ul>
      }
    >
      <Row className="g-3">
        <Col lg={6}>
          <Card body>
            <div className="small fw-semibold text-muted mb-2">
              1 — forwarded DOM refs
            </div>
            <LabelledInput ref={firstRef} label="First name" hint="Try the buttons below" />
            <LabelledInput ref={secondRef} label="Surname" />
            <div className="d-flex flex-wrap gap-2">
              <Button size="sm" onClick={() => firstRef.current?.focus()}>
                Focus first
              </Button>
              <Button size="sm" onClick={() => secondRef.current?.focus()}>
                Focus surname
              </Button>
              <Button
                size="sm"
                variant="outline-primary"
                onClick={() => {
                  if (firstRef.current) firstRef.current.value = "Ada"
                  if (secondRef.current) secondRef.current.value = "Lovelace"
                }}
              >
                Fill imperatively
              </Button>
            </div>
          </Card>
        </Col>

        <Col lg={6}>
          <Card body>
            <div className="small fw-semibold text-muted mb-2">
              2 — a custom imperative handle
            </div>
            <ImperativeCounter ref={counterRef} step={5} />
            <div className="d-flex flex-wrap gap-2 mt-3">
              <Button size="sm" onClick={() => counterRef.current?.increment()}>
                increment()
              </Button>
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={() => counterRef.current?.reset()}
              >
                reset()
              </Button>
              <Button
                size="sm"
                variant="outline-primary"
                onClick={() => setReadValue(counterRef.current?.read() ?? null)}
              >
                read()
              </Button>
            </div>
            {readValue !== null && (
              <div className="small text-muted mt-2">
                read() returned <code>{readValue}</code> — the parent never stored it.
              </div>
            )}
          </Card>
        </Col>

        <Col xs={12}>
          <Alert variant="warning" className="small mb-0">
            <strong>When not to do this.</strong> If the parent needs to <em>know</em> the
            counter's value, lift the state (§9) and pass{" "}
            <code>value</code> + <code>onChange</code>. Imperative handles are for genuinely
            imperative operations with no state to represent them —{" "}
            <code>focus()</code>, <code>scrollTo()</code>, <code>play()</code>,{" "}
            <code>measure()</code>.
          </Alert>
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "forward-ref", chapter: "15 — Refs", title: "forwardRef & handles", element: <ForwardRefLab /> }`.

✅ **Concept check 15**

1. What are the two properties of a ref that make it useful, and which one distinguishes it from state?
2. Why is `boxRef.current` `null` during the first render?
3. When must you use a callback ref (or state as a ref) instead of `useRef`?
4. What's the generic order for `forwardRef`?
5. When is `useImperativeHandle` appropriate, and what should you usually do instead?

---
# 16. Performance: `memo`, `useMemo`, `useCallback`

Read this section last and apply it least. **Measure before optimising.** Most React apps are fast without any of this, and premature memoisation adds code, adds dependency arrays to get wrong, and has its own runtime cost.

The order in which to reach for things:

1. **Fix the structure** — move state down, split contexts, pass children as props. Free, and usually enough.
2. **Measure** with the React DevTools Profiler, so you know which component is actually slow.
3. **Then** memoise the specific thing the profiler pointed at.

Skipping straight to step 3 is how codebases end up with `useCallback` on every function and no measurable improvement.

## 16.1 How to measure

Ten minutes with the Profiler is worth more than this whole section:

1. Open React DevTools → **Profiler** tab.
2. Click the gear icon and tick **"Highlight updates when components render"** — this alone shows you which parts of the screen re-render on each interaction.
3. Press **record**, perform the slow interaction, press stop.
4. Read the **flamegraph**: width is time spent. Look for wide bars, and for components that rendered when they had no reason to.
5. Use the **ranked** view to see the most expensive components in that commit.

Two numbers matter, and confusing them wastes a lot of effort:

- **"This component re-rendered"** — usually harmless. A re-render that produces identical output causes zero DOM work.
- **"This component took 40ms"** — a real problem. Either it's doing expensive work, or it's rendering hundreds of children.

Optimise the second. Ignore the first unless it *causes* the second.

## 16.2 `React.memo` — skip re-rendering a component

```tsx
const TaskCard = memo(function TaskCard({ task, onEdit }: TaskCardProps) {
  return /* ... */
})
```

`memo` compares the new props with the previous ones **shallowly** (`Object.is` per prop) and skips the render if they're all equal.

It is **useless** — a pure cost — if any prop is a new value every render:

```tsx
<TaskCard task={task} onEdit={() => edit(task.id)} />          // ❌ new function each render
<TaskCard task={task} options={{ compact: true }} />           // ❌ new object each render
<TaskCard task={task} tags={task.tags.filter(Boolean)} />      // ❌ new array each render
```

Which is exactly why the next two hooks exist. `memo` and `useCallback`/`useMemo` are a **package**: applying `memo` alone to a component whose parent passes inline arrows accomplishes nothing at all, and Lab 16.1 shows this happening.

`memo` also **cannot** prevent a re-render caused by state inside the component, or by a **context** change (§14.3, experiment 2). It only compares props.

## 16.3 `useMemo` — cache an expensive calculation

```tsx
const sorted = useMemo(
  () => [...tasks].sort((a, b) => b.createdAt - a.createdAt),
  [tasks]
)
```

Recomputes only when `tasks` changes. Two legitimate reasons to use it:

1. **The computation is genuinely expensive.** Parsing, large sorts, chart data preparation, heavy date maths over thousands of rows.
2. **You need a stable reference** for a `memo`-ised child's prop, or for an effect's dependency array (§11.2).

The second reason is more common than the first, and it's about correctness as much as speed.

The return type is inferred, so no annotation is needed. And remember: **`useMemo` is a hint, not a guarantee** — React may discard the cache. Never put a side effect inside one, and never rely on it for correctness of anything but reference identity.

## 16.4 `useCallback` — cache a function reference

```tsx
const handleToggle = useCallback((id: string) => {
  dispatch({ type: "toggled", id })
}, [dispatch])
```

`useCallback(fn, deps)` is exactly `useMemo(() => fn, deps)`. It matters only when the function is:

- passed to a `memo`-ised child, or
- used as a dependency of an effect or another memo, or
- returned from a custom hook that other people's memoised components consume.

Annotate the parameters — they aren't inferred from anything inside `useCallback`.

**Wrapping every handler in `useCallback` is a net loss.** Each one allocates a dependency array, runs a comparison, and retains the previous closure. For a handler passed to a plain `<button onClick>`, that's pure overhead.

## 16.5 Free wins that beat memoisation

These cost nothing and often make memoisation unnecessary:

**Keep state low.** State in a leaf re-renders one component; state at the root re-renders everything (Lab 1.2). Moving a piece of state down one level can eliminate an entire subtree's re-renders.

**Pass elements as `children`.** Children created in a parent don't re-render when *that parent's* state changes, because the element objects were created before the state changed:

```tsx
// Slow: Expensive re-renders on every colour change
function Page() {
  const [colour, setColour] = useState("red")
  return <div style={{ colour }}><Expensive /></div>
}

// Fast: Expensive is created by Page's parent, so a colour change can't touch it
function Page({ children }: { children: ReactNode }) {
  const [colour, setColour] = useState("red")
  return <div style={{ colour }}>{children}</div>
}
<Page><Expensive /></Page>
```

Lab 16.4 demonstrates this, and it's the least-known trick in this section.

**Split contexts** so consumers subscribe only to what they use (§14.3).

**Code-split routes** with `lazy` + `Suspense`:

```tsx
const Settings = lazy(() => import("./pages/Settings"))

<Suspense fallback={<Spinner animation="border" />}>
  <Settings />
</Suspense>
```

**Virtualise long lists.** Beyond a few hundred rows, no amount of memoisation beats simply not rendering the rows nobody can see. `@tanstack/react-virtual` is the current standard.

## 16.6 A note on the React Compiler

React now ships an optional compiler that inserts memoisation automatically, at build time, by analysing your code. Where it's enabled, most manual `useMemo`/`useCallback`/`memo` becomes unnecessary.

Two things follow. First, **don't invest heavily in hand-memoisation on new projects** — check whether the compiler is available for your setup. Second, **the compiler relies on your components being pure** (§1.4), so everything in this document about not mutating props, not mutating state, and not writing refs during render becomes more valuable, not less. Impure components are the one thing that stops it working.

---

## 🧪 Lab 16.1 — `memo`, and why it usually does nothing

**Level:** core

Create `src/demos/16-performance/MemoLab.tsx`:

```tsx
import { memo, useCallback, useState } from "react"
import { Alert, Button, Card, Col, Form, Row } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import RenderBadge from "@/lab/RenderBadge"

interface RowProps {
  label: string
  onPick: (label: string) => void
}

/** Not memoised — re-renders whenever the parent does. */
function PlainRow({ label, onPick }: RowProps) {
  return (
    <div className="d-flex align-items-center gap-2 mb-1">
      <Button size="sm" variant="outline-secondary" onClick={() => onPick(label)}>
        {label}
      </Button>
      <RenderBadge label={label} bg="secondary" />
    </div>
  )
}

/** Memoised — re-renders only if `label` or `onPick` changes identity. */
const MemoRow = memo(function MemoRow({ label, onPick }: RowProps) {
  return (
    <div className="d-flex align-items-center gap-2 mb-1">
      <Button size="sm" variant="outline-primary" onClick={() => onPick(label)}>
        {label}
      </Button>
      <RenderBadge label={label} bg="primary" />
    </div>
  )
})

export default function MemoLab() {
  const [tick, setTick] = useState(0)
  const [stableHandler, setStableHandler] = useState(true)
  const [picked, setPicked] = useState<string | null>(null)

  // Stable across renders
  const stablePick = useCallback((label: string) => setPicked(label), [])

  // A brand-new function on every render
  const unstablePick = (label: string) => setPicked(label)

  const onPick = stableHandler ? stablePick : unstablePick

  return (
    <DemoCard
      title="memo, and why it usually does nothing"
      claim="memo compares props shallowly. Pass it a new function or object each render and it can never bail out — so memo and useCallback only work as a pair."
      level="core"
      notice={
        <ul className="mb-0">
          <li>
            With <strong>stable handler ON</strong>, press <em>Re-render parent</em>. The
            grey rows' counters climb; the blue ones don't move.{" "}
            <code>memo</code> is working.
          </li>
          <li>
            Turn <strong>stable handler OFF</strong> and press it again. Now the blue rows
            climb too — <code>onPick</code> is a different function object every render, so
            the shallow comparison always fails. <strong>memo is now pure overhead.</strong>
          </li>
          <li>
            This is the most common memoisation mistake in real code: adding{" "}
            <code>memo</code> to a component while the parent passes{" "}
            <code>{"onClick={() => …}"}</code> inline.
          </li>
          <li>
            Note the rows still work in both modes. Memoisation never changes behaviour —
            which is why a broken optimisation is invisible without measurement.
          </li>
        </ul>
      }
    >
      <Alert variant="light" className="border small">
        Counters climb in twos under Strict Mode. Compare which ones{" "}
        <em>move</em>, not their values.
      </Alert>

      <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
        <Button onClick={() => setTick((t) => t + 1)}>
          Re-render parent ({tick})
        </Button>
        <Form.Check
          type="switch"
          checked={stableHandler}
          onChange={(e) => setStableHandler(e.target.checked)}
          label={
            <span>
              stable handler (<code>useCallback</code>) —{" "}
              <strong>{stableHandler ? "ON" : "OFF"}</strong>
            </span>
          }
        />
        {picked && <span className="small text-muted">picked: {picked}</span>}
      </div>

      <Row className="g-3">
        <Col md={6}>
          <Card className="h-100">
            <Card.Header className="small fw-semibold">
              Plain components (no memo)
            </Card.Header>
            <Card.Body>
              {["A", "B", "C"].map((label) => (
                <PlainRow key={label} label={label} onPick={onPick} />
              ))}
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="h-100 border-primary-subtle">
            <Card.Header className="bg-primary-subtle small fw-semibold">
              memo(...) components
            </Card.Header>
            <Card.Body>
              {["X", "Y", "Z"].map((label) => (
                <MemoRow key={label} label={label} onPick={onPick} />
              ))}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "memo", chapter: "16 — Performance", title: "memo & useCallback", element: <MemoLab /> }`.

**Experiments:**

1. Add a third column passing an inline object: `<MemoRow label={l} onPick={stablePick} meta={{ index: 0 }} />`. It never bails out, even with a stable handler — one unstable prop is enough to defeat `memo` entirely.
2. Open DevTools → Profiler, tick "Highlight updates", and press Re-render parent in each mode. The flashing outlines tell the same story visually, and this is the tool you'll actually reach for.
3. Remove `memo` completely and time the interaction in the Profiler. For three rows the difference is unmeasurable. Now think about that before adding `memo` to anything with fewer than a hundred instances.

---

## 🧪 Lab 16.2 — `useMemo` with a cost you can feel

**Level:** depth

Create `src/demos/16-performance/UseMemoLab.tsx`:

```tsx
import { useMemo, useState } from "react"
import { Alert, Badge, Button, Card, Col, Form, Row, Table } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import { measure, slowSum } from "@/lab/slow"

export default function UseMemoLab() {
  const [size, setSize] = useState(5_000_000)
  const [unrelated, setUnrelated] = useState(0)
  const [timings, setTimings] = useState<{ memoised: number; plain: number }[]>([])

  // ❌ Recomputed on EVERY render, including unrelated ones
  const plain = measure(() => slowSum(size))

  // ✅ Recomputed only when `size` changes
  const memoised = useMemo(() => measure(() => slowSum(size)), [size])

  // Record the timings for the table (in an event handler, not during render)
  function recordAndRerender() {
    setTimings((prev) =>
      [{ memoised: memoised.ms, plain: plain.ms }, ...prev].slice(0, 6)
    )
    setUnrelated((n) => n + 1)
  }

  return (
    <DemoCard
      title="useMemo, with a cost you can feel"
      claim="useMemo earns its place when the computation is genuinely expensive and its inputs change less often than the component renders."
      level="depth"
      notice={
        <ul className="mb-0">
          <li>
            Press <strong>Unrelated re-render</strong> repeatedly. The plain calculation
            costs its full time <em>every single press</em>; the memoised one reports{" "}
            <strong>0ms</strong>, because it returned the cached result without running.
          </li>
          <li>
            Now change the <strong>size</strong>. Both recompute — the memo's dependency
            changed, which is exactly when it <em>should</em> recompute.
          </li>
          <li>
            The memoised timing shows the cost of the <em>last real computation</em>, since
            the cached object is returned unchanged. That's the point: the work happened
            once.
          </li>
          <li>
            <strong>Now scale it down.</strong> Set size to 1,000 and press unrelated
            re-render. Both report 0ms. At that scale <code>useMemo</code> is pure
            overhead — a dependency array to maintain for no gain. <strong>This is the
            usual case in real apps.</strong>
          </li>
        </ul>
      }
    >
      <Alert variant="warning" className="small">
        This lab deliberately burns CPU. The page will feel sluggish at large sizes — that's
        the measurement, not a bug.
      </Alert>

      <Row className="g-3">
        <Col lg={6}>
          <Card body>
            <Form.Group className="mb-3">
              <Form.Label className="small">
                Iterations: {size.toLocaleString()}
              </Form.Label>
              <Form.Range
                min={1_000}
                max={20_000_000}
                step={1_000}
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
              />
              <div className="d-flex gap-2 mt-2">
                {[1_000, 1_000_000, 5_000_000, 20_000_000].map((n) => (
                  <Button
                    key={n}
                    size="sm"
                    variant="outline-secondary"
                    onClick={() => setSize(n)}
                  >
                    {n.toLocaleString()}
                  </Button>
                ))}
              </div>
            </Form.Group>

            <Button onClick={recordAndRerender}>
              Unrelated re-render ({unrelated})
            </Button>
          </Card>
        </Col>

        <Col lg={6}>
          <Card body className="h-100">
            <Row className="g-3 text-center">
              <Col xs={6}>
                <div className="small text-muted">plain</div>
                <div className="fs-3 fw-semibold text-danger">{plain.ms}ms</div>
                <Badge bg="danger">every render</Badge>
              </Col>
              <Col xs={6}>
                <div className="small text-muted">useMemo</div>
                <div className="fs-3 fw-semibold text-success">{memoised.ms}ms</div>
                <Badge bg="success">only when size changes</Badge>
              </Col>
            </Row>

            <Table size="sm" bordered className="mt-3 mb-0 small">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>memoised</th>
                  <th>plain</th>
                </tr>
              </thead>
              <tbody>
                {timings.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-muted">
                      Press the button to record.
                    </td>
                  </tr>
                ) : (
                  timings.map((t, i) => (
                    <tr key={i}>
                      <td>{timings.length - i}</td>
                      <td>{t.memoised}ms</td>
                      <td className="text-danger">{t.plain}ms</td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Card>
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "use-memo", chapter: "16 — Performance", title: "useMemo with real cost", element: <UseMemoLab /> }`.

**Experiments:**

1. Set size to 1,000 — a realistic amount of work for filtering a few hundred list items. Both columns read 0ms. **This is why "wrap every derivation in `useMemo`" is bad advice**: you pay complexity for an unmeasurable gain.
2. Add `[size, unrelated]` as the dependency array. The memo now recomputes on every button press — a memo whose dependencies change as often as the component renders is a memo that does nothing but add code.
3. Put a `console.log` inside the `useMemo` callback. Under Strict Mode it logs twice per real computation, because React double-invokes it to check purity. Another reason never to put a side effect in one.

---

## 🧪 Lab 16.3 — Children as props: the free optimisation

**Level:** depth

The least-known technique in this section, and it needs no hooks at all.

Create `src/demos/16-performance/ChildrenAsPropsLab.tsx`:

```tsx
import { useState, type ReactNode } from "react"
import { Alert, Button, Card, Col, Form, Row } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import RenderBadge from "@/lab/RenderBadge"
import { measure, slowSum } from "@/lab/slow"

/** A component with a real render cost. */
function ExpensiveWidget({ label }: { label: string }) {
  const { ms } = measure(() => slowSum(3_000_000))
  return (
    <Card body className="text-center">
      <div className="small text-muted">{label}</div>
      <div className="small">
        rendered in <strong>{ms}ms</strong>
      </div>
      <RenderBadge label={label} bg="dark" />
    </Card>
  )
}

// ---------- A: the expensive child is created INSIDE the stateful component ----------

function ColourPickerInside() {
  const [hue, setHue] = useState(200)

  return (
    <div
      className="rounded-3 p-3"
      style={{ backgroundColor: `hsl(${hue} 80% 92%)` }}
    >
      <Form.Label className="small">hue: {hue}</Form.Label>
      <Form.Range min={0} max={360} value={hue} onChange={(e) => setHue(Number(e.target.value))} />
      {/* Recreated on every hue change → re-renders → 3M iterations per drag frame */}
      <ExpensiveWidget label="child created inside" />
    </div>
  )
}

// ---------- B: the expensive child is passed in as children ----------

function ColourPickerWrapper({ children }: { children: ReactNode }) {
  const [hue, setHue] = useState(200)

  return (
    <div
      className="rounded-3 p-3"
      style={{ backgroundColor: `hsl(${hue} 80% 92%)` }}
    >
      <Form.Label className="small">hue: {hue}</Form.Label>
      <Form.Range min={0} max={360} value={hue} onChange={(e) => setHue(Number(e.target.value))} />
      {/* Already-created element objects. A hue change cannot affect them. */}
      {children}
    </div>
  )
}

export default function ChildrenAsPropsLab() {
  return (
    <DemoCard
      title="Children as props: the free optimisation"
      claim="An element passed in as children was created by the parent's parent. Nothing the stateful component does can invalidate it — no memo required."
      level="depth"
      notice={
        <ul className="mb-0">
          <li>
            Drag the <strong>left</strong> slider. The expensive widget re-renders on every
            frame — watch its render badge climb and its timing appear repeatedly. The drag
            feels sticky.
          </li>
          <li>
            Drag the <strong>right</strong> slider. The widget's badge doesn't move at all,
            and the drag is smooth. The background still changes, so the state update
            happened — it just couldn't reach the child.
          </li>
          <li>
            <strong>Why:</strong> <code>{"<ExpensiveWidget />"}</code> is an element object
            created where it's written. On the right, that's in{" "}
            <code>ChildrenAsPropsLab</code>, which doesn't re-render when{" "}
            <code>hue</code> changes. React sees the identical element in the same position
            and reuses it.
          </li>
          <li>
            No <code>memo</code>, no <code>useMemo</code>, no <code>useCallback</code>.
            Just moving where the element is created. <strong>Structure beats
            memoisation.</strong>
          </li>
        </ul>
      }
    >
      <Alert variant="light" className="border small">
        Each widget render burns 3 million iterations, so the difference is easy to feel
        rather than just measure.
      </Alert>

      <Row className="g-3">
        <Col lg={6}>
          <Card className="h-100 border-danger-subtle">
            <Card.Header className="bg-danger-subtle small fw-semibold">
              A — child created inside the stateful component
            </Card.Header>
            <Card.Body>
              <ColourPickerInside />
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="h-100 border-success-subtle">
            <Card.Header className="bg-success-subtle small fw-semibold">
              B — child passed as <code>children</code>
            </Card.Header>
            <Card.Body>
              <ColourPickerWrapper>
                <ExpensiveWidget label="child passed in" />
              </ColourPickerWrapper>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Alert variant="light" className="border small mt-3 mb-0">
        <div className="fw-semibold mb-1">Where this matters in real code</div>
        A page-level layout that owns a sidebar-open boolean, a theme wrapper, a
        drag-and-drop container, a form that tracks focus — any component that holds
        frequently-changing state and wraps expensive content. Accepting{" "}
        <code>children</code> instead of rendering them directly is often the whole fix.
      </Alert>
    </DemoCard>
  )
}
```

Register as `{ id: "children-as-props", chapter: "16 — Performance", title: "Children as props", element: <ChildrenAsPropsLab /> }`.

**Experiments:**

1. Wrap `ExpensiveWidget` in `memo` and try the left slider again. It's now fast too — but you've added an API constraint (all props must stay referentially stable) to fix something the structure fixed for free. Both work; only one scales.
2. In version B, move `<ExpensiveWidget />` from `children` into `ColourPickerWrapper`'s body. The optimisation vanishes instantly. Element creation location is the whole mechanism.
3. Pass the widget as a named prop instead — `<ColourPickerWrapper aside={<ExpensiveWidget />} />`. Identical benefit. It's not `children` specifically; it's *any* element created outside.

---

## 🧪 Lab 16.4 — A long list, measured

**Level:** depth

Create `src/demos/16-performance/LongListLab.tsx`:

```tsx
import { memo, useCallback, useMemo, useState } from "react"
import { Alert, Badge, Button, Card, Col, Form, Row } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import { measure } from "@/lab/slow"

interface Row {
  id: string
  label: string
  score: number
}

/** 5,000 rows, generated once at module load. */
const rows: Row[] = Array.from({ length: 5000 }, (_, i) => ({
  id: `r${i}`,
  label: `Record ${i.toString().padStart(4, "0")}`,
  score: (i * 37) % 100,
}))

interface RowItemProps {
  row: Row
  selected: boolean
  onSelect: (id: string) => void
}

function RowItemBase({ row, selected, onSelect }: RowItemProps) {
  return (
    <div
      className={`d-flex justify-content-between px-2 py-1 small border-bottom ${
        selected ? "bg-primary-subtle" : ""
      }`}
      role="button"
      onClick={() => onSelect(row.id)}
    >
      <span>{row.label}</span>
      <span className="text-muted">{row.score}</span>
    </div>
  )
}

const MemoRowItem = memo(RowItemBase)

export default function LongListLab() {
  const [query, setQuery] = useState("")
  const [minScore, setMinScore] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [useMemoisation, setUseMemoisation] = useState(true)
  const [limit, setLimit] = useState(200)

  // The derivation. Cheap for 5,000 rows — measure it and see.
  const filterResult = measure(() =>
    rows
      .filter((r) => r.label.toLowerCase().includes(query.trim().toLowerCase()))
      .filter((r) => r.score >= minScore)
  )
  const filtered = filterResult.result

  const visible = useMemo(() => filtered.slice(0, limit), [filtered, limit])

  const stableSelect = useCallback((id: string) => setSelectedId(id), [])
  const unstableSelect = (id: string) => setSelectedId(id)
  const onSelect = useMemoisation ? stableSelect : unstableSelect

  const RowComponent = useMemoisation ? MemoRowItem : RowItemBase

  return (
    <DemoCard
      title="A long list, measured"
      claim="Filtering 5,000 rows takes under a millisecond. Rendering 5,000 DOM nodes does not. Measure which half is actually slow before optimising either."
      level="depth"
      notice={
        <ul className="mb-0">
          <li>
            The <strong>filter time</strong> readout is the derivation cost for 5,000 rows.
            It's typically <strong>0–1ms</strong>. This is §10's claim, measured: deriving
            during render is not the expensive part.
          </li>
          <li>
            Raise the <strong>rendered rows</strong> slider to 2,000 and select a row. Now
            it's slow — because 2,000 components re-render. <strong>The cost is
            rendering, not computing.</strong>
          </li>
          <li>
            Turn <strong>memoisation</strong> on and select rows again. With{" "}
            <code>memo</code> + a stable <code>onSelect</code>, only the two rows whose{" "}
            <code>selected</code> prop changed re-render. Turn it off and all 2,000 do.
          </li>
          <li>
            Notice what actually fixed it: not memoising the <em>filter</em>, but memoising
            the <em>rows</em>. Optimise what the measurement points at.
          </li>
          <li>
            Beyond a few thousand rows, the real answer is virtualisation — don't render
            what nobody can see.
          </li>
        </ul>
      }
    >
      <Row className="g-3 mb-3">
        <Col md={4}>
          <Form.Group>
            <Form.Label className="small">Search 5,000 rows</Form.Label>
            <Form.Control
              size="sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. 012"
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label className="small">min score: {minScore}</Form.Label>
            <Form.Range
              min={0}
              max={99}
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label className="small">rendered rows: {limit}</Form.Label>
            <Form.Range
              min={50}
              max={2000}
              step={50}
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
            />
          </Form.Group>
        </Col>
        <Col xs={12}>
          <div className="d-flex flex-wrap align-items-center gap-3">
            <Form.Check
              type="switch"
              checked={useMemoisation}
              onChange={(e) => setUseMemoisation(e.target.checked)}
              label={
                <span>
                  memo + useCallback on rows —{" "}
                  <strong>{useMemoisation ? "ON" : "OFF"}</strong>
                </span>
              }
            />
            <span className="small">
              filter time:{" "}
              <Badge bg={filterResult.ms > 5 ? "danger" : "success"}>
                {filterResult.ms}ms
              </Badge>
            </span>
            <span className="small">
              matches: <Badge bg="secondary">{filtered.length}</Badge>
            </span>
            {selectedId && (
              <Button size="sm" variant="outline-secondary" onClick={() => setSelectedId(null)}>
                Clear selection
              </Button>
            )}
          </div>
        </Col>
      </Row>

      <Alert variant="light" className="border small">
        Open DevTools → Profiler, record, and select a row with memoisation off and then on.
        Compare the commit durations — that number is the one worth optimising.
      </Alert>

      <Card>
        <div className="overflow-auto" style={{ maxHeight: 360 }}>
          {visible.length === 0 ? (
            <div className="p-3 small text-muted">Nothing matches.</div>
          ) : (
            visible.map((row) => (
              <RowComponent
                key={row.id}
                row={row}
                selected={row.id === selectedId}
                onSelect={onSelect}
              />
            ))
          )}
        </div>
        <Card.Footer className="small text-muted">
          Showing {visible.length} of {filtered.length} matching rows
        </Card.Footer>
      </Card>
    </DemoCard>
  )
}
```

Register as `{ id: "long-list", chapter: "16 — Performance", title: "A long list, measured", element: <LongListLab /> }`.

**Experiments:**

1. Set rendered rows to 2,000, memoisation off, and select rows repeatedly. Then turn memoisation on. The difference is dramatic and, crucially, **only appears at this scale**. Drop the limit to 50 and the difference disappears entirely.
2. Wrap the filter in `useMemo(() => …, [query, minScore])`. Measure again. No perceptible change, because the filter was never the problem. **Optimising the wrong thing is the most common outcome of not measuring.**
3. Install `@tanstack/react-virtual` and render only the visible rows. The limit slider becomes irrelevant, memoisation becomes unnecessary, and 5,000 rows are as fast as 50. That's the real answer for lists this size.

---

✅ **Concept check 16**

1. What are the three steps, in order, when something feels slow?
2. What's the difference between "this component re-rendered" and "this component took 40ms", and which should you act on?
3. Why does adding `memo` to a component achieve nothing when the parent passes `onClick={() => …}`?
4. How do you stop an expensive child re-rendering without `memo`, `useMemo` or `useCallback`?
5. Name three structural fixes that are free and often make memoisation unnecessary.

Answers in [Appendix B](#appendix-b--concept-check-answers).

---

# 17. Data fetching

Three levels: how it works by hand with `fetch`, how teams actually write it with **axios**, and what a query library does that neither does. Learn the first so you can debug the other two.

## 17.1 The mock API

The labs in this section need a server that's slow, unreliable, and offline-friendly. Rather than depend on a public API, build one.

Create `src/lab/fakeApi.ts`:

```ts
export interface ApiTask {
  id: string
  title: string
  priority: "low" | "medium" | "high"
  done: boolean
}

const db: ApiTask[] = [
  { id: "1", title: "Review the API contract", priority: "high", done: false },
  { id: "2", title: "Write the migration", priority: "medium", done: true },
  { id: "3", title: "Update the changelog", priority: "low", done: false },
  { id: "4", title: "Ship the release", priority: "high", done: false },
]

export interface FetchOptions {
  /** Simulated latency in ms. */
  delay?: number
  /** 0–1 probability of failure. */
  failRate?: number
  /** Return data of the wrong shape, to demonstrate validation. */
  corrupt?: boolean
  signal?: AbortSignal
}

/** A fetch-like function: delays, sometimes fails, and honours AbortSignal. */
export function fetchTasks({
  delay = 800,
  failRate = 0,
  corrupt = false,
  signal,
}: FetchOptions = {}): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"))
      return
    }

    const timer = window.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort)
      if (Math.random() < failRate) {
        reject(new Error("Request failed: the server returned 503"))
        return
      }
      resolve(
        corrupt
          ? [{ id: 1, titel: "wrong shape", priority: "urgent" }]
          : db.map((t) => ({ ...t }))
      )
    }, delay)

    function onAbort() {
      window.clearTimeout(timer)
      reject(new DOMException("Aborted", "AbortError"))
    }

    signal?.addEventListener("abort", onAbort, { once: true })
  })
}

/** Search, so we can fire overlapping requests with different results. */
export function searchTasks(
  query: string,
  { delay = 800, signal }: FetchOptions = {}
): Promise<ApiTask[]> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      resolve(
        db.filter((t) => t.title.toLowerCase().includes(query.toLowerCase()))
      )
    }, delay)
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

/** A write, so we can demonstrate mutations and optimistic updates. */
export function toggleTask(
  id: string,
  { delay = 600, failRate = 0 }: FetchOptions = {}
): Promise<ApiTask> {
  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      if (Math.random() < failRate) {
        reject(new Error("Could not save: the server rejected the change"))
        return
      }
      const task = db.find((t) => t.id === id)
      if (!task) {
        reject(new Error(`No task with id ${id}`))
        return
      }
      task.done = !task.done
      resolve({ ...task })
    }, delay)
  })
}
```

Two deliberate design choices worth noting:

- **`fetchTasks` returns `Promise<unknown>`**, not `Promise<ApiTask[]>`. That's honest: data crossing a network boundary has an unknown shape until you check it. Annotating it as `ApiTask[]` would be a lie the compiler believes, which is exactly the mistake §17.5 is about.
- **It honours `AbortSignal`**, so the cancellation labs actually cancel rather than pretending to.

## 17.2 Fetching by hand

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

Six things to notice, because they're what people forget:

1. **`res.ok` check.** `fetch` does **not** reject on 404 or 500. Only network-level failures reject. Without this check, a 500 response with an HTML error page gets parsed as JSON and fails somewhere far away with a syntax error.
2. **`AbortController` cleanup** — prevents setting state after unmount and cancels stale requests. This is §11.3's cleanup rule applied to the network.
3. **Ignoring `AbortError`** — an intentional cancellation isn't an error worth showing the user.
4. **Three states, always** — loading, error, success. A UI that only handles the happy path will look broken in the real world, and there is *always* a real world.
5. **`err` is `unknown`** in a modern TypeScript `catch` block, so you must narrow with `err instanceof Error` before touching `.message` (§0.8.9).
6. **`async` goes inside the effect**, not on it, because an effect must return `void` or a cleanup function (§11.6's TS Note).

## 17.3 The race condition

The bug the hand-rolled version above still has. Two requests in flight, and **the slower one can finish last and overwrite the newer result**:

```
user types "a"  → request A sent (takes 900ms)
user types "ab" → request B sent (takes 200ms)
                  B resolves → setTasks(B's results)   ✅ correct
                  A resolves → setTasks(A's results)   ❌ stale data wins
```

The search box now shows results for "a" while the input says "ab". Two fixes:

```tsx
// Fix 1 — abort the previous request (best: also saves bandwidth)
useEffect(() => {
  const controller = new AbortController()
  void load(query, controller.signal)
  return () => controller.abort()
}, [query])

// Fix 2 — ignore stale responses (when the request can't be cancelled)
useEffect(() => {
  let ignore = false
  async function load() {
    const data = await search(query)
    if (!ignore) setTasks(data)
  }
  void load()
  return () => { ignore = true }
}, [query])
```

Both work because the cleanup runs **before the next effect** (§11.3). `ignore` is a per-effect-run variable captured by that run's closure, so each response knows whether its own request is still relevant.

This is the single most valuable thing in §17, because it's a bug that only appears under load or on slow connections — which is to say, in production and not on your machine. Lab 17.2 reproduces it on demand.

## 17.4 Modelling the states properly

Three separate booleans and an array is §5.3's problem again. The better shape:

```tsx
type FetchState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: T }
```

`FetchState<T>` is generic, so one type serves every request in your app, and the data can only be read after narrowing to `"success"`. Lab 17.3 builds a `useFetch` hook around it.

## 17.5 Validate at the boundary

```tsx
const data = (await res.json()) as Task[]
```

`res.json()` returns `Promise<any>`. That cast is a **claim, not a check** — if the API changes shape, or an error page comes back, or a field is null that shouldn't be, TypeScript won't notice and you'll get a runtime error somewhere far from the cause.

For anything important, validate with **zod**:

```bash
npm install zod
```

```ts
import { z } from "zod"

const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  priority: z.enum(["low", "medium", "high"]),
  done: z.boolean(),
})

const TaskListSchema = z.array(TaskSchema)

export type Task = z.infer<typeof TaskSchema>   // the type is DERIVED from the schema

// at the boundary:
const result = TaskListSchema.safeParse(await res.json())
if (!result.success) throw new Error("The server sent unexpected data")
const tasks = result.data      // typed AND verified
```

Three things this buys you:

- **The schema produces the type** (`z.infer`), so validation and types can never drift apart. One definition, not two.
- **`safeParse` returns a discriminated union** (`{ success: true, data }` or `{ success: false, error }`), so handling failure is a narrowing exercise rather than a `try`/`catch`.
- **Errors point at the boundary**, naming the field and the problem, rather than surfacing three components later as "cannot read property of undefined".

**This is the single best TypeScript habit for anything crossing a network boundary** — and it applies equally to `localStorage`, URL parameters, and `postMessage`.

## 17.6 In production, use a library

Hand-rolled fetching doesn't scale. It has no caching, no deduplication, no background refresh, no retry, no pagination support, and every component reimplements the same three states and the same race condition.

```bash
npm install @tanstack/react-query
```

```tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

function TaskListPage() {
  const { data, isPending, error } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const res = await fetch("/api/tasks")
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      return TaskListSchema.parse(await res.json())
    },
  })

  if (isPending) return <Spinner animation="border" />
  if (error) return <Alert variant="danger">{error.message}</Alert>
  return <TaskList tasks={data} />
}
```

The `queryFn`'s return type flows into `data`, so with a zod schema you get end-to-end inference from the wire to the JSX with no annotations and no casts.

The conceptual point is worth more than the API: **server state is not client state.** It's a *cached copy* of something that lives elsewhere, can go stale, can be changed by someone else, and needs revalidating. Treating it like `useState` is the mistake this class of library exists to fix — and once you see it that way, the caching, refetching and invalidation features stop looking like extras and start looking like the actual requirements.

---

## 🧪 Lab 17.1 — Fetching by hand, with all three states

**Level:** core

Create `src/demos/17-fetching/FetchByHandLab.tsx`:

```tsx
import { useEffect, useState } from "react"
import { Alert, Badge, Button, Card, Col, Form, ListGroup, Row, Spinner } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import LogPanel from "@/lab/LogPanel"
import { useEventLog } from "@/lab/useEventLog"
import { fetchTasks, type ApiTask } from "@/lab/fakeApi"

export default function FetchByHandLab() {
  const [tasks, setTasks] = useState<ApiTask[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [delay, setDelay] = useState(900)
  const [failRate, setFailRate] = useState(0)
  const [reloadKey, setReloadKey] = useState(0)
  const { entries, log, clear } = useEventLog()

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      try {
        setLoading(true)
        setError(null)
        log(`→ request sent (delay ${delay}ms, failRate ${failRate})`)

        const data = await fetchTasks({ delay, failRate, signal: controller.signal })

        // The mock returns `unknown`, so we must assert or validate — Lab 17.4
        setTasks(data as ApiTask[])
        log(`✅ ${(data as ApiTask[]).length} tasks received`)
      } catch (err) {
        // err is `unknown` — narrow before touching .message
        if (err instanceof Error && err.name === "AbortError") {
          log("⊘ aborted (cleanup ran) — not an error worth showing")
          return                              // note: skips the finally-visible state change
        }
        const message = err instanceof Error ? err.message : String(err)
        setError(message)
        log(`❌ ${message}`)
      } finally {
        setLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [delay, failRate, reloadKey, log])

  return (
    <DemoCard
      title="Fetching by hand: loading, error, success"
      claim="Six details separate a fetch that works on your machine from one that works in production: res.ok, abort, AbortError, three states, unknown errors, and async-inside-not-on."
      level="core"
      notice={
        <ul className="mb-0">
          <li>
            Set <strong>failure rate</strong> to 1 and reload. The error path renders — and
            the previous results are cleared, so you never show stale data beside an error
            message.
          </li>
          <li>
            Set the delay to 3000ms, press Reload, then <em>immediately</em> change the
            delay slider. The log shows an <strong>abort</strong>: the effect's cleanup
            cancelled the in-flight request before starting the new one.
          </li>
          <li>
            The <code>AbortError</code> branch returns early rather than setting an error.
            A cancellation you caused is not a failure to report.
          </li>
          <li>
            <code>err</code> is <code>unknown</code> in the catch — the{" "}
            <code>instanceof Error</code> narrowing is mandatory, and it's TypeScript being
            correct: JavaScript can throw anything.
          </li>
          <li>
            Under Strict Mode you'll see two requests on mount, the first aborted. That's
            the double-mount proving your cleanup works.
          </li>
        </ul>
      }
    >
      <Row className="g-3 mb-3">
        <Col md={4}>
          <Form.Group>
            <Form.Label className="small">latency: {delay}ms</Form.Label>
            <Form.Range
              min={0}
              max={4000}
              step={100}
              value={delay}
              onChange={(e) => setDelay(Number(e.target.value))}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label className="small">
              failure rate: {Math.round(failRate * 100)}%
            </Form.Label>
            <Form.Range
              min={0}
              max={1}
              step={0.25}
              value={failRate}
              onChange={(e) => setFailRate(Number(e.target.value))}
            />
          </Form.Group>
        </Col>
        <Col md={4} className="d-flex align-items-end">
          <Button className="w-100" onClick={() => setReloadKey((k) => k + 1)}>
            Reload
          </Button>
        </Col>
      </Row>

      <Row className="g-3">
        <Col lg={6}>
          <Card style={{ minHeight: 240 }}>
            <Card.Header className="small fw-semibold d-flex justify-content-between">
              <span>Result</span>
              <Badge bg={loading ? "warning" : error ? "danger" : "success"}>
                {loading ? "loading" : error ? "error" : "success"}
              </Badge>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="d-flex align-items-center gap-2 text-muted small">
                  <Spinner animation="border" size="sm" /> Loading tasks…
                </div>
              ) : error ? (
                <Alert variant="danger" className="mb-0 small">
                  <div className="fw-semibold mb-1">Couldn't load tasks</div>
                  {error}
                  <div className="mt-2">
                    <Button size="sm" variant="outline-danger" onClick={() => setReloadKey((k) => k + 1)}>
                      Retry
                    </Button>
                  </div>
                </Alert>
              ) : tasks.length === 0 ? (
                <div className="small text-muted">No tasks returned.</div>
              ) : (
                <ListGroup variant="flush">
                  {tasks.map((task) => (
                    <ListGroup.Item key={task.id} className="px-0 small d-flex justify-content-between">
                      <span className={task.done ? "text-muted text-decoration-line-through" : ""}>
                        {task.title}
                      </span>
                      <Badge bg="secondary">{task.priority}</Badge>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <LogPanel entries={entries} onClear={clear} height={300} title="Request log" />
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "fetch-by-hand", chapter: "17 — Fetching", title: "Fetch by hand", element: <FetchByHandLab /> }`.

**Experiments:**

1. Remove `return () => controller.abort()`. Set the delay to 3000ms, then drag the slider several times. Every request now completes and calls `setTasks`, in whatever order they finish. Watch the log — that's the race condition, previewed. Put the cleanup back.
2. Change the `AbortError` branch to `setError(message)`. Now every navigation and every Strict Mode double-mount shows a spurious "Aborted" error to the user. This is a very common real bug.
3. Remove the `setError(null)` at the start of `load`. Fail once, then succeed. The error stays on screen alongside the fresh results — §5.3's impossible state, in the wild. Lab 17.3 makes it unreachable.

---

## 🧪 Lab 17.2 — The race condition

**Level:** depth — **the most important lab in §17**

Create `src/demos/17-fetching/RaceConditionLab.tsx`:

```tsx
import { useEffect, useState } from "react"
import { Alert, Badge, ButtonGroup, Button, Card, Col, Form, ListGroup, Row } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import LogPanel from "@/lab/LogPanel"
import { useEventLog } from "@/lab/useEventLog"
import { searchTasks, type ApiTask } from "@/lab/fakeApi"

type Strategy = "broken" | "ignore" | "abort"

/** Latency that varies inversely with query length, so short queries are SLOW. */
function latencyFor(query: string): number {
  return Math.max(150, 1600 - query.length * 350)
}

export default function RaceConditionLab() {
  const [query, setQuery] = useState("")
  const [strategy, setStrategy] = useState<Strategy>("broken")
  const [results, setResults] = useState<ApiTask[]>([])
  const [resultsFor, setResultsFor] = useState("")
  const { entries, log, clear } = useEventLog(50)

  useEffect(() => {
    if (!query) {
      setResults([])
      setResultsFor("")
      return
    }

    let ignore = false
    const controller = new AbortController()
    const delay = latencyFor(query)
    log(`→ "${query}" sent (${delay}ms)`)

    async function run() {
      try {
        const data = await searchTasks(query, {
          delay,
          signal: strategy === "abort" ? controller.signal : undefined,
        })

        if (strategy === "ignore" && ignore) {
          log(`⊘ "${query}" arrived but was ignored (stale)`)
          return
        }

        setResults(data)
        setResultsFor(query)
        log(`← "${query}" applied (${data.length} results)`)
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          log(`⊘ "${query}" aborted`)
          return
        }
        log(`❌ ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    void run()

    return () => {
      ignore = true
      if (strategy === "abort") controller.abort()
    }
  }, [query, strategy, log])

  const isStale = resultsFor !== "" && resultsFor !== query

  return (
    <DemoCard
      title="The race condition"
      claim="Two requests in flight, and the slower one can land last — overwriting newer results with older data. It only shows up on slow connections, which is to say: in production."
      level="depth"
      notice={
        <ul className="mb-0">
          <li>
            <strong>Short queries are deliberately slow here</strong> (1600ms for one
            character, 250ms for four), which reproduces the bug reliably. Real APIs do this
            too, because short queries match more rows.
          </li>
          <li>
            With <strong>broken</strong> selected, type <code>ship</code> quickly. The
            results settle on the response for <code>"s"</code> — you'll see the red "stale"
            banner. The screen and the input disagree.
          </li>
          <li>
            Switch to <strong>ignore stale</strong> and repeat. Late responses are logged
            and discarded, because each effect run's closure captured its own{" "}
            <code>ignore</code> flag, which its cleanup set to <code>true</code>.
          </li>
          <li>
            Switch to <strong>abort</strong> and repeat. The requests are cancelled outright
            — the same correctness, plus saved bandwidth and server work.{" "}
            <strong>Prefer abort when the request can be cancelled.</strong>
          </li>
          <li>
            Both fixes work because cleanup runs <em>before the next effect</em> (§11.3).
            One mechanism, two applications.
          </li>
        </ul>
      }
    >
      <Row className="g-3 mb-3">
        <Col md={7}>
          <Form.Group>
            <Form.Label className="small">
              Search (try typing <code>ship</code> quickly)
            </Form.Label>
            <Form.Control
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="type fast…"
            />
            <Form.Text>
              latency for this query: {query ? `${latencyFor(query)}ms` : "—"}
            </Form.Text>
          </Form.Group>
        </Col>
        <Col md={5} className="d-flex align-items-end">
          <ButtonGroup size="sm" className="w-100">
            {(
              [
                ["broken", "broken"],
                ["ignore", "ignore stale"],
                ["abort", "abort"],
              ] as [Strategy, string][]
            ).map(([value, label]) => (
              <Button
                key={value}
                variant={
                  strategy === value
                    ? value === "broken"
                      ? "danger"
                      : "success"
                    : "outline-secondary"
                }
                onClick={() => {
                  setStrategy(value)
                  clear()
                }}
              >
                {label}
              </Button>
            ))}
          </ButtonGroup>
        </Col>
      </Row>

      {isStale && (
        <Alert variant="danger" className="small">
          <strong>Stale results on screen.</strong> The input says{" "}
          <code>{query}</code> but these results are for <code>{resultsFor}</code>.
        </Alert>
      )}

      <Row className="g-3">
        <Col lg={6}>
          <Card style={{ minHeight: 200 }}>
            <Card.Header className="small fw-semibold d-flex justify-content-between">
              <span>Results</span>
              {resultsFor && (
                <Badge bg={isStale ? "danger" : "success"}>for "{resultsFor}"</Badge>
              )}
            </Card.Header>
            <ListGroup variant="flush">
              {results.length === 0 ? (
                <ListGroup.Item className="small text-muted">
                  {query ? "No matches." : "Type something."}
                </ListGroup.Item>
              ) : (
                results.map((task) => (
                  <ListGroup.Item key={task.id} className="small">
                    {task.title}
                  </ListGroup.Item>
                ))
              )}
            </ListGroup>
          </Card>
        </Col>

        <Col lg={6}>
          <LogPanel entries={entries} onClear={clear} height={280} title="Request timeline" />
        </Col>
      </Row>

      <Alert variant="light" className="border small mt-3 mb-0">
        <div className="fw-semibold mb-1">Combine this with debouncing</div>
        Lab 12.3's <code>useDebouncedValue</code> would prevent most of these requests from
        being sent at all. Debouncing reduces the <em>number</em> of races; abort/ignore
        makes the remaining ones <em>correct</em>. You want both — and a query library gives
        you both by default.
      </Alert>
    </DemoCard>
  )
}
```

Register as `{ id: "race-condition", chapter: "17 — Fetching", title: "Race conditions", element: <RaceConditionLab /> }`.

**Experiments:**

1. In broken mode, type `ship` one character at a time with a short pause. No bug — each request finishes before the next starts. Now type it fast. **This is why the bug survives testing**: it needs overlapping requests, which local development with a fast API almost never produces.
2. In ignore mode, add a log line inside the cleanup: `log("cleanup: marking stale")`. Watch it interleave with the requests. The ordering — cleanup before the next effect — is the entire mechanism.
3. Add `useDebouncedValue(query, 300)` and use the debounced value in the effect. Most races disappear because most requests are never sent. Then switch back to broken mode and type slowly enough to still trigger one — proving debouncing reduces but doesn't eliminate the problem.

---

## 🧪 Lab 17.3 — A `useFetch` hook with union state

**Level:** depth

Everything from §5.3, §12 and §17 combining into one reusable hook.

Create `src/demos/17-fetching/useFetch.ts`:

```ts
import { useCallback, useEffect, useState } from "react"

export type FetchState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: T }

/**
 * Runs `fetcher` when `deps` change, with abort-based cancellation and
 * a discriminated-union state so impossible combinations can't occur.
 */
export function useFetch<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: unknown[]
) {
  const [state, setState] = useState<FetchState<T>>({ status: "idle" })
  const [nonce, setNonce] = useState(0)

  const refetch = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    const controller = new AbortController()
    let ignore = false

    setState({ status: "loading" })

    fetcher(controller.signal)
      .then((data) => {
        if (ignore) return
        setState({ status: "success", data })
      })
      .catch((err: unknown) => {
        if (ignore) return
        if (err instanceof Error && err.name === "AbortError") return
        setState({
          status: "error",
          message: err instanceof Error ? err.message : String(err),
        })
      })

    return () => {
      ignore = true
      controller.abort()
    }
    // `fetcher` is intentionally omitted: callers pass an inline closure, which
    // would be a new function every render. `deps` is the explicit contract.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce])

  return { state, refetch }
}
```

Create `src/demos/17-fetching/UseFetchLab.tsx`:

```tsx
import { useState } from "react"
import { Alert, Badge, Button, Card, Col, Form, ListGroup, Row, Spinner } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import StateInspector from "@/lab/StateInspector"
import { useFetch } from "@/demos/17-fetching/useFetch"
import { fetchTasks, type ApiTask } from "@/lab/fakeApi"

export default function UseFetchLab() {
  const [failRate, setFailRate] = useState(0)
  const [delay, setDelay] = useState(700)

  const { state, refetch } = useFetch<ApiTask[]>(
    (signal) => fetchTasks({ delay, failRate, signal }).then((d) => d as ApiTask[]),
    [delay, failRate]
  )

  return (
    <DemoCard
      title="useFetch with union state"
      claim="One generic hook, one union type, and the render becomes a total function of state — with no way to show a spinner over an error."
      level="depth"
      notice={
        <ul className="mb-0">
          <li>
            The whole render is a <code>switch</code> over four cases. There are no
            booleans, no stale <code>data</code> during an error, and no combination to
            reason about — §5.3 applied to the network.
          </li>
          <li>
            <code>state.data</code> can only be read inside{" "}
            <code>case "success"</code>. Try reading it in the error case and the compiler
            stops you.
          </li>
          <li>
            <code>useFetch&lt;ApiTask[]&gt;</code> — the generic flows into{" "}
            <code>state.data</code>, so the list below is fully typed with no annotation at
            the use site.
          </li>
          <li>
            Watch the inspector as you change the sliders: the state object <em>replaces
            itself</em> on each transition rather than accumulating fields.
          </li>
          <li>
            The <code>eslint-disable</code> in the hook is a deliberate, documented
            exception — <code>deps</code> is the explicit contract instead. That's the
            honest way to depart from the lint rule: not silently.
          </li>
        </ul>
      }
    >
      <Row className="g-3 mb-3">
        <Col md={4}>
          <Form.Group>
            <Form.Label className="small">latency: {delay}ms</Form.Label>
            <Form.Range
              min={0}
              max={3000}
              step={100}
              value={delay}
              onChange={(e) => setDelay(Number(e.target.value))}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label className="small">
              failure rate: {Math.round(failRate * 100)}%
            </Form.Label>
            <Form.Range
              min={0}
              max={1}
              step={0.5}
              value={failRate}
              onChange={(e) => setFailRate(Number(e.target.value))}
            />
          </Form.Group>
        </Col>
        <Col md={4} className="d-flex align-items-end">
          <Button className="w-100" variant="outline-primary" onClick={refetch}>
            Refetch
          </Button>
        </Col>
      </Row>

      <Row className="g-3">
        <Col lg={7}>
          <Card style={{ minHeight: 220 }}>
            <Card.Header className="small fw-semibold d-flex justify-content-between">
              <span>Rendered from one union</span>
              <Badge bg="dark">{state.status}</Badge>
            </Card.Header>
            <Card.Body>
              {(() => {
                switch (state.status) {
                  case "idle":
                    return <div className="small text-muted">Idle.</div>
                  case "loading":
                    return (
                      <div className="d-flex align-items-center gap-2 small text-muted">
                        <Spinner animation="border" size="sm" /> Loading…
                      </div>
                    )
                  case "error":
                    return (
                      <Alert variant="danger" className="mb-0 small">
                        {state.message}
                        <div className="mt-2">
                          <Button size="sm" variant="outline-danger" onClick={refetch}>
                            Retry
                          </Button>
                        </div>
                      </Alert>
                    )
                  case "success":
                    return (
                      <ListGroup variant="flush">
                        {state.data.map((task) => (
                          <ListGroup.Item
                            key={task.id}
                            className="px-0 small d-flex justify-content-between"
                          >
                            <span
                              className={
                                task.done ? "text-muted text-decoration-line-through" : ""
                              }
                            >
                              {task.title}
                            </span>
                            <Badge bg="secondary">{task.priority}</Badge>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    )
                }
              })()}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={5}>
          <StateInspector label="state" value={state} />
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "use-fetch", chapter: "17 — Fetching", title: "useFetch + union state", element: <UseFetchLab /> }`.

**Experiments:**

1. Add `{state.data.length}` to the error case. Compile error. Then do the equivalent with the three-boolean version from Lab 17.1 — it compiles and renders a stale count. **The union makes the mistake unwriteable.**
2. Add a `"refreshing"` status that keeps the old data visible while a background refetch runs (`{ status: "refreshing"; data: T }`). The `switch` stops compiling until you handle it. This is the feature every query library gives you, and now you know its shape.
3. Remove the `nonce` and try to implement `refetch`. You can't cleanly — an effect only re-runs when its dependencies change, so "run again with the same inputs" needs a changing value. The `nonce` is the standard trick, and recognising it saves you inventing something worse.

---

## 🧪 Lab 17.4 — Validate at the boundary with zod

**Level:** depth

```bash
npm install zod
```

Create `src/demos/17-fetching/ZodLab.tsx`:

```tsx
import { useState } from "react"
import { Alert, Badge, Button, Card, Col, Form, ListGroup, Row } from "react-bootstrap"
import { z } from "zod"
import DemoCard from "@/lab/DemoCard"
import StateInspector from "@/lab/StateInspector"
import { fetchTasks } from "@/lab/fakeApi"

// ---- one definition; the type is derived from it ----
const TaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  priority: z.enum(["low", "medium", "high"]),
  done: z.boolean(),
})

const TaskListSchema = z.array(TaskSchema)

type Task = z.infer<typeof TaskSchema>
//   ^? { id: string; title: string; priority: "low" | "medium" | "high"; done: boolean }

type Result =
  | { kind: "idle" }
  | { kind: "cast"; tasks: Task[] }
  | { kind: "validated"; tasks: Task[] }
  | { kind: "invalid"; issues: string[] }
  | { kind: "failed"; message: string }

export default function ZodLab() {
  const [corrupt, setCorrupt] = useState(false)
  const [result, setResult] = useState<Result>({ kind: "idle" })
  const [raw, setRaw] = useState<unknown>(null)

  /** The unsafe way: assert and hope. */
  async function loadWithCast() {
    try {
      const data = await fetchTasks({ delay: 400, corrupt })
      setRaw(data)
      setResult({ kind: "cast", tasks: data as Task[] })   // a claim, not a check
    } catch (err) {
      setResult({ kind: "failed", message: err instanceof Error ? err.message : String(err) })
    }
  }

  /** The safe way: parse at the boundary. */
  async function loadWithZod() {
    try {
      const data = await fetchTasks({ delay: 400, corrupt })
      setRaw(data)
      const parsed = TaskListSchema.safeParse(data)
      if (!parsed.success) {
        setResult({
          kind: "invalid",
          issues: parsed.error.issues.map(
            (i) => `${i.path.join(".") || "(root)"}: ${i.message}`
          ),
        })
        return
      }
      setResult({ kind: "validated", tasks: parsed.data })   // typed AND verified
    } catch (err) {
      setResult({ kind: "failed", message: err instanceof Error ? err.message : String(err) })
    }
  }

  return (
    <DemoCard
      title="Validate at the boundary with zod"
      claim="A cast is a promise TypeScript believes. A schema is a check that runs. When data comes from outside your program, you need the second."
      level="depth"
      notice={
        <ul className="mb-0">
          <li>
            Turn on <strong>corrupt response</strong> — the mock now returns{" "}
            <code>{"[{ id: 1, titel: \"wrong shape\", priority: \"urgent\" }]"}</code>.
          </li>
          <li>
            Press <strong>Load with `as Task[]`</strong>. It "succeeds": the cast compiles,
            the state is typed <code>Task[]</code>, and the list renders{" "}
            <code>undefined</code> where <code>title</code> should be. The failure is
            silent and lands at the point of <em>display</em>, far from the cause.
          </li>
          <li>
            Press <strong>Load with zod</strong>. You get a precise report: which field, at
            which index, and what was wrong. The failure lands <em>at the boundary</em>.
          </li>
          <li>
            <code>type Task = z.infer&lt;typeof TaskSchema&gt;</code> — the type is{" "}
            <strong>derived</strong> from the schema, so validation and types cannot drift
            apart. One definition, not two.
          </li>
          <li>
            The same argument applies to <code>localStorage</code>, URL
            params, <code>postMessage</code>, and anything a user can edit.
          </li>
        </ul>
      }
    >
      <Form.Check
        type="switch"
        className="mb-3"
        checked={corrupt}
        onChange={(e) => {
          setCorrupt(e.target.checked)
          setResult({ kind: "idle" })
          setRaw(null)
        }}
        label={
          <span>
            corrupt response — <strong>{corrupt ? "ON" : "OFF"}</strong>
          </span>
        }
      />

      <div className="d-flex flex-wrap gap-2 mb-3">
        <Button variant="outline-danger" onClick={loadWithCast}>
          Load with <code className="text-body">as Task[]</code>
        </Button>
        <Button variant="outline-success" onClick={loadWithZod}>
          Load with zod
        </Button>
      </div>

      <Row className="g-3">
        <Col lg={7}>
          <Card style={{ minHeight: 200 }}>
            <Card.Header className="small fw-semibold d-flex justify-content-between">
              <span>Result</span>
              <Badge
                bg={
                  result.kind === "validated"
                    ? "success"
                    : result.kind === "cast"
                    ? "warning"
                    : result.kind === "idle"
                    ? "secondary"
                    : "danger"
                }
              >
                {result.kind}
              </Badge>
            </Card.Header>
            <Card.Body>
              {result.kind === "idle" && (
                <div className="small text-muted">Press a button.</div>
              )}

              {result.kind === "failed" && (
                <Alert variant="danger" className="mb-0 small">
                  {result.message}
                </Alert>
              )}

              {result.kind === "invalid" && (
                <Alert variant="danger" className="mb-0 small">
                  <div className="fw-semibold mb-1">
                    Rejected at the boundary — nothing entered state
                  </div>
                  <ul className="mb-0 font-monospace">
                    {result.issues.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                </Alert>
              )}

              {(result.kind === "cast" || result.kind === "validated") && (
                <>
                  {result.kind === "cast" && corrupt && (
                    <Alert variant="warning" className="small">
                      The cast let bad data through. Note the empty title and the invalid
                      priority below — <strong>rendering</strong> is where you find out.
                    </Alert>
                  )}
                  <ListGroup variant="flush">
                    {result.tasks.map((task, i) => (
                      <ListGroup.Item
                        key={task.id ?? i}
                        className="px-0 small d-flex justify-content-between"
                      >
                        <span>{task.title ?? <em className="text-danger">undefined</em>}</span>
                        <Badge bg="secondary">{task.priority}</Badge>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={5}>
          <div className="small fw-semibold text-muted mb-2">
            What the "server" actually sent
          </div>
          <StateInspector label="raw" value={raw} />
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "zod", chapter: "17 — Fetching", title: "Validate with zod", element: <ZodLab /> }`.

**Experiments:**

1. With corruption on, use the cast path and open the console. Depending on what you render, you may get no error at all — just wrong output. **Silent wrongness is worse than a crash**, because nobody files a bug for data they don't know is missing.
2. Add `.transform()` to the schema: `title: z.string().min(1).transform(s => s.trim())`. Validation and normalisation in one pass, and `z.infer` still gives the right type.
3. Use `TaskListSchema.parse(...)` instead of `safeParse`. It throws, so you handle it in the existing `catch` — a `ZodError` with the same detail. `parse` is terser when you already have error handling; `safeParse` is better when you want to branch on validity.

---

## 🧪 Lab 17.5 — TanStack Query

**Level:** optional

```bash
npm install @tanstack/react-query
```

Wrap the lab app's root in a client. In `src/main.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const queryClient = new QueryClient()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
)
```

Create `src/demos/17-fetching/QueryLab.tsx`:

```tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Alert, Badge, Button, Card, Col, Form, ListGroup, Row, Spinner } from "react-bootstrap"
import { useState } from "react"
import DemoCard from "@/lab/DemoCard"
import { fetchTasks, toggleTask, type ApiTask } from "@/lab/fakeApi"

export default function QueryLab() {
  const queryClient = useQueryClient()
  const [failWrites, setFailWrites] = useState(false)

  const { data, isPending, isFetching, error, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => (await fetchTasks({ delay: 700 })) as ApiTask[],
    staleTime: 5_000,
  })

  const toggle = useMutation({
    mutationFn: (id: string) => toggleTask(id, { failRate: failWrites ? 1 : 0 }),

    // Optimistic update: change the cache immediately, roll back on failure
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] })
      const previous = queryClient.getQueryData<ApiTask[]>(["tasks"])
      queryClient.setQueryData<ApiTask[]>(["tasks"], (old) =>
        old?.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
      )
      return { previous }
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(["tasks"], context.previous)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })

  return (
    <DemoCard
      title="TanStack Query"
      claim="Caching, deduplication, background refetching, retries and optimistic updates — the things a hand-rolled fetch doesn't have and shouldn't try to grow."
      level="optional"
      notice={
        <ul className="mb-0">
          <li>
            Navigate to another demo and back. The list appears{" "}
            <strong>instantly</strong> from cache, then quietly revalidates —{" "}
            <code>isFetching</code> goes true while <code>isPending</code> stays false.
            That distinction is the whole "stale-while-revalidate" idea.
          </li>
          <li>
            Toggle a checkbox. The change appears immediately, before the 600ms request
            completes. That's the optimistic update in <code>onMutate</code>.
          </li>
          <li>
            Turn on <strong>make writes fail</strong> and toggle again. The change appears,
            then <strong>rolls back</strong> when the request fails — because{" "}
            <code>onMutate</code> returned the previous cache and{" "}
            <code>onError</code> restores it.
          </li>
          <li>
            No <code>useEffect</code>, no <code>AbortController</code>, no race-condition
            handling, no three-state union. The library owns all of it — including the bug
            from Lab 17.2.
          </li>
          <li>
            <strong>The idea worth taking away:</strong> server state is a cached copy of
            something that lives elsewhere. Once you model it that way, caching and
            revalidation stop being extras and start being requirements.
          </li>
        </ul>
      }
    >
      <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
        <Button size="sm" variant="outline-primary" onClick={() => void refetch()}>
          Refetch
        </Button>
        <Button
          size="sm"
          variant="outline-secondary"
          onClick={() => void queryClient.invalidateQueries({ queryKey: ["tasks"] })}
        >
          Invalidate cache
        </Button>
        <Form.Check
          type="switch"
          checked={failWrites}
          onChange={(e) => setFailWrites(e.target.checked)}
          label={<span className="small">make writes fail (watch the rollback)</span>}
        />
        <div className="small text-muted ms-auto">
          {isPending && <Badge bg="warning">isPending</Badge>}{" "}
          {isFetching && <Badge bg="info">isFetching</Badge>}{" "}
          {toggle.isPending && <Badge bg="secondary">saving…</Badge>}
        </div>
      </div>

      <Row className="g-3">
        <Col lg={7}>
          <Card style={{ minHeight: 200 }}>
            <Card.Header className="small fw-semibold">Tasks</Card.Header>
            <Card.Body>
              {isPending ? (
                <div className="d-flex align-items-center gap-2 small text-muted">
                  <Spinner animation="border" size="sm" /> First load…
                </div>
              ) : error ? (
                <Alert variant="danger" className="mb-0 small">
                  {error instanceof Error ? error.message : "Something went wrong"}
                </Alert>
              ) : (
                <ListGroup variant="flush">
                  {data?.map((task) => (
                    <ListGroup.Item
                      key={task.id}
                      className="px-0 d-flex align-items-center gap-2 small"
                    >
                      <Form.Check
                        checked={task.done}
                        onChange={() => toggle.mutate(task.id)}
                        aria-label={`Toggle ${task.title}`}
                      />
                      <span
                        className={
                          task.done
                            ? "flex-grow-1 text-muted text-decoration-line-through"
                            : "flex-grow-1"
                        }
                      >
                        {task.title}
                      </span>
                      <Badge bg="secondary">{task.priority}</Badge>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
            <Card.Footer className="small text-muted">
              data updated at{" "}
              {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : "—"} ·
              staleTime 5s
            </Card.Footer>
          </Card>
        </Col>

        <Col lg={5}>
          <Card body className="h-100 small">
            <div className="fw-semibold mb-2">What you'd otherwise write yourself</div>
            <ul className="mb-0">
              <li>An <code>AbortController</code> per request (Lab 17.1)</li>
              <li>Stale-response guards (Lab 17.2)</li>
              <li>A three-state union per call site (Lab 17.3)</li>
              <li>A cache, keyed by request</li>
              <li>Deduplication of identical in-flight requests</li>
              <li>Retry with backoff</li>
              <li>Refetch on window focus and reconnect</li>
              <li>Optimistic updates with rollback</li>
            </ul>
            {toggle.isError && (
              <Alert variant="danger" className="small mt-3 mb-0">
                Write failed — the optimistic change was rolled back.
              </Alert>
            )}
          </Card>
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "react-query", chapter: "17 — Fetching", title: "TanStack Query", element: <QueryLab /> }`.

**Experiments:**

1. Toggle a task, then immediately navigate away and back. The optimistic change persisted, because it went into the cache rather than into a component's state. Cache-as-state is the mental model.
2. Combine with Lab 17.4: make the `queryFn` return `TaskListSchema.parse(await fetchTasks())`. Now `data` is typed *and* verified end to end, with no annotation anywhere — the schema's inferred type flows through the query into the JSX. **This is the production setup.**
3. Set `staleTime: 0` and navigate away and back repeatedly. It refetches every time. Then set `staleTime: 60_000`. The whole caching policy is one number, which is a good illustration of what "server state needs a policy" means.

## 17.7 axios — and why teams reach for it

Everything so far used `fetch`, which is built in and fine. Most production codebases use **axios** instead, and it's worth knowing exactly what you're buying.

```bash
npm install axios
```

| | `fetch` | `axios` |
|---|---|---|
| Parses JSON | you call `await res.json()` | `res.data`, already parsed |
| Rejects on 404/500 | **no** — you must check `res.ok` | **yes** — it throws |
| Request body | `JSON.stringify` + `Content-Type` header by hand | pass an object |
| Base URL / shared headers | repeat them, or wrap it yourself | `axios.create({ baseURL })` |
| Interceptors | none | request *and* response hooks |
| Timeout | `AbortSignal.timeout()` | `timeout: 5000` |
| Upload/download progress | not really | `onUploadProgress` |
| Bundle cost | 0 KB | ~13 KB gzipped |

**The two that change how your code reads** are rows 2 and 5. Rejecting on 4xx/5xx means one `try`/`catch` instead of a `res.ok` check you'll eventually forget (§17.2's first bullet). Interceptors mean "attach the auth token" and "log the user out on 401" are written **once**, not in every call site.

The honest counter-argument: 13 KB and a dependency, for something the platform now does adequately. If your app makes five requests and has no auth, `fetch` is the right call.

### The typed call, and the trap in it

```ts
import axios from "axios"

const res = await axios.get<Task[]>("/api/tasks")
res.data        // Task[] — according to TypeScript
```

**That generic is a cast, not a check.** `axios.get<Task[]>` tells the compiler what to *expect*; nothing verifies it. It's `as Task[]` wearing nicer clothes, and it fails the same way §17.5 described — silently, far from the cause.

So the rule is unchanged, and now it's easy to forget because the code looks typed:

```ts
// ❌ looks safe, is a promise
const res = await axios.get<Task[]>("/api/tasks")
return res.data

// ✅ actually safe
const res = await axios.get("/api/tasks")
return TaskListSchema.parse(res.data)
```

Leave the generic off when you're going to validate. Passing both is just two claims about the same data, one of which is checked.

## 17.8 An instance, and interceptors

Never call `axios.get` directly from a component. Create one **instance** and put your cross-cutting concerns on it:

```ts
// src/api/client.ts
import axios from "axios"

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
  timeout: 8000,
  headers: { "Content-Type": "application/json" },
})

// ---- request: runs before every call ----
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ---- response: runs after every call ----
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token")
        window.location.assign("/login")
      }
      // Normalise to one Error shape so callers don't parse axios internals
      const message =
        (error.response?.data as { message?: string } | undefined)?.message ??
        error.message
      return Promise.reject(new ApiError(message, error.response?.status))
    }
    return Promise.reject(error)
  }
)

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message)
    this.name = "ApiError"
  }
}
```

Three things that earns you:

1. **Auth in one place.** Add a header to the instance and every request has it. With `fetch` you'd wrap it yourself — which is fine, and is essentially re-implementing this.
2. **One error shape.** Components catch `ApiError` and read `.message` and `.status`. They never touch `error.response?.data?.errors?.[0]?.detail`, which is the kind of expression that spreads through a codebase.
3. **Global 401 handling.** One rule, not one per call site.

### Typing the error path

`catch (err)` gives you `unknown` (§0.8.9), and axios provides the narrowing helper:

```ts
try {
  const res = await api.get("/tasks")
  return TaskListSchema.parse(res.data)
} catch (err) {
  if (err instanceof ApiError) {
    // our normalised shape, from the interceptor
    setError(`${err.status ?? ""} ${err.message}`.trim())
  } else if (axios.isAxiosError(err)) {
    // a call that bypassed the interceptor
    setError(err.message)
  } else if (err instanceof z.ZodError) {
    // the server sent something unexpected — a different class of bug
    setError("The server sent unexpected data")
  } else {
    setError("Something went wrong")
  }
}
```

Note the **three distinct failure modes**: the network/HTTP layer failed, the *shape* was wrong, or something else entirely. Collapsing them into one "error" string loses information you want in your logs — a 500 is the server's problem, a `ZodError` is a contract mismatch, and they need different responses.

### Cancellation is the same as `fetch`

axios v1 accepts an `AbortSignal`, so §17.3's race-condition fix is unchanged:

```ts
useEffect(() => {
  const controller = new AbortController()
  api.get("/tasks", { signal: controller.signal })
    .then((res) => setTasks(TaskListSchema.parse(res.data)))
    .catch((err) => { if (!axios.isCancel(err)) setError(String(err)) })
  return () => controller.abort()
}, [])
```

`axios.isCancel(err)` replaces the `err.name !== "AbortError"` check. Everything else about §17.3 applies verbatim — axios does not solve the race condition for you.

## 17.9 A typed API module

Put the calls in a module per resource, not in components. Each function does three things: make the request, validate the response, return domain data.

```ts
// src/api/tasks.ts
import { api } from "@/api/client"
import { TaskSchema, TaskListSchema, type NewTask, type Task } from "@/schemas/task"

export async function listTasks(signal?: AbortSignal): Promise<Task[]> {
  const res = await api.get("/tasks", { signal })
  return TaskListSchema.parse(res.data)
}

export async function createTask(input: NewTask): Promise<Task> {
  const res = await api.post("/tasks", input)     // body serialised for you
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

**Why this shape is worth the file:** components import `listTasks`, not axios. The URL, the HTTP verb, the validation and the error normalisation all live behind a function whose signature is pure domain language — `(signal?) => Promise<Task[]>`. Swap axios for `fetch`, or for a GraphQL client, and no component changes.

It's also the seam that makes testing easy: a component that takes `load: () => Promise<Task[]>` as a prop (§21's `TaskLoader`) needs no network mocking at all.

---

## 🧪 Lab 17.6 — axios vs `fetch`, side by side

**Level:** core

Both clients hitting the same mock, so the four differences are behaviour you can see rather than a table you read.

### The mock

axios needs something to talk to. Rather than a real server, give the instance a custom **adapter** — axios's own extension point, and a neat way to keep the lab offline.

Create `src/lab/mockAdapter.ts`:

```ts
import type { AxiosAdapter, AxiosRequestConfig } from "axios"

const db = [
  { id: "1", title: "Review the API contract", priority: "high", done: false },
  { id: "2", title: "Write the migration", priority: "medium", done: true },
]

export interface MockOptions {
  delay?: number
  /** Respond with this HTTP status instead of 200. */
  status?: number
  /** Return data of the wrong shape. */
  corrupt?: boolean
}

/** An axios adapter that answers from memory. Same contract as a real one. */
export function mockAdapter(opts: MockOptions = {}): AxiosAdapter {
  const { delay = 600, status = 200, corrupt = false } = opts

  return (config: AxiosRequestConfig) =>
    new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => {
        const response = {
          data: corrupt ? [{ id: 1, titel: "wrong shape" }] : db,
          status,
          statusText: status === 200 ? "OK" : "Error",
          headers: {},
          config: config as never,
        }
        // This is the behaviour that differs from fetch: axios REJECTS on 4xx/5xx
        if (status >= 400) {
          reject(
            Object.assign(new Error(`Request failed with status code ${status}`), {
              isAxiosError: true,
              response,
              config,
            })
          )
        } else {
          resolve(response as never)
        }
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

### The lab

Create `src/demos/17-fetching/AxiosVsFetchLab.tsx`:

```tsx
import { useState } from "react"
import axios from "axios"
import { Alert, Badge, Button, ButtonGroup, Card, Col, Form, Row, Table } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import LogPanel from "@/lab/LogPanel"
import { useEventLog } from "@/lab/useEventLog"
import { mockAdapter } from "@/lab/mockAdapter"

export default function AxiosVsFetchLab() {
  const { entries, log, clear } = useEventLog(30)
  const [status, setStatus] = useState(200)
  const [corrupt, setCorrupt] = useState(false)

  /** fetch: does NOT reject on 4xx/5xx, and needs an explicit json() step. */
  async function withFetch() {
    log(`— fetch, simulating HTTP ${status} —`)
    try {
      // The adapter isn't reachable from fetch, so simulate the same response here
      const res = new Response(JSON.stringify(corrupt ? [{ id: 1 }] : [{ id: "1" }]), {
        status,
        headers: { "Content-Type": "application/json" },
      })
      log(`fetch resolved. res.ok = ${res.ok}  ← it did NOT throw`)
      if (!res.ok) {
        log("you must check res.ok yourself, or carry on with an error page as data")
        throw new Error(`Request failed: ${res.status}`)
      }
      const data = await res.json()
      log(`parsed after an explicit res.json(): ${JSON.stringify(data).slice(0, 40)}`)
    } catch (err) {
      log(`caught: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  /** axios: rejects on 4xx/5xx, and data is already parsed. */
  async function withAxios() {
    log(`— axios, simulating HTTP ${status} —`)
    const client = axios.create({ adapter: mockAdapter({ status, corrupt, delay: 300 }) })
    try {
      const res = await client.get("/tasks")
      log(`resolved. res.data is already parsed: ${JSON.stringify(res.data).slice(0, 40)}`)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        log(`threw automatically. status = ${err.response?.status}  ← no res.ok needed`)
      } else {
        log(`caught: ${String(err)}`)
      }
    }
  }

  return (
    <DemoCard
      title="axios vs fetch"
      claim="The difference that changes your code is error handling: fetch resolves on a 500 and makes you check res.ok; axios rejects, so one try/catch covers it."
      level="core"
      notice={
        <ul className="mb-0">
          <li>
            Set the status to <strong>500</strong> and run both. <code>fetch</code> logs
            "resolved, res.ok = false" — <strong>it did not throw.</strong> Forget the check
            and you'll parse an error page as if it were data.
          </li>
          <li>
            <code>axios</code> throws on its own, so the failure lands in{" "}
            <code>catch</code> where you'd expect it.
          </li>
          <li>
            <code>fetch</code> needs <code>await res.json()</code>;{" "}
            <code>res.data</code> is already parsed. One less step, one less place to forget
            an <code>await</code>.
          </li>
          <li>
            The mock is an axios <strong>adapter</strong> — a function taking a config and
            returning a response. That's the whole interface, and it's why axios is easy to
            test against.
          </li>
          <li>
            <strong>Neither one validates anything.</strong>{" "}
            <code>axios.get&lt;Task[]&gt;()</code> is a cast, exactly like{" "}
            <code>as Task[]</code>. Turn on "corrupt" and note that both are perfectly happy.
          </li>
        </ul>
      }
    >
      <Row className="g-3 mb-3">
        <Col md={5}>
          <div className="small text-muted mb-1">simulated HTTP status</div>
          <ButtonGroup size="sm">
            {[200, 404, 500].map((s) => (
              <Button
                key={s}
                variant={status === s ? (s === 200 ? "success" : "danger") : "outline-secondary"}
                onClick={() => setStatus(s)}
              >
                {s}
              </Button>
            ))}
          </ButtonGroup>
        </Col>
        <Col md={4} className="d-flex align-items-end">
          <Form.Check
            type="switch"
            label="corrupt the response shape"
            checked={corrupt}
            onChange={(e) => setCorrupt(e.target.checked)}
          />
        </Col>
        <Col md={3} className="d-flex align-items-end gap-2">
          <Button size="sm" variant="outline-primary" onClick={() => void withFetch()}>
            fetch
          </Button>
          <Button size="sm" variant="primary" onClick={() => void withAxios()}>
            axios
          </Button>
        </Col>
      </Row>

      <Row className="g-3">
        <Col lg={7}>
          <LogPanel entries={entries} onClear={clear} height={280} title="What happened" />
        </Col>
        <Col lg={5}>
          <Table bordered size="sm" className="small mb-0">
            <thead className="table-light">
              <tr>
                <th>Behaviour</th>
                <th>fetch</th>
                <th>axios</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Rejects on 4xx/5xx</td><td>no</td><td><strong>yes</strong></td></tr>
              <tr><td>JSON parsing</td><td>manual</td><td>automatic</td></tr>
              <tr><td>Base URL / headers</td><td>DIY</td><td><code>create()</code></td></tr>
              <tr><td>Interceptors</td><td>none</td><td>yes</td></tr>
              <tr><td>Timeout</td><td><code>AbortSignal.timeout</code></td><td><code>timeout:</code></td></tr>
              <tr><td>Cancellation</td><td><code>AbortSignal</code></td><td><code>AbortSignal</code></td></tr>
              <tr className="table-warning"><td>Validates the shape</td><td>no</td><td><strong>no</strong></td></tr>
              <tr><td>Bundle cost</td><td>0 KB</td><td>~13 KB</td></tr>
            </tbody>
          </Table>
          <Alert variant="warning" className="small mt-2 mb-0">
            The last-but-one row is the one people get wrong.{" "}
            <code>axios.get&lt;T&gt;()</code> looks like validation and is a cast. Parse with
            zod (§17.5) either way.
          </Alert>
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "axios-vs-fetch", chapter: "17 — Fetching", title: "axios vs fetch", element: <AxiosVsFetchLab /> }`.

**Experiments:**

1. **Status 500, both buttons.** `fetch` resolves; axios rejects. Now imagine the `res.ok` check missing — you'd call `res.json()` on an HTML error page and get a parse error blaming the wrong thing.
2. **Turn on "corrupt" with status 200.** Both succeed. Add `TaskListSchema.parse(res.data)` to the axios branch and it fails properly, naming the field. **That's the point: axios is a transport, not a guarantee.**
3. **Add `client.get<Task[]>("/tasks")`** with the generic and hover `res.data`. It's `Task[]` — and with "corrupt" on, it's a lie. Compare with the `parse` version.
4. **Give the adapter a 3000ms delay and abort mid-flight** (`controller.abort()` from a button). `axios.isCancel(err)` is true. Same mechanics as §17.3 — axios doesn't fix races for you.

---

## 🧪 Lab 17.7 — An instance with interceptors

**Level:** depth

Create `src/demos/17-fetching/AxiosClientLab.tsx`:

```tsx
import { useState } from "react"
import axios, { type AxiosInstance } from "axios"
import { Badge, Button, Card, Col, Form, Row } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import LogPanel from "@/lab/LogPanel"
import { useEventLog } from "@/lab/useEventLog"
import { mockAdapter } from "@/lab/mockAdapter"

class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message)
    this.name = "ApiError"
  }
}

export default function AxiosClientLab() {
  const { entries, log, clear } = useEventLog(30)
  const [token, setToken] = useState("abc123")
  const [status, setStatus] = useState(200)

  /** Builds an instance with both interceptors attached. */
  function makeClient(): AxiosInstance {
    const client = axios.create({
      baseURL: "/api",
      timeout: 8000,
      adapter: mockAdapter({ status, delay: 300 }),
    })

    client.interceptors.request.use((config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
        log(`→ request interceptor attached: Bearer ${token.slice(0, 6)}…`)
      } else {
        log("→ request interceptor: no token, header omitted")
      }
      return config
    })

    client.interceptors.response.use(
      (response) => {
        log(`← response interceptor: ${response.status} passed through`)
        return response
      },
      (error) => {
        if (axios.isAxiosError(error)) {
          const code = error.response?.status
          if (code === 401) {
            log("← response interceptor: 401 → clearing token, would redirect to /login")
            setToken("")
          }
          log(`← response interceptor: normalising to ApiError(${code})`)
          return Promise.reject(new ApiError(error.message, code))
        }
        return Promise.reject(error)
      }
    )

    return client
  }

  async function call() {
    log(`— GET /api/tasks (simulating ${status}) —`)
    try {
      const res = await makeClient().get("/tasks")
      log(`✅ component sees ${Array.isArray(res.data) ? res.data.length : "?"} items`)
    } catch (err) {
      // The component only ever handles ONE error shape
      if (err instanceof ApiError) {
        log(`❌ component caught ApiError: "${err.message}" (status ${err.status})`)
      } else {
        log(`❌ component caught something else: ${String(err)}`)
      }
    }
  }

  return (
    <DemoCard
      title="An axios instance with interceptors"
      claim="Auth headers, 401 handling and error normalisation written once, on the instance — so components catch one error type and never touch axios internals."
      level="depth"
      notice={
        <ul className="mb-0">
          <li>
            Read the log bottom-up for one call: the <strong>request</strong> interceptor
            adds the header, the adapter answers, the <strong>response</strong> interceptor
            runs, and only then does the component's code see anything.
          </li>
          <li>
            Set the status to <strong>401</strong> and call. The interceptor clears the token
            and would redirect — <strong>one rule, not one per call site.</strong> Notice the
            token field empties itself.
          </li>
          <li>
            Every failure reaches the component as an <code>ApiError</code> with{" "}
            <code>.message</code> and <code>.status</code>. No component ever writes{" "}
            <code>error.response?.data?.errors?.[0]?.detail</code>.
          </li>
          <li>
            Clear the token and call: the header is omitted. That's the whole of "attach auth
            to every request" — four lines, in one file.
          </li>
          <li>
            In a real app the instance lives in <code>src/api/client.ts</code> and is created{" "}
            <strong>once</strong> at module scope. It's rebuilt per call here only so the
            switches work.
          </li>
        </ul>
      }
    >
      <Row className="g-3 mb-3">
        <Col md={5}>
          <Form.Group>
            <Form.Label className="small">
              token <Badge bg={token ? "success" : "secondary"}>{token ? "set" : "none"}</Badge>
            </Form.Label>
            <Form.Control size="sm" value={token} onChange={(e) => setToken(e.target.value)} />
          </Form.Group>
        </Col>
        <Col md={4}>
          <div className="small text-muted mb-1">simulated status</div>
          <div className="d-flex gap-1">
            {[200, 401, 500].map((s) => (
              <Button
                key={s}
                size="sm"
                variant={status === s ? "dark" : "outline-dark"}
                onClick={() => setStatus(s)}
              >
                {s}
              </Button>
            ))}
          </div>
        </Col>
        <Col md={3} className="d-flex align-items-end">
          <Button className="w-100" onClick={() => void call()}>
            GET /api/tasks
          </Button>
        </Col>
      </Row>

      <LogPanel entries={entries} onClear={clear} height={320} title="Interceptor order" />

      <Card body className="mt-3 small">
        <div className="fw-semibold mb-2">What belongs on the instance</div>
        <ul className="mb-0">
          <li><code>baseURL</code> — so call sites are paths, not URLs</li>
          <li><code>timeout</code> — a hung request is worse than a failed one</li>
          <li>Auth header — request interceptor</li>
          <li>401 → log out — response interceptor</li>
          <li>Error normalisation — response interceptor</li>
          <li>Retry with backoff on 5xx — response interceptor</li>
          <li><strong>Not</strong> validation. That belongs per-endpoint, with the schema that describes it.</li>
        </ul>
      </Card>
    </DemoCard>
  )
}
```

Register as `{ id: "axios-client", chapter: "17 — Fetching", title: "Instance & interceptors", element: <AxiosClientLab /> }`.

**Experiments:**

1. **Status 401.** Watch the interceptor clear the token. Then call again with no token — the request interceptor omits the header. That's a realistic auth loop in two hooks.
2. **Add a retry** to the response interceptor: on a 5xx, wait 500ms and re-issue `error.config` once. Then set status 500 and watch two requests in the log. Retry belongs here, not in components.
3. **Move validation into the response interceptor** (`TaskListSchema.parse(response.data)`). It works — and now *every* endpoint is validated against a task list, which is wrong. Validation is per-endpoint; that's why the last bullet above says so.
4. **Log `config.headers` in the adapter.** Confirm the `Authorization` header really arrived — interceptors mutate the config that the adapter receives.

---

✅ **Concept check 17**

1. Does `fetch` reject on a 500 response? What must you check?
2. Describe the race condition and both standard fixes.
3. Why is `err` typed `unknown` in a `catch` block?
4. What's the difference between `as Task[]` and `TaskSchema.parse()`?
5. What does "server state is not client state" mean in practice?
6. Name the two `axios` behaviours that most change how your code reads, versus `fetch`.
7. Is `axios.get<Task[]>(...)` a check or a claim? What should you do instead?
8. Which concerns belong on an axios *instance* rather than at a call site — and which one doesn't?
9. How do you cancel an axios request, and how do you tell a cancellation from a real error?

---

# 18. Routing

React has no built-in router. `react-router-dom` is the common choice.

```bash
npm install react-router-dom
```

```tsx
import { BrowserRouter, Routes, Route, Link, NavLink, useParams, Outlet } from "react-router-dom"
import { Navbar, Nav, Container } from "react-bootstrap"

function Layout() {
  return (
    <>
      <Navbar bg="light" expand="sm">
        <Container>
          <Nav>
            <Nav.Link as={NavLink} to="/" end>Board</Nav.Link>
            <Nav.Link as={NavLink} to="/settings">Settings</Nav.Link>
          </Nav>
        </Container>
      </Navbar>
      <Outlet />          {/* the matched child route renders here */}
    </>
  )
}

function TaskDetail() {
  const { id } = useParams<{ id: string }>()   // string | undefined
  return <p>Task {id}</p>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Board />} />
          <Route path="tasks/:id" element={<TaskDetail />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
```

## 18.1 The pieces

| Piece | Job |
|---|---|
| `BrowserRouter` | Provides routing context; wraps the app once |
| `Routes` / `Route` | Declare the URL → component mapping |
| `Outlet` | Where a parent route renders its matched child |
| `index` | The child that matches the parent's exact path |
| `Link` | Client-side navigation (no page reload) |
| `NavLink` | `Link` that knows whether it's active |
| `useParams` | Read `:id`-style URL segments |
| `useSearchParams` | Read/write the query string |
| `useNavigate` | Navigate from code |
| `useLocation` | The current path, search, hash and state |
| `path="*"` | Catch unmatched URLs — your 404 |

## 18.2 Two React-Bootstrap integration details

**`as={NavLink}`** is React-Bootstrap's polymorphic prop (§20.3). It renders `Nav.Link`'s Bootstrap styling using React Router's `NavLink` element, so you get correct styles **and** client-side navigation. Most React-Bootstrap components accept `as`, and it's fully typed: the target element's props become available, which is why `to` type-checks.

`NavLink` also applies an `active` class when it matches, and Bootstrap's `.nav-link.active` styling picks it up for free. Add `end` to stop `/` matching every path.

**Never use a plain `<a href>` for internal links.** It triggers a full page reload, throwing away all your state and re-downloading the bundle. `Link` and `NavLink` intercept the click and update history instead.

## 18.3 The URL is state too

This is the idea that matters most in this section. Filters, search terms, the active tab, sort order, pagination and the selected item are often **better in the query string** than in component state:

```tsx
const [searchParams, setSearchParams] = useSearchParams()

const filter = searchParams.get("filter") ?? "all"
const query = searchParams.get("q") ?? ""

function setFilter(next: string) {
  setSearchParams((prev) => {
    const updated = new URLSearchParams(prev)
    if (next === "all") updated.delete("filter")   // keep the URL clean
    else updated.set("filter", next)
    return updated
  })
}
```

What you get, for free and without writing any of it:

- **Shareable** — send someone a link to exactly what you're looking at.
- **Bookmarkable** — and it still works tomorrow.
- **Survives refresh** — no persistence code.
- **Back button works** — each change is a history entry (pass `{ replace: true }` when you don't want that, which is usually right for a search box).
- **One source of truth** — no risk of the URL and the UI disagreeing.

The costs are real but small: values are always strings (so you validate them — §8.4's type predicate, or zod), and every change re-renders the whole route subtree.

**Rule of thumb: if a user would reasonably want to share or bookmark this view, its state belongs in the URL.**

> **TS Note.** `useParams<{ id: string }>()` gives named params, but the values are `string | undefined` — a param can always be missing at runtime, however confident your route config makes you feel. Narrow before using it:
> ```tsx
> const { id } = useParams<{ id: string }>()
> if (!id) return <NotFound />
> ```

## 18.4 Code splitting routes

Routes are the natural code-splitting boundary, because a user who never visits Settings should never download it:

```tsx
import { lazy, Suspense } from "react"

const Settings = lazy(() => import("./pages/Settings"))

<Route
  path="settings"
  element={
    <Suspense fallback={<Spinner animation="border" />}>
      <Settings />
    </Suspense>
  }
/>
```

`lazy` takes a function returning a dynamic `import()`, and Vite automatically emits a separate chunk for it. Run `npm run build` and you'll see the extra file in the output. §19 covers `Suspense` properly.

## 18.5 Protected routes

A route guard is just a component that decides whether to render its children or redirect:

```tsx
import { Navigate, Outlet, useLocation } from "react-router-dom"

function RequireAuth() {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    // `state` carries where they were headed, so you can send them back after login
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return <Outlet />
}

// in the route tree:
<Route element={<RequireAuth />}>
  <Route path="settings" element={<Settings />} />
  <Route path="admin" element={<Admin />} />
</Route>
```

`replace` matters: without it, the redirect adds a history entry, so pressing Back sends the user to the protected page, which redirects again, and Back becomes unusable.

## 18.6 A note on data routers

React Router also offers a data-router API (`createBrowserRouter` with `loader` and `action` functions per route) which fetches data *before* rendering the route, eliminating the loading spinner cascade. It's a genuinely better architecture for data-heavy apps and it's where the library is heading.

Learn the component API first — it's what most existing code uses, and the concepts transfer directly.

---

## 🧪 Lab 18.1 — Replace the lab shell with a real router

**Level:** core

The exercise promised back in Part 0.5. You'll rebuild the demo shell's navigation with React Router, which is a much better way to learn routing than a hello-world app — you already understand exactly what the thing does.

```bash
npm install react-router-dom
```

Create `src/RouterApp.tsx`:

```tsx
import { Suspense } from "react"
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Outlet,
  useParams,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom"
import { Alert, Button, Container, Nav, Navbar, Row, Col, Spinner } from "react-bootstrap"
import { Beaker } from "react-bootstrap-icons"
import { demos, chapters } from "@/demos/registry"

/** The shared shell. Everything below it renders into <Outlet />. */
function Layout() {
  const location = useLocation()

  return (
    <div className="min-vh-100 bg-body-tertiary">
      <Navbar className="bg-white border-bottom py-3">
        <Container fluid className="px-4 d-flex align-items-center gap-2">
          <Beaker className="text-primary" size={22} />
          <span className="fw-semibold">React Lab</span>
          <span className="text-muted small ms-2 font-monospace">
            {location.pathname}
          </span>
        </Container>
      </Navbar>

      <Container fluid className="px-4 py-4">
        <Row className="g-4">
          <Col xs={12} lg={3}>
            <Nav className="flex-column bg-white border rounded-3 p-2">
              {chapters().map((chapter) => (
                <div key={chapter} className="mb-2">
                  <div className="text-uppercase text-muted small fw-semibold px-2 py-1">
                    {chapter}
                  </div>
                  {demos
                    .filter((demo) => demo.chapter === chapter)
                    .map((demo) => (
                      // `as={NavLink}` gives Bootstrap styling + client-side nav,
                      // and NavLink adds the `active` class automatically.
                      <Nav.Link
                        key={demo.id}
                        as={NavLink}
                        to={`/demo/${demo.id}`}
                        className="rounded-2 py-1 px-2 small"
                      >
                        {demo.title}
                      </Nav.Link>
                    ))}
                </div>
              ))}
            </Nav>
          </Col>

          <Col xs={12} lg={9}>
            <Suspense fallback={<Spinner animation="border" />}>
              <Outlet />
            </Suspense>
          </Col>
        </Row>
      </Container>
    </div>
  )
}

/** Reads :demoId from the URL and renders the matching demo. */
function DemoRoute() {
  const { demoId } = useParams<{ demoId: string }>()
  const navigate = useNavigate()

  // useParams values are string | undefined — narrow before use
  if (!demoId) return <Navigate to="/" replace />

  const demo = demos.find((d) => d.id === demoId)

  if (!demo) {
    return (
      <Alert variant="warning">
        <div className="fw-semibold mb-1">No demo called "{demoId}"</div>
        <p className="small mb-2">
          The URL didn't match any registered demo. This is a real 404 within the app.
        </p>
        <Button size="sm" variant="outline-secondary" onClick={() => navigate("/")}>
          Back to the first demo
        </Button>
      </Alert>
    )
  }

  return <>{demo.element}</>
}

function NotFound() {
  return (
    <Alert variant="danger">
      <div className="fw-semibold mb-1">404 — no such page</div>
      <p className="small mb-0">
        This is the <code>path="*"</code> route. Every router needs one.
      </p>
    </Alert>
  )
}

export default function RouterApp() {
  const first = demos[0]?.id

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          {/* index: matches the parent's exact path */}
          <Route
            index
            element={first ? <Navigate to={`/demo/${first}`} replace /> : <NotFound />}
          />
          <Route path="demo/:demoId" element={<DemoRoute />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
```

**Switch to it.** In `src/main.tsx`, replace `import App from "./App.tsx"` with:

```tsx
import App from "./RouterApp.tsx"
```

**Run it:**

```bash
npm run dev
```

**What to try, in order:**

1. Click through the sidebar. The URL is now `/demo/counter` rather than `#counter`, and the active link is highlighted — `NavLink` added the `active` class and Bootstrap styled it, with no code from you.
2. Press the **browser Back button**. It navigates between demos. History is free.
3. Copy a URL, open a new tab, paste it. It goes straight to that demo. So did the hash version — but now try `/demo/nonexistent` and you get a proper in-app 404 instead of a fallback message.
4. Visit `/nothing/here`. The `path="*"` route catches it.
5. Change `to={\`/demo/${demo.id}\`}` to `href={...}` on a plain `<a>`. Click it and watch the whole app reload — the network tab shows the bundle being fetched again. **That's what `Link` prevents.**

**Experiments:**

1. Add `end` to a `NavLink` pointing at `/`. Without `end`, a link to `/` is active on *every* page, because every path starts with `/`. This catches everyone once.
2. Add a nested route: `<Route path="demo/:demoId/notes" element={<Notes />} />` and give `DemoRoute` its own `<Outlet />`. Nesting is how shared layout works at any depth.
3. Wrap one demo in `lazy(() => import(...))` and run `npm run build`. Look at `dist/assets/` — there's now a separate chunk for it, downloaded only when visited.

> **Note.** If you'd rather keep the hash-based shell for the remaining labs, keep both files and switch the import in `main.tsx` whenever you like. Nothing else in the lab app depends on which shell is active.

---

## 🧪 Lab 18.2 — The URL as state

**Level:** depth

Create `src/demos/18-routing/UrlStateLab.tsx`:

```tsx
import { useSearchParams } from "react-router-dom"
import { Alert, Badge, Button, ButtonGroup, Card, Col, Form, ListGroup, Row } from "react-bootstrap"
import { useState } from "react"
import DemoCard from "@/lab/DemoCard"
import StateInspector from "@/lab/StateInspector"

type Filter = "all" | "active" | "done"
type Sort = "newest" | "title"

const isFilter = (v: string): v is Filter =>
  v === "all" || v === "active" || v === "done"
const isSort = (v: string): v is Sort => v === "newest" || v === "title"

interface Task {
  id: string
  title: string
  done: boolean
  createdAt: number
}

const tasks: Task[] = [
  { id: "1", title: "Audit the bundle", done: false, createdAt: 5 },
  { id: "2", title: "Write release notes", done: true, createdAt: 3 },
  { id: "3", title: "Fix the flaky test", done: true, createdAt: 7 },
  { id: "4", title: "Bump dependencies", done: false, createdAt: 1 },
]

export default function UrlStateLab() {
  const [params, setParams] = useSearchParams()

  // Read from the URL, validating because URL values are untrusted strings
  const rawFilter = params.get("filter") ?? "all"
  const filter: Filter = isFilter(rawFilter) ? rawFilter : "all"

  const rawSort = params.get("sort") ?? "newest"
  const sort: Sort = isSort(rawSort) ? rawSort : "newest"

  const query = params.get("q") ?? ""

  // The same state, but held locally — for comparison
  const [localFilter, setLocalFilter] = useState<Filter>("all")

  /** Update one param, omitting defaults to keep the URL tidy. */
  function update(key: string, value: string, isDefault: boolean, replace = false) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (isDefault) next.delete(key)
        else next.set(key, value)
        return next
      },
      { replace }
    )
  }

  const visible = tasks
    .filter((t) => (filter === "active" ? !t.done : filter === "done" ? t.done : true))
    .filter((t) => t.title.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => (sort === "title" ? a.title.localeCompare(b.title) : b.createdAt - a.createdAt))

  return (
    <DemoCard
      title="The URL as state"
      claim="Filters and search in the query string are shareable, bookmarkable, refresh-proof and Back-button-aware — none of which you have to implement."
      level="depth"
      notice={
        <ul className="mb-0">
          <li>
            Change the filter and sort. <strong>Watch the address bar.</strong> Then press
            Back — the previous view returns, because each change is a history entry.
          </li>
          <li>
            Copy the URL into a new tab. You land on exactly this view. Now refresh — still
            there. Compare with the local-state filter below, which resets both times.
          </li>
          <li>
            The search box uses <code>{"{ replace: true }"}</code>, so typing doesn't
            create a history entry per character. Without it, one Back press per keystroke.
            <strong>Choose push vs replace deliberately.</strong>
          </li>
          <li>
            URL values are <code>string</code> from an untrusted source, so both are run
            through a type predicate (§8.4). Try setting{" "}
            <code>?filter=banana</code> by hand — it falls back to "all" instead of
            corrupting state.
          </li>
          <li>
            Defaults are deleted rather than written, so the clean URL stays clean. A page
            whose default state has six query params looks broken to users.
          </li>
        </ul>
      }
    >
      <Row className="g-3 mb-3">
        <Col md={4}>
          <div className="small text-muted mb-1">filter (in the URL)</div>
          <ButtonGroup size="sm">
            {(["all", "active", "done"] as Filter[]).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "primary" : "outline-primary"}
                onClick={() => update("filter", f, f === "all")}
              >
                {f}
              </Button>
            ))}
          </ButtonGroup>
        </Col>

        <Col md={4}>
          <div className="small text-muted mb-1">sort (in the URL)</div>
          <ButtonGroup size="sm">
            {(["newest", "title"] as Sort[]).map((s) => (
              <Button
                key={s}
                variant={sort === s ? "primary" : "outline-primary"}
                onClick={() => update("sort", s, s === "newest")}
              >
                {s}
              </Button>
            ))}
          </ButtonGroup>
        </Col>

        <Col md={4}>
          <Form.Group>
            <Form.Label className="small text-muted mb-1">
              search (in the URL, with replace)
            </Form.Label>
            <Form.Control
              size="sm"
              value={query}
              onChange={(e) => update("q", e.target.value, e.target.value === "", true)}
              placeholder="filter by title"
            />
          </Form.Group>
        </Col>
      </Row>

      <Alert variant="light" className="border small">
        <div className="d-flex flex-wrap gap-3 align-items-center">
          <span>
            current query string:{" "}
            <code>{params.toString() ? `?${params.toString()}` : "(empty)"}</code>
          </span>
          <Button
            size="sm"
            variant="outline-secondary"
            onClick={() => setParams(new URLSearchParams(), { replace: true })}
          >
            Clear all params
          </Button>
        </div>
      </Alert>

      <Row className="g-3">
        <Col lg={7}>
          <Card>
            <Card.Header className="small fw-semibold d-flex justify-content-between">
              <span>Results</span>
              <Badge bg="secondary">{visible.length}</Badge>
            </Card.Header>
            <ListGroup variant="flush">
              {visible.length === 0 ? (
                <ListGroup.Item className="small text-muted">
                  Nothing matches.
                </ListGroup.Item>
              ) : (
                visible.map((task) => (
                  <ListGroup.Item key={task.id} className="small d-flex justify-content-between">
                    <span className={task.done ? "text-muted text-decoration-line-through" : ""}>
                      {task.title}
                    </span>
                    <span className="text-muted">day {task.createdAt}</span>
                  </ListGroup.Item>
                ))
              )}
            </ListGroup>
          </Card>
        </Col>

        <Col lg={5}>
          <StateInspector
            label="derived from URL"
            value={{ filter, sort, query, visible: visible.length }}
          />

          <Card body className="mt-3">
            <div className="small fw-semibold text-muted mb-2">
              The same filter, in local state
            </div>
            <ButtonGroup size="sm">
              {(["all", "active", "done"] as Filter[]).map((f) => (
                <Button
                  key={f}
                  variant={localFilter === f ? "secondary" : "outline-secondary"}
                  onClick={() => setLocalFilter(f)}
                >
                  {f}
                </Button>
              ))}
            </ButtonGroup>
            <div className="small text-muted mt-2">
              Not in the URL. Refresh, share, or press Back and it's gone.
            </div>
          </Card>
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "url-state", chapter: "18 — Routing", title: "URL as state", element: <UrlStateLab /> }`.

> This lab needs router context, so it only works under `RouterApp` (Lab 18.1). Under the hash shell, `useSearchParams` throws.

**Experiments:**

1. Remove `{ replace: true }` from the search box. Type six characters, then press Back six times. That's why search boxes replace rather than push.
2. Set `?filter=banana` in the address bar. The predicate rejects it and falls back cleanly. Now delete the predicate and use `as Filter` instead — the filter silently matches nothing and the list is empty with no explanation. **The URL is user input.**
3. Add pagination (`?page=2`). Note you have to decide what happens to `page` when the filter changes — almost certainly reset it to 1. That interaction is *visible* in the URL, which is one more reason to keep it there.

---

✅ **Concept check 18**

1. What does `Outlet` do, and what does it save you from repeating?
2. What happens if you use a plain `<a href="/settings">` for an internal link?
3. Name three things you get for free by putting a filter in the query string, and two costs.
4. When should a URL change push a history entry, and when should it replace one?
5. Why is `useParams<{ id: string }>()` still `string | undefined`?

Answers in [Appendix B](#appendix-b--concept-check-answers).

---

# 19. Error boundaries & Suspense

Two mechanisms for handling the two things that can go wrong while rendering: it **threw**, or it **isn't ready yet**.

## 19.1 Why you need an error boundary

By default, an uncaught error during render **unmounts your entire application** and leaves a blank white page. Not the broken component — the whole tree. In development you see React's error overlay; in production the user sees nothing at all.

An **error boundary** is a component that catches errors thrown by its descendants during render and shows a fallback instead. It's the React equivalent of `try`/`catch`, scoped to a subtree.

Error boundaries must currently be **class components**, because they rely on the `componentDidCatch` and `getDerivedStateFromError` lifecycle methods, which have no hook equivalent. This is the one place you'll still write a class:

```tsx
import { Component, type ErrorInfo, type ReactNode } from "react"

interface Props {
  children: ReactNode
  fallback: (error: Error, reset: () => void) => ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }          // render the fallback on the next render
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Report it. In production this is your Sentry/Rollbar call.
    console.error("Caught by boundary:", error, info.componentStack)
  }

  reset = () => this.setState({ error: null })

  render() {
    if (this.state.error) return this.props.fallback(this.state.error, this.reset)
    return this.props.children
  }
}
```

Or skip the class entirely and use `react-error-boundary`, which wraps this with a better API:

```bash
npm install react-error-boundary
```

```tsx
import { ErrorBoundary } from "react-error-boundary"

<ErrorBoundary
  fallbackRender={({ error, resetErrorBoundary }) => (
    <Alert variant="danger">
      {error.message}
      <Button onClick={resetErrorBoundary}>Try again</Button>
    </Alert>
  )}
  onError={(error, info) => reportToSentry(error, info)}
>
  <Board />
</ErrorBoundary>
```

## 19.2 What boundaries do and don't catch

| Error source | Caught? |
|---|---|
| Thrown during render | ✅ |
| Thrown in a lifecycle method / `useEffect` body | ✅ |
| Thrown in a constructor or initialiser | ✅ |
| Thrown in an **event handler** | ❌ |
| Rejected promise / `async` failure | ❌ |
| `setTimeout` callback | ❌ |
| Errors in the boundary's own render | ❌ (it propagates up) |

The two ❌s that matter: **event handlers and async code**. Nothing in a click handler or a `.then()` goes through a boundary, because they don't run during render. Handle those the ordinary way:

```tsx
async function handleSave() {
  try {
    await save(task)
  } catch (err) {
    setError(err instanceof Error ? err.message : "Save failed")
  }
}
```

If you *want* an async failure to reach a boundary, throw it during the next render — which is precisely what `useFetch`'s error state plus `if (state.status === "error") throw new Error(state.message)` would do, and what query libraries offer as a `throwOnError` option.

## 19.3 Where to put boundaries

**Granularity is the design decision.** One boundary at the root means any error blanks the whole app — better than nothing, but not much. The useful pattern is **layered**:

```tsx
<ErrorBoundary fallback={<FullPageError />}>          {/* last resort */}
  <Layout>
    <ErrorBoundary fallback={<PageError />}>          {/* per route */}
      <Route element={<Board />} />
    </ErrorBoundary>
    <ErrorBoundary fallback={<WidgetError />}>        {/* per risky widget */}
      <ThirdPartyChart />
    </ErrorBoundary>
  </Layout>
</ErrorBoundary>
```

Ask: **if this part fails, what should the user still be able to do?** If a sidebar chart breaks, the task list should still work. That answer determines where the boundary goes.

Also worth knowing: **a boundary resets when its `key` changes**, which is §4.3 again. That's how "try again" is often implemented — remount the subtree with a fresh key.

## 19.4 `Suspense`

`Suspense` handles the other case: the content isn't ready yet.

```tsx
const Settings = lazy(() => import("./pages/Settings"))

<Suspense fallback={<Spinner animation="border" />}>
  <Settings />
</Suspense>
```

While the lazy chunk is downloading, the fallback renders. When it arrives, the real component swaps in. No loading state in your component, no `isLoading` boolean.

Today the reliable use is **`lazy`-loaded components**. Data fetching with Suspense works too, but only through libraries that support it (TanStack Query's `useSuspenseQuery`, or a framework's data layer) — `fetch` in a `useEffect` does not participate.

`Suspense` and `ErrorBoundary` are complementary and usually paired: one handles "not yet", the other handles "it broke". A lazy chunk that fails to download needs both.

```tsx
<ErrorBoundary fallback={<Alert variant="danger">Couldn't load this section.</Alert>}>
  <Suspense fallback={<Spinner animation="border" />}>
    <Settings />
  </Suspense>
</ErrorBoundary>
```

---

## 🧪 Lab 19.1 — Error boundaries

**Level:** core

Create `src/lab/ErrorBoundary.tsx` (a harness component you'll reuse):

```tsx
import { Component, type ErrorInfo, type ReactNode } from "react"

interface Props {
  children: ReactNode
  fallback: (error: Error, reset: () => void) => ReactNode
  onError?: (error: Error, info: ErrorInfo) => void
}

interface State {
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info)
  }

  reset = () => this.setState({ error: null })

  render() {
    if (this.state.error) return this.props.fallback(this.state.error, this.reset)
    return this.props.children
  }
}
```

Create `src/demos/19-errors/ErrorBoundaryLab.tsx`:

```tsx
import { useState } from "react"
import { Alert, Badge, Button, Card, Col, Row } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import ErrorBoundary from "@/lab/ErrorBoundary"
import LogPanel from "@/lab/LogPanel"
import { useEventLog } from "@/lab/useEventLog"

/** Throws during render when told to. */
function RiskyWidget({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("RiskyWidget failed while rendering")
  }
  return (
    <Card body className="text-center border-success-subtle">
      <Badge bg="success">healthy</Badge>
      <div className="small text-muted mt-2">Rendering normally.</div>
    </Card>
  )
}

/** Throws in an event handler — NOT caught by a boundary. */
function HandlerThrower({ log }: { log: (m: string) => void }) {
  return (
    <Card body className="text-center">
      <Button
        variant="outline-warning"
        size="sm"
        onClick={() => {
          log("about to throw in a click handler…")
          throw new Error("Thrown in an event handler")
        }}
      >
        Throw in a handler
      </Button>
      <div className="small text-muted mt-2">
        Check the console — the boundary won't catch this.
      </div>
    </Card>
  )
}

/** Throws in an async callback — also NOT caught. */
function AsyncThrower({ log }: { log: (m: string) => void }) {
  const [error, setError] = useState<string | null>(null)

  async function run() {
    try {
      await new Promise((_, reject) =>
        setTimeout(() => reject(new Error("The request failed")), 400)
      )
    } catch (err) {
      // Caught the ordinary way, because a boundary never would
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      log(`caught async failure in try/catch: ${message}`)
    }
  }

  return (
    <Card body className="text-center">
      <Button variant="outline-primary" size="sm" onClick={() => void run()}>
        Fail asynchronously
      </Button>
      {error && (
        <Alert variant="danger" className="small mt-2 mb-0">
          {error}
        </Alert>
      )}
      <div className="small text-muted mt-2">
        Handled with <code>try/catch</code> — the correct tool here.
      </div>
    </Card>
  )
}

export default function ErrorBoundaryLab() {
  const [breakA, setBreakA] = useState(false)
  const [breakB, setBreakB] = useState(false)
  const { entries, log, clear } = useEventLog()

  return (
    <DemoCard
      title="Error boundaries"
      claim="An uncaught render error unmounts the whole app. A boundary contains it to a subtree — but it catches nothing from event handlers or promises."
      level="core"
      notice={
        <ul className="mb-0">
          <li>
            Press <strong>Break widget A</strong>. Only A's card is replaced by a fallback.
            Widget B keeps working, and so does the rest of the page —{" "}
            <strong>that containment is the point.</strong>
          </li>
          <li>
            Press <strong>Try again</strong> in the fallback. The boundary resets and, since
            the flag is still set, it throws again — a good reminder that resetting a
            boundary doesn't fix the cause.
          </li>
          <li>
            <strong>Throw in a handler</strong> does <em>not</em> reach the boundary. It
            surfaces in the console as an unhandled error. Handlers don't run during render,
            so boundaries can't see them.
          </li>
          <li>
            <strong>Fail asynchronously</strong> is the same story, handled properly with{" "}
            <code>try/catch</code> and an error state. That's the tool for async.
          </li>
          <li>
            In development you'll also see Vite's error overlay. Dismiss it — the boundary
            beneath is working. In production only your fallback appears.
          </li>
        </ul>
      }
    >
      <div className="d-flex flex-wrap gap-2 mb-3">
        <Button
          variant={breakA ? "danger" : "outline-danger"}
          size="sm"
          onClick={() => setBreakA((b) => !b)}
        >
          {breakA ? "Fix" : "Break"} widget A
        </Button>
        <Button
          variant={breakB ? "danger" : "outline-danger"}
          size="sm"
          onClick={() => setBreakB((b) => !b)}
        >
          {breakB ? "Fix" : "Break"} widget B
        </Button>
      </div>

      <Row className="g-3">
        <Col md={6}>
          <div className="small fw-semibold text-muted mb-2">
            Widget A — own boundary
          </div>
          <ErrorBoundary
            onError={(err) => log(`boundary A caught: ${err.message}`)}
            fallback={(error, reset) => (
              <Alert variant="danger" className="mb-0 small">
                <div className="fw-semibold mb-1">Widget A couldn't render</div>
                <div className="font-monospace mb-2">{error.message}</div>
                <Button size="sm" variant="outline-danger" onClick={reset}>
                  Try again
                </Button>
              </Alert>
            )}
          >
            <RiskyWidget shouldThrow={breakA} />
          </ErrorBoundary>
        </Col>

        <Col md={6}>
          <div className="small fw-semibold text-muted mb-2">
            Widget B — own boundary
          </div>
          <ErrorBoundary
            onError={(err) => log(`boundary B caught: ${err.message}`)}
            fallback={(error, reset) => (
              <Alert variant="danger" className="mb-0 small">
                <div className="fw-semibold mb-1">Widget B couldn't render</div>
                <div className="font-monospace mb-2">{error.message}</div>
                <Button size="sm" variant="outline-danger" onClick={reset}>
                  Try again
                </Button>
              </Alert>
            )}
          >
            <RiskyWidget shouldThrow={breakB} />
          </ErrorBoundary>
        </Col>

        <Col md={6}>
          <div className="small fw-semibold text-muted mb-2">
            Not caught: event handler
          </div>
          <ErrorBoundary
            fallback={() => <Alert variant="danger">unreachable</Alert>}
          >
            <HandlerThrower log={log} />
          </ErrorBoundary>
        </Col>

        <Col md={6}>
          <div className="small fw-semibold text-muted mb-2">
            Not caught: async — use try/catch
          </div>
          <ErrorBoundary
            fallback={() => <Alert variant="danger">unreachable</Alert>}
          >
            <AsyncThrower log={log} />
          </ErrorBoundary>
        </Col>

        <Col xs={12}>
          <LogPanel entries={entries} onClear={clear} height={160} title="Boundary log" />
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "error-boundary", chapter: "19 — Errors", title: "Error boundaries", element: <ErrorBoundaryLab /> }`.

**Experiments:**

1. Remove both boundaries and break a widget. The entire lab app disappears — a blank page. **That's the default behaviour**, and it's the reason boundaries exist.
2. Move to one boundary wrapping both widgets. Breaking A now takes B down with it. Granularity is a product decision: what should still work when this fails?
3. Give the boundary a `key={breakA ? "broken" : "ok"}`. It resets automatically when the flag changes, no `reset` needed — §4.3 again.
4. Install `react-error-boundary` and swap the class for its `<ErrorBoundary fallbackRender={…}>`. Same behaviour, no class, plus `useErrorBoundary()` for throwing async errors into it deliberately.

---

## 🧪 Lab 19.2 — `Suspense` and `lazy`

**Level:** depth

Create `src/demos/19-errors/HeavyPanel.tsx`:

```tsx
import { Badge, Card } from "react-bootstrap"
import { measure, slowSum } from "@/lab/slow"

/** A component in its own chunk, loaded on demand. */
export default function HeavyPanel() {
  const { ms } = measure(() => slowSum(2_000_000))
  return (
    <Card body className="border-primary-subtle">
      <Badge bg="primary" className="mb-2">
        loaded from a separate chunk
      </Badge>
      <div className="small">
        This module was downloaded only when you asked for it. Rendered in{" "}
        <strong>{ms}ms</strong>.
      </div>
      <div className="small text-muted mt-2">
        Run <code>npm run build</code> and look in <code>dist/assets/</code> — there's a
        file just for this component.
      </div>
    </Card>
  )
}
```

Create `src/demos/19-errors/SuspenseLab.tsx`:

```tsx
import { lazy, Suspense, useState } from "react"
import { Alert, Button, Card, Col, Placeholder, Row, Spinner } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import ErrorBoundary from "@/lab/ErrorBoundary"

// The dynamic import is what tells the bundler to split here.
const HeavyPanel = lazy(() => import("@/demos/19-errors/HeavyPanel"))

// A lazy import that will fail, to show the boundary + Suspense pair.
const BrokenPanel = lazy(
  () =>
    new Promise<{ default: React.ComponentType }>((_, reject) =>
      setTimeout(() => reject(new Error("Failed to fetch dynamically imported module")), 700)
    )
)

export default function SuspenseLab() {
  const [showHeavy, setShowHeavy] = useState(false)
  const [showBroken, setShowBroken] = useState(false)

  return (
    <DemoCard
      title="Suspense and lazy"
      claim="Suspense handles 'not ready yet'; an error boundary handles 'it broke'. Lazy-loaded routes need both."
      level="depth"
      notice={
        <ul className="mb-0">
          <li>
            Press <strong>Load the heavy panel</strong> and watch the fallback appear while
            the chunk downloads. Throttle the network in DevTools (Network → Slow 3G) to see
            it properly.
          </li>
          <li>
            Open the Network tab before pressing. A new <code>.js</code> file is requested
            at that moment — <strong>code that was never downloaded until needed.</strong>
          </li>
          <li>
            The fallback is a <code>Placeholder</code> skeleton rather than a spinner.
            Skeletons that mirror the eventual layout feel faster, because the page doesn't
            jump when content arrives.
          </li>
          <li>
            Press <strong>Load the broken panel</strong>. Suspense shows its fallback, then
            the import rejects and the <em>error boundary</em> takes over. Two mechanisms,
            two jobs, one nested pair.
          </li>
          <li>
            The second load of the heavy panel is instant — the chunk is cached. Toggle it
            off and on to confirm.
          </li>
        </ul>
      }
    >
      <Row className="g-3">
        <Col lg={6}>
          <Card body className="h-100">
            <div className="small fw-semibold text-muted mb-2">
              A lazy chunk that loads
            </div>
            <Button
              size="sm"
              className="mb-3"
              onClick={() => setShowHeavy((s) => !s)}
            >
              {showHeavy ? "Unload" : "Load"} the heavy panel
            </Button>

            {showHeavy && (
              <ErrorBoundary
                fallback={(error) => (
                  <Alert variant="danger" className="small mb-0">
                    {error.message}
                  </Alert>
                )}
              >
                <Suspense
                  fallback={
                    <Card body>
                      <Placeholder as="div" animation="glow">
                        <Placeholder xs={4} size="sm" />
                        <Placeholder xs={12} size="sm" />
                        <Placeholder xs={8} size="sm" />
                      </Placeholder>
                    </Card>
                  }
                >
                  <HeavyPanel />
                </Suspense>
              </ErrorBoundary>
            )}
          </Card>
        </Col>

        <Col lg={6}>
          <Card body className="h-100">
            <div className="small fw-semibold text-muted mb-2">
              A lazy chunk that fails
            </div>
            <Button
              size="sm"
              variant="outline-danger"
              className="mb-3"
              onClick={() => setShowBroken((s) => !s)}
            >
              {showBroken ? "Unload" : "Load"} the broken panel
            </Button>

            {showBroken && (
              <ErrorBoundary
                fallback={(error, reset) => (
                  <Alert variant="danger" className="small mb-0">
                    <div className="fw-semibold mb-1">Couldn't load that section</div>
                    <div className="font-monospace mb-2">{error.message}</div>
                    <Button size="sm" variant="outline-danger" onClick={reset}>
                      Retry
                    </Button>
                  </Alert>
                )}
              >
                <Suspense
                  fallback={
                    <div className="d-flex align-items-center gap-2 small text-muted">
                      <Spinner animation="border" size="sm" /> Downloading…
                    </div>
                  }
                >
                  <BrokenPanel />
                </Suspense>
              </ErrorBoundary>
            )}
          </Card>
        </Col>
      </Row>

      <Alert variant="light" className="border small mt-3 mb-0">
        <div className="fw-semibold mb-1">Where to split</div>
        Routes first (§18.4), then genuinely heavy widgets — a rich text editor, a charting
        library, a map, a PDF viewer. Splitting small components adds requests without
        saving meaningful bytes.
      </Alert>
    </DemoCard>
  )
}
```

Register as `{ id: "suspense", chapter: "19 — Errors", title: "Suspense & lazy", element: <SuspenseLab /> }`.

✅ **Concept check 19**

1. What happens by default when a component throws during render?
2. Name two error sources a boundary does **not** catch, and how you handle each.
3. Why must an error boundary be a class component?
4. How do you reset an error boundary, and what are the two ways?
5. What's the difference in job between `Suspense` and `ErrorBoundary`?

---

# 20. Composition patterns

Four patterns for building components other people (including future you) can use without reading the source. They're what React-Bootstrap itself is made of, so recognising them also makes the library legible.

## 20.1 Compound components

A parent that shares implicit state with a set of related children, via Context:

```tsx
<Accordion>
  <Accordion.Item value="a">
    <Accordion.Trigger>Section A</Accordion.Trigger>
    <Accordion.Panel>Content A</Accordion.Panel>
  </Accordion.Item>
</Accordion>
```

No `openItems` array threaded through props, no `renderTrigger` callbacks. The children find their state through context, and the consumer arranges them freely — wrap a trigger in a `<div>`, put two panels in one item, add a custom header between them; it all works because nothing depends on structure.

The mechanics:

```tsx
interface AccordionContextValue {
  openValue: string | null
  toggle: (value: string) => void
}

const AccordionContext = createContext<AccordionContextValue | null>(null)

function useAccordion() {
  const ctx = useContext(AccordionContext)
  if (!ctx) throw new Error("Accordion parts must be used inside <Accordion>")
  return ctx
}

function Accordion({ children }: { children: ReactNode }) { /* provides */ }
function Trigger({ children }: { children: ReactNode }) { /* consumes */ }

// Attach the parts as properties for a discoverable API
Accordion.Item = Item
Accordion.Trigger = Trigger
Accordion.Panel = Panel
```

Attaching parts as static properties (`Accordion.Trigger`) is the convention: typing `Accordion.` in your editor lists everything that goes inside. It's the same reason `Card.Header` exists rather than `CardHeader`.

**Use when:** several components must cooperate, and the consumer needs layout freedom. Tabs, accordions, menus, dialogs, form fields, toolbars.

**Cost:** more files, and errors when parts are used outside the parent — which is why the wrapper hook's throw (§14.1) matters even more here.

## 20.2 Render props and headless components

Give the consumer the *behaviour* and let them supply the *markup*, by passing a function as a prop or as `children`:

```tsx
interface ToggleProps {
  children: (state: { on: boolean; toggle: () => void }) => ReactNode
}

function Toggle({ children }: ToggleProps) {
  const [on, setOn] = useState(false)
  return <>{children({ on, toggle: () => setOn((v) => !v) })}</>
}

<Toggle>
  {({ on, toggle }) => (
    <Button variant={on ? "success" : "secondary"} onClick={toggle}>
      {on ? "On" : "Off"}
    </Button>
  )}
</Toggle>
```

**In modern React, a custom hook is usually better.** `const [on, toggle] = useToggle()` does the same job with less nesting and no callback-in-JSX. Reach for render props specifically when:

- The behaviour must **wrap** the markup — a drag-and-drop area, a measured container, a virtualised list that decides *which* children exist.
- You're writing for consumers who can't call hooks in the right place.
- You need the same component to render structurally different things (a list vs a table) from one behaviour.

`react-window`, `react-dropzone` and the older `Downshift` are render-prop libraries for exactly these reasons. **"Headless" components** are the same idea with a hook: `useCombobox` gives you the props to spread, you supply every element.

## 20.3 Polymorphic components (`as`)

One component, any underlying element:

```tsx
<Nav.Link as={NavLink} to="/settings">Settings</Nav.Link>
<Button as="a" href="/docs">Docs</Button>
<Card as="section">…</Card>
```

React-Bootstrap uses this everywhere. It solves a real problem: `Nav.Link`'s *styling* and `NavLink`'s *behaviour* are orthogonal, and without `as` you'd have to choose.

Writing one yourself, typed properly, is genuinely fiddly — the props must change with `as`:

```tsx
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react"

type TextProps<T extends ElementType> = {
  as?: T
  tone?: "default" | "muted" | "danger"
  children: ReactNode
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children">

function Text<T extends ElementType = "span">({
  as,
  tone = "default",
  children,
  ...rest
}: TextProps<T>) {
  const Component = as ?? "span"
  const toneClass = tone === "muted" ? "text-muted" : tone === "danger" ? "text-danger" : ""
  return <Component className={toneClass} {...rest}>{children}</Component>
}

<Text>plain span</Text>
<Text as="h2" tone="muted">a heading</Text>
<Text as="a" href="/x">a link — href only type-checks because as="a"</Text>
<Text as="span" href="/x" />   // ❌ span has no href
```

`Omit<..., "as" | "children">` prevents the element's own conflicting props from clashing with ours. Use this pattern sparingly — it's the most complex typing in this document, and a simple `variant` prop covers most needs. But recognising it is essential, because every component library you use is built on it.

## 20.4 Choosing between them

| You want to… | Use |
|---|---|
| Let the consumer arrange several cooperating parts | Compound components |
| Reuse stateful logic across different markup | A **custom hook** |
| Reuse behaviour that must wrap or control the markup | Render props / headless |
| Let the consumer choose the underlying element | Polymorphic `as` |
| Let the consumer drop in arbitrary content | `children` / `ReactNode` slots (§3.4) |

**Start with `children` and a custom hook.** Reach for the others when those genuinely can't express what you need — most components never do.

---

## 🧪 Lab 20.1 — Compound components

**Level:** depth

Create `src/demos/20-patterns/Tabs.tsx`:

```tsx
import {
  createContext,
  useContext,
  useId,
  useState,
  type ReactNode,
} from "react"

// ---- the shared, implicit state ----

interface TabsContextValue {
  active: string
  setActive: (value: string) => void
  baseId: string
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabs(): TabsContextValue {
  const ctx = useContext(TabsContext)
  if (!ctx) {
    throw new Error("Tabs.* components must be used inside <Tabs>")
  }
  return ctx
}

// ---- the parent ----

interface TabsProps {
  defaultValue: string
  children: ReactNode
  /** Controlled mode, following §9.3's convention. */
  value?: string
  onChange?: (value: string) => void
}

function Tabs({ defaultValue, value, onChange, children }: TabsProps) {
  const [internal, setInternal] = useState(defaultValue)
  const baseId = useId()

  const isControlled = value !== undefined
  const active = isControlled ? value : internal

  function setActive(next: string) {
    if (!isControlled) setInternal(next)
    onChange?.(next)
  }

  return (
    <TabsContext.Provider value={{ active, setActive, baseId }}>
      <div>{children}</div>
    </TabsContext.Provider>
  )
}

// ---- the parts ----

function List({ children }: { children: ReactNode }) {
  return (
    <ul className="nav nav-tabs" role="tablist">
      {children}
    </ul>
  )
}

function Tab({ value, children }: { value: string; children: ReactNode }) {
  const { active, setActive, baseId } = useTabs()
  const selected = active === value

  return (
    <li className="nav-item" role="presentation">
      <button
        type="button"
        role="tab"
        id={`${baseId}-tab-${value}`}
        aria-selected={selected}
        aria-controls={`${baseId}-panel-${value}`}
        className={`nav-link ${selected ? "active" : ""}`}
        onClick={() => setActive(value)}
      >
        {children}
      </button>
    </li>
  )
}

function Panel({ value, children }: { value: string; children: ReactNode }) {
  const { active, baseId } = useTabs()
  if (active !== value) return null

  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      className="border border-top-0 rounded-bottom p-3 bg-white"
    >
      {children}
    </div>
  )
}

/** A part that reads the state for its own purposes. */
function ActiveLabel() {
  const { active } = useTabs()
  return <span className="badge bg-secondary">{active}</span>
}

// Attach the parts, so `Tabs.` autocompletes the whole API.
Tabs.List = List
Tabs.Tab = Tab
Tabs.Panel = Panel
Tabs.ActiveLabel = ActiveLabel

export default Tabs
```

Create `src/demos/20-patterns/CompoundLab.tsx`:

```tsx
import { useState } from "react"
import { Alert, Button, Card, Col, Row } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import Tabs from "@/demos/20-patterns/Tabs"

/** Rendered outside <Tabs> on purpose, to show the guard. */
function OrphanTab() {
  try {
    return <Tabs.Tab value="x">orphan</Tabs.Tab>
  } catch (err) {
    return (
      <Alert variant="danger" className="small mb-0">
        {err instanceof Error ? err.message : String(err)}
      </Alert>
    )
  }
}

export default function CompoundLab() {
  const [controlled, setControlled] = useState("overview")
  const [showOrphan, setShowOrphan] = useState(false)

  return (
    <DemoCard
      title="Compound components"
      claim="Parts share state through context instead of props, so the consumer arranges the markup however they like — and the parent's API stays three props wide."
      level="depth"
      notice={
        <ul className="mb-0">
          <li>
            <code>Tabs.Tab</code> and <code>Tabs.Panel</code> take no state props. They find
            the active value through context, which is why you can reorder them, wrap them,
            or add unrelated markup between them.
          </li>
          <li>
            The second example puts a heading and a badge <em>inside</em> the tab list.
            A <code>{"<Tabs items={[…]} />"}</code> API could not express that without a new
            prop — §3.4's argument, at component-library scale.
          </li>
          <li>
            <code>Tabs.ActiveLabel</code> is a part that only <em>reads</em> the shared
            state. Adding new parts requires no changes to the parent.
          </li>
          <li>
            The third example is <strong>controlled</strong>: the parent owns the active tab
            and external buttons can change it. Same component, §9.3's dual-mode pattern.
          </li>
          <li>
            <code>useId()</code> generates the <code>aria-controls</code>/
            <code>aria-labelledby</code> pairs, so two <code>Tabs</code> on one page don't
            collide. Accessibility is where compound components really pay off — the parts
            can wire themselves together.
          </li>
        </ul>
      }
    >
      <Row className="g-4">
        <Col xs={12}>
          <div className="small fw-semibold text-muted mb-2">
            1 — the ordinary arrangement
          </div>
          <Tabs defaultValue="overview">
            <Tabs.List>
              <Tabs.Tab value="overview">Overview</Tabs.Tab>
              <Tabs.Tab value="activity">Activity</Tabs.Tab>
              <Tabs.Tab value="settings">Settings</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="overview">
              <p className="small mb-0">The overview panel.</p>
            </Tabs.Panel>
            <Tabs.Panel value="activity">
              <p className="small mb-0">Recent activity would go here.</p>
            </Tabs.Panel>
            <Tabs.Panel value="settings">
              <p className="small mb-0">Settings for this thing.</p>
            </Tabs.Panel>
          </Tabs>
        </Col>

        <Col xs={12}>
          <div className="small fw-semibold text-muted mb-2">
            2 — a layout the component author never anticipated
          </div>
          <Tabs defaultValue="b">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="fw-semibold small">Custom header</span>
              <Tabs.ActiveLabel />
            </div>
            <Tabs.List>
              <Tabs.Tab value="a">First</Tabs.Tab>
              <Tabs.Tab value="b">Second</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="a">
              <Card body className="small">
                A card inside a panel.
              </Card>
            </Tabs.Panel>
            <Tabs.Panel value="b">
              <Alert variant="info" className="small mb-0">
                Arbitrary content, no new props.
              </Alert>
            </Tabs.Panel>
          </Tabs>
        </Col>

        <Col xs={12}>
          <div className="small fw-semibold text-muted mb-2">
            3 — controlled from outside
          </div>
          <div className="d-flex gap-2 mb-2">
            {["overview", "activity"].map((v) => (
              <Button
                key={v}
                size="sm"
                variant="outline-primary"
                onClick={() => setControlled(v)}
              >
                Go to {v}
              </Button>
            ))}
            <span className="small text-muted align-self-center">
              parent state: <code>{controlled}</code>
            </span>
          </div>
          <Tabs defaultValue="overview" value={controlled} onChange={setControlled}>
            <Tabs.List>
              <Tabs.Tab value="overview">Overview</Tabs.Tab>
              <Tabs.Tab value="activity">Activity</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="overview">
              <p className="small mb-0">Controlled overview.</p>
            </Tabs.Panel>
            <Tabs.Panel value="activity">
              <p className="small mb-0">Controlled activity.</p>
            </Tabs.Panel>
          </Tabs>
        </Col>

        <Col xs={12}>
          <Button
            size="sm"
            variant="outline-danger"
            onClick={() => setShowOrphan((s) => !s)}
          >
            Render a part outside &lt;Tabs&gt;
          </Button>
          {showOrphan && (
            <div className="mt-2">
              <OrphanTab />
            </div>
          )}
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "compound", chapter: "20 — Patterns", title: "Compound components", element: <CompoundLab /> }`.

**Experiments:**

1. Add a `Tabs.Count` part that shows how many tabs exist. You'll find you need the parent to *know* about its tabs, which context alone doesn't give you — the usual solution is a registration effect. Notice where the pattern's limits are.
2. Remove the throw from `useTabs` and render the orphan. You get a null-property crash inside `Tab`, blaming the wrong component.
3. Try writing the same API as `<Tabs items={[{ value, label, content }]} />`. It's shorter for case 1 and cannot express case 2 at all. That trade — terse for the common case, impossible for the uncommon one — is the choice compound components reject.

---

## 🧪 Lab 20.2 — Render props vs a custom hook

**Level:** depth

Create `src/demos/20-patterns/RenderPropsLab.tsx`:

```tsx
import { useCallback, useEffect, useState, type ReactNode } from "react"
import { Badge, Card, Col, ListGroup, Row, Table } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"

// ================= the behaviour, as a hook =================

function useMousePosition(target: HTMLElement | null) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (!target) return
    function handleMove(e: MouseEvent) {
      const rect = target!.getBoundingClientRect()
      setPos({
        x: Math.round(e.clientX - rect.left),
        y: Math.round(e.clientY - rect.top),
      })
    }
    function handleLeave() {
      setPos(null)
    }
    target.addEventListener("mousemove", handleMove)
    target.addEventListener("mouseleave", handleLeave)
    return () => {
      target.removeEventListener("mousemove", handleMove)
      target.removeEventListener("mouseleave", handleLeave)
    }
  }, [target])

  return pos
}

// ================= the same behaviour, as a render prop =================

interface MouseTrackerProps {
  /** children is a FUNCTION, called with the current state. */
  children: (pos: { x: number; y: number } | null) => ReactNode
  className?: string
}

/**
 * Render props earn their place here: the component must OWN the element
 * that the listeners attach to, and hand its state back to the consumer.
 */
function MouseTracker({ children, className }: MouseTrackerProps) {
  const [node, setNode] = useState<HTMLDivElement | null>(null)
  const pos = useMousePosition(node)

  return (
    <div ref={setNode} className={className}>
      {children(pos)}
    </div>
  )
}

// ================= a generic list renderer =================

interface DataListProps<T> {
  items: T[]
  keyOf: (item: T) => string
  /** The consumer decides what a row looks like. */
  renderItem: (item: T, index: number) => ReactNode
  renderEmpty?: () => ReactNode
}

function DataList<T>({ items, keyOf, renderItem, renderEmpty }: DataListProps<T>) {
  if (items.length === 0) {
    return <>{renderEmpty?.() ?? <div className="small text-muted">Nothing here.</div>}</>
  }
  return (
    <>
      {items.map((item, i) => (
        <div key={keyOf(item)}>{renderItem(item, i)}</div>
      ))}
    </>
  )
}

interface Person {
  id: string
  name: string
  role: string
}

const people: Person[] = [
  { id: "p1", name: "Ada Lovelace", role: "Engineer" },
  { id: "p2", name: "Grace Hopper", role: "Admiral" },
]

export default function RenderPropsLab() {
  const [hookNode, setHookNode] = useState<HTMLDivElement | null>(null)
  const hookPos = useMousePosition(hookNode)

  return (
    <DemoCard
      title="Render props vs a custom hook"
      claim="A hook is the better default. Render props win when the component must own the element or decide which children exist at all."
      level="depth"
      notice={
        <ul className="mb-0">
          <li>
            Move your mouse over both boxes. Identical behaviour, two APIs. The hook version
            needs a ref and a state variable in the consumer; the render-prop version hands
            the value straight to the markup.
          </li>
          <li>
            <strong>Note the render-prop version owns its <code>&lt;div&gt;</code>.</strong>
            That's when the pattern earns its place: the consumer can't be trusted to attach
            the listeners to the right element, so the component does it.
          </li>
          <li>
            <code>DataList&lt;T&gt;</code> shows the other legitimate case: the same
            behaviour rendering structurally different markup — a card list and a table row
            — from one generic component.
          </li>
          <li>
            The generic <code>&lt;T&gt;</code> flows into <code>renderItem</code>, so{" "}
            <code>item</code> is fully typed inside the callback with no annotation. Generic
            components are where render props and TypeScript work best together.
          </li>
          <li>
            For most reusable logic, <strong>prefer the hook</strong>. Callbacks inside JSX
            get hard to read three levels deep — which is why render props fell out of
            fashion when hooks arrived.
          </li>
        </ul>
      }
    >
      <Row className="g-3">
        <Col md={6}>
          <div className="small fw-semibold text-muted mb-2">
            A — a custom hook (consumer owns the element)
          </div>
          <div
            ref={setHookNode}
            className="border border-2 rounded-3 bg-white d-flex align-items-center justify-content-center"
            style={{ height: 140 }}
          >
            {hookPos ? (
              <Badge bg="primary" className="font-monospace">
                {hookPos.x}, {hookPos.y}
              </Badge>
            ) : (
              <span className="small text-muted">move your mouse here</span>
            )}
          </div>
        </Col>

        <Col md={6}>
          <div className="small fw-semibold text-muted mb-2">
            B — a render prop (component owns the element)
          </div>
          <MouseTracker className="border border-2 rounded-3 bg-white d-flex align-items-center justify-content-center" >
            {(pos) => (
              <div style={{ height: 140 }} className="d-flex align-items-center">
                {pos ? (
                  <Badge bg="success" className="font-monospace">
                    {pos.x}, {pos.y}
                  </Badge>
                ) : (
                  <span className="small text-muted">move your mouse here</span>
                )}
              </div>
            )}
          </MouseTracker>
        </Col>

        <Col md={6}>
          <div className="small fw-semibold text-muted mb-2">
            C — one generic component, rendered as cards
          </div>
          <DataList
            items={people}
            keyOf={(p) => p.id}
            renderItem={(person) => (
              <Card body className="mb-2">
                <div className="fw-semibold small">{person.name}</div>
                <div className="small text-muted">{person.role}</div>
              </Card>
            )}
          />
        </Col>

        <Col md={6}>
          <div className="small fw-semibold text-muted mb-2">
            D — the same component, rendered as a table
          </div>
          <Table bordered size="sm" className="small mb-0">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              <DataList
                items={people}
                keyOf={(p) => p.id}
                renderItem={(person, i) => (
                  <tr>
                    <td>{i + 1}</td>
                    <td>{person.name}</td>
                    <td>{person.role}</td>
                  </tr>
                )}
                renderEmpty={() => (
                  <tr>
                    <td colSpan={3} className="text-muted">
                      No people.
                    </td>
                  </tr>
                )}
              />
            </tbody>
          </Table>
          <div className="small text-muted mt-2">
            Note: <code>DataList</code> wraps each item in a <code>div</code>, which isn't
            valid inside <code>tbody</code>. Try fixing it with a{" "}
            <code>Fragment</code> — see experiment 3.
          </div>
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "render-props", chapter: "20 — Patterns", title: "Render props vs hooks", element: <RenderPropsLab /> }`.

**Experiments:**

1. Hover `renderItem`'s `person` parameter in example D. It's `Person`, inferred from `items` through the generic. Change `items` to a different array type and the callback's parameter type follows — no annotation anywhere.
2. Convert `MouseTracker` to accept `children: ReactNode` instead of a function. It can no longer pass the position down, and you're back to a hook plus a ref in the consumer. That's the mechanical difference between the two patterns.
3. Fix the table case: replace `<div key={…}>` in `DataList` with `<Fragment key={…}>`. The invalid `div`-inside-`tbody` disappears. A generic renderer shouldn't impose a wrapper element — this is §4.2's fragment rule showing up in library design.

---

✅ **Concept check 20**

1. Which pattern lets a consumer arrange several cooperating parts however they like?
2. For reusing stateful logic, what should you reach for first — and when is a render prop the better answer?
3. What problem does the polymorphic `as` prop solve?
4. Why attach parts as static properties (`Tabs.Tab`) rather than exporting them separately?
5. Which two patterns should you try before any of the others?

Answers in [Appendix B](#appendix-b--concept-check-answers).

---

# 21. Testing

You already wrote the highest-value tests in the document — Lab 13.4's reducer tests, which need no renderer at all. This section adds component and hook testing, and, just as importantly, a view on what not to bother testing.

## 21.1 Setup

```bash
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

Add to **`vite.config.ts`**:

```ts
import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
    css: false,          // don't process Bootstrap's CSS in tests — it's not needed
  },
})
```

If TypeScript complains about the `test` key, add `/// <reference types="vitest/config" />` at the top of the file.

Create `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

// Unmount everything between tests so they can't affect each other
afterEach(() => {
  cleanup()
})
```

Add the scripts to `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:ui": "vitest --ui"
  }
}
```

`npm test` runs in watch mode, which is how you'll use it while writing. `npm run test:run` runs once and exits, which is what CI wants.

## 21.2 The one principle

**Test what the user experiences, not how the component is built.**

```tsx
// ❌ tests implementation — breaks when you rename state or restructure JSX
expect(component.state.tasks).toHaveLength(3)
expect(wrapper.find(".task-card-title").text()).toBe("Buy milk")

// ✅ tests behaviour — survives any refactor that preserves behaviour
await user.type(screen.getByLabelText("Task"), "Buy milk")
await user.click(screen.getByRole("button", { name: "Add" }))
expect(screen.getByText("Buy milk")).toBeInTheDocument()
```

The practical consequence: a good test suite lets you rewrite a component's internals — `useState` to `useReducer`, props to context, class to function — **without touching a single test**. That is exactly the kind of refactor the build guide's later steps perform, and tests written this way would have proved those refactors were faithful.

If a test breaks every time you refactor, it's testing the wrong thing, and it's costing you more than it's giving you.

## 21.3 Queries, in order of preference

Testing Library's query priority is a genuinely useful design constraint, not bureaucracy: **the queries it prefers are the ones that only work if your markup is accessible.**

| Priority | Query | Finds |
|---|---|---|
| 1 | `getByRole("button", { name: "Save" })` | Elements by their accessibility role and label |
| 2 | `getByLabelText("Email")` | Form fields by their `<label>` |
| 3 | `getByPlaceholderText("Search")` | Inputs by placeholder |
| 4 | `getByText("No tasks yet")` | Any element by its text |
| 5 | `getByDisplayValue("Ada")` | Inputs by their current value |
| last | `getByTestId("task-card")` | An explicit `data-testid` escape hatch |

If you can't find a button by its role and accessible name, a screen-reader user can't find it either. **A test that's hard to write against accessible queries is telling you about a real bug.** That's a much better reason to follow the priority than "the docs say so".

Three variants of every query, and the difference matters:

| Prefix | If not found | Use for |
|---|---|---|
| `getBy…` | **throws** | Something that must be there now |
| `queryBy…` | returns `null` | Asserting absence: `expect(queryByText(…)).not.toBeInTheDocument()` |
| `findBy…` | **waits**, then throws | Something that appears asynchronously (returns a promise) |

Using `getBy` to assert absence throws before your assertion runs. Using `getBy` for async content fails because it checks too early. Both are common beginner mistakes with confusing failure messages.

## 21.4 `userEvent`, not `fireEvent`

```tsx
import userEvent from "@testing-library/user-event"

const user = userEvent.setup()
await user.click(button)
await user.type(input, "Hello")
await user.selectOptions(select, "high")
await user.keyboard("{Enter}")
await user.tab()
```

`fireEvent.click()` dispatches one synthetic event. `user.click()` does what a real click does: hover, mouse down, focus, mouse up, click — and it respects `pointer-events: none` and `disabled`. **It catches bugs `fireEvent` cannot**, particularly around focus and disabled states.

Always `await` it, and always call `userEvent.setup()` once per test.

## 21.5 What to test, and what not to

| Test | Don't test |
|---|---|
| Reducers and pure functions (best value/effort in the codebase) | That Bootstrap renders a card |
| Validation logic | Exact class names |
| Component behaviour: interact, assert what changed | Internal state variable names |
| Conditional rendering: all branches including empty and error | That `useState` was called |
| Custom hooks with real logic | Third-party library internals |
| Accessible names and labels | Pixel-perfect styling (use visual regression tools) |
| The bug you just fixed (a regression test) | Every prop permutation |

Two rules of thumb worth holding onto:

- **Write the test that would have caught the bug you just fixed.** That's the test with the highest proven value, because you have evidence the failure mode is real.
- **Coverage percentage is a weak signal.** One good test of the reducer beats twenty snapshot tests of markup that nobody reads when they fail.

---

## 🧪 Lab 21.1 — Testing a component's behaviour

**Level:** core

Test something with real logic. Create `src/demos/21-testing/TaskForm.tsx`:

```tsx
import { useState } from "react"
import { Button, Form } from "react-bootstrap"

export type Priority = "low" | "medium" | "high"

export interface NewTask {
  title: string
  priority: Priority
}

interface TaskFormProps {
  onAdd: (task: NewTask) => void
  /** Titles that already exist, for duplicate detection. */
  existingTitles?: string[]
}

export default function TaskForm({ onAdd, existingTitles = [] }: TaskFormProps) {
  const [title, setTitle] = useState("")
  const [priority, setPriority] = useState<Priority>("medium")
  const [error, setError] = useState("")

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmed = title.trim()

    if (!trimmed) {
      setError("Give the task a title.")
      return
    }
    if (trimmed.length > 60) {
      setError("Keep the title under 60 characters.")
      return
    }
    if (existingTitles.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setError("That task already exists.")
      return
    }

    onAdd({ title: trimmed, priority })
    setTitle("")
    setPriority("medium")
    setError("")
  }

  return (
    <Form onSubmit={handleSubmit} noValidate>
      <Form.Group controlId="task-title" className="mb-2">
        <Form.Label>Task</Form.Label>
        <Form.Control
          value={title}
          isInvalid={Boolean(error)}
          placeholder="What needs doing?"
          onChange={(e) => {
            setTitle(e.target.value)
            if (error) setError("")
          }}
        />
        <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
      </Form.Group>

      <Form.Group controlId="task-priority" className="mb-3">
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

      <Button type="submit">Add task</Button>
    </Form>
  )
}
```

Create `src/demos/21-testing/TaskForm.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import TaskForm from "./TaskForm"

describe("TaskForm", () => {
  it("submits the trimmed title and chosen priority", async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    render(<TaskForm onAdd={onAdd} />)

    // Found by its label, exactly as a screen-reader user would
    await user.type(screen.getByLabelText("Task"), "  Buy milk  ")
    await user.selectOptions(screen.getByLabelText("Priority"), "high")
    await user.click(screen.getByRole("button", { name: "Add task" }))

    expect(onAdd).toHaveBeenCalledTimes(1)
    expect(onAdd).toHaveBeenCalledWith({ title: "Buy milk", priority: "high" })
  })

  it("rejects an empty title and does not call onAdd", async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    render(<TaskForm onAdd={onAdd} />)

    await user.click(screen.getByRole("button", { name: "Add task" }))

    expect(screen.getByText("Give the task a title.")).toBeInTheDocument()
    expect(onAdd).not.toHaveBeenCalled()
  })

  it("rejects a whitespace-only title", async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    render(<TaskForm onAdd={onAdd} />)

    await user.type(screen.getByLabelText("Task"), "     ")
    await user.click(screen.getByRole("button", { name: "Add task" }))

    expect(onAdd).not.toHaveBeenCalled()
  })

  it("rejects a duplicate title, case-insensitively", async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    render(<TaskForm onAdd={onAdd} existingTitles={["Buy Milk"]} />)

    await user.type(screen.getByLabelText("Task"), "buy milk")
    await user.click(screen.getByRole("button", { name: "Add task" }))

    expect(screen.getByText("That task already exists.")).toBeInTheDocument()
    expect(onAdd).not.toHaveBeenCalled()
  })

  it("clears the error as soon as the user types", async () => {
    const user = userEvent.setup()
    render(<TaskForm onAdd={vi.fn()} />)

    await user.click(screen.getByRole("button", { name: "Add task" }))
    expect(screen.getByText("Give the task a title.")).toBeInTheDocument()

    await user.type(screen.getByLabelText("Task"), "a")

    // queryBy — because we're asserting ABSENCE. getBy would throw.
    expect(screen.queryByText("Give the task a title.")).not.toBeInTheDocument()
  })

  it("resets the form after a successful submit", async () => {
    const user = userEvent.setup()
    render(<TaskForm onAdd={vi.fn()} />)

    const input = screen.getByLabelText("Task")
    await user.type(input, "Something")
    await user.selectOptions(screen.getByLabelText("Priority"), "low")
    await user.click(screen.getByRole("button", { name: "Add task" }))

    expect(input).toHaveValue("")
    expect(screen.getByLabelText("Priority")).toHaveValue("medium")
  })

  it("submits on Enter", async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    render(<TaskForm onAdd={onAdd} />)

    await user.type(screen.getByLabelText("Task"), "Via keyboard{Enter}")

    expect(onAdd).toHaveBeenCalledWith({ title: "Via keyboard", priority: "medium" })
  })
})
```

**Run it:**

```bash
npm test
```

Seven tests covering every branch of the validation, and **not one of them mentions `useState`, a class name, or a DOM structure.** Rewrite `TaskForm` with `useReducer` tomorrow and they all still pass.

Four details worth internalising:

- **`getByLabelText("Task")` works only because of `controlId`** on `Form.Group` (§8.6). Remove it and the test fails — the test is enforcing an accessibility feature.
- **`getByRole("button", { name: "Add task" })`** finds the button the way assistive technology does. If someone replaces it with a `<div onClick>`, this test fails, which is correct.
- **`vi.fn()`** is Vitest's mock function. `toHaveBeenCalledWith` asserts the exact payload, which is how you test a callback prop's contract without rendering a parent.
- **The Enter test** passes because it's a real `<form>` with `onSubmit`. Had it been a `<div>` with a click handler, this test would fail — again, the test catching a real usability problem.

**Experiments:**

1. Change the button's text to "Create". Exactly one test line needs updating, and the failure message tells you which. Now imagine a test suite keyed on `.btn-primary` and how it would fail.
2. Refactor `TaskForm` internals to `useReducer`. Run the tests. All pass, untouched. **That's what behaviour-based testing buys you.**
3. Remove `controlId` from the title `Form.Group`. Two tests fail with "Unable to find a label with the text of: Task". Fix it by adding the `controlId` back rather than by switching to `getByPlaceholderText` — the test found a real defect.
4. Add a `data-testid` and write a test using `getByTestId`. It works, and it tests nothing about whether a user could operate the form. That's why it's last on the priority list.

---

## 🧪 Lab 21.2 — Testing hooks and async behaviour

**Level:** depth

Create `src/demos/21-testing/useCounter.ts`:

```ts
import { useCallback, useState } from "react"

interface Options {
  min?: number
  max?: number
  step?: number
}

export function useCounter(initial = 0, { min = 0, max = 10, step = 1 }: Options = {}) {
  const [count, setCount] = useState(() => Math.min(max, Math.max(min, initial)))

  const increment = useCallback(
    () => setCount((c) => Math.min(max, c + step)),
    [max, step]
  )
  const decrement = useCallback(
    () => setCount((c) => Math.max(min, c - step)),
    [min, step]
  )
  const reset = useCallback(() => setCount(initial), [initial])

  return {
    count,
    increment,
    decrement,
    reset,
    atMax: count >= max,
    atMin: count <= min,
  }
}
```

Create `src/demos/21-testing/useCounter.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { act, renderHook } from "@testing-library/react"
import { useCounter } from "./useCounter"

describe("useCounter", () => {
  it("starts at the initial value", () => {
    const { result } = renderHook(() => useCounter(3))
    expect(result.current.count).toBe(3)
  })

  it("clamps the initial value into range", () => {
    expect(renderHook(() => useCounter(99, { max: 10 })).result.current.count).toBe(10)
    expect(renderHook(() => useCounter(-5, { min: 0 })).result.current.count).toBe(0)
  })

  it("increments and decrements by the step", () => {
    const { result } = renderHook(() => useCounter(0, { step: 3 }))

    // act() wraps anything that causes a state update
    act(() => result.current.increment())
    expect(result.current.count).toBe(3)

    act(() => result.current.increment())
    expect(result.current.count).toBe(6)

    act(() => result.current.decrement())
    expect(result.current.count).toBe(3)
  })

  it("does not exceed max or go below min", () => {
    const { result } = renderHook(() => useCounter(9, { max: 10 }))

    act(() => result.current.increment())
    act(() => result.current.increment())
    act(() => result.current.increment())

    expect(result.current.count).toBe(10)
    expect(result.current.atMax).toBe(true)
  })

  it("derives atMin and atMax rather than storing them", () => {
    const { result } = renderHook(() => useCounter(0, { min: 0, max: 2 }))
    expect(result.current.atMin).toBe(true)
    expect(result.current.atMax).toBe(false)

    act(() => result.current.increment())
    expect(result.current.atMin).toBe(false)
    expect(result.current.atMax).toBe(false)

    act(() => result.current.increment())
    expect(result.current.atMax).toBe(true)
  })

  it("resets to the initial value", () => {
    const { result } = renderHook(() => useCounter(4))
    act(() => result.current.increment())
    act(() => result.current.reset())
    expect(result.current.count).toBe(4)
  })

  it("keeps a stable increment reference across re-renders", () => {
    const { result, rerender } = renderHook(() => useCounter(0))
    const first = result.current.increment
    rerender()
    expect(result.current.increment).toBe(first)   // toBe = reference equality
  })
})
```

Now an async component. Create `src/demos/21-testing/TaskLoader.tsx`:

```tsx
import { useEffect, useState } from "react"
import { Alert, ListGroup, Spinner } from "react-bootstrap"

export interface Task {
  id: string
  title: string
}

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; tasks: Task[] }

interface TaskLoaderProps {
  load: () => Promise<Task[]>
}

export default function TaskLoader({ load }: TaskLoaderProps) {
  const [state, setState] = useState<State>({ status: "loading" })

  useEffect(() => {
    let ignore = false
    load()
      .then((tasks) => {
        if (!ignore) setState({ status: "success", tasks })
      })
      .catch((err: unknown) => {
        if (ignore) return
        setState({
          status: "error",
          message: err instanceof Error ? err.message : "Something went wrong",
        })
      })
    return () => {
      ignore = true
    }
  }, [load])

  if (state.status === "loading") {
    return (
      <div role="status" aria-live="polite">
        <Spinner animation="border" size="sm" /> Loading tasks…
      </div>
    )
  }

  if (state.status === "error") {
    return <Alert variant="danger">{state.message}</Alert>
  }

  if (state.tasks.length === 0) {
    return <p>No tasks yet.</p>
  }

  return (
    <ListGroup>
      {state.tasks.map((task) => (
        <ListGroup.Item key={task.id}>{task.title}</ListGroup.Item>
      ))}
    </ListGroup>
  )
}
```

Create `src/demos/21-testing/TaskLoader.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import TaskLoader, { type Task } from "./TaskLoader"

const tasks: Task[] = [
  { id: "1", title: "First task" },
  { id: "2", title: "Second task" },
]

describe("TaskLoader", () => {
  it("shows a loading state, then the tasks", async () => {
    const load = vi.fn(() => Promise.resolve(tasks))
    render(<TaskLoader load={load} />)

    // Present immediately
    expect(screen.getByRole("status")).toHaveTextContent("Loading tasks…")

    // findBy… WAITS for the element to appear. getBy would fail here.
    expect(await screen.findByText("First task")).toBeInTheDocument()
    expect(screen.getByText("Second task")).toBeInTheDocument()

    // And the loading state is gone
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  it("shows the empty state when there are no tasks", async () => {
    render(<TaskLoader load={() => Promise.resolve([])} />)
    expect(await screen.findByText("No tasks yet.")).toBeInTheDocument()
  })

  it("shows the error message when loading fails", async () => {
    const load = () => Promise.reject(new Error("Request failed: 503"))
    render(<TaskLoader load={load} />)

    expect(await screen.findByText("Request failed: 503")).toBeInTheDocument()
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  it("handles a non-Error rejection", async () => {
    const load = () => Promise.reject("just a string")
    render(<TaskLoader load={load} />)
    expect(await screen.findByText("Something went wrong")).toBeInTheDocument()
  })
})
```

**Run it:** `npm test`

Four things this teaches:

- **`renderHook` + `act`** is how you test a hook without a component. `act()` wraps anything causing a state update, so React finishes rendering before your assertion runs. Forget it and you get a warning plus a stale value.
- **`findBy…` waits; `getBy…` doesn't.** Every "my async test fails but the app works" question is this distinction.
- **`load` is a prop, so there's nothing to mock.** No `vi.mock`, no fetch interception, no network. **Injecting the dependency made the component trivially testable** — a design decision that pays off in the test file.
- **The non-Error rejection test** covers the `err instanceof Error` branch from §0.8.9. That branch exists because JavaScript can throw anything, and this test proves the fallback works.

**Experiments:**

1. Change `findByText` to `getByText` in the first async test. It fails: the element isn't there yet. Read the error message — it's the one you'll meet most often when starting out.
2. Remove `act()` from the hook tests. You get "An update to TestComponent inside a test was not wrapped in act(...)" and the counter reads its old value.
3. Add a test proving the `ignore` cleanup works: render, unmount immediately, resolve the promise, and assert no warning. This is Lab 17.2's fix, verified.

✅ **Concept check 21**

1. What's the difference between testing behaviour and testing implementation, and why does it matter for refactoring?
2. When do you use `getBy`, `queryBy`, and `findBy`?
3. Why does Testing Library prefer `getByRole` over `getByTestId`?
4. What does `act()` do, and when do you need it?
5. Name two things worth testing and two things not worth testing in a React codebase.

---

# 22. Redux Toolkit

You already know how to do this. A Redux store is §13's reducer, moved outside the component tree and reached with §14's transport — and Redux Toolkit's job is to remove the boilerplate that made classic Redux notorious.

Read §13 and §14 first. If a discriminated-union action and a `switch` that returns new state feel familiar, this section is mostly new vocabulary for a pattern you've already built.

## 22.1 When Redux is the right answer — and when it isn't

Context (§14) is a *transport*: it gets a value from an ancestor to a descendant. The state still lives in a `useState` or `useReducer` in the provider, and **every consumer re-renders when the value changes**, because Context has no selector mechanism (§14.2).

That's the ceiling Redux is built to break:

| You need | Context + reducer | Redux Toolkit |
|---|---|---|
| Share state down a tree | ✅ | ✅ |
| Subscribe to *part* of the state | ❌ every consumer re-renders | ✅ `useSelector` |
| Read or write state outside React | ❌ awkward | ✅ `store.getState()` |
| Time-travel debugging | ❌ | ✅ DevTools |
| One convention across many teams | ❌ each feature invents its own | ✅ slices |
| Middleware (logging, persistence, retries) | ❌ DIY | ✅ built in |

**When not to reach for it:**

- **Server data.** A cache of something that lives elsewhere wants TanStack Query or RTK Query, not a hand-managed slice (§17.6). This is the most common Redux mistake.
- **Form state.** That belongs in the form (§8.4). Putting a draft in a global store means every keystroke is a global action.
- **Small apps.** Three pieces of shared state don't need a store, a slice file and typed hooks.
- **State one subtree uses.** Keep it local (§9.1). Global is not a synonym for convenient.

The honest summary: **Redux is a good answer to "many features, many people, complex client state, and we need to agree on how to do it".** It's a poor answer to "I have to pass this down three levels".

## 22.2 The three pieces

```bash
npm install @reduxjs/toolkit react-redux
```

### A slice — §13's reducer, with the boilerplate removed

```ts
// src/store/tasksSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { Task } from "@/schemas/task"

const initialState: Task[] = []

const tasksSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    added(state, action: PayloadAction<Task>) {
      state.push(action.payload)            // ← looks like mutation. It isn't. See 22.3.
    },
    toggled(state, action: PayloadAction<string>) {
      const task = state.find((t) => t.id === action.payload)
      if (task) task.done = !task.done
    },
    updated(state, action: PayloadAction<{ id: string; changes: Partial<Task> }>) {
      const task = state.find((t) => t.id === action.payload.id)
      if (task) Object.assign(task, action.payload.changes)
    },
    deleted(state, action: PayloadAction<string>) {
      return state.filter((t) => t.id !== action.payload)   // returning also works
    },
    clearedCompleted(state) {
      return state.filter((t) => !t.done)
    },
  },
})

export const { added, toggled, updated, deleted, clearedCompleted } = tasksSlice.actions
export default tasksSlice.reducer
```

Compare with §13's `tasksReducer`. The `switch`, the action-type union, the `never` exhaustiveness check and the action objects are all **generated**: `createSlice` derives an action creator per reducer key, and `added(task)` returns `{ type: "tasks/added", payload: task }`. You write the transitions; the wiring is inferred.

### A store

```ts
// src/store/index.ts
import { configureStore } from "@reduxjs/toolkit"
import tasksReducer from "@/store/tasksSlice"

export const store = configureStore({
  reducer: {
    tasks: tasksReducer,
  },
})

// The two types everything else needs
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```

`configureStore` gives you Redux DevTools, `redux-thunk`, and development-only checks for accidental mutation and non-serialisable values — all of which used to be manual setup.

### Typed hooks — write these once, never use the raw ones

```ts
// src/store/hooks.ts
import { useDispatch, useSelector } from "react-redux"
import type { RootState, AppDispatch } from "@/store"

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
```

**This file is not optional.** The raw `useSelector` types `state` as `unknown`, so every call site would need an annotation; the raw `useDispatch` doesn't know about thunks. Export the pre-typed versions and forbid the originals — a lint rule banning `react-redux`'s `useSelector` is common and worth it.

> **Older codebases** write these by hand with `TypedUseSelectorHook<RootState>`. `withTypes` is the current form and does the same thing with less ceremony.

### Provide and consume

```tsx
// main.tsx
import { Provider } from "react-redux"
import { store } from "@/store"

<Provider store={store}>
  <App />
</Provider>
```

```tsx
function TaskList() {
  const tasks = useAppSelector((s) => s.tasks)      // subscribes to THIS slice
  const dispatch = useAppDispatch()

  return tasks.map((t) => (
    <TaskCard key={t.id} task={t} onToggle={() => dispatch(toggled(t.id))} />
  ))
}
```

That's the whole API surface for most work: `useAppSelector` to read, `useAppDispatch` to write.

## 22.3 Immer: why `state.push()` is allowed here

§6.4 said never mutate state. `createSlice` appears to break that rule on every line, and it doesn't — RTK wraps every reducer in **Immer**, which hands you a *draft proxy* rather than the real state. Your mutations are recorded against the draft, and Immer produces a new immutable object from them.

```ts
// Inside createSlice, these are equivalent:
added(state, action) { state.push(action.payload) }                    // draft mutation
added(state, action) { return [...state, action.payload] }             // explicit copy
```

Two rules keep this working, and breaking them is the commonest RTK bug:

**1. Mutate the draft, or return a new value — never both.**

```ts
// ❌ Immer throws: you can't both modify the draft and return something
toggled(state, action) {
  state.push(x)
  return state.filter(…)
}
```

**2. Don't mutate anything that isn't the draft.** The proxy only tracks the state it gave you. Mutating a captured outer object, or something from `action.payload`, produces exactly the §6.4 bug the library is protecting you from.

**Where the rule still applies unchanged:** in selectors, in components, in `extraReducers` on state you didn't receive as a draft — and anywhere outside a `createSlice` reducer. Immer is a local convenience, not a change of principle.

## 22.4 Selectors, and the re-render you came for

`useSelector` runs your function on every store change and re-renders **only if the result changed** (by `===`). That's the mechanism §14.3 wanted and Context couldn't provide.

Which means the same reference-identity trap as §16.2 applies:

```tsx
// ❌ new array every time → re-renders on every store change, forever
const done = useAppSelector((s) => s.tasks.filter((t) => t.done))

// ✅ a primitive — changes only when the count changes
const doneCount = useAppSelector((s) => s.tasks.filter((t) => t.done).length)

// ✅ or memoise the derivation
import { createSelector } from "@reduxjs/toolkit"
const selectDone = createSelector(
  [(s: RootState) => s.tasks],
  (tasks) => tasks.filter((t) => t.done)      // recomputed only when tasks changes
)
const done = useAppSelector(selectDone)

// ✅ or opt into shallow comparison
import { useShallow } from "react-redux"       // react-redux v9
const { total, done } = useAppSelector(useShallow((s) => ({
  total: s.tasks.length,
  done: s.tasks.filter((t) => t.done).length,
})))
```

**Select the narrowest thing you can, and prefer primitives.** `useAppSelector(s => s.tasks)` in a component that only needs the count subscribes it to every task edit in the app.

**Where to put selectors.** Colocate them with their slice and export them, so components don't know the state shape:

```ts
// in tasksSlice.ts
export const selectTasks = (s: RootState) => s.tasks
export const selectTaskCount = (s: RootState) => s.tasks.length
export const selectTaskById = (id: string) => (s: RootState) =>
  s.tasks.find((t) => t.id === id)
```

Now `s.tasks` appears in one file. Reshape the state later and the components don't change — the same argument as §10.2's "store the id, derive the object".

## 22.5 Async with `createAsyncThunk`

A thunk is an action that's a function. `createAsyncThunk` generates one plus three action types — `pending`, `fulfilled`, `rejected` — which you handle in `extraReducers`:

```ts
export const fetchTasks = createAsyncThunk(
  "tasks/fetch",
  async (_arg, { signal, rejectWithValue }) => {
    try {
      const res = await api.get("/tasks", { signal })   // §17.8's instance
      return TaskListSchema.parse(res.data)             // §17.5's validation
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : "Request failed")
    }
  }
)

interface TasksState {
  items: Task[]
  status: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
}

const tasksSlice = createSlice({
  name: "tasks",
  initialState: { items: [], status: "idle", error: null } as TasksState,
  reducers: { /* the synchronous ones */ },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.items = action.payload
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.status = "failed"
        state.error = (action.payload as string) ?? "Request failed"
      })
  },
})
```

Three things to notice:

- **`status` is a union, not booleans.** §5.3's argument, in a store. `"loading" | "succeeded" | "failed"` can't be both.
- **`signal` is provided**, so `dispatch(fetchTasks()).abort()` cancels — §17.3's race-condition fix, built in.
- **Validation belongs in the thunk**, at the boundary, before anything reaches the store. A store full of unvalidated API data is §17.5's bug with global reach.

**And the caveat worth repeating:** if this thunk is all your slice does, you're hand-rolling a cache. **RTK Query** (`createApi`) generates the whole thing — fetching, caching, invalidation, loading flags, hooks — from an endpoint definition. Reach for it before writing a third `createAsyncThunk`.

## 22.6 Choosing between the three

| | Context + reducer | Redux Toolkit | Zustand (§23) |
|---|---|---|---|
| Setup cost | none | store + slices + typed hooks | one `create()` call |
| Selective subscription | ❌ | ✅ | ✅ |
| Outside React | ❌ | ✅ | ✅ |
| DevTools / time travel | ❌ | ✅ best in class | ✅ via middleware |
| Convention for a big team | ❌ | ✅ its main selling point | partial |
| Boilerplate | lowest | highest | low |
| Good for server data | ❌ | RTK Query, yes | ❌ use a query library |

**In practice:** Context for theme/locale/auth-user. Zustand when you want a store without ceremony. Redux Toolkit when the app is large, several people touch the state, and having *one* documented way to do things is worth the files. A query library for anything that came from a server, whichever of the three you chose.

---

## 🧪 Lab 22.1 — A store, a slice, and typed hooks

**Level:** core

The whole of Redux Toolkit's setup, once. Everything after this is more slices.

```bash
npm install @reduxjs/toolkit react-redux
```

### The change

**1. Create `src/store/counterSlice.ts`:**

```ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface CounterState {
  value: number
  step: number
  history: number[]
}

const initialState: CounterState = { value: 0, step: 1, history: [0] }

const counterSlice = createSlice({
  name: "counter",
  initialState,
  reducers: {
    incremented(state) {
      state.value = Math.min(100, state.value + state.step)   // Immer draft
      state.history.push(state.value)
    },
    decremented(state) {
      state.value = Math.max(0, state.value - state.step)
      state.history.push(state.value)
    },
    stepChanged(state, action: PayloadAction<number>) {
      state.step = action.payload
    },
    reset() {
      return initialState                                     // or return a value
    },
  },
})

export const { incremented, decremented, stepChanged, reset } = counterSlice.actions

// Selectors live with the slice, so components never touch the state shape
export const selectValue = (s: { counter: CounterState }) => s.counter.value
export const selectStep = (s: { counter: CounterState }) => s.counter.step

export default counterSlice.reducer
```

**2. Create `src/store/index.ts`:**

```ts
import { configureStore } from "@reduxjs/toolkit"
import counterReducer from "@/store/counterSlice"

export const store = configureStore({
  reducer: { counter: counterReducer },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```

**3. Create `src/store/hooks.ts`** — the file you must not skip:

```ts
import { useDispatch, useSelector } from "react-redux"
import type { RootState, AppDispatch } from "@/store"

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
```

**4. Wrap the lab app.** In `src/main.tsx`:

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

### Run it

Create `src/demos/22-redux/CounterSliceLab.tsx`:

```tsx
import { Badge, Button, ButtonGroup, Card, Col, Form, Row } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import StateInspector from "@/lab/StateInspector"
import RenderBadge from "@/lab/RenderBadge"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  incremented, decremented, stepChanged, reset,
  selectValue, selectStep,
} from "@/store/counterSlice"

/** Subscribes ONLY to counter.value. */
function ValueDisplay() {
  const value = useAppSelector(selectValue)
  return (
    <Card body className="text-center h-100">
      <div className="small text-muted">value</div>
      <div className="display-5 fw-semibold">{value}</div>
      <RenderBadge label="ValueDisplay" bg="primary" />
    </Card>
  )
}

/** Subscribes ONLY to counter.step — so value changes don't re-render it. */
function StepDisplay() {
  const step = useAppSelector(selectStep)
  return (
    <Card body className="text-center h-100">
      <div className="small text-muted">step</div>
      <div className="display-5 fw-semibold">{step}</div>
      <RenderBadge label="StepDisplay" bg="success" />
    </Card>
  )
}

/** Dispatches only — subscribes to nothing at all. */
function Controls() {
  const dispatch = useAppDispatch()
  const step = useAppSelector(selectStep)
  return (
    <Card body>
      <ButtonGroup className="w-100 mb-3">
        <Button variant="outline-primary" onClick={() => dispatch(decremented())}>
          −{step}
        </Button>
        <Button variant="outline-primary" onClick={() => dispatch(incremented())}>
          +{step}
        </Button>
        <Button variant="outline-secondary" onClick={() => dispatch(reset())}>
          Reset
        </Button>
      </ButtonGroup>
      <Form.Group>
        <Form.Label className="small">step: {step}</Form.Label>
        <Form.Range
          min={1}
          max={10}
          value={step}
          onChange={(e) => dispatch(stepChanged(Number(e.target.value)))}
        />
      </Form.Group>
      <RenderBadge label="Controls" bg="dark" />
    </Card>
  )
}

export default function CounterSliceLab() {
  const history = useAppSelector((s) => s.counter.history)

  return (
    <DemoCard
      title="A store, a slice, and typed hooks"
      claim="createSlice generates the action types and creators; useSelector subscribes a component to one part of the store — the selective re-render Context couldn't give you."
      level="core"
      notice={
        <ul className="mb-0">
          <li>
            Press <strong>+</strong> a few times. <code>ValueDisplay</code>'s counter climbs;{" "}
            <strong><code>StepDisplay</code>'s does not move.</strong> Two components, one
            store, independent subscriptions — compare with Lab 14.3, where every consumer
            re-rendered.
          </li>
          <li>
            Drag the <strong>step</strong> slider: now <code>StepDisplay</code> re-renders
            and <code>ValueDisplay</code> doesn't.
          </li>
          <li>
            <code>state.value = …</code> and <code>state.history.push(…)</code> inside the
            slice look like the §6.4 violation. They aren't — Immer hands you a draft proxy
            (§22.3). Log <code>store.getState()</code> before and after: different objects.
          </li>
          <li>
            <code>incremented()</code> is generated. It returns{" "}
            <code>{"{ type: \"counter/incremented\", payload: undefined }"}</code> — the
            action union and creators from §13 wrote themselves.
          </li>
          <li>
            <strong>Open Redux DevTools.</strong> Every action is listed with the state
            before and after, and you can time-travel. That's what `configureStore` set up
            for free.
          </li>
        </ul>
      }
    >
      <Row className="g-3">
        <Col md={4}>
          <ValueDisplay />
        </Col>
        <Col md={4}>
          <StepDisplay />
        </Col>
        <Col md={4}>
          <Controls />
        </Col>
        <Col xs={12}>
          <div className="small text-muted mb-1">
            history <Badge bg="secondary">{history.length}</Badge>
          </div>
          <StateInspector label="counter.history" value={history.slice(-12)} />
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "redux-counter", chapter: "22 — Redux Toolkit", title: "Store, slice, typed hooks", element: <CounterSliceLab /> }`.

**Experiments:**

1. **Replace `useAppSelector` with react-redux's raw `useSelector`** in `ValueDisplay`. `state` is now `unknown` and the line stops compiling. That's why `hooks.ts` exists and why teams lint against the raw imports.
2. **Change `selectValue` to `(s) => s.counter`** and read `.value` in the component. It still works — and `ValueDisplay` now re-renders when the *step* changes too, because it subscribed to the whole slice. **Select the narrowest thing you can.**
3. **Break Immer's rule:** in `incremented`, both mutate the draft *and* `return state`. Immer throws with a clear message. That's rule 1 from §22.3.
4. **Dispatch from outside React:** `store.dispatch(incremented())` in the browser console. The UI updates. Context can't do that.
5. **Add a second slice** (`themeSlice`) and register it in `configureStore`. Note that `RootState` picks it up automatically — the types follow the reducer map.

---

## 🧪 Lab 22.2 — A tasks slice, and the selector traps

**Level:** core

Create `src/store/tasksSlice.ts`:

```ts
import { createSlice, createSelector, type PayloadAction } from "@reduxjs/toolkit"
import type { RootState } from "@/store"

export interface Task {
  id: string
  title: string
  done: boolean
}

const initialState: Task[] = [
  { id: "1", title: "Learn createSlice", done: true },
  { id: "2", title: "Understand selectors", done: false },
]

const tasksSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    added: {
      // `prepare` moves the impurity (the id) out of the reducer — §13.3
      reducer(state, action: PayloadAction<Task>) {
        state.push(action.payload)
      },
      prepare(title: string) {
        return { payload: { id: crypto.randomUUID(), title, done: false } }
      },
    },
    toggled(state, action: PayloadAction<string>) {
      const task = state.find((t) => t.id === action.payload)
      if (task) task.done = !task.done
    },
    deleted(state, action: PayloadAction<string>) {
      return state.filter((t) => t.id !== action.payload)
    },
  },
})

export const { added, toggled, deleted } = tasksSlice.actions

// ---- selectors: the state shape lives here, not in components ----
export const selectTasks = (s: RootState) => s.tasks
export const selectTaskCount = (s: RootState) => s.tasks.length
export const selectDoneCount = (s: RootState) => s.tasks.filter((t) => t.done).length

/** Memoised: recomputes only when `tasks` actually changes. */
export const selectDoneTasks = createSelector([selectTasks], (tasks) =>
  tasks.filter((t) => t.done)
)

export default tasksSlice.reducer
```

Add it to the store's reducer map, then create `src/demos/22-redux/TasksSliceLab.tsx`:

```tsx
import { useState } from "react"
import { Alert, Badge, Button, Card, Col, Form, ListGroup, Row } from "react-bootstrap"
import { useShallow } from "react-redux"
import DemoCard from "@/lab/DemoCard"
import RenderBadge from "@/lab/RenderBadge"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  added, toggled, deleted,
  selectTasks, selectTaskCount, selectDoneCount, selectDoneTasks,
} from "@/store/tasksSlice"

/** ❌ selects a NEW array every time → re-renders on every store change. */
function BadStats() {
  const done = useAppSelector((s) => s.tasks.filter((t) => t.done))
  return (
    <Card body className="h-100 border-danger-subtle">
      <div className="small fw-semibold text-danger mb-1">
        ❌ inline <code>.filter()</code>
      </div>
      <div className="small">{done.length} done</div>
      <RenderBadge label="BadStats" bg="danger" />
    </Card>
  )
}

/** ✅ selects a primitive → re-renders only when the number changes. */
function GoodStats() {
  const doneCount = useAppSelector(selectDoneCount)
  return (
    <Card body className="h-100 border-success-subtle">
      <div className="small fw-semibold text-success mb-1">✅ a primitive</div>
      <div className="small">{doneCount} done</div>
      <RenderBadge label="GoodStats" bg="success" />
    </Card>
  )
}

/** ✅ createSelector: memoised, so the array identity is stable. */
function MemoStats() {
  const done = useAppSelector(selectDoneTasks)
  return (
    <Card body className="h-100 border-success-subtle">
      <div className="small fw-semibold text-success mb-1">
        ✅ <code>createSelector</code>
      </div>
      <div className="small">{done.length} done</div>
      <RenderBadge label="MemoStats" bg="success" />
    </Card>
  )
}

/** ✅ useShallow: an object of primitives, compared shallowly. */
function ShallowStats() {
  const { total, done } = useAppSelector(
    useShallow((s) => ({
      total: s.tasks.length,
      done: s.tasks.filter((t) => t.done).length,
    }))
  )
  return (
    <Card body className="h-100 border-success-subtle">
      <div className="small fw-semibold text-success mb-1">
        ✅ <code>useShallow</code>
      </div>
      <div className="small">
        {done} / {total} done
      </div>
      <RenderBadge label="ShallowStats" bg="success" />
    </Card>
  )
}

export default function TasksSliceLab() {
  const tasks = useAppSelector(selectTasks)
  const count = useAppSelector(selectTaskCount)
  const dispatch = useAppDispatch()
  const [draft, setDraft] = useState("")
  const [nudge, setNudge] = useState(0)

  return (
    <DemoCard
      title="A tasks slice, and the selector traps"
      claim="useSelector re-renders when the result changes by ===. Return a new array each time and it never bails out — the same reference-identity trap as §16.2."
      level="core"
      notice={
        <ul className="mb-0">
          <li>
            Press <strong>Unrelated re-render</strong>. Nothing in the store changed, so
            nothing re-renders — <code>useSelector</code> only reacts to the store.
          </li>
          <li>
            Now <strong>toggle a task</strong>. All four stat cards update, correctly.
          </li>
          <li>
            Now <strong>add a task that's already done… you can't</strong> — so instead
            rename one by dispatching any action that doesn't change the done count. The red
            card still re-renders, because its <code>.filter()</code> returns a fresh array
            whose identity differs even when the contents don't.
          </li>
          <li>
            <code>createSelector</code> and <code>useShallow</code> both fix it, differently:
            one memoises the derivation, the other compares the result shallowly. Use{" "}
            <code>createSelector</code> for derived data, <code>useShallow</code> for
            selecting several primitives at once.
          </li>
          <li>
            <code>prepare</code> in the <code>added</code> reducer generates the id{" "}
            <em>outside</em> the reducer, keeping it pure — §13.3's rule, with a
            first-class place to put the impurity.
          </li>
        </ul>
      }
    >
      <Alert variant="light" className="border small">
        Render counts climb in twos under Strict Mode. Compare which cards <em>move</em>.
      </Alert>

      <Row className="g-3 mb-3">
        <Col sm={6} lg={3}><BadStats /></Col>
        <Col sm={6} lg={3}><GoodStats /></Col>
        <Col sm={6} lg={3}><MemoStats /></Col>
        <Col sm={6} lg={3}><ShallowStats /></Col>
      </Row>

      <Row className="g-3">
        <Col lg={7}>
          <Form
            className="d-flex gap-2 mb-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (!draft.trim()) return
              dispatch(added(draft.trim()))     // note: takes a string, thanks to `prepare`
              setDraft("")
            }}
          >
            <Form.Control
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="New task"
            />
            <Button type="submit">Add</Button>
            <Button
              type="button"
              variant="outline-secondary"
              onClick={() => setNudge((n) => n + 1)}
            >
              Unrelated re-render ({nudge})
            </Button>
          </Form>

          <ListGroup>
            {tasks.map((t) => (
              <ListGroup.Item key={t.id} className="d-flex align-items-center gap-2">
                <Form.Check
                  checked={t.done}
                  onChange={() => dispatch(toggled(t.id))}
                  aria-label={`Toggle ${t.title}`}
                />
                <span className={t.done ? "text-muted text-decoration-line-through" : ""}>
                  {t.title}
                </span>
                <Button
                  size="sm"
                  variant="outline-danger"
                  className="ms-auto"
                  onClick={() => dispatch(deleted(t.id))}
                >
                  Delete
                </Button>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Col>

        <Col lg={5}>
          <Card body className="small">
            <div className="fw-semibold mb-2">Selector rules of thumb</div>
            <ul className="mb-0">
              <li>Prefer a <strong>primitive</strong> — <code>.length</code>, a boolean, an id</li>
              <li>Deriving an array or object? <code>createSelector</code></li>
              <li>Several primitives at once? <code>useShallow</code></li>
              <li>Never select the whole slice "just in case"</li>
              <li>Export selectors from the slice so the shape lives in one file</li>
            </ul>
            <div className="mt-2">
              <Badge bg="secondary">{count} tasks</Badge>
            </div>
          </Card>
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "redux-tasks", chapter: "22 — Redux Toolkit", title: "Slice & selector traps", element: <TasksSliceLab /> }`.

**Experiments:**

1. **Add a `renamed` action** that changes a title. Dispatch it and watch: the red card re-renders even though the done-count didn't change. `createSelector` and `useShallow` don't. That's the trap, demonstrated.
2. **Remove `createSelector`** from `selectDoneTasks` and make it a plain arrow. `MemoStats` starts behaving like `BadStats`.
3. **Move `selectDoneCount` into the component** as an inline arrow. It still works — and now the state shape (`s.tasks`) is in two files. Put it back and note why colocation matters.
4. **Delete `prepare`** and dispatch `added({ id: crypto.randomUUID(), title, done: false })` from the component. It works, and now every call site generates ids. `prepare` is where that belongs.
5. **Open DevTools and time-travel** back three actions. The UI follows. Then try the same with Lab 14.3's Context version.

---

## 🧪 Lab 22.3 — `createAsyncThunk` with axios and zod

**Level:** depth

Everything from §17 and §22, in the shape a real feature takes.

Create `src/store/remoteTasksSlice.ts`:

```ts
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import axios from "axios"
import { z } from "zod"
import { mockAdapter } from "@/lab/mockAdapter"      // §17's Lab 17.6

const ApiTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  priority: z.enum(["low", "medium", "high"]),
  done: z.boolean(),
})
const ApiTaskListSchema = z.array(ApiTaskSchema)
export type ApiTask = z.infer<typeof ApiTaskSchema>

/** Swap the adapter for a real baseURL and nothing else changes. */
const api = axios.create({ adapter: mockAdapter({ delay: 800 }) })

export const fetchRemoteTasks = createAsyncThunk<
  ApiTask[],                       // what it returns on success
  void,                            // its argument
  { rejectValue: string }          // what rejectWithValue sends
>("remoteTasks/fetch", async (_arg, { signal, rejectWithValue }) => {
  try {
    const res = await api.get("/tasks", { signal })    // §17.8
    return ApiTaskListSchema.parse(res.data)           // §17.5 — validate at the boundary
  } catch (err) {
    if (axios.isCancel(err)) throw err                 // let RTK mark it aborted
    if (err instanceof z.ZodError) return rejectWithValue("The server sent unexpected data")
    return rejectWithValue(err instanceof Error ? err.message : "Request failed")
  }
})

interface RemoteTasksState {
  items: ApiTask[]
  status: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
}

const initialState: RemoteTasksState = { items: [], status: "idle", error: null }

const remoteTasksSlice = createSlice({
  name: "remoteTasks",
  initialState,
  reducers: {
    cleared: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRemoteTasks.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(fetchRemoteTasks.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.items = action.payload
      })
      .addCase(fetchRemoteTasks.rejected, (state, action) => {
        // aborted requests land here too — don't show those as failures
        if (action.meta.aborted) {
          state.status = "idle"
          return
        }
        state.status = "failed"
        state.error = action.payload ?? "Request failed"
      })
  },
})

export const { cleared } = remoteTasksSlice.actions
export default remoteTasksSlice.reducer
```

Create `src/demos/22-redux/AsyncThunkLab.tsx`:

```tsx
import { useRef } from "react"
import { Alert, Badge, Button, Card, Col, ListGroup, Row, Spinner } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import StateInspector from "@/lab/StateInspector"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { fetchRemoteTasks, cleared } from "@/store/remoteTasksSlice"

export default function AsyncThunkLab() {
  const { items, status, error } = useAppSelector((s) => s.remoteTasks)
  const dispatch = useAppDispatch()
  const inflight = useRef<{ abort: () => void } | null>(null)

  function load() {
    inflight.current = dispatch(fetchRemoteTasks())   // the promise exposes .abort()
  }

  return (
    <DemoCard
      title="createAsyncThunk with axios and zod"
      claim="One thunk generates pending/fulfilled/rejected. Validation happens at the boundary, cancellation is built in, and the loading state is a union rather than three booleans."
      level="depth"
      notice={
        <ul className="mb-0">
          <li>
            Press <strong>Load</strong> and watch <code>status</code> move{" "}
            <code>idle → loading → succeeded</code>. One field, four possible values — §5.3
            in a store.
          </li>
          <li>
            Press <strong>Load</strong> then <strong>Abort</strong> quickly. The thunk lands
            in <code>rejected</code> with <code>meta.aborted</code> true, and the reducer
            returns to <code>idle</code> rather than showing an error. <strong>An abort you
            caused is not a failure</strong> — §17.1's fourth bullet, again.
          </li>
          <li>
            Validation runs <em>inside</em> the thunk, so nothing unvalidated ever reaches
            the store. A store full of unchecked API data is §17.5's bug with global reach.
          </li>
          <li>
            <code>rejectWithValue</code> is how you get a typed error payload —{" "}
            <code>action.payload</code> is <code>string</code> here because of the third
            generic argument.
          </li>
          <li>
            <strong>If this is all your slice does, use RTK Query instead.</strong>{" "}
            <code>createApi</code> generates the thunk, the cache, the invalidation and the
            hook from an endpoint definition. This lab exists so you know what it's doing.
          </li>
        </ul>
      }
    >
      <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
        <Button onClick={load} disabled={status === "loading"}>
          {status === "loading" ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Loading…
            </>
          ) : (
            "Load"
          )}
        </Button>
        <Button
          variant="outline-warning"
          onClick={() => inflight.current?.abort()}
          disabled={status !== "loading"}
        >
          Abort
        </Button>
        <Button variant="outline-secondary" onClick={() => dispatch(cleared())}>
          Clear
        </Button>
        <Badge
          bg={
            status === "succeeded" ? "success"
            : status === "failed" ? "danger"
            : status === "loading" ? "warning" : "secondary"
          }
          className="ms-auto"
        >
          {status}
        </Badge>
      </div>

      <Row className="g-3">
        <Col lg={7}>
          <Card style={{ minHeight: 200 }}>
            <Card.Header className="small fw-semibold">Rendered from one union</Card.Header>
            <Card.Body>
              {status === "idle" && <div className="small text-muted">Press Load.</div>}
              {status === "loading" && (
                <div className="d-flex align-items-center gap-2 small text-muted">
                  <Spinner animation="border" size="sm" /> Fetching…
                </div>
              )}
              {status === "failed" && (
                <Alert variant="danger" className="mb-0 small">
                  {error}
                </Alert>
              )}
              {status === "succeeded" && (
                <ListGroup variant="flush">
                  {items.map((t) => (
                    <ListGroup.Item key={t.id} className="px-0 small d-flex justify-content-between">
                      <span className={t.done ? "text-muted text-decoration-line-through" : ""}>
                        {t.title}
                      </span>
                      <Badge bg="secondary">{t.priority}</Badge>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col lg={5}>
          <StateInspector label="state.remoteTasks" value={{ status, error, count: items.length }} />
          <Card body className="small mt-3">
            <div className="fw-semibold mb-2">The three generated action types</div>
            <ul className="mb-0 font-monospace">
              <li>remoteTasks/fetch/pending</li>
              <li>remoteTasks/fetch/fulfilled</li>
              <li>remoteTasks/fetch/rejected</li>
            </ul>
            <div className="text-muted mt-2">Watch them arrive in Redux DevTools.</div>
          </Card>
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "redux-thunk", chapter: "22 — Redux Toolkit", title: "createAsyncThunk", element: <AsyncThunkLab /> }`.

**Experiments:**

1. **Load, then Abort within the delay.** `status` returns to `idle`, not `failed`. Remove the `meta.aborted` check and try again — now your own cancellation shows the user an error.
2. **Corrupt the response** (`mockAdapter({ corrupt: true })`). The `ZodError` branch fires with its own message. Note it's a *different* failure from a 500 — a contract mismatch, not a server problem.
3. **Return a 500** (`mockAdapter({ status: 500 })`). axios rejects, `rejectWithValue` carries the message, `action.payload` is typed `string`.
4. **Remove the `parse` call** and return `res.data` directly. TypeScript complains, because the thunk's first generic promises `ApiTask[]` — the validation and the type are tied together.
5. **Write the same feature with RTK Query** (`createApi` + `useGetTasksQuery`). Count the lines you delete. Then reread §22.5's last paragraph.

---

✅ **Concept check 22**

1. A Redux store is which two things you've already built, combined?
2. Name two things `useSelector` gives you that Context cannot.
3. Why is `state.push()` legal inside `createSlice` but not in a `useState` updater?
4. What are Immer's two rules, and what happens if you break the first?
5. Why does `useAppSelector(s => s.tasks.filter(t => t.done))` re-render on every store change, and what are three fixes?
6. What does `prepare` do, and which §13 rule does it serve?
7. Which three action types does `createAsyncThunk` generate?
8. Why must an aborted thunk not be shown to the user as an error?
9. Name two kinds of state that should *not* go in a Redux store.
10. When would you choose Redux Toolkit over Zustand, and vice versa?

Answers in [Appendix B](#appendix-b--concept-check-answers).

---

# 23. Zustand

Redux Toolkit (§22) solves Context's ceiling with a store, slices, typed hooks and a provider. Zustand solves the same problem with **one function call and no provider** — and for a great many apps that's the better trade.

Read §14 and §22 first. This section is mostly "the same ideas, much less ceremony", and the interesting part is knowing when the ceremony was buying you something.

## 23.1 A store is a hook

```bash
npm install zustand
```

```ts
// src/stores/useCounterStore.ts
import { create } from "zustand"

interface CounterState {
  count: number
  step: number
  increment: () => void
  decrement: () => void
  setStep: (step: number) => void
  reset: () => void
}

export const useCounterStore = create<CounterState>()((set) => ({
  count: 0,
  step: 1,
  increment: () => set((s) => ({ count: s.count + s.step })),
  decrement: () => set((s) => ({ count: Math.max(0, s.count - s.step) })),
  setStep: (step) => set({ step }),
  reset: () => set({ count: 0, step: 1 }),
}))
```

That's the whole store: **state and actions in one object.** No slice file, no reducer map, no `configureStore`, no `Provider`, no typed-hooks module.

**Note the double call — `create<State>()(...)`.** That curried form exists purely so TypeScript can infer the `set`/`get` argument types correctly. `create<State>(...)` (single call) works but degrades inference the moment you add middleware. Write the curried form always; it costs two characters.

### Using it

```tsx
function Counter() {
  const count = useCounterStore((s) => s.count)          // subscribes to count only
  const increment = useCounterStore((s) => s.increment)  // actions are stable
  return <Button onClick={increment}>{count}</Button>
}
```

**No provider.** The store lives at module scope, so any component can reach it and nothing needs wrapping. That also means you can read and write it from outside React:

```ts
useCounterStore.getState().increment()
useCounterStore.setState({ count: 0 })
const unsub = useCounterStore.subscribe((s) => console.log(s.count))
```

Useful in an axios interceptor, a router guard, or a test — and genuinely awkward with Context.

## 23.2 Selectors, and the one trap

The selector argument is the whole performance story, and it works exactly like §22.4's:

```tsx
const count = useCounterStore((s) => s.count)     // ✅ re-renders when count changes
const store = useCounterStore()                   // ❌ re-renders on ANY change
```

Calling the hook with no selector subscribes to the entire store. It's the single most common Zustand mistake, and it silently undoes the reason you chose Zustand.

**Selecting several values needs shallow comparison**, because an object literal is a new reference every time:

```tsx
import { useShallow } from "zustand/react/shallow"

// ❌ new object every render → always re-renders
const { count, step } = useCounterStore((s) => ({ count: s.count, step: s.step }))

// ✅ compared shallowly
const { count, step } = useCounterStore(
  useShallow((s) => ({ count: s.count, step: s.step }))
)

// ✅ or just select twice — two primitives, no comparison needed
const count = useCounterStore((s) => s.count)
const step = useCounterStore((s) => s.step)
```

Two separate primitive selectors is often the clearest answer and costs nothing.

### `set` merges; it doesn't replace

```ts
set({ step: 5 })                     // count is untouched — shallow MERGE
set((s) => ({ count: s.count + 1 })) // functional form, for values derived from current
set({ ...initial }, true)            // the `true` flag REPLACES the whole state
```

That's the opposite of `useState`, which replaces. Worth internalising early, because it makes most actions one line.

**Nested state still needs spreading**, exactly as in §6.4 — unless you add the `immer` middleware (§23.4):

```ts
// without immer
updateCity: (city) => set((s) => ({ user: { ...s.user, address: { ...s.user.address, city } } })),
```

## 23.3 Deriving, and where to put it

**Don't store what you can derive** (§10). Derive in the selector:

```ts
// ✅ in the component
const doneCount = useTaskStore((s) => s.tasks.filter((t) => t.done).length)

// ✅ or as a named, reusable selector
export const selectDoneCount = (s: TaskState) => s.tasks.filter((t) => t.done).length
const doneCount = useTaskStore(selectDoneCount)
```

Returning a **primitive** means no memoisation is needed. If a derivation must return an array or object, either wrap the selector with `useShallow`, or memoise it with `reselect`'s `createSelector` — the same tool §22.4 used.

**Don't put a `doneCount` field in the store and keep it in sync.** That's §10.1's duplicated-state bug with a global blast radius.

## 23.4 Middleware

Four you'll actually use, composed inside `create`:

```ts
import { create } from "zustand"
import { persist, devtools } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"

export const useTaskStore = create<TaskState>()(
  devtools(
    persist(
      immer((set) => ({
        tasks: [],
        toggle: (id) =>
          set((s) => {
            const t = s.tasks.find((x) => x.id === id)
            if (t) t.done = !t.done          // Immer draft — §22.3's rules apply
          }),
      })),
      {
        name: "taskboard.tasks",
        // Persist only part of the store — don't save transient UI state
        partialize: (s) => ({ tasks: s.tasks }),
        version: 1,
        migrate: (persisted, from) => (from === 0 ? { tasks: [] } : persisted),
      }
    ),
    { name: "TaskStore" }
  )
)
```

| Middleware | What it does |
|---|---|
| `persist` | Writes to `localStorage` (or any storage) and rehydrates on load |
| `devtools` | Connects to Redux DevTools — actions, state, time travel |
| `immer` | Lets you mutate a draft instead of spreading nested state |
| `subscribeWithSelector` | `store.subscribe(selector, listener)` outside React |

**`persist` deserves attention**, because it replaces a whole build step. The hand-rolled version in §11 wrote a lazy `useState` initialiser, a `useEffect`, a `try`/`catch` and a `safeParse` to keep tasks in `localStorage`. `persist` is a wrapper and a `name`.

Two things it doesn't do for you:

- **Validation.** Rehydrated data is untrusted input (§17.5). Validate in `merge` or `onRehydrateStorage`:
  ```ts
  merge: (persisted, current) => {
    const parsed = TaskListSchema.safeParse((persisted as { tasks?: unknown })?.tasks)
    return { ...current, tasks: parsed.success ? parsed.data : [] }
  }
  ```
- **Versioning by itself.** Ship a shape change without `version` + `migrate` and returning users rehydrate yesterday's shape into today's code.

## 23.5 Slices, for a store that grows

One `create` call gets unwieldy past a few features. Split it into typed slices and combine:

```ts
import { create, type StateCreator } from "zustand"

interface TaskSlice {
  tasks: Task[]
  addTask: (title: string) => void
}
interface FilterSlice {
  filter: "all" | "active" | "done"
  setFilter: (f: FilterSlice["filter"]) => void
}
type Store = TaskSlice & FilterSlice

const createTaskSlice: StateCreator<Store, [], [], TaskSlice> = (set) => ({
  tasks: [],
  addTask: (title) =>
    set((s) => ({ tasks: [...s.tasks, { id: crypto.randomUUID(), title, done: false }] })),
})

const createFilterSlice: StateCreator<Store, [], [], FilterSlice> = (set) => ({
  filter: "all",
  setFilter: (filter) => set({ filter }),
})

export const useStore = create<Store>()((...a) => ({
  ...createTaskSlice(...a),
  ...createFilterSlice(...a),
}))
```

`StateCreator<Store, [], [], TaskSlice>` reads as: the whole store is `Store`, no middleware, and *this* slice contributes `TaskSlice`. The first type parameter being the **whole** store is what lets one slice call another's actions through `get()`.

**Or use several stores.** Two unrelated concerns often want `useTaskStore` and `useUiStore` rather than one store with two slices — there's no provider, so there's no cost to having more than one. Prefer separate stores unless slices genuinely need to read each other.

## 23.6 Async, and what doesn't belong here

Actions can be `async`. There's no thunk concept — it's just a function:

```ts
interface TaskState {
  tasks: Task[]
  status: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
  load: () => Promise<void>
}

load: async () => {
  set({ status: "loading", error: null })
  try {
    const res = await api.get("/tasks")                 // §17.8
    set({ tasks: TaskListSchema.parse(res.data), status: "succeeded" })
  } catch (err) {
    set({ status: "failed", error: err instanceof Error ? err.message : "Failed" })
  }
}
```

Note the union `status` again (§5.3), and validation at the boundary again (§17.5). Zustand adds nothing here and takes nothing away — which is the point.

**What doesn't belong in the store:**

- **Server data as a source of truth.** The snippet above is a hand-rolled cache with no deduplication, no revalidation and no retry. It's fine for one endpoint and wrong by the third — use TanStack Query (§17.6) and keep the store for client state.
- **Form drafts** (§8.4). Every keystroke becoming a global update is a bad trade.
- **Anything one subtree owns** (§9.1).

## 23.7 Choosing

| | Context + reducer (§14) | Redux Toolkit (§22) | Zustand (§23) |
|---|---|---|---|
| Provider required | ✅ | ✅ | ❌ |
| Lines to first store | ~30 | ~40 across 3 files | ~10 in 1 file |
| Selective subscription | ❌ | ✅ | ✅ |
| Usable outside React | ❌ | ✅ | ✅ |
| DevTools / time travel | ❌ | ✅ best in class | ✅ via `devtools` |
| Persistence | DIY | `redux-persist` | `persist`, built in |
| Enforces one convention | ❌ | ✅ its main selling point | ❌ you decide |
| Good for server data | ❌ | RTK Query, yes | ❌ use a query library |

**How to choose, honestly:**

- **Context** for theme, locale, the authenticated user — tree-wide values that change rarely.
- **Zustand** when you want a store and not a framework. Small teams, or one team that already agrees on conventions.
- **Redux Toolkit** when the app is large and several people touch the state, and having *one documented way* to do things is worth the extra files. That "boilerplate" is a convention, and conventions are what scale across people rather than across lines of code.
- **A query library** for anything that came from a server — regardless of which of the three you picked for client state.

The wrong reason to choose Redux is "it's what serious apps use". The wrong reason to choose Zustand is "less code". Pick on how many people will edit this state, and whether you need a convention more than you need brevity.

---

## 🧪 Lab 23.1 — A store in ten lines, and the selector trap

**Level:** core

```bash
npm install zustand
```

### The change

Create `src/stores/useCounterStore.ts`:

```ts
import { create } from "zustand"

interface CounterState {
  count: number
  step: number
  increment: () => void
  decrement: () => void
  setStep: (step: number) => void
  reset: () => void
}

// Note the curried create<T>()(…) — it's what keeps `set` properly typed
export const useCounterStore = create<CounterState>()((set) => ({
  count: 0,
  step: 1,
  increment: () => set((s) => ({ count: Math.min(100, s.count + s.step) })),
  decrement: () => set((s) => ({ count: Math.max(0, s.count - s.step) })),
  setStep: (step) => set({ step }),          // merges — count is untouched
  reset: () => set({ count: 0, step: 1 }),
}))
```

No provider. No store file. No typed hooks. **That's the entire setup** — compare with Lab 22.1's four files.

### Run it

Create `src/demos/23-zustand/CounterStoreLab.tsx`:

```tsx
import { useState } from "react"
import { useShallow } from "zustand/react/shallow"
import { Alert, Button, ButtonGroup, Card, Col, Form, Row } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import RenderBadge from "@/lab/RenderBadge"
import { useCounterStore } from "@/stores/useCounterStore"

/** ✅ subscribes to ONE primitive. */
function CountCard() {
  const count = useCounterStore((s) => s.count)
  return (
    <Card body className="text-center h-100 border-success-subtle">
      <div className="small fw-semibold text-success mb-1">✅ selects count</div>
      <div className="display-6 fw-semibold">{count}</div>
      <RenderBadge label="CountCard" bg="success" />
    </Card>
  )
}

/** ✅ subscribes to a different primitive — untouched by count changes. */
function StepCard() {
  const step = useCounterStore((s) => s.step)
  return (
    <Card body className="text-center h-100 border-success-subtle">
      <div className="small fw-semibold text-success mb-1">✅ selects step</div>
      <div className="display-6 fw-semibold">{step}</div>
      <RenderBadge label="StepCard" bg="success" />
    </Card>
  )
}

/** ❌ no selector — subscribes to the WHOLE store. */
function WholeStoreCard() {
  const store = useCounterStore()
  return (
    <Card body className="text-center h-100 border-danger-subtle">
      <div className="small fw-semibold text-danger mb-1">❌ no selector</div>
      <div className="display-6 fw-semibold">{store.count}</div>
      <RenderBadge label="WholeStore" bg="danger" />
    </Card>
  )
}

/** ❌ a new object every render — always re-renders. */
function NewObjectCard() {
  const { count, step } = useCounterStore((s) => ({ count: s.count, step: s.step }))
  return (
    <Card body className="text-center h-100 border-danger-subtle">
      <div className="small fw-semibold text-danger mb-1">❌ object literal</div>
      <div className="small">
        {count} / step {step}
      </div>
      <RenderBadge label="NewObject" bg="danger" />
    </Card>
  )
}

/** ✅ the same two values, compared shallowly. */
function ShallowCard() {
  const { count, step } = useCounterStore(
    useShallow((s) => ({ count: s.count, step: s.step }))
  )
  return (
    <Card body className="text-center h-100 border-success-subtle">
      <div className="small fw-semibold text-success mb-1">✅ useShallow</div>
      <div className="small">
        {count} / step {step}
      </div>
      <RenderBadge label="Shallow" bg="success" />
    </Card>
  )
}

/** Actions are stable references — this never re-renders from the store. */
function Controls() {
  const increment = useCounterStore((s) => s.increment)
  const decrement = useCounterStore((s) => s.decrement)
  const setStep = useCounterStore((s) => s.setStep)
  const reset = useCounterStore((s) => s.reset)
  const step = useCounterStore((s) => s.step)

  return (
    <Card body>
      <ButtonGroup className="w-100 mb-3">
        <Button variant="outline-primary" onClick={decrement}>−{step}</Button>
        <Button variant="outline-primary" onClick={increment}>+{step}</Button>
        <Button variant="outline-secondary" onClick={reset}>Reset</Button>
      </ButtonGroup>
      <Form.Group>
        <Form.Label className="small">step: {step}</Form.Label>
        <Form.Range min={1} max={10} value={step} onChange={(e) => setStep(Number(e.target.value))} />
      </Form.Group>
      <RenderBadge label="Controls" bg="dark" />
    </Card>
  )
}

export default function CounterStoreLab() {
  const [nudge, setNudge] = useState(0)

  return (
    <DemoCard
      title="A store in ten lines, and the selector trap"
      claim="One create() call, no provider. The selector argument is the whole performance story — call the hook without one and you've subscribed to everything."
      level="core"
      notice={
        <ul className="mb-0">
          <li>
            Press <strong>+</strong>. <code>CountCard</code> updates; <strong>
            <code>StepCard</code> does not.</strong> Two primitives, two independent
            subscriptions.
          </li>
          <li>
            Drag <strong>step</strong>. Now <code>StepCard</code> moves and{" "}
            <code>CountCard</code> doesn't.
          </li>
          <li>
            <strong>Both red cards re-render on everything.</strong>{" "}
            <code>useCounterStore()</code> with no selector subscribes to the whole store;{" "}
            <code>(s) =&gt; ({"{...}"})</code> returns a fresh object whose identity always
            differs. <code>useShallow</code> fixes the second.
          </li>
          <li>
            Press <strong>Unrelated re-render</strong>. Nothing in the store changed, so no
            card moves — the subscription is to the store, not to the parent.
          </li>
          <li>
            <code>Controls</code> selects four <em>actions</em>. They're stable references
            created once, so it never re-renders from the store — only from the{" "}
            <code>step</code> it also reads.
          </li>
          <li>
            <strong>Try it from the console:</strong>{" "}
            <code>useCounterStore.getState().increment()</code>. The UI updates. No provider,
            so no tree position — that's what makes this possible.
          </li>
        </ul>
      }
    >
      <Alert variant="light" className="border small">
        Counts climb in twos under Strict Mode. Compare which cards <em>move</em>.
      </Alert>

      <Row className="g-3 mb-3">
        <Col sm={6} lg><CountCard /></Col>
        <Col sm={6} lg><StepCard /></Col>
        <Col sm={6} lg><ShallowCard /></Col>
        <Col sm={6} lg><WholeStoreCard /></Col>
        <Col sm={6} lg><NewObjectCard /></Col>
      </Row>

      <Row className="g-3">
        <Col lg={6}><Controls /></Col>
        <Col lg={6} className="d-flex align-items-center">
          <Button variant="outline-secondary" onClick={() => setNudge((n) => n + 1)}>
            Unrelated re-render ({nudge})
          </Button>
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "zustand-counter", chapter: "23 — Zustand", title: "A store in ten lines", element: <CounterStoreLab /> }`.

**Experiments:**

1. **Count the files** against Lab 22.1: one versus four, and no `Provider` in `main.tsx`. Then ask what the four bought — the answer is in §23.7, and it isn't nothing.
2. **Wrap `NewObjectCard`'s selector in `useShallow`.** It joins the green cards. That one import is the difference.
3. **`useCounterStore.setState({ count: 99 })`** in the console. Every subscribed card updates. Now try `setState({ count: 0 }, true)` — the `true` replaces the whole state, so the *actions* disappear and the buttons break. That's the merge-vs-replace distinction, demonstrated destructively.
4. **Add `subscribe`** in an effect: `useCounterStore.subscribe((s) => console.log(s.count))`. You now have a store listener with no component. Useful in interceptors and guards.
5. **Remove the curried call** — `create<CounterState>((set) => …)`. It still compiles here. Now add the `persist` middleware and watch the inference degrade. That's why §23.1 says always write `create<T>()(…)`.

---

## 🧪 Lab 23.2 — `persist`, `devtools`, `immer` — and validating on rehydrate

**Level:** core

This lab replaces an entire build step. The hand-rolled version in §11 needed a lazy initialiser, an effect, a `try`/`catch` and a `safeParse` to keep tasks in `localStorage`. Here it's a wrapper.

### The change

Create `src/stores/useTaskStore.ts`:

```ts
import { create } from "zustand"
import { persist, devtools } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import { z } from "zod"

const TaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  done: z.boolean(),
})
const TaskListSchema = z.array(TaskSchema)
export type Task = z.infer<typeof TaskSchema>

interface TaskState {
  tasks: Task[]
  /** Transient UI state — deliberately NOT persisted. */
  filter: "all" | "active" | "done"
  add: (title: string) => void
  toggle: (id: string) => void
  remove: (id: string) => void
  clearDone: () => void
  setFilter: (f: TaskState["filter"]) => void
}

export const useTaskStore = create<TaskState>()(
  devtools(
    persist(
      immer((set) => ({
        tasks: [],
        filter: "all",

        // immer draft: mutate freely, get an immutable result (§22.3's rules apply)
        add: (title) =>
          set((s) => {
            s.tasks.push({ id: crypto.randomUUID(), title, done: false })
          }),
        toggle: (id) =>
          set((s) => {
            const t = s.tasks.find((x) => x.id === id)
            if (t) t.done = !t.done
          }),
        remove: (id) =>
          set((s) => {
            s.tasks = s.tasks.filter((t) => t.id !== id)
          }),
        clearDone: () =>
          set((s) => {
            s.tasks = s.tasks.filter((t) => !t.done)
          }),
        setFilter: (filter) =>
          set((s) => {
            s.filter = filter
          }),
      })),
      {
        name: "zustand.tasks",
        version: 1,

        // Persist ONLY the data. `filter` is UI state and shouldn't survive a reload.
        partialize: (s) => ({ tasks: s.tasks }),

        // Rehydrated data is untrusted input (§17.5) — validate it
        merge: (persisted, current) => {
          const raw = (persisted as { tasks?: unknown } | undefined)?.tasks
          const parsed = TaskListSchema.safeParse(raw)
          if (!parsed.success) {
            console.warn("Stored tasks were invalid — starting empty")
            return { ...current, tasks: [] }
          }
          return { ...current, tasks: parsed.data }
        },

        // A shape change needs a migration, or returning users break
        migrate: (persisted, from) => (from === 0 ? { tasks: [] } : persisted),
      }
    ),
    { name: "TaskStore" }
  )
)

// Selectors: primitives where possible, so no memoisation is needed
export const selectDoneCount = (s: TaskState) => s.tasks.filter((t) => t.done).length
export const selectVisible = (s: TaskState) =>
  s.filter === "active" ? s.tasks.filter((t) => !t.done)
  : s.filter === "done" ? s.tasks.filter((t) => t.done)
  : s.tasks
```

### Run it

Create `src/demos/23-zustand/TaskStoreLab.tsx`:

```tsx
import { useState } from "react"
import { useShallow } from "zustand/react/shallow"
import { Alert, Badge, Button, ButtonGroup, Card, Col, Form, ListGroup, ProgressBar, Row } from "react-bootstrap"
import DemoCard from "@/lab/DemoCard"
import StateInspector from "@/lab/StateInspector"
import { useTaskStore, selectDoneCount, selectVisible } from "@/stores/useTaskStore"

export default function TaskStoreLab() {
  const visible = useTaskStore(useShallow(selectVisible))   // returns an array → useShallow
  const total = useTaskStore((s) => s.tasks.length)         // primitives need nothing
  const doneCount = useTaskStore(selectDoneCount)
  const filter = useTaskStore((s) => s.filter)

  const { add, toggle, remove, clearDone, setFilter } = useTaskStore(
    useShallow((s) => ({
      add: s.add, toggle: s.toggle, remove: s.remove,
      clearDone: s.clearDone, setFilter: s.setFilter,
    }))
  )

  const [draft, setDraft] = useState("")
  const percent = total === 0 ? 0 : Math.round((doneCount / total) * 100)

  return (
    <DemoCard
      title="persist, devtools, immer — and validating on rehydrate"
      claim="One middleware replaces the hand-rolled lazy initialiser, effect, try/catch and parse. What it does NOT replace is validation — rehydrated storage is untrusted input."
      level="core"
      notice={
        <ul className="mb-0">
          <li>
            Add some tasks and <strong>reload the page.</strong> They're still there. That's{" "}
            <code>persist</code> — a wrapper and a <code>name</code>.
          </li>
          <li>
            Change the <strong>filter</strong>, then reload. The filter resets to "all",
            because <code>partialize</code> saves only <code>tasks</code>.{" "}
            <strong>Transient UI state shouldn't survive a reload</strong> — deciding that
            explicitly is the point of the option.
          </li>
          <li>
            <strong>Corrupt the storage:</strong> run{" "}
            <code>localStorage.setItem("zustand.tasks", '{"state":{"tasks":[{"id":1}]}}')</code>{" "}
            and reload. <code>merge</code>'s <code>safeParse</code> rejects it and you get an
            empty list plus a console warning — not a crash. Remove the validation and the
            same input puts <code>id: 1</code> into typed state.
          </li>
          <li>
            <code>s.tasks.push(…)</code> inside <code>add</code> is an Immer draft, not a
            §6.4 violation — §22.3's two rules apply here identically.
          </li>
          <li>
            <code>selectVisible</code> returns an <strong>array</strong>, so it's wrapped in{" "}
            <code>useShallow</code>. <code>total</code> and <code>doneCount</code> are
            primitives and need nothing.
          </li>
          <li>
            <strong>Open Redux DevTools.</strong> The <code>devtools</code> middleware makes a
            Zustand store show up there, actions and all.
          </li>
        </ul>
      }
    >
      <Row className="g-3">
        <Col lg={7}>
          <Form
            className="d-flex gap-2 mb-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (!draft.trim()) return
              add(draft.trim())
              setDraft("")
            }}
          >
            <Form.Control
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="New task — then reload the page"
            />
            <Button type="submit">Add</Button>
          </Form>

          <div className="d-flex justify-content-between small text-muted mb-1">
            <span>
              {doneCount} of {total} done
            </span>
            <span>{percent}%</span>
          </div>
          <ProgressBar now={percent} variant="success" style={{ height: 5 }} className="mb-3" />

          <ButtonGroup size="sm" className="mb-3">
            {(["all", "active", "done"] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "primary" : "outline-primary"}
                onClick={() => setFilter(f)}
              >
                {f}
              </Button>
            ))}
          </ButtonGroup>

          <ListGroup>
            {visible.length === 0 ? (
              <ListGroup.Item className="small text-muted">Nothing here.</ListGroup.Item>
            ) : (
              visible.map((t) => (
                <ListGroup.Item key={t.id} className="d-flex align-items-center gap-2">
                  <Form.Check
                    checked={t.done}
                    onChange={() => toggle(t.id)}
                    aria-label={`Toggle ${t.title}`}
                  />
                  <span className={t.done ? "text-muted text-decoration-line-through" : ""}>
                    {t.title}
                  </span>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    className="ms-auto"
                    onClick={() => remove(t.id)}
                  >
                    Delete
                  </Button>
                </ListGroup.Item>
              ))
            )}
          </ListGroup>

          <Button
            variant="outline-danger"
            size="sm"
            className="mt-3"
            disabled={doneCount === 0}
            onClick={clearDone}
          >
            Clear {doneCount} done
          </Button>
        </Col>

        <Col lg={5}>
          <StateInspector label="what persist saves" value={{ tasks: `${total} items` }} />
          <Alert variant="light" className="border small mt-3">
            <div className="fw-semibold mb-1">
              <code>filter</code> is <Badge bg="secondary">{filter}</Badge> and is not saved
            </div>
            <code>partialize</code> chose that. Reload and confirm.
          </Alert>
          <Card body className="small">
            <div className="fw-semibold mb-2">What <code>persist</code> does not do</div>
            <ul className="mb-0">
              <li><strong>Validate.</strong> Do it in <code>merge</code> — storage is untrusted.</li>
              <li><strong>Version safely by itself.</strong> Ship a shape change without <code>migrate</code> and returning users rehydrate yesterday's shape.</li>
              <li><strong>Decide what's transient.</strong> That's <code>partialize</code>, and it's your call.</li>
            </ul>
          </Card>
        </Col>
      </Row>
    </DemoCard>
  )
}
```

Register as `{ id: "zustand-tasks", chapter: "23 — Zustand", title: "persist, devtools, immer", element: <TaskStoreLab /> }`.

**Experiments — do the third one:**

1. **Add tasks, reload.** Persistence in one wrapper. Then compare with the four moving parts the hand-rolled version needed.
2. **Change the filter and reload.** It resets, because of `partialize`. Remove `partialize` and it persists too — decide which you'd want, and notice the option forced you to think about it.
3. **Corrupt the storage** with the console line in the footer and reload. `merge`'s `safeParse` saves you. **Now delete the `merge` function and repeat** — `id: 1` lands in state typed as `string`, and you find out when something calls a string method on it. That's §17.5 with a global blast radius.
4. **Bump `version` to 2** without writing the matching `migrate` branch. Reload and watch what a returning user gets.
5. **Break Immer's rule:** in `add`, both `s.tasks.push(...)` and `return { tasks: [] }`. It throws. §22.3's rule 1 applies to Zustand's immer middleware identically.

---

✅ **Concept check 23**

1. Why is the store written `create<T>()(…)` rather than `create<T>(…)`?
2. What does `useTaskStore()` with no selector subscribe you to, and why is that the commonest mistake?
3. Why does `(s) => ({ a: s.a, b: s.b })` always re-render, and what are the two fixes?
4. Does `set` merge or replace? How do you get the other behaviour?
5. Which two things does `persist` *not* do for you?
6. What is `partialize` for, and give an example of state you shouldn't persist.
7. In `StateCreator<Store, [], [], TaskSlice>`, why is the first type parameter the whole store?
8. Name two kinds of state that shouldn't live in a Zustand store.
9. Zustand needs no provider. Name one capability that buys you and one risk it introduces.
10. Give the honest reason to choose Redux Toolkit over Zustand — and the bad reason.

Answers in [Appendix B](#appendix-b--concept-check-answers).

---

# Common mistakes and how to avoid them

| Mistake | Why it breaks | Fix | Lab |
|---|---|---|---|
| Mutating state directly | React compares by reference; no new reference means no re-render | Spread into a new object/array | 6.3 |
| `setCount(count + 1)` twice | Both read the same stale constant | `setCount(c => c + 1)` | 6.1 |
| Reading state right after setting it | Updates apply on the next render | Use the value you just computed | 6.2 |
| `key={index}` on a dynamic list | React reuses the wrong DOM nodes on reorder/delete | Use a stable ID | 4.1 |
| `key={Math.random()}` | Destroys and recreates every item every render | Assign ids at creation time | 4.1 |
| `{count && <X/>}` | Renders `0` when count is zero | `{count > 0 && <X/>}` | 2.2 |
| Missing effect dependencies | Stale closures — the effect sees old values | List every used value; keep the lint rule on | 11.1 |
| An object literal in a dependency array | New reference every render → effect runs every render | Depend on primitives, or memoise | 11.1 |
| Effect with no cleanup | Timers/listeners/requests leak and stack up | Return a cleanup function | 11.2 |
| Inline arrows in `add`/`removeEventListener` | Different function references, so nothing is removed | One named function, used twice | 11.3 |
| Storing derived data in state | Two sources of truth drift apart | Compute during render | 10.1 |
| `useEffect` to transform data | Extra render, can go stale | Derive during render | 11.4 |
| Storing the selected *object* | It goes stale on edit and ghosts on delete | Store the id, derive the object | 10.3 |
| Calling a hook inside a condition | Breaks hook call order | Hooks at the top level, always | 12.4 |
| `<Button onClick={fn()}>` | Runs during render, not on click | `onClick={fn}` or `onClick={() => fn(arg)}` | 7.1 |
| Controlled input without `onChange` | Field appears frozen | Add the handler, or use `defaultValue` | 8.1 |
| Reading `e.target.value` on a number input | It's the string `"42"` | `e.target.valueAsNumber`, guarded for `NaN` | 8.2 |
| One giant context for everything | Every consumer re-renders on any change | Split by concern; split state from dispatch | 14.3 |
| A plausible `createContext` default | A missing provider fails silently with fake data | `null` default + a throwing wrapper hook | 14.1 |
| `memo` with inline arrow props | The shallow comparison can never pass | `useCallback`, or fix the structure | 16.1 |
| Memoising everything preemptively | Adds cost and complexity for no gain | Profile first | 16.4 |
| Writing `ref.current` during render | Impure; doubles under Strict Mode | Write refs in effects and handlers | 15.2 |
| A `let` variable instead of a ref | Recreated on every render | `useRef` | 15.3 |
| No `res.ok` check | `fetch` doesn't reject on 4xx/5xx | Throw on `!res.ok` | 17.1 |
| No abort or ignore flag | Slow responses overwrite newer ones | `AbortController`, or an `ignore` flag | 17.2 |
| Showing `AbortError` to the user | Your own cancellation isn't a failure | Skip errors with `name === "AbortError"` | 17.1 |
| Plain `<a href>` for internal links | Full page reload, all state lost | `<Link>` / `<NavLink>` | 18.1 |
| Redirecting without `replace` | Back button becomes unusable | `<Navigate replace />` | 18.5 |
| No error boundary | One thrown error blanks the whole app | Layer boundaries per route and per risky widget | 19.1 |
| Expecting a boundary to catch async errors | They only catch render-phase errors | `try`/`catch` and an error state | 19.1 |
| Tests asserting on class names | Break on every refactor | Query by role and label | 21.1 |

### TypeScript-specific

| Mistake | Why it breaks | Fix |
|---|---|---|
| `useState([])` for a typed list | Infers `never[]`; nothing can be added | `useState<Task[]>([])` |
| `useState(null)` for an object | Infers `null`; nothing can be assigned | `useState<Task \| null>(null)` |
| `useState("all")` for a union | Infers `string`; typos compile | `useState<Filter>("all")` |
| Reaching for `any` | Disables checking for everything downstream | `unknown` and narrow, or type it properly |
| Returning an array from a hook without `as const` | Destructured values get a useless union type | `return [value, setValue] as const` |
| `catch (err) { err.message }` | `err` is `unknown` | `if (err instanceof Error)` |
| Casting `res.json()` and trusting it | A cast is a claim, not a check | Validate with zod at the boundary |
| Overusing `!` non-null assertion | Silences a real possibility of null | Narrow with `if`, or use `?.` |
| `React.FC<Props>` | Legacy; awkward `children` behaviour | Plain function with typed props |
| `useEffect(async () => ...)` | Effects can't return a Promise | Declare the async function inside |
| A plain annotation where `satisfies` belongs | Widens literal values to `string` | `satisfies Record<K, V>` |
| `isControlled = Boolean(value)` | `0` and `""` become uncontrolled | `value !== undefined` |
| Trusting a wrong type predicate | TypeScript believes it without checking | Keep predicates tiny and obvious |
| Using `as` on `<select>` values from an API | Invalid values enter typed state | A type predicate at the boundary |

### Bootstrap-specific

| Mistake | Why it breaks | Fix |
|---|---|---|
| Importing Bootstrap's JS bundle | Duplicates React-Bootstrap's behaviour | Import only the CSS |
| Importing the CSS after your own | Bootstrap overrides your overrides | Import `bootstrap.min.css` first |
| Installing `@types/react-bootstrap` | The package ships its own types | Don't; remove it if present |
| Using `class=` in JSX | Not valid JSX | `className=` |
| Fighting Bootstrap with inline styles | Unmaintainable | Utility classes; customise via Sass variables |
| Hand-writing `htmlFor` + `id` | Easy to get out of sync | `controlId` on `Form.Group` |
| Custom error markup on inputs | Misses `aria-invalid` | `isInvalid` + `Form.Control.Feedback` |
| Building a modal's focus handling yourself | Fragile timing | `onEntered`, and the library's own callbacks |
| A `<div onClick>` styled as a button | Not focusable, not keyboard-operable | A real `<Button>` |

---

# Hooks cheat sheet

| Hook | Purpose | Typed signature |
|---|---|---|
| `useState` | Local state | `const [v, setV] = useState<T>(init)` |
| `useEffect` | Side effects after paint | `useEffect(fn, deps)` |
| `useLayoutEffect` | Effect before paint (measuring) | `useLayoutEffect(fn, deps)` |
| `useContext` | Read a context value | `const v = useContext(Ctx)` |
| `useReducer` | State via reducer actions | `const [s, dispatch] = useReducer(fn, init, initFn?)` |
| `useRef` | Mutable box / DOM handle | `const r = useRef<HTMLInputElement>(null)` |
| `useMemo` | Cache a computed value | `useMemo(fn, deps)` |
| `useCallback` | Cache a function reference | `useCallback(fn, deps)` |
| `useId` | Stable unique ID for a11y | `const id = useId()` |
| `useTransition` | Mark an update non-urgent | `const [isPending, startTransition] = useTransition()` |
| `useDeferredValue` | A lagging copy of a value | `const deferred = useDeferredValue(value)` |
| `useSyncExternalStore` | Subscribe to an external store safely | `useSyncExternalStore(subscribe, getSnapshot)` |
| `useImperativeHandle` | Expose a custom ref API | `useImperativeHandle(ref, () => ({ … }), deps)` |
| `useDebugValue` | Label a custom hook in DevTools | `useDebugValue(value)` |

**Both rules, once more:** call hooks only at the **top level**, and only from **components or other hooks**.

---

# TypeScript-in-React cheat sheet

```tsx
// ---- props ----
interface Props {
  title: string
  count?: number                        // optional
  items: string[]
  status: "idle" | "loading"            // union, not string
  onSelect: (id: string) => void        // callback
  onSubmit: () => void                  // no args, no return
  children: ReactNode                   // anything renderable
  icon?: ReactNode                      // a slot
  render: (item: Task) => ReactNode     // render prop
  readonly task: Readonly<Task>         // can't be mutated
}

// extend an element's or a component's own props
interface ButtonProps extends ComponentProps<"button"> { icon: ReactNode }
interface BsButtonProps extends ComponentProps<typeof Button> { icon: ReactNode }

// props where one field decides the others
type NoticeProps =
  | { kind: "info"; message: string }
  | { kind: "error"; message: string; onRetry: () => void }

// ---- state ----
useState(0)                             // inferred number
useState<Task[]>([])                    // needed — [] infers never[]
useState<Task | null>(null)             // needed — null infers null
useState<Filter>("all")                 // needed — else infers string
useState<Task[]>(() => expensive())     // lazy initialiser
type Setter = Dispatch<SetStateAction<Task[]>>

// ---- events ----
(e: React.ChangeEvent<HTMLInputElement>)   // text input, checkbox, range, file
(e: React.ChangeEvent<HTMLSelectElement>)  // select
(e: React.FormEvent<HTMLFormElement>)      // form submit
(e: React.MouseEvent<HTMLButtonElement>)   // click
(e: React.KeyboardEvent<HTMLInputElement>) // key press
(e: React.FocusEvent<HTMLInputElement>)    // focus / blur
const h: ChangeEventHandler<HTMLInputElement> = (e) => {}   // annotate the handler instead
// inline handlers infer all of these — annotate only standalone functions

// ---- refs ----
useRef<HTMLInputElement>(null)          // DOM node
useRef<number | null>(null)             // mutable value
const [node, setNode] = useState<HTMLDivElement | null>(null)  // ref that triggers effects
forwardRef<HTMLInputElement, Props>(fn) // element type FIRST

// ---- reducer ----
type Action =
  | { type: "added"; id: string; title: string }
  | { type: "deleted"; id: string }

function reducer(state: Task[], action: Action): Task[] {
  switch (action.type) {
    /* … */
    default: {
      const _exhaustive: never = action        // exhaustiveness check
      throw new Error(`Unhandled: ${JSON.stringify(_exhaustive)}`)
    }
  }
}

// ---- context ----
const Ctx = createContext<Value | null>(null)
export function useCtx() {
  const v = useContext(Ctx)
  if (!v) throw new Error("Missing provider")
  return v                              // narrowed to Value
}

// ---- custom hooks ----
function useThing<T>(init: T) {
  return [value, setValue] as const     // tuple, not array
}
function useThings() {
  return { a, b, c }                    // object — no as const needed
}

// ---- boundaries: validate, don't assert ----
const Schema = z.object({ id: z.string(), title: z.string() })
type Task = z.infer<typeof Schema>      // type derived from the schema
const parsed = Schema.safeParse(await res.json())
if (!parsed.success) throw new Error("Bad data")

// ---- narrowing tools ----
typeof v === "string"                   // primitives
v instanceof Error                      // classes
"error" in result                       // property presence
action.type === "added"                 // discriminant
const isPriority = (v: string): v is Priority => […].includes(v)   // predicate

// ---- utility types ----
Partial<Task>          // all optional — for "changes" objects
Required<Task>
Readonly<Task>
Omit<Task, "id">       // everything but id
Pick<Task, "title">    // just these keys
Record<Priority, string>   // one entry per union member
keyof Task             // "id" | "title" | …
Task["title"]          // string
ReturnType<typeof useTasks>
NonNullable<string | null>

// ---- the field-updater pattern, worth memorising ----
function update<K extends keyof Form>(field: K, value: Form[K]) {
  setForm((prev) => ({ ...prev, [field]: value }))
}

// ---- as const / satisfies / as ----
const filters = ["all", "active", "done"] as const   // freeze to literals
type Filter = (typeof filters)[number]               // derive the union
const map = { … } satisfies Record<Filter, string>   // check without widening
const p = value as Priority                          // a claim; nothing is checked
```

---

# Bootstrap quick reference

The utilities you'll reach for constantly:

| Purpose | Classes |
|---|---|
| **Spacing** | `m-*` `p-*` + side (`mt`, `mb`, `ms`, `me`, `mx`, `my`), scale 0–5, e.g. `mb-3`, `px-4` |
| **Flexbox** | `d-flex`, `flex-column`, `justify-content-between`, `align-items-center`, `gap-3`, `flex-grow-1`, `flex-wrap` |
| **Text** | `text-muted`, `text-center`, `fw-bold`, `fw-semibold`, `small`, `text-decoration-line-through`, `font-monospace`, `text-truncate` |
| **Colour** | `text-primary`, `bg-light`, `bg-body`, `bg-body-tertiary`, `bg-primary-subtle`, `border`, `border-bottom`, `border-danger-subtle` |
| **Sizing** | `w-100`, `h-100`, `min-vh-100` |
| **Display** | `d-none`, `d-sm-block`, `d-flex`, `d-inline-flex` |
| **Position** | `position-relative`, `position-absolute`, `top-50`, `translate-middle`, `sticky-top` |
| **Rounding** | `rounded`, `rounded-3`, `rounded-circle`, `rounded-bottom` |
| **Overflow** | `overflow-auto`, `overflow-hidden` |

**The `-subtle` colours** (`bg-primary-subtle`, `border-danger-subtle`, `text-primary`) are Bootstrap 5.3 additions and are theme-aware — they adapt automatically under `data-bs-theme="dark"`. Prefer them over `bg-light`/`bg-white` for anything that might be themed.

**Responsive breakpoints** slot into the class name: `d-none d-sm-block` (hidden on mobile), `flex-column flex-sm-row`. Breakpoints are `sm` 576px, `md` 768px, `lg` 992px, `xl` 1200px, `xxl` 1400px.

**Grid:** `<Container>` → `<Row>` → `<Col xs={12} md={6}>`. Use `<Row className="g-3">` for gutters. `<Col sm="auto">` sizes to content. `<Col md>` takes the remaining space.

**React-Bootstrap props worth memorising:**

| Prop | On | Values |
|---|---|---|
| `variant` | `Button`, `Alert`, `Badge`, `Spinner` | `primary`, `secondary`, `success`, `danger`, `warning`, `info`, `light`, `dark`, `link`, plus `outline-*` on buttons |
| `bg` | `Badge`, `Toast`, `Navbar`, `Card` | the same colour names |
| `size` | `Button`, `Form.Control`, `Modal`, `Spinner` | `sm`, `lg` |
| `as` | almost everything | an element name or a component (§20.3) |
| `controlId` | `Form.Group` | an id — wires label to input |
| `isInvalid` / `isValid` | `Form.Control` | boolean — Bootstrap validation display |
| `type` | `Form.Check` | `checkbox`, `radio`, `switch` |
| `animation` | `Spinner` | `border`, `grow` |

**Dark mode** is one attribute in 5.3:

```tsx
document.documentElement.dataset.bsTheme = "dark"   // whole app
<div data-bs-theme="dark">…</div>                    // one subtree
```

**Customising:** don't fight Bootstrap with inline styles. Override its Sass variables instead:

```bash
npm install -D sass
```

```scss
// src/styles/custom.scss
$primary: #4f46e5;
$border-radius: 0.5rem;
$font-family-sans-serif: "Inter", system-ui, sans-serif;
@import "bootstrap/scss/bootstrap";
```

Then import `custom.scss` in `main.tsx` in place of `bootstrap.min.css`.

---

# Debugging playbook

Symptom-first, because that's how bugs actually arrive.

| Symptom | Most likely causes, in order |
|---|---|
| **Nothing renders, no error** | A `map` with a block body and no `return`; a component returning `undefined`; a condition that's always false |
| **A stray `0` on the page** | `{count && …}` — §2.3 |
| **"Objects are not valid as a React child"** | Rendering an object or `Date` directly. Format it first |
| **UI doesn't update after a state change** | Mutating state instead of replacing it — §6.4. Check with `Object.is(prev, next)` |
| **Value updates one interaction late** | Reading state in a handler that also set it (§6.2), or a mutation that only shows on the next render (§6.3) |
| **Counter increments by 1 instead of 2** | Two `setX(x + 1)` calls; use the updater form — §6.3 |
| **"Too many re-renders"** | `onClick={fn()}`, or `setState` called during render |
| **State jumped to the wrong row** | `key={index}` on a list that reorders — §4.1 |
| **A form resets when it shouldn't (or doesn't when it should)** | Missing or wrong `key` — §4.3 |
| **Input is frozen** | `value` without `onChange` — §8.1 |
| **Arithmetic produces string concatenation** | An input value used without `Number()` — §8.2 |
| **Effect runs twice on mount** | Strict Mode in development. Expected — make cleanup correct — §11.5 |
| **Effect runs on every render** | A missing dependency array, or an object/function in the array — §11.2 |
| **Effect sees old values** | Missing dependency → stale closure. Or use an updater/ref — §6.2 |
| **Timers speed up over time** | An effect without cleanup, re-running — §11.2 |
| **"Rendered more hooks than during the previous render"** | A conditional hook or an early return before a hook — §12.4 |
| **"Cannot read properties of null" deep in a child** | A context consumer outside its provider — add the throwing wrapper hook — §14.1 |
| **Search shows results for a previous query** | A race condition — abort or use an ignore flag — §17.2 |
| **`undefined` in the UI where data should be** | A cast that lied about API or storage data — validate — §17.5 |
| **`npm run build` fails but `dev` works** | `dev` doesn't type-check. Read the `tsc` errors |
| **Whole app is a blank white page** | An uncaught render error and no boundary — §19.1 |
| **Everything is unstyled** | Bootstrap CSS not imported, or imported after your own |
| **Modals or dropdowns fire twice** | Bootstrap's JS bundle imported alongside React-Bootstrap |
| **Async test fails but the app works** | `getBy…` where you need `findBy…` — §21.3 |
| **"not wrapped in act(...)"** | A state update in a test outside `act()` — §21.2 |

### The four tools, and what each is for

1. **React DevTools → Components.** Select a component to see its live props, state, hooks and the context values it's consuming. Use it to answer "what does this component actually think is going on?"
2. **React DevTools → Profiler**, with "Highlight updates" on. Use it to answer "what re-rendered, and did it cost anything?"
3. **`console.log` at the top of the component body.** Unfashionable and extremely effective: it tells you how many times you rendered and what the values were each time. Log objects, not stringified summaries — the console lets you expand them.
4. **The TypeScript error, read bottom-up.** The last, most-indented line names the real mismatch — §0.8.10.

### A method for the hard ones

When a bug resists all four:

1. **Reproduce it in the lab.** Strip it to one component with one moving part. Half the time the bug becomes obvious during the stripping.
2. **Ask "is this state, or derived?"** A surprising number of stubborn bugs are two sources of truth disagreeing — §10.
3. **Ask "which render is this?"** Snapshot semantics (§6.2) explain most "impossible" values.
4. **Check identity, not just contents.** `Object.is(prev, next)` on the thing that didn't update. Mutation bugs and dependency-array bugs are both identity bugs.
5. **Add the missing state to the model.** If you're fighting flags that contradict each other, the fix is a discriminated union, not another flag — §5.3.

---

# Glossary

| Term | Meaning |
|---|---|
| **Component** | A function returning JSX; the unit of UI |
| **Props** | Read-only inputs passed from parent to child |
| **State** | Data a component owns and can change; changing it re-renders |
| **Render** | React calling your component function to get a UI description |
| **Commit** | React applying the minimum DOM changes for the new description |
| **Reconciliation** | Diffing the new UI description against the previous one |
| **Virtual DOM** | The in-memory tree React diffs before touching the real DOM |
| **Element** | The plain object JSX produces — a *description*, not a rendered thing |
| **Key** | Stable identity hint for list items, used during reconciliation |
| **Controlled component** | An input (or component) whose value is driven by React state |
| **Uncontrolled component** | One whose value lives in the DOM, read via a ref or `FormData` |
| **Lifting state up** | Moving state to the closest common ancestor of its consumers |
| **Derived state** | A value computed from state rather than stored |
| **Prop drilling** | Passing props through components that don't use them |
| **Side effect** | Work outside rendering: network, timers, storage, DOM, analytics |
| **Cleanup function** | What an effect returns; runs before the next effect and on unmount |
| **Stale closure** | A function holding values from an older render |
| **Snapshot** | The fixed set of state values a single render sees |
| **Batching** | Combining multiple state updates into one re-render |
| **Custom hook** | A `use`-prefixed function that composes other hooks |
| **Pure component** | Same props in, same JSX out, no external mutation during render |
| **Fragment** | `<>…</>` — groups elements without a DOM node |
| **Portal** | Rendering into a different DOM node while staying in the React tree |
| **Strict Mode** | Dev-only double-invocation to surface impure code and missing cleanup |
| **Error boundary** | A component that catches render-phase errors in its subtree |
| **Suspense** | A boundary that shows a fallback while content isn't ready |
| **Code splitting** | Emitting separate bundles loaded on demand (`lazy` + dynamic `import`) |
| **Memoisation** | Caching a value or a render result to skip repeating work |
| **Compound components** | Related parts sharing implicit state through context |
| **Render prop** | A prop (often `children`) that is a function returning UI |
| **Headless component** | Behaviour without markup, usually exposed as a hook |
| **Polymorphic component** | One that renders a caller-chosen element via `as` |
| **Server state** | A cached copy of data that lives elsewhere and can go stale |
| **Optimistic update** | Applying a change locally before the server confirms it |
| **Union type** | `"a" \| "b"` — a value restricted to listed options |
| **Discriminated union** | A union whose members share a literal tag field, enabling narrowing |
| **Narrowing** | TypeScript deducing a more specific type from control flow |
| **Type predicate** | `v is T` — a function that tells TS what a `true` return means |
| **Generic** | A type parameterised by another type, e.g. `Array<T>` |
| **Type assertion** | `x as T` — a claim you make; not checked at runtime |
| **`satisfies`** | Checks a value against a type without widening its literal types |
| **Structural typing** | TS compares shapes, not names — same shape means compatible |
| **Excess property check** | TS rejecting extra keys on an object *literal* assigned to a typed target |
| **Exhaustiveness check** | Using `never` to make a forgotten `switch` case a compile error |

---

# Appendix A — Complete lab index

Seventy-plus demos, in the order the notes introduce them. **Core** labs are the ones a one-day workshop should cover.

| Lab | Level | Proves | File |
|---|---|---|---|
| 0.1 Unions & `Record` | core | Unions autocomplete, reject typos, and force you to update every dependent lookup | `00-typescript/UnionsLab.tsx` |
| 1.1 Imperative vs declarative | core | Manual DOM edits are erased by the next render | `01-mental-model/ImperativeVsDeclarative.tsx` |
| 1.2 Render cascade | depth | Updates flow down a subtree, never up or sideways | `01-mental-model/RenderCascade.tsx` |
| 1.3 Purity & Strict Mode | depth | Strict Mode's double-invocation exposes impure components | `01-mental-model/PurityLab.tsx` |
| 2.1 Expression playground | core | `{}` holds any JavaScript expression, evaluated per render | `02-jsx/ExpressionPlayground.tsx` |
| 2.2 What renders / `&&` trap | core | `0` renders; `&&` returns its falsy left operand | `02-jsx/FalsyTrap.tsx` |
| 2.3 Fragments & spread | depth | Fragments avoid wrappers; spread order decides overrides | `02-jsx/AttributesLab.tsx` |
| 3.1 Typed props tour | core | The six prop shapes that cover almost every component | `03-props/PropsTour.tsx` |
| 3.2 Children & composition | core | Slots express more than nine boolean props | `03-props/CompositionLab.tsx` |
| 3.3 Extending native props | depth | `ComponentProps<typeof X>` inherits every prop for free | `03-props/NativePropsLab.tsx` |
| 3.4 Discriminated union props | depth | Invalid prop combinations become unwriteable | `03-props/UnionPropsLab.tsx` |
| 3.5 Data down, events up | core | Children report intent; parents own data and policy | `03-props/DataDownEventsUp.tsx` |
| 4.1 The index-key bug | **core** | Index keys make React reuse DOM nodes for the wrong data | `04-lists/KeyLab.tsx` |
| 4.2 `key` as a reset switch | depth | Changing a key remounts and resets state deliberately | `04-lists/KeyResetLab.tsx` |
| 4.3 Grouping & sorting | optional | Nested maps, sibling-scoped keys, typed `reduce` | `04-lists/GroupedListLab.tsx` |
| 5.1 The four idioms | core | Ternary, `&&`, guard clauses, lookup objects | `05-conditional/FourIdioms.tsx` |
| 5.2 Impossible states | **depth** | One union of four shapes replaces sixteen flag combinations | `05-conditional/StateMachineLab.tsx` |
| 6.1 Stale values & updaters | core | State is a per-render constant, so `setX(x+1)` twice adds 1 | `06-state/CounterLab.tsx` |
| 6.2 State is a snapshot | depth | Closures capture their render's values forever | `06-state/SnapshotLab.tsx` |
| 6.3 Mutate vs replace | core | A mutated array is the same reference, so nothing re-renders | `06-state/ImmutabilityLab.tsx` |
| 6.4 Lazy init & instances | depth | `useState(fn())` runs every render; `useState(fn)` runs once | `06-state/InitAndInstancesLab.tsx` |
| 6.5 Batching | optional | Many setters in one tick produce one render | `06-state/BatchingLab.tsx` |
| 7.1 Pass vs call | core | `onClick={fn()}` runs during render | `07-events/HandlerBasics.tsx` |
| 7.2 Bubbling & capture | depth | Events travel down then up; `stopPropagation` cuts the return trip | `07-events/PropagationLab.tsx` |
| 7.3 `target` vs `currentTarget` | depth | `currentTarget` is precisely typed; `target` needs narrowing | `07-events/TargetLab.tsx` |
| 7.4 Keyboard & focus | optional | Enter/Escape handling, and focus events bubbling in React | `07-events/KeyboardLab.tsx` |
| 8.1 One controlled input | core | The state→input→state loop, and everything derived from one string | `08-forms/SingleInputLab.tsx` |
| 8.2 TextField & Signup: structure | core | Finished markup that does nothing — `value` with no `onChange` | `08-forms/SignupLab.tsx` |
| 8.3 Wiring it up | core | Where the value must live; the field reports a value, not an event | `08-forms/SignupLab.tsx` |
| 8.4 Four useStates vs one object | core | State shape, and the typed field updater | `08-forms/SignupLab.tsx` |
| 8.5 Manual validation | core | Errors derived not stored; `touched`; handleSubmit's two exits | `08-forms/SignupLab.tsx` |
| 8.6 Every input kind (raw) | core | Which property to read for each input type | `08-forms/InputKindsLab.tsx` |
| 8.7 A component for every type | core | One contract, eleven components | `08-forms/AllFieldsLab.tsx` |
| 8.8 The full sign-up form | core | 14 fields, 11 types, zero new machinery | `08-forms/SignupFullLab.tsx` |
| 8.9 The full form with zod | core | Four lines change — numbers, arrays, files and enums go declarative | `08-forms/SignupFullZodLab.tsx` |
| 8.10 Controlled vs uncontrolled | core | The design react-hook-form is built on | `08-forms/ControlledLab.tsx` |
| 8.11 Full form with react-hook-form | core | `Controller` driving *your* components; `{...f}` is the whole glue | `08-forms/SignupFullRHFLab.tsx` |
| 8.12 Full form with RHF + zod | core | One resolver line, fourteen `rules` deleted | `08-forms/SignupFullRHFZodLab.tsx` |
| 9.1 Lifting to a common ancestor | core | Siblings can't see each other's state | `09-lifting/LiftingLab.tsx` |
| 9.2 Controlled + uncontrolled | depth | `value !== undefined` decides the mode | `09-lifting/ControlledComponentLab.tsx` |
| 10.1 Derived vs duplicated | core | A stored count must be updated everywhere; a derived one can't be wrong | `10-derived/DerivedLab.tsx` |
| 10.2 The derivation pipeline | core | Four inputs, a chain of pure transforms, no sync code | `10-derived/PipelineLab.tsx` |
| 10.3 Store the id | depth | A stored object goes stale on edit and ghosts on delete | `10-derived/SelectionLab.tsx` |
| 11.1 Effect timing & cleanup | **core** | Render → commit → paint → cleanup → effect, in declaration order | `11-effects/EffectTimingLab.tsx` |
| 11.2 Cleanup, or leak | core | Effects without cleanup stack up timers | `11-effects/IntervalLab.tsx` |
| 11.3 Subscribing to the world | depth | Listeners, media queries and observers, each with its teardown | `11-effects/SubscriptionsLab.tsx` |
| 11.4 You might not need an effect | **depth** | Three effects that should be deleted, and their replacements | `11-effects/NoEffectLab.tsx` |
| 11.5 `useLayoutEffect` | optional | Measuring in `useEffect` shows one wrong frame | `11-effects/LayoutEffectLab.tsx` |
| 12.1 `useToggle` & `as const` | core | Tuple returns need `as const`; object returns don't | `12-hooks/ToggleLab.tsx` |
| 12.2 `useLocalStorage<T>` | core | Generics carry the caller's type; two calls don't share state | `12-hooks/LocalStorageLab.tsx` |
| 12.3 `useDebouncedValue` | depth | A cleanup that cancels its own timer is a debounce | `12-hooks/DebounceLab.tsx` |
| 12.4 Rules of hooks | depth | React tracks hooks by call order, not by name | `12-hooks/RulesOfHooksLab.tsx` |
| 13.1 `useState` vs `useReducer` | core | Where the rules live when values depend on each other | `13-reducer/CounterCompareLab.tsx` |
| 13.2 Reducer as state machine | core | Guarded transitions make illegal moves unreachable | `13-reducer/WizardLab.tsx` |
| 13.3 Undo/redo | depth | Centralised changes make history a generic wrapper | `13-reducer/UndoRedoLab.tsx` |
| 13.4 Testing a reducer | **depth** | Pure functions are the cheapest tests in the codebase | `13-reducer/listReducer.test.ts` |
| 14.1 Prop drilling vs Context | core | Context removes plumbing; a throwing hook catches misuse | `14-context/PropDrillingLab.tsx` |
| 14.2 Theme context | core | A tree-wide, rarely-changing value is the textbook case | `14-context/ThemeLab.tsx` |
| 14.3 Split state/dispatch | **depth** | Two contexts halve the re-renders; `useMemo` can't | `14-context/SplitContextLab.tsx` |
| 14.4 Toast service | depth | Expose the API, not the queue, and consumers stop re-rendering | `14-context/ToastLab.tsx` |
| 15.1 Focus & measurement | core | Refs reach the DOM for focus, selection and measurement | `15-refs/DomRefLab.tsx` |
| 15.2 Ref vs state | core | Both survive renders; only state causes them | `15-refs/RefVsStateLab.tsx` |
| 15.3 Stopwatch | depth | Timer ids belong in refs; a `let` is recreated each render | `15-refs/StopwatchLab.tsx` |
| 15.4 `forwardRef` & handles | depth | Reaching a child's node, or exposing a chosen API | `15-refs/ForwardRefLab.tsx` |
| 16.1 `memo` & `useCallback` | core | `memo` alone does nothing against inline arrows | `16-performance/MemoLab.tsx` |
| 16.2 `useMemo` with real cost | depth | It earns its place at 5M iterations, not at 1,000 | `16-performance/UseMemoLab.tsx` |
| 16.3 Children as props | **depth** | Moving element creation beats memoising it | `16-performance/ChildrenAsPropsLab.tsx` |
| 16.4 A long list, measured | depth | Rendering is the cost, not deriving | `16-performance/LongListLab.tsx` |
| 17.1 Fetch by hand | core | `res.ok`, abort, `AbortError`, three states, `unknown` errors | `17-fetching/FetchByHandLab.tsx` |
| 17.2 Race conditions | **depth** | A slow response can overwrite a newer one | `17-fetching/RaceConditionLab.tsx` |
| 17.3 `useFetch` + union state | depth | One generic hook, four states, no impossible combinations | `17-fetching/UseFetchLab.tsx` |
| 17.4 Validate with zod | depth | A cast is a claim; a schema is a check | `17-fetching/ZodLab.tsx` |
| 17.5 TanStack Query | optional | Caching, dedup, optimistic updates with rollback | `17-fetching/QueryLab.tsx` |
| 18.1 Router shell | core | Real URLs, history, active links, in-app 404 | `RouterApp.tsx` |
| 18.2 URL as state | depth | Filters in the query string are shareable and refresh-proof | `18-routing/UrlStateLab.tsx` |
| 19.1 Error boundaries | core | Containment per subtree; nothing from handlers or promises | `19-errors/ErrorBoundaryLab.tsx` |
| 19.2 `Suspense` & `lazy` | depth | "Not ready" and "it broke" are different mechanisms | `19-errors/SuspenseLab.tsx` |
| 20.1 Compound components | depth | Parts share state via context; consumers own layout | `20-patterns/CompoundLab.tsx` |
| 20.2 Render props vs hooks | depth | Hooks by default; render props when the component owns the element | `20-patterns/RenderPropsLab.tsx` |
| 21.1 Component behaviour tests | core | Behaviour tests survive refactors; accessible queries find real bugs | `21-testing/TaskForm.test.tsx` |
| 21.2 Hook & async tests | depth | `renderHook` + `act`, and `findBy` vs `getBy` | `21-testing/useCounter.test.ts` |

## The complete registry

Paste this over `src/demos/registry.tsx` once you've built all the labs. Comment out the lines for labs you haven't written yet.

```tsx
import type { ReactNode } from "react"

import UnionsLab from "@/demos/00-typescript/UnionsLab"
import ImperativeVsDeclarative from "@/demos/01-mental-model/ImperativeVsDeclarative"
import RenderCascade from "@/demos/01-mental-model/RenderCascade"
import PurityLab from "@/demos/01-mental-model/PurityLab"
import ExpressionPlayground from "@/demos/02-jsx/ExpressionPlayground"
import FalsyTrap from "@/demos/02-jsx/FalsyTrap"
import AttributesLab from "@/demos/02-jsx/AttributesLab"
import PropsTour from "@/demos/03-props/PropsTour"
import CompositionLab from "@/demos/03-props/CompositionLab"
import NativePropsLab from "@/demos/03-props/NativePropsLab"
import UnionPropsLab from "@/demos/03-props/UnionPropsLab"
import DataDownEventsUp from "@/demos/03-props/DataDownEventsUp"
import KeyLab from "@/demos/04-lists/KeyLab"
import KeyResetLab from "@/demos/04-lists/KeyResetLab"
import GroupedListLab from "@/demos/04-lists/GroupedListLab"
import FourIdioms from "@/demos/05-conditional/FourIdioms"
import StateMachineLab from "@/demos/05-conditional/StateMachineLab"
import CounterLab from "@/demos/06-state/CounterLab"
import SnapshotLab from "@/demos/06-state/SnapshotLab"
import ImmutabilityLab from "@/demos/06-state/ImmutabilityLab"
import InitAndInstancesLab from "@/demos/06-state/InitAndInstancesLab"
import BatchingLab from "@/demos/06-state/BatchingLab"
import HandlerBasics from "@/demos/07-events/HandlerBasics"
import PropagationLab from "@/demos/07-events/PropagationLab"
import TargetLab from "@/demos/07-events/TargetLab"
import KeyboardLab from "@/demos/07-events/KeyboardLab"
import SingleInputLab from "@/demos/08-forms/SingleInputLab"
import SignupLab from "@/demos/08-forms/SignupLab"
import InputKindsLab from "@/demos/08-forms/InputKindsLab"
import AllFieldsLab from "@/demos/08-forms/AllFieldsLab"
import SignupFullLab from "@/demos/08-forms/SignupFullLab"
import SignupFullZodLab from "@/demos/08-forms/SignupFullZodLab"
import ControlledLab from "@/demos/08-forms/ControlledLab"
import SignupFullRHFLab from "@/demos/08-forms/SignupFullRHFLab"
import SignupFullRHFZodLab from "@/demos/08-forms/SignupFullRHFZodLab"
import LiftingLab from "@/demos/09-lifting/LiftingLab"
import ControlledComponentLab from "@/demos/09-lifting/ControlledComponentLab"
import DerivedLab from "@/demos/10-derived/DerivedLab"
import PipelineLab from "@/demos/10-derived/PipelineLab"
import SelectionLab from "@/demos/10-derived/SelectionLab"
import EffectTimingLab from "@/demos/11-effects/EffectTimingLab"
import IntervalLab from "@/demos/11-effects/IntervalLab"
import SubscriptionsLab from "@/demos/11-effects/SubscriptionsLab"
import NoEffectLab from "@/demos/11-effects/NoEffectLab"
import LayoutEffectLab from "@/demos/11-effects/LayoutEffectLab"
import ToggleLab from "@/demos/12-hooks/ToggleLab"
import LocalStorageLab from "@/demos/12-hooks/LocalStorageLab"
import DebounceLab from "@/demos/12-hooks/DebounceLab"
import RulesOfHooksLab from "@/demos/12-hooks/RulesOfHooksLab"
import CounterCompareLab from "@/demos/13-reducer/CounterCompareLab"
import WizardLab from "@/demos/13-reducer/WizardLab"
import UndoRedoLab from "@/demos/13-reducer/UndoRedoLab"
import PropDrillingLab from "@/demos/14-context/PropDrillingLab"
import ThemeLab from "@/demos/14-context/ThemeLab"
import SplitContextLab from "@/demos/14-context/SplitContextLab"
import ToastLab from "@/demos/14-context/ToastLab"
import DomRefLab from "@/demos/15-refs/DomRefLab"
import RefVsStateLab from "@/demos/15-refs/RefVsStateLab"
import StopwatchLab from "@/demos/15-refs/StopwatchLab"
import ForwardRefLab from "@/demos/15-refs/ForwardRefLab"
import MemoLab from "@/demos/16-performance/MemoLab"
import UseMemoLab from "@/demos/16-performance/UseMemoLab"
import ChildrenAsPropsLab from "@/demos/16-performance/ChildrenAsPropsLab"
import LongListLab from "@/demos/16-performance/LongListLab"
import FetchByHandLab from "@/demos/17-fetching/FetchByHandLab"
import RaceConditionLab from "@/demos/17-fetching/RaceConditionLab"
import UseFetchLab from "@/demos/17-fetching/UseFetchLab"
import ZodLab from "@/demos/17-fetching/ZodLab"
import UrlStateLab from "@/demos/18-routing/UrlStateLab"
import ErrorBoundaryLab from "@/demos/19-errors/ErrorBoundaryLab"
import SuspenseLab from "@/demos/19-errors/SuspenseLab"
import CompoundLab from "@/demos/20-patterns/CompoundLab"
import RenderPropsLab from "@/demos/20-patterns/RenderPropsLab"

export interface Demo {
  id: string
  chapter: string
  title: string
  element: ReactNode
}

export const demos: Demo[] = [
  { id: "unions", chapter: "0 — TypeScript", title: "Unions & Record", element: <UnionsLab /> },

  { id: "imperative-vs-declarative", chapter: "1 — Mental model", title: "Imperative vs declarative", element: <ImperativeVsDeclarative /> },
  { id: "render-cascade", chapter: "1 — Mental model", title: "Render cascade", element: <RenderCascade /> },
  { id: "purity", chapter: "1 — Mental model", title: "Purity & Strict Mode", element: <PurityLab /> },

  { id: "expressions", chapter: "2 — JSX", title: "Expression playground", element: <ExpressionPlayground /> },
  { id: "falsy-trap", chapter: "2 — JSX", title: "What renders / && trap", element: <FalsyTrap /> },
  { id: "attributes", chapter: "2 — JSX", title: "Fragments & spread", element: <AttributesLab /> },

  { id: "props-tour", chapter: "3 — Props", title: "Typed props tour", element: <PropsTour /> },
  { id: "composition", chapter: "3 — Props", title: "Children & composition", element: <CompositionLab /> },
  { id: "native-props", chapter: "3 — Props", title: "Extending native props", element: <NativePropsLab /> },
  { id: "union-props", chapter: "3 — Props", title: "Discriminated union props", element: <UnionPropsLab /> },
  { id: "data-down", chapter: "3 — Props", title: "Data down, events up", element: <DataDownEventsUp /> },

  { id: "keys", chapter: "4 — Lists & keys", title: "The index-key bug", element: <KeyLab /> },
  { id: "key-reset", chapter: "4 — Lists & keys", title: "key as a reset switch", element: <KeyResetLab /> },
  { id: "grouped-list", chapter: "4 — Lists & keys", title: "Grouping & sorting", element: <GroupedListLab /> },

  { id: "four-idioms", chapter: "5 — Conditional", title: "The four idioms", element: <FourIdioms /> },
  { id: "state-machine", chapter: "5 — Conditional", title: "Impossible states", element: <StateMachineLab /> },

  { id: "counter", chapter: "6 — useState", title: "Stale values & updaters", element: <CounterLab /> },
  { id: "snapshot", chapter: "6 — useState", title: "State is a snapshot", element: <SnapshotLab /> },
  { id: "immutability", chapter: "6 — useState", title: "Mutate vs replace", element: <ImmutabilityLab /> },
  { id: "init-instances", chapter: "6 — useState", title: "Lazy init & instances", element: <InitAndInstancesLab /> },
  { id: "batching", chapter: "6 — useState", title: "Batching", element: <BatchingLab /> },

  { id: "handler-basics", chapter: "7 — Events", title: "Pass vs call", element: <HandlerBasics /> },
  { id: "propagation", chapter: "7 — Events", title: "Bubbling & capture", element: <PropagationLab /> },
  { id: "target", chapter: "7 — Events", title: "target vs currentTarget", element: <TargetLab /> },
  { id: "keyboard", chapter: "7 — Events", title: "Keyboard & focus", element: <KeyboardLab /> },

  { id: "single-input", chapter: "8 — Forms", title: "One controlled input", element: <SingleInputLab /> },
  { id: "signup", chapter: "8 — Forms", title: "Signup (evolving: 8.2–8.5)", element: <SignupLab /> },
  { id: "input-kinds", chapter: "8 — Forms", title: "Every input kind", element: <InputKindsLab /> },
  { id: "all-fields", chapter: "8 — Forms", title: "A component for every type", element: <AllFieldsLab /> },
  { id: "signup-full", chapter: "8 — Forms", title: "The full form (manual)", element: <SignupFullLab /> },
  { id: "signup-full-zod", chapter: "8 — Forms", title: "The full form with zod", element: <SignupFullZodLab /> },
  { id: "controlled", chapter: "8 — Forms", title: "Controlled vs uncontrolled", element: <ControlledLab /> },
  { id: "signup-full-rhf", chapter: "8 — Forms", title: "Full form with react-hook-form", element: <SignupFullRHFLab /> },
  { id: "signup-full-rhf-zod", chapter: "8 — Forms", title: "Full form with RHF + zod", element: <SignupFullRHFZodLab /> },

  { id: "lifting", chapter: "9 — Lifting state", title: "Lifting to a common ancestor", element: <LiftingLab /> },
  { id: "controlled-component", chapter: "9 — Lifting state", title: "Controlled + uncontrolled", element: <ControlledComponentLab /> },

  { id: "derived", chapter: "10 — Derived state", title: "Derived vs duplicated", element: <DerivedLab /> },
  { id: "pipeline", chapter: "10 — Derived state", title: "The derivation pipeline", element: <PipelineLab /> },
  { id: "selection", chapter: "10 — Derived state", title: "Store the id", element: <SelectionLab /> },

  { id: "effect-timing", chapter: "11 — Effects", title: "Effect timing & cleanup", element: <EffectTimingLab /> },
  { id: "interval", chapter: "11 — Effects", title: "Cleanup, or leak", element: <IntervalLab /> },
  { id: "subscriptions", chapter: "11 — Effects", title: "Subscribing to the world", element: <SubscriptionsLab /> },
  { id: "no-effect", chapter: "11 — Effects", title: "You might not need an effect", element: <NoEffectLab /> },
  { id: "layout-effect", chapter: "11 — Effects", title: "useLayoutEffect", element: <LayoutEffectLab /> },

  { id: "use-toggle", chapter: "12 — Custom hooks", title: "useToggle & as const", element: <ToggleLab /> },
  { id: "use-local-storage", chapter: "12 — Custom hooks", title: "useLocalStorage<T>", element: <LocalStorageLab /> },
  { id: "debounce", chapter: "12 — Custom hooks", title: "useDebouncedValue", element: <DebounceLab /> },
  { id: "rules-of-hooks", chapter: "12 — Custom hooks", title: "Rules of hooks", element: <RulesOfHooksLab /> },

  { id: "reducer-compare", chapter: "13 — useReducer", title: "useState vs useReducer", element: <CounterCompareLab /> },
  { id: "wizard", chapter: "13 — useReducer", title: "Reducer as state machine", element: <WizardLab /> },
  { id: "undo-redo", chapter: "13 — useReducer", title: "Undo/redo", element: <UndoRedoLab /> },

  { id: "prop-drilling", chapter: "14 — Context", title: "Prop drilling vs Context", element: <PropDrillingLab /> },
  { id: "theme-context", chapter: "14 — Context", title: "Theme context", element: <ThemeLab /> },
  { id: "split-context", chapter: "14 — Context", title: "Split state/dispatch", element: <SplitContextLab /> },
  { id: "toast-context", chapter: "14 — Context", title: "Toast service", element: <ToastLab /> },

  { id: "dom-refs", chapter: "15 — Refs", title: "Focus & measurement", element: <DomRefLab /> },
  { id: "ref-vs-state", chapter: "15 — Refs", title: "Ref vs state", element: <RefVsStateLab /> },
  { id: "stopwatch", chapter: "15 — Refs", title: "Stopwatch (timer refs)", element: <StopwatchLab /> },
  { id: "forward-ref", chapter: "15 — Refs", title: "forwardRef & handles", element: <ForwardRefLab /> },

  { id: "memo", chapter: "16 — Performance", title: "memo & useCallback", element: <MemoLab /> },
  { id: "use-memo", chapter: "16 — Performance", title: "useMemo with real cost", element: <UseMemoLab /> },
  { id: "children-as-props", chapter: "16 — Performance", title: "Children as props", element: <ChildrenAsPropsLab /> },
  { id: "long-list", chapter: "16 — Performance", title: "A long list, measured", element: <LongListLab /> },

  { id: "fetch-by-hand", chapter: "17 — Fetching", title: "Fetch by hand", element: <FetchByHandLab /> },
  { id: "race-condition", chapter: "17 — Fetching", title: "Race conditions", element: <RaceConditionLab /> },
  { id: "use-fetch", chapter: "17 — Fetching", title: "useFetch + union state", element: <UseFetchLab /> },
  { id: "zod", chapter: "17 — Fetching", title: "Validate with zod", element: <ZodLab /> },

  // Needs router context — only works under RouterApp (Lab 18.1)
  { id: "url-state", chapter: "18 — Routing", title: "URL as state", element: <UrlStateLab /> },

  { id: "error-boundary", chapter: "19 — Errors", title: "Error boundaries", element: <ErrorBoundaryLab /> },
  { id: "suspense", chapter: "19 — Errors", title: "Suspense & lazy", element: <SuspenseLab /> },

  // Optional (Lab 17.5) — also needs the QueryClientProvider wired into main.tsx:
  // { id: "react-query", chapter: "17 — Fetching", title: "TanStack Query", element: <QueryLab /> },

  { id: "compound", chapter: "20 — Patterns", title: "Compound components", element: <CompoundLab /> },
  { id: "render-props", chapter: "20 — Patterns", title: "Render props vs hooks", element: <RenderPropsLab /> },
]

export const chapters = (): string[] => [
  ...new Set(demos.map((demo) => demo.chapter)),
]
```

# Appendix B — Concept check answers

Answer from memory first. If you can answer all of these, you can read and write production React with TypeScript.

**§0 — TypeScript**

1. `const` can't be reassigned, so TypeScript keeps the narrow literal type `"dark"`. `let` can, so it widens to `string` to allow future assignments. This is why `as const` exists.
2. `as Priority` is an assertion — a claim TypeScript accepts without checking. `value is Priority` is a type predicate on a function that *does* check at runtime, and TypeScript narrows based on its result. (It still trusts your logic, so a wrong predicate is a lie it believes.)
3. When you want the completeness check of a type annotation but need to keep the precise literal types of the values. A plain annotation widens them.
4. `any` disables type checking for that value and everything it touches. `unknown` accepts anything but permits nothing until you narrow, so the checking stays on.
5. `Task["title"]` is indexed access — the type of the `title` property (`string`). `keyof Task` is the union of the property *names* (`"id" | "title" | …`). Together they give you the typed field-updater pattern.

**§1 — The mental model**

1. Trigger (a state update), render (React calls your component functions), commit (React applies the minimum DOM changes). Your component function *is* the render phase.
2. No to both. A re-render means React called your function again; it may produce zero DOM changes, and it never resets state. Only unmounting resets state.
3. Because a parent's output *describes* its children, so React has to re-derive that description to know whether anything changed. Only the subtree is affected — never ancestors or siblings.
4. A different component type in that position, or a different `key`. Both mean "this is a different thing", so the node and its state are destroyed.
5. To surface impure components and missing effect cleanup in development. It doubles component function calls, effect mount/unmount, and reducer/`useMemo` calls — it does **not** double committed DOM changes, and it doesn't happen in production.

**§2 — JSX & TSX**

1. A plain JavaScript object describing what to render (`ReactElement`). Nothing has happened — no component has been called, no DOM touched. It's a description, which is why you can store it in an array.
2. Because `{}` holds an *expression*, and `if` is a *statement*. Use a ternary, `&&`, a guard clause, or a lookup object.
3. `&&` returns its left operand when that operand is falsy, `0` is falsy, and `0` is a renderable `ReactNode`. Fix with `items.length > 0 &&` or a ternary returning `null`.
4. Inside a `map`, because the `<>` shorthand cannot take a `key`.
5. `ReactElement` is one element object; `ReactNode` is anything renderable (elements, strings, numbers, `null`, arrays, …). Use `ReactNode` for `children`.

**§3 — Components & props**

1. One — a single object containing all the props. Destructuring in the parameter list is just destructuring that object.
2. The object belongs to the parent and React doesn't know you changed it, so nothing re-renders and the parent's state now disagrees with the screen. The bug surfaces later, somewhere unrelated.
3. Props for data, `children` (or named `ReactNode` slots) for UI. If the value you'd pass would be JSX, it wants to be a slot.
4. Every prop that component accepts, including ones added in future versions. Destructure `className` so you can merge the caller's classes with yours instead of one overwriting the other.
5. When one prop changes which *other* props are required or meaningful — e.g. an error variant that must have a retry callback. Optional props would let every invalid combination compile.

**§4 — Lists & keys**

1. Same key and type in the same position → reuse the DOM node and its state, patching only changed attributes. Different key → destroy the old node and create a new one, losing DOM and component state.
2. Because index means "position", and for a static list position and identity are the same thing. Prepend an item and every index now refers to different data, so React reuses nodes for the wrong items.
3. Because a fresh key every render means *every* item is destroyed and recreated on *every* render — losing focus, scroll and animations, and doing maximum DOM work.
4. No. `key` is consumed by React and never reaches your props. Pass the id separately if you need it.
5. Give the child a `key` that changes with the selection (`<Form key={selectedId} …/>`), which remounts it with fresh state. Better than an effect that copies props into state.

**§5 — Conditional rendering**

1. Ternary for two alternatives; `&&` for something sometimes absent.
2. They're unreadable and hard to reorder or extend. Extract a component with guard clauses — one `if` per case, top to bottom.
3. Sixteen combinations; usually about four make sense. The other twelve are reachable whenever code forgets to reset a flag.
4. Because then the data can only exist in the state it belongs to. There's no stale `tasks` array hanging around during an error, and reading it in the wrong branch is a compile error.
5. "Nothing exists yet" → onboarding: explain the screen and offer the create action. "Nothing matches your filter" → recovery: say what was searched and offer to clear it.

**§6 — `useState`**

1. `[]` alone infers `never[]`, so nothing is assignable to the element type. Annotate: `useState<Task[]>([])`.
2. Because `count` is a constant for the whole render, so both calls compute the same number and the second overwrites the first. Use `setCount(c => c + 1)`.
3. React compares by reference (`Object.is`). A mutated array is the same reference, so React concludes nothing changed and skips the render.
4. `useState(compute())` calls `compute` on **every** render and discards the result after the first. `useState(compute)` passes the function, and React calls it **once**, on mount.
5. Zero. Updates in the same tick are batched into one render, so splitting state costs nothing in renders. Group state for correctness, not performance.

**§7 — Events**

1. It calls the handler during render and passes React the return value. If the handler sets state, you get an infinite loop and "Too many re-renders".
2. `preventDefault` cancels the browser's default action (form submit, link navigation). `stopPropagation` stops the event reaching ancestor handlers.
3. Because on a mouse event *any* descendant could be the target, so the precise type is unknowable — it's `EventTarget`. `ChangeEvent<HTMLInputElement>` declares `target` as that input specifically, since an input has no children.
4. Annotate when the handler is a standalone function (no context to infer from). Inline handlers infer from the JSX attribute. A third option is to type the whole function with `ChangeEventHandler<T>` and let the parameter infer.
5. `e.key` is the character or named key produced ("a", "A", "Enter") — use it for text intent. `e.code` is the physical key ("KeyA") regardless of layout — use it for game-style controls.

**§8 — Forms**

1. Key press → change event → `onChange` calls the setter → React re-renders → `value={…}` puts the character on screen. **Step 5** does it: the input never updates itself.
2. Every field is pinned to `value=""` with no `onChange`, so React re-applies the empty string after each keystroke. What's missing is the second half of the loop — a way for the input to report changes.
3. So each instance gets a unique `id`. Two `Form.Group`s emitting the same `controlId` is invalid HTML, and clicking any label focuses the first input.
4. Because its value would live inside it, and data only flows down — the form can't read four private boxes. A form is precisely "something that collects several values and does one thing with them".
5. So the parent gets what it wants without touching the DOM: `onChange={setFirstName}` works with no wrapper, and the field could later be swapped for a masked input without changing any caller (§3.6).
6. Four `useState`s for a few independent fields — direct, and `onChange={setX}` needs no wrapper. One object when the fields belong to one entity, because reset, submit, dirty-checking and persistence each become one line. Fields that change *each other* want a reducer.
7. `function update<K extends keyof Values>(field: K, value: Values[K]) { setValues(prev => ({ ...prev, [field]: value })) }`
8. No. Any one of: it couples the field to the parent's state shape; it breaks the four-`useState` version, which has no `update` at all; or it breaks `Controller`, which hands components a bare-value `onChange`.
9. Because a derived value is recomputed from the current values every render and can never be stale. `setErrors` inside `update` validates the *previous* values and lags a keystroke behind.
10. The blocked path (log the failures and `return`) and the valid path (call the API). **The `return`** is the guarantee: exactly one route out of the handler reaches your API.
11. Running the rules constantly is right; *displaying* them constantly is hostile. `touched` separates "what is wrong" from "whether to mention it yet".
12. Any three of: the type is derived (`z.infer`) so rules and types can't drift; `safeParse` returns a discriminated union instead of throwing; `.refine()` makes cross-field rules first-class with a `path`; coercion fixes string-valued inputs at the boundary; the same schema validates API responses and `localStorage`.
13. `e.target.checked` for a checkbox; `Array.from(e.target.selectedOptions, o => o.value)` for a multi-select; `e.target.files?.[0]` for a file input (which can never be controlled).
14. `register` gives the input a `ref` and lets the DOM hold the value, so keystrokes never touch React state. You give up having the value available during render, unless you opt back in with `watch`.
15. Because `register`'s `validate` on `confirmPassword` only runs when *that* field is validated, so changing the password afterwards leaves a stale result — `deps` forces the other field to re-validate. A zod `.refine()` runs on every validation of the whole object, so the problem can't arise.
16. When the component doesn't render a real DOM input, or takes a non-DOM `onChange`. Our field components report `onChange(value)` and accept no `ref`, so `register` can't drive them — `Controller` hands over `{ value, onChange, onBlur }`, the contract chosen in §8.3.


**§9 & §10 — Lifting and deriving**

1. Their closest common ancestor. If only one child needs it, keep it in that child — as local as possible.
2. Decide the mode with `value !== undefined` (not truthiness); never write internal state while controlled; always call `onChange` in both modes.
3. Filtered/sorted lists, counts and totals, "is the form valid", search results, the selected object (given its id), progress percentages, formatted strings.
4. A stored object is a snapshot: it doesn't update when the original is edited, and it survives as a ghost when the original is deleted. Deriving with `find` follows edits and evaluates to `null` on deletion.
5. Because it renders once with the stale value, then again after the effect — a wrong frame, a second render, and a dependency array to get wrong. Deriving during render has none of those.

**§11 — Effects**

1. Analytics on a click → event handler (it happened because the user acted). `localStorage` sync → effect (it happens because state changed).
2. Before **every** re-run of the same effect, not only on unmount. So an effect keyed on `[userId]` tears down user A before setting up user B.
3. Because React compares dependencies by identity (`Object.is`), and an object literal is a new object every render. Depend on primitives, move it inside, or memoise.
4. Because it only removes a listener if given the *same function reference*. Two inline arrows are two different functions, so nothing matches.
5. Deriving data (derive during render), responding to a user action (do it in the handler), resetting state on a prop change (use a `key`), chaining state updates (compute both in one handler), notifying a parent (call the callback in the handler).

**§12 — Custom hooks**

1. It calls other hooks. If it doesn't, it's a plain function — and should be, because plain functions are testable and callable anywhere. Don't name it `use*`.
2. Because React tracks hook state by call order, not by name. A conditional hook shifts every later hook into a different slot, so they read each other's state.
3. Without it, TypeScript infers an array of the *union* of both element types, so both destructured variables get that useless union. Object returns don't need it — properties keep their own types.
4. No. They share code, not state. Each call has its own `useState`, so they only appear to agree after a reload when both read the same storage key.
5. Extract when the same effect plumbing appears twice, or a subscription needs cleanup, or you want to unit test it, or a name makes the caller read better. Don't extract single simple uses, markup (that's a component), or unrelated logic bundled together.

**§13 — `useReducer`**

1. State, actions, and the reducer. The **reducer** must be pure — no fetching, timers, randomness, mutation, or `Date.now()`.
2. If every case is handled, `action` is narrowed to `never` at `default`, and `never` is assignable to `never`. Add an action without a case and `action` is that type, which isn't assignable to `never` — a compile error naming the gap.
3. Because the reducer must be pure. Strict Mode double-invokes it, and an impure reducer can produce two different ids for one dispatch. Generate it in the handler and pass it in the action.
4. `dispatch` is referentially stable forever (no `useCallback` needed to pass it to memoised children or effects), and the action union documents every possible state change in one readable block.
5. Because it's a pure function: call it with a state and an action, assert on the result. No renderer, no DOM, no mocks, milliseconds to run.

**§14 — Context**

1. It solves prop drilling — getting a value from an ancestor to a descendant without intermediate props. It is often mistaken for a state manager; it's a transport mechanism, and the state still lives in `useState`/`useReducer`.
2. Because a plausible default lets a component rendered outside the provider work *silently* with fake data. A `null` default plus a throwing hook turns that into an immediate, clear failure.
3. The `if (!ctx) throw` narrows the type from `Value | null` to `Value`, so every consumer gets a non-nullable value and never writes `ctx?.x`.
4. Because `dispatch` never changes identity, so the dispatch context's value literally never changes and React has nothing to notify. `useMemo` on a combined value doesn't help, because the state half genuinely did change.
5. No. `memo` compares props, and context values bypass props entirely. Fix it by splitting contexts so the component subscribes only to what it uses.

**§15 — Refs**

1. It survives re-renders and it doesn't cause them. The second is what distinguishes it from state.
2. Because React attaches DOM nodes during the commit phase, which happens *after* your component function returns. Read refs in effects and handlers.
3. When the effect must react to the node arriving — assigning `ref.current` doesn't re-render, so nothing re-runs. Use `useState` as the ref (`ref={setNode}`), or a callback ref.
4. `forwardRef<ElementType, PropsType>` — element first, props second. (In React 19, `ref` is a normal prop and `forwardRef` is usually unnecessary.)
5. For genuinely imperative operations with no state to represent them: `focus()`, `scrollTo()`, `play()`, `measure()`. Otherwise lift the state and pass `value` + `onChange`.

**§16 — Performance**

1. Fix the structure, measure with the Profiler, then memoise the specific thing the measurement pointed at.
2. "It re-rendered" is usually harmless — a re-render producing identical output causes no DOM work. "It took 40ms" is a real problem. Optimise the second.
3. Because `memo` compares props shallowly, and an inline arrow is a new function object every render, so the comparison always fails. `memo` and `useCallback` only work as a pair.
4. Move the expensive element's *creation* to a component that doesn't re-render — pass it as `children` or a named slot. The already-created element can't be invalidated by the wrapper's state.
5. Keep state low, pass elements as children, split contexts, code-split routes, and virtualise long lists. All free, and often enough that memoisation is unnecessary.

**§17 — Fetching**

1. No. `fetch` only rejects on network-level failures. Check `res.ok` and throw yourself, or a 500's HTML error page gets parsed as JSON.
2. Two requests overlap and the slower, older one resolves last, overwriting newer data. Fix by aborting the previous request in the effect's cleanup (preferred), or by setting an `ignore` flag in cleanup and checking it before `setState`.
3. Because JavaScript can `throw` anything, not just an `Error`. Narrow with `err instanceof Error` before reading `.message`.
4. `as Task[]` is a claim the compiler accepts and never checks — bad data flows into typed state. `TaskSchema.parse()` actually validates at runtime and reports which field was wrong, at the boundary.
5. Server state is a cached copy of data that lives elsewhere, can go stale, and may be changed by someone else. It needs caching, revalidation and invalidation policies — which is what `useState` can't express.
6. It **rejects on 4xx/5xx** (so one `try`/`catch` replaces a `res.ok` check you'll forget), and it has **interceptors** (so auth headers and 401 handling are written once, not per call site). Automatic JSON parsing is convenient; those two change the shape of your code.
7. A **claim**. The generic tells the compiler what to expect and nothing verifies it — it's `as Task[]` in nicer clothes. Leave the generic off and `TaskListSchema.parse(res.data)` instead.
8. `baseURL`, `timeout`, the auth header, 401-handling and error normalisation all belong on the instance. **Validation does not** — it's per-endpoint, because each endpoint returns a different shape.
9. Pass an `AbortSignal` in the config and call `controller.abort()` in the effect's cleanup, exactly as with `fetch`. Distinguish it with `axios.isCancel(err)` rather than checking `err.name === "AbortError"`.

**§18 — Routing**

1. `Outlet` renders the matched child route inside a parent route's layout, so headers and containers are declared once.
2. It triggers a full page reload, discarding all application state and re-downloading the bundle. Use `Link`/`NavLink`.
3. Shareable, bookmarkable, survives refresh, the Back button works, and there's one source of truth. Costs: values are untrusted strings needing validation, and each change re-renders the route.
4. Push for a navigation the user should be able to undo with Back (changing a filter). Replace for a continuous stream of changes (typing in a search box) and for redirects.
5. `useParams` values are `string | undefined`, because a param can always be missing at runtime. Narrow before using it.

**§19 — Errors & Suspense**

1. React unmounts the **entire** application, leaving a blank page. Not just the broken component.
2. Event handlers and async code (promises, `setTimeout`). Handle both with ordinary `try`/`catch` plus an error state.
3. Because it relies on `getDerivedStateFromError` and `componentDidCatch`, which have no hook equivalents. Use `react-error-boundary` if you'd rather not write the class.
4. Either call a `reset` function that clears its error state, or change its `key` so React remounts the subtree.
5. `Suspense` handles "not ready yet" (a fallback while content loads). `ErrorBoundary` handles "it broke" (a fallback after a throw). Lazy-loaded routes need both.

**§20 — Patterns**

1. Compound components. The parts find shared state through context, so the consumer can arrange, wrap, or interleave them freely.
2. A custom hook. Render props are for when the component must own the element the behaviour attaches to, or must decide which children exist at all.
3. `as` lets the caller choose the underlying element, so styling and behaviour stay orthogonal — `Nav.Link as={NavLink}` gets Bootstrap's look and React Router's navigation.
4. It attaches the parts as static properties (`Tabs.Tab`), so typing `Tabs.` lists the whole API — the same reason `Card.Header` exists.
5. Start with `children` and a custom hook. Reach for the others only when those genuinely can't express what you need.

**§21 — Testing**

1. Behaviour tests interact the way a user does and assert on what's visible; implementation tests assert on internals. Only the first survives a refactor — which is what makes them worth maintaining.
2. `getBy` when it must be there now (throws if absent). `queryBy` to assert absence (returns `null`). `findBy` when it appears asynchronously (waits, returns a promise).
3. Because a role-and-name query only works if the markup is accessible. A test that's hard to write with accessible queries is reporting a real bug.
4. It flushes React's work so state updates are applied before your assertion runs. You need it around anything that triggers an update outside `render` or `userEvent` — mainly `renderHook` calls.
5. Worth testing: reducers and pure functions, validation, component behaviour including empty and error branches, and a regression test for each bug you fix. Not worth testing: that Bootstrap renders a card, exact class names, internal state variable names, every prop permutation.

**§22 — Redux Toolkit**

1. §13's reducer (a pure `(state, action) => newState`) moved outside the tree, reached with §14's transport. RTK's contribution is removing the boilerplate around it.
2. **Selective subscription** (`useSelector` re-renders only when *your* selected value changes) and **access outside React** (`store.getState()` / `store.dispatch()`). Context gives neither. DevTools and middleware are two more.
3. Because `createSlice` wraps every reducer in **Immer**, which hands you a draft proxy and produces a new immutable object from your mutations. Outside that proxy — in components, selectors, or a `useState` updater — §6.4's rule is unchanged.
4. Mutate the draft **or** return a new value, never both; and never mutate anything that isn't the draft. Breaking the first makes Immer throw with a clear message.
5. Because `.filter()` returns a **new array** every call, and `useSelector` compares with `===`. Fixes: select a primitive (`.length`), memoise with `createSelector`, or wrap the selector in `useShallow`.
6. `prepare` generates the action payload — so `crypto.randomUUID()` runs there instead of in the reducer. That's §13.3's "keep the reducer pure" rule, with a first-class place for the impurity.
7. `pending`, `fulfilled` and `rejected`, namespaced under the thunk's prefix (e.g. `tasks/fetch/pending`).
8. Because you caused it. An aborted request lands in `rejected` with `meta.aborted` true; showing it as a failure means every navigation flashes an error the user can do nothing about — §17.1's fourth bullet.
9. Server data (use RTK Query or TanStack Query — a hand-managed slice is a cache with no invalidation) and form drafts (§8.4 — every keystroke becoming a global action is a bad trade). Also anything one subtree owns (§9.1).
10. RTK when the app is large, several people touch the state, and one documented convention is worth the extra files — the "boilerplate" *is* the convention. Zustand when you want a store without a framework. The bad reason for either is "it's what serious apps use" or "it's less code".

**§23 — Zustand**

1. The curried form is what lets TypeScript infer the `set`/`get` parameter types. `create<T>(…)` works for a bare store but degrades as soon as you add middleware, so write `create<T>()(…)` always.
2. The **entire store** — so the component re-renders on any change to any field. It silently undoes the reason you chose Zustand, which is why it's the commonest mistake.
3. An object literal is a new reference every render, and the default comparison is `===`. Fix with `useShallow`, or select each primitive separately (often clearer and free).
4. `set` **merges** shallowly — the opposite of `useState`. Pass `true` as the second argument to replace the whole state, which also drops your actions unless you include them.
5. **Validate** rehydrated data (do it in `merge` — storage is untrusted input, §17.5), and **version safely** (a shape change needs `version` + `migrate`, or returning users rehydrate yesterday's shape).
6. It selects which slice of the store gets written to storage. Transient UI state — an active filter, an open modal, a search box — shouldn't survive a reload.
7. So one slice can read and call another's state through `get()`. The last parameter is what *this* slice contributes; the first is the whole store it lives in.
8. Server data as a source of truth (it's a cache with no deduplication or revalidation — use a query library) and form drafts. Also anything a single subtree owns.
9. It buys you use outside React — an axios interceptor, a router guard, a test — with no tree position. The risk is that global-by-default makes it easy to put state there that should have stayed local (§9.1).
10. Honest: the app is large, several people edit the state, and you need a shared convention more than you need brevity. Bad: "Redux is what real apps use."


---

# Where to go next

You now have every fundamental needed to read and write production React with TypeScript, plus a lab app you can keep extending. The next layer:

**Immediate**

- **react-hook-form + zod** — replace hand-rolled form state. Zod schemas generate types, so validation and types never drift apart. Lab 8.4 built the manual version; you'll appreciate what the library does.
- **TanStack Query** — server state done properly, with excellent TypeScript inference. Lab 17.5 is a starting point; the docs on `staleTime` vs `gcTime`, and on infinite queries, are worth reading in full.
- **react-router**'s data APIs — `createBrowserRouter` with `loader` and `action`, which fetch before rendering and eliminate loading-spinner cascades.

**Then**

- **Testing in depth** — Vitest + React Testing Library beyond §21: MSW for intercepting network requests, and Playwright for end-to-end tests. Test behaviour, not implementation.
- **Deeper TypeScript** — generic components, `satisfies` in anger, template literal types, conditional types, and the `strict` flags you aren't using yet (`noUncheckedIndexedAccess` is the highest-value one to turn on next).
- **Accessibility** — semantic HTML, focus management, keyboard navigation, `aria-live` regions. Run `axe` DevTools over your own app and fix what it finds; §21's query priority has already pushed you most of the way.
- **The React Compiler** — check whether it's available for your setup. Where it is, most manual memoisation becomes unnecessary, and §1.4's purity rules become load-bearing.
- **Bootstrap theming** — Sass variable overrides, and 5.3's dark mode via `data-bs-theme` (Lab 14.2 is the starting point).
- **Server-side React** — Next.js or React Router in framework mode: Server Components, streaming, and the data-loading model that follows from them. Everything in this document still applies inside client components.
- **Deployment** — `npm run build` (which type-checks), then Vercel, Netlify, or any static host. Add `npm run test:run` and `tsc --noEmit` to CI.

**Extend TaskBoard yourself.** The most valuable exercise now is adding features without a guide. Roughly in order of difficulty:

1. **Due dates** with `<Form.Control type="date">`, and an "overdue" badge — derived, of course, not stored.
2. **Sorting** by priority or creation date. Add a `SortKey` union and put it in the URL alongside the filter.
3. **Clear completed**, with the button disabled when nothing is completed. The reducer case already exists.
4. **Dark mode**, using Lab 14.2's `ThemeProvider` and `data-bs-theme` on `document.documentElement`, persisted with `useLocalStorage`.
5. **A task detail route** at `/tasks/:id`, with a proper redirect for an unknown id.
6. **Undo**, using Lab 13.3's `withHistory` wrapper around `tasksReducer`. It should work almost unchanged — that's the payoff for a pure reducer.
7. **Multiple boards**, which means a second reducer, nested routes, and a real decision about state shape.
8. **Drag-and-drop reordering** with `dnd-kit`, which will teach you more about refs and controlled components than any tutorial.
9. **A real REST API** with TanStack Query and zod, replacing `localStorage` entirely. Then add optimistic updates.
10. **Tests for each of the above**, written before the feature where you can.

**Reference**

- [react.dev](https://react.dev) — the official docs; genuinely excellent, especially the Learn section and "You Might Not Need an Effect"
- [react-bootstrap.github.io](https://react-bootstrap.github.io/) — component APIs and props
- [getbootstrap.com](https://getbootstrap.com/docs/5.3/) — utility classes, grid, and theming
- [typescriptlang.org/docs/handbook](https://www.typescriptlang.org/docs/handbook/intro.html) — the TypeScript handbook
- [react-typescript-cheatsheet.netlify.app](https://react-typescript-cheatsheet.netlify.app/) — the community React+TS reference
- [testing-library.com/docs/queries/about](https://testing-library.com/docs/queries/about/#priority) — the query priority list, worth bookmarking
- [tanstack.com/query](https://tanstack.com/query/latest) — TanStack Query
- [zod.dev](https://zod.dev) — schema validation

---

**One last thing.** When a type error looks impenetrable, read it from the **bottom up**. TypeScript reports the outermost mismatch first and the actual incompatibility last. The final line is almost always the one that tells you what's really wrong.

And when a *runtime* bug looks impenetrable, reach for the lab. Reproduce it as one component with one moving part. Most of the time the bug becomes obvious somewhere during the stripping-away — which is the whole reason the lab exists.
