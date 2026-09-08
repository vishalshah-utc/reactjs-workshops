import { MinusIcon, PlusIcon, ShoppingCartIcon, Trash2Icon, XIcon } from 'lucide-react';
import type { CartAction } from '@/types';
import type { CartTotals } from '@/lib/pricing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ProductImage } from '@/components/ProductImage';
import { formatPrice } from '@/lib/utils';

interface CartSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: CartTotals;
  promoCode: string | null;
  /** The reducer's dispatch, passed straight down. */
  dispatch: (action: CartAction) => void;
  promoDraft: string;
  onPromoDraftChange: (value: string) => void;
}

export function CartSheet({
  open, onOpenChange, cart, promoCode, dispatch, promoDraft, onPromoDraftChange,
}: CartSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-md gap-0 p-0">
        <SheetHeader className="p-6 pb-4">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCartIcon className="size-5" />
            Your cart
            {cart.itemCount > 0 && (
              <span className="text-muted-foreground text-sm font-normal">
                ({cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'})
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {cart.items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 pb-16 text-center">
            <ShoppingCartIcon className="text-muted-foreground size-10" />
            <div>
              <p className="font-medium">Your cart is empty</p>
              <p className="text-muted-foreground text-sm">Add something from the grid.</p>
            </div>
          </div>
        ) : (
          <>
            <ul className="flex-1 list-none overflow-y-auto px-6">
              {cart.items.map(({ product, quantity, lineTotal }) => (
                <li key={product.id} className="flex gap-3 border-b py-4 last:border-0">
                  <div className="bg-muted size-16 shrink-0 overflow-hidden rounded-md">
                    <ProductImage seed={product.slug} name={product.name} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium">{product.name}</p>
                    <p className="text-muted-foreground text-xs">{product.brandName}</p>

                    <div className="mt-2 flex items-center gap-1">
                      {/* TODO(lab-4.3): dispatch cart/setQuantity with quantity - 1.
                          The reducer turns a zero into a removal, so this button
                          needs no special case of its own. */}
                      <Button
                        variant="outline" size="icon" className="size-7"
                        aria-label={`Decrease quantity of ${product.name}`}
                      >
                        <MinusIcon className="size-3" />
                      </Button>
                      <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">{quantity}</span>
                      <Button
                        variant="outline" size="icon" className="size-7"
                        aria-label={`Increase quantity of ${product.name}`}
                        disabled={quantity >= product.stockQuantity}
                      >
                        <PlusIcon className="size-3" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive ml-1 size-7"
                        aria-label={`Remove ${product.name} from cart`}
                      >
                        <Trash2Icon className="size-3.5" />
                      </Button>
                    </div>

                    {quantity >= product.stockQuantity && (
                      <p className="text-warning mt-1 text-xs">Only {product.stockQuantity} in stock</p>
                    )}
                  </div>

                  <p className="text-sm font-medium tabular-nums">{formatPrice(lineTotal)}</p>
                </li>
              ))}
            </ul>

            <div className="space-y-3 border-t p-6">
              <div className="flex gap-2">
                <Input
                  placeholder="Promo code"
                  aria-label="Promo code"
                  value={promoDraft}
                  onChange={(event) => onPromoDraftChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && promoDraft.trim()) {
                      dispatch({ type: 'cart/applyPromo', code: promoDraft });
                    }
                  }}
                />
                {/* TODO(lab-4.3): dispatch cart/applyPromo and cart/clearPromo */}
                {promoCode ? (
                  <Button variant="outline" onClick={() => { dispatch({ type: 'cart/clearPromo' }); onPromoDraftChange(''); }}>
                    <XIcon />
                    Remove
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    disabled={!promoDraft.trim()}
                    onClick={() => dispatch({ type: 'cart/applyPromo', code: promoDraft })}
                  >
                    Apply
                  </Button>
                )}
              </div>

              {cart.promoError && <p className="text-destructive text-xs">{cart.promoError}</p>}
              {cart.promotion && (
                <p className="text-success text-xs">{cart.promotion.code} applied — {cart.promotion.label}</p>
              )}
              {cart.shipping > 0 && cart.amountToFreeShipping > 0 && (
                <p className="text-muted-foreground text-xs">
                  Spend {formatPrice(cart.amountToFreeShipping)} more for free shipping
                </p>
              )}

              <Separator />

              <dl className="space-y-1.5 text-sm">
                <Row label="Subtotal" value={formatPrice(cart.subtotal)} />
                {cart.discount > 0 && <Row label="Discount" value={`− ${formatPrice(cart.discount)}`} tone="success" />}
                <Row label="Tax (18% GST)" value={formatPrice(cart.tax)} />
                <Row label="Shipping" value={cart.shipping === 0 ? 'Free' : formatPrice(cart.shipping)} />
                <Separator className="my-2" />
                <div className="flex justify-between text-base font-semibold">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{formatPrice(cart.total)}</dd>
                </div>
              </dl>

              <Button className="w-full" size="lg">Checkout</Button>
              {/* TODO(lab-4.3): dispatch cart/clear */}
              <Button variant="ghost" size="sm" className="w-full">
                Clear cart
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: 'success' }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={tone === 'success' ? 'text-success tabular-nums' : 'tabular-nums'}>{value}</dd>
    </div>
  );
}
