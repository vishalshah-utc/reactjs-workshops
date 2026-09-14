import { Card, Col, Row } from 'react-bootstrap';

/** A placeholder. Lab 3.1: a router <Form> posting to loginAction, redirectTo, and a loader that bounces signed-in users. */
// TODO(lab-3.1): loginLoader, loginAction (safeRedirect!), and the form with useActionData<typeof loginAction> / useNavigation
export function LoginPage() {
  return (
    <Row className="justify-content-center">
      <Col md={6} lg={5}>
        <Card>
          <Card.Body>
            <h1 className="h4">Sign in</h1>
            <p className="text-muted mb-0">No form yet — see Lab 3.</p>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}
