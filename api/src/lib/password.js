/**
 * Password hashing with node:crypto's scrypt — no native module, no
 * dependency, and fast enough in a WebContainer.
 *
 * Cost parameters are deliberately LOW (N=2^13 rather than a production
 * 2^16+) so seeding ~2,000 demo customers doesn't stall the boot inside
 * a browser tab. Never copy these parameters into a real service.
 */
import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';

const KEYLEN = 32;
const COST = { N: 8192, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export function hashPassword(plain, salt = randomBytes(16)) {
  const derived = scryptSync(plain, salt, KEYLEN, COST);
  return `scrypt$${salt.toString('base64url')}$${derived.toString('base64url')}`;
}

export function verifyPassword(plain, stored) {
  if (typeof stored !== 'string') return false;
  const [scheme, saltB64, hashB64] = stored.split('$');
  if (scheme !== 'scrypt' || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, 'base64url');
  const actual = scryptSync(plain, Buffer.from(saltB64, 'base64url'), expected.length, COST);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
