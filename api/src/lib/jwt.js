/**
 * Minimal HS256 JWT sign/verify built on node:crypto.
 *
 * WHY HAND-ROLLED: this is workshop infrastructure, not workshop content.
 * Dropping `jsonwebtoken` keeps the StackBlitz `npm install` smaller and
 * faster, which participants feel ten times over across ten sessions.
 *
 * IN A REAL SERVICE: use a vetted library (`jose`, `jsonwebtoken`). This
 * implementation covers exactly the subset the workshop needs — HS256,
 * `exp`, and nothing else. It has no support for `nbf`, `aud`, `iss`,
 * key rotation, or any other algorithm.
 */
import { createHmac, timingSafeEqual, randomUUID } from 'node:crypto';

const b64url = (buf) => Buffer.from(buf).toString('base64url');
const fromB64url = (str) => Buffer.from(str, 'base64url');

function signature(data, secret) {
  return createHmac('sha256', secret).update(data).digest();
}

/** @returns {string} a signed HS256 token */
export function sign(payload, secret, expiresInSeconds) {
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expiresInSeconds, jti: randomUUID() };
  const head = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const claims = b64url(JSON.stringify(body));
  const data = `${head}.${claims}`;
  return `${data}.${b64url(signature(data, secret))}`;
}

/**
 * @returns {{ok: true, payload: object} | {ok: false, reason: 'malformed'|'bad_signature'|'expired'}}
 * Never throws — callers get a reason they can map to a status code.
 */
export function verify(token, secret) {
  if (typeof token !== 'string') return { ok: false, reason: 'malformed' };
  const parts = token.split('.');
  if (parts.length !== 3) return { ok: false, reason: 'malformed' };

  const [head, claims, sig] = parts;
  const expected = signature(`${head}.${claims}`, secret);
  const actual = fromB64url(sig);
  if (actual.length !== expected.length) return { ok: false, reason: 'bad_signature' };
  if (!timingSafeEqual(actual, expected)) return { ok: false, reason: 'bad_signature' };

  let payload;
  try {
    payload = JSON.parse(fromB64url(claims).toString('utf8'));
  } catch {
    return { ok: false, reason: 'malformed' };
  }
  if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) {
    return { ok: false, reason: 'expired' };
  }
  return { ok: true, payload };
}
