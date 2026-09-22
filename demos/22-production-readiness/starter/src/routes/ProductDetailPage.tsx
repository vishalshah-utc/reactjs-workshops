import { Suspense, use } from 'react';
import { Badge, Button, Card, Col, Placeholder, Ratio, Row, Stack } from 'react-bootstrap';
import { ArrowLeft, Cart3, StarFill } from 'react-bootstrap-icons';
import { useQuery } from '@tanstack/react-query';
import { Link, data, useLoaderData, useParams, type LoaderFunctionArgs } from 'react-router';
import { productQuery, productReviewsQuery } from '../api/queries';
import { queryClient } from '../lib/queryClient';
import { ApiError } from '../lib/ApiError';
import { formatDate } from '../lib/format';
import { EditProductLink } from '../components/EditProductLink';
import { LiveStockBadge } from '../components/LiveStockBadge';
import { PriceTag } from '../components/PriceTag';
import { RelatedProducts } from '../components/RelatedProducts';
import { StockBadge } from '../components/StockBadge';
import { Tabs } from '../components/tabs/Tabs';
import { Text } from '../components/Text';
import { PageMeta } from '../components/PageMeta';
import { WidgetBoundary } from '../components/WidgetBoundary';
import { WishlistButton } from '../components/WishlistButton';
import { useCartStore } from '../store/cart';
import type { Review } from '../types';

/**
 * Demo 21 Block 2: DummyJSON's own `&delay=` parameter, so the reviews request
 * is reliably slower than the product request and the streaming is something
 * you can watch rather than something you have to believe. Set it to 0 and the
 * page behaves exactly as it did yesterday — that is the control experiment.
 */
const REVIEWS_DELAY_MS = 1500;

/**
 * Runs BEFORE the component renders — and now fills the CACHE instead of
 * fetching into thin air.
 *
 * `ensureQueryData` is "give me this data": a cache hit returns it
 * synchronously and issues no request; a miss fetches, stores and returns it.
 * That one word is the whole of instant back/forward. (`prefetchQuery` is the
 * same call that returns `void` and never throws — use it for data the page
 * can render without, never for data it needs.)
 *
 * `request.signal` is not forwarded any more, and must not be: the query owns
 * this request now, and a loader aborting it mid-flight would leave the cache
 * with a rejected entry that the next visitor inherits.
 */
export async function productDetailLoader({ params }: LoaderFunctionArgs) {
  const productId = params.productId ?? ''; // params are string | undefined — the route guarantees it, TS can't

  /**
   * NOT awaited. This is the line the whole block is about.
   *
   * `fetchQuery` starts the request and hands back the promise. Returning that
   * promise from the loader means the navigation does not wait for it: the
   * product page renders as soon as the product is here, and the reviews
   * arrive into a <Suspense> boundary afterwards.
   *
   * It is started BEFORE the awaited call, not after. Started after, the two
   * requests would run one behind the other — a waterfall — and the whole
   * point would be lost while the code still looked right.
   */
  const reviews = queryClient.fetchQuery(productReviewsQuery(productId, REVIEWS_DELAY_MS));
  /**
   * A promise nobody is awaiting YET is a promise that can reject with nobody
   * listening, and Node calls that an unhandled rejection and may end the
   * process. This empty catch marks it handled WITHOUT consuming it: `use()`
   * still sees the rejection and still throws it to the boundary, because
   * `.catch()` returns a new promise and leaves the original alone.
   */
  reviews.catch(() => {});

  try {
    return { product: await queryClient.ensureQueryData(productQuery(productId)), reviews };
  } catch (error) {
    // Turn a 404 into a thrown Response so the ErrorBoundary can render a
    // proper "not found" page instead of a generic failure.
    if (error instanceof ApiError && error.isNotFound) {
      throw data({ message: `No product with id ${productId}.` }, { status: 404, statusText: 'Not Found' });
    }
    throw error; // anything else → the boundary's generic branch
  }
}

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
              {formatDate(review.date)}
            </Text>
          </div>
          <Text>{review.comment}</Text>
        </li>
      ))}
    </ul>
  );
}

