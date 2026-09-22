import { HttpResponse, http } from 'msw';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { Form, Outlet, createRoutesStub, useActionData, useLocation } from 'react-router';
import { server } from '../test/msw/server';
import { renderWithProviders } from '../test/utils';
import { ADMIN_USER } from '../test/fixtures';
import { installInterceptors } from '../api/interceptors';
import { queryClient } from '../lib/queryClient';
import { tokenStore } from '../lib/tokenStore';
import { AppBootSplash } from './AppBootSplash';
import { RootErrorBoundary } from './RootErrorBoundary';
import { ProductDetailPage, productDetailLoader } from './ProductDetailPage';
import { ProductErrorBoundary } from './ProductErrorBoundary';
import { productsAction } from './ProductsPage';
import { authMiddleware } from './middleware';

const API = 'https://dummyjson.com';

/** Renders the current URL, so a test can assert where a redirect landed. */
function LocationDisplay() {
  const { pathname, search } = useLocation();
  return <output data-testid="location">{pathname + search}</output>;
}

beforeAll(() => {
  installInterceptors();
  queryClient.setDefaultOptions({ queries: { retry: false } });
});

// Loaders and actions import the module-scope client directly, so THEY are the
// tests that have to clear it. A component test never touches this.
beforeEach(() => queryClient.clear());

describe('productDetailLoader', () => {
  const Stub = createRoutesStub([
    {
      id: 'root',
      path: '/',
      Component: () => <Outlet />,
      HydrateFallback: AppBootSplash,
      ErrorBoundary: RootErrorBoundary,
      children: [{ path: 'products/:productId', Component: ProductDetailPage, loader: productDetailLoader, ErrorBoundary: ProductErrorBoundary }],
    },
  ]);

  const render = (url: string) => renderWithProviders(<Stub initialEntries={[url]} />, { withRouter: false, client: queryClient });

  it('loads the product named by the URL param', async () => {
    render('/products/3');

    // The loader read `params.productId`, filled the cache, and the component
    // rendered from it with no loading state of its own.
    expect(await screen.findByRole('heading', { name: 'Essence Mascara 3' })).toBeInTheDocument();
  });

  it('turns a 404 into a not-found page, not a crash', async () => {
    render('/products/9999');

    // The loader caught the ApiError and threw a Response instead, which is
    // what lets the boundary say "not found" rather than "something broke".
    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText('No product with id 9999.')).toBeInTheDocument();
  });

  // TODO(lab-2.6): two tests for the streamed half. Override `/products/:id` with a handler
  // that `await delay(…)`s only when `select=reviews`, then assert (a) the product heading is
  // on screen WHILE "Loading reviews" still is, and the fallback is later replaced in place,
  // and (b) a 503 on the reviews request lands in the widget boundary with the page intact.
  it.todo('renders the product while the reviews are still loading, then streams them in');
  it.todo('sends a rejected reviews promise to the widget boundary, not the page');

  it('lets a real failure through to the generic branch', async () => {
    server.use(http.get(`${API}/products/:id`, () => HttpResponse.json({ message: 'Database unavailable' }, { status: 503 })));

    render('/products/3');

    expect(within(await screen.findByRole('alert')).getByText('Database unavailable')).toBeInTheDocument();
  });
});

