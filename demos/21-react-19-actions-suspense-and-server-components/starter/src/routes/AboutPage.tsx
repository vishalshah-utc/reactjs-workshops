import { Card } from 'react-bootstrap';
import { StylingShowcase } from '../components/styling/StylingShowcase';

/** A second page, so there is somewhere to navigate TO — and, since Demo 16, the home of the styling showcase. */
export function AboutPage() {
  return (
    <>
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

      {/* Lazy-loaded with this page: the showcase's stylesheets (plain, module, Tailwind) arrive in THIS chunk's CSS, not the app's. */}
      <StylingShowcase />
    </>
  );
}
