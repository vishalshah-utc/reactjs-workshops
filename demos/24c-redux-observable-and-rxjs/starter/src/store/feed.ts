import { createAction, createSlice } from '@reduxjs/toolkit';
import type { RootState } from './index';

/**
 * Everything about the live feed EXCEPT the product data itself.
 *
 * The ticks land in the inventory slice's entity adapter — that is where
 * products live, and a feed message is just another reason a product changed.
 * What lives here is the connection: whether it is up, whether the user has
 * paused it, what it has sent us lately, and which ids we asked for.
 *
 * Two slices answering one action (`feed/ticked`) is the same cross-slice
 * pattern `session/signedOut` uses. Neither slice knows about the other.
 */

export type FeedStatus = 'idle' | 'connecting' | 'live' | 'reconnecting' | 'offline';

export interface FeedState {
  status: FeedStatus;
  /** The user's pause switch. One `filter` operator in the epic reads it. */
  paused: boolean;
  /** How many reconnections we have made this session — visible proof of the backoff. */
  reconnects: number;
  messages: number;
  lastMessageAt: number | null;
  /** The ids currently subscribed on the wire, so the UI can show the multiplexing. */
  subscribedIds: number[];
}

const initialState: FeedState = {
  status: 'idle',
  paused: false,
  reconnects: 0,
  messages: 0,
  lastMessageAt: null,
  subscribedIds: [],
};

/** Emitted by the feed epic. `reconnecting` is what the backoff looks like from outside. */
export const feedStatusChanged = createAction<FeedStatus>('feed/statusChanged');
/** Emitted by the outbound half of the feed epic after it sends subscribe/unsubscribe. */
export const feedSubscriptionChanged = createAction<number[]>('feed/subscriptionChanged');

const feedSlice = createSlice({
  name: 'feed',
  initialState,
  reducers: {
    /**
     * The pause switch. It changes nothing here except a boolean — the whole
     * behaviour is one `filter` in `feedEpic`, which is the point being made.
     */
    feedPauseToggled(state) {
      state.paused = !state.paused;
    },
  },
  /**
   * TODO(lab-5.3): answer the feed's actions.
   *
   *   feedStatusChanged        set `status`, and increment `reconnects` when
   *                            it goes TO 'reconnecting' from anything else —
   *                            the backoff fires the callback once per
   *                            attempt, and you want one count per drop.
   *   feedSubscriptionChanged  remember the ids currently on the wire.
   *   feedTicked               count the message and record
   *                            `action.payload.at` — the SERVER's clock. A
   *                            reducer that calls `Date.now()` is not a pure
   *                            function: replay it during time-travel and you
   *                            get a different answer. Anything from outside
   *                            belongs in the action.
   *   consoleClosed            leaving the console closes the socket, so the
   *                            status has to follow it back to 'idle'.
   *   signedOut                reset, like every other user-scoped slice.
   *
   * Two slices answering one action (`feed/ticked`) is the same cross-slice
   * pattern `session/signedOut` uses: the ticks land in the inventory slice's
   * entity adapter, the connection lives here, and neither knows about the
   * other.
   */
  extraReducers: () => {},
});

export const { feedPauseToggled } = feedSlice.actions;

export const selectFeed = (state: RootState) => state.feed;
export const selectFeedPaused = (state: RootState) => state.feed.paused;

export default feedSlice.reducer;
