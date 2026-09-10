import { Link, useOutletContext } from 'react-router';
import { ArrowLeftIcon } from 'lucide-react';
import { ApiError } from '@/lib/api';
import { useProduct } from '@/hooks/useProduct';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { PriceTag } from '@/components/PriceTag';
import { ProductImage } from '@/components/ProductImage';
import { Rating } from '@/components/Rating';
import { Skeleton } from '@/components/ui/skeleton';
import { StockBadge } from '@/components/StockBadge';
import type { OutletContext } from '@/routes/RootLayout';

/**
 * A single product, at its own URL.
 *
 * This page is the reason dynamic segments exist. `/products/:slug` is one
 * route definition that serves five thousand products, and the slug in the
 * address is what selects between them.
 *
 * TODO(lab-2.4): read the slug from the URL.
 *
 * The route is declared as `products/:slug`, so React Router has already
 * parsed the address and is holding the value for you. Import `useParams`
 * from 'react-router' and take it:
 *
 *   const { slug } = useParams();
 *
 * `slug` is typed `string | undefined` — the router cannot promise at compile
 * time that this component is only ever rendered under a route that has a
 * `:slug`. `useProduct` already handles `undefined` by not fetching, so you do
 * not need a guard here, but the type is worth understanding rather than
 * silencing with a `!`.
 *
 * Replace the hard-coded slug below with the real one.
 *
 * Guide, Lab 2 step C.
 */
export function ProductDetailPage() {
  const { addToCart } = useOutletContext<OutletContext>();

  // TODO(lab-2.4): this is hard-coded so the page renders something before you
  // wire up useParams. Every product URL currently shows the same product —
  // which is a good way to confirm the routing works before the data does.
  const slug = 'placeholder-slug';

  const { product, status, error } = useProduct(slug);

  if (status === 'loading') {
    return (
      <div className="grid gap-8 md:grid-cols-2">
        <Skeleton className="aspect-square w-full rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-10 w-1/4" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  // A 404 is not a failure of the site, it is a correct answer to a wrong
  // question — so it gets the empty treatment, not the error treatment.
  if (status === 'error' && error instanceof ApiError && error.status === 404) {
    return (
      <EmptyState
        title="We could not find that product"
        description="It may have been removed from the catalogue, or the link may be out of date."
        action={
          <Button asChild variant="outline" size="sm">
            <Link to="/">Back to all products</Link>
          </Button>
        }
      />
    );
  }

  if (status === 'error' || !product) {
    return <ErrorState error={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/">
          <ArrowLeftIcon />
          All products
        </Link>
      </Button>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="bg-muted relative aspect-square overflow-hidden rounded-xl">
          <ProductImage seed={product.slug} name={product.name} />
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm">{product.brandName}</p>
            <h1 className="text-2xl font-semibold">{product.name}</h1>
          </div>

          <Rating value={product.rating} reviewCount={product.reviewCount} />

          <PriceTag
            price={product.price}
            compareAtPrice={product.compareAtPrice}
            currency={product.currency}
            className="text-2xl"
          />

          <StockBadge stockQuantity={product.stockQuantity} />

          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {product.tags.map((tag) => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
          )}

          <Button
            size="lg"
            className="w-full sm:w-auto"
            disabled={product.stockQuantity === 0}
            onClick={() =>
              addToCart({
                id: product.id,
                slug: product.slug,
                name: product.name,
                brandName: product.brandName,
                price: product.price,
                currency: product.currency,
                stockQuantity: product.stockQuantity,
              })
            }
          >
            {product.stockQuantity === 0 ? 'Out of stock' : 'Add to cart'}
          </Button>
        </div>
      </div>
    </div>
  );
}
