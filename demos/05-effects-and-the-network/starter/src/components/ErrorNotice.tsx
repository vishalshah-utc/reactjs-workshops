import { Alert } from 'react-bootstrap';
import { toMessage } from '../lib/errors';

/** Shows an error. Lab 2.2 adds a Retry button and a dev-only request line. */
// TODO(lab-2.2): render null when there is no error; add an onRetry button and a DEV-only "METHOD url → status" line (narrow with axios.isAxiosError)
export function ErrorNotice({ error }: { error: unknown }) {
  return <Alert variant="danger">{toMessage(error)}</Alert>;
}
