import { Badge, Button, Container, Form, Nav, Navbar } from 'react-bootstrap';
import { Cart3, Shop } from 'react-bootstrap-icons';

/** Data, not markup. The nav is rendered FROM this, so adding a link is a data change. */
const NAV_LINKS = [
  { label: 'Products', href: '#products' },
  { label: 'Categories', href: '#categories' },
  { label: 'Deals', href: '#deals' },
];

interface SiteHeaderProps {
  cartCount?: number;
}

export function SiteHeader({ cartCount = 0 }: SiteHeaderProps) {
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
            {NAV_LINKS.map((link) => (
              <Nav.Link key={link.label} href={link.href}>
                {link.label}
              </Nav.Link>
            ))}
          </Nav>

          <Form className="d-none d-sm-flex me-2" role="search" onSubmit={(e) => e.preventDefault()}>
            <Form.Control type="search" size="sm" placeholder="Search products" aria-label="Search products" />
          </Form>

          <Button
            variant="outline-light"
            size="sm"
            className="position-relative"
            aria-label={`Cart, ${cartCount} items`}
          >
            <Cart3 />
            {cartCount > 0 && (
              <Badge pill bg="primary" className="position-absolute top-0 start-100 translate-middle">
                {cartCount}
              </Badge>
            )}
          </Button>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
