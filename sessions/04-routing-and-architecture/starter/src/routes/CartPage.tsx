import { Link } from 'react-router';
import { ShoppingCartIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';

/**
 * A dedicated /cart page.
 *
 * The cart sheet in the header is still there and still works — this is the
 * shareable, refreshable, linkable version of the same thing. Session 7 turns
 * it into the first step of a checkout wizard.
 *
 * It is deliberately thin for now: the point of this route in Session 4 is
 * that a second real page exists, so nested layouts and navigation have
 * something to navigate between.
 */
export function CartPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Your cart"
        description="A real URL you can refresh, bookmark and send to someone."
      />
      <EmptyState
        title="Open the cart from the header"
        description="Session 7 moves the full line-item editor here and adds checkout."
        icon={<ShoppingCartIcon className="text-muted-foreground size-8" />}
        action={
          <Button asChild variant="outline" size="sm">
            <Link to="/">Continue shopping</Link>
          </Button>
        }
      />
    </div>
  );
}
