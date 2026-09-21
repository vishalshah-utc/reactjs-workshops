import { useState } from 'react';
import { Alert, Badge, Button, ButtonGroup, Image, ListGroup, Offcanvas } from 'react-bootstrap';
import { Dash, Plus, Trash } from 'react-bootstrap-icons';
import { Link, useFetcher, useRouteLoaderData } from 'react-router';
import { useShallow } from 'zustand/shallow';
import { selectCount, selectSubtotal, useCartStore } from '../store/cart';
import { formatPrice } from '../lib/format';
import { LinkOrButton } from './LinkOrButton';
import { WidgetBoundary } from './WidgetBoundary';
import type { checkoutAction } from '../routes/account/checkout';
import type { rootLoader } from '../routes/RootLayout';

/**
 * Rendered ONCE, in the layout. Nobody passes it props: it reads the cart
 * store directly, and the header's button opens it through the same store.
 */
export function CartDrawer() {
  // One selector per value: each subscription re-renders only when ITS slice changes.
  const lines = useCartStore((s) => s.lines);
  const isOpen = useCartStore((s) => s.isOpen);
  const count = useCartStore(selectCount);
  const subtotal = useCartStore(selectSubtotal);
  // Selecting an OBJECT needs useShallow — otherwise `{…}` is a new reference every time and the component re-renders on every store change.
  const { setQty, remove, close } = useCartStore(useShallow((s) => ({ setQty: s.setQty, remove: s.remove, close: s.close })));

  const fetcher = useFetcher<typeof checkoutAction>();
  const user = useRouteLoaderData<typeof rootLoader>('root')?.user ?? null;
  const submitting = fetcher.state !== 'idle';

  // Focus goes back to the button that opened the drawer when it closes — EXCEPT when it closed because the
  // user followed a link. Then the new page's heading takes focus (RouteAnnouncer), and a "restore" firing
  // 300 ms later, when the slide-out finishes, would steal it back to the header. Two things fighting over
  // focus is the classic bug; the one that ran LAST wins, so the drawer must stand down.
  const [restoreFocus, setRestoreFocus] = useState(true);
  function followLink() {
    setRestoreFocus(false);
    close();
  }

  return (
    <Offcanvas
      show={isOpen}
      onHide={close}
      placement="end"
      // All four are the library's defaults. Set them anyway: accessibility that lives in a default is accessibility a version bump can remove.
      keyboard // Escape closes
      autoFocus // focus moves INTO the drawer when it opens
      enforceFocus // and stays there while it is open
      restoreFocus={restoreFocus} // and goes back to the opener when it closes
      onExited={() => setRestoreFocus(true)}
      aria-labelledby="cart-drawer-title"
    >
      <Offcanvas.Header closeButton>
        <Offcanvas.Title id="cart-drawer-title" className="h6">
          Your cart{' '}
          {count > 0 && (
            <Badge bg="primary" pill>
              {count}
            </Badge>
          )}
        </Offcanvas.Title>
      </Offcanvas.Header>

      <Offcanvas.Body className="d-flex flex-column">
        {/* A PER-WIDGET boundary: a render error in the cart body shows an alert HERE, inside the drawer — the header,
            the page and the drawer's own frame stay. Adding or removing a line also resets it (resetKeys). */}
        <WidgetBoundary name="cart" resetKeys={[lines.length]}>
        {fetcher.data?.ok === true && fetcher.state === 'idle' && (
          <Alert variant="success">
            Order placed — cart #{fetcher.data.cart.id}, {fetcher.data.cart.totalQuantity} items,{' '}
            {formatPrice(fetcher.data.cart.discountedTotal)}. DummyJSON simulates writes, so it won't appear under
            Account › Carts.
          </Alert>
        )}
        {fetcher.data?.ok === false && fetcher.state === 'idle' && <Alert variant="danger">{fetcher.data.error}</Alert>}

        {lines.length === 0 ? (
          <p className="text-muted">Your cart is empty. Add something from the catalogue.</p>
        ) : (
          <ListGroup variant="flush" className="mb-3">
            {lines.map((line) => (
              <ListGroup.Item key={line.productId} className="d-flex align-items-center gap-3 px-0">
                <Image src={line.thumbnail} width={48} height={48} className="object-fit-contain bg-body-secondary rounded" alt="" />
                <div className="flex-grow-1 min-w-0">
                  <Link to={`/products/${line.productId}`} onClick={followLink} className="text-decoration-none text-reset fw-semibold small d-block text-truncate">
                    {line.title}
                  </Link>
                  <div className="small text-muted">
                    {formatPrice(line.price)} × {line.qty}
                  </div>
                </div>
                <ButtonGroup size="sm" aria-label={`Quantity of ${line.title}`}>
                  <Button variant="outline-secondary" aria-label="Decrease quantity" onClick={() => setQty(line.productId, line.qty - 1)}>
                    <Dash />
                  </Button>
                  {/* Not a disabled <button> — a disabled control is skipped by Tab and read as "dimmed". A live span: the new quantity is announced. */}
                  <span className="btn btn-outline-secondary px-3 pe-none" aria-live="polite" aria-atomic="true">
                    {line.qty}
                  </span>
                  <Button variant="outline-secondary" aria-label="Increase quantity" onClick={() => setQty(line.productId, line.qty + 1)}>
                    <Plus />
                  </Button>
                </ButtonGroup>
                <Button size="sm" variant="outline-danger" aria-label={`Remove ${line.title}`} onClick={() => remove(line.productId)}>
                  <Trash />
                </Button>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}

        <div className="mt-auto border-top pt-3">
          <div className="d-flex justify-content-between fw-semibold mb-3">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>

          {user ? (
            // No fields: the action reads the cart from the STORE. The /account middleware guards it.
            <fetcher.Form method="post" action="/account/checkout">
              <Button type="submit" className="w-100" disabled={lines.length === 0 || submitting}>
                {submitting ? 'Placing order…' : 'Checkout'}
              </Button>
            </fetcher.Form>
          ) : (
            <LinkOrButton variant="link" to="/login?redirectTo=/products" block onClick={followLink}>
              Sign in to check out
            </LinkOrButton>
          )}
        </div>
        </WidgetBoundary>
      </Offcanvas.Body>
    </Offcanvas>
  );
}
