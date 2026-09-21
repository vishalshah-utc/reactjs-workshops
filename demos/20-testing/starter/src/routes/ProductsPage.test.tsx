/**
 * The FOUR data states of one screen — loading, results, empty, error —
 * driven entirely from the network, with nothing in `src/` mocked.
 */

// TODO(lab-4.3): build a createRoutesStub around ProductsPage + productsLoader (a root
// route with id 'root', a HydrateFallback and the RootErrorBoundary), render it with
// renderWithProviders({ withRouter: false, client: queryClient }), and assert the loading
// state, the results, ?page=2, the search, the empty state, the 500 error and the
// categories outage that must NOT sink the page. Clear the module-scope queryClient in
// beforeEach — the loader imports it directly.
describe('the products page', () => {
  it.todo('shows the loading state, then the results');
  it.todo('asks the server for the page the URL names');
  it.todo('sends the search term and renders what comes back');
  it.todo('renders the EMPTY state when the search matches nothing');
  it.todo('renders the ERROR state when the catalogue is down');
  it.todo('survives a categories outage — the page is the product list, not the strip');
});
