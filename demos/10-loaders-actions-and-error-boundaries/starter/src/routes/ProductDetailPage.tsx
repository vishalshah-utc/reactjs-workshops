import { useCallback } from 'react';
import { Badge, Card, Col, Placeholder, Ratio, Row, Stack } from 'react-bootstrap';
import { ArrowLeft } from 'react-bootstrap-icons';
import { Link, useParams } from 'react-router';
import { getProduct } from '../api/services/products';
import { useApi } from '../hooks/useApi';
import { PriceTag } from '../components/PriceTag';
import { StockBadge } from '../components/StockBadge';
import { ErrorNotice } from '../components/ErrorNotice';

/** A real page with a real URL — linkable, bookmarkable, back-button-able. */
// TODO(lab-1.2): export productDetailLoader({ params, request }: LoaderFunctionArgs); a 404 ApiError becomes `throw data(…, { status: 404 })`
export function ProductDetailPage() {
  // Params are always STRINGS — the generic says which names exist, not that they're numbers.
  const { productId = '' } = useParams<{ productId: string }>();
  const fetcher = useCallback((signal: AbortSignal) => getProduct(productId, { signal }), [productId]);
  const { data: product, loading, error, reload } = useApi(fetcher, [productId]);

  return (
    <>
      <Link to="/products" className="btn btn-link ps-0 mb-3 text-decoration-none">
        <ArrowLeft className="me-1" />
        Back to products
      </Link>

      <ErrorNotice error={error} onRetry={reload} />

      {loading && (
        <Placeholder as="div" animation="glow">
          <Placeholder xs={12} style={{ height: 320 }} className="rounded" />
        </Placeholder>
      )}

      {product && !loading && (
        <Card>
          <Card.Body>
            <Row className="g-4">
              <Col md={5}>
                <Ratio aspectRatio="1x1">
                  <img src={product.thumbnail} alt="" className="object-fit-contain bg-body-secondary rounded" />
                </Ratio>
              </Col>
              <Col md={7}>
                <Stack gap={3}>
                  <div>
                    <div className="text-muted small text-uppercase">{product.brand ?? product.category}</div>
                    <h1 className="h3 mb-0">{product.title}</h1>
                  </div>

                  <div className="d-flex align-items-center gap-3 flex-wrap">
                    <PriceTag price={product.price} discountPercentage={product.discountPercentage} size="lg" />
                    <StockBadge stock={product.stock} />
                    <span className="text-muted">★ {product.rating}</span>
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
                    <dt className="col-4 text-muted fw-normal">SKU</dt>
                    <dd className="col-8 font-monospace">{product.sku}</dd>
                    <dt className="col-4 text-muted fw-normal">Warranty</dt>
                    <dd className="col-8">{product.warrantyInformation}</dd>
                    <dt className="col-4 text-muted fw-normal">Shipping</dt>
                    <dd className="col-8">{product.shippingInformation}</dd>
                    <dt className="col-4 text-muted fw-normal">Returns</dt>
                    <dd className="col-8">{product.returnPolicy}</dd>
                  </dl>
                </Stack>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}
    </>
  );
}
