import { ApiError } from '../lib/errors.js';

export function notFoundHandler(req, _res, next) {
  next(new ApiError(404, 'NOT_FOUND', `No route matches ${req.method} ${req.path}`));
}

// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by arity
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
