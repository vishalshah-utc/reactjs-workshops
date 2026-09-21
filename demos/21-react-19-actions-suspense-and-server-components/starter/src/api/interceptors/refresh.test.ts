import { HttpResponse, http } from 'msw';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { server } from '../../test/msw/server';
import { ApiError } from '../../lib/ApiError';
import { tokenStore } from '../../lib/tokenStore';
import { getProduct } from '../services/products';
import { getMe } from '../services/auth';
import { installInterceptors } from './index';

const API = 'https://dummyjson.com';

/**
 * The interceptor chain, tested END TO END through the real axios instance.
 *
 * Nothing here is mocked except the network: `installInterceptors()` is the
 * same call `main.tsx` makes, `getProduct` is the same service the app uses,
 * and the assertions are about what the SERVER saw. A test that mocked
 * `refreshTokens` would prove only that the mock was called.
 */
describe('the 401 refresh queue', () => {
  // Interceptors attach to the module-scope `api` instance. Install ONCE per
  // file: twice and every request is logged twice and retried twice.
  beforeAll(() => installInterceptors());

  let refreshCalls = 0;
  let productCalls = 0;

  beforeEach(() => {
    refreshCalls = 0;
    productCalls = 0;
    tokenStore.set({ accessToken: 'expired', refreshToken: 'refresh-1' });

    server.use(
      // The token has expired: every protected GET 401s until the caller
      // presents the NEW token.
      http.get(`${API}/products/:id`, ({ request }) => {
        productCalls += 1;
        if (request.headers.get('Authorization') !== 'Bearer access-2') {
          return HttpResponse.json({ message: 'Token Expired!' }, { status: 401 });
        }
        return HttpResponse.json({ id: Number(new URL(request.url).pathname.split('/').pop()), title: 'Mascara' });
      }),
      http.post(`${API}/auth/refresh`, () => {
        refreshCalls += 1;
        return HttpResponse.json({ accessToken: 'access-2', refreshToken: 'refresh-2' });
      }),
    );
  });

  it('refreshes ONCE for six concurrent 401s and replays all six', async () => {
    const results = await Promise.all([1, 2, 3, 4, 5, 6].map((id) => getProduct(id)));

    // The whole point of the shared promise. Six refreshes would mean five
    // requests using an already-rotated refresh token — and a surprise logout.
    expect(refreshCalls).toBe(1);
    // Six 401s plus six replays. Nothing was dropped, nothing ran three times.
    expect(productCalls).toBe(12);
    expect(results.map((product) => product.id)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('stores the rotated pair, so the NEXT request needs no refresh at all', async () => {
    await getProduct(1);
    expect(tokenStore.getAccess()).toBe('access-2');
    expect(tokenStore.getRefresh()).toBe('refresh-2');

    await getProduct(2);
    expect(refreshCalls).toBe(1); // still one: the second call went out already valid
  });

  it('signs the user out and rejects with the ORIGINAL 401 when the refresh itself fails', async () => {
    server.use(http.post(`${API}/auth/refresh`, () => HttpResponse.json({ message: 'Invalid refresh token' }, { status: 403 })));

    // Normalised on the way out — the caller never sees an AxiosError.
    const error = await rejection(getProduct(1));

    // 401, not 403: the honest answer to the question the caller actually asked.
    expect(error.status).toBe(401);
    expect(error.message).toBe('Token Expired!'); // the backend's message beats ours
    expect(tokenStore.isAuthenticated()).toBe(false);
  });

  it('retries a request at most once — a second 401 is final', async () => {
    // The refresh "succeeds" but hands back a token the server still rejects.
    server.use(
      http.post(`${API}/auth/refresh`, () => {
        refreshCalls += 1;
        return HttpResponse.json({ accessToken: 'still-wrong', refreshToken: 'refresh-2' });
      }),
    );

    await expect(getProduct(1)).rejects.toBeInstanceOf(ApiError);
    // Without the `_retry` flag this is an infinite loop, not a failing request.
    expect(productCalls).toBe(2);
  });

  it('never refreshes for the auth endpoints themselves', async () => {
    server.use(http.get(`${API}/auth/me`, () => HttpResponse.json({ message: 'Token Expired!' }, { status: 401 })));

    await expect(getMe()).rejects.toBeInstanceOf(ApiError);
    // A 401 from /auth/me with a fresh token means the session is genuinely
    // over. Refreshing here is how you build a loop between two interceptors.
    expect(refreshCalls).toBe(0);
  });
});

/**
 * `promise.catch((e) => e)` types the result as `T | unknown`, and every
 * assertion after it needs a cast. One helper narrows it once, and fails the
 * test with a readable message when the call unexpectedly SUCCEEDS — which is
 * the failure mode a bare `.catch` hides.
 */
async function rejection(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof ApiError) return error;
    throw error;
  }
  throw new Error('Expected the request to fail, but it resolved.');
}

describe('the ApiError normaliser', () => {
  beforeAll(() => installInterceptors());

  it('turns a 404 body into a typed, readable error', async () => {
    const error = await rejection(getProduct(9999));

    expect(error.status).toBe(404);
    expect(error.code).toBe('HTTP_404');
    expect(error.isNotFound).toBe(true);
    expect(error.isRetryable).toBe(false);
    // The request id the logging interceptor attached comes back on the error —
    // the link between a user's screenshot and one line in the server log.
    expect(error.requestId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('describes a dead connection in words a user can act on', async () => {
    server.use(http.get(`${API}/products/:id`, () => HttpResponse.error()));

    const error = await rejection(getProduct(1));

    expect(error.isNetwork).toBe(true);
    expect(error.status).toBe(0); // no response ever arrived — not "a 500"
    expect(error.message).toBe("Can't reach the server. Check your connection and try again.");
  });
});