describe('productsAction', () => {
  /**
   * The SMALLEST form that can express the action's contract: FormData in,
   * either field errors or a redirect out. The real `ProductForm` is a modal
   * with validation of its own — testing the action through it would test
   * both, and tell you nothing about which one failed.
   */
  function MiniProductForm() {
    const actionData = useActionData<typeof productsAction>();
    const errors = actionData && 'errors' in actionData ? actionData.errors : undefined;
    return (
      <Form method="post">
        <input type="hidden" name="intent" value="create" />
        <label>
          Title <input name="title" defaultValue="" />
        </label>
        <label>
          Price <input name="price" defaultValue="" />
        </label>
        <label>
          Category <input name="category" defaultValue="" />
        </label>
        <label>
          Stock <input name="stock" defaultValue="1" />
        </label>
        <button type="submit">Save</button>
        {errors?.title && <p role="alert">{errors.title}</p>}
        {errors?.price && <p role="alert">{errors.price}</p>}
      </Form>
    );
  }

  const Stub = createRoutesStub([
    {
      id: 'root',
      path: '/',
      Component: () => (
        <>
          <LocationDisplay />
          <Outlet />
        </>
      ),
      HydrateFallback: AppBootSplash,
      ErrorBoundary: RootErrorBoundary,
      children: [{ path: 'products', Component: MiniProductForm, action: productsAction }],
    },
  ]);

  const render = () => renderWithProviders(<Stub initialEntries={['/products?page=2']} />, { withRouter: false, client: queryClient });

  beforeEach(() => tokenStore.set({ user: ADMIN_USER }));

  it('RETURNS field errors for an invalid draft — the form stays open', async () => {
    const { user } = render();

    await user.click(await screen.findByRole('button', { name: 'Save' }));

    const alerts = await screen.findAllByRole('alert');
    expect(alerts.map((node) => node.textContent)).toEqual(['Give it a name of at least 2 characters.', 'Price must be more than zero.']);
    // Returned, not thrown, and not redirected: the user is still on the form.
    expect(screen.getByTestId('location')).toHaveTextContent('/products?page=2');
  });

  it('redirects with a flash on success, keeping the filters it was called with', async () => {
    const { user } = render();

    await user.type(screen.getByLabelText('Title'), 'Test Product');
    await user.type(screen.getByLabelText('Price'), '12.5');
    await user.type(screen.getByLabelText('Category'), 'beauty');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    // `page=2` survives; `flash` is added. That is the whole redirect contract.
    const location = await screen.findByTestId('location');
    expect(location).toHaveTextContent('/products?page=2&flash=');
    // Decoded, because a search param is percent-encoded and `+` is a space.
    // Asserting on the raw string would be asserting on URLSearchParams.
    const flash = new URLSearchParams(location.textContent?.split('?')[1]).get('flash');
    expect(flash).toContain('Test Product');
    expect(flash).toContain('created');
  });

  it('refuses a non-admin with a 403 the boundary can render', async () => {
    tokenStore.set({ user: { ...ADMIN_USER, role: 'user' } });
    const { user } = render();

    await user.click(await screen.findByRole('button', { name: 'Save' }));

    // Hidden buttons are UX. This is the check that is actually a check —
    // and the real one is on the server, because a user can edit this bundle.
    expect(within(await screen.findByRole('alert')).getByText('Only admins can change the catalogue.')).toBeInTheDocument();
  });
});

describe('authMiddleware', () => {
  const Stub = createRoutesStub([
    {
      path: '/',
      Component: () => (
        <>
          <LocationDisplay />
          <Outlet />
        </>
      ),
      children: [
        { path: 'login', Component: () => <h1>Sign in</h1> },
        {
          path: 'account',
          middleware: [authMiddleware],
          Component: () => <h1>Your account</h1>,
          loader: () => ({}),
        },
      ],
    },
  ]);

  const render = () => renderWithProviders(<Stub initialEntries={['/account']} />, { withRouter: false, client: queryClient });

  it('redirects a signed-out visitor to /login, remembering where they were going', async () => {
    render();

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    // The whole point of the redirect: come back here after signing in.
    expect(screen.getByTestId('location')).toHaveTextContent('/login?redirectTo=%2Faccount');
  });

  it('lets a signed-in visitor through', async () => {
    tokenStore.set({ accessToken: 'access-1', user: ADMIN_USER });

    render();

    expect(await screen.findByRole('heading', { name: 'Your account' })).toBeInTheDocument();
  });

  it('fetches the profile once when only a token is stored', async () => {
    tokenStore.set({ accessToken: 'access-1' });

    render();

    // The middleware ran GET /auth/me and cached the answer in the token store,
    // so no loader beneath it has to think about who the user is.
    expect(await screen.findByRole('heading', { name: 'Your account' })).toBeInTheDocument();
    expect(tokenStore.getUser()?.username).toBe('emilys');
  });

  it('sends a dead session back to /login?expired=1', async () => {
    tokenStore.set({ accessToken: 'access-1' });
    server.use(http.get(`${API}/auth/me`, () => HttpResponse.json({ message: 'Token Expired!' }, { status: 401 })));
    server.use(http.post(`${API}/auth/refresh`, () => HttpResponse.json({ message: 'no' }, { status: 403 })));

    render();

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/login?expired=1');
    expect(tokenStore.isAuthenticated()).toBe(false);
  });
});
