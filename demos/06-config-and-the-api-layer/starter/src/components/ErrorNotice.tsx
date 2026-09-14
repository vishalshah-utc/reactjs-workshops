import axios from 'axios';
import { Alert, Button } from 'react-bootstrap';
import { ArrowClockwise, ExclamationTriangleFill } from 'react-bootstrap-icons';
import { toMessage } from '../lib/errors';

interface ErrorNoticeProps {
  /** `unknown` on purpose: a catch block gives you unknown, and this component narrows it. */
  error: unknown;
  onRetry?: () => void;
}

// TODO(lab-4.5): read error.message / error.code / error.status from the ApiError — drop toMessage and the axios shape
export function ErrorNotice({ error, onRetry }: ErrorNoticeProps) {
  if (!error) return null;
  const message = toMessage(error);
  if (!message) return null; // a cancelled request is not a failure

  // Narrowing: only an axios error has a config and a response to show.
  const request = axios.isAxiosError(error) && error.config?.url ? error : null;

  return (
    <Alert variant="danger" className="d-flex align-items-start gap-2">
      <ExclamationTriangleFill className="mt-1 flex-shrink-0" />
      <div className="flex-grow-1">
        <div>{message}</div>
        {import.meta.env.DEV && request && (
          <div className="small text-muted font-monospace mt-1">
            {request.config?.method?.toUpperCase()} {request.config?.url}
            {request.response ? ` → ${request.response.status}` : ' → no response'}
          </div>
        )}
      </div>
      {onRetry && (
        <Button size="sm" variant="outline-danger" onClick={onRetry}>
          <ArrowClockwise className="me-1" />
          Retry
        </Button>
      )}
    </Alert>
  );
}
