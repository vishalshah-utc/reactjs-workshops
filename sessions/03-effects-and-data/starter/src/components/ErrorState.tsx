import { AlertTriangleIcon, RefreshCwIcon, WifiOffIcon } from 'lucide-react';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  error: Error | ApiError | null;
  onRetry: () => void;
  isOnline?: boolean;
}

/**
 * What to show when a request fails.
 *
 * Two rules that most error states break:
 *
 *  1. **Always offer a way out.** An error with no retry button is a dead end,
 *     and the user's only remaining option is to reload the whole app.
 *  2. **Say something true and specific.** "Something went wrong" tells the
 *     user nothing and tells you nothing when they report it. A status code
 *     and a real message cost nothing and save a support round trip.
 */
export function ErrorState({ error, onRetry, isOnline = true }: ErrorStateProps) {
  const offline = !isOnline;
  const status = error instanceof ApiError ? error.status : null;

  return (
    <div
      // `role="alert"` announces this immediately — the one place interrupting
      // a screen reader is the right call, because the content they were
      // waiting for is not coming.
      role="alert"
      className="border-destructive/40 bg-destructive/5 flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center"
    >
      {offline ? <WifiOffIcon className="text-destructive size-8" /> : <AlertTriangleIcon className="text-destructive size-8" />}

      <div className="space-y-1">
        <p className="font-medium">
          {offline ? "You're offline" : "Couldn't load products"}
        </p>
        <p className="text-muted-foreground max-w-sm text-sm">
          {offline
            ? 'Check your connection — we will try again as soon as you are back.'
            : (error?.message ?? 'The request did not complete.')}
        </p>
        {status !== null && (
          <p className="text-muted-foreground/70 text-xs tabular-nums">HTTP {status}</p>
        )}
      </div>

      <Button variant="outline" size="sm" onClick={onRetry} disabled={offline}>
        <RefreshCwIcon />
        Try again
      </Button>
    </div>
  );
}
