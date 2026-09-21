import { useReducer } from 'react';
import { Alert, Badge, Button, Card, Col, Image, Row, Spinner } from 'react-bootstrap';
import { useLoaderData, type LoaderFunctionArgs } from 'react-router';
import { getMe } from '../../api/services/auth';
import { ApiError } from '../../lib/ApiError';
import { ErrorNotice } from '../../components/ErrorNotice';
import { Uploader } from '../../components/Uploader';
import { env } from '../../config/env';
import { requestStatusReducer } from '../../reducers/requestStatus';
import { userContext } from '../middleware';

/** authMiddleware already fetched and validated the user. No second request. */
export async function profileLoader({ context }: LoaderFunctionArgs) {
  const user = context.get(userContext);
  if (!user) throw new Error('profileLoader ran without authMiddleware'); // a wiring bug, not a user error
  return { user };
}

export function ProfilePage() {
  const { user } = useLoaderData<typeof profileLoader>();

  // A button that hits a protected endpoint on demand — the way to WATCH the
  // refresh interceptor work once the 1-minute access token has expired.
  //
  // One value with four possible shapes, instead of { busy, result, error } with
  // eight combinations. `requestStatusReducer<string>` is an instantiation
  // expression: the generic reducer, pinned to T = string, passed as a value.
  const [check, dispatch] = useReducer(requestStatusReducer<string>, { status: 'idle' });

  async function whoAmI() {
    dispatch({ type: 'start' });
    try {
      const me = await getMe();
      dispatch({ type: 'succeed', data: `/auth/me → ${me.email} (${me.role})` });
    } catch (error) {
      dispatch({ type: 'fail', error: ApiError.from(error) });
    }
  }

  return (
    <>
      <Card>
        <Card.Body>
          <Row className="align-items-center g-3">
            <Col xs="auto">
              <Image src={user.image} roundedCircle width={72} height={72} alt="" className="bg-body-secondary" />
            </Col>
            <Col>
              <h1 className="h5 mb-1">
                {user.firstName} {user.lastName}
              </h1>
              <div className="text-muted">{user.email}</div>
              <Badge bg="secondary" className="text-capitalize mt-2">
                {user.role}
              </Badge>
            </Col>
            <Col xs="auto">
              <Button variant="outline-secondary" size="sm" onClick={whoAmI} disabled={check.status === 'pending'}>
                {check.status === 'pending' && <Spinner as="span" size="sm" animation="border" className="me-2" />}
                Who am I?
              </Button>
            </Col>
          </Row>

          {/* Narrowing: inside this branch TypeScript knows `check.data` exists — and nowhere else. */}
          {check.status === 'success' && (
            <Alert variant="info" className="mt-3 mb-0 font-monospace small">
              {check.data}
            </Alert>
          )}
          {check.status === 'error' && (
            <div className="mt-3">
              <ErrorNotice error={check.error} onRetry={whoAmI} />
            </div>
          )}
        </Card.Body>
      </Card>

      {/* A feature flag from config: on in development and staging, off in production. */}
      {env.features.uploads && <Uploader />}
    </>
  );
}
