# ReactJS Professional Workshop Series

Ten hands-on sessions that take a working developer from "I can read JSX" to
"I can join an enterprise React codebase and be productive without
hand-holding".

You build **one product across all ten sessions** — *ShopCrew*, a commerce
platform with a storefront, a customer account area and a full back-office —
against a **real backend** with authentication, roles, pagination, real-time
events and file upload.

**Everything runs in the browser.** No local setup required.

---

## Start here

| | |
|---|---|
| 📋 **[Course plan](./PLAN.md)** | The full curriculum, the technology choices and why |
| 🔌 **[API reference](./api/README.md)** | The backend every session runs against |

## The ten sessions

| # | Session | What you ship | Open |
|---|---|---|---|
| 1 | **[Foundations & the Component Model](./sessions/01-foundations/)** | Storefront shell + product grid | [▶ starter](https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/sessions/01-foundations/starter) |
| 2 | State, Events & Controlled UI | Facets, sort, local CRUD, the cart reducer | *coming soon* |
| 3 | Effects, the Network & Custom Hooks | Real API, loading/error/empty states | *coming soon* |
| 4 | Routing & Application Architecture | Multi-page, shareable filtered URLs | *coming soon* |
| 5 | Server State with TanStack Query | Infinite scroll, optimistic cart | *coming soon* |
| 6 | Auth, RBAC & the Storefront/Back-office Split | Login, roles, two dashboards | *coming soon* |
| 7 | Production-Grade Forms | Checkout wizard, promotion builder | *coming soon* |
| 8 | Global State, Real-Time & Notifications | Live orders wall, live stock | *coming soon* |
| 9 | Performance & Advanced Patterns | Virtualized admin grid, generic DataTable | *coming soon* |
| 10 | Testing, Quality Gates & Shipping | Tests, CI, Docker, capstone | *coming soon* |

Each session folder holds a **participant guide**, a one-page **cheat sheet**,
**homework**, and a self-contained **starter**.

**Solutions are published here right after each session runs.** They are held
back until then on purpose — several labs are built around discovering
something for yourself, and reading ahead spends that for nothing. Once a
session has happened its solution stays up, for the homework and for diffing
against your own work.

## How to open a session

**One click, no account:** use the ▶ starter link above. It boots straight into
a running app.

> ⚠️ **Click it once per session, then bookmark the tab.** Every click of a
> `/fork/` link creates a *fresh copy* of the starter — it does not reopen your
> earlier work. After it loads, the address bar becomes `stackblitz.com/edit/…`;
> that URL is your project, so bookmark it and return through the bookmark.
>
> Nothing is created on GitHub. `/fork/` is a StackBlitz-only concept — no
> repository is forked and your GitHub account is untouched.

**Want your work to persist between sessions?** Sign in to StackBlitz with
GitHub first (free, unlimited public projects), then use the same link.

**Want your own repo?** **Fork** this one — that gives you GitHub's *Sync fork*
button, so any fix made during the course reaches you. Then open
`https://stackblitz.com/fork/github/YOUR-USERNAME/reactjs-workshops/tree/main/sessions/01-foundations/starter`.

> Deliberately **not** a template repository: "Use this template" creates an
> unrelated git history, so `git pull upstream main` fails and you can never
> receive a fix. A fork shares history and can.

**Locally:**

```bash
git clone https://github.com/vishalshah-utc/reactjs-workshops.git
cd reactjs-workshops/sessions/01-foundations/starter
npm install && npm run dev
```

Node 20.19+ or 22.12+.

## The backend

Sessions 1–2 use a bundled data file — they are about components and local
state, and a network layer would be noise. From Session 3 the app talks to the
**ShopCrew API**: 5,000 products, 12,000 orders, JWT auth with refresh
rotation, five roles, WebSocket broadcast, and deliberate teaching hooks
(`?_delay=1500`, `?_fail=422`, `/api/flaky`) so loading and error states are
testable on demand rather than theoretical.

It runs in the same browser tab as your app. See **[api/README.md](./api/README.md)**.

Demo logins — every account uses the password `password`:

| Email | Role |
|---|---|
| `customer@shopcrew.dev` | CUSTOMER |
| `csr@shopcrew.dev` | CSR |
| `catalog@shopcrew.dev` | CATALOG_MANAGER |
| `fulfilment@shopcrew.dev` | FULFILMENT |
| `admin@shopcrew.dev` | ADMIN |

## Stack

React 19 · TypeScript · Vite 8 · Tailwind CSS v4 · shadcn/ui · React Router 7 ·
TanStack Query v5 · React Hook Form + Zod · Zustand · Vitest + Testing Library
+ MSW · Playwright

## For trainers

Trainer scripts and unreleased solutions live in a **separate private repo**,
`reactjs-workshops-trainer`. They are not here, and they must not be added
here — `scripts/verify-sessions.mjs` fails the build if a `TRAINER.md` appears
in this repo.

If you are running a session and do not have access, ask Vishal.

```bash
node scripts/verify-sessions.mjs   # structure checks, run before any session
```
