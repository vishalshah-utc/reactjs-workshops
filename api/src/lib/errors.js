/**
 * One error shape for the whole API:
 *
 *   { error: { code, message, fieldErrors? } }
 *
 * `fieldErrors` is the important one. A 422 that says which FIELD failed is
 * what lets Session 7 Lab 4 map server errors straight onto React Hook Form
 * fields with `setError(name, ...)`. An API that returns only a message string
 * forces every frontend into a generic red banner, which is why that lab
 * exists at all.
 */
export class ApiError extends Error {
  constructor(status, code, message, fieldErrors) {
    super(message);
    this.status = status;
    this.code = code;
    if (fieldErrors) this.fieldErrors = fieldErrors;
  }
}

export const badRequest = (msg, code = 'BAD_REQUEST') => new ApiError(400, code, msg);
export const unauthorized = (msg = 'Authentication required', code = 'UNAUTHENTICATED') => new ApiError(401, code, msg);
export const forbidden = (msg = 'You do not have permission to do that', code = 'FORBIDDEN') => new ApiError(403, code, msg);
export const notFound = (what = 'Resource') => new ApiError(404, 'NOT_FOUND', `${what} not found`);
export const conflict = (msg, code = 'CONFLICT') => new ApiError(409, code, msg);
export const unprocessable = (fieldErrors, msg = 'Some fields need your attention') =>
  new ApiError(422, 'VALIDATION_FAILED', msg, fieldErrors);

/** Tiny validation helper — collects every failure rather than throwing on the first. */
export function validate(body, rules) {
  const fieldErrors = {};
  for (const [field, checks] of Object.entries(rules)) {
    const value = body?.[field];
    for (const check of checks) {
      const problem = check(value, body);
      if (problem) { fieldErrors[field] = problem; break; }
    }
  }
  if (Object.keys(fieldErrors).length) throw unprocessable(fieldErrors);
  return body;
}

export const rules = {
  required: (label) => (v) => (v === undefined || v === null || v === '' ? `${label} is required` : null),
  minLen: (n, label) => (v) => (typeof v === 'string' && v.trim().length < n ? `${label} must be at least ${n} characters` : null),
  maxLen: (n, label) => (v) => (typeof v === 'string' && v.length > n ? `${label} must be at most ${n} characters` : null),
  email: () => (v) => (typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'Enter a valid email address'),
  int: (label) => (v) => (Number.isInteger(Number(v)) ? null : `${label} must be a whole number`),
  min: (n, label) => (v) => (Number(v) < n ? `${label} must be at least ${n}` : null),
  oneOf: (list, label) => (v) => (list.includes(v) ? null : `${label} must be one of: ${list.join(', ')}`),
  optional: (check) => (v, body) => (v === undefined || v === null || v === '' ? null : check(v, body)),
};
