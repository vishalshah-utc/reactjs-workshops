import { Card } from 'react-bootstrap';

/** A second page, so there is somewhere to navigate TO — and, from today, the home of the styling showcase. */
export function AboutPage() {
  // TODO(lab-1.5): wrap in a fragment and render <StylingShowcase /> under the card. It is lazy-loaded with this page,
  // so the showcase's stylesheets (plain, module, Tailwind) ship in THIS chunk's CSS, not the app's.
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
