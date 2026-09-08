import { ApiError } from '../lib/errors.js';

export function notFoundHandler(req, _res, next) {
  next(new ApiError(404, 'NOT_FOUND', `No route matches ${req.method} ${req.path}`));
}

// Express identifies an error handler by its arity — it MUST take four
// parameters, even though `next` is unused here. Renaming it `_next` is the
// convention that says "deliberately unused".
export function errorHandler(err, req, res, _next) {
  const status = err.status ?? 500;
  const body = {
    error: {
      code: err.code ?? 'INTERNAL',
      message: status === 500 ? 'Something went wrong on our side' : err.message,
    },
  };
  if (err.fieldErrors) body.error.fieldErrors = err.fieldErrors;
  if (status === 500) console.error('[api] unhandled', err);
  res.status(status).json(body);
}
