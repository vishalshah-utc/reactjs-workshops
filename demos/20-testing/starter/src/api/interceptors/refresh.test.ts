// TODO(lab-4.4): test the interceptor chain end to end through the real axios instance —
// installInterceptors() once, a handler that 401s until the NEW token arrives, then six
// concurrent requests proving ONE refresh and twelve server hits. Add the failed-refresh
// sign-out, the `_retry` ceiling, the /auth/* exemption, and two ApiError normaliser tests.
describe('the 401 refresh queue', () => {
  it.todo('refreshes ONCE for six concurrent 401s and replays all six');
  it.todo('stores the rotated pair, so the NEXT request needs no refresh at all');
  it.todo('signs the user out and rejects with the ORIGINAL 401 when the refresh itself fails');
  it.todo('retries a request at most once — a second 401 is final');
  it.todo('never refreshes for the auth endpoints themselves');
});

describe('the ApiError normaliser', () => {
  it.todo('turns a 404 body into a typed, readable error');
  it.todo('describes a dead connection in words a user can act on');
});
