import { discountedPrice, formatPrice } from '../../lib/format';
import type { PriceTagProps } from '../PriceTag';
// A SIDE-EFFECT import: nothing is imported INTO this module. Vite appends the file to the page's
// stylesheet — globally, for the life of the page, whether or not this component is ever rendered.
import './pricetag.css';

/**
 * Way 1 — plain CSS. Class names are strings the stylesheet happens to define; nothing connects
 * the two but discipline (here, BEM: block__element--modifier) and a search box.
 */
export function PriceTagPlain({ price, discountPercentage = 0, size = 'md' }: PriceTagProps) {
  const hasDiscount = discountPercentage >= 1;
  const finalPrice = hasDiscount ? discountedPrice(price, discountPercentage) : price;

  return (
    <div className={`price price--${size}`}>
      <span className="price__final">{formatPrice(finalPrice)}</span>
      {hasDiscount && (
        <>
          <s className="price__was">{formatPrice(price)}</s>
          <span className="price__off">{Math.round(discountPercentage)}% off</span>
        </>
      )}
    </div>
  );
}
