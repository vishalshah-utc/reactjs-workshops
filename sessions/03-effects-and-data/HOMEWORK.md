# Session 3 Homework

**~45 minutes.** Task 1 is the one to do.

---

## Task 1 — `usePolling`, and why it gets ugly (18 min)

⭐ **The important one.** It is also a deliberate setup for Session 5.

Stock changes while people shop. Make the grid refresh itself every 15 seconds.

**Requirements**

1. Write `src/hooks/usePolling.ts`:
   ```tsx
   usePolling(callback: () => void, intervalMs: number | null)
   ```
   `null` means paused. Use it in `App` to call `refetch()`.

2. **Do not poll a tab nobody is looking at.** Listen for `visibilitychange`
   and pause when `document.hidden`. A backgrounded tab polling every 15
   seconds is a real cost on someone's battery and your servers.

3. **Do not poll while offline.** You already have `useOnlineStatus`.

4. **The interval must not capture a stale callback.** This is the interesting
   part. If you write:
   ```tsx
   useEffect(() => {
     const id = setInterval(callback, intervalMs);
     return () => clearInterval(id);
   }, [intervalMs]);          // callback not in deps
   ```
   the interval keeps calling the *first* `callback` it ever saw, closing over
   the first render's props forever. Add `callback` to the deps and the
   interval is destroyed and recreated on every render, so it never fires.

   That is the **stale closure** problem. Look up the `useRef` pattern that
   solves it — store the latest callback in a ref, read the ref inside the
   interval. Write down why the ref fixes it.

**Then notice what you have built.** Refetching resets `status` to `'loading'`,
so the whole grid flashes to skeletons every 15 seconds. You want *background*
refresh: keep showing stale data, quietly update it.

Try to add that. You will need to distinguish "loading for the first time"
from "refreshing in the background", which means another status, which means
`useProducts` grows a second flag, which then interacts with the four states.

**Stop when it feels bad, and write down what you'd want instead.** Session 5
gives you exactly that in one option called `keepPreviousData` — and you will
appreciate it far more for having tried.

---

## Task 2 — `useDocumentTitle` (10 min)

Show the cart count in the browser tab: `ShopCrew (3)`.

**Requirements**

- One hook, one effect, one dependency.
- **It needs a cleanup.** Ask yourself what should happen when the component
  using it unmounts — should the title stay changed forever? Capture the
  previous title and restore it.
- No count → just `ShopCrew`, not `ShopCrew (0)`.

**Watch out:** capture the old title *inside* the effect, not in the component
body. In the body it is read on every render; inside the effect it is read at
the moment the effect runs, which is what you want to restore.

---

## Task 3 — Retry with backoff (17 min)

The API has an endpoint that fails about 40% of the time:

```
/api/flaky?rate=0.4
```

Add automatic retry to `src/lib/api.ts`: on a 5xx or a network failure, retry
up to 3 times with **exponential backoff** — wait 300ms, then 600ms, then
1200ms.

**Requirements**

- **Only retry what is worth retrying.** A 500 might succeed next time. A 404
  or a 422 will not — retrying those wastes time and hides the real error.
- **Never retry an abort.** An `AbortError` means we cancelled deliberately.
  Retrying it defeats Lab 3 entirely.
- Exponential, not fixed. Three requests 300ms apart during an outage is worse
  than useless — you are adding load to something already failing.

**Test it:** call `/api/flaky?rate=0.9` in a loop and watch it usually succeed
eventually. Then `rate=1` and watch it give up after 3.

**Stretch:** add jitter — a small random amount on each delay. Without it,
every client that failed at the same moment retries at the same moment, and you
have built a thundering herd. This is a real production concern, not a detail.

---

## Bring to Session 4

Set up a view you would want to share: a category, a search, sorted by price.

Now look at the address bar: `localhost:5173/`.

> Answer these three in a sentence each:
>
> 1. How would you send a colleague **exactly** this view?
> 2. What happens when you press refresh?
> 3. What does the browser's **back** button do?

That is Session 4's cold open, and you will have already felt it.
