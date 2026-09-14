import { useState } from 'react';
import { Button, ButtonGroup, Container } from 'react-bootstrap';
import { Grid, Grid3x3Gap } from 'react-bootstrap-icons';
import { SiteHeader } from './components/SiteHeader';
import { PageHeader } from './components/PageHeader';
import { CategoryStrip } from './components/CategoryStrip';
import { ProductToolbar } from './components/ProductToolbar';
import { ProductGrid } from './components/ProductGrid';
import { ProductForm } from './components/ProductForm';
import { products } from './data/products';
import { buildCategories } from './lib/catalog';
import type { Density } from './types';

export default function App() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [density, setDensity] = useState<Density>('comfortable');
  const [showForm, setShowForm] = useState(false);

  // TODO(lab-1.3): query + sort state; derive visibleProducts with filterProducts() and applySort()
  // TODO(lab-2.1): lift the wishlist here — number[] of product ids, updated immutably
  // TODO(lab-3.2): products become STATE (useState<Product[]>(initialProducts)) so the form can add to them
  // TODO(lab-4.2): pendingDelete state (Product | null), a delete handler, and a dismissible flash <Alert>

  const categories = buildCategories(products);
  const visibleProducts =
    activeCategory === 'all' ? products : products.filter((p) => p.category === activeCategory);

  return (
    <>
      <SiteHeader cartCount={3} />

      <Container className="py-4">
        <PageHeader
          title="All products"
          description={`${visibleProducts.length} of ${products.length} products`}
          actions={
            <>
              <ButtonGroup size="sm" aria-label="Grid density">
                <Button
                  variant={density === 'comfortable' ? 'secondary' : 'outline-secondary'}
                  aria-pressed={density === 'comfortable'}
                  onClick={() => setDensity('comfortable')}
                >
                  <Grid className="me-1" />
                  Comfortable
                </Button>
                <Button
                  variant={density === 'compact' ? 'secondary' : 'outline-secondary'}
                  aria-pressed={density === 'compact'}
                  onClick={() => setDensity('compact')}
                >
                  <Grid3x3Gap className="me-1" />
                  Compact
                </Button>
              </ButtonGroup>
              <Button size="sm" onClick={() => setShowForm(true)}>
                Add product
              </Button>
            </>
          }
        />

        <ProductToolbar />

        <CategoryStrip categories={categories} activeId={activeCategory} onSelect={setActiveCategory} />

        <ProductGrid products={visibleProducts} density={density} />
      </Container>

      <ProductForm show={showForm} onClose={() => setShowForm(false)} />
    </>
  );
}
