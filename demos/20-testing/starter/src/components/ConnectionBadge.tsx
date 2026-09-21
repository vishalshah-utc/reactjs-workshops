import { Badge } from 'react-bootstrap';
import { BroadcastPin, WifiOff } from 'react-bootstrap-icons';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { usePriceTicker } from '../hooks/usePriceTicker';

/**
 * Two live signals in one badge: whether the browser has a network at all, and
 * whether the price feed is connected.
 *
 * Offline WINS. There is no point reporting a live feed to somebody whose
 * network is gone — and the offline state is the one the user can act on.
 */
export function ConnectionBadge() {
  const online = useOnlineStatus();
  // Mounted ONCE, here. A second component calling this hook would open a second connection.
  const ticker = usePriceTicker();

  if (!online) {
    return (
      <Badge bg="warning" text="dark" className="d-inline-flex align-items-center gap-1" role="status">
        <WifiOff aria-hidden="true" />
        Offline
      </Badge>
    );
  }

  // In a production build the ticker is 'off' and this renders nothing at all — the endpoint is a dev-server mock.
  if (ticker === 'off') return null;

  return (
    <Badge
      bg={ticker === 'live' ? 'success' : 'secondary'}
      className="d-inline-flex align-items-center gap-1"
      role="status"
      title={ticker === 'live' ? 'Price feed connected' : 'Reconnecting to the price feed'}
    >
      <BroadcastPin aria-hidden="true" />
      {ticker === 'live' ? 'Live prices' : 'Reconnecting…'}
    </Badge>
  );
}
