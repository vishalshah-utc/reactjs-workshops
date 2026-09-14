import { useState } from 'react';
import { Badge, Button, Container, Form, Image, Nav, Navbar } from 'react-bootstrap';
import { BoxArrowInRight, Cart3, Heart, PersonPlus, Shop } from 'react-bootstrap-icons';
import { Link, NavLink } from 'react-router';
import type { User } from '../types';
import { SignupForm } from './SignupForm';

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
  /** null = signed out. */
  user?: User | null;
  onSignOut?: () => void;
}

// TODO(lab-1.3): drop the count props — read useWishlistStore(selectWishlistCount) and useCartStore(selectCount) here
// TODO(lab-2.4): the cart button opens the drawer: onClick={useCartStore((s) => s.open)}
export function SiteHeader({ cartCount = 0, wishlistCount = 0, user = null, onSignOut }: SiteHeaderProps) {
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
            {NAV_LINKS.map((link) => (
              <Nav.Link key={link.to} as={NavLink} to={link.to} end={link.to === '/products'}>
                {link.label}
              </Nav.Link>
            ))}
            {user && (
              <Nav.Link as={NavLink} to="/account">
                Account
              </Nav.Link>
            )}
          </Nav>

          <Form className="d-none d-sm-flex me-2" role="search" onSubmit={(e) => e.preventDefault()}>
            <Form.Control type="search" size="sm" placeholder="Search products" aria-label="Search products" />
          </Form>

          <div className="d-flex align-items-center gap-3">
            <Button variant="outline-light" size="sm" className="position-relative" aria-label={`Wishlist, ${wishlistCount} items`}>
              <Heart />
              <CountBadge count={wishlistCount} label="saved" />
            </Button>
            <Button variant="outline-light" size="sm" className="position-relative" aria-label={`Cart, ${cartCount} items`}>
              <Cart3 />
              <CountBadge count={cartCount} label="in cart" />
            </Button>

            {user ? (
              <>
                <Image src={user.image} roundedCircle width={28} height={28} alt="" className="bg-secondary" />
                <span className="text-light small d-none d-lg-inline">{user.firstName}</span>
                <Button size="sm" variant="outline-light" onClick={onSignOut}>
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline-light" size="sm" onClick={() => setShowSignup(true)}>
                  <PersonPlus className="me-1" />
                  Sign up
                </Button>
                {/* react-bootstrap's `as` prop doesn't type-check against the router's Link — so a Link wearing button classes */}
                <Link to="/login" className="btn btn-light btn-sm">
                  <BoxArrowInRight className="me-1" />
                  Sign in
                </Link>
              </>
            )}
          </div>
        </Navbar.Collapse>
      </Container>

      <SignupForm show={showSignup} onClose={() => setShowSignup(false)} />
    </Navbar>
  );
}
