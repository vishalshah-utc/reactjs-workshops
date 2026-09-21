/**
 * The router layer — loaders, actions and middleware — without a browser.
 */

// TODO(lab-5.1): use createRoutesStub for three things. productDetailLoader: the happy
// path, a 404 turned into a not-found page, and a 503 reaching the generic branch.
// productsAction: field errors RETURNED (the form stays put), a redirect that keeps
// ?page=2 and adds ?flash=, and a 403 for a non-admin. authMiddleware: /account
// redirecting to /login?redirectTo=%2Faccount, a signed-in visitor passing, the profile
// fetched once, and a dead session landing on /login?expired=1.
describe('productDetailLoader', () => {
  it.todo('loads the product named by the URL param');
  it.todo('turns a 404 into a not-found page, not a crash');
});

describe('productsAction', () => {
  it.todo('RETURNS field errors for an invalid draft — the form stays open');
  it.todo('redirects with a flash on success, keeping the filters it was called with');
  it.todo('refuses a non-admin with a 403 the boundary can render');
});

describe('authMiddleware', () => {
  it.todo('redirects a signed-out visitor to /login, remembering where they were going');
  it.todo('lets a signed-in visitor through');
  it.todo('sends a dead session back to /login?expired=1');
});
