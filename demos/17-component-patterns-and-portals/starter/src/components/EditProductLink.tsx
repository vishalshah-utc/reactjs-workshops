import { PencilSquare } from 'react-bootstrap-icons';
import { Link } from 'react-router';
import { withAuth, type InjectedAuthProps } from '../legacy/withAuth';
import { button } from '../lib/variants';
import type { Product } from '../types';

interface EditLinkProps extends InjectedAuthProps {
  product: Product;
}

/** The inner component declares the INJECTED prop (`user`) alongside its own. Only the HOC ever supplies it. */
function EditLink({ product, user }: EditLinkProps) {
  // ?edit= opens ProductForm on the list page (Demo 10); the category filter puts the product on that page.
  return (
    <Link
      to={`/products?category=${encodeURIComponent(product.category)}&edit=${product.id}`}
      className={button({ tone: 'ghost', size: 'sm' })}
      title={`Signed in as ${user.username}`}
    >
      <PencilSquare className="me-1" />
      Edit in catalogue
    </Link>
  );
}

// TODO(lab-6.2): delete the HOC — export a plain EditProductLink({ product }) that calls useAuthUser() and returns null unless admin
/** Admins get a shortcut from a product to its edit form — gated the 2018 way, by wrapping. Public props: { product }. */
export const EditProductLink = withAuth(EditLink, { role: 'admin' });
