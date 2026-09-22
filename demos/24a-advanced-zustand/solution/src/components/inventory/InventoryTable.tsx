import { memo } from 'react';
import { Form, Image, Table } from 'react-bootstrap';
import { Link } from 'react-router';
import { useShallow } from 'zustand/react/shallow';
import { formatPrice } from '../../lib/format';
import { useInventoryStore } from '../../store/inventory';
import { selectIsSelected, selectProduct, selectVisibleIds } from '../../store/inventory/selectors';
import { StockCell } from './StockCell';

/**
 * ONE row, subscribed to ONE product.
 *
 * `memo` is not what keeps this cheap — the selectors are. The row never reads
 * `entities`, only `entities[id]`, so a change to product 7 notifies row 7 and
 * nobody else. `memo` only stops the re-render that the PARENT causes when the
 * visible id list is unchanged but the table re-rendered for another reason.
 */
const InventoryRow = memo(function InventoryRow({ id }: { id: number }) {
  const product = useInventoryStore(selectProduct(id));
  const isSelected = useInventoryStore(selectIsSelected(id));

  // An object selector: two actions in one call builds a new object every time.
  // `useShallow` compares its KEYS, so this is stable — actions never change.
  const { toggleSelected, inspect } = useInventoryStore(
    useShallow((state) => ({ toggleSelected: state.toggleSelected, inspect: state.inspect })),
  );

  if (!product) return null;

  return (
    <tr>
      <td>
        <Form.Check
          checked={isSelected}
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
});

/**
 * The table subscribes to ONE thing: the list of ids it should render. Not the
 * entities, not the filters, not the selection — those belong to the rows.
 */
export function InventoryTable() {
  const ids = useInventoryStore(selectVisibleIds);

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
        {ids.map((id) => (
          <InventoryRow key={id} id={id} />
        ))}
      </tbody>
    </Table>
  );
}
