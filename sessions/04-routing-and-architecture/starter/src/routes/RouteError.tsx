import { Link } from 'react-router';
import { AlertTriangleIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * The route-level error boundary.
 *
 * ── What this catches, and what it does not ────────────────────────────────
 *
 * `errorElement` on a route catches anything thrown while RENDERING that route
 * or its children — including a `throw` from a loader, and a `useRouteError`
 * response from a 404-ish data fetch.
 *
 * It does NOT catch:
 *   - errors inside event handlers (use try/catch — the handler is your code
 *     running normally, not React rendering)
 *   - errors in async callbacks that have already escaped the render
 *   - errors thrown after the component unmounted
 *
 * ── Why an error boundary at all ───────────────────────────────────────────
 *
 * Without one, a single thrown error unmounts the ENTIRE React tree. Not the
 * broken component — everything. The user gets a white page with no header, no
 * navigation, and no indication that anything else on the site still works.
 *
 * Putting the boundary on the layout's children (rather than on the layout
 * itself) is what keeps the header and footer alive while one page fails.
 *
 * TODO(lab-2.3): read the actual error and show it.
 *
 * React Router hands the thrown value to `useRouteError()`. Import it from
 * 'react-router', call it, and render something useful:
 *
 *   const error = useRouteError();
 *
 * Then narrow it. Two cases are worth distinguishing:
 *
 *   - `isRouteErrorResponse(error)` — a Response the router threw, so
 *     `error.status` (404, 500) and `error.statusText` are available. Show the
 *     status.
 *   - `error instanceof Error` — an ordinary exception, so `error.message`.
 *
 * Show the message in development and a generic line in production
 * (`import.meta.env.DEV`) — a stack trace on a customer's screen is an
 * information leak and tells them nothing they can act on.
 *
 * Guide, Lab 2 step D.
 */
export function RouteError() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div
        role="alert"
        className="border-destructive/40 bg-destructive/5 flex flex-col items-center gap-4 rounded-xl border border-dashed py-24 text-center"
      >
        <AlertTriangleIcon className="text-destructive size-10" />
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">Something went wrong</h1>
          <p className="text-muted-foreground max-w-sm text-sm">
            {/* TODO(lab-2.3): replace this with the real error, narrowed as
                described above. */}
            This page hit an error it could not recover from.
          </p>
        </div>
        <div className="flex gap-2">
          {/* A full reload is a legitimate recovery for a render error: the
              component tree is in an unknown state, and remounting it is the
              only honest way back. */}
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Reload the page
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/">Back to the storefront</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
