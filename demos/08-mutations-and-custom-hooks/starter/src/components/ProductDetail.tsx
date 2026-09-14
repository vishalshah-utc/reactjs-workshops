import { useEffect, useState } from 'react';
import axios from 'axios';
import { Badge, Offcanvas, Placeholder, Ratio, Stack } from 'react-bootstrap';
import { getProduct } from '../api/services/products';
import { ApiError } from '../lib/ApiError';
import type { Product } from '../types';
import { PriceTag } from './PriceTag';
import { StockBadge } from './StockBadge';
import { ErrorNotice } from './ErrorNotice';

interface ProductDetailProps {
  /** null = nothing selected, drawer closed. */
  id: number | null;
  onClose: () => void;
}

/**
 * Fetch-on-select. Its own three states, its own AbortController — the same
 * shape as App's list effect, keyed on `id` instead of the filters.
 */
// TODO(lab-4.3): replace the hand-written effect with useApi(fetcher, [id], { skip: id === null })
export function ProductDetail({ id, onClose }: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    if (id === null) return; // nothing selected — don't fetch (and don't create a controller)

    const controller = new AbortController();

    async function load(productId: number) {
      try {
        setLoading(true);
        setError(null);
        setProduct(null); // never show the PREVIOUS product under the new title
        setProduct(await getProduct(productId, { signal: controller.signal }));
      } catch (err) {
        if (axios.isCancel(err)) return;
        setError(ApiError.from(err));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load(id);
    return () => controller.abort();
  }, [id]);

  return (
    <Offcanvas show={id !== null} onHide={onClose} placement="end">
      <Offcanvas.Header closeButton>
        <Offcanvas.Title className="h6">{product?.title ?? `Product #${id}`}</Offcanvas.Title>
      </Offcanvas.Header>

      <Offcanvas.Body>
        {loading && (
          <Placeholder as="div" animation="glow">
            <Placeholder xs={12} style={{ height: 200 }} className="mb-3 rounded" />
            <Placeholder xs={8} /> <Placeholder xs={5} /> <Placeholder xs={12} /> <Placeholder xs={10} />
          </Placeholder>
        )}

        <ErrorNotice error={error} />

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
