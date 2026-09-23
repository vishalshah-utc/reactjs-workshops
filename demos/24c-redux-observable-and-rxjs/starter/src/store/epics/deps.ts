import type { Observable } from 'rxjs';
import { EMPTY } from 'rxjs';
import type { WebSocketSubject } from 'rxjs/webSocket';
import type { ListProductsOptions } from '../../api/services/products';
import type { FeedClientMessage, FeedServerMessage } from '../../lib/feedProtocol';
import type { Product, ProductListResponse } from '../../types';

/**
 * The epics' dependencies — Demo 24b's `thunk: { extraArgument }`, wearing a
 * different hat.
 *
 * `createEpicMiddleware({ dependencies })` hands this object to every epic as
 * its third argument, for the same two reasons `extra` existed: the API layer
 * is declared in ONE place, and a test can hand the epics a different object
 * with no `vi.mock` and no module-graph surgery.
 *
 * What changes is the SHAPE. A thunk awaited a promise; an epic composes an
 * Observable. So the boundary converts once, here, and every epic downstream
 * gets something `switchMap` can cancel.
 */
export interface EpicDeps {
  listProducts: (options: ListProductsOptions) => Observable<ProductListResponse>;
  updateProduct: (id: number, patch: { stock: number }, delayMs?: number) => Observable<Product>;
  /** A factory, not a socket. The epic decides when to open one and how often. */
  openFeed: () => WebSocketSubject<FeedServerMessage | FeedClientMessage>;
}

export const epicDeps: EpicDeps = {
  /**
   * TODO(lab-1.2): wrap the two product services as Observables.
   *
   *   listProducts: (options) => fromAbortable((signal) => listProducts({ ...options, signal })),
   *   updateProduct: (id, patch, delayMs) =>
   *     fromAbortable((signal) => updateProduct(id, patch, { signal, delayMs })),
   *
   * Import them from `../../api/services/products` and `fromAbortable` from
   * `../../lib/fromAbortable`. Note what is NOT imported: axios, endpoints,
   * `ApiError`. The epics talk to `api/services`, which is the boundary
   * Demos 5–8 built, exactly as the thunks did.
   */
  listProducts: () => EMPTY,
  updateProduct: () => EMPTY,

  /**
   * TODO(lab-5.1): open the live feed with `webSocket()` from `rxjs/webSocket`.
   *
   *   openFeed: () =>
   *     webSocket<FeedServerMessage | FeedClientMessage>({
   *       url: `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}${FEED_PATH}`,
   *       deserializer: (event: MessageEvent<string>) => { …JSON.parse, and do
   *         not let one malformed frame throw… },
   *     }),
   *
   * `webSocket()` returns a Subject that happens to be a network connection:
   * subscribing OPENS the socket, unsubscribing CLOSES it, `next()` sends a
   * frame, and an abnormal close makes it ERROR — which is exactly what lets
   * `retry({ delay })` reconnect it in Lab 6. There is no `addEventListener`,
   * no `removeEventListener` and no cleanup function to forget.
   *
   * Derive the URL from `location` so it works on localhost, on a LAN IP
   * (`vite --host`) and in StackBlitz with no configuration. The default
   * deserialiser is `JSON.parse` and it throws the whole stream away on a bad
   * frame — return something harmless instead and validate in the epic.
   */
  openFeed: () => {
    throw new Error('TODO(lab-5.1): open the WebSocket with rxjs/webSocket');
  },
};
