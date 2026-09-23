import type { Observable } from 'rxjs';
import { webSocket, type WebSocketSubject } from 'rxjs/webSocket';
import { listProducts, updateProduct, type ListProductsOptions } from '../../api/services/products';
import { fromAbortable } from '../../lib/fromAbortable';
import { FEED_PATH, type FeedClientMessage, type FeedServerMessage } from '../../lib/feedProtocol';
import type { Product, ProductListResponse } from '../../types';

/**
 * The epics' dependencies — Demo 24b's `thunk: { extraArgument }`, wearing a
 * different hat.
 *
 * `createEpicMiddleware({ dependencies })` hands this object to every epic as
 * its third argument. It exists for the same two reasons `extra` did: the API
 * layer is declared in ONE place, and a test can hand the epics a different
 * object without `vi.mock` touching the module graph.
 *
 * The difference is the SHAPE. A thunk awaited a promise; an epic composes an
 * Observable. So the boundary converts once, here, and every epic downstream
 * gets something `switchMap` can cancel.
 */
export interface EpicDeps {
  listProducts: (options: ListProductsOptions) => Observable<ProductListResponse>;
  updateProduct: (id: number, patch: { stock: number }, delayMs?: number) => Observable<Product>;
  /** A factory, not a socket. The epic decides when to open one and how often. */
  openFeed: () => WebSocketSubject<FeedServerMessage | FeedClientMessage>;
}

/**
 * `fromAbortable` is doing the load-bearing work in both wrappers. Read its
 * comment: `from(promise)` would compile, pass every marble test, and leave
 * cancelled requests running on the wire.
 */
export const epicDeps: EpicDeps = {
  listProducts: (options) => fromAbortable((signal) => listProducts({ ...options, signal })),

  updateProduct: (id, patch, delayMs) =>
    fromAbortable((signal) => updateProduct(id, patch, { signal, delayMs })),

  /**
   * `webSocket()` is an rxjs `Subject` that happens to be a network connection.
   *
   * Subscribing to it opens the socket; unsubscribing closes it; `next()` sends
   * a message; an abnormal close makes it ERROR, which is precisely what lets
   * `retry({ delay })` reconnect it. There is no `addEventListener`, no
   * `removeEventListener`, and no cleanup function to forget.
   *
   * The URL is derived from the page so it works on `localhost`, on a LAN IP
   * (`vite --host`) and in StackBlitz without configuration. In a production
   * build there is no server on the other end — see the guide: the UI degrades
   * to "Live feed unavailable" and everything else keeps working.
   */
  openFeed: () =>
    webSocket<FeedServerMessage | FeedClientMessage>({
      url: `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}${FEED_PATH}`,
      // The default deserialiser is JSON.parse and throws the whole stream away
      // on a malformed frame. Returning the raw value and validating in the
      // epic keeps one bad message from killing the connection.
      deserializer: (event: MessageEvent<string>) => {
        try {
          return JSON.parse(event.data) as FeedServerMessage;
        } catch {
          return { type: 'malformed' } as unknown as FeedServerMessage;
        }
      },
    }),
};
