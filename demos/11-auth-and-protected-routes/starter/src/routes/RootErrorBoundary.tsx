import { Alert, Button, Container } from 'react-bootstrap';
import { Link, isRouteErrorResponse, useRouteError } from 'react-router';
import { env } from '../config/env';
import { ApiError } from '../lib/ApiError';

/**
 * The safety net. Catches loader, action AND render errors anywhere under the
 * root route. It renders its own Container because if the root loader failed,
 * RootLayout never rendered — there is no layout to sit inside.
 *
 * useRouteError() returns `unknown` — three shapes to narrow, in order.
 */
// TODO(lab-5.3): a 403 branch — "Not allowed", with a link back to /account
export function RootErrorBoundary() {
  const error = useRouteError();

  let title = 'Something went wrong';
  let message = 'An unexpected error occurred. Please try again.';
  let status: number | undefined;
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    // 1. A Response thrown with data() / redirect(): has status + statusText
    status = error.status;
    title = status === 404 ? 'Page not found' : `${status} ${error.statusText}`;
    const body = error.data as { message?: unknown } | null;
    if (typeof body?.message === 'string') message = body.message;
  } else if (error instanceof Error) {
    // 2. A real Error — our ApiError lands here (and it carries a status)
    message = error.message;
    stack = error.stack;
    if (error instanceof ApiError) status = error.status;
  }
  // 3. anything else — someone threw a string — keeps the defaults

  return (
    <Container className="py-5">
      <Alert variant="danger">
        <Alert.Heading>{title}</Alert.Heading>
        <p>{message}</p>

        {env.isDev && stack && (
          <pre className="small bg-body-secondary p-2 rounded mt-3 mb-0" style={{ maxHeight: 240 }}>
            {stack}
          </pre>
        )}

        <hr />
        <div className="d-flex gap-2">
          <Link to="/products" className="btn btn-outline-danger">
            Back to products
          </Link>
          {(status === undefined || status >= 500) && (
            <Button variant="danger" onClick={() => window.location.reload()}>
              Reload
            </Button>
          )}
        </div>
      </Alert>
    </Container>
  );
}
