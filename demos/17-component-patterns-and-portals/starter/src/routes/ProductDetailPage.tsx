import { Badge, Button, Card, Col, Ratio, Row, Stack } from 'react-bootstrap';
import { ArrowLeft, Cart3, Heart, HeartFill } from 'react-bootstrap-icons';
import { Link, data, useLoaderData, type LoaderFunctionArgs } from 'react-router';
import { getProduct } from '../api/services/products';
import { ApiError } from '../lib/ApiError';
import { EditProductLink } from '../components/EditProductLink';
import { PriceTag } from '../components/PriceTag';
import { RelatedProducts } from '../components/RelatedProducts';
import { StockBadge } from '../components/StockBadge';
import { useCartStore } from '../store/cart';
import { selectIsSaved, useWishlistStore } from '../store/wishlist';

/**
 * Runs BEFORE the component renders. Forward request.signal so the router can
 * cancel the fetch if the user navigates away mid-load.
 */
export async function productDetailLoader({ params, request }: LoaderFunctionArgs) {
  const productId = params.productId ?? ''; // params are string | undefined — the route guarantees it, TS can't
  try {
    return await getProduct(productId, { signal: request.signal });
  } catch (error) {
    // Turn a 404 into a thrown Response so the ErrorBoundary can render a
    // proper "not found" page instead of a generic failure.
    if (error instanceof ApiError && error.isNotFound) {
      throw data({ message: `No product with id ${productId}.` }, { status: 404, statusText: 'Not Found' });
    }
    throw error; // anything else → the boundary's generic branch
  }
}

/** No loading state, no error state, no effect: the data is already here on the first render. */
export function ProductDetailPage() {
  // Typed from the loader itself — change the loader's return and this changes with it.
  const product = useLoaderData<typeof productDetailLoader>();

  // Demo 12's WishlistProvider gave this page its Save button. The store keeps it — and subscribes
  // to ONE boolean: this product's saved flag, not the whole list.
  const saved = useWishlistStore(selectIsSaved(product.id));
  const toggleSave = useWishlistStore((s) => s.toggle);
  const addToCart = useCartStore((s) => s.add);

  return (
    <>
      <Link to="/products" className="btn btn-link ps-0 mb-3 text-decoration-none">
        <ArrowLeft className="me-1" />
        Back to products
      </Link>

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
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <div>
                    {/* TODO(lab-3.1): <Text as="div" variant="eyebrow"> and <Text as="h1" variant="title"> */}
                    <div className="text-muted small text-uppercase">{product.brand ?? product.category}</div>
                    <h1 className="h3 mb-0">{product.title}</h1>
                  </div>
                  {/* Renders nothing unless the signed-in user is an admin — a legacy HOC decides (src/legacy/withAuth.tsx). */}
                  <EditProductLink product={product} />
                </div>

                <div className="d-flex align-items-center gap-3 flex-wrap">
                  <PriceTag price={product.price} discountPercentage={product.discountPercentage} size="lg" />
                  <StockBadge stock={product.stock} size="lg" pill />
                  <span className="text-muted">★ {product.rating}</span>
                </div>

                <p className="mb-0">{product.description}</p>

                <div className="d-flex gap-2">
                  <Button disabled={product.stock === 0} onClick={() => addToCart(product)}>
                    <Cart3 className="me-1" />
                    {product.stock === 0 ? 'Sold out' : 'Add to cart'}
                  </Button>
                  <Button variant={saved ? 'danger' : 'outline-danger'} aria-pressed={saved} onClick={() => toggleSave(product.id)}>
                    {saved ? <HeartFill className="me-1" /> : <Heart className="me-1" />}
                    {saved ? 'Saved' : 'Save'}
                  </Button>
                </div>

                {/* TODO(lab-1.3): Details / Reviews / Shipping as <Tabs defaultValue="details"> — description, tags and the SKU list in
                    Details; product.reviews in Reviews (disabled when empty, with a count badge); shipping, warranty, returns in Shipping */}
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

      {/* Written with a legacy render prop (src/legacy/Fetch.tsx) — Lab 6 converts it. */}
      <RelatedProducts product={product} />
    </>
  );
}
