import type { ReactNode } from 'react';

interface WidgetBoundaryProps {
  /** For the fallback's sentence and the log line: "The cart hit a problem". */
  name: string;
  children: ReactNode;
  /** When any of these change, a boundary showing its fallback resets and re-renders the children. */
  resetKeys?: unknown[];
  /** Runs on every reset — the place to clear whatever state caused the throw. */
  onReset?: () => void;
}

// TODO(lab-5.1): react-error-boundary's <ErrorBoundary> with a fallbackRender (Alert + "Try again" → resetErrorBoundary),
// resetKeys, onReset and onError → logger
// TODO(lab-5.3): a dev-only "Break this widget" button (behind import.meta.env.DEV) that renders a <Bomb /> which throws in render;
// its state is a reset key, defused in onReset — so "Try again" really recovers
/** Placeholder: a pass-through. A throwing child still takes the whole route down. */
export function WidgetBoundary({ children }: WidgetBoundaryProps) {
  return <>{children}</>;
}
