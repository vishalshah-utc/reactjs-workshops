import { PencilSquare } from 'react-bootstrap-icons';
import { useAuthUser } from '../hooks/useAuthUser';
import { LinkOrButton } from './LinkOrButton';
import type { Product } from '../types';

interface EditProductLinkProps {
  product: Product;
}

/**
 * Admins get a shortcut from a product to its edit form. Until Lab 6 this was `withAuth(EditLink, { role: 'admin' })`
 * from src/legacy/ — a class wrapper subscribing to storage. Now: one hook, one `if`.
 */
export function EditProductLink({ product }: EditProductLinkProps) {
  const user = useAuthUser();
  if (user?.role !== 'admin') return null;

  // ?edit= opens ProductForm on the list page (Demo 10); the category filter puts the product on that page.
  return (
    <LinkOrButton variant="link" to={`/products?category=${encodeURIComponent(product.category)}&edit=${product.id}`} tone="ghost" size="sm">
      <PencilSquare className="me-1" />
      Edit in catalogue
    </LinkOrButton>
  );
}
