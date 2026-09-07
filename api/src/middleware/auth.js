/**
 * JWT authentication with access + refresh rotation.
 *
 * The access token is short (15 min) ON PURPOSE — Session 6 Lab 2 has
 * participants build a fetch wrapper that transparently refreshes on 401,
 * and a token that expires once a day is a token you can't practise against.
 * Set ACCESS_TTL=60 to make it expire during the lab.
 */
import { sign, verify } from '../lib/jwt.js';
import { getIdx, getDb } from '../db/store.js';
import { permissionsFor, isStaff, can } from '../lib/permissions.js';
import { unauthorized, forbidden } from '../lib/errors.js';

export const ACCESS_SECRET = process.env.ACCESS_SECRET ?? 'shopcrew-dev-access-secret-change-me';
export const REFRESH_SECRET = process.env.REFRESH_SECRET ?? 'shopcrew-dev-refresh-secret-change-me';
export const ACCESS_TTL = Number(process.env.ACCESS_TTL ?? 15 * 60);
export const REFRESH_TTL = Number(process.env.REFRESH_TTL ?? 7 * 24 * 60 * 60);

export function issueTokens(user, { impersonatorId = null } = {}) {
  const accessToken = sign(
    { sub: user.id, username: user.username, roles: user.roles, imp: impersonatorId },
    ACCESS_SECRET, ACCESS_TTL,
  );
  const refreshToken = sign({ sub: user.id, typ: 'refresh' }, REFRESH_SECRET, REFRESH_TTL);
  getDb().refreshTokens.set(refreshToken, { userId: user.id, issuedAt: Date.now(), impersonatorId });
  return { accessToken, refreshToken, expiresIn: ACCESS_TTL, tokenType: 'Bearer' };
}

/** Rotation: the old refresh token is invalidated the moment a new one is issued. */
export function rotateRefresh(oldToken) {
  const db = getDb();
  const record = db.refreshTokens.get(oldToken);
  if (!record) return null;
  const result = verify(oldToken, REFRESH_SECRET);
  if (!result.ok) { db.refreshTokens.delete(oldToken); return null; }
  const user = getIdx().userById.get(record.userId);
  if (!user || !user.active) { db.refreshTokens.delete(oldToken); return null; }
  db.refreshTokens.delete(oldToken);
  return { user, tokens: issueTokens(user, { impersonatorId: record.impersonatorId }) };
}

export function revokeRefresh(token) {
  return getDb().refreshTokens.delete(token);
}

export function revokeAllForUser(userId) {
  const db = getDb();
  let n = 0;
  for (const [token, rec] of db.refreshTokens) {
    if (rec.userId === userId) { db.refreshTokens.delete(token); n += 1; }
  }
  return n;
}

/** Attaches `req.user` when a valid token is present. Never rejects. */
export function attachUser(req, _res, next) {
  const header = req.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  req.authError = null;
  if (!token) return next();

  const result = verify(token, ACCESS_SECRET);
  if (!result.ok) { req.authError = result.reason; return next(); }

  const user = getIdx().userById.get(result.payload.sub);
  if (!user || !user.active) { req.authError = 'inactive'; return next(); }

  req.user = user;
  req.impersonatorId = result.payload.imp ?? null;
  req.permissions = permissionsFor(user.roles);
  next();
}

export function requireAuth(req, _res, next) {
  if (req.user) return next();
  // The distinct code matters: the client's fetch wrapper refreshes on
  // TOKEN_EXPIRED and gives up on the others.
  if (req.authError === 'expired') return next(unauthorized('Access token expired', 'TOKEN_EXPIRED'));
  if (req.authError === 'inactive') return next(unauthorized('Account is deactivated', 'ACCOUNT_INACTIVE'));
  next(unauthorized());
}

export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) return next(unauthorized());
  if (!req.user.roles.some((r) => roles.includes(r))) {
    return next(forbidden(`Requires one of: ${roles.join(', ')}`));
  }
  next();
};

export const requirePermission = (permission) => (req, _res, next) => {
  if (!req.user) return next(unauthorized());
  if (!can(req.user.roles, permission)) return next(forbidden(`Requires permission: ${permission}`));
  next();
};

export const requireStaff = (req, _res, next) => {
  if (!req.user) return next(unauthorized());
  if (!isStaff(req.user.roles)) return next(forbidden('Staff only'));
  next();
};

/** The shape `/api/auth/me` returns. Never leaks passwordHash. */
export function publicUser(user, extra = {}) {
  return {
    id: user.id, username: user.username, email: user.email,
    firstName: user.firstName, lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`.trim(),
    phone: user.phone, avatarUrl: user.avatarUrl,
    roles: user.roles, permissions: permissionsFor(user.roles),
    isStaff: isStaff(user.roles),
    active: user.active, createdAt: user.createdAt, lastLoginAt: user.lastLoginAt,
    ...extra,
  };
}
