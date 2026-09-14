import { Container, Nav, Navbar } from 'react-bootstrap';
import { Shop } from 'react-bootstrap-icons';

/** Data, not markup. Lab 1.2 renders these; the Challenge adds one without touching JSX. */
const NAV_LINKS = [
  { label: 'Products', href: '#products' },
  { label: 'Categories', href: '#categories' },
  { label: 'Deals', href: '#deals' },
];

// TODO(lab-1.1): accept a `cartCount` prop (typed, optional, default 0)
export function SiteHeader() {
  return (
    <Navbar bg="dark" data-bs-theme="dark" expand="md" sticky="top">
      <Container>
        <Navbar.Brand href="#">
          <Shop className="me-2" />
          ShopScope
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-nav" />
        <Navbar.Collapse id="main-nav">
          <Nav className="me-auto">
            {/* TODO(lab-1.2): replace this single hand-written link with NAV_LINKS.map(...) */}
            <Nav.Link href={NAV_LINKS[0].href}>{NAV_LINKS[0].label}</Nav.Link>
          </Nav>

          {/* TODO(lab-1.3): add the search box and the cart button with a count badge */}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
