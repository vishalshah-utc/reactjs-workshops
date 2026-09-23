import { Badge, Card } from 'react-bootstrap';
import { BroadcastPin } from 'react-bootstrap-icons';
import { selectFeed } from '../../store/feed';
import { useAppSelector } from '../../store/hooks';

/**
 * TODO(lab-6.5): make the feed visible.
 *
 * A stream you cannot see is a stream you cannot debug, and every number this
 * bar shows is the direct output of one operator:
 *
 *   status        the `retry({ delay })` ladder in `feedEpic`
 *   reconnects    how many times that ladder has restarted
 *   messages      how many `feed/ticked` actions `bufferTime` has emitted
 *   subscribed    the last `subscribe` frame `distinctUntilChanged` let through
 *
 * Build it out:
 *  - a `Badge` per status — idle / connecting / live / reconnecting / offline
 *    — with a spinner while reconnecting;
 *  - the tick count, the number of subscribed ids, and the reconnect count
 *    once it is above zero;
 *  - a **Pause feed** / **Resume feed** button dispatching `feedPauseToggled()`.
 *
 * In a production build the badge should read "Live feed unavailable": there
 * is no mock server outside `npm run dev`, so the handshake fails and the
 * epic's `catchError` of last resort says so instead of breaking the page.
 */
export function FeedBar() {
  const feed = useAppSelector(selectFeed);

  return (
    <Card className="mb-3">
      <Card.Body className="py-2 d-flex align-items-center gap-2 flex-wrap small">
        <BroadcastPin aria-hidden />
        <Badge bg="secondary">Feed {feed.status}</Badge>
      </Card.Body>
    </Card>
  );
}
