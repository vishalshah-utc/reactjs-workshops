import { Badge, Button, Card, Spinner } from 'react-bootstrap';
import { BroadcastPin, PauseFill, PlayFill } from 'react-bootstrap-icons';
import { feedPauseToggled, selectFeed, type FeedStatus } from '../../store/feed';
import { useAppDispatch, useAppSelector } from '../../store/hooks';

const LABELS: Record<FeedStatus, { text: string; bg: string }> = {
  idle: { text: 'Feed idle', bg: 'secondary' },
  connecting: { text: 'Connecting…', bg: 'info' },
  live: { text: 'Live', bg: 'success' },
  reconnecting: { text: 'Reconnecting…', bg: 'warning' },
  offline: { text: 'Live feed unavailable', bg: 'secondary' },
};

/**
 * The feed, made visible. A stream you cannot see is a stream you cannot
 * debug, and every number here is the direct output of one operator:
 *
 *   status        the `retry({ delay })` ladder in `feedEpic`
 *   reconnects    how many times that ladder has restarted
 *   messages      how many `feed/ticked` actions `bufferTime` has emitted
 *   subscribed    the last `subscribe` frame `distinctUntilChanged` let through
 *
 * In a production build the badge reads "Live feed unavailable": there is no
 * mock server outside `npm run dev`, the handshake fails, and the epic's
 * `catchError` of last resort says so instead of breaking the page.
 */
export function FeedBar() {
  const dispatch = useAppDispatch();
  const feed = useAppSelector(selectFeed);
  const label = LABELS[feed.status];

  return (
    <Card className="mb-3">
      <Card.Body className="py-2 d-flex align-items-center gap-2 flex-wrap small">
        <BroadcastPin aria-hidden />
        <Badge bg={label.bg}>{label.text}</Badge>

        {feed.status === 'reconnecting' && <Spinner animation="border" size="sm" role="status" aria-label="Reconnecting" />}

        <span className="text-muted">
          {feed.messages} tick{feed.messages === 1 ? '' : 's'}
        </span>
        <span className="text-muted">· watching {feed.subscribedIds.length} product ids</span>
        {feed.reconnects > 0 && <span className="text-muted">· {feed.reconnects} reconnect(s)</span>}

        <Button
          size="sm"
          variant={feed.paused ? 'outline-success' : 'outline-secondary'}
          className="ms-auto"
          onClick={() => dispatch(feedPauseToggled())}
        >
          {feed.paused ? (
            <>
              <PlayFill className="me-1" />
              Resume feed
            </>
          ) : (
            <>
              <PauseFill className="me-1" />
              Pause feed
            </>
          )}
        </Button>
      </Card.Body>
    </Card>
  );
}
