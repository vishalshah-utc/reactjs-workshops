/**
 * Teaching hooks — the reason this API is worth having instead of a mock.
 *
 *   ?_delay=1500   respond after 1.5s   → loading skeletons stop being theory
 *   ?_fail=500     force a 500          → error states become testable
 *   ?_fail=401     force a 401          → exercise the refresh-token flow
 *   ?_fail=422     force a field error  → exercise server-error → form mapping
 *   ?_fail=429     force a rate limit   → exercise retry/backoff
 *
 * Every lab that says "now break it" uses these instead of asking participants
 * to unplug their wifi.
 */
import { ApiError } from '../lib/errors.js';

const MAX_DELAY_MS = 10_000;

export function teachingHooks(req, res, next) {
  const delay = Number.parseInt(req.query._delay ?? '', 10);
  const fail = Number.parseInt(req.query._fail ?? '', 10);

  const proceed = () => {
    if (!Number.isNaN(fail)) {
      switch (fail) {
        case 401: return next(new ApiError(401, 'UNAUTHENTICATED', 'Forced 401 via ?_fail=401'));
        case 403: return next(new ApiError(403, 'FORBIDDEN', 'Forced 403 via ?_fail=403'));
        case 404: return next(new ApiError(404, 'NOT_FOUND', 'Forced 404 via ?_fail=404'));
        case 409: return next(new ApiError(409, 'CONFLICT', 'Forced 409 via ?_fail=409'));
        case 422: return next(new ApiError(422, 'VALIDATION_FAILED', 'Forced 422 via ?_fail=422', {
          _form: 'This failure was requested with ?_fail=422',
        }));
        case 429: {
          res.set('Retry-After', '2');
          return next(new ApiError(429, 'RATE_LIMITED', 'Forced 429 via ?_fail=429'));
        }
        case 503: return next(new ApiError(503, 'UNAVAILABLE', 'Forced 503 via ?_fail=503'));
        default: return next(new ApiError(500, 'INTERNAL', `Forced ${fail || 500} via ?_fail`));
      }
    }
    return next();
  };

  if (!Number.isNaN(delay) && delay > 0) {
    setTimeout(proceed, Math.min(delay, MAX_DELAY_MS));
    return;
  }
  proceed();
}

/**
 * `/api/flaky` fails about 40% of the time. Session 5's retry-and-backoff lab
 * points at this, so participants watch TanStack Query recover on its own.
 */
export function flaky(req, res, next) {
  const rate = Math.min(Math.max(Number.parseFloat(req.query.rate ?? '0.4'), 0), 1);
  if (Math.random() < rate) {
    return next(new ApiError(503, 'FLAKY', 'The flaky endpoint failed, as advertised. Retry.'));
  }
  res.json({ ok: true, message: 'Flaky endpoint succeeded this time.', at: new Date().toISOString() });
}
