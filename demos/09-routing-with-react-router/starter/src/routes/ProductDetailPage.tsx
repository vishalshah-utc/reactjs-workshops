import { useParams } from 'react-router';

/** Shows the URL param and nothing else. Lab 3.1 fetches and renders the product. */
// TODO(lab-3.1): useApi(getProduct(productId)) with loading / error / product; a back link. Params are STRINGS — type them: useParams<{ productId: string }>()
export function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  return <p>Product #{productId}</p>;
}
