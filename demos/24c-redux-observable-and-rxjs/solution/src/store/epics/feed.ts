import {
  bufferTime,
  catchError,
  delay,
  distinctUntilChanged,
  EMPTY,
  filter,
  ignoreElements,
  map,
  merge,
  mergeMap,
  of,
  retry,
  startWith,
  Subject,
  switchMap,
  takeUntil,
  tap,
  timer,
} from 'rxjs';
import { isFeedServerMessage, type FeedClientMessage, type StockTick } from '../../lib/feedProtocol';
import { feedStatusChanged, feedSubscriptionChanged, selectFeedPaused, type FeedStatus } from '../feed';
import {
  consoleClosed,
  consoleOpened,
  feedFlashCleared,
  feedTicked,
  inventoryRetried,
  selectVisibleIds,
} from '../inventory';
import type { AppEpic } from './types';

/** Ticks are coalesced into one action per window, rather than one per message. */
const TICK_BUFFER_MS = 250;
/** How long a changed row stays highlighted. */
const FLASH_MS = 1200;
/** Backoff ceiling, so a server that is down for an hour is retried once every 30 s. */
const MAX_BACKOFF_MS = 30_000;

const sameIds = (a: number[], b: number[]) => a.length === b.length && a.every((id, index) => id === b[index]);

/**
 * F-live. The whole connection — open, read, write, reconnect, close — as one
 * expression.
 *
 * This is the half of the demo a thunk could not do at all. A thunk runs once
 * and resolves; a socket is a value that arrives over and over, for as long as
 * the screen is open. `createAsyncThunk` has no vocabulary for that, and the
 * listener middleware's answer would be a `while (true)` loop wrapped around a
 * hand-rolled reconnect with its own backoff, its own `addEventListener` pairs
 * and its own cleanup — which is `src/lib/retry.ts` and `useEffect` all over
 * again, in a place where neither belongs.
 *
 * Read the structure first and the operators second.
 *
 *   consoleOpened
 *     └─ switchMap ─ one connection per visit
 *          ├─ inbound$   socket → validate → pause → buffer → actions
 *          ├─ outbound$  visible ids → subscribe frames
 *          ├─ status$    connecting / live / reconnecting / offline
 *          ├─ resync$    a reconnect means the deltas we missed are lost
 *          └─ takeUntil(consoleClosed) ─ unsubscribe, and the socket CLOSES
 */
