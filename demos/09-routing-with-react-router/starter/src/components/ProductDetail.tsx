import { useCallback } from 'react';
import { Badge, Offcanvas, Placeholder, Ratio, Stack } from 'react-bootstrap';
import { getProduct } from '../api/services/products';
import { useApi } from '../hooks/useApi';
import { PriceTag } from './PriceTag';
import { StockBadge } from './StockBadge';
import { ErrorNotice } from './ErrorNotice';

interface ProductDetailProps {
  /** null = nothing selected, drawer closed. */
  id: number | null;
  onClose: () => void;
}

/** Fetch-on-select, now three lines: the hook owns the ceremony. */
export function ProductDetail({ id, onClose }: ProductDetailProps) {
  // useCallback so the fetcher's identity only changes when `id` does.
  // `skip` keeps it from running while id is null — so `id ?? -1` is never actually requested.
  const fetcher = useCallback((signal: AbortSignal) => getProduct(id ?? -1, { signal }), [id]);
  const { data: product, loading, error, reload } = useApi(fetcher, [id], { skip: id === null });

  return (
    <Offcanvas show={id !== null} onHide={onClose} placement="end">
      <Offcanvas.Header closeButton>
        <Offcanvas.Title className="h6">{(!loading && product?.title) || `Product #${id}`}</Offcanvas.Title>
      </Offcanvas.Header>

      <Offcanvas.Body>
        {loading && (
          <Placeholder as="div" animation="glow">
            <Placeholder xs={12} style={{ height: 200 }} className="mb-3 rounded" />
            <Placeholder xs={8} /> <Placeholder xs={5} /> <Placeholder xs={12} /> <Placeholder xs={10} />
          </Placeholder>
        )}

        <ErrorNotice error={error} onRetry={reload} />

        {product && !loading && (
          <Stack gap={3}>
            <Ratio aspectRatio="4x3">
              <img src={product.thumbnail} alt="" className="object-fit-contain bg-body-secondary rounded" />
            </Ratio>

            <div className="d-flex justify-content-between align-items-center">
              <PriceTag price={product.price} discountPercentage={product.discountPercentage} size="lg" />
              <StockBadge stock={product.stock} />
            </div>

            <p className="mb-0">{product.description}</p>

            <div className="d-flex flex-wrap gap-1">
              {product.tags?.map((tag) => (
                <Badge key={tag} bg="light" text="dark" className="border">
                  {tag}
                </Badge>
              ))}
            </div>

            <dl className="row mb-0 small">
              <dt className="col-5 text-muted fw-normal">Brand</dt>
              <dd className="col-7">{product.brand ?? '—'}</dd>
              <dt className="col-5 text-muted fw-normal">Category</dt>
              <dd className="col-7 text-capitalize">{product.category}</dd>
              <dt className="col-5 text-muted fw-normal">Rating</dt>
              <dd className="col-7">★ {product.rating}</dd>
              <dt className="col-5 text-muted fw-normal">SKU</dt>
              <dd className="col-7 font-monospace">{product.sku}</dd>
              <dt className="col-5 text-muted fw-normal">Warranty</dt>
              <dd className="col-7">{product.warrantyInformation}</dd>
              <dt className="col-5 text-muted fw-normal">Shipping</dt>
              <dd className="col-7">{product.shippingInformation}</dd>
              <dt className="col-5 text-muted fw-normal">Returns</dt>
              <dd className="col-7">{product.returnPolicy}</dd>
            </dl>
          </Stack>
        )}
      </Offcanvas.Body>
    </Offcanvas>
  );
}
