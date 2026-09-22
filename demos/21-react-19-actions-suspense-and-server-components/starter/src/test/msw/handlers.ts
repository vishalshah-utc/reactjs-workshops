import { HttpResponse, http } from 'msw';
import { ADMIN_USER, CATALOGUE, CATEGORIES, makeProduct } from '../fixtures';
import type { Product } from '../../types';

/** The same base URL `src/config/env.ts` reads from `test.env` in vitest.config.ts. */
const API = 'https://dummyjson.com';

/**
 * `select=id,stock` really does change the payload, so the handler has to as
 * well — `listStock()` reads `products[].stock` and would get `undefined` from
 * a handler that ignored the parameter. A mock that is more generous than the
 * real API hides bugs rather than catching them.
 */
function project(product: Product, select: string | null): Partial<Product> {
  if (!select) return product;
  const fields = select.split(',') as (keyof Product)[];
  return Object.fromEntries(fields.map((field) => [field, product[field]]));
}

/** limit/skip/sortBy/order, exactly as DummyJSON applies them — including `limit=0` meaning "all". */
function page(products: Product[], url: URL) {
  const limitParam = Number(url.searchParams.get('limit') ?? '12');
  const skip = Number(url.searchParams.get('skip') ?? '0');
  const sortBy = url.searchParams.get('sortBy');
  const order = url.searchParams.get('order') === 'desc' ? -1 : 1;

  const sorted = sortBy
    ? [...products].sort((a, b) => {
        const left = a[sortBy as keyof Product];
        const right = b[sortBy as keyof Product];
        return left === right ? 0 : (left! < right! ? -1 : 1) * order;
      })
    : products;

  const limit = limitParam === 0 ? sorted.length : limitParam;
  const window = sorted.slice(skip, skip + limit);

  return HttpResponse.json({
    products: window.map((product) => project(product, url.searchParams.get('select'))),
    total: sorted.length,
    skip,
    limit: window.length,
  });
}

/**
 * The DEFAULT world: every endpoint the app can reach, answering the way
 * DummyJSON answers. A test that needs a different world calls
 * `server.use(…)` with one override and gets the rest of this for free —
 * which is why these are handlers and not `vi.mock('axios')`.
 */
export const handlers = [
  // --- Catalogue reads. ORDER MATTERS: the specific paths must be registered
  // before /products/:id, or `/products/categories` matches it with id="categories".
  http.get(`${API}/products/search`, ({ request }) => {
    const url = new URL(request.url);
    const q = (url.searchParams.get('q') ?? '').toLowerCase();
    return page(
      CATALOGUE.filter((product) => product.title.toLowerCase().includes(q)),
      url,
    );
  }),

  http.get(`${API}/products/categories`, () => HttpResponse.json(CATEGORIES)),

  http.get(`${API}/products/category/:slug`, ({ params, request }) =>
    page(
      CATALOGUE.filter((product) => product.category === params.slug),
      new URL(request.url),
    ),
  ),

  // TODO(lab-2.5): the reviews request goes through THIS path with `?select=reviews`, so the
  // handler has to honour `select` here too — and serve `reviewsFor(product.id)` from the
  // fixtures. A mock more generous than the real API hides bugs instead of catching them.
  http.get(`${API}/products/:id`, ({ params }) => {
    const product = CATALOGUE.find((item) => String(item.id) === params.id);
    if (!product) return HttpResponse.json({ message: `Product with id '${params.id}' not found` }, { status: 404 });
    return HttpResponse.json({ ...product, reviews: [] });
  }),

  http.get(`${API}/products`, ({ request }) => page(CATALOGUE, new URL(request.url))),

  // --- Catalogue writes. DummyJSON simulates these; so do we, with the same shape.
  http.post(`${API}/products/add`, async ({ request }) => {
    const body = (await request.json()) as Partial<Product>;
    return HttpResponse.json(makeProduct({ ...body, id: 195 }), { status: 201 });
  }),

  http.patch(`${API}/products/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Partial<Product>;
    return HttpResponse.json(makeProduct({ id: Number(params.id), ...body }));
  }),

  http.delete(`${API}/products/:id`, ({ params }) =>
    HttpResponse.json({ ...makeProduct({ id: Number(params.id) }), isDeleted: true, deletedOn: new Date().toISOString() }),
  ),

  // --- Auth.
  http.post(`${API}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { username?: string; password?: string };
    if (body.username !== 'emilys' || body.password !== 'emilyspass') {
      return HttpResponse.json({ message: 'Invalid credentials' }, { status: 400 });
    }
    return HttpResponse.json({ ...ADMIN_USER, accessToken: 'access-1', refreshToken: 'refresh-1' });
  }),

  http.post(`${API}/auth/refresh`, () => HttpResponse.json({ accessToken: 'access-2', refreshToken: 'refresh-2' })),

  http.get(`${API}/auth/me`, ({ request }) => {
    if (!request.headers.get('Authorization')) return HttpResponse.json({ message: 'Token missing' }, { status: 401 });
    return HttpResponse.json(ADMIN_USER);
  }),

  // --- The two endpoints the account area uses.
  http.get(`${API}/users`, ({ request }) => {
    const url = new URL(request.url);
    return HttpResponse.json({ users: [ADMIN_USER], total: 1, skip: 0, limit: Number(url.searchParams.get('limit') ?? '1') });
  }),

  http.post(`${API}/carts/add`, async ({ request }) => {
    const body = (await request.json()) as { userId: number; products: { id: number; quantity: number }[] };
    return HttpResponse.json({
      id: 51,
      userId: body.userId,
      totalProducts: body.products.length,
      totalQuantity: body.products.reduce((n, line) => n + line.quantity, 0),
      total: 100,
      discountedTotal: 90,
    });
  }),
];
