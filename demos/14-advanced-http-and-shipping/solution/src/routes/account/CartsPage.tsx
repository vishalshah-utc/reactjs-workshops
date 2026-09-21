import { Badge, Card, Table } from 'react-bootstrap';
import { useLoaderData, type LoaderFunctionArgs } from 'react-router';
import { listCartsForUser } from '../../api/services/users';
import { formatPrice } from '../../lib/format';
import { userContext } from '../middleware';

/** The user comes from middleware CONTEXT — set once for the whole /account subtree, no second request. */
export async function cartsLoader({ context, request }: LoaderFunctionArgs) {
  const user = context.get(userContext);
  if (!user) throw new Error('cartsLoader ran without authMiddleware');
  return { carts: await listCartsForUser(user.id, { signal: request.signal }) };
}

export function CartsPage() {
  const { carts } = useLoaderData<typeof cartsLoader>();

  return (
    <Card>
      <Card.Header className="fw-semibold">Your carts</Card.Header>
      {carts.length === 0 ? (
        <Card.Body className="text-muted">No carts yet.</Card.Body>
      ) : (
        <Table hover responsive className="mb-0">
          <thead>
            <tr>
              <th>#</th>
              <th>Items</th>
              <th>Quantity</th>
              <th className="text-end">Total</th>
            </tr>
          </thead>
          <tbody>
            {carts.map((cart) => (
              <tr key={cart.id}>
                <td className="text-muted">{cart.id}</td>
                <td>{cart.totalProducts}</td>
                <td>{cart.totalQuantity}</td>
                <td className="text-end">
                  {formatPrice(cart.discountedTotal)}{' '}
                  <Badge bg="success-subtle" text="success-emphasis">
                    saved {formatPrice(cart.total - cart.discountedTotal)}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}
