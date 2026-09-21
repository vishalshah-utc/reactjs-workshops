import { useState, type CSSProperties } from 'react';
import { discountedPrice, formatPrice } from '../../lib/format';
import type { PriceSize, PriceTagProps } from '../PriceTag';

// `CSSProperties` is React's type for a style object: camelCase keys, string | number values.
// A typo (`fontWieght`) or a wrong value type is a compile error — one thing inline style does better than a class name.
const ROW: CSSProperties = { display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 8 }; // a bare number is PIXELS: gap: 8 → "8px"
const FONT_SIZE: Record<PriceSize, CSSProperties['fontSize']> = { sm: '1rem', md: '1.25rem', lg: '1.75rem' }; // strings for any other unit

/**
 * Way 3 — inline `style`. No stylesheet, no class names, no collisions — and no pseudo-classes,
 * no media queries, and a fresh object per render. Right for one genuinely dynamic value; wrong as a system.
 */
export function PriceTagInline({ price, discountPercentage = 0, size = 'md' }: PriceTagProps) {
  const hasDiscount = discountPercentage >= 1;
  const finalPrice = hasDiscount ? discountedPrice(price, discountPercentage) : price;

  // `:hover` does not exist in a style object. The nearest thing is state + two handlers — which re-renders
  // the component on every mouse move in and out, and does nothing for keyboard focus. Ways 1, 2, 4 and 5 get it in one line.
  const [hover, setHover] = useState(false);

  return (
    <div style={ROW} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <span style={{ fontWeight: 600, fontSize: FONT_SIZE[size], color: hover ? 'var(--bs-primary)' : undefined }}>{formatPrice(finalPrice)}</span>
      {hasDiscount && (
        <>
          <s style={{ color: 'var(--bs-secondary-color)', fontSize: '0.875em' }}>{formatPrice(price)}</s>
          <span style={{ color: 'var(--bs-success)', fontSize: '0.875em', fontWeight: 500 }}>{Math.round(discountPercentage)}% off</span>
        </>
      )}
    </div>
  );
}
