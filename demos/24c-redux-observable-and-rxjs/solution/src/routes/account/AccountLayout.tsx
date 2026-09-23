import { Card, Col, Nav, Row } from 'react-bootstrap';
import { NavLink, Outlet, useLoaderData, type LoaderFunctionArgs } from 'react-router';
import { userContext } from '../middleware';

export async function accountLoader({ context }: LoaderFunctionArgs) {
  const user = context.get(userContext);
  if (!user) throw new Error('accountLoader ran without authMiddleware'); // a wiring bug, not a user error
  return { user };
}

export function AccountLayout() {
  const { user } = useLoaderData<typeof accountLoader>();
  const isAdmin = user.role === 'admin';

  return (
    <Row className="g-4">
      <Col md={3}>
        <Card>
          <Card.Header className="fw-semibold text-capitalize">
            {user.firstName} · {user.role}
          </Card.Header>
          <Nav className="flex-column p-2">
            <Nav.Link as={NavLink} to="/account" end>
              Profile
            </Nav.Link>
            <Nav.Link as={NavLink} to="/account/carts">
              Carts
            </Nav.Link>
            {/* UX half of authorisation: don't show doors people can't open. The route middleware is the lock. */}
            {isAdmin && (
              <>
                <Nav.Link as={NavLink} to="/account/inventory" end>
                  Inventory
                </Nav.Link>
                <Nav.Link as={NavLink} to="/account/team">
                  Team
                </Nav.Link>
              </>
            )}
          </Nav>
        </Card>
      </Col>
      <Col md={9}>
        <Outlet />
      </Col>
    </Row>
  );
}
