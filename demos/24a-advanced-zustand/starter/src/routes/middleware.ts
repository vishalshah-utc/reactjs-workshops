import { createContext, data, redirect, type MiddlewareFunction } from 'react-router';
import { getMe } from '../api/services/auth';
import { tokenStore } from '../lib/tokenStore';
import { logger } from '../config/logger';
import type { Role, User } from '../types';

/**
 * Typed handle for the current user. Set by authMiddleware, read by any
 * loader or action beneath it via context.get(userContext) — as `User | null`.
 *
 * NOTE: this is React Router's createContext, not React's. Same name,
 * different import, different mechanism — a typed KEY for middleware context.
 */
export const userContext = createContext<User | null>(null);

/**
 * Guards a whole route subtree. Runs before every loader and action beneath
 * it, so no child route can accidentally skip the check — including routes
 * added next year.
 */
export const authMiddleware: MiddlewareFunction = async ({ request, context }) => {
  if (!tokenStore.isAuthenticated()) {
    const url = new URL(request.url);
    throw redirect(`/login?redirectTo=${encodeURIComponent(url.pathname + url.search)}`);
  }

  let user = tokenStore.getUser();
  if (!user) {
    try {
      user = await getMe({ signal: request.signal });
      tokenStore.set({ user });
    } catch {
      // A 401 here means the token is dead AND the refresh already failed.
      tokenStore.clear();
      throw redirect('/login?expired=1');
    }
  }

  context.set(userContext, user);
};

/** Factory: a middleware that requires one of the given roles. Authentication is WHO; this is WHAT. */
export function requireRole(...allowed: Role[]): MiddlewareFunction {
  return async ({ context }) => {
    const user = context.get(userContext);
    if (!user || !allowed.includes(user.role)) {
      logger.warn(`[auth] role denied: ${user?.role ?? 'anonymous'} needs ${allowed.join('|')}`);
      throw data(
        { message: `This area needs the ${allowed.join(' or ')} role. You're signed in as ${user?.role ?? 'a guest'}.` },
        { status: 403, statusText: 'Forbidden' },
      );
    }
  };
}
