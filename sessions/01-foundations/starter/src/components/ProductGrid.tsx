import type { GridDensity, Product } from '@/types';
import { ProductCard } from '@/components/ProductCard';
import { cn } from '@/lib/utils';

interface ProductGridProps {
  products: Product[];
  density?: GridDensity;
}

// TODO(lab-3.4): Two jobs.
//
//   1. EMPTY STATE. Early-return a designed "No products found" block when
//      `products.length === 0`. Early return, not a ternary wrapping
//      everything — it keeps the happy path flat. Guide, Lab 3 step D.
//
//   2. THE KEY. Below, the key is the array INDEX. That is a bug waiting to
//      happen and Lab 3 step F has you trigger it on purpose:
//        - click the hearts on the first three cards
//        - reverse the list in App.tsx
//        - watch the hearts stay behind on the wrong products
//      Then change it to `key={product.id}` and try again.
//
//   3. Make the grid respond to `density`: 5 columns at xl when compact,
//      4 when comfortable.
export function ProductGrid({ products, density = 'comfortable' }: ProductGridProps) {
  return (
    <ul className={cn('grid list-none grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4')}>
      {products.map((product, index) => (
        <li key={index} className="flex">
          <ProductCard product={product} density={density} />
        </li>
      ))}
    </ul>
  );
}
