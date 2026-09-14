import { Card } from 'react-bootstrap';

/** A second page, so there is somewhere to navigate TO. Finished — nothing to do here. */
export function AboutPage() {
  return (
    <Card>
      <Card.Body>
        <h1 className="h4">About ShopScope</h1>
        <p className="mb-0 text-muted">
          A product explorer built one demo at a time, against the free{' '}
          <a href="https://dummyjson.com" target="_blank" rel="noreferrer">
            DummyJSON
          </a>{' '}
          API. Reads are real; writes are simulated.
        </p>
      </Card.Body>
    </Card>
  );
}
