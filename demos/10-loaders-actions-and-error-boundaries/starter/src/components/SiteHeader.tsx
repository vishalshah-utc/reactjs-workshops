import { useState } from 'react';
import { Badge, Button, Container, Form, Nav, Navbar } from 'react-bootstrap';
import { Cart3, Heart, PersonPlus, Shop } from 'react-bootstrap-icons';
import { Link, NavLink } from 'react-router';
import { SignupForm } from './SignupForm';

/** Data, not markup. `to` paths, not `href`s — these are router links now. */
const NAV_LINKS = [
  { label: 'Products', to: '/products' },
  { label: 'About', to: '/about' },
];

function CountBadge({ count, label }: { count: number; label: string }) {
  if (count <= 0) return null;
  return (
    <Badge pill bg="primary" className="position-absolute top-0 start-100 translate-middle">
      {count}
      <span className="visually-hidden"> {label}</span>
    </Badge>
  );
}

interface SiteHeaderProps {
  cartCount?: number;
  wishlistCount?: number;
}

export function SiteHeader({ cartCount = 0, wishlistCount = 0 }: SiteHeaderProps) {
  const [showSignup, setShowSignup] = useState(false);

  return (
    <Navbar bg="dark" data-bs-theme="dark" expand="md" sticky="top">
      <Container>
        <Navbar.Brand as={Link} to="/">
          <Shop className="me-2" />
          ShopScope
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-nav" />
        <Navbar.Collapse id="main-nav">
          <Nav className="me-auto">
            {/* as={NavLink}: a ROUTER link (no page reload) that knows when it is active. `end` = exact match only. */}
            {NAV_LINKS.map((link) => (
              <Nav.Link key={link.to} as={NavLink} to={link.to} end={link.to === '/products'}>
                {link.label}
              </Nav.Link>
            ))}
          </Nav>

          <Form className="d-none d-sm-flex me-2" role="search" onSubmit={(e) => e.preventDefault()}>
            <Form.Control type="search" size="sm" placeholder="Search products" aria-label="Search products" />
          </Form>

          <div className="d-flex gap-3">
            <Button variant="outline-light" size="sm" className="position-relative" aria-label={`Wishlist, ${wishlistCount} items`}>
              <Heart />
              <CountBadge count={wishlistCount} label="saved" />
            </Button>
            <Button variant="outline-light" size="sm" className="position-relative" aria-label={`Cart, ${cartCount} items`}>
              <Cart3 />
              <CountBadge count={cartCount} label="in cart" />
            </Button>
            <Button variant="light" size="sm" onClick={() => setShowSignup(true)}>
              <PersonPlus className="me-1" />
              Sign up
            </Button>
          </div>
        </Navbar.Collapse>
      </Container>

      <SignupForm show={showSignup} onClose={() => setShowSignup(false)} />
    </Navbar>
  );
}
