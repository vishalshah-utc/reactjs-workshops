import { Badge, Button, Card, Col, Ratio, Row, Stack } from 'react-bootstrap';
import { ArrowLeft, Cart3, Heart, HeartFill, StarFill } from 'react-bootstrap-icons';
import { Link, data, useLoaderData, type LoaderFunctionArgs } from 'react-router';
import { getProduct } from '../api/services/products';
import { ApiError } from '../lib/ApiError';
import { EditProductLink } from '../components/EditProductLink';
import { PriceTag } from '../components/PriceTag';
import { RelatedProducts } from '../components/RelatedProducts';
import { StockBadge } from '../components/StockBadge';
import { Tabs } from '../components/tabs/Tabs';
import { Text } from '../components/Text';
import { useCartStore } from '../store/cart';
import { selectIsSaved, useWishlistStore } from '../store/wishlist';
import type { Review } from '../types';

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

const reviewDate = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });

function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return <Text variant="muted">No reviews yet.</Text>;
  return (
    <ul className="list-unstyled mb-0 d-flex flex-column gap-3">
      {reviews.map((review) => (
        <li key={`${review.reviewerEmail}-${review.date}`}>
          <div className="d-flex align-items-center gap-2 small">
            <span className="text-warning" aria-label={`${review.rating} out of 5`}>
              {Array.from({ length: review.rating }, (_, i) => (
                <StarFill key={i} aria-hidden="true" />
              ))}
            </span>
            <span className="fw-semibold">{review.reviewerName}</span>
            <Text as="time" variant="muted" className="small" dateTime={review.date}>
              {reviewDate.format(new Date(review.date))}
            </Text>
          </div>
          <Text>{review.comment}</Text>
        </li>
      ))}
    </ul>
  );
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
  const reviews = product.reviews ?? [];

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
                    {/* Polymorphic Text: the eyebrow is a <div>, the title an <h1> — same component, the classes come from `variant`. */}
                    <Text as="div" variant="eyebrow">
                      {product.brand ?? product.category}
                    </Text>
                    <Text as="h1" variant="title">
                      {product.title}
                    </Text>
                  </div>
                  {/* Renders nothing unless the signed-in user is an admin — one hook inside, no wrapper outside. */}
                  <EditProductLink product={product} />
                </div>

                <div className="d-flex align-items-center gap-3 flex-wrap">
                  <PriceTag price={product.price} discountPercentage={product.discountPercentage} size="lg" />
                  <StockBadge stock={product.stock} size="lg" pill />
                  <span className="text-muted">★ {product.rating}</span>
                </div>

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

                {/* COMPOUND: the page places the parts; <Tabs> owns which one is selected (uncontrolled — nobody else needs to know).
                    A count in one tab, a disabled tab, an icon — each is just JSX inside <Tabs.Tab>, not a new prop on an items array. */}
                <Tabs defaultValue="details">
                  <Tabs.List aria-label="Product information">
                    <Tabs.Tab value="details">Details</Tabs.Tab>
                    <Tabs.Tab value="reviews" disabled={reviews.length === 0}>
                      Reviews{' '}
                      <Badge bg="secondary" pill>
                        {reviews.length}
                      </Badge>
                    </Tabs.Tab>
                    <Tabs.Tab value="shipping">Shipping &amp; returns</Tabs.Tab>
                  </Tabs.List>

                  <Tabs.Panel value="details">
                    <Text className="mb-3">{product.description}</Text>
                    <div className="d-flex flex-wrap gap-1 mb-3">
                      {product.tags?.map((tag) => (
                        <Badge key={tag} bg="light" text="dark" className="border">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <dl className="row mb-0 small">
                      <dt className="col-4 text-muted fw-normal">SKU</dt>
                      <dd className="col-8 font-monospace">{product.sku}</dd>
                      <dt className="col-4 text-muted fw-normal">Category</dt>
                      <dd className="col-8 text-capitalize">{product.category}</dd>
                      {product.weight != null && (
                        <>
                          <dt className="col-4 text-muted fw-normal">Weight</dt>
                          <dd className="col-8">{product.weight} kg</dd>
                        </>
                      )}
                      {product.dimensions && (
                        <>
                          <dt className="col-4 text-muted fw-normal">Dimensions</dt>
                          <dd className="col-8">
                            {product.dimensions.width} × {product.dimensions.height} × {product.dimensions.depth} cm
                          </dd>
                        </>
                      )}
                    </dl>
                  </Tabs.Panel>

                  <Tabs.Panel value="reviews">
                    <ReviewList reviews={reviews} />
                  </Tabs.Panel>

                  <Tabs.Panel value="shipping">
                    <dl className="row mb-0 small">
                      <dt className="col-4 text-muted fw-normal">Shipping</dt>
                      <dd className="col-8">{product.shippingInformation}</dd>
                      <dt className="col-4 text-muted fw-normal">Availability</dt>
                      <dd className="col-8">{product.availabilityStatus}</dd>
                      <dt className="col-4 text-muted fw-normal">Warranty</dt>
                      <dd className="col-8">{product.warrantyInformation}</dd>
                      <dt className="col-4 text-muted fw-normal">Returns</dt>
                      <dd className="col-8">{product.returnPolicy}</dd>
                      {product.minimumOrderQuantity != null && (
                        <>
                          <dt className="col-4 text-muted fw-normal">Minimum order</dt>
                          <dd className="col-8">{product.minimumOrderQuantity} units</dd>
                        </>
                      )}
                    </dl>
                  </Tabs.Panel>
                </Tabs>
              </Stack>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <RelatedProducts product={product} />
    </>
  );
}
