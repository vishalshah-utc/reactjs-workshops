/**
 * Hand-rolled CORS — five lines, one fewer dependency to install in a
 * WebContainer. In the bundled setup Vite proxies /api, so this only matters
 * for the hosted instance and for anyone pointing at it from a local app.
 */
export function cors(req, res, next) {
  res.set('Access-Control-Allow-Origin', req.get('origin') ?? '*');
  res.set('Vary', 'Origin');
  res.set('Access-Control-Allow-Credentials', 'true');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Expose-Headers', 'X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
}
