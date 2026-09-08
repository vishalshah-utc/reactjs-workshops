import type { GridDensity, Product } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { PriceTag } from '@/components/PriceTag';
import { ProductImage } from '@/components/ProductImage';

interface ProductCardProps {
  product: Product;
  density?: GridDensity;
}

// TODO(lab-3.1): Flesh out the card.
//   - `const isOutOfStock = product.stockQuantity === 0` and dim the Card
//     with `opacity-75` when true.
//   - Add "Bestseller" / "New" <Badge>es, positioned absolutely over the
//     image, when product.tags includes them. Use `cond && <X/>`.
//
// TODO(lab-3.2): Add the wishlist heart. THIS IS THE IMPORTANT ONE.
//   - `const [saved, setSaved] = useState(false)` at the top.
//   - A <Button size="icon"> over the image with a <HeartIcon />, filled red
//     when saved, toggled with `setSaved((was) => !was)`.
//   - Give it aria-pressed and a real aria-label.
//   Ask yourself: this component renders 24 times. Is there one `saved`, or
//   twenty-four? Guide, Lab 3 step B.
//
// TODO(lab-3.3): Add brand, name, <Rating>, <StockBadge> and an "Add to cart"
//   <Button> that is disabled when out of stock. Respect `density`: in
//   compact mode drop the rating and the stock badge entirely and tighten the
//   padding. Guide, Lab 3 step C.
export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
      <div className="bg-muted relative aspect-square overflow-hidden">
        <ProductImage
          seed={product.slug}
          name={product.name}
          className="transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <CardContent className="flex flex-col gap-2 p-4">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          {product.brandName}
        </p>
        <h3 className="line-clamp-2 font-medium leading-snug">{product.name}</h3>
        <PriceTag price={product.price} compareAtPrice={product.compareAtPrice} currency={product.currency} />
      </CardContent>
    </Card>
  );
}
