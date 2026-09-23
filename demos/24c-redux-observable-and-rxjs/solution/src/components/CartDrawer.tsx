import { Alert, Badge, Button, ButtonGroup, Image, ListGroup, Offcanvas } from 'react-bootstrap';
import { Dash, Plus, Trash } from 'react-bootstrap-icons';
import { Link, useFetcher, useRouteLoaderData } from 'react-router';
import { useShallow } from 'zustand/shallow';
import { selectCount, selectSubtotal, useCartStore } from '../store/cart';
import { formatPrice } from '../lib/format';
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

  return (
    <Offcanvas show={isOpen} onHide={close} placement="end">
      <Offcanvas.Header closeButton>
        <Offcanvas.Title className="h6">
          Your cart{' '}
          {count > 0 && (
            <Badge bg="primary" pill>
              {count}
            </Badge>
          )}
        </Offcanvas.Title>
      </Offcanvas.Header>

      <Offcanvas.Body className="d-flex flex-column">
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
                  <Link to={`/products/${line.productId}`} onClick={close} className="text-decoration-none text-reset fw-semibold small d-block text-truncate">
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
                  <Button variant="outline-secondary" disabled className="px-3">
                    {line.qty}
                  </Button>
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
            <Link to="/login?redirectTo=/products" className="btn btn-primary w-100" onClick={close}>
              Sign in to check out
            </Link>
          )}
        </div>
      </Offcanvas.Body>
    </Offcanvas>
  );
}
