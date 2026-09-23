import { Form, Image, Table } from 'react-bootstrap';
import { Link } from 'react-router';
import { formatPrice } from '../../lib/format';
import { useInventoryStore } from '../../store/inventory';
import { selectVisibleIds } from '../../store/inventory/selectors';
import { StockCell } from './StockCell';

/**
 * The naive version, and it works — which is the point. Every row is rendered
 * by this one component, from one subscription to `entities`, so a single
 * changed stock number re-renders the whole table.
 *
 * TODO(lab-3.4): split a row out into its own component subscribed to its own
 * entity through `selectProduct(id)` / `selectIsSelected(id)`, and take the
 * actions with `useShallow` — an object selector builds a new object on every
 * call, and Zustand compares by reference. Prove it with React DevTools'
 * "Highlight updates while components render" before and after.
 */
export function InventoryTable() {
  const ids = useInventoryStore(selectVisibleIds);
  const entities = useInventoryStore((state) => state.entities);
  const selected = useInventoryStore((state) => state.selected);
  const toggleSelected = useInventoryStore((state) => state.toggleSelected);
  const inspect = useInventoryStore((state) => state.inspect);

  return (
    <Table hover responsive className="align-middle mb-0">
      <thead>
        <tr>
          <th style={{ width: 40 }}></th>
          <th></th>
          <th>Product</th>
          <th className="text-end">Price</th>
          <th style={{ width: 200 }}>Stock</th>
        </tr>
      </thead>
      <tbody>
        {ids.map((id) => {
          const product = entities[id];
          if (!product) return null;
          return (
            <tr key={id}>
              <td>
                <Form.Check
                  checked={selected.includes(id)}
                  onChange={() => toggleSelected(id)}
                  aria-label={`Select ${product.title}`}
                />
              </td>
              <td style={{ width: 52 }}>
                <Image src={product.thumbnail} width={36} height={36} alt="" className="bg-body-secondary rounded" />
              </td>
              <td>
                <Link to={`/products/${id}`} onClick={() => inspect(id)} className="text-decoration-none">
                  {product.title}
                </Link>
                <div className="text-muted small text-capitalize">{product.category.replace(/-/g, ' ')}</div>
              </td>
              <td className="text-end">{formatPrice(product.price)}</td>
              <td>
                <StockCell id={id} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}
