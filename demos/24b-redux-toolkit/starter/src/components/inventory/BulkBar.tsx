/**
 * TODO(lab-5.5): selection, bulk restock, honest partial failure, and undo.
 *
 * What this component must NOT contain: the twelve requests, the concurrency
 * limit and the cancellation. It dispatches ONE action —
 * `bulkRestockRequested(10, selectedIds)` — and reads the progress back out of
 * the store, which is why the operation survives navigating away from the page.
 *
 *  - a count badge from `selectSelectedIds`;
 *  - "+10 stock to selected", disabled while `bulk.status === 'running'`;
 *  - a `<ProgressBar>` from `bulk.done` / `bulk.total`;
 *  - when it finishes, "N of M rows restocked" and a list of the failures WITH
 *    their reasons — a bulk operation that hides its failures is worse than one
 *    that refuses to start;
 *  - "Undo restock" whenever `selectHasSnapshot` is true.
 */
export function BulkBar() {
  return <p className="small text-muted">Lab 5 builds the bulk bar.</p>;
}
