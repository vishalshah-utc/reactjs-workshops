import { Alert, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import { BoxArrowInRight } from 'react-bootstrap-icons';
import {
  Form as RouterForm,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
  useSearchParams,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from 'react-router';
import { login } from '../api/services/auth';
import { tokenStore } from '../lib/tokenStore';
import { ApiError } from '../lib/ApiError';
import { PageMeta } from '../components/PageMeta';

/**
 * Only same-origin PATHS. `?redirectTo=https://evil.example` would turn the
 * login page into an open redirect — a real phishing vector.
 */
function safeRedirect(target: unknown, fallback = '/account'): string {
  if (typeof target !== 'string' || !target) return fallback;
  if (!target.startsWith('/') || target.startsWith('//')) return fallback;
  return target;
}

export async function loginLoader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);

  // Already signed in? Don't show the form.
  if (tokenStore.isAuthenticated()) {
    throw redirect(safeRedirect(url.searchParams.get('redirectTo')));
  }

  return { expired: url.searchParams.get('expired') === '1' };
}

interface LoginActionData {
  error: string;
  username: string;
}

export async function loginAction({ request }: ActionFunctionArgs): Promise<LoginActionData | Response> {
  const formData = await request.formData();
  const username = String(formData.get('username') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const redirectTo = safeRedirect(formData.get('redirectTo'));

  if (!username || !password) {
    return { error: 'Enter both a username and a password.', username };
  }

  try {
    await login({ username, password });
  } catch (error) {
    // Wrong credentials are EXPECTED — return, don't throw.
    return { error: ApiError.from(error).message, username };
  }

  return redirect(redirectTo); // back to where they were going
}

export function LoginPage() {
  const { expired } = useLoaderData<typeof loginLoader>();
  const actionData = useActionData<LoginActionData>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();

  const submitting = navigation.state === 'submitting';
  const redirectTo = searchParams.get('redirectTo') ?? '';

  return (
    <Row className="justify-content-center">
      {/* noIndex: a sign-in screen has no business in a search result. */}
      <PageMeta title="Sign in" description="Sign in to ShopScope." noIndex />
      <Col md={6} lg={5}>
        <Card>
          <Card.Body>
            <h1 className="h4 mb-3">Sign in</h1>

            {expired && (
              <Alert variant="warning" className="py-2">
                Your session expired. Please sign in again.
              </Alert>
            )}
            {redirectTo && !expired && (
              <Alert variant="info" className="py-2">
                Sign in to continue to <code>{redirectTo}</code>.
              </Alert>
            )}

            <RouterForm method="post" replace>
              {/* Carry the destination through the POST */}
              <input type="hidden" name="redirectTo" value={redirectTo} />

              <Form.Group className="mb-3" controlId="username">
                <Form.Label className="small fw-semibold">Username</Form.Label>
                <Form.Control
                  name="username"
                  autoComplete="username"
                  defaultValue={actionData?.username ?? 'emilys'}
                  isInvalid={!!actionData?.error}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="password">
                <Form.Label className="small fw-semibold">Password</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  defaultValue="emilyspass"
                  isInvalid={!!actionData?.error}
                  required
                />
                <Form.Control.Feedback type="invalid">{actionData?.error}</Form.Control.Feedback>
              </Form.Group>

              <Button type="submit" className="w-100" disabled={submitting}>
                {submitting ? (
                  <Spinner as="span" size="sm" animation="border" className="me-2" />
                ) : (
                  <BoxArrowInRight className="me-2" />
                )}
                {submitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </RouterForm>

            <hr />
            <p className="small text-muted mb-0">
              Try <code>emilys</code> / <code>emilyspass</code> (admin) or <code>averyp</code> / <code>averyppass</code>{' '}
              (a regular user).
            </p>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}
