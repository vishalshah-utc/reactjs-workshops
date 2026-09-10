import { useState } from 'react';
import { CheckIcon, HeartIcon, ShoppingCartIcon } from 'lucide-react';
import type { GridDensity, Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PriceTag } from '@/components/PriceTag';
import { ProductImage } from '@/components/ProductImage';
import { Rating } from '@/components/Rating';
import { StockBadge } from '@/components/StockBadge';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  density?: GridDensity;
  /**
   * Called when "Add to cart" is clicked.
   *
   * The card does not own the cart and never will — it is rendered 24 times
   * and there is only one cart. It reports the intent upward and lets whoever
   * owns the state decide. Session 2 Lab 1 is about why that has to be so.
   */
  onAddToCart?: (product: Product) => void;
  /** How many of this product are already in the cart, if any. */
  quantityInCart?: number;
}

export function ProductCard({
  product, density = 'comfortable', onAddToCart, quantityInCart = 0,
}: ProductCardProps) {
  /**
   * LOCAL state, owned by this card.
   *
   * Every card gets its OWN independent `saved` value — calling `useState` in
   * a component that renders 24 times creates 24 separate pieces of state,
   * not one shared one. React keeps them apart by the component's position in
   * the tree, which is precisely why the `key` prop matters so much: change
   * the keys and React matches state to the wrong card.
   *
   * (In Session 2 this moves up and out. A wishlist that forgets itself on
   * reload is not a wishlist — but it is a perfect demonstration today.)
   */
  const [saved, setSaved] = useState(false);

  const isOutOfStock = product.stockQuantity === 0;
  const isCompact = density === 'compact';

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-shadow hover:shadow-md',
        isOutOfStock && 'opacity-75',
      )}
    >
      <div className="bg-muted relative aspect-square overflow-hidden">
        <ProductImage
          seed={product.slug}
          name={product.name}
          className="transition-transform duration-300 group-hover:scale-105"
        />

        {/* Conditional rendering, idiom 1: `&&` for "render this or nothing".
            Safe here because `tags.includes()` returns a real boolean. */}
        {product.tags.includes('bestseller') && (
          <Badge className="absolute top-2 left-2">Bestseller</Badge>
        )}
        {product.tags.includes('new') && (
          <Badge variant="success" className="absolute top-2 left-2">New</Badge>
        )}

        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-pressed={saved}
          aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          onClick={() => setSaved((wasSaved) => !wasSaved)}
          className="absolute top-2 right-2 rounded-full shadow-sm"
        >
          <HeartIcon className={cn('size-4', saved && 'fill-destructive text-destructive')} />
        </Button>
      </div>

      <CardContent className={cn('flex flex-col gap-2', isCompact ? 'p-3' : 'p-4')}>
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          {product.brandName}
        </p>

        <h3 className={cn('font-medium leading-snug', isCompact ? 'line-clamp-1 text-sm' : 'line-clamp-2')}>
          {product.name}
        </h3>

        {/* Conditional rendering, idiom 2: hide detail entirely in compact
            mode. Not "render it smaller" — genuinely do not render it. */}
        {!isCompact && <Rating value={product.rating} reviewCount={product.reviewCount} />}

        <PriceTag
          price={product.price}
          compareAtPrice={product.compareAtPrice}
          currency={product.currency}
          size={isCompact ? 'sm' : 'md'}
        />

        {!isCompact && <StockBadge stockQuantity={product.stockQuantity} />}
      </CardContent>

      <CardFooter className={cn('mt-auto', isCompact ? 'p-3 pt-0' : 'p-4 pt-0')}>
        {/* Conditional rendering, idiom 3: a ternary, for a genuine either/or.
            Two mutually exclusive outcomes, one expression. */}
        <Button
          className="w-full"
          size={isCompact ? 'sm' : 'default'}
          disabled={isOutOfStock || quantityInCart >= product.stockQuantity}
          variant={isOutOfStock ? 'secondary' : quantityInCart > 0 ? 'secondary' : 'default'}
          onClick={() => onAddToCart?.(product)}
        >
          {isOutOfStock ? (
            'Out of stock'
          ) : quantityInCart > 0 ? (
            <>
              <CheckIcon />
              In cart ({quantityInCart})
            </>
          ) : (
            <>
              <ShoppingCartIcon />
              Add to cart
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
