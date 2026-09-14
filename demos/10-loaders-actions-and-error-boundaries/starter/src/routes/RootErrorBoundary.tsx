/** Catches anything thrown under the root route. Lab 5.1 makes it useful. */
// TODO(lab-5.1): useRouteError() (unknown); branch on isRouteErrorResponse / instanceof Error / anything else; dev-only stack; a way home
export function RootErrorBoundary() {
  return <p>Something went wrong.</p>;
}
