import { Container, Spinner } from 'react-bootstrap';

/** Shown ONLY on the very first load, while the root loaders run against a blank page. */
export function AppBootSplash() {
  return (
    <Container className="py-5 text-center">
      <Spinner animation="border" role="status">
        <span className="visually-hidden">Loading…</span>
      </Spinner>
      <p className="text-muted mt-3 mb-0">Loading ShopScope…</p>
    </Container>
  );
}
