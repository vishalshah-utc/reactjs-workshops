import { Container } from 'react-bootstrap';
import { SiteHeader } from './components/SiteHeader';
import { sampleProducts } from './data/sampleProducts';

/**
 * The root component. Everything on screen is rendered from here.
 * Right now it renders a header and a heading. By the end of Demo 1 it
 * renders three product cards built out of four components you wrote.
 */
export default function App() {
  return (
    <>
      {/* TODO(lab-1.1): pass a cartCount prop, e.g. <SiteHeader cartCount={3} /> */}
      <SiteHeader />

      <Container className="py-4">
        <h1 className="h3">Featured products</h1>
        <p className="text-muted">
          {sampleProducts.length} products are loaded from src/data/sampleProducts.ts — nothing renders them yet.
        </p>

        {/* TODO(lab-3.2): render three <ProductCard /> in a <Row> of <Col>s */}
      </Container>
    </>
  );
}
