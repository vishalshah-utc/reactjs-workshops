/** Scoped to the product route: a missing product should not take the navbar with it. Lab 5.2. */
// TODO(lab-5.2): a friendly 404 for isRouteErrorResponse(error) && error.status === 404; a generic branch otherwise
export function ProductErrorBoundary() {
  return <p>Couldn't load this product.</p>;
}
