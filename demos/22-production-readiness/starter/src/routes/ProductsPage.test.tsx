import { HttpResponse, http } from 'msw';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { screen, waitForElementToBeRemoved, within } from '@testing-library/react';
import { Outlet, createRoutesStub } from 'react-router';
import { server } from '../test/msw/server';
import { renderWithProviders } from '../test/utils';
import { installInterceptors } from '../api/interceptors';
import { queryClient } from '../lib/queryClient';
import { AppBootSplash } from './AppBootSplash';
import { RootErrorBoundary } from './RootErrorBoundary';
import { ProductsPage, productsLoader } from './ProductsPage';

const API = 'https://dummyjson.com';

/**
 * The four data states of one screen, driven entirely from the network.
 *
 * Nothing below imports a service, a hook or a mock of either. The test
 * changes what the SERVER says and asserts on what the user sees — which is
 * the only contract that survives a refactor of everything in between.
 */
const Stub = createRoutesStub([
  {
    id: 'root',
    path: '/',
    // A stand-in for RootLayout: the page reads useRouteLoaderData('root'), so
    // the id and the shape matter. The header, the drawer and the announcer do
    // not, and leaving them out keeps the failure output readable.
    Component: () => <Outlet />,
    loader: () => ({ user: null }),
    HydrateFallback: AppBootSplash,
    ErrorBoundary: RootErrorBoundary,
    children: [{ path: 'products', Component: ProductsPage, loader: productsLoader }],
  },
]);

function renderProducts(url = '/products') {
  // The app's MODULE-SCOPE client, not a fresh one — `productsLoader` imports
  // it directly and a loader has no way to be handed a different one.
  return renderWithProviders(<Stub initialEntries={[url]} />, { withRouter: false, client: queryClient });
}

describe('the products page', () => {
  beforeAll(() => {
    // The same call main.tsx makes. Without it the page under test would get
    // raw AxiosErrors, and "Request failed with status code 500" is not what
    // this app shows its users.
    installInterceptors();
    // The app retries a failed query twice with backoff. Correct in a browser;
    // in a test it turns "assert the error state" into a four-second wait.
    queryClient.setDefaultOptions({ queries: { retry: false } });
  });

  beforeEach(() => {
    // Without this, test 2's loader finds test 1's page in the cache, returns
    // it synchronously and never touches the handler test 2 just installed.
    queryClient.clear();
  });

  it('shows the loading state, then the results', async () => {
    renderProducts();

    // getBy, not findBy: this must be on screen on the FIRST render, before
    // anything is awaited. findBy would pass even if it appeared a tick late.
    expect(screen.getByText('Loading ShopScope…')).toBeInTheDocument();

    // waitForElementToBeRemoved asserts two things at once: it was there, and
    // it went away. `expect(queryBy…).toBeNull()` after an await asserts neither.
    await waitForElementToBeRemoved(() => screen.queryByText('Loading ShopScope…'));

    expect(await screen.findByRole('heading', { name: 'All products' })).toBeInTheDocument();
    expect(screen.getByText('24 products')).toBeInTheDocument();
    // One page of twelve, from `VITE_PAGE_SIZE` in vitest.config.ts.
    expect(screen.getAllByRole('button', { name: /^(Add to cart|Sold out)$/ })).toHaveLength(12);
  });

  it('asks the server for the page the URL names', async () => {
    renderProducts('/products?page=2');

    expect(await screen.findByRole('link', { name: 'Essence Mascara 13' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Essence Mascara 1' })).toBeNull();
  });

  it('sends the search term and renders what comes back', async () => {
    renderProducts('/products?q=Calvin');

    const grid = await screen.findByRole('link', { name: 'Calvin Klein Shirt 2' });
    expect(grid).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Essence Mascara/ })).toBeNull();
  });

  it('renders the EMPTY state when the search matches nothing', async () => {
    // A real, empty, successful response — not an error, and not a spinner
    // that never resolves. This is the state most apps forget to design.
    renderProducts('/products?q=nothing-matches-this');

    expect(await screen.findByText('No products found')).toBeInTheDocument();
    expect(screen.getByText('Try a different search or category.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add to cart' })).toBeNull();
  });

  it('renders the ERROR state when the catalogue is down', async () => {
    server.use(http.get(`${API}/products`, () => HttpResponse.json({ message: 'Server is on fire' }, { status: 500 })));

    renderProducts();

    // The loader threw an ApiError; the route ErrorBoundary rendered. The
    // backend's own message reached the user, through the normaliser.
    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText('Something went wrong')).toBeInTheDocument();
    expect(within(alert).getByText('Server is on fire')).toBeInTheDocument();
  });

  it('survives a categories outage — the page is the product list, not the strip', async () => {
    server.use(http.get(`${API}/products/categories`, () => HttpResponse.json({ message: 'nope' }, { status: 500 })));

    renderProducts();

    // Promise.allSettled, not Promise.all: an optional request must not be able
    // to sink a page. This test is the only thing keeping that `allSettled`.
    expect(await screen.findByRole('heading', { name: 'All products' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('filters the loaded page in the browser, with no request at all', async () => {
    const { user } = renderProducts();
    await screen.findByRole('heading', { name: 'All products' });

    // Fail loudly if this types a request: the handler below 500s, and the
    // quick filter must never reach it.
    server.use(http.get(`${API}/products`, () => HttpResponse.json({ message: 'should not be called' }, { status: 500 })));

    await user.type(screen.getByRole('searchbox', { name: 'Filter the products on this page' }), 'Calvin');

    expect(await screen.findByRole('link', { name: 'Calvin Klein Shirt 2' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Essence Mascara 1' })).toBeNull();
  });
});
