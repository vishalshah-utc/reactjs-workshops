import { Alert, Button } from 'react-bootstrap';
import { Link, isRouteErrorResponse, useRouteError } from 'react-router';

/** Scoped to the product route, so a missing product keeps the navbar and layout alive. */
export function ProductErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    const body = error.data as { message?: unknown } | null;
    return (
      <Alert variant="warning">
        <Alert.Heading className="h5">Product not found</Alert.Heading>
        <p>{typeof body?.message === 'string' ? body.message : "That product doesn't exist, or it was removed."}</p>
        <Link to="/products" className="btn btn-outline-secondary">
          Browse all products
        </Link>
      </Alert>
    );
  }

  // Anything else — including an ApiError from a network failure.
  return (
    <Alert variant="danger">
      <Alert.Heading className="h5">Couldn't load this product</Alert.Heading>
      <p>{error instanceof Error ? error.message : 'Please try again.'}</p>
      <Button variant="outline-danger" onClick={() => window.location.reload()}>
        Retry
      </Button>
    </Alert>
  );
}
