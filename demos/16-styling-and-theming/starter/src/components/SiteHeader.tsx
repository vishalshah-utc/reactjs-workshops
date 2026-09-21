import { useState } from 'react';
import { Badge, Button, Container, Form, Image, Nav, Navbar } from 'react-bootstrap';
import { BoxArrowInRight, Cart3, Heart, MoonStars, PersonPlus, Shop, Sun } from 'react-bootstrap-icons';
import { Form as RouterForm, Link, NavLink } from 'react-router'; // Bootstrap's <Form> is already imported above — alias the router's
import type { User } from '../types';
import { useTheme } from '../context/ThemeContext';
import { selectCount, useCartStore } from '../store/cart';
import { selectWishlistCount, useWishlistStore } from '../store/wishlist';
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
  /** null = signed out. */
  user?: User | null;
  onSignOut?: () => void;
}

export function SiteHeader({ user = null, onSignOut }: SiteHeaderProps) {
  const [showSignup, setShowSignup] = useState(false);
  // TODO(lab-3.3): { preference, setPreference } — the toggle button below becomes a three-way ButtonGroup rendered from
  // a THEME_OPTIONS list (light / dark / system, an icon each), aria-pressed on the chosen one.
  const { theme, toggleTheme } = useTheme();

  // No props for these any more: the header subscribes to the two stores itself.
  // Each selector returns a NUMBER, so the header re-renders only when a count actually changes.
  const wishlistCount = useWishlistStore(selectWishlistCount);
  const cartCount = useCartStore(selectCount);
  const openCart = useCartStore((s) => s.open);

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

          {/* A GET form is a NAVIGATION: submit → /products?q=… and the toolbar adopts the URL. Until today this box
              swallowed the Enter key and did nothing — a Tab stop that lied. */}
          <RouterForm method="get" action="/products" role="search" className="d-none d-sm-flex me-2">
            <Form.Control type="search" name="q" size="sm" placeholder="Search products" aria-label="Search products" />
          </RouterForm>

          <div className="d-flex align-items-center gap-3">
            <Button variant="outline-light" size="sm" className="position-relative" aria-label={`Wishlist, ${wishlistCount} items`}>
              <Heart />
              <CountBadge count={wishlistCount} label="saved" />
            </Button>
            <Button variant="outline-light" size="sm" className="position-relative" aria-label={`Cart, ${cartCount} items`} onClick={openCart}>
              <Cart3 />
              <CountBadge count={cartCount} label="in cart" />
            </Button>
            <Button
              variant="outline-light"
              size="sm"
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              aria-pressed={theme === 'dark'}
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <Sun /> : <MoonStars />}
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
                {/* TODO(lab-2.3): className={button({ tone: 'light', size: 'sm' })} — the variant map instead of a hand-typed string */}
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
