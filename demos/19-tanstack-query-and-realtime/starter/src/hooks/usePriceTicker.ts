export type TickerStatus = 'off' | 'connecting' | 'live' | 'retrying';

/**
 * PUSH, not poll: the server decides when there is news.
 *
 * `EventSource` is HTTP — one long-lived GET, `text/event-stream`, messages
 * separated by blank lines — so it needs no new protocol and reconnects by
 * itself. What it cannot do is send anything upstream; that is a WebSocket.
 *
 * ⚠️ DummyJSON has NO push channel. Lab 6 ships a ~20-line mock endpoint on the
 * Vite dev server (`/__dev/prices`) and nothing else; in a production build the
 * endpoint does not exist and this hook must do nothing at all.
 */
// TODO(lab-6.3): open an EventSource on `/__dev/prices` inside an effect guarded
// by `import.meta.env.DEV`, track 'open'/'error' as the status, parse each
// message into { id, price } and write it into the cache with `setQueryData` /
// `setQueriesData` — never `invalidateQueries`, which would turn push back into
// polling. The cleanup calls `source.close()`.
export function usePriceTicker(): TickerStatus {
  return 'off';
}
