import { Alert, Button } from 'react-bootstrap';
import { ArrowClockwise, ExclamationTriangleFill } from 'react-bootstrap-icons';
import { env } from '../config/env';
import type { ApiError } from '../lib/ApiError';

interface ErrorNoticeProps {
  /** Already normalised: `ApiError.from(err)` in the catch turns `unknown` into this. */
  error: ApiError | null | undefined;
  onRetry?: () => void;
  title?: string;
}

/**
 * Renders an ApiError. Knows nothing about axios — the interceptor already
 * translated the failure into message / code / status / requestId.
 */
export function ErrorNotice({ error, onRetry, title }: ErrorNoticeProps) {
  if (!error) return null;

  const canRetry = onRetry && error.isRetryable;

  return (
    <Alert variant="danger" className="d-flex align-items-start gap-2">
      <ExclamationTriangleFill className="mt-1 flex-shrink-0" />
      <div className="flex-grow-1">
        {title && <Alert.Heading className="h6">{title}</Alert.Heading>}
        <div>{error.message}</div>
        {env.isDev && (
          <div className="small text-muted font-monospace mt-1">
            {error.code}
            {error.status ? ` · ${error.status}` : ''}
            {error.requestId ? ` · ${error.requestId}` : ''}
          </div>
        )}
      </div>
      {canRetry && (
        <Button size="sm" variant="outline-danger" onClick={onRetry}>
          <ArrowClockwise className="me-1" />
          Retry
        </Button>
      )}
    </Alert>
  );
}
