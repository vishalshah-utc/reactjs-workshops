import { useState, type ReactNode } from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { Alert, Button } from 'react-bootstrap';
import { ArrowClockwise, Bug } from 'react-bootstrap-icons';
import { logger } from '../config/logger';

interface WidgetBoundaryProps {
  /** For the fallback's sentence and the log line: "The cart hit a problem". */
  name: string;
  children: ReactNode;
  /** When any of these change, a boundary showing its fallback resets and re-renders the children. */
  resetKeys?: unknown[];
  /** Runs on every reset — the place to clear whatever state caused the throw. */
  onReset?: () => void;
}

/** A component that throws WHILE RENDERING. Nothing else — a throw in an effect or a handler is not caught by a boundary. */
function Bomb(): never {
  throw new Error('Boom — a render error, thrown on purpose.');
}

/** The fallback is a component: it receives the error and a function that clears the boundary's state and re-renders the children. */
function WidgetFallback({ error, resetErrorBoundary, name }: FallbackProps & { name: string }) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <Alert variant="danger" className="d-flex align-items-start gap-2 mb-0">
      <div className="flex-grow-1">
        <div className="fw-semibold">The {name} hit a problem</div>
        <div className="small">{message}</div>
      </div>
      <Button size="sm" variant="outline-danger" onClick={resetErrorBoundary}>
        <ArrowClockwise className="me-1" />
        Try again
      </Button>
    </Alert>
  );
}

/**
 * A PER-WIDGET error boundary: a widget that throws while rendering is replaced by a small alert with a working
 * "Try again"; the page around it — the header, the route, the other widgets — never notices. Demo 10's route
 * boundaries are the same mechanism one level up: a loader or a page throws, the ROUTE is replaced.
 *
 * `react-error-boundary`'s <ErrorBoundary> is a class component under the hood — getDerivedStateFromError and
 * componentDidCatch have no hook equivalents, and React does not plan any — but you never write the class.
 */
export function WidgetBoundary({ name, children, resetKeys = [], onReset }: WidgetBoundaryProps) {
  // Development only — and it is the raw Vite constant, not env.isDev, ON PURPOSE: `import.meta.env.DEV` is
  // replaced by `false` at build time and the whole branch is dead code the bundler removes. A property read on
  // the env object cannot be eliminated, so the bomb would ship. (env.ts is still the only place for CONFIG.)
  const [broken, setBroken] = useState(false);

  return (
    <>
      {import.meta.env.DEV && (
        <Button size="sm" variant="outline-warning" className="mb-2" onClick={() => setBroken(true)} disabled={broken}>
          <Bug className="me-1" />
          Break this widget
        </Button>
      )}
      <ErrorBoundary
        // A render prop, not a component created in render: `FallbackComponent={(p) => …}` would be a new component
        // type on every render and remount the fallback each time.
        fallbackRender={(props) => <WidgetFallback {...props} name={name} />}
        // The bomb's state is a reset key too: "Try again" clears the boundary AND defuses the bomb via onReset.
        resetKeys={[broken, ...resetKeys]}
        onReset={() => {
          setBroken(false);
          onReset?.();
        }}
        onError={(error, info) => logger.error(`[boundary:${name}]`, error, info.componentStack ?? '')}
      >
        {broken && <Bomb />}
        {children}
      </ErrorBoundary>
    </>
  );
}