export const feedEpic: AppEpic = (action$, state$, deps) =>
  action$.pipe(
    filter(consoleOpened.match),

    switchMap(() => {
      /**
       * Created INSIDE the switchMap, so each visit gets its own subject and
       * leaving the page really does close the connection. A module-scope
       * socket would outlive the screen and quietly accumulate.
       */
      const socket$ = deps.openFeed();

      /**
       * A private channel for connection status.
       *
       * The `retry` callback below needs to say "I am waiting to reconnect",
       * and an operator callback has no way to emit into the stream it is part
       * of. A local `Subject`, merged into the output, is the standard answer —
       * and it stays local, so nothing outside this epic can push to it.
       */
      const status$ = new Subject<FeedStatus>();

      const inbound$ = socket$.pipe(
        // Any frame at all proves the connection is up.
        tap(() => status$.next('live')),

        /**
         * RECONNECTION, in one operator.
         *
         * `webSocket()` ERRORS when the connection drops abnormally — kill the
         * dev server and this fires. `retry` resubscribes, and resubscribing a
         * `WebSocketSubject` opens a new socket. The `delay` callback returns
         * an OBSERVABLE, so the wait is exponential with a ceiling:
         *
         *   attempt 1 → 0.5 s   attempt 4 → 4 s
         *   attempt 2 → 1 s     attempt 5 → 8 s   … capped at 30 s
         *
         * No `count`, deliberately: a live feed should keep trying for as long
         * as the screen is open, and `takeUntil` below is what finally stops
         * it. `resetOnSuccess` starts the ladder again after a good
         * connection, so an hour of uptime is not punished for a drop last
         * week.
         *
         * A clean close (code 1000) COMPLETES rather than errors, and `retry`
         * does not see a completion — `repeat({ delay })` is the operator for
         * that case. Our server never closes cleanly, so `retry` alone is
         * honest here; a real one might need both.
         */
        retry({
          delay: (_error, attempt) => {
            status$.next('reconnecting');
            return timer(Math.min(MAX_BACKOFF_MS, 500 * 2 ** (attempt - 1)));
          },
          resetOnSuccess: true,
        }),

        // The socket hands you `unknown`. Validate at the boundary; drop a
        // malformed frame rather than letting it kill the stream.
        filter(isFeedServerMessage),
        filter((message) => message.type === 'tick'),

        /**
         * THE PAUSE SWITCH — and it really is one operator.
         *
         * This DROPS messages while paused, which is the right default for a
         * price feed: a stale number is worse than a missing one. The
         * alternative is `bufferToggle(resumed$, () => paused$)`, which holds
         * them and releases a burst on resume — right for a chat log, wrong
         * for stock.
         */
        filter(() => !selectFeedPaused(state$.value)),

        /**
         * BACK-PRESSURE. The mock sends a message roughly every 900 ms, but a
         * real feed on a busy catalogue can send hundreds a second, and one
         * dispatch per message is one re-render per message.
         *
         * `bufferTime` collects into 250 ms windows: at most four actions a
         * second, each carrying every change in that window. This is the
         * operator you cannot comfortably hand-roll — a `setTimeout` version
         * owns an array, a timer handle and a cleanup, and gets the
         * flush-on-unsubscribe case wrong.
         */
        bufferTime(TICK_BUFFER_MS),
        filter((messages) => messages.length > 0),

        map((messages) => {
          // Last write wins inside a window: two ticks for one product in
          // 250 ms should be one update, not two.
          const latest = new Map<number, StockTick>();
          let at = 0;
          for (const message of messages) {
            if (message.type !== 'tick') continue;
            at = Math.max(at, message.at);
            for (const change of message.changes) latest.set(change.id, change);
          }
          return feedTicked({ at, changes: [...latest.values()] });
        }),
      );

      /**
       * OUTBOUND MULTIPLEXING. Tell the server which products are on screen.
       *
       * `state$` is an Observable, so "the visible set, whenever it changes" is
       * a stream like any other. `distinctUntilChanged` with a comparator is
       * what stops a subscribe frame going out on every single action —
       * without it this would send four frames a second, one per tick.
       *
       * rxjs also ships `socket$.multiplex(subMsg, unsubMsg, filter)` for the
       * other shape of this problem: many subscribers, each wanting its own
       * topic, each sending its frames when it subscribes and unsubscribes.
       * Here there is one subscriber whose interest changes over time, so the
       * diff is explicit.
       */
      const outbound$ = state$.pipe(
        map(selectVisibleIds),
        distinctUntilChanged(sameIds),
        tap((ids) => {
          const message: FeedClientMessage = { type: 'subscribe', ids };
          // `next()` on a WebSocketSubject sends a frame. If the socket is not
          // open yet the subject queues it and sends it on connect.
          socket$.next(message);
        }),
        map((ids) => feedSubscriptionChanged(ids)),
      );

      /**
       * RESYNCHRONISE AFTER A RECONNECT — the question every stream has to
       * answer, and the one most tutorials skip.
       *
       * A feed sends DELTAS. While you were disconnected the world moved on
       * and nobody replayed it, so the numbers on screen are now wrong in a
       * way no future tick will correct. Three honest answers:
       *
       *   1. refetch on reconnect — what we do, and it is one action;
       *   2. ask the server for everything since a sequence number, if it
       *      keeps one — the right answer when the backend supports it;
       *   3. tell the user the data is stale and let them decide.
       *
       * Doing nothing is the fourth answer, and it is the one that ships.
       */
      const resync$ = status$.pipe(
        distinctUntilChanged(),
        filter((status) => status === 'live'),
        // Not the FIRST connection — only a re-connection needs a resync.
        filter(() => state$.value.feed.reconnects > 0),
        map(() => inventoryRetried()),
      );

      return merge(
        inbound$,
        outbound$,
        resync$,
        status$.pipe(distinctUntilChanged(), map(feedStatusChanged)),
      ).pipe(
        /**
         * The catch of last resort. `retry` above handles a socket that drops;
         * this handles the case where the endpoint does not exist at all — a
         * production build, where there is no dev server and therefore no
         * feed. The console keeps working and the badge says why.
         */
        catchError(() => of(feedStatusChanged('offline'))),

        /**
         * `takeUntil` is the close. Unsubscribing the merged stream
         * unsubscribes `socket$`, and unsubscribing a `WebSocketSubject`
         * closes the socket. There is no `ws.close()` in this file and no
         * cleanup function to forget.
         */
        takeUntil(action$.pipe(filter(consoleClosed.match))),

        startWith(feedStatusChanged('connecting')),
      );
    }),
  );

/**
 * The highlight, and its expiry.
 *
 * `delay` inside `mergeMap` is "do this, then do that a moment later" with no
 * `setTimeout`, no handle to clear, and — because it is part of the stream —
 * automatic cancellation when the console closes.
 *
 * `mergeMap` rather than `switchMap`: two ticks 300 ms apart must each clear
 * their own rows. `switchMap` would cancel the first clear and leave those
 * rows glowing for ever.
 */
export const flashClearEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(feedTicked.match),
    mergeMap((action) => {
      const ids = action.payload.changes.map((change) => change.id);
      if (ids.length === 0) return EMPTY;
      return of(feedFlashCleared(ids)).pipe(delay(FLASH_MS));
    }),
  );

/**
 * The smallest possible epic, kept because it demonstrates the sink shape and
 * makes a reconnect visible in the console when the badge is off screen.
 */
export const feedLogEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(feedStatusChanged.match),
    tap((action) => console.debug(`[feed] ${action.payload}`)),
    ignoreElements(),
  );
