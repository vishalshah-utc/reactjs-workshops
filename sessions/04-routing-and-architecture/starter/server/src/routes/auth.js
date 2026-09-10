import { Router } from 'express';
import { getDb, getIdx, index, audit } from '../db/store.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { validate, rules, unauthorized, forbidden, notFound, conflict } from '../lib/errors.js';
import {
  issueTokens, rotateRefresh, revokeRefresh, revokeAllForUser,
  requireAuth, requirePermission, publicUser,
} from '../middleware/auth.js';
import { permissionsFor } from '../lib/permissions.js';

const router = Router();

router.post('/register', (req, res, next) => {
  try {
    validate(req.body, {
      email: [rules.required('Email'), rules.email()],
      password: [rules.required('Password'), rules.minLen(8, 'Password')],
      firstName: [rules.required('First name'), rules.minLen(2, 'First name')],
      lastName: [rules.optional(rules.maxLen(60, 'Last name'))],
    });
    const email = String(req.body.email).toLowerCase();
    if (getIdx().userByEmail.has(email)) {
      // 409 with a fieldError, not a bare message — S7 Lab 4 maps this
      // straight onto the email input.
      const err = conflict('That email is already registered', 'EMAIL_TAKEN');
      err.status = 422;
      err.code = 'VALIDATION_FAILED';
      err.fieldErrors = { email: 'That email is already registered' };
      throw err;
    }
    const db = getDb();
    const seq = db.users.length + 1;
    const user = {
      id: `usr_${String(seq).padStart(6, '0')}_new`,
      username: email.split('@')[0],
      email,
      passwordHash: hashPassword(req.body.password),
      roles: ['CUSTOMER'],
      firstName: req.body.firstName,
      lastName: req.body.lastName ?? '',
      phone: req.body.phone ?? '',
      avatarUrl: null,
      active: true,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    index.addUser(user);
    res.status(201).json({ user: publicUser(user), ...issueTokens(user) });
  } catch (err) { next(err); }
});

router.post('/login', (req, res, next) => {
  try {
    validate(req.body, {
      email: [rules.required('Email')],
      password: [rules.required('Password')],
    });
    const key = String(req.body.email).toLowerCase();
    const idx = getIdx();
    const user = idx.userByEmail.get(key) ?? idx.userByUsername.get(key);

    // Same message and same code for "no such user" and "wrong password" —
    // telling an attacker which emails exist is a real vulnerability.
    if (!user || !verifyPassword(req.body.password, user.passwordHash)) {
      audit(user ?? null, 'login.failed', 'user', user?.id ?? null, 'FAILURE', req);
      throw unauthorized('Email or password is incorrect', 'INVALID_CREDENTIALS');
    }
    if (!user.active) throw forbidden('This account has been deactivated', 'ACCOUNT_INACTIVE');

    user.lastLoginAt = new Date().toISOString();
    audit(user, 'login.succeeded', 'user', user.id, 'SUCCESS', req);
    res.json({ user: publicUser(user), ...issueTokens(user) });
  } catch (err) { next(err); }
});

router.post('/refresh', (req, res, next) => {
  try {
    const token = req.body?.refreshToken;
    if (!token) throw unauthorized('refreshToken is required', 'NO_REFRESH_TOKEN');
    const result = rotateRefresh(token);
    if (!result) throw unauthorized('Refresh token is invalid or expired', 'REFRESH_INVALID');
    res.json({ user: publicUser(result.user), ...result.tokens });
  } catch (err) { next(err); }
});

router.post('/logout', (req, res) => {
  if (req.body?.refreshToken) revokeRefresh(req.body.refreshToken);
  res.status(204).end();
});

/** Logout everywhere — the S6 homework on multi-tab session sync uses this. */
router.post('/logout-all', requireAuth, (req, res) => {
  const revoked = revokeAllForUser(req.user.id);
  res.json({ revoked });
});

router.get('/me', requireAuth, (req, res) => {
  const impersonator = req.impersonatorId ? getIdx().userById.get(req.impersonatorId) : null;
  res.json({
    user: publicUser(req.user, impersonator
      ? { impersonatedBy: { id: impersonator.id, name: `${impersonator.firstName} ${impersonator.lastName}`.trim() } }
      : {}),
  });
});

router.patch('/me', requireAuth, (req, res, next) => {
  try {
    validate(req.body, {
      firstName: [rules.optional(rules.minLen(2, 'First name'))],
      lastName: [rules.optional(rules.maxLen(60, 'Last name'))],
      phone: [rules.optional(rules.maxLen(20, 'Phone'))],
    });
    for (const field of ['firstName', 'lastName', 'phone', 'avatarUrl']) {
      if (req.body[field] !== undefined) req.user[field] = req.body[field];
    }
    res.json({ user: publicUser(req.user) });
  } catch (err) { next(err); }
});

router.post('/change-password', requireAuth, (req, res, next) => {
  try {
    validate(req.body, {
      currentPassword: [rules.required('Current password')],
      newPassword: [rules.required('New password'), rules.minLen(8, 'New password')],
    });
    if (!verifyPassword(req.body.currentPassword, req.user.passwordHash)) {
      throw Object.assign(new Error('Current password is incorrect'), {
        status: 422, code: 'VALIDATION_FAILED',
        fieldErrors: { currentPassword: 'Current password is incorrect' },
      });
    }
    req.user.passwordHash = hashPassword(req.body.newPassword);
    revokeAllForUser(req.user.id);
    res.json({ ok: true, ...issueTokens(req.user) });
  } catch (err) { next(err); }
});

/**
 * CSR impersonation — "view as customer". The issued token carries `imp` so
 * the UI can show a persistent "you are viewing as…" banner, and every action
 * stays attributable to the real staff member in the audit log.
 */
router.post('/impersonate/:userId', requireAuth, requirePermission('customer:impersonate'), (req, res, next) => {
  try {
    const target = getIdx().userById.get(req.params.userId);
    if (!target) throw notFound('User');
    if (target.roles.some((r) => r !== 'CUSTOMER')) throw forbidden('Only customers can be impersonated');
    audit(req.user, 'user.impersonated', 'user', target.id, 'SUCCESS', req);
    res.json({ user: publicUser(target), ...issueTokens(target, { impersonatorId: req.user.id }) });
  } catch (err) { next(err); }
});

router.get('/permissions', requireAuth, (req, res) => {
  res.json({ roles: req.user.roles, permissions: permissionsFor(req.user.roles) });
});

export default router;
