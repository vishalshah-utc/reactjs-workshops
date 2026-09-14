import { useState } from 'react';
import { Alert, Badge, Button, Card, Col, Image, Row, Spinner } from 'react-bootstrap';
import { useLoaderData, type LoaderFunctionArgs } from 'react-router';
import { getMe } from '../../api/services/auth';
import { ApiError } from '../../lib/ApiError';
import { ErrorNotice } from '../../components/ErrorNotice';
import { Uploader } from '../../components/Uploader';
import { env } from '../../config/env';
import { userContext } from '../middleware';

/** authMiddleware already fetched and validated the user. No second request. */
export async function profileLoader({ context }: LoaderFunctionArgs) {
  const user = context.get(userContext);
  if (!user) throw new Error('profileLoader ran without authMiddleware'); // a wiring bug, not a user error
  return { user };
}

interface Check {
  busy: boolean;
  result: string | null;
  error: ApiError | null;
}

export function ProfilePage() {
  const { user } = useLoaderData<typeof profileLoader>();

  // A button that hits a protected endpoint on demand — the way to WATCH the
  // refresh interceptor work once the 1-minute access token has expired.
  const [check, setCheck] = useState<Check>({ busy: false, result: null, error: null });

  async function whoAmI() {
    setCheck({ busy: true, result: null, error: null });
    try {
      const me = await getMe();
      setCheck({ busy: false, result: `/auth/me → ${me.email} (${me.role})`, error: null });
    } catch (error) {
      setCheck({ busy: false, result: null, error: ApiError.from(error) });
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
            <Button variant="outline-secondary" size="sm" onClick={whoAmI} disabled={check.busy}>
              {check.busy && <Spinner as="span" size="sm" animation="border" className="me-2" />}
              Who am I?
            </Button>
          </Col>
        </Row>

        {check.result && (
          <Alert variant="info" className="mt-3 mb-0 font-monospace small">
            {check.result}
          </Alert>
        )}
          <div className="mt-3">
            <ErrorNotice error={check.error} />
          </div>
        </Card.Body>
      </Card>

      {/* A feature flag from config: on in development and staging, off in production. */}
      {env.features.uploads && <Uploader />}
    </>
  );
}
