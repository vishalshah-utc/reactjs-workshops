import { Alert } from 'react-bootstrap';
import { Link, useLocation } from 'react-router';

export function NotFoundPage() {
  const location = useLocation();

  return (
    <Alert variant="warning">
      <Alert.Heading className="h5">Page not found</Alert.Heading>
      <p>
        Nothing lives at <code>{location.pathname}</code>.
      </p>
      {/* react-bootstrap's `as` prop doesn't type-check against the router's Link — so a Link wearing Bootstrap's button classes */}
      <Link to="/products" className="btn btn-outline-secondary">
        Back to products
      </Link>
    </Alert>
  );
}
