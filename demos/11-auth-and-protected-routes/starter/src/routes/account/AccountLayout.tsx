import { Card, Col, Nav, Row } from 'react-bootstrap';
import { NavLink, Outlet } from 'react-router';

/** A sidebar layout for /account. Lab 4.2 reads the user from middleware context; Lab 5.1 hides the admin link. */
// TODO(lab-4.2): export accountLoader({ context }: LoaderFunctionArgs) → { user }; show the name and role in the header
// TODO(lab-5.1): render the Team link only for admins
export function AccountLayout() {
  return (
    <Row className="g-4">
      <Col md={3}>
        <Card>
          <Card.Header className="fw-semibold">Account</Card.Header>
          <Nav className="flex-column p-2">
            <Nav.Link as={NavLink} to="/account" end>
              Profile
            </Nav.Link>
            <Nav.Link as={NavLink} to="/account/carts">
              Carts
            </Nav.Link>
            <Nav.Link as={NavLink} to="/account/team">
              Team
            </Nav.Link>
          </Nav>
        </Card>
      </Col>
      <Col md={9}>
        <Outlet />
      </Col>
    </Row>
  );
}
