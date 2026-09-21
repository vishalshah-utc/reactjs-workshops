import { Card } from 'react-bootstrap';

/** A placeholder. Lab 2.1: file input, progress bar, cancel button, result. */
// TODO(lab-2.1): useState for file/progress/result/error, an AbortController in a ref, ProgressBar with "Processing…" at 100%
export function Uploader() {
  return (
    <Card className="mt-4">
      <Card.Header className="fw-semibold">Upload a profile picture</Card.Header>
      <Card.Body className="text-muted">No uploader yet — see Lab 2.</Card.Body>
    </Card>
  );
}
