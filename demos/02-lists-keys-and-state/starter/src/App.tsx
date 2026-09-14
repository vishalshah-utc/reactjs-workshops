import { Container } from 'react-bootstrap';
import { SiteHeader } from './components/SiteHeader';
import { PageHeader } from './components/PageHeader';
import { CategoryStrip } from './components/CategoryStrip';
import { ProductGrid } from './components/ProductGrid';
import { products } from './data/products';

export default function App() {
  // TODO(lab-3.2): activeCategory state + DERIVED visibleProducts (no second useState!)
  // TODO(lab-3.3): density state (useState<Density>), and a toggle in PageHeader's `actions` slot

  return (
    <>
      <SiteHeader cartCount={3} />

      <Container className="py-4">
        <PageHeader title="All products" description={`${products.length} products`} />

        <CategoryStrip />

        <ProductGrid products={products} />
      </Container>
    </>
  );
}
