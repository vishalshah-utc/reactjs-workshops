/**
 * Password hashing, with a deliberate fallback.
 *
 * WHY THIS IS MORE COMPLICATED THAN IT LOOKS:
 *
 * This API has to run in a StackBlitz WebContainer — Node compiled to
 * WebAssembly, running inside a browser tab, started with `--no-addons`.
 * Most of `node:crypto` is there, but anything that reaches a native binding
 * may not be, and it fails at CALL time rather than import time. A backend
 * that dies on the first login with an opaque stack trace is a workshop
 * derailed.
 *
 * So: try scrypt (the better KDF), and fall back to PBKDF2 (available
 * essentially everywhere) if it is missing. The chosen algorithm is recorded
 * in the hash string itself, so a hash made one way still verifies later.
 *
 * Cost parameters are deliberately LOW — this seeds thousands of demo accounts
 * inside a browser tab. Never copy these numbers into a real service.
 */
import { pbkdf2Sync, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const KEYLEN = 32;
const SCRYPT_COST = { N: 8192, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const PBKDF2_ITERATIONS = 10_000;

/**
 * Probe once, at module load, with a throwaway input. Cheaper and far more
 * predictable than discovering the gap during the first login.
 */
const SCRYPT_AVAILABLE = (() => {
  try {
    scryptSync('probe', Buffer.from('probe'), KEYLEN, SCRYPT_COST);
    return true;
  } catch (err) {
    console.warn(
      `[api] node:crypto scrypt is unavailable here (${err.code ?? err.message}). ` +
      'Falling back to PBKDF2. This is expected inside a WebContainer.',
    );
    return false;
  }
})();

export const kdf = SCRYPT_AVAILABLE ? 'scrypt' : 'pbkdf2';

function derive(plain, salt, scheme) {
  return scheme === 'scrypt'
    ? scryptSync(plain, salt, KEYLEN, SCRYPT_COST)
    : pbkdf2Sync(plain, salt, PBKDF2_ITERATIONS, KEYLEN, 'sha256');
}

export function hashPassword(plain, salt = randomBytes(16)) {
  const derived = derive(plain, salt, kdf);
  // The scheme is part of the stored value, so a hash stays verifiable even if
  // the available algorithms change underneath it.
  return `${kdf}$${salt.toString('base64url')}$${derived.toString('base64url')}`;
}

export function verifyPassword(plain, stored) {
  if (typeof stored !== 'string') return false;
  const [scheme, saltB64, hashB64] = stored.split('$');
  if (!saltB64 || !hashB64) return false;
  if (scheme !== 'scrypt' && scheme !== 'pbkdf2') return false;
  // A hash written with scrypt cannot be verified where scrypt is missing.
  if (scheme === 'scrypt' && !SCRYPT_AVAILABLE) return false;

  const expected = Buffer.from(hashB64, 'base64url');
  const actual = derive(plain, Buffer.from(saltB64, 'base64url'), scheme);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
