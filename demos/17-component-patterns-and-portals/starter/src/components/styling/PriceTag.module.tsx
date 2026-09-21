import { discountedPrice, formatPrice } from '../../lib/format';
import type { PriceTagProps } from '../PriceTag';
// NOT a side effect: a `.module.css` import returns an OBJECT — { price: 'PriceTag-module__price___a1b2c', … }.
// Vite hashes every class name, so this file's `.price` cannot collide with pricetag.css's `.price`.
import styles from './PriceTag.module.css';

/**
 * Way 2 — CSS Modules. Same CSS, same author, but the class names are local to this file:
 * the stylesheet is still global, the NAMES are not. Zero config in Vite — the `.module.css` suffix is the switch.
 */
export function PriceTagModule({ price, discountPercentage = 0, size = 'md' }: PriceTagProps) {
  const hasDiscount = discountPercentage >= 1;
  const finalPrice = hasDiscount ? discountedPrice(price, discountPercentage) : price;

  // Conditional classes by hand (study-notes 04 §8). `false` in a template string prints "false" — hence filter(Boolean).
  const rootClass = [styles.price, size === 'sm' && styles.sm, size === 'lg' && styles.lg].filter(Boolean).join(' ');

  return (
    <div className={rootClass}>
      <span className={styles.final}>{formatPrice(finalPrice)}</span>
      {hasDiscount && (
        <>
          <s className={styles.was}>{formatPrice(price)}</s>
          <span className={styles.off}>{Math.round(discountPercentage)}% off</span>
        </>
      )}
    </div>
  );
}
