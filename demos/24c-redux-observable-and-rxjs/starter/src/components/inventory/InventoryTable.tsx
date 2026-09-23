import { useMemo } from 'react';
import { Form, Table } from 'react-bootstrap';
import { Link } from 'react-router';
import { formatPrice } from '../../lib/format';
import { StockBadge } from '../StockBadge';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  allSelectionToggled,
  makeSelectIsSelected,
  rowSelectionToggled,
  selectProductById,
  selectSelectedIds,
  selectVisibleIds,
} from '../../store/inventory';
import { inspected } from '../../store/recent';
import { StockCell } from './StockCell';

/**
 * F2 in the UI. The table maps over IDS; each row selects its own entity.
 *
 * The alternative — `useAppSelector(selectAllProducts)` here and `products.map`
 * — would re-render all twelve rows whenever any one of them changed, which is
 * exactly what normalisation exists to avoid.
 */
export function InventoryTable() {
  const dispatch = useAppDispatch();
  const visibleIds = useAppSelector(selectVisibleIds);
  const selectedIds = useAppSelector(selectSelectedIds);

  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  return (
    <Table hover responsive className="align-middle mb-0">
      <thead>
        <tr>
          <th style={{ width: 40 }}>
            <Form.Check
              checked={allSelected}
              aria-label="Select every visible row"
              onChange={() => dispatch(allSelectionToggled(visibleIds))}
            />
          </th>
          <th>Product</th>
          <th className="d-none d-md-table-cell">Category</th>
          <th className="text-end d-none d-sm-table-cell">Price</th>
          <th>Stock</th>
          <th className="d-none d-lg-table-cell">Status</th>
        </tr>
      </thead>
      <tbody>
        {visibleIds.map((id) => (
          <InventoryRow key={id} id={id} />
        ))}
      </tbody>
    </Table>
  );
}

function InventoryRow({ id }: { id: number }) {
  const dispatch = useAppDispatch();
  const product = useAppSelector((state) => selectProductById(state, id));
  const selectIsSelected = useMemo(() => makeSelectIsSelected(), []);
  const isSelected = useAppSelector((state) => selectIsSelected(state, id));

  if (!product) return null;

  return (
    <tr className={isSelected ? 'table-active' : undefined}>
      <td>
        <Form.Check
          checked={isSelected}
          aria-label={`Select ${product.title}`}
          onChange={() => dispatch(rowSelectionToggled(id))}
        />
      </td>
      <td>
        {/* F6: opening a product is what "inspected" means. */}
        <Link to={`/products/${id}`} className="text-decoration-none" onClick={() => dispatch(inspected(id))}>
          {product.title}
        </Link>
        <div className="small text-muted">#{id}</div>
      </td>
      <td className="d-none d-md-table-cell text-muted text-capitalize">{product.category}</td>
      <td className="text-end d-none d-sm-table-cell">{formatPrice(product.price)}</td>
      <td>
        <StockCell id={id} />
      </td>
      <td className="d-none d-lg-table-cell">
        <StockBadge stock={product.stock} lowStockThreshold={20} />
      </td>
    </tr>
  );
}