/** The same shape as a review row, so the panel does not jump when the real ones land. */
function ReviewsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading reviews" className="d-flex flex-column gap-3">
      {[0, 1, 2].map((row) => (
        <Placeholder key={row} as="div" animation="glow">
          <Placeholder xs={4} /> <Placeholder xs={2} />
          <Placeholder xs={11} className="d-block mt-1" />
        </Placeholder>
      ))}
    </div>
  );
}

/**
 * The component that READS the promise.
 *
 * `use(promise)` is not `await`. It tells React "I need this value"; React
 * suspends this component, shows the nearest <Suspense> fallback above it, and
 * re-renders here when the promise settles. It is the only hook that may be
 * called conditionally or inside a loop, because it is not really storing
 * anything — but it must still be called during render, never in a handler.
 *
 * A rejected promise makes `use` THROW during render, which is why there is an
 * error boundary above as well as a Suspense boundary. Suspense is for
 * pending; a boundary is for failed. They are different problems and React
 * keeps them apart on purpose.
 */
function ReviewsPanel({ reviews }: { reviews: Promise<Review[]> }) {
  const list = use(reviews);

  return (
    <>
      <Text variant="muted" className="small mb-2">
        {list.length === 0 ? 'No reviews yet.' : `${list.length} reviews`}
      </Text>
      <ReviewList reviews={list} />
    </>
  );
}

/** No loading state, no error state, no effect: the data is already here on the first render. */
export function ProductDetailPage() {
  // Typed from the loader itself — change the loader's return and this changes
  // with it. `reviews` is a Promise<Review[]> here, and TypeScript says so.
  const { product: loaded, reviews } = useLoaderData<typeof productDetailLoader>();
  const { productId = '' } = useParams();

  /**
   * The loader BLOCKED on this data, so the cache is warm and this hook reads
   * it synchronously. `initialData` is the belt to that braces: it tells
   * TypeScript `data` is a `Product` and never `undefined`, so the page keeps
   * its "no loading state" shape.
   *
   * What the hook buys over `useLoaderData` alone: the page now re-renders
   * when the cache changes — an invalidation after an edit, a background
   * refetch, or a price pushed in over the ticker in Lab 6.
   */
  const { data: product } = useQuery({ ...productQuery(productId), initialData: loaded });

  const addToCart = useCartStore((s) => s.add);

  return (
    <>
      {/* React 19 hoists these into <head> from wherever they are rendered. */}
      <PageMeta title={product.title} description={product.description} />

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
                  <LiveStockBadge productId={product.id} />
                  <span className="text-muted">★ {product.rating}</span>
                </div>

                <div className="d-flex gap-2">
                  <Button disabled={product.stock === 0} onClick={() => addToCart(product)}>
                    <Cart3 className="me-1" />
                    {product.stock === 0 ? 'Sold out' : 'Add to cart'}
                  </Button>
                  {/* Block 1: the same toggle, now optimistic — and able to be refused. */}
                  <WishlistButton productId={product.id} title={product.title} />
                </div>

                {/* COMPOUND: the page places the parts; <Tabs> owns which one is selected (uncontrolled — nobody else needs to know).
                    A count in one tab, a disabled tab, an icon — each is just JSX inside <Tabs.Tab>, not a new prop on an items array. */}
                <Tabs defaultValue="details">
                  <Tabs.List aria-label="Product information">
                    <Tabs.Tab value="details">Details</Tabs.Tab>
                    {/* The count used to live here, and cannot any more: nobody knows it
                        yet. That is the honest cost of streaming a section — you trade a
                        number in the tab for a page that renders a second sooner. */}
                    <Tabs.Tab value="reviews">
                      Reviews{' '}
                      <Badge bg="secondary" pill>
                        ★
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
                    {/* The boundary goes AROUND the slow part and nowhere higher. Put it
                        around the whole <Card> and the entire page waits for the reviews;
                        put it here and only this panel does. Boundary placement IS the
                        design decision — 📖 study-notes 19 §7. */}
                    <WidgetBoundary name="reviews">
                      <Suspense fallback={<ReviewsSkeleton />}>
                        <ReviewsPanel reviews={reviews} />
                      </Suspense>
                    </WidgetBoundary>
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
