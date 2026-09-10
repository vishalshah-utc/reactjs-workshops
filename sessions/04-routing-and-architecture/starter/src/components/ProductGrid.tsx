import { PackageOpenIcon } from 'lucide-react';
import type { GridDensity, Product } from '@/types';
import { ProductCard } from '@/components/ProductCard';
import { cn } from '@/lib/utils';

interface ProductGridProps {
  products: Product[];
  density?: GridDensity;
  onAddToCart?: (product: Product) => void;
  /** productId -> quantity already in the cart. */
  cartQuantities?: Record<string, number>;
}

export function ProductGrid({
  products, density = 'comfortable', onAddToCart, cartQuantities = {},
}: ProductGridProps) {
  /**
   * Conditional rendering, idiom 4: an EARLY RETURN for the empty state.
   *
   * Better than wrapping the whole grid in a ternary — the happy path stays
   * flat and unindented, and the empty case gets to be a real, designed thing
   * rather than an afterthought. Every list in a real product needs one.
   */
  if (products.length === 0) {
    return (
      <div className="border-border flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
        <PackageOpenIcon className="text-muted-foreground size-8" />
        <div>
          <p className="font-medium">No products found</p>
          <p className="text-muted-foreground text-sm">Try a different category.</p>
        </div>
      </div>
    );
  }

  return (
    <ul
      className={cn(
        'grid list-none grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3',
        density === 'compact' ? 'xl:grid-cols-5' : 'xl:grid-cols-4',
      )}
    >
      {products.map((product) => (
        /**
         * THE KEY.
         *
         * `key` is how React identifies which item is which between renders.
         * Give it `product.id` — something stable and unique to the DATA.
         *
         * Do NOT use the array index. It describes a POSITION, not an item, so
         * when the list is reordered or filtered React thinks item #0 stayed
         * put and only its contents changed. It then keeps the old component
         * state at that position — and the wishlist heart you clicked on one
         * product appears on a completely different one.
         *
         * Try it: change this to `key={index}`, click a few hearts, then hit
         * "Reverse" in the toolbar. Lab 3 walks through exactly why.
         */
        <li key={product.id} className="flex">
          <ProductCard
            product={product}
            density={density}
            onAddToCart={onAddToCart}
            quantityInCart={cartQuantities[product.id] ?? 0}
          />
        </li>
      ))}
    </ul>
  );
}
